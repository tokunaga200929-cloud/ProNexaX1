/* ================================================================
   STEP273: Tournament Firestore Sync
   CMSで保存した大会をFirestoreへ保存し、本体試合検索はFirestoreから読む
   ================================================================ */
(function(){
  if (window.PNXTournamentFirestoreSync && window.PNXTournamentFirestoreSync.version === "step273") return;

  const KEYS = {
    all: "PNX_CMS_TOURNAMENTS",
    public: "PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH",
    meta: "PNX_CMS_SEARCH_SYNC_META",
    updated: "PNX_CMS_TOURNAMENTS_UPDATED_AT",
    hard: "PNX_STEP85_HARD_SYNC_PAYLOAD",
    lastStatus: "PNX_FIRESTORE_TOURNAMENT_SYNC_STATUS"
  };

  function now(){ return new Date().toISOString(); }

  function text(v){ return String(v == null ? "" : v).trim(); }

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

  function hasRealConfig(){
    const c = window.PNX_FIREBASE_CONFIG || {};
    return !!(
      c.apiKey &&
      c.projectId &&
      c.apiKey !== "YOUR_API_KEY" &&
      c.projectId !== "YOUR_PROJECT_ID"
    );
  }

  async function ensureDb(){
    if (!hasRealConfig()) return null;
    if (window.PNXFirebaseApp && window.PNXFirebaseApp.init) {
      const ready = await window.PNXFirebaseApp.init();
      return ready ? window.PNXFirebaseApp.db : null;
    }

    if (window.PNXFirebaseSdkLoader) await window.PNXFirebaseSdkLoader.load();
    if (!window.firebase) return null;
    if (!window.firebase.apps || !window.firebase.apps.length) {
      window.firebase.initializeApp(window.PNX_FIREBASE_CONFIG);
    }
    return window.firebase.firestore();
  }

  function collectionName(){
    const c = window.PNX_FIRESTORE_COLLECTIONS || {};
    return c.tournaments || "tournaments";
  }

  function isPublic(t){
    if (!t) return false;
    const status = text(t.status || t.rawStatus || "draft").toLowerCase();
    if (/draft|下書き/.test(status)) return false;
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

  function pick(){
    for (let i = 0; i < arguments.length; i++) {
      const v = arguments[i];
      if (Array.isArray(v)) {
        const joined = v.map(text).filter(Boolean).join(" / ");
        if (joined) return joined;
      } else {
        const s = text(v);
        if (s && s !== "不明" && s !== "—" && s !== "-") return s;
      }
    }
    return "";
  }

  function toDate(value){
    const s = text(value);
    if (!s || s === "不明" || s === "—" || s === "-") return "";
    const iso = s.match(/(20\d{2})[-/.年]\s*(\d{1,2})[-/.月]\s*(\d{1,2})/);
    if (iso) return `${iso[1]}-${String(iso[2]).padStart(2,"0")}-${String(iso[3]).padStart(2,"0")}`;
    if (/^20\d{2}-\d{2}-\d{2}$/.test(s)) return s;
    return s;
  }

  function normalizeStatus(raw, publishedValue){
    const s = text(raw).toLowerCase();
    if (/open|募集中|公開可|公開対象/.test(s)) return "open";
    if (/closed|締切|締切済/.test(s)) return "closed";
    if (/ongoing|開催中|live/.test(s)) return "ongoing";
    if (/finished|終了/.test(s)) return "finished";
    if (/draft|下書き|非公開/.test(s)) return "draft";
    if (publishedValue === true) return "open";
    return s || "draft";
  }

  function normalize(t){
    const raw = t || {};
    const links = raw.links || {};
    const rawId = pick(raw.id, raw.tournamentId, raw.docId);
    const title = pick(raw.title, raw.name, raw.tournamentTitle, raw.tournamentName, raw.eventName) || "CMS登録大会";
    const startDate = toDate(pick(raw.startDate, raw.start, raw.date, raw.playDate, raw.schedule, raw.start_date));
    const endDate = toDate(pick(raw.endDate, raw.end, raw.finishDate, raw.dateEnd, raw.end_date, startDate)) || startDate;
    const venue = pick(raw.venue, raw.course, raw.place, raw.location, raw.golfCourse, raw.clubName);
    const category = pick(raw.category, raw.cat, raw.categoryName, raw.tour, raw.tourName, raw.series) || "未分類";
    const status = normalizeStatus(pick(raw.status, raw.rawStatus, raw.publicStatus, raw.publishStatus), raw.published);
    const published = raw.published != null ? raw.published !== false : status !== "draft";
    const id = rawId || ("tour_" + Date.now() + "_" + Math.random().toString(36).slice(2,8));

    const officialUrl = pick(raw.officialUrl, raw.url, raw.website, links.website, links.official);
    const entryUrl = pick(raw.entryUrl, raw.applyUrl, raw.applicationUrl, links.entry);
    const instagramUrl = pick(raw.instagramUrl, raw.instagram, links.instagram);
    const resultUrl = pick(raw.resultUrl, links.result);
    const pairingUrl = pick(raw.pairingUrl, raw.pairing, links.pairing);
    const logoUrl = pick(raw.logoUrl, raw.tournamentLogoUrl, raw.seriesLogoUrl, raw.logo, raw.logoImageUrl);
    const venueImageUrl = pick(raw.venueImageUrl, raw.imageUrl, raw.coverImageUrl, raw.mainImageUrl, raw.venueImage, raw.courseImageUrl);

    return Object.assign({}, raw, {
      id,
      tournamentId: id,
      title,
      name: title,
      startDate,
      start: startDate,
      endDate,
      end: endDate,
      venue,
      course: venue,
      category,
      cat: category,
      status,
      published,
      entryDeadline: toDate(pick(raw.entryDeadline, raw.deadline, raw.applyDeadline, raw.applicationDeadline)),
      entryFee: pick(raw.entryFee, raw.fee, raw.applicationFee),
      prize: pick(raw.prize, raw.totalPrize, raw.prizeMoney),
      winnerPrize: pick(raw.winnerPrize, raw.prizeWinner, raw.winningPrize),
      prizeWinner: pick(raw.prizeWinner, raw.winnerPrize, raw.winningPrize),
      eligibility: pick(raw.eligibility, raw.qualification, raw.requirement),
      qualification: pick(raw.qualification, raw.eligibility, raw.requirement),
      capacity: pick(raw.capacity, raw.players, raw.fieldSize),
      organizer: pick(raw.organizer, raw.host, raw.company),
      officialUrl,
      entryUrl,
      instagramUrl,
      resultUrl,
      pairingUrl,
      links: Object.assign({}, links, {
        website: officialUrl || links.website || "",
        entry: entryUrl || links.entry || "",
        instagram: instagramUrl || links.instagram || "",
        result: resultUrl || links.result || "",
        pairing: pairingUrl || links.pairing || ""
      }),
      logoUrl,
      tournamentLogoUrl: pick(raw.tournamentLogoUrl, logoUrl),
      venueImageUrl,
      imageUrl: pick(raw.imageUrl, venueImageUrl),
      coverImageUrl: pick(raw.coverImageUrl, venueImageUrl),
      prefecture: pick(raw.prefecture, raw.pref, raw.state),
      prefectureLabel: pick(raw.prefectureLabel, raw.displayLocation, raw.prefecture, raw.pref),
      displayLocation: pick(raw.displayLocation, raw.prefectureLabel, raw.prefecture, raw.pref, raw.area),
      area: pick(raw.area, raw.regionArea),
      source: raw.source || "cms-firestore-step275",
      updatedAt: now(),
      createdAt: raw.createdAt || now()
    });
  }

  function publicSnapshotFrom(list){
    const publicItems = (Array.isArray(list) ? list : [])
      .filter(isPublic)
      .filter(hasRequired)
      .map(normalize);

    const meta = {
      version: "step273-firestore",
      createdAt: now(),
      count: publicItems.length,
      ids: publicItems.map(t => String(t.id || t.tournamentId || "")),
      source: "firestore-or-local",
      origin: location.origin,
      path: location.pathname
    };

    writeJson(KEYS.public, publicItems);
    writeJson(KEYS.meta, meta);
    writeJson(KEYS.updated, meta.createdAt);
    writeJson(KEYS.hard, { meta, tournaments: publicItems });
    return { meta, tournaments: publicItems };
  }

  function setStatus(patch){
    const status = Object.assign({
      version: "step273",
      updatedAt: now(),
      configReady: hasRealConfig(),
      firestoreReady: false,
      lastAction: ""
    }, readJson(KEYS.lastStatus, {}), patch || {});
    writeJson(KEYS.lastStatus, status);
    try { window.dispatchEvent(new CustomEvent("pnx:firestore:tournament-sync-status", { detail: status })); } catch(e) {}
    return status;
  }

  async function loadFromFirestoreToLocal(options = {}){
    const db = await ensureDb();
    if (!db) {
      const local = readJson(KEYS.all, []);
      const payload = publicSnapshotFrom(local);
      setStatus({
        firestoreReady: false,
        lastAction: "local-fallback",
        total: Array.isArray(local) ? local.length : 0,
        publicCount: payload.tournaments.length,
        message: hasRealConfig() ? "Firestore接続に失敗。localStorageを使用中。" : "Firebase設定未入力。localStorageを使用中。"
      });
      return { ok:false, source:"local", tournaments: local, publicPayload: payload };
    }

    const snap = await db.collection(collectionName()).get();
    const list = snap.docs
      .map(doc => normalize(Object.assign({ id: doc.id, tournamentId: doc.id }, doc.data())))
      .sort((a, b) => String(a.startDate || a.start || "").localeCompare(String(b.startDate || b.start || "")));
    writeJson(KEYS.all, list);
    const payload = publicSnapshotFrom(list);

    setStatus({
      firestoreReady: true,
      lastAction: "loaded-from-firestore",
      total: list.length,
      publicCount: payload.tournaments.length,
      displayableCount: payload.tournaments.length,
      message: `Firestoreから大会 ${list.length}件を読み込みました。本体表示対象 ${payload.tournaments.length}件。`
    });

    try {
      window.dispatchEvent(new CustomEvent("pnx:firestore:tournaments-loaded", {
        detail: { tournaments: list, publicPayload: payload, options }
      }));
    } catch(e) {}

    return { ok:true, source:"firestore", tournaments:list, publicPayload: payload };
  }

  async function saveTournament(tournament){
    const item = normalize(tournament);
    const local = readJson(KEYS.all, []);
    const index = local.findIndex(t => String(t.id || t.tournamentId) === String(item.id));
    if (index >= 0) local[index] = Object.assign({}, local[index], item);
    else local.push(item);
    writeJson(KEYS.all, local);
    publicSnapshotFrom(local);

    const db = await ensureDb();
    if (!db) {
      setStatus({
        firestoreReady:false,
        lastAction:"saved-local-only",
        message:"Firebase設定未入力または接続失敗のため、端末内保存のみです。"
      });
      return { ok:false, source:"local", tournament:item };
    }

    await db.collection(collectionName()).doc(item.id).set(item, { merge:true });
    setStatus({
      firestoreReady:true,
      lastAction:"saved-to-firestore",
      lastTournamentId:item.id,
      message:`Firestoreへ保存しました：${item.title || item.name}`
    });
    return { ok:true, source:"firestore", tournament:item };
  }

  async function deleteTournament(id){
    const target = String(id || "");
    const local = readJson(KEYS.all, []).filter(t => String(t.id || t.tournamentId) !== target);
    writeJson(KEYS.all, local);
    publicSnapshotFrom(local);

    const db = await ensureDb();
    if (!db || !target) return { ok:false, source:"local" };

    await db.collection(collectionName()).doc(target).delete();
    setStatus({
      firestoreReady:true,
      lastAction:"deleted-from-firestore",
      lastTournamentId:target,
      message:`Firestoreから削除しました：${target}`
    });
    return { ok:true, source:"firestore" };
  }

  async function publishAllLocalToFirestore(listInput){
    const list = Array.isArray(listInput) ? listInput : readJson(KEYS.all, []);
    const normalized = list.map(normalize);
    writeJson(KEYS.all, normalized);
    const payload = publicSnapshotFrom(normalized);

    const db = await ensureDb();
    if (!db) {
      setStatus({
        firestoreReady:false,
        lastAction:"publish-local-only",
        total: normalized.length,
        publicCount: payload.tournaments.length,
        message:"Firebase設定未入力または接続失敗のため、端末内反映のみです。"
      });
      return { ok:false, source:"local", tournaments: normalized, publicPayload: payload };
    }

    const batch = db.batch();
    normalized.forEach(item => {
      batch.set(db.collection(collectionName()).doc(item.id), item, { merge:true });
    });
    await batch.commit();

    setStatus({
      firestoreReady:true,
      lastAction:"published-to-firestore",
      total: normalized.length,
      publicCount: payload.tournaments.length,
      message:`Firestoreへ大会 ${normalized.length}件を同期しました。`
    });
    return { ok:true, source:"firestore", tournaments: normalized, publicPayload: payload };
  }

  const API = {
    version:"step273",
    keys:KEYS,
    hasRealConfig,
    ensureDb,
    loadFromFirestoreToLocal,
    saveTournament,
    deleteTournament,
    publishAllLocalToFirestore,
    publicSnapshotFrom,
    status(){ return readJson(KEYS.lastStatus, {}); }
  };

  window.PNXTournamentFirestoreSync = API;

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(() => {
      API.loadFromFirestoreToLocal({ reason:"DOMContentLoaded" }).catch(e => {
        console.warn("[PNX STEP273] Firestore tournament load failed", e);
        setStatus({ firestoreReady:false, lastAction:"load-error", message:e && e.message ? e.message : String(e) });
      });
    }, 250);
  });
})();
