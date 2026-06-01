/* ================================================================
   STEP276: Firebase / Firestore Diagnostics Panel for CMS
   Consoleを触らず、CMS画面上でFirestore接続と保存状態を確認する
   ================================================================ */
(function(){
  if (window.__PNX_STEP276_FIREBASE_DIAGNOSTICS_PANEL__) return;
  window.__PNX_STEP276_FIREBASE_DIAGNOSTICS_PANEL__ = true;

  const KEYS = {
    all: "PNX_CMS_TOURNAMENTS",
    public: "PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH",
    meta: "PNX_CMS_SEARCH_SYNC_META",
    hard: "PNX_STEP85_HARD_SYNC_PAYLOAD",
    status: "PNX_FIRESTORE_TOURNAMENT_SYNC_STATUS"
  };

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch(e) {
      return fallback;
    }
  }

  function text(v){ return String(v == null ? "" : v).trim(); }

  function badge(ok, pending){
    if (pending) return '<span class="pnx-fd-badge is-warn">確認中</span>';
    return ok ? '<span class="pnx-fd-badge is-ok">OK</span>' : '<span class="pnx-fd-badge is-ng">NG</span>';
  }

  function row(label, value, cls){
    return '<div class="pnx-fd-row">' +
      '<span class="pnx-fd-label">' + label + '</span>' +
      '<span class="pnx-fd-value ' + (cls || "") + '">' + value + '</span>' +
    '</div>';
  }

  function localSummary(){
    const all = readJson(KEYS.all, []);
    const pub = readJson(KEYS.public, []);
    const meta = readJson(KEYS.meta, null);
    const status = readJson(KEYS.status, null);
    return {
      allCount: Array.isArray(all) ? all.length : 0,
      publicCount: Array.isArray(pub) ? pub.length : 0,
      meta,
      status
    };
  }

  function getApi(){
    return window.PNXTournamentFirestoreSync || null;
  }

  async function tryFirestoreCount(){
    const api = getApi();
    if (!api || !api.ensureDb) {
      return { ok:false, reason:"PNXTournamentFirestoreSyncが未読込です" };
    }
    if (!api.hasRealConfig || !api.hasRealConfig()) {
      return { ok:false, reason:"Firebase設定値が未入力です" };
    }

    const db = await api.ensureDb();
    if (!db) {
      return { ok:false, reason:"Firestore DBを初期化できません" };
    }

    const collections = window.PNX_FIRESTORE_COLLECTIONS || {};
    const name = collections.tournaments || "tournaments";
    const snap = await db.collection(name).get();

    let displayable = 0;
    const missing = [];
    snap.docs.forEach(doc => {
      const d = doc.data() || {};
      const title = text(d.title || d.name);
      const start = text(d.startDate || d.start || d.date);
      const venue = text(d.venue || d.course);
      const category = text(d.category || d.cat);
      const status = text(d.status || d.rawStatus).toLowerCase();
      const published = d.published !== false && d.visible !== false && d.isPublished !== false;
      const ok = !!(title && start && venue && category && published && !/draft|下書き/.test(status));
      if (ok) displayable += 1;
      else if (missing.length < 5) {
        const lack = [];
        if (!title) lack.push("title");
        if (!start) lack.push("startDate");
        if (!venue) lack.push("venue");
        if (!category) lack.push("category");
        if (!published) lack.push("published=false");
        if (/draft|下書き/.test(status)) lack.push("draft");
        missing.push({ id: doc.id, lack: lack.join(", ") || "表示条件NG" });
      }
    });

    return {
      ok:true,
      collection:name,
      count:snap.size,
      displayable,
      missing
    };
  }

  function makePanel(){
    const panel = document.createElement("div");
    panel.id = "pnx-firebase-diagnostics";
    panel.innerHTML = `
      <div class="pnx-fd-card">
        <div class="pnx-fd-head">
          <div>
            <div class="pnx-fd-title">Firebase診断</div>
            <div class="pnx-fd-sub">CMS保存 → Firestore → 本体表示</div>
          </div>
          <button class="pnx-fd-close" type="button" aria-label="閉じる">−</button>
        </div>
        <div class="pnx-fd-body">
          <div class="pnx-fd-loading">診断待機中</div>
        </div>
        <div class="pnx-fd-actions">
          <button type="button" data-action="check">接続チェック</button>
          <button type="button" data-action="load">Firestore読込</button>
          <button type="button" data-action="publish">本体へ再反映</button>
        </div>
      </div>
      <button class="pnx-fd-mini" type="button">Firebase診断</button>
    `;
    document.body.appendChild(panel);
    return panel;
  }

  function style(){
    if (document.getElementById("pnx-fd-style")) return;
    const s = document.createElement("style");
    s.id = "pnx-fd-style";
    s.textContent = `
      #pnx-firebase-diagnostics {
        position: fixed;
        right: 22px;
        bottom: 22px;
        z-index: 2147483000;
        font-family: -apple-system, BlinkMacSystemFont, "Noto Sans JP", system-ui, sans-serif;
      }
      #pnx-firebase-diagnostics .pnx-fd-card {
        width: min(380px, calc(100vw - 32px));
        background: rgba(255,255,255,.96);
        border: 1px solid rgba(20,83,45,.14);
        border-radius: 22px;
        box-shadow: 0 24px 70px rgba(15,23,42,.18);
        backdrop-filter: blur(16px);
        overflow: hidden;
      }
      #pnx-firebase-diagnostics.is-min .pnx-fd-card { display:none; }
      #pnx-firebase-diagnostics .pnx-fd-mini {
        display:none;
        border:0;
        border-radius: 999px;
        padding: 12px 16px;
        color:#fff;
        background:#0F7A3E;
        box-shadow: 0 16px 40px rgba(15,122,62,.28);
        font-weight:800;
        cursor:pointer;
      }
      #pnx-firebase-diagnostics.is-min .pnx-fd-mini { display:block; }
      .pnx-fd-head {
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:16px 16px 12px;
        border-bottom:1px solid #EEF2F0;
      }
      .pnx-fd-title { font-size:16px; font-weight:900; color:#102318; letter-spacing:-.02em; }
      .pnx-fd-sub { margin-top:3px; font-size:11px; color:#647067; font-weight:700; }
      .pnx-fd-close {
        width:34px; height:34px; border-radius:999px; border:1px solid #E5EDE8;
        background:#F7FAF8; color:#345341; font-weight:900; cursor:pointer;
      }
      .pnx-fd-body { padding:14px 16px; }
      .pnx-fd-row {
        display:flex; align-items:center; justify-content:space-between; gap:12px;
        padding:10px 0; border-bottom:1px solid #F1F4F2;
      }
      .pnx-fd-row:last-child { border-bottom:0; }
      .pnx-fd-label { color:#647067; font-size:12px; font-weight:800; }
      .pnx-fd-value { color:#0F172A; font-size:12px; font-weight:900; text-align:right; word-break:break-word; }
      .pnx-fd-value.is-ok { color:#087A39; }
      .pnx-fd-value.is-ng { color:#DC2626; }
      .pnx-fd-value.is-warn { color:#B7791F; }
      .pnx-fd-badge {
        display:inline-flex; align-items:center; justify-content:center;
        min-width:42px; padding:4px 9px; border-radius:999px; font-size:11px; font-weight:900;
      }
      .pnx-fd-badge.is-ok { color:#087A39; background:#E8F7EE; border:1px solid #BCE8CA; }
      .pnx-fd-badge.is-ng { color:#C81E1E; background:#FFF1F2; border:1px solid #FFD0D8; }
      .pnx-fd-badge.is-warn { color:#B7791F; background:#FFF8E6; border:1px solid #F5DB98; }
      .pnx-fd-note {
        margin-top:10px; padding:10px 12px; border-radius:14px;
        background:#F8FAFC; color:#475569; font-size:11px; line-height:1.55; font-weight:700;
      }
      .pnx-fd-note.is-ng { background:#FFF1F2; color:#B91C1C; }
      .pnx-fd-note.is-ok { background:#ECFDF3; color:#087A39; }
      .pnx-fd-note.is-warn { background:#FFF8E6; color:#9A6700; }
      .pnx-fd-actions {
        display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;
        padding:12px 16px 16px; background:#FBFDFC;
      }
      .pnx-fd-actions button {
        border:0; border-radius:13px; padding:10px 8px; cursor:pointer;
        background:#0F7A3E; color:#fff; font-size:11px; font-weight:900;
        box-shadow:0 8px 20px rgba(15,122,62,.14);
      }
      .pnx-fd-actions button:first-child { background:#155EEF; }
      .pnx-fd-actions button:nth-child(2) { background:#334155; }
      .pnx-fd-loading { color:#647067; font-size:12px; font-weight:800; padding:10px 0; }
      @media (max-width: 760px) {
        #pnx-firebase-diagnostics { right:12px; bottom:12px; }
        #pnx-firebase-diagnostics .pnx-fd-card { width: calc(100vw - 24px); }
      }
    `;
    document.head.appendChild(s);
  }

  function renderBasic(panel, result){
    const body = panel.querySelector(".pnx-fd-body");
    const local = localSummary();
    const api = getApi();
    const configOk = !!(api && api.hasRealConfig && api.hasRealConfig());
    const st = (api && api.status && api.status()) || local.status || {};
    const firestoreOk = !!(result && result.ok);

    let html = "";
    html += row("Firebase設定", badge(configOk), configOk ? "is-ok" : "is-ng");
    html += row("Firestore接続", badge(firestoreOk, result && result.pending), firestoreOk ? "is-ok" : "is-ng");
    html += row("CMS内大会", local.allCount + "件");
    html += row("本体表示スナップショット", local.publicCount + "件");
    if (result && result.ok) {
      html += row("Firestore tournaments", result.count + "件");
      html += row("本体表示条件OK", result.displayable + "件", result.displayable > 0 ? "is-ok" : "is-warn");
    } else {
      html += row("Firestore tournaments", "未確認", "is-warn");
    }
    html += row("最終アクション", text(st.lastAction || "—"));
    html += row("最終更新", text(st.updatedAt || local.meta && local.meta.createdAt || "—"));

    let noteClass = "is-warn";
    let note = "接続チェックを押すと、Firebase設定・Firestore接続・tournaments件数を確認できます。";
    if (!configOk) {
      noteClass = "is-ng";
      note = "Firebase設定が未反映です。scripts/firebase/firestore-config.js が YOUR_API_KEY に戻っていないか確認してください。";
    } else if (result && result.ok) {
      noteClass = result.displayable > 0 ? "is-ok" : "is-warn";
      note = result.displayable > 0
        ? "Firestore接続OK。本体表示条件を満たす大会があります。"
        : "Firestoreには接続できていますが、本体表示条件を満たす大会が0件です。CMSで保存 → 本体へ再反映を押してください。";
      if (result.missing && result.missing.length) {
        note += "<br>不足例: " + result.missing.map(m => m.id + " / " + m.lack).join("<br>");
      }
    } else if (result && !result.ok) {
      noteClass = "is-ng";
      note = result.reason || "Firestore接続に失敗しました。";
    }

    html += '<div class="pnx-fd-note ' + noteClass + '">' + note + '</div>';
    body.innerHTML = html;
  }

  async function runCheck(panel){
    renderBasic(panel, { pending:true });
    try {
      const result = await tryFirestoreCount();
      renderBasic(panel, result);
      return result;
    } catch(e) {
      renderBasic(panel, { ok:false, reason: (e && e.message) ? e.message : String(e) });
      return { ok:false, error:e };
    }
  }

  async function loadFirestore(panel){
    const api = getApi();
    if (!api || !api.loadFromFirestoreToLocal) {
      renderBasic(panel, { ok:false, reason:"Firestore同期JSが未読込です" });
      return;
    }
    const body = panel.querySelector(".pnx-fd-body");
    body.innerHTML = '<div class="pnx-fd-loading">Firestoreから読み込み中...</div>';
    try {
      await api.loadFromFirestoreToLocal({ reason:"diagnostics-panel-load" });
      await runCheck(panel);
    } catch(e) {
      renderBasic(panel, { ok:false, reason:(e && e.message) ? e.message : String(e) });
    }
  }

  async function publishFirestore(panel){
    const api = getApi();
    if (!api || !api.publishAllLocalToFirestore) {
      renderBasic(panel, { ok:false, reason:"Firestore同期JSが未読込です" });
      return;
    }
    const body = panel.querySelector(".pnx-fd-body");
    body.innerHTML = '<div class="pnx-fd-loading">CMS内大会をFirestoreへ再反映中...</div>';
    try {
      const list = readJson(KEYS.all, []);
      await api.publishAllLocalToFirestore(Array.isArray(list) ? list : []);
      await runCheck(panel);
    } catch(e) {
      renderBasic(panel, { ok:false, reason:(e && e.message) ? e.message : String(e) });
    }
  }

  function init(){
    style();
    const panel = makePanel();
    renderBasic(panel, null);

    panel.querySelector(".pnx-fd-close").addEventListener("click", () => {
      panel.classList.add("is-min");
    });
    panel.querySelector(".pnx-fd-mini").addEventListener("click", () => {
      panel.classList.remove("is-min");
      runCheck(panel);
    });
    panel.querySelector('[data-action="check"]').addEventListener("click", () => runCheck(panel));
    panel.querySelector('[data-action="load"]').addEventListener("click", () => loadFirestore(panel));
    panel.querySelector('[data-action="publish"]').addEventListener("click", () => publishFirestore(panel));

    window.addEventListener("pnx:firestore:tournament-sync-status", () => renderBasic(panel, null));
    window.PNXStep276FirebaseDiagnosticsPanel = {
      runCheck: () => runCheck(panel),
      loadFirestore: () => loadFirestore(panel),
      publishFirestore: () => publishFirestore(panel),
      panel
    };

    setTimeout(() => runCheck(panel), 800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
