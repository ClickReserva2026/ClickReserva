import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetConfig, useUpdateConfig, getGetConfigQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Settings, ShieldAlert, Clock, Mail, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { clearAppCache } from "@/App";

const configSchema = z.object({
  absenceLimitForBlock: z.coerce.number().min(1, "Mínimo 1").max(10, "Máximo 10"),
  toleranceMinutes: z.coerce.number().min(5, "Mínimo 5 minutos").max(60, "Máximo 60 minutos"),
});

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function CoordinatorConfigPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testEmailState, setTestEmailState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [testEmailMsg, setTestEmailMsg] = useState("");

  const { data: config, isLoading } = useGetConfig();
  const updateMutation = useUpdateConfig();

  const form = useForm<z.infer<typeof configSchema>>({
    resolver: zodResolver(configSchema),
    defaultValues: { absenceLimitForBlock: 3, toleranceMinutes: 15 },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        absenceLimitForBlock: config.absenceLimitForBlock,
        toleranceMinutes: config.toleranceMinutes,
      });
    }
  }, [config]);

  function onSubmit(values: z.infer<typeof configSchema>) {
    updateMutation.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Configurações salvas com sucesso!" });
        queryClient.invalidateQueries({ queryKey: getGetConfigQueryKey() });
      },
      onError: () => toast({ title: "Erro ao salvar configurações.", variant: "destructive" })
    });
  }

  async function handleTestEmail() {
    setTestEmailState("loading");
    setTestEmailMsg("");
    try {
      const res = await fetch(`${BASE}/api/config/test-email`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setTestEmailState("ok");
        setTestEmailMsg(data.message ?? "E-mail enviado com sucesso!");
      } else {
        setTestEmailState("error");
        setTestEmailMsg(data.error ?? "Erro desconhecido.");
      }
    } catch (e: any) {
      setTestEmailState("error");
      setTestEmailMsg(e.message ?? "Erro de conexão.");
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h1>
        <p className="text-muted-foreground mt-1">Ajuste as regras de bloqueio por não comparecimento.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Regras de Presença
          </CardTitle>
          <CardDescription>
            Defina o limite de faltas e o tempo de tolerância para confirmação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">{[1,2].map(i=><div key={i} className="h-16 bg-muted rounded animate-pulse"/>)}</div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="absenceLimitForBlock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                        Limite de faltas para bloqueio
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={10} data-testid="input-absence-limit" {...field} />
                      </FormControl>
                      <FormDescription>
                        Após este número de faltas sem confirmação de presença, o professor será bloqueado automaticamente.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="toleranceMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Tolerância em minutos
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min={5} max={60} data-testid="input-tolerance" {...field} />
                      </FormControl>
                      <FormDescription>
                        Tempo máximo após o início da aula para o professor confirmar presença. Após este tempo sem confirmação, a ausência é registrada.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-config">
                  {updateMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Lembretes por E-mail
          </CardTitle>
          <CardDescription>
            O sistema envia lembretes automáticos para os professores 10, 5 e 1 minuto antes de cada aula confirmada.
            Use o botão abaixo para verificar se os e-mails estão sendo enviados corretamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/40 rounded-lg p-3 text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Importante — plano gratuito do Resend:</p>
            <p>No plano gratuito, e-mails só são entregues para o endereço cadastrado na conta Resend. Para enviar para qualquer professor, é necessário verificar um domínio no painel do Resend.</p>
          </div>

          <Button
            variant="outline"
            onClick={handleTestEmail}
            disabled={testEmailState === "loading"}
            className="gap-2"
          >
            <Mail className="h-4 w-4" />
            {testEmailState === "loading" ? "Enviando..." : "Enviar E-mail de Teste para Mim"}
          </Button>

          {testEmailState === "ok" && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
              <CheckCircle className="h-4 w-4 shrink-0" />
              {testEmailMsg}
            </div>
          )}

          {testEmailState === "error" && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span><strong>Erro:</strong> {testEmailMsg}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Cache do Navegador
          </CardTitle>
          <CardDescription>
            O sistema salva dados localmente para carregar mais rápido. O cache expira automaticamente a cada 24 horas.
            Use o botão abaixo caso a página esteja mostrando informações desatualizadas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/40 rounded-lg p-3 text-sm text-muted-foreground space-y-1">
            <p><strong>Como funciona:</strong> ao abrir o app, os dados carregam <em>instantaneamente</em> do cache local.
            Em segundo plano, o sistema verifica se há novidades e atualiza silenciosamente após 5 minutos.
            A cada 24 horas o cache é limpo e tudo é baixado novamente do servidor.</p>
          </div>
          <Button
            variant="outline"
            className="gap-2 text-red-600 border-red-300 hover:bg-red-50"
            onClick={() => {
              if (confirm("Limpar o cache local? O app irá recarregar e buscar todos os dados do servidor.")) {
                clearAppCache();
                window.location.reload();
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            Limpar Cache e Recarregar
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="p-4 text-sm space-y-2">
          <p className="font-medium">Como funciona o sistema de faltas?</p>
          <ul className="text-muted-foreground space-y-1 list-disc list-inside">
            <li>Professor faz reserva → status "Confirmada"</li>
            <li>No horário da aula, professor confirma presença → status "Realizada"</li>
            <li>Após a tolerância sem confirmação → falta registrada automaticamente</li>
            <li>Ao atingir o limite configurado → professor bloqueado para novas reservas</li>
            <li>Coordenador pode desbloquear manualmente a qualquer momento</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
