/* ═══════════════════════════════════════════════════════════
   ClearPath Advisory — motion
   GSAP + ScrollTrigger + Lenis, self-hosted in assets/vendor.
   Every animated element has a visible fallback state, so a
   failed script never leaves the page blank.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TOUCH = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var HAS_GSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  window.__cpLive = true;

  var products = $$('.pan');

  /* ── product palettes drive both the panel and its mockup ── */

  function paintPanels() {
    products.forEach(function (p) {
      p.style.setProperty('--pacc', p.dataset.accent);
      p.style.setProperty('--pink', p.dataset.ink);
      p.style.setProperty('--phue', p.dataset.hue);
      p.style.background = p.dataset.hue;
      p.style.color = p.dataset.ink;
    });
  }
  paintPanels();

  /* ── hero chips, one per product, in its own colour ──────── */

  function buildChips() {
    var wrap = $('#chips');
    if (!wrap) return [];
    var spots = [
      { l: '7%',  t: '20%', s: 54, r: -14 },
      { l: '86%', t: '17%', s: 42, r: 11 },
      { l: '92%', t: '62%', s: 62, r: -8 },
      { l: '4%',  t: '70%', s: 38, r: 16 },
      { l: '78%', t: '84%', s: 30, r: -20 }
    ];
    return products.map(function (p, n) {
      var s = spots[n % spots.length];
      var chip = document.createElement('i');
      chip.style.background = p.dataset.accent;
      chip.style.left = s.l;
      chip.style.top = s.t;
      chip.style.width = s.s + 'px';
      chip.style.height = s.s + 'px';
      chip.style.rotate = s.r + 'deg';
      wrap.appendChild(chip);
      return chip;
    });
  }

  /* ── fallback path ───────────────────────────────────────── */

  function revealAll() {
    document.body.classList.remove('is-loading');
    $$('[data-fade]').forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
    $$('.i').forEach(function (el) { el.style.transform = 'none'; });
    $$('.start__big .ch').forEach(function (el) { el.style.transform = 'none'; el.style.opacity = 1; });
    var pre = $('#pre');
    if (pre) pre.remove();
  }

  if (!HAS_GSAP || REDUCED) {
    buildChips();
    revealAll();
    wireForm(); wireDrawer(); wireYear();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  var chips = buildChips();

  /* ── smooth scroll ───────────────────────────────────────── */

  var lenis = null;
  if (typeof window.Lenis !== 'undefined' && !TOUCH) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var el = $(id);
      if (!el) return;
      e.preventDefault();
      closeDrawer();
      if (lenis) lenis.scrollTo(el, { offset: -10 });
      else el.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ── cursor ──────────────────────────────────────────────── */

  var cur = $('#cur'), curDot = $('#curDot'), curLabel = $('#curLabel');

  if (!TOUCH && cur) {
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    gsap.set([cur, curDot], { autoAlpha: 0 });

    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      gsap.to([cur, curDot], { autoAlpha: 1, duration: .3, overwrite: 'auto' });
      gsap.set(curDot, { x: mx, y: my });
    });

    gsap.ticker.add(function () {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      gsap.set(cur, { x: rx, y: ry });
    });

    // text fields are deliberately excluded: an 88px disc over an input
    // covers the words being typed, however transparent it is
    $$('a, button, .magnet, .svc__row, .picks label').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cur.classList.add('is-big');
        curLabel.textContent = el.dataset.cursor || '';
      });
      el.addEventListener('mouseleave', function () {
        cur.classList.remove('is-big');
        curLabel.textContent = '';
      });
    });

    // and hide it outright while a field is focused
    $$('input, textarea, select').forEach(function (el) {
      el.addEventListener('focus', function () {
        cur.classList.remove('is-big');
        curLabel.textContent = '';
        cur.classList.add('is-away');
        curDot.classList.add('is-away');
      });
      el.addEventListener('blur', function () {
        cur.classList.remove('is-away');
        curDot.classList.remove('is-away');
      });
    });

    ['.horiz', '.start', '.foot', '.mq--inv'].forEach(function (sel) {
      var el = $(sel);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el, start: 'top 50%', end: 'bottom 50%',
        onToggle: function (self) {
          cur.classList.toggle('is-inv', self.isActive);
          curDot.classList.toggle('is-inv', self.isActive);
        }
      });
    });
  }

  /* ── magnetic pull + breathing buttons ───────────────────────
     The fill drop-out is CSS. The scale lives here so it shares
     one transform with the magnetic offset instead of fighting
     a CSS keyframe for control of the same property.           */

  if (!TOUCH) {
    $$('.magnet').forEach(function (el) {
      var isBtn = el.classList.contains('btn');
      var strength = isBtn ? 0.3 : 0.22;
      var breath = null;

      el.addEventListener('mouseenter', function () {
        if (!isBtn) return;
        gsap.killTweensOf(el, 'scale');
        breath = gsap.fromTo(el,
          { scale: 1.04 },
          { scale: 1.11, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      });

      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - (r.left + r.width / 2)) * strength,
          y: (e.clientY - (r.top + r.height / 2)) * strength,
          duration: .5, ease: 'power3.out'
        });
      });

      el.addEventListener('mouseleave', function () {
        if (breath) { breath.kill(); breath = null; }
        gsap.to(el, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1, .4)' });
        if (isBtn) gsap.to(el, { scale: 1, duration: .45, ease: 'power3.out' });
      });
    });
  }

  /* ── initial states, owned by GSAP ───────────────────────────
     A CSS percentage transform is not readable from computed
     style, so both axes are set explicitly here.               */

  gsap.set('.l .i', { y: 0, yPercent: 105 });
  gsap.set('[data-fade]', { autoAlpha: 0, y: 24 });

  /* ── preloader ───────────────────────────────────────────── */

  var pre = $('#pre'), preCols = $('#preCols'), preNum = $('#preNum'), preWord = $('#preWord');
  var names = products.map(function (p) { return p.dataset.name; });

  products.forEach(function (p) {
    var col = document.createElement('i');
    col.style.background = p.dataset.hue;
    preCols.appendChild(col);
  });

  var counter = { v: 0 }, wordIdx = 0;
  var intro = gsap.timeline({ onComplete: function () { ScrollTrigger.refresh(); } });

  intro
    .to(counter, {
      v: 100, duration: 1.6, ease: 'power2.inOut',
      onUpdate: function () {
        preNum.textContent = Math.round(counter.v);
        var next = Math.min(names.length - 1, Math.floor(counter.v / (100 / names.length)));
        if (next !== wordIdx) { wordIdx = next; preWord.textContent = names[next]; }
      }
    })
    .to('.pre__ui', { autoAlpha: 0, duration: .35, ease: 'power2.in' }, '-=0.1')
    .to(preCols.children, { yPercent: -100, duration: 1, ease: 'expo.inOut', stagger: .06 }, '-=0.15')
    .to(pre, { autoAlpha: 0, duration: .01, onComplete: function () { pre.remove(); } })
    .add(function () {
      document.body.classList.remove('is-loading');
      if (lenis) lenis.start();
    }, '-=0.85')
    .to('.hero .eyebrow', { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out' }, '-=0.7')
    .to('.hero__h1 .i', { yPercent: 0, y: 0, duration: 1.15, ease: 'expo.out', stagger: .085 }, '-=0.6')
    .to(['.hero__lede', '.hero__cta', '.hero__scroll'], { autoAlpha: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .07 }, '-=0.75');

  if (chips.length) {
    intro.from(chips, { scale: 0, autoAlpha: 0, duration: 1, ease: 'back.out(1.7)', stagger: .07 }, '-=1.0');
  }
  if (lenis) lenis.stop();

  /* ── hero chips drift and parallax ───────────────────────── */

  chips.forEach(function (chip, n) {
    gsap.to(chip, {
      y: '+=' + (18 + n * 6), x: '+=' + (n % 2 ? 12 : -12),
      duration: 4 + n * 0.7, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: n * .3
    });
    gsap.to(chip, {
      yPercent: -60 - n * 25, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  });

  /* ── generic reveals ─────────────────────────────────────── */

  $$('.l .i').forEach(function (el) {
    if (el.closest('.hero')) return;
    gsap.to(el, {
      yPercent: 0, y: 0, duration: 1.05, ease: 'expo.out',
      scrollTrigger: { trigger: el.closest('.l'), start: 'top 88%' }
    });
  });

  $$('[data-fade]').forEach(function (el) {
    if (el.closest('.hero')) return;
    gsap.to(el, {
      autoAlpha: 1, y: 0, duration: .95, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 92%' }
    });
  });

  /* ── hero parallax out ───────────────────────────────────── */

  gsap.to('.hero__h1', {
    yPercent: -12, autoAlpha: .25, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero__grid', {
    yPercent: 16, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero__orb', {
    rotate: 40, scale: 1.15, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  /* ── marquees ────────────────────────────────────────────── */

  $$('.mq').forEach(function (mq, i) {
    var track = $('.mq__track', mq);
    var dir = i % 2 === 0 ? -1 : 1;
    var half = track.scrollWidth / 2;
    var pos = dir < 0 ? 0 : -half;
    var speed = 0.6, boost = 0;

    gsap.ticker.add(function () {
      pos += (speed + boost) * dir;
      if (dir < 0 && pos <= -half) pos += half;
      if (dir > 0 && pos >= 0) pos -= half;
      gsap.set(track, { x: pos });
      boost *= 0.94;
    });

    ScrollTrigger.create({
      trigger: mq, start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) {
        boost = Math.min(Math.abs(self.getVelocity() / 260), 14);
        gsap.to(mq, { skewX: gsap.utils.clamp(-7, 7, self.getVelocity() / -420), duration: .5, ease: 'power2.out', overwrite: true });
      }
    });
  });

  /* ── count-up stats ──────────────────────────────────────── */

  $$('[data-count]').forEach(function (el) {
    var end = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || '';
    var o = { v: 0 };
    gsap.to(o, {
      v: end, duration: 1.6, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
      onUpdate: function () { el.textContent = Math.round(o.v) + suffix; }
    });
  });

  /* ── THE SHELF ───────────────────────────────────────────── */

  var horiz = $('.horiz'), track = $('#hTrack'), hBar = $('#hBar'), hCount = $('#hCount'), nav = $('#nav');
  var mm = gsap.matchMedia();

  mm.add('(min-width: 901px)', function () {
    var dist = function () { return track.scrollWidth - window.innerWidth; };

    // Read the active product from where the panels actually sit.
    // This runs on the tween's own frame callback, not the ScrollTrigger's:
    // with scrub the tween keeps easing after the last scroll event, so a
    // reading taken in onUpdate of the trigger is always a beat stale.
    function syncShelf() {
      var travelled = -(gsap.getProperty(track, 'x') || 0);
      var total = dist() || 1;
      hBar.style.width = gsap.utils.clamp(0, 100, (travelled / total) * 100) + '%';

      var mid = window.innerWidth / 2;
      var idx = 0, bestD = Infinity;
      products.forEach(function (p, n) {
        var r = p.getBoundingClientRect();
        var d = Math.abs(r.left + r.width / 2 - mid);
        if (d < bestD) { bestD = d; idx = n; }
      });

      hCount.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(products.length).padStart(2, '0');
      if (horiz.dataset.active === String(idx)) return;
      horiz.dataset.active = idx;
      gsap.to(horiz, { backgroundColor: products[idx].dataset.hue, duration: .7, ease: 'power2.out' });
      document.documentElement.style.setProperty('--live', products[idx].dataset.accent);
    }

    var scroll = gsap.to(track, {
      x: function () { return -dist(); },
      ease: 'none',
      onUpdate: syncShelf,
      scrollTrigger: {
        trigger: horiz, pin: true, scrub: 0.8, start: 'top top',
        end: function () { return '+=' + dist(); },
        invalidateOnRefresh: true, anticipatePin: 1
      }
    });

    products.forEach(function (p) {
      gsap.fromTo($('.pan__body', p), { x: 80, autoAlpha: 0 }, {
        x: 0, autoAlpha: 1, ease: 'power2.out',
        scrollTrigger: { trigger: p, containerAnimation: scroll, start: 'left 88%', end: 'left 45%', scrub: true }
      });
      gsap.fromTo($('.pan__idx', p), { x: 120 }, {
        x: -50, ease: 'none',
        scrollTrigger: { trigger: p, containerAnimation: scroll, start: 'left right', end: 'right left', scrub: true }
      });
      var dev = $('.dev', p);
      if (dev) {
        // parallax drift across the whole crossing
        gsap.fromTo(dev, { x: 110, rotateZ: 3 }, {
          x: -40, rotateZ: -2, ease: 'none',
          scrollTrigger: { trigger: p, containerAnimation: scroll, start: 'left right', end: 'right left', scrub: true }
        });
        // fade in early and stay solid, so the mockup is never
        // half transparent while its own panel is the active one
        gsap.fromTo(dev, { autoAlpha: 0, scale: .92 }, {
          autoAlpha: 1, scale: 1, duration: .8, ease: 'power2.out',
          scrollTrigger: { trigger: p, containerAnimation: scroll, start: 'left 95%' }
        });
      }
    });
  });

  mm.add('(max-width: 900px)', function () {
    products.forEach(function (p) {
      gsap.from([$('.pan__body', p), $('.dev', p)], {
        y: 40, autoAlpha: 0, duration: .9, ease: 'power3.out', stagger: .1,
        scrollTrigger: { trigger: p, start: 'top 80%' }
      });
    });
    ScrollTrigger.create({
      trigger: horiz, start: 'top 60%', end: 'bottom 40%',
      onUpdate: function () {
        var mid = window.innerHeight / 2, best = products[0], bestD = Infinity;
        products.forEach(function (p) {
          var r = p.getBoundingClientRect();
          var d = Math.abs(r.top + r.height / 2 - mid);
          if (d < bestD) { bestD = d; best = p; }
        });
        if (horiz.dataset.active !== best.dataset.name) {
          horiz.dataset.active = best.dataset.name;
          gsap.to(horiz, { backgroundColor: best.dataset.hue, duration: .6 });
          document.documentElement.style.setProperty('--live', best.dataset.accent);
        }
      }
    });
  });

  /* ── nav ─────────────────────────────────────────────────── */

  var lastY = 0;
  ScrollTrigger.create({
    start: 'top -60',
    onUpdate: function (self) {
      var y = self.scroll();
      nav.classList.toggle('is-stuck', y > 60);
      nav.classList.toggle('is-hidden', y > lastY && y > 400 && !$('#drawer').classList.contains('is-open'));
      lastY = y;
    }
  });

  ['.horiz', '.start'].forEach(function (sel) {
    var el = $(sel);
    if (!el) return;
    ScrollTrigger.create({
      trigger: el, start: 'top 64px', end: 'bottom 64px',
      onToggle: function (self) { nav.classList.toggle('is-inv', self.isActive); }
    });
  });

  /* ── services: sticky index ──────────────────────────────── */

  var svcBig = $('#svcBig'), svcCap = $('#svcCap'), svcMark = $('#svcMark');
  var svcRows = $$('.svc__row'), svcWrap = $('.svc');

  if (svcWrap && svcRows.length) {
    ScrollTrigger.create({
      trigger: svcWrap, start: 'top 60%', end: 'bottom 40%',
      onUpdate: function () {
        var line = window.innerHeight * 0.42;
        var best = svcRows[0], bestD = Infinity;
        svcRows.forEach(function (r) {
          var box = r.getBoundingClientRect();
          var d = Math.abs(box.top + box.height / 2 - line);
          if (d < bestD) { bestD = d; best = r; }
        });
        if (svcWrap.dataset.active === best.dataset.i) return;
        svcWrap.dataset.active = best.dataset.i;
        svcBig.textContent = best.dataset.i;
        svcCap.textContent = best.dataset.cap;
        var ico = $('.svc__ico svg', best);
        if (ico && svcMark) svcMark.innerHTML = ico.innerHTML;
        if (svcMark) svcMark.setAttribute('viewBox', '0 0 40 40');
        gsap.fromTo([svcBig, svcCap, svcMark], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .45, ease: 'power2.out', stagger: .04 });
      }
    });
  }

  /* ── doodles draw themselves in ──────────────────────────── */

  $$('.doodle').forEach(function (svg) {
    var paths = $$('.dd', svg);
    paths.forEach(function (path) {
      var len = 600;
      try { len = Math.ceil(path.getTotalLength()) || 600; } catch (e) {}
      path.style.setProperty('--len', len);
      gsap.fromTo(path, { strokeDashoffset: len }, {
        strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut',
        scrollTrigger: { trigger: svg, start: 'top 85%' },
        delay: paths.indexOf(path) * 0.16
      });
    });
    // mirrored doodles point back toward their heading
    if (svg.hasAttribute('data-flip')) gsap.set(svg, { scaleX: -1 });
    // a slow drift so they never look pasted on
    gsap.to(svg, { rotate: 2.5, y: -8, duration: 6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  });

  /* ── colour washes drift with scroll ─────────────────────── */

  $$('.wash').forEach(function (w, n) {
    gsap.to(w, {
      yPercent: n % 2 ? 22 : -22, xPercent: n % 2 ? -8 : 8, ease: 'none',
      scrollTrigger: { trigger: w.parentNode, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  gsap.to('.hero__orb2', {
    rotate: -35, scale: 1.2, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  /* ── process rail ────────────────────────────────────────── */

  var rail = $('#rail');
  if (rail) {
    gsap.to(rail, {
      height: '100%', ease: 'none',
      scrollTrigger: { trigger: '.steps', start: 'top 70%', end: 'bottom 80%', scrub: .6 }
    });
  }

  /* ── studio orbit ────────────────────────────────────────── */

  var orbit = $('.studio__orbit');
  if (orbit) {
    gsap.to($$('span', orbit), { rotate: 360, duration: 26, repeat: -1, ease: 'none', stagger: -4, transformOrigin: '50% 50%' });
    gsap.to($('i', orbit), { scale: 1.25, duration: 2.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  }

  /* ── footer headline ─────────────────────────────────────── */

  var big = $('.start__big [data-chars]');
  if (big) {
    var text = big.textContent;
    big.textContent = '';
    text.split('').forEach(function (c) {
      var s = document.createElement('span');
      s.className = 'ch' + (c === ' ' ? ' sp' : '');
      s.textContent = c === ' ' ? '' : c;
      big.appendChild(s);
    });
    gsap.set('.start__big .ch', { y: 0, yPercent: 105, autoAlpha: 0 });
    gsap.to('.start__big .ch', {
      yPercent: 0, y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', stagger: .035,
      scrollTrigger: { trigger: '.start', start: 'top 78%' }
    });
  }

  /* ── drawer, form, year ──────────────────────────────────── */

  function wireDrawer() {
    var burger = $('#burger'), drawer = $('#drawer');
    if (!burger || !drawer) return;
    burger.addEventListener('click', function () {
      var open = drawer.classList.toggle('is-open');
      burger.classList.toggle('is-on', open);
      burger.setAttribute('aria-expanded', open);
      document.body.classList.toggle('is-locked', open);
      if (lenis) open ? lenis.stop() : lenis.start();
    });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', closeDrawer); });
  }
  function closeDrawer() {
    var burger = $('#burger'), drawer = $('#drawer');
    if (!drawer || !drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    burger.classList.remove('is-on');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
    if (typeof lenis !== 'undefined' && lenis) lenis.start();
  }
  wireDrawer();

  function wireForm() {
    var form = $('#brief'), msg = $('#formMsg');
    if (!form || !msg) return;

    function say(text, ok) {
      msg.textContent = text;
      msg.className = 'form__msg' + (text ? (ok ? ' is-ok' : ' is-bad') : '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.action.indexOf('YOUR_FORM_ID') > -1) {
        say('The form is not connected yet. Add your Formspree ID in index.html, or email hello@clearpathadvisory.com.', false);
        return;
      }
      if (!form.checkValidity()) {
        say('Fill in your name, email and a short description.', false);
        form.reportValidity();
        return;
      }
      var button = form.querySelector('button[type=submit]');
      var original = button.innerHTML;
      button.disabled = true;
      button.textContent = 'Sending…';
      say('', true);
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error();
          form.reset();
          say('Sent. You will get a reply within one working day.', true);
        })
        .catch(function () {
          say('That did not send. Email hello@clearpathadvisory.com instead and we will pick it up.', false);
        })
        .finally(function () {
          button.disabled = false;
          button.innerHTML = original;
        });
    });
  }
  wireForm();

  function wireYear() {
    var yr = $('#yr');
    if (yr) yr.textContent = new Date().getFullYear();
  }
  wireYear();

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
