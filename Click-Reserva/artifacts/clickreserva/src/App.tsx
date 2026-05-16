import { Switch, Route, Redirect } from "wouter";
import { LoginPage } from "@/pages/login"; 

export default function App() {
  return (
    <Switch>
      {/* 1. Rota Principal: Abre direto a tela verde com os dois botões da foto */}
      <Route path="/login" component={LoginPage} />

      {/* 2. Rota Raiz: Redireciona automaticamente para a tela verde de login */}
      <Route path="/">
        <Redirect to="/login" />
      </Route>
      
      {/* 3. Qualquer outro link aleatório ou antigo volta para a segurança do início */}
      <Route>
        <Redirect to="/login" />
      </Route>
    </Switch>
  );
}
