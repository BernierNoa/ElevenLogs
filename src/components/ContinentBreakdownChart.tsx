import { PartToWholeBar } from "./PartToWholeBar";
import type { RankedItem } from "../hooks/useSeasonStats";

export interface ContinentBreakdownChartProps {
  items: RankedItem[];
}

// Une barre unique divisée en segments proportionnels plutôt qu'une rangée de
// barres pleine largeur par continent (chacune illisible dès qu'un continent
// domine très largement, ex. 100% Europe) — cf. PartToWholeBar.
export function ContinentBreakdownChart({ items }: ContinentBreakdownChartProps) {
  return <PartToWholeBar items={items} unitLabel="match" />;
}
