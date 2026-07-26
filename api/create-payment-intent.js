// ================================================================
//  BLACK V PRESTIGE — FONCTION SERVERLESS VERCEL (PAIEMENT STRIPE)
// ================================================================
//  Déploiement : Vercel (aucune configuration nécessaire, ce fichier
//  devient automatiquement l'endpoint /api/create-payment-intent).
//
//  Variable d'environnement à définir dans le tableau de bord Vercel
//  (jamais dans le code ni dans le dépôt) :
//    STRIPE_SECRET_KEY = sk_test_...  (ou sk_live_... en production)
//
//  SÉCURITÉ : le montant facturé n'est JAMAIS pris tel quel depuis le
//  client. Il est recalculé ici à partir des coordonnées de départ/
//  arrivée (même formule que assets/js/booking.js : distance réelle
//  via OSRM × 3,00 €/km, minimum 40 €). Un client qui enverrait un
//  montant différent, ou qui appellerait cette API directement (hors
//  navigateur, sans passer par le site), ne peut donc jamais obtenir
//  un prix inférieur au vrai tarif.
// ================================================================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:8080',
  'https://antonyevo.github.io',
  'https://www.blackvprestige.com',
  'https://blackvprestige.com'
];

const TARIF_KM       = 3.00;   // € par kilomètre — doit rester identique à assets/js/booking.js
const TARIF_MIN      = 40;     // € minimum de course
const DIST_MAX_KM     = 1500;  // distance max plausible (France + trajets longue distance exceptionnels)
const AMOUNT_MAX_CENT = 500000; // 5 000 € — garde-fou absolu, ne devrait jamais être atteint en usage normal

function isFiniteNumber(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

async function getRouteDistanceKm(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
  const r = await fetch(url);
  const data = await r.json();
  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error('Impossible de calculer l\'itinéraire entre ces deux adresses.');
  }
  return data.routes[0].distance / 1000;
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

  // Défense en profondeur : n'accepte que les requêtes déclarant une origine
  // autorisée. N'empêche pas un attaquant déterminé de forger cet en-tête,
  // mais bloque les scripts d'abus non ciblés. La vraie protection contre la
  // manipulation de prix est le recalcul serveur ci-dessous.
  if (!originAllowed) {
    res.status(403).json({ error: 'Origine non autorisée.' });
    return;
  }

  try {
    const { from, to, description, customer } = req.body || {};

    if (!from || !to
      || !isFiniteNumber(from.lat) || !isFiniteNumber(from.lon)
      || !isFiniteNumber(to.lat)   || !isFiniteNumber(to.lon)) {
      res.status(400).json({ error: 'Coordonnées de départ/arrivée manquantes ou invalides.' });
      return;
    }

    const distKm = await getRouteDistanceKm(from, to);

    if (distKm > DIST_MAX_KM) {
      res.status(400).json({ error: 'Trajet trop long pour une réservation en ligne. Contactez-nous directement.' });
      return;
    }

    const priceEur = Math.max(distKm * TARIF_KM, TARIF_MIN);
    const amount   = Math.min(Math.round(priceEur * 100), AMOUNT_MAX_CENT);

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur', // devise fixe, jamais prise depuis le client
      description:   description || 'Black V Prestige — Course privée',
      receipt_email: customer?.email || undefined,
      metadata: {
        nom:    customer?.nom    || '',
        prenom: customer?.prenom || '',
        tel:    customer?.tel    || '',
        distKm: distKm.toFixed(1)
      }
    });

    res.status(200).json({ clientSecret: intent.client_secret, amount });

  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(400).json({ error: err.message });
  }
};
