import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context"; // Resgata o login real desenvolvido pelos alunos
import { ESCOLA } from "@/escola.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, KeyRound, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth(); // Função de autenticação nativa do sistema
  
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Valida as credenciais diretamente no banco através da API do Render
      const success = await login(email.trim().toLowerCase(), password);
      if (success) {
        setLocation("/"); // Redireciona com segurança para o Dashboard interno
      } else {
        setError("E-mail institucional ou senha incorretos.");
      }
    } catch (err: any) {
      setError(err?.message || "Não foi possível conectar ao servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center px-4 font-sans antialiased"
         style={{ background: "linear-gradient(135deg, #064e3b 0%, #059669 100%)" }}>
      
      <div className="w-full max-w-md relative z-10">
        
        {/* ── LOGOTIPO E IDENTIDADE VISUAL DO CLICKRESERVA ── */}
        <div className="flex flex-col items-center text-center mb-8">
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
            <svg className="absolute bottom-1 right-1 w-6 h-6 drop-shadow" viewBox="0 0 24 24" fill="white" stroke="#064e3b" strokeWidth="1.5">
              <path d="M2 2L2 22L8 16L11 24L14 23L11 15L19 15L2 2Z" strokeLinejoin="round"/>
            </svg>
          </div>

          <h1 className="text-4xl font-black text-white tracking-tight leading-none">Click</h1>
          <h2 className="text-4xl font-black text-emerald-300 tracking-tight mt-1 leading-none mb-3">Reserva</h2>
          <p className="text-[10px] font-bold tracking-widest text-white/70 uppercase">
            Tecnologia que organiza, escola que avança
          </p>
        </div>

        {/* ── CARD BRANCO UNIFICADO ── */}
        <Card className="shadow-2xl border-none bg-white overflow-hidden rounded-3xl">
          
          {!showForm ? (
            /* VISÃO INICIAL DO PORTAL VERDE */
            <CardContent className="pt-8 px-6 space-y-4">
              <Button
                onClick={() => setShowForm(true)}
                className="w-full text-base font-bold h-12 text-white rounded-xl border-none shadow-sm"
                style={{ background: "#059669" }}
              >
                Login
              </Button>

              <Button
                onClick={() => alert("O cadastro de novos professores deve ser solicitado diretamente à coordenação.")}
                variant="outline"
                className="w-full text-base font-bold h-12 rounded-xl border-2 border-emerald-600 text-emerald-700 bg-transparent hover:bg-emerald-50/50"
              >
                Criar conta
              </Button>
            </CardContent>
          ) : (
            /* VISÃO DO FORMULÁRIO SEGURO */
            <CardContent className="pt-6 px-6">
              <button 
                onClick={() => { setShowForm(false); setError(null); }}
                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 mb-4 bg-transparent border-none cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar
              </button>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800 py-2.5">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    <AlertDescription className="font-medium text-xs">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase">E-mail Institucional</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu.nome@escola.pr.gov.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 text-sm h-10 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-bold text-slate-700 uppercase">Senha</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 text-sm h-10 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-sm font-bold h-11 text-white shadow-md rounded-xl mt-2 border-none"
                  style={{ background: "linear-gradient(90deg, #064e3b, #059669)" }}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Entrando...
                    </span>
                  ) : (
                    "Entrar no Sistema"
                  )}
                </Button>
              </form>
            </CardContent>
          )}

          {/* ── ASSINATURA DA ESCOLA NO RODAPÉ ── */}
          <CardFooter className="p-0 block">
            <div className="px-6 py-5 text-center border-t border-emerald-50 bg-emerald-50/40">
              <p className="text-sm font-bold text-slate-800">Bem-vindo ao sistema de reservas!</p>
              <p className="text-xs font-semibold mt-0.5 text-emerald-700 uppercase tracking-wide">{ESCOLA.nome}</p>
            </div>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
}
