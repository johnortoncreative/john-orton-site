// John Orton — site behaviour (no dependencies)
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Typed section headings ---------- */
  function typeHeadings() {
    var heads = document.querySelectorAll('[data-type]');
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        io.unobserve(el);
        var full = el.getAttribute('aria-label');
        var inReveal = el.closest('[data-reveal]');
        setTimeout(function () {
          var i = 0;
          var id = setInterval(function () {
            i++;
            el.firstChild.textContent = full.slice(0, i);
            if (i >= full.length) clearInterval(id);
          }, 60);
        }, inReveal ? 420 : 80);
      });
    }, { rootMargin: '0px 0px -18% 0px', threshold: 0.2 });

    heads.forEach(function (el) {
      var full = el.textContent.trim();
      el.setAttribute('aria-label', full); // real text stays available to screen readers
      el.style.minHeight = el.offsetHeight + 'px'; // reserve height, no layout shift
      el.innerHTML = '<span aria-hidden="true"></span>';
      io.observe(el);
    });
  }

  /* ---------- Scroll reveal ---------- */
  function reveals() {
    var els = document.querySelectorAll('[data-reveal]');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('revealed'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('revealed');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Custom cursor (fine pointers only) ---------- */
  function cursor() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var el = document.querySelector('.cursor');
    if (!el) return;
    document.documentElement.classList.add('has-cursor');
    var size = 56;
    var pos = { x: -100, y: -100 };
    var cur = { x: -100, y: -100 };
    document.addEventListener('mousemove', function (e) {
      pos.x = e.clientX; pos.y = e.clientY;
      el.style.opacity = '1';
      var hot = e.target.closest && e.target.closest('a, button, input, textarea, img, video, .ph');
      var s = hot ? 96 : size;
      el.style.width = s + 'px';
      el.style.height = s + 'px';
    });
    document.documentElement.addEventListener('mouseleave', function () { el.style.opacity = '0'; });
    var lerp = reduceMotion ? 1 : 0.2;
    (function loop() {
      var w = parseFloat(el.style.width) || size;
      cur.x += (pos.x - w / 2 - cur.x) * lerp;
      cur.y += (pos.y - w / 2 - cur.y) * lerp;
      el.style.transform = 'translate(' + cur.x + 'px,' + cur.y + 'px)';
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Click-to-play players (showreel + film cards) ---------- */
  function players() {
    var all = document.querySelectorAll('.player');
    all.forEach(function (player) {
      var video = player.querySelector('video');
      var btn = player.querySelector('.play-pill');
      if (!video || !btn) return;
      var label = btn.querySelector('.play-label');

      function unavailable() {
        player.classList.remove('is-playing');
        btn.disabled = true;
        label.textContent = 'Coming soon';
      }
      // A missing file fires the error on the <source> (or the video itself).
      var source = video.querySelector('source');
      (source || video).addEventListener('error', unavailable);

      btn.addEventListener('click', function () {
        video.controls = true;
        video.muted = false; // the visitor chose to play it, so sound on
        var p = video.play();
        if (p && p.catch) p.catch(function () { if (video.error) unavailable(); });
      });
      video.addEventListener('playing', function () {
        player.classList.add('is-playing');
        // Only one film plays at a time.
        all.forEach(function (other) {
          var v = other.querySelector('video');
          if (v && v !== video && !v.paused) v.pause();
        });
      });
    });
  }

  /* ---------- Hero background video ---------- */
  function heroVideo() {
    var v = document.querySelector('.hero-video');
    if (!v) return;
    // Reduced motion: stay on the poster frame.
    if (reduceMotion) { v.removeAttribute('autoplay'); v.pause(); return; }
    // Some browsers skip autoplay until nudged; muted video is allowed to start on its own.
    v.muted = true;
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }

  /* ---------- Film card clips: play only while on screen ---------- */
  function autoplayClips() {
    var vids = document.querySelectorAll('video[data-autoplay]');
    if (!vids.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) return; // poster stays
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.25 });
    vids.forEach(function (v) { v.muted = true; io.observe(v); });
  }

  /* ---------- Enquiry form (Netlify Forms) ---------- */
  function form() {
    var f = document.querySelector('.enquiry');
    if (!f) return;
    var err = f.querySelector('.form-error');
    var btn = f.querySelector('button[type=submit]');
    var sent = document.querySelector('.form-sent');

    function showError(msg) { err.textContent = msg; err.hidden = false; }

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      err.hidden = true;
      var firstBad = null;
      f.querySelectorAll('[required]').forEach(function (input) {
        var ok = input.checkValidity() && input.value.trim() !== '';
        input.closest('.field').classList.toggle('invalid', !ok);
        if (!ok && !firstBad) firstBad = input;
      });
      if (firstBad) {
        showError(firstBad.type === 'email' && firstBad.value
          ? 'That email address doesn’t look right.'
          : 'Please fill in your name, email and a line about the project.');
        firstBad.focus();
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Sending…';
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(f)).toString()
      }).then(function (res) {
        if (!res.ok) throw new Error(res.status);
        f.hidden = true;
        sent.hidden = false;
      }).catch(function () {
        showError('Something went wrong sending that. Please email johnortoncreative@gmail.com instead.');
      }).finally(function () {
        btn.disabled = false;
        btn.textContent = 'Send enquiry';
      });
    });

    f.addEventListener('input', function (e) {
      var field = e.target.closest('.field');
      if (field) field.classList.remove('invalid');
    });
  }

  typeHeadings();
  reveals();
  cursor();
  players();
  heroVideo();
  autoplayClips();
  form();
})();
