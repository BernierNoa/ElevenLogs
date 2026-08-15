import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "../lib/supabase";

export interface ProfileSettingsItem {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  profile_visibility: "public" | "private";
}

// Identité (nom/avatar/visibilité) toujours lisible publiquement (cf. RLS
// profile_settings) — client anonyme suffisant, marche même déconnecté.
export function useProfileSettings(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile-settings", userId],
    enabled: !!userId,
    queryFn: async (): Promise<ProfileSettingsItem | null> => {
      const { data, error } = await supabasePublic
        .from("profile_settings")
        .select("user_id, display_name, avatar_url, profile_visibility")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
