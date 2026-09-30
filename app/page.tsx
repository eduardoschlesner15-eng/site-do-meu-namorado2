import { getProducts } from "@/lib/data";
import ModelViewer from "@/components/ModelViewer";

export default async function Home() {
  const products = await getProducts();
  const featuredProduct = products[1];

  return (
    <div className="flex flex-col w-full min-h-screen bg-white">
      
      {/* Hero Banner Slider (Swipeable/Draggable) */}
      <section className="relative w-full h-[70vh] bg-[#f5f5f5] overflow-hidden group">
        <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar cursor-grab active:cursor-grabbing">
          
          {/* Slide 1: 3D Product Highlight */}
          <div className="w-screen h-full flex-shrink-0 snap-center flex items-center justify-center relative">
            <div className="absolute inset-0 bg-white opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #e5e5e5 25%, transparent 25%, transparent 75%, #e5e5e5 75%, #e5e5e5), repeating-linear-gradient(45deg, #e5e5e5 25%, #f5f5f5 25%, #f5f5f5 75%, #e5e5e5 75%, #e5e5e5)', backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px' }}></div>
            
            <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center relative z-10 px-4 md:px-8">
              <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-6">
                <span className="bg-[#cc0000] text-white px-3 py-1 font-bold text-xs uppercase tracking-widest">Nova Coleção</span>
                <h1 className="text-5xl md:text-7xl font-black uppercase text-black leading-none">
                  DESIGN <br />
                  INDUSTRIAL
                </h1>
                <p className="text-lg text-gray-600 max-w-md font-medium">
                  Conheça nossa nova linha de objetos 3D. Precisão milimétrica e durabilidade.
                </p>
                <a href={`/produto/${featuredProduct.slug}`} className="mt-4 bg-black text-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-[#cc0000] transition-colors">
                  Comprar Agora
                </a>
              </div>
              <div className="flex-1 w-full h-[40vh] md:h-[60vh] relative cursor-move mt-10 md:mt-0">
                <ModelViewer url={featuredProduct.fileUrl} type={featuredProduct.fileType} />
              </div>
            </div>
          </div>

          {/* Slide 2: Vans-style Promo Banner */}
          <div className="w-screen h-full flex-shrink-0 snap-center relative flex items-center justify-center bg-black overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-0"></div>
            {/* Background Image Placeholder */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-luminosity z-[-1]"></div>
            
            <div className="relative z-10 text-center flex flex-col items-center px-4">
              <h2 className="text-4xl md:text-6xl font-bold text-white uppercase tracking-tight mb-8">
                15% OFF Extra em<br/>Últimas Unidades
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-0 border border-white/50 rounded-full overflow-hidden mb-6">
                <span className="px-6 py-3 text-white text-sm tracking-widest border-b sm:border-b-0 sm:border-r border-white/50">CUPOM</span>
                <span className="px-6 py-3 text-white font-bold text-lg tracking-widest bg-white/10 backdrop-blur-sm">ULTIMASUNIDADES</span>
              </div>
              <p className="text-xs text-gray-400 mb-8 max-w-lg">
                *Válido por tempo limitado. Apenas itens selecionados. Não válido nas modalidades Retire/Entregue pela loja.
              </p>
              <a href="/" className="text-white font-medium underline underline-offset-8 hover:text-[#cc0000] transition-colors">
                Comprar Agora
              </a>
            </div>
          </div>

          {/* Slide 3: Brand Highlight */}
          <div className="w-screen h-full flex-shrink-0 snap-center relative flex items-center justify-center bg-[#cc0000]">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
            <div className="relative z-10 text-center flex flex-col items-center px-4">
              <h2 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter mb-6">
                IMPRESSÃO 3D<br/>ELEVADA
              </h2>
              <p className="text-white/90 text-lg md:text-2xl font-medium max-w-2xl mb-8">
                Materiais de alta performance. Design que funciona.
              </p>
              <a href="/categoria/handshop" className="bg-white text-black px-10 py-4 font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors">
                Explorar Handshop
              </a>
            </div>
          </div>

        </div>

        {/* Carousel Navigation Arrows (Visual only to hint sliding) */}
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-md flex items-center justify-center rounded-full text-white">❮</div>
        </div>
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-md flex items-center justify-center rounded-full text-white">❯</div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="w-full py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-black text-center uppercase mb-10">Compre por Categoria</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a href="/categoria/luminaria" className="group relative aspect-square bg-[#e8e8e8] flex items-center justify-center overflow-hidden hover:opacity-90 transition-opacity">
            <span className="text-3xl font-black uppercase z-10 group-hover:scale-110 transition-transform">Luminárias</span>
            <div className="absolute bottom-6 left-6 right-6">
              <span className="text-sm font-bold underline">VER PRODUTOS</span>
            </div>
          </a>
          <a href="/categoria/handshop" className="group relative aspect-square bg-[#e0e0e0] flex items-center justify-center overflow-hidden hover:opacity-90 transition-opacity">
            <span className="text-3xl font-black uppercase z-10 group-hover:scale-110 transition-transform">Handshop</span>
            <div className="absolute bottom-6 left-6 right-6">
              <span className="text-sm font-bold underline">VER PRODUTOS</span>
            </div>
          </a>
        </div>
      </section>

      {/* Promo Banners Secundários (Grid 2 colunas) */}
      <section className="w-full py-10 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Banner 1 */}
          <div className="relative border clean-border bg-[#f8f8f8] flex items-center p-6 md:p-10 overflow-hidden group min-h-[250px]">
            {/* Background Accent */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[#cc0000] opacity-10 -skew-x-12 transform origin-bottom group-hover:scale-110 transition-transform duration-500"></div>
            
            <div className="relative z-10 flex flex-col items-start w-full">
              <span className="text-[#cc0000] font-bold text-xs uppercase tracking-widest mb-2">Novo Serviço</span>
              <h3 className="text-2xl md:text-4xl font-black uppercase text-black mb-3 leading-none">IMPRESSÃO 3D<br/>SOB MEDIDA</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-sm">Traga o seu projeto. Nós transformamos em realidade com precisão milimétrica.</p>
              <button className="bg-black text-white px-6 py-2 font-bold uppercase text-xs hover:bg-[#cc0000] transition-colors border border-black mt-auto">
                FAZER ORÇAMENTO
              </button>
            </div>
          </div>

          {/* Banner 2 */}
          <div className="relative border border-[#cc0000] bg-white flex items-center p-6 md:p-10 overflow-hidden group min-h-[250px]">
            <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0ibTAgMGgyMHYyMEgwem0xMCAxMGgxMHYxMEgxMHoiIGZpbGw9IiNjYzAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wNSIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10 flex flex-col items-start w-full">
              <span className="text-black font-bold text-xs uppercase tracking-widest mb-2 border border-black px-2 py-1">Desconto Especial</span>
              <h3 className="text-2xl md:text-4xl font-black uppercase text-[#cc0000] mb-3 leading-none">SETUP DE<br/>MESA 20% OFF</h3>
              <p className="text-sm text-gray-700 mb-6 max-w-sm">Organize o seu espaço de trabalho com a nossa linha completa de Handshop.</p>
              <button className="bg-[#cc0000] text-white px-6 py-2 font-bold uppercase text-xs hover:bg-black transition-colors mt-auto">
                COMPRAR AGORA
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Best Sellers */}
      <section className="w-full py-16 px-4 md:px-8 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-3xl font-black uppercase">Mais Vendidos</h2>
            <a href="/" className="font-bold underline text-sm hover:text-[#cc0000]">Ver Todos</a>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <a key={product.id} href={`/produto/${product.slug}`} className="flex flex-col group">
                <div className="aspect-[4/5] bg-[#f7f7f7] mb-4 relative flex items-center justify-center overflow-hidden">
                  <span className="text-gray-400 font-medium">[{product.fileType.toUpperCase()}]</span>
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-black text-white px-6 py-2 font-bold uppercase text-sm">Visualizar</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold uppercase">{product.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                <span className="font-bold text-lg">R$ 10,00</span>
              </a>
            ))}
            {/* Duplicates to show a grid */}
            {products.map((product) => (
              <a key={product.id + "-dup"} href={`/produto/${product.slug}`} className="flex flex-col group">
                <div className="aspect-[4/5] bg-[#f7f7f7] mb-4 relative flex items-center justify-center overflow-hidden">
                  <span className="text-gray-400 font-medium">[{product.fileType.toUpperCase()}]</span>
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-black text-white px-6 py-2 font-bold uppercase text-sm">Visualizar</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold uppercase">{product.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                <span className="font-bold text-lg">R$ 10,00</span>
              </a>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
