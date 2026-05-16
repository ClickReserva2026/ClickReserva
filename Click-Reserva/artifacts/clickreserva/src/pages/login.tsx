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

// ── Logo padrão ClickReserva ─────────────────────────────────────
function BrandLogo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ position: "relative", width: 72, height: 72 }}>
        <div style={{
          width: 72, height: 72,
          background: "rgba(255,255,255,0.18)",
          borderRadius: 20,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid rgba(255,255,255,0.25)",
        }}>
          <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
            <rect x="4" y="10" width="40" height="34" rx="6" fill="none" stroke="white" strokeWidth="2"/>
            <rect x="4" y="10" width="40" height="13" rx="6" fill="rgba(255,255,255,0.28)"/>
            <line x1="4" y1="23" x2="44" y2="23" stroke="white" strokeWidth="1.2" strokeOpacity="0.3"/>
            <rect x="14" y="4" width="4" height="11" rx="2" fill="white" fillOpacity="0.85"/>
            <rect x="30" y="4" width="4" height="11" rx="2" fill="white" fillOpacity="0.85"/>
            <rect x="7"  y="27" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.4"/>
            <rect x="16" y="27" width="6" height="5" rx="1.5" fill="white"/>
            <rect x="25" y="27" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.4"/>
            <rect x="34" y="27" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.4"/>
            <rect x="7"  y="35" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.4"/>
            <rect x="16" y="35" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.4"/>
            <rect x="25" y="35" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.4"/>
            <rect x="34" y="35" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.4"/>
          </svg>
        </div>
        <svg style={{ position: "absolute", bottom: -8, right: -10 }} width="20" height="24" viewBox="0 0 24 28" fill="none">
          <path d="M2 2L2 22L8 16L11 24L14 23L11 15L19 15L2 2Z" fill="white" stroke="#064e3b" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{ textAlign: "center" }}>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 32, fontWeight: 900, color: "#fff", lineHeight: 1, display: "block" }}>Click</span>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 32, fontWeight: 900, color: "#6ee7b7", lineHeight: 1, display: "block" }}>Reserva</span>
      </div>
      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: "1.3px", textTransform: "uppercase", textAlign: "center", lineHeight: 1.6 }}>
        Tecnologia que organiza, escola que avança
      </span>
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
      onSuccess: (data) => {
        setUser(data.user);
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Bem-vindo!", description: `Olá, ${data.user.name}!` });
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
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
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
        toast({ title: data.error ?? "Erro", description: data.message, variant: "destructive" });
        return;
      }
      setMode("forgot-sent");
    } catch {
      toast({ title: "Erro de conexão", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setForgotLoading(false);
    }
  }

  function goBack() {
    setMode("home");
    loginForm.reset();
    registerForm.reset();
    setForgotEmail("");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #064e3b 0%, #059669 55%, #10b981 100%)", position: "relative", overflow: "hidden" }}
    >
      {/* Círculos decorativos */}
      <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }}/>
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }}/>

      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">

        {/* ── Cabeçalho verde com logo ── */}
        <div style={{ background: "linear-gradient(135deg, #064e3b 0%, #059669 100%)", padding: "36px 32px 28px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <BrandLogo />
        </div>

        {/* ── Conteúdo ── */}
        <div className="pt-5 pb-6 px-8">

          {/* Botão voltar */}
          {(mode === "login" || mode === "register" || mode === "forgot" || mode === "forgot-sent") && (
            <button type="button" onClick={goBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
          )}

          {/* Título do modo */}
          {mode !== "home" && mode !== "pending" && mode !== "forgot-sent" && (
            <div className="text-center mb-5">
              <h1 className="text-2xl font-bold" style={{ color: "#064e3b" }}>
                {mode === "login" ? "Entrar" : mode === "register" ? "Criar conta" : "Redefinir senha"}
              </h1>
            </div>
          )}

          {/* HOME */}
          {mode === "home" && (
            <div className="flex flex-col gap-3 mt-2">
              <Button
                className="w-full h-12 text-base font-bold"
                style={{ background: "linear-gradient(135deg, #064e3b, #059669)", border: "none" }}
                onClick={() => setMode("login")}
              >
                Login
              </Button>
              <Button variant="outline" className="w-full h-12 text-base font-medium border-2" style={{ borderColor: "#059669", color: "#059669" }} onClick={() => setMode("register")}>
                Criar conta
              </Button>
            </div>
          )}

          {/* LOGIN */}
          {mode === "login" && (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
                <FormField control={loginForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail institucional</FormLabel>
                    <FormControl><Input placeholder={`professor@${ESCOLA.emailDominio}`} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={loginForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showLoginPwd ? "text" : "password"} placeholder="••••••••" {...field} className="pr-10" />
                        <button type="button" onClick={() => setShowLoginPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showLoginPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full h-11 text-base font-bold" style={{ background: "linear-gradient(135deg, #064e3b, #059669)", border: "none" }} disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Entrando..." : "Entrar"}
                </Button>
                <button type="button" onClick={() => setMode("forgot")} className="w-full text-sm text-center text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1.5 mt-1">
                  <KeyRound className="h-3.5 w-3.5" /> Esqueci minha senha
                </button>
              </form>
            </Form>
          )}

          {/* REGISTER */}
          {mode === "register" && (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <FormField control={registerForm.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nome completo</FormLabel><FormControl><Input placeholder="Prof. João da Silva" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={registerForm.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>E-mail institucional</FormLabel><FormControl><Input placeholder={`professor@${ESCOLA.emailDominio}`} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={registerForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showRegisterPwd ? "text" : "password"} placeholder="Mínimo 6 caracteres" {...field} className="pr-10" />
                        <button type="button" onClick={() => setShowRegisterPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showRegisterPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={registerForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showConfirmPwd ? "text" : "password"} placeholder="Repita a senha" {...field} className="pr-10" />
                        <button type="button" onClick={() => setShowConfirmPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <p className="text-xs text-muted-foreground">Use seu e-mail institucional da escola (@{ESCOLA.emailDominio})</p>
                <Button type="submit" className="w-full h-11 text-base font-bold" style={{ background: "linear-gradient(135deg, #064e3b, #059669)", border: "none" }} disabled={registerLoading}>
                  {registerLoading ? "Enviando..." : "Enviar cadastro"}
                </Button>
              </form>
            </Form>
          )}

          {/* PENDING */}
          {mode === "pending" && (
            <div className="text-center space-y-5 py-2">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-10 w-10 text-yellow-600" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Cadastro enviado!</h2>
                <p className="text-base font-semibold mt-1" style={{ color: "#059669" }}>{ESCOLA.nome}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left space-y-2">
                <div className="flex items-center gap-2 text-yellow-800 font-semibold text-sm">
                  <Clock className="h-4 w-4 flex-shrink-0" /> Aguardando aprovação do coordenador
                </div>
                <p className="text-sm text-yellow-700">
                  {pendingName ? `Olá, ${pendingName.split(" ")[0]}! ` : ""}Seu cadastro foi recebido e está aguardando aprovação. Você receberá acesso assim que for aprovado.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                <CheckCircle className="h-4 w-4 text-green-500" /> Seus dados foram salvos com segurança
              </div>
              <Button variant="outline" className="w-full" onClick={goBack}>Voltar ao início</Button>
            </div>
          )}

          {/* FORGOT */}
          {mode === "forgot" && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold mb-1">Como funciona?</p>
                <p>Informe seu e-mail institucional. O coordenador receberá o pedido e definirá uma nova senha para você.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail institucional</label>
                <Input type="email" placeholder={`professor@${ESCOLA.emailDominio}`} value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && onForgotSubmit()} />
              </div>
              <Button className="w-full h-11 gap-2" style={{ background: "linear-gradient(135deg, #064e3b, #059669)", border: "none" }} onClick={onForgotSubmit} disabled={forgotLoading || !forgotEmail.trim()}>
                <Send className="h-4 w-4" /> {forgotLoading ? "Enviando..." : "Enviar pedido ao coordenador"}
              </Button>
            </div>
          )}

          {/* FORGOT SENT */}
          {mode === "forgot-sent" && (
            <div className="text-center space-y-5 py-2">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Pedido enviado!</h2>
                <p className="text-base font-semibold mt-1" style={{ color: "#059669" }}>{ESCOLA.nome}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                <p className="text-sm text-green-800">
                  O coordenador foi notificado do seu pedido de redefinição de senha. Assim que ele definir sua nova senha, você poderá fazer login normalmente.
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setMode("login")}>Voltar ao login</Button>
            </div>
          )}
        </div>

        {/* ── Rodapé ── */}
        <div className="px-4 py-3 text-center border-t" style={{ background: "#f0fdf4" }}>
          <p className="text-sm font-semibold" style={{ color: "#064e3b" }}>Bem-vindo ao sistema de reservas!</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: "#059669" }}>{ESCOLA.nome}</p>
        </div>
      </div>
    </div>
  );
}
