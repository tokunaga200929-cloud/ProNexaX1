/**
 * ProNexaX — pages/search/script.js
 * 試合検索ページ STEP1
 *
 * 構成:
 *  § 1  ダミーデータ定義
 *  § 2  カテゴリチップ描画
 *  § 3  条件フィルター描画
 *  § 4  クイックアクセスカード描画
 *  § 5  大会カード描画
 *  § 6  フィルタリング・ソートロジック
 *  § 7  Bottom Sheet 開閉制御
 *  § 8  Bottom Sheet コンテンツ描画
 *  § 9  下部タブバー
 *  § 10 検索バー・イベント接続
 *  § 11 初期化
 */

'use strict';

/* ================================================================
   § 1  ダミーデータ定義
   ※ STEP2以降でFirestore/APIに差し替え
   ================================================================ */

/**
 * 大会ダミーデータ
 * （本体移植時は TOURNAMENTS_FLAT と同じフィールド構成に合わせる）
 */
const DUMMY_TOURNAMENTS = [
  {
    id: 'jgto-2025-001',
    name: '日本ゴルフツアー選手権 森ビルカップ Shishido Hills',
    cat: 'jgto',
    gender: 'mens',
    region: 'domestic',
    area: 'kanto',
    prefecture: 'ibaraki',
    course: '宍戸ヒルズCC（西コース）',
    start: '2025-06-05',
    end: '2025-06-08',
    entryDeadline: '2025-05-20',
    cancelDeadline: '2025-05-27',
    prize: '2億円',
    prizeWinner: '4,000万円',
    entryFee: '50,000円',
    practiceRoundFee: '15,000円',
    entryMethod: 'JGTO公式サイト・事前申請',
    qualification: 'JGTO会員・シードランキング上位',
    capacity: '120名',
    organizer: '日本ゴルフツアー機構（JGTO）',
    status: 'open',
    emoji: '🏆',
    tags: ['メジャー', 'JGTOポイント'],
    addedToCalendar: false,
  },
  {
    id: 'open-2025-001',
    name: '関東オープンゴルフ選手権競技',
    cat: 'open',
    gender: 'mens',
    region: 'domestic',
    area: 'kanto',
    prefecture: 'chiba',
    course: '我孫子GC',
    start: '2025-05-22',
    end: '2025-05-24',
    entryDeadline: '2025-05-12',
    cancelDeadline: '2025-05-16',
    prize: '3,000万円',
    prizeWinner: '500万円',
    entryFee: '30,000円',
    practiceRoundFee: '8,000円',
    entryMethod: '関東ゴルフ連盟申請書',
    qualification: 'プロゴルファー・アマチュア（ハンデ2以内）',
    capacity: '80名',
    organizer: '関東ゴルフ連盟',
    status: 'near',
    emoji: '⛳',
    tags: ['関東', '競技'],
    addedToCalendar: false,
  },
  {
    id: 'lpga-2025-001',
    name: 'ニッポンハム レディスクラシック',
    cat: 'lpga',
    gender: 'womens',
    region: 'domestic',
    area: 'hokkaido',
    prefecture: 'hokkaido',
    course: '北広島クラブ',
    start: '2025-06-12',
    end: '2025-06-15',
    entryDeadline: '2025-05-30',
    cancelDeadline: '2025-06-05',
    prize: '1億2,000万円',
    prizeWinner: '2,160万円',
    entryFee: '40,000円',
    practiceRoundFee: '12,000円',
    entryMethod: 'JLPGA公式サイト',
    qualification: 'JLPGA会員・ランキング上位',
    capacity: '96名',
    organizer: '日本女子プロゴルフ協会（JLPGA）',
    status: 'open',
    emoji: '🌸',
    tags: ['女子ツアー', 'メディア放映'],
    addedToCalendar: false,
  },
  {
    id: 'qt-2025-001',
    name: 'JGTO QTファイナル 2025',
    cat: 'qt',
    gender: 'mens',
    region: 'domestic',
    area: 'tokai',
    prefecture: 'aichi',
    course: '中部クラシックCC',
    start: '2025-11-10',
    end: '2025-11-14',
    entryDeadline: '2025-10-15',
    cancelDeadline: '2025-10-22',
    prize: '—',
    prizeWinner: '—',
    entryFee: '60,000円',
    practiceRoundFee: '20,000円',
    entryMethod: 'JGTO公式サイト・予選通過者のみ',
    qualification: 'QT 1〜3次予選通過者',
    capacity: '150名',
    organizer: '日本ゴルフツアー機構（JGTO）',
    status: 'open',
    emoji: '🎯',
    tags: ['QT', 'シード権'],
    addedToCalendar: false,
  },
  {
    id: 'mini-2025-001',
    name: 'Future Tour 第3戦 関東大会',
    cat: 'mini',
    gender: 'mens',
    region: 'domestic',
    area: 'kanto',
    prefecture: 'kanagawa',
    course: '川崎国際生田緑地GC',
    start: '2025-05-26',
    end: '2025-05-27',
    entryDeadline: '2025-05-14',
    cancelDeadline: '2025-05-19',
    prize: '150万円',
    prizeWinner: '50万円',
    entryFee: '18,000円',
    practiceRoundFee: '5,000円',
    entryMethod: 'Future Tour公式LINE',
    qualification: 'プロ・アマ（ハンデ5以内）',
    capacity: '48名',
    organizer: 'Future Tour運営委員会',
    status: 'near',
    emoji: '🌱',
    tags: ['ミニツアー', '初参加歓迎'],
    addedToCalendar: false,
  },
];

