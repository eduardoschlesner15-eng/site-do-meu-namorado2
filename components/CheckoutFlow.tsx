"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
import { getSavedUser, saveUser, saveOrder, getCartItems, clearCart, UserProfile, CartItem } from "@/lib/store";
import { createMercadoPagoPreference, verifyMercadoPagoPayment } from "@/lib/mercadopago";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { 
  STORE_WHATSAPP_NUMBER, 
  generateCustomerOrderMessage, 
  generateSellerOrderMessage, 
  getWhatsAppUrl,
  autoDispatchOrderNotifications,
  isEvolutionConfigured,
  getEvolutionConfig,
  saveEvolutionConfig,
  sendEvolutionMessage,
  checkEvolutionConnection,
  EvolutionConfig,
  OrderNotificationData
} from "@/lib/whatsapp";
import ModelViewer from "@/components/ModelViewer";
import EvolutionConfigModal from "@/components/EvolutionConfigModal";
import PaymentBadgesRow, { 
  PixBadge, 
  MercadoPagoBadge, 
  VisaBadge, 
  MastercardBadge, 
  EloBadge, 
  HipercardBadge, 
  AmexBadge, 
  PayPalBadge 
} from "@/components/PaymentLogos";

type Props = {
  productName: string;
  price: string;
  productSlug?: string;
  fileUrl?: string;
  fileType?: "stl" | "fbx";
  category?: string;
};

