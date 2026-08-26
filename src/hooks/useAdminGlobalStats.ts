import { useQuery } from "@tanstack/react-query";
import { useSupabaseClient } from "../lib/supabase";

export interface AdminLeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  matchesThisWeek: number;
  avgRatingThisWeek: number;
  /** Joueur le plus souvent élu homme du match par cet utilisateur, tout
   * historique confondu — un seul log dans la semaine ne suffirait pas à
   * dégager un vrai "préféré". null s'il n'a jamais désigné de MOTM. */
  favoriteMotmName: string | null;
}

export interface AdminGlobalStats {
  totalUsers: number;
  activeUsersThisWeek: number;
  totalMatchesLogged: number;
  matchesThisWeek: number;
  globalAverageRating: number | null;
  weeklyLeaderboard: AdminLeaderboardEntry[];
}

interface RatingRow {
  user_id: string;
  rating: number;
  created_at: string;
}

interface LogRow extends RatingRow {
  motm_player_id: string | null;
  motm: { full_name: string } | null;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const LEADERBOARD_SIZE = 10;

// Page dédiée à l'onglet Admin > Stats — séparée de useAdminStats (Vue
// d'ensemble/Utilisateurs) pour ne pas alourdir un hook déjà volumineux
// avec des besoins différents (classement, agrégats sur custom_logs).
//
// `logs` a une policy admin "tout lire" depuis add_admin_access.sql ;
// `custom_logs` ne l'a eue qu'à partir de add_admin_custom_logs_access.sql
// (2026-08-26) — sans cette dernière migration appliquée, les totaux
// sous-comptent silencieusement les custom logs des profils privés.
export function useAdminGlobalStats() {
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ["admin-global-stats"],
    queryFn: async (): Promise<AdminGlobalStats> => {
      const [profilesRes, logsRes, customLogsRes] = await Promise.all([
        supabase.from("profile_settings").select("user_id, display_name, avatar_url"),
        supabase
          .from("logs")
          .select("user_id, rating, created_at, motm_player_id, motm:players(full_name)"),
        supabase.from("custom_logs").select("user_id, rating, created_at"),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (logsRes.error) throw logsRes.error;
      if (customLogsRes.error) throw customLogsRes.error;

      const profiles = profilesRes.data ?? [];
      const logs = (logsRes.data ?? []) as unknown as LogRow[];
      const customLogs = (customLogsRes.data ?? []) as unknown as RatingRow[];

      const profileById = new Map(profiles.map((p) => [p.user_id, p]));
      const weekAgo = Date.now() - WEEK_MS;

      let totalRatingSum = 0;
      let totalRatingCount = 0;

      const motmCountsByUser = new Map<string, Map<string, { name: string; count: number }>>();
      const weeklyByUser = new Map<string, { count: number; sum: number }>();
      const activeThisWeek = new Set<string>();

      function accumulateRating(row: RatingRow) {
        totalRatingSum += row.rating;
        totalRatingCount += 1;
        if (new Date(row.created_at).getTime() >= weekAgo) {
          const entry = weeklyByUser.get(row.user_id) ?? { count: 0, sum: 0 };
          entry.count += 1;
          entry.sum += row.rating;
          weeklyByUser.set(row.user_id, entry);
          activeThisWeek.add(row.user_id);
        }
      }

      for (const log of logs) {
        accumulateRating(log);
        if (log.motm_player_id && log.motm?.full_name) {
          const perUser = motmCountsByUser.get(log.user_id) ?? new Map();
          const existing = perUser.get(log.motm_player_id);
          if (existing) existing.count += 1;
          else perUser.set(log.motm_player_id, { name: log.motm.full_name, count: 1 });
          motmCountsByUser.set(log.user_id, perUser);
        }
      }
      for (const customLog of customLogs) accumulateRating(customLog);

      function favoriteMotmFor(userId: string): string | null {
        const perUser = motmCountsByUser.get(userId);
        if (!perUser || perUser.size === 0) return null;
        return [...perUser.values()].sort((a, b) => b.count - a.count)[0].name;
      }

      const weeklyLeaderboard: AdminLeaderboardEntry[] = [...weeklyByUser.entries()]
        .map(([userId, { count, sum }]) => {
          const profile = profileById.get(userId);
          return {
            userId,
            displayName: profile?.display_name ?? "Utilisateur",
            avatarUrl: profile?.avatar_url ?? null,
            matchesThisWeek: count,
            avgRatingThisWeek: sum / count,
            favoriteMotmName: favoriteMotmFor(userId),
          };
        })
        .sort((a, b) => b.matchesThisWeek - a.matchesThisWeek)
        .slice(0, LEADERBOARD_SIZE);

      return {
        totalUsers: profiles.length,
        activeUsersThisWeek: activeThisWeek.size,
        totalMatchesLogged: logs.length + customLogs.length,
        matchesThisWeek: [...weeklyByUser.values()].reduce((sum, v) => sum + v.count, 0),
        globalAverageRating: totalRatingCount > 0 ? totalRatingSum / totalRatingCount : null,
        weeklyLeaderboard,
      };
    },
  });
}
