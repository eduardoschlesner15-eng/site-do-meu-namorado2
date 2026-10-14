/**
 * Sistema de Bot de Notificação via WhatsApp para Vendas
 * Permite disparo instantâneo para o Cliente e para o Lojista
 */

// Número de WhatsApp da Loja / Vendedor (DDI + DDD + Número)
// Número oficial configurado: +55 (55) 99957-6823
export const STORE_WHATSAPP_NUMBER = "5555999576823"; 

export type OrderNotificationData = {
  id: string;
  productName: string;
  items?: { name: string; quantity: number; price: number }[];
  quantity?: number;
  subtotal: number;
  frete: number;
  total: number;
  shippingMethod: string;
  paymentMethod: string;
  status?: "APROVADO" | "AGUARDANDO_PAGAMENTO";
  user: {
    nome: string;
    cpf?: string;
    email: string;
    telefone: string;
    cep?: string;
    endereco?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
  };
};

/**
 * Formata número de telefone para o padrão internacional do WhatsApp (55 + DDD + Número)
 */
export function formatWhatsAppNumber(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && digits.length >= 12) {
    return digits;
  }
  return `55${digits}`;
}

/**
 * Gera mensagem formatada para o CLIENTE (Comprovante e Rastreio)
 */
export function generateCustomerOrderMessage(data: OrderNotificationData): string {
  const firstName = data.user.nome.split(" ")[0] || "Cliente";
  const isPending = data.status === "AGUARDANDO_PAGAMENTO";

  const itemsLines = data.items && data.items.length > 0
    ? data.items.map((i) => `• *Produto:* ${i.name} (${i.quantity}x) - R$ ${(i.price * i.quantity).toFixed(2).replace(".", ",")}`).join("\n")
    : `• *Produto:* ${data.productName} (${data.quantity || 1}x)`;

  if (isPending) {
    return `🕒 *A LOJA DO MEU NAMORADO - PEDIDO REGISTRADO!*

Olá, *${firstName}*! Recebemos o seu pedido #${data.id}.

⚠️ *STATUS: AGUARDANDO CONFIRMAÇÃO DO PIX*

📋 *DETALHES DO PEDIDO:*
${itemsLines}
• *Subtotal:* R$ ${data.subtotal.toFixed(2).replace(".", ",")}
• *Frete:* R$ ${data.frete.toFixed(2).replace(".", ",")} (${data.shippingMethod})
• *VALOR DO PIX:* R$ ${data.total.toFixed(2).replace(".", ",")}
• *Forma:* Chave Pix Direta

📦 *ENDEREÇO DE ENTREGA (Correios):*
${data.user.endereco || ""}, Nº ${data.user.numero || ""}${data.user.complemento ? ` (${data.user.complemento})` : ""}
${data.user.bairro ? `${data.user.bairro} - ` : ""}${data.user.cidade || ""}/${data.user.estado || ""}
CEP: ${data.user.cep || ""}

⏳ *IMPORTANTE:*
A fabricação e o envio nos Correios só iniciam após a identificação do pagamento na conta da loja.
Se você já realizou o Pix pelo aplicativo do seu banco, por favor *responda a esta mensagem enviando o comprovante em foto ou PDF* para conferirmos e liberarmos seu pedido imediatamente! 🧾`;
  }

  return `✅ *A LOJA DO MEU NAMORADO - PAGAMENTO APROVADO!*

Olá, *${firstName}*! O seu pagamento foi confirmado e o pedido #${data.id} foi aprovado com sucesso!

📋 *DETALHES DO PEDIDO APROVADO:*
${itemsLines}
• *Subtotal:* R$ ${data.subtotal.toFixed(2).replace(".", ",")}
• *Frete:* R$ ${data.frete.toFixed(2).replace(".", ",")} (${data.shippingMethod})
• *TOTAL PAGO:* R$ ${data.total.toFixed(2).replace(".", ",")}
• *Pagamento:* ${data.paymentMethod} (Aprovado)

📦 *ENDEREÇO DE ENTREGA (Correios):*
${data.user.endereco || ""}, Nº ${data.user.numero || ""}${data.user.complemento ? ` (${data.user.complemento})` : ""}
${data.user.bairro ? `${data.user.bairro} - ` : ""}${data.user.cidade || ""}/${data.user.estado || ""}
CEP: ${data.user.cep || ""}

🚚 *PRAZO E ENVIO:*
Seu produto já entrou na fila de separação e expedição física. Assim que for postado nos Correios, nós enviaremos o código de rastreamento por aqui! ✨`;
}

