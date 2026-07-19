/* ================================================================
   BLACK V PRESTIGE — MOTEUR DE RÉSERVATION & PAIEMENT
   ================================================================
   APIs gratuites utilisées (aucune clé requise) :
     • Nominatim (OpenStreetMap) — géocodage / suggestions d'adresses
     • OSRM (Project-OSRM public) — calcul de l'itinéraire routier

   Paiement :
     • Stripe Elements (client) → stripe-server.js (backend Express)
     • STRIPE_PK = '' ou non défini → MODE DÉMO (simulation)
   ================================================================ */

// ── CONFIGURATION ──────────────────────────────────────────────────────────
const TARIF_KM       = 3.50;   // € par kilomètre
const TARIF_MIN      = 45;     // course minimum
const SURCHARGE_NUIT = 0.20;   // +20 % entre 21h et 6h
const SURCHARGE_AERO = 10;     // +10 € si aéroport détecté

// ↓↓↓ REMPLIR APRÈS CRÉATION DU COMPTE STRIPE ↓↓↓
// Clé publique Stripe (pk_test_... ou pk_live_...)
const STRIPE_PK = 'pk_test_51Ttse5D6PlGTZslBFZ2Vv7YMsS9hnjajwi3ohNNhfoKMUA3RECzzVhb2QUWZLBU3JvVIPA3UO3WEWoWU8LIzJO82008ThF7QTj';
// URL du backend local ou déployé (stripe-server.js)
// TODO : remplacer par l'URL Render une fois le backend déployé (étape suivante)
const BACKEND_URL = 'http://localhost:3000/create-payment-intent';
// ↑↑↑ ───────────────────────────────────────────────

// ── ÉTAT GLOBAL ────────────────────────────────────────────────────────────
const booking = {
  from:    null,   // { label, lat, lon }
  to:      null,   // { label, lat, lon }
  distKm:  null,
  durMin:  null,
  price:   null,
  date:    '',
  time:    '',
  pax:     1,
  bags:    0,
  service: 'transfert',
  nom: '', prenom: '', tel: '', email: '', message: ''
};

// ── UTILITAIRES ────────────────────────────────────────────────────────────
function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

function fmtEur(n) {
  return n.toFixed(2).replace('.', ',') + ' €';
}

