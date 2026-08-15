import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "../lib/supabase";
import { FEED_LOG_SELECT, mapFeedRow, type FeedLogItem } from "../lib/feedMapping";

const DISCOVERY_LIMIT = 15;

// Repli quand la liste de suivis est vide : les logs publics les plus
// récents de la plateforme. RLS ne renvoie déjà que du public/profils
// publics, donc client anonyme suffisant — pas de reco, volontairement simple.
export function useDiscoveryFeed(enabled: boolean) {
  return useQuery({
    queryKey: ["discovery-feed"],
    enabled,
    queryFn: async (): Promise<FeedLogItem[]> => {
      const { data, error } = await supabasePublic
        .from("logs")
        .select(FEED_LOG_SELECT)
        .order("created_at", { ascending: false })
        .limit(DISCOVERY_LIMIT);

      if (error) throw error;
      return (data ?? []).map(mapFeedRow).filter((item) => item !== null);
    },
  });
}
