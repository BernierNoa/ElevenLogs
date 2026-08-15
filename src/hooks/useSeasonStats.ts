import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react-router";
import { supabasePublic } from "../lib/supabase";
import { useMatches, type MatchListItem } from "./useMatches";
import { useMyLogs, type LogItem } from "./useMyLogs";
import { useLogsByUserId } from "./useLogsByUserId";
import { useCustomLogs, type CustomLogItem } from "./useCustomLogs";
import { usePublicProfileCustomLogs } from "./usePublicProfileCustomLogs";
import { continentOf, CONTINENT_LABELS } from "../lib/continents";

export interface LoggedMatch {
  match: MatchListItem;
  log: LogItem;
}

export interface RankedItem {
  key: string;
  label: string;
  value: number;
}

// Fusion de deux métriques par entité (compétition/équipe) plutôt que deux
// RankedItem[] séparés qui dupliquaient les mêmes noms côte à côte — trié
// par `count` (le "les plus regardées" d'origine), `average` juste affiché.
export interface DualMetricItem {
  key: string;
  label: string;
  count: number;
  average: number;
}

export interface RatingTrendPoint {
  key: string;
  label: string;
  average: number;
  count: number;
}

// Sous ce seuil d'apparitions dans tes matchs logués, un ratio MVP/vus n'est
// pas significatif (1 apparition + 1 MVP = 100%, ça ne veut rien dire).
const MIN_APPEARANCES_FOR_RATIO = 3;
const MIN_APPEARANCES_FOR_TEAM_RATIO = 2;
const RANKING_LIMIT = 20;
const RATIO_RANKING_LIMIT = 5;
const SCORELINE_RANKING_LIMIT = 5;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const WEEKDAY_LABELS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

export interface BiggestScoreMatch {
  label: string;
  competitionName: string;
  totalGoals: number;
}

interface LineupPlayerRow {
  player: { id: string; full_name: string } | null;
}

