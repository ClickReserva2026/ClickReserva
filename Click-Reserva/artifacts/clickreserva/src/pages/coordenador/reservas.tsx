import { useState } from "react";
import {
  useGetReservations, useApproveReservation, useRejectReservation, useCancelReservation,
  useGetProfessors, useGetRooms, useCreateReservation,
  getGetReservationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  CheckCircle2, XCircle, Trash2, Plus, CalendarDays, Filter, Clock, User2,
  Sun, Sunset, Moon, Download, RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:   { label: "Aguardando",  className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  confirmed: { label: "Confirmada",  className: "bg-blue-100 text-blue-700 border-blue-200" },
  realized:  { label: "Realizada",   className: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Cancelada",   className: "bg-gray-100 text-gray-500 border-gray-200" },
  no_show:   { label: "Faltou",      className: "bg-red-100 text-red-700 border-red-200" },
  rejected:  { label: "Recusada",    className: "bg-orange-100 text-orange-700 border-orange-200" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "bg-gray-100 text-gray-500 border-gray-200" };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function safeDate(d: string) {
  try {
    return format(new Date(d.substring(0, 10) + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR });
  } catch { return d; }
}

const TIME_SLOTS = [
  "07:30","08:20","09:30","10:20","11:10","12:00",
  "13:05","13:55","15:05","15:55",
  "18:00","18:50","20:00","20:50","21:40",
];

type SlotEntry = { label: string; start: string; end: string };

const SCHEDULES: Record<"A" | "B", { manha: SlotEntry[]; tarde: SlotEntry[]; noite: SlotEntry[] }> = {
  A: {
    manha: [
      { label: "1ª Aula", start: "07:30", end: "08:20" },
      { label: "2ª Aula", start: "08:20", end: "09:10" },
      { label: "3ª Aula", start: "09:25", end: "10:15" },
      { label: "4ª Aula", start: "10:15", end: "11:05" },
      { label: "5ª Aula", start: "11:05", end: "11:55" },
      { label: "6ª Aula", start: "11:55", end: "12:45" },
    ],
    tarde: [
      { label: "1ª Aula", start: "13:05", end: "13:55" },
      { label: "2ª Aula", start: "13:55", end: "14:45" },
      { label: "3ª Aula", start: "15:00", end: "15:50" },
      { label: "4ª Aula", start: "15:50", end: "16:40" },
      { label: "5ª Aula", start: "16:40", end: "17:30" },
      { label: "6ª Aula", start: "17:30", end: "18:15" },
    ],
    noite: [
      { label: "6ª Aula", start: "18:00", end: "18:45" },
      { label: "1ª Aula", start: "18:45", end: "19:35" },
      { label: "2ª Aula", start: "19:35", end: "20:25" },
      { label: "3ª Aula", start: "20:40", end: "21:25" },
      { label: "4ª Aula", start: "21:25", end: "22:10" },
      { label: "5ª Aula", start: "22:10", end: "23:00" },
    ],
  },
  B: {
    manha: [
      { label: "1ª Aula", start: "07:30", end: "08:20" },
      { label: "2ª Aula", start: "08:20", end: "09:10" },
      { label: "3ª Aula", start: "09:10", end: "10:00" },
      { label: "4ª Aula", start: "10:15", end: "11:05" },
      { label: "5ª Aula", start: "11:05", end: "11:55" },
      { label: "6ª Aula", start: "11:55", end: "12:45" },
    ],
    tarde: [
      { label: "1ª Aula", start: "13:05", end: "13:55" },
      { label: "2ª Aula", start: "13:55", end: "14:45" },
      { label: "3ª Aula", start: "14:45", end: "15:35" },
      { label: "4ª Aula", start: "15:50", end: "16:40" },
      { label: "5ª Aula", start: "16:40", end: "17:30" },
      { label: "6ª Aula", start: "17:30", end: "18:15" },
    ],
    noite: [
      { label: "6ª Aula", start: "18:00", end: "18:45" },
      { label: "1ª Aula", start: "18:45", end: "19:35" },
      { label: "2ª Aula", start: "19:35", end: "20:25" },
      { label: "3ª Aula", start: "20:40", end: "21:25" },
      { label: "4ª Aula", start: "21:25", end: "22:10" },
      { label: "5ª Aula", start: "22:10", end: "23:00" },
    ],
  },
};

const INTERVALS: Record<"A" | "B", { manha: string; tarde: string; noite: string }> = {
  A: { manha: "Intervalo: 09:10–09:25", tarde: "Intervalo: 14:45–15:00", noite: "Intervalo: 20:25–20:40" },
  B: { manha: "Intervalo: 10:00–10:15", tarde: "Intervalo: 15:35–15:50", noite: "Intervalo: 20:25–20:40" },
};

const SHIFTS = [
  { key: "manha" as const, label: "Manhã", icon: Sun },
  { key: "tarde" as const, label: "Tarde", icon: Sunset },
  { key: "noite" as const, label: "Noite", icon: Moon },
];

export function CoordinatorReservasPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProfessor, setFilterProfessor] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: reservations, isLoading, refetch } = useGetReservations({});
  const { data: professors } = useGetProfessors();
  const { data: rooms } = useGetRooms();
  const approveMutation = useApproveReservation();
  const rejectMutation = useRejectReservation();
  const cancelMutation = useCancelReservation();
  const createMutation = useCreateReservation();

  const allProfessors = (professors ?? []).filter(p => p.role === "professor");

  const filtered = (reservations ?? []).filter(r => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterProfessor !== "all" && String(r.professorId) !== filterProfessor) return false;
    return true;
  });

  const pending = (reservations ?? []).filter(r => r.status === "pending");

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getGetReservationsQueryKey({}) });
  }

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: getGetReservationsQueryKey({}) });
    refetch();
  }

  function exportToExcel() {
    const STATUS_LABEL: Record<string, string> = {
      pending: "Aguardando", confirmed: "Confirmada", realized: "Realizada",
      cancelled: "Cancelada", no_show: "Faltou", rejected: "Recusada",
    };

    const rows = filtered.map(r => ({
      "Professor": r.professorName ?? "",
      "Sala": r.roomName ?? "",
      "Data": safeDate(r.date),
      "Início": r.startTime,
      "Término": r.endTime,
      "Disciplina": r.subject ?? "",
      "Turma": r.classGroup ?? "",
      "Status": STATUS_LABEL[r.status] ?? r.status,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 8 },
      { wch: 8 }, { wch: 25 }, { wch: 12 }, { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reservas");
    XLSX.writeFile(wb, `reservas-clickreserva-${new Date().toISOString().split("T")[0]}.xlsx`);
  }

  function handleApprove(id: number) {
    approveMutation.mutate({ reservationId: id }, {
      onSuccess: () => { toast({ title: "Reserva aprovada!" }); invalidate(); },
      onError: (e: any) => toast({ title: e?.message ?? "Erro ao aprovar.", variant: "destructive" }),
    });
  }

  function handleReject(id: number) {
    if (!confirm("Recusar esta reserva?")) return;
    rejectMutation.mutate({ reservationId: id }, {
      onSuccess: () => { toast({ title: "Reserva recusada." }); invalidate(); },
      onError: (e: any) => toast({ title: e?.message ?? "Erro ao recusar.", variant: "destructive" }),
    });
  }

  function handleCancel(id: number) {
    if (!confirm("Cancelar esta reserva?")) return;
    cancelMutation.mutate({ reservationId: id }, {
      onSuccess: () => { toast({ title: "Reserva cancelada." }); invalidate(); },
      onError: (e: any) => toast({ title: e?.message ?? "Erro ao cancelar.", variant: "destructive" }),
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Reservas</h1>
          <p className="text-muted-foreground mt-1">Aprove, recuse ou cancele reservas de todos os professores.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading} title="Atualizar">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" onClick={exportToExcel} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Reserva
          </Button>
        </div>
      </div>

      {pending.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-yellow-800 flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              {pending.length} reserva(s) aguardando aprovação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.map(r => (
              <div key={r.id} className="bg-white rounded-lg border border-yellow-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm">{r.professorName}</p>
                  <p className="text-xs text-muted-foreground">{r.roomName} · {safeDate(r.date)} · {r.startTime}–{r.endTime}</p>
                  <p className="text-xs text-muted-foreground">{r.subject} · {r.classGroup}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" onClick={() => handleApprove(r.id)} disabled={approveMutation.isPending}>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Aprovar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleReject(r.id)} disabled={rejectMutation.isPending}>
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Recusar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[160px]">
            <Label className="text-xs mb-1 block">Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs mb-1 block">Professor</Label>
            <Select value={filterProfessor} onValueChange={setFilterProfessor}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os professores</SelectItem>
                {allProfessors.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" />
            Reservas ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-16 bg-muted rounded-lg animate-pulse"/>)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma reserva encontrada.</p>
          ) : (
            <div className="divide-y">
              {[...filtered].sort((a, b) => b.date.localeCompare(a.date) || a.startTime.localeCompare(b.startTime)).map(r => (
                <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {r.professorName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{r.professorName}</p>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.roomName} · {safeDate(r.date)} · {r.startTime}–{r.endTime}
                      </p>
                      <p className="text-xs text-muted-foreground">{r.subject} · {r.classGroup}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-12 sm:ml-0">
                    {r.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleApprove(r.id)} disabled={approveMutation.isPending} className="text-green-600 border-green-300 hover:bg-green-50">
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(r.id)} disabled={rejectMutation.isPending} className="text-red-500 border-red-300 hover:bg-red-50">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {["pending", "confirmed"].includes(r.status) && (
                      <Button size="sm" variant="outline" onClick={() => handleCancel(r.id)} disabled={cancelMutation.isPending} className="text-gray-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddReservationDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        professors={allProfessors}
        rooms={rooms ?? []}
        onSave={(data) => {
          createMutation.mutate({ data }, {
            onSuccess: () => {
              toast({ title: "Reserva criada com sucesso!" });
              invalidate();
              setShowAddDialog(false);
            },
            onError: (e: any) => {
              const msg = e?.response?.data?.message ?? e?.message ?? "Erro ao criar reserva.";
              toast({ title: msg, variant: "destructive" });
            },
          });
        }}
        isSaving={createMutation.isPending}
      />
    </div>
  );
}

type Prof = { id: number; name: string };
type Room = { id: number; name: string; number: string };

function AddReservationDialog({
  open, onOpenChange, professors, rooms, onSave, isSaving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  professors: Prof[];
  rooms: Room[];
  onSave: (data: any) => void;
  isSaving: boolean;
}) {
  const [professorId, setProfessorId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [subject, setSubject] = useState("");
  const [classGroup, setClassGroup] = useState("");
  const [scheduleVariant, setScheduleVariant] = useState<"A" | "B">("A");
  const [activeShift, setActiveShift] = useState<"manha" | "tarde" | "noite">("manha");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const slots = SCHEDULES[scheduleVariant][activeShift];
  const interval = INTERVALS[scheduleVariant][activeShift];

  function selectSlot(slot: SlotEntry) {
    const key = `${slot.label}-${activeShift}`;
    setSelectedSlot(key);
    setStartTime(slot.start);
    setEndTime(slot.end);
  }

  function handleClose(v: boolean) {
    if (!v) {
      setProfessorId(""); setRoomId("");
      setDate(new Date().toISOString().split("T")[0]);
      setStartTime(""); setEndTime("");
      setSubject(""); setClassGroup("");
      setSelectedSlot(null);
    }
    onOpenChange(v);
  }

  const valid = professorId && roomId && date && startTime && endTime && subject && classGroup && startTime < endTime;

  function handleSubmit() {
    if (!valid) return;
    onSave({
      professorId: parseInt(professorId, 10),
      roomId: parseInt(roomId, 10),
      date,
      startTime,
      endTime,
      subject,
      classGroup,
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nova Reserva para Professor
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">

          {/* Professor */}
          <div>
            <Label className="text-sm mb-1.5 block">Professor *</Label>
            <Select value={professorId} onValueChange={setProfessorId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o professor" />
              </SelectTrigger>
              <SelectContent>
                {professors.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sala */}
          <div>
            <Label className="text-sm mb-1.5 block">Sala *</Label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a sala" />
              </SelectTrigger>
              <SelectContent>
                {rooms.filter(r => (r as any).isActive !== false).map(r => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.number} – {r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data */}
          <div>
            <Label className="text-sm mb-1.5 block">Data *</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          {/* Seletor de aula */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              Selecionar por Aula
            </div>

            {/* Tipo A/B */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Horário:</span>
              <div className="flex rounded-md border overflow-hidden">
                {(["A", "B"] as const).map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => { setScheduleVariant(v); setSelectedSlot(null); }}
                    className={cn(
                      "px-3 py-1 text-xs font-medium transition-colors",
                      scheduleVariant === v
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted text-muted-foreground"
                    )}
                  >
                    Bloco {v === "A" ? "1" : "2"}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">({interval})</span>
            </div>

            {/* Turnos */}
            <div className="flex gap-1.5">
              {SHIFTS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setActiveShift(key); setSelectedSlot(null); }}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors",
                    activeShift === key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Grade de aulas */}
            <div className="grid grid-cols-3 gap-1.5">
              {slots.map(slot => {
                const key = `${slot.label}-${activeShift}`;
                const isSelected = selectedSlot === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectSlot(slot)}
                    className={cn(
                      "flex flex-col items-start px-2.5 py-2 rounded-md border text-left transition-all",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background border-border hover:border-primary/50 hover:bg-muted/60"
                    )}
                  >
                    <span className={cn("text-xs font-bold", isSelected ? "text-primary-foreground" : "text-foreground")}>
                      {slot.label}
                    </span>
                    <span className={cn("text-[10px] tabular-nums", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      {slot.start}–{slot.end}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedSlot && (
              <div className="flex items-center gap-2 text-xs text-primary font-medium bg-primary/5 border border-primary/20 rounded-md px-2.5 py-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                Selecionado: <strong>{startTime} – {endTime}</strong>
                <button
                  type="button"
                  onClick={() => { setSelectedSlot(null); setStartTime(""); setEndTime(""); }}
                  className="ml-auto text-muted-foreground underline"
                >
                  limpar
                </button>
              </div>
            )}
          </div>

          {/* Horário manual (fallback) */}
          {!selectedSlot && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-1.5 block">Início manual *</Label>
                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Fim manual *</Label>
                <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
          )}

          {/* Disciplina */}
          <div>
            <Label className="text-sm mb-1.5 block">Disciplina *</Label>
            <Input placeholder="Ex: Informática Aplicada" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>

          {/* Turma */}
          <div>
            <Label className="text-sm mb-1.5 block">Turma *</Label>
            <Input placeholder="Ex: 2º A" value={classGroup} onChange={e => setClassGroup(e.target.value)} />
          </div>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!valid || isSaving}>
            {isSaving ? "Salvando..." : "Criar Reserva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
