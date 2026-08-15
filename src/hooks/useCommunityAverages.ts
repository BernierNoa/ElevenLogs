import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "../lib/supabase";

export interface CommunityAverage {
  average: number;
  count: number;
}

const MIN_LOGS_TO_SHOW = 3;

// Un seul appel groupé pour tous les matchs affichés sur la page plutôt
// qu'une requête par carte — même logique que useMyLogs/useMatches. RLS
// filtre déjà aux logs publics de profils publics (client anonyme suffit).
// Sous 3 logs publics, la moyenne n'est pas exposée (éviterait de déguiser
// la note d'un seul autre utilisateur en "moyenne").
export function useCommunityAverages(matchIds: string[]) {
  const key = [...matchIds].sort().join(",");

  return useQuery({
    queryKey: ["community-averages", key],
    enabled: matchIds.length > 0,
    queryFn: async (): Promise<Map<string, CommunityAverage>> => {
      const { data, error } = await supabasePublic
        .from("logs")
        .select("match_id, rating")
        .in("match_id", matchIds);

      if (error) throw error;

      const byMatch = new Map<string, number[]>();
      for (const row of data ?? []) {
        const ratings = byMatch.get(row.match_id) ?? [];
        ratings.push(row.rating);
        byMatch.set(row.match_id, ratings);
      }

      const result = new Map<string, CommunityAverage>();
      for (const [matchId, ratings] of byMatch) {
        if (ratings.length < MIN_LOGS_TO_SHOW) continue;
        const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        result.set(matchId, { average, count: ratings.length });
      }

      return result;
    },
  });
}
