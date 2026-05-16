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
          </svg>
        </div>
        <svg className="absolute -bottom-1 -right-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.5 3V19.5L9.5 14.5L13.5 22.5L16.5 21L12.5 13H19.5L4.5 3Z" fill="white" stroke="#064e3b" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="font-['Nunito',sans-serif] text-3xl font-extrabold tracking-tight text-white leading-none">
        Click<span className="text-emerald-300">Reserva</span>
      </h1>
    </div>
  );
}

const loginSchema = z.object({
  email: z.string().email({ message: "E-mail inválido." }),
  password: z.string().min(1, { message: "Senha é obrigatória." }),
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
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  const base = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onLogin(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate({ data: values }, {
      onSuccess: async (data) => {
        setUser(data.user);
        await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Bem-vindo!", description: `Olá, ${data.user.name}!` });
        setLocation("/reservas");
      },
      onError: (error: any) => {
        const err = error?.data ?? error?.error ?? error;
        toast({ title: "Erro no login", description: err?.message ?? "Dados incorretos.", variant: "destructive" });
      },
    });
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #064e3b 0%, #059669 55%, #10b981 100%)" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="py-8 text-center flex flex-col items-center justify-center" style={{ background: "linear-gradient(135deg, #064e3b 0%, #059669 100%)" }}>
          <BrandLogo />
        </div>

        <div className="p-8">
          {mode !== "home" && (
            <button type="button" onClick={() => setMode("home")} className="flex items-center gap-1 text-sm text-slate-500 mb-4">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
          )}

          {mode === "home" && (
            <div className="flex flex-col gap-3 mt-4">
              <Button className="w-full h-12 font-bold text-white" style={{ background: "linear-gradient(135deg, #064e3b, #059669)" }} onClick={() => setMode("login")}>Login</Button>
              <Button variant="outline" className="w-full h-12 font-bold border-2" style={{ borderColor: "#059669", color: "#059669" }} onClick={() => setMode("register")}>Criar conta</Button>
            </div>
          )}

          {mode === "login" && (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <FormField control={loginForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold">E-mail institucional</FormLabel>
                    <FormControl><Input placeholder={`@${ESCOLA.emailDominio}`} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={loginForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold">Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showLoginPwd ? "text" : "password"} placeholder="••••••••" {...field} />
                        <button type="button" onClick={() => setShowLoginPwd(!showLoginPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          {showLoginPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full h-11 font-bold text-white" style={{ background: "linear-gradient(135deg, #064e3b, #059669)" }} disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Autenticando..." : "Entrar"}
                </Button>
              </form>
            </Form>
          )}

          {mode === "register" && (
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-slate-600">Para criar uma nova conta, envie seus dados diretamente à coordenação escolar da instituição.</p>
              <div className="p-3 bg-emerald-50 rounded-lg text-xs font-semibold text-emerald-800">{ESCOLA.nome}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
