import { Switch, Route, Redirect } from "wouter";
import { LoginPage } from "@/pages/login";         {/* Tela verde com os dois botões da imagem */}
import { CredentialsPage } from "@/pages/credentials"; {/* Formulário com campos de E-mail e Senha */}
import { RegisterPage } from "@/pages/register";       {/* Tela de cadastro de professores */}
import { MainLayout } from "@/components/layout/main-layout";
import { Dashboard } from "@/pages/dashboard";

export default function App() {
  return (
    <Switch>
      {/* 1. Rota Inicial: Abre o portal verde com os botões "Login" e "Criar conta" */}
      <Route path="/login" component={LoginPage} />
      
      {/* 2. Rota do Formulário: Onde o usuário digita e-mail e senha após clicar em Login */}
      <Route path="/auth/login" component={CredentialsPage} />
      
      {/* 3. Rota de Cadastro de novos professores */}
      <Route path="/register" component={RegisterPage} />

      {/* 4. Rota Raiz Protegida: O painel interno do sistema após o login */}
      <Route path="/">
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </Route>
      
      {/* Redirecionamento de segurança: Qualquer rota desconhecida joga para a tela inicial verde */}
      <Route>
        <Redirect to="/login" />
      </Route>
    </Switch>
  );
}
