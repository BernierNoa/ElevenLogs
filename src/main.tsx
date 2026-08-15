import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { ClerkProvider } from "@clerk/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { clerkAppearance } from "./lib/clerkAppearance.ts";
import "./index.css";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  | string
  | undefined;

const queryClient = new QueryClient();

function ConfigError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-noir px-5">
      <div className="text-craie max-w-[520px]">
        <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] text-[22px] mb-3">
          Configuration manquante
        </h1>
        <p className="text-gris text-[14px]">
          VITE_CLERK_PUBLISHABLE_KEY n'est pas définie. L'authentification est
          nécessaire partout dans l'app (logs, journal), donc elle ne peut pas
          démarrer sans cette clé.
        </p>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {clerkPublishableKey ? (
      <BrowserRouter>
        <ClerkProvider
          publishableKey={clerkPublishableKey}
          appearance={clerkAppearance}
        >
          <QueryClientProvider client={queryClient}>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </QueryClientProvider>
        </ClerkProvider>
      </BrowserRouter>
    ) : (
      <ConfigError />
    )}
  </StrictMode>,
);
