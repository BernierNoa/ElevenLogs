import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "../lib/supabase";

export interface CommunityBenchmarks {
  platformAverage: number | null;
  byCompetition: Map<string, number>;
  byTeam: Map<string, number>;
}

interface BenchmarkRow {
  rating: number;
  match: {
    competition: { name: string } | null;
    home_team: { name: string } | null;
    away_team: { name: string } | null;
  } | null;
}

// Même recette que usePlatformPlayerStats (scan borné + agrégation client)
// plutôt qu'une vue/fonction SQL dédiée : cohérent avec le reste du projet à
// ce stade. RLS filtre déjà `logs` aux logs publics de profils publics
// (client anonyme), donc "communauté" exclut naturellement les logs privés.
const RECENT_LOGS_SCANNED = 3000;

export function useCommunityBenchmarks(enabled: boolean) {
  return useQuery({
    queryKey: ["community-benchmarks"],
    enabled,
    queryFn: async (): Promise<CommunityBenchmarks> => {
      const { data, error } = await supabasePublic
        .from("logs")
        .select(
          "rating, match:matches(competition:competitions(name), home_team:teams!home_team_id(name), away_team:teams!away_team_id(name))",
        )
        .order("created_at", { ascending: false })
        .limit(RECENT_LOGS_SCANNED);
      if (error) throw error;

      const rows = (data ?? []) as unknown as BenchmarkRow[];

      let sum = 0;
      let count = 0;
      const compAgg = new Map<string, { sum: number; count: number }>();
      const teamAgg = new Map<string, { sum: number; count: number }>();

      for (const row of rows) {
        sum += row.rating;
        count += 1;

        const compName = row.match?.competition?.name;
        if (compName) {
          const entry = compAgg.get(compName) ?? { sum: 0, count: 0 };
          entry.sum += row.rating;
          entry.count += 1;
          compAgg.set(compName, entry);
        }

        for (const team of [row.match?.home_team, row.match?.away_team]) {
          if (!team) continue;
          const entry = teamAgg.get(team.name) ?? { sum: 0, count: 0 };
          entry.sum += row.rating;
          entry.count += 1;
          teamAgg.set(team.name, entry);
        }
      }

      return {
        platformAverage: count > 0 ? sum / count : null,
        byCompetition: new Map([...compAgg.entries()].map(([k, v]) => [k, v.sum / v.count])),
        byTeam: new Map([...teamAgg.entries()].map(([k, v]) => [k, v.sum / v.count])),
      };
    },
  });
}
