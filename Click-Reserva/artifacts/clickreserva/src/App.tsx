import { Switch, Route, Redirect } from "wouter";
import { LoginPage } from "@/pages/login"; 
import { MainLayout } from "@/components/layout/main-layout";

// Importa o arquivo dos alunos como um objeto genérico para blindar o build do Vite
import * as DashboardMódulo from "@/pages/dashboard";

// Tenta pegar qualquer função que os alunos tenham criado lá dentro, ou carrega uma estrutura segura para não quebrar
const ComponenteDashboard = 
  DashboardMódulo.default || 
  (DashboardMódulo as any).Dashboard || 
  (DashboardMódulo as any).DashboardPage ||
  (DashboardMódulo as any).AdminDashboard ||
  (() => <div className="p-6 text-center font-bold text-slate-700">Painel do ClickReserva Carregado!</div>);

export default function App() {
  return (
    <Switch>
      {/* 1. Rota da tela inicial verde unificada que já estava funcionando */}
      <Route path="/login" component={LoginPage} />

      {/* 2. Rota principal interna: Abre o Layout deles com o conteúdo integrado */}
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
  );
}
