import { useEffect, useState } from "react";
import {
  subscribeToast,
  type ToastAction,
  type ToastKind,
} from "../../lib/toastStore";

interface ToastItem {
  id: number;
  message: string;
  action?: ToastAction;
  kind?: ToastKind;
}

let nextId = 0;
const DISPLAY_MS = 2500;
// Un toast avec action ("Réessayer") reste plus longtemps : le temps de lire
// le message ET de taper le bouton, pas juste de constater l'erreur.
const DISPLAY_MS_WITH_ACTION = 6000;

// Monté une seule fois dans AppLayout — la modale de log se ferme
// instantanément (React Query invalide juste le cache, pas de reload) et ce
// toast confirme par-dessus la liste qu'on vient de retrouver.
export function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return subscribeToast((message, action, kind) => {
      const id = nextId++;
      setToasts((current) => [...current, { id, message, action, kind }]);
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id));
      }, action ? DISPLAY_MS_WITH_ACTION : DISPLAY_MS);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-5 inset-x-0 z-[60] flex flex-col gap-2 items-center px-5 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={[
            "carte border-projecteur-fonce px-4 py-2.5 text-[13.5px] font-semibold text-craie pointer-events-auto flex items-center gap-3",
            toast.kind === "celebrate"
              ? "animate-[bounce_0.9s_ease-in-out]"
              : "",
          ].join(" ")}
        >
          {toast.kind === "celebrate" && (
            <span aria-hidden="true" className="text-[16px]">
              ✨
            </span>
          )}
          <span>{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              className="font-data text-[11px] uppercase tracking-[0.06em] text-projecteur shrink-0"
              onClick={() => {
                toast.action?.onClick();
                setToasts((current) => current.filter((t) => t.id !== toast.id));
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
