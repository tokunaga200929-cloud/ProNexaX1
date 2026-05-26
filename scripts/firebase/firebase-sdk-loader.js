/* ================================================================
   STEP29: Firebase SDK Loader
   Firebase設定値を入れればFirestore/Auth/Storageを初期化できる層
   ================================================================ */
(function(){
  if (window.PNXFirebaseSdkLoader) return;

  function loadScript(src){
    return new Promise((resolve, reject) => {
      if ([...document.scripts].some(s => s.src === src)) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  window.PNXFirebaseSdkLoader = {
    async load(){
      if (window.firebase && window.firebase.firestore && window.firebase.auth) return true;

      await loadScript("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js");
      await loadScript("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js");
      await loadScript("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js");
      await loadScript("https://www.gstatic.com/firebasejs/10.12.5/firebase-storage-compat.js");

      return !!(window.firebase && window.firebase.firestore && window.firebase.auth);
    }
  };
})();
