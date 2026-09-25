# Eleven Logs

Le foot, loggé match par match. Note chaque match que tu regardes, élis l'homme du match, suis tes statistiques de saison et l'activité de tes amis — dans l'esprit d'un Letterboxd, mais pour le football.

🌐 [elevenlogs.app](https://elevenlogs.app/)

## Stack technique

- **Frontend** : React 19, TypeScript, Vite, Tailwind CSS
- **Routing** : React Router
- **Data fetching** : TanStack Query
- **Auth** : Clerk
- **Backend** : Supabase (Postgres, RLS, Edge Functions) — le schéma de base de données et les Edge Functions ne sont pas inclus dans ce dépôt public
- **Graphiques** : Recharts
- **Notifications push** : Web Push (VAPID)
- **Export d'images** : html-to-image

Ce dépôt contient uniquement le frontend. La configuration Supabase (migrations SQL, policies RLS, Edge Functions) est gérée séparément et n'est pas publiée ici.

## Lancer le projet en local

Prérequis : Node.js 20+, un projet Supabase existant et une application Clerk.

```bash
npm install
cp .env.example .env
```

Renseigne les variables dans `.env` :

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | URL de ton projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé publique (anon) de ton projet Supabase |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clé publique de ton application Clerk |
| `VITE_VAPID_PUBLIC_KEY` | Clé publique VAPID pour les notifications push web |

Puis lance le serveur de développement :

```bash
npm run dev
```

Autres commandes disponibles :

```bash
npm run build    # build de production (tsc + vite build)
npm run lint     # eslint
npm run preview  # preview du build de production
```

## Extension navigateur

Le dossier `extension/` contient une extension Chrome (Manifest V3) qui ouvre une popup rapide pour noter un match sans quitter son onglet. Voir `extension/README.md`.

## Licence

Distribué sous licence MIT — voir [LICENSE](./LICENSE).
