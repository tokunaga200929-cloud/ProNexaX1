/* ================================================================
   STEP86: App Alert Reflection Diagnostics
   Console不要で本体側のCMS反映状態をアラート確認
   ================================================================ */
(function(){
  if (window.__PNX_STEP86_APP_ALERT_DIAG__) return;
  window.__PNX_STEP86_APP_ALERT_DIAG__ = true;

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch(e) {
      return fallback;
    }
  }

  function getSearchFrame(){
    return document.getElementById("search-module-frame") || document.querySelector('iframe[src*="search"]');
  }

  function makeButton(){
    if (document.getElementById("pnx-step86-app-alert-btn")) return;

    const btn = document.createElement("button");
    btn.id = "pnx-step86-app-alert-btn";
    btn.type = "button";
    btn.textContent = "CMS反映診断";
    btn.onclick = diagnoseByAlert;
    document.body.appendChild(btn);

    const style = document.createElement("style");
    style.textContent = `
      #pnx-step86-app-alert-btn{
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

  function refreshSearch(){
    try {
      if (typeof window.PNXStep85RefreshSearchFromCms === "function") {
        window.PNXStep85RefreshSearchFromCms();
      }
    } catch(e) {}

    try {
      if (typeof window.PNXNotifySearchCmsUpdated === "function") {
        window.PNXNotifySearchCmsUpdated();
      }
    } catch(e) {}

    const frame = getSearchFrame();
    if (frame && frame.contentWindow) {
      try {
        frame.contentWindow.postMessage({ type:"PNX_STEP85_HARD_SYNC_UPDATED" }, "*");
        frame.contentWindow.postMessage({ type:"PNX_REFRESH_CMS_TOURNAMENTS" }, "*");
        frame.contentWindow.postMessage({ type:"PNX_CMS_TOURNAMENTS_UPDATED" }, "*");
      } catch(e) {}
    }
  }

  function openSearch(){
    try {
      if (typeof window.switchPage === "function") window.switchPage("search");
    } catch(e) {}

    setTimeout(function(){
      try {
        if (typeof window.PNXStabilizeModulePage === "function") {
          window.PNXStabilizeModulePage("search");
        }
      } catch(e) {}
      refreshSearch();
    }, 300);
  }

  function diagnoseByAlert(){
    const snapshot = readJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", []);
    const meta = readJson("PNX_CMS_SEARCH_SYNC_META", null);
    const hard = readJson("PNX_STEP85_HARD_SYNC_PAYLOAD", null);
    const frame = getSearchFrame();

    const count = Array.isArray(snapshot) ? snapshot.length : 0;
    const titles = Array.isArray(snapshot) ? snapshot.slice(0, 5).map(t => t.title || t.name).filter(Boolean) : [];

    let message = "本体側 CMS反映診断\n\n";
    message += "現在のURL:\n" + location.origin + location.pathname + "\n\n";
    message += "見えているCMS公開大会: " + count + "件\n";
    message += "強制同期データ: " + (hard ? "あり" : "なし") + "\n";
    message += "試合検索iframe: " + (frame ? "あり" : "まだ未起動") + "\n";
    message += "最終同期: " + (meta && meta.createdAt ? meta.createdAt : "未作成") + "\n\n";

    if (titles.length) {
      message += "本体が見えている大会:\n・" + titles.join("\n・") + "\n\n";
    }

    if (count === 0) {
      message += "結果: 本体側でCMS大会が見えていません。\n\n原因候補:\n・CMSと本体のURL/ポートが違う\n・CMSでまだ募集中保存していない\n・CMS側スナップショットが0件\n\nOK例:\nhttp://127.0.0.1:5500/cms/index.html\nhttp://127.0.0.1:5500/index.html";
      alert(message);
      return;
    }

    if (!frame) {
      message += "結果: CMS大会は見えています。\nただし試合検索iframeがまだ起動していません。\n\nこのあと試合検索を開いて更新します。";
      alert(message);
      openSearch();
      return;
    }

    refreshSearch();

    setTimeout(function(){
      const afterFrame = getSearchFrame();
      let iframeResult = "確認中";
      try {
        iframeResult = afterFrame && afterFrame.contentWindow && afterFrame.contentWindow.__PNX_STEP85_SEARCH_INJECT_RESULT__
          ? JSON.stringify(afterFrame.contentWindow.__PNX_STEP85_SEARCH_INJECT_RESULT__)
          : "iframe内結果は未取得";
      } catch(e) {
        iframeResult = "iframe内結果は直接読めません";
      }

      alert(
        message +
        "結果: 本体側はCMS大会を見えています。\n" +
        "試合検索へ更新通知を送りました。\n\n" +
        "iframe結果:\n" + iframeResult + "\n\n" +
        "試合検索画面に大会が出るか確認してください。"
      );
    }, 500);
  }

  window.PNXStep86AppAlertDiagnose = diagnoseByAlert;
  window.PNXStep86OpenSearchAndRefreshByAlert = openSearch;

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(makeButton, 900);
  });
})();
