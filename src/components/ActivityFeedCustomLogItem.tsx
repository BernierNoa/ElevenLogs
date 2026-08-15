import { useState } from "react";
import { Link } from "react-router";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { LedRatingBar } from "./LedRatingBar";
import { CommentsModal } from "./CommentsModal";
import { formatRelativeTime } from "../lib/formatRelativeTime";
import type { PublicCustomLogItem } from "../lib/customLogFeedMapping";

export interface ActivityFeedCustomLogItemProps {
  item: PublicCustomLogItem;
  isFollowing: boolean;
  isOwnLog: boolean;
  onToggleFollow: (userId: string) => void;
  isFollowPending?: boolean;
  commentCount?: number;
  highlighted?: boolean;
}

// Contrepartie de ActivityFeedItem pour les matchs personnalisés : pas de
// home/away/score/compétition (hors référentiel), pas de likes/signalement
// (log_likes et reports référencent logs(id), pas custom_logs — les
// réutiliser demanderait un schéma séparé, hors scope ici). Les
// commentaires, eux, ont leur propre table dédiée (custom_log_comments,
// cf. migration 20260810180000) donc sont bien supportés ici.
export function ActivityFeedCustomLogItem({
  item,
  isFollowing,
  isOwnLog,
  onToggleFollow,
  isFollowPending,
  commentCount = 0,
  highlighted,
}: ActivityFeedCustomLogItemProps) {
  const [isCommenting, setIsCommenting] = useState(false);
  const isMultiplex = item.matches.length > 1;

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

      <div className="flex items-center justify-end gap-2 mb-2">
        <Badge variant="comp">{isMultiplex ? `Multiplex · ${item.matches.length}` : "Perso"}</Badge>
      </div>

      <ul className="space-y-1 mb-3">
        {item.matches.map((match) => (
          <li
            key={match.id}
            className="font-display font-bold [font-stretch:104%] text-[14.5px] truncate"
          >
            {match.name}
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3">
        <span className="w-24 shrink-0">
          <LedRatingBar value={item.rating} size="compact" showValue />
        </span>
      </div>

      {item.comment && <p className="quote mt-3">{item.comment}</p>}

      <div className="mt-3 pt-3 border-t border-ligne flex items-center">
        <button
          type="button"
          className="flex items-center gap-1.5 font-data text-[11px] tracking-[0.04em] text-gris-fonce hover:text-craie transition-colors"
          onClick={() => setIsCommenting(true)}
        >
          <span aria-hidden="true">💬</span>
          {commentCount > 0 ? commentCount : "Commenter"}
        </button>
      </div>

      {isCommenting && (
        <CommentsModal
          target="custom-log"
          targetId={item.id}
          targetOwnerId={item.userId}
          onClose={() => setIsCommenting(false)}
        />
      )}
    </Card>
  );
}
