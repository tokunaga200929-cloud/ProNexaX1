/* ================================================================
   STEP61: ProNexaX CMS Final Design Bridge
   最終CMSデザインを壊さず、既存CMS機能・本体アプリ・Firestoreへ繋ぐBridge
   ================================================================ */
(function(){
  /* STEP134: parent postMessage disabled by default.
     CMS本体反映時に親アプリへ通知して画面遷移させないため、
     明示的に window.__PNX_STEP134_ALLOW_PARENT_POST__ = true にしない限り親通知しない。 */
  window.__PNX_STEP134_ALLOW_PARENT_POST__ = window.__PNX_STEP134_ALLOW_PARENT_POST__ === true;
  if (window.PNXCmsFinalDesignBridge) return;

  const KEYS = {
    tournaments: "PNX_CMS_TOURNAMENTS",
    featured: "PNX_CMS_FEATURED_CONTENTS",
    banners: "PNX_CMS_BANNERS",
    categories: "PNX_CMS_CATEGORIES",
    media: "PNX_CMS_MEDIA",
    settings: "PNX_CMS_SETTINGS",
    draftQueue: "PNX_CMS_FINAL_DRAFT_QUEUE",
    status: "PNX_CMS_FINAL_BRIDGE_STATUS"
  };

  function now(){
    return new Date().toISOString();
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

  function writeJson(key, value){
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function uid(prefix){
    return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  }

  function emit(type, detail){
    const payload = Object.assign({ emittedAt: now() }, detail || {});
    window.dispatchEvent(new CustomEvent(type, { detail: payload }));

    try {
      window.__PNX_STEP134_ALLOW_PARENT_POST__ && window.parent && window.parent.postMessage({
        type,
        payload
      }, "*");
    } catch(e) {}

    return payload;
  }

  function normalizeTournament(input){
    const t = input || {};
    const id = t.id || t.tournamentId || uid("tour");
    const title = t.title || t.name || t.tournamentTitle || "新規大会";

    return {
      id,
      tournamentId: id,
      title,
      name: title,
      category: t.category || t.cat || "未分類",
      gender: t.gender || "",
      area: t.area || "",
      prefecture: t.prefecture || "",
      venue: t.venue || t.course || t.place || "",
      startDate: t.startDate || t.start || t.date || "",
      endDate: t.endDate || t.end || t.startDate || t.date || "",
      entryDeadline: t.entryDeadline || t.deadline || "",
      entryFee: t.entryFee || "",
      prize: t.prize || t.totalPrize || "",
      winnerPrize: t.winnerPrize || "",
      organizer: t.organizer || "",
      status: t.status || "draft",
      isPickup: !!t.isPickup,
      entryUrl: t.entryUrl || t.url || "",
      officialUrl: t.officialUrl || "",
      instagramUrl: t.instagramUrl || "",
      memo: t.memo || "",
      updatedAt: now(),
      createdAt: t.createdAt || now(),
      source: t.source || "cms-final"
    };
  }

  function normalizeFeatured(input){
    const f = input || {};
    const id = f.id || f.contentId || uid("featured");

    return {
      id,
      contentId: id,
      type: f.type || "banner",
      title: f.title || "新規コンテンツ",
      subtitle: f.subtitle || "",
      body: f.body || f.description || "",
      imageUrl: f.imageUrl || f.image || "",
      link: f.link || f.url || "",
      cta: f.cta || "詳しく見る",
      order: Number(f.order || 1),
      audience: f.audience || "all",
      published: f.published !== false,
      startDate: f.startDate || "",
      endDate: f.endDate || "",
      updatedAt: now(),
      createdAt: f.createdAt || now(),
      source: f.source || "cms-final"
    };
  }

  function upsert(list, item, idKey){
    const id = item[idKey] || item.id;
    const index = list.findIndex(x => x && (x[idKey] === id || x.id === id));
    if (index >= 0) list[index] = Object.assign({}, list[index], item, { updatedAt: now() });
    else list.push(item);
    return list;
  }

  const Bridge = {
    version: "step61",
    keys: KEYS,

    status(){
      const tournaments = this.getTournaments();
      const featured = this.getFeaturedContents();
      const status = {
        version: this.version,
        checkedAt: now(),
        tournaments: tournaments.length,
        featured: featured.length,
        mode: readJson(KEYS.settings, {}).mode || "local",
        firestoreReady: !!(window.PNXFirestoreBridge && window.PNXFirestoreBridge.isFirestore && window.PNXFirestoreBridge.isFirestore()),
        appBridgeReady: true
      };
      writeJson(KEYS.status, status);
      return status;
    },

    getTournaments(){
      const list = readJson(KEYS.tournaments, []);
      return Array.isArray(list) ? list : [];
    },

    saveTournament(input){
      const item = normalizeTournament(input);
      const list = upsert(this.getTournaments(), item, "tournamentId");
      writeJson(KEYS.tournaments, list);

      emit("PNX_CMS_TOURNAMENT_SAVED", { tournament:item });
      emit("pnx:cms-final:tournament-saved", { tournament:item });

      return item;
    },

    removeTournament(id){
      const target = String(id || "");
      const list = this.getTournaments().filter(t => String(t.id || t.tournamentId) !== target);
      writeJson(KEYS.tournaments, list);

      emit("pnx:cms-final:tournament-removed", { id:target });
      return true;
    },

    getFeaturedContents(){
      const list = readJson(KEYS.featured, []);
      return Array.isArray(list) ? list : [];
    },

    saveFeaturedContent(input){
      const item = normalizeFeatured(input);
      const list = upsert(this.getFeaturedContents(), item, "contentId");
      writeJson(KEYS.featured, list);

      emit("PNX_CMS_FEATURED_CONTENT_SAVED", { content:item });
      emit("pnx:cms-final:featured-saved", { content:item });

      return item;
    },

    saveBanner(input){
      const item = normalizeFeatured(Object.assign({}, input, { type:"banner" }));
      const banners = upsert(readJson(KEYS.banners, []), item, "contentId");
      writeJson(KEYS.banners, banners);
      this.saveFeaturedContent(item);
      return item;
    },

    getCategories(){
      const list = readJson(KEYS.categories, []);
      return Array.isArray(list) ? list : [];
    },

    saveCategories(categories){
      const list = Array.isArray(categories) ? categories.map((c, i) => ({
        id: c.id || uid("cat"),
        name: c.name || "カテゴリ",
        iconKey: c.iconKey || c.icon || "news",
        visible: c.visible !== false,
        order: Number(c.order || i + 1),
        updatedAt: now()
      })) : [];
      writeJson(KEYS.categories, list);
      emit("pnx:cms-final:categories-saved", { categories:list });
      return list;
    },

    syncFromCurrentCms(){
      const result = {
        syncedAt: now(),
        tournaments: 0,
        featured: 0,
        categories: 0
      };

      const tournaments = readJson(KEYS.tournaments, []);
      if (Array.isArray(tournaments)) result.tournaments = tournaments.length;

      const featured = readJson(KEYS.featured, []);
      if (Array.isArray(featured)) result.featured = featured.length;

      const categories = readJson(KEYS.categories, []);
      if (Array.isArray(categories)) result.categories = categories.length;

      emit("pnx:cms-final:synced-from-current", result);
      return result;
    },

    publishToApp(){
      const payload = {
        tournaments: this.getTournaments(),
        featured: this.getFeaturedContents(),
        categories: this.getCategories(),
        publishedAt: now()
      };

      emit("PNX_CMS_FINAL_PUBLISH_TO_APP", payload);
      emit("pnx:cms-final:publish", payload);

      try {
        window.__PNX_STEP134_ALLOW_PARENT_POST__ && window.parent && window.parent.postMessage({
          type: "PNX_REFRESH_APP_FROM_CMS",
          payload
        }, "*");
      } catch(e) {}

      return payload;
    },

    createDraft(type, data){
      const queue = readJson(KEYS.draftQueue, []);
      const draft = {
        id: uid("draft"),
        type: type || "unknown",
        data: data || {},
        createdAt: now(),
        status: "draft"
      };
      queue.push(draft);
      writeJson(KEYS.draftQueue, queue);
      emit("pnx:cms-final:draft-created", { draft });
      return draft;
    },

    setMode(mode){
      const settings = readJson(KEYS.settings, {});
      settings.mode = mode === "firestore" ? "firestore" : "local";
      settings.updatedAt = now();
      writeJson(KEYS.settings, settings);
      emit("pnx:cms-final:mode-changed", { mode:settings.mode });
      return settings;
    }
  };

  window.PNXCmsFinalDesignBridge = Bridge;

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(function(){
      const status = Bridge.status();
      emit("pnx:cms-final:ready", { status });
      console.info("[PNXCmsFinalDesignBridge] ready", status);
    }, 300);
  });
})();


