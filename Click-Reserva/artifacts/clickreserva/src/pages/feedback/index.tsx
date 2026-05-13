import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, Trash2, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? `Erro ${res.status}`);
  }
  return res.json();
}

const CATEGORIES: Record<string, string> = {
  sistema: "Sistema",
  sala: "Salas / Equipamentos",
  processo: "Processo de Reserva",
  outro: "Outro",
};

const CATEGORY_COLORS: Record<string, string> = {
  sistema: "bg-blue-100 text-blue-700 border-blue-200",
  sala: "bg-orange-100 text-orange-700 border-orange-200",
  processo: "bg-purple-100 text-purple-700 border-purple-200",
  outro: "bg-gray-100 text-gray-600 border-gray-200",
};

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default"}
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function avgRating(feedbacks: any[]): string {
  if (!feedbacks.length) return "—";
  const avg = feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length;
  return avg.toFixed(1);
}

export function FeedbackPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isCoordinator = user?.role === "coordinator" || user?.role === "admin";

  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");

  const { data: feedbacks = [], isLoading } = useQuery<any[]>({
    queryKey: ["feedback"],
    queryFn: () => apiFetch("/api/feedback"),
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) =>
      apiFetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: "Feedback enviado! Obrigado pela sua opinião." });
      setRating(0);
      setCategory("");
      setMessage("");
      setIsAnonymous(false);
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
    onError: (e: any) => {
      toast({ title: e?.message ?? "Erro ao enviar feedback.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/feedback/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "Feedback removido." });
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) { toast({ title: "Selecione uma avaliação (1–5 estrelas).", variant: "destructive" }); return; }
    if (!category) { toast({ title: "Selecione uma categoria.", variant: "destructive" }); return; }
    if (message.trim().length < 5) { toast({ title: "Mensagem muito curta (mínimo 5 caracteres).", variant: "destructive" }); return; }
    submitMutation.mutate({ rating, category, message: message.trim(), isAnonymous });
  }

  const filtered = feedbacks.filter(f => filterCategory === "all" || f.category === filterCategory);

  if (isCoordinator) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedback dos Professores</h1>
          <p className="text-muted-foreground mt-1">Veja as opiniões e sugestões enviadas pelos professores.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{feedbacks.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Total de feedbacks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-yellow-500">{avgRating(feedbacks)}</p>
              <p className="text-xs text-muted-foreground mt-1">Avaliação média</p>
            </CardContent>
          </Card>
          {Object.entries(CATEGORIES).slice(0, 2).map(([key, label]) => (
            <Card key={key}>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-primary">
                  {feedbacks.filter(f => f.category === key).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-24 bg-muted rounded-lg animate-pulse"/>)}</div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="p-10 text-center text-muted-foreground">Nenhum feedback encontrado.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(f => (
              <Card key={f.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <StarRating value={f.rating} />
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[f.category] ?? ""}`}>
                          {CATEGORIES[f.category] ?? f.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {f.isAnonymous ? "Anônimo" : f.professorName} ·{" "}
                          {format(new Date(f.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{f.message}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={() => { if (confirm("Remover este feedback?")) deleteMutation.mutate(f.id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
        <p className="text-muted-foreground mt-1">Compartilhe sua opinião sobre o sistema ou as salas.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            Enviar feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="text-sm mb-2 block">Avaliação geral *</Label>
              <StarRating value={rating} onChange={setRating} />
              {rating > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {["","Muito ruim","Ruim","Regular","Bom","Excelente"][rating]}
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Categoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Sobre o que é este feedback?" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Mensagem *</Label>
              <Textarea
                placeholder="Descreva sua experiência, sugestão ou problema..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{message.length}/1000</p>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                Enviar anonimamente <span className="text-muted-foreground">(seu nome não aparecerá)</span>
              </Label>
            </div>
            <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? "Enviando..." : "Enviar feedback"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {feedbacks.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Meus feedbacks anteriores
          </h2>
          <div className="space-y-3">
            {feedbacks.map(f => (
              <Card key={f.id} className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <StarRating value={f.rating} />
                    <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[f.category] ?? ""}`}>
                      {CATEGORIES[f.category] ?? f.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(f.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      {f.isAnonymous && " · Anônimo"}
                    </span>
                  </div>
                  <p className="text-sm">{f.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
