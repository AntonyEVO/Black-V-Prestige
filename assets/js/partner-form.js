/* ================================================================
   BLACK V PRESTIGE — FORMULAIRE "APPORTEUR D'AFFAIRES"
   Formulaire en 2 étapes : demande (étape 1) puis coordonnées
   (étape 2). Envoie vers api/send-partner.js (Vercel + Resend),
   avec pièce jointe CSV optionnelle encodée en base64.
   ================================================================ */

(function () {
  const form = document.getElementById('partner-form');
  if (!form) return;

  const BACKEND_URL = 'https://black-v-prestige.vercel.app/api/send-partner';

  const panel1   = document.getElementById('p-panel-1');
  const panel2   = document.getElementById('p-panel-2');
  const panelOk  = document.getElementById('p-panel-success');
  const hint1    = document.getElementById('p-hint-1');
  const hint2    = document.getElementById('p-hint-2');

  const dateDebut = document.getElementById('p-date-debut');
  const dateFin   = document.getElementById('p-date-fin');
  const today = new Date().toISOString().split('T')[0];
  if (dateDebut) dateDebut.min = today;
  if (dateFin)   dateFin.min   = today;

  function goStep(n) {
    panel1.style.display = n === 1 ? 'flex' : 'none';
    panel2.style.display = n === 2 ? 'flex' : 'none';
  }

  /* ── Étape 1 → 2 ── */
  document.getElementById('p-btn1-next').addEventListener('click', () => {
    const message = document.getElementById('p-message').value.trim();
    const csvFile = document.getElementById('p-csv').files[0];

    if (!message && !csvFile) {
      hint1.classList.add('show');
      return;
    }
    hint1.classList.remove('show');
    goStep(2);
  });

  /* ── Étape 2 → 1 ── */
  document.getElementById('p-btn2-back').addEventListener('click', () => goStep(1));

  /* ── Lecture du CSV en base64 (si présent) ── */
  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]); // retire le prefixe data:...;base64,
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /* ── Envoi final ── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const prenom = document.getElementById('p-prenom').value.trim();
    const nom    = document.getElementById('p-nom').value.trim();
    const email  = document.getElementById('p-email').value.trim();
    const rgpd   = document.getElementById('p-rgpd').checked;

    if (!prenom || !nom || !email || !rgpd) {
      hint2.classList.add('show');
      return;
    }
    hint2.classList.remove('show');

    const btn = document.getElementById('p-btn-send');
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="bvp-spinner"></span>&nbsp; Envoi en cours…';

    try {
      const csvFile = document.getElementById('p-csv').files[0];
      let csvName = null, csvContent = null;
      if (csvFile) {
        csvName = csvFile.name;
        csvContent = await readFileAsBase64(csvFile);
      }

      const payload = {
        lieu:       document.getElementById('p-lieu').value.trim(),
        dateDebut:  dateDebut.value,
        dateFin:    dateFin.value,
        message:    document.getElementById('p-message').value.trim(),
        prenom, nom,
        entreprise: document.getElementById('p-entreprise').value.trim(),
        secteur:    document.getElementById('p-secteur').value,
        email, tel: document.getElementById('p-tel').value.trim(),
        csvName, csvContent
      };

      const res  = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Une erreur est survenue.');

      panel2.style.display = 'none';
      panelOk.style.display = 'block';

    } catch (err) {
      hint2.textContent = err.message || 'Impossible d\'envoyer la demande pour le moment. Contactez-nous directement.';
      hint2.classList.add('show');
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  });
})();
