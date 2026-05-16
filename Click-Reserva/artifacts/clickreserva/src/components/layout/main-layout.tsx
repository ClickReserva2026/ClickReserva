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
  X, 
  ChevronDown 
} from "lucide-react";
import { Logo } from "../logo"; // Importa o componente da logo que aponta para o clickreserva_final2.svg

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Itens do Menu Lateral obtidos diretamente da sua interface
  const navigation = [
    { name: "Início", href: "#", icon: Home, active: true },
    { name: "Todas as Reservas", href: "#", icon: Calendar, active: false },
    { name: "Nova Reserva", href: "#", icon: PlusCircle, active: false },
    { name: "Salas de Informática e Laboratórios", href: "#", icon: MessageSquare, active: false },
    { name: "Confirmar Presença", href: "#", icon: CheckSquare, active: false },
    { name: "Relatório Mensal", href: "#", icon: BarChart3, active: false },
    { name: "Feedback", href: "#", icon: MessageSquare, active: false },
  ];

  const adminNavigation = [
    { name: "Gerenciar Reservas", href: "#", icon: Settings },
    { name: "Justificativa de Faltas", href: "#", icon: FileText },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#f4f7f5] overflow-hidden font-sans antialiased text-slate-800">
      
      {/* =========================================================
          1. BARRA LATERAL (DESKTOP)
         ========================================================= */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col hidden md:flex shrink-0 shadow-sm">
        
        {/* CONTAINER DA LOGO: Ajustado com tons verdes e a frase logo abaixo */}
        <div className="flex flex-col items-center justify-center px-4 py-5 bg-emerald-800/10 border-b border-slate-200 w-full gap-2">
          <div className="flex items-center justify-center w-full">
            <Logo className="h-10 w-auto" />
          </div>
          <span className="text-[9px] font-bold text-emerald-800/90 tracking-wider text-center uppercase block w-full px-1 whitespace-normal leading-tight">
            Tecnologia que organiza, escola que avança
          </span>
        </div>

        {/* LINKS DE NAVEGAÇÃO */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-7">
          {/* Menu Principal */}
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    item.active
                      ? "bg-emerald-800/10 text-emerald-900"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${item.active ? "text-emerald-800" : "text-slate-400"}`} />
                  <span className="leading-tight">{item.name}</span>
                </a>
              );
            })}
          </nav>

          {/* Menu de Administração */}
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
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <Icon className="h-5 w-5 text-slate-400 shrink-0" />
                    <span>{item.name}</span>
                  </a>
                );
              })}
            </nav>
          </div>
        </div>

        {/* RODAPÉ DO USUÁRIO (Simone Vitoriano de Barros) */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-emerald-800/10 flex items-center justify-center font-bold text-emerald-800 shrink-0">
              S
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 truncate leading-none">
                Simone Vitoriano de Barros
              </p>
              <p className="text-xs text-slate-500 mt-1">Administrador</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors w-full mt-2">
            <LogOut className="h-4 w-4" />
            <span>Sair do sistema</span>
          </button>
        </div>
      </aside>

      {/* =========================================================
          2. MENU LATERAL RESPONSIVO (MOBILE / CELULAR)
         ========================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Background escurecido ao fundo */}
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          
          <div className="relative w-full max-w-xs bg-white flex flex-col h-full shadow-xl animate-in slide-in-from-left duration-200">
            {/* Botão de Fechar */}
            <div className="absolute top-4 right-4 z-10">
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Logo Mobile */}
            <div className="flex flex-col items-center justify-center px-4 py-6 bg-emerald-800/10 border-b border-slate-200 gap-2">
              <Logo className="h-9 w-auto" />
              <span className="text-[9px] font-bold text-emerald-800/90 tracking-wider text-center uppercase block w-full px-2">
                Tecnologia que organiza, escola que avança
              </span>
            </div>

            {/* Links Mobile */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                        item.active ? "bg-emerald-800/10 text-emerald-900" : "text-slate-600"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${item.active ? "text-emerald-800" : "text-slate-400"}`} />
                      <span>{item.name}</span>
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
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600"
                      >
                        <Icon className="h-5 w-5 text-slate-400" />
                        <span>{item.name}</span>
                      </a>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Rodapé Mobile */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-800/10 flex items-center justify-center font-bold text-emerald-800">
                S
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">Simone Vitoriano</p>
                <p className="text-xs text-slate-500">Administrador</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          3. ÁREA DE CONTEÚDO PRINCIPAL (DASHBOARD)
         ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* CABEÇALHO SUPERIOR (Fica visível no mobile e telas menores) */}
        <header className="h-16 border-b border-slate-200 bg
