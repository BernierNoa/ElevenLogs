import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "../lib/supabase";

export interface FollowCounts {
  followers: number;
  following: number;
}

// Qui suit qui n'est pas sensible (RLS `follows` : lecture publique), donc
// client anonyme suffisant — comptes visibles même sur un profil privé.
export function useFollowCounts(userId: string | undefined) {
  return useQuery({
    queryKey: ["follow-counts", userId],
    enabled: !!userId,
    queryFn: async (): Promise<FollowCounts> => {
      const [followersRes, followingRes] = await Promise.all([
        supabasePublic
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("followed_id", userId!),
        supabasePublic
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", userId!),
      ]);

      if (followersRes.error) throw followersRes.error;
      if (followingRes.error) throw followingRes.error;

      return {
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0,
      };
    },
  });
}
