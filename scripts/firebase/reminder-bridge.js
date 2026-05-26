/* ================================================================
   STEP37: Notification / Reminder Bridge
   大会予定の通知・リマインダー保存基盤
   ================================================================ */
(function(){
  if (window.PNXReminderBridge) return;

  const BASE_KEY = "PNX_REMINDERS";

  function readLocal(){
    if (window.PNXUserScopedStore) return window.PNXUserScopedStore.read(BASE_KEY, []);
    try { return JSON.parse(localStorage.getItem(BASE_KEY) || "[]"); } catch(e){ return []; }
  }

  function writeLocal(list){
    if (window.PNXUserScopedStore) return window.PNXUserScopedStore.write(BASE_KEY, list);
    localStorage.setItem(BASE_KEY, JSON.stringify(list));
    return list;
  }

  function toDateISO(dateStr, offsetDays, hour){
    const d = new Date(dateStr || new Date());
    d.setDate(d.getDate() + (offsetDays || 0));
    d.setHours(hour == null ? 9 : hour, 0, 0, 0);
    return d.toISOString();
  }

  function buildRemindersForEvent(event, settings){
    const s = Object.assign({
      beforeDeadline3Days: true,
      beforeEvent1Day: true,
      eventDayMorning: true
    }, settings || {});

    const reminders = [];
    const base = {
      eventId: event.id,
      tournamentId: event.tournamentId || null,
      title: event.title || event.name || "大会予定",
      source: "calendar"
    };

    if (s.beforeDeadline3Days && event.entryDeadline) {
      reminders.push({
        ...base,
        id: "rem_deadline_" + (event.tournamentId || event.id),
        type: "entryDeadline",
        label: "エントリー締切3日前",
        remindAt: toDateISO(event.entryDeadline, -3, 9),
        message: "エントリー締切が近づいています: " + (event.title || "大会")
      });
    }

    if (s.beforeEvent1Day && (event.startDate || event.date)) {
      reminders.push({
        ...base,
        id: "rem_before_" + (event.tournamentId || event.id),
        type: "beforeEvent",
        label: "大会前日",
        remindAt: toDateISO(event.startDate || event.date, -1, 18),
        message: "明日は大会です: " + (event.title || "大会")
      });
    }

    if (s.eventDayMorning && (event.startDate || event.date)) {
      reminders.push({
        ...base,
        id: "rem_morning_" + (event.tournamentId || event.id),
        type: "eventMorning",
        label: "当日朝",
        remindAt: toDateISO(event.startDate || event.date, 0, 6),
        message: "大会当日です: " + (event.title || "大会")
      });
    }

    return reminders;
  }

  const Bridge = {
    getAll(){ return readLocal(); },

    saveReminders(reminders){
      const list = readLocal();
      reminders.forEach(rem => {
        const i = list.findIndex(x => x && x.id === rem.id);
        const item = { ...rem, enabled: rem.enabled !== false, updatedAt: new Date().toISOString(), createdAt: rem.createdAt || new Date().toISOString() };
        if (i >= 0) list[i] = item;
        else list.push(item);
      });
      writeLocal(list);
      window.dispatchEvent(new CustomEvent("pnx:reminders:updated", { detail:{ reminders:list } }));
      return list;
    },

    createForEvent(event, settings){
      const globalSettings = window.PNXNotificationSettingsBridge ? window.PNXNotificationSettingsBridge.get() : {};
      if (globalSettings.enabled === false) return readLocal();
      const reminders = buildRemindersForEvent(event, Object.assign({}, globalSettings, settings || {}));
      return this.saveReminders(reminders);
    },

    toggle(id, enabled){
      const list = readLocal();
      const item = list.find(x => x && x.id === id);
      if (item) item.enabled = !!enabled;
      writeLocal(list);
      window.dispatchEvent(new CustomEvent("pnx:reminders:updated", { detail:{ reminders:list } }));
      return item;
    },

    upcoming(){
      const now = Date.now();
      return readLocal()
        .filter(r => r && r.enabled !== false && new Date(r.remindAt).getTime() >= now)
        .sort((a,b) => new Date(a.remindAt) - new Date(b.remindAt));
    }
  };

  window.PNXReminderBridge = Bridge;

  window.addEventListener("pnx:calendar:events-updated", function(e){
    const item = e.detail && e.detail.item;
    if (item) Bridge.createForEvent(item);
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type === "PNX_CREATE_REMINDERS_FOR_EVENT") {
      Bridge.createForEvent(data.payload || {}, data.settings || {});
    }
  });
})();
