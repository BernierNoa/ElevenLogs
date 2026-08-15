import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "../lib/supabase";
import type { MatchListItem } from "./useMatches";

const MATCH_SELECT = `
  id,
  kickoff_at,
  status,
  home_score,
  away_score,
  competition:competitions(id, name, country, logo_url),
  home_team:teams!home_team_id(name, logo_url),
  away_team:teams!away_team_id(name, logo_url)
`;

// Recherche en deux temps : d'abord les équipes dont le nom matche, puis
// leurs derniers matchs (triés du plus récent au plus ancien, passés et à
// venir confondus) — plus simple et plus sûr qu'un filtre PostgREST sur une
// relation imbriquée.
export function useTeamSearch(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ["team-search", trimmed],
    enabled: trimmed.length >= 2,
    queryFn: async (): Promise<MatchListItem[]> => {
      const { data: teams, error: teamsError } = await supabasePublic
        .from("teams")
        .select("id")
        .ilike("name", `%${trimmed}%`)
        .limit(5);

      if (teamsError) throw teamsError;

      const teamIds = (teams ?? []).map((t) => t.id);
      if (teamIds.length === 0) return [];

      const orFilter = teamIds
        .map((id) => `home_team_id.eq.${id},away_team_id.eq.${id}`)
        .join(",");

      const { data: matches, error: matchesError } = await supabasePublic
        .from("matches")
        .select(MATCH_SELECT)
        .or(orFilter)
        .order("kickoff_at", { ascending: false })
        .limit(8);

      if (matchesError) throw matchesError;
      return (matches ?? []) as unknown as MatchListItem[];
    },
  });
}
