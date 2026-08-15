import { Link } from "react-router";
import { Button } from "./ui/Button";
import type { UserSearchResult } from "../hooks/useUserSearch";

export interface UserResultRowProps {
  result: UserSearchResult;
  isFollowing: boolean;
  onToggleFollow: (userId: string) => void;
  isFollowPending?: boolean;
  onSelect?: () => void;
}

export function UserResultRow({
  result,
  isFollowing,
  onToggleFollow,
  isFollowPending,
  onSelect,
}: UserResultRowProps) {
  return (
    <div className="flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-md hover:bg-nuit-haute transition-colors">
      <Link
        to={`/u/${result.userId}`}
        className="flex items-center gap-2.5 min-w-0"
        onClick={onSelect}
      >
        {result.avatarUrl ? (
          <img
            src={result.avatarUrl}
            alt=""
            className="w-7 h-7 rounded-full object-cover shrink-0"
          />
        ) : (
          <span className="w-7 h-7 rounded-full bg-nuit-haute shrink-0" />
        )}
        <span className="text-[12.5px] font-semibold truncate">
          {result.displayName}
        </span>
      </Link>
      <Button
        size="sm"
        variant={isFollowing ? "secondaire" : "primaire"}
        onClick={() => onToggleFollow(result.userId)}
        isLoading={isFollowPending}
      >
        {isFollowing ? "Suivi" : "Suivre"}
      </Button>
    </div>
  );
}
