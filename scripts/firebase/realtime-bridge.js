/* ================================================================
   STEP41: Firestore Realtime Sync Bridge
   Firestore onSnapshot による大会/注目/設定のリアルタイム同期準備
   ================================================================ */
(function(){
  if (window.PNXRealtimeBridge) return;

  const unsubscribers = {};

  async function db(){
    if (!window.PNXFirebaseApp) return null;
    const ready = await window.PNXFirebaseApp.init();
    return ready ? window.PNXFirebaseApp.db : null;
  }

  function notify(type, payload){
    window.dispatchEvent(new CustomEvent(type, { detail: payload || {} }));
  }

  const Bridge = {
    active:false,

    async start(){
      if (!window.PNXFirestoreBridge || !window.PNXFirestoreBridge.isFirestore()) {
        console.info("[PNXRealtimeBridge] Firestore modeではないためlocal待機");
        this.active = false;
        return false;
      }

      const firestore = await db();
      if (!firestore) {
        console.warn("[PNXRealtimeBridge] Firestore未接続");
        this.active = false;
        return false;
      }

      this.stop();

      unsubscribers.tournaments = firestore.collection("tournaments")
        .orderBy("startDate", "asc")
        .onSnapshot(snapshot => {
          const items = snapshot.docs.map(doc => ({ id:doc.id, ...doc.data() }));
          window.__PNX_REALTIME_TOURNAMENTS__ = items;
          notify("pnx:realtime:tournaments", { tournaments:items });

          try {
            localStorage.setItem("PNX_CMS_TOURNAMENTS", JSON.stringify(items));
            if (window.PNXRefreshSearchFromCms) window.PNXRefreshSearchFromCms();
          } catch(e) {}

          try {
            if (window.PNXNotificationCenter) {
              window.PNXNotificationCenter.add({
                type:"realtimeTournament",
                title:"大会情報を同期しました",
                body:"Firestoreから大会情報を更新しました。",
                priority:"normal"
              });
            }
          } catch(e) {}
        });

      unsubscribers.featured = firestore.collection("featuredContents")
        .orderBy("order", "asc")
        .onSnapshot(snapshot => {
          const items = snapshot.docs.map(doc => ({ id:doc.id, ...doc.data() }));
          window.__PNX_REALTIME_FEATURED__ = items;
          notify("pnx:realtime:featured", { contents:items });
          try { localStorage.setItem("PNX_CMS_FEATURED_CONTENTS", JSON.stringify(items)); } catch(e) {}
        });

      unsubscribers.settings = firestore.collection("appSettings")
        .onSnapshot(snapshot => {
          const items = {};
          snapshot.docs.forEach(doc => { items[doc.id] = doc.data(); });
          window.__PNX_REALTIME_APP_SETTINGS__ = items;
          notify("pnx:realtime:settings", { settings:items });
        });

      this.active = true;
      notify("pnx:realtime:started", {});
      return true;
    },

    stop(){
      Object.keys(unsubscribers).forEach(key => {
        try { if (typeof unsubscribers[key] === "function") unsubscribers[key](); } catch(e) {}
        delete unsubscribers[key];
      });
      this.active = false;
      notify("pnx:realtime:stopped", {});
    },

    status(){
      return {
        active:this.active,
        firestoreMode: window.PNXFirestoreBridge ? window.PNXFirestoreBridge.mode : "unknown",
        tournaments: (window.__PNX_REALTIME_TOURNAMENTS__ || []).length,
        featured: (window.__PNX_REALTIME_FEATURED__ || []).length
      };
    }
  };

  window.PNXRealtimeBridge = Bridge;

  window.addEventListener("pnx:auth:changed", function(){
    setTimeout(function(){ Bridge.start(); }, 500);
  });
})();
