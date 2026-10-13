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

  if (!product) return <div className="text-center py-20 font-mono text-white">PRODUTO NÃO ENCONTRADO</div>;

  return (
    <div className="flex flex-col xl:flex-row gap-8 items-start max-w-7xl mx-auto px-4 py-10 w-full">
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="neon-border bg-black/60 p-6 flex flex-col gap-2">
          <h2 className="text-xl font-bold neon-text border-b border-neon-green/50 pb-2">RESUMO DO PEDIDO</h2>
          <p className="text-lg text-white">{product.name}</p>
          <p className="text-neon-green font-mono">R$ 10,00</p>
        </div>
        <div className="h-[300px] w-full neon-border bg-black/40 relative">
          <ModelViewer url={product.fileUrl} type={product.fileType} />
        </div>
      </div>
      <div className="w-full xl:w-2/3">
         <CheckoutFlow productName={product.name} price="10.00" />
      </div>
    </div>
  );
}
