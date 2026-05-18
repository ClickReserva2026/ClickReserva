import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetRooms, useCreateReservation, useCheckConflicts, useGetProfessors, getGetReservationsQueryKey, getCheckConflictsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, CalendarPlus, Clock, Sun, Sunset, Moon, Tablet } from "lucide-react"; // ← TABLET
import { cn } from "@/lib/utils";

const newReservationSchema = z.object({
  roomId: z.string().min(1, "Selecione uma sala"),
  date: z.string().min(1, "Informe a data"),
  startTime: z.string().min(1, "Informe o horário de início"),
  endTime: z.string().min(1, "Informe o horário de término"),
  subject: z.string().min(1, "Informe a disciplina"),
  classGroup: z.string().min(1, "Informe a turma"),
  professorId: z.string().optional(),
  tabletQuantity: z.number().int().min(0).max(30).default(0), // ← TABLET
});

type NewReservationForm = z.infer<typeof newReservationSchema>;

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
  { key: "manha" as const, label: "Manhã", icon: Sun, color: "text-amber-600", bg: "bg-amber-50 border-amber-200 hover:bg-amber-100", selectedBg: "bg-amber-500 border-amber-500 text-white hover:bg-amber-500" },
  { key: "tarde" as const, label: "Tarde", icon: Sunset, color: "text-sky-600", bg: "bg-sky-50 border-sky-200 hover:bg-sky-100", selectedBg: "bg-sky-500 border-sky-500 text-white hover:bg-sky-500" },
  { key: "noite" as const, label: "Noite", icon: Moon, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100", selectedBg: "bg-indigo-500 border-indigo-500 text-white hover:bg-indigo-500" },
];