function fmtDur(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), r = min % 60;
  return r ? `${h}h${String(r).padStart(2, '0')}` : `${h}h`;
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── AUTOCOMPLETE (Nominatim) ───────────────────────────────────────────────
async function nominatim(q) {
  if (q.length < 3) return [];
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&accept-language=fr`,
      { headers: { 'Accept-Language': 'fr' } }
    );
    return await r.json();
  } catch { return []; }
}

function parsePlace(p) {
  const parts = p.display_name.split(', ');
  return {
    name: parts.slice(0, 2).join(', '),
    city: parts.slice(2, 4).join(', '),
    lat:  parseFloat(p.lat),
    lon:  parseFloat(p.lon)
  };
}

function setupAC(inputId, listId, stateKey) {
  const inp  = document.getElementById(inputId);
  const list = document.getElementById(listId);
  let places = [], focused = -1;

  const search = debounce(async (v) => {
    const raw = await nominatim(v);
    places  = raw.map(parsePlace);
    focused = -1;
    renderList();
  }, 380);

  function renderList() {
    if (!places.length) { list.classList.remove('open'); return; }
    list.innerHTML = places.map((p, i) =>
      `<div class="autocomplete-opt" data-i="${i}">
        <div class="autocomplete-opt__name">${esc(p.name)}</div>
        ${p.city ? `<div class="autocomplete-opt__city">${esc(p.city)}</div>` : ''}
      </div>`
    ).join('');
    list.classList.add('open');
  }

  function pick(i) {
    const p = places[i];
    inp.value = p.name + (p.city ? ', ' + p.city : '');
    booking[stateKey] = { label: inp.value, lat: p.lat, lon: p.lon };
    list.classList.remove('open');
    maybeRoute();
    refreshBtn1();
  }

  inp.addEventListener('input', e => {
    booking[stateKey] = null;
    search(e.target.value);
    refreshBtn1();
  });

  inp.addEventListener('keydown', e => {
    const opts = list.querySelectorAll('.autocomplete-opt');
    if (!opts.length) return;
    if      (e.key === 'ArrowDown')                     { focused = Math.min(focused + 1, opts.length - 1); hl(opts); e.preventDefault(); }
    else if (e.key === 'ArrowUp')                       { focused = Math.max(focused - 1, 0);               hl(opts); e.preventDefault(); }
    else if (e.key === 'Enter' && focused >= 0)         { pick(focused); e.preventDefault(); }
    else if (e.key === 'Escape')                        { list.classList.remove('open'); }
  });

  list.addEventListener('click', e => {
    const opt = e.target.closest('.autocomplete-opt');
    if (opt) pick(+opt.dataset.i);
  });

  document.addEventListener('click', e => {
    if (!inp.contains(e.target) && !list.contains(e.target))
      list.classList.remove('open');
  });

  function hl(opts) {
    opts.forEach((el, i) => el.classList.toggle('on', i === focused));
    opts[focused]?.scrollIntoView({ block: 'nearest' });
  }
}

// ── CALCUL D'ITINÉRAIRE (OSRM) ────────────────────────────────────────────
async function maybeRoute() {
  if (!booking.from || !booking.to) return;
  showCalc('loading');

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${booking.from.lon},${booking.from.lat};${booking.to.lon},${booking.to.lat}?overview=false`;
    const data = await (await fetch(url)).json();
    if (data.code !== 'Ok' || !data.routes?.length) throw new Error('no route');
    booking.distKm = data.routes[0].distance / 1000;
    booking.durMin = Math.round(data.routes[0].duration / 60);
    renderCalc();
  } catch {
    showCalc('hidden');
    booking.price = null;
    refreshBtn1();
  }
}

// ── CALCUL DU PRIX ─────────────────────────────────────────────────────────
function calcPrice() {
  const h = booking.time ? parseInt(booking.time.split(':')[0]) : 12;
  const night   = h >= 21 || h < 6;
  const fromLow = (booking.from?.label || '').toLowerCase();
  const toLow   = (booking.to?.label   || '').toLowerCase();
  const AERO_WORDS = ['aéroport', 'aeroport', 'airport', 'côte d\'azur terminal'];
  const airport = AERO_WORDS.some(k => fromLow.includes(k) || toLow.includes(k));

  const base = Math.max(booking.distKm * TARIF_KM, TARIF_MIN);
  const nSur = night   ? base * SURCHARGE_NUIT : 0;
  const aSur = airport ? SURCHARGE_AERO        : 0;
  return { base, nSur, aSur, total: base + nSur + aSur, night, airport };
}

function renderCalc() {
  const p = calcPrice();
  booking.price = p.total;

  // Affichage dans le calculateur
  document.getElementById('pr-from').textContent   = booking.from.label;
  document.getElementById('pr-to').textContent     = booking.to.label;
  document.getElementById('pr-meta').textContent   = `${booking.distKm.toFixed(1)} km — ${fmtDur(booking.durMin)}`;
  document.getElementById('pr-km').textContent     = `${booking.distKm.toFixed(1)} km`;
  document.getElementById('pr-km-val').textContent = fmtEur(booking.distKm * TARIF_KM);

  const nightRow = document.getElementById('pr-night-row');
  nightRow.style.display = p.night ? 'flex' : 'none';
  document.getElementById('pr-night-val').textContent = '+' + fmtEur(p.nSur);

  const aeroRow = document.getElementById('pr-aero-row');
  aeroRow.style.display = p.airport ? 'flex' : 'none';

  document.getElementById('pr-total').textContent = fmtEur(p.total);
  showCalc('result');

  // Mise à jour de la sidebar
  const sc = document.getElementById('sc-price');
  sc.style.display = 'block';
  document.getElementById('sc-val').textContent  = fmtEur(p.total);
  document.getElementById('sc-meta').textContent = `${booking.distKm.toFixed(1)} km — ${fmtDur(booking.durMin)}`;

  refreshBtn1();
}

