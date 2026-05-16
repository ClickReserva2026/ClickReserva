import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, CheckCircle, KeyRound, Send, Eye, EyeOff } from "lucide-react";
import { ESCOLA } from "@/escola.config";

// ── LOGO EM VETOR PURO (Não quebra e não gera erro 404) ──
function BrandLogo() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-[72px] h-[72px]">
        <div className="w-[72px] h-[72px] bg-white/20 rounded-[20px] flex items-center justify-center border border-white/30 backdrop-blur-sm shadow-inner">
          <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="10" width="40" height="34" rx="6" stroke="white" strokeWidth="2.5" />
            <rect x="4" y="10" width="40" height="13" rx="6" fill="white/20" />
            <line x1="4" y1="23" x2="44" y2="23" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" />
            <rect x="14" y="4" width="4" height="10" rx="2" fill="white" />
            <rect x="30" y="4" width="4" height="10" rx="2" fill="white" />
            <circle cx="11" cy="30" r="2" fill="white" fillOpacity="0.5" />
            <circle cx="20" cy="30" r="2" fill="white" />
            <circle cx="29" cy="30" r="2" fill="white" fillOpacity="0.5" />
            <circle cx="37" cy="30" r="2" fill="white" fillOpacity="0.5" />
            <circle cx="11" cy="38" r="2" fill="white" fillOpacity="0.5" />
            <circle cx="20" cy="38" r="2" fill="white" fillOpacity="0.5" />
            <circle cx="29" cy="38" r="2" fill="white" fillOpacity="0.5" />
            <circle cx="37" cy="38" r="2" fill="white" fillOpacity="0.5" />
          </svg>
        </div>
        <svg className="absolute -bottom-1 -right-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.5 3V19.5L9.5 14.5L13.5 22.5L16.5 21L12.5 13H19.5L4.5 3Z" fill="white" stroke="#064e3b" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>
      
      <div className="text-center mt-1">
        <h1 className="font-['Nunito',sans-serif] text-3xl font-extrabold tracking-tight text-white leading-none block">
          Click<span className="text-emerald-300">Reserva</span>
        </h1>
      </div>
    </div>
  );
}

const loginSchema = z.object({
  email: z.string().email({ message: "E-mail inválido." }),
  password: z.string().min(1, { message: "Senha é obrigatória." }),
});

const registerSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter ao menos 2 caracteres." }),
  email: z.string().email({ message: "E-mail inválido." }),
  password: z.string().min(6, { message: "Senha deve ter ao menos 6 caracteres." }),
  confirmPassword: z.string().min(1, { message: "Confirme a senha." }),
}).refine(d => d.password === d.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

type Mode = "home" | "login" | "register" | "pending" | "forgot" | "forgot-sent";

export function LoginPage() {
  const [mode, setMode] = useState<Mode>("home");
  const [pendingName, setPendingName] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const loginMutation = useLogin();
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [showRegisterPwd, setShowRegisterPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const base = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  function onLogin(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate({ data: values }, {
      onSuccess: async (data) => {
        // Define o usuário no contexto global primeiro
        setUser(data.user);
        // Invalida as queries de checagem de sessão para atualizar as rotas protegidas
        await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        
        toast({ title: "Bem-vindo!", description: `Olá, ${data.user.name}!` });
        
        // Redireciona usando o roteador estável para injetar o menu do app corretamente
        setLocation("/reservas");
      },
      onError: (error: any) => {
        const err = error?.data ?? error?.error ?? error;
        const errKey = err?.error ?? "";
        if (errKey === "Cadastro pendente") {
          toast({ title: "Cadastro aguardando aprovação", description: "Seu cadastro ainda não foi aprovado pelo coordenador.", variant: "destructive" });
        } else if (errKey === "Cadastro recusado") {
          toast({ title: "Cadastro recusado", description: "Seu cadastro foi recusado. Entre em contato com o coordenador.", variant: "destructive" });
        } else {
          toast({ title: "Erro no login", description: err?.message ?? "E-mail ou senha incorretos.", variant: "destructive" });
        }
      },
    });
  }

  async function onRegister(values: z.infer<typeof registerSchema>) {
    setRegisterLoading(true);
    try {
      const res = await fetch(`${base}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: values.name, email: values.email, password: values.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Erro no cadastro", description: data.message, variant: "destructive" });
        return;
      }
      if (data.pending) {
        setPendingName(values.name);
        setMode("pending");
        return;
      }
      setUser(data.user);
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      setLocation("/reservas");
    } catch {
      toast({ title: "Erro de conexão", description: "Não foi possível conectar ao servidor.", variant: "destructive" });
    } finally {
      setRegisterLoading(false);
    }
  }

  async function onForgotSubmit() {
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      const res = await fetch(`${base}/api/auth/reset-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Erro", description: data.
