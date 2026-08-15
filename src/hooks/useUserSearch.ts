import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "../lib/supabase";

export interface UserSearchResult {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

const SEARCH_LIMIT = 10;

// Identité toujours publique (cf. profile_settings), donc client anonyme
// suffisant, même pour trouver un compte au profil privé.
export function useUserSearch(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ["user-search", trimmed],
    enabled: trimmed.length >= 2,
    queryFn: async (): Promise<UserSearchResult[]> => {
      const { data, error } = await supabasePublic
        .from("profile_settings")
        .select("user_id, display_name, avatar_url")
        .ilike("display_name", `%${trimmed}%`)
        .limit(SEARCH_LIMIT);

      if (error) throw error;
      return (data ?? []).map((row) => ({
        userId: row.user_id,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
      }));
    },
  });
}
