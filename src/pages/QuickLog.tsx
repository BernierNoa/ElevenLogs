import { useMemo, useState } from "react";
import { useUser } from "@clerk/react-router";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "../components/ui/Button";
import { MatchCard } from "../components/MatchCard";
import { LogMatchModal } from "../components/LogMatchModal";
import { ToastHost } from "../components/ui/Toast";
import { OfflineSyncManager } from "../components/OfflineSyncManager";
import { useMatches, type MatchListItem } from "../hooks/useMatches";
import { useMyLogs } from "../hooks/useMyLogs";

const WINDOW_DAYS_BACK = 2;
const WINDOW_HOURS_FORWARD = 18;
const LIST_LIMIT = 25;

// Best-effort seulement : beaucoup de titres d'onglet suivent le format
// "Match - Nom du site" ou "Match | Nom du site" — on retire le dernier
// segment (probablement le nom du site/diffuseur) et on garde le reste tel
// quel, bruit inclus (mots comme "en direct"). Ce n'est qu'un signal de tri,
// jamais un filtre strict (cf. score() plus bas) : un titre mal découpé
// dégrade le classement, il ne fait jamais disparaître de match.
function cleanHint(raw: string): string {
  const parts = raw
    .split(/\s[-|•]\s/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 1) return raw.trim();
  return parts.slice(0, -1).join(" ");
}

function statusRank(status: MatchListItem["status"]): number {
  if (status === "live") return 0;
  if (status === "finished") return 1;
  return 2; // scheduled / postponed
}

// Ordre par défaut (sans texte de recherche) : en direct d'abord, puis les
// matchs terminés du plus récent au plus ancien, puis les matchs à venir du
// plus proche au plus lointain — l'ordre le plus probable pour "le match que
// je suis en train de regarder".
function baseCompare(a: MatchListItem, b: MatchListItem): number {
  const ra = statusRank(a.status);
  const rb = statusRank(b.status);
  if (ra !== rb) return ra - rb;
  if (ra === 1) return b.kickoff_at.localeCompare(a.kickoff_at);
  return a.kickoff_at.localeCompare(b.kickoff_at);
}

function matchScore(match: MatchListItem, words: string[]): number {
  if (words.length === 0) return 0;
  const haystack = [match.competition?.name, match.home_team?.name, match.away_team?.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return words.filter((w) => haystack.includes(w)).length;
}

// Page volontairement hors AppLayout (pas de Sidebar/TabBar/Footer) : conçue
// pour être ouverte dans une petite fenêtre popup depuis l'extension
// navigateur, jamais depuis la nav normale du site. `?hint=` est le titre de
// l'onglet d'origine (transmis par l'extension), utilisé pour pré-remplir et
// classer la liste sans jamais la filtrer strictement — cf. matchScore.
export function QuickLog() {
  const { isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawHint = searchParams.get("hint");

  const [searchText, setSearchText] = useState(() => (rawHint ? cleanHint(rawHint) : ""));
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);

  const { from, to } = useMemo(() => {
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() - WINDOW_DAYS_BACK);
    const windowEnd = new Date(now.getTime() + WINDOW_HOURS_FORWARD * 60 * 60 * 1000);
    return { from: windowStart.toISOString(), to: windowEnd.toISOString() };
  }, []);

  const { data: matches, isLoading, isError, refetch } = useMatches({ from, to });
  const { data: myLogs } = useMyLogs();

  const words = searchText.trim().toLowerCase().split(/\s+/).filter((w) => w.length > 2);

  const sortedMatches = [...(matches ?? [])].sort(
    (a, b) => matchScore(b, words) - matchScore(a, words) || baseCompare(a, b),
  );

  const activeMatch = matches?.find((m) => m.id === activeMatchId);

  return (
    <div className="min-h-screen bg-noir text-craie">
      <div className="max-w-[440px] mx-auto px-4 py-5">
        <div className="font-display font-black [font-stretch:116%] text-[17px] tracking-[-0.03em] uppercase mb-4">
          Eleven<span className="text-projecteur">Logs</span>
        </div>

        {isLoaded && !isSignedIn && (
          <div className="carte p-4">
            <p className="text-gris text-[13px] mb-3">
              Connecte-toi pour noter ce match.
            </p>
            <Button size="sm" onClick={() => navigate("/connexion")}>
              Se connecter
            </Button>
          </div>
        )}

        {isSignedIn && (
          <>
            <input
              type="search"
              autoFocus
              className="champ-input text-[13.5px] py-2 w-full mb-4"
              placeholder="Chercher une équipe ou une compétition…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />

            {isError ? (
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-carton text-[13px]">Impossible de charger les matchs.</p>
                <Button variant="secondaire" size="sm" onClick={() => refetch()}>
                  Réessayer
                </Button>
              </div>
            ) : isLoading ? (
              <p className="text-gris-fonce text-[13px]">Chargement…</p>
            ) : sortedMatches.length === 0 ? (
              <p className="text-gris-fonce text-[13px]">Aucun match dans la fenêtre récente.</p>
            ) : (
              <div className="space-y-2">
                {sortedMatches.slice(0, LIST_LIMIT).map((match) => (
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
                    onOpenLog={() => setActiveMatchId(match.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

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

      <ToastHost />
      <OfflineSyncManager />
    </div>
  );
}
