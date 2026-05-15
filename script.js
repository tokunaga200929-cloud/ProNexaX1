/* ================================================================
   ProNexaX — 注目（feature）ページ  script.js
   iOS ネイティブ風インタラクション

   【処理一覧】
   1. initHeaderScroll   — スクロール時にヘッダーをfrosted glassへ
   2. initBannerSlider   — バナー自動スライド・ドットタップ・スワイプ
   3. initCategoryCards  — カテゴリカードのタップフィードバック
   4. initArticleCards   — 記事カードのタップフィードバック
   5. initCenterTab      — 中央Pロゴタップ（★将来: ページ遷移を実装）
   6. initBottomNav      — 下タブのアクティブ状態切替
   7. initScrollReveal   — スクロールイン アニメーション

   【本体統合時の作業】
   - initCenterTab 内の navigateToFeature() に遷移処理を実装する
   - initBottomNav のタブリンクを本体の switchPage() と接続する
   ================================================================ */

'use strict';

/* ----------------------------------------------------------------
   ユーティリティ: 軽量ハプティクス（対応端末のみ振動）
   ---------------------------------------------------------------- */
function haptic(type = 'light') {
  if (!navigator.vibrate) return;
  const patterns = { light: 8, medium: 14, heavy: 22 };
  navigator.vibrate(patterns[type] ?? 8);
}

/* ================================================================
   1. ヘッダー スクロール変化
      .scroll-content が 8px 以上スクロールされたら
      .page-header に .scrolled クラスを付与 → CSS でfrosted glassに
   ================================================================ */
(function initHeaderScroll() {
  const header  = document.querySelector('.page-header');
  const scroller = document.querySelector('.scroll-content');
  if (!header || !scroller) return;

  let ticking = false;
  scroller.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.classList.toggle('scrolled', scroller.scrollTop > 8);
      ticking = false;
    });
  }, { passive: true });
})();

/* ================================================================
   2. バナースライダー
      - 4.2秒で自動再生
      - ドットタップで手動切替
      - 横スワイプ（44px 以上）で切替
      - 縦スクロールとの誤判定を防ぐ方向判定つき
   ================================================================ */
(function initBannerSlider() {
  const bgs  = document.querySelectorAll('.banner-bg');
  const dots = document.querySelectorAll('.dot');
  if (!bgs.length || !dots.length) return;

  let current    = 0;
  let timer      = null;
  let isAnimating = false;

  function goTo(idx, fromUser = false) {
    if (isAnimating) return;
    const next = ((idx % bgs.length) + bgs.length) % bgs.length;
    if (next === current) return;

    isAnimating = true;
    bgs[current].style.opacity  = '0';
    dots[current].classList.remove('active');
    current = next;
    bgs[current].style.opacity  = '1';
    dots[current].classList.add('active');
    if (fromUser) haptic('light');
    setTimeout(() => { isAnimating = false; }, 520); /* CSSのtransition(.6s)に合わせた待機 */
  }

  function startAutoPlay() {
    stopAutoPlay();
    timer = setInterval(() => goTo(current + 1), 4200);
  }
  function stopAutoPlay() {
    clearInterval(timer);
    timer = null;
  }

  /* ドットタップ */
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      stopAutoPlay();
      goTo(i, true);
      startAutoPlay();
    });
  });

  /* バナーカード スワイプ */
  const card = document.querySelector('.banner-card');
  if (card) {
    let startX = 0;
    let startY = 0;
    let isDragging = false;

    card.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = false;
      stopAutoPlay();
    }, { passive: true });

    card.addEventListener('touchmove', e => {
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dx > dy && dx > 6) isDragging = true;
    }, { passive: true });

    card.addEventListener('touchend', e => {
      if (isDragging) {
        const diff = e.changedTouches[0].clientX - startX;
        if (Math.abs(diff) > 44) goTo(diff < 0 ? current + 1 : current - 1, true);
      }
      startAutoPlay();
    }, { passive: true });
  }

  startAutoPlay();
})();

/* ================================================================
   3. カテゴリカード タップフィードバック
   ================================================================ */
(function initCategoryCards() {
  document.querySelectorAll('.cat-card').forEach(card => {
    card.addEventListener('click', () => haptic('light'));
  });
})();

/* ================================================================
   4. 記事・プロモカード タップフィードバック
   ================================================================ */
(function initArticleCards() {
  document.querySelectorAll('.article-card, .promo-card').forEach(card => {
    card.addEventListener('click', () => haptic('light'));
  });
})();

/* ================================================================
   5. 中央Pロゴタブ タップ
      ★ 本体統合時: navigateToFeature() に遷移処理を実装してください
      例) navigateToFeature() { switchPage('feature'); }
          または window.location.href = '../feature/index.html';
   ================================================================ */
function navigateToFeature() {
  /* TODO: 本体の switchPage() またはルーター呼び出しをここに実装 */
  console.log('注目ページ — 開発中');
}

(function initCenterTab() {
  const btn = document.getElementById('nav-center');
  if (!btn) return;
  btn.addEventListener('click', () => {
    haptic('medium');
    navigateToFeature();
  });
})();

/* ================================================================
   6. 下タブ アクティブ状態切替
      ★ 本体統合時: 各ボタンの click に switchPage() を接続してください
   ================================================================ */
(function initBottomNav() {
  const btns = document.querySelectorAll('.bnav-btn:not(.center-tab)');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      haptic('light');
    });
  });
})();

/* ================================================================
   7. スクロールイン アニメーション（IntersectionObserver）
      カード・ヘッダーが画面に入るとフェードイン + 浮き上がり
      prefers-reduced-motion が設定されている場合はスキップ
   ================================================================ */
(function initScrollReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  const targets = document.querySelectorAll(
    '.article-card, .cat-card, .promo-card, .section-header'
  );

  targets.forEach((el, i) => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition =
      `opacity .38s ease ${i * 0.04}s, ` +
      `transform .42s cubic-bezier(.25,.46,.45,.94) ${i * 0.04}s`;
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.style.opacity   = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });

  targets.forEach(el => observer.observe(el));
})();
