import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { useSupabaseClient, supabasePublic } from "../lib/supabase";

export interface BlockedUserEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

// En deux temps (comme useTeamSearch) plutôt qu'un embed PostgREST : `blocks`
// n'a pas de FK vers profile_settings, l'ajouter juste pour cette liste ne
// vaudrait pas une migration de plus.
export function useBlockedUsersList() {
  const supabase = useSupabaseClient();
  const { user } = useUser();

  return useQuery({
    queryKey: ["blocked-users-list", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<BlockedUserEntry[]> => {
      const { data: blockRows, error } = await supabase
        .from("blocks")
        .select("blocked_id")
        .eq("blocker_id", user!.id);
      if (error) throw error;

      const ids = (blockRows ?? []).map((b) => b.blocked_id);
      if (ids.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabasePublic
        .from("profile_settings")
        .select("user_id, display_name, avatar_url")
        .in("user_id", ids);
      if (profilesError) throw profilesError;

      return ids.map((id) => {
        const p = profiles?.find((row) => row.user_id === id);
        return {
          userId: id,
          displayName: p?.display_name ?? "Utilisateur",
          avatarUrl: p?.avatar_url ?? null,
        };
      });
    },
  });
}
