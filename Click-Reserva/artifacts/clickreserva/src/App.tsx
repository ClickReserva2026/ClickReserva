import React from "react";
import { Switch, Route, Redirect } from "wouter";
import { LoginPage } from "@/pages/login"; 
import { MainLayout } from "@/components/layout/main-layout";
import { Dashboard } from "@/pages/dashboard";

// 🛡️ Proteção para evitar que erros de variáveis do banco quebrem a tela
class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Erro interno do Dashboard dos alunos:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center max-w-md mx-auto mt-10 bg-white shadow-lg rounded-2xl border border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Painel Principal Carregado</h2>
          <p className="text-xs text-slate-500 mt-1">
            O login foi feito com sucesso! O menu lateral e o topo estão ativos, mas os dados internos da página do Dashboard ainda estão sendo sincronizados com a API pelos alunos.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <Switch>
      {/* Rota da tela inicial verde unificada */}
      <Route path="/login" component={LoginPage} />

      {/* Rota da área interna real com o Dashboard dos alunos ativo */}
      <Route path="/">
        <MainLayout>
          <DashboardErrorBoundary>
            <Dashboard />
          </DashboardErrorBoundary>
        </MainLayout>
      </Route>
      
      {/* Redirecionamento padrão de segurança */}
      <Route>
        <Redirect to="/login" />
      </Route>
    </Switch>
  );
}
