


/* ================================================================
   STEP228: 注目ページ 画像URL共通処理
   ================================================================ */
function pnxStep228CssUrl(url) {
  const normalized = pnxStep227NormalizeUrl(url);
  if (!normalized) return '';
  return 'url("' + normalized.replace(/"/g, '\\"') + '")';
}
function pnxStep228SetCardBackground(el, url, fallbackGradient) {
  if (!el) return;
  const cssUrl = pnxStep228CssUrl(url);
  el.classList.toggle('has-cms-image', !!cssUrl);
  if (cssUrl) {
    el.style.backgroundImage = (fallbackGradient || 'linear-gradient(155deg, rgba(8,42,104,.72), rgba(10,116,255,.52))') + ', ' + cssUrl;
  } else {
    el.style.backgroundImage = '';
  }
}
function pnxStep228SetThumbBackground(el, url) {
  if (!el) return;
  const cssUrl = pnxStep228CssUrl(url);
  el.classList.toggle('has-cms-image', !!cssUrl);
  if (cssUrl) el.style.backgroundImage = cssUrl;
  else el.style.backgroundImage = '';
}

/* ================================================================
   STEP227: 注目ページカードリンク共通処理
   ================================================================ */
function pnxStep227NormalizeUrl(url) {
  const text = String(url || '').trim();
  if (!text) return '';
  if (/^(https?:)?\/\//i.test(text)) return text;
  if (/^mailto:/i.test(text)) return text;
  if (text.startsWith('/')) return text;
  return 'https://' + text;
}
function pnxStep227BindCardLink(el, url) {
  if (!el) return;
  const normalized = pnxStep227NormalizeUrl(url);
  el.dataset.href = normalized;
  el.classList.toggle('has-link', !!normalized);
  el.onclick = normalized ? function () {
    window.open(normalized, '_blank', 'noopener,noreferrer');
  } : null;
}

/* ================================================================
   STEP226: CMSニュース・記事 → 注目ページ記事カード反映
   ================================================================ */
(function initFeaturedArticlesFromCms() {
  const FEATURED_KEY = 'PNX_CMS_FEATURED_CONTENTS';
  const PREVIEW_KEY = 'PNX_CMS_PREVIEW_ARTICLES';

  const fallbackArticles = [
    {
      visible: true,
      title: '最新ドライバー徹底比較\n2025年春モデル',
      desc: '今季注目の新作ドライバー5本をプロが実打比較',
      badge: 'NEW',
      date: '2025.5.12'
    },
    {
      visible: true,
      title: '今週末に行きたい\nおすすめゴルフ場特集',
      desc: '関東・関西の絶景コース5選をご紹介',
      badge: 'NEW',
      date: '2025.5.10'
    },
    {
      visible: true,
      title: 'プロが教える\nアプローチの基本',
      desc: '距離感と方向性を同時に鍛える練習法',
      badge: 'TIPS',
      date: '2025.5.8'
    }
  ];

  function readJson(key, fallbackValue) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || 'null');
      return parsed == null ? fallbackValue : parsed;
    } catch (e) {
      return fallbackValue;
    }
  }

  function normalizeArticle(row, index) {
    const title = row.title || row.name || fallbackArticles[index]?.title || '';
    const desc = row.excerpt || row.subtitle || row.body || row.desc || fallbackArticles[index]?.desc || '';
    return {
      visible: row.visible !== false && row.published !== false,
      title,
      desc,
      badge: row.badge || (row.isNew ? 'NEW' : (row.category ? String(row.category).toUpperCase() : fallbackArticles[index]?.badge || '記事')),
      date: row.date || row.startDate || fallbackArticles[index]?.date || '',
      link: row.link || row.url || fallbackArticles[index]?.link || '',
      imageUrl: row.imageUrl || row.image || row.thumbnailUrl || fallbackArticles[index]?.imageUrl || ''
    };
  }

  function readArticles() {
    if (pnxStep223IsCmsPreviewMode()) {
      const preview = readJson(PREVIEW_KEY, null);
      if (Array.isArray(preview) && preview.length) {
        return fallbackArticles.map((fallback, index) => normalizeArticle(Object.assign({}, fallback, preview[index] || {}), index));
      }
    }

    const featured = readJson(FEATURED_KEY, []);
    const rows = Array.isArray(featured)
      ? featured.filter(item => item && (item.type === 'article' || item.source === 'cms-final-article'))
      : [];

    if (!rows.length) return fallbackArticles;
    return fallbackArticles.map((fallback, index) => normalizeArticle(Object.assign({}, fallback, rows[index] || {}), index));
  }

  function setText(root, selector, value) {
    const el = root.querySelector(selector);
    if (el) el.textContent = value || '';
  }

  function setTitle(root, value) {
    const el = root.querySelector('.article-title');
    if (!el) return;
    const safe = String(value || '').split('\n').map(line => line.trim()).filter(Boolean);
    el.innerHTML = safe.length ? safe.map(line => line.replace(/[&<>"']/g, function(c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];
    })).join('<br>') : '';
  }

  function applyArticles() {
    const articles = readArticles();
    const list = document.querySelector('.article-list');
    let visibleCount = 0;

    document.querySelectorAll('[data-pnx-article-card]').forEach((cardEl, index) => {
      const data = articles[index] || fallbackArticles[index] || {};
      const visible = data.visible !== false;

      cardEl.hidden = !visible;
      cardEl.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if (visible) visibleCount += 1;

      setText(cardEl, '.article-badge', data.badge || '');
      setText(cardEl, '.article-date', data.date || '');
      setTitle(cardEl, data.title || '');
      setText(cardEl, '.article-desc', data.desc || '');
      pnxStep228SetThumbBackground(cardEl.querySelector('.article-thumb-img'), data.imageUrl || '');
      pnxStep227BindCardLink(cardEl, data.link || data.url || '');
    });

    if (list) list.classList.toggle('is-empty', visibleCount === 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyArticles, { once: true });
  } else {
    applyArticles();
  }

  window.addEventListener('storage', e => {
    if (!e || e.key === FEATURED_KEY || e.key === PREVIEW_KEY) applyArticles();
  });
  window.addEventListener('pnx:cms-final:featured-saved', applyArticles);
  window.addEventListener('PNX_CMS_FEATURED_CONTENT_SAVED', applyArticles);
})();


