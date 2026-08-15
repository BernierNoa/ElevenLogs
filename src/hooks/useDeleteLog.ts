import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { useSupabaseClient } from "../lib/supabase";
import { showToast } from "../lib/toastStore";

export function useDeleteLog() {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase.from("logs").delete().eq("id", logId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-logs", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["community-averages"] });
      queryClient.invalidateQueries({ queryKey: ["public-profile-logs", user?.id] });
      showToast("Log supprimé");
    },

    onError: () => {
      showToast("La suppression a échoué, réessaie");
    },
  });
}
