export function formatKickoff(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// Calculé une seule fois au rendu (pas de minuteur par carte — potentiellement
// des centaines de cartes affichées à la fois) : léger décalage possible
// entre deux rendus, sans conséquence pour une simple indication d'urgence.
export function formatCountdown(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return "imminent";

  const totalMinutes = Math.round(diffMs / 60_000);
  if (totalMinutes < 60) return `dans ${totalMinutes} min`;

  const totalHours = Math.floor(totalMinutes / 60);
  if (totalHours < 24) {
    const minutes = totalMinutes % 60;
    return `dans ${totalHours}h${String(minutes).padStart(2, "0")}`;
  }

  const days = Math.round(totalHours / 24);
  if (days < 7) return `dans ${days} jour${days > 1 ? "s" : ""}`;

  return formatKickoff(iso);
}
