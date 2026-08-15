// Dégradés dérivés de la charte (anthracite/pelouse/projecteur) pour les
// pastilles d'équipe sans logo — plutôt que des teintes arbitraires par
// équipe, la variété vient du hash du nom. Partagé entre MatchCard (cartes
// in-app) et ShareCard (story exportée) pour qu'une même équipe garde
// toujours le même dégradé partout dans l'app.
const CREST_GRADIENTS = [
  "linear-gradient(135deg, var(--color-nuit-haute), var(--color-pelouse))",
  "linear-gradient(135deg, var(--color-pelouse), var(--color-nuit))",
  "linear-gradient(135deg, var(--color-ligne), var(--color-projecteur-fonce))",
  "linear-gradient(135deg, var(--color-nuit-haute), var(--color-ligne))",
  "linear-gradient(135deg, var(--color-projecteur-fonce), var(--color-nuit-haute))",
];

export function crestGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return CREST_GRADIENTS[hash % CREST_GRADIENTS.length];
}
