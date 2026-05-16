/* ================================================================
   ProNexaX — pages/finance/script.js
   STEP 4 : サマリーUI強化・カテゴリ分析・期間切替
   ================================================================ */

'use strict';

/* ================================================================
   カテゴリマスター
   ================================================================ */
const CATEGORIES = {
  prize:         { label: '賞金',         icon: '🏆', type: 'income'  },
  sponsor:       { label: 'スポンサー',   icon: '🤝', type: 'income'  },
  lesson:        { label: 'レッスン料',   icon: '🎓', type: 'income'  },
  other_income:  { label: 'その他収入',   icon: '💰', type: 'income'  },
  entry:         { label: 'エントリー費', icon: '📝', type: 'expense' },
  travel:        { label: '交通費',       icon: '✈️', type: 'expense' },
  hotel:         { label: '宿泊費',       icon: '🏨', type: 'expense' },
  caddie:        { label: 'キャディ代',   icon: '🧳', type: 'expense' },
  equipment:     { label: '用品・道具',   icon: '🏌️', type: 'expense' },
  practice:      { label: '練習費',       icon: '⛳', type: 'expense' },
  food:          { label: '食費',         icon: '🍱', type: 'expense' },
  other_expense: { label: 'その他支出',   icon: '📋', type: 'expense' },
};

const CAT_INCOME  = ['prize','sponsor','lesson','other_income'];
const CAT_EXPENSE = ['entry','travel','hotel','caddie','equipment','practice','food','other_expense'];

/* ================================================================
   ダミーデータ（保存で先頭追加される可変配列）
   ================================================================ */
const LEDGER_ENTRIES = [
  { id:'e01', date:'2025-06-14', category:'prize',    title:'優勝賞金',           tournament:'ACNツアー 第6戦 ABCカップ',  amount:+280000, type:'income',  memo:'プレーオフ制覇。今季初優勝。' },
  { id:'e02', date:'2025-06-14', category:'caddie',   title:'キャディフィー',     tournament:'ACNツアー 第6戦 ABCカップ',  amount: -38000, type:'expense', memo:'3日分。' },
  { id:'e03', date:'2025-06-13', category:'hotel',    title:'宿泊費（3泊）',      tournament:'ACNツアー 第6戦 ABCカップ',  amount: -39600, type:'expense', memo:'ホテルXX 3泊分。領収書あり。' },
  { id:'e04', date:'2025-06-13', category:'travel',   title:'新幹線 往復',        tournament:'ACNツアー 第6戦 ABCカップ',  amount: -28600, type:'expense', memo:'東京 → 大阪 往復 グリーン車。' },
  { id:'e05', date:'2025-06-12', category:'entry',    title:'エントリー料',       tournament:'ACNツアー 第6戦 ABCカップ',  amount: -33000, type:'expense', memo:'' },
  { id:'e06', date:'2025-06-08', category:'sponsor',  title:'スポンサー契約金（月次）', tournament:'',                    amount:+180000, type:'income',  memo:'XXスポーツ 月次スポンサー料。' },
  { id:'e07', date:'2025-06-03', category:'practice', title:'打ちっぱなし練習場', tournament:'',                          amount:  -8800, type:'expense', memo:'月間パス。' },
  { id:'e08', date:'2025-05-25', category:'prize',    title:'賞金（2位）',        tournament:'JAPAN PRO QT ファイナル',    amount: +80000, type:'income',  memo:'' },
  { id:'e09', date:'2025-05-24', category:'caddie',   title:'キャディフィー',     tournament:'JAPAN PRO QT ファイナル',    amount: -40000, type:'expense', memo:'4日分。' },
  { id:'e10', date:'2025-05-22', category:'hotel',    title:'宿泊費（4泊）',      tournament:'JAPAN PRO QT ファイナル',    amount: -52800, type:'expense', memo:'' },
  { id:'e11', date:'2025-05-22', category:'entry',    title:'エントリー料',       tournament:'JAPAN PRO QT ファイナル',    amount: -19500, type:'expense', memo:'' },
  { id:'e12', date:'2025-04-15', category:'prize',    title:'賞金（優勝）',       tournament:'ACNツアー 第4戦 XYZオープン', amount:+350000, type:'income', memo:'' },
  { id:'e13', date:'2025-04-14', category:'caddie',   title:'キャディフィー',     tournament:'ACNツアー 第4戦 XYZオープン', amount: -35000, type:'expense', memo:'' },
  { id:'e14', date:'2025-04-12', category:'equipment',title:'ウェッジ買い替え',   tournament:'',                           amount: -44000, type:'expense', memo:'Titleist Vokey SM9 × 2本。' },
];

/* 月ダミー（スパークライン用 — 利益の推移） */
const MONTHLY_PROFITS = {
  month: [112000, -18000, 78000, 205000, -32000, 182400],           // 直近6ヶ月
  year:  [320000, -45000, 415000, 182000, 260000, 530000,
          -28000, 194000, 380000, 290000, -15000, 182400],          // 直近12ヶ月
  all:   [80000, 120000, 200000, 150000, 320000, -45000, 415000,
          182000, 260000, 530000, -28000, 194000, 380000, 182400], // 全期間
};

