/* ================================================================
   STEP59: Main Navigation Final Check
   見た目を触らず、本体ナビ導線・iframe・Bridge状態を確認する安全チェック
   ================================================================ */
(function(){
  if (window.__PNX_STEP59_MAIN_NAV_CHECK__) return;
  window.__PNX_STEP59_MAIN_NAV_CHECK__ = true;

  function exists(selector){
    return !!document.querySelector(selector);
  }

  function frameStatus(id){
    const frame = document.getElementById(id);
    if (!frame) return { exists:false, src:"", loaded:false };
    return {
      exists:true,
      src:frame.getAttribute("src") || "",
      loaded:!!frame.contentWindow
    };
  }

  function check(){
    const result = {
      checkedAt:new Date().toISOString(),
      pages:{
        calendar:exists("#page-calendar"),
        search:exists("#page-search"),
        finance:exists("#page-finance"),
        featured:exists("#page-featured")
      },
      nav:{
        calendar:exists("#nav-calendar"),
        search:exists("#nav-search"),
        finance:exists("#nav-finance"),
        center:exists("#nav-center") || exists("#nav-featured")
      },
      frames:{
        search:frameStatus("search-module-frame"),
        finance:frameStatus("finance-module-frame"),
        featured:frameStatus("featured-module-frame")
      },
      bridges:{
        addTournamentToCalendar:typeof window.PNXAddTournamentToMainCalendar === "function",
        toggleTournamentCalendar:typeof window.PNXToggleTournamentCalendar === "function",
        restoreCalendarFlex:typeof window.PNXRestoreCalendarFlex === "function",
        stabilizeModulePage:typeof window.PNXStabilizeModulePage === "function",
        collectFinanceTournaments:typeof window.PNXCollectFinanceTournaments === "function",
        notifyFinanceTournamentUpdate:typeof window.PNXNotifyFinanceTournamentUpdate === "function"
      },
      currentPage:document.body.dataset.currentPage || "",
      ok:true,
      warnings:[]
    };

    Object.keys(result.pages).forEach(k => {
      if (!result.pages[k]) result.warnings.push("page missing: " + k);
    });

    Object.keys(result.nav).forEach(k => {
      if (!result.nav[k]) result.warnings.push("nav missing: " + k);
    });

    ["search","finance","featured"].forEach(k => {
      if (!result.frames[k].exists) result.warnings.push("iframe missing: " + k);
    });

    Object.keys(result.bridges).forEach(k => {
      if (!result.bridges[k]) result.warnings.push("bridge missing: " + k);
    });

    result.ok = result.warnings.length === 0;

    try {
      localStorage.setItem("PNX_STEP59_NAV_CHECK", JSON.stringify(result));
    } catch(e) {}

    window.__PNX_STEP59_LAST_CHECK__ = result;
    window.dispatchEvent(new CustomEvent("pnx:qa:nav-check", { detail:result }));

    return result;
  }

  function print(){
    const r = check();
    console.group("ProNexaX STEP59 Main Nav Check");
    console.log("OK:", r.ok);
    console.log("Pages:", r.pages);
    console.log("Nav:", r.nav);
    console.log("Frames:", r.frames);
    console.log("Bridges:", r.bridges);
    if (r.warnings.length) console.warn("Warnings:", r.warnings);
    console.groupEnd();
    return r;
  }

  function safeStabilize(page){
    if (typeof window.PNXStabilizeModulePage === "function") {
      try { window.PNXStabilizeModulePage(page); } catch(e) {}
    }
  }

  function runManualRouteProbe(){
    const before = document.body.dataset.currentPage || "";
    const pages = ["search", "finance", "featured", "calendar"];
    const results = [];

    pages.forEach(page => {
      try {
        if (page !== "calendar") safeStabilize(page);
        if (page === "calendar" && typeof window.PNXRestoreCalendarFlex === "function") {
          window.PNXRestoreCalendarFlex();
        }
        results.push({ page, ok:true });
      } catch(e) {
        results.push({ page, ok:false, error:e.message || String(e) });
      }
    });

    document.body.dataset.currentPage = before || "calendar";
    return {
      checkedAt:new Date().toISOString(),
      results,
      after:check()
    };
  }

  window.PNXRunNavigationSmokeCheck = check;
  window.PNXPrintNavigationSmokeCheck = print;
  window.PNXRunManualRouteProbe = runManualRouteProbe;

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(check, 1000);
  });
})();
