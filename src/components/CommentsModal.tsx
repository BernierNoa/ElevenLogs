import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useUser } from "@clerk/react-router";
import { Button } from "./ui/Button";
import { Textarea } from "./ui/Textarea";
import { useComments } from "../hooks/useComments";
import { useCommentMutations } from "../hooks/useCommentMutations";
import { formatRelativeTime } from "../lib/formatRelativeTime";
import type { CommentTarget } from "../lib/commentMapping";

export interface CommentsModalProps {
  target: CommentTarget;
  targetId: string;
  /** user_id de l'auteur de l'avis commenté — l'auteur peut modérer les
   * commentaires laissés sous son propre avis, en plus de l'auteur de
   * chaque commentaire qui peut retirer le sien. */
  targetOwnerId: string;
  onClose: () => void;
}

const MAX_LENGTH = 500;

// Portée dans document.body, même raison que FollowListModal/LogMatchModal :
// échapper au containing block du backdrop-blur de la barre sticky.
export function CommentsModal({ target, targetId, targetOwnerId, onClose }: CommentsModalProps) {
  const { user } = useUser();
  const { data: comments, isLoading, isError, refetch } = useComments(target, targetId);
  const { addComment, deleteComment } = useCommentMutations(target);
  const [body, setBody] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    addComment.mutate(
      { targetId, body: trimmed },
      { onSuccess: () => setBody("") },
    );
  }

  function canModerate(commentUserId: string): boolean {
    return !!user && (commentUserId === user.id || targetOwnerId === user.id);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center sm:p-5"
      onClick={onClose}
    >
      <div
        className="carte w-full sm:max-w-[440px] max-h-[80vh] sm:max-h-[85vh] flex flex-col rounded-b-none sm:rounded-[16px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden w-10 h-1 rounded-full bg-ligne mx-auto mb-4" />

        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="font-display font-bold [font-stretch:104%] text-[16px]">
            Commentaires
          </h2>
          <Button variant="discret" iconOnly aria-label="Fermer" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading && <p className="text-gris-fonce text-[13px]">Chargement…</p>}

          {!isLoading && isError && (
            <div>
              <p className="text-carton text-[13px] mb-3">
                Impossible de charger les commentaires. Réessaie plus tard.
              </p>
              <Button variant="secondaire" size="sm" onClick={() => refetch()}>
                Réessayer
              </Button>
            </div>
          )}

          {!isLoading && !isError && (comments?.length ?? 0) === 0 && (
            <p className="text-gris-fonce text-[13px]">
              Aucun commentaire pour l'instant.
            </p>
          )}

          {!isError && (comments?.length ?? 0) > 0 && (
            <div className="space-y-3.5">
              {comments!.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  {c.avatarUrl ? (
                    <img
                      src={c.avatarUrl}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                    />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-nuit-haute shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold truncate">
                        {c.displayName}
                      </span>
                      <span className="font-data text-[10px] text-gris-fonce uppercase tracking-[0.06em] shrink-0">
                        {formatRelativeTime(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-[13.5px] text-gris mt-0.5 break-words">{c.body}</p>
                  </div>
                  {canModerate(c.userId) && (
                    <button
                      type="button"
                      className="font-data text-[10px] text-gris-fonce uppercase tracking-[0.06em] hover:text-carton transition-colors shrink-0"
                      disabled={
                        deleteComment.isPending &&
                        deleteComment.variables?.commentId === c.id
                      }
                      onClick={() => deleteComment.mutate({ commentId: c.id, targetId })}
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {user && (
          <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-ligne shrink-0">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, MAX_LENGTH))}
              placeholder="Ajouter un commentaire…"
              rows={2}
              className="mb-2"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                isLoading={addComment.isPending}
                disabled={!body.trim()}
              >
                Envoyer
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
