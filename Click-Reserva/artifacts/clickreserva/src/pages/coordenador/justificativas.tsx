import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2, FileText, Search, User, Calendar, Clock } from "lucide-react";

const BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

type NoShowReservation = {
  id: number;
  professorId: number;
  professorName: string;
  roomName: string;
  roomNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  classGroup: string;
  status: "no_show" | "justified";
  justificationNote: string | null;
  justifiedAt: string | null;
  justifiedByUserId: number | null;
  createdAt: string;
};

async function fetchNoShows(): Promise<NoShowReservation[]> {
  const res = await fetch(`${BASE}/api/no-shows`, { credentials: "include" });
  if (!res.ok) throw new Error("Erro ao carregar faltas");
  return res.json();
}

async function justifyReservation(id: number, note: string): Promise<void> {
  const res = await fetch(`${BASE}/api/reservations/${id}/justify`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Erro ao justificar reserva");
  }
}

function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export function CoordinatorJustificativasPage() {
  const { user } = useAuth();
  const isCoordinator = user?.role === "coordinator" || user?.role === "admin";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "no_show" | "justified">("all");
  const [selected, setSelected] = useState<NoShowReservation | null>(null);
  const [note, setNote] = useState("");

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["no-shows"],
    queryFn: fetchNoShows,
    staleTime: 2 * 60 * 1000,
    enabled: isCoordinator,
  });

  const justifyMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => justifyReservation(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["no-shows"] });
      queryClient.invalidateQueries({ queryKey: ["relatorio-mensal"] });
      toast({ title: "Justificativa registrada com sucesso!", description: "A falta foi justificada e a ausência foi descontada." });
      setSelected(null);
      setNote("");
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao justificar", description: err.message, variant: "destructive" });
    },
  });

  if (!isCoordinator) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        Acesso restrito a coordenadores e administradores.
      </div>
    );
  }

  const filtered = data
    .filter(r => filter === "all" || r.status === filter)
    .filter(r =>
      !search ||
      r.professorName.toLowerCase().includes(search.toLowerCase()) ||
      r.subject.toLowerCase().includes(search.toLowerCase()) ||
      r.classGroup.toLowerCase().includes(search.toLowerCase())
    );

  const noShowCount = data.filter(r => r.status === "no_show").length;
  const justifiedCount = data.filter(r => r.status === "justified").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          Recuperação e Justificativa de Faltas
        </h1>
        <p className="text-muted-foreground mt-1">
          Registre justificativas para faltas dos professores. Somente como exceção, quando houver motivo comprovado.
        </p>
      </div>

      {/* Resumo rápido */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-red-700">{noShowCount}</p>
              <p className="text-sm text-red-600">Sem justificativa</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-green-700">{justifiedCount}</p>
              <p className="text-sm text-green-600">Justificadas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar professor, disciplina ou turma..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(["all", "no_show", "justified"] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Todas" : f === "no_show" ? "Sem justificativa" : "Justificadas"}
            </Button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          Carregando faltas...
        </div>
      )}

      {isError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6 text-center text-destructive">
            Erro ao carregar os dados. Tente novamente.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <Card>
          <CardContent className="pt-10 pb-10 text-center text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma falta encontrada com os filtros aplicados.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map(r => (
          <Card
            key={r.id}
            className={r.status === "justified"
              ? "border-green-200 bg-green-50/50"
              : "border-red-200 bg-red-50/30"}
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Status badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.status === "justified" ? (
                      <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Justificada
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 border-red-300 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Sem justificativa
                      </Badge>
                    )}
                  </div>

                  {/* Professor + Disciplina */}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-semibold text-sm">{r.professorName}</span>
                    <span className="text-muted-foreground text-sm">·</span>
                    <span className="text-sm text-muted-foreground">{r.subject}</span>
                    <span className="text-muted-foreground text-sm">·</span>
                    <span className="text-sm text-muted-foreground">Turma {r.classGroup}</span>
                  </div>

                  {/* Data + Horário + Sala */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(r.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {r.startTime} – {r.endTime}
                    </span>
                    <span>{r.roomName}</span>
                  </div>

                  {/* Justificativa existente */}
                  {r.justificationNote && (
                    <div className="mt-2 bg-green-100 border border-green-200 rounded-md px-3 py-2 text-sm text-green-800">
                      <span className="font-semibold">Justificativa: </span>{r.justificationNote}
                    </div>
                  )}
                </div>

                {/* Botão ação */}
                <div className="flex-shrink-0">
                  {r.status === "no_show" ? (
                    <Button
                      size="sm"
                      onClick={() => { setSelected(r); setNote(""); }}
                    >
                      <FileText className="h-4 w-4 mr-1.5" />
                      Justificar falta
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setSelected(r); setNote(r.justificationNote ?? ""); }}
                    >
                      <FileText className="h-4 w-4 mr-1.5" />
                      Editar justificativa
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de justificativa */}
      <Dialog open={!!selected} onOpenChange={open => { if (!open) { setSelected(null); setNote(""); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selected?.status === "justified" ? "Editar justificativa" : "Registrar justificativa de falta"}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">Professor:</span> <strong>{selected.professorName}</strong></p>
                <p><span className="text-muted-foreground">Disciplina:</span> {selected.subject} · Turma {selected.classGroup}</p>
                <p><span className="text-muted-foreground">Data:</span> {formatDate(selected.date)} · {selected.startTime} – {selected.endTime}</p>
                <p><span className="text-muted-foreground">Sala:</span> {selected.roomName}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">
                  Motivo da justificativa <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="note"
                  placeholder="Ex: Professor não pôde comparecer devido a atestado médico apresentado à coordenação em 07/04/2026."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Esta justificativa ficará registrada no sistema e a falta será descontada do histórico do professor.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelected(null); setNote(""); }}>
              Cancelar
            </Button>
            <Button
              onClick={() => selected && justifyMutation.mutate({ id: selected.id, note })}
              disabled={!note.trim() || justifyMutation.isPending}
            >
              {justifyMutation.isPending ? "Salvando..." : "Salvar justificativa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