/**
 * Gera mensagem formatada para o LOJISTA (Alerta de Nova Venda para Expedição)
 */
export function generateSellerOrderMessage(data: OrderNotificationData): string {
  const isPending = data.status === "AGUARDANDO_PAGAMENTO";

  const itemsLines = data.items && data.items.length > 0
    ? data.items.map((i) => `• ${i.name} (${i.quantity}x) - R$ ${(i.price * i.quantity).toFixed(2).replace(".", ",")}`).join("\n")
    : `• ${data.productName} (${data.quantity || 1}x)`;

  if (isPending) {
    return `⚠️ *NOVO PEDIDO REGISTRADO - PIX PENDENTE DE CONFERÊNCIA!* ⚠️

📦 *Pedido:* #${data.id}
💰 *Valor Esperado:* R$ ${data.total.toFixed(2).replace(".", ",")} (PIX DIRETO)

🛑 *ATENÇÃO LOJISTA:*
O comprador informou que realizou o Pix, mas o valor *AINDA NÃO FOI AUDITADO AUTOMATICAMENTE*.
👉 *NÃO DESPACHE NEM POSTE NOS CORREIOS* até verificar se os R$ ${data.total.toFixed(2).replace(".", ",")} realmente caíram no extrato bancário da sua conta ou até ele apresentar o comprovante autêntico!

👤 *DADOS DO COMPRADOR:*
• *Nome:* ${data.user.nome}
• *CPF:* ${data.user.cpf || "Não informado"}
• *WhatsApp:* ${data.user.telefone}
• *E-mail:* ${data.user.email}

📍 *ENDEREÇO DE EXPEDIÇÃO APÓS CONFERÊNCIA:*
• *Logradouro:* ${data.user.endereco || ""}, Nº ${data.user.numero || ""}
${data.user.complemento ? `• *Complemento:* ${data.user.complemento}\n` : ""}• *Bairro:* ${data.user.bairro || ""}
• *Cidade/UF:* ${data.user.cidade || ""}/${data.user.estado || ""}
• *CEP:* ${data.user.cep || ""}

⚡ *AÇÃO:* Aguardar comprovante ou conferir extrato bancário antes de produzir/enviar.`;
  }

  return `🎉 *PAGAMENTO APROVADO - LIBERADO PARA EXPEDIÇÃO!* 🚨

📦 *Pedido:* #${data.id}
💰 *Total Pago e Confirmado:* R$ ${data.total.toFixed(2).replace(".", ",")} (${data.paymentMethod})

🛒 *PRODUTO VENDIDO:*
${itemsLines}
• *Subtotal:* R$ ${data.subtotal.toFixed(2).replace(".", ",")}
• *Frete:* R$ ${data.frete.toFixed(2).replace(".", ",")} (${data.shippingMethod})

👤 *DADOS DO COMPRADOR:*
• *Nome:* ${data.user.nome}
• *CPF:* ${data.user.cpf || "Não informado"}
• *WhatsApp:* ${data.user.telefone}
• *E-mail:* ${data.user.email}

📍 *ENDEREÇO DE EXPEDIÇÃO (Correios):*
• *Logradouro:* ${data.user.endereco || ""}, Nº ${data.user.numero || ""}
${data.user.complemento ? `• *Complemento:* ${data.user.complemento}\n` : ""}• *Bairro:* ${data.user.bairro || ""}
• *Cidade/UF:* ${data.user.cidade || ""}/${data.user.estado || ""}
• *CEP:* ${data.user.cep || ""}

⚡ *AÇÃO:* Imprimir dados, separar a peça física e embalar para postagem nos Correios!`;
}

/**
 * Cria URL direta para abrir no WhatsApp Web / WhatsApp Mobile
 */
export function getWhatsAppUrl(phone: string, message: string): string {
  const formattedPhone = formatWhatsAppNumber(phone);
  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
}

/**
 * Abre o WhatsApp em uma nova aba
 */
export function triggerWhatsAppNotification(phone: string, message: string): void {
  if (typeof window === "undefined") return;
  const url = getWhatsAppUrl(phone, message);
  window.open(url, "_blank", "noopener,noreferrer");
}

