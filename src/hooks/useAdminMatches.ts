import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "../lib/supabase";
import type { MatchStatus } from "./useMatches";

export interface AdminMatchItem {
  id: string;
  kickoff_at: string;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  competition: { id: string; name: string; country: string | null; logo_url: string | null } | null;
  home_team: { id: string; name: string; logo_url: string | null } | null;
  away_team: { id: string; name: string; logo_url: string | null } | null;
}

// Hook dédié à la page Admin plutôt que de faire évoluer useMatches (partagé
// par le reste de l'app) : il a besoin de l'id de chaque équipe pour pouvoir
// la corriger (useMatches ne remonte que name/logo_url). Même table, même
// policy de lecture publique — juste une projection de colonnes différente.
export function useAdminMatches() {
  return useQuery({
    queryKey: ["admin-matches"],
    queryFn: async (): Promise<AdminMatchItem[]> => {
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
          home_team:teams!home_team_id(id, name, logo_url),
          away_team:teams!away_team_id(id, name, logo_url)
        `,
        )
        .order("kickoff_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as AdminMatchItem[];
    },
  });
}
