import { useMemo } from "react";
import { useUser } from "@clerk/react-router";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { ActivityFeedItem } from "../components/ActivityFeedItem";
import { useWeeklyLogs } from "../hooks/useWeeklyLogs";
import { useLogLikes } from "../hooks/useLogLikes";
import { useLikeMutations } from "../hooks/useLikeMutations";
import { useCommentCounts } from "../hooks/useCommentCounts";
import { useFollowing } from "../hooks/useFollowing";
import { useFollowMutations } from "../hooks/useFollowMutations";
import { showToast } from "../lib/toastStore";
import type { FeedLogItem } from "../lib/feedMapping";

const TOP_MATCH_LOGS_LIMIT = 5;
const WEEKLY_BEST_LIMIT = 10;

export function Decouverte() {
  const { isLoaded, isSignedIn, user } = useUser();
  const navigate = useNavigate();

  const weekly = useWeeklyLogs();
  const items = useMemo(() => weekly.data ?? [], [weekly.data]);

  const { data: following } = useFollowing();
  const { follow, unfollow } = useFollowMutations();
  const { like, unlike } = useLikeMutations();
  const { data: likes } = useLogLikes(items.map((i) => i.id));
  const { data: commentCounts } = useCommentCounts("log", items.map((i) => i.id));

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

  function sortByLikes(list: FeedLogItem[]): FeedLogItem[] {
    return [...list].sort(
      (a, b) => (likes?.get(b.id)?.count ?? 0) - (likes?.get(a.id)?.count ?? 0),
    );
  }

  const topMatchId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item.match.id, (counts.get(item.match.id) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }, [items]);

  const topMatchItems = items.filter((i) => i.match.id === topMatchId);
  const topMatch = topMatchItems[0]?.match ?? null;
  const topMatchBest = sortByLikes(topMatchItems).slice(0, TOP_MATCH_LOGS_LIMIT);
  const weeklyBest = sortByLikes(items).slice(0, WEEKLY_BEST_LIMIT);

  if (isLoaded && !isSignedIn) {
    return (
      <div className="max-w-[1180px] mx-auto px-5 md:px-8 py-7">
        <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] [font-stretch:110%] text-[28px] md:text-[30px]">
          Découverte
        </h1>
        <p className="text-gris text-[13.5px] mt-2 max-w-[62ch] mb-5">
          Connecte-toi pour découvrir le match de la semaine et les logs les
          plus aimés.
        </p>
        <Button onClick={() => navigate("/connexion")}>Se connecter</Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1180px] mx-auto px-5 md:px-8 py-7">
      <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] [font-stretch:110%] text-[28px] md:text-[30px]">
        Découverte
      </h1>
      <p className="text-gris text-[13.5px] mt-2 max-w-[62ch]">
        Le match le plus loggé et les avis les plus aimés des 7 derniers
        jours.
      </p>

      {weekly.isLoading && (
        <p className="text-gris-fonce text-[13px] mt-8">Chargement…</p>
      )}

      {weekly.isError && (
        <p className="text-carton text-[13px] mt-8">
          Impossible de charger la découverte. Réessaie plus tard.
        </p>
      )}

      {!weekly.isLoading && !weekly.isError && items.length === 0 && (
        <p className="text-gris-fonce text-[13px] mt-8">
          Rien à découvrir cette semaine — reviens un peu plus tard.
        </p>
      )}

      {topMatch && (
        <div className="mt-8">
          <div className="flex items-center gap-3.5 mb-3">
            <h2 className="font-data text-[10.5px] tracking-[0.13em] uppercase text-gris-fonce">
              Le match de la semaine
            </h2>
            <span className="flex-1 h-px bg-ligne" />
          </div>

          <div className="carte p-5 mb-5">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <Badge variant="comp">{topMatch.competitionName}</Badge>
              <span className="font-data text-[10.5px] text-gris-fonce uppercase tracking-[0.06em]">
                {topMatchItems.length} log{topMatchItems.length > 1 ? "s" : ""}{" "}
                cette semaine
              </span>
            </div>
            <div className="font-display font-bold [font-stretch:104%] text-[18px]">
              {topMatch.homeTeamName}
              {topMatch.homeScore !== null && topMatch.awayScore !== null && (
                <span className="chiffres text-gris-fonce mx-1.5">
                  {topMatch.homeScore}–{topMatch.awayScore}
                </span>
              )}
              {" – "}
              {topMatch.awayTeamName}
            </div>
          </div>

          <h3 className="font-display font-bold text-[14px] mb-3">
            Les avis les plus aimés
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topMatchBest.map((item) => (
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
                commentCount={commentCounts?.get(item.id) ?? 0}
              />
            ))}
          </div>
        </div>
      )}

      {weeklyBest.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-3.5 mb-3">
            <h2 className="font-data text-[10.5px] tracking-[0.13em] uppercase text-gris-fonce">
              Meilleurs logs de la semaine
            </h2>
            <span className="flex-1 h-px bg-ligne" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {weeklyBest.map((item) => (
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
                commentCount={commentCounts?.get(item.id) ?? 0}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
