import { createPortal } from "react-dom";
import { Link } from "react-router";
import { useUser } from "@clerk/react-router";
import { Button } from "./ui/Button";
import { useFollowList, type FollowListKind } from "../hooks/useFollowList";
import { useFollowing } from "../hooks/useFollowing";
import { useFollowMutations } from "../hooks/useFollowMutations";

export interface FollowListModalProps {
  userId: string;
  kind: FollowListKind;
  onClose: () => void;
}

const TITLES: Record<FollowListKind, string> = {
  followers: "Abonnés",
  following: "Abonnements",
};

export function FollowListModal({ userId, kind, onClose }: FollowListModalProps) {
  const { user: currentUser } = useUser();
  const { data: entries, isLoading, isError, refetch } = useFollowList(userId, kind);
  const { data: following } = useFollowing();
  const { follow, unfollow } = useFollowMutations();

  function handleToggleFollow(targetUserId: string) {
    const mutation = following?.has(targetUserId) ? unfollow : follow;
    mutation.mutate(targetUserId);
  }

  // Portée dans document.body pour les mêmes raisons que LogMatchModal :
  // échapper au containing block créé par le backdrop-blur de la barre
  // sticky.
  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center sm:p-5"
      onClick={onClose}
    >
      <div
        className="carte w-full sm:max-w-[440px] max-h-[80vh] sm:max-h-[85vh] overflow-y-auto rounded-b-none sm:rounded-[16px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden w-10 h-1 rounded-full bg-ligne mx-auto mb-4" />

        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="font-display font-bold [font-stretch:104%] text-[16px]">
            {TITLES[kind]}
          </h2>
          <Button variant="discret" iconOnly aria-label="Fermer" onClick={onClose}>
            ✕
          </Button>
        </div>

        {isLoading && (
          <p className="text-gris-fonce text-[13px]">Chargement…</p>
        )}

        {!isLoading && isError && (
          <div>
            <p className="text-carton text-[13px] mb-3">
              Impossible de charger la liste. Réessaie plus tard.
            </p>
            <Button variant="secondaire" size="sm" onClick={() => refetch()}>
              Réessayer
            </Button>
          </div>
        )}

        {!isLoading && !isError && (entries?.length ?? 0) === 0 && (
          <p className="text-gris-fonce text-[13px]">
            {kind === "followers"
              ? "Personne ne suit ce compte pour l'instant."
              : "Ce compte ne suit personne pour l'instant."}
          </p>
        )}

        <div className="space-y-1">
          {!isError && entries?.map((entry) => {
            const isFollowing = following?.has(entry.userId) ?? false;
            const isOwn = entry.userId === currentUser?.id;
            return (
              <div
                key={entry.userId}
                className="flex items-center justify-between gap-2.5 py-2"
              >
                <Link
                  to={`/u/${entry.userId}`}
                  onClick={onClose}
                  className="flex items-center gap-2.5 min-w-0"
                >
                  {entry.avatarUrl ? (
                    <img
                      src={entry.avatarUrl}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-nuit-haute shrink-0" />
                  )}
                  <span className="text-[13.5px] font-semibold truncate">
                    {entry.displayName}
                  </span>
                </Link>
                {!isOwn && (
                  <Button
                    size="sm"
                    variant={isFollowing ? "secondaire" : "primaire"}
                    onClick={() => handleToggleFollow(entry.userId)}
                    isLoading={follow.isPending || unfollow.isPending}
                  >
                    {isFollowing ? "Suivi" : "Suivre"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
