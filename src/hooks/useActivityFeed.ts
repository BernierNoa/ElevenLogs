import { useInfiniteQuery } from "@tanstack/react-query";
import { useSupabaseClient } from "../lib/supabase";
import { FEED_LOG_SELECT, mapFeedRow, type FeedLogItem } from "../lib/feedMapping";

const PAGE_SIZE = 15;

// "Charger plus" par curseur (created_at), pas de scroll infini : chaque
// page est un choix explicite de l'utilisateur, pas un piège à data.
export function useActivityFeed(followedIds: string[]) {
  const supabase = useSupabaseClient();

  return useInfiniteQuery({
    queryKey: ["activity-feed", [...followedIds].sort().join(",")],
    enabled: followedIds.length > 0,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }): Promise<FeedLogItem[]> => {
      let query = supabase
        .from("logs")
        .select(FEED_LOG_SELECT)
        .in("user_id", followedIds)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (pageParam) query = query.lt("created_at", pageParam);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapFeedRow).filter((item) => item !== null);
    },
    getNextPageParam: (lastPage) =>
      lastPage.length === PAGE_SIZE
        ? lastPage[lastPage.length - 1].createdAt
        : undefined,
  });
}
