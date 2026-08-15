import type { AdminMatchItem } from "../hooks/useAdminMatches";

// Distance de Levenshtein classique (DP), inputs courts (noms d'équipe) —
// coût négligeable même appelée des centaines de fois sur ~630 matchs.
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

const RARE_MAX_COUNT = 2;
const COMMON_MIN_COUNT = 5;
const MAX_DISTANCE = 3;
const MAX_RELATIVE_DISTANCE = 0.3;

// Heuristique "anomalie de scraping" sans nouvelle table ni ML : un nom
// d'équipe qui n'apparaît que dans 1-2 matchs (typo isolée type "Slavia
// Soa") ET très proche par distance d'édition d'un nom bien plus fréquent
// (le vrai nom, "Slavia Sofia") est probablement une faute d'import. Purs
// calculs client sur les données déjà chargées, aucune requête de plus.
export function detectAnomalousTeamIds(matches: AdminMatchItem[]): Set<string> {
  const teamCounts = new Map<string, { id: string; name: string; count: number }>();

  for (const match of matches) {
    for (const team of [match.home_team, match.away_team]) {
      if (!team) continue;
      const entry = teamCounts.get(team.id) ?? { id: team.id, name: team.name, count: 0 };
      entry.count += 1;
      teamCounts.set(team.id, entry);
    }
  }

  const teams = [...teamCounts.values()];
  const rareTeams = teams.filter((t) => t.count <= RARE_MAX_COUNT);
  const commonTeams = teams.filter((t) => t.count >= COMMON_MIN_COUNT);

  const anomalousIds = new Set<string>();
  for (const rare of rareTeams) {
    for (const common of commonTeams) {
      if (rare.id === common.id) continue;
      const distance = levenshtein(rare.name.toLowerCase(), common.name.toLowerCase());
      if (distance === 0 || distance > MAX_DISTANCE) continue;
      const relative = distance / Math.max(rare.name.length, common.name.length);
      if (relative <= MAX_RELATIVE_DISTANCE) {
        anomalousIds.add(rare.id);
        break;
      }
    }
  }

  return anomalousIds;
}