/* 期間ごとのサマリーダミー */
const PERIOD_DATA = {
  month: {
    label: '今月のサマリー', period: '2025年6月',
    income: 460000, expense: 148000, momPct: +22, momDelta: +33200,
  },
  year: {
    label: '今年のサマリー', period: '2025年',
    income: 2840000, expense: 892000, momPct: +8, momDelta: +210000,
  },
  all: {
    label: '全期間サマリー', period: '2024年〜2025年',
    income: 5620000, expense: 1740000, momPct: +14, momDelta: +682000,
  },
};

/* 期間ごとの支出カテゴリダミー */
const CAT_DATA = {
  month: [
    { key:'caddie',   amount:38000 },
    { key:'hotel',    amount:39600 },
    { key:'travel',   amount:28600 },
    { key:'entry',    amount:33000 },
    { key:'practice', amount:8800  },
  ],
  year: [
    { key:'caddie',   amount:283000 },
    { key:'hotel',    amount:246000 },
    { key:'travel',   amount:195000 },
    { key:'entry',    amount:140000 },
    { key:'equipment',amount:88000  },
    { key:'practice', amount:40000  },
  ],
  all: [
    { key:'caddie',   amount:560000 },
    { key:'hotel',    amount:480000 },
    { key:'travel',   amount:370000 },
    { key:'entry',    amount:290000 },
    { key:'equipment',amount:176000 },
    { key:'practice', amount:82000  },
    { key:'food',     amount:64000  },
  ],
};

const PERIOD_LABEL_MAP = { month:'今月', year:'今年', all:'全期間' };

const RECENT_TOURNAMENTS = [
  { id:'t1', tag:'ACNツアー',  name:'ACNツアー 第6戦 ABCカップ',    date:'2025年6月14日〜16日', amount:+48600  },
  { id:'t2', tag:'JAPAN PRO', name:'JAPAN PRO QT ファイナル',      date:'2025年5月22日〜25日', amount:-32300  },
  { id:'t3', tag:'ACNツアー',  name:'ACNツアー 第4戦 XYZオープン', date:'2025年4月10日〜12日', amount:+112000 },
];

const QUICK_CARDS = [
  { id:'add-entry',       icon:'➕', iconClass:'green', name:'収支を入力',   desc:'収入・支出を記録', action:'open-bs' },
  { id:'receipt',         icon:'📷', iconClass:'blue',  name:'レシート撮影', desc:'OCR で自動入力',   action:'stub' },
  { id:'tournament-list', icon:'🏌️', iconClass:'amber', name:'大会一覧',     desc:'参加大会を管理',   action:'stub' },
  { id:'report',          icon:'📊', iconClass:'slate', name:'レポート',     desc:'月次・年次分析',   action:'stub' },
];

/* ================================================================
   状態
   ================================================================ */
let currentPeriod = 'month';   // 'month' | 'year' | 'all'
let currentFilter = 'all';
let currentYear   = 2025;
let currentMonth  = 6;

let bsType     = 'income';
let bsCategory = '';
let bsRawAmount = '';

/* ================================================================
   ユーティリティ
   ================================================================ */
