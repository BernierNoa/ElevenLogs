// Un seul compte admin pour l'instant. Ce contrôle côté client n'est qu'un
// raccourci d'UX (masquer/rediriger la page) — la vraie barrière de
// sécurité est la policy RLS posée côté base de données sur les tables
// concernées, qui vérifie ce même identifiant indépendamment de ce que
// fait ou contourne le client.
export const ADMIN_USER_ID = "user_3GrTXfGTTQd0mWVcpmaXZAPLYXO";
