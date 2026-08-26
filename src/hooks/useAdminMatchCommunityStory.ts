import { useQuery } from "@tanstack/react-query";
import { useSupabaseClient, supabasePublic } from "../lib/supabase";

export interface AdminCommunityStory {
  averageRating: number | null;
  reviewCount: number;
  topMotmName: string | null;
  topComment: { body: string; authorName: string } | null;
}

interface LogRow {
  id: string;
  rating: number;
  comment: string | null;
  motm_player_id: string | null;
  motm: { full_name: string } | null;
  profile: { display_name: string } | null;
}

// Récap communautaire d'un match pour la story admin (cf.
// AdminStoryGenerator) — distinct d'un log personnel : la note et le MVP
// sont des moyennes/majorités sur tous les avis du match, le commentaire
// mis en avant est celui qui a reçu le plus de likes (avec son auteur).
//
// `logs` a une policy admin "tout lire" (add_admin_access.sql) : la requête
// principale utilise donc le client authentifié pour voir aussi les avis
// des profils privés. Les compteurs de likes, eux, passent par
// supabasePublic (comme useLogLikes) et restent donc scopés à la
// visibilité RLS normale — un avis populaire d'un profil privé pourrait
// être sous-compté ici. Acceptable pour un outil qui choisit "un bon
// commentaire à mettre en avant", pas une statistique qui doit être exacte
// au like près.
export function useAdminMatchCommunityStory(matchId: string | null) {
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ["admin-match-community-story", matchId],
    enabled: !!matchId,
    queryFn: async (): Promise<AdminCommunityStory> => {
      const { data, error } = await supabase
        .from("logs")
        .select(
          "id, rating, comment, motm_player_id, motm:players(full_name), profile:profile_settings(display_name)",
        )
        .eq("match_id", matchId!);
      if (error) throw error;

      const logs = (data ?? []) as unknown as LogRow[];
      if (logs.length === 0) {
        return { averageRating: null, reviewCount: 0, topMotmName: null, topComment: null };
      }

      const averageRating = logs.reduce((sum, l) => sum + l.rating, 0) / logs.length;

      const motmCounts = new Map<string, { name: string; count: number }>();
      for (const log of logs) {
        if (!log.motm_player_id || !log.motm?.full_name) continue;
        const existing = motmCounts.get(log.motm_player_id);
        if (existing) existing.count += 1;
        else motmCounts.set(log.motm_player_id, { name: log.motm.full_name, count: 1 });
      }
      const topMotmName =
        [...motmCounts.values()].sort((a, b) => b.count - a.count)[0]?.name ?? null;

      const logsWithComment = logs.filter(
        (l): l is LogRow & { comment: string } => !!l.comment && l.comment.trim().length > 0,
      );

      let topComment: AdminCommunityStory["topComment"] = null;
      if (logsWithComment.length > 0) {
        const ids = logsWithComment.map((l) => l.id);
        const { data: likeRows, error: likesError } = await supabasePublic
          .from("log_likes")
          .select("log_id")
          .in("log_id", ids);
        if (likesError) throw likesError;

        const likeCounts = new Map<string, number>();
        for (const row of likeRows ?? []) {
          likeCounts.set(row.log_id, (likeCounts.get(row.log_id) ?? 0) + 1);
        }

        const best = [...logsWithComment].sort(
          (a, b) => (likeCounts.get(b.id) ?? 0) - (likeCounts.get(a.id) ?? 0),
        )[0];
        topComment = {
          body: best.comment,
          authorName: best.profile?.display_name ?? "Utilisateur",
        };
      }

      return { averageRating, reviewCount: logs.length, topMotmName, topComment };
    },
  });
}