function fmtSigned(n) { return (n >= 0 ? '+¥' : '-¥') + Math.abs(n).toLocaleString('ja-JP'); }
function fmtPlain(n)  { return '¥' + Math.abs(n).toLocaleString('ja-JP'); }
function fmtPct(n)    { return (n >= 0 ? '+' : '') + n + '%'; }
function fmtDateGroup(s) {
  const [y,m,d] = s.split('-').map(Number);
  const days=['日','月','火','水','木','金','土'];
  return `${m}月${d}日（${days[new Date(y,m-1,d).getDay()]}）`;
}
function fmtDateFull(s) {
  const [y,m,d] = s.split('-').map(Number);
  const days=['日','月','火','水','木','金','土'];
  return `${y}年${m}月${d}日（${days[new Date(y,m-1,d).getDay()]}）`;
}
function fmtWithComma(str) { return str ? Number(str).toLocaleString('ja-JP') : '0'; }
function genId() { return 'u'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function todayStr() {
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* ================================================================
   スパークライン SVG（Apple株アプリ風）
   ================================================================ */
function buildSparkline(profits, w, h) {
  if (!profits || profits.length < 2) return '';
  const pad = { top: 4, bottom: 4, left: 0, right: 0 };
  const maxV = Math.max(...profits);
  const minV = Math.min(...profits);
  const range = maxV - minV || 1;
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const xs = profits.map((_, i) => pad.left + (i / (profits.length - 1)) * plotW);
  const ys = profits.map(v => pad.top + plotH - ((v - minV) / range) * plotH);

  /* スムーズなパス（cubic bezier） */
  let d = `M ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < xs.length; i++) {
    const cpx1 = (xs[i-1] + xs[i]) / 2;
    d += ` C ${cpx1} ${ys[i-1]}, ${cpx1} ${ys[i]}, ${xs[i]} ${ys[i]}`;
  }

  /* 塗りつぶし用パス */
  const fillD = d + ` L ${xs[xs.length-1]} ${h} L ${xs[0]} ${h} Z`;

  /* 最終点の色（利益がプラスなら緑、マイナスなら赤） */
  const lastVal = profits[profits.length - 1];
  const lineColor = lastVal >= 0 ? '#7EE8A2' : '#F5B7B1';
  const fillId = 'sparkGrad_' + Math.random().toString(36).slice(2,6);

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <defs>
      <linearGradient id="${fillId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="${lineColor}" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="${lineColor}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <!-- 塗り -->
    <path d="${fillD}" fill="url(#${fillId})"/>
    <!-- ゼロライン -->
    <line x1="0" y1="${pad.top + plotH - ((0 - minV) / range) * plotH}"
          x2="${w}" y2="${pad.top + plotH - ((0 - minV) / range) * plotH}"
          stroke="rgba(255,255,255,.10)" stroke-width="1" stroke-dasharray="3 3"/>
    <!-- メインライン -->
    <path d="${d}" fill="none" stroke="${lineColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- 最終点ドット -->
    <circle cx="${xs[xs.length-1]}" cy="${ys[ys.length-1]}" r="3.5"
      fill="${lineColor}" stroke="rgba(255,255,255,.3)" stroke-width="1.5"/>
  </svg>`;
}

/* ================================================================
   サマリーカード描画（期間対応）
   ================================================================ */
function renderSummary() {
  const d = PERIOD_DATA[currentPeriod];
  const profit = d.income - d.expense;
  const rate   = Math.round((profit / d.income) * 100);
  const isUp   = d.momPct >= 0;

  /* テキスト */
  document.getElementById('sc-label').textContent   = d.label;
  document.getElementById('sc-period').textContent  = d.period;
  document.getElementById('summary-profit').textContent  = fmtSigned(profit);
  document.getElementById('summary-income').textContent  = fmtPlain(d.income);
  document.getElementById('summary-expense').textContent = fmtPlain(d.expense);
  document.getElementById('summary-rate').textContent    = rate + '%';

  /* 前月比バッジ */
  const badge = document.getElementById('summary-badge');
  badge.className = 'f-sc-badge ' + (isUp ? 'positive' : 'negative');
  const arrowPts = isUp ? '18 15 12 9 6 15' : '6 9 12 15 18 9';
  badge.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="${arrowPts}"/></svg> ${currentPeriod === 'month' ? '先月比' : '前年比'} ${fmtPct(d.momPct)}`;

  /* 増減額 */
  const delta = document.getElementById('summary-delta');
  delta.textContent = (isUp ? '▲ ' : '▼ ') + fmtPlain(Math.abs(d.momDelta)) + (isUp ? ' 増加' : ' 減少');

  /* 収支バー */
  const incPct = Math.round((d.income / (d.income + d.expense)) * 100);
  const expPct = 100 - incPct;
  document.getElementById('sc-bar-income').style.width  = incPct + '%';
  document.getElementById('sc-bar-expense').style.width = expPct + '%';

  /* スパークライン */
  const sparkEl = document.getElementById('sparkline-wrap');
  const profits = MONTHLY_PROFITS[currentPeriod];
  const w = sparkEl.offsetWidth || 340;
  sparkEl.innerHTML = buildSparkline(profits, w, 48);

  /* 分析ラベル */
  const anlEl = document.getElementById('analysis-period-label');
  if (anlEl) anlEl.textContent = PERIOD_LABEL_MAP[currentPeriod];

  /* カテゴリ分析も更新 */
  renderCatAnalysis();
}

/* ================================================================
   支出カテゴリ分析
   ================================================================ */
function renderCatAnalysis() {
  const container = document.getElementById('cat-analysis');
  if (!container) return;
  const items = CAT_DATA[currentPeriod];
  const total  = items.reduce((s,i) => s + i.amount, 0);
  const max    = items[0].amount;

  container.innerHTML = '';
  items.forEach((item, idx) => {
    const cat = CATEGORIES[item.key] || { label: item.key, icon: '📋' };
    const pct = Math.round((item.amount / total) * 100);
    const barPct = Math.round((item.amount / max) * 100);
    const row = document.createElement('div');
    row.className = 'f-cat-row';
    row.style.animationDelay = `${idx * 0.05}s`;
    row.innerHTML = `
      <span class="f-cat-rank ${idx === 0 ? 'top' : ''}">${idx + 1}</span>
      <div class="f-cat-icon">${cat.icon}</div>
      <div class="f-cat-text">
        <div class="f-cat-name">${cat.label}</div>
        <div class="f-cat-bar-wrap">
          <div class="f-cat-bar-track">
            <div class="f-cat-bar-fill" style="width:${barPct}%"></div>
          </div>
        </div>
      </div>
      <div class="f-cat-right">
        <span class="f-cat-pct">${pct}%</span>
        <span class="f-cat-amt">${fmtPlain(item.amount)}</span>
      </div>`;
    container.appendChild(row);
  });
}

/* ================================================================
   期間タブ
   ================================================================ */
document.getElementById('period-tabs').addEventListener('click', e => {
  const tab = e.target.closest('.f-period-tab');
  if (!tab) return;
  document.querySelectorAll('.f-period-tab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected','false');
  });
  tab.classList.add('active');
  tab.setAttribute('aria-selected','true');
  currentPeriod = tab.dataset.period;
  renderSummary();
});

/* ================================================================
   クイックアクセス
   ================================================================ */
function renderQuickCards() {
  const container = document.getElementById('quick-grid');
  container.innerHTML = '';
  QUICK_CARDS.forEach(card => {
    const btn = document.createElement('button');
    btn.className = 'f-quick-card';
    btn.dataset.action = card.action;
    btn.innerHTML = `
      <div class="f-quick-icon ${card.iconClass}">${card.icon}</div>
      <div><div class="f-quick-name">${card.name}</div><div class="f-quick-desc">${card.desc}</div></div>`;
    container.appendChild(btn);
  });
  container.addEventListener('click', e => {
    const card = e.target.closest('.f-quick-card');
    if (!card) return;
    if (card.dataset.action === 'open-bs') openInputSheet();
    else showToast('🚧 この機能は準備中です');
  });
}

/* ================================================================
   直近の大会
   ================================================================ */
function renderTournaments() {
  const container = document.getElementById('tournament-list');
  container.innerHTML = '';
  RECENT_TOURNAMENTS.forEach(t => {
    const isPos = t.amount >= 0;
    const card  = document.createElement('div');
    card.className = 'f-tournament-card';
    card.innerHTML = `
      <div class="f-tc-body">
        <div class="f-tc-left">
          <span class="f-tc-tag">${t.tag}</span>
          <div class="f-tc-name">${t.name}</div>
          <div class="f-tc-date">${t.date}</div>
        </div>
        <div class="f-tc-right">
          <span class="f-tc-amount ${isPos?'positive':'negative'}">${fmtSigned(t.amount)}</span>
        </div>
      </div>
      <div class="f-tc-footer">
        <button class="f-tc-manage-btn" data-tid="${t.id}">この大会を管理する</button>
      </div>`;
    container.appendChild(card);
  });
  container.addEventListener('click', e => {
    if (e.target.closest('.f-tc-manage-btn')) showToast('📋 大会管理は準備中です');
  });
}

/* ================================================================
   収支一覧
   ================================================================ */
function getFilteredEntries() {
  return LEDGER_ENTRIES.filter(e => {
    const [y,m] = e.date.split('-').map(Number);
    if (y !== currentYear || m !== currentMonth) return false;
    if (currentFilter === 'income')  return e.type === 'income';
    if (currentFilter === 'expense') return e.type === 'expense';
    return true;
  });
}

function renderSummaryBar() {
  const all = LEDGER_ENTRIES.filter(e => {
    const [y,m] = e.date.split('-').map(Number);
    return y === currentYear && m === currentMonth;
  });
  const inc = all.filter(e=>e.type==='income').reduce((s,e)=>s+e.amount,0);
  const exp = all.filter(e=>e.type==='expense').reduce((s,e)=>s+Math.abs(e.amount),0);
  const prf = inc - exp;
  document.getElementById('ledger-summary-bar').innerHTML = `
    <div class="f-lsb-item"><span class="f-lsb-label">収入</span><span class="f-lsb-val income">${fmtPlain(inc)}</span></div>
    <div class="f-lsb-divider"></div>
    <div class="f-lsb-item"><span class="f-lsb-label">支出</span><span class="f-lsb-val expense">${fmtPlain(exp)}</span></div>
    <div class="f-lsb-divider"></div>
    <div class="f-lsb-item"><span class="f-lsb-label">収支</span><span class="f-lsb-val profit ${prf>=0?'positive':'negative'}">${fmtSigned(prf)}</span></div>`;
}

function renderLedgerList() {
  const container = document.getElementById('ledger-list');
  container.innerHTML = '';
  const entries = getFilteredEntries();
  if (entries.length === 0) {
    container.innerHTML = `<div class="f-ledger-empty"><div class="f-ledger-empty-icon">📭</div><div class="f-ledger-empty-text">この月の収支データがありません</div></div>`;
    return;
  }
  const groups = {};
  entries.forEach(e => { if (!groups[e.date]) groups[e.date]=[]; groups[e.date].push(e); });
  const sorted = Object.keys(groups).sort((a,b)=>b.localeCompare(a));
  let gi = 0;
  sorted.forEach(dateStr => {
    const group = groups[dateStr];
    const dayTotal = group.reduce((s,e)=>s+e.amount,0);
    const groupEl  = document.createElement('div');
    groupEl.className = 'f-ledger-date-group';
    groupEl.innerHTML = `
      <div class="f-ldg-date-header">
        <span class="f-ldg-date-text">${fmtDateGroup(dateStr)}</span>
        <span class="f-ldg-date-total ${dayTotal>=0?'positive':'negative'}">${fmtSigned(dayTotal)}</span>
      </div>`;
    group.forEach(entry => {
      const cat = CATEGORIES[entry.category] || { label:entry.category, icon:'📄' };
      const card = document.createElement('div');
      card.className = 'f-ledger-card';
      card.dataset.id = entry.id;
      card.style.animationDelay = `${gi * 0.04}s`;
      gi++;
      card.innerHTML = `
        <div class="f-lc-bar ${entry.type}"></div>
        <div class="f-lc-body">
          <div class="f-lc-icon ${entry.type}">${cat.icon}</div>
          <div class="f-lc-text">
            <div class="f-lc-top-row"><span class="f-lc-category-tag ${entry.type}">${cat.label}</span></div>
            <div class="f-lc-title">${entry.title}</div>
            ${entry.tournament ? `<div class="f-lc-tournament"><span class="f-lc-tournament-dot"></span>${entry.tournament}</div>` : ''}
          </div>
          <div class="f-lc-right">
            <span class="f-lc-amount ${entry.type}">${fmtSigned(entry.amount)}</span>
            <svg class="f-lc-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>`;
      groupEl.appendChild(card);
    });
    container.appendChild(groupEl);
  });
  container.addEventListener('click', e => {
    const card = e.target.closest('.f-ledger-card');
    if (!card) return;
    const entry = LEDGER_ENTRIES.find(en => en.id === card.dataset.id);
    if (entry) openDetailSheet(entry);
  });
}

