/* ================================================================
   STEP277: Unified Search Firestore Loader
   本体が pages/search/embed.html / pages/search/index.html / search.html
   どれを読んでも、Firestore tournaments を試合検索へ流し込む
   ================================================================ */
(function(){
  if (window.PNXSearchFirestoreUnifiedLoader && window.PNXSearchFirestoreUnifiedLoader.version === "step277") return;

  const KEYS = {
    all: "PNX_CMS_TOURNAMENTS",
    public: "PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH",
    meta: "PNX_CMS_SEARCH_SYNC_META",
    status: "PNX_FIRESTORE_TOURNAMENT_SYNC_STATUS"
  };

  function now(){ return new Date().toISOString(); }

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

  function writeStatus(patch){
    const prev = readJson(KEYS.status, {});
    const status = Object.assign({}, prev, patch || {}, {
      step277UpdatedAt: now(),
      searchPath: location.pathname,
      searchHref: location.href
    });
    try { localStorage.setItem(KEYS.status, JSON.stringify(status)); } catch(e) {}
    try { window.dispatchEvent(new CustomEvent("pnx:firestore:tournament-sync-status", { detail: status })); } catch(e) {}
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type:"PNX_STEP277_SEARCH_FIRESTORE_STATUS",
          status,
          publicCount:(readJson(KEYS.public, []) || []).length,
          rawCount:(readJson(KEYS.all, []) || []).length,
          at:now()
        }, "*");
      }
    } catch(e) {}
    return status;
  }

  function refreshSearch(reason){
    try {
      if (typeof window.PNXStep205RefreshCmsTournaments === "function") {
        return window.PNXStep205RefreshCmsTournaments("step277:" + reason);
      }
      if (typeof window.PNXStep205MergeCmsTournaments === "function") {
        const r = window.PNXStep205MergeCmsTournaments({ reason:"step277:" + reason });
        try { if (typeof renderCalendarSection === "function") renderCalendarSection(); } catch(e) {}
        try { if (typeof applyFiltersAndRender === "function") applyFiltersAndRender(); } catch(e) {}
        return r;
      }
      return null;
    } catch(e) {
      console.warn("[PNX STEP277] search refresh failed", e);
      return null;
    }
  }

  async function load(reason){
    const api = window.PNXTournamentFirestoreSync;
    if (!api || !api.loadFromFirestoreToLocal) {
      writeStatus({
        firestoreReady:false,
        configReady:!!(api && api.hasRealConfig && api.hasRealConfig()),
        lastAction:"step277-sync-not-ready",
        message:"PNXTournamentFirestoreSyncがまだ読み込まれていません"
      });
      return { ok:false, reason:"sync-not-ready" };
    }

    try {
      writeStatus({
        configReady: api.hasRealConfig ? api.hasRealConfig() : false,
        lastAction:"step277-loading",
        message:"本体試合検索がFirestore読込中です"
      });

      const result = await api.loadFromFirestoreToLocal({ reason: reason || "step277-unified-loader" });
      const publicCount = (readJson(KEYS.public, []) || []).length;
      const rawCount = (readJson(KEYS.all, []) || []).length;

      writeStatus({
        configReady: api.hasRealConfig ? api.hasRealConfig() : false,
        firestoreReady:!!(result && result.ok),
        lastAction: result && result.ok ? "step277-loaded-from-firestore" : "step277-local-fallback",
        publicCount,
        rawCount,
        message: result && result.ok
          ? `本体試合検索がFirestoreから${rawCount}件読み込みました。表示対象${publicCount}件。`
          : `Firestore読込に失敗またはlocalStorage fallback。表示対象${publicCount}件。`
      });

      refreshSearch(reason || "loaded");
      return result;
    } catch(e) {
      writeStatus({
        firestoreReady:false,
        lastAction:"step277-load-error",
        message:e && e.message ? e.message : String(e)
      });
      return { ok:false, error:e };
    }
  }

  function diagnose(){
    const api = window.PNXTournamentFirestoreSync;
    const status = readJson(KEYS.status, {});
    const publicItems = readJson(KEYS.public, []);
    const rawItems = readJson(KEYS.all, []);
    return {
      step:"277",
      path:location.pathname,
      href:location.href,
      hasSyncApi:!!api,
      hasRealConfig:!!(api && api.hasRealConfig && api.hasRealConfig()),
      firestoreReady:!!status.firestoreReady,
      lastAction:status.lastAction || null,
      message:status.message || null,
      publicCount:Array.isArray(publicItems) ? publicItems.length : 0,
      rawCount:Array.isArray(rawItems) ? rawItems.length : 0,
      hasSearchRefresh:typeof window.PNXStep205RefreshCmsTournaments === "function",
      hasSearchMerge:typeof window.PNXStep205MergeCmsTournaments === "function",
      searchSync:window.__PNX_STEP205_CMS_SEARCH_SYNC__ || null
    };
  }

  function schedule(){
    // SDK / compat / search.js の読み込み順を吸収するため複数回試す
    setTimeout(() => load("step277-boot-250ms"), 250);
    setTimeout(() => load("step277-boot-1200ms"), 1200);
    setTimeout(() => load("step277-boot-3200ms"), 3200);
  }

  window.PNXSearchFirestoreUnifiedLoader = {
    version:"step277",
    load,
    refreshSearch,
    diagnose
  };

  window.addEventListener("pnx:firestore:tournaments-loaded", function(){
    refreshSearch("firestore-event");
  });

  window.addEventListener("message", function(e){
    const data = e && e.data || {};
    if (data.type === "PNX_STEP277_FORCE_SEARCH_FIRESTORE_LOAD") {
      load("parent-force-load");
    }
  });

  document.addEventListener("visibilitychange", function(){
    if (!document.hidden) setTimeout(() => load("visibility-return"), 120);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule);
  } else {
    schedule();
  }
})();
