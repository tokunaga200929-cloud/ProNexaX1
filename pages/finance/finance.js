

/* ================================================================
   STEP107: Finance iframe self-throttle
   親からの要求以外で大会データ要求を連発しない
   ================================================================ */
(function(){
  if (window.__PNX_STEP107_FINANCE_SELF_THROTTLE__) return;
  window.__PNX_STEP107_FINANCE_SELF_THROTTLE__ = true;

  let lastRequestAt = 0;

  window.PNXFinanceSafeRequestTournaments = function(force){
    const now = Date.now();
    if (!force && now - lastRequestAt < 10000) return false;
    lastRequestAt = now;

    try {
      window.parent.postMessage({
        type:"PNX_REQUEST_TOURNAMENTS_FOR_FINANCE",
        source:"step107-finance-self"
      }, "*");
      return true;
    } catch(e) {
      return false;
    }
  };
})();



/* ================================================================
   STEP102: Finance request storm guard
   収支iframeが裏で大会データを何度も要求/ログ出力する問題を抑制
   ================================================================ */
(function(){
  if (window.__PNX_STEP102_FINANCE_REQUEST_GUARD__) return;
  window.__PNX_STEP102_FINANCE_REQUEST_GUARD__ = true;

  let lastRequestAt = 0;
  let lastTournamentSignature = "";

  function signature(list){
    return (Array.isArray(list) ? list : []).map(t => [
      t.id || t.tournamentId || "",
      t.title || t.name || "",
      t.startDate || t.start || t.date || "",
      t.venue || t.course || ""
    ].join(":")).join("|");
  }

  window.PNXFinanceSafeRequestTournaments = function(force){
    const now = Date.now();
    if (!force && now - lastRequestAt < 6000) return false;
    lastRequestAt = now;

    try {
      window.parent.postMessage({ type:"PNX_REQUEST_TOURNAMENTS_FOR_FINANCE", source:"step102-finance-safe" }, "*");
      return true;
    } catch(e) {
      return false;
    }
  };

  window.PNXFinanceAcceptTournamentsStable = function(payload){
    const list = Array.isArray(payload) ? payload : [];
    const sig = signature(list);

    if (sig === lastTournamentSignature) {
      return false;
    }

    lastTournamentSignature = sig;
    window.PNXFinanceTournaments = list;
    return true;
  };

  // Reduce console noise from old finance modules while keeping other logs.
  const originalInfo = console.info;
  console.info = function(){
    try {
      const first = String(arguments[0] || "");
      if (first.includes("[PNX Finance] tournaments updated")) return;
    } catch(e) {}
    return originalInfo.apply(console, arguments);
  };
})();

/**
 * ProNexaX — Finance Module  v4
 * ファイル: finance.js
 * 役割: 収支機能のインタラクション・グラフ・ダミーデータ管理
 *
 * 統合メモ:
 *   - グローバル汚染を避けるため IIFE でラップ
 *   - 外部から呼び出す場合は window.PNXFinance として公開
 *   - ProNexaX 本体の既存 JS とは干渉しない設計
 */

(function () {
  'use strict';

  /* ============================================================
     ダミーデータ
     ============================================================ */

  /** 月別データ（2024年1〜12月） */
  const MONTHLY_DATA = [
    { month: '1月',  income: 380000, expense: 210000 },
    { month: '2月',  income: 420000, expense: 195000 },
    { month: '3月',  income: 510000, expense: 280000 },
    { month: '4月',  income: 480000, expense: 260000 },
    { month: '5月',  income: 563000, expense: 314500 },
    { month: '6月',  income: 620000, expense: 320000 },
    { month: '7月',  income: 590000, expense: 298000 },
    { month: '8月',  income: 440000, expense: 240000 },
    { month: '9月',  income: 510000, expense: 270000 },
    { month: '10月', income: 680000, expense: 350000 },
    { month: '11月', income: 595000, expense: 310000 },
    { month: '12月', income: 500000, expense: 282000 },
  ];

  /** 支出内訳（ドーナツグラフ用） — カラーパレット */
  const EXPENSE_BREAKDOWN = [
    { name: '交通費',        value: 28.5, color: '#2563EB' },
    { name: '宿泊費',        value: 21.4, color: '#F59E0B' },
    { name: 'エントリー費',  value: 17.2, color: '#7C3AED' },
    { name: '練習・ラウンド', value: 13.3, color: '#22C55E' },
    { name: 'キャディ代',    value: 9.8,  color: '#0891B2' },
    { name: 'その他',        value: 9.8,  color: '#9CA3AF' },
  ];

  /** 取引ダミーデータ */
  const ALL_TRANSACTIONS = [
    {
      id: 1, date: '2024-05-20', type: 'expense',
      name: '交通費（新幹線）', meta: '東京 → 大阪 / 日本プロゴルフ選手権',
      amount: 14320, category: '交通費', tournament: '日本プロゴルフ選手権'
    },
    {
      id: 2, date: '2024-05-19', type: 'expense',
      name: '宿泊費', meta: '大阪市内ホテル / 日本プロゴルフ選手権',
      amount: 12800, category: '宿泊費', tournament: '日本プロゴルフ選手権'
    },
    {
      id: 3, date: '2024-05-18', type: 'expense',
      name: 'エントリー費', meta: 'ABCカントリークラブ / ABCオープン',
      amount: 22000, category: 'エントリー費', tournament: 'ABCオープン'
    },
    {
      id: 4, date: '2024-05-17', type: 'expense',
      name: 'キャディ代', meta: 'トーナメント / ABCオープン',
      amount: 10000, category: 'キャディ代', tournament: 'ABCオープン'
    },
    {
      id: 5, date: '2024-05-15', type: 'income',
      name: '賞金', meta: 'ABCオープン 最終結果',
      amount: 320000, category: '賞金', tournament: 'ABCオープン'
    },
    {
      id: 6, date: '2024-05-12', type: 'expense',
      name: '練習場代', meta: '週間練習 / レギュラーコース',
      amount: 8500, category: '練習場代', tournament: null
    },
    {
      id: 7, date: '2024-05-10', type: 'income',
      name: 'スポンサー料', meta: '◯◯スポーツ 月次契約',
      amount: 150000, category: 'スポンサー料', tournament: null
    },
    {
      id: 8, date: '2024-05-08', type: 'expense',
      name: 'ラウンド代', meta: '関東オープン予選ラウンド',
      amount: 18000, category: 'ラウンド代', tournament: '関東オープン'
    },
    {
      id: 9, date: '2024-05-05', type: 'expense',
      name: '交通費（新幹線）', meta: '大阪 → 東京 帰路',
      amount: 14320, category: '交通費', tournament: null
    },
    {
      id: 10, date: '2024-04-28', type: 'income',
      name: '賞金', meta: '関東プロ選手権',
      amount: 280000, category: '賞金', tournament: '関東プロ選手権'
    },
    {
      id: 11, date: '2024-04-22', type: 'expense',
      name: '宿泊費', meta: 'ゴルフ場隣接ホテル / 関東プロ選手権',
      amount: 15600, category: '宿泊費', tournament: '関東プロ選手権'
    },
    {
      id: 12, date: '2024-04-20', type: 'expense',
      name: 'エントリー費', meta: '関東プロ選手権',
      amount: 20000, category: 'エントリー費', tournament: '関東プロ選手権'
    },
    {
      id: 13, date: '2024-04-15', type: 'income',
      name: 'スポンサー料', meta: '◯◯スポーツ 月次契約',
      amount: 150000, category: 'スポンサー料', tournament: null
    },
    {
      id: 14, date: '2024-04-10', type: 'expense',
      name: 'キャディ代', meta: '関東プロ選手権',
      amount: 10000, category: 'キャディ代', tournament: '関東プロ選手権'
    },
    {
      id: 15, date: '2024-04-08', type: 'expense',
      name: '交通費（電車）', meta: '練習ラウンド移動',
      amount: 3240, category: '交通費', tournament: null
    },
  ];



  /* ============================================================
     STEP138g: saved tournament transactions -> main finance list
     大会連携シートで保存した PNX_FINANCE_TRANSACTIONS を
     概要/取引タブ本体の一覧・集計にも反映する。
     ============================================================ */

  function pnxStep138gReadSavedTransactions() {
    try {
      const list = JSON.parse(localStorage.getItem('PNX_FINANCE_TRANSACTIONS') || '[]');
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function pnxStep138gCategoryLabel(cat, type) {
    const map = {
      entryFee: 'エントリー費',
      transport: '交通費',
      hotel: '宿泊費',
      meal: '食費',
      practice: '練習場代',
      other: 'その他',
      prize: '賞金',
      sponsor: 'スポンサー料',
      lesson: 'レッスン料'
    };
    if (map[cat]) return map[cat];
    if (type === 'income' && !cat) return '収入';
    return cat || 'その他';
  }

  function pnxStep138gTxName(tx) {
    const cat = pnxStep138gCategoryLabel(tx.category, tx.type);
    if (tx.type === 'income') {
      if (cat === '賞金' || tx.category === 'prize') return '賞金';
      if (cat === 'スポンサー料' || tx.category === 'sponsor') return 'スポンサー料';
      return cat || '収入';
    }
    if (cat === 'エントリー費' || tx.category === 'entryFee') return 'エントリー費';
    return cat || '支出';
  }

  function pnxStep138gNormalizeSavedTx(tx, index) {
    const date = tx.date || new Date().toISOString().slice(0,10);
    const tournament = tx.tournamentTitle || tx.tournament || '';
    const memo = tx.memo || '';
    const category = pnxStep138gCategoryLabel(tx.category, tx.type);
    return {
      id: tx.id || ('saved_' + index + '_' + date),
      date,
      type: tx.type === 'income' ? 'income' : 'expense',
      name: tx.name || pnxStep138gTxName(tx),
      meta: tournament
        ? `${memo || category} / ${tournament}`
        : (memo || tx.meta || category),
      amount: Number(tx.amount || 0),
      category,
      tournament: tournament || null,
      tournamentId: tx.tournamentId || null,
      source: tx.source || 'tournament',
      savedTx: true
    };
  }

  function pnxStep138gAllTransactions() {
    const saved = pnxStep138gReadSavedTransactions()
      .filter(tx => tx && tx.id && Number(tx.amount || 0) > 0)
      .map(pnxStep138gNormalizeSavedTx);

    const existingKeys = new Set(ALL_TRANSACTIONS.map(tx => String(tx.id)));
    const uniqueSaved = saved.filter(tx => tx.id && !existingKeys.has(String(tx.id)));

    const merged = [...uniqueSaved, ...ALL_TRANSACTIONS];

    // ID重複を防ぎ、日付順で安定表示
    const map = new Map();
    merged.forEach(tx => {
      if (!tx || !tx.id) return;
      map.set(String(tx.id), tx);
    });

    return Array.from(map.values()).sort((a,b) => {
      const date = String(b.date || '').localeCompare(String(a.date || ''));
      if (date !== 0) return date;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
  }

  window.PNXStep138gGetAllFinanceTransactions = pnxStep138gAllTransactions;


  /* ============================================================
     状態管理
     ============================================================ */
  let state = {
    currentTab:     'overview',
    currentMonth:   new Date(new Date().getFullYear(), new Date().getMonth(), 1),   // STEP138g: 現在月
    currentYear:    new Date().getFullYear(),
    activeCat:      'all',
    searchQuery:    '',
    selectedType:   'expense',
    selectedCat:    null,
    chartsInited:   false,
    monthlyChart:   null,
    donutChart:     null,
    progressInited: false,
  };


  /* ============================================================
     ユーティリティ
     ============================================================ */

  const fmt = {
    /** ¥1,234,567 形式 */
    yen: (n) => '¥' + Math.abs(n).toLocaleString('ja-JP'),

    /** YYYY-MM-DD → 日 (曜) */
    day:  (str) => {
      const d = new Date(str + 'T00:00:00');
      return d.getDate();
    },
    week: (str) => {
      const d = new Date(str + 'T00:00:00');
      return ['日','月','火','水','木','金','土'][d.getDay()];
    },

    /** YYYY-MM → 2024年5月 */
    monthLabel: (d) => `${d.getFullYear()}年${d.getMonth()+1}月`,

    /** YYYY-MM → 5/1〜5/31 */
    monthRange: (d) => {
      const y = d.getFullYear(), m = d.getMonth();
      const last = new Date(y, m + 1, 0).getDate();
      return `${m+1}/1 〜 ${m+1}/${last}`;
    },
  };

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function getElement(id) { return document.getElementById(id); }

  /** カテゴリ → CSS バッジクラス */
  function catBadgeClass(cat) {
    const map = {
      '交通費':      'badge-transport',
      '宿泊費':      'badge-hotel',
      'エントリー費': 'badge-entry',
      '練習場代':    'badge-practice',
      'ラウンド代':  'badge-round',
      'キャディ代':  'badge-caddy',
      '賞金':        'badge-prize',
      'スポンサー料': 'badge-sponsor',
    };
    return map[cat] || 'badge-other';
  }


  /* ============================================================
     タブ切り替え — v4 .fin-tab / .fin-panel
     ============================================================ */

  function initTabs() {
    const tabs = document.querySelectorAll('.fin-tab');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        if (target === state.currentTab) return;

        // ── タブボタン状態 ──
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        // ── パネル切り替え ──
        document.querySelectorAll('.fin-panel').forEach(p => p.classList.remove('active'));
        const panel = getElement(`tab-${target}`);
        if (panel) panel.classList.add('active');

        state.currentTab = target;

        // ── 追加ボタン表示制御 ──
        const addBtn = getElement('btn-add-tx');
        if (addBtn) {
          addBtn.style.display =
            (target === 'overview' || target === 'transactions') ? 'flex' : 'none';
        }

        // ── 遅延初期化 ──
        if (target === 'analysis' && !state.chartsInited) {
          setTimeout(initCharts, 120);
        }
        if (target === 'filing' && !state.progressInited) {
          setTimeout(initFilingProgress, 300);
        }
      });
    });
  }


  /* ============================================================
     ① 概要タブ
     ============================================================ */

  /**
   * 取引を 3列グリッド (.tx-row) でレンダリング
   * 日付列 | コンテンツ列 | 金額+バッジ列
   */
  function buildTxRow(tx) {
    const isIncome  = tx.type === 'income';
    const sign      = isIncome ? '+' : '−';
    const amtClass  = isIncome ? 'income' : 'expense';
    const badgeCls  = catBadgeClass(tx.category);

    return `
      <div class="tx-row" data-id="${tx.id}">
        <div class="tx-date-col">
          <div class="tx-date-day">${fmt.day(tx.date)}</div>
          <div class="tx-date-week">${fmt.week(tx.date)}</div>
        </div>
        <div class="tx-content">
          <div class="tx-name">${tx.name}</div>
          <div class="tx-sub">${tx.meta}</div>
        </div>
        <div class="tx-right-col">
          <div class="tx-amount ${amtClass}">${sign}${fmt.yen(tx.amount)}</div>
          <div class="tx-badge-wrap">
            <span class="cat-badge ${badgeCls}">${tx.category}</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderOverviewTx() {
    const container = getElement('overview-tx-list');
    if (!container) return;

    const ym = `${state.currentMonth.getFullYear()}-${String(state.currentMonth.getMonth()+1).padStart(2,'0')}`;
    const filtered = pnxStep138gAllTransactions()
      .filter(tx => tx.date.startsWith(ym))
      .slice(0, 5);

    container.innerHTML = filtered.map(tx => buildTxRow(tx)).join('');
  }

  function updateOverviewSummary() {
    const ym = `${state.currentMonth.getFullYear()}-${String(state.currentMonth.getMonth()+1).padStart(2,'0')}`;
    const txs = pnxStep138gAllTransactions().filter(tx => tx.date.startsWith(ym));

    const income  = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const profit  = income - expense;
    const margin  = income > 0 ? Math.round((profit / income) * 100) : 0;

    const el = (id) => getElement(id);
    if (el('overview-income'))  el('overview-income').textContent  = fmt.yen(income);
    if (el('overview-expense')) el('overview-expense').textContent = fmt.yen(expense);
    if (el('overview-profit'))  el('overview-profit').textContent  = fmt.yen(profit);
    if (el('overview-margin'))  el('overview-margin').textContent  = '利益率';

    const bar = el('profit-bar');
    if (bar) bar.style.width = clamp(margin, 0, 100) + '%';

    const ratio = el('profit-ratio');
    if (ratio) ratio.textContent = `${margin}%`;

    if (el('month-label')) el('month-label').textContent = fmt.monthLabel(state.currentMonth);
    if (el('month-sub'))   el('month-sub').textContent   = fmt.monthRange(state.currentMonth);
  }

  function initMonthNav() {
    const btnPrev = getElement('btn-prev-month');
    const btnNext = getElement('btn-next-month');

    btnPrev && btnPrev.addEventListener('click', () => {
      state.currentMonth = new Date(
        state.currentMonth.getFullYear(),
        state.currentMonth.getMonth() - 1,
        1
      );
      updateOverviewSummary();
      renderOverviewTx();
    });

    btnNext && btnNext.addEventListener('click', () => {
      const next = new Date(
        state.currentMonth.getFullYear(),
        state.currentMonth.getMonth() + 1,
        1
      );
      if (next > new Date()) return;
      state.currentMonth = next;
      updateOverviewSummary();
      renderOverviewTx();
    });

    // 「すべて表示」→ 取引タブへ
    const linkAll = getElement('link-all-tx');
    linkAll && linkAll.addEventListener('click', () => {
      document.querySelector('.fin-tab[data-tab="transactions"]')?.click();
    });
  }


  /* ============================================================
     ② 取引タブ
     ============================================================ */

  function renderTransactions() {
    const container = getElement('tx-groups-container');
    if (!container) return;

    let filtered = [...pnxStep138gAllTransactions()];

    if (state.activeCat !== 'all') {
      filtered = filtered.filter(tx => tx.category === state.activeCat);
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.name.toLowerCase().includes(q) ||
        tx.meta.toLowerCase().includes(q) ||
        (tx.tournament || '').toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:48px 20px; color:var(--t3);">
          <div style="font-size:40px; margin-bottom:12px;">🔍</div>
          <div style="font-size:15px; font-weight:500; color:var(--t2);">取引が見つかりません</div>
          <div style="font-size:13px; margin-top:4px;">検索条件を変更してみてください</div>
        </div>
      `;
      return;
    }

    // 月ごとにグループ化
    const groups = {};
    filtered.forEach(tx => {
      const key = tx.date.substring(0, 7);
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    container.innerHTML = sortedKeys.map(key => {
      const txs = groups[key];
      const [y, m] = key.split('-');
      const label = `${y}年${parseInt(m)}月`;

      const monthIncome  = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const monthExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      return `
        <div class="tx-group">
          <div class="tx-group-hd">
            <span class="tx-group-month">${label}</span>
            <span class="tx-group-summary">
              <span class="inc">+${fmt.yen(monthIncome)}</span>
              　<span class="exp">−${fmt.yen(monthExpense)}</span>
            </span>
          </div>
          <div class="tx-card">
            ${txs.map(tx => buildTxRow(tx)).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  function initTransactionFilters() {
    // チップ絞り込み
    const chips = document.querySelectorAll('#chips-scroll .chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.activeCat = chip.dataset.cat;
        renderTransactions();
      });
    });

    // 検索（デバウンス）
    const searchInput = getElement('tx-search');
    if (searchInput) {
      let timer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          state.searchQuery = e.target.value.trim();
          renderTransactions();
        }, 200);
      });
    }
  }


  /* ============================================================
     ③ 分析タブ — Chart.js グラフ
     ============================================================ */

  function initCharts() {
    if (state.chartsInited) return;
    if (typeof Chart === 'undefined') {
      setTimeout(initCharts, 200);
      return;
    }
    state.chartsInited = true;

    Chart.defaults.font.family =
      "-apple-system, BlinkMacSystemFont, 'Hiragino Sans', sans-serif";
    Chart.defaults.color = '#6B7280';

    initMonthlyChart();
    initDonutChart();
    initYearNav();
  }

  function initMonthlyChart() {
    const canvas = getElement('chart-monthly');
    if (!canvas) return;

    state.monthlyChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: MONTHLY_DATA.map(d => d.month),
        datasets: [
          {
            label: '収入',
            data: MONTHLY_DATA.map(d => d.income),
            backgroundColor: 'rgba(37, 99, 235, 0.72)',   // blue
            borderRadius: 4,
            borderSkipped: false,
            barPercentage: 0.65,
            categoryPercentage: 0.80,
          },
          {
            label: '支出',
            data: MONTHLY_DATA.map(d => d.expense),
            backgroundColor: 'rgba(0, 0, 0, 0.10)',        // light gray
            borderRadius: 4,
            borderSkipped: false,
            barPercentage: 0.65,
            categoryPercentage: 0.80,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.88)',
            titleColor: '#FFFFFF',
            bodyColor: 'rgba(209,213,219,0.9)',
            cornerRadius: 10,
            padding: 10,
            callbacks: {
              label: (ctx) => `  ${ctx.dataset.label}: ¥${ctx.raw.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { font: { size: 10 }, color: 'rgba(107,114,128,0.7)' }
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.05)', lineWidth: 0.5 },
            border: { display: false, dash: [2, 2] },
            ticks: {
              font: { size: 10 }, color: 'rgba(107,114,128,0.7)',
              callback: (v) => v >= 1000 ? (v / 10000).toFixed(0) + '万' : v
            }
          }
        }
      }
    });
  }

  function initDonutChart() {
    const canvas = getElement('chart-donut');
    if (!canvas) return;

    const data = EXPENSE_BREAKDOWN;

    state.donutChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.name),
        datasets: [{
          data: data.map(d => d.value),
          backgroundColor: data.map(d => d.color),
          borderWidth: 2,
          borderColor: '#FFFFFF',
          hoverOffset: 4,
          borderRadius: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '66%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.88)',
            titleColor: '#fff',
            bodyColor: 'rgba(209,213,219,0.9)',
            cornerRadius: 10,
            padding: 10,
            callbacks: {
              label: (ctx) => `  ${ctx.label}: ${ctx.raw}%`
            }
          }
        }
      }
    });

    // カスタム凡例
    const legendEl = getElement('donut-legend');
    if (legendEl) {
      legendEl.innerHTML = data.map(d => `
        <div class="legend-item">
          <div class="legend-left">
            <span class="legend-dot" style="background:${d.color};"></span>
            <span class="legend-name">${d.name}</span>
          </div>
          <span class="legend-percent">${d.value}%</span>
        </div>
      `).join('');
    }
  }

  function initYearNav() {
    const btnPrev = getElement('btn-prev-year');
    const btnNext = getElement('btn-next-year');
    const label   = getElement('year-label');

    btnPrev && btnPrev.addEventListener('click', () => {
      state.currentYear--;
      if (label) label.textContent = `${state.currentYear}年`;
    });

    btnNext && btnNext.addEventListener('click', () => {
      if (state.currentYear >= new Date().getFullYear()) return;
      state.currentYear++;
      if (label) label.textContent = `${state.currentYear}年`;
    });
  }


  /* ============================================================
     ④ 申告タブ — 円形プログレス (ring)
     ============================================================ */

  function initFilingProgress() {
    if (state.progressInited) return;
    state.progressInited = true;

    const PROGRESS = 78; // %

    // ring-fill: r=46（新レイアウト）
    const r = 46;
    const circumference = 2 * Math.PI * r;

    const ringFill = getElement('ring-fill');
    const ringNum  = document.querySelector('#ring-label .ring-num');

    if (ringFill) {
      ringFill.style.strokeDasharray  = circumference;
      ringFill.style.strokeDashoffset = circumference;

      setTimeout(() => {
        const offset = circumference - (PROGRESS / 100) * circumference;
        ringFill.style.strokeDashoffset = offset;
      }, 250);
    }

    if (ringNum) ringNum.textContent = PROGRESS;
  }


  /* ============================================================
     入力モーダル
     ============================================================ */

  function initModal() {
    const overlay   = getElement('add-modal');
    const openBtn   = getElement('btn-add-tx');
    const closeBtn  = getElement('modal-close-btn');
    const saveBtn   = getElement('modal-save-btn');
    const dateInput = getElement('modal-date');

    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    openBtn  && openBtn.addEventListener('click', openModal);
    closeBtn && closeBtn.addEventListener('click', closeModal);
    overlay  && overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    // 収入 / 支出 切り替え
    const typeBtns = document.querySelectorAll('#add-modal .type-btn');
    typeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        typeBtns.forEach(b => b.classList.remove('active-income', 'active-expense'));
        state.selectedType = btn.dataset.type;
        btn.classList.add(state.selectedType === 'income' ? 'active-income' : 'active-expense');
      });
    });

    // カテゴリ選択
    const catItems = document.querySelectorAll('#cat-grid .cat-grid-item');
    catItems.forEach(item => {
      item.addEventListener('click', () => {
        catItems.forEach(c => c.classList.remove('selected'));
        item.classList.add('selected');
        state.selectedCat = item.dataset.cat;
      });
    });

    saveBtn && saveBtn.addEventListener('click', saveTransaction);
  }

  function openModal() {
    const overlay = getElement('add-modal');
    if (!overlay) return;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // フォームリセット
    const fields = ['modal-amount', 'modal-desc', 'modal-tournament'];
    fields.forEach(id => {
      const el = getElement(id);
      if (el) el.value = '';
    });

    state.selectedType = 'expense';
    state.selectedCat  = null;

    document.querySelectorAll('#add-modal .type-btn').forEach(b =>
      b.classList.remove('active-income', 'active-expense')
    );
    const expBtn = getElement('type-expense');
    if (expBtn) expBtn.classList.add('active-expense');

    document.querySelectorAll('#cat-grid .cat-grid-item').forEach(c =>
      c.classList.remove('selected')
    );

    setTimeout(() => { getElement('modal-amount')?.focus(); }, 350);
  }

  function closeModal() {
    const overlay = getElement('add-modal');
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function saveTransaction() {
    const amount = parseFloat(getElement('modal-amount')?.value || '0');
    const desc   = getElement('modal-desc')?.value.trim() || '';
    const date   = getElement('modal-date')?.value || '';
    const tourn  = getElement('modal-tournament')?.value.trim() || null;

    if (!amount || amount <= 0) { shakeElement(getElement('modal-amount')); return; }
    if (!desc)                   { shakeElement(getElement('modal-desc'));   return; }
    if (!state.selectedCat)      { shakeElement(getElement('cat-grid'));     return; }
    if (!date)                   { shakeElement(getElement('modal-date'));   return; }

    const now = new Date().toISOString();
    const newTx = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(16).slice(2,7),
      date,
      type:       state.selectedType,
      name:       desc,
      memo:       desc,
      meta:       tourn || state.selectedCat,
      amount,
      category:   state.selectedCat,
      tournament: tourn,
      tournamentTitle: tourn || '',
      source:     'manual',
      createdAt:  now,
      updatedAt:  now,
    };

    try {
      const saved = pnxStep138gReadSavedTransactions();
      saved.push(newTx);
      localStorage.setItem('PNX_FINANCE_TRANSACTIONS', JSON.stringify(saved));
      window.parent && window.parent.postMessage({
        type:'PNX_UPSERT_FINANCE_TRANSACTION_STEP139',
        payload:newTx
      }, '*');
    } catch(e) {}

    closeModal();

    updateOverviewSummary();
    renderOverviewTx();
    renderTransactions();

    try {
      window.dispatchEvent(new CustomEvent('pnx:finance:transactions-updated', {
        detail:{ transactions:pnxStep138gReadSavedTransactions(), item:newTx, action:'created' }
      }));
    } catch(e) {}

    showToast(`${state.selectedType === 'income' ? '収入' : '支出'}を追加しました ✓`);
  }

  function shakeElement(el) {
    if (!el) return;
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = 'shake 0.35s ease';
    setTimeout(() => { el.style.animation = ''; }, 400);
  }


  /* ============================================================
     トースト通知
     ============================================================ */

  function showToast(msg) {
    let toast = document.querySelector('.pnx-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'pnx-toast';
      Object.assign(toast.style, {
        position: 'fixed',
        bottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 16px)',
        left: '50%',
        transform: 'translateX(-50%) translateY(20px)',
        background: 'rgba(17,24,39,0.88)',
        color: '#fff',
        padding: '10px 20px',
        borderRadius: '20px',
        fontSize: '13.5px',
        fontWeight: '600',
        whiteSpace: 'nowrap',
        zIndex: '999',
        opacity: '0',
        transition: 'all 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        pointerEvents: 'none',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '0.5px solid rgba(255,255,255,0.1)',
      });
      document.body.appendChild(toast);
    }

    toast.textContent = msg;
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(10px)';
    }, 2200);
  }


  /* ============================================================
     スワイプジェスチャー（タブ切り替え）
     ============================================================ */

  function initSwipeGesture() {
    const panels = document.querySelector('.fin-panels');
    if (!panels) return;

    let startX = 0, startY = 0;

    panels.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    panels.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;

      if (Math.abs(dy) > Math.abs(dx) || Math.abs(dx) < 50) return;

      const TABS = ['overview', 'transactions', 'analysis', 'filing'];
      const idx  = TABS.indexOf(state.currentTab);

      if (dx < 0 && idx < TABS.length - 1) {
        document.querySelector(`.fin-tab[data-tab="${TABS[idx+1]}"]`)?.click();
      } else if (dx > 0 && idx > 0) {
        document.querySelector(`.fin-tab[data-tab="${TABS[idx-1]}"]`)?.click();
      }
    }, { passive: true });
  }


  /* ============================================================
     初期化
     ============================================================ */

  /* ============================================================
     申告書類作成フロー — スタックビュー（画面2-6）
     ============================================================ */

  // ナビゲーションスタック
  const filingStack = {
    el:    null,
    stack: [],          // 現在表示中の画面ID配列
    proUnlocked: false, // PRO登録完了フラグ
  };

  const SCREEN_ORDER = ['doc-list', 'pro-landing', 'tax-accountant', 'pro-success'];

  function pushFilingScreen(id) {
    if (!filingStack.el) return;
    if (filingStack.stack.includes(id)) return;

    // 直前の画面に .behind を付ける
    const prev = filingStack.stack[filingStack.stack.length - 1];
    if (prev) {
      const prevEl = document.getElementById('screen-' + prev);
      if (prevEl) {
        prevEl.classList.remove('active');
        prevEl.classList.add('behind');
      }
    }

    filingStack.stack.push(id);

    const screen = document.getElementById('screen-' + id);
    if (screen) {
      // フォーカス用に表示
      screen.classList.remove('behind');
      // スクロールトップ
      const scroller = screen.querySelector('.screen-scroll');
      if (scroller) scroller.scrollTop = 0;
      // 一度フレームを置いてアクティブ
      requestAnimationFrame(() => {
        screen.classList.add('active');
      });
    }

    filingStack.el.setAttribute('data-open', '1');
    document.body.classList.add('filing-flow-open');

    // 成功画面なら演出をトリガ
    if (id === 'pro-success') {
      triggerSuccessAnimation();
    }
  }

  function popFilingScreen() {
    if (filingStack.stack.length === 0) return;
    const id = filingStack.stack.pop();
    const screen = document.getElementById('screen-' + id);
    if (screen) {
      screen.classList.remove('active');
      // behind は別画面のCSSスライドにより不要 → 完全に右へ戻す
    }
    // 前の画面を復元
    const prev = filingStack.stack[filingStack.stack.length - 1];
    if (prev) {
      const prevEl = document.getElementById('screen-' + prev);
      if (prevEl) {
        prevEl.classList.remove('behind');
        prevEl.classList.add('active');
      }
    } else {
      // スタックが空になったらフローを閉じる
      filingStack.el.setAttribute('data-open', '0');
      document.body.classList.remove('filing-flow-open');
    }
  }

  function closeFilingFlow() {
    // 全ての画面を一気に閉じる
    while (filingStack.stack.length > 0) {
      const id = filingStack.stack.pop();
      const el = document.getElementById('screen-' + id);
      if (el) {
        el.classList.remove('active', 'behind');
      }
    }
    filingStack.el.setAttribute('data-open', '0');
    document.body.classList.remove('filing-flow-open');
  }

  function openProModal() {
    const modal = getElement('pro-modal');
    if (!modal) return;
    modal.classList.add('open');
  }
  function closeProModal() {
    const modal = getElement('pro-modal');
    if (!modal) return;
    modal.classList.remove('open');
  }

  function markProUnlocked() {
    filingStack.proUnlocked = true;
    if (filingStack.el) filingStack.el.classList.add('pro-unlocked');
    // 画面2のe-Tax文言を切り替え
    const sub = document.querySelector('#etax-card .etax-card-sub');
    if (sub) sub.textContent = 'e-Taxに連携して、確定申告書を提出できます。';
  }

  function resetPro() {
    // デモ用: 未登録状態に戻す
    filingStack.proUnlocked = false;
    if (filingStack.el) filingStack.el.classList.remove('pro-unlocked');
    const sub = document.querySelector('#etax-card .etax-card-sub');
    if (sub) sub.textContent = 'e-Taxの申請にはPROプランが必要です。';
  }

  function triggerSuccessAnimation() {
    const wrap = getElement('success-check-wrap');
    if (!wrap) return;
    // animation のリプレイ
    wrap.classList.remove('active');
    void wrap.offsetWidth;
    wrap.classList.add('active');

    // 完了画面に入ったら背景タブをハプティック的に切り替え
  }

  function initFilingFlow() {
    filingStack.el = getElement('filing-stack');
    if (!filingStack.el) return;

    // 画面1 →「申告書類を作成する」CTA
    const openBtn = getElement('btn-open-doc-list');
    openBtn && openBtn.addEventListener('click', (e) => {
      e && e.preventDefault && e.preventDefault();
      const stack = document.getElementById('filing-stack');
      if (stack) {
        stack.setAttribute('data-open', '0');
        stack.querySelectorAll('.filing-screen').forEach(s => s.classList.remove('active','behind'));
      }
      document.body.classList.remove('filing-flow-open');
      const docs = document.getElementById('pnx-step144-taxdocs');
      if (docs && docs.scrollIntoView) docs.scrollIntoView({ behavior:'smooth', block:'start' });
    });

    // 戻るボタン（全画面共通）
    filingStack.el.querySelectorAll('[data-nav-back]').forEach(btn => {
      btn.addEventListener('click', () => popFilingScreen());
    });

    // 画面4 / モーダル「あとで」→ フロー全体を閉じる
    filingStack.el.querySelectorAll('[data-nav-close]').forEach(btn => {
      btn.addEventListener('click', () => closeFilingFlow());
    });

    // 画面2: PROバッジ書類タップ → モーダル
    const docCard = getElement('doc-list-card');
    docCard && docCard.addEventListener('click', (e) => {
      const item = e.target.closest('.docs-item');
      if (!item) return;
      const isPro = item.dataset.pro === '1';
      if (isPro && !filingStack.proUnlocked) {
        openProModal();
      } else {
        showToast(`「${item.querySelector('.docs-name').textContent}」を作成中…`);
      }
    });

    // 画面2: e-Taxカードタップ → モーダル（未登録時）
    const etaxCard = getElement('etax-card');
    etaxCard && etaxCard.addEventListener('click', () => {
      if (!filingStack.proUnlocked) {
        openProModal();
      } else {
        showToast('e-Tax連携を準備中…');
      }
    });

    // 画面2: PROプランで利用する
    const proCta = getElement('btn-pro-cta');
    proCta && proCta.addEventListener('click', openProModal);

    // モーダル: 7日間無料で試す → 画面4へ
    const tryFree = getElement('btn-try-free');
    tryFree && tryFree.addEventListener('click', () => {
      closeProModal();
      setTimeout(() => pushFilingScreen('pro-landing'), 180);
    });

    // モーダル: あとで
    const modalLater = getElement('btn-modal-later');
    modalLater && modalLater.addEventListener('click', closeProModal);

    // モーダル背景タップ
    const modal = getElement('pro-modal');
    modal && modal.addEventListener('click', (e) => {
      if (e.target === modal) closeProModal();
    });

    // 画面4: プランを選択する → 画面5
    const selPlan = getElement('btn-select-plan');
    selPlan && selPlan.addEventListener('click', () => pushFilingScreen('tax-accountant'));

    // 画面5: 機能を使い始める → 画面6
    const startPro = getElement('btn-start-pro');
    startPro && startPro.addEventListener('click', () => {
      markProUnlocked();
      pushFilingScreen('pro-success');
    });

    // 画面6: 機能を使い始める → 申告タブへ
    const finishPro = getElement('btn-finish-pro');
    finishPro && finishPro.addEventListener('click', () => {
      closeFilingFlow();
      // やや遅れてトースト
      setTimeout(() => showToast('PRO機能が利用可能になりました ✓'), 240);
      // 準備率を上げる演出（オプション）
      bumpFilingProgress();
    });
  }

  function bumpFilingProgress() {
    // PRO登録完了で申告準備率を 78 → 95 にバンプアップ（デモ）
    const ringFill = getElement('ring-fill');
    const num = document.querySelector('#ring-label .ring-num');
    if (!ringFill) return;
    const r = 46;
    const circ = 2 * Math.PI * r;
    const target = 95;
    setTimeout(() => {
      ringFill.style.strokeDashoffset = circ - (target / 100) * circ;
      if (num) {
        let cur = 78;
        const tick = () => {
          cur += 1;
          if (num) num.textContent = cur;
          if (cur < target) setTimeout(tick, 28);
        };
        tick();
      }
    }, 300);
  }


  function init() {
    initTabs();
    initMonthNav();
    updateOverviewSummary();
    renderOverviewTx();
    renderTransactions();
    initTransactionFilters();
    initModal();
    initSwipeGesture();
    initFilingFlow();

    if (state.currentTab === 'analysis') initCharts();
    if (state.currentTab === 'filing')   initFilingProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 外部 API（ProNexaX 本体から呼び出せる）

  window.addEventListener('message', function(event){
    const data = event.data || {};
    if (data.type === 'PNX_FINANCE_TRANSACTION_CREATED') {
      setTimeout(function(){
        updateOverviewSummary();
        renderOverviewTx();
        renderTransactions();
        try { showToast('取引を保存しました'); } catch(e) {}
      }, 80);
    }
  });

  window.addEventListener('storage', function(e){
    if (e.key === 'PNX_FINANCE_TRANSACTIONS') {
      setTimeout(function(){
        updateOverviewSummary();
        renderOverviewTx();
        renderTransactions();
      }, 80);
    }
  });


  window.PNXFinance = {
    openAddModal:  openModal,
    closeAddModal: closeModal,
    refreshData: () => {
      updateOverviewSummary();
      renderOverviewTx();
      renderTransactions();
      try { if (window.PNXStep140RenderTournamentSummary) window.PNXStep140RenderTournamentSummary(); } catch(e) {}
      try { if (window.PNXStep141RenderAnalysisEnhancement) window.PNXStep141RenderAnalysisEnhancement(); } catch(e) {}
      try { if (window.PNXStep142RenderTaxPrep) window.PNXStep142RenderTaxPrep(); } catch(e) {}
      try { if (window.PNXStep144RenderTaxDocuments) window.PNXStep144RenderTaxDocuments(); } catch(e) {}
    },
    showToast,
  };

}());


/* ================================================================
   STEP17: Tournament → Finance Link
   大会リストを収支側で受け取り、将来の大会別収支に使う
   ================================================================ */
(function(){
  if (window.__PNX_STEP17_FINANCE_LINK__) return;
  window.__PNX_STEP17_FINANCE_LINK__ = true;

  window.PNXFinanceTournaments = window.PNXFinanceTournaments || [];

  function request(){
    try {
      window.parent.postMessage({ type: "PNX_REQUEST_TOURNAMENTS_FOR_FINANCE" }, "*");
    } catch(e) {}
  }

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type === "PNX_TOURNAMENTS_FOR_FINANCE_UPDATED") {
      window.PNXFinanceTournaments = Array.isArray(data.payload) ? data.payload : [];
      window.dispatchEvent(new CustomEvent("pnx:finance:tournaments-updated", {
        detail: { tournaments: window.PNXFinanceTournaments }
      }));
      // STEP102: noisy repeated log suppressed
    }

    if (data.type === "PNX_FINANCE_TRANSACTION_CREATED") {
      window.dispatchEvent(new CustomEvent("pnx:finance:transaction-created", {
        detail: { transaction: data.payload }
      }));
    }
  });

  window.PNXFinanceCreateTournamentExpense = function(tournament, amount, category){
    if (!tournament) return null;
    const payload = {
      tournamentId: tournament.id || tournament.tournamentId,
      tournamentTitle: tournament.title || tournament.name || "",
      type: "expense",
      category: category || "entryFee",
      amount: Number(amount || tournament.entryFee || 0),
      date: tournament.startDate || new Date().toISOString().slice(0,10),
      memo: "大会に紐づく支出"
    };
    try {
      window.parent.postMessage({
        type: "PNX_CREATE_TOURNAMENT_FINANCE_TRANSACTION",
        payload
      }, "*");
    } catch(e) {}
    return payload;
  };

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(request, 150);
    setTimeout(request, 700);
  });
  window.addEventListener("load", request);
})();


/* ================================================================
   STEP18: Finance Tournament Expense UI
   大会選択 → 経費入力 → tournamentId付き取引作成
   ================================================================ */
(function(){
  if (window.__PNX_STEP18_FINANCE_EXPENSE_UI__) return;
  window.__PNX_STEP18_FINANCE_EXPENSE_UI__ = true;

  function $(id){ return document.getElementById(id); }

  function today(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function status(message, type){
    const el = $("pnx-fin-expense-status");
    if (!el) return;
    el.textContent = message;
    el.classList.remove("is-success", "is-error");
    if (type) el.classList.add(type === "success" ? "is-success" : "is-error");
  }

  function getSelectedTournament(){
    const select = $("pnx-fin-tournament-select");
    if (!select) return null;
    const id = select.value;
    return (window.PNXFinanceTournaments || []).find(t => (t.id || t.tournamentId) === id) || null;
  }

  function renderTournamentOptions(){
    const select = $("pnx-fin-tournament-select");
    if (!select) return;

    const current = select.value;
    const tournaments = Array.isArray(window.PNXFinanceTournaments) ? window.PNXFinanceTournaments : [];

    select.innerHTML = '<option value="">大会を選択</option>' + tournaments.map(t => {
      const id = t.id || t.tournamentId || "";
      const title = t.title || t.name || "大会";
      const date = t.startDate || t.date || "";
      return `<option value="${id}">${title}${date ? "（" + date + "）" : ""}</option>`;
    }).join("");

    if (current && tournaments.some(t => (t.id || t.tournamentId) === current)) {
      select.value = current;
    }

    status(tournaments.length ? `${tournaments.length}件の大会を読み込みました` : "大会がまだありません");
  }

  function requestTournaments(){
    if (window.PNXFinanceSafeRequestTournaments) window.PNXFinanceSafeRequestTournaments(false);
    else { try { window.parent.postMessage({ type: "PNX_REQUEST_TOURNAMENTS_FOR_FINANCE" }, "*"); } catch(e) {} }
    setTimeout(renderTournamentOptions, 250);
  }

  function saveExpense(){
    const tournament = getSelectedTournament();
    if (!tournament) {
      status("大会を選択してください", "error");
      return;
    }

    const amount = Number(($("pnx-fin-expense-amount") && $("pnx-fin-expense-amount").value) || tournament.entryFee || 0);
    if (!amount) {
      status("金額を入力してください", "error");
      return;
    }

    const payload = {
      tournamentId: tournament.id || tournament.tournamentId,
      tournamentTitle: tournament.title || tournament.name || "",
      type: "expense",
      category: ($("pnx-fin-expense-category") && $("pnx-fin-expense-category").value) || "entryFee",
      amount,
      date: ($("pnx-fin-expense-date") && $("pnx-fin-expense-date").value) || tournament.startDate || today(),
      memo: ($("pnx-fin-expense-memo") && $("pnx-fin-expense-memo").value) || "大会に紐づく経費"
    };

    try {
      window.parent.postMessage({
        type: "PNX_CREATE_TOURNAMENT_FINANCE_TRANSACTION",
        payload
      }, "*");
      status("保存しました：" + payload.tournamentTitle + " / ¥" + amount.toLocaleString("ja-JP"), "success");
    } catch(e) {
      status("保存に失敗しました", "error");
    }
  }

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type === "PNX_TOURNAMENTS_FOR_FINANCE_UPDATED") {
      if (window.PNXFinanceAcceptTournamentsStable && !window.PNXFinanceAcceptTournamentsStable(data.payload)) return;
      if (!window.PNXFinanceAcceptTournamentsStable) window.PNXFinanceTournaments = Array.isArray(data.payload) ? data.payload : [];
      renderTournamentOptions();
    }
    if (data.type === "PNX_FINANCE_TRANSACTION_CREATED") {
      status("取引を保存しました", "success");
    }
  });

  document.addEventListener("DOMContentLoaded", function(){
    const date = $("pnx-fin-expense-date");
    if (date && !date.value) date.value = today();

    const refresh = $("pnx-fin-refresh-tournaments");
    const save = $("pnx-fin-save-expense");

    if (refresh) refresh.addEventListener("click", requestTournaments);
    if (save) save.addEventListener("click", saveExpense);

    // STEP102: do not auto-request repeatedly while finance iframe is hidden.
    setTimeout(function(){ if (window.PNXFinanceSafeRequestTournaments) window.PNXFinanceSafeRequestTournaments(false); else requestTournaments(); }, 500);
  });

  window.PNXFinanceRenderTournamentOptions = renderTournamentOptions;
  window.PNXFinanceRequestTournaments = requestTournaments;
})();


/* ================================================================
   STEP19: Finance Transaction List UI
   PNX_FINANCE_TRANSACTIONS を読み込み、大会別経費一覧を表示
   ================================================================ */
(function(){
  if (window.__PNX_STEP19_FINANCE_TX_LIST__) return;
  window.__PNX_STEP19_FINANCE_TX_LIST__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";

  function yen(n){
    return "¥" + Number(n || 0).toLocaleString("ja-JP");
  }

  function labelCategory(cat){
    const map = {
      entryFee:"エントリー費",
      transport:"交通費",
      hotel:"宿泊費",
      meal:"食費",
      practice:"練習費",
      other:"その他"
    };
    return map[cat] || cat || "経費";
  }

  function readTx(){
    try {
      const list = JSON.parse(localStorage.getItem(TX_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function render(){
    const box = document.getElementById("pnx-fin-transaction-list");
    if (!box) return;

    const txs = readTx().filter(tx => tx && tx.source === "tournament").slice().reverse();

    if (!txs.length) {
      box.innerHTML = '<div class="pnx-fin-empty">まだ大会経費がありません</div>';
      return;
    }

    box.innerHTML = txs.map(tx => {
      const title = tx.tournamentTitle || "大会未選択";
      const cat = labelCategory(tx.category);
      const date = tx.date || "";
      const memo = tx.memo || "";
      return `
        <div class="pnx-fin-tx-item">
          <div>
            <div class="pnx-fin-tx-title">${title}</div>
            <div class="pnx-fin-tx-meta">${cat}${date ? "・" + date : ""}${memo ? "<br>" + memo : ""}</div>
          </div>
          <div class="pnx-fin-tx-amount">-${yen(tx.amount)}</div>
        </div>
      `;
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function(){
    const btn = document.getElementById("pnx-fin-refresh-transactions");
    if (btn) btn.addEventListener("click", render);
    setTimeout(render, 150);
    setTimeout(render, 700);
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type === "PNX_FINANCE_TRANSACTION_CREATED") {
      setTimeout(render, 80);
    }
  });

  window.addEventListener("storage", function(e){
    if (e.key === TX_KEY) render();
  });

  window.PNXFinanceRenderTransactionList = render;
})();


/* ================================================================
   STEP20: Tournament Finance Summary UI
   tournamentId ごとに経費を集計して大会別サマリー表示
   ================================================================ */
(function(){
  if (window.__PNX_STEP20_TOURNAMENT_SUMMARY__) return;
  window.__PNX_STEP20_TOURNAMENT_SUMMARY__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";

  function yen(n){
    return "¥" + Number(n || 0).toLocaleString("ja-JP");
  }

  function labelCategory(cat){
    const map = {
      entryFee:"エントリー費",
      transport:"交通費",
      hotel:"宿泊費",
      meal:"食費",
      practice:"練習費",
      other:"その他"
    };
    return map[cat] || cat || "経費";
  }

  function readTx(){
    try {
      const list = JSON.parse(localStorage.getItem(TX_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function groupByTournament(txs){
    const map = {};
    txs.filter(tx => tx && tx.source === "tournament").forEach(tx => {
      const id = tx.tournamentId || "unknown";
      if (!map[id]) {
        map[id] = {
          tournamentId: id,
          title: tx.tournamentTitle || "大会未選択",
          total: 0,
          count: 0,
          categories: {},
          latestDate: tx.date || ""
        };
      }
      const amount = Number(tx.amount || 0);
      const cat = tx.category || "other";
      map[id].total += amount;
      map[id].count += 1;
      map[id].categories[cat] = (map[id].categories[cat] || 0) + amount;
      if (tx.date && (!map[id].latestDate || tx.date > map[id].latestDate)) map[id].latestDate = tx.date;
    });
    return Object.values(map).sort((a,b) => b.total - a.total);
  }

  function render(){
    const box = document.getElementById("pnx-fin-summary-list");
    if (!box) return;

    const groups = groupByTournament(readTx());

    if (!groups.length) {
      box.innerHTML = '<div class="pnx-fin-empty">まだ集計できる大会経費がありません</div>';
      return;
    }

    box.innerHTML = groups.map(g => {
      const chips = Object.entries(g.categories).map(([cat, amount]) => {
        return `<div class="pnx-fin-summary-chip"><span>${labelCategory(cat)}</span><strong>${yen(amount)}</strong></div>`;
      }).join("");

      return `
        <article class="pnx-fin-summary-card">
          <div class="pnx-fin-summary-top">
            <div>
              <div class="pnx-fin-summary-title">${g.title}</div>
              <div class="pnx-fin-summary-meta">${g.count}件の経費${g.latestDate ? "・最新 " + g.latestDate : ""}</div>
            </div>
            <div class="pnx-fin-summary-total">-${yen(g.total)}</div>
          </div>
          <div class="pnx-fin-summary-breakdown">${chips}</div>
        </article>
      `;
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function(){
    const btn = document.getElementById("pnx-fin-refresh-summary");
    if (btn) btn.addEventListener("click", render);
    setTimeout(render, 180);
    setTimeout(render, 800);
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type === "PNX_FINANCE_TRANSACTION_CREATED") {
      setTimeout(render, 100);
    }
  });

  window.addEventListener("storage", function(e){
    if (e.key === TX_KEY) render();
  });

  window.PNXFinanceRenderTournamentSummary = render;
})();


/* ================================================================
   STEP21: Tournament Income & Profit UI
   大会収入入力と、収入−支出の利益サマリー
   ================================================================ */
(function(){
  if (window.__PNX_STEP21_TOURNAMENT_PROFIT__) return;
  window.__PNX_STEP21_TOURNAMENT_PROFIT__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";

  function $(id){ return document.getElementById(id); }
  function yen(n){ return "¥" + Number(n || 0).toLocaleString("ja-JP"); }
  function today(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function readTx(){
    try { const list = JSON.parse(localStorage.getItem(TX_KEY) || "[]"); return Array.isArray(list) ? list : []; }
    catch(e){ return []; }
  }
  function writeTx(list){ localStorage.setItem(TX_KEY, JSON.stringify(list)); }

  function incomeStatus(message, type){
    const el = $("pnx-fin-income-status");
    if (!el) return;
    el.textContent = message;
    el.classList.remove("is-success","is-error");
    if (type) el.classList.add(type === "success" ? "is-success" : "is-error");
  }

  function renderIncomeTournamentOptions(){
    const select = $("pnx-fin-income-tournament-select");
    if (!select) return;
    const current = select.value;
    const tournaments = Array.isArray(window.PNXFinanceTournaments) ? window.PNXFinanceTournaments : [];
    select.innerHTML = '<option value="">大会を選択</option>' + tournaments.map(t => {
      const id = t.id || t.tournamentId || "";
      const title = t.title || t.name || "大会";
      const date = t.startDate || t.date || "";
      return `<option value="${id}">${title}${date ? "（" + date + "）" : ""}</option>`;
    }).join("");
    if (current && tournaments.some(t => (t.id || t.tournamentId) === current)) select.value = current;
    incomeStatus(tournaments.length ? `${tournaments.length}件の大会を読み込みました` : "大会がまだありません");
  }

  function requestTournaments(){
    if (window.PNXFinanceSafeRequestTournaments) window.PNXFinanceSafeRequestTournaments(false);
    else { try { window.parent.postMessage({ type:"PNX_REQUEST_TOURNAMENTS_FOR_FINANCE" }, "*"); } catch(e) {} }
    setTimeout(renderIncomeTournamentOptions, 250);
  }

  function getSelectedIncomeTournament(){
    const select = $("pnx-fin-income-tournament-select");
    if (!select) return null;
    const id = select.value;
    return (window.PNXFinanceTournaments || []).find(t => (t.id || t.tournamentId) === id) || null;
  }

  function saveIncome(){
    const tournament = getSelectedIncomeTournament();
    if (!tournament) {
      incomeStatus("大会を選択してください", "error");
      return;
    }
    const amount = Number(($("pnx-fin-income-amount") && $("pnx-fin-income-amount").value) || 0);
    if (!amount) {
      incomeStatus("金額を入力してください", "error");
      return;
    }

    const txs = readTx();
    const tx = {
      id: "tx_income_" + Date.now(),
      tournamentId: tournament.id || tournament.tournamentId,
      tournamentTitle: tournament.title || tournament.name || "",
      type: "income",
      category: ($("pnx-fin-income-category") && $("pnx-fin-income-category").value) || "prize",
      amount,
      date: ($("pnx-fin-income-date") && $("pnx-fin-income-date").value) || tournament.startDate || today(),
      memo: ($("pnx-fin-income-memo") && $("pnx-fin-income-memo").value) || "大会に紐づく収入",
      source: "tournament",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    txs.push(tx);
    writeTx(txs);

    incomeStatus("保存しました：" + tx.tournamentTitle + " / +" + yen(amount), "success");
    setTimeout(renderProfit, 80);
    try { if (window.PNXFinanceRenderTransactionList) window.PNXFinanceRenderTransactionList(); } catch(e) {}
    try { if (window.PNXFinanceRenderTournamentSummary) window.PNXFinanceRenderTournamentSummary(); } catch(e) {}
  }

  function groupProfit(txs){
    const map = {};
    txs.filter(tx => tx && tx.source === "tournament").forEach(tx => {
      const id = tx.tournamentId || "unknown";
      if (!map[id]) {
        map[id] = {
          tournamentId: id,
          title: tx.tournamentTitle || "大会未選択",
          income: 0,
          expense: 0,
          count: 0
        };
      }
      const amount = Number(tx.amount || 0);
      if (tx.type === "income") map[id].income += amount;
      else map[id].expense += amount;
      map[id].count += 1;
    });
    return Object.values(map).map(g => {
      g.profit = g.income - g.expense;
      return g;
    }).sort((a,b) => b.profit - a.profit);
  }

  function renderProfit(){
    const box = $("pnx-fin-profit-list");
    if (!box) return;
    const groups = groupProfit(readTx());

    if (!groups.length) {
      box.innerHTML = '<div class="pnx-fin-empty">まだ利益計算できるデータがありません</div>';
      return;
    }

    box.innerHTML = groups.map(g => {
      const plus = g.profit >= 0;
      return `
        <article class="pnx-fin-profit-card">
          <div class="pnx-fin-profit-top">
            <div>
              <div class="pnx-fin-profit-title">${g.title}</div>
              <div class="pnx-fin-profit-meta">${g.count}件の取引</div>
            </div>
            <div class="pnx-fin-profit-main ${plus ? "is-plus" : "is-minus"}">${plus ? "+" : "-"}${yen(Math.abs(g.profit))}</div>
          </div>
          <div class="pnx-fin-profit-row">
            <div class="pnx-fin-profit-box income"><span>収入</span><strong>${yen(g.income)}</strong></div>
            <div class="pnx-fin-profit-box expense"><span>支出</span><strong>${yen(g.expense)}</strong></div>
            <div class="pnx-fin-profit-box"><span>利益</span><strong>${plus ? "+" : "-"}${yen(Math.abs(g.profit))}</strong></div>
          </div>
        </article>
      `;
    }).join("");
  }

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type === "PNX_TOURNAMENTS_FOR_FINANCE_UPDATED") {
      if (window.PNXFinanceAcceptTournamentsStable && !window.PNXFinanceAcceptTournamentsStable(data.payload)) return;
      if (!window.PNXFinanceAcceptTournamentsStable) window.PNXFinanceTournaments = Array.isArray(data.payload) ? data.payload : [];
      renderIncomeTournamentOptions();
    }
    if (data.type === "PNX_FINANCE_TRANSACTION_CREATED") {
      setTimeout(renderProfit, 100);
    }
  });

  window.addEventListener("storage", function(e){
    if (e.key === TX_KEY) renderProfit();
  });

  document.addEventListener("DOMContentLoaded", function(){
    const date = $("pnx-fin-income-date");
    if (date && !date.value) date.value = today();

    const refreshIncome = $("pnx-fin-refresh-income-tournaments");
    const saveIncomeBtn = $("pnx-fin-save-income");
    const refreshProfit = $("pnx-fin-refresh-profit");

    if (refreshIncome) refreshIncome.addEventListener("click", requestTournaments);
    if (saveIncomeBtn) saveIncomeBtn.addEventListener("click", saveIncome);
    if (refreshProfit) refreshProfit.addEventListener("click", renderProfit);

    // STEP102: single delayed request only; no request storm.
    setTimeout(function(){ if (window.PNXFinanceSafeRequestTournaments) window.PNXFinanceSafeRequestTournaments(false); else requestTournaments(); renderProfit(); }, 600);
  });

  window.PNXFinanceRenderProfitSummary = renderProfit;
})();


/* ================================================================
   STEP22: Finance Accuracy Summary
   年間/月別の収入・支出・利益を正確に再集計する
   ================================================================ */
(function(){
  if (window.__PNX_STEP22_FINANCE_ACCURACY__) return;
  window.__PNX_STEP22_FINANCE_ACCURACY__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";

  function yen(n){ return "¥" + Number(n || 0).toLocaleString("ja-JP"); }

  function readTx(){
    try {
      const list = JSON.parse(localStorage.getItem(TX_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function normalizeTx(tx){
    const amount = Math.abs(Number(tx.amount || 0));
    const type = tx.type === "income" ? "income" : "expense";
    const date = tx.date || (tx.createdAt ? String(tx.createdAt).slice(0,10) : new Date().toISOString().slice(0,10));
    const month = date.slice(0,7);
    return Object.assign({}, tx, { amount, type, date, month });
  }

  function calculate(){
    const txs = readTx().filter(tx => tx && tx.source === "tournament").map(normalizeTx);
    const total = { income:0, expense:0, profit:0, count:txs.length };
    const monthly = {};

    txs.forEach(tx => {
      if (!monthly[tx.month]) monthly[tx.month] = { month:tx.month, income:0, expense:0, profit:0, count:0 };
      if (tx.type === "income") {
        total.income += tx.amount;
        monthly[tx.month].income += tx.amount;
      } else {
        total.expense += tx.amount;
        monthly[tx.month].expense += tx.amount;
      }
      monthly[tx.month].count += 1;
    });

    total.profit = total.income - total.expense;
    Object.values(monthly).forEach(m => m.profit = m.income - m.expense);

    return {
      total,
      monthly: Object.values(monthly).sort((a,b) => b.month.localeCompare(a.month))
    };
  }

  function render(){
    const cards = document.getElementById("pnx-fin-accuracy-cards");
    const monthlyBox = document.getElementById("pnx-fin-monthly-list");
    if (!cards || !monthlyBox) return;

    const data = calculate();
    const plus = data.total.profit >= 0;

    if (!data.total.count) {
      cards.innerHTML = '<div class="pnx-fin-empty">まだ集計できるデータがありません</div>';
      monthlyBox.innerHTML = "";
      return;
    }

    cards.innerHTML = `
      <div class="pnx-fin-accuracy-card income">
        <span>年間収入</span>
        <strong>${yen(data.total.income)}</strong>
      </div>
      <div class="pnx-fin-accuracy-card expense">
        <span>年間支出</span>
        <strong>${yen(data.total.expense)}</strong>
      </div>
      <div class="pnx-fin-accuracy-card profit">
        <span>年間利益</span>
        <strong class="${plus ? "is-plus" : "is-minus"}">${plus ? "+" : "-"}${yen(Math.abs(data.total.profit))}</strong>
      </div>
    `;

    monthlyBox.innerHTML = data.monthly.map(m => {
      const p = m.profit >= 0;
      return `
        <div class="pnx-fin-month-row">
          <div class="month">${m.month}</div>
          <div class="income">収入 ${yen(m.income)}</div>
          <div class="expense">支出 ${yen(m.expense)}</div>
          <div class="profit ${p ? "plus" : "minus"}">利益 ${p ? "+" : "-"}${yen(Math.abs(m.profit))}</div>
        </div>
      `;
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function(){
    const btn = document.getElementById("pnx-fin-refresh-accuracy");
    if (btn) btn.addEventListener("click", render);
    setTimeout(render, 220);
    setTimeout(render, 900);
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type === "PNX_FINANCE_TRANSACTION_CREATED") setTimeout(render, 100);
  });

  window.addEventListener("storage", function(e){
    if (e.key === TX_KEY) render();
  });

  window.PNXFinanceRenderAccuracySummary = render;
  window.PNXFinanceCalculateAccuracy = calculate;
})();


/* ================================================================
   STEP23: Tax Category Mapping
   UIカテゴリ → 確定申告用カテゴリへ変換・集計
   ================================================================ */
(function(){
  if (window.__PNX_STEP23_TAX_CATEGORY__) return;
  window.__PNX_STEP23_TAX_CATEGORY__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";

  const TAX_CATEGORY_MAP = {
    entryFee: {
      taxCategory: "諸会費",
      taxCode: "dues",
      description: "大会エントリー費・競技参加費"
    },
    transport: {
      taxCategory: "旅費交通費",
      taxCode: "travel_transport",
      description: "車・電車・高速・ガソリン・駐車場など"
    },
    hotel: {
      taxCategory: "旅費交通費",
      taxCode: "travel_transport",
      description: "遠征時の宿泊費"
    },
    meal: {
      taxCategory: "会議費・接待交際費",
      taxCode: "meeting_entertainment",
      description: "遠征時の食事・打ち合わせ等"
    },
    practice: {
      taxCategory: "研修費・練習費",
      taxCode: "training",
      description: "練習ラウンド・練習場・競技力向上費"
    },
    other: {
      taxCategory: "雑費",
      taxCode: "misc",
      description: "その他の大会関連経費"
    }
  };

  function yen(n){
    return "¥" + Number(n || 0).toLocaleString("ja-JP");
  }

  function readTx(){
    try {
      const list = JSON.parse(localStorage.getItem(TX_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function mapTaxCategory(category){
    return TAX_CATEGORY_MAP[category] || TAX_CATEGORY_MAP.other;
  }

  function calculateTaxSummary(){
    const summary = {};
    const txs = readTx().filter(tx => tx && tx.source === "tournament" && tx.type !== "income");

    txs.forEach(tx => {
      const mapped = mapTaxCategory(tx.category);
      const key = mapped.taxCode;
      if (!summary[key]) {
        summary[key] = {
          taxCode: mapped.taxCode,
          taxCategory: mapped.taxCategory,
          description: mapped.description,
          amount: 0,
          count: 0,
          originalCategories: {}
        };
      }
      const amount = Math.abs(Number(tx.amount || 0));
      summary[key].amount += amount;
      summary[key].count += 1;
      summary[key].originalCategories[tx.category || "other"] =
        (summary[key].originalCategories[tx.category || "other"] || 0) + amount;

      tx.taxCategory = mapped.taxCategory;
      tx.taxCode = mapped.taxCode;
    });

    return Object.values(summary).sort((a,b) => b.amount - a.amount);
  }

  function render(){
    const box = document.getElementById("pnx-fin-tax-list");
    if (!box) return;

    const rows = calculateTaxSummary();

    if (!rows.length) {
      box.innerHTML = '<div class="pnx-fin-empty">まだ税務集計できる経費がありません</div>';
      return;
    }

    box.innerHTML = rows.map(row => {
      const original = Object.entries(row.originalCategories).map(([k,v]) => `${k}: ${yen(v)}`).join(" / ");
      return `
        <div class="pnx-fin-tax-row">
          <div>
            <div class="pnx-fin-tax-name">${row.taxCategory}</div>
            <div class="pnx-fin-tax-meta">${row.count}件・${row.description}<br>${original}</div>
          </div>
          <div class="pnx-fin-tax-amount">${yen(row.amount)}</div>
        </div>
      `;
    }).join("") + `
      <div class="pnx-fin-tax-note">
        ※これは申告準備用の内部カテゴリです。実際の勘定科目は税理士確認・事業内容に合わせて調整してください。
      </div>
    `;
  }

  document.addEventListener("DOMContentLoaded", function(){
    const btn = document.getElementById("pnx-fin-refresh-tax");
    if (btn) btn.addEventListener("click", render);
    setTimeout(render, 260);
    setTimeout(render, 1000);
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type === "PNX_FINANCE_TRANSACTION_CREATED") setTimeout(render, 120);
  });

  window.addEventListener("storage", function(e){
    if (e.key === TX_KEY) render();
  });

  window.PNXFinanceTaxCategoryMap = TAX_CATEGORY_MAP;
  window.PNXFinanceCalculateTaxSummary = calculateTaxSummary;
  window.PNXFinanceRenderTaxSummary = render;
})();


/* ================================================================
   STEP24: CSV Export
   取引CSV・税務カテゴリCSVを生成
   ================================================================ */
(function(){
  if (window.__PNX_STEP24_CSV_EXPORT__) return;
  window.__PNX_STEP24_CSV_EXPORT__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";

  const TAX_CATEGORY_MAP = window.PNXFinanceTaxCategoryMap || {
    entryFee:{taxCategory:"諸会費", taxCode:"dues"},
    transport:{taxCategory:"旅費交通費", taxCode:"travel_transport"},
    hotel:{taxCategory:"旅費交通費", taxCode:"travel_transport"},
    meal:{taxCategory:"会議費・接待交際費", taxCode:"meeting_entertainment"},
    practice:{taxCategory:"研修費・練習費", taxCode:"training"},
    other:{taxCategory:"雑費", taxCode:"misc"}
  };

  function readTx(){
    try {
      const list = JSON.parse(localStorage.getItem(TX_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function esc(v){
    const s = String(v == null ? "" : v);
    return '"' + s.replace(/"/g, '""') + '"';
  }

  function mapTax(category){
    return TAX_CATEGORY_MAP[category] || TAX_CATEGORY_MAP.other || {taxCategory:"雑費", taxCode:"misc"};
  }

  function makeTransactionCsv(){
    const rows = [
      ["日付","種別","大会名","カテゴリ","税務カテゴリ","金額","会場/メモ","tournamentId","取引ID"]
    ];

    readTx().filter(tx => tx && tx.source === "tournament").forEach(tx => {
      const mapped = tx.type === "income" ? { taxCategory:"事業収入", taxCode:"business_income" } : mapTax(tx.category);
      rows.push([
        tx.date || "",
        tx.type === "income" ? "収入" : "支出",
        tx.tournamentTitle || "",
        tx.category || "",
        mapped.taxCategory || "",
        Number(tx.amount || 0),
        tx.memo || "",
        tx.tournamentId || "",
        tx.id || ""
      ]);
    });

    return rows.map(row => row.map(esc).join(",")).join("\n");
  }

  function makeTaxCsv(){
    const summary = {};
    readTx().filter(tx => tx && tx.source === "tournament").forEach(tx => {
      const mapped = tx.type === "income" ? { taxCategory:"事業収入", taxCode:"business_income" } : mapTax(tx.category);
      const key = mapped.taxCode || mapped.taxCategory;
      if (!summary[key]) {
        summary[key] = { taxCategory:mapped.taxCategory, income:0, expense:0, count:0 };
      }
      const amount = Math.abs(Number(tx.amount || 0));
      if (tx.type === "income") summary[key].income += amount;
      else summary[key].expense += amount;
      summary[key].count += 1;
    });

    const rows = [["税務カテゴリ","収入合計","支出合計","差引","件数"]];
    Object.values(summary).forEach(s => {
      rows.push([s.taxCategory, s.income, s.expense, s.income - s.expense, s.count]);
    });
    return rows.map(row => row.map(esc).join(",")).join("\n");
  }

  function downloadCsv(filename, csv){
    const blob = new Blob(["\ufeff" + csv], { type:"text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function setOutput(csv, message){
    const output = document.getElementById("pnx-fin-export-output");
    const status = document.getElementById("pnx-fin-export-status");
    if (output) output.value = csv;
    if (status) {
      status.textContent = message;
      status.classList.remove("is-error");
      status.classList.add("is-success");
    }
  }

  function exportTransactions(){
    const csv = makeTransactionCsv();
    setOutput(csv, "取引CSVを作成しました");
    downloadCsv("pronexax_transactions.csv", csv);
  }

  function exportTax(){
    const csv = makeTaxCsv();
    setOutput(csv, "税務カテゴリCSVを作成しました");
    downloadCsv("pronexax_tax_summary.csv", csv);
  }

  document.addEventListener("DOMContentLoaded", function(){
    const txBtn = document.getElementById("pnx-fin-export-transactions");
    const taxBtn = document.getElementById("pnx-fin-export-tax");
    if (txBtn) txBtn.addEventListener("click", exportTransactions);
    if (taxBtn) taxBtn.addEventListener("click", exportTax);
  });

  window.PNXFinanceMakeTransactionCsv = makeTransactionCsv;
  window.PNXFinanceMakeTaxCsv = makeTaxCsv;
})();


/* ================================================================
   STEP25: PDF Report
   年間収支・大会別利益・税務カテゴリをPDF保存用に生成
   ================================================================ */
(function(){
  if (window.__PNX_STEP25_PDF_REPORT__) return;
  window.__PNX_STEP25_PDF_REPORT__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";

  const TAX_CATEGORY_MAP = window.PNXFinanceTaxCategoryMap || {
    entryFee:{taxCategory:"諸会費", taxCode:"dues"},
    transport:{taxCategory:"旅費交通費", taxCode:"travel_transport"},
    hotel:{taxCategory:"旅費交通費", taxCode:"travel_transport"},
    meal:{taxCategory:"会議費・接待交際費", taxCode:"meeting_entertainment"},
    practice:{taxCategory:"研修費・練習費", taxCode:"training"},
    other:{taxCategory:"雑費", taxCode:"misc"}
  };

  function yen(n){ return "¥" + Number(n || 0).toLocaleString("ja-JP"); }

  function readTx(){
    try { const list = JSON.parse(localStorage.getItem(TX_KEY) || "[]"); return Array.isArray(list) ? list : []; }
    catch(e){ return []; }
  }

  function taxMap(cat){
    return TAX_CATEGORY_MAP[cat] || TAX_CATEGORY_MAP.other || { taxCategory:"雑費", taxCode:"misc" };
  }

  function calc(){
    const txs = readTx().filter(tx => tx && tx.source === "tournament");
    const total = { income:0, expense:0, profit:0, count:txs.length };
    const tournament = {};
    const tax = {};

    txs.forEach(tx => {
      const amount = Math.abs(Number(tx.amount || 0));
      const isIncome = tx.type === "income";
      if (isIncome) total.income += amount;
      else total.expense += amount;

      const tid = tx.tournamentId || "unknown";
      if (!tournament[tid]) {
        tournament[tid] = { title: tx.tournamentTitle || "大会未選択", income:0, expense:0, profit:0, count:0 };
      }
      if (isIncome) tournament[tid].income += amount;
      else tournament[tid].expense += amount;
      tournament[tid].count += 1;

      const mapped = isIncome ? { taxCategory:"事業収入", taxCode:"business_income" } : taxMap(tx.category);
      const key = mapped.taxCode || mapped.taxCategory;
      if (!tax[key]) tax[key] = { taxCategory:mapped.taxCategory, income:0, expense:0, count:0 };
      if (isIncome) tax[key].income += amount;
      else tax[key].expense += amount;
      tax[key].count += 1;
    });

    total.profit = total.income - total.expense;
    Object.values(tournament).forEach(t => t.profit = t.income - t.expense);

    return {
      total,
      tournaments: Object.values(tournament).sort((a,b) => b.profit - a.profit),
      tax: Object.values(tax).sort((a,b) => (b.income + b.expense) - (a.income + a.expense))
    };
  }

  function row(value){ return value == null || value === "" ? "-" : value; }

  function render(){
    const box = document.getElementById("pnx-fin-pdf-preview");
    if (!box) return;

    const data = calc();
    const plus = data.total.profit >= 0;
    const today = new Date().toISOString().slice(0,10);

    box.innerHTML = `
      <div class="pnx-pdf-report">
        <div class="pnx-pdf-title-row">
          <div>
            <div class="pnx-pdf-brand">ProNexaX Finance</div>
            <h1>年間収支レポート</h1>
            <div class="pnx-pdf-date">作成日：${today}</div>
          </div>
          <button type="button" class="pnx-fin-sub-btn" onclick="window.print()">PDF保存 / 印刷</button>
        </div>

        <div class="pnx-pdf-summary">
          <div class="pnx-pdf-card income"><span>年間収入</span><strong>${yen(data.total.income)}</strong></div>
          <div class="pnx-pdf-card expense"><span>年間支出</span><strong>${yen(data.total.expense)}</strong></div>
          <div class="pnx-pdf-card profit"><span>年間利益</span><strong class="${plus ? "plus" : "minus"}">${plus ? "+" : "-"}${yen(Math.abs(data.total.profit))}</strong></div>
        </div>

        <section class="pnx-pdf-section">
          <h2>大会別損益</h2>
          <table class="pnx-pdf-table">
            <thead><tr><th>大会</th><th>収入</th><th>支出</th><th>利益</th><th>件数</th></tr></thead>
            <tbody>
              ${data.tournaments.map(t => {
                const p = t.profit >= 0;
                return `<tr><td>${row(t.title)}</td><td>${yen(t.income)}</td><td>${yen(t.expense)}</td><td>${p ? "+" : "-"}${yen(Math.abs(t.profit))}</td><td>${t.count}</td></tr>`;
              }).join("") || '<tr><td colspan="5">データなし</td></tr>'}
            </tbody>
          </table>
        </section>

        <section class="pnx-pdf-section">
          <h2>税務カテゴリ集計</h2>
          <table class="pnx-pdf-table">
            <thead><tr><th>カテゴリ</th><th>収入</th><th>支出</th><th>件数</th></tr></thead>
            <tbody>
              ${data.tax.map(t => `<tr><td>${row(t.taxCategory)}</td><td>${yen(t.income)}</td><td>${yen(t.expense)}</td><td>${t.count}</td></tr>`).join("") || '<tr><td colspan="4">データなし</td></tr>'}
            </tbody>
          </table>
        </section>

        <div class="pnx-pdf-note">
          ※このレポートは申告準備・税理士共有用の参考資料です。実際の申告内容は税理士または専門家に確認してください。
        </div>
      </div>
    `;
  }

  document.addEventListener("DOMContentLoaded", function(){
    const btn = document.getElementById("pnx-fin-generate-pdf-report");
    if (btn) btn.addEventListener("click", render);
    setTimeout(render, 300);
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type === "PNX_FINANCE_TRANSACTION_CREATED") setTimeout(render, 150);
  });

  window.addEventListener("storage", function(e){
    if (e.key === TX_KEY) render();
  });

  window.PNXFinanceGeneratePdfReport = render;
  window.PNXFinanceCalculatePdfReport = calc;
})();


/* ================================================================
   STEP26: Tax Advisor Package
   税理士共有用の確認パッケージを生成
   ================================================================ */
(function(){
  if (window.__PNX_STEP26_ADVISOR_PACKAGE__) return;
  window.__PNX_STEP26_ADVISOR_PACKAGE__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";

  function yen(n){ return "¥" + Number(n || 0).toLocaleString("ja-JP"); }

  function readTx(){
    try { const list = JSON.parse(localStorage.getItem(TX_KEY) || "[]"); return Array.isArray(list) ? list : []; }
    catch(e){ return []; }
  }

  function calc(){
    const txs = readTx().filter(tx => tx && tx.source === "tournament");
    let income = 0, expense = 0;
    const tournaments = new Set();
    const taxCats = new Set();

    txs.forEach(tx => {
      const amount = Math.abs(Number(tx.amount || 0));
      if (tx.type === "income") income += amount;
      else expense += amount;
      if (tx.tournamentId) tournaments.add(tx.tournamentId);
      if (tx.taxCategory || tx.category) taxCats.add(tx.taxCategory || tx.category);
    });

    return {
      count: txs.length,
      income,
      expense,
      profit: income - expense,
      tournamentCount: tournaments.size,
      taxCategoryCount: taxCats.size,
      hasCsv: typeof window.PNXFinanceMakeTransactionCsv === "function",
      hasTaxCsv: typeof window.PNXFinanceMakeTaxCsv === "function",
      hasPdf: typeof window.PNXFinanceGeneratePdfReport === "function"
    };
  }

  function render(){
    const box = document.getElementById("pnx-fin-advisor-summary");
    if (!box) return;
    const d = calc();
    const plus = d.profit >= 0;

    box.innerHTML = `
      <div class="pnx-advisor-card">
        <h3>共有データ概要</h3>
        <div class="pnx-advisor-grid">
          <div class="pnx-advisor-metric"><span>取引数</span><strong>${d.count}件</strong></div>
          <div class="pnx-advisor-metric"><span>大会数</span><strong>${d.tournamentCount}件</strong></div>
          <div class="pnx-advisor-metric"><span>カテゴリ数</span><strong>${d.taxCategoryCount}件</strong></div>
          <div class="pnx-advisor-metric"><span>収入</span><strong>${yen(d.income)}</strong></div>
          <div class="pnx-advisor-metric"><span>支出</span><strong>${yen(d.expense)}</strong></div>
          <div class="pnx-advisor-metric"><span>利益</span><strong>${plus ? "+" : "-"}${yen(Math.abs(d.profit))}</strong></div>
        </div>
      </div>

      <div class="pnx-advisor-card">
        <h3>共有できる資料</h3>
        <div class="pnx-advisor-checklist">
          <div class="pnx-advisor-check"><span>取引CSV</span><span class="pnx-advisor-badge">${d.hasCsv ? "準備OK" : "未準備"}</span></div>
          <div class="pnx-advisor-check"><span>税務カテゴリCSV</span><span class="pnx-advisor-badge">${d.hasTaxCsv ? "準備OK" : "未準備"}</span></div>
          <div class="pnx-advisor-check"><span>PDFレポート</span><span class="pnx-advisor-badge">${d.hasPdf ? "準備OK" : "未準備"}</span></div>
          <div class="pnx-advisor-check"><span>大会別損益</span><span class="pnx-advisor-badge">準備OK</span></div>
        </div>
        <div class="pnx-advisor-note">
          税理士へ共有する時は、CSV・PDF・領収書画像をセットにすると確認がスムーズです。
        </div>
      </div>
    `;
  }

  document.addEventListener("DOMContentLoaded", function(){
    const btn = document.getElementById("pnx-fin-build-advisor-package");
    if (btn) btn.addEventListener("click", render);
    setTimeout(render, 350);
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type === "PNX_FINANCE_TRANSACTION_CREATED") setTimeout(render, 160);
  });

  window.addEventListener("storage", function(e){
    if (e.key === TX_KEY) render();
  });

  window.PNXFinanceBuildAdvisorPackage = render;
  window.PNXFinanceCalculateAdvisorPackage = calc;
})();


/* ================================================================
   STEP27: Receipt OCR Ready
   レシート画像選択・OCRデモ・経費保存の土台
   ================================================================ */
(function(){
  if (window.__PNX_STEP27_RECEIPT_OCR__) return;
  window.__PNX_STEP27_RECEIPT_OCR__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";

  function $(id){ return document.getElementById(id); }

  function today(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function status(message, type){
    const el = $("pnx-fin-ocr-status");
    if (!el) return;
    el.textContent = message;
    el.classList.remove("is-success","is-error");
    if (type) el.classList.add(type === "success" ? "is-success" : "is-error");
  }

  function readTx(){
    try { const list = JSON.parse(localStorage.getItem(TX_KEY) || "[]"); return Array.isArray(list) ? list : []; }
    catch(e){ return []; }
  }

  function writeTx(list){
    localStorage.setItem(TX_KEY, JSON.stringify(list));
  }

  function handleFile(file){
    const preview = $("pnx-fin-receipt-preview");
    if (!file || !preview) return;

    const reader = new FileReader();
    reader.onload = function(e){
      preview.innerHTML = `<img src="${e.target.result}" alt="receipt preview">`;
      status("画像を読み込みました。OCRデモ入力または手入力してください。");
      window.__PNX_LAST_RECEIPT_IMAGE__ = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function demoOcr(){
    const date = $("pnx-fin-ocr-date");
    const merchant = $("pnx-fin-ocr-merchant");
    const amount = $("pnx-fin-ocr-amount");
    const category = $("pnx-fin-ocr-category");
    const memo = $("pnx-fin-ocr-memo");

    if (date) date.value = today();
    if (merchant) merchant.value = "高速道路・遠征費";
    if (amount) amount.value = "3500";
    if (category) category.value = "transport";
    if (memo) memo.value = "OCRデモ：大会遠征の交通費";

    status("OCRデモ結果を入力しました", "success");
  }

  function saveExpense(){
    const amount = Number(($("pnx-fin-ocr-amount") && $("pnx-fin-ocr-amount").value) || 0);
    if (!amount) {
      status("金額を入力してください", "error");
      return;
    }

    const txs = readTx();
    const tx = {
      id: "tx_receipt_" + Date.now(),
      tournamentId: null,
      tournamentTitle: "レシート経費",
      type: "expense",
      category: ($("pnx-fin-ocr-category") && $("pnx-fin-ocr-category").value) || "other",
      amount,
      date: ($("pnx-fin-ocr-date") && $("pnx-fin-ocr-date").value) || today(),
      memo: (($("pnx-fin-ocr-merchant") && $("pnx-fin-ocr-merchant").value) || "") + " " + (($("pnx-fin-ocr-memo") && $("pnx-fin-ocr-memo").value) || ""),
      source: "receipt",
      receiptImage: window.__PNX_LAST_RECEIPT_IMAGE__ || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    txs.push(tx);
    writeTx(txs);

    status("レシート経費として保存しました", "success");

    try { if (window.PNXFinanceRenderTransactionList) window.PNXFinanceRenderTransactionList(); } catch(e) {}
    try { if (window.PNXFinanceRenderAccuracySummary) window.PNXFinanceRenderAccuracySummary(); } catch(e) {}
    try { if (window.PNXFinanceRenderTaxSummary) window.PNXFinanceRenderTaxSummary(); } catch(e) {}
  }

  document.addEventListener("DOMContentLoaded", function(){
    const file = $("pnx-fin-receipt-file");
    const demo = $("pnx-fin-run-demo-ocr");
    const save = $("pnx-fin-save-ocr-expense");

    if (file) file.addEventListener("change", function(){
      handleFile(file.files && file.files[0]);
    });
    if (demo) demo.addEventListener("click", demoOcr);
    if (save) save.addEventListener("click", saveExpense);

    const date = $("pnx-fin-ocr-date");
    if (date && !date.value) date.value = today();
  });

  window.PNXReceiptOcrDemo = demoOcr;
})();


/* ================================================================
   STEP28: AI Receipt Assist
   レシート/メモからカテゴリ推定・大会候補提案
   ================================================================ */
(function(){
  if (window.__PNX_STEP28_AI_RECEIPT_ASSIST__) return;
  window.__PNX_STEP28_AI_RECEIPT_ASSIST__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";

  function readTx(){
    try { const list = JSON.parse(localStorage.getItem(TX_KEY) || "[]"); return Array.isArray(list) ? list : []; }
    catch(e){ return []; }
  }

  function inferCategory(text){
    const s = String(text || "").toLowerCase();
    if (s.includes("高速") || s.includes("ガソリン") || s.includes("駐車") || s.includes("電車") || s.includes("交通")) return "transport";
    if (s.includes("ホテル") || s.includes("宿泊") || s.includes("inn")) return "hotel";
    if (s.includes("食") || s.includes("レストラン") || s.includes("弁当") || s.includes("meal")) return "meal";
    if (s.includes("練習") || s.includes("レンジ") || s.includes("ラウンド")) return "practice";
    if (s.includes("エントリー") || s.includes("参加費")) return "entryFee";
    return "other";
  }

  function labelCategory(cat){
    const map = {
      entryFee:"エントリー費",
      transport:"交通費",
      hotel:"宿泊費",
      meal:"食費",
      practice:"練習費",
      other:"その他"
    };
    return map[cat] || cat;
  }

  function nearestTournament(date){
    const tournaments = Array.isArray(window.PNXFinanceTournaments) ? window.PNXFinanceTournaments : [];
    if (!tournaments.length) return null;
    const target = new Date(date || new Date()).getTime();
    let best = null;
    let bestDiff = Infinity;
    tournaments.forEach(t => {
      const d = new Date(t.startDate || t.date || "").getTime();
      if (isNaN(d)) return;
      const diff = Math.abs(d - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = t;
      }
    });
    return best;
  }

  function runAssist(){
    const box = document.getElementById("pnx-fin-ai-result");
    if (!box) return;

    const txs = readTx().filter(tx => tx && (tx.source === "receipt" || !tx.tournamentId)).slice(-5).reverse();

    if (!txs.length) {
      box.innerHTML = '<div class="pnx-fin-empty">AI整理できるレシート経費がありません</div>';
      return;
    }

    box.innerHTML = txs.map(tx => {
      const text = [tx.memo, tx.tournamentTitle, tx.category].join(" ");
      const inferred = inferCategory(text);
      const tournament = nearestTournament(tx.date);
      const confidence = tournament ? "中" : "低";
      return `
        <div class="pnx-ai-card">
          <div class="pnx-ai-title">${tx.memo || "レシート経費"}</div>
          <div class="pnx-ai-grid">
            <div class="pnx-ai-item"><span>推定カテゴリ</span><strong>${labelCategory(inferred)}</strong></div>
            <div class="pnx-ai-item"><span>現在カテゴリ</span><strong>${labelCategory(tx.category)}</strong></div>
            <div class="pnx-ai-item"><span>大会候補</span><strong>${tournament ? (tournament.title || tournament.name) : "候補なし"}</strong></div>
            <div class="pnx-ai-item"><span>信頼度</span><strong>${confidence}</strong></div>
          </div>
          <div class="pnx-ai-note">
            将来的にはOpenAI Vision/OCRで、日付・金額・店名・税務カテゴリ・大会候補を自動提案します。
          </div>
        </div>
      `;
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function(){
    const btn = document.getElementById("pnx-fin-run-ai-assist");
    if (btn) btn.addEventListener("click", runAssist);
    setTimeout(runAssist, 500);
  });

  window.PNXFinanceInferReceiptCategory = inferCategory;
  window.PNXFinanceRunAiReceiptAssist = runAssist;
})();


/* ================================================================
   STEP52: Finance Tournament Select Sync
   カレンダー追加済み大会を収支画面の大会選択へ反映
   ================================================================ */
(function(){
  if (window.__PNX_STEP52_FINANCE_TOURNAMENT_SELECT__) return;
  window.__PNX_STEP52_FINANCE_TOURNAMENT_SELECT__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";
  const TOURNAMENTS_KEY = "PNX_FINANCE_TOURNAMENTS_CACHE";

  function $(id){ return document.getElementById(id); }

  function readJson(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(e){ return fallback; }
  }

  function writeJson(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
  }

  function normalizeTournament(t){
    if (!t) return null;
    const id = t.id || t.tournamentId || t._tournamentId;
    const title = t.title || t.name || t.tournamentTitle;
    if (!id || !title) return null;

    return {
      id: String(id).replace(/^cal_/, ""),
      tournamentId: String(id).replace(/^cal_/, ""),
      title,
      name: title,
      startDate: t.startDate || t.date || t.start || "",
      endDate: t.endDate || t.end || t.startDate || "",
      venue: t.venue || t.course || t.place || t.location || "",
      category: t.category || t.cat || "tournament",
      entryFee: t.entryFee || "",
      entryDeadline: t.entryDeadline || "",
      source: t.source || "calendar"
    };
  }

  function unique(list){
    const map = new Map();
    list.map(normalizeTournament).filter(Boolean).forEach(t => map.set(t.id, t));
    return Array.from(map.values()).sort((a,b) => String(a.startDate || "").localeCompare(String(b.startDate || "")));
  }

  function setTournaments(list){
    const normalized = unique(Array.isArray(list) ? list : []);
    window.PNXFinanceTournaments = normalized;
    writeJson(TOURNAMENTS_KEY, normalized);
    renderSelects();
    return normalized;
  }

  function getTournaments(){
    if (Array.isArray(window.PNXFinanceTournaments) && window.PNXFinanceTournaments.length) return window.PNXFinanceTournaments;
    return readJson(TOURNAMENTS_KEY, []);
  }

  function optionLabel(t){
    return `${t.title}${t.startDate ? "（" + t.startDate + "）" : ""}${t.venue ? " / " + t.venue : ""}`;
  }

  function renderSelect(select){
    if (!select) return;
    const current = select.value;
    const list = getTournaments();

    select.innerHTML = '<option value="">大会を選択</option>' + list.map(t => {
      return `<option value="${t.id}">${optionLabel(t)}</option>`;
    }).join("");

    if (current && list.some(t => t.id === current)) select.value = current;
  }

  function renderSelects(){
    [
      $("pnx-fin-tournament-select"),
      $("pnx-fin-income-tournament-select"),
      $("pnx-fin-expense-tournament-select")
    ].forEach(renderSelect);

    document.querySelectorAll("select[data-pnx-finance-tournament], .pnx-finance-tournament-select").forEach(renderSelect);

    const status = $("pnx-fin-tournament-status") || $("pnx-fin-income-status") || $("pnx-fin-link-status");
    if (status) {
      const n = getTournaments().length;
      status.textContent = n ? `${n}件の大会を読み込みました` : "カレンダーに追加した大会がまだありません";
    }
  }

  function selectedTournamentFrom(selectId){
    const select = $(selectId) || $("pnx-fin-tournament-select") || $("pnx-fin-income-tournament-select");
    if (!select) return null;
    const id = select.value;
    return getTournaments().find(t => t.id === id) || null;
  }

  function enhanceExistingSaveButtons(){
    // 既存の支出保存ボタンがある場合、選択大会情報を補完できるようにする
    document.addEventListener("click", function(e){
      const btn = e.target && e.target.closest ? e.target.closest("#pnx-fin-save-tournament-expense, #pnx-fin-save-income, [data-pnx-save-finance]") : null;
      if (!btn) return;

      const selected = selectedTournamentFrom("pnx-fin-tournament-select") || selectedTournamentFrom("pnx-fin-income-tournament-select");
      if (!selected) return;

      window.__PNX_FINANCE_SELECTED_TOURNAMENT__ = selected;
    }, true);
  }

  function patchLocalTransactionWrites(){
    // push前後で tournamentTitle が空の取引を補完するための軽い補助
    const originalSetItem = localStorage.setItem.bind(localStorage);
    if (localStorage.__PNX_STEP52_PATCHED__) return;
    localStorage.__PNX_STEP52_PATCHED__ = true;

    localStorage.setItem = function(key, value){
      if (key === TX_KEY) {
        try {
          const selected = window.__PNX_FINANCE_SELECTED_TOURNAMENT__;
          const list = JSON.parse(value || "[]");
          if (selected && Array.isArray(list) && list.length) {
            const last = list[list.length - 1];
            if (last && !last.tournamentId && last.source !== "receipt") {
              last.tournamentId = selected.id;
              last.tournamentTitle = selected.title;
              last.tournamentDate = selected.startDate || "";
              last.tournamentVenue = selected.venue || "";
              last.source = last.source || "tournament";
              value = JSON.stringify(list);
            }
          }
        } catch(e) {}
      }
      return originalSetItem(key, value);
    };
  }

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type === "PNX_TOURNAMENTS_FOR_FINANCE_UPDATED") {
      setTournaments(data.payload || []);
    }
  });

  document.addEventListener("DOMContentLoaded", function(){
    setTournaments(readJson(TOURNAMENTS_KEY, []));
    enhanceExistingSaveButtons();
    patchLocalTransactionWrites();

    try {
      window.parent && window.parent.postMessage({
        type:"PNX_REQUEST_TOURNAMENTS_FOR_FINANCE"
      }, "*");
    } catch(e) {}

    setTimeout(function(){
      try {
        window.parent && window.parent.postMessage({
          type:"PNX_REQUEST_TOURNAMENTS_FOR_FINANCE"
        }, "*");
      } catch(e) {}
      renderSelects();
    }, 800);
  });

  window.PNXFinanceSetTournaments = setTournaments;
  window.PNXFinanceRenderTournamentSelects = renderSelects;
  window.PNXFinanceGetTournaments = getTournaments;
})();


/* ================================================================
   STEP53: Tournament-linked Finance Transaction Persistence
   大会選択済みの収支データへ tournamentId / title / date / venue を確実に保存
   ================================================================ */
(function(){
  if (window.__PNX_STEP53_FIN_TX_TOURNAMENT_PERSIST__) return;
  window.__PNX_STEP53_FIN_TX_TOURNAMENT_PERSIST__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";
  const TOURNAMENTS_KEY = "PNX_FINANCE_TOURNAMENTS_CACHE";

  function $(id){ return document.getElementById(id); }

  function readJson(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(e){ return fallback; }
  }

  function writeJson(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
    return value;
  }

  function yen(n){
    return "¥" + Number(n || 0).toLocaleString("ja-JP");
  }

  function tournaments(){
    const a = Array.isArray(window.PNXFinanceTournaments) ? window.PNXFinanceTournaments : [];
    const b = readJson(TOURNAMENTS_KEY, []);
    const map = new Map();

    [...a, ...b].forEach(t => {
      if (!t) return;
      const id = String(t.id || t.tournamentId || t._tournamentId || "").replace(/^cal_/, "");
      const title = t.title || t.name || t.tournamentTitle || "";
      if (!id || !title) return;
      map.set(id, {
        id,
        tournamentId: id,
        title,
        name: title,
        startDate: t.startDate || t.date || t.start || "",
        endDate: t.endDate || t.end || t.startDate || "",
        venue: t.venue || t.course || t.place || t.location || "",
        category: t.category || t.cat || "tournament",
        entryFee: t.entryFee || "",
        entryDeadline: t.entryDeadline || "",
        source: t.source || "calendar"
      });
    });

    return Array.from(map.values());
  }

  function selectedTournament(){
    const selectors = [
      "pnx-fin-tournament-select",
      "pnx-fin-income-tournament-select",
      "pnx-fin-expense-tournament-select"
    ];

    for (const id of selectors) {
      const el = $(id);
      if (el && el.value) {
        const found = tournaments().find(t => t.id === String(el.value).replace(/^cal_/, ""));
        if (found) return found;
      }
    }

    const generic = document.querySelector("select[data-pnx-finance-tournament], .pnx-finance-tournament-select");
    if (generic && generic.value) {
      const found = tournaments().find(t => t.id === String(generic.value).replace(/^cal_/, ""));
      if (found) return found;
    }

    return window.__PNX_FINANCE_SELECTED_TOURNAMENT__ || null;
  }

  function enrichTx(tx, tournament){
    if (!tx || !tournament) return tx;
    const tid = String(tournament.id || tournament.tournamentId || "").replace(/^cal_/, "");
    if (!tid) return tx;

    tx.tournamentId = tx.tournamentId || tid;
    tx.tournamentTitle = tx.tournamentTitle || tournament.title || tournament.name || "";
    tx.tournamentDate = tx.tournamentDate || tournament.startDate || tournament.date || "";
    tx.tournamentEndDate = tx.tournamentEndDate || tournament.endDate || tournament.end || tx.tournamentDate || "";
    tx.tournamentVenue = tx.tournamentVenue || tournament.venue || tournament.place || tournament.course || "";
    tx.tournamentCategory = tx.tournamentCategory || tournament.category || tournament.cat || "";
    tx.source = tx.source || "tournament";
    tx.updatedAt = new Date().toISOString();
    return tx;
  }

  function normalizeAllTransactions(){
    const list = readJson(TX_KEY, []);
    const ts = tournaments();
    if (!Array.isArray(list) || !list.length || !ts.length) return list;

    let changed = false;
    const byId = new Map(ts.map(t => [t.id, t]));

    const next = list.map(tx => {
      if (!tx) return tx;
      if (tx.tournamentId) {
        const t = byId.get(String(tx.tournamentId).replace(/^cal_/, ""));
        if (t && (!tx.tournamentTitle || !tx.tournamentDate || !tx.tournamentVenue)) {
          changed = true;
          return enrichTx(tx, t);
        }
      }
      return tx;
    });

    if (changed) writeJson(TX_KEY, next);
    return next;
  }

  function patchLocalStorageSetItem(){
    if (window.__PNX_STEP53_LOCALSTORAGE_PATCHED__) return;
    window.__PNX_STEP53_LOCALSTORAGE_PATCHED__ = true;

    const original = localStorage.setItem.bind(localStorage);

    localStorage.setItem = function(key, value){
      if (key === TX_KEY) {
        try {
          const t = selectedTournament();
          const list = JSON.parse(value || "[]");

          if (t && Array.isArray(list) && list.length) {
            const last = list[list.length - 1];
            if (last && (!last.tournamentId || !last.tournamentTitle || !last.tournamentDate || !last.tournamentVenue)) {
              enrichTx(last, t);
              value = JSON.stringify(list);
            }
          }
        } catch(e) {}
      }
      return original(key, value);
    };
  }

  function interceptSaveButtons(){
    document.addEventListener("click", function(e){
      const btn = e.target && e.target.closest ? e.target.closest(
        "#pnx-fin-save-expense, #pnx-fin-save-tournament-expense, #pnx-fin-save-income, #pnx-fin-save-ocr-expense, [data-pnx-save-finance]"
      ) : null;

      if (!btn) return;

      const t = selectedTournament();
      if (t) window.__PNX_FINANCE_SELECTED_TOURNAMENT__ = t;
    }, true);
  }

  function createDirectTransaction(kind){
    const t = selectedTournament();
    if (!t) {
      status("大会を選択してください", "error");
      return null;
    }

    const amountInput =
      kind === "income"
        ? ($("pnx-fin-income-amount") || $("pnx-fin-expense-amount"))
        : ($("pnx-fin-expense-amount") || $("pnx-fin-income-amount"));

    const categoryInput =
      kind === "income"
        ? $("pnx-fin-income-category")
        : $("pnx-fin-expense-category");

    const dateInput =
      kind === "income"
        ? ($("pnx-fin-income-date") || $("pnx-fin-expense-date"))
        : ($("pnx-fin-expense-date") || $("pnx-fin-income-date"));

    const memoInput =
      kind === "income"
        ? ($("pnx-fin-income-memo") || $("pnx-fin-expense-memo"))
        : ($("pnx-fin-expense-memo") || $("pnx-fin-income-memo"));

    const amount = Number(amountInput && amountInput.value || 0);
    if (!amount) {
      status("金額を入力してください", "error");
      return null;
    }

    const tx = enrichTx({
      id: "tx_" + kind + "_" + Date.now(),
      type: kind,
      category: categoryInput && categoryInput.value || (kind === "income" ? "prize" : "other"),
      amount: Math.abs(amount),
      date: dateInput && dateInput.value || t.startDate || new Date().toISOString().slice(0,10),
      memo: memoInput && memoInput.value || "",
      source: "tournament",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, t);

    const list = readJson(TX_KEY, []);
    list.push(tx);
    writeJson(TX_KEY, list);

    window.dispatchEvent(new CustomEvent("pnx:finance:transaction-saved", { detail:{ transaction:tx } }));

    try { if (window.PNXFinanceRenderTransactionList) window.PNXFinanceRenderTransactionList(); } catch(e) {}
    try { if (window.PNXFinanceRenderTournamentSummary) window.PNXFinanceRenderTournamentSummary(); } catch(e) {}
    try { if (window.PNXFinanceRenderProfitSummary) window.PNXFinanceRenderProfitSummary(); } catch(e) {}
    try { if (window.PNXFinanceRenderAccuracySummary) window.PNXFinanceRenderAccuracySummary(); } catch(e) {}
    try { if (window.PNXFinanceRenderTaxSummary) window.PNXFinanceRenderTaxSummary(); } catch(e) {}

    status("保存しました：" + t.title + " / " + yen(amount), "success");
    renderLinkedList();

    return tx;
  }

  function status(message, type){
    const el = $("pnx-fin-link-save-status") || $("pnx-fin-link-status");
    if (!el) return;
    el.textContent = message;
    el.classList.remove("is-success", "is-error");
    if (type) el.classList.add(type === "success" ? "is-success" : "is-error");
  }

  function renderLinkedList(){
    const box = $("pnx-fin-linked-tx-list");
    if (!box) return;

    const list = readJson(TX_KEY, []).filter(tx => tx && tx.tournamentId);
    if (!list.length) {
      box.innerHTML = '<div class="pnx-step53-empty">まだ大会に紐づいた取引はありません</div>';
      return;
    }

    box.innerHTML = list.slice().reverse().slice(0, 12).map(tx => {
      const sign = tx.type === "income" ? "+" : "-";
      return `
        <div class="pnx-step53-tx">
          <div>
            <strong>${tx.tournamentTitle || "大会未設定"}</strong>
            <span>${tx.date || ""} / ${tx.category || ""}${tx.tournamentVenue ? " / " + tx.tournamentVenue : ""}</span>
          </div>
          <b class="${tx.type === "income" ? "income" : "expense"}">${sign}${yen(tx.amount)}</b>
        </div>
      `;
    }).join("");
  }

  function attachDirectSaveButtons(){
    const expenseBtn = $("pnx-step53-save-expense");
    const incomeBtn = $("pnx-step53-save-income");

    if (expenseBtn && !expenseBtn.__pnxStep53) {
      expenseBtn.__pnxStep53 = true;
      expenseBtn.addEventListener("click", function(){ createDirectTransaction("expense"); });
    }

    if (incomeBtn && !incomeBtn.__pnxStep53) {
      incomeBtn.__pnxStep53 = true;
      incomeBtn.addEventListener("click", function(){ createDirectTransaction("income"); });
    }
  }

  function runChecks(){
    const txs = normalizeAllTransactions();
    renderLinkedList();
    const linked = txs.filter(tx => tx && tx.tournamentId).length;
    status(`大会紐づき取引: ${linked}件 / 大会候補: ${tournaments().length}件`, "success");
  }

  document.addEventListener("DOMContentLoaded", function(){
    patchLocalStorageSetItem();
    interceptSaveButtons();
    attachDirectSaveButtons();

    setTimeout(function(){
      normalizeAllTransactions();
      renderLinkedList();
    }, 600);

    setTimeout(function(){
      try {
        window.parent && window.parent.postMessage({ type:"PNX_REQUEST_TOURNAMENTS_FOR_FINANCE" }, "*");
      } catch(e) {}
    }, 700);
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type === "PNX_TOURNAMENTS_FOR_FINANCE_UPDATED") {
      setTimeout(function(){
        normalizeAllTransactions();
        renderLinkedList();
      }, 120);
    }
  });

  window.addEventListener("storage", function(e){
    if (e.key === TX_KEY) renderLinkedList();
  });

  window.PNXFinanceEnrichTransactionWithTournament = enrichTx;
  window.PNXFinanceNormalizeTournamentTransactions = normalizeAllTransactions;
  window.PNXFinanceCreateTournamentTransaction = createDirectTransaction;
  window.PNXFinanceCheckTournamentPersistence = runChecks;
})();


/* ================================================================
   STEP54: Tournament Finance Summary Complete
   tournamentId付き収支を大会別収入/支出/利益/税務/CSVへ完全反映
   ================================================================ */
(function(){
  if (window.__PNX_STEP54_TOURNAMENT_SUMMARY_COMPLETE__) return;
  window.__PNX_STEP54_TOURNAMENT_SUMMARY_COMPLETE__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";

  const TAX_CATEGORY_MAP_FALLBACK = {
    entryFee:{taxCategory:"諸会費", taxCode:"dues"},
    transport:{taxCategory:"旅費交通費", taxCode:"travel_transport"},
    hotel:{taxCategory:"旅費交通費", taxCode:"travel_transport"},
    meal:{taxCategory:"会議費・接待交際費", taxCode:"meeting_entertainment"},
    practice:{taxCategory:"研修費・練習費", taxCode:"training"},
    other:{taxCategory:"雑費", taxCode:"misc"},
    prize:{taxCategory:"事業収入", taxCode:"business_income"},
    sponsor:{taxCategory:"事業収入", taxCode:"business_income"},
    lesson:{taxCategory:"事業収入", taxCode:"business_income"}
  };

  function $(id){ return document.getElementById(id); }

  function readJson(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(e){ return fallback; }
  }

  function writeJson(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
    return value;
  }

  function yen(n){
    return "¥" + Number(n || 0).toLocaleString("ja-JP");
  }

  function taxMap(category, type){
    if (type === "income") return {taxCategory:"事業収入", taxCode:"business_income"};
    const map = window.PNXFinanceTaxCategoryMap || TAX_CATEGORY_MAP_FALLBACK;
    return map[category] || map.other || {taxCategory:"雑費", taxCode:"misc"};
  }

  function normalizeTx(tx){
    if (!tx) return null;

    const type = tx.type === "income" ? "income" : "expense";
    const amount = Math.abs(Number(tx.amount || 0));
    const tournamentId = String(tx.tournamentId || tx._tournamentId || "").replace(/^cal_/, "");
    const tournamentTitle = tx.tournamentTitle || tx.tournamentName || tx.title || tx.name || "";
    const date = tx.date || tx.transactionDate || tx.createdAt && String(tx.createdAt).slice(0,10) || "";

    return Object.assign({}, tx, {
      type,
      amount,
      tournamentId,
      tournamentTitle,
      tournamentDate: tx.tournamentDate || tx.startDate || tx.date || "",
      tournamentVenue: tx.tournamentVenue || tx.venue || tx.place || "",
      date,
      category: tx.category || (type === "income" ? "prize" : "other")
    });
  }

  function readTransactions(){
    return readJson(TX_KEY, [])
      .map(normalizeTx)
      .filter(tx => tx && tx.amount && tx.tournamentId && tx.tournamentTitle);
  }

  function calculate(){
    const txs = readTransactions();

    const result = {
      total:{ income:0, expense:0, profit:0, count:txs.length },
      tournaments:[],
      taxCategories:[],
      monthly:[],
      raw:txs
    };

    const tMap = {};
    const tax = {};
    const month = {};

    txs.forEach(tx => {
      const isIncome = tx.type === "income";

      if (isIncome) result.total.income += tx.amount;
      else result.total.expense += tx.amount;

      const tid = tx.tournamentId;
      if (!tMap[tid]) {
        tMap[tid] = {
          tournamentId:tid,
          title:tx.tournamentTitle,
          date:tx.tournamentDate || "",
          venue:tx.tournamentVenue || "",
          income:0,
          expense:0,
          profit:0,
          count:0,
          categories:{},
          taxCategories:{},
          transactions:[]
        };
      }

      const g = tMap[tid];
      if (isIncome) g.income += tx.amount;
      else g.expense += tx.amount;
      g.count += 1;
      g.transactions.push(tx);
      g.categories[tx.category] = (g.categories[tx.category] || 0) + tx.amount;

      const mapped = taxMap(tx.category, tx.type);
      const taxKey = mapped.taxCode || mapped.taxCategory;
      g.taxCategories[taxKey] = g.taxCategories[taxKey] || {
        taxCode:taxKey,
        taxCategory:mapped.taxCategory,
        income:0,
        expense:0,
        count:0
      };
      if (isIncome) g.taxCategories[taxKey].income += tx.amount;
      else g.taxCategories[taxKey].expense += tx.amount;
      g.taxCategories[taxKey].count += 1;

      if (!tax[taxKey]) tax[taxKey] = {
        taxCode:taxKey,
        taxCategory:mapped.taxCategory,
        income:0,
        expense:0,
        profit:0,
        count:0
      };
      if (isIncome) tax[taxKey].income += tx.amount;
      else tax[taxKey].expense += tx.amount;
      tax[taxKey].count += 1;

      const m = String(tx.date || tx.tournamentDate || "").slice(0,7) || "未設定";
      if (!month[m]) month[m] = { month:m, income:0, expense:0, profit:0, count:0 };
      if (isIncome) month[m].income += tx.amount;
      else month[m].expense += tx.amount;
      month[m].count += 1;
    });

    result.total.profit = result.total.income - result.total.expense;

    result.tournaments = Object.values(tMap).map(g => {
      g.profit = g.income - g.expense;
      g.taxCategories = Object.values(g.taxCategories).map(x => {
        x.profit = x.income - x.expense;
        return x;
      });
      return g;
    }).sort((a,b) => b.profit - a.profit);

    result.taxCategories = Object.values(tax).map(x => {
      x.profit = x.income - x.expense;
      return x;
    }).sort((a,b) => (b.income + b.expense) - (a.income + a.expense));

    result.monthly = Object.values(month).map(m => {
      m.profit = m.income - m.expense;
      return m;
    }).sort((a,b) => String(b.month).localeCompare(String(a.month)));

    return result;
  }

  function render(){
    const box = $("pnx-step54-summary-body");
    const status = $("pnx-step54-summary-status");
    if (!box) return;

    const data = calculate();

    if (status) {
      status.textContent = `大会別集計: ${data.tournaments.length}大会 / ${data.total.count}取引`;
    }

    if (!data.total.count) {
      box.innerHTML = '<div class="pnx-step54-empty">まだ大会に紐づいた収支データがありません</div>';
      return;
    }

    const totalPlus = data.total.profit >= 0;

    const tournamentRows = data.tournaments.map(t => {
      const plus = t.profit >= 0;
      const taxSummary = t.taxCategories.map(x => `${x.taxCategory} ${yen(x.income + x.expense)}`).join(" / ");
      return `
        <article class="pnx-step54-card">
          <div class="pnx-step54-card-top">
            <div>
              <strong>${t.title}</strong>
              <span>${t.date || ""}${t.venue ? " / " + t.venue : ""} / ${t.count}取引</span>
            </div>
            <b class="${plus ? "plus" : "minus"}">${plus ? "+" : "-"}${yen(Math.abs(t.profit))}</b>
          </div>
          <div class="pnx-step54-grid">
            <div><span>収入</span><strong class="income">${yen(t.income)}</strong></div>
            <div><span>支出</span><strong class="expense">${yen(t.expense)}</strong></div>
            <div><span>利益</span><strong class="${plus ? "income" : "expense"}">${plus ? "+" : "-"}${yen(Math.abs(t.profit))}</strong></div>
          </div>
          <p>${taxSummary || "税務カテゴリ未設定"}</p>
        </article>
      `;
    }).join("");

    const taxRows = data.taxCategories.map(x => {
      return `
        <div class="pnx-step54-tax-row">
          <span>${x.taxCategory}</span>
          <strong>収入 ${yen(x.income)} / 支出 ${yen(x.expense)}</strong>
        </div>
      `;
    }).join("");

    box.innerHTML = `
      <div class="pnx-step54-total">
        <div><span>総収入</span><strong class="income">${yen(data.total.income)}</strong></div>
        <div><span>総支出</span><strong class="expense">${yen(data.total.expense)}</strong></div>
        <div><span>総利益</span><strong class="${totalPlus ? "income" : "expense"}">${totalPlus ? "+" : "-"}${yen(Math.abs(data.total.profit))}</strong></div>
      </div>

      <div class="pnx-step54-section-title">大会別収支</div>
      <div class="pnx-step54-list">${tournamentRows}</div>

      <div class="pnx-step54-section-title">税務カテゴリ反映</div>
      <div class="pnx-step54-tax-list">${taxRows}</div>
    `;
  }

  function csvEscape(v){
    const s = String(v == null ? "" : v);
    return '"' + s.replace(/"/g, '""') + '"';
  }

  function makeTournamentSummaryCsv(){
    const data = calculate();
    const rows = [["大会ID","大会名","開催日","会場","収入","支出","利益","取引数"]];
    data.tournaments.forEach(t => {
      rows.push([t.tournamentId, t.title, t.date, t.venue, t.income, t.expense, t.profit, t.count]);
    });
    return rows.map(row => row.map(csvEscape).join(",")).join("\n");
  }

  function makeTournamentTransactionCsv(){
    const txs = readTransactions();
    const rows = [["日付","大会ID","大会名","会場","種別","カテゴリ","税務カテゴリ","金額","メモ","取引ID"]];
    txs.forEach(tx => {
      const mapped = taxMap(tx.category, tx.type);
      rows.push([
        tx.date,
        tx.tournamentId,
        tx.tournamentTitle,
        tx.tournamentVenue,
        tx.type === "income" ? "収入" : "支出",
        tx.category,
        mapped.taxCategory,
        tx.amount,
        tx.memo || "",
        tx.id || ""
      ]);
    });
    return rows.map(row => row.map(csvEscape).join(",")).join("\n");
  }

  function download(filename, csv){
    const blob = new Blob(["\ufeff" + csv], { type:"text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function bindButtons(){
    const refresh = $("pnx-step54-refresh");
    const csvSummary = $("pnx-step54-export-summary-csv");
    const csvTx = $("pnx-step54-export-transaction-csv");

    if (refresh && !refresh.__pnxStep54) {
      refresh.__pnxStep54 = true;
      refresh.addEventListener("click", render);
    }

    if (csvSummary && !csvSummary.__pnxStep54) {
      csvSummary.__pnxStep54 = true;
      csvSummary.addEventListener("click", function(){
        download("pronexax_tournament_summary.csv", makeTournamentSummaryCsv());
      });
    }

    if (csvTx && !csvTx.__pnxStep54) {
      csvTx.__pnxStep54 = true;
      csvTx.addEventListener("click", function(){
        download("pronexax_tournament_transactions.csv", makeTournamentTransactionCsv());
      });
    }
  }

  // 既存CSV関数を壊さず、大会ID付き取引CSVへ寄せる
  window.PNXFinanceMakeTournamentSummaryCsv = makeTournamentSummaryCsv;
  window.PNXFinanceMakeTournamentTransactionCsv = makeTournamentTransactionCsv;
  window.PNXFinanceCalculateTournamentAnalytics = calculate;
  window.PNXFinanceRenderTournamentAnalyticsComplete = render;

  document.addEventListener("DOMContentLoaded", function(){
    bindButtons();
    setTimeout(render, 500);
    setTimeout(render, 1200);
  });

  window.addEventListener("pnx:finance:transaction-saved", function(){
    setTimeout(render, 80);
  });

  window.addEventListener("storage", function(e){
    if (e.key === TX_KEY) render();
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type === "PNX_TOURNAMENTS_FOR_FINANCE_UPDATED") {
      setTimeout(render, 200);
    }
  });
})();


/* STEP54 refresh analytics message patch */
window.addEventListener("message", function(event){
  const data = event.data || {};
  if (data.type === "PNX_FINANCE_REFRESH_ANALYTICS") {
    try { if (window.PNXFinanceRenderTournamentAnalyticsComplete) window.PNXFinanceRenderTournamentAnalyticsComplete(); } catch(e) {}
  }
});


/* ================================================================
   STEP55: Tax Report Tournament Reflection
   大会別収支をPDF/税理士共有レポートへ完全反映
   ================================================================ */
(function(){
  if (window.__PNX_STEP55_TAX_REPORT_TOURNAMENT_REFLECT__) return;
  window.__PNX_STEP55_TAX_REPORT_TOURNAMENT_REFLECT__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";

  function $(id){ return document.getElementById(id); }

  function readJson(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(e){ return fallback; }
  }

  function yen(n){
    return "¥" + Number(n || 0).toLocaleString("ja-JP");
  }

  function fallbackCalculate(){
    const list = readJson(TX_KEY, []).filter(tx => tx && tx.tournamentId);
    const total = { income:0, expense:0, profit:0, count:list.length };
    const tournaments = {};
    const taxCategories = {};

    list.forEach(tx => {
      const type = tx.type === "income" ? "income" : "expense";
      const amount = Math.abs(Number(tx.amount || 0));
      const tid = String(tx.tournamentId || "").replace(/^cal_/, "");
      const title = tx.tournamentTitle || tx.tournamentName || "大会未設定";

      if (type === "income") total.income += amount;
      else total.expense += amount;

      if (!tournaments[tid]) {
        tournaments[tid] = {
          tournamentId: tid,
          title,
          date: tx.tournamentDate || "",
          venue: tx.tournamentVenue || "",
          income:0,
          expense:0,
          profit:0,
          count:0
        };
      }

      if (type === "income") tournaments[tid].income += amount;
      else tournaments[tid].expense += amount;
      tournaments[tid].count += 1;

      const taxName = type === "income" ? "事業収入" : (tx.taxCategory || tx.category || "未分類");
      if (!taxCategories[taxName]) {
        taxCategories[taxName] = { taxCategory:taxName, income:0, expense:0, profit:0, count:0 };
      }
      if (type === "income") taxCategories[taxName].income += amount;
      else taxCategories[taxName].expense += amount;
      taxCategories[taxName].count += 1;
    });

    total.profit = total.income - total.expense;

    const ts = Object.values(tournaments).map(t => {
      t.profit = t.income - t.expense;
      return t;
    }).sort((a,b) => b.profit - a.profit);

    const taxes = Object.values(taxCategories).map(t => {
      t.profit = t.income - t.expense;
      return t;
    }).sort((a,b) => (b.income+b.expense) - (a.income+a.expense));

    return { total, tournaments:ts, taxCategories:taxes, raw:list };
  }

  function calculate(){
    try {
      if (window.PNXFinanceCalculateTournamentAnalytics) {
        const data = window.PNXFinanceCalculateTournamentAnalytics();
        if (data && data.total) return data;
      }
    } catch(e) {}
    return fallbackCalculate();
  }

  function makeReportHtml(){
    const data = calculate();
    const createdAt = new Date().toLocaleString("ja-JP");
    const profitPlus = data.total.profit >= 0;

    const tournamentRows = (data.tournaments || []).map(t => {
      const p = t.profit >= 0;
      return `
        <tr>
          <td>${t.title || ""}</td>
          <td>${t.date || ""}</td>
          <td>${t.venue || ""}</td>
          <td class="num">${yen(t.income)}</td>
          <td class="num">${yen(t.expense)}</td>
          <td class="num ${p ? "plus" : "minus"}">${p ? "+" : "-"}${yen(Math.abs(t.profit))}</td>
          <td class="num">${t.count || 0}</td>
        </tr>
      `;
    }).join("");

    const taxRows = (data.taxCategories || []).map(t => {
      return `
        <tr>
          <td>${t.taxCategory || ""}</td>
          <td class="num">${yen(t.income)}</td>
          <td class="num">${yen(t.expense)}</td>
          <td class="num">${t.count || 0}</td>
        </tr>
      `;
    }).join("");

    return `
      <article class="pnx-step55-report">
        <header class="pnx-step55-report-head">
          <div>
            <div class="brand">ProNexaX Finance</div>
            <h1>大会別収支・申告準備レポート</h1>
            <p>作成日：${createdAt}</p>
          </div>
          <div class="stamp">Tax Report</div>
        </header>

        <section class="pnx-step55-summary">
          <div><span>大会数</span><strong>${(data.tournaments || []).length}件</strong></div>
          <div><span>取引数</span><strong>${data.total.count || 0}件</strong></div>
          <div><span>総収入</span><strong class="income">${yen(data.total.income)}</strong></div>
          <div><span>総支出</span><strong class="expense">${yen(data.total.expense)}</strong></div>
          <div><span>総利益</span><strong class="${profitPlus ? "income" : "expense"}">${profitPlus ? "+" : "-"}${yen(Math.abs(data.total.profit))}</strong></div>
        </section>

        <section class="pnx-step55-section">
          <h2>大会別損益</h2>
          <table>
            <thead>
              <tr>
                <th>大会名</th>
                <th>開催日</th>
                <th>会場</th>
                <th>収入</th>
                <th>支出</th>
                <th>利益</th>
                <th>取引数</th>
              </tr>
            </thead>
            <tbody>
              ${tournamentRows || '<tr><td colspan="7">大会別収支データがありません</td></tr>'}
            </tbody>
          </table>
        </section>

        <section class="pnx-step55-section">
          <h2>税務カテゴリ集計</h2>
          <table>
            <thead>
              <tr>
                <th>税務カテゴリ</th>
                <th>収入</th>
                <th>支出</th>
                <th>取引数</th>
              </tr>
            </thead>
            <tbody>
              ${taxRows || '<tr><td colspan="4">税務カテゴリデータがありません</td></tr>'}
            </tbody>
          </table>
        </section>

        <footer class="pnx-step55-note">
          ※このレポートは申告準備・税理士共有用の参考資料です。実際の申告内容は税理士または専門家に確認してください。
        </footer>
      </article>
    `;
  }

  function render(){
    const box = $("pnx-step55-report-preview");
    const status = $("pnx-step55-report-status");
    if (!box) return;

    box.innerHTML = makeReportHtml();

    const data = calculate();
    if (status) {
      status.textContent = `レポート作成済み：${(data.tournaments || []).length}大会 / ${data.total.count || 0}取引`;
    }
  }

  function printReport(){
    render();
    setTimeout(function(){
      window.print();
    }, 120);
  }

  function bind(){
    const refresh = $("pnx-step55-report-refresh");
    const print = $("pnx-step55-report-print");

    if (refresh && !refresh.__pnxStep55) {
      refresh.__pnxStep55 = true;
      refresh.addEventListener("click", render);
    }

    if (print && !print.__pnxStep55) {
      print.__pnxStep55 = true;
      print.addEventListener("click", printReport);
    }
  }

  window.PNXFinanceRenderTaxReportComplete = render;
  window.PNXFinanceMakeTaxReportHtml = makeReportHtml;
  window.PNXFinancePrintTaxReportComplete = printReport;

  document.addEventListener("DOMContentLoaded", function(){
    bind();
    setTimeout(render, 700);
    setTimeout(render, 1500);
  });

  window.addEventListener("pnx:finance:transaction-saved", function(){
    setTimeout(render, 100);
  });

  window.addEventListener("storage", function(e){
    if (e.key === TX_KEY) render();
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_FINANCE_REFRESH_ANALYTICS" ||
      data.type === "PNX_TOURNAMENTS_FOR_FINANCE_UPDATED"
    ) {
      setTimeout(render, 150);
    }
  });
})();


/* ================================================================
   STEP138: Finance-side tournament data link
   目的:
   - 本体から受け取った大会データを収支ページで安定利用する
   - カレンダー追加済み大会を優先表示
   - entryFeeを数値化して、エントリー費入力の初期値に使う
   ================================================================ */
(function(){
  if (window.__PNX_STEP138_FINANCE_TOURNAMENT_DATA_LINK__) return;
  window.__PNX_STEP138_FINANCE_TOURNAMENT_DATA_LINK__ = true;

  function text(v){ return String(v == null ? "" : v).trim(); }

  function parseYen(value){
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const s = text(value).replace(/,/g, "").replace(/\s+/g, "");
    if (!s) return 0;
    const n = Number((s.match(/-?\d+(?:\.\d+)?/) || [0])[0]);
    if (!Number.isFinite(n)) return 0;
    if (/億/.test(s)) return Math.round(n * 100000000);
    if (/万/.test(s)) return Math.round(n * 10000);
    return Math.round(n);
  }

  function cleanKeyPart(v){
    return text(v).toLowerCase().replace(/\s+/g, "").replace(/[‐‑‒–—ー－\-・･.。]/g, "");
  }

  function normalizeTournament(t){
    t = t || {};
    const title = text(t.title || t.name || t.tournamentTitle || t.originalTitle || t.calendarTitle) || "大会";
    const startDate = text(t.startDate || t.date || t.start);
    const endDate = text(t.endDate || t.end || startDate) || startDate;
    const venue = text(t.venue || t.course || t.place || t.location);
    const id = text(t.id || t.tournamentId || t._tournamentId) || ("tour_" + cleanKeyPart(title).slice(0,40) + "_" + startDate.replace(/-/g,""));
    const entryFeeText = text(t.entryFee || t.entryFeeText || t.fee || t.participationFee);

    return Object.assign({}, t, {
      id,
      tournamentId:id,
      title,
      name:title,
      startDate,
      date:startDate,
      endDate,
      venue,
      course:venue,
      place:venue,
      category:text(t.category || t.cat || t.rawCategory || t.displayCategory) || "その他",
      entryFee: entryFeeText,
      entryFeeNumber: Number(t.entryFeeNumber || t.entryFeeAmount || 0) || parseYen(entryFeeText),
      totalPrize: text(t.totalPrize || t.prize || t.prizeTotal),
      calendarAdded: !!t.calendarAdded,
      source:t.source || "finance",
      financeReady:true
    });
  }

  function signature(list){
    return (Array.isArray(list) ? list : []).map(t => [
      t.id || t.tournamentId || "",
      t.title || t.name || "",
      t.startDate || t.date || "",
      t.venue || t.course || "",
      t.calendarAdded ? "1" : "0"
    ].join(":")).join("|");
  }

  function setTournaments(list, reason){
    const normalized = (Array.isArray(list) ? list : []).map(normalizeTournament);

    const map = new Map();
    normalized.forEach(t => {
      const key = t.tournamentId || t.id || ("td:" + cleanKeyPart(t.title) + "@" + t.startDate);
      if (!key) return;

      if (!map.has(key)) {
        map.set(key, t);
      } else {
        const prev = map.get(key);
        map.set(key, Object.assign({}, prev, t, {
          calendarAdded: !!(prev.calendarAdded || t.calendarAdded),
          source: prev.source === t.source ? prev.source : [prev.source, t.source].filter(Boolean).join("+")
        }));
      }
    });

    const out = Array.from(map.values()).sort((a,b) => {
      if (a.calendarAdded !== b.calendarAdded) return a.calendarAdded ? -1 : 1;
      return String(a.startDate || "9999-99-99").localeCompare(String(b.startDate || "9999-99-99"));
    });

    window.PNXFinanceTournaments = out;
    window.__PNX_STEP138_LAST_FINANCE_TOURNAMENTS__ = {
      at:new Date().toISOString(),
      reason:reason || "set",
      count:out.length,
      calendarAddedCount:out.filter(t => t.calendarAdded).length,
      signature:signature(out)
    };

    try {
      window.dispatchEvent(new CustomEvent("pnx:finance:tournaments-updated", {
        detail:{ tournaments:out, reason:reason || "set" }
      }));
    } catch(e) {}

    return out;
  }

  // 古い安定化関数を拡張。重複ログ/連続更新は既存ガードに任せる。
  const previousAccept = window.PNXFinanceAcceptTournamentsStable;
  window.PNXFinanceAcceptTournamentsStable = function(payload){
    const normalized = (Array.isArray(payload) ? payload : []).map(normalizeTournament);

    if (typeof previousAccept === "function") {
      const accepted = previousAccept(normalized);
      if (!accepted) return false;
    }

    setTournaments(normalized, "accept-stable");
    return true;
  };

  function renderAllFinanceTournamentViews(){
    try { if (window.PNXFinanceRenderTournamentOptions) window.PNXFinanceRenderTournamentOptions(); } catch(e) {}
    try { if (window.PNXFinanceRenderIncomeTournamentOptions) window.PNXFinanceRenderIncomeTournamentOptions(); } catch(e) {}
    try { if (window.PNXFinanceRenderTournamentSummary) window.PNXFinanceRenderTournamentSummary(); } catch(e) {}
    try { if (window.PNXFinanceRenderProfitSummary) window.PNXFinanceRenderProfitSummary(); } catch(e) {}
  }

  function optionLabel(t){
    const badge = t.calendarAdded ? "★ " : "";
    const date = t.startDate ? "（" + t.startDate + "）" : "";
    const fee = t.entryFeeNumber ? " / " + Number(t.entryFeeNumber).toLocaleString("ja-JP") + "円" : "";
    return badge + t.title + date + fee;
  }

  function improveSelectLabels(){
    const selects = [
      document.getElementById("pnx-fin-tournament-select"),
      document.getElementById("pnx-fin-income-tournament-select")
    ].filter(Boolean);

    selects.forEach(select => {
      Array.from(select.options).forEach(opt => {
        if (!opt.value) return;
        const t = (window.PNXFinanceTournaments || []).find(item => String(item.id || item.tournamentId) === String(opt.value));
        if (!t) return;
        opt.textContent = optionLabel(t);
      });
    });
  }

  function applySelectedDefaults(selectId, amountId, dateId, memoId){
    const select = document.getElementById(selectId);
    if (!select) return;

    const t = (window.PNXFinanceTournaments || []).find(item => String(item.id || item.tournamentId) === String(select.value));
    if (!t) return;

    const amount = document.getElementById(amountId);
    const date = document.getElementById(dateId);
    const memo = document.getElementById(memoId);

    if (amount && !amount.value && t.entryFeeNumber && /expense/.test(amountId)) {
      amount.value = String(t.entryFeeNumber);
    }
    if (date && !date.value && t.startDate) date.value = t.startDate;
    if (memo && !memo.value) {
      memo.value = t.venue ? `${t.venue} / ${t.category || "大会"}` : (t.category || "大会");
    }
  }

  document.addEventListener("change", function(e){
    const target = e.target;
    if (!target) return;

    if (target.id === "pnx-fin-tournament-select") {
      applySelectedDefaults("pnx-fin-tournament-select", "pnx-fin-expense-amount", "pnx-fin-expense-date", "pnx-fin-expense-memo");
    }
    if (target.id === "pnx-fin-income-tournament-select") {
      applySelectedDefaults("pnx-fin-income-tournament-select", "pnx-fin-income-amount", "pnx-fin-income-date", "pnx-fin-income-memo");
    }
  }, true);

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type === "PNX_TOURNAMENTS_FOR_FINANCE_UPDATED") {
      setTimeout(function(){
        setTournaments(data.payload || [], "message-step138");
        renderAllFinanceTournamentViews();
        setTimeout(improveSelectLabels, 80);
      }, 0);
    }
  });

  window.addEventListener("pnx:finance:tournaments-updated", function(){
    setTimeout(improveSelectLabels, 60);
  });

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(function(){
      try {
        window.parent && window.parent.postMessage({ type:"PNX_REQUEST_TOURNAMENTS_FOR_FINANCE", source:"step138-finance-ready" }, "*");
      } catch(e) {}
    }, 400);
    setTimeout(improveSelectLabels, 1200);
  });

  window.PNXStep138FinanceSetTournaments = setTournaments;
  window.PNXStep138FinanceNormalizeTournament = normalizeTournament;
  window.PNXStep138FinanceTournamentStatus = function(){
    const list = Array.isArray(window.PNXFinanceTournaments) ? window.PNXFinanceTournaments : [];
    return {
      step:138,
      count:list.length,
      calendarAddedCount:list.filter(t => t.calendarAdded).length,
      last:window.__PNX_STEP138_LAST_FINANCE_TOURNAMENTS__ || null,
      sample:list.slice(0,10).map(t => ({
        id:t.id,
        title:t.title,
        date:t.startDate,
        venue:t.venue,
        entryFee:t.entryFee,
        entryFeeNumber:t.entryFeeNumber,
        calendarAdded:t.calendarAdded,
        source:t.source
      }))
    };
  };
})();




/* ================================================================
   STEP138b: Finance top CTA click fix
   「大会と取引を紐付ける」を押しても反応しない問題を修正。
   押すと下から大会連携シートを開く。
   ================================================================ */
(function(){
  if (window.__PNX_STEP138B_FINANCE_LINK_CTA_FIX__) return;
  window.__PNX_STEP138B_FINANCE_LINK_CTA_FIX__ = true;

  function text(v){ return String(v == null ? "" : v).trim(); }

  function yen(n){
    return Number(n || 0).toLocaleString("ja-JP") + "円";
  }

  function today(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function tournaments(){
    return Array.isArray(window.PNXFinanceTournaments) ? window.PNXFinanceTournaments : [];
  }

  function findTournament(id){
    return tournaments().find(t => String(t.id || t.tournamentId) === String(id)) || null;
  }

  function label(t){
    const mark = t.calendarAdded ? "★ " : "";
    const date = t.startDate || t.date || "";
    const fee = Number(t.entryFeeNumber || 0) ? " / " + yen(t.entryFeeNumber) : "";
    return `${mark}${t.title || t.name || "大会"}${date ? "（" + date + "）" : ""}${fee}`;
  }

  function ensureSheet(){
    let sheet = document.getElementById("pnx-fin-link-sheet");
    if (sheet) return sheet;

    sheet = document.createElement("div");
    sheet.id = "pnx-fin-link-sheet";
    sheet.className = "pnx-fin-link-sheet";
    sheet.innerHTML = `
      <div class="pnx-fin-link-backdrop" data-pnx-fin-link-close="1"></div>
      <div class="pnx-fin-link-panel" role="dialog" aria-modal="true" aria-label="大会と取引を紐付ける">
        <div class="pnx-fin-link-handle"></div>

        <div class="pnx-fin-link-head">
          <div>
            <p class="pnx-fin-link-kicker">Tournament Link</p>
            <h2>大会と取引を紐付ける</h2>
            <p>大会を選ぶと、エントリー費・日付・メモを自動補助します。</p>
          </div>
          <button type="button" class="pnx-fin-link-close" data-pnx-fin-link-close="1">×</button>
        </div>

        <div class="pnx-fin-link-body">
          <label class="pnx-fin-link-field">
            <span>大会</span>
            <select id="pnx-fin-link-tournament-select">
              <option value="">大会を読み込み中...</option>
            </select>
          </label>

          <div class="pnx-fin-link-grid">
            <label class="pnx-fin-link-field">
              <span>取引種別</span>
              <select id="pnx-fin-link-type">
                <option value="expense">支出</option>
                <option value="income">収入</option>
              </select>
            </label>

            <label class="pnx-fin-link-field">
              <span>カテゴリ</span>
              <select id="pnx-fin-link-category">
                <option value="entryFee">エントリー費</option>
                <option value="transport">交通費</option>
                <option value="hotel">宿泊費</option>
                <option value="meal">食費</option>
                <option value="practice">練習費</option>
                <option value="prize">賞金</option>
                <option value="sponsor">スポンサー料</option>
                <option value="other">その他</option>
              </select>
            </label>

            <label class="pnx-fin-link-field">
              <span>金額</span>
              <input id="pnx-fin-link-amount" type="number" inputmode="numeric" placeholder="例：30000">
            </label>

            <label class="pnx-fin-link-field">
              <span>日付</span>
              <input id="pnx-fin-link-date" type="date">
            </label>
          </div>

          <label class="pnx-fin-link-field">
            <span>メモ</span>
            <input id="pnx-fin-link-memo" type="text" placeholder="例：エントリー費 / 交通費">
          </label>

          <div class="pnx-fin-link-actions">
            <button type="button" id="pnx-fin-link-refresh" class="pnx-fin-link-sub">大会を再読込</button>
            <button type="button" id="pnx-fin-link-save" class="pnx-fin-link-main">取引を保存</button>
          </div>

          <div id="pnx-fin-link-status" class="pnx-fin-link-status">大会データを読み込んでいます</div>
        </div>
      </div>
    `;

    document.body.appendChild(sheet);

    sheet.addEventListener("click", function(e){
      if (e.target && e.target.dataset && e.target.dataset.pnxFinLinkClose) {
        closeSheet();
      }
    });

    sheet.querySelector("#pnx-fin-link-refresh").addEventListener("click", requestAndRender);
    sheet.querySelector("#pnx-fin-link-save").addEventListener("click", saveTransaction);
    sheet.querySelector("#pnx-fin-link-tournament-select").addEventListener("change", applyTournamentDefaults);
    sheet.querySelector("#pnx-fin-link-type").addEventListener("change", applyTypeDefaults);
    sheet.querySelector("#pnx-fin-link-category").addEventListener("change", applyCategoryDefaults);

    return sheet;
  }

  function status(message, type){
    const el = document.getElementById("pnx-fin-link-status");
    if (!el) return;
    el.textContent = message;
    el.classList.remove("is-success", "is-error");
    if (type) el.classList.add(type === "success" ? "is-success" : "is-error");
  }

  function renderOptions(){
    const select = document.getElementById("pnx-fin-link-tournament-select");
    if (!select) return;

    const current = select.value;
    const list = tournaments();

    select.innerHTML = '<option value="">大会を選択</option>' + list.map(t => {
      const id = t.id || t.tournamentId || "";
      return `<option value="${String(id).replace(/"/g,'&quot;')}">${label(t)}</option>`;
    }).join("");

    if (current && list.some(t => String(t.id || t.tournamentId) === String(current))) {
      select.value = current;
    }

    status(list.length ? `${list.length}件の大会を読み込みました` : "大会がまだありません。試合検索でカレンダー追加、またはCMS反映してください。", list.length ? "success" : "");
  }

  function requestTournaments(){
    try {
      if (window.PNXFinanceSafeRequestTournaments) {
        window.PNXFinanceSafeRequestTournaments(true);
      } else {
        window.parent && window.parent.postMessage({ type:"PNX_REQUEST_TOURNAMENTS_FOR_FINANCE", source:"step138b-link-sheet" }, "*");
      }
    } catch(e) {}
  }

  function requestAndRender(){
    requestTournaments();
    status("大会データを再読込中...");
    setTimeout(renderOptions, 250);
    setTimeout(renderOptions, 900);
  }

  function selectedTournament(){
    const select = document.getElementById("pnx-fin-link-tournament-select");
    if (!select || !select.value) return null;
    return findTournament(select.value);
  }

  function applyTypeDefaults(){
    const type = document.getElementById("pnx-fin-link-type");
    const category = document.getElementById("pnx-fin-link-category");
    if (!type || !category) return;

    if (type.value === "income") {
      category.innerHTML = `
        <option value="prize">賞金</option>
        <option value="sponsor">スポンサー料</option>
        <option value="lesson">レッスン料</option>
        <option value="other">その他</option>
      `;
    } else {
      category.innerHTML = `
        <option value="entryFee">エントリー費</option>
        <option value="transport">交通費</option>
        <option value="hotel">宿泊費</option>
        <option value="meal">食費</option>
        <option value="practice">練習費</option>
        <option value="other">その他</option>
      `;
    }
    applyCategoryDefaults();
  }

  function applyCategoryDefaults(){
    const t = selectedTournament();
    const type = document.getElementById("pnx-fin-link-type");
    const category = document.getElementById("pnx-fin-link-category");
    const amount = document.getElementById("pnx-fin-link-amount");
    if (!t || !type || !category || !amount) return;

    if (type.value === "expense" && category.value === "entryFee" && !amount.value && Number(t.entryFeeNumber || 0)) {
      amount.value = String(t.entryFeeNumber);
    }
  }

  function applyTournamentDefaults(){
    const t = selectedTournament();
    if (!t) return;

    const type = document.getElementById("pnx-fin-link-type");
    const category = document.getElementById("pnx-fin-link-category");
    const amount = document.getElementById("pnx-fin-link-amount");
    const date = document.getElementById("pnx-fin-link-date");
    const memo = document.getElementById("pnx-fin-link-memo");

    if (date && !date.value) date.value = t.startDate || t.date || today();

    if (type && type.value === "expense" && category && category.value === "entryFee" && amount && !amount.value && Number(t.entryFeeNumber || 0)) {
      amount.value = String(t.entryFeeNumber);
    }

    if (memo && !memo.value) {
      const venue = t.venue || t.course || t.place || "";
      const cat = t.category || t.cat || "大会";
      memo.value = venue ? `${venue} / ${cat}` : cat;
    }

    status(`${t.title || t.name || "大会"} を選択中`, "success");
  }

  function saveTransaction(){
    const t = selectedTournament();
    if (!t) {
      status("大会を選択してください", "error");
      return;
    }

    const type = document.getElementById("pnx-fin-link-type").value || "expense";
    const category = document.getElementById("pnx-fin-link-category").value || "entryFee";
    const amount = Number(document.getElementById("pnx-fin-link-amount").value || 0);
    const date = document.getElementById("pnx-fin-link-date").value || t.startDate || t.date || today();
    const memo = text(document.getElementById("pnx-fin-link-memo").value) || "大会に紐づく取引";

    if (!amount) {
      status("金額を入力してください", "error");
      return;
    }

    const payload = {
      tournamentId: t.id || t.tournamentId,
      tournamentTitle: t.title || t.name || "",
      type,
      category,
      amount,
      date,
      memo,
      source:"tournament"
    };

    try {
      window.parent && window.parent.postMessage({
        type:"PNX_CREATE_TOURNAMENT_FINANCE_TRANSACTION",
        payload
      }, "*");

      status(`保存しました：${payload.tournamentTitle} / ${yen(amount)}`, "success");

      try {
        if (window.PNXFinanceRenderTransactionList) setTimeout(window.PNXFinanceRenderTransactionList, 120);
        if (window.PNXFinanceRenderTournamentSummary) setTimeout(window.PNXFinanceRenderTournamentSummary, 160);
        if (window.PNXFinanceRenderProfitSummary) setTimeout(window.PNXFinanceRenderProfitSummary, 180);
      } catch(e) {}
    } catch(e) {
      status("保存に失敗しました", "error");
    }
  }

  function openSheet(){
    const sheet = ensureSheet();
    sheet.classList.add("is-open");
    document.documentElement.classList.add("pnx-fin-link-open");
    document.body.classList.add("pnx-fin-link-open");

    requestAndRender();

    setTimeout(function(){
      const select = document.getElementById("pnx-fin-link-tournament-select");
      if (select) select.focus({ preventScroll:true });
    }, 260);

    window.__PNX_STEP138B_LAST_OPEN__ = new Date().toISOString();
  }

  function closeSheet(){
    const sheet = document.getElementById("pnx-fin-link-sheet");
    if (!sheet) return;
    sheet.classList.remove("is-open");
    document.documentElement.classList.remove("pnx-fin-link-open");
    document.body.classList.remove("pnx-fin-link-open");
  }

  function bindOverviewCTA(){
    /* STEP138e_SAFE_BIND_OVERVIEW_CTA
       以前は「大会と取引を紐付ける」を含むdivを広く拾っていたため、
       finance-rootやタブ周辺までクリック対象になる可能性があった。
       ここでは本物の導線カードだけに限定する。 */

    const blockedSelectors = [
      "#pnx-fin-link-sheet",
      "#add-modal",
      ".fin-tabs",
      ".fin-tab",
      ".fin-panels",
      ".fin-panel",
      ".finance-root",
      "body",
      "html"
    ].join(",");

    function isBadCandidate(el){
      if (!el || !el.closest) return true;
      if (el.matches(blockedSelectors)) return true;
      if (el.closest("#pnx-fin-link-sheet, #add-modal, .fin-tabs, .fin-panels")) return true;
      if (!/大会と取引を紐付ける/.test(el.textContent || "")) return true;

      // 大きすぎる親要素は絶対にCTA扱いしない
      const r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      if (r && (r.height > 180 || r.width > Math.min(window.innerWidth || 420, 420))) {
        return true;
      }

      // タブやパネルを内包していたら親を拾っているのでNG
      if (el.querySelector && el.querySelector(".fin-tab, .fin-panel, .fin-panels, #add-modal, #pnx-fin-link-sheet")) {
        return true;
      }

      return false;
    }

    function findCtaCard(el){
      if (!el) return null;

      const preferred = el.closest(
        "button, a, [data-pnx-finance-link-cta], [data-finance-action='tournament-link'], .pnx-fin-link-trigger, .finance-action-card, .overview-action-card, .action-card, .quick-action-card, .pro-card"
      );

      if (preferred && !isBadCandidate(preferred)) return preferred;

      // 近い小さなカードだけを候補にする
      let cur = el;
      for (let i = 0; i < 5 && cur; i++, cur = cur.parentElement) {
        if (!cur || !cur.textContent || !/大会と取引を紐付ける/.test(cur.textContent)) continue;
        if (!isBadCandidate(cur)) return cur;
      }

      return null;
    }

    const candidates = Array.from(document.querySelectorAll("button, a, [role='button'], [data-pnx-finance-link-cta], .pnx-fin-link-trigger, .finance-action-card, .overview-action-card, .action-card, .quick-action-card, div, span"))
      .map(findCtaCard)
      .filter(Boolean);

    const unique = Array.from(new Set(candidates));

    unique.forEach(card => {
      if (!card || card.__pnxStep138bBound) return;
      if (isBadCandidate(card)) return;

      card.__pnxStep138bBound = true;
      card.classList.add("pnx-fin-link-cta-bound");
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.addEventListener("click", function(e){
        if (e.target && e.target.closest && e.target.closest(".fin-tab, .fin-tabs, .fin-panel, #add-modal, #pnx-fin-link-sheet, input, select, textarea")) return;
        e.preventDefault();
        e.stopPropagation();
        openSheet();
      });
      card.addEventListener("keydown", function(e){
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openSheet();
        }
      });
    });

    window.__PNX_STEP138E_BOUND_CTA_COUNT__ = unique.length;
  }

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type === "PNX_TOURNAMENTS_FOR_FINANCE_UPDATED") {
      setTimeout(renderOptions, 80);
      setTimeout(renderOptions, 300);
    }
    if (data.type === "PNX_FINANCE_TRANSACTION_CREATED") {
      status("取引を保存しました", "success");
    }
  });

  document.addEventListener("DOMContentLoaded", function(){
    bindOverviewCTA();
    setTimeout(bindOverviewCTA, 500);
    setTimeout(bindOverviewCTA, 1400);
    ensureSheet();
  });

  window.PNXStep138bOpenFinanceTournamentLink = openSheet;
  window.PNXStep138bCloseFinanceTournamentLink = closeSheet;
  window.PNXStep138bFinanceLinkStatus = function(){
    const sheet = document.getElementById("pnx-fin-link-sheet");
    return {
      step:"138b",
      boundCtaCount:document.querySelectorAll(".pnx-fin-link-cta-bound").length,
      sheetExists:!!sheet,
      isOpen:!!(sheet && sheet.classList.contains("is-open")),
      tournamentCount:tournaments().length,
      lastOpen:window.__PNX_STEP138B_LAST_OPEN__ || null,
      sample:tournaments().slice(0,8).map(t => ({
        id:t.id || t.tournamentId,
        title:t.title || t.name,
        date:t.startDate || t.date,
        entryFeeNumber:t.entryFeeNumber,
        calendarAdded:t.calendarAdded
      }))
    };
  };
})();




/* ================================================================
   STEP138c: Finance tournament link sheet close fix
   大会連携シートを × / 背景 / ESC / 閉じるボタン で閉じられるようにする。
   ================================================================ */
(function(){
  if (window.__PNX_STEP138C_FINANCE_SHEET_CLOSE_FIX__) return;
  window.__PNX_STEP138C_FINANCE_SHEET_CLOSE_FIX__ = true;

  function closeSheet(){
    const sheet = document.getElementById("pnx-fin-link-sheet");
    if (!sheet) return false;
    sheet.classList.remove("is-open");
    document.documentElement.classList.remove("pnx-fin-link-open");
    document.body.classList.remove("pnx-fin-link-open");
    window.__PNX_STEP138C_LAST_CLOSE__ = new Date().toISOString();
    return true;
  }

  function ensureCloseButton(){
    const sheet = document.getElementById("pnx-fin-link-sheet");
    if (!sheet) return;
    const close = sheet.querySelector(".pnx-fin-link-close");
    if (close) {
      close.setAttribute("data-pnx-fin-link-close", "1");
      close.setAttribute("aria-label", "閉じる");
    }
    const backdrop = sheet.querySelector(".pnx-fin-link-backdrop");
    if (backdrop) backdrop.setAttribute("data-pnx-fin-link-close", "1");
    const actions = sheet.querySelector(".pnx-fin-link-actions");
    if (actions && !sheet.querySelector("#pnx-fin-link-cancel")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.id = "pnx-fin-link-cancel";
      btn.className = "pnx-fin-link-cancel";
      btn.setAttribute("data-pnx-fin-link-close", "1");
      btn.textContent = "閉じる";
      actions.insertBefore(btn, actions.firstChild);
    }
  }

  document.addEventListener("click", function(e){
    const target = e.target;
    if (!target || !target.closest) return;
    const closer = target.closest("[data-pnx-fin-link-close]");
    if (!closer) return;
    const sheet = document.getElementById("pnx-fin-link-sheet");
    if (!sheet || !sheet.contains(closer)) return;
    e.preventDefault();
    e.stopPropagation();
    closeSheet();
  }, true);

  document.addEventListener("keydown", function(e){
    if (e.key !== "Escape") return;
    const sheet = document.getElementById("pnx-fin-link-sheet");
    if (sheet && sheet.classList.contains("is-open")) {
      e.preventDefault();
      closeSheet();
    }
  }, true);

  const prevOpen = window.PNXStep138bOpenFinanceTournamentLink;
  if (typeof prevOpen === "function" && !prevOpen.__pnxStep138cWrapped) {
    const wrapped = function(){
      const result = prevOpen.apply(this, arguments);
      setTimeout(ensureCloseButton, 0);
      setTimeout(ensureCloseButton, 120);
      return result;
    };
    wrapped.__pnxStep138cWrapped = true;
    window.PNXStep138bOpenFinanceTournamentLink = wrapped;
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(ensureCloseButton, 300);
    setTimeout(ensureCloseButton, 1200);
  });

  window.PNXStep138bCloseFinanceTournamentLink = closeSheet;
  window.PNXStep138cCloseFinanceTournamentLink = closeSheet;
  window.PNXStep138cFinanceSheetCloseStatus = function(){
    const sheet = document.getElementById("pnx-fin-link-sheet");
    return {
      step:"138c",
      sheetExists:!!sheet,
      isOpen:!!(sheet && sheet.classList.contains("is-open")),
      closeTargets: sheet ? sheet.querySelectorAll("[data-pnx-fin-link-close]").length : 0,
      cancelButtonExists:!!document.getElementById("pnx-fin-link-cancel"),
      lastClose:window.__PNX_STEP138C_LAST_CLOSE__ || null
    };
  };
})();




/* ================================================================
   STEP138d: Finance sheet input interaction guard
   原因:
   - STEP138bのCTA自動バインドが、後から生成されたシート内の
     「大会と取引を紐付ける」タイトル周辺まで拾う可能性があった。
   - 入力欄/セレクト操作のイベントが外側へ伝わり、シートが閉じる・再描画される。
   修正:
   - シート内の入力操作は外側へ伝播させない
   - 閉じる操作と保存/再読込だけはそのまま動かす
   ================================================================ */
(function(){
  if (window.__PNX_STEP138D_FINANCE_SHEET_INPUT_GUARD__) return;
  window.__PNX_STEP138D_FINANCE_SHEET_INPUT_GUARD__ = true;

  function guardSheetInteraction(){
    const sheet = document.getElementById("pnx-fin-link-sheet");
    if (!sheet || sheet.__pnxStep138dGuarded) return !!sheet;

    const panel = sheet.querySelector(".pnx-fin-link-panel");
    if (!panel) return false;

    sheet.__pnxStep138dGuarded = true;
    panel.__pnxStep138dGuarded = true;

    // シート内に誤って付いたCTAバインドの見た目を外す。
    sheet.querySelectorAll(".pnx-fin-link-cta-bound").forEach(el => {
      el.classList.remove("pnx-fin-link-cta-bound");
      el.removeAttribute("role");
      el.removeAttribute("tabindex");
    });

    const isAllowedAction = (target) => {
      if (!target || !target.closest) return false;
      return !!target.closest(
        "[data-pnx-fin-link-close], #pnx-fin-link-save, #pnx-fin-link-refresh, #pnx-fin-link-cancel"
      );
    };

    const isInteractiveInside = (target) => {
      if (!target || !target.closest) return false;
      return !!target.closest(
        "input, select, textarea, option, label, .pnx-fin-link-field, .pnx-fin-link-body, .pnx-fin-link-grid"
      );
    };

    const stopInside = (e) => {
      const target = e.target;

      // 閉じる/保存/再読込は既存処理に流す
      if (isAllowedAction(target)) return;

      // パネル内の入力・選択操作は外側CTAや背景へ流さない
      if (isInteractiveInside(target) || (panel.contains(target) && !target.closest("[data-pnx-fin-link-close]"))) {
        e.stopPropagation();
      }
    };

    ["click", "mousedown", "mouseup", "pointerdown", "pointerup", "touchstart", "touchend"].forEach(type => {
      panel.addEventListener(type, stopInside, true);
      panel.addEventListener(type, stopInside, false);
    });

    // 入力中にシートが閉じる/再描画されるのを避ける
    ["focusin", "focusout", "input", "change", "compositionstart", "compositionend"].forEach(type => {
      panel.addEventListener(type, function(e){
        const target = e.target;
        if (isAllowedAction(target)) return;
        if (isInteractiveInside(target)) e.stopPropagation();
      }, true);
    });

    // セレクト/入力に直接マーカー
    sheet.querySelectorAll("input, select, textarea").forEach(el => {
      el.classList.add("pnx-fin-link-input-guarded");
      el.setAttribute("data-pnx-fin-link-input", "1");
    });

    window.__PNX_STEP138D_LAST_GUARD__ = new Date().toISOString();
    return true;
  }

  function reinforceOpenWrapper(){
    const prevOpen = window.PNXStep138bOpenFinanceTournamentLink;
    if (typeof prevOpen === "function" && !prevOpen.__pnxStep138dWrapped) {
      const wrappedOpen = function(){
        const result = prevOpen.apply(this, arguments);
        setTimeout(guardSheetInteraction, 0);
        setTimeout(guardSheetInteraction, 80);
        setTimeout(guardSheetInteraction, 250);
        return result;
      };
      wrappedOpen.__pnxStep138dWrapped = true;
      window.PNXStep138bOpenFinanceTournamentLink = wrappedOpen;
    }
  }

  document.addEventListener("DOMContentLoaded", function(){
    reinforceOpenWrapper();
    setTimeout(guardSheetInteraction, 300);
    setTimeout(guardSheetInteraction, 1000);
    setTimeout(reinforceOpenWrapper, 1200);
  });

  document.addEventListener("focusin", function(e){
    if (e.target && e.target.closest && e.target.closest("#pnx-fin-link-sheet")) {
      guardSheetInteraction();
    }
  }, true);

  window.PNXStep138dGuardFinanceSheetInteraction = guardSheetInteraction;
  window.PNXStep138dFinanceSheetInputStatus = function(){
    const sheet = document.getElementById("pnx-fin-link-sheet");
    const panel = sheet && sheet.querySelector(".pnx-fin-link-panel");
    return {
      step:"138d",
      sheetExists:!!sheet,
      isOpen:!!(sheet && sheet.classList.contains("is-open")),
      guarded:!!(sheet && sheet.__pnxStep138dGuarded),
      panelGuarded:!!(panel && panel.__pnxStep138dGuarded),
      inputGuardedCount:sheet ? sheet.querySelectorAll("[data-pnx-fin-link-input]").length : 0,
      wronglyBoundInsideCount:sheet ? sheet.querySelectorAll(".pnx-fin-link-cta-bound").length : 0,
      lastGuard:window.__PNX_STEP138D_LAST_GUARD__ || null
    };
  };
})();




/* ================================================================
   STEP138e: Finance tab/modal misfire guard
   原因:
   - STEP138bのCTA自動バインドが広すぎると、概要/取引/分析タブを押した時にも
     収支入力欄・大会連携シートが開くことがある。
   修正:
   - CTA対象を本当の導線カードだけに限定
   - タブクリックでは入力モーダル/大会連携シートを開かない
   - タブ切替直後に開いてしまった入力UIは即閉じる
   ================================================================ */
(function(){
  if (window.__PNX_STEP138E_FINANCE_TAB_MODAL_GUARD__) return;
  window.__PNX_STEP138E_FINANCE_TAB_MODAL_GUARD__ = true;

  function closeAddModal(){
    const overlay = document.getElementById("add-modal");
    if (overlay) overlay.classList.remove("open");
    if (document.body && document.body.style) {
      // 大会連携シートが開いていない時だけ通常スクロールに戻す
      const linkSheet = document.getElementById("pnx-fin-link-sheet");
      if (!linkSheet || !linkSheet.classList.contains("is-open")) {
        document.body.style.overflow = "";
      }
    }
  }

  function closeTournamentSheet(){
    const sheet = document.getElementById("pnx-fin-link-sheet");
    if (!sheet) return;
    sheet.classList.remove("is-open");
    document.documentElement.classList.remove("pnx-fin-link-open");
    document.body.classList.remove("pnx-fin-link-open");
  }

  function closeFinanceInputUIs(reason){
    closeAddModal();
    closeTournamentSheet();
    window.__PNX_STEP138E_LAST_CLOSE__ = {
      at:new Date().toISOString(),
      reason:reason || "tab"
    };
  }

  function bindTabGuards(){
    document.querySelectorAll(".fin-tab").forEach(tab => {
      if (tab.__pnxStep138eGuarded) return;
      tab.__pnxStep138eGuarded = true;

      // 既存のタブ切替処理は先に動かし、その後で親CTAへのバブリングを止める
      tab.addEventListener("click", function(e){
        e.stopPropagation();
        setTimeout(function(){ closeFinanceInputUIs("tab-click"); }, 0);
        setTimeout(function(){ closeFinanceInputUIs("tab-click-late"); }, 80);
      });

      tab.addEventListener("pointerup", function(e){
        e.stopPropagation();
      });

      tab.addEventListener("touchend", function(e){
        e.stopPropagation();
      }, { passive:false });
    });

    const tabbar = document.querySelector(".fin-tabs");
    if (tabbar && !tabbar.__pnxStep138eGuarded) {
      tabbar.__pnxStep138eGuarded = true;
      tabbar.addEventListener("click", function(e){
        if (e.target && e.target.closest && e.target.closest(".fin-tab")) {
          e.stopPropagation();
        }
      });
    }
  }

  // 通常の追加ボタン以外から add-modal が開いたら、誤発火として閉じる
  let lastValidAddClickAt = 0;
  document.addEventListener("click", function(e){
    if (e.target && e.target.closest && e.target.closest("#btn-add-tx")) {
      lastValidAddClickAt = Date.now();
      return;
    }

    if (e.target && e.target.closest && e.target.closest(".fin-tab, .fin-tabs")) {
      const overlay = document.getElementById("add-modal");
      if (overlay && overlay.classList.contains("open")) {
        closeAddModal();
      }
      const sheet = document.getElementById("pnx-fin-link-sheet");
      if (sheet && sheet.classList.contains("is-open")) {
        closeTournamentSheet();
      }
    }
  }, true);

  // モーダルが開いた瞬間、それが追加ボタン直後でなければ閉じる
  function installModalObserver(){
    const overlay = document.getElementById("add-modal");
    if (!overlay || overlay.__pnxStep138eObserved) return;
    overlay.__pnxStep138eObserved = true;

    const obs = new MutationObserver(function(){
      if (!overlay.classList.contains("open")) return;
      if (Date.now() - lastValidAddClickAt < 800) return;
      closeAddModal();
      window.__PNX_STEP138E_BLOCKED_ADD_MODAL__ = (window.__PNX_STEP138E_BLOCKED_ADD_MODAL__ || 0) + 1;
    });
    obs.observe(overlay, { attributes:true, attributeFilter:["class"] });
  }

  document.addEventListener("DOMContentLoaded", function(){
    bindTabGuards();
    installModalObserver();
    setTimeout(bindTabGuards, 500);
    setTimeout(installModalObserver, 500);
    setTimeout(bindTabGuards, 1500);
  });

  window.PNXStep138eCloseFinanceInputUIs = closeFinanceInputUIs;
  window.PNXStep138eFinanceTabGuardStatus = function(){
    const overlay = document.getElementById("add-modal");
    const sheet = document.getElementById("pnx-fin-link-sheet");
    return {
      step:"138e",
      tabGuardedCount:document.querySelectorAll(".fin-tab").length,
      boundCtaCount:window.__PNX_STEP138E_BOUND_CTA_COUNT__ || document.querySelectorAll(".pnx-fin-link-cta-bound").length,
      addModalOpen:!!(overlay && overlay.classList.contains("open")),
      tournamentSheetOpen:!!(sheet && sheet.classList.contains("is-open")),
      blockedAddModalCount:window.__PNX_STEP138E_BLOCKED_ADD_MODAL__ || 0,
      lastClose:window.__PNX_STEP138E_LAST_CLOSE__ || null
    };
  };
})();




/* ================================================================
   STEP138f: Finance tournament link CTA reopen fix
   原因:
   - STEP138eでCTA対象を絞りすぎ、本来の「大会と取引を紐付ける」カードまで
     除外されるケースがあった。
   修正:
   - タブ/入力欄/シート内は除外したまま、
     クリックされた要素から近い小さなカードを探して確実に開く。
   ================================================================ */
(function(){
  if (window.__PNX_STEP138F_FINANCE_LINK_CTA_REOPEN_FIX__) return;
  window.__PNX_STEP138F_FINANCE_LINK_CTA_REOPEN_FIX__ = true;

  function hasPhrase(el){
    return !!(el && /大会と取引を紐付ける/.test(el.textContent || ""));
  }

  function isForbidden(target){
    if (!target || !target.closest) return true;
    return !!target.closest(
      "#pnx-fin-link-sheet, #add-modal, .fin-tabs, .fin-tab, input, select, textarea, button#btn-add-tx, #pnx-step146-receipt-card, .pnx-receipt-card, #pnx-step146-receipt-sheet, .pnx-receipt-sheet"
    );
  }

  function isTooGlobal(el){
    if (!el || !el.matches) return true;
    if (el === document.body || el === document.documentElement) return true;
    if (el.matches("body, html, .finance-root, .fin-panels, .fin-panel")) return true;
    if (el.querySelector && el.querySelector(".fin-tabs, .fin-panel, .fin-panels, #pnx-fin-link-sheet, #add-modal")) return true;
    return false;
  }

  function scoreCandidate(el){
    if (!el || !hasPhrase(el) || isTooGlobal(el)) return -999;

    let score = 0;
    const cls = el.className ? String(el.className) : "";
    const role = el.getAttribute ? el.getAttribute("role") : "";

    if (/card|action|quick|link|item|row|tile|pro/i.test(cls)) score += 30;
    if (el.matches && el.matches("button, a, [role='button'], [data-pnx-finance-link-cta], [data-finance-action='tournament-link']")) score += 40;
    if (role === "button") score += 20;

    const r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    if (r) {
      if (r.height >= 28 && r.height <= 180) score += 20;
      if (r.width >= 120 && r.width <= Math.max(460, (window.innerWidth || 390))) score += 15;
      if (r.height > 260) score -= 80;
    }

    // テキストが短いほど本物のカードに近い
    const len = (el.textContent || "").trim().length;
    if (len < 160) score += 15;
    if (len > 320) score -= 80;

    return score;
  }

  function findTriggerFrom(target){
    if (!target || isForbidden(target)) return null;

    // まず明示的な指定を優先
    const explicit = target.closest && target.closest("[data-pnx-finance-link-cta], [data-finance-action='tournament-link'], .pnx-fin-link-trigger, .pnx-fin-link-cta-bound");
    if (explicit && hasPhrase(explicit) && !isTooGlobal(explicit)) return explicit;

    // targetから近い親だけを探索。finance-rootやpanel全体は拾わない。
    let cur = target;
    let best = null;
    let bestScore = -999;

    for (let i = 0; i < 8 && cur; i++, cur = cur.parentElement) {
      if (!hasPhrase(cur)) continue;
      const s = scoreCandidate(cur);
      if (s > bestScore) {
        bestScore = s;
        best = cur;
      }
    }

    return bestScore >= 0 ? best : null;
  }

  function openLinkSheet(){
    if (typeof window.PNXStep138bOpenFinanceTournamentLink === "function") {
      window.PNXStep138bOpenFinanceTournamentLink();
      return true;
    }

    const sheet = document.getElementById("pnx-fin-link-sheet");
    if (sheet) {
      sheet.classList.add("is-open");
      document.documentElement.classList.add("pnx-fin-link-open");
      document.body.classList.add("pnx-fin-link-open");
      return true;
    }

    return false;
  }

  document.addEventListener("click", function(e){
    const trigger = findTriggerFrom(e.target);
    if (!trigger) return;

    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

    const ok = openLinkSheet();
    window.__PNX_STEP138F_LAST_TRIGGER__ = {
      at:new Date().toISOString(),
      ok,
      text:(trigger.textContent || "").trim().slice(0,120),
      className:String(trigger.className || "")
    };
  }, true);

  document.addEventListener("keydown", function(e){
    if (e.key !== "Enter" && e.key !== " ") return;
    const trigger = findTriggerFrom(e.target);
    if (!trigger) return;

    e.preventDefault();
    e.stopPropagation();
    openLinkSheet();
  }, true);

  // 明示的な属性を後付けできる要素があれば付与
  function markLikelyTriggers(){
    const all = Array.from(document.querySelectorAll("button, a, [role='button'], div, span"));
    let count = 0;

    all.forEach(el => {
      if (!hasPhrase(el) || isTooGlobal(el)) return;
      if (scoreCandidate(el) < 0) return;
      el.setAttribute("data-pnx-finance-link-cta", "1");
      el.classList.add("pnx-fin-link-trigger");
      count++;
    });

    window.__PNX_STEP138F_MARKED_COUNT__ = count;
    return count;
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(markLikelyTriggers, 100);
    setTimeout(markLikelyTriggers, 700);
    setTimeout(markLikelyTriggers, 1600);
  });

  window.PNXStep138fMarkFinanceLinkTriggers = markLikelyTriggers;
  window.PNXStep138fOpenFinanceTournamentLink = openLinkSheet;
  window.PNXStep138fFinanceLinkCtaStatus = function(){
    return {
      step:"138f",
      markedCount:window.__PNX_STEP138F_MARKED_COUNT__ || document.querySelectorAll("[data-pnx-finance-link-cta]").length,
      lastTrigger:window.__PNX_STEP138F_LAST_TRIGGER__ || null,
      hasOpenFunction:typeof window.PNXStep138bOpenFinanceTournamentLink === "function",
      sheetExists:!!document.getElementById("pnx-fin-link-sheet"),
      sheetOpen:!!(document.getElementById("pnx-fin-link-sheet") && document.getElementById("pnx-fin-link-sheet").classList.contains("is-open"))
    };
  };
})();




/* ================================================================
   STEP138g: Finance saved transaction reflection status
   ================================================================ */
(function(){
  if (window.__PNX_STEP138G_FINANCE_TRANSACTION_REFLECT_FIX__) return;
  window.__PNX_STEP138G_FINANCE_TRANSACTION_REFLECT_FIX__ = true;

  function readSaved(){
    try {
      const list = JSON.parse(localStorage.getItem("PNX_FINANCE_TRANSACTIONS") || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  window.PNXStep138gFinanceTransactionReflectStatus = function(){
    const saved = readSaved();
    const all = typeof window.PNXStep138gGetAllFinanceTransactions === "function"
      ? window.PNXStep138gGetAllFinanceTransactions()
      : [];

    return {
      step:"138g",
      savedTournamentTxCount:saved.filter(tx => tx && tx.source === "tournament").length,
      mergedTransactionCount:Array.isArray(all) ? all.length : null,
      currentYear:new Date().getFullYear(),
      currentMonth:new Date().getMonth()+1,
      savedSample:saved.slice(-8).map(tx => ({
        id:tx.id,
        title:tx.tournamentTitle,
        date:tx.date,
        amount:tx.amount,
        category:tx.category,
        source:tx.source
      }))
    };
  };
})();




/* ================================================================
   STEP138h: Saved tournament finance transaction edit/delete
   目的:
   - 大会連携シートで保存した取引を後から編集できるようにする
   - 取引行タップ → 編集シート
   - 金額/日付/カテゴリ/メモ/収支区分を変更
   - 削除も可能
   ================================================================ */
(function(){
  if (window.__PNX_STEP138H_FINANCE_TRANSACTION_EDIT__) return;
  window.__PNX_STEP138H_FINANCE_TRANSACTION_EDIT__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";

  function text(v){ return String(v == null ? "" : v).trim(); }

  function readTxs(){
    try {
      const list = JSON.parse(localStorage.getItem(TX_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function writeTxs(list){
    try {
      localStorage.setItem(TX_KEY, JSON.stringify(Array.isArray(list) ? list : []));
    } catch(e) {}
  }

  function findSavedTx(id){
    if (!id) return null;
    return readTxs().find(tx => String(tx.id) === String(id)) || null;
  }

  function yen(n){
    return Number(n || 0).toLocaleString("ja-JP") + "円";
  }

  function notifyRefresh(action, item){
    try {
      if (window.PNXFinance && typeof window.PNXFinance.refreshData === "function") {
        window.PNXFinance.refreshData();
      }
    } catch(e) {}

    try {
      window.postMessage({
        type: action === "deleted" ? "PNX_FINANCE_TRANSACTION_DELETED" : "PNX_FINANCE_TRANSACTION_UPDATED",
        payload: item || {}
      }, "*");
    } catch(e) {}

    try {
      window.parent && window.parent.postMessage({
        type: action === "deleted" ? "PNX_DELETE_TOURNAMENT_FINANCE_TRANSACTION" : "PNX_UPDATE_TOURNAMENT_FINANCE_TRANSACTION",
        payload: item || {},
        id: item && item.id
      }, "*");
    } catch(e) {}

    try {
      window.dispatchEvent(new CustomEvent("pnx:finance:transactions-updated", {
        detail:{ transactions:readTxs(), item, action }
      }));
    } catch(e) {}
  }

  function status(msg, type){
    const el = document.getElementById("pnx-fin-edit-status");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("is-success", "is-error");
    if (type) el.classList.add(type === "error" ? "is-error" : "is-success");
  }

  function ensureSheet(){
    let sheet = document.getElementById("pnx-fin-edit-tx-sheet");
    if (sheet) return sheet;

    sheet = document.createElement("div");
    sheet.id = "pnx-fin-edit-tx-sheet";
    sheet.className = "pnx-fin-edit-tx-sheet";
    sheet.innerHTML = `
      <div class="pnx-fin-edit-backdrop" data-pnx-fin-edit-close="1"></div>
      <div class="pnx-fin-edit-panel" role="dialog" aria-modal="true" aria-label="取引を編集">
        <div class="pnx-fin-edit-handle"></div>

        <div class="pnx-fin-edit-head">
          <div>
            <p class="pnx-fin-edit-kicker">Edit Transaction</p>
            <h2>大会取引を編集</h2>
            <p id="pnx-fin-edit-subtitle">保存済みの大会取引を変更できます。</p>
          </div>
          <button type="button" class="pnx-fin-edit-close" data-pnx-fin-edit-close="1" aria-label="閉じる">×</button>
        </div>

        <input type="hidden" id="pnx-fin-edit-id">

        <label class="pnx-fin-edit-field">
          <span>大会</span>
          <input id="pnx-fin-edit-tournament" type="text" readonly>
        </label>

        <div class="pnx-fin-edit-grid">
          <label class="pnx-fin-edit-field">
            <span>収支区分</span>
            <select id="pnx-fin-edit-type">
              <option value="expense">支出</option>
              <option value="income">収入</option>
            </select>
          </label>

          <label class="pnx-fin-edit-field">
            <span>カテゴリ</span>
            <select id="pnx-fin-edit-category"></select>
          </label>

          <label class="pnx-fin-edit-field">
            <span>金額</span>
            <input id="pnx-fin-edit-amount" type="number" inputmode="numeric" placeholder="例：30000">
          </label>

          <label class="pnx-fin-edit-field">
            <span>日付</span>
            <input id="pnx-fin-edit-date" type="date">
          </label>
        </div>

        <label class="pnx-fin-edit-field">
          <span>メモ</span>
          <input id="pnx-fin-edit-memo" type="text" placeholder="例：エントリー費 / 交通費">
        </label>

        <div class="pnx-fin-edit-actions">
          <button type="button" id="pnx-fin-edit-delete" class="pnx-fin-edit-danger">削除</button>
          <button type="button" id="pnx-fin-edit-cancel" class="pnx-fin-edit-sub" data-pnx-fin-edit-close="1">閉じる</button>
          <button type="button" id="pnx-fin-edit-save" class="pnx-fin-edit-main">変更を保存</button>
        </div>

        <div id="pnx-fin-edit-status" class="pnx-fin-edit-status">編集できます</div>
      </div>
    `;

    document.body.appendChild(sheet);

    sheet.addEventListener("click", function(e){
      const close = e.target && e.target.closest && e.target.closest("[data-pnx-fin-edit-close]");
      if (!close) return;
      if (!sheet.contains(close)) return;
      e.preventDefault();
      closeSheet();
    }, true);

    const panel = sheet.querySelector(".pnx-fin-edit-panel");
    if (panel) {
      ["click","mousedown","mouseup","pointerdown","pointerup","touchstart","touchend","input","change","focusin"].forEach(type => {
        panel.addEventListener(type, function(e){
          if (e.target && e.target.closest && e.target.closest("[data-pnx-fin-edit-close], #pnx-fin-edit-save, #pnx-fin-edit-delete")) return;
          e.stopPropagation();
        }, true);
      });
    }

    sheet.querySelector("#pnx-fin-edit-type").addEventListener("change", function(){
      renderCategoryOptions(this.value, null);
    });
    sheet.querySelector("#pnx-fin-edit-save").addEventListener("click", saveEdit);
    sheet.querySelector("#pnx-fin-edit-delete").addEventListener("click", deleteCurrent);

    document.addEventListener("keydown", function(e){
      if (e.key === "Escape" && sheet.classList.contains("is-open")) closeSheet();
    }, true);

    return sheet;
  }

  function renderCategoryOptions(type, selected){
    const category = document.getElementById("pnx-fin-edit-category");
    if (!category) return;

    const expense = [
      ["entryFee", "エントリー費"],
      ["transport", "交通費"],
      ["hotel", "宿泊費"],
      ["meal", "食費"],
      ["practice", "練習費"],
      ["other", "その他"]
    ];

    const income = [
      ["prize", "賞金"],
      ["sponsor", "スポンサー料"],
      ["lesson", "レッスン料"],
      ["other", "その他"]
    ];

    const list = type === "income" ? income : expense;
    category.innerHTML = list.map(([v,l]) => `<option value="${v}">${l}</option>`).join("");

    if (selected && list.some(([v]) => String(v) === String(selected))) {
      category.value = selected;
    } else if (selected) {
      const opt = document.createElement("option");
      opt.value = selected;
      opt.textContent = selected;
      category.appendChild(opt);
      category.value = selected;
    }
  }

  function openSheet(txId){
    const tx = findSavedTx(txId);
    if (!tx) {
      try {
        if (window.PNXFinance && window.PNXFinance.showToast) {
          window.PNXFinance.showToast("この取引は編集できません");
        }
      } catch(e) {}
      return false;
    }

    const sheet = ensureSheet();

    document.getElementById("pnx-fin-edit-id").value = tx.id || "";
    document.getElementById("pnx-fin-edit-tournament").value = tx.tournamentTitle || tx.tournament || tx.name || "通常取引";
    document.getElementById("pnx-fin-edit-type").value = tx.type === "income" ? "income" : "expense";
    renderCategoryOptions(tx.type === "income" ? "income" : "expense", tx.category || "entryFee");
    document.getElementById("pnx-fin-edit-amount").value = tx.amount || "";
    document.getElementById("pnx-fin-edit-date").value = tx.date || new Date().toISOString().slice(0,10);
    document.getElementById("pnx-fin-edit-memo").value = tx.memo || "";

    const subtitle = document.getElementById("pnx-fin-edit-subtitle");
    if (subtitle) {
      subtitle.textContent = `${tx.tournamentTitle || tx.tournament || tx.name || "通常取引"} / ${tx.amount ? yen(tx.amount) : "金額未入力"}`;
    }

    sheet.classList.add("is-open");
    document.documentElement.classList.add("pnx-fin-edit-open");
    document.body.classList.add("pnx-fin-edit-open");

    status("編集できます", "success");
    window.__PNX_STEP138H_LAST_OPEN__ = { at:new Date().toISOString(), id:tx.id };
    return true;
  }

  function closeSheet(){
    const sheet = document.getElementById("pnx-fin-edit-tx-sheet");
    if (!sheet) return;
    sheet.classList.remove("is-open");
    document.documentElement.classList.remove("pnx-fin-edit-open");
    document.body.classList.remove("pnx-fin-edit-open");
  }

  function saveEdit(){
    const id = document.getElementById("pnx-fin-edit-id").value;
    const txs = readTxs();
    const idx = txs.findIndex(tx => String(tx.id) === String(id));
    if (idx < 0) {
      status("編集対象が見つかりません", "error");
      return;
    }

    const amount = Number(document.getElementById("pnx-fin-edit-amount").value || 0);
    const date = document.getElementById("pnx-fin-edit-date").value;
    const type = document.getElementById("pnx-fin-edit-type").value || "expense";
    const category = document.getElementById("pnx-fin-edit-category").value || (type === "income" ? "other" : "other");
    const memo = text(document.getElementById("pnx-fin-edit-memo").value);

    if (!amount) {
      status("金額を入力してください", "error");
      return;
    }
    if (!date) {
      status("日付を入力してください", "error");
      return;
    }

    const updated = Object.assign({}, txs[idx], {
      type,
      category,
      amount,
      date,
      memo,
      name: txs[idx].source === 'manual' ? (memo || txs[idx].name || category) : (txs[idx].name || undefined),
      meta: txs[idx].tournamentTitle || txs[idx].tournament
        ? `${memo || category} / ${txs[idx].tournamentTitle || txs[idx].tournament}`
        : (memo || category),
      updatedAt:new Date().toISOString()
    });

    txs[idx] = updated;
    writeTxs(txs);
    notifyRefresh("updated", updated);
    status("変更を保存しました", "success");

    setTimeout(closeSheet, 450);
  }

  function deleteCurrent(){
    const id = document.getElementById("pnx-fin-edit-id").value;
    if (!id) return;

    const ok = window.confirm ? window.confirm("この取引を削除しますか？") : true;
    if (!ok) return;

    const txs = readTxs();
    const target = txs.find(tx => String(tx.id) === String(id)) || null;
    const next = txs.filter(tx => String(tx.id) !== String(id));

    writeTxs(next);
    notifyRefresh("deleted", target || { id });
    status("削除しました", "success");
    setTimeout(closeSheet, 300);
  }

  function markRows(){
    const savedIds = new Set(readTxs().map(tx => String(tx.id)));
    document.querySelectorAll(".tx-row[data-id]").forEach(row => {
      const id = String(row.dataset.id || "");
      if (savedIds.has(id)) {
        row.classList.add("pnx-editable-tx-row");
        row.setAttribute("role", "button");
        row.setAttribute("tabindex", "0");
        row.setAttribute("title", "タップして編集");
      }
    });
  }

  function bindRowClicks(){
    if (window.__PNX_STEP138H_ROW_CLICK_BOUND__) return;
    window.__PNX_STEP138H_ROW_CLICK_BOUND__ = true;

    document.addEventListener("click", function(e){
      const row = e.target && e.target.closest && e.target.closest(".tx-row[data-id]");
      if (!row) return;
      if (e.target.closest && e.target.closest("#pnx-fin-edit-tx-sheet, #pnx-fin-link-sheet, #add-modal, button, a, input, select, textarea")) return;

      const id = row.dataset.id || "";
      if (!findSavedTx(id)) return;

      e.preventDefault();
      e.stopPropagation();
      openSheet(id);
    }, true);

    document.addEventListener("keydown", function(e){
      if (e.key !== "Enter" && e.key !== " ") return;
      const row = e.target && e.target.closest && e.target.closest(".tx-row[data-id]");
      if (!row) return;
      const id = row.dataset.id || "";
      if (!findSavedTx(id)) return;
      e.preventDefault();
      openSheet(id);
    }, true);
  }

  function installObserver(){
    const obs = new MutationObserver(function(){
      markRows();
    });
    obs.observe(document.body, { childList:true, subtree:true });
    markRows();
  }

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type === "PNX_FINANCE_TRANSACTION_UPDATED" || data.type === "PNX_FINANCE_TRANSACTION_DELETED" || data.type === "PNX_FINANCE_TRANSACTION_CREATED") {
      setTimeout(markRows, 100);
    }
  });

  window.addEventListener("storage", function(e){
    if (e.key === TX_KEY) setTimeout(markRows, 120);
  });

  document.addEventListener("DOMContentLoaded", function(){
    ensureSheet();
    bindRowClicks();
    setTimeout(markRows, 200);
    setTimeout(installObserver, 600);
    setTimeout(markRows, 1400);
  });

  window.PNXStep138hOpenFinanceTransactionEdit = openSheet;
  window.PNXStep138hCloseFinanceTransactionEdit = closeSheet;
  window.PNXStep138hFinanceTransactionEditStatus = function(){
    const sheet = document.getElementById("pnx-fin-edit-tx-sheet");
    const txs = readTxs();
    return {
      step:"138h",
      savedCount:txs.length,
      tournamentSavedCount:txs.filter(tx => tx && tx.source === "tournament").length,
      editableRowCount:document.querySelectorAll(".pnx-editable-tx-row").length,
      sheetExists:!!sheet,
      sheetOpen:!!(sheet && sheet.classList.contains("is-open")),
      lastOpen:window.__PNX_STEP138H_LAST_OPEN__ || null,
      sample:txs.slice(-8).map(tx => ({
        id:tx.id,
        title:tx.tournamentTitle,
        amount:tx.amount,
        date:tx.date,
        category:tx.category,
        source:tx.source
      }))
    };
  };
})();




/* STEP138i: Finance icon refresh status */
(function(){
  if (window.__PNX_STEP138I_FINANCE_ICON_REFRESH__) return;
  window.__PNX_STEP138I_FINANCE_ICON_REFRESH__ = true;
  window.PNXStep138iFinanceIconStatus = function(){
    return {
      step:"138i",
      typeIconCount:document.querySelectorAll(".type-icon.pnx-fin-icon svg").length,
      categoryIconCount:document.querySelectorAll(".cat-emoji.pnx-fin-icon svg, .pnx-cat-icon svg").length,
      emojiLeft:Array.from(document.querySelectorAll(".type-icon, .cat-emoji")).some(el => /[💸💰🚄🏨🏆🏌⛳👜🤝]/.test(el.textContent || "")),
      note:"収支入力モーダルの絵文字アイコンをSVGラインアイコンに刷新"
    };
  };
})();




/* ================================================================
   STEP139: Finance transaction save/edit/delete stability layer
   目的:
   - 通常入力も大会入力も PNX_FINANCE_TRANSACTIONS に統一保存
   - 保存/編集/削除後に概要・取引・集計へ即反映
   - 取引ID重複を防ぐ
   - 取引一覧の表示順を日付順に安定化
   ================================================================ */
(function(){
  if (window.__PNX_STEP139_FINANCE_TRANSACTION_STABILITY__) return;
  window.__PNX_STEP139_FINANCE_TRANSACTION_STABILITY__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";

  function readTxs(){
    try {
      const list = JSON.parse(localStorage.getItem(TX_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function writeTxs(list){
    const map = new Map();
    (Array.isArray(list) ? list : []).forEach(tx => {
      if (!tx || !tx.id) return;
      map.set(String(tx.id), tx);
    });
    const out = Array.from(map.values()).sort((a,b) => {
      const d = String(b.date || '').localeCompare(String(a.date || ''));
      if (d !== 0) return d;
      return String(b.updatedAt || b.createdAt || b.id || '').localeCompare(String(a.updatedAt || a.createdAt || a.id || ''));
    });
    localStorage.setItem(TX_KEY, JSON.stringify(out));
    return out;
  }

  function refreshAll(reason){
    try {
      if (window.PNXFinance && typeof window.PNXFinance.refreshData === "function") {
        window.PNXFinance.refreshData();
      }
    } catch(e) {}

    try {
      window.dispatchEvent(new CustomEvent("pnx:finance:transactions-stable-refreshed", {
        detail:{ reason:reason || "refresh", transactions:readTxs() }
      }));
    } catch(e) {}
  }

  function normalizeExisting(){
    const now = new Date().toISOString();
    const txs = readTxs().map((tx, idx) => {
      const id = tx.id || ('tx_' + Date.now() + '_' + idx);
      return Object.assign({
        id,
        type:"expense",
        category:"その他",
        amount:0,
        date:new Date().toISOString().slice(0,10),
        memo:"",
        source:tx.tournamentId || tx.tournamentTitle ? "tournament" : "manual",
        createdAt:now,
        updatedAt:now
      }, tx, {
        id,
        amount:Number(tx.amount || 0),
        source:tx.source || (tx.tournamentId || tx.tournamentTitle ? "tournament" : "manual")
      });
    }).filter(tx => tx.id && Number(tx.amount || 0) > 0);

    return writeTxs(txs);
  }

  function upsert(tx){
    const txs = readTxs();
    const incoming = Object.assign({}, tx || {});
    const id = incoming.id || ('tx_' + Date.now() + '_' + Math.random().toString(16).slice(2,7));
    const now = new Date().toISOString();
    const idx = txs.findIndex(item => String(item.id) === String(id));

    const normalized = Object.assign({
      id,
      type:"expense",
      category:"その他",
      amount:0,
      date:new Date().toISOString().slice(0,10),
      memo:"",
      source:"manual",
      createdAt:now,
      updatedAt:now
    }, incoming, {
      id,
      amount:Number(incoming.amount || 0),
      updatedAt:now
    });

    if (idx >= 0) {
      normalized.createdAt = txs[idx].createdAt || normalized.createdAt;
      txs[idx] = Object.assign({}, txs[idx], normalized);
    } else {
      txs.push(normalized);
    }

    const out = writeTxs(txs);
    refreshAll(idx >= 0 ? "updated" : "created");
    return normalized;
  }

  function remove(id){
    const txs = readTxs();
    const next = txs.filter(tx => String(tx.id) !== String(id));
    writeTxs(next);
    refreshAll("deleted");
  }

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_FINANCE_TRANSACTION_CREATED" ||
      data.type === "PNX_FINANCE_TRANSACTION_UPDATED" ||
      data.type === "PNX_FINANCE_TRANSACTION_DELETED" ||
      data.type === "PNX_FINANCE_TRANSACTION_UPSERTED_STEP139"
    ) {
      setTimeout(function(){ refreshAll(data.type); }, 80);
      setTimeout(function(){ refreshAll(data.type + "-late"); }, 300);
    }
  });

  window.addEventListener("storage", function(e){
    if (e.key === TX_KEY) {
      setTimeout(function(){ refreshAll("storage"); }, 80);
    }
  });

  window.addEventListener("pnx:finance:transactions-updated", function(){
    setTimeout(function(){ refreshAll("custom-event"); }, 80);
  });

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(function(){
      normalizeExisting();
      refreshAll("dom-ready");
    }, 500);
    setTimeout(function(){ refreshAll("late-ready"); }, 1400);
  });

  window.PNXStep139FinanceUpsertTransaction = upsert;
  window.PNXStep139FinanceDeleteTransaction = remove;
  window.PNXStep139FinanceNormalizeTransactions = normalizeExisting;
  window.PNXStep139FinanceTransactionStabilityStatus = function(){
    const saved = readTxs();
    const all = typeof window.PNXStep138gGetAllFinanceTransactions === "function"
      ? window.PNXStep138gGetAllFinanceTransactions()
      : [];
    const ids = saved.map(tx => String(tx.id));
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);

    return {
      step:139,
      savedCount:saved.length,
      manualCount:saved.filter(tx => tx.source === "manual").length,
      tournamentCount:saved.filter(tx => tx.source === "tournament").length,
      mergedCount:Array.isArray(all) ? all.length : null,
      duplicateIds:Array.from(new Set(duplicates)),
      currentMonth:new Date().toISOString().slice(0,7),
      sample:saved.slice(-10).map(tx => ({
        id:tx.id,
        type:tx.type,
        name:tx.name,
        memo:tx.memo,
        category:tx.category,
        amount:tx.amount,
        date:tx.date,
        source:tx.source,
        tournamentTitle:tx.tournamentTitle
      }))
    };
  };
})();




/* ================================================================
   STEP140: Tournament profit summary
   目的:
   - 保存済み取引を大会ごとに集計
   - 収入 / 支出 / 利益 / 利益率 を表示
   - 概要タブでは上位、分析タブでは一覧
   ================================================================ */
(function(){
  if (window.__PNX_STEP140_TOURNAMENT_PROFIT_SUMMARY__) return;
  window.__PNX_STEP140_TOURNAMENT_PROFIT_SUMMARY__ = true;

  function text(v){ return String(v == null ? "" : v).trim(); }
  function yen(n){ return "¥" + Number(n || 0).toLocaleString("ja-JP"); }

  function safeAllTx(){
    try {
      if (typeof window.PNXStep138gGetAllFinanceTransactions === "function") {
        return window.PNXStep138gGetAllFinanceTransactions() || [];
      }
    } catch(e) {}
    try {
      if (typeof pnxStep138gAllTransactions === "function") {
        return pnxStep138gAllTransactions() || [];
      }
    } catch(e) {}
    try {
      return Array.isArray(ALL_TRANSACTIONS) ? ALL_TRANSACTIONS : [];
    } catch(e) {
      return [];
    }
  }

  function tournamentTitle(tx){
    const direct = text(tx.tournamentTitle || tx.tournament || tx.tournamentName);
    if (direct) return direct;

    const meta = text(tx.meta || tx.memo || tx.name);
    if (!meta) return "";

    // "メモ / 大会名" のような形式を拾う
    const parts = meta.split("/").map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) return parts[parts.length - 1];

    return "";
  }

  function txDate(tx){
    return text(tx.date || tx.startDate || tx.createdAt || "");
  }

  function txAmount(tx){
    const n = Number(tx.amount || 0);
    return Number.isFinite(n) ? n : 0;
  }

  function txType(tx){
    return tx.type === "income" ? "income" : "expense";
  }

  function categoryLabel(tx){
    return text(tx.category || tx.name || (txType(tx) === "income" ? "収入" : "支出"));
  }

  function collect(){
    const map = new Map();

    safeAllTx().forEach(tx => {
      if (!tx) return;
      const title = tournamentTitle(tx);
      if (!title) return;

      const key = text(tx.tournamentId) || title.toLowerCase().replace(/\s+/g, "");
      if (!map.has(key)) {
        map.set(key, {
          key,
          tournamentId:text(tx.tournamentId),
          title,
          income:0,
          expense:0,
          profit:0,
          count:0,
          latestDate:"",
          firstDate:"",
          categories:{},
          incomeCategories:{},
          expenseCategories:{},
          sourceCount:{}
        });
      }

      const item = map.get(key);
      const amount = txAmount(tx);
      const type = txType(tx);
      const date = txDate(tx);
      const cat = categoryLabel(tx);
      const source = text(tx.source || "unknown");

      if (type === "income") {
        item.income += amount;
        item.incomeCategories[cat] = (item.incomeCategories[cat] || 0) + amount;
      } else {
        item.expense += amount;
        item.expenseCategories[cat] = (item.expenseCategories[cat] || 0) + amount;
      }

      item.categories[cat] = (item.categories[cat] || 0) + amount;
      item.sourceCount[source] = (item.sourceCount[source] || 0) + 1;
      item.count += 1;
      if (date && (!item.latestDate || date > item.latestDate)) item.latestDate = date;
      if (date && (!item.firstDate || date < item.firstDate)) item.firstDate = date;
    });

    return Array.from(map.values()).map(item => {
      item.profit = item.income - item.expense;
      item.margin = item.income > 0 ? Math.round((item.profit / item.income) * 100) : (item.profit < 0 ? -100 : 0);
      return item;
    }).sort((a,b) => {
      const date = String(b.latestDate || "").localeCompare(String(a.latestDate || ""));
      if (date !== 0) return date;
      return Math.abs(b.profit) - Math.abs(a.profit);
    });
  }

  function topCategory(cats){
    const entries = Object.entries(cats || {}).sort((a,b) => b[1] - a[1]);
    if (!entries.length) return "";
    return entries[0][0] + " " + yen(entries[0][1]);
  }

  function buildMiniRow(item){
    const cls = item.profit >= 0 ? "is-plus" : "is-minus";
    const date = item.latestDate || "日付なし";
    return `
      <button type="button" class="pnx-tour-summary-row" data-pnx-tour-key="${escapeHtml(item.key)}">
        <div class="pnx-tour-summary-main">
          <div class="pnx-tour-summary-title">${escapeHtml(item.title)}</div>
          <div class="pnx-tour-summary-meta">${escapeHtml(date)}・${item.count}件・支出 ${yen(item.expense)}</div>
        </div>
        <div class="pnx-tour-summary-money ${cls}">
          <span>${item.profit >= 0 ? "+" : "-"}</span>${yen(Math.abs(item.profit))}
        </div>
      </button>
    `;
  }

  function buildDetailRow(item){
    const cls = item.profit >= 0 ? "is-plus" : "is-minus";
    const topExpense = topCategory(item.expenseCategories);
    const topIncome = topCategory(item.incomeCategories);
    return `
      <article class="pnx-tour-analysis-row" data-pnx-tour-key="${escapeHtml(item.key)}">
        <div class="pnx-tour-analysis-top">
          <div>
            <div class="pnx-tour-analysis-title">${escapeHtml(item.title)}</div>
            <div class="pnx-tour-analysis-meta">${escapeHtml(item.firstDate || item.latestDate || "日付なし")} ${item.latestDate && item.firstDate && item.latestDate !== item.firstDate ? "〜 " + escapeHtml(item.latestDate) : ""}・${item.count}件</div>
          </div>
          <div class="pnx-tour-analysis-profit ${cls}">
            <span>${item.profit >= 0 ? "+" : "-"}</span>${yen(Math.abs(item.profit))}
          </div>
        </div>

        <div class="pnx-tour-analysis-grid">
          <div>
            <span>収入</span>
            <strong class="blue">${yen(item.income)}</strong>
          </div>
          <div>
            <span>支出</span>
            <strong class="red">${yen(item.expense)}</strong>
          </div>
          <div>
            <span>利益率</span>
            <strong>${item.income > 0 ? item.margin + "%" : "—"}</strong>
          </div>
        </div>

        <div class="pnx-tour-analysis-tags">
          ${topIncome ? `<span>主な収入：${escapeHtml(topIncome)}</span>` : ""}
          ${topExpense ? `<span>主な支出：${escapeHtml(topExpense)}</span>` : ""}
        </div>
      </article>
    `;
  }

  function escapeHtml(v){
    return String(v == null ? "" : v)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#39;");
  }

  function render(){
    const list = collect();

    const overview = document.getElementById("pnx-tour-summary-list");
    if (overview) {
      if (!list.length) {
        overview.innerHTML = '<div class="pnx-tour-summary-empty">大会に紐づく取引がまだありません</div>';
      } else {
        overview.innerHTML = list.slice(0, 4).map(buildMiniRow).join("");
      }
    }

    const analysis = document.getElementById("pnx-tour-analysis-list");
    if (analysis) {
      if (!list.length) {
        analysis.innerHTML = '<div class="pnx-tour-summary-empty">大会に紐づく取引がまだありません</div>';
      } else {
        analysis.innerHTML = list.map(buildDetailRow).join("");
      }
    }

    const total = document.getElementById("pnx-tour-summary-total");
    if (total) total.textContent = list.length + "大会";

    window.__PNX_STEP140_LAST_SUMMARY__ = {
      at:new Date().toISOString(),
      count:list.length,
      sample:list.slice(0, 8)
    };

    return list;
  }

  function jumpToAnalysis(){
    const tab = document.querySelector('.fin-tab[data-tab="analysis"]');
    if (tab) {
      tab.click();
      setTimeout(render, 120);
      return;
    }
    const target = document.getElementById("pnx-tour-summary-analysis");
    if (target && target.scrollIntoView) target.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  document.addEventListener("click", function(e){
    const jump = e.target && e.target.closest && e.target.closest("#pnx-tour-summary-jump");
    if (jump) {
      e.preventDefault();
      jumpToAnalysis();
    }
  }, true);

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_FINANCE_TRANSACTION_CREATED" ||
      data.type === "PNX_FINANCE_TRANSACTION_UPDATED" ||
      data.type === "PNX_FINANCE_TRANSACTION_DELETED" ||
      data.type === "PNX_FINANCE_TRANSACTION_UPSERTED_STEP139"
    ) {
      setTimeout(render, 80);
      setTimeout(render, 350);
    }
  });

  window.addEventListener("storage", function(e){
    if (e.key === "PNX_FINANCE_TRANSACTIONS") {
      setTimeout(render, 80);
    }
  });

  window.addEventListener("pnx:finance:transactions-updated", function(){
    setTimeout(render, 80);
  });
  window.addEventListener("pnx:finance:transactions-stable-refreshed", function(){
    setTimeout(render, 80);
  });

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(render, 500);
    setTimeout(render, 1400);
  });

  window.PNXStep140CollectTournamentSummary = collect;
  window.PNXStep140RenderTournamentSummary = render;
  window.PNXStep140TournamentSummaryStatus = function(){
    const list = collect();
    return {
      step:140,
      count:list.length,
      totalIncome:list.reduce((s,t)=>s+t.income,0),
      totalExpense:list.reduce((s,t)=>s+t.expense,0),
      totalProfit:list.reduce((s,t)=>s+t.profit,0),
      last:window.__PNX_STEP140_LAST_SUMMARY__ || null,
      sample:list.slice(0,10).map(t => ({
        title:t.title,
        income:t.income,
        expense:t.expense,
        profit:t.profit,
        count:t.count,
        latestDate:t.latestDate
      }))
    };
  };
})();




/* ================================================================
   STEP141: Analysis enhancement
   目的:
   - 分析タブに大会別ランキング / カテゴリ別支出 / 月別推移を追加
   - 大会行タップで紐づく取引を展開
   ================================================================ */
(function(){
  if (window.__PNX_STEP141_ANALYSIS_ENHANCEMENT__) return;
  window.__PNX_STEP141_ANALYSIS_ENHANCEMENT__ = true;

  function text(v){ return String(v == null ? "" : v).trim(); }
  function yen(n){ return "¥" + Number(n || 0).toLocaleString("ja-JP"); }
  function ym(date){ return text(date).slice(0,7) || "日付なし"; }

  function escapeHtml(v){
    return String(v == null ? "" : v)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#39;");
  }

  function allTx(){
    try {
      if (typeof window.PNXStep138gGetAllFinanceTransactions === "function") {
        return window.PNXStep138gGetAllFinanceTransactions() || [];
      }
    } catch(e) {}
    try {
      if (typeof pnxStep138gAllTransactions === "function") return pnxStep138gAllTransactions() || [];
    } catch(e) {}
    try {
      return Array.isArray(ALL_TRANSACTIONS) ? ALL_TRANSACTIONS : [];
    } catch(e) {
      return [];
    }
  }

  function tournamentTitle(tx){
    const direct = text(tx.tournamentTitle || tx.tournament || tx.tournamentName);
    if (direct) return direct;
    const meta = text(tx.meta || tx.memo || "");
    const parts = meta.split("/").map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) return parts[parts.length - 1];
    return "";
  }

  function normalizeTx(tx){
    const amount = Number(tx.amount || 0);
    const type = tx.type === "income" ? "income" : "expense";
    return Object.assign({}, tx, {
      amount:Number.isFinite(amount) ? amount : 0,
      type,
      title:tournamentTitle(tx),
      date:text(tx.date || tx.startDate || tx.createdAt || ""),
      category:text(tx.category || tx.name || (type === "income" ? "収入" : "支出")),
      displayName:text(tx.name || tx.memo || tx.category || (type === "income" ? "収入" : "支出"))
    });
  }

  function collectTournamentRanking(){
    const map = new Map();
    allTx().map(normalizeTx).forEach(tx => {
      if (!tx.title) return;
      const key = text(tx.tournamentId) || tx.title.toLowerCase().replace(/\s+/g,"");
      if (!map.has(key)) {
        map.set(key, {
          key,
          title:tx.title,
          income:0,
          expense:0,
          profit:0,
          count:0,
          latestDate:"",
          txs:[]
        });
      }
      const item = map.get(key);
      if (tx.type === "income") item.income += tx.amount;
      else item.expense += tx.amount;
      item.profit = item.income - item.expense;
      item.count += 1;
      if (tx.date && (!item.latestDate || tx.date > item.latestDate)) item.latestDate = tx.date;
      item.txs.push(tx);
    });

    return Array.from(map.values()).sort((a,b) => {
      const profit = b.profit - a.profit;
      if (profit !== 0) return profit;
      return String(b.latestDate || "").localeCompare(String(a.latestDate || ""));
    });
  }

  function collectCategoryBreakdown(){
    const map = new Map();
    allTx().map(normalizeTx).forEach(tx => {
      if (tx.type !== "expense") return;
      const key = tx.category || "その他";
      if (!map.has(key)) {
        map.set(key, { key, category:key, amount:0, count:0, txs:[] });
      }
      const item = map.get(key);
      item.amount += tx.amount;
      item.count += 1;
      item.txs.push(tx);
    });
    const list = Array.from(map.values()).sort((a,b) => b.amount - a.amount);
    const total = list.reduce((s,x)=>s+x.amount,0) || 1;
    list.forEach(item => item.rate = Math.round((item.amount / total) * 100));
    return list;
  }

  function collectMonthlyTrend(){
    const map = new Map();
    allTx().map(normalizeTx).forEach(tx => {
      const key = ym(tx.date);
      if (!map.has(key)) {
        map.set(key, { month:key, income:0, expense:0, profit:0, count:0 });
      }
      const item = map.get(key);
      if (tx.type === "income") item.income += tx.amount;
      else item.expense += tx.amount;
      item.profit = item.income - item.expense;
      item.count += 1;
    });
    return Array.from(map.values()).sort((a,b)=>String(b.month).localeCompare(String(a.month)));
  }

  function txRows(txs){
    if (!txs || !txs.length) return '<div class="pnx-step141-empty mini">取引がありません</div>';
    return txs
      .sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")))
      .map(tx => `
        <div class="pnx-step141-tx-row">
          <div>
            <strong>${escapeHtml(tx.displayName || tx.category)}</strong>
            <span>${escapeHtml(tx.date || "日付なし")}・${escapeHtml(tx.category || "")}</span>
          </div>
          <b class="${tx.type === "income" ? "is-plus" : "is-minus"}">${tx.type === "income" ? "+" : "-"}${yen(tx.amount)}</b>
        </div>
      `).join("");
  }

  function renderRanking(){
    const target = document.getElementById("pnx-step141-tournament-ranking");
    if (!target) return;
    const list = collectTournamentRanking();

    if (!list.length) {
      target.innerHTML = '<div class="pnx-step141-empty">大会取引がまだありません</div>';
      return;
    }

    target.innerHTML = list.map((item, i) => {
      const cls = item.profit >= 0 ? "is-plus" : "is-minus";
      const detail = txRows(item.txs);
      return `
        <article class="pnx-step141-rank-row" data-pnx-step141-key="${escapeHtml(item.key)}">
          <button type="button" class="pnx-step141-rank-main">
            <span class="pnx-step141-rank-no">${i + 1}</span>
            <span class="pnx-step141-rank-body">
              <strong>${escapeHtml(item.title)}</strong>
              <small>${escapeHtml(item.latestDate || "日付なし")}・${item.count}件・支出 ${yen(item.expense)}</small>
            </span>
            <span class="pnx-step141-rank-money ${cls}">${item.profit >= 0 ? "+" : "-"}${yen(Math.abs(item.profit))}</span>
          </button>
          <div class="pnx-step141-rank-detail">${detail}</div>
        </article>
      `;
    }).join("");
  }

  function renderCategory(){
    const target = document.getElementById("pnx-step141-category-breakdown");
    if (!target) return;
    const list = collectCategoryBreakdown();

    if (!list.length) {
      target.innerHTML = '<div class="pnx-step141-empty">カテゴリ別に集計できる支出がまだありません</div>';
      return;
    }

    target.innerHTML = list.map(item => `
      <div class="pnx-step141-category-row">
        <div class="pnx-step141-category-top">
          <div>
            <strong>${escapeHtml(item.category)}</strong>
            <small>${item.count}件・${item.rate}%</small>
          </div>
          <b>${yen(item.amount)}</b>
        </div>
        <div class="pnx-step141-bar">
          <span style="width:${Math.max(3, Math.min(100, item.rate))}%"></span>
        </div>
      </div>
    `).join("");
  }

  function renderMonthly(){
    const target = document.getElementById("pnx-step141-monthly-trend");
    if (!target) return;
    const list = collectMonthlyTrend();

    if (!list.length) {
      target.innerHTML = '<div class="pnx-step141-empty">月別に集計できる取引がまだありません</div>';
      return;
    }

    const max = Math.max(1, ...list.map(x => Math.max(x.income, x.expense)));
    target.innerHTML = list.slice(0, 12).map(item => {
      const cls = item.profit >= 0 ? "is-plus" : "is-minus";
      const incomeW = Math.round((item.income / max) * 100);
      const expenseW = Math.round((item.expense / max) * 100);
      return `
        <div class="pnx-step141-month-row">
          <div class="pnx-step141-month-top">
            <strong>${escapeHtml(item.month)}</strong>
            <b class="${cls}">${item.profit >= 0 ? "+" : "-"}${yen(Math.abs(item.profit))}</b>
          </div>
          <div class="pnx-step141-month-bars">
            <div><span>収入</span><i class="income" style="width:${Math.max(2,incomeW)}%"></i><em>${yen(item.income)}</em></div>
            <div><span>支出</span><i class="expense" style="width:${Math.max(2,expenseW)}%"></i><em>${yen(item.expense)}</em></div>
          </div>
        </div>
      `;
    }).join("");
  }

  function render(){
    renderRanking();
    renderCategory();
    renderMonthly();

    const count = document.getElementById("pnx-step141-analysis-count");
    if (count) count.textContent = collectTournamentRanking().length + "大会";

    window.__PNX_STEP141_LAST_RENDER__ = {
      at:new Date().toISOString(),
      tournaments:collectTournamentRanking().length,
      categories:collectCategoryBreakdown().length,
      months:collectMonthlyTrend().length
    };
  }

  function bindTabs(){
    document.querySelectorAll(".pnx-analysis-tab").forEach(btn => {
      if (btn.__pnxStep141Bound) return;
      btn.__pnxStep141Bound = true;
      btn.addEventListener("click", function(){
        const mode = this.dataset.pnxAnalysisMode;
        document.querySelectorAll(".pnx-analysis-tab").forEach(b => b.classList.toggle("is-active", b === this));
        document.querySelectorAll(".pnx-analysis-panel").forEach(panel => {
          panel.classList.toggle("is-active", panel.dataset.pnxAnalysisPanel === mode);
        });
        setTimeout(render, 30);
      });
    });
  }

  function bindExpand(){
    if (window.__PNX_STEP141_EXPAND_BOUND__) return;
    window.__PNX_STEP141_EXPAND_BOUND__ = true;
    document.addEventListener("click", function(e){
      const main = e.target && e.target.closest && e.target.closest(".pnx-step141-rank-main");
      if (!main) return;
      const row = main.closest(".pnx-step141-rank-row");
      if (!row) return;
      e.preventDefault();
      row.classList.toggle("is-open");
    }, true);
  }

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_FINANCE_TRANSACTION_CREATED" ||
      data.type === "PNX_FINANCE_TRANSACTION_UPDATED" ||
      data.type === "PNX_FINANCE_TRANSACTION_DELETED" ||
      data.type === "PNX_FINANCE_TRANSACTION_UPSERTED_STEP139"
    ) {
      setTimeout(render, 80);
      setTimeout(render, 350);
    }
  });

  window.addEventListener("storage", function(e){
    if (e.key === "PNX_FINANCE_TRANSACTIONS") setTimeout(render, 80);
  });

  window.addEventListener("pnx:finance:transactions-updated", function(){ setTimeout(render, 80); });
  window.addEventListener("pnx:finance:transactions-stable-refreshed", function(){ setTimeout(render, 80); });

  document.addEventListener("DOMContentLoaded", function(){
    bindTabs();
    bindExpand();
    setTimeout(render, 500);
    setTimeout(render, 1400);
  });

  window.PNXStep141CollectTournamentRanking = collectTournamentRanking;
  window.PNXStep141CollectCategoryBreakdown = collectCategoryBreakdown;
  window.PNXStep141CollectMonthlyTrend = collectMonthlyTrend;
  window.PNXStep141RenderAnalysisEnhancement = render;
  window.PNXStep141AnalysisEnhancementStatus = function(){
    return {
      step:141,
      last:window.__PNX_STEP141_LAST_RENDER__ || null,
      tournamentRankingCount:collectTournamentRanking().length,
      categoryCount:collectCategoryBreakdown().length,
      monthlyCount:collectMonthlyTrend().length,
      sampleRanking:collectTournamentRanking().slice(0, 6).map(x => ({
        title:x.title,
        income:x.income,
        expense:x.expense,
        profit:x.profit,
        count:x.count
      })),
      sampleCategory:collectCategoryBreakdown().slice(0, 6).map(x => ({
        category:x.category,
        amount:x.amount,
        rate:x.rate,
        count:x.count
      }))
    };
  };
})();




/* ================================================================
   STEP142: Tax preparation page
   目的:
   - 収支データを申告準備に使える形へ整理
   - 年間収支 / 経費カテゴリ / 大会別明細 / 未確認リスト / CSV / 税理士共有メモ
   注意:
   - ここでのカテゴリは申告準備用の整理ラベル。最終判断は税理士確認想定。
   ================================================================ */
(function(){
  if (window.__PNX_STEP142_TAX_PREP_PAGE__) return;
  window.__PNX_STEP142_TAX_PREP_PAGE__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";

  function text(v){ return String(v == null ? "" : v).trim(); }
  function yen(n){ return "¥" + Number(n || 0).toLocaleString("ja-JP"); }
  function yearOf(date){ return Number(String(date || "").slice(0,4)) || new Date().getFullYear(); }
  function csvEscape(v){ return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }

  function escapeHtml(v){
    return String(v == null ? "" : v)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#39;");
  }

  function readTxs(){
    try {
      if (typeof window.PNXStep138gGetAllFinanceTransactions === "function") {
        return window.PNXStep138gGetAllFinanceTransactions() || [];
      }
    } catch(e) {}
    try {
      const list = JSON.parse(localStorage.getItem(TX_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function normalizeTx(tx){
    tx = tx || {};
    const amount = Number(tx.amount || 0);
    const type = tx.type === "income" ? "income" : "expense";
    return Object.assign({}, tx, {
      id:text(tx.id),
      type,
      amount:Number.isFinite(amount) ? amount : 0,
      date:text(tx.date || tx.startDate || tx.createdAt || ""),
      category:text(tx.category || tx.name || (type === "income" ? "収入" : "その他")),
      memo:text(tx.memo || tx.meta || tx.name || ""),
      tournament:text(tx.tournamentTitle || tx.tournament || tx.tournamentName || ""),
      source:text(tx.source || "manual")
    });
  }

  function taxCategory(tx){
    const cat = text(tx.category);
    const type = tx.type;

    if (type === "income") {
      if (/賞金|prize/i.test(cat)) return "事業収入（賞金）";
      if (/スポンサー|sponsor/i.test(cat)) return "事業収入（スポンサー）";
      if (/レッスン|lesson/i.test(cat)) return "事業収入（レッスン）";
      return "事業収入";
    }

    if (/entryFee|エントリー|参加/i.test(cat)) return "参加費・競技費";
    if (/transport|交通|電車|新幹線|ガソリン|高速|駐車/i.test(cat)) return "旅費交通費";
    if (/hotel|宿泊|ホテル/i.test(cat)) return "旅費交通費（宿泊）";
    if (/meal|食費|飲食/i.test(cat)) return "食費（要確認）";
    if (/practice|練習/i.test(cat)) return "練習費";
    if (/round|ラウンド|プレー/i.test(cat)) return "ラウンド費";
    if (/caddie|キャディ/i.test(cat)) return "キャディ費";
    if (/other|その他/i.test(cat)) return "その他経費";
    return cat || "その他経費";
  }

  function targetYear(){
    const sel = document.getElementById("pnx-step142-year");
    return Number(sel && sel.value) || new Date().getFullYear();
  }

  function availableYears(){
    const years = new Set([new Date().getFullYear()]);
    readTxs().forEach(tx => {
      const y = yearOf(tx.date || tx.createdAt);
      if (y) years.add(y);
    });
    return Array.from(years).sort((a,b)=>b-a);
  }

  function ensureYearSelect(){
    const sel = document.getElementById("pnx-step142-year");
    if (!sel) return;
    const current = sel.value || String(new Date().getFullYear());
    const years = availableYears();
    sel.innerHTML = years.map(y => `<option value="${y}">${y}年</option>`).join("");
    if (years.includes(Number(current))) sel.value = current;
    else sel.value = String(years[0] || new Date().getFullYear());
  }

  function collect(year){
    const y = Number(year) || targetYear();
    const txs = readTxs().map(normalizeTx).filter(tx => yearOf(tx.date || tx.createdAt) === y);
    const validTxs = txs.filter(tx => tx.amount > 0);

    const summary = {
      year:y,
      income:0,
      expense:0,
      profit:0,
      txCount:txs.length,
      validCount:validTxs.length,
      incomeCount:0,
      expenseCount:0
    };

    const categories = new Map();
    const tournaments = new Map();
    const issues = [];

    txs.forEach(tx => {
      if (tx.amount <= 0) {
        issues.push({
          type:"amount",
          level:"red",
          title:"金額が未入力または0円です",
          detail:tx.memo || tx.category || tx.id || "取引"
        });
      }
      if (!tx.date) {
        issues.push({
          type:"date",
          level:"orange",
          title:"日付が未入力です",
          detail:tx.memo || tx.category || tx.id || "取引"
        });
      }
      if (!tx.category || /その他|other/i.test(tx.category)) {
        issues.push({
          type:"category",
          level:"blue",
          title:"カテゴリ確認が必要です",
          detail:tx.memo || tx.tournament || tx.id || "取引"
        });
      }
      if (
        tx.type === "expense" &&
        /entryFee|エントリー|参加|transport|交通|hotel|宿泊|practice|練習|round|ラウンド|caddie|キャディ/i.test(tx.category) &&
        !tx.tournament
      ) {
        issues.push({
          type:"tournament",
          level:"orange",
          title:"大会紐づけを確認してください",
          detail:tx.memo || tx.category || tx.id || "取引"
        });
      }
    });

    validTxs.forEach(tx => {
      if (tx.type === "income") {
        summary.income += tx.amount;
        summary.incomeCount += 1;
      } else {
        summary.expense += tx.amount;
        summary.expenseCount += 1;
      }

      const taxCat = taxCategory(tx);
      if (!categories.has(taxCat)) {
        categories.set(taxCat, { category:taxCat, income:0, expense:0, count:0, txs:[] });
      }
      const c = categories.get(taxCat);
      if (tx.type === "income") c.income += tx.amount;
      else c.expense += tx.amount;
      c.count += 1;
      c.txs.push(tx);

      if (tx.tournament) {
        const key = text(tx.tournamentId) || tx.tournament.toLowerCase().replace(/\s+/g,"");
        if (!tournaments.has(key)) {
          tournaments.set(key, { key, title:tx.tournament, income:0, expense:0, profit:0, count:0, txs:[] });
        }
        const t = tournaments.get(key);
        if (tx.type === "income") t.income += tx.amount;
        else t.expense += tx.amount;
        t.profit = t.income - t.expense;
        t.count += 1;
        t.txs.push(tx);
      }
    });

    summary.profit = summary.income - summary.expense;

    const categoryList = Array.from(categories.values()).sort((a,b) => (b.expense + b.income) - (a.expense + a.income));
    const tournamentList = Array.from(tournaments.values()).sort((a,b) => Math.abs(b.profit) - Math.abs(a.profit));

    const checks = [
      summary.incomeCount > 0,
      summary.expenseCount > 0,
      summary.validCount === summary.txCount && summary.txCount > 0,
      !issues.some(i => i.type === "category"),
      !issues.some(i => i.type === "tournament"),
      summary.txCount > 0
    ];
    const progress = Math.round((checks.filter(Boolean).length / checks.length) * 100);

    return { summary, categories:categoryList, tournaments:tournamentList, issues, progress, txs:validTxs };
  }

  function renderMetrics(data){
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    set("pnx-step142-income", yen(data.summary.income));
    set("pnx-step142-expense", yen(data.summary.expense));
    set("pnx-step142-profit", (data.summary.profit >= 0 ? "+" : "-") + yen(Math.abs(data.summary.profit)));
    set("pnx-step142-progress", data.progress + "%");
    set("pnx-step142-category-count", data.categories.length + "件");
    set("pnx-step142-tournament-count", data.tournaments.length + "大会");
    set("pnx-step142-issue-count", data.issues.length + "件");

    const profit = document.getElementById("pnx-step142-profit");
    if (profit) {
      profit.classList.toggle("is-plus", data.summary.profit >= 0);
      profit.classList.toggle("is-minus", data.summary.profit < 0);
    }

    // 既存の申告準備率リングも実データに合わせる
    try {
      const ringFill = document.getElementById("ring-fill");
      const ringNum = document.querySelector("#ring-label .ring-num");
      if (ringNum) ringNum.textContent = data.progress;
      if (ringFill) {
        const r = 46;
        const circ = 2 * Math.PI * r;
        ringFill.style.strokeDasharray = circ;
        ringFill.style.strokeDashoffset = circ - (data.progress / 100) * circ;
      }
      const sub = document.querySelector(".filing-prep-sub");
      if (sub) {
        sub.textContent = data.issues.length
          ? `確認が必要な項目が${data.issues.length}件あります`
          : "申告準備データはかなり整っています";
      }
    } catch(e) {}
  }

  function renderCategories(data){
    const box = document.getElementById("pnx-step142-category-list");
    if (!box) return;

    if (!data.categories.length) {
      box.innerHTML = '<div class="pnx-taxprep-empty">経費がまだありません</div>';
      return;
    }

    const max = Math.max(1, ...data.categories.map(c => Math.max(c.expense, c.income)));
    box.innerHTML = data.categories.map(c => {
      const amount = c.expense || c.income;
      const width = Math.max(3, Math.round((amount / max) * 100));
      return `
        <div class="pnx-taxprep-row">
          <div class="pnx-taxprep-row-top">
            <div>
              <strong>${escapeHtml(c.category)}</strong>
              <span>${c.count}件</span>
            </div>
            <b>${yen(amount)}</b>
          </div>
          <div class="pnx-taxprep-bar"><span style="width:${width}%"></span></div>
        </div>
      `;
    }).join("");
  }

  function renderTournaments(data){
    const box = document.getElementById("pnx-step142-tournament-list");
    if (!box) return;

    if (!data.tournaments.length) {
      box.innerHTML = '<div class="pnx-taxprep-empty">大会に紐づく取引がまだありません</div>';
      return;
    }

    box.innerHTML = data.tournaments.map(t => {
      const cls = t.profit >= 0 ? "is-plus" : "is-minus";
      return `
        <div class="pnx-taxprep-tournament-row">
          <div>
            <strong>${escapeHtml(t.title)}</strong>
            <span>収入 ${yen(t.income)} / 経費 ${yen(t.expense)} / ${t.count}件</span>
          </div>
          <b class="${cls}">${t.profit >= 0 ? "+" : "-"}${yen(Math.abs(t.profit))}</b>
        </div>
      `;
    }).join("");
  }

  function renderIssues(data){
    const box = document.getElementById("pnx-step142-issue-list");
    if (!box) return;

    if (!data.issues.length) {
      box.innerHTML = '<div class="pnx-taxprep-empty">未確認項目はありません</div>';
      return;
    }

    box.innerHTML = data.issues.slice(0, 12).map(issue => `
      <div class="pnx-taxprep-issue is-${escapeHtml(issue.level)}">
        <span></span>
        <div>
          <strong>${escapeHtml(issue.title)}</strong>
          <p>${escapeHtml(issue.detail)}</p>
        </div>
      </div>
    `).join("");
  }

  function render(){
    ensureYearSelect();
    const data = collect(targetYear());

    renderMetrics(data);
    renderCategories(data);
    renderTournaments(data);
    renderIssues(data);

    const status = document.getElementById("pnx-step142-action-status");
    if (status) {
      status.textContent = `${data.summary.year}年：収入${yen(data.summary.income)} / 経費${yen(data.summary.expense)} / 確認${data.issues.length}件`;
      status.classList.toggle("is-success", data.issues.length === 0 && data.summary.txCount > 0);
    }

    window.__PNX_STEP142_LAST_TAX_PREP__ = {
      at:new Date().toISOString(),
      year:data.summary.year,
      progress:data.progress,
      income:data.summary.income,
      expense:data.summary.expense,
      profit:data.summary.profit,
      issues:data.issues.length,
      categories:data.categories.length,
      tournaments:data.tournaments.length
    };

    return data;
  }

  function exportCsv(){
    const data = collect(targetYear());
    const rows = [
      ["日付","収支区分","申告用カテゴリ","元カテゴリ","大会","内容","金額","メモ"],
      ...data.txs.map(tx => [
        tx.date,
        tx.type === "income" ? "収入" : "支出",
        taxCategory(tx),
        tx.category,
        tx.tournament,
        tx.name || tx.displayName || tx.memo,
        tx.amount,
        tx.memo
      ])
    ];

    const csv = rows.map(row => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type:"text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pronexax_tax_prep_${data.summary.year}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);

    const status = document.getElementById("pnx-step142-action-status");
    if (status) {
      status.textContent = "CSVを保存しました";
      status.classList.add("is-success");
    }
  }

  function summaryText(){
    const data = collect(targetYear());
    const cats = data.categories.map(c => `・${c.category}: ${yen(c.expense || c.income)}（${c.count}件）`).join("\n") || "・なし";
    const tournaments = data.tournaments.map(t => `・${t.title}: 収入${yen(t.income)} / 経費${yen(t.expense)} / 利益${yen(t.profit)}`).join("\n") || "・なし";
    const issues = data.issues.map(i => `・${i.title}: ${i.detail}`).join("\n") || "・未確認項目なし";

    return [
      `ProNexaX 申告準備メモ（${data.summary.year}年）`,
      "",
      `年間収入: ${yen(data.summary.income)}`,
      `年間経費: ${yen(data.summary.expense)}`,
      `年間利益: ${yen(data.summary.profit)}`,
      `取引件数: ${data.summary.txCount}件`,
      `申告準備率: ${data.progress}%`,
      "",
      "【経費カテゴリ別】",
      cats,
      "",
      "【大会別明細】",
      tournaments,
      "",
      "【未確認・要整理】",
      issues,
      "",
      "※このメモは申告準備用の整理です。最終的な税務判断は税理士・税務署確認前提。"
    ].join("\n");
  }

  async function copySummary(){
    const memo = summaryText();
    try {
      await navigator.clipboard.writeText(memo);
      const status = document.getElementById("pnx-step142-action-status");
      if (status) {
        status.textContent = "税理士共有メモをコピーしました";
        status.classList.add("is-success");
      }
    } catch(e) {
      const area = document.createElement("textarea");
      area.value = memo;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
  }

  function bind(){
    const year = document.getElementById("pnx-step142-year");
    if (year && !year.__pnxStep142Bound) {
      year.__pnxStep142Bound = true;
      year.addEventListener("change", render);
    }

    const refresh = document.getElementById("pnx-step142-refresh");
    if (refresh && !refresh.__pnxStep142Bound) {
      refresh.__pnxStep142Bound = true;
      refresh.addEventListener("click", render);
    }

    const csv = document.getElementById("pnx-step142-export-csv");
    if (csv && !csv.__pnxStep142Bound) {
      csv.__pnxStep142Bound = true;
      csv.addEventListener("click", exportCsv);
    }

    const copy = document.getElementById("pnx-step142-copy-summary");
    if (copy && !copy.__pnxStep142Bound) {
      copy.__pnxStep142Bound = true;
      copy.addEventListener("click", copySummary);
    }
  }

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_FINANCE_TRANSACTION_CREATED" ||
      data.type === "PNX_FINANCE_TRANSACTION_UPDATED" ||
      data.type === "PNX_FINANCE_TRANSACTION_DELETED" ||
      data.type === "PNX_FINANCE_TRANSACTION_UPSERTED_STEP139"
    ) {
      setTimeout(render, 80);
      setTimeout(render, 350);
    }
  });

  window.addEventListener("storage", function(e){
    if (e.key === TX_KEY) setTimeout(render, 80);
  });

  window.addEventListener("pnx:finance:transactions-updated", function(){ setTimeout(render, 80); });
  window.addEventListener("pnx:finance:transactions-stable-refreshed", function(){ setTimeout(render, 80); });

  document.addEventListener("click", function(e){
    if (e.target && e.target.closest && e.target.closest('.fin-tab[data-tab="filing"]')) {
      setTimeout(render, 120);
      setTimeout(render, 500);
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    bind();
    setTimeout(bind, 700);
    setTimeout(render, 800);
    setTimeout(render, 1600);
  });

  window.PNXStep142CollectTaxPrep = collect;
  window.PNXStep142RenderTaxPrep = render;
  window.PNXStep142ExportTaxCsv = exportCsv;
  window.PNXStep142TaxPrepSummaryText = summaryText;
  window.PNXStep142TaxPrepStatus = function(){
    const data = collect(targetYear());
    return {
      step:142,
      last:window.__PNX_STEP142_LAST_TAX_PREP__ || null,
      year:data.summary.year,
      progress:data.progress,
      income:data.summary.income,
      expense:data.summary.expense,
      profit:data.summary.profit,
      txCount:data.summary.txCount,
      categoryCount:data.categories.length,
      tournamentCount:data.tournaments.length,
      issueCount:data.issues.length,
      categories:data.categories.slice(0,8).map(c => ({
        category:c.category,
        income:c.income,
        expense:c.expense,
        count:c.count
      })),
      issues:data.issues.slice(0,8)
    };
  };
})();




/* ================================================================
   STEP143: Finance UI unify status
   ================================================================ */
(function(){
  if (window.__PNX_STEP143_FINANCE_UI_UNIFY__) return;
  window.__PNX_STEP143_FINANCE_UI_UNIFY__ = true;

  window.PNXStep143FinanceUiUnifyStatus = function(){
    const root = document.getElementById("finance-root");
    const cards = document.querySelectorAll(
      ".metric-card,.profit-card,.tx-section,.chart-card,.filing-prep-card,.pnx-tour-summary-card,.pnx-analysis-enhance-card,.pnx-taxprep-dashboard"
    );
    return {
      step:143,
      uiDirection:"reference-white-blue-card-apple-freee-moneyforward",
      rootMarked:!!(root && root.classList.contains("pnx-step143-ui-unify")),
      cardCount:cards.length,
      version:window.__PNX_FINANCE_SCRIPT_VERSION__ || null,
      note:"参考画像の白×青・カード型・余白広めの方向へUIを統一"
    };
  };
})();




/* ================================================================
   STEP144: Tax documents creation page
   目的:
   - 参考画像⑤「申告書類の作成」に近い導線を追加
   - PDF風の印刷HTML / CSV保存 / 税理士共有メモ / e-Tax導線
   注意:
   - PDFはブラウザの印刷/保存機能を使う土台
   - 税務書類の正式作成代行ではなく、申告準備用データ作成
   ================================================================ */
(function(){
  if (window.__PNX_STEP144_TAX_DOCUMENTS_PAGE__) return;
  window.__PNX_STEP144_TAX_DOCUMENTS_PAGE__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";

  function text(v){ return String(v == null ? "" : v).trim(); }
  function yen(n){ return "¥" + Number(n || 0).toLocaleString("ja-JP"); }
  function yearOf(date){ return Number(String(date || "").slice(0,4)) || new Date().getFullYear(); }
  function csvEscape(v){ return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }

  function escapeHtml(v){
    return String(v == null ? "" : v)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#39;");
  }

  function readTxs(){
    try {
      if (typeof window.PNXStep138gGetAllFinanceTransactions === "function") {
        return window.PNXStep138gGetAllFinanceTransactions() || [];
      }
    } catch(e) {}
    try {
      const list = JSON.parse(localStorage.getItem(TX_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function normalizeTx(tx){
    tx = tx || {};
    const amount = Number(tx.amount || 0);
    const type = tx.type === "income" ? "income" : "expense";
    return Object.assign({}, tx, {
      id:text(tx.id),
      type,
      amount:Number.isFinite(amount) ? amount : 0,
      date:text(tx.date || tx.startDate || tx.createdAt || ""),
      category:text(tx.category || tx.name || (type === "income" ? "収入" : "その他")),
      memo:text(tx.memo || tx.meta || tx.name || ""),
      tournament:text(tx.tournamentTitle || tx.tournament || tx.tournamentName || ""),
      source:text(tx.source || "manual")
    });
  }

  function targetYear(){
    const sel = document.getElementById("pnx-step142-year");
    return Number(sel && sel.value) || new Date().getFullYear();
  }

  function taxCategory(tx){
    const cat = text(tx.category);
    if (tx.type === "income") {
      if (/賞金|prize/i.test(cat)) return "事業収入（賞金）";
      if (/スポンサー|sponsor/i.test(cat)) return "事業収入（スポンサー）";
      if (/レッスン|lesson/i.test(cat)) return "事業収入（レッスン）";
      return "事業収入";
    }
    if (/entryFee|エントリー|参加/i.test(cat)) return "参加費・競技費";
    if (/transport|交通|電車|新幹線|ガソリン|高速|駐車/i.test(cat)) return "旅費交通費";
    if (/hotel|宿泊|ホテル/i.test(cat)) return "旅費交通費（宿泊）";
    if (/meal|食費|飲食/i.test(cat)) return "食費（要確認）";
    if (/practice|練習/i.test(cat)) return "練習費";
    if (/round|ラウンド|プレー/i.test(cat)) return "ラウンド費";
    if (/caddie|キャディ/i.test(cat)) return "キャディ費";
    if (/other|その他/i.test(cat)) return "その他経費";
    return cat || "その他経費";
  }

  function collect(year){
    const y = Number(year) || targetYear();
    const txs = readTxs().map(normalizeTx).filter(tx => yearOf(tx.date || tx.createdAt) === y && tx.amount > 0);

    const summary = { year:y, income:0, expense:0, profit:0, count:txs.length };
    const cats = new Map();
    const tournaments = new Map();

    txs.forEach(tx => {
      if (tx.type === "income") summary.income += tx.amount;
      else summary.expense += tx.amount;

      const cat = taxCategory(tx);
      if (!cats.has(cat)) cats.set(cat, { category:cat, income:0, expense:0, count:0 });
      const c = cats.get(cat);
      if (tx.type === "income") c.income += tx.amount;
      else c.expense += tx.amount;
      c.count++;

      if (tx.tournament) {
        const key = text(tx.tournamentId) || tx.tournament.toLowerCase().replace(/\s+/g,"");
        if (!tournaments.has(key)) tournaments.set(key, { title:tx.tournament, income:0, expense:0, profit:0, count:0 });
        const t = tournaments.get(key);
        if (tx.type === "income") t.income += tx.amount;
        else t.expense += tx.amount;
        t.profit = t.income - t.expense;
        t.count++;
      }
    });

    summary.profit = summary.income - summary.expense;

    return {
      summary,
      txs:txs.sort((a,b)=>String(a.date).localeCompare(String(b.date))),
      categories:Array.from(cats.values()).sort((a,b)=>(b.income+b.expense)-(a.income+a.expense)),
      tournaments:Array.from(tournaments.values()).sort((a,b)=>Math.abs(b.profit)-Math.abs(a.profit))
    };
  }

  function setStatus(msg, ok){
    const el = document.getElementById("pnx-step144-doc-status");
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("is-success", !!ok);
  }

  function csvDownload(filename, rows){
    const csv = rows.map(row => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type:"text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }

  function createAnnualCsv(){
    const data = collect(targetYear());
    csvDownload(`pronexax_annual_detail_${data.summary.year}.csv`, [
      ["日付","収支区分","申告用カテゴリ","元カテゴリ","大会","内容","金額","メモ"],
      ...data.txs.map(tx => [
        tx.date,
        tx.type === "income" ? "収入" : "支出",
        taxCategory(tx),
        tx.category,
        tx.tournament,
        tx.name || tx.memo,
        tx.amount,
        tx.memo
      ])
    ]);
    setStatus("年間収支一覧CSVを保存しました", true);
  }

  function createExpenseCsv(){
    const data = collect(targetYear());
    csvDownload(`pronexax_expense_list_${data.summary.year}.csv`, [
      ["申告用カテゴリ","経費合計","件数"],
      ...data.categories.filter(c => c.expense > 0).map(c => [c.category, c.expense, c.count])
    ]);
    setStatus("経費一覧表CSVを保存しました", true);
  }

  function createTournamentCsv(){
    const data = collect(targetYear());
    csvDownload(`pronexax_tournament_profit_${data.summary.year}.csv`, [
      ["大会名","収入","経費","利益","件数"],
      ...data.tournaments.map(t => [t.title, t.income, t.expense, t.profit, t.count])
    ]);
    setStatus("大会別収支一覧CSVを保存しました", true);
  }

  function printableHtml(kind){
    const data = collect(targetYear());
    const title = kind === "simple" ? "収支内訳書（簡易版）" : "収支内訳書（一般用）";

    const catRows = data.categories.map(c => `
      <tr>
        <td>${escapeHtml(c.category)}</td>
        <td class="num">${yen(c.income)}</td>
        <td class="num">${yen(c.expense)}</td>
        <td class="num">${c.count}</td>
      </tr>
    `).join("");

    const txRows = data.txs.slice(0, kind === "simple" ? 20 : 9999).map(tx => `
      <tr>
        <td>${escapeHtml(tx.date)}</td>
        <td>${escapeHtml(tx.type === "income" ? "収入" : "支出")}</td>
        <td>${escapeHtml(taxCategory(tx))}</td>
        <td>${escapeHtml(tx.tournament || "")}</td>
        <td>${escapeHtml(tx.memo || tx.name || "")}</td>
        <td class="num">${yen(tx.amount)}</td>
      </tr>
    `).join("");

    return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Noto Sans JP",sans-serif;color:#101828;margin:28px;background:#fff;}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #2563EB;padding-bottom:16px;margin-bottom:20px;}
  h1{margin:0;font-size:24px;letter-spacing:-.04em;}
  .sub{color:#667085;font-size:13px;margin-top:6px;}
  .badge{border:1px solid #B2CCFF;color:#175CD3;border-radius:999px;padding:7px 12px;font-weight:800;font-size:12px;}
  .metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:18px 0;}
  .metric{border:1px solid #EAECF0;border-radius:14px;padding:14px;}
  .metric span{display:block;color:#667085;font-size:12px;margin-bottom:6px;}
  .metric strong{font-size:20px;}
  h2{font-size:16px;margin:24px 0 10px;}
  table{width:100%;border-collapse:collapse;font-size:12px;}
  th{background:#F2F4F7;text-align:left;padding:9px;border:1px solid #EAECF0;}
  td{padding:8px;border:1px solid #EAECF0;vertical-align:top;}
  .num{text-align:right;font-variant-numeric:tabular-nums;}
  .note{margin-top:22px;color:#667085;font-size:11px;line-height:1.6;}
  @media print{button{display:none} body{margin:18px}}
</style>
</head>
<body>
  <div class="head">
    <div>
      <h1>${escapeHtml(title)}</h1>
      <div class="sub">ProNexaX finance / ${data.summary.year}年 / 作成日 ${new Date().toLocaleDateString("ja-JP")}</div>
    </div>
    <div class="badge">確認用</div>
  </div>

  <div class="metrics">
    <div class="metric"><span>年間収入</span><strong>${yen(data.summary.income)}</strong></div>
    <div class="metric"><span>年間経費</span><strong>${yen(data.summary.expense)}</strong></div>
    <div class="metric"><span>年間利益</span><strong>${yen(data.summary.profit)}</strong></div>
  </div>

  <h2>カテゴリ別集計</h2>
  <table>
    <thead><tr><th>申告用カテゴリ</th><th>収入</th><th>経費</th><th>件数</th></tr></thead>
    <tbody>${catRows || '<tr><td colspan="4">データなし</td></tr>'}</tbody>
  </table>

  <h2>取引明細</h2>
  <table>
    <thead><tr><th>日付</th><th>区分</th><th>カテゴリ</th><th>大会</th><th>内容</th><th>金額</th></tr></thead>
    <tbody>${txRows || '<tr><td colspan="6">データなし</td></tr>'}</tbody>
  </table>

  <div class="note">
    ※この書類はProNexaX financeの入力データから作成した確認用資料です。<br>
    ※税務書類の正式な作成・提出前には、必要に応じて税理士・税務署へ確認してください。
  </div>

  <script>window.onload=function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body>
</html>`;
  }

  function openPrintable(kind){
    const html = printableHtml(kind);
    const win = window.open("", "_blank");
    if (!win) {
      setStatus("ポップアップがブロックされました。ブラウザ設定を確認してください。", false);
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    setStatus("印刷画面を開きました。PDF保存できます。", true);
  }

  function summaryText(){
    const data = collect(targetYear());
    const categories = data.categories.map(c => `・${c.category}: 収入${yen(c.income)} / 経費${yen(c.expense)}（${c.count}件）`).join("\n") || "・なし";
    const tournaments = data.tournaments.map(t => `・${t.title}: 収入${yen(t.income)} / 経費${yen(t.expense)} / 利益${yen(t.profit)}（${t.count}件）`).join("\n") || "・なし";

    return [
      `ProNexaX 申告書類作成メモ（${data.summary.year}年）`,
      "",
      `年間収入: ${yen(data.summary.income)}`,
      `年間経費: ${yen(data.summary.expense)}`,
      `年間利益: ${yen(data.summary.profit)}`,
      `取引件数: ${data.summary.count}件`,
      "",
      "【カテゴリ別】",
      categories,
      "",
      "【大会別】",
      tournaments,
      "",
      "【作成候補】",
      "・収支内訳書（一般用）",
      "・収支内訳書（簡易版）",
      "・年間収支一覧（CSV）",
      "・経費一覧表（CSV）",
      "・大会別収支一覧（CSV）",
      "",
      "※入力データをもとにした確認用メモです。最終確認は税理士・税務署確認前提。"
    ].join("\n");
  }

  async function copyTaxPack(){
    const memo = summaryText();
    try {
      await navigator.clipboard.writeText(memo);
      setStatus("税理士共有メモをコピーしました", true);
    } catch(e) {
      const area = document.createElement("textarea");
      area.value = memo;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      setStatus("税理士共有メモをコピーしました", true);
    }
  }

  function goEtax(){
    setStatus("e-Taxページを開きます。入力内容は事前に確認してください。", true);
    try {
      window.open("https://www.e-tax.nta.go.jp/", "_blank", "noopener");
    } catch(e) {}
  }

  function render(){
    const data = collect(targetYear());

    const year = document.getElementById("pnx-step144-doc-year");
    if (year) year.textContent = data.summary.year + "年";

    const count = document.getElementById("pnx-step144-doc-count");
    if (count) count.textContent = data.summary.count ? "5件" : "準備中";

    const deadline = document.getElementById("pnx-step144-deadline-text");
    if (deadline) {
      deadline.textContent = `${data.summary.year}年分の申告期限は、最新情報を税務署・e-Taxで確認してください。`;
    }

    setStatus(
      data.summary.count
        ? `${data.summary.year}年：${data.summary.count}件の取引から書類を作成できます`
        : "取引を入力すると書類作成データが表示されます",
      data.summary.count > 0
    );

    window.__PNX_STEP144_LAST_TAX_DOCS__ = {
      at:new Date().toISOString(),
      year:data.summary.year,
      txCount:data.summary.count,
      income:data.summary.income,
      expense:data.summary.expense,
      profit:data.summary.profit,
      categories:data.categories.length,
      tournaments:data.tournaments.length
    };

    return data;
  }

  function bind(){
    document.querySelectorAll("[data-pnx-doc]").forEach(btn => {
      if (btn.__pnxStep144Bound) return;
      btn.__pnxStep144Bound = true;
      btn.addEventListener("click", function(){
        const doc = this.dataset.pnxDoc;
        if (doc === "income-expense-general") return openPrintable("general");
        if (doc === "income-expense-simple") return openPrintable("simple");
        if (doc === "annual-detail") return createAnnualCsv();
        if (doc === "expense-list") return createExpenseCsv();
        if (doc === "tournament-list") return createTournamentCsv();
      });
    });

    const copy = document.getElementById("pnx-step144-copy-taxpack");
    if (copy && !copy.__pnxStep144Bound) {
      copy.__pnxStep144Bound = true;
      copy.addEventListener("click", copyTaxPack);
    }

    const print = document.getElementById("pnx-step144-print-pack");
    if (print && !print.__pnxStep144Bound) {
      print.__pnxStep144Bound = true;
      print.addEventListener("click", function(){ openPrintable("general"); });
    }

    const etax = document.getElementById("pnx-step144-etax-btn");
    if (etax && !etax.__pnxStep144Bound) {
      etax.__pnxStep144Bound = true;
      etax.addEventListener("click", goEtax);
    }

    const back = document.getElementById("pnx-step144-back");
    if (back && !back.__pnxStep144Bound) {
      back.__pnxStep144Bound = true;
      back.addEventListener("click", function(){
        const target = document.getElementById("pnx-step142-taxprep");
        if (target && target.scrollIntoView) target.scrollIntoView({ behavior:"smooth", block:"start" });
      });
    }

    const year = document.getElementById("pnx-step142-year");
    if (year && !year.__pnxStep144Bound) {
      year.__pnxStep144Bound = true;
      year.addEventListener("change", function(){ setTimeout(render, 40); });
    }
  }

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (
      data.type === "PNX_FINANCE_TRANSACTION_CREATED" ||
      data.type === "PNX_FINANCE_TRANSACTION_UPDATED" ||
      data.type === "PNX_FINANCE_TRANSACTION_DELETED" ||
      data.type === "PNX_FINANCE_TRANSACTION_UPSERTED_STEP139"
    ) {
      setTimeout(render, 80);
      setTimeout(render, 350);
    }
  });

  window.addEventListener("storage", function(e){
    if (e.key === TX_KEY) setTimeout(render, 80);
  });

  window.addEventListener("pnx:finance:transactions-updated", function(){ setTimeout(render, 80); });
  window.addEventListener("pnx:finance:transactions-stable-refreshed", function(){ setTimeout(render, 80); });

  document.addEventListener("click", function(e){
    if (e.target && e.target.closest && e.target.closest('.fin-tab[data-tab="filing"]')) {
      setTimeout(render, 140);
      setTimeout(render, 500);
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    bind();
    setTimeout(bind, 700);
    setTimeout(render, 800);
    setTimeout(render, 1600);
  });

  window.PNXStep144CollectTaxDocuments = collect;
  window.PNXStep144RenderTaxDocuments = render;
  window.PNXStep144TaxDocumentsSummaryText = summaryText;
  window.PNXStep144OpenPrintableTaxDocument = openPrintable;
  window.PNXStep144TaxDocumentsStatus = function(){
    const data = collect(targetYear());
    return {
      step:144,
      last:window.__PNX_STEP144_LAST_TAX_DOCS__ || null,
      year:data.summary.year,
      txCount:data.summary.count,
      income:data.summary.income,
      expense:data.summary.expense,
      profit:data.summary.profit,
      categoryCount:data.categories.length,
      tournamentCount:data.tournaments.length,
      documents:[
        "収支内訳書（一般用）PDF",
        "収支内訳書（簡易版）PDF",
        "年間収支一覧 CSV",
        "経費一覧表 CSV",
        "大会別収支一覧 CSV"
      ]
    };
  };
})();




/* ================================================================
   STEP145: Finance typography unify status
   ================================================================ */
(function(){
  if (window.__PNX_STEP145_FINANCE_TYPOGRAPHY_UNIFY__) return;
  window.__PNX_STEP145_FINANCE_TYPOGRAPHY_UNIFY__ = true;

  window.PNXStep145FinanceTypographyStatus = function(){
    const root = document.getElementById("finance-root");
    const sample = root ? getComputedStyle(root) : null;
    return {
      step:145,
      typography:"Apple-like SF Pro / Hiragino / system font",
      rootExists:!!root,
      fontFamily:sample ? sample.fontFamily : null,
      fontWeight:sample ? sample.fontWeight : null,
      version:window.__PNX_FINANCE_SCRIPT_VERSION__ || null,
      note:"収支アプリ全体の太すぎる文字を抑え、Apple純正風の軽いタイポグラフィに統一"
    };
  };
})();




/* ================================================================
   STEP146: Receipt scan / OCR-style input foundation
   目的:
   - レシート画像を選択
   - 日付/金額/内容/カテゴリを確認
   - 通常取引として保存
   - 将来OCR APIへ差し替えやすい構造にする
   ================================================================ */
(function(){
  if (window.__PNX_STEP146_RECEIPT_SCAN_INPUT__) return;
  window.__PNX_STEP146_RECEIPT_SCAN_INPUT__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";

  function today(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function text(v){ return String(v == null ? "" : v).trim(); }

  function readTxs(){
    try {
      const list = JSON.parse(localStorage.getItem(TX_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function writeTxs(list){
    localStorage.setItem(TX_KEY, JSON.stringify(Array.isArray(list) ? list : []));
  }

  function status(msg, ok){
    const el = document.getElementById("pnx-step146-receipt-status");
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("is-success", !!ok);
    el.classList.toggle("is-error", ok === false);
  }

  function sheet(){
    return document.getElementById("pnx-step146-receipt-sheet");
  }

  function openSheet(){
    const s = sheet();
    if (!s) return;
    s.classList.add("is-open");
    s.setAttribute("aria-hidden", "false");
    document.body.classList.add("pnx-receipt-open");
    const date = document.getElementById("pnx-step146-date");
    if (date && !date.value) date.value = today();
    status("レシート画像を選択してください");
    window.__PNX_STEP146_LAST_OPEN__ = new Date().toISOString();
  }

  function closeSheet(){
    const s = sheet();
    if (!s) return;
    s.classList.remove("is-open");
    s.setAttribute("aria-hidden", "true");
    document.body.classList.remove("pnx-receipt-open");
  }

  function setPreview(file){
    const wrap = document.getElementById("pnx-step146-preview-wrap");
    const img = document.getElementById("pnx-step146-receipt-preview");
    if (!file || !img || !wrap) return;

    const reader = new FileReader();
    reader.onload = function(){
      img.src = reader.result;
      wrap.classList.add("is-visible");
      window.__PNX_STEP146_RECEIPT_IMAGE__ = {
        name:file.name,
        type:file.type,
        size:file.size,
        dataUrl:String(reader.result || "").slice(0, 120)
      };
      status("画像を読み込みました。内容を確認してください。", true);
    };
    reader.readAsDataURL(file);
  }

  function guessCategory(memo){
    const m = text(memo);
    if (/新幹線|電車|高速|ガソリン|駐車|タクシー|バス|交通/.test(m)) return "交通費";
    if (/ホテル|宿泊|旅館/.test(m)) return "宿泊費";
    if (/エントリー|参加費|競技/.test(m)) return "エントリー費";
    if (/練習|レンジ|打席/.test(m)) return "練習場代";
    if (/ラウンド|プレー|グリーンフィ/.test(m)) return "ラウンド代";
    if (/キャディ/.test(m)) return "キャディ代";
    if (/食|弁当|レストラン|コンビニ|飲食/.test(m)) return "食費";
    return "その他";
  }

  function mockRead(){
    const memo = document.getElementById("pnx-step146-memo");
    const amount = document.getElementById("pnx-step146-amount");
    const date = document.getElementById("pnx-step146-date");
    const category = document.getElementById("pnx-step146-category");
    const file = document.getElementById("pnx-step146-receipt-file");

    if (date && !date.value) date.value = today();

    // 実OCR前の仮読み取り。ファイル名から少しだけ候補を作る。
    const name = file && file.files && file.files[0] ? file.files[0].name : "";
    let candidateMemo = "レシート";
    if (/gas|fuel|高速|交通|train|shinkansen/i.test(name)) candidateMemo = "交通費";
    if (/hotel|宿泊/i.test(name)) candidateMemo = "宿泊費";
    if (/entry|エントリー/i.test(name)) candidateMemo = "エントリー費";
    if (/practice|練習/i.test(name)) candidateMemo = "練習場代";

    if (memo && !memo.value) memo.value = candidateMemo;
    if (category) category.value = guessCategory(memo ? memo.value : candidateMemo);

    if (amount && !amount.value) {
      const nums = name.match(/\d{3,6}/);
      if (nums) amount.value = nums[0];
    }

    status("読み取り候補を入力しました。金額を確認してください。", true);
  }

  function save(){
    const date = document.getElementById("pnx-step146-date");
    const amount = document.getElementById("pnx-step146-amount");
    const memo = document.getElementById("pnx-step146-memo");
    const category = document.getElementById("pnx-step146-category");
    const tournament = document.getElementById("pnx-step146-tournament");
    const file = document.getElementById("pnx-step146-receipt-file");

    const value = Number(amount && amount.value || 0);
    if (!value) {
      status("金額を入力してください。", false);
      return;
    }

    const now = new Date().toISOString();
    const fileInfo = file && file.files && file.files[0] ? file.files[0] : null;
    const tx = {
      id:"tx_receipt_" + Date.now() + "_" + Math.random().toString(16).slice(2,7),
      date:date && date.value ? date.value : today(),
      type:"expense",
      name:text(memo && memo.value) || text(category && category.value) || "レシート",
      memo:text(memo && memo.value) || "レシート",
      meta:text(tournament && tournament.value) || text(category && category.value) || "レシート",
      amount:value,
      category:text(category && category.value) || "その他",
      tournament:text(tournament && tournament.value) || "",
      tournamentTitle:text(tournament && tournament.value) || "",
      source:"manual",
      receipt:true,
      receiptFileName:fileInfo ? fileInfo.name : "",
      receiptFileSize:fileInfo ? fileInfo.size : 0,
      createdAt:now,
      updatedAt:now
    };

    const txs = readTxs();
    txs.push(tx);
    writeTxs(txs);

    try {
      window.parent && window.parent.postMessage({ type:"PNX_UPSERT_FINANCE_TRANSACTION_STEP139", payload:tx }, "*");
    } catch(e) {}

    try {
      window.dispatchEvent(new CustomEvent("pnx:finance:transactions-updated", {
        detail:{ transactions:txs, item:tx, action:"created" }
      }));
    } catch(e) {}

    try {
      if (window.PNXFinance && typeof window.PNXFinance.refreshData === "function") {
        window.PNXFinance.refreshData();
      }
    } catch(e) {}

    status("レシート取引を保存しました。", true);

    setTimeout(function(){
      closeSheet();
      clearForm();
    }, 550);
  }

  function clearForm(){
    const ids = [
      "pnx-step146-receipt-file",
      "pnx-step146-amount",
      "pnx-step146-memo",
      "pnx-step146-tournament"
    ];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    const date = document.getElementById("pnx-step146-date");
    if (date) date.value = today();
    const category = document.getElementById("pnx-step146-category");
    if (category) category.value = "交通費";
    const wrap = document.getElementById("pnx-step146-preview-wrap");
    const img = document.getElementById("pnx-step146-receipt-preview");
    if (wrap) wrap.classList.remove("is-visible");
    if (img) img.removeAttribute("src");
  }

  function bind(){
    const open = document.getElementById("pnx-step146-open-receipt");
    if (open && !open.__pnxStep146Bound) {
      open.__pnxStep146Bound = true;
      open.addEventListener("click", openSheet);
    }

    const file = document.getElementById("pnx-step146-receipt-file");
    if (file && !file.__pnxStep146Bound) {
      file.__pnxStep146Bound = true;
      file.addEventListener("change", function(){
        const f = this.files && this.files[0];
        if (f) setPreview(f);
      });
    }

    const read = document.getElementById("pnx-step146-mock-read");
    if (read && !read.__pnxStep146Bound) {
      read.__pnxStep146Bound = true;
      read.addEventListener("click", mockRead);
    }

    const saveBtn = document.getElementById("pnx-step146-save-receipt");
    if (saveBtn && !saveBtn.__pnxStep146Bound) {
      saveBtn.__pnxStep146Bound = true;
      saveBtn.addEventListener("click", save);
    }

    const s = sheet();
    if (s && !s.__pnxStep146Bound) {
      s.__pnxStep146Bound = true;
      s.addEventListener("click", function(e){
        const close = e.target && e.target.closest && e.target.closest("[data-pnx-receipt-close]");
        if (!close) return;
        e.preventDefault();
        closeSheet();
      }, true);

      const panel = s.querySelector(".pnx-receipt-panel");
      if (panel) {
        ["click","mousedown","mouseup","touchstart","touchend","pointerdown","pointerup","input","change","focusin"].forEach(type => {
          panel.addEventListener(type, function(e){
            if (e.target && e.target.closest && e.target.closest("[data-pnx-receipt-close], #pnx-step146-save-receipt, #pnx-step146-mock-read")) return;
            e.stopPropagation();
          }, true);
        });
      }
    }
  }

  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && sheet() && sheet().classList.contains("is-open")) closeSheet();
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    bind();
    setTimeout(bind, 600);
    setTimeout(bind, 1400);
  });

  window.PNXStep146OpenReceiptScan = openSheet;
  window.PNXStep146CloseReceiptScan = closeSheet;
  window.PNXStep146ReceiptScanStatus = function(){
    const txs = readTxs();
    const receiptTxs = txs.filter(tx => tx && tx.receipt);
    return {
      step:146,
      sheetExists:!!sheet(),
      sheetOpen:!!(sheet() && sheet().classList.contains("is-open")),
      receiptTxCount:receiptTxs.length,
      lastOpen:window.__PNX_STEP146_LAST_OPEN__ || null,
      sample:receiptTxs.slice(-8).map(tx => ({
        id:tx.id,
        date:tx.date,
        amount:tx.amount,
        category:tx.category,
        memo:tx.memo,
        receiptFileName:tx.receiptFileName
      })),
      note:"実OCR前の土台。画像選択→確認→保存の流れを実装"
    };
  };
})();




/* ================================================================
   STEP147: Overview quick actions reorder
   目的:
   - 概要画面の「レシート撮影で入力」と「大会と取引を紐付ける」を
     まとめて概要上部へ移動する
   - 最近の取引より上、分析/大会別カードより上に配置
   ================================================================ */
(function(){
  if (window.__PNX_STEP147_OVERVIEW_QUICK_ACTIONS_REORDER__) return;
  window.__PNX_STEP147_OVERVIEW_QUICK_ACTIONS_REORDER__ = true;

  function text(el){ return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  function findOverviewPanel(){
    return document.querySelector('#panel-overview, [data-panel="overview"], .fin-panel[data-panel="overview"], .fin-panel.overview, .overview-panel') 
      || document.querySelector('.fin-panel:not([hidden])')
      || document.querySelector('#finance-root');
  }

  function findReceiptCard(){
    return document.getElementById("pnx-step146-receipt-card");
  }

  function findTournamentLinkCard(){
    const explicit = document.querySelector('[data-pnx-finance-link-cta], [data-finance-action="tournament-link"], .pnx-fin-link-trigger');
    if (explicit && /大会と取引を紐付ける/.test(text(explicit))) {
      return explicit.closest("section, article, .card, .tx-section, .pnx-overview-action-card, .quick-card, .action-card, div") || explicit;
    }

    const candidates = Array.from(document.querySelectorAll("section, article, button, a, div"))
      .filter(el => /大会と取引を紐付ける/.test(text(el)))
      .filter(el => !el.closest("#pnx-fin-link-sheet, #add-modal, .fin-tabs, .fin-tab, #pnx-step146-receipt-card, .pnx-receipt-card, #pnx-step146-receipt-sheet, .pnx-receipt-sheet"))
      .filter(el => el.id !== "pnx-step147-quick-actions" && !(el.classList && el.classList.contains("pnx-step147-quick-actions")))
      .filter(el => !(el.querySelector && el.querySelector("#pnx-step146-receipt-card, .pnx-receipt-card")))
      .filter(el => {
        const r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
        if (!r) return true;
        return r.height <= 150 && r.width <= Math.max(430, window.innerWidth || 390);
      });

    if (!candidates.length) return null;

    // 一番小さいカードを選ぶ
    return candidates.sort((a,b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return (ar.width * ar.height) - (br.width * br.height);
    })[0];
  }

  function ensureGroup(panel){
    let group = document.getElementById("pnx-step147-quick-actions");
    if (group) return group;

    group = document.createElement("section");
    group.id = "pnx-step147-quick-actions";
    group.className = "pnx-step147-quick-actions";
    group.setAttribute("aria-label", "クイック入力");

    const anchor =
      document.getElementById("pnx-step141-analysis-enhance") ||
      document.getElementById("pnx-tour-summary-overview") ||
      document.querySelector(".tx-section") ||
      panel.firstElementChild;

    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(group, anchor);
    } else {
      panel.appendChild(group);
    }

    return group;
  }

  function moveQuickActions(){
    const panel = findOverviewPanel();
    if (!panel) return false;

    const receipt = findReceiptCard();
    const link = findTournamentLinkCard();
    if (!receipt && !link) return false;

    const group = ensureGroup(panel);

    if (receipt && receipt.parentNode !== group) {
      group.appendChild(receipt);
    }
    if (link && link.parentNode !== group) {
      group.appendChild(link);
      if (!link.matches("#pnx-step146-receipt-card, .pnx-receipt-card, #pnx-step147-quick-actions")) {
        link.classList.add("pnx-step147-link-card");
        link.setAttribute("data-pnx-finance-link-cta", "1");
      }
    }

    group.classList.toggle("has-receipt", !!receipt);
    group.classList.toggle("has-link", !!link);

    window.__PNX_STEP147_LAST_REORDER__ = {
      at:new Date().toISOString(),
      receiptMoved:!!receipt,
      linkMoved:!!link,
      groupChildren:group.children.length
    };

    return true;
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(moveQuickActions, 120);
    setTimeout(moveQuickActions, 700);
    setTimeout(moveQuickActions, 1600);
  });

  window.addEventListener("message", function(){
    setTimeout(moveQuickActions, 100);
  });

  document.addEventListener("click", function(e){
    if (e.target && e.target.closest && e.target.closest('.fin-tab[data-tab="overview"], .fin-tab')) {
      setTimeout(moveQuickActions, 120);
    }
  }, true);

  window.PNXStep147ReorderOverviewQuickActions = moveQuickActions;
  window.PNXStep147OverviewQuickActionsStatus = function(){
    const group = document.getElementById("pnx-step147-quick-actions");
    const receipt = findReceiptCard();
    const link = findTournamentLinkCard();
    return {
      step:147,
      groupExists:!!group,
      groupChildren:group ? group.children.length : 0,
      receiptInGroup:!!(group && receipt && receipt.parentNode === group),
      linkInGroup:!!(group && link && link.parentNode === group),
      last:window.__PNX_STEP147_LAST_REORDER__ || null,
      note:"レシート撮影カードと大会紐づけカードを概要上部にまとめて配置"
    };
  };
})();




/* ================================================================
   STEP147b: Filing return / legacy stack safety fix
   原因:
   - 新STEP144の申告書類作成ページと、旧filing-stack型の申告書類フローが共存
   - 旧スタックが全画面で開いたまま残ると申告準備へ戻れなくなる
   修正:
   - 申告タブの表示順を「申告準備 → 申告書類作成」に整理
   - 旧「申告書類を作成する」CTAは新STEP144へスクロールするだけに変更
   - 旧スタックが開いても強制的に閉じられる安全弁を追加
   ================================================================ */
(function(){
  if (window.__PNX_STEP147B_FILING_RETURN_FIX__) return;
  window.__PNX_STEP147B_FILING_RETURN_FIX__ = true;

  function get(id){ return document.getElementById(id); }

  function closeLegacyFilingStack(reason){
    const stack = get("filing-stack");
    if (!stack) return false;

    stack.setAttribute("data-open", "0");
    stack.setAttribute("aria-hidden", "true");
    stack.classList.remove("is-open", "active");

    stack.querySelectorAll(".filing-screen").forEach(screen => {
      screen.classList.remove("active", "behind");
    });

    const modal = get("pro-modal");
    if (modal) modal.classList.remove("open");

    document.body.classList.remove("filing-flow-open");

    window.__PNX_STEP147B_LAST_CLOSE__ = {
      at:new Date().toISOString(),
      reason:reason || "manual"
    };

    return true;
  }

  function reorderFilingSections(){
    const filing = get("tab-filing");
    const title = filing && filing.querySelector(".filing-page-title");
    const prep = get("pnx-step142-taxprep");
    const docs = get("pnx-step144-taxdocs");

    if (!filing || !prep || !docs) return false;

    // 申告タブは必ず「タイトル → 申告準備 → 申告書類作成」の順番にする
    if (title && title.parentNode === filing) {
      title.insertAdjacentElement("afterend", prep);
      prep.insertAdjacentElement("afterend", docs);
    } else {
      filing.insertBefore(prep, filing.firstElementChild);
      prep.insertAdjacentElement("afterend", docs);
    }

    prep.classList.add("pnx-step147b-filing-primary");
    docs.classList.add("pnx-step147b-filing-docs");

    window.__PNX_STEP147B_LAST_REORDER__ = {
      at:new Date().toISOString(),
      prepBeforeDocs:!!(prep.compareDocumentPosition(docs) & Node.DOCUMENT_POSITION_FOLLOWING)
    };

    return true;
  }

  function scrollToDocs(){
    if (typeof window.PNXStep152bOpenTaxDocumentsFromCta === "function" && window.PNXStep152bOpenTaxDocumentsFromCta()) return;
    closeLegacyFilingStack("redirect-old-doc-cta");
    reorderFilingSections();
    const docs = get("pnx-step144-taxdocs");
    if (docs && docs.scrollIntoView) docs.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  function scrollToPrep(){
    closeLegacyFilingStack("back-to-prep");
    reorderFilingSections();

    const prep = get("pnx-step142-taxprep");
    if (prep && prep.scrollIntoView) {
      prep.scrollIntoView({ behavior:"smooth", block:"start" });
    }
  }

  function bind(){
    reorderFilingSections();

    // 旧CTAは旧スタックを開かせず、新しいSTEP144へ移動
    const oldCta = get("btn-open-doc-list");
    if (oldCta && !oldCta.__pnxStep147bBound) {
      oldCta.__pnxStep147bBound = true;
      oldCta.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        scrollToDocs();
      }, true);
      oldCta.textContent = "申告書類の作成へ";
      oldCta.setAttribute("data-pnx-step147b-redirect", "1");
    }

    // STEP144側の戻るは申告準備へ戻す
    const docBack = get("pnx-step144-back");
    if (docBack && !docBack.__pnxStep147bBound) {
      docBack.__pnxStep147bBound = true;
      docBack.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        scrollToPrep();
      }, true);
    }

    // 旧stack内の戻る/閉じるは最後の安全弁として必ず閉じられるようにする
    const stack = get("filing-stack");
    if (stack && !stack.__pnxStep147bBound) {
      stack.__pnxStep147bBound = true;

      stack.addEventListener("click", function(e){
        const back = e.target && e.target.closest && e.target.closest("[data-nav-back], [data-nav-close]");
        if (!back) return;

        // 元のpop処理が失敗しても閉じる
        setTimeout(function(){
          const stillOpen = stack.getAttribute("data-open") === "1";
          const active = stack.querySelector(".filing-screen.active");
          if (stillOpen && !active) closeLegacyFilingStack("legacy-back-fallback-no-active");
        }, 80);

        setTimeout(function(){
          const stillOpen = stack.getAttribute("data-open") === "1";
          // doc-listだけが残り続ける場合は閉じる
          const active = stack.querySelectorAll(".filing-screen.active");
          if (stillOpen && active.length <= 1) closeLegacyFilingStack("legacy-back-fallback");
        }, 260);
      }, true);
    }
  }

  // タブ移動時は旧スタックを必ず閉じる。これで「戻れない」を防ぐ。
  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest(".fin-tab");
    if (!tab) return;

    const target = tab.dataset && tab.dataset.tab;
    if (target !== "filing") {
      closeLegacyFilingStack("tab-change-" + (target || "unknown"));
    } else {
      setTimeout(function(){
        reorderFilingSections();
        closeLegacyFilingStack("enter-filing-clean");
      }, 80);
    }
  }, true);

  document.addEventListener("keydown", function(e){
    if (e.key === "Escape") {
      closeLegacyFilingStack("escape");
    }
  }, true);

  // 万一スタックが開いたまま固まった時の救済ボタンを自動追加
  function ensureEmergencyClose(){
    const stack = get("filing-stack");
    if (!stack || get("pnx-step147b-emergency-close")) return;

    const btn = document.createElement("button");
    btn.id = "pnx-step147b-emergency-close";
    btn.type = "button";
    btn.textContent = "申告準備に戻る";
    btn.addEventListener("click", function(e){
      e.preventDefault();
      closeLegacyFilingStack("emergency-button");
      setTimeout(scrollToPrep, 80);
    }, true);

    stack.appendChild(btn);
  }

  document.addEventListener("DOMContentLoaded", function(){
    bind();
    ensureEmergencyClose();
    setTimeout(bind, 500);
    setTimeout(bind, 1400);
    setTimeout(function(){
      reorderFilingSections();
      closeLegacyFilingStack("initial-clean");
    }, 1800);
  });

  window.PNXStep147bCloseLegacyFilingStack = closeLegacyFilingStack;
  window.PNXStep147bReorderFilingSections = reorderFilingSections;
  window.PNXStep147bScrollToTaxPrep = scrollToPrep;
  window.PNXStep147bScrollToTaxDocs = scrollToDocs;
  window.PNXStep147bFilingReturnFixStatus = function(){
    const stack = get("filing-stack");
    const prep = get("pnx-step142-taxprep");
    const docs = get("pnx-step144-taxdocs");
    return {
      step:"147b",
      legacyStackExists:!!stack,
      legacyStackOpen:!!(stack && stack.getAttribute("data-open") === "1"),
      activeLegacyScreens:stack ? stack.querySelectorAll(".filing-screen.active").length : 0,
      prepExists:!!prep,
      docsExists:!!docs,
      prepBeforeDocs:!!(prep && docs && (prep.compareDocumentPosition(docs) & Node.DOCUMENT_POSITION_FOLLOWING)),
      oldCtaRedirect:!!(get("btn-open-doc-list") && get("btn-open-doc-list").getAttribute("data-pnx-step147b-redirect")),
      lastClose:window.__PNX_STEP147B_LAST_CLOSE__ || null,
      lastReorder:window.__PNX_STEP147B_LAST_REORDER__ || null,
      note:"旧申告スタックを呼び出さず、新申告準備/書類作成へ安全に戻れるよう修正"
    };
  };
})();




/* ================================================================
   STEP147c: Filing inline documents / keep top menu visible
   目的:
   - 「確定申告書類作成へ」を押しても旧フルスクリーンへ行かない
   - 新しいSTEP144の申告書類作成セクションへ同一タブ内で移動
   - 上の 概要 / 取引 / 分析 / 申告 メニューを常に残す
   ================================================================ */
(function(){
  if (window.__PNX_STEP147C_FILING_INLINE_DOCS_FIX__) return;
  window.__PNX_STEP147C_FILING_INLINE_DOCS_FIX__ = true;

  function get(id){ return document.getElementById(id); }

  function hardCloseLegacy(reason){
    const stack = get("filing-stack");
    if (stack) {
      stack.setAttribute("data-open", "0");
      stack.setAttribute("aria-hidden", "true");
      stack.classList.remove("is-open", "active", "pro-unlocked");
      stack.style.pointerEvents = "none";
      stack.querySelectorAll(".filing-screen").forEach(screen => {
        screen.classList.remove("active", "behind");
        screen.setAttribute("aria-hidden", "true");
      });
    }

    const modal = get("pro-modal");
    if (modal) modal.classList.remove("open");

    document.body.classList.remove("filing-flow-open");

    window.__PNX_STEP147C_LAST_HARD_CLOSE__ = {
      at:new Date().toISOString(),
      reason:reason || "manual"
    };

    return true;
  }

  function ensureHeaderSticky(){
    const header = document.querySelector(".fin-header");
    if (header) {
      header.style.position = "sticky";
      header.style.top = "0";
      header.style.zIndex = "10050";
      header.setAttribute("data-pnx-step147c-sticky", "1");
    }

    const tabs = document.querySelector(".fin-tabs");
    if (tabs) {
      tabs.setAttribute("data-pnx-step147c-visible", "1");
    }
  }

  function reorderFilingSections(){
    const filing = get("tab-filing");
    const title = filing && filing.querySelector(".filing-page-title");
    const prep = get("pnx-step142-taxprep");
    const docs = get("pnx-step144-taxdocs");
    if (!filing || !prep || !docs) return false;

    if (title && title.parentNode === filing) {
      title.insertAdjacentElement("afterend", prep);
      prep.insertAdjacentElement("afterend", docs);
    } else {
      filing.insertBefore(prep, filing.firstElementChild);
      prep.insertAdjacentElement("afterend", docs);
    }

    prep.classList.add("pnx-step147c-prep-inline");
    docs.classList.add("pnx-step147c-docs-inline");

    return true;
  }

  function scrollToDocs(){
    if (typeof window.PNXStep152bOpenTaxDocumentsFromCta === "function" && window.PNXStep152bOpenTaxDocumentsFromCta()) return;
    hardCloseLegacy("scroll-to-docs");
    ensureHeaderSticky();
    reorderFilingSections();
    const docs = get("pnx-step144-taxdocs");
    const panel = get("tab-filing");
    if (docs && panel) {
      const top = docs.offsetTop - 12;
      panel.scrollTo({ top:Math.max(0, top), behavior:"smooth" });
    } else if (docs && docs.scrollIntoView) {
      docs.scrollIntoView({ behavior:"smooth", block:"start" });
    }
  }

  function scrollToPrep(){
    hardCloseLegacy("scroll-to-prep");
    ensureHeaderSticky();
    reorderFilingSections();

    const prep = get("pnx-step142-taxprep");
    const panel = get("tab-filing");
    if (prep && panel) {
      const top = prep.offsetTop - 12;
      panel.scrollTo({ top:Math.max(0, top), behavior:"smooth" });
    } else if (prep && prep.scrollIntoView) {
      prep.scrollIntoView({ behavior:"smooth", block:"start" });
    }
  }

  function isTaxDocCreateCta(el){
    if (!el) return false;
    const t = (el.textContent || "").replace(/\s+/g, "");
    if (!t) return false;

    return (
      /確定申告書類作成へ/.test(t) ||
      /申告書類作成へ/.test(t) ||
      /申告書類を作成/.test(t) ||
      /申告書類の作成へ/.test(t) ||
      /申告書類の作成/.test(t)
    );
  }

  function bindButtons(){
    ensureHeaderSticky();
    reorderFilingSections();
    hardCloseLegacy("bind-clean");

    const oldCta = get("btn-open-doc-list");
    if (oldCta) {
      oldCta.textContent = "確定申告書類作成へ";
      oldCta.setAttribute("data-pnx-step147c-inline-docs", "1");
    }

    const back = get("pnx-step144-back");
    if (back && !back.__pnxStep147cBound) {
      back.__pnxStep147cBound = true;
      back.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        scrollToPrep();
      }, true);
    }
  }

  // 全ての「申告書類作成」系クリックを横取りして、旧フルスクリーンを開かせない。
  document.addEventListener("click", function(e){
    const btn = e.target && e.target.closest && e.target.closest("button, a, [role='button']");
    if (!btn || !isTaxDocCreateCta(btn)) return;

    // STEP144内のPDF/CSV作成ボタンは止めない
    if (btn.closest && btn.closest("#pnx-step144-taxdocs") && btn.hasAttribute("data-pnx-doc")) return;

    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

    scrollToDocs();
  }, true);

  // 万一旧stackが開こうとしても即閉じる
  function watchLegacyStack(){
    const stack = get("filing-stack");
    if (!stack || stack.__pnxStep147cObserved) return;

    stack.__pnxStep147cObserved = true;
    const obs = new MutationObserver(function(){
      if (stack.getAttribute("data-open") === "1" || stack.querySelector(".filing-screen.active")) {
        setTimeout(function(){ hardCloseLegacy("mutation-watch"); }, 0);
      }
    });
    obs.observe(stack, { attributes:true, childList:true, subtree:true, attributeFilter:["data-open", "class"] });
  }

  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest(".fin-tab");
    if (!tab) return;
    setTimeout(function(){
      hardCloseLegacy("tab-click");
      ensureHeaderSticky();
      reorderFilingSections();
    }, 30);
  }, true);

  document.addEventListener("keydown", function(e){
    if (e.key === "Escape") {
      hardCloseLegacy("escape");
      ensureHeaderSticky();
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    bindButtons();
    watchLegacyStack();
    setTimeout(bindButtons, 300);
    setTimeout(bindButtons, 1000);
    setTimeout(function(){
      hardCloseLegacy("initial-final-clean");
      ensureHeaderSticky();
      reorderFilingSections();
    }, 1800);
  });

  window.PNXStep147cHardCloseLegacyFiling = hardCloseLegacy;
  window.PNXStep147cScrollToTaxDocsInline = scrollToDocs;
  window.PNXStep147cScrollToTaxPrepInline = scrollToPrep;
  window.PNXStep147cFilingInlineDocsStatus = function(){
    const stack = get("filing-stack");
    const header = document.querySelector(".fin-header");
    const oldCta = get("btn-open-doc-list");
    const prep = get("pnx-step142-taxprep");
    const docs = get("pnx-step144-taxdocs");
    return {
      step:"147c",
      legacyStackExists:!!stack,
      legacyStackOpen:!!(stack && stack.getAttribute("data-open") === "1"),
      activeLegacyScreens:stack ? stack.querySelectorAll(".filing-screen.active").length : 0,
      headerSticky:!!(header && header.getAttribute("data-pnx-step147c-sticky") === "1"),
      oldCtaInline:!!(oldCta && oldCta.getAttribute("data-pnx-step147c-inline-docs")),
      prepExists:!!prep,
      docsExists:!!docs,
      prepBeforeDocs:!!(prep && docs && (prep.compareDocumentPosition(docs) & Node.DOCUMENT_POSITION_FOLLOWING)),
      lastHardClose:window.__PNX_STEP147C_LAST_HARD_CLOSE__ || null,
      note:"確定申告書類作成へは同一申告タブ内移動。旧フルスクリーンは無効化。上メニューは常に表示。"
    };
  };
})();




/* ================================================================
   STEP147d: Receipt click isolation / tournament CTA scope fix
   原因:
   - STEP147で「レシート撮影」と「大会と取引を紐付ける」を同じグループにした
   - 親グループが大会紐づけCTAとして誤認識されると、
     レシートカードを押しても大会紐づけシートが開く
   修正:
   - レシートカード/レシートシートは大会CTA検出から完全除外
   - 誤って付与された data-pnx-finance-link-cta をレシート側から削除
   - レシートボタンは必ずレシートシートだけを開く
   ================================================================ */
(function(){
  if (window.__PNX_STEP147D_RECEIPT_CLICK_ISOLATION__) return;
  window.__PNX_STEP147D_RECEIPT_CLICK_ISOLATION__ = true;

  function get(id){ return document.getElementById(id); }

  function cleanReceiptAttrs(){
    const receipt = get("pnx-step146-receipt-card");
    const group = get("pnx-step147-quick-actions");

    [receipt, group].filter(Boolean).forEach(el => {
      // groupやreceiptに大会CTA属性が付いていると、receiptクリックで大会シートが開く
      if (el.id === "pnx-step146-receipt-card" || el.id === "pnx-step147-quick-actions") {
        el.removeAttribute("data-pnx-finance-link-cta");
        el.removeAttribute("data-finance-action");
        el.classList.remove("pnx-fin-link-trigger", "pnx-fin-link-cta-bound", "pnx-step147-link-card");
      }
    });

    // レシートカード内の子要素にも誤付与があれば削除
    if (receipt) {
      receipt.querySelectorAll("[data-pnx-finance-link-cta], [data-finance-action], .pnx-fin-link-trigger, .pnx-fin-link-cta-bound").forEach(el => {
        el.removeAttribute("data-pnx-finance-link-cta");
        el.removeAttribute("data-finance-action");
        el.classList.remove("pnx-fin-link-trigger", "pnx-fin-link-cta-bound", "pnx-step147-link-card");
      });
    }

    window.__PNX_STEP147D_LAST_CLEAN__ = new Date().toISOString();
  }

  function openReceipt(){
    cleanReceiptAttrs();

    if (typeof window.PNXStep146OpenReceiptScan === "function") {
      window.PNXStep146OpenReceiptScan();
      return true;
    }

    const sheet = get("pnx-step146-receipt-sheet");
    if (sheet) {
      sheet.classList.add("is-open");
      sheet.setAttribute("aria-hidden", "false");
      document.body.classList.add("pnx-receipt-open");
      return true;
    }

    return false;
  }

  function closeTournamentIfReceiptClicked(){
    const linkSheet = get("pnx-fin-link-sheet");
    if (linkSheet && linkSheet.classList.contains("is-open")) {
      linkSheet.classList.remove("is-open");
      document.documentElement.classList.remove("pnx-fin-link-open");
      document.body.classList.remove("pnx-fin-link-open");
      window.__PNX_STEP147D_CLOSED_WRONG_LINK_SHEET__ = (window.__PNX_STEP147D_CLOSED_WRONG_LINK_SHEET__ || 0) + 1;
    }
  }

  // 既存の古い大会CTA処理より後からでも、receiptクリック直後に誤シートを閉じる安全弁
  document.addEventListener("click", function(e){
    const receipt = e.target && e.target.closest && e.target.closest("#pnx-step146-receipt-card, #pnx-step146-open-receipt");
    if (!receipt) return;

    // receiptカードは大会CTAではない。クリック後に必ずreceiptを開き、誤って開いた大会シートは閉じる。
    setTimeout(function(){
      closeTournamentIfReceiptClicked();
      openReceipt();
    }, 0);
    setTimeout(closeTournamentIfReceiptClicked, 80);
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    cleanReceiptAttrs();
    setTimeout(cleanReceiptAttrs, 300);
    setTimeout(cleanReceiptAttrs, 1000);
    setTimeout(cleanReceiptAttrs, 2000);
  });

  window.addEventListener("message", function(){
    setTimeout(cleanReceiptAttrs, 80);
  });

  window.PNXStep147dCleanReceiptClickIsolation = cleanReceiptAttrs;
  window.PNXStep147dOpenReceiptOnly = openReceipt;
  window.PNXStep147dReceiptClickIsolationStatus = function(){
    const receipt = get("pnx-step146-receipt-card");
    const group = get("pnx-step147-quick-actions");
    const receiptSheet = get("pnx-step146-receipt-sheet");
    const linkSheet = get("pnx-fin-link-sheet");
    return {
      step:"147d",
      receiptExists:!!receipt,
      receiptHasTournamentCtaAttr:!!(receipt && (receipt.hasAttribute("data-pnx-finance-link-cta") || receipt.classList.contains("pnx-fin-link-trigger") || receipt.classList.contains("pnx-fin-link-cta-bound"))),
      groupHasTournamentCtaAttr:!!(group && (group.hasAttribute("data-pnx-finance-link-cta") || group.classList.contains("pnx-fin-link-trigger") || group.classList.contains("pnx-fin-link-cta-bound"))),
      receiptSheetOpen:!!(receiptSheet && receiptSheet.classList.contains("is-open")),
      tournamentSheetOpen:!!(linkSheet && linkSheet.classList.contains("is-open")),
      closedWrongLinkSheetCount:window.__PNX_STEP147D_CLOSED_WRONG_LINK_SHEET__ || 0,
      lastClean:window.__PNX_STEP147D_LAST_CLEAN__ || null,
      note:"レシートクリックはレシートシートだけ、大会紐づけクリックは大会シートだけ開くよう分離"
    };
  };
})();




/* ================================================================
   STEP147e: Analysis charts top + filing CTA visible move
   修正:
   1. 分析タブの棒グラフ・円グラフを上部へ移動
   2. 「確定申告書類作成へ」を押した時に、ボタン直下へ申告書類作成を移動して確実に表示
   ================================================================ */
(function(){
  if (window.__PNX_STEP147E_ANALYSIS_CHARTS_FILING_CTA__) return;
  window.__PNX_STEP147E_ANALYSIS_CHARTS_FILING_CTA__ = true;

  function text(el){ return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }
  function get(id){ return document.getElementById(id); }

  function findAnalysisPanel(){
    return get("tab-analysis") || document.querySelector('[data-tab-panel="analysis"], .fin-panel[data-panel="analysis"]');
  }

  function findChartCardByTitle(title){
    const panel = findAnalysisPanel();
    if (!panel) return null;
    return Array.from(panel.querySelectorAll(".chart-card")).find(card => text(card).includes(title)) || null;
  }

  function reorderAnalysisCharts(){
    const panel = findAnalysisPanel();
    if (!panel) return false;

    const annual = panel.querySelector(".annual-row");
    const period = panel.querySelector(".period-bar");
    const bar = findChartCardByTitle("月別収支");
    const donut = findChartCardByTitle("支出の内訳");

    if (!bar && !donut) return false;

    let group = get("pnx-step147e-analysis-chart-top");
    if (!group) {
      group = document.createElement("section");
      group.id = "pnx-step147e-analysis-chart-top";
      group.className = "pnx-step147e-analysis-chart-top";
      group.setAttribute("aria-label", "分析グラフ");
    }

    // 年間サマリーの直下にグラフグループを置く。年間サマリーがなければ期間バーの下。
    const anchor = annual || period;
    if (anchor && anchor.parentNode) {
      anchor.insertAdjacentElement("afterend", group);
    } else {
      panel.insertBefore(group, panel.firstElementChild);
    }

    if (bar && bar.parentNode !== group) group.appendChild(bar);
    if (donut && donut.parentNode !== group) group.appendChild(donut);

    group.classList.toggle("has-bar", !!bar);
    group.classList.toggle("has-donut", !!donut);

    window.__PNX_STEP147E_LAST_CHART_REORDER__ = {
      at:new Date().toISOString(),
      barMoved:!!bar,
      donutMoved:!!donut,
      groupChildren:group.children.length
    };

    return true;
  }

  function hardCloseLegacyFiling(reason){
    const stack = get("filing-stack");
    if (stack) {
      stack.setAttribute("data-open", "0");
      stack.setAttribute("aria-hidden", "true");
      stack.classList.remove("is-open", "active", "pro-unlocked");
      stack.style.display = "none";
      stack.style.pointerEvents = "none";
      stack.querySelectorAll(".filing-screen").forEach(screen => {
        screen.classList.remove("active", "behind");
        screen.setAttribute("aria-hidden", "true");
      });
    }
    document.body.classList.remove("filing-flow-open");
    window.__PNX_STEP147E_LAST_LEGACY_CLOSE__ = { at:new Date().toISOString(), reason:reason || "manual" };
  }

  function ensureHeaderSticky(){
    const header = document.querySelector(".fin-header");
    if (header) {
      header.style.position = "sticky";
      header.style.top = "0";
      header.style.zIndex = "10050";
      header.setAttribute("data-pnx-step147e-sticky", "1");
    }
  }

  function findFilingPanel(){
    return get("tab-filing") || document.querySelector('[data-tab-panel="filing"], .fin-panel[data-panel="filing"]');
  }

  function findFilingCta(){
    const byId = get("btn-open-doc-list");
    if (byId) return byId;

    const panel = findFilingPanel() || document;
    return Array.from(panel.querySelectorAll("button, a, [role='button']")).find(btn => {
      const t = text(btn).replace(/\s+/g, "");
      return /確定申告書類作成へ|申告書類作成へ|申告書類を作成|申告書類の作成へ/.test(t);
    }) || null;
  }

  function positionTaxDocsAfterCta(){
    const panel = findFilingPanel();
    const docs = get("pnx-step144-taxdocs");
    const cta = findFilingCta();
    const prep = get("pnx-step142-taxprep");

    if (!panel || !docs) return false;

    // 申告準備は先頭側に維持
    if (prep && prep.parentNode === panel) {
      prep.classList.add("pnx-step147e-taxprep");
    }

    // CTAがあるなら、申告書類作成セクションをボタン直下に置く
    if (cta && cta.parentNode) {
      cta.insertAdjacentElement("afterend", docs);
      cta.textContent = "確定申告書類作成へ";
      cta.setAttribute("data-pnx-step147e-doc-cta", "1");
    } else if (prep && prep.parentNode) {
      prep.insertAdjacentElement("afterend", docs);
    }

    docs.classList.add("pnx-step147e-taxdocs-target");

    window.__PNX_STEP147E_LAST_DOC_POSITION__ = {
      at:new Date().toISOString(),
      ctaFound:!!cta,
      docsAfterCta:!!(cta && cta.nextElementSibling === docs)
    };

    return true;
  }

  function getScrollableParent(el){
    let cur = el && el.parentElement;
    while (cur && cur !== document.body && cur !== document.documentElement) {
      const style = getComputedStyle(cur);
      const y = style.overflowY;
      if ((y === "auto" || y === "scroll") && cur.scrollHeight > cur.clientHeight + 10) return cur;
      cur = cur.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  }

  function scrollToTaxDocs(){
    if (typeof window.PNXStep152bOpenTaxDocumentsFromCta === "function" && window.PNXStep152bOpenTaxDocumentsFromCta()) return true;
    hardCloseLegacyFiling("tax-doc-cta");
    ensureHeaderSticky();
    positionTaxDocsAfterCta();

    const docs = get("pnx-step144-taxdocs");
    if (!docs) return false;

    docs.classList.remove("pnx-step147e-doc-focus");
    void docs.offsetWidth;
    docs.classList.add("pnx-step147e-doc-focus");

    const scroller = getScrollableParent(docs);
    try {
      if (scroller && scroller !== document.documentElement && scroller !== document.body) {
        const top = docs.offsetTop - 12;
        scroller.scrollTo({ top:Math.max(0, top), behavior:"smooth" });
      } else {
        docs.scrollIntoView({ behavior:"smooth", block:"start" });
      }
    } catch(e) {
      docs.scrollIntoView && docs.scrollIntoView({ behavior:"smooth", block:"start" });
    }

    window.__PNX_STEP147E_LAST_DOC_SCROLL__ = new Date().toISOString();
    return true;
  }

  function interceptTaxDocCta(e){
    const btn = e.target && e.target.closest && e.target.closest("button, a, [role='button']");
    if (!btn) return;

    // STEP144内のPDF/CSV行は通常動作のまま
    if (btn.closest && btn.closest("#pnx-step144-taxdocs") && btn.hasAttribute("data-pnx-doc")) return;

    const t = text(btn).replace(/\s+/g, "");
    if (!/確定申告書類作成へ|申告書類作成へ|申告書類を作成|申告書類の作成へ/.test(t)) return;

    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

    scrollToTaxDocs();
  }

  document.addEventListener("click", interceptTaxDocCta, true);

  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest(".fin-tab");
    if (!tab) return;

    const target = tab.dataset && tab.dataset.tab;
    setTimeout(function(){
      if (target === "analysis") reorderAnalysisCharts();
      if (target === "filing") {
        hardCloseLegacyFiling("enter-filing");
        ensureHeaderSticky();
        positionTaxDocsAfterCta();
      }
    }, 80);
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    hardCloseLegacyFiling("dom-ready");
    ensureHeaderSticky();
    setTimeout(reorderAnalysisCharts, 160);
    setTimeout(positionTaxDocsAfterCta, 200);
    setTimeout(reorderAnalysisCharts, 800);
    setTimeout(positionTaxDocsAfterCta, 900);
    setTimeout(reorderAnalysisCharts, 1800);
    setTimeout(positionTaxDocsAfterCta, 1900);
  });

  window.PNXStep147eReorderAnalysisCharts = reorderAnalysisCharts;
  window.PNXStep147ePositionTaxDocsAfterCta = positionTaxDocsAfterCta;
  window.PNXStep147eScrollToTaxDocs = scrollToTaxDocs;
  window.PNXStep147eAnalysisChartsAndFilingCtaStatus = function(){
    const bar = findChartCardByTitle("月別収支");
    const donut = findChartCardByTitle("支出の内訳");
    const chartGroup = get("pnx-step147e-analysis-chart-top");
    const cta = findFilingCta();
    const docs = get("pnx-step144-taxdocs");
    const stack = get("filing-stack");

    return {
      step:"147e",
      chartGroupExists:!!chartGroup,
      chartGroupChildren:chartGroup ? chartGroup.children.length : 0,
      barInTopGroup:!!(bar && chartGroup && bar.parentNode === chartGroup),
      donutInTopGroup:!!(donut && chartGroup && donut.parentNode === chartGroup),
      filingCtaFound:!!cta,
      docsExists:!!docs,
      docsAfterCta:!!(cta && docs && cta.nextElementSibling === docs),
      legacyStackOpen:!!(stack && stack.getAttribute("data-open") === "1"),
      lastDocScroll:window.__PNX_STEP147E_LAST_DOC_SCROLL__ || null,
      lastChartReorder:window.__PNX_STEP147E_LAST_CHART_REORDER__ || null,
      note:"分析グラフを上部へ移動し、確定申告書類作成へボタンをボタン直下の書類作成セクションへ確実に移動"
    };
  };
})();




/* ================================================================
   STEP148: Filing home reference UI
   目的:
   - 申告タブを開いた最初に、参考画像の「申告・出力」トップを表示
   - 準備率 / 利益 / 経費 / やること一覧を収支データから反映
   ================================================================ */
(function(){
  if (window.__PNX_STEP148_FILING_HOME_REF_UI__) return;
  window.__PNX_STEP148_FILING_HOME_REF_UI__ = true;

  function get(id){ return document.getElementById(id); }
  function yen(n){ return "¥" + Number(n || 0).toLocaleString("ja-JP"); }
  function todayJa(){
    const d = new Date();
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`;
  }

  function readTxs(){
    try {
      if (typeof window.PNXStep138gGetAllFinanceTransactions === "function") {
        return window.PNXStep138gGetAllFinanceTransactions() || [];
      }
    } catch(e) {}
    try {
      const list = JSON.parse(localStorage.getItem("PNX_FINANCE_TRANSACTIONS") || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function currentYear(){
    const y = get("pnx-step142-year");
    return Number(y && y.value) || new Date().getFullYear();
  }

  function collect(){
    const year = currentYear();
    const txs = readTxs().filter(tx => {
      const date = String(tx.date || tx.createdAt || "");
      const y = Number(date.slice(0,4)) || year;
      return y === year;
    });

    let income = 0;
    let expense = 0;
    let noReceiptExpense = 0;
    let uncategorized = 0;
    let tournamentRelated = 0;

    txs.forEach(tx => {
      const amount = Number(tx.amount || 0);
      if (!amount) return;

      if (tx.type === "income") income += amount;
      else {
        expense += amount;
        if (!tx.receipt && /交通|宿泊|エントリー|練習|ラウンド|キャディ|食費|その他/.test(String(tx.category || ""))) {
          noReceiptExpense += 1;
        }
      }

      if (!tx.category || /その他|other/i.test(String(tx.category))) uncategorized += 1;
      if (tx.tournamentTitle || tx.tournament || tx.tournamentName) tournamentRelated += 1;
    });

    const profit = income - expense;

    const checks = [
      txs.length > 0,
      income > 0 || tournamentRelated > 0,
      uncategorized === 0,
      noReceiptExpense <= 0,
      false,
      false,
      false
    ];
    const progress = Math.max(0, Math.min(100, Math.round(checks.filter(Boolean).length / checks.length * 100)));

    return { year, txs, income, expense, profit, progress, noReceiptExpense, uncategorized, tournamentRelated };
  }

  function setTask(task, state, label){
    const row = document.querySelector(`[data-step148-task="${task}"]`);
    if (!row) return;
    const circle = row.querySelector(".circle");
    const em = row.querySelector("em");

    if (circle) {
      circle.classList.remove("done", "empty", "warn");
      circle.textContent = state === "done" ? "✓" : "";
      circle.classList.add(state === "done" ? "done" : "empty");
    }
    if (em) {
      em.classList.remove("done", "warn");
      em.textContent = label;
      if (state === "done") em.classList.add("done");
      if (state === "warn") em.classList.add("warn");
    }
  }

  function render(){
    const data = collect();

    const progress = get("pnx-step148-progress-num");
    if (progress) progress.textContent = data.progress;

    const ring = get("pnx-step148-ring-progress");
    if (ring) {
      const r = 48;
      const c = 2 * Math.PI * r;
      ring.style.strokeDasharray = c;
      ring.style.strokeDashoffset = c - (data.progress / 100) * c;
    }

    const profit = get("pnx-step148-profit");
    if (profit) profit.textContent = yen(Math.abs(data.profit));

    const expense = get("pnx-step148-expense");
    if (expense) expense.textContent = yen(data.expense);

    const updated = get("pnx-step148-updated-date");
    if (updated) updated.textContent = "最終更新：" + todayJa();

    setTask("transactions", data.txs.length ? "done" : "warn", data.txs.length ? "完了" : "未完了");
    setTask("tournaments", data.tournamentRelated ? "done" : "warn", data.tournamentRelated ? "完了" : "確認");
    setTask("categories", data.uncategorized === 0 ? "done" : "warn", data.uncategorized === 0 ? "完了" : `${data.uncategorized}件`);
    setTask("receipts", data.noReceiptExpense <= 0 ? "done" : "warn", data.noReceiptExpense <= 0 ? "完了" : "不足あり");

    window.__PNX_STEP148_LAST_FILING_HOME__ = {
      at:new Date().toISOString(),
      year:data.year,
      progress:data.progress,
      income:data.income,
      expense:data.expense,
      profit:data.profit,
      txCount:data.txs.length
    };
  }

  function scrollToExistingPrep(){
    const target = get("pnx-step142-taxprep") || get("pnx-step144-taxdocs");
    if (target && target.scrollIntoView) {
      target.scrollIntoView({ behavior:"smooth", block:"start" });
    }
  }

  function bind(){
    const btn = get("pnx-step148-start-flow");
    if (btn && !btn.__pnxStep148Bound) {
      btn.__pnxStep148Bound = true;
      btn.addEventListener("click", function(e){
        e.preventDefault();
        scrollToExistingPrep();
      });
    }

    document.querySelectorAll("[data-step148-task]").forEach(row => {
      if (row.__pnxStep148Bound) return;
      row.__pnxStep148Bound = true;
      row.addEventListener("click", function(){
        const task = row.getAttribute("data-step148-task");
        if (task === "documents") {
          const docs = get("pnx-step144-taxdocs");
          if (docs && docs.scrollIntoView) docs.scrollIntoView({ behavior:"smooth", block:"start" });
          return;
        }
        scrollToExistingPrep();
      });
    });
  }

  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest('.fin-tab[data-tab="filing"], .fin-tab');
    if (!tab) return;
    setTimeout(function(){
      bind();
      render();
      const home = get("pnx-step148-filing-home");
      const panel = get("tab-filing");
      if (home && panel && tab.dataset && tab.dataset.tab === "filing") {
        panel.scrollTo({ top:0, behavior:"auto" });
      }
    }, 100);
  }, true);

  window.addEventListener("storage", function(e){
    if (e.key === "PNX_FINANCE_TRANSACTIONS") setTimeout(render, 100);
  });
  window.addEventListener("pnx:finance:transactions-updated", function(){ setTimeout(render, 100); });

  document.addEventListener("DOMContentLoaded", function(){
    bind();
    setTimeout(render, 500);
    setTimeout(render, 1400);
  });

  window.PNXStep148RenderFilingHomeRef = render;
  window.PNXStep148FilingHomeRefStatus = function(){
    const home = get("pnx-step148-filing-home");
    const data = collect();
    return {
      step:148,
      homeExists:!!home,
      visible:!!(home && home.offsetParent !== null),
      progress:data.progress,
      income:data.income,
      expense:data.expense,
      profit:data.profit,
      txCount:data.txs.length,
      last:window.__PNX_STEP148_LAST_FILING_HOME__ || null,
      note:"申告タブの最初に参考画像型の申告・出力トップを表示"
    };
  };
})();




/* ================================================================
   STEP148b: Filing home polish
   目的:
   - 右上の不要な装飾アイコンを削除
   - 申告トップのタイポグラフィを収支アプリ全体のApple風フォントへ統一
   ================================================================ */
(function(){
  if (window.__PNX_STEP148B_FILING_HOME_POLISH__) return;
  window.__PNX_STEP148B_FILING_HOME_POLISH__ = true;

  function polish(){
    document.querySelectorAll(".pnx-filing-ref-icon-btn").forEach(btn => btn.remove());

    const home = document.getElementById("pnx-step148-filing-home");
    if (home) {
      home.classList.add("pnx-step148b-polished");
      home.setAttribute("data-pnx-step148b", "polished");
    }

    window.__PNX_STEP148B_LAST_POLISH__ = new Date().toISOString();
  }

  document.addEventListener("DOMContentLoaded", function(){
    polish();
    setTimeout(polish, 500);
    setTimeout(polish, 1400);
  });

  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest('.fin-tab[data-tab="filing"], .fin-tab');
    if (!tab) return;
    setTimeout(polish, 120);
  }, true);

  window.PNXStep148bPolishFilingHome = polish;
  window.PNXStep148bFilingHomePolishStatus = function(){
    const home = document.getElementById("pnx-step148-filing-home");
    return {
      step:"148b",
      homeExists:!!home,
      polished:!!(home && home.classList.contains("pnx-step148b-polished")),
      iconButtonCount:document.querySelectorAll(".pnx-filing-ref-icon-btn").length,
      last:window.__PNX_STEP148B_LAST_POLISH__ || null,
      note:"不要な右上アイコンを削除し、申告トップの文字をApple風に統一"
    };
  };
})();




/* ================================================================
   STEP148c: Filing home closer photo match
   目的:
   - 申告トップを参考写真の構成にさらに寄せる
   - スマホでも準備率リング左 / 金額右の横並びを維持
   - 古い申告準備タイトルの見え方を抑える
   ================================================================ */
(function(){
  if (window.__PNX_STEP148C_FILING_HOME_PHOTO_MATCH__) return;
  window.__PNX_STEP148C_FILING_HOME_PHOTO_MATCH__ = true;

  function apply(){
    const home = document.getElementById("pnx-step148-filing-home");
    if (home) home.classList.add("pnx-step148c-photo-match");

    // 申告トップ直後に古い「申告準備」見出しが見えて写真と違うため、視覚的には抑える
    const filingTitle = document.querySelector("#tab-filing .filing-page-title");
    if (filingTitle) filingTitle.classList.add("pnx-step148c-muted-old-title");

    document.querySelectorAll(".pnx-filing-ref-icon-btn").forEach(btn => btn.remove());

    window.__PNX_STEP148C_LAST_APPLY__ = new Date().toISOString();
  }

  document.addEventListener("DOMContentLoaded", function(){
    apply();
    setTimeout(apply, 500);
    setTimeout(apply, 1400);
  });

  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest('.fin-tab[data-tab="filing"], .fin-tab');
    if (!tab) return;
    setTimeout(apply, 120);
  }, true);

  window.PNXStep148cApplyFilingHomePhotoMatch = apply;
  window.PNXStep148cFilingHomePhotoMatchStatus = function(){
    const home = document.getElementById("pnx-step148-filing-home");
    const ring = document.querySelector(".pnx-filing-ref-ring");
    const money = document.querySelector(".pnx-filing-ref-money");
    const statusMain = document.querySelector(".pnx-filing-ref-status-main");
    return {
      step:"148c",
      homeExists:!!home,
      photoMatchClass:!!(home && home.classList.contains("pnx-step148c-photo-match")),
      iconButtonCount:document.querySelectorAll(".pnx-filing-ref-icon-btn").length,
      statusMainDisplay:statusMain ? getComputedStyle(statusMain).gridTemplateColumns : null,
      ringWidth:ring ? getComputedStyle(ring).width : null,
      moneyDisplay:money ? getComputedStyle(money).display : null,
      oldTitleMuted:!!document.querySelector(".filing-page-title.pnx-step148c-muted-old-title"),
      last:window.__PNX_STEP148C_LAST_APPLY__ || null,
      note:"参考写真に合わせ、準備状況カードをスマホでもリング左/金額右へ修正"
    };
  };
})();




/* ================================================================
   STEP148d: Filing prep card top swap
   目的:
   - 下部に既にある小さい「今年の申告準備率」カードを申告タブ最上部へ移動
   - STEP148で作った大きいカードは使わず非表示
   - 同じカードを二重表示しない
   ================================================================ */
(function(){
  if (window.__PNX_STEP148D_FILING_PREP_CARD_TOP_SWAP__) return;
  window.__PNX_STEP148D_FILING_PREP_CARD_TOP_SWAP__ = true;

  function get(id){ return document.getElementById(id); }

  function text(el){
    return String(el && el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function findFilingPanel(){
    return get("tab-filing") || document.querySelector('[data-tab-panel="filing"], .fin-panel[data-panel="filing"]');
  }

  function findExistingSmallPrepCard(){
    const panel = findFilingPanel() || document;

    // まず既存クラスから探す
    const byClass = panel.querySelector(".filing-prep-card");
    if (byClass) return byClass;

    // 次にテキストから探す
    const candidates = Array.from(panel.querySelectorAll("section, article, div"))
      .filter(el => /今年の申告準備率/.test(text(el)))
      .filter(el => !el.closest("#pnx-step148-filing-home"))
      .filter(el => {
        const r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
        if (!r) return true;
        return r.height > 80 && r.height < 260;
      });

    return candidates[0] || null;
  }

  function findTodoSection(){
    const homeTodo = document.querySelector("#pnx-step148-filing-home .pnx-filing-ref-todo-section");
    if (homeTodo) return homeTodo;

    const panel = findFilingPanel() || document;
    const candidates = Array.from(panel.querySelectorAll("section, article, div"))
      .filter(el => /やること/.test(text(el)) || /やること一覧/.test(text(el)));
    return candidates[0] || null;
  }

  function ensureTopContainer(){
    const panel = findFilingPanel();
    if (!panel) return null;

    let wrap = get("pnx-step148d-filing-top");
    if (wrap) return wrap;

    wrap = document.createElement("section");
    wrap.id = "pnx-step148d-filing-top";
    wrap.className = "pnx-step148d-filing-top";

    // 申告タブの先頭に置く
    const first = panel.firstElementChild;
    if (first) panel.insertBefore(wrap, first);
    else panel.appendChild(wrap);

    return wrap;
  }

  function hideLargeNewCard(){
    const home = get("pnx-step148-filing-home");
    if (!home) return;

    // 大きい準備カードとタイトルは使わない。ただしSTEP148のやること一覧は再利用する。
    home.classList.add("pnx-step148d-home-reduced");

    const largeStatus = home.querySelector(".pnx-filing-ref-status-card");
    if (largeStatus) largeStatus.classList.add("pnx-step148d-hide-large-status");

    const title = home.querySelector(".pnx-filing-ref-title-row");
    if (title) title.classList.add("pnx-step148d-hide-title");

    const help = home.querySelector(".pnx-filing-ref-help");
    if (help) help.classList.add("pnx-step148d-hide-help");
  }

  function moveSmallPrepCardTop(){
    const panel = findFilingPanel();
    const wrap = ensureTopContainer();
    if (!panel || !wrap) return false;

    hideLargeNewCard();

    let small = findExistingSmallPrepCard();

    // 既存カードが見つからない場合は、壊さず同等の小さいカードを作る
    if (!small) {
      small = document.createElement("article");
      small.className = "filing-prep-card pnx-step148d-created-prep-card";
      small.innerHTML = `
        <div class="pnx-step148d-created-head">
          <div>
            <h3>今年の申告準備率</h3>
            <p>確認が必要な項目が4件あります</p>
          </div>
        </div>
        <div class="pnx-step148d-created-body">
          <div class="prep-ring">
            <svg viewBox="0 0 112 112">
              <circle class="ring-bg" cx="56" cy="56" r="44"></circle>
              <circle id="ring-fill" class="ring-fill" cx="56" cy="56" r="44"></circle>
            </svg>
            <div id="ring-label" class="ring-label"><span class="ring-num">67</span><span>%</span></div>
          </div>
          <div class="pnx-step148d-created-checks">
            <div><span class="done">✓</span><b>収入の確認</b></div>
            <div><span class="done">✓</span><b>経費の確認</b></div>
            <div><span class="done">✓</span><b>不足レシートの追加</b></div>
            <div><span></span><b>PDF出力</b></div>
            <div><span></span><b>e-Tax提出</b></div>
          </div>
        </div>
      `;
    }

    small.classList.add("pnx-step148d-top-prep-card");

    if (small.parentNode !== wrap) {
      wrap.appendChild(small);
    }

    // やること一覧をその下へ置く
    const todo = findTodoSection();
    if (todo && todo.parentNode !== wrap && !todo.closest("#pnx-step148d-filing-top")) {
      todo.classList.add("pnx-step148d-top-todo");
      wrap.appendChild(todo);
    } else if (todo) {
      todo.classList.add("pnx-step148d-top-todo");
    }

    // CTAもやること一覧の下に置く
    const cta = get("pnx-step148-start-flow");
    if (cta && cta.parentNode !== wrap && !cta.closest("#pnx-step148d-filing-top")) {
      cta.classList.add("pnx-step148d-top-cta");
      wrap.appendChild(cta);
    } else if (cta) {
      cta.classList.add("pnx-step148d-top-cta");
    }

    window.__PNX_STEP148D_LAST_SWAP__ = {
      at:new Date().toISOString(),
      smallFound:!!small,
      wrapChildren:wrap.children.length
    };

    return true;
  }

  function updateSmallCardData(){
    try {
      if (typeof window.PNXStep142RenderTaxPrep === "function") window.PNXStep142RenderTaxPrep();
    } catch(e) {}
    try {
      if (typeof window.PNXStep148RenderFilingHomeRef === "function") window.PNXStep148RenderFilingHomeRef();
    } catch(e) {}
  }

  function run(){
    updateSmallCardData();
    moveSmallPrepCardTop();
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(run, 100);
    setTimeout(run, 600);
    setTimeout(run, 1500);
  });

  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest('.fin-tab[data-tab="filing"], .fin-tab');
    if (!tab) return;
    setTimeout(run, 120);
    setTimeout(run, 500);
  }, true);

  window.addEventListener("pnx:finance:transactions-updated", function(){ setTimeout(run, 100); });
  window.addEventListener("storage", function(e){
    if (e.key === "PNX_FINANCE_TRANSACTIONS") setTimeout(run, 100);
  });

  window.PNXStep148dSwapFilingPrepCardTop = run;
  window.PNXStep148dFilingPrepCardTopSwapStatus = function(){
    const wrap = get("pnx-step148d-filing-top");
    const small = document.querySelector(".pnx-step148d-top-prep-card");
    const large = document.querySelector("#pnx-step148-filing-home .pnx-filing-ref-status-card");
    const todo = document.querySelector(".pnx-step148d-top-todo");
    return {
      step:"148d",
      wrapExists:!!wrap,
      wrapChildren:wrap ? wrap.children.length : 0,
      smallPrepCardAtTop:!!(wrap && small && small.parentNode === wrap),
      largeStatusHidden:!!(large && large.classList.contains("pnx-step148d-hide-large-status")),
      todoUnderPrep:!!(wrap && todo && todo.parentNode === wrap),
      last:window.__PNX_STEP148D_LAST_SWAP__ || null,
      note:"下部の小さい今年の申告準備率カードを最上部へ移動し、大きいカードと入れ替え"
    };
  };
})();




/* ================================================================
   STEP149: Filing top CTA buttons
   目的:
   - 申告トップ下部の旧CTAを廃止
   - 「申告書類を作成する（PDF/CSV）」青ボタンへ変更
   - その下に「税理士へ共有する」白ボタンを追加
   ================================================================ */
(function(){
  if (window.__PNX_STEP149_FILING_CTA_BUTTONS__) return;
  window.__PNX_STEP149_FILING_CTA_BUTTONS__ = true;

  const MAIN_TEXT = "申告書類を作成する（PDF/CSV）";
  const SHARE_TEXT = "税理士へ共有する";

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  function findFilingPanel(){
    return get("tab-filing") || document.querySelector('[data-tab-panel="filing"], .fin-panel[data-panel="filing"]');
  }

  function findTopWrap(){
    return get("pnx-step148d-filing-top") || get("pnx-step148-filing-home") || findFilingPanel();
  }

  function findMainCta(){
    let btn = get("pnx-step148-start-flow");
    if (btn) return btn;
    const panel = findFilingPanel() || document;
    return Array.from(panel.querySelectorAll("button, a, [role='button']")).find(el => {
      const t = text(el);
      return t === MAIN_TEXT || t === "確定申告の手順に進む";
    }) || null;
  }

  function ensureStatus(stack){
    let status = get("pnx-step149-cta-status");
    if (status) return status;
    status = document.createElement("div");
    status.id = "pnx-step149-cta-status";
    status.className = "pnx-step149-cta-status";
    stack.appendChild(status);
    return status;
  }

  function setStatus(message, ok){
    const stack = get("pnx-step149-cta-stack");
    const status = stack ? ensureStatus(stack) : get("pnx-step149-cta-status");
    if (!status) return;
    status.textContent = message || "";
    status.classList.toggle("is-success", !!ok);
    status.classList.toggle("is-error", ok === false);
  }

  function scrollToTaxDocs(){
    try {
      if (typeof window.PNXStep152bOpenTaxDocumentsFromCta === "function" && window.PNXStep152bOpenTaxDocumentsFromCta()) {
        setStatus("申告書類作成ページを開きました", true);
        return true;
      }
    } catch(e) {}

    const docs = get("pnx-step144-taxdocs");
    if (docs && docs.scrollIntoView) {
      docs.classList.remove("pnx-step149-focus");
      void docs.offsetWidth;
      docs.classList.add("pnx-step149-focus");
      docs.scrollIntoView({ behavior:"smooth", block:"start" });
      setStatus("申告書類作成へ移動しました", true);
      return true;
    }

    setStatus("申告書類作成エリアを準備中です", false);
    return false;
  }

  async function copyTaxAdvisorSummary(){
    let memo = "";
    try {
      if (typeof window.PNXStep144TaxDocumentsSummaryText === "function") {
        memo = window.PNXStep144TaxDocumentsSummaryText();
      }
    } catch(e) {}

    if (!memo) {
      memo = [
        "ProNexaX 申告準備共有メモ",
        "",
        "収支データ・経費分類・大会別明細を確認してください。",
        "必要に応じてCSV/PDFを作成して共有します。"
      ].join("\n");
    }

    try {
      await navigator.clipboard.writeText(memo);
      setStatus("税理士共有メモをコピーしました", true);
    } catch(e) {
      try {
        const area = document.createElement("textarea");
        area.value = memo;
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
        setStatus("税理士共有メモをコピーしました", true);
      } catch(err) {
        setStatus("共有メモのコピーに失敗しました", false);
      }
    }
  }

  function ensureCtaStack(){
    try {
      if (typeof window.PNXStep148dSwapFilingPrepCardTop === "function") {
        window.PNXStep148dSwapFilingPrepCardTop();
      }
    } catch(e) {}

    const top = findTopWrap();
    if (!top) return false;

    let main = findMainCta();
    if (!main) {
      main = document.createElement("button");
      main.id = "pnx-step148-start-flow";
      main.type = "button";
      main.className = "pnx-filing-ref-primary";
    }

    main.textContent = MAIN_TEXT;
    main.classList.add("pnx-step149-main-cta");
    main.setAttribute("data-pnx-step149-main-cta", "1");
    if (!main.getAttribute("type")) main.setAttribute("type", "button");

    let stack = get("pnx-step149-cta-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.id = "pnx-step149-cta-stack";
      stack.className = "pnx-step149-cta-stack";
    }

    const todo = top.querySelector(".pnx-step148d-top-todo, .pnx-filing-ref-todo-section");
    if (todo && todo.parentNode === top) todo.insertAdjacentElement("afterend", stack);
    else top.appendChild(stack);

    if (main.parentNode !== stack) stack.appendChild(main);

    let share = get("pnx-step149-share-tax-advisor");
    if (!share) {
      share = document.createElement("button");
      share.id = "pnx-step149-share-tax-advisor";
      share.type = "button";
      share.textContent = SHARE_TEXT;
    }
    share.className = "pnx-step149-share-cta";
    share.setAttribute("data-pnx-step149-share-cta", "1");
    if (share.parentNode !== stack) main.insertAdjacentElement("afterend", share);

    ensureStatus(stack);

    document.querySelectorAll("button, a, [role='button']").forEach(el => {
      if (text(el) === "確定申告の手順に進む") {
        el.textContent = MAIN_TEXT;
        el.classList.add("pnx-step149-main-cta");
      }
    });

    window.__PNX_STEP149_LAST_LAYOUT__ = {
      at:new Date().toISOString(),
      mainExists:!!main,
      shareExists:!!share,
      stackChildren:stack.children.length
    };
    return true;
  }

  function bind(){
    ensureCtaStack();

    const main = get("pnx-step148-start-flow");
    if (main && !main.__pnxStep149Bound) {
      main.__pnxStep149Bound = true;
      main.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        scrollToTaxDocs();
      }, true);
    }

    const share = get("pnx-step149-share-tax-advisor");
    if (share && !share.__pnxStep149Bound) {
      share.__pnxStep149Bound = true;
      share.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        copyTaxAdvisorSummary();
      }, true);
    }
  }

  document.addEventListener("click", function(e){
    const btn = e.target && e.target.closest && e.target.closest("button, a, [role='button']");
    if (!btn) return;
    const t = text(btn);

    if (t === "確定申告の手順に進む" || t === MAIN_TEXT) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      scrollToTaxDocs();
    }

    if (t === SHARE_TEXT) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      copyTaxAdvisorSummary();
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    bind();
    setTimeout(bind, 400);
    setTimeout(bind, 1200);
    setTimeout(bind, 2200);
  });

  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest('.fin-tab[data-tab="filing"], .fin-tab');
    if (!tab) return;
    setTimeout(bind, 120);
    setTimeout(bind, 500);
  }, true);

  window.PNXStep149EnsureFilingCtaButtons = bind;
  window.PNXStep149FilingCtaButtonsStatus = function(){
    const stack = get("pnx-step149-cta-stack");
    const main = get("pnx-step148-start-flow");
    const share = get("pnx-step149-share-tax-advisor");
    const oldTextCount = Array.from(document.querySelectorAll("button, a, [role='button']")).filter(el => text(el) === "確定申告の手順に進む").length;
    return {
      step:149,
      stackExists:!!stack,
      mainExists:!!main,
      mainText:main ? text(main) : null,
      shareExists:!!share,
      shareText:share ? text(share) : null,
      oldTextCount,
      lastLayout:window.__PNX_STEP149_LAST_LAYOUT__ || null,
      note:"申告トップ下部CTAを「申告書類を作成する（PDF/CSV）」と「税理士へ共有する」に変更"
    };
  };
})();




/* ================================================================
   STEP150: Filing STEP1 income confirm screen
   目的:
   - 申告やること一覧の「収入の入力・確認」を押すと、
     写真のような「STEP1 収入を確認する」画面を開く
   ================================================================ */
(function(){
  if (window.__PNX_STEP150_FILING_INCOME_CONFIRM_SCREEN__) return;
  window.__PNX_STEP150_FILING_INCOME_CONFIRM_SCREEN__ = true;

  const COMPLETE_KEY = "PNX_FILING_STEP150_INCOME_CONFIRMED";

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }
  function yen(n){ return "¥" + Number(n || 0).toLocaleString("ja-JP"); }

  function readTxs(){
    try {
      if (typeof window.PNXStep138gGetAllFinanceTransactions === "function") {
        return window.PNXStep138gGetAllFinanceTransactions() || [];
      }
    } catch(e) {}
    try {
      const list = JSON.parse(localStorage.getItem("PNX_FINANCE_TRANSACTIONS") || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function currentYear(){
    const y = get("pnx-step142-year");
    return Number(y && y.value) || new Date().getFullYear();
  }

  function isIncome(tx){
    return tx && (tx.type === "income" || tx.kind === "income" || tx.income === true);
  }

  function txYear(tx){
    const raw = String((tx && (tx.date || tx.startDate || tx.createdAt)) || "");
    const y = Number(raw.slice(0,4));
    return y || currentYear();
  }

  function classifyIncome(tx){
    const src = [
      tx.category,
      tx.name,
      tx.memo,
      tx.meta,
      tx.typeLabel
    ].map(v => String(v || "")).join(" ");

    if (/賞金|prize/i.test(src)) return "prize";
    if (/スポンサー|sponsor/i.test(src)) return "sponsor";
    if (/レッスン|lesson/i.test(src)) return "lesson";
    if (/出演|講演|イベント|appearance/i.test(src)) return "appearance";
    return "other";
  }

  function collectIncome(){
    const year = currentYear();
    const result = {
      year,
      total:0,
      prize:0,
      sponsor:0,
      lesson:0,
      appearance:0,
      other:0,
      count:0
    };

    readTxs().forEach(tx => {
      if (!isIncome(tx)) return;
      if (txYear(tx) !== year) return;
      const amount = Number(tx.amount || tx.value || 0);
      if (!amount) return;
      const cat = classifyIncome(tx);
      result[cat] += amount;
      result.total += amount;
      result.count += 1;
    });

    return result;
  }

  function renderIncome(){
    const data = collectIncome();
    const map = {
      "pnx-step150-income-total": data.total,
      "pnx-step150-income-prize": data.prize,
      "pnx-step150-income-sponsor": data.sponsor,
      "pnx-step150-income-lesson": data.lesson,
      "pnx-step150-income-appearance": data.appearance,
      "pnx-step150-income-other": data.other
    };

    Object.keys(map).forEach(id => {
      const el = get(id);
      if (el) el.textContent = yen(map[id]);
    });

    const status = get("pnx-step150-income-status");
    if (status) {
      const done = localStorage.getItem(COMPLETE_KEY) === "1";
      status.textContent = done ? "収入確認は完了しています" : "";
      status.classList.toggle("is-success", done);
    }

    window.__PNX_STEP150_LAST_INCOME__ = {
      at:new Date().toISOString(),
      ...data
    };
  }

  function findFilingPanel(){
    return get("tab-filing") || document.querySelector('[data-tab-panel="filing"], .fin-panel[data-panel="filing"]');
  }

  function showIncomeScreen(){
    renderIncome();

    const panel = findFilingPanel();
    const screen = get("pnx-step150-income-screen");
    const top = get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");

    if (!screen) return false;

    // 同じ申告タブ内で切替。上メニューは残す。
    if (top) top.classList.add("pnx-step150-hidden");
    screen.classList.add("is-open");
    screen.setAttribute("aria-hidden", "false");

    if (panel) {
      if (screen.parentNode !== panel) panel.insertBefore(screen, panel.firstElementChild);
      try { panel.scrollTo({ top:0, behavior:"smooth" }); } catch(e) {}
    }

    window.__PNX_STEP150_LAST_OPEN__ = new Date().toISOString();
    return true;
  }

  function closeIncomeScreen(){
    const screen = get("pnx-step150-income-screen");
    const top = get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");

    if (screen) {
      screen.classList.remove("is-open");
      screen.setAttribute("aria-hidden", "true");
    }
    if (top) top.classList.remove("pnx-step150-hidden");

    window.__PNX_STEP150_LAST_CLOSE__ = new Date().toISOString();
  }

  function openIncomeInput(){
    // 既存の取引追加モーダルを使う。できる限り収入選択へ寄せる。
    const add = get("btn-add-tx") || document.querySelector("[data-add-transaction], .add-btn-fixed, .modal-add-btn");
    if (add) {
      add.click();
      setTimeout(function(){
        const incomeType = document.querySelector(".type-btn[data-type='income'], [data-type='income'], .type-income");
        if (incomeType && incomeType.click) incomeType.click();
      }, 160);
      return true;
    }

    const status = get("pnx-step150-income-status");
    if (status) {
      status.textContent = "収入入力フォームを準備中です";
      status.classList.add("is-error");
    }
    return false;
  }

  function markConfirmed(){
    localStorage.setItem(COMPLETE_KEY, "1");

    const status = get("pnx-step150-income-status");
    if (status) {
      status.textContent = "収入を確認しました";
      status.classList.remove("is-error");
      status.classList.add("is-success");
    }

    // やること一覧の該当行も完了表示へ更新
    document.querySelectorAll('[data-step148-task="transactions"]').forEach(row => {
      const circle = row.querySelector(".circle");
      const em = row.querySelector("em");
      if (circle) {
        circle.classList.remove("empty", "warn");
        circle.classList.add("done");
        circle.textContent = "✓";
      }
      if (em) {
        em.classList.remove("warn");
        em.classList.add("done");
        em.textContent = "完了";
      }
    });

    try { if (typeof window.PNXStep148RenderFilingHomeRef === "function") window.PNXStep148RenderFilingHomeRef(); } catch(e) {}

    setTimeout(closeIncomeScreen, 500);
  }

  function isIncomeTaskTrigger(el){
    if (!el) return false;
    if (el.matches && el.matches('[data-step148-task="transactions"]')) return true;
    const t = text(el);
    return /収支の入力・確認|収入の確認|収入を確認/.test(t);
  }

  function bind(){
    const back = get("pnx-step150-income-back");
    if (back && !back.__pnxStep150Bound) {
      back.__pnxStep150Bound = true;
      back.addEventListener("click", function(e){
        e.preventDefault();
        closeIncomeScreen();
      }, true);
    }

    const input = get("pnx-step150-open-income-input");
    if (input && !input.__pnxStep150Bound) {
      input.__pnxStep150Bound = true;
      input.addEventListener("click", function(e){
        e.preventDefault();
        openIncomeInput();
      }, true);
    }

    const confirm = get("pnx-step150-confirm-income");
    if (confirm && !confirm.__pnxStep150Bound) {
      confirm.__pnxStep150Bound = true;
      confirm.addEventListener("click", function(e){
        e.preventDefault();
        markConfirmed();
      }, true);
    }
  }

  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest('[data-step148-task="transactions"], button, a, [role="button"]');
    if (!trigger) return;
    if (!isIncomeTaskTrigger(trigger)) return;

    // 申告トップのやること一覧からだけ反応
    if (!trigger.closest("#pnx-step148d-filing-top, #pnx-step148-filing-home, #pnx-step148-todo-list")) return;

    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    showIncomeScreen();
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    bind();
    setTimeout(bind, 500);
    setTimeout(bind, 1300);
    setTimeout(renderIncome, 1400);
  });

  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest('.fin-tab[data-tab="filing"], .fin-tab');
    if (!tab) return;
    setTimeout(function(){ bind(); renderIncome(); }, 120);
  }, true);

  window.addEventListener("pnx:finance:transactions-updated", function(){ setTimeout(renderIncome, 100); });
  window.addEventListener("storage", function(e){
    if (e.key === "PNX_FINANCE_TRANSACTIONS") setTimeout(renderIncome, 100);
  });

  window.PNXStep150OpenIncomeConfirmScreen = showIncomeScreen;
  window.PNXStep150CloseIncomeConfirmScreen = closeIncomeScreen;
  window.PNXStep150RenderIncomeConfirmScreen = renderIncome;
  window.PNXStep150IncomeConfirmStatus = function(){
    const screen = get("pnx-step150-income-screen");
    const data = collectIncome();
    return {
      step:150,
      screenExists:!!screen,
      screenOpen:!!(screen && screen.classList.contains("is-open")),
      confirmed:localStorage.getItem(COMPLETE_KEY) === "1",
      income:data,
      lastOpen:window.__PNX_STEP150_LAST_OPEN__ || null,
      note:"申告やること一覧の収入確認を押すと、STEP1収入確認画面を表示"
    };
  };
})();




/* ================================================================
   STEP150b: Income screen only mode
   目的:
   - STEP1収入確認画面を開いた時、「確認しました」より下に
     申告トップや他パネルが続いて表示されないようにする
   - 詳細画面表示中は申告タブ内でSTEP1画面だけを表示
   ================================================================ */
(function(){
  if (window.__PNX_STEP150B_INCOME_SCREEN_ONLY__) return;
  window.__PNX_STEP150B_INCOME_SCREEN_ONLY__ = true;

  function get(id){ return document.getElementById(id); }

  function findFilingPanel(){
    return get("tab-filing") || document.querySelector('[data-tab-panel="filing"], .fin-panel[data-panel="filing"]');
  }

  function applyOnlyMode(){
    const panel = findFilingPanel();
    const screen = get("pnx-step150-income-screen");
    if (!panel || !screen) return false;

    if (screen.classList.contains("is-open")) {
      panel.classList.add("pnx-step150b-income-only");
      screen.classList.add("pnx-step150b-active-screen");
      window.__PNX_STEP150B_LAST_APPLY__ = new Date().toISOString();
      return true;
    }

    panel.classList.remove("pnx-step150b-income-only");
    screen.classList.remove("pnx-step150b-active-screen");
    return false;
  }

  function clearOnlyMode(){
    const panel = findFilingPanel();
    const screen = get("pnx-step150-income-screen");
    if (panel) panel.classList.remove("pnx-step150b-income-only");
    if (screen) screen.classList.remove("pnx-step150b-active-screen");
    window.__PNX_STEP150B_LAST_CLEAR__ = new Date().toISOString();
  }

  const originalOpen = window.PNXStep150OpenIncomeConfirmScreen;
  if (typeof originalOpen === "function" && !originalOpen.__pnxStep150bWrapped) {
    const wrappedOpen = function(){
      const result = originalOpen.apply(this, arguments);
      setTimeout(applyOnlyMode, 0);
      setTimeout(applyOnlyMode, 100);
      return result;
    };
    wrappedOpen.__pnxStep150bWrapped = true;
    window.PNXStep150OpenIncomeConfirmScreen = wrappedOpen;
  }

  const originalClose = window.PNXStep150CloseIncomeConfirmScreen;
  if (typeof originalClose === "function" && !originalClose.__pnxStep150bWrapped) {
    const wrappedClose = function(){
      const result = originalClose.apply(this, arguments);
      setTimeout(clearOnlyMode, 0);
      return result;
    };
    wrappedClose.__pnxStep150bWrapped = true;
    window.PNXStep150CloseIncomeConfirmScreen = wrappedClose;
  }

  document.addEventListener("click", function(e){
    const incomeTrigger = e.target && e.target.closest && e.target.closest('[data-step148-task="transactions"]');
    if (incomeTrigger) {
      setTimeout(applyOnlyMode, 20);
      setTimeout(applyOnlyMode, 160);
    }

    const back = e.target && e.target.closest && e.target.closest("#pnx-step150-income-back");
    if (back) setTimeout(clearOnlyMode, 80);

    const confirm = e.target && e.target.closest && e.target.closest("#pnx-step150-confirm-income");
    if (confirm) {
      // 確認後は元の処理で閉じるまで下が見えないように少し維持
      setTimeout(applyOnlyMode, 20);
      setTimeout(clearOnlyMode, 650);
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(applyOnlyMode, 500);
    setTimeout(applyOnlyMode, 1400);
  });

  window.PNXStep150bApplyIncomeOnlyMode = applyOnlyMode;
  window.PNXStep150bClearIncomeOnlyMode = clearOnlyMode;
  window.PNXStep150bIncomeScreenOnlyStatus = function(){
    const panel = findFilingPanel();
    const screen = get("pnx-step150-income-screen");
    return {
      step:"150b",
      panelExists:!!panel,
      screenExists:!!screen,
      screenOpen:!!(screen && screen.classList.contains("is-open")),
      onlyMode:!!(panel && panel.classList.contains("pnx-step150b-income-only")),
      statusHiddenByCss:true,
      lastApply:window.__PNX_STEP150B_LAST_APPLY__ || null,
      lastClear:window.__PNX_STEP150B_LAST_CLEAR__ || null,
      note:"収入確認画面を開いた時、確認しましたボタンより下の申告トップ/他パネルを非表示"
    };
  };
})();





/* ================================================================
   STEP150c disabled by STEP150d
   理由:
   MutationObserver + 100ms監視で重くなり、ボタン反応が悪化したため。
   STEP150dの軽量表示切替に置き換え。
   ================================================================ */
(function(){
  window.__PNX_STEP150C_INCOME_SCREEN_STRICT_ONLY_DISABLED_BY_STEP150D__ = true;
  window.PNXStep150cIncomeScreenStrictOnlyStatus = function(){
    return { step:"150c", disabledBy:"step150d", note:"重い監視処理は無効化済み" };
  };
  window.PNXStep150cEnforceIncomeScreenOnly = function(){ return false; };
  window.PNXStep150cClearIncomeScreenOnly = function(){ return true; };
})();





/* ================================================================
   STEP150d: Income screen lightweight fix
   目的:
   - STEP150cの重い監視をやめる
   - 収入確認画面を開いた時だけ、軽いclass切替で申告トップを隠す
   - ボタン反応を戻す
   ================================================================ */
(function(){
  if (window.__PNX_STEP150D_INCOME_SCREEN_LIGHT_FIX__) return;
  window.__PNX_STEP150D_INCOME_SCREEN_LIGHT_FIX__ = true;

  function get(id){ return document.getElementById(id); }

  function findFilingPanel(){
    return get("tab-filing") || document.querySelector('[data-tab-panel="filing"], .fin-panel[data-panel="filing"]');
  }

  function applyIncomeOnly(){
    const panel = findFilingPanel();
    const screen = get("pnx-step150-income-screen");
    if (!panel || !screen) return false;

    if (screen.classList.contains("is-open")) {
      if (screen.parentNode !== panel) {
        panel.insertBefore(screen, panel.firstElementChild);
      }
      panel.classList.add("pnx-step150d-income-only");
      screen.classList.add("pnx-step150d-active");
      window.__PNX_STEP150D_LAST_APPLY__ = new Date().toISOString();
      return true;
    }

    clearIncomeOnly();
    return false;
  }

  function clearIncomeOnly(){
    const panel = findFilingPanel();
    const screen = get("pnx-step150-income-screen");

    if (panel) panel.classList.remove("pnx-step150d-income-only", "pnx-step150b-income-only", "pnx-step150c-income-only");
    if (screen) screen.classList.remove("pnx-step150d-active", "pnx-step150b-active-screen", "pnx-step150c-active-screen");

    // STEP150cが付けた可能性のある強制非表示を解除
    document.querySelectorAll(".pnx-step150c-force-hidden, [data-pnx-step150c-hidden='1']").forEach(el => {
      el.classList.remove("pnx-step150c-force-hidden");
      el.removeAttribute("data-pnx-step150c-hidden");
    });

    window.__PNX_STEP150D_LAST_CLEAR__ = new Date().toISOString();
    return true;
  }

  // STEP150の公開関数を軽量ラップ
  const open0 = window.PNXStep150OpenIncomeConfirmScreen;
  if (typeof open0 === "function" && !open0.__pnxStep150dWrapped) {
    const wrapped = function(){
      const result = open0.apply(this, arguments);
      setTimeout(applyIncomeOnly, 0);
      setTimeout(applyIncomeOnly, 80);
      return result;
    };
    wrapped.__pnxStep150dWrapped = true;
    window.PNXStep150OpenIncomeConfirmScreen = wrapped;
  }

  const close0 = window.PNXStep150CloseIncomeConfirmScreen;
  if (typeof close0 === "function" && !close0.__pnxStep150dWrapped) {
    const wrappedClose = function(){
      const result = close0.apply(this, arguments);
      setTimeout(clearIncomeOnly, 0);
      return result;
    };
    wrappedClose.__pnxStep150dWrapped = true;
    window.PNXStep150CloseIncomeConfirmScreen = wrappedClose;
  }

  document.addEventListener("click", function(e){
    const incomeTask = e.target && e.target.closest && e.target.closest('[data-step148-task="transactions"]');
    if (incomeTask) {
      setTimeout(applyIncomeOnly, 0);
      setTimeout(applyIncomeOnly, 120);
      return;
    }

    const back = e.target && e.target.closest && e.target.closest("#pnx-step150-income-back");
    if (back) {
      setTimeout(clearIncomeOnly, 80);
      return;
    }

    const confirm = e.target && e.target.closest && e.target.closest("#pnx-step150-confirm-income");
    if (confirm) {
      setTimeout(clearIncomeOnly, 650);
      return;
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    clearIncomeOnly();
  });

  window.PNXStep150dApplyIncomeOnly = applyIncomeOnly;
  window.PNXStep150dClearIncomeOnly = clearIncomeOnly;
  window.PNXStep150dIncomeScreenLightFixStatus = function(){
    const panel = findFilingPanel();
    const screen = get("pnx-step150-income-screen");
    return {
      step:"150d",
      screenExists:!!screen,
      screenOpen:!!(screen && screen.classList.contains("is-open")),
      lightOnlyMode:!!(panel && panel.classList.contains("pnx-step150d-income-only")),
      heavyStep150cDisabled:!!window.__PNX_STEP150C_INCOME_SCREEN_STRICT_ONLY_DISABLED_BY_STEP150D__,
      lastApply:window.__PNX_STEP150D_LAST_APPLY__ || null,
      lastClear:window.__PNX_STEP150D_LAST_CLEAR__ || null,
      note:"重い監視処理を無効化し、軽いclass切替だけでSTEP1画面単独表示"
    };
  };
})();




/* ================================================================
   STEP150e: Income screen overlay fix
   目的:
   - 収入確認画面を前面の詳細画面として表示
   - 「確認しました」の下に今年の申告準備率カード等が見えないようにする
   - 監視処理は使わず、開閉時のclass切替だけにする
   ================================================================ */
(function(){
  if (window.__PNX_STEP150E_INCOME_SCREEN_OVERLAY_FIX__) return;
  window.__PNX_STEP150E_INCOME_SCREEN_OVERLAY_FIX__ = true;

  function get(id){ return document.getElementById(id); }

  function findFilingPanel(){
    return get("tab-filing") || document.querySelector('[data-tab-panel="filing"], .fin-panel[data-panel="filing"]');
  }

  function applyOverlay(){
    const panel = findFilingPanel();
    const screen = get("pnx-step150-income-screen");
    if (!panel || !screen) return false;

    if (!screen.classList.contains("is-open")) {
      clearOverlay();
      return false;
    }

    panel.classList.add("pnx-step150e-income-overlay-mode");
    document.body.classList.add("pnx-step150e-income-open");
    screen.classList.add("pnx-step150e-overlay-screen");
    screen.setAttribute("aria-hidden", "false");

    // 旧STEP150c/150dの残留classを解除
    panel.classList.remove("pnx-step150c-income-only", "pnx-step150d-income-only");
    document.querySelectorAll(".pnx-step150c-force-hidden, [data-pnx-step150c-hidden='1']").forEach(el => {
      el.classList.remove("pnx-step150c-force-hidden");
      el.removeAttribute("data-pnx-step150c-hidden");
    });

    window.__PNX_STEP150E_LAST_APPLY__ = new Date().toISOString();
    return true;
  }

  function clearOverlay(){
    const panel = findFilingPanel();
    const screen = get("pnx-step150-income-screen");

    if (panel) panel.classList.remove("pnx-step150e-income-overlay-mode", "pnx-step150d-income-only", "pnx-step150b-income-only", "pnx-step150c-income-only");
    if (screen) screen.classList.remove("pnx-step150e-overlay-screen", "pnx-step150d-active", "pnx-step150b-active-screen", "pnx-step150c-active-screen");
    document.body.classList.remove("pnx-step150e-income-open");

    document.querySelectorAll(".pnx-step150c-force-hidden, [data-pnx-step150c-hidden='1']").forEach(el => {
      el.classList.remove("pnx-step150c-force-hidden");
      el.removeAttribute("data-pnx-step150c-hidden");
    });

    window.__PNX_STEP150E_LAST_CLEAR__ = new Date().toISOString();
    return true;
  }

  const open0 = window.PNXStep150OpenIncomeConfirmScreen;
  if (typeof open0 === "function" && !open0.__pnxStep150eWrapped) {
    const wrapped = function(){
      const result = open0.apply(this, arguments);
      setTimeout(applyOverlay, 0);
      setTimeout(applyOverlay, 80);
      return result;
    };
    wrapped.__pnxStep150eWrapped = true;
    window.PNXStep150OpenIncomeConfirmScreen = wrapped;
  }

  const close0 = window.PNXStep150CloseIncomeConfirmScreen;
  if (typeof close0 === "function" && !close0.__pnxStep150eWrapped) {
    const wrappedClose = function(){
      const result = close0.apply(this, arguments);
      setTimeout(clearOverlay, 0);
      return result;
    };
    wrappedClose.__pnxStep150eWrapped = true;
    window.PNXStep150CloseIncomeConfirmScreen = wrappedClose;
  }

  document.addEventListener("click", function(e){
    const incomeTask = e.target && e.target.closest && e.target.closest('[data-step148-task="transactions"]');
    if (incomeTask) {
      setTimeout(applyOverlay, 0);
      setTimeout(applyOverlay, 120);
      return;
    }

    const back = e.target && e.target.closest && e.target.closest("#pnx-step150-income-back");
    if (back) {
      setTimeout(clearOverlay, 80);
      return;
    }

    const confirm = e.target && e.target.closest && e.target.closest("#pnx-step150-confirm-income");
    if (confirm) {
      setTimeout(clearOverlay, 650);
      return;
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    clearOverlay();
  });

  window.PNXStep150eApplyIncomeOverlay = applyOverlay;
  window.PNXStep150eClearIncomeOverlay = clearOverlay;
  window.PNXStep150eIncomeScreenOverlayFixStatus = function(){
    const panel = findFilingPanel();
    const screen = get("pnx-step150-income-screen");
    return {
      step:"150e",
      screenExists:!!screen,
      screenOpen:!!(screen && screen.classList.contains("is-open")),
      overlayClass:!!(screen && screen.classList.contains("pnx-step150e-overlay-screen")),
      bodyOpen:document.body.classList.contains("pnx-step150e-income-open"),
      panelOverlayMode:!!(panel && panel.classList.contains("pnx-step150e-income-overlay-mode")),
      lastApply:window.__PNX_STEP150E_LAST_APPLY__ || null,
      lastClear:window.__PNX_STEP150E_LAST_CLEAR__ || null,
      note:"収入確認画面を前面表示し、確認しましたの下に申告準備率カードを見せない"
    };
  };
})();




/* ================================================================
   STEP150f: Income screen force fixed
   目的:
   - 追加classの付与漏れがあっても、
     #pnx-step150-income-screen.is-open だけで必ず前面固定表示にする
   - 「確認しました」の下に今年の申告準備率カードを表示させない
   ================================================================ */
(function(){
  if (window.__PNX_STEP150F_INCOME_SCREEN_FORCE_FIXED__) return;
  window.__PNX_STEP150F_INCOME_SCREEN_FORCE_FIXED__ = true;

  function get(id){ return document.getElementById(id); }

  function apply(){
    const screen = get("pnx-step150-income-screen");
    if (!screen) return false;

    if (screen.classList.contains("is-open")) {
      document.body.classList.add("pnx-step150f-income-open");
      screen.classList.add("pnx-step150f-force-fixed");
      window.__PNX_STEP150F_LAST_APPLY__ = new Date().toISOString();
      return true;
    }

    clear();
    return false;
  }

  function clear(){
    const screen = get("pnx-step150-income-screen");
    document.body.classList.remove("pnx-step150f-income-open");
    if (screen) screen.classList.remove("pnx-step150f-force-fixed");
    window.__PNX_STEP150F_LAST_CLEAR__ = new Date().toISOString();
    return true;
  }

  const open0 = window.PNXStep150OpenIncomeConfirmScreen;
  if (typeof open0 === "function" && !open0.__pnxStep150fWrapped) {
    const wrapped = function(){
      const result = open0.apply(this, arguments);
      setTimeout(apply, 0);
      setTimeout(apply, 80);
      return result;
    };
    wrapped.__pnxStep150fWrapped = true;
    window.PNXStep150OpenIncomeConfirmScreen = wrapped;
  }

  const close0 = window.PNXStep150CloseIncomeConfirmScreen;
  if (typeof close0 === "function" && !close0.__pnxStep150fWrapped) {
    const wrappedClose = function(){
      const result = close0.apply(this, arguments);
      setTimeout(clear, 0);
      return result;
    };
    wrappedClose.__pnxStep150fWrapped = true;
    window.PNXStep150CloseIncomeConfirmScreen = wrappedClose;
  }

  document.addEventListener("click", function(e){
    const incomeTask = e.target && e.target.closest && e.target.closest('[data-step148-task="transactions"]');
    if (incomeTask) {
      setTimeout(apply, 0);
      setTimeout(apply, 100);
      return;
    }

    const back = e.target && e.target.closest && e.target.closest("#pnx-step150-income-back");
    if (back) {
      setTimeout(clear, 80);
      return;
    }

    const confirm = e.target && e.target.closest && e.target.closest("#pnx-step150-confirm-income");
    if (confirm) {
      setTimeout(clear, 650);
      return;
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    clear();
  });

  window.PNXStep150fApplyIncomeForceFixed = apply;
  window.PNXStep150fClearIncomeForceFixed = clear;
  window.PNXStep150fIncomeScreenForceFixedStatus = function(){
    const screen = get("pnx-step150-income-screen");
    return {
      step:"150f",
      screenExists:!!screen,
      screenOpen:!!(screen && screen.classList.contains("is-open")),
      forceFixedClass:!!(screen && screen.classList.contains("pnx-step150f-force-fixed")),
      bodyOpen:document.body.classList.contains("pnx-step150f-income-open"),
      lastApply:window.__PNX_STEP150F_LAST_APPLY__ || null,
      lastClear:window.__PNX_STEP150F_LAST_CLEAR__ || null,
      note:"is-openだけで収入確認画面を固定前面表示し、下カードを見せない"
    };
  };
})();




/* ================================================================
   STEP151: Remove tournament/income organization task
   目的:
   - 申告トップのやること一覧から
     「大会・収入の整理 / 大会・収支整理」行を削除
   - 他のやること一覧、収入確認画面、申告書類CTAは残す
   ================================================================ */
(function(){
  if (window.__PNX_STEP151_REMOVE_TOURNAMENT_INCOME_TASK__) return;
  window.__PNX_STEP151_REMOVE_TOURNAMENT_INCOME_TASK__ = true;

  function text(el){
    return String(el && el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function removeTask(){
    let removed = 0;

    document.querySelectorAll('[data-step148-task="tournaments"]').forEach(row => {
      row.remove();
      removed += 1;
    });

    // 念のため文言でも削除
    document.querySelectorAll("#pnx-step148-todo-list > *, .pnx-filing-ref-todo-card > *, .pnx-step148d-top-todo *").forEach(el => {
      const t = text(el);
      if (/大会・収入の整理|大会・収支整理/.test(t)) {
        const row = el.closest("button, .pnx-filing-ref-todo-row, li, .todo-row, div");
        if (row && row.parentNode) {
          row.remove();
          removed += 1;
        }
      }
    });

    window.__PNX_STEP151_LAST_REMOVE__ = {
      at:new Date().toISOString(),
      removed
    };

    return removed;
  }

  document.addEventListener("DOMContentLoaded", function(){
    removeTask();
    setTimeout(removeTask, 300);
    setTimeout(removeTask, 1000);
  });

  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest('.fin-tab[data-tab="filing"], .fin-tab');
    if (!tab) return;
    setTimeout(removeTask, 120);
    setTimeout(removeTask, 500);
  }, true);

  window.PNXStep151RemoveTournamentIncomeTask = removeTask;
  window.PNXStep151RemoveTournamentIncomeTaskStatus = function(){
    const rows = Array.from(document.querySelectorAll('[data-step148-task="tournaments"], button, .pnx-filing-ref-todo-row'))
      .filter(el => /大会・収入の整理|大会・収支整理/.test(text(el)));
    return {
      step:151,
      remainingTournamentRows:rows.length,
      lastRemove:window.__PNX_STEP151_LAST_REMOVE__ || null,
      note:"やること一覧から大会・収入の整理を削除"
    };
  };
})();




/* ================================================================
   STEP151b: Restore tournament / income organization task
   目的:
   - STEP151で削除/非表示にした「大会・収支整理」を復活
   ================================================================ */
(function(){
  if (window.__PNX_STEP151B_RESTORE_TOURNAMENT_INCOME_TASK__) return;
  window.__PNX_STEP151B_RESTORE_TOURNAMENT_INCOME_TASK__ = true;

  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }
  window.PNXStep151RemoveTournamentIncomeTask = function(){ return 0; };

  function findTodoList(){
    return document.getElementById("pnx-step148-todo-list")
      || document.querySelector("#pnx-step148d-filing-top .pnx-filing-ref-todo-card")
      || document.querySelector(".pnx-filing-ref-todo-card");
  }

  function makeRow(){
    const row = document.createElement("button");
    row.type = "button";
    row.className = "pnx-filing-ref-todo-row pnx-step151b-restored-row";
    row.setAttribute("data-step148-task", "tournaments");
    row.innerHTML = '<span class="circle empty"></span><strong>大会・収支整理</strong><em class="warn">確認</em><i>›</i>';
    return row;
  }

  function restoreTask(){
    const list = findTodoList();
    if (!list) return false;

    let row = list.querySelector('[data-step148-task="tournaments"]');
    if (!row) {
      row = Array.from(list.children).find(el => /大会・収入の整理|大会・収支整理/.test(text(el))) || null;
    }

    if (!row) {
      row = makeRow();
      const first = list.querySelector('[data-step148-task="transactions"]');
      if (first && first.nextSibling) list.insertBefore(row, first.nextSibling);
      else list.appendChild(row);
    }

    row.setAttribute("data-step148-task", "tournaments");
    row.classList.add("pnx-step151b-restored-row");
    row.style.removeProperty("display");
    row.hidden = false;
    row.removeAttribute("aria-hidden");

    const title = row.querySelector("strong");
    if (title) title.textContent = "大会・収支整理";

    const em = row.querySelector("em");
    if (em) {
      em.textContent = "確認";
      em.classList.remove("done");
      em.classList.add("warn");
    }

    const circle = row.querySelector(".circle");
    if (circle) {
      circle.classList.remove("done");
      circle.classList.add("empty");
      circle.textContent = "";
    }

    window.__PNX_STEP151B_LAST_RESTORE__ = new Date().toISOString();
    return true;
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(restoreTask, 80);
    setTimeout(restoreTask, 450);
    setTimeout(restoreTask, 1200);
  });

  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest('.fin-tab[data-tab="filing"], .fin-tab');
    if (!tab) return;
    setTimeout(restoreTask, 120);
    setTimeout(restoreTask, 600);
  }, true);

  window.PNXStep151bRestoreTournamentIncomeTask = restoreTask;
  window.PNXStep151bRestoreTournamentIncomeTaskStatus = function(){
    const rows = Array.from(document.querySelectorAll('[data-step148-task="tournaments"], button, .pnx-filing-ref-todo-row'))
      .filter(el => /大会・収入の整理|大会・収支整理/.test(text(el)));
    return {
      step:"151b",
      restoredRows:rows.length,
      visibleRows:rows.filter(el => getComputedStyle(el).display !== "none").length,
      lastRestore:window.__PNX_STEP151B_LAST_RESTORE__ || null,
      note:"大会・収支整理をやること一覧に復活"
    };
  };
})();



/* ================================================================
   STEP152: Tax documents open only from CTA
   ================================================================ */
(function(){
  if (window.__PNX_STEP152_TAX_DOCUMENTS_OPEN_ON_CTA__) return;
  window.__PNX_STEP152_TAX_DOCUMENTS_OPEN_ON_CTA__ = true;
  const MAIN_TEXT = "申告書類を作成する（PDF/CSV）";
  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g," ").trim(); }
  function panel(){ return get("tab-filing") || document.querySelector('[data-tab-panel="filing"], .fin-panel[data-panel="filing"]'); }
  function docs(){
    return get("pnx-step144-taxdocs") || Array.from(document.querySelectorAll("section,article,div")).find(el => /作成できる書類/.test(text(el)) && /e-Taxに進む/.test(text(el)));
  }
  function home(){ return get("pnx-step148d-filing-top") || get("pnx-step148-filing-home"); }

  function ensureHeader(d){
    if (!d || get("pnx-step152-docs-head")) return;
    const h = document.createElement("div");
    h.id = "pnx-step152-docs-head";
    h.className = "pnx-step152-docs-head";
    h.innerHTML = '<button type="button" id="pnx-step152-docs-back" aria-label="申告トップへ戻る">←</button><h2>申告書類の作成</h2>';
    d.insertBefore(h, d.firstChild);
  }

  function hide(){
    const d = docs();
    const h = home();
    if (!d) return false;
    ensureHeader(d);
    d.classList.add("pnx-step152-taxdocs-page");
    d.classList.remove("pnx-step152-taxdocs-open");
    d.setAttribute("aria-hidden","true");
    if (h) h.classList.remove("pnx-step152-home-hidden");
    window.__PNX_STEP152_LAST_HIDE__ = new Date().toISOString();
    return true;
  }

  function open(){
    const d = docs();
    const p = panel();
    const h = home();
    if (!d) return false;
    ensureHeader(d);
    if (p && d.parentNode !== p) p.appendChild(d);
    if (h) h.classList.add("pnx-step152-home-hidden");
    d.classList.add("pnx-step152-taxdocs-page","pnx-step152-taxdocs-open");
    d.setAttribute("aria-hidden","false");
    try { if (p) p.scrollTo({top:0,behavior:"auto"}); } catch(e){}
    window.__PNX_STEP152_LAST_OPEN__ = new Date().toISOString();
    return true;
  }

  function close(){
    const d = docs();
    const h = home();
    if (d) {
      d.classList.add("pnx-step152-taxdocs-page");
      d.classList.remove("pnx-step152-taxdocs-open");
      d.setAttribute("aria-hidden","true");
    }
    if (h) h.classList.remove("pnx-step152-home-hidden");
    window.__PNX_STEP152_LAST_CLOSE__ = new Date().toISOString();
    return true;
  }

  function bind(){
    const d = docs();
    if (d) {
      ensureHeader(d);
      d.classList.add("pnx-step152-taxdocs-page");
      if (!d.classList.contains("pnx-step152-taxdocs-open")) d.setAttribute("aria-hidden","true");
    }
    const b = get("pnx-step152-docs-back");
    if (b && !b.__pnxStep152Bound) {
      b.__pnxStep152Bound = true;
      b.addEventListener("click", function(e){ e.preventDefault(); e.stopPropagation(); close(); }, true);
    }
  }

  document.addEventListener("click", function(e){
    const btn = e.target && e.target.closest && e.target.closest("button,a,[role='button']");
    if (!btn) return;
    const t = text(btn);
    if (t === MAIN_TEXT || /申告書類を作成する/.test(t)) {
      if (btn.closest && btn.closest("#pnx-step144-taxdocs") && btn.hasAttribute("data-pnx-doc")) return;
      e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      open(); return;
    }
    if (btn.id === "pnx-step152-docs-back") {
      e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      close();
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    bind();
    setTimeout(function(){bind(); hide();}, 250);
    setTimeout(function(){bind(); hide();}, 1000);
  });

  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest('.fin-tab[data-tab="filing"], .fin-tab');
    if (!tab) return;
    setTimeout(function(){bind(); hide();}, 180);
  }, true);

  window.PNXStep152OpenTaxDocumentsPage = open;
  window.PNXStep152CloseTaxDocumentsPage = close;
  window.PNXStep152HideTaxDocumentsByDefault = hide;
  window.PNXStep152TaxDocumentsOpenOnCtaStatus = function(){
    const d = docs(), h = home();
    return {
      step:152,
      docsExists:!!d,
      docsOpen:!!(d && d.classList.contains("pnx-step152-taxdocs-open")),
      docsHidden:!!(d && getComputedStyle(d).display === "none"),
      homeHidden:!!(h && h.classList.contains("pnx-step152-home-hidden")),
      lastOpen:window.__PNX_STEP152_LAST_OPEN__ || null,
      lastClose:window.__PNX_STEP152_LAST_CLOSE__ || null,
      lastHide:window.__PNX_STEP152_LAST_HIDE__ || null,
      note:"作成できる書類ページは通常非表示。申告書類作成CTAでのみ表示。"
    };
  };
})();




/* ================================================================
   STEP152b: Tax documents CTA click fix
   目的:
   - STEP147/STEP149の古いクリック処理が先に反応しても、
     「申告書類を作成する（PDF/CSV）」で確実に書類ページを開く
   ================================================================ */
(function(){
  if (window.__PNX_STEP152B_TAX_DOCUMENTS_CTA_CLICK_FIX__) return;
  window.__PNX_STEP152B_TAX_DOCUMENTS_CTA_CLICK_FIX__ = true;

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  function findFilingPanel(){
    return get("tab-filing") || document.querySelector('[data-tab-panel="filing"], .fin-panel[data-panel="filing"]');
  }

  function findDocs(){
    return get("pnx-step144-taxdocs")
      || Array.from(document.querySelectorAll("section, article, div")).find(el => /作成できる書類/.test(text(el)) && /e-Taxに進む/.test(text(el)));
  }

  function findHome(){
    return get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");
  }

  function ensureHeader(docs){
    if (!docs || get("pnx-step152-docs-head")) return;
    const head = document.createElement("div");
    head.id = "pnx-step152-docs-head";
    head.className = "pnx-step152-docs-head";
    head.innerHTML = '<button type="button" id="pnx-step152-docs-back" aria-label="申告トップへ戻る">←</button><h2>申告書類の作成</h2>';
    docs.insertBefore(head, docs.firstChild);

    const back = get("pnx-step152-docs-back");
    if (back && !back.__pnxStep152bBound) {
      back.__pnxStep152bBound = true;
      back.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        window.PNXStep152bCloseTaxDocumentsFromCta();
      }, true);
    }
  }

  function openDocs(){
    const docs = findDocs();
    const panel = findFilingPanel();
    const home = findHome();

    if (!docs) return false;
    ensureHeader(docs);

    if (panel && docs.parentNode !== panel) panel.appendChild(docs);
    if (home) home.classList.add("pnx-step152-home-hidden");

    docs.classList.add("pnx-step152-taxdocs-page", "pnx-step152-taxdocs-open");
    docs.setAttribute("aria-hidden", "false");

    try { if (panel) panel.scrollTo({ top:0, behavior:"auto" }); } catch(e) {}
    try { docs.scrollIntoView({ behavior:"auto", block:"start" }); } catch(e) {}

    window.__PNX_STEP152B_LAST_OPEN__ = new Date().toISOString();
    return true;
  }

  function closeDocs(){
    const docs = findDocs();
    const home = findHome();

    if (docs) {
      docs.classList.add("pnx-step152-taxdocs-page");
      docs.classList.remove("pnx-step152-taxdocs-open");
      docs.setAttribute("aria-hidden", "true");
    }
    if (home) home.classList.remove("pnx-step152-home-hidden");

    window.__PNX_STEP152B_LAST_CLOSE__ = new Date().toISOString();
    return true;
  }

  function hideDefault(){
    const docs = findDocs();
    const home = findHome();
    if (!docs) return false;
    ensureHeader(docs);
    if (!docs.classList.contains("pnx-step152-taxdocs-open")) {
      docs.classList.add("pnx-step152-taxdocs-page");
      docs.setAttribute("aria-hidden", "true");
      if (home) home.classList.remove("pnx-step152-home-hidden");
    }
    return true;
  }

  // 最後の安全弁。先の古いhandlerで止まっても、関数側が開くようにしている。
  window.PNXStep152bOpenTaxDocumentsFromCta = openDocs;
  window.PNXStep152bCloseTaxDocumentsFromCta = closeDocs;
  window.PNXStep152bHideTaxDocumentsDefault = hideDefault;

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(hideDefault, 300);
    setTimeout(hideDefault, 1100);
  });

  window.PNXStep152bTaxDocumentsCtaClickFixStatus = function(){
    const docs = findDocs();
    const home = findHome();
    return {
      step:"152b",
      docsExists:!!docs,
      docsOpen:!!(docs && docs.classList.contains("pnx-step152-taxdocs-open")),
      docsHidden:!!(docs && getComputedStyle(docs).display === "none"),
      homeHidden:!!(home && home.classList.contains("pnx-step152-home-hidden")),
      lastOpen:window.__PNX_STEP152B_LAST_OPEN__ || null,
      lastClose:window.__PNX_STEP152B_LAST_CLOSE__ || null,
      note:"古いCTA処理も申告書類ページを開く処理へ接続済み"
    };
  };
})();




/* ================================================================
   STEP152c: Tax documents standalone page
   目的:
   - 「作成できる書類」を下に常時表示しない
   - CTAを押した時、下へスクロールではなく前面の詳細ページとして開く
   ================================================================ */
(function(){
  if (window.__PNX_STEP152C_TAX_DOCUMENTS_STANDALONE_PAGE__) return;
  window.__PNX_STEP152C_TAX_DOCUMENTS_STANDALONE_PAGE__ = true;

  const MAIN_TEXT = "申告書類を作成する（PDF/CSV）";

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  function docs(){
    return get("pnx-step144-taxdocs")
      || Array.from(document.querySelectorAll("section,article,div")).find(el => /作成できる書類/.test(text(el)) && /e-Taxに進む/.test(text(el)));
  }

  function panel(){
    return get("tab-filing") || document.querySelector('[data-tab-panel="filing"], .fin-panel[data-panel="filing"]');
  }

  function home(){
    return get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");
  }

  function ensureHeader(d){
    if (!d || get("pnx-step152c-docs-head")) return;
    const h = document.createElement("div");
    h.id = "pnx-step152c-docs-head";
    h.className = "pnx-step152c-docs-head";
    h.innerHTML = '<button type="button" id="pnx-step152c-docs-back" aria-label="申告トップへ戻る">←</button><h2>申告書類の作成</h2>';
    d.insertBefore(h, d.firstChild);

    const back = get("pnx-step152c-docs-back");
    if (back && !back.__pnxStep152cBound) {
      back.__pnxStep152cBound = true;
      back.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        closePage();
      }, true);
    }
  }

  function closePage(){
    const d = docs();
    const h = home();

    if (d) {
      d.classList.add("pnx-step152c-taxdocs-page");
      d.classList.remove("pnx-step152c-open", "pnx-step152-taxdocs-open");
      d.setAttribute("aria-hidden", "true");
    }
    if (h) h.classList.remove("pnx-step152c-home-hidden", "pnx-step152-home-hidden");
    document.body.classList.remove("pnx-step152c-docs-open-body");

    window.__PNX_STEP152C_LAST_CLOSE__ = new Date().toISOString();
    return true;
  }

  function hideDefault(){
    const d = docs();
    const h = home();

    if (!d) return false;
    ensureHeader(d);

    d.classList.add("pnx-step152c-taxdocs-page");
    if (!d.classList.contains("pnx-step152c-open")) {
      d.classList.remove("pnx-step152-taxdocs-open");
      d.setAttribute("aria-hidden", "true");
      if (h) h.classList.remove("pnx-step152c-home-hidden", "pnx-step152-home-hidden");
      document.body.classList.remove("pnx-step152c-docs-open-body");
    }

    window.__PNX_STEP152C_LAST_HIDE__ = new Date().toISOString();
    return true;
  }

  function openPage(){
    const d = docs();
    const p = panel();
    const h = home();

    if (!d) return false;
    ensureHeader(d);

    if (p && d.parentNode !== p) {
      p.appendChild(d);
    }

    if (h) h.classList.add("pnx-step152c-home-hidden", "pnx-step152-home-hidden");

    d.classList.add("pnx-step152c-taxdocs-page", "pnx-step152c-open", "pnx-step152-taxdocs-open");
    d.setAttribute("aria-hidden", "false");
    document.body.classList.add("pnx-step152c-docs-open-body");

    // スクロールではなく前面表示なので位置をリセット
    try { d.scrollTop = 0; } catch(e) {}
    try { if (p) p.scrollTo({ top:0, behavior:"auto" }); } catch(e) {}

    window.__PNX_STEP152C_LAST_OPEN__ = new Date().toISOString();
    return true;
  }

  // 古い関数も上書きして、全部この前面ページ表示へ寄せる
  window.PNXStep152OpenTaxDocumentsPage = openPage;
  window.PNXStep152bOpenTaxDocumentsFromCta = openPage;
  window.PNXStep152cOpenTaxDocumentsStandalonePage = openPage;

  window.PNXStep152CloseTaxDocumentsPage = closePage;
  window.PNXStep152bCloseTaxDocumentsFromCta = closePage;
  window.PNXStep152cCloseTaxDocumentsStandalonePage = closePage;

  window.PNXStep152HideTaxDocumentsByDefault = hideDefault;
  window.PNXStep152bHideTaxDocumentsDefault = hideDefault;
  window.PNXStep152cHideTaxDocumentsDefault = hideDefault;

  document.addEventListener("click", function(e){
    const btn = e.target && e.target.closest && e.target.closest("button,a,[role='button']");
    if (!btn) return;

    const t = text(btn);

    if (t === MAIN_TEXT || /申告書類を作成する/.test(t)) {
      if (btn.closest && btn.closest("#pnx-step144-taxdocs") && btn.hasAttribute("data-pnx-doc")) return;
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      openPage();
      return;
    }

    if (btn.id === "pnx-step152c-docs-back" || btn.id === "pnx-step152-docs-back") {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      closePage();
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(hideDefault, 120);
    setTimeout(hideDefault, 450);
    setTimeout(hideDefault, 1200);
  });

  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest('.fin-tab[data-tab="filing"], .fin-tab');
    if (!tab) return;
    setTimeout(hideDefault, 180);
  }, true);

  window.PNXStep152cTaxDocumentsStandalonePageStatus = function(){
    const d = docs();
    const h = home();
    return {
      step:"152c",
      docsExists:!!d,
      open:!!(d && d.classList.contains("pnx-step152c-open")),
      hiddenDefault:!!(d && getComputedStyle(d).display === "none" && !d.classList.contains("pnx-step152c-open")),
      homeHidden:!!(h && h.classList.contains("pnx-step152c-home-hidden")),
      bodyOpen:document.body.classList.contains("pnx-step152c-docs-open-body"),
      lastOpen:window.__PNX_STEP152C_LAST_OPEN__ || null,
      lastClose:window.__PNX_STEP152C_LAST_CLOSE__ || null,
      lastHide:window.__PNX_STEP152C_LAST_HIDE__ || null,
      note:"作成できる書類は下に常時表示せず、CTAで前面ページとして開く"
    };
  };
})();




/* ================================================================
   STEP152d: Tax documents header dedupe
   目的:
   - 申告書類ページで「申告書類の作成」ヘッダーが二重表示される問題を修正
   - STEP152/152b の古いヘッダーと STEP152c の新ヘッダーが両方出るため、1つに統一
   ================================================================ */
(function(){
  if (window.__PNX_STEP152D_TAX_DOCUMENTS_HEADER_DEDUPE__) return;
  window.__PNX_STEP152D_TAX_DOCUMENTS_HEADER_DEDUPE__ = true;

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  function findDocs(){
    return get("pnx-step144-taxdocs")
      || Array.from(document.querySelectorAll("section,article,div")).find(el => /作成できる書類/.test(text(el)) && /e-Taxに進む/.test(text(el)));
  }

  function cleanupHeaders(){
    const d = findDocs();
    if (!d) return false;

    const newHead = get("pnx-step152c-docs-head");
    const oldHead = get("pnx-step152-docs-head");

    // 新ヘッダーを正とする。古いヘッダーは削除。
    if (newHead && oldHead && oldHead !== newHead) {
      oldHead.remove();
    }

    // 同じタイトルのヘッダーが複数ある場合も1つだけ残す
    const heads = Array.from(d.querySelectorAll(".pnx-step152c-docs-head, .pnx-step152-docs-head"))
      .filter(el => /申告書類の作成/.test(text(el)));

    heads.forEach((head, index) => {
      if (index > 0) head.remove();
    });

    // もし古いヘッダーしかない場合はそれを使う
    const remaining = Array.from(d.querySelectorAll(".pnx-step152c-docs-head, .pnx-step152-docs-head"))
      .filter(el => /申告書類の作成/.test(text(el)));
    if (remaining[0]) remaining[0].classList.add("pnx-step152d-single-docs-head");

    window.__PNX_STEP152D_LAST_CLEANUP__ = {
      at:new Date().toISOString(),
      remainingHeaders:remaining.length || 1
    };

    return true;
  }

  // 既存のopen関数をラップして、開いた直後に必ず重複削除
  ["PNXStep152cOpenTaxDocumentsStandalonePage", "PNXStep152bOpenTaxDocumentsFromCta", "PNXStep152OpenTaxDocumentsPage"].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep152dWrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(cleanupHeaders, 0);
        setTimeout(cleanupHeaders, 80);
        return result;
      };
      wrapped.__pnxStep152dWrapped = true;
      window[name] = wrapped;
    }
  });

  document.addEventListener("click", function(e){
    const btn = e.target && e.target.closest && e.target.closest("button,a,[role='button']");
    if (!btn) return;
    const t = text(btn);
    if (/申告書類を作成する/.test(t)) {
      setTimeout(cleanupHeaders, 0);
      setTimeout(cleanupHeaders, 120);
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(cleanupHeaders, 500);
    setTimeout(cleanupHeaders, 1300);
  });

  window.PNXStep152dCleanupTaxDocumentHeaders = cleanupHeaders;
  window.PNXStep152dTaxDocumentHeaderDedupeStatus = function(){
    const d = findDocs();
    const headers = d ? Array.from(d.querySelectorAll(".pnx-step152c-docs-head, .pnx-step152-docs-head"))
      .filter(el => /申告書類の作成/.test(text(el))) : [];
    return {
      step:"152d",
      docsExists:!!d,
      headerCount:headers.length,
      lastCleanup:window.__PNX_STEP152D_LAST_CLEANUP__ || null,
      note:"申告書類の作成ヘッダーを1つに統一"
    };
  };
})();




/* ================================================================
   STEP152e: Tax documents intro card removed
   目的:
   - 申告書類ページ上部の不要な説明カードを削除
   - 「Documents / 申告書類の作成 / 2026年」のカードはヘッダーと重複するため非表示
   ================================================================ */
(function(){
  if (window.__PNX_STEP152E_TAX_DOCUMENTS_INTRO_CARD_REMOVED__) return;
  window.__PNX_STEP152E_TAX_DOCUMENTS_INTRO_CARD_REMOVED__ = true;

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  function findDocs(){
    return get("pnx-step144-taxdocs")
      || Array.from(document.querySelectorAll("section,article,div")).find(el => /作成できる書類/.test(text(el)) && /e-Taxに進む/.test(text(el)));
  }

  function cleanupIntroCard(){
    const d = findDocs();
    if (!d) return false;

    let removed = 0;

    Array.from(d.children).forEach(child => {
      if (child.id === "pnx-step152c-docs-head" || child.id === "pnx-step152-docs-head") return;
      const t = text(child);

      // 写真の不要カード: Documents / 申告書類の作成 / 2026年 / 説明文
      const isIntro =
        /Documents/.test(t) &&
        /申告書類の作成/.test(t) &&
        /2026年|申告前に確認|書類を作成/.test(t);

      if (isIntro) {
        child.classList.add("pnx-step152e-hide-intro-card");
        child.setAttribute("aria-hidden", "true");
        removed += 1;
      }
    });

    // direct child以外で作られている場合の保険
    d.querySelectorAll("section, article, div").forEach(el => {
      if (el.id === "pnx-step152c-docs-head" || el.id === "pnx-step152-docs-head") return;
      if (el.closest("#pnx-step152c-docs-head, #pnx-step152-docs-head")) return;
      const t = text(el);
      if (
        /Documents/.test(t) &&
        /申告書類の作成/.test(t) &&
        /2026年|申告前に確認|書類を作成/.test(t)
      ) {
        // 親子両方に当たりすぎないよう、できるだけカードらしい外側を非表示
        const card = el.closest(".card, .pnx-card, .tax-card, article, section, div") || el;
        if (!card.closest("#pnx-step152c-docs-head, #pnx-step152-docs-head")) {
          card.classList.add("pnx-step152e-hide-intro-card");
          card.setAttribute("aria-hidden", "true");
          removed += 1;
        }
      }
    });

    window.__PNX_STEP152E_LAST_CLEANUP__ = {
      at:new Date().toISOString(),
      hiddenIntroCards:removed
    };

    return true;
  }

  ["PNXStep152cOpenTaxDocumentsStandalonePage", "PNXStep152bOpenTaxDocumentsFromCta", "PNXStep152OpenTaxDocumentsPage"].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep152eWrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(cleanupIntroCard, 0);
        setTimeout(cleanupIntroCard, 80);
        return result;
      };
      wrapped.__pnxStep152eWrapped = true;
      window[name] = wrapped;
    }
  });

  document.addEventListener("click", function(e){
    const btn = e.target && e.target.closest && e.target.closest("button,a,[role='button']");
    if (!btn) return;
    if (/申告書類を作成する/.test(text(btn))) {
      setTimeout(cleanupIntroCard, 0);
      setTimeout(cleanupIntroCard, 120);
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(cleanupIntroCard, 400);
    setTimeout(cleanupIntroCard, 1200);
  });

  window.PNXStep152eCleanupTaxDocumentsIntroCard = cleanupIntroCard;
  window.PNXStep152eTaxDocumentsIntroCardRemovedStatus = function(){
    const d = findDocs();
    const hidden = d ? d.querySelectorAll(".pnx-step152e-hide-intro-card").length : 0;
    return {
      step:"152e",
      docsExists:!!d,
      hiddenIntroCards:hidden,
      lastCleanup:window.__PNX_STEP152E_LAST_CLEANUP__ || null,
      note:"Documents / 申告書類の作成 / 2026年 の説明カードを非表示"
    };
  };
})();




/* ================================================================
   STEP153: Filing task labels refined
   目的:
   - 申告トップのやること一覧を、専門用語っぽさを減らして分かりやすくする
   - デザインは大きく変えず、タイトル + 小さい補足文で詳細化
   ================================================================ */
(function(){
  if (window.__PNX_STEP153_FILING_TASK_LABELS_REFINED__) return;
  window.__PNX_STEP153_FILING_TASK_LABELS_REFINED__ = true;

  const TASKS = {
    transactions: {
      title: "収入を確認する",
      sub: "賞金・スポンサー料などの収入を確認"
    },
    tournaments: {
      title: "大会ごとの収支を確認する",
      sub: "大会別の収入・経費を整理"
    },
    categories: {
      title: "経費を分類する",
      sub: "交通費・宿泊費などをカテゴリ分け"
    },
    receipts: {
      title: "レシート・領収書をそろえる",
      sub: "不足している証憑を確認"
    },
    rent: {
      title: "家賃按分を確認する",
      sub: "該当する場合だけ設定"
    },
    documents: {
      title: "申告書類を作成する",
      sub: "PDF・CSVを作成して保存"
    },
    share: {
      title: "税理士へ共有する",
      sub: "確認用データをまとめて共有"
    }
  };

  function text(el){
    return String(el && el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function findRows(){
    const rows = Array.from(document.querySelectorAll("[data-step148-task]"));
    const list = document.getElementById("pnx-step148-todo-list") || document.querySelector(".pnx-filing-ref-todo-card");

    // data属性が無い古い行にも最低限対応
    if (list) {
      Array.from(list.children).forEach(row => {
        const t = text(row);
        if (!row.getAttribute("data-step148-task")) {
          if (/収支の入力・確認|収入/.test(t)) row.setAttribute("data-step148-task", "transactions");
          else if (/大会・収入の整理|大会・収支整理|大会ごと/.test(t)) row.setAttribute("data-step148-task", "tournaments");
          else if (/経費の分類|経費を分類/.test(t)) row.setAttribute("data-step148-task", "categories");
          else if (/レシート|領収書/.test(t)) row.setAttribute("data-step148-task", "receipts");
          else if (/家賃按分/.test(t)) row.setAttribute("data-step148-task", "rent");
          else if (/申告書類の出力|申告書類を作成/.test(t)) row.setAttribute("data-step148-task", "documents");
          else if (/税理士|会計事務所/.test(t)) row.setAttribute("data-step148-task", "share");
        }
      });
    }

    return Array.from(document.querySelectorAll("[data-step148-task]"));
  }

  function applyLabels(){
    let updated = 0;

    findRows().forEach(row => {
      const key = row.getAttribute("data-step148-task");
      const data = TASKS[key];
      if (!data) return;

      row.classList.add("pnx-step153-task-row");

      let titleWrap = row.querySelector(".pnx-step153-task-text");
      let strong = row.querySelector("strong");

      if (!titleWrap) {
        titleWrap = document.createElement("span");
        titleWrap.className = "pnx-step153-task-text";

        if (strong) {
          strong.replaceWith(titleWrap);
        } else {
          const circle = row.querySelector(".circle");
          if (circle && circle.nextSibling) {
            row.insertBefore(titleWrap, circle.nextSibling);
          } else {
            row.insertBefore(titleWrap, row.firstChild);
          }
        }
      }

      titleWrap.innerHTML = `
        <strong class="pnx-step153-task-title">${data.title}</strong>
        <small class="pnx-step153-task-sub">${data.sub}</small>
      `;

      // 念のためステータスは読みやすく統一
      const em = row.querySelector("em");
      if (em) {
        if (key === "tournaments" && /確認|未設定|未完了/.test(text(em))) {
          em.textContent = "確認";
          em.classList.add("warn");
          em.classList.remove("done");
        }
        if (key === "documents" && /未完了|未設定/.test(text(em))) em.textContent = "未完了";
        if (key === "share" && /未完了|未設定/.test(text(em))) em.textContent = "未完了";
      }

      updated += 1;
    });

    // 進捗カード側も簡潔な5項目に寄せる
    const prep = document.querySelector(".pnx-step148d-top-prep-card, .filing-prep-card");
    if (prep) {
      const full = text(prep);
      if (/収入の確認|経費の確認|不足レシート/.test(full)) {
        const replacements = [
          ["収入の確認", "収入確認"],
          ["経費の確認", "経費分類"],
          ["不足レシートの追加", "レシート確認"],
          ["PDF出力", "書類作成"],
          ["e-Tax提出", "共有・提出"]
        ];
        prep.querySelectorAll("*").forEach(el => {
          if (!el.children.length) {
            let t = text(el);
            replacements.forEach(([a,b]) => {
              if (t === a) el.textContent = b;
            });
          }
        });
      }
    }

    window.__PNX_STEP153_LAST_APPLY__ = {
      at:new Date().toISOString(),
      updated
    };

    return updated;
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(applyLabels, 120);
    setTimeout(applyLabels, 500);
    setTimeout(applyLabels, 1300);
  });

  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest('.fin-tab[data-tab="filing"], .fin-tab');
    if (!tab) return;
    setTimeout(applyLabels, 160);
    setTimeout(applyLabels, 650);
  }, true);

  window.PNXStep153ApplyFilingTaskLabels = applyLabels;
  window.PNXStep153FilingTaskLabelsStatus = function(){
    const rows = findRows();
    const visible = rows.filter(row => getComputedStyle(row).display !== "none");
    return {
      step:153,
      totalRows:rows.length,
      visibleRows:visible.length,
      labelsApplied:rows.filter(row => row.querySelector(".pnx-step153-task-title")).length,
      lastApply:window.__PNX_STEP153_LAST_APPLY__ || null,
      note:"申告トップのやること一覧をタイトル+補足で分かりやすく整理"
    };
  };
})();




/* ================================================================
   STEP154: Filing STEP2 tournament finance confirm screen
   目的:
   - やること一覧「大会ごとの収支を確認する」を押すと
     大会別の収入・経費・利益確認画面を表示
   ================================================================ */
(function(){
  if (window.__PNX_STEP154_TOURNAMENT_FINANCE_CONFIRM__) return;
  window.__PNX_STEP154_TOURNAMENT_FINANCE_CONFIRM__ = true;

  const COMPLETE_KEY = "PNX_FILING_STEP154_TOURNAMENT_CONFIRMED";

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }
  function yen(n){ return "¥" + Number(n || 0).toLocaleString("ja-JP"); }

  function readTxs(){
    try {
      if (typeof window.PNXStep138gGetAllFinanceTransactions === "function") {
        return window.PNXStep138gGetAllFinanceTransactions() || [];
      }
    } catch(e) {}
    try {
      const list = JSON.parse(localStorage.getItem("PNX_FINANCE_TRANSACTIONS") || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function currentYear(){
    const y = get("pnx-step142-year");
    return Number(y && y.value) || new Date().getFullYear();
  }

  function txYear(tx){
    const raw = String((tx && (tx.date || tx.startDate || tx.createdAt)) || "");
    const y = Number(raw.slice(0,4));
    return y || currentYear();
  }

  function txAmount(tx){
    return Math.abs(Number(tx && (tx.amount || tx.value || tx.price || 0)) || 0);
  }

  function txType(tx){
    const t = String((tx && (tx.type || tx.kind || tx.flow || tx.side)) || "").toLowerCase();
    if (t.includes("income") || t.includes("revenue") || t === "in") return "income";
    if (tx && tx.income === true) return "income";
    return "expense";
  }

  function tournamentName(tx){
    if (!tx) return "";
    const candidates = [
      tx.tournamentName,
      tx.tournamentTitle,
      tx.tournament,
      tx.eventName,
      tx.eventTitle,
      tx.competitionName,
      tx.gameName,
      tx.tourName,
      tx.seriesName,
      tx.relatedTournament,
      tx.tournamentLabel,
      tx.tournamentMemo,
      tx.memoTournament
    ];
    if (tx.tournament && typeof tx.tournament === "object") {
      candidates.unshift(tx.tournament.title, tx.tournament.name, tx.tournament.label);
    }
    const found = candidates.map(v => String(v || "").trim()).find(Boolean);
    if (found) return found;

    const memo = String(tx.memo || tx.note || tx.description || "");
    const m = memo.match(/大会[:：]\s*([^\/\n]+)/);
    return m ? m[1].trim() : "";
  }

  function txLabel(tx){
    return String(tx.name || tx.title || tx.category || tx.memo || tx.description || "取引").trim();
  }

  function collect(){
    const year = currentYear();
    const grouped = new Map();
    const unlinked = [];
    let linkedCount = 0;

    readTxs().forEach(tx => {
      if (txYear(tx) !== year) return;
      const amount = txAmount(tx);
      if (!amount) return;

      const name = tournamentName(tx);
      const type = txType(tx);

      if (!name) {
        unlinked.push({ tx, amount, type });
        return;
      }

      if (!grouped.has(name)) {
        grouped.set(name, { name, income:0, expense:0, count:0 });
      }

      const g = grouped.get(name);
      if (type === "income") g.income += amount;
      else g.expense += amount;
      g.count += 1;
      linkedCount += 1;
    });

    const tournaments = Array.from(grouped.values())
      .map(g => ({ ...g, profit:g.income - g.expense }))
      .sort((a,b) => Math.abs(b.income + b.expense) - Math.abs(a.income + a.expense));

    return {
      year,
      tournaments,
      unlinked,
      linkedCount
    };
  }

  function emptyCard(message){
    const div = document.createElement("div");
    div.className = "pnx-step154-empty";
    div.textContent = message;
    return div;
  }

  function renderTournamentList(data){
    const list = get("pnx-step154-tournament-list");
    if (!list) return;
    list.innerHTML = "";

    if (!data.tournaments.length) {
      list.appendChild(emptyCard("大会に紐づいた取引はまだありません。"));
      return;
    }

    data.tournaments.slice(0, 12).forEach(item => {
      const card = document.createElement("article");
      card.className = "pnx-step154-tournament-card";
      card.innerHTML = `
        <div class="pnx-step154-tournament-title">
          <strong>${item.name}</strong>
          <span>${item.count}件</span>
        </div>
        <div class="pnx-step154-tournament-grid">
          <div><span>収入</span><strong class="blue">${yen(item.income)}</strong></div>
          <div><span>経費</span><strong class="red">${yen(item.expense)}</strong></div>
          <div><span>利益</span><strong class="${item.profit >= 0 ? "green" : "red"}">${yen(item.profit)}</strong></div>
        </div>
      `;
      list.appendChild(card);
    });
  }

  function renderUnlinkedList(data){
    const list = get("pnx-step154-unlinked-list");
    if (!list) return;
    list.innerHTML = "";

    if (!data.unlinked.length) {
      list.appendChild(emptyCard("未紐づけの取引はありません。"));
      return;
    }

    data.unlinked.slice(0, 6).forEach(item => {
      const row = document.createElement("div");
      row.className = "pnx-step154-unlinked-row";
      row.innerHTML = `
        <div>
          <strong>${txLabel(item.tx)}</strong>
          <span>${item.type === "income" ? "収入" : "支出"}</span>
        </div>
        <em class="${item.type === "income" ? "blue" : "red"}">${yen(item.amount)}</em>
      `;
      list.appendChild(row);
    });

    if (data.unlinked.length > 6) {
      const more = document.createElement("div");
      more.className = "pnx-step154-more";
      more.textContent = `ほか ${data.unlinked.length - 6}件`;
      list.appendChild(more);
    }
  }

  function render(){
    const data = collect();

    const linked = get("pnx-step154-linked-count");
    const unlinked = get("pnx-step154-unlinked-count");
    if (linked) linked.textContent = `${data.linkedCount}件`;
    if (unlinked) unlinked.textContent = `${data.unlinked.length}件`;

    renderTournamentList(data);
    renderUnlinkedList(data);

    window.__PNX_STEP154_LAST_DATA__ = {
      at:new Date().toISOString(),
      year:data.year,
      tournamentCount:data.tournaments.length,
      linkedCount:data.linkedCount,
      unlinkedCount:data.unlinked.length
    };

    return data;
  }

  function findFilingPanel(){
    return get("tab-filing") || document.querySelector('[data-tab-panel="filing"], .fin-panel[data-panel="filing"]');
  }

  function show(){
    render();

    const panel = findFilingPanel();
    const screen = get("pnx-step154-tournament-screen");
    const home = get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");
    if (!screen) return false;

    if (panel && screen.parentNode !== panel) {
      panel.insertBefore(screen, panel.firstElementChild);
    }

    if (home) home.classList.add("pnx-step154-hidden");
    screen.classList.add("is-open");
    screen.setAttribute("aria-hidden", "false");
    document.body.classList.add("pnx-step154-open-body");

    try { if (panel) panel.scrollTo({ top:0, behavior:"auto" }); } catch(e) {}

    window.__PNX_STEP154_LAST_OPEN__ = new Date().toISOString();
    return true;
  }

  function close(){
    const screen = get("pnx-step154-tournament-screen");
    const home = get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");

    if (screen) {
      screen.classList.remove("is-open");
      screen.setAttribute("aria-hidden", "true");
    }
    if (home) home.classList.remove("pnx-step154-hidden");
    document.body.classList.remove("pnx-step154-open-body");

    window.__PNX_STEP154_LAST_CLOSE__ = new Date().toISOString();
    return true;
  }

  function openTournamentLink(){
    const candidates = [
      "PNXStep146OpenTournamentLink",
      "PNXStep145OpenTournamentLink",
      "PNXStep138OpenTournamentLink",
      "openTournamentLinkSheet",
      "openTournamentLinkModal"
    ];

    for (const name of candidates) {
      try {
        if (typeof window[name] === "function") {
          window[name]();
          return true;
        }
      } catch(e) {}
    }

    const btn = Array.from(document.querySelectorAll("button, a, [role='button']")).find(el =>
      /大会と取引を紐づける|大会と紐づける/.test(text(el)) &&
      !el.closest("#pnx-step154-tournament-screen")
    );

    if (btn && btn.click) {
      btn.click();
      return true;
    }

    return false;
  }

  function markConfirmed(){
    localStorage.setItem(COMPLETE_KEY, "1");

    document.querySelectorAll('[data-step148-task="tournaments"]').forEach(row => {
      const circle = row.querySelector(".circle");
      const em = row.querySelector("em");
      if (circle) {
        circle.classList.remove("empty", "warn");
        circle.classList.add("done");
        circle.textContent = "✓";
      }
      if (em) {
        em.classList.remove("warn");
        em.classList.add("done");
        em.textContent = "完了";
      }
    });

    setTimeout(close, 420);
  }

  function bind(){
    const back = get("pnx-step154-tournament-back");
    if (back && !back.__pnxStep154Bound) {
      back.__pnxStep154Bound = true;
      back.addEventListener("click", function(e){
        e.preventDefault();
        close();
      }, true);
    }

    const link = get("pnx-step154-open-tournament-link");
    if (link && !link.__pnxStep154Bound) {
      link.__pnxStep154Bound = true;
      link.addEventListener("click", function(e){
        e.preventDefault();
        openTournamentLink();
      }, true);
    }

    const confirm = get("pnx-step154-confirm-tournament");
    if (confirm && !confirm.__pnxStep154Bound) {
      confirm.__pnxStep154Bound = true;
      confirm.addEventListener("click", function(e){
        e.preventDefault();
        markConfirmed();
      }, true);
    }
  }

  function isTournamentTask(el){
    if (!el) return false;
    if (el.matches && el.matches('[data-step148-task="tournaments"]')) return true;
    return /大会ごとの収支を確認|大会・収支整理|大会別の収入・経費/.test(text(el));
  }

  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest('[data-step148-task="tournaments"], button, a, [role="button"]');
    if (!trigger) return;
    if (!isTournamentTask(trigger)) return;
    if (!trigger.closest("#pnx-step148d-filing-top, #pnx-step148-filing-home, #pnx-step148-todo-list")) return;

    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    show();
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    bind();
    setTimeout(bind, 400);
    setTimeout(render, 1200);
  });

  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest('.fin-tab[data-tab="filing"], .fin-tab');
    if (!tab) return;
    setTimeout(function(){ bind(); render(); }, 160);
  }, true);

  window.addEventListener("pnx:finance:transactions-updated", function(){ setTimeout(render, 100); });
  window.addEventListener("storage", function(e){
    if (e.key === "PNX_FINANCE_TRANSACTIONS") setTimeout(render, 100);
  });

  window.PNXStep154OpenTournamentFinanceConfirmScreen = show;
  window.PNXStep154CloseTournamentFinanceConfirmScreen = close;
  window.PNXStep154RenderTournamentFinanceConfirmScreen = render;
  window.PNXStep154TournamentFinanceConfirmStatus = function(){
    const screen = get("pnx-step154-tournament-screen");
    return {
      step:154,
      screenExists:!!screen,
      screenOpen:!!(screen && screen.classList.contains("is-open")),
      confirmed:localStorage.getItem(COMPLETE_KEY) === "1",
      data:window.__PNX_STEP154_LAST_DATA__ || null,
      lastOpen:window.__PNX_STEP154_LAST_OPEN__ || null,
      note:"大会ごとの収支確認画面"
    };
  };
})();




/* ================================================================
   STEP154b: Tournament screen force fixed
   目的:
   - STEP2「大会ごとの収支を確認する」画面で
     「確認しました」の下に他の申告画面が見えないようにする
   - is-open だけで全面固定表示
   - 監視処理なし。開く/閉じる時の軽いclass切替のみ
   ================================================================ */
(function(){
  if (window.__PNX_STEP154B_TOURNAMENT_SCREEN_FORCE_FIXED__) return;
  window.__PNX_STEP154B_TOURNAMENT_SCREEN_FORCE_FIXED__ = true;

  function get(id){ return document.getElementById(id); }

  function apply(){
    const screen = get("pnx-step154-tournament-screen");
    if (!screen) return false;

    if (screen.classList.contains("is-open")) {
      document.body.classList.add("pnx-step154b-tournament-open");
      screen.classList.add("pnx-step154b-force-fixed");
      window.__PNX_STEP154B_LAST_APPLY__ = new Date().toISOString();
      return true;
    }

    clear();
    return false;
  }

  function clear(){
    const screen = get("pnx-step154-tournament-screen");
    document.body.classList.remove("pnx-step154b-tournament-open");
    if (screen) screen.classList.remove("pnx-step154b-force-fixed");
    window.__PNX_STEP154B_LAST_CLEAR__ = new Date().toISOString();
    return true;
  }

  const open0 = window.PNXStep154OpenTournamentFinanceConfirmScreen;
  if (typeof open0 === "function" && !open0.__pnxStep154bWrapped) {
    const wrapped = function(){
      const result = open0.apply(this, arguments);
      setTimeout(apply, 0);
      setTimeout(apply, 80);
      return result;
    };
    wrapped.__pnxStep154bWrapped = true;
    window.PNXStep154OpenTournamentFinanceConfirmScreen = wrapped;
  }

  const close0 = window.PNXStep154CloseTournamentFinanceConfirmScreen;
  if (typeof close0 === "function" && !close0.__pnxStep154bWrapped) {
    const wrappedClose = function(){
      const result = close0.apply(this, arguments);
      setTimeout(clear, 0);
      return result;
    };
    wrappedClose.__pnxStep154bWrapped = true;
    window.PNXStep154CloseTournamentFinanceConfirmScreen = wrappedClose;
  }

  document.addEventListener("click", function(e){
    const tournamentTask = e.target && e.target.closest && e.target.closest('[data-step148-task="tournaments"]');
    if (tournamentTask) {
      setTimeout(apply, 0);
      setTimeout(apply, 100);
      return;
    }

    const back = e.target && e.target.closest && e.target.closest("#pnx-step154-tournament-back");
    if (back) {
      setTimeout(clear, 80);
      return;
    }

    const confirm = e.target && e.target.closest && e.target.closest("#pnx-step154-confirm-tournament");
    if (confirm) {
      setTimeout(clear, 600);
      return;
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    clear();
  });

  window.PNXStep154bApplyTournamentForceFixed = apply;
  window.PNXStep154bClearTournamentForceFixed = clear;
  window.PNXStep154bTournamentScreenForceFixedStatus = function(){
    const screen = get("pnx-step154-tournament-screen");
    return {
      step:"154b",
      screenExists:!!screen,
      screenOpen:!!(screen && screen.classList.contains("is-open")),
      forceFixedClass:!!(screen && screen.classList.contains("pnx-step154b-force-fixed")),
      bodyOpen:document.body.classList.contains("pnx-step154b-tournament-open"),
      lastApply:window.__PNX_STEP154B_LAST_APPLY__ || null,
      lastClear:window.__PNX_STEP154B_LAST_CLEAR__ || null,
      note:"STEP2大会収支確認画面を単独前面表示し、確認しましたの下を見せない"
    };
  };
})();




/* ================================================================
   STEP155: Filing STEP3 expense category confirm screen
   目的:
   - やること一覧「経費を分類する」を押すと
     経費カテゴリ別・未分類経費の確認画面を表示
   ================================================================ */
(function(){
  if (window.__PNX_STEP155_EXPENSE_CATEGORY_CONFIRM__) return;
  window.__PNX_STEP155_EXPENSE_CATEGORY_CONFIRM__ = true;

  const COMPLETE_KEY = "PNX_FILING_STEP155_EXPENSE_CONFIRMED";

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }
  function yen(n){ return "¥" + Number(n || 0).toLocaleString("ja-JP"); }

  function readTxs(){
    try {
      if (typeof window.PNXStep138gGetAllFinanceTransactions === "function") {
        return window.PNXStep138gGetAllFinanceTransactions() || [];
      }
    } catch(e) {}
    try {
      const list = JSON.parse(localStorage.getItem("PNX_FINANCE_TRANSACTIONS") || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function currentYear(){
    const y = get("pnx-step142-year");
    return Number(y && y.value) || new Date().getFullYear();
  }

  function txYear(tx){
    const raw = String((tx && (tx.date || tx.startDate || tx.createdAt)) || "");
    const y = Number(raw.slice(0,4));
    return y || currentYear();
  }

  function txAmount(tx){
    return Math.abs(Number(tx && (tx.amount || tx.value || tx.price || 0)) || 0);
  }

  function txType(tx){
    const t = String((tx && (tx.type || tx.kind || tx.flow || tx.side)) || "").toLowerCase();
    if (t.includes("income") || t.includes("revenue") || t === "in") return "income";
    if (tx && tx.income === true) return "income";
    return "expense";
  }

  function categoryName(tx){
    const raw = String((tx && (tx.category || tx.categoryName || tx.expenseCategory || tx.taxCategory || tx.accountItem || "")) || "").trim();
    if (!raw) return "";
    if (/未分類|未設定|その他未設定|分類なし|unclassified/i.test(raw)) return "";
    return raw;
  }

  function txLabel(tx){
    return String(tx.name || tx.title || tx.memo || tx.description || tx.category || "経費").trim();
  }

  function collect(){
    const year = currentYear();
    const grouped = new Map();
    const unclassified = [];
    let classifiedCount = 0;

    readTxs().forEach(tx => {
      if (txYear(tx) !== year) return;
      if (txType(tx) !== "expense") return;

      const amount = txAmount(tx);
      if (!amount) return;

      const cat = categoryName(tx);
      if (!cat) {
        unclassified.push({ tx, amount });
        return;
      }

      if (!grouped.has(cat)) grouped.set(cat, { name:cat, total:0, count:0 });
      const g = grouped.get(cat);
      g.total += amount;
      g.count += 1;
      classifiedCount += 1;
    });

    const categories = Array.from(grouped.values()).sort((a,b) => b.total - a.total);

    return { year, categories, unclassified, classifiedCount };
  }

  function emptyCard(message){
    const div = document.createElement("div");
    div.className = "pnx-step155-empty";
    div.textContent = message;
    return div;
  }

  function renderCategories(data){
    const list = get("pnx-step155-category-list");
    if (!list) return;
    list.innerHTML = "";

    if (!data.categories.length) {
      list.appendChild(emptyCard("分類済みの経費はまだありません。"));
      return;
    }

    data.categories.slice(0, 12).forEach(item => {
      const row = document.createElement("article");
      row.className = "pnx-step155-category-row";
      row.innerHTML = `
        <div>
          <strong>${item.name}</strong>
          <span>${item.count}件</span>
        </div>
        <em>${yen(item.total)}</em>
      `;
      list.appendChild(row);
    });
  }

  function renderUnclassified(data){
    const list = get("pnx-step155-unclassified-list");
    if (!list) return;
    list.innerHTML = "";

    if (!data.unclassified.length) {
      list.appendChild(emptyCard("未分類の経費はありません。"));
      return;
    }

    data.unclassified.slice(0, 8).forEach(item => {
      const row = document.createElement("div");
      row.className = "pnx-step155-unclassified-row";
      row.innerHTML = `
        <div>
          <strong>${txLabel(item.tx)}</strong>
          <span>カテゴリ未設定</span>
        </div>
        <em>${yen(item.amount)}</em>
      `;
      list.appendChild(row);
    });

    if (data.unclassified.length > 8) {
      const more = document.createElement("div");
      more.className = "pnx-step155-more";
      more.textContent = `ほか ${data.unclassified.length - 8}件`;
      list.appendChild(more);
    }
  }

  function render(){
    const data = collect();

    const classified = get("pnx-step155-classified-count");
    const unclassified = get("pnx-step155-unclassified-count");
    if (classified) classified.textContent = `${data.classifiedCount}件`;
    if (unclassified) unclassified.textContent = `${data.unclassified.length}件`;

    renderCategories(data);
    renderUnclassified(data);

    window.__PNX_STEP155_LAST_DATA__ = {
      at:new Date().toISOString(),
      year:data.year,
      categoryCount:data.categories.length,
      classifiedCount:data.classifiedCount,
      unclassifiedCount:data.unclassified.length
    };

    return data;
  }

  function findFilingPanel(){
    return get("tab-filing") || document.querySelector('[data-tab-panel="filing"], .fin-panel[data-panel="filing"]');
  }

  function show(){
    render();

    const panel = findFilingPanel();
    const screen = get("pnx-step155-expense-screen");
    const home = get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");
    if (!screen) return false;

    if (panel && screen.parentNode !== panel) {
      panel.insertBefore(screen, panel.firstElementChild);
    }

    if (home) home.classList.add("pnx-step155-hidden");
    screen.classList.add("is-open");
    screen.setAttribute("aria-hidden", "false");
    document.body.classList.add("pnx-step155-open-body");

    try { if (panel) panel.scrollTo({ top:0, behavior:"auto" }); } catch(e) {}

    window.__PNX_STEP155_LAST_OPEN__ = new Date().toISOString();
    return true;
  }

  function close(){
    const screen = get("pnx-step155-expense-screen");
    const home = get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");

    if (screen) {
      screen.classList.remove("is-open");
      screen.setAttribute("aria-hidden", "true");
    }
    if (home) home.classList.remove("pnx-step155-hidden");
    document.body.classList.remove("pnx-step155-open-body");

    window.__PNX_STEP155_LAST_CLOSE__ = new Date().toISOString();
    return true;
  }

  function openExpenseInput(){
    const add = get("btn-add-tx") || document.querySelector("[data-add-transaction], .add-btn-fixed, .modal-add-btn");
    if (add) {
      add.click();
      setTimeout(function(){
        const expenseType = document.querySelector(".type-btn[data-type='expense'], [data-type='expense'], .type-expense");
        if (expenseType && expenseType.click) expenseType.click();
      }, 160);
      return true;
    }
    return false;
  }

  function markConfirmed(){
    localStorage.setItem(COMPLETE_KEY, "1");

    document.querySelectorAll('[data-step148-task="categories"]').forEach(row => {
      const circle = row.querySelector(".circle");
      const em = row.querySelector("em");
      if (circle) {
        circle.classList.remove("empty", "warn");
        circle.classList.add("done");
        circle.textContent = "✓";
      }
      if (em) {
        em.classList.remove("warn");
        em.classList.add("done");
        em.textContent = "完了";
      }
    });

    setTimeout(close, 420);
  }

  function bind(){
    const back = get("pnx-step155-expense-back");
    if (back && !back.__pnxStep155Bound) {
      back.__pnxStep155Bound = true;
      back.addEventListener("click", function(e){
        e.preventDefault();
        close();
      }, true);
    }

    const input = get("pnx-step155-open-expense-input");
    if (input && !input.__pnxStep155Bound) {
      input.__pnxStep155Bound = true;
      input.addEventListener("click", function(e){
        e.preventDefault();
        openExpenseInput();
      }, true);
    }

    const confirm = get("pnx-step155-confirm-expense");
    if (confirm && !confirm.__pnxStep155Bound) {
      confirm.__pnxStep155Bound = true;
      confirm.addEventListener("click", function(e){
        e.preventDefault();
        markConfirmed();
      }, true);
    }
  }

  function isExpenseTask(el){
    if (!el) return false;
    if (el.matches && el.matches('[data-step148-task="categories"]')) return true;
    return /経費を分類する|経費の分類|交通費・宿泊費/.test(text(el));
  }

  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest('[data-step148-task="categories"], button, a, [role="button"]');
    if (!trigger) return;
    if (!isExpenseTask(trigger)) return;
    if (!trigger.closest("#pnx-step148d-filing-top, #pnx-step148-filing-home, #pnx-step148-todo-list")) return;

    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    show();
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    bind();
    setTimeout(bind, 400);
    setTimeout(render, 1200);
  });

  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest('.fin-tab[data-tab="filing"], .fin-tab');
    if (!tab) return;
    setTimeout(function(){ bind(); render(); }, 160);
  }, true);

  window.addEventListener("pnx:finance:transactions-updated", function(){ setTimeout(render, 100); });
  window.addEventListener("storage", function(e){
    if (e.key === "PNX_FINANCE_TRANSACTIONS") setTimeout(render, 100);
  });

  window.PNXStep155OpenExpenseCategoryConfirmScreen = show;
  window.PNXStep155CloseExpenseCategoryConfirmScreen = close;
  window.PNXStep155RenderExpenseCategoryConfirmScreen = render;
  window.PNXStep155ExpenseCategoryConfirmStatus = function(){
    const screen = get("pnx-step155-expense-screen");
    return {
      step:155,
      screenExists:!!screen,
      screenOpen:!!(screen && screen.classList.contains("is-open")),
      confirmed:localStorage.getItem(COMPLETE_KEY) === "1",
      data:window.__PNX_STEP155_LAST_DATA__ || null,
      lastOpen:window.__PNX_STEP155_LAST_OPEN__ || null,
      note:"経費分類確認画面"
    };
  };
})();




/* ================================================================
   STEP156: Filing STEP4 receipt confirm screen
   目的:
   - やること一覧「レシート・領収書をそろえる」を押すと
     不足している証憑・添付済み証憑の確認画面を表示
   ================================================================ */
(function(){
  if (window.__PNX_STEP156_RECEIPT_CONFIRM__) return;
  window.__PNX_STEP156_RECEIPT_CONFIRM__ = true;

  const COMPLETE_KEY = "PNX_FILING_STEP156_RECEIPT_CONFIRMED";

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }
  function yen(n){ return "¥" + Number(n || 0).toLocaleString("ja-JP"); }

  function readTxs(){
    try {
      if (typeof window.PNXStep138gGetAllFinanceTransactions === "function") {
        return window.PNXStep138gGetAllFinanceTransactions() || [];
      }
    } catch(e) {}
    try {
      const list = JSON.parse(localStorage.getItem("PNX_FINANCE_TRANSACTIONS") || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function currentYear(){
    const y = get("pnx-step142-year");
    return Number(y && y.value) || new Date().getFullYear();
  }

  function txYear(tx){
    const raw = String((tx && (tx.date || tx.startDate || tx.createdAt)) || "");
    const y = Number(raw.slice(0,4));
    return y || currentYear();
  }

  function txAmount(tx){
    return Math.abs(Number(tx && (tx.amount || tx.value || tx.price || 0)) || 0);
  }

  function txType(tx){
    const t = String((tx && (tx.type || tx.kind || tx.flow || tx.side)) || "").toLowerCase();
    if (t.includes("income") || t.includes("revenue") || t === "in") return "income";
    if (tx && tx.income === true) return "income";
    return "expense";
  }

  function hasReceipt(tx){
    if (!tx) return false;
    if (tx.hasReceipt === true || tx.receiptAttached === true || tx.attachment === true) return true;
    const fields = [
      tx.receiptUrl,
      tx.receiptImage,
      tx.receiptImageUrl,
      tx.imageUrl,
      tx.fileUrl,
      tx.attachmentUrl,
      tx.photoUrl,
      tx.scanUrl,
      tx.receiptId,
      tx.attachmentId
    ];
    if (fields.some(v => String(v || "").trim())) return true;
    if (Array.isArray(tx.receipts) && tx.receipts.length) return true;
    if (Array.isArray(tx.attachments) && tx.attachments.length) return true;
    if (tx.receipt && typeof tx.receipt === "object") return true;
    return false;
  }

  function txLabel(tx){
    return String(tx.name || tx.title || tx.memo || tx.description || tx.category || "経費").trim();
  }

  function txCategory(tx){
    return String(tx.category || tx.categoryName || tx.expenseCategory || tx.taxCategory || "未分類").trim();
  }

  function collect(){
    const year = currentYear();
    const attached = [];
    const missing = [];

    readTxs().forEach(tx => {
      if (txYear(tx) !== year) return;
      if (txType(tx) !== "expense") return;

      const amount = txAmount(tx);
      if (!amount) return;

      const item = { tx, amount, label:txLabel(tx), category:txCategory(tx) };

      if (hasReceipt(tx)) attached.push(item);
      else missing.push(item);
    });

    missing.sort((a,b) => b.amount - a.amount);
    attached.sort((a,b) => b.amount - a.amount);

    return { year, attached, missing };
  }

  function emptyCard(message){
    const div = document.createElement("div");
    div.className = "pnx-step156-empty";
    div.textContent = message;
    return div;
  }

  function renderList(id, list, emptyMessage, kind){
    const wrap = get(id);
    if (!wrap) return;
    wrap.innerHTML = "";

    if (!list.length) {
      wrap.appendChild(emptyCard(emptyMessage));
      return;
    }

    list.slice(0, kind === "missing" ? 8 : 6).forEach(item => {
      const row = document.createElement("div");
      row.className = "pnx-step156-receipt-row " + (kind === "missing" ? "is-missing" : "is-attached");
      row.innerHTML = `
        <div class="pnx-step156-receipt-main">
          <strong>${item.label}</strong>
          <span>${item.category}</span>
        </div>
        <div class="pnx-step156-receipt-side">
          <em>${yen(item.amount)}</em>
          <small>${kind === "missing" ? "未添付" : "添付済み"}</small>
        </div>
      `;
      wrap.appendChild(row);
    });

    const limit = kind === "missing" ? 8 : 6;
    if (list.length > limit) {
      const more = document.createElement("div");
      more.className = "pnx-step156-more";
      more.textContent = `ほか ${list.length - limit}件`;
      wrap.appendChild(more);
    }
  }

  function render(){
    const data = collect();

    const attachedCount = get("pnx-step156-attached-count");
    const missingCount = get("pnx-step156-missing-count");
    if (attachedCount) attachedCount.textContent = `${data.attached.length}件`;
    if (missingCount) missingCount.textContent = `${data.missing.length}件`;

    renderList("pnx-step156-missing-list", data.missing, "不足しているレシート・領収書はありません。", "missing");
    renderList("pnx-step156-attached-list", data.attached, "証憑が添付されている経費はまだありません。", "attached");

    window.__PNX_STEP156_LAST_DATA__ = {
      at:new Date().toISOString(),
      year:data.year,
      attachedCount:data.attached.length,
      missingCount:data.missing.length
    };

    return data;
  }

  function findFilingPanel(){
    return get("tab-filing") || document.querySelector('[data-tab-panel="filing"], .fin-panel[data-panel="filing"]');
  }

  function show(){
    render();

    const panel = findFilingPanel();
    const screen = get("pnx-step156-receipt-screen");
    const home = get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");
    if (!screen) return false;

    if (panel && screen.parentNode !== panel) {
      panel.insertBefore(screen, panel.firstElementChild);
    }

    if (home) home.classList.add("pnx-step156-hidden");
    screen.classList.add("is-open");
    screen.setAttribute("aria-hidden", "false");
    document.body.classList.add("pnx-step156-open-body");

    try { if (panel) panel.scrollTo({ top:0, behavior:"auto" }); } catch(e) {}

    window.__PNX_STEP156_LAST_OPEN__ = new Date().toISOString();
    return true;
  }

  function close(){
    const screen = get("pnx-step156-receipt-screen");
    const home = get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");

    if (screen) {
      screen.classList.remove("is-open");
      screen.setAttribute("aria-hidden", "true");
    }
    if (home) home.classList.remove("pnx-step156-hidden");
    document.body.classList.remove("pnx-step156-open-body");

    window.__PNX_STEP156_LAST_CLOSE__ = new Date().toISOString();
    return true;
  }

  function openReceiptInput(){
    const candidates = [
      "PNXStep147OpenReceiptScan",
      "PNXStep146OpenReceiptScan",
      "openReceiptScan",
      "openReceiptModal",
      "openReceiptInput",
      "openScanModal"
    ];
    for (const name of candidates) {
      try {
        if (typeof window[name] === "function") {
          window[name]();
          return true;
        }
      } catch(e) {}
    }

    const btn = Array.from(document.querySelectorAll("button, a, [role='button']")).find(el =>
      /レシート|領収書|撮影|スキャン/.test(text(el)) &&
      !el.closest("#pnx-step156-receipt-screen")
    );
    if (btn && btn.click) {
      btn.click();
      return true;
    }

    const add = get("btn-add-tx") || document.querySelector("[data-add-transaction], .add-btn-fixed, .modal-add-btn");
    if (add) {
      add.click();
      return true;
    }
    return false;
  }

  function markConfirmed(){
    localStorage.setItem(COMPLETE_KEY, "1");

    document.querySelectorAll('[data-step148-task="receipts"]').forEach(row => {
      const circle = row.querySelector(".circle");
      const em = row.querySelector("em");
      if (circle) {
        circle.classList.remove("empty", "warn");
        circle.classList.add("done");
        circle.textContent = "✓";
      }
      if (em) {
        em.classList.remove("warn");
        em.classList.add("done");
        em.textContent = "完了";
      }
    });

    setTimeout(close, 420);
  }

  function bind(){
    const back = get("pnx-step156-receipt-back");
    if (back && !back.__pnxStep156Bound) {
      back.__pnxStep156Bound = true;
      back.addEventListener("click", function(e){
        e.preventDefault();
        close();
      }, true);
    }

    const input = get("pnx-step156-open-receipt-input");
    if (input && !input.__pnxStep156Bound) {
      input.__pnxStep156Bound = true;
      input.addEventListener("click", function(e){
        e.preventDefault();
        openReceiptInput();
      }, true);
    }

    const confirm = get("pnx-step156-confirm-receipt");
    if (confirm && !confirm.__pnxStep156Bound) {
      confirm.__pnxStep156Bound = true;
      confirm.addEventListener("click", function(e){
        e.preventDefault();
        markConfirmed();
      }, true);
    }
  }

  function isReceiptTask(el){
    if (!el) return false;
    if (el.matches && el.matches('[data-step148-task="receipts"]')) return true;
    return /レシート・領収書をそろえる|レシートの確認|不足している証憑/.test(text(el));
  }

  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest('[data-step148-task="receipts"], button, a, [role="button"]');
    if (!trigger) return;
    if (!isReceiptTask(trigger)) return;
    if (!trigger.closest("#pnx-step148d-filing-top, #pnx-step148-filing-home, #pnx-step148-todo-list")) return;

    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    show();
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    bind();
    setTimeout(bind, 400);
    setTimeout(render, 1200);
  });

  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest('.fin-tab[data-tab="filing"], .fin-tab');
    if (!tab) return;
    setTimeout(function(){ bind(); render(); }, 160);
  }, true);

  window.addEventListener("pnx:finance:transactions-updated", function(){ setTimeout(render, 100); });
  window.addEventListener("storage", function(e){
    if (e.key === "PNX_FINANCE_TRANSACTIONS") setTimeout(render, 100);
  });

  window.PNXStep156OpenReceiptConfirmScreen = show;
  window.PNXStep156CloseReceiptConfirmScreen = close;
  window.PNXStep156RenderReceiptConfirmScreen = render;
  window.PNXStep156ReceiptConfirmStatus = function(){
    const screen = get("pnx-step156-receipt-screen");
    return {
      step:156,
      screenExists:!!screen,
      screenOpen:!!(screen && screen.classList.contains("is-open")),
      confirmed:localStorage.getItem(COMPLETE_KEY) === "1",
      data:window.__PNX_STEP156_LAST_DATA__ || null,
      lastOpen:window.__PNX_STEP156_LAST_OPEN__ || null,
      note:"レシート・領収書確認画面"
    };
  };
})();




/* ================================================================
   STEP157: Filing STEP5 rent allocation confirm screen
   目的:
   - やること一覧「家賃按分を確認する」を押すと
     家賃・事務所・作業部屋などの按分確認画面を表示
   ================================================================ */
(function(){
  if (window.__PNX_STEP157_RENT_ALLOCATION_CONFIRM__) return;
  window.__PNX_STEP157_RENT_ALLOCATION_CONFIRM__ = true;

  const COMPLETE_KEY = "PNX_FILING_STEP157_RENT_CONFIRMED";
  const RATE_KEY = "PNX_RENT_ALLOCATION_RATE";

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }
  function yen(n){ return "¥" + Number(n || 0).toLocaleString("ja-JP"); }

  function readTxs(){
    try {
      if (typeof window.PNXStep138gGetAllFinanceTransactions === "function") {
        return window.PNXStep138gGetAllFinanceTransactions() || [];
      }
    } catch(e) {}
    try {
      const list = JSON.parse(localStorage.getItem("PNX_FINANCE_TRANSACTIONS") || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function currentYear(){
    const y = get("pnx-step142-year");
    return Number(y && y.value) || new Date().getFullYear();
  }

  function txYear(tx){
    const raw = String((tx && (tx.date || tx.startDate || tx.createdAt)) || "");
    const y = Number(raw.slice(0,4));
    return y || currentYear();
  }

  function txAmount(tx){
    return Math.abs(Number(tx && (tx.amount || tx.value || tx.price || 0)) || 0);
  }

  function txType(tx){
    const t = String((tx && (tx.type || tx.kind || tx.flow || tx.side)) || "").toLowerCase();
    if (t.includes("income") || t.includes("revenue") || t === "in") return "income";
    if (tx && tx.income === true) return "income";
    return "expense";
  }

  function isRentLike(tx){
    const src = [
      tx && tx.name,
      tx && tx.title,
      tx && tx.memo,
      tx && tx.description,
      tx && tx.category,
      tx && tx.categoryName,
      tx && tx.expenseCategory,
      tx && tx.taxCategory,
      tx && tx.accountItem
    ].map(v => String(v || "")).join(" ");
    return /家賃|賃料|事務所|作業部屋|オフィス|自宅|按分|rent|office/i.test(src);
  }

  function txLabel(tx){
    return String(tx.name || tx.title || tx.memo || tx.description || tx.category || "家賃・事務所関連").trim();
  }

  function txCategory(tx){
    return String(tx.category || tx.categoryName || tx.expenseCategory || tx.taxCategory || "家賃・地代").trim();
  }

  function readRate(){
    const candidates = [
      localStorage.getItem(RATE_KEY),
      localStorage.getItem("PNX_FINANCE_RENT_RATE"),
      localStorage.getItem("PNX_TAX_RENT_ALLOCATION_RATE")
    ];
    const raw = candidates.find(v => v !== null && v !== undefined && String(v).trim() !== "");
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return 0;
    if (n > 1 && n <= 100) return n / 100;
    if (n > 0 && n <= 1) return n;
    return 0;
  }

  function collect(){
    const year = currentYear();
    const rate = readRate();
    const items = [];

    readTxs().forEach(tx => {
      if (txYear(tx) !== year) return;
      if (txType(tx) !== "expense") return;
      if (!isRentLike(tx)) return;

      const amount = txAmount(tx);
      if (!amount) return;

      items.push({
        tx,
        amount,
        deductible: rate ? Math.round(amount * rate) : 0,
        label: txLabel(tx),
        category: txCategory(tx)
      });
    });

    items.sort((a,b) => b.amount - a.amount);
    const total = items.reduce((sum, item) => sum + item.deductible, 0);

    return { year, rate, items, total };
  }

  function emptyCard(message){
    const div = document.createElement("div");
    div.className = "pnx-step157-empty";
    div.textContent = message;
    return div;
  }

  function renderList(data){
    const list = get("pnx-step157-rent-list");
    if (!list) return;
    list.innerHTML = "";

    if (!data.items.length) {
      list.appendChild(emptyCard("家賃按分の対象になりそうな支出はまだありません。"));
      return;
    }

    data.items.slice(0, 10).forEach(item => {
      const row = document.createElement("div");
      row.className = "pnx-step157-rent-row";
      row.innerHTML = `
        <div class="pnx-step157-rent-main">
          <strong>${item.label}</strong>
          <span>${item.category}</span>
        </div>
        <div class="pnx-step157-rent-side">
          <em>${yen(item.amount)}</em>
          <small>${data.rate ? "経費 " + yen(item.deductible) : "按分率未設定"}</small>
        </div>
      `;
      list.appendChild(row);
    });

    if (data.items.length > 10) {
      const more = document.createElement("div");
      more.className = "pnx-step157-more";
      more.textContent = `ほか ${data.items.length - 10}件`;
      list.appendChild(more);
    }
  }

  function render(){
    const data = collect();

    const count = get("pnx-step157-rent-count");
    const total = get("pnx-step157-deductible-total");
    const rateLabel = get("pnx-step157-rate-label");
    const rateNote = get("pnx-step157-rate-note");

    if (count) count.textContent = `${data.items.length}件`;
    if (total) total.textContent = data.rate ? yen(data.total) : "未設定";
    if (rateLabel) rateLabel.textContent = data.rate ? `${Math.round(data.rate * 100)}%` : "未設定";
    if (rateNote) {
      rateNote.textContent = data.rate
        ? `家賃・事務所関連の支出のうち、${Math.round(data.rate * 100)}%を経費として計算しています。`
        : "該当する場合は、事業で使っている割合を設定してください。";
    }

    renderList(data);

    window.__PNX_STEP157_LAST_DATA__ = {
      at:new Date().toISOString(),
      year:data.year,
      rate:data.rate,
      itemCount:data.items.length,
      deductibleTotal:data.total
    };

    return data;
  }

  function findFilingPanel(){
    return get("tab-filing") || document.querySelector('[data-tab-panel="filing"], .fin-panel[data-panel="filing"]');
  }

  function show(){
    render();

    const panel = findFilingPanel();
    const screen = get("pnx-step157-rent-screen");
    const home = get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");
    if (!screen) return false;

    if (panel && screen.parentNode !== panel) {
      panel.insertBefore(screen, panel.firstElementChild);
    }

    if (home) home.classList.add("pnx-step157-hidden");
    screen.classList.add("is-open");
    screen.setAttribute("aria-hidden", "false");
    document.body.classList.add("pnx-step157-open-body");

    try { if (panel) panel.scrollTo({ top:0, behavior:"auto" }); } catch(e) {}

    window.__PNX_STEP157_LAST_OPEN__ = new Date().toISOString();
    return true;
  }

  function close(){
    const screen = get("pnx-step157-rent-screen");
    const home = get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");

    if (screen) {
      screen.classList.remove("is-open");
      screen.setAttribute("aria-hidden", "true");
    }
    if (home) home.classList.remove("pnx-step157-hidden");
    document.body.classList.remove("pnx-step157-open-body");

    window.__PNX_STEP157_LAST_CLOSE__ = new Date().toISOString();
    return true;
  }

  function openRateSetting(){
    const current = readRate();
    const defaultValue = current ? Math.round(current * 100) : 20;
    const answer = window.prompt("家賃按分率を入力してください（例：20）", String(defaultValue));
    if (answer === null) return false;

    const n = Number(String(answer).replace(/[％%]/g, "").trim());
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      window.alert("0〜100の数字で入力してください。");
      return false;
    }

    localStorage.setItem(RATE_KEY, String(n / 100));
    render();
    return true;
  }

  function markConfirmed(){
    localStorage.setItem(COMPLETE_KEY, "1");

    document.querySelectorAll('[data-step148-task="rent"]').forEach(row => {
      const circle = row.querySelector(".circle");
      const em = row.querySelector("em");
      if (circle) {
        circle.classList.remove("empty", "warn");
        circle.classList.add("done");
        circle.textContent = "✓";
      }
      if (em) {
        em.classList.remove("warn");
        em.classList.add("done");
        em.textContent = "完了";
      }
    });

    setTimeout(close, 420);
  }

  function bind(){
    const back = get("pnx-step157-rent-back");
    if (back && !back.__pnxStep157Bound) {
      back.__pnxStep157Bound = true;
      back.addEventListener("click", function(e){
        e.preventDefault();
        close();
      }, true);
    }

    const setting = get("pnx-step157-open-rent-setting");
    if (setting && !setting.__pnxStep157Bound) {
      setting.__pnxStep157Bound = true;
      setting.addEventListener("click", function(e){
        e.preventDefault();
        openRateSetting();
      }, true);
    }

    const confirm = get("pnx-step157-confirm-rent");
    if (confirm && !confirm.__pnxStep157Bound) {
      confirm.__pnxStep157Bound = true;
      confirm.addEventListener("click", function(e){
        e.preventDefault();
        markConfirmed();
      }, true);
    }
  }

  function isRentTask(el){
    if (!el) return false;
    if (el.matches && el.matches('[data-step148-task="rent"]')) return true;
    return /家賃按分を確認する|家賃按分|該当する場合/.test(text(el));
  }

  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest('[data-step148-task="rent"], button, a, [role="button"]');
    if (!trigger) return;
    if (!isRentTask(trigger)) return;
    if (!trigger.closest("#pnx-step148d-filing-top, #pnx-step148-filing-home, #pnx-step148-todo-list")) return;

    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    show();
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    bind();
    setTimeout(bind, 400);
    setTimeout(render, 1200);
  });

  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest('.fin-tab[data-tab="filing"], .fin-tab');
    if (!tab) return;
    setTimeout(function(){ bind(); render(); }, 160);
  }, true);

  window.addEventListener("pnx:finance:transactions-updated", function(){ setTimeout(render, 100); });
  window.addEventListener("storage", function(e){
    if (e.key === "PNX_FINANCE_TRANSACTIONS" || e.key === RATE_KEY) setTimeout(render, 100);
  });

  window.PNXStep157OpenRentAllocationConfirmScreen = show;
  window.PNXStep157CloseRentAllocationConfirmScreen = close;
  window.PNXStep157RenderRentAllocationConfirmScreen = render;
  window.PNXStep157RentAllocationConfirmStatus = function(){
    const screen = get("pnx-step157-rent-screen");
    return {
      step:157,
      screenExists:!!screen,
      screenOpen:!!(screen && screen.classList.contains("is-open")),
      confirmed:localStorage.getItem(COMPLETE_KEY) === "1",
      data:window.__PNX_STEP157_LAST_DATA__ || null,
      lastOpen:window.__PNX_STEP157_LAST_OPEN__ || null,
      note:"家賃按分確認画面"
    };
  };
})();




/* ================================================================
   STEP158: Filing STEP6 tax advisor share screen
   目的:
   - やること一覧「税理士へ共有する」と下部CTAから
     税理士共有の詳細画面を表示
   ================================================================ */
(function(){
  if (window.__PNX_STEP158_TAX_ADVISOR_SHARE__) return;
  window.__PNX_STEP158_TAX_ADVISOR_SHARE__ = true;

  const COMPLETE_KEY = "PNX_FILING_STEP158_SHARE_CONFIRMED";

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }
  function yen(n){ return "¥" + Number(n || 0).toLocaleString("ja-JP"); }

  function readTxs(){
    try {
      if (typeof window.PNXStep138gGetAllFinanceTransactions === "function") {
        return window.PNXStep138gGetAllFinanceTransactions() || [];
      }
    } catch(e) {}
    try {
      const list = JSON.parse(localStorage.getItem("PNX_FINANCE_TRANSACTIONS") || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function currentYear(){
    const y = get("pnx-step142-year");
    return Number(y && y.value) || new Date().getFullYear();
  }

  function txYear(tx){
    const raw = String((tx && (tx.date || tx.startDate || tx.createdAt)) || "");
    const y = Number(raw.slice(0,4));
    return y || currentYear();
  }

  function txAmount(tx){
    return Math.abs(Number(tx && (tx.amount || tx.value || tx.price || 0)) || 0);
  }

  function txType(tx){
    const t = String((tx && (tx.type || tx.kind || tx.flow || tx.side)) || "").toLowerCase();
    if (t.includes("income") || t.includes("revenue") || t === "in") return "income";
    if (tx && tx.income === true) return "income";
    return "expense";
  }

  function hasReceipt(tx){
    if (!tx) return false;
    if (tx.hasReceipt === true || tx.receiptAttached === true || tx.attachment === true) return true;
    if (Array.isArray(tx.receipts) && tx.receipts.length) return true;
    if (Array.isArray(tx.attachments) && tx.attachments.length) return true;
    const fields = [tx.receiptUrl, tx.receiptImage, tx.receiptImageUrl, tx.fileUrl, tx.attachmentUrl, tx.photoUrl, tx.scanUrl, tx.receiptId, tx.attachmentId];
    return fields.some(v => String(v || "").trim());
  }

  function tournamentName(tx){
    if (!tx) return "";
    const vals = [tx.tournamentName, tx.tournamentTitle, tx.eventName, tx.eventTitle, tx.tournamentLabel, tx.relatedTournament];
    if (tx.tournament && typeof tx.tournament === "object") vals.unshift(tx.tournament.title, tx.tournament.name);
    return vals.map(v => String(v || "").trim()).find(Boolean) || "";
  }

  function collect(){
    const year = currentYear();
    let incomeTotal = 0;
    let expenseTotal = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    let receiptMissing = 0;
    let tournamentLinked = 0;

    readTxs().forEach(tx => {
      if (txYear(tx) !== year) return;
      const amount = txAmount(tx);
      if (!amount) return;

      if (txType(tx) === "income") {
        incomeTotal += amount;
        incomeCount += 1;
      } else {
        expenseTotal += amount;
        expenseCount += 1;
        if (!hasReceipt(tx)) receiptMissing += 1;
      }

      if (tournamentName(tx)) tournamentLinked += 1;
    });

    const confirmed = {
      income: localStorage.getItem("PNX_FILING_STEP150_INCOME_CONFIRMED") === "1",
      tournament: localStorage.getItem("PNX_FILING_STEP154_TOURNAMENT_CONFIRMED") === "1",
      expense: localStorage.getItem("PNX_FILING_STEP155_EXPENSE_CONFIRMED") === "1",
      receipt: localStorage.getItem("PNX_FILING_STEP156_RECEIPT_CONFIRMED") === "1",
      rent: localStorage.getItem("PNX_FILING_STEP157_RENT_CONFIRMED") === "1"
    };

    return {
      year,
      incomeTotal,
      expenseTotal,
      profit: incomeTotal - expenseTotal,
      incomeCount,
      expenseCount,
      receiptMissing,
      tournamentLinked,
      confirmed
    };
  }

  function item(label, value, ok){
    return { label, value, ok };
  }

  function renderShareList(data){
    const list = get("pnx-step158-share-list");
    if (!list) return;

    const items = [
      item("収入一覧", `${data.incomeCount}件 / ${yen(data.incomeTotal)}`, data.incomeCount > 0),
      item("経費一覧", `${data.expenseCount}件 / ${yen(data.expenseTotal)}`, data.expenseCount > 0),
      item("大会別収支", `${data.tournamentLinked}件 紐づけ済み`, data.tournamentLinked > 0),
      item("レシート一覧", data.receiptMissing ? `不足 ${data.receiptMissing}件` : "不足なし", data.receiptMissing === 0),
      item("申告書類PDF/CSV", "作成画面で確認", true)
    ];

    list.innerHTML = "";
    items.forEach(it => {
      const row = document.createElement("div");
      row.className = "pnx-step158-share-row " + (it.ok ? "is-ok" : "is-warn");
      row.innerHTML = `
        <span>${it.ok ? "✓" : "!"}</span>
        <div>
          <strong>${it.label}</strong>
          <small>${it.value}</small>
        </div>
      `;
      list.appendChild(row);
    });

    const ready = items.filter(it => it.ok).length;
    const count = get("pnx-step158-ready-count");
    if (count) count.textContent = `${ready}/${items.length}`;
  }

  function renderCheckList(data){
    const list = get("pnx-step158-check-list");
    if (!list) return;

    const items = [
      item("収入確認済み", "賞金・スポンサー料など", data.confirmed.income),
      item("大会収支確認済み", "大会別の収入・経費", data.confirmed.tournament),
      item("経費分類済み", "交通費・宿泊費など", data.confirmed.expense),
      item("レシート確認済み", "不足している証憑", data.confirmed.receipt),
      item("家賃按分確認済み", "該当する場合のみ", data.confirmed.rent)
    ];

    list.innerHTML = "";
    items.forEach(it => {
      const row = document.createElement("div");
      row.className = "pnx-step158-check-row " + (it.ok ? "is-ok" : "is-warn");
      row.innerHTML = `
        <span>${it.ok ? "✓" : "未"}</span>
        <div>
          <strong>${it.label}</strong>
          <small>${it.value}</small>
        </div>
      `;
      list.appendChild(row);
    });
  }

  function makeMemo(data){
    const checks = data.confirmed;
    return [
      `ProNexaX 申告準備共有メモ（${data.year}年）`,
      "",
      "【収支概要】",
      `収入合計：${yen(data.incomeTotal)}（${data.incomeCount}件）`,
      `経費合計：${yen(data.expenseTotal)}（${data.expenseCount}件）`,
      `差引：${yen(data.profit)}`,
      "",
      "【確認状況】",
      `収入確認：${checks.income ? "完了" : "未確認"}`,
      `大会別収支：${checks.tournament ? "完了" : "未確認"}`,
      `経費分類：${checks.expense ? "完了" : "未確認"}`,
      `レシート確認：${checks.receipt ? "完了" : "未確認"}（不足 ${data.receiptMissing}件）`,
      `家賃按分：${checks.rent ? "完了" : "未確認"}`,
      "",
      "【共有したい内容】",
      "収入一覧、経費一覧、大会別収支、レシート一覧、申告書類PDF/CSVを確認お願いします。"
    ].join("\n");
  }

  function render(){
    const data = collect();

    renderShareList(data);
    renderCheckList(data);

    const memo = makeMemo(data);
    const area = get("pnx-step158-share-memo");
    if (area) area.value = memo;

    const memoStatus = get("pnx-step158-memo-status");
    if (memoStatus) memoStatus.textContent = "作成済み";

    window.__PNX_STEP158_LAST_DATA__ = {
      at:new Date().toISOString(),
      year:data.year,
      incomeTotal:data.incomeTotal,
      expenseTotal:data.expenseTotal,
      receiptMissing:data.receiptMissing
    };

    return data;
  }

  async function copyMemo(){
    const area = get("pnx-step158-share-memo");
    const memo = area ? area.value : makeMemo(collect());

    try {
      await navigator.clipboard.writeText(memo);
    } catch(e) {
      const t = document.createElement("textarea");
      t.value = memo;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }

    const btn = get("pnx-step158-copy-share-memo");
    if (btn) {
      const old = btn.textContent;
      btn.textContent = "コピーしました";
      setTimeout(() => btn.textContent = old, 1200);
    }
    return true;
  }

  function findFilingPanel(){
    return get("tab-filing") || document.querySelector('[data-tab-panel="filing"], .fin-panel[data-panel="filing"]');
  }

  function show(){
    render();

    const panel = findFilingPanel();
    const screen = get("pnx-step158-share-screen");
    const home = get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");
    if (!screen) return false;

    if (panel && screen.parentNode !== panel) {
      panel.insertBefore(screen, panel.firstElementChild);
    }

    if (home) home.classList.add("pnx-step158-hidden");
    screen.classList.add("is-open");
    screen.setAttribute("aria-hidden", "false");
    document.body.classList.add("pnx-step158-open-body");

    try { if (panel) panel.scrollTo({ top:0, behavior:"auto" }); } catch(e) {}

    window.__PNX_STEP158_LAST_OPEN__ = new Date().toISOString();
    return true;
  }

  function close(){
    const screen = get("pnx-step158-share-screen");
    const home = get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");

    if (screen) {
      screen.classList.remove("is-open");
      screen.setAttribute("aria-hidden", "true");
    }
    if (home) home.classList.remove("pnx-step158-hidden");
    document.body.classList.remove("pnx-step158-open-body");

    window.__PNX_STEP158_LAST_CLOSE__ = new Date().toISOString();
    return true;
  }

  function openDocuments(){
    close();
    setTimeout(function(){
      try {
        if (typeof window.PNXStep152cOpenTaxDocumentsStandalonePage === "function") {
          window.PNXStep152cOpenTaxDocumentsStandalonePage();
          return;
        }
        if (typeof window.PNXStep152bOpenTaxDocumentsFromCta === "function") {
          window.PNXStep152bOpenTaxDocumentsFromCta();
          return;
        }
      } catch(e) {}
    }, 80);
  }

  function markConfirmed(){
    localStorage.setItem(COMPLETE_KEY, "1");

    document.querySelectorAll('[data-step148-task="share"]').forEach(row => {
      const circle = row.querySelector(".circle");
      const em = row.querySelector("em");
      if (circle) {
        circle.classList.remove("empty", "warn");
        circle.classList.add("done");
        circle.textContent = "✓";
      }
      if (em) {
        em.classList.remove("warn");
        em.classList.add("done");
        em.textContent = "完了";
      }
    });

    setTimeout(close, 420);
  }

  function bind(){
    const back = get("pnx-step158-share-back");
    if (back && !back.__pnxStep158Bound) {
      back.__pnxStep158Bound = true;
      back.addEventListener("click", function(e){
        e.preventDefault();
        close();
      }, true);
    }

    const copy = get("pnx-step158-copy-share-memo");
    if (copy && !copy.__pnxStep158Bound) {
      copy.__pnxStep158Bound = true;
      copy.addEventListener("click", function(e){
        e.preventDefault();
        copyMemo();
      }, true);
    }

    const docs = get("pnx-step158-open-documents");
    if (docs && !docs.__pnxStep158Bound) {
      docs.__pnxStep158Bound = true;
      docs.addEventListener("click", function(e){
        e.preventDefault();
        openDocuments();
      }, true);
    }

    const confirm = get("pnx-step158-confirm-share");
    if (confirm && !confirm.__pnxStep158Bound) {
      confirm.__pnxStep158Bound = true;
      confirm.addEventListener("click", function(e){
        e.preventDefault();
        markConfirmed();
      }, true);
    }
  }

  function isShareTask(el){
    if (!el) return false;
    if (el.matches && el.matches('[data-step148-task="share"]')) return true;
    return /税理士へ共有する|税理士・会計事務所と共有|確認用データをまとめて共有/.test(text(el));
  }

  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest('[data-step148-task="share"], #pnx-step149-share-tax-advisor, button, a, [role="button"]');
    if (!trigger) return;

    const isBottomShareButton = trigger.id === "pnx-step149-share-tax-advisor";
    if (!isBottomShareButton && !isShareTask(trigger)) return;

    if (!isBottomShareButton && !trigger.closest("#pnx-step148d-filing-top, #pnx-step148-filing-home, #pnx-step148-todo-list")) return;

    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    show();
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    bind();
    setTimeout(bind, 400);
    setTimeout(render, 1200);
  });

  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest('.fin-tab[data-tab="filing"], .fin-tab');
    if (!tab) return;
    setTimeout(function(){ bind(); render(); }, 160);
  }, true);

  window.addEventListener("pnx:finance:transactions-updated", function(){ setTimeout(render, 100); });
  window.addEventListener("storage", function(){ setTimeout(render, 100); });

  window.PNXStep158OpenTaxAdvisorShareScreen = show;
  window.PNXStep158CloseTaxAdvisorShareScreen = close;
  window.PNXStep158RenderTaxAdvisorShareScreen = render;
  window.PNXStep158TaxAdvisorShareStatus = function(){
    const screen = get("pnx-step158-share-screen");
    return {
      step:158,
      screenExists:!!screen,
      screenOpen:!!(screen && screen.classList.contains("is-open")),
      confirmed:localStorage.getItem(COMPLETE_KEY) === "1",
      data:window.__PNX_STEP158_LAST_DATA__ || null,
      lastOpen:window.__PNX_STEP158_LAST_OPEN__ || null,
      note:"税理士共有画面"
    };
  };
})();




/* ================================================================
   STEP159: Filing progress and completion sync
   目的:
   - 各詳細画面の「確認しました」と申告トップを完全連動
   - やること一覧の完了表示、申告準備率リング、チェック項目を更新
   - localStorageに保存してアプリ再起動後も状態を維持
   ================================================================ */
(function(){
  if (window.__PNX_STEP159_FILING_PROGRESS_SYNC__) return;
  window.__PNX_STEP159_FILING_PROGRESS_SYNC__ = true;

  const DOC_KEY = "PNX_FILING_STEP152_DOCUMENTS_CONFIRMED";

  const TASKS = [
    { id:"transactions", key:"PNX_FILING_STEP150_INCOME_CONFIRMED", label:"収入確認", short:"収入確認", required:true },
    { id:"tournaments", key:"PNX_FILING_STEP154_TOURNAMENT_CONFIRMED", label:"大会収支確認", short:"大会収支", required:true },
    { id:"categories", key:"PNX_FILING_STEP155_EXPENSE_CONFIRMED", label:"経費分類", short:"経費分類", required:true },
    { id:"receipts", key:"PNX_FILING_STEP156_RECEIPT_CONFIRMED", label:"レシート確認", short:"レシート確認", required:true },
    { id:"rent", key:"PNX_FILING_STEP157_RENT_CONFIRMED", label:"家賃按分確認", short:"家賃按分", required:false },
    { id:"documents", key:DOC_KEY, label:"申告書類作成", short:"書類作成", required:true },
    { id:"share", key:"PNX_FILING_STEP158_SHARE_CONFIRMED", label:"税理士共有", short:"共有", required:true }
  ];

  const CONFIRM_ID_TO_KEY = {
    "pnx-step150-confirm-income":"PNX_FILING_STEP150_INCOME_CONFIRMED",
    "pnx-step154-confirm-tournament":"PNX_FILING_STEP154_TOURNAMENT_CONFIRMED",
    "pnx-step155-confirm-expense":"PNX_FILING_STEP155_EXPENSE_CONFIRMED",
    "pnx-step156-confirm-receipt":"PNX_FILING_STEP156_RECEIPT_CONFIRMED",
    "pnx-step157-confirm-rent":"PNX_FILING_STEP157_RENT_CONFIRMED",
    "pnx-step158-confirm-share":"PNX_FILING_STEP158_SHARE_CONFIRMED"
  };

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  function isDone(key){
    return localStorage.getItem(key) === "1";
  }

  function setDone(key){
    localStorage.setItem(key, "1");
    window.__PNX_STEP159_LAST_SET__ = { key, at:new Date().toISOString() };
  }

  function readTxs(){
    try {
      if (typeof window.PNXStep138gGetAllFinanceTransactions === "function") {
        return window.PNXStep138gGetAllFinanceTransactions() || [];
      }
    } catch(e) {}
    try {
      const list = JSON.parse(localStorage.getItem("PNX_FINANCE_TRANSACTIONS") || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function currentYear(){
    const y = get("pnx-step142-year");
    return Number(y && y.value) || new Date().getFullYear();
  }

  function txYear(tx){
    const raw = String((tx && (tx.date || tx.startDate || tx.createdAt)) || "");
    const y = Number(raw.slice(0,4));
    return y || currentYear();
  }

  function txType(tx){
    const t = String((tx && (tx.type || tx.kind || tx.flow || tx.side)) || "").toLowerCase();
    if (t.includes("income") || t.includes("revenue") || t === "in") return "income";
    if (tx && tx.income === true) return "income";
    return "expense";
  }

  function isRentLike(tx){
    const src = [
      tx && tx.name,
      tx && tx.title,
      tx && tx.memo,
      tx && tx.description,
      tx && tx.category,
      tx && tx.categoryName,
      tx && tx.expenseCategory,
      tx && tx.taxCategory,
      tx && tx.accountItem
    ].map(v => String(v || "")).join(" ");
    return /家賃|賃料|事務所|作業部屋|オフィス|自宅|按分|rent|office/i.test(src);
  }

  function rentIsActive(){
    if (isDone("PNX_FILING_STEP157_RENT_CONFIRMED")) return true;
    const rate = Number(localStorage.getItem("PNX_RENT_ALLOCATION_RATE") || localStorage.getItem("PNX_FINANCE_RENT_RATE") || 0);
    if (rate > 0) return true;

    const year = currentYear();
    return readTxs().some(tx => txYear(tx) === year && txType(tx) === "expense" && isRentLike(tx));
  }

  function activeTasks(){
    const rentActive = rentIsActive();
    return TASKS.filter(t => t.required || t.id !== "rent" || rentActive);
  }

  function progressData(){
    const active = activeTasks();
    const completed = active.filter(t => isDone(t.key));
    const percent = active.length ? Math.round((completed.length / active.length) * 100) : 0;

    return {
      percent,
      completed:completed.length,
      total:active.length,
      rentActive:rentIsActive(),
      active
    };
  }

  function ensureTournamentRow(){
    const list = get("pnx-step148-todo-list") || document.querySelector(".pnx-filing-ref-todo-card");
    if (!list) return;
    if (list.querySelector('[data-step148-task="tournaments"]')) return;

    const row = document.createElement("button");
    row.type = "button";
    row.className = "pnx-filing-ref-todo-row pnx-step151b-restored-row pnx-step159-managed-row";
    row.setAttribute("data-step148-task", "tournaments");
    row.innerHTML = '<span class="circle empty"></span><span class="pnx-step153-task-text"><strong class="pnx-step153-task-title">大会ごとの収支を確認する</strong><small class="pnx-step153-task-sub">大会別の収入・経費を整理</small></span><em class="warn">未完了</em><i>›</i>';

    const first = list.querySelector('[data-step148-task="transactions"]');
    if (first && first.nextSibling) list.insertBefore(row, first.nextSibling);
    else list.appendChild(row);
  }

  function findRow(id){
    return document.querySelector(`[data-step148-task="${id}"]`);
  }

  function setRowState(row, state, label){
    if (!row) return;

    row.classList.remove("pnx-step159-row-done", "pnx-step159-row-pending", "pnx-step159-row-optional");
    row.classList.add(`pnx-step159-row-${state}`);

    const circle = row.querySelector(".circle");
    const em = row.querySelector("em");

    if (circle) {
      circle.classList.remove("done", "empty", "warn");
      if (state === "done") {
        circle.classList.add("done");
        circle.textContent = "✓";
      } else if (state === "optional") {
        circle.classList.add("empty");
        circle.textContent = "";
      } else {
        circle.classList.add("empty");
        circle.textContent = "";
      }
    }

    if (em) {
      em.classList.remove("done", "warn", "optional");
      if (state === "done") {
        em.classList.add("done");
        em.textContent = "完了";
      } else if (state === "optional") {
        em.classList.add("optional");
        em.textContent = label || "任意";
      } else {
        em.classList.add("warn");
        em.textContent = label || "未完了";
      }
    }
  }

  function updateRows(){
    ensureTournamentRow();

    const data = progressData();
    TASKS.forEach(task => {
      const row = findRow(task.id);
      if (!row) return;

      if (task.id === "rent" && !data.rentActive && !isDone(task.key)) {
        setRowState(row, "optional", "任意");
        return;
      }

      if (isDone(task.key)) setRowState(row, "done");
      else setRowState(row, "pending", task.id === "tournaments" ? "確認" : "未完了");
    });
  }

  function setRing(circle, percent){
    if (!circle) return;
    const r = Number(circle.getAttribute("r")) || 46;
    const c = 2 * Math.PI * r;
    circle.style.strokeDasharray = String(c);
    circle.style.strokeDashoffset = String(c * (1 - percent / 100));
    circle.style.setProperty("--pnx-step159-progress", percent);
  }

  function updateRings(){
    const data = progressData();
    const p = data.percent;

    // 数字
    document.querySelectorAll("#pnx-step148-progress-num, #ring-label .ring-num, .ring-label .ring-num, .filing-prep-card .ring-num").forEach(el => {
      el.textContent = String(p);
    });

    // リング
    document.querySelectorAll("#pnx-step148-ring-progress, #ring-fill, .filing-prep-card .ring-fill, .prep-ring .ring-fill").forEach(el => {
      setRing(el, p);
    });

    // 小さいカードの補足
    document.querySelectorAll(".filing-prep-sub, .pnx-step148d-created-head p").forEach(el => {
      const remaining = Math.max(0, data.total - data.completed);
      el.textContent = remaining === 0
        ? "申告準備が完了しています"
        : `残り${remaining}項目で申告準備が完了します`;
    });

    // 大きいカードの更新日
    const updated = get("pnx-step148-updated-date");
    if (updated) {
      const d = new Date();
      updated.textContent = `最終更新：${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`;
    }

    window.__PNX_STEP159_LAST_PROGRESS__ = {
      at:new Date().toISOString(),
      percent:p,
      completed:data.completed,
      total:data.total,
      rentActive:data.rentActive
    };
  }

  function checkIcon(ok){
    if (ok) {
      return '<svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="2,7.5 6,11 12,3.5"></polyline></svg>';
    }
    return "";
  }

  function updateChecklist(){
    const map = [
      { label:"収入確認", done:isDone("PNX_FILING_STEP150_INCOME_CONFIRMED") },
      { label:"経費分類", done:isDone("PNX_FILING_STEP155_EXPENSE_CONFIRMED") },
      { label:"レシート確認", done:isDone("PNX_FILING_STEP156_RECEIPT_CONFIRMED") },
      { label:"書類作成", done:isDone(DOC_KEY) },
      { label:"共有・提出", done:isDone("PNX_FILING_STEP158_SHARE_CONFIRMED") }
    ];

    document.querySelectorAll(".filing-checklist").forEach(list => {
      const rows = Array.from(list.querySelectorAll(".filing-check-row"));
      rows.forEach((row, i) => {
        const item = map[i];
        if (!item) return;
        row.classList.toggle("done", !!item.done);
        row.classList.toggle("empty", !item.done);

        const textEl = row.querySelector(".fc-text");
        if (textEl) textEl.textContent = item.label;

        const mark = row.querySelector(".fc-mark");
        if (mark) {
          mark.classList.toggle("fc-mark-empty", !item.done);
          mark.innerHTML = checkIcon(item.done);
        }
      });
    });

    document.querySelectorAll(".pnx-step148d-created-checks > div").forEach((row, i) => {
      const item = map[i];
      if (!item) return;
      const span = row.querySelector("span");
      const b = row.querySelector("b");
      if (b) b.textContent = item.label;
      if (span) {
        span.classList.toggle("done", !!item.done);
        span.textContent = item.done ? "✓" : "";
      }
    });
  }

  function markDocumentsDone(){
    setDone(DOC_KEY);
    apply();
  }

  function wrapDocumentOpeners(){
    ["PNXStep152cOpenTaxDocumentsStandalonePage", "PNXStep152bOpenTaxDocumentsFromCta", "PNXStep152OpenTaxDocumentsPage"].forEach(name => {
      const fn = window[name];
      if (typeof fn === "function" && !fn.__pnxStep159Wrapped) {
        const wrapped = function(){
          setDone(DOC_KEY);
          const result = fn.apply(this, arguments);
          setTimeout(apply, 80);
          return result;
        };
        wrapped.__pnxStep159Wrapped = true;
        window[name] = wrapped;
      }
    });
  }

  function apply(){
    wrapDocumentOpeners();
    updateRows();
    updateRings();
    updateChecklist();

    window.__PNX_STEP159_LAST_APPLY__ = new Date().toISOString();
    return progressData();
  }

  document.addEventListener("click", function(e){
    const btn = e.target && e.target.closest && e.target.closest("button, a, [role='button']");
    if (!btn) return;

    // 各詳細画面の確認ボタン
    if (CONFIRM_ID_TO_KEY[btn.id]) {
      setDone(CONFIRM_ID_TO_KEY[btn.id]);
      setTimeout(apply, 40);
      setTimeout(apply, 500);
      return;
    }

    // 申告書類作成系は、開いた時点で「書類作成を確認済み」扱いにする
    if (btn.id === "pnx-step148-start-flow" || btn.id === "pnx-step158-open-documents" || btn.matches('[data-step148-task="documents"]') || /申告書類を作成する|申告書類PDF\/CSVを確認/.test(text(btn))) {
      markDocumentsDone();
      setTimeout(apply, 120);
      setTimeout(apply, 600);
      return;
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(apply, 120);
    setTimeout(apply, 600);
    setTimeout(apply, 1600);
  });

  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest('.fin-tab[data-tab="filing"], .fin-tab');
    if (!tab) return;
    setTimeout(apply, 160);
    setTimeout(apply, 700);
  }, true);

  window.addEventListener("storage", function(e){
    if (!e.key || e.key.indexOf("PNX_FILING_STEP") === 0 || e.key === "PNX_FINANCE_TRANSACTIONS" || e.key === "PNX_RENT_ALLOCATION_RATE") {
      setTimeout(apply, 80);
    }
  });

  window.addEventListener("pnx:finance:transactions-updated", function(){ setTimeout(apply, 120); });

  window.PNXStep159ApplyFilingProgressSync = apply;
  window.PNXStep159MarkDocumentsDone = markDocumentsDone;
  window.PNXStep159FilingProgressSyncStatus = function(){
    const data = progressData();
    return {
      step:159,
      percent:data.percent,
      completed:data.completed,
      total:data.total,
      rentActive:data.rentActive,
      tasks:TASKS.map(t => ({ id:t.id, done:isDone(t.key), key:t.key })),
      lastApply:window.__PNX_STEP159_LAST_APPLY__ || null,
      lastProgress:window.__PNX_STEP159_LAST_PROGRESS__ || null,
      note:"申告トップの準備率・完了状態を詳細画面の確認状態と連動"
    };
  };
})();




/* ================================================================
   STEP160: Tax documents screen refined
   目的:
   - 申告書類作成画面の構成を分かりやすく整理
   - 作成できる書類の並び・文言・次の行動を明確化
   - 既存のPDF/CSV生成ボタン機能は壊さず、表示だけ整える
   ================================================================ */
(function(){
  if (window.__PNX_STEP160_TAX_DOCUMENTS_REFINED__) return;
  window.__PNX_STEP160_TAX_DOCUMENTS_REFINED__ = true;

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  const DOC_META = [
    {
      doc:"income-expense-general",
      no:"1",
      title:"収支一覧PDF",
      sub:"税理士にそのまま渡せる確認用PDF",
      type:"PDF"
    },
    {
      doc:"income-expense-simple",
      no:"2",
      title:"税理士確認用PDF",
      sub:"収入・経費の概要を短くまとめた確認用",
      type:"PDF"
    },
    {
      doc:"expense-list",
      no:"3",
      title:"経費一覧CSV",
      sub:"会計ソフト・税理士共有用の経費データ",
      type:"CSV"
    },
    {
      doc:"tournament-list",
      no:"4",
      title:"大会別収支CSV",
      sub:"ゴルファー専用の大会別レポート",
      type:"CSV"
    },
    {
      doc:"annual-detail",
      no:"5",
      title:"全取引明細CSV",
      sub:"すべての取引を日付順に保存",
      type:"CSV"
    }
  ];

  function docsPage(){
    return get("pnx-step144-taxdocs");
  }

  function updateDocRows(){
    const list = get("pnx-step144-doc-list");
    if (!list) return false;

    const byDoc = {};
    list.querySelectorAll("[data-pnx-doc]").forEach(btn => {
      byDoc[btn.getAttribute("data-pnx-doc")] = btn;
    });

    DOC_META.forEach(meta => {
      const btn = byDoc[meta.doc];
      if (!btn) return;

      btn.classList.add("pnx-step160-doc-row");

      let icon = btn.querySelector(".pnx-taxdoc-download");
      if (icon) {
        icon.classList.add("pnx-step160-doc-num");
        icon.textContent = meta.no;
      }

      const strong = btn.querySelector("strong");
      if (strong) strong.textContent = meta.title;

      const small = btn.querySelector("small");
      if (small) small.textContent = meta.sub;

      const em = btn.querySelector("em");
      if (em) em.textContent = meta.type;

      list.appendChild(btn);
    });

    const count = get("pnx-step144-doc-count");
    if (count) count.textContent = `${DOC_META.length}件`;

    return true;
  }

  function ensureGuideCard(){
    const page = docsPage();
    const firstCard = page && page.querySelector(".pnx-taxdocs-card");
    if (!page || !firstCard || get("pnx-step160-guide-card")) return;

    const guide = document.createElement("article");
    guide.id = "pnx-step160-guide-card";
    guide.className = "pnx-step160-guide-card";
    guide.innerHTML = `
      <p class="pnx-step160-kicker">Documents</p>
      <h3>必要な書類を作成して、共有・提出へ進みます</h3>
      <div class="pnx-step160-flow">
        <span>1. PDFで確認</span>
        <i>›</i>
        <span>2. CSVを保存</span>
        <i>›</i>
        <span>3. 税理士へ共有</span>
      </div>
    `;
    page.insertBefore(guide, firstCard);
  }

  function updateCardHead(){
    const card = docsPage() && docsPage().querySelector(".pnx-taxdocs-card");
    if (!card) return;

    card.classList.add("pnx-step160-doc-card");

    const h3 = card.querySelector(".pnx-taxdocs-card-head h3");
    const p = card.querySelector(".pnx-taxdocs-card-head p");
    if (h3) h3.textContent = "作成できる書類";
    if (p) p.textContent = "PDFで内容を確認し、CSVで会計ソフトや税理士へ共有できます。";
  }

  function ensureNextCard(){
    const page = docsPage();
    if (!page || get("pnx-step160-next-card")) return;

    const card = document.createElement("article");
    card.id = "pnx-step160-next-card";
    card.className = "pnx-step160-next-card";
    card.innerHTML = `
      <div class="pnx-step160-next-head">
        <p class="pnx-step160-kicker">Next</p>
        <h3>次に進む</h3>
        <p>書類を確認したら、税理士への共有またはe-Taxの手続きへ進みます。</p>
      </div>
      <div class="pnx-step160-next-actions">
        <button type="button" id="pnx-step160-share-next">税理士へ共有する</button>
        <button type="button" id="pnx-step160-etax-next">e-Taxに進む</button>
      </div>
    `;

    const oldDeadline = page.querySelector(".pnx-taxdocs-deadline");
    if (oldDeadline && oldDeadline.parentNode) {
      page.insertBefore(card, oldDeadline);
    } else {
      page.appendChild(card);
    }

    const share = get("pnx-step160-share-next");
    if (share && !share.__pnxStep160Bound) {
      share.__pnxStep160Bound = true;
      share.addEventListener("click", function(e){
        e.preventDefault();
        if (typeof window.PNXStep152cCloseTaxDocumentsStandalonePage === "function") {
          window.PNXStep152cCloseTaxDocumentsStandalonePage();
        }
        setTimeout(function(){
          if (typeof window.PNXStep158OpenTaxAdvisorShareScreen === "function") {
            window.PNXStep158OpenTaxAdvisorShareScreen();
          }
        }, 80);
      }, true);
    }

    const etax = get("pnx-step160-etax-next");
    if (etax && !etax.__pnxStep160Bound) {
      etax.__pnxStep160Bound = true;
      etax.addEventListener("click", function(e){
        e.preventDefault();
        const old = get("pnx-step144-etax-btn");
        if (old && old.click) old.click();
        else window.alert("e-Taxの手続きへ進む前に、作成した書類の内容を確認してください。");
      }, true);
    }
  }

  function hideLegacyBlocks(){
    const page = docsPage();
    if (!page) return;

    const etax = page.querySelector(".pnx-taxdocs-etax");
    if (etax) etax.classList.add("pnx-step160-legacy-hidden");

    const shareCard = page.querySelector(".pnx-taxdocs-share") && page.querySelector(".pnx-taxdocs-share").closest(".pnx-taxdocs-card");
    if (shareCard) shareCard.classList.add("pnx-step160-legacy-hidden");

    const deadline = page.querySelector(".pnx-taxdocs-deadline");
    if (deadline) deadline.classList.add("pnx-step160-legacy-hidden");
  }

  function bindDocumentProgress(){
    document.querySelectorAll("#pnx-step144-doc-list [data-pnx-doc]").forEach(btn => {
      if (btn.__pnxStep160ProgressBound) return;
      btn.__pnxStep160ProgressBound = true;
      btn.addEventListener("click", function(){
        try {
          if (typeof window.PNXStep159MarkDocumentsDone === "function") {
            window.PNXStep159MarkDocumentsDone();
          }
        } catch(e) {}
      }, true);
    });
  }

  function refine(){
    const page = docsPage();
    if (!page) return false;

    page.classList.add("pnx-step160-refined");

    ensureGuideCard();
    updateCardHead();
    updateDocRows();
    ensureNextCard();
    hideLegacyBlocks();
    bindDocumentProgress();

    window.__PNX_STEP160_LAST_REFINE__ = new Date().toISOString();
    return true;
  }

  ["PNXStep152cOpenTaxDocumentsStandalonePage", "PNXStep152bOpenTaxDocumentsFromCta", "PNXStep152OpenTaxDocumentsPage"].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep160Wrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(refine, 0);
        setTimeout(refine, 120);
        return result;
      };
      wrapped.__pnxStep160Wrapped = true;
      window[name] = wrapped;
    }
  });

  document.addEventListener("click", function(e){
    const btn = e.target && e.target.closest && e.target.closest("button,a,[role='button']");
    if (!btn) return;
    if (/申告書類を作成する|申告書類PDF\/CSVを確認/.test(text(btn))) {
      setTimeout(refine, 0);
      setTimeout(refine, 140);
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(refine, 600);
    setTimeout(refine, 1400);
  });

  window.PNXStep160RefineTaxDocumentsScreen = refine;
  window.PNXStep160TaxDocumentsScreenRefinedStatus = function(){
    const page = docsPage();
    const rows = page ? page.querySelectorAll("#pnx-step144-doc-list [data-pnx-doc]").length : 0;
    return {
      step:160,
      pageExists:!!page,
      refined:!!(page && page.classList.contains("pnx-step160-refined")),
      docRows:rows,
      guideCard:!!get("pnx-step160-guide-card"),
      nextCard:!!get("pnx-step160-next-card"),
      legacyHidden:page ? page.querySelectorAll(".pnx-step160-legacy-hidden").length : 0,
      lastRefine:window.__PNX_STEP160_LAST_REFINE__ || null,
      note:"申告書類作成画面をPDF/CSV/共有/e-Taxの流れで整理"
    };
  };
})();




/* ================================================================
   STEP161: Tax advisor missing checks and quick return actions
   目的:
   - 税理士共有画面に「不足項目」を追加
   - 足りない項目から該当詳細画面へすぐ戻れるようにする
   ================================================================ */
(function(){
  if (window.__PNX_STEP161_TAX_ADVISOR_MISSING_CHECKS__) return;
  window.__PNX_STEP161_TAX_ADVISOR_MISSING_CHECKS__ = true;

  const DOC_KEY = "PNX_FILING_STEP152_DOCUMENTS_CONFIRMED";

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  function isDone(key){
    return localStorage.getItem(key) === "1";
  }

  function readTxs(){
    try {
      if (typeof window.PNXStep138gGetAllFinanceTransactions === "function") {
        return window.PNXStep138gGetAllFinanceTransactions() || [];
      }
    } catch(e) {}
    try {
      const list = JSON.parse(localStorage.getItem("PNX_FINANCE_TRANSACTIONS") || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function currentYear(){
    const y = get("pnx-step142-year");
    return Number(y && y.value) || new Date().getFullYear();
  }

  function txYear(tx){
    const raw = String((tx && (tx.date || tx.startDate || tx.createdAt)) || "");
    const y = Number(raw.slice(0,4));
    return y || currentYear();
  }

  function txType(tx){
    const t = String((tx && (tx.type || tx.kind || tx.flow || tx.side)) || "").toLowerCase();
    if (t.includes("income") || t.includes("revenue") || t === "in") return "income";
    if (tx && tx.income === true) return "income";
    return "expense";
  }

  function hasReceipt(tx){
    if (!tx) return false;
    if (tx.hasReceipt === true || tx.receiptAttached === true || tx.attachment === true) return true;
    if (Array.isArray(tx.receipts) && tx.receipts.length) return true;
    if (Array.isArray(tx.attachments) && tx.attachments.length) return true;
    const fields = [tx.receiptUrl, tx.receiptImage, tx.receiptImageUrl, tx.fileUrl, tx.attachmentUrl, tx.photoUrl, tx.scanUrl, tx.receiptId, tx.attachmentId];
    return fields.some(v => String(v || "").trim());
  }

  function isRentLike(tx){
    const src = [
      tx && tx.name,
      tx && tx.title,
      tx && tx.memo,
      tx && tx.description,
      tx && tx.category,
      tx && tx.categoryName,
      tx && tx.expenseCategory,
      tx && tx.taxCategory,
      tx && tx.accountItem
    ].map(v => String(v || "")).join(" ");
    return /家賃|賃料|事務所|作業部屋|オフィス|自宅|按分|rent|office/i.test(src);
  }

  function rentIsActive(){
    if (isDone("PNX_FILING_STEP157_RENT_CONFIRMED")) return true;
    const rate = Number(localStorage.getItem("PNX_RENT_ALLOCATION_RATE") || localStorage.getItem("PNX_FINANCE_RENT_RATE") || 0);
    if (rate > 0) return true;
    const year = currentYear();
    return readTxs().some(tx => txYear(tx) === year && txType(tx) === "expense" && isRentLike(tx));
  }

  function receiptMissingCount(){
    const year = currentYear();
    let count = 0;
    readTxs().forEach(tx => {
      if (txYear(tx) !== year) return;
      if (txType(tx) !== "expense") return;
      if (!hasReceipt(tx)) count += 1;
    });
    return count;
  }

  function missingItems(){
    const missing = [];
    const receiptMissing = receiptMissingCount();
    const rentActive = rentIsActive();

    if (!isDone("PNX_FILING_STEP150_INCOME_CONFIRMED")) {
      missing.push({
        id:"income",
        title:"収入確認が未完了です",
        sub:"賞金・スポンサー料などの収入を確認してください。",
        action:"収入を確認する"
      });
    }

    if (!isDone("PNX_FILING_STEP154_TOURNAMENT_CONFIRMED")) {
      missing.push({
        id:"tournament",
        title:"大会別収支が未確認です",
        sub:"大会ごとの収入・経費が整理されているか確認してください。",
        action:"大会収支を確認する"
      });
    }

    if (!isDone("PNX_FILING_STEP155_EXPENSE_CONFIRMED")) {
      missing.push({
        id:"expense",
        title:"経費分類が未完了です",
        sub:"交通費・宿泊費などの分類を確認してください。",
        action:"経費を分類する"
      });
    }

    if (!isDone("PNX_FILING_STEP156_RECEIPT_CONFIRMED") || receiptMissing > 0) {
      missing.push({
        id:"receipt",
        title: receiptMissing > 0 ? `レシートが${receiptMissing}件不足しています` : "レシート確認が未完了です",
        sub:"不足している証憑を確認し、必要に応じて追加してください。",
        action:"レシートを確認する"
      });
    }

    if (rentActive && !isDone("PNX_FILING_STEP157_RENT_CONFIRMED")) {
      missing.push({
        id:"rent",
        title:"家賃按分が未確認です",
        sub:"家賃・事務所関連の支出がある場合は按分率を確認してください。",
        action:"家賃按分を確認する"
      });
    }

    if (!isDone(DOC_KEY)) {
      missing.push({
        id:"documents",
        title:"申告書類PDF/CSVが未確認です",
        sub:"共有前に、作成できる書類の内容を確認してください。",
        action:"申告書類を確認する"
      });
    }

    return missing;
  }

  function ensureCard(){
    const screen = get("pnx-step158-share-screen");
    if (!screen) return null;

    let card = get("pnx-step161-missing-card");
    if (card) return card;

    card = document.createElement("section");
    card.id = "pnx-step161-missing-card";
    card.className = "pnx-step161-missing-card";
    card.innerHTML = `
      <div class="pnx-step161-missing-head">
        <p class="pnx-step161-kicker">Before sharing</p>
        <h3>共有前に確認すること</h3>
        <p id="pnx-step161-missing-summary">不足項目を確認しています。</p>
      </div>
      <div class="pnx-step161-missing-list" id="pnx-step161-missing-list"></div>
    `;

    const firstSection = screen.querySelector(".pnx-step158-section");
    if (firstSection && firstSection.parentNode) {
      firstSection.parentNode.insertBefore(card, firstSection);
    } else {
      screen.appendChild(card);
    }

    return card;
  }

  function render(){
    const card = ensureCard();
    const list = get("pnx-step161-missing-list");
    const summary = get("pnx-step161-missing-summary");
    if (!card || !list) return false;

    const missing = missingItems();

    list.innerHTML = "";

    if (!missing.length) {
      card.classList.add("is-complete");
      card.classList.remove("has-missing");
      if (summary) summary.textContent = "共有前の確認は完了しています。税理士へ共有できます。";

      const done = document.createElement("div");
      done.className = "pnx-step161-all-clear";
      done.innerHTML = `
        <span>✓</span>
        <div>
          <strong>共有準備が完了しています</strong>
          <small>収入・経費・レシート・申告書類の確認が済んでいます。</small>
        </div>
      `;
      list.appendChild(done);
    } else {
      card.classList.add("has-missing");
      card.classList.remove("is-complete");
      if (summary) summary.textContent = `${missing.length}件の確認項目があります。共有前に確認してください。`;

      missing.forEach(item => {
        const row = document.createElement("article");
        row.className = "pnx-step161-missing-row";
        row.setAttribute("data-step161-missing", item.id);
        row.innerHTML = `
          <div class="pnx-step161-missing-main">
            <span>!</span>
            <div>
              <strong>${item.title}</strong>
              <small>${item.sub}</small>
            </div>
          </div>
          <button type="button" data-step161-action="${item.id}">${item.action}</button>
        `;
        list.appendChild(row);
      });
    }

    const ready = get("pnx-step158-ready-count");
    if (ready) {
      const total = 6;
      const done = Math.max(0, total - missing.length);
      ready.textContent = `${done}/${total}`;
    }

    window.__PNX_STEP161_LAST_RENDER__ = {
      at:new Date().toISOString(),
      missingCount:missing.length,
      missing:missing.map(x => x.id)
    };

    return true;
  }

  function closeShare(){
    try {
      if (typeof window.PNXStep158CloseTaxAdvisorShareScreen === "function") {
        window.PNXStep158CloseTaxAdvisorShareScreen();
        return true;
      }
    } catch(e) {}
    const screen = get("pnx-step158-share-screen");
    if (screen) {
      screen.classList.remove("is-open");
      screen.setAttribute("aria-hidden", "true");
      document.body.classList.remove("pnx-step158-open-body");
      return true;
    }
    return false;
  }

  function openAction(id){
    closeShare();

    setTimeout(function(){
      try {
        if (id === "income" && typeof window.PNXStep150OpenIncomeConfirmScreen === "function") {
          window.PNXStep150OpenIncomeConfirmScreen();
          return;
        }
        if (id === "tournament" && typeof window.PNXStep154OpenTournamentFinanceConfirmScreen === "function") {
          window.PNXStep154OpenTournamentFinanceConfirmScreen();
          return;
        }
        if (id === "expense" && typeof window.PNXStep155OpenExpenseCategoryConfirmScreen === "function") {
          window.PNXStep155OpenExpenseCategoryConfirmScreen();
          return;
        }
        if (id === "receipt" && typeof window.PNXStep156OpenReceiptConfirmScreen === "function") {
          window.PNXStep156OpenReceiptConfirmScreen();
          return;
        }
        if (id === "rent" && typeof window.PNXStep157OpenRentAllocationConfirmScreen === "function") {
          window.PNXStep157OpenRentAllocationConfirmScreen();
          return;
        }
        if (id === "documents") {
          if (typeof window.PNXStep152cOpenTaxDocumentsStandalonePage === "function") {
            window.PNXStep152cOpenTaxDocumentsStandalonePage();
            return;
          }
          if (typeof window.PNXStep152bOpenTaxDocumentsFromCta === "function") {
            window.PNXStep152bOpenTaxDocumentsFromCta();
            return;
          }
        }
      } catch(e) {}
    }, 120);
  }

  function wrapShareOpen(){
    const fn = window.PNXStep158OpenTaxAdvisorShareScreen;
    if (typeof fn === "function" && !fn.__pnxStep161Wrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(render, 0);
        setTimeout(render, 160);
        return result;
      };
      wrapped.__pnxStep161Wrapped = true;
      window.PNXStep158OpenTaxAdvisorShareScreen = wrapped;
    }

    const renderFn = window.PNXStep158RenderTaxAdvisorShareScreen;
    if (typeof renderFn === "function" && !renderFn.__pnxStep161Wrapped) {
      const wrappedRender = function(){
        const result = renderFn.apply(this, arguments);
        setTimeout(render, 0);
        return result;
      };
      wrappedRender.__pnxStep161Wrapped = true;
      window.PNXStep158RenderTaxAdvisorShareScreen = wrappedRender;
    }
  }

  document.addEventListener("click", function(e){
    const action = e.target && e.target.closest && e.target.closest("[data-step161-action]");
    if (action) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      openAction(action.getAttribute("data-step161-action"));
      return;
    }

    const shareTrigger = e.target && e.target.closest && e.target.closest('[data-step148-task="share"], #pnx-step149-share-tax-advisor, #pnx-step160-share-next');
    if (shareTrigger) {
      setTimeout(render, 160);
      setTimeout(render, 500);
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    wrapShareOpen();
    setTimeout(render, 900);
    setTimeout(render, 1700);
  });

  window.addEventListener("storage", function(e){
    if (!e.key || e.key.indexOf("PNX_FILING_STEP") === 0 || e.key === "PNX_FINANCE_TRANSACTIONS" || e.key === "PNX_RENT_ALLOCATION_RATE") {
      setTimeout(render, 120);
    }
  });

  window.PNXStep161RenderTaxAdvisorMissingChecks = render;
  window.PNXStep161TaxAdvisorMissingChecksStatus = function(){
    const missing = missingItems();
    return {
      step:161,
      cardExists:!!get("pnx-step161-missing-card"),
      missingCount:missing.length,
      missing:missing.map(x => x.id),
      lastRender:window.__PNX_STEP161_LAST_RENDER__ || null,
      note:"税理士共有前の不足項目と戻る導線を表示"
    };
  };
})();




/* ================================================================
   STEP162: Filing flow stability and global cleanup
   目的:
   - 申告タブ全体の戻る/重なり/二重表示/進捗反映を安定化
   - 1つの詳細画面を開く前に他の詳細画面を確実に閉じる
   - 監視処理なし。クリック/開閉時だけの軽量処理
   ================================================================ */
(function(){
  if (window.__PNX_STEP162_FILING_FLOW_STABILITY__) return;
  window.__PNX_STEP162_FILING_FLOW_STABILITY__ = true;

  const DETAIL_SCREENS = [
    "pnx-step150-income-screen",
    "pnx-step154-tournament-screen",
    "pnx-step155-expense-screen",
    "pnx-step156-receipt-screen",
    "pnx-step157-rent-screen",
    "pnx-step158-share-screen",
    "pnx-step144-taxdocs"
  ];

  const BODY_OPEN_CLASSES = [
    "pnx-step150e-income-open",
    "pnx-step150f-income-open",
    "pnx-step152-taxdocs-open-body",
    "pnx-step152c-docs-open-body",
    "pnx-step154-open-body",
    "pnx-step154b-tournament-open",
    "pnx-step155-open-body",
    "pnx-step156-open-body",
    "pnx-step157-open-body",
    "pnx-step158-open-body"
  ];

  const HOME_HIDDEN_CLASSES = [
    "pnx-step152-home-hidden",
    "pnx-step152c-home-hidden",
    "pnx-step154-hidden",
    "pnx-step155-hidden",
    "pnx-step156-hidden",
    "pnx-step157-hidden",
    "pnx-step158-hidden"
  ];

  const OPEN_FUNCTIONS = [
    ["PNXStep150OpenIncomeConfirmScreen", "pnx-step150-income-screen"],
    ["PNXStep154OpenTournamentFinanceConfirmScreen", "pnx-step154-tournament-screen"],
    ["PNXStep155OpenExpenseCategoryConfirmScreen", "pnx-step155-expense-screen"],
    ["PNXStep156OpenReceiptConfirmScreen", "pnx-step156-receipt-screen"],
    ["PNXStep157OpenRentAllocationConfirmScreen", "pnx-step157-rent-screen"],
    ["PNXStep158OpenTaxAdvisorShareScreen", "pnx-step158-share-screen"],
    ["PNXStep152cOpenTaxDocumentsStandalonePage", "pnx-step144-taxdocs"],
    ["PNXStep152bOpenTaxDocumentsFromCta", "pnx-step144-taxdocs"],
    ["PNXStep152OpenTaxDocumentsPage", "pnx-step144-taxdocs"]
  ];

  const CONFIRM_KEYS = {
    "pnx-step150-confirm-income":"PNX_FILING_STEP150_INCOME_CONFIRMED",
    "pnx-step154-confirm-tournament":"PNX_FILING_STEP154_TOURNAMENT_CONFIRMED",
    "pnx-step155-confirm-expense":"PNX_FILING_STEP155_EXPENSE_CONFIRMED",
    "pnx-step156-confirm-receipt":"PNX_FILING_STEP156_RECEIPT_CONFIRMED",
    "pnx-step157-confirm-rent":"PNX_FILING_STEP157_RENT_CONFIRMED",
    "pnx-step158-confirm-share":"PNX_FILING_STEP158_SHARE_CONFIRMED"
  };

  function get(id){ return document.getElementById(id); }

  function text(el){
    return String(el && el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function filingHome(){
    return get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");
  }

  function removeBodyOpenClasses(exceptId){
    // taxdocs / income / step系のopen時だけ対応するbody classを残す
    BODY_OPEN_CLASSES.forEach(cls => {
      if (
        (exceptId === "pnx-step150-income-screen" && (cls === "pnx-step150f-income-open" || cls === "pnx-step150e-income-open")) ||
        (exceptId === "pnx-step144-taxdocs" && (cls === "pnx-step152c-docs-open-body" || cls === "pnx-step152-taxdocs-open-body")) ||
        (exceptId === "pnx-step154-tournament-screen" && (cls === "pnx-step154b-tournament-open" || cls === "pnx-step154-open-body")) ||
        (exceptId === "pnx-step155-expense-screen" && cls === "pnx-step155-open-body") ||
        (exceptId === "pnx-step156-receipt-screen" && cls === "pnx-step156-open-body") ||
        (exceptId === "pnx-step157-rent-screen" && cls === "pnx-step157-open-body") ||
        (exceptId === "pnx-step158-share-screen" && cls === "pnx-step158-open-body")
      ) {
        return;
      }
      document.body.classList.remove(cls);
    });
  }

  function showHome(){
    const home = filingHome();
    if (!home) return;
    HOME_HIDDEN_CLASSES.forEach(cls => home.classList.remove(cls));
  }

  function closeScreenById(id){
    const el = get(id);
    if (!el) return false;

    if (id === "pnx-step144-taxdocs") {
      el.classList.remove("pnx-step152c-open", "pnx-step152-taxdocs-open");
      el.setAttribute("aria-hidden", "true");
      return true;
    }

    el.classList.remove(
      "is-open",
      "pnx-step150f-force-fixed",
      "pnx-step150e-overlay-screen",
      "pnx-step154b-force-fixed"
    );
    el.setAttribute("aria-hidden", "true");
    return true;
  }

  function closeAllDetailScreens(exceptId){
    DETAIL_SCREENS.forEach(id => {
      if (id === exceptId) return;
      closeScreenById(id);
    });

    removeBodyOpenClasses(exceptId);

    // opening前はいったんhomeを戻す。対象open関数が必要に応じて再度隠す。
    if (!exceptId) showHome();

    window.__PNX_STEP162_LAST_CLOSE_ALL__ = {
      at:new Date().toISOString(),
      exceptId:exceptId || null
    };

    return true;
  }

  function closeAllAndShowHome(){
    closeAllDetailScreens(null);
    showHome();

    try {
      if (typeof window.PNXStep159ApplyFilingProgressSync === "function") {
        window.PNXStep159ApplyFilingProgressSync();
      }
    } catch(e) {}

    window.__PNX_STEP162_LAST_HOME__ = new Date().toISOString();
    return true;
  }

  function wrapOpenFunctions(){
    OPEN_FUNCTIONS.forEach(([name, id]) => {
      const fn = window[name];
      if (typeof fn !== "function" || fn.__pnxStep162Wrapped) return;

      const wrapped = function(){
        closeAllDetailScreens(id);
        const result = fn.apply(this, arguments);

        setTimeout(function(){
          removeBodyOpenClasses(id);
          try {
            if (typeof window.PNXStep159ApplyFilingProgressSync === "function") {
              window.PNXStep159ApplyFilingProgressSync();
            }
          } catch(e) {}
        }, 120);

        return result;
      };

      wrapped.__pnxStep162Wrapped = true;
      window[name] = wrapped;
    });
  }

  function markDoneFromConfirm(id){
    const key = CONFIRM_KEYS[id];
    if (!key) return false;

    localStorage.setItem(key, "1");

    try {
      if (typeof window.PNXStep159ApplyFilingProgressSync === "function") {
        window.PNXStep159ApplyFilingProgressSync();
      }
    } catch(e) {}

    window.__PNX_STEP162_LAST_CONFIRM__ = {
      id,
      key,
      at:new Date().toISOString()
    };

    return true;
  }

  function bindBackButtons(){
    const backMap = {
      "pnx-step150-income-back":"pnx-step150-income-screen",
      "pnx-step154-tournament-back":"pnx-step154-tournament-screen",
      "pnx-step155-expense-back":"pnx-step155-expense-screen",
      "pnx-step156-receipt-back":"pnx-step156-receipt-screen",
      "pnx-step157-rent-back":"pnx-step157-rent-screen",
      "pnx-step158-share-back":"pnx-step158-share-screen",
      "pnx-step152c-docs-back":"pnx-step144-taxdocs",
      "pnx-step152-docs-back":"pnx-step144-taxdocs"
    };

    Object.keys(backMap).forEach(id => {
      const btn = get(id);
      if (!btn || btn.__pnxStep162Bound) return;
      btn.__pnxStep162Bound = true;
      btn.addEventListener("click", function(){
        setTimeout(closeAllAndShowHome, 60);
      }, true);
    });
  }

  function cleanDuplicateHeaders(){
    const docs = get("pnx-step144-taxdocs");
    if (!docs) return false;

    const headers = Array.from(docs.querySelectorAll(".pnx-step152c-docs-head, .pnx-step152-docs-head"))
      .filter(el => /申告書類の作成/.test(text(el)));

    headers.forEach((head, i) => {
      if (i > 0) head.remove();
    });

    const old = get("pnx-step152-docs-head");
    const newer = get("pnx-step152c-docs-head");
    if (old && newer && old !== newer) old.remove();

    return true;
  }

  function normalizeVisibleState(){
    const openScreens = DETAIL_SCREENS.filter(id => {
      const el = get(id);
      if (!el) return false;
      if (id === "pnx-step144-taxdocs") return el.classList.contains("pnx-step152c-open") || el.classList.contains("pnx-step152-taxdocs-open");
      return el.classList.contains("is-open");
    });

    // 複数開いていたら最後の1つだけ残す
    if (openScreens.length > 1) {
      const keep = openScreens[openScreens.length - 1];
      closeAllDetailScreens(keep);
    }

    cleanDuplicateHeaders();
    bindBackButtons();
    wrapOpenFunctions();

    window.__PNX_STEP162_LAST_NORMALIZE__ = {
      at:new Date().toISOString(),
      openScreens
    };

    return openScreens;
  }

  function runStabilityCheck(){
    const ids = DETAIL_SCREENS.map(id => {
      const el = get(id);
      if (!el) return { id, exists:false, open:false };
      const open = id === "pnx-step144-taxdocs"
        ? el.classList.contains("pnx-step152c-open") || el.classList.contains("pnx-step152-taxdocs-open")
        : el.classList.contains("is-open");
      return {
        id,
        exists:true,
        open,
        ariaHidden:el.getAttribute("aria-hidden"),
        display:getComputedStyle(el).display
      };
    });

    const openCount = ids.filter(x => x.open).length;
    const issues = [];

    if (openCount > 1) issues.push("detail_screen_multiple_open");
    if (!get("pnx-step148d-filing-top") && !get("pnx-step148-filing-home")) issues.push("filing_home_missing");

    const docsHeaders = get("pnx-step144-taxdocs")
      ? Array.from(get("pnx-step144-taxdocs").querySelectorAll(".pnx-step152c-docs-head, .pnx-step152-docs-head")).filter(el => /申告書類の作成/.test(text(el))).length
      : 0;
    if (docsHeaders > 1) issues.push("tax_docs_header_duplicate");

    const result = {
      step:162,
      ok:issues.length === 0,
      issues,
      openCount,
      screens:ids,
      docsHeaders,
      lastNormalize:window.__PNX_STEP162_LAST_NORMALIZE__ || null,
      lastConfirm:window.__PNX_STEP162_LAST_CONFIRM__ || null,
      note:"申告詳細画面の重なり・戻る・進捗連動の安定化チェック"
    };

    window.__PNX_STEP162_LAST_CHECK__ = result;
    return result;
  }

  document.addEventListener("click", function(e){
    const btn = e.target && e.target.closest && e.target.closest("button,a,[role='button']");
    if (!btn) return;

    if (CONFIRM_KEYS[btn.id]) {
      markDoneFromConfirm(btn.id);
      setTimeout(closeAllAndShowHome, 520);
      setTimeout(function(){
        try {
          if (typeof window.PNXStep159ApplyFilingProgressSync === "function") {
            window.PNXStep159ApplyFilingProgressSync();
          }
        } catch(e) {}
      }, 700);
      return;
    }

    const isBack =
      btn.id === "pnx-step150-income-back" ||
      btn.id === "pnx-step154-tournament-back" ||
      btn.id === "pnx-step155-expense-back" ||
      btn.id === "pnx-step156-receipt-back" ||
      btn.id === "pnx-step157-rent-back" ||
      btn.id === "pnx-step158-share-back" ||
      btn.id === "pnx-step152c-docs-back" ||
      btn.id === "pnx-step152-docs-back";

    if (isBack) {
      setTimeout(closeAllAndShowHome, 70);
      return;
    }

    const isOpenTrigger =
      btn.closest('[data-step148-task]') ||
      /申告書類を作成する|税理士へ共有する|申告書類PDF\/CSVを確認/.test(text(btn));

    if (isOpenTrigger) {
      setTimeout(function(){
        wrapOpenFunctions();
        normalizeVisibleState();
      }, 180);
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    wrapOpenFunctions();
    bindBackButtons();
    setTimeout(normalizeVisibleState, 250);
    setTimeout(normalizeVisibleState, 900);
    setTimeout(runStabilityCheck, 1400);
  });

  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest('.fin-tab[data-tab="filing"], .fin-tab');
    if (!tab) return;
    setTimeout(function(){
      wrapOpenFunctions();
      bindBackButtons();
      normalizeVisibleState();
      try {
        if (typeof window.PNXStep159ApplyFilingProgressSync === "function") {
          window.PNXStep159ApplyFilingProgressSync();
        }
      } catch(e) {}
    }, 200);
  }, true);

  window.PNXStep162CloseAllFilingDetailScreens = closeAllAndShowHome;
  window.PNXStep162NormalizeFilingVisibleState = normalizeVisibleState;
  window.PNXStep162RunFilingStabilityCheck = runStabilityCheck;
  window.PNXStep162FilingFlowStabilityStatus = runStabilityCheck;
})();




/* ================================================================
   STEP163: Tax documents final CTA
   目的:
   - 申告書類作成画面下部の「税理士へ共有する / e-Taxに進む」は
     やること一覧と重複するため削除
   - 申告書類作成画面の最後は「確定申告書類を作成する」1つに整理
   ================================================================ */
(function(){
  if (window.__PNX_STEP163_TAX_DOCUMENTS_FINAL_CTA__) return;
  window.__PNX_STEP163_TAX_DOCUMENTS_FINAL_CTA__ = true;

  const DOC_KEY = "PNX_FILING_STEP152_DOCUMENTS_CONFIRMED";

  function get(id){ return document.getElementById(id); }

  function docsPage(){
    return get("pnx-step144-taxdocs");
  }

  function ensureFinalCta(){
    const page = docsPage();
    if (!page) return false;

    page.classList.add("pnx-step163-final-cta-mode");

    // STEP160で作った「次に進む」カードは重複するため非表示
    const oldNext = get("pnx-step160-next-card");
    if (oldNext) oldNext.classList.add("pnx-step163-hidden-next-card");

    // 念のため個別ボタンも非表示
    const oldShare = get("pnx-step160-share-next");
    const oldEtax = get("pnx-step160-etax-next");
    if (oldShare) oldShare.classList.add("pnx-step163-hidden-next-button");
    if (oldEtax) oldEtax.classList.add("pnx-step163-hidden-next-button");

    let card = get("pnx-step163-final-card");
    if (!card) {
      card = document.createElement("article");
      card.id = "pnx-step163-final-card";
      card.className = "pnx-step163-final-card";
      card.innerHTML = `
        <div class="pnx-step163-final-head">
          <p class="pnx-step163-kicker">Final</p>
          <h3>確定申告書類を作成する</h3>
          <p>PDF・CSVの内容を確認したら、申告に使う書類として保存します。</p>
        </div>
        <button type="button" id="pnx-step163-final-create">確定申告書類を作成する</button>
        <small class="pnx-step163-note">作成後は、やること一覧の「税理士へ共有する」から共有に進めます。</small>
      `;

      const docCard = page.querySelector(".pnx-taxdocs-card");
      if (docCard && docCard.parentNode) {
        docCard.parentNode.insertBefore(card, docCard.nextSibling);
      } else {
        page.appendChild(card);
      }
    }

    const finalBtn = get("pnx-step163-final-create");
    if (finalBtn && !finalBtn.__pnxStep163Bound) {
      finalBtn.__pnxStep163Bound = true;
      finalBtn.addEventListener("click", function(e){
        e.preventDefault();
        createFinalDocuments();
      }, true);
    }

    window.__PNX_STEP163_LAST_ENSURE__ = new Date().toISOString();
    return true;
  }

  function markDocumentsDone(){
    localStorage.setItem(DOC_KEY, "1");

    document.querySelectorAll('[data-step148-task="documents"]').forEach(row => {
      const circle = row.querySelector(".circle");
      const em = row.querySelector("em");
      if (circle) {
        circle.classList.remove("empty", "warn");
        circle.classList.add("done");
        circle.textContent = "✓";
      }
      if (em) {
        em.classList.remove("warn");
        em.classList.add("done");
        em.textContent = "完了";
      }
    });

    try {
      if (typeof window.PNXStep159ApplyFilingProgressSync === "function") {
        window.PNXStep159ApplyFilingProgressSync();
      }
    } catch(e) {}
  }

  function createFinalDocuments(){
    markDocumentsDone();

    const btn = get("pnx-step163-final-create");
    if (btn) {
      btn.classList.add("is-created");
      btn.textContent = "作成しました";
      setTimeout(function(){
        btn.textContent = "確定申告書類を作成する";
        btn.classList.remove("is-created");
      }, 1300);
    }

    // 実際のPDF/CSV作成機能が既存である場合は、代表PDFを1つだけ起動できるようにする
    // ただし勝手に複数ダウンロードはしない
    const primaryDoc = document.querySelector('#pnx-step144-doc-list [data-pnx-doc="income-expense-general"]');
    if (primaryDoc && primaryDoc.click) {
      setTimeout(function(){
        try { primaryDoc.click(); } catch(e) {}
      }, 120);
    }

    window.__PNX_STEP163_LAST_CREATE__ = new Date().toISOString();
    return true;
  }

  function wrapOpeners(){
    ["PNXStep152cOpenTaxDocumentsStandalonePage", "PNXStep152bOpenTaxDocumentsFromCta", "PNXStep152OpenTaxDocumentsPage"].forEach(name => {
      const fn = window[name];
      if (typeof fn === "function" && !fn.__pnxStep163Wrapped) {
        const wrapped = function(){
          const result = fn.apply(this, arguments);
          setTimeout(ensureFinalCta, 0);
          setTimeout(ensureFinalCta, 160);
          return result;
        };
        wrapped.__pnxStep163Wrapped = true;
        window[name] = wrapped;
      }
    });
  }

  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest("button,a,[role='button']");
    if (!trigger) return;
    const t = String(trigger.textContent || "").replace(/\s+/g, " ").trim();

    if (/申告書類を作成する|申告書類PDF\/CSVを確認/.test(t) || trigger.matches('[data-step148-task="documents"]')) {
      setTimeout(ensureFinalCta, 0);
      setTimeout(ensureFinalCta, 200);
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    wrapOpeners();
    setTimeout(ensureFinalCta, 900);
    setTimeout(ensureFinalCta, 1700);
  });

  window.PNXStep163EnsureTaxDocumentsFinalCta = ensureFinalCta;
  window.PNXStep163CreateFinalTaxDocuments = createFinalDocuments;
  window.PNXStep163TaxDocumentsFinalCtaStatus = function(){
    return {
      step:163,
      pageExists:!!docsPage(),
      finalCardExists:!!get("pnx-step163-final-card"),
      oldNextHidden:!!(get("pnx-step160-next-card") && get("pnx-step160-next-card").classList.contains("pnx-step163-hidden-next-card")),
      documentsDone:localStorage.getItem(DOC_KEY) === "1",
      lastEnsure:window.__PNX_STEP163_LAST_ENSURE__ || null,
      lastCreate:window.__PNX_STEP163_LAST_CREATE__ || null,
      note:"申告書類作成画面の下部を最終ボタン1つに整理"
    };
  };
})();




/* ================================================================
   STEP164: Tax documents task label refined
   目的:
   - やることリスト側の「申告書類を作成する」は重複感があるため
     「申告書類の内容を確認する」に変更
   - 詳細画面の最後だけ「確定申告書類を作成する」として役割を分ける
   ================================================================ */
(function(){
  if (window.__PNX_STEP164_TAX_DOCUMENTS_TASK_LABEL_REFINED__) return;
  window.__PNX_STEP164_TAX_DOCUMENTS_TASK_LABEL_REFINED__ = true;

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  function ensureDocumentsTaskAttr(){
    const list = get("pnx-step148-todo-list") || document.querySelector(".pnx-filing-ref-todo-card");
    if (!list) return;
    Array.from(list.children).forEach(row => {
      const t = text(row);
      if (!row.getAttribute("data-step148-task") && /申告書類|PDF|CSV/.test(t)) {
        row.setAttribute("data-step148-task", "documents");
      }
    });
  }

  function refineDocumentsTaskLabel(){
    ensureDocumentsTaskAttr();

    const rows = Array.from(document.querySelectorAll('[data-step148-task="documents"]'));
    rows.forEach(row => {
      row.classList.add("pnx-step164-documents-task-label");

      let wrap = row.querySelector(".pnx-step153-task-text");
      let strong = row.querySelector(".pnx-step153-task-title") || row.querySelector("strong");
      let small = row.querySelector(".pnx-step153-task-sub") || row.querySelector("small");

      if (!wrap) {
        wrap = document.createElement("span");
        wrap.className = "pnx-step153-task-text pnx-step164-task-text";

        if (strong) {
          strong.replaceWith(wrap);
        } else {
          const circle = row.querySelector(".circle");
          if (circle && circle.nextSibling) row.insertBefore(wrap, circle.nextSibling);
          else row.insertBefore(wrap, row.firstChild);
        }
      }

      wrap.classList.add("pnx-step164-task-text");
      wrap.innerHTML = `
        <strong class="pnx-step153-task-title pnx-step164-task-title">申告書類の内容を確認する</strong>
        <small class="pnx-step153-task-sub pnx-step164-task-sub">PDF・CSVの内容を確認</small>
      `;

      // ステータスは既存の完了/未完了を維持
      const em = row.querySelector("em");
      if (em && /申告書類|作成|確認/.test(text(em)) === false) {
        // 触らない
      }
    });

    // 進捗カードやチェックリスト側も「書類作成」ではなく「書類確認」に寄せる
    document.querySelectorAll(".filing-check-row .fc-text, .pnx-step148d-created-checks b").forEach(el => {
      if (/書類作成|PDF出力/.test(text(el))) {
        el.textContent = "書類確認";
      }
    });

    // 税理士共有前チェックの文言も自然に
    document.querySelectorAll("#pnx-step161-missing-card strong").forEach(el => {
      if (/申告書類PDF\/CSVが未確認です|申告書類/.test(text(el))) {
        el.textContent = "申告書類の内容が未確認です";
      }
    });
    document.querySelectorAll("#pnx-step161-missing-card small").forEach(el => {
      if (/作成できる書類の内容|共有前/.test(text(el))) {
        el.textContent = "共有前に、PDF・CSVの内容を確認してください。";
      }
    });
    document.querySelectorAll('[data-step161-action="documents"]').forEach(btn => {
      btn.textContent = "申告書類を確認する";
    });

    window.__PNX_STEP164_LAST_APPLY__ = new Date().toISOString();
    return rows.length;
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(refineDocumentsTaskLabel, 120);
    setTimeout(refineDocumentsTaskLabel, 600);
    setTimeout(refineDocumentsTaskLabel, 1500);
  });

  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest('.fin-tab[data-tab="filing"], .fin-tab');
    if (tab) {
      setTimeout(refineDocumentsTaskLabel, 150);
      setTimeout(refineDocumentsTaskLabel, 700);
      return;
    }

    const trigger = e.target && e.target.closest && e.target.closest('[data-step148-task], button, a, [role="button"]');
    if (trigger) {
      setTimeout(refineDocumentsTaskLabel, 180);
    }
  }, true);

  // 既存の進捗同期や税理士共有前チェックが描画された後にも再適用
  ["PNXStep159ApplyFilingProgressSync", "PNXStep161RenderTaxAdvisorMissingChecks"].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep164Wrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(refineDocumentsTaskLabel, 0);
        setTimeout(refineDocumentsTaskLabel, 120);
        return result;
      };
      wrapped.__pnxStep164Wrapped = true;
      window[name] = wrapped;
    }
  });

  window.PNXStep164RefineTaxDocumentsTaskLabel = refineDocumentsTaskLabel;
  window.PNXStep164TaxDocumentsTaskLabelStatus = function(){
    const rows = Array.from(document.querySelectorAll('[data-step148-task="documents"]'));
    return {
      step:164,
      documentTaskRows:rows.length,
      titleApplied:rows.some(row => /申告書類の内容を確認する/.test(text(row))),
      subApplied:rows.some(row => /PDF・CSVの内容を確認/.test(text(row))),
      lastApply:window.__PNX_STEP164_LAST_APPLY__ || null,
      note:"やることリストの申告書類項目を確認タスクとして表現"
    };
  };
})();




/* ================================================================
   STEP165: Tax documents content review screen
   目的:
   - 「申告書類の内容を確認する」の中身を作る
   - 確定申告書類を作成する前に、PDF/CSVに入る内容と確認状況を見せる
   - 下部CTAも「申告書類の内容を確認する」に変更
   ================================================================ */
(function(){
  if (window.__PNX_STEP165_TAX_DOCUMENTS_CONTENT_REVIEW__) return;
  window.__PNX_STEP165_TAX_DOCUMENTS_CONTENT_REVIEW__ = true;

  const DOC_KEY = "PNX_FILING_STEP152_DOCUMENTS_CONFIRMED";

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }
  function yen(n){ return "¥" + Number(n || 0).toLocaleString("ja-JP"); }

  function docsPage(){
    return get("pnx-step144-taxdocs");
  }

  function readTxs(){
    try {
      if (typeof window.PNXStep138gGetAllFinanceTransactions === "function") {
        return window.PNXStep138gGetAllFinanceTransactions() || [];
      }
    } catch(e) {}
    try {
      const list = JSON.parse(localStorage.getItem("PNX_FINANCE_TRANSACTIONS") || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function currentYear(){
    const y = get("pnx-step142-year");
    return Number(y && y.value) || new Date().getFullYear();
  }

  function txYear(tx){
    const raw = String((tx && (tx.date || tx.startDate || tx.createdAt)) || "");
    const y = Number(raw.slice(0,4));
    return y || currentYear();
  }

  function txAmount(tx){
    return Math.abs(Number(tx && (tx.amount || tx.value || tx.price || 0)) || 0);
  }

  function txType(tx){
    const t = String((tx && (tx.type || tx.kind || tx.flow || tx.side)) || "").toLowerCase();
    if (t.includes("income") || t.includes("revenue") || t === "in") return "income";
    if (tx && tx.income === true) return "income";
    return "expense";
  }

  function hasReceipt(tx){
    if (!tx) return false;
    if (tx.hasReceipt === true || tx.receiptAttached === true || tx.attachment === true) return true;
    if (Array.isArray(tx.receipts) && tx.receipts.length) return true;
    if (Array.isArray(tx.attachments) && tx.attachments.length) return true;
    const fields = [tx.receiptUrl, tx.receiptImage, tx.receiptImageUrl, tx.fileUrl, tx.attachmentUrl, tx.photoUrl, tx.scanUrl, tx.receiptId, tx.attachmentId];
    return fields.some(v => String(v || "").trim());
  }

  function tournamentName(tx){
    if (!tx) return "";
    const vals = [tx.tournamentName, tx.tournamentTitle, tx.eventName, tx.eventTitle, tx.tournamentLabel, tx.relatedTournament];
    if (tx.tournament && typeof tx.tournament === "object") vals.unshift(tx.tournament.title, tx.tournament.name);
    return vals.map(v => String(v || "").trim()).find(Boolean) || "";
  }

  function collect(){
    const year = currentYear();
    let incomeTotal = 0, expenseTotal = 0, incomeCount = 0, expenseCount = 0;
    let receiptMissing = 0, tournamentLinked = 0;

    readTxs().forEach(tx => {
      if (txYear(tx) !== year) return;
      const amount = txAmount(tx);
      if (!amount) return;

      if (txType(tx) === "income") {
        incomeTotal += amount;
        incomeCount += 1;
      } else {
        expenseTotal += amount;
        expenseCount += 1;
        if (!hasReceipt(tx)) receiptMissing += 1;
      }

      if (tournamentName(tx)) tournamentLinked += 1;
    });

    return {
      year,
      incomeTotal,
      expenseTotal,
      profit: incomeTotal - expenseTotal,
      incomeCount,
      expenseCount,
      receiptMissing,
      tournamentLinked,
      checks: {
        income: localStorage.getItem("PNX_FILING_STEP150_INCOME_CONFIRMED") === "1",
        tournament: localStorage.getItem("PNX_FILING_STEP154_TOURNAMENT_CONFIRMED") === "1",
        expense: localStorage.getItem("PNX_FILING_STEP155_EXPENSE_CONFIRMED") === "1",
        receipt: localStorage.getItem("PNX_FILING_STEP156_RECEIPT_CONFIRMED") === "1",
        rent: localStorage.getItem("PNX_FILING_STEP157_RENT_CONFIRMED") === "1"
      }
    };
  }

  function updateEntryButtons(){
    // 申告トップ下部の青ボタンも確認ボタンにする
    const candidates = Array.from(document.querySelectorAll("button, a, [role='button']")).filter(el =>
      /申告書類を作成する（PDF\/CSV）|申告書類を作成する/.test(text(el)) &&
      !el.closest("#pnx-step144-taxdocs")
    );

    candidates.forEach(el => {
      el.classList.add("pnx-step165-review-entry-button");
      el.textContent = "申告書類の内容を確認する";
    });
  }

  function updateHeader(){
    const page = docsPage();
    if (!page) return;

    const heads = page.querySelectorAll("#pnx-step152c-docs-head h2, #pnx-step152-docs-head h2");
    heads.forEach(h => h.textContent = "申告書類の内容を確認する");
  }

  function ensureIntroReview(){
    const page = docsPage();
    if (!page || get("pnx-step165-review-summary")) return;

    const summary = document.createElement("article");
    summary.id = "pnx-step165-review-summary";
    summary.className = "pnx-step165-review-summary";
    summary.innerHTML = `
      <p class="pnx-step165-kicker">Review</p>
      <h3>この内容で申告書類を作成します</h3>
      <p>収入・経費・レシート・大会別収支に間違いがないか確認してください。</p>
      <div class="pnx-step165-summary-grid">
        <div><span>収入</span><strong id="pnx-step165-income-total">¥0</strong></div>
        <div><span>経費</span><strong id="pnx-step165-expense-total">¥0</strong></div>
        <div><span>差引</span><strong id="pnx-step165-profit-total">¥0</strong></div>
      </div>
    `;

    const guide = get("pnx-step160-guide-card");
    const firstCard = page.querySelector(".pnx-taxdocs-card");
    if (guide && guide.parentNode) {
      guide.parentNode.insertBefore(summary, guide);
    } else if (firstCard && firstCard.parentNode) {
      firstCard.parentNode.insertBefore(summary, firstCard);
    } else {
      page.appendChild(summary);
    }
  }

  function ensureIncludedCard(){
    const page = docsPage();
    if (!page || get("pnx-step165-included-card")) return;

    const card = document.createElement("article");
    card.id = "pnx-step165-included-card";
    card.className = "pnx-step165-included-card";
    card.innerHTML = `
      <div class="pnx-step165-card-head">
        <h3>書類に入る内容</h3>
        <p>PDF・CSVに含まれるデータです。</p>
      </div>
      <div class="pnx-step165-included-list">
        <div><span>✓</span><strong>収入一覧</strong><small id="pnx-step165-income-count">0件</small></div>
        <div><span>✓</span><strong>経費一覧</strong><small id="pnx-step165-expense-count">0件</small></div>
        <div><span>✓</span><strong>大会別収支</strong><small id="pnx-step165-tournament-count">0件</small></div>
        <div><span>✓</span><strong>レシート確認状況</strong><small id="pnx-step165-receipt-status">OK</small></div>
        <div><span>✓</span><strong>年間収支サマリー</strong><small id="pnx-step165-year-label">今年</small></div>
      </div>
    `;

    const docCard = page.querySelector(".pnx-taxdocs-card");
    const finalCard = get("pnx-step163-final-card");

    if (docCard && docCard.parentNode) {
      docCard.parentNode.insertBefore(card, docCard);
    } else if (finalCard && finalCard.parentNode) {
      finalCard.parentNode.insertBefore(card, finalCard);
    } else {
      page.appendChild(card);
    }
  }

  function ensureCheckCard(){
    const page = docsPage();
    if (!page || get("pnx-step165-check-card")) return;

    const card = document.createElement("article");
    card.id = "pnx-step165-check-card";
    card.className = "pnx-step165-check-card";
    card.innerHTML = `
      <div class="pnx-step165-card-head">
        <h3>確認状況</h3>
        <p>作成前に完了している項目を確認します。</p>
      </div>
      <div class="pnx-step165-check-list" id="pnx-step165-check-list"></div>
    `;

    const docCard = page.querySelector(".pnx-taxdocs-card");
    if (docCard && docCard.parentNode) {
      docCard.parentNode.insertBefore(card, docCard);
    } else {
      page.appendChild(card);
    }
  }

  function updateReviewData(){
    const data = collect();

    const incomeTotal = get("pnx-step165-income-total");
    const expenseTotal = get("pnx-step165-expense-total");
    const profitTotal = get("pnx-step165-profit-total");
    if (incomeTotal) incomeTotal.textContent = yen(data.incomeTotal);
    if (expenseTotal) expenseTotal.textContent = yen(data.expenseTotal);
    if (profitTotal) {
      profitTotal.textContent = yen(data.profit);
      profitTotal.classList.toggle("is-minus", data.profit < 0);
    }

    const incomeCount = get("pnx-step165-income-count");
    const expenseCount = get("pnx-step165-expense-count");
    const tournamentCount = get("pnx-step165-tournament-count");
    const receiptStatus = get("pnx-step165-receipt-status");
    const yearLabel = get("pnx-step165-year-label");

    if (incomeCount) incomeCount.textContent = `${data.incomeCount}件`;
    if (expenseCount) expenseCount.textContent = `${data.expenseCount}件`;
    if (tournamentCount) tournamentCount.textContent = `${data.tournamentLinked}件`;
    if (receiptStatus) receiptStatus.textContent = data.receiptMissing ? `不足 ${data.receiptMissing}件` : "不足なし";
    if (yearLabel) yearLabel.textContent = `${data.year}年`;

    const checkList = get("pnx-step165-check-list");
    if (checkList) {
      const checks = [
        ["収入確認済み", "賞金・スポンサー料など", data.checks.income],
        ["大会収支確認済み", "大会別の収入・経費", data.checks.tournament],
        ["経費分類済み", "交通費・宿泊費など", data.checks.expense],
        ["レシート確認済み", data.receiptMissing ? `不足 ${data.receiptMissing}件` : "不足なし", data.checks.receipt && data.receiptMissing === 0],
        ["家賃按分確認済み", "該当する場合のみ", data.checks.rent]
      ];

      checkList.innerHTML = "";
      checks.forEach(([title, sub, ok]) => {
        const row = document.createElement("div");
        row.className = "pnx-step165-check-row " + (ok ? "is-ok" : "is-warn");
        row.innerHTML = `
          <span>${ok ? "✓" : "未"}</span>
          <div>
            <strong>${title}</strong>
            <small>${sub}</small>
          </div>
        `;
        checkList.appendChild(row);
      });
    }

    window.__PNX_STEP165_LAST_DATA__ = {
      at:new Date().toISOString(),
      year:data.year,
      incomeTotal:data.incomeTotal,
      expenseTotal:data.expenseTotal,
      receiptMissing:data.receiptMissing
    };
  }

  function updateDocScreenTexts(){
    const page = docsPage();
    if (!page) return;

    page.classList.add("pnx-step165-content-review-mode");

    const guide = get("pnx-step160-guide-card");
    if (guide) {
      const h3 = guide.querySelector("h3");
      const flow = guide.querySelector(".pnx-step160-flow");
      const kicker = guide.querySelector(".pnx-step160-kicker");
      if (kicker) kicker.textContent = "Check";
      if (h3) h3.textContent = "PDF・CSVに入る内容を確認します";
      if (flow) {
        flow.innerHTML = `
          <span>1. 内容を確認</span>
          <i>›</i>
          <span>2. 書類を選ぶ</span>
          <i>›</i>
          <span>3. 最後に作成</span>
        `;
      }
    }

    const finalHead = page.querySelector("#pnx-step163-final-card .pnx-step163-final-head h3");
    const finalText = page.querySelector("#pnx-step163-final-card .pnx-step163-final-head p");
    if (finalHead) finalHead.textContent = "確認が終わったら作成します";
    if (finalText) finalText.textContent = "上の内容に問題がなければ、確定申告書類として作成します。";

    const finalBtn = get("pnx-step163-final-create");
    if (finalBtn) finalBtn.textContent = "確定申告書類を作成する";
  }

  function buildReviewScreen(){
    updateEntryButtons();
    updateHeader();

    const page = docsPage();
    if (!page) return false;

    ensureIntroReview();
    ensureIncludedCard();
    ensureCheckCard();
    updateDocScreenTexts();
    updateReviewData();

    window.__PNX_STEP165_LAST_BUILD__ = new Date().toISOString();
    return true;
  }

  function wrapOpeners(){
    ["PNXStep152cOpenTaxDocumentsStandalonePage", "PNXStep152bOpenTaxDocumentsFromCta", "PNXStep152OpenTaxDocumentsPage"].forEach(name => {
      const fn = window[name];
      if (typeof fn === "function" && !fn.__pnxStep165Wrapped) {
        const wrapped = function(){
          const result = fn.apply(this, arguments);
          setTimeout(buildReviewScreen, 0);
          setTimeout(buildReviewScreen, 180);
          return result;
        };
        wrapped.__pnxStep165Wrapped = true;
        window[name] = wrapped;
      }
    });
  }

  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest("button,a,[role='button']");
    if (!trigger) return;
    const t = text(trigger);

    if (/申告書類の内容を確認する|申告書類を作成する|申告書類PDF\/CSVを確認/.test(t) || trigger.matches('[data-step148-task="documents"]')) {
      setTimeout(buildReviewScreen, 0);
      setTimeout(buildReviewScreen, 200);
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    wrapOpeners();
    setTimeout(buildReviewScreen, 500);
    setTimeout(buildReviewScreen, 1400);
  });

  window.addEventListener("storage", function(e){
    if (!e.key || e.key.indexOf("PNX_FILING_STEP") === 0 || e.key === "PNX_FINANCE_TRANSACTIONS") {
      setTimeout(updateReviewData, 120);
    }
  });

  window.PNXStep165BuildTaxDocumentsContentReview = buildReviewScreen;
  window.PNXStep165UpdateTaxDocumentsReviewData = updateReviewData;
  window.PNXStep165TaxDocumentsContentReviewStatus = function(){
    return {
      step:165,
      pageExists:!!docsPage(),
      mode:!!(docsPage() && docsPage().classList.contains("pnx-step165-content-review-mode")),
      reviewSummary:!!get("pnx-step165-review-summary"),
      includedCard:!!get("pnx-step165-included-card"),
      checkCard:!!get("pnx-step165-check-card"),
      entryButtons:Array.from(document.querySelectorAll(".pnx-step165-review-entry-button")).length,
      lastBuild:window.__PNX_STEP165_LAST_BUILD__ || null,
      lastData:window.__PNX_STEP165_LAST_DATA__ || null,
      note:"申告書類作成前の内容確認画面"
    };
  };
})();




/* ================================================================
   STEP165b: Tax documents review layout fix
   目的:
   - STEP165の申告書類内容確認画面のレイアウト崩れを修正
   - 重複挿入を防止し、カード順序・幅・タイトルを安定化
   ================================================================ */
(function(){
  if (window.__PNX_STEP165B_TAX_DOCUMENTS_REVIEW_LAYOUT_FIX__) return;
  window.__PNX_STEP165B_TAX_DOCUMENTS_REVIEW_LAYOUT_FIX__ = true;

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  function docsPage(){
    return get("pnx-step144-taxdocs");
  }

  function dedupeById(id){
    const nodes = Array.from(document.querySelectorAll("#" + id));
    nodes.forEach((node, i) => {
      if (i > 0) node.remove();
    });
    return nodes.length;
  }

  function ensureOrder(){
    const page = docsPage();
    if (!page) return false;

    const head = get("pnx-step152c-docs-head") || get("pnx-step152-docs-head");
    const review = get("pnx-step165-review-summary");
    const included = get("pnx-step165-included-card");
    const check = get("pnx-step165-check-card");
    const guide = get("pnx-step160-guide-card");
    const docCard = page.querySelector(".pnx-taxdocs-card");
    const finalCard = get("pnx-step163-final-card");

    // 正しい順番に並べ直す
    const ordered = [head, review, included, check, guide, docCard, finalCard].filter(Boolean);
    ordered.forEach(node => {
      if (node.parentNode === page) page.appendChild(node);
      else page.appendChild(node);
    });

    return true;
  }

  function cleanup(){
    const page = docsPage();
    if (!page) return false;

    page.classList.add("pnx-step165b-layout-fixed");

    [
      "pnx-step165-review-summary",
      "pnx-step165-included-card",
      "pnx-step165-check-card",
      "pnx-step160-guide-card",
      "pnx-step163-final-card",
      "pnx-step152c-docs-head",
      "pnx-step152-docs-head"
    ].forEach(dedupeById);

    // 古いヘッダーが残って二重にならないようにする
    const newHead = get("pnx-step152c-docs-head");
    const oldHead = get("pnx-step152-docs-head");
    if (newHead && oldHead && newHead !== oldHead) oldHead.remove();

    const h2 = page.querySelector("#pnx-step152c-docs-head h2, #pnx-step152-docs-head h2");
    if (h2) h2.textContent = "申告書類の内容を確認する";

    // 3列サマリーの金額が長いと崩れるので、表示を安定させる
    Array.from(page.querySelectorAll(".pnx-step165-summary-grid strong")).forEach(el => {
      el.setAttribute("title", text(el));
    });

    // 書類カードの表示文言が長すぎて横幅を押すのを防ぐ
    Array.from(page.querySelectorAll(".pnx-step160-doc-row, #pnx-step144-doc-list [data-pnx-doc]")).forEach(row => {
      row.classList.add("pnx-step165b-safe-row");
    });

    ensureOrder();

    window.__PNX_STEP165B_LAST_CLEANUP__ = new Date().toISOString();
    return true;
  }

  ["PNXStep165BuildTaxDocumentsContentReview", "PNXStep160RefineTaxDocumentsScreen", "PNXStep163EnsureTaxDocumentsFinalCta"].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep165bWrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(cleanup, 0);
        setTimeout(cleanup, 120);
        return result;
      };
      wrapped.__pnxStep165bWrapped = true;
      window[name] = wrapped;
    }
  });

  ["PNXStep152cOpenTaxDocumentsStandalonePage", "PNXStep152bOpenTaxDocumentsFromCta", "PNXStep152OpenTaxDocumentsPage"].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep165bOpenWrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(cleanup, 40);
        setTimeout(cleanup, 220);
        return result;
      };
      wrapped.__pnxStep165bOpenWrapped = true;
      window[name] = wrapped;
    }
  });

  document.addEventListener("click", function(e){
    const btn = e.target && e.target.closest && e.target.closest("button,a,[role='button']");
    if (!btn) return;
    if (/申告書類の内容を確認する|申告書類を作成する|申告書類PDF\/CSVを確認/.test(text(btn)) || btn.matches('[data-step148-task="documents"]')) {
      setTimeout(cleanup, 80);
      setTimeout(cleanup, 260);
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(cleanup, 700);
    setTimeout(cleanup, 1600);
  });

  window.PNXStep165bFixTaxDocumentsReviewLayout = cleanup;
  window.PNXStep165bTaxDocumentsReviewLayoutStatus = function(){
    const page = docsPage();
    return {
      step:"165b",
      pageExists:!!page,
      layoutFixed:!!(page && page.classList.contains("pnx-step165b-layout-fixed")),
      reviewSummaryCount:document.querySelectorAll("#pnx-step165-review-summary").length,
      includedCardCount:document.querySelectorAll("#pnx-step165-included-card").length,
      checkCardCount:document.querySelectorAll("#pnx-step165-check-card").length,
      finalCardCount:document.querySelectorAll("#pnx-step163-final-card").length,
      lastCleanup:window.__PNX_STEP165B_LAST_CLEANUP__ || null,
      note:"申告書類内容確認画面のカード幅・順序・重複を修正"
    };
  };
})();




/* ================================================================
   STEP165c: Filing task row structure fix
   目的:
   - やること一覧の一部行で旧small要素や旧テキストが残り、
     タイトル/説明が二重表示・縦崩れする問題を修正
   - 特に「申告書類の内容を確認する」「税理士へ共有する」を安定化
   ================================================================ */
(function(){
  if (window.__PNX_STEP165C_TASK_ROW_STRUCTURE_FIX__) return;
  window.__PNX_STEP165C_TASK_ROW_STRUCTURE_FIX__ = true;

  function text(el){ return String(el && el.textContent || '').replace(/\s+/g,' ').trim(); }

  function normalizeRow(row){
    if (!row) return false;
    const circle = row.querySelector('.circle');
    const wrap = row.querySelector('.pnx-step153-task-text') || row.querySelector('.pnx-step164-task-text');
    const em = row.querySelector('em');
    const icon = row.querySelector('i');
    if (!circle || !wrap) return false;

    // 行直下に残っている旧 strong / small / text node を除去し、構造を固定する
    Array.from(row.childNodes).forEach(node => {
      if (node === circle || node === wrap || node === em || node === icon) return;
      if (node.nodeType === 3) {
        if (!String(node.textContent || '').trim()) node.remove();
        else node.remove();
        return;
      }
      if (node.nodeType === 1) node.remove();
    });

    // wrap 内も strong/small 以外を整理
    Array.from(wrap.childNodes).forEach(node => {
      if (node.nodeType === 3) {
        if (!String(node.textContent || '').trim()) node.remove();
        return;
      }
      if (node.nodeType === 1 && !node.matches('strong,small')) {
        node.remove();
      }
    });

    // 必要なら small を補完
    const strong = wrap.querySelector('strong');
    let small = wrap.querySelector('small');
    const key = row.getAttribute('data-step148-task') || '';
    if (!small && strong) {
      small = document.createElement('small');
      small.className = 'pnx-step153-task-sub';
      if (key === 'documents') small.textContent = 'PDF・CSVの内容を確認';
      else if (key === 'share') small.textContent = '確認用データをまとめて共有';
      else if (key === 'rent') small.textContent = '該当する場合だけ設定';
      wrap.appendChild(small);
    }

    // 順序を固定
    row.appendChild(circle);
    row.appendChild(wrap);
    if (em) row.appendChild(em);
    if (icon) row.appendChild(icon);
    row.classList.add('pnx-step165c-row-fixed');
    return true;
  }

  function apply(){
    const rows = Array.from(document.querySelectorAll('[data-step148-task="documents"], [data-step148-task="share"], [data-step148-task="rent"]'));
    let fixed=0;
    rows.forEach(row => { if (normalizeRow(row)) fixed += 1; });
    window.__PNX_STEP165C_LAST_APPLY__ = new Date().toISOString();
    return fixed;
  }

  ['PNXStep164RefineTaxDocumentsTaskLabel','PNXStep153ApplyFilingTaskLabels','PNXStep159ApplyFilingProgressSync','PNXStep165bFixTaxDocumentsReviewLayout'].forEach(name=>{
    const fn = window[name];
    if (typeof fn === 'function' && !fn.__pnxStep165cWrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(apply,0);
        setTimeout(apply,120);
        return result;
      };
      wrapped.__pnxStep165cWrapped = true;
      window[name] = wrapped;
    }
  });

  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(apply,150);
    setTimeout(apply,700);
    setTimeout(apply,1600);
  });

  document.addEventListener('click', function(e){
    const trigger = e.target && e.target.closest && e.target.closest('[data-step148-task], button, a, [role="button"], .fin-tab');
    if (trigger) {
      setTimeout(apply,80);
      setTimeout(apply,260);
    }
  }, true);

  window.PNXStep165cFixFilingTaskRows = apply;
  window.PNXStep165cFilingTaskRowsStatus = function(){
    const rows = Array.from(document.querySelectorAll('[data-step148-task="documents"], [data-step148-task="share"], [data-step148-task="rent"]'));
    return {
      step: '165c',
      rows: rows.length,
      docsRows: rows.filter(r => r.getAttribute('data-step148-task') === 'documents').length,
      shareRows: rows.filter(r => r.getAttribute('data-step148-task') === 'share').length,
      rentRows: rows.filter(r => r.getAttribute('data-step148-task') === 'rent').length,
      fixed: rows.filter(r => r.classList.contains('pnx-step165c-row-fixed')).length,
      lastApply: window.__PNX_STEP165C_LAST_APPLY__ || null,
      note: 'やること一覧の重複テキスト/縦崩れを修正'
    };
  };
})();




/* ================================================================
   STEP165d: Documents task row hard rebuild
   目的:
   - やること一覧の「申告書類の内容を確認する」行で
     古い文字ブロックが残り、左に縦割れ表示される問題を完全修正
   - 該当行だけ innerHTML を正しい4列構造に作り直す
   ================================================================ */
(function(){
  if (window.__PNX_STEP165D_DOCUMENTS_TASK_ROW_REBUILD__) return;
  window.__PNX_STEP165D_DOCUMENTS_TASK_ROW_REBUILD__ = true;

  const DOC_KEY = "PNX_FILING_STEP152_DOCUMENTS_CONFIRMED";

  function text(el){
    return String(el && el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function isDone(row){
    const em = row && row.querySelector && row.querySelector("em");
    return localStorage.getItem(DOC_KEY) === "1" ||
      !!(em && (em.classList.contains("done") || /完了/.test(text(em))));
  }

  function findTodoList(){
    return document.getElementById("pnx-step148-todo-list") ||
      document.querySelector(".pnx-filing-ref-todo-card");
  }

  function findDocumentRows(){
    const list = findTodoList();
    if (!list) return [];

    const rows = Array.from(list.querySelectorAll("[data-step148-task='documents'], .pnx-filing-ref-todo-row, button"));
    return rows.filter(row => {
      if (!row || row.closest("#pnx-step144-taxdocs")) return false;
      if (row.getAttribute("data-step148-task") === "documents") return true;
      const t = text(row);
      return /申告書類/.test(t) && /PDF|CSV|内容|作成/.test(t);
    });
  }

  function rebuildRow(row){
    if (!row) return false;

    const done = isDone(row);
    const statusText = done ? "完了" : "未完了";
    const statusClass = done ? "done" : "warn";
    const circleClass = done ? "done" : "empty";
    const circleText = done ? "✓" : "";

    row.setAttribute("data-step148-task", "documents");
    if (row.tagName === "BUTTON" && !row.getAttribute("type")) row.setAttribute("type", "button");

    row.classList.add(
      "pnx-filing-ref-todo-row",
      "pnx-step153-task-row",
      "pnx-step164-documents-task-label",
      "pnx-step165d-doc-row"
    );

    row.innerHTML = `
      <span class="circle ${circleClass}">${circleText}</span>
      <span class="pnx-step153-task-text pnx-step164-task-text pnx-step165d-task-text">
        <strong class="pnx-step153-task-title pnx-step164-task-title">申告書類の内容を確認する</strong>
        <small class="pnx-step153-task-sub pnx-step164-task-sub">PDF・CSVの内容を確認</small>
      </span>
      <em class="${statusClass}">${statusText}</em>
      <i>›</i>
    `;

    return true;
  }

  function rebuild(){
    const list = findTodoList();
    if (!list) return 0;

    const rows = findDocumentRows();
    let rebuilt = 0;

    rows.forEach((row, index) => {
      if (index === 0) {
        if (rebuildRow(row)) rebuilt += 1;
      } else {
        // もし重複行ができていたら消す
        row.remove();
      }
    });

    window.__PNX_STEP165D_LAST_REBUILD__ = {
      at:new Date().toISOString(),
      rebuilt,
      found:rows.length
    };

    return rebuilt;
  }

  // 既存の描画処理が後から走っても、最後に必ず作り直す
  [
    "PNXStep153ApplyFilingTaskLabels",
    "PNXStep164RefineTaxDocumentsTaskLabel",
    "PNXStep159ApplyFilingProgressSync",
    "PNXStep165cFixFilingTaskRows"
  ].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep165dWrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(rebuild, 0);
        setTimeout(rebuild, 160);
        return result;
      };
      wrapped.__pnxStep165dWrapped = true;
      window[name] = wrapped;
    }
  });

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(rebuild, 100);
    setTimeout(rebuild, 500);
    setTimeout(rebuild, 1300);
    setTimeout(rebuild, 2300);
  });

  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest("[data-step148-task], button, a, [role='button'], .fin-tab");
    if (trigger) {
      setTimeout(rebuild, 80);
      setTimeout(rebuild, 280);
    }
  }, true);

  window.PNXStep165dRebuildDocumentsTaskRow = rebuild;
  window.PNXStep165dDocumentsTaskRowStatus = function(){
    const rows = findDocumentRows();
    const row = rows[0] || null;
    return {
      step:"165d",
      rows:rows.length,
      rebuilt:!!(row && row.classList.contains("pnx-step165d-doc-row")),
      directChildren:row ? Array.from(row.children).map(el => el.tagName + "." + String(el.className || "")) : [],
      text:row ? text(row) : "",
      lastRebuild:window.__PNX_STEP165D_LAST_REBUILD__ || null,
      note:"申告書類の内容確認行を正しい4列構造に丸ごと再構築"
    };
  };
})();




/* ================================================================
   STEP165e: Restore primary documents CTA label
   目的:
   - やることリストは「申告書類の内容を確認する」
   - 下部の青いメインCTAは「申告書類を作成する（PDF/CSV）」に戻す
   - ただし押した先は今まで通り、内容確認画面を開く
   ================================================================ */
(function(){
  if (window.__PNX_STEP165E_RESTORE_PRIMARY_DOCUMENTS_CTA__) return;
  window.__PNX_STEP165E_RESTORE_PRIMARY_DOCUMENTS_CTA__ = true;

  function text(el){
    return String(el && el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function isPrimaryDocumentsCta(el){
    if (!el || el.closest("#pnx-step144-taxdocs")) return false;
    const t = text(el);
    const cls = String(el.className || "");
    const id = String(el.id || "");

    // やることリストの行は対象外
    if (el.closest("[data-step148-task='documents']")) return false;
    if (el.matches("[data-step148-task='documents']")) return false;

    return (
      id === "pnx-step148-start-flow" ||
      id === "pnx-step149-create-tax-docs" ||
      cls.includes("pnx-filing-ref-primary") ||
      cls.includes("pnx-step165-review-entry-button") ||
      /申告書類の内容を確認する|申告書類を作成する（PDF\/CSV）/.test(t)
    );
  }

  function restore(){
    const buttons = Array.from(document.querySelectorAll("button, a, [role='button']"))
      .filter(isPrimaryDocumentsCta);

    buttons.forEach(btn => {
      btn.classList.add("pnx-step165e-primary-documents-cta");
      btn.classList.remove("pnx-step165-review-entry-button");
      btn.textContent = "申告書類を作成する（PDF/CSV）";
      btn.setAttribute("data-pnx-primary-documents-cta", "true");
    });

    window.__PNX_STEP165E_LAST_RESTORE__ = {
      at:new Date().toISOString(),
      count:buttons.length
    };

    return buttons.length;
  }

  // STEP165の処理が青ボタンをまた変える可能性があるため、後勝ちで戻す
  ["PNXStep165BuildTaxDocumentsContentReview", "PNXStep164RefineTaxDocumentsTaskLabel", "PNXStep159ApplyFilingProgressSync", "PNXStep165dRebuildDocumentsTaskRow"].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep165eWrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(restore, 0);
        setTimeout(restore, 160);
        return result;
      };
      wrapped.__pnxStep165eWrapped = true;
      window[name] = wrapped;
    }
  });

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(restore, 100);
    setTimeout(restore, 600);
    setTimeout(restore, 1500);
  });

  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest("button, a, [role='button'], .fin-tab");
    if (trigger) {
      setTimeout(restore, 80);
      setTimeout(restore, 260);
    }
  }, true);

  window.PNXStep165eRestorePrimaryDocumentsCta = restore;
  window.PNXStep165ePrimaryDocumentsCtaStatus = function(){
    const buttons = Array.from(document.querySelectorAll("[data-pnx-primary-documents-cta='true']"));
    return {
      step:"165e",
      buttons:buttons.length,
      labels:buttons.map(text),
      lastRestore:window.__PNX_STEP165E_LAST_RESTORE__ || null,
      note:"下部青CTAだけ申告書類を作成する（PDF/CSV）に戻す"
    };
  };
})();




/* ================================================================
   STEP166: Tax documents review completed screen
   目的:
   - やることリスト「申告書類の内容を確認する」の中身を完成形にする
   - 既存のSTEP160/165で増えたカードは表示崩れ防止のため非表示
   - このSTEP166の専用1画面で、内容確認 → 最終作成まで完結
   ================================================================ */
(function(){
  if (window.__PNX_STEP166_TAX_DOCUMENTS_REVIEW_COMPLETED__) return;
  window.__PNX_STEP166_TAX_DOCUMENTS_REVIEW_COMPLETED__ = true;

  const DOC_KEY = "PNX_FILING_STEP152_DOCUMENTS_CONFIRMED";

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }
  function yen(n){ return "¥" + Number(n || 0).toLocaleString("ja-JP"); }

  function docsPage(){
    return get("pnx-step144-taxdocs");
  }

  function readTxs(){
    try {
      if (typeof window.PNXStep138gGetAllFinanceTransactions === "function") {
        return window.PNXStep138gGetAllFinanceTransactions() || [];
      }
    } catch(e) {}

    try {
      const list = JSON.parse(localStorage.getItem("PNX_FINANCE_TRANSACTIONS") || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function currentYear(){
    const y = get("pnx-step142-year");
    return Number(y && y.value) || new Date().getFullYear();
  }

  function txYear(tx){
    const raw = String((tx && (tx.date || tx.startDate || tx.createdAt)) || "");
    const y = Number(raw.slice(0,4));
    return y || currentYear();
  }

  function txAmount(tx){
    return Math.abs(Number(tx && (tx.amount || tx.value || tx.price || 0)) || 0);
  }

  function txType(tx){
    const t = String((tx && (tx.type || tx.kind || tx.flow || tx.side)) || "").toLowerCase();
    if (t.includes("income") || t.includes("revenue") || t === "in") return "income";
    if (tx && tx.income === true) return "income";
    return "expense";
  }

  function hasReceipt(tx){
    if (!tx) return false;
    if (tx.hasReceipt === true || tx.receiptAttached === true || tx.attachment === true) return true;
    if (Array.isArray(tx.receipts) && tx.receipts.length) return true;
    if (Array.isArray(tx.attachments) && tx.attachments.length) return true;

    const fields = [
      tx.receiptUrl,
      tx.receiptImage,
      tx.receiptImageUrl,
      tx.fileUrl,
      tx.attachmentUrl,
      tx.photoUrl,
      tx.scanUrl,
      tx.receiptId,
      tx.attachmentId
    ];
    return fields.some(v => String(v || "").trim());
  }

  function tournamentName(tx){
    if (!tx) return "";
    const vals = [
      tx.tournamentName,
      tx.tournamentTitle,
      tx.eventName,
      tx.eventTitle,
      tx.tournamentLabel,
      tx.relatedTournament
    ];

    if (tx.tournament && typeof tx.tournament === "object") {
      vals.unshift(tx.tournament.title, tx.tournament.name);
    }

    return vals.map(v => String(v || "").trim()).find(Boolean) || "";
  }

  function collect(){
    const year = currentYear();
    let incomeTotal = 0;
    let expenseTotal = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    let receiptMissing = 0;
    let receiptAttached = 0;
    let tournamentLinked = 0;

    readTxs().forEach(tx => {
      if (txYear(tx) !== year) return;

      const amount = txAmount(tx);
      if (!amount) return;

      if (txType(tx) === "income") {
        incomeTotal += amount;
        incomeCount += 1;
      } else {
        expenseTotal += amount;
        expenseCount += 1;
        if (hasReceipt(tx)) receiptAttached += 1;
        else receiptMissing += 1;
      }

      if (tournamentName(tx)) tournamentLinked += 1;
    });

    const checks = [
      {
        id:"income",
        title:"収入確認",
        sub:"賞金・スポンサー料など",
        ok:localStorage.getItem("PNX_FILING_STEP150_INCOME_CONFIRMED") === "1"
      },
      {
        id:"tournament",
        title:"大会収支確認",
        sub:"大会別の収入・経費",
        ok:localStorage.getItem("PNX_FILING_STEP154_TOURNAMENT_CONFIRMED") === "1"
      },
      {
        id:"expense",
        title:"経費分類",
        sub:"交通費・宿泊費など",
        ok:localStorage.getItem("PNX_FILING_STEP155_EXPENSE_CONFIRMED") === "1"
      },
      {
        id:"receipt",
        title:"レシート確認",
        sub:receiptMissing ? `不足 ${receiptMissing}件` : "不足なし",
        ok:localStorage.getItem("PNX_FILING_STEP156_RECEIPT_CONFIRMED") === "1" && receiptMissing === 0
      },
      {
        id:"rent",
        title:"家賃按分",
        sub:"該当する場合のみ",
        ok:localStorage.getItem("PNX_FILING_STEP157_RENT_CONFIRMED") === "1",
        optional:true
      }
    ];

    return {
      year,
      incomeTotal,
      expenseTotal,
      profit:incomeTotal - expenseTotal,
      incomeCount,
      expenseCount,
      receiptMissing,
      receiptAttached,
      tournamentLinked,
      checks
    };
  }

  function hideLegacyCards(){
    const page = docsPage();
    if (!page) return;

    [
      "pnx-step165-review-summary",
      "pnx-step165-included-card",
      "pnx-step165-check-card",
      "pnx-step160-guide-card",
      "pnx-step163-final-card",
      "pnx-step160-next-card"
    ].forEach(id => {
      const el = get(id);
      if (el) el.classList.add("pnx-step166-legacy-hidden");
    });

    const legacyCards = page.querySelectorAll(".pnx-taxdocs-card, .pnx-taxdocs-etax, .pnx-taxdocs-deadline");
    legacyCards.forEach(el => el.classList.add("pnx-step166-legacy-hidden"));
  }

  function ensureRoot(){
    const page = docsPage();
    if (!page) return null;

    let root = get("pnx-step166-review-root");
    if (root) return root;

    root = document.createElement("section");
    root.id = "pnx-step166-review-root";
    root.className = "pnx-step166-review-root";
    root.innerHTML = `
      <article class="pnx-step166-hero-card">
        <p class="pnx-step166-kicker">Review</p>
        <h3>この内容で申告書類を作成します</h3>
        <p>収入・経費・レシート・大会別収支に間違いがないか確認してください。</p>
      </article>

      <article class="pnx-step166-card">
        <div class="pnx-step166-card-head">
          <h3>年間収支サマリー</h3>
          <p id="pnx-step166-year-label">今年の収支</p>
        </div>
        <div class="pnx-step166-summary-list">
          <div>
            <span>収入合計</span>
            <strong class="blue" id="pnx-step166-income-total">¥0</strong>
          </div>
          <div>
            <span>経費合計</span>
            <strong class="red" id="pnx-step166-expense-total">¥0</strong>
          </div>
          <div>
            <span>差引利益</span>
            <strong class="green" id="pnx-step166-profit-total">¥0</strong>
          </div>
        </div>
      </article>

      <article class="pnx-step166-card">
        <div class="pnx-step166-card-head">
          <h3>書類に入る内容</h3>
          <p>PDF・CSVに含めるデータです。</p>
        </div>
        <div class="pnx-step166-included-list" id="pnx-step166-included-list"></div>
      </article>

      <article class="pnx-step166-card">
        <div class="pnx-step166-card-head">
          <h3>確認状況</h3>
          <p>作成前に確認済みの項目です。</p>
        </div>
        <div class="pnx-step166-check-list" id="pnx-step166-check-list"></div>
      </article>

      <article class="pnx-step166-card">
        <div class="pnx-step166-card-head">
          <h3>作成できる書類</h3>
          <p>最後の作成ボタンで、申告に使うPDF・CSVを保存します。</p>
        </div>
        <div class="pnx-step166-doc-list" id="pnx-step166-doc-list"></div>
      </article>

      <article class="pnx-step166-final-card">
        <p class="pnx-step166-kicker">Final</p>
        <h3>確認が終わったら作成します</h3>
        <p>上の内容に問題がなければ、確定申告書類として作成します。</p>
        <button type="button" id="pnx-step166-final-create">確定申告書類を作成する</button>
        <small>作成後は、やること一覧の「税理士へ共有する」から共有に進めます。</small>
      </article>
    `;

    const head = get("pnx-step152c-docs-head") || get("pnx-step152-docs-head");
    if (head && head.parentNode === page) {
      head.insertAdjacentElement("afterend", root);
    } else {
      page.insertBefore(root, page.firstElementChild);
    }

    const btn = root.querySelector("#pnx-step166-final-create");
    if (btn && !btn.__pnxStep166Bound) {
      btn.__pnxStep166Bound = true;
      btn.addEventListener("click", function(e){
        e.preventDefault();
        createFinalDocuments();
      }, true);
    }

    return root;
  }

  function rowHTML(status, title, sub, value){
    return `
      <div class="pnx-step166-row ${status}">
        <span>${status === "ok" ? "✓" : status === "warn" ? "!" : "•"}</span>
        <div>
          <strong>${title}</strong>
          <small>${sub}</small>
        </div>
        ${value ? `<em>${value}</em>` : ""}
      </div>
    `;
  }

  function render(){
    const page = docsPage();
    if (!page) return false;

    page.classList.add("pnx-step166-review-completed-mode");
    hideLegacyCards();

    const h2 = page.querySelector("#pnx-step152c-docs-head h2, #pnx-step152-docs-head h2");
    if (h2) h2.textContent = "申告書類の内容を確認する";

    const root = ensureRoot();
    if (!root) return false;

    const data = collect();

    const year = get("pnx-step166-year-label");
    const income = get("pnx-step166-income-total");
    const expense = get("pnx-step166-expense-total");
    const profit = get("pnx-step166-profit-total");

    if (year) year.textContent = `${data.year}年の収支`;
    if (income) income.textContent = yen(data.incomeTotal);
    if (expense) expense.textContent = yen(data.expenseTotal);
    if (profit) {
      profit.textContent = yen(data.profit);
      profit.classList.toggle("red", data.profit < 0);
      profit.classList.toggle("green", data.profit >= 0);
    }

    const included = get("pnx-step166-included-list");
    if (included) {
      included.innerHTML = [
        rowHTML("ok", "収入一覧", "賞金・スポンサー料など", `${data.incomeCount}件`),
        rowHTML("ok", "経費一覧", "交通費・宿泊費・エントリー費など", `${data.expenseCount}件`),
        rowHTML(data.tournamentLinked ? "ok" : "neutral", "大会別収支", "大会ごとの収入・経費", `${data.tournamentLinked}件`),
        rowHTML(data.receiptMissing ? "warn" : "ok", "レシート確認状況", "領収書・証憑の添付状況", data.receiptMissing ? `不足 ${data.receiptMissing}件` : "不足なし"),
        rowHTML("ok", "年間収支サマリー", "1年間の収入・経費・利益", `${data.year}年`)
      ].join("");
    }

    const checks = get("pnx-step166-check-list");
    if (checks) {
      checks.innerHTML = data.checks.map(item => {
        const ok = item.optional ? (item.ok ? "ok" : "neutral") : (item.ok ? "ok" : "warn");
        const value = item.optional && !item.ok ? "任意" : item.ok ? "完了" : "未完了";
        return rowHTML(ok, item.title, item.sub, value);
      }).join("");
    }

    const docs = get("pnx-step166-doc-list");
    if (docs) {
      docs.innerHTML = [
        rowHTML("neutral", "収支一覧PDF", "税理士にそのまま渡せる確認用PDF", "PDF"),
        rowHTML("neutral", "税理士確認用PDF", "収入・経費の概要を短くまとめた確認用", "PDF"),
        rowHTML("neutral", "経費一覧CSV", "会計ソフト・税理士共有用の経費データ", "CSV"),
        rowHTML("neutral", "大会別収支CSV", "ゴルファー専用の大会別レポート", "CSV"),
        rowHTML("neutral", "全取引明細CSV", "すべての取引を日付順に保存", "CSV")
      ].join("");
    }

    window.__PNX_STEP166_LAST_RENDER__ = {
      at:new Date().toISOString(),
      year:data.year,
      incomeTotal:data.incomeTotal,
      expenseTotal:data.expenseTotal,
      receiptMissing:data.receiptMissing,
      tournamentLinked:data.tournamentLinked
    };

    return true;
  }

  function markDocumentsDone(){
    localStorage.setItem(DOC_KEY, "1");

    document.querySelectorAll('[data-step148-task="documents"]').forEach(row => {
      const circle = row.querySelector(".circle");
      const em = row.querySelector("em");

      if (circle) {
        circle.classList.remove("empty", "warn");
        circle.classList.add("done");
        circle.textContent = "✓";
      }

      if (em) {
        em.classList.remove("warn");
        em.classList.add("done");
        em.textContent = "完了";
      }
    });

    try {
      if (typeof window.PNXStep159ApplyFilingProgressSync === "function") {
        window.PNXStep159ApplyFilingProgressSync();
      }
    } catch(e) {}

    try {
      if (typeof window.PNXStep165dRebuildDocumentsTaskRow === "function") {
        window.PNXStep165dRebuildDocumentsTaskRow();
      }
    } catch(e) {}
  }

  function createFinalDocuments(){
    markDocumentsDone();

    const btn = get("pnx-step166-final-create");
    if (btn) {
      btn.classList.add("is-created");
      btn.textContent = "作成しました";
      setTimeout(function(){
        btn.classList.remove("is-created");
        btn.textContent = "確定申告書類を作成する";
      }, 1300);
    }

    // 代表PDFだけ作成。複数ファイルを勝手に連続ダウンロードしない。
    const primaryDoc = document.querySelector('#pnx-step144-doc-list [data-pnx-doc="income-expense-general"]');
    if (primaryDoc && primaryDoc.click) {
      setTimeout(function(){
        try { primaryDoc.click(); } catch(e) {}
      }, 120);
    }

    window.__PNX_STEP166_LAST_CREATE__ = new Date().toISOString();
    return true;
  }

  function wrapOpeners(){
    [
      "PNXStep152cOpenTaxDocumentsStandalonePage",
      "PNXStep152bOpenTaxDocumentsFromCta",
      "PNXStep152OpenTaxDocumentsPage"
    ].forEach(name => {
      const fn = window[name];
      if (typeof fn === "function" && !fn.__pnxStep166Wrapped) {
        const wrapped = function(){
          const result = fn.apply(this, arguments);
          setTimeout(render, 0);
          setTimeout(render, 180);
          return result;
        };
        wrapped.__pnxStep166Wrapped = true;
        window[name] = wrapped;
      }
    });
  }

  [
    "PNXStep165BuildTaxDocumentsContentReview",
    "PNXStep165bFixTaxDocumentsReviewLayout",
    "PNXStep163EnsureTaxDocumentsFinalCta",
    "PNXStep160RefineTaxDocumentsScreen"
  ].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep166RenderWrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(render, 0);
        setTimeout(render, 180);
        return result;
      };
      wrapped.__pnxStep166RenderWrapped = true;
      window[name] = wrapped;
    }
  });

  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest("button, a, [role='button']");
    if (!trigger) return;

    const t = text(trigger);
    if (
      trigger.matches("[data-step148-task='documents']") ||
      /申告書類の内容を確認する|申告書類を作成する|申告書類PDF\/CSVを確認/.test(t)
    ) {
      setTimeout(render, 0);
      setTimeout(render, 220);
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    wrapOpeners();
    setTimeout(render, 600);
    setTimeout(render, 1500);
  });

  window.addEventListener("storage", function(e){
    if (!e.key || e.key.indexOf("PNX_FILING_STEP") === 0 || e.key === "PNX_FINANCE_TRANSACTIONS") {
      setTimeout(render, 120);
    }
  });

  window.PNXStep166RenderTaxDocumentsReviewCompleted = render;
  window.PNXStep166CreateFinalTaxDocuments = createFinalDocuments;
  window.PNXStep166TaxDocumentsReviewCompletedStatus = function(){
    const root = get("pnx-step166-review-root");
    return {
      step:166,
      pageExists:!!docsPage(),
      rootExists:!!root,
      mode:!!(docsPage() && docsPage().classList.contains("pnx-step166-review-completed-mode")),
      legacyHidden:docsPage() ? docsPage().querySelectorAll(".pnx-step166-legacy-hidden").length : 0,
      finalButton:!!get("pnx-step166-final-create"),
      lastRender:window.__PNX_STEP166_LAST_RENDER__ || null,
      lastCreate:window.__PNX_STEP166_LAST_CREATE__ || null,
      note:"申告書類の内容確認画面を完成形の専用UIに整理"
    };
  };
})();




/* ================================================================
   STEP166b: Tax documents review open fix
   目的:
   - やることリスト「申告書類の内容を確認する」を押しても反応しない問題を修正
   - 古い「申告書類作成」処理ではなく、内容確認画面を確実に開く
   - 下部青CTAも同じ内容確認画面を開く
   - 最後の「確定申告書類を作成する」だけ作成完了処理にする
   ================================================================ */
(function(){
  if (window.__PNX_STEP166B_TAX_DOCUMENTS_REVIEW_OPEN_FIX__) return;
  window.__PNX_STEP166B_TAX_DOCUMENTS_REVIEW_OPEN_FIX__ = true;

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  function filingPanel(){
    return get("tab-filing") || document.querySelector('[data-tab-panel="filing"], .fin-panel[data-panel="filing"]');
  }

  function filingHome(){
    return get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");
  }

  function docsPage(){
    return get("pnx-step144-taxdocs");
  }

  function ensureDocsPageInPanel(){
    const panel = filingPanel();
    const page = docsPage();
    if (panel && page && page.parentNode !== panel) {
      panel.insertBefore(page, panel.firstElementChild);
    }
    return page;
  }

  function hideHome(){
    const home = filingHome();
    if (!home) return;
    home.classList.add("pnx-step152c-home-hidden");
    home.classList.add("pnx-step152-home-hidden");
  }

  function showHome(){
    const home = filingHome();
    if (!home) return;
    home.classList.remove("pnx-step152c-home-hidden");
    home.classList.remove("pnx-step152-home-hidden");
  }

  function closeOtherFilingScreens(){
    [
      "pnx-step150-income-screen",
      "pnx-step154-tournament-screen",
      "pnx-step155-expense-screen",
      "pnx-step156-receipt-screen",
      "pnx-step157-rent-screen",
      "pnx-step158-share-screen"
    ].forEach(id => {
      const el = get(id);
      if (!el) return;
      el.classList.remove("is-open", "pnx-step150f-force-fixed", "pnx-step154b-force-fixed");
      el.setAttribute("aria-hidden", "true");
    });

    [
      "pnx-step150f-income-open",
      "pnx-step154b-tournament-open",
      "pnx-step155-open-body",
      "pnx-step156-open-body",
      "pnx-step157-open-body",
      "pnx-step158-open-body"
    ].forEach(cls => document.body.classList.remove(cls));
  }

  function openReview(){
    closeOtherFilingScreens();

    const page = ensureDocsPageInPanel();
    if (!page) return false;

    hideHome();

    page.classList.add("pnx-step152c-open");
    page.classList.add("pnx-step166-review-completed-mode");
    page.setAttribute("aria-hidden", "false");
    document.body.classList.add("pnx-step152c-docs-open-body");

    const h2 = page.querySelector("#pnx-step152c-docs-head h2, #pnx-step152-docs-head h2");
    if (h2) h2.textContent = "申告書類の内容を確認する";

    try {
      if (typeof window.PNXStep166RenderTaxDocumentsReviewCompleted === "function") {
        window.PNXStep166RenderTaxDocumentsReviewCompleted();
      }
    } catch(e) {}

    try {
      if (typeof window.PNXStep165bFixTaxDocumentsReviewLayout === "function") {
        window.PNXStep165bFixTaxDocumentsReviewLayout();
      }
    } catch(e) {}

    try {
      const panel = filingPanel();
      if (panel && panel.scrollTo) panel.scrollTo({ top:0, behavior:"auto" });
      else window.scrollTo({ top:0, behavior:"auto" });
    } catch(e) {}

    window.__PNX_STEP166B_LAST_OPEN__ = new Date().toISOString();
    return true;
  }

  function closeReview(){
    const page = docsPage();
    if (page) {
      page.classList.remove("pnx-step152c-open", "pnx-step152-taxdocs-open");
      page.setAttribute("aria-hidden", "true");
    }

    document.body.classList.remove("pnx-step152c-docs-open-body", "pnx-step152-taxdocs-open-body");
    showHome();

    try {
      if (typeof window.PNXStep159ApplyFilingProgressSync === "function") {
        window.PNXStep159ApplyFilingProgressSync();
      }
    } catch(e) {}

    window.__PNX_STEP166B_LAST_CLOSE__ = new Date().toISOString();
    return true;
  }

  function isDocumentsReviewTrigger(el){
    if (!el || el.closest("#pnx-step144-taxdocs")) return false;

    if (el.matches("[data-step148-task='documents']")) return true;
    if (el.closest("[data-step148-task='documents']")) return true;

    const t = text(el);
    const id = String(el.id || "");
    const cls = String(el.className || "");

    return (
      id === "pnx-step148-start-flow" ||
      id === "pnx-step149-create-tax-docs" ||
      cls.includes("pnx-filing-ref-primary") ||
      el.getAttribute("data-pnx-primary-documents-cta") === "true" ||
      /申告書類の内容を確認する|申告書類を作成する（PDF\/CSV）|申告書類PDF\/CSVを確認/.test(t)
    );
  }

  // 既存の古いオープン関数も、内容確認画面を開く処理へ寄せる
  [
    "PNXStep152cOpenTaxDocumentsStandalonePage",
    "PNXStep152bOpenTaxDocumentsFromCta",
    "PNXStep152OpenTaxDocumentsPage"
  ].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep166bWrapped) {
      const wrapped = function(){
        // 既存処理を使うと古い画面だけ開くことがあるため、ここでは内容確認を優先
        const result = openReview();
        setTimeout(openReview, 80);
        return result;
      };
      wrapped.__pnxStep166bWrapped = true;
      window[name] = wrapped;
    }
  });

  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest("button, a, [role='button'], [data-step148-task]");
    if (!trigger) return;

    // 内容確認画面の最後の作成ボタンは邪魔しない
    if (trigger.id === "pnx-step166-final-create") return;
    if (trigger.id === "pnx-step163-final-create") return;

    // 戻るボタン
    if (trigger.id === "pnx-step152c-docs-back" || trigger.id === "pnx-step152-docs-back") {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      closeReview();
      return;
    }

    if (!isDocumentsReviewTrigger(trigger)) return;

    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

    openReview();
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    // 初期表示時に行とCTAの文言だけ整える
    try {
      if (typeof window.PNXStep165dRebuildDocumentsTaskRow === "function") {
        window.PNXStep165dRebuildDocumentsTaskRow();
      }
      if (typeof window.PNXStep165eRestorePrimaryDocumentsCta === "function") {
        window.PNXStep165eRestorePrimaryDocumentsCta();
      }
    } catch(e) {}
  });

  window.PNXStep166bOpenTaxDocumentsReview = openReview;
  window.PNXStep166bCloseTaxDocumentsReview = closeReview;
  window.PNXStep166bTaxDocumentsReviewOpenFixStatus = function(){
    const page = docsPage();
    return {
      step:"166b",
      pageExists:!!page,
      open:!!(page && page.classList.contains("pnx-step152c-open")),
      reviewMode:!!(page && page.classList.contains("pnx-step166-review-completed-mode")),
      rootExists:!!get("pnx-step166-review-root"),
      lastOpen:window.__PNX_STEP166B_LAST_OPEN__ || null,
      lastClose:window.__PNX_STEP166B_LAST_CLOSE__ || null,
      note:"申告書類の内容確認画面の開く処理を修正"
    };
  };
})();




/* ================================================================
   STEP167: Filing top flow reorganized
   目的:
   - やることリストを「確定申告書類を作成するための材料整理リスト」に戻す
   - リスト内から「申告書類の内容を確認する」「税理士へ共有する」を外す
   - リスト下に「申告書類に入る内容を確認」カードを追加
   - その下に最終CTA「確定申告書類を作成する」を追加
   - 作成後に「税理士へ共有する」を次のステップとして表示
   ================================================================ */
(function(){
  if (window.__PNX_STEP167_FILING_TOP_FLOW_REORGANIZED__) return;
  window.__PNX_STEP167_FILING_TOP_FLOW_REORGANIZED__ = true;

  const DOC_KEY = "PNX_FILING_STEP152_DOCUMENTS_CONFIRMED";

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }
  function yen(n){ return "¥" + Number(n || 0).toLocaleString("ja-JP"); }

  function filingHome(){
    return get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");
  }

  function todoList(){
    return get("pnx-step148-todo-list") || document.querySelector(".pnx-filing-ref-todo-card");
  }

  function currentYear(){
    const y = get("pnx-step142-year");
    return Number(y && y.value) || new Date().getFullYear();
  }

  function readTxs(){
    try {
      if (typeof window.PNXStep138gGetAllFinanceTransactions === "function") {
        return window.PNXStep138gGetAllFinanceTransactions() || [];
      }
    } catch(e) {}

    try {
      const list = JSON.parse(localStorage.getItem("PNX_FINANCE_TRANSACTIONS") || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function txYear(tx){
    const raw = String((tx && (tx.date || tx.startDate || tx.createdAt)) || "");
    const y = Number(raw.slice(0,4));
    return y || currentYear();
  }

  function txAmount(tx){
    return Math.abs(Number(tx && (tx.amount || tx.value || tx.price || 0)) || 0);
  }

  function txType(tx){
    const t = String((tx && (tx.type || tx.kind || tx.flow || tx.side)) || "").toLowerCase();
    if (t.includes("income") || t.includes("revenue") || t === "in") return "income";
    if (tx && tx.income === true) return "income";
    return "expense";
  }

  function hasReceipt(tx){
    if (!tx) return false;
    if (tx.hasReceipt === true || tx.receiptAttached === true || tx.attachment === true) return true;
    if (Array.isArray(tx.receipts) && tx.receipts.length) return true;
    if (Array.isArray(tx.attachments) && tx.attachments.length) return true;
    const fields = [tx.receiptUrl, tx.receiptImage, tx.receiptImageUrl, tx.fileUrl, tx.attachmentUrl, tx.photoUrl, tx.scanUrl, tx.receiptId, tx.attachmentId];
    return fields.some(v => String(v || "").trim());
  }

  function tournamentName(tx){
    if (!tx) return "";
    const vals = [tx.tournamentName, tx.tournamentTitle, tx.eventName, tx.eventTitle, tx.tournamentLabel, tx.relatedTournament];
    if (tx.tournament && typeof tx.tournament === "object") vals.unshift(tx.tournament.title, tx.tournament.name);
    return vals.map(v => String(v || "").trim()).find(Boolean) || "";
  }

  function collect(){
    const year = currentYear();
    let incomeTotal = 0;
    let expenseTotal = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    let receiptMissing = 0;
    let tournamentLinked = 0;

    readTxs().forEach(tx => {
      if (txYear(tx) !== year) return;
      const amount = txAmount(tx);
      if (!amount) return;

      if (txType(tx) === "income") {
        incomeTotal += amount;
        incomeCount += 1;
      } else {
        expenseTotal += amount;
        expenseCount += 1;
        if (!hasReceipt(tx)) receiptMissing += 1;
      }

      if (tournamentName(tx)) tournamentLinked += 1;
    });

    return {
      year,
      incomeTotal,
      expenseTotal,
      profit:incomeTotal - expenseTotal,
      incomeCount,
      expenseCount,
      receiptMissing,
      tournamentLinked
    };
  }

  function isPrepDone(key){
    return localStorage.getItem(key) === "1";
  }

  function prepTasks(){
    return [
      { id:"transactions", key:"PNX_FILING_STEP150_INCOME_CONFIRMED", label:"収入確認" },
      { id:"tournaments", key:"PNX_FILING_STEP154_TOURNAMENT_CONFIRMED", label:"大会収支" },
      { id:"categories", key:"PNX_FILING_STEP155_EXPENSE_CONFIRMED", label:"経費分類" },
      { id:"receipts", key:"PNX_FILING_STEP156_RECEIPT_CONFIRMED", label:"レシート" },
      { id:"rent", key:"PNX_FILING_STEP157_RENT_CONFIRMED", label:"家賃按分", optional:true }
    ];
  }

  function activePrepTasks(){
    const rentActive = localStorage.getItem("PNX_FILING_STEP157_RENT_CONFIRMED") === "1" ||
      Number(localStorage.getItem("PNX_RENT_ALLOCATION_RATE") || localStorage.getItem("PNX_FINANCE_RENT_RATE") || 0) > 0;

    return prepTasks().filter(t => !t.optional || rentActive);
  }

  function prepProgress(){
    const active = activePrepTasks();
    const done = active.filter(t => isPrepDone(t.key)).length;
    const percent = active.length ? Math.round((done / active.length) * 100) : 0;
    return { percent, done, total:active.length };
  }

  function hideNonPrepRows(){
    const list = todoList();
    if (!list) return;

    Array.from(list.querySelectorAll("[data-step148-task]")).forEach(row => {
      const key = row.getAttribute("data-step148-task");
      if (key === "documents" || key === "share") {
        row.classList.add("pnx-step167-hidden-from-todo");
        row.setAttribute("aria-hidden", "true");
      }
    });
  }

  function ensureTopCards(){
    const home = filingHome();
    if (!home) return false;

    hideNonPrepRows();

    let area = get("pnx-step167-final-flow");
    if (!area) {
      area = document.createElement("section");
      area.id = "pnx-step167-final-flow";
      area.className = "pnx-step167-final-flow";
      area.innerHTML = `
        <article class="pnx-step167-review-card" id="pnx-step167-review-card">
          <div class="pnx-step167-card-head">
            <p class="pnx-step167-kicker">Final check</p>
            <h3>申告書類に入る内容を確認</h3>
            <p>収入・経費・レシート・大会別収支を確認してから作成します。</p>
          </div>
          <div class="pnx-step167-mini-list" id="pnx-step167-mini-list"></div>
          <button type="button" id="pnx-step167-open-review">内容を確認する</button>
        </article>

        <article class="pnx-step167-create-card" id="pnx-step167-create-card">
          <div class="pnx-step167-card-head">
            <p class="pnx-step167-kicker">Create</p>
            <h3>確定申告書類を作成する</h3>
            <p>準備ができたら、申告に使うPDF・CSVを作成します。</p>
          </div>
          <button type="button" id="pnx-step167-create-documents">確定申告書類を作成する</button>
        </article>

        <article class="pnx-step167-share-card" id="pnx-step167-share-card" aria-hidden="true">
          <div class="pnx-step167-card-head">
            <p class="pnx-step167-kicker">Next</p>
            <h3>税理士へ共有する</h3>
            <p>作成したデータを、税理士・会計事務所へ共有できます。</p>
          </div>
          <button type="button" id="pnx-step167-open-share">税理士へ共有する</button>
        </article>
      `;

      const oldPrimary = home.querySelector(".pnx-filing-ref-primary, #pnx-step148-start-flow, #pnx-step149-create-tax-docs");
      if (oldPrimary && oldPrimary.parentNode) {
        oldPrimary.parentNode.insertBefore(area, oldPrimary);
      } else {
        home.appendChild(area);
      }
    }

    // 旧青CTAは重複になるため非表示
    Array.from(home.querySelectorAll(".pnx-filing-ref-primary, #pnx-step148-start-flow, #pnx-step149-create-tax-docs, [data-pnx-primary-documents-cta='true']"))
      .forEach(el => {
        if (!el.closest("#pnx-step167-final-flow")) {
          el.classList.add("pnx-step167-hide-old-primary");
          el.setAttribute("aria-hidden", "true");
        }
      });

    bindCards();
    renderCards();

    window.__PNX_STEP167_LAST_ENSURE__ = new Date().toISOString();
    return true;
  }

  function row(status, title, value){
    return `
      <div class="pnx-step167-mini-row ${status}">
        <span>${status === "ok" ? "✓" : status === "warn" ? "!" : "•"}</span>
        <strong>${title}</strong>
        <em>${value}</em>
      </div>
    `;
  }

  function renderCards(){
    const data = collect();
    const list = get("pnx-step167-mini-list");

    if (list) {
      list.innerHTML = [
        row("ok", "収入一覧", `${data.incomeCount}件`),
        row("ok", "経費一覧", `${data.expenseCount}件`),
        row(data.tournamentLinked ? "ok" : "neutral", "大会別収支", `${data.tournamentLinked}件`),
        row(data.receiptMissing ? "warn" : "ok", "レシート状況", data.receiptMissing ? `不足 ${data.receiptMissing}件` : "不足なし"),
        row("neutral", "年間収支", `${data.year}年`)
      ].join("");
    }

    const share = get("pnx-step167-share-card");
    const docsDone = localStorage.getItem(DOC_KEY) === "1";
    if (share) {
      share.classList.toggle("is-visible", docsDone);
      share.setAttribute("aria-hidden", docsDone ? "false" : "true");
    }

    const createBtn = get("pnx-step167-create-documents");
    if (createBtn) {
      createBtn.classList.toggle("is-created", docsDone);
      createBtn.textContent = docsDone ? "作成済み" : "確定申告書類を作成する";
    }

    // 準備率は材料整理だけの進捗に寄せる
    updatePrepProgress();

    window.__PNX_STEP167_LAST_RENDER__ = {
      at:new Date().toISOString(),
      docsDone,
      data
    };
  }

  function updatePrepProgress(){
    const p = prepProgress();

    document.querySelectorAll("#pnx-step148-progress-num, #ring-label .ring-num, .ring-label .ring-num, .filing-prep-card .ring-num").forEach(el => {
      el.textContent = String(p.percent);
    });

    document.querySelectorAll(".filing-prep-sub, .pnx-step148d-created-head p").forEach(el => {
      const remain = Math.max(0, p.total - p.done);
      el.textContent = remain === 0
        ? "申告書類を作成する準備が整いました"
        : `残り${remain}項目で申告書類を作成できます`;
    });

    document.querySelectorAll("#pnx-step148-ring-progress, #ring-fill, .filing-prep-card .ring-fill, .prep-ring .ring-fill").forEach(circle => {
      const r = Number(circle.getAttribute("r")) || 46;
      const c = 2 * Math.PI * r;
      circle.style.strokeDasharray = String(c);
      circle.style.strokeDashoffset = String(c * (1 - p.percent / 100));
    });
  }

  function openReview(){
    try {
      if (typeof window.PNXStep166bOpenTaxDocumentsReview === "function") {
        window.PNXStep166bOpenTaxDocumentsReview();
        return true;
      }
      if (typeof window.PNXStep166RenderTaxDocumentsReviewCompleted === "function") {
        window.PNXStep166RenderTaxDocumentsReviewCompleted();
        const page = get("pnx-step144-taxdocs");
        if (page) {
          page.classList.add("pnx-step152c-open");
          page.setAttribute("aria-hidden", "false");
        }
        return true;
      }
    } catch(e) {}
    return false;
  }

  function createDocuments(){
    localStorage.setItem(DOC_KEY, "1");

    try {
      if (typeof window.PNXStep166CreateFinalTaxDocuments === "function") {
        window.PNXStep166CreateFinalTaxDocuments();
      }
    } catch(e) {}

    renderCards();

    window.__PNX_STEP167_LAST_CREATE__ = new Date().toISOString();
    return true;
  }

  function openShare(){
    try {
      if (typeof window.PNXStep158OpenTaxAdvisorShareScreen === "function") {
        window.PNXStep158OpenTaxAdvisorShareScreen();
        return true;
      }
    } catch(e) {}
    return false;
  }

  function bindCards(){
    const review = get("pnx-step167-open-review");
    if (review && !review.__pnxStep167Bound) {
      review.__pnxStep167Bound = true;
      review.addEventListener("click", function(e){
        e.preventDefault();
        openReview();
      }, true);
    }

    const create = get("pnx-step167-create-documents");
    if (create && !create.__pnxStep167Bound) {
      create.__pnxStep167Bound = true;
      create.addEventListener("click", function(e){
        e.preventDefault();
        createDocuments();
      }, true);
    }

    const share = get("pnx-step167-open-share");
    if (share && !share.__pnxStep167Bound) {
      share.__pnxStep167Bound = true;
      share.addEventListener("click", function(e){
        e.preventDefault();
        openShare();
      }, true);
    }
  }

  function apply(){
    hideNonPrepRows();
    ensureTopCards();
    renderCards();

    window.__PNX_STEP167_LAST_APPLY__ = new Date().toISOString();
    return true;
  }

  // 既存処理があとからdocuments/share行や旧CTAを復活させても最後に整理する
  [
    "PNXStep159ApplyFilingProgressSync",
    "PNXStep164RefineTaxDocumentsTaskLabel",
    "PNXStep165dRebuildDocumentsTaskRow",
    "PNXStep165eRestorePrimaryDocumentsCta"
  ].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep167Wrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(apply, 0);
        setTimeout(apply, 180);
        return result;
      };
      wrapped.__pnxStep167Wrapped = true;
      window[name] = wrapped;
    }
  });

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(apply, 120);
    setTimeout(apply, 700);
    setTimeout(apply, 1600);
  });

  document.addEventListener("click", function(e){
    const tab = e.target && e.target.closest && e.target.closest(".fin-tab, [data-tab='filing']");
    if (tab) {
      setTimeout(apply, 160);
      setTimeout(apply, 700);
      return;
    }

    const trigger = e.target && e.target.closest && e.target.closest("button, a, [role='button'], [data-step148-task]");
    if (trigger) {
      setTimeout(apply, 160);
    }
  }, true);

  window.addEventListener("storage", function(e){
    if (!e.key || e.key.indexOf("PNX_FILING_STEP") === 0 || e.key === "PNX_FINANCE_TRANSACTIONS") {
      setTimeout(apply, 120);
    }
  });

  window.PNXStep167ApplyFilingTopFlowReorganized = apply;
  window.PNXStep167CreateFinalDocumentsFromTop = createDocuments;
  window.PNXStep167FilingTopFlowReorganizedStatus = function(){
    return {
      step:167,
      finalFlowExists:!!get("pnx-step167-final-flow"),
      reviewCardExists:!!get("pnx-step167-review-card"),
      createCardExists:!!get("pnx-step167-create-card"),
      shareCardVisible:!!(get("pnx-step167-share-card") && get("pnx-step167-share-card").classList.contains("is-visible")),
      hiddenTodoRows:Array.from(document.querySelectorAll(".pnx-step167-hidden-from-todo")).map(el => el.getAttribute("data-step148-task")),
      oldPrimaryHidden:Array.from(document.querySelectorAll(".pnx-step167-hide-old-primary")).length,
      prepProgress:prepProgress(),
      docsDone:localStorage.getItem(DOC_KEY) === "1",
      lastApply:window.__PNX_STEP167_LAST_APPLY__ || null,
      lastCreate:window.__PNX_STEP167_LAST_CREATE__ || null,
      note:"申告トップを準備リスト・内容確認・最終作成・共有導線に分離"
    };
  };
})();




/* ================================================================
   STEP167b: Review back fix and separate final flow
   目的:
   - 「申告書類に入る内容を確認」をやることリストの外側へ強制配置
   - 内容確認画面の戻るボタンで必ず申告トップへ戻れるようにする
   ================================================================ */
(function(){
  if (window.__PNX_STEP167B_REVIEW_BACK_AND_SEPARATE_FLOW__) return;
  window.__PNX_STEP167B_REVIEW_BACK_AND_SEPARATE_FLOW__ = true;

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  function filingHome(){
    return get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");
  }

  function filingPanel(){
    return get("tab-filing") || document.querySelector('[data-tab-panel="filing"], .fin-panel[data-panel="filing"]');
  }

  function todoList(){
    return get("pnx-step148-todo-list") || document.querySelector(".pnx-filing-ref-todo-card");
  }

  function docsPage(){
    return get("pnx-step144-taxdocs");
  }

  function todoSection(){
    const list = todoList();
    if (!list) return null;
    return list.closest(".pnx-filing-ref-todo-section") || list.closest("section") || list;
  }

  function separateFinalFlow(){
    const flow = get("pnx-step167-final-flow");
    const section = todoSection();

    if (!flow || !section || !section.parentNode) return false;

    // やることリスト内に入っていたら、必ずリストの外側へ出す
    if (
      flow.closest(".pnx-filing-ref-todo-card") ||
      flow.closest("#pnx-step148-todo-list") ||
      flow.previousElementSibling !== section
    ) {
      section.insertAdjacentElement("afterend", flow);
    }

    flow.classList.add("pnx-step167b-separated-flow");

    // リスト内の documents/share 行は確実に非表示
    Array.from(document.querySelectorAll('[data-step148-task="documents"], [data-step148-task="share"]')).forEach(row => {
      if (row.closest(".pnx-filing-ref-todo-card") || row.closest("#pnx-step148-todo-list")) {
        row.classList.add("pnx-step167-hidden-from-todo");
        row.classList.add("pnx-step167b-hidden-from-todo");
        row.setAttribute("aria-hidden", "true");
      }
    });

    window.__PNX_STEP167B_LAST_SEPARATE__ = new Date().toISOString();
    return true;
  }

  function showHome(){
    const home = filingHome();
    if (!home) return;

    [
      "pnx-step152-home-hidden",
      "pnx-step152c-home-hidden",
      "pnx-step154-hidden",
      "pnx-step155-hidden",
      "pnx-step156-hidden",
      "pnx-step157-hidden",
      "pnx-step158-hidden"
    ].forEach(cls => home.classList.remove(cls));

    home.style.display = "";
  }

  function closeReview(){
    const page = docsPage();

    if (page) {
      page.classList.remove(
        "pnx-step152c-open",
        "pnx-step152-taxdocs-open",
        "is-open"
      );
      page.setAttribute("aria-hidden", "true");
      page.style.display = "";
    }

    [
      "pnx-step152c-docs-open-body",
      "pnx-step152-taxdocs-open-body",
      "pnx-step152-taxdocs-body",
      "pnx-step166-docs-open-body"
    ].forEach(cls => document.body.classList.remove(cls));

    showHome();

    try {
      const panel = filingPanel();
      if (panel && panel.scrollTo) panel.scrollTo({ top:0, behavior:"auto" });
    } catch(e) {}

    try {
      if (typeof window.PNXStep167ApplyFilingTopFlowReorganized === "function") {
        window.PNXStep167ApplyFilingTopFlowReorganized();
      }
    } catch(e) {}

    setTimeout(separateFinalFlow, 80);

    window.__PNX_STEP167B_LAST_CLOSE__ = new Date().toISOString();
    return true;
  }

  function bindBackButton(){
    const page = docsPage();
    if (!page) return false;

    let back = get("pnx-step167b-review-back");
    const oldBack = get("pnx-step152c-docs-back") || get("pnx-step152-docs-back");

    if (!back) {
      back = document.createElement("button");
      back.type = "button";
      back.id = "pnx-step167b-review-back";
      back.className = "pnx-step167b-review-back";
      back.setAttribute("aria-label", "申告トップへ戻る");
      back.textContent = "←";

      const head = get("pnx-step152c-docs-head") || get("pnx-step152-docs-head") || page.firstElementChild;
      if (head) {
        if (oldBack) {
          oldBack.classList.add("pnx-step167b-old-back-hidden");
          oldBack.insertAdjacentElement("afterend", back);
        } else {
          head.insertBefore(back, head.firstChild);
        }
      } else {
        page.insertBefore(back, page.firstChild);
      }
    }

    [back, oldBack].filter(Boolean).forEach(btn => {
      if (btn.__pnxStep167bBackBound) return;
      btn.__pnxStep167bBackBound = true;
      btn.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        closeReview();
      }, true);
    });

    return true;
  }

  function afterOpen(){
    bindBackButton();
    separateFinalFlow();
  }

  ["PNXStep166bOpenTaxDocumentsReview", "PNXStep166RenderTaxDocumentsReviewCompleted"].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep167bWrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(afterOpen, 0);
        setTimeout(afterOpen, 180);
        return result;
      };
      wrapped.__pnxStep167bWrapped = true;
      window[name] = wrapped;
    }
  });

  ["PNXStep167ApplyFilingTopFlowReorganized", "PNXStep159ApplyFilingProgressSync"].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep167bSeparateWrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(separateFinalFlow, 0);
        setTimeout(separateFinalFlow, 160);
        return result;
      };
      wrapped.__pnxStep167bSeparateWrapped = true;
      window[name] = wrapped;
    }
  });

  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest("button, a, [role='button'], .fin-tab");
    if (!trigger) return;

    if (
      trigger.id === "pnx-step167b-review-back" ||
      trigger.id === "pnx-step152c-docs-back" ||
      trigger.id === "pnx-step152-docs-back" ||
      (/戻る|←/.test(text(trigger)) && trigger.closest("#pnx-step144-taxdocs"))
    ) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      closeReview();
      return;
    }

    setTimeout(separateFinalFlow, 160);
    setTimeout(bindBackButton, 220);
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(separateFinalFlow, 160);
    setTimeout(separateFinalFlow, 700);
    setTimeout(bindBackButton, 1000);
  });

  window.PNXStep167bSeparateFinalFlowFromTodo = separateFinalFlow;
  window.PNXStep167bCloseTaxDocumentsReview = closeReview;
  window.PNXStep167bReviewBackAndSeparateFlowStatus = function(){
    const flow = get("pnx-step167-final-flow");
    const page = docsPage();
    return {
      step:"167b",
      flowExists:!!flow,
      flowInsideTodo:!!(flow && (flow.closest(".pnx-filing-ref-todo-card") || flow.closest("#pnx-step148-todo-list"))),
      flowSeparated:!!(flow && flow.classList.contains("pnx-step167b-separated-flow")),
      hiddenTodoRows:Array.from(document.querySelectorAll(".pnx-step167b-hidden-from-todo")).map(el => el.getAttribute("data-step148-task")),
      docsOpen:!!(page && page.classList.contains("pnx-step152c-open")),
      backButtonExists:!!get("pnx-step167b-review-back"),
      lastSeparate:window.__PNX_STEP167B_LAST_SEPARATE__ || null,
      lastClose:window.__PNX_STEP167B_LAST_CLOSE__ || null,
      note:"内容確認カードをやることリスト外へ分離し、戻る動作を修正"
    };
  };
})();




/* ================================================================
   STEP168: Documents CTA separated from todo + robust back fix
   目的:
   - やることリストから申告書類系を完全に切り離す
   - リスト下には青いボタン「確定申告書類作成に進む」だけを出す
   - 内容確認画面から必ず申告トップへ戻れるようにする
   ================================================================ */
(function(){
  if (window.__PNX_STEP168_DOCUMENTS_CTA_SEPARATED_BACK_FIXED__) return;
  window.__PNX_STEP168_DOCUMENTS_CTA_SEPARATED_BACK_FIXED__ = true;

  const DOC_KEY = "PNX_FILING_STEP152_DOCUMENTS_CONFIRMED";

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  function filingHome(){
    return get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");
  }

  function filingPanel(){
    return get("tab-filing") || document.querySelector('[data-tab-panel="filing"], .fin-panel[data-panel="filing"]');
  }

  function todoList(){
    return get("pnx-step148-todo-list") || document.querySelector(".pnx-filing-ref-todo-card");
  }

  function todoSection(){
    const list = todoList();
    if (!list) return null;
    return list.closest(".pnx-filing-ref-todo-section") || list.closest("section") || list;
  }

  function docsPage(){
    return get("pnx-step144-taxdocs");
  }

  function hideTodoDocumentRows(){
    Array.from(document.querySelectorAll('[data-step148-task="documents"], [data-step148-task="share"]')).forEach(row => {
      if (row.closest(".pnx-filing-ref-todo-card") || row.closest("#pnx-step148-todo-list")) {
        row.classList.add("pnx-step168-hidden-from-todo");
        row.setAttribute("aria-hidden", "true");
      }
    });
  }

  function ensureSeparatedCta(){
    const home = filingHome();
    const section = todoSection();
    if (!home || !section || !section.parentNode) return false;

    hideTodoDocumentRows();

    let flow = get("pnx-step167-final-flow");
    if (!flow) {
      flow = document.createElement("section");
      flow.id = "pnx-step167-final-flow";
    }

    flow.className = "pnx-step168-documents-cta-area";
    flow.setAttribute("aria-label", "確定申告書類作成");
    flow.innerHTML = `
      <button type="button" id="pnx-step168-open-documents-flow" class="pnx-step168-open-documents-flow">
        確定申告書類作成に進む
      </button>
    `;

    // やることリストの外、セクション直後に固定
    section.insertAdjacentElement("afterend", flow);

    const oldPrimary = home.querySelectorAll(".pnx-filing-ref-primary, #pnx-step148-start-flow, #pnx-step149-create-tax-docs, [data-pnx-primary-documents-cta='true']");
    oldPrimary.forEach(el => {
      if (!el.closest("#pnx-step167-final-flow")) {
        el.classList.add("pnx-step168-hide-old-primary");
        el.setAttribute("aria-hidden", "true");
      }
    });

    const btn = get("pnx-step168-open-documents-flow");
    if (btn && !btn.__pnxStep168Bound) {
      btn.__pnxStep168Bound = true;
      btn.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        openReview();
      }, true);
    }

    window.__PNX_STEP168_LAST_CTA__ = new Date().toISOString();
    return true;
  }

  function ensureDocsPageInPanel(){
    const panel = filingPanel();
    const page = docsPage();
    if (panel && page && page.parentNode !== panel) {
      panel.insertBefore(page, panel.firstElementChild);
    }
    return page;
  }

  function hideHome(){
    const home = filingHome();
    if (!home) return;
    [
      "pnx-step152-home-hidden",
      "pnx-step152c-home-hidden",
      "pnx-step154-hidden",
      "pnx-step155-hidden",
      "pnx-step156-hidden",
      "pnx-step157-hidden",
      "pnx-step158-hidden"
    ].forEach(cls => home.classList.add(cls));
    home.style.display = "none";
  }

  function showHome(){
    const home = filingHome();
    if (!home) return;
    [
      "pnx-step152-home-hidden",
      "pnx-step152c-home-hidden",
      "pnx-step154-hidden",
      "pnx-step155-hidden",
      "pnx-step156-hidden",
      "pnx-step157-hidden",
      "pnx-step158-hidden"
    ].forEach(cls => home.classList.remove(cls));
    home.style.display = "";
  }

  function removeFloatingBack(){
    const old = get("pnx-step168-floating-back");
    if (old) old.remove();
  }

  function injectFloatingBack(){
    removeFloatingBack();

    const back = document.createElement("button");
    back.type = "button";
    back.id = "pnx-step168-floating-back";
    back.className = "pnx-step168-floating-back";
    back.setAttribute("aria-label", "申告トップへ戻る");
    back.textContent = "←";

    back.addEventListener("click", function(e){
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      closeReview();
    }, true);

    back.addEventListener("pointerdown", function(e){
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      closeReview();
    }, true);

    document.body.appendChild(back);
    return back;
  }

  function openReview(){
    const page = ensureDocsPageInPanel();
    if (!page) return false;

    // 他の詳細画面は閉じる
    [
      "pnx-step150-income-screen",
      "pnx-step154-tournament-screen",
      "pnx-step155-expense-screen",
      "pnx-step156-receipt-screen",
      "pnx-step157-rent-screen",
      "pnx-step158-share-screen"
    ].forEach(id => {
      const el = get(id);
      if (!el) return;
      el.classList.remove("is-open", "pnx-step150f-force-fixed", "pnx-step154b-force-fixed");
      el.setAttribute("aria-hidden", "true");
    });

    hideHome();

    page.style.display = "block";
    page.classList.add("pnx-step152c-open", "pnx-step166-review-completed-mode", "pnx-step168-review-open");
    page.classList.remove("pnx-step152-taxdocs-open");
    page.setAttribute("aria-hidden", "false");

    document.body.classList.add("pnx-step168-review-open-body");
    document.body.classList.add("pnx-step152c-docs-open-body");

    const h2 = page.querySelector("#pnx-step152c-docs-head h2, #pnx-step152-docs-head h2");
    if (h2) h2.textContent = "申告書類の内容を確認する";

    try {
      if (typeof window.PNXStep166RenderTaxDocumentsReviewCompleted === "function") {
        window.PNXStep166RenderTaxDocumentsReviewCompleted();
      }
    } catch(e) {}

    injectFloatingBack();

    try {
      const panel = filingPanel();
      if (panel && panel.scrollTo) panel.scrollTo({ top:0, behavior:"auto" });
      page.scrollTop = 0;
    } catch(e) {}

    window.__PNX_STEP168_LAST_OPEN__ = new Date().toISOString();
    return true;
  }

  function closeReview(){
    const page = docsPage();

    if (page) {
      page.classList.remove(
        "pnx-step152c-open",
        "pnx-step152-taxdocs-open",
        "pnx-step168-review-open",
        "is-open"
      );
      page.setAttribute("aria-hidden", "true");
      page.style.display = "none";
    }

    [
      "pnx-step168-review-open-body",
      "pnx-step152c-docs-open-body",
      "pnx-step152-taxdocs-open-body",
      "pnx-step152-taxdocs-body",
      "pnx-step166-docs-open-body"
    ].forEach(cls => document.body.classList.remove(cls));

    removeFloatingBack();
    showHome();
    ensureSeparatedCta();

    try {
      const panel = filingPanel();
      if (panel && panel.scrollTo) panel.scrollTo({ top:0, behavior:"auto" });
    } catch(e) {}

    window.__PNX_STEP168_LAST_CLOSE__ = new Date().toISOString();
    return true;
  }

  // 既存の開く関数は、このCTA用の開き方へ寄せる
  [
    "PNXStep166bOpenTaxDocumentsReview",
    "PNXStep152cOpenTaxDocumentsStandalonePage",
    "PNXStep152bOpenTaxDocumentsFromCta",
    "PNXStep152OpenTaxDocumentsPage"
  ].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep168Wrapped) {
      const wrapped = function(){
        return openReview();
      };
      wrapped.__pnxStep168Wrapped = true;
      window[name] = wrapped;
    }
  });

  // 既存の整理処理が戻したあとも、最終形を維持する
  [
    "PNXStep167ApplyFilingTopFlowReorganized",
    "PNXStep167bSeparateFinalFlowFromTodo",
    "PNXStep159ApplyFilingProgressSync",
    "PNXStep165eRestorePrimaryDocumentsCta"
  ].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep168CtaWrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(ensureSeparatedCta, 0);
        setTimeout(ensureSeparatedCta, 180);
        return result;
      };
      wrapped.__pnxStep168CtaWrapped = true;
      window[name] = wrapped;
    }
  });

  document.addEventListener("pointerdown", function(e){
    const trigger = e.target && e.target.closest && e.target.closest("#pnx-step168-floating-back");
    if (!trigger) return;
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    closeReview();
  }, true);

  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest("button, a, [role='button'], .fin-tab");
    if (!trigger) return;

    if (
      trigger.id === "pnx-step168-floating-back" ||
      trigger.id === "pnx-step167b-review-back" ||
      trigger.id === "pnx-step152c-docs-back" ||
      trigger.id === "pnx-step152-docs-back" ||
      (/戻る|←/.test(text(trigger)) && (trigger.closest("#pnx-step144-taxdocs") || trigger.id === "pnx-step168-floating-back"))
    ) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      closeReview();
      return;
    }

    if (trigger.id === "pnx-step168-open-documents-flow") {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      openReview();
      return;
    }

    setTimeout(ensureSeparatedCta, 120);
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(ensureSeparatedCta, 120);
    setTimeout(ensureSeparatedCta, 700);
    setTimeout(ensureSeparatedCta, 1600);
  });

  window.PNXStep168EnsureDocumentsCtaSeparated = ensureSeparatedCta;
  window.PNXStep168OpenDocumentsCreationFlow = openReview;
  window.PNXStep168CloseDocumentsCreationFlow = closeReview;
  window.PNXStep168DocumentsCtaSeparatedBackFixedStatus = function(){
    const flow = get("pnx-step167-final-flow");
    const page = docsPage();
    return {
      step:168,
      ctaExists:!!get("pnx-step168-open-documents-flow"),
      flowInsideTodo:!!(flow && (flow.closest(".pnx-filing-ref-todo-card") || flow.closest("#pnx-step148-todo-list"))),
      hiddenTodoRows:Array.from(document.querySelectorAll(".pnx-step168-hidden-from-todo")).map(el => el.getAttribute("data-step148-task")),
      docsOpen:!!(page && page.classList.contains("pnx-step168-review-open")),
      floatingBackExists:!!get("pnx-step168-floating-back"),
      lastOpen:window.__PNX_STEP168_LAST_OPEN__ || null,
      lastClose:window.__PNX_STEP168_LAST_CLOSE__ || null,
      lastCta:window.__PNX_STEP168_LAST_CTA__ || null,
      note:"やることリストから申告書類作成を完全分離し、戻る動作を強制修正"
    };
  };
})();




/* ================================================================
   STEP168b: Todo cleanup and back overlap fix
   目的:
   - やることリストに残る「申告書類系」「税理士共有系」を完全非表示
   - data属性が無い古い行もテキスト判定で非表示
   - 内容確認画面の戻るボタンがタイトルに被らないように調整
   ================================================================ */
(function(){
  if (window.__PNX_STEP168B_TODO_CLEANUP_BACK_OVERLAP_FIX__) return;
  window.__PNX_STEP168B_TODO_CLEANUP_BACK_OVERLAP_FIX__ = true;

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  function todoList(){
    return get("pnx-step148-todo-list") || document.querySelector(".pnx-filing-ref-todo-card");
  }

  function docsPage(){
    return get("pnx-step144-taxdocs");
  }

  function isTodoRow(el){
    if (!el || !el.closest) return false;
    const list = todoList();
    if (!list || !list.contains(el)) return false;
    return (
      el.matches("[data-step148-task], .pnx-filing-ref-todo-row, button, a, [role='button']") ||
      el.parentElement === list
    );
  }

  function shouldHideFromTodo(row){
    if (!row) return false;
    const key = row.getAttribute && row.getAttribute("data-step148-task");
    const t = text(row);

    if (key === "documents" || key === "share") return true;

    // data属性が無いまま残った古い行も、テキストで判定して消す
    if (/申告書類|確定申告書類|PDF|CSV|税理士へ共有|共有する/.test(t)) {
      // ただし準備項目の「レシート」「収入」「経費」「大会」「家賃」は残す
      if (/収入を確認|大会ごとの収支|経費を分類|レシート|領収書|家賃按分/.test(t)) {
        return false;
      }
      return true;
    }

    return false;
  }

  function cleanupTodo(){
    const list = todoList();
    if (!list) return 0;

    const rows = Array.from(list.querySelectorAll("[data-step148-task], .pnx-filing-ref-todo-row, button, a, [role='button']"))
      .filter(isTodoRow);

    let hidden = 0;
    rows.forEach(row => {
      if (!shouldHideFromTodo(row)) return;

      row.classList.add("pnx-step168-hidden-from-todo");
      row.classList.add("pnx-step168b-force-hidden-from-todo");
      row.setAttribute("aria-hidden", "true");
      row.style.display = "none";
      hidden += 1;
    });

    // リスト直下の変なテキストノードも削除
    Array.from(list.childNodes).forEach(node => {
      if (node.nodeType === 3 && /申告書類|税理士|PDF|CSV/.test(String(node.textContent || ""))) {
        node.remove();
      }
    });

    window.__PNX_STEP168B_LAST_CLEANUP__ = {
      at:new Date().toISOString(),
      hidden
    };

    return hidden;
  }

  function fixBackLayout(){
    const page = docsPage();
    if (!page) return false;

    page.classList.add("pnx-step168b-back-layout-fixed");

    // 古い戻るボタンは表示させず、STEP168の固定戻るだけに統一
    ["pnx-step167b-review-back", "pnx-step152c-docs-back", "pnx-step152-docs-back"].forEach(id => {
      const btn = get(id);
      if (btn) {
        btn.classList.add("pnx-step168b-hide-old-back");
        btn.setAttribute("aria-hidden", "true");
      }
    });

    const floating = get("pnx-step168-floating-back");
    if (floating) {
      floating.classList.add("pnx-step168b-floating-back-fixed");
    }

    const head = get("pnx-step152c-docs-head") || get("pnx-step152-docs-head");
    if (head) {
      head.classList.add("pnx-step168b-docs-head-fixed");
    }

    window.__PNX_STEP168B_LAST_BACK_FIX__ = new Date().toISOString();
    return true;
  }

  function apply(){
    cleanupTodo();
    fixBackLayout();

    try {
      if (typeof window.PNXStep168EnsureDocumentsCtaSeparated === "function") {
        // これが古い行を復活させる可能性があるので、後でもう一度cleanup
        setTimeout(cleanupTodo, 40);
      }
    } catch(e) {}

    return true;
  }

  // 既存処理があとからdocuments/share行を復活させても後勝ちで消す
  [
    "PNXStep168EnsureDocumentsCtaSeparated",
    "PNXStep167ApplyFilingTopFlowReorganized",
    "PNXStep167bSeparateFinalFlowFromTodo",
    "PNXStep159ApplyFilingProgressSync",
    "PNXStep165dRebuildDocumentsTaskRow",
    "PNXStep165eRestorePrimaryDocumentsCta"
  ].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep168bWrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(cleanupTodo, 0);
        setTimeout(cleanupTodo, 120);
        setTimeout(fixBackLayout, 120);
        return result;
      };
      wrapped.__pnxStep168bWrapped = true;
      window[name] = wrapped;
    }
  });

  ["PNXStep168OpenDocumentsCreationFlow", "PNXStep166bOpenTaxDocumentsReview"].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep168bOpenWrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(fixBackLayout, 0);
        setTimeout(fixBackLayout, 120);
        return result;
      };
      wrapped.__pnxStep168bOpenWrapped = true;
      window[name] = wrapped;
    }
  });

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(cleanupTodo, 120);
    setTimeout(cleanupTodo, 700);
    setTimeout(cleanupTodo, 1600);
    setTimeout(fixBackLayout, 1600);
  });

  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest("button, a, [role='button'], .fin-tab");
    if (trigger) {
      setTimeout(cleanupTodo, 80);
      setTimeout(cleanupTodo, 260);
      setTimeout(fixBackLayout, 120);
    }
  }, true);

  window.PNXStep168bCleanupTodoDocumentRows = cleanupTodo;
  window.PNXStep168bFixReviewBackOverlap = fixBackLayout;
  window.PNXStep168bTodoCleanupBackOverlapStatus = function(){
    const list = todoList();
    const rows = list
      ? Array.from(list.querySelectorAll("[data-step148-task], .pnx-filing-ref-todo-row, button, a, [role='button']")).filter(isTodoRow)
      : [];
    const visibleBadRows = rows.filter(row => shouldHideFromTodo(row) && getComputedStyle(row).display !== "none");

    return {
      step:"168b",
      todoExists:!!list,
      hiddenRows:Array.from(document.querySelectorAll(".pnx-step168b-force-hidden-from-todo")).map(text),
      visibleBadRows:visibleBadRows.map(text),
      backLayoutFixed:!!(docsPage() && docsPage().classList.contains("pnx-step168b-back-layout-fixed")),
      floatingBackExists:!!get("pnx-step168-floating-back"),
      lastCleanup:window.__PNX_STEP168B_LAST_CLEANUP__ || null,
      lastBackFix:window.__PNX_STEP168B_LAST_BACK_FIX__ || null,
      note:"やることリストの申告書類系を完全非表示、戻るボタン被りを修正"
    };
  };
})();




/* ================================================================
   STEP168c: Todo blank space remove
   目的:
   - やることリストから消した申告書類系/共有系の空白だけが残る問題を修正
   - display:noneではなく、該当行をDOMから完全に取り除く
   - リスト下の余白/区切りも詰める
   ================================================================ */
(function(){
  if (window.__PNX_STEP168C_TODO_BLANK_SPACE_REMOVE__) return;
  window.__PNX_STEP168C_TODO_BLANK_SPACE_REMOVE__ = true;

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  function todoList(){
    return get("pnx-step148-todo-list") || document.querySelector(".pnx-filing-ref-todo-card");
  }

  function isRemoveTarget(row){
    if (!row || !row.closest) return false;

    const list = todoList();
    if (!list || !list.contains(row)) return false;

    const key = row.getAttribute && row.getAttribute("data-step148-task");
    const t = text(row);

    if (key === "documents" || key === "share") return true;

    if (/申告書類|確定申告書類|PDF|CSV|税理士へ共有|共有する/.test(t)) {
      if (/収入を確認|大会ごとの収支|経費を分類|レシート|領収書|家賃按分/.test(t)) {
        return false;
      }
      return true;
    }

    return false;
  }

  function removeBlankRows(){
    const list = todoList();
    if (!list) return 0;

    const candidates = Array.from(list.querySelectorAll(
      "[data-step148-task], .pnx-filing-ref-todo-row, button, a, [role='button'], .pnx-step165d-doc-row"
    ));

    let removed = 0;

    candidates.forEach(row => {
      if (!isRemoveTarget(row)) return;

      row.classList.add("pnx-step168c-removed-row");

      // 空白を残さないため、リストから完全に外す
      row.remove();
      removed += 1;
    });

    // 直下に残った空テキスト/空要素を削除
    Array.from(list.childNodes).forEach(node => {
      if (node.nodeType === 3 && !String(node.textContent || "").trim()) {
        node.remove();
      }

      if (node.nodeType === 3 && /申告書類|確定申告書類|PDF|CSV|税理士/.test(String(node.textContent || ""))) {
        node.remove();
      }

      if (node.nodeType === 1) {
        const el = node;
        const visibleText = text(el);
        const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : { height: 1 };
        if (!visibleText && rect.height <= 8) {
          el.remove();
          removed += 1;
        }
      }
    });

    list.classList.add("pnx-step168c-todo-trimmed");

    // 最後の表示行をマークして、下の境界/余白を安定化
    Array.from(list.children).forEach(child => child.classList.remove("pnx-step168c-last-visible-row"));
    const visibleRows = Array.from(list.children).filter(el => {
      const style = getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden" && el.getBoundingClientRect().height > 0;
    });
    const last = visibleRows[visibleRows.length - 1];
    if (last) last.classList.add("pnx-step168c-last-visible-row");

    window.__PNX_STEP168C_LAST_REMOVE__ = {
      at:new Date().toISOString(),
      removed,
      visibleRows:visibleRows.length
    };

    return removed;
  }

  // 既存処理が後から申告書類系の行を復活させても、最後にDOMから外す
  [
    "PNXStep168bCleanupTodoDocumentRows",
    "PNXStep168EnsureDocumentsCtaSeparated",
    "PNXStep167ApplyFilingTopFlowReorganized",
    "PNXStep167bSeparateFinalFlowFromTodo",
    "PNXStep159ApplyFilingProgressSync",
    "PNXStep165dRebuildDocumentsTaskRow",
    "PNXStep165eRestorePrimaryDocumentsCta"
  ].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep168cWrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(removeBlankRows, 0);
        setTimeout(removeBlankRows, 120);
        return result;
      };
      wrapped.__pnxStep168cWrapped = true;
      window[name] = wrapped;
    }
  });

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(removeBlankRows, 120);
    setTimeout(removeBlankRows, 700);
    setTimeout(removeBlankRows, 1600);
    setTimeout(removeBlankRows, 2600);
  });

  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest("button, a, [role='button'], .fin-tab");
    if (trigger) {
      setTimeout(removeBlankRows, 80);
      setTimeout(removeBlankRows, 260);
    }
  }, true);

  window.PNXStep168cRemoveTodoBlankSpace = removeBlankRows;
  window.PNXStep168cTodoBlankSpaceStatus = function(){
    const list = todoList();
    const children = list ? Array.from(list.children) : [];
    const visible = children.filter(el => {
      const style = getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden" && el.getBoundingClientRect().height > 0;
    });
    const bad = visible.filter(isRemoveTarget);

    return {
      step:"168c",
      todoExists:!!list,
      totalChildren:children.length,
      visibleRows:visible.length,
      badVisibleRows:bad.map(text),
      trimmed:!!(list && list.classList.contains("pnx-step168c-todo-trimmed")),
      lastRemove:window.__PNX_STEP168C_LAST_REMOVE__ || null,
      note:"やることリストから消した行の空白をDOM削除で解消"
    };
  };
})();




/* ================================================================
   STEP169: Filing flow final stabilized
   目的:
   - 申告トップ → 内容確認 → 戻る → 作成完了 → 税理士共有 の導線を固定
   - やることリストは材料整理だけに維持
   - 申告書類系/共有系の残骸・空白を継続除去
   - 作成後はトップに戻って「税理士へ共有する」を表示
   ================================================================ */
(function(){
  if (window.__PNX_STEP169_FILING_FLOW_FINAL_STABILIZED__) return;
  window.__PNX_STEP169_FILING_FLOW_FINAL_STABILIZED__ = true;

  const DOC_KEY = "PNX_FILING_STEP152_DOCUMENTS_CONFIRMED";

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  function filingHome(){
    return get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");
  }

  function filingPanel(){
    return get("tab-filing") || document.querySelector('[data-tab-panel="filing"], .fin-panel[data-panel="filing"]');
  }

  function todoList(){
    return get("pnx-step148-todo-list") || document.querySelector(".pnx-filing-ref-todo-card");
  }

  function todoSection(){
    const list = todoList();
    if (!list) return null;
    return list.closest(".pnx-filing-ref-todo-section") || list.closest("section") || list;
  }

  function docsPage(){
    return get("pnx-step144-taxdocs");
  }

  function docsDone(){
    return localStorage.getItem(DOC_KEY) === "1";
  }

  function isTodoRemoveTarget(row){
    if (!row || !row.closest) return false;
    const list = todoList();
    if (!list || !list.contains(row)) return false;

    const key = row.getAttribute && row.getAttribute("data-step148-task");
    const t = text(row);

    if (key === "documents" || key === "share") return true;

    if (/申告書類|確定申告書類|PDF|CSV|税理士へ共有|共有する/.test(t)) {
      if (/収入を確認|大会ごとの収支|経費を分類|レシート|領収書|家賃按分/.test(t)) return false;
      return true;
    }

    return false;
  }

  function cleanTodo(){
    const list = todoList();
    if (!list) return 0;

    const rows = Array.from(list.querySelectorAll(
      "[data-step148-task], .pnx-filing-ref-todo-row, button, a, [role='button'], .pnx-step165d-doc-row"
    ));

    let removed = 0;

    rows.forEach(row => {
      if (!isTodoRemoveTarget(row)) return;
      row.remove();
      removed += 1;
    });

    Array.from(list.childNodes).forEach(node => {
      if (node.nodeType === 3 && /申告書類|確定申告書類|PDF|CSV|税理士|共有/.test(String(node.textContent || ""))) {
        node.remove();
      }
      if (node.nodeType === 3 && !String(node.textContent || "").trim()) {
        node.remove();
      }
    });

    list.classList.add("pnx-step169-todo-clean");

    Array.from(list.children).forEach(child => child.classList.remove("pnx-step169-last-row"));
    const visible = Array.from(list.children).filter(el => {
      const style = getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden" && el.getBoundingClientRect().height > 0;
    });
    if (visible.length) visible[visible.length - 1].classList.add("pnx-step169-last-row");

    window.__PNX_STEP169_LAST_TODO_CLEAN__ = {
      at:new Date().toISOString(),
      removed,
      visibleRows:visible.length
    };

    return removed;
  }

  function ensureCtaArea(){
    const section = todoSection();
    if (!section || !section.parentNode) return false;

    let area = get("pnx-step169-final-flow");
    if (!area) {
      area = document.createElement("section");
      area.id = "pnx-step169-final-flow";
      area.className = "pnx-step169-final-flow";
      area.innerHTML = `
        <button type="button" id="pnx-step169-open-docs" class="pnx-step169-open-docs">
          確定申告書類作成に進む
        </button>
        <button type="button" id="pnx-step169-open-share" class="pnx-step169-open-share" aria-hidden="true">
          税理士へ共有する
        </button>
      `;
    }

    // 旧STEP167/168のエリアは消す
    const oldArea = get("pnx-step167-final-flow");
    if (oldArea && oldArea !== area) oldArea.remove();

    section.insertAdjacentElement("afterend", area);

    const oldPrimary = document.querySelectorAll(".pnx-filing-ref-primary, #pnx-step148-start-flow, #pnx-step149-create-tax-docs, [data-pnx-primary-documents-cta='true']");
    oldPrimary.forEach(el => {
      if (!el.closest("#pnx-step169-final-flow")) el.remove();
    });

    const openBtn = get("pnx-step169-open-docs");
    if (openBtn && !openBtn.__pnxStep169Bound) {
      openBtn.__pnxStep169Bound = true;
      openBtn.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        openReview();
      }, true);
    }

    const shareBtn = get("pnx-step169-open-share");
    if (shareBtn && !shareBtn.__pnxStep169Bound) {
      shareBtn.__pnxStep169Bound = true;
      shareBtn.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        openShare();
      }, true);
    }

    renderCtaState();

    window.__PNX_STEP169_LAST_CTA__ = new Date().toISOString();
    return true;
  }

  function renderCtaState(){
    const openBtn = get("pnx-step169-open-docs");
    const shareBtn = get("pnx-step169-open-share");
    const done = docsDone();

    if (openBtn) {
      openBtn.textContent = done ? "作成済みの申告書類を確認する" : "確定申告書類作成に進む";
      openBtn.classList.toggle("is-created", done);
    }

    if (shareBtn) {
      shareBtn.classList.toggle("is-visible", done);
      shareBtn.setAttribute("aria-hidden", done ? "false" : "true");
    }
  }

  function showHome(){
    const home = filingHome();
    if (home) {
      [
        "pnx-step152-home-hidden",
        "pnx-step152c-home-hidden",
        "pnx-step154-hidden",
        "pnx-step155-hidden",
        "pnx-step156-hidden",
        "pnx-step157-hidden",
        "pnx-step158-hidden"
      ].forEach(cls => home.classList.remove(cls));
      home.style.display = "";
    }

    removeBack();
    ensureCtaArea();
    cleanTodo();
    renderCtaState();
  }

  function hideHome(){
    const home = filingHome();
    if (!home) return;
    [
      "pnx-step152-home-hidden",
      "pnx-step152c-home-hidden"
    ].forEach(cls => home.classList.add(cls));
    home.style.display = "none";
  }

  function ensureDocsPageInPanel(){
    const panel = filingPanel();
    const page = docsPage();
    if (panel && page && page.parentNode !== panel) {
      panel.insertBefore(page, panel.firstElementChild);
    }
    return page;
  }

  function removeBack(){
    const back = get("pnx-step169-review-back");
    if (back) back.remove();
    const old168 = get("pnx-step168-floating-back");
    if (old168) old168.remove();
  }

  function injectBack(){
    removeBack();

    const back = document.createElement("button");
    back.type = "button";
    back.id = "pnx-step169-review-back";
    back.className = "pnx-step169-review-back";
    back.setAttribute("aria-label", "申告トップへ戻る");
    back.textContent = "←";

    function handle(e){
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      closeReview();
    }

    back.addEventListener("click", handle, true);
    back.addEventListener("pointerdown", handle, true);
    document.body.appendChild(back);
  }

  function openReview(){
    const page = ensureDocsPageInPanel();
    if (!page) return false;

    hideHome();

    // 他の詳細画面を閉じる
    [
      "pnx-step150-income-screen",
      "pnx-step154-tournament-screen",
      "pnx-step155-expense-screen",
      "pnx-step156-receipt-screen",
      "pnx-step157-rent-screen",
      "pnx-step158-share-screen"
    ].forEach(id => {
      const el = get(id);
      if (!el) return;
      el.classList.remove("is-open", "pnx-step150f-force-fixed", "pnx-step154b-force-fixed");
      el.setAttribute("aria-hidden", "true");
    });

    page.style.display = "block";
    page.classList.add("pnx-step169-review-open", "pnx-step152c-open", "pnx-step166-review-completed-mode");
    page.classList.remove("pnx-step152-taxdocs-open");
    page.setAttribute("aria-hidden", "false");

    document.body.classList.add("pnx-step169-review-open-body");

    const h2 = page.querySelector("#pnx-step152c-docs-head h2, #pnx-step152-docs-head h2");
    if (h2) h2.textContent = "申告書類の内容を確認する";

    try {
      if (typeof window.PNXStep166RenderTaxDocumentsReviewCompleted === "function") {
        window.PNXStep166RenderTaxDocumentsReviewCompleted();
      }
    } catch(e) {}

    hookCreateButtons();
    injectBack();

    try {
      page.scrollTop = 0;
      const panel = filingPanel();
      if (panel && panel.scrollTo) panel.scrollTo({ top:0, behavior:"auto" });
    } catch(e) {}

    window.__PNX_STEP169_LAST_OPEN__ = new Date().toISOString();
    return true;
  }

  function closeReview(){
    const page = docsPage();
    if (page) {
      page.classList.remove("pnx-step169-review-open", "pnx-step168-review-open", "pnx-step152c-open", "pnx-step152-taxdocs-open", "is-open");
      page.setAttribute("aria-hidden", "true");
      page.style.display = "none";
    }

    document.body.classList.remove(
      "pnx-step169-review-open-body",
      "pnx-step168-review-open-body",
      "pnx-step152c-docs-open-body",
      "pnx-step152-taxdocs-open-body"
    );

    showHome();

    try {
      const panel = filingPanel();
      if (panel && panel.scrollTo) panel.scrollTo({ top:0, behavior:"auto" });
    } catch(e) {}

    window.__PNX_STEP169_LAST_CLOSE__ = new Date().toISOString();
    return true;
  }

  function markCreated(){
    localStorage.setItem(DOC_KEY, "1");

    try {
      if (typeof window.PNXStep159ApplyFilingProgressSync === "function") {
        window.PNXStep159ApplyFilingProgressSync();
      }
    } catch(e) {}

    renderCtaState();

    window.__PNX_STEP169_LAST_CREATE__ = new Date().toISOString();
  }

  function hookCreateButtons(){
    ["pnx-step166-final-create", "pnx-step163-final-create"].forEach(id => {
      const btn = get(id);
      if (!btn || btn.__pnxStep169CreateBound) return;

      btn.__pnxStep169CreateBound = true;
      btn.addEventListener("click", function(){
        markCreated();
        setTimeout(closeReview, 700);
      }, true);
    });
  }

  function openShare(){
    try {
      if (typeof window.PNXStep158OpenTaxAdvisorShareScreen === "function") {
        window.PNXStep158OpenTaxAdvisorShareScreen();
        return true;
      }
    } catch(e) {}
    return false;
  }

  function apply(){
    cleanTodo();
    ensureCtaArea();
    hookCreateButtons();
    renderCtaState();

    window.__PNX_STEP169_LAST_APPLY__ = new Date().toISOString();
    return true;
  }

  // 古い関数が走っても、最終形に戻す
  [
    "PNXStep168cRemoveTodoBlankSpace",
    "PNXStep168bCleanupTodoDocumentRows",
    "PNXStep168EnsureDocumentsCtaSeparated",
    "PNXStep167ApplyFilingTopFlowReorganized",
    "PNXStep167bSeparateFinalFlowFromTodo",
    "PNXStep159ApplyFilingProgressSync",
    "PNXStep165dRebuildDocumentsTaskRow",
    "PNXStep165eRestorePrimaryDocumentsCta"
  ].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep169Wrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(apply, 0);
        setTimeout(apply, 180);
        return result;
      };
      wrapped.__pnxStep169Wrapped = true;
      window[name] = wrapped;
    }
  });

  // 古い開く関数はこの安定版へ寄せる
  [
    "PNXStep168OpenDocumentsCreationFlow",
    "PNXStep166bOpenTaxDocumentsReview",
    "PNXStep152cOpenTaxDocumentsStandalonePage",
    "PNXStep152bOpenTaxDocumentsFromCta",
    "PNXStep152OpenTaxDocumentsPage"
  ].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep169OpenWrapped) {
      const wrapped = function(){
        return openReview();
      };
      wrapped.__pnxStep169OpenWrapped = true;
      window[name] = wrapped;
    }
  });

  document.addEventListener("pointerdown", function(e){
    const back = e.target && e.target.closest && e.target.closest("#pnx-step169-review-back");
    if (!back) return;
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    closeReview();
  }, true);

  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest("button, a, [role='button'], .fin-tab");
    if (!trigger) return;

    if (trigger.id === "pnx-step169-review-back") {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      closeReview();
      return;
    }

    if (trigger.id === "pnx-step169-open-docs") {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      openReview();
      return;
    }

    if (trigger.id === "pnx-step169-open-share") {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      openShare();
      return;
    }

    setTimeout(apply, 100);
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(apply, 120);
    setTimeout(apply, 700);
    setTimeout(apply, 1600);
    setTimeout(apply, 2600);
  });

  window.addEventListener("storage", function(e){
    if (!e.key || e.key.indexOf("PNX_FILING_STEP") === 0 || e.key === "PNX_FINANCE_TRANSACTIONS") {
      setTimeout(apply, 120);
    }
  });

  window.PNXStep169ApplyFilingFlowFinalStabilized = apply;
  window.PNXStep169OpenReview = openReview;
  window.PNXStep169CloseReview = closeReview;
  window.PNXStep169FilingFlowFinalStabilizedStatus = function(){
    const list = todoList();
    const page = docsPage();
    const badRows = list ? Array.from(list.querySelectorAll("[data-step148-task], .pnx-filing-ref-todo-row, button, a, [role='button']")).filter(isTodoRemoveTarget).map(text) : [];
    return {
      step:169,
      todoExists:!!list,
      badRows,
      ctaExists:!!get("pnx-step169-open-docs"),
      shareVisible:!!(get("pnx-step169-open-share") && get("pnx-step169-open-share").classList.contains("is-visible")),
      docsDone:docsDone(),
      reviewOpen:!!(page && page.classList.contains("pnx-step169-review-open")),
      backExists:!!get("pnx-step169-review-back"),
      lastApply:window.__PNX_STEP169_LAST_APPLY__ || null,
      lastOpen:window.__PNX_STEP169_LAST_OPEN__ || null,
      lastClose:window.__PNX_STEP169_LAST_CLOSE__ || null,
      lastCreate:window.__PNX_STEP169_LAST_CREATE__ || null,
      note:"申告トップ〜内容確認〜作成〜共有の導線を最終安定化"
    };
  };
})();




/* ================================================================
   STEP170: Hide legacy filing output area
   目的:
   - 新しい申告導線と重複する古い「申告・出力」エリアを画面から非表示
   - コードは残し、表示だけ止める
   - 新しいSTEP169のCTA/税理士共有導線は残す
   ================================================================ */
(function(){
  if (window.__PNX_STEP170_HIDE_LEGACY_FILING_OUTPUT_AREA__) return;
  window.__PNX_STEP170_HIDE_LEGACY_FILING_OUTPUT_AREA__ = true;

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  function filingHome(){
    return get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");
  }

  function todoList(){
    return get("pnx-step148-todo-list") || document.querySelector(".pnx-filing-ref-todo-card");
  }

  function protectedArea(el){
    if (!el || !el.closest) return true;

    return !!(
      el.closest("#pnx-step169-final-flow") ||
      el.closest("#pnx-step168-open-documents-flow") ||
      el.closest("#pnx-step144-taxdocs") ||
      el.closest("#pnx-step158-share-screen") ||
      el.closest("#pnx-step167-final-flow") ||
      el.closest(".pnx-step169-final-flow")
    );
  }

  function isTodoOrPrep(el){
    if (!el || !el.closest) return false;

    return !!(
      el.closest("#pnx-step148-todo-list") ||
      el.closest(".pnx-filing-ref-todo-card") ||
      el.closest(".filing-prep-card") ||
      el.closest(".pnx-step148d-created-head")
    );
  }

  function findHideContainer(node){
    if (!node) return null;

    const selectors = [
      ".pnx-filing-output-section",
      ".pnx-filing-output-card",
      ".pnx-tax-output-section",
      ".pnx-tax-output-card",
      ".pnx-step149-output-section",
      ".pnx-step149-output-card",
      ".pnx-filing-ref-output",
      "article",
      "section",
      ".pnx-card",
      ".card"
    ];

    for (const sel of selectors) {
      const hit = node.closest && node.closest(sel);
      if (hit) return hit;
    }

    return node.parentElement || null;
  }

  function shouldHideContainer(el){
    if (!el || protectedArea(el) || isTodoOrPrep(el)) return false;

    const t = text(el);

    if (!t) return false;

    // 古い申告・出力の見出しやボタン群だけを対象
    if (/申告・出力|申告出力/.test(t)) return true;

    // 複数の旧出力語がまとまっているカードは旧エリア扱い
    const hasPdf = /PDF|CSV/.test(t);
    const hasEtax = /e-Tax|etax|電子申告/.test(t);
    const hasShare = /税理士|共有/.test(t);
    const hasCreate = /申告書類を作成する|確定申告書類を作成/.test(t);

    return false;
  }

  function shouldHideContainerSafe(el){
    if (!el || protectedArea(el) || isTodoOrPrep(el)) return false;

    const t = text(el);
    if (!t) return false;

    if (/申告・出力|申告出力/.test(t)) return true;

    const hasPdf = /PDF|CSV/.test(t);
    const hasEtax = /e-Tax|etax|電子申告/.test(t);
    const hasShare = /税理士|共有/.test(t);
    const hasCreate = /申告書類を作成する|確定申告書類を作成/.test(t);

    // 「PDF/CSV + e-Tax」または「PDF/CSV + 税理士共有」が同居する旧カードを隠す
    if ((hasPdf && hasEtax) || (hasPdf && hasShare) || (hasCreate && hasEtax)) return true;

    return false;
  }

  function hideLegacyOutputAreas(){
    const home = filingHome();
    if (!home) return 0;

    const targets = new Set();

    // 見出しから旧エリアを特定
    Array.from(home.querySelectorAll("h1,h2,h3,h4,p,strong,span,button,a,div")).forEach(el => {
      if (protectedArea(el) || isTodoOrPrep(el)) return;

      const t = text(el);
      if (!t) return;

      if (/申告・出力|申告出力/.test(t)) {
        const box = findHideContainer(el);
        if (box && box !== home) targets.add(box);
      }
    });

    // 旧出力語がまとまっているカード/sectionも対象
    Array.from(home.querySelectorAll("section,article,.pnx-card,.card,.pnx-filing-card,.pnx-filing-output-section,.pnx-filing-output-card,.pnx-tax-output-section,.pnx-tax-output-card")).forEach(el => {
      if (el === home || protectedArea(el) || isTodoOrPrep(el)) return;
      if (shouldHideContainerSafe(el)) targets.add(el);
    });

    // 旧単体ボタンも対象。ただし新STEP169のボタンは残す。
    Array.from(home.querySelectorAll("button,a,[role='button']")).forEach(el => {
      if (protectedArea(el) || isTodoOrPrep(el)) return;
      const t = text(el);
      if (/申告書類を作成する（PDF\/CSV）|e-Taxに進む|税理士へ共有する|申告・出力/.test(t)) {
        const box = findHideContainer(el);
        if (box && box !== home) targets.add(box);
        else targets.add(el);
      }
    });

    let hidden = 0;
    targets.forEach(el => {
      if (!el || el === home) return;
      el.classList.add("pnx-step170-legacy-output-hidden");
      el.setAttribute("aria-hidden", "true");
      hidden += 1;
    });

    home.classList.add("pnx-step170-home-cleaned");

    window.__PNX_STEP170_LAST_HIDE__ = {
      at:new Date().toISOString(),
      hidden
    };

    return hidden;
  }

  // 既存ステップが旧導線を復活させても最後に消す
  [
    "PNXStep169ApplyFilingFlowFinalStabilized",
    "PNXStep168cRemoveTodoBlankSpace",
    "PNXStep168EnsureDocumentsCtaSeparated",
    "PNXStep167ApplyFilingTopFlowReorganized",
    "PNXStep159ApplyFilingProgressSync"
  ].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep170Wrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(hideLegacyOutputAreas, 0);
        setTimeout(hideLegacyOutputAreas, 180);
        return result;
      };
      wrapped.__pnxStep170Wrapped = true;
      window[name] = wrapped;
    }
  });

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(hideLegacyOutputAreas, 120);
    setTimeout(hideLegacyOutputAreas, 700);
    setTimeout(hideLegacyOutputAreas, 1600);
    setTimeout(hideLegacyOutputAreas, 2600);
  });

  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest("button,a,[role='button'],.fin-tab");
    if (trigger) {
      setTimeout(hideLegacyOutputAreas, 100);
      setTimeout(hideLegacyOutputAreas, 300);
    }
  }, true);

  window.PNXStep170HideLegacyFilingOutputArea = hideLegacyOutputAreas;
  window.PNXStep170HideLegacyFilingOutputAreaStatus = function(){
    const home = filingHome();
    const hidden = home ? Array.from(home.querySelectorAll(".pnx-step170-legacy-output-hidden")).map(el => text(el).slice(0,80)) : [];
    const stillVisible = home ? Array.from(home.querySelectorAll("section,article,.pnx-card,.card,button,a,[role='button']")).filter(el => {
      if (protectedArea(el) || isTodoOrPrep(el)) return false;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || el.getBoundingClientRect().height === 0) return false;
      return /申告・出力|申告出力|e-Taxに進む/.test(text(el));
    }).map(el => text(el).slice(0,80)) : [];

    return {
      step:170,
      homeExists:!!home,
      hiddenCount:hidden.length,
      hidden,
      stillVisible,
      lastHide:window.__PNX_STEP170_LAST_HIDE__ || null,
      note:"古い申告・出力エリアを画面から非表示"
    };
  };
})();




/* ================================================================
   STEP170b: Hard hide legacy filing blocks
   目的:
   - HTMLに残っていた旧申告ブロックを実DOM上でも強制非表示/削除
   - 「申告・出力」見出し、旧ダッシュボード、旧やることリスト、旧filing-stackを消す
   - 新しいSTEP169の導線だけ残す
   ================================================================ */
(function(){
  if (window.__PNX_STEP170B_HARD_HIDE_LEGACY_FILING_BLOCKS__) return;
  window.__PNX_STEP170B_HARD_HIDE_LEGACY_FILING_BLOCKS__ = true;

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  function filingHome(){
    return get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");
  }

  function hide(el){
    if (!el) return false;
    el.classList.add("pnx-step170b-hard-hidden");
    el.setAttribute("aria-hidden", "true");
    if (el.matches("button,a,[role='button']")) el.setAttribute("tabindex", "-1");
    return true;
  }

  function removeTodoRows(){
    const list = get("pnx-step148-todo-list");
    if (!list) return 0;

    let removed = 0;
    Array.from(list.querySelectorAll("[data-step148-task='documents'], [data-step148-task='share']")).forEach(row => {
      row.remove();
      removed += 1;
    });

    Array.from(list.children).forEach(row => {
      const t = text(row);
      if (/申告書類|確定申告書類|PDF|CSV|税理士|共有/.test(t)) {
        row.remove();
        removed += 1;
      }
    });

    return removed;
  }

  function ensureNewCta(){
    const home = filingHome();
    const todoSection = document.querySelector(".pnx-filing-ref-todo-section");
    if (!home || !todoSection) return false;

    let flow = get("pnx-step169-final-flow");
    if (!flow) {
      flow = document.createElement("section");
      flow.id = "pnx-step169-final-flow";
      flow.className = "pnx-step169-final-flow";
      flow.innerHTML = `
        <button type="button" id="pnx-step169-open-docs" class="pnx-step169-open-docs">確定申告書類作成に進む</button>
        <button type="button" id="pnx-step169-open-share" class="pnx-step169-open-share" aria-hidden="true">税理士へ共有する</button>
      `;
      todoSection.insertAdjacentElement("afterend", flow);
    } else if (flow.previousElementSibling !== todoSection && todoSection.parentNode) {
      todoSection.insertAdjacentElement("afterend", flow);
    }

    const oldPrimary = get("pnx-step148-start-flow");
    if (oldPrimary) oldPrimary.remove();

    return true;
  }

  function hardHide(){
    const home = filingHome();
    if (!home) return 0;

    let count = 0;

    // Old title row.
    Array.from(home.querySelectorAll(".pnx-filing-ref-title-row")).forEach(el => {
      if (/申告・出力/.test(text(el)) || !text(el)) {
        if (hide(el)) count += 1;
      }
    });

    // Old reference rows.
    count += removeTodoRows();

    // Old primary CTA is replaced by STEP169 CTA.
    const oldPrimary = get("pnx-step148-start-flow");
    if (oldPrimary) {
      oldPrimary.remove();
      count += 1;
    }

    ensureNewCta();

    // Legacy blocks below the reference home.
    [
      ".filing-page-title",
      "#pnx-step142-taxprep",
      ".filing-prep-card",
      "#tab-filing > .filing-section-label",
      "#tab-filing > .todo-card",
      "#btn-open-doc-list",
      "#filing-stack"
    ].forEach(sel => {
      Array.from(document.querySelectorAll(sel)).forEach(el => {
        if (hide(el)) count += 1;
      });
    });

    // Keep taxdocs only as hidden overlay standby unless opened.
    const taxdocs = get("pnx-step144-taxdocs");
    if (taxdocs && !taxdocs.classList.contains("pnx-step169-review-open") && !taxdocs.classList.contains("pnx-step152c-open")) {
      taxdocs.classList.add("pnx-step170b-taxdocs-standby");
      taxdocs.setAttribute("aria-hidden", "true");
    }

    window.__PNX_STEP170B_LAST_HIDE__ = {
      at:new Date().toISOString(),
      count
    };

    return count;
  }

  [
    "PNXStep170HideLegacyFilingOutputArea",
    "PNXStep169ApplyFilingFlowFinalStabilized",
    "PNXStep168cRemoveTodoBlankSpace",
    "PNXStep159ApplyFilingProgressSync"
  ].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep170bWrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(hardHide, 0);
        setTimeout(hardHide, 180);
        return result;
      };
      wrapped.__pnxStep170bWrapped = true;
      window[name] = wrapped;
    }
  });

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(hardHide, 80);
    setTimeout(hardHide, 500);
    setTimeout(hardHide, 1200);
    setTimeout(hardHide, 2400);
  });

  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest("button,a,[role='button'],.fin-tab");
    if (trigger) {
      setTimeout(hardHide, 80);
      setTimeout(hardHide, 260);
    }
  }, true);

  window.PNXStep170bHardHideLegacyFilingBlocks = hardHide;
  window.PNXStep170bHardHideLegacyFilingBlocksStatus = function(){
    const stillVisible = [];
    [
      ".pnx-filing-ref-title-row",
      "#pnx-step142-taxprep",
      ".filing-prep-card",
      "#tab-filing > .filing-section-label",
      "#tab-filing > .todo-card",
      "#btn-open-doc-list",
      "#filing-stack"
    ].forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        const style = getComputedStyle(el);
        if (style.display !== "none" && style.visibility !== "hidden" && el.getBoundingClientRect().height > 0) {
          stillVisible.push(sel + ": " + text(el).slice(0,80));
        }
      });
    });

    const todoBad = get("pnx-step148-todo-list")
      ? Array.from(get("pnx-step148-todo-list").children).filter(el => /申告書類|PDF|CSV|税理士|共有/.test(text(el))).map(text)
      : [];

    return {
      step:"170b",
      stillVisible,
      todoBad,
      ctaExists:!!get("pnx-step169-open-docs"),
      lastHide:window.__PNX_STEP170B_LAST_HIDE__ || null,
      note:"HTMLに残っていた旧申告ブロックを強制非表示"
    };
  };
})();




/* ================================================================
   STEP170c: Restore prep ring and hide legacy output only
   目的:
   - STEP170bで消えた上部の円グラフ/申告準備率カードを復元
   - 非表示対象を下の古い申告・出力エリアだけに絞る
   ================================================================ */
(function(){
  if (window.__PNX_STEP170C_RESTORE_PREP_RING_HIDE_LEGACY_ONLY__) return;
  window.__PNX_STEP170C_RESTORE_PREP_RING_HIDE_LEGACY_ONLY__ = true;

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  function filingHome(){
    return get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");
  }

  function restorePrepRing(){
    const restored = [];

    const taxprep = get("pnx-step142-taxprep");
    if (taxprep) {
      taxprep.classList.remove("pnx-step170b-hard-hidden", "pnx-step170-legacy-output-hidden");
      taxprep.classList.add("pnx-step170c-restore-prep-ring");
      taxprep.removeAttribute("aria-hidden");
      taxprep.style.display = "";
      taxprep.style.visibility = "";
      taxprep.style.height = "";
      taxprep.style.maxHeight = "";
      taxprep.style.minHeight = "";
      taxprep.style.margin = "";
      taxprep.style.padding = "";
      restored.push("pnx-step142-taxprep");
    }

    document.querySelectorAll(".filing-prep-card").forEach(card => {
      card.classList.remove("pnx-step170b-hard-hidden", "pnx-step170-legacy-output-hidden");
      card.classList.add("pnx-step170c-restore-prep-ring");
      card.removeAttribute("aria-hidden");
      card.style.display = "";
      card.style.visibility = "";
      card.style.height = "";
      card.style.maxHeight = "";
      card.style.minHeight = "";
      card.style.margin = "";
      card.style.padding = "";
      restored.push("filing-prep-card");
    });

    // Ring/progress labels must remain visible if they were hidden by broad selectors.
    document.querySelectorAll(".prep-ring, .ring-wrap, .ring-label, .ring-num, .ring-fill, #ring-label, #ring-fill, #pnx-step148-progress-num, #pnx-step148-ring-progress").forEach(el => {
      el.classList.remove("pnx-step170b-hard-hidden", "pnx-step170-legacy-output-hidden");
      el.removeAttribute("aria-hidden");
      el.style.display = "";
      el.style.visibility = "";
    });

    window.__PNX_STEP170C_LAST_RESTORE__ = {
      at:new Date().toISOString(),
      restored
    };

    return restored.length;
  }

  function hideLegacyOutputOnly(){
    const home = filingHome();
    if (!home) return 0;

    let hidden = 0;

    // Keep these visible explicitly.
    restorePrepRing();

    // Hide old duplicate title and old output/todo blocks only.
    [
      ".pnx-filing-ref-title-row",
      "#tab-filing > .filing-page-title",
      "#tab-filing > .filing-section-label",
      "#tab-filing > .todo-card",
      "#btn-open-doc-list",
      "#filing-stack"
    ].forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        // Do not hide prep cards/rings.
        if (el.closest("#pnx-step142-taxprep") || el.closest(".filing-prep-card") || el.matches(".filing-prep-card, #pnx-step142-taxprep")) return;

        const t = text(el);
        if (
          sel === ".pnx-filing-ref-title-row" ||
          sel === "#btn-open-doc-list" ||
          sel === "#filing-stack" ||
          /申告・出力|申告出力|やることリスト|申告書類を作成|PDF|CSV|e-Tax|税理士/.test(t)
        ) {
          el.classList.add("pnx-step170c-legacy-output-hidden");
          el.setAttribute("aria-hidden", "true");
          hidden += 1;
        }
      });
    });

    // Remove duplicate documents/share rows from new todo list only.
    const todoList = get("pnx-step148-todo-list");
    if (todoList) {
      Array.from(todoList.querySelectorAll("[data-step148-task='documents'], [data-step148-task='share']")).forEach(row => {
        row.remove();
        hidden += 1;
      });
      Array.from(todoList.children).forEach(row => {
        if (/申告書類|PDF|CSV|税理士|共有/.test(text(row))) {
          row.remove();
          hidden += 1;
        }
      });
    }

    window.__PNX_STEP170C_LAST_HIDE__ = {
      at:new Date().toISOString(),
      hidden
    };

    return hidden;
  }

  // Override/repair after STEP170b and older steps run.
  [
    "PNXStep170bHardHideLegacyFilingBlocks",
    "PNXStep170HideLegacyFilingOutputArea",
    "PNXStep169ApplyFilingFlowFinalStabilized",
    "PNXStep168cRemoveTodoBlankSpace",
    "PNXStep159ApplyFilingProgressSync"
  ].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep170cWrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(function(){
          restorePrepRing();
          hideLegacyOutputOnly();
          restorePrepRing();
        }, 0);
        setTimeout(function(){
          restorePrepRing();
          hideLegacyOutputOnly();
          restorePrepRing();
        }, 220);
        return result;
      };
      wrapped.__pnxStep170cWrapped = true;
      window[name] = wrapped;
    }
  });

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(function(){ restorePrepRing(); hideLegacyOutputOnly(); restorePrepRing(); }, 80);
    setTimeout(function(){ restorePrepRing(); hideLegacyOutputOnly(); restorePrepRing(); }, 600);
    setTimeout(function(){ restorePrepRing(); hideLegacyOutputOnly(); restorePrepRing(); }, 1500);
    setTimeout(function(){ restorePrepRing(); hideLegacyOutputOnly(); restorePrepRing(); }, 2600);
  });

  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest("button,a,[role='button'],.fin-tab");
    if (trigger) {
      setTimeout(function(){ restorePrepRing(); hideLegacyOutputOnly(); restorePrepRing(); }, 120);
      setTimeout(function(){ restorePrepRing(); hideLegacyOutputOnly(); restorePrepRing(); }, 360);
    }
  }, true);

  window.PNXStep170cRestorePrepRing = restorePrepRing;
  window.PNXStep170cHideLegacyOutputOnly = hideLegacyOutputOnly;
  window.PNXStep170cRestorePrepRingHideLegacyOnlyStatus = function(){
    const taxprep = get("pnx-step142-taxprep");
    const prepCards = Array.from(document.querySelectorAll(".filing-prep-card"));
    function visible(el){
      if (!el) return false;
      const st = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return st.display !== "none" && st.visibility !== "hidden" && rect.height > 0;
    }

    const oldVisible = [];
    [
      ".pnx-filing-ref-title-row",
      "#tab-filing > .filing-page-title",
      "#tab-filing > .filing-section-label",
      "#tab-filing > .todo-card",
      "#btn-open-doc-list",
      "#filing-stack"
    ].forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (el.closest("#pnx-step142-taxprep") || el.closest(".filing-prep-card")) return;
        if (visible(el)) oldVisible.push(sel + ": " + text(el).slice(0,80));
      });
    });

    return {
      step:"170c",
      taxprepVisible:visible(taxprep),
      prepCardVisible:prepCards.some(visible),
      oldVisible,
      ctaExists:!!get("pnx-step169-open-docs"),
      lastRestore:window.__PNX_STEP170C_LAST_RESTORE__ || null,
      lastHide:window.__PNX_STEP170C_LAST_HIDE__ || null,
      note:"上部円グラフ/準備率カードを復元し、旧出力エリアだけ非表示"
    };
  };
})();




/* ================================================================
   STEP171: Filing tab final structure fixed
   目的:
   - 申告タブの正式構成を1つに固定
   - 表示するのは「準備状況リング」「材料整理のやること一覧」「確定申告書類作成に進む」だけ
   - 旧申告・出力/旧ダッシュボード/旧ボタン群はlegacyとして隔離
   - 内容確認画面の戻る/作成後共有導線を維持
   ================================================================ */
(function(){
  if (window.__PNX_STEP171_FILING_TAB_FINAL_STRUCTURE_FIXED__) return;
  window.__PNX_STEP171_FILING_TAB_FINAL_STRUCTURE_FIXED__ = true;

  const DOC_KEY = "PNX_FILING_STEP152_DOCUMENTS_CONFIRMED";

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  function panel(){ return get("tab-filing"); }
  function home(){ return get("pnx-step148-filing-home"); }
  function todoList(){ return get("pnx-step148-todo-list"); }
  function docsPage(){ return get("pnx-step144-taxdocs"); }
  function docsDone(){ return localStorage.getItem(DOC_KEY) === "1"; }

  function isVisible(el){
    if (!el) return false;
    const st = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return st.display !== "none" && st.visibility !== "hidden" && rect.height > 0;
  }

  function setHidden(el, yes){
    if (!el) return;
    el.classList.toggle("pnx-step171-legacy-filing-hidden", !!yes);
    if (yes) el.setAttribute("aria-hidden", "true");
    else el.removeAttribute("aria-hidden");
  }

  function legacySelectors(){
    return [
      "#pnx-step142-taxprep",
      ".filing-page-title",
      ".filing-prep-card",
      "#tab-filing > .filing-section-label",
      "#tab-filing > .todo-card",
      "#btn-open-doc-list",
      "#filing-stack",
      ".pnx-filing-output-section",
      ".pnx-filing-output-card",
      ".pnx-tax-output-section",
      ".pnx-tax-output-card",
      ".pnx-step149-output-section",
      ".pnx-step149-output-card",
      ".pnx-filing-ref-output"
    ];
  }

  function hideLegacyBlocks(){
    const p = panel();
    if (!p) return 0;
    let count = 0;

    legacySelectors().forEach(sel => {
      p.querySelectorAll(sel).forEach(el => {
        // Official home and document overlay are not legacy.
        if (el.closest("#pnx-step148-filing-home") || el.closest("#pnx-step144-taxdocs")) return;
        setHidden(el, true);
        count += 1;
      });
    });

    // Any old direct child with the old output words is legacy, except official home / taxdocs.
    Array.from(p.children).forEach(el => {
      if (el.id === "pnx-step148-filing-home" || el.id === "pnx-step144-taxdocs") return;
      const t = text(el);
      if (/申告・出力|申告出力|申告準備ダッシュボード|今年の申告準備率|e-Tax|PDF出力|税理士共有メモ|申告書類を作成する（PDF\/CSV）/.test(t)) {
        setHidden(el, true);
        count += 1;
      }
    });

    window.__PNX_STEP171_LAST_HIDE_LEGACY__ = { at:new Date().toISOString(), count };
    return count;
  }

  function ensureOfficialHome(){
    const p = panel();
    const h = home();
    if (!p || !h) return false;

    h.classList.add("pnx-step171-official-filing-home");
    setHidden(h, false);

    // Keep official home as first meaningful filing screen.
    if (h.parentNode === p && p.firstElementChild !== h) {
      p.insertBefore(h, p.firstElementChild);
    }

    // The old title row should stay hidden; status card is the real header.
    const titleRow = h.querySelector(".pnx-filing-ref-title-row");
    if (titleRow) setHidden(titleRow, true);

    // Status/ring must be visible.
    h.querySelectorAll(".pnx-filing-ref-status-card,.pnx-filing-ref-ring,.pnx-filing-ref-ring-label,#pnx-step148-ring-progress,#pnx-step148-progress-num").forEach(el => {
      el.classList.remove("pnx-step170b-hard-hidden", "pnx-step170-legacy-output-hidden", "pnx-step171-legacy-filing-hidden");
      el.removeAttribute("aria-hidden");
      el.style.display = "";
      el.style.visibility = "";
      el.style.height = "";
    });

    return true;
  }

  function rowHTML(key, title, status, circle){
    const done = status === "完了";
    const warn = /不足|未/.test(status) && !done;
    return `
      <button type="button" class="pnx-filing-ref-todo-row pnx-step171-prep-row" data-step148-task="${key}">
        <span class="circle ${done ? "done" : warn ? "empty" : "empty"}">${done ? "✓" : ""}</span>
        <strong>${title}</strong>
        <em class="${done ? "done" : warn ? "warn" : ""}">${status}</em>
        <i>›</i>
      </button>
    `;
  }

  function keyDone(key){
    const map = {
      transactions: "PNX_FILING_STEP150_INCOME_CONFIRMED",
      tournaments: "PNX_FILING_STEP154_TOURNAMENT_CONFIRMED",
      categories: "PNX_FILING_STEP155_EXPENSE_CONFIRMED",
      receipts: "PNX_FILING_STEP156_RECEIPT_CONFIRMED",
      rent: "PNX_FILING_STEP157_RENT_CONFIRMED"
    };
    return localStorage.getItem(map[key]) === "1";
  }

  function rebuildTodo(){
    const list = todoList();
    if (!list) return false;

    const rows = [
      ["transactions", "収支の入力・確認", keyDone("transactions") ? "完了" : "未確認"],
      ["tournaments", "大会ごとの収支を確認", keyDone("tournaments") ? "完了" : "未確認"],
      ["categories", "経費の分類", keyDone("categories") ? "完了" : "未確認"],
      ["receipts", "レシートの確認・不足分の追加", keyDone("receipts") ? "完了" : "不足あり"],
      ["rent", "家賃按分の確認（該当者のみ）", keyDone("rent") ? "完了" : "任意"]
    ];

    list.innerHTML = rows.map(r => rowHTML(r[0], r[1], r[2])).join("");
    list.classList.add("pnx-step171-official-todo");

    bindTodoRows();
    return true;
  }

  function bindTodoRows(){
    const list = todoList();
    if (!list) return;
    list.querySelectorAll("[data-step148-task]").forEach(row => {
      if (row.__pnxStep171Bound) return;
      row.__pnxStep171Bound = true;
      row.addEventListener("click", function(e){
        const key = row.getAttribute("data-step148-task");
        if (key === "transactions" && typeof window.PNXStep150OpenIncomeConfirmScreen === "function") window.PNXStep150OpenIncomeConfirmScreen();
        if (key === "tournaments" && typeof window.PNXStep154OpenTournamentFinanceConfirmScreen === "function") window.PNXStep154OpenTournamentFinanceConfirmScreen();
        if (key === "categories" && typeof window.PNXStep155OpenExpenseCategoryConfirmScreen === "function") window.PNXStep155OpenExpenseCategoryConfirmScreen();
        if (key === "receipts" && typeof window.PNXStep156OpenReceiptConfirmScreen === "function") window.PNXStep156OpenReceiptConfirmScreen();
        if (key === "rent" && typeof window.PNXStep157OpenRentAllocationConfirmScreen === "function") window.PNXStep157OpenRentAllocationConfirmScreen();
      }, true);
    });
  }

  function ensureCta(){
    const h = home();
    const todoSection = h && h.querySelector(".pnx-filing-ref-todo-section");
    if (!h || !todoSection) return false;

    let area = get("pnx-step171-final-flow") || get("pnx-step169-final-flow");
    if (!area) {
      area = document.createElement("section");
      area.id = "pnx-step171-final-flow";
    }
    area.id = "pnx-step171-final-flow";
    area.className = "pnx-step171-final-flow";
    area.innerHTML = `
      <button type="button" id="pnx-step171-open-docs" class="pnx-step171-open-docs">
        ${docsDone() ? "作成済みの申告書類を確認する" : "確定申告書類作成に進む"}
      </button>
      <button type="button" id="pnx-step171-open-share" class="pnx-step171-open-share ${docsDone() ? "is-visible" : ""}" aria-hidden="${docsDone() ? "false" : "true"}">
        税理士へ共有する
      </button>
    `;
    todoSection.insertAdjacentElement("afterend", area);

    const old169 = get("pnx-step169-final-flow");
    if (old169 && old169 !== area) old169.remove();
    const old168 = get("pnx-step167-final-flow");
    if (old168 && old168 !== area) old168.remove();

    const open = get("pnx-step171-open-docs");
    if (open && !open.__pnxStep171Bound) {
      open.__pnxStep171Bound = true;
      open.addEventListener("click", function(e){
        e.preventDefault(); e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        openReview();
      }, true);
    }

    const share = get("pnx-step171-open-share");
    if (share && !share.__pnxStep171Bound) {
      share.__pnxStep171Bound = true;
      share.addEventListener("click", function(e){
        e.preventDefault(); e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        if (typeof window.PNXStep158OpenTaxAdvisorShareScreen === "function") window.PNXStep158OpenTaxAdvisorShareScreen();
      }, true);
    }

    return true;
  }

  function ensureTaxDocsStandby(){
    const page = docsPage();
    if (!page) return false;
    page.classList.add("pnx-step171-taxdocs-standby");
    if (!page.classList.contains("pnx-step171-review-open") && !page.classList.contains("pnx-step169-review-open") && !page.classList.contains("pnx-step152c-open")) {
      page.setAttribute("aria-hidden", "true");
      page.style.display = "none";
    }
    return true;
  }

  function hideHomeForReview(){
    const h = home();
    if (!h) return;
    h.classList.add("pnx-step171-home-hidden");
    h.style.display = "none";
  }

  function showHomeAfterReview(){
    const h = home();
    if (!h) return;
    h.classList.remove("pnx-step171-home-hidden", "pnx-step152-home-hidden", "pnx-step152c-home-hidden");
    h.style.display = "";
  }

  function removeBack(){
    ["pnx-step171-review-back", "pnx-step169-review-back", "pnx-step168-floating-back"].forEach(id => {
      const el = get(id);
      if (el) el.remove();
    });
  }

  function injectBack(){
    removeBack();
    const back = document.createElement("button");
    back.type = "button";
    back.id = "pnx-step171-review-back";
    back.className = "pnx-step171-review-back";
    back.textContent = "←";
    back.setAttribute("aria-label", "申告トップへ戻る");
    function close(e){
      e.preventDefault(); e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
      closeReview();
    }
    back.addEventListener("click", close, true);
    back.addEventListener("pointerdown", close, true);
    document.body.appendChild(back);
  }

  function openReview(){
    const p = panel();
    const page = docsPage();
    if (!p || !page) return false;
    if (page.parentNode !== p) p.insertBefore(page, p.firstElementChild);

    hideHomeForReview();
    hideLegacyBlocks();

    page.style.display = "block";
    page.classList.add("pnx-step171-review-open", "pnx-step152c-open", "pnx-step166-review-completed-mode");
    page.classList.remove("pnx-step171-taxdocs-standby", "pnx-step152-taxdocs-open");
    page.setAttribute("aria-hidden", "false");
    document.body.classList.add("pnx-step171-review-open-body");

    const h2 = page.querySelector("#pnx-step152c-docs-head h2, #pnx-step152-docs-head h2, .pnx-taxdocs-hero h2");
    if (h2) h2.textContent = "申告書類の内容を確認する";

    try { if (typeof window.PNXStep166RenderTaxDocumentsReviewCompleted === "function") window.PNXStep166RenderTaxDocumentsReviewCompleted(); } catch(e) {}

    hookCreateButtons();
    injectBack();

    try { page.scrollTop = 0; } catch(e) {}
    window.__PNX_STEP171_LAST_OPEN__ = new Date().toISOString();
    return true;
  }

  function closeReview(){
    const page = docsPage();
    if (page) {
      page.classList.remove("pnx-step171-review-open", "pnx-step169-review-open", "pnx-step168-review-open", "pnx-step152c-open", "pnx-step152-taxdocs-open", "is-open");
      page.classList.add("pnx-step171-taxdocs-standby");
      page.setAttribute("aria-hidden", "true");
      page.style.display = "none";
    }
    document.body.classList.remove("pnx-step171-review-open-body", "pnx-step169-review-open-body", "pnx-step168-review-open-body", "pnx-step152c-docs-open-body");
    removeBack();
    showHomeAfterReview();
    apply();
    window.__PNX_STEP171_LAST_CLOSE__ = new Date().toISOString();
    return true;
  }

  function markCreated(){
    localStorage.setItem(DOC_KEY, "1");
    ensureCta();
    rebuildTodo();
    window.__PNX_STEP171_LAST_CREATE__ = new Date().toISOString();
  }

  function hookCreateButtons(){
    ["pnx-step166-final-create", "pnx-step163-final-create"].forEach(id => {
      const btn = get(id);
      if (!btn || btn.__pnxStep171CreateBound) return;
      btn.__pnxStep171CreateBound = true;
      btn.addEventListener("click", function(){
        markCreated();
        setTimeout(closeReview, 700);
      }, true);
    });
  }

  function apply(){
    ensureOfficialHome();
    rebuildTodo();
    ensureCta();
    ensureTaxDocsStandby();
    hideLegacyBlocks();
    window.__PNX_STEP171_LAST_APPLY__ = new Date().toISOString();
    return true;
  }

  // Old steps may re-show hidden blocks; always return to this final structure.
  [
    "PNXStep170cRestorePrepRing",
    "PNXStep170cHideLegacyOutputOnly",
    "PNXStep170bHardHideLegacyFilingBlocks",
    "PNXStep170HideLegacyFilingOutputArea",
    "PNXStep169ApplyFilingFlowFinalStabilized",
    "PNXStep168cRemoveTodoBlankSpace",
    "PNXStep159ApplyFilingProgressSync"
  ].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep171Wrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(apply, 0);
        setTimeout(apply, 220);
        return result;
      };
      wrapped.__pnxStep171Wrapped = true;
      window[name] = wrapped;
    }
  });

  [
    "PNXStep169OpenReview",
    "PNXStep168OpenDocumentsCreationFlow",
    "PNXStep166bOpenTaxDocumentsReview",
    "PNXStep152cOpenTaxDocumentsStandalonePage",
    "PNXStep152bOpenTaxDocumentsFromCta",
    "PNXStep152OpenTaxDocumentsPage"
  ].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep171OpenWrapped) {
      const wrapped = function(){ return openReview(); };
      wrapped.__pnxStep171OpenWrapped = true;
      window[name] = wrapped;
    }
  });

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(apply, 80);
    setTimeout(apply, 500);
    setTimeout(apply, 1200);
    setTimeout(apply, 2400);
  });

  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest("button,a,[role='button'],.fin-tab");
    if (trigger) setTimeout(apply, 120);
  }, true);

  window.PNXStep171ApplyFilingTabFinalStructure = apply;
  window.PNXStep171OpenReview = openReview;
  window.PNXStep171CloseReview = closeReview;
  window.PNXStep171FilingTabFinalStructureStatus = function(){
    const p = panel();
    const h = home();
    const page = docsPage();
    const visibleLegacy = [];
    if (p) {
      legacySelectors().forEach(sel => {
        p.querySelectorAll(sel).forEach(el => {
          if (el.closest("#pnx-step148-filing-home") || el.closest("#pnx-step144-taxdocs")) return;
          if (isVisible(el)) visibleLegacy.push(sel + ": " + text(el).slice(0, 60));
        });
      });
    }
    return {
      step:171,
      officialHomeVisible:isVisible(h),
      statusCardVisible:isVisible(h && h.querySelector(".pnx-filing-ref-status-card")),
      todoRows:todoList() ? Array.from(todoList().querySelectorAll("[data-step148-task]")).map(el => el.getAttribute("data-step148-task")) : [],
      ctaExists:!!get("pnx-step171-open-docs"),
      shareVisible:isVisible(get("pnx-step171-open-share")),
      reviewOpen:!!(page && page.classList.contains("pnx-step171-review-open")),
      visibleLegacy,
      docsDone:docsDone(),
      lastApply:window.__PNX_STEP171_LAST_APPLY__ || null,
      lastOpen:window.__PNX_STEP171_LAST_OPEN__ || null,
      lastClose:window.__PNX_STEP171_LAST_CLOSE__ || null,
      lastCreate:window.__PNX_STEP171_LAST_CREATE__ || null,
      note:"申告タブを最終構成に固定"
    };
  };
})();
















/* ================================================================
   STEP174: Tax PDF/CSV real data exports
   目的:
   - 確定申告書類作成ボタンで、実データからPDF用レポート/CSVを作成
   - CSVはBlobで保存
   - PDFはブラウザの印刷/保存PDFを使うHTMLレポートとして生成
   - 作成後に保存ボタン一覧を表示
   ================================================================ */
(function(){
  if (window.__PNX_STEP174_TAX_PDF_CSV_REAL_DATA_EXPORTS__) return;
  window.__PNX_STEP174_TAX_PDF_CSV_REAL_DATA_EXPORTS__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";
  const DOC_KEY = "PNX_FILING_STEP152_DOCUMENTS_CONFIRMED";
  const PACKAGE_KEY = "PNX_TAX_EXPORT_PACKAGE_LAST";

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }
  function yen(n){ return "¥" + Math.round(Number(n || 0)).toLocaleString("ja-JP"); }
  function safe(s){ return String(s == null ? "" : s).replace(/[<>&"]/g, ch => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;", '"':"&quot;" }[ch])); }

  function readTransactions(){
    try {
      if (typeof window.PNXStep138gGetAllFinanceTransactions === "function") {
        const list = window.PNXStep138gGetAllFinanceTransactions();
        if (Array.isArray(list)) return list;
      }
    } catch(e) {}

    try {
      const list = JSON.parse(localStorage.getItem(TX_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function amount(tx){
    return Math.abs(Number(tx && (tx.amount || tx.value || tx.price || 0)) || 0);
  }

  function typeOf(tx){
    if (!tx) return "expense";
    const t = String(tx.type || tx.kind || tx.flow || tx.side || "").toLowerCase();
    if (t.includes("income") || t.includes("revenue") || t === "in") return "income";
    if (tx.income === true || tx.isIncome === true) return "income";
    return "expense";
  }

  function dateOf(tx){
    return String((tx && (tx.date || tx.startDate || tx.createdAt || tx.paidAt)) || "");
  }

  function yearOf(tx){
    const y = Number(dateOf(tx).slice(0,4));
    return y || null;
  }

  function selectedYear(txs){
    const y = Number((get("pnx-step142-year") && get("pnx-step142-year").value) || "");
    if (y) return y;
    const years = txs.map(yearOf).filter(Boolean);
    return years.length ? Math.max.apply(null, years) : new Date().getFullYear();
  }

  function titleOf(tx){
    return String((tx && (tx.title || tx.name || tx.memo || tx.description || tx.label)) || "取引").trim();
  }

  function categoryOf(tx){
    return String((tx && (tx.categoryLabel || tx.categoryName || tx.category || tx.typeLabel)) || "").trim();
  }

  function tournamentOf(tx){
    if (!tx) return "";
    const vals = [
      tx.tournamentName,
      tx.tournamentTitle,
      tx.tournament,
      tx.eventName,
      tx.eventTitle,
      tx.tournamentLabel,
      tx.relatedTournament
    ];

    if (tx.tournamentInfo && typeof tx.tournamentInfo === "object") vals.unshift(tx.tournamentInfo.title, tx.tournamentInfo.name);
    if (tx.tournamentData && typeof tx.tournamentData === "object") vals.unshift(tx.tournamentData.title, tx.tournamentData.name);

    return vals.map(v => String(v || "").trim()).find(Boolean) || "";
  }

  function hasReceipt(tx){
    if (!tx) return false;
    if (tx.hasReceipt === true || tx.receiptAttached === true || tx.attachment === true) return true;
    if (Array.isArray(tx.receipts) && tx.receipts.length) return true;
    if (Array.isArray(tx.attachments) && tx.attachments.length) return true;
    const fields = [tx.receiptUrl, tx.receiptImage, tx.receiptImageUrl, tx.fileUrl, tx.attachmentUrl, tx.photoUrl, tx.scanUrl, tx.receiptId, tx.attachmentId, tx.imageUrl, tx.image];
    return fields.some(v => String(v || "").trim());
  }

  function buildPackage(){
    const raw = readTransactions().filter(tx => amount(tx) > 0);
    const year = selectedYear(raw);
    const txs = raw.filter(tx => (yearOf(tx) || year) === year);

    const income = [];
    const expenses = [];
    const all = [];
    const tournaments = {};
    const categories = {};

    txs.forEach((tx, index) => {
      const kind = typeOf(tx);
      const item = {
        no:index + 1,
        id:String(tx.id || tx.uid || tx.key || index + 1),
        date:dateOf(tx),
        type:kind === "income" ? "収入" : "経費",
        title:titleOf(tx),
        category:categoryOf(tx) || "未分類",
        tournament:tournamentOf(tx),
        amount:amount(tx),
        receipt:hasReceipt(tx) ? "あり" : "なし"
      };

      all.push(item);
      if (kind === "income") income.push(item);
      else {
        expenses.push(item);
        categories[item.category] = (categories[item.category] || 0) + item.amount;
      }

      if (item.tournament) {
        if (!tournaments[item.tournament]) {
          tournaments[item.tournament] = { name:item.tournament, income:0, expense:0, count:0 };
        }
        tournaments[item.tournament].count += 1;
        if (kind === "income") tournaments[item.tournament].income += item.amount;
        else tournaments[item.tournament].expense += item.amount;
      }
    });

    const incomeTotal = income.reduce((sum, x) => sum + x.amount, 0);
    const expenseTotal = expenses.reduce((sum, x) => sum + x.amount, 0);
    const receiptMissing = expenses.filter(x => x.receipt !== "あり").length;

    const summary = {
      year,
      incomeTotal,
      expenseTotal,
      profit:incomeTotal - expenseTotal,
      incomeCount:income.length,
      expenseCount:expenses.length,
      allCount:all.length,
      tournamentCount:Object.keys(tournaments).length,
      receiptMissing,
      createdAt:new Date().toISOString()
    };

    return {
      summary,
      rows:{ income, expenses, all },
      tournaments:Object.values(tournaments).map(t => ({ ...t, profit:t.income - t.expense })),
      categories:Object.keys(categories).map(name => ({ name, amount:categories[name] })).sort((a,b) => b.amount - a.amount)
    };
  }

  function csvEscape(v){
    const s = String(v == null ? "" : v);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function toCsv(headers, rows){
    const head = headers.map(h => csvEscape(h.label)).join(",");
    const body = rows.map(row => headers.map(h => csvEscape(typeof h.value === "function" ? h.value(row) : row[h.key])).join(",")).join("\n");
    return "\ufeff" + head + (body ? "\n" + body : "");
  }

  function downloadBlob(filename, content, type){
    const blob = new Blob([content], { type:type || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 500);
  }

  function baseFileName(pkg, name, ext){
    return `ProNexaX_${pkg.summary.year}_${name}.${ext}`;
  }

  function getPackage(){
    try {
      const stored = JSON.parse(localStorage.getItem(PACKAGE_KEY) || "null");
      if (stored && stored.summary) return stored;
    } catch(e) {}
    return buildPackage();
  }

  function savePackage(pkg){
    localStorage.setItem(PACKAGE_KEY, JSON.stringify(pkg));
    localStorage.setItem(DOC_KEY, "1");
    window.__PNX_STEP174_LAST_PACKAGE__ = pkg;
    window.__PNX_STEP174_LAST_CREATE__ = new Date().toISOString();

    try {
      if (typeof window.PNXStep173ApplyFilingProgressRingLogic === "function") window.PNXStep173ApplyFilingProgressRingLogic();
      if (typeof window.PNXStep169ApplyFilingFlowFinalStabilized === "function") window.PNXStep169ApplyFilingFlowFinalStabilized();
    } catch(e) {}

    return pkg;
  }

  const txHeaders = [
    { key:"date", label:"日付" },
    { key:"type", label:"区分" },
    { key:"title", label:"内容" },
    { key:"category", label:"カテゴリ" },
    { key:"tournament", label:"大会" },
    { key:"amount", label:"金額" },
    { key:"receipt", label:"レシート" }
  ];

  function downloadAllCsv(){
    const pkg = getPackage();
    downloadBlob(baseFileName(pkg, "全取引明細", "csv"), toCsv(txHeaders, pkg.rows.all), "text/csv;charset=utf-8");
  }

  function downloadExpenseCsv(){
    const pkg = getPackage();
    downloadBlob(baseFileName(pkg, "経費一覧", "csv"), toCsv(txHeaders, pkg.rows.expenses), "text/csv;charset=utf-8");
  }

  function downloadTournamentCsv(){
    const pkg = getPackage();
    const headers = [
      { key:"name", label:"大会名" },
      { key:"income", label:"収入" },
      { key:"expense", label:"経費" },
      { key:"profit", label:"差引" },
      { key:"count", label:"取引件数" }
    ];
    downloadBlob(baseFileName(pkg, "大会別収支", "csv"), toCsv(headers, pkg.tournaments), "text/csv;charset=utf-8");
  }

  function downloadSummaryCsv(){
    const pkg = getPackage();
    const rows = [
      { label:"収入合計", value:pkg.summary.incomeTotal },
      { label:"経費合計", value:pkg.summary.expenseTotal },
      { label:"差引利益", value:pkg.summary.profit },
      { label:"収入件数", value:pkg.summary.incomeCount },
      { label:"経費件数", value:pkg.summary.expenseCount },
      { label:"大会数", value:pkg.summary.tournamentCount },
      { label:"レシート不足", value:pkg.summary.receiptMissing }
    ];
    downloadBlob(baseFileName(pkg, "収支サマリー", "csv"), toCsv([{key:"label", label:"項目"}, {key:"value", label:"値"}], rows), "text/csv;charset=utf-8");
  }

  function reportHTML(pkg, mode){
    const title = mode === "advisor" ? "税理士確認用レポート" : "収支一覧レポート";
    const rows = mode === "advisor" ? pkg.rows.all.slice(0, 80) : pkg.rows.all;
    return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>${safe(title)} - ProNexaX</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Noto Sans JP",sans-serif;margin:32px;color:#1d1d1f;background:#fff;}
  h1{font-size:24px;margin:0 0 4px;letter-spacing:-.04em;}
  .sub{color:#667085;font-size:13px;margin-bottom:24px;}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0;}
  .card{border:1px solid #e5e7eb;border-radius:14px;padding:14px;}
  .card span{display:block;color:#667085;font-size:12px;margin-bottom:8px;}
  .card strong{font-size:20px;}
  table{width:100%;border-collapse:collapse;margin-top:18px;font-size:12px;}
  th,td{border-bottom:1px solid #e5e7eb;padding:8px;text-align:left;vertical-align:top;}
  th{background:#f8fafc;color:#475467;font-weight:700;}
  .actions{position:sticky;top:0;background:#fff;padding:0 0 16px;margin-bottom:8px;}
  button{height:40px;border:0;border-radius:10px;background:#2563eb;color:#fff;font-weight:700;padding:0 16px;}
  @media print{.actions{display:none} body{margin:18mm}.card{break-inside:avoid}}
</style>
</head>
<body>
  <div class="actions"><button onclick="window.print()">PDFとして保存/印刷</button></div>
  <h1>${safe(title)}</h1>
  <div class="sub">ProNexaX / ${pkg.summary.year}年 / 作成日時 ${new Date(pkg.summary.createdAt).toLocaleString("ja-JP")}</div>
  <div class="grid">
    <div class="card"><span>収入合計</span><strong>${safe(yen(pkg.summary.incomeTotal))}</strong></div>
    <div class="card"><span>経費合計</span><strong>${safe(yen(pkg.summary.expenseTotal))}</strong></div>
    <div class="card"><span>差引利益</span><strong>${safe(yen(pkg.summary.profit))}</strong></div>
  </div>
  <div class="grid">
    <div class="card"><span>収入件数</span><strong>${pkg.summary.incomeCount}件</strong></div>
    <div class="card"><span>経費件数</span><strong>${pkg.summary.expenseCount}件</strong></div>
    <div class="card"><span>レシート不足</span><strong>${pkg.summary.receiptMissing}件</strong></div>
  </div>
  <h2>取引明細</h2>
  <table>
    <thead><tr><th>日付</th><th>区分</th><th>内容</th><th>カテゴリ</th><th>大会</th><th>金額</th><th>レシート</th></tr></thead>
    <tbody>
      ${rows.map(r => `<tr><td>${safe(r.date)}</td><td>${safe(r.type)}</td><td>${safe(r.title)}</td><td>${safe(r.category)}</td><td>${safe(r.tournament)}</td><td>${safe(yen(r.amount))}</td><td>${safe(r.receipt)}</td></tr>`).join("")}
    </tbody>
  </table>
</body>
</html>`;
  }

  function openReport(mode){
    const pkg = getPackage();
    const win = window.open("", "_blank");
    if (!win) {
      downloadBlob(baseFileName(pkg, mode === "advisor" ? "税理士確認用PDF_html" : "収支一覧PDF_html", "html"), reportHTML(pkg, mode), "text/html;charset=utf-8");
      return;
    }
    win.document.open();
    win.document.write(reportHTML(pkg, mode));
    win.document.close();
  }

  function ensureExportResultCard(pkg){
    const root = get("pnx-step166-review-root") || get("pnx-step144-taxdocs");
    if (!root) return false;

    let card = get("pnx-step174-export-result");
    if (!card) {
      card = document.createElement("article");
      card.id = "pnx-step174-export-result";
      card.className = "pnx-step174-export-result";
      const finalCard = get("pnx-step166-final-create");
      if (finalCard && finalCard.closest("article")) {
        finalCard.closest("article").insertAdjacentElement("afterend", card);
      } else {
        root.appendChild(card);
      }
    }

    card.innerHTML = `
      <p class="pnx-step174-kicker">Created</p>
      <h3>PDF/CSVを作成しました</h3>
      <p>${pkg.summary.year}年の収支データをもとに、保存できる書類を準備しました。</p>
      <div class="pnx-step174-summary">
        <div><span>収入</span><strong>${yen(pkg.summary.incomeTotal)}</strong></div>
        <div><span>経費</span><strong>${yen(pkg.summary.expenseTotal)}</strong></div>
        <div><span>差引</span><strong>${yen(pkg.summary.profit)}</strong></div>
      </div>
      <div class="pnx-step174-actions">
        <button type="button" data-step174-export="report">収支一覧PDF</button>
        <button type="button" data-step174-export="advisor">税理士確認用PDF</button>
        <button type="button" data-step174-export="summary">収支サマリーCSV</button>
        <button type="button" data-step174-export="expense">経費一覧CSV</button>
        <button type="button" data-step174-export="tournament">大会別収支CSV</button>
        <button type="button" data-step174-export="all">全取引明細CSV</button>
      </div>
      <small>PDFはブラウザの印刷画面から「PDFとして保存」を選べます。</small>
    `;

    bindExportButtons();
    card.scrollIntoView({ behavior:"smooth", block:"nearest" });
    return true;
  }

  function createPackageFromFinalButton(){
    const pkg = savePackage(buildPackage());
    ensureExportResultCard(pkg);

    const final = get("pnx-step166-final-create");
    if (final) {
      final.classList.add("is-created");
      final.textContent = "作成しました";
      setTimeout(() => { final.textContent = "確定申告書類を作成する"; }, 1200);
    }

    return pkg;
  }

  function bindExportButtons(){
    document.querySelectorAll("[data-step174-export]").forEach(btn => {
      if (btn.__pnxStep174Bound) return;
      btn.__pnxStep174Bound = true;
      btn.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        const type = btn.getAttribute("data-step174-export");
        if (type === "report") openReport("report");
        if (type === "advisor") openReport("advisor");
        if (type === "summary") downloadSummaryCsv();
        if (type === "expense") downloadExpenseCsv();
        if (type === "tournament") downloadTournamentCsv();
        if (type === "all") downloadAllCsv();
      }, true);
    });
  }

  function bindExistingDocRows(){
    document.querySelectorAll("[data-pnx-doc]").forEach(row => {
      if (row.__pnxStep174DocBound) return;
      row.__pnxStep174DocBound = true;
      row.addEventListener("click", function(e){
        const key = row.getAttribute("data-pnx-doc");
        if (!key) return;
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

        savePackage(buildPackage());

        if (/advisor|tax-accountant|税理士/.test(key)) openReport("advisor");
        else if (/expense/.test(key)) downloadExpenseCsv();
        else if (/tournament/.test(key)) downloadTournamentCsv();
        else if (/all|detail|transaction/.test(key)) downloadAllCsv();
        else if (/csv/.test(key)) downloadSummaryCsv();
        else openReport("report");
      }, true);
    });
  }

  // Final create button: stop older auto-close behavior and create actual package.
  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest("#pnx-step166-final-create, #pnx-step163-final-create");
    if (!trigger) return;

    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

    createPackageFromFinalButton();
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(bindExistingDocRows, 300);
    setTimeout(bindExportButtons, 300);
    setTimeout(bindExistingDocRows, 1200);
  });

  document.addEventListener("click", function(){
    setTimeout(bindExistingDocRows, 180);
    setTimeout(bindExportButtons, 180);
  }, true);

  [
    "PNXStep166RenderTaxDocumentsReviewCompleted",
    "PNXStep173ApplyFilingProgressRingLogic",
    "PNXStep172ApplyFinanceRealDataLinkage"
  ].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep174Wrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(bindExistingDocRows, 120);
        setTimeout(bindExportButtons, 120);
        return result;
      };
      wrapped.__pnxStep174Wrapped = true;
      window[name] = wrapped;
    }
  });

  window.PNXStep174BuildTaxExportPackage = buildPackage;
  window.PNXStep174CreateTaxExportPackage = createPackageFromFinalButton;
  window.PNXStep174DownloadSummaryCsv = downloadSummaryCsv;
  window.PNXStep174DownloadExpenseCsv = downloadExpenseCsv;
  window.PNXStep174DownloadTournamentCsv = downloadTournamentCsv;
  window.PNXStep174DownloadAllCsv = downloadAllCsv;
  window.PNXStep174OpenTaxReport = openReport;

  window.PNXStep174TaxPdfCsvRealDataExportsStatus = function(){
    const pkg = getPackage();
    return {
      step:174,
      year:pkg.summary.year,
      allCount:pkg.summary.allCount,
      incomeTotal:pkg.summary.incomeTotal,
      expenseTotal:pkg.summary.expenseTotal,
      profit:pkg.summary.profit,
      receiptMissing:pkg.summary.receiptMissing,
      exportCardExists:!!get("pnx-step174-export-result"),
      storedPackage:!!localStorage.getItem(PACKAGE_KEY),
      lastCreate:window.__PNX_STEP174_LAST_CREATE__ || null,
      note:"実データからPDF用レポート/CSVを作成"
    };
  };
})();




/* ================================================================
   STEP175: Tax advisor share real data flow
   目的:
   - STEP174で作成したPDF/CSVパッケージを税理士共有導線へ接続
   - 「税理士へ共有する」を押すと、共有用サマリー/メール文面/保存ボタンを表示
   - まだ作成していない場合は、先に作成する案内を表示
   ================================================================ */
(function(){
  if (window.__PNX_STEP175_TAX_ADVISOR_SHARE_REAL_DATA_FLOW__) return;
  window.__PNX_STEP175_TAX_ADVISOR_SHARE_REAL_DATA_FLOW__ = true;

  const PACKAGE_KEY = "PNX_TAX_EXPORT_PACKAGE_LAST";
  const DOC_KEY = "PNX_FILING_STEP152_DOCUMENTS_CONFIRMED";

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }
  function yen(n){ return "¥" + Math.round(Number(n || 0)).toLocaleString("ja-JP"); }
  function enc(s){ return encodeURIComponent(String(s || "")); }

  function getPackage(){
    try {
      const stored = JSON.parse(localStorage.getItem(PACKAGE_KEY) || "null");
      if (stored && stored.summary) return stored;
    } catch(e) {}

    try {
      if (typeof window.PNXStep174BuildTaxExportPackage === "function") {
        return window.PNXStep174BuildTaxExportPackage();
      }
    } catch(e) {}

    return {
      summary:{
        year:new Date().getFullYear(),
        incomeTotal:0,
        expenseTotal:0,
        profit:0,
        incomeCount:0,
        expenseCount:0,
        allCount:0,
        tournamentCount:0,
        receiptMissing:0,
        createdAt:new Date().toISOString()
      },
      rows:{ income:[], expenses:[], all:[] },
      tournaments:[],
      categories:[]
    };
  }

  function isCreated(){
    return localStorage.getItem(DOC_KEY) === "1" || !!localStorage.getItem(PACKAGE_KEY);
  }

  function shareMessage(pkg){
    const s = pkg.summary;
    return [
      "税理士・会計事務所 ご担当者様",
      "",
      "お世話になっております。",
      `ProNexaXで整理した${s.year}年分の収支データを共有いたします。`,
      "",
      "【収支サマリー】",
      `収入合計：${yen(s.incomeTotal)}`,
      `経費合計：${yen(s.expenseTotal)}`,
      `差引利益：${yen(s.profit)}`,
      `収入件数：${s.incomeCount}件`,
      `経費件数：${s.expenseCount}件`,
      `大会別収支：${s.tournamentCount}件`,
      `レシート不足：${s.receiptMissing}件`,
      "",
      "添付・共有予定データ：",
      "・収支一覧PDF",
      "・税理士確認用PDF",
      "・収支サマリーCSV",
      "・経費一覧CSV",
      "・大会別収支CSV",
      "・全取引明細CSV",
      "",
      "ご確認よろしくお願いいたします。"
    ].join("\n");
  }

  function ensureShareScreen(){
    let screen = get("pnx-step175-share-screen");
    if (screen) return screen;

    screen = document.createElement("section");
    screen.id = "pnx-step175-share-screen";
    screen.className = "pnx-step175-share-screen";
    screen.setAttribute("aria-hidden", "true");

    document.body.appendChild(screen);
    return screen;
  }

  function closeShareScreen(){
    const screen = get("pnx-step175-share-screen");
    if (screen) {
      screen.classList.remove("is-open");
      screen.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("pnx-step175-share-open-body");
    window.__PNX_STEP175_LAST_CLOSE__ = new Date().toISOString();
  }

  function openShareScreen(){
    const pkg = getPackage();
    const created = isCreated();
    const screen = ensureShareScreen();
    const msg = shareMessage(pkg);

    screen.innerHTML = `
      <div class="pnx-step175-share-head">
        <button type="button" id="pnx-step175-share-back" aria-label="戻る">←</button>
        <div>
          <p>Share</p>
          <h2>税理士へ共有する</h2>
        </div>
      </div>

      ${created ? `
        <article class="pnx-step175-share-card pnx-step175-summary-card">
          <p class="pnx-step175-kicker">Created package</p>
          <h3>${pkg.summary.year}年分の申告データ</h3>
          <div class="pnx-step175-summary-grid">
            <div><span>収入</span><strong>${yen(pkg.summary.incomeTotal)}</strong></div>
            <div><span>経費</span><strong>${yen(pkg.summary.expenseTotal)}</strong></div>
            <div><span>差引</span><strong>${yen(pkg.summary.profit)}</strong></div>
            <div><span>レシート不足</span><strong>${pkg.summary.receiptMissing}件</strong></div>
          </div>
        </article>

        <article class="pnx-step175-share-card">
          <p class="pnx-step175-kicker">Message</p>
          <h3>共有メッセージ</h3>
          <textarea id="pnx-step175-share-message">${msg}</textarea>
          <div class="pnx-step175-share-actions">
            <button type="button" id="pnx-step175-copy-message">文面をコピー</button>
            <button type="button" id="pnx-step175-open-mail">メール作成</button>
          </div>
        </article>

        <article class="pnx-step175-share-card">
          <p class="pnx-step175-kicker">Files</p>
          <h3>共有する書類</h3>
          <div class="pnx-step175-file-list">
            <button type="button" data-step175-export="advisor">税理士確認用PDF</button>
            <button type="button" data-step175-export="report">収支一覧PDF</button>
            <button type="button" data-step175-export="summary">収支サマリーCSV</button>
            <button type="button" data-step175-export="expense">経費一覧CSV</button>
            <button type="button" data-step175-export="tournament">大会別収支CSV</button>
            <button type="button" data-step175-export="all">全取引明細CSV</button>
          </div>
          <small>PDFは開いたレポート画面から「PDFとして保存」を選択してください。</small>
        </article>
      ` : `
        <article class="pnx-step175-share-card pnx-step175-not-created">
          <p class="pnx-step175-kicker">Not created</p>
          <h3>まだ申告書類が作成されていません</h3>
          <p>先に「確定申告書類作成に進む」から内容を確認し、PDF/CSVを作成してください。</p>
          <button type="button" id="pnx-step175-go-create">確定申告書類作成に進む</button>
        </article>
      `}
    `;

    screen.classList.add("is-open");
    screen.setAttribute("aria-hidden", "false");
    document.body.classList.add("pnx-step175-share-open-body");

    bindShareScreen();
    window.__PNX_STEP175_LAST_OPEN__ = new Date().toISOString();
    return true;
  }

  function bindShareScreen(){
    const back = get("pnx-step175-share-back");
    if (back && !back.__pnxStep175Bound) {
      back.__pnxStep175Bound = true;
      back.addEventListener("click", function(e){
        e.preventDefault();
        closeShareScreen();
      }, true);
    }

    const copy = get("pnx-step175-copy-message");
    if (copy && !copy.__pnxStep175Bound) {
      copy.__pnxStep175Bound = true;
      copy.addEventListener("click", async function(e){
        e.preventDefault();
        const ta = get("pnx-step175-share-message");
        const value = ta ? ta.value : shareMessage(getPackage());
        try {
          await navigator.clipboard.writeText(value);
          copy.textContent = "コピーしました";
          setTimeout(() => copy.textContent = "文面をコピー", 1200);
        } catch(err) {
          if (ta) {
            ta.focus();
            ta.select();
          }
          copy.textContent = "選択しました";
          setTimeout(() => copy.textContent = "文面をコピー", 1200);
        }
      }, true);
    }

    const mail = get("pnx-step175-open-mail");
    if (mail && !mail.__pnxStep175Bound) {
      mail.__pnxStep175Bound = true;
      mail.addEventListener("click", function(e){
        e.preventDefault();
        const pkg = getPackage();
        const ta = get("pnx-step175-share-message");
        const body = ta ? ta.value : shareMessage(pkg);
        const subject = `【ProNexaX】${pkg.summary.year}年分 申告データ共有`;
        location.href = `mailto:?subject=${enc(subject)}&body=${enc(body)}`;
      }, true);
    }

    const create = get("pnx-step175-go-create");
    if (create && !create.__pnxStep175Bound) {
      create.__pnxStep175Bound = true;
      create.addEventListener("click", function(e){
        e.preventDefault();
        closeShareScreen();
        if (typeof window.PNXStep171OpenReview === "function") window.PNXStep171OpenReview();
        else if (typeof window.PNXStep169OpenReview === "function") window.PNXStep169OpenReview();
      }, true);
    }

    document.querySelectorAll("[data-step175-export]").forEach(btn => {
      if (btn.__pnxStep175ExportBound) return;
      btn.__pnxStep175ExportBound = true;
      btn.addEventListener("click", function(e){
        e.preventDefault();
        const type = btn.getAttribute("data-step175-export");
        if (type === "advisor" && typeof window.PNXStep174OpenTaxReport === "function") window.PNXStep174OpenTaxReport("advisor");
        if (type === "report" && typeof window.PNXStep174OpenTaxReport === "function") window.PNXStep174OpenTaxReport("report");
        if (type === "summary" && typeof window.PNXStep174DownloadSummaryCsv === "function") window.PNXStep174DownloadSummaryCsv();
        if (type === "expense" && typeof window.PNXStep174DownloadExpenseCsv === "function") window.PNXStep174DownloadExpenseCsv();
        if (type === "tournament" && typeof window.PNXStep174DownloadTournamentCsv === "function") window.PNXStep174DownloadTournamentCsv();
        if (type === "all" && typeof window.PNXStep174DownloadAllCsv === "function") window.PNXStep174DownloadAllCsv();
      }, true);
    });
  }

  function updateShareButtons(){
    const created = isCreated();
    const buttons = [
      get("pnx-step171-open-share"),
      get("pnx-step169-open-share")
    ].filter(Boolean);

    buttons.forEach(btn => {
      btn.classList.toggle("is-visible", created);
      btn.setAttribute("aria-hidden", created ? "false" : "true");
      btn.textContent = "税理士へ共有する";

      if (!btn.__pnxStep175TopBound) {
        btn.__pnxStep175TopBound = true;
        btn.addEventListener("click", function(e){
          e.preventDefault();
          e.stopPropagation();
          if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
          openShareScreen();
        }, true);
      }
    });
  }

  // 既存の共有関数があれば、新しい共有画面に寄せる。
  const oldShare = window.PNXStep158OpenTaxAdvisorShareScreen;
  if (typeof oldShare === "function" && !oldShare.__pnxStep175Wrapped) {
    const wrapped = function(){
      return openShareScreen();
    };
    wrapped.__pnxStep175Wrapped = true;
    window.PNXStep158OpenTaxAdvisorShareScreen = wrapped;
  }

  [
    "PNXStep169ApplyFilingFlowFinalStabilized",
    "PNXStep171cPatchEmbedOfficialTodo",
    "PNXStep173ApplyFilingProgressRingLogic",
    "PNXStep174CreateTaxExportPackage"
  ].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep175Wrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        setTimeout(updateShareButtons, 0);
        setTimeout(updateShareButtons, 180);
        return result;
      };
      wrapped.__pnxStep175Wrapped = true;
      window[name] = wrapped;
    }
  });

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(updateShareButtons, 100);
    setTimeout(updateShareButtons, 800);
    setTimeout(updateShareButtons, 1800);
  });

  document.addEventListener("click", function(e){
    const trigger = e.target && e.target.closest && e.target.closest("#pnx-step171-open-share, #pnx-step169-open-share");
    if (!trigger) return;
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    openShareScreen();
  }, true);

  window.PNXStep175OpenTaxAdvisorShareFlow = openShareScreen;
  window.PNXStep175CloseTaxAdvisorShareFlow = closeShareScreen;
  window.PNXStep175BuildShareMessage = function(){ return shareMessage(getPackage()); };
  window.PNXStep175TaxAdvisorShareRealDataFlowStatus = function(){
    const pkg = getPackage();
    return {
      step:175,
      created:isCreated(),
      year:pkg.summary.year,
      incomeTotal:pkg.summary.incomeTotal,
      expenseTotal:pkg.summary.expenseTotal,
      profit:pkg.summary.profit,
      receiptMissing:pkg.summary.receiptMissing,
      shareScreenExists:!!get("pnx-step175-share-screen"),
      shareOpen:!!(get("pnx-step175-share-screen") && get("pnx-step175-share-screen").classList.contains("is-open")),
      topShareButtons:Array.from(document.querySelectorAll("#pnx-step171-open-share, #pnx-step169-open-share")).length,
      lastOpen:window.__PNX_STEP175_LAST_OPEN__ || null,
      lastClose:window.__PNX_STEP175_LAST_CLOSE__ || null,
      note:"税理士共有フローをSTEP174の実データパッケージに接続"
    };
  };
})();







/* ================================================================
   STEP177: Transaction data schema normalized
   目的:
   - 収支機能の取引データ形式を安全に統一
   - 既存データを壊さず、PDF/CSV/申告準備率が読みやすい標準形式へ変換
   - 保存前にバックアップを作る
   ================================================================ */
(function(){
  if (window.__PNX_STEP177_TRANSACTION_DATA_SCHEMA_NORMALIZED__) return;
  window.__PNX_STEP177_TRANSACTION_DATA_SCHEMA_NORMALIZED__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";
  const BACKUP_KEY = "PNX_FINANCE_TRANSACTIONS_BACKUP_BEFORE_STEP177";
  const SCHEMA_VERSION = "pnx-transaction-v1";

  function uid(prefix, index){
    const base = Date.now().toString(36);
    return `${prefix || "tx"}_${base}_${index || 0}_${Math.random().toString(36).slice(2,7)}`;
  }

  function today(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }

  function toNumber(v){
    const n = Number(String(v == null ? 0 : v).replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? Math.abs(n) : 0;
  }

  function clean(v, fallback=""){
    return String(v == null ? fallback : v).trim();
  }

  function pick(obj, keys, fallback=""){
    for (const k of keys) {
      const v = obj && obj[k];
      if (v != null && String(v).trim() !== "") return v;
    }
    return fallback;
  }

  function detectType(tx){
    const raw = clean(pick(tx, ["type", "kind", "flow", "side", "transactionType"])).toLowerCase();
    if (/income|revenue|in|収入|売上|賞金|スポンサー/.test(raw)) return "income";
    if (tx && (tx.income === true || tx.isIncome === true)) return "income";
    if (clean(pick(tx, ["category", "categoryName", "categoryLabel"])).match(/賞金|スポンサー|収入|売上/)) return "income";
    return "expense";
  }

  function normalizeDate(v){
    const raw = clean(v);
    if (!raw) return today();
    const m = raw.match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})/);
    if (m) return `${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`;
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    }
    return raw;
  }

  function tournamentName(tx){
    if (!tx) return "";
    const direct = pick(tx, ["tournamentName", "tournamentTitle", "eventName", "eventTitle", "tournamentLabel", "relatedTournament"], "");
    if (direct) return clean(direct);
    if (tx.tournament && typeof tx.tournament === "object") return clean(tx.tournament.title || tx.tournament.name || "");
    if (tx.tournamentInfo && typeof tx.tournamentInfo === "object") return clean(tx.tournamentInfo.title || tx.tournamentInfo.name || "");
    if (tx.tournamentData && typeof tx.tournamentData === "object") return clean(tx.tournamentData.title || tx.tournamentData.name || "");
    if (typeof tx.tournament === "string") return clean(tx.tournament);
    return "";
  }

  function hasReceipt(tx){
    if (!tx) return false;
    if (tx.hasReceipt === true || tx.receiptAttached === true || tx.attachment === true) return true;
    if (Array.isArray(tx.receipts) && tx.receipts.length) return true;
    if (Array.isArray(tx.attachments) && tx.attachments.length) return true;
    const fields = [
      tx.receiptUrl, tx.receiptImage, tx.receiptImageUrl, tx.fileUrl,
      tx.attachmentUrl, tx.photoUrl, tx.scanUrl, tx.receiptId,
      tx.attachmentId, tx.imageUrl, tx.image
    ];
    return fields.some(v => clean(v));
  }

  function receiptUrl(tx){
    return clean(pick(tx, [
      "receiptUrl", "receiptImage", "receiptImageUrl", "fileUrl",
      "attachmentUrl", "photoUrl", "scanUrl", "imageUrl", "image"
    ], ""));
  }

  function normalizeTransaction(tx, index){
    tx = tx || {};
    const type = detectType(tx);
    const amount = toNumber(pick(tx, ["amount", "value", "price", "total", "cost"], 0));
    const date = normalizeDate(pick(tx, ["date", "startDate", "createdAt", "paidAt"], ""));
    const category = clean(pick(tx, ["categoryLabel", "categoryName", "category", "typeLabel"], type === "income" ? "収入" : "未分類"));
    const tournament = tournamentName(tx);
    const title = clean(pick(tx, ["title", "name", "memo", "description", "label"], type === "income" ? "収入" : "経費"));

    return {
      id:clean(pick(tx, ["id", "uid", "key"], "")) || uid("pnx_tx", index),
      schemaVersion:SCHEMA_VERSION,
      date,
      year:Number(date.slice(0,4)) || new Date().getFullYear(),
      type,
      amount,
      title,
      category,
      categoryId:clean(pick(tx, ["categoryId", "catId"], "")),
      tournamentId:clean(pick(tx, ["tournamentId", "eventId", "tournamentKey"], "")),
      tournamentName:tournament,
      hasReceipt:hasReceipt(tx),
      receiptUrl:receiptUrl(tx),
      note:clean(pick(tx, ["note", "memo", "description"], "")),
      source:clean(pick(tx, ["source", "inputSource"], "manual")),
      createdAt:clean(pick(tx, ["createdAt"], new Date().toISOString())),
      updatedAt:new Date().toISOString(),
      originalType:clean(pick(tx, ["type", "kind", "flow", "side"], "")),
      // 後方互換用
      value:amount,
      price:amount,
      kind:type,
      tournament:tournament,
      receiptAttached:hasReceipt(tx),
      __pnxNormalized:true
    };
  }

  function readRawTransactions(){
    try {
      if (typeof window.PNXStep138gGetAllFinanceTransactions === "function") {
        const list = window.PNXStep138gGetAllFinanceTransactions();
        if (Array.isArray(list)) return list;
      }
    } catch(e) {}

    try {
      const list = JSON.parse(localStorage.getItem(TX_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function normalizeAll(list){
    return (Array.isArray(list) ? list : []).map(normalizeTransaction).filter(tx => tx.amount > 0);
  }

  function backupIfNeeded(raw){
    if (localStorage.getItem(BACKUP_KEY)) return false;
    localStorage.setItem(BACKUP_KEY, JSON.stringify({
      createdAt:new Date().toISOString(),
      data:raw
    }));
    return true;
  }

  function migrateToNormalizedStorage(){
    const raw = readRawTransactions();
    backupIfNeeded(raw);

    const normalized = normalizeAll(raw);
    localStorage.setItem(TX_KEY, JSON.stringify(normalized));

    window.__PNX_STEP177_LAST_MIGRATION__ = {
      at:new Date().toISOString(),
      before:raw.length,
      after:normalized.length,
      backupKey:BACKUP_KEY
    };

    try {
      window.dispatchEvent(new CustomEvent("pnx:finance:transactions-updated", { detail:{ source:"step177", count:normalized.length } }));
      window.dispatchEvent(new CustomEvent("pnx:finance:transactions-stable-refreshed", { detail:{ source:"step177", count:normalized.length } }));
    } catch(e) {}

    try {
      if (typeof window.PNXStep176CleanupFinanceSystem === "function") window.PNXStep176CleanupFinanceSystem();
      if (typeof window.PNXStep173ApplyFilingProgressRingLogic === "function") window.PNXStep173ApplyFilingProgressRingLogic();
    } catch(e) {}

    return normalized;
  }

  function previewNormalization(){
    const raw = readRawTransactions();
    const normalized = normalizeAll(raw);
    const issues = [];

    normalized.forEach((tx, index) => {
      if (!tx.date) issues.push({ index, id:tx.id, issue:"date_missing" });
      if (!tx.amount) issues.push({ index, id:tx.id, issue:"amount_missing" });
      if (!tx.category) issues.push({ index, id:tx.id, issue:"category_missing" });
      if (!["income", "expense"].includes(tx.type)) issues.push({ index, id:tx.id, issue:"type_invalid" });
    });

    return {
      rawCount:raw.length,
      normalizedCount:normalized.length,
      incomeCount:normalized.filter(tx => tx.type === "income").length,
      expenseCount:normalized.filter(tx => tx.type === "expense").length,
      tournamentLinked:normalized.filter(tx => tx.tournamentName).length,
      receiptAttached:normalized.filter(tx => tx.hasReceipt).length,
      issues,
      sample:normalized.slice(0,3)
    };
  }

  function restoreBackup(){
    try {
      const backup = JSON.parse(localStorage.getItem(BACKUP_KEY) || "null");
      if (!backup || !Array.isArray(backup.data)) return false;
      localStorage.setItem(TX_KEY, JSON.stringify(backup.data));
      window.dispatchEvent(new CustomEvent("pnx:finance:transactions-updated", { detail:{ source:"step177-restore", count:backup.data.length } }));
      return true;
    } catch(e) {
      return false;
    }
  }

  // STEP172〜174が標準形式を読めるよう、既存関数がない場合だけ提供。
  if (typeof window.PNXStep177GetNormalizedTransactions !== "function") {
    window.PNXStep177GetNormalizedTransactions = function(){
      return normalizeAll(readRawTransactions());
    };
  }

  // 既存の集計処理の前後で軽く正規化プレビューだけ走らせる。自動保存はしない。
  [
    "PNXStep172ApplyFinanceRealDataLinkage",
    "PNXStep173ApplyFilingProgressRingLogic",
    "PNXStep174BuildTaxExportPackage",
    "PNXStep176CleanupFinanceSystem"
  ].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep177Wrapped) {
      const wrapped = function(){
        window.__PNX_STEP177_LAST_PREVIEW__ = previewNormalization();
        return fn.apply(this, arguments);
      };
      wrapped.__pnxStep177Wrapped = true;
      window[name] = wrapped;
    }
  });

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(function(){
      window.__PNX_STEP177_LAST_PREVIEW__ = previewNormalization();
    }, 600);
  });

  window.PNXStep177NormalizeTransaction = normalizeTransaction;
  window.PNXStep177PreviewTransactionNormalization = previewNormalization;
  window.PNXStep177MigrateTransactionsToNormalizedSchema = migrateToNormalizedStorage;
  window.PNXStep177RestoreTransactionsBackup = restoreBackup;
  window.PNXStep177TransactionDataSchemaStatus = function(){
    const preview = previewNormalization();
    return {
      step:177,
      schemaVersion:SCHEMA_VERSION,
      rawCount:preview.rawCount,
      normalizedCount:preview.normalizedCount,
      incomeCount:preview.incomeCount,
      expenseCount:preview.expenseCount,
      tournamentLinked:preview.tournamentLinked,
      receiptAttached:preview.receiptAttached,
      issues:preview.issues,
      hasBackup:!!localStorage.getItem(BACKUP_KEY),
      lastMigration:window.__PNX_STEP177_LAST_MIGRATION__ || null,
      note:"取引データ形式を標準化。自動保存はせず、必要時にマイグレーション実行"
    };
  };
})();




/* ================================================================
   STEP178: Transaction save pipeline connected
   目的:
   - 新しく入力/編集される取引をSTEP177標準形式で保存
   - 保存後に取引一覧・分析・申告準備率・PDF/CSVを自動更新
   - 既存UIを壊さず、中央保存APIを追加
   ================================================================ */
(function(){
  if (window.__PNX_STEP178_TRANSACTION_SAVE_PIPELINE_CONNECTED__) return;
  window.__PNX_STEP178_TRANSACTION_SAVE_PIPELINE_CONNECTED__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";
  const BACKUP_KEY = "PNX_FINANCE_TRANSACTIONS_BACKUP_BEFORE_STEP178";
  const SCHEMA_VERSION = "pnx-transaction-v1";

  function now(){ return new Date().toISOString(); }
  function clean(v, fallback=""){ return String(v == null ? fallback : v).trim(); }
  function uid(){ return "pnx_tx_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2,8); }

  function toNumber(v){
    const n = Number(String(v == null ? 0 : v).replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? Math.abs(n) : 0;
  }

  function readRaw(){
    try {
      const list = JSON.parse(localStorage.getItem(TX_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function writeRaw(list, source){
    if (!localStorage.getItem(BACKUP_KEY)) {
      try {
        localStorage.setItem(BACKUP_KEY, JSON.stringify({
          createdAt:now(),
          data:readRaw()
        }));
      } catch(e) {}
    }

    localStorage.setItem(TX_KEY, JSON.stringify(Array.isArray(list) ? list : []));
    dispatchUpdate(source || "step178-save", list.length);
    return list;
  }

  function dispatchUpdate(source, count){
    try {
      window.dispatchEvent(new CustomEvent("pnx:finance:transactions-updated", { detail:{ source, count } }));
      window.dispatchEvent(new CustomEvent("pnx:finance:transactions-stable-refreshed", { detail:{ source, count } }));
      window.dispatchEvent(new CustomEvent("pnx:finance:schema-normalized", { detail:{ source, count } }));
    } catch(e) {}

    setTimeout(refreshAll, 0);
    setTimeout(refreshAll, 180);
  }

  function normalize(input, index){
    if (typeof window.PNXStep177NormalizeTransaction === "function") {
      const normalized = window.PNXStep177NormalizeTransaction(input || {}, index || 0);
      normalized.schemaVersion = SCHEMA_VERSION;
      normalized.__pnxSavedByStep178 = true;
      normalized.updatedAt = now();
      return normalized;
    }

    const tx = input || {};
    const typeRaw = clean(tx.type || tx.kind || tx.flow || tx.side).toLowerCase();
    const isIncome = /income|revenue|収入|売上|賞金|スポンサー/.test(typeRaw) || tx.income === true || tx.isIncome === true;
    const date = clean(tx.date || tx.startDate || tx.paidAt || "").replace(/\//g, "-") || new Date().toISOString().slice(0,10);

    return {
      id:clean(tx.id || tx.uid || tx.key) || uid(),
      schemaVersion:SCHEMA_VERSION,
      date,
      year:Number(date.slice(0,4)) || new Date().getFullYear(),
      type:isIncome ? "income" : "expense",
      amount:toNumber(tx.amount || tx.value || tx.price || tx.total || tx.cost),
      title:clean(tx.title || tx.name || tx.memo || tx.description || tx.label, isIncome ? "収入" : "経費"),
      category:clean(tx.categoryLabel || tx.categoryName || tx.category || tx.typeLabel, isIncome ? "収入" : "未分類"),
      categoryId:clean(tx.categoryId || tx.catId),
      tournamentId:clean(tx.tournamentId || tx.eventId || tx.tournamentKey),
      tournamentName:clean(tx.tournamentName || tx.tournamentTitle || tx.eventName || tx.eventTitle || tx.tournamentLabel || tx.relatedTournament || tx.tournament),
      hasReceipt:!!(tx.hasReceipt || tx.receiptAttached || tx.receiptUrl || tx.receiptImage || tx.imageUrl),
      receiptUrl:clean(tx.receiptUrl || tx.receiptImage || tx.receiptImageUrl || tx.fileUrl || tx.attachmentUrl || tx.photoUrl || tx.scanUrl || tx.imageUrl || tx.image),
      note:clean(tx.note || tx.memo || tx.description),
      source:clean(tx.source || tx.inputSource, "manual"),
      createdAt:clean(tx.createdAt, now()),
      updatedAt:now(),
      value:toNumber(tx.amount || tx.value || tx.price || tx.total || tx.cost),
      price:toNumber(tx.amount || tx.value || tx.price || tx.total || tx.cost),
      kind:isIncome ? "income" : "expense",
      receiptAttached:!!(tx.hasReceipt || tx.receiptAttached || tx.receiptUrl || tx.receiptImage || tx.imageUrl),
      __pnxNormalized:true,
      __pnxSavedByStep178:true
    };
  }

  function normalizeAll(list){
    return (Array.isArray(list) ? list : []).map(normalize).filter(tx => tx.amount > 0);
  }

  function readNormalized(){
    return normalizeAll(readRaw());
  }

  function saveTransaction(input){
    const list = readNormalized();
    const tx = normalize(input, list.length);
    if (!tx.id) tx.id = uid();
    if (!tx.amount) {
      window.__PNX_STEP178_LAST_ERROR__ = "金額が未入力です";
      return null;
    }

    const index = list.findIndex(item => item.id === tx.id);
    if (index >= 0) {
      tx.createdAt = list[index].createdAt || tx.createdAt;
      list[index] = { ...list[index], ...tx, updatedAt:now() };
    } else {
      list.unshift(tx);
    }

    writeRaw(list, "step178-save-transaction");
    window.__PNX_STEP178_LAST_SAVE__ = { at:now(), transaction:tx, count:list.length };
    return tx;
  }

  function updateTransaction(id, patch){
    const list = readNormalized();
    const index = list.findIndex(tx => tx.id === id);
    if (index < 0) return null;

    const updated = normalize({ ...list[index], ...(patch || {}), id }, index);
    updated.createdAt = list[index].createdAt || updated.createdAt;
    updated.updatedAt = now();
    list[index] = updated;

    writeRaw(list, "step178-update-transaction");
    window.__PNX_STEP178_LAST_UPDATE__ = { at:now(), transaction:updated, count:list.length };
    return updated;
  }

  function deleteTransaction(id){
    const list = readNormalized();
    const next = list.filter(tx => tx.id !== id);
    writeRaw(next, "step178-delete-transaction");
    window.__PNX_STEP178_LAST_DELETE__ = { at:now(), id, before:list.length, after:next.length };
    return next.length !== list.length;
  }

  function linkTournament(transactionId, tournament){
    const name = typeof tournament === "string"
      ? tournament
      : clean(tournament && (tournament.title || tournament.name || tournament.tournamentName || tournament.tournamentTitle));

    const id = typeof tournament === "object"
      ? clean(tournament.id || tournament.uid || tournament.key || tournament.tournamentId)
      : "";

    return updateTransaction(transactionId, {
      tournamentName:name,
      tournamentId:id
    });
  }

  function attachReceipt(transactionId, receipt){
    const url = typeof receipt === "string"
      ? receipt
      : clean(receipt && (receipt.url || receipt.imageUrl || receipt.receiptUrl || receipt.fileUrl));

    return updateTransaction(transactionId, {
      hasReceipt:true,
      receiptUrl:url,
      receiptAttached:true
    });
  }

  function refreshAll(){
    const calls = [
      "PNXStep172ApplyFinanceRealDataLinkage",
      "PNXStep173ApplyFilingProgressRingLogic",
      "PNXStep176CleanupFinanceSystem"
    ];

    calls.forEach(name => {
      try {
        if (typeof window[name] === "function") window[name]();
      } catch(e) {}
    });
  }

  function extractFormPayload(form){
    const data = {};
    if (!form) return data;

    const fd = new FormData(form);
    fd.forEach((value, key) => { data[key] = value; });

    // よくあるname/idを標準キーへ寄せる
    data.amount = data.amount || data.price || data.value || data.total || data.cost;
    data.title = data.title || data.name || data.memo || data.description;
    data.date = data.date || data.paidAt || data.createdAt;
    data.category = data.category || data.categoryName || data.categoryLabel;
    data.tournamentName = data.tournamentName || data.tournamentTitle || data.eventName;
    data.receiptUrl = data.receiptUrl || data.receiptImage || data.imageUrl;
    data.type = data.type || data.kind || data.flow;

    return data;
  }

  function bindKnownSubmitButtons(){
    const selectors = [
      "[data-pnx-save-transaction]",
      "[data-pnx-finance-save]",
      "[data-step178-save-transaction]"
    ];

    document.querySelectorAll(selectors.join(",")).forEach(btn => {
      if (btn.__pnxStep178Bound) return;
      btn.__pnxStep178Bound = true;
      btn.addEventListener("click", function(){
        const form = btn.closest("form");
        const payload = extractFormPayload(form);
        saveTransaction(payload);
      }, true);
    });
  }

  // 既存保存関数があとから存在していた場合は、戻り値を標準保存へも流せるようにする。
  [
    "PNXFinanceSaveTransaction",
    "PNXSaveFinanceTransaction",
    "PNXAddFinanceTransaction",
    "PNXCreateFinanceTransaction"
  ].forEach(name => {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__pnxStep178Wrapped) {
      const wrapped = function(){
        const result = fn.apply(this, arguments);
        try {
          const candidate = result && typeof result === "object" ? result : arguments[0];
          if (candidate && typeof candidate === "object") saveTransaction(candidate);
        } catch(e) {}
        return result;
      };
      wrapped.__pnxStep178Wrapped = true;
      window[name] = wrapped;
    }
  });

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(bindKnownSubmitButtons, 300);
    setTimeout(function(){
      window.__PNX_STEP178_LAST_PREVIEW__ = {
        at:now(),
        count:readNormalized().length,
        sample:readNormalized().slice(0,3)
      };
    }, 800);
  });

  document.addEventListener("click", function(){
    setTimeout(bindKnownSubmitButtons, 120);
  }, true);

  window.PNXStep178NormalizeTransactionForSave = normalize;
  window.PNXStep178GetTransactions = readNormalized;
  window.PNXStep178SaveTransaction = saveTransaction;
  window.PNXStep178UpdateTransaction = updateTransaction;
  window.PNXStep178DeleteTransaction = deleteTransaction;
  window.PNXStep178LinkTransactionTournament = linkTournament;
  window.PNXStep178AttachTransactionReceipt = attachReceipt;
  window.PNXStep178RefreshFinanceAfterSave = refreshAll;

  window.PNXStep178TransactionSavePipelineStatus = function(){
    const list = readNormalized();
    const invalid = list.filter(tx => !tx.id || !tx.date || !tx.amount || !["income", "expense"].includes(tx.type));
    return {
      step:178,
      count:list.length,
      incomeCount:list.filter(tx => tx.type === "income").length,
      expenseCount:list.filter(tx => tx.type === "expense").length,
      tournamentLinked:list.filter(tx => tx.tournamentName).length,
      receiptAttached:list.filter(tx => tx.hasReceipt).length,
      invalidCount:invalid.length,
      invalid:invalid.slice(0,5),
      backupExists:!!localStorage.getItem(BACKUP_KEY),
      lastSave:window.__PNX_STEP178_LAST_SAVE__ || null,
      lastUpdate:window.__PNX_STEP178_LAST_UPDATE__ || null,
      lastDelete:window.__PNX_STEP178_LAST_DELETE__ || null,
      lastError:window.__PNX_STEP178_LAST_ERROR__ || null,
      note:"入力保存処理を標準取引スキーマへ接続"
    };
  };
})();
















/* ================================================================
   STEP178i: Remove legacy sync/rebuild and restore task open
   目的:
   - 古い申告同期/再構築ブロックを外した後の、安全な単一同期
   - やること一覧クリックを確実に開く
   - 文字チカチカ/画面揺れを起こさない
   ================================================================ */
(function(){
  if (window.__PNX_STEP178I_REMOVE_LEGACY_SYNC_REBUILD_OPEN_FIX__) return;
  window.__PNX_STEP178I_REMOVE_LEGACY_SYNC_REBUILD_OPEN_FIX__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";
  let timer = null;
  let rendering = false;

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }
  function setText(el, value){
    if (!el) return false;
    value = String(value == null ? "" : value);
    if (el.textContent === value) return false;
    el.textContent = value;
    return true;
  }
  function yen(n){ return "¥" + Math.round(Number(n || 0)).toLocaleString("ja-JP"); }
  function today(){
    const d = new Date();
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`;
  }
  function amount(tx){
    return Math.abs(Number(tx && (tx.amount || tx.value || tx.price || tx.total || tx.cost || 0)) || 0);
  }
  function typeOf(tx){
    const t = String(tx && (tx.type || tx.kind || tx.flow || tx.side || "")).toLowerCase();
    if (/income|revenue|in|収入|売上|賞金|スポンサー/.test(t)) return "income";
    if (tx && (tx.income === true || tx.isIncome === true)) return "income";
    return "expense";
  }
  function categoryOf(tx){
    return String(tx && (tx.categoryLabel || tx.categoryName || tx.category || tx.typeLabel || "")).trim();
  }
  function tournamentName(tx){
    if (!tx) return "";
    const vals = [tx.tournamentName, tx.tournamentTitle, tx.tournament, tx.eventName, tx.eventTitle, tx.tournamentLabel, tx.relatedTournament];
    if (tx.tournamentInfo && typeof tx.tournamentInfo === "object") vals.unshift(tx.tournamentInfo.title, tx.tournamentInfo.name);
    if (tx.tournamentData && typeof tx.tournamentData === "object") vals.unshift(tx.tournamentData.title, tx.tournamentData.name);
    return vals.map(v => String(v || "").trim()).find(Boolean) || "";
  }
  function hasReceipt(tx){
    if (!tx) return false;
    if (tx.hasReceipt === true || tx.receiptAttached === true || tx.attachment === true) return true;
    if (Array.isArray(tx.receipts) && tx.receipts.length) return true;
    if (Array.isArray(tx.attachments) && tx.attachments.length) return true;
    return [tx.receiptUrl, tx.receiptImage, tx.receiptImageUrl, tx.fileUrl, tx.attachmentUrl, tx.photoUrl, tx.scanUrl, tx.imageUrl, tx.image].some(v => String(v || "").trim());
  }
  function readTxs(){
    try {
      if (typeof window.PNXStep178GetTransactions === "function") {
        const list = window.PNXStep178GetTransactions();
        if (Array.isArray(list)) return list;
      }
    } catch(e) {}
    try {
      if (typeof window.PNXStep177GetNormalizedTransactions === "function") {
        const list = window.PNXStep177GetNormalizedTransactions();
        if (Array.isArray(list)) return list;
      }
    } catch(e) {}
    try {
      const list = JSON.parse(localStorage.getItem(TX_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }
  function collect(){
    const txs = readTxs().filter(tx => amount(tx) > 0);
    let incomeTotal = 0, expenseTotal = 0;
    let incomeCount = 0, expenseCount = 0;
    let tournamentLinked = 0, receiptMissing = 0, uncategorizedExpense = 0;

    txs.forEach(tx => {
      const a = amount(tx);
      if (typeOf(tx) === "income") {
        incomeTotal += a;
        incomeCount += 1;
      } else {
        expenseTotal += a;
        expenseCount += 1;
        if (!hasReceipt(tx)) receiptMissing += 1;
        const c = categoryOf(tx);
        if (!c || /未分類|未設定|その他未設定|none|null|undefined/i.test(c)) uncategorizedExpense += 1;
      }
      if (tournamentName(tx)) tournamentLinked += 1;
    });

    const rentConfirmed = localStorage.getItem("PNX_FILING_STEP157_RENT_CONFIRMED") === "1";
    const rentActive =
      rentConfirmed ||
      Number(localStorage.getItem("PNX_RENT_ALLOCATION_RATE") || localStorage.getItem("PNX_FINANCE_RENT_RATE") || 0) > 0 ||
      txs.some(tx => /家賃|事務所|按分/.test(categoryOf(tx) + " " + String(tx.title || tx.name || tx.memo || "")));

    const taskStates = {
      transactions: incomeCount + expenseCount > 0,
      tournaments: tournamentLinked > 0,
      categories: expenseCount > 0 && uncategorizedExpense === 0,
      receipts: expenseCount > 0 && receiptMissing === 0,
      rent: rentActive ? rentConfirmed : true
    };

    const required = ["transactions", "tournaments", "categories", "receipts"].concat(rentActive ? ["rent"] : []);
    const done = required.filter(k => taskStates[k]).length;
    const progress = required.length ? Math.round(done / required.length * 100) : 0;

    return {
      incomeTotal, expenseTotal, profit: incomeTotal - expenseTotal,
      incomeCount, expenseCount, txCount:incomeCount + expenseCount,
      tournamentLinked, receiptMissing, uncategorizedExpense,
      rentActive, rentConfirmed, taskStates, progress
    };
  }
  function stateFor(key, d){
    if (key === "transactions") return d.txCount > 0 ? ["done","✓","done",`${d.txCount}件`,"is-done"] : ["empty","","warn","未入力","is-warn"];
    if (key === "tournaments") return d.tournamentLinked > 0 ? ["done","✓","done",`${d.tournamentLinked}件`,"is-done"] : ["empty","","","未確認",""];
    if (key === "categories") {
      if (d.expenseCount <= 0) return ["empty","","","未確認",""];
      return d.uncategorizedExpense === 0 ? ["done","✓","done","完了","is-done"] : ["warn","!","warn",`未分類${d.uncategorizedExpense}件`,"is-warn"];
    }
    if (key === "receipts") {
      if (d.expenseCount <= 0) return ["empty","","","未確認",""];
      return d.receiptMissing === 0 ? ["done","✓","done","不足なし","is-done"] : ["warn","!","warn",`不足${d.receiptMissing}件`,"is-warn"];
    }
    if (key === "rent") {
      if (!d.rentActive) return ["empty","","","任意",""];
      return d.rentConfirmed ? ["done","✓","done","設定済み","is-done"] : ["warn","!","warn","要確認","is-warn"];
    }
    return ["empty","","","", ""];
  }
  function updateRing(percent){
    setText(get("pnx-step148-progress-num"), String(percent));
    [get("pnx-step148-ring-progress"), get("ring-fill")].filter(Boolean).forEach(c => {
      const r = Number(c.getAttribute("r")) || 48;
      const len = 2 * Math.PI * r;
      c.style.strokeDasharray = String(len);
      c.style.strokeDashoffset = String(len * (1 - percent / 100));
    });
  }
  function render(){
    if (rendering) return window.__PNX_STEP178I_LAST_DATA__ || null;
    rendering = true;

    const d = collect();

    updateRing(d.progress);
    setText(get("pnx-step148-profit"), yen(d.profit));
    setText(get("pnx-step148-expense"), yen(d.expenseTotal));

    const label = d.txCount > 0 ? "収支データは最新です" : "収支データが未入力です";
    const date = `最終更新：${today()}`;
    document.querySelectorAll(".pnx-filing-ref-updated strong, .filing-prep-status strong").forEach(el => setText(el, label));
    setText(get("pnx-step148-updated-date"), date);

    const dataCard = get("pnx-step172-data-link-card");
    if (dataCard) {
      setText(dataCard.querySelector("strong"), "実データ連携済み");
      setText(get("pnx-step172-data-link-copy") || dataCard.querySelector("span"), "入力データは最新です");
      const badge = get("pnx-step172-data-link-badge") || dataCard.querySelector("em");
      if (badge && /確認中|反映|処理|同期|読み込み|OK|\d+%/.test(text(badge))) setText(badge, `${d.progress}%`);
    }

    const list = get("pnx-step148-todo-list");
    if (list) {
      ["transactions","tournaments","categories","receipts","rent"].forEach(key => {
        const row = list.querySelector(`[data-step148-task="${key}"]`);
        if (!row) return;
        const [circleClass, mark, emClass, status, rowClass] = stateFor(key, d);
        const circle = row.querySelector(".circle");
        const em = row.querySelector("em");
        if (circle) {
          circle.classList.remove("done","empty","warn");
          circle.classList.add(circleClass);
          setText(circle, mark);
        }
        if (em) {
          if (em.className !== emClass) em.className = emClass;
          setText(em, status);
        }
        row.classList.remove("is-done","is-warn");
        if (rowClass) row.classList.add(rowClass);
        row.classList.add("pnx-step178i-clickable-row");
      });
      list.classList.add("pnx-step178i-todo-ready");
    }

    const home = get("pnx-step148-filing-home") || get("pnx-step148d-filing-top");
    if (home) home.classList.add("pnx-step178i-stable");

    window.__PNX_STEP178I_LAST_DATA__ = d;
    window.__PNX_STEP178I_LAST_RENDER__ = { at:new Date().toISOString(), data:d };
    rendering = false;
    return d;
  }
  function schedule(){
    clearTimeout(timer);
    timer = setTimeout(render, 120);
  }

  function panel(){
    return get("tab-filing") || document.querySelector('[data-tab-panel="filing"], .fin-panel[data-panel="filing"]');
  }
  function home(){
    return get("pnx-step148d-filing-top") || get("pnx-step148-filing-home");
  }
  const taskMap = {
    transactions:{ open:"PNXStep150OpenIncomeConfirmScreen", screen:"pnx-step150-income-screen", hideClass:"pnx-step150-hidden", body:"pnx-step150-open-body" },
    tournaments:{ open:"PNXStep154OpenTournamentFinanceConfirmScreen", screen:"pnx-step154-tournament-screen", hideClass:"pnx-step154-hidden", body:"pnx-step154-open-body" },
    categories:{ open:"PNXStep155OpenExpenseCategoryConfirmScreen", screen:"pnx-step155-expense-screen", hideClass:"pnx-step155-hidden", body:"pnx-step155-open-body" },
    receipts:{ open:"PNXStep156OpenReceiptConfirmScreen", screen:"pnx-step156-receipt-screen", hideClass:"pnx-step156-hidden", body:"pnx-step156-open-body" },
    rent:{ open:"PNXStep157OpenRentAllocationConfirmScreen", screen:"pnx-step157-rent-screen", hideClass:"pnx-step157-hidden", body:"pnx-step157-open-body" }
  };
  function forceOpenTask(key){
    const cfg = taskMap[key];
    if (!cfg) return false;

    let called = false;
    try {
      if (typeof window[cfg.open] === "function") {
        window[cfg.open]();
        called = true;
      }
    } catch(e) {}

    const scr = get(cfg.screen);
    const pnl = panel();
    const top = home();

    if (scr) {
      if (pnl && scr.parentNode !== pnl) pnl.insertBefore(scr, pnl.firstElementChild);
      scr.classList.add("is-open", "pnx-step178i-force-open");
      scr.setAttribute("aria-hidden", "false");
      scr.style.display = "";
      if (top && cfg.hideClass) top.classList.add(cfg.hideClass);
      if (cfg.body) document.body.classList.add(cfg.body);
      try { if (pnl) pnl.scrollTo({top:0, behavior:"auto"}); } catch(e) {}
      window.__PNX_STEP178I_LAST_OPEN__ = { at:new Date().toISOString(), key, screen:cfg.screen, called };
      return true;
    }

    return called;
  }
  function bindTodoClicks(){
    const list = get("pnx-step148-todo-list");
    if (!list) return false;

    list.querySelectorAll("[data-step148-task]").forEach(row => {
      row.classList.add("pnx-step178i-clickable-row");
      row.style.pointerEvents = "auto";
    });

    return true;
  }

  document.addEventListener("click", function(e){
    const row = e.target && e.target.closest && e.target.closest("#pnx-step148-todo-list [data-step148-task]");
    if (!row) return;

    const key = row.getAttribute("data-step148-task");
    if (!taskMap[key]) return;

    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

    forceOpenTask(key);
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(function(){ bindTodoClicks(); render(); }, 250);
    setTimeout(function(){ bindTodoClicks(); render(); }, 1200);
  });

  window.addEventListener("pnx:finance:transactions-updated", schedule);
  window.addEventListener("pnx:finance:transactions-stable-refreshed", schedule);
  window.addEventListener("storage", function(e){ if (!e.key || e.key.indexOf("PNX_") === 0) schedule(); });

  // Safe public compatibility functions
  window.PNXStep171cPatchEmbedOfficialTodo = function(){ bindTodoClicks(); return true; };
  window.PNXStep172ApplyFinanceRealDataLinkage = render;
  window.PNXStep173ApplyFilingProgressRingLogic = render;
  window.PNXStep176CleanupFinanceSystem = function(){ bindTodoClicks(); return { step:"176-safe-by-178i", ok:true, at:new Date().toISOString() }; };
  window.PNXStep178iRenderStableFiling = render;
  window.PNXStep178iForceOpenTask = forceOpenTask;

  window.PNXStep178iRemoveLegacySyncRebuildOpenFixStatus = function(){
    const list = get("pnx-step148-todo-list");
    const rows = list ? Array.from(list.querySelectorAll("[data-step148-task]")).map(row => ({
      key:row.getAttribute("data-step148-task"),
      status:text(row.querySelector("em")),
      clickable:row.classList.contains("pnx-step178i-clickable-row")
    })) : [];
    const h = home();
    const bad = [];
    if (h) {
      h.querySelectorAll("strong,span,small,p,em,b").forEach(el => {
        const t = text(el);
        if (/反映中|処理中|同期中|読み込み中|申告準備を進めています/.test(t)) bad.push(t);
      });
    }
    return {
      step:"178i",
      rows,
      badTexts:bad,
      lastRender:window.__PNX_STEP178I_LAST_RENDER__ || null,
      lastOpen:window.__PNX_STEP178I_LAST_OPEN__ || null,
      note:"古い同期/再構築を外し、申告タブ同期とやること一覧クリックを安全に復旧"
    };
  };
})();




/* ================================================================
   STEP178j: Restore todo static safe
   目的:
   - STEP178iで消えたやること一覧を静的に復元
   - 古い再構築処理に依存しない
   - クリックで各確認画面を開けるようにする
   - 画面揺れ/文字チカチカの原因になる監視や全体CSSは使わない
   ================================================================ */
(function(){
  if (window.__PNX_STEP178J_RESTORE_TODO_STATIC_SAFE__) return;
  window.__PNX_STEP178J_RESTORE_TODO_STATIC_SAFE__ = true;

  const TX_KEY = "PNX_FINANCE_TRANSACTIONS";

  function get(id){ return document.getElementById(id); }
  function text(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }
  function setText(el, value){
    if (!el) return false;
    value = String(value == null ? "" : value);
    if (el.textContent === value) return false;
    el.textContent = value;
    return true;
  }
  function yen(n){ return "¥" + Math.round(Number(n || 0)).toLocaleString("ja-JP"); }
  function today(){
    const d = new Date();
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`;
  }
  function amount(tx){ return Math.abs(Number(tx && (tx.amount || tx.value || tx.price || tx.total || tx.cost || 0)) || 0); }
  function typeOf(tx){
    const t = String(tx && (tx.type || tx.kind || tx.flow || tx.side || "")).toLowerCase();
    if (/income|revenue|in|収入|売上|賞金|スポンサー/.test(t)) return "income";
    if (tx && (tx.income === true || tx.isIncome === true)) return "income";
    return "expense";
  }
  function categoryOf(tx){
    return String(tx && (tx.categoryLabel || tx.categoryName || tx.category || tx.typeLabel || "")).trim();
  }
  function tournamentName(tx){
    if (!tx) return "";
    const vals = [tx.tournamentName, tx.tournamentTitle, tx.tournament, tx.eventName, tx.eventTitle, tx.tournamentLabel, tx.relatedTournament];
    if (tx.tournamentInfo && typeof tx.tournamentInfo === "object") vals.unshift(tx.tournamentInfo.title, tx.tournamentInfo.name);
    if (tx.tournamentData && typeof tx.tournamentData === "object") vals.unshift(tx.tournamentData.title, tx.tournamentData.name);
    return vals.map(v => String(v || "").trim()).find(Boolean) || "";
  }
  function hasReceipt(tx){
    if (!tx) return false;
    if (tx.hasReceipt === true || tx.receiptAttached === true || tx.attachment === true) return true;
    if (Array.isArray(tx.receipts) && tx.receipts.length) return true;
    if (Array.isArray(tx.attachments) && tx.attachments.length) return true;
    return [tx.receiptUrl, tx.receiptImage, tx.receiptImageUrl, tx.fileUrl, tx.attachmentUrl, tx.photoUrl, tx.scanUrl, tx.imageUrl, tx.image].some(v => String(v || "").trim());
  }
  function readTxs(){
    try {
      if (typeof window.PNXStep178GetTransactions === "function") {
        const list = window.PNXStep178GetTransactions();
        if (Array.isArray(list)) return list;
      }
    } catch(e) {}
    try {
      const list = JSON.parse(localStorage.getItem(TX_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch(e) {
      return [];
    }
  }

  function todoHTML(){
    return `
      <section class="pnx-filing-ref-todo-section pnx-step178j-todo-section">
        <h2>やること一覧</h2>
        <div class="pnx-filing-ref-todo-card pnx-step178j-todo-card" id="pnx-step148-todo-list">
          <button type="button" class="pnx-filing-ref-todo-row pnx-step178j-clickable-row" data-step148-task="transactions"><span class="circle empty"></span><strong>収支の入力・確認</strong><em>未確認</em><i>›</i></button>
          <button type="button" class="pnx-filing-ref-todo-row pnx-step178j-clickable-row" data-step148-task="tournaments"><span class="circle empty"></span><strong>大会ごとの収支を確認</strong><em>未確認</em><i>›</i></button>
          <button type="button" class="pnx-filing-ref-todo-row pnx-step178j-clickable-row" data-step148-task="categories"><span class="circle empty"></span><strong>経費の分類</strong><em>未確認</em><i>›</i></button>
          <button type="button" class="pnx-filing-ref-todo-row pnx-step178j-clickable-row" data-step148-task="receipts"><span class="circle empty"></span><strong>レシートの確認・不足分の追加</strong><em>未確認</em><i>›</i></button>
          <button type="button" class="pnx-filing-ref-todo-row pnx-step178j-clickable-row" data-step148-task="rent"><span class="circle empty"></span><strong>家賃按分の確認（該当者のみ）</strong><em>任意</em><i>›</i></button>
        </div>
      </section>
    `;
  }
  function ctaHTML(){
    return `
      <section id="pnx-step171-final-flow" class="pnx-step171-final-flow pnx-step178j-final-flow">
        <button type="button" id="pnx-step171-open-docs" class="pnx-step171-open-docs">確定申告書類作成に進む</button>
        <button type="button" id="pnx-step171-open-share" class="pnx-step171-open-share" aria-hidden="true">税理士へ共有する</button>
      </section>
    `;
  }
  function home(){
    return get("pnx-step148-filing-home") || get("pnx-step148d-filing-top");
  }
  function statusCard(){
    const h = home();
    return h && h.querySelector(".pnx-filing-ref-status-card, #pnx-step142-taxprep, .filing-prep-card");
  }
  function ensureTodo(){
    const h = home();
    if (!h) return false;

    let list = get("pnx-step148-todo-list");
    if (!list) {
      const tmp = document.createElement("div");
      tmp.innerHTML = todoHTML().trim();
      const section = tmp.firstElementChild;
      const st = statusCard();
      if (st && st.parentNode) st.insertAdjacentElement("afterend", section);
      else h.appendChild(section);
      list = get("pnx-step148-todo-list");
    }

    // Remove bad rows if older markup came back
    Array.from(list.querySelectorAll("[data-step148-task='documents'], [data-step148-task='share']")).forEach(row => row.remove());
    Array.from(list.children).forEach(row => {
      if (/申告書類|PDF|CSV|税理士|共有/.test(text(row))) row.remove();
    });

    const required = ["transactions","tournaments","categories","receipts","rent"];
    const current = Array.from(list.querySelectorAll("[data-step148-task]")).map(r => r.getAttribute("data-step148-task"));
    if (!required.every(k => current.includes(k))) {
      const tmp = document.createElement("div");
      tmp.innerHTML = todoHTML().trim();
      const fresh = tmp.querySelector("#pnx-step148-todo-list");
      list.innerHTML = fresh.innerHTML;
    }

    list.classList.add("pnx-step178j-todo-card");
    const section = list.closest(".pnx-filing-ref-todo-section");
    if (section) section.classList.add("pnx-step178j-todo-section");

    let flow = get("pnx-step171-final-flow") || get("pnx-step169-final-flow");
    if (!flow) {
      const tmp = document.createElement("div");
      tmp.innerHTML = ctaHTML().trim();
      flow = tmp.firstElementChild;
      if (section) section.insertAdjacentElement("afterend", flow);
      else h.appendChild(flow);
    } else if (section && section.nextElementSibling !== flow) {
      section.insertAdjacentElement("afterend", flow);
    }

    return true;
  }

  function collect(){
    const txs = readTxs().filter(tx => amount(tx) > 0);
    let incomeTotal = 0, expenseTotal = 0;
    let incomeCount = 0, expenseCount = 0;
    let tournamentLinked = 0, receiptMissing = 0, uncategorizedExpense = 0;

    txs.forEach(tx => {
      const a = amount(tx);
      if (typeOf(tx) === "income") {
        incomeTotal += a;
        incomeCount += 1;
      } else {
        expenseTotal += a;
        expenseCount += 1;
        if (!hasReceipt(tx)) receiptMissing += 1;
        const c = categoryOf(tx);
        if (!c || /未分類|未設定|その他未設定|none|null|undefined/i.test(c)) uncategorizedExpense += 1;
      }
      if (tournamentName(tx)) tournamentLinked += 1;
    });

    const rentConfirmed = localStorage.getItem("PNX_FILING_STEP157_RENT_CONFIRMED") === "1";
    const rentActive = rentConfirmed || Number(localStorage.getItem("PNX_RENT_ALLOCATION_RATE") || localStorage.getItem("PNX_FINANCE_RENT_RATE") || 0) > 0;

    const taskStates = {
      transactions: incomeCount + expenseCount > 0,
      tournaments: tournamentLinked > 0,
      categories: expenseCount > 0 && uncategorizedExpense === 0,
      receipts: expenseCount > 0 && receiptMissing === 0,
      rent: rentActive ? rentConfirmed : true
    };
    const required = ["transactions","tournaments","categories","receipts"].concat(rentActive ? ["rent"] : []);
    const done = required.filter(k => taskStates[k]).length;
    const progress = required.length ? Math.round(done / required.length * 100) : 0;

    return { incomeTotal, expenseTotal, profit:incomeTotal-expenseTotal, incomeCount, expenseCount, txCount:incomeCount+expenseCount, tournamentLinked, receiptMissing, uncategorizedExpense, rentActive, rentConfirmed, progress };
  }

  function stateFor(key, d){
    if (key === "transactions") return d.txCount > 0 ? ["done","✓","done",`${d.txCount}件`,"is-done"] : ["empty","","warn","未入力","is-warn"];
    if (key === "tournaments") return d.tournamentLinked > 0 ? ["done","✓","done",`${d.tournamentLinked}件`,"is-done"] : ["empty","","","未確認",""];
    if (key === "categories") {
      if (d.expenseCount <= 0) return ["empty","","","未確認",""];
      return d.uncategorizedExpense === 0 ? ["done","✓","done","完了","is-done"] : ["warn","!","warn",`未分類${d.uncategorizedExpense}件`,"is-warn"];
    }
    if (key === "receipts") {
      if (d.expenseCount <= 0) return ["empty","","","未確認",""];
      return d.receiptMissing === 0 ? ["done","✓","done","不足なし","is-done"] : ["warn","!","warn",`不足${d.receiptMissing}件`,"is-warn"];
    }
    if (key === "rent") {
      if (!d.rentActive) return ["empty","","","任意",""];
      return d.rentConfirmed ? ["done","✓","done","設定済み","is-done"] : ["warn","!","warn","要確認","is-warn"];
    }
    return ["empty","","","", ""];
  }

  function render(){
    ensureTodo();
    const d = collect();

    setText(get("pnx-step148-progress-num"), String(d.progress));
    setText(get("pnx-step148-profit"), yen(d.profit));
    setText(get("pnx-step148-expense"), yen(d.expenseTotal));
    document.querySelectorAll(".pnx-filing-ref-updated strong, .filing-prep-status strong").forEach(el => setText(el, d.txCount > 0 ? "収支データは最新です" : "収支データが未入力です"));
    setText(get("pnx-step148-updated-date"), `最終更新：${today()}`);

    const list = get("pnx-step148-todo-list");
    if (list) {
      ["transactions","tournaments","categories","receipts","rent"].forEach(key => {
        const row = list.querySelector(`[data-step148-task="${key}"]`);
        if (!row) return;
        const [circleClass, mark, emClass, status, rowClass] = stateFor(key, d);
        const circle = row.querySelector(".circle");
        const em = row.querySelector("em");
        if (circle) {
          circle.classList.remove("done","empty","warn");
          circle.classList.add(circleClass);
          setText(circle, mark);
        }
        if (em) {
          if (em.className !== emClass) em.className = emClass;
          setText(em, status);
        }
        row.classList.remove("is-done","is-warn");
        if (rowClass) row.classList.add(rowClass);
        row.classList.add("pnx-step178j-clickable-row");
      });
    }

    const h = home();
    if (h) h.classList.add("pnx-step178j-stable");

    window.__PNX_STEP178J_LAST_RENDER__ = { at:new Date().toISOString(), data:d };
    return d;
  }

  const taskMap = {
    transactions:["PNXStep150OpenIncomeConfirmScreen","PNXStep150fOpenIncomeConfirmScreen"],
    tournaments:["PNXStep154OpenTournamentFinanceConfirmScreen","PNXStep154bOpenTournamentFinanceConfirmScreen"],
    categories:["PNXStep155OpenExpenseCategoryConfirmScreen"],
    receipts:["PNXStep156OpenReceiptConfirmScreen"],
    rent:["PNXStep157OpenRentAllocationConfirmScreen"]
  };

  function openTask(key){
    const names = taskMap[key] || [];
    for (const name of names) {
      try {
        if (typeof window[name] === "function") {
          window[name]();
          window.__PNX_STEP178J_LAST_OPEN__ = { at:new Date().toISOString(), key, fn:name };
          return true;
        }
      } catch(e) {}
    }
    window.__PNX_STEP178J_LAST_OPEN__ = { at:new Date().toISOString(), key, fn:null, error:"open function not found" };
    return false;
  }

  document.addEventListener("click", function(e){
    const row = e.target && e.target.closest && e.target.closest("#pnx-step148-todo-list [data-step148-task]");
    if (!row) return;

    const key = row.getAttribute("data-step148-task");
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    openTask(key);
  }, true);

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(render, 150);
    setTimeout(render, 800);
    setTimeout(render, 1800);
  });

  window.addEventListener("pnx:finance:transactions-updated", function(){ setTimeout(render, 120); });
  window.addEventListener("pnx:finance:transactions-stable-refreshed", function(){ setTimeout(render, 120); });
  window.addEventListener("storage", function(e){ if (!e.key || e.key.indexOf("PNX_") === 0) setTimeout(render, 120); });

  window.PNXStep178jRestoreTodoStaticSafe = render;
  window.PNXStep178jEnsureTodoList = ensureTodo;
  window.PNXStep178jOpenTask = openTask;
  window.PNXStep178jRestoreTodoStaticSafeStatus = function(){
    const list = get("pnx-step148-todo-list");
    const rows = list ? Array.from(list.querySelectorAll("[data-step148-task]")).map(row => ({
      key:row.getAttribute("data-step148-task"),
      title:text(row.querySelector("strong")),
      status:text(row.querySelector("em")),
      clickable:row.classList.contains("pnx-step178j-clickable-row")
    })) : [];
    return {
      step:"178j",
      todoExists:!!list,
      rows,
      lastRender:window.__PNX_STEP178J_LAST_RENDER__ || null,
      lastOpen:window.__PNX_STEP178J_LAST_OPEN__ || null,
      note:"消えたやること一覧を静的に復元し、クリックを安全に復旧"
    };
  };
})();

(function(){ window.__PNX_FINANCE_SCRIPT_VERSION__ = "step178j"; })();
