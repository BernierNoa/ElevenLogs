import { useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "./ui/Card";
import { MatchCard } from "./MatchCard";
import { LogMatchModal } from "./LogMatchModal";
import { CustomLogCard } from "./CustomLogCard";
import { RankedBarList } from "./RankedBarList";
import { RatingDistributionChart } from "./RatingDistributionChart";
import { RatingTrendChart } from "./RatingTrendChart";
import { ScorelineBadges } from "./ScorelineBadges";
import { MetricRankedList } from "./MetricRankedList";
import { ContinentBreakdownChart } from "./ContinentBreakdownChart";
import { StatTile } from "./StatTile";
import { StatTileTrend } from "./StatTileTrend";
import { useSeasonStats, type LoggedMatch, type RankedItem } from "../hooks/useSeasonStats";
import type { LogStreak } from "../hooks/useLogStreak";
import { usePlatformPlayerStats } from "../hooks/usePlatformPlayerStats";
import { useCommunityAverages, type CommunityAverage } from "../hooks/useCommunityAverages";
import { useCommunityBenchmarks } from "../hooks/useCommunityBenchmarks";

function SectionTitle({ children }: { children: string }) {
  return <h3 className="font-display font-bold text-[15px] mb-3">{children}</h3>;
}

const MIN_LOGS_FOR_TOP_FLOP = 5;
const MIN_APPEARANCES_FOR_RATIO = 3;
const MIN_APPEARANCES_FOR_TEAM_RATIO = 2;
const PLATFORM_MVP_PAGE_SIZE = 10;

type StatCategory = "apercu" | "competitions" | "equipes" | "joueurs";

const CATEGORIES: { key: StatCategory; label: string }[] = [
  { key: "apercu", label: "Aperçu" },
  { key: "competitions", label: "Compétitions" },
  { key: "equipes", label: "Équipes" },
  { key: "joueurs", label: "Joueurs" },
];

function formatPercent(v: number): string {
  return `${Math.round(v * 100)}%`;
}

function formatCount(v: number): string {
  return `${v}×`;
}

// Une liste où toutes les valeurs sont égales (ex. 20 joueurs à "1×") n'a
// rien à représenter en barres/classement significatif — sert à basculer
// vers un affichage plus honnête (badges plutôt que classement numéroté).
function hasVariance(items: RankedItem[]): boolean {
  return items.length > 0 && items.some((i) => i.value !== items[0].value);
}

function LoggedMatchCard({
  loggedMatch,
  communityAverage,
  onOpenLog,
  readOnly,
  logOwnerId,
}: {
  loggedMatch: LoggedMatch;
  communityAverage?: CommunityAverage;
  onOpenLog: (matchId: string) => void;
  readOnly: boolean;
  logOwnerId: string;
}) {
  const { match, log } = loggedMatch;
  return (
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
      myLog={log}
      communityAverage={communityAverage}
      onOpenLog={() => onOpenLog(match.id)}
      readOnly={readOnly}
      logOwnerId={logOwnerId}
    />
  );
}

export interface SeasonStatsViewProps {
  stats: ReturnType<typeof useSeasonStats>;
  /** user_id du compte dont on affiche les stats — logOwnerId pour les
   * cartes (modération des commentaires) même en lecture seule. */
  logOwnerId: string;
  /** Masque "Modifier"/"Noter ce match" : true pour l'onglet Stats d'un
   * profil public consulté par quelqu'un d'autre que son propriétaire. */
  readOnly?: boolean;
  /** Calendrier de série de logs — propre au compte connecté (queue offline
   * incluse), donc fourni uniquement par la page "Ta saison", jamais pour un
   * profil public consulté à distance. */
  streak?: LogStreak;
}

// Extrait de Stats.tsx pour être réutilisé à l'identique par l'onglet Stats
// d'un profil public (PublicProfile.tsx), avec les mêmes catégories et la
// même logique de rendu — seules les capacités d'édition (readOnly) et le
// streak (propre au compte connecté) varient selon l'appelant.
export function SeasonStatsView({ stats, logOwnerId, readOnly = false, streak }: SeasonStatsViewProps) {
  const navigate = useNavigate();
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [category, setCategory] = useState<StatCategory>("apercu");
  const [showAllPlatformMvp, setShowAllPlatformMvp] = useState(false);

  const activeMatch = [...stats.top3, ...stats.flop3].find(
    (lm) => lm.match.id === activeMatchId,
  )?.match;

  const topFlopMatchIds = [...stats.top3, ...stats.flop3]
    .filter((lm, index, all) => all.findIndex((o) => o.match.id === lm.match.id) === index)
    .map((lm) => lm.match.id);
  const { data: communityAverages } = useCommunityAverages(topFlopMatchIds);
  const { data: platformMvpRanking } = usePlatformPlayerStats(category === "joueurs");
  const { data: benchmarks } = useCommunityBenchmarks(
    category === "apercu" || category === "competitions" || category === "equipes",
  );

  if (stats.matchsVus === 0) {
    return (
      <p className="text-gris text-[13.5px] mt-2 max-w-[62ch]">
        {readOnly ? "Aucun match logué pour l'instant." : (
          <>
            Aucun match logué pour l'instant. Va sur{" "}
            <a href="/matchs" className="text-projecteur">
              la liste des matchs
            </a>{" "}
            pour commencer.
          </>
        )}
      </p>
    );
  }

  const logsTrendDelta = stats.logsLast14Days - stats.logsPrev14Days;
  const goalsTrendDelta =
    stats.avgGoalsPerMatchLast14Days !== null && stats.avgGoalsPerMatchPrev14Days !== null
      ? stats.avgGoalsPerMatchLast14Days - stats.avgGoalsPerMatchPrev14Days
      : null;

  const platformMvpVisible = showAllPlatformMvp
    ? (platformMvpRanking ?? [])
    : (platformMvpRanking ?? []).slice(0, PLATFORM_MVP_PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mt-5">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            className={["filtre-chip", category === c.key ? "actif" : ""].join(" ")}
            onClick={() => setCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {category === "apercu" && (
        <div className="mt-7">
          {streak && (
            <div className="flex items-center gap-3">
              <div className="flex gap-[3px]">
                {streak.days.map((day) => (
                  <span
                    key={day.key}
                    className={`w-3 h-3 rounded-[2px] ${day.logged ? "bg-projecteur" : "bg-nuit-haute border border-ligne"}`}
                    title={day.key}
                  />
                ))}
              </div>
              <span className="font-data text-[11px] text-gris-fonce uppercase tracking-[0.08em]">
                {streak.streak > 0
                  ? `${streak.streak} jour${streak.streak > 1 ? "s" : ""} de suite`
                  : "14 derniers jours"}
              </span>
            </div>
          )}

          <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${streak ? "mt-6" : ""}`}>
            <StatTile value={String(stats.matchsVus)} label="Matchs vus" />
            <StatTile
              value={stats.noteMoyenne !== null ? stats.noteMoyenne.toFixed(1) : "–"}
              label="Note moyenne"
            />
            <StatTileTrend
              value={
                stats.noteMoyenneLast14Days !== null ? stats.noteMoyenneLast14Days.toFixed(1) : "–"
              }
              label="Moyenne 14j"
              trend={
                stats.noteEvolutionLast14Days !== null
                  ? {
                      label: `${stats.noteEvolutionLast14Days >= 0 ? "+" : ""}${stats.noteEvolutionLast14Days.toFixed(1)} vs 14j précédents`,
                      positive: stats.noteEvolutionLast14Days >= 0,
                    }
                  : null
              }
            />
            <StatTile
              value={stats.bestNoteLast14Days !== null ? stats.bestNoteLast14Days.toFixed(1) : "–"}
              label="Meilleure 14j"
            />
            <StatTileTrend
              value={String(stats.logsLast14Days)}
              label="Logs 14j"
              trend={{
                label: `${logsTrendDelta >= 0 ? "+" : ""}${logsTrendDelta} vs 14j précédents`,
                positive: logsTrendDelta >= 0,
              }}
            />
            <StatTile
              value={stats.competitionPlusRegardee ?? "–"}
              label="Compétition la plus regardée"
            />
            <StatTile value={String(stats.totalGoals)} label="Buts vus" />
            <StatTileTrend
              value={stats.avgGoalsPerMatch !== null ? stats.avgGoalsPerMatch.toFixed(1) : "–"}
              label="Buts par match"
              trend={
                goalsTrendDelta !== null
                  ? {
                      label: `${goalsTrendDelta >= 0 ? "+" : ""}${goalsTrendDelta.toFixed(1)} vs 14j précédents`,
                      positive: goalsTrendDelta >= 0,
                    }
                  : null
              }
            />
            {streak && <StatTile value={String(streak.bestStreak)} label="Meilleure série" />}
            <StatTile value={stats.jourPrefere ?? "–"} label="Jour préféré" />
          </div>

          {stats.biggestScoreMatch && (
            <div className="mt-6">
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-data text-[9.5px] text-gris-fonce uppercase tracking-[0.1em] mb-1.5">
                      Le plus gros score vu
                    </div>
                    <div className="font-display font-bold [font-stretch:104%] text-[15px] truncate">
                      {stats.biggestScoreMatch.label}
                    </div>
                    <div className="text-gris-fonce text-[12px] mt-1">
                      {stats.biggestScoreMatch.competitionName}
                    </div>
                  </div>
                  <span className="chiffres font-display font-black [font-stretch:116%] text-[26px] text-projecteur shrink-0">
                    {stats.biggestScoreMatch.totalGoals}
                  </span>
                </div>
              </Card>
            </div>
          )}

          <div className="mt-8">
            <SectionTitle>Évolution de la note</SectionTitle>
            <Card>
              <RatingTrendChart data={stats.ratingTrend} />
            </Card>
          </div>

          <div className="mt-8">
            <SectionTitle>Répartition des notes</SectionTitle>
            <Card>
              <RatingDistributionChart
                distribution={stats.ratingDistribution}
                communityAverage={benchmarks?.platformAverage}
              />
            </Card>
          </div>

          <div className="mt-8">
            <SectionTitle>Scores les plus fréquents</SectionTitle>
            <Card>
              {stats.scorelineRanking.length === 0 ? (
                <p className="text-gris-fonce text-[13px]">Pas encore de données.</p>
              ) : hasVariance(stats.scorelineRanking) ? (
                <RankedBarList
                  items={stats.scorelineRanking}
                  formatValue={formatCount}
                  emptyLabel="Pas encore de données."
                />
              ) : (
                <ScorelineBadges items={stats.scorelineRanking} />
              )}
            </Card>
          </div>

          {stats.matchsVusStandard > 0 && (
            <div className="mt-8">
              {stats.matchsVusStandard < MIN_LOGS_FOR_TOP_FLOP ? (
                <div>
                  <SectionTitle>Matchs notés</SectionTitle>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[...stats.top3, ...stats.flop3]
                      .filter(
                        (lm, index, all) =>
                          all.findIndex((other) => other.match.id === lm.match.id) === index,
                      )
                      .map((lm) => (
                        <LoggedMatchCard
                          key={lm.match.id}
                          loggedMatch={lm}
                          communityAverage={communityAverages?.get(lm.match.id)}
                          onOpenLog={setActiveMatchId}
                          readOnly={readOnly}
                          logOwnerId={logOwnerId}
                        />
                      ))}
                  </div>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <SectionTitle>Meilleurs matchs notés</SectionTitle>
                    <div className="grid gap-3">
                      {stats.top3.map((lm) => (
                        <LoggedMatchCard
                          key={lm.match.id}
                          loggedMatch={lm}
                          communityAverage={communityAverages?.get(lm.match.id)}
                          onOpenLog={setActiveMatchId}
                          readOnly={readOnly}
                          logOwnerId={logOwnerId}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <SectionTitle>Matchs les moins bien notés</SectionTitle>
                    <div className="grid gap-3">
                      {stats.flop3.map((lm) => (
                        <LoggedMatchCard
                          key={lm.match.id}
                          loggedMatch={lm}
                          communityAverage={communityAverages?.get(lm.match.id)}
                          onOpenLog={setActiveMatchId}
                          readOnly={readOnly}
                          logOwnerId={logOwnerId}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {stats.customLogsCount > 0 && (
            <div className="mt-8">
              {stats.customLogsCount < MIN_LOGS_FOR_TOP_FLOP ? (
                <div>
                  <SectionTitle>Matchs personnalisés</SectionTitle>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {stats.customLogs.map((customLog) => (
                      <CustomLogCard
                        key={customLog.id}
                        customLog={customLog}
                        onEdit={() => navigate("/journal")}
                        readOnly={readOnly}
                        logOwnerId={logOwnerId}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <SectionTitle>Meilleures notes perso</SectionTitle>
                    <div className="grid gap-3">
                      {stats.customLogsTop3.map((customLog) => (
                        <CustomLogCard
                          key={customLog.id}
                          customLog={customLog}
                          onEdit={() => navigate("/journal")}
                          readOnly={readOnly}
                          logOwnerId={logOwnerId}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <SectionTitle>Moins bonnes notes perso</SectionTitle>
                    <div className="grid gap-3">
                      {stats.customLogsFlop3.map((customLog) => (
                        <CustomLogCard
                          key={customLog.id}
                          customLog={customLog}
                          onEdit={() => navigate("/journal")}
                          readOnly={readOnly}
                          logOwnerId={logOwnerId}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {category === "competitions" && (
        <div className="grid lg:grid-cols-2 gap-6 mt-7">
          <div className="lg:col-span-2">
            <SectionTitle>Par compétition</SectionTitle>
            <Card>
              <MetricRankedList
                items={stats.competitionStats}
                emptyLabel="Pas encore de données."
                communityAverages={benchmarks?.byCompetition}
              />
            </Card>
          </div>

          <div className="lg:col-span-2">
            <SectionTitle>Répartition par continent</SectionTitle>
            <Card>
              <ContinentBreakdownChart items={stats.continentBreakdown} />
            </Card>
          </div>
        </div>
      )}

      {category === "equipes" && (
        <div className="grid lg:grid-cols-2 gap-6 mt-7">
          <div className="lg:col-span-2">
            <SectionTitle>Par équipe</SectionTitle>
            <Card>
              <MetricRankedList
                items={stats.teamStats}
                emptyLabel="Pas encore de données."
                communityAverages={benchmarks?.byTeam}
              />
            </Card>
          </div>

          <div>
            <SectionTitle>Équipes les plus prolifiques</SectionTitle>
            <p className="text-gris-fonce text-[12px] mb-3">
              Buts marqués dans les matchs logués.
            </p>
            <Card>
              <RankedBarList
                items={stats.goalsScoredByTeam}
                formatValue={(v) => `${v} buts`}
                emptyLabel="Pas encore de données."
              />
            </Card>
          </div>

          <div>
            <SectionTitle>Équipes les plus perméables</SectionTitle>
            <p className="text-gris-fonce text-[12px] mb-3">
              Buts encaissés dans les matchs logués.
            </p>
            <Card>
              <RankedBarList
                items={stats.goalsConcededByTeam}
                formatValue={(v) => `${v} buts`}
                emptyLabel="Pas encore de données."
              />
            </Card>
          </div>

          <div className="lg:col-span-2">
            <SectionTitle>Meilleur taux de victoire dans les logs</SectionTitle>
            <p className="text-gris-fonce text-[12px] mb-3">
              Parmi les équipes vues au moins {MIN_APPEARANCES_FOR_TEAM_RATIO}{" "}
              fois dans les matchs logués.
            </p>
            <Card>
              <RankedBarList
                items={stats.winRateByTeam}
                formatValue={formatPercent}
                emptyLabel={`Vu au moins ${MIN_APPEARANCES_FOR_TEAM_RATIO} fois pour apparaître ici.`}
              />
            </Card>
          </div>
        </div>
      )}

      {category === "joueurs" && (
        <div className="grid lg:grid-cols-2 gap-6 mt-7">
          <div>
            <SectionTitle>Joueurs les plus vus</SectionTitle>
            <Card>
              <RankedBarList
                items={stats.topPlayers}
                formatValue={formatCount}
                emptyLabel="Aucune compo disponible sur les matchs logués."
              />
            </Card>
          </div>

          <div>
            <SectionTitle>MVP les plus élus</SectionTitle>
            <Card>
              <RankedBarList
                items={stats.motmRanking}
                accent="or"
                formatValue={formatCount}
                emptyLabel="Aucun homme du match élu pour l'instant."
              />
            </Card>
          </div>

          <div>
            <SectionTitle>Meilleur ratio MVP / apparitions</SectionTitle>
            <p className="text-gris-fonce text-[12px] mb-3">
              Parmi les joueurs vus au moins {MIN_APPEARANCES_FOR_RATIO} fois
              dans les matchs logués.
            </p>
            <Card>
              <RankedBarList
                items={stats.bestMvpRatio}
                accent="or"
                formatValue={formatPercent}
                emptyLabel={`Vu au moins ${MIN_APPEARANCES_FOR_RATIO} fois pour apparaître ici.`}
              />
            </Card>
          </div>

          <div>
            <SectionTitle>Pire ratio MVP / apparitions</SectionTitle>
            <p className="text-gris-fonce text-[12px] mb-3">
              Les joueurs vus souvent mais rarement élus homme du match.
            </p>
            <Card>
              <RankedBarList
                items={stats.worstMvpRatio}
                formatValue={formatPercent}
                emptyLabel={`Vu au moins ${MIN_APPEARANCES_FOR_RATIO} fois pour apparaître ici.`}
              />
            </Card>
          </div>

          <div className="lg:col-span-2">
            <SectionTitle>MVP les plus élus sur Eleven Logs</SectionTitle>
            <p className="text-gris-fonce text-[12px] mb-3">
              Tous comptes confondus, sur les logs publics de la plateforme.
            </p>
            <Card>
              <RankedBarList
                items={platformMvpVisible}
                accent="or"
                formatValue={formatCount}
                emptyLabel="Pas encore assez de données sur la plateforme."
              />
              {(platformMvpRanking?.length ?? 0) > PLATFORM_MVP_PAGE_SIZE && (
                <button
                  type="button"
                  className="font-data text-[10.5px] text-projecteur uppercase tracking-[0.08em] mt-3"
                  onClick={() => setShowAllPlatformMvp((v) => !v)}
                >
                  {showAllPlatformMvp ? "Voir moins" : "Voir plus →"}
                </button>
              )}
            </Card>
          </div>
        </div>
      )}

      {!readOnly && activeMatch && (
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
          existingLog={
            [...stats.top3, ...stats.flop3].find((lm) => lm.match.id === activeMatchId)
              ?.log
          }
          onClose={() => setActiveMatchId(null)}
        />
      )}
    </div>
  );
}
