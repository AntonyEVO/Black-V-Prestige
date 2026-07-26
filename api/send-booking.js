// ================================================================
//  BLACK V PRESTIGE — FONCTION SERVERLESS VERCEL
//  NOTIFICATION DE RÉSERVATION PAYÉE
// ================================================================
//  Appelée après un paiement Stripe réussi (reservation.html).
//  Envoie deux emails via Resend :
//    1. Notification interne à blackvprestige@gmail.com (détails course)
//    2. Confirmation au client
//  Variable d'environnement requise (déjà configurée) : RESEND_API_KEY.
// ================================================================

const DEST_EMAIL = 'blackvprestige@gmail.com';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:8080',
  'https://antonyevo.github.io',
  'https://www.blackvprestige.com',
  'https://blackvprestige.com'
];

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function fmtEur(n) {
  return typeof n === 'number' ? n.toFixed(2).replace('.', ',') + ' €' : 'Non précisé';
}

async function sendEmail(payload) {
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
    throw new Error(errBody);
  }
}

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  const originAllowed = ALLOWED_ORIGINS.includes(origin);
  if (originAllowed) {
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

  // Défense en profondeur contre les appels directs hors navigateur (spam automatisé).
  if (!originAllowed) {
    res.status(403).json({ error: 'Origine non autorisée.' });
    return;
  }

  try {
    const {
      from, to, date, time, service, pax, bags,
      price, nom, prenom, tel, email, paymentIntentId
    } = req.body || {};

    if (!nom || !prenom || !email) {
      res.status(400).json({ error: 'Champs obligatoires manquants.' });
      return;
    }

    const detailsHtml = `
      <p><strong>Trajet :</strong> ${esc(from) || 'Non précisé'} → ${esc(to) || 'Non précisé'}</p>
      <p><strong>Date :</strong> ${esc(date) || '—'} à ${esc(time) || '—'}</p>
      <p><strong>Service :</strong> ${esc(service) || 'Non précisé'}</p>
      <p><strong>Passagers / bagages :</strong> ${esc(pax) || '1'} / ${esc(bags) || '0'}</p>
      <p><strong>Prix payé :</strong> ${fmtEur(price)}</p>
    `;

    const internalHtml = `
      <h2>Nouvelle réservation payée — Black V Prestige</h2>
      <p><strong>Client :</strong> ${esc(prenom)} ${esc(nom)}</p>
      <p><strong>Email :</strong> ${esc(email)}</p>
      <p><strong>Téléphone :</strong> ${esc(tel) || 'Non renseigné'}</p>
      <hr>
      ${detailsHtml}
      <hr>
      <p style="color:#888; font-size:13px;">Référence Stripe : ${esc(paymentIntentId) || 'Non précisée'}</p>
    `;

    const clientHtml = `
      <h2>Votre réservation est confirmée</h2>
      <p>Bonjour ${esc(prenom)},</p>
      <p>Nous avons bien reçu votre paiement. Voici le récapitulatif de votre course :</p>
      ${detailsHtml}
      <p>Votre chauffeur sera à l'heure. Pour toute question, contactez-nous au +33 6 85 86 68 90 ou à blackvprestige@gmail.com.</p>
      <p>Merci de votre confiance,<br>L'équipe Black V Prestige</p>
    `;

    const results = await Promise.allSettled([
      sendEmail({
        from: 'Black V Prestige <onboarding@resend.dev>',
        to: [DEST_EMAIL],
        reply_to: email,
        subject: `Nouvelle réservation payée — ${prenom} ${nom}`,
        html: internalHtml
      }),
      sendEmail({
        from: 'Black V Prestige <onboarding@resend.dev>',
        to: [email],
        reply_to: DEST_EMAIL,
        subject: 'Votre réservation Black V Prestige est confirmée',
        html: clientHtml
      })
    ]);

    const [internalResult, clientResult] = results;
    if (internalResult.status === 'rejected') {
      console.error('Échec notification interne:', internalResult.reason);
    }
    if (clientResult.status === 'rejected') {
      console.error('Échec confirmation client:', clientResult.reason);
    }

    if (internalResult.status === 'rejected' && clientResult.status === 'rejected') {
      res.status(502).json({ error: 'Échec de l\'envoi des emails.' });
      return;
    }

    res.status(200).json({
      ok: true,
      internalSent: internalResult.status === 'fulfilled',
      clientSent: clientResult.status === 'fulfilled'
    });

  } catch (err) {
    console.error('send-booking error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
