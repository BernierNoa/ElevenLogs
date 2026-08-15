import { useQuery } from "@tanstack/react-query";
import { useSupabaseClient } from "../lib/supabase";
import {
  CUSTOM_FEED_LOG_SELECT,
  mapCustomFeedRow,
  type PublicCustomLogItem,
} from "../lib/customLogFeedMapping";

const LIMIT = 50;

// Contrepartie de useActivityFeed pour custom_logs. Volontairement une
// requête bornée non paginée (comme useDiscoveryFeed) plutôt qu'un curseur
// dédié : le volume de matchs personnalisés par compte est faible face aux
// logs standards, et useActivityFeed reste la seule source paginée du fil
// fusionné (mergeFeedEntries) — "Charger plus" ne recharge donc que les logs
// standards, ce qui reste correct tant qu'une page de custom logs suffit.
export function useActivityFeedCustomLogs(followedIds: string[]) {
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ["activity-feed-custom-logs", [...followedIds].sort().join(",")],
    enabled: followedIds.length > 0,
    queryFn: async (): Promise<PublicCustomLogItem[]> => {
      const { data, error } = await supabase
        .from("custom_logs")
        .select(CUSTOM_FEED_LOG_SELECT)
        .in("user_id", followedIds)
        .order("created_at", { ascending: false })
        .limit(LIMIT);
      if (error) throw error;
      return (data ?? []).map(mapCustomFeedRow);
    },
  });
}
