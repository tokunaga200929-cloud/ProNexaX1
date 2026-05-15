/* ================================================================
   ProNexaX — 注目ページ スクリプト
   最小限のインタラクションのみ実装
   ================================================================ */

'use strict';

// ----------------------------------------------------------------
// バナースライダー
// ----------------------------------------------------------------
(function initBannerSlider() {
  const bgs  = document.querySelectorAll('.banner-bg');
  const dots = document.querySelectorAll('.dot');
  if (!bgs.length || !dots.length) return;

  let current = 0;
  let timer   = null;

  function goTo(idx) {
    // 現在のスライドをフェードアウト
    bgs[current].style.opacity  = '0';
    dots[current].classList.remove('active');

    current = (idx + bgs.length) % bgs.length;

    // 新しいスライドをフェードイン
    bgs[current].style.opacity  = '1';
    dots[current].classList.add('active');
  }

  function startAutoPlay() {
    timer = setInterval(() => goTo(current + 1), 4000);
  }

  function stopAutoPlay() {
    clearInterval(timer);
  }

  // ドットをタップで切り替え
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      stopAutoPlay();
      goTo(i);
      startAutoPlay();
    });
  });

  // バナーカードのスワイプ（簡易）
  const card = document.querySelector('.banner-card');
  if (card) {
    let startX = 0;
    card.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      stopAutoPlay();
    }, { passive: true });
    card.addEventListener('touchend', e => {
      const diff = e.changedTouches[0].clientX - startX;
      if (Math.abs(diff) > 40) goTo(diff < 0 ? current + 1 : current - 1);
      startAutoPlay();
    }, { passive: true });
  }

  startAutoPlay();
})();

// ----------------------------------------------------------------
// 中央Pロゴタブ
// ----------------------------------------------------------------
(function initCenterTab() {
  const btn = document.getElementById('nav-center');
  if (!btn) return;
  btn.addEventListener('click', () => {
    console.log('開発中');
    // 将来: ページ内コンテンツを表示 / ページ遷移
  });
})();

// ----------------------------------------------------------------
// 下タブ アクティブ状態（このページでは中央Pタブがアクティブ）
// ----------------------------------------------------------------
(function initBottomNav() {
  const btns = document.querySelectorAll('.bnav-btn:not(.center-tab)');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      // ラベル付きボタンのアクティブ切替（UIフィードバックのみ）
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
})();
