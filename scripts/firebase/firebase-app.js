/* ================================================================
   ProNexaX Firebase App Bootstrap v1
   STEP29: Firestore本接続レイヤー
   ================================================================ */

(function(){
  if (window.PNXFirebaseApp && window.PNXFirebaseApp.version === "step29") return;

  const App = {
    version: "step29",
    ready: false,
    app: null,
    auth: null,
    db: null,
    storage: null,
    error: null,

    hasRealConfig(){
      const c = window.PNX_FIREBASE_CONFIG || {};
      return !!(c.apiKey && c.apiKey !== "YOUR_API_KEY" && c.projectId && c.projectId !== "YOUR_PROJECT_ID");
    },

    async init(){
      try {
        if (!this.hasRealConfig()) {
          console.info("[PNXFirebaseApp] Firebase config is placeholder. Running local mode.");
          this.ready = false;
          return false;
        }

        if (window.PNXFirebaseSdkLoader) {
          await window.PNXFirebaseSdkLoader.load();
        }

        if (!window.firebase) {
          console.warn("[PNXFirebaseApp] Firebase SDK not loaded. Running local mode.");
          this.ready = false;
          return false;
        }

        if (!window.firebase.apps || !window.firebase.apps.length) {
          this.app = window.firebase.initializeApp(window.PNX_FIREBASE_CONFIG);
        } else {
          this.app = window.firebase.app();
        }

        this.auth = window.firebase.auth();
        this.db = window.firebase.firestore();
        this.storage = window.firebase.storage ? window.firebase.storage() : null;

        this.ready = !!(this.app && this.auth && this.db);
        console.info("[PNXFirebaseApp] ready:", this.ready);
        return this.ready;
      } catch (e) {
        this.error = e;
        console.warn("[PNXFirebaseApp] init failed", e);
        this.ready = false;
        return false;
      }
    }
  };

  window.PNXFirebaseApp = App;

  document.addEventListener("DOMContentLoaded", function(){
    App.init();
  });
})();
