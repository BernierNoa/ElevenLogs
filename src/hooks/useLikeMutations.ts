import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { useSupabaseClient } from "../lib/supabase";
import { showToast } from "../lib/toastStore";
import type { LogLikeInfo } from "./useLogLikes";

interface MutationContext {
  previous: Array<[QueryKey, Map<string, LogLikeInfo> | undefined]>;
}

export function useLikeMutations() {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["log-likes"] });
  };

  // Le cœur bascule au clic, avant de savoir si l'appel réseau aboutit —
  // toutes les requêtes ["log-likes"] en cache sont mises à jour (plusieurs
  // pages peuvent en garder une chacune avec des sous-ensembles de logs
  // différents). En cas d'échec, rollback vers le snapshot pris juste avant.
  const like = useMutation<void, Error, string, MutationContext>({
    mutationFn: async (logId: string) => {
      if (!user) throw new Error("Utilisateur non connecté");
      const { error } = await supabase
        .from("log_likes")
        .insert({ user_id: user.id, log_id: logId });
      if (error) throw error;
    },
    onMutate: async (logId) => {
      await queryClient.cancelQueries({ queryKey: ["log-likes"] });
      const previous =
        queryClient.getQueriesData<Map<string, LogLikeInfo>>({ queryKey: ["log-likes"] });

      queryClient.setQueriesData<Map<string, LogLikeInfo>>({ queryKey: ["log-likes"] }, (old) => {
        const entry = old?.get(logId);
        if (!old || !entry) return old;
        const next = new Map(old);
        next.set(logId, { count: entry.count + 1, likedByMe: true });
        return next;
      });

      return { previous };
    },
    onError: (_err, _logId, context) => {
      for (const [queryKey, data] of context?.previous ?? []) {
        queryClient.setQueryData(queryKey, data);
      }
      showToast("Impossible d'ajouter le like — réessaie.");
    },
    onSettled: invalidate,
  });

  const unlike = useMutation<void, Error, string, MutationContext>({
    mutationFn: async (logId: string) => {
      if (!user) throw new Error("Utilisateur non connecté");
      const { error } = await supabase
        .from("log_likes")
        .delete()
        .eq("log_id", logId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onMutate: async (logId) => {
      await queryClient.cancelQueries({ queryKey: ["log-likes"] });
      const previous =
        queryClient.getQueriesData<Map<string, LogLikeInfo>>({ queryKey: ["log-likes"] });

      queryClient.setQueriesData<Map<string, LogLikeInfo>>({ queryKey: ["log-likes"] }, (old) => {
        const entry = old?.get(logId);
        if (!old || !entry) return old;
        const next = new Map(old);
        next.set(logId, { count: Math.max(0, entry.count - 1), likedByMe: false });
        return next;
      });

      return { previous };
    },
    onError: (_err, _logId, context) => {
      for (const [queryKey, data] of context?.previous ?? []) {
        queryClient.setQueryData(queryKey, data);
      }
      showToast("Impossible de retirer le like — réessaie.");
    },
    onSettled: invalidate,
  });

  return { like, unlike };
}
