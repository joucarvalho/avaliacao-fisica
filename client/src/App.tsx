import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";

// Lazy loading: o Relatório carrega `recharts` (~340KB gz) só quando o usuário
// navega pra /relatorio. O bundle inicial fica mais leve.
const Relatorio = lazy(() => import("./pages/Relatorio"));

function Carregando() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="font-body text-foreground/50 text-sm animate-pulse">Carregando...</p>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/relatorio">
        <Suspense fallback={<Carregando />}>
          <Relatorio />
        </Suspense>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
