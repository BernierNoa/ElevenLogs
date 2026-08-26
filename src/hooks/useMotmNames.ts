import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "../lib/supabase";

// Une seule requête groupée plutôt qu'un lookup par carte : les cartes du
// journal n'ont que motm_player_id (cf. LogItem), jamais le nom du joueur —
// utilisé pour peupler `motmName` sur ShareCard sans passer par le lineup
// complet du match (cf. useMatchLineup, plus coûteux et pas nécessaire ici).
export function useMotmNames(playerIds: string[]) {
  const uniqueIds = [...new Set(playerIds)].sort();

  return useQuery({
    queryKey: ["motm-names", uniqueIds],
    enabled: uniqueIds.length > 0,
    queryFn: async (): Promise<Map<string, string>> => {
      const { data, error } = await supabasePublic
        .from("players")
        .select("id, full_name")
        .in("id", uniqueIds);
      if (error) throw error;
      return new Map((data ?? []).map((p) => [p.id, p.full_name]));
    },
  });
}
