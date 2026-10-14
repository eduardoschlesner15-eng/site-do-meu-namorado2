"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  getCartItems, 
  removeFromCart, 
  updateCartQuantity, 
  addToCart, 
  CartItem 
} from "@/lib/store";

export default function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);

  const refreshCart = () => {
    setItems(getCartItems());
  };

  useEffect(() => {
    refreshCart();

    const handleOpen = () => {
      refreshCart();
      setIsOpen(true);
    };

    const handleClose = () => {
      setIsOpen(false);
    };

    const handleUpdate = () => {
      refreshCart();
    };

    window.addEventListener("open_cart_drawer", handleOpen);
    window.addEventListener("close_cart_drawer", handleClose);
    window.addEventListener("cart_updated", handleUpdate);

    // Fechar ao pressionar ESC
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("open_cart_drawer", handleOpen);
      window.removeEventListener("close_cart_drawer", handleClose);
      window.removeEventListener("cart_updated", handleUpdate);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Bloqueia scroll do body quando a sacola estiver aberta
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const freeShippingThreshold = 199;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  // Quick add para popular a sacola caso esteja vazia
  const handleAddSampleItem = () => {
    addToCart({
      id: "cigarreira-corta-tapa",
      name: "Cigarreira Corta Tapa 3D",
      slug: "cigarreira-corta-tapa",
      price: 39.9,
      quantity: 1,
      fileType: "stl",
      fileUrl: "/model.stl",
      category: "HANDSHOP",
    });
  };

  const primarySlug = items[0]?.slug || "cigarreira-corta-tapa";

  return (
    <>
      {/* Backdrop escuro com transição suave */}
      <div 
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Lateral deslizante (Estilo Vans Brasil Sacola) */}
      <aside 
        className={`fixed top-0 right-0 h-full w-full sm:w-[440px] max-w-full bg-white z-50 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Sacola de compras"
      >
        
        {/* TOPO: Título da Sacola & Botão Fechar */}
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black tracking-tight text-neutral-900 font-sans uppercase">
              Sacola de compras
            </h2>
            <span className="text-xs font-bold text-neutral-500">
              ({totalItems} {totalItems === 1 ? "item" : "itens"})
            </span>
          </div>

          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors text-lg font-bold"
            aria-label="Fechar sacola"
          >
            ✕
          </button>
        </div>

        {/* BARRA DE PROGRESSO DO FRETE GRÁTIS */}
        <div className="bg-neutral-50 px-5 py-3 border-b border-neutral-200 text-xs">
          {subtotal >= freeShippingThreshold ? (
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <span>🎉</span>
              <span>Parabéns! Você ganhou <strong>FRETE GRÁTIS</strong>!</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className="text-neutral-700 font-medium">
                Faltam <strong>R$ {remainingForFreeShipping.toFixed(2).replace(".", ",")}</strong> para <strong>FRETE GRÁTIS</strong>
              </span>
              <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-black h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* CORPO: LISTA DE ITENS NA SACOLA */}
        <div className="flex-1 overflow-y-auto px-5 py-4 divide-y divide-neutral-200">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 gap-4 text-neutral-500">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-2xl">
                🛍️
              </div>
              <div>
                <p className="font-black text-sm uppercase text-neutral-900">Sua sacola está vazia</p>
                <p className="text-xs text-neutral-500 mt-1">Nenhum produto foi adicionado ainda.</p>
              </div>
              <button
                type="button"
                onClick={handleAddSampleItem}
                className="mt-2 bg-black hover:bg-neutral-800 text-white px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xs transition-colors shadow-xs"
              >
                + Adicionar Cigarreira Corta Tapa
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="py-4.5 first:pt-2 last:pb-2 flex gap-4 items-start">
                
                {/* Miniatura do Produto (Bege/Neutro no estilo Vans) */}
                <div className="w-20 h-20 sm:w-22 sm:h-22 bg-[#ebe7df] rounded-xs flex-shrink-0 flex items-center justify-center relative p-2 overflow-hidden border border-neutral-200/60">
                  <span className="text-2xl">📦</span>
                  <span className="absolute bottom-1 right-1 text-[9px] bg-black/80 text-white px-1 font-mono uppercase rounded-2xs font-bold">
                    3D
                  </span>
                </div>

                {/* Detalhes do Produto */}
                <div className="flex-1 flex flex-col justify-between min-h-[80px]">
                  
                  {/* Linha 1: Título e Botão Excluir */}
                  <div className="flex items-start justify-between gap-2">
                    <Link 
                      href={`/produto/${item.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="font-black text-xs sm:text-sm text-neutral-900 uppercase hover:text-[#cc0000] transition-colors line-clamp-2 leading-snug"
                    >
                      {item.name}
                    </Link>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                      title="Remover item da sacola"
                      aria-label="Remover item"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Preço Unitário */}
                  <div className="mt-1">
                    <span className="font-black text-xs sm:text-sm text-neutral-900">
                      R$ {item.price.toFixed(2).replace(".", ",")}
                    </span>
                  </div>

                  {/* Atributos / Especificações */}
                  <div className="text-[11px] text-neutral-500 mt-1 flex flex-col gap-0.5">
                    <span>Acabamento: <strong>Físico Impresso em Resina/PLA</strong></span>
                    <span>Categoria: <strong className="uppercase">{item.category}</strong></span>
                  </div>

                  {/* Quantidade (+ e -) */}
                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="flex items-center border border-neutral-300 rounded-xs bg-white">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 font-bold transition-colors"
                        title="Diminuir quantidade"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-black text-neutral-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 font-bold transition-colors"
                        title="Aumentar quantidade"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-[11px] font-bold text-neutral-500">
                      Total: R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                    </span>
                  </div>

                </div>

              </div>
            ))
          )}
        </div>

        {/* RODAPÉ FIXO: SUB-TOTAL E BOTÃO FINALIZAR COMPRA */}
        <div className="p-5 border-t border-neutral-200 bg-white shadow-lg flex flex-col gap-3">
          
          {/* Subtotal */}
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
              Subtotal:
            </span>
            <span className="text-lg font-black text-neutral-900">
              R$ {subtotal.toFixed(2).replace(".", ",")}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-500">
            <span>Frete e descontos:</span>
            <span>Calculados no checkout</span>
          </div>

          {/* Botão Finalizar Compra (Estilo Vans Brasil Preto Full) */}
          <Link
            href={`/checkout/${primarySlug}`}
            onClick={() => setIsOpen(false)}
            className={`w-full py-4 text-center font-black text-xs uppercase tracking-widest transition-all rounded-xs shadow-md flex items-center justify-center gap-2 ${
              items.length === 0
                ? "bg-neutral-300 text-neutral-500 pointer-events-none"
                : "bg-black hover:bg-[#cc0000] text-white active:scale-[0.99]"
            }`}
          >
            <span>Finalizar Pedido</span>
            <span>➔</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-center text-[11px] font-bold uppercase tracking-wider text-neutral-500 hover:text-black transition-colors py-1"
          >
            Continuar comprando
          </button>

          {/* Micro Selo de Confiança */}
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-center gap-3 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
            <span>🔒 Checkout Seguro</span>
            <span>•</span>
            <span>⚡ Pix 5% OFF</span>
            <span>•</span>
            <span>🚚 Correios</span>
          </div>

        </div>

      </aside>
    </>
  );
}