function renderMonthLabel() {
  document.getElementById('ledger-month-label').textContent = `${currentYear}年${currentMonth}月`;
}
function renderLedger() {
  renderMonthLabel();
  renderSummaryBar();
  renderLedgerList();
}

document.getElementById('btn-month-prev').addEventListener('click', () => {
  if (--currentMonth < 1) { currentMonth = 12; currentYear--; }
  renderLedger();
});
document.getElementById('btn-month-next').addEventListener('click', () => {
  if (++currentMonth > 12) { currentMonth = 1; currentYear++; }
  renderLedger();
});

document.getElementById('ledger-tabs').addEventListener('click', e => {
  const tab = e.target.closest('.f-ledger-tab');
  if (!tab) return;
  document.querySelectorAll('.f-ledger-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
  tab.classList.add('active');
  tab.setAttribute('aria-selected','true');
  currentFilter = tab.dataset.filter;
  renderLedgerList();
});

/* ================================================================
   Bottom Sheet — 収支入力
   ================================================================ */
const bsOverlay  = document.getElementById('bs-overlay');
const bsSheet    = document.getElementById('bs-sheet');
const amountHero = document.getElementById('bs-amount-hero');
const amountDisp = document.getElementById('bs-amount-display');
const amountInp  = document.getElementById('input-amount');

function renderCategoryChips(type) {
  const keys = type === 'income' ? CAT_INCOME : CAT_EXPENSE;
  const container = document.getElementById('bs-category-chips');
  container.innerHTML = '';
  bsCategory = '';
  keys.forEach(key => {
    const cat = CATEGORIES[key];
    const chip = document.createElement('button');
    chip.className = 'bs-cat-chip';
    chip.dataset.key = key;
    chip.type = 'button';
    chip.innerHTML = `<span class="bs-cat-chip-icon">${cat.icon}</span><span class="bs-cat-chip-label">${cat.label}</span>`;
    container.appendChild(chip);
  });
  container.addEventListener('click', e => {
    const chip = e.target.closest('.bs-cat-chip');
    if (!chip) return;
    document.querySelectorAll('.bs-cat-chip').forEach(c => c.classList.remove('active','income','expense'));
    chip.classList.add('active', bsType);
    bsCategory = chip.dataset.key;
  });
}

function switchType(type) {
  bsType = type;
  document.querySelectorAll('.bs-seg-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type));
  amountHero.classList.toggle('income',  type === 'income');
  amountHero.classList.toggle('expense', type === 'expense');
  bsSheet.classList.toggle('expense-mode', type === 'expense');
  renderCategoryChips(type);
}

document.getElementById('bs-segment').addEventListener('click', e => {
  const btn = e.target.closest('.bs-seg-btn');
  if (btn) switchType(btn.dataset.type);
});

amountInp.addEventListener('input', () => {
  const raw = amountInp.value.replace(/\D/g,'');
  bsRawAmount = raw;
  amountInp.value = raw;
  if (!raw || raw === '0') {
    amountDisp.textContent = '0';
    amountDisp.classList.add('placeholder');
    document.getElementById('bs-amount-sub').classList.remove('hidden');
  } else {
    amountDisp.textContent = Number(raw).toLocaleString('ja-JP');
    amountDisp.classList.remove('placeholder');
    document.getElementById('bs-amount-sub').classList.add('hidden');
  }
});
amountInp.addEventListener('focus', () => amountHero.classList.add('focused'));
amountInp.addEventListener('blur',  () => {
  amountHero.classList.remove('focused');
  if (!bsRawAmount) document.getElementById('bs-amount-sub').classList.remove('hidden');
});
amountHero.addEventListener('click', () => amountInp.focus());

function openInputSheet() {
  bsRawAmount = ''; bsCategory = '';
  amountInp.value = '';
  amountDisp.textContent = '0';
  amountDisp.classList.add('placeholder');
  document.getElementById('bs-amount-sub').classList.remove('hidden');
  document.getElementById('input-date').value = todayStr();
  document.getElementById('input-title').value = '';
  document.getElementById('input-tournament').value = '';
  document.getElementById('input-memo').value = '';
  switchType('income');
  bsOverlay.setAttribute('aria-hidden','false');
  bsSheet.setAttribute('aria-hidden','false');
  bsOverlay.classList.add('open');
  bsSheet.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeInputSheet() {
  bsOverlay.setAttribute('aria-hidden','true');
  bsSheet.setAttribute('aria-hidden','true');
  bsOverlay.classList.remove('open');
  bsSheet.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('bs-close-btn').addEventListener('click', closeInputSheet);
document.getElementById('bs-cta-cancel').addEventListener('click', closeInputSheet);
bsOverlay.addEventListener('click', closeInputSheet);

const bsSave = document.getElementById('bs-cta-save');
bsSave.addEventListener('click', () => {
  if (!bsRawAmount || Number(bsRawAmount) <= 0) { shakeHero(); showToast('⚠️ 金額を入力してください'); return; }
  if (!bsCategory) { showToast('⚠️ カテゴリを選択してください'); return; }
  const title = document.getElementById('input-title').value.trim();
  if (!title) { document.getElementById('input-title').focus(); showToast('⚠️ 内容を入力してください'); return; }

  const amt = Number(bsRawAmount);
  const entry = {
    id:         genId(),
    date:       document.getElementById('input-date').value || todayStr(),
    category:   bsCategory,
    title,
    tournament: document.getElementById('input-tournament').value.trim(),
    amount:     bsType === 'income' ? +amt : -amt,
    type:       bsType,
    memo:       document.getElementById('input-memo').value.trim(),
  };
  LEDGER_ENTRIES.unshift(entry);

  bsSave.classList.add('saved');
  bsSave.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> 保存しました`;

  setTimeout(() => {
    closeInputSheet();
    const [y,m] = entry.date.split('-').map(Number);
    currentYear = y; currentMonth = m; currentFilter = 'all';
    document.querySelectorAll('.f-ledger-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.filter==='all');
      t.setAttribute('aria-selected', t.dataset.filter==='all'?'true':'false');
    });
    renderSummary();
    renderLedger();
    showToast(`✅ ${bsType==='income'?'収入':'支出'} ¥${amt.toLocaleString('ja-JP')} を保存しました`);
    setTimeout(() => {
      bsSave.classList.remove('saved');
      bsSave.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> 保存する`;
    }, 500);
  }, 650);
});

