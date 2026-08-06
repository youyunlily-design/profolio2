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

  /* ---------- 4.5 Hero 入场：整体进入 → 逐字浮现 → 滚动提示 ---------- */
  var heroFig = $('.hero-figure');
  var heroCopy = $('.hero-copy');
  var hiTitle = $('.hi-title');
  var heroScroll = $('.hero-scroll');

  function splitTitleChars() {
    if (!hiTitle) return [];
    var text = hiTitle.textContent;
    hiTitle.textContent = '';
    var frag = document.createDocumentFragment();
    Array.prototype.forEach.call(text, function (ch) {
      var s = document.createElement('span');
      s.className = 'hc';
      s.textContent = ch === ' ' ? '\u00A0' : ch;
      frag.appendChild(s);
    });
    hiTitle.appendChild(frag);
    return Array.prototype.slice.call(hiTitle.children);
  }

  function runHeroIntro() {
    if (!hiTitle) return;
    var chars = splitTitleChars();
    if (prefersReduced) {
      if (heroFig) heroFig.classList.add('hero-in');
      if (heroCopy) heroCopy.classList.add('hero-in');
      chars.forEach(function (c) { c.classList.add('on'); });
      if (heroScroll) heroScroll.classList.add('show');
      return;
    }
    if (heroFig) heroFig.classList.add('hero-in');
    if (heroCopy) heroCopy.classList.add('hero-in');
    // 图片进入完成后（800ms），标题逐字浮现（35ms 间隔）
    setTimeout(function () {
      chars.forEach(function (c, i) {
        c.style.transitionDelay = (i * 35) + 'ms';
        c.classList.add('on');
      });
      // 全部字符完成后，显示底部滚动提示
      setTimeout(function () {
        if (heroScroll) heroScroll.classList.add('show');
      }, chars.length * 35 + 450 + 300);
    }, 820);
  }

  if (hiTitle) {
    if (document.readyState !== 'loading') runHeroIntro();
    else document.addEventListener('DOMContentLoaded', runHeroIntro);
  }

  /* ---------- 4.7 Project 01 · 三栏滚动叙事（左图列 / 中正文 / 右 Reading Index） ----------
     只在 #story-p1 生效。滚动时同步切换三处高亮（图片 / 正文 / Index 节点），
     内容始终完整展示，只改变视觉焦点。
     步进：阅读线取视口 52% 高度，小节标题越过该线即激活对应步；
     最后一个小节整体越过阅读线后进入收尾步（无高亮）。
     Reading Index 节点顶部与对应正文标题顶部对齐，竖线随正文高度自动延伸。 */
  var storyP1 = $('#story-p1');
  if (storyP1) {
    var p1Blocks = $$('.story-block', storyP1);
    var p1Figs = $$('.story-fig', storyP1);
    var p1Items = $$('.si-item', storyP1);
    var p1Col = $('.story-col', storyP1);
    var p1IndexLine = $('.si-line', storyP1);
    var p1Step = -2; // -2 未初始化 / -1 收尾步 / 0~4 对应 5 个小节
    var p1Ticking = false;

    function setP1Step(step) {
      if (step === p1Step) return;
      p1Step = step;
      var i;
      for (i = 0; i < p1Blocks.length; i++) p1Blocks[i].classList.toggle('is-active', i === step);
      for (i = 0; i < p1Items.length; i++) p1Items[i].classList.toggle('is-active', i === step);
      p1Figs.forEach(function (fig, idx) {
        fig.classList.toggle('is-active', idx === step);
      });
    }

    function updateP1Step() {
      p1Ticking = false;
      var vh = window.innerHeight;
      var line = vh * 0.52;
      var active = 0;
      var i, r;
      for (i = 0; i < p1Blocks.length; i++) {
        r = p1Blocks[i].getBoundingClientRect();
        if (r.top <= line) active = i;
      }
      if (p1Blocks.length) {
        r = p1Blocks[p1Blocks.length - 1].getBoundingClientRect();
        if (r.bottom < line) active = -1;
      }
      setP1Step(active);
    }

    // Reading Index 对齐：节点顶部 = 对应正文 h4 顶部；竖线连接首尾节点圆心
    function syncP1Index() {
      if (!p1Col || !p1IndexLine) return;
      var colRect = p1Col.getBoundingClientRect();
      var firstTop = null;
      var lastTop = null;
      p1Blocks.forEach(function (block, i) {
        var h4 = block.querySelector('h4');
        var item = p1Items[i];
        if (!h4 || !item) return;
        var top = h4.getBoundingClientRect().top - colRect.top;
        item.style.top = top + 'px';
        if (i === 0) firstTop = top;
        if (i === p1Blocks.length - 1) lastTop = top;
      });
      if (firstTop !== null && lastTop !== null) {
        p1IndexLine.style.top = (firstTop + 3.5) + 'px';
        p1IndexLine.style.height = Math.max(0, lastTop - firstTop) + 'px';
      }
    }

    function requestP1Step() {
      if (!p1Ticking) { p1Ticking = true; requestAnimationFrame(updateP1Step); }
    }

    window.addEventListener('scroll', requestP1Step, { passive: true });
    window.addEventListener('resize', function () {
      requestP1Step();
      syncP1Index();
    }, { passive: true });
    window.addEventListener('load', syncP1Index);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncP1Index);
    if ('ResizeObserver' in window) {
      var p1Body = $('.story-body', storyP1);
      if (p1Body) new ResizeObserver(syncP1Index).observe(p1Body);
    }
    requestP1Step();
    syncP1Index();
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

  $$('.project-figure img, .g-fig img, .pb-img img, .about-figure img, .story-fig img, .gallery-item img, .ach-img img, .hero-figure img').forEach(function (img) {
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
