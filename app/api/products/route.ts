import { NextResponse } from 'next/server';

export const dynamic = "force-static";

export async function GET() {
  const products = [
    {
      id: "prod-001",
      name: "N 1 LIGHT STYLE",
      category: "LUMINÁRIA",
      description: "Uma luminária com estética moderna e traços marcantes, perfeita para iluminação de mesa ou setups cyberpunk. Renderização de malha de alta qualidade. Compatível com impressão 3D.",
      fileUrl: "/models/luminaria/n 1 light style.fbx",
      fileType: "fbx",
      compat: "FBX"
    },
    {
      id: "prod-002",
      name: "CIGARREIRA CORTA TAPA",
      category: "HANDSHOP",
      description: "Estética Y2K e funcionalidade. Um design limpo e ergonômico, ideal para impressões rápidas em resina ou filamento. Modelo otimizado e modular.",
      fileUrl: "/model.stl",
      fileType: "stl",
      compat: "STL / OBJ"
    }
  ];

  return NextResponse.json(products);
}
