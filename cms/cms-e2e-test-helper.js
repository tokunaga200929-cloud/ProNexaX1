/* ================================================================
   STEP79: CMS → App E2E Test Helper
   CMSでテスト大会を作成し、本体反映用スナップショットまで作る
   ================================================================ */
(function(){
  if (window.__PNX_STEP79_CMS_E2E_HELPER__) return;
  window.__PNX_STEP79_CMS_E2E_HELPER__ = true;

  function todayPlus(days){
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function getBridge(){
    return window.PNXCmsFinalDesignBridge || null;
  }

  function createTestTournament(options){
    const bridge = getBridge();
    if (!bridge) throw new Error("PNXCmsFinalDesignBridge が見つかりません");

    const opt = options || {};
    const stamp = Date.now();
    const id = opt.id || "step79_e2e_" + stamp;

    const tournament = {
      id,
      tournamentId: id,
      title: opt.title || "STEP79 通しテスト大会",
      name: opt.title || "STEP79 通しテスト大会",
      category: opt.category || "ミニツアー",
      gender: opt.gender || "男子",
      startDate: opt.startDate || todayPlus(14),
      endDate: opt.endDate || opt.startDate || todayPlus(14),
      prefecture: opt.prefecture || "埼玉県",
      area: opt.area || "関東",
      venue: opt.venue || "ProNexaX テストカントリークラブ",
      entryDeadline: opt.entryDeadline || todayPlus(7),
      entryFee: opt.entryFee || "18000",
      prize: opt.prize || "500000",
      winnerPrize: opt.winnerPrize || "150000",
      capacity: opt.capacity || "80",
      eligibility: opt.eligibility || "プロ・研修生・競技アマ",
      organizer: opt.organizer || "ProNexaX Test",
      status: opt.status || "draft",
      published: (opt.status || "draft") !== "draft",
      source: "step79-e2e"
    };

    const saved = bridge.saveTournament(tournament);

    return saved;
  }

  function preparePublishedTestTournament(options){
    const bridge = getBridge();
    if (!bridge) throw new Error("PNXCmsFinalDesignBridge が見つかりません");

    const draft = createTestTournament(Object.assign({}, options || {}, { status:"draft" }));
    const open = bridge.updateTournamentStatus
      ? bridge.updateTournamentStatus(draft.id || draft.tournamentId, "open")
      : bridge.saveTournament(Object.assign({}, draft, { status:"open", published:true }));

    const validation = bridge.validateAllTournaments ? bridge.validateAllTournaments() : null;
    const snapshot = bridge.createSearchSnapshot ? bridge.createSearchSnapshot() : null;
    const publish = bridge.publishToApp ? bridge.publishToApp() : null;

    const result = {
      checkedAt: new Date().toISOString(),
      draft,
      open,
      validation,
      snapshotMeta: snapshot && snapshot.meta,
      publishMeta: publish && (publish.searchSnapshotMeta || null),
      publicCount: publish && publish.publicTournamentCount,
      id: open && (open.id || open.tournamentId),
      title: open && (open.title || open.name)
    };

    try {
      localStorage.setItem("PNX_STEP79_CMS_E2E_RESULT", JSON.stringify(result));
    } catch(e) {}

    return result;
  }

  function checkCmsE2EState(){
    const bridge = getBridge();
    const result = {
      checkedAt: new Date().toISOString(),
      bridgeReady: !!bridge,
      tournaments: 0,
      publicSnapshot: 0,
      validation: null,
      searchMeta: null,
      ok: false,
      warnings: []
    };

    if (!bridge) {
      result.warnings.push("Bridge未接続");
      return result;
    }

    try {
      result.tournaments = bridge.getTournaments ? bridge.getTournaments().length : 0;
      result.validation = bridge.validateAllTournaments ? bridge.validateAllTournaments() : null;
      result.searchMeta = bridge.getSearchSnapshotMeta ? bridge.getSearchSnapshotMeta() : null;
      const snap = JSON.parse(localStorage.getItem("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH") || "[]");
      result.publicSnapshot = Array.isArray(snap) ? snap.length : 0;
    } catch(e) {
      result.warnings.push(e.message || String(e));
    }

    result.ok = result.bridgeReady && result.publicSnapshot > 0;
    return result;
  }

  function printCmsE2EState(){
    const result = checkCmsE2EState();
    console.group("ProNexaX STEP79 CMS E2E");
    console.log(result);
    console.groupEnd();
    return result;
  }

  window.PNXCreateStep79TestTournament = createTestTournament;
  window.PNXPrepareStep79PublishedTournament = preparePublishedTestTournament;
  window.PNXCheckCmsE2EState = checkCmsE2EState;
  window.PNXPrintCmsE2EState = printCmsE2EState;

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(function(){
      try {
        console.info("[STEP79] CMS E2E helper ready. Use PNXPrepareStep79PublishedTournament()");
      } catch(e) {}
    }, 1000);
  });
})();
