import { useMemo, useState } from "react";
import { Button } from "../components/ui/Button";
import { MatchCard } from "../components/MatchCard";
import { LogMatchModal } from "../components/LogMatchModal";
import { MatchFilters, type MatchFilter } from "../components/MatchFilters";
import { useMatches, type MatchListItem } from "../hooks/useMatches";
import { useMyLogs } from "../hooks/useMyLogs";
import { useCommunityAverages } from "../hooks/useCommunityAverages";
import { continentOf, isImportant, isTop5 } from "../lib/continents";

const WINDOW_DAYS = 14;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dayKey(iso) === dayKey(today.toISOString())) return "Aujourd'hui";
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return "Hier";

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(d);
}

interface DayGroup {
  key: string;
  label: string;
  matches: MatchListItem[];
}

function groupByDayDesc(matches: MatchListItem[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();

  function competitionPriority(match: MatchListItem): number {
    const comp = match.competition;
    const name = comp?.name ?? "";
    const country = comp?.country ?? null;

    // 1) Couper européens : les compétitions UEFA (Champions/Europa/Conference)
    //    — on fait du "best effort" sur le nom pour être robuste.
    const isEuropeanCup =
      name === "UEFA Champions League" ||
      name === "UEFA Europa League" ||
      name === "UEFA Europa Conference League" ||
      (name.startsWith("UEFA") &&
        (name.includes("Champions") ||
          name.includes("Europa") ||
          name.includes("Conference")));

    if (isEuropeanCup) return 0;

    // 2) Top 5 européens : via helper exact (nom + pays)
    if (comp && isTop5(name, country)) return 1;

    // 3) Le reste
    return 2;
  }

  function sortInsideGroup(a: MatchListItem, b: MatchListItem): number {
    const da = dayKey(a.kickoff_at);
    const db = dayKey(b.kickoff_at);
    // sécurité : on ne mélange pas de jour dans le tri
    if (da !== db) return db.localeCompare(da);

    return (
      competitionPriority(a) - competitionPriority(b) ||
      a.kickoff_at.localeCompare(b.kickoff_at)
    );
  }

  for (const match of matches) {
    const key = dayKey(match.kickoff_at);
    const group = groups.get(key);
    if (group) group.matches.push(match);
    else groups.set(key, { key, label: dayLabel(match.kickoff_at), matches: [match] });
  }

  // Aujourd'hui d'abord, puis on redescend vers le passé. À l'intérieur
  // : priorité compétition (coupe européennes → top 5 → autres) puis heure.
  return [...groups.values()]
    .map((g) => ({ ...g, matches: [...g.matches].sort(sortInsideGroup) }))
    .sort((a, b) => b.key.localeCompare(a.key));
}

function applyFilter(matches: MatchListItem[], filter: MatchFilter): MatchListItem[] {
  if (filter.kind === "all") return matches;

  return matches.filter((match) => {
    const competition = match.competition;
    if (!competition) return false;

    switch (filter.kind) {
      case "top5":
        return isTop5(competition.name, competition.country);
      case "continent":
        return continentOf(competition.country) === filter.continent;
      case "competition":
        return competition.id === filter.competitionId;
    }
  });
}

export function Matches() {
  const { from, to } = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const windowStart = new Date(todayStart);
    windowStart.setDate(windowStart.getDate() - WINDOW_DAYS);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    return { from: windowStart.toISOString(), to: tomorrowStart.toISOString() };
  }, []);

  const { data: matches, isLoading, isError, refetch } = useMatches({ from, to });
  const { data: myLogs } = useMyLogs();
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [filter, setFilter] = useState<MatchFilter>({ kind: "all" });

  const filteredMatches = applyFilter(matches ?? [], filter);
  const activeMatch = matches?.find((m) => m.id === activeMatchId);

  const loggedMatchIds = filteredMatches
    .filter((m) => myLogs?.has(m.id))
    .map((m) => m.id);
  const { data: communityAverages } = useCommunityAverages(loggedMatchIds);

  return (
    <div className="max-w-[1180px] mx-auto px-5 md:px-8 py-7">
      <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] [font-stretch:110%] text-[28px] md:text-[30px]">
        Matchs
      </h1>
      <p className="text-gris text-[13.5px] mt-2 max-w-[62ch]">
        {matches
          ? `${filteredMatches.length} rencontres — aujourd'hui et les ${WINDOW_DAYS} derniers jours.`
          : "Chargement des matchs…"}
      </p>

      {matches && matches.length > 0 && (
        <MatchFilters matches={matches} value={filter} onChange={setFilter} />
      )}

      {isLoading && (
        <p className="text-gris-fonce text-[13px] mt-8">Chargement…</p>
      )}

      {isError && (
        <div className="flex items-center gap-3 flex-wrap mt-8">
          <p className="text-carton text-[13px]">
            Impossible de charger les matchs.
          </p>
          <Button variant="secondaire" size="sm" onClick={() => refetch()}>
            Réessayer
          </Button>
        </div>
      )}

      {matches && filteredMatches.length === 0 && (
        <p className="text-gris-fonce text-[13px] mt-8">
          Aucun match pour ce filtre sur cette période.
        </p>
      )}

      {matches && filteredMatches.length > 0 && (
        <div className="mt-7 space-y-8">
          {groupByDayDesc(filteredMatches).map((group) => (
            <div key={group.key}>
              <div className="flex items-center gap-3.5 mb-3 font-data text-[10.5px] tracking-[0.13em] uppercase text-gris-fonce">
                <span>{group.label}</span>
                <span className="flex-1 h-px bg-ligne" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    competitionName={match.competition?.name ?? ""}
                    homeTeamName={match.home_team?.name ?? "?"}
                    homeTeamLogoUrl={match.home_team?.logo_url}
                    awayTeamName={match.away_team?.name ?? "?"}
                    awayTeamLogoUrl={match.away_team?.logo_url}
                    kickoffAt={match.kickoff_at}
                    status={match.status}
                    homeScore={match.home_score}
                    awayScore={match.away_score}
                    myLog={myLogs?.get(match.id)}
                    communityAverage={communityAverages?.get(match.id)}
                    important={
                      !!match.competition &&
                      isImportant(match.competition.name, match.competition.country)
                    }
                    onOpenLog={() => setActiveMatchId(match.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeMatch && (
        <LogMatchModal
          key={activeMatch.id}
          matchId={activeMatch.id}
          competitionName={activeMatch.competition?.name ?? ""}
          homeTeamName={activeMatch.home_team?.name ?? "?"}
          awayTeamName={activeMatch.away_team?.name ?? "?"}
          kickoffAt={activeMatch.kickoff_at}
          homeScore={activeMatch.home_score}
          awayScore={activeMatch.away_score}
          competitionLogoUrl={activeMatch.competition?.logo_url ?? null}
          homeTeamLogoUrl={activeMatch.home_team?.logo_url ?? null}
          awayTeamLogoUrl={activeMatch.away_team?.logo_url ?? null}
          existingLog={myLogs?.get(activeMatch.id)}
          onClose={() => setActiveMatchId(null)}
        />
      )}
    </div>
  );
}
