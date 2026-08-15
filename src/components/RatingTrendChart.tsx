import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import type { RatingTrendPoint } from "../hooks/useSeasonStats";

function TrendTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload as RatingTrendPoint;

  return (
    <div className="carte py-2 px-3">
      <div className="font-data text-[9.5px] text-gris-fonce uppercase tracking-[0.08em]">
        {point.label}
      </div>
      <div className="chiffres font-display font-bold text-[15px] text-projecteur mt-0.5">
        {point.average.toFixed(1)}/10
      </div>
      <div className="text-gris-fonce text-[11px]">
        {point.count} log{point.count > 1 ? "s" : ""}
      </div>
    </div>
  );
}

export interface RatingTrendChartProps {
  data: RatingTrendPoint[];
}

// Aires plutôt que ligne seule : plus lisible en dark mode sur un fond
// noir uni, cohérent avec le glow projecteur déjà utilisé ailleurs (hero,
// halo live). Recharts choisi ici (déjà une dépendance du projet, contexte
// interactif au survol requis) — contrairement au sparkline admin, un
// SVG maison n'aurait pas donné le tooltip demandé sans réinventer une
// bonne partie de recharts.
export function RatingTrendChart({ data }: RatingTrendChartProps) {
  if (data.length < 2) {
    return (
      <p className="text-gris-fonce text-[13px]">
        Pas encore assez de logs étalés dans le temps pour un graphique d'évolution.
      </p>
    );
  }

  return (
    <div className="h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="ratingTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-projecteur)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-projecteur)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-ligne)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-gris-fonce)", fontSize: 10 }}
            axisLine={{ stroke: "var(--color-ligne)" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 5, 10]}
            tick={{ fill: "var(--color-gris-fonce)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={24}
          />
          <Tooltip content={TrendTooltip} cursor={{ stroke: "var(--color-ligne)" }} />
          <Area
            type="monotone"
            dataKey="average"
            stroke="var(--color-projecteur)"
            strokeWidth={2}
            fill="url(#ratingTrendFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
