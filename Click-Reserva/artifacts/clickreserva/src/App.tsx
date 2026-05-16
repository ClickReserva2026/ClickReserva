import { Switch, Route, Redirect } from "wouter";
import { LoginPage } from "@/pages/login"; // Portal Inicial Verde com os Fluxos Unificados
import { MainLayout } from "@/components/layout/main-layout";

// Importa o Dashboard aceitando o formato padrão exportado pelo arquivo original
import DashboardPage from "@/pages/dashboard";

export default function App() {
  return (
    <Switch>
      {/* 1. Rota de Entrada Principal: Abre o portal unificado e idêntico ao da imagem */}
      <Route path="/login" component={LoginPage} />

      {/* 2. Rota Raiz Protegida: O painel interno após autenticação bem-sucedida */}
      <Route path="/">
        <MainLayout>
          {/* Invoca o componente importado de forma segura */}
          <DashboardPage />
        </MainLayout>
      </Route>
      
      {/* Redirecionamento padrão: Qualquer link antigo ou digitado errado joga direto para a tela inicial */}
      <Route>
        <Redirect to="/login" />
      </Route>
    </Switch>
  );
}
