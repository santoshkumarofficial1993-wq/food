/* =============================================================================
   Skillet & Stars — shared front-end behaviour
   Vanilla JS, no dependencies, no tracking beyond the consented ad layer.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;

  /* ---------------------------------------------------------------------
     Mobile navigation drawer
     --------------------------------------------------------------------- */
  var toggle = doc.querySelector('.nav-toggle');
  var links = doc.querySelector('.nav-links');

  if (toggle && links) {
    var setNav = function (open) {
      links.setAttribute('data-open', open ? 'true' : 'false');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    toggle.addEventListener('click', function () {
      setNav(links.getAttribute('data-open') !== 'true');
    });

    links.addEventListener('click', function (e) {
      if (e.target.closest('a') && window.matchMedia('(max-width: 960px)').matches) setNav(false);
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.getAttribute('data-open') === 'true') {
        setNav(false);
        toggle.focus();
      }
    });
  }

  /* ---------------------------------------------------------------------
     Remote photo fallback — a dead CDN link must never leave a blank hole
     --------------------------------------------------------------------- */
  var FALLBACK = 'https://placehold.co/1200x900/eef0f7/4b4f63?text=Skillet+%26+Stars';

  function guardImage(img) {
    if (img.getAttribute('data-guarded')) return;
    img.setAttribute('data-guarded', '1');
    img.addEventListener('error', function onError() {
      img.removeEventListener('error', onError);
      if (img.src !== FALLBACK) img.src = FALLBACK;
    });
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) img.src = FALLBACK;
  }
  Array.prototype.forEach.call(doc.images, guardImage);

  /* ---------------------------------------------------------------------
     Scroll reveal. Content is visible by default; the `js` class opts in,
     and a hard timeout guarantees nothing stays hidden if IO never fires.
     --------------------------------------------------------------------- */
  var revealables = doc.querySelectorAll('.reveal');

  function showAll() {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('shown'); });
  }

  if (revealables.length) {
    root.classList.add('js');

    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('shown');
          io.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -50px' });

      Array.prototype.forEach.call(revealables, function (el, i) {
        // Stagger only within a group of siblings, not across the whole page.
        var order = 0;
        var prev = el.previousElementSibling;
        while (prev && prev.classList.contains('reveal')) { order++; prev = prev.previousElementSibling; }
        el.style.transitionDelay = Math.min(order, 5) * 65 + 'ms';
        io.observe(el);
      });

      window.setTimeout(showAll, 2500);
    } else {
      showAll();
    }
  }

  /* ---------------------------------------------------------------------
     Recipe filtering + keyword search
     --------------------------------------------------------------------- */
  var chips = doc.querySelectorAll('[data-filter]');
  var items = doc.querySelectorAll('[data-cat]');
  var searchInput = doc.querySelector('[data-search]');
  var emptyState = doc.querySelector('[data-empty]');
  var counter = doc.querySelector('[data-count]');
  var activeFilter = 'all';

  function applyFilters() {
    var q = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var shown = 0;

    Array.prototype.forEach.call(items, function (item) {
      var cats = (item.getAttribute('data-cat') || '').split(/\s+/);
      var inCat = activeFilter === 'all' || cats.indexOf(activeFilter) !== -1;
      var inText = !q || item.textContent.toLowerCase().indexOf(q) !== -1;
      var show = inCat && inText;
      item.hidden = !show;
      if (show) shown++;
    });

    if (emptyState) emptyState.hidden = shown !== 0;
    if (counter) counter.textContent = String(shown);
  }

  if (chips.length && items.length) {
    Array.prototype.forEach.call(chips, function (chip) {
      chip.addEventListener('click', function () {
        activeFilter = chip.getAttribute('data-filter');
        Array.prototype.forEach.call(chips, function (c) { c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        applyFilters();
      });
    });
  }

  if (searchInput && items.length) {
    searchInput.addEventListener('input', applyFilters);
  }

  /* ---------------------------------------------------------------------
     Accordions
     --------------------------------------------------------------------- */
  Array.prototype.forEach.call(doc.querySelectorAll('.acc-q'), function (btn) {
    var panel = doc.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      panel.hidden = open;
    });
  });

  /* ---------------------------------------------------------------------
     Ingredient check-off (tap to strike through while cooking)
     --------------------------------------------------------------------- */
  Array.prototype.forEach.call(doc.querySelectorAll('.ing-list li'), function (li) {
    li.setAttribute('role', 'button');
    li.setAttribute('tabindex', '0');
    var flip = function () { li.classList.toggle('done'); };
    li.addEventListener('click', flip);
    li.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
    });
  });

  /* ---------------------------------------------------------------------
     Serving scaler
     --------------------------------------------------------------------- */
  var scaler = doc.querySelector('[data-scaler]');
  if (scaler) {
    var amounts = doc.querySelectorAll('[data-amount]');
    var base = parseFloat(scaler.getAttribute('data-base')) || 4;
    var servingLabels = doc.querySelectorAll('[data-servings-label]');

    var round = function (n) {
      if (n >= 10) return String(Math.round(n));
      return String(Math.round(n * 100) / 100);
    };

    scaler.addEventListener('change', function () {
      var target = parseFloat(scaler.value);
      var factor = target / base;
      Array.prototype.forEach.call(amounts, function (el) {
        el.textContent = round(parseFloat(el.getAttribute('data-amount')) * factor);
      });
      Array.prototype.forEach.call(servingLabels, function (el) { el.textContent = String(target); });
    });
  }

  /* ---------------------------------------------------------------------
     Demo forms — no data leaves the browser on this static build
     --------------------------------------------------------------------- */
  Array.prototype.forEach.call(doc.querySelectorAll('form[data-demo]'), function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = form.querySelector('[data-note]');
      if (note) {
        note.textContent = form.getAttribute('data-demo');
        note.style.color = 'oklch(0.42 0.09 156)';
      }
      form.reset();
    });
  });

  /* ---------------------------------------------------------------------
     Cookie / ad-personalisation consent.

     Google's EU user consent policy requires consent for personalised ads
     and for storing cookies. Until a choice is recorded we run in
     non-personalised mode and load nothing. `loadAds()` is the single place
     a real AdSense script tag would be injected.
     --------------------------------------------------------------------- */
  var STORE_KEY = 'sns-consent-v1';
  var banner = doc.querySelector('[data-consent]');

  function readConsent() {
    try { return window.localStorage.getItem(STORE_KEY); } catch (err) { return null; }
  }
  function writeConsent(value) {
    try { window.localStorage.setItem(STORE_KEY, value); } catch (err) { /* storage blocked */ }
  }

  function loadAds(personalised) {
    // Production: inject the AdSense loader here, e.g.
    //   var s = document.createElement('script');
    //   s.async = true;
    //   s.crossOrigin = 'anonymous';
    //   s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX';
    //   document.head.appendChild(s);
    //   if (!personalised) (window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1;
    root.setAttribute('data-ads', personalised ? 'personalised' : 'non-personalised');
  }

  if (banner) {
    var choice = readConsent();
    if (!choice) {
      banner.setAttribute('data-open', 'true');
    } else {
      loadAds(choice === 'accepted');
    }

    banner.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-consent-action]');
      if (!btn) return;
      var action = btn.getAttribute('data-consent-action');
      writeConsent(action);
      banner.setAttribute('data-open', 'false');
      loadAds(action === 'accepted');
    });
  }

  if (banner) {
    Array.prototype.forEach.call(doc.querySelectorAll('[data-consent-reopen]'), function (reopen) {
      reopen.addEventListener('click', function (e) {
        e.preventDefault();
        banner.setAttribute('data-open', 'true');
      });
    });
  }

  /* ---------------------------------------------------------------------
     Footer year
     --------------------------------------------------------------------- */
  Array.prototype.forEach.call(doc.querySelectorAll('[data-year]'), function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
