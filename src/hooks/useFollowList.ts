import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "../lib/supabase";

export type FollowListKind = "followers" | "following";

export interface FollowListEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

interface FollowerRow {
  follower_id: string;
  profile: { display_name: string; avatar_url: string | null } | null;
}

interface FollowingRow {
  followed_id: string;
  profile: { display_name: string; avatar_url: string | null } | null;
}

// `!follower_id` / `!followed_id` désambiguïsent les deux FK follows->
// profile_settings (même pattern que matches->teams home/away ailleurs
// dans le projet).
export function useFollowList(userId: string | undefined, kind: FollowListKind) {
  return useQuery({
    queryKey: ["follow-list", kind, userId],
    enabled: !!userId,
    queryFn: async (): Promise<FollowListEntry[]> => {
      if (kind === "followers") {
        const { data, error } = await supabasePublic
          .from("follows")
          .select("follower_id, profile:profile_settings!follower_id(display_name, avatar_url)")
          .eq("followed_id", userId!)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return ((data ?? []) as unknown as FollowerRow[]).map((row) => ({
          userId: row.follower_id,
          displayName: row.profile?.display_name ?? "Utilisateur",
          avatarUrl: row.profile?.avatar_url ?? null,
        }));
      }

      const { data, error } = await supabasePublic
        .from("follows")
        .select("followed_id, profile:profile_settings!followed_id(display_name, avatar_url)")
        .eq("follower_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown as FollowingRow[]).map((row) => ({
        userId: row.followed_id,
        displayName: row.profile?.display_name ?? "Utilisateur",
        avatarUrl: row.profile?.avatar_url ?? null,
      }));
    },
  });
}