/**
 * カテゴリチップ定義
 */
const CATEGORIES = [
  { key: 'all',    label: 'すべて',    icon: '🔍' },
  { key: 'jgto',  label: '男子ツアー', icon: '🏌️' },
  { key: 'lpga',  label: '女子ツアー', icon: '🌸' },
  { key: 'qt',    label: 'QT',        icon: '🎯' },
  { key: 'mini',  label: 'ミニツアー', icon: '🌱' },
  { key: 'open',  label: 'オープン',   icon: '⛳' },
  { key: 'student',label: '学生',      icon: '🎓' },
  { key: 'abroad', label: '海外',      icon: '✈️' },
];

/**
 * 条件フィルター定義
 */
const CONDITIONS = [
  { key: 'recruiting', label: '募集中のみ', icon: null },
  { key: 'near',       label: '締切間近',   icon: null },
  { key: 'thisweek',   label: '今週開催',   icon: null },
  { key: 'nextmonth',  label: '来月開催',   icon: null },
  { key: 'area',       label: '開催地',     icon: '📍' },
  { key: 'reset',      label: 'リセット',   icon: '↺', isReset: true },
];

/**
 * クイックアクセスカード定義
 */
const QUICK_CARDS = [
  { key: 'near',       label: '締切間近',   icon: '🔥', count: 3,  colorClass: 'qc-red'    },
  { key: 'thisweek',   label: '今週開催',   icon: '📅', count: 2,  colorClass: 'qc-amber'  },
  { key: 'nextmonth',  label: '来月開催',   icon: '📆', count: 8,  colorClass: 'qc-blue'   },
  { key: 'popular',    label: '人気大会',   icon: '⭐', count: 5,  colorClass: 'qc-green'  },
  { key: 'travel',     label: '遠征おすすめ',icon: '✈️', count: 4,  colorClass: 'qc-purple' },
];


/* ================================================================
   § 2  カテゴリチップ描画
   ================================================================ */

let activeCategoryKey = 'all';

function renderCategoryChips() {
  const container = document.getElementById('category-chips');
  if (!container) return;

  container.innerHTML = CATEGORIES.map(cat => `
    <button
      class="s-chip${cat.key === activeCategoryKey ? ' active' : ''}"
      data-cat="${cat.key}"
      aria-pressed="${cat.key === activeCategoryKey}"
    >
      <span class="s-chip-icon">${cat.icon}</span>
      ${cat.label}
    </button>
  `).join('');

  // イベントバインド
  container.querySelectorAll('.s-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategoryKey = btn.dataset.cat;
      renderCategoryChips();
      applyFiltersAndRender();
    });
  });
}


