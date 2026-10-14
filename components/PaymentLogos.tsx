import React from "react";

// 1. Pix Oficial
export function PixBadge({ className = "h-6" }: { className?: string }) {
  return (
    <div className="bg-white rounded-xs px-2 py-1 flex items-center justify-center shadow-xs border border-neutral-200 hover:border-neutral-400 transition-colors h-7 min-w-[54px]">
      <svg className={className} viewBox="0 0 100 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Ícone Diamond do Pix */}
        <path
          d="M19.8 11.2L13.6 5C12.8 4.2 11.4 4.2 10.6 5L4.4 11.2C3.6 12 3.6 13.4 4.4 14.2L10.6 20.4C11.4 21.2 12.8 21.2 13.6 20.4L19.8 14.2C20.6 13.4 20.6 12 19.8 11.2Z"
          fill="#32BCAD"
        />
        <path
          d="M12.1 1.2C11.6 1.7 11.6 2.5 12.1 3L16.2 7.1C16.7 7.6 17.5 7.6 18 7.1C18.5 6.6 18.5 5.8 18 5.3L13.9 1.2C13.4 0.7 12.6 0.7 12.1 1.2Z"
          fill="#32BCAD"
        />
        <path
          d="M12.1 24.2L16.2 20.1C16.7 19.6 17.5 19.6 18 20.1C18.5 20.6 18.5 21.4 18 21.9L13.9 26C13.4 26.5 12.6 26.5 12.1 26C11.6 25.5 11.6 24.7 12.1 24.2Z"
          fill="#32BCAD"
        />
        <path
          d="M6 7.1L10.1 3C10.6 2.5 10.6 1.7 10.1 1.2C9.6 0.7 8.8 0.7 8.3 1.2L4.2 5.3C3.7 5.8 3.7 6.6 4.2 7.1C4.7 7.6 5.5 7.6 6 7.1Z"
          fill="#32BCAD"
        />
        <path
          d="M6 20.1C5.5 19.6 4.7 19.6 4.2 20.1C3.7 20.6 3.7 21.4 4.2 21.9L8.3 26C8.8 26.5 9.6 26.5 10.1 26C10.6 25.5 10.6 24.7 10.1 24.2L6 20.1Z"
          fill="#32BCAD"
        />
        {/* Texto "pix" */}
        <text
          x="30"
          y="23"
          fill="#32BCAD"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="20"
          fontWeight="900"
          letterSpacing="-0.5"
        >
          pix
        </text>
      </svg>
    </div>
  );
}

// 2. Mercado Pago
export function MercadoPagoBadge({ className = "h-5" }: { className?: string }) {
  return (
    <div className="bg-white rounded-xs px-2 py-1 flex items-center justify-center shadow-xs border border-neutral-200 hover:border-neutral-400 transition-colors h-7 min-w-[62px]">
      <svg className={className} viewBox="0 0 110 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Logomarca Handshake estilizado MP */}
        <circle cx="15" cy="15" r="13" fill="#009EE3" />
        <path
          d="M9 13.5C9 13.5 11 11.5 13.5 13.5L16.5 16.5C17.5 17.5 19 16.5 19 16.5L21.5 14C22.5 13 22 11.5 20.5 11L18 10.5"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.5 18C13.5 18 15 19 16.5 17.5L19 15"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <text
          x="33"
          y="15"
          fill="#009EE3"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="10"
          fontWeight="900"
          letterSpacing="-0.2"
        >
          mercado
        </text>
        <text
          x="33"
          y="24"
          fill="#009EE3"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="10"
          fontWeight="900"
          letterSpacing="-0.2"
        >
          pago
        </text>
      </svg>
    </div>
  );
}

// 3. Visa
export function VisaBadge({ className = "h-4" }: { className?: string }) {
  return (
    <div className="bg-white rounded-xs px-2.5 py-1 flex items-center justify-center shadow-xs border border-neutral-200 hover:border-neutral-400 transition-colors h-7 min-w-[50px]">
      <svg className={className} viewBox="0 0 65 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M26.2 1.5L17.5 21H12.1L7.3 5.4C7 4.2 6.7 3.8 5.7 3.3C4.2 2.5 1.9 1.8 0 1.4L0.2 0.5H9.4C10.7 0.5 11.7 1.4 12 2.9L14.3 14.6L19.7 0.5H26.2V1.5Z"
          fill="#1A1F71"
        />
        <path
          d="M23.5 0.5L18.1 21H23.5L28.9 0.5H23.5Z"
          fill="#1A1F71"
        />
        <path
          d="M44.7 14.2C44.7 8.8 37 8.5 37 6.1C37 5.2 37.8 4.3 39.5 4.1C40.3 4 42.6 3.9 45 5L45.9 0.9C44.6 0.4 43 0 40.9 0C35.5 0 31.7 2.8 31.7 6.8C31.7 9.8 34.4 11.5 36.5 12.5C38.6 13.5 39.3 14.2 39.3 15.1C39.3 16.5 37.6 17.1 36.1 17.1C33.5 17.1 32 16.7 30.2 15.9L29.3 20.2C31 20.9 33.3 21.5 35.7 21.5C41.4 21.5 45.1 18.6 44.7 14.2Z"
          fill="#1A1F71"
        />
        <path
          d="M58.1 21H63L58.7 0.5H54.2C53.1 0.5 52.1 1.2 51.7 2.3L44.2 21H49.6L50.7 17.9H57.3L58.1 21ZM52.2 13.9L54.9 6.2L56.5 13.9H52.2Z"
          fill="#1A1F71"
        />
        {/* Accent dourado característico da perna do V */}
        <path
          d="M7.3 5.4C7 4.2 6.7 3.8 5.7 3.3C4.2 2.5 1.9 1.8 0 1.4L0.2 0.5H9.4C10.7 0.5 11.7 1.4 12 2.9L7.3 5.4Z"
          fill="#F7B600"
        />
      </svg>
    </div>
  );
}

