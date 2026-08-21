import { Link } from "react-router";
import type { LeaderboardEntry } from "../../hooks/useFriendsLeaderboard";

export interface FriendsLeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId: string | undefined;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function FriendsLeaderboard({ entries, currentUserId }: FriendsLeaderboardProps) {
  if (entries.length < 2) return null;

  const mostGenerousId = entries[0].userId;
  const mostSevereId = entries[entries.length - 1].userId;

  return (
    <div className="carte p-2">
      {entries.map((entry, index) => {
        const isSelf = entry.userId === currentUserId;
        const tag =
          entry.userId === mostGenerousId
            ? "Plus généreux"
            : entry.userId === mostSevereId
              ? "Plus sévère"
              : null;

        return (
          <Link
            key={entry.userId}
            to={isSelf ? "/profil" : `/u/${entry.userId}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-nuit-haute transition-colors"
          >
            <span className="font-data text-[12px] text-gris-fonce w-4 text-center shrink-0">
              {index + 1}
            </span>

            {entry.avatarUrl ? (
              <img
                src={entry.avatarUrl}
                alt=""
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <span className="w-8 h-8 rounded-full bg-nuit-haute grid place-items-center font-data text-[11px] font-bold text-projecteur shrink-0">
                {initialsOf(entry.displayName)}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-semibold truncate">
                {isSelf ? "Toi" : entry.displayName}
              </div>
              {tag && (
                <div className="font-data text-[9.5px] text-gris-fonce uppercase tracking-[0.06em]">
                  {tag}
                </div>
              )}
            </div>

            <div className="text-right shrink-0">
              <div className="chiffres font-display font-bold text-[16px] leading-none">
                {entry.averageRating.toFixed(1)}
              </div>
              <div className="font-data text-[9.5px] text-gris-fonce mt-0.5">
                {entry.logCount} log{entry.logCount > 1 ? "s" : ""}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