/* ================================================================
   § 3  条件フィルター描画
   ================================================================ */

const activeConditions = new Set();

function renderConditionFilters() {
  const container = document.getElementById('condition-filters');
  if (!container) return;

  container.innerHTML = CONDITIONS.map(cond => {
    const isActive = activeConditions.has(cond.key);
    return `
      <button
        class="s-filter-chip${cond.isReset ? ' reset' : ''}${isActive ? ' active' : ''}"
        data-cond="${cond.key}"
        aria-pressed="${isActive}"
      >
        ${cond.icon ? `<span>${cond.icon}</span>` : ''}
        ${cond.label}
      </button>
    `;
  }).join('');

  container.querySelectorAll('.s-filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.cond;
      if (key === 'reset') {
        activeConditions.clear();
        renderConditionFilters();
        applyFiltersAndRender();
        return;
      }
      if (activeConditions.has(key)) {
        activeConditions.delete(key);
      } else {
        activeConditions.add(key);
      }
      renderConditionFilters();
      applyFiltersAndRender();
    });
  });
}


/* ================================================================
   § 4  クイックアクセスカード描画
   ================================================================ */

function renderQuickCards() {
  const container = document.getElementById('quick-cards');
  if (!container) return;

  container.innerHTML = QUICK_CARDS.map(card => `
    <div class="s-quick-card ${card.colorClass}" data-quick="${card.key}" role="button" tabindex="0">
      <div class="s-quick-icon">${card.icon}</div>
      <span class="s-quick-label">${card.label}</span>
      <span class="s-quick-count">${card.count}件</span>
    </div>
  `).join('');

  container.querySelectorAll('.s-quick-card').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.dataset.quick;
      // クイックアクセスタップ → 対応するフィルターを適用
      activeConditions.clear();
      if (key !== 'popular' && key !== 'travel') {
        activeConditions.add(key);
      }
      renderConditionFilters();
      applyFiltersAndRender();
      // 大会リストまでスクロール
      const listSection = document.querySelector('.s-list-section');
      if (listSection) {
        listSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}


/* ================================================================
   § 5  大会カード描画
   ================================================================ */

/**
 * 募集状況バッジHTML
 */
function statusBadgeHTML(t) {
  if (t.status === 'near') {
    return `<span class="tc-status-badge tc-status-near">🔥 締切間近</span>`;
  }
  if (t.status === 'open') {
    return `<span class="tc-status-badge tc-status-open">✓ 募集中</span>`;
  }
  return `<span class="tc-status-badge tc-status-closed">締切済</span>`;
}

/**
 * 性別バッジHTML
 */
function genderBadgeHTML(gender) {
  if (gender === 'mens')   return `<span class="tc-badge badge-gender-m">男子</span>`;
  if (gender === 'womens') return `<span class="tc-badge badge-gender-f">女子</span>`;
  return '';
}

/**
 * カテゴリー日本語名
 */
function catLabel(key) {
  const found = CATEGORIES.find(c => c.key === key);
  return found ? found.label : key;
}

/**
 * 日付フォーマット (YYYY-MM-DD → M/D)
 */
function fmtDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * 日付フォーマット (YYYY-MM-DD → YYYY年M月D日)
 */
function fmtDateLong(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/**
 * 曜日付き短い日付 (YYYY-MM-DD → M月D日(曜))
 */
function fmtDateWithDay(str) {
  if (!str) return '—';
  const days = ['日','月','火','水','木','金','土'];
  const d = new Date(str);
  if (isNaN(d)) return str;
  return `${d.getMonth() + 1}月${d.getDate()}日(${days[d.getDay()]})`;
}

/**
 * 大会カード1件のHTML
 */
function tournamentCardHTML(t) {
  return `
    <article
      class="s-tournament-card"
      data-id="${t.id}"
      role="button"
      tabindex="0"
      aria-label="${t.name} 詳細を見る"
    >
      <!-- 画像エリア -->
      <div class="tc-image-wrap">
        <div class="tc-image-placeholder">${t.emoji}</div>
        <div class="tc-image-overlay"></div>
        <div class="tc-badges">
          <div class="tc-badge-left">
            ${t.status === 'near'
              ? `<span class="tc-badge badge-deadline-near">🔥 締切間近</span>`
              : `<span class="tc-badge badge-entry-open">募集中</span>`
            }
            <span class="tc-badge badge-cat">${catLabel(t.cat)}</span>
            ${genderBadgeHTML(t.gender)}
          </div>
          <button
            class="tc-fav-btn"
            data-id="${t.id}"
            aria-label="お気に入り"
            onclick="event.stopPropagation(); toggleFav('${t.id}', this)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- コンテンツ -->
      <div class="tc-content">
        <!-- 日程 -->
        <div class="tc-date-row">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          </svg>
          <span class="tc-date">${fmtDate(t.start)} 〜 ${fmtDate(t.end)}</span>
        </div>

        <!-- 大会名 -->
        <h3 class="tc-name">${t.name}</h3>

        <!-- 会場 -->
        <p class="tc-venue">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          ${t.course}
        </p>

        <!-- 情報グリッド -->
        <div class="tc-info-grid">
          <div class="tc-info-item">
            <p class="tc-info-label">賞金総額</p>
            <p class="tc-info-value highlight">${t.prize}</p>
          </div>
          <div class="tc-info-item">
            <p class="tc-info-label">エントリー費</p>
            <p class="tc-info-value">${t.entryFee}</p>
          </div>
          <div class="tc-info-item">
            <p class="tc-info-label">出場資格</p>
            <p class="tc-info-value" style="font-size:11px;font-weight:600;">${t.qualification.slice(0, 22)}…</p>
          </div>
          <div class="tc-info-item">
            <p class="tc-info-label">募集人数</p>
            <p class="tc-info-value">${t.capacity}</p>
          </div>
        </div>

        <!-- 締切・ステータス -->
        <div class="tc-meta-row">
          ${statusBadgeHTML(t)}
          <span class="tc-deadline">締切 ${fmtDateLong(t.entryDeadline)}</span>
        </div>

        <!-- アクションボタン -->
        <div class="tc-actions">
          <button
            class="tc-btn tc-btn-detail"
            onclick="event.stopPropagation(); openBottomSheet('${t.id}')"
            aria-label="${t.name} 詳細を見る"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            詳細を見る
          </button>
          <button
            class="tc-btn tc-btn-add"
            data-id="${t.id}"
            onclick="event.stopPropagation(); handleCalendarAdd('${t.id}', this)"
            aria-label="カレンダーに追加"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>
            </svg>
            追加
          </button>
        </div>
      </div>
    </article>
  `;
}

/**
 * 大会リスト全体を描画
 */
function renderTournamentList(tournaments) {
  const container = document.getElementById('tournament-list');
  if (!container) return;

  if (tournaments.length === 0) {
    container.innerHTML = `
      <div class="s-empty">
        <div class="s-empty-icon">🔍</div>
        <p class="s-empty-title">該当する大会がありません</p>
        <p class="s-empty-sub">フィルターを変更してもう一度お試しください</p>
      </div>
    `;
    return;
  }

  container.innerHTML = tournaments.map(tournamentCardHTML).join('');

  // ── カード全体タップでBottomSheetを開く
  // tappingクラスで押し込みフィードバック → 少し待ってからシートを開く
  container.querySelectorAll('.s-tournament-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // ボタン直タップの場合はカードイベントをスキップ（ボタン側で処理）
      if (e.target.closest('.tc-btn') || e.target.closest('.tc-fav-btn')) return;

      const id = card.dataset.id;

      // タップフィードバック: 押し込みアニメーション
      card.classList.add('tapping');
      setTimeout(() => {
        card.classList.remove('tapping');
        openBottomSheet(id);
      }, 90); // 90ms後にシートが出る → 自然な連続感
    });
  });
}


