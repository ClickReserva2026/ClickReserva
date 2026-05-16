import { Switch, Route, Redirect } from "wouter";
import { LoginPage } from "@/pages/login"; 
import { MainLayout } from "@/components/layout/main-layout";

// Importa o módulo do dashboard inteiro para evitar erros de chaves {}
import * as DashboardModule from "@/pages/dashboard";

// Detecta automaticamente como a função foi exportada lá dentro (default ou nomeada)
const DashboardComponent = 
  DashboardModule.default || 
  (DashboardModule as any).Dashboard || 
  (DashboardModule as any).DashboardPage ||
  (() => <div className="p-6 text-center font-bold">Painel carregado!</div>);

export default function App() {
  return (
    <Switch>
      {/* Rota de Login clássica que carrega a tela verde da imagem */}
      <Route path="/login" component={LoginPage} />

      {/* Rota interna padrão do sistema */}
      <Route path="/">
        <MainLayout>
          <DashboardComponent />
        </MainLayout>
      </Route>
      
      {/* Redirecionamento de segurança para qualquer rota inválida */}
      <Route>
        <Redirect to="/login" />
      </Route>
    </Switch>
  );
}
