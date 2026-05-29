import { Link } from "wouter";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card rounded-xl border border-border shadow-sm p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-orange/10 border border-orange/20 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-orange" />
          </div>
        </div>

        <p className="font-mono text-xs text-foreground/40 uppercase tracking-[0.3em] mb-2">Erro 404</p>
        <h1 className="font-display font-bold text-2xl text-foreground mb-3">Página não encontrada</h1>
        <p className="font-body text-sm text-foreground/60 mb-8 leading-relaxed">
          O endereço que você acessou não existe ou foi removido.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-teal hover:bg-teal/90 text-white px-5 py-2.5 rounded-lg font-display font-semibold text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Voltar para a ficha
        </Link>
      </div>
    </div>
  );
}
