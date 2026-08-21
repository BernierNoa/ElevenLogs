import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { useSupabaseClient } from "../lib/supabase";

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  averageRating: number;
  logCount: number;
}

interface RawRatingRow {
  user_id: string;
  rating: number;
  profile: { display_name: string; avatar_url: string | null } | null;
}

// Sous ce seuil, une moyenne n'est pas significative (1 log à 10 = 100%
// "généreux", ça ne veut rien dire) — même logique que
// MIN_APPEARANCES_FOR_RATIO dans useSeasonStats.
const MIN_LOGS_FOR_LEADERBOARD = 3;

// Comptes suivis + soi-même, agrégés en une seule paire de requêtes (logs +
// custom_logs) plutôt qu'un useSeasonStats par ami — RLS filtre déjà
// exactement ce qui est visible (ses propres logs, ou les logs publics des
// comptes suivis dont le profil est public, hors blocage), donc un compte
// suivi au profil privé disparaît simplement du classement plutôt que de
// fausser le calcul.
export function useFriendsLeaderboard(followedIds: string[]) {
  const supabase = useSupabaseClient();
  const { user } = useUser();

  const ids = user?.id
    ? [...new Set([...followedIds, user.id])].sort()
    : [];

  return useQuery({
    queryKey: ["friends-leaderboard", ids],
    enabled: ids.length > 0,
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const [logsRes, customLogsRes] = await Promise.all([
        supabase
          .from("logs")
          .select("user_id, rating, profile:profile_settings(display_name, avatar_url)")
          .in("user_id", ids),
        supabase
          .from("custom_logs")
          .select("user_id, rating, profile:profile_settings(display_name, avatar_url)")
          .in("user_id", ids),
      ]);
      if (logsRes.error) throw logsRes.error;
      if (customLogsRes.error) throw customLogsRes.error;

      const byUser = new Map<
        string,
        { sum: number; count: number; displayName: string; avatarUrl: string | null }
      >();

      for (const row of [
        ...((logsRes.data ?? []) as unknown as RawRatingRow[]),
        ...((customLogsRes.data ?? []) as unknown as RawRatingRow[]),
      ]) {
        const existing = byUser.get(row.user_id);
        if (existing) {
          existing.sum += row.rating;
          existing.count += 1;
        } else {
          byUser.set(row.user_id, {
            sum: row.rating,
            count: 1,
            displayName: row.profile?.display_name ?? "Utilisateur",
            avatarUrl: row.profile?.avatar_url ?? null,
          });
        }
      }

      return [...byUser.entries()]
        .map(([userId, { sum, count, displayName, avatarUrl }]) => ({
          userId,
          displayName,
          avatarUrl,
          averageRating: sum / count,
          logCount: count,
        }))
        .filter((entry) => entry.logCount >= MIN_LOGS_FOR_LEADERBOARD)
        .sort((a, b) => b.averageRating - a.averageRating);
    },
  });
}
