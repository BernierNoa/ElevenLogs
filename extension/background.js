// Aucun default_popup dans le manifest : on veut une vraie fenêtre popup
// (chrome.windows.create), pas le petit dropdown natif de l'extension —
// une navigation top-level vers elevenlogs.app hérite des cookies de
// session existants (Clerk) sans rien à re-authentifier ici, alors qu'une
// iframe se serait heurtée à X-Frame-Options/CSP. default_popup et
// action.onClicked sont mutuellement exclusifs : l'absence du premier est
// ce qui permet au second de se déclencher.

const QUICK_LOG_URL = "https://elevenlogs.app/rapide";
const POPUP_WIDTH = 420;
const POPUP_HEIGHT = 680;

chrome.action.onClicked.addListener(async (tab) => {
  // Best-effort : le titre de l'onglet sert uniquement à pré-classer la
  // liste de matchs côté /rapide (cf. matchScore dans QuickLog.tsx), jamais
  // à filtrer strictement — un titre absent ou inexploitable ne bloque rien.
  const hint = tab?.title ? `?hint=${encodeURIComponent(tab.title)}` : "";

  chrome.windows.create({
    url: `${QUICK_LOG_URL}${hint}`,
    type: "popup",
    width: POPUP_WIDTH,
    height: POPUP_HEIGHT,
  });
});
