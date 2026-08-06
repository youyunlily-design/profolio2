/* ============================================================
   卢沁园 · AI Product Builder — 交互脚本
   功能：平滑滚动 / 粒子背景 / 鼠标光效 / 滚动动画 / 逐字 /
        视差散开 / 计数动画 / 项目详情 Modal / 图片灯箱
   所有 CDN 依赖均做了降级兜底，加载失败时页面仍完整可用。
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
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  function scrollToTarget(el) {
    if (lenis) { lenis.scrollTo(el, { offset: 0, duration: 1.5 }); }
    else { el.scrollIntoView({ behavior: 'smooth' }); }
  }

  /* ---------- 2. 导航：滚动态 / 汉堡菜单 / 锚点 ---------- */
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

  /* ---------- 3. 鼠标跟随光效 ---------- */
  var glow = $('#cursor-glow');
  if (glow && !prefersReduced) {
    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var gx = mx, gy = my;
    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
    }, { passive: true });
    (function glowLoop() {
      gx += (mx - gx) * 0.12;
      gy += (my - gy) * 0.12;
      glow.style.transform = 'translate3d(' + (gx - 160) + 'px,' + (gy - 160) + 'px,0)';
      requestAnimationFrame(glowLoop);
    })();
  }

  /* ---------- 4. 滚动出现动画（IntersectionObserver） ---------- */
  var revealEls = $$('.reveal');
  var revealIO = null;

  function showVisibleInViewport() {
    revealEls.forEach(function (el) {
      if (el.classList.contains('visible')) return;
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('visible');
    });
  }

  if ('IntersectionObserver' in window) {
    revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { revealIO.observe(el); });

    window.addEventListener('load', function () {
      setTimeout(showVisibleInViewport, 1400); // 兜底：避免个别浏览器 IO 异常导致内容隐藏
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---------- 5. Hero 标题逐字出现 ---------- */
  var heroTitle = $('#heroTitle');

  function splitTitle(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    var textNodes = [];
    while (walker.nextNode()) { if (walker.currentNode.textContent.trim()) textNodes.push(walker.currentNode); }
    textNodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      var chars = node.textContent.split('');
      chars.forEach(function (ch) {
        var s = document.createElement('span');
        s.className = 'char';
        s.textContent = ch === ' ' ? '\u00A0' : ch;
        frag.appendChild(s);
      });
      node.parentNode.replaceChild(frag, node);
    });
    // 随机散射参数（用于滚动散开）
    $$('.char', el).forEach(function (c, i) {
      c.style.setProperty('--d', (i * 0.022 + 0.05).toFixed(3) + 's');
      c.__scatter = [(Math.random() - 0.5) * 140, Math.random() * 90 + 30, (Math.random() - 0.5) * 28];
    });
  }

  var heroScatter = [];
  if (heroTitle) {
    splitTitle(heroTitle);
    requestAnimationFrame(function () { heroTitle.classList.add('is-anim'); });
    setTimeout(function () {
      heroTitle.classList.add('ready'); // 移除字符过渡，交给滚动散射
      heroScatter = $$('.char', heroTitle).map(function (c) { return c.__scatter; });
    }, 1900);
  }

  /* ---------- 6. Hero 滚动视差：模糊 + 散开 + 上移 ---------- */
  var hero = $('#hero');
  var heroInner = $('#heroInner');
  var heroKeywords = $('#heroKeywords');
  var scrolling = false;

  function heroScrollFx() {
    scrolling = false;
    if (!hero || prefersReduced) return;
    var vh = window.innerHeight;
    var y = window.scrollY || 0;
    var p = Math.min(1, y / vh);

    if (heroInner) heroInner.style.transform = 'translateY(' + (y * 0.3) + 'px)';

    if (heroTitle && heroTitle.classList.contains('ready')) {
      heroTitle.style.filter = 'blur(' + (p * 14) + 'px)';
      heroTitle.style.opacity = String(1 - p * 0.9);
      var chars = $$('.char', heroTitle);
      for (var i = 0; i < chars.length; i++) {
        var s = heroScatter[i] || [0, 0, 0];
        chars[i].style.transform = 'translate(' + (s[0] * p).toFixed(1) + 'px,' + (s[1] * p).toFixed(1) + 'px) rotate(' + (s[2] * p).toFixed(1) + 'deg)';
      }
    }
    if (heroKeywords) {
      heroKeywords.style.transform = 'translateY(' + (y * 0.5) + 'px)';
      heroKeywords.style.opacity = String(1 - p);
    }
  }

  window.addEventListener('scroll', function () {
    if (!scrolling) { scrolling = true; requestAnimationFrame(heroScrollFx); }
  }, { passive: true });
  heroScrollFx();

  /* ---------- 7. Three.js 粒子背景（鼠标流体扰动） ---------- */
  function initParticles() {
    if (prefersReduced || !window.THREE) return;
    var canvas = $('#particle-canvas');
    if (!canvas) return;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var W = canvas.clientWidth, H = canvas.clientHeight;
    renderer.setSize(W, H, false);

    var isMobile = window.innerWidth < 768;
    var COUNT = isMobile ? 300 : 900;
    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 100);
    camera.position.z = 10;

    var positions = new Float32Array(COUNT * 3);
    var base = [];
    for (var i = 0; i < COUNT; i++) {
      var x = (Math.random() - 0.5) * (W + 120);
      var y = (Math.random() - 0.5) * (H + 120);
      positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = 0;
      base.push(x, y, 0);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    var mat = new THREE.PointsMaterial({
      color: 0x4dd0ff,
      size: isMobile ? 1.6 : 2,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: false
    });
    var points = new THREE.Points(geo, mat);
    scene.add(points);

    var mouse = new THREE.Vector2(99999, 99999);
    window.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) - W / 2;
      mouse.y = -(e.clientY - r.top) + H / 2;
    }, { passive: true });

    var posAttr = geo.attributes.position;
    var clock = new THREE.Clock();
    var t = 0;
    var R = 130;

    (function tick() {
      requestAnimationFrame(tick);
      var dt = Math.min(clock.getDelta(), 0.05);
      t += dt;
      var arr = posAttr.array;
      for (var i = 0; i < COUNT; i++) {
        var ix = i * 3;
        var x = arr[ix], y = arr[ix + 1];
        var dx = x - mouse.x, dy = y - mouse.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < R * R && d2 > 0.001) {
          var d = Math.sqrt(d2);
          var f = (1 - d / R) * 90 * dt;
          x += (dx / d) * f;
          y += (dy / d) * f;
        } else {
          x += (base[ix] - x) * Math.min(1, dt * 2.2);
          y += (base[ix + 1] - y) * Math.min(1, dt * 2.2);
        }
        arr[ix] = x;
        arr[ix + 1] = y + Math.sin(t * 1.4 + i * 0.35) * 0.5;
        arr[ix + 2] = Math.sin(t * 2 + i) * 1.2;
      }
      posAttr.needsUpdate = true;
      points.rotation.z = Math.sin(t * 0.05) * 0.02;
      renderer.render(scene, camera);
    })();

    window.addEventListener('resize', function () {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      camera.left = -w / 2; camera.right = w / 2;
      camera.top = h / 2; camera.bottom = -h / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    });
  }
  initParticles();

  /* ---------- 8. 技能标签云：随机浮动节奏 ---------- */
  $$('#tagCloud .cloud-tag').forEach(function (tag, i) {
    tag.style.setProperty('--d', ((i % 7) * 0.9).toFixed(1) + 's');
  });

  /* ---------- 9. 数字计数动画 ---------- */
  function animateCount(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    var target = parseFloat(el.dataset.count) || 0;
    var suffix = el.dataset.suffix || '';
    var dur = 1400;
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

  /* ---------- 10. GSAP 增强（可选，失败自动跳过） ---------- */
  try {
    if (window.gsap && window.ScrollTrigger && !prefersReduced) {
      gsap.registerPlugin(ScrollTrigger);
      if (lenis) lenis.on('scroll', ScrollTrigger.update);
      // 区块标题轻微视差（不影响 .reveal 元素本身）
      $$('.section-title').forEach(function (el) {
        gsap.fromTo(el, { y: 34, opacity: 0.7 }, {
          y: 0, opacity: 1, duration: 1.1, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%' }
        });
      });
      // 项目面板内容滚动时轻微位移（Apple 式呼吸感）
      $$('.project-panel').forEach(function (panel) {
        gsap.fromTo(panel.querySelector('.project-big'), { y: 60, opacity: 0 }, {
          y: 0, opacity: 1, duration: 1.2, ease: 'power2.out',
          scrollTrigger: { trigger: panel, start: 'top 70%' }
        });
      });
    }
  } catch (err) { /* CDN 缺失/异常时静默降级 */ }

  /* ---------- 11. 全屏项目详情 Modal ---------- */
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

  /* ---------- 12. 图片灯箱（点击项目图全屏查看） ---------- */
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

  $$('.project-figure img').forEach(function (img) {
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

  /* ---------- 13. 页脚年份 ---------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
