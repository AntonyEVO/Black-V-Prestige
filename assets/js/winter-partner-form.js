/* ================================================================
   MONTCLAIR PRESTIGE — FORMULAIRE PARTENARIAT HIVER (ALPES & SUISSE)
   Compose un message structuré à partir des champs établissement et
   l'envoie vers api/send-contact.js (même backend que le formulaire
   de contact standard, déjà en place et vérifié).
   ================================================================ */

(function () {
  const form = document.getElementById('winter-partner-form');
  if (!form) return;

  const BACKEND_URL = 'https://black-v-prestige.vercel.app/api/send-contact';
  const btn    = document.getElementById('wp-submit');
  const status = document.getElementById('wp-status');

  function showStatus(text, ok) {
    status.textContent = text;
    status.style.display = 'block';
    status.style.color = ok ? '#8fcf9f' : '#e08a8a';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.style.display = 'none';

    const etablissement = document.getElementById('wp-etablissement').value.trim();
    const type           = document.getElementById('wp-type').value;
    const ville           = document.getElementById('wp-ville').value.trim();
    const prenom           = document.getElementById('wp-prenom').value.trim();
    const nom               = document.getElementById('wp-nom').value.trim();
    const tel                 = document.getElementById('wp-tel').value.trim();
    const email                 = document.getElementById('wp-email').value.trim();
    const besoin                   = document.getElementById('wp-message').value.trim();

    if (!etablissement || !type || !ville || !prenom || !nom || !email) {
      showStatus('Merci de remplir tous les champs obligatoires.', false);
      return;
    }

    const message = [
      `Nouvelle demande de partenariat — Offre Hiver (Alpes & Suisse)`,
      `Établissement : ${etablissement}`,
      `Type : ${type}`,
      `Station / Ville : ${ville}`,
      besoin ? `Besoin exprimé : ${besoin}` : ''
    ].filter(Boolean).join('\n');

    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="bvp-spinner"></span>&nbsp; Envoi en cours…';

    try {
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom, prenom, tel, email,
          sujet: `Partenariat Hiver — ${etablissement} (${ville})`,
          message
        })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Une erreur est survenue.');

      showStatus('Votre demande a bien été envoyée. Notre équipe revient vers vous sous 24h.', true);
      form.reset();

    } catch (err) {
      showStatus(err.message || 'Impossible d\'envoyer la demande pour le moment. Contactez-nous directement par téléphone ou email.', false);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  });
})();
