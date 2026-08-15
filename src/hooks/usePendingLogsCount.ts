import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { getPendingLogsForUser, STUCK_AFTER_ATTEMPTS } from "../lib/pendingLogsDb";

export interface PendingLogsSummary {
  count: number;
  // Entrées qui ont échoué STUCK_AFTER_ATTEMPTS fois ou plus et n'attendent
  // plus qu'une relance manuelle (OfflineSyncManager ne les retente plus
  // automatiquement).
  stuckCount: number;
}

// Invalidée par useSaveLog (quand on enfile un log hors-ligne) et par
// OfflineSyncManager (quand la queue se vide ou qu'une entrée échoue) — ce
// hook ne fait que lire.
export function usePendingLogsCount() {
  const { user } = useUser();

  return useQuery<PendingLogsSummary>({
    queryKey: ["pending-logs-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const pending = await getPendingLogsForUser(user!.id);
      const stuckCount = pending.filter(
        (entry) => (entry.attemptCount ?? 0) >= STUCK_AFTER_ATTEMPTS,
      ).length;
      return { count: pending.length, stuckCount };
    },
  });
}
