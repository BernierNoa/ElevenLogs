import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useUser } from "@clerk/react-router";
import { Button } from "./ui/Button";
import { LATEST_PATCH_NOTE } from "../lib/patchNotes";
import { usePatchNoteSeen, useMarkPatchNoteSeen } from "../hooks/usePatchNote";

const SHOW_DELAY_MS = 600;

// Affichée une fois par COMPTE (persistée côté Supabase dans
// patch_note_views), contrairement à AddToHomeScreenPrompt qui est une fois
// par APPAREIL (localStorage). Ne s'affiche jamais tant que la requête
// "déjà vue ?" n'a pas répondu positivement à "non", pour ne jamais flasher
// la modale à un utilisateur qui l'a déjà vue ou en cas d'erreur réseau/RLS.
export function PatchNoteModal() {
  const { isLoaded, isSignedIn } = useUser();
  const { data: alreadySeen, isLoading, isError } = usePatchNoteSeen(
    LATEST_PATCH_NOTE.version,
  );
  const markSeen = useMarkPatchNoteSeen();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (isLoading || isError || alreadySeen) return;

    const timer = setTimeout(() => setIsOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn, isLoading, isError, alreadySeen]);

  function handleDismiss() {
    if (markSeen.isPending) return;
    setIsOpen(false); // fermeture optimiste : donnée non critique, best-effort suffit
    markSeen.mutate(LATEST_PATCH_NOTE.version);
  }

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center sm:p-5"
      onClick={handleDismiss}
    >
      <div
        className="carte w-full sm:max-w-[440px] max-h-[80vh] sm:max-h-[85vh] overflow-y-auto rounded-b-none sm:rounded-[16px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden w-10 h-1 rounded-full bg-ligne mx-auto mb-4" />

        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="font-display font-extrabold uppercase tracking-[-0.03em] [font-stretch:110%] text-[16px]">
            {LATEST_PATCH_NOTE.title}
          </h2>
          <Button variant="discret" iconOnly aria-label="Fermer" onClick={handleDismiss}>
            ✕
          </Button>
        </div>

        <ul className="space-y-2.5 text-[13.5px] text-craie">
          {LATEST_PATCH_NOTE.items.map((item) => (
            <li key={item} className="flex gap-2.5">
              <span className="text-projecteur shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <Button className="w-full mt-6" onClick={handleDismiss}>
          Compris
        </Button>
      </div>
    </div>,
    document.body,
  );
}
