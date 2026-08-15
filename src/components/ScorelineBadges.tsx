import type { RankedItem } from "../hooks/useSeasonStats";

export interface ScorelineBadgesProps {
  items: RankedItem[];
}

// Repli pour "Scores les plus fréquents" quand tout est à égalité (souvent
// "1×" partout avec peu de logs) : une liste de classement numérotée avec
// barres à 100% partout suggère un ordre qu'il n'y a pas — un score n'est
// de toute façon pas vraiment "classable" par nature, contrairement à un
// joueur ou une équipe.
export function ScorelineBadges({ items }: ScorelineBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item.key} className="badge badge-comp">
          {item.label}
          {item.value > 1 && <span className="text-projecteur">×{item.value}</span>}
        </span>
      ))}
    </div>
  );
}
