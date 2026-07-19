// ================================================================
//  BLACK V PRESTIGE — BACKEND DE PAIEMENT STRIPE
// ================================================================
//  Prérequis :
//    node stripe-server.js
//    npm install express stripe cors dotenv
//
//  Variables d'environnement (.env) :
//    STRIPE_SECRET_KEY=sk_test_...   (clé secrète Stripe)
//    PORT=3000                        (optionnel)
//
//  En production : remplacer sk_test_ par sk_live_
//  Déploiement possible sur : Render, Railway, Heroku, Vercel (api/)
// ================================================================

require('dotenv').config();

const express = require('express');
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors    = require('cors');

const app = express();

// ── CORS : autoriser le site Black V Prestige ──────────────────
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1:5500',    // Live Server VS Code
    'http://127.0.0.1:8080',
    'https://antonyevo.github.io',      // Hébergement temporaire GitHub Pages
    'https://www.blackvprestige.fr',    // Nom de domaine définitif (à venir)
    'https://blackvprestige.fr'
  ]
}));
app.use(express.json());

// ── Route principale : création d'un PaymentIntent ─────────────
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'eur', description, customer } = req.body;

    // Validation minimale
    if (!amount || typeof amount !== 'number' || amount < 100) {
      return res.status(400).json({ error: 'Montant invalide (minimum 1,00 €).' });
    }

    const intent = await stripe.paymentIntents.create({
      amount,                        // en centimes (ex : 8750 = 87,50 €)
      currency,
      description:    description || 'Black V Prestige — Course privée',
      receipt_email:  customer?.email || undefined,
      metadata: {
        nom:    customer?.nom    || '',
        prenom: customer?.prenom || '',
        tel:    customer?.tel    || ''
      }
    });

    res.json({ clientSecret: intent.client_secret });

  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// ── Health check ────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'bvp-stripe-server' }));

// ── Démarrage ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Black V Prestige — Stripe server actif sur http://localhost:${PORT}`);
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠  STRIPE_SECRET_KEY manquante — créer un fichier .env');
  }
});
