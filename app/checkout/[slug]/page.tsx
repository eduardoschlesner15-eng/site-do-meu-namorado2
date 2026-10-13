import { getProductBySlug } from "@/lib/data";
import CheckoutFlow from "@/components/CheckoutFlow";
import ModelViewer from "@/components/ModelViewer";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return [
    { slug: "n-1-light-style" },
    { slug: "cigarreira-corta-tapa" },
  ];
}

export default async function CheckoutPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return (
      <div className="text-center py-20 font-bold uppercase text-gray-500">
        PRODUTO NÃO ENCONTRADO
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start max-w-7xl mx-auto px-4 md:px-8 py-8 w-full bg-white text-black">
      
      {/* Coluna da Esquerda: Resumo Visual do Item */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <div className="border clean-border bg-[#fafafa] p-6 flex flex-col gap-3 rounded-xs">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#cc0000]">Item no Carrinho</span>
          <h2 className="text-xl font-black uppercase border-b clean-border pb-3">{product.name}</h2>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-bold uppercase">Categoria:</span>
            <span className="font-bold">{product.category}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-bold uppercase">Formato 3D:</span>
            <span className="font-bold bg-white border border-gray-200 px-2 py-0.5 rounded-xs">{product.compat}</span>
          </div>
          <div className="flex justify-between items-center text-base border-t clean-border pt-3">
            <span className="font-bold uppercase">Subtotal:</span>
            <span className="font-black text-lg text-black">R$ 10,00</span>
          </div>
        </div>

        <div className="h-[260px] sm:h-[300px] w-full border clean-border bg-[#f5f5f5] relative rounded-xs overflow-hidden">
          <ModelViewer url={product.fileUrl} type={product.fileType} />
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white/90 px-3 py-1 rounded-full">
            Visualização 360°
          </span>
        </div>
      </div>

      {/* Coluna da Direita: Fluxo Completo de Checkout */}
      <div className="w-full lg:w-2/3">
        <CheckoutFlow 
          productName={product.name} 
          price="10.00" 
          productSlug={product.slug}
          fileUrl={product.fileUrl}
          fileType={product.fileType}
        />
      </div>
    </div>
  );
}
