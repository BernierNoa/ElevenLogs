import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/react-router";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/Button";
import { ActivityFeedItem } from "../components/ActivityFeedItem";
import { ActivityFeedCustomLogItem } from "../components/ActivityFeedCustomLogItem";
import { UserSearch } from "../components/UserSearch";
import { useFollowing } from "../hooks/useFollowing";
import { useFollowMutations } from "../hooks/useFollowMutations";
import { useActivityFeed } from "../hooks/useActivityFeed";
import { useActivityFeedCustomLogs } from "../hooks/useActivityFeedCustomLogs";
import { useDiscoveryFeed } from "../hooks/useDiscoveryFeed";
import { useLogLikes } from "../hooks/useLogLikes";
import { useLikeMutations } from "../hooks/useLikeMutations";
import { useCommentCounts } from "../hooks/useCommentCounts";
import { mergeFeedEntries } from "../lib/mergedFeed";
import { showToast } from "../lib/toastStore";

export function Activity() {
  const { isLoaded, isSignedIn, user } = useUser();
  const navigate = useNavigate();

  const { data: following } = useFollowing();
  const { follow, unfollow } = useFollowMutations();
  const followedIds = following ? [...following] : [];

  const feed = useActivityFeed(followedIds);
  const customFeed = useActivityFeedCustomLogs(followedIds);
  const hasFollows = followedIds.length > 0;
  const discovery = useDiscoveryFeed(isSignedIn === true && !hasFollows);
  const { like, unlike } = useLikeMutations();

  const feedItems = feed.data?.pages.flat() ?? [];
  const mergedEntries = mergeFeedEntries(feedItems, customFeed.data ?? []);

  const mergedEntryIds = useMemo(
    () =>
      mergedEntries.map((entry) =>
        entry.kind === "log" ? entry.log.id : entry.customLog.id,
      ),
    [mergedEntries],
  );
  const mergedEntryIdsKey = mergedEntryIds.join("|");

  const initHighlightRef = useRef(false);
  const seenEntryIdsRef = useRef<Set<string>>(new Set());
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!initHighlightRef.current) {
      for (const id of mergedEntryIds) seenEntryIdsRef.current.add(id);
      initHighlightRef.current = true;
      return;
    }

    const newIds = mergedEntryIds.filter(
      (id) => !seenEntryIdsRef.current.has(id),
    );

    if (newIds.length === 0) return;

    for (const id of newIds) seenEntryIdsRef.current.add(id);
    setHighlightIds(new Set(newIds));

    const t = window.setTimeout(() => setHighlightIds(new Set()), 4500);
    return () => window.clearTimeout(t);
  }, [mergedEntryIdsKey]);
  const visibleItems = hasFollows ? feedItems : discovery.data ?? [];
  const { data: likes } = useLogLikes(visibleItems.map((i) => i.id));
  const { data: logCommentCounts } = useCommentCounts("log", visibleItems.map((i) => i.id));
  const { data: customLogCommentCounts } = useCommentCounts(
    "custom-log",
    hasFollows ? (customFeed.data ?? []).map((c) => c.id) : [],
  );

  function handleToggleFollow(targetUserId: string) {
    const mutation = following?.has(targetUserId) ? unfollow : follow;
    mutation.mutate(targetUserId, {
      onError: () => showToast("Action impossible pour l'instant."),
    });
  }

  function handleToggleLike(logId: string) {
    const mutation = likes?.get(logId)?.likedByMe ? unlike : like;
    mutation.mutate(logId, {
      onError: () => showToast("Action impossible pour l'instant."),
    });
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

  if (isLoaded && !isSignedIn) {
    return (
      <div className="max-w-[1180px] mx-auto px-5 md:px-8 py-7">
        <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] [font-stretch:110%] text-[28px] md:text-[30px]">
          Activité
        </h1>
        <p className="text-gris text-[13.5px] mt-2 max-w-[62ch] mb-5">
          Connecte-toi pour voir les logs des comptes que tu suis.
        </p>
        <Button onClick={() => navigate("/connexion")}>Se connecter</Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1180px] mx-auto px-5 md:px-8 py-7">
      <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] [font-stretch:110%] text-[28px] md:text-[30px]">
        Activité
      </h1>
      <p className="text-gris text-[13.5px] mt-2 max-w-[62ch]">
        Suis des comptes pour voir leurs avis sur les matchs : cherche-les
        ci-dessous, leurs logs arriveront ensuite dans ton fil.
      </p>

      <div className="mt-5">
        <UserSearch />
      </div>

      <h2 className="champ-label mt-8 pt-5 border-t border-ligne">
        Fil d'activité
      </h2>

      {hasFollows ? (
        <>
          <p className="text-gris text-[13.5px] mt-2 max-w-[62ch]">
            Les derniers logs des comptes que tu suis.
          </p>

          {(feed.isLoading || customFeed.isLoading) && (
            <p className="text-gris-fonce text-[13px] mt-8">Chargement…</p>
          )}

          {(feed.isError || customFeed.isError) && (
            <p className="text-carton text-[13px] mt-8">
              Impossible de charger le fil d'activité. Réessaie plus tard.
            </p>
          )}

          {!feed.isLoading &&
            !customFeed.isLoading &&
            !feed.isError &&
            !customFeed.isError &&
            mergedEntries.length === 0 && (
              <p className="text-gris-fonce text-[13px] mt-8">
                Les comptes que tu suis n'ont rien loggé récemment.
              </p>
            )}

          {mergedEntries.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-7">
              {mergedEntries.map((entry) =>
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
                    highlighted={highlightIds.has(entry.log.id)}
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
                    highlighted={highlightIds.has(entry.customLog.id)}
                  />
                ),
              )}
            </div>
          )}

          {feed.hasNextPage && (
            <div className="flex flex-col items-center gap-2 mt-6">
              {feed.isFetchNextPageError && (
                <p className="text-carton text-[13px]">
                  Impossible de charger la suite. Réessaie.
                </p>
              )}
              <Button
                variant="secondaire"
                onClick={() => feed.fetchNextPage()}
                isLoading={feed.isFetchingNextPage}
              >
                {feed.isFetchNextPageError ? "Réessayer" : "Charger plus"}
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-gris text-[13.5px] mt-2 max-w-[62ch]">
            Tu ne suis personne pour l'instant : utilise la recherche
            ci-dessus pour trouver des comptes à suivre. En attendant, voici
            les derniers logs publics de la plateforme.
          </p>

          {discovery.isLoading && (
            <p className="text-gris-fonce text-[13px] mt-8">Chargement…</p>
          )}

          {discovery.isError && (
            <p className="text-carton text-[13px] mt-8">
              Impossible de charger les logs publics. Réessaie plus tard.
            </p>
          )}

          {!discovery.isLoading &&
            !discovery.isError &&
            (discovery.data?.length ?? 0) === 0 && (
              <p className="text-gris-fonce text-[13px] mt-8">
                Aucun log public pour l'instant.
              </p>
            )}

          {discovery.data && discovery.data.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-7">
              {discovery.data.map((item) => (
                <ActivityFeedItem
                  key={item.id}
                  item={item}
                  isFollowing={following?.has(item.userId) ?? false}
                  isOwnLog={item.userId === user?.id}
                  onToggleFollow={handleToggleFollow}
                  isFollowPending={isFollowTargetPending(item.userId)}
                  likeCount={likes?.get(item.id)?.count ?? 0}
                  likedByMe={likes?.get(item.id)?.likedByMe ?? false}
                  onToggleLike={handleToggleLike}
                  isLikePending={isLikeTargetPending(item.id)}
                  commentCount={logCommentCounts?.get(item.id) ?? 0}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
