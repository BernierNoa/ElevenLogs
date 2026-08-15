import { LedRatingBar } from "./LedRatingBar";
import type { DualMetricItem } from "../hooks/useSeasonStats";

export interface MetricRankedListProps {
  items: DualMetricItem[];
  emptyLabel: string;
  /** Moyenne communauté par clé (nom de compétition/équipe) — cf.
   * useCommunityBenchmarks. Absente si la donnée n'a pas encore chargé ou
   * que rien n'existe pour cette entité côté plateforme. */
  communityAverages?: Map<string, number>;
}

// Fusionne "les plus regardées" (count) et "note moyenne" (average) en une
// seule ligne par entité plutôt que deux listes dupliquant les mêmes noms
// côte à côte. Triée par count (comportement d'origine de "les plus
// regardées") ; la moyenne réutilise LedRatingBar, jamais de barre de
// progression ici — les deux métriques sont déjà des valeurs directement
// lisibles, une barre n'ajouterait rien.
export function MetricRankedList({ items, emptyLabel, communityAverages }: MetricRankedListProps) {
  if (items.length === 0) {
    return <p className="text-gris-fonce text-[13px]">{emptyLabel}</p>;
  }

  return (
    <div>
      {items.map((item, index) => {
        const community = communityAverages?.get(item.key);
        return (
          <div
            key={item.key}
            className="flex items-center gap-2.5 py-2.5 border-b border-ligne last:border-b-0"
          >
            <span className="font-data text-[11px] text-gris-fonce w-5 shrink-0">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate">{item.label}</div>
              <div className="font-data text-[10px] text-gris-fonce mt-0.5">
                {item.count} match{item.count > 1 ? "s" : ""} vu{item.count > 1 ? "s" : ""}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="w-16">
                <LedRatingBar value={Math.round(item.average * 10) / 10} size="compact" showValue />
              </span>
              {community !== undefined && (
                <span className="font-data text-[9.5px] text-gris whitespace-nowrap">
                  Communauté {community.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
