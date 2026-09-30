import ProductSection from "@/components/ProductSection";
import { getProductsByCategory } from "@/lib/data";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const products = await getProductsByCategory(slug);
  
  const categoryName = slug.toUpperCase().replace("-", " ");

  return (
    <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4">
      <div className="min-h-[30vh] flex flex-col justify-center items-center text-center gap-4 border-b border-neon-green/30 w-full mb-10">
        <h1 className="text-4xl xl:text-6xl font-bold neon-text tracking-widest">{categoryName}</h1>
        <p className="text-lg font-mono max-w-2xl opacity-80">
          Resultados para a categoria {categoryName}.
        </p>
      </div>

      <div className="w-full flex flex-col">
        {products.length > 0 ? (
          products.map((product, index) => (
            <ProductSection key={product.id} product={product} index={index} />
          ))
        ) : (
          <div className="text-center py-20 font-mono text-white opacity-50">
            Nenhum produto encontrado nesta categoria.
          </div>
        )}
      </div>
    </div>
  );
}
