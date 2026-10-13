/**
 * Utilitários de validação e formatação para o e-commerce brasileiro
 */

// Formata CPF: 000.000.000-00
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

// Validação real de CPF pelo algoritmo dos dígitos verificadores
export function isValidCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, "");

  if (cleanCPF.length !== 11) return false;

  // Rejeita sequências de dígitos iguais conhecidas (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Validação do 1º dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCPF.charAt(9))) return false;

  // Validação do 2º dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
}

// Formata Celular brasileiro: (00) 00000-0000 ou (00) 0000-0000
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// Valida telefone com DDD brasileiro válido (11 a 99)
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  if (digits.length !== 10 && digits.length !== 11) return false;

  const ddd = parseInt(digits.slice(0, 2));
  // DDDs válidos no Brasil variam de 11 a 99
  if (ddd < 11 || ddd > 99) return false;

  // Celulares de 11 dígitos devem começar com 9 no terceiro dígito
  if (digits.length === 11 && digits.charAt(2) !== "9") return false;

  return true;
}

// Formata CEP: 00000-000
export function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

// Valida formato de CEP (8 dígitos numéricos)
export function isValidCEP(cep: string): boolean {
  const digits = cep.replace(/\D/g, "");
  return digits.length === 8;
}

// Valida formato de E-mail
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailRegex.test(email.trim());
}

// Formata Cartão de Crédito em blocos de 4 dígitos
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(" ");
}

// Formata validade do cartão: MM/AA
export function formatCardExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

// Algoritmo de Luhn (Módulo 10) - Validação Matemática Real de Cartão de Crédito
export function isValidLuhn(cardNumber: string): boolean {
  const clean = cardNumber.replace(/\D/g, "");
  if (clean.length < 13 || clean.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export type CardBrand = "visa" | "mastercard" | "elo" | "amex" | "hipercard" | "unknown";

// Detecta a bandeira do cartão pelos primeiros dígitos (BIN / IIN)
export function getCardBrand(cardNumber: string): CardBrand {
  const clean = cardNumber.replace(/\D/g, "");
  if (!clean) return "unknown";

  // Elo (várias faixas específicas brasileiras)
  const eloPrefixes = ["4011", "438935", "451416", "4576", "504175", "5067", "509", "627780", "636297", "636368", "650", "6516", "6550"];
  if (eloPrefixes.some((p) => clean.startsWith(p))) return "elo";

  // Hipercard
  if (clean.startsWith("606282") || clean.startsWith("3841")) return "hipercard";

  // Amex: 34 ou 37
  if (clean.startsWith("34") || clean.startsWith("37")) return "amex";

  // Visa: começa com 4
  if (clean.startsWith("4")) return "visa";

  // Mastercard: 51-55 ou 2221-2720
  const twoDigits = parseInt(clean.slice(0, 2), 10);
  const fourDigits = parseInt(clean.slice(0, 4), 10);
  if ((twoDigits >= 51 && twoDigits <= 55) || (fourDigits >= 2221 && fourDigits <= 2720)) {
    return "mastercard";
  }

  return "unknown";
}

// Validação de Validade do Cartão (Verifica se MM é 01-12 e se a data não está no passado)
export function isValidCardExpiry(expiry: string): boolean {
  const clean = expiry.replace(/\D/g, "");
  if (clean.length !== 4) return false;

  const month = parseInt(clean.slice(0, 2), 10);
  const yearTwoDigits = parseInt(clean.slice(2, 4), 10);

  if (month < 1 || month > 12) return false;

  const fullYear = 2000 + yearTwoDigits;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (fullYear < currentYear) return false;
  if (fullYear === currentYear && month < currentMonth) return false;
  // Limite razoável de validade: 20 anos no futuro
  if (fullYear > currentYear + 20) return false;

  return true;
}

// Validação de CVV (3 dígitos para a maioria, 4 para Amex)
export function isValidCVV(cvv: string, brand: CardBrand = "unknown"): boolean {
  const clean = cvv.replace(/\D/g, "");
  if (brand === "amex") {
    return clean.length === 4;
  }
  return clean.length === 3 || clean.length === 4;
}


export type ViaCEPResponse = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

// Busca endereço no ViaCEP
export async function fetchAddressByCEP(cep: string): Promise<ViaCEPResponse | null> {
  const cleanCEP = cep.replace(/\D/g, "");
  if (cleanCEP.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return null;
    const data: ViaCEPResponse = await response.json();
    if (data.erro) return null;
    return data;
  } catch (err) {
    console.error("Erro ao buscar ViaCEP:", err);
    return null;
  }
}
