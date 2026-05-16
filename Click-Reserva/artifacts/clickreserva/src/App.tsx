import { Switch, Route, Redirect } from "wouter";
import { LoginPage } from "@/pages/login"; 
import { MainLayout } from "@/components/layout/main-layout";
import { Dashboard } from "@/pages/dashboard";

export default function App() {
  return (
    <Switch>
      {/* Rota de Login clássica que aponta para o arquivo original */}
      <Route path="/login" component={LoginPage} />

      {/* Rota interna padrão do sistema */}
      <Route path="/">
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </Route>
      
      {/* Redirecionamento de segurança */}
      <Route>
        <Redirect to="/login" />
      </Route>
    </Switch>
  );
}