/* ================================================================
   § 6  フィルタリング・ソートロジック
   ================================================================ */

let currentSort = 'recommend';
let searchQuery  = '';

function applyFiltersAndRender() {
  let result = [...DUMMY_TOURNAMENTS];

  // ── カテゴリフィルター ──
  if (activeCategoryKey !== 'all') {
    result = result.filter(t => t.cat === activeCategoryKey);
  }

  // ── 検索クエリ ──
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    result = result.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.organizer.toLowerCase().includes(q) ||
      t.course.toLowerCase().includes(q)
    );
  }

  // ── 条件フィルター ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const oneWeekLater  = new Date(today); oneWeekLater.setDate(today.getDate() + 7);
  const thisMonthEnd  = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextMonthEnd   = new Date(today.getFullYear(), today.getMonth() + 2, 0);

  if (activeConditions.has('recruiting') || activeConditions.has('near')) {
    result = result.filter(t => t.status === 'open' || t.status === 'near');
  }
  if (activeConditions.has('near')) {
    result = result.filter(t => t.status === 'near');
  }
  if (activeConditions.has('thisweek')) {
    result = result.filter(t => {
      const s = new Date(t.start);
      return s >= today && s <= oneWeekLater;
    });
  }
  if (activeConditions.has('nextmonth')) {
    result = result.filter(t => {
      const s = new Date(t.start);
      return s >= nextMonthStart && s <= nextMonthEnd;
    });
  }

  // ── ソート ──
  result = sortTournaments(result, currentSort);

  renderTournamentList(result);
}

