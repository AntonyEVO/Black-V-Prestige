/* ============================================================
   BLACK V PRESTIGE — JAVASCRIPT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- NAVBAR SCROLL ---- */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 60);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---- ACTIVE NAV LINK ---- */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ---- MOBILE MENU ---- */
  const burger     = document.querySelector('.navbar__burger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileClose= document.querySelector('.mobile-menu__close');
  const mobileLinks= document.querySelectorAll('.mobile-menu__link');

  const openMenu = () => {
    burger && burger.classList.add('open');
    mobileMenu && mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    burger && burger.classList.remove('open');
    mobileMenu && mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  };

  burger     && burger.addEventListener('click', () => mobileMenu.classList.contains('open') ? closeMenu() : openMenu());
  mobileClose && mobileClose.addEventListener('click', closeMenu);
  mobileLinks.forEach(link => link.addEventListener('click', closeMenu));

  /* ---- SCROLL EXPANSION HERO ---- */
  (function () {
    const section = document.getElementById('scroll-hero');
    if (!section) return;

    let progress = 0;
    let expanded = false;
    let touchY0  = 0;
    let mobile   = window.innerWidth < 768;

    const media    = section.querySelector('.seh-media');
    const bg       = section.querySelector('.seh-bg');
    const mOvl     = section.querySelector('.seh-media-overlay');
    const titleL   = section.querySelector('.seh-title-left');
    const titleR   = section.querySelector('.seh-title-right');
    const labelTxt = section.querySelector('.seh-label-txt');
    const hintTxt  = section.querySelector('.seh-hint-txt');
    const afterEl  = section.querySelector('.seh-after');

    function render() {
      const p  = progress;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Media size
      const w = Math.min(320 + p * (mobile ? 650 : 1250), vw * 0.98);
      const h = Math.min(400 + p * (mobile ? 200 : 400),  vh * 0.92);
      media.style.width        = w + 'px';
      media.style.height       = h + 'px';
      media.style.borderRadius = Math.max(0, 14 * (1 - p)) + 'px';

      // Background fade
      bg.style.opacity = 1 - p;

      // Media overlay
      if (mOvl) mOvl.style.opacity = Math.max(0, 0.5 - p * 0.3);

      // Text spread (L/R)
      const tx = p * (mobile ? 160 : 145);
      titleL.style.transform   = 'translateX(-' + tx + 'vw)';
      titleR.style.transform   = 'translateX('  + tx + 'vw)';
      labelTxt.style.transform = 'translateX(-' + tx + 'vw)';
      hintTxt.style.transform  = 'translateX('  + tx + 'vw)';

      // After content
      if (afterEl) {
        const show = p >= 0.97;
        afterEl.classList.toggle('visible', show);
        afterEl.setAttribute('aria-hidden', show ? 'false' : 'true');
      }
    }

    function advance(delta) {
      progress = Math.max(0, Math.min(1, progress + delta));
      expanded = progress >= 1;
      render();
    }

    /* Wheel */
    function onWheel(e) {
      if (expanded) {
        if (e.deltaY < 0 && window.scrollY <= 5) {
          expanded = false;
          e.preventDefault();
        }
        return;
      }
      e.preventDefault();
      advance(e.deltaY * 0.0009);
    }

    /* Touch */
    function onTouchStart(e) { touchY0 = e.touches[0].clientY; }
    function onTouchMove(e) {
      if (!touchY0) return;
      const dy = touchY0 - e.touches[0].clientY;
      if (expanded) {
        if (dy < -20 && window.scrollY <= 5) {
          expanded = false;
          e.preventDefault();
          touchY0 = e.touches[0].clientY;
        }
        return;
      }
      e.preventDefault();
      advance(dy * (dy < 0 ? 0.008 : 0.005));
      touchY0 = e.touches[0].clientY;
    }
    function onTouchEnd() { touchY0 = 0; }

    /* Keyboard */
    function onKeyDown(e) {
      if (expanded) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); advance(0.25); }
      if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); advance(-0.25); }
    }

    /* Lock scroll while not expanded */
    function onScroll() { if (!expanded) window.scrollTo(0, 0); }

    window.addEventListener('wheel',      onWheel,      { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true  });
    window.addEventListener('touchmove',  onTouchMove,  { passive: false });
    window.addEventListener('touchend',   onTouchEnd);
    window.addEventListener('keydown',    onKeyDown);
    window.addEventListener('scroll',     onScroll,     { passive: true  });
    window.addEventListener('resize', () => { mobile = window.innerWidth < 768; render(); });

    render(); // initial state
  })();

  /* ---- SCROLL REVEAL (Intersection Observer) ---- */
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  if (revealEls.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => revealObserver.observe(el));
  }

  /* ---- COUNTER ANIMATION ---- */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => countObserver.observe(el));
  }

  function animateCount(el) {
    const target = parseFloat(el.getAttribute('data-count'));
    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const duration = 1800;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, target);
      const display = Number.isInteger(target) ? Math.round(current) : current.toFixed(1);
      el.textContent = prefix + display + suffix;
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
  }

  /* ---- TESTIMONIALS SLIDER ---- */
  const slider = document.querySelector('.testimonials-slider');
  if (slider) {
    const track  = slider.querySelector('.testimonials-track');
    const cards  = slider.querySelectorAll('.testimonial-card');
    const dotsEl = slider.querySelector('.slider-dots');
    const prevBtn= slider.querySelector('.slider-btn--prev');
    const nextBtn= slider.querySelector('.slider-btn--next');

    if (cards.length < 2) return;

    let current = 0;
    const total = Math.ceil(cards.length / 2);

    // Build dots
    if (dotsEl) {
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('div');
        dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(dot);
      }
    }

    const goTo = (index) => {
      current = Math.max(0, Math.min(index, total - 1));
      const cardWidth = cards[0].offsetWidth + 24;
      track.style.transform = `translateX(-${current * cardWidth * 2}px)`;
      if (dotsEl) {
        dotsEl.querySelectorAll('.slider-dot').forEach((d, i) => d.classList.toggle('active', i === current));
      }
    };

    prevBtn && prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn && nextBtn.addEventListener('click', () => goTo(current + 1));

    // Auto-slide
    let autoSlide = setInterval(() => goTo(current + 1 >= total ? 0 : current + 1), 5000);
    slider.addEventListener('mouseenter', () => clearInterval(autoSlide));
    slider.addEventListener('mouseleave', () => {
      autoSlide = setInterval(() => goTo(current + 1 >= total ? 0 : current + 1), 5000);
    });

    // Touch/swipe
    let startX = 0;
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
    });

    window.addEventListener('resize', () => goTo(current));
  }

  /* ---- VIDEO PLAYER ---- */
  const videoWrapper = document.querySelector('.video-wrapper');
  if (videoWrapper) {
    const playBtn  = videoWrapper.querySelector('.video-play-btn');
    const embedEl  = videoWrapper.querySelector('.video-embed');
    const overlayEl= videoWrapper.querySelector('.video-overlay');

    if (playBtn && embedEl) {
      playBtn.addEventListener('click', () => {
        embedEl.classList.add('active');
        overlayEl && (overlayEl.style.display = 'none');

        // If it has a video element, play it
        const vid = embedEl.querySelector('video');
        if (vid) { vid.play(); return; }

        // If it has an iframe (YouTube/Vimeo), it auto-plays via src
      });
    }
  }

  /* ---- BACK TO TOP ---- */
  const btt = document.querySelector('.back-to-top');
  if (btt) {
    window.addEventListener('scroll', () => {
      btt.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---- FORM VALIDATION (light) ---- */
  const forms = document.querySelectorAll('form.form-premium');
  forms.forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const required = form.querySelectorAll('[required]');
      let valid = true;
      required.forEach(input => {
        if (!input.value.trim()) {
          valid = false;
          input.style.borderColor = '#ff4444';
          setTimeout(() => { input.style.borderColor = ''; }, 2000);
        }
      });
      if (valid) {
        const btn = form.querySelector('button[type="submit"]');
        if (btn) {
          const original = btn.textContent;
          btn.textContent = 'Envoi en cours…';
          btn.disabled = true;
          setTimeout(() => {
            btn.textContent = 'Message envoyé ✓';
            setTimeout(() => { btn.textContent = original; btn.disabled = false; form.reset(); }, 3000);
          }, 1200);
        }
      }
    });
  });

  /* ---- SMOOTH ANCHOR SCROLL ---- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 88;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ---- SERVICES DROPDOWN ---- */
  const dropdownBtns = document.querySelectorAll('.navbar__dropdown-btn');
  if (dropdownBtns.length) {
    dropdownBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const menu = btn.nextElementSibling;
        const isOpen = menu && menu.classList.contains('open');
        document.querySelectorAll('.navbar__dropdown-menu').forEach(m => m.classList.remove('open'));
        dropdownBtns.forEach(b => b.setAttribute('aria-expanded', 'false'));
        if (!isOpen && menu) {
          menu.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
    document.addEventListener('click', () => {
      document.querySelectorAll('.navbar__dropdown-menu').forEach(m => m.classList.remove('open'));
      dropdownBtns.forEach(b => b.setAttribute('aria-expanded', 'false'));
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.navbar__dropdown-menu').forEach(m => m.classList.remove('open'));
        dropdownBtns.forEach(b => b.setAttribute('aria-expanded', 'false'));
      }
    });
    if (['services.html', 'experience.html'].includes(currentPage)) {
      dropdownBtns.forEach(b => b.classList.add('active'));
    }
  }

});
