import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import type { RankedItem } from "../hooks/useSeasonStats";

export interface ContinentBreakdownChartProps {
  items: RankedItem[];
}

const BAR_COLORS = [
  "var(--color-projecteur)",
  "var(--color-projecteur-fonce)",
  "var(--color-pelouse)",
  "var(--color-gris-fonce)",
];

function BreakdownTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload as RankedItem;

  return (
    <div className="carte py-2 px-3">
      <div className="text-[12.5px] font-semibold">{point.label}</div>
      <div className="text-gris-fonce text-[11px]">
        {point.value} match{point.value > 1 ? "s" : ""}
      </div>
    </div>
  );
}

// Barres horizontales plutôt qu'un donut : plus lisible en mobile-first (pas
// de légende séparée à recouper avec des parts de camembert), et cohérent
// avec l'esthétique liste déjà utilisée partout ailleurs sur cette page.
export function ContinentBreakdownChart({ items }: ContinentBreakdownChartProps) {
  if (items.length === 0) {
    return <p className="text-gris-fonce text-[13px]">Pas encore de données.</p>;
  }

  const height = Math.max(items.length * 34, 60);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={items}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
          barCategoryGap={10}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={110}
            tick={{ fill: "var(--color-craie)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={BreakdownTooltip} cursor={{ fill: "var(--color-nuit-haute)" }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {items.map((item, index) => (
              <Cell key={item.key} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
