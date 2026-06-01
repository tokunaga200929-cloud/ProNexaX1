/* =========================================================================
   ProNexaX 「遠征」機能  expedition.js
   - 単体モジュールとして動作
   - 本体統合時は initExpeditionPage(rootElement, data, options) を呼び出す
   - localStorage 保存は Firestore へ置き換えやすい構造
   ========================================================================= */
(function () {
  'use strict';

  var S = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  var ICONS = {
    menu: '<svg viewBox="0 0 24 24" ' + S + '><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" ' + S + '><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M13.5 7.5l3 3"/></svg>',
    bell: '<svg viewBox="0 0 24 24" ' + S + '><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>',
    flag: '<svg viewBox="0 0 24 24" ' + S + '><path d="M6 21V4M6 4.5a6 6 0 0 1 5 .4l.4.2a5 5 0 0 0 4.5.2l.6-.3a1 1 0 0 1 1.4.9V14a1 1 0 0 1-.6.9l-.9.4a5 5 0 0 1-4.7-.3l-.7-.4a4 4 0 0 0-2.9-.5L6 14.3"/></svg>',
    calendarCheck: '<svg viewBox="0 0 24 24" ' + S + '><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3M8.5 15l2 2 4.5-5"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" ' + S + '><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3"/></svg>',
    pin: '<svg viewBox="0 0 24 24" ' + S + '><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    checkCircle: '<svg viewBox="0 0 24 24" ' + S + '><circle cx="12" cy="12" r="9"/><path d="M8.5 12.2l2.2 2.2 4.8-5"/></svg>',
    check: '<svg viewBox="0 0 24 24" ' + S + '><path d="M5 12.5l4 4L19 7"/></svg>',
    plane: '<svg viewBox="0 0 24 24" ' + S + '><path d="M3 11.5l18-7-7 18-3-8-8-3z"/><path d="M14 4.5l-4.5 10"/></svg>',
    car: '<svg viewBox="0 0 24 24" ' + S + '><path d="M5 14l1.5-5A2 2 0 0 1 8.4 7.5h7.2A2 2 0 0 1 17.5 9l1.5 5"/><rect x="3.5" y="13" width="17" height="5" rx="2"/><path d="M6.5 18v1.5M17.5 18v1.5M7 15.5h.1M17 15.5h.1"/></svg>',
    fuel: '<svg viewBox="0 0 24 24" ' + S + '><path d="M5 20V5a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 15 5v15"/><path d="M5 10h10M15 7h2l2 2v8a2 2 0 0 0 2 2M19 9v3h-2"/><path d="M4 20h12"/></svg>',
    building: '<svg viewBox="0 0 24 24" ' + S + '><path d="M4 20h16M6 20V5a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 18 5v15"/><path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/></svg>',
    clipboard: '<svg viewBox="0 0 24 24" ' + S + '><rect x="5" y="4.5" width="14" height="16" rx="2"/><path d="M9 4.5A3 3 0 0 1 12 2a3 3 0 0 1 3 2.5v1H9v-1z"/><path d="M8.5 13l2 2 4.5-5"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" ' + S + '><path d="M4 7.5h15a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 17.5v-12A1.5 1.5 0 0 1 4.5 4H17"/><path d="M17 13h4"/></svg>',
    memo: '<svg viewBox="0 0 24 24" ' + S + '><path d="M5 4.5h9.5L19 9v10a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19V6a1.5 1.5 0 0 1 1.5-1.5z"/><path d="M13.5 4.5V9a1 1 0 0 0 1 1h4.3"/><path d="M8 13.5h5M8 16.5h7"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" ' + S + '><path d="M9 5l7 7-7 7"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" ' + S + '><path d="M7 4.5h10V9a5 5 0 0 1-10 0V4.5z"/><path d="M7 6H4.5A1.5 1.5 0 0 0 3 7.5C3 9.5 4.5 11 6.8 11M17 6h2.5A1.5 1.5 0 0 1 21 7.5C21 9.5 19.5 11 17.2 11"/><path d="M12 14v3M9 20.5h6"/></svg>',
    map: '<svg viewBox="0 0 24 24" ' + S + '><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    receiptAdd: '<svg viewBox="0 0 24 24" ' + S + '><path d="M6 3.5h8l4 4V20l-2-1.2L13.8 20 12 18.8 10.2 20 8.3 18.8 6 20V3.5z"/><path d="M13.5 3.5V8h4.3"/><path d="M9 12h4M9 15h2.5"/></svg>',
    tabCalendar: '<svg viewBox="0 0 24 24" ' + S + '><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3"/></svg>',
    tabFlag: '<svg viewBox="0 0 24 24" ' + S + '><path d="M6 21V4M6 4.5a6 6 0 0 1 5 .4l.4.2a5 5 0 0 0 4.5.2l.6-.3a1 1 0 0 1 1.4.9V14a1 1 0 0 1-.6.9l-.9.4a5 5 0 0 1-4.7-.3l-.7-.4a4 4 0 0 0-2.9-.5L6 14.3"/></svg>',
    tabBag: '<svg viewBox="0 0 24 24" ' + S + '><rect x="3.5" y="8" width="17" height="12" rx="2.5"/><path d="M8.5 8V6.5A2.5 2.5 0 0 1 11 4h2a2.5 2.5 0 0 1 2.5 2.5V8M3.5 12.5h17"/></svg>',
    tabUser: '<svg viewBox="0 0 24 24" ' + S + '><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6"/></svg>'
  };

  var defaultExpeditionData = {
    tournamentId: 'chugoku-open-2026',
    tournamentName: '中四国オープンゴルフ選手権',
    venue: '広島カンツリー倶楽部 八本松コース',
    startDate: '2026-06-05',
    endDate: '2026-06-06',
    dateRange: '2026/06/05 - 2026/06/06',
    linkedCalendar: true,
    links: { officialUrl: '', pairingsUrl: '', resultUrl: '', leaderboardUrl: '' },
    travel: [
      { id: 'flight', type: '飛行機', icon: 'plane', main: '羽田 → 広島', sub: '06/04 07:25 発', amount: 0, from: '羽田', to: '広島', departure: '06/04 07:25 発' },
      { id: 'highway', type: '高速代', icon: 'car', main: '¥3,200', sub: 'ETC', amount: 3200, memo: 'ETC' },
      { id: 'gasoline', type: 'ガソリン代', icon: 'fuel', main: '¥2,800', sub: '06/03 満タン', amount: 2800, memo: '06/03 満タン' }
    ],
    hotel: {
      name: '東広島カンツリーホテル',
      checkIn: '06/04',
      checkOut: '06/06',
      reservationNumber: 'HT12345678',
      status: '予約済み',
      amount: 18000
    },
    checklist: [
      { id: 'entry', label: 'エントリー確認', checked: true },
      { id: 'practice', label: '練習ラウンド', checked: true },
      { id: 'insurance', label: '保険証', checked: true },
      { id: 'receipt', label: '領収書', checked: false },
      { id: 'clothes', label: '着替え', checked: false }
    ],
    expenses: [
      { id: 'entryFee', label: 'エントリー費', amount: 20000 },
      { id: 'hotelFee', label: '宿泊費', amount: 18000 },
      { id: 'transportation', label: '交通費', amount: 12600 },
      { id: 'foodFee', label: '食費', amount: 0 },
      { id: 'practiceFee', label: '練習費', amount: 0 },
      { id: 'other', label: 'その他', amount: 0, memo: '' }
    ],
    receipts: [],
    memo: '前日練習 13:00 / 受付 7:30 / 朝食 6:30'
  };

  var STORAGE_ACTIVE_KEY = 'pnx-expedition-active-tournament';
  var STORAGE_INDEX_KEY = 'pnx-expedition-index';

  function clone(obj) { return JSON.parse(JSON.stringify(obj || {})); }
  function yen(n) { return '¥' + Number(n || 0).toLocaleString('ja-JP'); }
  function parseAmount(v) { return Math.max(0, Number(String(v || '').replace(/[¥,\s]/g, '')) || 0); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>'"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c];
    });
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function findById(arr, id) { return (arr || []).find(function (x) { return x.id === id; }); }
  function storageKey(d) { return 'pnx-expedition-' + (d && d.tournamentId ? d.tournamentId : 'default'); }
  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) { return fallback; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (err) { console.warn('[expedition] localStorage write failed', key, err); return false; }
  }
  function readIndex() {
    var list = readJson(STORAGE_INDEX_KEY, []);
    return Array.isArray(list) ? list : [];
  }
  function writeIndex(list) { writeJson(STORAGE_INDEX_KEY, list); }
  function upsertIndex(d) {
    if (!d || !d.tournamentId) return;
    var now = new Date().toISOString();
    var list = readIndex().filter(function (item) { return item && item.tournamentId !== d.tournamentId; });
    list.unshift({
      tournamentId: d.tournamentId,
      tournamentName: d.tournamentName || '大会予定',
      venue: d.venue || '',
      dateRange: d.dateRange || '',
      updatedAt: now,
      storageKey: storageKey(d)
    });
    writeIndex(list.slice(0, 50));
  }
  function setActiveTournament(d) {
    if (!d) return;
    writeJson(STORAGE_ACTIVE_KEY, d);
  }
  function cardHead(iconName, title) {
    return '<div class="exp-cardhead__icon">' + ICONS[iconName] + '</div>' +
      '<div class="exp-cardhead__title">' + esc(title) + '</div>' +
      '<span class="exp-cardhead__chev">' + ICONS.chevron + '</span>';
  }
  function normalizeData(d) {
    var def = clone(defaultExpeditionData);
    var travelIds = ['flight', 'highway', 'gasoline'];
    d.travel = (d.travel || []).map(function (item, idx) {
      var base = def.travel[idx] || {};
      return Object.assign(base, item, { id: item.id || travelIds[idx] || ('travel' + idx) });
    });
    travelIds.forEach(function (id, idx) { if (!findById(d.travel, id) && def.travel[idx]) d.travel.splice(idx, 0, def.travel[idx]); });

    var expenseDefs = [
      { id: 'entryFee', label: 'エントリー費' },
      { id: 'hotelFee', label: '宿泊費' },
      { id: 'transportation', label: '交通費' },
      { id: 'foodFee', label: '食費' },
      { id: 'practiceFee', label: '練習費' },
      { id: 'other', label: 'その他' }
    ];
    d.expenses = (d.expenses || []).map(function (item, idx) {
      var base = def.expenses[idx] || {};
      return Object.assign(base, item, { id: item.id || (expenseDefs[idx] && expenseDefs[idx].id) || ('expense' + idx) });
    });
    expenseDefs.forEach(function (row) {
      if (!findById(d.expenses, row.id)) {
        var base = findById(def.expenses, row.id) || { id: row.id, label: row.label, amount: 0 };
        d.expenses.push(base);
      }
    });
    d.receipts = Array.isArray(d.receipts) ? d.receipts.map(function (item, idx) {
      return Object.assign({
        id: item && item.id ? item.id : ('receipt-' + idx),
        date: '',
        category: 'その他',
        amount: 0,
        memo: '',
        imageName: ''
      }, item || {});
    }) : [];
    return d;
  }
  function getDefaultData(data) {
    var base = clone(defaultExpeditionData);
    var supplied = clone(data || {});
    return normalizeData(Object.assign(base, supplied, {
      links: Object.assign(base.links, supplied.links || {}),
      hotel: Object.assign(base.hotel, supplied.hotel || {}),
      travel: supplied.travel || base.travel,
      checklist: supplied.checklist || base.checklist,
      expenses: supplied.expenses || base.expenses,
      receipts: supplied.receipts || base.receipts
    }));
  }
  function mergeStoredData(baseData, storedData) {
    var base = getDefaultData(baseData || defaultExpeditionData);
    var stored = storedData || {};
    var merged = getDefaultData(Object.assign({}, base, stored, {
      links: Object.assign({}, base.links || {}, stored.links || {}),
      hotel: Object.assign({}, base.hotel || {}, stored.hotel || {}),
      travel: stored.travel || base.travel,
      checklist: stored.checklist || base.checklist,
      expenses: stored.expenses || base.expenses,
      receipts: stored.receipts || base.receipts
    }));

    // カレンダー/試合検索から渡された大会情報は最新情報として優先する。
    // 遠征入力（ホテル・移動・費用・メモ）は保存済みを優先する。
    ['tournamentId', 'tournamentName', 'venue', 'startDate', 'endDate', 'dateRange', 'linkedCalendar'].forEach(function (key) {
      if (base[key] !== undefined && base[key] !== null && String(base[key]) !== '') merged[key] = base[key];
    });
    merged.links = Object.assign({}, stored.links || {}, base.links || {});
    return normalizeData(merged);
  }
  function loadData(data) {
    var d = getDefaultData(data);
    var stored = readJson(storageKey(d), null);
    if (stored) d = mergeStoredData(d, stored);
    return d;
  }
  function saveData(d) {
    var normalized = getDefaultData(d || defaultExpeditionData);
    writeJson(storageKey(normalized), normalized);
    setActiveTournament(normalized);
    upsertIndex(normalized);
  }
  function resetData(d) {
    try { localStorage.removeItem(storageKey(d)); } catch (err) {}
    if (d && d.tournamentId) {
      var list = readIndex().filter(function (item) { return item && item.tournamentId !== d.tournamentId; });
      writeIndex(list);
    }
  }
  function syncExpense(d, id, amount) {
    var row = findById(d.expenses, id);
    if (row) row.amount = amount;
  }
  function categoryToExpenseId(category) {
    if (category === '宿泊費') return 'hotelFee';
    if (category === '交通費') return 'transportation';
    if (category === '食費') return 'foodFee';
    if (category === '練習費') return 'practiceFee';
    return 'other';
  }
  function addReceiptToExpenses(d, receipt) {
    var expenseId = categoryToExpenseId(receipt.category);
    var row = findById(d.expenses, expenseId);
    if (!row) return;
    row.amount = Number(row.amount || 0) + Number(receipt.amount || 0);
    if (expenseId === 'other' && receipt.memo) {
      row.memo = row.memo ? (row.memo + ' / ' + receipt.memo) : receipt.memo;
    }
    if (expenseId === 'hotelFee') d.hotel.amount = Number(findById(d.expenses, 'hotelFee').amount || d.hotel.amount || 0);
  }
  function applyReceiptDelta(d, receipt, sign) {
    if (!receipt) return;
    var expenseId = categoryToExpenseId(receipt.category);
    var row = findById(d.expenses, expenseId);
    if (!row) return;
    var next = Number(row.amount || 0) + (Number(sign || 1) * Number(receipt.amount || 0));
    row.amount = Math.max(0, next);
    if (expenseId === 'hotelFee') d.hotel.amount = Number(row.amount || 0);
  }
  function receiptTotal(d) {
    return (d.receipts || []).reduce(function(sum, item){ return sum + Number(item.amount || 0); }, 0);
  }
  function findReceipt(d, receiptId) {
    return (d.receipts || []).find(function(item){ return item && item.id === receiptId; });
  }
  function formatReceiptDate(value) {
    if (!value) return '';
    var s = String(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      var p = s.split('-');
      return p[0] + '/' + p[1] + '/' + p[2];
    }
    return s;
  }
  function receiptCategoryOptions(selected) {
    var cats = ['交通費', '宿泊費', '食費', '練習費', 'その他'];
    return cats.map(function(cat){ return '<option value="' + esc(cat) + '"' + (cat === selected ? ' selected' : '') + '>' + esc(cat) + '</option>'; }).join('');
  }
  function expenseCategoryRows(d) {
    var order = [
      { id: 'entryFee', label: 'エントリー費', icon: 'flag' },
      { id: 'hotelFee', label: '宿泊費', icon: 'building' },
      { id: 'transportation', label: '交通費', icon: 'car' },
      { id: 'foodFee', label: '食費', icon: 'wallet' },
      { id: 'practiceFee', label: '練習費', icon: 'trophy' },
      { id: 'other', label: 'その他', icon: 'memo' }
    ];
    return order.map(function(row){
      var found = findById(d.expenses || [], row.id);
      return Object.assign({}, row, { amount: Number(found && found.amount || 0), memo: found && found.memo || '' });
    });
  }
  function expenseTotal(d) {
    return (d.expenses || []).reduce(function(s, e){ return s + Number(e.amount || 0); }, 0);
  }

  function renderHeader() {
    var h = el('header', 'exp-header');
    h.innerHTML = '<div class="exp-header__bar">' +
      '<button class="exp-iconbtn exp-iconbtn--menu" aria-label="メニュー" data-action="menu">' + ICONS.menu + '</button>' +
      '<div class="exp-header__title">遠征</div>' +
      '<div class="exp-header__right">' +
      '<button class="exp-iconbtn" aria-label="初期データに戻す" data-action="reset-data" title="初期データに戻す">' + ICONS.pencil + '</button>' +
      '<button class="exp-iconbtn" aria-label="通知" data-action="notify"><span class="exp-dot"></span>' + ICONS.bell + '</button>' +
      '</div></div>';
    return h;
  }

  function renderMatch(d) {
    var c = el('section', 'exp-card exp-match');
    c.innerHTML = '<div class="exp-match__link">' + ICONS.flag + 'カレンダーの試合と連携中</div>' +
      '<div class="exp-match__cal">' + ICONS.calendarCheck + '</div>' +
      '<h1 class="exp-match__name">' + esc(d.tournamentName) + '</h1>' +
      '<div class="exp-match__row">' + ICONS.pin + '<span>' + esc(d.venue) + '</span></div>' +
      '<div class="exp-match__row">' + ICONS.calendar + '<span>' + esc(d.dateRange) + '</span></div>' +
      '<div class="exp-match__footer"><span class="exp-chip">' + ICONS.checkCircle + 'カレンダー連携中</span>' +
      '<button class="exp-btn-primary" data-action="match-detail">試合詳細を見る</button></div>';
    return c;
  }
  function renderTravel(d) {
    var c = el('section', 'exp-card exp-editable-section', '');
    var items = d.travel.map(function (t) {
      return '<button class="exp-travel__item" data-action="open-travel" type="button">' +
        '<div class="exp-travel__ic">' + (ICONS[t.icon] || ICONS.car) + '</div><div>' +
        '<div class="exp-travel__label">' + esc(t.type) + '</div>' +
        '<div class="exp-travel__main">' + esc(t.main) + '</div>' +
        '<div class="exp-travel__sub">' + esc(t.sub) + '</div></div></button>';
    }).join('');
    c.innerHTML = '<button class="exp-cardhead" data-action="open-travel" type="button">' + cardHead('car', '移動') + '</button>' +
      '<div class="exp-travel">' + items + '</div>';
    return c;
  }
  function renderHotel(d) {
    var h = d.hotel;
    var c = el('section', 'exp-card exp-editable-section');
    c.innerHTML = '<button class="exp-cardhead" data-action="open-hotel" type="button">' + cardHead('building', 'ホテル') + '</button>' +
      '<div class="exp-hotel__body" data-action="open-hotel">' +
      '<div class="exp-hotel__name">' + esc(h.name) + '</div>' +
      '<div class="exp-hotel__meta"><span>チェックイン ' + esc(h.checkIn) + '</span><span>チェックアウト ' + esc(h.checkOut) + '</span></div>' +
      '<div class="exp-hotel__resv">予約番号：' + esc(h.reservationNumber) + '</div>' +
      '<span class="exp-status">' + esc(h.status) + '</span></div>';
    return c;
  }
  function renderChecklist(d, onToggle) {
    var c = el('section', 'exp-card');
    var grid = el('div', 'exp-checks');
    d.checklist.forEach(function (item) {
      var row = el('button', 'exp-check' + (item.checked ? ' is-checked' : ''));
      row.type = 'button';
      row.setAttribute('data-check-id', item.id);
      row.setAttribute('role', 'checkbox');
      row.setAttribute('aria-checked', item.checked ? 'true' : 'false');
      row.innerHTML = '<span class="exp-check__box">' + ICONS.check + '</span><span class="exp-check__label">' + esc(item.label) + '</span>';
      row.addEventListener('click', function () {
        item.checked = !item.checked;
        row.classList.toggle('is-checked', item.checked);
        row.setAttribute('aria-checked', item.checked ? 'true' : 'false');
        onToggle();
      });
      grid.appendChild(row);
    });
    c.innerHTML = '<button class="exp-cardhead" data-action="open-checklist" type="button">' + cardHead('clipboard', '持ち物・チェック') + '</button>';
    c.appendChild(grid);
    return c;
  }
  function renderCost(d) {
    var rowsAll = expenseCategoryRows(d);
    var total = expenseTotal(d);
    var visible = rowsAll.filter(function(row){ return Number(row.amount || 0) > 0; });
    if (!visible.length) visible = rowsAll.slice(0, 3);
    var rows = visible.map(function (row) {
      var pct = total > 0 ? Math.max(4, Math.round((Number(row.amount || 0) / total) * 100)) : 0;
      return '<button class="exp-cost-cat" type="button" data-action="open-cost">' +
        '<span class="exp-cost-cat__ic">' + (ICONS[row.icon] || ICONS.wallet) + '</span>' +
        '<span class="exp-cost-cat__body"><span class="exp-cost-cat__top"><strong>' + esc(row.label) + '</strong><em>' + yen(row.amount) + '</em></span>' +
        '<span class="exp-cost-cat__bar"><i style="width:' + pct + '%"></i></span></span>' +
      '</button>';
    }).join('');
    var c = el('section', 'exp-card exp-editable-section exp-cost-card');
    c.innerHTML = '<button class="exp-cardhead" data-action="open-cost" type="button">' + cardHead('wallet', '遠征費用') + '</button>' +
      '<div class="exp-cost-overview" data-action="open-cost"><span>カテゴリ別サマリー</span><strong>' + yen(total) + '</strong></div>' +
      '<div class="exp-cost-cats">' + rows + '</div>' +
      '<div class="exp-cost__total" data-action="open-cost"><span class="exp-cost__total-label">合計</span><span class="exp-cost__total-value">' + yen(total) + '</span></div>';
    return c;
  }

  function renderReceipts(d) {
    var c = el('section', 'exp-card exp-editable-section exp-receipts-card');
    var receipts = (d.receipts || []);
    var shown = receipts.slice(0, 4);
    var body = '';
    if (!shown.length) {
      body = '<div class="exp-receipts__empty">まだ領収書はありません。下の「領収書追加」から登録できます。</div>';
    } else {
      body = '<div class="exp-receipts__list">' + shown.map(function(item){
        return '<button class="exp-receipt-row" type="button" data-action="open-receipt" data-receipt-id="' + esc(item.id) + '">' +
          '<div class="exp-receipt-row__ic">' + ICONS.receiptAdd + '</div>' +
          '<div class="exp-receipt-row__body"><strong>' + esc(item.category || 'その他') + '</strong><em>' + esc(formatReceiptDate(item.date) || '日付未設定') + (item.memo ? ' ・ ' + esc(item.memo) : '') + (item.imageName ? ' ・ 画像あり' : '') + '</em></div>' +
          '<div class="exp-receipt-row__amount">' + yen(item.amount) + '</div>' +
          '<span class="exp-receipt-row__chev">' + ICONS.chevron + '</span>' +
        '</button>';
      }).join('') + '</div>';
      if (receipts.length > shown.length) {
        body += '<div class="exp-receipts__more">ほか ' + (receipts.length - shown.length) + ' 件</div>';
      }
    }
    c.innerHTML = '<div class="exp-receipts__head">' +
      '<button class="exp-cardhead" data-action="add-receipt" type="button">' + cardHead('receiptAdd', '領収書') + '</button>' +
      '<div class="exp-receipts__summary"><strong>' + receipts.length + '件</strong><span>' + yen(receiptTotal(d)) + '</span></div>' +
      '<button class="exp-receipts__add" type="button" data-action="add-receipt">追加</button>' +
      '</div>' + body;
    return c;
  }

  function renderMemo(d) {
    var c = el('section', 'exp-card exp-editable-section');
    c.innerHTML = '<button class="exp-cardhead" data-action="open-memo" type="button">' + cardHead('memo', 'メモ') + '</button>' +
      '<p class="exp-memo__text" data-action="open-memo">' + esc(d.memo) + '</p>';
    return c;
  }
  function renderQuick() {
    var actions = [
      { label: '結果を見る', icon: 'trophy', action: 'result' },
      { label: 'ホテル確認', icon: 'building', action: 'hotel-check' },
      { label: '地図', icon: 'map', action: 'map' },
      { label: '領収書追加', icon: 'receiptAdd', action: 'add-receipt' }
    ];
    var c = el('section', 'exp-quick');
    c.innerHTML = actions.map(function (a) {
      return '<button class="exp-quick__btn" data-action="' + a.action + '" type="button"><span class="exp-quick__ic">' + ICONS[a.icon] + '</span><span class="exp-quick__label">' + esc(a.label) + '</span></button>';
    }).join('');
    return c;
  }
  function renderTabbar() {
    var nav = el('nav', 'expedition-bottom-nav');
    nav.setAttribute('aria-label', 'メインナビゲーション（単体表示用）');
    nav.innerHTML = '<div class="expedition-bottom-nav__row">' +
      '<button class="exp-tab" data-tab="calendar" type="button">' + ICONS.tabCalendar + '<span>カレンダー</span></button>' +
      '<button class="exp-tab" data-tab="matches" type="button">' + ICONS.tabFlag + '<span>試合</span></button>' +
      '<button class="exp-tab exp-tab--center" data-tab="add" type="button"><span class="exp-tab__p">P</span></button>' +
      '<button class="exp-tab is-active" data-tab="expedition" type="button">' + ICONS.tabBag + '<span>遠征</span></button>' +
      '<button class="exp-tab" data-tab="mypage" type="button">' + ICONS.tabUser + '<span>マイページ</span></button>' +
      '</div>';
    return nav;
  }

  function field(label, name, value, type) {
    return '<label class="exp-form-field"><span>' + esc(label) + '</span><input name="' + esc(name) + '" type="' + esc(type || 'text') + '" value="' + esc(value) + '" /></label>';
  }
  function selectField(label, name, value) {
    return '<label class="exp-form-field"><span>' + esc(label) + '</span><select name="' + esc(name) + '">' +
      '<option value="予約済み"' + (value === '予約済み' ? ' selected' : '') + '>予約済み</option>' +
      '<option value="未予約"' + (value === '未予約' ? ' selected' : '') + '>未予約</option>' +
      '</select></label>';
  }
  function openSheet(root, title, bodyHTML, onSave, options) {
    options = options || {};
    closeSheet(root);
    var overlay = el('div', 'exp-sheet-overlay');
    overlay.innerHTML = '<div class="exp-sheet" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
      '<div class="exp-sheet__handle"></div>' +
      '<div class="exp-sheet__head"><button type="button" class="exp-sheet__cancel" data-sheet-cancel>キャンセル</button><h2>' + esc(title) + '</h2><button type="button" class="exp-sheet__save" data-sheet-save>保存</button></div>' +
      '<form class="exp-sheet__form">' + bodyHTML + (options.deleteLabel ? '<button type="button" class="exp-sheet__delete" data-sheet-delete>' + esc(options.deleteLabel) + '</button>' : '') + '</form>' +
      '</div>';
    root.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('is-open'); });
    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay || ev.target.closest('[data-sheet-cancel]')) closeSheet(root);
      if (ev.target.closest('[data-sheet-delete]')) {
        if (!options.confirmDelete || confirm(options.confirmDelete)) {
          if (typeof options.onDelete === 'function') options.onDelete();
          closeSheet(root);
        }
        return;
      }
      if (ev.target.closest('[data-sheet-save]')) {
        var form = overlay.querySelector('form');
        var fd = new FormData(form);
        var result = onSave(fd);
        if (result !== false) closeSheet(root);
      }
    });
    var first = overlay.querySelector('input:not([type="file"]), textarea, select');
    if (first) setTimeout(function () { first.focus(); }, 180);
  }
  function closeSheet(root) {
    var old = root.querySelector('.exp-sheet-overlay');
    if (old) old.remove();
  }
  function openReceiptSheet(root, d, receipt, rerender) {
    var isEdit = !!receipt;
    var current = receipt || { id: 'receipt-' + Date.now(), date: '', category: '交通費', amount: 0, memo: '', imageName: '' };
    openSheet(root, isEdit ? '領収書を編集' : '領収書を追加',
      '<div class="exp-receipt-sheet">' +
        '<label class="exp-receipt-upload exp-form-field--full">' +
          '<span class="exp-receipt-upload__label">領収書の写真を追加</span>' +
          '<input class="exp-receipt-upload__input" name="receiptImage" type="file" accept="image/*" />' +
          '<span class="exp-receipt-upload__box">' +
            '<span class="exp-receipt-upload__icon">' + ICONS.receiptAdd + '<span class="exp-receipt-upload__plus">+</span></span>' +
            '<strong>' + (current.imageName ? esc(current.imageName) : '領収書の写真を追加') + '</strong>' +
            '<em>カメラまたはライブラリから追加</em>' +
          '</span>' +
        '</label>' +
        '<div class="exp-form-grid exp-receipt-sheet__grid">' +
          '<label class="exp-form-field"><span>利用日</span><div class="exp-input-wrap exp-input-wrap--icon"><input name="receiptDate" type="date" value="' + esc(current.date || '') + '" /><span class="exp-input-trailing exp-input-trailing--icon">' + ICONS.calendar + '</span></div></label>' +
          '<label class="exp-form-field"><span>カテゴリ</span><div class="exp-input-wrap"><select name="receiptCategory">' + receiptCategoryOptions(current.category || '交通費') + '</select></div></label>' +
          '<label class="exp-form-field exp-form-field--full"><span>金額</span><div class="exp-input-wrap exp-input-wrap--amount"><span class="exp-input-leading">¥</span><input name="receiptAmount" type="number" value="' + esc(current.amount || '') + '" placeholder="金額を入力" /><span class="exp-input-trailing exp-input-trailing--value">' + yen(current.amount || 0) + '</span></div></label>' +
          '<label class="exp-form-field exp-form-field--full"><span>メモ</span><input name="receiptMemo" type="text" value="' + esc(current.memo || '') + '" placeholder="例：広島駅→会場 タクシー代" /></label>' +
          '<div class="exp-form-note exp-form-field--full exp-form-note--receipt"><span class="exp-form-note__icon">i</span><span>保存すると費用サマリーにも反映されます。交通費・宿泊費・食費・練習費は各カテゴリに、その他は「その他」に加算します。</span></div>' +
        '</div>' +
      '</div>', function (fd) {
        var file = fd.get('receiptImage');
        var next = {
          id: current.id || ('receipt-' + Date.now()),
          date: fd.get('receiptDate') || '',
          category: fd.get('receiptCategory') || 'その他',
          amount: parseAmount(fd.get('receiptAmount')),
          memo: fd.get('receiptMemo') || '',
          imageName: file && typeof file === 'object' && file.name ? file.name : (current.imageName || '')
        };
        if (!next.amount) {
          alert('金額を入力してください。');
          return false;
        }
        d.receipts = Array.isArray(d.receipts) ? d.receipts : [];
        if (isEdit) {
          applyReceiptDelta(d, current, -1);
          var idx = d.receipts.findIndex(function(item){ return item && item.id === current.id; });
          if (idx >= 0) d.receipts[idx] = next;
          else d.receipts.unshift(next);
        } else {
          d.receipts.unshift(next);
        }
        applyReceiptDelta(d, next, 1);
        saveData(d); rerender();
      }, isEdit ? {
        deleteLabel: 'この領収書を削除',
        confirmDelete: 'この領収書を削除しますか？費用サマリーからも差し引かれます。',
        onDelete: function () {
          applyReceiptDelta(d, current, -1);
          d.receipts = (d.receipts || []).filter(function(item){ return item && item.id !== current.id; });
          saveData(d); rerender();
        }
      } : {});
  }

  function handleAction(root, d, action, rerender, trigger) {
    if (action === 'open-travel') {
      var flight = findById(d.travel, 'flight') || d.travel[0];
      var highway = findById(d.travel, 'highway') || d.travel[1];
      var gas = findById(d.travel, 'gasoline') || d.travel[2];
      openSheet(root, '移動を編集',
        '<div class="exp-form-grid">' +
        field('飛行機：出発地', 'flightFrom', flight.from || '羽田') +
        field('飛行機：到着地', 'flightTo', flight.to || '広島') +
        field('飛行機：出発日時', 'flightDeparture', flight.departure || flight.sub || '') +
        field('高速代', 'highwayAmount', highway.amount || 0, 'number') +
        field('高速代メモ', 'highwayMemo', highway.memo || highway.sub || '') +
        field('ガソリン代', 'gasAmount', gas.amount || 0, 'number') +
        field('ガソリン代メモ', 'gasMemo', gas.memo || gas.sub || '') +
        '</div>', function (fd) {
          flight.from = fd.get('flightFrom'); flight.to = fd.get('flightTo'); flight.departure = fd.get('flightDeparture');
          flight.main = flight.from + ' → ' + flight.to; flight.sub = flight.departure;
          highway.amount = parseAmount(fd.get('highwayAmount')); highway.memo = fd.get('highwayMemo'); highway.main = yen(highway.amount); highway.sub = highway.memo;
          gas.amount = parseAmount(fd.get('gasAmount')); gas.memo = fd.get('gasMemo'); gas.main = yen(gas.amount); gas.sub = gas.memo;
          saveData(d); rerender();
        });
    } else if (action === 'open-hotel' || action === 'hotel-check') {
      openSheet(root, 'ホテルを編集',
        '<div class="exp-form-grid">' +
        field('ホテル名', 'name', d.hotel.name) +
        field('チェックイン日', 'checkIn', d.hotel.checkIn) +
        field('チェックアウト日', 'checkOut', d.hotel.checkOut) +
        field('予約番号', 'reservationNumber', d.hotel.reservationNumber) +
        field('宿泊費', 'amount', d.hotel.amount || 0, 'number') +
        selectField('ステータス', 'status', d.hotel.status) +
        '</div>', function (fd) {
          d.hotel.name = fd.get('name'); d.hotel.checkIn = fd.get('checkIn'); d.hotel.checkOut = fd.get('checkOut');
          d.hotel.reservationNumber = fd.get('reservationNumber'); d.hotel.amount = parseAmount(fd.get('amount')); d.hotel.status = fd.get('status');
          syncExpense(d, 'hotelFee', d.hotel.amount);
          saveData(d); rerender();
        });
    } else if (action === 'open-cost') {
      var entry = findById(d.expenses, 'entryFee') || { id: 'entryFee', label: 'エントリー費', amount: 0 };
      var hotel = findById(d.expenses, 'hotelFee') || { id: 'hotelFee', label: '宿泊費', amount: 0 };
      var transport = findById(d.expenses, 'transportation') || { id: 'transportation', label: '交通費', amount: 0 };
      var food = findById(d.expenses, 'foodFee') || { id: 'foodFee', label: '食費', amount: 0 };
      var practice = findById(d.expenses, 'practiceFee') || { id: 'practiceFee', label: '練習費', amount: 0 };
      var other = findById(d.expenses, 'other') || { id: 'other', label: 'その他', amount: 0, memo: '' };
      [entry, hotel, transport, food, practice, other].forEach(function(row){ if (!findById(d.expenses, row.id)) d.expenses.push(row); });
      openSheet(root, '費用を編集',
        '<div class="exp-form-grid">' +
        field('エントリー費', 'entryFee', entry.amount || 0, 'number') +
        field('宿泊費', 'hotelFee', hotel.amount || 0, 'number') +
        field('交通費', 'transportation', transport.amount || 0, 'number') +
        field('食費', 'foodFee', food.amount || 0, 'number') +
        field('練習費', 'practiceFee', practice.amount || 0, 'number') +
        field('その他費用', 'other', other.amount || 0, 'number') +
        field('その他メモ', 'otherMemo', other.memo || '') +
        '</div>', function (fd) {
          entry.amount = parseAmount(fd.get('entryFee')); hotel.amount = parseAmount(fd.get('hotelFee')); transport.amount = parseAmount(fd.get('transportation'));
          food.amount = parseAmount(fd.get('foodFee')); practice.amount = parseAmount(fd.get('practiceFee')); other.amount = parseAmount(fd.get('other')); other.memo = fd.get('otherMemo');
          d.hotel.amount = hotel.amount;
          saveData(d); rerender();
        });
    } else if (action === 'open-memo') {
      openSheet(root, 'メモを編集', '<label class="exp-form-field exp-form-field--full"><span>メモ本文</span><textarea name="memo" rows="4">' + esc(d.memo) + '</textarea></label>', function (fd) {
        d.memo = fd.get('memo'); saveData(d); rerender();
      });
    } else if (action === 'reset-data') {
      if (confirm('遠征情報を初期データに戻しますか？')) { resetData(d); d = loadData(defaultExpeditionData); rerender(d); }
    } else if (action === 'match-detail') {
      var official = d.links && d.links.officialUrl;
      if (official) window.open(official, '_blank', 'noopener,noreferrer');
      else alert('この大会の公式URLはまだ登録されていません。');
    } else if (action === 'result') {
      var resultUrl = d.links && (d.links.resultUrl || d.links.leaderboardUrl || d.links.pairingsUrl);
      if (resultUrl) window.open(resultUrl, '_blank', 'noopener,noreferrer');
      else alert('結果URLはまだ登録されていません。');
    } else if (action === 'map') {
      if (d.venue) window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(d.venue), '_blank', 'noopener,noreferrer');
      else alert('会場情報がありません。');
        } else if (action === 'add-receipt') {
      openReceiptSheet(root, d, null, rerender);
    } else if (action === 'open-receipt') {
      var receiptId = trigger && trigger.getAttribute('data-receipt-id');
      var receipt = findReceipt(d, receiptId);
      if (receipt) openReceiptSheet(root, d, receipt, rerender);
    } else if (action === 'notify') {
      alert('通知設定は本体統合後に接続します。');
    } else if (action === 'menu') {
      console.log('[expedition] menu');
    }
  }



  function calcPreparedness(d) {
    var hotelOk = d.hotel && d.hotel.status === '予約済み' && d.hotel.name && d.hotel.name !== 'ホテル未設定';
    var travelOk = (d.travel || []).some(function(t){ return Number(t.amount || 0) > 0 || (t.main && t.main !== '未設定' && t.main !== '¥0'); });
    var expenseTotal = (d.expenses || []).reduce(function(sum,e){ return sum + Number(e.amount || 0); }, 0);
    var checks = d.checklist || [];
    var checkedCount = checks.filter(function(item){ return item.checked; }).length;
    var totalChecks = checks.length || 0;
    return {
      hotelOk: !!hotelOk,
      travelOk: !!travelOk,
      costOk: expenseTotal > 0,
      checkedCount: checkedCount,
      totalChecks: totalChecks,
      expenseTotal: expenseTotal
    };
  }

  function statusBadge(text, tone) {
    return '<span class="exp-home-badge exp-home-badge--' + esc(tone || 'blue') + '">' + esc(text) + '</span>';
  }

  function shortDateRange(d) {
    var range = d && d.dateRange ? String(d.dateRange) : '';
    if (!range) return '';
    return range.replace(/^2026\//g, '').replace(/ - 2026\//g, ' - ').replace(/\//g, '月').replace(/月(\d{2})$/g, '月$1日').replace(/月0/g, '月');
  }

  function renderHomeHero(d) {
    var c = el('section', 'exp-card exp-home-hero');
    var prep = calcPreparedness(d);
    var label = prep.hotelOk || prep.travelOk || prep.costOk ? '準備中' : '未準備';
    c.innerHTML = '<div class="exp-home-hero__grid">' +
      '<div class="exp-home-hero__main">' +
        '<div class="exp-home-hero__label">' + ICONS.flag + '<span>次の遠征</span></div>' +
        '<h1 class="exp-home-hero__name">' + esc(d.tournamentName || '次の遠征') + '</h1>' +
        '<div class="exp-home-hero__row">' + ICONS.pin + '<span>' + esc(d.venue || '会場未設定') + '</span></div>' +
        '<div class="exp-home-hero__row">' + ICONS.calendar + '<span>' + esc(d.dateRange || '日程未設定') + '</span></div>' +
        '<div class="exp-home-chip">' + esc(label) + '</div>' +
      '</div>' +
      '<div class="exp-home-hero__side">' +
        '<div class="exp-home-hero__cal">' + ICONS.calendarCheck + '</div>' +
        '<button class="exp-btn-primary exp-home-open" type="button" data-action="home-open-active">遠征を開く</button>' +
      '</div>' +
    '</div>';
    return c;
  }

  function renderPreparationStatus(d) {
    var prep = calcPreparedness(d);
    var c = el('section', 'exp-card exp-home-status');
    var items = [
      { icon: 'building', label: 'ホテル', value: prep.hotelOk ? '登録済み' : '未登録', ok: prep.hotelOk },
      { icon: 'car', label: '移動', value: prep.travelOk ? '登録済み' : '未登録', ok: prep.travelOk },
      { icon: 'wallet', label: '費用', value: prep.costOk ? '入力済み' : '未入力', ok: prep.costOk },
      { icon: 'tabBag', label: '持ち物', value: prep.checkedCount + '/' + prep.totalChecks + ' 完了', ok: prep.totalChecks && prep.checkedCount === prep.totalChecks }
    ];
    c.innerHTML = '<div class="exp-home-section-title">' + ICONS.clipboard + '<span>準備状況</span></div>' +
      '<div class="exp-home-status__grid">' + items.map(function(item){
        return '<button class="exp-home-status__item" type="button" data-action="home-open-active">' +
          '<span class="exp-home-status__ic">' + (ICONS[item.icon] || ICONS.checkCircle) + '</span>' +
          '<span class="exp-home-status__text"><strong>' + esc(item.label) + '</strong><em class="' + (item.ok ? 'is-ok' : 'is-warn') + '">' + esc(item.value) + '</em></span>' +
        '</button>';
      }).join('') + '</div>';
    return c;
  }

  function collectSavedExpeditions(activeData) {
    var map = {};
    function pushItem(item) {
      if (!item || !item.tournamentId || map[item.tournamentId]) return;
      map[item.tournamentId] = true;
    }
    var list = readIndex().filter(Boolean);
    if (activeData && activeData.tournamentId) {
      pushItem(activeData);
      list = [{ tournamentId: activeData.tournamentId, tournamentName: activeData.tournamentName, venue: activeData.venue, dateRange: activeData.dateRange, updatedAt: new Date().toISOString(), storageKey: storageKey(activeData) }].concat(list);
    }
    var deduped = [];
    map = {};
    list.forEach(function(item){
      if (!item || !item.tournamentId || map[item.tournamentId]) return;
      map[item.tournamentId] = true;
      deduped.push(item);
    });
    return deduped.slice(0, 8);
  }

  function loadSavedById(tournamentId, fallback) {
    var stored = readJson('pnx-expedition-' + tournamentId, null);
    if (stored) return loadData(stored);
    if (fallback && fallback.tournamentId === tournamentId) return loadData(fallback);
    var row = readIndex().find(function(item){ return item && item.tournamentId === tournamentId; });
    if (row) return loadData(row);
    return loadData(defaultExpeditionData);
  }

  function savedStatusFor(item, activeData) {
    var d = loadSavedById(item.tournamentId, activeData);
    var prep = calcPreparedness(d);
    if (!prep.hotelOk) return { text: 'ホテル未登録', tone: 'red' };
    if (!prep.costOk) return { text: '費用未入力', tone: 'orange' };
    if (!prep.travelOk) return { text: '移動未登録', tone: 'orange' };
    return { text: '準備中', tone: 'blue' };
  }

  function renderSavedList(d) {
    var c = el('section', 'exp-card exp-home-list');
    var saved = collectSavedExpeditions(d);
    var rows = saved.slice(0, 4).map(function(item){
      var st = savedStatusFor(item, d);
      return '<button class="exp-home-row" type="button" data-action="home-open-saved" data-tournament-id="' + esc(item.tournamentId) + '">' +
        '<span class="exp-home-row__ic">' + ICONS.calendar + '</span>' +
        '<span class="exp-home-row__body"><strong>' + esc(item.tournamentName || '大会予定') + '</strong><em>' + ICONS.calendar + esc(shortDateRange(item) || item.dateRange || '') + '</em></span>' +
        statusBadge(st.text, st.tone) + '<span class="exp-home-row__chev">' + ICONS.chevron + '</span>' +
      '</button>';
    }).join('');
    if (!rows) {
      rows = '<div class="exp-home-empty">カレンダーで試合を追加すると、遠征がここに表示されます。</div>';
    }
    c.innerHTML = '<div class="exp-home-card-title"><h2>保存済みの遠征</h2><button type="button" data-action="home-show-all">すべて見る ' + ICONS.chevron + '</button></div>' + rows;
    return c;
  }

  function renderRecentList() {
    var list = readIndex().slice(0, 2);
    var c = el('section', 'exp-card exp-home-list exp-home-recent');
    var rows = list.map(function(item, idx){
      var text = idx === 0 ? '遠征情報を更新' : '費用・移動情報を更新';
      return '<button class="exp-home-row exp-home-row--recent" type="button" data-action="home-open-saved" data-tournament-id="' + esc(item.tournamentId) + '">' +
        '<span class="exp-home-row__ic">' + (idx === 0 ? ICONS.building : ICONS.car) + '</span>' +
        '<span class="exp-home-row__body"><strong>' + esc(text) + '</strong><em>最近編集</em></span><span class="exp-home-row__chev">' + ICONS.chevron + '</span>' +
      '</button>';
    }).join('');
    if (!rows) {
      rows = '<div class="exp-home-empty">まだ編集履歴はありません。</div>';
    }
    c.innerHTML = '<div class="exp-home-card-title"><h2>最近編集した遠征</h2><button type="button" data-action="home-show-all">すべて見る ' + ICONS.chevron + '</button></div>' + rows;
    return c;
  }

  function renderHomeHelper() {
    var c = el('section', 'exp-card exp-home-helper');
    c.innerHTML = '<span class="exp-home-helper__ic">' + ICONS.calendar + '</span><strong>カレンダーで試合を追加すると、遠征管理できます。</strong><span class="exp-home-row__chev">' + ICONS.chevron + '</span>';
    return c;
  }

  function renderExpeditionHome(d) {
    var scroll = el('main', 'exp-scroll exp-home-scroll');
    scroll.appendChild(renderHomeHero(d));
    scroll.appendChild(renderPreparationStatus(d));
    scroll.appendChild(renderSavedList(d));
    scroll.appendChild(renderRecentList());
    scroll.appendChild(renderHomeHelper());
    return scroll;
  }

  function initExpeditionPage(rootElement, data, options) {
    if (!rootElement) { console.warn('[expedition] rootElement が指定されていません'); return; }
    options = options || {};
    var isStandalone = (typeof options.standalone === 'boolean') ? options.standalone : (rootElement.getAttribute('data-standalone') === 'true');
    var isFitScreen = (typeof options.fitScreen === 'boolean') ? options.fitScreen : rootElement.classList.contains('expedition--fit-screen');
    var currentView = options.initialView || rootElement.getAttribute('data-initial-view') || 'home';
    var d = loadData(data || defaultExpeditionData);
    upsertIndex(d);
    setActiveTournament(d);

    function applyRootState() {
      rootElement.classList.toggle('expedition--standalone', isStandalone);
      rootElement.classList.toggle('expedition--fit-screen', isFitScreen && currentView === 'detail');
      rootElement.classList.toggle('expedition--home', currentView === 'home');
      rootElement.setAttribute('data-standalone', isStandalone ? 'true' : 'false');
      rootElement.setAttribute('data-fit-screen', (isFitScreen && currentView === 'detail') ? 'true' : 'false');
      rootElement.setAttribute('data-current-view', currentView);
    }

    function renderDetail(current) {
      if (current) d = current;
      rootElement.innerHTML = '';
      currentView = 'detail';
      applyRootState();
      var scroll = el('main', 'exp-scroll');
      scroll.appendChild(renderMatch(d));
      scroll.appendChild(renderTravel(d));
      scroll.appendChild(renderHotel(d));
      scroll.appendChild(renderChecklist(d, function () { saveData(d); }));
      scroll.appendChild(renderCost(d));
      scroll.appendChild(renderReceipts(d));
      scroll.appendChild(renderMemo(d));
      scroll.appendChild(renderQuick());

      rootElement.appendChild(renderHeader());
      scroll.prepend(renderBackToHomeButton());
      rootElement.appendChild(scroll);
      if (isStandalone) rootElement.appendChild(renderTabbar());
    }

    function renderHome(current) {
      if (current) d = current;
      rootElement.innerHTML = '';
      currentView = 'home';
      applyRootState();
      rootElement.appendChild(renderHeader());
      rootElement.appendChild(renderExpeditionHome(d));
      if (isStandalone) rootElement.appendChild(renderTabbar());
    }

    function renderBackToHomeButton() {
      var b = el('button', 'exp-back-home');
      b.type = 'button';
      b.setAttribute('data-action', 'home-back');
      b.innerHTML = '‹ 遠征トップへ戻る';
      return b;
    }

    function rerender(current) {
      if (current) d = current;
      if (currentView === 'home') renderHome(d);
      else renderDetail(d);
    }

    renderHome(d);
    rootElement.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-action]');
      if (t && rootElement.contains(t)) {
        ev.preventDefault();
        var action = t.getAttribute('data-action');
        if (action === 'home-open-active') {
          renderDetail(d);
          return;
        }
        if (action === 'home-open-saved') {
          var id = t.getAttribute('data-tournament-id');
          d = loadSavedById(id, d);
          setActiveTournament(d);
          renderDetail(d);
          return;
        }
        if (action === 'home-back') {
          renderHome(d);
          return;
        }
        if (action === 'home-show-all') {
          alert('保存済み遠征の一覧画面は次のステップで強化できます。');
          return;
        }
        handleAction(rootElement, d, action, rerender, t);
        return;
      }
      var tab = ev.target.closest('[data-tab]');
      if (tab && rootElement.contains(tab)) console.log('[expedition] tab:', tab.getAttribute('data-tab'));
    });

    return {
      getData: function () { return d; },
      setData: function (nextData, opts) {
        opts = opts || {};
        d = loadData(nextData || defaultExpeditionData);
        setActiveTournament(d);
        upsertIndex(d);
        if (opts.view === 'home') renderHome(d);
        else renderDetail(d);
        return d;
      },
      showHome: function () { renderHome(d); },
      openDetail: function (nextData) { if (nextData) d = loadData(nextData); renderDetail(d); return d; },
      save: function () { saveData(d); },
      listSaved: function () { return readIndex(); },
      reset: function () { resetData(d); d = loadData(defaultExpeditionData); renderHome(d); },
      isStandalone: isStandalone,
      isFitScreen: isFitScreen
    };
  }

  window.expeditionData = defaultExpeditionData;
  window.initExpeditionPage = initExpeditionPage;
  window.PNXExpeditionStorage = {
    activeKey: STORAGE_ACTIVE_KEY,
    indexKey: STORAGE_INDEX_KEY,
    storageKey: storageKey,
    list: readIndex,
    get: function (tournamentId) { return readJson('pnx-expedition-' + tournamentId, null); },
    clear: function (tournamentId) {
      try { localStorage.removeItem('pnx-expedition-' + tournamentId); } catch (e) {}
      writeIndex(readIndex().filter(function (item) { return item && item.tournamentId !== tournamentId; }));
    }
  };
})();
