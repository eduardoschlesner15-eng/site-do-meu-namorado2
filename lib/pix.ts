/**
 * Gerador Oficial de Pix Dinâmico com Chave Aleatória (EVP) vinculada ao Mercado Pago
 * Mantém todos os dados pessoais (telefone, CPF, nome completo) 100% ocultos dos compradores.
 */

export const REAL_PIX_STORAGE_KEY = "n30_custom_evp_pix_key";

export function maskPixKey(key: string): string {
  if (!key || key.length < 8) return "••••••••••••";
  const start = key.slice(0, 8);
  const end = key.slice(-12);
  return `${start}-••••-••••-••••-${end}`;
}

export function getStoredPixKey(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(REAL_PIX_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  }
  return "";
}

export function setStoredPixKey(key: string): void {
  if (typeof window !== "undefined") {
    if (key && key.trim()) {
      localStorage.setItem(REAL_PIX_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(REAL_PIX_STORAGE_KEY);
    }
  }
}

export const PIX_CONFIG = {
  // Chave padrão ou configurada
  chave: "",
  chaveMascara: "••••••••-••••-••••-••••-••••••••••••",
  tipoChave: "CHAVE ALEATÓRIA MERCADO PAGO (EVP)",
  beneficiario: "MERCADO PAGO / LOJA",
  cidade: "SAO PAULO",
  tempoExpiracaoSegundos: 300, // 5 minutos
};

// Algoritmo CRC16-CCITT (Polinômio 0x1021) do Banco Central do Brasil
function crc16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function emvField(id: string, val: string): string {
  const len = String(val.length).padStart(2, "0");
  return `${id}${len}${val}`;
}

export type PixPayloadParams = {
  key?: string;
  name?: string;
  city?: string;
  amount: number;
  txid?: string;
};

/**
 * Gera a string Pix Copia e Cola Oficial (BR Code do Banco Central com Chave Aleatória)
 */
export function generatePixCopiaECola({
  key = PIX_CONFIG.chave,
  name = PIX_CONFIG.beneficiario,
  city = PIX_CONFIG.cidade,
  amount,
  txid = "PIX" + Math.floor(100000 + Math.random() * 900000),
}: PixPayloadParams): string {
  const cleanTxid = (txid || "ORD").replace(/[^A-Za-z0-9]/g, "").slice(0, 25);
  const cleanName = (name || "MERCADO PAGO").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().slice(0, 25);
  const cleanCity = (city || "SAO PAULO").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().slice(0, 15);

  const gui = emvField("00", "br.gov.bcb.pix");
  const chave = emvField("01", key);
  const accountInfo = emvField("26", gui + chave);

  const payloadSemCRC =
    emvField("00", "01") +
    accountInfo +
    emvField("52", "0000") +
    emvField("53", "986") +
    emvField("54", Math.max(0.01, amount).toFixed(2)) +
    emvField("58", "BR") +
    emvField("59", cleanName) +
    emvField("60", cleanCity) +
    emvField("62", emvField("05", cleanTxid)) +
    "6304";

  const checksum = crc16(payloadSemCRC);
  return payloadSemCRC + checksum;
}

/**
 * Gera URL do QR Code de alta resolução
 */
export function getPixQrCodeUrl(payload: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(payload)}`;
}
