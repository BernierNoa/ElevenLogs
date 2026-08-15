import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "../lib/supabase";
import type { RankedItem } from "./useSeasonStats";

const RECENT_LOGS_SCANNED = 3000;
const PLATFORM_RANKING_LIMIT = 30;

// RLS filtre déjà `logs` aux logs publics de profils publics (comme
// useCommunityAverages) : client anonyme suffisant, agrégation en deux temps
// (comptage côté client, comme useTeamSearch le fait déjà pour équipes ->
// matchs) plutôt qu'un group-by SQL — cohérent avec le reste du projet, pas
// de fonction/vue dédiée pour ce stade MVP. Le scan est borné pour éviter de
// rapatrier une table `logs` qui grossirait sans limite.
export function usePlatformPlayerStats(enabled: boolean) {
  return useQuery({
    queryKey: ["platform-player-stats"],
    enabled,
    queryFn: async (): Promise<RankedItem[]> => {
      const { data: logRows, error: logsError } = await supabasePublic
        .from("logs")
        .select("motm_player_id")
        .not("motm_player_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(RECENT_LOGS_SCANNED);
      if (logsError) throw logsError;

      const counts = new Map<string, number>();
      for (const row of logRows ?? []) {
        const id = row.motm_player_id as string;
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }

      const topIds = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, PLATFORM_RANKING_LIMIT)
        .map(([id]) => id);
      if (topIds.length === 0) return [];

      const { data: players, error: playersError } = await supabasePublic
        .from("players")
        .select("id, full_name")
        .in("id", topIds);
      if (playersError) throw playersError;

      const nameById = new Map((players ?? []).map((p) => [p.id, p.full_name]));
      return topIds.map((id) => ({
        key: id,
        label: nameById.get(id) ?? "?",
        value: counts.get(id) ?? 0,
      }));
    },
  });
}
