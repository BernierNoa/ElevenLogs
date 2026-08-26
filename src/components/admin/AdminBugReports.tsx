import { useState } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { useAdminBugReportActions } from "../../hooks/useAdminBugReportActions";
import { showToast } from "../../lib/toastStore";
import type { AdminBugReportRow } from "../../hooks/useAdminBugReports";
import type { BugType } from "../../hooks/useBugReportMutation";

export interface AdminBugReportsProps {
  reports: AdminBugReportRow[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

const BUG_TYPE_LABELS: Record<BugType, string> = {
  affichage: "Affichage",
  fonctionnalite: "Fonctionnalité",
  donnees: "Donnée incorrecte",
  autre: "Autre",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Nouveau",
  reviewed: "Vu",
  resolved: "Résolu",
};

type StatusFilter = "new" | "reviewed" | "resolved" | "all";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "new", label: "Nouveaux" },
  { key: "reviewed", label: "Vus" },
  { key: "resolved", label: "Résolus" },
  { key: "all", label: "Tous" },
];

export function AdminBugReports({ reports, isLoading, isError, onRetry }: AdminBugReportsProps) {
  const [filter, setFilter] = useState<StatusFilter>("new");
  const { setStatus } = useAdminBugReportActions();

  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  function handleSetStatus(reportId: string, status: "reviewed" | "resolved") {
    setStatus.mutate(
      { reportId, status },
      {
        onSuccess: () => showToast(status === "resolved" ? "Bug marqué comme résolu." : "Bug marqué comme vu."),
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
          <p className="text-carton text-[13px]">Impossible de charger les signalements de bug.</p>
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
                  </div>
                  <div className="font-data text-[10px] text-gris-fonce uppercase tracking-[0.06em] mt-1">
                    {BUG_TYPE_LABELS[r.bugType]} · {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                    {r.pageUrl && ` · ${r.pageUrl}`}
                  </div>
                  <p className="quote mt-2">{r.description}</p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant={r.status === "new" ? "danger" : "default"}>
                    {STATUS_LABELS[r.status] ?? r.status}
                  </Badge>
                  {r.status !== "resolved" && (
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {r.status === "new" && (
                        <Button
                          variant="secondaire"
                          size="sm"
                          isLoading={setStatus.isPending}
                          onClick={() => handleSetStatus(r.id, "reviewed")}
                        >
                          Marquer vu
                        </Button>
                      )}
                      <Button
                        variant="secondaire"
                        size="sm"
                        isLoading={setStatus.isPending}
                        onClick={() => handleSetStatus(r.id, "resolved")}
                      >
                        Résoudre
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
