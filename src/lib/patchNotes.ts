export interface PatchNote {
  version: string;
  title: string;
  items: string[];
}

// Chaque prochaine patch note s'ajoute en fin de tableau — usePatchNote.ts
// et PatchNoteModal.tsx ne dépendent que de LATEST_PATCH_NOTE, donc publier
// une nouvelle version ne demande rien d'autre que d'ajouter une entrée ici.
export const PATCH_NOTES: PatchNote[] = [
  {
    version: "0.1.1",
    title: "Patch Note V0.1.1",
    items: [
  "#28 — Un log en attente qui échoue définitivement ne bloque plus toute la file de synchro hors-ligne, et l'utilisateur voit qu'il doit agir",
  "#29 — Sur l'accueil, une erreur réseau affiche \"Réessayer\" au lieu de faire croire qu'il n'y a rien à voir",
  "#30 — La recherche globale (header) trouve aussi les comptes à suivre, pas seulement les matchs",
  "#31 — Un match déjà noté hors-ligne ne redevient plus \"à loguer\" après un rechargement à froid, tant que la synchro n'est pas passée",
  "#32 — Cliquer \"Suivre\" ou \"♡\" sur une carte ne fige plus tous les autres logs de la liste en état chargé",
  "#33 — Supprimer un log qui échoue (hors-ligne ou erreur réseau) affiche une erreur claire au lieu d'échouer sans aucun feedback",
  "#34 — Les compteurs d'abonnés/abonnements et la liste \"Comptes bloqués\" se mettent à jour immédiatement après une action, sans recharger la page",
  "#35 — Activité, Découverte, recherche de comptes et liste abonnés/abonnements affichent une vraie erreur réseau au lieu de faire croire que c'est vide",
  "#36 — Renoter un match déjà en attente de synchro (hors-ligne) ne perd plus silencieusement la note la plus récente",
  "#37 — Sur \"À loguer\", chaque match affiche le temps restant avant de sortir silencieusement de la liste des 72h",
  "#38 — Un like/unlike qui échoue en réseau instable affiche enfin un message d'erreur, comme pour Suivre et Bloquer",
  "#39 — La cloche de notifications distingue \"vide\" d'\"erreur réseau\" et ne marque plus les notifications comme lues si elles n'ont pas pu être affichées",
  "#40 — Supprimer un log encore en attente de synchro l'annule vraiment, au lieu de le laisser réapparaître au retour réseau",
  "#41 — Cliquer sur une notification \"a aimé ton log\" ouvre directement le match noté, au lieu de renvoyer vers tout le journal",
  "#42 — Sur un profil public, une erreur réseau n'affiche plus \"Ce profil n'existe pas\" mais un vrai message d'erreur avec bouton Réessayer",
  "#43 — Sur \"Mon journal\", une erreur réseau affiche un vrai message d'erreur au lieu de faire croire que tu n'as rien logué",
  "#44 — Après avoir noté un match pour la première fois, on peut le partager immédiatement au lieu de devoir rouvrir la modale",
  "#45 — Sur \"Ta saison\", une erreur réseau affiche un vrai message avec Réessayer au lieu de faire croire que tu n'as rien logué",
  "#46 — La date de visionnage d'un log est enfin modifiable, pour un rattrapage tardif sans fausser les stats de saison",
  "#47 — Sur Activité, si \"Charger plus\" échoue (réseau coupé en scrollant), un message d'erreur avec Réessayer apparaît au lieu de laisser le bouton se réinitialiser silencieusement",
  "#48 — Fermer la modale de notation sans enregistrer demande confirmation si une note/commentaire a été saisi",
  "#49 — Supprimer un log demande confirmation, au lieu d'effacer la note en un seul tap accidentel",
  "#50 — Le badge et le titre \"À loguer\" affichent le vrai nombre de matchs en attente, pas juste les 9 visibles dans la grille",
  "#51 — Matchs personnalisés + multiplex (note globale)",
  "#52 — La recherche globale n'ouvre plus la notation pour un match qui n'a pas encore été joué",
    ],
  },
  {
    version: "0.1.2",
    title: "Patch Note V0.1.2",
    items: [
      "#53 — Notes demi-points (.5) disponibles sur mobile : tu peux enfin taper 1.5 / 2.5 / … / 9.5 quand tu notes",
      "#54 — Stats : ajout des indicateurs sur les 14 derniers jours (Logs 14j, Moyenne 14j, Meilleure 14j)",
      "#55 — Animations UI : toast de célébration (✨) quand un log est enregistré, et highlight sur les nouveautés dans le fil d’activité",
      "#56 — Partage : bouton \"Partager\" plus visible sur mobile (story), avec partage natif quand possible + fallback sur Télécharger",
      "#57 — Matchs : tri amélioré dans l’onglet Matchs : coupes européennes → top 5 européens → autres, puis tri par heure de match",
    ],
  },
];

export const LATEST_PATCH_NOTE = PATCH_NOTES[PATCH_NOTES.length - 1];
