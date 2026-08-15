import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "../lib/supabase";
import { COMMENT_TABLE, COMMENT_ID_COLUMN, type CommentTarget } from "../lib/commentMapping";

// Un seul appel groupé pour tous les avis affichés sur la page plutôt qu'une
// requête par carte — même logique que useLogLikes. Ne récupère que la
// colonne de rattachement (pas le corps du commentaire) : ces pages n'ont
// besoin que du total, le détail est chargé à la demande par CommentsModal.
export function useCommentCounts(target: CommentTarget, ids: string[]) {
  const idColumn = COMMENT_ID_COLUMN[target];
  const key = [...ids].sort().join(",");

  return useQuery({
    queryKey: ["comment-counts", target, key],
    enabled: ids.length > 0,
    queryFn: async (): Promise<Map<string, number>> => {
      const { data, error } = await supabasePublic
        .from(COMMENT_TABLE[target])
        .select(idColumn)
        .in(idColumn, ids);
      if (error) throw error;

      const result = new Map<string, number>();
      for (const id of ids) result.set(id, 0);
      for (const row of (data ?? []) as Record<string, string>[]) {
        const rowId = row[idColumn];
        result.set(rowId, (result.get(rowId) ?? 0) + 1);
      }
      return result;
    },
  });
}
