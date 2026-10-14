"use client";

import { addToCart, openCartDrawer } from "@/lib/store";

type Props = {
  product: {
    id: string;
    name: string;
    slug: string;
    fileType: "stl" | "fbx";
    fileUrl: string;
    category: string;
    price?: number;
  };
};

export default function AddToCartButton({ product }: Props) {
  const handleBuy = () => {
    addToCart({
      id: product.slug,
      name: product.name,
      slug: product.slug,
      price: product.price || 39.9,
      quantity: 1,
      fileType: product.fileType,
      fileUrl: product.fileUrl,
      category: product.category,
    });
    openCartDrawer();
  };

  return (
    <div className="mt-6 w-full">
      <button
        type="button"
        onClick={handleBuy}
        className="w-full text-center bg-black hover:bg-[#cc0000] text-white py-4 font-black text-sm uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] rounded-xs"
      >
        <span>COMPRAR</span>
        <span>➔</span>
      </button>
    </div>
  );
}
