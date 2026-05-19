/* ============================================
   ProNexaX  /  Daily View  -  Logic
   ============================================ */

(function () {
  'use strict';

  const SELECTED = new Date(2026, 4, 19); // 2026/5/19 (火)
  const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

  function startOfWeek(d) {
    const out = new Date(d);
    out.setDate(out.getDate() - out.getDay());
    out.setHours(0, 0, 0, 0);
    return out;
  }

  function renderWeek() {
    const root = document.getElementById('weekStrip');
    if (!root) return;
    root.innerHTML = '';

    const base = startOfWeek(SELECTED);

    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);

      const cell = document.createElement('button');
      cell.className = 'week-cell';
      if (d.getDay() === 0) cell.classList.add('week-cell--sun');
      if (d.getDay() === 6) cell.classList.add('week-cell--sat');
      if (
        d.getFullYear() === SELECTED.getFullYear() &&
        d.getMonth() === SELECTED.getMonth() &&
        d.getDate() === SELECTED.getDate()
      ) {
        cell.classList.add('week-cell--active');
      }

      const dow = document.createElement('span');
      dow.className = 'week-cell__dow';
      dow.textContent = DOW_LABELS[d.getDay()];

      const num = document.createElement('span');
      num.className = 'week-cell__num';
      num.textContent = d.getDate();

      cell.appendChild(dow);
      cell.appendChild(num);

      cell.addEventListener('click', () => {
        document.querySelectorAll('.week-cell').forEach(c => c.classList.remove('week-cell--active'));
        cell.classList.add('week-cell--active');
      });

      root.appendChild(cell);
    }
  }

  function bindTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => {
      t.addEventListener('click', () => {
        tabs.forEach(x => x.classList.remove('tab--active'));
        t.classList.add('tab--active');
      });
    });
  }

  function bindTabbar() {
    const items = document.querySelectorAll('.tabbar__item');
    items.forEach(it => {
      it.addEventListener('click', () => {
        if (it.classList.contains('tabbar__item--center')) return;
        items.forEach(x => x.classList.remove('tabbar__item--active'));
        it.classList.add('tabbar__item--active');
      });
    });
  }

  function bindTodayBtn() {
    const btn = document.querySelector('.hero__today');
    if (!btn) return;
    btn.addEventListener('click', () => {
      btn.style.opacity = '0.5';
      setTimeout(() => (btn.style.opacity = ''), 200);
    });
  }

  function bindFab() {
    const fab = document.getElementById('fab');
    if (!fab) return;
    fab.addEventListener('click', () => {
      const startCard = document.querySelector('.event-card--start');
      if (!startCard) return;
      startCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      startCard.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(1.02)' },
          { transform: 'scale(1)' },
        ],
        { duration: 600, easing: 'cubic-bezier(.16,.84,.44,1)' }
      );
    });
  }

  function liveClock() {
    const el = document.querySelector('.status-bar__time');
    if (!el) return;
    function tick() {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      el.textContent = `${hh}:${mm}`;
    }
    tick();
    setInterval(tick, 30000);
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderWeek();
    bindTabs();
    bindTabbar();
    bindTodayBtn();
    bindFab();
    liveClock();
  });
})();
