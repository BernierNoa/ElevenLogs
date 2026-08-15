import type { DailyBucket } from "../../hooks/useAdminStats";

export interface LogsSparklineProps {
  data: DailyBucket[];
}

// SVG dessiné à la main plutôt qu'une lib de charts (recharts est une
// dépendance déclarée mais inutilisée ailleurs dans le projet — même partie
// pris que RatingDistributionChart : rester léger plutôt qu'ouvrir une
// première vraie dépendance de charting pour un sparkline).
export function LogsSparkline({ data }: LogsSparklineProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.count), 1);
  const width = 100;
  const height = 32;
  const step = data.length > 1 ? width / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = i * step;
    const y = height - (d.count / max) * height;
    return `${x},${y}`;
  });

  const linePath = `M${points.join(" L")}`;
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="w-full h-10"
      aria-hidden="true"
    >
      <path d={areaPath} fill="var(--color-pelouse)" opacity="0.35" />
      <path d={linePath} fill="none" stroke="var(--color-projecteur)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
