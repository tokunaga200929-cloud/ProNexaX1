/* =========================================================
   ProNexaX Calendar v2 Precision
   - Only global: window.initProNexaCalendarV2
   - Demo data only. No Firebase / no existing DB connection.
   - To remove demo chips and bottom list, change DEMO_EVENTS to [] below.
   ========================================================= */
(function () {
  'use strict';

  let DEMO_EVENTS = [
    { y: 2026, m: 5, d: 1,  time: '',      title: 'JGTO 太平洋CUP', chipLines: ['JGTO', '太平洋CUP'], color: 'blue',   desc: '', loc: '' },
    { y: 2026, m: 5, d: 3,  time: '09:00', title: '練習',           chipLines: ['練習'],             color: 'green',  desc: 'アプローチ調整', loc: '練習場' },
    { y: 2026, m: 5, d: 4,  time: '14:00', title: 'レッスン',       chipLines: ['レッスン'],         color: 'purple', desc: 'パッティング確認', loc: 'ProNexaXアカデミー' },
    { y: 2026, m: 5, d: 5,  time: '',      title: '締切 エントリー', chipLines: ['締切', 'エントリー'], color: 'red',    desc: '大会エントリー締切', loc: '' },
    { y: 2026, m: 5, d: 6,  time: '09:00', title: '練習',           chipLines: ['練習'],             color: 'green',  desc: 'ショートゲーム', loc: '太平洋クラブ' },
    { y: 2026, m: 5, d: 8,  time: '18:00', title: '移動',           chipLines: ['移動'],             color: 'orange', desc: '東京 → 御殿場', loc: '東京駅 18:00 発', locIcon: 'train' },
    { y: 2026, m: 5, d: 10, time: '',      title: 'JGTO 太平洋CUP', chipLines: ['JGTO', '太平洋CUP'], color: 'blue',   desc: '', loc: '' },
    { y: 2026, m: 5, d: 12, time: '14:00', title: 'レッスン',       chipLines: ['レッスン'],         color: 'purple', desc: 'スイング確認', loc: 'ProNexaXアカデミー' },
    { y: 2026, m: 5, d: 13, time: '09:00', title: '練習',           chipLines: ['練習'],             color: 'green',  desc: 'アイアン調整', loc: '太平洋クラブ' },
    { y: 2026, m: 5, d: 15, time: '',      title: 'JGTO 太平洋CUP', chipLines: ['JGTO', '太平洋CUP'], color: 'blue',   desc: '', loc: '' },
    { y: 2026, m: 5, d: 18, time: '18:00', title: '移動',           chipLines: ['移動'],             color: 'orange', desc: '御殿場 → 東京', loc: '三島駅 18:22 発', locIcon: 'train' },
    { y: 2026, m: 5, d: 20, time: '09:00', title: '練習',           chipLines: ['練習'],             color: 'green',  desc: 'ショートゲーム中心の調整', loc: '太平洋クラブ 御殿場' },
    { y: 2026, m: 5, d: 20, time: '14:00', title: 'レッスン',       chipLines: ['レッスン'],         color: 'purple', desc: 'スイングチェック・アイアン', loc: 'ProNexaXアカデミー' },
    { y: 2026, m: 5, d: 20, time: '18:00', title: '移動',           chipLines: ['移動'],             color: 'orange', desc: '御殿場 → 東京（新幹線）', loc: '三島駅 18:22 発', locIcon: 'train' },
    { y: 2026, m: 5, d: 22, time: '',      title: 'JGTO 太平洋CUP', chipLines: ['JGTO', '太平洋CUP'], color: 'blue',   desc: '', loc: '' },
    { y: 2026, m: 5, d: 24, time: '09:00', title: '練習',           chipLines: ['練習'],             color: 'green',  desc: 'ショートゲーム', loc: '練習場' },
    { y: 2026, m: 5, d: 26, time: '14:00', title: 'レッスン',       chipLines: ['レッスン'],         color: 'purple', desc: 'パッティング確認', loc: 'ProNexaXアカデミー' },
    { y: 2026, m: 5, d: 29, time: '18:00', title: '移動',           chipLines: ['移動'],             color: 'orange', desc: '東京 → 御殿場', loc: '東京駅 18:00 発', locIcon: 'train' },
    { y: 2026, m: 5, d: 31, time: '',      title: 'JGTO 太平洋CUP', chipLines: ['JGTO', '太平洋CUP'], color: 'blue',   desc: '', loc: '' }
  ];

  const DEMO_TODAY = { y: 2026, m: 5, d: 20 };
  const WEEK = ['日', '月', '火', '水', '木', '金', '土'];
  const COLOR = {
    blue: '#0a74ff',
    green: '#34c759',
    purple: '#9c42d2',
    orange: '#ff8a00',
    red: '#ff2d55'
  };

  const state = {
    root: null,
    viewYear: 2026,
    viewMonth: 5,
    selected: { y: 2026, m: 5, d: 20 }
  };

  function pad2(n) { return n < 10 ? '0' + n : String(n); }
  function dateKey(y, m, d) { return y + '-' + pad2(m) + '-' + pad2(d); }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function eventsOn(y, m, d) {
    return DEMO_EVENTS.filter(function (e) {
      return e.y === y && e.m === m && e.d === d;
    });
  }

  function sortByTime(a, b) {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  }

  function daysInMonth(y, m) {
    return new Date(y, m, 0).getDate();
  }

  function addMonths(year, month, delta) {
    let y = year;
    let m = month + delta;
    while (m <= 0) { m += 12; y -= 1; }
    while (m > 12) { m -= 12; y += 1; }
    return { y: y, m: m };
  }

  function buildCells(year, month) {
    const firstDow = new Date(year, month - 1, 1).getDay();
    const currentDays = daysInMonth(year, month);
    const prev = addMonths(year, month, -1);
    const prevDays = daysInMonth(prev.y, prev.m);
    const next = addMonths(year, month, 1);
    const cells = [];

    for (let i = firstDow - 1; i >= 0; i--) {
      cells.push({ y: prev.y, m: prev.m, d: prevDays - i, other: true });
    }
    for (let d = 1; d <= currentDays; d++) {
      cells.push({ y: year, m: month, d: d, other: false });
    }
    let nextDay = 1;
    while (cells.length < 42) {
      cells.push({ y: next.y, m: next.m, d: nextDay, other: true });
      nextDay += 1;
    }
    return cells;
  }

  function renderMonthLabel() {
    const label = state.root.querySelector('[data-pnx-month-label]');
    if (label) label.textContent = state.viewYear + '年 ' + state.viewMonth + '月';
  }

  function renderGrid() {
    const grid = state.root.querySelector('[data-pnx-grid]');
    if (!grid) return;

    const cells = buildCells(state.viewYear, state.viewMonth);
    grid.innerHTML = cells.map(function (cell, index) {
      const dow = index % 7;
      const classes = ['pnx-cal-cell'];
      if (cell.other) classes.push('is-other');
      if (dow === 0) classes.push('is-sun');
      if (dow === 6) classes.push('is-sat');
      if (state.selected && cell.y === state.selected.y && cell.m === state.selected.m && cell.d === state.selected.d) {
        classes.push('is-selected');
      }

      const visibleEvents = cell.other ? [] : eventsOn(cell.y, cell.m, cell.d).slice().sort(sortByTime);
      const chips = visibleEvents.slice(0, 3).map(function (event) {
        const chipText = event.chipLabel || (Array.isArray(event.chipLines) && event.chipLines.length ? event.chipLines.join(" ") : event.title);
        const color = COLOR[event.color] || event.color || "#0a74ff";
        return '<div class="pnx-cal-chip" style="--pnx-chip-color:' + escapeHtml(color) + '"><span class="pnx-cal-chip-line">' + escapeHtml(chipText) + '</span></div>';
      }).join("");
      const more = visibleEvents.length > 3 ? '<div class="pnx-cal-more">+' + (visibleEvents.length - 3) + '</div>' : '';

      return '' +
        '<button class="' + classes.join(' ') + '" type="button" data-y="' + cell.y + '" data-m="' + cell.m + '" data-d="' + cell.d + '" data-other="' + (cell.other ? '1' : '0') + '" aria-label="' + cell.y + '年' + cell.m + '月' + cell.d + '日">' +
          '<span class="pnx-cal-daynum">' + cell.d + '</span>' +
          (chips ? '<div class="pnx-cal-chips">' + chips + more + '</div>' : '') +
        '</button>';
    }).join('');
  }

  function locationIcon(type) {
    if (type === 'train') {
      return '' +
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
          '<rect x="6" y="3.5" width="12" height="14" rx="3" />' +
          '<path d="M6 11.5H18" />' +
          '<path d="M9 17.5L7 21" />' +
          '<path d="M15 17.5L17 21" />' +
          '<path d="M9 7.5H15" />' +
          '<circle cx="9.2" cy="14.7" r=".8" fill="currentColor" stroke="none" />' +
          '<circle cx="14.8" cy="14.7" r=".8" fill="currentColor" stroke="none" />' +
        '</svg>';
    }
    return '' +
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M12 21C12 21 5.5 15.2 5.5 9.7C5.5 6.1 8.4 3.5 12 3.5C15.6 3.5 18.5 6.1 18.5 9.7C18.5 15.2 12 21 12 21Z" />' +
        '<circle cx="12" cy="9.6" r="2.25" />' +
      '</svg>';
  }

  function renderSheet() {
    const dateEl = state.root.querySelector('[data-pnx-sheet-date]');
    const list = state.root.querySelector('[data-pnx-sheet-list]');
    if (!dateEl || !list || !state.selected) return;

    const y = state.selected.y;
    const m = state.selected.m;
    const d = state.selected.d;
    const dow = new Date(y, m - 1, d).getDay();
    dateEl.textContent = m + '月' + d + '日（' + WEEK[dow] + '）';

    const items = eventsOn(y, m, d).filter(function (e) { return !!e.time; }).sort(sortByTime);

    if (!items.length) {
      list.innerHTML = '<div class="pnx-cal-empty">予定はありません</div>';
      return;
    }

    list.innerHTML = items.map(function (event) {
      const color = COLOR[event.color] || event.color || '#0a74ff';
      const place = event.loc ?
        '<div class="pnx-cal-event-place">' + locationIcon(event.locIcon) + '<span>' + escapeHtml(event.loc) + '</span></div>' :
        '<div class="pnx-cal-event-place"></div>';
      return '' +
        '<article class="pnx-cal-event-card" style="--pnx-event-color:' + escapeHtml(color) + '">' +
          '<div class="pnx-cal-event-time">' + escapeHtml(event.time) + '</div>' +
          '<div class="pnx-cal-event-main">' +
            '<div class="pnx-cal-event-title">' + escapeHtml(event.title) + '</div>' +
            (event.desc ? '<div class="pnx-cal-event-desc">' + escapeHtml(event.desc) + '</div>' : '<div class="pnx-cal-event-desc"></div>') +
          '</div>' +
          place +
          '<button class="pnx-cal-event-menu" type="button" aria-label="予定メニュー">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.75"></circle><circle cx="12" cy="12" r="1.75"></circle><circle cx="12" cy="19" r="1.75"></circle></svg>' +
          '</button>' +
        '</article>';
    }).join('');
  }

  function renderAll() {
    renderMonthLabel();
    renderGrid();
    renderSheet();
  }

  function selectDate(y, m, d) {
    state.selected = { y: y, m: m, d: d };
    state.viewYear = y;
    state.viewMonth = m;
    renderAll();
  }

  function moveMonth(delta) {
    const moved = addMonths(state.viewYear, state.viewMonth, delta);
    state.viewYear = moved.y;
    state.viewMonth = moved.m;

    const maxDay = daysInMonth(state.viewYear, state.viewMonth);
    const selectedDay = Math.min(state.selected ? state.selected.d : 1, maxDay);
    state.selected = { y: state.viewYear, m: state.viewMonth, d: selectedDay };
    renderAll();
  }

  function bindEvents() {
    if (state.root.dataset.pnxBound === '1') return;
    state.root.dataset.pnxBound = '1';

    state.root.addEventListener('click', function (event) {
      const actionEl = event.target.closest('[data-pnx-action]');
      if (actionEl && state.root.contains(actionEl)) {
        const action = actionEl.getAttribute('data-pnx-action');
        if (action === 'prev-month') { moveMonth(-1); return; }
        if (action === 'next-month') { moveMonth(1); return; }
        if (action === 'today') { selectDate(DEMO_TODAY.y, DEMO_TODAY.m, DEMO_TODAY.d); return; }
      }

      const navEl = event.target.closest('[data-pnx-nav]');
      if (navEl && state.root.contains(navEl)) {
        const page = navEl.getAttribute('data-pnx-nav');
        state.root.querySelectorAll('[data-pnx-nav]').forEach(function (item) {
          const isActive = item === navEl;
          item.classList.toggle('is-active', isActive);
          if (isActive) item.setAttribute('aria-current', 'page');
          else item.removeAttribute('aria-current');
        });

        if (typeof window.switchPage === 'function') {
          window.switchPage(page);
        } else if (typeof window.ProNexaXSwitchPage === 'function') {
          window.ProNexaXSwitchPage(page);
        } else {
          window.dispatchEvent(new CustomEvent('pronexax:navigate', { detail: { page: page } }));
        }
        return;
      }

      const cell = event.target.closest('.pnx-cal-cell');
      if (!cell || !state.root.contains(cell)) return;
      const y = Number(cell.getAttribute('data-y'));
      const m = Number(cell.getAttribute('data-m'));
      const d = Number(cell.getAttribute('data-d'));
      if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
        selectDate(y, m, d);
      }
    });
  }

  window.initProNexaCalendarV2 = function initProNexaCalendarV2(options) {
    const root = (options && options.root) || document.querySelector('[data-pnx-calendar-v2]') || document.querySelector('.pnx-calendar-v2');
    if (!root) return;

    state.root = root;

    if (options && Array.isArray(options.events)) {
      DEMO_EVENTS = options.events;
    }
    if (options && options.initialDate) {
      const init = options.initialDate;
      state.viewYear = init.y || state.viewYear;
      state.viewMonth = init.m || state.viewMonth;
      state.selected = { y: state.viewYear, m: state.viewMonth, d: init.d || 1 };
    }

    bindEvents();
    renderAll();
  };
})();
