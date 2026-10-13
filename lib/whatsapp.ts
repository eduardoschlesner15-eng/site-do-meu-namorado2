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
  quantity?: number;
  subtotal: number;
  frete: number;
  total: number;
  shippingMethod: string;
  paymentMethod: string;
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

  return `🛍️ *A LOJA DO MEU NAMORADO - PEDIDO CONFIRMADO!*

Olá, *${firstName}*! Muito obrigado por comprar conosco! Seu pedido foi registrado com sucesso.

📋 *DETALHES DO PEDIDO #${data.id}*
• *Produto:* ${data.productName} (1x)
• *Subtotal:* R$ ${data.subtotal.toFixed(2).replace(".", ",")}
• *Frete:* R$ ${data.frete.toFixed(2).replace(".", ",")} (${data.shippingMethod})
• *TOTAL:* R$ ${data.total.toFixed(2).replace(".", ",")}
• *Pagamento:* ${data.paymentMethod}

📦 *ENDEREÇO DE ENTREGA (Correios):*
${data.user.endereco || ""}, Nº ${data.user.numero || ""}${data.user.complemento ? ` (${data.user.complemento})` : ""}
${data.user.bairro ? `${data.user.bairro} - ` : ""}${data.user.cidade || ""}/${data.user.estado || ""}
CEP: ${data.user.cep || ""}

🚚 *PRAZO E ENVIO:*
Seu produto físico já está na fila de fabricação e expedição. Assim que for postado nos Correios, nós enviaremos o código de rastreamento por aqui!

Ficou com alguma dúvida? Basta responder a esta mensagem. Tenha um ótimo dia! ✨`;
}

/**
 * Gera mensagem formatada para o LOJISTA (Alerta de Nova Venda para Expedição)
 */
export function generateSellerOrderMessage(data: OrderNotificationData): string {
  return `🚨 *NOVA VENDA CONFIRMADA NO SITE!* 🚨

📦 *Pedido:* #${data.id}
💰 *Total Pago:* R$ ${data.total.toFixed(2).replace(".", ",")} (${data.paymentMethod})

🛒 *PRODUTO VENDIDO:*
• *Item:* ${data.productName} (1 unidade)
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
