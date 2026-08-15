import { useState } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { UserSanctionModal } from "./UserSanctionModal";
import { useAdminReportActions } from "../../hooks/useAdminReportActions";
import { showToast } from "../../lib/toastStore";
import type { AdminReportRow } from "../../hooks/useAdminReports";
import type { AdminUserRow } from "../../hooks/useAdminStats";

export interface AdminReportsProps {
  reports: AdminReportRow[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  users: AdminUserRow[];
}

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  inapproprie: "Contenu inapproprié",
  harcelement: "Harcèlement",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  reviewed: "Traité",
  dismissed: "Rejeté",
};

type StatusFilter = "pending" | "reviewed" | "dismissed" | "all";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "pending", label: "En attente" },
  { key: "reviewed", label: "Traités" },
  { key: "dismissed", label: "Rejetés" },
  { key: "all", label: "Tous" },
];

export function AdminReports({ reports, isLoading, isError, onRetry, users }: AdminReportsProps) {
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [sanctionUserId, setSanctionUserId] = useState<string | null>(null);
  const { setStatus } = useAdminReportActions();

  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter);
  const sanctionUser = users.find((u) => u.userId === sanctionUserId);

  function handleSetStatus(reportId: string, status: "reviewed" | "dismissed") {
    setStatus.mutate(
      { reportId, status },
      {
        onSuccess: () => showToast(status === "reviewed" ? "Signalement traité." : "Signalement rejeté."),
        onError: () => showToast("Action impossible."),
      },
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={["filtre-chip", filter === f.key ? "actif" : ""].join(" ")}
            onClick={() => setFilter(f.key)}
          >
            {f.label} ({f.key === "all" ? reports.length : reports.filter((r) => r.status === f.key).length})
          </button>
        ))}
      </div>

      {isError ? (
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-carton text-[13px]">Impossible de charger les signalements.</p>
          <Button variant="secondaire" size="sm" onClick={onRetry}>
            Réessayer
          </Button>
        </div>
      ) : isLoading ? (
        <p className="text-gris-fonce text-[13px]">Chargement…</p>
      ) : filtered.length === 0 ? (
        <p className="text-gris-fonce text-[13px]">Aucun signalement pour ce filtre.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="text-[13px]">
                    <span className="font-semibold">{r.reporterDisplayName}</span>
                    <span className="text-gris-fonce"> a signalé </span>
                    <span className="font-semibold">{r.targetDisplayName}</span>
                  </div>
                  <div className="font-data text-[10px] text-gris-fonce uppercase tracking-[0.06em] mt-1">
                    {REASON_LABELS[r.reason] ?? r.reason} · {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                  </div>
                  <div className="text-[12.5px] text-gris-fonce mt-2">
                    {r.matchLabel}
                    {r.logRating !== null && (
                      <span className="chiffres text-craie font-semibold"> · {r.logRating}/10</span>
                    )}
                  </div>
                  {r.logComment && <p className="quote mt-2">{r.logComment}</p>}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant={r.status === "pending" ? "danger" : "default"}>
                    {STATUS_LABELS[r.status] ?? r.status}
                  </Badge>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {r.status === "pending" && (
                      <>
                        <Button
                          variant="secondaire"
                          size="sm"
                          isLoading={setStatus.isPending}
                          onClick={() => handleSetStatus(r.id, "dismissed")}
                        >
                          Rejeter
                        </Button>
                        <Button
                          variant="secondaire"
                          size="sm"
                          isLoading={setStatus.isPending}
                          onClick={() => handleSetStatus(r.id, "reviewed")}
                        >
                          Résoudre
                        </Button>
                      </>
                    )}
                    {r.targetUserId && (
                      <Button
                        variant="destructif"
                        size="sm"
                        onClick={() => setSanctionUserId(r.targetUserId)}
                      >
                        Sanctionner
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {sanctionUser && (
        <UserSanctionModal
          userId={sanctionUser.userId}
          displayName={sanctionUser.displayName}
          bannedAt={sanctionUser.bannedAt}
          suspendedUntil={sanctionUser.suspendedUntil}
          onClose={() => setSanctionUserId(null)}
        />
      )}
    </div>
  );
}
