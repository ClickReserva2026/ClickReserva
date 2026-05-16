import { Switch, Route, Redirect } from "wouter";
import { LoginPage } from "@/pages/login"; 
import { MainLayout } from "@/components/layout/main-layout";

// 🔐 Importações nativas de segurança e banco de dados
import { AuthProvider } from "@/contexts/auth-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Criamos o cliente de consultas aqui mesmo, eliminando o erro de arquivo não encontrado!
const queryClientDoSistema = new QueryClient();

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
    // 1️⃣ Ativa o motor do banco de dados de forma independente
    <QueryClientProvider client={queryClientDoSistema}>
      {/* 2️⃣ Ativa o controle de login do sistema */}
      <AuthProvider>
        <Switch>
          {/* Rota da tela inicial verde unificada */}
          <Route path="/login" component={LoginPage} />

          {/* Área interna protegida (Menu lateral e topo verde) */}
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
