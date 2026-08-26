import { useState } from "react";
import { useUser } from "@clerk/react-router";
import { Navigate } from "react-router";
import { useAdminStats } from "../hooks/useAdminStats";
import { useAdminReports } from "../hooks/useAdminReports";
import { useAdminMatches } from "../hooks/useAdminMatches";
import { useAdminGlobalStats } from "../hooks/useAdminGlobalStats";
import { AdminOverview } from "../components/admin/AdminOverview";
import { AdminUsers } from "../components/admin/AdminUsers";
import { AdminReports } from "../components/admin/AdminReports";
import { AdminMatches } from "../components/admin/AdminMatches";
import { AdminGlobalStats } from "../components/admin/AdminGlobalStats";
import { ADMIN_USER_ID } from "../lib/admin";

type AdminTab = "apercu" | "utilisateurs" | "signalements" | "matchs" | "stats";

const TABS: { key: AdminTab; label: string }[] = [
  { key: "apercu", label: "Vue d'ensemble" },
  { key: "utilisateurs", label: "Utilisateurs" },
  { key: "signalements", label: "Signalements" },
  { key: "matchs", label: "Matchs" },
  { key: "stats", label: "Stats" },
];

export function Admin() {
  const { isLoaded, user } = useUser();
  const [tab, setTab] = useState<AdminTab>("apercu");

  const stats = useAdminStats();
  const reports = useAdminReports();
  const adminMatches = useAdminMatches();
  const globalStats = useAdminGlobalStats();

  if (!isLoaded) return null;
  if (user?.id !== ADMIN_USER_ID) return <Navigate to="/" replace />;

  const pendingReportsCount = (reports.data ?? []).filter((r) => r.status === "pending").length;

  return (
    <div className="max-w-[1180px] mx-auto px-5 md:px-8 py-7">
      <h1 className="font-display font-extrabold uppercase tracking-[-0.03em] [font-stretch:110%] text-[28px] md:text-[30px]">
        Admin
      </h1>

      <div className="flex flex-wrap gap-2 mt-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={["filtre-chip", tab === t.key ? "actif" : ""].join(" ")}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.key === "signalements" && pendingReportsCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-carton text-noir font-bold text-[10px]">
                {pendingReportsCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-7">
        {tab === "apercu" &&
          (stats.isLoading ? (
            <p className="text-gris-fonce text-[13px]">Chargement…</p>
          ) : stats.isError || !stats.data ? (
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-carton text-[13px]">Impossible de charger les statistiques.</p>
            </div>
          ) : (
            <AdminOverview
              stats={stats.data}
              pendingReportsCount={pendingReportsCount}
              onViewReports={() => setTab("signalements")}
            />
          ))}

        {tab === "utilisateurs" && (
          <AdminUsers
            users={stats.data?.users ?? []}
            isLoading={stats.isLoading}
            isError={stats.isError}
            onRetry={() => stats.refetch()}
          />
        )}

        {tab === "signalements" && (
          <AdminReports
            reports={reports.data ?? []}
            isLoading={reports.isLoading}
            isError={reports.isError}
            onRetry={() => reports.refetch()}
            users={stats.data?.users ?? []}
          />
        )}

        {tab === "matchs" && (
          <AdminMatches
            matches={adminMatches.data ?? []}
            isLoading={adminMatches.isLoading}
            isError={adminMatches.isError}
            onRetry={() => adminMatches.refetch()}
          />
        )}

        {tab === "stats" && (
          <AdminGlobalStats
            stats={globalStats.data}
            isLoading={globalStats.isLoading}
            isError={globalStats.isError}
            onRetry={() => globalStats.refetch()}
          />
        )}
      </div>
    </div>
  );
}
