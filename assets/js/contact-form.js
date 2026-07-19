/* ================================================================
   BLACK V PRESTIGE — FORMULAIRE DE CONTACT
   Envoie le formulaire vers api/send-contact.js (fonction serverless
   Vercel) qui relaie le message par email via Resend.
   ================================================================ */

(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const BACKEND_URL = 'https://black-v-prestige.vercel.app/api/send-contact';
  const btn    = document.getElementById('contact-submit');
  const status = document.getElementById('contact-status');

  function showStatus(text, ok) {
    status.textContent = text;
    status.style.display = 'block';
    status.style.color = ok ? '#2e7d32' : '#c0392b';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.style.display = 'none';

    const payload = {
      nom:     document.getElementById('contact-nom').value.trim(),
      prenom:  document.getElementById('contact-prenom').value.trim(),
      tel:     document.getElementById('contact-tel').value.trim(),
      email:   document.getElementById('contact-email').value.trim(),
      sujet:   document.getElementById('contact-sujet').value,
      message: document.getElementById('contact-message').value.trim()
    };

    if (!payload.nom || !payload.prenom || !payload.email || !payload.message) {
      showStatus('Merci de remplir tous les champs obligatoires.', false);
      return;
    }

    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="bvp-spinner"></span>&nbsp; Envoi en cours…';

    try {
      const res  = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Une erreur est survenue.');

      showStatus('Votre message a bien été envoyé. Nous vous répondrons rapidement.', true);
      form.reset();

    } catch (err) {
      showStatus(err.message || 'Impossible d\'envoyer le message pour le moment. Contactez-nous directement par téléphone ou email.', false);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  });
})();
