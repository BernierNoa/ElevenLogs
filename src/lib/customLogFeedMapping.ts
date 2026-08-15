export interface PublicCustomMatchItem {
  id: string;
  name: string;
  kickoffAt: string | null;
  position: number;
}

export interface PublicCustomLogItem {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  rating: number;
  comment: string | null;
  watchedAt: string;
  createdAt: string;
  matches: PublicCustomMatchItem[];
}

// Forme brute renvoyée par la requête jointe custom_logs → profile_settings
// / custom_matches — select partagé par usePublicProfileCustomLogs et
// useActivityFeedCustomLogs, même logique que FEED_LOG_SELECT pour `logs`.
export const CUSTOM_FEED_LOG_SELECT = `
  id,
  user_id,
  rating,
  comment,
  watched_at,
  created_at,
  profile:profile_settings(display_name, avatar_url),
  custom_matches(id, name, kickoff_at, position)
`;

interface RawCustomFeedRow {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  watched_at: string;
  created_at: string;
  profile: { display_name: string; avatar_url: string | null } | null;
  custom_matches: {
    id: string;
    name: string;
    kickoff_at: string | null;
    position: number;
  }[];
}

export function mapCustomFeedRow(row: unknown): PublicCustomLogItem {
  const r = row as RawCustomFeedRow;

  return {
    id: r.id,
    userId: r.user_id,
    displayName: r.profile?.display_name ?? "Utilisateur",
    avatarUrl: r.profile?.avatar_url ?? null,
    rating: r.rating,
    comment: r.comment,
    watchedAt: r.watched_at,
    createdAt: r.created_at,
    matches: [...r.custom_matches]
      .sort((a, b) => a.position - b.position)
      .map((m) => ({
        id: m.id,
        name: m.name,
        kickoffAt: m.kickoff_at,
        position: m.position,
      })),
  };
}
