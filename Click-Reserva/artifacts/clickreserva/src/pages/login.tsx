import { useLocation } from "wouter";
import { ESCOLA } from "@/escola.config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export function LoginPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-screen flex items-center justify-center px-4 font-sans antialiased"
         style={{ background: "linear-gradient(135deg, #064e3b 0%, #059669 100%)" }}>
      
      <div className="w-full max-w-md relative z-10">
        
        {/* ── SEÇÃO SUPERIOR: LOGO, LETREIRO E TAGLINE ── */}
        <div className="flex flex-col items-center text-center mb-8 animate-in fade-in duration-500">
          
          {/* Ícone do Calendário com o Cursor */}
          <div className="relative w-20 h-20 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20 p-4 shadow-inner mb-4">
            <svg className="w-full h-full text-white" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3">
              <rect x="4" y="10" width="40" height="34" rx="6" />
              <line x1="4" y1="22" x2="44" y2="22" />
              <line x1="14" y1="4" x2="14" y2="12" />
              <line x1="34" y1="4" x2="34" y2="12" />
              <circle cx="14" cy="30" r="1.5" fill="currentColor" />
              <circle cx="22" cy="30" r="1.5" fill="currentColor" />
              <circle cx="30" cy="30" r="1.5" fill="currentColor" />
              <circle cx="38" cy="30" r="1.5" fill="currentColor" />
              <circle cx="14" cy="38" r="1.5" fill="currentColor" />
              <circle cx="22" cy="38" r="1.5" fill="currentColor" />
              <circle cx="30" cy="38" r="1.5" fill="currentColor" />
              <circle cx="38" cy="38" r="1.5" fill="currentColor" />
            </svg>
            {/* Cursor/Seta clássico do ClickReserva */}
            <svg className="absolute bottom-1 right-1 w-6 h-6 drop-shadow" viewBox="0 0 24 24" fill="white" stroke="#064e3b" strokeWidth="1.5">
              <path d="M2 2L2 22L8 16L11 24L14 23L11 15L19 15L2 2Z" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Nome do Sistema */}
          <h1 className="text-4xl font-black text-white tracking-tight leading-none">
            Click
          </h1>
          <h2 className="text-4xl font-black text-emerald-300 tracking-tight mt-1 leading-none mb-3">
            Reserva
          </h2>

          {/* Tagline Oficial */}
          <p className="text-[10px] font-bold tracking-widest text-white/70 uppercase">
            Tecnologia que organiza, escola que avança
          </p>
        </div>

        {/* ── CARD BRANCO DE AÇÕES (BOTÕES DE ACESSO) ── */}
        <Card className="shadow-2xl border-none bg-white overflow-hidden rounded-3xl animate-in slide-in-from-bottom-6 duration-500">
          <CardContent className="pt-8 px-6 space-y-4">
            
            {/* Botão de Login Primário */}
            <Button
              onClick={() => setLocation("/auth/login")} // Redireciona para o formulário de credenciais real
              className="w-full text-base font-bold h-12 text-white rounded-xl shadow-md transition-all border-none hover:opacity-90"
              style={{ background: "#059669" }}
            >
              Login
            </Button>

            {/* Botão de Criar Conta Secundário */}
            <Button
              onClick={() => setLocation("/register")} // Redireciona para a tela de cadastro
              variant="outline"
              className="w-full text-base font-bold h-12 rounded-xl transition-all border-2 border-emerald-600 text-emerald-700 bg-transparent hover:bg-emerald-50/50"
            >
              Criar conta
            </Button>

          </CardContent>

          {/* ── RODAPÉ DE BOAS-VINDAS CONFORME A IMAGEM ── */}
          <CardFooter className="p-0 block mt-4">
            <div className="px-6 py-5 text-center border-t border-emerald-50 bg-emerald-50/40">
              <p className="text-sm font-bold text-slate-800">
                Bem-vindo ao sistema de reservas!
              </p>
              <p className="text-xs font-semibold mt-0.5 text-emerald-700">
                {ESCOLA.nome}
              </p>
            </div>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
}
