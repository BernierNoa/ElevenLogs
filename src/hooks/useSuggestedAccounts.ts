import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "../lib/supabase";
import { FEED_LOG_SELECT, mapFeedRow } from "../lib/feedMapping";

const SCAN_LIMIT = 300;
const SUGGESTIONS_LIMIT = 8;

export interface SuggestedAccount {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  logCount: number;
}

// Réutilise la même fenêtre que useWeeklyLogs (Découverte) : les logs publics
// des 7 derniers jours servent ici à repérer les comptes les plus actifs, en
// guise de suggestion de suivi pour un nouvel utilisateur. Agrégation
// client-side (pas de group by via PostgREST), même approche que le
// "match de la semaine" de Découverte.
export function useSuggestedAccounts(excludeUserId: string | undefined) {
  return useQuery({
    queryKey: ["suggested-accounts", excludeUserId],
    enabled: excludeUserId !== undefined,
    queryFn: async (): Promise<SuggestedAccount[]> => {
      const weekAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const { data, error } = await supabasePublic
        .from("logs")
        .select(FEED_LOG_SELECT)
        .gte("created_at", weekAgo)
        .order("created_at", { ascending: false })
        .limit(SCAN_LIMIT);
      if (error) throw error;

      const byUser = new Map<string, SuggestedAccount>();
      for (const row of data ?? []) {
        const item = mapFeedRow(row);
        if (!item || item.userId === excludeUserId) continue;
        const existing = byUser.get(item.userId);
        if (existing) existing.logCount += 1;
        else {
          byUser.set(item.userId, {
            userId: item.userId,
            displayName: item.displayName,
            avatarUrl: item.avatarUrl,
            logCount: 1,
          });
        }
      }

      return [...byUser.values()]
        .sort((a, b) => b.logCount - a.logCount)
        .slice(0, SUGGESTIONS_LIMIT);
    },
  });
}
