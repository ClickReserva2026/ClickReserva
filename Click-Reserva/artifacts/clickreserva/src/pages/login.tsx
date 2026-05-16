import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { ESCOLA } from "@/escola.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KeyRound, Mail, Loader2, AlertCircle } from "lucide-react";

export function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  
  // Estados para controle do formulário
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validação básica inicial no lado do cliente
    if (!email.trim() || !password) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      setIsLoading(false);
      return;
    }

    try {
      const success = await login(email.trim().toLowerCase(), password);
      
      if (success) {
        // 🚀 REDIRECIONAMENTO CORRIGIDO: Vai para a raiz onde o MainLayout carrega o menu correto
        setLocation("/");
      } else {
        setError("E-mail institucional ou senha incorretos.");
      }
    } catch (err: any) {
      setError(
        err?.message || "Não foi possível conectar ao servidor. Tente novamente mais tarde."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#f4f7f5] px-4 font-sans antialiased">
      <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
      
      <Card className="w-full max-w-md relative z-10 shadow-xl border-slate-200 bg-white overflow-hidden">
        {/* Cabeçalho Customizado com as Cores Institucionais */}
        <CardHeader className="space-y-2 text-center text-white" style={{ background: "linear-gradient(135deg, #064e3b 0%, #059669 100%)" }}>
          <div className="mx-auto my-2 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight font-sans">
            Acessar ClickReserva
          </CardTitle>
          <CardDescription className="text-emerald-100/90 text-xs font-medium uppercase tracking-wider">
            Identifique-se para gerenciar salas e reservas
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800 animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="font-medium text-xs">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Campo de Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                E-mail Institucional
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nome.sobrenome@escola.pr.gov.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="pl-9 text-sm border-slate-200 focus-visible:ring-emerald-600 bg-slate-50/50"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Campo de Senha */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Senha de Acesso
                </Label>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="pl-9 text-sm border-slate-200 focus-visible:ring-emerald-600 bg-slate-50/50"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {/* Botão de Envio */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full text-sm font-bold h-11 text-white shadow-md transition-all mt-2 group"
              style={{ background: "linear-gradient(90deg, #064e3b, #059669)" }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Autenticando credenciais...
                </>
              ) : (
                "Entrar no Sistema"
              )}
            </Button>
          </form>
        </CardContent>

        {/* ── Corrigido: Rodapé Limpo e Acolhedor ── */}
        <CardFooter className="p-0 block">
          <div className="px-4 py-4 text-center border-t bg-slate-50/80">
            <p className="text-xs font-bold text-slate-700">
              Seja bem-vindo ao sistema de reservas
            </p>
            <p className="text-[11px] font-bold mt-0.5 text-emerald-700 tracking-wide uppercase">
              {ESCOLA.nome}
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
