import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { useUser } from "@clerk/react-router";
import { storePendingInvite } from "../lib/inviteStorage";
import { Button } from "../components/ui/Button";
import { ActivityFeedItem } from "../components/ActivityFeedItem";
import { FollowListModal } from "../components/FollowListModal";
import type { FollowListKind } from "../hooks/useFollowList";
import { useProfileSettings } from "../hooks/useProfileSettings";
import { usePublicProfileLogs } from "../hooks/usePublicProfileLogs";
import { usePublicProfileCustomLogs } from "../hooks/usePublicProfileCustomLogs";
import { ActivityFeedCustomLogItem } from "../components/ActivityFeedCustomLogItem";
import { mergeFeedEntries } from "../lib/mergedFeed";
import { useFollowing } from "../hooks/useFollowing";
import { useFollowMutations } from "../hooks/useFollowMutations";
import { useFollowCounts } from "../hooks/useFollowCounts";
import { useBlockedUsers } from "../hooks/useBlockedUsers";
import { useBlockMutations } from "../hooks/useBlockMutations";
import { useLogLikes } from "../hooks/useLogLikes";
import { useLikeMutations } from "../hooks/useLikeMutations";
import { useCommentCounts } from "../hooks/useCommentCounts";
import { useSeasonStats } from "../hooks/useSeasonStats";
import { SeasonStatsView } from "../components/SeasonStatsView";
import { ComparisonCard } from "../components/profile/ComparisonCard";
import { showToast } from "../lib/toastStore";

type ProfileTab = "avis" | "stats";

