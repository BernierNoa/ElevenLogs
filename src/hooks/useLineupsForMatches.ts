import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "../lib/supabase";

export interface MultiplexLineupPlayer {
  playerId: string;
  fullName: string;
  teamName: string;
  matchId: string;
}

interface LineupRow {
  match_id: string;
  team: { name: string } | null;
  player: { id: string; full_name: string } | null;
}

// Compos combinées de tous les matchs d'un multiplex, pour peupler le menu
// déroulant "MVP du multiplex" (cf. useMatchLineup, l'équivalent pour un
// seul match dans LogMatchModal). Lecture publique : les lineups font
// partie du référentiel synchronisé, pas des données personnelles.
export function useLineupsForMatches(matchIds: string[]) {
  const uniqueIds = [...new Set(matchIds)].sort();

  return useQuery({
    queryKey: ["multiplex-lineups", uniqueIds],
    enabled: uniqueIds.length > 0,
    queryFn: async (): Promise<MultiplexLineupPlayer[]> => {
      const { data, error } = await supabasePublic
        .from("lineups")
        .select("match_id, team:teams(name), player:players(id, full_name)")
        .in("match_id", uniqueIds);
      if (error) throw error;

      return ((data ?? []) as unknown as LineupRow[])
        .filter((row) => row.player !== null)
        .map((row) => ({
          playerId: row.player!.id,
          fullName: row.player!.full_name,
          teamName: row.team?.name ?? "",
          matchId: row.match_id,
        }));
    },
  });
}
