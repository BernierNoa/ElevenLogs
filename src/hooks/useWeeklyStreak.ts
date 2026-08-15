import { useMemo } from "react";
import { useMyLogs } from "./useMyLogs";

export interface WeeklyStreakWeek {
  key: string;
  logged: boolean;
}

export interface WeeklyStreak {
  weeks: WeeklyStreakWeek[];
  streakWeeks: number;
  thisWeekLogged: boolean;
  /** Une série existe déjà (semaines précédentes) mais la semaine en cours
   * n'a pas encore de log — elle ne casse pas la série tant que la semaine
   * n'est pas terminée, mais il faut logger bientôt pour la garder. */
  isAtRisk: boolean;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Lundi de la semaine calendaire contenant `date`.
function mondayOf(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 = dimanche ... 6 = samedi
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

const WEEKS_WINDOW = 8;

// À partir de logs.watched_at (déjà chargé par useMyLogs, aucune requête
// supplémentaire) : une semaine "logée" = au moins un match watched_at dans
// [lundi, dimanche]. La série = nombre de semaines consécutives se terminant
// à la semaine en cours (ou la précédente si la semaine en cours n'a pas
// encore de log — elle ne doit pas casser la série avant d'être terminée).
export function useWeeklyStreak(): WeeklyStreak & { isLoading: boolean } {
  const { data: myLogs, isLoading } = useMyLogs();

  const result = useMemo(() => {
    const loggedDayKeys = [...(myLogs?.values() ?? [])].map((log) => log.watched_at).sort();

    const currentMonday = mondayOf(new Date());
    const weeks: WeeklyStreakWeek[] = [];
    for (let i = WEEKS_WINDOW - 1; i >= 0; i--) {
      const start = new Date(currentMonday);
      start.setDate(start.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const startKey = dayKey(start);
      const endKey = dayKey(end);
      const logged = loggedDayKeys.some((k) => k >= startKey && k <= endKey);
      weeks.push({ key: startKey, logged });
    }

    const thisWeekLogged = weeks[weeks.length - 1]?.logged ?? false;

    let cursor = weeks.length - 1;
    if (!thisWeekLogged) cursor -= 1;
    let streakWeeks = 0;
    while (cursor >= 0 && weeks[cursor].logged) {
      streakWeeks += 1;
      cursor -= 1;
    }

    return {
      weeks,
      streakWeeks,
      thisWeekLogged,
      isAtRisk: !thisWeekLogged && streakWeeks > 0,
    };
  }, [myLogs]);

  return { ...result, isLoading };
}