/* ================================================================
   STEP223: CMS右側プレビュー用ヘルパー
   ?cmsPreview=1 で開いた時だけ、公開用データではなくCMS編集中の下書きデータを読む。
   ================================================================ */
function pnxStep223IsCmsPreviewMode() {
  try {
    return new URLSearchParams(window.location.search).get('cmsPreview') === '1';
  } catch (e) {
    return false;
  }
}
function pnxStep223ReadPreviewJson(key, fallbackValue) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallbackValue;
    const parsed = JSON.parse(raw);
    return parsed == null ? fallbackValue : parsed;
  } catch (e) {
    return fallbackValue;
  }
}


/* ================================================================
   STEP222: CMS PICK UPバナー → 注目ページ反映
   ================================================================ */
(function initPickupBannerFromCms() {
  const BANNER_KEY = 'PNX_CMS_BANNERS';
  const FEATURED_KEY = 'PNX_CMS_FEATURED_CONTENTS';
  const PREVIEW_KEY = 'PNX_CMS_PREVIEW_PICKUP_BANNER';

  const fallback = {
    label: 'PICK UP',
    title: '春の新作ウェア特集',
    subtitle: '今シーズン注目のウェアやPR情報を<br>青基調で見やすくまとめました',
    cta: '詳しく見る',
    link: ''
  };

  function readJson(key, fallbackValue) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || 'null');
      return parsed == null ? fallbackValue : parsed;
    } catch (e) {
      return fallbackValue;
    }
  }

  function findPickupBanner() {
    if (pnxStep223IsCmsPreviewMode()) {
      const preview = readJson(PREVIEW_KEY, null);
      if (preview) return preview;
    }
    const banners = readJson(BANNER_KEY, []);
    const featured = readJson(FEATURED_KEY, []);
    const merged = []
      .concat(Array.isArray(banners) ? banners : [])
      .concat(Array.isArray(featured) ? featured : []);

    const candidates = merged
      .filter(item => item && (item.type === 'banner' || item.type === 'pickup-banner' || item.source === 'cms-final-pickup'))
      .filter(item => item.published !== false)
      .sort((a, b) => Number(a.order || 1) - Number(b.order || 1));

    return candidates[0] || null;
  }

  function setText(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.textContent = value || '';
  }

  function applyBanner() {
    const banner = findPickupBanner();
    const data = Object.assign({}, fallback, banner || {});
    const title = data.title || data.name || fallback.title;
    const subtitle = data.subtitle || data.body || data.desc || fallback.subtitle;
    const cta = data.cta || data.buttonText || fallback.cta;
    const label = data.label || 'PICK UP';
    const link = data.link || data.url || '';
    const imageUrl = data.imageUrl || data.image || data.bannerImageUrl || '';

    const firstBg = document.querySelector('.banner-bg-1');
    if (firstBg) {
      pnxStep228SetCardBackground(
        firstBg,
        imageUrl,
        'linear-gradient(145deg, rgba(8,42,104,.72) 0%, rgba(10,88,208,.62) 52%, rgba(10,116,255,.42) 100%)'
      );
    }

    setText('[data-pnx-pickup-label]', label);
    setText('[data-pnx-pickup-title]', title);

    const subEl = document.querySelector('[data-pnx-pickup-subtitle]');
    if (subEl) subEl.innerHTML = String(subtitle || '').replace(/\n/g, '<br>');

    setText('[data-pnx-pickup-cta]', cta);

    const ctaWrap = document.querySelector('[data-pnx-pickup-cta-wrap]');
    if (ctaWrap) {
      ctaWrap.hidden = !cta;
      ctaWrap.dataset.href = link || '';
      ctaWrap.onclick = link ? function () {
        window.open(link, '_blank', 'noopener,noreferrer');
      } : null;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyBanner, { once: true });
  } else {
    applyBanner();
  }

  window.addEventListener('storage', e => {
    if (!e || e.key === BANNER_KEY || e.key === FEATURED_KEY) applyBanner();
  });
  window.addEventListener('pnx:cms-final:featured-saved', applyBanner);
  window.addEventListener('PNX_CMS_FEATURED_CONTENT_SAVED', applyBanner);
})();