export function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!userId || searchParams.get("invite") !== "1") return;
    storePendingInvite(userId);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("invite");
        return next;
      },
      { replace: true },
    );
  }, [userId, searchParams, setSearchParams]);
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = useProfileSettings(userId);
  const {
    data: logs,
    isLoading: logsLoading,
    isError: logsError,
    refetch: refetchLogs,
  } = usePublicProfileLogs(userId);
  const {
    data: customLogs,
    isLoading: customLogsLoading,
    isError: customLogsError,
    refetch: refetchCustomLogs,
  } = usePublicProfileCustomLogs(userId);
  const { data: following } = useFollowing();
  const { follow, unfollow } = useFollowMutations();
  const { data: blockedUsers } = useBlockedUsers();
  const { block, unblock } = useBlockMutations();
  const { data: followCounts } = useFollowCounts(userId);
  const { like, unlike } = useLikeMutations();
  const { data: likes } = useLogLikes((logs ?? []).map((l) => l.id));
  const { data: logCommentCounts } = useCommentCounts("log", (logs ?? []).map((l) => l.id));
  const { data: customLogCommentCounts } = useCommentCounts(
    "custom-log",
    (customLogs ?? []).map((c) => c.id),
  );
  const [openList, setOpenList] = useState<FollowListKind | null>(null);
  const [tab, setTab] = useState<ProfileTab>("avis");
  const [showComparison, setShowComparison] = useState(false);
  const seasonStats = useSeasonStats(userId);
  const myStats = useSeasonStats(currentUser?.id);

  const isOwnProfile = currentUser?.id === userId;
  const isFollowing = following?.has(userId ?? "") ?? false;
  const isBlocked = blockedUsers?.has(userId ?? "") ?? false;
  const isPrivate = profile?.profile_visibility === "private";

  const feedEntries = mergeFeedEntries(logs ?? [], customLogs ?? []);
  const contentLoading = logsLoading || customLogsLoading;
  const contentError = logsError || customLogsError;

  function refetchContent() {
    refetchLogs();
    refetchCustomLogs();
  }

  function handleToggleFollow() {
    if (!userId) return;
    const mutation = isFollowing ? unfollow : follow;
    mutation.mutate(userId, {
      onError: () => showToast("Action impossible pour l'instant."),
    });
  }

  function handleToggleLike(logId: string) {
    if (likes?.get(logId)?.likedByMe) unlike.mutate(logId);
    else like.mutate(logId);
  }

  function isLikeTargetPending(logId: string): boolean {
    return (
      (like.isPending && like.variables === logId) ||
      (unlike.isPending && unlike.variables === logId)
    );
  }

  return (
    <div className="max-w-[1180px] mx-auto px-5 md:px-8 py-7">
      {profileLoading && (
        <p className="text-gris-fonce text-[13px]">Chargement…</p>
      )}

      {!profileLoading && profileError && (
        <div>
          <p className="text-carton text-[13.5px] mb-3">
            Impossible de charger ce profil. Réessaie plus tard.
          </p>
          <Button variant="secondaire" size="sm" onClick={() => refetchProfile()}>
            Réessayer
          </Button>
        </div>
      )}

      {!profileLoading && !profileError && !profile && (
        <p className="text-gris text-[13.5px]">Ce profil n'existe pas.</p>
      )}

      {profile && (
        <>
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-16 h-16 rounded-full object-cover shrink-0"
              />
            ) : (
              <span className="w-16 h-16 rounded-full bg-nuit-haute shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="font-display font-bold text-[18px] truncate">
                {profile.display_name}
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <button
                  type="button"
                  className="font-data text-[11px] text-gris uppercase tracking-[0.06em] hover:text-craie transition-colors"
                  onClick={() => setOpenList("followers")}
                >
                  <span className="chiffres text-craie font-semibold">
                    {followCounts?.followers ?? 0}
                  </span>{" "}
                  abonnés
                </button>
                <button
                  type="button"
                  className="font-data text-[11px] text-gris uppercase tracking-[0.06em] hover:text-craie transition-colors"
                  onClick={() => setOpenList("following")}
                >
                  <span className="chiffres text-craie font-semibold">
                    {followCounts?.following ?? 0}
                  </span>{" "}
                  abonnements
                </button>
              </div>
              {isPrivate && (
                <div className="font-data text-[10px] text-gris-fonce uppercase tracking-[0.08em] mt-1.5">
                  Profil privé
                </div>
              )}
            </div>
            {!isOwnProfile && userId && (
              <div className="flex items-center gap-2 shrink-0">
                {!isBlocked && (
                  <Button
                    variant={isFollowing ? "secondaire" : "primaire"}
                    size="sm"
                    onClick={handleToggleFollow}
                    isLoading={follow.isPending || unfollow.isPending}
                  >
                    {isFollowing ? "Suivi" : "Suivre"}
                  </Button>
                )}
                <Button
                  variant={isBlocked ? "secondaire" : "destructif"}
                  size="sm"
                  onClick={() =>
                    (isBlocked ? unblock : block).mutate(userId, {
                      onError: () => showToast("Action impossible pour l'instant."),
                    })
                  }
                  isLoading={block.isPending || unblock.isPending}
                >
                  {isBlocked ? "Débloquer" : "Bloquer"}
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="button"
              className={["filtre-chip", tab === "avis" ? "actif" : ""].join(" ")}
              onClick={() => setTab("avis")}
            >
              Avis
            </button>
            <button
              type="button"
              className={["filtre-chip", tab === "stats" ? "actif" : ""].join(" ")}
              onClick={() => setTab("stats")}
            >
              Stats
            </button>
          </div>

          {tab === "avis" && (
            <div className="mt-6">
              {contentLoading && (
                <p className="text-gris-fonce text-[13px]">Chargement…</p>
              )}

              {!contentLoading && contentError && (
                <div>
                  <p className="text-carton text-[13px] mb-3">
                    Impossible de charger les logs. Réessaie plus tard.
                  </p>
                  <Button variant="secondaire" size="sm" onClick={refetchContent}>
                    Réessayer
                  </Button>
                </div>
              )}

              {!contentLoading && !contentError && isPrivate && !isOwnProfile && (
                <p className="text-gris-fonce text-[13px]">
                  Ce profil est privé — seul son propriétaire voit ses logs.
                </p>
              )}

              {!contentLoading &&
                !contentError &&
                (!isPrivate || isOwnProfile) &&
                feedEntries.length === 0 && (
                  <p className="text-gris-fonce text-[13px]">
                    Aucun log {isOwnProfile ? "" : "public "}pour l'instant.
                  </p>
                )}

              {!contentError && feedEntries.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {feedEntries.map((entry) =>
                    entry.kind === "log" ? (
                      <ActivityFeedItem
                        key={`log-${entry.log.id}`}
                        item={entry.log}
                        isFollowing={isFollowing}
                        isOwnLog={isOwnProfile}
                        onToggleFollow={handleToggleFollow}
                        isFollowPending={follow.isPending || unfollow.isPending}
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
                        isFollowing={isFollowing}
                        isOwnLog={isOwnProfile}
                        onToggleFollow={handleToggleFollow}
                        isFollowPending={follow.isPending || unfollow.isPending}
                        commentCount={customLogCommentCounts?.get(entry.customLog.id) ?? 0}
                      />
                    ),
                  )}
                </div>
              )}
            </div>
          )}

          {tab === "stats" && userId && (
            <div className="mt-6">
              {isPrivate && !isOwnProfile ? (
                <p className="text-gris-fonce text-[13px]">
                  Ce profil est privé — seul son propriétaire voit ses stats.
                </p>
              ) : seasonStats.isLoading ? (
                <p className="text-gris-fonce text-[13px]">Chargement…</p>
              ) : seasonStats.isError ? (
                <div>
                  <p className="text-carton text-[13px] mb-3">
                    Impossible de charger les statistiques. Réessaie plus tard.
                  </p>
                  <Button variant="secondaire" size="sm" onClick={() => seasonStats.refetch()}>
                    Réessayer
                  </Button>
                </div>
              ) : (
                <>
                  {!isOwnProfile && currentUser && (
                    <div className="mb-5">
                      <Button
                        variant="secondaire"
                        size="sm"
                        onClick={() => setShowComparison((v) => !v)}
                      >
                        {showComparison ? "Masquer le comparatif" : "Comparer avec moi"}
                      </Button>

                      {showComparison && (
                        <div className="mt-4">
                          {myStats.isLoading ? (
                            <p className="text-gris-fonce text-[13px]">
                              Chargement de tes stats…
                            </p>
                          ) : myStats.isError ? (
                            <div>
                              <p className="text-carton text-[13px] mb-3">
                                Impossible de charger tes statistiques. Réessaie plus tard.
                              </p>
                              <Button
                                variant="secondaire"
                                size="sm"
                                onClick={() => myStats.refetch()}
                              >
                                Réessayer
                              </Button>
                            </div>
                          ) : (
                            <ComparisonCard
                              mine={myStats}
                              theirs={seasonStats}
                              theirName={profile.display_name}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <SeasonStatsView stats={seasonStats} logOwnerId={userId} readOnly={!isOwnProfile} />
                </>
              )}
            </div>
          )}
        </>
      )}

      {openList && userId && (
        <FollowListModal
          userId={userId}
          kind={openList}
          onClose={() => setOpenList(null)}
        />
      )}
    </div>
  );
}