/* ================================================================
   STEP64 publish timestamp patch
   別タブ/本体試合検索がCMS更新を拾いやすいように更新時刻を保存
   ================================================================ */
(function(){
  if (!window.PNXCmsFinalDesignBridge || window.__PNX_STEP64_CMS_PUBLISH_PATCH__) return;
  window.__PNX_STEP64_CMS_PUBLISH_PATCH__ = true;

  const bridge = window.PNXCmsFinalDesignBridge;
  const originalSaveTournament = bridge.saveTournament && bridge.saveTournament.bind(bridge);
  const originalPublishToApp = bridge.publishToApp && bridge.publishToApp.bind(bridge);

  function touch(){
    try {
      localStorage.setItem("PNX_CMS_TOURNAMENTS_UPDATED_AT", new Date().toISOString());
    } catch(e) {}
  }

  if (originalSaveTournament) {
    bridge.saveTournament = function(input){
      const result = originalSaveTournament(input);
      touch();
      try {
        window.dispatchEvent(new CustomEvent("PNX_CMS_TOURNAMENTS_UPDATED", { detail:{ tournament:result } }));
      } catch(e) {}
      return result;
    };
  }

  if (originalPublishToApp) {
    bridge.publishToApp = function(){
      const result = originalPublishToApp();
      touch();
      try {
        window.__PNX_STEP134_ALLOW_PARENT_POST__ && window.parent && window.parent.postMessage({
          type:"PNX_CMS_TOURNAMENTS_UPDATED",
          payload: result
        }, "*");
      } catch(e) {}
      return result;
    };
  }
})();


/* ================================================================
   STEP65: publish public tournaments only
   CMSには下書きを残し、本体アプリ公開用payloadでは下書きを除外
   ================================================================ */
(function(){
  if (!window.PNXCmsFinalDesignBridge || window.__PNX_STEP65_PUBLIC_PUBLISH_PATCH__) return;
  window.__PNX_STEP65_PUBLIC_PUBLISH_PATCH__ = true;

  const bridge = window.PNXCmsFinalDesignBridge;
  const originalPublishToApp = bridge.publishToApp && bridge.publishToApp.bind(bridge);

  function isPublicTournament(t){
    if (!t) return false;
    if (t.published === false || t.isPublished === false || t.visible === false) return false;
    const s = String(t.status || t.rawStatus || "").toLowerCase();
    if (/draft|下書き/.test(s)) return false;
    return true;
  }

  bridge.getPublicTournaments = function(){
    return bridge.getTournaments().filter(isPublicTournament);
  };

  if (originalPublishToApp) {
    bridge.publishToApp = function(){
      const payload = originalPublishToApp();
      const publicTournaments = bridge.getPublicTournaments();

      const nextPayload = Object.assign({}, payload, {
        tournaments: publicTournaments,
        draftHidden: true,
        publicTournamentCount: publicTournaments.length
      });

      try {
        window.dispatchEvent(new CustomEvent("PNX_CMS_FINAL_PUBLIC_PUBLISH_TO_APP", {
          detail: nextPayload
        }));
      } catch(e) {}

      try {
        window.__PNX_STEP134_ALLOW_PARENT_POST__ && window.parent && window.parent.postMessage({
          type:"PNX_CMS_FINAL_PUBLIC_PUBLISH_TO_APP",
          payload: nextPayload
        }, "*");
      } catch(e) {}

      return nextPayload;
    };
  }
})();


/* ================================================================
   STEP66: tournament management bridge helpers
   編集・削除・公開状態変更を扱いやすくする補助API
   ================================================================ */
(function(){
  if (!window.PNXCmsFinalDesignBridge || window.__PNX_STEP66_TOURNAMENT_MANAGE_PATCH__) return;
  window.__PNX_STEP66_TOURNAMENT_MANAGE_PATCH__ = true;

  const bridge = window.PNXCmsFinalDesignBridge;
  const originalRemove = bridge.removeTournament && bridge.removeTournament.bind(bridge);

  function touch(){
    try {
      localStorage.setItem("PNX_CMS_TOURNAMENTS_UPDATED_AT", new Date().toISOString());
    } catch(e) {}
  }

  bridge.updateTournament = function(id, patch){
    const target = bridge.getTournaments().find(t => String(t.id || t.tournamentId) === String(id));
    if (!target) return null;
    const saved = bridge.saveTournament(Object.assign({}, target, patch || {}, {
      tournamentId: target.tournamentId || target.id,
      id: target.id || target.tournamentId
    }));
    touch();
    return saved;
  };

  bridge.updateTournamentStatus = function(id, status){
    return bridge.updateTournament(id, {
      status,
      published: status !== "draft"
    });
  };

  bridge.getTournamentStats = function(){
    return bridge.getTournaments().reduce((acc, t) => {
      const s = t.status || "draft";
      acc.total += 1;
      acc[s] = (acc[s] || 0) + 1;
      if (s !== "draft" && t.published !== false) acc.public += 1;
      return acc;
    }, { total:0, public:0, draft:0, open:0, closed:0, ongoing:0, finished:0 });
  };

  bridge.bulkSaveTournaments = function(list){
    if (!Array.isArray(list)) return [];
    const saved = list.map(item => bridge.saveTournament(item));
    touch();
    return saved;
  };

  if (originalRemove) {
    bridge.removeTournament = function(id){
      const result = originalRemove(id);
      touch();
      try {
        window.dispatchEvent(new CustomEvent("PNX_CMS_TOURNAMENTS_UPDATED", {
          detail:{ removedId:id }
        }));
      } catch(e) {}
      return result;
    };
  }
})();


/* ================================================================
   STEP67: tournament validation / duplicate check bridge helpers
   公開前の不足項目・日付矛盾・重複候補をチェック
   ================================================================ */