// userId optionnel : par défaut les stats du compte connecté (Ta saison),
// avec la queue offline fusionnée (useMyLogs) — si fourni et différent du
// compte connecté (onglet Stats d'un profil public), bascule sur les
// lectures scopées à cet utilisateur (useLogsByUserId /
// usePublicProfileCustomLogs), sans queue offline qui n'a de sens que pour
// le compte courant. Les deux couples de hooks sont toujours appelés (règle
// des hooks), seul celui pertinent est activé/utilisé.
export function useSeasonStats(userId?: string) {
  const { user } = useUser();
  const isOwnProfile = !userId || userId === user?.id;

  const {
    data: matches,
    isLoading: matchesLoading,
    isError: matchesError,
    refetch: refetchMatches,
  } = useMatches();

  const {
    data: ownLogs,
    isLoading: ownLogsLoading,
    isError: ownLogsError,
    refetch: refetchOwnLogs,
  } = useMyLogs();
  const {
    data: otherLogs,
    isLoading: otherLogsLoading,
    isError: otherLogsError,
    refetch: refetchOtherLogs,
  } = useLogsByUserId(userId, !isOwnProfile);
  const myLogs = isOwnProfile ? ownLogs : otherLogs;
  const logsLoading = isOwnProfile ? ownLogsLoading : otherLogsLoading;
  const logsError = isOwnProfile ? ownLogsError : otherLogsError;
  const refetchMyLogs = isOwnProfile ? refetchOwnLogs : refetchOtherLogs;

  const {
    data: ownCustomLogs,
    isLoading: ownCustomLogsLoading,
    isError: ownCustomLogsError,
    refetch: refetchOwnCustomLogs,
  } = useCustomLogs();
  const {
    data: otherCustomLogs,
    isLoading: otherCustomLogsLoading,
    isError: otherCustomLogsError,
    refetch: refetchOtherCustomLogs,
  } = usePublicProfileCustomLogs(isOwnProfile ? undefined : userId);
  const customLogs: CustomLogItem[] | undefined = isOwnProfile ? ownCustomLogs : otherCustomLogs;
  const customLogsLoading = isOwnProfile ? ownCustomLogsLoading : otherCustomLogsLoading;
  const customLogsError = isOwnProfile ? ownCustomLogsError : otherCustomLogsError;
  const refetchCustomLogs = isOwnProfile ? refetchOwnCustomLogs : refetchOtherCustomLogs;

  const loggedMatches: LoggedMatch[] = useMemo(() => {
    if (!matches || !myLogs) return [];
    const result: LoggedMatch[] = [];
    for (const match of matches) {
      const log = myLogs.get(match.id);
      if (log) result.push({ match, log });
    }
    return result;
  }, [matches, myLogs]);

  const matchIdsKey = useMemo(
    () => loggedMatches.map((lm) => lm.match.id).sort().join(","),
    [loggedMatches],
  );

  // Une seule requête groupée pour tous les matchs logués plutôt qu'une
  // requête par match : sert à la fois "joueurs les plus vus" (tous les
  // joueurs des lineups) et les noms MOTM (le joueur élu fait partie du
  // même lineup, pas besoin d'une requête séparée sur `players`).
  const {
    data: lineupRows,
    isLoading: lineupsLoading,
    isError: lineupsError,
    refetch: refetchLineups,
  } = useQuery({
    queryKey: ["season-lineups", matchIdsKey],
    enabled: loggedMatches.length > 0,
    queryFn: async (): Promise<LineupPlayerRow[]> => {
      const matchIds = matchIdsKey.split(",").filter(Boolean);
      const { data, error } = await supabasePublic
        .from("lineups")
        .select("player:players(id, full_name)")
        .in("match_id", matchIds);
      if (error) throw error;
      return (data ?? []) as unknown as LineupPlayerRow[];
    },
  });

  const stats = useMemo(() => {
    const matchsVusStandard = loggedMatches.length;
    const customLogsList = customLogs ?? [];
    const matchsVus = matchsVusStandard + customLogsList.length;
    const allRatings = [
      ...loggedMatches.map((lm) => lm.log.rating),
      ...customLogsList.map((c) => c.rating),
    ];
    const noteMoyenne =
      allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
        : null;

    const now = new Date();
    const todayUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const start14Utc = new Date(todayUtc);
    // 14 derniers jours (inclus) = today - 13
    start14Utc.setUTCDate(start14Utc.getUTCDate() - 13);
    const startPrev14Utc = new Date(start14Utc);
    startPrev14Utc.setUTCDate(startPrev14Utc.getUTCDate() - 14);

    const allRatedEntries = [
      ...loggedMatches.map((lm) => ({
        rating: lm.log.rating,
        createdAt: lm.log.watched_at,
      })),
      ...customLogsList.map((c) => ({
        rating: c.rating,
        createdAt: c.watchedAt,
      })),
    ];

    const last14Entries = allRatedEntries.filter((e) => {
      const d = new Date(e.createdAt);
      return d >= start14Utc && d <= todayUtc;
    });

    const prev14Entries = allRatedEntries.filter((e) => {
      const d = new Date(e.createdAt);
      return d >= startPrev14Utc && d < start14Utc;
    });

    const logsLast14Days = last14Entries.length;
    const noteMoyenneLast14Days =
      logsLast14Days > 0
        ? last14Entries.reduce((sum, e) => sum + e.rating, 0) / logsLast14Days
        : null;
    const bestNoteLast14Days =
      logsLast14Days > 0 ? Math.max(...last14Entries.map((e) => e.rating)) : null;
    const worstNoteLast14Days =
      logsLast14Days > 0 ? Math.min(...last14Entries.map((e) => e.rating)) : null;

    const noteMoyennePrev14Days =
      prev14Entries.length > 0
        ? prev14Entries.reduce((sum, e) => sum + e.rating, 0) /
          prev14Entries.length
        : null;

    const noteEvolutionLast14Days =
      noteMoyenneLast14Days !== null && noteMoyennePrev14Days !== null
        ? noteMoyenneLast14Days - noteMoyennePrev14Days
        : null;

    const logsPrev14Days = prev14Entries.length;

    // Évolution de la moyenne dans le temps : semaine par semaine si les
    // logs s'étalent sur moins de 12 semaines, mois par mois au-delà — sinon
    // un graphique hebdo sur une longue saison devient illisible (trop de
    // points). Bucket par lundi de la semaine (comme useWeeklyStreak) pour
    // rester cohérent avec le reste de l'app.
    const entryTimes = allRatedEntries.map((e) => new Date(e.createdAt).getTime());
    const spanDays =
      entryTimes.length > 0
        ? (Math.max(...entryTimes) - Math.min(...entryTimes)) / MS_PER_DAY
        : 0;
    const useMonthlyBuckets = spanDays > 84;

    function mondayOf(date: Date): Date {
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      return d;
    }

    const trendBuckets = new Map<string, { label: string; sum: number; count: number }>();
    for (const e of allRatedEntries) {
      const d = new Date(e.createdAt);
      let key: string;
      let label: string;
      if (useMonthlyBuckets) {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        label = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(d);
      } else {
        const monday = mondayOf(d);
        key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
        label = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(
          monday,
        );
      }
      const entry = trendBuckets.get(key) ?? { label, sum: 0, count: 0 };
      entry.sum += e.rating;
      entry.count += 1;
      trendBuckets.set(key, entry);
    }
    const ratingTrend: RatingTrendPoint[] = [...trendBuckets.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, { label, sum, count }]) => ({ key, label, average: sum / count, count }));

    const customLogsSorted = [...customLogsList].sort((a, b) => b.rating - a.rating);
    const customLogsTop3 = customLogsSorted.slice(0, 3);
    const customLogsFlop3 = [...customLogsSorted].slice(-3).reverse();

    const competitionCounts = new Map<string, number>();
    for (const lm of loggedMatches) {
      const name = lm.match.competition?.name;
      if (!name) continue;
      competitionCounts.set(name, (competitionCounts.get(name) ?? 0) + 1);
    }
    const competitionPlusRegardee =
      [...competitionCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const continentCounts = new Map<string, number>();
    for (const lm of loggedMatches) {
      const continent = continentOf(lm.match.competition?.country ?? null);
      const label = continent ? CONTINENT_LABELS[continent] : "Autres";
      continentCounts.set(label, (continentCounts.get(label) ?? 0) + 1);
    }
    const continentBreakdown: RankedItem[] = [...continentCounts.entries()]
      .map(([label, count]) => ({ key: label, label, value: count }))
      .sort((a, b) => b.value - a.value);

    const matchesWithScore = loggedMatches.filter(
      (lm) => lm.match.home_score !== null && lm.match.away_score !== null,
    );
    const totalGoals = matchesWithScore.reduce(
      (sum, lm) => sum + (lm.match.home_score ?? 0) + (lm.match.away_score ?? 0),
      0,
    );
    const avgGoalsPerMatch =
      matchesWithScore.length > 0 ? totalGoals / matchesWithScore.length : null;

    // Même fenêtres 14j que noteMoyenneLast14Days/Prev14Days, appliquées aux
    // matchs avec score plutôt qu'aux notes — pour la tendance "buts/match".
    const matchesWithScoreLast14 = matchesWithScore.filter((lm) => {
      const d = new Date(lm.log.watched_at);
      return d >= start14Utc && d <= todayUtc;
    });
    const matchesWithScorePrev14 = matchesWithScore.filter((lm) => {
      const d = new Date(lm.log.watched_at);
      return d >= startPrev14Utc && d < start14Utc;
    });
    const avgGoalsPerMatchLast14Days =
      matchesWithScoreLast14.length > 0
        ? matchesWithScoreLast14.reduce(
            (sum, lm) => sum + (lm.match.home_score ?? 0) + (lm.match.away_score ?? 0),
            0,
          ) / matchesWithScoreLast14.length
        : null;
    const avgGoalsPerMatchPrev14Days =
      matchesWithScorePrev14.length > 0
        ? matchesWithScorePrev14.reduce(
            (sum, lm) => sum + (lm.match.home_score ?? 0) + (lm.match.away_score ?? 0),
            0,
          ) / matchesWithScorePrev14.length
        : null;

    const biggestScoreMatch: BiggestScoreMatch | null = matchesWithScore.reduce<
      BiggestScoreMatch | null
    >((best, lm) => {
      const goals = (lm.match.home_score ?? 0) + (lm.match.away_score ?? 0);
      if (best && goals <= best.totalGoals) return best;
      return {
        label: `${lm.match.home_team?.name ?? "?"} ${lm.match.home_score}–${lm.match.away_score} ${lm.match.away_team?.name ?? "?"}`,
        competitionName: lm.match.competition?.name ?? "",
        totalGoals: goals,
      };
    }, null);

    const scorelineCounts = new Map<string, number>();
    for (const lm of matchesWithScore) {
      const key = `${lm.match.home_score}–${lm.match.away_score}`;
      scorelineCounts.set(key, (scorelineCounts.get(key) ?? 0) + 1);
    }
    const scorelineRanking: RankedItem[] = [...scorelineCounts.entries()]
      .map(([score, count]) => ({ key: score, label: score, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, SCORELINE_RANKING_LIMIT);

    const weekdayCounts = new Map<number, number>();
    for (const lm of loggedMatches) {
      const day = new Date(lm.log.watched_at).getUTCDay();
      weekdayCounts.set(day, (weekdayCounts.get(day) ?? 0) + 1);
    }
    const topWeekday = [...weekdayCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const jourPrefere = topWeekday !== undefined ? WEEKDAY_LABELS[topWeekday] : null;

    const sortedByRating = [...loggedMatches].sort(
      (a, b) => b.log.rating - a.log.rating,
    );
    const top3 = sortedByRating.slice(0, 3);
    const flop3 = sortedByRating.slice(-3).reverse();

    // 19 bins (1, 1.5, 2, ..., 10) : demi-points compris.
    const ratingDistribution = Array.from({ length: 19 }, (_, i) => {
      const rating = Math.round((1 + i * 0.5) * 10) / 10;
      return {
        rating,
        count: allRatings.filter(
          (r) => Math.round(r * 10) / 10 === rating,
        ).length,
      };
    });

    const competitionRatings = new Map<string, { sum: number; count: number }>();
    for (const lm of loggedMatches) {
      const name = lm.match.competition?.name;
      if (!name) continue;
      const entry = competitionRatings.get(name) ?? { sum: 0, count: 0 };
      entry.sum += lm.log.rating;
      entry.count += 1;
      competitionRatings.set(name, entry);
    }
    // Une seule liste avec les deux métriques plutôt que deux RankedItem[]
    // séparés (nb de vues / note moyenne) qui dupliquaient les mêmes noms
    // côte à côte — triée par nb de vues, comme l'ancien "les plus
    // regardées", la moyenne est juste affichée en plus par ligne.
    const competitionStats: DualMetricItem[] = [...competitionRatings.entries()]
      .map(([name, { sum, count }]) => ({ key: name, label: name, count, average: sum / count }))
      .sort((a, b) => b.count - a.count);

    // Compat UI : SeasonStatsView attend 2 listes RankedItem (compétitions
    // les plus regardées + note moyenne par compétition) séparées.
    const competitionsByCount: RankedItem[] = competitionStats
      .map((c) => ({ key: c.key, label: c.label, value: c.count }))
      .sort((a, b) => b.value - a.value);

    const avgByCompetition: RankedItem[] = competitionStats
      .map((c) => ({ key: c.key, label: c.label, value: c.average }))
      .sort((a, b) => b.value - a.value);

    const teamRatings = new Map<string, { sum: number; count: number }>();
    for (const lm of loggedMatches) {
      for (const teamName of [lm.match.home_team?.name, lm.match.away_team?.name]) {
        if (!teamName) continue;
        const entry = teamRatings.get(teamName) ?? { sum: 0, count: 0 };
        entry.sum += lm.log.rating;
        entry.count += 1;
        teamRatings.set(teamName, entry);
      }
    }
    const teamStats: DualMetricItem[] = [...teamRatings.entries()]
      .map(([name, { sum, count }]) => ({ key: name, label: name, count, average: sum / count }))
      .sort((a, b) => b.count - a.count);

    const teamsByCount: RankedItem[] = teamStats
      .map((t) => ({ key: t.key, label: t.label, value: t.count }))
      .sort((a, b) => b.value - a.value);

    const avgByTeam: RankedItem[] = teamStats
      .map((t) => ({ key: t.key, label: t.label, value: t.average }))
      .sort((a, b) => b.value - a.value);

    const teamGoalsScored = new Map<string, number>();
    const teamGoalsConceded = new Map<string, number>();
    const teamWins = new Map<string, { wins: number; played: number }>();
    for (const lm of matchesWithScore) {
      const home = lm.match.home_team?.name;
      const away = lm.match.away_team?.name;
      const homeScore = lm.match.home_score ?? 0;
      const awayScore = lm.match.away_score ?? 0;
      if (home) {
        teamGoalsScored.set(home, (teamGoalsScored.get(home) ?? 0) + homeScore);
        teamGoalsConceded.set(home, (teamGoalsConceded.get(home) ?? 0) + awayScore);
        const entry = teamWins.get(home) ?? { wins: 0, played: 0 };
        entry.played += 1;
        if (homeScore > awayScore) entry.wins += 1;
        teamWins.set(home, entry);
      }
      if (away) {
        teamGoalsScored.set(away, (teamGoalsScored.get(away) ?? 0) + awayScore);
        teamGoalsConceded.set(away, (teamGoalsConceded.get(away) ?? 0) + homeScore);
        const entry = teamWins.get(away) ?? { wins: 0, played: 0 };
        entry.played += 1;
        if (awayScore > homeScore) entry.wins += 1;
        teamWins.set(away, entry);
      }
    }
    const goalsScoredByTeam: RankedItem[] = [...teamGoalsScored.entries()]
      .map(([name, value]) => ({ key: name, label: name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, RATIO_RANKING_LIMIT);
    const goalsConcededByTeam: RankedItem[] = [...teamGoalsConceded.entries()]
      .map(([name, value]) => ({ key: name, label: name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, RATIO_RANKING_LIMIT);
    const winRateByTeam: RankedItem[] = [...teamWins.entries()]
      .filter(([, { played }]) => played >= MIN_APPEARANCES_FOR_TEAM_RATIO)
      .map(([name, { wins, played }]) => ({ key: name, label: name, value: wins / played }))
      .sort((a, b) => b.value - a.value)
      .slice(0, RATIO_RANKING_LIMIT);

    const playerNameById = new Map<string, string>();
    const playerViewCounts = new Map<string, number>();
    for (const row of lineupRows ?? []) {
      if (!row.player) continue;
      playerNameById.set(row.player.id, row.player.full_name);
      playerViewCounts.set(row.player.id, (playerViewCounts.get(row.player.id) ?? 0) + 1);
    }
    const topPlayers: RankedItem[] = [...playerViewCounts.entries()]
      .map(([id, count]) => ({ key: id, label: playerNameById.get(id) ?? "?", value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, RANKING_LIMIT);

    const motmCounts = new Map<string, number>();
    for (const lm of loggedMatches) {
      if (!lm.log.motm_player_id) continue;
      motmCounts.set(
        lm.log.motm_player_id,
        (motmCounts.get(lm.log.motm_player_id) ?? 0) + 1,
      );
    }
    const motmRanking: RankedItem[] = [...motmCounts.entries()]
      .map(([id, count]) => ({ key: id, label: playerNameById.get(id) ?? "?", value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, RANKING_LIMIT);

    const eligibleRatios = [...playerViewCounts.entries()]
      .filter(([, count]) => count >= MIN_APPEARANCES_FOR_RATIO)
      .map(([id, count]) => ({
        key: id,
        label: playerNameById.get(id) ?? "?",
        value: (motmCounts.get(id) ?? 0) / count,
      }));
    const bestMvpRatio = [...eligibleRatios]
      .sort((a, b) => b.value - a.value)
      .slice(0, RATIO_RANKING_LIMIT);
    const worstMvpRatio = [...eligibleRatios]
      .sort((a, b) => a.value - b.value)
      .slice(0, RATIO_RANKING_LIMIT);

    return {
      matchsVus,
      matchsVusStandard,
      noteMoyenne,
      logsLast14Days,
      logsPrev14Days,
      noteMoyenneLast14Days,
      bestNoteLast14Days,
      worstNoteLast14Days,
      noteEvolutionLast14Days,
      avgGoalsPerMatchLast14Days,
      avgGoalsPerMatchPrev14Days,
      ratingTrend,
      competitionPlusRegardee,
      top3,
      flop3,
      ratingDistribution,
      competitionStats,
      competitionsByCount,
      avgByCompetition,
      continentBreakdown,
      teamStats,
      teamsByCount,
      avgByTeam,
      goalsScoredByTeam,
      goalsConcededByTeam,
      winRateByTeam,
      topPlayers,
      motmRanking,
      bestMvpRatio,
      worstMvpRatio,
      totalGoals,
      avgGoalsPerMatch,
      biggestScoreMatch,
      scorelineRanking,
      jourPrefere,
      customLogs: customLogsList,
      customLogsCount: customLogsList.length,
      customLogsTop3,
      customLogsFlop3,
    };
  }, [loggedMatches, lineupRows, customLogs]);

  return {
    ...stats,
    isLoading: matchesLoading || logsLoading || lineupsLoading || customLogsLoading,
    isError: matchesError || logsError || lineupsError || customLogsError,
    refetch: () => {
      refetchMatches();
      refetchMyLogs();
      refetchLineups();
      refetchCustomLogs();
    },
  };
}