function shakeHero() {
  amountHero.style.animation = 'none';
  requestAnimationFrame(() => { amountHero.style.animation = 'shakeX .4s ease'; });
}

/* ================================================================
   Bottom Sheet — 収支詳細
   ================================================================ */
const detailOverlay = document.getElementById('detail-overlay');
const detailSheet   = document.getElementById('detail-sheet');

function openDetailSheet(entry) {
  const cat = CATEGORIES[entry.category] || { label:entry.category, icon:'📄' };
  document.getElementById('detail-hero').className = 'detail-hero ' + entry.type;
  const heroType = document.getElementById('detail-hero-type');
  heroType.className = 'detail-hero-type ' + entry.type;
  heroType.textContent = entry.type === 'income' ? '収入' : '支出';
  const heroAmt = document.getElementById('detail-hero-amount');
  heroAmt.className = 'detail-hero-amount ' + entry.type;
  heroAmt.textContent = fmtSigned(entry.amount);

  const rows = [
    { icon:'📅',     label:'日付',     value:fmtDateFull(entry.date), cls:'' },
    { icon:cat.icon, label:'カテゴリ', value:cat.label, cls:'' },
    { icon:'📌',     label:'内容',     value:entry.title, cls:'' },
  ];
  if (entry.tournament) rows.push({ icon:'⛳', label:'大会', value:entry.tournament, cls:'tournament-val' });

  document.getElementById('detail-info-list').innerHTML = rows.map(r=>`
    <div class="detail-info-row">
      <div class="detail-info-icon">${r.icon}</div>
      <div class="detail-info-right">
        <div class="detail-info-label">${r.label}</div>
        <div class="detail-info-value ${r.cls}">${r.value}</div>
      </div>
    </div>`).join('');

  const memoWrap = document.getElementById('detail-memo-wrap');
  if (entry.memo) { document.getElementById('detail-memo-text').textContent = entry.memo; memoWrap.style.display=''; }
  else { memoWrap.style.display='none'; }

  detailOverlay.setAttribute('aria-hidden','false');
  detailSheet.setAttribute('aria-hidden','false');
  detailOverlay.classList.add('open');
  detailSheet.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDetailSheet() {
  detailOverlay.setAttribute('aria-hidden','true');
  detailSheet.setAttribute('aria-hidden','true');
  detailOverlay.classList.remove('open');
  detailSheet.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('detail-close-btn').addEventListener('click', closeDetailSheet);
detailOverlay.addEventListener('click', closeDetailSheet);

/* ================================================================
   トースト
   ================================================================ */
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.classList.remove('show'); toastTimer = null; }, 2400);
}