function showCalc(mode) {
  const box     = document.getElementById('price-calc');
  const loading = document.getElementById('pc-loading');
  const result  = document.getElementById('pc-result');
  if (mode === 'hidden') { box.classList.add('price-calculator--hidden'); return; }
  box.classList.remove('price-calculator--hidden');
  loading.style.display = mode === 'loading' ? 'flex' : 'none';
  result.style.display  = mode === 'result'  ? 'block' : 'none';
}

// Recalcul si l'heure change (impact supplément nuit)
document.getElementById('res-heure').addEventListener('change', e => {
  booking.time = e.target.value;
  if (booking.distKm !== null) renderCalc();
  refreshBtn1();
});
document.getElementById('res-date').addEventListener('change', e => {
  booking.date = e.target.value;
  refreshBtn1();
});

// ── NAVIGATION PAR ÉTAPES ──────────────────────────────────────────────────
function refreshBtn1() {
  const ok = booking.from && booking.to && booking.price !== null
    && document.getElementById('res-date').value
    && document.getElementById('res-heure').value;
  document.getElementById('btn1-next').disabled = !ok;
}

function goStep(n) {
  // Panneaux
  document.querySelectorAll('.booking-panel').forEach(el => el.classList.remove('active'));
  document.getElementById(`panel-${n}`).classList.add('active');

  // Indicateurs
  document.querySelectorAll('.booking-step').forEach((el, i) => {
    const s = i + 1;
    el.classList.toggle('active',    s === n);
    el.classList.toggle('completed', s < n);
    const numEl   = el.querySelector('.sn');
    const checkEl = el.querySelector('.sc');
    if (numEl)   numEl.style.display   = s < n ? 'none'   : '';
    if (checkEl) checkEl.style.display = s < n ? 'inline' : 'none';
  });

  // Scroll vers le début du formulaire
  const layout = document.querySelector('.booking-layout');
  if (layout) layout.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Initialiser Stripe au passage à l'étape 3
  if (n === 3 && !stripeReady) mountStripe();
}

// Étape 1 → 2
document.getElementById('btn1-next').addEventListener('click', () => {
  booking.date    = document.getElementById('res-date').value;
  booking.time    = document.getElementById('res-heure').value;
  booking.pax     = parseInt(document.getElementById('res-passagers').value)  || 1;
  booking.bags    = parseInt(document.getElementById('res-bagages').value)     || 0;
  booking.service = document.getElementById('res-service').value;
  goStep(2);
});

// Étape 2 → retour
document.getElementById('btn2-back').addEventListener('click', () => goStep(1));

// Étape 2 → 3 (avec validation)
document.getElementById('btn2-next').addEventListener('click', () => {
  const nom    = document.getElementById('res-nom').value.trim();
  const prenom = document.getElementById('res-prenom').value.trim();
  const tel    = document.getElementById('res-tel').value.trim();
  const email  = document.getElementById('res-email').value.trim();
  const rgpd   = document.getElementById('res-rgpd').checked;

  if (!nom || !prenom || !tel || !email) {
    alert('Veuillez remplir tous les champs obligatoires.'); return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('Veuillez entrer une adresse email valide.'); return;
  }
  if (!rgpd) {
    alert('Veuillez accepter la politique de confidentialité.'); return;
  }

  booking.nom     = nom;
  booking.prenom  = prenom;
  booking.tel     = tel;
  booking.email   = email;
  booking.message = document.getElementById('res-message').value;

  fillRecap();
  goStep(3);
});

// Étape 3 → retour
document.getElementById('btn3-back').addEventListener('click', () => goStep(2));

