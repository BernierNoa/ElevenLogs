import { MatchCard } from "../MatchCard";
import type { MatchListItem } from "../../hooks/useMatches";
import type { LogItem } from "../../hooks/useMyLogs";
import { isImportant } from "../../lib/continents";

export interface MatchAgendaProps {
  matches: MatchListItem[];
  myLogs: Map<string, LogItem> | undefined;
  onOpenLog: (matchId: string) => void;
}

function isSameCalendarDay(iso: string, reference: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === reference.getDate()
  );
}

function kickoffTimeLabel(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );
}

// 0 = en direct, 1 = aujourd'hui, 2 = équipe déjà suivie (présente dans un
// match déjà loggé), 3 = reste — le tri final applique cette priorité avant
// de retomber sur l'heure de coup d'envoi.
function tierOf(match: MatchListItem, now: Date, affinityTeams: Set<string>): number {
  if (match.status === "live") return 0;
  if (isSameCalendarDay(match.kickoff_at, now)) return 1;
  const homeAffinity = match.home_team && affinityTeams.has(match.home_team.name);
  const awayAffinity = match.away_team && affinityTeams.has(match.away_team.name);
  if (homeAffinity || awayAffinity) return 2;
  return 3;
}

export function MatchAgenda({ matches, myLogs, onOpenLog }: MatchAgendaProps) {
  const now = new Date();

  const affinityTeams = new Set<string>();
  for (const match of matches) {
    if (!myLogs?.has(match.id)) continue;
    if (match.home_team) affinityTeams.add(match.home_team.name);
    if (match.away_team) affinityTeams.add(match.away_team.name);
  }

  const agenda = matches
    .filter((m) => m.competition && isImportant(m.competition.name, m.competition.country))
    .filter((m) => !myLogs?.has(m.id))
    .map((m) => ({ match: m, tier: tierOf(m, now, affinityTeams) }))
    .sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      // Urgence (live/aujourd'hui) : le plus proche d'abord. Le reste :
      // le plus récent d'abord (comportement historique du carrousel).
      return a.tier <= 1
        ? a.match.kickoff_at.localeCompare(b.match.kickoff_at)
        : b.match.kickoff_at.localeCompare(a.match.kickoff_at);
    });

  if (agenda.length === 0) {
    return (
      <p className="text-gris-fonce text-[13px]">
        Rien à noter dans les grands championnats pour l'instant.
      </p>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 md:mx-0 md:px-0">
      {agenda.map(({ match, tier }) => (
        <div key={match.id} className="w-[300px] shrink-0">
          {tier <= 1 && (
            <div className="mb-1.5 font-data text-[10px] font-bold uppercase tracking-[0.08em] text-projecteur">
              {match.status === "live"
                ? "● En direct"
                : `Aujourd'hui · ${kickoffTimeLabel(match.kickoff_at)}`}
            </div>
          )}
          <MatchCard
            competitionName={match.competition?.name ?? ""}
            homeTeamName={match.home_team?.name ?? "?"}
            homeTeamLogoUrl={match.home_team?.logo_url}
            awayTeamName={match.away_team?.name ?? "?"}
            awayTeamLogoUrl={match.away_team?.logo_url}
            kickoffAt={match.kickoff_at}
            status={match.status}
            homeScore={match.home_score}
            awayScore={match.away_score}
            important
            onOpenLog={() => onOpenLog(match.id)}
          />
        </div>
      ))}
    </div>
  );
}
