// Pub/sub minimal, module-scope — pas de Context React nécessaire pour un
// besoin aussi simple. Appelable depuis n'importe où, y compris un hook
// (ex. onSuccess d'une mutation) sans avoir à traverser l'arbre de composants.
export interface ToastAction {
  label: string;
  onClick: () => void;
}

export type ToastKind = "default" | "celebrate";

type Listener = (
  message: string,
  action?: ToastAction,
  kind?: ToastKind,
) => void;

let listeners: Listener[] = [];

// L'action optionnelle sert aux échecs définitifs (après retries épuisés) où
// l'utilisateur doit pouvoir relancer l'opération sans revenir taper le
// bouton d'origine — cf. useFollowMutations.
export function showToast(
  message: string,
  action?: ToastAction,
  kind: ToastKind = "default",
) {
  for (const listener of listeners) listener(message, action, kind);
}

export function showCelebrateToast(message: string) {
  showToast(message, undefined, "celebrate");
}

export function subscribeToast(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
