import React, { useState } from "react";
import { 
  Home, 
  Calendar, 
  PlusCircle, 
  CheckSquare, 
  BarChart3, 
  MessageSquare, 
  Settings, 
  FileText, 
  LogOut, 
  Menu, 
  X
} from "lucide-react";

// ── Logo inline padrão ClickReserva ─────────────────────────────
function BrandLogo({ compact = false }: { compact?: boolean }) {
  const iconSize = compact ? 36 : 48;
  const fontSize = compact ? 18 : 24;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 10 : 12 }}>
      <div style={{ position: "relative", width: iconSize, height: iconSize, flexShrink: 0 }}>
        <div style={{
          width: iconSize, height: iconSize,
          background: "rgba(255,255,255,0.18)",
          borderRadius: iconSize * 0.27,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid rgba(255,255,255,0.25)",
        }}>
          <svg width={iconSize * 0.7} height={iconSize * 0.7} viewBox="0 0 48 48" fill="none">
            <rect x="4" y="10" width="40" height="34" rx="6" fill="none" stroke="white" strokeWidth="2"/>
            <rect x="4" y="10" width="40" height="13" rx="6" fill="rgba(255,255,255,0.28)"/>
            <line x1="4" y1="23" x2="44" y2="23" stroke="white" strokeWidth="1.2" strokeOpacity="0.3"/>
            <rect x="14" y="4" width="4" height="11" rx="2" fill="white" fillOpacity="0.85"/>
            <rect x="30" y="4" width="4" height="11" rx="2" fill="white" fillOpacity="0.85"/>
            <rect x="7"  y="27" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.4"/>
            <rect x="16" y="27" width="6" height="5" rx="1.5" fill="white"/>
            <rect x="25" y="27" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.4"/>
            <rect x="34" y="27" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.4"/>
            <rect x="7"  y="35" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.4"/>
            <rect x="16" y="35" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.4"/>
            <rect x="25" y="35" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.4"/>
            <rect x="34" y="35" width="6" height="5" rx="1.5" fill="white" fillOpacity="0.4"/>
          </svg>
        </div>
        <svg style={{ position: "absolute", bottom: -6, right: -8 }}
          width={iconSize * 0.32} height={iconSize * 0.38} viewBox="0 0 24 28" fill="none">
          <path d="M2 2L2 22L8 16L11 24L14 23L11 15L19 15L2 2Z"
            fill="white" stroke="#064e3b" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize, fontWeight: 900, color: "#fff", lineHeight: 1, display: "block" }}>Click</span>
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize, fontWeight: 900, color: "#6ee7b7", lineHeight: 1, display: "block" }}>Reserva</span>
      </div>
    </div>
  );
}

interface MainLayoutProps {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
}

export function MainLayout({ children, userName = "Usuário", userRole = "Professor", onLogout }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Início", href: "#", icon: Home, active: true },
    { name: "Todas as Reservas", href: "#", icon: Calendar, active: false },
    { name: "Nova Reserva", href: "#", icon: PlusCircle, active: false },
    { name: "Salas de Informática e Laboratórios", href: "#", icon: MessageSquare, active: false },
    { name: "Confirmar Presença", href: "#", icon: CheckSquare, active: false },
    { name: "Relatório Mensal", href: "#", icon: BarChart3, active: false },
  ];

  const adminNavigation = [
    { name: "Gerenciar Reservas", href: "#", icon: Settings },
    { name: "Justificativa de Faltas", href: "#", icon: FileText },
    { name: "Gerenciar Professores", href: "#", icon: MessageSquare },
    { name: "Gerenciar Salas", href: "#", icon: Home },
    { name: "Configurações", href: "#", icon: Settings },
    { name: "Feedback dos Professores", href: "#", icon: MessageSquare },
  ];

  const sidebarHeader = (
    <div style={{
      background: "linear-gradient(135deg, #064e3b 0%, #059669 100%)",
      padding: "20px 16px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      borderBottom: "1px solid rgba(255,255,255,0.1)",
    }}>
      <BrandLogo />
      <span style={{
        fontSize: 8,
        color: "rgba(255,255,255,0.45)",
        letterSpacing: "1.1px",
        textTransform: "uppercase" as const,
        textAlign: "center",
        lineHeight: 1.5,
        marginTop: 4,
      }}>
        Tecnologia que organiza,<br/>escola que avança
      </span>
    </div>
  );

  const navItems = (onClose?: () => void) => (
    <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
      <nav className="space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                item.active ? "text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
              style={item.active ? { background: "linear-gradient(90deg, #064e3b, #059669)" } : {}}
            >
              <Icon className={`h-5 w-5 shrink-0 ${item.active ? "text-white" : "text-slate-400"}`}/>
              <span className="truncate">{item.name}</span>
            </a>
          );
        })}
      </nav>

      <div>
        <span className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Administração
        </span>
        <nav className="space-y-1">
          {adminNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Icon className="h-5 w-5 text-slate-400 shrink-0"/>
                <span>{item.name}</span>
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );

  const userFooter = (
    <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div
          className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-white shrink-0"
          style={{ background: "linear-gradient(135deg, #064e3b, #059669)" }}
        >
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 truncate leading-none">{userName}</p>
          <p className="text-xs text-slate-500 mt-1">{userRole}</p>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors w-full"
      >
        <LogOut className="h-4 w-4"/>
        <span>Sair do sistema</span>
      </button>
    </div>
  );

  return (
    <div className="flex h-screen w-screen bg-[#f4f7f5] overflow-hidden font-sans antialiased text-slate-800">

      {/* ── Desktop Sidebar ── */}
      <aside className="w-64 border-r border-slate-200 bg-white flex-col hidden md:flex shrink-0 shadow-sm">
        {sidebarHeader}
        {navItems()}
        {userFooter}
      </aside>

      {/* ── Mobile Sidebar ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-full max-w-xs bg-white flex flex-col h-full shadow-xl">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 text-white hover:bg-white/20 rounded-full"
            >
              <X className="h-5 w-5"/>
            </button>
            {sidebarHeader}
            {navItems(() => setMobileMenuOpen(false))}
            {userFooter}
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile header */}
        <header
          className="h-16 border-b flex items-center justify-between px-4 shrink-0 md:hidden shadow-sm"
          style={{ background: "linear-gradient(135deg, #064e3b 0%, #059669 100%)" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-white hover:bg-white/20 rounded-md"
            >
              <Menu className="h-6 w-6"/>
            </button>
            <BrandLogo compact />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
