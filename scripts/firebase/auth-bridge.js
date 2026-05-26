/* ================================================================
   ProNexaX Auth Bridge v1
   STEP33: Googleログイン / ユーザー保存 / admin判定
   ================================================================ */

(function(){
  if (window.PNXAuthBridge && window.PNXAuthBridge.version === "step33") return;

  const LOCAL_USER_KEY = "PNX_LOCAL_USER";
  const ADMIN_EMAILS = [
    // 本番化時に管理者メールを追加
    // "admin@example.com"
  ];

  function getLocalUser(){
    try { return JSON.parse(localStorage.getItem(LOCAL_USER_KEY) || "null"); }
    catch(e){ return null; }
  }

  function saveLocalUser(user){
    if (!user) {
      localStorage.removeItem(LOCAL_USER_KEY);
      return null;
    }
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    return user;
  }

  function isAdminEmail(email){
    return ADMIN_EMAILS.includes(email || "");
  }

  function normalizeUser(firebaseUser){
    if (!firebaseUser) return null;
    const email = firebaseUser.email || "";
    return {
      uid: firebaseUser.uid || "local-user",
      email,
      displayName: firebaseUser.displayName || email || "User",
      photoURL: firebaseUser.photoURL || null,
      provider: firebaseUser.providerData && firebaseUser.providerData[0] ? firebaseUser.providerData[0].providerId : "firebase",
      isAdmin: isAdminEmail(email),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
  }

  async function saveUserToFirestore(user){
    try {
      if (!user || !window.PNXFirebaseApp || !window.PNXFirebaseApp.db) return false;
      const db = window.PNXFirebaseApp.db;
      const ref = db.collection("users").doc(user.uid);
      const snap = await ref.get();
      const existing = snap.exists ? snap.data() : {};
      await ref.set({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: user.provider,
        isAdmin: existing.isAdmin === true ? true : user.isAdmin === true,
        createdAt: existing.createdAt || user.createdAt || new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      }, { merge:true });
      return true;
    } catch(e) {
      console.warn("[PNXAuthBridge] saveUserToFirestore failed", e);
      return false;
    }
  }

  const Auth = {
    version: "step33",
    currentUser: getLocalUser(),
    listeners: [],

    isAdmin(){
      return !!(this.currentUser && this.currentUser.isAdmin);
    },

    onChange(fn){
      if (typeof fn === "function") {
        this.listeners.push(fn);
        fn(this.currentUser);
      }
    },

    emit(){
      this.listeners.forEach(fn => { try { fn(this.currentUser); } catch(e) {} });
      try {
        document.body.classList.toggle("is-logged-in", !!this.currentUser);
        document.body.classList.toggle("is-admin", this.isAdmin());
      } catch(e) {}
      window.dispatchEvent(new CustomEvent("pnx:auth:changed", { detail: { user: this.currentUser } }));
    },

    async init(){
      const firebaseReady = window.PNXFirebaseApp && await window.PNXFirebaseApp.init();

      if (firebaseReady && window.PNXFirebaseApp.auth) {
        window.PNXFirebaseApp.auth.onAuthStateChanged(async user => {
          this.currentUser = normalizeUser(user);
          if (this.currentUser) await saveUserToFirestore(this.currentUser);
          saveLocalUser(this.currentUser);
          this.emit();
        });
      } else {
        this.currentUser = getLocalUser();
        this.emit();
      }
    },

    async loginWithGoogle(){
      const firebaseReady = window.PNXFirebaseApp && await window.PNXFirebaseApp.init();
      if (!firebaseReady || !window.firebase || !window.PNXFirebaseApp.auth) {
        console.warn("[PNXAuthBridge] Firebase not ready. Use loginLocal for development.");
        return this.loginLocal("local@example.com", "Local User");
      }

      const provider = new window.firebase.auth.GoogleAuthProvider();
      const result = await window.PNXFirebaseApp.auth.signInWithPopup(provider);
      this.currentUser = normalizeUser(result.user);
      await saveUserToFirestore(this.currentUser);
      saveLocalUser(this.currentUser);
      this.emit();
      return this.currentUser;
    },

    loginLocal(email, displayName){
      const user = {
        uid: "local-" + String(email || "guest").replace(/[^a-zA-Z0-9]/g, "_"),
        email: email || "",
        displayName: displayName || email || "Local User",
        photoURL: null,
        provider: "local",
        isAdmin: isAdminEmail(email || ""),
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      this.currentUser = saveLocalUser(user);
      this.emit();
      return this.currentUser;
    },

    async logout(){
      try {
        if (window.PNXFirebaseApp && window.PNXFirebaseApp.auth) {
          await window.PNXFirebaseApp.auth.signOut();
        }
      } catch(e) {}
      this.currentUser = null;
      saveLocalUser(null);
      this.emit();
    }
  };

  window.PNXAuthBridge = Auth;
  document.addEventListener("DOMContentLoaded", function(){ Auth.init(); });
})();
