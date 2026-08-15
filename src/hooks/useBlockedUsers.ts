import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { useSupabaseClient } from "../lib/supabase";

export function useBlockedUsers() {
  const supabase = useSupabaseClient();
  const { user, isLoaded, isSignedIn } = useUser();

  return useQuery({
    queryKey: ["blocked-users", user?.id],
    enabled: isLoaded && !!isSignedIn,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from("blocks")
        .select("blocked_id")
        .eq("blocker_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((b) => b.blocked_id));
    },
  });
}
