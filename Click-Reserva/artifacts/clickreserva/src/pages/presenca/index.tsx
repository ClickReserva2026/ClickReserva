import { useAuth } from "@/contexts/auth-context";
import { useGetReservations, useConfirmPresence, getGetReservationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, MonitorPlay, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function statusColor(status: string): string {
  switch (status) {
    case "confirmed": return "bg-blue-100 text-blue-700 border-blue-200";
    case "realized": return "bg-green-100 text-green-700 border-green-200";
    case "no_show": return "bg-red-100 text-red-700 border-red-200";
    default: return "bg-gray-100 text-gray-500 border-gray-200";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "confirmed": return "Aguardando confirmação";
    case "realized": return "Presença confirmada";
    case "no_show": return "Não compareceu";
    default: return status;
  }
}

export function PresencePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isCoordinator = user?.role === "coordinator" || user?.role === "admin";

  const today = new Date().toISOString().split("T")[0];

  const queryParams = isCoordinator
    ? { date: today }
    : { professorId: user?.id, date: today };

  const { data: reservations, isLoading } = useGetReservations(
    queryParams,
    { query: { queryKey: getGetReservationsQueryKey(queryParams) } }
  );

  const confirmMutation = useConfirmPresence();

  function canConfirm(startTime: string, endTime: string): boolean {
    if (isCoordinator) return true;
    const now = new Date();
    const nowBR = new Date(now.getTime());
    const start = new Date(`${today}T${startTime}:00-03:00`);
    const end = new Date(`${today}T${endTime}:00-03:00`);
    return nowBR >= start && nowBR <= end;
  }

  function handleConfirm(id: number) {
    confirmMutation.mutate({ reservationId: id }, {
      onSuccess: () => {
        toast({ title: "Presença confirmada com sucesso!" });
        queryClient.invalidateQueries({ queryKey: getGetReservationsQueryKey() });
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? err?.message ?? "Não foi possível confirmar presença.";
        toast({ title: msg, variant: "destructive" });
      }
    });
  }

  const activeReservations = (reservations ?? []).filter(r =>
    r.status === "confirmed" || r.status === "realized"
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Confirmar Presença</h1>
        <p className="text-muted-foreground mt-1">
          {isCoordinator
            ? `Aulas de hoje — ${format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}`
            : `Confirme sua presença nas reservas de hoje: ${format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}.`}
        </p>
      </div>

      {isCoordinator && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <Users className="h-4 w-4 flex-shrink-0" />
          <span>Como coordenador, você pode confirmar a presença de qualquer professor a qualquer momento.</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-28 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : activeReservations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 text-center p-6">
            <Calendar className="h-10 w-10 text-muted-foreground mb-4 opacity-40" />
            <p className="text-muted-foreground">Nenhuma reserva confirmada para hoje.</p>
            {isCoordinator && (
              <p className="text-xs text-muted-foreground mt-2">Reservas pendentes precisam ser aprovadas primeiro em "Gerenciar Reservas".</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeReservations.map(r => {
            const canConfirmNow = canConfirm(r.startTime, r.endTime);
            const alreadyConfirmed = r.confirmedPresence;

            return (
              <Card key={r.id} className="hover:shadow-md transition-shadow" data-testid={`card-presenca-${r.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex flex-col items-center justify-center text-primary flex-shrink-0">
                        <Clock className="h-4 w-4" />
                        <span className="text-[10px] font-bold leading-none mt-0.5">{r.startTime}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{r.subject} — {r.classGroup}</p>
                        {isCoordinator && (
                          <p className="text-xs font-medium text-primary mt-0.5">{r.professorName}</p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                          <MonitorPlay className="h-3 w-3" />
                          <span>{r.roomName}</span>
                          <span className="text-muted-foreground/40">•</span>
                          <span>{r.startTime} – {r.endTime}</span>
                        </div>
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border mt-2 ${statusColor(r.status)}`}>
                          {statusLabel(r.status)}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {alreadyConfirmed ? (
                        <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Confirmado
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleConfirm(r.id)}
                          disabled={!canConfirmNow || confirmMutation.isPending}
                          title={!canConfirmNow ? "Disponível apenas durante o horário da reserva" : ""}
                          data-testid={`button-confirmar-${r.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          Confirmar
                        </Button>
                      )}
                    </div>
                  </div>

                  {!alreadyConfirmed && !canConfirmNow && r.status === "confirmed" && !isCoordinator && (
                    <p className="text-xs text-muted-foreground mt-3 italic">
                      Botão disponível das {r.startTime} às {r.endTime}.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isCoordinator && (
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Como funciona a confirmação de presença?</p>
            <p>Durante o horário reservado, clique em "Confirmar" para registrar que você compareceu ao laboratório. Após{" "}
              <strong>3 faltas</strong> sem confirmação, sua conta será automaticamente bloqueada para novas reservas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
