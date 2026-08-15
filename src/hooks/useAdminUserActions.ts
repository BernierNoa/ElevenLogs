import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabaseClient } from "../lib/supabase";

// Toutes ces mutations dépendent de la policy RLS additive "Admin peut
// modérer les profils" (20260815000000_add_admin_moderation.sql) : pour tout
// autre compte, elles mettraient à jour silencieusement 0 ligne (RLS filtre,
// aucune erreur levée par Postgres), comme le reste des actions admin.
export function useAdminUserActions() {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  const banUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profile_settings")
        .update({ banned_at: new Date().toISOString(), suspended_until: null })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const unbanUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profile_settings")
        .update({ banned_at: null })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const suspendUser = useMutation({
    mutationFn: async ({ userId, until }: { userId: string; until: string }) => {
      const { error } = await supabase
        .from("profile_settings")
        .update({ suspended_until: until })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const unsuspendUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profile_settings")
        .update({ suspended_until: null })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const forcePrivate = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profile_settings")
        .update({ profile_visibility: "private" })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { banUser, unbanUser, suspendUser, unsuspendUser, forcePrivate };
}
