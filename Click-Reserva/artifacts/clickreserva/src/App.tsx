import React, { Component, ErrorInfo, ReactNode } from "wouter";
import { Switch, Route, Redirect } from "wouter";
import { LoginPage } from "@/pages/login"; 
import { MainLayout } from "@/components/layout/main-layout";

// Importa o dashboard de forma flexível
import * as DashboardModule from "@/pages/dashboard";

const RawDashboard = 
  DashboardModule.default || 
  (DashboardModule as any).Dashboard || 
  (DashboardModule as any).DashboardPage;

// 🛡️ Classe de segurança para evitar que erros internos quebrem o React
class DashboardErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Erro capturado no painel interno:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center max-w-xl mx-auto mt-10 bg-white shadow-md rounded-2xl border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Painel em Ajustes</h2>
          <p className="text-sm text-slate-600 mt-2">
            O login foi efetuado, mas os componentes internos da página principal ainda estão sendo ajustados pelos alunos no banco de dados.
          </p>
          <div className="mt-4 text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg inline-block font-mono">
            Verifique o console do navegador para detalhes das variáveis.
          </div>
        </div>
      );
    }
    return this.children;
  }
}

export default function App() {
  return (
    <Switch>
      {/* 1. Tela Inicial Verde Unificada */}
      <Route path="/login" component={LoginPage} />

      {/* 2. Área logada protegida com a nossa barreira de segurança */}
      <Route path="/">
        <MainLayout>
          {RawDashboard ? (
            <DashboardErrorBoundary>
              {React.createElement(RawDashboard)}
            </DashboardErrorBoundary>
          ) : (
            <div className="p-6 text-center font-bold">Carregando painel principal...</div>
          )}
        </MainLayout>
      </Route>
      
      {/* Redirecionamento de segurança padrão */}
      <Route>
        <Redirect to="/login" />
      </Route>
    </Switch>
  );
}