export default function CheckoutFlow({ 
  productName, 
  price, 
  productSlug = "produto", 
  fileUrl, 
  fileType = "stl",
  category = "Impressão 3D"
}: Props) {
  const [step, setStep] = useState<"form" | "payment" | "success">("form");
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [cepError, setCepError] = useState("");
  const [show3DPreview, setShow3DPreview] = useState(false);
  
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
  
  // Método de pagamento (Pix, Cartão Mercado Pago, PayPal)
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cartao" | "paypal">("pix");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderStatus, setOrderStatus] = useState<"APROVADO" | "AGUARDANDO_PAGAMENTO">("AGUARDANDO_PAGAMENTO");

  // Estado da Automação Evolution API (WhatsApp)
  const [evolutionModalOpen, setEvolutionModalOpen] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{
    attempted: boolean;
    loading: boolean;
    customerSuccess?: boolean;
    sellerSuccess?: boolean;
    error?: string;
  }>({ attempted: false, loading: false });

  // Processamento e autenticação bancária
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isVerifyingGateway, setIsVerifyingGateway] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  // Carrega dados salvos e audita retorno seguro do Mercado Pago
  const mpHandledRef = useRef(false);
  useEffect(() => {
    if (typeof window !== "undefined" && !mpHandledRef.current) {
      const params = new URLSearchParams(window.location.search);
      const paymentId = params.get("payment_id") || params.get("collection_id");
      const paramStatus = params.get("status") || params.get("collection_status");

      // Se houver retorno do Mercado Pago, audita com a API bancária oficial
      if (paymentId && (paramStatus === "approved" || !paramStatus)) {
        mpHandledRef.current = true;
        setIsVerifyingGateway(true);
        setProcessingMessage("Auditando confirmação bancária oficial junto ao Mercado Pago...");

        (async () => {
          try {
            const verifyResult = await verifyMercadoPagoPayment(paymentId);
            if (verifyResult.verified && verifyResult.status === "approved") {
              // Recupera dados salvos da sessão do checkout
              let pendingData: any = null;
              try {
                const raw = localStorage.getItem("pending_checkout_order");
                if (raw) pendingData = JSON.parse(raw);
              } catch (e) {}

              const currentCustomer = pendingData?.formData || getSavedUser() || formData;
              const currentItems = pendingData?.cartItems || (getCartItems()?.length ? getCartItems() : cartItems);
              const currentShipping = pendingData?.shippingMethod || shippingMethod;
              const currentShippingCost = currentShipping === "sedex" ? 24.9 : 14.9;
              const currentSubtotal = currentItems.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0) || basePriceNum;
              const currentTotal = verifyResult.transactionAmount || (currentSubtotal + currentShippingCost);
              const methodType = verifyResult.paymentType === "bank_transfer" || verifyResult.paymentMethodId === "pix" ? "PIX" : "CARTAO";

              const finalOrderNum = `MP-${paymentId}`;
              setOrderNumber(finalOrderNum);
              setOrderStatus("APROVADO");
              if (currentCustomer.nome) setFormData(currentCustomer);
              if (currentItems.length > 0) setCartItems(currentItems);

              // Salva pedido autenticamente aprovado
              saveOrder({
                id: finalOrderNum,
                createdAt: new Date().toLocaleDateString("pt-BR"),
                items: currentItems,
                subtotal: currentSubtotal,
                frete: currentShippingCost,
                total: currentTotal,
                shippingMethod: currentShipping.toUpperCase(),
                paymentMethod: methodType,
                user: {
                  id: "usr-" + Date.now(),
                  nome: currentCustomer.nome,
                  email: currentCustomer.email,
                  cpf: currentCustomer.cpf,
                  telefone: currentCustomer.telefone,
                  endereco: currentCustomer.endereco,
                  numero: currentCustomer.numero,
                  cidade: currentCustomer.cidade,
                  estado: currentCustomer.estado,
                },
                status: "APROVADO",
              });

              // Limpa carrinho e pendência temporária
              clearCart();
              try {
                localStorage.removeItem("pending_checkout_order");
              } catch (e) {}

              // Disparo automático exclusivo para pagamentos autenticados
              if (isEvolutionConfigured()) {
                setDispatchResult({ attempted: true, loading: true });
                try {
                  const res = await autoDispatchOrderNotifications({
                    id: finalOrderNum,
                    productName: currentItems.length === 1 ? currentItems[0].name : `${currentItems.length} itens do pedido`,
                    items: currentItems.map((i: any) => ({ name: i.name, quantity: i.quantity, price: i.price })),
                    quantity: currentItems.reduce((acc: number, i: any) => acc + i.quantity, 0),
                    subtotal: currentSubtotal,
                    frete: currentShippingCost,
                    total: currentTotal,
                    shippingMethod: currentShipping.toUpperCase(),
                    paymentMethod: methodType,
                    status: "APROVADO",
                    user: currentCustomer,
                  });
                  setDispatchResult({
                    attempted: true,
                    loading: false,
                    customerSuccess: res.customer.success,
                    sellerSuccess: res.seller.success,
                    error: !res.customer.success ? res.customer.error : undefined,
                  });
                } catch (err: any) {
                  setDispatchResult({
                    attempted: true,
                    loading: false,
                    customerSuccess: false,
                    sellerSuccess: false,
                    error: err?.message || "Falha na conexão com a Evolution API",
                  });
                }
              }

              setStep("success");
              setIsVerifyingGateway(false);
              // Limpa URL para prevenir reenvios ao atualizar
              window.history.replaceState({}, document.title, window.location.pathname);
            } else {
              setIsVerifyingGateway(false);
              setVerificationError(
                `Atenção: O pagamento #${paymentId} não foi aprovado pelo Mercado Pago (Status retornado: ${verifyResult.status || "Recusado"}). Nenhum comprovante foi gerado.`
              );
            }
          } catch (err: any) {
            setIsVerifyingGateway(false);
            setVerificationError("Falha de conexão ao auditar o pagamento junto ao Mercado Pago.");
          }
        })();
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

  // Itens do Pedido (sincronizados com o Carrinho/Sacola Lateral ou via Props)
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = getCartItems();
    if (stored && stored.length > 0) {
      setCartItems(stored);
    } else {
      setCartItems([
        {
          id: productSlug,
          name: productName,
          slug: productSlug,
          price: parseFloat(price.replace(",", ".")) || 10,
          quantity: 1,
          fileType: fileType,
          fileUrl: fileUrl || "/model.stl",
          category: category,
        },
      ]);
    }
  }, [productSlug, productName, price, fileType, fileUrl, category]);

  // Cálculo de valores (Produtos Físicos com Frete Obrigatório)
  const basePriceNum = cartItems.length > 0 
    ? cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
    : (parseFloat(price.replace(",", ".")) || 10);
  const shippingCost = shippingMethod === "sedex" ? 24.9 : 14.9;
  const pixDiscount = paymentMethod === "pix" ? basePriceNum * 0.05 : 0;
  const finalTotal = Math.max(0, basePriceNum + shippingCost - pixDiscount);

  // Preenche dados para simulação rápida de compra (comprador 55 55 99620-6060)
  const handleFillTestData = () => {
    setFormData({
      nome: "Carlos Eduardo (Simulação)",
      email: "carlos.teste@gmail.com",
      cpf: "123.456.789-09",
      telefone: "(55) 99620-6060",
      cep: "97010-001",
      endereco: "Av. Rio Branco",
      numero: "150",
      complemento: "Apto 302",
      bairro: "Centro",
      cidade: "Santa Maria",
      estado: "RS",
      salvarCadastro: true,
    });
    setErrors({});
  };

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
        // Limpa erro enquanto o usuário ainda está digitando os dígitos
        setErrors((prev) => {
          const next = { ...prev };
          delete next.cpf;
          return next;
        });
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
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.telefone;
          return next;
        });
      }
    } else if (name === "email") {
      const emailCheck = validateEmailStrict(value);
      if (value.length > 3 && !emailCheck.isValid) {
        setErrors((prev) => ({ ...prev, email: emailCheck.error || "Insira um e-mail válido." }));
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.email;
          return next;
        });
      }
    } else if (name === "nome" && value.trim().split(" ").length >= 2) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.nome;
        return next;
      });
    } else if (["endereco", "numero", "bairro", "cidade"].includes(name) && value.trim().length > 0) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    } else if (name === "estado" && value.trim().length === 2) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.estado;
        return next;
      });
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
            delete next.endereco;
            delete next.bairro;
            delete next.cidade;
            delete next.estado;
            return next;
          });
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
      newErrors.email = emailCheck.error || "Informe um endereço de e-mail autêntico.";
    }

    if (!isValidCPF(formData.cpf)) {
      newErrors.cpf = "Informe um CPF válido com 11 dígitos.";
    }

    if (!isValidPhone(formData.telefone)) {
      newErrors.telefone = "Informe um telefone/celular válido com DDD.";
    }

    if (!isValidCEP(formData.cep)) {
      newErrors.cep = "Informe um CEP válido com 8 dígitos.";
    }

    if (!formData.endereco.trim()) {
      newErrors.endereco = "Informe o nome da rua/avenida.";
    }

    if (!formData.numero.trim()) {
      newErrors.numero = "Informe o número.";
    }

    if (!formData.bairro.trim()) {
      newErrors.bairro = "Informe o bairro.";
    }

    if (!formData.cidade.trim()) {
      newErrors.cidade = "Informe a cidade.";
    }

    if (!formData.estado.trim() || formData.estado.trim().length !== 2) {
      newErrors.estado = "Informe o estado (UF).";
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();
    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length > 0) {
      const firstErrorKey = errorKeys[0];
      if (firstErrorKey) {
        document.querySelector<HTMLInputElement>(`input[name="${firstErrorKey}"]`)?.focus();
      }
      return;
    }

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Pagamento Seguro via Mercado Pago (Checkout Oficial com Auditoria Bancária Instantânea)
  const handlePayWithMercadoPago = async (onlyPixMode = false) => {
    setPaymentError("");
    setVerificationError("");
    setIsProcessingPayment(true);
    setProcessingMessage(
      onlyPixMode
        ? "Gerando QR Code Pix Oficial no Mercado Pago (Banco Central)..."
        : "Conectando ao gateway seguro do Mercado Pago..."
    );

    const finalItems: CartItem[] = cartItems.length > 0 ? cartItems : [
      {
        id: productSlug,
        name: productName,
        slug: productSlug,
        price: basePriceNum,
        quantity: 1,
        fileType,
        fileUrl: fileUrl || "/model.stl",
        category,
      },
    ];

    // Preserva estado do pedido para conferência rigorosa no retorno do gateway
    try {
      localStorage.setItem(
        "pending_checkout_order",
        JSON.stringify({
          formData,
          cartItems: finalItems,
          shippingMethod,
          shippingCost,
          basePriceNum,
          finalTotal,
          onlyPixMode,
        })
      );
    } catch (e) {
      console.warn("Não foi possível salvar pending_checkout_order no localStorage", e);
    }

    const pref = await createMercadoPagoPreference({
      title: productName,
      price: finalTotal,
      productSlug: productSlug,
      onlyPix: onlyPixMode,
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

  // Concluir pedido com status rigoroso (evita confirmar venda antes do pagamento)
  const handleCompleteOrder = async (
    methodOverride?: "PIX" | "CARTAO" | "PAYPAL",
    statusOverride?: "APROVADO" | "AGUARDANDO_PAGAMENTO"
  ) => {
    const generatedOrder = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderNumber(generatedOrder);

    const chosenPaymentMethod = (methodOverride || paymentMethod.toUpperCase()) as "PIX" | "CARTAO" | "PAYPAL";

    // Regra estrita: Pix manual ou sem webhook instantâneo é SEMPRE "AGUARDANDO_PAGAMENTO".
    // Somente pagamentos com confirmação bancária externa explícita são "APROVADO".
    const finalStatus: "APROVADO" | "AGUARDANDO_PAGAMENTO" =
      statusOverride ?? (chosenPaymentMethod === "PIX" ? "AGUARDANDO_PAGAMENTO" : "APROVADO");

    setOrderStatus(finalStatus);

    const finalItems: CartItem[] = cartItems.length > 0 ? cartItems : [
      {
        id: productSlug,
        name: productName,
        slug: productSlug,
        price: basePriceNum,
        quantity: 1,
        fileType,
        fileUrl: fileUrl || "/model.stl",
        category,
      },
    ];

    const notificationPayload: OrderNotificationData = {
      id: generatedOrder,
      productName: finalItems.length === 1 ? finalItems[0].name : `${finalItems.length} itens do pedido`,
      items: finalItems.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
      quantity: finalItems.reduce((acc, i) => acc + i.quantity, 0),
      subtotal: basePriceNum,
      frete: shippingCost,
      total: finalTotal,
      shippingMethod: shippingMethod.toUpperCase(),
      paymentMethod: chosenPaymentMethod,
      status: finalStatus,
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

    saveOrder({
      id: generatedOrder,
      createdAt: new Date().toLocaleDateString("pt-BR"),
      items: finalItems,
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
      status: finalStatus,
    });

    // Limpa a sacola após pedido concluído
    clearCart();

    setStep("success");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Disparo automático em background via Evolution API se configurada
    if (isEvolutionConfigured()) {
      setDispatchResult({ attempted: true, loading: true });
      try {
        const res = await autoDispatchOrderNotifications(notificationPayload);
        setDispatchResult({
          attempted: true,
          loading: false,
          customerSuccess: res.customer.success,
          sellerSuccess: res.seller.success,
          error: !res.customer.success ? res.customer.error : undefined,
        });
      } catch (err: any) {
        setDispatchResult({
          attempted: true,
          loading: false,
          customerSuccess: false,
          sellerSuccess: false,
          error: err?.message || "Falha na conexão com a Evolution API",
        });
      }
    } else {
      setDispatchResult({ attempted: false, loading: false });
    }
  };

  // ==================== TELA 3: SUCESSO ====================
  if (step === "success") {
    const isPendingPix = orderStatus === "AGUARDANDO_PAGAMENTO";

    const finalItems: CartItem[] = cartItems.length > 0 ? cartItems : [
      {
        id: productSlug,
        name: productName,
        slug: productSlug,
        price: basePriceNum,
        quantity: 1,
        fileType,
        fileUrl: fileUrl || "/model.stl",
        category,
      },
    ];

    const notificationData: OrderNotificationData = {
      id: orderNumber || "ORD-RECENTE",
      productName: finalItems.length === 1 ? finalItems[0].name : `${finalItems.length} itens do pedido`,
      items: finalItems.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
      quantity: finalItems.reduce((acc, i) => acc + i.quantity, 0),
      subtotal: basePriceNum,
      frete: shippingCost,
      total: finalTotal,
      shippingMethod: shippingMethod.toUpperCase(),
      paymentMethod: paymentMethod.toUpperCase(),
      status: orderStatus,
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
      <div className="w-full bg-white border border-neutral-200 p-8 md:p-14 flex flex-col items-center text-center gap-6 shadow-xs animate-fadeIn max-w-3xl mx-auto">
        {isPendingPix ? (
          <div className="w-16 h-16 bg-amber-500 text-white rounded-full flex items-center justify-center text-3xl font-black shadow-sm">
            ⏳
          </div>
        ) : (
          <div className="w-16 h-16 bg-neutral-900 text-white rounded-full flex items-center justify-center text-2xl font-black">
            ✓
          </div>
        )}

        <div>
          {isPendingPix ? (
            <>
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-800 bg-amber-50 px-3 py-1 rounded-xs border border-amber-300 inline-block">
                Aguardando Confirmação do Pix
              </span>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-neutral-900 mt-3 font-sans">
                Pedido #{orderNumber} Registrado!
              </h2>
              <p className="text-xs text-neutral-600 mt-2 max-w-md mx-auto leading-relaxed">
                Olá, <strong>{formData.nome}</strong>! Recebemos o seu pedido. Para liberarmos a fabricação e envio nos Correios, por favor envie o comprovante de transferência do Pix pelo WhatsApp.
              </p>
            </>
          ) : (
            <>
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xs border border-emerald-200 inline-block">
                Pagamento Aprovado
              </span>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-neutral-900 mt-3 font-sans">
                Pedido #{orderNumber} Confirmado
              </h2>
              <p className="text-xs text-neutral-600 mt-2 max-w-md mx-auto leading-relaxed">
                Obrigado pela sua compra, <strong>{formData.nome}</strong>! Pagamento confirmado e pedido liberado para expedição. Os detalhes foram enviados para <strong>{formData.email}</strong>.
              </p>
            </>
          )}
        </div>

        {/* Alerta de Envio de Comprovante para Pix Pendente */}
        {isPendingPix && (
          <div className="w-full max-w-lg bg-amber-50/90 border border-amber-300 p-4 rounded-xs text-left text-xs flex flex-col gap-2">
            <span className="font-black text-amber-900 uppercase text-[11px] flex items-center gap-1.5">
              <span>⚠️</span> Próximo Passo para Produção e Envio:
            </span>
            <p className="text-amber-800 leading-relaxed text-[11.5px]">
              Se você já realizou o Pix de <strong>R$ {finalTotal.toFixed(2).replace(".", ",")}</strong> pelo seu banco, clique no botão verde abaixo para <strong>enviar o comprovante à loja pelo WhatsApp</strong>. Assim que identificarmos a entrada na conta, seu pedido começará a ser impresso!
            </p>
          </div>
        )}

        {/* Notificações WhatsApp & Evolution API */}
        <div className="w-full max-w-lg bg-neutral-50 border border-neutral-300 p-6 flex flex-col gap-4 rounded-xs text-left">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-black text-xs uppercase tracking-wider text-neutral-900">
                Notificação WhatsApp
              </span>
              <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-xs uppercase">
                {isEvolutionConfigured() ? "Evolution API Ativa" : "1-Clique"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setEvolutionModalOpen(true)}
              className="text-[10px] font-bold text-neutral-600 hover:text-black underline uppercase tracking-wider"
            >
              Configurar API
            </button>
          </div>

          {/* Status do Disparo Automático */}
          {dispatchResult.loading && (
            <div className="bg-sky-50 border border-sky-200 text-sky-900 p-3 rounded-xs flex items-center gap-2.5 text-xs">
              <div className="w-3.5 h-3.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-bold">Disparando mensagem em segundo plano para {formData.telefone}...</span>
            </div>
          )}

          {dispatchResult.attempted && dispatchResult.customerSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xs flex items-start gap-2 text-xs">
              <span className="text-sm">✅</span>
              <div>
                <p className="font-black uppercase text-[10px] text-emerald-800 tracking-wider">Disparo Automático Concluído</p>
                <p className="font-medium mt-0.5">
                  {isPendingPix
                    ? `Instruções de Pix enviadas para o WhatsApp (+${formData.telefone}) e alerta de conferência enviado à loja!`
                    : `Comprovante de pagamento aprovado enviado para o WhatsApp (+${formData.telefone}) e alerta enviado à loja!`}
                </p>
              </div>
            </div>
          )}

          {dispatchResult.attempted && !dispatchResult.customerSuccess && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded-xs flex items-start gap-2 text-xs">
              <span className="text-sm">⚠️</span>
              <div>
                <p className="font-black uppercase text-[10px] text-amber-800 tracking-wider">Evolution API Indisponível</p>
                <p className="font-medium mt-0.5">{dispatchResult.error || "A API não respondeu"}. Use os botões manuais abaixo:</p>
              </div>
            </div>
          )}

          {!isEvolutionConfigured() && !dispatchResult.attempted && (
            <div className="bg-neutral-100 border border-neutral-200 text-neutral-700 p-3.5 rounded-xs flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] text-neutral-900">
                  🤖 Disparo 100% Automático via Evolution API
                </span>
                <span className="text-[9px] bg-neutral-200 text-neutral-700 font-mono px-1.5 py-0.5 rounded-xs uppercase">
                  Opcional
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                Para que as mensagens cheguem sem você precisar clicar em botões manuais, conecte sua Evolution API (gratuita e open source).
              </p>
              <button
                type="button"
                onClick={() => setEvolutionModalOpen(true)}
                className="mt-1 w-full bg-black hover:bg-neutral-800 text-white py-2 px-3 text-[11px] font-black uppercase tracking-wider rounded-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>⚙️</span>
                <span>Configurar / Testar Evolution API</span>
              </button>
            </div>
          )}

          {/* Botões de Ação Direta (Fallback) */}
          <div className="flex flex-col gap-2.5 pt-1">
            {isPendingPix ? (
              <>
                <a
                  href={sellerWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#20b859] text-white py-3.5 px-4 font-black text-xs uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-2 rounded-xs"
                >
                  <span>📄</span>
                  <span>Enviar Comprovante do Pix no WhatsApp da Loja</span>
                </a>

                <a
                  href={customerWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-neutral-900 hover:bg-black text-white py-3 px-4 font-bold text-xs uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-2 rounded-xs"
                >
                  <span>📱</span>
                  <span>Abrir Detalhes do Pedido no meu WhatsApp ({formData.telefone})</span>
                </a>
              </>
            ) : (
              <>
                <a
                  href={customerWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#20b859] text-white py-3.5 px-4 font-black text-xs uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-2 rounded-xs"
                >
                  <span>📱</span>
                  <span>Enviar Confirmação no WhatsApp do Cliente ({formData.telefone})</span>
                </a>

                <a
                  href={sellerWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-black hover:bg-neutral-800 text-white py-3.5 px-4 font-black text-xs uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-2 rounded-xs"
                >
                  <span>🚨</span>
                  <span>Enviar Alerta de Venda para o Meu WhatsApp</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Resumo Físico */}
        <div className="w-full max-w-lg bg-white border border-neutral-200 p-5 text-xs text-left flex flex-col gap-2 rounded-xs">
          <div className="flex justify-between border-b border-neutral-100 pb-2">
            <span className="font-bold text-neutral-500 uppercase">Item Físico:</span>
            <span className="font-black text-neutral-900 text-right">
              {cartItems.length > 0
                ? cartItems.map((i) => `${i.name} (${i.quantity}x)`).join(", ")
                : productName}
            </span>
          </div>
          <div className="flex justify-between border-b border-neutral-100 pb-2">
            <span className="font-bold text-neutral-500 uppercase">Modalidade:</span>
            <span className="font-bold text-neutral-900">{shippingMethod === "sedex" ? "SEDEX Expresso" : "PAC Econômico"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-neutral-500 uppercase">Endereço de Entrega:</span>
            <span className="font-medium text-neutral-900 text-right">{formData.endereco}, {formData.numero} - {formData.cidade}/{formData.estado}</span>
          </div>
        </div>

        <Link 
          href="/"
          className="bg-black text-white px-8 py-3.5 font-black text-xs uppercase tracking-wider hover:bg-[#cc0000] transition-colors rounded-xs shadow-xs"
        >
          Voltar para a Página Inicial
        </Link>

        {/* Modal de Configuração da Evolution API */}
        <EvolutionConfigModal
          isOpen={evolutionModalOpen}
          onClose={() => setEvolutionModalOpen(false)}
          testPhoneDefault={formData.telefone || "5555996206060"}
        />
      </div>
    );
  }

  // ==================== TELA DE AUDITORIA BANCÁRIA DO GATEWAY ====================
  if (isVerifyingGateway) {
    return (
      <div className="w-full bg-white border border-neutral-200 p-10 md:p-14 flex flex-col items-center text-center gap-6 shadow-xs max-w-xl mx-auto my-8 animate-fadeIn">
        <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin flex items-center justify-center">
        </div>
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xs border border-emerald-200 inline-block">
            Auditoria Bancária em Andamento
          </span>
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-900 mt-3 font-sans">
            Validando Pagamento com o Mercado Pago...
          </h2>
          <p className="text-xs text-neutral-600 mt-2 max-w-md mx-auto leading-relaxed">
            Estamos consultando diretamente o gateway oficial e o Banco Central para auditar a liquidação do seu Pix ou Cartão. Os comprovantes oficiais serão liberados assim que a confirmação for autenticada.
          </p>
        </div>
        <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
          Aguarde alguns segundos • Não feche esta página
        </div>
      </div>
    );
  }

  // ==================== CHECKOUT PRINCIPAL (LAYOUT 2 COLUNAS VANS STYLE) ====================
  return (
    <div className="w-full flex flex-col gap-6">

      {/* Alerta de Erro de Auditoria Bancária */}
      {verificationError && (
        <div className="w-full bg-red-50 border-2 border-red-500 p-4 rounded-xs text-left flex flex-col gap-1.5 shadow-xs">
          <div className="flex items-center gap-2 text-red-900 font-black text-xs uppercase tracking-wide">
            <span>🛑</span> Confirmação Bancária Recusada / Pagamento Não Concluído
          </div>
          <p className="text-xs text-red-700 leading-relaxed font-medium">
            {verificationError}
          </p>
          <div className="text-[11px] text-red-600 font-bold mt-1">
            Nenhum comprovante foi gerado e nenhuma liberação de pedido foi realizada. Você pode tentar pagar novamente escolhendo um dos métodos abaixo.
          </div>
        </div>
      )}
      
      {/* BARRA SUPERIOR: STEPPER MINIMALISTA & GARANTIA DE SEGURANÇA (ESTILO VANS) */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between border-b border-neutral-200 pb-5 gap-4">
        
        {/* Link Voltar */}
        <Link 
          href="/"
          className="text-xs font-bold uppercase tracking-wider text-neutral-500 hover:text-black flex items-center gap-1.5 transition-colors"
        >
          <span>‹</span>
          <span>Continuar comprando</span>
        </Link>

        {/* Stepper Minimalista */}
        <div className="flex items-center gap-3 text-xs uppercase tracking-wider">
          <div className={`flex items-center gap-2 ${step === "form" ? "text-black font-black" : "text-neutral-500 font-bold"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step === "form" ? "bg-black text-white" : "bg-neutral-200 text-neutral-700"
            }`}>
              1
            </span>
            <span>Identificação & Entrega</span>
          </div>

          <span className="w-8 h-[1px] bg-neutral-300"></span>

          <div className={`flex items-center gap-2 ${step === "payment" ? "text-black font-black" : "text-neutral-400 font-medium"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step === "payment" ? "bg-black text-white" : "bg-neutral-200 text-neutral-500"
            }`}>
              2
            </span>
            <span>Pagamento</span>
          </div>
        </div>

        {/* Selo de Segurança e Botão Evolution API */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEvolutionModalOpen(true)}
            className="flex items-center gap-1.5 text-neutral-600 hover:text-black border border-neutral-300 hover:border-black px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-xs transition-colors"
            title="Abrir painel de integração da Evolution API"
          >
            <span>⚡</span>
            <span>Evolution API</span>
          </button>

          <div className="flex items-center gap-1.5 text-neutral-600 text-[11px] font-bold uppercase tracking-wider">
            <svg className="w-3.5 h-3.5 text-neutral-800" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Compra 100% Segura</span>
          </div>
        </div>
      </div>

      {/* GRID DE DUAS COLUNAS: ESQUERDA (FORMULÁRIO/PAGAMENTO) | DIREITA (RESUMO DO PEDIDO) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        
        {/* ==================== COLUNA DA ESQUERDA: FORMULÁRIO OU PAGAMENTO ==================== */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">

          {/* PASSO 1: DADOS E ENTREGA */}
          {step === "form" && (
            <form onSubmit={handleProceedToPayment} className="bg-white border border-neutral-200 p-6 sm:p-8 flex flex-col gap-8 shadow-xs rounded-xs">
              
              {/* Seção 1: Dados Pessoais */}
              <div>
                <div className="flex flex-wrap items-center justify-between border-b border-neutral-200 pb-3 mb-5 gap-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-sm uppercase tracking-wider text-black">
                      1. Dados Pessoais
                    </h3>
                    <button
                      type="button"
                      onClick={handleFillTestData}
                      className="text-[10px] bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold px-2 py-1 rounded-xs border border-neutral-300 transition-colors flex items-center gap-1 shadow-2xs"
                      title="Preencher automaticamente com o comprador 55 55 99620-6060"
                    >
                      <span>⚡</span>
                      <span>Simular com 55 55 99620-6060</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase">* Campos Obrigatórios</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nome Completo */}
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                      Nome e Sobrenome *
                    </label>
                    <input 
                      type="text" 
                      name="nome"
                      required
                      placeholder="Ex: Carlos Eduardo da Silva"
                      value={formData.nome}
                      onChange={handleChange}
                      className={`border px-3.5 py-2.5 text-sm font-medium outline-none transition-colors rounded-xs ${
                        errors.nome ? "border-red-500 bg-red-50/20" : "border-neutral-300 focus:border-black"
                      }`}
                    />
                    {errors.nome && <span className="text-[11px] text-red-600 font-bold">{errors.nome}</span>}
                  </div>

                  {/* CPF */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
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
                      className={`border px-3.5 py-2.5 text-sm font-medium outline-none transition-colors rounded-xs ${
                        errors.cpf ? "border-red-500 bg-red-50/20" : "border-neutral-300 focus:border-black"
                      }`}
                    />
                    {errors.cpf && <span className="text-[11px] text-red-600 font-bold">{errors.cpf}</span>}
                  </div>

                  {/* WhatsApp */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                      Telefone / Celular (WhatsApp) *
                    </label>
                    <input 
                      type="text" 
                      name="telefone"
                      required
                      maxLength={15}
                      placeholder="(11) 98765-4321"
                      value={formData.telefone}
                      onChange={handleChange}
                      className={`border px-3.5 py-2.5 text-sm font-medium outline-none transition-colors rounded-xs ${
                        errors.telefone ? "border-red-500 bg-red-50/20" : "border-neutral-300 focus:border-black"
                      }`}
                    />
                    {errors.telefone && <span className="text-[11px] text-red-600 font-bold">{errors.telefone}</span>}
                  </div>

                  {/* E-mail */}
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                      E-mail para Envio do Pedido e Rastreio *
                    </label>
                    <input 
                      type="email" 
                      name="email"
                      required
                      placeholder="seuemail@exemplo.com"
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
                      className={`border px-3.5 py-2.5 text-sm font-medium outline-none transition-colors rounded-xs ${
                        errors.email ? "border-red-500 bg-red-50/20" : "border-neutral-300 focus:border-black"
                      }`}
                    />
                    {errors.email ? (
                      <span className="text-[11px] text-red-600 font-bold">{errors.email}</span>
                    ) : formData.email && isValidEmail(formData.email) ? (
                      <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                        <span>✓</span> E-mail verificado
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Seção 2: Forma de Envio (Estilo Vans Image 3) */}
              <div>
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-5">
                  <h3 className="font-black text-sm uppercase tracking-wider text-black">
                    2. Forma de Envio (Correios)
                  </h3>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase">Entrega em Todo o Brasil</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Opção PAC */}
                  <label 
                    className={`border p-4 flex items-center justify-between cursor-pointer rounded-xs transition-all ${
                      shippingMethod === "pac" 
                        ? "border-black bg-neutral-50 ring-1 ring-black" 
                        : "border-neutral-200 hover:border-neutral-400 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="shippingMethod" 
                        checked={shippingMethod === "pac"} 
                        onChange={() => setShippingMethod("pac")} 
                        className="accent-black w-4 h-4"
                      />
                      {/* Truck Icon */}
                      <svg className="w-6 h-6 text-neutral-800 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V14.25m0 0h5.25" />
                      </svg>
                      <div className="flex flex-col">
                        <span className="font-black text-xs uppercase tracking-wide text-black">Econômico (PAC)</span>
                        <span className="text-[11px] text-blue-900 font-medium">Receba em 5 a 8 dias úteis</span>
                      </div>
                    </div>
                    <span className="font-black text-sm text-black">R$ 14,90</span>
                  </label>

                  {/* Opção SEDEX */}
                  <label 
                    className={`border p-4 flex items-center justify-between cursor-pointer rounded-xs transition-all ${
                      shippingMethod === "sedex" 
                        ? "border-black bg-neutral-50 ring-1 ring-black" 
                        : "border-neutral-200 hover:border-neutral-400 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="shippingMethod" 
                        checked={shippingMethod === "sedex"} 
                        onChange={() => setShippingMethod("sedex")} 
                        className="accent-black w-4 h-4"
                      />
                      {/* Express Truck Icon */}
                      <svg className="w-6 h-6 text-neutral-800 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                      <div className="flex flex-col">
                        <span className="font-black text-xs uppercase tracking-wide text-black">SEDEX Expresso</span>
                        <span className="text-[11px] text-blue-900 font-medium">Receba em 1 a 3 dias úteis</span>
                      </div>
                    </div>
                    <span className="font-black text-sm text-black">R$ 24,90</span>
                  </label>
                </div>
              </div>

              {/* Seção 3: Endereço de Entrega (Estilo Vans Image 5) */}
              <div>
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-5">
                  <h3 className="font-black text-sm uppercase tracking-wider text-black">
                    3. Endereço de Entrega
                  </h3>
                  {loadingCEP && (
                    <span className="text-[11px] text-emerald-700 font-bold animate-pulse">
                      Buscando endereço...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                  {/* CEP */}
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                        CEP *
                      </label>
                      <a 
                        href="https://buscacepinter.correios.com.br/app/endereco/index.php" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] text-neutral-500 hover:text-black underline"
                      >
                        Não sei meu CEP
                      </a>
                    </div>
                    <input 
                      type="text" 
                      name="cep"
                      required
                      maxLength={9}
                      placeholder="00000-000"
                      value={formData.cep}
                      onChange={handleChange}
                      className={`border px-3.5 py-2.5 text-sm font-medium outline-none transition-colors rounded-xs ${
                        errors.cep ? "border-red-500 bg-red-50/20" : "border-neutral-300 focus:border-black"
                      }`}
                    />
                    {errors.cep && <span className="text-[11px] text-red-600 font-bold">{errors.cep}</span>}
                    {cepError && <span className="text-[11px] text-amber-700 font-bold">{cepError}</span>}
                  </div>

                  {/* Logradouro */}
                  <div className="flex flex-col gap-1.5 sm:col-span-4">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                      Endereço (Rua, Avenida, etc.) *
                    </label>
                    <input 
                      type="text" 
                      name="endereco"
                      required
                      placeholder="Nome da rua ou avenida"
                      value={formData.endereco}
                      onChange={handleChange}
                      className={`border px-3.5 py-2.5 text-sm font-medium outline-none transition-colors rounded-xs ${
                        errors.endereco ? "border-red-500 bg-red-50/20" : "border-neutral-300 focus:border-black"
                      }`}
                    />
                    {errors.endereco && <span className="text-[11px] text-red-600 font-bold">{errors.endereco}</span>}
                  </div>

                  {/* Número */}
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                      Número *
                    </label>
                    <input 
                      type="text" 
                      name="numero"
                      required
                      placeholder="Ex: 123"
                      value={formData.numero}
                      onChange={handleChange}
                      className={`border px-3.5 py-2.5 text-sm font-medium outline-none transition-colors rounded-xs ${
                        errors.numero ? "border-red-500 bg-red-50/20" : "border-neutral-300 focus:border-black"
                      }`}
                    />
                    {errors.numero && <span className="text-[11px] text-red-600 font-bold">{errors.numero}</span>}
                  </div>

                  {/* Complemento */}
                  <div className="flex flex-col gap-1.5 sm:col-span-4">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                      Complemento (Opcional)
                    </label>
                    <input 
                      type="text" 
                      name="complemento"
                      placeholder="Ex: Bloco B, Apto 104"
                      value={formData.complemento}
                      onChange={handleChange}
                      className="border border-neutral-300 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-black rounded-xs"
                    />
                  </div>

                  {/* Bairro */}
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                      Bairro *
                    </label>
                    <input 
                      type="text" 
                      name="bairro"
                      required
                      placeholder="Bairro"
                      value={formData.bairro}
                      onChange={handleChange}
                      className={`border px-3.5 py-2.5 text-sm font-medium outline-none transition-colors rounded-xs ${
                        errors.bairro ? "border-red-500 bg-red-50/20" : "border-neutral-300 focus:border-black"
                      }`}
                    />
                    {errors.bairro && <span className="text-[11px] text-red-600 font-bold">{errors.bairro}</span>}
                  </div>

                  {/* Cidade */}
                  <div className="flex flex-col gap-1.5 sm:col-span-3">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                      Cidade *
                    </label>
                    <input 
                      type="text" 
                      name="cidade"
                      required
                      placeholder="Cidade"
                      value={formData.cidade}
                      onChange={handleChange}
                      className={`border px-3.5 py-2.5 text-sm font-medium outline-none transition-colors rounded-xs ${
                        errors.cidade ? "border-red-500 bg-red-50/20" : "border-neutral-300 focus:border-black"
                      }`}
                    />
                    {errors.cidade && <span className="text-[11px] text-red-600 font-bold">{errors.cidade}</span>}
                  </div>

                  {/* Estado UF */}
                  <div className="flex flex-col gap-1.5 sm:col-span-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                      UF *
                    </label>
                    <input 
                      type="text" 
                      name="estado"
                      required
                      maxLength={2}
                      placeholder="SP"
                      value={formData.estado}
                      onChange={handleChange}
                      className={`border px-3.5 py-2.5 text-sm font-medium outline-none transition-colors rounded-xs uppercase ${
                        errors.estado ? "border-red-500 bg-red-50/20" : "border-neutral-300 focus:border-black"
                      }`}
                    />
                    {errors.estado && <span className="text-[11px] text-red-600 font-bold">{errors.estado}</span>}
                  </div>
                </div>

                {/* Salvar Cadastro */}
                <div className="flex items-center gap-2 pt-4">
                  <input 
                    type="checkbox" 
                    id="salvarCadastro" 
                    name="salvarCadastro" 
                    checked={formData.salvarCadastro} 
                    onChange={handleChange}
                    className="accent-black w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="salvarCadastro" className="text-xs font-medium text-neutral-600 cursor-pointer">
                    Salvar meus dados para compras futuras neste dispositivo
                  </label>
                </div>
              </div>

              {/* Botão de Prosseguir */}
              <button 
                type="submit"
                className="w-full bg-black text-white py-4 font-black text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer rounded-xs"
              >
                Prosseguir para o Pagamento (R$ {finalTotal.toFixed(2).replace(".", ",")}) ➔
              </button>
            </form>
          )}

          {/* PASSO 2: FORMAS DE PAGAMENTO */}
          {step === "payment" && (
            <div className="bg-white border border-neutral-200 p-6 sm:p-8 flex flex-col gap-6 shadow-xs rounded-xs animate-fadeIn">
              
              {/* Botão Voltar */}
              <button 
                type="button"
                onClick={() => {
                  setStep("form");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }} 
                className="text-xs font-bold uppercase text-neutral-500 hover:text-black flex items-center gap-1.5 cursor-pointer self-start transition-colors"
              >
                <span>‹</span>
                <span>Voltar e editar dados de entrega</span>
              </button>

              <div className="border-b border-neutral-200 pb-3">
                <h3 className="font-black text-sm uppercase tracking-wider text-black">
                  Selecione a Forma de Pagamento
                </h3>
              </div>

              {/* 3 Abas de Pagamento Selecionáveis (Estilo Vans Image 2) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. PIX Direto */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("pix")}
                  className={`py-3.5 px-3 font-black text-xs uppercase tracking-wider border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer rounded-xs ${
                    paymentMethod === "pix"
                      ? "border-black bg-black text-white shadow-xs"
                      : "border-neutral-200 text-neutral-700 hover:border-neutral-400 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {/* Pix Icon */}
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M9.99 2.5a2 2 0 0 1 2.02 0l7.25 4.19a2 2 0 0 1 1 1.73v8.38a2 2 0 0 1-1 1.73l-7.25 4.19a2 2 0 0 1-2.02 0l-7.25-4.19a2 2 0 0 1-1-1.73V8.42a2 2 0 0 1 1-1.73L9.99 2.5z" />
                    </svg>
                    <span>PIX Direto</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-xs font-bold ${
                    paymentMethod === "pix" ? "bg-emerald-400 text-black" : "bg-emerald-100 text-emerald-800"
                  }`}>
                    5% de Desconto
                  </span>
                </button>

                {/* 2. Cartão (Mercado Pago) */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cartao")}
                  className={`py-3.5 px-3 font-black text-xs uppercase tracking-wider border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer rounded-xs ${
                    paymentMethod === "cartao"
                      ? "border-[#009ee3] bg-[#009ee3] text-white shadow-xs"
                      : "border-neutral-200 text-neutral-700 hover:border-neutral-400 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {/* Card Icon */}
                    <svg className="w-4 h-4 fill-none stroke-current" strokeWidth={2} viewBox="0 0 24 24">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                    <span>Cartão</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-xs font-bold ${
                    paymentMethod === "cartao" ? "bg-white text-[#009ee3]" : "bg-blue-50 text-[#009ee3]"
                  }`}>
                    Até 12x
                  </span>
                </button>

                {/* 3. PayPal */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("paypal")}
                  className={`py-3.5 px-3 font-black text-xs uppercase tracking-wider border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer rounded-xs ${
                    paymentMethod === "paypal"
                      ? "border-[#003087] bg-[#003087] text-white shadow-xs"
                      : "border-neutral-200 text-neutral-700 hover:border-neutral-400 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xs">🅿️</span>
                    <span>PayPal</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-xs font-bold ${
                    paymentMethod === "paypal" ? "bg-[#ffc439] text-[#003087]" : "bg-amber-100 text-amber-900"
                  }`}>
                    Global
                  </span>
                </button>
              </div>

              {/* ================= ABA 1: CONTEÚDO PIX OFICIAL (100% AUTOMATIZADO) ================= */}
              {paymentMethod === "pix" && (
                <div className="flex flex-col gap-4 pt-2 animate-fadeIn text-left">
                  
                  {/* Card Principal: Pix Oficial com Auditoria Bancária Instantânea */}
                  <div className="p-5 bg-gradient-to-br from-emerald-50/90 to-emerald-100/40 border-2 border-emerald-400 rounded-xs flex flex-col gap-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                      <div className="flex items-center gap-2">
                        <PixBadge />
                        <div>
                          <span className="font-black text-xs uppercase tracking-wider text-emerald-950 block">
                            Pix Oficial Banco Central
                          </span>
                          <span className="text-[11px] text-emerald-700 font-medium">Liquidação imediata via Mercado Pago</span>
                        </div>
                      </div>
                      <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-xs uppercase tracking-wider">
                        ⚡ 3 Segundos
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                        <span>🛡️</span>
                        <span>Confirmação 100% Automática pelo Banco Central</span>
                      </div>
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        Ao clicar no botão abaixo, você gera o <strong>QR Code oficial e o código Copia e Cola</strong> com auditoria bancária direta. Assim que você pagar no app do seu banco, nosso sistema identifica o recebimento em <strong>segundos</strong> e aprova seu pedido automaticamente.
                      </p>
                    </div>

                    {/* Vantagens do Pix Automático */}
                    <div className="bg-white/80 border border-emerald-200 p-3.5 rounded-xs flex flex-col gap-1.5 text-[11px] text-emerald-950">
                      <div className="flex items-center gap-2 font-bold text-emerald-900">
                        <span>✓</span>
                        <span>Zero burocracia: não precisa nos enviar foto de comprovante</span>
                      </div>
                      <div className="flex items-center gap-2 font-bold text-emerald-900">
                        <span>✓</span>
                        <span>Comprovante oficial autenticado enviado no seu WhatsApp</span>
                      </div>
                      <div className="flex items-center gap-2 font-bold text-emerald-900">
                        <span>✓</span>
                        <span>Liberado na hora para fabricação 3D e postagem nos Correios</span>
                      </div>
                    </div>

                    {paymentError && (
                      <div className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs font-bold rounded-xs">
                        {paymentError}
                      </div>
                    )}

                    {/* Botão de Ação Único e Seguro */}
                    <button
                      type="button"
                      onClick={() => handlePayWithMercadoPago(true)}
                      disabled={isProcessingPayment}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 px-6 font-black text-xs uppercase tracking-widest transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-xs mt-1"
                    >
                      <span>⚡</span>
                      <span>{isProcessingPayment ? "Conectando ao Mercado Pago..." : `Gerar Pix Oficial de R$ ${finalTotal.toFixed(2).replace(".", ",")} ➔`}</span>
                    </button>

                    <div className="text-center text-[10.5px] text-emerald-700 font-bold uppercase tracking-wider">
                      🔒 Transação Criptografada • Proteção ao Consumidor
                    </div>
                  </div>

                  {/* Informações da Conta Registrada */}
                  <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xs flex items-center justify-between text-xs">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase">Recebedor Credenciado:</span>
                      <span className="font-bold text-neutral-900">Mercado Pago / Loja Oficial N30 Print Arcade</span>
                    </div>
                    <span className="text-[10px] font-mono bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-xs">
                      BACEN PJ
                    </span>
                  </div>

                </div>
              )}

              {/* ================= ABA 2: CONTEÚDO CARTÃO MERCADO PAGO ================= */}
              {paymentMethod === "cartao" && (
                <div className="flex flex-col gap-5 pt-2 animate-fadeIn">
                  <div className="border border-neutral-200 p-5 rounded-xs flex flex-col gap-4 text-left">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                      <div>
                        <span className="font-black text-xs uppercase tracking-wider text-black block">
                          Cartão de Crédito via Mercado Pago
                        </span>
                        <span className="text-[11px] text-neutral-500">Parcelamento em até 12x sem burocracia</span>
                      </div>
                      <span className="bg-[#009ee3] text-white text-[10px] font-black px-2 py-0.5 rounded-xs uppercase">
                        Oficial
                      </span>
                    </div>

                    {/* Bandeiras de Cartão com Logos Reais */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-bold uppercase text-neutral-500">Bandeiras Aceitas:</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <VisaBadge />
                        <MastercardBadge />
                        <EloBadge />
                        <HipercardBadge />
                        <AmexBadge />
                      </div>
                    </div>

                    <p className="text-xs text-neutral-600 leading-relaxed">
                      O pagamento será processado com débito direto no seu cartão de crédito pela operadora oficial do <strong>Mercado Pago</strong> com confirmação imediata.
                    </p>

                    {paymentError && (
                      <div className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs font-bold rounded-xs">
                        {paymentError}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handlePayWithMercadoPago(false)}
                      disabled={isProcessingPayment}
                      className="w-full bg-[#009ee3] hover:bg-[#0086c2] text-white py-4 px-6 font-black text-xs uppercase tracking-widest transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-xs mt-2"
                    >
                      {isProcessingPayment ? "Conectando ao Mercado Pago..." : `Pagar R$ ${finalTotal.toFixed(2).replace(".", ",")} no Cartão ➔`}
                    </button>
                  </div>
                </div>
              )}

              {/* ================= ABA 3: CONTEÚDO PAYPAL ================= */}
              {paymentMethod === "paypal" && (
                <div className="flex flex-col gap-5 pt-2 animate-fadeIn text-left">
                  <div className="border border-neutral-200 p-5 rounded-xs flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                      <div>
                        <span className="font-black text-xs uppercase tracking-wider text-[#003087] block">
                          PayPal Global Checkout
                        </span>
                        <span className="text-[11px] text-neutral-500">Pague com saldo ou cartão internacional</span>
                      </div>
                      <span className="bg-[#003087] text-white text-[10px] font-black px-2 py-0.5 rounded-xs uppercase">
                        Protegido
                      </span>
                    </div>

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
                            handleCompleteOrder("PAYPAL", "APROVADO");
                          }
                        }}
                      />
                    </PayPalScriptProvider>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* ==================== COLUNA DA DIREITA: RESUMO DO PEDIDO (STICKY ESTILO VANS) ==================== */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-6 flex flex-col gap-4">
          <div className="bg-white border border-neutral-200 p-5 sm:p-6 rounded-xs shadow-xs flex flex-col gap-5">
            
            <h3 className="font-black text-xs uppercase tracking-wider text-black border-b border-neutral-200 pb-3">
              Resumo do Pedido
            </h3>

            {/* Linha do Produto */}
            {/* Lista dos Produtos no Resumo */}
            <div className="flex flex-col gap-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3.5 items-start border-b border-neutral-100 pb-3 last:border-b-0 last:pb-0">
                  <div className="w-14 h-14 bg-neutral-100 border border-neutral-200 rounded-xs shrink-0 flex items-center justify-center relative overflow-hidden group">
                    <span className="text-xl">📦</span>
                    {item.fileUrl && (
                      <button 
                        type="button"
                        onClick={() => setShow3DPreview(!show3DPreview)}
                        className="absolute inset-0 bg-black/60 text-white text-[8px] font-black uppercase flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        3D
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-black text-xs uppercase tracking-tight text-black line-clamp-1">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-medium">
                      {item.category || "3D"} • Peça Física
                    </span>
                    <div className="flex justify-between items-center mt-1 text-xs">
                      <span className="text-neutral-500 text-[11px] font-bold">Qtd: {item.quantity}</span>
                      <span className="font-black text-black">
                        R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Preview 3D Expansível */}
            {fileUrl && (
              <div>
                <button
                  type="button"
                  onClick={() => setShow3DPreview(!show3DPreview)}
                  className="w-full text-left text-[11px] font-bold text-neutral-600 hover:text-black flex items-center justify-between border border-neutral-200 p-2 rounded-xs bg-neutral-50 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span>🔄</span>
                    <span>Visualizar Peça em 3D (360°)</span>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {show3DPreview ? "Fechar ▲" : "Abrir ▼"}
                  </span>
                </button>

                {show3DPreview && (
                  <div className="h-44 w-full bg-neutral-100 border border-neutral-200 rounded-xs relative overflow-hidden mt-2">
                    <ModelViewer url={fileUrl} type={fileType} />
                  </div>
                )}
              </div>
            )}

            {/* Tabela de Preços */}
            <div className="flex flex-col gap-2 pt-2 border-t border-neutral-200 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal do Produto:</span>
                <span className="font-medium">R$ {basePriceNum.toFixed(2).replace(".", ",")}</span>
              </div>

              <div className="flex justify-between text-neutral-600">
                <span>Frete Correios ({shippingMethod.toUpperCase()}):</span>
                <span className="font-medium">R$ {shippingCost.toFixed(2).replace(".", ",")}</span>
              </div>

              {paymentMethod === "pix" && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Desconto Pix (5%):</span>
                  <span>- R$ {pixDiscount.toFixed(2).replace(".", ",")}</span>
                </div>
              )}

              <div className="border-t border-neutral-200 pt-3 flex justify-between items-baseline">
                <span className="font-black text-sm uppercase tracking-wider text-black">Total:</span>
                <div className="text-right">
                  <span className="font-black text-lg text-black block">
                    R$ {finalTotal.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-medium">
                    {paymentMethod === "pix" ? "à vista no Pix com 5% de desconto" : "ou até 12x no cartão via Mercado Pago"}
                  </span>
                </div>
              </div>
            </div>

            {/* Selos de Confiança (Estilo Vans Image 2 & 5) */}
            <div className="border-t border-neutral-200 pt-4 flex flex-col gap-2 text-[11px] text-neutral-600">
              <div className="flex items-center gap-2">
                <span className="text-neutral-900 font-bold">✓</span>
                <span>Compra 100% Segura com Criptografia SSL</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-900 font-bold">✓</span>
                <span>Envio pelos Correios com Proteção Anti-Impacto</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-900 font-bold">✓</span>
                <span>Notificações Automáticas no seu WhatsApp</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* RODAPÉ DE BANDEIRAS E FORMAS DE PAGAMENTO (ESTILO VANS IMAGE 2 FOOTER) */}
      <div className="w-full bg-[#111111] text-white p-5 sm:p-6 rounded-xs mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
            Formas de Pagamento:
          </span>
          <PaymentBadgesRow />
        </div>

        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          <span>🔒 Criptografia SSL 256-Bit</span>
          <span>•</span>
          <span>🛡️ Mercado Pago Protegido</span>
        </div>
      </div>

      {/* Overlay de Processamento Bancário Seguro */}
      {isProcessingPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white text-center animate-fadeIn">
          <div className="w-14 h-14 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
          <h3 className="text-sm font-black uppercase tracking-wider mb-1">Processando Transação</h3>
          <p className="text-xs text-neutral-300 max-w-sm mb-3">{processingMessage}</p>
          <div className="bg-white/10 px-3 py-1 rounded-xs border border-white/20 text-[10px] font-mono">
            Conexão Criptografada SSL
          </div>
        </div>
      )}

      {/* Modal de Configuração da Evolution API */}
      <EvolutionConfigModal
        isOpen={evolutionModalOpen}
        onClose={() => setEvolutionModalOpen(false)}
        testPhoneDefault={formData.telefone || "5555996206060"}
      />

    </div>
  );
}