(function(){
  if (!window.PNXCmsFinalDesignBridge || window.__PNX_STEP67_VALIDATION_PATCH__) return;
  window.__PNX_STEP67_VALIDATION_PATCH__ = true;

  const bridge = window.PNXCmsFinalDesignBridge;

  function text(v){
    return String(v == null ? "" : v).trim();
  }

  function normalizeName(v){
    return text(v)
      .toLowerCase()
      .replace(/[ 　\t\r\n]/g, "")
      .replace(/[（）()【】\[\]・･]/g, "")
      .replace(/第[0-9０-９]+戦/g, "")
      .replace(/202[0-9]年?/g, "");
  }

  function normalizeVenue(v){
    return text(v)
      .toLowerCase()
      .replace(/[ 　\t\r\n]/g, "")
      .replace(/カントリークラブ|cc|ゴルフクラブ|gc|ゴルフ場/g, "");
  }

  function toIso(v){
    const s = text(v);
    if (!s) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const m = s.match(/(20\d{2})[\/年\-.]\s*(\d{1,2})[\/月\-.]\s*(\d{1,2})/);
    if (m) return `${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`;
    return "";
  }

  function days(a, b){
    if (!a || !b) return null;
    const da = new Date(a + "T00:00:00");
    const db = new Date(b + "T00:00:00");
    if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return null;
    return Math.round((da - db) / 86400000);
  }

  function isPublicStatus(t){
    const s = text(t && t.status).toLowerCase();
    if (/draft|下書き/.test(s)) return false;
    if (t && (t.published === false || t.isPublished === false || t.visible === false)) return false;
    return true;
  }

  function duplicateIssues(t, all){
    const issues = [];
    const id = text(t.id || t.tournamentId);
    const nameKey = normalizeName(t.title || t.name);
    const venueKey = normalizeVenue(t.venue || t.course || t.place);
    const start = toIso(t.startDate || t.start || t.date) || text(t.startDate || t.start || t.date);

    if (!nameKey || !start) return issues;

    const duplicateByNameDate = (all || []).filter(x => {
      const xid = text(x.id || x.tournamentId);
      if (xid === id) return false;
      const xNameKey = normalizeName(x.title || x.name);
      const xStart = toIso(x.startDate || x.start || x.date) || text(x.startDate || x.start || x.date);
      return xNameKey && xNameKey === nameKey && xStart === start;
    });

    if (duplicateByNameDate.length) {
      issues.push({
        level:"error",
        code:"duplicate_name_date",
        message:`同じ大会名・同じ開催日の重複候補があります（${duplicateByNameDate.length}件）`
      });
    }

    if (venueKey) {
      const duplicateByVenueDate = (all || []).filter(x => {
        const xid = text(x.id || x.tournamentId);
        if (xid === id) return false;
        const xVenueKey = normalizeVenue(x.venue || x.course || x.place);
        const xStart = toIso(x.startDate || x.start || x.date) || text(x.startDate || x.start || x.date);
        return xVenueKey && xVenueKey === venueKey && xStart === start;
      });

      if (duplicateByVenueDate.length) {
        issues.push({
          level:"warning",
          code:"duplicate_venue_date",
          message:`同じ会場・同じ開催日の大会があります（${duplicateByVenueDate.length}件）`
        });
      }
    }

    return issues;
  }

  function validateTournament(t, all){
    const issues = [];
    const publicTarget = isPublicStatus(t);

    const title = text(t.title || t.name);
    const category = text(t.category || t.cat);
    const venue = text(t.venue || t.course || t.place);
    const start = toIso(t.startDate || t.start || t.date);
    const end = toIso(t.endDate || t.end || t.startDate || t.start || t.date);
    const deadline = toIso(t.entryDeadline || t.deadline);

    function missing(field, label){
      issues.push({
        level: publicTarget ? "error" : "warning",
        code:`missing_${field}`,
        message:`${label}が未入力です`
      });
    }

    if (!title || title === "大会名未設定" || title === "新規大会") missing("title", "大会名");
    if (!start) missing("startDate", "開催日");
    if (!venue || venue === "会場未定") missing("venue", "会場");
    if (!category || category === "未分類") missing("category", "カテゴリ");

    if (end && start && days(end, start) < 0) {
      issues.push({
        level:"error",
        code:"end_before_start",
        message:"終了日が開始日より前です"
      });
    }

    if (deadline && start && days(deadline, start) > 0) {
      issues.push({
        level:"error",
        code:"deadline_after_start",
        message:"エントリー締切が開催日より後になっています"
      });
    }

    if (!text(t.entryDeadline || t.deadline)) {
      issues.push({
        level:"warning",
        code:"missing_entry_deadline",
        message:"エントリー締切が未入力です"
      });
    }

    if (!text(t.entryFee)) {
      issues.push({
        level:"warning",
        code:"missing_entry_fee",
        message:"参加費が未入力です"
      });
    }

    issues.push(...duplicateIssues(t, all));

    const errors = issues.filter(x => x.level === "error");
    const warnings = issues.filter(x => x.level === "warning");

    return {
      id: text(t.id || t.tournamentId),
      title: title || "大会名未設定",
      status: text(t.status || "draft"),
      publicTarget,
      publishable: publicTarget && errors.length === 0,
      hasBlockingIssue: publicTarget && errors.length > 0,
      errorCount: errors.length,
      warningCount: warnings.length,
      issues
    };
  }

  bridge.validateTournament = function(t){
    return validateTournament(t, bridge.getTournaments());
  };

  bridge.validateAllTournaments = function(){
    const all = bridge.getTournaments();
    const results = all.map(t => validateTournament(t, all));
    return {
      checkedAt: new Date().toISOString(),
      total: results.length,
      publishable: results.filter(r => r.publishable).length,
      blocked: results.filter(r => r.hasBlockingIssue).length,
      draft: results.filter(r => !r.publicTarget).length,
      warnings: results.filter(r => r.warningCount > 0).length,
      results
    };
  };

  bridge.getPublishableTournaments = function(){
    const all = bridge.getTournaments();
    return all.filter(t => validateTournament(t, all).publishable);
  };

  bridge.getBlockedTournaments = function(){
    const all = bridge.getTournaments();
    return all.filter(t => validateTournament(t, all).hasBlockingIssue);
  };

  bridge.getPublicTournaments = function(){
    // STEP65の公開対象に加えて、STEP67の公開前チェックを通ったものだけ
    return bridge.getPublishableTournaments();
  };

  const originalPublish = bridge.publishToApp && bridge.publishToApp.bind(bridge);
  if (originalPublish && !originalPublish.__pnxStep67Wrapped) {
    const wrapped = function(){
      const validation = bridge.validateAllTournaments();
      const payload = originalPublish();
      const publishable = bridge.getPublishableTournaments();

      const nextPayload = Object.assign({}, payload, {
        tournaments: publishable,
        validation,
        blockedTournamentCount: validation.blocked,
        publicTournamentCount: publishable.length,
        validationRequired: validation.blocked > 0
      });

      try {
        window.dispatchEvent(new CustomEvent("PNX_CMS_FINAL_VALIDATED_PUBLISH_TO_APP", {
          detail: nextPayload
        }));
      } catch(e) {}

      try {
        window.__PNX_STEP134_ALLOW_PARENT_POST__ && window.parent && window.parent.postMessage({
          type:"PNX_CMS_FINAL_VALIDATED_PUBLISH_TO_APP",
          payload: nextPayload
        }, "*");
      } catch(e) {}

      return nextPayload;
    };
    wrapped.__pnxStep67Wrapped = true;
    bridge.publishToApp = wrapped;
  }
})();


/* ================================================================
   STEP68: stable public tournament snapshot for app search
   CMS公開対象大会だけを本体試合検索が確実に読めるスナップショットとして保存
   ================================================================ */
(function(){
  if (!window.PNXCmsFinalDesignBridge || window.__PNX_STEP68_SEARCH_SNAPSHOT_PATCH__) return;
  window.__PNX_STEP68_SEARCH_SNAPSHOT_PATCH__ = true;

  const bridge = window.PNXCmsFinalDesignBridge;
  const SNAPSHOT_KEY = "PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH";
  const META_KEY = "PNX_CMS_SEARCH_SYNC_META";
  const UPDATED_KEY = "PNX_CMS_TOURNAMENTS_UPDATED_AT";

  function now(){ return new Date().toISOString(); }

  function hashList(list){
    return (list || []).map(t => [
      t.id || t.tournamentId || "",
      t.title || t.name || "",
      t.status || "",
      t.startDate || t.date || "",
      t.venue || t.course || ""
    ].join("|")).join("::");
  }

  function safeWrite(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
  }

  function publicList(){
    if (typeof bridge.getPublishableTournaments === "function") {
      return bridge.getPublishableTournaments();
    }
    if (typeof bridge.getPublicTournaments === "function") {
      return bridge.getPublicTournaments();
    }
    return bridge.getTournaments().filter(t => {
      const s = String(t.status || "").toLowerCase();
      if (/draft|下書き/.test(s)) return false;
      if (t.published === false || t.isPublished === false || t.visible === false) return false;
      return true;
    });
  }

  bridge.createSearchSnapshot = function(){
    const tournaments = publicList();
    const meta = {
      version: "step68",
      createdAt: now(),
      count: tournaments.length,
      ids: tournaments.map(t => String(t.id || t.tournamentId || "")),
      hash: hashList(tournaments),
      source: "cms-final-reference"
    };

    safeWrite(SNAPSHOT_KEY, tournaments);
    safeWrite(META_KEY, meta);
    try { localStorage.setItem(UPDATED_KEY, meta.createdAt); } catch(e) {}

    try {
      window.dispatchEvent(new CustomEvent("PNX_CMS_SEARCH_SNAPSHOT_UPDATED", {
        detail:{ tournaments, meta }
      }));
    } catch(e) {}

    try {
      window.__PNX_STEP134_ALLOW_PARENT_POST__ && window.parent && window.parent.postMessage({
        type:"PNX_CMS_SEARCH_SNAPSHOT_UPDATED",
        payload:{ tournaments, meta }
      }, "*");
    } catch(e) {}

    return { tournaments, meta };
  };

  bridge.getSearchSnapshotMeta = function(){
    try { return JSON.parse(localStorage.getItem(META_KEY) || "null"); }
    catch(e){ return null; }
  };

  bridge.checkSearchSnapshot = function(){
    const snap = bridge.createSearchSnapshot();
    const all = bridge.getTournaments();
    const validation = typeof bridge.validateAllTournaments === "function"
      ? bridge.validateAllTournaments()
      : null;

    return {
      checkedAt: now(),
      totalCms: all.length,
      publicForSearch: snap.tournaments.length,
      draftOrBlocked: all.length - snap.tournaments.length,
      validation,
      meta: snap.meta
    };
  };

  const originalPublish = bridge.publishToApp && bridge.publishToApp.bind(bridge);
  if (originalPublish && !originalPublish.__pnxStep68Wrapped) {
    const wrapped = function(){
      const payload = originalPublish();
      const snap = bridge.createSearchSnapshot();

      const nextPayload = Object.assign({}, payload, {
        tournaments: snap.tournaments,
        searchSnapshotMeta: snap.meta,
        publicTournamentCount: snap.tournaments.length
      });

      try {
        window.dispatchEvent(new CustomEvent("PNX_CMS_FINAL_SEARCH_SYNC_PUBLISHED", {
          detail: nextPayload
        }));
      } catch(e) {}

      try {
        window.__PNX_STEP134_ALLOW_PARENT_POST__ && window.parent && window.parent.postMessage({
          type:"PNX_CMS_FINAL_SEARCH_SYNC_PUBLISHED",
          payload: nextPayload
        }, "*");
      } catch(e) {}

      return nextPayload;
    };
    wrapped.__pnxStep68Wrapped = true;
    bridge.publishToApp = wrapped;
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(function(){
      try { bridge.createSearchSnapshot(); } catch(e) {}
    }, 650);
  });
})();


