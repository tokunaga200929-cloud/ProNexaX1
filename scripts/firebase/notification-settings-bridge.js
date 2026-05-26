/* ================================================================
   STEP38: Notification Settings Bridge
   通知ON/OFF・通知タイミング設定
   ================================================================ */
(function(){
  if (window.PNXNotificationSettingsBridge) return;

  const BASE_KEY = "PNX_NOTIFICATION_SETTINGS";

  const DEFAULTS = {
    enabled: true,
    beforeDeadline3Days: true,
    beforeEvent1Day: true,
    eventDayMorning: true,
    reminderHours: {
      deadline: 9,
      beforeEvent: 18,
      eventMorning: 6
    }
  };

  function read(){
    let saved = null;
    try {
      saved = window.PNXUserScopedStore
        ? window.PNXUserScopedStore.read(BASE_KEY, null)
        : JSON.parse(localStorage.getItem(BASE_KEY) || "null");
    } catch(e) {}
    return Object.assign({}, DEFAULTS, saved || {});
  }

  function write(settings){
    const item = Object.assign({}, DEFAULTS, settings || {}, { updatedAt: new Date().toISOString() });
    if (window.PNXUserScopedStore) window.PNXUserScopedStore.write(BASE_KEY, item);
    else localStorage.setItem(BASE_KEY, JSON.stringify(item));
    window.dispatchEvent(new CustomEvent("pnx:notification-settings:updated", { detail:{ settings:item } }));
    return item;
  }

  const Bridge = {
    get(){ return read(); },
    save(settings){ return write(settings); },
    reset(){ return write(DEFAULTS); },
    isEnabled(){ return read().enabled !== false; }
  };

  window.PNXNotificationSettingsBridge = Bridge;
})();
