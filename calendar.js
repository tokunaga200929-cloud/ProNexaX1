/* =========================================================
   ProNexaX Calendar v2 Precision
   - Only global: window.initProNexaCalendarV2
   - Demo data only. No Firebase / no existing DB connection.
   - To remove demo chips and bottom list, change DEMO_EVENTS to [] below.
   ========================================================= */
(function () {
  'use strict';

  let DEMO_EVENTS = [];

  /* STEP203: 試合検索→本体カレンダー連携用の永続化キー */
  const PNX_CALENDAR_STORAGE_KEY = 'pronexax.calendar.v2.events.step203';

  function readCalendarStorage() {
    try {
      if (!window.localStorage) return null;
      return window.localStorage.getItem(PNX_CALENDAR_STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function writeCalendarStorage(value) {
    try {
      if (!window.localStorage) return false;
      window.localStorage.setItem(PNX_CALENDAR_STORAGE_KEY, value);
      return true;
    } catch (e) {
      console.warn('[ProNexaX] カレンダー保存に失敗しました:', e);
      return false;
    }
  }

  function normalizeCalendarEvent(event) {
    if (!event || typeof event !== 'object') return null;
    const y = Number(event.y);
    const m = Number(event.m);
    const d = Number(event.d);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
    return Object.assign({}, event, {
      y: y,
      m: m,
      d: d,
      endY: Number(event.endY || y),
      endM: Number(event.endM || m),
      endD: Number(event.endD || d),
      title: event.title || '予定',
      chipLines: Array.isArray(event.chipLines) ? event.chipLines : [event.chipLabel || event.title || '予定'],
      chipLabel: event.chipLabel || event.title || '予定'
    });
  }

  function loadCalendarEventsFromStorage() {
    const raw = readCalendarStorage();
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizeCalendarEvent).filter(Boolean);
    } catch (e) {
      console.warn('[ProNexaX] カレンダー復元に失敗しました:', e);
      return [];
    }
  }

  function persistCalendarEvents() {
    writeCalendarStorage(JSON.stringify(DEMO_EVENTS.map(function (event) {
      return Object.assign({}, event);
    })));
  }

  function mergeCalendarEvents(baseEvents, storedEvents) {
    const map = new Map();
    (Array.isArray(baseEvents) ? baseEvents : []).forEach(function (event) {
      const normalized = normalizeCalendarEvent(event);
      if (!normalized) return;
      map.set(String(normalized.id || createEventId()), normalized);
    });
    (Array.isArray(storedEvents) ? storedEvents : []).forEach(function (event) {
      const normalized = normalizeCalendarEvent(event);
      if (!normalized) return;
      map.set(String(normalized.id || createEventId()), normalized);
    });
    return Array.from(map.values());
  }

  function getLocalToday() {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
  }

  const DEMO_TODAY = getLocalToday();
  const WEEK = ['日', '月', '火', '水', '木', '金', '土'];
  const COLOR = {
    blue: '#0a74ff',
    green: '#34c759',
    purple: '#9c42d2',
    orange: '#ff8a00',
    red: '#ff2d55',
    gray: '#8e8e93'
  };

  const state = {
    root: null,
    viewYear: DEMO_TODAY.y,
    viewMonth: DEMO_TODAY.m,
    selected: { y: DEMO_TODAY.y, m: DEMO_TODAY.m, d: DEMO_TODAY.d },
    selectedEventId: null,
    editingEventId: null,
    monthPickerYear: DEMO_TODAY.y,
    lastCalendarTap: { key: '', time: 0 },
    suppressClickUntil: 0,
    drag: {
      pointerId: null,
      timer: null,
      eventId: null,
      sourceEl: null,
      ghostEl: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      active: false,
      targetCellKey: '',
      targetDate: null
    },
    rangeSelect: {
      pointerId: null,
      timer: null,
      active: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      startDate: null,
      endDate: null,
      startKey: ''
    },
    monthSwipe: {
      pointerId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      tracking: false,
      canceled: false
    },
    addDraft: {
      start: { y: DEMO_TODAY.y, m: DEMO_TODAY.m, d: DEMO_TODAY.d },
      end: { y: DEMO_TODAY.y, m: DEMO_TODAY.m, d: DEMO_TODAY.d },
      activeRangeField: 'start',
      pickerYear: DEMO_TODAY.y,
      pickerMonth: DEMO_TODAY.m,
      color: 'blue'
    }
  };

  function pad2(n) { return n < 10 ? '0' + n : String(n); }
  function dateKey(y, m, d) { return y + '-' + pad2(m) + '-' + pad2(d); }
  function parseISODate(value) {
    const text = String(value || '').trim();
    const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!match) return null;
    const y = Number(match[1]);
    const m = Number(match[2]);
    const d = Number(match[3]);
    const native = new Date(y, m - 1, d);
    if (native.getFullYear() !== y || native.getMonth() + 1 !== m || native.getDate() !== d) return null;
    return { y: y, m: m, d: d };
  }
  function compareDate(a, b) {
    const da = new Date(a.y, a.m - 1, a.d).getTime();
    const db = new Date(b.y, b.m - 1, b.d).getTime();
    return da === db ? 0 : (da < db ? -1 : 1);
  }
  function cloneDate(obj) { return { y: obj.y, m: obj.m, d: obj.d }; }
  function formatDateJP(obj, withYear) {
    const dow = new Date(obj.y, obj.m - 1, obj.d).getDay();
    return (withYear ? obj.y + '年' : '') + obj.m + '月' + obj.d + '日（' + WEEK[dow] + '）';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function createEventId() {
    return 'pnx-event-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function ensureEventIds() {
    DEMO_EVENTS.forEach(function (event, index) {
      if (!event.id) {
        event.id = 'pnx-event-existing-' + index + '-' + dateKey(event.y || 2026, event.m || 1, event.d || 1);
      }
    });
  }

  function findEventById(id) {
    if (!id) return null;
    ensureEventIds();
    return DEMO_EVENTS.find(function (event) { return String(event.id) === String(id); }) || null;
  }

  function inferEventType(event) {
    return event.type || event.category || event.kind || event.chipLabel || event.title || 'その他';
  }

  function formatEventDateTime(event) {
    const start = eventStart(event);
    const end = eventEnd(event);
    const dateText = compareDate(start, end) === 0
      ? formatDateJP(start, true)
      : formatDateJP(start, true) + ' 〜 ' + formatDateJP(end, true);
    if (event.endTime) return dateText + '　' + (event.time || '時間未設定') + '〜' + event.endTime;
    if (event.time) return dateText + '　' + event.time + '〜';
    return dateText;
  }

  function eventStart(e) {
    return { y: e.y, m: e.m, d: e.d };
  }

  function eventEnd(e) {
    return {
      y: e.endY || e.y,
      m: e.endM || e.m,
      d: e.endD || e.d
    };
  }

  function isMultiDayEvent(e) {
    return compareDate(eventStart(e), eventEnd(e)) !== 0;
  }

  function isDateInEvent(y, m, d, e) {
    const target = { y: y, m: m, d: d };
    return compareDate(target, eventStart(e)) >= 0 && compareDate(target, eventEnd(e)) <= 0;
  }

  function eventsOn(y, m, d) {
    return DEMO_EVENTS.filter(function (e) {
      return isDateInEvent(y, m, d, e);
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

  function dateObjToNative(obj) {
    return new Date(obj.y, obj.m - 1, obj.d);
  }

  function nativeToDateObj(date) {
    return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() };
  }

  function addDaysToDateObj(obj, delta) {
    const next = dateObjToNative(obj);
    next.setDate(next.getDate() + delta);
    return nativeToDateObj(next);
  }

  function diffDays(startObj, endObj) {
    const ms = dateObjToNative(endObj).getTime() - dateObjToNative(startObj).getTime();
    return Math.round(ms / 86400000);
  }

  function moveEventToDate(event, targetStart) {
    if (!event || !targetStart) return false;
    const start = eventStart(event);
    const end = eventEnd(event);
    const delta = diffDays(start, targetStart);
    if (delta === 0) return false;
    const movedStart = addDaysToDateObj(start, delta);
    const movedEnd = addDaysToDateObj(end, delta);
    event.y = movedStart.y;
    event.m = movedStart.m;
    event.d = movedStart.d;
    event.endY = movedEnd.y;
    event.endM = movedEnd.m;
    event.endD = movedEnd.d;
    return true;
  }

  function clearEventDragTimer() {
    if (state.drag.timer) {
      window.clearTimeout(state.drag.timer);
      state.drag.timer = null;
    }
  }

  function clearDropTargetHighlight() {
    if (!state.root) return;
    state.root.querySelectorAll('.pnx-cal-cell.is-drop-target').forEach(function (cell) {
      cell.classList.remove('is-drop-target');
    });
  }

  function setDropTargetCell(cell) {
    clearDropTargetHighlight();
    state.drag.targetCellKey = '';
    state.drag.targetDate = null;
    if (!cell || !state.root || !state.root.contains(cell)) return;
    const y = Number(cell.getAttribute('data-y'));
    const m = Number(cell.getAttribute('data-m'));
    const d = Number(cell.getAttribute('data-d'));
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return;
    state.drag.targetDate = { y: y, m: m, d: d };
    state.drag.targetCellKey = dateKey(y, m, d);
    cell.classList.add('is-drop-target');
  }

  function updateDropTargetFromPoint(clientX, clientY) {
    if (!state.drag.active) return;
    const hit = document.elementFromPoint(clientX, clientY);
    const cell = hit ? hit.closest('.pnx-cal-cell') : null;
    if (!cell || !state.root || !state.root.contains(cell)) {
      clearDropTargetHighlight();
      state.drag.targetCellKey = '';
      state.drag.targetDate = null;
      return;
    }
    const nextKey = dateKey(Number(cell.getAttribute('data-y')), Number(cell.getAttribute('data-m')), Number(cell.getAttribute('data-d')));
    if (nextKey === state.drag.targetCellKey) return;
    setDropTargetCell(cell);
  }

  function updateDragGhostPosition(clientX, clientY) {
    const ghost = state.drag.ghostEl;
    if (!ghost) return;
    ghost.style.left = Math.round(clientX + 12) + 'px';
    ghost.style.top = Math.round(clientY - 18) + 'px';
  }

  function createDragGhostForEvent(event) {
    const color = COLOR[event.color] || event.color || '#0a74ff';
    const ghost = document.createElement('div');
    ghost.className = 'pnx-cal-drag-ghost';
    ghost.style.setProperty('--pnx-drag-color', color);
    ghost.innerHTML = '<span class="pnx-cal-drag-ghost-dot" aria-hidden="true"></span><span class="pnx-cal-drag-ghost-text">' + escapeHtml(event.title || event.chipLabel || '予定') + '</span>';
    document.body.appendChild(ghost);
    return ghost;
  }

  function clearDragSourceState() {
    if (!state.root || !state.drag.eventId) return;
    state.root.querySelectorAll('[data-pnx-event-id="' + state.drag.eventId + '"]').forEach(function (el) {
      el.classList.remove('is-drag-source');
    });
  }

  function beginEventDrag(eventId, clientX, clientY) {
    const event = findEventById(eventId);
    if (!event || !state.root) return;
    clearEventDragTimer();
    state.drag.active = true;
    state.drag.eventId = String(eventId);
    state.drag.currentX = clientX;
    state.drag.currentY = clientY;
    state.drag.ghostEl = createDragGhostForEvent(event);
    state.root.classList.add('is-event-dragging');
    state.root.querySelectorAll('[data-pnx-event-id="' + state.drag.eventId + '"]').forEach(function (el) {
      el.classList.add('is-drag-source');
    });
    updateDragGhostPosition(clientX, clientY);
    updateDropTargetFromPoint(clientX, clientY);
    state.suppressClickUntil = Date.now() + 500;
  }

  function cancelEventDrag() {
    clearEventDragTimer();
    clearDropTargetHighlight();
    clearDragSourceState();
    if (state.drag.ghostEl && state.drag.ghostEl.parentNode) {
      state.drag.ghostEl.parentNode.removeChild(state.drag.ghostEl);
    }
    state.drag.pointerId = null;
    state.drag.eventId = null;
    state.drag.sourceEl = null;
    state.drag.ghostEl = null;
    state.drag.active = false;
    state.drag.targetCellKey = '';
    state.drag.targetDate = null;
    if (state.root) state.root.classList.remove('is-event-dragging');
  }

  function tryCommitEventDrag() {
    if (!state.drag.active || !state.drag.eventId || !state.drag.targetDate) {
      cancelEventDrag();
      return;
    }
    const event = findEventById(state.drag.eventId);
    const targetDate = cloneDate(state.drag.targetDate);
    const moved = moveEventToDate(event, targetDate);
    cancelEventDrag();
    if (moved) {
      state.selected = cloneDate(targetDate);
      state.viewYear = targetDate.y;
      state.viewMonth = targetDate.m;
      persistCalendarEvents();
      renderAll();
    }
  }

  function clearRangeSelectTimer() {
    if (state.rangeSelect.timer) {
      window.clearTimeout(state.rangeSelect.timer);
      state.rangeSelect.timer = null;
    }
  }

  function clearRangeSelectionHighlight() {
    if (!state.root) return;
    state.root.querySelectorAll('.pnx-cal-cell.is-range-preview, .pnx-cal-cell.is-range-preview-start, .pnx-cal-cell.is-range-preview-middle, .pnx-cal-cell.is-range-preview-end').forEach(function (cell) {
      cell.classList.remove('is-range-preview', 'is-range-preview-start', 'is-range-preview-middle', 'is-range-preview-end');
    });
  }

  function applyRangeSelectionHighlight(start, end) {
    if (!state.root || !start || !end) return;
    clearRangeSelectionHighlight();
    const first = compareDate(start, end) <= 0 ? start : end;
    const last = compareDate(start, end) <= 0 ? end : start;
    state.root.querySelectorAll('.pnx-cal-cell').forEach(function (cell) {
      const cellDate = { y: Number(cell.getAttribute('data-y')), m: Number(cell.getAttribute('data-m')), d: Number(cell.getAttribute('data-d')) };
      if (!Number.isFinite(cellDate.y) || !Number.isFinite(cellDate.m) || !Number.isFinite(cellDate.d)) return;
      if (!isBetweenDate(cellDate, first, last)) return;
      cell.classList.add('is-range-preview');
      const key = dateKey(cellDate.y, cellDate.m, cellDate.d);
      const firstKey = dateKey(first.y, first.m, first.d);
      const lastKey = dateKey(last.y, last.m, last.d);
      if (key === firstKey) cell.classList.add('is-range-preview-start');
      else if (key === lastKey) cell.classList.add('is-range-preview-end');
      else cell.classList.add('is-range-preview-middle');
    });
  }

  function beginCellRangeSelect(y, m, d) {
    const startDate = { y: y, m: m, d: d };
    state.rangeSelect.active = true;
    state.rangeSelect.startDate = cloneDate(startDate);
    state.rangeSelect.endDate = cloneDate(startDate);
    state.rangeSelect.startKey = dateKey(y, m, d);
    if (state.root) state.root.classList.add('is-range-selecting');
    applyRangeSelectionHighlight(startDate, startDate);
    state.suppressClickUntil = Date.now() + 500;
  }

  function updateRangeSelectionFromPoint(clientX, clientY) {
    if (!state.rangeSelect.active) return;
    const hit = document.elementFromPoint(clientX, clientY);
    const cell = hit ? hit.closest('.pnx-cal-cell') : null;
    if (!cell || !state.root || !state.root.contains(cell)) return;
    const y = Number(cell.getAttribute('data-y'));
    const m = Number(cell.getAttribute('data-m'));
    const d = Number(cell.getAttribute('data-d'));
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return;
    const next = { y: y, m: m, d: d };
    if (state.rangeSelect.endDate && dateKey(next.y, next.m, next.d) === dateKey(state.rangeSelect.endDate.y, state.rangeSelect.endDate.m, state.rangeSelect.endDate.d)) return;
    state.rangeSelect.endDate = next;
    applyRangeSelectionHighlight(state.rangeSelect.startDate, next);
  }

  function cancelCellRangeSelect() {
    clearRangeSelectTimer();
    clearRangeSelectionHighlight();
    state.rangeSelect.pointerId = null;
    state.rangeSelect.active = false;
    state.rangeSelect.startDate = null;
    state.rangeSelect.endDate = null;
    state.rangeSelect.startKey = '';
    if (state.root) state.root.classList.remove('is-range-selecting');
  }

  function openAddSheetForRange(start, end) {
    if (!start || !end) return;
    const first = compareDate(start, end) <= 0 ? cloneDate(start) : cloneDate(end);
    const last = compareDate(start, end) <= 0 ? cloneDate(end) : cloneDate(start);
    state.selected = cloneDate(first);
    state.viewYear = first.y;
    state.viewMonth = first.m;
    renderAll();
    openAddSheet(null, { start: first, end: last });
  }

  function tryCommitCellRangeSelect() {
    if (!state.rangeSelect.active || !state.rangeSelect.startDate || !state.rangeSelect.endDate) {
      cancelCellRangeSelect();
      return;
    }
    const first = compareDate(state.rangeSelect.startDate, state.rangeSelect.endDate) <= 0 ? cloneDate(state.rangeSelect.startDate) : cloneDate(state.rangeSelect.endDate);
    const last = compareDate(state.rangeSelect.startDate, state.rangeSelect.endDate) <= 0 ? cloneDate(state.rangeSelect.endDate) : cloneDate(state.rangeSelect.startDate);
    cancelCellRangeSelect();
    openAddSheetForRange(first, last);
  }

  function renderMonthLabel() {
    const label = state.root.querySelector('[data-pnx-month-label]');
    if (label) label.textContent = state.viewYear + '年 ' + state.viewMonth + '月';
    const trigger = state.root.querySelector('[data-pnx-action="pick-month"]');
    if (trigger) {
      const isOpen = state.root.classList.contains('is-month-picker-open');
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
  }

  function renderGrid() {
    const grid = state.root.querySelector('[data-pnx-grid]');
    if (!grid) return;

    const cells = buildCells(state.viewYear, state.viewMonth);
    const spanRender = renderMultiDaySpanChips(cells);
    const rowSpanLanes = spanRender.rowSpanLanes || [0, 0, 0, 0, 0, 0];
    grid.style.gridTemplateRows = '';
    grid.style.height = '';

    const cellHtml = cells.map(function (cell, index) {
      const dow = index % 7;
      const row = Math.floor(index / 7);
      const classes = ['pnx-cal-cell'];
      if (cell.other) classes.push('is-other');
      if (dow === 0) classes.push('is-sun');
      if (dow === 6) classes.push('is-sat');
      if (state.selected && cell.y === state.selected.y && cell.m === state.selected.m && cell.d === state.selected.d) {
        classes.push('is-selected');
      }
      const todayForGrid = getLocalToday();
      if (cell.y === todayForGrid.y && cell.m === todayForGrid.m && cell.d === todayForGrid.d) {
        classes.push('is-today');
      }

      const visibleEvents = cell.other ? [] : eventsOn(cell.y, cell.m, cell.d).filter(function (event) {
        return !isMultiDayEvent(event);
      }).slice().sort(sortByTime);

      const rowLanes = rowSpanLanes[row] || 0;
      const isSelectedCell = !!(state.selected && cell.y === state.selected.y && cell.m === state.selected.m && cell.d === state.selected.d);
      let maxVisible = 3;
      if (rowLanes === 1) maxVisible = isSelectedCell ? 1 : 2;
      if (rowLanes >= 2) maxVisible = 1;
      const chips = visibleEvents.slice(0, maxVisible).map(function (event) {
        const chipText = event.chipLabel || (Array.isArray(event.chipLines) && event.chipLines.length ? event.chipLines.join(" ") : event.title);
        const color = COLOR[event.color] || event.color || "#0a74ff";
        return '<div class="pnx-cal-chip" data-pnx-event-chip="1" data-pnx-event-id="' + escapeHtml(event.id) + '" style="--pnx-chip-color:' + escapeHtml(color) + '"><span class="pnx-cal-chip-line">' + escapeHtml(chipText) + '</span></div>';
      }).join("");
      const more = visibleEvents.length > maxVisible ? '<div class="pnx-cal-more">+' + (visibleEvents.length - maxVisible) + '</div>' : '';

      return '' +
        '<button class="' + classes.join(' ') + '" type="button" data-y="' + cell.y + '" data-m="' + cell.m + '" data-d="' + cell.d + '" data-other="' + (cell.other ? '1' : '0') + '" style="--pnx-span-lanes:' + rowLanes + '" aria-label="' + cell.y + '年' + cell.m + '月' + cell.d + '日">' +
          '<span class="pnx-cal-daynum">' + cell.d + '</span>' +
          (chips ? '<div class="pnx-cal-chips">' + chips + more + '</div>' : '') +
        '</button>';
    }).join('');

    grid.innerHTML = cellHtml + spanRender.html;
  }

  function renderMultiDaySpanChips(cells) {
    const spanEvents = DEMO_EVENTS.filter(isMultiDayEvent).slice().sort(function (a, b) {
      const c = compareDate(eventStart(a), eventStart(b));
      if (c !== 0) return c;
      return sortByTime(a, b);
    });

    if (!spanEvents.length) return { html: '', rowSpanLanes: [0, 0, 0, 0, 0, 0] };

    const items = [];
    const rowLaneEnds = Array.from({ length: 6 }, function () { return []; });
    const rowSpanLanes = [0, 0, 0, 0, 0, 0];

    for (let eventIndex = 0; eventIndex < spanEvents.length; eventIndex++) {
      const event = spanEvents[eventIndex];
      const color = COLOR[event.color] || event.color || '#0a74ff';
      const chipText = event.chipLabel || event.title || '予定';
      const start = eventStart(event);
      const end = eventEnd(event);

      for (let row = 0; row < 6; row++) {
        const rowStart = row * 7;
        const rowEnd = rowStart + 6;
        let first = -1;
        let last = -1;

        for (let i = rowStart; i <= rowEnd; i++) {
          const cell = cells[i];
          if (!cell) continue;
          if (isBetweenDate({ y: cell.y, m: cell.m, d: cell.d }, start, end)) {
            if (first === -1) first = i;
            last = i;
          }
        }

        if (first === -1 || last === -1) continue;

        const colStart0 = first % 7;          // 0-based
        const colEnd0   = last % 7;           // 0-based, inclusive
        const colSpan   = colEnd0 - colStart0 + 1;

        let level = 0;
        while (rowLaneEnds[row][level] !== undefined && rowLaneEnds[row][level] >= colStart0) {
          level += 1;
        }
        rowLaneEnds[row][level] = colEnd0;
        rowSpanLanes[row] = Math.max(rowSpanLanes[row], level + 1);

        const isStart = dateKey(cells[first].y, cells[first].m, cells[first].d) === dateKey(start.y, start.m, start.d);
        const isEnd   = dateKey(cells[last].y, cells[last].m, cells[last].d) === dateKey(end.y, end.m, end.d);

        let dividerHtml = '';
        for (let divider = 1; divider < colSpan; divider++) {
          dividerHtml += '<span class="pnx-cal-span-divider" style="left:' + ((divider * 100) / colSpan) + '%"></span>';
        }

        // 絶対配置: 親(.pnx-cal-span-layer) はグリッド全体に重なる100%×100%レイヤー
        //  top  : 各行の上端 (row / 6 * 100%) + レーンオフセット (px)
        //  left : 各列の左端 (colStart0 / 7 * 100%)
        //  width: colSpan / 7 * 100%
        const leftPct  = (colStart0 / 7) * 100;
        const widthPct = (colSpan / 7) * 100;
        const topPct   = (row / 6) * 100;

        items.push({
          row: row,
          level: level,
          html:
            '<div class="pnx-cal-span-chip' +
              (isStart ? ' is-start' : '') +
              (isEnd ? ' is-end' : '') +
            '" data-pnx-event-chip="1" data-pnx-event-id="' + escapeHtml(event.id) + '" style="--pnx-chip-color:' + escapeHtml(color) +
              ';--pnx-span-level:' + level +
              ';top:calc(' + topPct + '% + var(--pnx-span-top-offset, 40px) + ' + level + ' * var(--pnx-span-lane-h, 19px))' +
              ';left:calc(' + leftPct + '% + ' + (isStart ? 'var(--pnx-span-pad, 3px)' : '0px') + ')' +
              ';width:calc(' + widthPct + '% - ' + ((isStart ? 1 : 0) + (isEnd ? 1 : 0)) + ' * var(--pnx-span-pad, 3px))' +
            '" aria-label="予定">' +
              dividerHtml +
              '<span class="pnx-cal-span-chip-line">' + escapeHtml(chipText) + '</span>' +
            '</div>'
        });
      }
    }

    const html = '<div class="pnx-cal-span-layer" aria-hidden="true">' +
                   items.map(function(it){ return it.html; }).join('') +
                 '</div>';
    return { html: html, rowSpanLanes: rowSpanLanes };
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

    ensureEventIds();

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
        '<article class="pnx-cal-event-card" tabindex="0" role="button" data-pnx-event-id="' + escapeHtml(event.id) + '" style="--pnx-event-color:' + escapeHtml(color) + '">' +
          '<div class="pnx-cal-event-time">' + escapeHtml(event.time) + '</div>' +
          '<div class="pnx-cal-event-main">' +
            '<div class="pnx-cal-event-title">' + escapeHtml(event.title) + '</div>' +
            (event.desc ? '<div class="pnx-cal-event-desc">' + escapeHtml(event.desc) + '</div>' : '<div class="pnx-cal-event-desc"></div>') +
          '</div>' +
          place +
          '<button class="pnx-cal-event-menu" type="button" data-pnx-action="open-detail" data-pnx-event-id="' + escapeHtml(event.id) + '" aria-label="予定の詳細を開く">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.75"></circle><circle cx="12" cy="12" r="1.75"></circle><circle cx="12" cy="19" r="1.75"></circle></svg>' +
          '</button>' +
        '</article>';
    }).join('');
  }

  function setDetailText(selector, value) {
    const el = state.root ? state.root.querySelector(selector) : null;
    if (el) el.textContent = value || '';
  }

  function renderDetail(event) {
    if (!state.root || !event) return;
    const color = COLOR[event.color] || event.color || '#0a74ff';
    setDetailText('[data-pnx-detail-title-text]', event.title || '予定');
    setDetailText('[data-pnx-detail-type]', inferEventType(event));
    setDetailText('[data-pnx-detail-date]', formatEventDateTime(event));
    setDetailText('[data-pnx-detail-place]', event.loc || '未設定');
    setDetailText('[data-pnx-detail-memo]', event.desc || 'なし');
    const dot = state.root.querySelector('[data-pnx-detail-dot]');
    if (dot) dot.style.backgroundColor = color;
  }

  function openDetailSheet(eventId) {
    if (!state.root) return;
    const event = findEventById(eventId);
    if (!event) return;
    state.selectedEventId = String(event.id);
    renderDetail(event);
    const layer = state.root.querySelector('[data-pnx-detail-layer]');
    if (!layer) return;
    state.root.classList.add('is-detail-open');
    layer.classList.add('is-open');
    layer.setAttribute('aria-hidden', 'false');
  }

  function closeDetailSheet() {
    if (!state.root) return;
    const layer = state.root.querySelector('[data-pnx-detail-layer]');
    state.root.classList.remove('is-detail-open');
    if (layer) {
      layer.classList.remove('is-open');
      layer.setAttribute('aria-hidden', 'true');
    }
    state.selectedEventId = null;
  }

  function deleteSelectedEvent() {
    if (!state.selectedEventId) return;
    const target = findEventById(state.selectedEventId);
    if (!target) { closeDetailSheet(); return; }
    const ok = window.confirm('「' + (target.title || 'この予定') + '」を削除しますか？');
    if (!ok) return;
    DEMO_EVENTS = DEMO_EVENTS.filter(function (event) { return String(event.id) !== String(target.id); });
    persistCalendarEvents();
    closeDetailSheet();
    renderAll();
  }

  function openEditSelectedEvent() {
    const target = findEventById(state.selectedEventId);
    if (!target) return;
    closeDetailSheet();
    openAddSheet(target);
  }

  function renderAll() {
    renderMonthLabel();
    renderMonthPicker();
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
    closeMonthPicker();
    const moved = addMonths(state.viewYear, state.viewMonth, delta);
    state.viewYear = moved.y;
    state.viewMonth = moved.m;

    const maxDay = daysInMonth(state.viewYear, state.viewMonth);
    const selectedDay = Math.min(state.selected ? state.selected.d : 1, maxDay);
    state.selected = { y: state.viewYear, m: state.viewMonth, d: selectedDay };
    renderAll();
  }

  function isMonthPickerOpen() {
    return !!(state.root && state.root.classList.contains('is-month-picker-open'));
  }

  function openMonthPicker() {
    if (!state.root) return;
    state.monthPickerYear = state.viewYear;
    const popover = state.root.querySelector('[data-pnx-month-popover]');
    state.root.classList.add('is-month-picker-open');
    if (popover) popover.setAttribute('aria-hidden', 'false');
    renderMonthLabel();
    renderMonthPicker();
  }

  function closeMonthPicker() {
    if (!state.root || !state.root.classList.contains('is-month-picker-open')) return;
    const popover = state.root.querySelector('[data-pnx-month-popover]');
    state.root.classList.remove('is-month-picker-open');
    if (popover) popover.setAttribute('aria-hidden', 'true');
    renderMonthLabel();
  }

  function toggleMonthPicker() {
    if (isMonthPickerOpen()) closeMonthPicker();
    else openMonthPicker();
  }

  function moveMonthPickerYear(delta) {
    if (!Number.isFinite(delta)) return;
    state.monthPickerYear += delta;
    renderMonthPicker();
  }

  function selectMonthFromPicker(month) {
    month = Number(month);
    if (!Number.isFinite(month) || month < 1 || month > 12) return;
    state.viewYear = state.monthPickerYear;
    state.viewMonth = month;
    const maxDay = daysInMonth(state.viewYear, state.viewMonth);
    const selectedDay = Math.min(state.selected ? state.selected.d : 1, maxDay);
    state.selected = { y: state.viewYear, m: state.viewMonth, d: selectedDay };
    closeMonthPicker();
    renderAll();
  }

  function renderMonthPicker() {
    if (!state.root) return;
    const yearEl = state.root.querySelector('[data-pnx-month-picker-year]');
    const grid = state.root.querySelector('[data-pnx-month-picker-grid]');
    if (yearEl) yearEl.textContent = state.monthPickerYear + '年';
    if (!grid) return;

    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    grid.innerHTML = monthNames.map(function (label, index) {
      const month = index + 1;
      const isSelected = state.monthPickerYear === state.viewYear && month === state.viewMonth;
      return '<button type="button" class="pnx-cal-month-option' + (isSelected ? ' is-selected' : '') + '" data-pnx-month-option="' + month + '" aria-label="' + state.monthPickerYear + '年' + label + '">' + label + '</button>';
    }).join('');
  }

  function openAddSheetForDate(y, m, d) {
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return;
    state.selected = { y: y, m: m, d: d };
    state.viewYear = y;
    state.viewMonth = m;
    renderAll();
    openAddSheet();
  }

  function updateAddDateText() {
    if (!state.root) return;
    const dateEl = state.root.querySelector('[data-pnx-add-date]');
    if (!dateEl) return;
    const start = state.addDraft.start || state.selected;
    const end = state.addDraft.end || start;
    dateEl.textContent = compareDate(start, end) === 0 ? formatDateJP(start, false) : formatDateJP(start, false) + ' 〜 ' + formatDateJP(end, false);
  }

  function colorName(color) {
    const names = {
      blue: 'ブルー',
      green: 'グリーン',
      purple: 'パープル',
      orange: 'オレンジ',
      red: 'レッド',
      gray: 'グレー'
    };
    return names[color] || 'ブルー';
  }

  function selectedAddColor() {
    return state.addDraft.color || 'blue';
  }

  function updateColorPreview() {
    if (!state.root) return;
    const color = selectedAddColor();
    const hex = COLOR[color] || COLOR.blue;
    const nameEl = state.root.querySelector('[data-pnx-color-name]');
    const preview = state.root.querySelector('[data-pnx-color-preview-chip]');
    const previewTitle = state.root.querySelector('[data-pnx-color-preview-title]');
    const titleInput = state.root.querySelector('[data-pnx-add-title]');
    const typeLabel = state.root.querySelector('[data-pnx-add-type-label]');
    const titleText = titleInput && titleInput.value.trim()
      ? titleInput.value.trim()
      : (typeLabel && typeLabel.textContent && typeLabel.textContent !== '未設定' ? typeLabel.textContent : '新規予定');

    if (nameEl) nameEl.textContent = colorName(color);
    if (preview) preview.style.setProperty('--pnx-chip-color', hex);
    if (previewTitle) previewTitle.textContent = titleText;

    state.root.querySelectorAll('[data-pnx-color]').forEach(function (btn) {
      btn.classList.toggle('is-selected', btn.getAttribute('data-pnx-color') === color);
    });
  }

  function selectAddColor(color) {
    if (!COLOR[color]) color = 'blue';
    state.addDraft.color = color;
    updateColorPreview();
  }

  function openAddSheet(editEvent, presetRange) {
    if (!state.root) return;
    const layer = state.root.querySelector('[data-pnx-add-layer]');
    if (!layer) return;

    const editing = !!editEvent;
    state.editingEventId = editing ? String(editEvent.id) : null;
    const base = editing ? eventStart(editEvent) : ((presetRange && presetRange.start) ? cloneDate(presetRange.start) : (state.selected || getLocalToday()));
    state.addDraft.start = cloneDate(base);
    state.addDraft.end = editing ? cloneDate(eventEnd(editEvent)) : ((presetRange && presetRange.end) ? cloneDate(presetRange.end) : cloneDate(base));
    state.addDraft.activeRangeField = 'start';
    state.addDraft.pickerYear = base.y;
    state.addDraft.pickerMonth = base.m;
    state.addDraft.color = editing && editEvent.color ? editEvent.color : 'blue';
    updateAddDateText();
    state.root.classList.add('is-add-open');
    layer.classList.add('is-open');
    layer.setAttribute('aria-hidden', 'false');

    const title = state.root.querySelector('[data-pnx-add-title]');
    const place = state.root.querySelector('[data-pnx-add-place]');
    const memo = state.root.querySelector('[data-pnx-add-memo]');
    const typePanel = state.root.querySelector('[data-pnx-type-panel]');
    const typeLabel = state.root.querySelector('[data-pnx-add-type-label]');
    const addTitle = state.root.querySelector('#pnx-add-title');
    const miniSave = state.root.querySelector('.pnx-cal-add-save-mini');
    const bottomSave = state.root.querySelector('.pnx-cal-add-save');

    if (addTitle) addTitle.textContent = editing ? '予定を編集' : '新規予定';
    if (miniSave) miniSave.textContent = editing ? '更新' : '保存';
    if (bottomSave) bottomSave.textContent = editing ? '更新する' : '保存する';
    if (title) title.value = editing ? (editEvent.title || '') : '';
    if (place) place.value = editing ? (editEvent.loc || '') : '';
    if (memo) memo.value = editing ? (editEvent.desc || '') : '';
    if (typeLabel) typeLabel.textContent = editing ? inferEventType(editEvent) : '未設定';
    if (typePanel) typePanel.hidden = true;
    state.root.querySelectorAll('.pnx-cal-type-chip').forEach(function (chip) {
      const typeName = chip.getAttribute('data-pnx-type') || '';
      chip.classList.toggle('is-selected', editing && typeName === inferEventType(editEvent));
    });
    updateColorPreview();
    state.root.querySelectorAll('[data-pnx-notify]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-pnx-notify') === 'なし');
    });

    window.setTimeout(function () {
      if (!title) return;
      try { title.focus({ preventScroll: true }); }
      catch (e) { title.focus(); }
    }, 180);
  }

  function closeAddSheet() {
    if (!state.root) return;
    const layer = state.root.querySelector('[data-pnx-add-layer]');
    state.root.classList.remove('is-add-open');
    if (layer) {
      layer.classList.remove('is-open');
      layer.setAttribute('aria-hidden', 'true');
    }
    state.editingEventId = null;
  }

  function selectAddType(chip) {
    if (!state.root || !chip) return;
    const type = chip.getAttribute('data-pnx-type') || 'その他';
    const label = state.root.querySelector('[data-pnx-add-type-label]');
    state.root.querySelectorAll('.pnx-cal-type-chip').forEach(function (item) { item.classList.toggle('is-selected', item === chip); });
    if (label) label.textContent = type;
    updateColorPreview();

    const title = state.root.querySelector('[data-pnx-add-title]');
    if (title && !title.value.trim()) {
      title.value = type === 'その他' ? '' : type;
      try { title.focus({ preventScroll: true }); }
      catch (e) { title.focus(); }
      title.setSelectionRange(title.value.length, title.value.length);
      updateColorPreview();
    }
  }

  function selectedAddType() {
    if (!state.root) return null;
    const chip = state.root.querySelector('.pnx-cal-type-chip.is-selected');
    if (!chip) return null;
    return {
      title: chip.getAttribute('data-pnx-type') || 'その他'
    };
  }

  function saveAddEvent() {
    if (!state.root || !state.selected) return;
    const titleInput = state.root.querySelector('[data-pnx-add-title]');
    const placeInput = state.root.querySelector('[data-pnx-add-place]');
    const memoInput = state.root.querySelector('[data-pnx-add-memo]');
    const typed = selectedAddType();
    const editId = state.editingEventId;
    const existing = editId ? findEventById(editId) : null;
    const title = titleInput && titleInput.value.trim() ? titleInput.value.trim() : (typed ? typed.title : (existing ? existing.title : '新規予定'));
    const color = selectedAddColor();

    const startDate = state.addDraft.start;
    const endDate = state.addDraft.end || state.addDraft.start;
    const isRange = compareDate(startDate, endDate) !== 0;

    const nextEvent = {
      id: existing ? existing.id : createEventId(),
      y: startDate.y,
      m: startDate.m,
      d: startDate.d,
      endY: endDate.y,
      endM: endDate.m,
      endD: endDate.d,
      time: existing && existing.time ? existing.time : '09:00',
      endTime: existing && existing.endTime ? existing.endTime : '',
      title: title,
      type: typed ? typed.title : (existing ? inferEventType(existing) : 'その他'),
      chipLines: [title],
      chipLabel: title,
      color: color,
      desc: memoInput && memoInput.value.trim() ? memoInput.value.trim() : (isRange ? formatDateJP(startDate, false) + '〜' + formatDateJP(endDate, false) : ''),
      loc: placeInput && placeInput.value.trim() ? placeInput.value.trim() : '',
      locIcon: existing && existing.locIcon ? existing.locIcon : ''
    };

    if (existing) {
      const index = DEMO_EVENTS.findIndex(function (event) { return String(event.id) === String(existing.id); });
      if (index >= 0) DEMO_EVENTS[index] = nextEvent;
    } else {
      DEMO_EVENTS.push(nextEvent);
    }

    persistCalendarEvents();
    state.selected = cloneDate(startDate);
    state.viewYear = startDate.y;
    state.viewMonth = startDate.m;
    closeAddSheet();
    renderAll();
  }


  function openDateRangePicker() {
    if (!state.root) return;
    const sheet = state.root.querySelector('[data-pnx-date-range-sheet]');
    if (!sheet) return;
    state.addDraft.activeRangeField = 'start';
    state.addDraft.pickerYear = state.addDraft.start.y;
    state.addDraft.pickerMonth = state.addDraft.start.m;
    renderDateRangePicker();
    sheet.classList.add('is-open');
    sheet.setAttribute('aria-hidden', 'false');
  }

  function closeDateRangePicker(apply) {
    if (!state.root) return;
    const sheet = state.root.querySelector('[data-pnx-date-range-sheet]');
    if (sheet) {
      sheet.classList.remove('is-open');
      sheet.setAttribute('aria-hidden', 'true');
    }
    if (apply) updateAddDateText();
  }

  function setActiveRangeField(field) {
    state.addDraft.activeRangeField = field === 'end' ? 'end' : 'start';
    renderDateRangePicker();
  }

  function moveRangeMonth(delta) {
    const moved = addMonths(state.addDraft.pickerYear, state.addDraft.pickerMonth, delta);
    state.addDraft.pickerYear = moved.y;
    state.addDraft.pickerMonth = moved.m;
    renderDateRangePicker();
  }

  function selectRangeDate(y, m, d) {
    const picked = { y: y, m: m, d: d };
    if (state.addDraft.activeRangeField === 'start') {
      state.addDraft.start = picked;
      if (compareDate(state.addDraft.end, picked) < 0) state.addDraft.end = cloneDate(picked);
      state.addDraft.activeRangeField = 'end';
    } else {
      state.addDraft.end = picked;
      if (compareDate(picked, state.addDraft.start) < 0) {
        state.addDraft.end = cloneDate(state.addDraft.start);
        state.addDraft.start = picked;
      }
    }
    state.addDraft.pickerYear = y;
    state.addDraft.pickerMonth = m;
    renderDateRangePicker();
  }

  function isBetweenDate(cell, start, end) {
    return compareDate(cell, start) >= 0 && compareDate(cell, end) <= 0;
  }


  function isAnyCalendarOverlayOpen() {
    if (!state.root) return false;
    return state.root.classList.contains('is-add-open') ||
      state.root.classList.contains('is-detail-open') ||
      state.root.classList.contains('is-date-range-open') ||
      isMonthPickerOpen();
  }

  function canStartMonthSwipe(event) {
    if (!state.root || isAnyCalendarOverlayOpen()) return false;
    if (state.drag.active || state.drag.pointerId != null) return false;
    if (state.rangeSelect.active || state.rangeSelect.pointerId != null) return false;
    if (event.target.closest('[data-pnx-event-chip]')) return false;
    if (event.target.closest('[data-pnx-action]')) return false;
    if (event.target.closest('.pnx-cal-add-layer, .pnx-cal-detail-layer, .pnx-cal-date-range-sheet, .pnx-cal-month-popover')) return false;
    const swipeArea = event.target.closest('[data-pnx-grid], .pnx-cal-weekdays');
    return !!(swipeArea && state.root.contains(swipeArea));
  }

  function resetMonthSwipe() {
    state.monthSwipe.pointerId = null;
    state.monthSwipe.startX = 0;
    state.monthSwipe.startY = 0;
    state.monthSwipe.currentX = 0;
    state.monthSwipe.currentY = 0;
    state.monthSwipe.tracking = false;
    state.monthSwipe.canceled = false;
  }

  function commitMonthSwipe(deltaX, deltaY) {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    if (absX < 72) return false;
    if (absY > 46) return false;
    if (absX < absY * 1.6) return false;
    if (deltaX < 0) moveMonth(1);
    else moveMonth(-1);
    state.suppressClickUntil = Date.now() + 360;
    return true;
  }

  function renderDateRangePicker() {
    if (!state.root) return;
    const grid = state.root.querySelector('[data-pnx-date-picker-grid]');
    const monthLabel = state.root.querySelector('[data-pnx-range-month-label]');
    const startLabel = state.root.querySelector('[data-pnx-range-start-label]');
    const endLabel = state.root.querySelector('[data-pnx-range-end-label]');
    if (monthLabel) monthLabel.textContent = state.addDraft.pickerYear + '年 ' + state.addDraft.pickerMonth + '月';
    if (startLabel) startLabel.textContent = formatDateJP(state.addDraft.start, false);
    if (endLabel) endLabel.textContent = formatDateJP(state.addDraft.end, false);
    state.root.querySelectorAll('[data-pnx-range-tab]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-pnx-range-tab') === state.addDraft.activeRangeField);
    });
    if (!grid) return;

    const cells = buildCells(state.addDraft.pickerYear, state.addDraft.pickerMonth);
    grid.innerHTML = cells.map(function (cell, index) {
      const dow = index % 7;
      const dateObj = { y: cell.y, m: cell.m, d: cell.d };
      const cls = ['pnx-cal-date-picker-day'];
      if (cell.other) cls.push('is-other');
      if (dow === 0) cls.push('is-sun');
      if (dow === 6) cls.push('is-sat');
      if (dateKey(cell.y, cell.m, cell.d) === dateKey(state.addDraft.start.y, state.addDraft.start.m, state.addDraft.start.d)) cls.push('is-start');
      if (dateKey(cell.y, cell.m, cell.d) === dateKey(state.addDraft.end.y, state.addDraft.end.m, state.addDraft.end.d)) cls.push('is-end');
      if (compareDate(state.addDraft.start, state.addDraft.end) !== 0 && isBetweenDate(dateObj, state.addDraft.start, state.addDraft.end)) cls.push('is-in-range');
      const todayForPicker = getLocalToday();
      if (dateKey(cell.y, cell.m, cell.d) === dateKey(todayForPicker.y, todayForPicker.m, todayForPicker.d)) cls.push('is-today');
      return '<button type="button" class="' + cls.join(' ') + '" data-y="' + cell.y + '" data-m="' + cell.m + '" data-d="' + cell.d + '"><span>' + cell.d + '</span></button>';
    }).join('');
  }

  function bindEvents() {
    if (state.root.dataset.pnxBound === '1') return;
    state.root.dataset.pnxBound = '1';

    state.root.addEventListener('pointerdown', function (event) {
      if (event.button !== undefined && event.button !== 0) return;
      if (!canStartMonthSwipe(event)) return;
      state.monthSwipe.pointerId = event.pointerId;
      state.monthSwipe.startX = event.clientX;
      state.monthSwipe.startY = event.clientY;
      state.monthSwipe.currentX = event.clientX;
      state.monthSwipe.currentY = event.clientY;
      state.monthSwipe.tracking = true;
      state.monthSwipe.canceled = false;
    });

    window.addEventListener('pointermove', function (event) {
      if (!state.monthSwipe.tracking || state.monthSwipe.pointerId !== event.pointerId) return;
      state.monthSwipe.currentX = event.clientX;
      state.monthSwipe.currentY = event.clientY;
      const dx = event.clientX - state.monthSwipe.startX;
      const dy = event.clientY - state.monthSwipe.startY;
      if (Math.abs(dy) > 48 && Math.abs(dy) > Math.abs(dx)) {
        state.monthSwipe.canceled = true;
        resetMonthSwipe();
        return;
      }
    }, { passive: true });

    window.addEventListener('pointerup', function (event) {
      if (!state.monthSwipe.tracking || state.monthSwipe.pointerId !== event.pointerId) return;
      const dx = event.clientX - state.monthSwipe.startX;
      const dy = event.clientY - state.monthSwipe.startY;
      const shouldCommit = !state.monthSwipe.canceled && !state.drag.active && !state.rangeSelect.active && !isAnyCalendarOverlayOpen();
      resetMonthSwipe();
      if (shouldCommit && commitMonthSwipe(dx, dy)) {
        event.preventDefault();
      }
    }, { passive: false });

    window.addEventListener('pointercancel', function (event) {
      if (!state.monthSwipe.tracking || state.monthSwipe.pointerId !== event.pointerId) return;
      resetMonthSwipe();
    });

    state.root.addEventListener('pointerdown', function (event) {
      const chip = event.target.closest('[data-pnx-event-chip]');
      if (!chip || !state.root.contains(chip)) return;
      if (event.button !== undefined && event.button !== 0) return;
      clearEventDragTimer();
      state.drag.pointerId = event.pointerId;
      state.drag.eventId = chip.getAttribute('data-pnx-event-id') || '';
      state.drag.sourceEl = chip;
      state.drag.startX = event.clientX;
      state.drag.startY = event.clientY;
      state.drag.currentX = event.clientX;
      state.drag.currentY = event.clientY;
      state.drag.active = false;
      state.drag.targetCellKey = '';
      state.drag.targetDate = null;
      state.drag.timer = window.setTimeout(function () {
        beginEventDrag(state.drag.eventId, state.drag.currentX, state.drag.currentY);
      }, 340);
    });

    window.addEventListener('pointermove', function (event) {
      if (state.drag.pointerId == null || event.pointerId !== state.drag.pointerId) return;
      state.drag.currentX = event.clientX;
      state.drag.currentY = event.clientY;
      if (!state.drag.active) {
        if (Math.abs(event.clientX - state.drag.startX) > 10 || Math.abs(event.clientY - state.drag.startY) > 10) {
          clearEventDragTimer();
          state.drag.pointerId = null;
          state.drag.eventId = null;
          state.drag.sourceEl = null;
        }
        return;
      }
      event.preventDefault();
      updateDragGhostPosition(event.clientX, event.clientY);
      updateDropTargetFromPoint(event.clientX, event.clientY);
    }, { passive: false });

    window.addEventListener('pointerup', function (event) {
      if (state.drag.pointerId == null || event.pointerId !== state.drag.pointerId) return;
      if (state.drag.active) {
        event.preventDefault();
        tryCommitEventDrag();
      } else {
        clearEventDragTimer();
        state.drag.pointerId = null;
        state.drag.eventId = null;
        state.drag.sourceEl = null;
      }
    }, { passive: false });

    window.addEventListener('pointercancel', function (event) {
      if (state.drag.pointerId == null || event.pointerId !== state.drag.pointerId) return;
      cancelEventDrag();
    });

    state.root.addEventListener('pointerdown', function (event) {
      if (event.target.closest('[data-pnx-event-chip]')) return;
      const cell = event.target.closest('.pnx-cal-cell');
      if (!cell || !state.root.contains(cell)) return;
      if (event.button !== undefined && event.button !== 0) return;
      const y = Number(cell.getAttribute('data-y'));
      const m = Number(cell.getAttribute('data-m'));
      const d = Number(cell.getAttribute('data-d'));
      if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return;
      clearRangeSelectTimer();
      state.rangeSelect.pointerId = event.pointerId;
      state.rangeSelect.startX = event.clientX;
      state.rangeSelect.startY = event.clientY;
      state.rangeSelect.currentX = event.clientX;
      state.rangeSelect.currentY = event.clientY;
      state.rangeSelect.active = false;
      state.rangeSelect.startDate = { y: y, m: m, d: d };
      state.rangeSelect.endDate = { y: y, m: m, d: d };
      state.rangeSelect.startKey = dateKey(y, m, d);
      state.rangeSelect.timer = window.setTimeout(function () {
        beginCellRangeSelect(y, m, d);
      }, 340);
    });

    window.addEventListener('pointermove', function (event) {
      if (state.rangeSelect.pointerId == null || event.pointerId !== state.rangeSelect.pointerId) return;
      state.rangeSelect.currentX = event.clientX;
      state.rangeSelect.currentY = event.clientY;
      if (!state.rangeSelect.active) {
        if (Math.abs(event.clientX - state.rangeSelect.startX) > 10 || Math.abs(event.clientY - state.rangeSelect.startY) > 10) {
          clearRangeSelectTimer();
          state.rangeSelect.pointerId = null;
          state.rangeSelect.startDate = null;
          state.rangeSelect.endDate = null;
          state.rangeSelect.startKey = '';
        }
        return;
      }
      event.preventDefault();
      updateRangeSelectionFromPoint(event.clientX, event.clientY);
    }, { passive: false });

    window.addEventListener('pointerup', function (event) {
      if (state.rangeSelect.pointerId == null || event.pointerId !== state.rangeSelect.pointerId) return;
      if (state.rangeSelect.active) {
        event.preventDefault();
        tryCommitCellRangeSelect();
      } else {
        clearRangeSelectTimer();
        state.rangeSelect.pointerId = null;
        state.rangeSelect.startDate = null;
        state.rangeSelect.endDate = null;
        state.rangeSelect.startKey = '';
      }
    }, { passive: false });

    window.addEventListener('pointercancel', function (event) {
      if (state.rangeSelect.pointerId == null || event.pointerId !== state.rangeSelect.pointerId) return;
      cancelCellRangeSelect();
    });

    state.root.addEventListener('click', function (event) {
      if (Date.now() < (state.suppressClickUntil || 0)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      const actionEl = event.target.closest('[data-pnx-action]');
      if (actionEl && state.root.contains(actionEl)) {
        const action = actionEl.getAttribute('data-pnx-action');
        if (action === 'prev-month') { moveMonth(-1); return; }
        if (action === 'next-month') { moveMonth(1); return; }
        if (action === 'pick-month') { toggleMonthPicker(); return; }
        if (action === 'month-picker-prev-year') { moveMonthPickerYear(-1); return; }
        if (action === 'month-picker-next-year') { moveMonthPickerYear(1); return; }
        if (action === 'today') {
          const today = getLocalToday();
          closeMonthPicker();
          selectDate(today.y, today.m, today.d);
          return;
        }
        if (action === 'add') {
          const today = getLocalToday();
          openAddSheetForDate(today.y, today.m, today.d);
          return;
        }
        if (action === 'close-add') { closeAddSheet(); return; }
        if (action === 'toggle-type') {
          const panel = state.root.querySelector('[data-pnx-type-panel]');
          if (panel) panel.hidden = !panel.hidden;
          return;
        }
        if (action === 'save-add') { saveAddEvent(); return; }
        if (action === 'open-detail') { openDetailSheet(actionEl.getAttribute('data-pnx-event-id')); return; }
        if (action === 'close-detail') { closeDetailSheet(); return; }
        if (action === 'delete-detail') { deleteSelectedEvent(); return; }
        if (action === 'edit-detail') { openEditSelectedEvent(); return; }
        if (action === 'open-date-range') { openDateRangePicker(); return; }
        if (action === 'cancel-date-range') { closeDateRangePicker(false); return; }
        if (action === 'apply-date-range') { closeDateRangePicker(true); return; }
        if (action === 'range-prev-month') { moveRangeMonth(-1); return; }
        if (action === 'range-next-month') { moveRangeMonth(1); return; }
        if (action === 'range-today') {
          const today = getLocalToday();
          selectRangeDate(today.y, today.m, today.d);
          return;
        }
        if (action === 'noop') { return; }
      }

      const monthOption = event.target.closest('[data-pnx-month-option]');
      if (monthOption && state.root.contains(monthOption)) {
        selectMonthFromPicker(monthOption.getAttribute('data-pnx-month-option'));
        return;
      }

      if (isMonthPickerOpen()) {
        const insideMonthPicker = event.target.closest('[data-pnx-month-popover]');
        const monthTrigger = event.target.closest('[data-pnx-action="pick-month"]');
        if (!insideMonthPicker && !monthTrigger) closeMonthPicker();
      }

      const rangeTab = event.target.closest('[data-pnx-range-tab]');
      if (rangeTab && state.root.contains(rangeTab)) {
        setActiveRangeField(rangeTab.getAttribute('data-pnx-range-tab'));
        return;
      }

      const rangeDay = event.target.closest('.pnx-cal-date-picker-day');
      if (rangeDay && state.root.contains(rangeDay)) {
        selectRangeDate(Number(rangeDay.getAttribute('data-y')), Number(rangeDay.getAttribute('data-m')), Number(rangeDay.getAttribute('data-d')));
        return;
      }

      const typeChip = event.target.closest('.pnx-cal-type-chip');
      if (typeChip && state.root.contains(typeChip)) {
        selectAddType(typeChip);
        return;
      }

      const colorDot = event.target.closest('[data-pnx-color]');
      if (colorDot && state.root.contains(colorDot)) {
        selectAddColor(colorDot.getAttribute('data-pnx-color'));
        return;
      }

      const notifyBtn = event.target.closest('[data-pnx-notify]');
      if (notifyBtn && state.root.contains(notifyBtn)) {
        state.root.querySelectorAll('[data-pnx-notify]').forEach(function (btn) { btn.classList.toggle('is-active', btn === notifyBtn); });
        return;
      }

      const eventCard = event.target.closest('.pnx-cal-event-card');
      if (eventCard && state.root.contains(eventCard)) {
        openDetailSheet(eventCard.getAttribute('data-pnx-event-id'));
        return;
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
        const key = dateKey(y, m, d);
        const now = Date.now();
        const isDoubleTap = event.detail >= 2 || (state.lastCalendarTap.key === key && now - state.lastCalendarTap.time <= 360);
        if (isDoubleTap) {
          state.lastCalendarTap = { key: '', time: 0 };
          openAddSheetForDate(y, m, d);
          return;
        }
        state.lastCalendarTap = { key: key, time: now };
        selectDate(y, m, d);
      }
    });

    state.root.addEventListener('input', function (event) {
      if (event.target && event.target.matches('[data-pnx-add-title]')) {
        updateColorPreview();
      }
    });
  }


  /* =========================================================
     v4.15 override — 日付/時間ホイールピッカー
     ========================================================= */
  function normalizeTimeString(value, fallback) {
    var source = String(value || fallback || '00:00');
    var match = source.match(/^(\d{1,2}):(\d{1,2})$/);
    if (!match) return fallback || '00:00';
    var h = Math.max(0, Math.min(23, Number(match[1])));
    var m = Math.max(0, Math.min(59, Number(match[2])));
    return pad2(h) + ':' + pad2(m);
  }

  function parseTimeString(value) {
    var safe = normalizeTimeString(value, '00:00').split(':');
    return { h: Number(safe[0]), m: Number(safe[1]) };
  }

  function buildTimeString(h, m) {
    return pad2(Math.max(0, Math.min(23, Number(h) || 0))) + ':' + pad2(Math.max(0, Math.min(59, Number(m) || 0)));
  }

  function compareTimeStrings(a, b) {
    return normalizeTimeString(a, '00:00').localeCompare(normalizeTimeString(b, '00:00'));
  }

  function ensureAddDraftDateTime() {
    if (!state.addDraft.startTime) state.addDraft.startTime = '09:00';
    if (!state.addDraft.endTime) state.addDraft.endTime = '10:00';
    if (typeof state.addDraft.allDay !== 'boolean') state.addDraft.allDay = false;
    if (!state.addDraft.minuteStep) state.addDraft.minuteStep = 15;
  }

  function formatDateShort(obj) {
    var dow = new Date(obj.y, obj.m - 1, obj.d).getDay();
    return obj.m + '/' + obj.d + '(' + WEEK[dow] + ')';
  }

  function formatAddDateTimeSummary() {
    ensureAddDraftDateTime();
    var start = state.addDraft.start;
    var end = state.addDraft.end || state.addDraft.start;
    if (state.addDraft.allDay) {
      if (compareDate(start, end) === 0) return formatDateJP(start, true) + '　終日';
      return formatDateJP(start, true) + ' 〜 ' + formatDateJP(end, true) + '　終日';
    }
    if (compareDate(start, end) === 0) {
      return formatDateJP(start, true) + '　' + state.addDraft.startTime + '〜' + state.addDraft.endTime;
    }
    return formatDateJP(start, true) + '　' + state.addDraft.startTime + ' 〜 ' + formatDateJP(end, true) + '　' + state.addDraft.endTime;
  }

  function formatAddTimeSummary() {
    ensureAddDraftDateTime();
    return state.addDraft.allDay ? '終日' : (state.addDraft.startTime + '〜' + state.addDraft.endTime);
  }

  function updateAddDateText() {
    if (!state.root) return;
    ensureAddDraftDateTime();
    var dateEl = state.root.querySelector('[data-pnx-add-date]');
    var timeEl = state.root.querySelector('[data-pnx-add-time]');
    if (dateEl) dateEl.textContent = formatAddDateTimeSummary();
    if (timeEl) timeEl.textContent = formatAddTimeSummary();
  }

  function formatEventDateTime(event) {
    var start = eventStart(event);
    var end = eventEnd(event);
    var allDay = !!event.allDay;
    var startTime = normalizeTimeString(event.time, '09:00');
    var endTime = normalizeTimeString(event.endTime || event.time || '10:00', '10:00');
    var dateText = compareDate(start, end) === 0 ? formatDateJP(start, true) : (formatDateJP(start, true) + ' 〜 ' + formatDateJP(end, true));
    if (allDay) return dateText + '　終日';
    if (compareDate(start, end) === 0) return dateText + '　' + startTime + '〜' + endTime;
    return formatDateJP(start, true) + '　' + startTime + ' 〜 ' + formatDateJP(end, true) + '　' + endTime;
  }

  function openAddSheet(editEvent, presetRange) {
    if (!state.root) return;
    ensureAddDraftDateTime();
    var layer = state.root.querySelector('[data-pnx-add-layer]');
    if (!layer) return;
    var editing = !!editEvent;
    state.editingEventId = editing ? String(editEvent.id) : null;
    var base = editing ? eventStart(editEvent) : ((presetRange && presetRange.start) ? cloneDate(presetRange.start) : (state.selected || getLocalToday()));
    state.addDraft.start = cloneDate(base);
    state.addDraft.end = editing ? cloneDate(eventEnd(editEvent)) : ((presetRange && presetRange.end) ? cloneDate(presetRange.end) : cloneDate(base));
    state.addDraft.activeRangeField = 'start';
    state.addDraft.pickerYear = base.y;
    state.addDraft.pickerMonth = base.m;
    state.addDraft.color = editing && editEvent.color ? editEvent.color : 'blue';
    state.addDraft.startTime = editing ? normalizeTimeString(editEvent.time || '09:00', '09:00') : '09:00';
    state.addDraft.endTime = editing ? normalizeTimeString(editEvent.endTime || '10:00', '10:00') : '10:00';
    state.addDraft.allDay = editing ? !!editEvent.allDay : false;
    updateAddDateText();
    state.root.classList.add('is-add-open');
    layer.classList.add('is-open');
    layer.setAttribute('aria-hidden', 'false');

    var title = state.root.querySelector('[data-pnx-add-title]');
    var place = state.root.querySelector('[data-pnx-add-place]');
    var memo = state.root.querySelector('[data-pnx-add-memo]');
    var typePanel = state.root.querySelector('[data-pnx-type-panel]');
    var typeLabel = state.root.querySelector('[data-pnx-add-type-label]');
    var addTitle = state.root.querySelector('#pnx-add-title');
    var miniSave = state.root.querySelector('.pnx-cal-add-save-mini');
    var bottomSave = state.root.querySelector('.pnx-cal-add-save');

    if (addTitle) addTitle.textContent = editing ? '予定を編集' : '新規予定';
    if (miniSave) miniSave.textContent = editing ? '更新' : '保存';
    if (bottomSave) bottomSave.textContent = editing ? '更新する' : '保存する';
    if (title) title.value = editing ? (editEvent.title || '') : '';
    if (place) place.value = editing ? (editEvent.loc || '') : '';
    if (memo) memo.value = editing ? (editEvent.desc || '') : '';
    if (typeLabel) typeLabel.textContent = editing ? inferEventType(editEvent) : '未設定';
    if (typePanel) typePanel.hidden = true;
    state.root.querySelectorAll('.pnx-cal-type-chip').forEach(function (chip) {
      var typeName = chip.getAttribute('data-pnx-type') || '';
      chip.classList.toggle('is-selected', editing && typeName === inferEventType(editEvent));
    });
    updateColorPreview();
    state.root.querySelectorAll('[data-pnx-notify]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-pnx-notify') === 'なし');
    });

    window.setTimeout(function () {
      if (!title) return;
      try { title.focus({ preventScroll: true }); }
      catch (e) { title.focus(); }
    }, 180);
  }

  function saveAddEvent() {
    if (!state.root || !state.selected) return;
    ensureAddDraftDateTime();
    var titleInput = state.root.querySelector('[data-pnx-add-title]');
    var placeInput = state.root.querySelector('[data-pnx-add-place]');
    var memoInput = state.root.querySelector('[data-pnx-add-memo]');
    var typed = selectedAddType();
    var editId = state.editingEventId;
    var existing = editId ? findEventById(editId) : null;
    var title = titleInput && titleInput.value.trim() ? titleInput.value.trim() : (typed ? typed.title : (existing ? existing.title : '新規予定'));
    var color = selectedAddColor();

    var startDate = state.addDraft.start;
    var endDate = state.addDraft.end || state.addDraft.start;
    var startTime = normalizeTimeString(state.addDraft.startTime || (existing && existing.time) || '09:00', '09:00');
    var endTime = normalizeTimeString(state.addDraft.endTime || (existing && existing.endTime) || '10:00', '10:00');
    var allDay = !!state.addDraft.allDay;

    if (compareDate(endDate, startDate) < 0) endDate = cloneDate(startDate);
    if (compareDate(startDate, endDate) === 0 && !allDay && compareTimeStrings(endTime, startTime) < 0) {
      endTime = startTime;
    }

    var isRange = compareDate(startDate, endDate) !== 0;
    var nextEvent = {
      id: existing ? existing.id : createEventId(),
      y: startDate.y,
      m: startDate.m,
      d: startDate.d,
      endY: endDate.y,
      endM: endDate.m,
      endD: endDate.d,
      time: allDay ? '00:00' : startTime,
      endTime: allDay ? '00:00' : endTime,
      allDay: allDay,
      title: title,
      type: typed ? typed.title : (existing ? inferEventType(existing) : 'その他'),
      chipLines: [title],
      chipLabel: title,
      color: color,
      desc: memoInput && memoInput.value.trim() ? memoInput.value.trim() : (isRange ? formatDateJP(startDate, false) + '〜' + formatDateJP(endDate, false) : ''),
      loc: placeInput && placeInput.value.trim() ? placeInput.value.trim() : '',
      locIcon: existing && existing.locIcon ? existing.locIcon : ''
    };

    if (existing) {
      var index = DEMO_EVENTS.findIndex(function (event) { return String(event.id) === String(existing.id); });
      if (index >= 0) DEMO_EVENTS[index] = nextEvent;
    } else {
      DEMO_EVENTS.push(nextEvent);
    }

    persistCalendarEvents();
    state.selected = cloneDate(startDate);
    state.viewYear = startDate.y;
    state.viewMonth = startDate.m;
    closeAddSheet();
    renderAll();
  }

  function createDateTimeTempFromDraft() {
    ensureAddDraftDateTime();
    return {
      start: cloneDate(state.addDraft.start),
      end: cloneDate(state.addDraft.end || state.addDraft.start),
      startTime: normalizeTimeString(state.addDraft.startTime, '09:00'),
      endTime: normalizeTimeString(state.addDraft.endTime, '10:00'),
      allDay: !!state.addDraft.allDay,
      minuteStep: Number(state.addDraft.minuteStep || 15),
      activeField: 'start',
      dateItems: [], hourItems: [], minuteItems: []
    };
  }

  function activeDateTimeDate() {
    var temp = state.dateTimeTemp || createDateTimeTempFromDraft();
    return temp.activeField === 'end' ? temp.end : temp.start;
  }

  function activeDateTimeTime() {
    var temp = state.dateTimeTemp || createDateTimeTempFromDraft();
    return temp.activeField === 'end' ? temp.endTime : temp.startTime;
  }

  function buildDateWheelItems(centerDate) {
    var items = [];
    for (var i = -45; i <= 45; i += 1) {
      var dateObj = addDaysToDateObj(centerDate, i);
      items.push(dateObj);
    }
    return items;
  }

  function renderWheelItems(items, selectedIndex, kind) {
    return items.map(function (item, index) {
      var label = '';
      if (kind === 'date') {
        var today = getLocalToday();
        if (dateKey(item.y, item.m, item.d) === dateKey(today.y, today.m, today.d)) label = '今日';
        else label = item.m + '月' + item.d + '日 ' + WEEK[new Date(item.y, item.m - 1, item.d).getDay()];
      } else if (kind === 'hour') {
        label = pad2(item) + '時';
      } else {
        label = pad2(item) + '分';
      }
      return '<div class="pnx-cal-dt-item ' + (kind === 'date' ? 'is-date ' : '') + (index === selectedIndex ? 'is-selected' : '') + '" data-pnx-dt-item data-kind="' + kind + '" data-index="' + index + '">' + escapeHtml(label) + '</div>';
    }).join('');
  }

  function wheelSelectedIndex(kind) {
    var temp = state.dateTimeTemp || createDateTimeTempFromDraft();
    if (kind === 'date') {
      var activeDate = activeDateTimeDate();
      return temp.dateItems.findIndex(function (item) { return dateKey(item.y, item.m, item.d) === dateKey(activeDate.y, activeDate.m, activeDate.d); });
    }
    var time = parseTimeString(activeDateTimeTime());
    if (kind === 'hour') return temp.hourItems.indexOf(time.h);
    return temp.minuteItems.indexOf(time.m);
  }

  function lockAndScrollWheel(el, index) {
    if (!el) return;
    var itemHeight = 42;
    el.dataset.lock = '1';
    el.scrollTop = Math.max(0, index * itemHeight);
    window.setTimeout(function () { delete el.dataset.lock; }, 120);
  }

  function updateDateTimeSummaryUI() {
    if (!state.root || !state.dateTimeTemp) return;
    var temp = state.dateTimeTemp;
    var startEl = state.root.querySelector('[data-pnx-dt-start-summary]');
    var endEl = state.root.querySelector('[data-pnx-dt-end-summary]');
    var allDayBtn = state.root.querySelector('.pnx-cal-dt-allday');
    if (startEl) startEl.textContent = formatDateShort(temp.start) + (temp.allDay ? '' : ' ' + temp.startTime);
    if (endEl) endEl.textContent = formatDateShort(temp.end) + (temp.allDay ? '' : ' ' + temp.endTime);
    state.root.querySelectorAll('[data-pnx-dt-field]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-pnx-dt-field') === temp.activeField);
    });
    if (allDayBtn) allDayBtn.classList.toggle('is-active', temp.allDay);
    state.root.querySelectorAll('[data-pnx-minute-step]').forEach(function (btn) {
      btn.classList.toggle('is-active', Number(btn.getAttribute('data-pnx-minute-step')) === Number(temp.minuteStep));
    });
  }

  function renderDateRangePicker() {
    if (!state.root) return;
    if (!state.dateTimeTemp) state.dateTimeTemp = createDateTimeTempFromDraft();
    var temp = state.dateTimeTemp;
    var sheet = state.root.querySelector('[data-pnx-date-range-sheet]');
    if (!sheet) return;
    var activeDate = activeDateTimeDate();
    var activeTime = parseTimeString(activeDateTimeTime());
    temp.dateItems = buildDateWheelItems(activeDate);
    temp.hourItems = Array.from({ length: 24 }, function (_, i) { return i; });
    temp.minuteItems = [];
    for (var minute = 0; minute < 60; minute += Number(temp.minuteStep || 15)) temp.minuteItems.push(minute);
    if (temp.minuteItems.indexOf(activeTime.m) === -1) {
      var rounded = temp.minuteItems.reduce(function (prev, curr) {
        return Math.abs(curr - activeTime.m) < Math.abs(prev - activeTime.m) ? curr : prev;
      }, temp.minuteItems[0] || 0);
      if (temp.activeField === 'start') temp.startTime = buildTimeString(activeTime.h, rounded);
      else temp.endTime = buildTimeString(activeTime.h, rounded);
      activeTime.m = rounded;
    }

    var dateList = state.root.querySelector('[data-pnx-picker-date-list]');
    var hourList = state.root.querySelector('[data-pnx-picker-hour-list]');
    var minuteList = state.root.querySelector('[data-pnx-picker-minute-list]');
    var grid = state.root.querySelector('.pnx-cal-dt-wheel-grid');
    var timeCols = state.root.querySelectorAll('[data-pnx-dt-time-col]');
    var stepRow = state.root.querySelector('.pnx-cal-dt-step-row');
    if (dateList) dateList.innerHTML = renderWheelItems(temp.dateItems, wheelSelectedIndex('date'), 'date');
    if (hourList) hourList.innerHTML = renderWheelItems(temp.hourItems, wheelSelectedIndex('hour'), 'hour');
    if (minuteList) minuteList.innerHTML = renderWheelItems(temp.minuteItems, wheelSelectedIndex('minute'), 'minute');
    if (grid) grid.style.gridTemplateColumns = temp.allDay ? '1fr' : '1.55fr .8fr .8fr';
    timeCols.forEach(function (col) { col.hidden = temp.allDay; });
    if (stepRow) stepRow.hidden = temp.allDay;
    updateDateTimeSummaryUI();
    window.requestAnimationFrame(function () {
      lockAndScrollWheel(dateList, wheelSelectedIndex('date'));
      lockAndScrollWheel(hourList, wheelSelectedIndex('hour'));
      lockAndScrollWheel(minuteList, wheelSelectedIndex('minute'));
    });
  }

  function setActiveRangeField(field) {
    if (!state.dateTimeTemp) state.dateTimeTemp = createDateTimeTempFromDraft();
    state.dateTimeTemp.activeField = field === 'end' ? 'end' : 'start';
    renderDateRangePicker();
  }

  function applyWheelSelection(kind, index) {
    if (!state.dateTimeTemp) return;
    var temp = state.dateTimeTemp;
    if (kind === 'date') {
      var picked = temp.dateItems[index];
      if (!picked) return;
      if (temp.activeField === 'start') temp.start = cloneDate(picked); else temp.end = cloneDate(picked);
    } else {
      var source = parseTimeString(activeDateTimeTime());
      if (kind === 'hour') source.h = temp.hourItems[index];
      else source.m = temp.minuteItems[index];
      var next = buildTimeString(source.h, source.m);
      if (temp.activeField === 'start') temp.startTime = next; else temp.endTime = next;
    }
    updateDateTimeSummaryUI();
    var sheet = state.root.querySelector('[data-pnx-date-range-sheet]');
    if (sheet) {
      var dateList = state.root.querySelector('[data-pnx-picker-date-list]');
      var hourList = state.root.querySelector('[data-pnx-picker-hour-list]');
      var minuteList = state.root.querySelector('[data-pnx-picker-minute-list]');
      [dateList, hourList, minuteList].forEach(function (list, listIndex) {
        if (!list) return;
        var kindName = listIndex === 0 ? 'date' : (listIndex === 1 ? 'hour' : 'minute');
        var selected = wheelSelectedIndex(kindName);
        list.querySelectorAll('[data-pnx-dt-item]').forEach(function (item, idx) {
          item.classList.toggle('is-selected', idx === selected);
        });
      });
    }
  }

  function syncWheelFromScroll(kind, el) {
    if (!state.dateTimeTemp || !el) return;
    var itemHeight = 42;
    var index = Math.round(el.scrollTop / itemHeight);
    var length = kind === 'date' ? state.dateTimeTemp.dateItems.length : (kind === 'hour' ? state.dateTimeTemp.hourItems.length : state.dateTimeTemp.minuteItems.length);
    index = Math.max(0, Math.min(length - 1, index));
    applyWheelSelection(kind, index);
    lockAndScrollWheel(el, index);
  }

  function openDateRangePicker() {
    if (!state.root) return;
    var sheet = state.root.querySelector('[data-pnx-date-range-sheet]');
    if (!sheet) return;
    state.dateTimeTemp = createDateTimeTempFromDraft();
    state.root.classList.add('is-date-range-open');
    renderDateRangePicker();
    sheet.classList.add('is-open');
    sheet.setAttribute('aria-hidden', 'false');
  }

  function closeDateRangePicker(apply) {
    if (!state.root) return;
    var sheet = state.root.querySelector('[data-pnx-date-range-sheet]');
    if (apply && state.dateTimeTemp) {
      var temp = state.dateTimeTemp;
      if (compareDate(temp.end, temp.start) < 0) temp.end = cloneDate(temp.start);
      if (compareDate(temp.start, temp.end) === 0 && !temp.allDay && compareTimeStrings(temp.endTime, temp.startTime) < 0) temp.endTime = temp.startTime;
      state.addDraft.start = cloneDate(temp.start);
      state.addDraft.end = cloneDate(temp.end);
      state.addDraft.startTime = normalizeTimeString(temp.startTime, '09:00');
      state.addDraft.endTime = normalizeTimeString(temp.endTime, '10:00');
      state.addDraft.allDay = !!temp.allDay;
      state.addDraft.minuteStep = Number(temp.minuteStep || 15);
      updateAddDateText();
    }
    if (sheet) {
      sheet.classList.remove('is-open');
      sheet.setAttribute('aria-hidden', 'true');
    }
    state.root.classList.remove('is-date-range-open');
    state.dateTimeTemp = null;
  }

  function bindDateTimeWheelEvents() {
    if (!state.root || state.root.dataset.pnxDtBound === '1') return;
    state.root.dataset.pnxDtBound = '1';
    ['date', 'hour', 'minute'].forEach(function (kind) {
      var selector = kind === 'date' ? '[data-pnx-picker-date-list]' : (kind === 'hour' ? '[data-pnx-picker-hour-list]' : '[data-pnx-picker-minute-list]');
      var el = state.root.querySelector(selector);
      if (!el) return;
      el.addEventListener('scroll', function () {
        if (el.dataset.lock === '1') return;
        window.clearTimeout(el._pnxTimer);
        el._pnxTimer = window.setTimeout(function () { syncWheelFromScroll(kind, el); }, 70);
      }, { passive: true });
    });

    state.root.addEventListener('click', function (event) {
      var fieldBtn = event.target.closest('[data-pnx-dt-field]');
      if (fieldBtn && state.root.contains(fieldBtn)) {
        setActiveRangeField(fieldBtn.getAttribute('data-pnx-dt-field'));
        return;
      }
      var stepBtn = event.target.closest('[data-pnx-minute-step]');
      if (stepBtn && state.root.contains(stepBtn)) {
        if (!state.dateTimeTemp) return;
        state.dateTimeTemp.minuteStep = Number(stepBtn.getAttribute('data-pnx-minute-step')) || 15;
        renderDateRangePicker();
        return;
      }
      var item = event.target.closest('[data-pnx-dt-item]');
      if (item && state.root.contains(item)) {
        var kind = item.getAttribute('data-kind');
        var index = Number(item.getAttribute('data-index'));
        applyWheelSelection(kind, index);
        var list = item.closest('.pnx-cal-dt-wheel');
        lockAndScrollWheel(list, index);
        return;
      }
      var allDayBtn = event.target.closest('[data-pnx-action="toggle-all-day"]');
      if (allDayBtn && state.root.contains(allDayBtn)) {
        if (!state.dateTimeTemp) return;
        state.dateTimeTemp.allDay = !state.dateTimeTemp.allDay;
        renderDateRangePicker();
      }
    });
  }

  function renderSheet() {
    var dateEl = state.root.querySelector('[data-pnx-sheet-date]');
    var list = state.root.querySelector('[data-pnx-sheet-list]');
    if (!dateEl || !list || !state.selected) return;

    ensureEventIds();
    var y = state.selected.y;
    var m = state.selected.m;
    var d = state.selected.d;
    var dow = new Date(y, m - 1, d).getDay();
    dateEl.textContent = m + '月' + d + '日（' + WEEK[dow] + '）';

    var items = eventsOn(y, m, d).sort(sortByTime);
    if (!items.length) {
      list.innerHTML = '<div class="pnx-cal-empty">予定はありません</div>';
      return;
    }

    list.innerHTML = items.map(function (event) {
      var color = COLOR[event.color] || event.color || '#0a74ff';
      var place = event.loc ? '<div class="pnx-cal-event-place">' + locationIcon(event.locIcon) + '<span>' + escapeHtml(event.loc) + '</span></div>' : '<div class="pnx-cal-event-place"></div>';
      var timeLabel = event.allDay ? '終日' : escapeHtml(normalizeTimeString(event.time, '09:00'));
      return '' +
        '<article class="pnx-cal-event-card" tabindex="0" role="button" data-pnx-event-id="' + escapeHtml(event.id) + '" style="--pnx-event-color:' + escapeHtml(color) + '">' +
          '<div class="pnx-cal-event-time">' + timeLabel + '</div>' +
          '<div class="pnx-cal-event-main">' +
            '<div class="pnx-cal-event-title">' + escapeHtml(event.title) + '</div>' +
            (event.desc ? '<div class="pnx-cal-event-desc">' + escapeHtml(event.desc) + '</div>' : '<div class="pnx-cal-event-desc"></div>') +
          '</div>' +
          place +
          '<button class="pnx-cal-event-menu" type="button" data-pnx-action="open-detail" data-pnx-event-id="' + escapeHtml(event.id) + '" aria-label="予定の詳細を開く">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.75"></circle><circle cx="12" cy="12" r="1.75"></circle><circle cx="12" cy="19" r="1.75"></circle></svg>' +
          '</button>' +
        '</article>';
    }).join('');
  }


  function buildTournamentCalendarEvent(tournament) {
    if (!tournament || typeof tournament !== 'object') return null;
    const rawId = tournament.id || tournament.tournamentId || tournament.name;
    if (!rawId) return null;
    const start = parseISODate(tournament.start || tournament.startDate || tournament.date);
    if (!start) return null;
    let end = parseISODate(tournament.end || tournament.endDate) || cloneDate(start);
    if (compareDate(end, start) < 0) end = cloneDate(start);

    const organizer = tournament.organizer || '不明';
    const entryDeadline = tournament.entryDeadline || '不明';
    const prize = tournament.prize || '不明';
    const entryFee = tournament.entryFee || '不明';
    const qualification = tournament.qualification || '';
    const descLines = [
      '大会名：' + (tournament.name || '名称未設定'),
      '主催：' + organizer,
      'エントリー締切：' + entryDeadline,
      '賞金：' + prize,
      'エントリー費：' + entryFee
    ];
    if (qualification) descLines.push('出場資格：' + qualification);

    return {
      id: 'tournament-' + String(rawId),
      source: 'search-module',
      tournamentId: String(rawId),
      y: start.y,
      m: start.m,
      d: start.d,
      endY: end.y,
      endM: end.m,
      endD: end.d,
      time: '00:00',
      endTime: '00:00',
      allDay: true,
      title: tournament.name || '大会予定',
      type: '試合',
      category: 'tournament',
      chipLines: [tournament.name || '大会予定'],
      chipLabel: tournament.name || '大会予定',
      color: 'blue',
      desc: descLines.join('\n'),
      loc: tournament.course || tournament.venue || '',
      locIcon: 'pin',
      prefecture: tournament.prefecture || '',
      organizer: organizer,
      entryDeadline: entryDeadline,
      prize: prize,
      entryFee: entryFee,
      rawTournament: Object.assign({}, tournament)
    };
  }

  function addTournamentToCalendar(tournament, options) {
    const nextEvent = buildTournamentCalendarEvent(tournament);
    if (!nextEvent) {
      return { ok: false, reason: 'invalid-tournament' };
    }

    ensureEventIds();
    const existing = findEventById(nextEvent.id);
    if (existing) {
      if (options && options.select !== false) {
        const start = eventStart(existing);
        state.selected = cloneDate(start);
        state.viewYear = start.y;
        state.viewMonth = start.m;
        if (state.root) renderAll();
      }
      return { ok: true, duplicate: true, event: existing };
    }

    DEMO_EVENTS.push(nextEvent);
    persistCalendarEvents();

    if (options && options.select !== false) {
      state.selected = { y: nextEvent.y, m: nextEvent.m, d: nextEvent.d };
      state.viewYear = nextEvent.y;
      state.viewMonth = nextEvent.m;
    }

    if (state.root) renderAll();
    try {
      window.dispatchEvent(new CustomEvent('PNX_CALENDAR_TOURNAMENT_ADDED', { detail: { event: nextEvent, tournament: tournament } }));
    } catch (e) {}

    return { ok: true, duplicate: false, event: nextEvent };
  }

  window.PNXCalendarAddTournamentEvent = addTournamentToCalendar;
  window.PNXCalendarBuildTournamentEvent = buildTournamentCalendarEvent;
  window.PNXCalendarGetEvents = function () {
    return DEMO_EVENTS.map(function (event) { return Object.assign({}, event); });
  };
  window.renderAllPanels = function () {
    if (!state.root) return false;
    renderAll();
    return true;
  };
  window.renderCalList = function () {
    if (!state.root) return false;
    renderSheet();
    return true;
  };


  window.initProNexaCalendarV2 = function initProNexaCalendarV2(options) {
    const root = (options && options.root) || document.querySelector('[data-pnx-calendar-v2]') || document.querySelector('.pnx-calendar-v2');
    if (!root) return;

    state.root = root;

    const initialEvents = (options && Array.isArray(options.events)) ? options.events : DEMO_EVENTS;
    const storedEvents = loadCalendarEventsFromStorage();
    DEMO_EVENTS = mergeCalendarEvents(initialEvents, storedEvents);
    ensureEventIds();
    if (options && options.initialDate) {
      const init = options.initialDate;
      state.viewYear = init.y || state.viewYear;
      state.viewMonth = init.m || state.viewMonth;
      state.selected = { y: state.viewYear, m: state.viewMonth, d: init.d || 1 };
    } else {
      const today = getLocalToday();
      state.viewYear = today.y;
      state.viewMonth = today.m;
      state.selected = { y: today.y, m: today.m, d: today.d };
      state.monthPickerYear = today.y;
      state.addDraft.start = { y: today.y, m: today.m, d: today.d };
      state.addDraft.end = { y: today.y, m: today.m, d: today.d };
      state.addDraft.pickerYear = today.y;
      state.addDraft.pickerMonth = today.m;
    }

    bindEvents();
    bindDateTimeWheelEvents();
    renderAll();
  };
})();
