import { getProductBySlug } from "@/lib/data";
import CheckoutFlow from "@/components/CheckoutFlow";

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
      <div className="text-center py-20 font-bold uppercase text-neutral-500">
        PRODUTO NÃO ENCONTRADO
      </div>
    );
  }

  return (
    <div className="w-full bg-[#fbfbfb] min-h-screen text-black py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <CheckoutFlow 
          productName={product.name} 
          price="10.00" 
          productSlug={product.slug}
          fileUrl={product.fileUrl}
          fileType={product.fileType}
          category={product.category}
        />
      </div>
    </div>
  );
}
