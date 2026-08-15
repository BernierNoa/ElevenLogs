import { useState } from "react";
import { Button } from "./ui/Button";
import { UserResultRow } from "./UserResultRow";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useUserSearch } from "../hooks/useUserSearch";
import { useFollowing } from "../hooks/useFollowing";
import { useFollowMutations } from "../hooks/useFollowMutations";

export function UserSearch() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const debouncedQuery = useDebouncedValue(query, 300);
  const { data: results, isLoading, isError, refetch } = useUserSearch(debouncedQuery);
  const { data: following } = useFollowing();
  const { follow, unfollow } = useFollowMutations();

  const showDropdown = isFocused && debouncedQuery.trim().length >= 2;

  function handleToggleFollow(targetUserId: string) {
    const mutation = following?.has(targetUserId) ? unfollow : follow;
    mutation.mutate(targetUserId);
  }

  return (
    <div className="w-full max-w-[360px]">
      <p className="champ-label mb-1.5">Suivre un compte</p>
      <div className="relative">
        <input
          type="search"
          className="champ-input text-[13.5px] py-2"
          placeholder="Chercher un pseudo à suivre…"
          title="Les logs des comptes que tu suis apparaissent dans le fil d'activité ci-dessous."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          // Même délai que GlobalSearch : laisse le clic sur un résultat se
          // traiter avant que onBlur ne referme la liste.
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
        />

        {showDropdown && (
          <div className="absolute left-0 right-0 mt-1.5 carte p-1.5 max-h-[360px] overflow-y-auto z-40">
            {isLoading && (
              <p className="text-gris-fonce text-[12px] px-2.5 py-2">Recherche…</p>
            )}
            {!isLoading && isError && (
              <div className="px-2.5 py-2">
                <p className="text-carton text-[12px] mb-2">
                  Recherche impossible. Réessaie plus tard.
                </p>
                <Button variant="secondaire" size="sm" onClick={() => refetch()}>
                  Réessayer
                </Button>
              </div>
            )}
            {!isLoading && !isError && (results?.length ?? 0) === 0 && (
              <p className="text-gris-fonce text-[12px] px-2.5 py-2">
                Aucun compte trouvé.
              </p>
            )}
            {!isError && results?.map((result) => (
              <UserResultRow
                key={result.userId}
                result={result}
                isFollowing={following?.has(result.userId) ?? false}
                onToggleFollow={handleToggleFollow}
                isFollowPending={follow.isPending || unfollow.isPending}
              />
            ))}
          </div>
        )}
      </div>
      <p className="champ-aide">
        Ses logs apparaîtront ensuite dans « Fil d'activité », juste en dessous.
      </p>
    </div>
  );
}
