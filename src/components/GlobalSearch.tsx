import { useState } from "react";
import { LogMatchModal } from "./LogMatchModal";
import { Button } from "./ui/Button";
import { UserResultRow } from "./UserResultRow";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useTeamSearch } from "../hooks/useTeamSearch";
import { useUserSearch } from "../hooks/useUserSearch";
import { useMyLogs } from "../hooks/useMyLogs";
import { useFollowing } from "../hooks/useFollowing";
import { useFollowMutations } from "../hooks/useFollowMutations";
import { formatKickoff } from "../lib/formatDate";
import type { MatchListItem, MatchStatus } from "../hooks/useMatches";

// Même règle que MatchCard.tsx : un match à venir ou reporté n'a pas encore
// pu être regardé, donc pas encore de note possible.
function canLogMatch(status: MatchStatus): boolean {
  return status !== "scheduled" && status !== "postponed";
}

function statusLabel(status: MatchStatus): string {
  return status === "postponed" ? "Reporté" : "À venir";
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeMatch, setActiveMatch] = useState<MatchListItem | null>(null);

  const debouncedQuery = useDebouncedValue(query, 300);
  const {
    data: matches,
    isLoading: matchesLoading,
    isError: matchesError,
    refetch: refetchMatches,
  } = useTeamSearch(debouncedQuery);
  const {
    data: users,
    isLoading: usersLoading,
    isError: usersError,
    refetch: refetchUsers,
  } = useUserSearch(debouncedQuery);
  const { data: myLogs } = useMyLogs();
  const { data: following } = useFollowing();
  const { follow, unfollow } = useFollowMutations();

  const showDropdown = isFocused && debouncedQuery.trim().length >= 2;

  function handleToggleFollow(targetUserId: string) {
    const mutation = following?.has(targetUserId) ? unfollow : follow;
    mutation.mutate(targetUserId);
  }

  return (
    <div className="relative w-full max-w-[360px]">
      <input
        type="search"
        className="champ-input text-[13.5px] py-2"
        placeholder="Chercher un match ou un compte…"
        title="Cherche une équipe pour loguer un match, ou un pseudo pour suivre un compte."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        // Délai avant fermeture pour laisser le temps au clic sur un résultat
        // d'être traité (sinon onBlur ferme la liste avant onClick).
        onBlur={() => setTimeout(() => setIsFocused(false), 150)}
      />

      {showDropdown && (
        <div className="absolute left-0 right-0 mt-1.5 carte p-1.5 max-h-[360px] overflow-y-auto z-40">
          <p className="font-data text-[10px] text-gris-fonce uppercase tracking-[0.08em] px-2.5 pt-1 pb-1.5">
            Comptes
          </p>
          {usersLoading && (
            <p className="text-gris-fonce text-[12px] px-2.5 py-2">Recherche…</p>
          )}
          {!usersLoading && usersError && (
            <div className="px-2.5 py-2">
              <p className="text-carton text-[12px] mb-2">
                Recherche impossible. Réessaie plus tard.
              </p>
              <Button variant="secondaire" size="sm" onClick={() => refetchUsers()}>
                Réessayer
              </Button>
            </div>
          )}
          {!usersLoading && !usersError && (users?.length ?? 0) === 0 && (
            <p className="text-gris-fonce text-[12px] px-2.5 py-2">
              Aucun compte trouvé.
            </p>
          )}
          {!usersError && users?.map((result) => (
            <UserResultRow
              key={result.userId}
              result={result}
              isFollowing={following?.has(result.userId) ?? false}
              onToggleFollow={handleToggleFollow}
              isFollowPending={follow.isPending || unfollow.isPending}
              onSelect={() => setQuery("")}
            />
          ))}

          <p className="font-data text-[10px] text-gris-fonce uppercase tracking-[0.08em] px-2.5 pt-3 pb-1.5 mt-1 border-t border-ligne">
            Matchs
          </p>
          {matchesLoading && (
            <p className="text-gris-fonce text-[12px] px-2.5 py-2">Recherche…</p>
          )}
          {!matchesLoading && matchesError && (
            <div className="px-2.5 py-2">
              <p className="text-carton text-[12px] mb-2">
                Recherche impossible. Réessaie plus tard.
              </p>
              <Button variant="secondaire" size="sm" onClick={() => refetchMatches()}>
                Réessayer
              </Button>
            </div>
          )}
          {!matchesLoading && !matchesError && (matches?.length ?? 0) === 0 && (
            <p className="text-gris-fonce text-[12px] px-2.5 py-2">
              Aucun match trouvé.
            </p>
          )}
          {!matchesError &&
            matches?.map((match) => {
              const canLog = canLogMatch(match.status);

              return (
                <button
                  key={match.id}
                  type="button"
                  className="w-full text-left flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-md hover:bg-nuit-haute transition-colors"
                  onClick={() => {
                    if (canLog) setActiveMatch(match);
                  }}
                >
                  <span className="text-[12.5px] font-semibold truncate">
                    {match.home_team?.name ?? "?"}
                    <span className="text-gris-fonce font-normal"> – </span>
                    {match.away_team?.name ?? "?"}
                  </span>

                  <span className="font-data text-[10px] text-gris-fonce shrink-0">
                    {canLog ? formatKickoff(match.kickoff_at) : statusLabel(match.status)}
                  </span>
                </button>
              );
            })}
        </div>
      )}

      {activeMatch && (
        <LogMatchModal
          key={activeMatch.id}
          matchId={activeMatch.id}
          competitionName={activeMatch.competition?.name ?? ""}
          homeTeamName={activeMatch.home_team?.name ?? "?"}
          awayTeamName={activeMatch.away_team?.name ?? "?"}
          kickoffAt={activeMatch.kickoff_at}
          homeScore={activeMatch.home_score}
          awayScore={activeMatch.away_score}
          competitionLogoUrl={activeMatch.competition?.logo_url ?? null}
          homeTeamLogoUrl={activeMatch.home_team?.logo_url ?? null}
          awayTeamLogoUrl={activeMatch.away_team?.logo_url ?? null}
          existingLog={myLogs?.get(activeMatch.id)}
          onClose={() => {
            setActiveMatch(null);
            setQuery("");
          }}
        />
      )}
    </div>
  );
}
