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
import { Logo } from "@/components/logo";

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
        // Define o usuário no contexto global e força a validação do token
        setUser(data.user);
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Bem-vindo!", description: `Olá, ${data.user.name}!` });
        
        // Redireciona explicitamente para a rota interna limpa
        window.location.href = `${base}/reservas`;
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
      window.location.href = `${base}/reservas`;
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
      className="min-h-screen w-screen flex items-center justify-center p-4 font-sans antialiased"
      style={{ background: "linear-gradient(135deg, #064e3b 0%, #059669 55%, #10b981 100%)", position: "relative", overflow: "hidden" }}
    >
      {/* Círculos decorativos */}
      <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }}/>
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }}/>

      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500 z-10">

        {/* ── Cabeçalho com componente Logo unificado ── */}
        <div style={{ background: "linear-gradient(135deg, #064e3b 0%, #059669 100%)", padding: "36px 32px 28px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="w-full max-w-[220px] flex items-center justify-center">
            <Logo className="h-14 w-auto invert brightness-0" />
          </div>
          <span className="text-[10px] text-emerald-200/70 font-bold tracking-wider text-center uppercase block mt-4">
            Tecnologia que organiza, escola que avança
          </span>
        </div>

        {/* ── Conteúdo dinâmico de formulários ── */}
        <div className="pt-6 pb-6 px-8 bg-white">

          {/* Botão voltar */}
          {(mode === "login" || mode === "register" || mode === "forgot" || mode === "forgot-sent") && (
            <button type="button" onClick={goBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors font-medium">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
          )}

          {/* Título do modo */}
          {mode !== "home" && mode !== "pending" && mode !== "forgot-sent" && (
            <div className="text-center mb-5">
              <h1 className="text-xl font-bold text-emerald-950">
                {mode === "login" ? "Entrar no Sistema" : mode === "register" ? "Criar nova conta" : "Redefinir senha"}
              </h1>
            </div>
          )}

          {/* HOME */}
          {mode === "home" && (
            <div className="flex flex-col gap-3 mt-2">
              <Button
                className="w-full h-12 text-base font-bold shadow-md hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg, #064e3b, #059669)", border: "none" }}
                onClick={() => setMode("login")}
              >
                Login
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-12 text-base font-bold border-2 transition-colors" 
                style={{ borderColor: "#059669", color: "#059669" }} 
                onClick={() => setMode("register")}
              >
                Criar conta
              </Button>
            </div>
          )}

          {/* LOGIN */}
          {mode === "login" && (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <FormField control={loginForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold">E-mail institucional</FormLabel>
                    <FormControl><Input placeholder={`professor@${ESCOLA.emailDominio}`} {...field} className="bg-slate-50" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={loginForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold">Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showLoginPwd ? "text" : "password"} placeholder="••••••••" {...field} className="pr-10 bg-slate-50" />
                        <button type="button" onClick={() => setShowLoginPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showLoginPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full h-11 text-base font-bold shadow-md mt-2" style={{ background: "linear-gradient(135deg, #064e3b, #059669)", border: "none" }} disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Autenticando..." : "Entrar"}
                </Button>
                <button type="button" onClick={() => setMode("forgot")} className="w-full text-xs font-semibold text-center text-slate-500 hover:text-emerald-700 transition-colors flex items-center justify-center gap-1.5 mt-2">
                  <KeyRound className="h-3.5 w-3.5" /> Esqueci minha senha
                </button>
              </form>
            </Form>
          )}

          {/* REGISTER */}
          {mode === "register" && (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-3">
                <FormField control={registerForm.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel className="text-slate-700 font-semibold">Nome completo</FormLabel><FormControl><Input placeholder="Prof. João da Silva" {...field} className="bg-slate-50" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={registerForm.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel className="text-slate-700 font-semibold">E-mail institucional</FormLabel><FormControl><Input placeholder={`professor@${ESCOLA.emailDominio}`} {...field} className="bg-slate-50" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={registerForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold">Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showRegisterPwd ? "text" : "password"} placeholder="Mínimo 6 caracteres" {...field} className="pr-10 bg-slate-50" />
                        <button type="button" onClick={() => setShowRegisterPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showRegisterPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={registerForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold">Confirmar senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showConfirmPwd ? "text" : "password"} placeholder="Repita a senha" {...field} className="pr-10 bg-slate-50" />
                        <button type="button" onClick={() => setShowConfirmPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <p className="text-[11px] text-slate-500 font-medium">Use obrigatoriamente o domínio @{ESCOLA.emailDominio}</p>
                <Button type="submit" className="w-full h-11 text-base font-bold shadow-md mt-2" style={{ background: "linear-gradient(135deg, #064e3b, #059669)", border: "none" }} disabled={registerLoading}>
                  {registerLoading ? "Enviando para validação..." : "Enviar cadastro"}
                </Button>
              </form>
            </Form>
          )}

          {/* PENDING */}
          {mode === "pending" && (
            <div className="text-center space-y-4 py-2">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-amber-600" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Cadastro enviado!</h2>
                <p className="text-sm font-semibold mt-0.5 text-emerald-700">{ESCOLA.nome}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left space-y-1.5">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
                  Análise da Coordenação
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {pendingName ? `Olá, ${pendingName.split(" ")[0]}! ` : ""}Seus dados foram submetidos com sucesso. O acesso ao painel será liberado assim que sua conta for revisada e homologada pelo coordenador.
                </p>
              </div>
              <Button variant="outline" className="w-full font-semibold" onClick={goBack}>Voltar ao início</Button>
            </div>
          )}

          {/* FORGOT */}
          {mode === "forgot" && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-800 mb-0.5">Como redefinir?</p>
                <p>Insira seu e-mail funcional cadastrado. Um alerta será disparado para a coordenação gerar uma credencial provisória de acesso para você.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">E-mail institucional</label>
                <Input type="email" placeholder={`professor@${ESCOLA.emailDominio}`} value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && onForgotSubmit()} className="bg-slate-50" />
              </div>
              <Button className="w-full h-11 gap-2 font-bold shadow-md" style={{ background: "linear-gradient(135deg, #064e3b, #059669)", border: "none" }} onClick={onForgotSubmit} disabled={forgotLoading || !forgotEmail.trim()}>
                <Send className="h-4 w-4" /> {forgotLoading ? "Enviando..." : "Solicitar nova senha"}
              </Button>
            </div>
          )}

          {/* FORGOT SENT */}
          {mode === "forgot-sent" && (
            <div className="text-center space-y-4 py-2">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Solicitação enviada!</h2>
                <p className="text-sm font-semibold mt-0.5 text-emerald-700">{ESCOLA.nome}</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-left">
                <p className="text-xs text-emerald-800 leading-relaxed">
                  O chamado de redefinição de senha foi registrado. Procure a equipe de coordenação técnica ou a direção da unidade para coletar sua chave temporária de acesso.
                </p>
              </div>
              <Button variant="outline" className="w-full font-semibold" onClick={() => setMode("login")}>Voltar ao login</Button>
            </div>
          )}
        </div>

        {/* ── Rodapé cinza/verde claro padrão ── */}
        <div className="px-4 py-4 text-center border-t bg-slate-50">
          <p className="text-xs font-bold text-slate-700">Bem-vindo ao sistema de reservas!</p>
          <p className="text-[11px] font-semibold mt-0.5 text-emerald-700">{ESCOLA.nome}</p>
        </div>
      </div>
    </div>
  );
}
