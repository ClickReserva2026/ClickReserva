import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, CalendarDays, CheckCircle2, XCircle, Clock, BookOpen, TrendingUp, Download } from "lucide-react";
import * as XLSX from "xlsx";

const BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

type ProfReport = {
  professorId: number;
  professorName: string;
  role: string;
  total: number;
  confirmadas: number;
  realizadas: number;
  canceladas: number;
  faltou: number;
  aguardando: number;
  recusadas: number;
};

async function fetchReport(month: string) {
  const res = await fetch(`${BASE}/api/reports/monthly?month=${month}`, { credentials: "include" });
  if (!res.ok) throw new Error("Erro ao carregar relatório");
  return res.json() as Promise<{ month: string; data: ProfReport[] }>;
}

function getMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
}

function rolePT(role: string) {
  if (role === "admin") return "Administrador";
  if (role === "coordinator") return "Coordenador";
  return "Professor";
}

function exportToExcel(data: ProfReport[], monthLabel: string, month: string) {
  const rows = data.map(p => ({
    "Professor(a)": p.professorName,
    "Função": rolePT(p.role),
    "Total de Reservas": p.total,
    "Realizadas": p.realizadas,
    "Confirmadas (aguardando aula)": p.confirmadas,
    "Aguardando Aprovação": p.aguardando,
    "Canceladas": p.canceladas,
    "Faltas (sem justificativa)": p.faltou,
    "Recusadas": p.recusadas,
  }));

  // Linha de totais
  rows.push({
    "Professor(a)": "TOTAL GERAL",
    "Função": "",
    "Total de Reservas": data.reduce((s, p) => s + p.total, 0),
    "Realizadas": data.reduce((s, p) => s + p.realizadas, 0),
    "Confirmadas (aguardando aula)": data.reduce((s, p) => s + p.confirmadas, 0),
    "Aguardando Aprovação": data.reduce((s, p) => s + p.aguardando, 0),
    "Canceladas": data.reduce((s, p) => s + p.canceladas, 0),
    "Faltas (sem justificativa)": data.reduce((s, p) => s + p.faltou, 0),
    "Recusadas": data.reduce((s, p) => s + p.recusadas, 0),
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  // Largura das colunas
  ws["!cols"] = [
    { wch: 40 }, // Professor
    { wch: 16 }, // Função
    { wch: 18 }, // Total
    { wch: 14 }, // Realizadas
    { wch: 28 }, // Confirmadas
    { wch: 22 }, // Aguardando
    { wch: 14 }, // Canceladas
    { wch: 26 }, // Faltas
    { wch: 14 }, // Recusadas
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Relatório ${monthLabel}`);

  XLSX.writeFile(wb, `Relatorio-Mensal-${month}.xlsx`);
}

function StatCard({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: any }) {
  return (
    <div className={`flex flex-col items-center justify-center p-4 rounded-xl border ${color}`}>
      <Icon className="h-5 w-5 mb-1 opacity-70" />
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs text-center mt-0.5 opacity-80">{label}</span>
    </div>
  );
}

export function RelatorioPage() {
  const { user } = useAuth();
  const isCoordinator = user?.role === "coordinator" || user?.role === "admin";

  const monthOptions = getMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["relatorio-mensal", selectedMonth],
    queryFn: () => fetchReport(selectedMonth),
    staleTime: 5 * 60 * 1000,
  });

  const monthLabel = monthOptions.find(m => m.value === selectedMonth)?.label ?? selectedMonth;

  const hasData = data && data.data.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Relatório Mensal
          </h1>
          <p className="text-muted-foreground mt-1">
            {isCoordinator
              ? "Resumo de aulas e reservas de todos os professores no mês selecionado."
              : "Resumo das suas aulas e reservas no mês selecionado."}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasData && (
            <Button
              variant="outline"
              onClick={() => exportToExcel(data.data, monthLabel, selectedMonth)}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar Excel
            </Button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          Carregando relatório...
        </div>
      )}

      {isError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6 text-center text-destructive">
            Erro ao carregar o relatório. Tente novamente.
          </CardContent>
        </Card>
      )}

      {data && data.data.length === 0 && (
        <Card>
          <CardContent className="pt-10 pb-10 text-center text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma reserva encontrada em {monthLabel}.</p>
          </CardContent>
        </Card>
      )}

      {hasData && (
        <>
          {/* Totalizador geral — só para coordenadores */}
          {isCoordinator && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Resumo Geral — {monthLabel}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  <StatCard label="Total" value={data.data.reduce((s, p) => s + p.total, 0)} color="bg-gray-50 border-gray-200 text-gray-700" icon={BookOpen} />
                  <StatCard label="Realizadas" value={data.data.reduce((s, p) => s + p.realizadas, 0)} color="bg-green-50 border-green-200 text-green-700" icon={CheckCircle2} />
                  <StatCard label="Confirmadas" value={data.data.reduce((s, p) => s + p.confirmadas, 0)} color="bg-blue-50 border-blue-200 text-blue-700" icon={CheckCircle2} />
                  <StatCard label="Aguardando" value={data.data.reduce((s, p) => s + p.aguardando, 0)} color="bg-yellow-50 border-yellow-200 text-yellow-700" icon={Clock} />
                  <StatCard label="Canceladas" value={data.data.reduce((s, p) => s + p.canceladas, 0)} color="bg-gray-50 border-gray-200 text-gray-500" icon={XCircle} />
                  <StatCard label="Faltas" value={data.data.reduce((s, p) => s + p.faltou, 0)} color="bg-red-50 border-red-200 text-red-700" icon={XCircle} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cards individuais por professor */}
          {data.data.map(prof => (
            <Card key={prof.professorId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-lg">{prof.professorName}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {rolePT(prof.role)}
                    </Badge>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
                      {prof.total} reserva{prof.total !== 1 ? "s" : ""} em {monthLabel}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  {prof.realizadas} aula{prof.realizadas !== 1 ? "s" : ""} realizada{prof.realizadas !== 1 ? "s" : ""} ·{" "}
                  {prof.faltou} falta{prof.faltou !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <StatCard label="Realizadas" value={prof.realizadas} color="bg-green-50 border-green-200 text-green-700" icon={CheckCircle2} />
                  <StatCard label="Confirmadas" value={prof.confirmadas} color="bg-blue-50 border-blue-200 text-blue-700" icon={CheckCircle2} />
                  <StatCard label="Aguardando" value={prof.aguardando} color="bg-yellow-50 border-yellow-200 text-yellow-700" icon={Clock} />
                  <StatCard label="Canceladas" value={prof.canceladas} color="bg-gray-50 border-gray-200 text-gray-500" icon={XCircle} />
                  <StatCard label="Faltas" value={prof.faltou} color="bg-red-50 border-red-200 text-red-700" icon={XCircle} />
                  <StatCard label="Recusadas" value={prof.recusadas} color="bg-orange-50 border-orange-200 text-orange-700" icon={XCircle} />
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
