import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { useSupabaseClient } from "../lib/supabase";
import { showToast } from "../lib/toastStore";
import { COMMENT_TABLE, COMMENT_ID_COLUMN, type CommentTarget } from "../lib/commentMapping";

export function useCommentMutations(target: CommentTarget) {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const queryClient = useQueryClient();

  function invalidate(targetId: string) {
    queryClient.invalidateQueries({ queryKey: ["comments", target, targetId] });
    queryClient.invalidateQueries({ queryKey: ["comment-counts", target] });
  }

  const addComment = useMutation({
    mutationFn: async ({ targetId, body }: { targetId: string; body: string }) => {
      if (!user) throw new Error("Utilisateur non connecté");
      const { error } = await supabase.from(COMMENT_TABLE[target]).insert({
        user_id: user.id,
        [COMMENT_ID_COLUMN[target]]: targetId,
        body,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => invalidate(variables.targetId),
    onError: () => showToast("Impossible d'ajouter le commentaire — réessaie."),
  });

  const deleteComment = useMutation({
    mutationFn: async ({ commentId }: { commentId: string; targetId: string }) => {
      const { error } = await supabase.from(COMMENT_TABLE[target]).delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => invalidate(variables.targetId),
    onError: () => showToast("Impossible de supprimer le commentaire — réessaie."),
  });

  return { addComment, deleteComment };
}
