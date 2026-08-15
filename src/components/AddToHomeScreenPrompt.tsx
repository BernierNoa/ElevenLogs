import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useUser } from "@clerk/react-router";
import { Button } from "./ui/Button";
import { IconShare, IconSquarePlus } from "./icons";
import { usePatchNoteSeen } from "../hooks/usePatchNote";
import { LATEST_PATCH_NOTE } from "../lib/patchNotes";

const STORAGE_KEY = "elevenlogs-a2hs-seen";
const SHOW_DELAY_MS = 1200;

function isIPhoneSafariBrowsing(): boolean {
  const isIPhone = /iPhone|iPod/.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return isIPhone && !isStandalone;
}

// Safari iOS n'a pas d'invite d'installation native (contrairement à Chrome
// Android, qui propose déjà l'ajout à l'écran d'accueil tout seul dès qu'un
// manifest.json valide existe) : la seule façon de "installer" Eleven Logs
// sur iPhone est manuelle, d'où ce mini-tutoriel — jamais montré ailleurs.
export function AddToHomeScreenPrompt() {
  const { isLoaded, isSignedIn } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  // Évite d'afficher les deux modales en même temps si un nouveau compte se
  // connecte pour la première fois sur iPhone Safari juste après la sortie
  // d'une patch note : on attend qu'elle soit vue (ou confirmée non
  // applicable) avant de proposer l'ajout à l'écran d'accueil.
  const { data: patchNoteSeen } = usePatchNoteSeen(LATEST_PATCH_NOTE.version);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (patchNoteSeen === false) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    if (!isIPhoneSafariBrowsing()) return;

    const timer = setTimeout(() => setIsOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn, patchNoteSeen]);

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setIsOpen(false);
  }

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center sm:p-5"
      onClick={handleDismiss}
    >
      <div
        className="carte w-full sm:max-w-[380px] rounded-b-none sm:rounded-[16px] p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden w-10 h-1 rounded-full bg-ligne mx-auto mb-4" />

        <div className="w-14 h-14 rounded-2xl bg-projecteur/10 grid place-items-center mx-auto mb-4">
          <IconSquarePlus className="w-7 h-7 text-projecteur" />
        </div>

        <h2 className="font-display font-extrabold uppercase tracking-[-0.03em] [font-stretch:110%] text-[17px]">
          Installe Eleven Logs
        </h2>
        <p className="text-gris text-[13px] mt-2">
          Ajoute-le à ton écran d'accueil pour l'ouvrir comme une vraie app,
          en un tap.
        </p>

        <div className="mt-5 space-y-3 text-left">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-nuit-haute grid place-items-center font-data text-[12px] text-projecteur shrink-0">
              1
            </span>
            <span className="text-[13.5px] flex items-center gap-1.5 flex-wrap">
              Appuie sur
              <IconShare className="w-4 h-4 text-projecteur inline-block" />
              <strong>Partager</strong> en bas de Safari
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-nuit-haute grid place-items-center font-data text-[12px] text-projecteur shrink-0">
              2
            </span>
            <span className="text-[13.5px]">
              Choisis <strong>Sur l'écran d'accueil</strong>
            </span>
          </div>
        </div>

        <Button className="w-full mt-6" onClick={handleDismiss}>
          Compris
        </Button>
      </div>
    </div>,
    document.body,
  );
}