/* ================= EVOLUTION API (DISPARO 100% AUTOMÁTICO EM SEGUNDO PLANO) ================= */

export type EvolutionConfig = {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
};

const EVOLUTION_STORAGE_KEY = "n30_evolution_api_config";

export function getEvolutionConfig(): EvolutionConfig {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(EVOLUTION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.baseUrl && parsed.apiKey) {
          return parsed;
        }
      }
    } catch {}
  }

  return {
    baseUrl: process.env.NEXT_PUBLIC_EVOLUTION_API_URL || "https://evolution-api-production-a085.up.railway.app",
    apiKey: process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || "ef3432a67a333e1151a20e32f438c2328b4eb37560af504dd00a929f02e39312",
    instanceName: process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE || "loja",
  };
}

export function saveEvolutionConfig(config: EvolutionConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EVOLUTION_STORAGE_KEY, JSON.stringify(config));
}

export function isEvolutionConfigured(): boolean {
  const cfg = getEvolutionConfig();
  return Boolean(cfg.baseUrl && cfg.apiKey && cfg.instanceName);
}

/**
 * Verifica o estado de conexão da instância no servidor Evolution API
 */
export async function checkEvolutionConnection(configOverride?: EvolutionConfig): Promise<{
  connected: boolean;
  state?: string;
  error?: string;
}> {
  try {
    const config = configOverride || getEvolutionConfig();
    if (!config.baseUrl || !config.apiKey) {
      return { connected: false, error: "URL ou Chave de API ausente." };
    }

    const cleanBaseUrl = config.baseUrl.replace(/\/+$/, "");
    const instance = encodeURIComponent(config.instanceName || "loja");
    const endpoint = `${cleanBaseUrl}/instance/connectionState/${instance}`;

    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        "apikey": config.apiKey,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return { connected: false, error: `Erro ${res.status}: ${errText}` };
    }

    const data = await res.json();
    const state = data?.instance?.state || data?.state || "unknown";
    return {
      connected: state === "open",
      state: state,
    };
  } catch (err: any) {
    return { connected: false, error: err?.message || "Erro de rede ao conectar à Evolution API." };
  }
}

/**
 * Envia mensagem direta pelo servidor da Evolution API
 */
export async function sendEvolutionMessage(
  phone: string, 
  text: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const cleanPhone = formatWhatsAppNumber(phone);
    if (!cleanPhone) {
      return { success: false, error: "Número de telefone inválido." };
    }

    const config = getEvolutionConfig();
    if (!config.baseUrl || !config.apiKey) {
      return { success: false, error: "Evolution API não configurada." };
    }

    const cleanBaseUrl = config.baseUrl.replace(/\/+$/, "");
    const instance = encodeURIComponent(config.instanceName || "loja");
    const endpoint = `${cleanBaseUrl}/message/sendText/${instance}`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": config.apiKey,
      },
      body: JSON.stringify({
        number: cleanPhone,
        text: text,
        textMessage: {
          text: text,
        },
        delay: 1200,
        linkPreview: true,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Evolution API Erro:", errText);
      return { success: false, error: errText };
    }

    const json = await res.json();
    return { success: true, data: json };
  } catch (err: any) {
    console.error("Evolution API Falha na requisição:", err);
    return { success: false, error: err?.message || "Erro de conexão com Evolution API." };
  }
}

/**
 * Disparo automático duplo ao finalizar compra:
 * 1. Manda comprovante para o comprador
 * 2. Manda alerta com dados de expedição para o lojista
 */
export async function autoDispatchOrderNotifications(data: OrderNotificationData): Promise<{
  customer: { success: boolean; error?: string };
  seller: { success: boolean; error?: string };
}> {
  const customerMsg = generateCustomerOrderMessage(data);
  const sellerMsg = generateSellerOrderMessage(data);

  const [customerRes, sellerRes] = await Promise.allSettled([
    sendEvolutionMessage(data.user.telefone, customerMsg),
    sendEvolutionMessage(STORE_WHATSAPP_NUMBER, sellerMsg),
  ]);

  return {
    customer: customerRes.status === "fulfilled" ? customerRes.value : { success: false, error: "Falha" },
    seller: sellerRes.status === "fulfilled" ? sellerRes.value : { success: false, error: "Falha" },
  };
}
