import { Fragment } from "react";

export interface ComparisonStats {
  matchsVus: number;
  noteMoyenne: number | null;
  avgGoalsPerMatch: number | null;
  competitionPlusRegardee: string | null;
  teamsByCount: { key: string; label: string; value: number }[];
}

export interface ComparisonCardProps {
  mine: ComparisonStats;
  theirs: ComparisonStats;
  theirName: string;
}

function formatDecimal(value: number | null): string {
  return value === null ? "—" : value.toFixed(1);
}

const COMMON_TEAMS_DISPLAY_LIMIT = 6;

// Grille à 3 colonnes (moi | métrique | l'autre) plutôt que deux blocs côte
// à côte : reste lisible sur mobile sans breakpoint dédié, les colonnes
// s'ajustent d'elles-mêmes à la largeur de l'écran.
export function ComparisonCard({ mine, theirs, theirName }: ComparisonCardProps) {
  const commonTeams = mine.teamsByCount
    .map((t) => t.label)
    .filter((label) => theirs.teamsByCount.some((t) => t.label === label));

  const rows: { label: string; mine: string; theirs: string }[] = [
    {
      label: "Matchs vus",
      mine: String(mine.matchsVus),
      theirs: String(theirs.matchsVus),
    },
    {
      label: "Note moyenne",
      mine: formatDecimal(mine.noteMoyenne),
      theirs: formatDecimal(theirs.noteMoyenne),
    },
    {
      label: "Buts par match",
      mine: formatDecimal(mine.avgGoalsPerMatch),
      theirs: formatDecimal(theirs.avgGoalsPerMatch),
    },
    {
      label: "Compétition favorite",
      mine: mine.competitionPlusRegardee ?? "—",
      theirs: theirs.competitionPlusRegardee ?? "—",
    },
  ];

  return (
    <div className="carte p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="font-display font-bold text-[13px] truncate">Toi</span>
        <span className="font-data text-[10px] text-gris-fonce uppercase tracking-[0.08em] shrink-0">
          Comparatif
        </span>
        <span className="font-display font-bold text-[13px] truncate text-right">
          {theirName}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-y-3.5 items-center">
        {rows.map((row) => (
          <Fragment key={row.label}>
            <span className="chiffres font-bold text-[15px] text-right">{row.mine}</span>
            <span className="font-data text-[9.5px] uppercase tracking-[0.05em] text-gris-fonce text-center px-2.5 leading-tight max-w-[100px]">
              {row.label}
            </span>
            <span className="chiffres font-bold text-[15px] text-left">{row.theirs}</span>
          </Fragment>
        ))}
      </div>

      {commonTeams.length > 0 && (
        <div className="mt-5 pt-4 border-t border-ligne">
          <div className="font-data text-[10px] uppercase tracking-[0.08em] text-gris-fonce mb-1.5">
            {commonTeams.length} équipe{commonTeams.length > 1 ? "s" : ""} en commun
          </div>
          <p className="text-[13px] text-craie">
            {commonTeams.slice(0, COMMON_TEAMS_DISPLAY_LIMIT).join(" · ")}
            {commonTeams.length > COMMON_TEAMS_DISPLAY_LIMIT ? "…" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
