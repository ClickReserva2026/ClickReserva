import { Switch, Route, Redirect } from "wouter";
import { LoginPage } from "@/pages/login"; 
import { MainLayout } from "@/components/layout/main-layout";

// IMPORTANTE: Importamos o Dashboard sem as chaves {}, aceitando a exportação padrão dos alunos!
import Dashboard from "@/pages/dashboard";

export default function App() {
  return (
    <Switch>
      {/* Rota da tela inicial de login verde */}
      <Route path="/login" component={LoginPage} />

      {/* Rota principal da área interna com o Dashboard nativo deles */}
      <Route path="/">
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </Route>
      
      {/* Redirecionamento padrão de segurança */}
      <Route>
        <Redirect to="/login" />
      </Route>
    </Switch>
  );
}
