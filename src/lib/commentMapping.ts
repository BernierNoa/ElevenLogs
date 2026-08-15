// Deux tables séparées côté DB (log_comments / custom_log_comments, cf.
// migration 20260810180000) mais un seul schéma client : les hooks de
// src/hooks/useComment* sont paramétrés par ce type plutôt que dupliqués,
// pour éviter de maintenir deux copies de la même logique de requête.
export type CommentTarget = "log" | "custom-log";

export const COMMENT_TABLE: Record<CommentTarget, string> = {
  log: "log_comments",
  "custom-log": "custom_log_comments",
};

export const COMMENT_ID_COLUMN: Record<CommentTarget, "log_id" | "custom_log_id"> = {
  log: "log_id",
  "custom-log": "custom_log_id",
};

export interface CommentItem {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  body: string;
  createdAt: string;
}

interface RawCommentRow {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  profile: { display_name: string; avatar_url: string | null } | null;
}

export function mapCommentRow(row: unknown): CommentItem {
  const r = row as RawCommentRow;
  return {
    id: r.id,
    userId: r.user_id,
    displayName: r.profile?.display_name ?? "Utilisateur",
    avatarUrl: r.profile?.avatar_url ?? null,
    body: r.body,
    createdAt: r.created_at,
  };
}