/* ================================================================
   STEP69: live preview data helper
   最終CMS右側iPhoneプレビュー用の統合データを返す
   ================================================================ */
(function(){
  if (!window.PNXCmsFinalDesignBridge || window.__PNX_STEP69_LIVE_PREVIEW_PATCH__) return;
  window.__PNX_STEP69_LIVE_PREVIEW_PATCH__ = true;

  const bridge = window.PNXCmsFinalDesignBridge;

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch(e) {
      return fallback;
    }
  }

  bridge.getLivePreviewData = function(){
    const featured = bridge.getFeaturedContents ? bridge.getFeaturedContents() : readJson("PNX_CMS_FEATURED_CONTENTS", []);
    const banners = readJson("PNX_CMS_BANNERS", []);
    const categories = bridge.getCategories ? bridge.getCategories() : readJson("PNX_CMS_CATEGORIES", []);
    const tournaments = readJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", []);
    const syncMeta = readJson("PNX_CMS_SEARCH_SYNC_META", null);

    return {
      featured: Array.isArray(featured) ? featured : [],
      banners: Array.isArray(banners) ? banners : [],
      categories: Array.isArray(categories) ? categories : [],
      tournaments: Array.isArray(tournaments) ? tournaments : [],
      syncMeta,
      generatedAt: new Date().toISOString()
    };
  };
})();


/* ================================================================
   STEP70: CMS Storage / Backup / Firestore Prep
   localStorage中心の現在運用を整理し、バックアップ/復元/Firestore移行準備を追加
   ================================================================ */
(function(){
  if (!window.PNXCmsFinalDesignBridge || window.__PNX_STEP70_STORAGE_PATCH__) return;
  window.__PNX_STEP70_STORAGE_PATCH__ = true;

  const bridge = window.PNXCmsFinalDesignBridge;

  const STORAGE_KEYS = [
    "PNX_CMS_TOURNAMENTS",
    "PNX_CMS_FEATURED_CONTENTS",
    "PNX_CMS_BANNERS",
    "PNX_CMS_CATEGORIES",
    "PNX_CMS_MEDIA",
    "PNX_CMS_SETTINGS",
    "PNX_CMS_FINAL_DRAFT_QUEUE",
    "PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH",
    "PNX_CMS_SEARCH_SYNC_META",
    "PNX_CMS_TOURNAMENTS_UPDATED_AT"
  ];

  function now(){ return new Date().toISOString(); }

  function readRaw(key){
    try { return localStorage.getItem(key); } catch(e) { return null; }
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

  function writeJson(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
  }

  function sizeOf(value){
    try { return new Blob([String(value || "")]).size; }
    catch(e) { return String(value || "").length; }
  }

  bridge.getStorageKeys = function(){
    return STORAGE_KEYS.slice();
  };

  bridge.getStorageStatus = function(){
    const rows = STORAGE_KEYS.map(key => {
      const raw = readRaw(key);
      let count = null;
      try {
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) count = parsed.length;
        else if (parsed && typeof parsed === "object") count = Object.keys(parsed).length;
      } catch(e) {}

      return {
        key,
        exists: raw != null,
        bytes: sizeOf(raw || ""),
        count,
        updatedLike: key.includes("UPDATED") || key.includes("META")
      };
    });

    const settings = readJson("PNX_CMS_SETTINGS", {});
    return {
      checkedAt: now(),
      mode: settings.mode || "local",
      firestoreReady: !!(window.PNXFirestoreBridge && window.PNXFirestoreBridge.isFirestore && window.PNXFirestoreBridge.isFirestore()),
      totalBytes: rows.reduce((sum, r) => sum + r.bytes, 0),
      rows
    };
  };

  bridge.exportBackup = function(){
    const data = {};
    STORAGE_KEYS.forEach(key => {
      const raw = readRaw(key);
      if (raw == null) return;
      try { data[key] = JSON.parse(raw); }
      catch(e) { data[key] = raw; }
    });

    const backup = {
      app: "ProNexaX CMS",
      version: "step70",
      exportedAt: now(),
      storageMode: (readJson("PNX_CMS_SETTINGS", {}).mode || "local"),
      data
    };

    try {
      localStorage.setItem("PNX_CMS_LAST_BACKUP_META", JSON.stringify({
        exportedAt: backup.exportedAt,
        keys: Object.keys(data),
        bytes: sizeOf(JSON.stringify(backup))
      }));
    } catch(e) {}

    return backup;
  };

  bridge.downloadBackup = function(){
    const backup = bridge.exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type:"application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `pronexax-cms-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 600);
    return backup;
  };

  bridge.importBackup = function(backup, options){
    const opts = Object.assign({ overwrite:true }, options || {});
    if (!backup || typeof backup !== "object") {
      throw new Error("バックアップJSONが不正です");
    }

    const data = backup.data || backup;
    const imported = [];

    STORAGE_KEYS.forEach(key => {
      if (!(key in data)) return;
      if (!opts.overwrite && readRaw(key) != null) return;
      const value = data[key];
      if (typeof value === "string") {
        try { JSON.parse(value); localStorage.setItem(key, value); }
        catch(e) { localStorage.setItem(key, value); }
      } else {
        writeJson(key, value);
      }
      imported.push(key);
    });

    try {
      localStorage.setItem("PNX_CMS_TOURNAMENTS_UPDATED_AT", now());
    } catch(e) {}

    try {
      window.dispatchEvent(new CustomEvent("PNX_CMS_STORAGE_IMPORTED", {
        detail:{ imported, importedAt: now() }
      }));
    } catch(e) {}

    return {
      importedAt: now(),
      imported,
      count: imported.length
    };
  };

  bridge.setStorageMode = function(mode){
    const nextMode = mode === "firestore" ? "firestore" : "local";
    const settings = readJson("PNX_CMS_SETTINGS", {});
    settings.mode = nextMode;
    settings.updatedAt = now();
    settings.firestorePrep = nextMode === "firestore";
    writeJson("PNX_CMS_SETTINGS", settings);

    try {
      window.dispatchEvent(new CustomEvent("PNX_CMS_STORAGE_MODE_CHANGED", {
        detail:{ mode:nextMode, settings }
      }));
    } catch(e) {}

    return settings;
  };

  bridge.prepareFirestoreMigration = function(){
    const backup = bridge.exportBackup();
    const status = bridge.getStorageStatus();
    const migration = {
      preparedAt: now(),
      readyForFirestore: true,
      recommendedCollections: {
        tournaments: "tournaments",
        featured: "featuredContents",
        banners: "banners",
        categories: "categories",
        media: "media",
        settings: "cmsSettings"
      },
      backup,
      status
    };

    writeJson("PNX_CMS_FIRESTORE_MIGRATION_PREP", migration);

    try {
      window.dispatchEvent(new CustomEvent("PNX_CMS_FIRESTORE_MIGRATION_PREPARED", {
        detail:migration
      }));
    } catch(e) {}

    return migration;
  };
})();


/* ================================================================
   STEP71: CMS Media Library Operational Bridge
   画像・バナー・大会画像・記事サムネイルをlocalStorageで管理
   ================================================================ */
