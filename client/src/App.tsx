import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import { Relatorio } from "@/lib/lazy-relatorio";

function Carregando() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="font-body text-foreground/50 text-sm animate-pulse">Carregando...</p>
    </div>
  );
}

function Router() {
  // `location` guia a animação: quando ela muda, o AnimatePresence troca o
  // motion.div — a página antiga faz "exit" e a nova faz "initial → animate".
  // Passamos a mesma `location` ao <Switch> para "congelar" a página que sai
  // na rota antiga durante a transição (senão ela viraria a página nova).
  const [location] = useLocation();
  // Respeita "reduzir movimento" do sistema: sem deslize, mantém só o fade.
  const reduzirMovimento = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial={{ opacity: 0, y: reduzirMovimento ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: reduzirMovimento ? 0 : -12 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <Switch location={location}>
          <Route path="/" component={Home} />
          <Route path="/relatorio">
            <Suspense fallback={<Carregando />}>
              <Relatorio />
            </Suspense>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Toaster />
      <Router />
    </ErrorBoundary>
  );
}

export default App;