function sortTournaments(arr, sortKey) {
  const sorted = [...arr];
  switch (sortKey) {
    case 'date':
      sorted.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
      break;
    case 'deadline':
      sorted.sort((a, b) => (a.entryDeadline < b.entryDeadline ? -1 : a.entryDeadline > b.entryDeadline ? 1 : 0));
      break;
    case 'new':
      sorted.reverse(); // 新着 = 配列末尾が新しい想定
      break;
    case 'recommend':
    default:
      // おすすめ: 締切間近を優先
      sorted.sort((a, b) => {
        const score = (t) => (t.status === 'near' ? 10 : 0);
        return score(b) - score(a);
      });
      break;
  }
  return sorted;
}


/* ================================================================
   § 7  Bottom Sheet 開閉制御
   iOS Maps / Apple Music 風の自然なアニメーション
   ================================================================ */

let currentTournamentId = null;
let _bsIsOpen = false;       // 二重発火防止フラグ
let _bsCloseTimer = null;    // 閉じるタイマー

const bsOverlay = document.getElementById('bs-overlay');
const bsSheet   = document.getElementById('bs-sheet');
const scrollArea = document.getElementById('scroll-area');

/**
 * Bottom Sheet を開く
 * - カードタップ時に呼ばれる
 * - コンテンツ描画 → 2フレーム後にクラス付与（CSSトランジション起点）
 */
function openBottomSheet(id) {
  if (_bsIsOpen) return;          // 既に開いている場合はスキップ
  const t = DUMMY_TOURNAMENTS.find(x => x.id === id);
  if (!t) return;

  // --- 1. 状態更新 ---
  currentTournamentId = id;
  _bsIsOpen = true;
  if (_bsCloseTimer) { clearTimeout(_bsCloseTimer); _bsCloseTimer = null; }

  // --- 2. コンテンツ描画（表示前に済ませておく） ---
  renderBottomSheetContent(t);

  // --- 3. aria 制御 ---
  bsSheet.removeAttribute('aria-hidden');
  bsSheet.setAttribute('aria-modal', 'true');
  bsOverlay.setAttribute('aria-hidden', 'false');

  // --- 4. メインコンテンツのスクロール固定（位置ずれ防止） ---
  scrollArea.style.overflow = 'hidden';
  scrollArea.style.touchAction = 'none';

  // --- 5. 2フレーム後にクラス付与 → CSS transition 起動 ---
  //    1フレームだとブラウザが初期状態を認識できないことがある
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bsOverlay.classList.add('open');
      bsSheet.classList.add('open');
    });
  });

  // --- 6. 開いたあとフォーカスを閉じるボタンへ（アクセシビリティ） ---
  const closeBtn = document.getElementById('bs-close-btn');
  if (closeBtn) setTimeout(() => closeBtn.focus({ preventScroll: true }), 460);
}

