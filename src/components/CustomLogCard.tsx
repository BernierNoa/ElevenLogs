import { useState } from "react";
import { useUser } from "@clerk/react-router";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { LedRatingBar } from "./LedRatingBar";
import { CommentsModal } from "./CommentsModal";
import type { CustomLogItem } from "../hooks/useCustomLogs";

export interface CustomLogCardProps {
  customLog: CustomLogItem;
  onEdit?: () => void;
  commentCount?: number;
  /** Vrai quand la carte affiche le match personnalisé de quelqu'un d'autre
   * (onglet Stats d'un profil public) : masque "Modifier". */
  readOnly?: boolean;
  /** user_id propriétaire de customLog — targetOwnerId pour la modale de
   * commentaires. Par défaut le compte connecté ; à fournir explicitement en
   * readOnly pour ne pas donner à tort des droits de modération au visiteur. */
  logOwnerId?: string;
  /** Ouvre le partage de story directement depuis la carte (cf. Journal),
   * même raccourci que MatchCard.onShare. Absent en lecture seule. */
  onShare?: () => void;
}

function formatWatchedAt(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function CustomLogCard({
  customLog,
  onEdit,
  commentCount = 0,
  readOnly = false,
  logOwnerId,
  onShare,
}: CustomLogCardProps) {
  const { user } = useUser();
  const [isCommenting, setIsCommenting] = useState(false);
  const commentTargetOwnerId = logOwnerId ?? user?.id;
  const isMultiplex = customLog.matches.length > 1;

  return (
    <Card logged>
      <div className="flex items-center justify-between gap-2.5 mb-3.5">
        <span className="font-data text-[10.5px] text-gris-fonce uppercase tracking-[0.09em]">
          {formatWatchedAt(customLog.watchedAt)}
        </span>
        <Badge variant="comp">{isMultiplex ? `Multiplex · ${customLog.matches.length}` : "Perso"}</Badge>
      </div>

      <ul className="space-y-1 mb-3.5">
        {customLog.matches.map((match) => (
          <li
            key={match.id}
            className="font-display font-bold [font-stretch:104%] text-[15px] tracking-[-0.01em] truncate"
          >
            {match.name}
          </li>
        ))}
      </ul>

      {customLog.motmName && (
        <div className="mb-3.5">
          <Badge variant="motm">◆ {customLog.motmName}</Badge>
        </div>
      )}

      {customLog.comment && (
        <p className="text-gris text-[13px] mb-3.5 line-clamp-2">{customLog.comment}</p>
      )}

      <div className="pt-3.5 border-t border-ligne flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-20 shrink-0">
            <LedRatingBar value={customLog.rating} size="compact" showValue />
          </span>
          <button
            type="button"
            className="flex items-center gap-1 font-data text-[11px] tracking-[0.04em] text-gris-fonce hover:text-craie transition-colors shrink-0"
            onClick={() => setIsCommenting(true)}
          >
            <span aria-hidden="true">💬</span>
            {commentCount > 0 ? commentCount : ""}
          </button>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2 shrink-0">
            {onShare && (
              <Button
                variant="discret"
                size="sm"
                iconOnly
                aria-label="Partager en story"
                onClick={onShare}
              >
                📤
              </Button>
            )}
            <Button variant="secondaire" size="sm" onClick={onEdit}>
              Modifier
            </Button>
          </div>
        )}
      </div>

      {isCommenting && commentTargetOwnerId && (
        <CommentsModal
          target="custom-log"
          targetId={customLog.id}
          targetOwnerId={commentTargetOwnerId}
          onClose={() => setIsCommenting(false)}
        />
      )}
    </Card>
  );
}
