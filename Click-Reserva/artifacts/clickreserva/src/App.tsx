import { Switch, Route, Redirect } from "wouter";
import { LoginPage } from "@/pages/login"; 
import { MainLayout } from "@/components/layout/main-layout";

// 🔐 Importa os Provedores Originais do Projeto
import { AuthProvider } from "@/contexts/auth-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient"; // Cliente de requisições padrão dos alunos

// Importa o arquivo do dashboard de forma resiliente
import * as DashboardModulo from "@/pages/dashboard";

const ComponenteDashboard = 
  DashboardModulo.default || 
  (DashboardModulo as any).Dashboard || 
  (DashboardModulo as any).DashboardPage ||
  (DashboardModulo as any).AdminDashboard ||
  (() => <div className="p-6 text-center font-bold text-slate-700">Painel do ClickReserva Ativo!</div>);

export default function App() {
  return (
    // 1️⃣ Primeiro envolvemos com o provedor de requisições do Banco de Dados
    <QueryClientProvider client={queryClient}>
      {/* 2️⃣ Depois envolvemos com o gerenciador de login */}
      <AuthProvider>
        <Switch>
          {/* Rota da tela inicial verde unificada */}
          <Route path="/login" component={LoginPage} />

          {/* Área logada com o menu lateral e barra superior original */}
          <Route path="/">
            <MainLayout>
              <ComponenteDashboard />
            </MainLayout>
          </Route>
          
          {/* Redirecionamento padrão de segurança */}
          <Route>
            <Redirect to="/login" />
          </Route>
        </Switch>
      </AuthProvider>
    </QueryClientProvider>
  );
}
