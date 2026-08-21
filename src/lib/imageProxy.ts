const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// Passe une image externe par l'Edge Function image-proxy plutôt que de la
// charger directement : PronoGoat ne renvoie aucun en-tête CORS, donc
// html-to-image (qui refetch chaque <img> pour l'intégrer en data URI lors
// de l'export) ne pouvait jamais lire ses pixels — le proxy sert la même
// image depuis notre propre domaine Supabase, avec CORS ouvert (image
// publique, lecture seule).
export function proxiedImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return `${supabaseUrl}/functions/v1/image-proxy?url=${encodeURIComponent(url)}`;
}
