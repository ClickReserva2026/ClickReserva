    import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context"; // Conecta ao sistema de login dos alunos
import { ESCOLA } from "@/escola.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, KeyRound, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth(); 
  
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
      // Envia as credenciais reais que você tem para a API do banco de dados
      const success = await login(email.trim().toLowerCase(), password);
      
      if (success) {
        // Se o banco aceitar, avança direto para a tela do menu lateral verde!
        setLocation("/"); 
      } else {
        setError("E-mail institucional ou senha incorretos.");
      }
    } catch (err: any) {
      // Se a API retornar 401 ou erro de rede, exibe a mensagem amigável na caixinha vermelha
      setError(err?.message || "Credenciais inválidas ou erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center px-4 font-sans antialiased"
         style={{ background: "linear-gradient(135deg, #064e3b 0%, #059669 100%)" }}>
      
      <div className="w-full max-w-md relative z-10">
        
        {/* IDENTIDADE VISUAL CLICKRESERVA */}
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
          </div>

          <h1 className="text-4xl font-black text-white tracking-tight leading-none">Click</h1>
          <h2 className="text-4xl font-black text-emerald-300 tracking-tight mt-1 leading-none mb-3">Reserva</h2>
          <p className="text-[10px] font-bold tracking-widest text-white/70 uppercase">
            Tecnologia que organiza, escola que avança
          </p>
        </div>

        {/* CARD PRINCIPAL */}
        <Card className="shadow-2xl border-none bg-white overflow-hidden rounded-3xl">
          
          {!showForm ? (
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
