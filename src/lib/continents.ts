export type Continent = "europe" | "amerique-du-sud" | "amerique-du-nord" | "asie";

export const CONTINENT_LABELS: Record<Continent, string> = {
  europe: "Europe",
  "amerique-du-sud": "Amérique du Sud",
  "amerique-du-nord": "Amérique du Nord",
  asie: "Asie",
};

// Classement par pays réellement présents en base (pas une liste mondiale
// générique). Turquie, Israël et Chypre sont classés Europe : géographie
// mise à part, leurs clubs jouent en compétitions UEFA — ce qui compte pour
// un filtre "championnats européens" plutôt que la géographie stricte.
const COUNTRY_TO_CONTINENT: Record<string, Continent> = {
  Austria: "europe",
  Belgium: "europe",
  Bulgaria: "europe",
  Croatia: "europe",
  Cyprus: "europe",
  "Czech Republic": "europe",
  Denmark: "europe",
  England: "europe",
  Finland: "europe",
  France: "europe",
  Germany: "europe",
  Greece: "europe",
  Hungary: "europe",
  Israel: "europe",
  Italy: "europe",
  Netherlands: "europe",
  Norway: "europe",
  Poland: "europe",
  Portugal: "europe",
  Romania: "europe",
  Scotland: "europe",
  Serbia: "europe",
  Slovakia: "europe",
  Slovenia: "europe",
  Spain: "europe",
  Sweden: "europe",
  Switzerland: "europe",
  Turkey: "europe",
  Ukraine: "europe",

  Brazil: "amerique-du-sud",

  Mexico: "amerique-du-nord",
  USA: "amerique-du-nord",

  China: "asie",
  "Saudi Arabia": "asie",
  "South Korea": "asie",
};

// Compétitions continentales (UEFA Champions/Europa/Conference League) : pas
// de `country` en base, mais ce sont des compétitions européennes.
export function continentOf(country: string | null): Continent | null {
  if (country === null) return "europe";
  return COUNTRY_TO_CONTINENT[country] ?? null;
}

// Les "5 grands championnats" — match exact (nom + pays) pour ne pas
// confondre Ligue 1/Ligue 2, Bundesliga/2. Bundesliga, Serie A/Serie B.
const TOP_5 = new Set([
  "Premier League|England",
  "LaLiga|Spain",
  "Bundesliga|Germany",
  "Serie A|Italy",
  "Ligue 1|France",
]);

export function isTop5(name: string, country: string | null): boolean {
  return TOP_5.has(`${name}|${country ?? ""}`);
}

// "Importants" pour la page d'accueil : les 5 grands championnats + la
// Ligue des champions — les compétitions que l'accueil met en avant en
// premier, tel que demandé.
export function isImportant(name: string, country: string | null): boolean {
  return isTop5(name, country) || name === "UEFA Champions League";
}