(function(){
  if (!window.PNXCmsFinalDesignBridge || window.__PNX_STEP71_MEDIA_LIBRARY_PATCH__) return;
  window.__PNX_STEP71_MEDIA_LIBRARY_PATCH__ = true;

  const bridge = window.PNXCmsFinalDesignBridge;
  const MEDIA_KEY = "PNX_CMS_MEDIA";

  function now(){ return new Date().toISOString(); }

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch(e) {
      return fallback;
    }
  }

  function writeJson(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
    return value;
  }

  function uid(prefix){
    return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  }

  function normalizeAsset(input){
    const a = input || {};
    const id = a.id || a.assetId || uid("media");
    const name = a.name || a.title || a.filename || "未命名メディア";
    const kind = a.kind || a.type || "image";
    const folder = a.folder || a.category || "general";

    return {
      id,
      assetId: id,
      name,
      title: name,
      filename: a.filename || name,
      kind,
      folder,
      url: a.url || a.src || a.dataUrl || "",
      dataUrl: a.dataUrl || "",
      mimeType: a.mimeType || "",
      sizeBytes: Number(a.sizeBytes || 0),
      width: a.width || "",
      height: a.height || "",
      alt: a.alt || name,
      usage: a.usage || "",
      tags: Array.isArray(a.tags) ? a.tags : [],
      source: a.source || "cms-media",
      createdAt: a.createdAt || now(),
      updatedAt: now()
    };
  }

  function getList(){
    const list = readJson(MEDIA_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  function saveList(list){
    writeJson(MEDIA_KEY, list);
    try {
      localStorage.setItem("PNX_CMS_MEDIA_UPDATED_AT", now());
    } catch(e) {}

    try {
      window.dispatchEvent(new CustomEvent("pnx:cms-final:media-updated", {
        detail:{ media:list, updatedAt:now() }
      }));
    } catch(e) {}

    return list;
  }

  bridge.getMediaAssets = function(filter){
    const list = getList();
    if (!filter) return list;

    return list.filter(a => {
      if (filter.folder && a.folder !== filter.folder) return false;
      if (filter.kind && a.kind !== filter.kind) return false;
      if (filter.q) {
        const q = String(filter.q).toLowerCase();
        const hay = [a.name, a.filename, a.alt, a.folder, a.usage, ...(a.tags || [])].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  };

  bridge.saveMediaAsset = function(input){
    const asset = normalizeAsset(input);
    const list = getList();
    const index = list.findIndex(x => x.id === asset.id || x.assetId === asset.id);
    if (index >= 0) list[index] = Object.assign({}, list[index], asset, { updatedAt:now() });
    else list.unshift(asset);

    saveList(list);
    return asset;
  };

  bridge.removeMediaAsset = function(id){
    const target = String(id || "");
    const list = getList().filter(a => String(a.id || a.assetId) !== target);
    saveList(list);
    return true;
  };

  bridge.getMediaStats = function(){
    const list = getList();
    const byFolder = {};
    let totalBytes = 0;

    list.forEach(a => {
      const f = a.folder || "general";
      byFolder[f] = (byFolder[f] || 0) + 1;
      totalBytes += Number(a.sizeBytes || 0);
    });

    return {
      checkedAt: now(),
      total: list.length,
      totalBytes,
      byFolder
    };
  };

  bridge.assignMediaToFeatured = function(assetId, contentId){
    const asset = getList().find(a => String(a.id || a.assetId) === String(assetId));
    if (!asset) return null;

    const contents = bridge.getFeaturedContents ? bridge.getFeaturedContents() : [];
    const target = contents.find(c => String(c.id || c.contentId) === String(contentId));
    if (!target) return null;

    const updated = bridge.saveFeaturedContent(Object.assign({}, target, {
      imageUrl: asset.dataUrl || asset.url,
      imageAssetId: asset.id || asset.assetId
    }));

    return updated;
  };
})();


/* ================================================================
   STEP72: CMS Media Asset Binding Bridge
   メディア素材をPICK UP・注目記事・大会・広告へ紐づける
   ================================================================ */
(function(){
  if (!window.PNXCmsFinalDesignBridge || window.__PNX_STEP72_MEDIA_BINDING_PATCH__) return;
  window.__PNX_STEP72_MEDIA_BINDING_PATCH__ = true;

  const bridge = window.PNXCmsFinalDesignBridge;

  function now(){ return new Date().toISOString(); }

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch(e) {
      return fallback;
    }
  }

  function writeJson(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
    return value;
  }

  function assetUrl(asset){
    return asset ? (asset.dataUrl || asset.url || "") : "";
  }

  function findAsset(assetId){
    const assets = bridge.getMediaAssets ? bridge.getMediaAssets() : readJson("PNX_CMS_MEDIA", []);
    return (assets || []).find(a => String(a.id || a.assetId) === String(assetId));
  }

  bridge.bindMediaToPickup = function(assetId){
    const asset = findAsset(assetId);
    if (!asset) return null;

    const banners = readJson("PNX_CMS_BANNERS", []);
    let target = banners.find(b => b && (b.type === "pickup-banner" || b.id === "pickup_main" || b.contentId === "pickup_main"));

    if (!target) {
      target = {
        id: "pickup_main",
        contentId: "pickup_main",
        type: "pickup-banner",
        title: "PICK UP",
        subtitle: "",
        cta: "詳しく見る",
        published: true,
        order: 1,
        source: "cms-final-media-binding"
      };
    }

    const updated = Object.assign({}, target, {
      imageUrl: assetUrl(asset),
      imageAssetId: asset.id || asset.assetId,
      imageAlt: asset.alt || asset.name || "",
      updatedAt: now()
    });

    const nextBanners = banners.filter(b => String(b.id || b.contentId) !== String(updated.id || updated.contentId));
    nextBanners.unshift(updated);
    writeJson("PNX_CMS_BANNERS", nextBanners);

    if (bridge.saveFeaturedContent) {
      bridge.saveFeaturedContent(updated);
    }

    try {
      window.dispatchEvent(new CustomEvent("pnx:cms-final:media-bound", {
        detail:{ target:"pickup", asset, content:updated }
      }));
    } catch(e) {}

    return updated;
  };

  bridge.bindMediaToFeaturedContent = function(assetId, contentId){
    const asset = findAsset(assetId);
    if (!asset) return null;

    const contents = bridge.getFeaturedContents ? bridge.getFeaturedContents() : readJson("PNX_CMS_FEATURED_CONTENTS", []);
    let target = (contents || []).find(c => String(c.id || c.contentId) === String(contentId));

    if (!target) {
      target = {
        id: contentId || ("article_" + Date.now()),
        contentId: contentId || ("article_" + Date.now()),
        type: "article",
        title: "新規記事",
        published: true,
        source: "cms-final-media-binding"
      };
    }

    const updated = Object.assign({}, target, {
      imageUrl: assetUrl(asset),
      imageAssetId: asset.id || asset.assetId,
      imageAlt: asset.alt || asset.name || "",
      updatedAt: now()
    });

    if (bridge.saveFeaturedContent) {
      bridge.saveFeaturedContent(updated);
    } else {
      const next = contents.filter(c => String(c.id || c.contentId) !== String(updated.id || updated.contentId));
      next.unshift(updated);
      writeJson("PNX_CMS_FEATURED_CONTENTS", next);
    }

    try {
      window.dispatchEvent(new CustomEvent("pnx:cms-final:media-bound", {
        detail:{ target:"featured", asset, content:updated }
      }));
    } catch(e) {}

    return updated;
  };

  bridge.bindMediaToTournament = function(assetId, tournamentId, field){
    const asset = findAsset(assetId);
    if (!asset) return null;

    const tournaments = bridge.getTournaments ? bridge.getTournaments() : readJson("PNX_CMS_TOURNAMENTS", []);
    const target = (tournaments || []).find(t => String(t.id || t.tournamentId) === String(tournamentId));
    if (!target) return null;

    const key = field || "venueImageUrl";
    const patch = {
      [key]: assetUrl(asset),
      imageAssetId: asset.id || asset.assetId,
      imageAlt: asset.alt || asset.name || "",
      updatedAt: now()
    };

    const updated = bridge.updateTournament
      ? bridge.updateTournament(tournamentId, patch)
      : bridge.saveTournament(Object.assign({}, target, patch));

    try {
      window.dispatchEvent(new CustomEvent("pnx:cms-final:media-bound", {
        detail:{ target:"tournament", asset, tournament:updated, field:key }
      }));
    } catch(e) {}

    return updated;
  };

  bridge.bindMediaToAd = function(assetId, adId){
    const asset = findAsset(assetId);
    if (!asset) return null;

    const ads = readJson("PNX_CMS_ADS", []);
    const id = adId || "ad_" + Date.now();
    const current = ads.find(a => String(a.id) === String(id)) || {
      id,
      title: asset.name || "広告画像",
      type: "image-ad",
      published: true,
      createdAt: now()
    };

    const updated = Object.assign({}, current, {
      imageUrl: assetUrl(asset),
      imageAssetId: asset.id || asset.assetId,
      updatedAt: now()
    });

    const next = ads.filter(a => String(a.id) !== String(id));
    next.unshift(updated);
    writeJson("PNX_CMS_ADS", next);

    try {
      window.dispatchEvent(new CustomEvent("pnx:cms-final:media-bound", {
        detail:{ target:"ad", asset, ad:updated }
      }));
    } catch(e) {}

    return updated;
  };

  bridge.getMediaBindingTargets = function(){
    const contents = bridge.getFeaturedContents ? bridge.getFeaturedContents() : readJson("PNX_CMS_FEATURED_CONTENTS", []);
    const tournaments = bridge.getTournaments ? bridge.getTournaments() : readJson("PNX_CMS_TOURNAMENTS", []);
    const banners = readJson("PNX_CMS_BANNERS", []);
    const ads = readJson("PNX_CMS_ADS", []);

    return {
      pickup: banners.filter(b => b && (b.type === "pickup-banner" || b.id === "pickup_main" || b.contentId === "pickup_main")),
      featured: (contents || []).filter(c => c && c.type === "article"),
      tournaments: tournaments || [],
      ads: ads || []
    };
  };
})();


/* ================================================================
   STEP83: Bulk Save Duplicate / Import History Bridge
   一括保存時の重複候補チェック・保存履歴・本体反映結果を管理
   ================================================================ */
(function(){
  if (!window.PNXCmsFinalDesignBridge || window.__PNX_STEP83_BULK_SAVE_PATCH__) return;
  window.__PNX_STEP83_BULK_SAVE_PATCH__ = true;

  const bridge = window.PNXCmsFinalDesignBridge;
  const HISTORY_KEY = "PNX_CMS_BULK_IMPORT_HISTORY";
  const LAST_KEY = "PNX_CMS_LAST_BULK_IMPORT";

  function now(){ return new Date().toISOString(); }

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch(e) {
      return fallback;
    }
  }

  function writeJson(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
    return value;
  }

  function clean(v){
    return String(v == null ? "" : v)
      .trim()
      .toLowerCase()
      .replace(/[ 　\t\r\n]/g, "")
      .replace(/[（）()【】\[\]・･]/g, "");
  }

  function date(v){
    return String(v == null ? "" : v).slice(0,10);
  }

  function duplicateKey(t){
    return [
      clean(t.title || t.name),
      date(t.startDate || t.start || t.date),
      clean(t.venue || t.course || t.place)
    ].join("|");
  }

  function findDuplicates(draft, existing){
    const key = duplicateKey(draft);
    if (key.replace(/\|/g, "").length < 3) return [];

    return (existing || []).filter(t => {
      const tid = String(t.id || t.tournamentId || "");
      const did = String(draft.id || draft.tournamentId || "");
      if (tid && did && tid === did) return false;
      return duplicateKey(t) === key;
    });
  }

  bridge.findBulkImportDuplicates = function(drafts){
    const existing = bridge.getTournaments ? bridge.getTournaments() : [];
    const rows = (drafts || []).map((draft, index) => {
      const duplicates = findDuplicates(draft, existing);
      return {
        index,
        id: draft.id || draft.tournamentId || "",
        title: draft.title || draft.name || "大会名未設定",
        duplicateCount: duplicates.length,
        duplicateIds: duplicates.map(t => t.id || t.tournamentId),
        duplicateTitles: duplicates.map(t => t.title || t.name)
      };
    });

    return {
      checkedAt: now(),
      total: rows.length,
      duplicated: rows.filter(r => r.duplicateCount > 0).length,
      rows
    };
  };

  bridge.bulkImportTournaments = function(drafts, options){
    const opts = Object.assign({
      status: "draft",
      skipDuplicates: true,
      publishAfterSave: true,
      source: "bulk-import"
    }, options || {});

    const existing = bridge.getTournaments ? bridge.getTournaments() : [];
    const saved = [];
    const skipped = [];
    const failed = [];

    (drafts || []).forEach((draft, index) => {
      try {
        const duplicates = findDuplicates(draft, existing.concat(saved));
        if (opts.skipDuplicates && duplicates.length) {
          skipped.push({
            index,
            title: draft.title || draft.name || "大会名未設定",
            reason: "duplicate",
            duplicateIds: duplicates.map(t => t.id || t.tournamentId),
            duplicateTitles: duplicates.map(t => t.title || t.name)
          });
          return;
        }

        const nextStatus = opts.status || draft.status || "draft";
        const item = Object.assign({}, draft, {
          status: nextStatus,
          published: nextStatus !== "draft",
          source: draft.source || opts.source,
          importedAt: now()
        });

        const result = bridge.saveTournament(item);
        saved.push(result);
      } catch(e) {
        failed.push({
          index,
          title: draft && (draft.title || draft.name) || "大会名未設定",
          error: e.message || String(e)
        });
      }
    });

    let snapshot = null;
    let publish = null;
    try {
      if (bridge.createSearchSnapshot) snapshot = bridge.createSearchSnapshot();
      if (opts.publishAfterSave && bridge.publishToApp) publish = bridge.publishToApp();
    } catch(e) {
      failed.push({ index:-1, title:"publish", error:e.message || String(e) });
    }

    const record = {
      id: "bulk_import_" + Date.now(),
      importedAt: now(),
      status: opts.status,
      skipDuplicates: opts.skipDuplicates,
      total: (drafts || []).length,
      savedCount: saved.length,
      skippedCount: skipped.length,
      failedCount: failed.length,
      savedIds: saved.map(t => t.id || t.tournamentId),
      skipped,
      failed,
      snapshotMeta: snapshot && snapshot.meta || null,
      publicTournamentCount: publish && publish.publicTournamentCount || null
    };

    const history = readJson(HISTORY_KEY, []);
    history.unshift(record);
    writeJson(HISTORY_KEY, history.slice(0, 50));
    writeJson(LAST_KEY, record);

    try {
      window.dispatchEvent(new CustomEvent("pnx:cms-final:bulk-import-finished", {
        detail: record
      }));
    } catch(e) {}

    return record;
  };

  bridge.getBulkImportHistory = function(){
    return readJson(HISTORY_KEY, []);
  };

  bridge.getLastBulkImport = function(){
    return readJson(LAST_KEY, null);
  };

  bridge.clearBulkImportHistory = function(){
    writeJson(HISTORY_KEY, []);
    writeJson(LAST_KEY, null);
    return true;
  };
})();


/* ================================================================
   STEP85: CMS → App Reflection Hard Sync Bridge
   CMS保存大会を本体試合検索へ確実に渡すための強制同期スナップショット
   ================================================================ */
(function(){
  if (!window.PNXCmsFinalDesignBridge || window.__PNX_STEP85_REFLECTION_BRIDGE__) return;
  window.__PNX_STEP85_REFLECTION_BRIDGE__ = true;

  const bridge = window.PNXCmsFinalDesignBridge;
  const SNAPSHOT_KEY = "PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH";
  const ALL_KEY = "PNX_CMS_TOURNAMENTS";
  const META_KEY = "PNX_CMS_SEARCH_SYNC_META";
  const UPDATED_KEY = "PNX_CMS_TOURNAMENTS_UPDATED_AT";
  const HARD_SYNC_KEY = "PNX_STEP85_HARD_SYNC_PAYLOAD";

  function now(){ return new Date().toISOString(); }

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch(e) {
      return fallback;
    }
  }

  function writeJson(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
    return value;
  }

  function text(v){ return String(v == null ? "" : v).trim(); }

  function isPublic(t){
    if (!t) return false;
    const s = text(t.status || t.rawStatus || "draft").toLowerCase();
    if (/draft|下書き/.test(s)) return false;
    if (t.published === false || t.isPublished === false || t.visible === false) return false;
    return true;
  }

  function hasRequired(t){
    return !!(
      text(t.title || t.name) &&
      text(t.startDate || t.start || t.date) &&
      text(t.venue || t.course || t.place) &&
      text(t.category || t.cat)
    );
  }

  function normalizeForSearch(t, index){
    const id = text(t.id || t.tournamentId) || ("cms_step85_" + Date.now() + "_" + index);
    const title = text(t.title || t.name) || "CMS登録大会";
    const start = text(t.startDate || t.start || t.date);
    const end = text(t.endDate || t.end || t.startDate || t.start || t.date) || start;
    const venue = text(t.venue || t.course || t.place) || "会場未定";
    const category = text(t.category || t.cat) || "未分類";

    return Object.assign({}, t, {
      id,
      tournamentId: id,
      title,
      name: title,
      startDate: start,
      start,
      endDate: end,
      end,
      venue,
      course: venue,
      category,
      cat: category,
      prefecture: text(t.prefecture || t.pref),
      area: text(t.area),
      entryDeadline: text(t.entryDeadline || t.deadline),
      entryFee: text(t.entryFee || t.fee),
      prize: text(t.prize || t.totalPrize),
      prizeWinner: text(t.prizeWinner || t.winnerPrize),
      winnerPrize: text(t.winnerPrize || t.prizeWinner),
      eligibility: text(t.eligibility || t.qualification),
      qualification: text(t.qualification || t.eligibility),
      organizer: text(t.organizer),
      status: text(t.status || "open"),
      published: true,
      source: "cms",
      cmsSource: t.source || "step85-hard-sync"
    });
  }

  bridge.createHardSearchSnapshot = function(){
    const all = bridge.getTournaments ? bridge.getTournaments() : readJson(ALL_KEY, []);
    const publicItems = (Array.isArray(all) ? all : [])
      .filter(isPublic)
      .filter(hasRequired)
      .map(normalizeForSearch);

    const meta = {
      version: "step85",
      createdAt: now(),
      count: publicItems.length,
      ids: publicItems.map(t => String(t.id || t.tournamentId || "")),
      source: "cms-hard-sync",
      origin: location.origin,
      path: location.pathname
    };

    writeJson(SNAPSHOT_KEY, publicItems);
    writeJson(META_KEY, meta);
    writeJson(UPDATED_KEY, meta.createdAt);
    writeJson(HARD_SYNC_KEY, { meta, tournaments: publicItems });

    try {
      window.dispatchEvent(new CustomEvent("PNX_STEP85_HARD_SYNC_UPDATED", {
        detail:{ meta, tournaments: publicItems }
      }));
    } catch(e) {}

    try {
      window.__PNX_STEP134_ALLOW_PARENT_POST__ && window.parent && window.parent.postMessage({
        type:"PNX_STEP85_HARD_SYNC_UPDATED",
        payload:{ meta, tournaments: publicItems }
      }, "*");
    } catch(e) {}

    return { meta, tournaments: publicItems };
  };

  bridge.diagnoseAppReflection = function(){
    const all = bridge.getTournaments ? bridge.getTournaments() : readJson(ALL_KEY, []);
    const snapshot = readJson(SNAPSHOT_KEY, []);
    const meta = readJson(META_KEY, null);
    const hard = readJson(HARD_SYNC_KEY, null);

    const result = {
      checkedAt: now(),
      origin: location.origin,
      path: location.pathname,
      cmsTournamentCount: Array.isArray(all) ? all.length : 0,
      publicEligibleCount: Array.isArray(all) ? all.filter(isPublic).filter(hasRequired).length : 0,
      snapshotCount: Array.isArray(snapshot) ? snapshot.length : 0,
      meta,
      hardSyncExists: !!hard,
      lastTitles: (Array.isArray(snapshot) ? snapshot : []).slice(0,5).map(t => t.title || t.name),
      ok: Array.isArray(snapshot) && snapshot.length > 0
    };

    try { localStorage.setItem("PNX_STEP85_CMS_REFLECTION_DIAG", JSON.stringify(result)); } catch(e) {}
    return result;
  };

  const originalSave = bridge.saveTournament && bridge.saveTournament.bind(bridge);
  if (originalSave && !originalSave.__pnxStep85Wrapped) {
    const wrappedSave = function(input){
      const result = originalSave(input);
      try { bridge.createHardSearchSnapshot(); } catch(e) {}
      return result;
    };
    wrappedSave.__pnxStep85Wrapped = true;
    bridge.saveTournament = wrappedSave;
  }

  const originalPublish = bridge.publishToApp && bridge.publishToApp.bind(bridge);
  if (originalPublish && !originalPublish.__pnxStep85Wrapped) {
    const wrappedPublish = function(){
      const payload = originalPublish();
      const hard = bridge.createHardSearchSnapshot();
      return Object.assign({}, payload || {}, {
        tournaments: hard.tournaments,
        publicTournamentCount: hard.tournaments.length,
        searchSnapshotMeta: hard.meta,
        step85HardSync: true
      });
    };
    wrappedPublish.__pnxStep85Wrapped = true;
    bridge.publishToApp = wrappedPublish;
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(function(){
      try { bridge.createHardSearchSnapshot(); } catch(e) {}
    }, 1000);
  });
})();


