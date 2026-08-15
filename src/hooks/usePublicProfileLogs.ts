import { useQuery } from "@tanstack/react-query";
import { useSupabaseClient } from "../lib/supabase";
import { FEED_LOG_SELECT, mapFeedRow, type FeedLogItem } from "../lib/feedMapping";

// Client authentifié (pas supabasePublic) : un log privé du propriétaire lui-
// même en train de visiter son propre profil doit rester visible pour lui.
// RLS fait le tri exact selon qui regarde (soi-même vs profil public/privé).
export function usePublicProfileLogs(userId: string | undefined) {
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ["public-profile-logs", userId],
    enabled: !!userId,
    queryFn: async (): Promise<FeedLogItem[]> => {
      const { data, error } = await supabase
        .from("logs")
        .select(FEED_LOG_SELECT)
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapFeedRow).filter((item) => item !== null);
    },
  });
}
