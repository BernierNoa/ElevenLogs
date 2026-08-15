import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { useSupabaseClient } from "../lib/supabase";
import { showToast } from "../lib/toastStore";

// Le delete cascade sur custom_matches (FK on delete cascade) : pas besoin
// de supprimer les enfants explicitement ici.
export function useDeleteCustomLog() {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (customLogId: string) => {
      const { error } = await supabase
        .from("custom_logs")
        .delete()
        .eq("id", customLogId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-logs", user?.id] });
      showToast("Revue supprimée");
    },
    onError: (_err, customLogId) => {
      showToast("La suppression a échoué.", {
        label: "Réessayer",
        onClick: () => mutation.mutate(customLogId),
      });
    },
  });

  return mutation;
}
