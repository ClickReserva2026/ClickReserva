import { Switch, Route, Redirect } from "wouter";
import { LoginPage } from "@/pages/login"; 
import { MainLayout } from "@/components/layout/main-layout";

// 🔐 Importações de segurança e banco de dados
import { AuthProvider } from "@/contexts/auth-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
    <QueryClientProvider client={queryClientDoSistema}>
      <AuthProvider>
        <Switch>
          {/* 1. Rota da tela inicial verde unificada */}
          <Route path="/login" component={LoginPage} />

          {/* 2. Rota Raiz (/) - Se o sistema apontar para cá, renderiza o painel */}
          <Route path="/">
            <MainLayout>
              <ComponenteDashboard />
            </MainLayout>
          </Route>

          {/* 3. Rota Alternativa (/dashboard) - Prevenção caso os alunos tenham configurado essa rota interna */}
          <Route path="/dashboard">
            <MainLayout>
              <ComponenteDashboard />
            </MainLayout>
          </Route>

          {/* 4. Rota Alternativa (/home) - Outro padrão muito usado por estudantes */}
          <Route path="/home">
            <MainLayout>
              <ComponenteDashboard />
            </MainLayout>
          </Route>
          
          {/* Se cair em qualquer outro lugar desconhecido, manda de volta para o Login */}
          <Route>
            <Redirect to="/login" />
          </Route>
        </Switch>
      </AuthProvider>
    </QueryClientProvider>
  );
}
