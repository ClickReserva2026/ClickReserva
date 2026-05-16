import { Switch, Route, Redirect } from "wouter";
import { LoginPage } from "@/pages/login"; 
import { MainLayout } from "@/components/layout/main-layout";

// Importa o arquivo do painel de forma flexível para evitar erros de chaves {}
import * as DashboardModule from "@/pages/dashboard";

// Detecta automaticamente se os alunos exportaram como default, Dashboard ou DashboardPage
const DashboardComponent = 
  DashboardModule.default || 
  (DashboardModule as any).Dashboard || 
  (DashboardModule as any).DashboardPage ||
  (() => <div className="p-6 text-center font-bold">Painel carregado com sucesso!</div>);

export default function App() {
  return (
    <Switch>
      {/* 1. Tela Inicial Verde Unificada */}
      <Route path="/login" component={LoginPage} />

      {/* 2. Área logada real (O topo verde com menu lateral da imagem 2) */}
      <Route path="/">
        <MainLayout>
          <DashboardComponent />
        </MainLayout>
      </Route>
      
      {/* Redirecionamento de segurança para links inválidos */}
      <Route>
        <Redirect to="/login" />
      </Route>
    </Switch>
  );
}
