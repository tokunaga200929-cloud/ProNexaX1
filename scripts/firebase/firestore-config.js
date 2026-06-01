/* ================================================================
   ProNexaX Firebase Config
   STEP275: Firebase Webアプリ設定済み
   ================================================================ */

window.PNX_FIREBASE_CONFIG = {
  apiKey: "AIzaSyB6sPw0jazncZ35dWAQ62CtixvxhpOaUpU",
  authDomain: "pronexax-834f6.firebaseapp.com",
  projectId: "pronexax-834f6",
  storageBucket: "pronexax-834f6.firebasestorage.app",
  messagingSenderId: "599763624932",
  appId: "1:599763624932:web:ccf46206af9dfb17d45df1",
  measurementId: "G-196S9PB0NC"
};

window.PNX_FIRESTORE_COLLECTIONS = {
  tournaments: "tournaments",
  users: "users",
  favorites: "favorites",
  calendarEvents: "calendarEvents",
  financeTransactions: "financeTransactions",
  featuredContents: "featuredContents",
  appSettings: "appSettings"
};

/**
 * 注意:
 * Firebase apiKey は公開される前提の値です。
 * ただし、Firestore Rules は必ず適切に設定してください。
 *
 * 現在の流れ:
 * - CMSで大会を保存
 * - tournaments コレクションへ保存
 * - 本体試合検索が Firestore から tournaments を読み込み
 */
