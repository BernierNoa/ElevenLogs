import { useState } from "react";
import { useUser } from "@clerk/react-router";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/Button";
import { MatchCard } from "../components/MatchCard";
import { LogMatchModal } from "../components/LogMatchModal";
import { CustomLogCard } from "../components/CustomLogCard";
import { CustomLogModal } from "../components/CustomLogModal";
import { useMatches } from "../hooks/useMatches";
import { useMyLogs } from "../hooks/useMyLogs";
import { useCatchUpMatches } from "../hooks/useCatchUpMatches";
import { useCommunityAverages } from "../hooks/useCommunityAverages";
import { useCustomLogs, type CustomLogItem } from "../hooks/useCustomLogs";
import { useCommentCounts } from "../hooks/useCommentCounts";

export function Journal() {
  const { isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();
  const { data: matches, isError: matchesError, refetch: refetchMatches } = useMatches();
  const { data: myLogs, isLoading } = useMyLogs();
  const catchUp = useCatchUpMatches();
  const hasError = matchesError || catchUp.isError;

  function handleRetry() {
    if (matchesError) void refetchMatches();
    if (catchUp.isError) catchUp.refetch();
  }
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const { data: customLogs, isLoading: isCustomLogsLoading } = useCustomLogs();
  const [creatingCustomLogMode, setCreatingCustomLogMode] = useState<
    "single" | "multiplex" | null
  >(null);
  const [editingCustomLog, setEditingCustomLog] = useState<CustomLogItem | null>(null);

  const loggedMatches = (matches ?? [])
    .filter((match) => myLogs?.has(match.id))
    .sort(
      (a, b) =>
        (myLogs!.get(b.id)!.watched_at ?? "").localeCompare(
          myLogs!.get(a.id)!.watched_at ?? "",
        ),
    );

  const activeMatch =
    matches?.find((m) => m.id === activeMatchId) ??
    catchUp.matches.find((m) => m.id === activeMatchId);

  const { data: communityAverages } = useCommunityAverages(
    loggedMatches.map((m) => m.id),
  );

  // Un log en attente de synchro n'a pas encore d'id serveur réel (cf.
  // LogItem.pending) : rien à récupérer côté commentaires pour ceux-là.
  const loggedMatchLogIds = loggedMatches
    .map((m) => myLogs?.get(m.id))
    .filter((log): log is NonNullable<typeof log> => !!log && !log.pending)
    .map((log) => log.id);
  const { data: matchCommentCounts } = useCommentCounts("log", loggedMatchLogIds);
  const { data: customLogCommentCounts } = useCommentCounts(
    "custom-log",
    (customLogs ?? []).map((c) => c.id),
  );

  return (
    <div className="max-w-[1180px] mx-auto px-5 md:px-8 py-7">
      <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] [font-stretch:110%] text-[28px] md:text-[30px]">
        Mon journal
      </h1>

      {isLoaded && !isSignedIn && (
        <div className="mt-8">
          <p className="text-gris text-[13.5px] max-w-[62ch] mb-4">
            Connecte-toi pour voir les matchs que tu as notés.
          </p>
          <Button onClick={() => navigate("/connexion")}>Se connecter</Button>
        </div>
      )}

      {isSignedIn && hasError && (
        <div className="flex items-center gap-3 flex-wrap mt-8">
          <p className="text-carton text-[13px]">
            Impossible de charger tes matchs.
          </p>
          <Button variant="secondaire" size="sm" onClick={handleRetry}>
            Réessayer
          </Button>
        </div>
      )}

      {isSignedIn && !catchUp.isLoading && catchUp.matches.length > 0 && (
        <div className="mt-7">
          <div className="flex items-center gap-3.5 mb-3">
            <h2 className="font-data text-[10.5px] tracking-[0.13em] uppercase text-projecteur">
              À loguer · {catchUp.matches.length}
            </h2>
            <span className="flex-1 h-px bg-ligne" />
          </div>
          <p className="text-gris-fonce text-[12.5px] mb-3">
            Terminés dans les 72 dernières heures, pas encore notés.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {catchUp.matches.map((match) => (
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
                onOpenLog={() => setActiveMatchId(match.id)}
              />
            ))}
          </div>
        </div>
      )}

      {isSignedIn && isLoading && (
        <p className="text-gris-fonce text-[13px] mt-8">Chargement…</p>
      )}

      {isSignedIn &&
        !isLoading &&
        !hasError &&
        loggedMatches.length === 0 &&
        customLogs?.length === 0 && (
          <div className="carte p-5 mt-6">
            <div className="font-display font-bold text-[15px]">
              Ton journal est vide
            </div>
            <p className="text-gris-fonce text-[13px] mt-1 max-w-[52ch]">
              Note ton premier match : une note sur 10, un homme du match si
              tu veux, et c'est parti.
            </p>
            <Button onClick={() => navigate("/matchs")} className="mt-4">
              Voir les matchs
            </Button>
          </div>
        )}

      {isSignedIn && loggedMatches.length > 0 && (
        <div className="mt-7">
          {catchUp.matches.length > 0 && (
            <div className="flex items-center gap-3.5 mb-3">
              <h2 className="font-data text-[10.5px] tracking-[0.13em] uppercase text-gris-fonce">
                Déjà notés
              </h2>
              <span className="flex-1 h-px bg-ligne" />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {loggedMatches.map((match) => (
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
                onOpenLog={() => setActiveMatchId(match.id)}
                commentCount={
                  myLogs?.get(match.id)
                    ? matchCommentCounts?.get(myLogs.get(match.id)!.id) ?? 0
                    : 0
                }
              />
            ))}
          </div>
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

      {isSignedIn && (
        <div className="mt-9">
          <div className="flex items-center gap-3.5 mb-3">
            <h2 className="font-data text-[10.5px] tracking-[0.13em] uppercase text-gris-fonce">
              Matchs personnalisés
            </h2>
            <span className="flex-1 h-px bg-ligne" />
          </div>
          <p className="text-gris-fonce text-[12.5px] mb-3 max-w-[62ch]">
            Pour un match ou un multiplex que le site ne couvre pas — un nom libre, une seule
            note.
          </p>
          <div className="flex flex-wrap gap-2.5 mb-4">
            <Button
              variant="secondaire"
              size="sm"
              onClick={() => setCreatingCustomLogMode("single")}
            >
              + Créer un match personnalisé
            </Button>
            <Button
              variant="secondaire"
              size="sm"
              onClick={() => setCreatingCustomLogMode("multiplex")}
            >
              + Créer un multiplex
            </Button>
          </div>

          {isCustomLogsLoading && (
            <p className="text-gris-fonce text-[13px]">Chargement…</p>
          )}

          {!isCustomLogsLoading && (customLogs ?? []).length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {customLogs!.map((customLog) => (
                <CustomLogCard
                  key={customLog.id}
                  customLog={customLog}
                  onEdit={() => setEditingCustomLog(customLog)}
                  commentCount={customLogCommentCounts?.get(customLog.id) ?? 0}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {creatingCustomLogMode && (
        <CustomLogModal
          mode={creatingCustomLogMode}
          onClose={() => setCreatingCustomLogMode(null)}
        />
      )}

      {editingCustomLog && (
        <CustomLogModal
          key={editingCustomLog.id}
          mode={editingCustomLog.matches.length > 1 ? "multiplex" : "single"}
          existingCustomLog={editingCustomLog}
          onClose={() => setEditingCustomLog(null)}
        />
      )}
    </div>
  );
}
