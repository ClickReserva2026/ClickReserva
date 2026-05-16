import React from "react";
import { Logo } from "../components/logo"; // Ajustado o caminho para buscar a logo na pasta de componentes

export default function LoginPage() {
  // Evita que a imagem quebre ao fazer o deploy no Render
  const base = typeof window !== "undefined" ? (import.meta.env.BASE_URL ?? "").replace(/\/$/, "") : "";

  return (
    <div className="min-h-screen w-screen bg-[#0f766e] flex items-center justify-center p-4 font-sans antialiased">
      
      {/* CARD BRANCO CENTRAL */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 flex flex-col items-center">
        
        {/* CONTAINER DA LOGO - Otimizado para o SVG */}
        <div className="w-full max-w-[240px] mb-8 flex flex-col items-center justify-center gap-2">
          <Logo className="h-12 w-auto" />
        </div>

        {/* BOTÕES DE ACESSO */}
        <div className="w-full space-y-3">
          <button className="w-full bg-[#115e59] hover:bg-[#134e4a] text-white font-medium py-3 rounded-lg text-sm transition-colors shadow-md">
            Login
          </button>
          
          <button className="w-full bg-white hover:bg-slate-50 text-slate-800 font-medium py-3 rounded-lg text-sm transition-colors border border-slate-200 shadow-sm">
            Criar conta
          </button>
        </div>

        {/* INFORMAÇÕES DA ESCOLA (Rodapé do Card) */}
        <div className="w-full mt-8 pt-5 border-t border-slate-100 text-center">
          <p className="text-sm font-semibold text-slate-800">
            Bem-vindo ao sistema de reservas!
          </p>
          <p className="text-xs text-teal-700 font-medium mt-1">
            C.E. Prof. Mário B.T. Braga
          </p>
        </div>

      </div>
    </div>
  );
}
