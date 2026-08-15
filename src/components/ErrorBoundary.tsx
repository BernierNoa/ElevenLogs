import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./ui/Button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Filet de sécurité pour toute l'app : sans ça, une erreur de rendu dans un
// composant fait planter tout l'arbre React (écran blanc) plutôt que
// d'afficher un message récupérable. Rechargement complet (pas un simple
// reset du state local) pour repartir d'un runtime React sain.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("Erreur non gérée :", error, info.componentStack);
  }

  handleReturnHome = () => {
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-noir px-5 text-center">
          <div className="max-w-[440px]">
            <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] text-[22px] mb-3 text-craie">
              Un imprévu est survenu
            </h1>
            <p className="text-gris text-[14px] mb-6">
              Quelque chose s'est mal passé de notre côté. Réessaie, ou
              reviens à l'accueil — tes logs ne sont pas perdus.
            </p>
            <Button onClick={this.handleReturnHome}>Retour à l'accueil</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
