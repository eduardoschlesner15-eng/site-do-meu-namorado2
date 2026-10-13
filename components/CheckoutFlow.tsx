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
  fetchAddressByCEP,
  formatCardNumber,
  formatCardExpiry
} from "@/lib/validation";
import { getSavedUser, saveUser, saveOrder, UserProfile } from "@/lib/store";

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
  
  // Método de pagamento
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cartao" | "boleto">("pix");
  const [copiedPix, setCopiedPix] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  // Dados do cartão
  const [cardData, setCardData] = useState({
    numero: "",
    nome: "",
    validade: "",
    cvv: "",
    parcelas: "1",
  });

  const numeroInputRef = useRef<HTMLInputElement>(null);

  // Carrega dados salvos do usuário se houver
  useEffect(() => {
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
      if (value.length > 5 && !isValidEmail(value)) {
        setErrors((prev) => ({ ...prev, email: "Insira um endereço de e-mail válido." }));
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
          setTimeout(() => numeroInputRef.current?.focus(), 100);
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

    if (!isValidEmail(formData.email)) {
      newErrors.email = "Informe um e-mail válido (ex: seuemail@exemplo.com).";
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

  // Concluir pedido
  const handleCompleteOrder = () => {
    const generatedOrder = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderNumber(generatedOrder);

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
      paymentMethod: paymentMethod.toUpperCase() as "PIX" | "CARTAO" | "BOLETO",
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

  const pixKey = "00020126580014BR.GOV.BCB.PIX0136alojadomeunamorado@pix.com.br520400005303986540510.005802BR5925A LOJA DO MEU NAMORADO6009SAO PAULO62070503***6304E8A9";

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
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
                  className={`border px-3.5 py-2.5 text-sm font-medium outline-none transition-colors ${
                    errors.email ? "border-red-500 bg-red-50/30" : "border-gray-300 focus:border-black"
                  }`}
                />
                {errors.email && <span className="text-xs text-red-600 font-medium">{errors.email}</span>}
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

        {/* Abas de Pagamento */}
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-2 border-b clean-border pb-4">
            <button
              onClick={() => setPaymentMethod("pix")}
              className={`py-3 font-bold text-xs uppercase tracking-wider border text-center transition-all cursor-pointer ${
                paymentMethod === "pix"
                  ? "border-black bg-black text-white shadow-xs"
                  : "border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              PIX <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-xs ml-1 hidden sm:inline">-5%</span>
            </button>
            <button
              onClick={() => setPaymentMethod("cartao")}
              className={`py-3 font-bold text-xs uppercase tracking-wider border text-center transition-all cursor-pointer ${
                paymentMethod === "cartao"
                  ? "border-black bg-black text-white shadow-xs"
                  : "border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              Cartão de Crédito
            </button>
            <button
              onClick={() => setPaymentMethod("boleto")}
              className={`py-3 font-bold text-xs uppercase tracking-wider border text-center transition-all cursor-pointer ${
                paymentMethod === "boleto"
                  ? "border-black bg-black text-white shadow-xs"
                  : "border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              Boleto
            </button>
          </div>

          {/* CONTEÚDO DA ABA: PIX */}
          {paymentMethod === "pix" && (
            <div className="flex flex-col items-center text-center gap-6 py-4 animate-fadeIn">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2 font-bold uppercase rounded-xs">
                Aprovação Instantânea • Desconto exclusivo aplicado
              </div>

              {/* QR Code Simulado em SVG */}
              <div className="p-4 bg-white border-2 border-dashed border-gray-300 rounded-sm shadow-xs flex flex-col items-center">
                <svg className="w-48 h-48" viewBox="0 0 100 100" fill="currentColor">
                  {/* Padrão QR Code visual */}
                  <rect width="100" height="100" fill="white" />
                  <rect x="10" y="10" width="25" height="25" fill="black" />
                  <rect x="15" y="15" width="15" height="15" fill="white" />
                  <rect x="18" y="18" width="9" height="9" fill="black" />

                  <rect x="65" y="10" width="25" height="25" fill="black" />
                  <rect x="70" y="15" width="15" height="15" fill="white" />
                  <rect x="73" y="18" width="9" height="9" fill="black" />

                  <rect x="10" y="65" width="25" height="25" fill="black" />
                  <rect x="15" y="70" width="15" height="15" fill="white" />
                  <rect x="18" y="73" width="9" height="9" fill="black" />

                  <rect x="42" y="15" width="6" height="6" fill="black" />
                  <rect x="52" y="22" width="6" height="6" fill="black" />
                  <rect x="40" y="38" width="8" height="8" fill="black" />
                  <rect x="60" y="45" width="8" height="8" fill="black" />
                  <rect x="45" y="55" width="12" height="6" fill="black" />
                  <rect x="65" y="65" width="10" height="10" fill="black" />
                  <rect x="78" y="78" width="8" height="8" fill="black" />
                  <rect x="40" y="75" width="10" height="10" fill="black" />
                </svg>
                <span className="text-[11px] font-bold text-gray-500 uppercase mt-2">
                  Abra o app do seu banco e escaneie o código
                </span>
              </div>

              {/* Pix Copia e Cola */}
              <div className="w-full max-w-md flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-700 uppercase">Ou copie a chave Pix:</span>
                <div className="flex border border-gray-300 rounded-xs overflow-hidden">
                  <input 
                    type="text" 
                    readOnly 
                    value={pixKey} 
                    className="w-full px-3 py-2 text-xs text-gray-500 bg-gray-50 outline-none truncate"
                  />
                  <button 
                    onClick={handleCopyPix}
                    className="bg-black text-white px-4 py-2 font-bold text-xs uppercase hover:bg-[#cc0000] transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedPix ? "Copiado! ✓" : "Copiar"}
                  </button>
                </div>
              </div>

              <button 
                onClick={handleCompleteOrder}
                className="w-full max-w-md bg-emerald-600 text-white py-4 font-black text-sm uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-lg cursor-pointer mt-2"
              >
                Confirmar Pagamento Realizado ✓
              </button>
            </div>
          )}

          {/* CONTEÚDO DA ABA: CARTÃO DE CRÉDITO */}
          {paymentMethod === "cartao" && (
            <div className="flex flex-col gap-4 max-w-lg mx-auto w-full py-2 animate-fadeIn">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Número do Cartão</label>
                <input 
                  type="text"
                  maxLength={19}
                  placeholder="0000 0000 0000 0000"
                  value={cardData.numero}
                  onChange={(e) => setCardData({ ...cardData, numero: formatCardNumber(e.target.value) })}
                  className="border border-gray-300 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-black"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Nome Impresso no Cartão</label>
                <input 
                  type="text"
                  placeholder="Como está gravado no cartão"
                  value={cardData.nome}
                  onChange={(e) => setCardData({ ...cardData, nome: e.target.value.toUpperCase() })}
                  className="border border-gray-300 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-black uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Validade (MM/AA)</label>
                  <input 
                    type="text"
                    maxLength={5}
                    placeholder="12/28"
                    value={cardData.validade}
                    onChange={(e) => setCardData({ ...cardData, validade: formatCardExpiry(e.target.value) })}
                    className="border border-gray-300 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-black"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">CVV</label>
                  <input 
                    type="text"
                    maxLength={4}
                    placeholder="123"
                    value={cardData.cvv}
                    onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, "") })}
                    className="border border-gray-300 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Parcelamento</label>
                <select 
                  value={cardData.parcelas}
                  onChange={(e) => setCardData({ ...cardData, parcelas: e.target.value })}
                  className="border border-gray-300 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-black bg-white cursor-pointer"
                >
                  <option value="1">1x de R$ {finalTotal.toFixed(2).replace(".", ",")} sem juros</option>
                  <option value="2">2x de R$ {(finalTotal / 2).toFixed(2).replace(".", ",")} sem juros</option>
                  <option value="3">3x de R$ {(finalTotal / 3).toFixed(2).replace(".", ",")} sem juros</option>
                </select>
              </div>

              <button 
                onClick={handleCompleteOrder}
                className="w-full bg-black text-white py-4 font-black text-sm uppercase tracking-wider hover:bg-[#cc0000] transition-colors shadow-md mt-4 cursor-pointer"
              >
                Pagar R$ {finalTotal.toFixed(2).replace(".", ",")} com Cartão ➔
              </button>
            </div>
          )}

          {/* CONTEÚDO DA ABA: BOLETO */}
          {paymentMethod === "boleto" && (
            <div className="flex flex-col items-center text-center gap-4 py-4 animate-fadeIn max-w-md mx-auto">
              <div className="text-4xl">📄</div>
              <h4 className="font-bold text-sm uppercase">Boleto Bancário</h4>
              <p className="text-xs text-gray-600">
                O boleto será gerado no nome de <strong>{formData.nome}</strong> com vencimento para 3 dias úteis.
              </p>
              <div className="w-full p-3 bg-gray-50 border border-gray-300 font-mono text-xs text-gray-600 break-all">
                34191.79001 01043.510047 91020.150008 8 98760000001000
              </div>
              <button 
                onClick={handleCompleteOrder}
                className="w-full bg-black text-white py-4 font-black text-sm uppercase tracking-wider hover:bg-[#cc0000] transition-colors shadow-md mt-2 cursor-pointer"
              >
                Gerar Boleto e Finalizar Pedido ➔
              </button>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ==================== TELA 3: SUCESSO ====================
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
    </div>
  );
}
