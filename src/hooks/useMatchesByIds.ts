import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "../lib/supabase";
import type { MatchListItem } from "./useMatches";

// Réhydrate les matchs réels d'un multiplex existant (cf. custom_matches.match_id)
// pour pré-remplir MultiplexMatchPicker en édition — même forme que
// useMatches, mais bornée à une liste d'ids plutôt qu'une fenêtre de dates.
export function useMatchesByIds(ids: string[]) {
  const uniqueIds = [...new Set(ids)].sort();

  return useQuery({
    queryKey: ["matches-by-ids", uniqueIds],
    enabled: uniqueIds.length > 0,
    queryFn: async (): Promise<MatchListItem[]> => {
      const { data, error } = await supabasePublic
        .from("matches")
        .select(
          `
          id,
          kickoff_at,
          status,
          home_score,
          away_score,
          competition:competitions(id, name, country, logo_url),
          home_team:teams!home_team_id(name, logo_url),
          away_team:teams!away_team_id(name, logo_url)
        `,
        )
        .in("id", uniqueIds);
      if (error) throw error;
      return (data ?? []) as unknown as MatchListItem[];
    },
  });
}
