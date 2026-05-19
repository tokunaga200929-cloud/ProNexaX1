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
     状態管理
     ============================================================ */
  let state = {
    currentTab:     'overview',
    currentMonth:   new Date(2024, 4, 1),   // 2024年5月
    currentYear:    2024,
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
    const filtered = ALL_TRANSACTIONS
      .filter(tx => tx.date.startsWith(ym))
      .slice(0, 5);

    container.innerHTML = filtered.map(tx => buildTxRow(tx)).join('');
  }

  function updateOverviewSummary() {
    const ym = `${state.currentMonth.getFullYear()}-${String(state.currentMonth.getMonth()+1).padStart(2,'0')}`;
    const txs = ALL_TRANSACTIONS.filter(tx => tx.date.startsWith(ym));

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

    let filtered = [...ALL_TRANSACTIONS];

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

    const newTx = {
      id: Date.now(),
      date,
      type:       state.selectedType,
      name:       desc,
      meta:       tourn || state.selectedCat,
      amount,
      category:   state.selectedCat,
      tournament: tourn,
    };

    ALL_TRANSACTIONS.unshift(newTx);
    closeModal();

    updateOverviewSummary();
    renderOverviewTx();
    renderTransactions();

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
    openBtn && openBtn.addEventListener('click', () => {
      resetPro();
      pushFilingScreen('doc-list');
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
  window.PNXFinance = {
    openAddModal:  openModal,
    closeAddModal: closeModal,
    refreshData: () => {
      updateOverviewSummary();
      renderOverviewTx();
      renderTransactions();
    },
    showToast,
  };

}());
