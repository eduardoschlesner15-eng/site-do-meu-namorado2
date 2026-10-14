"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AuthModal from "./AuthModal";
import { getSavedUser, getCartItems, openCartDrawer, UserProfile } from "@/lib/store";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCurrentUser(getSavedUser());

    const updateCount = () => {
      const items = getCartItems();
      const count = items.reduce((acc, i) => acc + i.quantity, 0);
      setCartCount(count);
    };

    updateCount();

    const handleUserUpdate = () => {
      setCurrentUser(getSavedUser());
    };

    window.addEventListener("user_updated", handleUserUpdate);
    window.addEventListener("cart_updated", updateCount);

    return () => {
      window.removeEventListener("user_updated", handleUserUpdate);
      window.removeEventListener("cart_updated", updateCount);
    };
  }, []);

  return (
    <>
      {/* Top Promo Bar */}
      <div className="w-full bg-black text-white text-center py-2 px-4 text-[10px] sm:text-xs font-bold tracking-widest uppercase">
        FRETE GRÁTIS EM COMPRAS ACIMA DE R$ 199,00
      </div>

      {/* Main Header */}
      <header className="w-full border-b clean-border bg-white z-40 sticky top-0 shadow-xs">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 md:px-8 h-16 md:h-20">
          
          {/* Left: Mobile Hamburger & Search */}
          <div className="flex-1 flex gap-3 sm:gap-4 items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1 text-xl font-bold cursor-pointer hover:text-[#cc0000] transition-colors focus:outline-none"
              aria-label="Abrir Menu"
            >
              ☰
            </button>
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="cursor-pointer hover:text-[#cc0000] font-bold text-xs sm:text-sm tracking-wider uppercase flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline">BUSCAR</span>
            </button>
          </div>

          {/* Center: Brand Logo */}
          <Link 
            href="/" 
            className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-black tracking-tighter text-black uppercase text-center px-2 hover:opacity-80 transition-opacity whitespace-nowrap"
          >
            A LOJA DO MEU NAMORADO
          </Link>
          
          {/* Right: Cart & Account */}
          <div className="flex-1 flex gap-3 sm:gap-6 items-center justify-end text-xs sm:text-sm font-bold">
            <button 
              onClick={() => setIsAuthOpen(true)}
              className="hidden md:inline cursor-pointer hover:text-[#cc0000] transition-colors uppercase font-bold text-xs sm:text-sm"
            >
              {currentUser ? `OLÁ, ${currentUser.nome.split(" ")[0]}` : "ENTRAR"}
            </button>
            <button 
              type="button"
              onClick={() => openCartDrawer()}
              className="cursor-pointer hover:text-[#cc0000] transition-colors flex items-center gap-1.5 focus:outline-none"
              aria-label="Abrir sacola de compras"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>SACOLA <span className="text-[#cc0000]">({cartCount})</span></span>
            </button>
          </div>
        </div>

        {/* Dropdown Search Bar */}
        {isSearchOpen && (
          <div className="w-full bg-[#f9f9f9] border-t clean-border px-4 py-3 flex items-center justify-center animate-fadeIn">
            <div className="max-w-2xl w-full flex items-center gap-2">
              <input 
                type="text" 
                placeholder="O QUE VOCÊ ESTÁ PROCURANDO? (ex: luminária, cigarreira...)" 
                className="w-full bg-white border border-gray-300 px-4 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider outline-none focus:border-black"
                autoFocus
              />
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="text-xs font-bold uppercase text-gray-500 hover:text-black px-2 py-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        {/* Desktop Main Navigation */}
        <nav className="hidden md:flex justify-center gap-10 text-sm font-bold tracking-wider px-8 py-3 border-t clean-border">
          <Link href="/categoria/luminaria" className="hover:text-[#cc0000] transition-colors uppercase">Luminárias</Link>
          <Link href="/categoria/handshop" className="hover:text-[#cc0000] transition-colors uppercase">Handshop</Link>
          <Link href="/" className="text-[#cc0000] hover:text-black transition-colors uppercase">Lançamentos</Link>
          <Link href="/#mais-vendidos" className="hover:text-[#cc0000] transition-colors uppercase">Mais Vendidos</Link>
        </nav>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-[85%] max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-slideRight">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <span className="font-black text-sm uppercase tracking-tight">MENU</span>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-gray-100 rounded-full"
                  aria-label="Fechar Menu"
                >
                  ✕
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col py-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openCartDrawer();
                  }}
                  className="px-6 py-4 font-black uppercase text-base border-b border-gray-100 hover:bg-gray-50 hover:text-[#cc0000] flex justify-between items-center text-left w-full cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span>🛍️ Sacola de Compras</span>
                    <span className="text-xs bg-[#cc0000] text-white px-2 py-0.5 rounded-full font-bold">
                      {cartCount}
                    </span>
                  </div>
                  <span className="text-gray-400">›</span>
                </button>
                <Link 
                  href="/categoria/luminaria" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-6 py-4 font-black uppercase text-base border-b border-gray-100 hover:bg-gray-50 hover:text-[#cc0000] flex justify-between items-center"
                >
                  <span>Luminárias</span>
                  <span className="text-gray-400">›</span>
                </Link>
                <Link 
                  href="/categoria/handshop" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-6 py-4 font-black uppercase text-base border-b border-gray-100 hover:bg-gray-50 hover:text-[#cc0000] flex justify-between items-center"
                >
                  <span>Handshop</span>
                  <span className="text-gray-400">›</span>
                </Link>
                <Link 
                  href="/" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-6 py-4 font-black uppercase text-base border-b border-gray-100 hover:bg-gray-50 text-[#cc0000] flex justify-between items-center"
                >
                  <span>Lançamentos</span>
                  <span className="text-[#cc0000]">›</span>
                </Link>
                <Link 
                  href="/#mais-vendidos" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-6 py-4 font-black uppercase text-base border-b border-gray-100 hover:bg-gray-50 hover:text-[#cc0000] flex justify-between items-center"
                >
                  <span>Mais Vendidos</span>
                  <span className="text-gray-400">›</span>
                </Link>
              </nav>

              {/* Extra Support Links */}
              <div className="px-6 py-4 flex flex-col gap-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsAuthOpen(true);
                  }}
                  className="text-left font-bold hover:text-black uppercase cursor-pointer"
                >
                  {currentUser ? `Minha Conta (${currentUser.nome.split(" ")[0]})` : "Minha Conta / Entrar"}
                </button>
                <a 
                  href="https://wa.me/5555999576823?text=Ol%C3%A1!%20Gostaria%20de%20tirar%20uma%20d%C3%BAvida%20sobre%20um%20pedido%20ou%20produto." 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-[#cc0000] flex items-center gap-1.5 text-emerald-700 font-bold"
                >
                  <span>💬</span> WhatsApp: (55) 99957-6823
                </a>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex flex-col gap-2">
              <span className="font-bold text-black uppercase">A Loja Do Meu Namorado</span>
              <p>Design industrial & modelagem 3D sob medida.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Autenticação / Cadastro / Perfil */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
