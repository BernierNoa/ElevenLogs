import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { useSupabaseClient } from "../lib/supabase";

export function useBlockMutations() {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const queryClient = useQueryClient();

  // Bloquer supprime aussi la relation de suivi des deux côtés (trigger
  // SQL), donc le fil et la liste de suivis doivent se rafraîchir avec.
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
    queryClient.invalidateQueries({ queryKey: ["blocked-users-list"] });
    queryClient.invalidateQueries({ queryKey: ["following"] });
    queryClient.invalidateQueries({ queryKey: ["follow-counts"] });
    queryClient.invalidateQueries({ queryKey: ["activity-feed"] });
  };

  const block = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user) throw new Error("Utilisateur non connecté");
      const { error } = await supabase
        .from("blocks")
        .insert({ blocker_id: user.id, blocked_id: targetUserId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const unblock = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user) throw new Error("Utilisateur non connecté");
      const { error } = await supabase
        .from("blocks")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", targetUserId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { block, unblock };
}
