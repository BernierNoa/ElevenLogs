// Un seul compte admin pour l'instant. Ce contrôle côté client n'est qu'un
// raccourci d'UX (masquer/rediriger la page) — la vraie barrière de
// sécurité est la policy RLS posée sur `matches` (delete) et `logs`
// (select), qui vérifie ce même identifiant côté base de données,
// indépendamment de ce que fait ou contourne le client. Voir la migration
// 20260727000000_add_admin_access.sql.
export const ADMIN_USER_ID = "user_3GrTXfGTTQd0mWVcpmaXZAPLYXO";