// 4. Mastercard
export function MastercardBadge({ className = "h-5" }: { className?: string }) {
  return (
    <div className="bg-white rounded-xs px-2 py-1 flex items-center justify-center shadow-xs border border-neutral-200 hover:border-neutral-400 transition-colors h-7 min-w-[50px]">
      <svg className={className} viewBox="0 0 54 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="17" r="16" fill="#EB001B" />
        <circle cx="36" cy="17" r="16" fill="#F79E1B" />
        <path
          d="M27 5.7C30.3 8.5 32.4 12.5 32.4 17C32.4 21.5 30.3 25.5 27 28.3C23.7 25.5 21.6 21.5 21.6 17C21.6 12.5 23.7 8.5 27 5.7Z"
          fill="#FF5F00"
        />
      </svg>
    </div>
  );
}

// 5. Elo
export function EloBadge({ className = "h-5" }: { className?: string }) {
  return (
    <div className="bg-black rounded-xs px-2.5 py-1 flex items-center justify-center shadow-xs border border-neutral-800 hover:border-neutral-600 transition-colors h-7 min-w-[48px]">
      <svg className={className} viewBox="0 0 56 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Três elos coloridos oficiais Elo */}
        <circle cx="8" cy="12" r="5.5" stroke="#EE1C25" strokeWidth="2.8" />
        <circle cx="15" cy="7.5" r="4.5" stroke="#FFC600" strokeWidth="2.4" />
        <circle cx="17" cy="16" r="4.5" stroke="#00A4E4" strokeWidth="2.4" />
        <text
          x="26"
          y="17"
          fill="#FFFFFF"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="15"
          fontWeight="900"
          letterSpacing="-0.5"
        >
          elo
        </text>
      </svg>
    </div>
  );
}

// 6. Hipercard
export function HipercardBadge({ className = "h-5" }: { className?: string }) {
  return (
    <div className="bg-[#B31017] rounded-xs px-2 py-1 flex items-center justify-center shadow-xs border border-red-800 hover:brightness-110 transition-all h-7 min-w-[58px]">
      <svg className={className} viewBox="0 0 76 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text
          x="3"
          y="17"
          fill="#FFFFFF"
          fontFamily="Impact, sans-serif, -apple-system"
          fontSize="18"
          fontStyle="italic"
          fontWeight="900"
          letterSpacing="0.5"
        >
          HIPERCARD
        </text>
      </svg>
    </div>
  );
}

// 7. American Express (Amex)
export function AmexBadge({ className = "h-5" }: { className?: string }) {
  return (
    <div className="bg-[#016FD0] rounded-xs px-2 py-0.5 flex items-center justify-center shadow-xs border border-blue-600 hover:brightness-110 transition-all h-7 min-w-[52px]">
      <svg className={className} viewBox="0 0 64 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="62" height="20" rx="2" stroke="white" strokeWidth="1.2" fill="none" />
        <text
          x="6"
          y="15.5"
          fill="#FFFFFF"
          fontFamily="Arial Black, Impact, sans-serif"
          fontSize="12.5"
          fontWeight="900"
          letterSpacing="1.2"
        >
          AMEX
        </text>
      </svg>
    </div>
  );
}

// 8. PayPal
export function PayPalBadge({ className = "h-4" }: { className?: string }) {
  return (
    <div className="bg-white rounded-xs px-2 py-1 flex items-center justify-center shadow-xs border border-neutral-200 hover:border-neutral-400 transition-colors h-7 min-w-[62px]">
      <svg className={className} viewBox="0 0 74 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Duplo P característico */}
        <path
          d="M8.5 2.5H3.5C3.2 2.5 3 2.7 2.9 3L0.8 16.3C0.8 16.5 0.9 16.7 1.1 16.7H3.9L4.9 10.3C5 10 5.2 9.8 5.5 9.8H7.3C10.7 9.8 12.8 8.1 13.3 4.8C13.5 3.5 13.1 2.5 12.2 2.5H8.5Z"
          fill="#003087"
        />
        <path
          d="M12.5 6.5C12.3 8 11.2 9.2 9.5 9.2H7.7C7.4 9.2 7.2 9.4 7.1 9.7L5.7 18.5C5.7 18.7 5.8 18.9 6 18.9H8.8L9.6 13.9C9.7 13.6 9.9 13.4 10.2 13.4H11.5C14.5 13.4 16.3 11.9 16.8 9C17 7.9 16.7 7 15.9 6.5H12.5Z"
          fill="#0079C1"
        />
        <text
          x="22"
          y="16"
          fill="#003087"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="13"
          fontWeight="900"
          fontStyle="italic"
        >
          Pay
        </text>
        <text
          x="46"
          y="16"
          fill="#0079C1"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="13"
          fontWeight="900"
          fontStyle="italic"
        >
          Pal
        </text>
      </svg>
    </div>
  );
}

// Componente agregado com todos os selos
export default function PaymentBadgesRow() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <PixBadge />
      <MercadoPagoBadge />
      <VisaBadge />
      <MastercardBadge />
      <EloBadge />
      <HipercardBadge />
      <AmexBadge />
      <PayPalBadge />
    </div>
  );
}
