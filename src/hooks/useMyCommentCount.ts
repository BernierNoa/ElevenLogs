import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { supabasePublic } from "../lib/supabase";

// Compte groupé (head: true, pas de lignes récupérées) sur les deux tables
// de commentaires — uniquement pour le badge "implication", pas besoin du
// contenu des commentaires eux-mêmes.
export function useMyCommentCount() {
  const { user } = useUser();

  return useQuery({
    queryKey: ["my-comment-count", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<number> => {
      const [logComments, customLogComments] = await Promise.all([
        supabasePublic
          .from("log_comments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id),
        supabasePublic
          .from("custom_log_comments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id),
      ]);
      if (logComments.error) throw logComments.error;
      if (customLogComments.error) throw customLogComments.error;
      return (logComments.count ?? 0) + (customLogComments.count ?? 0);
    },
  });
}
