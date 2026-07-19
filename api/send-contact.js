// ================================================================
//  BLACK V PRESTIGE — FONCTION SERVERLESS VERCEL (FORMULAIRE CONTACT)
// ================================================================
//  Envoie le contenu du formulaire de contact par email via Resend
//  (https://resend.com), sans exposer de clé côté client.
//
//  Variable d'environnement à définir dans le tableau de bord Vercel
//  (jamais dans le code ni dans le dépôt) :
//    RESEND_API_KEY = re_...
// ================================================================

const DEST_EMAIL = 'blackvprestige@gmail.com';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:8080',
  'https://antonyevo.github.io',
  'https://www.blackvprestige.fr',
  'https://blackvprestige.fr'
];

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée.' });
    return;
  }

  try {
    const { nom, prenom, tel, email, sujet, message } = req.body || {};

    if (!nom || !prenom || !email || !message) {
      res.status(400).json({ error: 'Merci de remplir tous les champs obligatoires.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Adresse email invalide.' });
      return;
    }

    const html = `
      <h2>Nouveau message depuis le site Black V Prestige</h2>
      <p><strong>Nom :</strong> ${esc(prenom)} ${esc(nom)}</p>
      <p><strong>Email :</strong> ${esc(email)}</p>
      <p><strong>Téléphone :</strong> ${esc(tel) || 'Non renseigné'}</p>
      <p><strong>Sujet :</strong> ${esc(sujet) || 'Non précisé'}</p>
      <p><strong>Message :</strong></p>
      <p>${esc(message).replace(/\n/g, '<br>')}</p>
    `;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Black V Prestige <onboarding@resend.dev>',
        to: [DEST_EMAIL],
        reply_to: email,
        subject: `Nouveau message — ${sujet || 'Site Black V Prestige'}`,
        html
      })
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error('Resend error:', errBody);
      res.status(502).json({ error: 'Échec de l\'envoi de l\'email.' });
      return;
    }

    res.status(200).json({ ok: true });

  } catch (err) {
    console.error('send-contact error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
