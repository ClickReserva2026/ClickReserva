import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useGetReservations, useCancelReservation, getGetReservationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarDays, Plus, Trash2, MonitorPlay, Clock,
  LayoutList, Table2, CalendarRange,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

type ViewMode = "cards" | "tabela" | "calendario";

const BASE_SLOTS = [
  "07:30","08:20","09:30","10:20","11:10","12:00",
  "13:05","13:55","15:05","15:55",
  "18:00","18:50","20:00","20:50","21:40",
];

const WEEK_DAYS_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const WEEK_DAYS_FULL = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];

function safeFormatDate(dateStr: string, fmt: string): string {
  try {
    const d = new Date(dateStr.substring(0, 10) + "T12:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return format(d, fmt, { locale: ptBR });
  } catch { return dateStr; }
}

function toDateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

const STATUS_CONFIG: Record<string, { label: string; className: string; calClass: string }> = {
  confirmed: { label: "Confirmada",   className: "bg-blue-100 text-blue-700 border-blue-200",     calClass: "bg-blue-50 border-blue-300 text-blue-800"     },
  realized:  { label: "Realizada",    className: "bg-green-100 text-green-700 border-green-200",   calClass: "bg-green-50 border-green-300 text-green-800"   },
  pending:   { label: "Aguardando",   className: "bg-yellow-100 text-yellow-700 border-yellow-200", calClass: "bg-yellow-50 border-yellow-300 text-yellow-800" },
  cancelled: { label: "Cancelada",   className: "bg-gray-100 text-gray-500 border-gray-200",      calClass: "bg-gray-100 border-gray-300 text-gray-500"     },
  no_show:   { label: "Faltou",      className: "bg-red-100 text-red-700 border-red-200",          calClass: "bg-red-50 border-red-300 text-red-700"         },
  rejected:  { label: "Recusada",    className: "bg-orange-100 text-orange-700 border-orange-200", calClass: "bg-orange-50 border-orange-300 text-orange-800" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "bg-gray-100 text-gray-500 border-gray-200" };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

export function ReservationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("tabela");
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 });
  });

  const isCoordinator = user?.role === "coordinator" || user?.role === "admin";

  const { data: reservations, isLoading } = useGetReservations(
    isCoordinator ? {} : { professorId: user?.id },
    { query: { queryKey: getGetReservationsQueryKey(isCoordinator ? {} : { professorId: user?.id }) } }
  );

  const cancelMutation = useCancelReservation();

  function handleCancel(id: number) {
    if (!confirm("Deseja cancelar esta reserva?")) return;
    cancelMutation.mutate({ reservationId: id }, {
      onSuccess: () => {
        toast({ title: "Reserva cancelada com sucesso." });
        queryClient.invalidateQueries({ queryKey: getGetReservationsQueryKey() });
      },
      onError: () => toast({ title: "Erro ao cancelar.", variant: "destructive" }),
    });
  }

  const filtered = (reservations ?? [])
    .filter(r => !filterStatus || r.status === filterStatus)
    .sort((a, b) => b.date.localeCompare(a.date) || a.startTime.localeCompare(b.startTime));

  // Calendar helpers
  const weekDays = useMemo(() => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const calSlots = useMemo(() => {
    const extra = (reservations ?? []).map(r => r.startTime);
    return [...new Set([...BASE_SLOTS, ...extra])].sort();
  }, [reservations]);

  // reservationsByDateSlot[dateKey][startTime] = reservation[]
  const reservationsByDateSlot = useMemo(() => {
    const map: Record<string, Record<string, typeof reservations>> = {};
    (reservations ?? []).forEach(r => {
      if (!map[r.date]) map[r.date] = {};
      if (!map[r.date][r.startTime]) map[r.date][r.startTime] = [];
      map[r.date][r.startTime]!.push(r);
    });
    return map;
  }, [reservations]);

  // Only show slots that have at least one reservation OR are default
  const visibleSlots = useMemo(() => {
    const hasReservationInWeek = new Set<string>();
    weekDays.forEach(d => {
      const key = toDateKey(d);
      if (reservationsByDateSlot[key]) {
        Object.keys(reservationsByDateSlot[key]).forEach(t => hasReservationInWeek.add(t));
      }
    });
    return calSlots.filter(s => BASE_SLOTS.includes(s) || hasReservationInWeek.has(s));
  }, [calSlots, weekDays, reservationsByDateSlot]);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minhas Reservas</h1>
          <p className="text-muted-foreground mt-1">
            {isCoordinator ? "Todas as reservas do sistema" : "Seu histórico de agendamentos"}
          </p>
        </div>
        <Button asChild data-testid="button-nova-reserva">
          <Link href="/reservas/nova">
            <Plus className="h-4 w-4 mr-2" /> Nova Reserva
          </Link>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {viewMode !== "calendario" ? (
          <div className="flex gap-2 flex-wrap">
            {(["", "confirmed", "realized", "pending", "cancelled", "no_show"] as const).map(s => (
              <Button
                key={s}
                variant={filterStatus === s ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(s)}
                data-testid={`filter-status-${s || "all"}`}
              >
                {s === "" ? "Todas" : STATUS_CONFIG[s]?.label ?? s}
              </Button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setWeekStart(d => addDays(d, -7))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[180px] text-center">
              {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} – {format(addDays(weekStart, 5), "dd 'de' MMMM yyyy", { locale: ptBR })}
            </span>
            <Button size="sm" variant="outline" onClick={() => setWeekStart(d => addDays(d, 7))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="text-xs text-primary"
            >
              Hoje
            </Button>
          </div>
        )}

        <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-muted/40">
          <button
            onClick={() => setViewMode("cards")}
            className={`p-1.5 rounded transition-colors ${viewMode === "cards" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            title="Cards"
          ><LayoutList className="h-4 w-4" /></button>
          <button
            onClick={() => setViewMode("tabela")}
            className={`p-1.5 rounded transition-colors ${viewMode === "tabela" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            title="Tabela"
          ><Table2 className="h-4 w-4" /></button>
          <button
            onClick={() => setViewMode("calendario")}
            className={`p-1.5 rounded transition-colors ${viewMode === "calendario" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            title="Calendário"
          ><CalendarRange className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Summary chips (not in calendar mode) */}
      {!isLoading && (reservations ?? []).length > 0 && viewMode !== "calendario" && (
        <div className="flex gap-3 flex-wrap text-xs">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = (reservations ?? []).filter(r => r.status === key).length;
            if (!count) return null;
            return (
              <button
                key={key}
                onClick={() => setFilterStatus(filterStatus === key ? "" : key)}
                className={`px-2.5 py-1 rounded-full border font-semibold transition-opacity ${cfg.className} ${filterStatus && filterStatus !== key ? "opacity-40" : ""}`}
              >
                {cfg.label}: {count}
              </button>
            );
          })}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
        </div>
      )}

      {/* ─── CALENDAR VIEW ─── */}
      {!isLoading && viewMode === "calendario" && (
        <div className="rounded-xl border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-[#1a3a6b] text-white px-3 py-3 text-left font-semibold whitespace-nowrap w-20 border-r border-white/20">
                    Horário
                  </th>
                  {weekDays.map((d, i) => {
                    const isToday = isSameDay(d, new Date());
                    return (
                      <th
                        key={i}
                        className={`px-2 py-3 font-semibold text-center whitespace-nowrap border-r last:border-r-0 ${isToday ? "bg-primary text-white" : "bg-[#1e4080] text-white"}`}
                      >
                        <div className="font-bold">{WEEK_DAYS_PT[d.getDay()]}</div>
                        <div className="text-[10px] font-normal opacity-80">{format(d, "dd/MM/yyyy")}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {visibleSlots.map((slot, si) => (
                  <tr key={slot} className={si % 2 === 0 ? "bg-white" : "bg-gray-50/80"}>
                    <td className="sticky left-0 z-10 bg-inherit px-3 py-2 font-semibold text-muted-foreground border-r border-gray-200 whitespace-nowrap">
                      {slot}
                    </td>
                    {weekDays.map((d, di) => {
                      const key = toDateKey(d);
                      const cell = reservationsByDateSlot[key]?.[slot] ?? [];
                      return (
                        <td key={di} className="px-1.5 py-1.5 border-r last:border-r-0 border-gray-200 align-top min-w-[120px]">
                          {cell.length > 0 ? (
                            <div className="space-y-1">
                              {cell.map(r => {
                                const cfg = STATUS_CONFIG[r.status];
                                return (
                                  <div
                                    key={r.id}
                                    className={`rounded border px-2 py-1.5 leading-tight ${cfg?.calClass ?? "bg-gray-50 border-gray-200"}`}
                                  >
                                    <div className="font-semibold truncate max-w-[130px]">
                                      {isCoordinator ? r.professorName?.split(" ")[0] ?? "?" : r.subject}
                                    </div>
                                    <div className="text-[10px] opacity-70">{r.startTime}–{r.endTime}</div>
                                    {isCoordinator && <div className="text-[10px] truncate opacity-60">{r.roomName}</div>}
                                    <div className={`text-[10px] font-semibold mt-0.5 ${cfg?.calClass?.includes("blue") ? "text-blue-700" : cfg?.calClass?.includes("green") ? "text-green-700" : cfg?.calClass?.includes("red") ? "text-red-700" : cfg?.calClass?.includes("yellow") ? "text-yellow-700" : "text-gray-500"}`}>
                                      {cfg?.label}
                                    </div>
                                    {(r.status === "confirmed" || r.status === "pending") && (
                                      <button
                                        className="mt-1 text-[9px] text-red-500 hover:text-red-700 underline"
                                        onClick={() => handleCancel(r.id)}
                                      >
                                        cancelar
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <Link href={`/reservas/nova?date=${key}&time=${slot}`}>
                              <span className="text-muted-foreground/50 hover:text-primary hover:font-medium transition-colors cursor-pointer text-[11px] flex items-center gap-0.5 py-0.5">
                                <Plus className="h-3 w-3" />
                                Reservar
                              </span>
                            </Link>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calendar legend */}
          <div className="px-4 py-2.5 bg-muted/30 border-t flex items-center gap-4 flex-wrap text-xs">
            {Object.entries(STATUS_CONFIG).map(([, cfg]) => (
              <span key={cfg.label} className={`px-2 py-0.5 rounded border font-medium ${cfg.className}`}>{cfg.label}</span>
            ))}
          </div>
        </div>
      )}

      {/* ─── TABLE VIEW ─── */}
      {!isLoading && viewMode === "tabela" && (
        filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-48 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground mb-4 opacity-40" />
              <p className="text-muted-foreground">Nenhuma reserva encontrada.</p>
              <Button variant="link" asChild className="mt-2"><Link href="/reservas/nova">Fazer primeiro agendamento</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-xl border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60 border-b text-muted-foreground">
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Data</th>
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Horário</th>
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Sala</th>
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Disciplina</th>
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Turma</th>
                    {isCoordinator && <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Professor</th>}
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={r.id} className={`border-b last:border-0 hover:bg-muted/30 ${i % 2 !== 0 ? "bg-muted/10" : ""}`} data-testid={`row-reserva-${r.id}`}>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{safeFormatDate(r.date, "dd/MM/yyyy (EEE)")}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{r.startTime}–{r.endTime}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <MonitorPlay className="h-3.5 w-3.5 text-primary/60" />
                          {r.roomName} <span className="text-muted-foreground text-xs">({r.roomNumber})</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[160px] truncate">{r.subject}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{r.classGroup}</td>
                      {isCoordinator && <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">{r.professorName}</td>}
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3 text-right">
                        {(r.status === "confirmed" || r.status === "pending") && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => handleCancel(r.id)} disabled={cancelMutation.isPending} data-testid={`button-cancel-${r.id}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 bg-muted/30 border-t text-xs text-muted-foreground text-right">
              {filtered.length} reserva{filtered.length !== 1 ? "s" : ""} {filterStatus ? `com status "${STATUS_CONFIG[filterStatus]?.label}"` : "no total"}
            </div>
          </div>
        )
      )}

      {/* ─── CARD VIEW ─── */}
      {!isLoading && viewMode === "cards" && (
        filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-48 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground mb-4 opacity-40" />
              <p className="text-muted-foreground">Nenhuma reserva encontrada.</p>
              <Button variant="link" asChild className="mt-2"><Link href="/reservas/nova">Fazer primeiro agendamento</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => (
              <Card key={r.id} className="hover:shadow-md transition-shadow" data-testid={`card-reserva-${r.id}`}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex flex-col items-center justify-center text-primary flex-shrink-0">
                      <Clock className="h-4 w-4" />
                      <span className="text-[10px] font-bold leading-none mt-0.5">{r.startTime}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{r.subject} — {r.classGroup}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><MonitorPlay className="h-3 w-3" />{r.roomName} ({r.roomNumber})</span>
                        <span className="opacity-40">•</span>
                        <span>{safeFormatDate(r.date, "dd/MM/yyyy")}</span>
                        <span className="opacity-40">•</span>
                        <span>{r.startTime}–{r.endTime}</span>
                      </div>
                      {isCoordinator && <p className="text-xs text-muted-foreground mt-0.5">Prof. {r.professorName}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={r.status} />
                    {(r.status === "confirmed" || r.status === "pending") && (
                      <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleCancel(r.id)} disabled={cancelMutation.isPending} data-testid={`button-cancel-${r.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}
