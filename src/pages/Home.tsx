import { useMemo, useState } from "react";
import { useUser } from "@clerk/react-router";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/Button";
import { LogMatchModal } from "../components/LogMatchModal";
import { ActivityFeedItem } from "../components/ActivityFeedItem";
import { ActivityFeedCustomLogItem } from "../components/ActivityFeedCustomLogItem";
import { StreakBanner } from "../components/home/StreakBanner";
import { MonthStatsPanel } from "../components/home/MonthStatsPanel";
import { MatchAgenda } from "../components/home/MatchAgenda";
import { SuggestedAccounts } from "../components/home/SuggestedAccounts";
import { LandingHero } from "../components/landing/LandingHero";
import { LandingFlowDemo } from "../components/landing/LandingFlowDemo";
import { LandingActivityPreview } from "../components/landing/LandingActivityPreview";
import { LandingDifferentiation } from "../components/landing/LandingDifferentiation";
import { LandingFinalCta } from "../components/landing/LandingFinalCta";
import { useMatches } from "../hooks/useMatches";
import { useMyLogs } from "../hooks/useMyLogs";
import { useMonthStats } from "../hooks/useMonthStats";
import { useWeeklyStreak } from "../hooks/useWeeklyStreak";
import { useFollowing } from "../hooks/useFollowing";
import { useFollowMutations } from "../hooks/useFollowMutations";
import { useActivityFeed } from "../hooks/useActivityFeed";
import { useActivityFeedCustomLogs } from "../hooks/useActivityFeedCustomLogs";
import { useDiscoveryFeed } from "../hooks/useDiscoveryFeed";
import { useSuggestedAccounts } from "../hooks/useSuggestedAccounts";
import { useLogLikes } from "../hooks/useLogLikes";
import { useLikeMutations } from "../hooks/useLikeMutations";
import { useCommentCounts } from "../hooks/useCommentCounts";
import { mergeFeedEntries } from "../lib/mergedFeed";

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const WINDOW_DAYS_BACK = 7;
const ACTIVITY_PREVIEW_LIMIT = 4;

