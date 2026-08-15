import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { useSupabaseClient } from "../lib/supabase";

export function useFollowing() {
  const supabase = useSupabaseClient();
  const { user, isLoaded, isSignedIn } = useUser();

  return useQuery({
    queryKey: ["following", user?.id],
    enabled: isLoaded && !!isSignedIn,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from("follows")
        .select("followed_id")
        .eq("follower_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((f) => f.followed_id));
    },
  });
}
