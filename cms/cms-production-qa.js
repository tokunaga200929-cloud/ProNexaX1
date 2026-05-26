/* ================================================================
   STEP74: CMS Production QA Check
   cms/index.html 本番CMS入口の統合チェック
   ================================================================ */
(function(){
  if (window.__PNX_STEP74_CMS_PRODUCTION_QA__) return;
  window.__PNX_STEP74_CMS_PRODUCTION_QA__ = true;

  const REQUIRED_BRIDGE_APIS = [
    "status",
    "getTournaments",
    "saveTournament",
    "removeTournament",
    "getFeaturedContents",
    "saveFeaturedContent",
    "saveBanner",
    "getCategories",
    "saveCategories",
    "publishToApp",
    "createSearchSnapshot",
    "checkSearchSnapshot",
    "validateAllTournaments",
    "getPublishableTournaments",
    "getStorageStatus",
    "downloadBackup",
    "prepareFirestoreMigration",
    "getMediaAssets",
    "saveMediaAsset",
    "bindMediaToPickup",
    "bindMediaToTournament",
    "getLivePreviewData"
  ];

  const REQUIRED_STORAGE_KEYS = [
    "PNX_CMS_TOURNAMENTS",
    "PNX_CMS_FEATURED_CONTENTS",
    "PNX_CMS_BANNERS",
    "PNX_CMS_CATEGORIES",
    "PNX_CMS_MEDIA",
    "PNX_CMS_SETTINGS",
    "PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH",
    "PNX_CMS_SEARCH_SYNC_META"
  ];

  function exists(selector){
    return !!document.querySelector(selector);
  }

  function hasScript(srcPart){
    return Array.from(document.scripts).some(s => (s.src || "").includes(srcPart));
  }

  function hasCss(hrefPart){
    return Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(l => (l.href || "").includes(hrefPart));
  }

  function lsExists(key){
    try { return localStorage.getItem(key) != null; }
    catch(e) { return false; }
  }

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch(e) {
      return fallback;
    }
  }

  function runCheck(){
    const bridge = window.PNXCmsFinalDesignBridge || null;

    const result = {
      checkedAt: new Date().toISOString(),
      page: {
        title: document.title,
        rootExists: exists("#root"),
        cssLoaded: hasCss("styles.css"),
        cmsJsLoaded: hasScript("cms.js"),
        bridgeScriptLoaded: hasScript("cms-final-design-bridge.js")
      },
      bridge: {
        exists: !!bridge,
        api: {},
        missingApis: []
      },
      storage: {
        keys: {},
        existingCount: 0
      },
      data: {
        tournaments: 0,
        featured: 0,
        media: 0,
        publicSnapshot: 0,
        syncMetaExists: false
      },
      health: {
        ok: true,
        warnings: [],
        errors: []
      }
    };

    REQUIRED_BRIDGE_APIS.forEach(name => {
      const ok = !!(bridge && typeof bridge[name] === "function");
      result.bridge.api[name] = ok;
      if (!ok) result.bridge.missingApis.push(name);
    });

    REQUIRED_STORAGE_KEYS.forEach(key => {
      const ok = lsExists(key);
      result.storage.keys[key] = ok;
      if (ok) result.storage.existingCount += 1;
    });

    try {
      if (bridge && bridge.getTournaments) result.data.tournaments = bridge.getTournaments().length;
      if (bridge && bridge.getFeaturedContents) result.data.featured = bridge.getFeaturedContents().length;
      if (bridge && bridge.getMediaAssets) result.data.media = bridge.getMediaAssets().length;
    } catch(e) {
      result.health.warnings.push("Bridge data count failed: " + (e.message || e));
    }

    const snapshot = readJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", []);
    result.data.publicSnapshot = Array.isArray(snapshot) ? snapshot.length : 0;
    result.data.syncMetaExists = !!readJson("PNX_CMS_SEARCH_SYNC_META", null);

    if (!result.page.rootExists) result.health.errors.push("#root がありません");
    if (!result.page.cssLoaded) result.health.errors.push("styles.css が読み込まれていません");
    if (!result.page.cmsJsLoaded) result.health.errors.push("cms.js が読み込まれていません");
    if (!result.page.bridgeScriptLoaded) result.health.errors.push("cms-final-design-bridge.js が読み込まれていません");
    if (!result.bridge.exists) result.health.errors.push("PNXCmsFinalDesignBridge がありません");
    if (result.bridge.missingApis.length) result.health.errors.push("Bridge API不足: " + result.bridge.missingApis.join(", "));

    if (result.storage.existingCount === 0) {
      result.health.warnings.push("CMS保存データはまだ作成されていません。初回起動なら正常です。");
    }
    if (!result.data.syncMetaExists) {
      result.health.warnings.push("検索用同期メタがまだありません。大会を公開して本体反映すると作成されます。");
    }

    result.health.ok = result.health.errors.length === 0;

    try {
      localStorage.setItem("PNX_STEP74_CMS_PRODUCTION_QA", JSON.stringify(result));
    } catch(e) {}

    window.__PNX_STEP74_LAST_CMS_QA__ = result;
    window.dispatchEvent(new CustomEvent("pnx:cms:production-qa", { detail: result }));
    return result;
  }

  function printCheck(){
    const r = runCheck();
    console.group("ProNexaX STEP74 CMS Production QA");
    console.log("OK:", r.health.ok);
    console.log("Page:", r.page);
    console.log("Bridge missing APIs:", r.bridge.missingApis);
    console.log("Data:", r.data);
    if (r.health.errors.length) console.error("Errors:", r.health.errors);
    if (r.health.warnings.length) console.warn("Warnings:", r.health.warnings);
    console.groupEnd();
    return r;
  }

  function renderBadge(){
    let badge = document.getElementById("pnx-step74-cms-qa-badge");
    if (!badge) {
      badge = document.createElement("button");
      badge.id = "pnx-step74-cms-qa-badge";
      badge.type = "button";
      badge.title = "CMS Production QA";
      badge.textContent = "QA";
      document.body.appendChild(badge);
    }

    badge.onclick = function(){
      const r = printCheck();
      alert(r.health.ok
        ? "CMSチェックOKです。Consoleに詳細を出しました。"
        : "CMSチェックで問題があります。Consoleを確認してください。"
      );
    };
  }

  window.PNXRunCmsProductionQa = runCheck;
  window.PNXPrintCmsProductionQa = printCheck;

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(runCheck, 700);
    setTimeout(renderBadge, 1000);
  });
})();