/* ================================================================
   仮ナビ
   ================================================================ */
document.getElementById('btn-all-tournaments')?.addEventListener('click', () => showToast('🏌️ 大会一覧は準備中です'));
document.getElementById('btn-report-all')?.addEventListener('click', () => showToast('📊 レポート詳細は準備中です'));
document.querySelectorAll('.tab-item').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.page === 'finance') return;
    showToast(`📌 ${btn.getAttribute('aria-label')} は準備中です`);
  });
});
document.getElementById('tab-p-logo')?.addEventListener('click', () => showToast('✨ 注目ページは準備中です'));

/* ================================================================
   レポートセクション（STEP 4）
   ================================================================ */

/* ── 年間レポートダミーデータ ── */
const YEARLY_REPORT = {
  year: 2025,
  income:  2840000,
  expense:  892000,
  tournaments: 8,
};

/* 月別ダミー（収入・支出 各6ヶ月） */
const MONTHLY_BARS_DATA = [
  { label:'1月', income:320000, expense:148000 },
  { label:'2月', income:180000, expense:212000 },
  { label:'3月', income:460000, expense:180000 },
  { label:'4月', income:630000, expense:220000 },
  { label:'5月', income:248000, expense:280000 },
  { label:'6月', income:460000, expense:148000 },
];