/* ================================================================
   STEP221: CMS → ウェア特集カード反映
   ================================================================ */
(function initWearFeatureCardsFromCms() {
  const STORAGE_KEY = 'PNX_CMS_FEATURED_WEAR_CARDS';
  const PREVIEW_KEY = 'PNX_CMS_PREVIEW_WEAR_CARDS';
  const fallbackCards = [
    {
      visible: true,
      tag: 'MAIN PICK UP',
      title: '春夏の主役ウェア',
      desc: '軽さ・通気性・動きやすさで選ぶ今季の注目アイテム',
      cta: '特集を見る'
    },
    {
      visible: true,
      tag: 'UV CARE',
      title: '日差し対策',
      desc: '長袖インナーやアームカバーをチェック',
      cta: ''
    },
    {
      visible: true,
      tag: 'RAIN ROUND',
      title: '雨の日ウェア',
      desc: '撥水アウターや替えアイテムをまとめて確認',
      cta: ''
    }
  ];

  function readCards() {
    try {
      const storageKey = pnxStep223IsCmsPreviewMode() ? PREVIEW_KEY : STORAGE_KEY;
      const parsed = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (!Array.isArray(parsed) || !parsed.length) return fallbackCards;
      return fallbackCards.map((fallback, index) => Object.assign({}, fallback, parsed[index] || {}));
    } catch (e) {
      return fallbackCards;
    }
  }

  function setText(root, selector, value) {
    const el = root.querySelector(selector);
    if (el) el.textContent = value || '';
  }

  function applyCards() {
    const cards = readCards();
    const grid = document.querySelector('.wear-feature-grid');
    let visibleCount = 0;
    let mainVisible = true;

    document.querySelectorAll('[data-pnx-wear-card]').forEach((cardEl, index) => {
      const data = cards[index] || fallbackCards[index] || {};
      const visible = data.visible !== false;

      cardEl.hidden = !visible;
      cardEl.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if (visible) visibleCount += 1;
      if (index === 0) mainVisible = visible;

      pnxStep228SetCardBackground(
        cardEl,
        data.imageUrl || data.image || '',
        'linear-gradient(155deg, rgba(8,42,104,.76) 0%, rgba(10,88,208,.60) 52%, rgba(10,116,255,.46) 100%)'
      );
      setText(cardEl, '.wear-card-tag', data.tag || '');
      setText(cardEl, '.wear-card-title', data.title || '');
      setText(cardEl, '.wear-card-desc', data.desc || '');
      setText(cardEl, '.wear-card-link', data.cta || '');
      const linkEl = cardEl.querySelector('.wear-card-link');
      if (linkEl) linkEl.hidden = !data.cta;
      pnxStep227BindCardLink(cardEl, data.link || data.url || '');
    });

    if (grid) {
      grid.classList.toggle('is-main-hidden', !mainVisible);
      grid.classList.toggle('is-empty', visibleCount === 0);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyCards, { once: true });
  } else {
    applyCards();
  }

  window.addEventListener('storage', e => {
    if (!e || e.key === STORAGE_KEY) applyCards();
  });
  window.addEventListener('pnx:featured-wear-cards-updated', applyCards);
})();