export function NewReservationPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rooms } = useGetRooms();
  const { data: allProfessors } = useGetProfessors();
  const createMutation = useCreateReservation();

  const isCoordinatorOrAdmin = user?.role === "coordinator" || user?.role === "admin";

  const [scheduleVariant, setScheduleVariant] = useState<"A" | "B">("A");
  const [activeShift, setActiveShift] = useState<"manha" | "tarde" | "noite">("manha");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const form = useForm<NewReservationForm>({
    resolver: zodResolver(newReservationSchema),
    defaultValues: {
      roomId: "",
      date: new Date().toISOString().split("T")[0],
      startTime: "",
      endTime: "",
      subject: "",
      classGroup: "",
      professorId: "",
      tabletQuantity: 0, // ← TABLET
    },
  });

  const watchedRoomId = form.watch("roomId");
  const watchedDate = form.watch("date");
  const watchedStartTime = form.watch("startTime");
  const watchedEndTime = form.watch("endTime");

  const canCheckConflict = !!(watchedRoomId && watchedDate && watchedStartTime && watchedEndTime && watchedStartTime < watchedEndTime);

  const { data: conflictResult } = useCheckConflicts(
    canCheckConflict ? {
      roomId: parseInt(watchedRoomId, 10),
      date: watchedDate,
      startTime: watchedStartTime,
      endTime: watchedEndTime,
    } : undefined as any,
    { query: { enabled: canCheckConflict, queryKey: getCheckConflictsQueryKey(canCheckConflict ? { roomId: parseInt(watchedRoomId, 10), date: watchedDate, startTime: watchedStartTime, endTime: watchedEndTime } : undefined) } }
  );

  const activeRooms = (rooms ?? []).filter(r => r.isActive);

  function selectSlot(slot: SlotEntry) {
    const key = `${slot.label}-${activeShift}`;
    setSelectedSlot(key);
    form.setValue("startTime", slot.start, { shouldValidate: true });
    form.setValue("endTime", slot.end, { shouldValidate: true });
  }

  function onSubmit(values: NewReservationForm) {
    if (user?.blocked) {
      toast({ title: "Você está bloqueado e não pode fazer reservas.", variant: "destructive" });
      return;
    }
    if (conflictResult?.hasConflict) {
      toast({ title: "Conflito de horário detectado. Escolha outro horário ou sala.", variant: "destructive" });
      return;
    }

    const body: Record<string, unknown> = {
      roomId: parseInt(values.roomId, 10),
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      subject: values.subject,
      classGroup: values.classGroup,
      tabletQuantity: values.tabletQuantity ?? 0, // ← TABLET
    };
    if (isCoordinatorOrAdmin && values.professorId) {
      body.professorId = parseInt(values.professorId, 10);
    }
    createMutation.mutate({ data: body as any }, {
      onSuccess: () => {
        const msg = isCoordinatorOrAdmin
          ? "Reserva criada e confirmada!"
          : "Reserva enviada! Aguardando aprovação da coordenação.";
        toast({ title: msg });
        queryClient.invalidateQueries({ queryKey: getGetReservationsQueryKey() });
        setLocation("/reservas");
      },
      onError: (err: any) => {
        const msg = (err as any)?.data?.message ?? (err as any)?.message ?? "Erro ao criar reserva.";
        toast({ title: msg, variant: "destructive" });
      }
    });
  }

  const currentShift = SHIFTS.find(s => s.key === activeShift)!;
  const slots = SCHEDULES[scheduleVariant][activeShift];
  const interval = INTERVALS[scheduleVariant][activeShift];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova Reserva</h1>
        <p className="text-muted-foreground mt-1">
          {isCoordinatorOrAdmin
            ? "Agende o laboratório para você ou em nome de outro professor."
            : "Agende o uso do laboratório de informática para sua turma."}
        </p>
      </div>

      {user?.blocked && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-destructive">Conta bloqueada</p>
            <p className="text-sm text-destructive/80 mt-0.5">{user.blockReason ?? "Procure a coordenação para regularizar."}</p>
          </div>
        </div>
      )}

      {!user?.blocked && user?.role !== "coordinator" && user?.role !== "admin" && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-yellow-800">Aprovação necessária</p>
            <p className="text-sm text-yellow-700 mt-0.5">Após enviar, a reserva ficará <strong>aguardando aprovação</strong> da coordenação antes de ser confirmada.</p>
          </div>
        </div>
      )}

      {/* Seletor de Aula */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5" />
            Selecionar por Aula
          </CardTitle>
          <CardDescription>
            Clique na aula desejada para preencher o horário automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">Horário:</span>
            <div className="flex rounded-lg border overflow-hidden">
              {(["A", "B"] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => { setScheduleVariant(v); setSelectedSlot(null); }}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium transition-colors",
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

          <div className="flex gap-2">
            {SHIFTS.map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setActiveShift(key); setSelectedSlot(null); }}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                  activeShift === key
                    ? "bg-primary text-primary-foreground border-primary"
                    : `bg-background border-muted hover:bg-muted ${color}`
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {slots.map((slot) => {
              const key = `${slot.label}-${activeShift}`;
              const isSelected = selectedSlot === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectSlot(slot)}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-lg border text-left transition-all",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : `border-border hover:border-primary/50 hover:bg-muted/60`
                  )}
                >
                  <span className={cn("text-sm font-bold", isSelected ? "text-primary-foreground" : "text-foreground")}>
                    {slot.label}
                  </span>
                  <span className={cn("text-xs tabular-nums mt-0.5", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                    {slot.start} – {slot.end}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedSlot && (
            <div className="flex items-center gap-2 text-sm text-primary font-medium bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Horário selecionado: <strong>{watchedStartTime} – {watchedEndTime}</strong>
              <button
                type="button"
                onClick={() => { setSelectedSlot(null); form.setValue("startTime", ""); form.setValue("endTime", ""); }}
                className="ml-auto text-xs text-muted-foreground underline"
              >
                limpar
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" />
            Dados da Reserva
          </CardTitle>
          <CardDescription>Preencha todos os campos para confirmar o agendamento.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

              {isCoordinatorOrAdmin && (
                <FormField
                  control={form.control}
                  name="professorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reservar em nome de (Professor)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o professor (opcional — deixe em branco para si mesmo)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(allProfessors ?? [])
                            .filter(p => p.isActive && p.id !== user?.id)
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(p => (
                              <SelectItem key={p.id} value={String(p.id)}>
                                {p.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sala de Informática</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-sala">
                          <SelectValue placeholder="Selecione a sala" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeRooms.map(r => (
                          <SelectItem key={r.id} value={String(r.id)}>
                            {r.number} — {r.name} ({r.computers} computadores)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" data-testid="input-date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Início</FormLabel>
                      <FormControl>
                        <Input type="time" data-testid="select-start-time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Término</FormLabel>
                      <FormControl>
                        <Input type="time" data-testid="select-end-time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {canCheckConflict && conflictResult && (
                conflictResult.hasConflict ? (
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-yellow-600" />
                    <div className="text-sm">
                      <p className="font-semibold">Conflito de horário detectado</p>
                      <p className="text-yellow-700 mt-0.5">
                        {conflictResult.conflictingReservation?.professorName} já tem reserva das {conflictResult.conflictingReservation?.startTime} às {conflictResult.conflictingReservation?.endTime}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    Horário disponível nesta sala.
                  </div>
                )
              )}

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disciplina</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Informática Básica" data-testid="input-subject" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="classGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turma</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 2º Ano A" data-testid="input-class" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ← TABLET: campo de quantidade de tablets */}
              <FormField
                control={form.control}
                name="tabletQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Tablet className="h-4 w-4" />
                      Tablets necessários
                      <span className="text-xs text-muted-foreground font-normal">(máximo 30)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={30}
                        placeholder="0"
                        {...field}
                        onChange={e => field.onChange(Math.min(30, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-32"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* ← FIM TABLET */}

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || user?.blocked || conflictResult?.hasConflict}
                  data-testid="button-submit-reserva"
                >
                  {createMutation.isPending ? "Agendando..." : "Confirmar Reserva"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setLocation("/reservas")}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
