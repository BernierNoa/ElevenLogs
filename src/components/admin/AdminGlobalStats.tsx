import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import type { AdminGlobalStats } from "../../hooks/useAdminGlobalStats";

export interface AdminGlobalStatsProps {
  stats: AdminGlobalStats | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <Card>
      <div className="chiffres font-display font-black [font-stretch:116%] text-[26px] leading-none text-projecteur truncate">
        {value}
      </div>
      <div className="font-data text-[9.5px] text-gris-fonce uppercase tracking-[0.1em] mt-2">
        {label}
      </div>
    </Card>
  );
}

export function AdminGlobalStats({ stats, isLoading, isError, onRetry }: AdminGlobalStatsProps) {
  if (isLoading) return <p className="text-gris-fonce text-[13px]">Chargement…</p>;

  if (isError || !stats) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-carton text-[13px]">Impossible de charger les statistiques.</p>
        <Button variant="secondaire" size="sm" onClick={onRetry}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatTile value={String(stats.totalUsers)} label="Utilisateurs" />
        <StatTile value={String(stats.activeUsersThisWeek)} label="Actifs cette semaine" />
        <StatTile value={String(stats.totalMatchesLogged)} label="Matchs loggés au total" />
        <StatTile value={String(stats.matchesThisWeek)} label="Matchs cette semaine" />
        <StatTile
          value={stats.globalAverageRating !== null ? stats.globalAverageRating.toFixed(1) : "–"}
          label="Note moyenne globale"
        />
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-3.5 mb-3">
          <h2 className="font-data text-[10.5px] tracking-[0.13em] uppercase text-gris-fonce">
            Classement hebdomadaire — top 10
          </h2>
          <span className="flex-1 h-px bg-ligne" />
        </div>

        <Card>
          {stats.weeklyLeaderboard.length === 0 ? (
            <p className="text-gris-fonce text-[13px]">Aucun log cette semaine pour l'instant.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="text-left font-data text-[10px] text-gris-fonce uppercase tracking-[0.06em] border-b border-ligne">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Pseudo</th>
                    <th className="py-2 pr-3">Matchs vus</th>
                    <th className="py-2 pr-3">Note moy.</th>
                    <th className="py-2">MVP préféré</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.weeklyLeaderboard.map((entry, index) => (
                    <tr key={entry.userId} className="border-b border-ligne last:border-b-0">
                      <td className="py-2 pr-3 chiffres text-gris-fonce">{index + 1}</td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {entry.avatarUrl ? (
                            <img
                              src={entry.avatarUrl}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-nuit-haute shrink-0" />
                          )}
                          <span className="font-semibold truncate max-w-[160px]">
                            {entry.displayName}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 pr-3 chiffres">{entry.matchesThisWeek}</td>
                      <td className="py-2 pr-3 chiffres">{entry.avgRatingThisWeek.toFixed(1)}</td>
                      <td className="py-2 text-gris-fonce truncate max-w-[160px]">
                        {entry.favoriteMotmName ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
