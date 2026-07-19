/* ================================================================
   BLACK V PRESTIGE — WIDGET DE RÉSERVATION RAPIDE (BANNIÈRE ACCUEIL)
   Autocomplete via Nominatim (OpenStreetMap), puis transmission des
   données à la page reservation.html qui calcule l'itinéraire et
   pré-remplit l'étape 1 du parcours de réservation complet.
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
    if (!inp || !list) return;
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

  setupAC('hero-depart',  'hero-list-depart',  'from');
  setupAC('hero-arrivee', 'hero-list-arrivee', 'to');
})();
