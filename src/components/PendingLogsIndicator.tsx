import { usePendingLogsCount } from "../hooks/usePendingLogsCount";
import { PENDING_LOGS_RETRY_EVENT } from "../lib/pendingLogsDb";
import { Button } from "./ui/Button";

function retryNow() {
  window.dispatchEvent(new Event(PENDING_LOGS_RETRY_EVENT));
}

// Discret, pas un banner : un petit badge qui reste tant que la queue n'est
// pas vide, et disparaît tout seul dès que OfflineSyncManager l'a vidée.
// Quand une ou plusieurs entrées échouent en boucle pour une raison qui n'est
// pas juste "hors-ligne" (OfflineSyncManager arrête de les retenter tout
// seul passé STUCK_AFTER_ATTEMPTS), le badge le signale distinctement et
// propose une relance manuelle plutôt que de laisser l'utilisateur croire
// que ça finira par se synchroniser tout seul.
export function PendingLogsIndicator() {
  const { data } = usePendingLogsCount();
  const count = data?.count ?? 0;
  const stuckCount = data?.stuckCount ?? 0;

  if (count === 0) return null;

  if (stuckCount > 0) {
    return (
      <div className="fixed bottom-20 md:bottom-5 left-4 z-40">
        <div className="carte flex items-center gap-2 px-3 py-2 border-carton/40">
          <span className="w-1.5 h-1.5 rounded-full bg-carton shrink-0" />
          <span className="font-data text-[11px] text-carton uppercase tracking-[0.06em]">
            {stuckCount} log{stuckCount > 1 ? "s" : ""} bloqué{stuckCount > 1 ? "s" : ""}
          </span>
          <Button variant="destructif" size="sm" onClick={retryNow}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 md:bottom-5 left-4 z-40">
      <div className="carte flex items-center gap-2 px-3 py-2 border-gris-fonce">
        <span className="w-1.5 h-1.5 rounded-full bg-gris-fonce shrink-0" />
        <span className="font-data text-[11px] text-gris uppercase tracking-[0.06em]">
          {count} log{count > 1 ? "s" : ""} en attente de synchro
        </span>
      </div>
    </div>
  );
}
