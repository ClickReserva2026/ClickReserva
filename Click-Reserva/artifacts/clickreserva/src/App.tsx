import { Switch, Route, Redirect } from "wouter";
import { LoginPage } from "@/pages/login"; 

export default function App() {
  return (
    <Switch>
      {/* Deixa apenas a rota que carregou com sucesso e abriu a tela verde */}
      <Route path="/login" component={LoginPage} />
      
      <Route path="/">
        <Redirect to="/login" />
      </Route>

      <Route>
        <Redirect to="/login" />
      </Route>
    </Switch>
  );
}
