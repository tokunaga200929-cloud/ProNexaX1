/* ================================================================
   STEP35: User Favorites Bridge
   ユーザー別お気に入り大会保存
   ================================================================ */
(function(){
  if (window.PNXFavoritesBridge) return;

  const BASE_KEY = "PNX_FAVORITE_TOURNAMENTS";

  function readLocal(){
    if (window.PNXUserScopedStore) return window.PNXUserScopedStore.read(BASE_KEY, []);
    try { return JSON.parse(localStorage.getItem(BASE_KEY) || "[]"); } catch(e){ return []; }
  }

  function writeLocal(list){
    if (window.PNXUserScopedStore) return window.PNXUserScopedStore.write(BASE_KEY, list);
    localStorage.setItem(BASE_KEY, JSON.stringify(list));
    return list;
  }

  async function saveFirestore(tournament){
    try {
      if (!window.PNXFirestoreBridge || !window.PNXFirestoreBridge.isFirestore()) return false;
      if (!window.PNXFirebaseApp || !window.PNXFirebaseApp.db) return false;
      const uid = window.PNXFirestoreBridge.getCurrentUid();
      const id = tournament.id || tournament.tournamentId;
      if (!uid || !id) return false;
      await window.PNXFirebaseApp.db
        .collection("favorites")
        .doc(uid)
        .collection("saved")
        .doc(id)
        .set({
          tournamentId: id,
          title: tournament.title || tournament.name || "",
          createdAt: new Date().toISOString()
        }, { merge:true });
      return true;
    } catch(e) {
      console.warn("[PNXFavoritesBridge] firestore save failed", e);
      return false;
    }
  }

  const Bridge = {
    getAll(){
      return readLocal();
    },

    isFavorite(id){
      return readLocal().some(x => x && (x.id === id || x.tournamentId === id));
    },

    async toggle(tournament){
      const id = tournament.id || tournament.tournamentId;
      if (!id) return { favorite:false, list:readLocal() };

      let list = readLocal();
      const exists = list.some(x => x && (x.id === id || x.tournamentId === id));

      if (exists) {
        list = list.filter(x => x && (x.id !== id && x.tournamentId !== id));
      } else {
        list.push({
          id,
          tournamentId: id,
          title: tournament.title || tournament.name || "",
          startDate: tournament.startDate || tournament.date || "",
          venue: tournament.venue || "",
          category: tournament.category || "",
          createdAt: new Date().toISOString()
        });
        await saveFirestore(tournament);
      }

      writeLocal(list);
      window.dispatchEvent(new CustomEvent("pnx:favorites:updated", { detail:{ favorites:list } }));
      return { favorite:!exists, list };
    }
  };

  window.PNXFavoritesBridge = Bridge;

  window.addEventListener("message", async function(event){
    const data = event.data || {};
    if (data.type !== "PNX_TOGGLE_FAVORITE_TOURNAMENT") return;
    const result = await Bridge.toggle(data.payload || {});
    try {
      event.source && event.source.postMessage({
        type:"PNX_FAVORITE_TOURNAMENT_UPDATED",
        payload: result
      }, "*");
    } catch(e) {}
  });
})();
