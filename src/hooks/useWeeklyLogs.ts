import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "../lib/supabase";
import { FEED_LOG_SELECT, mapFeedRow, type FeedLogItem } from "../lib/feedMapping";

const WEEK_DAYS = 7;
const SCAN_LIMIT = 300;

// Base commune pour la page Découverte : les logs publics des 7 derniers
// jours servent à la fois à repérer le match le plus loggé de la semaine et
// à établir le classement "meilleurs logs" — un seul appel plutôt que deux
// requêtes séparées sur `logs`. RLS filtre déjà aux logs publics de profils
// publics, client anonyme suffisant (même logique que useDiscoveryFeed).
export function useWeeklyLogs() {
  return useQuery({
    queryKey: ["weekly-logs"],
    queryFn: async (): Promise<FeedLogItem[]> => {
      const weekAgo = new Date(
        Date.now() - WEEK_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();
      const { data, error } = await supabasePublic
        .from("logs")
        .select(FEED_LOG_SELECT)
        .gte("created_at", weekAgo)
        .order("created_at", { ascending: false })
        .limit(SCAN_LIMIT);
      if (error) throw error;
      return (data ?? [])
        .map(mapFeedRow)
        .filter((item): item is FeedLogItem => item !== null);
    },
  });
}
