// Heuristique, pas le vrai code FIFA (ceux-ci sont curatés à la main, pas
// dérivables mécaniquement) — mais cohérente avec les 3 exemples de la DA :
// "Real Madrid" → RMA, "Manchester City" → MCI, "Paris SG" → PSG.
export function abbreviateTeamName(name: string): string {
  const words = name.trim().split(/\s+/);

  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }

  return (words[0][0] + words[1].slice(0, 2)).toUpperCase();
}
