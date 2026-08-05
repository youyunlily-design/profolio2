/* ============================================================
   Lily · 产品作品集 — 交互脚本
   功能：导航栏滚动样式 / 移动端菜单 / 滚动出现动画 / 年份
   ============================================================ */

(function () {
  'use strict';

  /* ---------- 1. 导航栏：滚动后加阴影 ---------- */
  var nav = document.getElementById('nav');

  function onScroll() {
    if (window.scrollY > 10) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 2. 移动端汉堡菜单 ---------- */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  function closeMenu() {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
  }

  // 点击汉堡按钮展开/收起
  navToggle.addEventListener('click', function () {
    var isOpen = navLinks.classList.contains('open');
    navLinks.classList.toggle('open', !isOpen);
    navToggle.classList.toggle('open', !isOpen);
  });

  // 点击菜单项后自动收起（移动端体验更顺滑）
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  /* ---------- 3. 滚动出现动画（IntersectionObserver） ---------- */
  var revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // 出现后不再监听
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    revealEls.forEach(function (el) {
      observer.observe(el);
    });

    // 兜底：加载完成后，若视口内元素仍被动画隐藏（个别浏览器 IO 异常），立即显示
    window.addEventListener('load', function () {
      setTimeout(function () {
        revealEls.forEach(function (el) {
          if (!el.classList.contains('visible')) {
            var r = el.getBoundingClientRect();
            if (r.top < window.innerHeight && r.bottom > 0) {
              el.classList.add('visible');
            }
          }
        });
      }, 1200);
    });
  } else {
    // 老旧浏览器兜底：直接全部显示
    revealEls.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* ---------- 4. Hero 介绍逐段浮现（约每 0.5s 出现下一段，符合阅读节奏） ---------- */
  var introEls = document.querySelectorAll('#heroIntro > *');
  introEls.forEach(function (el, i) {
    setTimeout(function () {
      el.classList.add('show');
    }, 400 + i * 500);
  });

  /* ---------- 5. 页脚年份自动更新 ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ---------- 6. 图片灯箱：点击项目图全屏过渡查看（参考 Codrops） ---------- */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxCap = document.getElementById('lightboxCap');
  var lightboxClose = document.getElementById('lightboxClose');

  function openLightbox(src, caption) {
    lightboxImg.src = src;
    lightboxCap.innerHTML = caption;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // 锁住页面滚动
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.project-figure img').forEach(function (img) {
    img.addEventListener('click', function () {
      var figure = img.closest('figure');
      var fig = figure ? figure.querySelector('figcaption') : null;
      openLightbox(img.src, fig ? fig.innerHTML : '');
    });
  });

  lightboxClose.addEventListener('click', closeLightbox);

  // 点击黑色背景关闭
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  // Esc 关闭
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });
})();
