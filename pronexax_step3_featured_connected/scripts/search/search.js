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

    console.log(
      `[ProNexaX] 💾 状態を復元 (保存時刻: ${saved._savedAt || '—'})`,
      getStateSnapshot()
    );
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
  const brand        = catBrandConfig(t.cat);

  return `
    <article
      class="s-tournament-card"
      data-id="${t.id}"
      role="button"
      tabindex="0"
      aria-label="${t.name} 詳細を見る"
    >
      <!-- ── ブランドカラム（左） ── -->
      <div class="tc-brand-col ${brand.cls}">
        <div class="tc-brand-inner">
          <span class="tc-brand-abbr">${brand.label}</span>
          <span class="tc-brand-sub">${brand.sub}</span>
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
function _buildFilteredResult() {
  let result = [...DUMMY_TOURNAMENTS];

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

/**
 * カレンダーに追加する
 * ─ 追加済み（isAdded(id) === true）なら何もしない。
 * ─ setAdded() → カードボタン更新 → BS フッター更新 → トースト表示。
 *
 * STEP2: Firestore にカレンダーイベントを書き込む場合は下記に追加:
 *   db.collection('users').doc(userId).collection('calendar')
 *     .doc(id).set({ added: true, addedAt: serverTimestamp() })
 *   CalendarKit / Capacitor Calendar Plugin への連携もここで行う。
 */
function handleCalendarAdd(id) {
  const t = DUMMY_TOURNAMENTS.find(x => x.id === id);
  if (!t || isAdded(id)) return;  // 追加済みなら何もしない

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
function init() {
  const restored = loadStateFromLocalStorage();

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
