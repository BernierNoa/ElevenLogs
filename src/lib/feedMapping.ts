export interface FeedLogItem {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
  motmName: string | null;
  match: {
    id: string;
    kickoffAt: string;
    competitionName: string;
    homeTeamName: string;
    homeTeamLogoUrl: string | null;
    awayTeamName: string;
    awayTeamLogoUrl: string | null;
    homeScore: number | null;
    awayScore: number | null;
  };
}

// Forme brute renvoyée par la requête jointe logs → profile_settings /
// players / matches (→ competitions/teams) — un seul select partagé par
// useActivityFeed, useDiscoveryFeed et usePublicProfileLogs.
export const FEED_LOG_SELECT = `
  id,
  user_id,
  match_id,
  rating,
  comment,
  created_at,
  profile:profile_settings(display_name, avatar_url),
  motm:players(full_name),
  match:matches(
    id,
    kickoff_at,
    home_score,
    away_score,
    competition:competitions(name),
    home_team:teams!home_team_id(name, logo_url),
    away_team:teams!away_team_id(name, logo_url)
  )
`;

interface RawFeedRow {
  id: string;
  user_id: string;
  match_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profile: { display_name: string; avatar_url: string | null } | null;
  motm: { full_name: string } | null;
  match: {
    id: string;
    kickoff_at: string;
    home_score: number | null;
    away_score: number | null;
    competition: { name: string } | null;
    home_team: { name: string; logo_url: string | null } | null;
    away_team: { name: string; logo_url: string | null } | null;
  } | null;
}

export function mapFeedRow(row: unknown): FeedLogItem | null {
  const r = row as RawFeedRow;

  return {
    id: r.id,
    userId: r.user_id,
    displayName: r.profile?.display_name ?? "Utilisateur",
    avatarUrl: r.profile?.avatar_url ?? null,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
    motmName: r.motm?.full_name ?? null,
    match: {
      id: r.match?.id ?? r.match_id,
      kickoffAt: r.match?.kickoff_at ?? r.created_at,
      competitionName: r.match?.competition?.name ?? "Match",
      homeTeamName: r.match?.home_team?.name ?? "?",
      homeTeamLogoUrl: r.match?.home_team?.logo_url ?? null,
      awayTeamName: r.match?.away_team?.name ?? "?",
      awayTeamLogoUrl: r.match?.away_team?.logo_url ?? null,
      homeScore: r.match?.home_score ?? null,
      awayScore: r.match?.away_score ?? null,
    },
  };
}