/* 大会別収支（LEDGER_ENTRIESから算出 + ダミー補完） */
const TOURNAMENT_REPORTS = [
  {
    id: 'tr1', tag: 'ACNツアー',  name: 'ACNツアー 第6戦 ABCカップ',
    date: '2025年6月14日〜16日',
    income: 280000, expense: 139200,
  },
  {
    id: 'tr2', tag: 'JAPAN PRO', name: 'JAPAN PRO QT ファイナル',
    date: '2025年5月22日〜25日',
    income: 80000,  expense: 112300,
  },
  {
    id: 'tr3', tag: 'ACNツアー',  name: 'ACNツアー 第4戦 XYZオープン',
    date: '2025年4月10日〜12日',
    income: 350000, expense: 114000,
  },
  {
    id: 'tr4', tag: '県オープン', name: '県オープン選手権',
    date: '2025年3月8日〜9日',
    income: 120000, expense:  68000,
  },
];

/* 出力・確定申告カード定義 */
const EXPORT_CARDS = [
  { icon:'📄', name:'年間レポート',   desc:'収支サマリーを確認',   primary:false, toast:'📄 年間レポートは準備中です' },
  { icon:'🥧', name:'経費割合',       desc:'カテゴリ別経費を確認', primary:false, toast:'🥧 経費割合詳細は準備中です' },
  { icon:'📑', name:'PDF出力',        desc:'確定申告用に書き出す', primary:true,  toast:'📑 PDF出力は準備中です' },
  { icon:'📊', name:'CSV出力',        desc:'データを書き出す',     primary:true,  toast:'📊 CSV出力は準備中です' },
];

/* ── 年間レポートカード ── */
function renderYearlyReport() {
  const { year, income, expense, tournaments } = YEARLY_REPORT;
  const profit = income - expense;
  const rate   = Math.round((profit / income) * 100);

  document.getElementById('yc-period').textContent  = `${year}年`;
  document.getElementById('yc-profit').textContent  = fmtSigned(profit);
  document.getElementById('yc-income').textContent  = fmtPlain(income);
  document.getElementById('yc-expense').textContent = fmtPlain(expense);
  document.getElementById('yc-tournaments').textContent = `${tournaments}試合`;
  document.getElementById('yc-rate-badge').textContent  = `利益率 ${rate}%`;

  renderMonthlyBars();
}

/* ── 月別棒グラフ（年間カード内） ── */
function renderMonthlyBars() {
  const barsEl   = document.getElementById('monthly-bars');
  const labelsEl = document.getElementById('monthly-bars-labels');
  if (!barsEl || !labelsEl) return;

  const maxVal = Math.max(...MONTHLY_BARS_DATA.map(d => Math.max(d.income, d.expense)));

  barsEl.innerHTML = '';
  labelsEl.innerHTML = '';

  MONTHLY_BARS_DATA.forEach(d => {
    const incH  = Math.max(3, Math.round((d.income  / maxVal) * 50));
    const expH  = Math.max(3, Math.round((d.expense / maxVal) * 50));
    const group = document.createElement('div');
    group.className = 'f-mb-bar-group';
    group.innerHTML = `
      <div class="f-mb-bar income"  style="height:${incH}px"></div>
      <div class="f-mb-bar expense" style="height:${expH}px"></div>`;
    barsEl.appendChild(group);

    const lbl = document.createElement('div');
    lbl.className = 'f-mb-label';
    lbl.textContent = d.label;
    labelsEl.appendChild(lbl);
  });
}

/* ── 月別収支ミニ棒グラフ（レポートカード内） ── */
function renderMonthlyMiniChart() {
  const el = document.getElementById('rc-monthly-chart');
  if (!el) return;

  const profits = MONTHLY_BARS_DATA.map(d => d.income - d.expense);
  const maxAbs  = Math.max(...profits.map(Math.abs));

  const wrap = document.createElement('div');
  wrap.className = 'f-rc-mini-bars';

  profits.forEach(p => {
    const h   = Math.max(4, Math.round((Math.abs(p) / maxAbs) * 42));
    const bar = document.createElement('div');
    bar.className = `f-rc-mini-bar ${p >= 0 ? 'pos' : 'neg'}`;
    bar.style.height = h + 'px';
    wrap.appendChild(bar);
  });
  el.appendChild(wrap);
}

