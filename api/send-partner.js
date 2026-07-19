// ================================================================
//  BLACK V PRESTIGE — FONCTION SERVERLESS VERCEL
//  FORMULAIRE "APPORTEUR D'AFFAIRES"
// ================================================================
//  Envoie la demande (+ pièce jointe CSV éventuelle) par email via
//  Resend. Variable d'environnement requise (déjà configurée pour
//  le formulaire de contact) : RESEND_API_KEY.
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
    const {
      lieu, dateDebut, dateFin, message,
      prenom, nom, entreprise, secteur, email, tel,
      csvName, csvContent // csvContent = base64 (sans le prefixe data:...)
    } = req.body || {};

    if (!prenom || !nom || !email) {
      res.status(400).json({ error: 'Merci de remplir tous les champs obligatoires.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Adresse email invalide.' });
      return;
    }

    const html = `
      <h2>Nouvelle demande — Apporteur d'affaires</h2>
      <p><strong>Contact :</strong> ${esc(prenom)} ${esc(nom)} — ${esc(entreprise) || 'Entreprise non précisée'}</p>
      <p><strong>Secteur :</strong> ${esc(secteur) || 'Non précisé'}</p>
      <p><strong>Email :</strong> ${esc(email)}</p>
      <p><strong>Téléphone :</strong> ${esc(tel) || 'Non renseigné'}</p>
      <hr>
      <p><strong>Lieu de prise en charge :</strong> ${esc(lieu) || 'Non précisé'}</p>
      <p><strong>Période :</strong> ${esc(dateDebut) || '—'} au ${esc(dateFin) || '—'}</p>
      <p><strong>Message :</strong></p>
      <p>${esc(message).replace(/\n/g, '<br>') || 'Aucun message (voir pièce jointe éventuelle).'}</p>
    `;

    const payload = {
      from: 'Black V Prestige <onboarding@resend.dev>',
      to: [DEST_EMAIL],
      reply_to: email,
      subject: `Nouvel apporteur d'affaires — ${prenom} ${nom}`,
      html
    };

    if (csvContent && csvName) {
      payload.attachments = [{ filename: csvName, content: csvContent }];
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error('Resend error:', errBody);
      res.status(502).json({ error: 'Échec de l\'envoi de l\'email.' });
      return;
    }

    res.status(200).json({ ok: true });

  } catch (err) {
    console.error('send-partner error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
