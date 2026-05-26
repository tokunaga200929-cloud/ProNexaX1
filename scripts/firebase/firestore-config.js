/* ================================================================
   ProNexaX Firebase Config
   STEP31: ここにFirebase Webアプリ設定を入力
   ================================================================ */

/**
 * Firebase Console → プロジェクト設定 → マイアプリ → Webアプリ
 * の firebaseConfig をここへ貼り付けます。
 *
 * 注意:
 * - apiKey は公開されてもFirebaseルールで守る前提の値です
 * - ただし、Firestore Rules / Auth設定は必ず正しく設定してください
 */

window.PNX_FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
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
 * Firebase接続を有効化する時:
 * 1. 上のYOUR_...を実値に変更
 * 2. ブラウザConsoleで PNXFirestoreBridge.setMode("firestore")
 * 3. Firebase診断パネルでOK確認
 */
