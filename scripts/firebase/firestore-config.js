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
 * 1. 上のYOUR_...をFirebase Consoleの実値に変更
 * 2. Vercelへ再デプロイ
 * 3. CMSで大会を保存、または「本体へ反映」
 * 4. スマホのVercelで試合検索を開く
 *
 * STEP273以降:
 * - PNX_FIREBASE_CONFIG が実値なら、CMS保存時に tournaments コレクションへ自動保存します
 * - 本体試合検索は起動時に Firestore の tournaments から公開大会を読み込みます
 * - 設定が未入力の場合は、これまで通り localStorage で動きます
 */
