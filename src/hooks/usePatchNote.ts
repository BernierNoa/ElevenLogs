import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { useSupabaseClient } from "../lib/supabase";

// Paramétré par `version` (plutôt que hardcodé) pour rester réutilisable par
// toutes les prochaines patch notes sans modification.
export function usePatchNoteSeen(version: string) {
  const supabase = useSupabaseClient();
  const { user, isLoaded, isSignedIn } = useUser();

  return useQuery({
    queryKey: ["patch-note-seen", user?.id, version],
    enabled: isLoaded && !!isSignedIn,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from("patch_note_views")
        .select("version")
        .eq("user_id", user!.id)
        .eq("version", version)
        .maybeSingle();
      if (error) throw error;
      return data !== null;
    },
  });
}

export function useMarkPatchNoteSeen() {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (version: string) => {
      if (!user) return;
      // upsert + ignoreDuplicates : un double clic ou un retry ne doit
      // jamais faire échouer l'action ni afficher d'erreur à l'utilisateur.
      const { error } = await supabase
        .from("patch_note_views")
        .upsert(
          { user_id: user.id, version },
          { onConflict: "user_id,version", ignoreDuplicates: true },
        );
      if (error) throw error;
    },
    onSuccess: (_data, version) => {
      queryClient.invalidateQueries({ queryKey: ["patch-note-seen", user?.id, version] });
    },
  });
}
