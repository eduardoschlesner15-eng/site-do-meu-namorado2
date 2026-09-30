"use client";

import { useEffect, useState } from "react";

export default function InteractiveBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      setMousePosition({ x: ev.clientX, y: ev.clientY });
    };
    
    window.addEventListener("mousemove", updateMousePosition);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
    };
  }, []);

  return (
    <>
      {/* Fundo Base Vermelho Vibrante */}
      <div className="fixed inset-0 z-[-3] w-full h-full bg-[#E0001B]" />
      
      {/* Padrão de Pontos (Halftone Dots) típico de quadrinhos/Persona 5 */}
      <div 
        className="fixed inset-0 z-[-2] opacity-30 mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #000 2px, transparent 2.5px)`,
          backgroundSize: '8px 8px'
        }}
      />

      {/* Faixas Gráficas Pretas em Ângulo (Estilo Rasgado/Dinâmico) */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        {/* Bloco preto principal na diagonal */}
        <div 
          className="absolute top-0 right-0 w-[120vw] h-[120vh] bg-[#0a0a0a]"
          style={{ 
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 35% 0)' 
          }}
        />
        {/* Faixa decorativa cortada */}
        <div 
          className="absolute bottom-10 left-[-10%] w-[120vw] h-32 bg-[#E0001B]"
          style={{ 
            clipPath: 'polygon(0 40%, 100% 0, 100% 60%, 0 100%)',
            transform: 'rotate(-5deg)'
          }}
        />
        {/* Bloco superior esquerdo para equilibrar */}
        <div 
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[40vh] bg-[#0a0a0a]"
          style={{ 
            clipPath: 'polygon(0 0, 100% 0, 60% 100%, 0 100%)' 
          }}
        />
      </div>

      {/* Lanterna que segue o mouse (agora em branco/vermelho para combinar) */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-75"
        style={{
          background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.05), transparent 30%)`
        }}
      />
    </>
  );
}
