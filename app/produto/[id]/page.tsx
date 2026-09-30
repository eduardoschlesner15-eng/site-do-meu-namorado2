import { getProductBySlug } from "@/lib/data";
import ModelViewer from "@/components/ModelViewer";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductBySlug(id);

  if (!product) {
    return <div className="text-center py-20 text-gray-500 font-bold uppercase">PRODUTO NÃO ENCONTRADO</div>;
  }

  return (
    <div className="flex flex-col xl:flex-row gap-10 items-start max-w-7xl mx-auto px-4 md:px-8 py-10 w-full bg-white text-black">
      {/* 3D Viewer Section (Acts as the Product Image Gallery) */}
      <div className="flex-1 w-full flex flex-col gap-4">
        <div className="h-[60vh] md:h-[700px] w-full bg-[#f5f5f5] relative border clean-border">
          <ModelViewer url={product.fileUrl} type={product.fileType} />
        </div>
        <div className="flex justify-center">
          <span className="text-xs text-gray-500 font-bold uppercase tracking-widest bg-gray-100 px-4 py-2">
            Arraste para visualizar em 360°
          </span>
        </div>
      </div>

      {/* Product Details Section */}
      <div className="w-full xl:w-[450px] flex flex-col gap-6 pt-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
            {product.name}
          </h1>
          <p className="text-2xl font-bold">R$ 10,00</p>
          <p className="text-sm text-gray-500 mt-1">Em até 2x de R$ 5,00 sem juros</p>
        </div>
        
        <div className="border-t border-b border-gray-200 py-6 my-2">
          <p className="text-sm text-gray-700 leading-relaxed">
            {product.description}
          </p>
        </div>
        
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <span className="text-gray-500 font-bold uppercase">Categoria</span>
            <span className="font-bold">{product.category}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <span className="text-gray-500 font-bold uppercase">Formato</span>
            <span className="font-bold bg-gray-100 px-2 py-1">{product.compat}</span>
          </div>
        </div>

        <a 
          href={`/checkout/${product.slug}`}
          className="text-center mt-6 bg-black text-white py-4 font-bold uppercase tracking-wider hover:bg-[#cc0000] transition-colors w-full shadow-lg"
        >
          COMPRAR AGORA
        </a>
        
        <div className="text-xs text-gray-400 text-center uppercase tracking-widest mt-2">
          Download imediato após aprovação
        </div>
      </div>
    </div>
  );
}
