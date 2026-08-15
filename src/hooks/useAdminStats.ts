import { useQuery } from "@tanstack/react-query";
import { useSupabaseClient } from "../lib/supabase";

export interface AdminUserRow {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  profileVisibility: string;
  createdAt: string;
  logsCount: number;
  avgRating: number | null;
  lastLogAt: string | null;
  bannedAt: string | null;
  suspendedUntil: string | null;
}

export interface DailyBucket {
  date: string;
  count: number;
}

export interface AdminStats {
  totalUsers: number;
  newUsersToday: number;
  activeUsersToday: number;
  logsToday: number;
  logsTotal: number;
  /** % d'évolution des logs des 7 derniers jours vs les 7 jours précédents,
   * null si les 7 jours précédents n'ont aucun log (division par zéro évitée
   * plutôt que d'afficher un pourcentage infini/trompeur). */
  logsTrendPct: number | null;
  logsLast30Days: DailyBucket[];
  /** % de comptes créés il y a au moins 14 jours ayant loggé au moins une
   * fois entre J+7 et J+14 après leur inscription — null si aucun compte
   * n'a encore atteint cette ancienneté. */
  retentionD7Pct: number | null;
  publicProfilesCount: number;
  privateProfilesCount: number;
  users: AdminUserRow[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

// Réservé à l'admin : la lecture complète de `logs` (tous utilisateurs, y
// compris privés) dépend de la policy RLS additive posée pour ce compte —
// un autre utilisateur obtiendrait exactement les mêmes résultats que
// useMyLogs (rien de plus), RLS filtrant silencieusement le reste.
export function useAdminStats() {
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async (): Promise<AdminStats> => {
      const [profilesRes, logsRes] = await Promise.all([
        supabase
          .from("profile_settings")
          .select(
            "user_id, display_name, avatar_url, profile_visibility, created_at, banned_at, suspended_until",
          ),
        supabase.from("logs").select("user_id, rating, created_at"),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (logsRes.error) throw logsRes.error;

      const profiles = profilesRes.data ?? [];
      const logs = logsRes.data ?? [];
      const now = Date.now();
      const todayIso = startOfTodayIso();

      const logsByUser = new Map<
        string,
        { count: number; sum: number; lastAt: string }
      >();
      let logsToday = 0;
      const last30Buckets = new Map<string, number>();
      for (let i = 29; i >= 0; i--) {
        const key = dayKey(new Date(now - i * MS_PER_DAY).toISOString());
        last30Buckets.set(key, 0);
      }

      let last7Count = 0;
      let prev7Count = 0;

      for (const log of logs) {
        const entry = logsByUser.get(log.user_id) ?? {
          count: 0,
          sum: 0,
          lastAt: log.created_at,
        };
        entry.count += 1;
        entry.sum += log.rating;
        if (log.created_at > entry.lastAt) entry.lastAt = log.created_at;
        logsByUser.set(log.user_id, entry);
        if (log.created_at >= todayIso) logsToday += 1;

        const bucketKey = dayKey(log.created_at);
        if (last30Buckets.has(bucketKey)) {
          last30Buckets.set(bucketKey, (last30Buckets.get(bucketKey) ?? 0) + 1);
        }

        const ageMs = now - new Date(log.created_at).getTime();
        if (ageMs >= 0 && ageMs < 7 * MS_PER_DAY) last7Count += 1;
        else if (ageMs >= 7 * MS_PER_DAY && ageMs < 14 * MS_PER_DAY) prev7Count += 1;
      }

      const logsTrendPct =
        prev7Count === 0 ? null : Math.round(((last7Count - prev7Count) / prev7Count) * 100);

      const logsLast30Days: DailyBucket[] = [...last30Buckets.entries()].map(
        ([date, count]) => ({ date, count }),
      );

      const activeUsersToday = new Set(
        logs.filter((l) => l.created_at >= todayIso).map((l) => l.user_id),
      ).size;

      const newUsersToday = profiles.filter((p) => p.created_at >= todayIso).length;

      // Rétention J+7 : sur les comptes assez anciens pour que la fenêtre
      // [J+7, J+14] soit déjà entièrement passée (sinon on sous-estimerait
      // le taux avec des comptes encore "en cours d'évaluation").
      let cohortEligible = 0;
      let cohortRetained = 0;
      for (const p of profiles) {
        const signupMs = new Date(p.created_at).getTime();
        const ageMs = now - signupMs;
        if (ageMs < 14 * MS_PER_DAY) continue;
        cohortEligible += 1;
        const entry = logsByUser.get(p.user_id);
        if (!entry) continue;
        const lastLogMs = new Date(entry.lastAt).getTime();
        // On ne connaît que le DERNIER log par utilisateur ici, pas tout
        // l'historique par date — un dernier log dans la fenêtre suffit à
        // prouver un retour, mais un utilisateur retenu plus tôt puis parti
        // ne compte pas comme retenu (sous-estimation assumée, pas de
        // fausse détection de rétention).
        if (lastLogMs >= signupMs + 7 * MS_PER_DAY && lastLogMs < signupMs + 14 * MS_PER_DAY) {
          cohortRetained += 1;
        }
      }
      const retentionD7Pct =
        cohortEligible === 0 ? null : Math.round((cohortRetained / cohortEligible) * 100);

      const publicProfilesCount = profiles.filter(
        (p) => p.profile_visibility === "public",
      ).length;
      const privateProfilesCount = profiles.length - publicProfilesCount;

      const users: AdminUserRow[] = profiles
        .map((p) => {
          const entry = logsByUser.get(p.user_id);
          return {
            userId: p.user_id,
            displayName: p.display_name,
            avatarUrl: p.avatar_url,
            profileVisibility: p.profile_visibility,
            createdAt: p.created_at,
            logsCount: entry?.count ?? 0,
            avgRating: entry ? entry.sum / entry.count : null,
            lastLogAt: entry?.lastAt ?? null,
            bannedAt: p.banned_at,
            suspendedUntil: p.suspended_until,
          };
        })
        .sort((a, b) => b.logsCount - a.logsCount);

      return {
        totalUsers: profiles.length,
        newUsersToday,
        activeUsersToday,
        logsToday,
        logsTotal: logs.length,
        logsTrendPct,
        logsLast30Days,
        retentionD7Pct,
        publicProfilesCount,
        privateProfilesCount,
        users,
      };
    },
  });
}
