import { Switch, Route, Redirect } from "wouter";
import { LoginPage } from "@/pages/login"; 
import { MainLayout } from "@/components/layout/main-layout";

// 🔐 Importa o provedor de autenticação dos alunos que estava faltando
import { AuthProvider } from "@/contexts/auth-context";

// Importa o arquivo do dashboard como um objeto genérico para blindar o build do Vite
import * as DashboardModulo from "@/pages/dashboard";

// Identifica a função correta exportada pelos alunos dentro de dashboard.tsx
const ComponenteDashboard = 
  DashboardModulo.default || 
  (DashboardModulo as any).Dashboard || 
  (DashboardModulo as any).DashboardPage ||
  (DashboardModulo as any).AdminDashboard ||
  (() => <div className="p-6 text-center font-bold text-slate-700">Painel do ClickReserva Carregado!</div>);

export default function App() {
  return (
    // 💡 O AuthProvider precisa envelopar tudo para o useAuth funcionar e não dar tela branca!
    <AuthProvider>
      <Switch>
        {/* 1. Tela Inicial Verde Unificada (Imagem 1) */}
        <Route path="/login" component={LoginPage} />

        {/* 2. Área interna logada (MainLayout + Dashboard nativo) */}
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
    </AuthProvider>
  );
}