/**
 * Bottom Sheet を閉じる
 * - クラスを外す → CSSトランジション（同じspring）で閉じる
 * - transition終了後にスクロール禁止を解除
 */
function closeBottomSheet() {
  if (!_bsIsOpen) return;
  _bsIsOpen = false;

  // --- 1. クラスを外すと CSSトランジションで閉じる ---
  bsOverlay.classList.remove('open');
  bsSheet.classList.remove('open');

  // --- 2. aria ---
  bsSheet.setAttribute('aria-hidden', 'true');
  bsOverlay.setAttribute('aria-hidden', 'true');

  // --- 3. トランジション終了後（~480ms）にスクロール復元 ---
  _bsCloseTimer = setTimeout(() => {
    scrollArea.style.overflow = '';
    scrollArea.style.touchAction = '';
    currentTournamentId = null;
    _bsCloseTimer = null;
  }, 480);
}

// ── イベント接続 ──

// 閉じるボタン
document.getElementById('bs-close-btn').addEventListener('click', closeBottomSheet);

// 背景暗幕タップで閉じる
bsOverlay.addEventListener('click', closeBottomSheet);

// Escキーで閉じる（デスクトップ確認用）
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && _bsIsOpen) closeBottomSheet();
});

// ── スワイプダウン（簡易実装）
// ドラッグハンドルを下へ引っ張ると閉じる
;(function initSwipeDown() {
  const handle = document.querySelector('.bs-handle-wrap');
  if (!handle) return;

  let startY = 0;
  let startTime = 0;
  let isDragging = false;

  handle.addEventListener('touchstart', e => {
    if (!_bsIsOpen) return;
    startY = e.touches[0].clientY;
    startTime = Date.now();
    isDragging = true;
  }, { passive: true });

  handle.addEventListener('touchmove', e => {
    if (!isDragging || !_bsIsOpen) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 0) {
      // ドラッグ距離に応じてシートを追随させる（フォロースルー感）
      bsSheet.style.transition = 'none';
      bsSheet.style.transform = `translateX(-50%) translateY(${dy}px)`;
    }
  }, { passive: true });

  handle.addEventListener('touchend', e => {
    if (!isDragging) return;
    isDragging = false;
    const dy = e.changedTouches[0].clientY - startY;
    const dt = Date.now() - startTime;
    const velocity = dy / dt; // px/ms

    // 80px以上下に引くか、速い下スワイプ（>0.5px/ms）で閉じる
    if (dy > 80 || velocity > 0.5) {
      bsSheet.style.transition = '';
      bsSheet.style.transform = '';
      closeBottomSheet();
    } else {
      // 途中まで引いてリリース → 元に戻す
      bsSheet.style.transition = 'transform .32s cubic-bezier(0.32, 0.72, 0, 1)';
      bsSheet.style.transform = 'translateX(-50%) translateY(0)';
      setTimeout(() => {
        bsSheet.style.transition = '';
        bsSheet.style.transform = '';
      }, 340);
    }
  }, { passive: true });
})();


/* ================================================================
   § 8  Bottom Sheet コンテンツ描画
   ================================================================ */