/* ================================================================
   STEP134: final safe local publish override
   親画面postMessageを使わず、localStorageスナップショットだけ作る。
   ================================================================ */
(function(){
  if (!window.PNXCmsFinalDesignBridge || window.__PNX_STEP134_SAFE_BRIDGE_PATCH__) return;
  window.__PNX_STEP134_SAFE_BRIDGE_PATCH__ = true;

  const bridge = window.PNXCmsFinalDesignBridge;

  function now(){ return new Date().toISOString(); }

  function readJson(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(e){ return fallback; }
  }

  function writeJson(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
    return value;
  }

  function text(v){ return String(v == null ? "" : v).trim(); }

  function isPublic(t){
    if (!t) return false;
    if (t.published === false || t.isPublished === false || t.visible === false) return false;
    const status = text(t.status || t.rawStatus).toLowerCase();
    if (!status || /draft|下書き/.test(status)) return false;
    return true;
  }

  function hasRequired(t){
    return !!(
      text(t.title || t.name) &&
      text(t.startDate || t.date || t.start) &&
      text(t.venue || t.course || t.place || t.location)
    );
  }

  function normalizeForSearch(t){
    const title = text(t.title || t.name);
    const startDate = text(t.startDate || t.date || t.start);
    const endDate = text(t.endDate || t.end || startDate) || startDate;
    const venue = text(t.venue || t.course || t.place || t.location);
    const id = text(t.id || t.tournamentId) || ("cms_" + Date.now() + "_" + Math.random().toString(16).slice(2));

    return Object.assign({}, t, {
      id,
      tournamentId: id,
      title,
      name: title,
      startDate,
      date: startDate,
      endDate,
      end: endDate,
      venue,
      course: venue,
      place: venue,
      status: text(t.status || "open"),
      published: true,
      source: t.source || "cms-step134-safe"
    });
  }

  bridge.createSearchSnapshot = function(){
    const all = bridge.getTournaments ? bridge.getTournaments() : readJson("PNX_CMS_TOURNAMENTS", []);
    const tournaments = (Array.isArray(all) ? all : [])
      .filter(isPublic)
      .filter(hasRequired)
      .map(normalizeForSearch);

    const meta = {
      version: "step134-safe-local",
      createdAt: now(),
      count: tournaments.length,
      noParentPostMessage: true,
      noNavigation: true
    };

    writeJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", tournaments);
    writeJson("PNX_CMS_SEARCH_SYNC_META", meta);
    try { localStorage.setItem("PNX_CMS_TOURNAMENTS_UPDATED_AT", meta.createdAt); } catch(e) {}

    try {
      window.dispatchEvent(new CustomEvent("PNX_STEP134_SAFE_SEARCH_SNAPSHOT_UPDATED", {
        detail:{ meta, tournaments }
      }));
    } catch(e) {}

    return { tournaments, meta };
  };

  bridge.createHardSearchSnapshot = function(){
    const snap = bridge.createSearchSnapshot();
    writeJson("PNX_STEP85_HARD_SEARCH_SNAPSHOT", snap);
    return snap;
  };

  bridge.publishToApp = function(){
    const hard = bridge.createHardSearchSnapshot();
    const payload = {
      ok: true,
      tournaments: hard.tournaments,
      publicTournamentCount: hard.tournaments.length,
      searchSnapshotMeta: hard.meta,
      publishedAt: hard.meta.createdAt,
      step134SafeLocalPublish: true,
      noParentPostMessage: true,
      noNavigation: true
    };

    try {
      window.dispatchEvent(new CustomEvent("PNX_STEP134_SAFE_LOCAL_PUBLISH", {
        detail: payload
      }));
    } catch(e) {}

    window.__PNX_STEP134_LAST_SAFE_PUBLISH__ = payload;
    return payload;
  };

  bridge.diagnoseAppReflection = function(){
    const snapshot = readJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", []);
    const meta = readJson("PNX_CMS_SEARCH_SYNC_META", null);
    const hard = readJson("PNX_STEP85_HARD_SEARCH_SNAPSHOT", null);
    return {
      checkedAt: now(),
      cmsTournamentCount: (bridge.getTournaments ? bridge.getTournaments() : readJson("PNX_CMS_TOURNAMENTS", [])).length,
      snapshotCount: Array.isArray(snapshot) ? snapshot.length : 0,
      meta,
      hardSyncExists: !!hard,
      ok: Array.isArray(snapshot) && snapshot.length > 0,
      noParentPostMessage: true,
      noNavigation: true
    };
  };

  window.PNXStep134BridgeStatus = function(){
    return {
      step: 134,
      allowParentPost: window.__PNX_STEP134_ALLOW_PARENT_POST__ === true,
      lastPublish: window.__PNX_STEP134_LAST_SAFE_PUBLISH__ || null,
      snapshot: bridge.getSearchSnapshotMeta ? bridge.getSearchSnapshotMeta() : readJson("PNX_CMS_SEARCH_SYNC_META", null),
      note: "CMS Bridgeの親画面postMessageは無効。反映はlocalStorageのみ。"
    };
  };
})();


