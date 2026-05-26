/* ================================================================
   STEP46: Calendar Backend Safe Link
   元の本体カレンダーUIを触らず、裏側の保存/通知/同期だけ接続する
   ================================================================ */
(function(){
  if (window.PNXCalendarBackendSafeLink) return;

  function normalizeEvent(event){
    if (!event || typeof event !== "object") return null;
    return {
      ...event,
      id: event.id || event.eventId || ("event_" + Date.now()),
      title: event.title || event.name || event.tournamentTitle || "予定",
      startDate: event.startDate || event.date || event.day || "",
      endDate: event.endDate || event.startDate || event.date || "",
      tournamentId: event.tournamentId || event.tid || null,
      source: event.source || "calendar",
      updatedAt: new Date().toISOString(),
      createdAt: event.createdAt || new Date().toISOString()
    };
  }

  async function connect(event, reason){
    const item = normalizeEvent(event);
    if (!item) return null;

    try {
      if (window.PNXCalendarSyncBridge) {
        await window.PNXCalendarSyncBridge.saveEvent(item);
      }
    } catch(e) {
      console.warn("[PNX STEP46] calendar sync failed", e);
    }

    try {
      if (window.PNXReminderBridge) {
        window.PNXReminderBridge.createForEvent(item);
      }
    } catch(e) {
      console.warn("[PNX STEP46] reminder create failed", e);
    }

    try {
      if (window.PNXNotificationEventLink) {
        window.PNXNotificationEventLink.notifyCalendarAdded(item);
      } else if (window.PNXNotificationCenter) {
        window.PNXNotificationCenter.add({
          type:"calendarAdded",
          title:"カレンダーに追加しました",
          body:item.title + " を保存しました。",
          priority:"normal",
          eventId:item.id,
          tournamentId:item.tournamentId
        });
      }
    } catch(e) {
      console.warn("[PNX STEP46] notification link failed", e);
    }

    window.dispatchEvent(new CustomEvent("pnx:calendar:backend-linked", {
      detail:{ event:item, reason:reason || "unknown" }
    }));

    return item;
  }

  function scanExistingEvents(){
    const candidates = [];

    try {
      if (Array.isArray(window.EVENTS)) candidates.push(...window.EVENTS);
    } catch(e) {}

    try {
      if (window.appState && Array.isArray(window.appState.events)) candidates.push(...window.appState.events);
    } catch(e) {}

    return candidates;
  }

  const Link = {
    connect,
    normalizeEvent,

    async syncExisting(){
      const events = scanExistingEvents();
      for (const ev of events) {
        await connect(ev, "syncExisting");
      }
      return events.length;
    },

    async onCalendarAdded(event){
      return await connect(event, "calendarAdded");
    }
  };

  window.PNXCalendarBackendSafeLink = Link;

  // 既存コードがCustomEventを投げる場合に拾う
  window.addEventListener("pnx:calendar:event-added", function(e){
    connect(e.detail && (e.detail.event || e.detail), "event-added");
  });

  window.addEventListener("pnx:tournament:added-to-calendar", function(e){
    connect(e.detail && (e.detail.event || e.detail.tournament || e.detail), "tournament-added");
  });

  // pnx:calendar:events-updated はすでにCalendarSyncBridgeが発火する可能性があるため、
  // 無限ループ防止で item がある場合だけ通知連携に限定
  window.addEventListener("pnx:calendar:events-updated", function(e){
    const item = e.detail && e.detail.item;
    if (!item || item.__step46Handled) return;
    item.__step46Handled = true;

    try {
      if (window.PNXReminderBridge) window.PNXReminderBridge.createForEvent(item);
    } catch(err) {}

    try {
      if (window.PNXNotificationEventLink) window.PNXNotificationEventLink.notifyCalendarAdded(item);
    } catch(err) {}
  });

  document.addEventListener("DOMContentLoaded", function(){
    // 初回は既存ダミー予定を大量通知化しないため保存だけ軽く確認。
    setTimeout(function(){
      try {
        window.__PNX_STEP46_EXISTING_EVENTS_COUNT__ = scanExistingEvents().length;
      } catch(e) {}
    }, 1000);
  });
})();
