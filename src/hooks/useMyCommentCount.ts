import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "../lib/supabase";

// Compte groupé (head: true, pas de lignes récupérées) sur les deux tables
// de commentaires — pour le badge "implication", peu importe le compte
// (le sien ou un profil public consulté) : supabasePublic + RLS filtrent
// déjà correctement selon qui regarde (cf. policies SELECT de
// log_comments/custom_log_comments, scopées à la visibilité du log visé).
export function useCommentCount(userId: string | undefined) {
  return useQuery({
    queryKey: ["comment-count", userId],
    enabled: !!userId,
    queryFn: async (): Promise<number> => {
      const [logComments, customLogComments] = await Promise.all([
        supabasePublic
          .from("log_comments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId!),
        supabasePublic
          .from("custom_log_comments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId!),
      ]);
      if (logComments.error) throw logComments.error;
      if (customLogComments.error) throw customLogComments.error;
      return (logComments.count ?? 0) + (customLogComments.count ?? 0);
    },
  });
}
