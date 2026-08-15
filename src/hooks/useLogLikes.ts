import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { supabasePublic } from "../lib/supabase";

export interface LogLikeInfo {
  count: number;
  likedByMe: boolean;
}

// Un seul appel groupé pour tous les logs affichés sur la page plutôt qu'une
// requête par carte — même logique que useCommunityAverages. RLS filtre déjà
// aux likes des logs visibles (client anonyme suffisant pour les comptes),
// la question "aimé par moi ?" a en plus besoin de l'identité courante.
export function useLogLikes(logIds: string[]) {
  const { user } = useUser();
  const key = [...logIds].sort().join(",");

  return useQuery({
    queryKey: ["log-likes", key, user?.id],
    enabled: logIds.length > 0,
    queryFn: async (): Promise<Map<string, LogLikeInfo>> => {
      const { data, error } = await supabasePublic
        .from("log_likes")
        .select("log_id, user_id")
        .in("log_id", logIds);
      if (error) throw error;

      const result = new Map<string, LogLikeInfo>();
      for (const id of logIds) result.set(id, { count: 0, likedByMe: false });

      for (const row of data ?? []) {
        const entry = result.get(row.log_id);
        if (!entry) continue;
        entry.count += 1;
        if (user && row.user_id === user.id) entry.likedByMe = true;
      }

      return result;
    },
  });
}
