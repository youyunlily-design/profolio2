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
    }, 600 + i * 500);
  });

  /* ---------- 5. 页脚年份自动更新 ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();
