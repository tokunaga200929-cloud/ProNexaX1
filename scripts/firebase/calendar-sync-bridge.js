/* ================================================================
   STEP36: User Calendar Sync Bridge
   ユーザー別カレンダー予定保存・読込の土台
   ================================================================ */
(function(){
  if (window.PNXCalendarSyncBridge) return;

  const BASE_KEY = "PNX_LOCAL_EVENTS";

  function readLocal(){
    if (window.PNXUserScopedStore) return window.PNXUserScopedStore.read(BASE_KEY, []);
    try { return JSON.parse(localStorage.getItem(BASE_KEY) || "[]"); } catch(e){ return []; }
  }

  function writeLocal(list){
    if (window.PNXUserScopedStore) return window.PNXUserScopedStore.write(BASE_KEY, list);
    localStorage.setItem(BASE_KEY, JSON.stringify(list));
    return list;
  }

  async function saveFirestore(event){
    try {
      if (!window.PNXFirestoreBridge || !window.PNXFirestoreBridge.isFirestore()) return false;
      return await window.PNXFirestoreBridge.saveCalendarEvent(event);
    } catch(e) {
      console.warn("[PNXCalendarSyncBridge] firestore save failed", e);
      return false;
    }
  }

  const Bridge = {
    getAll(){ return readLocal(); },

    async saveEvent(event){
      if (!event) return null;
      const item = {
        ...event,
        id: event.id || ("event_" + Date.now()),
        updatedAt: new Date().toISOString(),
        createdAt: event.createdAt || new Date().toISOString()
      };

      const list = readLocal();
      const i = list.findIndex(e => e && e.id === item.id);
      if (i >= 0) list[i] = item;
      else list.push(item);

      writeLocal(list);
      await saveFirestore(item);

      window.dispatchEvent(new CustomEvent("pnx:calendar:events-updated", {
        detail: { events:list, item }
      }));

      return item;
    },

    async removeEvent(id){
      const list = readLocal().filter(e => e && e.id !== id);
      writeLocal(list);
      window.dispatchEvent(new CustomEvent("pnx:calendar:events-updated", { detail:{ events:list } }));
      return true;
    },

    loadIntoGlobalEvents(){
      const saved = readLocal();
      if (!saved.length) return false;

      let arr = null;
      if (Array.isArray(window.EVENTS)) arr = window.EVENTS;
      else if (window.appState && Array.isArray(window.appState.events)) arr = window.appState.events;

      if (!arr) return false;

      saved.forEach(ev => {
        if (!arr.some(x => x && x.id === ev.id)) arr.push(ev);
      });

      try { if (typeof window.generateCalendarEvents === "function") window.generateCalendarEvents(); } catch(e) {}
      try { if (typeof window.renderAllPanels === "function") window.renderAllPanels(); } catch(e) {}
      try { if (typeof window.renderCalList === "function") window.renderCalList(); } catch(e) {}

      return true;
    }
  };

  window.PNXCalendarSyncBridge = Bridge;

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(function(){ Bridge.loadIntoGlobalEvents(); }, 700);
  });

  window.addEventListener("pnx:auth:changed", function(){
    setTimeout(function(){ Bridge.loadIntoGlobalEvents(); }, 300);
  });
})();
