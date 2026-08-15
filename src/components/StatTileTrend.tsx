import { Card } from "./ui/Card";

export interface StatTileTrendProps {
  value: string;
  label: string;
  /** undefined = pas de tendance pertinente pour cette tuile (valeur
   * cumulative/record, ex. "Matchs vus" à vie) ; null = tendance pertinente
   * mais pas encore de période antérieure à comparer ; objet = delta formaté
   * par l'appelant (l'unité varie : note, nb de logs, buts...). */
  trend?: { label: string; positive: boolean } | null;
}

export function StatTileTrend({ value, label, trend }: StatTileTrendProps) {
  return (
    <Card>
      <div className="chiffres font-display font-black [font-stretch:116%] text-[26px] leading-none text-projecteur truncate">
        {value}
      </div>
      <div className="font-data text-[9.5px] text-gris-fonce uppercase tracking-[0.1em] mt-2">
        {label}
      </div>
      {trend !== undefined && (
        <div
          className={`font-data text-[10.5px] mt-1.5 ${trend && trend.positive ? "text-projecteur" : "text-gris-fonce"}`}
        >
          {trend ? trend.label : "Pas de comparaison possible"}
        </div>
      )}
    </Card>
  );
}
