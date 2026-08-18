import { Link } from "react-router";
import { Button } from "../ui/Button";
import type { SuggestedAccount } from "../../hooks/useSuggestedAccounts";

export interface SuggestedAccountsProps {
  accounts: SuggestedAccount[];
  isFollowing: (userId: string) => boolean;
  onToggleFollow: (userId: string) => void;
  isFollowPending: (userId: string) => boolean;
}

// Défilement horizontal (même motif que MatchAgenda) : sur mobile c'est un
// carrousel au doigt sans bouton "précédent/suivant" à gérer, sur desktop la
// largeur fixe des cartes fait apparaître naturellement une barre de
// défilement souris/trackpad plutôt qu'une grille — cohérent avec le reste
// du dashboard.
export function SuggestedAccounts({
  accounts,
  isFollowing,
  onToggleFollow,
  isFollowPending,
}: SuggestedAccountsProps) {
  if (accounts.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 md:mx-0 md:px-0">
      {accounts.map((account) => {
        const following = isFollowing(account.userId);
        return (
          <div
            key={account.userId}
            className="carte w-[128px] shrink-0 p-3.5 flex flex-col items-center text-center gap-2"
          >
            <Link
              to={`/u/${account.userId}`}
              className="flex flex-col items-center gap-2 min-w-0 w-full"
            >
              {account.avatarUrl ? (
                <img
                  src={account.avatarUrl}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <span className="w-14 h-14 rounded-full bg-nuit-haute flex items-center justify-center font-display font-bold text-[16px] text-gris-fonce">
                  {account.displayName.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="text-[12px] font-semibold truncate w-full">
                {account.displayName}
              </span>
            </Link>
            <Button
              size="sm"
              variant={following ? "secondaire" : "primaire"}
              className="w-full"
              onClick={() => onToggleFollow(account.userId)}
              isLoading={isFollowPending(account.userId)}
            >
              {following ? "Suivi" : "Suivre"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
