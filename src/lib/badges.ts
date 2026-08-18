export type BadgeTheme = "progression" | "diversite" | "social" | "implication";

export const BADGE_THEMES: Record<BadgeTheme, string> = {
  progression: "Progression",
  diversite: "Diversité",
  social: "Social",
  implication: "Implication",
};

interface BadgeTierDef {
  threshold: number;
  name: string;
  description: string;
}

interface BadgeTrackDef {
  id: string;
  theme: BadgeTheme;
  tiers: BadgeTierDef[];
}

export interface BadgeDefinition {
  id: string;
  trackId: string;
  theme: BadgeTheme;
  label: string;
  description: string;
  threshold: number;
  /** Palier précédent de la même piste, pour dessiner la barre de progression. */
  prevThreshold: number;
}

// Chaque "piste" (track) correspond à une seule métrique mesurable (nombre
// de matchs, meilleure série...) et progresse par paliers indépendants —
// plutôt qu'un unique badge par catégorie, chaque palier franchi reste un
// trophée séparé et permanent dans la collection, à la façon d'un tableau
// de succès Xbox/PSN.
const TRACKS: BadgeTrackDef[] = [
  {
    id: "volume",
    theme: "progression",
    tiers: [
      { threshold: 1, name: "Coup d'envoi", description: "Ton premier match loggué" },
      { threshold: 10, name: "Supporter régulier", description: "10 matchs loggués" },
      { threshold: 25, name: "Abonné du stade", description: "25 matchs loggués" },
      { threshold: 50, name: "Encyclopédie vivante", description: "50 matchs loggués" },
      { threshold: 100, name: "Légende", description: "100 matchs loggués" },
    ],
  },
  {
    id: "streak",
    theme: "progression",
    tiers: [
      { threshold: 3, name: "Sur la lancée", description: "3 jours de suite avec un log" },
      { threshold: 7, name: "Série de feu", description: "7 jours de suite avec un log" },
      { threshold: 30, name: "Increvable", description: "30 jours de suite avec un log" },
    ],
  },
  {
    id: "continents",
    theme: "diversite",
    tiers: [
      { threshold: 2, name: "Petit voyage", description: "Matchs vus sur 2 continents" },
      { threshold: 4, name: "Globe-trotter", description: "Matchs vus sur 4 continents" },
    ],
  },
  {
    id: "competitions",
    theme: "diversite",
    tiers: [
      { threshold: 3, name: "Curieux", description: "3 compétitions différentes" },
      { threshold: 6, name: "Multi-compétitions", description: "6 compétitions différentes" },
      { threshold: 12, name: "Expert", description: "12 compétitions différentes" },
    ],
  },
  {
    id: "teams",
    theme: "diversite",
    tiers: [
      { threshold: 10, name: "Carnet d'adresses", description: "10 équipes différentes" },
      { threshold: 25, name: "Collectionneur", description: "25 équipes différentes" },
      { threshold: 50, name: "Encyclopédie des clubs", description: "50 équipes différentes" },
    ],
  },
  {
    id: "followers",
    theme: "social",
    tiers: [
      { threshold: 1, name: "Premier fan", description: "1 abonné" },
      { threshold: 10, name: "Petite communauté", description: "10 abonnés" },
      { threshold: 25, name: "Populaire", description: "25 abonnés" },
      { threshold: 100, name: "Icône", description: "100 abonnés" },
    ],
  },
  {
    id: "following",
    theme: "social",
    tiers: [
      { threshold: 5, name: "Sociable", description: "5 comptes suivis" },
      { threshold: 20, name: "Grand réseau", description: "20 comptes suivis" },
    ],
  },
  {
    id: "motm",
    theme: "implication",
    tiers: [
      { threshold: 5, name: "Œil de recruteur", description: "5 hommes du match désignés" },
      { threshold: 20, name: "Chasseur de MVP", description: "20 hommes du match désignés" },
      { threshold: 50, name: "Grand jury", description: "50 hommes du match désignés" },
    ],
  },
  {
    id: "comments",
    theme: "implication",
    tiers: [
      { threshold: 5, name: "Ça commente", description: "5 commentaires postés" },
      { threshold: 25, name: "Commentateur", description: "25 commentaires postés" },
    ],
  },
  {
    id: "multiplex",
    theme: "implication",
    tiers: [
      { threshold: 2, name: "Multiplex", description: "Un multiplex de 2 matchs ou plus" },
      { threshold: 4, name: "Grand multiplex", description: "Un multiplex de 4 matchs ou plus" },
      { threshold: 6, name: "Marathon", description: "Un multiplex de 6 matchs ou plus" },
    ],
  },
];

export const BADGES: BadgeDefinition[] = TRACKS.flatMap((track) =>
  track.tiers.map((tier, i) => ({
    id: `${track.id}-${tier.threshold}`,
    trackId: track.id,
    theme: track.theme,
    label: tier.name,
    description: tier.description,
    threshold: tier.threshold,
    prevThreshold: i === 0 ? 0 : track.tiers[i - 1].threshold,
  })),
);