export function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const navigate = useNavigate();

  const { from, to } = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const windowStart = new Date(todayStart);
    windowStart.setDate(windowStart.getDate() - WINDOW_DAYS_BACK);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    return {
      from: windowStart.toISOString(),
      to: tomorrowStart.toISOString(),
    };
  }, []);

  const { data: matches, isLoading, isError: isMatchesError, refetch: refetchMatches } = useMatches({ from, to });
  const { data: myLogs } = useMyLogs();
  const monthStats = useMonthStats();
  const weeklyStreak = useWeeklyStreak();
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);

  const { data: following } = useFollowing();
  const { follow, unfollow } = useFollowMutations();
  const followedIds = following ? [...following] : [];
  const hasFollows = followedIds.length > 0;
  const feed = useActivityFeed(followedIds);
  const customFeed = useActivityFeedCustomLogs(followedIds);
  const discovery = useDiscoveryFeed(isSignedIn === true && !hasFollows);
  const suggestedAccounts = useSuggestedAccounts(hasFollows ? undefined : user?.id);
  const previewEntries = (
    hasFollows
      ? mergeFeedEntries(feed.data?.pages[0] ?? [], customFeed.data ?? [])
      : mergeFeedEntries(discovery.data ?? [], [])
  ).slice(0, ACTIVITY_PREVIEW_LIMIT);
  const isPreviewError = hasFollows ? feed.isError || customFeed.isError : discovery.isError;
  const refetchPreview = hasFollows
    ? () => {
        feed.refetch();
        customFeed.refetch();
      }
    : discovery.refetch;
  const { like, unlike } = useLikeMutations();
  const { data: likes } = useLogLikes(
    previewEntries.filter((e) => e.kind === "log").map((e) => e.log.id),
  );
  const { data: logCommentCounts } = useCommentCounts(
    "log",
    previewEntries.filter((e) => e.kind === "log").map((e) => e.log.id),
  );
  const { data: customLogCommentCounts } = useCommentCounts(
    "custom-log",
    previewEntries.filter((e) => e.kind === "custom").map((e) => e.customLog.id),
  );

  function handleToggleFollow(targetUserId: string) {
    if (following?.has(targetUserId)) unfollow.mutate(targetUserId);
    else follow.mutate(targetUserId);
  }

  function handleToggleLike(logId: string) {
    if (likes?.get(logId)?.likedByMe) unlike.mutate(logId);
    else like.mutate(logId);
  }

  function isFollowTargetPending(targetUserId: string): boolean {
    return (
      (follow.isPending && follow.variables === targetUserId) ||
      (unfollow.isPending && unfollow.variables === targetUserId)
    );
  }

  function isLikeTargetPending(logId: string): boolean {
    return (
      (like.isPending && like.variables === logId) ||
      (unlike.isPending && unlike.variables === logId)
    );
  }

  const activeMatch = matches?.find((m) => m.id === activeMatchId);
  const isNewAccount = myLogs !== undefined && myLogs.size === 0;

  if (isLoaded && !isSignedIn) {
    return (
      <div>
        <LandingHero />
        <LandingFlowDemo />
        <LandingActivityPreview />
        <LandingDifferentiation />
        <LandingFinalCta />
      </div>
    );
  }

  return (
    <div className="max-w-[1180px] mx-auto px-5 md:px-8 py-7">
      <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] [font-stretch:110%] text-[28px] md:text-[30px]">
        Accueil
      </h1>

      {isNewAccount && (
        <div className="carte p-5 mt-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="font-display font-bold text-[15px]">
              Bienvenue sur Eleven Logs
            </div>
            <p className="text-gris-fonce text-[13px] mt-1 max-w-[52ch]">
              Note ton premier match : une note sur 10, un homme du match si
              tu veux, et c'est parti.
            </p>
          </div>
          <Button onClick={() => navigate("/matchs")}>Voir les matchs</Button>
        </div>
      )}

      <div className="mt-6">
        <StreakBanner streak={weeklyStreak} />
      </div>

      {!hasFollows && (suggestedAccounts.data?.length ?? 0) > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-3.5 mb-3">
            <h2 className="font-data text-[10.5px] tracking-[0.13em] uppercase text-gris-fonce">
              Comptes à suivre
            </h2>
            <span className="flex-1 h-px bg-ligne" />
          </div>
          <SuggestedAccounts
            accounts={suggestedAccounts.data ?? []}
            isFollowing={(userId) => following?.has(userId) ?? false}
            onToggleFollow={handleToggleFollow}
            isFollowPending={isFollowTargetPending}
          />
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center gap-3.5 mb-3">
          <h2 className="font-data text-[10.5px] tracking-[0.13em] uppercase text-gris-fonce">
            Ça bouge chez tes amis
          </h2>
          <span className="flex-1 h-px bg-ligne" />
          <button
            type="button"
            className="font-data text-[10.5px] text-projecteur uppercase tracking-[0.08em] shrink-0"
            onClick={() => navigate("/activite")}
          >
            Voir tout →
          </button>
        </div>

        {isPreviewError ? (
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-carton text-[13px]">
              Impossible de charger l'activité récente.
            </p>
            <Button variant="secondaire" size="sm" onClick={() => refetchPreview()}>
              Réessayer
            </Button>
          </div>
        ) : previewEntries.length === 0 ? (
          <p className="text-gris-fonce text-[13px]">
            {hasFollows
              ? "Rien de récent chez les comptes que tu suis."
              : "Aucun log public pour l'instant."}
          </p>
        ) : (
          <div className="grid gap-3">
            {previewEntries.map((entry) =>
              entry.kind === "log" ? (
                <ActivityFeedItem
                  key={`log-${entry.log.id}`}
                  item={entry.log}
                  isFollowing={following?.has(entry.log.userId) ?? false}
                  isOwnLog={entry.log.userId === user?.id}
                  onToggleFollow={handleToggleFollow}
                  isFollowPending={isFollowTargetPending(entry.log.userId)}
                  likeCount={likes?.get(entry.log.id)?.count ?? 0}
                  likedByMe={likes?.get(entry.log.id)?.likedByMe ?? false}
                  onToggleLike={handleToggleLike}
                  isLikePending={isLikeTargetPending(entry.log.id)}
                  commentCount={logCommentCounts?.get(entry.log.id) ?? 0}
                />
              ) : (
                <ActivityFeedCustomLogItem
                  key={`custom-${entry.customLog.id}`}
                  item={entry.customLog}
                  isFollowing={following?.has(entry.customLog.userId) ?? false}
                  isOwnLog={entry.customLog.userId === user?.id}
                  onToggleFollow={handleToggleFollow}
                  isFollowPending={isFollowTargetPending(entry.customLog.userId)}
                  commentCount={customLogCommentCounts?.get(entry.customLog.id) ?? 0}
                />
              ),
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3.5 mt-8 mb-3">
        <h2 className="font-data text-[10.5px] tracking-[0.13em] uppercase text-gris-fonce">
          Ce mois-ci
        </h2>
        <span className="flex-1 h-px bg-ligne" />
      </div>

      <MonthStatsPanel stats={monthStats} />

      <div className="flex items-center gap-3.5 mt-8 mb-3">
        <h2 className="font-data text-[10.5px] tracking-[0.13em] uppercase text-gris-fonce">
          À ne pas rater cette semaine
        </h2>
        <span className="flex-1 h-px bg-ligne" />
      </div>

      {isLoading && (
        <p className="text-gris-fonce text-[13px]">Chargement…</p>
      )}

      {!isLoading && isMatchesError && (
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-carton text-[13px]">
            Impossible de charger les matchs.
          </p>
          <Button variant="secondaire" size="sm" onClick={() => refetchMatches()}>
            Réessayer
          </Button>
        </div>
      )}

      {!isLoading && !isMatchesError && (
        <MatchAgenda
          matches={matches ?? []}
          myLogs={myLogs}
          onOpenLog={(matchId) => setActiveMatchId(matchId)}
        />
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
