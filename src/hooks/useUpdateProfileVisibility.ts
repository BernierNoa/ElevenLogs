import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { useSupabaseClient } from "../lib/supabase";

// La policy RLS update sur profile_settings autorise déjà toute colonne de
// sa propre ligne — ProfileSync évite juste ce champ à chaque login pour ne
// pas écraser le choix de l'utilisateur (cf. son commentaire). Ce hook est
// le seul endroit qui l'écrit, sur action explicite.
export function useUpdateProfileVisibility() {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (visibility: "public" | "private") => {
      if (!user) throw new Error("Utilisateur non connecté");
      const { error } = await supabase
        .from("profile_settings")
        .update({ profile_visibility: visibility })
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-settings"] });
    },
  });
}
