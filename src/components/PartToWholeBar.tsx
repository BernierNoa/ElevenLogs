import type { RankedItem } from "../hooks/useSeasonStats";

export interface PartToWholeBarProps {
  items: RankedItem[];
  emptyLabel?: string;
  /** Libellé de l'unité comptée, pour la légende — ex. "match" → "3 matchs". */
  unitLabel?: string;
}

// Ordre fixe (cf. --color-chart-1..6 dans index.css) : ne jamais réordonner,
// c'est le mécanisme de distinction sous daltonisme validé par la skill
// dataviz. Au-delà de 6 parts, les plus petites sont repliées dans "Autres"
// (gris neutre, hors palette catégorielle) plutôt que d'inventer une 7e
// teinte non validée.
const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
];
const OTHER_COLOR = "var(--color-gris)";
const MAX_SLOTS = 6;

function pluralize(count: number, unit: string): string {
  return `${count} ${unit}${count > 1 ? "s" : ""}`;
}

// Barre unique divisée en segments proportionnels + légende directe en
// dessous — préféré à un camembert : même lecture "part du tout" mais plus
// lisible en mobile-first (pas de légende à recouper spatialement avec des
// parts d'un cercle), cf. choosing-a-form.md de la skill dataviz
// ("Part-to-whole -> stacked bar, horizontal for many/long-named
// categories"). Écarts de 2px entre segments = le séparateur, jamais un
// contour dessiné (cf. marks-and-anatomy.md).
export function PartToWholeBar({ items, emptyLabel, unitLabel = "match" }: PartToWholeBarProps) {
  const nonZero = items.filter((i) => i.value > 0);

  if (nonZero.length === 0) {
    return <p className="text-gris-fonce text-[13px]">{emptyLabel ?? "Pas encore de données."}</p>;
  }

  const sorted = [...nonZero].sort((a, b) => b.value - a.value);
  const visible = sorted.length > MAX_SLOTS ? sorted.slice(0, MAX_SLOTS - 1) : sorted;
  const rest = sorted.length > MAX_SLOTS ? sorted.slice(MAX_SLOTS - 1) : [];
  const otherValue = rest.reduce((sum, i) => sum + i.value, 0);

  const segments: { key: string; label: string; value: number; color: string }[] = [
    ...visible.map((item, index) => ({
      key: item.key,
      label: item.label,
      value: item.value,
      color: CHART_COLORS[index],
    })),
    ...(otherValue > 0
      ? [{ key: "__other__", label: `Autres (${rest.length})`, value: otherValue, color: OTHER_COLOR }]
      : []),
  ];

  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div>
      <div className="flex gap-[2px] h-[14px]">
        {segments.map((s) => {
          const pct = (s.value / total) * 100;
          return (
            <div
              key={s.key}
              className="rounded-[4px]"
              style={{ width: `${pct}%`, background: s.color }}
              title={`${s.label} — ${pluralize(s.value, unitLabel)} (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3.5">
        {segments.map((s) => {
          const pct = (s.value / total) * 100;
          return (
            <div key={s.key} className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2 h-2 rounded-[2px] shrink-0"
                style={{ background: s.color }}
                aria-hidden="true"
              />
              <span className="text-[12px] font-semibold truncate">{s.label}</span>
              <span className="font-data text-[10px] text-gris-fonce shrink-0 whitespace-nowrap">
                {pluralize(s.value, unitLabel)} · {Math.round(pct)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