/* ================================================================
   STEP135: Search sync meta shape safety
   CmsSearchSyncStabilityPanelが meta.ids.length / meta.hash.slice を読んでも落ちない形に統一。
   親画面postMessageは引き続き無効。
   ================================================================ */
(function(){
  if (!window.PNXCmsFinalDesignBridge || window.__PNX_STEP135_SEARCH_SYNC_META_PATCH__) return;
  window.__PNX_STEP135_SEARCH_SYNC_META_PATCH__ = true;

  const bridge = window.PNXCmsFinalDesignBridge;

  function now(){ return new Date().toISOString(); }

  function readJson(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(e){ return fallback; }
  }

  function writeJson(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
    return value;
  }

  function text(v){ return String(v == null ? "" : v).trim(); }

  function hashString(s){
    let h = 0;
    const str = String(s || "");
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return "h" + Math.abs(h).toString(16);
  }

  function isPublic(t){
    if (!t) return false;
    if (t.published === false || t.isPublished === false || t.visible === false) return false;
    const status = text(t.status || t.rawStatus).toLowerCase();
    if (!status || /draft|下書き/.test(status)) return false;
    return true;
  }

  function hasRequired(t){
    return !!(
      text(t.title || t.name) &&
      text(t.startDate || t.date || t.start) &&
      text(t.venue || t.course || t.place || t.location)
    );
  }

  function normalizeForSearch(t){
    const title = text(t.title || t.name);
    const startDate = text(t.startDate || t.date || t.start);
    const endDate = text(t.endDate || t.end || startDate) || startDate;
    const venue = text(t.venue || t.course || t.place || t.location);
    const id = text(t.id || t.tournamentId) || ("cms_" + title + "_" + startDate).replace(/\s+/g, "_");

    return Object.assign({}, t, {
      id,
      tournamentId: text(t.tournamentId || id),
      title,
      name: title,
      startDate,
      date: startDate,
      endDate,
      end: endDate,
      venue,
      course: venue,
      place: venue,
      status: text(t.status || "open"),
      published: true,
      source: t.source || "cms-step135-safe"
    });
  }

  function buildSnapshot(){
    const all = bridge.getTournaments ? bridge.getTournaments() : readJson("PNX_CMS_TOURNAMENTS", []);
    const source = Array.isArray(all) ? all : [];
    const tournaments = source
      .filter(isPublic)
      .filter(hasRequired)
      .map(normalizeForSearch);

    const ids = tournaments.map(t => String(t.id || t.tournamentId || t.title || ""));
    const hash = hashString(JSON.stringify(ids) + JSON.stringify(tournaments.map(t => [t.title, t.startDate, t.venue, t.status])));

    const meta = {
      version: "step135-safe-meta",
      createdAt: now(),
      updatedAt: now(),
      count: tournaments.length,
      ids,
      hash,
      noParentPostMessage: true,
      noNavigation: true
    };

    return { all: source, tournaments, meta };
  }

  bridge.createSearchSnapshot = function(){
    const snap = buildSnapshot();

    writeJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", snap.tournaments);
    writeJson("PNX_CMS_SEARCH_SYNC_META", snap.meta);
    try { localStorage.setItem("PNX_CMS_TOURNAMENTS_UPDATED_AT", snap.meta.createdAt); } catch(e) {}

    try {
      window.dispatchEvent(new CustomEvent("PNX_STEP135_SAFE_SEARCH_SNAPSHOT_UPDATED", {
        detail:{ meta:snap.meta, tournaments:snap.tournaments }
      }));
    } catch(e) {}

    return { tournaments:snap.tournaments, meta:snap.meta };
  };

  bridge.createHardSearchSnapshot = function(){
    const snap = bridge.createSearchSnapshot();
    writeJson("PNX_STEP85_HARD_SEARCH_SNAPSHOT", snap);
    return snap;
  };

  bridge.getSearchSnapshotMeta = function(){
    const meta = readJson("PNX_CMS_SEARCH_SYNC_META", null);
    if (!meta) {
      return {
        version:"step135-empty",
        createdAt:null,
        updatedAt:null,
        count:0,
        ids:[],
        hash:"",
        noParentPostMessage:true,
        noNavigation:true
      };
    }

    return Object.assign({
      version:"step135-safe-meta",
      createdAt:null,
      updatedAt:null,
      count:0,
      ids:[],
      hash:"",
      noParentPostMessage:true,
      noNavigation:true
    }, meta, {
      ids:Array.isArray(meta.ids) ? meta.ids : [],
      hash:String(meta.hash || "")
    });
  };

  bridge.checkSearchSnapshot = function(){
    const snap = bridge.createSearchSnapshot();
    const all = bridge.getTournaments ? bridge.getTournaments() : readJson("PNX_CMS_TOURNAMENTS", []);
    const totalCms = Array.isArray(all) ? all.length : 0;
    const publicForSearch = Array.isArray(snap.tournaments) ? snap.tournaments.length : 0;

    return {
      checkedAt: now(),
      totalCms,
      publicForSearch,
      draftOrBlocked: Math.max(0, totalCms - publicForSearch),
      validation: bridge.validateAllTournaments ? bridge.validateAllTournaments() : null,
      meta: Object.assign({
        ids:[],
        hash:"",
        count:publicForSearch,
        noParentPostMessage:true,
        noNavigation:true
      }, snap.meta || {}, {
        ids:Array.isArray(snap.meta && snap.meta.ids) ? snap.meta.ids : [],
        hash:String((snap.meta && snap.meta.hash) || "")
      })
    };
  };

  bridge.publishToApp = function(){
    const hard = bridge.createHardSearchSnapshot();
    const payload = {
      ok:true,
      tournaments:hard.tournaments,
      publicTournamentCount:Array.isArray(hard.tournaments) ? hard.tournaments.length : 0,
      searchSnapshotMeta:hard.meta,
      publishedAt:hard.meta && hard.meta.createdAt,
      step135SafeLocalPublish:true,
      noParentPostMessage:true,
      noNavigation:true
    };

    try {
      window.dispatchEvent(new CustomEvent("PNX_STEP135_SAFE_LOCAL_PUBLISH", { detail:payload }));
    } catch(e) {}

    window.__PNX_STEP135_LAST_SAFE_PUBLISH__ = payload;
    return payload;
  };

  window.PNXStep135BridgeStatus = function(){
    return {
      step:135,
      meta: bridge.getSearchSnapshotMeta(),
      lastPublish: window.__PNX_STEP135_LAST_SAFE_PUBLISH__ || null,
      noParentPostMessage:true,
      noNavigation:true,
      note:"CmsSearchSyncStabilityPanel用にmeta.ids/hashを必ず返します。"
    };
  };
})();
