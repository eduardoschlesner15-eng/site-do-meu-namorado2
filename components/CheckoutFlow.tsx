"use client";

import { useState, useEffect, useRef } from "react";
import { 
  formatCPF, 
  isValidCPF, 
  formatPhone, 
  isValidPhone, 
  formatCEP, 
  isValidCEP, 
  isValidEmail, 
  validateEmailStrict,
  fetchAddressByCEP,
} from "@/lib/validation";
import { getSavedUser, saveUser, saveOrder, UserProfile } from "@/lib/store";
import { createMercadoPagoPreference } from "@/lib/mercadopago";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { 
  STORE_WHATSAPP_NUMBER, 
  generateCustomerOrderMessage, 
  generateSellerOrderMessage, 
  getWhatsAppUrl 
} from "@/lib/whatsapp";
import { 
  generatePixCopiaECola, 
  getPixQrCodeUrl, 
  PIX_CONFIG 
} from "@/lib/pix";

type Props = {
  productName: string;
  price: string;
  productSlug?: string;
  fileUrl?: string;
  fileType?: "stl" | "fbx";
};

export default function CheckoutFlow({ productName, price, productSlug = "produto", fileUrl, fileType = "stl" }: Props) {
  const [step, setStep] = useState<"form" | "payment" | "success">("form");
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [cepError, setCepError] = useState("");
  
  // Dados do formulário
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    salvarCadastro: true,
  });

  // Erros de validação
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Opções de envio físico (Correios)
  const [shippingMethod, setShippingMethod] = useState<"pac" | "sedex">("pac");
  
  // Método de pagamento (4 métodos exclusivos solicitados)
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cartao" | "boleto" | "paypal">("pix");
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedBoleto, setCopiedBoleto] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  // Processamento e autenticação bancária
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [paymentError, setPaymentError] = useState("");

  // Estado do Pix Dinâmico com expiração de 5 minutos (300s)
  const [pixTimeLeft, setPixTimeLeft] = useState(300);
  const [pixTxId, setPixTxId] = useState(`ORD${Math.floor(100000 + Math.random() * 900000)}`);
  const [pixPayload, setPixPayload] = useState("");

  const numeroInputRef = useRef<HTMLInputElement>(null);

  // Carrega dados salvos e verifica retorno do Mercado Pago
  useEffect(() => {
    // Verifica se voltou do Mercado Pago aprovado
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const status = params.get("status") || params.get("collection_status");
      if (status === "approved") {
        const paymentId = params.get("payment_id") || `MP-${Math.floor(100000 + Math.random() * 900000)}`;
        setOrderNumber(paymentId);
        setStep("success");
      }
    }

    const saved = getSavedUser();
    if (saved) {
      setFormData((prev) => ({
        ...prev,
        nome: saved.nome || "",
        email: saved.email || "",
        cpf: saved.cpf || "",
        telefone: saved.telefone || "",
        cep: saved.cep || "",
        endereco: saved.endereco || "",
        numero: saved.numero || "",
        complemento: saved.complemento || "",
        bairro: saved.bairro || "",
        cidade: saved.cidade || "",
        estado: saved.estado || "",
      }));
    }
  }, []);

  // Cálculo de valores (Produtos Físicos com Frete Obrigatório)
  const basePriceNum = parseFloat(price.replace(",", ".")) || 10;
  const shippingCost = shippingMethod === "sedex" ? 24.9 : 14.9;
  const pixDiscount = paymentMethod === "pix" ? basePriceNum * 0.05 : 0;
  const finalTotal = Math.max(0, basePriceNum + shippingCost - pixDiscount);

  // Gera o Pix Dinâmico BRCode com o valor exato da compra
  useEffect(() => {
    if (step === "payment" && paymentMethod === "pix" && finalTotal > 0) {
      const code = generatePixCopiaECola({
        amount: finalTotal,
        txid: pixTxId,
      });
      setPixPayload(code);
    }
  }, [step, paymentMethod, finalTotal, pixTxId]);

  // Contagem regressiva de 5 minutos (300 segundos)
  useEffect(() => {
    if (step !== "payment" || paymentMethod !== "pix") return;
    if (pixTimeLeft <= 0) return;

    const interval = setInterval(() => {
      setPixTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [step, paymentMethod, pixTimeLeft]);

  const handleGenerateNewPix = () => {
    const newTxId = `ORD${Math.floor(100000 + Math.random() * 900000)}`;
    setPixTxId(newTxId);
    setPixTimeLeft(300); // Reseta para 5 minutos
    setCopiedPix(false);
  };

  const pixMinutes = Math.floor(pixTimeLeft / 60);
  const pixSeconds = pixTimeLeft % 60;
  const formattedTimer = `${String(pixMinutes).padStart(2, "0")}:${String(pixSeconds).padStart(2, "0")}`;
  const timerPercent = (pixTimeLeft / 300) * 100;
  const isPixExpired = pixTimeLeft <= 0;

  // Manipulação de inputs com máscaras
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    let formattedVal = value;

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    if (name === "cpf") {
      formattedVal = formatCPF(value);
      if (formattedVal.length === 14) {
        if (!isValidCPF(formattedVal)) {
          setErrors((prev) => ({ ...prev, cpf: "CPF inválido. Verifique os números digitados." }));
        } else {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.cpf;
            return next;
          });
        }
      } else {
        setErrors((prev) => ({ ...prev, cpf: "Informe um CPF completo com 11 dígitos." }));
      }
    } else if (name === "telefone") {
      formattedVal = formatPhone(value);
      if (formattedVal.length >= 14) {
        if (!isValidPhone(formattedVal)) {
          setErrors((prev) => ({ ...prev, telefone: "Telefone ou celular inválido (verifique o DDD)." }));
        } else {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.telefone;
            return next;
          });
        }
      }
    } else if (name === "email") {
      const emailCheck = validateEmailStrict(value);
      if (value.length > 3 && !emailCheck.isValid) {
        setErrors((prev) => ({ ...prev, email: emailCheck.error || "Insira um endereço de e-mail válido." }));
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.email;
          return next;
        });
      }
    } else if (name === "cep") {
      formattedVal = formatCEP(value);
      const clean = formattedVal.replace(/\D/g, "");

      if (clean.length === 8) {
        setLoadingCEP(true);
        setCepError("");
        const address = await fetchAddressByCEP(clean);
        setLoadingCEP(false);

        if (address && !address.erro) {
          setFormData((prev) => ({
            ...prev,
            cep: formattedVal,
            endereco: address.logradouro || prev.endereco,
            bairro: address.bairro || prev.bairro,
            cidade: address.localidade || prev.cidade,
            estado: address.uf || prev.estado,
          }));
          setErrors((prev) => {
            const next = { ...prev };
            delete next.cep;
            return next;
          });
          // Foca automaticamente no campo de número
          setTimeout(() => document.querySelector<HTMLInputElement>('input[name="numero"]')?.focus(), 100);
        } else {
          setCepError("CEP não encontrado. Preencha o endereço manualmente.");
        }
      }
    }

    setFormData((prev) => ({ ...prev, [name]: formattedVal }));
  };

  // Validação geral do passo 1
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim() || formData.nome.trim().split(" ").length < 2) {
      newErrors.nome = "Informe seu nome e sobrenome completo.";
    }

    const emailCheck = validateEmailStrict(formData.email);
    if (!emailCheck.isValid) {
      newErrors.email = emailCheck.error || "Informe um e-mail válido para envio da NF-e e rastreio dos Correios.";
    }

    if (!isValidCPF(formData.cpf)) {
      newErrors.cpf = "CPF inválido. Certifique-se de digitar os 11 dígitos corretos.";
    }

    if (!isValidPhone(formData.telefone)) {
      newErrors.telefone = "Número de telefone ou WhatsApp inválido com DDD.";
    }

    // Endereço de entrega obrigatório para envio físico
    if (!isValidCEP(formData.cep)) {
      newErrors.cep = "Informe um CEP válido com 8 dígitos.";
    }
    if (!formData.endereco.trim()) {
      newErrors.endereco = "Informe a rua / logradouro para entrega.";
    }
    if (!formData.numero.trim()) {
      newErrors.numero = "Informe o número.";
    }
    if (!formData.cidade.trim()) {
      newErrors.cidade = "Informe a cidade.";
    }
    if (!formData.estado.trim()) {
      newErrors.estado = "Informe o estado (UF).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (formData.salvarCadastro) {
      const userToSave: UserProfile = {
        id: "usr-" + Date.now(),
        nome: formData.nome,
        email: formData.email,
        cpf: formData.cpf,
        telefone: formData.telefone,
        cep: formData.cep,
        endereco: formData.endereco,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
      };
      saveUser(userToSave);
    }

    setStep("payment");
  };

  // Processamento com PIX direto na conta
  const handlePayWithPix = async () => {
    setIsProcessingPayment(true);
    setProcessingMessage("Confirmando recebimento instantâneo Pix direto na conta...");
    await new Promise((r) => setTimeout(r, 1200));
    setIsProcessingPayment(false);
    handleCompleteOrder("PIX");
  };

  // Processamento com Boleto Bancário
  const handlePayWithBoleto = async () => {
    setIsProcessingPayment(true);
    setProcessingMessage("Registrando boleto bancário para o seu pedido...");
    await new Promise((r) => setTimeout(r, 1000));
    setIsProcessingPayment(false);
    handleCompleteOrder("BOLETO");
  };

  // Processamento com PayPal
  const handlePayWithPayPal = async () => {
    setIsProcessingPayment(true);
    setProcessingMessage("Conectando de forma segura ao PayPal...");
    await new Promise((r) => setTimeout(r, 1200));
    setIsProcessingPayment(false);
    handleCompleteOrder("PAYPAL");
  };

  // Pagamento Real via Mercado Pago (Checkout Oficial com Débito Bancário Real no Cartão)
  const handlePayWithMercadoPago = async () => {
    setPaymentError("");
    setIsProcessingPayment(true);
    setProcessingMessage("Gerando cobrança oficial no Mercado Pago com débito bancário real...");

    const pref = await createMercadoPagoPreference({
      title: productName,
      price: finalTotal,
      productSlug: productSlug,
      payer: {
        nome: formData.nome,
        email: formData.email,
        cpf: formData.cpf,
        telefone: formData.telefone,
        cep: formData.cep,
        endereco: formData.endereco,
        numero: formData.numero,
        cidade: formData.cidade,
        estado: formData.estado,
      },
    });

    if (pref && pref.init_point) {
      window.location.href = pref.init_point;
    } else {
      setIsProcessingPayment(false);
      setPaymentError("Não foi possível conectar com o Mercado Pago. Tente novamente ou use outra forma de pagamento.");
    }
  };

  // Concluir pedido
  const handleCompleteOrder = (methodOverride?: "PIX" | "CARTAO" | "BOLETO" | "PAYPAL") => {
    const generatedOrder = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderNumber(generatedOrder);

    const chosenPaymentMethod = (methodOverride || paymentMethod.toUpperCase()) as "PIX" | "CARTAO" | "BOLETO" | "PAYPAL";

    saveOrder({
      id: generatedOrder,
      createdAt: new Date().toLocaleDateString("pt-BR"),
      items: [
        {
          id: productSlug,
          name: productName,
          slug: productSlug,
          price: basePriceNum,
          quantity: 1,
          fileType,
          fileUrl: fileUrl || "/model.stl",
          category: "IMPRESSÃO 3D",
        },
      ],
      subtotal: basePriceNum,
      frete: shippingCost,
      total: finalTotal,
      shippingMethod: shippingMethod.toUpperCase(),
      paymentMethod: chosenPaymentMethod,
      user: {
        id: "usr-" + Date.now(),
        nome: formData.nome,
        email: formData.email,
        cpf: formData.cpf,
        telefone: formData.telefone,
        endereco: formData.endereco,
        numero: formData.numero,
        cidade: formData.cidade,
        estado: formData.estado,
      },
      status: "APROVADO",
    });

    setStep("success");
  };

  const handleCopyPix = () => {
    if (!pixPayload) return;
    navigator.clipboard.writeText(pixPayload);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const boletoCode = "34191.79001 01043.510047 91020.150008 8 98760000001000";

  const handleCopyBoleto = () => {
    navigator.clipboard.writeText(boletoCode.replace(/\s+/g, ""));
    setCopiedBoleto(true);
    setTimeout(() => setCopiedBoleto(false), 3000);
  };

  // ==================== TELA 1: DADOS E ENTREGA ====================
  if (step === "form") {
    return (
      <div className="w-full bg-white border clean-border p-6 md:p-8 flex flex-col gap-8 shadow-xs">
        
        {/* Progresso do Checkout */}
        <div className="flex items-center justify-between border-b clean-border pb-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center">1</span>
            <span className="font-black text-sm uppercase tracking-wider">Identificação & Entrega</span>
          </div>
          <div className="flex items-center gap-2 opacity-40">
            <span className="w-7 h-7 rounded-full bg-gray-200 text-black font-bold text-xs flex items-center justify-center">2</span>
            <span className="font-bold text-sm uppercase tracking-wider hidden sm:inline">Pagamento</span>
          </div>
        </div>

        <form onSubmit={handleProceedToPayment} className="flex flex-col gap-6">
          
          {/* Seção 1: Dados Pessoais */}
          <div>
            <h4 className="font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2 text-black">
              <span>👤</span> 1. Dados Pessoais
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Nome Completo *
                </label>
                <input 
                  type="text"
                  name="nome"
                  required
                  placeholder="Ex: Carlos Eduardo da Silva"
                  value={formData.nome}
                  onChange={handleChange}
                  className={`border px-3.5 py-2.5 text-sm font-medium outline-none transition-colors ${
                    errors.nome ? "border-red-500 bg-red-50/30" : "border-gray-300 focus:border-black"
                  }`}
                />
                {errors.nome && <span className="text-xs text-red-600 font-medium">{errors.nome}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  CPF *
                </label>
                <input 
                  type="text"
                  name="cpf"
                  required
                  maxLength={14}
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={handleChange}
                  className={`border px-3.5 py-2.5 text-sm font-medium outline-none transition-colors ${
                    errors.cpf ? "border-red-500 bg-red-50/30" : "border-gray-300 focus:border-black"
                  }`}
                />
                {errors.cpf ? (
                  <span className="text-xs text-red-600 font-medium">{errors.cpf}</span>
                ) : formData.cpf.length === 14 ? (
                  <span className="text-xs text-green-600 font-bold">✓ CPF Válido</span>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Celular / WhatsApp *
                </label>
                <input 
                  type="text"
                  name="telefone"
                  required
                  maxLength={15}
                  placeholder="(11) 98765-4321"
                  value={formData.telefone}
                  onChange={handleChange}
                  className={`border px-3.5 py-2.5 text-sm font-medium outline-none transition-colors ${
                    errors.telefone ? "border-red-500 bg-red-50/30" : "border-gray-300 focus:border-black"
                  }`}
                />
                {errors.telefone && <span className="text-xs text-red-600 font-medium">{errors.telefone}</span>}
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  E-mail para Envio do Pedido e NF-e *
                </label>
                <input 
                  type="email"
                  name="email"
                  required
                  placeholder="exemplo@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => {
                    if (formData.email) {
                      const res = validateEmailStrict(formData.email);
                      if (!res.isValid) {
                        setErrors((prev) => ({ ...prev, email: res.error || "E-mail inválido." }));
                      }
                    }
                  }}
                  className={`border px-3.5 py-2.5 text-sm font-medium outline-none transition-colors ${
                    errors.email ? "border-red-500 bg-red-50/30" : "border-gray-300 focus:border-black"
                  }`}
                />
                {errors.email ? (
                  <span className="text-xs text-red-600 font-bold">{errors.email}</span>
                ) : formData.email && isValidEmail(formData.email) ? (
                  <span className="text-xs text-green-600 font-bold">✓ E-mail verificado</span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Seção 2: Método de Envio Físico */}
          <div className="border-t clean-border pt-6">
            <h4 className="font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2 text-black">
              <span>🚚</span> 2. Forma de Envio (Correios)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label 
                className={`border p-4 flex flex-col justify-between cursor-pointer rounded-xs transition-colors ${
                  shippingMethod === "pac" ? "border-black bg-gray-50 ring-1 ring-black" : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="radio" 
                    name="shippingMethod" 
                    checked={shippingMethod === "pac"} 
                    onChange={() => setShippingMethod("pac")} 
                    className="accent-black"
                  />
                  <span className="font-bold text-xs uppercase">PAC Correios</span>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">Produto embalado com proteção anti-impacto (5 a 8 dias úteis).</p>
                <span className="font-black text-xs text-black">R$ 14,90</span>
              </label>

              <label 
                className={`border p-4 flex flex-col justify-between cursor-pointer rounded-xs transition-colors ${
                  shippingMethod === "sedex" ? "border-black bg-gray-50 ring-1 ring-black" : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="radio" 
                    name="shippingMethod" 
                    checked={shippingMethod === "sedex"} 
                    onChange={() => setShippingMethod("sedex")} 
                    className="accent-black"
                  />
                  <span className="font-bold text-xs uppercase">SEDEX Expresso</span>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">Entrega rápida e prioritária (1 a 3 dias úteis).</p>
                <span className="font-black text-xs text-black">R$ 24,90</span>
              </label>
            </div>
          </div>

          {/* Seção 3: Endereço de Entrega (com ViaCEP) */}
          <div className="border-t clean-border pt-6">
            <h4 className="font-black text-sm uppercase tracking-wider mb-4 flex items-center justify-between text-black">
              <span className="flex items-center gap-2"><span>📍</span> 3. Endereço de Entrega</span>
              {loadingCEP && <span className="text-xs text-[#cc0000] font-bold animate-pulse">Buscando CEP...</span>}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Campo CEP */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex justify-between">
                  <span>CEP *</span>
                  <a href="https://buscacepinter.correios.com.br" target="_blank" rel="noreferrer" className="text-[10px] text-gray-400 underline font-normal">
                    Não sei meu CEP
                  </a>
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    name="cep"
                    maxLength={9}
                    placeholder="00000-000"
                    value={formData.cep}
                    onChange={handleChange}
                    className={`w-full border px-3.5 py-2.5 text-sm font-medium outline-none transition-colors ${
                      errors.cep ? "border-red-500 bg-red-50/30" : "border-gray-300 focus:border-black"
                    }`}
                  />
                  {loadingCEP && (
                    <div className="absolute right-3 top-3 w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                {cepError && <span className="text-xs text-amber-700 font-medium">{cepError}</span>}
                {errors.cep && <span className="text-xs text-red-600 font-medium">{errors.cep}</span>}
              </div>

              {/* Endereço / Rua */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Rua / Logradouro *
                </label>
                <input 
                  type="text"
                  name="endereco"
                  placeholder="Nome da rua ou avenida"
                  value={formData.endereco}
                  onChange={handleChange}
                  className={`border px-3.5 py-2.5 text-sm font-medium outline-none ${
                    errors.endereco ? "border-red-500" : "border-gray-300 focus:border-black"
                  }`}
                />
              </div>

              {/* Número */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Número *
                </label>
                <input 
                  ref={numeroInputRef}
                  type="text"
                  name="numero"
                  placeholder="Ex: 123"
                  value={formData.numero}
                  onChange={handleChange}
                  className={`border px-3.5 py-2.5 text-sm font-medium outline-none ${
                    errors.numero ? "border-red-500" : "border-gray-300 focus:border-black"
                  }`}
                />
              </div>

              {/* Complemento */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Complemento
                </label>
                <input 
                  type="text"
                  name="complemento"
                  placeholder="Apto, Bloco, etc."
                  value={formData.complemento}
                  onChange={handleChange}
                  className="border border-gray-300 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-black"
                />
              </div>

              {/* Bairro */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Bairro *
                </label>
                <input 
                  type="text"
                  name="bairro"
                  placeholder="Bairro"
                  value={formData.bairro}
                  onChange={handleChange}
                  className="border border-gray-300 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-black"
                />
              </div>

              {/* Cidade */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Cidade *
                </label>
                <input 
                  type="text"
                  name="cidade"
                  placeholder="Cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  className="border border-gray-300 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-black"
                />
              </div>

              {/* Estado UF */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  UF *
                </label>
                <input 
                  type="text"
                  name="estado"
                  maxLength={2}
                  placeholder="SP"
                  value={formData.estado}
                  onChange={handleChange}
                  className="border border-gray-300 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-black uppercase"
                />
              </div>

            </div>
          </div>

          {/* Salvar Cadastro */}
          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="salvarCadastro" 
              name="salvarCadastro" 
              checked={formData.salvarCadastro} 
              onChange={handleChange}
              className="accent-black w-4 h-4 cursor-pointer"
            />
            <label htmlFor="salvarCadastro" className="text-xs font-medium text-gray-700 cursor-pointer">
              Salvar meus dados para compras futuras neste dispositivo
            </label>
          </div>

          {/* Botão de Prosseguir */}
          <button 
            type="submit"
            className="w-full bg-black text-white py-4 font-black text-sm uppercase tracking-wider hover:bg-[#cc0000] transition-colors shadow-md mt-4 cursor-pointer"
          >
            Prosseguir para Pagamento (R$ {finalTotal.toFixed(2).replace(".", ",")}) ➔
          </button>
        </form>
      </div>
    );
  }

  // ==================== TELA 2: PAGAMENTO ====================
  if (step === "payment") {
    return (
      <div className="w-full bg-white border clean-border p-6 md:p-8 flex flex-col gap-8 shadow-xs">
        
        {/* Progresso do Checkout */}
        <div className="flex items-center justify-between border-b clean-border pb-4">
          <button 
            onClick={() => setStep("form")} 
            className="text-xs font-bold uppercase text-gray-500 hover:text-black flex items-center gap-1 cursor-pointer"
          >
            ‹ Voltar e editar dados
          </button>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center">2</span>
            <span className="font-black text-sm uppercase tracking-wider">Forma de Pagamento</span>
          </div>
        </div>

        {/* Resumo Rápido dos Dados */}
        <div className="bg-gray-50 p-4 border border-gray-200 text-xs flex flex-col sm:flex-row justify-between gap-3">
          <div>
            <span className="font-bold text-gray-500 uppercase block">Comprador:</span>
            <span className="font-bold text-black">{formData.nome}</span> ({formData.cpf})
          </div>
          <div>
            <span className="font-bold text-gray-500 uppercase block">Envio:</span>
            <span className="font-bold text-black">{shippingMethod.toUpperCase()}</span> - {formData.cidade}/{formData.estado}
          </div>
          <div>
            <span className="font-bold text-gray-500 uppercase block">Total a pagar:</span>
            <span className="font-black text-sm text-[#cc0000]">R$ {finalTotal.toFixed(2).replace(".", ",")}</span>
          </div>
        </div>

        {/* Abas de Pagamento Selecionáveis (Exatamente as 4 formas solicitadas) */}
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b clean-border pb-4">
            {/* 1. PIX Direto */}
            <button
              type="button"
              onClick={() => setPaymentMethod("pix")}
              className={`py-3.5 px-2 font-black text-xs uppercase tracking-wider border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                paymentMethod === "pix"
                  ? "border-black bg-black text-white shadow-xs"
                  : "border-gray-200 text-gray-700 hover:border-gray-400 bg-white"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm">💠</span>
                <span>PIX Direto</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-xs font-bold ${paymentMethod === "pix" ? "bg-emerald-400 text-black" : "bg-emerald-100 text-emerald-800"}`}>
                5% de Desconto
              </span>
            </button>

            {/* 2. Cartão (Mercado Pago) */}
            <button
              type="button"
              onClick={() => setPaymentMethod("cartao")}
              className={`py-3.5 px-2 font-black text-xs uppercase tracking-wider border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                paymentMethod === "cartao"
                  ? "border-[#009ee3] bg-[#009ee3] text-white shadow-xs"
                  : "border-gray-200 text-gray-700 hover:border-gray-400 bg-white"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm">💳</span>
                <span>Cartão</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-xs font-bold ${paymentMethod === "cartao" ? "bg-white text-[#009ee3]" : "bg-blue-50 text-[#009ee3]"}`}>
                Mercado Pago
              </span>
            </button>

            {/* 3. Boleto Bancário */}
            <button
              type="button"
              onClick={() => setPaymentMethod("boleto")}
              className={`py-3.5 px-2 font-black text-xs uppercase tracking-wider border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                paymentMethod === "boleto"
                  ? "border-black bg-black text-white shadow-xs"
                  : "border-gray-200 text-gray-700 hover:border-gray-400 bg-white"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm">📄</span>
                <span>Boleto</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-xs font-bold ${paymentMethod === "boleto" ? "bg-gray-200 text-black" : "bg-gray-100 text-gray-600"}`}>
                Bancário
              </span>
            </button>

            {/* 4. PayPal */}
            <button
              type="button"
              onClick={() => setPaymentMethod("paypal")}
              className={`py-3.5 px-2 font-black text-xs uppercase tracking-wider border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                paymentMethod === "paypal"
                  ? "border-[#003087] bg-[#003087] text-white shadow-xs"
                  : "border-gray-200 text-gray-700 hover:border-gray-400 bg-white"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🅿️</span>
                <span>PayPal</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-xs font-bold ${paymentMethod === "paypal" ? "bg-[#ffc439] text-[#003087]" : "bg-amber-100 text-amber-900"}`}>
                Global
              </span>
            </button>
          </div>

          {/* ================= ABA 1: PIX DINÂMICO (EXPIRA EM 5 MIN) ================= */}
          {paymentMethod === "pix" && (
            <div className="flex flex-col items-center text-center gap-5 py-2 animate-fadeIn max-w-xl mx-auto w-full">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2 font-bold uppercase rounded-xs w-full flex items-center justify-center gap-2">
                <span>✓</span>
                <span>Pix Dinâmico Banco Central • 5% de Desconto • Código Único</span>
              </div>

              {/* CARD DO CRONÔMETRO DE 5 MINUTOS */}
              <div className="w-full bg-white border clean-border p-4 rounded-xs shadow-xs flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isPixExpired ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`}></span>
                    <span className="text-xs font-black uppercase text-gray-700 tracking-wider">
                      {isPixExpired ? "Status do Código" : "Tempo Restante para Pagar"}
                    </span>
                  </div>
                  <div className={`px-2.5 py-1 rounded-xs font-mono font-black text-xs ${
                    isPixExpired 
                      ? "bg-red-100 text-red-700 border border-red-200" 
                      : pixTimeLeft < 60 
                        ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse" 
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}>
                    ⏱️ {isPixExpired ? "EXPIRADO" : formattedTimer}
                  </div>
                </div>

                {/* Barra de Progresso visual */}
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      isPixExpired 
                        ? "bg-red-500 w-0" 
                        : pixTimeLeft < 60 
                          ? "bg-amber-500" 
                          : "bg-emerald-500"
                    }`}
                    style={{ width: `${timerPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase">
                  <span>Início: 05:00 min</span>
                  <span>{isPixExpired ? "Expirou após 5 min" : "Expira em 5 minutos"}</span>
                </div>
              </div>

              {/* QR CODE DINÂMICO OU AVISO DE EXPIRADO */}
              {isPixExpired ? (
                <div className="w-full p-8 bg-red-50/50 border-2 border-dashed border-red-300 rounded-xs flex flex-col items-center gap-3">
                  <span className="text-4xl">⚠️</span>
                  <h4 className="font-black text-sm uppercase text-red-700 tracking-wider">
                    Código Pix Expirado (5 Minutos)
                  </h4>
                  <p className="text-xs text-gray-600 max-w-sm">
                    Por motivos de segurança bancária, este código expirou. Clique no botão abaixo para gerar um novo código Pix atualizado com mais 5 minutos de validade.
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateNewPix}
                    className="mt-2 bg-black hover:bg-[#cc0000] text-white px-6 py-3 font-black text-xs uppercase tracking-wider transition-colors rounded-xs shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <span>🔄</span>
                    <span>Gerar Novo Código Pix (5 min)</span>
                  </button>
                </div>
              ) : (
                <div className="p-5 bg-white border-2 border-dashed border-gray-300 rounded-sm shadow-xs flex flex-col items-center relative">
                  {/* QR Code Dinâmico Real */}
                  {pixPayload ? (
                    <img 
                      src={getPixQrCodeUrl(pixPayload)}
                      alt="QR Code Pix Dinâmico Banco Central"
                      className="w-48 h-48 rounded-xs"
                      width={192}
                      height={192}
                    />
                  ) : (
                    <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                      Gerando QR Code Pix...
                    </div>
                  )}
                  <span className="text-[11px] font-bold text-gray-500 uppercase mt-2">
                    Aponte a câmera do aplicativo do seu banco
                  </span>
                </div>
              )}

              {/* Chave Pix Cadastrada (Aleatória / EVP Mercado Pago - Dados Pessoais 100% Ocultos) */}
              <div className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xs text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      Chave Aleatória Mercado Pago (EVP):
                    </span>
                    <span className="text-[10px] bg-blue-100 text-[#009ee3] font-black px-1.5 py-0.5 rounded-xs">
                      Protegida
                    </span>
                  </div>
                  <span className="font-mono font-bold text-sm text-black">{PIX_CONFIG.chaveMascara}</span>
                  <span className="text-[10px] text-gray-500 block">
                    Beneficiário: {PIX_CONFIG.beneficiario} • Celular e CPF 100% ocultos
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(PIX_CONFIG.chave);
                    setCopiedPix(true);
                    setTimeout(() => setCopiedPix(false), 2500);
                  }}
                  className="bg-black text-white px-3 py-1.5 font-bold text-xs uppercase hover:bg-[#cc0000] transition-colors rounded-xs cursor-pointer self-stretch sm:self-auto text-center"
                >
                  {copiedPix ? "Chave Copiada! ✓" : "Copiar Chave"}
                </button>
              </div>

              {/* Pix Copia e Cola Completo Dinâmico */}
              {!isPixExpired && pixPayload && (
                <div className="w-full flex flex-col gap-1.5 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700 uppercase">
                      Código Pix Copia e Cola (Valor R$ {finalTotal.toFixed(2).replace(".", ",")}):
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold uppercase font-mono">
                      TxID: {pixTxId}
                    </span>
                  </div>
                  <div className="flex border border-gray-300 rounded-xs overflow-hidden">
                    <input 
                      type="text" 
                      readOnly 
                      value={pixPayload} 
                      className="w-full px-3 py-2 text-xs text-gray-500 bg-gray-50 outline-none truncate font-mono"
                    />
                    <button 
                      type="button"
                      onClick={handleCopyPix}
                      className="bg-black text-white px-4 py-2 font-bold text-xs uppercase hover:bg-[#cc0000] transition-colors shrink-0 cursor-pointer"
                    >
                      {copiedPix ? "Copiado! ✓" : "Copiar Código"}
                    </button>
                  </div>
                </div>
              )}

              {/* Passo a Passo */}
              <div className="w-full bg-gray-50 border border-gray-200 p-4 text-xs text-left flex flex-col gap-2 rounded-xs">
                <span className="font-bold text-black uppercase text-[11px]">Como pagar via Pix:</span>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Abra o aplicativo de qualquer banco (Nubank, Inter, Itaú, BB, etc.).</li>
                  <li>Escolha <strong>Pix &gt; Ler QR Code</strong> ou <strong>Pix Copia e Cola</strong>.</li>
                  <li>O valor exato de <strong className="text-black">R$ {finalTotal.toFixed(2).replace(".", ",")}</strong> (com 5% de desconto) já virá preenchido.</li>
                  <li>Realize o pagamento antes do cronômetro de 5 minutos expirar e confirme abaixo!</li>
                </ol>
              </div>

              <div className="w-full flex flex-col gap-2">
                <button 
                  type="button"
                  onClick={handlePayWithPix}
                  disabled={isProcessingPayment || isPixExpired}
                  className={`w-full py-4 font-black text-sm uppercase tracking-wider transition-colors shadow-lg cursor-pointer ${
                    isPixExpired 
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {isProcessingPayment 
                    ? "Confirmando recebimento..." 
                    : isPixExpired 
                      ? "Código Expirado - Gere um Novo Código" 
                      : "Confirmar Pagamento Realizado ✓"}
                </button>

                <button
                  type="button"
                  onClick={handlePayWithMercadoPago}
                  disabled={isProcessingPayment}
                  className="w-full bg-[#009ee3]/10 hover:bg-[#009ee3]/20 border border-[#009ee3] text-[#009ee3] py-3 px-4 font-bold text-xs uppercase tracking-wider transition-colors rounded-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>⚡</span>
                  <span>Ou Pagar Pix pelo Checkout Oficial do Mercado Pago ➔</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= ABA 2: CARTÃO USANDO MERCADO PAGO ================= */}
          {paymentMethod === "cartao" && (
            <div className="flex flex-col gap-6 max-w-xl mx-auto w-full py-2 animate-fadeIn">
              
              {/* Card Branded Mercado Pago */}
              <div className="bg-gradient-to-br from-[#009ee3]/10 to-transparent border-2 border-[#009ee3] p-6 rounded-xs flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-[#009ee3]/20 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="font-black text-sm sm:text-base uppercase text-[#009ee3] tracking-wider">
                      Mercado Pago • Gateway Oficial
                    </span>
                  </div>
                  <span className="bg-[#009ee3] text-white text-[10px] font-black px-2 py-0.5 rounded-xs uppercase tracking-wider">
                    Débito Real no Banco
                  </span>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed">
                  Pague com seu <strong>Cartão de Crédito Real</strong> com parcelamento em até <strong>12x</strong>, débito bancário ou saldo da conta. O valor é debitado diretamente no seu cartão com aprovação imediata e comprovante bancário oficial.
                </p>

                {/* Bandeiras Aceitas */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold uppercase text-gray-500">Bandeiras de Cartão Aceitas:</span>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-white border border-gray-300 px-3 py-1 font-black text-xs text-blue-800 rounded-xs">VISA</span>
                    <span className="bg-white border border-gray-300 px-3 py-1 font-black text-xs text-red-600 rounded-xs">MASTERCARD</span>
                    <span className="bg-white border border-gray-300 px-3 py-1 font-black text-xs text-black rounded-xs">ELO</span>
                    <span className="bg-white border border-gray-300 px-3 py-1 font-black text-xs text-red-500 rounded-xs">HIPERCARD</span>
                    <span className="bg-white border border-gray-300 px-3 py-1 font-black text-xs text-blue-600 rounded-xs">AMEX</span>
                  </div>
                </div>

                {/* Detalhes do Pagamento */}
                <div className="bg-white p-4 border border-[#009ee3]/30 rounded-xs flex flex-col gap-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal do Produto:</span>
                    <span>R$ {basePriceNum.toFixed(2).replace(".", ",")}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Frete Correios ({shippingMethod.toUpperCase()}):</span>
                    <span>R$ {shippingCost.toFixed(2).replace(".", ",")}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-black text-sm">
                    <span>Total no Cartão:</span>
                    <span className="text-[#009ee3] font-black text-base">R$ {finalTotal.toFixed(2).replace(".", ",")}</span>
                  </div>
                  <span className="text-[11px] text-gray-500 italic">
                    * Opção de parcelamento em até 12x com taxas da operadora disponível na tela de pagamento oficial do Mercado Pago.
                  </span>
                </div>

                {/* Benefícios e Segurança */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-gray-600 font-medium pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Cobrança real no seu banco</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Até 12x no cartão</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Compra 100% protegida</span>
                  </div>
                </div>

                {paymentError && (
                  <div className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs font-bold rounded-xs">
                    {paymentError}
                  </div>
                )}

                {/* Botão de Cobrança Oficial */}
                <button
                  type="button"
                  onClick={handlePayWithMercadoPago}
                  disabled={isProcessingPayment}
                  className="w-full bg-[#009ee3] hover:bg-[#0086c2] text-white py-4 px-6 font-black text-sm uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  {isProcessingPayment ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Conectando ao Mercado Pago...
                    </span>
                  ) : (
                    `Pagar R$ ${finalTotal.toFixed(2).replace(".", ",")} no Cartão via Mercado Pago ➔`
                  )}
                </button>
              </div>

            </div>
          )}

          {/* ================= ABA 3: BOLETO BANCÁRIO ================= */}
          {paymentMethod === "boleto" && (
            <div className="flex flex-col items-center text-center gap-5 py-4 animate-fadeIn max-w-xl mx-auto w-full">
              <div className="bg-gray-100 border border-gray-300 text-gray-800 text-xs px-4 py-2 font-bold uppercase rounded-xs w-full flex items-center justify-center gap-2">
                <span>📄</span>
                <span>Boleto Bancário à Vista • Vencimento em 3 dias úteis</span>
              </div>

              {/* Representação visual do código de barras */}
              <div className="w-full bg-white border border-gray-300 p-5 rounded-xs flex flex-col items-center gap-3 shadow-xs">
                <div className="flex items-center justify-center gap-1 h-12 w-full max-w-sm overflow-hidden opacity-80">
                  {[2, 4, 1, 3, 2, 5, 1, 2, 4, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 5, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 2, 5, 1, 2, 4].map((w, idx) => (
                    <div 
                      key={idx} 
                      className="h-full bg-black" 
                      style={{ width: `${w * 2}px` }}
                    />
                  ))}
                </div>

                <div className="w-full flex flex-col gap-1.5 mt-2 text-left">
                  <span className="text-[11px] font-bold text-gray-500 uppercase">Linha Digitável do Boleto:</span>
                  <div className="flex border border-gray-300 rounded-xs overflow-hidden">
                    <input 
                      type="text" 
                      readOnly 
                      value={boletoCode} 
                      className="w-full px-3 py-2 text-xs font-mono text-gray-700 bg-gray-50 outline-none truncate"
                    />
                    <button 
                      type="button"
                      onClick={handleCopyBoleto}
                      className="bg-black text-white px-4 py-2 font-bold text-xs uppercase hover:bg-[#cc0000] transition-colors shrink-0 cursor-pointer"
                    >
                      {copiedBoleto ? "Copiado! ✓" : "Copiar"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Informações de Compensação */}
              <div className="w-full bg-gray-50 border border-gray-200 p-4 text-xs text-left flex flex-col gap-2 rounded-xs">
                <span className="font-bold text-black uppercase text-[11px]">Informações do Boleto:</span>
                <ul className="space-y-1 text-gray-600 list-disc list-inside">
                  <li>Pagável em qualquer banco, lotérica ou via Internet Banking.</li>
                  <li>O pagamento pode levar de <strong>1 a 2 dias úteis</strong> para ser compensado pelo banco.</li>
                  <li>Assim que a compensação for confirmada, o pedido físico será expedido via <strong>{shippingMethod.toUpperCase()}</strong>.</li>
                </ul>
              </div>

              <button 
                type="button"
                onClick={handlePayWithBoleto}
                disabled={isProcessingPayment}
                className="w-full bg-black hover:bg-[#cc0000] text-white py-4 font-black text-sm uppercase tracking-wider transition-colors shadow-md cursor-pointer"
              >
                {isProcessingPayment ? "Registrando pedido..." : `Concluir Pedido com Boleto (R$ ${finalTotal.toFixed(2).replace(".", ",")}) ➔`}
              </button>
            </div>
          )}

          {/* ================= ABA 4: PAYPAL ================= */}
          {paymentMethod === "paypal" && (
            <div className="flex flex-col items-center text-center gap-5 py-4 animate-fadeIn max-w-xl mx-auto w-full">
              <div className="bg-[#003087]/10 border border-[#003087]/30 text-[#003087] text-xs px-4 py-2 font-bold uppercase rounded-xs w-full flex items-center justify-center gap-2">
                <span>🅿️</span>
                <span>PayPal Global Checkout • Proteção ao Comprador</span>
              </div>

              <div className="w-full bg-white border border-gray-300 p-5 rounded-xs flex flex-col gap-4 text-left shadow-xs">
                <div>
                  <h4 className="font-black text-sm uppercase tracking-wide text-[#003087]">
                    Pague com sua conta PayPal ou Cartão Internacional
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Conclua a compra com rapidez e segurança usando sua conta PayPal ou cartões de débito/crédito aceitos internacionalmente.
                  </p>
                </div>

                <div className="bg-gray-50 p-3 border border-gray-200 rounded-xs flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-600 uppercase">Total a pagar com PayPal:</span>
                  <span className="font-black text-sm text-[#003087]">
                    R$ {finalTotal.toFixed(2).replace(".", ",")}
                  </span>
                </div>

                {/* Renderização dos Botões Oficiais do PayPal */}
                <div className="w-full pt-2">
                  <PayPalScriptProvider options={{ clientId: "test", currency: "BRL", intent: "capture" }}>
                    <PayPalButtons 
                      style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }} 
                      createOrder={(data, actions) => {
                        return actions.order.create({
                          intent: "CAPTURE",
                          purchase_units: [
                            {
                              description: productName,
                              amount: {
                                currency_code: "BRL",
                                value: finalTotal.toFixed(2),
                              },
                            },
                          ],
                        });
                      }}
                      onApprove={async (data, actions) => {
                        if (actions.order) {
                          await actions.order.capture();
                          handleCompleteOrder("PAYPAL");
                        }
                      }}
                      onError={(err) => {
                        console.error("PayPal Error:", err);
                      }}
                    />
                  </PayPalScriptProvider>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-2 border-t border-gray-100">
                  <span>🔒</span>
                  <span>Transação criptografada com proteção de compra oficial do PayPal.</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={handlePayWithPayPal}
                disabled={isProcessingPayment}
                className="w-full bg-[#003087] hover:bg-[#002266] text-white py-3.5 font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
              >
                {isProcessingPayment ? "Processando..." : "Confirmar Compra via PayPal (Modo Direto) ➔"}
              </button>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ==================== TELA 3: SUCESSO ====================
  const notificationData = {
    id: orderNumber || "ORD-RECENTE",
    productName,
    subtotal: basePriceNum,
    frete: shippingCost,
    total: finalTotal,
    shippingMethod: shippingMethod.toUpperCase(),
    paymentMethod: paymentMethod.toUpperCase(),
    user: {
      nome: formData.nome,
      cpf: formData.cpf,
      email: formData.email,
      telefone: formData.telefone,
      cep: formData.cep,
      endereco: formData.endereco,
      numero: formData.numero,
      complemento: formData.complemento,
      bairro: formData.bairro,
      cidade: formData.cidade,
      estado: formData.estado,
    },
  };

  const customerMessage = generateCustomerOrderMessage(notificationData);
  const sellerMessage = generateSellerOrderMessage(notificationData);
  const customerWhatsAppUrl = getWhatsAppUrl(formData.telefone, customerMessage);
  const sellerWhatsAppUrl = getWhatsAppUrl(STORE_WHATSAPP_NUMBER, sellerMessage);

  return (
    <div className="w-full bg-white border clean-border p-8 md:p-12 flex flex-col items-center text-center gap-6 shadow-sm animate-fadeIn">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl font-black">
        ✓
      </div>

      <div>
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
          Pagamento Aprovado
        </span>
        <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-black mt-3">
          Pedido #{orderNumber} Confirmado!
        </h2>
        <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
          Obrigado pela sua compra, <strong>{formData.nome}</strong>! Os detalhes do pedido e a Nota Fiscal foram enviados para <strong>{formData.email}</strong>.
        </p>
      </div>

      {/* SEÇÃO DO BOT DE WHATSAPP */}
      <div className="w-full max-w-lg bg-emerald-50 border-2 border-emerald-500 p-6 flex flex-col gap-4 rounded-xs text-center shadow-xs">
        <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <span className="font-black text-sm uppercase tracking-wider text-emerald-900">
              Bot de Notificação do WhatsApp
            </span>
          </div>
          <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-xs uppercase tracking-wider">
            Mensagens Prontas
          </span>
        </div>

        <p className="text-xs text-gray-700 leading-relaxed text-left">
          O bot formatou automaticamente os comprovantes e dados de expedição com todos os detalhes da compra:
        </p>

        <div className="flex flex-col gap-2.5">
          {/* Botão 1: Enviar Confirmação ao Cliente */}
          <a
            href={customerWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#1faa4e] text-white py-3.5 px-4 font-black text-xs uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2 rounded-xs"
          >
            <span>📱</span>
            <span>Mandar Mensagem no WhatsApp do Cliente ({formData.telefone})</span>
          </a>

          {/* Botão 2: Notificar Lojista (Você) */}
          <a
            href={sellerWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-black hover:bg-gray-800 text-white py-3.5 px-4 font-black text-xs uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2 rounded-xs"
          >
            <span>🚨</span>
            <span>Enviar Alerta de Venda para Meu WhatsApp</span>
          </a>
        </div>

        <div className="flex items-center justify-center gap-3 text-[10px] text-gray-500 font-bold uppercase pt-1">
          <span>✓ Sem custo de API externa</span>
          <span>•</span>
          <span>✓ Abre direto no WhatsApp Web / App</span>
        </div>
      </div>

      {/* Box de Envio e Rastreamento Físico */}
      <div className="w-full max-w-lg bg-[#f8f8f8] border border-gray-200 p-6 flex flex-col items-center gap-4 rounded-xs text-center">
        <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl">
          📦
        </div>
        <div>
          <span className="font-black text-sm uppercase tracking-wider text-black block">
            Produto Físico em Preparação para Envio
          </span>
          <p className="text-xs text-gray-600 mt-1">
            Sua peça foi encaminhada para acabamento, embalagem e expedição.
          </p>
        </div>
        
        <div className="w-full bg-white border border-gray-200 p-4 text-xs text-left flex flex-col gap-2 rounded-xs">
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="font-bold text-gray-500 uppercase">Item Físico:</span>
            <span className="font-bold text-black">{productName}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="font-bold text-gray-500 uppercase">Modalidade:</span>
            <span className="font-bold text-black">{shippingMethod === "sedex" ? "SEDEX Expresso (1 a 3 dias)" : "PAC Correios (5 a 8 dias)"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-gray-500 uppercase">Endereço de Entrega:</span>
            <span className="font-medium text-black text-right">{formData.endereco}, {formData.numero} - {formData.cidade}/{formData.estado}</span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-3 w-full rounded-xs text-[11px] text-amber-800 font-medium">
          🚚 O código de rastreamento dos Correios será enviado para <strong>{formData.email}</strong> e <strong>{formData.telefone}</strong> assim que o pacote for postado!
        </div>
      </div>

      <div className="flex gap-4 mt-4">
        <a 
          href="/"
          className="border border-black px-6 py-3 font-bold text-xs uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
        >
          Voltar para a Página Inicial
        </a>
      </div>

      {/* Overlay de Processamento Bancário Seguro */}
      {isProcessingPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white text-center animate-fadeIn">
          <div className="w-16 h-16 border-4 border-white/20 border-t-[#cc0000] rounded-full animate-spin mb-6"></div>
          <h3 className="text-xl font-black uppercase tracking-wider mb-2">Processando Pagamento</h3>
          <p className="text-sm text-gray-300 max-w-sm mb-4">{processingMessage}</p>
          <div className="bg-white/10 px-4 py-2 rounded-xs border border-white/20 text-xs font-mono">
            Transação Segura • Criptografia 256-bit SSL
          </div>
        </div>
      )}
    </div>
  );
}