function renderBottomSheetContent(t) {
  // ヘッダータイトル
  document.getElementById('bs-header-title').textContent = '大会詳細';

  // 画像プレースホルダー
  const imgPlaceholder = document.getElementById('bs-image-placeholder');
  if (imgPlaceholder) imgPlaceholder.textContent = t.emoji;

  // 画像バッジ
  const imgBadges = document.getElementById('bs-image-badges');
  if (imgBadges) {
    imgBadges.innerHTML = `
      <span class="tc-badge badge-cat">${catLabel(t.cat)}</span>
      ${genderBadgeHTML(t.gender)}
      ${t.status === 'near'
        ? `<span class="tc-badge badge-deadline-near">🔥 締切間近</span>`
        : `<span class="tc-badge badge-entry-open">募集中</span>`
      }
    `;
  }

  // 大会名
  document.getElementById('bs-name').textContent = t.name;

  // ステータス行
  const statusRow = document.getElementById('bs-status-row');
  if (statusRow) {
    statusRow.innerHTML = `
      ${statusBadgeHTML(t)}
      <span style="font-size:12px;color:var(--text-secondary);">締切 ${fmtDateLong(t.entryDeadline)}</span>
    `;
  }

  // 情報グリッド
  const infoGrid = document.getElementById('bs-info-grid');
  if (infoGrid) {
    infoGrid.innerHTML = `
      <div class="bs-info-item full">
        <p class="bs-info-label">開催期間</p>
        <p class="bs-info-value highlight">${fmtDateWithDay(t.start)} 〜 ${fmtDateWithDay(t.end)}</p>
      </div>
      <div class="bs-info-item full">
        <p class="bs-info-label">会場</p>
        <p class="bs-info-value">${t.course}</p>
      </div>
      <div class="bs-info-item">
        <p class="bs-info-label">賞金総額</p>
        <p class="bs-info-value highlight">${t.prize}</p>
      </div>
      <div class="bs-info-item">
        <p class="bs-info-label">優勝賞金</p>
        <p class="bs-info-value highlight">${t.prizeWinner}</p>
      </div>
      <div class="bs-info-item">
        <p class="bs-info-label">エントリー費</p>
        <p class="bs-info-value">${t.entryFee}</p>
      </div>
      <div class="bs-info-item">
        <p class="bs-info-label">プレーフィー</p>
        <p class="bs-info-value">${t.practiceRoundFee}</p>
      </div>
      <div class="bs-info-item">
        <p class="bs-info-label">募集人数</p>
        <p class="bs-info-value">${t.capacity}</p>
      </div>
      <div class="bs-info-item">
        <p class="bs-info-label">主催</p>
        <p class="bs-info-value" style="font-size:11.5px;">${t.organizer}</p>
      </div>
      <div class="bs-info-item full">
        <p class="bs-info-label">出場資格</p>
        <p class="bs-info-value" style="font-size:12px;font-weight:500;line-height:1.4;">${t.qualification}</p>
      </div>
      <div class="bs-info-item full">
        <p class="bs-info-label">エントリー方法</p>
        <p class="bs-info-value" style="font-size:12px;font-weight:500;line-height:1.4;">${t.entryMethod}</p>
      </div>
    `;
  }

  // スケジュール
  const scheduleList = document.getElementById('bs-schedule-list');
  if (scheduleList) {
    const items = [
      { date: t.entryDeadline,   label: 'エントリー締切' },
      { date: t.cancelDeadline,  label: 'キャンセル締切' },
      { date: t.start,           label: '競技開始' },
      { date: t.end,             label: '競技最終日' },
    ];
    scheduleList.innerHTML = items.map(item => `
      <div class="bs-schedule-item">
        <span class="bs-sched-date">${fmtDateWithDay(item.date)}</span>
        <span class="bs-sched-label">${item.label}</span>
      </div>
    `).join('');
  }

  // CTAボタン状態更新（カレンダー追加済みチェック）
  const addBtn = document.getElementById('bs-cta-add');
  if (addBtn) {
    const t = DUMMY_TOURNAMENTS.find(x => x.id === currentTournamentId);
    if (t && t.addedToCalendar) {
      addBtn.textContent = '✓ 追加済み';
      addBtn.style.background = 'var(--green-light)';
      addBtn.style.color = 'var(--green-deep)';
    } else {
      addBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>
        </svg>
        カレンダーに追加
      `;
    }
  }

  // シート本文を先頭にスクロール
  const body = document.getElementById('bs-body');
  if (body) body.scrollTop = 0;
}

// Bottom Sheet CTAボタン
document.getElementById('bs-cta-detail').addEventListener('click', () => {
  const t = DUMMY_TOURNAMENTS.find(x => x.id === currentTournamentId);
  if (!t) return;
  // STEP2で公式URLに遷移する予定
  alert(`「${t.name}」の公式サイト連携はSTEP2で実装予定です。`);
});

document.getElementById('bs-cta-add').addEventListener('click', () => {
  if (!currentTournamentId) return;
  handleCalendarAdd(currentTournamentId, document.getElementById('bs-cta-add'));
  // シート内ボタンも更新
  renderBottomSheetContent(DUMMY_TOURNAMENTS.find(x => x.id === currentTournamentId));
});


/* ================================================================
   § 共通: カレンダー追加ハンドラー
   ================================================================ */

function handleCalendarAdd(id, btnEl) {
  const t = DUMMY_TOURNAMENTS.find(x => x.id === id);
  if (!t) return;

  if (t.addedToCalendar) {
    // 既に追加済みの場合は何もしない（または削除フローへ）
    return;
  }

  t.addedToCalendar = true;

  // ボタンUI更新
  if (btnEl) {
    btnEl.innerHTML = '✓ 追加済み';
    btnEl.style.background = '#E8F5EE';
    btnEl.style.color = 'var(--green-deep)';
  }

  // STEP2: ここで EVENTS[] や Firestore に書き込む
  console.log(`[ProNexaX] カレンダー追加: ${t.name} (${t.id})`);
  showToast(`「${t.name}」をカレンダーに追加しました`);
}

/**
 * お気に入りトグル
 */
function toggleFav(id, btnEl) {
  btnEl.classList.toggle('active');
  const isActive = btnEl.classList.contains('active');
  console.log(`[ProNexaX] お気に入り${isActive ? '追加' : '削除'}: ${id}`);
}


/* ================================================================
   § トースト通知（軽量実装）
   ================================================================ */

function showToast(message) {
  // 既存のトーストを削除
  const existing = document.getElementById('pnx-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'pnx-toast';
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    left: '50%',
    bottom: `calc(var(--tab-height, 56px) + env(safe-area-inset-bottom, 0px) + 12px)`,
    transform: 'translateX(-50%)',
    background: 'rgba(30,30,30,.88)',
    backdropFilter: 'blur(8px)',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    padding: '10px 18px',
    borderRadius: '22px',
    zIndex: '9999',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 16px rgba(0,0,0,.24)',
    opacity: '0',
    transition: 'opacity .22s ease',
    pointerEvents: 'none',
  });

  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 2200);
}


/* ================================================================
   § 9  下部タブバー
   ================================================================ */

document.querySelectorAll('.tab-item[data-page]').forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.dataset.page;
    if (page === 'search') return; // 現在のページ
    // STEP2: 本体アプリへの遷移処理に差し替える
    showToast(`「${btn.querySelector('.tab-label')?.textContent || page}」は本体アプリで開きます`);
  });
});

// 中央Pロゴタップ
const tabPLogo = document.getElementById('tab-p-logo');
if (tabPLogo) {
  tabPLogo.addEventListener('click', () => {
    showToast('注目ページは開発中です');
  });
  tabPLogo.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      tabPLogo.click();
    }
  });
}


/* ================================================================
   § 10 検索バー・ソートタブ イベント接続
   ================================================================ */

// 検索バー入力
const searchInput = document.getElementById('search-input');
if (searchInput) {
  let searchTimer = null;
  searchInput.addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = e.target.value;
      applyFiltersAndRender();
    }, 220); // デバウンス
  });
}

// ソートタブ
document.getElementById('sort-tabs')?.querySelectorAll('.s-sort-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.s-sort-tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    currentSort = tab.dataset.sort;
    applyFiltersAndRender();
  });
});

// フィルターボタン（詳細フィルター）— STEP2でFBSを開く
document.getElementById('btn-filter')?.addEventListener('click', () => {
  showToast('詳細フィルターはSTEP2で実装予定です');
});


/* ================================================================
   § 11 初期化
   ================================================================ */

function init() {
  renderCategoryChips();
  renderConditionFilters();
  renderQuickCards();
  applyFiltersAndRender(); // 初期リスト描画
}

// DOMContentLoaded後に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
