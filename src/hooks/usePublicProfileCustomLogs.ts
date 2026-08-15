import { useQuery } from "@tanstack/react-query";
import { useSupabaseClient } from "../lib/supabase";
import {
  CUSTOM_FEED_LOG_SELECT,
  mapCustomFeedRow,
  type PublicCustomLogItem,
} from "../lib/customLogFeedMapping";

// Même logique que usePublicProfileLogs : client authentifié (pas
// supabasePublic), RLS fait le tri exact selon qui regarde (soi-même vs
// profil public/privé) — cf. migration custom_logs public read.
export function usePublicProfileCustomLogs(userId: string | undefined) {
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ["public-profile-custom-logs", userId],
    enabled: !!userId,
    queryFn: async (): Promise<PublicCustomLogItem[]> => {
      const { data, error } = await supabase
        .from("custom_logs")
        .select(CUSTOM_FEED_LOG_SELECT)
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapCustomFeedRow);
    },
  });
}
