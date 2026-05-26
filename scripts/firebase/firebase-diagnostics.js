/* ================================================================
   STEP30: Firebase Diagnostics
   Firebase/Auth/Firestore/Storage接続状態を診断
   ================================================================ */
(function(){
  if (window.PNXFirebaseDiagnostics) return;

  function hasRealConfig(){
    const c = window.PNX_FIREBASE_CONFIG || {};
    return !!(c.apiKey && c.apiKey !== "YOUR_API_KEY" && c.projectId && c.projectId !== "YOUR_PROJECT_ID");
  }

  async function run(){
    const result = {
      configReady: hasRealConfig(),
      sdkLoaderReady: !!window.PNXFirebaseSdkLoader,
      firebaseGlobalReady: !!window.firebase,
      appReady: false,
      authReady: false,
      firestoreReady: false,
      storageReady: false,
      dataMode: window.PNXFirestoreBridge ? window.PNXFirestoreBridge.mode : "unknown",
      currentUser: window.PNXAuthBridge ? window.PNXAuthBridge.currentUser : null,
      error: null
    };

    try {
      if (window.PNXFirebaseApp) {
        await window.PNXFirebaseApp.init();
        result.appReady = !!window.PNXFirebaseApp.ready;
        result.authReady = !!window.PNXFirebaseApp.auth;
        result.firestoreReady = !!window.PNXFirebaseApp.db;
        result.storageReady = !!window.PNXFirebaseApp.storage;
      }
    } catch(e) {
      result.error = e.message || String(e);
    }

    return result;
  }

  function statusText(v){
    return v ? "OK" : "未接続";
  }

  function renderInto(target){
    if (!target) return;
    run().then(r => {
      target.innerHTML = `
        <div class="pnx-fb-diag-card">
          <div class="pnx-fb-diag-row"><span>Firebase設定</span><strong class="${r.configReady ? "ok" : "ng"}">${statusText(r.configReady)}</strong></div>
          <div class="pnx-fb-diag-row"><span>SDK Loader</span><strong class="${r.sdkLoaderReady ? "ok" : "ng"}">${statusText(r.sdkLoaderReady)}</strong></div>
          <div class="pnx-fb-diag-row"><span>Firebase App</span><strong class="${r.appReady ? "ok" : "ng"}">${statusText(r.appReady)}</strong></div>
          <div class="pnx-fb-diag-row"><span>Auth</span><strong class="${r.authReady ? "ok" : "ng"}">${statusText(r.authReady)}</strong></div>
          <div class="pnx-fb-diag-row"><span>Firestore</span><strong class="${r.firestoreReady ? "ok" : "ng"}">${statusText(r.firestoreReady)}</strong></div>
          <div class="pnx-fb-diag-row"><span>Storage</span><strong class="${r.storageReady ? "ok" : "ng"}">${statusText(r.storageReady)}</strong></div>
          <div class="pnx-fb-diag-row"><span>Data Mode</span><strong>${r.dataMode}</strong></div>
        </div>
        <div class="pnx-fb-diag-note">
          ${r.configReady ? "Firebase設定値は入っています。" : "まだFirebase設定値が未入力です。local modeで安全に動作します。"}
          ${r.error ? "<br>エラー: " + r.error : ""}
        </div>
      `;
    });
  }

  window.PNXFirebaseDiagnostics = { run, renderInto };
})();
