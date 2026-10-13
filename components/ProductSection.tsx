"use client";

import { motion } from "framer-motion";
import ModelViewer from "./ModelViewer";
import { Product } from "@/lib/data";

export default function ProductSection({ product, index }: { product: Product; index: number }) {
  const isEven = index % 2 === 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className={`flex flex-col ${isEven ? 'xl:flex-row' : 'xl:flex-row-reverse'} gap-8 items-center w-full min-h-[80vh] py-20 border-b border-neon-green/20`}
    >
      {/* 3D Viewer Section */}
      <div className="flex-1 w-full max-w-2xl flex flex-col gap-4">
        <div className="h-[400px] xl:h-[600px] w-full neon-border relative bg-black/40 shadow-neon overflow-hidden">
          {/* We could use intersection observer to only render canvas when in view for performance, but whileInView handles the whole div. The Canvas itself will be mounted. */}
          <ModelViewer url={product.fileUrl} type={product.fileType} />
        </div>
      </div>

      {/* Product Panel Section */}
      <div className="w-full xl:w-[400px] flex flex-col gap-6">
        <motion.div 
          initial={{ opacity: 0, x: isEven ? 50 : -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="neon-border p-6 bg-black/60 backdrop-blur-md flex flex-col gap-4"
        >
          <div className="flex justify-between items-end border-b border-neon-green/50 pb-2">
            <h3 className="text-2xl font-bold neon-text">{product.name}</h3>
            <span className="text-xs opacity-70">[{product.id}]</span>
          </div>
          
          <p className="text-sm opacity-90 leading-relaxed font-sans mb-4">
            {product.description}
          </p>
          
          <div className="flex flex-col gap-2 font-mono text-sm border-t border-neon-green/30 pt-4">
            <div className="flex justify-between">
              <span className="opacity-70">CATEGORIA:</span>
              <span className="text-neon-green">{product.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">COMPAT:</span>
              <span>{product.compat}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">STATUS:</span>
              <span className="font-bold text-green-400">PEÇA FÍSICA EM ESTOQUE</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-6">
            <a 
              href={`/produto/${product.slug}`}
              className="text-center border border-neon-green py-3 font-bold text-sm hover:bg-neon-green hover:text-black transition-colors"
            >
              VER DETALHES DO PRODUTO
            </a>
            <a 
              href={`/checkout/${product.slug}`}
              className="text-center border-2 border-neon-green py-4 font-bold text-lg hover:bg-neon-green hover:text-black transition-colors shadow-neon block"
            >
              COMPRAR AGORA
            </a>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
