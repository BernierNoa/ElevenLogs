import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "../lib/supabase";

export type MatchStatus = "scheduled" | "live" | "finished" | "postponed";

export interface MatchListItem {
  id: string;
  kickoff_at: string;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  competition: {
    id: string;
    name: string;
    country: string | null;
    logo_url: string | null;
  } | null;
  home_team: { name: string; logo_url: string | null } | null;
  away_team: { name: string; logo_url: string | null } | null;
}

export interface UseMatchesOptions {
  /** Borne inférieure incluse (ISO). */
  from?: string;
  /** Borne supérieure exclue (ISO). */
  to?: string;
}

// PostgREST plafonne une réponse sans pagination explicite à 1000 lignes par
// défaut. La table `matches` a dépassé ce seuil (1525 lignes au moment de ce
// correctif) : un appel non borné (Journal, useSeasonStats — "tout
// l'historique") ne recevait donc que les 1000 premières par kickoff_at
// croissant, càd les plus ANCIENNES — les matchs du jour (les plus
// récents) étaient silencieusement absents du résultat. Un match tout
// juste logué restait alors introuvable en croisant matches/logs, alors
// que `logs` contenait bien la ligne (useMyLogs interroge `logs`
// directement, sans passer par `matches`, d'où l'écart symptomatique
// "loggé mais absent du Journal/Stats"). Pagination en boucle plutôt qu'un
// simple `.limit()` plus généreux : la table continuera de grossir, un
// plafond fixe ne ferait que reculer le même bug.
const PAGE_SIZE = 1000;

// `from`/`to` restent optionnels : Journal a besoin de tout l'historique des
// matchs loggués (même anciens), seule la page Matchs impose une fenêtre.
export function useMatches(options: UseMatchesOptions = {}) {
  const { from, to } = options;

  return useQuery({
    queryKey: ["matches", from, to],
    queryFn: async (): Promise<MatchListItem[]> => {
      const all: MatchListItem[] = [];
      let offset = 0;

      while (true) {
        let query = supabasePublic
          .from("matches")
          .select(
            `
            id,
            kickoff_at,
            status,
            home_score,
            away_score,
            competition:competitions(id, name, country, logo_url),
            home_team:teams!home_team_id(name, logo_url),
            away_team:teams!away_team_id(name, logo_url)
          `,
          )
          .order("kickoff_at", { ascending: true })
          .range(offset, offset + PAGE_SIZE - 1);

        if (from) query = query.gte("kickoff_at", from);
        if (to) query = query.lt("kickoff_at", to);

        const { data, error } = await query;
        if (error) throw error;

        const page = (data ?? []) as unknown as MatchListItem[];
        all.push(...page);

        if (page.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }

      if (!from && !to) {
        console.debug(`[useMatches] appel non borné — ${all.length} match(s) récupéré(s) au total`);
      }

      return all;
    },
  });
}
