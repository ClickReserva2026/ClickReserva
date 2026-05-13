import { useState } from "react";
import {
  useGetProfessors, useGetAbsences, useUnblockProfessor, getGetProfessorsQueryKey,
  useGetBlockedSlots, useCreateBlockedSlot, useDeleteBlockedSlot, getGetBlockedSlotsQueryKey,
} from "@workspace/api-client-react";
import { useGetRooms } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ShieldAlert, ShieldCheck, AlertTriangle, Calendar, Lock, Plus, Trash2, Ban } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function safeFormatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const clean = String(dateStr).substring(0, 10);
    const d = new Date(clean + "T12:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return format(d, "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return String(dateStr);
  }
}

const TIME_SLOTS = [
  "07:30","08:20","09:30","10:20","11:10","12:00",
  "13:05","13:55","15:05","15:55",
  "18:00","18:50","20:00","20:50","21:40",
];

function AddBlockDialog({
  open, onOpenChange, rooms, onSave, isSaving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rooms: any[];
  onSave: (data: any) => void;
  isSaving: boolean;
}) {
  const [roomId, setRoomId] = useState("all");
  const [date, setDate] = useState("");
  const [useDate, setUseDate] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");

  const valid = startTime && endTime && reason && startTime < endTime;

  function handleSubmit() {
    if (!valid) return;
    onSave({
      roomId: roomId === "all" ? null : parseInt(roomId, 10),
      date: useDate && date ? date : null,
      startTime,
      endTime,
      reason,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Bloquear Horário
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm mb-1.5 block">Sala</Label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as salas</SelectItem>
                {rooms.map((r: any) => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.number} – {r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <input
                type="checkbox"
                id="useDate"
                checked={useDate}
                onChange={e => setUseDate(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="useDate" className="text-sm cursor-pointer">Data específica</Label>
            </div>
            {useDate && (
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            )}
            {!useDate && (
              <p className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded-md">
                Sem data: o bloqueio vale para todos os dias (bloqueio permanente no horário)
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm mb-1.5 block">Início *</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Hora início" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Fim *</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Hora fim" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.filter(t => !startTime || t > startTime).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-sm mb-1.5 block">Motivo *</Label>
            <Input
              placeholder="Ex: Reunião pedagógica, Manutenção..."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancelar</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={!valid || isSaving}>
            {isSaving ? "Bloqueando..." : "Bloquear Horário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CoordinatorBlockedPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  const { data: professors, isLoading: prLoading } = useGetProfessors();
  const { data: absences, isLoading: abLoading } = useGetAbsences({});
  const { data: rooms } = useGetRooms();
  const { data: blockedSlots, isLoading: bsLoading } = useGetBlockedSlots({});
  const unblockMutation = useUnblockProfessor();
  const createSlotMutation = useCreateBlockedSlot();
  const deleteSlotMutation = useDeleteBlockedSlot();

  const blocked = (professors ?? []).filter(p => p.blocked);
  const allProfessors = (professors ?? []).filter(p => p.role === "professor");

  function handleUnblock(id: number, name: string) {
    if (!confirm(`Desbloquear ${name}? O contador de faltas será zerado.`)) return;
    unblockMutation.mutate({ professorId: id }, {
      onSuccess: () => {
        toast({ title: `${name} foi desbloqueado(a) com sucesso.` });
        queryClient.invalidateQueries({ queryKey: getGetProfessorsQueryKey() });
      },
      onError: () => {
        toast({ title: "Erro ao desbloquear.", variant: "destructive" });
      }
    });
  }

  function handleDeleteSlot(id: number) {
    if (!confirm("Remover este bloqueio de horário?")) return;
    deleteSlotMutation.mutate({ slotId: id }, {
      onSuccess: () => {
        toast({ title: "Bloqueio removido." });
        queryClient.invalidateQueries({ queryKey: getGetBlockedSlotsQueryKey({}) });
      },
      onError: () => toast({ title: "Erro ao remover bloqueio.", variant: "destructive" }),
    });
  }

  function absenceColor(total: number): string {
    if (total === 0) return "text-green-600";
    if (total <= 1) return "text-yellow-500";
    if (total === 2) return "text-orange-500";
    return "text-red-600";
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bloqueios e Restrições</h1>
        <p className="text-muted-foreground mt-1">Gerencie bloqueios de horários e professores bloqueados por faltas.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Lock className="h-5 w-5" />
              Horários Bloqueados ({(blockedSlots ?? []).length})
            </CardTitle>
            <Button size="sm" variant="destructive" onClick={() => setShowBlockDialog(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Bloquear Horário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {bsLoading ? (
            <div className="space-y-2">{[1,2].map(i=><div key={i} className="h-14 bg-muted rounded animate-pulse"/>)}</div>
          ) : (blockedSlots ?? []).length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Nenhum horário bloqueado.</p>
          ) : (
            <div className="space-y-2">
              {(blockedSlots ?? []).map((slot: any) => (
                <div key={slot.id} className="flex items-center justify-between p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                  <div>
                    <p className="text-sm font-semibold">{slot.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {slot.roomName ? `${slot.roomNumber} – ${slot.roomName}` : "Todas as salas"} ·{" "}
                      {slot.date ? safeFormatDate(slot.date) : "Todo dia"} ·{" "}
                      {slot.startTime} – {slot.endTime}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteSlot(slot.id)}
                    disabled={deleteSlotMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Professores Bloqueados por Faltas ({blocked.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prLoading ? (
            <div className="space-y-3">{[1,2].map(i=><div key={i} className="h-16 bg-muted rounded-lg animate-pulse"/>)}</div>
          ) : blocked.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <ShieldCheck className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-muted-foreground">Nenhum professor bloqueado no momento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blocked.map(p => (
                <div key={p.id} className="flex items-start justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5" data-testid={`card-blocked-${p.id}`}>
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center text-destructive font-bold text-sm">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-sm text-muted-foreground">{p.email}</p>
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {p.totalAbsences} faltas · {p.blockedAt ? `Bloqueado em ${safeFormatDate(p.blockedAt)}` : ""}
                      </p>
                      {p.blockReason && (
                        <p className="text-xs text-muted-foreground mt-0.5">{p.blockReason}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUnblock(p.id, p.name)}
                    disabled={unblockMutation.isPending}
                    data-testid={`button-unblock-${p.id}`}
                  >
                    <ShieldCheck className="h-4 w-4 mr-1.5" />
                    Desbloquear
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Situação dos Professores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prLoading ? (
            <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-12 bg-muted rounded animate-pulse"/>)}</div>
          ) : (
            <div className="divide-y">
              {allProfessors.sort((a,b) => b.totalAbsences - a.totalAbsences).map(p => (
                <div key={p.id} className="flex items-center justify-between py-3" data-testid={`row-status-${p.id}`}>
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </div>
                  <span className={`text-sm font-bold ${absenceColor(p.totalAbsences)}`}>
                    {p.totalAbsences} falta(s)
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico de Faltas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {abLoading ? (
            <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-12 bg-muted rounded animate-pulse"/>)}</div>
          ) : (absences ?? []).length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Nenhuma falta registrada.</p>
          ) : (
            <div className="divide-y">
              {(absences ?? []).map(a => (
                <div key={a.id} className="flex items-center justify-between py-3" data-testid={`row-absence-${a.id}`}>
                  <div>
                    <p className="text-sm font-medium">{a.professorName}</p>
                    <p className="text-xs text-muted-foreground">Reserva #{a.reservationId}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {safeFormatDate(a.absenceDate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddBlockDialog
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog}
        rooms={(rooms ?? []).filter((r: any) => r.isActive !== false)}
        onSave={(data) => {
          createSlotMutation.mutate({ data }, {
            onSuccess: () => {
              toast({ title: "Horário bloqueado com sucesso!" });
              queryClient.invalidateQueries({ queryKey: getGetBlockedSlotsQueryKey({}) });
              setShowBlockDialog(false);
            },
            onError: () => toast({ title: "Erro ao bloquear horário.", variant: "destructive" }),
          });
        }}
        isSaving={createSlotMutation.isPending}
      />
    </div>
  );
}
