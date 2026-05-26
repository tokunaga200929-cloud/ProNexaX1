/* ================================================================
   STEP34: User Scoped Data Store
   ログインユーザーごとにlocalStorageキーを分離する
   ================================================================ */
(function(){
  if (window.PNXUserScopedStore) return;

  function uid(){
    try {
      if (window.PNXAuthBridge && window.PNXAuthBridge.currentUser) {
        return window.PNXAuthBridge.currentUser.uid || "guest";
      }
    } catch(e) {}
    return "guest";
  }

  function key(baseKey){
    return "PNX_USER_" + uid() + "_" + baseKey;
  }

  const Store = {
    uid,
    key,

    read(baseKey, fallback){
      try {
        return JSON.parse(localStorage.getItem(key(baseKey)) || JSON.stringify(fallback));
      } catch(e) {
        return fallback;
      }
    },

    write(baseKey, value){
      localStorage.setItem(key(baseKey), JSON.stringify(value));
      return value;
    },

    remove(baseKey){
      localStorage.removeItem(key(baseKey));
    },

    migrateGlobalToUser(baseKey){
      const globalValue = localStorage.getItem(baseKey);
      if (!globalValue) return false;
      const userKey = key(baseKey);
      if (!localStorage.getItem(userKey)) {
        localStorage.setItem(userKey, globalValue);
        return true;
      }
      return false;
    },

    migrateKnownGlobals(){
      return {
        financeTransactions: this.migrateGlobalToUser("PNX_FINANCE_TRANSACTIONS"),
        cmsTournaments: this.migrateGlobalToUser("PNX_CMS_TOURNAMENTS"),
        localEvents: this.migrateGlobalToUser("PNX_LOCAL_EVENTS")
      };
    }
  };

  window.PNXUserScopedStore = Store;

  window.addEventListener("pnx:auth:changed", function(){
    try { Store.migrateKnownGlobals(); } catch(e) {}
  });

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(function(){ try { Store.migrateKnownGlobals(); } catch(e) {} }, 800);
  });
})();
