import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { 
  Calendar, 
  Layers, 
  User, 
  LogOut, 
  Shield, 
  Menu, 
  X, 
  AlertTriangle 
} from "lucide-react";
import { Button } from "../ui/button";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isCoordinator = user?.role === "coordinator" || user?.role === "admin";

  const menuItems = [
    {
      title: "Minhas Reservas",
      icon: Calendar,
      path: "/reservas",
      show: true,
    },
    {
      title: "Salas Disponíveis",
      icon: Layers,
      path: "/salas",
      show: true,
    },
    {
      title: "Gerenciar Faltas",
      icon: AlertTriangle,
      path: "/no-shows",
      show: isCoordinator,
    },
    {
      title: "Painel Coordenador",
      icon: Shield,
      path: "/coordenador",
      show: isCoordinator,
    },
    {
      title: "Meu Perfil",
      icon: User,
      path: "/perfil",
      show: true,
    },
  ];

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate("/auth");
  };

  // Componente interno para renderizar os links do menu (evita repetição de código)
  const NavigationLinks = () => (
    <div className="space-y-1">
      {menuItems
        .filter((item) => item.show)
        .map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start gap-3 mb-1 ${
                  isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/80 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Button>
            </Link>
          );
        })}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background w-full overflow-x-hidden">
      
      {/* 1. BARRA LATERAL PADRÃO (Apenas para Computador/Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-border p-4 justify-between shrink-0">
        <div className="space-y-6">
          <div className="px-3 py-2">
            <h2 className="text-xl font-bold tracking-tight text-sidebar-foreground flex items-center gap-2">
              <span className="bg-primary text-primary-foreground p-1.5 rounded-md text-sm font-black">CR</span>
              Click-Reserva
            </h2>
            <p className="text-xs text-sidebar-foreground/60 mt-1">Olá, {user?.name}</p>
          </div>
          <NavigationLinks />
        </div>

        <div className="pt-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sair do Sistema
          </Button>
        </div>
      </aside>

      {/* 2. MENU RETRÁTIL FLUTUANTE (Apenas para Celular) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Fundo escurecido atrás do menu (clicar nele fecha o menu) */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          
          {/* Painel do menu que desliza da esquerda */}
          <aside className="relative flex flex-col w-72 max-w-[80vw] bg-sidebar border-r border-border p-5 justify-between h-full animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-sidebar-foreground">Click-Reserva</h2>
                  <p className="text-xs text-sidebar-foreground/60">Olá, {user?.name}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <NavigationLinks />
            </div>

            <div className="pt-4 border-t border-border">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                Sair do Sistema
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* 3. ÁREA DE CONTEÚDO DA TELA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Cabeçalho superior (Mobile Only) para dar suporte ao botão do Menu */}
        <header className="flex md:hidden items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-40">
          <h1 className="text-lg font-bold tracking-tight">Click-Reserva</h1>
          <Button variant="outline" size="icon" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
        </header>

        {/* Conteúdo da página injetado aqui */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
