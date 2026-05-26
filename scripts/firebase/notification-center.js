/* ================================================================
   STEP39: Notification Center
   通知生成・未読/既読・重要度管理
   ================================================================ */
(function(){
  if (window.PNXNotificationCenter) return;

  const BASE_KEY = "PNX_NOTIFICATIONS";

  function readLocal(){
    if (window.PNXUserScopedStore) return window.PNXUserScopedStore.read(BASE_KEY, []);
    try { return JSON.parse(localStorage.getItem(BASE_KEY) || "[]"); }
    catch(e){ return []; }
  }

  function writeLocal(list){
    if (window.PNXUserScopedStore) return window.PNXUserScopedStore.write(BASE_KEY, list);
    localStorage.setItem(BASE_KEY, JSON.stringify(list));
    return list;
  }

  function emit(list){
    window.dispatchEvent(new CustomEvent("pnx:notifications:updated", {
      detail:{ notifications:list }
    }));
  }

  function createNotification(payload){
    return {
      id: payload.id || ("notif_" + Date.now() + "_" + Math.random().toString(36).slice(2,7)),
      type: payload.type || "general",
      title: payload.title || "通知",
      body: payload.body || "",
      priority: payload.priority || "normal",
      read: false,
      createdAt: payload.createdAt || new Date().toISOString(),
      eventId: payload.eventId || null,
      tournamentId: payload.tournamentId || null
    };
  }

  const Center = {
    getAll(){
      return readLocal().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    unread(){
      return this.getAll().filter(x => !x.read);
    },

    add(payload){
      const list = readLocal();
      const item = createNotification(payload);
      list.unshift(item);
      writeLocal(list);
      emit(list);
      return item;
    },

    markRead(id){
      const list = readLocal();
      const item = list.find(x => x && x.id === id);
      if (item) item.read = true;
      writeLocal(list);
      emit(list);
      return item;
    },

    markAllRead(){
      const list = readLocal();
      list.forEach(x => { if (x) x.read = true; });
      writeLocal(list);
      emit(list);
      return list;
    },

    remove(id){
      const list = readLocal().filter(x => x && x.id !== id);
      writeLocal(list);
      emit(list);
      return true;
    }
  };

  window.PNXNotificationCenter = Center;

  function addReminderNotification(reminder){
    if (!reminder) return;
    Center.add({
      id: "from_" + reminder.id,
      type: reminder.type || "reminder",
      title: reminder.label || "大会通知",
      body: reminder.message || "",
      priority: reminder.type === "eventMorning" ? "high" : "normal",
      eventId: reminder.eventId || null,
      tournamentId: reminder.tournamentId || null
    });
  }

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(function(){
      const existing = Center.getAll();
      if (!existing.length && window.PNXReminderBridge) {
        const reminders = window.PNXReminderBridge.upcoming().slice(0,3);
        reminders.forEach(addReminderNotification);
      }
    }, 1200);
  });

  window.addEventListener("pnx:reminders:updated", function(e){
    const list = e.detail && e.detail.reminders;
    if (!Array.isArray(list)) return;
    const latest = list[0];
    if (latest) addReminderNotification(latest);
  });
})();
