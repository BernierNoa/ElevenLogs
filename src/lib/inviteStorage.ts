const PENDING_INVITE_KEY = "elevenlogs:pendingInviteRef";

// localStorage plutôt qu'un simple state React : le lien d'invitation
// pointe vers /u/:userId (page publique, consultable sans compte), alors
// que l'auto-follow ne peut s'exécuter qu'une fois inscrit — potentiellement
// après une redirection OAuth ou une vérification d'email qui remonte une
// nouvelle page sans le paramètre d'URL d'origine.
export function storePendingInvite(userId: string): void {
  try {
    localStorage.setItem(PENDING_INVITE_KEY, userId);
  } catch {
    // Stockage indisponible (navigation privée stricte...) : l'invitation
    // ne sera simplement pas suivie automatiquement, sans bloquer la page.
  }
}

export function consumePendingInvite(): string | null {
  try {
    const value = localStorage.getItem(PENDING_INVITE_KEY);
    if (value) localStorage.removeItem(PENDING_INVITE_KEY);
    return value;
  } catch {
    return null;
  }
}
