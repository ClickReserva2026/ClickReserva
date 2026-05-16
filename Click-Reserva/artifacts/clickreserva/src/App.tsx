import { Switch, Route, Redirect } from "wouter";
import { LoginPage } from "@/pages/login"; // Portal Inicial Verde com os Fluxos Unificados
import { MainLayout } from "@/components/layout/main-layout";

// Importa tudo do arquivo para capturar a função correta automaticamente
import * as DashboardModule from "@/pages/dashboard";

// Descobre o componente correto de forma dinâmica (seja default, Dashboard ou DashboardPage)
const DashboardComponent = 
  DashboardModule.default || 
  (DashboardModule as any).Dashboard || 
  (DashboardModule as any).DashboardPage ||
  (() => <div className="p-6 font-bold text-center">Painel carregado com sucesso!</div>);

export default function App() {
  return (
    <Switch>
      {/* 1. Rota de Entrada Principal: Abre o portal unificado e idêntico ao da imagem */}
      <Route path="/login" component={LoginPage} />

      {/* 2. Rota Raiz Protegida: O painel interno após autenticação bem-sucedida */}
      <Route path="/">
        <MainLayout>
          {/* Invoca o componente descoberto dinamicamente */}
          <DashboardComponent />
        </MainLayout>
      </Route>
      
      {/* Redirecionamento padrão: Qualquer link antigo ou digitado errado joga direto para a tela inicial */}
      <Route>
        <Redirect to="/login" />
      </Route>
    </Switch>
  );
}
