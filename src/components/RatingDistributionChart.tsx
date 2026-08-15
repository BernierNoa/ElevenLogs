import { Bar, BarChart, ReferenceLine, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipContentProps } from "recharts";

export interface RatingDistributionChartProps {
  distribution: { rating: number; count: number }[];
  /** Moyenne communauté (plateforme) à comparer à sa propre distribution —
   * cf. useCommunityBenchmarks. Repère visuel uniquement, pas affiché si
   * absente (donnée pas encore chargée ou aucun log public ailleurs). */
  communityAverage?: number | null;
}

function DistributionTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload as { rating: number; count: number };

  return (
    <div className="carte py-2 px-3">
      <div className="chiffres font-display font-bold text-[14px]">{point.rating}/10</div>
      <div className="text-gris-fonce text-[11px]">
        {point.count} log{point.count > 1 ? "s" : ""}
      </div>
    </div>
  );
}

// Histogramme 1-10 (demi-points compris) : magnitude croissante, teinte
// unique — même logique que les classements, juste en colonnes plutôt qu'en
// lignes. Recharts pour le tooltip au survol (nombre exact par note) et la
// ligne de référence "communauté", plus robuste ici qu'un hover fait main
// sur 19 barres.
export function RatingDistributionChart({
  distribution,
  communityAverage,
}: RatingDistributionChartProps) {
  const communityBin =
    communityAverage !== null && communityAverage !== undefined
      ? Math.min(10, Math.max(1, Math.round(communityAverage * 2) / 2))
      : null;

  return (
    <div>
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distribution} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
            <Tooltip
              content={DistributionTooltip}
              cursor={{ fill: "var(--color-nuit-haute)" }}
            />
            {communityBin !== null && (
              <ReferenceLine
                x={communityBin}
                stroke="var(--color-gris)"
                strokeDasharray="3 3"
                ifOverflow="extendDomain"
              />
            )}
            <Bar dataKey="count" fill="var(--color-pelouse)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between font-data text-[9px] text-gris-fonce mt-1.5">
        {distribution.map((d) => (
          <span key={d.rating}>{d.rating}</span>
        ))}
      </div>
      {communityBin !== null && (
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-3 h-px bg-gris" aria-hidden="true" />
          <span className="font-data text-[9.5px] text-gris-fonce uppercase tracking-[0.06em]">
            Moyenne communauté ≈ {communityAverage?.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}
