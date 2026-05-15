import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetProfessors, useCreateProfessor, useUpdateProfessor, getGetProfessorsQueryKey } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, UserCheck, UserX, AlertTriangle, Clock, CheckCircle, XCircle, KeyRound, Eye, EyeOff } from "lucide-react";
import { ESCOLA as ESCOLA_CONFIG } from "@/escola.config";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const professorSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  role: z.enum(["professor", "coordinator", "admin"]),
});

type Tab = "professores" | "pendentes" | "rejeitados" | "senhas";

type ResetRequest = {
  id: number;
  status: string;
  createdAt: string;
  fulfilledAt: string | null;
  userId: number;
  userName: string;
  userEmail: string;
};

export function CoordinatorProfessorsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("professores");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Password reset dialog state
  const [resetDialogRequest, setResetDialogRequest] = useState<ResetRequest | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showProfPwd, setShowProfPwd] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const { data: professors, isLoading } = useGetProfessors();
  const createMutation = useCreateProfessor();
  const updateMutation = useUpdateProfessor();

  const base = typeof window !== "undefined" ? (import.meta.env.BASE_URL ?? "").replace(/\/$/, "") : "";

  const { data: pending, isLoading: pendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ["professors-pending"],
    queryFn: async () => {
      const res = await fetch(`${base}/api/professors/pending`, { credentials: "include" });
      if (!res.ok) throw new Error();
      return res.json() as Promise<Array<{ id: number; name: string; email: string; role: string }>>;
    },
  });

  const { data: rejected, isLoading: rejectedLoading, refetch: refetchRejected } = useQuery({
    queryKey: ["professors-rejected"],
    queryFn: async () => {
      const res = await fetch(`${base}/api/professors/rejected`, { credentials: "include" });
      if (!res.ok) throw new Error();
      return res.json() as Promise<Array<{ id: number; name: string; email: string; role: string }>>;
    },
  });

  const { data: resetRequests, isLoading: resetLoading, refetch: refetchResets } = useQuery({
    queryKey: ["professors-reset-requests"],
    queryFn: async () => {
      const res = await fetch(`${base}/api/professors/reset-requests`, { credentials: "include" });
      if (!res.ok) throw new Error();
      return res.json() as Promise<ResetRequest[]>;
    },
  });

  const form = useForm<z.infer<typeof professorSchema>>({
    resolver: zodResolver(professorSchema),
    defaultValues: { name: "", email: "", password: "", role: "professor" },
  });

  function onSubmit(values: z.infer<typeof professorSchema>) {
    createMutation.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Professor cadastrado com sucesso!" });
        queryClient.invalidateQueries({ queryKey: getGetProfessorsQueryKey() });
        form.reset();
        setOpen(false);
      },
      onError: (err: any) => {
        toast({ title: err?.error?.message ?? "Erro ao cadastrar.", variant: "destructive" });
      }
    });
  }

  function toggleActive(id: number, isActive: boolean) {
    updateMutation.mutate({ professorId: id, data: { isActive: !isActive } }, {
      onSuccess: () => {
        toast({ title: !isActive ? "Professor ativado." : "Professor desativado." });
        queryClient.invalidateQueries({ queryKey: getGetProfessorsQueryKey() });
      }
    });
  }

  async function handleApprove(id: number, name: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`${base}/api/professors/${id}/approve`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error();
      toast({ title: `Cadastro de ${name} aprovado!` });
      refetchPending(); refetchRejected();
      queryClient.invalidateQueries({ queryKey: getGetProfessorsQueryKey() });
    } catch {
      toast({ title: "Erro ao aprovar.", variant: "destructive" });
    } finally { setActionLoading(null); }
  }

  async function handleReject(id: number, name: string) {
    if (!confirm(`Deseja recusar o cadastro de ${name}?`)) return;
    setActionLoading(id);
    try {
      const res = await fetch(`${base}/api/professors/${id}/reject`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error();
      toast({ title: `Cadastro de ${name} recusado.` });
      refetchPending(); refetchRejected();
    } catch {
      toast({ title: "Erro ao recusar.", variant: "destructive" });
    } finally { setActionLoading(null); }
  }

  async function handleFulfillReset() {
    if (!resetDialogRequest) return;
    if (newPassword.trim().length < 6) {
      toast({ title: "Senha muito curta", description: "Mínimo 6 caracteres.", variant: "destructive" });
      return;
    }
    setResetSubmitting(true);
    try {
      const res = await fetch(`${base}/api/professors/reset-requests/${resetDialogRequest.id}/fulfill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword: newPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Erro", description: data.message, variant: "destructive" });
        return;
      }
      toast({ title: data.message ?? "Senha atualizada com sucesso!" });
      setResetDialogRequest(null);
      setNewPassword("");
      refetchResets();
    } catch {
      toast({ title: "Erro de conexão.", variant: "destructive" });
    } finally { setResetSubmitting(false); }
  }

  async function handleChangeRole(id: number, name: string, role: string) {
    try {
      const res = await fetch(`${base}/api/professors/${id}/change-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Erro ao alterar perfil.", variant: "destructive" });
        return;
      }
      toast({ title: `Perfil de ${name} alterado com sucesso!` });
      queryClient.invalidateQueries({ queryKey: getGetProfessorsQueryKey() });
    } catch {
      toast({ title: "Erro de conexão.", variant: "destructive" });
    }
  }

  const list = (professors ?? []).filter(p => (p as any).registrationStatus !== "pending").sort((a, b) => a.name.localeCompare(b.name));
  const pendingCount = (pending ?? []).length;
  const rejectedCount = (rejected ?? []).length;
  const resetPendingCount = (resetRequests ?? []).filter(r => r.status === "pending").length;

  function fmtDate(iso: string) {
    try { return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }); } catch { return iso; }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Professores</h1>
          <p className="text-muted-foreground mt-1">Cadastre, gerencie e aprove docentes do sistema.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-professor">
              <Plus className="h-4 w-4 mr-2" /> Novo Professor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar Professor</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nome completo</FormLabel><FormControl><Input placeholder="Prof. João da Silva" data-testid="input-prof-name" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                 <FormItem><FormLabel>E-mail institucional</FormLabel><FormControl><Input placeholder={`joao@${ESCOLA_CONFIG.emailDominio ?? "escola.pr.gov.br"}`} data-testid="input-prof-email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha inicial</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showProfPwd ? "text" : "password"} data-testid="input-prof-password" {...field} className="pr-10" />
                        <button type="button" onClick={() => setShowProfPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showProfPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem><FormLabel>Perfil</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="professor">Professor</SelectItem>
                        <SelectItem value="coordinator">Coordenador</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-professor">
                  {createMutation.isPending ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b overflow-x-auto">
        {([
          { key: "professores", icon: <Users className="h-4 w-4" />, label: "Professores" },
          { key: "pendentes", icon: <Clock className="h-4 w-4" />, label: "Aguardando", badge: pendingCount, badgeClass: "bg-yellow-500" },
          { key: "rejeitados", icon: <XCircle className="h-4 w-4" />, label: "Recusados", badge: rejectedCount, badgeClass: "bg-red-400" },
          { key: "senhas", icon: <KeyRound className="h-4 w-4" />, label: "Senhas", badge: resetPendingCount, badgeClass: "bg-orange-500" },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as Tab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t.icon}
            {t.label}
            {(t as any).badge > 0 && (
              <span className={`${(t as any).badgeClass} text-white text-xs rounded-full px-1.5 py-0.5 leading-none font-bold`}>
                {(t as any).badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Professores ── */}
      {tab === "professores" && (
        <>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-16 bg-muted rounded-lg animate-pulse"/>)}</div>
          ) : list.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center h-32 text-muted-foreground"><Users className="h-8 w-8 mb-2 opacity-30"/><p>Nenhum professor cadastrado.</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {list.map(p => (
                <Card key={p.id} className={`transition-shadow hover:shadow-sm ${!p.isActive ? "opacity-60" : ""}`} data-testid={`card-professor-${p.id}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{p.name.charAt(0)}</div>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {p.blocked && (
                        <span className="text-xs font-medium bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Bloqueado
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">{p.totalAbsences} falta(s)</span>
                      <Select
                        value={p.role}
                        onValueChange={(newRole) => handleChangeRole(p.id, p.name, newRole)}
                      >
                        <SelectTrigger className={`h-6 text-xs px-2 rounded-full border-0 font-medium w-auto ${p.role === "admin" ? "bg-purple-100 text-purple-700" : p.role === "coordinator" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professor">Professor</SelectItem>
                          <SelectItem value="coordinator">Coordenador</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" onClick={() => toggleActive(p.id, p.isActive)} disabled={updateMutation.isPending} data-testid={`button-toggle-${p.id}`}>
                        {p.isActive ? <UserX className="h-4 w-4 text-muted-foreground"/> : <UserCheck className="h-4 w-4 text-green-600"/>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Tab: Pendentes ── */}
      {tab === "pendentes" && (
        <>
          {pendingLoading ? (
            <div className="space-y-3">{[1,2].map(i=><div key={i} className="h-20 bg-muted rounded-lg animate-pulse"/>)}</div>
          ) : (pending ?? []).length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center h-40 text-center gap-2 text-muted-foreground"><CheckCircle className="h-10 w-10 text-green-400 mb-1"/><p className="font-medium">Nenhum cadastro pendente</p><p className="text-sm">Todos os cadastros foram processados.</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {(pending ?? []).map(p => (
                <Card key={p.id} className="border-yellow-200 bg-yellow-50/30">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-sm flex-shrink-0">{p.name.charAt(0)}</div>
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.email}</p>
                        <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1"><Clock className="h-3 w-3"/> Aguardando aprovação</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1.5" onClick={() => handleApprove(p.id, p.name)} disabled={actionLoading === p.id}><CheckCircle className="h-4 w-4"/> Aprovar</Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5" onClick={() => handleReject(p.id, p.name)} disabled={actionLoading === p.id}><XCircle className="h-4 w-4"/> Recusar</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Tab: Rejeitados ── */}
      {tab === "rejeitados" && (
        <>
          {rejectedLoading ? (
            <div className="space-y-3">{[1,2].map(i=><div key={i} className="h-20 bg-muted rounded-lg animate-pulse"/>)}</div>
          ) : (rejected ?? []).length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center h-40 text-center gap-2 text-muted-foreground"><CheckCircle className="h-10 w-10 text-green-400 mb-1"/><p className="font-medium">Nenhum cadastro recusado</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Cadastros recusados. Você pode aprovar qualquer um para liberar o acesso.</p>
              {(rejected ?? []).map(p => (
                <Card key={p.id} className="border-red-200 bg-red-50/20">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-sm flex-shrink-0">{p.name.charAt(0)}</div>
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.email}</p>
                        <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1"><XCircle className="h-3 w-3"/> Recusado</span>
                      </div>
                    </div>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1.5 flex-shrink-0" onClick={() => handleApprove(p.id, p.name)} disabled={actionLoading === p.id}><CheckCircle className="h-4 w-4"/> Aprovar mesmo assim</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Tab: Senhas ── */}
      {tab === "senhas" && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1 flex items-center gap-2"><KeyRound className="h-4 w-4"/> Pedidos de redefinição de senha</p>
            <p>Quando um professor solicita redefinição de senha na tela de login, o pedido aparece aqui. Defina uma nova senha e informe ao professor.</p>
          </div>

          {resetLoading ? (
            <div className="space-y-3">{[1,2].map(i=><div key={i} className="h-20 bg-muted rounded-lg animate-pulse"/>)}</div>
          ) : (resetRequests ?? []).length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center h-40 text-center gap-2 text-muted-foreground"><KeyRound className="h-10 w-10 opacity-30 mb-1"/><p className="font-medium">Nenhum pedido de senha</p><p className="text-sm">Não há solicitações no momento.</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {(resetRequests ?? []).map(r => (
                <Card key={r.id} className={r.status === "pending" ? "border-orange-200 bg-orange-50/20" : "opacity-60"}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${r.status === "pending" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500"}`}>
                        {r.userName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold">{r.userName}</p>
                        <p className="text-sm text-muted-foreground">{r.userEmail}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>Pedido: {fmtDate(r.createdAt)}</span>
                          {r.status === "fulfilled" && r.fulfilledAt && (
                            <span className="text-green-700">· Concluído: {fmtDate(r.fulfilledAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {r.status === "pending" ? (
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5"
                          onClick={() => { setResetDialogRequest(r); setNewPassword(""); setShowNewPwd(false); }}
                        >
                          <KeyRound className="h-4 w-4"/> Definir senha
                        </Button>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                          <CheckCircle className="h-3 w-3"/> Concluído
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Dialog: Definir nova senha */}
      <Dialog open={!!resetDialogRequest} onOpenChange={open => { if (!open) { setResetDialogRequest(null); setNewPassword(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-orange-500"/> Definir nova senha</DialogTitle>
          </DialogHeader>
          {resetDialogRequest && (
            <div className="space-y-4">
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-sm font-medium">{resetDialogRequest.userName}</p>
                <p className="text-xs text-muted-foreground">{resetDialogRequest.userEmail}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nova senha</label>
                <div className="relative">
                  <Input
                    type={showNewPwd ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNewPwd(v => !v)}
                  >
                    {showNewPwd ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Informe a nova senha ao professor após salvar.</p>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={handleFulfillReset} disabled={resetSubmitting || newPassword.trim().length < 6}>
                  {resetSubmitting ? "Salvando..." : "Salvar nova senha"}
                </Button>
                <Button variant="outline" onClick={() => { setResetDialogRequest(null); setNewPassword(""); }}>Cancelar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
