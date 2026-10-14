import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "A LOJA DO MEU NAMORADO | Oficial",
  description: "Loja Oficial - Impressões 3D, Design Industrial e Cultura Hardware.",
};

import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className="antialiased min-h-screen flex flex-col bg-white text-black">
        <Header />
        <CartDrawer />

        <main className="flex-1 flex flex-col">
          {children}
        </main>

        {/* Mega Footer (E-commerce Style) */}
        <footer className="w-full bg-black text-white pt-16 pb-8 px-4 md:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 border-b border-gray-800 pb-12">
            
            {/* Column 1: Categorias */}
            <div className="flex flex-col gap-4">
              <h4 className="font-bold uppercase tracking-wider text-sm mb-2">Categorias</h4>
              <a href="/categoria/luminaria" className="text-gray-400 hover:text-white text-sm transition-colors">Luminárias</a>
              <a href="/categoria/handshop" className="text-gray-400 hover:text-white text-sm transition-colors">Handshop</a>
              <a href="/" className="text-gray-400 hover:text-white text-sm transition-colors">Lançamentos</a>
              <a href="/" className="text-gray-400 hover:text-white text-sm transition-colors">Mais Vendidos</a>
            </div>

            {/* Column 2: Ajuda e Suporte */}
            <div className="flex flex-col gap-4">
              <h4 className="font-bold uppercase tracking-wider text-sm mb-2">Ajuda e Suporte</h4>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Central de Atendimento</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Formas de Pagamento</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Formas de Entrega</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Meus Pedidos</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Política de Devolução</a>
            </div>

            {/* Column 3: Sobre Nós */}
            <div className="flex flex-col gap-4">
              <h4 className="font-bold uppercase tracking-wider text-sm mb-2">Sobre Nós</h4>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Nossa História</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Sustentabilidade</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Trabalhe Conosco</a>
            </div>

            {/* Column 4: Redes & Newsletter */}
            <div className="flex flex-col gap-4">
              <h4 className="font-bold uppercase tracking-wider text-sm mb-2">Fique por Dentro</h4>
              <p className="text-gray-400 text-sm">Receba novidades e promoções exclusivas.</p>
              <div className="flex mt-2">
                <input type="email" placeholder="Seu e-mail" className="bg-white text-black px-4 py-2 w-full text-sm outline-none" />
                <button className="bg-[#cc0000] text-white px-4 py-2 font-bold uppercase text-sm hover:bg-red-800 transition-colors">Assinar</button>
              </div>
              <div className="flex gap-4 mt-6">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer hover:opacity-80"><span className="text-black font-bold text-xs">IG</span></div>
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer hover:opacity-80"><span className="text-black font-bold text-xs">TT</span></div>
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer hover:opacity-80"><span className="text-black font-bold text-xs">YT</span></div>
              </div>
            </div>
          </div>

          {/* Copyright Area */}
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mt-8 text-xs text-gray-500 gap-4">
            <p>© 2026 A Loja do Meu Namorado. Todos os direitos reservados.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Política de Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
