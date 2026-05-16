import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  CalendarDays, 
  Home, 
  LogOut, 
  MonitorPlay, 
  Plus, 
  ShieldAlert, 
  Users, 
  CheckSquare, 
  Settings, 
  User,
  Bell,
  X,
  ClipboardList,
  MessageSquare,
  BarChart3,
  FileText,
  Menu,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

function NotificationBanner() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) { setPermission("denied"); return; }
    setPermission(Notification.permission);
  }, []);

  if (dismissed || permission === "granted" || permission === "denied" || permission === null) return null;

  async function enable() {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") setDismissed(true);
  }

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 mb-5 flex items-center gap-3">
      <Bell className="h-4 w-4 text-primary flex-shrink-0" />
      <p className="text-sm text-foreground flex-1">
        <span className="font-semibold">Ative as notificações</span> para receber lembretes 10 minutos antes de cada reserva.
      </p>
      <button
        onClick={enable}
        className="text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors whitespace-nowrap"
      >
        Ativar
      </button>
      <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setUser(null);
        queryClient.removeQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/login");
      }
    });
  };

  const isCoordinator = user?.role === "coordinator" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  const professorNavItems = [
    { href: "/reservas", label: "Minhas Reservas", icon: CalendarDays },
    { href: "/reservas/nova", label: "Nova Reserva", icon: Plus },
    { href: "/salas", label: "Salas de Informática e Laboratórios", icon: MonitorPlay },
    { href: "/presenca", label: "Confirmar Presença", icon: CheckSquare },
    { href: "/relatorio", label: "Relatório Mensal", icon: BarChart3 },
    { href: "/feedback", label: "Feedback", icon: MessageSquare },
  ];

  const coordinatorNavItems = [
    { href: "/", label: "Início", icon: Home },
    { href: "/reservas", label: "Todas as Reservas", icon: CalendarDays },
    { href: "/reservas/nova", label: "Nova Reserva", icon: Plus },
    { href: "/salas", label: "Salas de Informática e Laboratórios", icon: MonitorPlay },
    { href: "/presenca", label: "Confirmar Presença", icon: CheckSquare },
    { href: "/relatorio", label: "Relatório Mensal", icon: BarChart3 },
  ];

  const adminExtraNavItems = [
    { href: "/feedback", label: "Feedback", icon: MessageSquare },
  ];

  const navItems = isAdmin
    ? [...coordinatorNavItems, ...adminExtraNavItems]
    : isCoordinator
    ? coordinatorNavItems
    : professorNavItems;

  const coordinatorItems = [
    { href: "/coordenador/reservas", label: "Gerenciar Reservas", icon: ClipboardList },
    { href: "/coordenador/justificativas", label: "Justificativa de Faltas", icon: FileText },
    { href: "/coordenador/professores", label: "Gerenciar Professores", icon: Users },
    { href: "/coordenador/bloqueios", label: "Bloqueios e Restrições", icon: ShieldAlert },
    { href: "/coordenador/salas", label: "Gerenciar Salas", icon: MonitorPlay },
    { href: "/coordenador/configuracoes", label: "Configurações", icon: Settings },
    { href: "/feedback", label: "Feedback dos Professores", icon: MessageSquare },
  ];

  const RenderMenuItems = () => (
    <nav className="grid gap-1 px-4">
      {navItems.map((item) => (
        <Link 
          key={item.href} 
          href={item.href}
          onClick={() => setMobileMenuOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted",
            location === item.href ? "bg-primary/10 text-primary hover:bg-primary/15" : "text-muted-foreground"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const RenderCoordinatorItems = () => (
    <div className="mt-8">
      <div className="px-6 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Administração
      </div>
      <nav className="grid gap-1 px-4">
        {coordinatorItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted",
              location === item.href ? "bg-primary/10 text-primary hover:bg-primary/15" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-emerald-50/60 overflow-hidden">
      
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="w-64 border-r bg-card flex flex-col hidden md:flex shrink-0">
        
        {/* CABEÇALHO DA SIDEBAR (PC) */}
        <div className="flex flex-col px-5 py-5 border-b bg-muted/10">
          <div className="mb-3">
            <Logo />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Usuário atual</span>
            <span className="text-sm font-bold text-foreground truncate">{user?.name}</span>
            <span className="text-xs text-primary font-medium mt-0.5 capitalize">
              {user?.role === "admin" ? "Administrador" : isCoordinator ? "Coordenador" : "Professor"}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <RenderMenuItems />
          {isCoordinator && <RenderCoordinatorItems />}
        </div>

        <div className="p-4 border-t mt-auto">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-destructive/10 hover:text-destructive text-muted-foreground w-full"
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4" />
            Sair do sistema
          </button>
        </div>
      </aside>

      {/* 2. MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          
          <aside className="relative w-64 max-w-[80vw] bg-card border-r flex flex-col h-full z-50 shadow-xl animate-in slide-in-from-left duration-200">
            
            {/* CABEÇALHO DO MENU LATERAL (Celular) */}
            <div className="flex flex-col px-4 py-4 border-b bg-muted/10">
              <div className="flex items-center justify-between mb-3">
                <Logo />
                <button onClick={() => setMobileMenuOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground truncate">{user?.name}</span>
                <span className="text-xs text-primary font-medium capitalize">
                  {user?.role === "admin" ? "Administrador" : isCoordinator ? "Coordenador" : "Professor"}
                </span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
              <RenderMenuItems />
              {isCoordinator && <RenderCoordinatorItems />}
            </div>

            <div className="p-4 border-t mt-auto bg-muted/20">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-destructive/10 hover:text-destructive text-muted-foreground w-full"
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4" />
                Sair do sistema
              </button>
            </div>
          </aside>
        </div>
      )}
      
      {/* 3. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* CABEÇALHO SUPERIOR FIXO (Celular) */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:hidden shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Logo />
          </div>
          
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
            {user?.name?.charAt(0) || <User className="h-4 w-4" />}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-5xl">
            <NotificationBanner />
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
