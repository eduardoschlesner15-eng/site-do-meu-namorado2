export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  fileUrl: string;
  fileType: "stl" | "fbx";
  compat: string;
  slug: string; // url-friendly name
  price: number;
};

export const products: Product[] = [
  {
    id: "prod-001",
    name: "N 1 LIGHT STYLE",
    category: "LUMINÁRIA",
    description: "Uma luminária com estética moderna e traços marcantes, perfeita para iluminação de mesa ou setups cyberpunk. Renderização de malha de alta qualidade. Compatível com impressão 3D.",
    fileUrl: "/models/luminaria/n 1 light style.fbx",
    fileType: "fbx",
    compat: "FBX",
    slug: "n-1-light-style",
    price: 10.0,
  },
  {
    id: "prod-002",
    name: "CIGARREIRA CORTA TAPA",
    category: "HANDSHOP",
    description: "Estética Y2K e funcionalidade. Um design limpo e ergonômico, ideal para impressões rápidas em resina ou filamento. Modelo otimizado e modular.",
    fileUrl: "/model.stl",
    fileType: "stl",
    compat: "STL / OBJ",
    slug: "cigarreira-corta-tapa",
    price: 10.0,
  }
];

export async function getProducts() {
  return products;
}

export async function getProductBySlug(slug: string) {
  return products.find(p => p.slug === slug);
}

export async function getProductsByCategory(categorySlug: string) {
  const catMap: Record<string, string> = {
    'luminaria': 'LUMINÁRIA',
    'handshop': 'HANDSHOP'
  };
  const categoryName = catMap[categorySlug.toLowerCase()];
  if (!categoryName) return [];
  return products.filter(p => p.category === categoryName);
}
