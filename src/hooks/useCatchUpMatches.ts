import { useMemo } from "react";
import { useMatches, type MatchListItem } from "./useMatches";
import { useMyLogs } from "./useMyLogs";
import { isImportant } from "../lib/continents";

const CATCH_UP_HOURS = 72;
const CATCH_UP_LIMIT = 9;

// Matchs terminés dans les 72 dernières heures et pas encore logués — passé
// ce délai, un match sort silencieusement de la fenêtre (il redevient juste
// un match "normal" loggeable depuis la liste classique), aucun état à gérer
// pour ça : la borne `from` glisse toute seule au rendu suivant.
export function useCatchUpMatches(): {
  matches: MatchListItem[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const { from, to } = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getTime() - CATCH_UP_HOURS * 60 * 60 * 1000);
    return { from: from.toISOString(), to: now.toISOString() };
  }, []);

  const {
    data: matches,
    isLoading: matchesLoading,
    isError: matchesError,
    refetch: refetchMatches,
  } = useMatches({ from, to });
  const {
    data: myLogs,
    isLoading: logsLoading,
    isError: logsError,
    refetch: refetchMyLogs,
  } = useMyLogs();

  // Compétitions importantes (top 5 européen + Ligue des champions) en
  // premier — sinon la liste déborde vite de matchs mineurs quand plusieurs
  // journées se chevauchent dans la fenêtre de 72h.
  const catchUp = (matches ?? [])
    .filter((m) => m.status === "finished" && !myLogs?.has(m.id))
    .sort((a, b) => {
      const aImportant = isImportant(a.competition?.name ?? "", a.competition?.country ?? null);
      const bImportant = isImportant(b.competition?.name ?? "", b.competition?.country ?? null);
      if (aImportant !== bImportant) return aImportant ? -1 : 1;
      return b.kickoff_at.localeCompare(a.kickoff_at);
    })
    .slice(0, CATCH_UP_LIMIT);

  return {
    matches: catchUp,
    isLoading: matchesLoading || logsLoading,
    isError: matchesError || logsError,
    refetch: () => {
      void refetchMatches();
      void refetchMyLogs();
    },
  };
}
