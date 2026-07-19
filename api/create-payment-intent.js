// ================================================================
//  BLACK V PRESTIGE — FONCTION SERVERLESS VERCEL (PAIEMENT STRIPE)
// ================================================================
//  Déploiement : Vercel (aucune configuration nécessaire, ce fichier
//  devient automatiquement l'endpoint /api/create-payment-intent).
//
//  Variable d'environnement à définir dans le tableau de bord Vercel
//  (jamais dans le code ni dans le dépôt) :
//    STRIPE_SECRET_KEY = sk_test_...  (ou sk_live_... en production)
// ================================================================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:8080',
  'https://antonyevo.github.io',
  'https://www.blackvprestige.fr',
  'https://blackvprestige.fr'
];

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
    const { amount, currency = 'eur', description, customer } = req.body || {};

    if (!amount || typeof amount !== 'number' || amount < 100) {
      res.status(400).json({ error: 'Montant invalide (minimum 1,00 €).' });
      return;
    }

    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      description:   description || 'Black V Prestige — Course privée',
      receipt_email: customer?.email || undefined,
      metadata: {
        nom:    customer?.nom    || '',
        prenom: customer?.prenom || '',
        tel:    customer?.tel    || ''
      }
    });

    res.status(200).json({ clientSecret: intent.client_secret });

  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(400).json({ error: err.message });
  }
};

