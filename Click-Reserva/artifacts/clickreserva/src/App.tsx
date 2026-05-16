import { Switch, Route, Redirect } from "wouter";
import { LoginPage } from "@/pages/login"; // Portal Inicial Verde com os Fluxos Unificados
import { RegisterPage } from "@/pages/register"; // Tela de cadastro de professores
import { MainLayout } from "@/components/layout/main-layout";
import { Dashboard } from "@/pages/dashboard";

export default function App() {
  return (
    <Switch>
      {/* 1. Rota de Entrada Principal: Abre o portal unificado da imagem */}
      <Route path="/login" component={LoginPage} />
      
      {/* 2. Rota de Cadastro de novos professores */}
      <Route path="/register" component={RegisterPage} />

      {/* 3. Rota Raiz Protegida: O painel interno após autenticação bem-sucedida */}
      <Route path="/">
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </Route>
      
      {/* Redirecionamento padrão: Qualquer link quebrado joga para a tela inicial */}
      <Route>
        <Redirect to="/login" />
      </Route>
    </Switch>
  );
}
