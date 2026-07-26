/* ================================================================
   BLACK V PRESTIGE — WIDGET DE RÉSERVATION RAPIDE (BANNIÈRE ACCUEIL)
   Autocomplete via la Base Adresse Nationale (gouv.fr) + Nominatim en
   complément, puis transmission des données à la page reservation.html
   qui calcule l'itinéraire et pré-remplit l'étape 1 du parcours complet.
   ================================================================ */

/* ── Diaporama de la bannière plein écran ─────────────────────── */
(function () {
  const imgs = document.querySelectorAll('.hero2__bg-img');
  if (imgs.length < 2) return;

  let i = 0;
  setInterval(() => {
    imgs[i].classList.remove('active');
    i = (i + 1) % imgs.length;
    imgs[i].classList.add('active');
  }, 6000);
})();

(function () {
  const form = document.getElementById('hero-submit');
  if (!form) return;

  const hero = {
    from:    null,   // { label, lat, lon }
    to:      null,
    service: 'transfert'
  };

  function debounce(fn, ms) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // BAN (api-adresse.data.gouv.fr) = API officielle du gouvernement français,
  // bien plus précise que Nominatim sur les numéros de rue. Nominatim reste
  // utilisé en complément pour les lieux hors BAN (aéroports, Monaco...).
  const BAN_MIN_SCORE = 0.55; // sous ce score, la BAN "invente" une correspondance peu fiable (ex: noms de lieux/aéroports)

  // Biais de proximité ("itinéraire intelligent" façon Uber) : quand l'autre
  // champ (départ ou arrivée) a déjà une adresse résolue, on fait remonter en
  // priorité les résultats proches de ce point plutôt que des adresses
  // homonymes n'importe où en France/dans le monde.
  //
  // Le paramètre lat/lon de la BAN et le viewbox de Nominatim influencent bien
  // leur classement interne, mais trop faiblement pour des requêtes génériques
  // très fréquentes ("gare", "mairie"...) : testé en conditions réelles, une
  // recherche "gare" depuis Vieux-Condé (Nord) continuait de renvoyer des gares
  // de Saint-Nazaire ou d'Étaples avant celles du Nord. Le tri fiable se fait
  // donc côté client, par distance réelle (haversine), sur un pool de candidats
  // plus large — les deux APIs ne servent qu'à fournir ce pool.
  const BIAS_VIEWBOX_DELTA = 0.35; // ~35 km autour du point de biais

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async function searchBAN(q, bias) {
    try {
      const limit = bias ? 15 : 5;
      let url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=${limit}`;
      if (bias) url += `&lat=${bias.lat}&lon=${bias.lon}`;
      const r = await fetch(url);
      const data = await r.json();
      return (data.features || [])
        .filter(f => (f.properties.score || 0) >= BAN_MIN_SCORE)
        .map(f => ({
          name: f.properties.name || f.properties.label,
          city: [f.properties.postcode, f.properties.city].filter(Boolean).join(' '),
          lat:  f.geometry.coordinates[1],
          lon:  f.geometry.coordinates[0]
        }));
    } catch { return []; }
  }

  async function searchNominatim(q, bias) {
    try {
      const limit = bias ? 10 : 4;
      let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=${limit}&accept-language=fr`;
      if (bias) {
        const d = BIAS_VIEWBOX_DELTA;
        url += `&viewbox=${bias.lon - d},${bias.lat + d},${bias.lon + d},${bias.lat - d}`;
      }
      const r = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
      const raw = await r.json();
      return raw.map(p => {
        const parts = p.display_name.split(', ');
        return {
          name: parts.slice(0, 2).join(', '),
          city: parts.slice(2, 4).join(', '),
          lat:  parseFloat(p.lat),
          lon:  parseFloat(p.lon)
        };
      });
    } catch { return []; }
  }

  async function searchAddresses(q, bias) {
    if (q.length < 3) return [];
    const [ban, nom] = await Promise.all([searchBAN(q, bias), searchNominatim(q, bias)]);
    const merged = [...ban];
    nom.forEach(np => {
      const dup = merged.some(bp => bp.name.toLowerCase() === np.name.toLowerCase());
      if (!dup) merged.push(np);
    });
    if (bias) {
      merged.forEach(p => { p.dist = haversineKm(bias.lat, bias.lon, p.lat, p.lon); });
      merged.sort((a, b) => a.dist - b.dist);
    }
    return merged.slice(0, 6);
  }

  function setupAC(inputId, listId, stateKey, biasKey) {
    const inp  = document.getElementById(inputId);
    const list = document.getElementById(listId);
    if (!inp || !list) return;
    let places = [], focused = -1;

    const search = debounce(async (v) => {
      const bias = biasKey && hero[biasKey] ? { lat: hero[biasKey].lat, lon: hero[biasKey].lon } : null;
      places  = await searchAddresses(v, bias);
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
      hero[stateKey] = { label: inp.value, lat: p.lat, lon: p.lon };
      list.classList.remove('open');
      hideHint();
    }

    inp.addEventListener('input', e => {
      hero[stateKey] = null;
      search(e.target.value);
    });

    inp.addEventListener('keydown', e => {
      const opts = list.querySelectorAll('.autocomplete-opt');
      if (!opts.length) return;
      if      (e.key === 'ArrowDown')             { focused = Math.min(focused + 1, opts.length - 1); hl(opts); e.preventDefault(); }
      else if (e.key === 'ArrowUp')               { focused = Math.max(focused - 1, 0);               hl(opts); e.preventDefault(); }
      else if (e.key === 'Enter' && focused >= 0) { pick(focused); e.preventDefault(); }
      else if (e.key === 'Escape')                { list.classList.remove('open'); }
    });

    list.addEventListener('click', e => {
      const opt = e.target.closest('.autocomplete-opt');
      if (opt) pick(+opt.dataset.i);
    });

    document.addEventListener('click', e => {
      if (!inp.contains(e.target) && !list.contains(e.target)) list.classList.remove('open');
    });

    function hl(opts) {
      opts.forEach((el, i) => el.classList.toggle('on', i === focused));
      opts[focused]?.scrollIntoView({ block: 'nearest' });
    }
  }

  /* ── Onglets type de prestation ─────────────────────────────── */
  document.querySelectorAll('.hero2__tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.hero2__tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      hero.service = tab.dataset.service;
    });
  });

  /* ── Date minimum = aujourd'hui ─────────────────────────────── */
  const dateInput = document.getElementById('hero-date');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

  /* ── Indice d'erreur ─────────────────────────────────────────── */
  const hint = document.getElementById('hero-hint');
  function showHint() { hint && hint.classList.add('show'); }
  function hideHint()  { hint && hint.classList.remove('show'); }

  /* ── Envoi vers la page de réservation ──────────────────────── */
  form.addEventListener('click', () => {
    const date = dateInput ? dateInput.value : '';
    const time = document.getElementById('hero-heure')?.value || '';

    if (!hero.from || !hero.to || !date || !time) {
      showHint();
      return;
    }
    hideHint();

    const service = hero.service === 'transfert-aeroport' ? 'transfert' : hero.service;

    const params = new URLSearchParams({
      fromLabel: hero.from.label,
      fromLat:   hero.from.lat,
      fromLon:   hero.from.lon,
      toLabel:   hero.to.label,
      toLat:     hero.to.lat,
      toLon:     hero.to.lon,
      date,
      time,
      service
    });

    window.location.href = `reservation.html?${params.toString()}`;
  });

  setupAC('hero-depart',  'hero-list-depart',  'from', 'to');
  setupAC('hero-arrivee', 'hero-list-arrivee', 'to',   'from');
})();
