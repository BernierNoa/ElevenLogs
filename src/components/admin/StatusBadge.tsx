import { Badge } from "../ui/Badge";

export interface StatusBadgeProps {
  bannedAt: string | null;
  suspendedUntil: string | null;
}

export function StatusBadge({ bannedAt, suspendedUntil }: StatusBadgeProps) {
  if (bannedAt) return <Badge variant="danger">Banni</Badge>;

  if (suspendedUntil && new Date(suspendedUntil) > new Date()) {
    return (
      <Badge variant="danger">
        Suspendu · {new Date(suspendedUntil).toLocaleDateString("fr-FR")}
      </Badge>
    );
  }

  return <Badge variant="logged">Actif</Badge>;
}
