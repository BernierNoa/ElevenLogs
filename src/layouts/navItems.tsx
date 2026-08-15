import {
  IconAccueil,
  IconActivite,
  IconDecouverte,
  IconJournal,
  IconMatchs,
  IconProfil,
  IconStats,
} from "../components/icons";

export const navItems = [
  { to: "/", label: "Accueil", Icon: IconAccueil, end: true },
  { to: "/matchs", label: "Matchs", Icon: IconMatchs, end: false },
  { to: "/journal", label: "Mon journal", Icon: IconJournal, end: false },
  { to: "/activite", label: "Activité", Icon: IconActivite, end: false },
  { to: "/decouverte", label: "Découverte", Icon: IconDecouverte, end: false },
  { to: "/stats", label: "Statistiques", Icon: IconStats, end: false },
  { to: "/profil", label: "Profil", Icon: IconProfil, end: false },
] as const;
