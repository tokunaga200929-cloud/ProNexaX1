/* ================================================================
   ProNexaX CMS Bridge v0
   STEP12: CMS → App data connection preparation
   まだFirestore本番保存はしない。localStorageに保存し、後でFirestoreへ差し替え。
   ================================================================ */

(function(){
  if (window.PNXCmsBridge) return;

  const KEYS = {
    tournaments: "PNX_CMS_TOURNAMENTS",
    featured: "PNX_CMS_FEATURED_CONTENTS",
    appSettings: "PNX_CMS_APP_SETTINGS"
  };

  function read(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(e){ return fallback; }
  }

  function write(key, value){
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function now(){ return new Date().toISOString(); }

  const Bridge = {
    async getTournaments(){
      if (window.PNXFirestoreBridge && window.PNXFirestoreBridge.isFirestore()) {
        return await window.PNXFirestoreBridge.getTournaments();
      }
      return read(KEYS.tournaments, []);
    },

    async saveTournament(tournament){
      const list = await this.getTournaments();
      const id = tournament.id || ("tour_" + Date.now());
      const item = Object.assign({}, tournament, {
        id,
        updatedAt: now(),
        createdAt: tournament.createdAt || now(),
        source: tournament.source || "cms"
      });

      const i = list.findIndex(t => t && t.id === id);
      if (i >= 0) list[i] = item;
      else list.push(item);

      if (window.PNXFirestoreBridge && window.PNXFirestoreBridge.isFirestore()) {
        await window.PNXFirestoreBridge.saveTournaments(list);
      } else {
        write(KEYS.tournaments, list);
      }

      window.dispatchEvent(new CustomEvent("pnx:cms:tournaments-updated", { detail: { tournaments: list, item } }));
      return item;
    },

    async deleteTournament(id){
      const list = (await this.getTournaments()).filter(t => t && t.id !== id);
      write(KEYS.tournaments, list);
      window.dispatchEvent(new CustomEvent("pnx:cms:tournaments-updated", { detail: { tournaments: list } }));
      return true;
    },

    getFeaturedContents(){
      return read(KEYS.featured, []);
    },

    saveFeaturedContent(content){
      const list = this.getFeaturedContents();
      const id = content.id || ("featured_" + Date.now());
      const item = Object.assign({}, content, {
        id,
        updatedAt: now(),
        createdAt: content.createdAt || now()
      });

      const i = list.findIndex(c => c && c.id === id);
      if (i >= 0) list[i] = item;
      else list.push(item);

      write(KEYS.featured, list);
      window.dispatchEvent(new CustomEvent("pnx:cms:featured-updated", { detail: { contents: list, item } }));
      return item;
    },

    getAppSettings(){
      return read(KEYS.appSettings, {
        maintenance: false,
        notice: "",
        theme: "default",
        updatedAt: now()
      });
    },

    saveAppSettings(settings){
      const item = Object.assign({}, this.getAppSettings(), settings, { updatedAt: now() });
      write(KEYS.appSettings, item);
      window.dispatchEvent(new CustomEvent("pnx:cms:settings-updated", { detail: { settings: item } }));
      return item;
    },

    getStatus(){
      return {
        authReady: !!window.PNXAuthBridge,
        firebaseReady: !!(window.PNXFirebaseApp && window.PNXFirebaseApp.ready),
        firestoreMode: window.PNXFirestoreBridge ? window.PNXFirestoreBridge.mode : "unknown",
        isAdmin: window.PNXAuthBridge ? window.PNXAuthBridge.isAdmin() : false,
        tournamentCount: read(KEYS.tournaments, []).length,
        featuredCount: read(KEYS.featured, []).length
      };
    }
  };

  window.PNXCmsBridge = Bridge;
})();
