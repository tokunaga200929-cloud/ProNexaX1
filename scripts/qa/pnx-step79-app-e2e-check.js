/* ================================================================
   STEP79: App-side CMS → Search → Calendar → Finance E2E Check
   本体側でCMS公開大会・試合検索反映・カレンダー/収支Bridgeを確認
   ================================================================ */
(function(){
  if (window.__PNX_STEP79_APP_E2E_CHECK__) return;
  window.__PNX_STEP79_APP_E2E_CHECK__ = true;

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

  function getFinanceFrame(){
    return document.getElementById("finance-module-frame") || document.querySelector('iframe[src*="finance"]');
  }

  function cmsSnapshot(){
    const list = readJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", []);
    const meta = readJson("PNX_CMS_SEARCH_SYNC_META", null);
    return { list:Array.isArray(list) ? list : [], meta };
  }

  function check(){
    const snap = cmsSnapshot();
    const searchFrame = getSearchFrame();
    const financeFrame = getFinanceFrame();

    const result = {
      checkedAt: new Date().toISOString(),
      cms: {
        publicCount: snap.list.length,
        meta: snap.meta,
        firstTitle: snap.list[0] && (snap.list[0].title || snap.list[0].name || "")
      },
      pages: {
        calendar: !!document.getElementById("page-calendar"),
        search: !!document.getElementById("page-search"),
        finance: !!document.getElementById("page-finance"),
        featured: !!document.getElementById("page-featured")
      },
      frames: {
        search: !!searchFrame,
        finance: !!financeFrame
      },
      rootApis: {
        stabilizeModulePage: typeof window.PNXStabilizeModulePage === "function",
        restoreCalendarFlex: typeof window.PNXRestoreCalendarFlex === "function",
        notifySearchCmsUpdated: typeof window.PNXNotifySearchCmsUpdated === "function",
        notifyFinanceTournamentUpdate: typeof window.PNXNotifyFinanceTournamentUpdate === "function",
        collectFinanceTournaments: typeof window.PNXCollectFinanceTournaments === "function"
      },
      bridgeStorage: {
        calendarAdded: readJson("PNX_CALENDAR_TOURNAMENTS", []).length || readJson("PNX_ADDED_TOURNAMENTS", []).length || 0,
        transactions: readJson("PNX_FINANCE_TRANSACTIONS", []).length
      },
      ok: false,
      warnings: []
    };

    if (snap.list.length === 0) result.warnings.push("CMS公開スナップショットが空です。CMSで大会を募集中にして本体へ反映してください。");
    if (!searchFrame) result.warnings.push("試合検索iframeがまだ作られていません。下部ナビの試合検索を開いてください。");
    if (!financeFrame) result.warnings.push("収支iframeがまだ作られていません。下部ナビの収支を開いてください。");
    if (!result.rootApis.stabilizeModulePage) result.warnings.push("PNXStabilizeModulePage が見つかりません。");
    if (!result.rootApis.restoreCalendarFlex) result.warnings.push("PNXRestoreCalendarFlex が見つかりません。");

    result.ok = snap.list.length > 0 && result.pages.search && result.pages.finance && result.rootApis.stabilizeModulePage;

    try {
      localStorage.setItem("PNX_STEP79_APP_E2E_CHECK", JSON.stringify(result));
    } catch(e) {}

    window.__PNX_STEP79_LAST_APP_E2E_CHECK__ = result;
    return result;
  }

  function openSearchAndRefresh(){
    try {
      if (typeof window.switchPage === "function") window.switchPage("search");
      else if (typeof window.PNXStabilizeModulePage === "function") window.PNXStabilizeModulePage("search");
    } catch(e) {}

    setTimeout(function(){
      try { if (typeof window.PNXStabilizeModulePage === "function") window.PNXStabilizeModulePage("search"); } catch(e) {}
      try { if (typeof window.PNXNotifySearchCmsUpdated === "function") window.PNXNotifySearchCmsUpdated(); } catch(e) {}
      const frame = getSearchFrame();
      try {
        frame && frame.contentWindow && frame.contentWindow.postMessage({ type:"PNX_CMS_TOURNAMENTS_UPDATED" }, "*");
      } catch(e) {}
    }, 250);

    return true;
  }

  function openFinanceAndRefresh(){
    try {
      if (typeof window.switchPage === "function") window.switchPage("finance");
      else if (typeof window.PNXStabilizeModulePage === "function") window.PNXStabilizeModulePage("finance");
    } catch(e) {}

    setTimeout(function(){
      try { if (typeof window.PNXStabilizeModulePage === "function") window.PNXStabilizeModulePage("finance"); } catch(e) {}
      try { if (typeof window.PNXNotifyFinanceTournamentUpdate === "function") window.PNXNotifyFinanceTournamentUpdate(); } catch(e) {}
      const frame = getFinanceFrame();
      try {
        frame && frame.contentWindow && frame.contentWindow.postMessage({ type:"PNX_FINANCE_REFRESH_ANALYTICS" }, "*");
      } catch(e) {}
    }, 250);

    return true;
  }

  function openCalendar(){
    try {
      if (typeof window.switchPage === "function") window.switchPage("calendar");
      if (typeof window.PNXRestoreCalendarFlex === "function") window.PNXRestoreCalendarFlex();
    } catch(e) {}
    return true;
  }

  function print(){
    const result = check();
    console.group("ProNexaX STEP79 App E2E Check");
    console.log("OK:", result.ok);
    console.log(result);
    if (result.warnings.length) console.warn(result.warnings);
    console.groupEnd();
    return result;
  }

  window.PNXRunStep79AppE2ECheck = check;
  window.PNXPrintStep79AppE2ECheck = print;
  window.PNXStep79OpenSearchAndRefresh = openSearchAndRefresh;
  window.PNXStep79OpenFinanceAndRefresh = openFinanceAndRefresh;
  window.PNXStep79OpenCalendar = openCalendar;

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(check, 1500);
  });
})();
