import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "../lib/supabase";
import {
  COMMENT_TABLE,
  COMMENT_ID_COLUMN,
  mapCommentRow,
  type CommentItem,
  type CommentTarget,
} from "../lib/commentMapping";

const SELECT = "id, user_id, body, created_at, profile:profile_settings(display_name, avatar_url)";

// Détail complet (avec identité de l'auteur) d'un seul avis, chargé
// uniquement quand sa modale de commentaires est ouverte — contrepartie de
// useCommentCounts qui ne renvoie que des totaux pour tous les avis d'une
// page.
export function useComments(target: CommentTarget, targetId: string | null) {
  return useQuery({
    queryKey: ["comments", target, targetId],
    enabled: !!targetId,
    queryFn: async (): Promise<CommentItem[]> => {
      const { data, error } = await supabasePublic
        .from(COMMENT_TABLE[target])
        .select(SELECT)
        .eq(COMMENT_ID_COLUMN[target], targetId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapCommentRow);
    },
  });
}
