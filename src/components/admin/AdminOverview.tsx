import { Card } from "../ui/Card";
import { LogsSparkline } from "./LogsSparkline";
import type { AdminStats } from "../../hooks/useAdminStats";

export interface AdminOverviewProps {
  stats: AdminStats;
  pendingReportsCount: number;
  onViewReports: () => void;
}

function StatTileWithTrend({
  value,
  label,
  trendPct,
}: {
  value: string;
  label: string;
  trendPct?: number | null;
}) {
  return (
    <Card>
      <div className="chiffres font-display font-black [font-stretch:116%] text-[26px] leading-none text-projecteur truncate">
        {value}
      </div>
      <div className="font-data text-[9.5px] text-gris-fonce uppercase tracking-[0.1em] mt-2">
        {label}
      </div>
      {trendPct !== undefined && (
        <div
          className={[
            "font-data text-[10.5px] mt-1.5",
            trendPct === null
              ? "text-gris-fonce"
              : trendPct >= 0
                ? "text-projecteur"
                : "text-gris-fonce",
          ].join(" ")}
        >
          {trendPct === null
            ? "Pas de comparaison possible"
            : `${trendPct >= 0 ? "+" : ""}${trendPct}% vs 7j précédents`}
        </div>
      )}
    </Card>
  );
}

export function AdminOverview({ stats, pendingReportsCount, onViewReports }: AdminOverviewProps) {
  return (
    <div>
      {pendingReportsCount > 0 && (
        <button
          type="button"
          onClick={onViewReports}
          className="carte w-full flex items-center justify-between gap-3 mb-6 text-left hover:border-carton/50 transition-colors"
        >
          <div>
            <div className="font-display font-bold text-[15px]">
              {pendingReportsCount} signalement{pendingReportsCount > 1 ? "s" : ""} en attente
            </div>
            <p className="text-gris-fonce text-[12.5px] mt-1">
              À traiter dans l'onglet Signalements.
            </p>
          </div>
          <span className="inline-flex items-center justify-center min-w-[28px] h-[28px] px-2 rounded-full bg-carton text-noir font-data text-[13px] font-bold shrink-0">
            {pendingReportsCount}
          </span>
        </button>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatTileWithTrend value={String(stats.totalUsers)} label="Utilisateurs" />
        <StatTileWithTrend value={String(stats.newUsersToday)} label="Nouveaux aujourd'hui" />
        <StatTileWithTrend value={String(stats.activeUsersToday)} label="Actifs aujourd'hui" />
        <StatTileWithTrend
          value={String(stats.logsToday)}
          label="Logs aujourd'hui"
          trendPct={stats.logsTrendPct}
        />
        <StatTileWithTrend value={String(stats.logsTotal)} label="Logs au total" />
      </div>

      <div className="carte mt-4">
        <div className="font-data text-[9.5px] text-gris-fonce uppercase tracking-[0.1em] mb-2">
          Logs — 30 derniers jours
        </div>
        <LogsSparkline data={stats.logsLast30Days} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        <Card>
          <div className="font-data text-[9.5px] text-gris-fonce uppercase tracking-[0.1em]">
            Rétention J+7
          </div>
          <div className="chiffres font-display font-black [font-stretch:116%] text-[26px] leading-none text-projecteur mt-2">
            {stats.retentionD7Pct !== null ? `${stats.retentionD7Pct}%` : "—"}
          </div>
          <p className="text-gris-fonce text-[11.5px] mt-1.5">
            Comptes actifs 7 à 14 jours après inscription, parmi ceux ayant au moins 14 jours.
          </p>
        </Card>

        <Card>
          <div className="font-data text-[9.5px] text-gris-fonce uppercase tracking-[0.1em] mb-3">
            Profils publics / privés
          </div>
          <div className="flex items-center gap-4">
            <div>
              <div className="chiffres font-display font-black [font-stretch:116%] text-[22px] leading-none text-projecteur">
                {stats.publicProfilesCount}
              </div>
              <div className="font-data text-[10px] text-gris-fonce uppercase tracking-[0.08em] mt-1">
                Publics
              </div>
            </div>
            <div>
              <div className="chiffres font-display font-black [font-stretch:116%] text-[22px] leading-none text-gris">
                {stats.privateProfilesCount}
              </div>
              <div className="font-data text-[10px] text-gris-fonce uppercase tracking-[0.08em] mt-1">
                Privés
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
