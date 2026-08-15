import { useMemo } from "react";
import { useMyLogs } from "./useMyLogs";

export interface StreakDay {
  key: string;
  logged: boolean;
}

export interface LogStreak {
  days: StreakDay[];
  streak: number;
  bestStreak: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const WINDOW_DAYS = 14;

// À partir de logs.watched_at (déjà chargé par useMyLogs, aucune requête
// supplémentaire) : les 14 derniers jours calendaires + le streak = nombre de
// jours consécutifs se terminant aujourd'hui avec au moins un log.
export function useLogStreak(): LogStreak & { isLoading: boolean } {
  const { data: myLogs, isLoading } = useMyLogs();

  const result = useMemo(() => {
    const loggedDayKeys = new Set(
      [...(myLogs?.values() ?? [])].map((log) => log.watched_at),
    );

    const today = new Date();
    const days: StreakDay[] = [];
    for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      days.push({ key, logged: loggedDayKeys.has(key) });
    }

    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (!days[i].logged) break;
      streak += 1;
    }

    // Record all-time, pas juste sur les 14 derniers jours affichés : à
    // partir de tout l'historique déjà chargé (loggedDayKeys), aucune
    // requête supplémentaire.
    const sortedTimestamps = [...loggedDayKeys]
      .map((key) => new Date(key).getTime())
      .sort((a, b) => a - b);
    let bestStreak = 0;
    let current = 0;
    for (let i = 0; i < sortedTimestamps.length; i++) {
      if (i === 0 || sortedTimestamps[i] - sortedTimestamps[i - 1] === MS_PER_DAY) {
        current += 1;
      } else {
        current = 1;
      }
      bestStreak = Math.max(bestStreak, current);
    }

    return { days, streak, bestStreak };
  }, [myLogs]);

  return { ...result, isLoading };
}
