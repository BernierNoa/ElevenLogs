export interface MockActivityItem {
  id: string;
  displayName: string;
  competitionName: string;
  homeTeamName: string;
  homeScore: number;
  awayTeamName: string;
  awayScore: number;
  rating: number | null;
  motmName: string | null;
  comment: string | null;
  relativeTime: string;
}

// Données statiques pour la home déconnectée — pas d'appel réseau avant
// inscription. Formes calquées sur FeedLogItem pour rester cohérent avec le
// vrai flux d'activité affiché une fois connecté.
export const MOCK_ACTIVITY: MockActivityItem[] = [
  {
    id: "mock-1",
    displayName: "Roman",
    competitionName: "Ligue 1",
    homeTeamName: "PSG",
    homeScore: 3,
    awayTeamName: "OM",
    awayScore: 1,
    rating: 8,
    motmName: null,
    comment: "Dembélé a tout cassé en deuxième mi-temps.",
    relativeTime: "il y a 12 min",
  },
  {
    id: "mock-2",
    displayName: "Léa",
    competitionName: "LaLiga",
    homeTeamName: "Real Madrid",
    homeScore: 2,
    awayTeamName: "Barcelona",
    awayScore: 1,
    rating: 7,
    motmName: "Bellingham",
    comment: null,
    relativeTime: "il y a 34 min",
  },
  {
    id: "mock-3",
    displayName: "Yanis",
    competitionName: "Premier League",
    homeTeamName: "Liverpool",
    homeScore: 4,
    awayTeamName: "Man City",
    awayScore: 0,
    rating: 9.5,
    motmName: null,
    comment: null,
    relativeTime: "il y a 1h",
  },
  {
    id: "mock-4",
    displayName: "Nawel",
    competitionName: "Premier League",
    homeTeamName: "Arsenal",
    homeScore: 1,
    awayTeamName: "Chelsea",
    awayScore: 1,
    rating: 6,
    motmName: null,
    comment: null,
    relativeTime: "il y a 2h",
  },
];
