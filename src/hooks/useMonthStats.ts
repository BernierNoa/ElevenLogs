import { useMemo } from "react";
import { useMyLogs } from "./useMyLogs";
import { useMatches } from "./useMatches";

export interface MonthStats {
  matchsVus: number;
  noteMoyenne: number | null;
  matchsVusLastMonth: number;
  equipePlusVue: string | null;
}

function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Scope volontairement "ce mois-ci" (watched_at) plutôt que all-time : c'est
// la question que l'accueil pose ("qu'est-ce que je regarde en ce moment"),
// pas le bilan de saison complet — pour ça il y a /stats.
export function useMonthStats(): MonthStats & { isLoading: boolean } {
  const { data: myLogs, isLoading: logsLoading } = useMyLogs();

  // Fenêtre resserrée au mois en cours (plutôt que toute la saison comme
  // useSeasonStats) pour rester léger sur un écran consulté à chaque
  // ouverture — un seul aller-retour supplémentaire, petit volume.
  const { from, to } = useMemo(() => {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return { from: firstOfMonth.toISOString(), to: tomorrow.toISOString() };
  }, []);
  const { data: monthMatches, isLoading: matchesLoading } = useMatches({ from, to });

  const stats = useMemo(() => {
    if (!myLogs) {
      return {
        matchsVus: 0,
        noteMoyenne: null as number | null,
        matchsVusLastMonth: 0,
        equipePlusVue: null as string | null,
      };
    }

    const now = new Date();
    const monthKey = monthKeyOf(now);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = monthKeyOf(lastMonthDate);

    const allLogs = [...myLogs.values()];
    const thisMonthLogs = allLogs.filter((log) => log.watched_at.startsWith(monthKey));
    const matchsVusLastMonth = allLogs.filter((log) =>
      log.watched_at.startsWith(lastMonthKey),
    ).length;

    const matchsVus = thisMonthLogs.length;
    const noteMoyenne =
      matchsVus > 0
        ? thisMonthLogs.reduce((sum, log) => sum + log.rating, 0) / matchsVus
        : null;

    const matchById = new Map((monthMatches ?? []).map((m) => [m.id, m]));
    const teamCounts = new Map<string, number>();
    for (const log of thisMonthLogs) {
      const match = matchById.get(log.match_id);
      if (!match) continue;
      for (const team of [match.home_team, match.away_team]) {
        if (!team) continue;
        teamCounts.set(team.name, (teamCounts.get(team.name) ?? 0) + 1);
      }
    }
    let equipePlusVue: string | null = null;
    let bestCount = 0;
    for (const [name, count] of teamCounts) {
      if (count > bestCount) {
        bestCount = count;
        equipePlusVue = name;
      }
    }

    return { matchsVus, noteMoyenne, matchsVusLastMonth, equipePlusVue };
  }, [myLogs, monthMatches]);

  return { ...stats, isLoading: logsLoading || matchesLoading };
}
