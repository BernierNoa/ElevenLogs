import { useMemo } from "react";
import { useUser } from "@clerk/react-router";
import { useMyLogs } from "./useMyLogs";
import { useCustomLogs } from "./useCustomLogs";
import { useSeasonStats } from "./useSeasonStats";
import { useFollowCounts } from "./useFollowCounts";
import { useLogStreak } from "./useLogStreak";
import { useMyCommentCount } from "./useMyCommentCount";
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

// Toutes les pistes reposent sur des données déjà chargées ailleurs dans
// l'app (logs, stats de saison, compteurs de suivi) — aucune nouvelle
// requête serveur hormis useMyCommentCount, un simple count() groupé.
export function useBadges(): UseBadgesResult {
  const { user } = useUser();
  const { data: myLogs, isLoading: myLogsLoading, isError: myLogsError } = useMyLogs();
  const { data: customLogs, isLoading: customLogsLoading, isError: customLogsError } = useCustomLogs();
  const seasonStats = useSeasonStats();
  const { data: followCounts, isLoading: followCountsLoading, isError: followCountsError } =
    useFollowCounts(user?.id);
  const { bestStreak } = useLogStreak();
  const { data: commentCount, isLoading: commentCountLoading, isError: commentCountError } =
    useMyCommentCount();

  const isLoading =
    myLogsLoading ||
    customLogsLoading ||
    seasonStats.isLoading ||
    followCountsLoading ||
    commentCountLoading;
  const isError =
    myLogsError ||
    customLogsError ||
    seasonStats.isError ||
    followCountsError ||
    commentCountError;

  const badges = useMemo(() => {
    if (isLoading || isError || !myLogs || !customLogs || !followCounts) return [];

    // Dates chronologiques de tous les "vus" (matchs standards + custom
    // logs) : la date de déblocage d'un palier "volume" est la date du
    // N-ième élément de cette liste triée — pas besoin d'endpoint dédié,
    // les deux sources exposent déjà `watched_at`/`watchedAt`.
    const volumeDates = [
      ...[...myLogs.values()].map((l) => l.watched_at),
      ...customLogs.map((c) => c.watchedAt),
    ].sort();

    const motmCount = seasonStats.motmRanking.reduce((sum, r) => sum + r.value, 0);
    const multiplexMax = customLogs.reduce((max, c) => Math.max(max, c.matches.length), 0);

    const currentByTrack: Record<string, number> = {
      volume: volumeDates.length,
      streak: bestStreak,
      continents: seasonStats.continentBreakdown.length,
      competitions: seasonStats.competitionsByCount.length,
      teams: seasonStats.teamsByCount.length,
      followers: followCounts.followers,
      following: followCounts.following,
      motm: motmCount,
      comments: commentCount ?? 0,
      multiplex: multiplexMax,
    };

    return BADGES.map((badge): BadgeProgress => {
      const current = currentByTrack[badge.trackId] ?? 0;
      const unlocked = current >= badge.threshold;
      const unlockedAt =
        badge.trackId === "volume" && unlocked ? volumeDates[badge.threshold - 1] : null;
      return { ...badge, current, unlocked, unlockedAt };
    });
  }, [isLoading, isError, myLogs, customLogs, seasonStats, followCounts, bestStreak, commentCount]);

  return {
    isLoading,
    isError,
    badges,
    unlockedCount: badges.filter((b) => b.unlocked).length,
  };
}
