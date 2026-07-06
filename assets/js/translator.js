/**
 * Black V Prestige — Système de traduction multi-langue v2
 * Méthode : cookie "googtrans" + rechargement (standard Google Translate)
 * Langues : FR · EN · AR · ES · DE · IT · PT · RU · ZH
 */
(function () {
  'use strict';

  /* ──────────────────────────────────────────
     CONFIGURATION
  ────────────────────────────────────────── */
  const LANGUAGES = [
    { code: 'fr',    native: 'Français',   flag: '🇫🇷', rtl: false },
    { code: 'en',    native: 'English',    flag: '🇬🇧', rtl: false },
    { code: 'ar',    native: 'العربية',    flag: '🇸🇦', rtl: true  },
    { code: 'es',    native: 'Español',    flag: '🇪🇸', rtl: false },
    { code: 'de',    native: 'Deutsch',    flag: '🇩🇪', rtl: false },
    { code: 'it',    native: 'Italiano',   flag: '🇮🇹', rtl: false },
    { code: 'pt',    native: 'Português',  flag: '🇵🇹', rtl: false },
    { code: 'ru',    native: 'Русский',    flag: '🇷🇺', rtl: false },
    { code: 'zh-CN', native: '中文',        flag: '🇨🇳', rtl: false },
  ];

  const SOURCE_LANG  = 'fr';
  const STORAGE_KEY  = 'bvp_language';

  /* ──────────────────────────────────────────
     COOKIE GOOGTRANS — cœur du système
     Google Translate lit ce cookie au chargement
     Format : /langue_source/langue_cible
  ────────────────────────────────────────── */
  function readCookieLang() {
    const m = document.cookie.match(/googtrans=\/\w[\w-]*\/([^;,\s]+)/);
    return m ? m[1] : null;
  }

  function writeCookieLang(code) {
    const val      = (code && code !== SOURCE_LANG) ? `/fr/${code}` : '/fr/fr';
    const hostname = window.location.hostname;
    const maxAge   = (code && code !== SOURCE_LANG) ? '; max-age=31536000' : '; max-age=0';
    const paths    = ['/', window.location.pathname];

    paths.forEach(path => {
      document.cookie = `googtrans=${val}; path=${path}${maxAge}`;
      if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        document.cookie = `googtrans=${val}; path=${path}; domain=${hostname}${maxAge}`;
        document.cookie = `googtrans=${val}; path=${path}; domain=.${hostname}${maxAge}`;
      }
    });
  }

  function clearCookieLang() {
    writeCookieLang(SOURCE_LANG);
  }

  /* ──────────────────────────────────────────
     DÉTECTION DE LA LANGUE ACTIVE
  ────────────────────────────────────────── */
  function detectBrowser() {
    const raw    = (navigator.language || navigator.userLanguage || 'fr').toLowerCase();
    const prefix = raw.slice(0, 2);
    const found  = LANGUAGES.find(l => l.code.toLowerCase() === raw)
                || LANGUAGES.find(l => l.code.slice(0, 2) === prefix);
    return found ? found.code : SOURCE_LANG;
  }

  function getActiveLang() {
    // 1. Cookie Google Translate (vérité de terrain après rechargement)
    const cookie = readCookieLang();
    if (cookie && cookie !== SOURCE_LANG) return cookie;
    // 2. Préférence sauvegardée
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    // 3. Langue navigateur
    return detectBrowser();
  }

  const activeLang = getActiveLang();

  /* ──────────────────────────────────────────
     INJECTION GOOGLE TRANSLATE (invisible)
  ────────────────────────────────────────── */
  function injectGoogleTranslate() {
    if (document.getElementById('google_translate_element')) return;

    const container = document.createElement('div');
    container.id = 'google_translate_element';
    container.setAttribute('aria-hidden', 'true');
    container.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;clip:rect(0,0,0,0);';
    document.body.insertBefore(container, document.body.firstChild);

    window.googleTranslateElementInit = function () {
      /* Le widget lit le cookie "googtrans" et traduit automatiquement */
      new google.translate.TranslateElement(
        {
          pageLanguage: SOURCE_LANG,
          includedLanguages: LANGUAGES.map(l => l.code).join(','),
          layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
          multilanguagePage: true,
        },
        'google_translate_element'
      );
    };

    const s = document.createElement('script');
    s.src   = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    document.head.appendChild(s);
  }

  /* ──────────────────────────────────────────
     SWITCH DE LANGUE
     → cookie + rechargement (méthode officielle Google)
  ────────────────────────────────────────── */
  function switchLang(code) {
    if (code === activeLang) { closeDropdown(); return; }

    localStorage.setItem(STORAGE_KEY, code);

    if (code === SOURCE_LANG) {
      clearCookieLang();
    } else {
      writeCookieLang(code);
    }

    /* Feedback visuel avant le rechargement */
    showLoadingFeedback(code);

    /* Rechargement après un court délai (le cookie doit être écrit) */
    setTimeout(() => window.location.reload(), 120);
  }

  function showLoadingFeedback(code) {
    const lang = LANGUAGES.find(l => l.code === code);
    const btn  = document.querySelector('.lang-btn');
    if (btn && lang) {
      btn.style.opacity = '0.5';
      btn.style.pointerEvents = 'none';
      const codeEl = document.getElementById('lang-current-code');
      if (codeEl) codeEl.textContent = '…';
    }
  }

  /* ──────────────────────────────────────────
     CONSTRUCTION DU SÉLECTEUR DESKTOP
  ────────────────────────────────────────── */
  function buildDesktopSelector() {
    const current = LANGUAGES.find(l => l.code === activeLang) || LANGUAGES[0];
    const el = document.createElement('div');
    el.className = 'lang-selector';
    el.setAttribute('role', 'navigation');
    el.setAttribute('aria-label', 'Sélecteur de langue');

    el.innerHTML = `
      <button class="lang-btn"
              aria-haspopup="listbox"
              aria-expanded="false"
              aria-label="Langue : ${current.native}">
        <span class="lang-btn__globe" aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.6"
               stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
          </svg>
        </span>
        <span class="lang-btn__flag" aria-hidden="true">${current.flag}</span>
        <span class="lang-btn__code" id="lang-current-code">
          ${current.code.slice(0,2).toUpperCase()}
        </span>
        <svg class="lang-btn__caret" width="9" height="9" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      <div class="lang-dropdown" role="listbox" aria-label="Choisir une langue">
        <div class="lang-dropdown__title">Choisir une langue</div>
        <div class="lang-dropdown__list">
          ${LANGUAGES.map(l => `
            <button class="lang-option${l.code === activeLang ? ' active' : ''}"
                    data-lang="${l.code}"
                    role="option"
                    aria-selected="${l.code === activeLang}"
                    aria-label="${l.native}">
              <span class="lang-option__flag" aria-hidden="true">${l.flag}</span>
              <span class="lang-option__name">${l.native}</span>
              <span class="lang-option__check${l.code === activeLang ? '' : ' hidden'}" aria-hidden="true">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2.5"
                     stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
            </button>
          `).join('')}
        </div>
        <div class="lang-dropdown__footer" aria-hidden="true">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a15.3 15.3 0 010 20M2 12h20"/>
          </svg>
          Traduit par Google
        </div>
      </div>
    `;
    return el;
  }

  /* ──────────────────────────────────────────
     SÉLECTEUR MOBILE (menu burger)
  ────────────────────────────────────────── */
  function buildMobileSelector() {
    const el = document.createElement('div');
    el.className = 'mobile-lang-block';
    el.setAttribute('aria-label', 'Sélecteur de langue');
    el.innerHTML = `
      <p class="mobile-lang-block__title">Langue / Language</p>
      <div class="mobile-lang-grid">
        ${LANGUAGES.map(l => `
          <button class="mobile-lang-opt${l.code === activeLang ? ' active' : ''}"
                  data-lang="${l.code}"
                  aria-label="${l.native}"
                  aria-pressed="${l.code === activeLang}">
            <span class="mobile-lang-opt__flag" aria-hidden="true">${l.flag}</span>
            <span class="mobile-lang-opt__code">${l.code.slice(0,2).toUpperCase()}</span>
          </button>
        `).join('')}
      </div>
    `;
    return el;
  }

  /* ──────────────────────────────────────────
     GESTION DU DROPDOWN
  ────────────────────────────────────────── */
  let _open = false;

  function openDropdown() {
    const dd  = document.querySelector('.lang-dropdown');
    const btn = document.querySelector('.lang-btn');
    if (!dd || !btn) return;
    dd.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    _open = true;
  }

  function closeDropdown() {
    const dd  = document.querySelector('.lang-dropdown');
    const btn = document.querySelector('.lang-btn');
    if (!dd) return;
    dd.classList.remove('open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    _open = false;
  }

  /* ──────────────────────────────────────────
     RTL POUR L'ARABE
  ────────────────────────────────────────── */
  function applyDirectionality() {
    const lang = LANGUAGES.find(l => l.code === activeLang);
    if (lang && lang.rtl) {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.removeAttribute('dir');
    }
    document.documentElement.lang = activeLang;
  }

  /* ──────────────────────────────────────────
     AUTO-TRADUCTION AU PREMIER CHARGEMENT
     Si le navigateur est dans une langue non-française
     et que c'est la première visite → traduction auto
  ────────────────────────────────────────── */
  function autoDetectFirstVisit() {
    const hasPreference = localStorage.getItem(STORAGE_KEY) || readCookieLang();
    if (!hasPreference) {
      const detected = detectBrowser();
      if (detected !== SOURCE_LANG) {
        writeCookieLang(detected);
        localStorage.setItem(STORAGE_KEY, detected);
        /* Pas de rechargement immédiat — le cookie sera lu par Google Translate
           au prochain chargement normal ou si l'utilisateur recharge */
      }
    }
  }

  /* ──────────────────────────────────────────
     INITIALISATION
  ────────────────────────────────────────── */
  function init() {
    injectGoogleTranslate();
    applyDirectionality();
    autoDetectFirstVisit();

    /* ── Desktop : insérer avant le bouton burger ── */
    const navInner = document.querySelector('.navbar__inner');
    if (navInner) {
      const desktop = buildDesktopSelector();
      const burger  = navInner.querySelector('.navbar__burger');
      const cta     = navInner.querySelector('.navbar__cta');
      const anchor  = burger || cta;
      if (anchor) navInner.insertBefore(desktop, anchor);
      else        navInner.appendChild(desktop);

      /* Toggle dropdown */
      const btn = desktop.querySelector('.lang-btn');
      if (btn) {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          _open ? closeDropdown() : openDropdown();
        });
      }

      /* Clic sur une option */
      desktop.querySelectorAll('.lang-option').forEach(opt => {
        opt.addEventListener('click', e => {
          e.stopPropagation();
          switchLang(opt.dataset.lang);
        });
      });
    }

    /* ── Mobile : ajouter en bas du menu burger ── */
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenu) {
      const mobile = buildMobileSelector();
      mobileMenu.appendChild(mobile);
      mobile.querySelectorAll('.mobile-lang-opt').forEach(opt => {
        opt.addEventListener('click', () => switchLang(opt.dataset.lang));
      });
    }

    /* ── Fermeture dropdown sur clic extérieur / Escape ── */
    document.addEventListener('click', () => { if (_open) closeDropdown(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDropdown(); });
  }

  /* ── Lancement ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
