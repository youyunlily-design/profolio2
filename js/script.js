/* ============================================================
   卢沁园 · AI Product Builder — 编辑风交互脚本
   功能：背景图像视差（30~50% 速度）/ 慢速渐入 / 图片遮罩揭示 /
        平滑滚动 / 计数动画 / 项目详情 Modal / 图片灯箱
   CDN 依赖仅 Lenis，加载失败自动降级为原生滚动。
   ============================================================ */

(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  document.documentElement.classList.add('anim');
  document.documentElement.classList.remove('no-js');

  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Lenis 平滑滚动（降级：原生滚动） ---------- */
  var lenis = null;
  if (!prefersReduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  function scrollToTarget(el) {
    if (lenis) { lenis.scrollTo(el, { offset: 0, duration: 1.4 }); }
    else { el.scrollIntoView({ behavior: 'smooth' }); }
  }

  /* ---------- 2. 全站背景图像视差 ----------
     每个 Section 的背景层以正文 30%~50% 的速度缓慢移动。
     p 为归一化进度（-1.5 ~ 1.5），位移 = p * vh * speed，
     配合 CSS height:125% 保证任何视口下背景不露底。 */
  var bgEls = $$('.section-bg');
  var vh = window.innerHeight;
  var ticking = false;

  function updateParallax() {
    ticking = false;
    var i, el, rect, p, speed;
    for (i = 0; i < bgEls.length; i++) {
      el = bgEls[i];
      rect = el.parentElement.getBoundingClientRect();
      if (rect.bottom < -vh || rect.top > vh * 2) continue;
      speed = parseFloat(el.dataset.parallax) || 0.35;
      p = (rect.top - vh) / (vh + rect.height);
      p = Math.max(-1.5, Math.min(1.5, p));
      el.style.transform = 'translate3d(0,' + (p * vh * speed).toFixed(1) + 'px,0)';
    }
  }

  window.addEventListener('resize', function () {
    vh = window.innerHeight;
    if (!ticking) { ticking = true; requestAnimationFrame(updateParallax); }
  }, { passive: true });

  window.addEventListener('scroll', function () {
    if (prefersReduced) return;
    if (!ticking) { ticking = true; requestAnimationFrame(updateParallax); }
  }, { passive: true });

  updateParallax();

  /* ---------- 3. 导航：滚动态 / 汉堡菜单 / 锚点 / 进度条 ---------- */
  var nav = $('#nav');
  var navLinks = $('#navLinks');
  var navToggle = $('#navToggle');
  var navProgress = $('#navProgress');

  function onScroll() {
    var y = window.scrollY || 0;
    nav.classList.toggle('scrolled', y > 10);
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    navProgress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  navToggle.addEventListener('click', function () {
    var open = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', open);
  });

  $$('a[data-scroll]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      if (href && href.charAt(0) === '#') {
        var target = $(href);
        if (target) { e.preventDefault(); scrollToTarget(target); }
      }
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
    });
  });

  /* ---------- 4. 慢速渐入 / 图片遮罩揭示（IntersectionObserver） ---------- */
  var revealEls = $$('.fe');
  var maskEls = $$('.mask');

  function showVisibleInViewport() {
    revealEls.forEach(function (el) {
      if (el.classList.contains('in')) return;
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
    });
    maskEls.forEach(function (el) {
      if (el.classList.contains('in')) return;
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
    });
  }

  if ('IntersectionObserver' in window && !prefersReduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    revealEls.forEach(function (el) { io.observe(el); });
    maskEls.forEach(function (el) { io.observe(el); });

    window.addEventListener('load', function () {
      setTimeout(showVisibleInViewport, 1200); // 兜底：避免个别浏览器 IO 异常导致内容隐藏
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
    maskEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 5. 数字计数动画 ---------- */
  function animateCount(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    var target = parseFloat(el.dataset.count) || 0;
    var suffix = el.dataset.suffix || '';
    var dur = 1500;
    var start = performance.now();
    function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var countIO = null;
  if ('IntersectionObserver' in window) {
    countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    $$('[data-count]').forEach(function (el) {
      if (!el.closest('.modal')) countIO.observe(el);
    });
  }

  /* ---------- 6. 全屏项目详情 Modal ---------- */
  function openModal(id) {
    var m = $('#modal-' + id);
    if (!m) return;
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lock');
    if (lenis) lenis.stop();
    $$('[data-count]', m).forEach(animateCount);
    m.querySelector('.modal-panel').scrollTop = 0;
  }

  function closeModal(m) {
    if (!m) return;
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
    if (!$('.modal.open')) {
      document.body.classList.remove('lock');
      if (lenis) lenis.start();
    }
  }

  /* 兜底：阻止 Lenis 在 document 级拦截 wheel，保证 Modal 内滚轮/触控板可直接滚动
     （配合 HTML 中的 data-lenis-prevent，双保险兼容 Mac / Windows） */
  $$('.modal-panel').forEach(function (panel) {
    panel.addEventListener('wheel', function (e) {
      e.stopPropagation();
    }, { passive: true });
  });

  $$('.js-project-open').forEach(function (btn) {
    btn.addEventListener('click', function () { openModal(btn.dataset.project); });
  });

  $$('.modal').forEach(function (m) {
    $$('[data-close]', m).forEach(function (el) {
      el.addEventListener('click', function () { closeModal(m); });
    });
    m.addEventListener('click', function (e) {
      if (e.target === m || e.target.classList.contains('modal-backdrop')) closeModal(m);
    });
  });

  /* ---------- 7. 图片灯箱（点击项目图全屏查看） ---------- */
  var lightbox = $('#lightbox');
  var lightboxImg = $('#lightboxImg');
  var lightboxCap = $('#lightboxCap');
  var lightboxClose = $('#lightboxClose');

  function openLightbox(src, caption) {
    if (!lightbox) return;
    lightboxImg.src = src;
    lightboxCap.innerHTML = caption || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
  }

  $$('.project-figure img, .g-fig img, .pb-img img, .about-figure img, .feat-media img, .gallery-item img, .ach-img img, .hero-figure img').forEach(function (img) {
    img.addEventListener('click', function () {
      var figure = img.closest('figure');
      var fig = figure ? figure.querySelector('figcaption') : null;
      openLightbox(img.currentSrc || img.src, fig ? fig.innerHTML : '');
    });
  });

  if (lightbox) {
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target.tagName === 'IMG') closeLightbox();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeModal($('.modal.open'));
      closeLightbox();
    }
  });

  /* ---------- 8. 页脚年份 ---------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