function fillRecap() {
  document.getElementById('rc-route').textContent = `${booking.from.label} → ${booking.to.label}`;

  const d = new Date(booking.date);
  const dateStr = d.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  document.getElementById('rc-date').textContent = `${dateStr} à ${booking.time}`;
  document.getElementById('rc-pax').textContent  = `${booking.pax} passager${booking.pax > 1 ? 's' : ''} — ${booking.prenom} ${booking.nom}`;
  document.getElementById('rc-total').textContent = fmtEur(booking.price);
  document.getElementById('btn-pay-lbl').textContent = `Payer ${fmtEur(booking.price)}`;
}

// ── STRIPE ELEMENTS ────────────────────────────────────────────────────────
let stripe, cardEl, stripeReady = false;

function mountStripe() {
  stripeReady = true;

  if (!STRIPE_PK || STRIPE_PK.startsWith('pk_') === false) {
    // Mode démo : injecter des champs HTML natifs interactifs
    const wrap = document.getElementById('stripe-wrap');
    if (wrap) { wrap.style.padding = '0'; wrap.style.border = 'none'; wrap.style.background = 'none'; wrap.style.minHeight = '0'; }

    const container = document.getElementById('stripe-card');
    if (!container) return;

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px;">
        <input type="text" id="demo-card-num" class="form-input"
               maxlength="19" inputmode="numeric" autocomplete="cc-number"
               placeholder="1234  5678  9012  3456"
               style="letter-spacing:0.1em;font-variant-numeric:tabular-nums;">
        <div style="display:flex;gap:10px;">
          <input type="text" id="demo-card-exp" class="form-input"
                 maxlength="7" autocomplete="cc-exp"
                 placeholder="MM / AA" style="flex:1;">
          <input type="text" id="demo-card-cvc" class="form-input"
                 maxlength="4" inputmode="numeric" autocomplete="cc-csc"
                 placeholder="CVC" style="flex:1;">
        </div>
      </div>`;

    // Format automatique numéro carte : groupes de 4 chiffres
    document.getElementById('demo-card-num').addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 16);
      e.target.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
    });

    // Format automatique expiration : MM / AA
    document.getElementById('demo-card-exp').addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (v.length >= 3) v = v.slice(0, 2) + ' / ' + v.slice(2);
      e.target.value = v;
    });

    return;
  }

  try {
    stripe = Stripe(STRIPE_PK);
    const elements = stripe.elements({
      fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap' }]
    });
    cardEl = elements.create('card', {
      style: {
        base: {
          fontFamily: '"Inter", sans-serif',
          fontSize: '15px',
          color: '#0C0C0C',
          '::placeholder': { color: '#AAAAAA' }
        },
        invalid: { color: '#c0392b' }
      }
    });
    cardEl.mount('#stripe-card');
    cardEl.on('focus',  () => document.getElementById('stripe-wrap').classList.add('focused'));
    cardEl.on('blur',   () => document.getElementById('stripe-wrap').classList.remove('focused'));
    cardEl.on('change', e => {
      const err = document.getElementById('pay-error');
      if (e.error) { err.textContent = e.error.message; err.classList.add('show'); }
      else err.classList.remove('show');
      document.getElementById('stripe-wrap').classList.toggle('invalid', !!e.error);
    });
  } catch (e) {
    console.warn('Stripe non initialisé:', e.message);
  }
}

// ── PAIEMENT ───────────────────────────────────────────────────────────────
document.getElementById('btn-pay').addEventListener('click', async () => {
  const btn   = document.getElementById('btn-pay');
  const errEl = document.getElementById('pay-error');
  errEl.classList.remove('show');
  btn.disabled = true;
  btn.innerHTML = '<span class="bvp-spinner"></span>&nbsp; Traitement en cours…';

  // ─── MODE DÉMO (sans Stripe ni backend) ───────────────────────────────
  const isDemo = !STRIPE_PK || !STRIPE_PK.startsWith('pk_') || !stripe || !cardEl;
  if (isDemo) {
    await new Promise(r => setTimeout(r, 2000));
    showSuccess(true);
    return;
  }

  // ─── MODE PRODUCTION ──────────────────────────────────────────────────
  try {
    // 1. Créer un PaymentIntent côté serveur
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount:      Math.round(booking.price * 100), // en centimes
        currency:    'eur',
        description: `Black V Prestige — ${booking.from.label} → ${booking.to.label}`,
        customer:    { nom: booking.nom, prenom: booking.prenom, email: booking.email, tel: booking.tel }
      })
    });
    const { clientSecret, error: backendErr } = await res.json();
    if (backendErr) throw new Error(backendErr);

    // 2. Confirmer le paiement côté Stripe
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardEl,
        billing_details: {
          name:  `${booking.prenom} ${booking.nom}`,
          email: booking.email,
          phone: booking.tel
        }
      }
    });

    if (error) throw new Error(error.message);
    if (paymentIntent.status === 'succeeded') {
      showSuccess(false);
    } else {
      throw new Error('Statut inattendu. Veuillez contacter Black V Prestige.');
    }
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.add('show');
    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="1.5" fill="none" style="margin-right:6px"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span id="btn-pay-lbl">Payer ${fmtEur(booking.price)}</span>`;
  }
});