/* ── 経費割合ドーナツ（SVG） ── */
function renderExpenseRatio() {
  const wrap = document.getElementById('rc-donut-wrap');
  if (!wrap) return;

  const items = CAT_DATA.month.slice(0, 4); // 上位4カテゴリ
  const total = items.reduce((s, i) => s + i.amount, 0);

  /* カラーパレット */
  const COLORS = ['#1A5C38','#2E86AB','#E74C3C','#E67E22'];

  /* SVG ドーナツ */
  const SIZE = 80, CX = 40, CY = 40, R = 30, STROKE = 14;
  const circumference = 2 * Math.PI * R;
  let offset = 0;

  let paths = '';
  items.forEach((item, i) => {
    const pct  = item.amount / total;
    const dash = pct * circumference;
    const gap  = circumference - dash;
    paths += `<circle cx="${CX}" cy="${CY}" r="${R}"
      fill="none" stroke="${COLORS[i]}" stroke-width="${STROKE}"
      stroke-dasharray="${dash.toFixed(2)} ${gap.toFixed(2)}"
      stroke-dashoffset="${(-offset).toFixed(2)}"
      stroke-linecap="butt"
      transform="rotate(-90 ${CX} ${CY})"/>`;
    offset += dash;
  });

  const svg = `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="none"
      stroke="var(--bg-primary)" stroke-width="${STROKE}"/>
    ${paths}
  </svg>`;

  /* 凡例 */
  const legendItems = items.map((item, i) => {
    const cat = CATEGORIES[item.key] || { label: item.key };
    const pct = Math.round((item.amount / total) * 100);
    return `<div class="f-rc-legend-row">
      <div class="f-rc-legend-dot" style="background:${COLORS[i]}"></div>
      <span class="f-rc-legend-label">${cat.label}</span>
      <span class="f-rc-legend-pct">${pct}%</span>
    </div>`;
  }).join('');

  wrap.innerHTML = `${svg}<div class="f-rc-donut-legend">${legendItems}</div>`;
}

/* ── 大会別収支リスト ── */
function renderTournamentReports() {
  const container = document.getElementById('tournament-report-list');
  if (!container) return;
  container.innerHTML = '';

  const maxIncome = Math.max(...TOURNAMENT_REPORTS.map(t => t.income));

  TOURNAMENT_REPORTS.forEach((t, idx) => {
    const profit   = t.income - t.expense;
    const isProfit = profit >= 0;
    const barPct   = Math.min(100, Math.round((Math.abs(profit) / t.income) * 100));

    const card = document.createElement('div');
    card.className = 'f-tr-card';
    card.style.animationDelay = `${idx * 0.06}s`;
    card.innerHTML = `
      <div class="f-tr-top-bar ${isProfit ? 'profit' : 'loss'}"></div>
      <div class="f-tr-body">
        <div class="f-tr-header">
          <div class="f-tr-left">
            <span class="f-tr-tag">${t.tag}</span>
            <div class="f-tr-name">${t.name}</div>
            <div class="f-tr-date">${t.date}</div>
          </div>
          <span class="f-tr-profit-badge ${isProfit ? 'profit' : 'loss'}">${fmtSigned(profit)}</span>
        </div>
        <div class="f-tr-stats">
          <div class="f-tr-stat">
            <span class="f-tr-stat-label">収入</span>
            <span class="f-tr-stat-val income">${fmtPlain(t.income)}</span>
          </div>
          <div class="f-tr-stat-sep"></div>
          <div class="f-tr-stat">
            <span class="f-tr-stat-label">支出</span>
            <span class="f-tr-stat-val expense">${fmtPlain(t.expense)}</span>
          </div>
          <div class="f-tr-stat-sep"></div>
          <div class="f-tr-stat">
            <span class="f-tr-stat-label">利益率</span>
            <span class="f-tr-stat-val ${isProfit ? 'income' : 'expense'}">${Math.round((profit/t.income)*100)}%</span>
          </div>
        </div>
        <div class="f-tr-profit-bar-wrap">
          <div class="f-tr-profit-bar-track">
            <div class="f-tr-profit-bar-fill ${isProfit ? 'profit' : 'loss'}" style="width:${barPct}%"></div>
          </div>
          <div class="f-tr-profit-bar-meta">
            <span class="f-tr-profit-bar-lbl">${isProfit ? '黒字' : '赤字'}</span>
            <span class="f-tr-profit-bar-lbl">${isProfit ? '+' : ''}${Math.round((profit/t.income)*100)}%</span>
          </div>
        </div>
      </div>`;
    container.appendChild(card);
  });
}

/* ── 出力・確定申告カード ── */
function renderExportCards() {
  const grid = document.getElementById('export-grid');
  if (!grid) return;
  grid.innerHTML = '';

  EXPORT_CARDS.forEach(card => {
    const el = document.createElement('button');
    el.className = 'f-export-card' + (card.primary ? ' primary' : '');
    el.type = 'button';
    el.dataset.toast = card.toast;
    el.innerHTML = `
      <span class="f-export-badge">準備中</span>
      <div class="f-export-icon">${card.icon}</div>
      <div class="f-export-name">${card.name}</div>
      <div class="f-export-desc">${card.desc}</div>`;
    grid.appendChild(el);
  });

  grid.addEventListener('click', e => {
    const card = e.target.closest('.f-export-card');
    if (card) showToast(card.dataset.toast);
  });
}

/* ── レポートまとめて初期化 ── */
function renderReports() {
  renderYearlyReport();
  renderMonthlyMiniChart();
  renderExpenseRatio();
  renderTournamentReports();
  renderExportCards();
}

/* ================================================================
   初期化
   ================================================================ */
function init() {
  renderSummary();
  renderQuickCards();
  renderTournaments();
  renderReports();
  renderLedger();
}

document.addEventListener('DOMContentLoaded', init);
