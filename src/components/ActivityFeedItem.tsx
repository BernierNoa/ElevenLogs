import { useState } from "react";
import { Link } from "react-router";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { LedRatingBar } from "./LedRatingBar";
import { CommentsModal } from "./CommentsModal";
import { formatRelativeTime } from "../lib/formatRelativeTime";
import { formatKickoff } from "../lib/formatDate";
import { useReportMutation } from "../hooks/useReportMutation";
import { showToast } from "../lib/toastStore";
import type { FeedLogItem } from "../lib/feedMapping";

const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "inapproprie", label: "Contenu inapproprié" },
  { value: "harcelement", label: "Harcèlement" },
] as const;

export interface ActivityFeedItemProps {
  item: FeedLogItem;
  isFollowing: boolean;
  isOwnLog: boolean;
  onToggleFollow: (userId: string) => void;
  isFollowPending?: boolean;
  likeCount?: number;
  likedByMe?: boolean;
  onToggleLike?: (logId: string) => void;
  isLikePending?: boolean;
  commentCount?: number;
  highlighted?: boolean;
}

export function ActivityFeedItem({
  item,
  isFollowing,
  isOwnLog,
  onToggleFollow,
  isFollowPending,
  likeCount = 0,
  likedByMe = false,
  onToggleLike,
  isLikePending,
  commentCount = 0,
  highlighted,
}: ActivityFeedItemProps) {
  const [isReporting, setIsReporting] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const report = useReportMutation();

  function handleReport(reason: string) {
    report.mutate(
      { logId: item.id, reason },
      {
        onSuccess: () => {
          showToast("Signalement envoyé, merci.");
          setIsReporting(false);
        },
        onError: () => showToast("Impossible d'envoyer le signalement."),
      },
    );
  }

  return (
    <Card
      className={
        highlighted
          ? "ring-2 ring-projecteur-fonce animate-[pulse_1.2s_ease-in-out_0s_3]"
          : undefined
      }
    >
      <div className="flex items-center justify-between gap-2.5 mb-3.5">
        <Link to={`/u/${item.userId}`} className="flex items-center gap-2.5 min-w-0">
          {item.avatarUrl ? (
            <img
              src={item.avatarUrl}
              alt=""
              className="w-7 h-7 rounded-full object-cover shrink-0"
            />
          ) : (
            <span className="w-7 h-7 rounded-full bg-nuit-haute shrink-0" />
          )}
          <span className="text-[13.5px] font-semibold truncate">{item.displayName}</span>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-data text-[10px] text-gris-fonce uppercase tracking-[0.06em]">
            {formatRelativeTime(item.createdAt)}
          </span>
          {!isOwnLog && (
            <Button
              size="sm"
              variant={isFollowing ? "secondaire" : "primaire"}
              onClick={() => onToggleFollow(item.userId)}
              isLoading={isFollowPending}
            >
              {isFollowing ? "Suivi" : "Suivre"}
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-data text-[10.5px] text-gris-fonce uppercase tracking-[0.09em]">
          {formatKickoff(item.match.kickoffAt)}
        </span>
        <Badge variant="comp">{item.match.competitionName}</Badge>
      </div>

      <div className="font-display font-bold [font-stretch:104%] text-[14.5px] mb-3">
        {item.match.homeTeamName}
        {item.match.homeScore !== null && item.match.awayScore !== null && (
          <span className="chiffres text-gris-fonce mx-1.5">
            {item.match.homeScore}–{item.match.awayScore}
          </span>
        )}
        {" – "}
        {item.match.awayTeamName}
      </div>

      <div className="flex items-center gap-3">
        <span className="w-24 shrink-0">
          <LedRatingBar value={item.rating} size="compact" showValue />
        </span>
        {item.motmName && <Badge variant="motm">◆ {item.motmName}</Badge>}
      </div>

      {item.comment && (
        <p className="quote mt-3">{item.comment}</p>
      )}

      <div className="mt-3 pt-3 border-t border-ligne flex items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={!onToggleLike || isLikePending}
            className={[
              "flex items-center gap-1.5 font-data text-[11px] tracking-[0.04em] transition-colors",
              likedByMe ? "text-projecteur" : "text-gris-fonce hover:text-craie",
            ].join(" ")}
            onClick={() => onToggleLike?.(item.id)}
          >
            <span aria-hidden="true">{likedByMe ? "♥" : "♡"}</span>
            {likeCount > 0 ? likeCount : "J'aime"}
          </button>

          <button
            type="button"
            className="flex items-center gap-1.5 font-data text-[11px] tracking-[0.04em] text-gris-fonce hover:text-craie transition-colors"
            onClick={() => setIsCommenting(true)}
          >
            <span aria-hidden="true">💬</span>
            {commentCount > 0 ? commentCount : "Commenter"}
          </button>
        </div>

        {!isOwnLog && !isReporting && (
          <button
            type="button"
            className="font-data text-[10px] text-gris-fonce uppercase tracking-[0.06em] hover:text-carton transition-colors"
            onClick={() => setIsReporting(true)}
          >
            Signaler
          </button>
        )}
      </div>

      {!isOwnLog && isReporting && (
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <span className="font-data text-[10px] text-gris-fonce uppercase tracking-[0.06em] mr-1">
            Motif :
          </span>
          {REPORT_REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              className="filtre-chip"
              disabled={report.isPending}
              onClick={() => handleReport(r.value)}
            >
              {r.label}
            </button>
          ))}
          <button
            type="button"
            className="font-data text-[10px] text-gris-fonce uppercase tracking-[0.06em] ml-1"
            onClick={() => setIsReporting(false)}
          >
            Annuler
          </button>
        </div>
      )}

      {isCommenting && (
        <CommentsModal
          target="log"
          targetId={item.id}
          targetOwnerId={item.userId}
          onClose={() => setIsCommenting(false)}
        />
      )}
    </Card>
  );
}
