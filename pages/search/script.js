
/* ================================================================
   STEP106: Stable base prefix
   旧STEPの後追い描画ハンドラを止め、STEP106だけに集約
   ================================================================ */
(function(){
  if (window.__PNX_STEP106_STABLE_BASE_PREFIX__) return;
  window.__PNX_STEP106_STABLE_BASE_PREFIX__ = true;

  window.__PNX_STEP84_CMS_SEARCH_POLISH__ = true;
  window.__PNX_STEP85_SEARCH_HARD_READER__ = true;
  window.__PNX_STEP87_SEARCH_IFRAME_RENDER_FIX__ = true;
  window.__PNX_STEP89_OFFICIAL_LIST_HOOKS__ = true;
  window.__PNX_STEP90_FORCE_CMS_OFFICIAL_LIST__ = true;
  window.__PNX_STEP92_CLEAN_CMS_OFFICIAL__ = true;
  window.__PNX_STEP93_STABLE_CMS_RENDERER__ = true;
  window.__PNX_STEP94_OLD_CMS_DECORATION_KILLER__ = true;
  window.__PNX_STEP95_STABLE_CARD_RENDERER__ = true;
  window.__PNX_STEP98_STABLE_CARD_RENDERER__ = true;
  window.__PNX_STEP99_STABLE_SEARCH_RENDERER__ = true;
  window.__PNX_STEP100_STABLE_MESSAGE_HANDLER__ = true;
  window.__PNX_STEP101_STABLE_HANDLER__ = true;
  window.__PNX_STEP103_STABLE_HANDLER__ = true;
})();


/* ================================================================
   STEP103: suppress repeated restore-state console logs
   状態復元ログはデバッグ用なので、画面切替時に増え続けないよう抑制
   ================================================================ */
(function(){
  if (window.__PNX_STEP103_RESTORE_LOG_FILTER__) return;
  window.__PNX_STEP103_RESTORE_LOG_FILTER__ = true;

  const originalLog = console.log;
  const originalInfo = console.info;

  function shouldSuppress(args){
    try {
      const text = Array.from(args).map(v => String(v)).join(" ");
      return text.includes("[ProNexaX]") && text.includes("状態を復元");
    } catch(e) {
      return false;
    }
  }

  console.log = function(){
    if (shouldSuppress(arguments)) return;
    return originalLog.apply(console, arguments);
  };

  console.info = function(){
    if (shouldSuppress(arguments)) return;
    return originalInfo.apply(console, arguments);
  };
})();


/* ================================================================
   STEP101: Single iframe / single init guard
   iframe多重起動・init多重実行・後追い再描画を抑制
   ================================================================ */
(function(){
  if (window.__PNX_STEP101_SINGLE_INIT_PREFIX__) return;
  window.__PNX_STEP101_SINGLE_INIT_PREFIX__ = true;

  window.__PNX_STEP99_STABLE_SEARCH_RENDERER__ = true;
  window.__PNX_STEP98_STABLE_CARD_RENDERER__ = true;
  window.__PNX_STEP95_STABLE_CARD_RENDERER__ = true;
  window.__PNX_STEP100_STABLE_MESSAGE_HANDLER__ = true;
})();


/* ================================================================
   STEP100: Disable legacy/post-render CMS renderers
   初回描画後のパチパチを止めるため、CMSは init() 前に合流させる
   ================================================================ */
(function(){
  window.__PNX_STEP99_STABLE_SEARCH_RENDERER__ = true;
  window.__PNX_STEP98_STABLE_CARD_RENDERER__ = true;
  window.__PNX_STEP95_STABLE_CARD_RENDERER__ = true;
})();


/* ================================================================
   STEP95: Disable old repeated CMS auto-render hooks
   STEP87〜94の自動再描画を止め、STEP95の1回同期だけに統一
   ================================================================ */
(function(){
  window.__PNX_STEP84_CMS_SEARCH_POLISH__ = true;
  window.__PNX_STEP85_SEARCH_HARD_READER__ = true;
  window.__PNX_STEP87_SEARCH_IFRAME_RENDER_FIX__ = true;
  window.__PNX_STEP89_OFFICIAL_LIST_HOOKS__ = true;
  window.__PNX_STEP90_FORCE_CMS_OFFICIAL_LIST__ = true;
  window.__PNX_STEP91_SEARCH_ALERT_DIAG__ = true;
  window.__PNX_STEP92_CLEAN_CMS_OFFICIAL__ = true;
  window.__PNX_STEP93_STABLE_CMS_RENDERER__ = true;
  window.__PNX_STEP94_OLD_CMS_DECORATION_KILLER__ = true;
})();

/**
 * ProNexaX — pages/search/script.js
 * 試合検索ページ（STEP1: ダミーデータ + localStorage 仮保存）
 *
 * ─────────────────────────────────────────────────────────────────
 * 【ファイル構成】
 *  § DATA    ダミーデータ定義（STEP2: Firestore/API に差し替え）
 *  § STATE   アプリ状態管理（APP_STATE + アクセサー / ミューテーター）
 *  § STORAGE localStorage 仮保存（STEP2: Firestore 接続時に移行）
 *  § 2  カテゴリチップ描画
 *  § 3  条件フィルター描画
 *  § 4  クイックアクセスカード描画
 *  § 5  大会カード描画（tournamentCardHTML / renderTournamentList）
 *  § 6  フィルタリング・ソートロジック（applyFiltersAndRender）
 *  § 7  Bottom Sheet 開閉制御（openBottomSheet / closeBottomSheet）
 *  § 8  Bottom Sheet コンテンツ描画（renderBottomSheetContent）
 *  § 8.5 カレンダー追加・お気に入り操作（handleCalendarAdd / toggleFav）
 *  § 9  開催地フィルター Bottom Sheet
 *  § 10 検索バー・ソートタブ イベント接続
 *  § 11 初期化（init）
 *
 * ─────────────────────────────────────────────────────────────────
 * 【本体統合時に使う主要関数一覧】
 *  init()                    ページ初期化（localStorage 復元 → 全描画）
 *  renderTournamentList(arr) 大会カードリスト描画
 *  applyFiltersAndRender()   フィルター適用 + リスト再描画
 *  openBottomSheet(id)       大会詳細 BS を開く
 *  closeBottomSheet()        大会詳細 BS を閉じる
 *  handleCalendarAdd(id)     カレンダー追加（カード↔BS 双方向同期）
 *  toggleFav(id)             お気に入りトグル（カード↔BS 双方向同期）
 *  setFavorited(id, bool)    お気に入り状態を設定（STEP2: Firestore write）
 *  setAdded(id)              カレンダー追加状態を設定（STEP2: Firestore write）
 *  getStateSnapshot()        現在の状態スナップショット取得
 *  clearSearchState()        状態を完全リセット（デバッグ用）
 *
 * 【コンソールから使えるデバッグコマンド】
 *  getStateSnapshot()        → 現在の APP_STATE をオブジェクトで返す
 *  clearSearchState()        → 状態・localStorage を全リセットして再描画
 *
 * ─────────────────────────────────────────────────────────────────
 * 【STEP2 移行時の注意】
 *  - "STEP2:" コメントが付いた箇所が Firestore/API 接続ポイント
 *  - DUMMY_TOURNAMENTS → Firestore コレクション "tournaments" に差し替え
 *  - saveStateToLocalStorage / loadStateFromLocalStorage → Firestore 読み書きへ移行
 *  - タブバーのページ遷移 → 本体ルーター / Capacitor navigation に差し替え
 */

'use strict';

/* ================================================================
   STEP99: Disable legacy CMS auto-sync/render blocks
   古い自動同期を止め、STEP99の1回描画だけに統一
   ================================================================ */
(function(){
  window.__PNX_CMS_TO_SEARCH_BRIDGE__ = true;
  window.__PNX_SEARCH_REFRESH_MESSAGE_LISTENER__ = true;
  window.__PNX_STEP16_SEARCH_MARKER__ = true;
  window.__PNX_STEP64_CMS_BULK_TO_SEARCH__ = true;
  window.__PNX_STEP65_HIDE_DRAFT_TOURNAMENTS__ = true;
  window.__PNX_STEP67_HIDE_INVALID_PUBLIC__ = true;
  window.__PNX_STEP68_SEARCH_SYNC_STABILITY__ = true;
  window.__PNX_STEP84_CMS_SEARCH_POLISH__ = true;
  window.__PNX_STEP85_SEARCH_HARD_READER__ = true;
  window.__PNX_STEP86_SEARCH_ALERT_DIAG__ = true;
  window.__PNX_STEP87_SEARCH_IFRAME_RENDER_FIX__ = true;
  window.__PNX_STEP89_OFFICIAL_LIST_HOOKS__ = true;
  window.__PNX_STEP90_FORCE_CMS_OFFICIAL_LIST__ = true;
  window.__PNX_STEP91_SEARCH_ALERT_DIAG__ = true;
  window.__PNX_STEP92_CLEAN_CMS_OFFICIAL__ = true;
  window.__PNX_STEP93_STABLE_CMS_RENDERER__ = true;
  window.__PNX_STEP94_OLD_CMS_DECORATION_KILLER__ = true;
  window.__PNX_STEP95_STABLE_CARD_RENDERER__ = true;
  window.__PNX_STEP98_STABLE_CARD_RENDERER__ = true;
})();


/* ================================================================
   § DATA  ダミーデータ定義
   ─ STEP2: Firestore コレクション "tournaments" のドキュメント構造に合わせて
     DUMMY_TOURNAMENTS を差し替える。フィールド名は本体 TOURNAMENTS_FLAT と統一。
   ================================================================ */

/**
 * 大会ダミーデータ（5件）
 *
 * 各フィールドの説明:
 *  id              大会ID（Firestore doc ID に合わせる）
 *  cat             カテゴリ: jgto / lpga / qt / mini / open / student / abroad
 *  gender          mens / womens
 *  region          domestic / overseas
 *  area            地方キー（AREA_REGIONS.key と対応）
 *  status          open（募集中）/ near（締切間近）/ closed（締切済）/ live（開催中）
 *  addedToCalendar UI 一時状態（STEP2: Firestore から読み込む）
 *  favorited       UI 一時状態（STEP2: Firestore から読み込む）
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
    organizerLogoUrl: null,
    tournamentLogoUrl: null,
    venueImageUrl: null,
    imageAlt: 'JGTO 日本ゴルフツアー選手権 宍戸ヒルズCC',
    tags: ['メジャー', 'JGTOポイント'],
    addedToCalendar: false,
    favorited: false,
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
    organizerLogoUrl: null,
    tournamentLogoUrl: null,
    venueImageUrl: null,
    imageAlt: '関東オープンゴルフ選手権競技 我孫子GC',
    tags: ['関東', '競技'],
    addedToCalendar: false,
    favorited: false,
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
    organizerLogoUrl: null,
    tournamentLogoUrl: null,
    venueImageUrl: null,
    imageAlt: 'JLPGA ニッポンハムレディスクラシック 北広島クラブ',
    tags: ['女子ツアー', 'メディア放映'],
    addedToCalendar: false,
    favorited: false,
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
    organizerLogoUrl: null,
    tournamentLogoUrl: null,
    venueImageUrl: null,
    imageAlt: 'JGTO QTファイナル 中部クラシックCC',
    tags: ['QT', 'シード権'],
    addedToCalendar: false,
    favorited: false,
  },
  {
    id: 'mini-2025-001',
    name: 'Future Tour 第3戦 関東大会',
    cat: 'other',
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
    organizerLogoUrl: null,
    tournamentLogoUrl: null,
    venueImageUrl: null,
    imageAlt: 'Future Tour 第3戦 川崎国際生田緑地GC',
    tags: ['ミニツアー', '初参加歓迎'],
    addedToCalendar: false,
    favorited: false,
  },
];

/* ================================================================
   § STATE  アプリ状態管理オブジェクト
   ─ 散在していた let 変数をここに集約。状態の読み書きは必ず
     アクセサー / ミューテーター関数を通して行う。
   ─ STEP2: Firestore 接続時は、ミューテーター内の "STEP2:" コメント
     箇所に Firestore への書き込みを追加するだけでよい。
   ================================================================ */

/**
 * アプリ全体の状態オブジェクト（シングルトン）
 *
 * ─ フィルター / 検索 ─────────────────────────────────────────────
 *   selectedCategory  : カテゴリチップの選択値（'all' / 'jgto' / ...）
 *   activeFilters     : 条件フィルターの Set（'fav' / 'near' / 'area' / ...）
 *   selectedArea      : 開催地フィルターの確定値（AREA_REGIONS.key）
 *   searchQuery       : 検索ボックスの入力文字列
 *   sortKey           : ソート種別（'recommend' / 'date' / 'deadline' / 'new'）
 *
 * ─ UI 表示状態（localStorage には保存しない） ──────────────────────
 *   selectedTournamentId : BS に表示中の大会ID（閉じたら null に戻す）
 *   bsOpen               : 大会詳細 BS の開閉フラグ
 *   areaSheetOpen        : 開催地 BS の開閉フラグ
 *
 * ─ 永続化対象（localStorage / STEP2: Firestore） ───────────────────
 *   favorites        : お気に入り登録済み大会IDの Set
 *   addedToCalendar  : カレンダー追加済み大会IDの Set
 */
const APP_STATE = {
  selectedCategory:     'all',
  selectedGender:       'all',        // 'all' / 'mens' / 'womens'（STEP8）
  activeFilters:        new Set(),
  selectedArea:         'all',
  searchQuery:          '',
  sortKey:              'recommend',

  selectedTournamentId: null,
  bsOpen:               false,
  areaSheetOpen:        false,

  favorites:            new Set(),
  addedToCalendar:      new Set(),
  favCategories:        new Set(),   // お気に入りカテゴリ key の Set（STEP7）
  extraCategories:      new Set(),   // ＋ボタンでチップ欄に追加したカテゴリ key の Set

  // ── 詳細フィルター（localStorage / STEP2: Firestore で永続化）──
  detailFilters: {
    areas:       new Set(),   // multi: kanto/kinki/chubu/kyushu/hokkaido/overseas
    categories:  new Set(),   // multi: qt/mini/open/student/abroad
    gender:      '',           // single: ''/'mens'/'womens'/'mixed'
    statuses:    new Set(),   // multi: open/near/closed/live
    timing:      '',           // single: ''/'thisweek'/'nextmonth'/'3months'
    prizeMin:    '',           // single: ''/'none'/'100'/'300'/'500'/'1000'（万円）
    entryFeeMax: '',           // single: ''/'10000'/'20000'/'30000'/'50000'（円）
  },
};


/* ── STATE アクセサー（読み取り専用）────────────────────────────── */

/** @param {string} id - 大会ID  @returns {boolean} お気に入り登録済みか */
function isFavorited(id) {
  return APP_STATE.favorites.has(id);
}

/** @param {string} id - 大会ID  @returns {boolean} カレンダー追加済みか */
function isAdded(id) {
  return APP_STATE.addedToCalendar.has(id);
}

/** Bottom Sheet に表示中の大会オブジェクトを返す（未選択なら null） */
function getSelectedTournament() {
  return DUMMY_TOURNAMENTS.find(t => t.id === APP_STATE.selectedTournamentId) || null;
}


/* ── STATE ミューテーター（書き込み）────────────────────────────── */

/**
 * お気に入り状態を更新する
 * ─ APP_STATE.favorites と DUMMY_TOURNAMENTS[].favorited を同時に更新。
 * ─ 変更後は localStorage に自動保存する。
 *
 * STEP2: Firestore にお気に入り状態を保存
 *   db.collection('users').doc(userId)
 *     .collection('favorites').doc(id).set({ active: value })
 *
 * @param {string}  id    - 大会ID
 * @param {boolean} value - true: 登録 / false: 解除
 */
function setFavorited(id, value) {
  value ? APP_STATE.favorites.add(id) : APP_STATE.favorites.delete(id);
  const t = DUMMY_TOURNAMENTS.find(x => x.id === id);
  if (t) t.favorited = !!value;
  saveStateToLocalStorage();
}

/** カテゴリがお気に入り登録済みか @param {string} key @returns {boolean} */
function isCatFavorited(key) {
  return APP_STATE.favCategories.has(key);
}

/**
 * カテゴリお気に入りをトグルする（STEP7/STEP9）
 * ─ APP_STATE.favCategories を更新 → localStorage 保存。
 * ─ カードグリッドバッジ・BS ヒーローボタン・カテゴリチップ ♡ を部分更新。
 * ─ お気に入りフィルター中の場合はリスト再描画も実施。
 *
 * @param {string}  key    カテゴリキー
 * @param {boolean} silent true の場合はトースト非表示（チップからの操作用）
 */
function toggleCatFav(key, silent = false) {
  const wasActive = isCatFavorited(key);
  wasActive ? APP_STATE.favCategories.delete(key) : APP_STATE.favCategories.add(key);
  saveStateToLocalStorage();
  const isNow = isCatFavorited(key);

  // ── カテゴリBSのヒーローハートボタン更新（開いていれば）──
  const heroFavBtn = document.getElementById('cat-hero-fav-btn');
  if (heroFavBtn && heroFavBtn.dataset.cat === key) {
    heroFavBtn.classList.toggle('active', isNow);
    heroFavBtn.setAttribute('aria-label', isNow ? 'お気に入り解除' : 'お気に入り登録');
    const svg = heroFavBtn.querySelector('svg');
    if (svg) svg.setAttribute('fill', isNow ? 'currentColor' : 'none');
    heroFavBtn.classList.remove('cat-fav-pop');
    void heroFavBtn.offsetWidth;
    if (isNow) heroFavBtn.classList.add('cat-fav-pop');
  }

  // ── カテゴリチップの ♡ 部分更新（BSヒーローから呼ばれた場合）──
  const chipFav = document.querySelector(`.s-chip-fav[data-cat="${key}"]`);
  if (chipFav) {
    chipFav.textContent = isNow ? '♥' : '♡';
    chipFav.classList.toggle('active', isNow);
    chipFav.setAttribute('aria-label', isNow ? 'お気に入り解除' : 'お気に入り登録');
  }

  // ── お気に入りフィルター中ならリスト再描画 ──
  if (wasActive && APP_STATE.activeFilters.has('fav')) {
    applyFiltersAndRender();
  }

  const label = catBrandConfig(key).sub || catBrandConfig(key).label;
  console.log(`[ProNexaX] ${isNow ? '💚' : '🤍'} カテゴリお気に入り${isNow ? '登録' : '解除'}: ${label}`);
  if (!silent) {
    showToast(isNow ? `「${label}」をお気に入りに追加しました` : `「${label}」のお気に入りを解除しました`);
  }
}

/**
 * カレンダー追加状態を更新する（追加のみ、取り消し不可）
 * ─ APP_STATE.addedToCalendar と DUMMY_TOURNAMENTS[].addedToCalendar を更新。
 * ─ 変更後は localStorage に自動保存する。
 *
 * STEP2: Firestore にカレンダー追加状態を保存
 *   db.collection('users').doc(userId)
 *     .collection('calendar').doc(id).set({ added: true, addedAt: serverTimestamp() })
 *
 * @param {string} id - 大会ID
 */
function setAdded(id) {
  APP_STATE.addedToCalendar.add(id);
  const t = DUMMY_TOURNAMENTS.find(x => x.id === id);
  if (t) t.addedToCalendar = true;
  saveStateToLocalStorage();
}

/**
 * 現在の APP_STATE を純粋なオブジェクト（Set → Array 変換済み）で返す
 * ─ デバッグ用: コンソールで `getStateSnapshot()` と呼ぶ
 * ─ STEP2: Firestore 初期書き込み時のペイロードとして利用可能
 */
function getStateSnapshot() {
  const df = APP_STATE.detailFilters;
  return {
    selectedCategory:     APP_STATE.selectedCategory,
    activeFilters:        [...APP_STATE.activeFilters],
    selectedArea:         APP_STATE.selectedArea,
    searchQuery:          APP_STATE.searchQuery,
    sortKey:              APP_STATE.sortKey,
    selectedTournamentId: APP_STATE.selectedTournamentId,
    favorites:            [...APP_STATE.favorites],
    addedToCalendar:      [...APP_STATE.addedToCalendar],
    detailFilters: {
      areas:       [...df.areas],
      categories:  [...df.categories],
      gender:      df.gender,
      statuses:    [...df.statuses],
      timing:      df.timing,
      prizeMin:    df.prizeMin,
      entryFeeMax: df.entryFeeMax,
    },
  };
}


/* ================================================================
   § STORAGE  localStorage 仮保存（STEP2: Firestore 接続前の動作確認用）
   ─ 保存対象: favorites / addedToCalendar / selectedCategory /
               activeFilters / selectedArea / searchQuery
   ─ 非保存 : sortKey / bsOpen / areaSheetOpen / selectedTournamentId
              （UI 一時状態なのでページ遷移ごとにリセットしてよい）
   ─ Set 型は JSON.stringify 不可のため、保存時は Array に変換する。
   ─ STEP2: この節の3関数を Firestore の読み書きに置き換える。
   ================================================================ */

/** localStorage のキー（バージョンアップ時は末尾の番号を上げる） */
const STORAGE_KEY = 'pronexax_search_state_v1';

/**
 * APP_STATE を localStorage に保存する
 * ─ setFavorited / setAdded / applyFiltersAndRender から自動で呼ばれる。
 * ─ プライベートブラウズなど localStorage が使えない環境でも動作を継続。
 *
 * STEP2: Firestore への書き込みに移行する場合はこの関数を削除し、
 *   各ミューテーター内の STEP2 コメントに Firestore write を記述する。
 */
function saveStateToLocalStorage() {
  try {
    const df = APP_STATE.detailFilters;
    const data = {
      favorites:        Array.from(APP_STATE.favorites),
      addedToCalendar:  Array.from(APP_STATE.addedToCalendar),
      favCategories:    Array.from(APP_STATE.favCategories),
      extraCategories:  Array.from(APP_STATE.extraCategories),
      selectedCategory: APP_STATE.selectedCategory,
      selectedGender:   APP_STATE.selectedGender,
      activeFilters:    Array.from(APP_STATE.activeFilters),
      selectedArea:     APP_STATE.selectedArea,
      searchQuery:      APP_STATE.searchQuery,
      detailFilters: {
        areas:       Array.from(df.areas),
        categories:  Array.from(df.categories),
        gender:      df.gender,
        statuses:    Array.from(df.statuses),
        timing:      df.timing,
        prizeMin:    df.prizeMin,
        entryFeeMax: df.entryFeeMax,
      },
      _savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[ProNexaX] localStorage 保存失敗:', e);
  }
}

/**
 * localStorage から APP_STATE を復元する
 * ─ init() の冒頭で呼ばれる。
 * ─ Array → Set に変換して APP_STATE に反映。
 * ─ DUMMY_TOURNAMENTS の favorited / addedToCalendar も同期
 *   （UI 描画が t.favorited を直接参照するため）。
 *
 * STEP2: Firestore から保存済み状態を復元する場合は下記に差し替え:
 *   const snap = await db.collection('users').doc(userId).get();
 *   const data = snap.data();
 *   APP_STATE.favorites       = new Set(data.favorites      || []);
 *   APP_STATE.addedToCalendar = new Set(data.addedToCalendar|| []);
 *   // ... 以降同様
 *
 * @returns {boolean} 保存データが見つかり復元できた場合 true
 */
function loadStateFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const saved = JSON.parse(raw);

    // Set に変換して APP_STATE に反映
    APP_STATE.favorites        = new Set(saved.favorites        || []);
    APP_STATE.addedToCalendar  = new Set(saved.addedToCalendar  || []);
    APP_STATE.favCategories    = new Set(saved.favCategories    || []);
    // mini は廃止 → other に移行（localStorage 互換）
    const savedExtra = (saved.extraCategories || []).map(k => k === 'mini' ? 'other' : k);
    APP_STATE.extraCategories  = new Set(savedExtra);
    // selectedCategory が mini だった場合も移行
    APP_STATE.selectedCategory = (saved.selectedCategory === 'mini' ? 'other' : saved.selectedCategory) || 'all';
    APP_STATE.selectedGender   = saved.selectedGender           || 'all';
    APP_STATE.activeFilters    = new Set(saved.activeFilters   || []);
    APP_STATE.selectedArea     = saved.selectedArea            || 'all';
    APP_STATE.searchQuery      = saved.searchQuery             || '';

    // 詳細フィルターを復元
    const savedDf = saved.detailFilters || {};
    APP_STATE.detailFilters = {
      areas:       new Set(savedDf.areas      || []),
      categories:  new Set(savedDf.categories || []),
      gender:      savedDf.gender             || '',
      statuses:    new Set(savedDf.statuses   || []),
      timing:      savedDf.timing             || '',
      prizeMin:    savedDf.prizeMin           || '',
      entryFeeMax: savedDf.entryFeeMax        || '',
    };

    // DUMMY_TOURNAMENTS のデータフィールドにも同期
    // （UI レンダリングが t.favorited / t.addedToCalendar を直接参照するため）
    DUMMY_TOURNAMENTS.forEach(t => {
      t.favorited       = APP_STATE.favorites.has(t.id);
      t.addedToCalendar = APP_STATE.addedToCalendar.has(t.id);
    });
      // STEP103: restore-state log suppressed to avoid console noise.
return true;
  } catch (e) {
    console.warn('[ProNexaX] localStorage 復元失敗:', e);
    return false;
  }
}

/**
 * アプリ状態を完全リセットする（デバッグ用）
 * ─ localStorage を削除し、APP_STATE と DUMMY_TOURNAMENTS を初期値に戻す。
 * ─ ブラウザコンソールから `clearSearchState()` で呼び出せる。
 *
 * STEP2: Firestore のユーザーデータも合わせて削除する場合は
 *   db.collection('users').doc(userId).delete() などを追加する。
 */
function clearSearchState() {
  localStorage.removeItem(STORAGE_KEY);

  APP_STATE.favorites        = new Set();
  APP_STATE.addedToCalendar  = new Set();
  APP_STATE.extraCategories  = new Set();
  APP_STATE.selectedCategory = 'all';
  APP_STATE.selectedGender   = 'all';
  APP_STATE.activeFilters    = new Set();
  APP_STATE.selectedArea     = 'all';
  APP_STATE.searchQuery      = '';
  APP_STATE.sortKey          = 'recommend';

  APP_STATE.detailFilters = {
    areas: new Set(), categories: new Set(), gender: '',
    statuses: new Set(), timing: '', prizeMin: '', entryFeeMax: '',
  };

  DUMMY_TOURNAMENTS.forEach(t => {
    t.favorited       = false;
    t.addedToCalendar = false;
  });

  const si = document.getElementById('search-input');
  if (si) si.value = '';

  console.log('[ProNexaX] 🗑️ 状態をリセットしました');
  init();
}

/*
 * デバッグ用グローバル公開
 * ─ コンソールから直接呼べるように window に登録する。
 * ─ 本番ビルドでは除去してもよい。
 */
window.getStateSnapshot = getStateSnapshot;
window.clearSearchState = clearSearchState;


/* ================================================================
   § DETAIL_FILTER  詳細フィルター定義データ
   ================================================================ */

/**
 * 詳細フィルターセクション定義
 * multi: true  → 複数選択可（Set で管理）
 * multi: false → 単一選択（string で管理 / 再タップで解除）
 */
const DF_SECTIONS = [
  {
    key: 'areas', label: '開催地域', multi: true,
    chips: [
      { key: 'kanto',    label: '関東'   },
      { key: 'kinki',    label: '関西'   },
      { key: 'chubu',    label: '中部'   },
      { key: 'kyushu',   label: '九州'   },
      { key: 'hokkaido', label: '北海道' },
      { key: 'overseas', label: '海外'   },
    ],
  },
  {
    key: 'categories', label: 'カテゴリ', multi: true,
    chips: [
      { key: 'qt',      label: 'QT'        },
      { key: 'open',    label: '県オープン' },
      { key: 'student', label: '学生'       },
      { key: 'abroad',  label: '海外ツアー' },
      { key: 'asian',   label: 'Asian Tour' },
      { key: 'pga',     label: 'PGA TOUR'  },
      { key: 'other',   label: 'その他'    },
    ],
  },
  {
    key: 'gender', label: '性別', multi: false,
    chips: [
      { key: 'mens',   label: '男子' },
      { key: 'womens', label: '女子' },
      { key: 'mixed',  label: '共通' },
    ],
  },
  {
    key: 'statuses', label: '募集状況', multi: true,
    chips: [
      { key: 'open',   label: '募集中'   },
      { key: 'near',   label: '締切間近' },
      { key: 'closed', label: '締切済'   },
      { key: 'live',   label: '開催中'   },
    ],
  },
  {
    key: 'timing', label: '開催時期', multi: false,
    chips: [
      { key: 'thisweek',  label: '今週'     },
      { key: 'nextmonth', label: '来月'     },
      { key: '3months',   label: '3ヶ月以内' },
    ],
  },
  {
    key: 'prizeMin', label: '賞金額（最低）', multi: false,
    chips: [
      { key: 'none', label: '賞金なし'   },
      { key: '100',  label: '100万以上'  },
      { key: '300',  label: '300万以上'  },
      { key: '500',  label: '500万以上'  },
      { key: '1000', label: '1000万以上' },
    ],
  },
  {
    key: 'entryFeeMax', label: 'エントリー費（上限）', multi: false,
    chips: [
      { key: '10000', label: '1万円以下' },
      { key: '20000', label: '2万円以下' },
      { key: '30000', label: '3万円以下' },
      { key: '50000', label: '5万円以下' },
    ],
  },
];

/**
 * 開催地域キー → 大会 area/prefecture フィールドのマッピング
 * ─ AREA_REGIONS と重複するが詳細フィルター専用として独立管理
 */
const DF_AREA_KEYS = {
  kanto:    ['kanto','tokyo','kanagawa','saitama','chiba','ibaraki','tochigi','gunma'],
  kinki:    ['kinki','osaka','kyoto','hyogo','nara','shiga','wakayama'],
  chubu:    ['tokai','chubu','niigata','toyama','ishikawa','fukui','nagano','yamanashi','shizuoka','aichi','gifu','mie'],
  kyushu:   ['kyushu','fukuoka','saga','nagasaki','kumamoto','oita','miyazaki','kagoshima','okinawa'],
  hokkaido: ['hokkaido'],
  // 'overseas' は t.region === 'overseas' で判定
};

/**
 * 賞金文字列を円に変換（例: "2億円" → 200000000, "500万円" → 5000000）
 */
function parsePrizeAmount(str) {
  if (!str || str === '—') return 0;
  str = str.replace(/[,\s]/g, '');
  let total = 0;
  const okuM = str.match(/(\d+(?:\.\d+)?)億/);
  if (okuM) total += parseFloat(okuM[1]) * 100_000_000;
  const manM = str.match(/(\d+(?:\.\d+)?)万/);
  if (manM) total += parseFloat(manM[1]) * 10_000;
  if (!okuM && !manM) {
    const enM = str.match(/^(\d+)/);
    if (enM) total = parseInt(enM[1]);
  }
  return total;
}

/**
 * エントリー費文字列を円に変換（例: "50,000円" → 50000）
 */
function parseEntryFeeAmount(str) {
  if (!str) return 0;
  const m = str.replace(/[,\s]/g, '').match(/(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

/**
 * 詳細フィルターのアクティブ条件数を返す
 */
function getDetailFilterCount() {
  const df = APP_STATE.detailFilters;
  return (
    df.areas.size +
    df.categories.size +
    (df.gender      ? 1 : 0) +
    df.statuses.size +
    (df.timing      ? 1 : 0) +
    (df.prizeMin    ? 1 : 0) +
    (df.entryFeeMax ? 1 : 0)
  );
}

/**
 * 検索バーのフィルターボタンバッジを更新する
 * ─ 詳細フィルターが 1件以上あれば数値バッジを表示。
 */
function updateFilterBadge() {
  const badge = document.getElementById('df-filter-badge');
  if (!badge) return;
  const cnt = getDetailFilterCount();
  if (cnt > 0) {
    badge.textContent = cnt;
    badge.classList.add('visible');
  } else {
    badge.textContent = '';
    badge.classList.remove('visible');
  }
}


/**
 * 性別定義（STEP8）— "大会対象" を示す短いラベル
 */
const GENDERS = [
  { key: 'all',    label: '全て' },
  { key: 'mens',   label: '男子' },
  { key: 'womens', label: '女子' },
];

/**
 * カテゴリチップ定義（STEP9: 3主要カテゴリ + ＋ボタン方式）
 * all 以外のチップには ♡ お気に入りアイコンを表示する
 */
const CATEGORIES = [
  { key: 'all',   label: '全カテゴリ' },
  { key: 'jgto',  label: 'JGTO'  },
  { key: 'lpga',  label: 'JLPGA' },
  { key: 'qt',    label: 'QT'    },
];

/**
 * ＋ボタンから追加できる「追加カテゴリ」定義
 * ─ 固定チップ（JGTO/JLPGA/QT）は含まない
 * ─ 選択するとチップ欄に動的追加される
 */
const CATEGORY_EXTRA = [
  { key: 'open',    label: '県オープン',  sub: 'オープン競技',    icon: '⛳' },
  { key: 'student', label: '学生',        sub: '学生競技',        icon: '🎓' },
  { key: 'abroad',  label: '海外',        sub: '海外ツアー',      icon: '✈️' },
  { key: 'asian',   label: 'Asian Tour',  sub: 'アジアツアー',    icon: '🌏' },
  { key: 'pga',     label: 'PGA TOUR',    sub: 'PGAツアー',       icon: '🇺🇸' },
  { key: 'other',   label: 'その他',      sub: 'その他の大会',    icon: '📋' },
];

/**
 * 条件フィルター定義
 * ─ 'fav'（お気に入りカテゴリ）は独立カードUIへ分離（STEP10）
 */
const CONDITIONS = [
  { key: 'recruiting', label: '募集中のみ',    icon: null },
  { key: 'near',       label: '締切間近',      icon: null },
  { key: 'thisweek',   label: '今週開催',      icon: null },
  { key: 'nextmonth',  label: '来月開催',      icon: null },
  { key: 'area',       label: '開催地',        icon: '📍' },
  { key: 'reset',      label: 'リセット',      icon: '↺', isReset: true },
];

/**
 * クイックアクセスカード定義
 */
// SVG 線画アイコン（iOS SF Symbols 風 / stroke-based）
const _QC_ICONS = {
  // 締切間近: 時計
  near: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>`,
  // 今週開催: 旗
  thisweek: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  // 来月開催: カレンダー
  nextmonth: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  // 人気大会: 星
  popular: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  // 遠征おすすめ: 飛行機
  travel: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
};

const QUICK_CARDS = [
  { key: 'near',      label: '締切間近',    icon: _QC_ICONS.near,      count: 7,  colorClass: 'qc-red'    },
  { key: 'thisweek',  label: '今週開催',    icon: _QC_ICONS.thisweek,  count: 5,  colorClass: 'qc-amber'  },
  { key: 'nextmonth', label: '来月開催',    icon: _QC_ICONS.nextmonth, count: 12, colorClass: 'qc-blue'   },
  { key: 'popular',   label: '人気大会',    icon: _QC_ICONS.popular,   count: 10, colorClass: 'qc-green'  },
  { key: 'travel',    label: '遠征おすすめ', icon: _QC_ICONS.travel,    count: 8,  colorClass: 'qc-purple' },
];


/* ================================================================
   § 2  性別セグメント描画（STEP8）
   ─ APP_STATE.selectedGender を読み書きする。
   ─ 全て / 男子ツアー / 女子ツアー の3択セグメントコントロール。
   ================================================================ */

function renderGenderSegment() {
  const container = document.getElementById('gender-segment');
  if (!container) return;

  container.innerHTML = GENDERS.map(g => `
    <button
      class="s-gender-btn${g.key === APP_STATE.selectedGender ? ' active' : ''}"
      data-gender="${g.key}"
      aria-pressed="${g.key === APP_STATE.selectedGender}"
    >${g.label}</button>
  `).join('');

  container.querySelectorAll('.s-gender-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      APP_STATE.selectedGender = btn.dataset.gender;
      renderGenderSegment();
      applyFiltersAndRender();
    });
  });
}


/* ================================================================
   § 2b カテゴリチップ描画（STEP8: 非スクロール・ラップ方式）
   ─ 主要5カテゴリ + ＋ボタン（詳細フィルター開く）。
   ─ 横スクロールなし。flex-wrap で折り返す。
   ─ 同じチップを再タップすると 'all' に戻る（トグル解除）。
   ================================================================ */

function renderCategoryChips() {
  const container = document.getElementById('category-chips');
  if (!container) return;

  // 各カテゴリチップを生成（'all' 以外は ♡ アイコン付き）
  const chipsHTML = CATEGORIES.map(cat => {
    const isActive = cat.key === APP_STATE.selectedCategory;
    if (cat.key === 'all') {
      return `<button
        class="s-chip${isActive ? ' active' : ''}"
        data-cat="${cat.key}"
        aria-pressed="${isActive}"
      >${cat.label}</button>`;
    }
    const isFav = isCatFavorited(cat.key);
    return `<button
      class="s-chip s-chip-has-fav${isActive ? ' active' : ''}"
      data-cat="${cat.key}"
      aria-pressed="${isActive}"
    >${cat.label}<span
        class="s-chip-fav${isFav ? ' active' : ''}"
        data-cat="${cat.key}"
        role="button"
        tabindex="0"
        aria-label="${isFav ? 'お気に入り解除' : 'お気に入り登録'}"
      >${isFav ? '♥' : '♡'}</span></button>`;
  }).join('');

  // 追加カテゴリチップ（extraCategories に登録済みのもの）
  const extraHTML = [...APP_STATE.extraCategories].map(key => {
    const catDef  = CATEGORY_EXTRA.find(c => c.key === key);
    if (!catDef) return '';
    const isActive = key === APP_STATE.selectedCategory;
    const isFav    = isCatFavorited(key);
    return `<button
      class="s-chip s-chip-has-fav${isActive ? ' active' : ''}"
      data-cat="${key}"
      aria-pressed="${isActive}"
    >${catDef.label}<span
        class="s-chip-fav${isFav ? ' active' : ''}"
        data-cat="${key}"
        role="button" tabindex="0"
        aria-label="${isFav ? 'お気に入り解除' : 'お気に入り登録'}"
      >${isFav ? '♥' : '♡'}</span></button>`;
  }).join('');

  const plusHTML = `<button class="s-chip s-chip-plus" id="chip-plus" aria-label="カテゴリを追加">＋</button>`;

  container.innerHTML = chipsHTML + extraHTML + plusHTML;

  // ── カテゴリ選択（♡ タップは除く）──
  container.querySelectorAll('.s-chip:not(.s-chip-plus)').forEach(btn => {
    btn.addEventListener('click', e => {
      if (e.target.closest('.s-chip-fav')) return;  // ♡ タップはスルー
      const prev = APP_STATE.selectedCategory;
      APP_STATE.selectedCategory = btn.dataset.cat;
      if (prev === APP_STATE.selectedCategory && APP_STATE.selectedCategory !== 'all') {
        APP_STATE.selectedCategory = 'all';
      }
      renderCategoryChips();
      applyFiltersAndRender();
    });
  });

  // ── ♡ タップ: お気に入りカテゴリ登録/解除 ──
  container.querySelectorAll('.s-chip-fav').forEach(favEl => {
    favEl.addEventListener('click', e => {
      e.stopPropagation();
      const key = favEl.dataset.cat;
      toggleCatFav(key, true);   // silent=true でトーストなし（チップ操作は静か）
      const isNow = isCatFavorited(key);
      favEl.textContent = isNow ? '♥' : '♡';
      favEl.classList.toggle('active', isNow);
      favEl.setAttribute('aria-label', isNow ? 'お気に入り解除' : 'お気に入り登録');
    });
    // キーボード対応
    favEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); favEl.click(); }
    });
  });

  // ── ＋ボタン → カテゴリ選択シート ──
  document.getElementById('chip-plus')?.addEventListener('click', () => {
    openCategorySelectSheet();
  });
}


/* ================================================================
   § 2c お気に入りカテゴリ トグルカード（STEP10）
   ─ index.html の #fav-cat-card / #fav-ios-toggle を制御する。
   ─ タップで APP_STATE.activeFilters の 'fav' を ON/OFF。
   ─ syncFavCatToggle() は外部（リセット後など）からも呼べる。
   ================================================================ */

/**
 * トグルカードの視覚状態を APP_STATE.activeFilters.has('fav') に同期する
 */
function syncFavCatToggle() {
  const isOn  = APP_STATE.activeFilters.has('fav');
  const card  = document.getElementById('fav-cat-card');
  const tog   = document.getElementById('fav-ios-toggle');
  const heart = card?.querySelector('.s-fav-cat-heart');

  if (card)  card.setAttribute('aria-checked', String(isOn));
  if (tog)   tog.classList.toggle('on', isOn);
  if (heart) heart.textContent = isOn ? '♥' : '♡';
}

/**
 * お気に入りカテゴリカードを初期化してイベントを登録する
 * ─ init() から1回だけ呼ぶ。
 */
function initFavCatCard() {
  syncFavCatToggle();

  const card = document.getElementById('fav-cat-card');
  if (!card) return;

  const toggle = () => {
    if (APP_STATE.activeFilters.has('fav')) {
      APP_STATE.activeFilters.delete('fav');
    } else {
      APP_STATE.activeFilters.add('fav');
    }
    syncFavCatToggle();
    applyFiltersAndRender();
  };

  card.addEventListener('click', toggle);
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
}


/* ================================================================
   § 3  条件フィルター描画
   ─ APP_STATE.activeFilters（Set）を読み書きする。
   ─ 「開催地」チップは openAreaSheet() を呼んでシートを開く。
   ─ 「リセット」チップは activeFilters / selectedArea を全クリア。
   ================================================================ */

function renderConditionFilters() {
  const container = document.getElementById('condition-filters');
  if (!container) return;

  container.innerHTML = CONDITIONS.map(cond => {
    const isActive = APP_STATE.activeFilters.has(cond.key);

    // 「開催地」チップ: 選択中エリア名を表示
    let label = cond.label;
    let extraClass = '';
    if (cond.key === 'area') {
      if (APP_STATE.selectedArea && APP_STATE.selectedArea !== 'all') {
        const region = AREA_REGIONS.find(r => r.key === APP_STATE.selectedArea);
        if (region) {
          label = `📍 ${region.label}`;
          extraClass = ' has-area-label';
        }
      } else {
        label = `📍 ${cond.label}`;
      }
    }

    return `
      <button
        class="s-filter-chip${cond.isReset ? ' reset' : ''}${isActive ? ' active' : ''}${extraClass}"
        data-cond="${cond.key}"
        aria-pressed="${isActive}"
      >
        ${label}
      </button>
    `;
  }).join('');

  container.querySelectorAll('.s-filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.cond;

      // リセット
      if (key === 'reset') {
        APP_STATE.activeFilters.clear();
        APP_STATE.selectedArea = 'all';
        syncFavCatToggle();   // お気に入りカードの表示を同期
        renderConditionFilters();
        applyFiltersAndRender();
        return;
      }

      // 「開催地」→ エリアシートを開く
      if (key === 'area') {
        openAreaSheet();
        return;
      }

      // その他の条件トグル
      if (APP_STATE.activeFilters.has(key)) {
        APP_STATE.activeFilters.delete(key);
      } else {
        APP_STATE.activeFilters.add(key);
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
      APP_STATE.activeFilters.clear();
      if (key !== 'popular' && key !== 'travel') {
        APP_STATE.activeFilters.add(key);
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
 * エリアキーを日本語ラベルに変換
 * AREA_REGIONS は § 最下部で定義されているが、呼び出しは初期化後なので問題なし
 */
function areaLabelFromKey(key) {
  if (!key) return '—';
  const r = AREA_REGIONS.find(r => r.key === key || (r.areas && r.areas.includes(key)));
  return r ? r.label : key;
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
 * カテゴリ別プレースホルダー背景グラデーション
 */
function catPlaceholderBg(cat) {
  const map = {
    jgto:    'linear-gradient(140deg, #1A5C38 0%, #2D8A55 100%)',
    lpga:    'linear-gradient(140deg, #7A1A5C 0%, #B04A8A 100%)',
    qt:      'linear-gradient(140deg, #1A3A6B 0%, #2E62AA 100%)',
    mini:    'linear-gradient(140deg, #2D6A4F 0%, #52B788 100%)',
    open:    'linear-gradient(140deg, #6B3A1A 0%, #AA6030 100%)',
    student: 'linear-gradient(140deg, #4A3A7A 0%, #7060AA 100%)',
    abroad:  'linear-gradient(140deg, #1A3A5C 0%, #2E70AA 100%)',
    asian:   'linear-gradient(140deg, #1A3A1A 0%, #2E622E 100%)',
    pga:     'linear-gradient(140deg, #001533 0%, #002966 100%)',
    other:   'linear-gradient(140deg, #2A2A2E 0%, #3C3C44 100%)',
  };
  return map[cat] || 'linear-gradient(140deg, #2A2A3A 0%, #4A4A5A 100%)';
}

/**
 * カテゴリ別ブランド設定（水平カード・BSヒーロー用）
 */
function catBrandConfig(cat) {
  const map = {
    jgto:    { bg: 'linear-gradient(155deg, #0A0A0A 0%, #1A1A14 50%, #2A2412 100%)', cls: 'brand-jgto',    label: 'JGTO',      sub: '男子ツアー' },
    lpga:    { bg: 'linear-gradient(155deg, #0A1628 0%, #0F2040 50%, #162952 100%)', cls: 'brand-lpga',    label: 'JLPGA',     sub: '女子ツアー' },
    qt:      { bg: 'linear-gradient(155deg, #041A0E 0%, #082810 50%, #0D3A18 100%)', cls: 'brand-qt',      label: 'QT',        sub: 'クオリファイング' },
    mini:    { bg: 'linear-gradient(155deg, #1A1A1E 0%, #2A2A30 50%, #383840 100%)', cls: 'brand-mini',    label: 'MINI TOUR', sub: 'ミニツアー' },
    open:    { bg: 'linear-gradient(155deg, #8B0000 0%, #B20000 50%, #CC1A1A 100%)', cls: 'brand-open',    label: 'OPEN',      sub: '県オープン' },
    student: { bg: 'linear-gradient(155deg, #1A0A3A 0%, #2D1560 50%, #3D2280 100%)', cls: 'brand-student', label: 'STUDENT',   sub: '学生競技' },
    abroad:  { bg: 'linear-gradient(155deg, #030818 0%, #070D24 50%, #0D1438 100%)', cls: 'brand-abroad',  label: 'ABROAD',    sub: '海外ツアー' },
    asian:   { bg: 'linear-gradient(155deg, #0A1E0A 0%, #102A10 50%, #1A3A1A 100%)', cls: 'brand-asian',   label: 'ASIAN',     sub: 'アジアツアー' },
    pga:     { bg: 'linear-gradient(155deg, #001A33 0%, #002952 50%, #003366 100%)', cls: 'brand-pga',     label: 'PGA TOUR',  sub: 'PGAツアー' },
    other:   { bg: 'linear-gradient(155deg, #1E1E22 0%, #2E2E34 50%, #3C3C44 100%)', cls: 'brand-other',   label: 'OTHER',     sub: 'その他の大会' },
  };
  return map[cat] || { bg: 'linear-gradient(155deg, #2A2A3A 0%, #4A4A5A 100%)', cls: 'brand-default', label: (cat || '').toUpperCase(), sub: '' };
}


/* ================================================================
   SIDE STEP A-2: Card left visual rendering
   左カードの固定 MINI TOUR 表示を logoUrl / visualLabel 対応に変更。
   注意:
   - 大会名・カテゴリ表示は変えない
   - カレンダー追加/取り消し処理は触らない
   - ロゴ画像が存在しない場合は文字ロゴ風に自動fallback
   ================================================================ */
function pnxSideStepA2Esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pnxSideStepA2ResolveAssetUrl(url) {
  const raw = String(url == null ? "" : url).trim();
  if (!raw) return "";
  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith("data:") || raw.startsWith("blob:")) return raw;

  // pages/search/embed.html から root/assets を参照するための補正
  if (raw.startsWith("assets/")) return "../../" + raw;
  if (raw.startsWith("/assets/")) return "../.." + raw;
  return raw;
}

function pnxSideStepA2ThemeClass(theme) {
  const safe = String(theme || "default").toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return safe || "default";
}

function pnxSideStepA2CardBrand(t, fallbackBrand) {
  try {
    if (typeof window.PNXSideStepA1ApplyTournamentVisual === "function") {
      window.PNXSideStepA1ApplyTournamentVisual(t);
    }
  } catch(e) {}

  const base = fallbackBrand || catBrandConfig(t && t.cat);
  const visualLabel = String((t && (t.visualLabel || t.series || t.organizer)) || base.label || "TOUR").trim();
  const visualTheme = String((t && t.visualTheme) || "").trim() || "default";
  const logoUrlRaw = String((t && t.logoUrl) || "").trim();
  const logoUrl = pnxSideStepA2ResolveAssetUrl(logoUrlRaw);

  return {
    bg: base.bg,
    cls: (base.cls || "brand-default") + " pnx-visual-brand visual-theme-" + pnxSideStepA2ThemeClass(visualTheme) + (logoUrl ? " has-logo" : " has-text-logo"),
    label: visualLabel || base.label || "TOUR",
    sub: (t && (t.series || t.visualMatchedName || t.organizer)) || base.sub || "",
    logoUrl,
    logoUrlRaw,
    visualTheme,
    visualSource: (t && t.visualSource) || ""
  };
}

function pnxSideStepA2BrandInnerHTML(brand) {
  const label = pnxSideStepA2Esc(brand.label || "TOUR");
  const sub = pnxSideStepA2Esc(brand.sub || "");
  const logo = pnxSideStepA2Esc(brand.logoUrl || "");

  if (logo) {
    return `
          <div class="tc-brand-logo-wrap" data-fallback-label="${label}">
            <img class="tc-brand-logo-img" src="${logo}" alt="${label}" loading="lazy" onerror="this.closest('.tc-brand-logo-wrap').classList.add('is-logo-missing'); this.remove();" />
            <span class="tc-brand-logo-fallback">${label}</span>
          </div>
          ${sub ? `<span class="tc-brand-sub">${sub}</span>` : ""}`;
  }

  return `
          <span class="tc-brand-abbr">${label}</span>
          ${sub ? `<span class="tc-brand-sub">${sub}</span>` : ""}`;
}

window.PNXSideStepA2ResolveAssetUrl = pnxSideStepA2ResolveAssetUrl;
window.PNXSideStepA2CardBrand = pnxSideStepA2CardBrand;


/**
 * 締切日までの緊急度クラスを返す
 */
function deadlineUrgencyClass(deadline) {
  if (!deadline) return 'deadline-normal';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d     = new Date(deadline);
  const days  = Math.ceil((d - today) / 86400000);
  if (days < 0)   return 'deadline-closed';
  if (days <= 5)  return 'deadline-urgent';
  if (days <= 14) return 'deadline-warning';
  return 'deadline-normal';
}

/**
 * 「あとN日」テキストを返す
 */
function daysUntilDeadline(deadline) {
  if (!deadline) return '—';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d     = new Date(deadline);
  const days  = Math.ceil((d - today) / 86400000);
  if (days < 0)   return '締切済';
  if (days === 0) return '本日締切！';
  if (days === 1) return '明日締切';
  if (days <= 5)  return `あと${days}日！`;
  return `あと${days}日`;
}

/**
 * カード用ステータスピル HTML（⑦ 募集状況 — フッター行で表示）
 * Bottom Sheet の statusBadgeHTML とは独立。
 */
function statusPillHTML(t) {
  if (t.status === 'near')   return `<span class="tc-status-pill tc-status-near">🔥 締切間近</span>`;
  if (t.status === 'open')   return `<span class="tc-status-pill tc-status-open">✓ 募集中</span>`;
  if (t.status === 'live')   return `<span class="tc-status-pill tc-status-live">● 開催中</span>`;
  return `<span class="tc-status-pill tc-status-closed">締切済</span>`;
}

/**
 * 締切ストリップ用アイコン（urgencyClass に応じて）
 */
function deadlineIcon(urgencyClass) {
  if (urgencyClass === 'deadline-urgent')  return '🔥';
  if (urgencyClass === 'deadline-warning') return '⏰';
  if (urgencyClass === 'deadline-closed')  return '—';
  return '📅';
}

/**
 * 大会カード1件のHTML（水平レイアウト: ブランドカラム左 + 情報カラム右）
 *
 * 情報優先順位（右カラム上から）:
 *  ① 締切     → tc-deadline-strip（情報カラム全幅・左ボーダーアクセント）
 *  ② 開催日   → tc-date-bar（緑・目立つ）
 *  ③ 大会名   → tc-name（2行クランプ）
 *  ④ 開催地   → tc-venue-line
 *  ⑤ 募集状況 + カレンダー → tc-card-footer（フッター固定）
 */
function tournamentCardHTML(t) {
  const urgencyClass = deadlineUrgencyClass(t.entryDeadline);
  const daysLabel    = daysUntilDeadline(t.entryDeadline);
  const dlIcon       = deadlineIcon(urgencyClass);
  const brand        = pnxSideStepA2CardBrand(t, catBrandConfig(t.cat));

  return `
    <article
      class="s-tournament-card"
      data-id="${t.id}"
      role="button"
      tabindex="0"
      aria-label="${t.name} 詳細を見る"
    >
      <!-- ── ブランドカラム（左） ── -->
      <div class="tc-brand-col ${brand.cls}" data-visual-source="${pnxSideStepA2Esc(brand.visualSource || '')}" data-visual-theme="${pnxSideStepA2Esc(brand.visualTheme || '')}" style="${typeof pnxSideStepA3BrandStyle === 'function' ? pnxSideStepA3BrandStyle(brand) : ''}">
        <div class="tc-brand-inner">
          ${pnxSideStepA2BrandInnerHTML(brand)}
        </div>
        <div class="tc-brand-badges">
          <span class="tc-badge badge-cat">${catLabel(t.cat)}</span>
          ${genderBadgeHTML(t.gender)}
        </div>
      </div>

      <!-- ── 情報カラム（右） ── -->
      <div class="tc-info-col">

        <!-- ① 締切ストリップ（全幅・左ボーダーアクセント） -->
        <div class="tc-deadline-strip ${urgencyClass}">
          <div class="tc-dl-left">
            <span class="tc-dl-icon">${dlIcon}</span>
            <span class="tc-dl-date ${urgencyClass}">締切 ${fmtDateWithDay(t.entryDeadline)}</span>
          </div>
          <span class="tc-dl-days ${urgencyClass}">${daysLabel}</span>
        </div>

        <!-- ② 開催日 -->
        <div class="tc-date-bar">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8"  y1="2" x2="8"  y2="6"/>
          </svg>
          ${fmtDateWithDay(t.start)} 〜 ${fmtDateWithDay(t.end)}
        </div>

        <!-- ③ 大会名 -->
        <h3 class="tc-name">${t.name}</h3>

        <!-- ④ 開催地 -->
        <div class="tc-venue-line">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          ${t.course}
        </div>

        <!-- ⑤ 情報グリッド（賞金・費用・資格・人数） -->
        <div class="tc-info-grid">
          <div class="tc-info-item">
            <span class="tc-info-label">賞金総額</span>
            <span class="tc-info-value">${t.prize || '—'}</span>
          </div>
          <div class="tc-info-item">
            <span class="tc-info-label">エントリー費</span>
            <span class="tc-info-value">${t.entryFee || '—'}</span>
          </div>
          <div class="tc-info-item">
            <span class="tc-info-label">出場資格</span>
            <span class="tc-info-value tc-info-value--wrap">${t.qualification || '—'}</span>
          </div>
          <div class="tc-info-item">
            <span class="tc-info-label">募集人数</span>
            <span class="tc-info-value">${t.capacity || '—'}</span>
          </div>
        </div>

        <!-- ⑥ フッター: 募集状況 + カレンダーに追加 -->
        <div class="tc-card-footer">
          ${statusPillHTML(t)}
          <button
            class="tc-btn tc-btn-add${t.addedToCalendar ? ' added' : ''}"
            data-id="${t.id}"
            onclick="event.stopPropagation(); handleCalendarAdd('${t.id}')"
            aria-label="カレンダーに追加"
          >
            ${t.addedToCalendar
              ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>追加済み`
              : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>カレンダーに追加`
            }
          </button>
        </div>

      </div>

      <!-- ── お気に入りボタン（カード右上・絶対位置） ── -->
      <button
        class="tc-fav-btn${t.favorited ? ' active' : ''}"
        data-id="${t.id}"
        aria-label="${t.favorited ? 'お気に入り解除' : 'お気に入り登録'}"
        onclick="event.stopPropagation(); toggleFav('${t.id}')"
      >
        ${t.favorited
          ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="#FF3B30" stroke="#FF3B30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
          : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
        }
      </button>
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
    const t = DUMMY_TOURNAMENTS.find(x => String(x.id || x.tournamentId) === String(card.dataset.id));
    if (t && t.source === 'cms') {
      // STEP113: CMS大会も通常カードと同じ見た目にする。
      // 旧CMS装飾クラスは付けず、識別用data属性だけ残す。
      card.dataset.cmsTournament = '1';
    }
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
   ─ カテゴリ / 検索ワード / 条件フィルター / 開催地 / ソートを
     APP_STATE から読み取ってリストをフィルタリング・再描画する。
   ─ 状態変化のたびに saveStateToLocalStorage() を呼んで自動保存。
   ================================================================ */

/**
 * フィルター・ソートを適用してカードリストを再描画する
 * ─ 既にカードが表示されている場合はフェードアウト → 更新 → フェードイン。
 * ─ 初回（カードがない）は即座に描画する。
 * ─ カテゴリ / 条件フィルター / 検索バー / ソートタブが変化した際に呼ぶ。
 */
function applyFiltersAndRender() {
  saveStateToLocalStorage(); // 💾 フィルター・検索変更を自動保存
  const list = document.getElementById('tournament-list');
  const hasExisting = list && list.querySelector('.s-tournament-card, .s-empty');

  if (hasExisting) {
    // ── フェードアウト → 更新 → フェードイン ──
    list.classList.add('fading-out');
    setTimeout(() => {
      _buildFilteredResult();
      list.classList.remove('fading-out');
    }, 180);
  } else {
    // 初回描画: フェードなしで即描画
    _buildFilteredResult();
  }
}

/**
 * 実際のフィルタリング + renderTournamentList 呼び出し
 * applyFiltersAndRender の内部実装を分離
 */

/* ================================================================
   STEP89: CMS tournaments official search list integration
   CMS大会を補助表示ではなく、正式な大会カード一覧へ合流させる
   ================================================================ */
function pnxStep89ReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch(e) {
    return fallback;
  }
}

function pnxStep89Text(v) {
  return String(v == null ? "" : v).trim();
}

const PNX_STEP89_PREF_MAP = {
  "北海道":"hokkaido","青森県":"aomori","岩手県":"iwate","宮城県":"miyagi","秋田県":"akita","山形県":"yamagata","福島県":"fukushima",
  "茨城県":"ibaraki","栃木県":"tochigi","群馬県":"gunma","埼玉県":"saitama","千葉県":"chiba","東京都":"tokyo","神奈川県":"kanagawa","山梨県":"yamanashi",
  "新潟県":"niigata","長野県":"nagano","富山県":"toyama","石川県":"ishikawa","福井県":"fukui","岐阜県":"gifu","静岡県":"shizuoka","愛知県":"aichi","三重県":"mie",
  "滋賀県":"shiga","京都府":"kyoto","大阪府":"osaka","兵庫県":"hyogo","奈良県":"nara","和歌山県":"wakayama",
  "鳥取県":"tottori","島根県":"shimane","岡山県":"okayama","広島県":"hiroshima","山口県":"yamaguchi",
  "徳島県":"tokushima","香川県":"kagawa","愛媛県":"ehime","高知県":"kochi",
  "福岡県":"fukuoka","佐賀県":"saga","長崎県":"nagasaki","熊本県":"kumamoto","大分県":"oita","宮崎県":"miyazaki","鹿児島県":"kagoshima","沖縄県":"okinawa"
};

const PNX_STEP89_AREA_FROM_PREF = {
  hokkaido:"hokkaido",
  aomori:"tohoku", iwate:"tohoku", miyagi:"tohoku", akita:"tohoku", yamagata:"tohoku", fukushima:"tohoku",
  ibaraki:"kanto", tochigi:"kanto", gunma:"kanto", saitama:"kanto", chiba:"kanto", tokyo:"kanto", kanagawa:"kanto", yamanashi:"kanto",
  niigata:"chubu", nagano:"chubu", toyama:"chubu", ishikawa:"chubu", fukui:"chubu", gifu:"chubu", shizuoka:"chubu", aichi:"chubu", mie:"chubu",
  shiga:"kinki", kyoto:"kinki", osaka:"kinki", hyogo:"kinki", nara:"kinki", wakayama:"kinki",
  tottori:"chugoku", shimane:"chugoku", okayama:"chugoku", hiroshima:"chugoku", yamaguchi:"chugoku",
  tokushima:"shikoku", kagawa:"shikoku", ehime:"shikoku", kochi:"shikoku",
  fukuoka:"kyushu", saga:"kyushu", nagasaki:"kyushu", kumamoto:"kyushu", oita:"kyushu", miyazaki:"kyushu", kagoshima:"kyushu", okinawa:"kyushu"
};

function pnxStep89NormalizeDate(v) {
  const s = pnxStep89Text(v);
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  let m = s.match(/(20\d{2})[\/年.-]\s*(\d{1,2})[\/月.-]\s*(\d{1,2})/);
  if (m) return `${m[1]}-${String(m[2]).padStart(2, "0")}-${String(m[3]).padStart(2, "0")}`;
  m = s.match(/(\d{1,2})[\/月]\s*(\d{1,2})/);
  if (m) return `${new Date().getFullYear()}-${String(m[1]).padStart(2, "0")}-${String(m[2]).padStart(2, "0")}`;
  return s;
}

function pnxStep89NormalizePref(v) {
  const s = pnxStep89Text(v);
  if (!s) return "kanto";
  if (PNX_STEP89_PREF_MAP[s]) return PNX_STEP89_PREF_MAP[s];
  const hit = Object.keys(PNX_STEP89_PREF_MAP).find(k => s.includes(k) || s.includes(k.replace(/[県府都]/g, "")));
  return hit ? PNX_STEP89_PREF_MAP[hit] : s;
}

function pnxStep89NormalizeArea(area, pref) {
  const a = pnxStep89Text(area);
  if (/^(hokkaido|tohoku|kanto|chubu|kinki|kansai|chugoku|shikoku|kyushu|overseas)$/.test(a)) {
    return a === "kansai" ? "kinki" : a;
  }
  return PNX_STEP89_AREA_FROM_PREF[pref] || "kanto";
}

function pnxStep89NormalizeCategory(v) {
  const raw = pnxStep89Text(v);
  const s = raw.toLowerCase();
  if (/jgto|男子ツアー/.test(s)) return "jgto";
  if (/jlpga|lpga|女子|ステップ/.test(s)) return "lpga";
  if (/qt/.test(s)) return "qt";
  if (/ミニ|mini|atp|future|fj|カートルズ|cartles|doucus|p&a/.test(s)) return "mini";
  if (/オープン|open|県オープン|地方オープン|選手権/.test(s)) return "open";
  if (/学生/.test(s)) return "student";
  if (/海外|abroad|asian|pga|korn|dp world|liv|韓国|台湾|中国|フィリピン/.test(s)) return "abroad";
  if (/^(jgto|lpga|qt|mini|open|student|abroad)$/.test(s)) return s;
  return "open";
}

function pnxStep89NormalizeGender(v, cat) {
  const s = `${pnxStep89Text(v)} ${pnxStep89Text(cat)}`.toLowerCase();
  if (/女子|women|womens|female|lpga|jlpga/.test(s)) return "womens";
  return "mens";
}

function pnxStep89NormalizeStatus(v) {
  const s = pnxStep89Text(v).toLowerCase();
  if (/near|締切間近/.test(s)) return "near";
  if (/closed|締切|終了|finished/.test(s)) return "closed";
  if (/live|ongoing|開催中/.test(s)) return "live";
  return "open";
}

function pnxStep89ReadCmsSnapshot() {
  const snap = pnxStep89ReadJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", []);
  const hard = pnxStep89ReadJson("PNX_STEP85_HARD_SYNC_PAYLOAD", null);
  if (Array.isArray(snap) && snap.length) return snap;
  if (hard && Array.isArray(hard.tournaments) && hard.tournaments.length) return hard.tournaments;
  return [];
}

function pnxStep89NormalizeCmsTournament(t, index) {
  const id = pnxStep89Text(t.id || t.tournamentId) || `cms_step89_${Date.now()}_${index}`;
  const title = pnxStep89Text(t.name || t.title || t.tournamentTitle) || "CMS登録大会";
  const start = pnxStep89NormalizeDate(t.start || t.startDate || t.date);
  const end = pnxStep89NormalizeDate(t.end || t.endDate || t.start || t.startDate || t.date) || start;
  const pref = pnxStep89NormalizePref(t.prefecture || t.pref);
  const cat = pnxStep89NormalizeCategory(t.cat || t.category);
  const course = pnxStep89Text(t.course || t.venue || t.place) || "会場未定";

  return Object.assign({}, t, {
    id,
    tournamentId: id,
    name: title,
    title,
    cat,
    category: pnxStep89Text(t.category || t.cat) || cat,
    gender: pnxStep89NormalizeGender(t.gender || t.sex, t.category || t.cat),
    region: cat === "abroad" ? "overseas" : "domestic",
    area: pnxStep89NormalizeArea(t.area, pref),
    prefecture: pref,
    course,
    venue: course,
    start,
    startDate: start,
    end,
    endDate: end,
    entryDeadline: pnxStep89NormalizeDate(t.entryDeadline || t.deadline),
    cancelDeadline: pnxStep89NormalizeDate(t.cancelDeadline || t.entryDeadline || t.deadline),
    prize: pnxStep89Text(t.prize || t.totalPrize) || "—",
    prizeWinner: pnxStep89Text(t.prizeWinner || t.winnerPrize) || "—",
    winnerPrize: pnxStep89Text(t.winnerPrize || t.prizeWinner) || "—",
    entryFee: pnxStep89Text(t.entryFee || t.fee) || "—",
    practiceRoundFee: pnxStep89Text(t.practiceRoundFee) || "—",
    entryMethod: pnxStep89Text(t.entryMethod || t.entryUrl || t.officialUrl) || "CMS登録情報を確認",
    qualification: pnxStep89Text(t.qualification || t.eligibility) || "—",
    eligibility: pnxStep89Text(t.eligibility || t.qualification) || "—",
    capacity: pnxStep89Text(t.capacity) || "—",
    organizer: pnxStep89Text(t.organizer) || "—",
    status: pnxStep89NormalizeStatus(t.status),
    emoji: t.emoji || "⛳",
    tags: Array.isArray(t.tags) ? t.tags : ["CMS登録"],
    addedToCalendar: !!t.addedToCalendar || (APP_STATE && APP_STATE.addedToCalendar && APP_STATE.addedToCalendar.has(id)),
    favorited: !!t.favorited || (APP_STATE && APP_STATE.favorites && APP_STATE.favorites.has(id)),
    source: "cms",
    cmsSource: t.cmsSource || t.source || "step89-official-list",
    _pnxStep89Official: true
  });
}

function pnxStep89MergeCmsIntoOfficialList() {
  if (typeof DUMMY_TOURNAMENTS === "undefined" || !Array.isArray(DUMMY_TOURNAMENTS)) {
    return { ok: false, reason: "DUMMY_TOURNAMENTS_missing", count: 0, added: 0, updated: 0, titles: [] };
  }

  const snapshot = pnxStep89ReadCmsSnapshot();
  const items = snapshot.map(pnxStep89NormalizeCmsTournament);

  let added = 0;
  let updated = 0;

  items.forEach(item => {
    const idx = DUMMY_TOURNAMENTS.findIndex(t => String(t.id || t.tournamentId) === String(item.id || item.tournamentId));
    if (idx >= 0) {
      DUMMY_TOURNAMENTS[idx] = Object.assign({}, DUMMY_TOURNAMENTS[idx], item);
      updated += 1;
    } else {
      DUMMY_TOURNAMENTS.unshift(item);
      added += 1;
    }
  });

  const result = {
    ok: true,
    count: items.length,
    added,
    updated,
    ids: items.map(t => t.id),
    titles: items.map(t => t.name)
  };

  window.__PNX_STEP89_MERGE_RESULT__ = result;
  try { localStorage.setItem("PNX_STEP89_MERGE_RESULT", JSON.stringify(result)); } catch(e) {}
  return result;
}

function pnxStep89BuildOfficialTournamentList() {
  pnxStep89MergeCmsIntoOfficialList();
  const seen = new Set();
  return DUMMY_TOURNAMENTS.filter(t => {
    const id = String(t.id || t.tournamentId || "");
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function pnxStep89ResetFiltersForOfficialCms() {
  try {
    APP_STATE.selectedCategory = "all";
    APP_STATE.selectedGender = "all";
    APP_STATE.selectedArea = "all";
    APP_STATE.searchQuery = "";
    APP_STATE.sortKey = "recommend";
    if (APP_STATE.activeFilters && APP_STATE.activeFilters.clear) APP_STATE.activeFilters.clear();
    if (APP_STATE.detailFilters) {
      if (APP_STATE.detailFilters.areas && APP_STATE.detailFilters.areas.clear) APP_STATE.detailFilters.areas.clear();
      if (APP_STATE.detailFilters.categories && APP_STATE.detailFilters.categories.clear) APP_STATE.detailFilters.categories.clear();
      if (APP_STATE.detailFilters.statuses && APP_STATE.detailFilters.statuses.clear) APP_STATE.detailFilters.statuses.clear();
      APP_STATE.detailFilters.gender = "";
      APP_STATE.detailFilters.timing = "";
      APP_STATE.detailFilters.prizeMin = "";
      APP_STATE.detailFilters.entryFeeMax = "";
    }

    const searchInput = document.getElementById("search-input");
    if (searchInput) searchInput.value = "";

    document.querySelectorAll(".s-sort-tab").forEach(btn => {
      const active = btn.dataset.sort === "recommend";
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  } catch(e) {}
}

function pnxStep89RenderOfficialCmsList(showAlert) {
  const merge = pnxStep89MergeCmsIntoOfficialList();
  pnxStep89ResetFiltersForOfficialCms();

  try { if (typeof renderGenderSegment === "function") renderGenderSegment(); } catch(e) {}
  try { if (typeof renderCategoryChips === "function") renderCategoryChips(); } catch(e) {}
  try { if (typeof renderConditionFilters === "function") renderConditionFilters(); } catch(e) {}
  try { if (typeof updateFilterBadge === "function") updateFilterBadge(); } catch(e) {}
  try { applyFiltersAndRender(); } catch(e) {}

  setTimeout(() => {
    try { if (typeof window.PNXPolishCmsSearchCardsAndDetails === "function") window.PNXPolishCmsSearchCardsAndDetails(); } catch(e) {}

    const visible = document.querySelectorAll(".s-tournament-card.pnx-step89-official-card, .s-tournament-card[data-cms-tournament='1']").length;
    const result = Object.assign({}, merge, {
      visible,
      renderedCards: document.querySelectorAll(".s-tournament-card").length
    });

    window.__PNX_STEP89_RENDER_RESULT__ = result;
    try { localStorage.setItem("PNX_STEP89_RENDER_RESULT", JSON.stringify(result)); } catch(e) {}

    if (showAlert) {
      alert(
        "STEP89 正式一覧統合\n\n" +
        "CMS公開大会: " + merge.count + "件\n" +
        "正式リスト追加: " + merge.added + "件\n" +
        "更新: " + merge.updated + "件\n" +
        "CMSカード表示: " + visible + "件\n" +
        "全カード表示: " + result.renderedCards + "件\n\n" +
        (visible > 0 ? "結果: 本来の大会カード一覧に表示できています。" : "結果: まだ正式一覧に出ていません。") +
        "\n\n大会:\n・" + (merge.titles || []).join("\n・")
      );
    }
  }, 420);

  return merge;
}

window.PNXStep89MergeCmsIntoOfficialList = pnxStep89MergeCmsIntoOfficialList;
window.PNXStep89RenderOfficialCmsList = pnxStep89RenderOfficialCmsList;

function _buildFilteredResult() {
  let result = pnxStep89BuildOfficialTournamentList();

  // ── 性別フィルター（STEP8）──
  if (APP_STATE.selectedGender !== 'all') {
    result = result.filter(t => t.gender === APP_STATE.selectedGender);
  }

  // ── カテゴリフィルター ──
  if (APP_STATE.selectedCategory !== 'all') {
    result = result.filter(t => t.cat === APP_STATE.selectedCategory);
  }

  // ── 検索クエリ ──
  if (APP_STATE.searchQuery.trim()) {
    const q = APP_STATE.searchQuery.trim().toLowerCase();
    result = result.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.organizer.toLowerCase().includes(q) ||
      t.course.toLowerCase().includes(q)
    );
  }

  // ── 条件フィルター ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const oneWeekLater   = new Date(today); oneWeekLater.setDate(today.getDate() + 7);
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextMonthEnd   = new Date(today.getFullYear(), today.getMonth() + 2, 0);

  // お気に入りカテゴリフィルター（STEP7: カテゴリ単位）
  if (APP_STATE.activeFilters.has('fav')) {
    if (APP_STATE.favCategories.size === 0) {
      result = [];   // お気に入りカテゴリが未登録 → 0件
    } else {
      result = result.filter(t => APP_STATE.favCategories.has(t.cat));
    }
  }

  if (APP_STATE.activeFilters.has('recruiting')) {
    result = result.filter(t => t.status === 'open' || t.status === 'near');
  }
  if (APP_STATE.activeFilters.has('near')) {
    result = result.filter(t => t.status === 'near');
  }
  if (APP_STATE.activeFilters.has('thisweek')) {
    result = result.filter(t => {
      const s = new Date(t.start);
      return s >= today && s <= oneWeekLater;
    });
  }
  if (APP_STATE.activeFilters.has('nextmonth')) {
    result = result.filter(t => {
      const s = new Date(t.start);
      return s >= nextMonthStart && s <= nextMonthEnd;
    });
  }

  // ── 開催地フィルター ──
  if (APP_STATE.activeFilters.has('area') && APP_STATE.selectedArea && APP_STATE.selectedArea !== 'all') {
    const region = AREA_REGIONS.find(r => r.key === APP_STATE.selectedArea);
    if (region && region.areas.length > 0) {
      result = result.filter(t =>
        region.areas.includes(t.area) ||
        region.areas.includes(t.prefecture)
      );
    }
  }

  // ── 詳細フィルター ──
  const df = APP_STATE.detailFilters;

  // 開催地域（OR: いずれかの地域に合致）
  if (df.areas.size > 0) {
    result = result.filter(t => [...df.areas].some(areaKey => {
      if (areaKey === 'overseas') return t.region === 'overseas';
      return (DF_AREA_KEYS[areaKey] || []).some(k => k === t.area || k === t.prefecture);
    }));
  }

  // カテゴリ（詳細フィルター / カテゴリチップと独立して AND 動作）
  if (df.categories.size > 0) {
    result = result.filter(t => df.categories.has(t.cat));
  }

  // 性別（'mixed' = 絞り込みなし）
  if (df.gender && df.gender !== 'mixed') {
    result = result.filter(t => t.gender === df.gender);
  }

  // 募集状況
  if (df.statuses.size > 0) {
    result = result.filter(t => df.statuses.has(t.status));
  }

  // 開催時期
  if (df.timing) {
    const todayDF = new Date(); todayDF.setHours(0, 0, 0, 0);
    if (df.timing === 'thisweek') {
      const end = new Date(todayDF); end.setDate(todayDF.getDate() + 7);
      result = result.filter(t => { const s = new Date(t.start); return s >= todayDF && s <= end; });
    } else if (df.timing === 'nextmonth') {
      const ns = new Date(todayDF.getFullYear(), todayDF.getMonth() + 1, 1);
      const ne = new Date(todayDF.getFullYear(), todayDF.getMonth() + 2, 0);
      result = result.filter(t => { const s = new Date(t.start); return s >= ns && s <= ne; });
    } else if (df.timing === '3months') {
      const end3 = new Date(todayDF); end3.setMonth(todayDF.getMonth() + 3);
      result = result.filter(t => { const s = new Date(t.start); return s >= todayDF && s <= end3; });
    }
  }

  // 賞金額（最低）
  if (df.prizeMin) {
    if (df.prizeMin === 'none') {
      result = result.filter(t => !t.prize || t.prize === '—');
    } else {
      const minAmt = parseInt(df.prizeMin) * 10_000;
      result = result.filter(t => parsePrizeAmount(t.prize) >= minAmt);
    }
  }

  // エントリー費（上限）
  if (df.entryFeeMax) {
    const maxFee = parseInt(df.entryFeeMax);
    result = result.filter(t => parseEntryFeeAmount(t.entryFee) <= maxFee);
  }

  // ── ソート ──
  result = sortTournaments(result, APP_STATE.sortKey);

  renderTournamentList(result);
}

function sortTournaments(arr, sortKey) {
  const sorted = [...arr];
  const cmsWeight = (t) => (t && t.source === 'cms') ? 1 : 0;
  switch (sortKey) {
    case 'date':
      sorted.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
      break;
    case 'deadline':
      sorted.sort((a, b) => (a.entryDeadline < b.entryDeadline ? -1 : a.entryDeadline > b.entryDeadline ? 1 : 0));
      break;
    case 'new':
      sorted.sort((a, b) => cmsWeight(b) - cmsWeight(a)); // CMS登録大会を先頭へ
      break;
    case 'recommend':
    default:
      // おすすめ: CMS登録大会と締切間近を優先
      sorted.sort((a, b) => {
        const score = (t) => cmsWeight(t) * 20 + (t.status === 'near' ? 10 : 0);
        return score(b) - score(a);
      });
      break;
  }
  return sorted;
}


/* ================================================================
   § 7  Bottom Sheet 開閉制御
   ─ iOS Maps / Apple Music 風の spring アニメーション
     (cubic-bezier(0.32, 0.72, 0, 1)) で開閉する。
   ─ openBottomSheet(id)  : カードタップ時に呼ぶ
   ─ closeBottomSheet()   : 閉じるボタン / 背景タップ / Esc / スワイプで呼ぶ
   ─ APP_STATE.bsOpen / selectedTournamentId を読み書きする。
   ================================================================ */

let _bsCloseTimer = null;    // 閉じアニメーション完了待ちタイマー

const bsOverlay = document.getElementById('bs-overlay');
const bsSheet   = document.getElementById('bs-sheet');
const scrollArea = document.getElementById('scroll-area');

/**
 * Bottom Sheet を開く
 * - カードタップ時に呼ばれる
 * - コンテンツ描画 → 2フレーム後にクラス付与（CSSトランジション起点）
 */
function openBottomSheet(id) {
  if (APP_STATE.bsOpen) return;          // 既に開いている場合はスキップ
  const t = DUMMY_TOURNAMENTS.find(x => x.id === id);
  if (!t) return;

  // --- 1. 状態更新 ---
  APP_STATE.selectedTournamentId = id;
  APP_STATE.bsOpen = true;
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
  if (!APP_STATE.bsOpen) return;
  APP_STATE.bsOpen = false;

  // --- 1. クラスを外すと CSSトランジションで閉じる ---
  bsOverlay.classList.remove('open');
  bsSheet.classList.remove('open');

  // --- 2. aria ---
  bsSheet.setAttribute('aria-hidden', 'true');
  bsOverlay.setAttribute('aria-hidden', 'true');

  // --- 3. トランジション終了後（~480ms）にスクロール復元 ---
  // 日付別BS / カテゴリBS が開いていればスクロール禁止を維持
  _bsCloseTimer = setTimeout(() => {
    if (!_daySheetOpen && !_catSheetOpen) {
      scrollArea.style.overflow = '';
      scrollArea.style.touchAction = '';
    }
    APP_STATE.selectedTournamentId = null;
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
  if (e.key === 'Escape' && APP_STATE.bsOpen) closeBottomSheet();
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
    if (!APP_STATE.bsOpen) return;
    startY = e.touches[0].clientY;
    startTime = Date.now();
    isDragging = true;
  }, { passive: true });

  handle.addEventListener('touchmove', e => {
    if (!isDragging || !APP_STATE.bsOpen) return;
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
   ─ bsBody.innerHTML を毎回全書き換えする方式（サブID 個別更新は廃止）。
   ─ 6ブロック構成: 基本情報 / 賞金 / 費用 / 出場条件 / 運営 / スケジュール
   ─ 描画後に _syncBSAddBtn / _syncBSFavBtn でフッター・ヘッダーを同期。
   ─ BSヘッダーのお気に入りボタンは cloneNode で重複リスナーをリセット。
   ================================================================ */

function renderBottomSheetContent(t) {
  const bsBody = document.getElementById('bs-body');
  if (!bsBody) return;

  // ヘッダータイトル
  document.getElementById('bs-header-title').textContent = '大会詳細';

  // ── urgency計算 ──
  const urgencyClass = deadlineUrgencyClass(t.entryDeadline);
  const daysLabel    = daysUntilDeadline(t.entryDeadline);
  const dlIcon       = deadlineIcon(urgencyClass);
  const brand        = catBrandConfig(t.cat);

  // 締切日テキスト色クラス（urgentなら赤、warningならオレンジ）
  const deadlineValueClass =
    urgencyClass === 'deadline-urgent'  ? 'urgent'  :
    urgencyClass === 'deadline-warning' ? 'warning' : '';

  // ── スケジュール4項目 ──
  const schedItems = [
    { date: t.entryDeadline,  label: 'エントリー締切', cls: 'date-deadline' },
    { date: t.cancelDeadline, label: 'キャンセル締切', cls: 'date-cancel'   },
    { date: t.start,          label: '競技開始',       cls: ''              },
    { date: t.end,            label: '競技最終日',     cls: ''              },
  ];

  // ── bs-body 全体をinnerHTML方式で再構築 ──
  bsBody.innerHTML = `

    <!-- ▌ヒーローエリア: Apple TV / App Store スタイル -->
    <div class="bs-hero-wrap ${brand.cls}">

      <!-- 右上: 締切urgencyバッジ -->
      <div class="bs-img-urgency-badge ${urgencyClass}">
        ${dlIcon} ${daysLabel}
      </div>

      <!-- 左上: ブランドラベル（小・コンパクト） -->
      <div class="bs-tour-brand">
        <span class="bs-tour-brand-label">${brand.label}</span>
        <span class="bs-tour-brand-sub">${brand.sub}</span>
      </div>

      <!-- 下部: バッジ + 大会名 + 日程・会場 -->
      <div class="bs-hero-info">
        <div class="bs-hero-badges">
          <span class="tc-badge badge-cat">${catLabel(t.cat)}</span>
          ${genderBadgeHTML(t.gender)}
          ${statusBadgeHTML(t)}
        </div>
        <h2 class="bs-hero-name">${t.name}</h2>
        <p class="bs-hero-meta">${fmtDateWithDay(t.start)} 〜 ${fmtDateWithDay(t.end)}　📍 ${t.course}</p>
      </div>
    </div>

    <!-- ▌スクロールコンテンツ -->
    <div class="bs-scroll-content">

      <!-- 締切urgencyストリップ -->
      <div class="bs-deadline-strip ${urgencyClass}">
        <div class="bs-dl-left">
          <span class="bs-dl-icon">${dlIcon}</span>
          <span class="bs-dl-date ${urgencyClass}">締切 ${fmtDateWithDay(t.entryDeadline)}</span>
        </div>
        <span class="bs-dl-days ${urgencyClass}">${daysLabel}</span>
      </div>

      <!-- ━━ Block 1: 基本情報 ━━ -->
      <div class="bs-info-card">
        <p class="bs-info-card-title">📅 基本情報</p>
        <div class="bs-card-item">
          <p class="bs-card-label">開催期間</p>
          <p class="bs-card-value highlight">${fmtDateWithDay(t.start)} 〜 ${fmtDateWithDay(t.end)}</p>
        </div>
        <div class="bs-card-item border-top">
          <p class="bs-card-label">エントリー締切</p>
          <p class="bs-card-value${deadlineValueClass ? ' ' + deadlineValueClass : ''}">${fmtDateWithDay(t.entryDeadline)}</p>
        </div>
        <div class="bs-card-item border-top">
          <p class="bs-card-label">会場</p>
          <p class="bs-card-value">${t.course}</p>
        </div>
        <div class="bs-card-item border-top">
          <p class="bs-card-label">開催地</p>
          <p class="bs-card-value">${areaLabelFromKey(t.area)}</p>
        </div>
      </div>

      <!-- ━━ Block 2: 賞金情報 ━━ -->
      <div class="bs-info-card">
        <p class="bs-info-card-title">🏆 賞金情報</p>
        <div class="bs-info-card-grid">
          <div class="bs-card-item">
            <p class="bs-card-label">賞金総額</p>
            <p class="bs-card-value highlight">${t.prize}</p>
          </div>
          <div class="bs-card-item">
            <p class="bs-card-label">優勝賞金</p>
            <p class="bs-card-value highlight">${t.prizeWinner}</p>
          </div>
        </div>
      </div>

      <!-- ━━ Block 3: 費用情報 ━━ -->
      <div class="bs-info-card">
        <p class="bs-info-card-title">💴 費用情報</p>
        <div class="bs-info-card-grid">
          <div class="bs-card-item">
            <p class="bs-card-label">エントリー費</p>
            <p class="bs-card-value">${t.entryFee}</p>
          </div>
          <div class="bs-card-item">
            <p class="bs-card-label">プレーフィー</p>
            <p class="bs-card-value">${t.practiceRoundFee}</p>
          </div>
        </div>
      </div>

      <!-- ━━ Block 4: 出場条件 ━━ -->
      <div class="bs-info-card">
        <p class="bs-info-card-title">📋 出場条件</p>
        <div class="bs-card-item">
          <p class="bs-card-label">出場資格</p>
          <p class="bs-card-value sm">${t.qualification}</p>
        </div>
        <div class="bs-card-item border-top">
          <p class="bs-card-label">募集人数</p>
          <p class="bs-card-value">${t.capacity}</p>
        </div>
      </div>

      <!-- ━━ Block 5: 運営情報 ━━ -->
      <div class="bs-info-card">
        <p class="bs-info-card-title">🏢 運営情報</p>
        <div class="bs-card-item">
          <p class="bs-card-label">主催</p>
          <p class="bs-card-value sm">${t.organizer}</p>
        </div>
        <div class="bs-card-item border-top">
          <p class="bs-card-label">申込方法</p>
          <p class="bs-card-value sm">${t.entryMethod}</p>
        </div>
      </div>

      <!-- ━━ Block 6: スケジュール ━━ -->
      <p class="bs-section-title">スケジュール</p>
      <div class="bs-info-card">
        ${schedItems.map(item => `
          <div class="bs-schedule-item">
            <span class="bs-sched-date${item.cls ? ' ' + item.cls : ''}">${fmtDateWithDay(item.date)}</span>
            <span class="bs-sched-label">${item.label}</span>
          </div>
        `).join('')}
      </div>

      <div style="height:6px;"></div>
    </div>
  `;

  // スクロールをトップへリセット
  bsBody.scrollTop = 0;

  // 固定フッター「カレンダーに追加」ボタン状態を同期
  _syncBSAddBtn(t);

  // BSヘッダー「お気に入り」ボタン状態を同期
  _syncBSFavBtn(t);

  // BSヘッダーのお気に入りボタンにクリックイベントを付与
  const bsFavBtn = document.getElementById('bs-fav-btn');
  if (bsFavBtn) {
    // 重複登録防止: oldListener を置き換え
    const newHandler = () => toggleFav(t.id);
    bsFavBtn.replaceWith(bsFavBtn.cloneNode(true)); // イベントリセット
    const freshBtn = document.getElementById('bs-fav-btn');
    _syncBSFavBtn(t); // クローン後に再同期
    if (freshBtn) freshBtn.addEventListener('click', newHandler);
  }
}

/**
 * 固定フッターの「カレンダーに追加」ボタン状態を同期
 * （innerHTML書き換え後でもフッターは DOM固定なので安全）
 */
function _syncBSAddBtn(t) {
  const addBtn = document.getElementById('bs-cta-add');
  if (!addBtn) return;
  if (t && t.addedToCalendar) {
    addBtn.classList.add('added');
    addBtn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      追加済み
    `;
  } else {
    addBtn.classList.remove('added');
    addBtn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <line x1="12" y1="14" x2="12" y2="18"/>
        <line x1="10" y1="16" x2="14" y2="16"/>
      </svg>
      カレンダーに追加
    `;
  }
}

// BS フッター「詳細を見る」ボタン
// STEP2: t.officialUrl などを用意し、window.open(t.officialUrl, '_blank') に差し替える
document.getElementById('bs-cta-detail').addEventListener('click', () => {
  const t = DUMMY_TOURNAMENTS.find(x => x.id === APP_STATE.selectedTournamentId);
  if (!t) return;
  alert(`「${t.name}」の公式サイト連携は STEP2 で実装予定です。`);
});

document.getElementById('bs-cta-add').addEventListener('click', () => {
  if (!APP_STATE.selectedTournamentId) return;
  // handleCalendarAdd が内部でカード↔BS両方を同期
  handleCalendarAdd(APP_STATE.selectedTournamentId);
});


/* ================================================================
   § 8.5  カレンダー追加・お気に入り操作
   ─ カード側・BS側どちらからタップされても双方が同期する。
   ─ DOM query（.tc-btn-add[data-id] / .tc-fav-btn[data-id]）で
     カードボタンを直接更新し、_syncBS* でBS固定フッター / ヘッダーも更新。
   ─ 状態変更後は setFavorited / setAdded 経由で自動的に localStorage に保存。
   ================================================================ */

function buildCalendarAddPayload(t) {
  if (!t) return null;
  return {
    type: 'PNX_ADD_TOURNAMENT_TO_CALENDAR',
    source: 'search-module',
    step: '203',
    at: new Date().toISOString(),
    tournament: {
      id: t.id,
      name: t.name,
      start: t.start,
      end: t.end || t.start,
      course: t.course || '',
      venue: t.course || '',
      prefecture: t.prefecture || '',
      area: t.area || '',
      organizer: t.organizer || '',
      cat: t.cat || '',
      gender: t.gender || '',
      region: t.region || '',
      prize: t.prize || '',
      prizeWinner: t.prizeWinner || '',
      entryDeadline: t.entryDeadline || '',
      cancelDeadline: t.cancelDeadline || '',
      entryFee: t.entryFee || '',
      practiceRoundFee: t.practiceRoundFee || '',
      qualification: t.qualification || '',
      capacity: t.capacity || '',
      entryMethod: t.entryMethod || '',
      status: t.status || '',
      tags: Array.isArray(t.tags) ? t.tags.slice() : []
    }
  };
}

function postTournamentToParentCalendar(t) {
  const payload = buildCalendarAddPayload(t);
  if (!payload) return false;
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(payload, '*');
      window.__PNX_STEP203_LAST_CALENDAR_POST__ = payload;
      return true;
    }
  } catch (e) {
    console.warn('[ProNexaX] 親カレンダーへの送信に失敗しました:', e);
  }
  return false;
}

/**
 * カレンダーに追加する
 * ─ STEP203: iframe から親の本体カレンダーへ postMessage で大会情報を送る。
 * ─ 親側の calendar.js が重複チェック・localStorage保存・再描画を担当する。
 * ─ 検索画面側はこれまで通り「追加済み」表示を維持する。
 *
 * STEP2: Firestore にカレンダーイベントを書き込む場合は下記に追加:
 *   db.collection('users').doc(userId).collection('calendar')
 *     .doc(id).set({ added: true, addedAt: serverTimestamp() })
 *   CalendarKit / Capacitor Calendar Plugin への連携もここで行う。
 */
function handleCalendarAdd(id) {
  const t = DUMMY_TOURNAMENTS.find(x => x.id === id);
  if (!t) return;

  // STEP203: 追加済み状態でも親側へ送る。親カレンダー側で二重追加を防ぐ。
  postTournamentToParentCalendar(t);

  if (isAdded(id)) {
    showToast(`「${t.name}」はすでにカレンダー追加済みです`);
    return;
  }

  // setAdded が APP_STATE.addedToCalendar と t.addedToCalendar の両方を更新
  setAdded(id);

  // 追加済み共通HTML
  const addedInnerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2.8"
         stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg> 追加済み
  `;

  // ── カードボタンをDOM queryで直接更新 ──
  // （カード側・BS側どちらからタップされても確実に更新）
  const cardBtn = document.querySelector(`.tc-btn-add[data-id="${id}"]`);
  if (cardBtn) {
    cardBtn.classList.add('added');
    cardBtn.innerHTML = addedInnerHTML;
    cardBtn.style.cssText = '';  // インラインスタイルリセット
    // pop アニメーション
    cardBtn.classList.remove('cal-pop');
    void cardBtn.offsetWidth;
    cardBtn.classList.add('cal-pop');
  }

  // ── BS固定フッターボタンを同期 + pop アニメーション ──
  _syncBSAddBtn(t);
  if (APP_STATE.bsOpen) {
    const bsAddBtn = document.getElementById('bs-cta-add');
    if (bsAddBtn) {
      bsAddBtn.classList.remove('cal-pop');
      void bsAddBtn.offsetWidth;
      bsAddBtn.classList.add('cal-pop');
    }
  }

  console.log(`[ProNexaX] ✅ カレンダー追加: ${t.name} (id: ${t.id})`);
  showToast(`「${t.name}」をカレンダーに追加しました`);
}

window.PNXSearchBuildCalendarAddPayload = buildCalendarAddPayload;
window.PNXSearchPostTournamentToParentCalendar = function(id) {
  const t = DUMMY_TOURNAMENTS.find(x => x.id === id);
  return postTournamentToParentCalendar(t);
};

/**
 * お気に入りをトグルする
 * ─ setFavorited() で APP_STATE / DUMMY_TOURNAMENTS / localStorage を更新。
 * ─ DOM query でカードのハートボタンを直接更新し、BS ヘッダーも同期。
 * ─ お気に入りフィルター中に解除した場合はリストを再描画して除去。
 *
 * STEP2: setFavorited() 内の STEP2 コメント箇所に Firestore write を追加する。
 */
function toggleFav(id) {
  const t = DUMMY_TOURNAMENTS.find(x => x.id === id);
  if (!t) return;

  // setFavorited が APP_STATE.favorites と t.favorited の両方を更新
  setFavorited(id, !isFavorited(id));

  // SVG共通定義
  const heartFilled  = `<svg width="15" height="15" viewBox="0 0 24 24" fill="#FF3B30" stroke="#FF3B30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
  const heartOutline = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

  // ── カード上のハートボタンを更新 ──
  const cardFavBtn = document.querySelector(`.tc-fav-btn[data-id="${id}"]`);
  if (cardFavBtn) {
    if (t.favorited) {
      cardFavBtn.classList.add('active');
      cardFavBtn.innerHTML = heartFilled;
      cardFavBtn.setAttribute('aria-label', 'お気に入り解除');
      // iOS spring pop アニメーション
      cardFavBtn.classList.remove('fav-pop');
      void cardFavBtn.offsetWidth; // reflow でアニメリセット
      cardFavBtn.classList.add('fav-pop');
    } else {
      cardFavBtn.classList.remove('active');
      cardFavBtn.innerHTML = heartOutline;
      cardFavBtn.setAttribute('aria-label', 'お気に入り登録');
    }
  }

  // ── BSヘッダーのハートボタンを同期 ──
  _syncBSFavBtn(t);

  // BSヘッダーのpopアニメーション（登録時のみ・BS開いている場合）
  if (t.favorited && APP_STATE.bsOpen) {
    const bsFavBtn = document.getElementById('bs-fav-btn');
    if (bsFavBtn) {
      bsFavBtn.classList.remove('fav-pop');
      void bsFavBtn.offsetWidth; // reflow でアニメリセット
      bsFavBtn.classList.add('fav-pop');
    }
  }

  // ── お気に入りフィルター中なら外れた大会はリストから消える ──
  if (!t.favorited && APP_STATE.activeFilters.has('fav')) {
    applyFiltersAndRender();
  }

  // ── ログ ──
  console.log(`[ProNexaX] ${t.favorited ? '❤️' : '🤍'} お気に入り${t.favorited ? '登録' : '解除'}: ${t.name}`);
}

/**
 * BSヘッダーのお気に入りボタン状態を同期
 */
function _syncBSFavBtn(t) {
  const bsFavBtn = document.getElementById('bs-fav-btn');
  if (!bsFavBtn) return;

  if (t && t.favorited) {
    bsFavBtn.classList.add('active');
    bsFavBtn.setAttribute('aria-label', 'お気に入り解除');
    bsFavBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="#FF3B30" stroke="#FF3B30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
  } else {
    bsFavBtn.classList.remove('active');
    bsFavBtn.setAttribute('aria-label', 'お気に入り登録');
    bsFavBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
  }
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
   § 9  開催地フィルター Bottom Sheet + 下部タブバー
   ─ 開催地 BS は大会詳細 BS より低い z-index（490/491）で競合しない。
   ─ _pendingAreaKey: シート内での未確定選択（「適用」前の一時状態）。
   ─ 「適用」タップで APP_STATE.selectedArea を確定し applyFiltersAndRender を呼ぶ。
   ================================================================ */

/**
 * エリア（地方）マスター
 * ─ key: APP_STATE.selectedArea / DUMMY_TOURNAMENTS[].area と対応する。
 * ─ STEP2: 本体 AREA_FILTERS と統一する場合は key 名を合わせてリネームする。
 */
const AREA_REGIONS = [
  { key: 'all',      label: 'すべての地域', icon: '🗾',  areas: [] },
  { key: 'hokkaido', label: '北海道',        icon: '🐻',  areas: ['hokkaido'] },
  { key: 'tohoku',   label: '東北',           icon: '🍎',  areas: ['aomori','iwate','miyagi','akita','yamagata','fukushima'] },
  { key: 'kanto',    label: '関東',           icon: '🗼',  areas: ['kanto','tokyo','kanagawa','saitama','chiba','ibaraki','tochigi','gunma'] },
  { key: 'chubu',    label: '中部・北陸',     icon: '🗻',  areas: ['tokai','chubu','niigata','toyama','ishikawa','fukui','nagano','yamanashi','shizuoka','aichi','gifu','mie'] },
  { key: 'kinki',    label: '近畿',           icon: '🏯',  areas: ['kinki','osaka','kyoto','hyogo','nara','shiga','wakayama'] },
  { key: 'chugoku',  label: '中国',           icon: '⛩️',  areas: ['tottori','shimane','okayama','hiroshima','yamaguchi'] },
  { key: 'shikoku',  label: '四国',           icon: '🌊',  areas: ['tokushima','kagawa','ehime','kochi'] },
  { key: 'kyushu',   label: '九州・沖縄',     icon: '🌺',  areas: ['kyushu','fukuoka','saga','nagasaki','kumamoto','oita','miyazaki','kagoshima','okinawa'] },
];

let _pendingAreaKey = 'all';       // エリアシート内の未確定選択（「適用」前の UI 一時状態）

const areaOverlay = document.getElementById('area-overlay');
const areaSheet   = document.getElementById('area-sheet');
let _areaIsOpen   = false;

/**
 * 開催地シートを開く
 */
function openAreaSheet() {
  if (_areaIsOpen) return;

  // 大会詳細シートが開いていたら先に閉じる
  if (APP_STATE.bsOpen) closeBottomSheet();

  _areaIsOpen = true;
  _pendingAreaKey = APP_STATE.selectedArea;  // 現在の確定値をプレビュー用にコピー

  renderAreaGrid();

  areaSheet.removeAttribute('aria-hidden');
  areaOverlay.setAttribute('aria-hidden', 'false');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      areaOverlay.classList.add('open');
      areaSheet.classList.add('open');
    });
  });

  // 背景スクロール固定
  scrollArea.style.overflow = 'hidden';
  scrollArea.style.touchAction = 'none';
}

/**
 * 開催地シートを閉じる（キャンセル）
 */
function closeAreaSheet() {
  if (!_areaIsOpen) return;
  _areaIsOpen = false;

  areaOverlay.classList.remove('open');
  areaSheet.classList.remove('open');
  areaSheet.setAttribute('aria-hidden', 'true');
  areaOverlay.setAttribute('aria-hidden', 'true');

  setTimeout(() => {
    scrollArea.style.overflow = '';
    scrollArea.style.touchAction = '';
  }, 440);
}

/**
 * 開催地グリッドを描画
 */
function renderAreaGrid() {
  const grid = document.getElementById('area-grid');
  if (!grid) return;

  grid.innerHTML = AREA_REGIONS.map(region => `
    <button
      class="area-btn${region.key === 'all' ? ' all-areas' : ''}${_pendingAreaKey === region.key ? ' active' : ''}"
      data-area="${region.key}"
      aria-pressed="${_pendingAreaKey === region.key}"
    >
      <span class="area-btn-icon">${region.icon}</span>
      <span class="area-btn-label">${region.label}</span>
    </button>
  `).join('');

  grid.querySelectorAll('.area-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _pendingAreaKey = btn.dataset.area;
      // グリッド内のアクティブを即切替（confirmする前でも見た目を更新）
      grid.querySelectorAll('.area-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.area === _pendingAreaKey);
        b.setAttribute('aria-pressed', b.dataset.area === _pendingAreaKey);
      });
    });
  });
}

// 「この地域で絞り込む」ボタン
document.getElementById('area-apply-btn')?.addEventListener('click', () => {
  APP_STATE.selectedArea = _pendingAreaKey;

  // 開催地フィルターのアクティブ状態を更新
  if (APP_STATE.selectedArea === 'all') {
    APP_STATE.activeFilters.delete('area');
  } else {
    APP_STATE.activeFilters.add('area');
  }

  closeAreaSheet();
  renderConditionFilters();
  applyFiltersAndRender();
});

// 「リセット」ボタン
document.getElementById('area-reset-btn')?.addEventListener('click', () => {
  _pendingAreaKey = 'all';
  renderAreaGrid();
});

// 背景タップで閉じる
areaOverlay.addEventListener('click', closeAreaSheet);

// 閉じるボタン
document.getElementById('area-close-btn')?.addEventListener('click', closeAreaSheet);

// 下部タブバー: 各タブのページ遷移
// STEP2: 本体アプリのルーター / Capacitor Navigation に差し替える
document.querySelectorAll('.tab-item[data-page]').forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.dataset.page;
    if (page === 'search') return; // 試合タブ = 現在のページ
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
   § 9.7  詳細フィルター Bottom Sheet
   ─ z-index 493/494: 開催地 BS(490/491) と 大会詳細 BS(500/501) の間
   ─ _pendingDF: シート内の未確定選択（「この条件で検索」前の一時状態）
   ─ 「この条件で検索」で APP_STATE.detailFilters に反映 → applyFiltersAndRender
   ================================================================ */

let _dfIsOpen  = false;
let _pendingDF = null;   // openDetailFilterSheet 時に APP_STATE.detailFilters をコピー

const dfOverlay = document.getElementById('df-overlay');
const dfSheet   = document.getElementById('df-sheet');

/** detailFilters オブジェクトをディープコピー */
function _cloneDF(df) {
  return {
    areas:       new Set(df.areas),
    categories:  new Set(df.categories),
    gender:      df.gender,
    statuses:    new Set(df.statuses),
    timing:      df.timing,
    prizeMin:    df.prizeMin,
    entryFeeMax: df.entryFeeMax,
  };
}

/** 空の detailFilters を生成 */
function _emptyDF() {
  return { areas: new Set(), categories: new Set(), gender: '',
           statuses: new Set(), timing: '', prizeMin: '', entryFeeMax: '' };
}

/**
 * 詳細フィルターシートを開く
 * ─ 大会詳細 BS / 開催地 BS が開いていれば先に閉じる。
 */
function openDetailFilterSheet() {
  if (_dfIsOpen) return;
  if (APP_STATE.bsOpen)  closeBottomSheet();
  if (_areaIsOpen) closeAreaSheet();

  _dfIsOpen  = true;
  _pendingDF = _cloneDF(APP_STATE.detailFilters);

  renderDetailFilterBody();

  dfSheet.removeAttribute('aria-hidden');
  dfOverlay.setAttribute('aria-hidden', 'false');
  scrollArea.style.overflow   = 'hidden';
  scrollArea.style.touchAction = 'none';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      dfOverlay.classList.add('open');
      dfSheet.classList.add('open');
    });
  });
}

/**
 * 詳細フィルターシートを閉じる
 */
function closeDetailFilterSheet() {
  if (!_dfIsOpen) return;
  _dfIsOpen = false;

  dfOverlay.classList.remove('open');
  dfSheet.classList.remove('open');
  dfSheet.setAttribute('aria-hidden', 'true');
  dfOverlay.setAttribute('aria-hidden', 'true');

  setTimeout(() => {
    scrollArea.style.overflow    = '';
    scrollArea.style.touchAction = '';
  }, 440);
}

/**
 * df-body の中身を _pendingDF の状態で描画する
 * ─ チップタップ時も部分更新せず、同セクション内の active クラスのみ更新する。
 */
function renderDetailFilterBody() {
  const body = document.getElementById('df-body');
  if (!body) return;

  body.innerHTML = DF_SECTIONS.map(section => `
    <div class="df-section">
      <p class="df-section-title">${section.label}</p>
      <div class="df-chips">
        ${section.chips.map(chip => {
          const isActive = section.multi
            ? _pendingDF[section.key].has(chip.key)
            : _pendingDF[section.key] === chip.key;
          return `<button
            class="df-chip${isActive ? ' active' : ''}"
            data-section="${section.key}"
            data-key="${chip.key}"
            data-multi="${section.multi}"
            aria-pressed="${isActive}"
          >${chip.label}</button>`;
        }).join('')}
      </div>
    </div>
  `).join('');

  // チップタップイベント
  body.querySelectorAll('.df-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const sKey   = chip.dataset.section;
      const cKey   = chip.dataset.key;
      const isMulti = chip.dataset.multi === 'true';

      if (isMulti) {
        _pendingDF[sKey].has(cKey) ? _pendingDF[sKey].delete(cKey) : _pendingDF[sKey].add(cKey);
      } else {
        // 再タップで解除
        _pendingDF[sKey] = _pendingDF[sKey] === cKey ? '' : cKey;
      }

      // 同セクション内のチップ active のみ更新（全再描画しない）
      body.querySelectorAll(`.df-chip[data-section="${sKey}"]`).forEach(c => {
        const active = isMulti
          ? _pendingDF[sKey].has(c.dataset.key)
          : _pendingDF[sKey] === c.dataset.key;
        c.classList.toggle('active', active);
        c.setAttribute('aria-pressed', active);
      });
    });
  });
}

// ── 「この条件で検索」ボタン ──
document.getElementById('df-apply-btn')?.addEventListener('click', () => {
  APP_STATE.detailFilters = _cloneDF(_pendingDF);
  updateFilterBadge();
  closeDetailFilterSheet();
  applyFiltersAndRender();
  const cnt = getDetailFilterCount();
  if (cnt > 0) showToast(`詳細条件 ${cnt}件 を適用しました`);
});

// ── 「リセット」ボタン ── 条件を即時クリアして閉じる
document.getElementById('df-reset-btn')?.addEventListener('click', () => {
  _pendingDF = _emptyDF();
  APP_STATE.detailFilters = _emptyDF();
  updateFilterBadge();
  closeDetailFilterSheet();
  applyFiltersAndRender();
  showToast('詳細フィルターをリセットしました');
});

// ── 背景タップで閉じる ──
dfOverlay?.addEventListener('click', closeDetailFilterSheet);

// ── 閉じるボタン ──
document.getElementById('df-close-btn')?.addEventListener('click', closeDetailFilterSheet);

// ── Esc キー ──
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && _dfIsOpen) closeDetailFilterSheet();
});

// ── スワイプダウンで閉じる ──
;(function initDFSwipeDown() {
  const handle = document.getElementById('df-handle-wrap');
  if (!handle) return;
  let startY = 0, isDragging = false, startTime = 0;

  handle.addEventListener('touchstart', e => {
    if (!_dfIsOpen) return;
    startY = e.touches[0].clientY;
    startTime = Date.now();
    isDragging = true;
  }, { passive: true });

  handle.addEventListener('touchmove', e => {
    if (!isDragging || !_dfIsOpen) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 0) {
      dfSheet.style.transition = 'none';
      dfSheet.style.transform  = `translateX(-50%) translateY(${dy}px)`;
    }
  }, { passive: true });

  handle.addEventListener('touchend', e => {
    if (!isDragging) return;
    isDragging = false;
    const dy       = e.changedTouches[0].clientY - startY;
    const velocity = dy / (Date.now() - startTime);
    if (dy > 80 || velocity > 0.5) {
      dfSheet.style.transition = '';
      dfSheet.style.transform  = '';
      closeDetailFilterSheet();
    } else {
      dfSheet.style.transition = 'transform .32s cubic-bezier(0.32, 0.72, 0, 1)';
      dfSheet.style.transform  = 'translateX(-50%) translateY(0)';
      setTimeout(() => { dfSheet.style.transition = ''; dfSheet.style.transform = ''; }, 340);
    }
  }, { passive: true });
})();


/* ================================================================
   § 10 検索バー・ソートタブ イベント接続
   ─ 入力値を APP_STATE.searchQuery に反映し applyFiltersAndRender() を呼ぶ。
   ─ 検索はデバウンス 220ms（タイプ中の連続発火を防止）。
   ================================================================ */

// 検索バー入力
const searchInput = document.getElementById('search-input');
if (searchInput) {
  let searchTimer = null;
  searchInput.addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      APP_STATE.searchQuery = e.target.value;
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
    APP_STATE.sortKey = tab.dataset.sort;
    applyFiltersAndRender();
  });
});

// 詳細フィルターボタン（ヘッダー右のスライダーアイコン）→ 詳細フィルター BS を開く
document.getElementById('btn-filter')?.addEventListener('click', openDetailFilterSheet);


/* ================================================================
   § CAL  カレンダービュー
   ─ Appleカレンダー × TimeTree 風のミニ月カレンダー。
   ─ 大会開始日 / エントリー締切日 / 期間中 の日付にドットを表示。
   ─ 日付タップ → 日付別大会 Bottom Sheet を開く。
   ================================================================ */

/** カレンダー表示状態 */
const CAL_STATE = (() => {
  // 最初の大会がある月をデフォルトにする
  const earliest = DUMMY_TOURNAMENTS.reduce((min, t) =>
    (!min || t.start < min) ? t.start : min, null);
  const d = earliest ? new Date(earliest) : new Date();
  return { year: d.getFullYear(), month: d.getMonth(), selectedDate: null };
})();

/**
 * 指定日に関連する大会を返す
 * - 期間内 (start <= ds <= end) の大会
 * - エントリー締切が ds の大会
 */
function _toursRelatedToDate(ds) {
  const during   = DUMMY_TOURNAMENTS.filter(t => t.start <= ds && ds <= t.end);
  const deadline = DUMMY_TOURNAMENTS.filter(t => t.entryDeadline === ds && !during.find(x => x.id === t.id));
  return { during, deadline };
}

/**
 * 日付セルのドット情報を返す（max 3個）
 */
function _dotsForDate(ds) {
  const { during, deadline } = _toursRelatedToDate(ds);
  const dots = [];

  deadline.forEach(t => {
    const cls = t.status === 'near' ? 'dot-red' : 'dot-orange';
    dots.push(cls);
  });
  during.forEach(t => {
    if (t.start === ds) {
      // カテゴリ色マッピング
      const catDot = { jgto:'dot-green', lpga:'dot-purple', qt:'dot-blue',
                       mini:'dot-green', open:'dot-orange', student:'dot-purple',
                       abroad:'dot-blue', asian:'dot-green', pga:'dot-blue',
                       other:'dot-green' }[t.cat] || 'dot-green';
      dots.push(catDot);
    } else {
      dots.push('dot-gray');
    }
  });

  return [...new Set(dots)].slice(0, 3);
}

/**
 * カレンダーセクションを描画する
 */
function renderCalendarSection() {
  const container = document.getElementById('cal-card');
  if (!container) return;

  const { year, month } = CAL_STATE;
  const firstDow   = new Date(year, month, 1).getDay();   // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr   = new Date().toISOString().slice(0, 10);
  const dayNames   = ['日','月','火','水','木','金','土'];
  const monthLabel = `${year}年${month + 1}月`;

  // ── 日付セル生成 ──
  let cells = '';
  for (let i = 0; i < firstDow; i++) {
    cells += '<div class="cal-cell cal-cell-empty"></div>';
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const ds   = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dots = _dotsForDate(ds);
    const dow  = (firstDow + d - 1) % 7;
    const isToday    = ds === todayStr;
    const isSelected = ds === CAL_STATE.selectedDate;
    const hasEvent   = dots.length > 0;

    let cls = 'cal-cell';
    if (isToday)    cls += ' cal-today';
    if (isSelected) cls += ' cal-selected';
    if (hasEvent)   cls += ' cal-has-event';
    else            cls += ' cal-no-event';
    if (dow === 0)  cls += ' cal-sun';
    if (dow === 6)  cls += ' cal-sat';

    const dotsHTML = dots.map(c => `<span class="cal-dot ${c}"></span>`).join('');

    cells += `
      <div class="${cls}" data-date="${ds}"${hasEvent ? ' role="button" tabindex="0"' : ''}>
        <span class="cal-day-num">${d}</span>
        <div class="cal-dots">${dotsHTML}</div>
      </div>`;
  }

  container.innerHTML = `
    <div class="cal-nav">
      <button class="cal-nav-btn" id="cal-prev" aria-label="前の月">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span class="cal-month-label">${monthLabel}</span>
      <button class="cal-nav-btn" id="cal-next" aria-label="次の月">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
    <div class="cal-day-names">
      ${dayNames.map((n, i) => `<div class="cal-day-name${i===0?' cal-sun':i===6?' cal-sat':''}">${n}</div>`).join('')}
    </div>
    <div class="cal-grid">${cells}</div>
    <div class="cal-legend">
      <span class="cal-legend-item"><span class="cal-dot dot-green"></span>開幕日</span>
      <span class="cal-legend-item"><span class="cal-dot dot-red"></span>締切間近</span>
      <span class="cal-legend-item"><span class="cal-dot dot-orange"></span>締切日</span>
      <span class="cal-legend-item"><span class="cal-dot dot-gray"></span>開催中</span>
    </div>
  `;

  // ── < > 月移動 ──
  document.getElementById('cal-prev')?.addEventListener('click', () => {
    if (CAL_STATE.month === 0) { CAL_STATE.year--; CAL_STATE.month = 11; }
    else { CAL_STATE.month--; }
    CAL_STATE.selectedDate = null;
    renderCalendarSection();
  });
  document.getElementById('cal-next')?.addEventListener('click', () => {
    if (CAL_STATE.month === 11) { CAL_STATE.year++; CAL_STATE.month = 0; }
    else { CAL_STATE.month++; }
    CAL_STATE.selectedDate = null;
    renderCalendarSection();
  });

  // ── 日付タップ → 日付別BS ──
  container.querySelectorAll('.cal-cell.cal-has-event').forEach(cell => {
    cell.addEventListener('click', () => {
      const ds = cell.dataset.date;
      CAL_STATE.selectedDate = ds;
      renderCalendarSection(); // 選択状態を更新
      openDaySheet(ds);
    });
  });
}

// 「今月へ」ボタン
document.getElementById('cal-today-btn')?.addEventListener('click', () => {
  const now = new Date();
  CAL_STATE.year  = now.getFullYear();
  CAL_STATE.month = now.getMonth();
  CAL_STATE.selectedDate = null;
  renderCalendarSection();
});


/* ================================================================
   § DAY_BS  日付別大会 Bottom Sheet
   ─ z-index: 496/497（大会詳細 BS 500/501 より下）
   ─ カードタップ → 大会詳細 BS へ引き渡す
   ================================================================ */

const dayOverlay  = document.getElementById('day-overlay');
const daySheet    = document.getElementById('day-sheet');
let   _daySheetOpen = false;
let   _dayCloseTimer = null;

function openDaySheet(ds) {
  if (_daySheetOpen) { closeDaySheet(); }
  _daySheetOpen = true;
  if (_dayCloseTimer) { clearTimeout(_dayCloseTimer); _dayCloseTimer = null; }

  renderDaySheetContent(ds);
  daySheet.removeAttribute('aria-hidden');
  scrollArea.style.overflow    = 'hidden';
  scrollArea.style.touchAction = 'none';

  requestAnimationFrame(() => requestAnimationFrame(() => {
    dayOverlay.classList.add('open');
    daySheet.classList.add('open');
  }));
}

function closeDaySheet() {
  if (!_daySheetOpen) return;
  _daySheetOpen = false;

  dayOverlay.classList.remove('open');
  daySheet.classList.remove('open');
  daySheet.setAttribute('aria-hidden', 'true');

  _dayCloseTimer = setTimeout(() => {
    if (!_catSheetOpen && !APP_STATE.bsOpen) {
      scrollArea.style.overflow    = '';
      scrollArea.style.touchAction = '';
    }
    CAL_STATE.selectedDate = null;
    renderCalendarSection();
    _dayCloseTimer = null;
  }, 400);
}

/** 日付別ミニカードHTML */
function _dayMiniCardHTML(t, ds) {
  const brand   = catBrandConfig(t.cat);
  const isStart = t.start === ds;
  const isEnd   = t.end   === ds;
  const isDeadline = t.entryDeadline === ds;
  const isOngoing  = t.start < ds && ds < t.end;

  let tags = '';
  if (isDeadline) tags += `<span class="day-tag day-tag-deadline">締切日</span>`;
  if (isStart)    tags += `<span class="day-tag day-tag-start">開幕</span>`;
  if (isEnd)      tags += `<span class="day-tag day-tag-end">最終日</span>`;
  if (isOngoing)  tags += `<span class="day-tag day-tag-open">開催中</span>`;

  const favSVGFill    = `<svg width="16" height="16" viewBox="0 0 24 24" fill="#FF3B30" stroke="#FF3B30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
  const favSVGOutline = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

  return `
    <div class="day-mini-card" data-id="${t.id}" role="button">
      <div class="day-card-brand ${brand.cls}">
        <span class="day-brand-abbr">${brand.label}</span>
      </div>
      <div class="day-card-info">
        <div class="day-card-tags">${tags}</div>
        <p class="day-card-name">${t.name}</p>
        <p class="day-card-meta">${t.course} · ${areaLabelFromKey(t.area)}</p>
      </div>
      <div class="day-card-actions">
        <button class="day-fav-btn${t.favorited ? ' active' : ''}"
          data-id="${t.id}"
          aria-label="${t.favorited ? 'お気に入り解除' : 'お気に入り登録'}">
          ${t.favorited ? favSVGFill : favSVGOutline}
        </button>
      </div>
    </div>
  `;
}

function renderDaySheetContent(ds) {
  const d    = new Date(ds);
  const days = ['日','月','火','水','木','金','土'];
  const label = `${d.getMonth()+1}月${d.getDate()}日(${days[d.getDay()]})`;
  document.getElementById('day-sheet-title').textContent = label + ' の大会';

  const { during, deadline } = _toursRelatedToDate(ds);
  // deadline は期間外締切のみ during にも含む場合は start 等で tag を付ける
  const allT = [...during];
  deadline.forEach(t => { if (!allT.find(x=>x.id===t.id)) allT.push(t); });

  const body = document.getElementById('day-sheet-body');
  if (!body) return;

  if (allT.length === 0) {
    body.innerHTML = `
      <div class="s-empty" style="padding:48px 24px;">
        <div class="s-empty-icon">📅</div>
        <p class="s-empty-title">この日の大会なし</p>
        <p class="s-empty-sub">他の日付を選んでみてください</p>
      </div>`;
    return;
  }

  body.innerHTML = `
    <div class="day-count">${allT.length}件の大会</div>
    <div class="day-list">
      ${allT.map(t => _dayMiniCardHTML(t, ds)).join('')}
    </div>`;

  // カードタップ → 大会詳細BS
  body.querySelectorAll('.day-mini-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.day-fav-btn')) return;
      const id = card.dataset.id;
      closeDaySheet();
      setTimeout(() => openBottomSheet(id), 340);
    });
  });

  // お気に入りボタン
  body.querySelectorAll('.day-fav-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      toggleFav(id);
      // ボタン表示を即更新
      const t = DUMMY_TOURNAMENTS.find(x => x.id === id);
      if (!t) return;
      const fill    = `<svg width="16" height="16" viewBox="0 0 24 24" fill="#FF3B30" stroke="#FF3B30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
      const outline = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
      btn.innerHTML = t.favorited ? fill : outline;
      btn.classList.toggle('active', t.favorited);
      btn.setAttribute('aria-label', t.favorited ? 'お気に入り解除' : 'お気に入り登録');
    });
  });
}

// Day BS イベント
dayOverlay?.addEventListener('click', closeDaySheet);
document.getElementById('day-close-btn')?.addEventListener('click', closeDaySheet);

// Day BS スワイプダウン
;(function initDaySwipeDown() {
  const handle = document.getElementById('day-handle-wrap');
  if (!handle) return;
  let sy = 0, isDrag = false, st = 0;
  handle.addEventListener('touchstart', e => {
    if (!_daySheetOpen) return;
    sy = e.touches[0].clientY; st = Date.now(); isDrag = true;
  }, { passive: true });
  handle.addEventListener('touchmove', e => {
    if (!isDrag) return;
    const dy = e.touches[0].clientY - sy;
    if (dy > 0) { daySheet.style.transition='none'; daySheet.style.transform=`translateX(-50%) translateY(${dy}px)`; }
  }, { passive: true });
  handle.addEventListener('touchend', e => {
    if (!isDrag) return; isDrag = false;
    const dy = e.changedTouches[0].clientY - sy;
    const v  = dy / (Date.now() - st);
    if (dy > 80 || v > 0.5) { daySheet.style.transition=''; daySheet.style.transform=''; closeDaySheet(); }
    else { daySheet.style.transition='transform .32s cubic-bezier(0.32,0.72,0,1)'; daySheet.style.transform='translateX(-50%) translateY(0)'; setTimeout(()=>{daySheet.style.transition='';daySheet.style.transform='';},340); }
  }, { passive: true });
})();


/* ================================================================
   § CAT_BS  カテゴリ詳細 Bottom Sheet
   ─ z-index: 498/499
   ─ カテゴリグリッドタップ → カテゴリ専用ページ風 BS を開く
   ─ ソートタブ（おすすめ / 開催日順 / 締切日順）
   ─ 大会カードタップ → 大会詳細 BS へ引き渡す（z=500/501 が上に乗る）
   ================================================================ */


const catOverlay  = document.getElementById('cat-overlay');
const catSheet    = document.getElementById('cat-sheet');
let   _catSheetOpen = false;
let   _catKey     = null;
let   _catSortKey = 'recommend';
let   _catCloseTimer = null;

function openCategorySheet(key) {
  if (_catSheetOpen) { closeCategorySheet(); }
  _catSheetOpen = true;
  _catKey       = key;
  _catSortKey   = 'recommend';
  if (_catCloseTimer) { clearTimeout(_catCloseTimer); _catCloseTimer = null; }

  renderCategorySheetContent();
  catSheet.removeAttribute('aria-hidden');
  scrollArea.style.overflow    = 'hidden';
  scrollArea.style.touchAction = 'none';

  requestAnimationFrame(() => requestAnimationFrame(() => {
    catOverlay.classList.add('open');
    catSheet.classList.add('open');
  }));
}

function closeCategorySheet() {
  if (!_catSheetOpen) return;
  _catSheetOpen = false;

  catOverlay.classList.remove('open');
  catSheet.classList.remove('open');
  catSheet.setAttribute('aria-hidden', 'true');

  _catCloseTimer = setTimeout(() => {
    if (!_daySheetOpen && !APP_STATE.bsOpen) {
      scrollArea.style.overflow    = '';
      scrollArea.style.touchAction = '';
    }
    _catCloseTimer = null;
  }, 400);
}

function renderCategorySheetContent() {
  const brand = catBrandConfig(_catKey);
  const tours = sortTournaments(
    DUMMY_TOURNAMENTS.filter(t => t.cat === _catKey),
    _catSortKey
  );

  // ── カテゴリ名をヘッダーに反映 ──
  document.getElementById('cat-sheet-title').textContent = brand.sub || brand.label;

  // ── ヒーロー ──
  const hero = document.getElementById('cat-hero-wrap');
  if (hero) {
    const isFavCat = isCatFavorited(_catKey);
    hero.className = `cat-hero-wrap ${brand.cls}`;
    hero.innerHTML = `
      <div class="bs-hero-overlay"></div>
      <div class="bs-hero-brand">
        <div class="bs-hero-brand-label">${brand.label}</div>
        <div class="bs-hero-brand-sub">${brand.sub}</div>
      </div>
      <div class="cat-hero-count">${tours.length}件</div>
      <button
        id="cat-hero-fav-btn"
        class="cat-hero-fav-btn${isFavCat ? ' active' : ''}"
        aria-label="${isFavCat ? 'お気に入り解除' : 'お気に入り登録'}"
        data-cat="${_catKey}"
      >
        <svg width="18" height="18" viewBox="0 0 24 24"
          fill="${isFavCat ? 'currentColor' : 'none'}"
          stroke="currentColor" stroke-width="2.2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
    `;

    // ハートボタンタップイベント
    const favBtn = hero.querySelector('#cat-hero-fav-btn');
    if (favBtn) {
      favBtn.addEventListener('click', e => {
        e.stopPropagation();
        toggleCatFav(favBtn.dataset.cat);
        // SVG の fill をトグル
        const isNow = isCatFavorited(favBtn.dataset.cat);
        const svg = favBtn.querySelector('svg');
        if (svg) svg.setAttribute('fill', isNow ? 'currentColor' : 'none');
      });
    }
  }

  // ── ソートタブ active 切り替え ──
  const sortTabs = document.getElementById('cat-sort-tabs');
  if (sortTabs) {
    sortTabs.querySelectorAll('.cat-sort-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.sort === _catSortKey);
    });
  }

  // ── 大会カードリスト ──
  const body = document.getElementById('cat-body');
  if (!body) return;

  if (tours.length === 0) {
    body.innerHTML = `
      <div class="s-empty" style="padding:48px 24px;">
        <div class="s-empty-icon">🔍</div>
        <p class="s-empty-title">大会なし</p>
        <p class="s-empty-sub">このカテゴリの大会は現在ありません</p>
      </div>`;
    return;
  }

  body.innerHTML = `<div style="padding:12px 14px 24px;">${tours.map(tournamentCardHTML).join('')}</div>`;

  // カードタップ → 大会詳細BS（カテゴリBS上に乗る、z=500/501）
  body.querySelectorAll('.s-tournament-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.tc-btn') || e.target.closest('.tc-fav-btn')) return;
      const id = card.dataset.id;
      card.classList.add('tapping');
      setTimeout(() => {
        card.classList.remove('tapping');
        openBottomSheet(id);   // カテゴリBS の上に重なる（z=500/501）
      }, 90);
    });
  });
}

// Cat BS イベント
catOverlay?.addEventListener('click', closeCategorySheet);
document.getElementById('cat-close-btn')?.addEventListener('click', closeCategorySheet);

// Cat BS ソートタブ
document.getElementById('cat-sort-tabs')?.querySelectorAll('.cat-sort-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    _catSortKey = tab.dataset.sort;
    renderCategorySheetContent();
  });
});

// Cat BS スワイプダウン
;(function initCatSwipeDown() {
  const handle = document.getElementById('cat-handle-wrap');
  if (!handle) return;
  let sy = 0, isDrag = false, st = 0;
  handle.addEventListener('touchstart', e => {
    if (!_catSheetOpen) return;
    sy = e.touches[0].clientY; st = Date.now(); isDrag = true;
  }, { passive: true });
  handle.addEventListener('touchmove', e => {
    if (!isDrag) return;
    const dy = e.touches[0].clientY - sy;
    if (dy > 0) { catSheet.style.transition='none'; catSheet.style.transform=`translateX(-50%) translateY(${dy}px)`; }
  }, { passive: true });
  handle.addEventListener('touchend', e => {
    if (!isDrag) return; isDrag = false;
    const dy = e.changedTouches[0].clientY - sy;
    const v  = dy / (Date.now() - st);
    if (dy > 80 || v > 0.5) { catSheet.style.transition=''; catSheet.style.transform=''; closeCategorySheet(); }
    else { catSheet.style.transition='transform .32s cubic-bezier(0.32,0.72,0,1)'; catSheet.style.transform='translateX(-50%) translateY(0)'; setTimeout(()=>{catSheet.style.transition='';catSheet.style.transform='';},340); }
  }, { passive: true });
})();


/* ================================================================
   § CAT_SEL  カテゴリ追加 Bottom Sheet（＋ボタンから開く）
   ─ z-index: 486（overlay） / 487（sheet）
   ─ CATEGORY_EXTRA を表示。行タップ → extraCategories に追加/解除 → チップ即時更新。
   ─ ♡ タップ → toggleCatFav（favCategories を更新）。
   ─ 「完了」ボタン or 背景タップ or スワイプダウンで閉じる。
   ================================================================ */

const _catSelOverlay = document.getElementById('cat-sel-overlay');
const _catSelSheet   = document.getElementById('cat-sel-sheet');
let   _catSelOpen    = false;

function openCategorySelectSheet() {
  if (_catSelOpen) return;
  _catSelOpen = true;

  renderCategorySelectList();

  _catSelSheet.removeAttribute('aria-hidden');
  _catSelOverlay.setAttribute('aria-hidden', 'false');
  scrollArea.style.overflow    = 'hidden';
  scrollArea.style.touchAction = 'none';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      _catSelOverlay.classList.add('open');
      _catSelSheet.classList.add('open');
    });
  });
}

function closeCategorySelectSheet() {
  if (!_catSelOpen) return;
  _catSelOpen = false;

  _catSelOverlay.classList.remove('open');
  _catSelSheet.classList.remove('open');
  _catSelSheet.setAttribute('aria-hidden', 'true');
  _catSelOverlay.setAttribute('aria-hidden', 'true');

  setTimeout(() => {
    scrollArea.style.overflow    = '';
    scrollArea.style.touchAction = '';
  }, 380);
}

/**
 * カテゴリ追加シートの行リストを描画する
 * ─ 各行: [icon] カテゴリ名・件数  [♡] [追加/解除ボタン]
 * ─ 追加済みは行にチェックマーク付き
 */
function renderCategorySelectList() {
  const body = document.getElementById('cat-sel-body');
  if (!body) return;

  // 件数マップ（現在の性別フィルターを考慮）
  const counts = {};
  DUMMY_TOURNAMENTS.forEach(t => {
    if (APP_STATE.selectedGender !== 'all' && t.gender !== APP_STATE.selectedGender) return;
    counts[t.cat] = (counts[t.cat] || 0) + 1;
  });

  body.innerHTML = CATEGORY_EXTRA.map(cat => {
    const cnt      = counts[cat.key] || 0;
    const isFav    = isCatFavorited(cat.key);
    const isAdded  = APP_STATE.extraCategories.has(cat.key);
    return `
      <div class="cat-sel-row${isAdded ? ' added' : ''}" data-key="${cat.key}" role="button" tabindex="0"
           aria-label="${cat.label}${isAdded ? '（追加済み）' : ''} ${cnt}件">
        <div class="cat-sel-row-icon">${cat.icon}</div>
        <div class="cat-sel-row-info">
          <span class="cat-sel-row-name">${cat.label}</span>
          <span class="cat-sel-row-sub">${cat.sub}</span>
        </div>
        <div class="cat-sel-row-right">
          <span class="cat-sel-row-count">${cnt > 0 ? cnt + '件' : '—'}</span>
          <button class="cat-sel-row-fav${isFav ? ' active' : ''}"
                  data-key="${cat.key}"
                  aria-label="${isFav ? 'お気に入り解除' : 'お気に入り登録'}"
          >${isFav ? '♥' : '♡'}</button>
          <button class="cat-sel-row-add${isAdded ? ' added' : ''}"
                  data-key="${cat.key}"
                  aria-label="${isAdded ? 'チップから削除' : 'チップに追加'}"
          >${isAdded ? '✓' : '＋'}</button>
        </div>
      </div>`;
  }).join('');

  // ── 追加/解除ボタン（＋/✓）タップ ──
  body.querySelectorAll('.cat-sel-row-add').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const key     = btn.dataset.key;
      const wasAdded = APP_STATE.extraCategories.has(key);

      if (wasAdded) {
        APP_STATE.extraCategories.delete(key);
        // 選択中だった場合はリセット
        if (APP_STATE.selectedCategory === key) APP_STATE.selectedCategory = 'all';
      } else {
        APP_STATE.extraCategories.add(key);
      }

      saveStateToLocalStorage();
      renderCategoryChips();
      applyFiltersAndRender();

      // 行の表示を即更新
      const row = btn.closest('.cat-sel-row');
      const isNowAdded = APP_STATE.extraCategories.has(key);
      btn.textContent = isNowAdded ? '✓' : '＋';
      btn.classList.toggle('added', isNowAdded);
      btn.setAttribute('aria-label', isNowAdded ? 'チップから削除' : 'チップに追加');
      row.classList.toggle('added', isNowAdded);
    });
  });

  // ── 行タップ（＋/♡ 以外）→ 追加/解除のショートカット ──
  body.querySelectorAll('.cat-sel-row').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.closest('.cat-sel-row-add') || e.target.closest('.cat-sel-row-fav')) return;
      row.querySelector('.cat-sel-row-add')?.click();
    });
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); row.click(); }
    });
  });

  // ── ♡ タップ → お気に入りトグル ──
  body.querySelectorAll('.cat-sel-row-fav').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const key   = btn.dataset.key;
      toggleCatFav(key, true);
      const isNow = isCatFavorited(key);
      btn.textContent = isNow ? '♥' : '♡';
      btn.classList.toggle('active', isNow);
      btn.setAttribute('aria-label', isNow ? 'お気に入り解除' : 'お気に入り登録');
    });
  });
}

// イベント登録
_catSelOverlay?.addEventListener('click', closeCategorySelectSheet);
document.getElementById('cat-sel-close-btn')?.addEventListener('click', closeCategorySelectSheet);
document.getElementById('cat-sel-done-btn')?.addEventListener('click', closeCategorySelectSheet);

// スワイプダウンで閉じる
;(function initCatSelSwipe() {
  const handle = document.getElementById('cat-sel-handle-wrap');
  if (!handle) return;
  let sy = 0, isDrag = false, st = 0;
  handle.addEventListener('touchstart', e => {
    if (!_catSelOpen) return;
    sy = e.touches[0].clientY; st = Date.now(); isDrag = true;
  }, { passive: true });
  handle.addEventListener('touchmove', e => {
    if (!isDrag) return;
    const dy = e.touches[0].clientY - sy;
    if (dy > 0) { _catSelSheet.style.transition = 'none'; _catSelSheet.style.transform = `translateX(-50%) translateY(${dy}px)`; }
  }, { passive: true });
  handle.addEventListener('touchend', e => {
    if (!isDrag) return; isDrag = false;
    const dy = e.changedTouches[0].clientY - sy;
    const v  = dy / (Date.now() - st);
    if (dy > 80 || v > 0.5) {
      _catSelSheet.style.transition = '';
      _catSelSheet.style.transform  = '';
      closeCategorySelectSheet();
    } else {
      _catSelSheet.style.transition = 'transform .32s cubic-bezier(0.32,0.72,0,1)';
      _catSelSheet.style.transform  = 'translateX(-50%) translateY(0)';
      setTimeout(() => { _catSelSheet.style.transition = ''; _catSelSheet.style.transform = ''; }, 340);
    }
  }, { passive: true });
})();




/* ================================================================
   § 11 初期化
   ─ localStorage から前回の状態を復元してから全描画する。
   ─ DOMContentLoaded 前後どちらでも安全に呼べる。
   ─ STEP2: loadStateFromLocalStorage() を Firestore 読み込みに置き換える。
   ================================================================ */

/**
 * ページ初期化
 * ─ 実行順序:
 *   1. loadStateFromLocalStorage()   前回の状態を APP_STATE に復元
 *   2. 検索バーの value を APP_STATE.searchQuery に合わせて復元
 *   3. renderCategoryChips()         復元済み selectedCategory でチップ描画
 *   4. renderConditionFilters()      復元済み activeFilters でフィルター描画
 *   5. renderQuickCards()            クイックアクセスカード描画
 *   6. applyFiltersAndRender()       復元状態で大会リスト描画
 *
 * STEP2: 本体統合時はこの関数を router の onPageEnter / componentDidMount に移植する。
 */

/* ================================================================
   STEP100: CMS pre-merge before first search render
   初回 applyFiltersAndRender() の前にCMS大会をDUMMY_TOURNAMENTSへ入れる
   ================================================================ */
function PNXStep100ReadJson(key, fallback){
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch(e) {
    return fallback;
  }
}

function PNXStep100Text(v){
  return String(v == null ? "" : v).trim();
}

function PNXStep100Snapshot(){
  const snap = PNXStep100ReadJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", []);
  const hard = PNXStep100ReadJson("PNX_STEP85_HARD_SYNC_PAYLOAD", null);
  if (Array.isArray(snap) && snap.length) return snap;
  if (hard && Array.isArray(hard.tournaments) && hard.tournaments.length) return hard.tournaments;
  return [];
}

function PNXStep100NormalizeCmsTournament(t, index){
  const id = PNXStep100Text(t.id || t.tournamentId) || ("cms_step100_" + index);
  const name = PNXStep100Text(t.name || t.title || t.tournamentTitle) || "CMS登録大会";
  const start = PNXStep100Text(t.start || t.startDate || t.date);
  const end = PNXStep100Text(t.end || t.endDate || t.start || t.startDate || t.date) || start;
  const course = PNXStep100Text(t.course || t.venue || t.place) || "会場未定";
  const rawCat = PNXStep100Text(t.cat || t.category);

  let cat = "open";
  const lc = rawCat.toLowerCase();
  if (/jgto|男子ツアー/.test(lc)) cat = "jgto";
  else if (/jlpga|lpga|女子/.test(lc)) cat = "lpga";
  else if (/qt/.test(lc)) cat = "qt";
  else if (/mini|ミニ|future|atp|fj/.test(lc)) cat = "mini";
  else if (/海外|pga|asian|korn|dp world|liv/i.test(rawCat)) cat = "abroad";
  else if (/学生/.test(rawCat)) cat = "student";

  return Object.assign({}, t, {
    id,
    tournamentId:id,
    name,
    title:name,
    cat,
    category: rawCat || "オープン大会",
    gender:/女子|jlpga|lpga/i.test(PNXStep100Text(t.gender || t.category)) ? "womens" : "mens",
    region:cat === "abroad" ? "overseas" : "domestic",
    area:PNXStep100Text(t.area) || "kanto",
    prefecture:PNXStep100Text(t.prefecture || t.pref) || "saitama",
    course,
    venue:course,
    start,
    startDate:start,
    end,
    endDate:end,
    entryDeadline:PNXStep100Text(t.entryDeadline || t.deadline),
    cancelDeadline:PNXStep100Text(t.cancelDeadline || t.entryDeadline || t.deadline),
    prize:PNXStep100Text(t.prize || t.totalPrize) || "—",
    prizeWinner:PNXStep100Text(t.prizeWinner || t.winnerPrize) || "—",
    winnerPrize:PNXStep100Text(t.winnerPrize || t.prizeWinner) || "—",
    entryFee:PNXStep100Text(t.entryFee || t.fee) || "—",
    practiceRoundFee:"—",
    entryMethod:PNXStep100Text(t.entryMethod || t.entryUrl || t.officialUrl) || "CMS登録情報を確認",
    qualification:PNXStep100Text(t.qualification || t.eligibility) || "—",
    eligibility:PNXStep100Text(t.eligibility || t.qualification) || "—",
    capacity:PNXStep100Text(t.capacity) || "—",
    organizer:PNXStep100Text(t.organizer) || "—",
    status:"open",
    emoji:"⛳",
    tags:[],
    source:"cms",
    cmsSource:"step100-premerge"
  });
}

function PNXStep100PreMergeCms(){
  if (typeof DUMMY_TOURNAMENTS === "undefined" || !Array.isArray(DUMMY_TOURNAMENTS)) {
    return { ok:false, reason:"DUMMY_TOURNAMENTS_missing", count:0 };
  }

  const items = PNXStep100Snapshot().map(PNXStep100NormalizeCmsTournament);
  if (!items.length) return { ok:false, reason:"snapshot_empty", count:0 };

  const ids = new Set(items.map(t => String(t.id || t.tournamentId)));

  for (let i = DUMMY_TOURNAMENTS.length - 1; i >= 0; i--) {
    const t = DUMMY_TOURNAMENTS[i];
    if (!t) continue;
    const id = String(t.id || t.tournamentId);
    if (ids.has(id) || (t.source === "cms" && ids.has(id))) {
      DUMMY_TOURNAMENTS.splice(i, 1);
    }
  }

  DUMMY_TOURNAMENTS.unshift(...items);

  window.__PNX_STEP100_PREMERGE_RESULT__ = {
    ok:true,
    count:items.length,
    ids:items.map(t => t.id),
    titles:items.map(t => t.name)
  };

  try {
    localStorage.setItem("PNX_STEP100_PREMERGE_RESULT", JSON.stringify(window.__PNX_STEP100_PREMERGE_RESULT__));
  } catch(e) {}

  return window.__PNX_STEP100_PREMERGE_RESULT__;
}

function PNXStep100CleanupOldCmsUi(){
  document.querySelectorAll([
    "#pnx-step87-search-alert-btn",
    "#pnx-step89-official-list-btn",
    "#pnx-step90-force-list-btn",
    "#pnx-step91-reload-force-btn",
    "#pnx-step91-diag-btn",
    ".pnx-step87-cms-section",
    "#pnx-step87-cms-visible-section",
    "#pnx-step88-parent-cms-results",
    ".pnx-step84-cardbar",
    ".pnx-step84-cms-summary",
    ".pnx-step84-detail-panel",
    ".pnx-step92-cms-badge",
    ".pnx-cms-badge",
    ".pnx-cms-status-note"
  ].join(",")).forEach(el => el.remove());

  document.querySelectorAll(".s-tournament-card").forEach(card => {
    card.classList.remove(
      "pnx-step84-cms-card",
      "pnx-step89-official-card",
      "pnx-step90-force-card",
      "pnx-step92-cms-card",
      "pnx-step93-cms-card",
      "pnx-cms-tournament"
    );
    card.removeAttribute("data-cms-tournament");
    card.style.removeProperty("--pnx-cms-card-image");
  });
}

window.PNXStep100PreMergeCms = PNXStep100PreMergeCms;
window.PNXStep100CleanupOldCmsUi = PNXStep100CleanupOldCmsUi;

function init() {
  if (window.__PNX_STEP101_SEARCH_INIT_DONE__) {
    if (typeof PNXStep100CleanupOldCmsUi === "function") PNXStep100CleanupOldCmsUi();
    return;
  }
  window.__PNX_STEP101_SEARCH_INIT_DONE__ = true;

  const restored = loadStateFromLocalStorage();

  // STEP100: CMS大会を初回リスト描画の前に合流させる。
  // これで「既存カード表示 → CMS反映で再描画」のパチパチを防ぐ。
  if (typeof PNXStep100PreMergeCms === "function") {
    PNXStep100PreMergeCms();
  }

  if (restored && APP_STATE.searchQuery) {
    const si = document.getElementById('search-input');
    if (si) si.value = APP_STATE.searchQuery;
  }

  renderGenderSegment();
  renderCategoryChips();
  initFavCatCard();
  renderConditionFilters();
  renderQuickCards();
  renderCalendarSection();
  applyFiltersAndRender();
  updateFilterBadge();
}

// DOMContentLoaded 後に初期化（すでに ready なら即実行）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/* ─── End of pages/search/script.js ─── */




/* ================================================================
   STEP8: Tournament Card Data Attribute Enhancer
   大会カードに data-* が無くても、表示内容から正式Tournament構造を補完
   ================================================================ */
(function(){
  if (window.__PNX_TOURNAMENT_CARD_DATA_ENHANCER__) return;
  window.__PNX_TOURNAMENT_CARD_DATA_ENHANCER__ = true;

  function text(el){
    return (el && el.textContent ? el.textContent : '').replace(/\s+/g, ' ').trim();
  }

  function parseDateStrict(value){
    const s = String(value || '');

    // 2026-05-20 / 2026/05/20 / 2026.05.20 / 2026年5月20日
    let m = s.match(/(20\d{2})[\/\-.年]\s*(\d{1,2})[\/\-.月]\s*(\d{1,2})/);
    if (m) return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;

    // 5/20 or 5月20日
    m = s.match(/(\d{1,2})[\/月]\s*(\d{1,2})/);
    if (m) {
      const y = new Date().getFullYear();
      return `${y}-${String(m[1]).padStart(2,'0')}-${String(m[2]).padStart(2,'0')}`;
    }

    return '';
  }

  function parseDateRange(value){
    const s = String(value || '');
    const first = parseDateStrict(s);

    // 2026/5/20〜5/22 のような終了日補完
    const ymd = s.match(/(20\d{2})[\/\-.年]\s*(\d{1,2})[\/\-.月]\s*(\d{1,2}).*?[〜~\-–—]\s*(?:(20\d{2})[\/\-.年]\s*)?(\d{1,2})[\/\-.月]\s*(\d{1,2})/);
    if (ymd) {
      const y1 = ymd[1];
      const y2 = ymd[4] || y1;
      return {
        startDate: `${y1}-${String(ymd[2]).padStart(2,'0')}-${String(ymd[3]).padStart(2,'0')}`,
        endDate: `${y2}-${String(ymd[5]).padStart(2,'0')}-${String(ymd[6]).padStart(2,'0')}`
      };
    }

    return { startDate: first, endDate: first };
  }

  function cleanMoney(str){
    const n = String(str || '').replace(/[^\d]/g, '');
    return n ? Number(n) : null;
  }

  function findInfoValue(card, labels){
    if (!card) return '';
    const rows = Array.from(card.querySelectorAll('.t-info-row, .info-row, .meta-row, li, div'));
    for (const row of rows) {
      const rowText = text(row);
      if (!rowText) continue;
      for (const label of labels) {
        if (rowText.includes(label)) {
          const val =
            text(row.querySelector('.t-info-value, .info-value, .value')) ||
            rowText.replace(label, '').replace(/[：:]/g, '').trim();
          if (val) return val;
        }
      }
    }
    return '';
  }

  function inferPrefecture(textValue){
    const prefs = ['北海道','青森','岩手','宮城','秋田','山形','福島','茨城','栃木','群馬','埼玉','千葉','東京','神奈川','新潟','富山','石川','福井','山梨','長野','岐阜','静岡','愛知','三重','滋賀','京都','大阪','兵庫','奈良','和歌山','鳥取','島根','岡山','広島','山口','徳島','香川','愛媛','高知','福岡','佐賀','長崎','熊本','大分','宮崎','鹿児島','沖縄'];
    const s = String(textValue || '');
    return prefs.find(p => s.includes(p)) || '';
  }

  function inferArea(pref){
    const p = String(pref || '');
    if (['東京','神奈川','千葉','埼玉','茨城','栃木','群馬'].some(x => p.includes(x))) return 'kanto';
    if (['大阪','京都','兵庫','奈良','滋賀','和歌山'].some(x => p.includes(x))) return 'kansai';
    if (['愛知','静岡','岐阜','三重','長野','山梨','新潟','富山','石川','福井'].some(x => p.includes(x))) return 'chubu';
    if (['福岡','佐賀','長崎','熊本','大分','宮崎','鹿児島','沖縄'].some(x => p.includes(x))) return 'kyushu';
    if (p.includes('北海道')) return 'hokkaido';
    return '';
  }

  function normalizeCategory(raw){
    const v = String(raw || '').toLowerCase();
    if (v.includes('jgto')) return 'jgto';
    if (v.includes('jlpga')) return 'jlpga';
    if (v.includes('pga')) return 'pga';
    if (v.includes('qt')) return 'qt';
    if (v.includes('mini') || v.includes('ミニ')) return 'mini';
    if (v.includes('open') || v.includes('オープン')) return 'open';
    if (v.includes('qualifier') || v.includes('予選')) return 'qualifier';
    return raw || 'open';
  }

  function enhanceCardDataset(card){
    if (!card || !card.dataset || card.dataset.pnxSchemaEnhanced === '1') return;

    const title =
      text(card.querySelector('.t-name-text')) ||
      text(card.querySelector('.t-name')) ||
      text(card.querySelector('.tournament-name')) ||
      text(card.querySelector('.event-name')) ||
      text(card.querySelector('h1,h2,h3')) ||
      '大会予定';

    const dateText =
      findInfoValue(card, ['開催日','日程','開催','Date']) ||
      text(card.querySelector('.t-date, .date, [data-field="date"]')) ||
      text(card);

    const range = parseDateRange(dateText);
    const venue =
      findInfoValue(card, ['会場','開催地','ゴルフ場','Venue']) ||
      text(card.querySelector('.t-venue, .venue, [data-field="venue"]')) ||
      '';

    const combined = text(card) + ' ' + venue;
    const pref = inferPrefecture(combined);

    const categoryText =
      text(card.querySelector('.t-cat-badge, .cat-badge, .badge')) ||
      card.dataset.category ||
      '';

    const prizeText =
      findInfoValue(card, ['賞金総額','賞金','Prize']) ||
      text(card.querySelector('.t-prize-value.money, .prize'));

    const entryFeeText =
      findInfoValue(card, ['エントリー費','参加費','Entry']);

    const deadlineText =
      findInfoValue(card, ['締切','エントリー締切','申込締切']);

    if (!card.dataset.tournamentId && !card.dataset.tid && !card.dataset.id) {
      card.dataset.tournamentId = 'tour_' + title.replace(/\s+/g, '_').replace(/[^\w一-龠ぁ-んァ-ヶー]/g, '').slice(0, 40) + '_' + (range.startDate || Date.now());
    }

    card.dataset.title = card.dataset.title || title;
    if (range.startDate) card.dataset.startDate = card.dataset.startDate || range.startDate;
    if (range.endDate) card.dataset.endDate = card.dataset.endDate || range.endDate;
    card.dataset.venue = card.dataset.venue || venue;
    card.dataset.prefecture = card.dataset.prefecture || pref;
    card.dataset.area = card.dataset.area || inferArea(pref);
    card.dataset.category = card.dataset.category || normalizeCategory(categoryText);
    card.dataset.tourName = card.dataset.tourName || categoryText;
    if (prizeText) card.dataset.prize = card.dataset.prize || String(cleanMoney(prizeText) || '');
    if (entryFeeText) card.dataset.entryFee = card.dataset.entryFee || String(cleanMoney(entryFeeText) || '');
    if (deadlineText) {
      const deadline = parseDateStrict(deadlineText);
      if (deadline) card.dataset.entryDeadline = card.dataset.entryDeadline || deadline;
    }
    card.dataset.status = card.dataset.status || 'open';
    card.dataset.gender = card.dataset.gender || 'mens';
    card.dataset.pnxSchemaEnhanced = '1';
  }

  function enhanceAllCards(){
    document.querySelectorAll('.t-card, .tournament-card, .search-card, [data-tournament-id], [data-tid]').forEach(enhanceCardDataset);
  }

  document.addEventListener('DOMContentLoaded', enhanceAllCards);
  window.addEventListener('load', enhanceAllCards);

  // 動的描画後も補完
  const mo = new MutationObserver(function(){
    window.clearTimeout(window.__PNX_CARD_ENHANCE_TIMER__);
    window.__PNX_CARD_ENHANCE_TIMER__ = window.setTimeout(enhanceAllCards, 80);
  });
  mo.observe(document.documentElement, { childList:true, subtree:true });

  document.addEventListener('click', function(e){
    const btn = e.target && e.target.closest
      ? e.target.closest('.add-btn, [data-action="add-calendar"], [data-add-calendar], .tdm-footer-cal')
      : null;
    if (!btn) return;
    const card = btn.closest('.t-card, .tournament-card, .search-card, [data-tournament-id], [data-tid], [data-id]');
    enhanceCardDataset(card);
  }, true);
})();


/* ================================================================
   STEP9: Demo Tournament Schema Normalizer
   デモ大会データを正式Tournament schemaに寄せる補完レイヤー
   ================================================================ */
(function(){
  if (window.__PNX_DEMO_TOURNAMENT_SCHEMA_NORMALIZER__) return;
  window.__PNX_DEMO_TOURNAMENT_SCHEMA_NORMALIZER__ = true;

  const PNX_TOURNAMENT_SCHEMA_VERSION = 1;

  function pad(n){ return String(n).padStart(2,'0'); }

  function toISODate(value, fallback){
    if (!value) return fallback || '';
    const s = String(value);

    let m = s.match(/(20\d{2})[\/\-.年]\s*(\d{1,2})[\/\-.月]\s*(\d{1,2})/);
    if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;

    m = s.match(/(\d{1,2})[\/月]\s*(\d{1,2})/);
    if (m) {
      const y = new Date().getFullYear();
      return `${y}-${pad(m[1])}-${pad(m[2])}`;
    }

    const d = new Date(s);
    if (!isNaN(d.getTime())) return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

    return fallback || '';
  }

  function parseRange(value){
    const s = String(value || '');

    const full = s.match(/(20\d{2})[\/\-.年]\s*(\d{1,2})[\/\-.月]\s*(\d{1,2}).*?[〜~\-–—]\s*(?:(20\d{2})[\/\-.年]\s*)?(\d{1,2})[\/\-.月]\s*(\d{1,2})/);
    if (full) {
      const sy = full[1];
      const ey = full[4] || sy;
      return {
        startDate: `${sy}-${pad(full[2])}-${pad(full[3])}`,
        endDate: `${ey}-${pad(full[5])}-${pad(full[6])}`
      };
    }

    const start = toISODate(s);
    return { startDate: start, endDate: start };
  }

  function money(value){
    if (value == null || value === '') return null;
    if (typeof value === 'number') return value;
    const n = String(value).replace(/[^\d]/g, '');
    return n ? Number(n) : null;
  }

  function inferPrefecture(value){
    const prefs = ['北海道','青森','岩手','宮城','秋田','山形','福島','茨城','栃木','群馬','埼玉','千葉','東京','神奈川','新潟','富山','石川','福井','山梨','長野','岐阜','静岡','愛知','三重','滋賀','京都','大阪','兵庫','奈良','和歌山','鳥取','島根','岡山','広島','山口','徳島','香川','愛媛','高知','福岡','佐賀','長崎','熊本','大分','宮崎','鹿児島','沖縄'];
    const s = String(value || '');
    return prefs.find(p => s.includes(p)) || '';
  }

  function inferArea(pref){
    const p = String(pref || '');
    if (['東京','神奈川','千葉','埼玉','茨城','栃木','群馬'].some(x => p.includes(x))) return 'kanto';
    if (['大阪','京都','兵庫','奈良','滋賀','和歌山'].some(x => p.includes(x))) return 'kansai';
    if (['愛知','静岡','岐阜','三重','長野','山梨','新潟','富山','石川','福井'].some(x => p.includes(x))) return 'chubu';
    if (['福岡','佐賀','長崎','熊本','大分','宮崎','鹿児島','沖縄'].some(x => p.includes(x))) return 'kyushu';
    if (p.includes('北海道')) return 'hokkaido';
    return '';
  }

  function normalizeCategory(raw){
    const s = String(raw || '').toLowerCase();
    if (s.includes('jgto')) return 'jgto';
    if (s.includes('jlpga')) return 'jlpga';
    if (s.includes('pga')) return 'pga';
    if (s.includes('acn')) return 'acn';
    if (s.includes('qt')) return 'qt';
    if (s.includes('mini') || s.includes('ミニ')) return 'mini';
    if (s.includes('open') || s.includes('オープン')) return 'open';
    if (s.includes('qualifier') || s.includes('予選')) return 'qualifier';
    if (s.includes('step')) return 'stepup';
    return raw || 'open';
  }

  function safeId(title, date){
    return 'tour_' + String(title || 'demo')
      .replace(/\s+/g, '_')
      .replace(/[^\w一-龠ぁ-んァ-ヶー]/g, '')
      .slice(0, 42) + '_' + String(date || '').replace(/-/g, '');
  }

  function normalizeTournament(raw, index){
    if (!raw || typeof raw !== 'object') return raw;

    const title =
      raw.title || raw.name || raw.tournamentName || raw.eventName || raw.label || `デモ大会 ${index + 1}`;

    const dateText =
      raw.dateText || raw.date || raw.schedule || raw.period || raw.dates || raw.start || raw.startDate || '';

    const range = {
      startDate: raw.startDate || parseRange(dateText).startDate,
      endDate: raw.endDate || parseRange(dateText).endDate
    };

    if (!range.startDate) {
      const d = new Date();
      d.setDate(d.getDate() + index * 7);
      range.startDate = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      range.endDate = range.startDate;
    }

    if (!range.endDate) range.endDate = range.startDate;

    const venue = raw.venue || raw.course || raw.golfCourse || raw.place || raw.location || '';
    const pref = raw.prefecture || inferPrefecture((venue || '') + ' ' + (raw.areaLabel || raw.location || ''));

    const categoryRaw = raw.category || raw.cat || raw.type || raw.tour || raw.tourName || '';
    const category = normalizeCategory(categoryRaw);

    const now = new Date().toISOString();

    return Object.assign({}, raw, {
      schemaVersion: PNX_TOURNAMENT_SCHEMA_VERSION,
      id: raw.id || raw.tournamentId || safeId(title, range.startDate),
      title,
      startDate: range.startDate,
      endDate: range.endDate,
      venue,
      prefecture: pref,
      area: raw.area || inferArea(pref),
      gender: raw.gender || raw.sex || 'mens',
      category,
      tourName: raw.tourName || raw.tour || categoryRaw || category,
      prize: money(raw.prize ?? raw.totalPrize ?? raw.prizeMoney),
      winnerPrize: money(raw.winnerPrize ?? raw.firstPrize),
      entryFee: money(raw.entryFee ?? raw.fee),
      entryDeadline: raw.entryDeadline || raw.deadline || null,
      status: raw.status || 'open',
      entryUrl: raw.entryUrl || raw.url || raw.applyUrl || null,
      officialUrl: raw.officialUrl || raw.homepage || null,
      instagramUrl: raw.instagramUrl || raw.instagram || null,
      organizer: raw.organizer || raw.host || null,
      capacity: raw.capacity ? Number(raw.capacity) : null,
      eligibility: raw.eligibility || raw.qualification || null,
      source: raw.source || 'demo',
      createdAt: raw.createdAt || now,
      updatedAt: now
    });
  }

  function normalizeArray(arr){
    if (!Array.isArray(arr)) return arr;
    return arr.map((item, index) => normalizeTournament(item, index));
  }

  function applyToKnownGlobals(){
    const names = [
      'TOURNAMENTS',
      'TOURNAMENTS_DB',
      'tournaments',
      'tournamentData',
      'DEMO_TOURNAMENTS',
      'SAMPLE_TOURNAMENTS'
    ];

    names.forEach(name => {
      try {
        if (Array.isArray(window[name])) {
          window[name] = normalizeArray(window[name]);
        }
      } catch(e) {}
    });

    // オブジェクト型DBにも対応
    try {
      if (window.TOURNAMENTS_DB && typeof window.TOURNAMENTS_DB === 'object' && !Array.isArray(window.TOURNAMENTS_DB)) {
        Object.keys(window.TOURNAMENTS_DB).forEach(key => {
          if (Array.isArray(window.TOURNAMENTS_DB[key])) {
            window.TOURNAMENTS_DB[key] = normalizeArray(window.TOURNAMENTS_DB[key]);
          }
        });
      }
    } catch(e) {}
  }

  function applySchemaToCards(){
    document.querySelectorAll('.t-card, .tournament-card, .search-card, [data-tournament-id], [data-tid]').forEach((card, index) => {
      if (!card || !card.dataset) return;
      card.dataset.schemaVersion = String(PNX_TOURNAMENT_SCHEMA_VERSION);
      if (!card.dataset.source) card.dataset.source = 'demo';
      if (!card.dataset.status) card.dataset.status = 'open';
      if (!card.dataset.gender) card.dataset.gender = 'mens';
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    applyToKnownGlobals();
    setTimeout(applySchemaToCards, 100);
    setTimeout(applySchemaToCards, 500);
  });

  window.addEventListener('load', function(){
    applyToKnownGlobals();
    applySchemaToCards();
  });

  const mo = new MutationObserver(function(){
    clearTimeout(window.__PNX_STEP9_SCHEMA_TIMER__);
    window.__PNX_STEP9_SCHEMA_TIMER__ = setTimeout(function(){
      applyToKnownGlobals();
      applySchemaToCards();
    }, 120);
  });
  mo.observe(document.documentElement, { childList:true, subtree:true });

  window.PNXNormalizeTournament = normalizeTournament;
  window.PNXNormalizeTournaments = normalizeArray;
})();


/* ================================================================
   STEP13: CMS Local Tournaments → Search
   CMSで保存した大会(localStorage)を試合検索側へ取り込む土台
   ================================================================ */
(function(){
  if (window.__PNX_CMS_TO_SEARCH_BRIDGE__) return;
  window.__PNX_CMS_TO_SEARCH_BRIDGE__ = true;

  const CMS_TOURNAMENTS_KEY = "PNX_CMS_TOURNAMENTS";

  function readCmsTournaments(){
    try {
      const list = JSON.parse(localStorage.getItem(CMS_TOURNAMENTS_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function normalizeForSearch(t){
    if (!t || typeof t !== "object") return null;
    return Object.assign({}, t, {
      id: t.id || ("cms_" + Date.now()),
      title: t.title || t.name || "CMS大会",
      name: t.title || t.name || "CMS大会",
      startDate: t.startDate || t.date || "",
      endDate: t.endDate || t.startDate || t.date || "",
      venue: t.venue || "",
      category: t.category || "open",
      source: "cms"
    });
  }

  function mergeIntoArray(target, cmsItems){
    if (!Array.isArray(target)) return false;
    let changed = false;

    cmsItems.forEach(item => {
      const normalized = normalizeForSearch(item);
      if (!normalized) return;
      const id = normalized.id;
      const i = target.findIndex(x => x && (x.id === id || x.tournamentId === id));
      if (i >= 0) {
        target[i] = Object.assign({}, target[i], normalized);
      } else {
        target.push(normalized);
        changed = true;
      }
    });

    return changed;
  }

  function applyCmsTournaments(){
    const cmsItems = readCmsTournaments();
    if (!cmsItems.length) return false;

    let changed = false;

    const names = [
      "TOURNAMENTS",
      "tournaments",
      "DEMO_TOURNAMENTS",
      "SAMPLE_TOURNAMENTS"
    ];

    names.forEach(name => {
      try {
        if (Array.isArray(window[name])) {
          changed = mergeIntoArray(window[name], cmsItems) || changed;
        }
      } catch(e) {}
    });

    try {
      if (window.TOURNAMENTS_DB && typeof window.TOURNAMENTS_DB === "object") {
        Object.keys(window.TOURNAMENTS_DB).forEach(key => {
          if (Array.isArray(window.TOURNAMENTS_DB[key])) {
            changed = mergeIntoArray(window.TOURNAMENTS_DB[key], cmsItems) || changed;
          }
        });
      }
    } catch(e) {}

    window.__PNX_CMS_TOURNAMENTS_LOADED__ = cmsItems;

    if (changed) {
      try { if (typeof window.renderTournaments === "function") window.renderTournaments(); } catch(e) {}
      try { if (typeof window.renderTournamentList === "function") window.renderTournamentList(); } catch(e) {}
      try { if (typeof window.applyFilters === "function") window.applyFilters(); } catch(e) {}
      try { if (typeof window.renderSearch === "function") window.renderSearch(); } catch(e) {}
    }

    return changed;
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(applyCmsTournaments, 100);
    setTimeout(applyCmsTournaments, 600);
  });

  window.addEventListener("load", function(){
    applyCmsTournaments();
  });

  window.addEventListener("storage", function(e){
    if (e.key === CMS_TOURNAMENTS_KEY) {
      applyCmsTournaments();
    }
  });

  window.PNXApplyCmsTournamentsToSearch = applyCmsTournaments;
})();


/* ================================================================
   STEP15: Search refresh message listener
   親/別タブからCMS大会更新通知を受けたら反映
   ================================================================ */
(function(){
  if (window.__PNX_SEARCH_REFRESH_MESSAGE_LISTENER__) return;
  window.__PNX_SEARCH_REFRESH_MESSAGE_LISTENER__ = true;

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type === "PNX_REFRESH_CMS_TOURNAMENTS" || data.type === "PNX_CMS_TOURNAMENTS_UPDATED") {
      try {
        if (window.PNXApplyCmsTournamentsToSearch) {
          window.PNXApplyCmsTournamentsToSearch();
        }
      } catch(e) {}
    }
  });
})();


/* ================================================================
   STEP16: Search/CMS tournament marker
   CMS大会を識別しやすくする
   ================================================================ */
(function(){
  if (window.__PNX_STEP16_SEARCH_MARKER__) return;
  window.__PNX_STEP16_SEARCH_MARKER__ = true;

  function mark(){
    document.querySelectorAll('.t-card, .tournament-card, .search-card').forEach(card => {
      if (!card.dataset) return;
      if (card.dataset.source === "cms" && !card.dataset.cmsMarked) {
        card.dataset.cmsMarked = "1";
        card.classList.add("pnx-cms-tournament");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", mark);
  window.addEventListener("load", mark);

  const mo = new MutationObserver(function(){
    clearTimeout(window.__PNX_STEP16_MARK_TIMER__);
    window.__PNX_STEP16_MARK_TIMER__ = setTimeout(mark, 120);
  });

  mo.observe(document.documentElement, { childList:true, subtree:true });
})();


/* ================================================================
   STEP35: User Favorite Tournament UI Bridge
   試合検索カードのお気に入りをユーザー別保存へ送る
   ================================================================ */
(function(){
  if (window.__PNX_STEP35_SEARCH_FAVORITES__) return;
  window.__PNX_STEP35_SEARCH_FAVORITES__ = true;

  function text(el){ return (el && el.textContent ? el.textContent : '').trim(); }

  function findCard(el){
    return el && el.closest ? el.closest('.t-card, .tournament-card, .search-card, [data-tournament-id], [data-tid], [data-id]') : null;
  }

  function extract(card){
    if (!card) return {};
    return {
      id: card.dataset.tournamentId || card.dataset.tid || card.dataset.id || card.dataset.title || ('fav_' + Date.now()),
      title: card.dataset.title || text(card.querySelector('.t-name-text, .t-name, .tournament-name, h3')) || '大会',
      startDate: card.dataset.startDate || card.dataset.date || '',
      venue: card.dataset.venue || text(card.querySelector('.t-venue, .venue')) || '',
      category: card.dataset.category || ''
    };
  }

  function addFavoriteButtons(){
    document.querySelectorAll('.t-card, .tournament-card, .search-card, [data-tournament-id], [data-tid]').forEach(card => {
      if (card.querySelector('.pnx-fav-btn')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pnx-fav-btn';
      btn.textContent = '♡';
      btn.setAttribute('aria-label', 'お気に入り');
      btn.style.cssText = 'position:absolute;right:12px;top:12px;width:34px;height:34px;border:0;border-radius:50%;background:rgba(255,255,255,.92);box-shadow:0 4px 12px rgba(0,0,0,.12);font-size:18px;font-weight:900;color:#3478f6;z-index:5;';
      const style = getComputedStyle(card);
      if (style.position === 'static') card.style.position = 'relative';
      card.appendChild(btn);
    });
  }

  document.addEventListener('click', function(e){
    const btn = e.target && e.target.closest ? e.target.closest('.pnx-fav-btn, [data-action="favorite"], [data-favorite]') : null;
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    const card = findCard(btn);
    const tournament = extract(card);

    try {
      window.parent.postMessage({
        type:'PNX_TOGGLE_FAVORITE_TOURNAMENT',
        payload:tournament
      }, '*');
      btn.textContent = btn.textContent === '♥' ? '♡' : '♥';
    } catch(err) {}
  }, true);

  window.addEventListener('message', function(event){
    const data = event.data || {};
    if (data.type === 'PNX_FAVORITE_TOURNAMENT_UPDATED') {
      console.info('[PNX Search] favorite updated', data.payload);
    }
  });

  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(addFavoriteButtons, 300);
    setTimeout(addFavoriteButtons, 900);
  });
  window.addEventListener('load', addFavoriteButtons);

  const mo = new MutationObserver(function(){
    clearTimeout(window.__PNX_FAV_BTN_TIMER__);
    window.__PNX_FAV_BTN_TIMER__ = setTimeout(addFavoriteButtons, 120);
  });
  mo.observe(document.documentElement, { childList:true, subtree:true });
})();










/* ================================================================
   STEP51: Safe handleCalendarAdd Override
   カード全体クリックには触らず、元のカレンダー追加関数だけを安全に上書き
   ================================================================ */
(function(){
  if (window.__PNX_STEP51_SAFE_HANDLE_CALENDAR_ADD__) return;
  window.__PNX_STEP51_SAFE_HANDLE_CALENDAR_ADD__ = true;

  const pending = new Map();

  function findTournament(id){
    try {
      if (Array.isArray(DUMMY_TOURNAMENTS)) return DUMMY_TOURNAMENTS.find(t => t && t.id === id) || null;
    } catch(e) {}
    return null;
  }

  function tournamentPayload(id){
    const t = findTournament(id);
    if (!t) return { id, tournamentId:id, name:"大会予定", title:"大会予定", date:"", start:"", cat:"personal" };

    return {
      id: t.id,
      tournamentId: t.id,
      name: t.name,
      title: t.name,
      date: t.start,
      start: t.start,
      startDate: t.start,
      end: t.end || t.start,
      endDate: t.end || t.start,
      cat: t.cat,
      category: t.cat,
      place: t.course || "",
      venue: t.course || "",
      course: t.course || "",
      entryDeadline: t.entryDeadline || null,
      entryFee: t.entryFee || null,
      prize: t.prize || null,
      source:"search"
    };
  }

  function setLocalAddedState(id, added){
    const t = findTournament(id);
    if (t) t.addedToCalendar = !!added;

    try {
      if (APP_STATE && APP_STATE.addedToCalendar) {
        if (added) APP_STATE.addedToCalendar.add(id);
        else APP_STATE.addedToCalendar.delete(id);
      }
    } catch(e) {}

    try {
      if (typeof saveAppState === "function") saveAppState();
      if (typeof saveState === "function") saveState();
    } catch(e) {}
  }

  function syncButtons(id, added){
    const t = findTournament(id);
    const label = added ? "追加済み" : "カレンダーに追加";
    const cardBtn = document.querySelector('.tc-btn-add[data-id="' + id + '"]');

    if (cardBtn) {
      cardBtn.classList.toggle("added", !!added);
      cardBtn.innerHTML = added
        ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>追加済み'
        : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>カレンダーに追加';
    }

    try {
      if (typeof _syncBSAddBtn === "function" && t) _syncBSAddBtn(t);
    } catch(e) {}

    const bsBtn = document.getElementById("bs-cta-add");
    if (bsBtn && t && APP_STATE && APP_STATE.selectedTournamentId === id) {
      bsBtn.classList.toggle("added", !!added);
    }
  }

  function setPending(id){
    const cardBtn = document.querySelector('.tc-btn-add[data-id="' + id + '"]');
    if (cardBtn) cardBtn.textContent = "処理中...";
    const bsBtn = document.getElementById("bs-cta-add");
    if (bsBtn && APP_STATE && APP_STATE.selectedTournamentId === id) bsBtn.textContent = "処理中...";
  }

  window.handleCalendarAdd = function(id){
    const t = findTournament(id);
    if (!t) return;

    const requestId = "req_" + Date.now() + "_" + Math.random().toString(36).slice(2,7);
    pending.set(requestId, id);
    setPending(id);

    window.parent.postMessage({
      type:"PNX_TOGGLE_TOURNAMENT_CALENDAR",
      requestId,
      payload:tournamentPayload(id)
    }, "*");

    setTimeout(function(){
      if (!pending.has(requestId)) return;
      pending.delete(requestId);
      syncButtons(id, !!t.addedToCalendar);
      console.warn("[PNX Search] calendar toggle timeout", id);
    }, 3000);
  };

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type !== "PNX_TOURNAMENT_CALENDAR_TOGGLE_RESULT") return;

    const id = pending.get(data.requestId);
    pending.delete(data.requestId);
    if (!id) return;

    const payload = data.payload || {};
    if (!payload.ok) {
      const t = findTournament(id);
      syncButtons(id, !!(t && t.addedToCalendar));
      return;
    }

    const added = payload.action === "added";
    setLocalAddedState(id, added);
    syncButtons(id, added);
  });
})();


/* ================================================================
   STEP64: CMS Bulk Tournaments → Search Reflect
   Claude一括登録で保存された PNX_CMS_TOURNAMENTS を
   試合検索の本来形式(DUMMY_TOURNAMENTS)へ変換して表示する
   ================================================================ */
(function(){
  if (window.__PNX_STEP64_CMS_BULK_TO_SEARCH__) return;
  window.__PNX_STEP64_CMS_BULK_TO_SEARCH__ = true;

  const CMS_KEY = "PNX_CMS_TOURNAMENTS";
  const UPDATE_KEY = "PNX_CMS_TOURNAMENTS_UPDATED_AT";

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch(e) {
      return fallback;
    }
  }

  function normalizeText(v){
    return String(v == null ? "" : v).trim();
  }

  function toIsoDate(v){
    const s = normalizeText(v);
    if (!s) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    let m = s.match(/(20\d{2})[\/年\-.]\s*(\d{1,2})[\/月\-.]\s*(\d{1,2})/);
    if (m) return `${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`;

    m = s.match(/(\d{1,2})[\/月]\s*(\d{1,2})/);
    if (m) {
      const y = new Date().getFullYear();
      return `${y}-${String(m[1]).padStart(2,"0")}-${String(m[2]).padStart(2,"0")}`;
    }

    return s;
  }

  function catKey(v){
    const s = normalizeText(v).toLowerCase();
    if (/jgto|日本ゴルフツアー|男子ツアー/.test(s)) return "jgto";
    if (/jlpga|lpga|女子/.test(s)) return "lpga";
    if (/qt/.test(s)) return "qt";
    if (/mini|ミニ|atp|future|fjtour|fj tour|カートルズ|cartles/.test(s)) return "mini";
    if (/open|オープン|県オープン|地方オープン/.test(s)) return "open";
    if (/学生|アマ/.test(s)) return "student";
    if (/pga|korn|dp world|asian|海外|台湾|韓国|中国|liv/.test(s)) return "abroad";
    return "open";
  }

  function genderKey(v){
    const s = normalizeText(v).toLowerCase();
    if (/女|women|womens|female|jlpga|lpga/.test(s)) return "womens";
    if (/男|men|mens|male|jgto/.test(s)) return "mens";
    return "mens";
  }

  function areaKey(prefecture, area){
    const s = normalizeText(area || prefecture);
    const map = {
      hokkaido: ["北海道"],
      tohoku: ["青森","岩手","宮城","秋田","山形","福島"],
      kanto: ["茨城","栃木","群馬","埼玉","千葉","東京","神奈川","山梨"],
      chubu: ["新潟","長野","富山","石川","福井","岐阜","静岡","愛知","三重"],
      kansai: ["滋賀","京都","大阪","兵庫","奈良","和歌山"],
      chugoku: ["鳥取","島根","岡山","広島","山口"],
      shikoku: ["徳島","香川","愛媛","高知"],
      kyushu: ["福岡","佐賀","長崎","熊本","大分","宮崎","鹿児島","沖縄"]
    };
    for (const [key, arr] of Object.entries(map)) {
      if (arr.some(x => s.includes(x))) return key;
    }
    if (/海外|台湾|韓国|中国|フィリピン|asian|pga|dp|korn|liv/i.test(s)) return "overseas";
    return s || "kanto";
  }

  function statusKey(v){
    const s = normalizeText(v).toLowerCase();
    if (/near|締切間近/.test(s)) return "near";
    if (/closed|締切|締め切り/.test(s)) return "closed";
    if (/ongoing|live|開催中/.test(s)) return "live";
    if (/finished|終了/.test(s)) return "closed";
    // draft/下書きは本体アプリには表示しない
    if (/draft|下書き/.test(s)) return "draft";
    return "open";
  }

  function emojiForCat(cat){
    const map = {
      jgto:"🏆",
      lpga:"🌸",
      qt:"🎯",
      mini:"⛳",
      open:"🏌️",
      student:"🎓",
      abroad:"🌏"
    };
    return map[cat] || "⛳";
  }

  function normalizeCmsTournament(raw, index){
    if (!raw || typeof raw !== "object") return null;

    const title = normalizeText(raw.name || raw.title || raw.tournamentTitle) || "CMS登録大会";
    const start = toIsoDate(raw.start || raw.startDate || raw.date);
    const end = toIsoDate(raw.end || raw.endDate || raw.startDate || raw.date) || start;
    const idBase = normalizeText(raw.tournamentId || raw.id) || `cms_bulk_${index}_${title}_${start}`;
    const id = idBase.startsWith("cms_") ? idBase : `cms_${idBase}`;
    const cat = catKey(raw.cat || raw.category);
    const gender = genderKey(raw.gender || raw.category);
    const prefecture = normalizeText(raw.prefecture);
    const area = areaKey(prefecture, raw.area);

    return {
      id,
      name: title,
      title,
      cat,
      gender,
      region: area === "overseas" ? "overseas" : "domestic",
      area,
      prefecture: prefecture || area,
      course: normalizeText(raw.course || raw.venue || raw.place) || "会場未定",
      start: start || new Date().toISOString().slice(0,10),
      end: end || start || new Date().toISOString().slice(0,10),
      entryDeadline: toIsoDate(raw.entryDeadline || raw.deadline) || "",
      cancelDeadline: toIsoDate(raw.cancelDeadline) || "",
      prize: normalizeText(raw.prize || raw.totalPrize) || "—",
      prizeWinner: normalizeText(raw.prizeWinner || raw.winnerPrize) || "—",
      entryFee: normalizeText(raw.entryFee) || "—",
      practiceRoundFee: normalizeText(raw.practiceRoundFee) || "—",
      entryMethod: normalizeText(raw.entryMethod) || (raw.entryUrl ? "エントリーURL" : "—"),
      qualification: normalizeText(raw.qualification || raw.eligibility) || "—",
      capacity: normalizeText(raw.capacity) || "—",
      organizer: normalizeText(raw.organizer) || "—",
      status: statusKey(raw.status),
      rawStatus: raw.status || "",
      emoji: raw.emoji || emojiForCat(cat),
      organizerLogoUrl: raw.organizerLogoUrl || null,
      tournamentLogoUrl: raw.tournamentLogoUrl || null,
      venueImageUrl: raw.venueImageUrl || null,
      imageAlt: `${title} ${normalizeText(raw.venue || raw.course || "")}`,
      tags: Array.isArray(raw.tags) ? raw.tags : ["CMS登録", "Claude一括登録"],
      addedToCalendar: !!raw.addedToCalendar,
      favorited: !!raw.favorited,
      source: "cms",
      cmsSource: raw.source || "cms-final",
      confidence: typeof raw.confidence === "number" ? raw.confidence : null,
      warnings: Array.isArray(raw.warnings) ? raw.warnings : [],
      officialUrl: raw.officialUrl || "",
      instagramUrl: raw.instagramUrl || "",
      entryUrl: raw.entryUrl || ""
    };
  }

  function readCmsTournaments(){
    const publicSnapshot = readJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", []);
    if (Array.isArray(publicSnapshot) && publicSnapshot.length) return publicSnapshot;

    const list = readJson(CMS_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  function mergeCmsIntoDummy(){
    if (typeof DUMMY_TOURNAMENTS === "undefined" || !Array.isArray(DUMMY_TOURNAMENTS)) {
      console.warn("[STEP64] DUMMY_TOURNAMENTS not found");
      return { count:0, changed:false };
    }

    const cms = readCmsTournaments();
    const normalized = cms.map(normalizeCmsTournament).filter(Boolean);

    let changed = false;

    normalized.forEach(item => {
      const i = DUMMY_TOURNAMENTS.findIndex(t =>
        t && (
          t.id === item.id ||
          t.id === item.id.replace(/^cms_/, "") ||
          t.tournamentId === item.id ||
          t._cmsOriginalId === item.id
        )
      );

      if (i >= 0) {
        DUMMY_TOURNAMENTS[i] = Object.assign({}, DUMMY_TOURNAMENTS[i], item, {
          _cmsOriginalId: item.id,
          source: "cms"
        });
      } else {
        DUMMY_TOURNAMENTS.unshift(Object.assign({}, item, {
          _cmsOriginalId: item.id,
          source: "cms"
        }));
        changed = true;
      }
    });

    window.__PNX_STEP64_CMS_SEARCH_ITEMS__ = normalized;
    window.__PNX_STEP64_CMS_SEARCH_COUNT__ = normalized.length;

    return { count: normalized.length, changed };
  }

  function markCmsCards(){
    if (typeof DUMMY_TOURNAMENTS === "undefined") return;

    document.querySelectorAll(".s-tournament-card").forEach(card => {
      const id = card.dataset.id;
      const item = DUMMY_TOURNAMENTS.find(t => t && t.id === id);
      if (!item || item.source !== "cms") return;

      card.classList.add("pnx-cms-tournament");
      card.dataset.source = "cms";
      card.dataset.cmsTournament = "1";

      if (!card.querySelector(".pnx-cms-badge")) {
        const badge = document.createElement("span");
        badge.className = "pnx-cms-badge";
        badge.textContent = "CMS登録";
        card.appendChild(badge);
      }

      if (item.rawStatus && !card.querySelector(".pnx-cms-status-note")) {
        const note = document.createElement("span");
        note.className = "pnx-cms-status-note";
        note.textContent = item.rawStatus === "draft" || item.rawStatus === "下書き"
          ? "下書きプレビュー"
          : String(item.rawStatus);
        card.appendChild(note);
      }
    });
  }

  function refreshSearchFromCms(){
    const result = mergeCmsIntoDummy();

    try {
      if (typeof applyFiltersAndRender === "function") {
        applyFiltersAndRender();
      } else if (typeof renderTournamentList === "function") {
        renderTournamentList(DUMMY_TOURNAMENTS);
      }
    } catch(e) {
      console.warn("[STEP64] render failed", e);
    }

    setTimeout(markCmsCards, 80);
    setTimeout(markCmsCards, 260);

    window.dispatchEvent(new CustomEvent("pnx:search:cms-tournaments-refreshed", {
      detail: result
    }));

    return result;
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(refreshSearchFromCms, 120);
    setTimeout(refreshSearchFromCms, 700);
    setTimeout(refreshSearchFromCms, 1500);
  });

  window.addEventListener("load", function(){
    setTimeout(refreshSearchFromCms, 150);
  });

  window.addEventListener("focus", function(){
    setTimeout(refreshSearchFromCms, 100);
  });

  window.addEventListener("storage", function(e){
    if (e.key === CMS_KEY || e.key === UPDATE_KEY) {
      refreshSearchFromCms();
    }
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_CMS_FINAL_PUBLISH_TO_APP" ||
      data.type === "PNX_REFRESH_APP_FROM_CMS" ||
      data.type === "PNX_CMS_TOURNAMENTS_UPDATED" ||
      data.type === "PNX_REFRESH_CMS_TOURNAMENTS"
    ) {
      refreshSearchFromCms();
    }
  });

  window.PNXRefreshSearchFromCms = refreshSearchFromCms;
  window.PNXNormalizeCmsTournamentForSearch = normalizeCmsTournament;
})();


/* ================================================================
   STEP65: Hide Draft CMS Tournaments In App Search
   CMS側の下書き大会は管理画面には残すが、本体アプリの試合検索には表示しない
   ================================================================ */
(function(){
  if (window.__PNX_STEP65_HIDE_DRAFT_TOURNAMENTS__) return;
  window.__PNX_STEP65_HIDE_DRAFT_TOURNAMENTS__ = true;

  function statusOf(t){
    const s = String((t && (t.status || t.rawStatus || t.publishStatus)) || "").toLowerCase();
    if (/draft|下書き/.test(s)) return "draft";
    if (/closed|締切|締め切り/.test(s)) return "closed";
    if (/ongoing|live|開催中/.test(s)) return "live";
    if (/finished|終了/.test(s)) return "finished";
    if (/open|募集中|published|公開/.test(s)) return "open";
    return "open";
  }

  function isPublicCmsTournament(t){
    if (!t) return false;

    // 明示的に非公開なら出さない
    if (t.published === false || t.isPublished === false || t.visible === false) return false;

    // draft/下書きは本体アプリには出さない
    if (statusOf(t) === "draft") return false;

    return true;
  }

  function removeDraftCmsFromDummy(){
    if (typeof DUMMY_TOURNAMENTS === "undefined" || !Array.isArray(DUMMY_TOURNAMENTS)) return 0;

    let removed = 0;
    for (let i = DUMMY_TOURNAMENTS.length - 1; i >= 0; i--) {
      const t = DUMMY_TOURNAMENTS[i];
      if (!t) continue;

      const isCms = t.source === "cms" || t.cmsSource || String(t.id || "").startsWith("cms_");
      if (isCms && !isPublicCmsTournament(t)) {
        DUMMY_TOURNAMENTS.splice(i, 1);
        removed += 1;
      }
    }
    return removed;
  }

  function decoratePublicCmsCards(){
    if (typeof DUMMY_TOURNAMENTS === "undefined" || !Array.isArray(DUMMY_TOURNAMENTS)) return;

    document.querySelectorAll(".s-tournament-card.pnx-cms-tournament").forEach(card => {
      const id = card.dataset.id;
      const item = DUMMY_TOURNAMENTS.find(t => t && t.id === id);
      if (!item) return;

      // 下書き表記は本体では出さない
      const draftNote = card.querySelector(".pnx-cms-status-note");
      if (draftNote && /下書き|draft/i.test(draftNote.textContent || "")) {
        draftNote.remove();
      }

      if (statusOf(item) === "open") {
        card.dataset.publicStatus = "open";
      }
    });
  }

  function enforceDraftHidden(){
    const removed = removeDraftCmsFromDummy();

    try {
      if (removed > 0) {
        if (typeof applyFiltersAndRender === "function") {
          applyFiltersAndRender();
        } else if (typeof renderTournamentList === "function") {
          renderTournamentList(DUMMY_TOURNAMENTS);
        }
      }
    } catch(e) {}

    setTimeout(decoratePublicCmsCards, 80);
    setTimeout(decoratePublicCmsCards, 240);

    window.__PNX_STEP65_LAST_DRAFT_REMOVED__ = removed;
    return removed;
  }

  // Step64のrefresh後にも必ずdraftを除外する
  const oldRefresh = window.PNXRefreshSearchFromCms;
  if (typeof oldRefresh === "function" && !oldRefresh.__pnxStep65Wrapped) {
    const wrapped = function(){
      const result = oldRefresh.apply(this, arguments);
      setTimeout(enforceDraftHidden, 40);
      setTimeout(enforceDraftHidden, 220);
      return result;
    };
    wrapped.__pnxStep65Wrapped = true;
    window.PNXRefreshSearchFromCms = wrapped;
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(enforceDraftHidden, 250);
    setTimeout(enforceDraftHidden, 900);
    setTimeout(enforceDraftHidden, 1800);
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_CMS_TOURNAMENTS_UPDATED" ||
      data.type === "PNX_CMS_FINAL_PUBLISH_TO_APP" ||
      data.type === "PNX_REFRESH_APP_FROM_CMS"
    ) {
      setTimeout(enforceDraftHidden, 120);
    }
  });

  window.addEventListener("storage", function(e){
    if (e.key === "PNX_CMS_TOURNAMENTS" || e.key === "PNX_CMS_TOURNAMENTS_UPDATED_AT") {
      setTimeout(enforceDraftHidden, 120);
    }
  });

  window.PNXIsPublicCmsTournament = isPublicCmsTournament;
  window.PNXHideDraftCmsTournamentsFromSearch = enforceDraftHidden;
})();


/* ================================================================
   STEP67: Hide invalid CMS public tournaments in app search
   公開状態でも必須項目エラーがあるCMS大会は本体試合検索に出さない
   ================================================================ */
(function(){
  if (window.__PNX_STEP67_HIDE_INVALID_PUBLIC__) return;
  window.__PNX_STEP67_HIDE_INVALID_PUBLIC__ = true;

  function text(v){ return String(v == null ? "" : v).trim(); }
  function iso(v){
    const s = text(v);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    return "";
  }
  function dayDiff(a,b){
    if (!a || !b) return null;
    const da = new Date(a + "T00:00:00");
    const db = new Date(b + "T00:00:00");
    if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return null;
    return Math.round((da - db) / 86400000);
  }
  function isInvalidPublicCms(t){
    if (!t) return false;
    const isCms = t.source === "cms" || t.cmsSource || String(t.id || "").startsWith("cms_");
    if (!isCms) return false;

    const status = text(t.status || t.rawStatus).toLowerCase();
    if (/draft|下書き/.test(status)) return true;
    if (t.published === false || t.visible === false || t.isPublished === false) return true;

    const title = text(t.name || t.title);
    const date = iso(t.start || t.startDate || t.date);
    const end = iso(t.end || t.endDate || t.start || t.startDate || t.date);
    const venue = text(t.course || t.venue || t.place);
    const cat = text(t.cat || t.category);
    const deadline = iso(t.entryDeadline || t.deadline);

    if (!title || title === "大会名未設定" || title === "新規大会") return true;
    if (!date) return true;
    if (!venue || venue === "会場未定") return true;
    if (!cat || cat === "未分類") return true;
    if (end && date && dayDiff(end, date) < 0) return true;
    if (deadline && date && dayDiff(deadline, date) > 0) return true;

    return false;
  }

  function enforce(){
    if (typeof DUMMY_TOURNAMENTS === "undefined" || !Array.isArray(DUMMY_TOURNAMENTS)) return 0;

    let removed = 0;
    for (let i = DUMMY_TOURNAMENTS.length - 1; i >= 0; i--) {
      if (isInvalidPublicCms(DUMMY_TOURNAMENTS[i])) {
        DUMMY_TOURNAMENTS.splice(i, 1);
        removed += 1;
      }
    }

    if (removed > 0) {
      try {
        if (typeof applyFiltersAndRender === "function") applyFiltersAndRender();
        else if (typeof renderTournamentList === "function") renderTournamentList(DUMMY_TOURNAMENTS);
      } catch(e) {}
    }

    window.__PNX_STEP67_INVALID_PUBLIC_REMOVED__ = removed;
    return removed;
  }

  const oldRefresh = window.PNXRefreshSearchFromCms;
  if (typeof oldRefresh === "function" && !oldRefresh.__pnxStep67Wrapped) {
    const wrapped = function(){
      const r = oldRefresh.apply(this, arguments);
      setTimeout(enforce, 50);
      setTimeout(enforce, 250);
      return r;
    };
    wrapped.__pnxStep67Wrapped = true;
    window.PNXRefreshSearchFromCms = wrapped;
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(enforce, 350);
    setTimeout(enforce, 1200);
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_CMS_FINAL_VALIDATED_PUBLISH_TO_APP" ||
      data.type === "PNX_CMS_FINAL_PUBLIC_PUBLISH_TO_APP" ||
      data.type === "PNX_CMS_TOURNAMENTS_UPDATED"
    ) {
      setTimeout(enforce, 120);
    }
  });

  window.PNXHideInvalidCmsTournamentsFromSearch = enforce;
})();


/* ================================================================
   STEP68: Search-side CMS sync stability checker
   本体試合検索側でCMS公開スナップショットとの反映差分を確認する
   ================================================================ */
(function(){
  if (window.__PNX_STEP68_SEARCH_SYNC_STABILITY__) return;
  window.__PNX_STEP68_SEARCH_SYNC_STABILITY__ = true;

  const SNAPSHOT_KEY = "PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH";
  const META_KEY = "PNX_CMS_SEARCH_SYNC_META";
  const UPDATED_KEY = "PNX_CMS_TOURNAMENTS_UPDATED_AT";
  let lastUpdated = "";
  let lastHash = "";

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch(e) {
      return fallback;
    }
  }

  function cmsItemsInSearch(){
    if (typeof DUMMY_TOURNAMENTS === "undefined" || !Array.isArray(DUMMY_TOURNAMENTS)) return [];
    return DUMMY_TOURNAMENTS.filter(t => t && (t.source === "cms" || t.cmsSource || String(t.id || "").startsWith("cms_")));
  }

  function check(){
    const snapshot = readJson(SNAPSHOT_KEY, []);
    const meta = readJson(META_KEY, null);
    const inSearch = cmsItemsInSearch();

    const snapshotIds = new Set((Array.isArray(snapshot) ? snapshot : []).map(t => String(t.id || t.tournamentId || "")));
    const searchIds = new Set(inSearch.map(t => String(t.id || t.tournamentId || "").replace(/^cms_/, "")));

    const missing = [];
    snapshotIds.forEach(id => {
      if (!searchIds.has(id) && !searchIds.has("cms_" + id)) missing.push(id);
    });

    const result = {
      checkedAt: new Date().toISOString(),
      snapshotCount: Array.isArray(snapshot) ? snapshot.length : 0,
      searchCmsCount: inSearch.length,
      missing,
      ok: missing.length === 0,
      meta
    };

    window.__PNX_STEP68_LAST_SEARCH_SYNC_CHECK__ = result;
    try { localStorage.setItem("PNX_STEP68_LAST_SEARCH_SYNC_CHECK", JSON.stringify(result)); } catch(e) {}
    return result;
  }

  function refreshIfChanged(){
    const updated = localStorage.getItem(UPDATED_KEY) || "";
    const meta = readJson(META_KEY, null);
    const hash = meta && meta.hash || "";

    if (updated && updated !== lastUpdated || hash && hash !== lastHash) {
      lastUpdated = updated;
      lastHash = hash;
      try {
        if (typeof window.PNXRefreshSearchFromCms === "function") {
          window.PNXRefreshSearchFromCms();
        }
      } catch(e) {}

      setTimeout(check, 180);
      return true;
    }
    return false;
  }

  document.addEventListener("DOMContentLoaded", function(){
    lastUpdated = localStorage.getItem(UPDATED_KEY) || "";
    const meta = readJson(META_KEY, null);
    lastHash = meta && meta.hash || "";
    setTimeout(check, 900);
    setInterval(refreshIfChanged, 3500);
  });

  window.addEventListener("focus", function(){
    refreshIfChanged();
    setTimeout(check, 200);
  });

  window.addEventListener("storage", function(e){
    if (e.key === SNAPSHOT_KEY || e.key === META_KEY || e.key === UPDATED_KEY) {
      refreshIfChanged();
      setTimeout(check, 200);
    }
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_CMS_SEARCH_SNAPSHOT_UPDATED" ||
      data.type === "PNX_CMS_FINAL_SEARCH_SYNC_PUBLISHED" ||
      data.type === "PNX_CMS_FINAL_VALIDATED_PUBLISH_TO_APP"
    ) {
      try {
        if (typeof window.PNXRefreshSearchFromCms === "function") window.PNXRefreshSearchFromCms();
      } catch(e) {}
      setTimeout(check, 250);
    }
  });

  window.PNXCheckCmsSearchReflection = check;
  window.PNXRefreshSearchIfCmsChanged = refreshIfChanged;
})();


/* STEP68 search sync check request responder */
window.addEventListener("message", function(event){
  const data = event.data || {};
  if (data.type === "PNX_CMS_SEARCH_SYNC_CHECK_REQUEST") {
    try {
      const result = window.PNXCheckCmsSearchReflection && window.PNXCheckCmsSearchReflection();
      event.source && event.source.postMessage({
        type:"PNX_CMS_SEARCH_SYNC_CHECK_RESULT",
        payload:result
      }, "*");
    } catch(e) {}
  }
});


/* ================================================================
   STEP72: Apply CMS bound media to search cards
   CMSで大会画像に紐づけた画像を試合検索カードへ反映
   ================================================================ */
(function(){
  if (window.__PNX_STEP72_SEARCH_MEDIA_BINDING__) return;
  window.__PNX_STEP72_SEARCH_MEDIA_BINDING__ = true;

  function apply(){
    if (typeof DUMMY_TOURNAMENTS === "undefined" || !Array.isArray(DUMMY_TOURNAMENTS)) return 0;

    let count = 0;
    document.querySelectorAll(".s-tournament-card").forEach(card => {
      const id = card.dataset.id;
      const t = DUMMY_TOURNAMENTS.find(x => x && x.id === id);
      if (!t) return;

      const img = t.venueImageUrl || t.imageUrl || t.tournamentLogoUrl || "";
      if (!img) return;

      card.classList.add("pnx-has-cms-image");
      card.style.setProperty("--pnx-cms-card-image", `url("${img}")`);
      count += 1;
    });

    window.__PNX_STEP72_SEARCH_MEDIA_APPLIED__ = count;
    return count;
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(apply, 500);
    setTimeout(apply, 1500);
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_CMS_SEARCH_SNAPSHOT_UPDATED" ||
      data.type === "PNX_CMS_FINAL_SEARCH_SYNC_PUBLISHED" ||
      data.type === "PNX_CMS_TOURNAMENTS_UPDATED"
    ) {
      setTimeout(apply, 300);
    }
  });

  window.PNXApplyCmsMediaToSearchCards = apply;
})();


/* ================================================================
   STEP84: CMS Tournament Search Card / Detail Polish
   CMS登録大会を本体試合検索カード・詳細Bottom Sheetで自然に表示
   ================================================================ */
(function(){
  if (window.__PNX_STEP84_CMS_SEARCH_POLISH__) return;
  window.__PNX_STEP84_CMS_SEARCH_POLISH__ = true;

  function text(v){ return String(v == null ? "" : v).trim(); }

  function money(v){
    const s = text(v);
    if (!s || s === "—") return "未設定";
    if (/円|万|¥/.test(s)) return s;
    const n = Number(String(s).replace(/[,\s円¥]/g, ""));
    if (Number.isFinite(n) && n > 0) return n.toLocaleString("ja-JP") + "円";
    return s;
  }

  function date(v){
    const s = text(v);
    if (!s) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    return s;
  }

  function shortDate(v){
    const s = date(v);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return s || "日程未定";
    return `${Number(m[2])}/${Number(m[3])}`;
  }

  function formatDateRange(t){
    const start = date(t.start || t.startDate || t.date);
    const end = date(t.end || t.endDate || t.start || t.startDate || t.date);
    if (!start) return "日程未定";
    if (!end || end === start) return shortDate(start);
    return `${shortDate(start)}〜${shortDate(end)}`;
  }

  function statusLabel(status){
    const s = text(status).toLowerCase();
    if (/draft|下書き/.test(s)) return "下書き";
    if (/open|募集中/.test(s)) return "募集中";
    if (/near|締切間近/.test(s)) return "締切間近";
    if (/closed|締切|締め切り/.test(s)) return "締切";
    if (/ongoing|live|開催中/.test(s)) return "開催中";
    if (/finished|終了/.test(s)) return "終了";
    return "募集中";
  }

  function catLabel(t){
    return text(t.category || t.cat || "大会");
  }

  function isCms(t){
    return !!(t && (t.source === "cms" || t.cmsSource || String(t.id || "").startsWith("cms_") || String(t.id || "").startsWith("text_bulk_") || t.source === "chatgpt-organized-text-step83"));
  }

  function normalizeCmsItem(t){
    if (!t || !isCms(t)) return t;

    const title = text(t.name || t.title || t.tournamentTitle) || "CMS登録大会";
    const start = text(t.start || t.startDate || t.date);
    const end = text(t.end || t.endDate || t.start || t.startDate || t.date);
    const venue = text(t.course || t.venue || t.place) || "会場未定";
    const category = text(t.cat || t.category) || "未分類";

    t.id = text(t.id || t.tournamentId) || ("cms_" + title + "_" + start);
    t.tournamentId = text(t.tournamentId || t.id);
    t.name = title;
    t.title = title;

    t.start = start;
    t.startDate = start;
    t.end = end || start;
    t.endDate = end || start;

    t.course = venue;
    t.venue = venue;
    t.prefecture = text(t.prefecture || t.pref) || "";
    t.area = text(t.area) || "";
    t.cat = category;
    t.category = category;

    t.entryDeadline = text(t.entryDeadline || t.deadline) || "";
    t.entryFee = text(t.entryFee || t.fee) || "";
    t.prize = text(t.prize || t.totalPrize) || "";
    t.prizeWinner = text(t.prizeWinner || t.winnerPrize) || "";
    t.winnerPrize = text(t.winnerPrize || t.prizeWinner) || "";
    t.qualification = text(t.qualification || t.eligibility) || "";
    t.eligibility = text(t.eligibility || t.qualification) || "";
    t.organizer = text(t.organizer) || "";
    t.capacity = text(t.capacity) || "";
    t.officialUrl = text(t.officialUrl) || "";
    t.entryUrl = text(t.entryUrl) || "";
    t.instagramUrl = text(t.instagramUrl) || "";
    t.status = text(t.status || t.rawStatus) || "open";
    t.source = "cms";

    t._pnxStep84Normalized = true;
    return t;
  }

  function normalizeAllCmsItems(){
    if (typeof DUMMY_TOURNAMENTS === "undefined" || !Array.isArray(DUMMY_TOURNAMENTS)) return 0;
    let count = 0;
    DUMMY_TOURNAMENTS.forEach(t => {
      if (isCms(t)) {
        normalizeCmsItem(t);
        count += 1;
      }
    });
    window.__PNX_STEP84_NORMALIZED_COUNT__ = count;
    return count;
  }

  function getTournamentByCard(card){
    if (!card || typeof DUMMY_TOURNAMENTS === "undefined") return null;
    const id = card.dataset.id || card.getAttribute("data-id");
    return DUMMY_TOURNAMENTS.find(t => t && String(t.id) === String(id)) || null;
  }

  function chip(textValue, className){
    const span = document.createElement("span");
    span.className = "pnx-step84-chip " + (className || "");
    span.textContent = textValue;
    return span;
  }

  function polishCards(){
    normalizeAllCmsItems();

    document.querySelectorAll(".s-tournament-card").forEach(card => {
      const t = getTournamentByCard(card);
      if (!t || !isCms(t)) return;

      card.classList.add("pnx-step84-cms-card", "pnx-cms-tournament");
      card.dataset.cmsTournament = "1";

      if (!card.querySelector(".pnx-step84-cardbar")) {
        const bar = document.createElement("div");
        bar.className = "pnx-step84-cardbar";
        bar.appendChild(chip("CMS登録", "is-cms"));
        bar.appendChild(chip(statusLabel(t.status), "is-status"));
        bar.appendChild(chip(catLabel(t), "is-cat"));
        card.appendChild(bar);
      }

      if (!card.querySelector(".pnx-step84-cms-summary")) {
        const summary = document.createElement("div");
        summary.className = "pnx-step84-cms-summary";

        const rows = [
          ["日程", formatDateRange(t)],
          ["会場", t.course || t.venue || "会場未定"],
          ["締切", t.entryDeadline ? shortDate(t.entryDeadline) : "未設定"],
          ["参加費", money(t.entryFee)]
        ];

        rows.forEach(([k, v]) => {
          const item = document.createElement("span");
          item.innerHTML = `<b>${k}</b>${v}`;
          summary.appendChild(item);
        });

        card.appendChild(summary);
      }

      const img = t.venueImageUrl || t.imageUrl || t.tournamentLogoUrl || "";
      if (img) {
        card.classList.add("pnx-has-cms-image");
        card.style.setProperty("--pnx-cms-card-image", `url("${img}")`);
      }
    });

    return true;
  }

  function detailContainerCandidates(){
    return Array.from(document.querySelectorAll([
      ".s-sheet",
      ".bottom-sheet",
      ".sheet",
      ".modal",
      ".drawer",
      ".s-detail",
      ".tournament-detail",
      "[class*='sheet']",
      "[class*='modal']",
      "[class*='detail']"
    ].join(","))).filter(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 240 && rect.height > 120 && style.display !== "none" && style.visibility !== "hidden";
    });
  }

  function findTournamentForDetail(container){
    if (!container || typeof DUMMY_TOURNAMENTS === "undefined") return null;
    const textContent = container.textContent || "";
    const cms = DUMMY_TOURNAMENTS.filter(isCms).map(normalizeCmsItem);
    return cms.find(t => textContent.includes(t.name) || textContent.includes(t.title)) || null;
  }

  function makeDetailRow(label, value){
    const row = document.createElement("div");
    row.className = "pnx-step84-detail-row";
    row.innerHTML = `<span>${label}</span><strong>${value || "未設定"}</strong>`;
    return row;
  }

  function polishDetail(){
    normalizeAllCmsItems();

    detailContainerCandidates().forEach(container => {
      if (container.querySelector(".pnx-step84-detail-panel")) return;

      const t = findTournamentForDetail(container);
      if (!t || !isCms(t)) return;

      const panel = document.createElement("section");
      panel.className = "pnx-step84-detail-panel";

      const urls = [];
      if (t.officialUrl) urls.push(`<a href="${t.officialUrl}" target="_blank" rel="noopener">公式</a>`);
      if (t.entryUrl) urls.push(`<a href="${t.entryUrl}" target="_blank" rel="noopener">エントリー</a>`);
      if (t.instagramUrl) urls.push(`<a href="${t.instagramUrl}" target="_blank" rel="noopener">Instagram</a>`);

      panel.innerHTML = `
        <div class="pnx-step84-detail-head">
          <span>CMS登録情報</span>
          <b>${statusLabel(t.status)}</b>
        </div>
      `;

      panel.appendChild(makeDetailRow("日程", formatDateRange(t)));
      panel.appendChild(makeDetailRow("会場", t.course || t.venue));
      panel.appendChild(makeDetailRow("都道府県", t.prefecture || t.area));
      panel.appendChild(makeDetailRow("締切", t.entryDeadline || "未設定"));
      panel.appendChild(makeDetailRow("参加費", money(t.entryFee)));
      panel.appendChild(makeDetailRow("賞金総額", t.prize || "未設定"));
      panel.appendChild(makeDetailRow("優勝賞金", t.prizeWinner || t.winnerPrize || "未設定"));
      panel.appendChild(makeDetailRow("出場資格", t.qualification || t.eligibility || "未設定"));
      panel.appendChild(makeDetailRow("主催", t.organizer || "未設定"));

      if (urls.length) {
        const linkRow = document.createElement("div");
        linkRow.className = "pnx-step84-detail-links";
        linkRow.innerHTML = urls.join("");
        panel.appendChild(linkRow);
      }

      container.appendChild(panel);
    });
  }

  function run(){
    polishCards();
    polishDetail();
  }

  const oldRefresh = window.PNXRefreshSearchFromCms;
  if (typeof oldRefresh === "function" && !oldRefresh.__pnxStep84Wrapped) {
    const wrapped = function(){
      const result = oldRefresh.apply(this, arguments);
      setTimeout(run, 80);
      setTimeout(run, 420);
      return result;
    };
    wrapped.__pnxStep84Wrapped = true;
    window.PNXRefreshSearchFromCms = wrapped;
  }

  const observer = new MutationObserver(function(){
    clearTimeout(window.__PNX_STEP84_TIMER__);
    window.__PNX_STEP84_TIMER__ = setTimeout(run, 120);
  });

  document.addEventListener("DOMContentLoaded", function(){
    try { observer.observe(document.body, { childList:true, subtree:true }); } catch(e) {}
    setTimeout(run, 300);
    setTimeout(run, 1000);
    setTimeout(run, 2200);
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_CMS_SEARCH_SNAPSHOT_UPDATED" ||
      data.type === "PNX_CMS_FINAL_SEARCH_SYNC_PUBLISHED" ||
      data.type === "PNX_CMS_TOURNAMENTS_UPDATED" ||
      data.type === "PNX_REFRESH_CMS_TOURNAMENTS"
    ) {
      setTimeout(run, 160);
      setTimeout(run, 600);
    }
  });

  window.PNXPolishCmsSearchCardsAndDetails = run;
  window.PNXNormalizeCmsSearchTournament = normalizeCmsItem;
})();


/* ================================================================
   STEP85: Search Hard Reader for CMS Reflection
   本体試合検索側でCMS公開スナップショットを強制的にDUMMY_TOURNAMENTSへ流す
   ================================================================ */
(function(){
  if (window.__PNX_STEP85_SEARCH_HARD_READER__) return;
  window.__PNX_STEP85_SEARCH_HARD_READER__ = true;

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch(e) {
      return fallback;
    }
  }

  function text(v){ return String(v == null ? "" : v).trim(); }

  function normalize(t, index){
    const id = text(t.id || t.tournamentId) || ("cms_step85_" + index);
    const title = text(t.title || t.name) || "CMS登録大会";
    const start = text(t.start || t.startDate || t.date);
    const end = text(t.end || t.endDate || t.start || t.startDate || t.date) || start;
    const venue = text(t.course || t.venue || t.place) || "会場未定";
    const category = text(t.cat || t.category) || "未分類";

    return Object.assign({}, t, {
      id,
      tournamentId: id,
      title,
      name: title,
      start,
      startDate: start,
      end,
      endDate: end,
      course: venue,
      venue,
      cat: category,
      category,
      status: text(t.status || "open"),
      source: "cms",
      cmsSource: t.cmsSource || "step85-search-hard-reader"
    });
  }

  function inject(){
    const snap = readJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", []);
    const hard = readJson("PNX_STEP85_HARD_SYNC_PAYLOAD", null);
    const list = Array.isArray(snap) && snap.length ? snap : (hard && Array.isArray(hard.tournaments) ? hard.tournaments : []);

    if (!Array.isArray(list) || !list.length) {
      window.__PNX_STEP85_SEARCH_INJECT_RESULT__ = { ok:false, reason:"snapshot_empty", count:0 };
      return window.__PNX_STEP85_SEARCH_INJECT_RESULT__;
    }

    if (typeof DUMMY_TOURNAMENTS === "undefined" || !Array.isArray(DUMMY_TOURNAMENTS)) {
      window.__PNX_STEP85_SEARCH_INJECT_RESULT__ = { ok:false, reason:"DUMMY_TOURNAMENTS_missing", count:list.length };
      return window.__PNX_STEP85_SEARCH_INJECT_RESULT__;
    }

    let added = 0;
    let updated = 0;

    list.map(normalize).forEach(item => {
      const idx = DUMMY_TOURNAMENTS.findIndex(t => t && String(t.id || t.tournamentId) === String(item.id || item.tournamentId));
      if (idx >= 0) {
        DUMMY_TOURNAMENTS[idx] = Object.assign({}, DUMMY_TOURNAMENTS[idx], item);
        updated += 1;
      } else {
        DUMMY_TOURNAMENTS.unshift(item);
        added += 1;
      }
    });

    try {
      if (typeof applyFiltersAndRender === "function") applyFiltersAndRender();
      else if (typeof renderTournamentList === "function") renderTournamentList(DUMMY_TOURNAMENTS);
    } catch(e) {}

    try {
      if (typeof window.PNXPolishCmsSearchCardsAndDetails === "function") {
        setTimeout(window.PNXPolishCmsSearchCardsAndDetails, 120);
      }
    } catch(e) {}

    const result = { ok:true, count:list.length, added, updated, titles:list.slice(0,5).map(t => t.title || t.name) };
    window.__PNX_STEP85_SEARCH_INJECT_RESULT__ = result;
    try { localStorage.setItem("PNX_STEP85_SEARCH_INJECT_RESULT", JSON.stringify(result)); } catch(e) {}
    return result;
  }

  function diagnose(){
    const snap = readJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", []);
    const result = inject();
    const diag = {
      checkedAt: new Date().toISOString(),
      snapshotCount: Array.isArray(snap) ? snap.length : 0,
      inject: result,
      hasDummy: typeof DUMMY_TOURNAMENTS !== "undefined" && Array.isArray(DUMMY_TOURNAMENTS),
      renderedCards: document.querySelectorAll(".s-tournament-card").length
    };
    console.group("STEP85 Search Reflection Diagnose");
    console.log(diag);
    console.groupEnd();
    return diag;
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(inject, 300);
    setTimeout(inject, 900);
    setTimeout(inject, 1800);
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_STEP85_HARD_SYNC_UPDATED" ||
      data.type === "PNX_CMS_TOURNAMENTS_UPDATED" ||
      data.type === "PNX_REFRESH_CMS_TOURNAMENTS"
    ) {
      setTimeout(inject, 100);
      setTimeout(inject, 500);
    }
  });

  window.addEventListener("storage", function(e){
    if (
      e.key === "PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH" ||
      e.key === "PNX_STEP85_HARD_SYNC_PAYLOAD" ||
      e.key === "PNX_CMS_SEARCH_SYNC_META"
    ) {
      setTimeout(inject, 100);
    }
  });

  window.PNXStep85InjectCmsSnapshotToSearch = inject;
  window.PNXStep85DiagnoseSearchReflection = diagnose;
})();


/* ================================================================
   STEP86: Search iframe alert reflection diagnostics
   iframe内部の注入結果をアラート確認
   ================================================================ */
(function(){
  if (window.__PNX_STEP86_SEARCH_ALERT_DIAG__) return;
  window.__PNX_STEP86_SEARCH_ALERT_DIAG__ = true;

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch(e) {
      return fallback;
    }
  }

  window.PNXStep86SearchAlertDiagnose = function(){
    const snap = readJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", []);
    let inject = null;

    try {
      if (typeof window.PNXStep85InjectCmsSnapshotToSearch === "function") {
        inject = window.PNXStep85InjectCmsSnapshotToSearch();
      }
    } catch(e) {
      inject = { ok:false, error:e.message || String(e) };
    }

    alert(
      "試合検索iframe診断\n\n" +
      "CMS公開大会: " + (Array.isArray(snap) ? snap.length : 0) + "件\n" +
      "注入結果: " + JSON.stringify(inject) + "\n" +
      "表示カード数: " + document.querySelectorAll(".s-tournament-card").length + "件"
    );

    return inject;
  };
})();


/* ================================================================
   STEP87: Search iframe CMS Injection / Render Final Fix
   本体側がCMS公開大会を見えているのに試合検索に出ない問題を修正
   ================================================================ */
(function(){
  if (window.__PNX_STEP87_SEARCH_IFRAME_RENDER_FIX__) return;
  window.__PNX_STEP84_CMS_SEARCH_POLISH__ = true;
  window.__PNX_STEP85_SEARCH_HARD_READER__ = true;
  window.__PNX_STEP87_SEARCH_IFRAME_RENDER_FIX__ = true;

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch(e) {
      return fallback;
    }
  }

  function text(v){ return String(v == null ? "" : v).trim(); }

  const PREF_MAP = {
    "北海道":"hokkaido","青森県":"aomori","岩手県":"iwate","宮城県":"miyagi","秋田県":"akita","山形県":"yamagata","福島県":"fukushima",
    "茨城県":"ibaraki","栃木県":"tochigi","群馬県":"gunma","埼玉県":"saitama","千葉県":"chiba","東京都":"tokyo","神奈川県":"kanagawa","山梨県":"yamanashi",
    "新潟県":"niigata","長野県":"nagano","富山県":"toyama","石川県":"ishikawa","福井県":"fukui","岐阜県":"gifu","静岡県":"shizuoka","愛知県":"aichi","三重県":"mie",
    "滋賀県":"shiga","京都府":"kyoto","大阪府":"osaka","兵庫県":"hyogo","奈良県":"nara","和歌山県":"wakayama",
    "鳥取県":"tottori","島根県":"shimane","岡山県":"okayama","広島県":"hiroshima","山口県":"yamaguchi",
    "徳島県":"tokushima","香川県":"kagawa","愛媛県":"ehime","高知県":"kochi",
    "福岡県":"fukuoka","佐賀県":"saga","長崎県":"nagasaki","熊本県":"kumamoto","大分県":"oita","宮崎県":"miyazaki","鹿児島県":"kagoshima","沖縄県":"okinawa"
  };

  const AREA_FROM_PREF = {
    hokkaido:"hokkaido",
    aomori:"tohoku", iwate:"tohoku", miyagi:"tohoku", akita:"tohoku", yamagata:"tohoku", fukushima:"tohoku",
    ibaraki:"kanto", tochigi:"kanto", gunma:"kanto", saitama:"kanto", chiba:"kanto", tokyo:"kanto", kanagawa:"kanto", yamanashi:"kanto",
    niigata:"chubu", nagano:"chubu", toyama:"chubu", ishikawa:"chubu", fukui:"chubu", gifu:"chubu", shizuoka:"chubu", aichi:"chubu", mie:"chubu",
    shiga:"kinki", kyoto:"kinki", osaka:"kinki", hyogo:"kinki", nara:"kinki", wakayama:"kinki",
    tottori:"chugoku", shimane:"chugoku", okayama:"chugoku", hiroshima:"chugoku", yamaguchi:"chugoku",
    tokushima:"shikoku", kagawa:"shikoku", ehime:"shikoku", kochi:"shikoku",
    fukuoka:"kyushu", saga:"kyushu", nagasaki:"kyushu", kumamoto:"kyushu", oita:"kyushu", miyazaki:"kyushu", kagoshima:"kyushu", okinawa:"kyushu"
  };

  function normalizeCategory(v){
    const s = text(v).toLowerCase();
    if (/jgto|男子ツアー/.test(s)) return "jgto";
    if (/jlpga|lpga|女子|ステップ/.test(s)) return "lpga";
    if (/qt/.test(s)) return "qt";
    if (/ミニ|mini|atp|future|fj|カートルズ|cartles|doucus|p&a/.test(s)) return "mini";
    if (/オープン|open|県オープン|選手権|地方オープン/.test(s)) return "open";
    if (/学生/.test(s)) return "student";
    if (/asian|アジア/.test(s)) return "asian";
    if (/pga/.test(s)) return "pga";
    if (/海外|韓国|台湾|中国|フィリピン|liv|dp world|korn/.test(s)) return "abroad";
    return s && /^[a-z]+$/.test(s) ? s : "other";
  }

  function normalizeGender(v){
    const s = text(v).toLowerCase();
    if (/女子|women|womens|female|lpga/.test(s)) return "womens";
    if (/男女|mixed/.test(s)) return "all";
    return "mens";
  }

  function normalizeStatus(v){
    const s = text(v).toLowerCase();
    if (/near|締切間近/.test(s)) return "near";
    if (/closed|締切|終了|finished/.test(s)) return "closed";
    if (/live|ongoing|開催中/.test(s)) return "live";
    return "open";
  }

  function normalizePref(v){
    const s = text(v);
    if (!s) return "";
    if (PREF_MAP[s]) return PREF_MAP[s];
    const hit = Object.keys(PREF_MAP).find(k => s.includes(k) || s.includes(k.replace(/[県府都]/g, "")));
    return hit ? PREF_MAP[hit] : s;
  }

  function normalizeDate(v){
    const s = text(v);
    if (!s) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    let m = s.match(/(20\d{2})[\/年.-]\s*(\d{1,2})[\/月.-]\s*(\d{1,2})/);
    if (m) return `${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`;
    m = s.match(/(\d{1,2})[\/月]\s*(\d{1,2})/);
    if (m) return `${new Date().getFullYear()}-${String(m[1]).padStart(2,"0")}-${String(m[2]).padStart(2,"0")}`;
    return s;
  }

  function readSnapshot(){
    const snap = readJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", []);
    const hard = readJson("PNX_STEP85_HARD_SYNC_PAYLOAD", null);
    if (Array.isArray(snap) && snap.length) return snap;
    if (hard && Array.isArray(hard.tournaments)) return hard.tournaments;
    return [];
  }

  function normalizeTournament(t, index){
    const id = text(t.id || t.tournamentId) || ("cms_step87_" + Date.now() + "_" + index);
    const title = text(t.name || t.title || t.tournamentTitle) || "CMS登録大会";
    const start = normalizeDate(t.start || t.startDate || t.date);
    const end = normalizeDate(t.end || t.endDate || t.start || t.startDate || t.date) || start;
    const pref = normalizePref(t.prefecture || t.pref);
    const area = text(t.area);
    const cat = normalizeCategory(t.cat || t.category);
    const course = text(t.course || t.venue || t.place) || "会場未定";

    return Object.assign({}, t, {
      id,
      tournamentId: id,
      name: title,
      title,
      cat,
      category: text(t.category || t.cat) || cat,
      gender: normalizeGender(t.gender || t.sex || t.category),
      region: /海外|abroad|asian|pga/.test(cat) ? "overseas" : "domestic",
      area: area && /^[a-z]+$/.test(area) ? area : (AREA_FROM_PREF[pref] || "kanto"),
      prefecture: pref || "kanto",
      course,
      venue: course,
      start,
      startDate: start,
      end,
      endDate: end,
      entryDeadline: normalizeDate(t.entryDeadline || t.deadline),
      cancelDeadline: normalizeDate(t.cancelDeadline || t.entryDeadline || t.deadline),
      prize: text(t.prize || t.totalPrize) || "—",
      prizeWinner: text(t.prizeWinner || t.winnerPrize) || "—",
      winnerPrize: text(t.winnerPrize || t.prizeWinner) || "—",
      entryFee: text(t.entryFee || t.fee) || "—",
      practiceRoundFee: text(t.practiceRoundFee) || "—",
      entryMethod: text(t.entryMethod || t.entryUrl || t.officialUrl) || "CMS登録情報を確認",
      qualification: text(t.qualification || t.eligibility) || "—",
      eligibility: text(t.eligibility || t.qualification) || "—",
      capacity: text(t.capacity) || "—",
      organizer: text(t.organizer) || "—",
      status: normalizeStatus(t.status),
      emoji: t.emoji || "⛳",
      tags: Array.isArray(t.tags) ? t.tags : ["CMS登録"],
      addedToCalendar: !!t.addedToCalendar,
      favorited: !!t.favorited,
      source: "cms",
      cmsSource: t.cmsSource || "step87-search-render-fix",
      _pnxStep87: true
    });
  }

  function injectToDummy(){
    const source = readSnapshot();
    if (!Array.isArray(source) || !source.length) {
      return { ok:false, reason:"snapshot_empty", sourceCount:0, added:0, updated:0, ids:[] };
    }

    if (typeof DUMMY_TOURNAMENTS === "undefined" || !Array.isArray(DUMMY_TOURNAMENTS)) {
      return { ok:false, reason:"DUMMY_TOURNAMENTS_missing", sourceCount:source.length, added:0, updated:0, ids:[] };
    }

    let added = 0;
    let updated = 0;
    const items = source.map(normalizeTournament);

    items.forEach(item => {
      const idx = DUMMY_TOURNAMENTS.findIndex(t => String(t.id || t.tournamentId) === String(item.id || item.tournamentId));
      if (idx >= 0) {
        DUMMY_TOURNAMENTS[idx] = Object.assign({}, DUMMY_TOURNAMENTS[idx], item);
        updated += 1;
      } else {
        DUMMY_TOURNAMENTS.unshift(item);
        added += 1;
      }
    });

    return { ok:true, sourceCount:source.length, added, updated, ids:items.map(t => t.id), titles:items.map(t => t.name), items };
  }

  function resetFiltersForCmsVisibility(){
    try {
      if (typeof APP_STATE !== "undefined") {
        APP_STATE.selectedCategory = "all";
        APP_STATE.selectedGender = "all";
        APP_STATE.searchQuery = "";
        APP_STATE.selectedArea = "all";
        APP_STATE.sortKey = "new";
        if (APP_STATE.activeFilters && APP_STATE.activeFilters.clear) APP_STATE.activeFilters.clear();
        if (APP_STATE.detailFilters) {
          if (APP_STATE.detailFilters.areas && APP_STATE.detailFilters.areas.clear) APP_STATE.detailFilters.areas.clear();
          if (APP_STATE.detailFilters.categories && APP_STATE.detailFilters.categories.clear) APP_STATE.detailFilters.categories.clear();
          if (APP_STATE.detailFilters.statuses && APP_STATE.detailFilters.statuses.clear) APP_STATE.detailFilters.statuses.clear();
          APP_STATE.detailFilters.gender = "";
          APP_STATE.detailFilters.timing = "";
          APP_STATE.detailFilters.prizeMin = "";
          APP_STATE.detailFilters.entryFeeMax = "";
        }
        const input = document.getElementById("search-input");
        if (input) input.value = "";
      }
    } catch(e) {}
  }

  function attachCardClicks(root){
    (root || document).querySelectorAll(".s-tournament-card").forEach(card => {
      if (card.__pnxStep87ClickBound) return;
      card.__pnxStep87ClickBound = true;
      card.addEventListener("click", function(e){
        if (e.target.closest(".tc-btn") || e.target.closest(".tc-fav-btn")) return;
        const id = card.dataset.id;
        try { if (typeof openBottomSheet === "function") openBottomSheet(id); } catch(err) {}
      });
    });
  }

  function renderFallbackCmsSection(items){
    const list = document.getElementById("tournament-list");
    if (!list || !Array.isArray(items) || !items.length) return 0;

    let section = document.getElementById("pnx-step87-cms-visible-section");
    if (!section) {
      section = document.createElement("section");
      section.id = "pnx-step87-cms-visible-section";
      section.className = "pnx-step87-cms-section";
      list.parentNode.insertBefore(section, list);
    }

    let html = `
      <div class="pnx-step87-cms-section__head">
        <div>
          <span>CMS反映大会</span>
          <strong>${items.length}件を表示中</strong>
        </div>
        <button type="button" id="pnx-step87-refresh-btn">再読込</button>
      </div>
      <div class="pnx-step87-cms-section__list">
    `;

    if (typeof tournamentCardHTML === "function") {
      html += items.map(tournamentCardHTML).join("");
    } else {
      html += items.map(t => `
        <article class="s-tournament-card pnx-step84-cms-card" data-id="${t.id}">
          <h3 class="tc-name">${t.name}</h3>
          <div class="tc-venue-line">${t.course}</div>
          <div class="pnx-step84-cardbar"><span class="pnx-step84-chip is-cms">CMS登録</span></div>
        </article>
      `).join("");
    }

    html += `</div>`;
    section.innerHTML = html;

    const btn = section.querySelector("#pnx-step87-refresh-btn");
    if (btn) btn.onclick = function(){ forceRender(true); };

    attachCardClicks(section);
    return items.length;
  }

  function countVisibleCmsCards(ids){
    const idSet = new Set((ids || []).map(String));
    let count = 0;
    document.querySelectorAll(".s-tournament-card").forEach(card => {
      if (idSet.has(String(card.dataset.id))) count += 1;
    });
    return count;
  }

  function forceRender(showAlert){
    const inject = injectToDummy();

    if (!inject.ok) {
      window.__PNX_STEP87_LAST_RESULT__ = { inject, visibleCount:0, fallbackCount:0 };
      if (showAlert) {
        alert("試合検索反映診断\n\nCMS大会を注入できません。\n理由: " + inject.reason + "\n\nCMS側と本体側の反映診断で、公開大会が1件以上あるか確認してください。");
      }
      return window.__PNX_STEP87_LAST_RESULT__;
    }

    resetFiltersForCmsVisibility();

    try { if (typeof renderGenderSegment === "function") renderGenderSegment(); } catch(e) {}
    try { if (typeof renderCategoryChips === "function") renderCategoryChips(); } catch(e) {}
    try { if (typeof renderConditionFilters === "function") renderConditionFilters(); } catch(e) {}
    try { if (typeof updateFilterBadge === "function") updateFilterBadge(); } catch(e) {}

    try {
      if (typeof applyFiltersAndRender === "function") applyFiltersAndRender();
      else if (typeof renderTournamentList === "function") renderTournamentList(DUMMY_TOURNAMENTS);
    } catch(e) {}

    const finish = () => {
      const visible = countVisibleCmsCards(inject.ids);
      let fallback = 0;

      if (visible < inject.ids.length) {
        fallback = renderFallbackCmsSection(inject.items);
      } else {
        const old = document.getElementById("pnx-step87-cms-visible-section");
        if (old) old.remove();
      }

      try { if (typeof window.PNXPolishCmsSearchCardsAndDetails === "function") window.PNXPolishCmsSearchCardsAndDetails(); } catch(e) {}

      const cardsAfter = countVisibleCmsCards(inject.ids);
      const result = {
        ok: cardsAfter > 0,
        injected: inject.sourceCount,
        added: inject.added,
        updated: inject.updated,
        visibleBeforeFallback: visible,
        fallbackRendered: fallback,
        visibleAfter: cardsAfter,
        titles: inject.titles
      };

      window.__PNX_STEP87_LAST_RESULT__ = result;
      try { localStorage.setItem("PNX_STEP87_SEARCH_RENDER_RESULT", JSON.stringify(result)); } catch(e) {}

      if (showAlert) {
        alert(
          "試合検索iframe反映診断\n\n" +
          "CMS公開大会: " + inject.sourceCount + "件\n" +
          "DUMMY_TOURNAMENTS追加: " + inject.added + "件\n" +
          "更新: " + inject.updated + "件\n" +
          "通常リスト表示: " + visible + "件\n" +
          "補助表示: " + fallback + "件\n" +
          "最終表示: " + cardsAfter + "件\n\n" +
          (result.ok ? "結果: 表示できています。" : "結果: まだ表示できていません。") +
          "\n\n大会:\n・" + inject.titles.join("\n・")
        );
      }

      return result;
    };

    setTimeout(finish, 260);
    setTimeout(finish, 650);
    return { ok:true, pending:true, injected:inject.sourceCount, titles:inject.titles };
  }

  function makeButton(){
    if (document.getElementById("pnx-step87-search-alert-btn")) return;
    const btn = document.createElement("button");
    btn.id = "pnx-step87-search-alert-btn";
    btn.type = "button";
    btn.textContent = "CMS大会を表示";
    btn.onclick = function(){ forceRender(true); };
    document.body.appendChild(btn);
  }

  window.PNXStep87InjectAndRenderCmsTournaments = forceRender;
  window.PNXStep87SearchAlertDiagnose = function(){ return forceRender(true); };

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(makeButton, 700);
    setTimeout(forceRender, 300);
    setTimeout(forceRender, 1000);
    setTimeout(forceRender, 2200);
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_STEP85_HARD_SYNC_UPDATED" ||
      data.type === "PNX_CMS_TOURNAMENTS_UPDATED" ||
      data.type === "PNX_REFRESH_CMS_TOURNAMENTS" ||
      data.type === "PNX_STEP87_FORCE_RENDER_CMS"
    ) {
      setTimeout(forceRender, 100);
      setTimeout(forceRender, 520);
    }
  });

  window.addEventListener("storage", function(e){
    if (
      e.key === "PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH" ||
      e.key === "PNX_STEP85_HARD_SYNC_PAYLOAD" ||
      e.key === "PNX_CMS_SEARCH_SYNC_META"
    ) {
      setTimeout(forceRender, 120);
    }
  });
})();


/* ================================================================
   STEP89: official list auto render hooks
   ================================================================ */
(function(){
  if (window.__PNX_STEP89_OFFICIAL_LIST_HOOKS__) return;
  window.__PNX_STEP89_OFFICIAL_LIST_HOOKS__ = true;

  function run(){
    try { pnxStep89RenderOfficialCmsList(false); } catch(e) {}
  }

  function makeButton(){
    if (document.getElementById("pnx-step89-official-list-btn")) return;
    const btn = document.createElement("button");
    btn.id = "pnx-step89-official-list-btn";
    btn.type = "button";
    btn.textContent = "正式一覧へ統合";
    btn.onclick = function(){ pnxStep89RenderOfficialCmsList(true); };
    document.body.appendChild(btn);
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(makeButton, 700);
    setTimeout(run, 250);
    setTimeout(run, 900);
    setTimeout(run, 1800);
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_STEP85_HARD_SYNC_UPDATED" ||
      data.type === "PNX_STEP87_FORCE_RENDER_CMS" ||
      data.type === "PNX_STEP89_RENDER_OFFICIAL_LIST" ||
      data.type === "PNX_CMS_TOURNAMENTS_UPDATED" ||
      data.type === "PNX_REFRESH_CMS_TOURNAMENTS"
    ) {
      setTimeout(run, 120);
      setTimeout(run, 520);
    }
  });

  window.addEventListener("storage", function(e){
    if (
      e.key === "PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH" ||
      e.key === "PNX_STEP85_HARD_SYNC_PAYLOAD" ||
      e.key === "PNX_CMS_SEARCH_SYNC_META"
    ) {
      setTimeout(run, 120);
    }
  });
})();


/* ================================================================
   STEP90: Force CMS tournaments into official card list
   既存フィルター/再描画に消されても #tournament-list へ正式カードHTMLで直接表示
   ================================================================ */
(function(){
  if (window.__PNX_STEP90_FORCE_CMS_OFFICIAL_LIST__) return;
  window.__PNX_STEP90_FORCE_CMS_OFFICIAL_LIST__ = true;

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch(e) {
      return fallback;
    }
  }

  function text(v){ return String(v == null ? "" : v).trim(); }

  function getSnapshot(){
    const snap = readJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", []);
    const hard = readJson("PNX_STEP85_HARD_SYNC_PAYLOAD", null);
    if (Array.isArray(snap) && snap.length) return snap;
    if (hard && Array.isArray(hard.tournaments) && hard.tournaments.length) return hard.tournaments;
    return [];
  }

  function normalize(t, index){
    if (typeof pnxStep89NormalizeCmsTournament === "function") {
      return pnxStep89NormalizeCmsTournament(t, index);
    }

    const id = text(t.id || t.tournamentId) || ("cms_step90_" + Date.now() + "_" + index);
    const title = text(t.title || t.name) || "CMS登録大会";
    const start = text(t.start || t.startDate || t.date);
    const end = text(t.end || t.endDate || t.start || t.startDate || t.date) || start;
    const venue = text(t.course || t.venue || t.place) || "会場未定";

    return Object.assign({}, t, {
      id,
      tournamentId: id,
      title,
      name: title,
      cat: text(t.cat || t.category) || "open",
      category: text(t.category || t.cat) || "オープン大会",
      gender: /女子|JLPGA|lpga/i.test(text(t.gender || t.category)) ? "womens" : "mens",
      region: "domestic",
      area: "kanto",
      prefecture: "saitama",
      course: venue,
      venue,
      start,
      startDate: start,
      end,
      endDate: end,
      entryDeadline: text(t.entryDeadline || t.deadline),
      cancelDeadline: text(t.cancelDeadline || t.entryDeadline || t.deadline),
      prize: text(t.prize) || "—",
      prizeWinner: text(t.prizeWinner || t.winnerPrize) || "—",
      winnerPrize: text(t.winnerPrize || t.prizeWinner) || "—",
      entryFee: text(t.entryFee || t.fee) || "—",
      practiceRoundFee: text(t.practiceRoundFee) || "—",
      entryMethod: text(t.entryMethod || t.entryUrl || t.officialUrl) || "CMS登録情報を確認",
      qualification: text(t.qualification || t.eligibility) || "—",
      eligibility: text(t.eligibility || t.qualification) || "—",
      capacity: text(t.capacity) || "—",
      organizer: text(t.organizer) || "—",
      status: "open",
      emoji: "⛳",
      tags: ["CMS登録"],
      source: "cms",
      cmsSource: "step90-force-official-list",
      _pnxStep90Official: true
    });
  }

  function merge(items){
    if (typeof DUMMY_TOURNAMENTS === "undefined" || !Array.isArray(DUMMY_TOURNAMENTS)) {
      return { ok:false, reason:"DUMMY_TOURNAMENTS_missing", items };
    }

    items.forEach(item => {
      const idx = DUMMY_TOURNAMENTS.findIndex(t => String(t.id || t.tournamentId) === String(item.id || item.tournamentId));
      if (idx >= 0) DUMMY_TOURNAMENTS[idx] = Object.assign({}, DUMMY_TOURNAMENTS[idx], item);
      else DUMMY_TOURNAMENTS.unshift(item);
    });

    return { ok:true, items };
  }

  function bindRenderedCards(container, items){
    if (!container) return;

    container.querySelectorAll(".s-tournament-card").forEach(card => {
      const id = card.dataset.id;
      const t = items.find(x => String(x.id || x.tournamentId) === String(id));
      if (t) {
        card.classList.add("pnx-step90-force-card", "pnx-step89-official-card", "pnx-step84-cms-card", "pnx-cms-tournament");
        card.dataset.cmsTournament = "1";
      }

      if (card.__pnxStep90Bound) return;
      card.__pnxStep90Bound = true;
      card.addEventListener("click", function(e){
        if (e.target.closest(".tc-btn") || e.target.closest(".tc-fav-btn")) return;
        try { if (typeof openBottomSheet === "function") openBottomSheet(id); } catch(err) {}
      });
    });
  }

  function render(showAlert){
    const raw = getSnapshot();
    const items = raw.map(normalize);

    const container = document.getElementById("tournament-list");
    if (!container) {
      if (showAlert) alert("STEP90\n\n#tournament-list が見つかりません。");
      return { ok:false, reason:"tournament_list_missing", count:items.length };
    }

    if (!items.length) {
      if (showAlert) {
        alert("STEP90\n\nCMS公開大会が0件です。\nCMSで募集中保存 → CMS反映診断を確認してください。");
      }
      return { ok:false, reason:"snapshot_empty", count:0 };
    }

    merge(items);

    let current = [];
    try {
      const ids = new Set(items.map(x => String(x.id || x.tournamentId)));
      current = (Array.isArray(DUMMY_TOURNAMENTS) ? DUMMY_TOURNAMENTS : [])
        .filter(t => !ids.has(String(t.id || t.tournamentId)))
        .slice(0, 20);
    } catch(e) {}

    const list = items.concat(current);

    try {
      if (typeof renderTournamentList === "function") {
        renderTournamentList(list);
      } else if (typeof tournamentCardHTML === "function") {
        container.innerHTML = list.map(tournamentCardHTML).join("");
      } else {
        container.innerHTML = items.map(t => `<article class="s-tournament-card pnx-step90-force-card" data-id="${t.id}"><h3>${t.name}</h3><p>${t.course}</p></article>`).join("");
      }
    } catch(e) {
      container.innerHTML = items.map(t => `<article class="s-tournament-card pnx-step90-force-card" data-id="${t.id}"><h3>${t.name}</h3><p>${t.course}</p></article>`).join("");
    }

    bindRenderedCards(container, items);

    try {
      if (typeof window.PNXPolishCmsSearchCardsAndDetails === "function") {
        window.PNXPolishCmsSearchCardsAndDetails();
      }
    } catch(e) {}

    const visible = container.querySelectorAll(".s-tournament-card.pnx-step90-force-card, .s-tournament-card[data-cms-tournament='1']").length;
    const result = {
      ok: visible > 0,
      count: items.length,
      visible,
      totalCards: container.querySelectorAll(".s-tournament-card").length,
      titles: items.map(t => t.name)
    };

    window.__PNX_STEP90_FORCE_RESULT__ = result;
    try { localStorage.setItem("PNX_STEP90_FORCE_RESULT", JSON.stringify(result)); } catch(e) {}

    if (showAlert) {
      alert(
        "STEP90 強制正式カード表示\n\n" +
        "CMS公開大会: " + items.length + "件\n" +
        "CMSカード表示: " + visible + "件\n" +
        "全カード表示: " + result.totalCards + "件\n\n" +
        (visible > 0 ? "結果: スクショの大会カード一覧の場所に表示しました。" : "結果: まだ表示できていません。") +
        "\n\n大会:\n・" + items.map(t => t.name).join("\n・")
      );
    }

    return result;
  }

  function makeButton(){
    if (document.getElementById("pnx-step90-force-list-btn")) return;
    const btn = document.createElement("button");
    btn.id = "pnx-step90-force-list-btn";
    btn.type = "button";
    btn.textContent = "CMSカードを出す";
    btn.onclick = function(){ render(true); };
    document.body.appendChild(btn);
  }

  window.PNXStep90ForceCmsIntoOfficialCardList = render;

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(makeButton, 800);
    setTimeout(function(){ render(false); }, 500);
    setTimeout(function(){ render(false); }, 1400);
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_STEP90_FORCE_OFFICIAL_CARDS" ||
      data.type === "PNX_STEP89_RENDER_OFFICIAL_LIST" ||
      data.type === "PNX_STEP85_HARD_SYNC_UPDATED" ||
      data.type === "PNX_CMS_TOURNAMENTS_UPDATED" ||
      data.type === "PNX_REFRESH_CMS_TOURNAMENTS"
    ) {
      setTimeout(function(){ render(false); }, 160);
      setTimeout(function(){ render(false); }, 620);
    }
  });

  window.addEventListener("storage", function(e){
    if (
      e.key === "PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH" ||
      e.key === "PNX_STEP85_HARD_SYNC_PAYLOAD"
    ) {
      setTimeout(function(){ render(false); }, 160);
    }
  });
})();


/* ================================================================
   STEP91: Search iframe latest script marker
   iframeが最新 script.js を読めているか親から判定する
   ================================================================ */
(function(){
  window.__PNX_SEARCH_SCRIPT_VERSION__ = "step91";
  window.__PNX_STEP91_SEARCH_LOADED_AT__ = new Date().toISOString();

  window.PNXStep91SearchVersionAlert = function(){
    alert(
      "試合検索iframe script診断\n\n" +
      "version: " + window.__PNX_SEARCH_SCRIPT_VERSION__ + "\n" +
      "loadedAt: " + window.__PNX_STEP91_SEARCH_LOADED_AT__ + "\n" +
      "STEP90 API: " + (typeof window.PNXStep90ForceCmsIntoOfficialCardList === "function" ? "あり" : "なし") + "\n" +
      "STEP89 API: " + (typeof window.PNXStep89RenderOfficialCmsList === "function" ? "あり" : "なし")
    );
  };
})();


/* ================================================================
   STEP92: Clean CMS official list rendering
   診断/応急ボタンを整理し、CMS大会を既存カードと同じ見た目で正式一覧へ表示
   ================================================================ */
(function(){
  if (window.__PNX_STEP92_CLEAN_CMS_OFFICIAL__) return;
  window.__PNX_STEP92_CLEAN_CMS_OFFICIAL__ = true;

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch(e) {
      return fallback;
    }
  }

  function text(v){ return String(v == null ? "" : v).trim(); }

  function getSnapshot(){
    const snap = readJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", []);
    const hard = readJson("PNX_STEP85_HARD_SYNC_PAYLOAD", null);
    if (Array.isArray(snap) && snap.length) return snap;
    if (hard && Array.isArray(hard.tournaments) && hard.tournaments.length) return hard.tournaments;
    return [];
  }

  function normalize(t, index){
    if (typeof pnxStep89NormalizeCmsTournament === "function") {
      const x = pnxStep89NormalizeCmsTournament(t, index);
      x.source = "cms";
      x.cmsSource = x.cmsSource || "step92-clean";
      x.tags = Array.isArray(x.tags) ? x.tags : ["CMS登録"];
      return x;
    }

    const id = text(t.id || t.tournamentId) || ("cms_step92_" + index);
    const title = text(t.title || t.name) || "CMS登録大会";
    const start = text(t.start || t.startDate || t.date);
    const end = text(t.end || t.endDate || t.start || t.startDate || t.date) || start;
    const venue = text(t.course || t.venue || t.place) || "会場未定";

    return Object.assign({}, t, {
      id,
      tournamentId:id,
      name:title,
      title,
      cat:text(t.cat || t.category) || "open",
      category:text(t.category || t.cat) || "オープン大会",
      gender:/女子|jlpga|lpga/i.test(text(t.gender || t.category)) ? "womens" : "mens",
      region:"domestic",
      area:text(t.area) || "kanto",
      prefecture:text(t.prefecture || t.pref) || "saitama",
      course:venue,
      venue,
      start,
      startDate:start,
      end,
      endDate:end,
      entryDeadline:text(t.entryDeadline || t.deadline),
      cancelDeadline:text(t.cancelDeadline || t.entryDeadline || t.deadline),
      prize:text(t.prize || t.totalPrize) || "—",
      prizeWinner:text(t.prizeWinner || t.winnerPrize) || "—",
      winnerPrize:text(t.winnerPrize || t.prizeWinner) || "—",
      entryFee:text(t.entryFee || t.fee) || "—",
      practiceRoundFee:text(t.practiceRoundFee) || "—",
      entryMethod:text(t.entryMethod || t.entryUrl || t.officialUrl) || "CMS登録情報を確認",
      qualification:text(t.qualification || t.eligibility) || "—",
      eligibility:text(t.eligibility || t.qualification) || "—",
      capacity:text(t.capacity) || "—",
      organizer:text(t.organizer) || "—",
      status:"open",
      emoji:"⛳",
      tags:["CMS登録"],
      source:"cms",
      cmsSource:"step92-clean"
    });
  }

  function mergeCms(){
    const raw = getSnapshot();
    const items = raw.map(normalize);

    if (typeof DUMMY_TOURNAMENTS === "undefined" || !Array.isArray(DUMMY_TOURNAMENTS)) {
      return { ok:false, items, reason:"DUMMY_TOURNAMENTS_missing" };
    }

    items.forEach(item => {
      const idx = DUMMY_TOURNAMENTS.findIndex(t => String(t.id || t.tournamentId) === String(item.id || item.tournamentId));
      if (idx >= 0) DUMMY_TOURNAMENTS[idx] = Object.assign({}, DUMMY_TOURNAMENTS[idx], item);
      else DUMMY_TOURNAMENTS.unshift(item);
    });

    return { ok:true, items };
  }

  function removeDebugUi(){
    [
      "pnx-step87-search-alert-btn",
      "pnx-step88-parent-cms-results",
      "pnx-step89-official-list-btn",
      "pnx-step90-force-list-btn",
      "pnx-step91-reload-force-btn",
      "pnx-step91-diag-btn"
    ].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });

    document.querySelectorAll(".pnx-step87-cms-section, #pnx-step87-cms-visible-section").forEach(el => el.remove());
  }

  function markCmsCards(){
    const cmsIds = new Set((typeof DUMMY_TOURNAMENTS !== "undefined" ? DUMMY_TOURNAMENTS : [])
      .filter(t => t && t.source === "cms")
      .map(t => String(t.id || t.tournamentId)));

    document.querySelectorAll(".s-tournament-card").forEach(card => {
      const id = String(card.dataset.id || "");
      if (!cmsIds.has(id)) return;

      card.classList.add("pnx-step92-cms-card", "pnx-cms-tournament");
      card.dataset.cmsTournament = "1";

      card.querySelectorAll(".pnx-step84-cardbar, .pnx-step84-cms-summary").forEach(el => el.remove());

      if (!card.querySelector(".pnx-step92-cms-badge")) {
        const badge = document.createElement("span");
        badge.className = "pnx-step92-cms-badge";
        badge.textContent = "CMS登録";
        card.appendChild(badge);
      }
    });
  }

  function render(showAlert){
    removeDebugUi();

    const merge = mergeCms();
    if (!merge.items.length) {
      if (showAlert) alert("STEP92\n\nCMS公開大会が0件です。CMSで募集中保存を確認してください。");
      return { ok:false, count:0, reason:"snapshot_empty" };
    }

    try {
      if (typeof APP_STATE !== "undefined") {
        APP_STATE.selectedCategory = "all";
        APP_STATE.selectedGender = "all";
        APP_STATE.selectedArea = "all";
        APP_STATE.searchQuery = "";
        if (APP_STATE.activeFilters && APP_STATE.activeFilters.clear) APP_STATE.activeFilters.clear();
        if (APP_STATE.detailFilters) {
          if (APP_STATE.detailFilters.areas && APP_STATE.detailFilters.areas.clear) APP_STATE.detailFilters.areas.clear();
          if (APP_STATE.detailFilters.categories && APP_STATE.detailFilters.categories.clear) APP_STATE.detailFilters.categories.clear();
          if (APP_STATE.detailFilters.statuses && APP_STATE.detailFilters.statuses.clear) APP_STATE.detailFilters.statuses.clear();
        }
      }
      const input = document.getElementById("search-input");
      if (input) input.value = "";
    } catch(e) {}

    try {
      if (typeof applyFiltersAndRender === "function") {
        applyFiltersAndRender();
      } else if (typeof renderTournamentList === "function" && typeof DUMMY_TOURNAMENTS !== "undefined") {
        renderTournamentList(DUMMY_TOURNAMENTS);
      }
    } catch(e) {
      const container = document.getElementById("tournament-list");
      if (container && typeof tournamentCardHTML === "function") {
        const cms = merge.items;
        const other = (typeof DUMMY_TOURNAMENTS !== "undefined" ? DUMMY_TOURNAMENTS : [])
          .filter(t => t && t.source !== "cms")
          .slice(0, 20);
        container.innerHTML = cms.concat(other).map(tournamentCardHTML).join("");
      }
    }

    setTimeout(function(){
      removeDebugUi();
      markCmsCards();
      try {
        const firstCms = document.querySelector(".s-tournament-card.pnx-step92-cms-card");
        if (firstCms && firstCms.scrollIntoView) firstCms.scrollIntoView({ block:"nearest", behavior:"smooth" });
      } catch(e) {}
    }, 180);

    const result = {
      ok:true,
      count:merge.items.length,
      titles:merge.items.map(t => t.name || t.title)
    };

    window.__PNX_STEP92_RENDER_RESULT__ = result;
    try { localStorage.setItem("PNX_STEP92_RENDER_RESULT", JSON.stringify(result)); } catch(e) {}

    if (showAlert) {
      setTimeout(function(){
        const visible = document.querySelectorAll(".s-tournament-card.pnx-step92-cms-card").length;
        alert(
          "STEP92 レイアウト整理\n\n" +
          "CMS公開大会: " + merge.items.length + "件\n" +
          "通常カード表示: " + visible + "件\n\n" +
          (visible > 0 ? "結果: 既存カード一覧に同じ見た目で表示しました。" : "結果: まだカードが見えていません。") +
          "\n\n大会:\n・" + result.titles.join("\n・")
        );
      }, 300);
    }

    return result;
  }

  window.PNXStep92RenderCleanCmsOfficialList = render;

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(removeDebugUi, 300);
    setTimeout(function(){ render(false); }, 700);
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_STEP92_SYNC_CMS_TOURNAMENTS" ||
      data.type === "PNX_CMS_TOURNAMENTS_UPDATED"
    ) {
      setTimeout(function(){ render(false); }, 160);
    }
  });
})();


/* ================================================================
   STEP93: Stable CMS card renderer
   連続再描画を止め、CMS大会を既存カードと同じHTMLで1回だけ安定描画
   ================================================================ */
(function(){
  if (window.__PNX_STEP93_STABLE_CMS_RENDERER__) return;
  window.__PNX_STEP93_STABLE_CMS_RENDERER__ = true;

  let renderTimer = null;
  let lastRenderAt = 0;
  let renderedSignature = "";

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch(e) {
      return fallback;
    }
  }

  function text(v){ return String(v == null ? "" : v).trim(); }

  function getSnapshot(){
    const snap = readJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", []);
    const hard = readJson("PNX_STEP85_HARD_SYNC_PAYLOAD", null);
    if (Array.isArray(snap) && snap.length) return snap;
    if (hard && Array.isArray(hard.tournaments) && hard.tournaments.length) return hard.tournaments;
    return [];
  }

  function normalize(t, index){
    let x = null;

    if (typeof pnxStep89NormalizeCmsTournament === "function") {
      x = pnxStep89NormalizeCmsTournament(t, index);
    } else {
      const id = text(t.id || t.tournamentId) || ("cms_step93_" + index);
      const title = text(t.title || t.name) || "CMS登録大会";
      const start = text(t.start || t.startDate || t.date);
      const end = text(t.end || t.endDate || t.start || t.startDate || t.date) || start;
      const venue = text(t.course || t.venue || t.place) || "会場未定";
      x = Object.assign({}, t, {
        id,
        tournamentId:id,
        name:title,
        title,
        cat:text(t.cat || t.category) || "open",
        category:text(t.category || t.cat) || "オープン大会",
        gender:/女子|jlpga|lpga/i.test(text(t.gender || t.category)) ? "womens" : "mens",
        region:"domestic",
        area:text(t.area) || "kanto",
        prefecture:text(t.prefecture || t.pref) || "saitama",
        course:venue,
        venue,
        start,
        startDate:start,
        end,
        endDate:end,
        entryDeadline:text(t.entryDeadline || t.deadline),
        cancelDeadline:text(t.cancelDeadline || t.entryDeadline || t.deadline),
        prize:text(t.prize || t.totalPrize) || "—",
        prizeWinner:text(t.prizeWinner || t.winnerPrize) || "—",
        winnerPrize:text(t.winnerPrize || t.prizeWinner) || "—",
        entryFee:text(t.entryFee || t.fee) || "—",
        practiceRoundFee:text(t.practiceRoundFee) || "—",
        entryMethod:text(t.entryMethod || t.entryUrl || t.officialUrl) || "CMS登録情報を確認",
        qualification:text(t.qualification || t.eligibility) || "—",
        eligibility:text(t.eligibility || t.qualification) || "—",
        capacity:text(t.capacity) || "—",
        organizer:text(t.organizer) || "—",
        status:"open",
        emoji:"⛳",
        tags:["CMS登録"]
      });
    }

    x.source = "cms";
    x.cmsSource = "step93-stable";
    x.tags = Array.isArray(x.tags) ? x.tags.filter(tag => !/同期済|CMS登録/.test(String(tag))) : [];
    return x;
  }

  function cleanupDebugUi(){
    [
      "pnx-step87-search-alert-btn",
      "pnx-step89-official-list-btn",
      "pnx-step90-force-list-btn",
      "pnx-step91-reload-force-btn",
      "pnx-step91-diag-btn"
    ].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });

    document.querySelectorAll([
      ".pnx-step87-cms-section",
      "#pnx-step87-cms-visible-section",
      "#pnx-step88-parent-cms-results"
    ].join(",")).forEach(el => el.remove());
  }

  function mergeCms(items){
    if (typeof DUMMY_TOURNAMENTS === "undefined" || !Array.isArray(DUMMY_TOURNAMENTS)) return;

    const ids = new Set(items.map(t => String(t.id || t.tournamentId)));

    // Remove old duplicate CMS entries first, then prepend clean entries.
    for (let i = DUMMY_TOURNAMENTS.length - 1; i >= 0; i--) {
      const t = DUMMY_TOURNAMENTS[i];
      if (t && t.source === "cms" && ids.has(String(t.id || t.tournamentId))) {
        DUMMY_TOURNAMENTS.splice(i, 1);
      }
    }

    DUMMY_TOURNAMENTS.unshift(...items);
  }

  function prepareState(){
    try {
      if (typeof APP_STATE === "undefined") return;
      APP_STATE.selectedCategory = "all";
      APP_STATE.selectedGender = "all";
      APP_STATE.selectedArea = "all";
      APP_STATE.searchQuery = "";
      APP_STATE.sortKey = APP_STATE.sortKey || "recommend";

      if (APP_STATE.activeFilters && APP_STATE.activeFilters.clear) APP_STATE.activeFilters.clear();

      if (APP_STATE.detailFilters) {
        if (APP_STATE.detailFilters.areas && APP_STATE.detailFilters.areas.clear) APP_STATE.detailFilters.areas.clear();
        if (APP_STATE.detailFilters.categories && APP_STATE.detailFilters.categories.clear) APP_STATE.detailFilters.categories.clear();
        if (APP_STATE.detailFilters.statuses && APP_STATE.detailFilters.statuses.clear) APP_STATE.detailFilters.statuses.clear();
        APP_STATE.detailFilters.gender = "";
        APP_STATE.detailFilters.timing = "";
        APP_STATE.detailFilters.prizeMin = "";
        APP_STATE.detailFilters.entryFeeMax = "";
      }
    } catch(e) {}

    const input = document.getElementById("search-input");
    if (input) input.value = "";
  }

  function cleanupCards(){
    document.querySelectorAll(".s-tournament-card").forEach(card => {
      card.querySelectorAll([
        ".pnx-step84-cardbar",
        ".pnx-step84-cms-summary",
        ".pnx-step92-cms-badge",
        ".pnx-step84-chip",
        ".pnx-step88-badge"
      ].join(",")).forEach(el => el.remove());

      card.classList.remove(
        "pnx-step84-cms-card",
        "pnx-step87-cms-card",
        "pnx-step89-official-card",
        "pnx-step90-force-card"
      );

      card.style.removeProperty("--pnx-cms-card-image");
    });
  }

  function markCmsCards(items){
    const ids = new Set(items.map(t => String(t.id || t.tournamentId)));

    document.querySelectorAll(".s-tournament-card").forEach(card => {
      const id = String(card.dataset.id || "");
      if (!ids.has(id)) return;

      card.classList.add("pnx-step93-cms-card");
      card.dataset.cmsTournament = "1";
    });
  }

  function render(showAlert){
    const now = Date.now();
    if (!showAlert && now - lastRenderAt < 900) {
      return window.__PNX_STEP93_LAST_RESULT__ || { ok:false, skipped:true };
    }
    lastRenderAt = now;

    cleanupDebugUi();

    const raw = getSnapshot();
    const items = raw.map(normalize);
    const signature = items.map(t => `${t.id}:${t.start}:${t.course}`).join("|");

    if (!items.length) {
      const result = { ok:false, count:0, reason:"snapshot_empty" };
      window.__PNX_STEP93_LAST_RESULT__ = result;
      if (showAlert) alert("STEP93\n\nCMS公開大会が0件です。CMSで募集中保存を確認してください。");
      return result;
    }

    if (!showAlert && signature === renderedSignature && document.querySelector(".s-tournament-card.pnx-step93-cms-card")) {
      cleanupDebugUi();
      return window.__PNX_STEP93_LAST_RESULT__ || { ok:true, cached:true };
    }

    renderedSignature = signature;
    mergeCms(items);
    prepareState();

    try {
      if (typeof applyFiltersAndRender === "function") {
        applyFiltersAndRender();
      } else if (typeof renderTournamentList === "function" && typeof DUMMY_TOURNAMENTS !== "undefined") {
        renderTournamentList(DUMMY_TOURNAMENTS);
      }
    } catch(e) {
      const container = document.getElementById("tournament-list");
      if (container && typeof tournamentCardHTML === "function") {
        const others = (typeof DUMMY_TOURNAMENTS !== "undefined" ? DUMMY_TOURNAMENTS : [])
          .filter(t => t && t.source !== "cms")
          .slice(0, 20);
        container.innerHTML = items.concat(others).map(tournamentCardHTML).join("");
      }
    }

    cleanupCards();
    markCmsCards(items);
    cleanupDebugUi();

    const visible = document.querySelectorAll(".s-tournament-card.pnx-step93-cms-card").length;
    const total = document.querySelectorAll(".s-tournament-card").length;

    const result = {
      ok: visible > 0,
      count: items.length,
      visible,
      total,
      titles: items.map(t => t.name || t.title)
    };

    window.__PNX_STEP93_LAST_RESULT__ = result;
    try { localStorage.setItem("PNX_STEP93_RENDER_RESULT", JSON.stringify(result)); } catch(e) {}

    if (showAlert) {
      alert(
        "STEP93 安定表示\n\n" +
        "CMS公開大会: " + items.length + "件\n" +
        "CMSカード表示: " + visible + "件\n" +
        "全カード表示: " + total + "件\n\n" +
        (visible > 0 ? "結果: 既存カードと同じレイアウトで表示しました。" : "結果: まだ表示できていません。")
      );
    }

    return result;
  }

  function scheduleRender(showAlert){
    clearTimeout(renderTimer);
    renderTimer = setTimeout(function(){ render(!!showAlert); }, 180);
  }

  window.PNXStep93StableRenderCmsCards = render;

  document.addEventListener("DOMContentLoaded", function(){
    cleanupDebugUi();
    scheduleRender(false);
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_STEP93_STABLE_CMS_SYNC" ||
      data.type === "PNX_STEP92_SYNC_CMS_TOURNAMENTS" ||
      data.type === "PNX_CMS_TOURNAMENTS_UPDATED"
    ) {
      scheduleRender(false);
    }
  });
})();


/* ================================================================
   STEP94: Console error follow-up / old CMS decoration killer
   古いCMS装飾を完全除去し、既存カードHTMLだけでCMS大会を表示
   ================================================================ */
(function(){
  if (window.__PNX_STEP94_OLD_CMS_DECORATION_KILLER__) return;
  window.__PNX_STEP94_OLD_CMS_DECORATION_KILLER__ = true;

  let lastSignature = "";
  let timer = null;

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch(e) {
      return fallback;
    }
  }

  function text(v){ return String(v == null ? "" : v).trim(); }

  function snapshot(){
    const snap = readJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", []);
    const hard = readJson("PNX_STEP85_HARD_SYNC_PAYLOAD", null);
    if (Array.isArray(snap) && snap.length) return snap;
    if (hard && Array.isArray(hard.tournaments) && hard.tournaments.length) return hard.tournaments;
    return [];
  }

  function normalize(t, index){
    let x;
    if (typeof pnxStep89NormalizeCmsTournament === "function") {
      x = pnxStep89NormalizeCmsTournament(t, index);
    } else {
      const id = text(t.id || t.tournamentId) || "cms_step94_" + index;
      const name = text(t.name || t.title) || "CMS登録大会";
      const start = text(t.start || t.startDate || t.date);
      const end = text(t.end || t.endDate || start) || start;
      const course = text(t.course || t.venue || t.place) || "会場未定";
      x = Object.assign({}, t, {
        id,
        tournamentId:id,
        name,
        title:name,
        cat:text(t.cat || t.category) || "open",
        category:text(t.category || t.cat) || "オープン大会",
        gender:/女子|jlpga|lpga/i.test(text(t.gender || t.category)) ? "womens" : "mens",
        region:"domestic",
        area:text(t.area) || "kanto",
        prefecture:text(t.prefecture || t.pref) || "saitama",
        course,
        venue:course,
        start,
        startDate:start,
        end,
        endDate:end,
        entryDeadline:text(t.entryDeadline || t.deadline),
        cancelDeadline:text(t.cancelDeadline || t.entryDeadline || t.deadline),
        prize:text(t.prize || t.totalPrize) || "—",
        prizeWinner:text(t.prizeWinner || t.winnerPrize) || "—",
        winnerPrize:text(t.winnerPrize || t.prizeWinner) || "—",
        entryFee:text(t.entryFee || t.fee) || "—",
        practiceRoundFee:"—",
        entryMethod:text(t.entryMethod || t.entryUrl || t.officialUrl) || "CMS登録情報を確認",
        qualification:text(t.qualification || t.eligibility) || "—",
        eligibility:text(t.eligibility || t.qualification) || "—",
        capacity:text(t.capacity) || "—",
        organizer:text(t.organizer) || "—",
        status:"open",
        emoji:"⛳"
      });
    }

    // Keep the exact data shape used by the existing card. Do not add visible CMS labels.
    x.source = "cms";
    x.cmsSource = "step94-clean";
    x.tags = [];
    return x;
  }

  function merge(items){
    if (typeof DUMMY_TOURNAMENTS === "undefined" || !Array.isArray(DUMMY_TOURNAMENTS)) return false;

    const ids = new Set(items.map(t => String(t.id || t.tournamentId)));

    // Remove all old duplicates of these CMS tournaments.
    for (let i = DUMMY_TOURNAMENTS.length - 1; i >= 0; i--) {
      const t = DUMMY_TOURNAMENTS[i];
      if (!t) continue;
      const id = String(t.id || t.tournamentId);
      if ((t.source === "cms" || ids.has(id)) && ids.has(id)) {
        DUMMY_TOURNAMENTS.splice(i, 1);
      }
    }

    DUMMY_TOURNAMENTS.unshift(...items);
    return true;
  }

  function removeOldUi(){
    const selectors = [
      "#pnx-step87-search-alert-btn",
      "#pnx-step89-official-list-btn",
      "#pnx-step90-force-list-btn",
      "#pnx-step91-reload-force-btn",
      "#pnx-step91-diag-btn",
      ".pnx-step87-cms-section",
      "#pnx-step87-cms-visible-section",
      "#pnx-step88-parent-cms-results",
      ".pnx-step84-cardbar",
      ".pnx-step84-cms-summary",
      ".pnx-step84-detail-panel",
      ".pnx-step92-cms-badge",
      ".pnx-cms-badge",
      ".pnx-cms-status-note"
    ];

    document.querySelectorAll(selectors.join(",")).forEach(el => el.remove());

    document.querySelectorAll(".s-tournament-card").forEach(card => {
      card.classList.remove(
        "pnx-step84-cms-card",
        "pnx-step89-official-card",
        "pnx-step90-force-card",
        "pnx-step92-cms-card",
        "pnx-step93-cms-card",
        "pnx-cms-tournament"
      );
      card.removeAttribute("data-cms-tournament");
      card.style.removeProperty("--pnx-cms-card-image");
    });
  }

  function prepareFilters(){
    try {
      if (typeof APP_STATE === "undefined") return;
      APP_STATE.selectedCategory = "all";
      APP_STATE.selectedGender = "all";
      APP_STATE.selectedArea = "all";
      APP_STATE.searchQuery = "";
      if (APP_STATE.activeFilters && APP_STATE.activeFilters.clear) APP_STATE.activeFilters.clear();
      if (APP_STATE.detailFilters) {
        if (APP_STATE.detailFilters.areas && APP_STATE.detailFilters.areas.clear) APP_STATE.detailFilters.areas.clear();
        if (APP_STATE.detailFilters.categories && APP_STATE.detailFilters.categories.clear) APP_STATE.detailFilters.categories.clear();
        if (APP_STATE.detailFilters.statuses && APP_STATE.detailFilters.statuses.clear) APP_STATE.detailFilters.statuses.clear();
        APP_STATE.detailFilters.gender = "";
        APP_STATE.detailFilters.timing = "";
      }
    } catch(e) {}
    const input = document.getElementById("search-input");
    if (input) input.value = "";
  }

  function render(showAlert){
    const items = snapshot().map(normalize);
    const sig = items.map(t => [t.id, t.start, t.course, t.name].join(":")).join("|");

    removeOldUi();

    if (!items.length) {
      if (showAlert) alert("STEP94\n\nCMS公開大会が0件です。");
      return { ok:false, count:0 };
    }

    if (!showAlert && sig === lastSignature && document.querySelector(".s-tournament-card[data-id='" + items[0].id + "']")) {
      removeOldUi();
      return window.__PNX_STEP94_LAST_RESULT__ || { ok:true, cached:true };
    }
    lastSignature = sig;

    merge(items);
    prepareFilters();

    try {
      if (typeof applyFiltersAndRender === "function") {
        applyFiltersAndRender();
      } else if (typeof renderTournamentList === "function") {
        renderTournamentList(DUMMY_TOURNAMENTS);
      }
    } catch(e) {
      const container = document.getElementById("tournament-list");
      if (container && typeof tournamentCardHTML === "function") {
        const others = (DUMMY_TOURNAMENTS || []).filter(t => t && t.source !== "cms").slice(0, 20);
        container.innerHTML = items.concat(others).map(tournamentCardHTML).join("");
      }
    }

    setTimeout(removeOldUi, 30);
    setTimeout(removeOldUi, 220);
    setTimeout(removeOldUi, 700);

    const result = {
      ok:true,
      count:items.length,
      visible:items.filter(t => document.querySelector(".s-tournament-card[data-id='" + t.id + "']")).length,
      titles:items.map(t => t.name)
    };

    window.__PNX_STEP94_LAST_RESULT__ = result;
    try { localStorage.setItem("PNX_STEP94_RENDER_RESULT", JSON.stringify(result)); } catch(e) {}

    if (showAlert) {
      setTimeout(() => {
        const visible = items.filter(t => document.querySelector(".s-tournament-card[data-id='" + t.id + "']")).length;
        alert(
          "STEP94 最終整理\n\n" +
          "CMS公開大会: " + items.length + "件\n" +
          "既存カード表示: " + visible + "件\n" +
          "古い装飾: 削除済み\n\n" +
          (visible > 0 ? "結果: 既存カードHTMLで表示しています。" : "結果: まだ表示できていません。")
        );
      }, 350);
    }

    return result;
  }

  function schedule(showAlert){
    clearTimeout(timer);
    timer = setTimeout(() => render(!!showAlert), 160);
  }

  window.PNXStep94RenderCleanCards = render;

  document.addEventListener("DOMContentLoaded", function(){
    removeOldUi();
    schedule(false);
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_STEP94_CLEAN_RENDER" ||
      data.type === "PNX_STEP93_STABLE_CMS_SYNC" ||
      data.type === "PNX_STEP92_SYNC_CMS_TOURNAMENTS" ||
      data.type === "PNX_CMS_TOURNAMENTS_UPDATED"
    ) {
      schedule(false);
    }
  });

  // Mutation cleanup only removes old decoration; it does not re-render the list.
  const mo = new MutationObserver(function(){
    clearTimeout(window.__PNX_STEP94_CLEAN_TIMER__);
    window.__PNX_STEP94_CLEAN_TIMER__ = setTimeout(removeOldUi, 80);
  });
  document.addEventListener("DOMContentLoaded", function(){
    try { mo.observe(document.body, { childList:true, subtree:true }); } catch(e) {}
  });
})();



/* ================================================================
   STEP96: Search iframe version marker
   ================================================================ */
(function(){
  window.__PNX_SEARCH_SCRIPT_VERSION__ = "step96";
})();


/* ================================================================
   STEP97: Search iframe version marker
   ================================================================ */
(function(){
  window.__PNX_SEARCH_SCRIPT_VERSION__ = "step97";
})();





/* ================================================================
   STEP99: Stable search card renderer
   CMS大会を既存カード一覧へ1回だけ合流し、カード一覧のパチパチを止める
   ================================================================ */
(function(){
  if (window.__PNX_STEP99_STABLE_SEARCH_RENDERER__) return;
  window.__PNX_STEP99_STABLE_SEARCH_RENDERER__ = true;

  let lastSignature = "";
  let lastRenderAt = 0;
  let lock = false;

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch(e) {
      return fallback;
    }
  }

  function text(v){ return String(v == null ? "" : v).trim(); }

  function getSnapshot(){
    const snap = readJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", []);
    const hard = readJson("PNX_STEP85_HARD_SYNC_PAYLOAD", null);
    if (Array.isArray(snap) && snap.length) return snap;
    if (hard && Array.isArray(hard.tournaments) && hard.tournaments.length) return hard.tournaments;
    return [];
  }

  function normalize(t, index){
    const id = text(t.id || t.tournamentId) || ("cms_step99_" + index);
    const name = text(t.name || t.title || t.tournamentTitle) || "CMS登録大会";
    const start = text(t.start || t.startDate || t.date);
    const end = text(t.end || t.endDate || t.start || t.startDate || t.date) || start;
    const course = text(t.course || t.venue || t.place) || "会場未定";
    const rawCat = text(t.cat || t.category);
    let cat = "open";
    if (/jgto|男子ツアー/.test(rawCat.toLowerCase())) cat = "jgto";
    else if (/jlpga|lpga|女子/.test(rawCat.toLowerCase())) cat = "lpga";
    else if (/qt/.test(rawCat.toLowerCase())) cat = "qt";
    else if (/mini|ミニ/.test(rawCat.toLowerCase())) cat = "mini";
    else if (/海外|pga|asian|korn|dp world|liv/i.test(rawCat)) cat = "abroad";
    else if (/学生/.test(rawCat)) cat = "student";

    return Object.assign({}, t, {
      id,
      tournamentId:id,
      name,
      title:name,
      cat,
      category: rawCat || "オープン大会",
      gender:/女子|jlpga|lpga/i.test(text(t.gender || t.category)) ? "womens" : "mens",
      region:cat === "abroad" ? "overseas" : "domestic",
      area:text(t.area) || "kanto",
      prefecture:text(t.prefecture || t.pref) || "saitama",
      course,
      venue:course,
      start,
      startDate:start,
      end,
      endDate:end,
      entryDeadline:text(t.entryDeadline || t.deadline),
      cancelDeadline:text(t.cancelDeadline || t.entryDeadline || t.deadline),
      prize:text(t.prize || t.totalPrize) || "—",
      prizeWinner:text(t.prizeWinner || t.winnerPrize) || "—",
      winnerPrize:text(t.winnerPrize || t.prizeWinner) || "—",
      entryFee:text(t.entryFee || t.fee) || "—",
      practiceRoundFee:"—",
      entryMethod:text(t.entryMethod || t.entryUrl || t.officialUrl) || "CMS登録情報を確認",
      qualification:text(t.qualification || t.eligibility) || "—",
      eligibility:text(t.eligibility || t.qualification) || "—",
      capacity:text(t.capacity) || "—",
      organizer:text(t.organizer) || "—",
      status:"open",
      emoji:"⛳",
      tags:[],
      source:"cms",
      cmsSource:"step99-stable"
    });
  }

  function cleanupOldUi(){
    document.querySelectorAll([
      "#pnx-step87-search-alert-btn",
      "#pnx-step89-official-list-btn",
      "#pnx-step90-force-list-btn",
      "#pnx-step91-reload-force-btn",
      "#pnx-step91-diag-btn",
      ".pnx-step87-cms-section",
      "#pnx-step87-cms-visible-section",
      "#pnx-step88-parent-cms-results",
      ".pnx-step84-cardbar",
      ".pnx-step84-cms-summary",
      ".pnx-step84-detail-panel",
      ".pnx-step92-cms-badge",
      ".pnx-cms-badge",
      ".pnx-cms-status-note"
    ].join(",")).forEach(el => el.remove());

    document.querySelectorAll(".s-tournament-card").forEach(card => {
      card.classList.remove(
        "pnx-step84-cms-card",
        "pnx-step89-official-card",
        "pnx-step90-force-card",
        "pnx-step92-cms-card",
        "pnx-step93-cms-card",
        "pnx-cms-tournament"
      );
      card.removeAttribute("data-cms-tournament");
      card.style.removeProperty("--pnx-cms-card-image");
    });
  }

  function merge(items){
    if (typeof DUMMY_TOURNAMENTS === "undefined" || !Array.isArray(DUMMY_TOURNAMENTS)) return false;
    const ids = new Set(items.map(t => String(t.id || t.tournamentId)));

    for (let i = DUMMY_TOURNAMENTS.length - 1; i >= 0; i--) {
      const t = DUMMY_TOURNAMENTS[i];
      if (!t) continue;
      const id = String(t.id || t.tournamentId);
      if (ids.has(id) || (t.source === "cms" && ids.has(id))) {
        DUMMY_TOURNAMENTS.splice(i, 1);
      }
    }

    DUMMY_TOURNAMENTS.unshift(...items);
    return true;
  }

  function prepareFilters(){
    try {
      if (typeof APP_STATE === "undefined") return;
      APP_STATE.selectedCategory = "all";
      APP_STATE.selectedGender = "all";
      APP_STATE.selectedArea = "all";
      APP_STATE.searchQuery = "";
      if (APP_STATE.activeFilters && APP_STATE.activeFilters.clear) APP_STATE.activeFilters.clear();
      if (APP_STATE.detailFilters) {
        if (APP_STATE.detailFilters.areas && APP_STATE.detailFilters.areas.clear) APP_STATE.detailFilters.areas.clear();
        if (APP_STATE.detailFilters.categories && APP_STATE.detailFilters.categories.clear) APP_STATE.detailFilters.categories.clear();
        if (APP_STATE.detailFilters.statuses && APP_STATE.detailFilters.statuses.clear) APP_STATE.detailFilters.statuses.clear();
        APP_STATE.detailFilters.gender = "";
        APP_STATE.detailFilters.timing = "";
      }
    } catch(e) {}
    const input = document.getElementById("search-input");
    if (input) input.value = "";
  }

  function existsInDom(items){
    return items.some(t => {
      try { return !!document.querySelector(".s-tournament-card[data-id='" + CSS.escape(String(t.id || t.tournamentId)) + "']"); }
      catch(e) { return false; }
    });
  }

  function render(showAlert){
    if (lock) return window.__PNX_STEP99_LAST_RESULT__ || { ok:false, locked:true };

    const now = Date.now();
    if (!showAlert && now - lastRenderAt < 4500) {
      cleanupOldUi();
      return window.__PNX_STEP99_LAST_RESULT__ || { ok:true, skipped:true };
    }

    const items = getSnapshot().map(normalize);
    const signature = items.map(t => [t.id, t.name, t.start, t.course, t.entryDeadline].join(":")).join("|");

    if (!items.length) {
      const result = { ok:false, count:0, reason:"snapshot_empty" };
      window.__PNX_STEP99_LAST_RESULT__ = result;
      return result;
    }

    if (!showAlert && signature === lastSignature && existsInDom(items)) {
      cleanupOldUi();
      return window.__PNX_STEP99_LAST_RESULT__ || { ok:true, cached:true };
    }

    lock = true;
    lastRenderAt = now;
    lastSignature = signature;

    cleanupOldUi();
    merge(items);
    prepareFilters();

    try {
      if (typeof applyFiltersAndRender === "function") applyFiltersAndRender();
      else if (typeof renderTournamentList === "function") renderTournamentList(DUMMY_TOURNAMENTS);
    } catch(e) {
      const container = document.getElementById("tournament-list");
      if (container && typeof tournamentCardHTML === "function") {
        const others = (DUMMY_TOURNAMENTS || []).filter(t => t && t.source !== "cms").slice(0, 20);
        container.innerHTML = items.concat(others).map(tournamentCardHTML).join("");
      }
    }

    setTimeout(cleanupOldUi, 80);

    const visible = items.filter(t => {
      try { return !!document.querySelector(".s-tournament-card[data-id='" + CSS.escape(String(t.id || t.tournamentId)) + "']"); }
      catch(e) { return false; }
    }).length;

    const result = {
      ok: visible > 0,
      count: items.length,
      visible,
      total: document.querySelectorAll(".s-tournament-card").length,
      signature
    };

    window.__PNX_STEP99_LAST_RESULT__ = result;
    try { localStorage.setItem("PNX_STEP99_RENDER_RESULT", JSON.stringify(result)); } catch(e) {}

    setTimeout(function(){ lock = false; }, 1200);

    if (showAlert) {
      setTimeout(function(){
        alert(
          "STEP99 安定描画\n\n" +
          "CMS公開大会: " + items.length + "件\n" +
          "表示: " + visible + "件\n" +
          "連続再描画: 抑制中"
        );
      }, 300);
    }

    return result;
  }

  function schedule(showAlert){
    clearTimeout(window.__PNX_STEP99_TIMER__);
    window.__PNX_STEP99_TIMER__ = setTimeout(() => render(!!showAlert), 320);
  }

  window.PNXStep99StableCardsOnce = render;

  document.addEventListener("DOMContentLoaded", function(){
    cleanupOldUi();
    schedule(false);
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type === "PNX_STEP99_STABLE_SEARCH_SYNC") {
      schedule(false);
    }
  });
})();


/* ================================================================
   STEP100: Stable message handler
   既にDOMにCMSカードがある場合は再描画せずcleanupだけ行う
   ================================================================ */
(function(){
  if (window.__PNX_STEP100_STABLE_MESSAGE_HANDLER__) return;
  window.__PNX_STEP100_STABLE_MESSAGE_HANDLER__ = true;

  let lastRunAt = 0;

  function hasCmsCards(){
    const result = window.__PNX_STEP100_PREMERGE_RESULT__;
    if (!result || !Array.isArray(result.ids)) return false;
    return result.ids.some(id => {
      try { return !!document.querySelector(".s-tournament-card[data-id='" + CSS.escape(String(id)) + "']"); }
      catch(e) { return false; }
    });
  }

  function stable(showAlert){
    const now = Date.now();
    if (!showAlert && now - lastRunAt < 5000) {
      if (typeof PNXStep100CleanupOldCmsUi === "function") PNXStep100CleanupOldCmsUi();
      return window.__PNX_STEP100_LAST_RESULT__ || { ok:true, skipped:true };
    }
    lastRunAt = now;

    if (typeof PNXStep100PreMergeCms === "function") {
      PNXStep100PreMergeCms();
    }

    if (hasCmsCards()) {
      if (typeof PNXStep100CleanupOldCmsUi === "function") PNXStep100CleanupOldCmsUi();
      const cached = { ok:true, cached:true, reason:"cms_cards_already_visible" };
      window.__PNX_STEP100_LAST_RESULT__ = cached;
      return cached;
    }

    try {
      if (typeof applyFiltersAndRender === "function") applyFiltersAndRender();
      else if (typeof renderTournamentList === "function" && typeof DUMMY_TOURNAMENTS !== "undefined") renderTournamentList(DUMMY_TOURNAMENTS);
    } catch(e) {
      console.warn("[STEP100] stable render skipped:", e);
    }

    setTimeout(function(){
      if (typeof PNXStep100CleanupOldCmsUi === "function") PNXStep100CleanupOldCmsUi();
    }, 80);

    const result = {
      ok:true,
      visible:hasCmsCards()
    };

    window.__PNX_STEP100_LAST_RESULT__ = result;

    if (showAlert) {
      alert("STEP100 安定描画\\n\\nCMSカード表示: " + (result.visible ? "あり" : "未確認") + "\\n再描画: 必要時のみ");
    }

    return result;
  }

  window.PNXStep100StableCardsOnce = stable;

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(function(){
      if (typeof PNXStep100CleanupOldCmsUi === "function") PNXStep100CleanupOldCmsUi();
    }, 120);
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_STEP100_STABLE_SEARCH_SYNC" ||
      data.type === "PNX_STEP99_STABLE_SEARCH_SYNC"
    ) {
      stable(false);
    }
  });
})();

/* ================================================================
   STEP101: Stable message handler
   親からの同期通知では、必要な時だけ描画する
   ================================================================ */
(function(){
  if (window.__PNX_STEP101_STABLE_HANDLER__) return;
  window.__PNX_STEP101_STABLE_HANDLER__ = true;

  let lastRunAt = 0;

  function cleanup(){
    try { if (typeof PNXStep100CleanupOldCmsUi === "function") PNXStep100CleanupOldCmsUi(); } catch(e) {}
  }

  function getPremergeResult(){
    try {
      if (window.__PNX_STEP100_PREMERGE_RESULT__) return window.__PNX_STEP100_PREMERGE_RESULT__;
      return JSON.parse(localStorage.getItem("PNX_STEP100_PREMERGE_RESULT") || "null");
    } catch(e) {
      return null;
    }
  }

  function hasCmsCards(){
    const result = getPremergeResult();
    if (!result || !Array.isArray(result.ids) || !result.ids.length) return false;

    return result.ids.some(id => {
      try {
        return !!document.querySelector(".s-tournament-card[data-id='" + CSS.escape(String(id)) + "']");
      } catch(e) {
        return false;
      }
    });
  }

  function stable(showAlert){
    const now = Date.now();

    if (!showAlert && now - lastRunAt < 6000) {
      cleanup();
      return window.__PNX_STEP101_LAST_RESULT__ || { ok:true, skipped:true };
    }

    lastRunAt = now;

    try {
      if (!hasCmsCards()) {
        if (typeof PNXStep100PreMergeCms === "function") PNXStep100PreMergeCms();

        if (typeof applyFiltersAndRender === "function") {
          applyFiltersAndRender();
        } else if (typeof renderTournamentList === "function" && typeof DUMMY_TOURNAMENTS !== "undefined") {
          renderTournamentList(DUMMY_TOURNAMENTS);
        }
      }
    } catch(e) {
      console.warn("[STEP101] stable render skipped:", e);
    }

    setTimeout(cleanup, 80);

    const result = {
      ok:true,
      visible:hasCmsCards(),
      version:"step101"
    };

    window.__PNX_STEP101_LAST_RESULT__ = result;

    if (showAlert) {
      alert("STEP101 安定化\n\nCMSカード表示: " + (result.visible ? "あり" : "未確認") + "\n多重描画: 抑制中");
    }

    return result;
  }

  window.PNXStep101StableCardsOnce = stable;

  document.addEventListener("DOMContentLoaded", function(){
    try {
      window.parent && window.parent.postMessage({ type:"PNX_SEARCH_IFRAME_READY_STEP101" }, "*");
    } catch(e) {}
    cleanup();
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_STEP101_STABLE_SEARCH_SYNC" ||
      data.type === "PNX_STEP100_STABLE_SEARCH_SYNC"
    ) {
      stable(false);
    }
  });

  window.__PNX_SEARCH_SCRIPT_VERSION__ = "step101";
})();

/* ================================================================
   STEP103: stable search sync handler
   同じデータなら再描画せず、cleanupだけ実行
   ================================================================ */
(function(){
  if (window.__PNX_STEP103_STABLE_HANDLER__) return;
  window.__PNX_STEP103_STABLE_HANDLER__ = true;

  let lastRunAt = 0;

  function cleanup(){
    try { if (typeof PNXStep100CleanupOldCmsUi === "function") PNXStep100CleanupOldCmsUi(); } catch(e) {}
  }

  function hasCmsCards(){
    try {
      const result = window.__PNX_STEP100_PREMERGE_RESULT__ || JSON.parse(localStorage.getItem("PNX_STEP100_PREMERGE_RESULT") || "null");
      if (!result || !Array.isArray(result.ids)) return false;
      return result.ids.some(id => !!document.querySelector(".s-tournament-card[data-id='" + CSS.escape(String(id)) + "']"));
    } catch(e) {
      return false;
    }
  }

  function stable(showAlert){
    const now = Date.now();

    if (!showAlert && now - lastRunAt < 8000) {
      cleanup();
      return window.__PNX_STEP103_LAST_RESULT__ || { ok:true, skipped:true };
    }

    lastRunAt = now;

    try {
      if (!hasCmsCards()) {
        if (typeof PNXStep100PreMergeCms === "function") PNXStep100PreMergeCms();
        if (typeof applyFiltersAndRender === "function") applyFiltersAndRender();
      }
    } catch(e) {
      console.warn("[STEP103] stable sync skipped:", e);
    }

    setTimeout(cleanup, 80);

    const result = { ok:true, visible:hasCmsCards(), version:"step103" };
    window.__PNX_STEP103_LAST_RESULT__ = result;

    if (showAlert) {
      alert("STEP103 安定化\n\n状態復元ログ: 抑制中\nCMSカード表示: " + (result.visible ? "あり" : "未確認"));
    }

    return result;
  }

  window.PNXStep103StableCardsOnce = stable;

  document.addEventListener("DOMContentLoaded", function(){
    try { window.parent && window.parent.postMessage({ type:"PNX_SEARCH_IFRAME_READY_STEP103" }, "*"); } catch(e) {}
    cleanup();
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_STEP103_STABLE_SEARCH_SYNC" ||
      data.type === "PNX_STEP101_STABLE_SEARCH_SYNC" ||
      data.type === "PNX_STEP100_STABLE_SEARCH_SYNC"
    ) {
      stable(false);
    }
  });

  window.__PNX_SEARCH_SCRIPT_VERSION__ = "step103";
})();


/* ================================================================
   STEP106: Stable search handler
   CMS大会は初回前合流を維持し、同じDOMなら再描画しない
   ================================================================ */
(function(){
  if (window.__PNX_STEP106_STABLE_HANDLER__) return;
  window.__PNX_STEP106_STABLE_HANDLER__ = true;

  let lastRunAt = 0;

  function cleanup(){
    try { if (typeof PNXStep100CleanupOldCmsUi === "function") PNXStep100CleanupOldCmsUi(); } catch(e) {}
  }

  function premerge(){
    try { if (typeof PNXStep100PreMergeCms === "function") return PNXStep100PreMergeCms(); } catch(e) {}
    return null;
  }

  function getResult(){
    try {
      return window.__PNX_STEP100_PREMERGE_RESULT__ || JSON.parse(localStorage.getItem("PNX_STEP100_PREMERGE_RESULT") || "null");
    } catch(e) {
      return null;
    }
  }

  function hasCmsCards(){
    const result = getResult();
    if (!result || !Array.isArray(result.ids) || !result.ids.length) return false;

    return result.ids.some(id => {
      try {
        return !!document.querySelector(".s-tournament-card[data-id='" + CSS.escape(String(id)) + "']");
      } catch(e) {
        return false;
      }
    });
  }

  function stable(showAlert){
    const now = Date.now();

    if (!showAlert && now - lastRunAt < 9000) {
      cleanup();
      return window.__PNX_STEP106_LAST_RESULT__ || { ok:true, skipped:true, version:"step106" };
    }

    lastRunAt = now;

    if (!hasCmsCards()) {
      premerge();
      try {
        if (!hasCmsCards()) {
          if (typeof applyFiltersAndRender === "function") applyFiltersAndRender();
          else if (typeof renderTournamentList === "function" && typeof DUMMY_TOURNAMENTS !== "undefined") renderTournamentList(DUMMY_TOURNAMENTS);
        }
      } catch(e) {
        console.warn("[STEP106] stable render skipped:", e);
      }
    }

    setTimeout(cleanup, 80);

    const result = {
      ok:true,
      visible:hasCmsCards(),
      version:"step106"
    };

    window.__PNX_STEP106_LAST_RESULT__ = result;

    if (showAlert) {
      alert("STEP106 安定ベース\n\nCMSカード表示: " + (result.visible ? "あり" : "未確認") + "\n再描画: 抑制中");
    }

    return result;
  }

  window.PNXStep106StableCardsOnce = stable;

  document.addEventListener("DOMContentLoaded", function(){
    try { window.parent && window.parent.postMessage({ type:"PNX_SEARCH_IFRAME_READY_STEP106" }, "*"); } catch(e) {}
    cleanup();
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_STEP106_STABLE_SEARCH_SYNC" ||
      data.type === "PNX_STEP103_STABLE_SEARCH_SYNC" ||
      data.type === "PNX_STEP101_STABLE_SEARCH_SYNC" ||
      data.type === "PNX_STEP100_STABLE_SEARCH_SYNC"
    ) {
      stable(false);
    }
  });

  window.__PNX_SEARCH_SCRIPT_VERSION__ = "step106";
})();




/* ================================================================
   STEP112: Search single router bridge
   検索側からはSTEP112メッセージだけ送る。旧メッセージは送らない。
   ================================================================ */
(function(){
  if (window.__PNX_STEP112_SEARCH_SINGLE_ROUTER_BRIDGE__) return;
  window.__PNX_STEP112_SEARCH_SINGLE_ROUTER_BRIDGE__ = true;

  const pending = new Map();

  function text(v){ return String(v == null ? "" : v).trim(); }

  function findTournament(id){
    try {
      return Array.isArray(DUMMY_TOURNAMENTS)
        ? DUMMY_TOURNAMENTS.find(t => t && String(t.id || t.tournamentId) === String(id))
        : null;
    } catch(e) {
      return null;
    }
  }

  function payload(t){
    t = t || {};
    const id = text(t.id || t.tournamentId) || ("cms_" + Date.now());
    const name = text(t.name || t.title || t.tournamentTitle) || "大会予定";
    const start = text(t.start || t.startDate || t.date);
    const end = text(t.end || t.endDate || t.start || t.startDate || t.date) || start;
    const venue = text(t.course || t.venue || t.place || t.location);

    return Object.assign({}, t, {
      id,
      tournamentId:id,
      name,
      title:name,
      date:start,
      start,
      startDate:start,
      end,
      endDate:end,
      place:venue,
      venue,
      course:venue,
      cat:text(t.cat || t.category) || "tournament",
      category:text(t.category || t.cat) || "tournament",
      entryDeadline:text(t.entryDeadline || t.deadline),
      entryFee:text(t.entryFee || t.fee),
      prize:text(t.prize || t.totalPrize),
      source:t.source || "search-cms",
      rawCategory:t.category || t.cat || "",
      displayCategory:t.category || t.cat || "",
      originalTitle:t.title || t.name || "",
      tournamentTitle:t.title || t.name || ""
    });
  }

  function setLocalAdded(id, added){
    const t = findTournament(id);
    if (t) t.addedToCalendar = !!added;

    try {
      if (typeof setAdded === "function" && added) setAdded(id);
      else if (APP_STATE && APP_STATE.addedToCalendar) {
        if (added) APP_STATE.addedToCalendar.add(id);
        else APP_STATE.addedToCalendar.delete(id);
      }
    } catch(e) {}

    const addedInnerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.8"
           stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg> 追加済み
    `;

    try {
      const cardBtn = document.querySelector(`.tc-btn-add[data-id="${CSS.escape(String(id))}"]`);
      if (cardBtn) {
        cardBtn.classList.add("added");
        cardBtn.innerHTML = addedInnerHTML;
      }

      const bsBtn = document.getElementById("bs-cta-add");
      if (bsBtn && APP_STATE && String(APP_STATE.selectedTournamentId) === String(id)) {
        bsBtn.classList.add("added");
        bsBtn.innerHTML = addedInnerHTML;
      }

      if (typeof _syncBSAddBtn === "function" && t) _syncBSAddBtn(t);
      if (typeof saveAppState === "function") saveAppState();
    } catch(e) {}
  }

  function sendToRoot(t, id){
    const requestId = "step112_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    pending.set(requestId, id);

    try {
      window.parent && window.parent.postMessage({
        type:"PNX_SEARCH_ADD_TOURNAMENT_TO_CALENDAR_STEP112",
        requestId,
        payload:payload(t)
      }, "*");
      return true;
    } catch(e) {
      pending.delete(requestId);
      return false;
    }
  }

  window.handleCalendarAdd = function(id){
    const t = findTournament(id);
    if (!t) return;
    if (typeof isAdded === "function" && isAdded(id)) return;

    setLocalAdded(id, true);
    sendToRoot(t, id);

    try {
      if (typeof showToast === "function") showToast(`「${t.name || t.title || "大会"}」をカレンダーに追加しました`);
    } catch(e) {}
  };

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type !== "PNX_SEARCH_CALENDAR_ADD_RESULT_STEP112") return;

    const requestId = data.requestId;
    const id = pending.get(requestId);
    if (requestId) pending.delete(requestId);

    const result = data.payload || {};
    if (!result.ok) {
      console.warn("[STEP112] calendar add failed:", result.error || result);
      return;
    }

    if (id) setLocalAdded(id, true);
  });

  document.addEventListener("DOMContentLoaded", function(){
    try {
      window.parent && window.parent.postMessage({ type:"PNX_SEARCH_IFRAME_READY_STEP112" }, "*");
    } catch(e) {}
  });

  window.PNXStep112HandleCalendarAdd = window.handleCalendarAdd;
  window.__PNX_SEARCH_SCRIPT_VERSION__ = "step112";
})();


/* ================================================================
   STEP113: CMS card visual polish + detail bottom sheet
   単一ルーターは触らず、CMSカードの見た目と詳細表示だけ整理
   ================================================================ */
(function(){
  if (window.__PNX_STEP113_CMS_CARD_DETAIL_POLISH__) return;
  window.__PNX_STEP113_CMS_CARD_DETAIL_POLISH__ = true;

  function text(v){
    return String(v == null ? "" : v).trim();
  }

  function esc(v){
    return text(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function firstUrl(t){
    const candidates = [
      t && t.entryUrl,
      t && t.officialUrl,
      t && t.url,
      t && t.link,
      t && t.instagram,
      t && t.entryMethod
    ].map(text).filter(Boolean);

    return candidates.find(v => /^https?:\/\//i.test(v)) || "";
  }

  function polishCmsCards(){
    try {
      document.querySelectorAll(".s-tournament-card").forEach(card => {
        const id = card.dataset.id;
        const t = Array.isArray(DUMMY_TOURNAMENTS)
          ? DUMMY_TOURNAMENTS.find(x => String(x.id || x.tournamentId) === String(id))
          : null;

        if (!t || t.source !== "cms") return;

        card.dataset.cmsTournament = "1";

        // 旧STEPの青枠・CMSバッジ・画像背景用クラスを外す。
        card.classList.remove(
          "pnx-step84-cms-card",
          "pnx-step89-official-card",
          "pnx-step90-force-card",
          "pnx-step92-cms-card",
          "pnx-step93-cms-card",
          "pnx-cms-tournament",
          "pnx-has-cms-image"
        );

        card.removeAttribute("style");
      });
    } catch(e) {}
  }

  if (typeof renderTournamentList === "function" && !renderTournamentList.__pnxStep113Wrapped) {
    const originalRenderTournamentList = renderTournamentList;

    renderTournamentList = function(tournaments){
      const result = originalRenderTournamentList.apply(this, arguments);
      setTimeout(polishCmsCards, 0);
      return result;
    };

    renderTournamentList.__pnxStep113Wrapped = true;
    window.renderTournamentList = renderTournamentList;
  }

  function addCmsInfoToBottomSheet(t){
    const bsBody = document.getElementById("bs-body");
    if (!bsBody || !t) return;

    const old = bsBody.querySelector(".pnx-step113-cms-detail-card");
    if (old) old.remove();

    const isCms = t.source === "cms" || t.cmsSource || t._pnxStep89Official;
    if (!isCms) return;

    const url = firstUrl(t);
    const organizer = text(t.organizer);
    const entryMethod = text(t.entryMethod);
    const eligibility = text(t.eligibility || t.qualification);
    const capacity = text(t.capacity);
    const deadline = text(t.entryDeadline || t.deadline);
    const entryFee = text(t.entryFee || t.fee);

    const hasAny = organizer || entryMethod || eligibility || capacity || deadline || entryFee || url;
    if (!hasAny) return;

    const card = document.createElement("div");
    card.className = "bs-info-card pnx-step113-cms-detail-card";
    card.innerHTML = `
      <p class="bs-info-card-title">大会情報</p>

      ${organizer ? `
        <div class="bs-card-item">
          <p class="bs-card-label">主催</p>
          <p class="bs-card-value sm">${esc(organizer)}</p>
        </div>
      ` : ""}

      ${deadline || entryFee ? `
        <div class="bs-card-item border-top">
          <p class="bs-card-label">申込情報</p>
          <p class="bs-card-value sm">
            ${deadline ? `締切：${esc(deadline)}` : ""}
            ${deadline && entryFee ? "<br>" : ""}
            ${entryFee ? `参加費：${esc(entryFee)}` : ""}
          </p>
        </div>
      ` : ""}

      ${capacity ? `
        <div class="bs-card-item border-top">
          <p class="bs-card-label">募集人数</p>
          <p class="bs-card-value sm">${esc(capacity)}</p>
        </div>
      ` : ""}

      ${eligibility ? `
        <div class="bs-card-item border-top">
          <p class="bs-card-label">出場条件</p>
          <p class="bs-card-value sm">${esc(eligibility)}</p>
        </div>
      ` : ""}

      ${entryMethod ? `
        <div class="bs-card-item border-top">
          <p class="bs-card-label">申込・確認方法</p>
          <p class="bs-card-value sm">${esc(entryMethod)}</p>
        </div>
      ` : ""}

      ${url ? `
        <div class="bs-card-item border-top">
          <p class="bs-card-label">リンク</p>
          <p class="bs-card-value sm">
            <a class="pnx-step113-detail-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">
              公式・申込ページを開く
            </a>
          </p>
        </div>
      ` : ""}
    `;

    const scroll = bsBody.querySelector(".bs-scroll-content");
    if (scroll) {
      const spacer = scroll.querySelector('div[style*="height:6px"]');
      if (spacer) scroll.insertBefore(card, spacer);
      else scroll.appendChild(card);
    } else {
      bsBody.appendChild(card);
    }
  }

  if (typeof renderBottomSheetContent === "function" && !renderBottomSheetContent.__pnxStep113Wrapped) {
    const originalRenderBottomSheetContent = renderBottomSheetContent;

    renderBottomSheetContent = function(t){
      const result = originalRenderBottomSheetContent.apply(this, arguments);
      try { addCmsInfoToBottomSheet(t); } catch(e) {}
      return result;
    };

    renderBottomSheetContent.__pnxStep113Wrapped = true;
    window.renderBottomSheetContent = renderBottomSheetContent;
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(polishCmsCards, 300);

    const detailBtn = document.getElementById("bs-cta-detail");
    if (detailBtn && !detailBtn.__pnxStep113Bound) {
      detailBtn.__pnxStep113Bound = true;

      detailBtn.addEventListener("click", function(e){
        let t = null;

        try {
          const id = APP_STATE && APP_STATE.selectedTournamentId;
          t = Array.isArray(DUMMY_TOURNAMENTS)
            ? DUMMY_TOURNAMENTS.find(x => String(x.id || x.tournamentId) === String(id))
            : null;
        } catch(err) {}

        const url = t ? firstUrl(t) : "";
        if (!url) return;

        e.preventDefault();
        e.stopImmediatePropagation();
        window.open(url, "_blank", "noopener,noreferrer");
      }, true);
    }
  });

  window.PNXStep113PolishCmsCards = polishCmsCards;
  window.__PNX_SEARCH_SCRIPT_VERSION__ = "step113";
})();


/* ================================================================
   STEP116: Search ready marker for pure router
   ================================================================ */
(function(){
  if (window.__PNX_STEP116_SEARCH_READY_MARKER__) return;
  window.__PNX_STEP116_SEARCH_READY_MARKER__ = true;

  document.addEventListener("DOMContentLoaded", function(){
    try { window.parent && window.parent.postMessage({ type:"PNX_SEARCH_IFRAME_READY_STEP116" }, "*"); } catch(e) {}
  });

  window.__PNX_SEARCH_SCRIPT_VERSION__ = "step116";
})();















/* ================================================================
   STEP133: Calendar add/cancel toggle UI helper
   同じ大会をもう一度押した時に「追加済み」→「カレンダーに追加」へ戻す。
   ================================================================ */
(function(){
  if (window.__PNX_STEP133_SEARCH_TOGGLE_UI__) return;
  window.__PNX_STEP133_SEARCH_TOGGLE_UI__ = true;

  function text(v){ return String(v == null ? "" : v).trim(); }

  function updateCalendarButtons(action){
    const added = action !== "removed";

    const selectors = [
      "[data-calendar-add]",
      "[data-action='calendar']",
      ".calendar-add-btn",
      ".add-calendar-btn",
      ".tournament-calendar-btn",
      "button"
    ];

    const buttons = Array.from(document.querySelectorAll(selectors.join(",")))
      .filter(btn => /カレンダー|追加済み|追加|取消|取り消し/.test(btn.textContent || ""));

    buttons.forEach(btn => {
      btn.classList.toggle("is-added", added);
      btn.dataset.calendarAdded = added ? "1" : "0";

      if (added) {
        btn.innerHTML = btn.innerHTML.replace(/カレンダーに追加|追加する|追加/, "追加済み");
        if (!/追加済み/.test(btn.textContent || "")) btn.textContent = "✓ 追加済み";
      } else {
        btn.innerHTML = btn.innerHTML.replace(/✓?\s*追加済み|取消済み|取り消しました/g, "カレンダーに追加");
        if (!/カレンダーに追加/.test(btn.textContent || "")) btn.textContent = "カレンダーに追加";
      }
    });

    try {
      const msg = document.createElement("div");
      msg.className = "pnx-step133-search-toast";
      msg.textContent = added ? "カレンダーに追加しました" : "カレンダー追加を取り消しました";
      document.body.appendChild(msg);
      requestAnimationFrame(() => msg.dataset.visible = "1");
      setTimeout(() => {
        msg.dataset.visible = "0";
        setTimeout(() => msg.remove(), 220);
      }, 1600);
    } catch(e) {}
  }

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_SEARCH_CALENDAR_ADD_RESULT_STEP116" ||
      data.type === "PNX_SEARCH_CALENDAR_ADD_RESULT_STEP112" ||
      data.type === "PNX_SEARCH_CALENDAR_ADD_RESULT_STEP133"
    ) {
      const payload = data.payload || {};
      if (payload.ok && (payload.action === "removed" || payload.action === "added" || payload.action === "updated" || payload.action === "exists")) {
        updateCalendarButtons(payload.action);
      }
    }
  });

  window.PNXStep133SearchToggleStatus = function(){
    return {
      step:133,
      buttons:Array.from(document.querySelectorAll("button")).filter(btn => /カレンダー|追加済み|追加/.test(btn.textContent || "")).map(btn => ({
        text:text(btn.textContent),
        added:btn.dataset.calendarAdded || ""
      }))
    };
  };
})();





/* ================================================================
   STEP136: Final calendar add/cancel sender
   追加済みでも return せず、必ず本体へトグル命令を送る。
   古い STEP112 の if (isAdded(id)) return; を最終上書きする。
   ================================================================ */
(function(){
  if (window.__PNX_STEP136_FINAL_CALENDAR_TOGGLE_SENDER__) return;
  window.__PNX_STEP136_FINAL_CALENDAR_TOGGLE_SENDER__ = true;

  const pending = new Map();

  function text(v){ return String(v == null ? "" : v).trim(); }

  function findTournament(id){
    try {
      return Array.isArray(DUMMY_TOURNAMENTS)
        ? DUMMY_TOURNAMENTS.find(t => t && String(t.id || t.tournamentId) === String(id))
        : null;
    } catch(e) {
      return null;
    }
  }

  function currentAdded(id){
    try {
      if (typeof isAdded === "function" && isAdded(id)) return true;
      const t = findTournament(id);
      if (t && t.addedToCalendar) return true;
      if (APP_STATE && APP_STATE.addedToCalendar && APP_STATE.addedToCalendar.has(id)) return true;
    } catch(e) {}
    return false;
  }

  function payload(t){
    t = t || {};
    const id = text(t.id || t.tournamentId) || ("cms_" + Date.now());
    const name = text(t.name || t.title || t.tournamentTitle) || "大会予定";
    const start = text(t.start || t.startDate || t.date);
    const end = text(t.end || t.endDate || t.start || t.startDate || t.date) || start;
    const venue = text(t.course || t.venue || t.place || t.location);
    const category = text(t.category || t.cat || t.rawCategory || t.displayCategory) || "その他";

    return Object.assign({}, t, {
      id,
      tournamentId:id,
      name,
      title:name,
      date:start,
      start,
      startDate:start,
      end,
      endDate:end,
      place:venue,
      venue,
      course:venue,
      cat:category,
      category,
      rawCategory:category,
      displayCategory:category,
      entryDeadline:text(t.entryDeadline || t.deadline),
      entryFee:text(t.entryFee || t.fee),
      prize:text(t.prize || t.totalPrize),
      source:t.source || "search-cms-step136",
      originalTitle:t.title || t.name || "",
      tournamentTitle:t.title || t.name || ""
    });
  }

  function saveLocalState(){
    try { if (typeof saveStateToLocalStorage === "function") saveStateToLocalStorage(); } catch(e) {}
    try { if (typeof saveAppState === "function") saveAppState(); } catch(e) {}
    try { if (typeof saveState === "function") saveState(); } catch(e) {}
  }

  function setLocalAdded(id, added){
    const t = findTournament(id);
    if (t) t.addedToCalendar = !!added;

    try {
      if (APP_STATE && APP_STATE.addedToCalendar) {
        if (added) APP_STATE.addedToCalendar.add(id);
        else APP_STATE.addedToCalendar.delete(id);
      }
    } catch(e) {}

    saveLocalState();
    syncButtons(id, added);
  }

  function syncButtons(id, added){
    const t = findTournament(id);

    const addedHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>追加済み';
    const addHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>カレンダーに追加';

    try {
      const safeId = (window.CSS && CSS.escape) ? CSS.escape(String(id)) : String(id).replace(/"/g, '\\"');
      document.querySelectorAll(`.tc-btn-add[data-id="${safeId}"]`).forEach(btn => {
        btn.classList.toggle("added", !!added);
        btn.classList.toggle("is-added", !!added);
        btn.dataset.calendarAdded = added ? "1" : "0";
        btn.innerHTML = added ? addedHTML : addHTML;
      });
    } catch(e) {}

    try {
      const bsBtn = document.getElementById("bs-cta-add");
      if (bsBtn && APP_STATE && String(APP_STATE.selectedTournamentId) === String(id)) {
        if (t) t.addedToCalendar = !!added;
        bsBtn.classList.toggle("added", !!added);
        bsBtn.classList.toggle("is-added", !!added);
        bsBtn.dataset.calendarAdded = added ? "1" : "0";
        bsBtn.innerHTML = added ? addedHTML : addHTML;
      }
    } catch(e) {}

    try {
      if (typeof _syncBSAddBtn === "function" && t) _syncBSAddBtn(t);
    } catch(e) {}
  }

  function setPending(id, willRemove){
    const textValue = willRemove ? "取消中..." : "追加中...";

    try {
      const safeId = (window.CSS && CSS.escape) ? CSS.escape(String(id)) : String(id).replace(/"/g, '\\"');
      document.querySelectorAll(`.tc-btn-add[data-id="${safeId}"]`).forEach(btn => {
        btn.classList.add("is-pending");
        btn.textContent = textValue;
      });
    } catch(e) {}

    try {
      const bsBtn = document.getElementById("bs-cta-add");
      if (bsBtn && APP_STATE && String(APP_STATE.selectedTournamentId) === String(id)) {
        bsBtn.classList.add("is-pending");
        bsBtn.textContent = textValue;
      }
    } catch(e) {}
  }

  function clearPending(id){
    try {
      const safeId = (window.CSS && CSS.escape) ? CSS.escape(String(id)) : String(id).replace(/"/g, '\\"');
      document.querySelectorAll(`.tc-btn-add[data-id="${safeId}"]`).forEach(btn => btn.classList.remove("is-pending"));
    } catch(e) {}

    try {
      const bsBtn = document.getElementById("bs-cta-add");
      if (bsBtn && APP_STATE && String(APP_STATE.selectedTournamentId) === String(id)) {
        bsBtn.classList.remove("is-pending");
      }
    } catch(e) {}
  }

  function toast(message){
    try {
      if (typeof showToast === "function") {
        showToast(message);
        return;
      }
      const el = document.createElement("div");
      el.className = "pnx-step136-search-toast";
      el.textContent = message;
      document.body.appendChild(el);
      requestAnimationFrame(() => el.dataset.visible = "1");
      setTimeout(() => {
        el.dataset.visible = "0";
        setTimeout(() => el.remove(), 220);
      }, 1600);
    } catch(e) {}
  }

  window.handleCalendarAdd = function(id){
    const t = findTournament(id);
    if (!t) return;

    // 重要: 追加済みでもreturnしない。追加済みなら本体側で削除される。
    const alreadyAdded = currentAdded(id);
    const requestId = "step136_" + Date.now() + "_" + Math.random().toString(16).slice(2);

    pending.set(requestId, { id, wasAdded: alreadyAdded });
    setPending(id, alreadyAdded);

    try {
      window.parent && window.parent.postMessage({
        type:"PNX_SEARCH_TOGGLE_TOURNAMENT_CALENDAR_STEP136",
        requestId,
        payload:payload(t)
      }, "*");
    } catch(e) {
      pending.delete(requestId);
      clearPending(id);
      syncButtons(id, alreadyAdded);
      toast("カレンダー操作に失敗しました");
      return;
    }

    setTimeout(function(){
      if (!pending.has(requestId)) return;
      const item = pending.get(requestId);
      pending.delete(requestId);
      clearPending(id);
      syncButtons(id, item.wasAdded);
      toast("カレンダー操作の確認に時間がかかっています");
    }, 3500);
  };

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type !== "PNX_SEARCH_CALENDAR_TOGGLE_RESULT_STEP136") return;

    const item = pending.get(data.requestId);
    if (data.requestId) pending.delete(data.requestId);

    if (!item) return;

    const result = data.payload || {};
    const id = item.id;

    clearPending(id);

    if (!result.ok) {
      syncButtons(id, item.wasAdded);
      toast("カレンダー操作に失敗しました");
      return;
    }

    const removed = result.action === "removed" || result.removed === true;
    const added = !removed;

    setLocalAdded(id, added);
    toast(removed ? "カレンダー追加を取り消しました" : "カレンダーに追加しました");

    window.__PNX_STEP136_LAST_SEARCH_TOGGLE__ = {
      id,
      action: removed ? "removed" : "added",
      at: new Date().toISOString(),
      result
    };
  });

  window.PNXStep136SearchCalendarToggleStatus = function(){
    return {
      step:136,
      pending:Array.from(pending.entries()).map(([requestId, v]) => ({ requestId, ...v })),
      selectedTournamentId:APP_STATE && APP_STATE.selectedTournamentId,
      selectedAdded:APP_STATE && APP_STATE.selectedTournamentId ? currentAdded(APP_STATE.selectedTournamentId) : null,
      last:window.__PNX_STEP136_LAST_SEARCH_TOGGLE__ || null,
      note:"追加済みでも本体へトグル命令を送る最終handleCalendarAddが有効です。"
    };
  };
})();



/* ================================================================
   SIDE STEP A-1: Tournament logo master matching
   目的:
   - AIで毎回ロゴ生成しない。
   - 登録済みロゴマスターから series / organizer / title を照合して
     logoUrl / visualLabel / visualTheme / organizerKey / visualSource を自動補完する。
   注意:
   - 試合検索カードの大きなデザイン変更はまだしない。
   - CMS/試合検索で見える大会名・カテゴリ表示は変更しない。
   - カレンダー追加/取り消し処理には触らない。
   ================================================================ */
(function(){
  if (window.__PNX_SIDE_STEP_A1_LOGO_MASTER_MATCH__) return;
  window.__PNX_SIDE_STEP_A1_LOGO_MASTER_MATCH__ = true;

  const SERIES_VISUALS = {
    "ATP GOLF TOUR": { key:"atp", logoUrl:"assets/logos/tournaments/atp-golf-tour.png", theme:"mini", visualLabel:"ATP", aliases:["ATP", "ATP GOLF", "ATPゴルフツアー", "ATP GOLF TOUR"] },
    "FJ TOUR": { key:"fjtour", logoUrl:"assets/logos/tournaments/fj-tour.png", theme:"mini", visualLabel:"FJ TOUR", aliases:["FJ TOUR", "FJ-TOUR", "FJツアー"] },
    "FJ-TOUR": { key:"fjtour", logoUrl:"assets/logos/tournaments/fj-tour.png", theme:"mini", visualLabel:"FJ TOUR", aliases:["FJ TOUR", "FJ-TOUR", "FJツアー"] },
    "ナガタカップ": { key:"nagata-cup", logoUrl:"assets/logos/tournaments/nagata-cup.png", theme:"premium", visualLabel:"NAGATA CUP", aliases:["ナガタカップ", "NAGATA CUP", "NAGATA"] },
    "県オープン": { key:"pref-open", logoUrl:"assets/logos/tournaments/pref-open.png", theme:"open", visualLabel:"PREF OPEN", aliases:["県オープン", "地方オープン", "オープン大会"] }
  };

  window.SERIES_VISUALS = SERIES_VISUALS;
  window.PNX_SERIES_VISUALS = SERIES_VISUALS;

  function text(v){ return String(v == null ? "" : v).trim(); }
  function normalizeDigits(str){ return String(str || "").replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)); }
  function canonical(str){
    return normalizeDigits(text(str)).toUpperCase()
      .replace(/[Ａ-Ｚａ-ｚ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
      .replace(/[‐‑‒–—ー－]/g, "-").replace(/\s+/g, " ").trim();
  }
  function compact(str){ return canonical(str).replace(/[\s\-_・.。･]/g, ""); }

  function categoryTheme(category){
    const s = canonical(category);
    if (/MINI|ミニ|ATP|FJ|FUTURE|DOUCUS|P&A|カートルズ|MEMO|スピーダー/.test(s)) return "mini";
    if (/OPEN|オープン|県オープン|地方オープン|選手権|カップ/.test(s)) return "open";
    if (/JGTO|国内男子|男子ツアー/.test(s)) return "jgto";
    if (/JLPGA|LPGA|国内女子|女子|ステップ/.test(s)) return "jlpga";
    if (/PGA|KORN|DP WORLD|ASIAN|LIV|海外|韓国|台湾|中国|フィリピン/.test(s)) return "overseas";
    if (/QT|予選/.test(s)) return "qualifier";
    return "default";
  }

  function stripTournamentPrefix(name){
    let s = text(name);
    if (!s) return s;
    s = s.replace(/^(?:20\d{2})\s*年?\s*第\s*[0-9０-９一二三四五六七八九十百]+回\s*/, "");
    s = s.replace(/^(?:20\d{2})\s*年?\s*/, "");
    return s.trim() || text(name);
  }

  function autoLabelFromName(t){
    const explicit = text(t.visualLabel);
    if (explicit) return explicit;
    const series = text(t.series || t.tourSeries || t.tourName || t.organizer);
    if (series) {
      const cleanSeries = stripTournamentPrefix(series);
      if (cleanSeries.length <= 12) return cleanSeries;
    }
    const title = stripTournamentPrefix(text(t.title || t.name || t.tournamentTitle));
    if (!title) {
      const theme = categoryTheme(t.category || t.cat);
      if (theme === "mini") return "MINI TOUR";
      if (theme === "open") return "OPEN";
      return "TOURNAMENT";
    }
    if (/ナガタカップ/i.test(title)) return "NAGATA CUP";
    if (/ATP/i.test(title)) return "ATP";
    if (/FJ[-\s]?TOUR/i.test(title)) return "FJ TOUR";
    if (/^[A-Za-z0-9\s\-]+$/.test(title) && title.length <= 14) return title.toUpperCase();
    return title.length > 10 ? title.slice(0, 10) : title;
  }

  function allEntries(){
    const list = [];
    Object.entries(SERIES_VISUALS).forEach(([name, conf]) => {
      list.push([name, conf]);
      (conf.aliases || []).forEach(alias => list.push([alias, conf]));
    });
    return list;
  }

  function matchVisualByField(value){
    const raw = text(value);
    if (!raw) return null;
    const c = canonical(raw);
    const cp = compact(raw);
    for (const [name, conf] of allEntries()) {
      const nc = canonical(name);
      const np = compact(name);
      if (!nc) continue;
      if (c === nc || cp === np || c.includes(nc) || cp.includes(np)) return Object.assign({ matchedName:name }, conf);
    }
    return null;
  }

  function findVisual(t){
    if (!t) return null;
    const explicitLogo = text(t.logoUrl || t.tournamentLogoUrl || t.organizerLogo || t.seriesLogoUrl);
    if (explicitLogo) {
      return {
        key:text(t.organizerKey || t.seriesKey || "explicit"),
        logoUrl:explicitLogo,
        theme:text(t.visualTheme) || categoryTheme(t.category || t.cat),
        visualLabel:text(t.visualLabel) || autoLabelFromName(t),
        visualSource:"explicit-logo",
        matchedName:text(t.series || t.organizer || t.title || t.name)
      };
    }
    const checks = [
      ["series", t.series || t.tourSeries || t.tourName],
      ["organizer", t.organizer || t.host || t.promoter],
      ["title", t.title || t.name || t.tournamentTitle]
    ];
    for (const [source, value] of checks) {
      const hit = matchVisualByField(value);
      if (hit) return Object.assign({ visualSource:source }, hit);
    }
    return null;
  }

  function applyTournamentVisual(t){
    if (!t || typeof t !== "object") return t;
    const hit = findVisual(t);
    const theme = text(t.visualTheme) || (hit && hit.theme) || categoryTheme(t.category || t.cat);
    const visualLabel = text(t.visualLabel) || (hit && hit.visualLabel) || autoLabelFromName(t);
    const logoUrl = text(t.logoUrl || t.tournamentLogoUrl || t.organizerLogo || t.seriesLogoUrl) || (hit && hit.logoUrl) || "";
    const organizerKey = text(t.organizerKey || t.seriesKey) || (hit && hit.key) || "";
    const visualSource = text(t.visualSource) || (hit && hit.visualSource) || (logoUrl ? "logo-master" : "auto-text");
    t.visualLabel = visualLabel;
    t.visualTheme = theme;
    t.logoUrl = logoUrl;
    t.organizerKey = organizerKey;
    t.visualSource = visualSource;
    t.imageUrl = text(t.imageUrl || t.coverImageUrl || "");
    t.venueImageUrl = text(t.venueImageUrl || "");
    t.series = text(t.series || t.tourSeries || t.tourName || (hit && hit.matchedName) || "");
    t.visualMatchedName = text((hit && hit.matchedName) || "");
    t._pnxSideStepA1Visualized = true;
    return t;
  }

  function enrichAll(){
    if (typeof DUMMY_TOURNAMENTS === "undefined" || !Array.isArray(DUMMY_TOURNAMENTS)) return 0;
    let count = 0;
    DUMMY_TOURNAMENTS.forEach(t => { if (t) { applyTournamentVisual(t); count++; } });
    window.__PNX_SIDE_STEP_A1_VISUALIZED_COUNT__ = count;
    return count;
  }

  try {
    if (typeof pnxStep89NormalizeCmsTournament === "function" && !pnxStep89NormalizeCmsTournament.__pnxSideStepA1Wrapped) {
      const original = pnxStep89NormalizeCmsTournament;
      const wrapped = function(t, index){ return applyTournamentVisual(original.apply(this, arguments)); };
      wrapped.__pnxSideStepA1Wrapped = true;
      pnxStep89NormalizeCmsTournament = wrapped;
    }
  } catch(e) {}

  try {
    if (typeof pnxStep89MergeCmsIntoOfficialList === "function" && !pnxStep89MergeCmsIntoOfficialList.__pnxSideStepA1Wrapped) {
      const originalMerge = pnxStep89MergeCmsIntoOfficialList;
      const wrappedMerge = function(){ const result = originalMerge.apply(this, arguments); enrichAll(); return result; };
      wrappedMerge.__pnxSideStepA1Wrapped = true;
      pnxStep89MergeCmsIntoOfficialList = wrappedMerge;
    }
  } catch(e) {}

  try {
    if (typeof renderTournamentList === "function" && !renderTournamentList.__pnxSideStepA1Wrapped) {
      const originalRenderTournamentList = renderTournamentList;
      const wrappedRenderTournamentList = function(tournaments){
        if (Array.isArray(tournaments)) tournaments.forEach(applyTournamentVisual);
        enrichAll();
        return originalRenderTournamentList.apply(this, arguments);
      };
      wrappedRenderTournamentList.__pnxSideStepA1Wrapped = true;
      renderTournamentList = wrappedRenderTournamentList;
    }
  } catch(e) {}

  try {
    if (typeof renderBottomSheetContent === "function" && !renderBottomSheetContent.__pnxSideStepA1Wrapped) {
      const originalRenderBottomSheetContent = renderBottomSheetContent;
      const wrappedRenderBottomSheetContent = function(t){ applyTournamentVisual(t); return originalRenderBottomSheetContent.apply(this, arguments); };
      wrappedRenderBottomSheetContent.__pnxSideStepA1Wrapped = true;
      renderBottomSheetContent = wrappedRenderBottomSheetContent;
    }
  } catch(e) {}

  document.addEventListener("DOMContentLoaded", function(){ setTimeout(enrichAll, 80); setTimeout(enrichAll, 600); setTimeout(enrichAll, 1600); });
  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type === "PNX_CMS_SEARCH_SNAPSHOT_UPDATED" || data.type === "PNX_CMS_FINAL_SEARCH_SYNC_PUBLISHED" || data.type === "PNX_CMS_TOURNAMENTS_UPDATED" || data.type === "PNX_SEARCH_FORCE_RENDER_CMS_TOURNAMENTS") {
      setTimeout(enrichAll, 120); setTimeout(enrichAll, 600);
    }
  });

  window.PNXSideStepA1ApplyTournamentVisual = applyTournamentVisual;
  window.PNXSideStepA1EnrichAllVisuals = enrichAll;
  window.PNXSideStepA1FindVisual = findVisual;
  window.PNXSideStepA1VisualStatus = function(){
    enrichAll();
    let sample = [];
    try {
      sample = Array.isArray(DUMMY_TOURNAMENTS) ? DUMMY_TOURNAMENTS.slice(0, 12).map(t => ({
        id:t.id, title:t.title || t.name, series:t.series || "", organizer:t.organizer || "", category:t.category || t.cat || "",
        logoUrl:t.logoUrl || "", visualLabel:t.visualLabel || "", visualTheme:t.visualTheme || "", organizerKey:t.organizerKey || "", visualSource:t.visualSource || "", visualMatchedName:t.visualMatchedName || ""
      })) : [];
    } catch(e) {}
    const testItems = [
      { title:"2026年第5回ナガタカップ", series:"ナガタカップ", organizer:"ナガタカップ", category:"ミニツアー" },
      { title:"ATP GOLF TOUR", organizer:"ATP GOLF TOUR", category:"ミニツアー" },
      { title:"FJ-TOUR SKGr.カップ", organizer:"FJ-TOUR", category:"ミニツアー" }
    ].map(item => applyTournamentVisual(Object.assign({}, item)));
    return {
      sideStep:"A-1",
      description:"登録済みロゴマスター照合。カードデザイン変更前のデータ補完。",
      visualMasterCount:Object.keys(SERIES_VISUALS).length,
      visualMasterKeys:Object.keys(SERIES_VISUALS),
      visualizedCount:window.__PNX_SIDE_STEP_A1_VISUALIZED_COUNT__ || 0,
      sample,
      tests:testItems.map(t => ({ title:t.title, organizer:t.organizer, series:t.series, logoUrl:t.logoUrl, visualLabel:t.visualLabel, visualTheme:t.visualTheme, organizerKey:t.organizerKey, visualSource:t.visualSource, visualMatchedName:t.visualMatchedName })),
      next:"SIDE STEP A-2でカード左側のMINI TOUR固定表示をlogoUrl/visualLabel対応に変更"
    };
  };
})();




/* SIDE STEP A-2 status helper */
(function(){
  if (window.__PNX_SIDE_STEP_A2_STATUS_HELPER__) return;
  window.__PNX_SIDE_STEP_A2_STATUS_HELPER__ = true;

  window.PNXSideStepA2VisualRenderStatus = function(){
    const cards = Array.from(document.querySelectorAll(".s-tournament-card")).slice(0, 12).map(card => {
      const img = card.querySelector(".tc-brand-logo-img");
      const fallback = card.querySelector(".tc-brand-logo-fallback, .tc-brand-abbr");
      return {
        id: card.dataset.id || "",
        hasLogo: !!img,
        logoSrc: img ? img.getAttribute("src") : "",
        label: fallback ? fallback.textContent.trim() : "",
        visualTheme: card.querySelector(".tc-brand-col") ? card.querySelector(".tc-brand-col").dataset.visualTheme : "",
        visualSource: card.querySelector(".tc-brand-col") ? card.querySelector(".tc-brand-col").dataset.visualSource : ""
      };
    });

    return {
      sideStep:"A-2",
      description:"カード左側のMINI TOUR固定表示をlogoUrl/visualLabel対応に変更",
      cardCount:document.querySelectorAll(".s-tournament-card").length,
      cards,
      masterStatus:typeof window.PNXSideStepA1VisualStatus === "function" ? window.PNXSideStepA1VisualStatus() : null,
      next:"SIDE STEP A-3で画像があるカードの見た目をさらに整える"
    };
  };
})();




/* ================================================================
   SIDE STEP A-3: Card background visual enhancement
   目的:
   - A-2のロゴ/文字ロゴ対応を維持
   - imageUrl / venueImageUrl がある場合だけ、左カード背景画像として使う
   - 画像がない場合は visualTheme のグラデーションを維持
   注意:
   - カレンダー追加/取り消し、CMS反映、管理者判定は触らない
   ================================================================ */
(function(){
  if (window.__PNX_SIDE_STEP_A3_CARD_BACKGROUND_VISUAL__) return;
  window.__PNX_SIDE_STEP_A3_CARD_BACKGROUND_VISUAL__ = true;

  function text(v){ return String(v == null ? "" : v).trim(); }

  function resolveAssetUrl(url){
    if (typeof window.PNXSideStepA2ResolveAssetUrl === "function") {
      return window.PNXSideStepA2ResolveAssetUrl(url);
    }
    const raw = text(url);
    if (!raw) return "";
    if (/^(https?:)?\/\//i.test(raw) || raw.startsWith("data:") || raw.startsWith("blob:")) return raw;
    if (raw.startsWith("assets/")) return "../../" + raw;
    if (raw.startsWith("/assets/")) return "../.." + raw;
    return raw;
  }

  function cardBackgroundUrl(t){
    if (!t) return "";
    const raw =
      text(t.imageUrl) ||
      text(t.cardImageUrl) ||
      text(t.coverImageUrl) ||
      text(t.venueImageUrl) ||
      text(t.courseImageUrl) ||
      text(t.backgroundImageUrl);

    return resolveAssetUrl(raw);
  }

  function extendBrand(brand, t){
    const bg = cardBackgroundUrl(t);
    brand.backgroundUrl = bg;
    brand.hasBackgroundImage = !!bg;
    brand.cls = (brand.cls || "") + (bg ? " has-bg-image" : "");
    return brand;
  }

  if (typeof pnxSideStepA2CardBrand === "function" && !pnxSideStepA2CardBrand.__pnxSideStepA3Wrapped) {
    const originalA2CardBrand = pnxSideStepA2CardBrand;
    const wrappedA2CardBrand = function(t, fallbackBrand){
      const brand = originalA2CardBrand.apply(this, arguments);
      return extendBrand(brand || {}, t);
    };
    wrappedA2CardBrand.__pnxSideStepA3Wrapped = true;
    pnxSideStepA2CardBrand = wrappedA2CardBrand;
    window.PNXSideStepA2CardBrand = wrappedA2CardBrand;
  }

  window.PNXSideStepA3BrandStyle = function(brand){
    const url = text(brand && brand.backgroundUrl);
    if (!url) return "";
    const safe = url.replace(/"/g, "%22").replace(/\)/g, "%29");
    return `--pnx-card-bg-image:url("${safe}");`;
  };

  window.PNXSideStepA3CardBackgroundUrl = cardBackgroundUrl;

  window.PNXSideStepA3VisualStatus = function(){
    const cards = Array.from(document.querySelectorAll(".s-tournament-card")).slice(0, 12).map(card => {
      const col = card.querySelector(".tc-brand-col");
      const img = card.querySelector(".tc-brand-logo-img");
      const label = card.querySelector(".tc-brand-logo-fallback, .tc-brand-abbr");
      return {
        id: card.dataset.id || "",
        hasLogo: !!img,
        logoSrc: img ? img.getAttribute("src") : "",
        label: label ? label.textContent.trim() : "",
        hasBackgroundImage: !!(col && col.classList.contains("has-bg-image")),
        style: col ? col.getAttribute("style") || "" : "",
        visualTheme: col ? col.dataset.visualTheme || "" : "",
        visualSource: col ? col.dataset.visualSource || "" : ""
      };
    });

    return {
      sideStep:"A-3",
      description:"imageUrl / venueImageUrl を左カード背景画像に使う。無ければA-2のロゴ/文字ロゴとテーマ背景を維持。",
      cardCount:document.querySelectorAll(".s-tournament-card").length,
      cards,
      a2Status:typeof window.PNXSideStepA2VisualRenderStatus === "function" ? window.PNXSideStepA2VisualRenderStatus() : null,
      next:"SIDE STEP A-4でCMS側にロゴ/画像URL入力欄を追加するか、STEP137に戻る"
    };
  };
})();




/* ================================================================
   SIDE STEP A-4: Visual label fallback fix
   目的:
   - 左カードが「ー」「-」「不明」だけになるのを禁止
   - ロゴが無い大会も大会名/カテゴリから自然な文字ロゴにする
   - A-1/A-2/A-3のロゴ/背景対応は維持
   注意:
   - カレンダー追加/取り消し、CMS反映、管理者判定は触らない
   ================================================================ */
(function(){
  if (window.__PNX_SIDE_STEP_A4_VISUAL_LABEL_FALLBACK_FIX__) return;
  window.__PNX_SIDE_STEP_A4_VISUAL_LABEL_FALLBACK_FIX__ = true;

  function text(v){ return String(v == null ? "" : v).trim(); }

  function normalizeDigits(str){
    return String(str || "").replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
  }

  function compact(str){
    return normalizeDigits(text(str))
      .replace(/[‐‑‒–—ー－―〜~・\s]/g, "")
      .toUpperCase();
  }

  function isBadLabel(label){
    const s = text(label);
    if (!s) return true;

    const c = compact(s);
    if (!c) return true;

    if (/^(UNKNOWN|NULL|UNDEFINED|NAN|NONE|NO|FALSE|TRUE)$/.test(c)) return true;
    if (/^(不明|未定|要確認|なし|無し)$/.test(s)) return true;
    if (/^(締切|締切日|締切済|募集中|開催中|終了済)$/i.test(s)) return true;

    // 記号だけ・棒だけを禁止
    if (/^[\-‐‑‒–—ー－―〜~・.。･_/\\|]+$/.test(s)) return true;

    // 数字だけ、または1文字の記号/数字だけも避ける
    if (/^[0-9０-９]+$/.test(s)) return true;
    if (s.length <= 1 && !/[A-Za-z一-龠ぁ-んァ-ヶ]/.test(s)) return true;

    return false;
  }

  const PREF_LABELS = {
    "北海道": "HOKKAIDO OPEN",
    "青森": "AOMORI OPEN",
    "岩手": "IWATE OPEN",
    "宮城": "MIYAGI OPEN",
    "秋田": "AKITA OPEN",
    "山形": "YAMAGATA OPEN",
    "福島": "FUKUSHIMA OPEN",
    "茨城": "IBARAKI OPEN",
    "栃木": "TOCHIGI OPEN",
    "群馬": "GUNMA OPEN",
    "埼玉": "SAITAMA OPEN",
    "千葉": "CHIBA OPEN",
    "東京": "TOKYO OPEN",
    "神奈川": "KANAGAWA OPEN",
    "山梨": "YAMANASHI OPEN",
    "長野": "NAGANO OPEN",
    "新潟": "NIIGATA OPEN",
    "静岡": "SHIZUOKA OPEN",
    "愛知": "AICHI OPEN",
    "岐阜": "GIFU OPEN",
    "三重": "MIE OPEN",
    "滋賀": "SHIGA OPEN",
    "京都": "KYOTO OPEN",
    "大阪": "OSAKA OPEN",
    "兵庫": "HYOGO OPEN",
    "奈良": "NARA OPEN",
    "和歌山": "WAKAYAMA OPEN",
    "広島": "HIROSHIMA OPEN",
    "岡山": "OKAYAMA OPEN",
    "山口": "YAMAGUCHI OPEN",
    "香川": "KAGAWA OPEN",
    "愛媛": "EHIME OPEN",
    "高知": "KOCHI OPEN",
    "福岡": "FUKUOKA OPEN",
    "佐賀": "SAGA OPEN",
    "長崎": "NAGASAKI OPEN",
    "熊本": "KUMAMOTO OPEN",
    "大分": "OITA OPEN",
    "宮崎": "MIYAZAKI OPEN",
    "鹿児島": "KAGOSHIMA OPEN",
    "沖縄": "OKINAWA OPEN"
  };

  function stripTournamentPrefix(name){
    let s = text(name);
    if (!s) return s;
    s = s.replace(/^(?:20\d{2})\s*年?\s*第\s*[0-9０-９一二三四五六七八九十百]+回\s*/, "");
    s = s.replace(/^(?:20\d{2})\s*年?\s*/, "");
    s = s.replace(/^[\s\-–—ー－・:：]+/, "");
    return s.trim() || text(name);
  }

  function themeFromCategory(t){
    const s = text((t && (t.visualTheme || t.category || t.cat || t.rawCategory || t.displayCategory)) || "");
    if (/mini|ミニ|ATP|FJ|Future|フューチャー|DOUCUS|P&A|カートルズ|Memo|スピーダー/i.test(s)) return "mini";
    if (/open|オープン|選手権|カップ/i.test(s)) return "open";
    if (/JGTO|国内男子|男子ツアー/i.test(s)) return "jgto";
    if (/JLPGA|国内女子|女子|ステップ/i.test(s)) return "jlpga";
    if (/PGA|Korn|DP World|Asian|LIV|海外|韓国|台湾|中国|フィリピン/i.test(s)) return "overseas";
    return "default";
  }

  function deriveLabel(t, currentLabel){
    if (!isBadLabel(currentLabel)) return text(currentLabel);

    const titleRaw = text(t && (t.title || t.name || t.tournamentTitle || t.originalTitle));
    const title = stripTournamentPrefix(titleRaw);
    const series = stripTournamentPrefix(text(t && (t.series || t.tourSeries || t.tourName)));
    const organizer = stripTournamentPrefix(text(t && (t.organizer || t.host || t.promoter)));
    const category = text(t && (t.category || t.cat || t.rawCategory || t.displayCategory));

    const hay = [titleRaw, title, series, organizer, category].join(" ");

    if (/ナガタカップ/i.test(hay)) return "NAGATA CUP";
    if (/ATP\s*GOLF\s*TOUR|ATP/i.test(hay)) return "ATP";
    if (/FJ[-\s]?TOUR|FJツアー/i.test(hay)) return "FJ TOUR";
    if (/Future\s*Tour|フューチャー/i.test(hay)) return "FUTURE TOUR";

    for (const [jp, label] of Object.entries(PREF_LABELS)) {
      if (hay.includes(jp) && /オープン|OPEN/i.test(hay)) return label;
    }

    if (/関東.*ミニツアー|関東ミニ/i.test(hay)) return "関東 MINI";
    if (/関西.*ミニツアー|関西ミニ/i.test(hay)) return "関西 MINI";
    if (/ミニツアー|MINI/i.test(hay)) return "MINI TOUR";
    if (/オープン|OPEN/i.test(hay)) return "OPEN";

    if (!isBadLabel(series) && series.length <= 14) return series;
    if (!isBadLabel(organizer) && organizer.length <= 14) return organizer;

    if (!isBadLabel(title)) {
      if (/^[A-Za-z0-9\s\-]+$/.test(title) && title.length <= 16) return title.toUpperCase();
      return title.length > 10 ? title.slice(0, 10) : title;
    }

    const theme = themeFromCategory(t);
    if (theme === "mini") return "MINI TOUR";
    if (theme === "open") return "OPEN";
    if (theme === "jgto") return "JGTO";
    if (theme === "jlpga") return "JLPGA";
    if (theme === "overseas") return "TOUR";

    return "TOURNAMENT";
  }

  function deriveSub(t, currentSub, label){
    if (!isBadLabel(currentSub) && text(currentSub) !== text(label)) return text(currentSub);

    const organizer = text(t && (t.organizer || t.host || t.promoter));
    const series = text(t && (t.series || t.tourSeries || t.tourName));
    const category = text(t && (t.category || t.cat || t.rawCategory || t.displayCategory));
    const theme = themeFromCategory(t);

    if (!isBadLabel(series) && text(series) !== text(label)) return series;
    if (!isBadLabel(organizer) && text(organizer) !== text(label)) return organizer;
    if (!isBadLabel(category) && text(category) !== text(label)) return category;

    if (theme === "mini") return "ミニツアー";
    if (theme === "open") return "オープン大会";
    return "";
  }

  function fixTournamentVisual(t){
    if (!t || typeof t !== "object") return t;

    const fixedLabel = deriveLabel(t, t.visualLabel);
    t.visualLabel = fixedLabel;

    if (isBadLabel(t.visualTheme)) t.visualTheme = themeFromCategory(t);
    if (isBadLabel(t.visualSource)) t.visualSource = t.logoUrl ? "logo-master" : "auto-text";

    return t;
  }

  function fixBrand(brand, t){
    brand = brand || {};

    const label = deriveLabel(t, brand.label);
    brand.label = label;
    brand.sub = deriveSub(t, brand.sub, label);

    if (isBadLabel(brand.visualTheme)) {
      brand.visualTheme = themeFromCategory(t);
      brand.cls = String(brand.cls || "").replace(/visual-theme-[a-z0-9_-]+/g, "") + " visual-theme-" + brand.visualTheme;
    }

    if (t && typeof t === "object") {
      t.visualLabel = label;
      t.visualTheme = brand.visualTheme || t.visualTheme || themeFromCategory(t);
    }

    return brand;
  }

  // A-1のデータ補完を安全化
  if (typeof window.PNXSideStepA1ApplyTournamentVisual === "function" && !window.PNXSideStepA1ApplyTournamentVisual.__pnxSideStepA4Wrapped) {
    const originalApply = window.PNXSideStepA1ApplyTournamentVisual;
    const wrappedApply = function(t){
      const result = originalApply.apply(this, arguments);
      return fixTournamentVisual(result || t);
    };
    wrappedApply.__pnxSideStepA4Wrapped = true;
    window.PNXSideStepA1ApplyTournamentVisual = wrappedApply;
    try { PNXSideStepA1ApplyTournamentVisual = wrappedApply; } catch(e) {}
  }

  // A-2/A-3のブランド表示を最終補正
  if (typeof pnxSideStepA2CardBrand === "function" && !pnxSideStepA2CardBrand.__pnxSideStepA4Wrapped) {
    const originalCardBrand = pnxSideStepA2CardBrand;
    const wrappedCardBrand = function(t, fallbackBrand){
      fixTournamentVisual(t);
      const brand = originalCardBrand.apply(this, arguments);
      return fixBrand(brand, t);
    };
    wrappedCardBrand.__pnxSideStepA4Wrapped = true;
    pnxSideStepA2CardBrand = wrappedCardBrand;
    window.PNXSideStepA2CardBrand = wrappedCardBrand;
  }

  function enrichAll(){
    try {
      if (typeof DUMMY_TOURNAMENTS !== "undefined" && Array.isArray(DUMMY_TOURNAMENTS)) {
        DUMMY_TOURNAMENTS.forEach(fixTournamentVisual);
      }
    } catch(e) {}
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(enrichAll, 60);
    setTimeout(enrichAll, 500);
    setTimeout(enrichAll, 1400);
  });

  window.PNXSideStepA4FixTournamentVisual = fixTournamentVisual;
  window.PNXSideStepA4DeriveLabel = deriveLabel;
  window.PNXSideStepA4VisualLabelStatus = function(){
    enrichAll();

    const testItems = [
      { title:"2026年第5回ナガタカップ", category:"ミニツアー", visualLabel:"ー" },
      { title:"埼玉オープンゴルフ選手権", category:"オープン大会", visualLabel:"ー" },
      { title:"関東ミニツアー 第3戦", category:"ミニツアー", visualLabel:"-" },
      { title:"FJ-TOUR SKGr.カップ", organizer:"FJ-TOUR", category:"ミニツアー", visualLabel:"ー" },
      { title:"ATP GOLF TOUR 第6戦", organizer:"ATP GOLF TOUR", category:"ミニツアー", visualLabel:"ー" }
    ].map(item => fixTournamentVisual(Object.assign({}, item)));

    const cards = Array.from(document.querySelectorAll(".s-tournament-card")).slice(0, 12).map(card => {
      const labelEl = card.querySelector(".tc-brand-logo-fallback, .tc-brand-abbr");
      const subEl = card.querySelector(".tc-brand-sub");
      return {
        id: card.dataset.id || "",
        label: labelEl ? labelEl.textContent.trim() : "",
        sub: subEl ? subEl.textContent.trim() : "",
        badLabel: isBadLabel(labelEl ? labelEl.textContent.trim() : "")
      };
    });

    return {
      sideStep:"A-4",
      description:"左カードの「ー」表示を禁止し、大会名/カテゴリから自然な文字ロゴを生成",
      tests:testItems.map(t => ({
        title:t.title,
        category:t.category,
        organizer:t.organizer || "",
        visualLabel:t.visualLabel,
        visualTheme:t.visualTheme
      })),
      cards,
      hasBadLabels: cards.some(c => c.badLabel),
      next:"問題なければSTEP137へ戻る。必要ならA-5でCMS側のロゴ/画像URL入力欄を追加。"
    };
  };
})();




/* ================================================================
   SIDE STEP A-4b: Logo 404 guard
   目的:
   - ロゴ候補URLは保持する
   - ただし、実ファイルが未登録のローカルロゴは img 読み込みしない
   - Consoleの 404 を防ぎ、文字ロゴfallbackにする
   注意:
   - 実ロゴを assets/logos/tournaments/ に入れたら AVAILABLE_LOGO_ASSETS に追加する
   ================================================================ */
(function(){
  if (window.__PNX_SIDE_STEP_A4B_LOGO_404_GUARD__) return;
  window.__PNX_SIDE_STEP_A4B_LOGO_404_GUARD__ = true;

  const AVAILABLE_LOGO_ASSETS = [];

  window.PNX_AVAILABLE_LOGO_ASSETS = AVAILABLE_LOGO_ASSETS;

  function text(v){ return String(v == null ? "" : v).trim(); }

  function normalizeLocalAsset(url){
    const raw = text(url);
    if (!raw) return "";
    return raw
      .replace(/^\.\.\/\.\.\//, "")
      .replace(/^\.\.\//, "")
      .replace(/^\//, "");
  }

  function isRemoteOrInline(url){
    return /^(https?:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:");
  }

  function isLogoAvailable(url){
    const raw = text(url);
    if (!raw) return false;

    // Firebase Storageなどの外部URL、data/blobはそのまま許可。
    if (isRemoteOrInline(raw)) return true;

    const normalized = normalizeLocalAsset(raw);
    return AVAILABLE_LOGO_ASSETS.includes(normalized);
  }

  function guardBrandLogo(brand){
    brand = brand || {};

    const current = text(brand.logoUrl);
    if (!current) return brand;

    brand.logoCandidateUrl = brand.logoCandidateUrl || current;

    if (!isLogoAvailable(current)) {
      brand.logoUrl = "";
      brand.logoUrlRaw = "";
      brand.logoMissingReason = "local-logo-not-bundled";
      brand.cls = String(brand.cls || "")
        .replace(/\bhas-logo\b/g, "")
        .replace(/\bhas-text-logo\b/g, "")
        .trim() + " has-text-logo logo-not-bundled";
    }

    return brand;
  }

  if (typeof pnxSideStepA2CardBrand === "function" && !pnxSideStepA2CardBrand.__pnxSideStepA4bWrapped) {
    const originalCardBrand = pnxSideStepA2CardBrand;
    const wrappedCardBrand = function(t, fallbackBrand){
      const brand = originalCardBrand.apply(this, arguments);
      const guarded = guardBrandLogo(brand);

      if (t && typeof t === "object") {
        if (guarded.logoCandidateUrl) t.logoCandidateUrl = guarded.logoCandidateUrl;
        if (!guarded.logoUrl && guarded.logoCandidateUrl) {
          t.logoUrl = "";
          t.logoMissingReason = guarded.logoMissingReason || "local-logo-not-bundled";
        }
      }

      return guarded;
    };
    wrappedCardBrand.__pnxSideStepA4bWrapped = true;
    pnxSideStepA2CardBrand = wrappedCardBrand;
    window.PNXSideStepA2CardBrand = wrappedCardBrand;
  }

  window.PNXSideStepA4bIsLogoAvailable = isLogoAvailable;
  window.PNXSideStepA4bLogoGuardStatus = function(){
    const cards = Array.from(document.querySelectorAll(".s-tournament-card")).slice(0, 12).map(card => {
      const col = card.querySelector(".tc-brand-col");
      const img = card.querySelector(".tc-brand-logo-img");
      const label = card.querySelector(".tc-brand-logo-fallback, .tc-brand-abbr");
      return {
        id: card.dataset.id || "",
        hasImg: !!img,
        imgSrc: img ? img.getAttribute("src") : "",
        label: label ? label.textContent.trim() : "",
        className: col ? col.className : "",
        logoNotBundled: !!(col && col.classList.contains("logo-not-bundled"))
      };
    });

    return {
      sideStep:"A-4b",
      description:"未配置ローカルロゴのimg読み込みを止め、404を防ぐ",
      availableLogoAssets: AVAILABLE_LOGO_ASSETS,
      availableCount: AVAILABLE_LOGO_ASSETS.length,
      cards,
      note:"ロゴ画像を追加したら、assets/logos/tournaments/に置き、AVAILABLE_LOGO_ASSETSへ追加してください。"
    };
  };
})();




/* ================================================================
   STEP137: Search-side calendar state full sync
   目的:
   - カード一覧 / 詳細Bottom Sheet / APP_STATE / localStorage を
     本体カレンダーの実状態と同期する
   - カレンダー側で削除した場合も検索側の「追加済み」を解除する
   - STEP136の追加/取消トグルは維持
   ================================================================ */
(function(){
  if (window.__PNX_STEP137_SEARCH_CALENDAR_STATE_SYNC__) return;
  window.__PNX_STEP137_SEARCH_CALENDAR_STATE_SYNC__ = true;

  const SYNC_KEY = "PNX_SEARCH_LAST_CALENDAR_SYNC_STEP137";

  function text(v){ return String(v == null ? "" : v).trim(); }

  function readJson(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(e){ return fallback; }
  }

  function writeJson(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
  }

  function cleanKeyPart(v){
    return text(v).toLowerCase().replace(/\s+/g, "").replace(/[‐‑‒–—ー－\-・･.。]/g, "");
  }

  function tournamentId(t){
    return text(t && (t.id || t.tournamentId || t._tournamentId));
  }

  function tournamentTitle(t){
    return text(t && (t.originalTitle || t.tournamentTitle || t.title || t.name));
  }

  function tournamentDate(t){
    return text(t && (t.startDate || t.start || t.date));
  }

  function tournamentKeys(t){
    const keys = [];
    const id = tournamentId(t);
    const date = tournamentDate(t);

    if (id) {
      keys.push("id:" + id);
      keys.push(id);
    }

    [
      t && t.title,
      t && t.name,
      t && t.originalTitle,
      t && t.tournamentTitle,
      t && t.calendarTitle
    ].forEach(title => {
      const part = cleanKeyPart(title);
      if (part && date) keys.push("td:" + part + "@" + date);
    });

    return Array.from(new Set(keys.filter(Boolean)));
  }

  function findTournament(id){
    try {
      return Array.isArray(DUMMY_TOURNAMENTS)
        ? DUMMY_TOURNAMENTS.find(t => t && String(t.id || t.tournamentId) === String(id))
        : null;
    } catch(e) {
      return null;
    }
  }

  function isTournamentInSync(t, sync){
    if (!t || !sync) return false;

    const ids = Array.isArray(sync.ids) ? sync.ids.map(String) : [];
    const keys = Array.isArray(sync.keys) ? sync.keys.map(String) : [];

    const id = tournamentId(t);
    if (id && ids.includes(id)) return true;

    return tournamentKeys(t).some(k => keys.includes(k));
  }

  function setTournamentAddedLocal(id, added){
    const t = findTournament(id);
    if (t) t.addedToCalendar = !!added;

    try {
      if (APP_STATE && APP_STATE.addedToCalendar) {
        if (added) APP_STATE.addedToCalendar.add(id);
        else APP_STATE.addedToCalendar.delete(id);
      }
    } catch(e) {}
  }

  function syncButtonForTournament(t, added){
    if (!t) return;
    const id = String(t.id || t.tournamentId || "");
    if (!id) return;

    const addedHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>追加済み';
    const addHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>カレンダーに追加';

    try {
      const safeId = (window.CSS && CSS.escape) ? CSS.escape(id) : id.replace(/"/g, '\\"');
      document.querySelectorAll(`.tc-btn-add[data-id="${safeId}"]`).forEach(btn => {
        btn.classList.toggle("added", !!added);
        btn.classList.toggle("is-added", !!added);
        btn.dataset.calendarAdded = added ? "1" : "0";
        btn.innerHTML = added ? addedHTML : addHTML;
      });
    } catch(e) {}

    try {
      const bsBtn = document.getElementById("bs-cta-add");
      if (bsBtn && APP_STATE && String(APP_STATE.selectedTournamentId) === id) {
        bsBtn.classList.toggle("added", !!added);
        bsBtn.classList.toggle("is-added", !!added);
        bsBtn.dataset.calendarAdded = added ? "1" : "0";
        bsBtn.innerHTML = added ? addedHTML : addHTML;
      }
    } catch(e) {}
  }

  function saveLocalState(){
    try { if (typeof saveStateToLocalStorage === "function") saveStateToLocalStorage(); } catch(e) {}
    try { if (typeof saveAppState === "function") saveAppState(); } catch(e) {}
    try { if (typeof saveState === "function") saveState(); } catch(e) {}
  }

  function applyFullSync(sync){
    if (!sync || typeof sync !== "object") return { ok:false, reason:"no-sync" };

    const list = Array.isArray(DUMMY_TOURNAMENTS) ? DUMMY_TOURNAMENTS : [];
    let addedCount = 0;
    let changed = 0;

    list.forEach(t => {
      if (!t) return;

      const id = String(t.id || t.tournamentId || "");
      if (!id) return;

      const shouldAdd = isTournamentInSync(t, sync);
      const before = !!t.addedToCalendar || (APP_STATE && APP_STATE.addedToCalendar && APP_STATE.addedToCalendar.has(id));

      t.addedToCalendar = shouldAdd;

      try {
        if (APP_STATE && APP_STATE.addedToCalendar) {
          if (shouldAdd) APP_STATE.addedToCalendar.add(id);
          else APP_STATE.addedToCalendar.delete(id);
        }
      } catch(e) {}

      if (shouldAdd) addedCount++;
      if (before !== shouldAdd) changed++;

      syncButtonForTournament(t, shouldAdd);
    });

    saveLocalState();
    writeJson(SYNC_KEY, sync);

    window.__PNX_STEP137_LAST_SEARCH_SYNC__ = {
      at: new Date().toISOString(),
      changed,
      addedCount,
      sync
    };

    return { ok:true, changed, addedCount, total:list.length };
  }

  function requestSync(reason){
    try {
      window.parent && window.parent.postMessage({
        type:"PNX_SEARCH_REQUEST_CALENDAR_SYNC_STEP137",
        reason: reason || "request"
      }, "*");
    } catch(e) {}
  }

  // render後に最後の同期状態を再適用して、再描画でボタンが戻るのを防ぐ
  function reapplyLastSync(){
    const sync = window.__PNX_STEP137_LAST_SYNC_PAYLOAD__ || readJson(SYNC_KEY, null);
    if (sync) applyFullSync(sync);
  }

  try {
    if (typeof renderTournamentList === "function" && !renderTournamentList.__pnxStep137Wrapped) {
      const originalRender = renderTournamentList;
      const wrappedRender = function(){
        const result = originalRender.apply(this, arguments);
        setTimeout(reapplyLastSync, 0);
        setTimeout(reapplyLastSync, 80);
        return result;
      };
      wrappedRender.__pnxStep137Wrapped = true;
      renderTournamentList = wrappedRender;
    }
  } catch(e) {}

  try {
    if (typeof renderBottomSheetContent === "function" && !renderBottomSheetContent.__pnxStep137Wrapped) {
      const originalBS = renderBottomSheetContent;
      const wrappedBS = function(t){
        const result = originalBS.apply(this, arguments);
        setTimeout(reapplyLastSync, 0);
        setTimeout(reapplyLastSync, 80);
        return result;
      };
      wrappedBS.__pnxStep137Wrapped = true;
      renderBottomSheetContent = wrappedBS;
    }
  } catch(e) {}

  window.addEventListener("message", function(event){
    const data = event.data || {};

    if (data.type === "PNX_CALENDAR_SYNC_STATE_STEP137") {
      const sync = data.payload || {};
      window.__PNX_STEP137_LAST_SYNC_PAYLOAD__ = sync;
      applyFullSync(sync);
      return;
    }

    if (data.type === "PNX_SEARCH_CALENDAR_TOGGLE_RESULT_STEP136") {
      const result = data.payload || {};
      const ev = result.event || {};
      const id = text(ev.tournamentId || ev._tournamentId || ev.id);
      const added = !(result.action === "removed" || result.removed === true);

      if (id) {
        setTournamentAddedLocal(id, added);
        const t = findTournament(id);
        if (t) syncButtonForTournament(t, added);
        saveLocalState();
      }

      // 念のため本体の完全状態を取り直す
      setTimeout(function(){ requestSync("after-toggle-result"); }, 120);
    }
  });

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(function(){ requestSync("dom-ready"); }, 120);
    setTimeout(function(){ requestSync("late-ready"); }, 900);
    setTimeout(reapplyLastSync, 1400);
  });

  // iframeが後から安定同期を受けた時も要求
  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_STEP116_STABLE_SEARCH_SYNC" ||
      data.type === "PNX_SEARCH_FORCE_RENDER_CMS_TOURNAMENTS" ||
      data.type === "PNX_CMS_FINAL_SEARCH_SYNC_PUBLISHED"
    ) {
      setTimeout(function(){ requestSync("parent-or-cms-sync"); }, 120);
      setTimeout(reapplyLastSync, 360);
    }
  });

  window.PNXStep137SearchApplyCalendarSync = applyFullSync;
  window.PNXStep137SearchRequestCalendarSync = requestSync;
  window.PNXStep137SearchSyncStatus = function(){
    const sync = window.__PNX_STEP137_LAST_SYNC_PAYLOAD__ || readJson(SYNC_KEY, null);
    const list = Array.isArray(DUMMY_TOURNAMENTS) ? DUMMY_TOURNAMENTS : [];

    return {
      step:137,
      last:window.__PNX_STEP137_LAST_SEARCH_SYNC__ || null,
      sync,
      addedIds:APP_STATE && APP_STATE.addedToCalendar ? Array.from(APP_STATE.addedToCalendar) : [],
      visibleCards:Array.from(document.querySelectorAll(".tc-btn-add")).slice(0,12).map(btn => ({
        id:btn.dataset.id || "",
        text:btn.textContent.trim(),
        added:btn.classList.contains("added") || btn.classList.contains("is-added") || btn.dataset.calendarAdded === "1"
      })),
      dataAdded:list.filter(t => t && t.addedToCalendar).map(t => ({
        id:t.id,
        title:t.title || t.name,
        date:t.startDate || t.start || t.date
      }))
    };
  };
})();















































































































































































(function(){ window.__PNX_SEARCH_SCRIPT_VERSION__ = "step203-calendar-link"; })();


/* ================================================================
   STEP206: Logo / venue image / URL rendering
   ─ CMSで登録した大会ロゴ・会場画像・公式/申込/Instagram URLを
     試合検索カード、Bottom Sheet、カレンダー追加payloadへ反映する。
   ─ 既存の検索/フィルター/カレンダー追加ロジックは作り直さず、表示層だけ安全に上書き。
   ================================================================ */
(function(){
  if (window.__PNX_STEP206_VISUAL_URLS__) return;
  window.__PNX_STEP206_VISUAL_URLS__ = true;

  function text(v){ return String(v == null ? '' : v).trim(); }
  function esc(v){
    return text(v)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }
  function safeUrl(v){
    const u = text(v);
    if (!u) return '';
    if (/^(https?:\/\/|mailto:|tel:|\/|\.\/|\.\.\/|data:image\/)/i.test(u)) return u;
    return '';
  }
  function logoUrl(t){
    return safeUrl(t && (t.tournamentLogoUrl || t.logoUrl || t.eventLogoUrl || t.seriesLogoUrl || t.organizerLogoUrl || t.organizerLogo || t.hostLogoUrl));
  }
  function heroImageUrl(t){
    return safeUrl(t && (t.venueImageUrl || t.courseImageUrl || t.heroImageUrl || t.coverImageUrl || t.imageUrl || t.image));
  }
  function bestPrimaryUrl(t){
    return safeUrl(t && (t.entryUrl || t.applyUrl || t.applicationUrl)) ||
           safeUrl(t && (t.officialUrl || t.homepage || t.website || t.url)) ||
           safeUrl(t && (t.instagramUrl || t.instagram));
  }
  function urlItems(t){
    const items = [];
    const entry = safeUrl(t && (t.entryUrl || t.applyUrl || t.applicationUrl));
    const official = safeUrl(t && (t.officialUrl || t.homepage || t.website || t.url));
    const insta = safeUrl(t && (t.instagramUrl || t.instagram));
    if (entry) items.push({ key:'entry', label:'エントリー', icon:'↗', url:entry });
    if (official && official !== entry) items.push({ key:'official', label:'公式サイト', icon:'↗', url:official });
    if (insta && insta !== entry && insta !== official) items.push({ key:'instagram', label:'Instagram', icon:'◎', url:insta });
    return items;
  }
  function visualTheme(t){
    const c = text(t && t.cat).toLowerCase();
    if (c === 'jgto') return 'visual-theme-jgto';
    if (c === 'lpga') return 'visual-theme-jlpga';
    if (c === 'open') return 'visual-theme-open';
    if (c === 'mini' || c === 'other') return 'visual-theme-mini';
    if (c === 'abroad' || c === 'asian' || c === 'pga') return 'visual-theme-overseas';
    if (c === 'qt') return 'visual-theme-premium';
    return 'visual-theme-default';
  }
  function compactLabel(t, brand){
    return text(t && (t.shortName || t.logoText || t.tourName || t.organizerShortName)) || text(brand && brand.label) || text(t && t.name).slice(0, 10) || 'TOUR';
  }
  function brandSub(t, brand){
    return text(t && (t.organizer || t.rawCategory)) || text(brand && brand.sub) || catLabel(t && t.cat);
  }
  function brandVisualHTML(t, brand){
    const logo = logoUrl(t);
    const bg = heroImageUrl(t);
    const label = compactLabel(t, brand);
    const sub = brandSub(t, brand);
    const classes = [
      'tc-brand-col', brand.cls || '', 'pnx-visual-brand', visualTheme(t),
      logo ? 'has-logo' : 'has-text-logo', bg ? 'has-bg-image' : ''
    ].filter(Boolean).join(' ');
    const style = bg ? ` style="--pnx-card-bg-image:url('${esc(bg)}')"` : '';
    const logoBlock = logo
      ? `<div class="tc-brand-logo-wrap"><img class="tc-brand-logo-img" src="${esc(logo)}" alt="${esc(t.name || label)} ロゴ" loading="lazy" onerror="this.closest('.tc-brand-logo-wrap').classList.add('is-logo-missing');this.remove();"><span class="tc-brand-logo-fallback">${esc(label)}</span></div>`
      : '';
    return `
      <div class="${classes}"${style}>
        <div class="tc-brand-inner">
          ${logoBlock}
          <span class="tc-brand-abbr">${esc(label)}</span>
          <span class="tc-brand-sub">${esc(sub)}</span>
        </div>
        <div class="tc-brand-badges">
          <span class="tc-badge badge-cat">${esc(catLabel(t.cat))}</span>
          ${genderBadgeHTML(t.gender)}
        </div>
      </div>`;
  }

  tournamentCardHTML = function(t) {
    const urgencyClass = deadlineUrgencyClass(t.entryDeadline);
    const daysLabel    = daysUntilDeadline(t.entryDeadline);
    const dlIcon       = deadlineIcon(urgencyClass);
    const brand        = catBrandConfig(t.cat);
    const hasUrl       = !!bestPrimaryUrl(t);

    return `
      <article
        class="s-tournament-card ${t.cmsTournament || t.source === 'cms' ? 'pnx-cms-tournament-card' : ''}"
        data-id="${esc(t.id)}"
        data-cms-tournament="${t.cmsTournament || t.source === 'cms' ? '1' : '0'}"
        role="button"
        tabindex="0"
        aria-label="${esc(t.name)} 詳細を見る"
      >
        ${brandVisualHTML(t, brand)}

        <div class="tc-info-col">
          <div class="tc-deadline-strip ${urgencyClass}">
            <div class="tc-dl-left">
              <span class="tc-dl-icon">${dlIcon}</span>
              <span class="tc-dl-date ${urgencyClass}">締切 ${esc(fmtDateWithDay(t.entryDeadline))}</span>
            </div>
            <span class="tc-dl-days ${urgencyClass}">${esc(daysLabel)}</span>
          </div>

          <div class="tc-date-bar">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            </svg>
            ${esc(fmtDateWithDay(t.start))} 〜 ${esc(fmtDateWithDay(t.end))}
          </div>

          <h3 class="tc-name">${esc(t.name)}</h3>

          <div class="tc-venue-line">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            ${esc(t.course || '会場未定')}
          </div>

          <div class="tc-info-grid">
            <div class="tc-info-item"><span class="tc-info-label">賞金総額</span><span class="tc-info-value">${esc(t.prize || '—')}</span></div>
            <div class="tc-info-item"><span class="tc-info-label">エントリー費</span><span class="tc-info-value">${esc(t.entryFee || '—')}</span></div>
            <div class="tc-info-item"><span class="tc-info-label">出場資格</span><span class="tc-info-value tc-info-value--wrap">${esc(t.qualification || '—')}</span></div>
            <div class="tc-info-item"><span class="tc-info-label">募集人数</span><span class="tc-info-value">${esc(t.capacity || '—')}</span></div>
          </div>

          <div class="tc-card-footer">
            ${statusPillHTML(t)}
            ${hasUrl ? `<span class="tc-url-pill">URLあり</span>` : ''}
            <button
              class="tc-btn tc-btn-add${t.addedToCalendar ? ' added' : ''}"
              data-id="${esc(t.id)}"
              onclick="event.stopPropagation(); handleCalendarAdd(this.dataset.id)"
              aria-label="カレンダーに追加"
            >
              ${t.addedToCalendar
                ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>追加済み`
                : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>カレンダーに追加`
              }
            </button>
          </div>
        </div>

        <button class="tc-fav-btn${t.favorited ? ' active' : ''}" data-id="${esc(t.id)}" aria-label="${t.favorited ? 'お気に入り解除' : 'お気に入り登録'}" onclick="event.stopPropagation(); toggleFav(this.dataset.id)">
          ${t.favorited
            ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="#FF3B30" stroke="#FF3B30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
            : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
          }
        </button>
      </article>`;
  };

  function urlActionsHTML(t){
    const items = urlItems(t);
    if (!items.length) return '';
    return `<div class="bs-url-actions" aria-label="大会リンク">${items.map(item => `
      <button class="bs-url-action bs-url-${esc(item.key)}" type="button" data-url="${esc(item.url)}" onclick="window.PNXStep206OpenTournamentUrl(this.dataset.url)">
        <span>${esc(item.icon)}</span>${esc(item.label)}
      </button>`).join('')}</div>`;
  }

  renderBottomSheetContent = function(t) {
    const bsBody = document.getElementById('bs-body');
    if (!bsBody) return;
    const headerTitle = document.getElementById('bs-header-title');
    if (headerTitle) headerTitle.textContent = '大会詳細';

    const urgencyClass = deadlineUrgencyClass(t.entryDeadline);
    const daysLabel    = daysUntilDeadline(t.entryDeadline);
    const dlIcon       = deadlineIcon(urgencyClass);
    const brand        = catBrandConfig(t.cat);
    const heroImg      = heroImageUrl(t);
    const logo         = logoUrl(t);
    const deadlineValueClass = urgencyClass === 'deadline-urgent' ? 'urgent' : (urgencyClass === 'deadline-warning' ? 'warning' : '');
    const schedItems = [
      { date: t.entryDeadline,  label: 'エントリー締切', cls: 'date-deadline' },
      { date: t.cancelDeadline, label: 'キャンセル締切', cls: 'date-cancel' },
      { date: t.start,          label: '競技開始', cls: '' },
      { date: t.end,            label: '競技最終日', cls: '' },
    ];

    bsBody.innerHTML = `
      <div class="bs-hero-wrap ${brand.cls} ${heroImg ? 'has-hero-image' : ''} ${logo ? 'has-hero-logo' : ''}">
        ${heroImg ? `<img class="bs-hero-media-img" src="${esc(heroImg)}" alt="${esc(t.imageAlt || t.name || '大会画像')}" loading="lazy">` : ''}
        <div class="bs-img-urgency-badge ${urgencyClass}">${dlIcon} ${esc(daysLabel)}</div>
        <div class="bs-tour-brand">
          ${logo ? `<span class="bs-tour-logo"><img src="${esc(logo)}" alt="${esc(t.name || '大会')} ロゴ" loading="lazy" onerror="this.closest('.bs-tour-logo').remove();"></span>` : ''}
          <span class="bs-tour-brand-label">${esc(compactLabel(t, brand))}</span>
          <span class="bs-tour-brand-sub">${esc(brandSub(t, brand))}</span>
        </div>
        <div class="bs-hero-info">
          <div class="bs-hero-badges"><span class="tc-badge badge-cat">${esc(catLabel(t.cat))}</span>${genderBadgeHTML(t.gender)}${statusBadgeHTML(t)}</div>
          <h2 class="bs-hero-name">${esc(t.name)}</h2>
          <p class="bs-hero-meta">${esc(fmtDateWithDay(t.start))} 〜 ${esc(fmtDateWithDay(t.end))}　📍 ${esc(t.course || '会場未定')}</p>
        </div>
      </div>

      <div class="bs-scroll-content">
        ${urlActionsHTML(t)}

        <div class="bs-deadline-strip ${urgencyClass}">
          <div class="bs-dl-left"><span class="bs-dl-icon">${dlIcon}</span><span class="bs-dl-date ${urgencyClass}">締切 ${esc(fmtDateWithDay(t.entryDeadline))}</span></div>
          <span class="bs-dl-days ${urgencyClass}">${esc(daysLabel)}</span>
        </div>

        <div class="bs-info-card">
          <p class="bs-info-card-title">📅 基本情報</p>
          <div class="bs-card-item"><p class="bs-card-label">開催期間</p><p class="bs-card-value highlight">${esc(fmtDateWithDay(t.start))} 〜 ${esc(fmtDateWithDay(t.end))}</p></div>
          <div class="bs-card-item border-top"><p class="bs-card-label">エントリー締切</p><p class="bs-card-value${deadlineValueClass ? ' ' + deadlineValueClass : ''}">${esc(fmtDateWithDay(t.entryDeadline))}</p></div>
          <div class="bs-card-item border-top"><p class="bs-card-label">会場</p><p class="bs-card-value">${esc(t.course || '会場未定')}</p></div>
          <div class="bs-card-item border-top"><p class="bs-card-label">開催地</p><p class="bs-card-value">${esc(areaLabelFromKey(t.area))}</p></div>
        </div>

        <div class="bs-info-card">
          <p class="bs-info-card-title">🏆 賞金情報</p>
          <div class="bs-info-card-grid"><div class="bs-card-item"><p class="bs-card-label">賞金総額</p><p class="bs-card-value highlight">${esc(t.prize || '—')}</p></div><div class="bs-card-item"><p class="bs-card-label">優勝賞金</p><p class="bs-card-value highlight">${esc(t.prizeWinner || '—')}</p></div></div>
        </div>

        <div class="bs-info-card">
          <p class="bs-info-card-title">💴 費用情報</p>
          <div class="bs-info-card-grid"><div class="bs-card-item"><p class="bs-card-label">エントリー費</p><p class="bs-card-value">${esc(t.entryFee || '—')}</p></div><div class="bs-card-item"><p class="bs-card-label">プレーフィー</p><p class="bs-card-value">${esc(t.practiceRoundFee || '—')}</p></div></div>
        </div>

        <div class="bs-info-card">
          <p class="bs-info-card-title">📋 出場条件</p>
          <div class="bs-card-item"><p class="bs-card-label">出場資格</p><p class="bs-card-value sm">${esc(t.qualification || '—')}</p></div>
          <div class="bs-card-item border-top"><p class="bs-card-label">募集人数</p><p class="bs-card-value">${esc(t.capacity || '—')}</p></div>
        </div>

        <div class="bs-info-card">
          <p class="bs-info-card-title">🏢 運営情報</p>
          <div class="bs-card-item"><p class="bs-card-label">主催</p><p class="bs-card-value sm">${esc(t.organizer || '—')}</p></div>
          <div class="bs-card-item border-top"><p class="bs-card-label">申込方法</p><p class="bs-card-value sm">${esc(t.entryMethod || 'CMS登録情報を確認')}</p></div>
        </div>

        <p class="bs-section-title">スケジュール</p>
        <div class="bs-info-card">${schedItems.map(item => `<div class="bs-schedule-item"><span class="bs-sched-date${item.cls ? ' ' + item.cls : ''}">${esc(fmtDateWithDay(item.date))}</span><span class="bs-sched-label">${esc(item.label)}</span></div>`).join('')}</div>
        <div style="height:6px;"></div>
      </div>`;

    bsBody.scrollTop = 0;
    _syncBSAddBtn(t);
    _syncBSFavBtn(t);
    bindFooterUrlButton();
    updateFooterUrlButton(t);

    const bsFavBtn = document.getElementById('bs-fav-btn');
    if (bsFavBtn) {
      const newHandler = () => toggleFav(t.id);
      bsFavBtn.replaceWith(bsFavBtn.cloneNode(true));
      const freshBtn = document.getElementById('bs-fav-btn');
      _syncBSFavBtn(t);
      if (freshBtn) freshBtn.addEventListener('click', newHandler);
    }
  };

  function selectedTournament(){
    const id = APP_STATE && APP_STATE.selectedTournamentId;
    return (Array.isArray(DUMMY_TOURNAMENTS) ? DUMMY_TOURNAMENTS : []).find(x => x && x.id === id);
  }
  function footerLabel(t){
    if (safeUrl(t && (t.entryUrl || t.applyUrl || t.applicationUrl))) return '申込';
    if (safeUrl(t && (t.officialUrl || t.homepage || t.website || t.url))) return '公式';
    if (safeUrl(t && (t.instagramUrl || t.instagram))) return 'Instagram';
    return 'URLなし';
  }
  function bindFooterUrlButton(){
    const btn = document.getElementById('bs-cta-detail');
    if (!btn || btn.dataset.step206Bound === '1') return;
    const clone = btn.cloneNode(true);
    clone.dataset.step206Bound = '1';
    btn.replaceWith(clone);
    clone.addEventListener('click', function(){
      const t = selectedTournament();
      const url = bestPrimaryUrl(t);
      if (!url) {
        showToast('この大会にはURLが登録されていません');
        return;
      }
      window.PNXStep206OpenTournamentUrl(url);
    });
  }
  function updateFooterUrlButton(t){
    const btn = document.getElementById('bs-cta-detail');
    if (!btn) return;
    const url = bestPrimaryUrl(t);
    btn.classList.toggle('is-disabled', !url);
    btn.disabled = !url;
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>${esc(footerLabel(t))}`;
  }

  window.PNXStep206OpenTournamentUrl = function(url){
    const u = safeUrl(url);
    if (!u) return false;
    try { window.open(u, '_blank', 'noopener,noreferrer'); return true; }
    catch(e) { location.href = u; return true; }
  };

  // buildCalendarAddPayload をSTEP206版へ差し替え（URL/画像/ロゴを親カレンダーへ渡す）
  buildCalendarAddPayload = function(t) {
    if (!t) return null;
    return {
      type: 'PNX_ADD_TOURNAMENT_TO_CALENDAR',
      source: 'search-module',
      step: '206',
      at: new Date().toISOString(),
      tournament: {
        id: t.id, name: t.name, title: t.title || t.name,
        start: t.start, end: t.end || t.start,
        course: t.course || '', venue: t.venue || t.course || '', prefecture: t.prefecture || '', area: t.area || '',
        organizer: t.organizer || '', cat: t.cat || '', gender: t.gender || '', region: t.region || '',
        prize: t.prize || '', prizeWinner: t.prizeWinner || '', entryDeadline: t.entryDeadline || '', cancelDeadline: t.cancelDeadline || '',
        entryFee: t.entryFee || '', practiceRoundFee: t.practiceRoundFee || '', qualification: t.qualification || '', capacity: t.capacity || '',
        entryMethod: t.entryMethod || '', status: t.status || '', memo: t.memo || t.note || '',
        officialUrl: t.officialUrl || t.url || '', entryUrl: t.entryUrl || '', instagramUrl: t.instagramUrl || '', url: t.url || t.officialUrl || '',
        tournamentLogoUrl: t.tournamentLogoUrl || t.logoUrl || '', organizerLogoUrl: t.organizerLogoUrl || '', logoUrl: t.logoUrl || t.tournamentLogoUrl || t.organizerLogoUrl || '',
        venueImageUrl: t.venueImageUrl || t.imageUrl || '', imageUrl: t.imageUrl || t.venueImageUrl || '', imageAlt: t.imageAlt || '',
        tags: Array.isArray(t.tags) ? t.tags.slice() : []
      }
    };
  };

  bindFooterUrlButton();
  // 初回描画済みの場合はロゴ/URL対応HTMLで再描画
  setTimeout(function(){ try { applyFiltersAndRender(); } catch(e) {} }, 0);

  window.PNXStep206VisualUrlStatus = function(){
    return {
      step:206,
      cards:document.querySelectorAll('.s-tournament-card').length,
      logoCards:document.querySelectorAll('.tc-brand-col.has-logo').length,
      urlPills:document.querySelectorAll('.tc-url-pill').length,
      selected:APP_STATE && APP_STATE.selectedTournamentId || null
    };
  };
})();
