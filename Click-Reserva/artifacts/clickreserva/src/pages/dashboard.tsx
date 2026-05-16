import { useAuth } from "@/contexts/auth-context";
import { useGetDashboardStats, useGetTodaySchedule } from "@workspace/api-client-react";
import { 
  Users, 
  MonitorPlay, 
  CalendarDays, 
  ShieldAlert,
  Clock,
  ArrowRight,
  Plus,
  CheckSquare
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ESCOLA } from "@/escola.config";

export function DashboardPage() {
  const { user } = useAuth();
  
  // Hooks com tratamento preventivo
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: todaySchedule, isLoading: scheduleLoading } = useGetTodaySchedule();

  const isCoordinator = user?.role === "coordinator" || user?.role === "admin";
  
  // Extração segura do primeiro nome
  const firstName = user?.name ? user.name.trim().split(/\s+/)[0] : "Usuário";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Versão Original e Limpa do Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Início
          </h1>
          <p className="text-muted-foreground mt-1">
            Olá, <span className="font-semibold text-emerald-600">{firstName}</span>! Aqui está o resumo das suas atividades no <span className="font-medium text-gray-700 dark:text-gray-300">{ESCOLA?.nome || "C.E. Prof. Mário B.T. Braga"}</span>.
          </p>
        </div>
        <div className="text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg self-start md:self-center capitalize border">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </div>
      </div>

      {/* Estatísticas blindadas contra valores nulos/undefined */}
      {isCoordinator && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Reservas Hoje
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.todayReservations ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.weekReservations ?? 0} nesta semana
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Salas Ativas
              </CardTitle>
              <MonitorPlay className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeRooms ?? 4}</div>
              <p className="text-xs text-muted-foreground">
                de {stats?.totalRooms ?? 4} cadastradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Professores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeProfessors ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                ativos no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-destructive">
                Bloqueados
              </CardTitle>
              <ShieldAlert className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats?.blockedProfessors ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                professores suspensos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Programação de Hoje</CardTitle>
                <CardDescription>
                  {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/reservas/nova">Nova Reserva</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {scheduleLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-muted rounded-md animate-pulse" />
                ))}
              </div>
            ) : !todaySchedule || todaySchedule.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center p-6 bg-muted/20 rounded-lg border border-dashed">
                <CalendarDays className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                <h3 className="font-medium">Nenhuma reserva para hoje</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  O laboratório está livre. Aproveite para agendar sua turma!
                </p>
                <Button variant="link" className="mt-2" asChild>
                  <Link href="/reservas/nova">Fazer agendamento</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {todaySchedule.map((res: any) => (
                  <div key={res.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary">
                        <Clock className="h-5 w-5 mb-0.5" />
                        <span className="text-[10px] font-bold leading-none">{res.startTime?.substring(0, 5)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{res.subject} - {res.classGroup}</p>
                        <div className="flex items-center text-sm text-muted-foreground gap-2">
                          <MonitorPlay className="h-3 w-3" />
                          <span>{res.roomName}</span>
                          <span className="text-muted-foreground/50">•</span>
                          <Users className="h-3 w-3" />
                          <span>{res.professorName}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {res.status === 'confirmed' ? (
                        <Badge className="bg-blue-500 hover:bg-blue-600">Confirmada</Badge>
                      ) : res.status === 'realized' ? (
                        <Badge className="bg-green-500 hover:bg-green-600">Realizada</Badge>
                      ) : res.status === 'pending' ? (
                        <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendente</Badge>
                      ) : (
                        <Badge variant="outline">{res.status}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesso direto às ferramentas
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link href="/reservas/nova" className="flex items-center p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 group-hover:bg-primary group-hover:text-white transition-colors">
                <Plus className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Agendar Sala</h4>
                <p className="text-sm text-muted-foreground">Nova reserva de laboratório</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
            </Link>

            <Link href="/presenca" className="flex items-center p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group">
              <div className="h-10 w-10 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center mr-4 group-hover:bg-green-500 group-hover:text-white transition-colors">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Confirmar Presença</h4>
                <p className="text-sm text-muted-foreground">Validar uso da sala hoje</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-green-600 transition-colors opacity-0 group-hover:opacity-100" />
            </Link>

            <Link href="/reservas" className="flex items-center p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center mr-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Minhas Reservas</h4>
                <p className="text-sm text-muted-foreground">Ver histórico e agendamentos</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100" />
            </Link>
            
            {user?.blocked && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3 mt-4">
                <ShieldAlert className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <h4 className="font-medium text-destructive">Conta Bloqueada</h4>
                  <p className="text-sm text-destructive/80 mt-1">
                    Você atingiu o limite de faltas sem justificativa. Procure a coordenação.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
