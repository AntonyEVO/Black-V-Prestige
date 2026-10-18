/* ================================================================
   MONTCLAIR PRESTIGE — SÉLECTEUR D'UNIVERS (ÉCRAN D'ACCUEIL)
   Premier écran affiché à l'arrivée sur le site : Côte d'Azur ou
   Alpes & Suisse. Le choix "Côte d'Azur" referme l'écran et révèle
   la page d'accueil normale ; "Alpes & Suisse" navigue vers la page
   dédiée. Le choix est mémorisé pour l'onglet/la session en cours
   (sessionStorage) : il ne redemande pas lors d'une navigation dans
   le site, mais reproposera le choix si le visiteur ferme puis
   rouvre le site plus tard.
   ================================================================ */

(function () {
  const gate = document.getElementById('universe-gate');
  if (!gate) return;

  const STORAGE_KEY = 'mp_universe';
  const html = document.documentElement;

  function remember(value) {
    try { sessionStorage.setItem(STORAGE_KEY, value); } catch (e) {}
  }

  // Visiteur qui a déjà choisi : l'écran est déjà invisible (CSS), on le
  // retire complètement du flux au lieu de bloquer le scroll inutilement.
  if (html.classList.contains('universe-chosen')) {
    gate.style.display = 'none';
  } else {
    html.style.overflow = 'hidden';
  }

  const azurChoice = document.getElementById('gate-choice-azur');
  if (azurChoice) {
    azurChoice.addEventListener('click', (e) => {
      e.preventDefault();
      remember('azur');
      html.classList.add('universe-chosen');
      html.style.overflow = '';
      gate.addEventListener('transitionend', () => { gate.style.display = 'none'; }, { once: true });
    });
  }

  const hiverChoice = document.getElementById('gate-choice-hiver');
  if (hiverChoice) {
    hiverChoice.addEventListener('click', () => { remember('hiver'); });
    // Laisse le lien naviguer normalement vers la page Hiver.
  }
})();
