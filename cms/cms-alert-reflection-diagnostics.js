/* ================================================================
   STEP86: CMS Alert Reflection Diagnostics
   Console不要でCMS保存→本体反映準備をアラート確認
   ================================================================ */
(function(){
  if (window.__PNX_STEP86_CMS_ALERT_DIAG__) return;
  window.__PNX_STEP86_CMS_ALERT_DIAG__ = true;

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch(e) {
      return fallback;
    }
  }

  function text(v){ return String(v == null ? "" : v).trim(); }

  function makeButton(){
    if (document.getElementById("pnx-step86-cms-alert-btn")) return;

    const btn = document.createElement("button");
    btn.id = "pnx-step86-cms-alert-btn";
    btn.type = "button";
    btn.textContent = "反映診断";
    btn.onclick = diagnoseByAlert;
    document.body.appendChild(btn);

    const style = document.createElement("style");
    style.textContent = `
      #pnx-step86-cms-alert-btn{
        position:fixed;
        right:18px;
        bottom:72px;
        z-index:9999999;
        height:42px;
        padding:0 16px;
        border:0;
        border-radius:999px;
        background:#175cd3;
        color:white;
        font-weight:900;
        font-size:12px;
        box-shadow:0 14px 30px rgba(23,92,211,.24);
        cursor:pointer;
      }
    `;
    document.head.appendChild(style);
  }

  function diagnoseByAlert(){
    const bridge = window.PNXCmsFinalDesignBridge;

    if (!bridge) {
      alert("CMS診断\n\nPNXCmsFinalDesignBridge が見つかりません。\nCMSの読み込みがまだ終わっていないか、ファイルが古い可能性があります。");
      return;
    }

    let hard = null;
    let diag = null;

    try {
      if (bridge.createHardSearchSnapshot) {
        hard = bridge.createHardSearchSnapshot();
      }
    } catch(e) {
      alert("CMS診断\n\n強制スナップショット作成でエラー:\n" + (e.message || e));
      return;
    }

    try {
      diag = bridge.diagnoseAppReflection ? bridge.diagnoseAppReflection() : null;
    } catch(e) {}

    const all = bridge.getTournaments ? bridge.getTournaments() : readJson("PNX_CMS_TOURNAMENTS", []);
    const snapshot = readJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", []);
    const meta = readJson("PNX_CMS_SEARCH_SYNC_META", null);

    const draftCount = Array.isArray(all) ? all.filter(t => /draft|下書き/.test(text(t.status || "draft").toLowerCase())).length : 0;
    const publicCount = Array.isArray(snapshot) ? snapshot.length : 0;
    const titles = Array.isArray(snapshot) ? snapshot.slice(0, 5).map(t => t.title || t.name).filter(Boolean) : [];

    let message = "CMS反映診断\n\n";
    message += "現在のURL:\n" + location.origin + location.pathname + "\n\n";
    message += "CMS大会保存数: " + (Array.isArray(all) ? all.length : 0) + "件\n";
    message += "下書き数: " + draftCount + "件\n";
    message += "本体表示用スナップショット: " + publicCount + "件\n";
    message += "最終同期: " + (meta && meta.createdAt ? meta.createdAt : "未作成") + "\n\n";

    if (titles.length) {
      message += "本体へ渡す大会:\n・" + titles.join("\n・") + "\n\n";
    }

    if (publicCount > 0) {
      message += "結果: CMS側はOKです。\n次は同じLive Serverで index.html を開いて、本体側の「CMS反映診断」を押してください。";
    } else {
      message += "結果: 本体へ渡す大会が0件です。\n\n考えられる原因:\n・下書き保存になっている\n・大会名がない\n・開催日がない\n・会場がない\n・カテゴリがない\n\n仮登録プレビューで修正して「募集中で保存」を押してください。";
    }

    alert(message);
  }

  window.PNXStep86CmsAlertDiagnose = diagnoseByAlert;

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(makeButton, 800);
  });
})();
