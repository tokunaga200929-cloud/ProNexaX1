/* ================================================================
   ProNexaX Firestore Bridge v1
   STEP29: localStorage ⇄ Firestore 切替対応
   ================================================================ */

(function(){
  const MODE_KEY = "PNX_DATA_MODE";
  const LOCAL_TOURNAMENTS_KEY = "PNX_LOCAL_TOURNAMENTS";
  const LOCAL_EVENTS_KEY = "PNX_LOCAL_EVENTS";
  const LOCAL_TX_KEY = "PNX_FINANCE_TRANSACTIONS";

  function getCurrentUid(){
    try {
      if (window.PNXAuthBridge && window.PNXAuthBridge.currentUser) {
        return window.PNXAuthBridge.currentUser.uid || "local-user";
      }
    } catch(e) {}
    return "local-user";
  }

  function readLocal(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(e){ return fallback; }
  }

  function writeLocal(key, value){
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  async function ensureDb(){
    if (!window.PNXFirebaseApp) return null;
    const ready = await window.PNXFirebaseApp.init();
    return ready ? window.PNXFirebaseApp.db : null;
  }

  const Bridge = {
    version: "step29",
    mode: localStorage.getItem(MODE_KEY) || "local",
    getCurrentUid,

    setMode(mode){
      this.mode = mode === "firestore" ? "firestore" : "local";
      localStorage.setItem(MODE_KEY, this.mode);
      return this.mode;
    },

    isFirestore(){
      return this.mode === "firestore";
    },

    async getTournaments(){
      if (!this.isFirestore()) return readLocal(LOCAL_TOURNAMENTS_KEY, []);

      const db = await ensureDb();
      if (!db) return readLocal(LOCAL_TOURNAMENTS_KEY, []);

      const snap = await db.collection("tournaments").orderBy("startDate", "asc").get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async saveTournaments(tournaments){
      if (!Array.isArray(tournaments)) return false;

      if (!this.isFirestore()) {
        writeLocal(LOCAL_TOURNAMENTS_KEY, tournaments);
        return true;
      }

      const db = await ensureDb();
      if (!db) {
        writeLocal(LOCAL_TOURNAMENTS_KEY, tournaments);
        return false;
      }

      const batch = db.batch();
      tournaments.forEach(t => {
        const id = t.id || ("tour_" + Date.now());
        const ref = db.collection("tournaments").doc(id);
        batch.set(ref, { ...t, id, updatedAt: new Date().toISOString() }, { merge:true });
      });
      await batch.commit();
      return true;
    },

    async addTournament(tournament){
      const item = {
        ...tournament,
        id: tournament.id || ("tour_" + Date.now()),
        updatedAt: new Date().toISOString(),
        createdAt: tournament.createdAt || new Date().toISOString()
      };

      if (!this.isFirestore()) {
        const list = readLocal(LOCAL_TOURNAMENTS_KEY, []);
        const i = list.findIndex(t => t && t.id === item.id);
        if (i >= 0) list[i] = item;
        else list.push(item);
        writeLocal(LOCAL_TOURNAMENTS_KEY, list);
        return item;
      }

      const db = await ensureDb();
      if (!db) return item;

      await db.collection("tournaments").doc(item.id).set(item, { merge:true });
      return item;
    },

    async saveCalendarEvent(event){
      if (!event) return false;
      const uid = getCurrentUid();

      if (!this.isFirestore()) {
        const list = readLocal(LOCAL_EVENTS_KEY, []);
        const exists = list.some(e => e && e.id === event.id);
        if (!exists) list.push(event);
        writeLocal(LOCAL_EVENTS_KEY, list);
        return true;
      }

      const db = await ensureDb();
      if (!db) return false;

      const id = event.id || ("event_" + Date.now());
      await db.collection("users").doc(uid).collection("calendarEvents").doc(id).set({ ...event, id, updatedAt:new Date().toISOString() }, { merge:true });
      return true;
    },

    async saveFinanceTransaction(tx){
      if (!tx) return false;
      const uid = getCurrentUid();
      const item = { ...tx, id: tx.id || ("tx_" + Date.now()), updatedAt:new Date().toISOString(), createdAt: tx.createdAt || new Date().toISOString() };

      if (!this.isFirestore()) {
        const list = readLocal(LOCAL_TX_KEY, []);
        const exists = list.some(x => x && x.id === item.id);
        if (!exists) list.push(item);
        writeLocal(LOCAL_TX_KEY, list);
        return item;
      }

      const db = await ensureDb();
      if (!db) return item;

      await db.collection("users").doc(uid).collection("financeTransactions").doc(item.id).set(item, { merge:true });
      return item;
    },

    async migrateLocalToFirestore(){
      const db = await ensureDb();
      if (!db) throw new Error("Firestore not ready");

      const tournaments = readLocal(LOCAL_TOURNAMENTS_KEY, []);
      const events = readLocal(LOCAL_EVENTS_KEY, []);
      const txs = readLocal(LOCAL_TX_KEY, []);
      const uid = getCurrentUid();

      const batch = db.batch();

      tournaments.forEach(t => {
        if (!t || !t.id) return;
        batch.set(db.collection("tournaments").doc(t.id), { ...t, updatedAt:new Date().toISOString() }, { merge:true });
      });

      events.forEach(e => {
        if (!e || !e.id) return;
        batch.set(db.collection("users").doc(uid).collection("calendarEvents").doc(e.id), { ...e, updatedAt:new Date().toISOString() }, { merge:true });
      });

      txs.forEach(tx => {
        if (!tx || !tx.id) return;
        batch.set(db.collection("users").doc(uid).collection("financeTransactions").doc(tx.id), { ...tx, updatedAt:new Date().toISOString() }, { merge:true });
      });

      await batch.commit();
      return { tournaments:tournaments.length, events:events.length, transactions:txs.length };
    }
  };

  window.PNXFirestoreBridge = Bridge;
})();
