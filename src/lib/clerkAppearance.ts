// Reskin des composants Clerk (SignIn/SignUp/UserProfile/UserButton) pour
// coller à la DA plutôt que garder leur thème par défaut. Appliqué une seule
// fois au niveau de ClerkProvider (main.tsx) — vaut pour tous les composants
// Clerk rendus dans l'app, pas besoin de le répéter à chaque usage.
// Pas d'annotation de type explicite : le type ClerkAppearanceTheme n'est
// exposé par Clerk que via un sous-chemin interne (@clerk/shared/types), pas
// re-exporté proprement — la compatibilité structurelle avec `appearance`
// suffit à ClerkProvider.
export const clerkAppearance = {
  variables: {
    colorPrimary: "#1FE07A",
    colorBackground: "#101316",
    colorText: "#EDF2EF",
    colorTextSecondary: "#7E8B85",
    colorInputBackground: "#101316",
    colorInputText: "#EDF2EF",
    colorDanger: "#FF5C4D",
    colorNeutral: "#7E8B85",
    borderRadius: "10px",
    fontFamily: "'Instrument Sans', system-ui, sans-serif",
    fontFamilyButtons: "'Instrument Sans', system-ui, sans-serif",
  },
  elements: {
    rootBox: { width: "100%" },
    cardBox: {
      background: "#101316",
      border: "1px solid #232A2E",
      borderRadius: "16px",
      boxShadow: "none",
    },
    card: { background: "transparent", boxShadow: "none" },
    headerTitle: {
      fontFamily: "'Archivo', system-ui, sans-serif",
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "-0.02em",
      color: "#EDF2EF",
    },
    headerSubtitle: { color: "#7E8B85" },
    formFieldLabel: {
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: "10.5px",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "#7E8B85",
    },
    formFieldInput: {
      background: "#101316",
      border: "1px solid #232A2E",
      color: "#EDF2EF",
      "&:focus": { borderColor: "#1FE07A" },
    },
    formButtonPrimary: {
      background: "#1FE07A",
      color: "#04120A",
      fontWeight: 600,
      boxShadow: "none",
      "&:hover": { background: "#3BEB90" },
      "&:focus": { boxShadow: "none" },
    },
    footerActionLink: { color: "#1FE07A" },
    identityPreviewText: { color: "#EDF2EF" },
    identityPreviewEditButtonIcon: { color: "#1FE07A" },
    dividerLine: { background: "#232A2E" },
    dividerText: { color: "#4A5450" },
    socialButtonsBlockButton: {
      background: "#171B1F",
      border: "1px solid #232A2E",
      color: "#EDF2EF",
    },
    navbar: { background: "#101316", border: "none" },
    navbarButton: { color: "#7E8B85" },
    profileSectionTitleText: {
      fontFamily: "'Archivo', system-ui, sans-serif",
      fontWeight: 700,
      color: "#EDF2EF",
    },
    badge: {
      background: "rgba(31, 224, 122, 0.09)",
      color: "#1FE07A",
      borderColor: "#12A85C",
    },
  },
};