/* ================================================================
   STEP220: CMS広告管理 → スポンサー/PRカード反映
   ================================================================ */
(function initSponsorPrCardsFromCms() {
  const STORAGE_KEY = 'PNX_CMS_FEATURED_PR_CARDS';
  const PREVIEW_KEY = 'PNX_CMS_PREVIEW_PR_CARDS';
  const fallbackCards = [
    {
      visible: true,
      icon: 'W',
      brand: 'WEAR SELECT',
      title: '人気ウェアをまとめて比較',
      desc: '機能性・デザイン・価格帯から今季の注目モデルをチェック',
      cta: '見る'
    },
    {
      visible: true,
      icon: 'L',
      brand: 'LESSON PASS',
      title: '体験レッスンを探す',
      desc: 'インドア・屋外レッスンをエリア別に比較しやすく紹介',
      cta: '探す'
    },
    {
      visible: true,
      icon: 'T',
      brand: 'TOUR & STAY',
      title: '遠征・宿泊プラン特集',
      desc: '試合やラウンド遠征に役立つ移動・宿泊情報をピックアップ',
      cta: '特集へ'
    }
  ];

  function readCards() {
    try {
      const storageKey = pnxStep223IsCmsPreviewMode() ? PREVIEW_KEY : STORAGE_KEY;
      const parsed = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (!Array.isArray(parsed) || !parsed.length) return fallbackCards;
      return fallbackCards.map((fallback, index) => Object.assign({}, fallback, parsed[index] || {}));
    } catch (e) {
      return fallbackCards;
    }
  }

  function setText(root, selector, value) {
    const el = root.querySelector(selector);
    if (el) el.textContent = value || '';
  }

  function applyCards() {
    const cards = readCards();
    const row = document.querySelector('.sponsor-row');
    let visibleCount = 0;

    document.querySelectorAll('[data-pnx-pr-card]').forEach((cardEl, index) => {
      const data = cards[index] || fallbackCards[index] || {};
      const visible = data.visible !== false;

      cardEl.hidden = !visible;
      cardEl.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if (visible) visibleCount += 1;

      const visual = cardEl.querySelector('[data-pnx-pr-visual]');
      const visualUrl = data.logoUrl || data.iconUrl || '';
      if (visual) {
        if (visualUrl) {
          visual.innerHTML = '<img class="sponsor-card-visual-img" src="' + pnxStep227NormalizeUrl(visualUrl).replace(/"/g, '&quot;') + '" alt="">';
        } else {
          visual.textContent = data.icon || '';
        }
      }

      pnxStep228SetCardBackground(
        cardEl,
        data.imageUrl || data.image || '',
        'linear-gradient(155deg, rgba(8,42,104,.76) 0%, rgba(10,88,208,.60) 52%, rgba(10,116,255,.46) 100%)'
      );
      setText(cardEl, '.sponsor-card-brand-name', data.brand || '');
      setText(cardEl, '.sponsor-card-title', data.title || '');
      setText(cardEl, '.sponsor-card-desc', data.desc || '');
      setText(cardEl, '.sponsor-card-link', data.cta || '見る');
      pnxStep227BindCardLink(cardEl, data.link || data.url || '');
    });

    if (row) row.classList.toggle('is-empty', visibleCount === 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyCards, { once: true });
  } else {
    applyCards();
  }

  window.addEventListener('storage', e => {
    if (!e || e.key === STORAGE_KEY) applyCards();
  });
  window.addEventListener('pnx:featured-pr-cards-updated', applyCards);
})();


/* ================================================================
   STEP219: CMS表示設定 → 注目/広告ページのセクション表示制御
   広告・PR素材がない時でもCMS側で柔軟に非表示へ切り替えられる。
   ================================================================ */
(function initFeaturedSectionVisibility() {
  const STORAGE_KEY = 'PNX_CMS_FEATURED_VISIBILITY';
  const PREVIEW_KEY = 'PNX_CMS_PREVIEW_FEATURED_VISIBILITY';
  const defaults = {
    pickup: true,
    categories: true,
    wear: true,
    sponsor: true,
    articles: true,
    bottomPromo: true
  };

  function readSettings() {
    try {
      const storageKey = pnxStep223IsCmsPreviewMode() ? PREVIEW_KEY : STORAGE_KEY;
      const parsed = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return Object.assign({}, defaults, parsed || {});
    } catch (e) {
      return Object.assign({}, defaults);
    }
  }

  function applySettings() {
    const settings = readSettings();
    document.querySelectorAll('[data-pnx-feature-section]').forEach(section => {
      const key = section.getAttribute('data-pnx-feature-section');
      const visible = settings[key] !== false;
      section.hidden = !visible;
      section.setAttribute('aria-hidden', visible ? 'false' : 'true');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySettings, { once: true });
  } else {
    applySettings();
  }

  window.addEventListener('storage', e => {
    if (!e || e.key === STORAGE_KEY) applySettings();
  });
  window.addEventListener('pnx:featured-visibility-updated', applySettings);
})();

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
  document.querySelectorAll('.article-card, .promo-card, .wear-card, .wear-chip, .sponsor-card').forEach(card => {
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


/* ================================================================
   STEP224: CMSプレビュー時のフォーカス位置調整
   広告管理ならPR枠、記事管理なら記事枠が見える位置へ寄せる。
   ================================================================ */
(function initCmsPreviewFocusScroll() {
  function getFocus() {
    try { return new URLSearchParams(window.location.search).get('focus') || ''; }
    catch (e) { return ''; }
  }
  function focusSelector(focus) {
    if (focus === 'sponsor') return '[data-pnx-feature-section="sponsor"]';
    if (focus === 'articles') return '[data-pnx-feature-section="articles"]';
    if (focus === 'wear') return '[data-pnx-feature-section="wear"]';
    return '';
  }
  function run() {
    if (!pnxStep223IsCmsPreviewMode()) return;
    const selector = focusSelector(getFocus());
    if (!selector) return;
    const scroller = document.querySelector('.scroll-content') || document.scrollingElement;
    const target = document.querySelector(selector);
    if (!scroller || !target || target.hidden) return;
    setTimeout(() => {
      try {
        if (scroller === document.scrollingElement) target.scrollIntoView({ block:'start', behavior:'auto' });
        else scroller.scrollTo({ top: Math.max(0, target.offsetTop - 14), behavior:'auto' });
      } catch (e) {}
    }, 350);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once:true });
  } else {
    run();
  }
  window.addEventListener('pnx:featured-visibility-updated', run);
})();


/* ================================================================
   STEP238: 右側プレビュークリック → CMS編集画面へ移動
   CMSプレビュー内のセクションを押すと、親CMSへ編集対象を通知する。
   ================================================================ */
(function initCmsPreviewClickToEdit() {
  if (!pnxStep223IsCmsPreviewMode()) return;

  function notifyEditTarget(target) {
    if (!target) return;
    try {
      window.parent.postMessage({
        type: "PNX_CMS_PREVIEW_EDIT_TARGET",
        target: target
      }, "*");
    } catch (e) {}
  }

  function sectionToTarget(section) {
    const key = section && section.getAttribute("data-pnx-feature-section");
    if (key === "pickup") return "pickup";
    if (key === "categories") return "category";
    if (key === "wear") return "wear";
    if (key === "sponsor") return "sponsor";
    if (key === "articles") return "articles";
    if (key === "bottomPromo") return "bottom";
    return "";
  }

  function prepare() {
    document.body.classList.add("is-cms-click-edit-preview");

    document.querySelectorAll("[data-pnx-feature-section]").forEach(section => {
      const target = sectionToTarget(section);
      if (!target) return;
      section.setAttribute("data-pnx-edit-target", target);
      section.setAttribute("title", "クリックしてCMSで編集");
    });

    document.addEventListener("click", event => {
      const cardTarget =
        event.target.closest("[data-pnx-pr-card]") ? "sponsor" :
        event.target.closest("[data-pnx-wear-card]") ? "wear" :
        event.target.closest("[data-pnx-article-card]") ? "articles" :
        "";

      const section = event.target.closest("[data-pnx-feature-section]");
      const target = cardTarget || sectionToTarget(section);
      if (!target) return;

      event.preventDefault();
      event.stopPropagation();
      notifyEditTarget(target);
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", prepare, { once:true });
  } else {
    prepare();
  }
})();
