import { getProductBySlug } from "@/lib/data";
import ModelViewer from "@/components/ModelViewer";
import AddToCartButton from "@/components/AddToCartButton";

type Props = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return [
    { id: "n-1-light-style" },
    { id: "cigarreira-corta-tapa" },
  ];
}

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
          <p className="text-2xl font-bold">R$ {product.price.toFixed(2).replace(".", ",")}</p>
          <p className="text-sm text-gray-500 mt-1">Em até 2x de R$ {(product.price / 2).toFixed(2).replace(".", ",")} sem juros</p>
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
            <span className="text-gray-500 font-bold uppercase">Material & Acabamento</span>
            <span className="font-bold bg-gray-100 px-2 py-1">Peça Física em Alta Resolução</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <span className="text-gray-500 font-bold uppercase">Disponibilidade</span>
            <span className="font-bold text-green-700">Em Estoque / Pronta Entrega</span>
          </div>
        </div>

        <AddToCartButton 
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            fileType: product.fileType,
            fileUrl: product.fileUrl,
            category: product.category,
            price: product.price,
          }} 
        />
        
        <div className="text-xs text-gray-500 text-center uppercase tracking-widest mt-2 flex items-center justify-center gap-1.5">
          <span>🚚</span> Envio para todo o Brasil via Correios com Rastreio
        </div>
      </div>
    </div>
  );
}
