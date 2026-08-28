# ElevenLogs — extension navigateur

Ouvre une petite fenêtre pointant sur `elevenlogs.app/rapide` pour noter un
match sans quitter l'onglet en cours. Ne détecte pas automatiquement le match
regardé (aucun scraper par site) — elle transmet juste le titre de l'onglet
actif comme indice pour pré-classer la liste, cf. `matchScore` dans
`src/pages/QuickLog.tsx`.

Pas de build, pas de dépendances : ce dossier est chargé tel quel par le
navigateur.

## Installer en local (non publiée)

**Chrome / Edge / Brave**
1. `chrome://extensions` (ou `edge://extensions`)
2. Activer "Mode développeur" (coin supérieur droit)
3. "Charger l'extension non empaquetée" → sélectionner ce dossier
   (`extension/`)
4. L'icône ElevenLogs apparaît dans la barre d'outils — un clic ouvre la
   fenêtre de notation

Après toute modification de `background.js` ou `manifest.json`, cliquer sur
l'icône de rechargement de l'extension dans `chrome://extensions`.

## Pourquoi une fenêtre popup plutôt que le dropdown natif de l'extension

Le dropdown natif (`default_popup`) est une page isolée dans le contexte de
l'extension — impossible d'y hériter simplement des cookies de session du
site. `chrome.windows.create()` fait une vraie navigation top-level vers
`elevenlogs.app`, qui récupère donc la session Clerk existante exactement
comme un nouvel onglet normal. Il faut être connecté à ElevenLogs dans le
navigateur pour que la fenêtre affiche autre chose que l'écran de connexion.

## Publication sur le Chrome Web Store

Non fait ici — nécessite un compte développeur Google (frais unique) et une
review manuelle par Google. Cette extension n'est utilisable pour l'instant
qu'en local via "Charger l'extension non empaquetée".
