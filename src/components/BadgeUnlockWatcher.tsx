import { useEffect } from "react";
import { useBadges } from "../hooks/useBadges";
import { showCelebrateToast } from "../lib/toastStore";

const SEEN_KEY = "elevenlogs:seenBadges";

function loadSeenState(): { seen: Set<string>; bootstrapped: boolean } {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (raw === null) return { seen: new Set(), bootstrapped: false };
    return { seen: new Set(JSON.parse(raw) as string[]), bootstrapped: true };
  } catch {
    return { seen: new Set(), bootstrapped: false };
  }
}

function saveSeen(ids: Set<string>): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
  } catch {
    // Stockage indisponible (navigation privée stricte...) : la
    // célébration ne sera pas mémorisée d'une session à l'autre, sans
    // bloquer la page pour autant.
  }
}

// Monté globalement (AppLayout), pas dans useSaveLog/useSaveCustomLog : le
// calcul d'un badge dépend de hooks répartis dans toute l'app (stats de
// saison, compteurs de suivi, commentaires...), pas seulement du log qui
// vient d'être enregistré. On compare simplement l'état débloqué courant à
// la dernière photo connue en localStorage, peu importe ce qui a changé
// entre les deux.
export function BadgeUnlockWatcher() {
  const { isLoading, isError, badges } = useBadges();

  useEffect(() => {
    if (isLoading || isError || badges.length === 0) return;

    const { seen, bootstrapped } = loadSeenState();

    // Premier calcul jamais effectué pour ce navigateur : on enregistre
    // l'état actuel comme référence sans rien célébrer, sinon tous les
    // badges déjà acquis avant l'arrivée de cette fonctionnalité
    // déclencheraient une rafale de toasts au premier chargement.
    if (!bootstrapped) {
      saveSeen(new Set(badges.filter((b) => b.unlocked).map((b) => b.id)));
      return;
    }

    const newlyUnlocked = badges.filter((b) => b.unlocked && !seen.has(b.id));
    if (newlyUnlocked.length === 0) return;

    for (const badge of newlyUnlocked) {
      showCelebrateToast(`Badge débloqué : ${badge.label} !`);
      seen.add(badge.id);
    }
    saveSeen(seen);
  }, [isLoading, isError, badges]);

  return null;
}
