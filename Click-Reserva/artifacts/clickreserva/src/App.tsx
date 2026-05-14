import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { ESCOLA } from "@/escola.config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { MainLayout } from "@/components/layout/main-layout";
import { ErrorBoundary } from "@/components/error-boundary";
import { RouteErrorBoundary } from "@/components/route-error-boundary";
import { useReservationReminder } from "@/hooks/use-reservation-reminder";
import { LoginPage } from "@/pages/login";
import { DashboardPage } from "@/pages/dashboard";
import { ReservationsPage } from "@/pages/reservas/index";
import { NewReservationPage } from "@/pages/reservas/nova";
import { RoomsPage } from "@/pages/salas/index";
import { PresencePage } from "@/pages/presenca/index";
import { CoordinatorProfessorsPage } from "@/pages/coordenador/professores";
import { CoordinatorBlockedPage } from "@/pages/coordenador/bloqueios";
import { CoordinatorRoomsPage } from "@/pages/coordenador/salas";
import { CoordinatorConfigPage } from "@/pages/coordenador/configuracoes";
import { CoordinatorReservasPage } from "@/pages/coordenador/reservas";
import { CoordinatorJustificativasPage } from "@/pages/coordenador/justificativas";
import { FeedbackPage } from "@/pages/feedback/index";
import { RelatorioPage } from "@/pages/relatorio/index";
import NotFound from "@/pages/not-found";

// ─── IMPORTAÇÃO DO CONFIGURADOR DA API (CAMINHO RELATIVO AJUSTADO) ──────────
import { setBaseUrl } from "../../../lib/api-client-react/src/custom-fetch";

// Alimenta a API com o link do backend configurado no Render antes do app carregar
const apiUrl = import.meta.env.VITE_API_URL;
if (apiUrl) {
  setBaseUrl(apiUrl);
}

// ─── Constantes de tempo ───────────────────────────────────────────────────
const ONE_DAY_MS  = 24 * 60 * 60 * 1000;
const FIVE_MIN_MS =  5 * 60 * 1000;

// Altere este valor para forçar limpeza de cache em todos os navegadores após deploys:
const CACHE_VERSION = "v2";

// ─── QueryClient ─────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: FIVE_MIN_MS,   // após 5 min busca dados novos em segundo plano
      gcTime: ONE_DAY_MS,       // mantém em memória por 1 dia
      refetchOnWindowFocus: false,
    },
  },
});

// ─── Persistência em localStorage ────────────────────────────────────────────
const localPersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: "clickreserva-cache",
});

persistQueryClient({
  queryClient,
  persister: localPersister,
  maxAge: ONE_DAY_MS,
  buster: CACHE_VERSION,
});

// ─── Aplica cores do config da escola como CSS vars ──────────────────────────
(function applyEscolaTheme() {
  const r = document.documentElement.style;
  const c = ESCOLA.cores;
  r.setProperty("--primary", c.primaria);
  r.setProperty("--ring", c.anel);
  r.setProperty("--secondary", c.secundaria);
  r.setProperty("--background", c.fundo);
  r.setProperty("--sidebar", c.sidebar);
  r.setProperty("--sidebar-primary", c.sidebarPrimaria);
  r.setProperty("--sidebar-accent", c.sidebarAccent);
  r.setProperty("--sidebar-ring", c.sidebarPrimaria);
})();

// Exporta função para limpar o cache manualmente (usada na tela de configurações)
export function clearAppCache() {
  queryClient.clear();
  window.localStorage.removeItem("clickreserva-cache");
}

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useReservationReminder();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  useEffect(() => {
    if (!isLoading && user && user.role !== "coordinator" && user.role !== "admin") {
      const coordinatorPaths = ["/coordenador/professores", "/coordenador/bloqueios", "/coordenador/salas", "/coordenador/configuracoes", "/coordenador/reservas", "/coordenador/justificativas"];
      if (coordinatorPaths.some(p => location.startsWith(p))) {
        setLocation("/");
      }
    }
  }, [user, isLoading, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <MainLayout>
      <Switch>
        <Route path="/">
          <RouteErrorBoundary key="dashboard">
            <DashboardPage />
          </RouteErrorBoundary>
        </Route>
        <Route path="/reservas">
          <RouteErrorBoundary key="reservas">
            <ReservationsPage />
          </RouteErrorBoundary>
        </Route>
        <Route path="/reservas/nova">
          <RouteErrorBoundary key="nova">
            <NewReservationPage />
          </RouteErrorBoundary>
        </Route>
        <Route path="/salas">
          <RouteErrorBoundary key="salas">
            <RoomsPage />
          </RouteErrorBoundary>
        </Route>
        <Route path="/presenca">
          <RouteErrorBoundary key="presenca">
            <PresencePage />
          </RouteErrorBoundary>
        </Route>
        <Route path="/coordenador/professores">
          <RouteErrorBoundary key="coord-professores">
            <CoordinatorProfessorsPage />
          </RouteErrorBoundary>
        </Route>
        <Route path="/coordenador/bloqueios">
          <RouteErrorBoundary key="coord-bloqueios">
            <CoordinatorBlockedPage />
          </RouteErrorBoundary>
        </Route>
        <Route path="/coordenador/salas">
          <RouteErrorBoundary key="coord-salas">
            <CoordinatorRoomsPage />
          </RouteErrorBoundary>
        </Route>
        <Route path="/coordenador/configuracoes">
          <RouteErrorBoundary key="coord-config">
            <CoordinatorConfigPage />
          </RouteErrorBoundary>
        </Route>
        <Route path="/coordenador/reservas">
          <RouteErrorBoundary key="coord-reservas">
            <CoordinatorReservasPage />
          </RouteErrorBoundary>
        </Route>
        <Route path="/coordenador/justificativas">
          <RouteErrorBoundary key="coord-justificativas">
            <CoordinatorJustificativasPage />
          </RouteErrorBoundary>
        </Route>
        <Route path="/feedback">
          <RouteErrorBoundary key="feedback">
            <FeedbackPage />
          </RouteErrorBoundary>
        </Route>
        <Route path="/relatorio">
          <RouteErrorBoundary key="relatorio">
            <RelatorioPage />
          </RouteErrorBoundary>
        </Route>
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </MainLayout>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route>
        <AuthenticatedApp />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppRoutes />
            </WouterRouter>
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
