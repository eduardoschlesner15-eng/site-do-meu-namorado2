"use client";

import { addToCart, openCartDrawer } from "@/lib/store";
import Link from "next/link";

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
  const handleAddToCart = () => {
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
    <div className="flex flex-col gap-2.5 mt-6 w-full">
      <button
        type="button"
        onClick={handleAddToCart}
        className="text-center bg-black hover:bg-[#cc0000] text-white py-4 font-black text-xs uppercase tracking-widest transition-colors w-full shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] rounded-xs"
      >
        <span>🛍️</span>
        <span>Adicionar à Sacola</span>
      </button>

      <Link
        href={`/checkout/${product.slug}`}
        className="text-center bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 py-3 font-bold text-xs uppercase tracking-wider transition-colors w-full rounded-xs flex items-center justify-center gap-2"
      >
        <span>Comprar Agora (Checkout Rápido)</span>
        <span>➔</span>
      </Link>
    </div>
  );
}
