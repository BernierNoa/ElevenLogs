import { useMemo } from "react";
import { useUser } from "@clerk/react-router";
import { useMyLogs } from "./useMyLogs";
import { useLogsByUserId } from "./useLogsByUserId";
import { useCustomLogs } from "./useCustomLogs";
import { usePublicProfileCustomLogs } from "./usePublicProfileCustomLogs";
import { useSeasonStats } from "./useSeasonStats";
import { useFollowCounts } from "./useFollowCounts";
import { useLogStreak } from "./useLogStreak";
import { useCommentCount } from "./useMyCommentCount";
import { BADGES, type BadgeDefinition } from "../lib/badges";

export interface BadgeProgress extends BadgeDefinition {
  current: number;
  unlocked: boolean;
  /** Uniquement calculable pour la piste "volume" (dates de log connues). */
  unlockedAt: string | null;
}

export interface UseBadgesResult {
  isLoading: boolean;
  isError: boolean;
  badges: BadgeProgress[];
  unlockedCount: number;
}

// Forme minimale commune à CustomLogItem (useCustomLogs) et
// PublicCustomLogItem (usePublicProfileCustomLogs) — les deux seuls champs
// dont ce hook a besoin, pour ne pas dépendre du type complet de l'un ou
// l'autre selon isOwnProfile.
interface CustomLogLike {
  watchedAt: string;
  matches: unknown[];
}

// userId optionnel : par défaut les badges du compte connecté, avec la queue
// offline fusionnée (useMyLogs) et la piste "streak" incluse — si fourni et
// différent du compte connecté (onglet Badges d'un profil public), bascule
// sur les lectures scopées à cet utilisateur (useLogsByUserId /
// usePublicProfileCustomLogs, même contrepartie que useSeasonStats) et
// exclut la piste "streak" : elle dépend de useLogStreak, qui n'a de sens
// que pour le compte courant (même limite que SeasonStatsView, qui ne
// reçoit déjà pas de prop `streak` sur un profil public consulté).
export function useBadges(userId?: string): UseBadgesResult {
  const { user } = useUser();
  const isOwnProfile = !userId || userId === user?.id;
  const targetUserId = userId ?? user?.id;

  const myLogs = useMyLogs();
  const logsByUserId = useLogsByUserId(targetUserId, !isOwnProfile);
  const myCustomLogs = useCustomLogs();
  const publicCustomLogs = usePublicProfileCustomLogs(isOwnProfile ? undefined : targetUserId);
  const seasonStats = useSeasonStats(targetUserId);
  const { data: followCounts, isLoading: followCountsLoading, isError: followCountsError } =
    useFollowCounts(targetUserId);
  const { bestStreak } = useLogStreak();
  const { data: commentCount, isLoading: commentCountLoading, isError: commentCountError } =
    useCommentCount(targetUserId);

  const logsQuery = isOwnProfile ? myLogs : logsByUserId;
  const customLogsQuery = isOwnProfile ? myCustomLogs : publicCustomLogs;

  const isLoading =
    logsQuery.isLoading ||
    customLogsQuery.isLoading ||
    seasonStats.isLoading ||
    followCountsLoading ||
    commentCountLoading;
  const isError =
    logsQuery.isError ||
    customLogsQuery.isError ||
    seasonStats.isError ||
    followCountsError ||
    commentCountError;

  const badges = useMemo(() => {
    const logs = logsQuery.data;
    const customLogs = customLogsQuery.data as CustomLogLike[] | undefined;
    if (isLoading || isError || !logs || !customLogs || !followCounts) return [];

    // Dates chronologiques de tous les "vus" (matchs standards + custom
    // logs) : la date de déblocage d'un palier "volume" est la date du
    // N-ième élément de cette liste triée.
    const volumeDates = [
      ...[...logs.values()].map((l) => l.watched_at),
      ...customLogs.map((c) => c.watchedAt),
    ].sort();

    const motmCount = seasonStats.motmRanking.reduce((sum, r) => sum + r.value, 0);
    const multiplexMax = customLogs.reduce((max, c) => Math.max(max, c.matches.length), 0);

    const currentByTrack: Record<string, number> = {
      volume: volumeDates.length,
      streak: isOwnProfile ? bestStreak : 0,
      continents: seasonStats.continentBreakdown.length,
      competitions: seasonStats.competitionsByCount.length,
      teams: seasonStats.teamsByCount.length,
      followers: followCounts.followers,
      following: followCounts.following,
      motm: motmCount,
      comments: commentCount ?? 0,
      multiplex: multiplexMax,
    };

    return BADGES.filter((b) => isOwnProfile || b.trackId !== "streak").map((badge): BadgeProgress => {
      const current = currentByTrack[badge.trackId] ?? 0;
      const unlocked = current >= badge.threshold;
      const unlockedAt =
        badge.trackId === "volume" && unlocked ? volumeDates[badge.threshold - 1] : null;
      return { ...badge, current, unlocked, unlockedAt };
    });
  }, [
    isLoading,
    isError,
    logsQuery.data,
    customLogsQuery.data,
    seasonStats,
    followCounts,
    bestStreak,
    commentCount,
    isOwnProfile,
  ]);

  return {
    isLoading,
    isError,
    badges,
    unlockedCount: badges.filter((b) => b.unlocked).length,
  };
}
