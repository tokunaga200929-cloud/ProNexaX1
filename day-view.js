/* ============================================
   ProNexaX  /  Daily View  -  Logic
   ============================================ */

(function () {
  'use strict';

  // ----- Configuration -----
  // 表示中の日付（基準）。実運用では URL パラメータ等から受け取る想定。
  const SELECTED = new Date(2026, 4, 19); // 2026/5/19 (火)

  // ----- Helpers -----
  const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

  function startOfWeek(d) {
    // 日曜始まり
    const out = new Date(d);
    out.setDate(out.getDate() - out.getDay());
    out.setHours(0, 0, 0, 0);
    return out;
  }

  function fmtTitle(d) {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 (${DOW_LABELS[d.getDay()]})`;
  }

  // ----- Render Week Strip -----
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
        // 実運用では日付ベースで再描画
      });

      root.appendChild(cell);
    }
  }

  // ----- Tabs -----
  function bindTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => {
      t.addEventListener('click', () => {
        tabs.forEach(x => x.classList.remove('tab--active'));
        t.classList.add('tab--active');
      });
    });
  }

  // ----- Tabbar -----
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

  // ----- Today Button -----
  function bindTodayBtn() {
    const btn = document.querySelector('.today-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      // 実運用では今日へジャンプ
      btn.style.transform = 'scale(0.96)';
      setTimeout(() => (btn.style.transform = ''), 120);
    });
  }

  // ----- FAB → 新規予定（スタート時刻入力デモ） -----
  function bindFab() {
    const fab = document.getElementById('fab');
    if (!fab) return;
    fab.addEventListener('click', () => {
      // 想定機能：スタート時間を入力 → 7:42 位置に赤いスタートカードを配置
      // ここでは既存のスタートカードをハイライトする軽いデモにとどめる
      const startCard = document.querySelector('.event-card--start');
      if (!startCard) return;
      startCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      startCard.animate(
        [
          { transform: 'scale(1)', boxShadow: '0 2px 10px rgba(220,53,69,0.10)' },
          { transform: 'scale(1.025)', boxShadow: '0 6px 20px rgba(220,53,69,0.28)' },
          { transform: 'scale(1)', boxShadow: '0 2px 10px rgba(220,53,69,0.10)' },
        ],
        { duration: 700, easing: 'cubic-bezier(.16,.84,.44,1)' }
      );
    });
  }

  // ----- Status bar clock (live) -----
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

  // ----- Date title click → 月カレンダーへ戻る想定 -----
  function bindDateTitle() {
    const t = document.getElementById('dateTitle');
    if (!t) return;
    t.addEventListener('click', () => {
      // 実運用では月ビューに遷移
    });
  }

  // ----- Init -----
  document.addEventListener('DOMContentLoaded', () => {
    renderWeek();
    bindTabs();
    bindTabbar();
    bindTodayBtn();
    bindFab();
    bindDateTitle();
    liveClock();

    // 起動時に 7:42 スタートを少しだけ目立たせる（一度だけ）
    setTimeout(() => {
      const startCard = document.querySelector('.event-card--start');
      if (!startCard) return;
      startCard.animate(
        [
          { boxShadow: '0 2px 10px rgba(220,53,69,0.10)' },
          { boxShadow: '0 6px 22px rgba(220,53,69,0.30)' },
          { boxShadow: '0 2px 10px rgba(220,53,69,0.10)' },
        ],
        { duration: 1400, easing: 'ease-in-out' }
      );
    }, 700);
  });
})();