function showSuccess(isDemo) {
  const msg = isDemo
    ? `[Mode démonstration] La simulation de réservation est confirmée. En production avec Stripe activé, un email de confirmation sera envoyé à ${booking.email}.`
    : `Votre réservation est confirmée et le paiement de ${fmtEur(booking.price)} a bien été reçu. Un email de confirmation a été envoyé à ${booking.email}. Votre chauffeur sera là à l'heure.`;

  document.getElementById('success-msg').textContent = msg;
  document.getElementById('sc-price').style.display = 'none';

  // Marquer toutes les étapes comme complétées
  document.querySelectorAll('.booking-step').forEach(el => {
    el.classList.add('completed');
    el.classList.remove('active');
    const numEl   = el.querySelector('.sn');
    const checkEl = el.querySelector('.sc');
    if (numEl)   numEl.style.display   = 'none';
    if (checkEl) checkEl.style.display = 'inline';
  });

  document.querySelectorAll('.booking-panel').forEach(el => el.classList.remove('active'));
  document.getElementById('panel-success').classList.add('active');
}

// ── INITIALISATION ─────────────────────────────────────────────────────────
setupAC('res-depart',  'list-depart',  'from');
setupAC('res-arrivee', 'list-arrivee', 'to');

// Date minimum = aujourd'hui
document.getElementById('res-date').min = new Date().toISOString().split('T')[0];

// ── PRÉ-REMPLISSAGE DEPUIS LE WIDGET DE LA BANNIÈRE D'ACCUEIL ──────────────
(function prefillFromHero() {
  const p = new URLSearchParams(window.location.search);
  const fromLat = parseFloat(p.get('fromLat')), fromLon = parseFloat(p.get('fromLon'));
  const toLat   = parseFloat(p.get('toLat')),   toLon   = parseFloat(p.get('toLon'));
  if (!p.get('fromLabel') || !p.get('toLabel') || Number.isNaN(fromLat) || Number.isNaN(fromLon) || Number.isNaN(toLat) || Number.isNaN(toLon)) return;

  booking.from = { label: p.get('fromLabel'), lat: fromLat, lon: fromLon };
  booking.to   = { label: p.get('toLabel'),   lat: toLat,   lon: toLon   };
  document.getElementById('res-depart').value  = booking.from.label;
  document.getElementById('res-arrivee').value = booking.to.label;

  const date = p.get('date'), time = p.get('time'), service = p.get('service');
  if (date) { document.getElementById('res-date').value  = date; booking.date = date; }
  if (time) { document.getElementById('res-heure').value = time; booking.time = time; }
  if (service) {
    const sel = document.getElementById('res-service');
    if ([...sel.options].some(o => o.value === service)) { sel.value = service; booking.service = service; }
  }

  maybeRoute();
})();
