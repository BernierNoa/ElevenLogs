import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "../lib/supabase";

export type MatchStatus = "scheduled" | "live" | "finished" | "postponed";

export interface MatchListItem {
  id: string;
  kickoff_at: string;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  competition: {
    id: string;
    name: string;
    country: string | null;
    logo_url: string | null;
  } | null;
  home_team: { name: string; logo_url: string | null } | null;
  away_team: { name: string; logo_url: string | null } | null;
}

export interface UseMatchesOptions {
  /** Borne inférieure incluse (ISO). */
  from?: string;
  /** Borne supérieure exclue (ISO). */
  to?: string;
}

// `from`/`to` restent optionnels : Journal a besoin de tout l'historique des
// matchs loggés (même anciens), seule la page Matchs impose une fenêtre.
export function useMatches(options: UseMatchesOptions = {}) {
  const { from, to } = options;

  return useQuery({
    queryKey: ["matches", from, to],
    queryFn: async (): Promise<MatchListItem[]> => {
      let query = supabasePublic
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
        .order("kickoff_at", { ascending: true });

      if (from) query = query.gte("kickoff_at", from);
      if (to) query = query.lt("kickoff_at", to);

      const { data, error } = await query;

      if (error) throw error;
      return (data ?? []) as unknown as MatchListItem[];
    },
  });
}
