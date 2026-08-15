import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "../lib/supabase";

export interface LineupPlayerItem {
  playerId: string;
  fullName: string;
  position: string | null;
  teamId: string;
  teamName: string;
}

interface LineupRow {
  team_id: string;
  team: { name: string } | null;
  player: { id: string; full_name: string; position: string | null } | null;
}

// Lecture publique : les lineups font partie du référentiel synchronisé, pas
// des données personnelles de l'utilisateur.
export function useMatchLineup(matchId: string | null) {
  return useQuery({
    queryKey: ["match-lineup", matchId],
    enabled: matchId !== null,
    queryFn: async (): Promise<LineupPlayerItem[]> => {
      const { data, error } = await supabasePublic
        .from("lineups")
        .select("team_id, team:teams(name), player:players(id, full_name, position)")
        .eq("match_id", matchId);

      if (error) throw error;

      return ((data ?? []) as unknown as LineupRow[])
        .filter((row) => row.player !== null)
        .map((row) => ({
          playerId: row.player!.id,
          fullName: row.player!.full_name,
          position: row.player!.position,
          teamId: row.team_id,
          teamName: row.team?.name ?? "",
        }));
    },
  });
}
