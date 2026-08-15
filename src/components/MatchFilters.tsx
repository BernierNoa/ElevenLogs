import { CONTINENT_LABELS, continentOf, isTop5, type Continent } from "../lib/continents";
import type { MatchListItem } from "../hooks/useMatches";

export type MatchFilter =
  | { kind: "all" }
  | { kind: "top5" }
  | { kind: "continent"; continent: Continent }
  | { kind: "competition"; competitionId: string };

export function filterKey(filter: MatchFilter): string {
  switch (filter.kind) {
    case "all":
      return "all";
    case "top5":
      return "top5";
    case "continent":
      return `continent:${filter.continent}`;
    case "competition":
      return `competition:${filter.competitionId}`;
  }
}

export interface MatchFiltersProps {
  matches: MatchListItem[];
  value: MatchFilter;
  onChange: (filter: MatchFilter) => void;
}

export function MatchFilters({ matches, value, onChange }: MatchFiltersProps) {
  const continentsPresent = new Set<Continent>();
  const competitionsById = new Map<string, { name: string }>();
  const continentCounts = new Map<Continent, number>();
  const competitionCounts = new Map<string, number>();
  let top5Count = 0;

  for (const match of matches) {
    if (!match.competition) continue;
    const { name, country, id } = match.competition;

    const continent = continentOf(country);
    if (continent) {
      continentsPresent.add(continent);
      continentCounts.set(continent, (continentCounts.get(continent) ?? 0) + 1);
    }

    competitionsById.set(id, { name });
    competitionCounts.set(id, (competitionCounts.get(id) ?? 0) + 1);

    if (isTop5(name, country)) top5Count += 1;
  }

  const competitions = [...competitionsById.entries()]
    .map(([id, c]) => ({ id, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const currentKey = filterKey(value);

  function chip(filter: MatchFilter, label: string, count: number) {
    const key = filterKey(filter);
    return (
      <button
        key={key}
        type="button"
        className={["filtre-chip", currentKey === key ? "actif" : ""]
          .filter(Boolean)
          .join(" ")}
        onClick={() => onChange(filter)}
      >
        {label} ({count})
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-5">
      {chip({ kind: "all" }, "Toutes", matches.length)}
      {chip({ kind: "top5" }, "Top 5 européen", top5Count)}
      {[...continentsPresent].map((continent) =>
        chip(
          { kind: "continent", continent },
          CONTINENT_LABELS[continent],
          continentCounts.get(continent) ?? 0,
        ),
      )}

      <select
        className="champ-input ml-auto w-auto py-1.5 px-3 text-[13px]"
        value={value.kind === "competition" ? value.competitionId : ""}
        onChange={(e) => {
          if (e.target.value) {
            onChange({ kind: "competition", competitionId: e.target.value });
          }
        }}
      >
        <option value="">Toutes les compétitions</option>
        {competitions.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({competitionCounts.get(c.id) ?? 0})
          </option>
        ))}
      </select>
    </div>
  );
}
