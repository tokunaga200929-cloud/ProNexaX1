// ================================================================
// PWA SERVICE WORKER 登録
// ================================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      console.log('[PWA] SW registered:', reg.scope);
    }).catch(err => console.warn('[PWA] SW failed:', err));
  });
}

// ================================================================
// Firebase Authentication
// ================================================================
// NOTE: Firebase設定は以下に実際の値を入れてください
// Firebase Console > プロジェクト設定 > マイアプリ > SDK スニペット
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyB6sPw0jazncZ35dWAQ62CtixvxhpOaUpU",
  authDomain:        "pronexax-834f6.firebaseapp.com",
  projectId:         "pronexax-834f6",
  storageBucket:     "pronexax-834f6.firebasestorage.app",
  messagingSenderId: "599763624932",
  appId:             "1:599763624932:web:ccf46206af9dfb17d45df1",
  measurementId:     "G-196S9PB0NC"
};

// ================================================================
// デモモード判定：プレースホルダーのままならFirebaseをスキップ
// ================================================================
// ★ 実際の Firebase 設定が入っているため、プレースホルダー判定は常に false
const _FIREBASE_IS_PLACEHOLDER = false;

// ================================================================
// ★★★ 管理者メールアドレスリスト ★★★
// ここに管理者の Gmail を追加してください
// ================================================================
const ADMIN_EMAILS = [
   "pronexax0929@gmail.com",  // ← 実際のメールアドレスに書き換えてください
];
// 管理者判定
function _isAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

let _fbAuthReady = false;
let _currentUser = null;

function _initFirebaseAuth() {
  // プレースホルダー設定ならFirebase SDK を読み込まずにゲストモードへ
  if (_FIREBASE_IS_PLACEHOLDER) {
    console.info('[Auth] Firebase未設定 → デモ（ゲスト）モードで起動します');
    _fbAuthReady = true;
    _onAuthStateChangedGuest();
    return;
  }

  // Firebase SDK (CDN) — app → auth → firestore の順に読み込む
  function _loadScript(src, onLoad, onErr) {
    const s = document.createElement('script');
    s.src = src;
    s.onload = onLoad;
    s.onerror = onErr || onLoad;  // エラー時も続行
    document.head.appendChild(s);
  }

  const FB_VER = '10.8.0';
  const _fallback = () => {
    _fbAuthReady = true;
    _onAuthStateChangedGuest();
    // Firestore SDK が部分的にロード済みの場合は起動を試みる
    if (typeof firebase !== 'undefined' && firebase.apps?.length &&
        typeof firebase.firestore === 'function') {
      setTimeout(_initFirestore, 500);
    }
  };

  _loadScript(
    `https://www.gstatic.com/firebasejs/${FB_VER}/firebase-app-compat.js`,
    () => _loadScript(
      `https://www.gstatic.com/firebasejs/${FB_VER}/firebase-auth-compat.js`,
      () => _loadScript(
        `https://www.gstatic.com/firebasejs/${FB_VER}/firebase-firestore-compat.js`,
        () => {
          try {
            if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
            // Auth
            const auth = firebase.auth();
            auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            auth.onAuthStateChanged(user => {
              _currentUser = user;
              _fbAuthReady  = true;
              _hideAuthLoading();           // ローディングオーバーレイを解除
              _onAuthStateChanged(user);
            });
            // iOS リダイレクトログインの結果を処理
            _handleRedirectResult();
            // Firestore — 認証状態に関係なく即時起動
            _initFirestore();
          } catch(e) {
            console.warn('[Firebase] init failed:', e);
            _fbAuthReady = true;
            _onAuthStateChangedGuest();
          }
        },
        _fallback
      ),
      _fallback
    ),
    _fallback
  );
}

// デモモードは即時起動、本番はDOM構築後に起動
function _runAfterDOM(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    setTimeout(fn, 0);
  }
}

if (_FIREBASE_IS_PLACEHOLDER) {
  // デモモードバナーを表示 & ゲストモード初期化
  _runAfterDOM(function() {
    const banner = document.getElementById('auth-demo-banner');
    if (banner) banner.style.display = 'block';
    _initFirebaseAuth();
  });
} else {
  // 本番設定あり：通常通り Firebase SDK を読み込む
  _runAfterDOM(_initFirebaseAuth);
}

// ゲストモード（Firebase未設定時）
function _onAuthStateChangedGuest() {
  const savedUser = localStorage.getItem('pronexax.guestUser');
  if (savedUser) {
    try {
      const u = JSON.parse(savedUser);
      _currentUser = { email: u.email, displayName: u.email.split('@')[0], uid: 'guest-'+btoa(u.email) };
      _showApp(_currentUser);
    } catch(e) { _showAuthScreen(); }
  } else {
    _showAuthScreen();
  }
}

function _onAuthStateChanged(user) {
  if (user) {
    _showApp(user);
  } else {
    _showAuthScreen();
  }
}

function _showAuthScreen() {
  const authEl = document.getElementById('auth-screen');
  if (authEl) {
    authEl.style.display = '';  // inline style を解除
    authEl.classList.remove('hidden');
  }
  document.getElementById('auth-loading')?.classList.add('hidden');
  document.body.classList.add('auth-guest');
  // 管理者状態もリセット
  _isAdmin = false;
  document.body.classList.remove('is-admin');
  const adminBtn = document.getElementById('nav-admin');
  if (adminBtn) adminBtn.style.display = 'none';
}

function _showApp(user) {
  _currentUser = user;
  document.getElementById('auth-screen')?.classList.add('hidden');
  document.body.classList.remove('auth-guest');

  // ★ 管理者メール判定
  const isAdmin = _isAdminEmail(user.email);
  _isAdmin = isAdmin;
  if (isAdmin) {
    document.body.classList.add('is-admin');
  } else {
    document.body.classList.remove('is-admin');
  }

  // ★ 管理タブの表示/非表示
  const adminNavBtn = document.getElementById('nav-admin');
  if (adminNavBtn) adminNavBtn.style.display = isAdmin ? '' : 'none';

  // アバターにイニシャル表示
  const displayName = user.displayName || user.email || '?';
  const initial = displayName.charAt(0).toUpperCase();
  document.querySelectorAll('.app-avatar').forEach(el => el.textContent = initial);

  // ドロワーのユーザー情報更新
  const nameEl = document.querySelector('.drawer-user-name');
  const subEl  = document.querySelector('.drawer-user-sub');
  if (nameEl) nameEl.textContent = displayName;
  if (subEl)  subEl.textContent  = user.email || '';

  // アバター（ドロワー）
  const avatarEl = document.querySelector('.drawer-user-avatar');
  if (avatarEl) {
    if (user.photoURL) {
      // Google ログイン時はプロフィール画像を使用
      avatarEl.innerHTML = `<img src="${user.photoURL}" alt="${initial}"
        style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
    } else {
      avatarEl.textContent = initial;
    }
  }

  // ユーザー固有ストレージキーでデータ読み込み
  _loadUserEvents();

  // 管理者ログイン後に管理リストを更新
  if (isAdmin && typeof renderAdminList === 'function') {
    setTimeout(renderAdminList, 300);
  }

  console.info(
    `[Auth] ログイン: ${user.email} | 管理者: ${isAdmin ? '✅' : '❌'}`
  );
}

// ユーザー固有のイベントデータ読み込み
function _loadUserEvents() {
  if (!_currentUser) return;
  const key = 'pronexax.events.' + (_currentUser.uid || 'guest');
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved) && saved.length > 0) {
        // 既存のデモデータは保持しつつユーザーデータをマージ
        const demoIds = new Set(EVENTS.filter(e => e.id < 20).map(e => e.id));
        const userEvs = saved.filter(e => e.id >= 20);
        // ユーザーが登録したイベントで上書き
        userEvs.forEach(ue => {
          const idx = EVENTS.findIndex(e => e.id === ue.id);
          if (idx >= 0) EVENTS[idx] = ue;
          else EVENTS.push(ue);
        });
      }
    }
  } catch(e) {}
}

// ユーザー固有のイベントデータ保存
function _saveUserEvents() {
  if (!_currentUser) return;
  const key = 'pronexax.events.' + (_currentUser.uid || 'guest');
  try {
    // ID 20以上はユーザー追加データ
    const userEvs = EVENTS.filter(e => e.id >= 20);
    localStorage.setItem(key, JSON.stringify(userEvs));
  } catch(e) {}
}

// 予定追加・編集前のログインチェック
function _requireAuth(callback) {
  if (_currentUser) { callback(); return; }
  showToast('ログインが必要です');
  document.getElementById('auth-screen')?.classList.remove('hidden');
}

// ログアウト
window.authLogout = function() {
  if (!confirm('ログアウトしますか？')) return;
  localStorage.removeItem('pronexax.guestUser');
  // 管理者状態をリセット
  _isAdmin = false;
  document.body.classList.remove('is-admin');
  const adminNavBtn = document.getElementById('nav-admin');
  if (adminNavBtn) adminNavBtn.style.display = 'none';
  if (typeof appState !== 'undefined') {
    appState.set('admin.isAdmin', false);
    appState.set('admin.mode', 'user');
  }
  if (typeof firebase !== 'undefined' && firebase.apps?.length) {
    firebase.auth().signOut().catch(()=>{});
  }
  _currentUser = null;
  document.body.classList.add('auth-guest');
  _showAuthScreen();
  if (typeof closeDrawer === 'function') closeDrawer();
};

// ── Google ログイン ──
window.authGoogleSignIn = async function() {
  const errEl  = document.getElementById('auth-error');
  const loader = document.getElementById('auth-loader');
  const btn    = document.querySelector('.auth-sns-btn[aria-label="Googleでログイン"]');

  if (errEl)  errEl.textContent = '';
  if (loader) loader.style.display = 'block';
  if (btn)    { btn.disabled = true; btn.style.opacity = '0.6'; }

  // Firestore 未ロードまたはデモモード
  if (_FIREBASE_IS_PLACEHOLDER || typeof firebase === 'undefined' || !firebase.apps?.length) {
    await new Promise(r => setTimeout(r, 600));
    if (loader) loader.style.display = 'none';
    if (btn)    { btn.disabled = false; btn.style.opacity = ''; }
    if (errEl)  errEl.textContent = 'Firebase未接続のためGoogleログインはご利用いただけません';
    return;
  }

  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    // スコープ追加
    provider.addScope('profile');
    provider.addScope('email');
    // iPhone Safari では signInWithPopup より signInWithRedirect が安定
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      // リダイレクト前にローディング画面を表示
      _showAuthLoading('Googleアカウントへ移動中…');
      await firebase.auth().signInWithRedirect(provider);
      // ← このコード以降はリダイレクト後に実行されない
    } else {
      const result = await firebase.auth().signInWithPopup(provider);
      // _onAuthStateChanged が _showApp を呼ぶ
    }
  } catch(err) {
    if (loader) loader.style.display = 'none';
    if (btn)    { btn.disabled = false; btn.style.opacity = ''; }
    const msgs = {
      'auth/popup-closed-by-user':       'ログインがキャンセルされました',
      'auth/popup-blocked':              'ポップアップがブロックされました',
      'auth/cancelled-popup-request':    'ログインがキャンセルされました',
      'auth/network-request-failed':     'ネットワークエラーです',
      'auth/account-exists-with-different-credential': 'このメールは別の方法で登録されています',
    };
    if (errEl) errEl.textContent = msgs[err.code] || err.message || 'Googleログインに失敗しました';
  }
};

// ── リダイレクト結果の処理（iOS Safari 用）──
function _handleRedirectResult() {
  if (typeof firebase === 'undefined' || !firebase.apps?.length) return;
  firebase.auth().getRedirectResult().then(result => {
    if (result && result.user) {
      // _onAuthStateChanged が呼ばれるので特に何もしなくてよい
      console.info('[Auth] Google リダイレクトログイン成功:', result.user.email);
    }
  }).catch(err => {
    if (err.code !== 'auth/no-auth-event') {
      console.error('[Auth] getRedirectResult error:', err);
    }
  });
}

// ── Auth ローディング中表示（ちらつき防止）──
function _showAuthLoading(msg) {
  const overlay = document.getElementById('auth-loading-overlay');
  if (overlay) {
    const txt = overlay.querySelector('.auth-loading-text');
    if (txt) txt.textContent = msg || '読み込み中…';
    overlay.style.display = 'flex';
  }
}
function _hideAuthLoading() {
  const overlay = document.getElementById('auth-loading-overlay');
  if (overlay) overlay.style.display = 'none';
}

// ================================================================
// 認証UIのイベントハンドラ
// ================================================================
window.authSwitchTab = function(tab) {
  document.querySelectorAll('.auth-tab').forEach(el => el.classList.toggle('is-active', el.dataset.tab === tab));
  document.getElementById('auth-register-fields')?.classList.toggle('hidden', tab !== 'register');
  document.getElementById('auth-error').textContent = '';
};

window.authSubmit = async function() {
  const emailEl = document.getElementById('auth-email');
  const passEl = document.getElementById('auth-password');
  const email = emailEl?.value?.trim();
  const pass = passEl?.value;
  const isRegister = document.querySelector('.auth-tab.is-active')?.dataset.tab === 'register';
  const errEl = document.getElementById('auth-error');
  const loader = document.getElementById('auth-loader');
  const btn = document.getElementById('auth-submit-btn');

  if (!email || !pass) { errEl.textContent = 'メールアドレスとパスワードを入力してください'; return; }
  if (pass.length < 6) { errEl.textContent = 'パスワードは6文字以上で入力してください'; return; }

  errEl.textContent = '';
  if (loader) loader.style.display = 'block';
  if (btn) btn.disabled = true;

  // ================================================================
  // デモモード判定：プレースホルダー設定 or Firebase未ロード → ゲストログイン
  // ================================================================
  const useGuest = _FIREBASE_IS_PLACEHOLDER ||
                   typeof firebase === 'undefined' ||
                   !firebase.apps?.length;

  if (useGuest) {
    // デモ用ゲストログイン（localStorage に保存）
    await new Promise(r => setTimeout(r, 500));
    localStorage.setItem('pronexax.guestUser', JSON.stringify({ email }));
    _currentUser = { email, displayName: email.split('@')[0], uid: 'guest-'+btoa(email) };
    if (loader) loader.style.display = 'none';
    if (btn) btn.disabled = false;
    _showApp(_currentUser);
    return;
  }

  // 本番 Firebase 認証
  try {
    const auth = firebase.auth();
    if (isRegister) {
      await auth.createUserWithEmailAndPassword(email, pass);
    } else {
      await auth.signInWithEmailAndPassword(email, pass);
    }
    // onAuthStateChanged が _showApp を呼ぶ
  } catch(err) {
    if (loader) loader.style.display = 'none';
    if (btn) btn.disabled = false;

    // Firebase設定エラー（api-key-not-valid 等）はゲストモードへ自動切り替え
    const configErrors = [
      'auth/api-key-not-valid',
      'auth/invalid-api-key',
      'auth/app-not-authorized',
      'auth/configuration-not-found',
    ];
    if (configErrors.includes(err.code)) {
      console.warn('[Auth] Firebase設定エラー → デモモードへ切り替え:', err.code);
      localStorage.setItem('pronexax.guestUser', JSON.stringify({ email }));
      _currentUser = { email, displayName: email.split('@')[0], uid: 'guest-'+btoa(email) };
      _showApp(_currentUser);
      return;
    }

    const msgs = {
      'auth/user-not-found': 'メールアドレスが登録されていません',
      'auth/wrong-password': 'パスワードが違います',
      'auth/email-already-in-use': 'このメールアドレスは既に使われています',
      'auth/invalid-email': 'メールアドレスの形式が正しくありません',
      'auth/weak-password': 'パスワードが弱すぎます（6文字以上）',
      'auth/network-request-failed': 'ネットワークエラーです',
      'auth/invalid-credential': 'メールアドレスまたはパスワードが正しくありません',
    };
    errEl.textContent = msgs[err.code] || err.message || 'エラーが発生しました';
  }
};
const NAV_ICONS={
  calendar:{active:`<rect x="3" y="4" width="16" height="15" rx="2.5" stroke="#1AAF7A" stroke-width="1.7"/><line x1="7" y1="2" x2="7" y2="6" stroke="#1AAF7A" stroke-width="1.7" stroke-linecap="round"/><line x1="15" y1="2" x2="15" y2="6" stroke="#1AAF7A" stroke-width="1.7" stroke-linecap="round"/><line x1="3" y1="9" x2="19" y2="9" stroke="#1AAF7A" stroke-width="1.7"/>`,inactive:`<rect x="3" y="4" width="16" height="15" rx="2.5" stroke="#9BB8AE" stroke-width="1.7"/><line x1="7" y1="2" x2="7" y2="6" stroke="#9BB8AE" stroke-width="1.7" stroke-linecap="round"/><line x1="15" y1="2" x2="15" y2="6" stroke="#9BB8AE" stroke-width="1.7" stroke-linecap="round"/><line x1="3" y1="9" x2="19" y2="9" stroke="#9BB8AE" stroke-width="1.7"/>`},
  search:{active:`<circle cx="10" cy="10" r="6" stroke="#1AAF7A" stroke-width="1.7"/><line x1="14.5" y1="14.5" x2="19" y2="19" stroke="#1AAF7A" stroke-width="1.7" stroke-linecap="round"/>`,inactive:`<circle cx="10" cy="10" r="6" stroke="#9BB8AE" stroke-width="1.7"/><line x1="14.5" y1="14.5" x2="19" y2="19" stroke="#9BB8AE" stroke-width="1.7" stroke-linecap="round"/>`},
  finance:{active:`<rect x="3" y="5" width="16" height="12" rx="2" stroke="#1AAF7A" stroke-width="1.7"/><line x1="7" y1="11" x2="15" y2="11" stroke="#1AAF7A" stroke-width="1.7" stroke-linecap="round"/><line x1="11" y1="8" x2="11" y2="14" stroke="#1AAF7A" stroke-width="1.7" stroke-linecap="round"/>`,inactive:`<rect x="3" y="5" width="16" height="12" rx="2" stroke="#9BB8AE" stroke-width="1.7"/><line x1="7" y1="11" x2="15" y2="11" stroke="#9BB8AE" stroke-width="1.7" stroke-linecap="round"/><line x1="11" y1="8" x2="11" y2="14" stroke="#9BB8AE" stroke-width="1.7" stroke-linecap="round"/>`},
  mypage:{active:`<circle cx="11" cy="8" r="3.5" stroke="#1AAF7A" stroke-width="1.7"/><path d="M4 19c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#1AAF7A" stroke-width="1.7" stroke-linecap="round"/>`,inactive:`<circle cx="11" cy="8" r="3.5" stroke="#9BB8AE" stroke-width="1.7"/><path d="M4 19c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#9BB8AE" stroke-width="1.7" stroke-linecap="round"/>`}
,
  admin:{
    active:`<rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#1AAF7A" stroke-width="1.7"/><rect x="12" y="3" width="7" height="7" rx="1.5" stroke="#1AAF7A" stroke-width="1.7"/><rect x="3" y="12" width="7" height="7" rx="1.5" stroke="#1AAF7A" stroke-width="1.7"/><rect x="12" y="12" width="7" height="7" rx="1.5" stroke="#1AAF7A" stroke-width="1.7"/>`,
    inactive:`<rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#9BB8AE" stroke-width="1.7"/><rect x="12" y="3" width="7" height="7" rx="1.5" stroke="#9BB8AE" stroke-width="1.7"/><rect x="3" y="12" width="7" height="7" rx="1.5" stroke="#9BB8AE" stroke-width="1.7"/><rect x="12" y="12" width="7" height="7" rx="1.5" stroke="#9BB8AE" stroke-width="1.7"/>`,
  }};


// ── 新デザイン用追加関数 ─────────────────────────────────────────
window.authTogglePw = function() {
  var inp = document.getElementById('auth-password');
  var icon = document.getElementById('auth-eye-icon');
  if (!inp || !icon) return;
  var hidden = inp.type === 'password';
  inp.type = hidden ? 'text' : 'password';
  icon.innerHTML = hidden
    ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
    : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
};
// タブ切替でボタンラベルも更新
(function() {
  var _orig = window.authSwitchTab;
  window.authSwitchTab = function(tab) {
    if (_orig) _orig(tab);
    var btn = document.getElementById('auth-submit-btn');
    if (btn) btn.textContent = tab === 'register' ? '新規登録' : 'ログイン';
  };
})();
window.authForgotPassword = function() {
  var email = (document.getElementById('auth-email') || {}).value || '';
  if (!email.trim()) { alert('メールアドレスを入力してください'); return; }
  alert('パスワードリセットメールを送信しました');
};// ================================================================
// ★★★ 階層型カテゴリーシステム v2 ★★★
//
// 構造: gender → region → group → tour
//   gender : 'mens' | 'womens'
//   region : 'domestic' | 'overseas'
//   group  : カテゴリグループ（国内ツアー / ミニツアー / オープン大会 / 海外ツアー）
//   tour   : 個別ツアー名
//
// 【大会追加時は tourKey に合わせるだけ】
//   tournaments[] に 1件追記 → 検索/フィルター/モーダル/カレンダー全自動反映
//
// ================================================================
const tournamentCategories = {
  mens: {
    label: '男子',
    domestic: {
      label: '国内',
      groups: {
        domestic_tour: {
          label: '国内ツアー',
          color: '#1AAF7A',
          tours: {
            jgto:   { label: 'JGTO',       desc: '男子ツアー',   color: '#1AAF7A', icon: '🏌' },
            acn:    { label: 'ACNツアー',   desc: 'ACN男子ツアー', color: '#2E8B57', icon: '🏌' },
            qt:     { label: 'QT',          desc: 'クォリファイングトーナメント', color: '#A0631A', icon: '📋' },
            qualifier: { label: '予選会',   desc: '各ツアー予選会', color: '#C4841A', icon: '📋' },
            jpga:   { label: 'JPGA',        desc: 'プロゴルフ協会', color: '#2D7DD2', icon: '🏌' },
            senior: { label: 'シニアツアー', desc: 'シニア男子ツアー', color: '#6B6B8E', icon: '🏌' },
          }
        },
        mini_tour: {
          label: 'ミニツアー',
          color: '#D4771A',
          tours: {
            mini:     { label: 'ミニツアー',          desc: '各種ミニツアー（旧互換）', color: '#D4771A', icon: '⛳' },
            atp_golf: { label: 'ATP GOLF TOUR',        desc: 'ミニツアー', color: '#4A90D9', icon: '⛳' },
            fj_tour:  { label: 'FJ TOUR',              desc: 'ミニツアー', color: '#E07B39', icon: '⛳' },
            future:   { label: 'Future Tour',          desc: 'ミニツアー', color: '#5C8A3C', icon: '⛳' },
            doucus:   { label: 'DOUCUS OPEN',          desc: 'ミニツアー', color: '#8B5CF6', icon: '⛳' },
            pandc:    { label: 'P&A CUP',              desc: 'ミニツアー', color: '#D4771A', icon: '⛳' },
            karts:    { label: 'カートルズツアー',      desc: 'ミニツアー', color: '#B85A1A', icon: '⛳' },
            golf_memo:{ label: 'The Golf Memo TOUR',   desc: 'ミニツアー', color: '#6B8E2E', icon: '⛳' },
            speeder:  { label: 'スピーダーチャレンジ', desc: 'ミニツアー', color: '#7B4DB5', icon: '⛳' },
          }
        },
        open_tour: {
          label: 'オープン大会',
          color: '#7B4DB5',
          tours: {
            open:       { label: 'オープン大会',  desc: '各種オープン大会（旧互換）', color: '#7B4DB5', icon: '🏆' },
            pref_open:  { label: '県オープン',   desc: 'prefecture open', color: '#7B4DB5', icon: '🏆' },
            famous_open:{ label: '有名オープン', desc: 'famous open',     color: '#5A3BA0', icon: '🏆' },
            local_open: { label: '地方オープン', desc: 'local open',      color: '#9B6DD5', icon: '🏆' },
          }
        },
      }
    },
    overseas: {
      label: '海外',
      groups: {
        overseas_tour: {
          label: '海外ツアー',
          color: '#2D7DD2',
          tours: {
            pga:     { label: 'PGA TOUR',      desc: '米国男子ツアー', color: '#2D7DD2', icon: '🌎' },
            korn_ferry:{ label: 'Korn Ferry Tour', desc: '米国下部ツアー', color: '#4A90D9', icon: '🌎' },
            dp_world:{ label: 'DP World Tour', desc: '欧州ツアー',   color: '#1A5DB0', icon: '🌎' },
            asian_tour:{ label: 'Asian Tour',  desc: 'アジアツアー', color: '#2E8B8E', icon: '🌎' },
            liv:     { label: 'LIV GOLF',      desc: 'LIVゴルフ',   color: '#1A7A3C', icon: '🌎' },
            china_m: { label: '中国ツアー',    desc: 'China Tour 男子', color: '#CC3333', icon: '🌏' },
            korea_m: { label: '韓国ツアー',    desc: 'KPGA Tour',   color: '#1A4DB5', icon: '🌏' },
            taiwan_m:{ label: '台湾ツアー',    desc: 'TLPGA Tour',  color: '#20A050', icon: '🌏' },
            phil_m:  { label: 'フィリピンツアー', desc: 'PHI Tour', color: '#D4881A', icon: '🌏' },
          }
        }
      }
    }
  },
  womens: {
    label: '女子',
    domestic: {
      label: '国内',
      groups: {
        domestic_tour: {
          label: '国内ツアー',
          color: '#E0567E',
          tours: {
            jlpga:      { label: 'JLPGA',            desc: '女子ツアー', color: '#E0567E', icon: '🏌‍♀️' },
            regular_w:  { label: 'レギュラーツアー',  desc: 'JLPGA レギュラー', color: '#E0567E', icon: '🏌‍♀️' },
            stepup:     { label: 'ステップ・アップ・ツアー', desc: '女子下部ツアー', color: '#E87FA8', icon: '🏌‍♀️' },
            qt_w:       { label: 'QT',               desc: '女子QT',    color: '#A0631A', icon: '📋' },
            qualifier_w:{ label: '予選会',            desc: '女子予選会', color: '#C4841A', icon: '📋' },
          }
        },
        mini_tour_w: {
          label: 'ミニツアー',
          color: '#E07B9C',
          tours: {
            mynavi_heroine: { label: 'マイナビ ネクストヒロイン', desc: '女子ミニツアー', color: '#C050A0', icon: '⛳' },
            next_heroine:   { label: 'NEXT HEROINE GOLF TOUR',   desc: '女子ミニツアー', color: '#9C59B5', icon: '⛳' },
            oneday:         { label: 'One Day Tour',              desc: '女子1日大会', color: '#E69B3A', icon: '⛳' },
            insta_open:     { label: 'インスタ募集大会',           desc: 'SNS募集大会', color: '#C84A8A', icon: '⛳' },
            regional_ladies:{ label: 'Regional Ladies Tour',     desc: '地域女子ツアー', color: '#B05070', icon: '⛳' },
          }
        },
        open_tour_w: {
          label: 'オープン大会',
          color: '#C84B6E',
          tours: {
            women_open:  { label: '女子オープン大会',  desc: '女子オープン（旧互換）', color: '#C84B6E', icon: '🏆' },
            pref_open_w: { label: '県オープン',       desc: '県女子オープン', color: '#C84B6E', icon: '🏆' },
            local_open_w:{ label: '地方女子オープン', desc: '地方女子OP',   color: '#A83060', icon: '🏆' },
          }
        },
      }
    },
    overseas: {
      label: '海外',
      groups: {
        overseas_tour_w: {
          label: '海外ツアー',
          color: '#2D7DD2',
          tours: {
            lpga:    { label: 'LPGA TOUR',          desc: '米国女子ツアー', color: '#2D7DD2', icon: '🌎' },
            china_w: { label: '中国女子ツアー',      desc: 'China Ladies',  color: '#CC3333', icon: '🌏' },
            klpga:   { label: '韓国女子ツアー（KLPGA）', desc: 'KLPGA',    color: '#E05555', icon: '🌏' },
            tlpga:   { label: '台湾女子ツアー（TLPGA）', desc: 'TLPGA',    color: '#20A050', icon: '🌏' },
            phil_w:  { label: 'フィリピン女子ツアー', desc: 'PHI Ladies',  color: '#D4881A', icon: '🌏' },
          }
        }
      }
    }
  }
};

// ================================================================
// ★ 階層カテゴリから各マスターデータを自動生成
// ================================================================
(function buildCategoryMasters(){
  // 全ツアーフラット配列（gender/region/group情報付き）
  window._TOUR_MASTER = [];
  ['mens','womens'].forEach(gender => {
    ['domestic','overseas'].forEach(region => {
      const regionDef = tournamentCategories[gender]?.[region];
      if(!regionDef) return;
      Object.entries(regionDef.groups||{}).forEach(([groupKey, groupDef]) => {
        Object.entries(groupDef.tours||{}).forEach(([tourKey, tourDef]) => {
          window._TOUR_MASTER.push({
            key: tourKey,
            label: tourDef.label,
            desc: tourDef.desc,
            color: tourDef.color,
            icon: tourDef.icon,
            gender,
            region,
            groupKey,
            groupLabel: groupDef.label,
            groupColor: groupDef.color,
          });
        });
      });
    });
  });
})();

// tourKey → ツアー定義の逆引きマップ
function _getTourDef(tourKey){
  return window._TOUR_MASTER.find(t => t.key === tourKey) || null;
}

// ================================================================
// ★★★ Phase3: 統合大会データベース ★★★
//
// 【追加方法】tournaments配列にオブジェクトを1件追記するだけで
//   検索・カード・詳細モーダル・カレンダー全てに自動反映されます。
//
// 【フィールド仕様】
//   id          : 必須・ユニーク文字列 例:'jgto-2025-001'
//   title       : 大会名（必須）
//   category    : ツアーキー（必須）- tournamentCategories のツアーキーと同一
//                 例: jgto / acn / qt / qualifier / jpga / senior /
//                     atp_golf / fj_tour / future / doucus / pandc /
//                     pref_open / famous_open / local_open /
//                     pga / korn_ferry / dp_world / asian_tour / liv /
//                     china_m / korea_m / taiwan_m / phil_m /
//                     jlpga / regular_w / stepup / qt_w / qualifier_w /
//                     mynavi_heroine / next_heroine / oneday / insta_open /
//                     regional_ladies / pref_open_w / women_open /
//                     lpga / china_w / klpga / tlpga / phil_w
//   gender      : 'mens' | 'womens' | 'both'  ← 自動推定も可
//   region      : 'domestic' | 'overseas'      ← 自動推定も可
//   area        : kanto/kansai/chubu/kyushu/hokkaido/overseas
//   prefecture  : 都道府県キー（例:'tokyo','osaka'）
//   course      : ゴルフ場名
//   startDate   : 'YYYY-MM-DD'
//   endDate     : 'YYYY-MM-DD'
//   entryDeadline : 'YYYY-MM-DD' | null
//   cancelDeadline: 'YYYY-MM-DD' | null
//   prize       : '15,000万円' など（任意）
//   prizeWinner : 優勝賞金（任意）
//   entryFee    : '30,000円' など（任意）
//   practiceRoundFee : 練習ラウンド費（任意）
//   entryMethod : エントリー方法（任意）
//   qualification: 出場資格（任意）
//   capacity    : '144名' など（任意）
//   organizer   : 主催者（任意）
//   tags        : ['推薦','注目'] など自由タグ（任意）
//   links: {
//     official  : 公式HP URL
//     instagram : Instagram URL
//     entry     : エントリーフォーム URL
//     pairs     : 組み合わせ URL
//     result    : 結果速報 URL
//   }
//
// ================================================================
const tournaments = [
  // ─── JGTO 男子ツアー ───────────────────────────────────────────
  {
    id:'jgto-2025-001',
    title:'東建ホームメイトカップ',
    category:'jgto', gender:'mens', region:'domestic',
    area:'chubu', prefecture:'mie',
    course:'東建多度CC・名古屋',
    startDate:'2025-04-03', endDate:'2025-04-06',
    entryDeadline:'2025-03-10', cancelDeadline:'2025-03-20',
    prize:'15,000万円', prizeWinner:'3,000万円',
    entryFee:'30,000円', practiceRoundFee:'8,000円',
    entryMethod:'JGTOオンライン申請',
    qualification:'JGTO出場資格保持者', capacity:'144名',
    organizer:'東建コーポレーション', tags:[],
    links:{ official:'', instagram:'', entry:'', pairs:'', result:'' }
  },
  {
    id:'jgto-2025-002',
    title:'中日クラウンズ',
    category:'jgto', gender:'mens', region:'domestic',
    area:'chubu', prefecture:'aichi',
    course:'名古屋GC 和合コース',
    startDate:'2025-04-24', endDate:'2025-04-27',
    entryDeadline:'2025-03-28', cancelDeadline:'2025-04-10',
    prize:'15,000万円', prizeWinner:'3,000万円',
    entryFee:'35,000円', practiceRoundFee:'9,000円',
    entryMethod:'JGTO公式サイト',
    qualification:'JGTO出場資格保持者', capacity:'144名',
    organizer:'中日新聞社', tags:[],
    links:{ official:'', instagram:'', entry:'', pairs:'', result:'' }
  },
  {
    id:'jgto-2025-003',
    title:'日本プロゴルフ選手権',
    category:'jgto', gender:'mens', region:'domestic',
    area:'kansai', prefecture:'hyogo',
    course:'宝塚GC',
    startDate:'2025-05-15', endDate:'2025-05-18',
    entryDeadline:'2025-04-20', cancelDeadline:'2025-05-01',
    prize:'20,000万円', prizeWinner:'4,000万円',
    entryFee:'50,000円', practiceRoundFee:'12,000円',
    entryMethod:'JPGA会員専用フォーム',
    qualification:'PGA正会員・特別会員', capacity:'156名',
    organizer:'日本プロゴルフ協会', tags:['メジャー'],
    links:{ official:'', instagram:'', entry:'', pairs:'', result:'' }
  },
  {
    id:'jgto-2025-004',
    title:'日本ゴルフツアー選手権 森ビルカップ Shishido Hills',
    category:'jgto', gender:'mens', region:'domestic',
    area:'kanto', prefecture:'ibaraki',
    course:'宍戸ヒルズCC 西コース',
    startDate:'2025-06-05', endDate:'2025-06-08',
    entryDeadline:'2025-05-09', cancelDeadline:'2025-05-22',
    prize:'20,000万円', prizeWinner:'4,000万円',
    entryFee:'40,000円', practiceRoundFee:'10,000円',
    entryMethod:'JGTOオンライン申請',
    qualification:'JGTO出場資格保持者', capacity:'144名',
    organizer:'JGTO / 森ビル', tags:['メジャー'],
    links:{ official:'', instagram:'', entry:'', pairs:'', result:'' }
  },
  {
    id:'jgto-2025-005',
    title:'日本オープン',
    category:'jgto', gender:'mens', region:'domestic',
    area:'kanto', prefecture:'chiba',
    course:'袖ヶ浦カンツリークラブ',
    startDate:'2025-10-09', endDate:'2025-10-12',
    entryDeadline:'2025-09-01', cancelDeadline:'2025-09-20',
    prize:'25,000万円', prizeWinner:'5,000万円',
    entryFee:'60,000円', practiceRoundFee:'15,000円',
    entryMethod:'JGA公式サイト',
    qualification:'JGA規定による', capacity:'156名',
    organizer:'日本ゴルフ協会', tags:['メジャー'],
    links:{ official:'', instagram:'', entry:'', pairs:'', result:'' }
  },
  {
    id:'jgto-2025-006',
    title:'ダンロップフェニックス',
    category:'jgto', gender:'mens', region:'domestic',
    area:'kyushu', prefecture:'miyazaki',
    course:'フェニックスCC',
    startDate:'2025-11-20', endDate:'2025-11-23',
    entryDeadline:'2025-10-20', cancelDeadline:'2025-11-05',
    prize:'20,000万円', prizeWinner:'4,000万円',
    entryFee:'40,000円', practiceRoundFee:'10,000円',
    entryMethod:'JGTOオンライン申請',
    qualification:'JGTO出場資格保持者', capacity:'144名',
    organizer:'住友ゴム工業', tags:[],
    links:{ official:'', instagram:'', entry:'', pairs:'', result:'' }
  },
  // ─── JLPGA 女子ツアー ──────────────────────────────────────────
  {
    id:'jlpga-2025-001',
    title:'ダイキンオーキッドレディス',
    category:'jlpga', gender:'womens', region:'domestic',
    area:'kyushu', prefecture:'okinawa',
    course:'琉球GC',
    startDate:'2025-03-06', endDate:'2025-03-09',
    entryDeadline:'2025-02-07', cancelDeadline:'2025-02-20',
    prize:'12,000万円', prizeWinner:'2,160万円',
    entryFee:'25,000円', practiceRoundFee:'7,000円',
    entryMethod:'JLPGA公式サイト',
    qualification:'JLPGA出場資格保持者', capacity:'120名',
    organizer:'ダイキン工業', tags:[],
    links:{ official:'', instagram:'', entry:'', pairs:'', result:'' }
  },
  {
    id:'jlpga-2025-002',
    title:'ワールドレディスチャンピオンシップ サロンパスカップ',
    category:'jlpga', gender:'womens', region:'domestic',
    area:'kanto', prefecture:'chiba',
    course:'勝浦東急GC',
    startDate:'2025-05-08', endDate:'2025-05-11',
    entryDeadline:'2025-04-11', cancelDeadline:'2025-04-25',
    prize:'18,000万円', prizeWinner:'3,240万円',
    entryFee:'30,000円', practiceRoundFee:'8,000円',
    entryMethod:'JLPGA公式サイト',
    qualification:'JLPGA出場資格保持者', capacity:'120名',
    organizer:'ニチバン', tags:['メジャー'],
    links:{ official:'', instagram:'', entry:'', pairs:'', result:'' }
  },
  {
    id:'jlpga-2025-003',
    title:'日本女子オープン',
    category:'jlpga', gender:'womens', region:'domestic',
    area:'kansai', prefecture:'hyogo',
    course:'小野GC',
    startDate:'2025-10-02', endDate:'2025-10-05',
    entryDeadline:'2025-09-01', cancelDeadline:'2025-09-18',
    prize:'16,000万円', prizeWinner:'2,880万円',
    entryFee:'40,000円', practiceRoundFee:'10,000円',
    entryMethod:'JGA公式サイト',
    qualification:'JGA規定による', capacity:'120名',
    organizer:'日本ゴルフ協会', tags:['メジャー'],
    links:{ official:'', instagram:'', entry:'', pairs:'', result:'' }
  },
  // ─── PGA TOUR / 海外 ──────────────────────────────────────────
  {
    id:'pga-2025-001',
    title:'マスターズ',
    category:'pga', gender:'mens', region:'overseas',
    area:'overseas', prefecture:'overseas',
    course:'オーガスタナショナルGC',
    startDate:'2025-04-10', endDate:'2025-04-13',
    entryDeadline:null, cancelDeadline:null,
    prize:'2,000万ドル', prizeWinner:'360万ドル',
    entryFee:'招待制', practiceRoundFee:null,
    entryMethod:'招待制（出場資格保持者のみ）',
    qualification:'マスターズ出場資格者', capacity:'90名前後',
    organizer:'オーガスタナショナルGC', tags:['メジャー','招待制'],
    links:{ official:'https://www.masters.com', instagram:'', entry:'', pairs:'', result:'' }
  },
  {
    id:'pga-2025-002',
    title:'全米オープン',
    category:'pga', gender:'mens', region:'overseas',
    area:'overseas', prefecture:'overseas',
    course:'オークモントCC（ペンシルベニア州）',
    startDate:'2025-06-12', endDate:'2025-06-15',
    entryDeadline:'2025-04-14', cancelDeadline:null,
    prize:'2,100万ドル', prizeWinner:'378万ドル',
    entryFee:'$200', practiceRoundFee:null,
    entryMethod:'USGA公式サイト（予選会あり）',
    qualification:'JGA推薦・予選会通過', capacity:'156名',
    organizer:'USGA', tags:['メジャー'],
    links:{ official:'https://www.usopen.com', instagram:'', entry:'', pairs:'', result:'' }
  },
  // ─── 予選会 ───────────────────────────────────────────────────
  {
    id:'qt-2025-001',
    title:'JGTO QT 第1ステージ 関東会場',
    category:'qualifier', gender:'mens', region:'domestic',
    area:'kanto', prefecture:'chiba',
    course:'PGAゴルフアカデミー',
    startDate:'2025-09-15', endDate:'2025-09-17',
    entryDeadline:'2025-08-20', cancelDeadline:'2025-09-01',
    prize:null, prizeWinner:null,
    entryFee:'45,000円', practiceRoundFee:'6,000円',
    entryMethod:'JGTOオンライン申請',
    qualification:'プロゴルファー（PGA・JGTO登録者）', capacity:'72名',
    organizer:'JGTO', tags:['QT'],
    links:{ official:'', instagram:'', entry:'', pairs:'', result:'' }
  },
  {
    id:'qt-2025-002',
    title:'JGTO QT ファイナルステージ',
    category:'qualifier', gender:'mens', region:'domestic',
    area:'kanto', prefecture:'ibaraki',
    course:'宍戸ヒルズCC',
    startDate:'2025-10-20', endDate:'2025-10-23',
    entryDeadline:'2025-09-25', cancelDeadline:'2025-10-06',
    prize:null, prizeWinner:null,
    entryFee:'80,000円', practiceRoundFee:'12,000円',
    entryMethod:'各ステージ通過者のみ',
    qualification:'QT各ステージ通過者', capacity:'144名',
    organizer:'JGTO', tags:['QT','ファイナル'],
    links:{ official:'', instagram:'', entry:'', pairs:'', result:'' }
  },
  // ─── ミニツアー ───────────────────────────────────────────────
  {
    id:'mini-2025-001',
    title:'Future Tour 第1戦 関東大会',
    category:'mini', gender:'mens', region:'domestic',
    area:'kanto', prefecture:'chiba',
    course:'袖ヶ浦カンツリークラブ',
    startDate:'2025-04-21', endDate:'2025-04-22',
    entryDeadline:'2025-04-07', cancelDeadline:'2025-04-14',
    prize:'100万円', prizeWinner:'30万円',
    entryFee:'18,000円', practiceRoundFee:'5,000円',
    entryMethod:'Future Tour公式LINE申請',
    qualification:'プロ・アマ（ハンデ3以内）', capacity:'48名',
    organizer:'Future Tour運営委員会', tags:['ミニツアー'],
    links:{ official:'', instagram:'', entry:'', pairs:'', result:'' }
  },
  {
    id:'mini-2025-002',
    title:'P&A CUP 第3戦',
    category:'mini', gender:'mens', region:'domestic',
    area:'kanto', prefecture:'kanagawa',
    course:'川崎国際生田緑地GC',
    startDate:'2025-05-26', endDate:'2025-05-27',
    entryDeadline:'2025-05-12', cancelDeadline:'2025-05-19',
    prize:'120万円', prizeWinner:'36万円',
    entryFee:'20,000円', practiceRoundFee:'5,500円',
    entryMethod:'P&A CUP公式サイト',
    qualification:'プロゴルファー（登録不要）', capacity:'60名',
    organizer:'P&A CUP実行委員会', tags:['ミニツアー'],
    links:{ official:'', instagram:'', entry:'', pairs:'', result:'' }
  },
  // ─── オープン大会 ─────────────────────────────────────────────
  {
    id:'open-2025-001',
    title:'ミズノオープン',
    category:'open', gender:'mens', region:'domestic',
    area:'chubu', prefecture:'aichi',
    course:'名古屋GC',
    startDate:'2025-05-22', endDate:'2025-05-25',
    entryDeadline:'2025-04-25', cancelDeadline:'2025-05-08',
    prize:'12,000万円', prizeWinner:'2,160万円',
    entryFee:'35,000円', practiceRoundFee:'9,000円',
    entryMethod:'JGTOオンライン申請',
    qualification:'JGTO出場資格保持者', capacity:'144名',
    organizer:'ミズノ', tags:[],
    links:{ official:'', instagram:'', entry:'', pairs:'', result:'' }
  },
  {
    id:'open-2025-002',
    title:'北海道オープン',
    category:'open', gender:'mens', region:'domestic',
    area:'hokkaido', prefecture:'hokkaido',
    course:'札幌GC 輪厚コース',
    startDate:'2025-05-29', endDate:'2025-05-31',
    entryDeadline:'2025-05-01', cancelDeadline:'2025-05-15',
    prize:'5,000万円', prizeWinner:'900万円',
    entryFee:'30,000円', practiceRoundFee:'8,000円',
    entryMethod:'北海道ゴルフ連盟申請',
    qualification:'プロゴルファー（北海道出身・在住優先）', capacity:'80名',
    organizer:'北海道ゴルフ連盟', tags:[],
    links:{ official:'', instagram:'', entry:'', pairs:'', result:'' }
  },
];

// ================================================================
// ★★★ Phase3: データアダプター ★★★
// tournaments[] → 旧来のTOURNAMENTS_FLAT互換形式に変換
// カレンダー機能・検索エンジン全てと互換性を維持
// ================================================================
// ================================================================
// ★★★ Phase7: TOURNAMENTS_FLATをlet宣言に変更（_rebuildFlatで再構築可能）★★★
// ================================================================
let TOURNAMENTS_FLAT = tournaments.map(t => ({
  // 旧フィールド互換
  id:       t.id,
  name:     t.title,
  cat:      t.category,
  gender:   t.gender,
  region:   t.region,
  place:    (function(){var m={tokyo:'東京都',kanagawa:'神奈川県',saitama:'埼玉県',chiba:'千葉県',ibaraki:'茨城県',tochigi:'栃木県',gunma:'群馬県',yamanashi:'山梨県',osaka:'大阪府',hyogo:'兵庫県',kyoto:'京都府',nara:'奈良県',shiga:'滋賀県',wakayama:'和歌山県',aichi:'愛知県',shizuoka:'静岡県',mie:'三重県',gifu:'岐阜県',nagano:'長野県',niigata:'新潟県',toyama:'富山県',ishikawa:'石川県',fukui:'福井県',fukuoka:'福岡県',saga:'佐賀県',nagasaki:'長崎県',kumamoto:'熊本県',oita:'大分県',miyazaki:'宮崎県',kagoshima:'鹿児島県',okinawa:'沖縄県',hokkaido:'北海道',overseas:'海外'};return t.prefecture?(m[t.prefecture]||t.prefecture):'';})(),
  courseName: t.course || '',
  start:    t.startDate,
  end:      t.endDate,
  area:     t.area,
  prefecture: t.prefecture,
  entryDeadline: t.entryDeadline,
  cancelDeadline: t.cancelDeadline,
  prize:    t.prize || '',
  prizeWinner: t.prizeWinner || '',
  entryFee: t.entryFee || '',
  practiceRoundFee: t.practiceRoundFee || '',
  entryMethod: t.entryMethod || '',
  qualification: t.qualification || '',
  capacity: t.capacity || '',
  organizer: t.organizer || '',
  tags:     t.tags || [],
  // links を旧フラットフィールドにも展開
  officialUrl: t.links?.official || t.links?.website || '',
  igUrl:       t.links?.instagram || '',
  entryUrl:    t.links?.entry || '',
  pairUrl:     t.links?.pairs || t.links?.pairing || '',
  resultUrl:   t.links?.result || '',
  // ★ Phase7: DB中心構造のための追加フィールド
  sourceType:    t.sourceType || 'manual',
  sourceUrl:     t.sourceUrl || '',
  parsingStatus: t.parsingStatus || 'idle',
  aiConfidence:  t.aiConfidence || null,
  status:        t.status || 'tbd',
  notes:         t.notes || '',
  country:       t.country || 'japan',
  subCategory:   t.subCategory || '',
  // officialUrl: links.websiteも参照
  // 新フォーマット参照用（詳細モーダル等）
  _raw: t,
}));

// ================================================================
// ★★★ DB互換レイヤー ★★★
// Phase3でtournaments[]に移行したが、カレンダーモーダルの大会選択
// (renderTourList / onTourClick) や addedIds 初期化など
// 旧コードが DB[category] 形式で参照し続けているため互換オブジェクトを生成。
// ================================================================
const DB = (function buildDB(){
  const db = { personal: [] };
  TOURNAMENTS_FLAT.forEach(function(t){
    if(!db[t.cat]) db[t.cat] = [];
    db[t.cat].push({
      name:  t.name,
      place: (t.courseName ? t.place + ' ' + t.courseName : t.place) || '',
      start: t.start,
      end:   t.end,
      area:  t.area,
      prefecture: t.prefecture,
    });
  });
  return db;
})();

// ================================================================
// ★★★ カテゴリマスター自動生成（tournamentCategories から導出）★★★
// ================================================================

// CAT_LABELS / CAT_COLORS: tournamentCategories の全ツアーから自動生成
const CAT_LABELS = { personal:'個人予定' };
const CAT_COLORS = { personal:'#6B6ED4' };
window._TOUR_MASTER.forEach(t => {
  CAT_LABELS[t.key] = t.label;
  CAT_COLORS[t.key] = t.color;
});

// CATEGORIES: カレンダーのオプトイン管理用（全ツアー + personal）
// 後方互換のため配列形式を維持
const CATEGORIES = [
  { key:'personal', label:'個人予定', desc:'自由入力', color:'#6B6ED4' },
  ...window._TOUR_MASTER.map(t => ({
    key: t.key, label: t.label, desc: t.desc, color: t.color
  }))
];

// ★ ローカルストレージからカテゴリ並び順を復元
const CAT_ORDER_KEY='pronexax.catOrder.v2';
(function restoreCatOrder(){
  try{
    const raw=localStorage.getItem(CAT_ORDER_KEY);
    if(!raw)return;
    const savedKeys=JSON.parse(raw);
    if(!Array.isArray(savedKeys))return;
    const byKey=Object.fromEntries(CATEGORIES.map(c=>[c.key,c]));
    const ordered=[];
    savedKeys.forEach(k=>{if(byKey[k]){ordered.push(byKey[k]);delete byKey[k];}});
    Object.values(byKey).forEach(c=>ordered.push(c));
    if(ordered.length===CATEGORIES.length){
      CATEGORIES.length=0;
      ordered.forEach(c=>CATEGORIES.push(c));
    }
  }catch(e){/* 失敗時はデフォルト順 */}
})();
function saveCatOrder(){
  try{localStorage.setItem(CAT_ORDER_KEY,JSON.stringify(CATEGORIES.map(c=>c.key)));}catch(e){}
}

// SEARCH_FILTERS: 後方互換（旧コードが参照する場合用）
const SEARCH_FILTERS=[
  {key:'all',label:'すべて'},
  ...window._TOUR_MASTER.filter(t=>t.gender==='mens'&&t.region==='domestic').map(t=>({key:t.key,label:t.label})),
  {key:'added',label:'✓ 登録済み'}
];

// ================================================================
// ★ 男女別・地域別チップリスト（階層から自動生成）
// 1段目: グループ選択  2段目: ツアー選択
// ================================================================
function _buildTourCatsByGenderRegion(gender, region){
  const regionDef = tournamentCategories[gender]?.[region];
  if(!regionDef) return [];
  const result = [{key:'all',label:'すべて',special:true}];
  Object.entries(regionDef.groups||{}).forEach(([groupKey, groupDef])=>{
    Object.entries(groupDef.tours||{}).forEach(([tourKey, tourDef])=>{
      result.push({ key:tourKey, label:tourDef.label, color:tourDef.color, groupKey, groupLabel:groupDef.label, groupColor:groupDef.color });
    });
  });
  result.push({key:'added',label:'✓ 登録済み',special:true});
  return result;
}

// 後方互換: TOUR_CATS_MENS / TOUR_CATS_WOMENS は引き続き参照可能
const TOUR_CATS_MENS    = _buildTourCatsByGenderRegion('mens', 'domestic');
const TOUR_CATS_WOMENS  = _buildTourCatsByGenderRegion('womens', 'domestic');

// 現在選択中のグループキー（null = すべて）
let _searchGroupKey = null;

// ★ Phase1: 性別・地域状態
let _searchGender = 'mens';   // 'mens' | 'womens'
let _searchRegion = 'domestic'; // 'domestic' | 'overseas'
// ===== エリア＋都道府県 マスタ =====
const AREA_FILTERS=[
  {key:'kanto',   label:'関東',    icon:'🗼'},
  {key:'kansai',  label:'関西',    icon:'⛩'},
  {key:'chubu',   label:'中部',    icon:'🗻'},
  {key:'kyushu',  label:'九州・沖縄',icon:'🌊'},
  {key:'hokkaido',label:'北海道・東北',icon:'❄️'},
  {key:'overseas',label:'海外',    icon:'✈️'},
];
const PREF_BY_AREA={
  kanto:   [{key:'tokyo',   label:'東京'},{key:'kanagawa',label:'神奈川'},
            {key:'saitama', label:'埼玉'},{key:'chiba',   label:'千葉'},
            {key:'ibaraki', label:'茨城'},{key:'tochigi', label:'栃木'},
            {key:'gunma',   label:'群馬'},{key:'yamanashi',label:'山梨'}],
  kansai:  [{key:'osaka',   label:'大阪'},{key:'hyogo',   label:'兵庫'},
            {key:'kyoto',   label:'京都'},{key:'nara',    label:'奈良'},
            {key:'shiga',   label:'滋賀'},{key:'wakayama',label:'和歌山'}],
  chubu:   [{key:'aichi',   label:'愛知'},{key:'shizuoka',label:'静岡'},
            {key:'mie',     label:'三重'},{key:'gifu',    label:'岐阜'},
            {key:'nagano',  label:'長野'},{key:'niigata', label:'新潟'},
            {key:'toyama',  label:'富山'},{key:'ishikawa',label:'石川'},
            {key:'fukui',   label:'福井'}],
  kyushu:  [{key:'fukuoka', label:'福岡'},{key:'saga',    label:'佐賀'},
            {key:'nagasaki',label:'長崎'},{key:'kumamoto',label:'熊本'},
            {key:'oita',    label:'大分'},{key:'miyazaki',label:'宮崎'},
            {key:'kagoshima',label:'鹿児島'},{key:'okinawa',label:'沖縄'}],
  hokkaido:[{key:'hokkaido',label:'北海道'},{key:'aomori', label:'青森'},
            {key:'iwate',   label:'岩手'},{key:'miyagi',  label:'宮城'},
            {key:'akita',   label:'秋田'},{key:'yamagata',label:'山形'},
            {key:'fukushima',label:'福島'}],
  overseas:[],
};
let searchAreaFilter=null; // null = 絞り込みなし（旧チップ用、FBSが主）
// ★★★ フィルターボトムシート状態 ★★★
let fbsCats=new Set();    // 確定：カテゴリ
let fbsAreas=new Set();   // 確定：エリア
let fbsPrefs=new Set();   // 確定：都道府県
let _fbsDraftCats=new Set();
let _fbsDraftAreas=new Set();
let _fbsDraftPrefs=new Set();
let _fbsExpandedArea=null; // シート内で展開中のエリアkey

// ★ NEW: リマインド状態 { [tournamentId]: { reminder:bool, reminderTiming:[...] } }
let remindMap={};
const REMIND_KEY='pronexax.remindMap.v1';
(function restoreRemind(){try{const r=localStorage.getItem(REMIND_KEY);if(r)remindMap=JSON.parse(r);}catch(e){}})();
function saveRemind(){try{localStorage.setItem(REMIND_KEY,JSON.stringify(remindMap));}catch(e){}}

// ★ NEW: 保存フィルター { name:string, cats:[], areas:[], prefs:[] }[]
let savedFilters=[];
const SAVED_FILTERS_KEY='pronexax.savedFilters.v1';
(function restoreSavedFilters(){try{const r=localStorage.getItem(SAVED_FILTERS_KEY);if(r)savedFilters=JSON.parse(r);}catch(e){}})();
function saveSavedFilters(){try{localStorage.setItem(SAVED_FILTERS_KEY,JSON.stringify(savedFilters));}catch(e){}}

// ★ NEW: 最近の検索キーワード (最大8件)
let recentSearches=[];
const RECENT_SEARCH_KEY='pronexax.recentSearches.v1';
(function restoreRecentSearches(){try{const r=localStorage.getItem(RECENT_SEARCH_KEY);if(r)recentSearches=JSON.parse(r);}catch(e){}})();
function saveRecentSearch(kw){
  if(!kw||kw.length<1)return;
  recentSearches=[kw,...recentSearches.filter(x=>x!==kw)].slice(0,8);
  try{localStorage.setItem(RECENT_SEARCH_KEY,JSON.stringify(recentSearches));}catch(e){}
}

// ★ NEW: 人気キーワード (固定)
const POPULAR_SEARCHES=['日本オープン','ミニツアー','JGTO','予選会','関東','九州'];

// ★ NEW: リマインドシート状態（単一選択）
let _remindTargetId=null;
let _remindSelected=null; // "weekBefore" | "dayBefore" | "sameDay" | null
let EVENTS=[
  {id:1,name:'関西オープン',date:'2025-05-01',end:'2025-05-04',place:'大阪府 茨木CC',cat:'jgto',memo:'スタート 8:32（10番ホール）\n前泊：茨木グランドホテル\nキャディ：田中さん'},
  {id:2,name:'ヤマハレディース',date:'2025-05-01',end:'2025-05-04',place:'静岡県 葛城GC',cat:'jlpga',memo:'プロアマ 4/30 ／ 1日目スタート 7:50'},
  {id:4,name:'QT第2戦',date:'2025-05-19',end:'2025-05-20',place:'埼玉県 大宮GC',cat:'qualifier',memo:''},
  {id:5,name:'ミズノオープン',date:'2025-05-22',end:'2025-05-25',place:'愛知県 名古屋GC',cat:'open',memo:'5/21 練習ラウンド予約済み'},
  {id:7,name:'練習ラウンド',date:'2025-05-08',end:'2025-05-08',place:'地元CC',cat:'personal',memo:'ドライバー試打 ／ アプローチ重点'},
  // ★★★ Day View 用：時刻つきの予定（5/15 を試合当日に想定） ★★★
  {id:10,name:'スタート（10番H）',date:'2025-05-15',end:'2025-05-15',start_datetime:'2025-05-15T08:32',end_datetime:'2025-05-15T12:10',place:'宝塚GC 10番ホール',cat:'jgto',memo:'前半ラウンド'},
  {id:11,name:'昼食 / クールダウン',date:'2025-05-15',end:'2025-05-15',start_datetime:'2025-05-15T12:10',end_datetime:'2025-05-15T13:00',place:'クラブハウス',cat:'personal',memo:''},
  {id:12,name:'後半ラウンド（1番H）',date:'2025-05-15',end:'2025-05-15',start_datetime:'2025-05-15T13:00',end_datetime:'2025-05-15T16:30',place:'宝塚GC 1番ホール',cat:'jgto',memo:''},
  {id:13,name:'記者対応',date:'2025-05-15',end:'2025-05-15',start_datetime:'2025-05-15T16:45',end_datetime:'2025-05-15T17:15',place:'メディアテント',cat:'jgto',memo:''},
  {id:14,name:'練習場 (Range)',date:'2025-05-15',end:'2025-05-15',start_datetime:'2025-05-15T07:30',end_datetime:'2025-05-15T08:20',place:'ドライビングレンジ',cat:'personal',memo:'ウォームアップ'},
  {id:15,name:'夕食ミーティング',date:'2025-05-15',end:'2025-05-15',start_datetime:'2025-05-15T18:30',end_datetime:'2025-05-15T20:00',place:'ホテルラウンジ',cat:'personal',memo:'スポンサー同席'},
  {id:16,name:'日本プロゴルフ選手権',date:'2025-05-15',end:'2025-05-18',place:'兵庫県 宝塚GC',cat:'jgto',memo:'4日間競技'},
];
const addedIds=new Set(EVENTS.map(e=>{const arr=DB[e.cat]||[];const idx=arr.findIndex(t=>t.name===e.name);return idx>=0?`${e.cat}-${idx}`:null;}).filter(Boolean));

let year=2025,month=4,selectedDate=null,newlyAddedDate=null,modalPresetDate=null;
let currentStep=1,selectedCat=null,selectedTour=null,nextId=20;
let editingId=null;
let calCatFilter=null; // ★ カレンダー上のカテゴリフィルタ：null=すべて、カテゴリkey指定で絞り込み
// ★★★ ドロワー関連の状態 ★★★
let viewMode='month';                  // 'day' | '3day' | 'week' | 'month'
let viewBaseDate=null;                 // 週/3日モードの基準日（月モードでは未使用）
const catVisibility={};                // カテゴリkey→表示ON(true)/OFF(false) ※後方互換
const VIEW_MODE_KEY='pronexax.viewMode.v1';
const CAT_VIS_KEY='pronexax.catVisibility.v1';
// ★★★ オプトイン型カテゴリ管理 ★★★
// personal は常時表示。その他は userEnabledCategories に追加したものだけ表示。
const ENABLED_CATS_KEY='pronexax.enabledCategories.v1';
let userEnabledCategories=[];  // 追加済みカテゴリのkeyリスト（personalは除く）
(function restorePrefs(){
  try{
    const m=localStorage.getItem(VIEW_MODE_KEY);
    if(m==='month'||m==='week'||m==='3day'||m==='day')viewMode=m;
    // オプトイン型：有効カテゴリを復元
    const ec=localStorage.getItem(ENABLED_CATS_KEY);
    if(ec){
      const arr=JSON.parse(ec);
      if(Array.isArray(arr))userEnabledCategories=arr.filter(k=>typeof k==='string');
    }
    // 旧来のcatVisibility（後方互換：今後はENABLED_CATSを使う）
    const v=localStorage.getItem(CAT_VIS_KEY);
    if(v){const obj=JSON.parse(v);if(obj&&typeof obj==='object'){Object.assign(catVisibility,obj);}}
  }catch(e){}
})();
function saveEnabledCategories(){
  try{localStorage.setItem(ENABLED_CATS_KEY,JSON.stringify(userEnabledCategories));}catch(e){}
}
function savePrefs(){
  try{
    localStorage.setItem(VIEW_MODE_KEY,viewMode);
    localStorage.setItem(CAT_VIS_KEY,JSON.stringify(catVisibility));
  }catch(e){}
}
let calLastClick={t:0,ds:''},tourLastClick={t:0,idx:-1,q:''};
let lpTimer=null,lpCell=null;
let swipeX=0,swipeY=0,swiping=false,swipeLocked=false;
let searchFilter='all',sortByPrize=false,openSearchCard=null;
// ★★★ 検索画面の追加状態 ★★★
// state = { tab, filterCategory } の2軸を分離管理
let searchMode='all';      // 'all' | 'fav'（タブ）— デフォルトは「すべて表示」
let favCatFilter=null;     // お気に入りタブ内のカテゴリ絞り込み（カテゴリkey or null）
const favTours=new Set();  // カテゴリkeyのお気に入り
const favTournaments=new Set(); // 大会idのお気に入り
let recentAddedIds=[];     // 最近追加した大会id（最大5件、新→旧）
const SEARCH_PREFS_KEY='pronexax.searchPrefs.v1';
const FAV_CATS_KEY='favoriteCategories'; // ★ 仕様書指定キー
(function restoreSearchPrefs(){
  try{
    // ① 仕様書指定キーから優先で復元
    const favCatsRaw=localStorage.getItem(FAV_CATS_KEY);
    if(favCatsRaw){
      const arr=JSON.parse(favCatsRaw);
      if(Array.isArray(arr))arr.forEach(k=>{if(typeof k==='string')favTours.add(k);});
    }
    const raw=localStorage.getItem(SEARCH_PREFS_KEY);
    if(!raw)return;
    const o=JSON.parse(raw);
    // ★ searchMode は復元しない — 起動時は必ず「すべて表示」
    if(Array.isArray(o.favTours))o.favTours.forEach(k=>favTours.add(k));
    if(Array.isArray(o.favTournaments))o.favTournaments.forEach(k=>favTournaments.add(k));
    if(Array.isArray(o.recentAddedIds))recentAddedIds=o.recentAddedIds.slice(0,5);
  }catch(e){}
})();
function saveSearchPrefs(){
  try{
    localStorage.setItem(SEARCH_PREFS_KEY,JSON.stringify({
      mode:searchMode,
      favTours:[...favTours],
      favTournaments:[...favTournaments],
      recentAddedIds:recentAddedIds.slice(0,5),
    }));
    // ★ 仕様書指定キーにも並行保存
    localStorage.setItem(FAV_CATS_KEY,JSON.stringify([...favTours]));
  }catch(e){}
}
const LP=500,DC=350,SW=50,MAX_CHIPS=3;

// ★★★ ドラッグ状態管理 ★★★
const drag={
  pressTimer:null,
  startX:0,startY:0,
  eventId:null,         // 長押し対象のイベントID
  active:false,         // 長押し成立後（ドラッグ可能状態）
  started:false,        // 実際のドラッグ移動が始まった
  origChipEl:null,      // 元のチップ要素（プレースホルダー化）
  cardEl:null,          // 浮遊カード要素
  currentDropTarget:null
};
const DRAG_LP_MS=380;   // 長押し判定（チップ用）
const DRAG_THRESHOLD=6;

// ★★★ セル全体ドラッグの状態管理 ★★★
const cellDrag={
  pressTimer:null,
  startX:0,startY:0,
  sourceDs:null,        // 移動元の日付文字列
  sourceCellEl:null,    // 移動元のセル要素
  active:false,         // 長押し成立
  started:false,        // 実ドラッグ開始
  cardEl:null,          // フロートカード
  currentDropTarget:null,
  suppressClickUntil:0, // 直近のドラッグ/長押しタップ処理直後、click を抑止する時刻
};
const CELL_DRAG_LP_MS=350;   // セル長押し閾値（誤操作防止：350ms）
const CELL_DRAG_THRESHOLD=8;

function switchPage(page){
  // ── ページ切替の基本処理 ──
  // 管理ページは管理者のみアクセス可
  if (page === 'admin' && !_isAdmin) {
    showToast('管理者のみアクセスできます');
    return;
  }
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');

  // ★ FIX: カレンダーページが非アクティブのとき
  //    visibility:hidden + pointer-events:none を適用。
  //    position:fixed / position:absolute の子要素が
  //    他ページ（特に検索画面）を覆う問題を防ぐ。
  const calPage = document.getElementById('page-calendar');
  if(calPage){
    if(page === 'calendar'){
      calPage.style.visibility = '';
      calPage.style.pointerEvents = '';
    } else {
      calPage.style.visibility = 'hidden';
      calPage.style.pointerEvents = 'none';
    }
  }

  // ── ナビゲーションボタン状態更新 ──
  ['calendar','search','finance','mypage','admin'].forEach(key=>{
    const btn=document.getElementById('nav-'+key),icon=document.getElementById('icon-'+key);
    const lbl=btn.querySelector('.bnav-label');btn.classList.remove('active');
    lbl.style.color='';lbl.style.fontWeight='';
    if(icon&&NAV_ICONS[key])icon.innerHTML=NAV_ICONS[key].inactive;
  });
  const activeBtn=document.getElementById('nav-'+page),activeIcon=document.getElementById('icon-'+page);
  if(activeBtn){activeBtn.classList.add('active');const lbl=activeBtn.querySelector('.bnav-label');lbl.style.color='#1AAF7A';lbl.style.fontWeight='600';if(activeIcon&&NAV_ICONS[page])activeIcon.innerHTML=NAV_ICONS[page].active;}

  // ── ページ別処理 ──
  if(page==='search'){
    // ★ Firestore ロード中なら Skeleton を表示
    if (typeof FirestoreDB !== 'undefined' && !FirestoreDB.isLoaded) {
      const list = document.getElementById('search-list');
      if (list) {
        list.innerHTML = Array.from({length:5}, ()=>`
          <div class="skel-card">
            <div class="skel-line skel-line-title"></div>
            <div class="skel-line skel-line-sub"></div>
            <div class="skel-line skel-line-badge"></div>
          </div>`).join('');
      }
    }
    // ★ FIX: 検索画面に来た時は確実に再描画
    if (typeof _invalidateSearchCache === 'function') _invalidateSearchCache();
    if (typeof renderSearchFilters === 'function') renderSearchFilters();
    if (typeof applySearchFilters === 'function') applySearchFilters();
    // モーダルを確実に閉じてstateリセット
    const _s = document.getElementById('tdm-sheet');
    const _o = document.getElementById('tdm-overlay');
    if(_s){ _s.classList.remove('show','is-dragging'); _s.style.transform=''; _s.style.transition=''; }
    if(_o){ _o.classList.remove('show'); }
    if(typeof closeTournamentModal === 'function' && typeof _tdmCurrentId !== 'undefined' && _tdmCurrentId){ closeTournamentModal(); }
  }
  if(page==='calendar'){
    // カレンダーに戻った時: visibility を確実に解除してから再描画
    renderAllPanels();renderCalList();
  }
}

function todayStr(){const t=new Date();return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;}
function defaultDateStr(){return modalPresetDate||selectedDate||todayStr();}
function dsFromDate(d){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
// カテゴリ未設定イベントを除外するフィルタ（データ自体は保持）
function hasCat(e){ return e.category ? e.category.trim() !== '' : (e.cat && e.cat.trim() !== ''); }
function getEventsOnDate(ds){return EVENTS.filter(e=>hasCat(e)&&ds>=e.date&&ds<=e.end);}
function getEventsInMonth(y,m){const ym=`${y}-${String(m+1).padStart(2,'0')}`;return EVENTS.filter(e=>hasCat(e)&&e.date<=ym+'-31'&&e.end>=ym+'-01').sort((a,b)=>a.date.localeCompare(b.date));}
// ★ カテゴリ表示ON/OFF：オプトイン型
// personal は常時ON。その他は userEnabledCategories に含まれるものだけON。
function isCatVisible(catKey){
  if(catKey==='personal')return true;
  return userEnabledCategories.includes(catKey);
}
// カテゴリ追加
function addCategory(key){
  if(key==='personal')return;
  if(!userEnabledCategories.includes(key)){
    userEnabledCategories.push(key);
    saveEnabledCategories();
  }
}
// カテゴリ削除
function removeCategory(key){
  if(key==='personal')return;
  userEnabledCategories=userEnabledCategories.filter(k=>k!==key);
  saveEnabledCategories();
}
function applyCatFiltersToEvents(events){
  return events.filter(e=>{
    if(!isCatVisible(e.cat))return false;
    if(calCatFilter&&e.cat!==calCatFilter)return false;
    return true;
  });
}

// ★ チップに data-event-id を付与してドラッグ識別
// occupiedLanes: その日のセル内で複数日バーが既に占有しているレーン番号（Set<number>）
function buildChipsHTML(ds,occupiedLanes){
  let evs=getEventsOnDate(ds);
  evs=applyCatFiltersToEvents(evs);
  // ★ 複数日（バー化対象）はセル内チップから除外。代わりにレーン分のスペーサーを差し込む。
  const singleDayEvs=evs.filter(e=>e.date===e.end);
  const lanes=occupiedLanes?Array.from(occupiedLanes).sort((a,b)=>a-b):[];
  const maxLane=lanes.length?lanes[lanes.length-1]:-1;
  // スペーサーは 0..maxLane まで（占有していないレーンも空白でスペース確保）
  let spacerHtml='';
  for(let i=0;i<=maxLane;i++){
    spacerHtml+='<span class="md-spacer" aria-hidden="true"></span>';
  }
  // 日常収支：その日の合計（収入＋支出のネット）
  // 単日チップ＋＋N件
  // 表示できる残り枠：MAX_CHIPS から spacer 行数 と 日常チップ分 を引く
  const remain=Math.max(0,MAX_CHIPS-(maxLane+1));
  const total=singleDayEvs.length;
  const shown=singleDayEvs.slice(0,remain);
  // ※ 複数日イベントはバー化されているため "+N件" にはカウントしない
  let html=spacerHtml+shown.map(e=>{
    const s=e.name.length>6?e.name.slice(0,6)+'…':e.name;
    return`<span class="ev-chip chip-${e.cat}" data-event-id="${e.id}">${s}</span>`;
  }).join('');
  // ＋N件：単日イベントのうち表示しきれなかった件数
  const hiddenSingles=Math.max(0,total-remain);
  if(hiddenSingles>0)html+=`<span class="chip-more" onclick="event.stopPropagation();openDayModal('${ds}')">+${hiddenSingles}件</span>`;
  // 日常収支ラベル（末尾）
  return html;
}

// ★★★ 週ごとの複数日イベントレイアウト計算 ★★★
// weekDates: その週7日分の ds 配列（日曜始まり）
// 戻り値: { bars:[{eventId,cat,name,startCol,endCol,continuesLeft,continuesRight,lane}], laneByDate:{ds:Set<lane>} }
function computeMultidayLayoutForWeek(weekDates){
  if(!weekDates||weekDates.length===0)return{bars:[],laneByDate:{}};
  const weekStart=weekDates[0],weekEnd=weekDates[6];
  // この週に重なる「複数日」イベントを抽出（カテゴリフィルタも適用）
  let evs=EVENTS.filter(e=>hasCat(e)&&e.date!==e.end&&e.date<=weekEnd&&e.end>=weekStart);
  evs=applyCatFiltersToEvents(evs);
  // 開始日順、長いもの優先
  evs.sort((a,b)=>{
    if(a.date!==b.date)return a.date.localeCompare(b.date);
    // 終了が遅い（長い）方を先に
    return b.end.localeCompare(a.end);
  });
  // レーン割り当て：各レーンが「最後に占有した終了列」を保持
  const lanes=[]; // lanes[i] = lastEndCol
  const bars=[];
  const laneByDate={};
  weekDates.forEach(ds=>{laneByDate[ds]=new Set();});
  for(const e of evs){
    // 当該週内で見える範囲を列で計算
    let startCol=0,endCol=6;
    for(let i=0;i<7;i++){if(weekDates[i]===e.date){startCol=i;break;}else if(weekDates[i]>e.date){startCol=0;break;}}
    // 開始日が週内なら startCol、それ以外は 0
    if(e.date>=weekStart&&e.date<=weekEnd){
      startCol=weekDates.indexOf(e.date);
    }else{
      startCol=0;
    }
    if(e.end>=weekStart&&e.end<=weekEnd){
      endCol=weekDates.indexOf(e.end);
    }else{
      endCol=6;
    }
    if(startCol<0)startCol=0;
    if(endCol<0)endCol=6;
    if(endCol<startCol)continue;
    // 利用可能レーンを探す
    let lane=-1;
    for(let i=0;i<lanes.length;i++){
      if(lanes[i]<startCol){lane=i;break;}
    }
    if(lane===-1){lane=lanes.length;lanes.push(endCol);}
    else{lanes[lane]=endCol;}
    bars.push({
      eventId:e.id,
      cat:e.cat,
      name:e.name,
      startCol,endCol,
      continuesLeft:e.date<weekStart,
      continuesRight:e.end>weekEnd,
      lane,
    });
    // セルごとの占有レーン記録
    for(let c=startCol;c<=endCol;c++){
      laneByDate[weekDates[c]].add(lane);
    }
  }
  return{bars,laneByDate};
}

function buildMultidayLayerHTML(bars){
  if(!bars||bars.length===0)return'';
  const inner=bars.map(b=>{
    const cls=[
      'cal-multiday-bar',
      'mdbar-'+b.cat,
      b.continuesLeft?'continues-left':'',
      b.continuesRight?'continues-right':'',
    ].filter(Boolean).join(' ');
    // grid-column は 1始まり
    const colStart=b.startCol+1;
    const colEnd=b.endCol+2;
    const row=b.lane+1;
    const label=escapeHtml(b.name);
    // 開始日のセル位置でのみテキストを表示すると見切れ対策になる
    return`<div class="${cls}" style="grid-column:${colStart}/${colEnd};grid-row:${row};" data-event-id="${b.eventId}" title="${label}">${label}</div>`;
  }).join('');
  return`<div class="cal-multiday-layer">${inner}</div>`;
}

function buildCalHTML(y,m){
  const fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate();
  const ts=dsFromDate(new Date()),ym=`${y}-${String(m+1).padStart(2,'0')}`;
  const rows=Math.ceil((fd+dim)/7);
  let cells=[];
  for(let i=0;i<fd;i++){const pd=new Date(y,m,-fd+i+1);cells.push({day:pd.getDate(),ds:dsFromDate(pd),other:true,isToday:false});}
  for(let d=1;d<=dim;d++){const ds=`${ym}-${String(d).padStart(2,'0')}`;cells.push({day:d,ds,other:false,isToday:ds===ts});}
  const rem=cells.length%7;if(rem)for(let d=1;d<=7-rem;d++){const nd=new Date(y,m+1,d);cells.push({day:d,ds:dsFromDate(nd),other:true,isToday:false});}
  let h='<div class="cal-grid">';
  for(let r=0;r<rows;r++){
    // 当該週の日付配列
    const weekDates=[];
    for(let c=0;c<7;c++){const cell=cells[r*7+c];weekDates.push(cell?cell.ds:'');}
    // 複数日バーレイアウト
    const layout=computeMultidayLayoutForWeek(weekDates);
    h+='<div class="cal-row">';
    for(let c=0;c<7;c++){
      const cell=cells[r*7+c];if(!cell){h+='<div class="cal-cell other"></div>';continue;}
      const{day,ds,other,isToday}=cell;const isSel=ds===selectedDate,isNew=ds===newlyAddedDate;
      // ★ UTC日付ズレ修正: ローカル日付として曜日を取得
      const [_cy,_cm,_cd]=ds.split('-').map(Number);const dow=new Date(_cy,_cm-1,_cd).getDay();const nc=other?' other-txt':isToday?' today-txt':dow===0?' sun':dow===6?' sat':'';
      const occupiedLanes=layout.laneByDate[ds]||new Set();
      h+=`<div class="cal-cell${other?' other':''}${isSel?' selected':''}${isNew?' newly-added':''}" data-ds="${ds}">
        <div class="cal-date-wrap${isToday?' today-circle':''}"><span class="cal-num${nc}">${day}</span></div>
        <div class="chips">${buildChipsHTML(ds,occupiedLanes)}</div></div>`;
    }
    // 週行の最後に複数日バーレイヤを挿入
    h+=buildMultidayLayerHTML(layout.bars);
    h+='</div>';
  }
  return h+'</div>';
}

function openDayModal(ds){
  let evs=getEventsOnDate(ds);
  evs=applyCatFiltersToEvents(evs);
  // ★ UTC日付ズレ修正: 'YYYY-MM-DD' 文字列をローカル日付として生成
  const [_y,_m,_d]=ds.split('-').map(Number);
  const d=new Date(_y,_m-1,_d);
  const filterNote=calCatFilter?`（${(CATEGORIES.find(c=>c.key===calCatFilter)||{}).label||calCatFilter}）`:'';
  document.getElementById('day-modal-title').textContent=`${d.getMonth()+1}月${d.getDate()}日の予定${filterNote}（${evs.length}件）`;
  document.getElementById('day-modal-list').innerHTML='<div style="padding:0 0 4px;">'+evs.map(e=>{
    const memoHtml=e.memo?`<div class="event-memo" title="${escapeHtml(e.memo)}">${escapeHtml(firstLine(e.memo))}</div>`:'';
    const dl=deadlineState(e);
    const dlHtml=dl?`<div class="deadline-row">
      <span class="deadline-badge ${dl.cls}">${dl.label}</span>
      <button class="notif-mini-btn" onclick="event.stopPropagation();openNotifSettings(${e.id})">🔔 通知</button>
    </div>`:'';
    const dim=e.entryStatus==='entered'?' deadline-event-dim':'';
    return`<div class="day-event-item${dim}" onclick="openEditFromDayModal(${e.id})"><div class="day-event-stripe stripe-${e.cat}"></div><div class="day-event-body"><div class="day-event-name">${e.name}</div><div class="day-event-meta">${e.date.slice(5).replace('-','/')}${e.date!==e.end?' 〜 '+e.end.slice(5).replace('-','/'):''}${e.place?' | '+e.place:''}</div>${memoHtml}${dlHtml}</div><button class="day-event-del" onclick="event.stopPropagation();deleteEventFromModal(${e.id},'${ds}')">削除</button></div>`;
  }).join('')+'</div>';
  document.getElementById('day-modal-overlay').classList.add('show');
}
function closeDayModal(){document.getElementById('day-modal-overlay').classList.remove('show');}
function openEditFromDayModal(id){closeDayModal();setTimeout(()=>openModal(null,id),250);}
function deleteEventFromModal(id,ds){
  const ev=EVENTS.find(e=>e.id===id);if(ev){const arr=DB[ev.cat]||[];const idx=arr.findIndex(t=>t.name===ev.name);if(idx>=0)addedIds.delete(`${ev.cat}-${idx}`);}
  EVENTS=EVENTS.filter(e=>e.id!==id);newlyAddedDate=null;renderAllPanels();renderCalList();
  // カテゴリフィルタ適用後の件数で継続判定（非表示カテゴリを誤カウントしない）
  if(applyCatFiltersToEvents(getEventsOnDate(ds)).length>0){openDayModal(ds);}else{closeDayModal();}
  showToast('予定を削除しました');
}

function adjMonth(y,m,d){let nm=m+d,ny=y;if(nm>11){nm=0;ny++;}if(nm<0){nm=11;ny--;}return{y:ny,m:nm};}
function renderAllPanels(){
  const prev=adjMonth(year,month,-1),next=adjMonth(year,month,1);
  document.getElementById('panel-prev').innerHTML=buildCalHTML(prev.y,prev.m);
  document.getElementById('panel-cur').innerHTML=buildCalHTML(year,month);
  document.getElementById('panel-next').innerHTML=buildCalHTML(next.y,next.m);
  const sc=document.getElementById('cal-slide-container');sc.classList.remove('animating');sc.style.transform='translateX(-33.333%)';
  bindPanelEvents();

  // ★ Safari PWA: flex chain の高さ崩壊を検出して強制修正
  requestAnimationFrame(function(){
    _fixCalendarHeight();
  });
}

// ★★★ Safari PWA カレンダー高さ強制修正 ★★★
// cal-swipe-wrap の offsetHeight が 0 または極小の場合にフォールバック高さをセット
function _fixCalendarHeight(){
  var wrap = document.getElementById('cal-swipe-wrap');
  var monthWrap = document.getElementById('month-ui-wrap');
  if(!wrap || !monthWrap) return;

  // 月ラッパーが非表示なら何もしない
  if(monthWrap.style.display === 'none') return;

  var wrapH = wrap.offsetHeight;
  if(wrapH < 100){
    // flex chain が崩壊している → 利用可能高さを直接計算してセット
    var frameH  = window.innerHeight;
    var innerEl = document.querySelector('.phone-inner');
    var innerH  = innerEl ? innerEl.offsetHeight : frameH;
    // ヘッダー + cal-header + bottom-nav の高さを引いた残高さ
    var appHeader = document.querySelector('.app-header');
    var calHeader = document.querySelector('.cal-header');
    var splitH    = document.getElementById('split-handle');
    var calLegend = document.getElementById('cat-legend');
    var bottomNav = document.querySelector('.bottom-nav');
    var usedH = 0;
    if(appHeader) usedH += appHeader.offsetHeight;
    if(calHeader) usedH += calHeader.offsetHeight;
    if(splitH)    usedH += splitH.offsetHeight;
    if(calLegend) usedH += calLegend.offsetHeight;
    if(bottomNav) usedH += bottomNav.offsetHeight;
    // cal-scroll は flex:1 なので最低 40% を残す
    var calScrollMinH = Math.floor(innerH * 0.3);
    var availH = innerH - usedH - calScrollMinH;
    if(availH > 100){
      wrap.style.height = availH + 'px';
      wrap.style.minHeight = availH + 'px';
      wrap.style.flex = 'none';
    }
  } else {
    // 正常に高さが取れている → inline style をリセット（CSS に委ねる）
    if(wrap.style.flex === 'none'){
      wrap.style.height = '';
      wrap.style.minHeight = '';
      wrap.style.flex = '';
    }
  }
}

// ★★★ パネルイベント：チップ長押し→ドラッグ + セル長押し→セル全体ドラッグ ★★★
function bindPanelEvents(){
  ['panel-prev','panel-cur','panel-next'].forEach(id=>{
    const p=document.getElementById(id),ng=p.cloneNode(true);p.parentNode.replaceChild(ng,p);
    
    // クリック処理（チップタップでもセル選択を発火させる）
    ng.addEventListener('click',e=>{
      // +N件は専用処理に委譲
      if(e.target.classList.contains('chip-more'))return;
      // ★ 複数日バーのタップ検出：pointer-events:none でも座標からバーを特定
      //    e.target はバーにならないが、クリック座標にバーが存在すれば編集モーダルを開く
      const barAtPoint=(function(){
        // まずそのまま closest で確認（pointer-events:auto の場合）
        const direct=e.target.closest('.cal-multiday-bar');
        if(direct)return direct;
        // pointer-events:none の場合：座標上の全要素を走査
        const els=document.elementsFromPoint(e.clientX,e.clientY);
        for(const el of els){
          if(el.classList&&el.classList.contains('cal-multiday-bar'))return el;
        }
        return null;
      })();
      if(barAtPoint&&barAtPoint.dataset.eventId){
        e.stopPropagation();
        const eid=parseInt(barAtPoint.dataset.eventId,10);
        if(!isNaN(eid))openModal(null,eid);
        return;
      }
      // セルドラッグ中・直後のクリックは抑止
      if(cellDrag.started||cellDrag.active)return;
      if(Date.now()<cellDrag.suppressClickUntil)return;
      // チップドラッグ直後のクリックも抑止
      if(drag.started||drag.active)return;
      if(Date.now()<drag.suppressClickUntil)return;
      // 範囲選択中・直後のクリックも抑止
      if(rangeSelect.active||rangeSelect.startDs)return;
      const c=e.target.closest('.cal-cell');
      if(c&&c.dataset.ds)onCellClick(c.dataset.ds);
    });
    
    // ★ touchstart：チップ→チップドラッグ判定 / セル→セルドラッグ判定 / 予定なし→範囲選択
    ng.addEventListener('touchstart',e=>{
      // ★ 複数日バー：pointer-events:none でも Safari PWA では e.target がバーになることがある
      //    バーのタップ = 親セルへの操作として扱う（クリックはclick側で data-event-id を処理）
      //    ただし長押し・ドラッグはバーを無視してセルの処理を優先する
      const chip=e.target.closest('.ev-chip');
      if(chip&&chip.dataset.eventId){
        startChipPress(e,chip);
        return;
      }
      // chip-more（+N件）はモーダル開く処理に流す
      if(e.target.classList.contains('chip-more'))return;
      // バーをタップした場合：短タップはclickに任せる。長押し・ドラッグはセル単位で処理
      const bar=e.target.closest('.cal-multiday-bar');
      const c=bar ? bar.closest('.cal-row')  // バーの場合は行内のセルを座標から取得
                   : e.target.closest('.cal-cell');
      // バータップ時：座標からセルを特定（バーを pointer-events:none にしても保険）
      let targetCell=e.target.closest('.cal-cell');
      if(!targetCell&&bar){
        // バーが pointer-events を持っていた場合：座標からセルを逆引き
        const t=e.touches[0];
        const elBelow=_cellFromPoint(t.clientX,t.clientY);
        targetCell=elBelow;
      }
      if(targetCell&&targetCell.dataset.ds&&!swipeLocked){
        // 予定が入っている日 → セルドラッグ準備（カテゴリフィルタ適用後で判定）
        const evs=applyCatFiltersToEvents(getEventsOnDate(targetCell.dataset.ds));
        if(evs.length>0){
          startCellPress(e,targetCell.dataset.ds,targetCell);
        }else{
          // 予定なしの日 → 範囲選択開始（長押し判定）
          startRangePress(e,targetCell.dataset.ds,targetCell);
        }
      }
    },{passive:false});
    
    ng.addEventListener('touchmove',e=>{
      // セルドラッグ中：カード追従
      if(cellDrag.started){
        e.preventDefault();
        moveCellDragCard(e);
        return;
      }
      // セル長押し前後：閾値判定
      if(cellDrag.sourceDs){
        const t=e.touches[0];
        const dx=t.clientX-cellDrag.startX,dy=t.clientY-cellDrag.startY;
        if(cellDrag.active&&Math.hypot(dx,dy)>CELL_DRAG_THRESHOLD){
          e.preventDefault();
          beginCellDrag(e);
        }else if(!cellDrag.active&&Math.hypot(dx,dy)>CELL_DRAG_THRESHOLD){
          // 長押し前に動いた → スワイプの可能性、ドラッグキャンセル
          cancelCellPress();
        }
        return;
      }
      // ★ 範囲選択中 or 判定前
      if(rangeSelect.startDs){
        onRangeMove(e);
        // 範囲選択アクティブ中はスクロール禁止
        if(rangeSelect.active)e.preventDefault();
        return;
      }
      // チップドラッグ中：カード追従
      if(drag.started){
        e.preventDefault();
        moveDragCard(e);
        return;
      }
      // チップ長押し前後：閾値判定
      if(drag.eventId){
        const t=e.touches[0];
        const dx=t.clientX-drag.startX,dy=t.clientY-drag.startY;
        if(drag.active&&Math.hypot(dx,dy)>DRAG_THRESHOLD){
          e.preventDefault();
          beginDrag(e);
        }else if(!drag.active&&Math.hypot(dx,dy)>DRAG_THRESHOLD){
          cancelChipPress();
        }
        return;
      }
      // 通常のセル長押しキャンセル
      clearTimeout(lpTimer);if(lpCell)lpCell.classList.remove('longpress-active');hideLpRing();
    },{passive:false});
    
    ng.addEventListener('touchend',e=>{
      // セルドラッグ完了処理
      if(cellDrag.started){
        cellDrag.suppressClickUntil=Date.now()+400;
        endCellDrag(e);return;
      }
      // セル長押し成立後タップ（動かなかった）→ 日付選択（モーダル開かない）
      if(cellDrag.active&&!cellDrag.started){
        const ds=cellDrag.sourceDs;
        cellDrag.suppressClickUntil=Date.now()+400;
        cancelCellPress();
        setTimeout(()=>onCellClick(ds),30);
        return;
      }
      // セル長押し前にタップ → click イベントが続けて発火し、そこで onCellClick が動く
      if(cellDrag.sourceDs&&!cellDrag.active){
        cancelCellPress();
      }
      
      // ★ 範囲選択終了
      if(rangeSelect.startDs){
        onRangeEnd();
        return;
      }
      
      // チップドラッグ完了処理
      if(drag.started){endDrag(e);return;}
      if(drag.active&&!drag.started){
        // 長押し成立後、動かさず指を離した → 編集モーダルを開く（従来通り）
        const evId=drag.eventId;
        cancelChipPress();
        drag.suppressClickUntil=Date.now()+400;
        setTimeout(()=>openModal(null,evId),50);
        return;
      }
      if(drag.eventId&&!drag.active){
        // 長押し前のタップ → セル選択は後続の click イベントに任せる
        cancelChipPress();
        // touchend を preventDefault しない限り click が発火するのでそのまま流す
      }
      onTouchEndCell();
    },{passive:false});
    
    ng.addEventListener('touchcancel',()=>{
      if(cellDrag.sourceDs)cancelCellPress();
      if(drag.eventId)cancelChipPress();
      if(rangeSelect.startDs)cancelRangePress();
      onTouchEndCell();
    },{passive:true});
  });
}

// ★ 長押し開始
function startChipPress(e,chipEl){
  drag.eventId=parseInt(chipEl.dataset.eventId);
  drag.origChipEl=chipEl;
  const t=e.touches[0];
  drag.startX=t.clientX;drag.startY=t.clientY;
  drag.active=false;drag.started=false;
  // 視覚フィードバック：長押しリングを表示
  showLpRing(e);
  drag.pressTimer=setTimeout(()=>{
    drag.active=true;
    hideLpRing();
    // バイブレーション風：チップが少しだけ膨らむ
    if(drag.origChipEl){
      drag.origChipEl.style.transform='scale(1.05)';
      drag.origChipEl.style.transition='transform .15s';
    }
  },DRAG_LP_MS);
}

function cancelChipPress(){
  clearTimeout(drag.pressTimer);
  hideLpRing();
  if(drag.origChipEl){
    drag.origChipEl.style.transform='';
    drag.origChipEl.classList.remove('placeholder');
  }
  if(drag.cardEl){drag.cardEl.style.display='none';}
  if(drag.currentDropTarget){drag.currentDropTarget.classList.remove('drop-target');}
  drag.eventId=null;drag.active=false;drag.started=false;
  drag.origChipEl=null;drag.currentDropTarget=null;
}

// ★ ドラッグ開始：浮遊カード表示 + 元チップをプレースホルダー化
function beginDrag(e){
  drag.started=true;
  const ev=EVENTS.find(x=>x.id===drag.eventId);
  if(!ev)return;
  
  // 元チップをプレースホルダー化
  if(drag.origChipEl){
    drag.origChipEl.style.transform='';
    drag.origChipEl.classList.add('placeholder');
  }
  
  // ★ フロートカードの中身を構築（予定カード全体のクローン）
  const cat=CATEGORIES.find(c=>c.key===ev.cat)||{};
  const endTxt=ev.date===ev.end?'':' 〜 '+ev.end.slice(5).replace('-','/');
  const cardEl=document.getElementById('drag-card');
  cardEl.innerHTML=`
    <div class="drag-card-inner">
      <div class="drag-card-stripe stripe-${ev.cat}"></div>
      <div class="drag-card-body">
        <div class="drag-card-name">${ev.name}</div>
        <div class="drag-card-meta">${ev.date.slice(5).replace('-','/')}${endTxt}</div>
        <span class="drag-card-badge badge-${ev.cat}">${cat.label||ev.cat}</span>
      </div>
    </div>`;
  cardEl.style.display='block';
  drag.cardEl=cardEl;
  moveDragCard(e);
  
  // ★ haptic-like: トースト表示
  showToast('ドラッグ中：別の日付にドロップしてください');
}

// ★ ドラッグ中：カードを指の位置に追従
function moveDragCard(e){
  const t=e.touches?e.touches[0]:e;
  const x=t.clientX,y=t.clientY;
  if(drag.cardEl){
    drag.cardEl.style.left=x+'px';
    drag.cardEl.style.top=(y-30)+'px'; // 指の少し上に表示
  }
  // ドロップターゲット検出
  drag.cardEl.style.display='none'; // 一瞬非表示にして下のセルを取得
  const elBelow=document.elementFromPoint(x,y);
  drag.cardEl.style.display='block';
  const cell=elBelow?elBelow.closest('.cal-cell'):null;
  
  if(drag.currentDropTarget&&drag.currentDropTarget!==cell){
    drag.currentDropTarget.classList.remove('drop-target');
    drag.currentDropTarget=null;
  }
  if(cell&&cell.dataset.ds&&cell!==drag.currentDropTarget){
    // 元日付と同じセルはターゲットにしない
    const ev=EVENTS.find(x=>x.id===drag.eventId);
    if(ev&&cell.dataset.ds!==ev.date){
      cell.classList.add('drop-target');
      drag.currentDropTarget=cell;
    }
  }
}

// ★ ドロップ処理
function endDrag(e){
  const ev=EVENTS.find(x=>x.id===drag.eventId);
  const target=drag.currentDropTarget;
  
  // フロートカードを非表示
  if(drag.cardEl){drag.cardEl.style.display='none';}
  if(target){target.classList.remove('drop-target');}
  
  if(ev&&target&&target.dataset.ds){
    // ★ 日付を更新（期間予定なら長さを維持）
    const newDate=target.dataset.ds;
    // ★ UTC日付ズレ修正: ローカル日付として生成
    const [_os1,_os2,_os3]=ev.date.split('-').map(Number);
    const [_oe1,_oe2,_oe3]=ev.end.split('-').map(Number);
    const [_ns1,_ns2,_ns3]=newDate.split('-').map(Number);
    const oldStart=new Date(_os1,_os2-1,_os3);
    const oldEnd=new Date(_oe1,_oe2-1,_oe3);
    const diffDays=Math.round((oldEnd-oldStart)/(1000*60*60*24));
    const newStart=new Date(_ns1,_ns2-1,_ns3);
    const newEndD=new Date(newStart);
    newEndD.setDate(newStart.getDate()+diffDays);
    ev.date=newDate;
    ev.end=dsFromDate(newEndD);
    newlyAddedDate=newDate;
    renderAllPanels();renderCalList();
    showToast(`「${ev.name}」を ${newDate.slice(5).replace('-','/')} に移動しました`);
  } else {
    // ドロップ先なし → 元に戻す
    renderAllPanels();
  }
  
  drag.eventId=null;drag.active=false;drag.started=false;
  drag.origChipEl=null;drag.cardEl=null;drag.currentDropTarget=null;
  drag.suppressClickUntil=Date.now()+400;
}

// ★★★ セル全体ドラッグ：その日の予定をまとめて移動 ★★★

// セル長押し開始
function startCellPress(e,ds,cellEl){
  cellDrag.sourceDs=ds;
  cellDrag.sourceCellEl=cellEl;
  const t=e.touches[0];
  cellDrag.startX=t.clientX;cellDrag.startY=t.clientY;
  cellDrag.active=false;cellDrag.started=false;
  // 視覚フィードバック：長押しリングを表示
  showLpRing(e);
  cellDrag.pressTimer=setTimeout(()=>{
    cellDrag.active=true;
    hideLpRing();
    // ★ セルが「持ち上がる」アニメーション
    if(cellDrag.sourceCellEl){
      cellDrag.sourceCellEl.classList.add('cell-lifting');
    }
    // ★ 軽い触覚フィードバック（対応端末のみ）
    if(navigator.vibrate)navigator.vibrate(15);
  },CELL_DRAG_LP_MS);
}

function cancelCellPress(){
  clearTimeout(cellDrag.pressTimer);
  hideLpRing();
  if(cellDrag.sourceCellEl){
    cellDrag.sourceCellEl.classList.remove('cell-lifting','cell-source-placeholder');
  }
  if(cellDrag.cardEl){cellDrag.cardEl.style.display='none';}
  if(cellDrag.currentDropTarget){cellDrag.currentDropTarget.classList.remove('drop-target');}
  cellDrag.sourceDs=null;cellDrag.sourceCellEl=null;
  cellDrag.active=false;cellDrag.started=false;
  cellDrag.cardEl=null;cellDrag.currentDropTarget=null;
}

// セルドラッグ実開始：フロートカード表示 + 元セルをプレースホルダー化
function beginCellDrag(e){
  cellDrag.started=true;
  const ds=cellDrag.sourceDs;
  // カテゴリフィルタ適用済みのイベントのみドラッグ対象
  const evs=applyCatFiltersToEvents(getEventsOnDate(ds));
  if(!evs.length){cancelCellPress();return;}
  
  // 元セルを「抜き取った」プレースホルダー表示に
  if(cellDrag.sourceCellEl){
    cellDrag.sourceCellEl.classList.remove('cell-lifting');
    cellDrag.sourceCellEl.classList.add('cell-source-placeholder');
  }
  
  // フロートカード構築（複数件をまとめて表示）
  // ★ UTC日付ズレ修正: ローカル日付として生成
  const [_bcy,_bcm,_bcd]=ds.split('-').map(Number);
  const d=new Date(_bcy,_bcm-1,_bcd);
  const dateLabel=`${d.getMonth()+1}月${d.getDate()}日`;
  const MAX_SHOW=3;
  const shown=evs.slice(0,MAX_SHOW);
  const moreCount=evs.length-MAX_SHOW;
  const rowsHtml=shown.map(ev=>{
    const cat=CATEGORIES.find(c=>c.key===ev.cat)||{};
    return`<div class="cell-drag-row"><div class="cell-drag-stripe stripe-${ev.cat}"></div><div class="cell-drag-name">${ev.name}</div></div>`;
  }).join('');
  const moreHtml=moreCount>0?`<div class="cell-drag-more">他 ${moreCount} 件</div>`:'';
  
  const cardEl=document.getElementById('cell-drag-card');
  cardEl.innerHTML=`
    <div class="cell-drag-header">
      <span class="cell-drag-date">${dateLabel}</span>
      <span class="cell-drag-count">${evs.length} 件</span>
    </div>
    <div class="cell-drag-list">${rowsHtml}${moreHtml}</div>`;
  cardEl.style.display='block';
  cellDrag.cardEl=cardEl;
  moveCellDragCard(e);
  
  showToast(`${evs.length}件の予定をまとめて移動：別の日付へドロップしてください`);
}

// セルドラッグ中：カードを指の位置に追従
function moveCellDragCard(e){
  const t=e.touches?e.touches[0]:e;
  const x=t.clientX,y=t.clientY;
  if(cellDrag.cardEl){
    cellDrag.cardEl.style.left=x+'px';
    cellDrag.cardEl.style.top=(y-40)+'px';
  }
  // ドロップターゲット検出
  cellDrag.cardEl.style.display='none';
  const elBelow=document.elementFromPoint(x,y);
  cellDrag.cardEl.style.display='block';
  const cell=elBelow?elBelow.closest('.cal-cell'):null;
  
  if(cellDrag.currentDropTarget&&cellDrag.currentDropTarget!==cell){
    cellDrag.currentDropTarget.classList.remove('drop-target');
    cellDrag.currentDropTarget=null;
  }
  if(cell&&cell.dataset.ds&&cell!==cellDrag.currentDropTarget){
    // 元日付と同じセルはターゲットにしない
    if(cell.dataset.ds!==cellDrag.sourceDs){
      cell.classList.add('drop-target');
      cellDrag.currentDropTarget=cell;
    }
  }
}

// セルドロップ処理：その日の全予定の日付を移動先に書き換え
function endCellDrag(e){
  const sourceDs=cellDrag.sourceDs;
  const target=cellDrag.currentDropTarget;
  
  // フロートカード非表示
  if(cellDrag.cardEl){cellDrag.cardEl.style.display='none';}
  if(target){target.classList.remove('drop-target');}
  if(cellDrag.sourceCellEl){cellDrag.sourceCellEl.classList.remove('cell-source-placeholder','cell-lifting');}
  
  if(sourceDs&&target&&target.dataset.ds&&target.dataset.ds!==sourceDs){
    const newDate=target.dataset.ds;
    // ★ その日「開始」の予定をすべて移動先に書き換え
    //   （期間予定の場合は、開始日が sourceDs と一致するもののみ移動。
    //    継続中（途中）の予定は対象外として、誤った巻き戻しを防ぐ）
    const targetEvents=EVENTS.filter(ev=>ev.date===sourceDs);
    if(targetEvents.length===0){
      // 念のためフォールバック
      renderAllPanels();
      cellDrag.sourceDs=null;cellDrag.sourceCellEl=null;
      cellDrag.active=false;cellDrag.started=false;
      cellDrag.cardEl=null;cellDrag.currentDropTarget=null;
      return;
    }
    const [_nd1,_nd2,_nd3]=newDate.split('-').map(Number);
    const newStart=new Date(_nd1,_nd2-1,_nd3);
    targetEvents.forEach(ev=>{
      const [_es1,_es2,_es3]=ev.date.split('-').map(Number);
      const [_ee1,_ee2,_ee3]=ev.end.split('-').map(Number);
      const oldStart=new Date(_es1,_es2-1,_es3);
      const oldEnd=new Date(_ee1,_ee2-1,_ee3);
      const diffDays=Math.round((oldEnd-oldStart)/(1000*60*60*24));
      const newEndD=new Date(newStart);
      newEndD.setDate(newStart.getDate()+diffDays);
      ev.date=newDate;
      ev.end=dsFromDate(newEndD);
    });
    newlyAddedDate=newDate;
    selectedDate=newDate;
    renderAllPanels();renderCalList();
    if(navigator.vibrate)navigator.vibrate([10,40,10]);
    const label=`${newDate.slice(5).replace('-','/')}`;
    showToast(`${targetEvents.length}件の予定を ${label} に移動しました`);
  } else {
    // ドロップ先なし or 同じ日付 → 元に戻す
    renderAllPanels();
  }
  
  cellDrag.sourceDs=null;cellDrag.sourceCellEl=null;
  cellDrag.active=false;cellDrag.started=false;
  cellDrag.cardEl=null;cellDrag.currentDropTarget=null;
}

function initSwipe(){
  const w=document.getElementById('cal-swipe-wrap');
  w.addEventListener('touchstart',e=>{
    if(viewMode!=='month')return;
    if(drag.started||cellDrag.started)return;
    // ★ 長押し確定後（active）のみブロック。長押し判定待ち(startDs のみ)はスワイプ開始を許可
    if(rangeSelect.active)return;
    swipeX=e.touches[0].clientX;swipeY=e.touches[0].clientY;swiping=true;swipeLocked=false;
  },{passive:true});
  w.addEventListener('touchmove',e=>{
    if(viewMode!=='month')return;
    // ★ 長押し確定（active）中のみ月スワイプを停止。判定待ち中は通常スワイプ継続
    if(rangeSelect.active){swiping=false;swipeLocked=false;return;}
    if(drag.eventId||drag.started||cellDrag.active||cellDrag.started)return;
    if(!swiping)return;const dx=e.touches[0].clientX-swipeX,dy=e.touches[0].clientY-swipeY;
    if(!swipeLocked&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>10){swiping=false;return;}
    if(Math.abs(dx)>8){
      swipeLocked=true;
      if(cellDrag.sourceDs&&!cellDrag.active)cancelCellPress();
    }
  },{passive:true});
  w.addEventListener('touchend',e=>{
    if(viewMode!=='month')return;
    // ★ 長押し確定（active）中のみ月切り替えをキャンセル
    if(rangeSelect.active){swiping=false;swipeLocked=false;return;}
    if(drag.eventId||drag.started||cellDrag.active||cellDrag.started){swipeLocked=false;swiping=false;return;}
    if(!swiping){swipeLocked=false;return;}
    const dx=e.changedTouches[0].clientX-swipeX,dy=e.changedTouches[0].clientY-swipeY;
    swiping=false;if(Math.abs(dy)>Math.abs(dx)){swipeLocked=false;return;}
    if(Math.abs(dx)>=SW&&!animateSwipe._busy){dx<0?animateSwipe(1):animateSwipe(-1);}swipeLocked=false;
  },{passive:true});
}

function animateSwipe(dir){
  if(animateSwipe._busy)return; // アニメーション中は多重実行防止
  animateSwipe._busy=true;
  const sc=document.getElementById('cal-slide-container');
  sc.classList.add('animating');
  sc.style.transform=dir===1?'translateX(-66.666%)':'translateX(0%)';
  sc.addEventListener('transitionend',()=>{
    sc.classList.remove('animating');
    sc.style.transform='translateX(-33.333%)';
    changeMonthInternal(dir);
    animateSwipe._busy=false; // 完了後に解除
  },{once:true});
  // フォールバック：transitionend が発火しない場合のタイムアウト
  setTimeout(()=>{ animateSwipe._busy=false; },600);
}
function changeMonthInternal(dir){month+=dir;if(month>11){month=0;year++;}if(month<0){month=11;year--;}selectedDate=null;newlyAddedDate=null;updateMonthLabel();renderAllPanels();renderCalList();}
function changeMonth(dir){animateSwipe(dir);}
function updateMonthLabel(){document.getElementById('month-label').textContent=`${year}年 ${month+1}月`;}
function onCellClick(ds){const now=Date.now();if(ds===calLastClick.ds&&now-calLastClick.t<DC){calLastClick={t:0,ds:''};console.log('[onCellClick→openCreateModal] tappedDate=',ds);openCreateModal(ds);return;}calLastClick={t:now,ds};selectedDate=selectedDate===ds?null:ds;newlyAddedDate=null;renderAllPanels();renderCalList();}
function onTouchStartCell(e,ds,cellEl){lpCell=cellEl;cellEl.classList.add('longpress-active');showLpRing(e);lpTimer=setTimeout(()=>{cellEl.classList.remove('longpress-active');hideLpRing();console.log('[longpress→openCreateModal] tappedDate=',ds);openCreateModal(ds);},LP);}
function onTouchEndCell(){clearTimeout(lpTimer);if(lpCell)lpCell.classList.remove('longpress-active');hideLpRing();lpTimer=null;lpCell=null;}

// ================================================================
// ★★★ 複数日ドラッグ範囲選択 ★★★
// 長押し → そのまま別セルへスライド → 指を離す → 期間モーダル
// ================================================================
const rangeSelect={
  active:false,      // 範囲選択モード中
  startDs:null,      // 選択開始日
  endDs:null,        // 選択終了日（ドラッグ中リアルタイム更新）
  pressTimer:null,   // 長押し判定タイマー
  startX:0,startY:0,
  moved:false,       // 長押し後に指が動いたか
};
const RANGE_LP_MS=420; // 範囲選択トリガーの長押し時間
const RANGE_THRESHOLD=8; // 範囲選択開始の移動閾値(px)

// 日付文字列の大小比較
function dsCompare(a,b){return a<b?-1:a>b?1:0;}
// 2つの日付間の範囲を配列で返す（順不同OK）
function dsRange(a,b){
  const [s,e]=dsCompare(a,b)<=0?[a,b]:[b,a];
  const result=[];
  const [sy,sm,sd]=s.split('-').map(Number);
  const [ey,em,ed]=e.split('-').map(Number);
  const cur=new Date(sy,sm-1,sd);
  const end=new Date(ey,em-1,ed);
  while(cur<=end){
    result.push(dsFromDate(cur));
    cur.setDate(cur.getDate()+1);
  }
  return result;
}
// 日付文字列を「M/D」形式に
function dsToShort(ds){
  if(!ds)return'';
  const[,m,d]=ds.split('-');
  return`${parseInt(m)}/${parseInt(d)}`;
}

// 範囲ハイライトをDOMに反映
function _applyRangeHighlight(){
  // まず全セルのrange系クラスをクリア
  document.querySelectorAll('.cal-cell.range-edge,.cal-cell.range-mid').forEach(el=>{
    el.classList.remove('range-edge','range-mid');
  });
  if(!rangeSelect.active||!rangeSelect.startDs||!rangeSelect.endDs)return;
  const s=rangeSelect.startDs,e=rangeSelect.endDs;
  const [realS,realE]=dsCompare(s,e)<=0?[s,e]:[e,s];
  const range=dsRange(realS,realE);
  range.forEach((ds,i)=>{
    const cell=document.querySelector(`.cal-cell[data-ds="${ds}"]`);
    if(!cell)return;
    if(ds===realS||ds===realE){
      cell.classList.add('range-edge');
    }else{
      cell.classList.add('range-mid');
    }
  });
  // バナー更新
  _updateRangeBanner();
}

// フローティングバナー（「5/10〜5/12」）
function _updateRangeBanner(){
  const banner=document.getElementById('range-banner');
  if(!banner)return;
  if(!rangeSelect.active){banner.classList.remove('show');return;}
  const s=rangeSelect.startDs,e=rangeSelect.endDs;
  if(!s){banner.classList.remove('show');return;}
  const [realS,realE]=dsCompare(s,e||s)<=0?[s,e||s]:[e||s,s];
  const days=dsRange(realS,realE).length;
  const sameDay=realS===realE;
  banner.textContent=sameDay
    ?`📅 ${dsToShort(realS)}`
    :`📅 ${dsToShort(realS)} 〜 ${dsToShort(realE)}（${days}日間）`;
  banner.classList.add('show');
}

// ★★★ _cellFromPoint：バーを透過してセルを確実に取得するヘルパー ★★★
// Safari PWA では pointer-events:none のバーも elementFromPoint で返ることがある。
// バーを一時的に visibility:hidden にして elementFromPoint し直すことで確実にセルを取得。
function _cellFromPoint(x,y){
  const el=document.elementFromPoint(x,y);
  if(!el)return null;
  // バー・レイヤーでなければそのまま closest で返す
  if(!el.closest('.cal-multiday-bar')&&!el.closest('.cal-multiday-layer')){
    return el.closest('.cal-cell')||null;
  }
  // バーが返ってきた場合：バーを一時的に隠して再取得
  const bars=document.querySelectorAll('.cal-multiday-bar');
  const layer=document.querySelectorAll('.cal-multiday-layer');
  bars.forEach(b=>b.style.visibility='hidden');
  layer.forEach(l=>l.style.pointerEvents='none');
  const elBelow=document.elementFromPoint(x,y);
  bars.forEach(b=>b.style.visibility='');
  layer.forEach(l=>l.style.pointerEvents='');
  return elBelow?elBelow.closest('.cal-cell')||null:null;
}

// 範囲選択：長押し開始（予定なしセルのみ）
function startRangePress(e,ds,cellEl){
  rangeSelect.startDs=ds;
  rangeSelect.endDs=ds;
  rangeSelect.moved=false;
  const t=e.touches[0];
  rangeSelect.startX=t.clientX;
  rangeSelect.startY=t.clientY;
  // ★ 長押し判定中はスワイプ state をそのまま維持。
  //    active=true になった時点（タイマー発火後）に initSwipe 側でブロックする。
  // 長押しリング表示
  cellEl.classList.add('longpress-active');
  showLpRing(e);
  rangeSelect.pressTimer=setTimeout(()=>{
    rangeSelect.active=true;
    cellEl.classList.remove('longpress-active');
    hideLpRing();
    _applyRangeHighlight();
    if(navigator.vibrate)navigator.vibrate([12,40,12]);
    cellEl.classList.add('range-start-pulse');
    setTimeout(()=>cellEl.classList.remove('range-start-pulse'),600);
    _updateRangeBanner();
  },RANGE_LP_MS);
}

// 範囲選択キャンセル
function cancelRangePress(){
  clearTimeout(rangeSelect.pressTimer);
  hideLpRing();
  document.querySelectorAll('.cal-cell.longpress-active').forEach(el=>el.classList.remove('longpress-active'));
  document.querySelectorAll('.cal-cell.range-edge,.cal-cell.range-mid').forEach(el=>{
    el.classList.remove('range-edge','range-mid');
  });
  const banner=document.getElementById('range-banner');
  if(banner)banner.classList.remove('show');
  rangeSelect.active=false;
  rangeSelect.startDs=null;
  rangeSelect.endDs=null;
  rangeSelect.moved=false;
}

// 範囲選択：touchmove
function onRangeMove(e){
  // ★ 長押し確定（active）中のみスワイプを封鎖。判定待ち中は封鎖しない
  if(rangeSelect.active){swiping=false;swipeLocked=false;}
  if(!rangeSelect.active&&rangeSelect.startDs){
    // 長押し判定前に大きく動いたらキャンセル → 通常スワイプへ引き継ぐ（swiping は触らない）
    const t=e.touches[0];
    const dx=t.clientX-rangeSelect.startX,dy=t.clientY-rangeSelect.startY;
    if(Math.hypot(dx,dy)>RANGE_THRESHOLD){
      cancelRangePress();
    }
    return;
  }
  if(!rangeSelect.active)return;
  e.preventDefault();
  const t=e.touches[0];
  // ★ _cellFromPoint を使いバーを透過してセルを取得（1行目でも確実に動作）
  const cell=_cellFromPoint(t.clientX,t.clientY);
  if(cell&&cell.dataset.ds){
    const newEnd=cell.dataset.ds;
    if(newEnd!==rangeSelect.endDs){
      rangeSelect.endDs=newEnd;
      rangeSelect.moved=true;
      _applyRangeHighlight();
    }
  }
}

// 範囲選択：touchend → モーダルを開く
function onRangeEnd(){
  if(!rangeSelect.active){
    cancelRangePress();
    return;
  }
  const s=rangeSelect.startDs;
  const e=rangeSelect.endDs||s;
  const [realS,realE]=dsCompare(s,e)<=0?[s,e]:[e,s];
  // ハイライトを一瞬残してからクリア
  setTimeout(()=>{
    document.querySelectorAll('.cal-cell.range-edge,.cal-cell.range-mid').forEach(el=>{
      el.classList.remove('range-edge','range-mid');
    });
  },300);
  const banner=document.getElementById('range-banner');
  if(banner)banner.classList.remove('show');
  rangeSelect.active=false;
  rangeSelect.startDs=null;
  rangeSelect.endDs=null;
  rangeSelect.moved=false;
  // モーダルを範囲プリセットで開く
  _openModalWithRange(realS,realE);
}

// 範囲を input-start / input-end にセットしてモーダルを開く
function _openModalWithRange(startDs,endDs){
  if(!_currentUser){
    showToast('ログインが必要です');
    document.getElementById('auth-screen')?.classList.remove('hidden');
    return;
  }
  selectedDate=startDs;
  modalPresetDate=startDs;
  // _rangeEndPreset をフック側で参照させる
  window._rangeEndPreset=endDs;
  openModal(startDs);
}
function showLpRing(e){const ring=document.getElementById('lp-ring');const rect=document.querySelector('.phone-inner').getBoundingClientRect();const t=e.touches?e.touches[0]:e,x=t.clientX-rect.left,y=t.clientY-rect.top,s=44;ring.style.cssText=`width:${s}px;height:${s}px;left:${x-s/2}px;top:${y-s/2}px;`;ring.classList.remove('animating');void ring.offsetWidth;ring.classList.add('animating');}
function hideLpRing(){document.getElementById('lp-ring').classList.remove('animating');}
function renderCalList(){
  // ★ カテゴリ凡例は常に「表示中の月の予定」を集計（日付選択中でも月単位表示）
  renderCatLegend();
  const lbl=document.getElementById('cal-section-label');let events,isNew=false;
  if(selectedDate){events=getEventsOnDate(selectedDate);const [_sy,_sm,_sd]=selectedDate.split('-').map(Number);const d=new Date(_sy,_sm-1,_sd);lbl.textContent=`${d.getMonth()+1}月${d.getDate()}日の予定`;isNew=selectedDate===newlyAddedDate;}
  else{events=getEventsInMonth(year,month);lbl.textContent=`${month+1}月の試合・予定`;}
  // ★ カテゴリフィルタ＋表示ON/OFF適用
  events=applyCatFiltersToEvents(events);
  if(calCatFilter){
    const catLbl=(CATEGORIES.find(c=>c.key===calCatFilter)||{}).label||calCatFilter;
    lbl.textContent=lbl.textContent+`（${catLbl}のみ）`;
  }
  if(!events.length){
    let msg;
    if(userEnabledCategories.length===0&&!calCatFilter){
      msg='<span style="cursor:pointer;color:var(--green-dark);font-weight:600;" onclick="openAddCatSheet()">＋ カテゴリを追加してください</span>';
    } else if(calCatFilter){
      msg='このカテゴリの予定はありません。';
    } else {
      msg='予定がありません。日付をダブルタップ / 長押しで追加できます。';
    }
    document.getElementById('cal-event-list').innerHTML=`<div class="no-events">${msg}</div>`;
    return;
  }
  const lastId=newlyAddedDate?Math.max(...EVENTS.filter(e=>e.date===newlyAddedDate).map(e=>e.id)):-1;
  document.getElementById('cal-event-list').innerHTML=events.map(e=>{
    const cat=CATEGORIES.find(c=>c.key===e.cat)||{};const endTxt=e.date===e.end?'':` 〜 ${e.end.slice(5).replace('-','/')}`;const hl=isNew&&e.id===lastId?' new-highlight':'';
    const memoHtml=e.memo?`<div class="event-memo" title="${escapeHtml(e.memo)}">${escapeHtml(firstLine(e.memo))}</div>`:'';
    const dl=deadlineState(e);
    const dim=e.entryStatus==='entered'?' deadline-event-dim':'';
    const dlInline=dl?` <span class="deadline-badge ${dl.cls}" style="margin-left:6px;">${dl.label}</span>`:'';
    const notifBtn=dl&&dl.cls!=='past'?`<button class="notif-mini-btn" onclick="event.stopPropagation();openNotifSettings(${e.id})">🔔 通知</button>`:'';
    return`<div class="event-card${hl}${dim}" onclick="openModal(null,${e.id})"><div class="event-card-inner"><div class="event-stripe stripe-${e.cat}"></div><div class="event-content">
      <div class="event-top"><div class="event-name">${e.name}</div><div class="event-actions"><span class="event-edit-hint">✎ 編集</span><button class="event-del-btn" onclick="event.stopPropagation();deleteEvent(${e.id})">削除</button></div></div>
      <div class="event-meta">${e.date.slice(5).replace('-','/')}${endTxt}${e.place?' | '+e.place:''}</div>
      ${memoHtml}
      <div class="badge-row"><span class="badge badge-${e.cat}">${cat.label||e.cat}</span>${dlInline}${notifBtn?' '+notifBtn:''}</div>
    </div></div></div>`;
  }).join('');
}
// ★★★ カテゴリ凡例：予定があるカテゴリのみ「●  カテゴリ名」で横一列表示 ＋ タップでフィルタ ★★★
function renderCatLegend(){
  const el=document.getElementById('cat-legend');
  if(!el)return;
  // 表示中の月の予定（フィルタを切り替えた時に項目が消えないよう、フィルタ前のデータで判定）
  const monthEvents=getEventsInMonth(year,month);
  // 表示ONのカテゴリかつその月に予定があるものだけ
  const presentCats=new Set(monthEvents.filter(e=>isCatVisible(e.cat)).map(e=>e.cat));
  const items=CATEGORIES.filter(c=>presentCats.has(c.key));
  // ★ 月切替などで選択中カテゴリが当該月に存在しない場合は自動解除（フィルタ解除導線を確保）
  if(calCatFilter&&!presentCats.has(calCatFilter)){calCatFilter=null;}
  // フィルタ適用中ならクラス付与（非選択を薄表示）
  el.classList.toggle('has-filter',!!calCatFilter);
  if(userEnabledCategories.length===0){
    el.innerHTML='<span class="cat-legend-empty" style="cursor:pointer;" onclick="openAddCatSheet()">＋ カテゴリを追加してください</span>';
    return;
  }
  if(items.length===0){
    el.innerHTML='<span class="cat-legend-empty">この月の予定はありません</span>';
    return;
  }
  el.innerHTML=items.map(c=>{
    const isActive=calCatFilter===c.key;
    return`<span class="cat-legend-item${isActive?' active':''}" data-cat="${c.key}"><span class="cat-legend-dot" style="background:${c.color}"></span>${c.label}</span>`;
  }).join('');
}
// ★ カテゴリフィルタの適用（同じカテゴリ再タップで解除）
function setCatFilter(key){
  if(calCatFilter===key){calCatFilter=null;}
  else{calCatFilter=key;}
  renderAllPanels();
  renderCalList();
}
// ★ 凡例クリック処理（イベント委譲）
function initCatLegend(){
  const el=document.getElementById('cat-legend');
  if(!el)return;
  el.addEventListener('click',e=>{
    const item=e.target.closest('[data-cat]');
    if(!item)return;
    setCatFilter(item.dataset.cat);
  });
}
// ★ メモの1行目を取得（先頭の空行はスキップ）
function firstLine(s){if(!s)return'';const lines=s.split(/\r?\n/);for(const l of lines){const t=l.trim();if(t)return t;}return'';}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function deleteEvent(id){const ev=EVENTS.find(e=>e.id===id);if(ev){const arr=DB[ev.cat]||[];const idx=arr.findIndex(t=>t.name===ev.name);if(idx>=0)addedIds.delete(`${ev.cat}-${idx}`);}EVENTS=EVENTS.filter(e=>e.id!==id);newlyAddedDate=null;renderAllPanels();renderCalList();showToast('予定を削除しました');}
// ===== フィルターボトムシート =====
function openFilterSheet(){
  _fbsDraftCats=new Set(fbsCats);
  _fbsDraftAreas=new Set(fbsAreas);
  _fbsDraftPrefs=new Set(fbsPrefs);
  _fbsExpandedArea=null;
  _renderFbsSheet();
  document.getElementById('fbs-overlay').classList.add('show');
}
function closeFilterSheet(){
  document.getElementById('fbs-overlay').classList.remove('show');
}
function resetFilterSheet(){
  _fbsDraftCats.clear();
  _fbsDraftAreas.clear();
  _fbsDraftPrefs.clear();
  _fbsExpandedArea=null;
  _renderFbsSheet();
}
function applyFilterSheet(){
  fbsCats=new Set(_fbsDraftCats);
  fbsAreas=new Set(_fbsDraftAreas);
  fbsPrefs=new Set(_fbsDraftPrefs);
  closeFilterSheet();
  _fbsSyncToTokens();
  _invalidateSearchCache();
  applySearchFilters();
  _updateFbsOpenBtn();
  _sqRenderFilterBar();
  _sqUpdateIconState();
}

// エリアチップをタップ：展開トグル＋エリア選択
function _fbsToggleArea(areaKey){
  // 展開/折り畳み
  if(_fbsExpandedArea===areaKey){
    _fbsExpandedArea=null;
  } else {
    _fbsExpandedArea=areaKey;
  }
  // エリア全体の選択トグル
  if(_fbsDraftAreas.has(areaKey)){
    _fbsDraftAreas.delete(areaKey);
    // このエリアの都道府県もすべて解除
    (PREF_BY_AREA[areaKey]||[]).forEach(p=>_fbsDraftPrefs.delete(p.key));
  } else {
    _fbsDraftAreas.add(areaKey);
    // 都道府県個別は解除しない（追加絞り込みとして残す）
  }
  _renderFbsSheet();
}
// 都道府県チップをタップ
function _fbsTogglePref(prefKey,areaKey){
  if(_fbsDraftPrefs.has(prefKey)){
    _fbsDraftPrefs.delete(prefKey);
    // 都道府県が全解除になったらエリアも解除
    const remain=(PREF_BY_AREA[areaKey]||[]).some(p=>_fbsDraftPrefs.has(p.key));
    if(!remain) _fbsDraftAreas.delete(areaKey);
  } else {
    _fbsDraftPrefs.add(prefKey);
    _fbsDraftAreas.add(areaKey); // 都道府県選択時は親エリアも選択
  }
  _renderFbsSheet();
}
// カテゴリチップをタップ
function _fbsToggleCat(catKey){
  if(_fbsDraftCats.has(catKey))_fbsDraftCats.delete(catKey);
  else _fbsDraftCats.add(catKey);
  _renderFbsSheet();
}

function _renderFbsSheet(){
  const body=document.getElementById('fbs-scroll-body');
  if(!body)return;
  // 有効カテゴリのみ絞り込み（オプトイン型）
  const CAT_SHEET_ALL=[
    {key:'jgto',label:'JGTO 男子'},{key:'jlpga',label:'JLPGA 女子'},
    {key:'pga',label:'PGA TOUR'},{key:'qualifier',label:'予選会'},
    {key:'mini',label:'ミニツアー'},{key:'open',label:'オープン大会'},
    {key:'added',label:'✓ 登録済み'},
  ];
  const CAT_SHEET=CAT_SHEET_ALL.filter(c=>c.key==='added'||userEnabledCategories.includes(c.key));
  // ── カテゴリセクション ──
  const catHtml=`
    <div>
      <div class="fbs-section-label">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="1" y="1" width="4" height="4" rx="1" fill="currentColor"/><rect x="6" y="1" width="4" height="4" rx="1" fill="currentColor"/><rect x="1" y="6" width="4" height="4" rx="1" fill="currentColor"/><rect x="6" y="6" width="4" height="4" rx="1" fill="currentColor"/></svg>
        カテゴリ
      </div>
      <div class="fbs-chips">${CAT_SHEET.map(c=>`
        <button class="fbs-chip${_fbsDraftCats.has(c.key)?' active':''}" data-cat="${c.key}"
          onclick="_fbsToggleCat('${c.key}')">${c.label}</button>`).join('')}
      </div>
    </div>`;
  // ── エリア＋都道府県セクション ──
  const areaGroupHtml=AREA_FILTERS.map(a=>{
    const prefs=PREF_BY_AREA[a.key]||[];
    const isExpanded=_fbsExpandedArea===a.key;
    const isActive=_fbsDraftAreas.has(a.key);
    // 選択中の都道府県数バッジ
    const selPrefs=prefs.filter(p=>_fbsDraftPrefs.has(p.key));
    const badge=selPrefs.length>0?`<span style="font-size:9px;font-weight:800;background:var(--green-main);color:#fff;border-radius:8px;padding:1px 5px;margin-left:2px;">${selPrefs.length}</span>`:'';
    // 都道府県パネル
    const prefPanel=prefs.length>0?`
      <div class="fbs-pref-panel${isExpanded?' open':''}" id="fbs-pref-${a.key}">
        <div class="fbs-pref-inner">${prefs.map(p=>`
          <button class="fbs-chip-pref${_fbsDraftPrefs.has(p.key)?' active':''}"
            onclick="event.stopPropagation();_fbsTogglePref('${p.key}','${a.key}')">${p.label}</button>`).join('')}
        </div>
      </div>`:'';
    return`
      <div class="fbs-area-group">
        <div class="fbs-area-row">
          <button class="fbs-chip-area${isActive?' active':''}${isExpanded?' expanded':''}" data-area="${a.key}"
            onclick="_fbsToggleArea('${a.key}')">
            <span>${a.icon} ${a.label}</span>${badge}
            ${prefs.length>0?`<span class="fbs-caret">▾</span>`:''}
          </button>
        </div>
        ${prefPanel}
      </div>`;
  }).join('');
  const areaHtml=`
    <div>
      <div class="fbs-section-label">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1.5C3.567 1.5 2 3.067 2 5c0 2.5 3.5 5 3.5 5S9 7.5 9 5c0-1.933-1.567-3.5-3.5-3.5Z" stroke="currentColor" stroke-width="1.2" fill="none"/><circle cx="5.5" cy="5" r="1" fill="currentColor"/></svg>
        エリア・都道府県
        <span style="font-size:9px;color:var(--text-tertiary);font-weight:400;margin-left:3px;">タップで都道府県を展開</span>
      </div>
      <div class="fbs-area-groups">${areaGroupHtml}</div>
    </div>`;
  body.innerHTML=catHtml+areaHtml;
  // ★ NEW: フィルター保存セクション
  const savedHtml=`
    <div class="fbs-save-section">
      <div class="fbs-save-section-label">💾 フィルターを保存</div>
      ${savedFilters.length>0?`<div class="fbs-saved-list">
        ${savedFilters.map((sf,i)=>`
          <span class="fbs-saved-chip" onclick="_applySavedFilter(${i})">
            ${escapeHtml(sf.name)}
            <button class="fbs-saved-chip-del" onclick="event.stopPropagation();_deleteSavedFilter(${i})">×</button>
          </span>`).join('')}
      </div>`:''}
      <div class="fbs-save-row">
        <input class="fbs-save-name-input" id="fbs-save-name" placeholder="保存名（例：関東ミニツアー）" maxlength="20">
        <button class="fbs-save-btn" onclick="_saveCurrentFilter()">保存</button>
      </div>
    </div>`;
  body.innerHTML=catHtml+areaHtml+savedHtml;
  _updateFbsResetBtn();
}
function _updateFbsResetBtn(){
  const btn=document.getElementById('fbs-reset-btn');
  if(!btn)return;
  const total=_fbsDraftCats.size+_fbsDraftAreas.size+_fbsDraftPrefs.size;
  btn.classList.toggle('enabled',total>0);
  btn.textContent=total>0?`リセット（${total}件）`:'リセット';
}
function _updateFbsOpenBtn(){
  const btn=document.getElementById('fbs-open-btn');
  const badge=document.getElementById('fbs-badge');
  if(!btn||!badge)return;
  const total=fbsCats.size+fbsAreas.size+fbsPrefs.size;
  btn.classList.toggle('has-active',total>0);
  badge.textContent=total;
}

function renderSearchFilters(){
  const hasFbs=fbsCats.size>0||fbsAreas.size>0||fbsPrefs.size>0;
  const grid=document.getElementById('filter-grid');
  if(!grid)return;

  // アクティブフィルタがある場合はバナー表示（FBSボトムシートから）
  if(hasFbs){
    const CAT_L={jgto:'JGTO',jlpga:'JLPGA',pga:'PGA',qualifier:'予選会',mini:'ミニツアー',open:'オープン',added:'登録済み'};
    const AREA_L={kanto:'関東',kansai:'関西',chubu:'中部',kyushu:'九州・沖縄',hokkaido:'北海道・東北',overseas:'海外'};
    const PREF_L=Object.values(PREF_BY_AREA).flat().reduce((m,p)=>(m[p.key]=p.label,m),{});
    const tags=[];
    [...fbsCats].forEach(k=>tags.push({label:CAT_L[k]||k,type:'cat'}));
    if(fbsPrefs.size>0){
      [...fbsPrefs].forEach(k=>tags.push({label:'📍'+PREF_L[k],type:'pref'}));
    } else {
      [...fbsAreas].forEach(k=>tags.push({label:'📍'+AREA_L[k],type:'area'}));
    }
    const tagHtml=tags.map(t=>`<span class="fbs-active-tag">${t.label}</span>`).join('');
    grid.innerHTML=`<div style="padding:8px 16px;"><div class="fbs-active-banner">
      ${tagHtml}
      <button class="fbs-active-clear" onclick="_sqClearAll()">✕ 解除</button>
    </div></div>`;
    return;
  }

  // ★ 階層型カテゴリーUIレンダリング
  // 1段目: グループチップ（国内ツアー / ミニツアー / オープン大会）
  // 2段目: そのグループ内のツアーチップ（グループ未選択時は全ツアー横並び）
  const regionDef = tournamentCategories[_searchGender]?.[_searchRegion];
  if(!regionDef){
    grid.innerHTML = '';
    return;
  }
  const groups = Object.entries(regionDef.groups||{});

  // ── グループチップ行 ──
  const groupHtml = groups.map(([gk, gd]) => {
    const isActive = _searchGroupKey === gk;
    const activeStyle = isActive ? `background:${gd.color}18;color:${gd.color};border-color:${gd.color}60;` : '';
    return `<button class="filter-chip hcat-group-chip${isActive?' active':''}" data-groupkey="${gk}"
      style="${activeStyle}"
      onclick="_setGroupFilter('${gk}',this)">${gd.label}</button>`;
  }).join('');

  // ── ツアーチップ行 ──
  // グループ選択時: そのグループのツアーのみ  未選択時: 全グループのツアーをすべて
  let tourChips = [];
  tourChips.push(`<button class="filter-chip${searchFilter==='all'?' active':''}" data-key="all"
    onclick="_setTourCatFilter('all',this)">すべて</button>`);

  if(_searchGroupKey){
    const gd = regionDef.groups[_searchGroupKey];
    if(gd) Object.entries(gd.tours||{}).forEach(([tk,td])=>{
      const isActive = searchFilter === tk;
      const activeStyle = isActive ? `background:${td.color}18;color:${td.color};border-color:${td.color}60;` : '';
      tourChips.push(`<button class="filter-chip${isActive?' active':''}" data-key="${tk}"
        style="${activeStyle}"
        onclick="_setTourCatFilter('${tk}',this)">${td.label}</button>`);
    });
  } else {
    groups.forEach(([gk, gd])=>{
      Object.entries(gd.tours||{}).forEach(([tk,td])=>{
        const isActive = searchFilter === tk;
        const activeStyle = isActive ? `background:${td.color}18;color:${td.color};border-color:${td.color}60;` : '';
        tourChips.push(`<button class="filter-chip${isActive?' active':''}" data-key="${tk}"
          style="${activeStyle}"
          onclick="_setTourCatFilter('${tk}',this)">${td.label}</button>`);
      });
    });
  }

  tourChips.push(`<button class="filter-chip${searchFilter==='added'?' active':''}" data-key="added"
    onclick="_setTourCatFilter('added',this)">✓ 登録済み</button>`);

  // ── セレクトUIで現在選択グループ・ツアーのラベル/カラーを取得 ──
  let selGroupDef  = _searchGroupKey ? regionDef.groups[_searchGroupKey] : null;
  let selTourKey   = (searchFilter && searchFilter !== 'all' && searchFilter !== 'added') ? searchFilter : null;
  let selTourDef   = null;
  if(selTourKey){
    // どのグループにあるか探す
    for(const [,gd] of groups){
      if(gd.tours && gd.tours[selTourKey]){ selTourDef = gd.tours[selTourKey]; break; }
    }
  }

  // ── セレクトボタンのラベル計算 ──
  let selectDotColor = selGroupDef ? selGroupDef.color : (selTourDef ? selTourDef.color : '#aaa');
  let selectMainLabel, selectSubLabel;
  if(searchFilter === 'added'){
    selectDotColor = 'var(--green-main)';
    selectMainLabel = '✓ 登録済み';
    selectSubLabel  = '';
  } else if(selTourDef){
    selectMainLabel = selTourDef.label;
    selectSubLabel  = selGroupDef ? selGroupDef.label : '';
  } else if(selGroupDef){
    selectMainLabel = selGroupDef.label + ' — すべて';
    selectSubLabel  = '';
  } else {
    selectMainLabel = 'すべて';
    selectSubLabel  = '';
  }

  // ── ドロップダウン行生成 ──
  let ddItems = [];
  // 「すべて」行
  ddItems.push(`<button class="hcat-dropdown-item${searchFilter==='all' && !_searchGroupKey?' is-selected':''}" onclick="_hcatSelectTour('all',null,this)">
    <span class="hcat-dd-dot" style="background:#aaa;opacity:.4;"></span>
    <span class="hcat-dd-text"><span class="hcat-dd-label">すべて</span></span>
    <span class="hcat-dd-check"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.5L5.5 10.5L11.5 4" stroke="var(--green-main)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
  </button>`);

  // グループ別ツアー行
  const targetGroups = _searchGroupKey
    ? groups.filter(([gk])=> gk === _searchGroupKey)
    : groups;

  targetGroups.forEach(([gk, gd], gi) => {
    if(gi > 0) ddItems.push(`<div class="hcat-dd-divider"></div>`);
    Object.entries(gd.tours||{}).forEach(([tk,td]) => {
      const isSel = searchFilter === tk;
      ddItems.push(`<button class="hcat-dropdown-item${isSel?' is-selected':''}" onclick="_hcatSelectTour('${tk}','${gk}',this)">
        <span class="hcat-dd-dot" style="background:${td.color};"></span>
        <span class="hcat-dd-text">
          <span class="hcat-dd-label">${td.label}</span>
          <span class="hcat-dd-desc">${gd.label}</span>
        </span>
        <span class="hcat-dd-check"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.5L5.5 10.5L11.5 4" stroke="var(--green-main)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      </button>`);
    });
  });

  // 「登録済み」行
  ddItems.push(`<div class="hcat-dd-divider"></div>`);
  ddItems.push(`<button class="hcat-dropdown-item${searchFilter==='added'?' is-selected':''}" onclick="_hcatSelectTour('added',null,this)">
    <span class="hcat-dd-dot" style="background:var(--green-main);"></span>
    <span class="hcat-dd-text"><span class="hcat-dd-label">✓ 登録済み</span></span>
    <span class="hcat-dd-check"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.5L5.5 10.5L11.5 4" stroke="var(--green-main)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
  </button>`);

  grid.innerHTML =
    `<div class="filter-scroll-rail hcat-group-row">${groupHtml}</div>` +
    `<div class="hcat-select-wrap">
      <button class="hcat-select-btn" id="hcat-select-btn" onclick="_hcatToggleDropdown()" aria-expanded="false">
        <span class="hcat-select-left">
          <span class="hcat-select-dot" style="background:${selectDotColor};"></span>
          <span class="hcat-select-label">${selectMainLabel}</span>
          ${selectSubLabel ? `<span class="hcat-select-sub">${selectSubLabel}</span>` : ''}
        </span>
        <span class="hcat-select-chevron">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5L7 9L11 5" stroke="var(--text-tertiary)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </button>
      <div class="hcat-dropdown" id="hcat-dropdown">
        ${ddItems.join('')}
      </div>
    </div>`;
}

// ★ グループフィルターセット
// ================================================================
// ★★★ FIX: カテゴリ選択の統一実行関数 ★★★
// 全カテゴリボタンハンドラーがこれを経由することで
// 「state更新→cache無効化→UI更新→結果再描画」の順序を保証する
// ================================================================
function _applyCategoryChange() {
  // ★ デバッグログ（検索画面カテゴリ切替の状態確認）
  console.log('[Search] category change →',
    'gender:', _searchGender,
    'region:', _searchRegion,
    'group:', _searchGroupKey,
    'filter:', searchFilter
  );
  // 1. キャッシュを確実にクリア（二重キャッシュを防ぐ）
  if (typeof _invalidateSearchCache === 'function') _invalidateSearchCache();
  // 2. フィルターUI（グループチップ・ドロップダウン）を同期更新
  if (typeof renderSearchFilters === 'function') renderSearchFilters();
  // 3. 検索結果リストを即時更新
  if (typeof applySearchFilters === 'function') applySearchFilters();
}

function _setGroupFilter(groupKey, el) {
  el.style.transform = 'scale(0.90)';
  setTimeout(() => { el.style.transform = ''; }, 140);
  _searchGroupKey = (_searchGroupKey === groupKey) ? null : groupKey;
  searchFilter = 'all';
  _applyCategoryChange();
}

// ★★★ iOS風セレクトUI制御 ★★★

// ドロップダウン開閉
function _hcatToggleDropdown() {
  const btn = document.getElementById('hcat-select-btn');
  const dd  = document.getElementById('hcat-dropdown');
  if (!btn || !dd) return;
  const isOpen = dd.classList.contains('is-open');
  if (isOpen) {
    _hcatCloseDropdown();
  } else {
    btn.classList.add('is-open');
    dd.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    // タップアウト検知
    setTimeout(() => {
      document.addEventListener('touchstart', _hcatOutsideTap, { once: true, passive: true });
      document.addEventListener('click', _hcatOutsideTap, { once: true });
    }, 10);
  }
}

function _hcatCloseDropdown() {
  const btn = document.getElementById('hcat-select-btn');
  const dd  = document.getElementById('hcat-dropdown');
  if (btn) { btn.classList.remove('is-open'); btn.setAttribute('aria-expanded','false'); }
  if (dd)  { dd.classList.remove('is-open'); }
}

function _hcatOutsideTap(e) {
  const wrap = document.querySelector('.hcat-select-wrap');
  if (wrap && wrap.contains(e.target)) return;
  _hcatCloseDropdown();
}

// ドロップダウン行タップ → ツアー選択
function _hcatSelectTour(tourKey, groupKey, el) {
  el.style.transform = 'scale(.96)';
  setTimeout(() => { el.style.transform = ''; }, 120);
  if (groupKey) _searchGroupKey = groupKey;
  searchFilter = tourKey;
  _hcatCloseDropdown();
  _applyCategoryChange();
}

// ★ Phase3: ツアーカテゴリフィルターのセット（キャッシュ無効化付き）
function _setTourCatFilter(key, el) {
  el.style.transform = 'scale(0.90)';
  setTimeout(() => { el.style.transform = ''; }, 140);
  searchFilter = key;
  _applyCategoryChange();
}

// ★ Phase3: 男女切替（キャッシュ無効化付き）
function _setGender(gender, btn) {
  _searchGender = gender;
  document.querySelectorAll('.search-gender-btn').forEach(b => {
    b.classList.toggle('is-active', b.dataset.gender === gender);
  });
  searchFilter = 'all';
  _searchGroupKey = null;
  _applyCategoryChange();
}

// ★ Phase3: 国内/海外切替（キャッシュ無効化付き）
function _setRegion(region, btn) {
  _searchRegion = region;
  document.querySelectorAll('.search-region-tab').forEach(b => {
    b.classList.toggle('is-active', b.dataset.region === region);
  });
  searchFilter = 'all';
  _searchGroupKey = null;
  _applyCategoryChange();
}

// ★ Phase3: タブ同期（すべて/お気に入り）
function _syncModeTabs(btn) {
  document.querySelectorAll('.search-mode-tab').forEach(b => {
    b.classList.toggle('is-active', b === btn);
  });
}
function setSearchAreaFilter(key,el){
  el.style.transform='scale(0.92)';setTimeout(()=>{el.style.transform='';},120);
  searchAreaFilter=searchAreaFilter===key?null:key;
  _invalidateSearchCache();
  applySearchFilters();
}
function toggleSort(){sortByPrize=!sortByPrize;document.getElementById('sort-label').textContent=sortByPrize?'賞金順':'日付順';_invalidateSearchCache();applySearchFilters();}
function setSearchMode(mode){
  if(mode!=='fav'&&mode!=='all')return;
  searchMode=mode;
  saveSearchPrefs();
  applySearchFilters();
}
function toggleFavTour(catKey){
  if(favTours.has(catKey))favTours.delete(catKey);else favTours.add(catKey);
  saveSearchPrefs();applySearchFilters();
}
function toggleFavTournament(tid){
  if(favTournaments.has(tid))favTournaments.delete(tid);else favTournaments.add(tid);
  saveSearchPrefs();applySearchFilters();
}

// 大会ステータス: 'live'(開催中) / 'upcoming'(予定) / 'ended'(終了)
function _searchStatus(t){
  const today=todayStr();
  if(today<t.start)return'upcoming';
  if(today>t.end)return'ended';
  return'live';
}
function _statusLabel(s){return s==='live'?'開催中':(s==='upcoming'?'予定':'終了');}

// ================================================================
// ★★★ Phase2: 大会詳細モーダル ★★★
// ================================================================

let _tdmCurrentId = null;
let _tdmDragStartY = 0;
let _tdmDragCurrentY = 0;
let _tdmIsDragging = false;

// 詳細モーダルを開く
function openTournamentModal(tid){
  const t = TOURNAMENTS_FLAT.find(x => x.id === tid);
  if(!t) return;
  _tdmCurrentId = tid;
  _renderTdm(t);
  document.getElementById('tdm-overlay').classList.add('show');
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      document.getElementById('tdm-sheet').classList.add('show');
    });
  });
  // ドラッグ閉じ初期化
  _tdmInitDrag();
  // ★ 修正: ✕ボタンにtouchstart即時反応リスナー（iPhone Safari 300ms遅延ゼロ化）
  const closeBtn = document.getElementById('tdm-close-btn');
  if(closeBtn){
    closeBtn.ontouchstart = function(e){
      e.stopPropagation(); // dragに伝播させない
    };
    closeBtn.ontouchend = function(e){
      e.preventDefault();
      e.stopPropagation();
      closeTournamentModal();
    };
  }
}

// モーダルを閉じる
function closeTournamentModal(){
  const sheet = document.getElementById('tdm-sheet');
  const overlay = document.getElementById('tdm-overlay');
  // is-dragging / ios-dragging を解除
  sheet.classList.remove('show','is-dragging','ios-dragging');
  // ★ FIX: IOSSheetDrag._dismiss から呼ばれた場合は transform をここでリセットしない
  //   dismiss アニメーション中に transform='' すると CSS .show ルールが残っていると
  //   スナップバックを引き起こす。_dismiss 側の rAF でクリアする。
  //   _tdmIsDismissing フラグが立っていない通常 close の時のみリセット。
  if (!sheet._iosDismissing) {
    sheet.style.transform  = '';
    sheet.style.transition = '';
  }
  _tdmIsDragging = false;
  overlay.classList.remove('show');
  setTimeout(()=>{ _tdmCurrentId = null; }, 400);
}

// モーダル内容を描画
/* ============================================================
   ProNexaX — 大会詳細モーダル PLATFORM v3
   プロゴルフ大会情報プラットフォーム完全版
   ============================================================ */

/* ---------- ユーティリティ ---------- */
function _pxEsc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function _pxFmtDate(ds){
  if(!ds)return null;
  try{
    const d=new Date(ds+'T00:00:00');
    const w=['日','月','火','水','木','金','土'][d.getDay()];
    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日（${w}）`;
  }catch(e){return ds;}
}

function _pxDayDiff(ds){
  if(!ds)return null;
  try{
    const today=new Date(new Date().toISOString().slice(0,10)+'T00:00:00');
    return Math.round((new Date(ds+'T00:00:00')-today)/86400000);
  }catch(e){return null;}
}

function _pxStatus(t){
  // calcTournamentStatusがあれば使用
  if(typeof calcTournamentStatus==='function'){
    const raw=t._raw||t;
    return calcTournamentStatus({
      status:t.status||raw.status,
      startDate:t.start||raw.startDate,
      endDate:t.end||raw.endDate,
      entryDeadline:t.entryDeadline||raw.entryDeadline,
    });
  }
  const today=new Date().toISOString().slice(0,10);
  const s=t.start,en=t.end,dl=t.entryDeadline,st=t.status;
  if(st&&st!=='tbd')return st;
  if(!s)return'tbd';
  if(today>(en||s))return'ended';
  if(today>=s)return'ongoing';
  if(dl&&today>dl)return'closed';
  if(dl){const d=(new Date(dl)-new Date(today))/86400000;if(d<=7)return'closing_soon';}
  return'open';
}

/* ---------- Toast ---------- */
let _pxToastTimer=null;
function _pxToast(msg,type){
  let el=document.getElementById('px-toast');
  if(!el){
    el=document.createElement('div');el.id='px-toast';
    el.style.cssText='position:fixed;bottom:calc(env(safe-area-inset-bottom,0px)+88px);left:50%;transform:translateX(-50%) translateY(16px);background:rgba(20,20,22,.92);color:#fff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:24px;white-space:nowrap;z-index:9999;opacity:0;transition:opacity .22s,transform .22s cubic-bezier(.34,1.56,.64,1);pointer-events:none;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);max-width:86vw;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.28);';
    document.body.appendChild(el);
  }
  if(type==='error')el.style.background='rgba(176,28,28,.94)';
  else if(type==='success')el.style.background='rgba(10,100,58,.94)';
  else el.style.background='rgba(20,20,22,.92)';
  el.textContent=msg;
  void el.offsetWidth;
  el.style.opacity='1';el.style.transform='translateX(-50%) translateY(0)';
  clearTimeout(_pxToastTimer);
  _pxToastTimer=setTimeout(()=>{el.style.opacity='0';el.style.transform='translateX(-50%) translateY(16px)';},2600);
}

/* ---------- Map Sheet ---------- */
function _pxOpenMapSheet(courseName,place,country){
  let ov=document.getElementById('px-map-overlay');
  if(!ov){
    ov=document.createElement('div');ov.id='px-map-overlay';
    ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.44);z-index:8000;display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .22s ease;';
    ov.innerHTML=`<div id="px-map-sheet" style="background:#fff;border-radius:22px 22px 0 0;width:100%;max-width:560px;padding:0 0 calc(env(safe-area-inset-bottom,0px)+8px);transform:translateY(100%);transition:transform .32s cubic-bezier(.32,1,.25,1);overflow:hidden;">
      <div style="display:flex;justify-content:center;padding:10px 0 2px;"><div style="width:38px;height:4px;border-radius:2px;background:rgba(0,0,0,.13);"></div></div>
      <div id="px-map-title" style="font-size:13px;font-weight:700;color:#8e8e93;text-align:center;padding:4px 16px 10px;letter-spacing:.2px;"></div>
      <div id="px-map-name" style="font-size:16px;font-weight:800;color:#1d1d1f;text-align:center;padding:0 16px 14px;border-bottom:.5px solid rgba(0,0,0,.08);letter-spacing:-.3px;line-height:1.35;"></div>
      <button id="px-gmap-btn" style="display:flex;align-items:center;gap:14px;padding:15px 22px;border:none;background:none;width:100%;cursor:pointer;-webkit-tap-highlight-color:transparent;font-family:inherit;text-align:left;">
        <div style="width:46px;height:46px;border-radius:12px;background:#E8F5E9;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">🗺️</div>
        <div><div style="font-size:15px;font-weight:700;color:#1d1d1f;margin-bottom:2px;">Google マップ</div><div style="font-size:12px;color:#8e8e93;">ブラウザで開く</div></div>
        <svg style="margin-left:auto;color:#c7c7cc;" width="16" height="16" viewBox="0 0 22 22" fill="none"><path d="M9 6l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button id="px-amap-btn" style="display:flex;align-items:center;gap:14px;padding:15px 22px;border:none;border-top:.5px solid rgba(0,0,0,.07);background:none;width:100%;cursor:pointer;-webkit-tap-highlight-color:transparent;font-family:inherit;text-align:left;">
        <div style="width:46px;height:46px;border-radius:12px;background:#FFF3E0;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">🍎</div>
        <div><div style="font-size:15px;font-weight:700;color:#1d1d1f;margin-bottom:2px;">Apple マップ</div><div style="font-size:12px;color:#8e8e93;">マップアプリで開く</div></div>
        <svg style="margin-left:auto;color:#c7c7cc;" width="16" height="16" viewBox="0 0 22 22" fill="none"><path d="M9 6l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button id="px-map-cancel" style="display:block;width:calc(100% - 28px);margin:10px 14px 0;padding:15px;border:none;border-radius:14px;background:rgba(0,0,0,.05);color:#1d1d1f;font-size:15px;font-weight:600;cursor:pointer;-webkit-tap-highlight-color:transparent;font-family:inherit;">キャンセル</button>
    </div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click',e=>{if(e.target===ov)_pxCloseMapSheet();});
    document.getElementById('px-map-cancel').addEventListener('click',_pxCloseMapSheet);
  }
  const q=encodeURIComponent([courseName,place,country==='japan'?'':country].filter(Boolean).join(' '));
  document.getElementById('px-map-title').textContent='地図アプリを選択';
  document.getElementById('px-map-name').textContent=courseName||(place||'');
  document.getElementById('px-gmap-btn').onclick=()=>{window.open(`https://www.google.com/maps/search/?api=1&query=${q}`,'_blank','noopener');_pxCloseMapSheet();};
  document.getElementById('px-amap-btn').onclick=()=>{window.open(`maps://?q=${q}`,'_blank','noopener');_pxCloseMapSheet();};
  // ダークモード対応
  const isDark=document.documentElement.dataset.theme==='dark';
  const sheet=document.getElementById('px-map-sheet');
  sheet.style.background=isDark?'#1C1C1E':'#fff';
  ov.style.display='flex';
  requestAnimationFrame(()=>{
    ov.style.opacity='1';
    sheet.style.transform='translateY(0)';
  });
}
function _pxCloseMapSheet(){
  const ov=document.getElementById('px-map-overlay');
  const sheet=document.getElementById('px-map-sheet');
  if(!ov)return;
  ov.style.opacity='0';
  sheet.style.transform='translateY(100%)';
  setTimeout(()=>{ov.style.display='none';},320);
}

/* ---------- Skeleton ---------- */
function _pxSkeleton(){
  const bg1='linear-gradient(90deg,#f0f0f5 25%,#e6e6ee 50%,#f0f0f5 75%)';
  const bg2='linear-gradient(90deg,#f8f4e8 25%,#ede9d8 50%,#f8f4e8 75%)';
  const anim='background-size:300% 100%;animation:pxShimmer 1.5s ease-in-out infinite;';
  return `<style>@keyframes pxShimmer{0%{background-position:300% 0}100%{background-position:-300% 0}}</style>
  <div style="padding:12px 14px;display:flex;flex-direction:column;gap:14px;">
    <!-- status badge -->
    <div style="display:flex;gap:8px;">
      <div style="width:72px;height:24px;border-radius:12px;background:${bg1};${anim}"></div>
      <div style="width:52px;height:24px;border-radius:12px;background:${bg1};${anim}animation-delay:.1s;"></div>
    </div>
    <!-- prize hero -->
    <div style="display:flex;gap:8px;height:82px;">
      <div style="flex:1;border-radius:16px;background:${bg2};${anim}animation-delay:.05s;"></div>
      <div style="flex:1;border-radius:16px;background:${bg2};${anim}animation-delay:.15s;"></div>
    </div>
    <!-- section label -->
    <div style="width:80px;height:11px;border-radius:5px;background:${bg1};${anim}animation-delay:.08s;"></div>
    <!-- card rows -->
    <div style="border-radius:16px;overflow:hidden;border:.5px solid rgba(0,0,0,.06);">
      ${[1,2,3,4,5].map((i)=>`<div style="display:flex;align-items:center;gap:12px;padding:11px 14px;border-bottom:.5px solid rgba(0,0,0,.04);">
        <div style="width:28px;height:28px;border-radius:8px;background:${bg1};${anim}animation-delay:${i*0.06}s;flex-shrink:0;"></div>
        <div style="width:60px;height:11px;border-radius:5px;background:${bg1};${anim}animation-delay:${i*0.06+0.05}s;flex-shrink:0;"></div>
        <div style="flex:1;height:13px;border-radius:5px;background:${bg1};${anim}animation-delay:${i*0.06+0.1}s;"></div>
      </div>`).join('')}
    </div>
    <!-- section label -->
    <div style="width:60px;height:11px;border-radius:5px;background:${bg1};${anim}animation-delay:.2s;"></div>
    <!-- link grid -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      ${[1,2,3,4].map(i=>`<div style="height:60px;border-radius:14px;background:${bg1};${anim}animation-delay:${i*0.08}s;"></div>`).join('')}
    </div>
  </div>`;
}

/* ---------- SVG icons ---------- */
const _PX_IC={
  cal:`<rect x="3" y="4" width="16" height="15" rx="2.5" stroke="currentColor" stroke-width="1.7"/><line x1="7" y1="2" x2="7" y2="6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><line x1="15" y1="2" x2="15" y2="6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><line x1="3" y1="9" x2="19" y2="9" stroke="currentColor" stroke-width="1.7"/>`,
  clock:`<circle cx="11" cy="11" r="8.5" stroke="currentColor" stroke-width="1.7"/><path d="M11 7v4.5l3 1.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>`,
  pin:`<path d="M11 3.5a5 5 0 015 5c0 4-5 10-5 10S6 12.5 6 8.5a5 5 0 015-5z" stroke="currentColor" stroke-width="1.7"/><circle cx="11" cy="8.5" r="1.8" fill="currentColor"/>`,
  golf:`<path d="M11 3v10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M11 3l5 2.5-5 2.5" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><ellipse cx="11" cy="17" rx="4" ry="1.5" stroke="currentColor" stroke-width="1.5"/>`,
  org:`<path d="M3 19c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="11" cy="8" r="4" stroke="currentColor" stroke-width="1.7"/>`,
  trophy:`<path d="M6 3h10v8a5 5 0 01-10 0V3z" stroke="currentColor" stroke-width="1.7"/><path d="M6 5H3v2a3 3 0 003 3M16 5h3v2a3 3 0 01-3 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><line x1="11" y1="16" x2="11" y2="19" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><line x1="7" y1="19" x2="15" y2="19" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>`,
  money:`<circle cx="11" cy="11" r="8.5" stroke="currentColor" stroke-width="1.7"/><path d="M11 7v1m0 6v1m-2.5-4.5h3a1.5 1.5 0 010 3H9m0-3h2a1.5 1.5 0 000-3H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  doc:`<rect x="4" y="3" width="14" height="17" rx="2" stroke="currentColor" stroke-width="1.7"/><line x1="7" y1="8" x2="15" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="7" y1="12" x2="15" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="7" y1="16" x2="11" y2="16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  user:`<circle cx="11" cy="8" r="3.5" stroke="currentColor" stroke-width="1.7"/><path d="M4 19c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>`,
  num:`<path d="M5 8h12M5 12h12M5 16h8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>`,
  cancel:`<circle cx="11" cy="11" r="8.5" stroke="currentColor" stroke-width="1.7"/><path d="M8 8l6 6M14 8l-6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>`,
  globe:`<circle cx="11" cy="11" r="8.5" stroke="currentColor" stroke-width="1.7"/><path d="M2 11h18M11 2a13.5 13.5 0 010 18M11 2a13.5 13.5 0 000 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  ig:`<rect x="3" y="3" width="16" height="16" rx="4.5" stroke="currentColor" stroke-width="1.7"/><circle cx="11" cy="11" r="3.5" stroke="currentColor" stroke-width="1.5"/><circle cx="15.5" cy="6.5" r=".85" fill="currentColor"/>`,
  entry:`<path d="M14 3H18a1 1 0 011 1v15a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M9 11l2 2 4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><rect x="8" y="1" width="6" height="4" rx="1" stroke="currentColor" stroke-width="1.7"/>`,
  ext:`<path d="M9 4H4a1 1 0 00-1 1v13a1 1 0 001 1h13a1 1 0 001-1v-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M14 3h5m0 0v5m0-5L10 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  flag:`<path d="M5 3v16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M5 3h12l-3 4.5h3l-3 4.5H5" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>`,
};

function _pxIcon(type,size=15){return`<svg width="${size}" height="${size}" viewBox="0 0 22 22" fill="none">${_PX_IC[type]||''}</svg>`;}

function _pxRow(iconType,iconBg,iconColor,label,valueHtml,extra=''){
  if(!valueHtml)valueHtml=`<span style="color:var(--text-tertiary);font-style:italic;font-weight:400;font-size:12px;">未設定</span>`;
  return`<div class="tdm-row" style="padding:11px 14px;gap:12px;display:flex;align-items:flex-start;">
    <div style="width:30px;height:30px;border-radius:9px;background:${iconBg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      <svg width="15" height="15" viewBox="0 0 22 22" fill="none" style="color:${iconColor};">${_PX_IC[iconType]||''}</svg>
    </div>
    <div style="width:68px;flex-shrink:0;font-size:11px;font-weight:600;color:var(--text-tertiary);line-height:1.5;padding-top:3px;letter-spacing:.05px;">${label}</div>
    <div style="flex:1;min-width:0;font-size:13.5px;font-weight:500;color:var(--text-primary);line-height:1.6;letter-spacing:-.1px;word-break:break-all;${extra}">${valueHtml}</div>
  </div>`;
}

/* ============================================================
   メイン描画関数
   ============================================================ */
function _renderTdm(t){
  const catColor = CAT_COLORS[t.cat] || '#8090A0';
  /* ── フィールド正規化（flat / _raw 両対応） ── */
  const raw = t._raw || t;
  const catLabel = CAT_LABELS[t.cat] || t.cat;
  const genderLabel = t.gender==='womens'?'女子':t.gender==='both'?'男女':t.gender==='mens'?'男子':'';
  const status = _pxStatus(t);
  const isAdded = addedIds.has(t.id);
  const isFav   = favTournaments.has(t.id);

  /* ── 日程 ── */
  const startDate = t.start   || raw.startDate || '';
  const endDate   = t.end     || raw.endDate   || '';
  const deadline  = t.entryDeadline  || raw.entryDeadline  || '';
  const cancelDl  = t.cancelDeadline || raw.cancelDeadline || '';

  /* ── 会場・地域 ── */
  const courseName = t.courseName || raw.course || raw.courseName || '';
  const place      = t.place || raw.place || '';
  const country    = t.country || raw.country || 'japan';
  const organizer  = t.organizer || raw.organizer || '';

  /* ── 賞金・費用 ── */
  const prize         = t.prize            || raw.prize            || '';
  const prizeWinner   = t.prizeWinner      || raw.prizeWinner      || '';
  const entryFee      = t.entryFee         || raw.entryFee         || '';
  const pracFee       = t.practiceRoundFee || raw.practiceRoundFee || '';
  const capacity      = t.capacity         || raw.capacity         || '';
  const entryMethod   = t.entryMethod      || raw.entryMethod      || '';
  const qualification = t.qualification    || raw.qualification    || '';
  const notes         = t.notes            || raw.notes            || '';

  /* ── URL（links{} 対応） ── */
  const lk = raw.links || {};
  const officialUrl = t.officialUrl || lk.official || lk.website || '';
  const igUrl       = t.igUrl       || lk.instagram || '';
  const entryUrl    = t.entryUrl    || lk.entry || '';
  const pairUrl     = t.pairUrl     || lk.pairs || lk.pairing || '';
  const resultUrl   = t.resultUrl   || lk.result || '';

  /* ① ヘッダー */
  document.getElementById('tdm-title').textContent = t.name;
  const catRowEl = document.getElementById('tdm-cat-row');
  if(catRowEl){
    catRowEl.innerHTML = '<span class="t-cat-badge" style="background:'+catColor+'1A;color:'+catColor+';border:1px solid '+catColor+'35;font-size:10px;padding:3px 9px;">'+_pxEsc(catLabel)+'</span>'+(genderLabel?'<span class="t-gender-badge '+(t.gender||'')+'" style="font-size:10px;">'+genderLabel+'</span>':'');
  }

  /* ② アクション行 */
  const actEl = document.getElementById('tdm-actions');
  if(actEl){
    const SICON = isFav ? '#E5A41A' : 'none';
    const SSTR  = isFav ? '#E5A41A' : '#B8901A';
    actEl.innerHTML = `
      <button class="tdm-action-btn" onclick="_tdmAddToCalendar()">
        <div class="tdm-action-icon cal">
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none"><rect x="3" y="4" width="16" height="15" rx="2.5" stroke="#1AAF7A" stroke-width="1.7"/><line x1="7" y1="2" x2="7" y2="6" stroke="#1AAF7A" stroke-width="1.7" stroke-linecap="round"/><line x1="15" y1="2" x2="15" y2="6" stroke="#1AAF7A" stroke-width="1.7" stroke-linecap="round"/><line x1="3" y1="9" x2="19" y2="9" stroke="#1AAF7A" stroke-width="1.7"/></svg>
        </div>
        <span class="tdm-action-label">${isAdded?'追加済み':'カレンダー'}</span>
      </button>
      <button class="tdm-action-btn" onclick="_tdmToggleFav()">
        <div class="tdm-action-icon fav">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="${SICON}" stroke="${SSTR}" stroke-width="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <span class="tdm-action-label">${isFav?'★済み':'お気に入り'}</span>
      </button>
      ${officialUrl?`<a class="tdm-action-btn" href="${_pxEsc(officialUrl)}" target="_blank" rel="noopener"><div class="tdm-action-icon web"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5060A0" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg></div><span class="tdm-action-label">公式サイト</span></a>`:''}
      ${igUrl?`<a class="tdm-action-btn" href="${_pxEsc(igUrl)}" target="_blank" rel="noopener"><div class="tdm-action-icon" style="background:#FFF0F6;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C060A0" stroke-width="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5" fill="#C060A0"/></svg></div><span class="tdm-action-label">Instagram</span></a>`:''}
      ${entryUrl?`<a class="tdm-action-btn" href="${_pxEsc(entryUrl)}" target="_blank" rel="noopener"><div class="tdm-action-icon entry"><svg width="20" height="20" viewBox="0 0 22 22" fill="none"><path d="M14 3H18a1 1 0 011 1v15a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h4" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/><path d="M9 11l2 2 4-4" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><rect x="8" y="1" width="6" height="4" rx="1" stroke="#fff" stroke-width="1.7"/></svg></div><span class="tdm-action-label">エントリー</span></a>`:''}
    `;
  }

  /* ③ スクロールエリア完全書き換え */
  const scrollEl = document.getElementById('tdm-scroll');
  if(!scrollEl)return;
  scrollEl.scrollTop = 0;
  scrollEl.innerHTML = _pxSkeleton();

  requestAnimationFrame(()=>requestAnimationFrame(()=>{

  const ST_MAP = {
    open:         {label:'募集中',   bg:'#D6F5E6', color:'#0A6A38', dot:true},
    closing_soon: {label:'締切間近', bg:'#FFF0D0', color:'#9A5000', dot:true},
    closed:       {label:'締切済み', bg:'#ECEEF2', color:'#6A7A8A', dot:false},
    ongoing:      {label:'開催中',   bg:'#DCF0FF', color:'#1A4E90', dot:false},
    ended:        {label:'終了',     bg:'#F2F2F5', color:'#7A7A8A', dot:false},
    tbd:          {label:'日程未定', bg:'#F0F0F5', color:'#7A7A8A', dot:false},
    cancelled:    {label:'中止',     bg:'#FFE8E8', color:'#C02828', dot:false},
  };

  function _stBadge(st){
    const d=ST_MAP[st]||ST_MAP.tbd;
    return '<span style="display:inline-flex;align-items:center;gap:5px;padding:5px 11px 5px 8px;border-radius:20px;font-size:11.5px;font-weight:700;letter-spacing:.05px;background:'+d.bg+';color:'+d.color+';flex-shrink:0;">'+(d.dot?'<span style="width:6px;height:6px;border-radius:50%;background:'+d.color+';animation:pxPulse '+(st==='closing_soon'?'1s':'2s')+' ease-in-out infinite;flex-shrink:0;"></span>':'')+d.label+'</span>';
  }

  function _dlBadge(ds){
    if(!ds)return'';
    const diff=_pxDayDiff(ds);
    if(diff===null||diff<0)return'';
    if(diff===0)return'<span style="margin-left:7px;background:#C03030;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:8px;display:inline-block;">今日締切</span>';
    if(diff<=3) return'<span style="margin-left:7px;background:#D05800;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:8px;display:inline-block;">'+diff+'日後</span>';
    if(diff<=7) return'<span style="margin-left:7px;background:#F0B020;color:#4A3000;font-size:10px;font-weight:700;padding:2px 7px;border-radius:8px;display:inline-block;">'+diff+'日後</span>';
    if(diff<=14)return'<span style="margin-left:6px;color:var(--text-tertiary);font-size:11px;font-weight:600;display:inline-block;">'+diff+'日後</span>';
    return'';
  }

  function _sec(label){
    return'<div style="padding:16px 14px 8px;"><div style="font-size:11px;font-weight:700;color:var(--text-tertiary);letter-spacing:.65px;text-transform:uppercase;display:flex;align-items:center;gap:8px;">'+label+'<div style="flex:1;height:.5px;background:rgba(0,0,0,.07);"></div></div></div>';
  }

  function _card(content){
    return'<div style="margin:0 12px 4px;border-radius:16px;overflow:hidden;background:var(--card-bg,#fff);border:.5px solid rgba(0,0,0,.07);box-shadow:0 1px 4px rgba(0,0,0,.04);">'+content+'</div>';
  }

  let dateHtml=null;
  if(startDate){
    const s=_pxFmtDate(startDate)||startDate;
    const e=endDate&&endDate!==startDate?(_pxFmtDate(endDate)||endDate):null;
    dateHtml=e?s+'<br><span style="font-size:12px;color:var(--text-tertiary);"> 〜 </span>'+e:s;
  }

  const dlHtml=deadline?'<span style="font-size:13.5px;">'+(_pxFmtDate(deadline)||deadline)+'</span>'+_dlBadge(deadline):null;

  let courseHtml=null;
  if(courseName){
    const cn=courseName.replace(/'/g,"\\'");
    const pl=place.replace(/'/g,"\\'");
    const ct=country.replace(/'/g,"\\'");
    courseHtml='<button style="display:inline-flex;align-items:center;gap:5px;background:var(--green-chip,#E0F8EE);border:1px solid rgba(57,200,146,.3);border-radius:10px;padding:5px 11px 5px 8px;color:var(--green-dark,#22A874);font-weight:700;font-size:13px;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;font-family:inherit;" onclick="event.preventDefault();_pxOpenMapSheet(\''+cn+'\',\''+pl+'\',\''+ct+'\')" type="button"><svg width="12" height="12" viewBox="0 0 22 22" fill="none" style="color:var(--green-dark,#22A874);flex-shrink:0;"><path d=\"M11 3.5a5 5 0 015 5c0 4-5 10-5 10S6 12.5 6 8.5a5 5 0 015-5z\" stroke=\"currentColor\" stroke-width=\"1.7\"/><circle cx=\"11\" cy=\"8.5\" r=\"1.8\" fill=\"currentColor\"/></svg>'+_pxEsc(courseName)+'<svg width="11" height="11" viewBox="0 0 22 22" fill="none" style="color:var(--text-tertiary);opacity:.7;flex-shrink:0;"><path d=\"M9 4H4a1 1 0 00-1 1v13a1 1 0 001 1h13a1 1 0 001-1v-5\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\"/><path d=\"M14 3h5m0 0v5m0-5L10 12\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg></button>';
  }

  const placeHtml=place?_pxEsc(place)+(country&&country!=='japan'?'<span style="color:var(--text-tertiary);font-size:12px;"> / '+_pxEsc(country)+'</span>':''):null;

  function _lBtn(url,label,emoji,bg,color,sub){
    const act=!!url;
    const href=url?'href="'+_pxEsc(url)+'" target="_blank" rel="noopener noreferrer"':'onclick="return false;"';
    return'<a style="display:flex;align-items:center;gap:10px;background:'+(act?'var(--card-bg,#fff)':'rgba(0,0,0,.025)')+';border:1px solid '+(act?'rgba(0,0,0,.08)':'rgba(0,0,0,.05)')+';border-radius:14px;padding:12px 13px;text-decoration:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation;'+(act?'':'opacity:.5;pointer-events:none;')+'" '+href+'><div style="width:36px;height:36px;border-radius:10px;background:'+bg+';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:17px;">'+emoji+'</div><div style="flex:1;min-width:0;"><div style="font-size:12px;font-weight:700;color:'+(act?'var(--text-primary,#0F1E18)':'var(--text-tertiary)')+';display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+label+'</div><div style="font-size:10px;font-weight:500;color:'+(act?color:'var(--text-tertiary)')+';display:block;margin-top:1px;">'+(act?(sub||'タップして開く'):'未設定')+'</div></div>'+(act?'<svg width="11" height="11" viewBox="0 0 22 22" fill="none" style="color:var(--text-tertiary);opacity:.6;flex-shrink:0;"><path d=\"M9 4H4a1 1 0 00-1 1v13a1 1 0 001 1h13a1 1 0 001-1v-5\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\"/><path d=\"M14 3h5m0 0v5m0-5L10 12\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>':'')+'</a>';
  }

  function _costRow(label,value,hl){
    return'<div style="display:flex;align-items:center;padding:12px 14px;border-bottom:.5px solid rgba(0,0,0,.04);"><span style="flex:1;font-size:13px;font-weight:500;color:var(--text-secondary);">'+label+'</span><span style="font-size:15px;font-weight:700;color:'+(hl?'var(--green-dark,#22A874)':'var(--text-primary,#0F1E18)')+';">'+_pxEsc(value)+'</span></div>';
  }

  let prizeSection='';
  if(prize||prizeWinner){
    prizeSection='<div style="margin:0 12px 4px;background:linear-gradient(135deg,#FFFBF0,#FFF5D0,#FDF0B0);border-radius:18px;border:1px solid rgba(184,136,26,.18);overflow:hidden;"><div style="padding:11px 14px 8px;display:flex;align-items:center;gap:7px;border-bottom:.5px solid rgba(184,136,26,.14);"><span style="font-size:15px;">🏆</span><span style="font-size:10px;font-weight:700;color:#8A6800;letter-spacing:.5px;text-transform:uppercase;">Prize Money</span></div><div style="display:flex;">'+(prize?'<div style="flex:1;padding:12px 14px 14px;'+(prizeWinner?'border-right:.5px solid rgba(184,136,26,.14);':'')+'"><div style="font-size:10px;font-weight:700;color:#8A6000;letter-spacing:.2px;margin-bottom:4px;">賞金総額</div><div style="font-size:17px;font-weight:800;color:#4A3200;letter-spacing:-.4px;line-height:1.2;">'+_pxEsc(prize)+'</div></div>':'')+(prizeWinner?'<div style="flex:1;padding:12px 14px 14px;"><div style="font-size:10px;font-weight:700;color:#8A6000;letter-spacing:.2px;margin-bottom:4px;">優勝賞金</div><div style="font-size:17px;font-weight:800;color:#4A3200;letter-spacing:-.4px;line-height:1.2;">'+_pxEsc(prizeWinner)+'</div></div>':'')+'</div></div>';
  }

  const hasCost=!!(entryFee||pracFee||capacity);
  const hasEntry=!!(entryMethod||qualification);

  scrollEl.innerHTML = `
    <style>@keyframes pxPulse{0%,100%{opacity:1}50%{opacity:.3}}@keyframes pxShimmer{0%{background-position:300% 0}100%{background-position:-300% 0}}</style>
    <div style="padding:10px 14px 12px;display:flex;align-items:center;gap:7px;flex-wrap:wrap;border-bottom:.5px solid rgba(0,0,0,.06);">
      ${_stBadge(status)}
      ${genderLabel?'<span style="font-size:11.5px;font-weight:600;color:var(--text-tertiary);">'+genderLabel+'</span>':''}
      ${catLabel?'<span style="font-size:11px;color:var(--text-tertiary);">／ '+_pxEsc(catLabel)+'</span>':''}
    </div>
    <div style="height:10px;"></div>
    ${prizeSection}
    ${_sec('開催情報')}
    ${_card(
      _pxRow('cal',  '#EAF7F1','#0A6A38','開催日', dateHtml)+
      _pxRow('clock','#FFF4E0','#9A5000','締切日', dlHtml)+
      (cancelDl?_pxRow('cancel','#FFF0F0','#C02828','キャンセル<br>締切',(_pxFmtDate(cancelDl)||cancelDl)):'')+
      (courseHtml
        ?'<div class="tdm-row" style="padding:11px 14px;gap:12px;display:flex;align-items:center;"><div style="width:30px;height:30px;border-radius:9px;background:#EAF7F1;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="15" height="15" viewBox="0 0 22 22" fill="none" style="color:#0A6A38;"><path d=\"M11 3v10\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\"/><path d=\"M11 3l5 2.5-5 2.5\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linejoin=\"round\"/><ellipse cx=\"11\" cy=\"17\" rx=\"4\" ry=\"1.5\" stroke=\"currentColor\" stroke-width=\"1.5\"/></svg></div><div style="width:68px;flex-shrink:0;font-size:11px;font-weight:600;color:var(--text-tertiary);padding-top:2px;">ゴルフ場</div><div style="flex:1;min-width:0;">'+courseHtml+'</div></div>'
        :_pxRow('golf','#EAF7F1','#0A6A38','ゴルフ場',null))+
      _pxRow('pin',  '#EAF2FB','#2A72C8','開催地', placeHtml)+
      _pxRow('org',  '#F5F0FA','#7040B0','主催',   organizer?_pxEsc(organizer):null)
    )}
    ${hasCost?_sec('費用・定員')+'<div style="margin:0 12px 4px;border-radius:16px;overflow:hidden;background:var(--card-bg,#fff);border:.5px solid rgba(0,0,0,.07);box-shadow:0 1px 4px rgba(0,0,0,.04);">'+(entryFee?_costRow('参加費',entryFee,false):'')+(pracFee?_costRow('練習ラウンド費',pracFee,false):'')+(capacity?_costRow('定員',capacity,true):'')+'</div>':''}
    ${hasEntry?_sec('エントリー')+_card((entryMethod?_pxRow('doc','#EAF2FB','#2A72C8','申請方法',_pxEsc(entryMethod)):'')+  (qualification?_pxRow('user','#F0F7F4','#3A9A78','出場資格',_pxEsc(qualification)):'')):''}
    ${_sec('リンク')}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:2px 12px 14px;">
      ${_lBtn(officialUrl,'公式サイト','🌐','#EEF0FA','#5060A0','公式サイトへ')}
      ${_lBtn(igUrl,'Instagram','📸','#FFF0F6','#C060A0','Instagramへ')}
      ${_lBtn(entryUrl,'エントリー','📋','#E6F7EE','#0A6A38','エントリーへ')}
      ${_lBtn(pairUrl,'組み合わせ','📑','#E6F0FB','#2A72C8','組み合わせへ')}
      ${_lBtn(resultUrl,'結果速報','🏆','#FFF8E0','#8A6000','結果ページへ')}
    </div>
    ${notes?'<div style="margin:0 12px 12px;padding:13px 14px;background:rgba(57,200,146,.07);border-radius:14px;border-left:3px solid var(--green-main,#39C892);font-size:12.5px;color:var(--text-secondary);line-height:1.65;">📝 '+_pxEsc(notes)+'</div>':''}
    <div style="height:20px;"></div>
  `;

  /* ④ フッター */
  const calBtn=document.getElementById('tdm-footer-cal');
  if(calBtn){
    calBtn.innerHTML='<svg width="15" height="15" viewBox="0 0 22 22" fill="none"><rect x="3" y="4" width="16" height="15" rx="2.5" stroke="currentColor" stroke-width="1.7"/><line x1="7" y1="2" x2="7" y2="6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><line x1="15" y1="2" x2="15" y2="6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><line x1="3" y1="9" x2="19" y2="9" stroke="currentColor" stroke-width="1.7"/></svg>'+(isAdded?'追加済み':'カレンダーへ');
    calBtn.style.background=isAdded?'var(--green-main,#39C892)':'';
    calBtn.style.color=isAdded?'#fff':'';
  }
  const entryBtn=document.getElementById('tdm-footer-entry');
  if(entryBtn){
    if(entryUrl){
      entryBtn.classList.remove('no-url');
      entryBtn.onclick=()=>window.open(entryUrl,'_blank','noopener');
      entryBtn.innerHTML='<svg width="14" height="14" viewBox="0 0 22 22" fill="none"><path d="M14 3H18a1 1 0 011 1v15a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h4" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/><path d="M9 11l2 2 4-4" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><rect x="8" y="1" width="6" height="4" rx="1" stroke="#fff" stroke-width="1.7"/></svg>エントリーへ';
    } else if(officialUrl){
      entryBtn.classList.remove('no-url');
      entryBtn.style.background='linear-gradient(135deg,#5060A0,#3040A0)';
      entryBtn.onclick=()=>window.open(officialUrl,'_blank','noopener');
      entryBtn.innerHTML='<svg width="14" height="14" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8.5" stroke="#fff" stroke-width="1.7"/><path d="M2 11h18M11 2a13.5 13.5 0 010 18M11 2a13.5 13.5 0 000 18" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>公式サイトへ';
    } else {
      entryBtn.classList.add('no-url');
      entryBtn.onclick=()=>showToast('エントリーURLは未設定です');
    }
  }

  })); // end rAF
}

/* ────────────────────────────────────────────────────
   既存互換ヘルパー群
   ──────────────────────────────────────────────────── */
function _tdmAddToCalendar(){
  if(!_tdmCurrentId)return;
  toggleSearchAdd(_tdmCurrentId);
  const isAdded=addedIds.has(_tdmCurrentId);
  showToast(isAdded?'✅ カレンダーに追加しました':'カレンダーから削除しました');
  const calBtn=document.getElementById('tdm-footer-cal');
  if(calBtn){
    calBtn.innerHTML='<svg width="15" height="15" viewBox="0 0 22 22" fill="none"><rect x="3" y="4" width="16" height="15" rx="2.5" stroke="currentColor" stroke-width="1.7"/><line x1="7" y1="2" x2="7" y2="6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><line x1="15" y1="2" x2="15" y2="6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><line x1="3" y1="9" x2="19" y2="9" stroke="currentColor" stroke-width="1.7"/></svg>'+(isAdded?'追加済み':'カレンダーへ');
    calBtn.style.background=isAdded?'var(--green-main,#39C892)':'';
    calBtn.style.color=isAdded?'#fff':'';
  }
}
function _tdmToggleFav(){
  if(!_tdmCurrentId)return;
  toggleFavTournament(_tdmCurrentId);
  const t=TOURNAMENTS_FLAT.find(x=>x.id===_tdmCurrentId);
  if(t)_renderTdm(t);
}
function _tdmOpenEntry(){
  if(!_tdmCurrentId)return;
  const t=TOURNAMENTS_FLAT.find(x=>x.id===_tdmCurrentId);
  const url=(t&&t.entryUrl)||(t&&t._raw&&t._raw.links&&t._raw.links.entry)||'';
  if(url)window.open(url,'_blank','noopener');
  else showToast('エントリーURLは未設定です');
}
function _tdmInitDrag(){
  const cb=document.getElementById('tdm-close-btn');
  if(cb){cb.ontouchstart=e=>e.stopPropagation();cb.ontouchend=e=>{e.preventDefault();e.stopPropagation();closeTournamentModal();};}
}
function _fmtDate(ds){if(!ds)return'-';try{const[,m,d]=ds.split('-');return parseInt(m)+'/'+parseInt(d);}catch(e){return ds;}}
function _deadlineClass(ds){if(!ds)return'';const today=todayStr();if(ds<today)return'';const diff=Math.floor((new Date(ds)-new Date(today))/(1000*60*60*24));if(diff===0)return'deadline-today';if(diff<=3)return'deadline-near';return'';}
function _fmtPrize(v){return v||'-';}
function _tdmIcon(type){return'<svg width="16" height="16" viewBox="0 0 22 22" fill="none" style="color:var(--text-tertiary);">'+(typeof _PX_IC!=='undefined'?(_PX_IC[type]||_PX_IC.cal||''):'')+'</svg>';}


// 大会単体カードのHTML（Phase2 新デザイン）
function _searchCardHTML(t){
  const isAdded=addedIds.has(t.id);
  const isFav=favTournaments.has(t.id);
  const status=_searchStatus(t);
  const statusLabel={live:'開催中',upcoming:'予定',ended:'終了'}[status];
  const rState=remindMap[t.id]||{reminder:false,reminderTiming:[]};
  const isRemind=rState.reminder;
  const remindKey=rState.reminderTiming&&rState.reminderTiming[0];
  const REMIND_LABELS={'30min':'30分前','1hour':'1時間前','sameDay':'当日朝','dayBefore':'前日','weekBefore':'1週間前'};
  const pillLabel=remindKey?REMIND_LABELS[remindKey]:'タイミングを選択';

  // カテゴリ色を取得
  const catColor=CAT_COLORS[t.cat]||'#8090A0';
  const catLabel=CAT_LABELS[t.cat]||t.cat;

  // 男女ラベル
  const genderLabel=t.gender==='womens'?'女子':t.gender==='both'?'男女':t.gender==='mens'?'男子':'';

  // 日付表示
  const dateStr=`${_fmtDate(t.start)} 〜 ${_fmtDate(t.end)}`;
  // 場所表示
  const placeStr=t.courseName?`${t.place} / ${t.courseName}`:t.place||'-';
  // 締切
  const dlStr=t.entryDeadline?_fmtDate(t.entryDeadline):'-';
  const dlCls=t.entryDeadline?_deadlineClass(t.entryDeadline):'';

  // SVGアイコン群（インライン）
  const svgCal=`<svg viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.3"/><line x1="5" y1="1.5" x2="5" y2="4.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="11" y1="1.5" x2="11" y2="4.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="2" y1="7" x2="14" y2="7" stroke="currentColor" stroke-width="1.3"/></svg>`;
  const svgPin=`<svg viewBox="0 0 16 16" fill="none"><path d="M8 2.5a3.5 3.5 0 013.5 3.5c0 2.8-3.5 7-3.5 7S4.5 8.8 4.5 6A3.5 3.5 0 018 2.5z" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="6" r="1.2" fill="currentColor"/></svg>`;
  const svgClock=`<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.3"/><path d="M8 5v3.5l2 1.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`;
  const svgBell=`<svg class="bell-svg" viewBox="0 0 20 20" fill="none"><path d="M10 2.5a5.5 5.5 0 0 1 5.5 5.5v3l1.25 2H3.25L4.5 11V8A5.5 5.5 0 0 1 10 2.5Z" stroke="currentColor" stroke-width="1.35" stroke-linejoin="round"/><path d="M8 15.5a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"/></svg>`;
  const chevSvg=`<svg viewBox="0 0 10 10" fill="none"><polyline points="3.5,2.5 6.5,5 3.5,7.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  return`<div class="t-card${isAdded?' is-added':''}" data-tid="${t.id}" onclick="openTournamentModal('${t.id}')">
  <div class="t-card-top">
    <div class="t-stripe stripe-${t.cat}" style="background:linear-gradient(180deg,${catColor},${catColor}99);"></div>
    <div class="t-main">
      <!-- 上段：大会名 -->
      <div class="t-name">
        <span class="t-name-text">${escapeHtml(t.name)}</span>
        ${isAdded?'<span class="t-name-check">✓</span>':''}
      </div>
      <!-- 中段：情報グリッド -->
      <div class="t-info-grid">
        <div class="t-info-row">
          <span class="t-info-icon">${svgCal}</span>
          <span class="t-info-label">開催日</span>
          <span class="t-info-value">${dateStr}</span>
        </div>
        ${t.entryDeadline?`<div class="t-info-row">
          <span class="t-info-icon">${svgClock}</span>
          <span class="t-info-label">締切</span>
          <span class="t-info-value${dlCls?' '+dlCls:''}">${dlStr}</span>
        </div>`:''}
        <div class="t-info-row">
          <span class="t-info-icon">${svgPin}</span>
          <span class="t-info-label">会場</span>
          <span class="t-info-value">${escapeHtml(placeStr)}</span>
        </div>
      </div>
      <!-- 下段：バッジ行 -->
      <div class="t-badge-row">
        <span class="t-cat-badge" style="background:${catColor}18;color:${catColor};border:1px solid ${catColor}40;">${catLabel}</span>
        ${genderLabel?`<span class="t-gender-badge ${t.gender||''}">${genderLabel}</span>`:''}
        <span class="t-status-badge ${status}">${statusLabel}</span>
        ${isAdded?'<span class="t-added-badge">✓ 登録済み</span>':''}
      </div>
    </div>
    <!-- 右側アクション -->
    <div class="t-action">
      <button class="t-fav-btn${isFav?' is-fav':''}" onclick="event.stopPropagation();toggleFavTournament('${t.id}')" aria-label="お気に入り">★</button>
      <button class="t-detail-btn" onclick="event.stopPropagation();openTournamentModal('${t.id}')">詳細</button>
      <button class="add-btn${isAdded?' added':''}" onclick="event.stopPropagation();toggleSearchAdd('${t.id}')">${isAdded?'✓ 追加':'＋ 追加'}</button>
    </div>
  </div>
  <!-- 賞金・エントリー費行 -->
  ${(t.prize||t.entryFee)?`<div class="t-prize-row">
    ${t.prize?`<div class="t-prize-item"><div class="t-prize-label">賞金総額</div><div class="t-prize-value money">${escapeHtml(t.prize)}</div></div>`:''}
    ${t.prize&&t.entryFee?'<div class="t-prize-divider"></div>':''}
    ${t.entryFee?`<div class="t-prize-item"><div class="t-prize-label">参加費</div><div class="t-prize-value">${escapeHtml(t.entryFee)}</div></div>`:''}
  </div>`:''}
  <!-- リマインド行 -->
  <div class="t-remind-row">
    <button class="t-bell-btn${isRemind?' is-on':''}" id="bell-${t.id}"
      onclick="event.stopPropagation();_toggleBell('${t.id}')" aria-label="リマインド">
      ${svgBell}
    </button>
    <button class="t-remind-pill${isRemind?' is-set visible':''}"
      id="pill-${t.id}"
      onclick="event.stopPropagation();openRemindSheet('${t.id}')"
      aria-label="通知タイミング">
      ${pillLabel}${chevSvg}
    </button>
  </div>
</div>`;
}

// =====================================================================
// ★★★ 複合検索エンジン ★★★
// =====================================================================

// ── サジェストマスタ ──
// type: 'area' | 'pref' | 'cat' | 'text'
function _buildSuggestMaster(){
  const items=[];
  // エリア
  AREA_FILTERS.forEach(a=>{
    items.push({type:'area',key:a.key,label:a.label,icon:a.icon,sub:'エリア'});
  });
  // 都道府県
  Object.entries(PREF_BY_AREA).forEach(([areaKey,prefs])=>{
    const areaLabel=AREA_FILTERS.find(a=>a.key===areaKey)?.label||'';
    prefs.forEach(p=>{
      items.push({type:'pref',key:p.key,areaKey,label:p.label,icon:'📍',sub:areaLabel});
    });
  });
  // カテゴリ（tournamentCategories から自動生成）
  const catDefs = window._TOUR_MASTER.map(t => ({
    key: t.key, label: t.label, sub: t.desc, icon: t.icon || '⛳'
  }));
  catDefs.forEach(c=>items.push({type:'cat',key:c.key,label:c.label,icon:c.icon,sub:c.sub}));
  return items;
}
let _sqMaster=null;
function _getSqMaster(){return _sqMaster||(_sqMaster=_buildSuggestMaster());}

// ── トークン状態 ──
// sqTokens: Array<{type,key,label,icon}>  確定済みトークン
let sqTokens=[];

// トークンをtype+keyで追加（重複防止）
function _sqAddToken(item){
  const dup=sqTokens.find(t=>t.type===item.type&&t.key===item.key);
  if(!dup){
    sqTokens.push({type:item.type,key:item.key,label:item.label,icon:item.icon});
  }
  // ★ NEW: 最近の検索に保存（textトークンまたはエリア・カテゴリラベル）
  if(item.type==='text') saveRecentSearch(item.label);
  else saveRecentSearch(item.label);
  // FBSも同期
  _sqSyncToFbs();
  document.getElementById('search-input').value='';
  _sqHideSuggest();
  _sqRenderTokens();
  applySearchFilters();
}
// ★ NEW: フリーテキストをすぐに検索（サジェスト空欄時の最近・人気からタップ）
function _sqPickFreeText(kw){
  if(!kw)return;
  const inp=document.getElementById('search-input');
  if(inp){inp.value=kw;inp.focus();}
  _sqShowSuggest(kw);
  applySearchFilters();
}
function _sqRemoveToken(type,key){
  sqTokens=sqTokens.filter(t=>!(t.type===type&&t.key===key));
  _sqSyncToFbs();
  _sqRenderTokens();
  applySearchFilters();
}
function _sqClearAll(){
  sqTokens=[];
  fbsCats.clear();fbsAreas.clear();fbsPrefs.clear();
  searchFilter='all';searchAreaFilter=null;
  _sqRenderTokens();   // これ内部で _sqRenderFilterBar/_sqUpdateIconState も呼ぶ
  applySearchFilters();
}

// sqTokens → FBS Sets に同期
function _sqSyncToFbs(){
  fbsCats.clear();fbsAreas.clear();fbsPrefs.clear();
  sqTokens.forEach(t=>{
    if(t.type==='cat') fbsCats.add(t.key);
    else if(t.type==='area') fbsAreas.add(t.key);
    else if(t.type==='pref'){ fbsPrefs.add(t.key); fbsAreas.add(t.areaKey||t.key); }
  });
}

// FBS → sqTokens に逆同期（FBSから適用したとき）
function _fbsSyncToTokens(){
  // FBSで適用された選択をトークンに反映
  sqTokens=sqTokens.filter(t=>t.type==='text'); // textトークンは残す
  const master=_getSqMaster();
  fbsCats.forEach(k=>{
    const m=master.find(x=>x.type==='cat'&&x.key===k);
    if(m&&!sqTokens.find(t=>t.type==='cat'&&t.key===k)) sqTokens.push({...m});
  });
  fbsPrefs.forEach(k=>{
    const m=master.find(x=>x.type==='pref'&&x.key===k);
    if(m&&!sqTokens.find(t=>t.type==='pref'&&t.key===k)) sqTokens.push({...m});
  });
  // エリアは都道府県未選択の場合のみ追加（重複を避ける）
  fbsAreas.forEach(k=>{
    const hasPrefs=[...fbsPrefs].some(pk=>{
      const m=master.find(x=>x.type==='pref'&&x.key===pk);
      return m&&m.areaKey===k;
    });
    if(!hasPrefs){
      const m=master.find(x=>x.type==='area'&&x.key===k);
      if(m&&!sqTokens.find(t=>t.type==='area'&&t.key===k)) sqTokens.push({...m});
    }
  });
  _sqRenderTokens();
}

// インラインtokenと外部バーを両方更新
function _sqRenderTokens(){
  const wrap=document.getElementById('sq-tokens-inline');
  if(!wrap)return;
  wrap.innerHTML=sqTokens.map(t=>`
    <span class="sq-token" data-type="${t.type}" data-key="${t.key}">
      ${t.icon?`<span style="font-size:10px">${t.icon}</span>`:''}${t.label}
      <button class="sq-token-x" onclick="event.stopPropagation();_sqRemoveToken('${t.type}','${t.key}')">×</button>
    </span>`).join('');
  // プレースホルダー
  const inp=document.getElementById('search-input');
  if(inp) inp.placeholder=sqTokens.length>0?'':`大会名・エリア・カテゴリで検索 / 絞り込み`;
  _sqRenderFilterBar();
  _sqUpdateIconState();
}

// ── サジェスト表示 ──
let _sqSuggestIdx=-1;
function _sqShowSuggest(q){
  const panel=document.getElementById('sq-suggest');
  if(!panel)return;
  // ★ 空欄時：最近の検索 + 人気キーワードを表示
  if(!q){
    const hasRecent=recentSearches.length>0;
    const hasPop=POPULAR_SEARCHES.length>0;
    if(!hasRecent&&!hasPop){_sqHideSuggest();return;}
    let html=`<div class="sq-suggest-empty-state">`;
    if(hasRecent){
      html+=`<div class="sq-suggest-empty-section">
        <span class="sq-suggest-empty-section-label">🕐 最近の検索</span>
        ${recentSearches.map(kw=>`<span class="sq-suggest-empty-item" onmousedown="event.preventDefault();_sqPickFreeText('${escapeHtml(kw)}')">${escapeHtml(kw)}</span>`).join('')}
      </div>`;
    }
    if(hasPop){
      html+=`<div class="sq-suggest-empty-section">
        <span class="sq-suggest-empty-section-label">🔥 人気</span>
        ${POPULAR_SEARCHES.map(kw=>`<span class="sq-suggest-empty-item" onmousedown="event.preventDefault();_sqPickFreeText('${escapeHtml(kw)}')">${escapeHtml(kw)}</span>`).join('')}
      </div>`;
    }
    html+=`</div>`;
    panel.innerHTML=html;
    panel.classList.add('show');
    return;
  }
  const kw=q.toLowerCase();
  const master=_getSqMaster();
  const matched=master.filter(item=>{
    if(sqTokens.find(t=>t.type===item.type&&t.key===item.key))return false; // 既に選択済みは除外
    return item.label.includes(kw)||item.sub.toLowerCase().includes(kw);
  }).slice(0,12);

  // 大会名での部分一致もサジェスト（最大3件）
  const tourMatches=TOURNAMENTS_FLAT
    .filter(t=>t.name.toLowerCase().includes(kw)&&!sqTokens.find(tk=>tk.type==='text'&&tk.key===t.name))
    .slice(0,3)
    .map(t=>({type:'text',key:t.name,label:t.name,icon:'🏌',sub:t.place}));

  if(!matched.length&&!tourMatches.length){_sqHideSuggest();return;}

  // セクション分け
  const sections=[];
  const areas=matched.filter(m=>m.type==='area');
  const prefs=matched.filter(m=>m.type==='pref');
  const cats=matched.filter(m=>m.type==='cat');
  if(areas.length) sections.push({label:'エリア',items:areas});
  if(prefs.length) sections.push({label:'都道府県',items:prefs});
  if(cats.length) sections.push({label:'カテゴリ',items:cats});
  if(tourMatches.length) sections.push({label:'大会名',items:tourMatches});

  const TYPE_COLOR={area:'#1A4A73',pref:'#2E7A5A',cat:'#6E2D78',text:'#A05C10'};
  const TYPE_BG={area:'#E0EEF8',pref:'#DCEEE5',cat:'#F0E6F8',text:'#F0E4C8'};
  panel.innerHTML=sections.map(sec=>`
    <div class="sq-suggest-section">
      <div class="sq-suggest-section-label">${sec.label}</div>
      ${sec.items.map((item,i)=>`
        <div class="sq-suggest-item" data-idx="${i}" data-type="${item.type}" data-key="${item.key}"
          onmousedown="event.preventDefault();_sqPickSuggest('${item.type}','${item.key}')">
          <div class="sq-suggest-item-icon" style="background:${TYPE_BG[item.type]||'#eee'};color:${TYPE_COLOR[item.type]||'#555'}">${item.icon||'🔍'}</div>
          <div class="sq-suggest-item-main">
            <div class="sq-suggest-item-label">${_sqHighlight(item.label,kw)}</div>
            ${item.sub?`<div class="sq-suggest-item-sub">${item.sub}</div>`:''}
          </div>
          <div class="sq-suggest-item-type" style="background:${TYPE_BG[item.type]};color:${TYPE_COLOR[item.type]}">${sec.label}</div>
        </div>`).join('')}
    </div>`).join('');
  _sqSuggestIdx=-1;
  panel.classList.add('show');
}
function _sqHideSuggest(){
  const p=document.getElementById('sq-suggest');
  if(p)p.classList.remove('show');
  _sqSuggestIdx=-1;
}
function _sqHighlight(text,kw){
  if(!kw)return text;
  const idx=text.toLowerCase().indexOf(kw);
  if(idx<0)return text;
  return text.slice(0,idx)+`<mark style="background:rgba(26,175,122,.25);border-radius:2px;padding:0 1px;">${text.slice(idx,idx+kw.length)}</mark>`+text.slice(idx+kw.length);
}

// サジェストアイテムをクリック
function _sqPickSuggest(type,key){
  const master=_getSqMaster();
  let item=master.find(x=>x.type===type&&x.key===key);
  if(!item){
    // text タイプ（大会名）
    item={type:'text',key,label:key,icon:'🏌'};
  }
  // pref選択時はareaKeyを補完
  if(type==='pref'){
    const m=master.find(x=>x.type==='pref'&&x.key===key);
    if(m) item={...item,areaKey:m.areaKey};
  }
  _sqAddToken(item);
}

// キーボードハンドリング
function _sqOnKeyDown(e){
  const panel=document.getElementById('sq-suggest');
  const items=panel?panel.querySelectorAll('.sq-suggest-item'):[];
  if(panel&&panel.classList.contains('show')&&items.length){
    if(e.key==='ArrowDown'){
      e.preventDefault();
      _sqSuggestIdx=Math.min(_sqSuggestIdx+1,items.length-1);
      items.forEach((el,i)=>el.classList.toggle('is-focused',i===_sqSuggestIdx));
      return;
    }
    if(e.key==='ArrowUp'){
      e.preventDefault();
      _sqSuggestIdx=Math.max(_sqSuggestIdx-1,0);
      items.forEach((el,i)=>el.classList.toggle('is-focused',i===_sqSuggestIdx));
      return;
    }
    if(e.key==='Enter'&&_sqSuggestIdx>=0){
      e.preventDefault();
      const focused=items[_sqSuggestIdx];
      if(focused) _sqPickSuggest(focused.dataset.type,focused.dataset.key);
      return;
    }
  }
  if(e.key==='Backspace'){
    const inp=document.getElementById('search-input');
    if(inp&&inp.value===''&&sqTokens.length>0){
      const last=sqTokens[sqTokens.length-1];
      _sqRemoveToken(last.type,last.key);
    }
  }
  if(e.key==='Escape') _sqHideSuggest();
  if(e.key==='Enter'){
    const inp=document.getElementById('search-input');
    const v=inp?inp.value.trim():'';
    if(v){
      // フリーテキストをトークンとして確定
      _sqAddToken({type:'text',key:v,label:v,icon:'🔍'});
      if(inp) inp.value='';
    }
    _sqHideSuggest();
  }
}

// input イベント
function _sqOnInput(){
  const inp=document.getElementById('search-input');
  const v=inp?inp.value:'';
  _sqShowSuggest(v.trim());
  applySearchFilters();
}

// 初期化（DOMロード後に呼ぶ）
// 虫眼鏡タップ：空欄→フィルター、入力中→サジェスト再表示
function _sqIconTap(){
  const inp=document.getElementById('search-input');
  const v=inp?inp.value.trim():'';
  if(!v && sqTokens.length===0){
    // 空欄→フィルターシートを開く
    openFilterSheet();
  } else if(v){
    // 入力中→サジェストを表示してinputにフォーカス
    inp.focus();
    _sqShowSuggest(v);
  } else {
    // トークンのみある→inputにフォーカス
    inp.focus();
  }
}

// アイコンボタンの状態を更新（可フィルター / 入力中 / フィルター適用中）
function _sqUpdateIconState(){
  const btn=document.getElementById('sq-icon-btn');
  if(!btn)return;
  const inp=document.getElementById('search-input');
  const hasInput=inp&&inp.value.trim().length>0;
  const hasFilters=sqTokens.length>0||fbsCats.size>0||fbsAreas.size>0||fbsPrefs.size>0;
  btn.classList.toggle('has-input',hasInput);
  btn.classList.toggle('can-filter',!hasInput&&!hasFilters);
  btn.classList.toggle('has-filters',hasFilters);
}

// フィルターバー（search-header直下）を更新
function _sqRenderFilterBar(){
  const bar=document.getElementById('sq-filter-bar');
  if(!bar)return;
  // sqTokens のうち cat/area/pref のみ表示（textはインライントークンで見える）
  const chips=sqTokens.filter(t=>t.type!=='text');
  if(!chips.length){bar.innerHTML='';return;}
  bar.innerHTML=chips.map(t=>`
    <span class="sq-fchip">
      ${t.icon?`<span style="font-size:10px">${t.icon}</span> `:''}${t.label}
      <button class="sq-fchip-x" onclick="_sqRemoveToken('${t.type}','${t.key}')">×</button>
    </span>`).join('');
}

// ★ NEW: フィルター保存・適用・削除
function _saveCurrentFilter(){
  const nameEl=document.getElementById('fbs-save-name');
  const name=(nameEl?nameEl.value.trim():'')||'保存フィルター';
  const cats=[..._fbsDraftCats];
  const areas=[..._fbsDraftAreas];
  const prefs=[..._fbsDraftPrefs];
  if(!cats.length&&!areas.length&&!prefs.length){showToast('絞り込み条件を選択してから保存してください');return;}
  savedFilters=[...savedFilters,{name,cats,areas,prefs}].slice(-10);
  saveSavedFilters();
  if(nameEl)nameEl.value='';
  _renderFbsSheet();
  showToast(`「${name}」を保存しました`);
}
function _applySavedFilter(idx){
  const sf=savedFilters[idx];if(!sf)return;
  _fbsDraftCats=new Set(sf.cats);
  _fbsDraftAreas=new Set(sf.areas);
  _fbsDraftPrefs=new Set(sf.prefs);
  _renderFbsSheet();
  showToast(`「${sf.name}」を適用`);
}
function _deleteSavedFilter(idx){
  savedFilters.splice(idx,1);
  saveSavedFilters();
  _renderFbsSheet();
}

// ★ リマインド：ラベルマスタ
const REMIND_LABELS={'30min':'30分前','1hour':'1時間前','sameDay':'当日朝','dayBefore':'前日','weekBefore':'1週間前'};

// ベルタップ：OFF→ONにしてシートを開く / ON→OFFに切り替え
function _toggleBell(tid){
  const cur=remindMap[tid]||{reminder:false,reminderTiming:[]};
  if(cur.reminder){
    // ON→OFF
    remindMap[tid]={reminder:false,reminderTiming:[]};
    saveRemind();
    _updateCardRemindUI(tid);
    showToast('🔕 リマインドをOFFにしました');
  } else {
    // OFF→ON：デフォルト「前日」でONにしてシートを開く
    const defKey=cur.reminderTiming&&cur.reminderTiming[0]?cur.reminderTiming[0]:'dayBefore';
    remindMap[tid]={reminder:true,reminderTiming:[defKey]};
    saveRemind();
    _updateCardRemindUI(tid);
    openRemindSheet(tid);
  }
  // ベルリングアニメ
  const bellBtn=document.getElementById('bell-'+tid);
  if(bellBtn){bellBtn.classList.add('ring');setTimeout(()=>bellBtn.classList.remove('ring'),500);}
}

// カード内のベル・ピルだけを即時更新（再描画なし）
function _updateCardRemindUI(tid){
  const state=remindMap[tid]||{reminder:false,reminderTiming:[]};
  const isOn=state.reminder;
  const key=state.reminderTiming&&state.reminderTiming[0];
  const label=key?REMIND_LABELS[key]:'タイミングを選択';
  const chevSvg=`<svg viewBox="0 0 10 10" fill="none"><polyline points="3.5,2.5 6.5,5 3.5,7.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  // ベル
  const bell=document.getElementById('bell-'+tid);
  if(bell) bell.classList.toggle('is-on',isOn);
  // ピル
  const pill=document.getElementById('pill-'+tid);
  if(pill){
    pill.classList.toggle('is-set',isOn);
    if(isOn){
      pill.innerHTML=label+chevSvg;
      // 表示アニメ（未表示→表示）
      pill.classList.remove('visible');
      requestAnimationFrame(()=>requestAnimationFrame(()=>pill.classList.add('visible')));
    } else {
      pill.classList.remove('visible');
      pill.innerHTML='タイミングを選択'+chevSvg;
    }
  }
}

// シートを開く
function openRemindSheet(tid){
  _remindTargetId=tid;
  const t=TOURNAMENTS_FLAT.find(x=>x.id===tid);
  const titleEl=document.getElementById('remind-sheet-name');
  if(titleEl) titleEl.textContent=t?t.name:'通知タイミング';
  const cur=remindMap[tid]||{reminder:false,reminderTiming:[]};
  _remindSelected=(cur.reminderTiming&&cur.reminderTiming.length>0)?cur.reminderTiming[0]:null;
  _refreshRemindUI();
  document.getElementById('remind-overlay').classList.add('show');
}
function closeRemindSheet(){
  document.getElementById('remind-overlay').classList.remove('show');
  _remindTargetId=null;
  _remindSelected=null;
}
// 時間選択 → 即時保存してシートを閉じる（保存ボタン不要）
function applyRemindSheet(){
  if(!_remindTargetId)return;
  const timing=_remindSelected?[_remindSelected]:[];
  remindMap[_remindTargetId]={reminder:timing.length>0,reminderTiming:timing};
  saveRemind();
  _scheduleRemindNotif(_remindTargetId);
  const tid=_remindTargetId;
  closeRemindSheet();
  _updateCardRemindUI(tid);
  const t=TOURNAMENTS_FLAT.find(x=>x.id===tid);
  const lbl=timing[0]?REMIND_LABELS[timing[0]]:'';
  if(timing.length>0) showToast(`🔔 ${lbl}に通知します`);
}
// 選択（タップで即時保存）
function _selectRemindOption(key){
  _remindSelected=(_remindSelected===key)?null:key;
  _refreshRemindUI();
  // 即時保存・閉じる
  applyRemindSheet();
}
// UIを現在の _remindSelected に合わせて更新
function _refreshRemindUI(){
  ['30min','1hour','sameDay','dayBefore','weekBefore'].forEach(k=>{
    const opt=document.getElementById('ropt-'+k);
    if(opt) opt.classList.toggle('is-checked',_remindSelected===k);
  });
}
// 通知スケジュール（仮実装）
function _scheduleRemindNotif(tid){
  const state=remindMap[tid];
  if(!state||!state.reminder)return;
  if(!('Notification' in window))return;
  if(Notification.permission==='default'){Notification.requestPermission();}
}

function initComplexSearch(){
  const inp=document.getElementById('search-input');
  const wrap=document.getElementById('search-box-wrap');
  if(!inp||!wrap)return;

  // ★ Phase3: 初回ガイド表示
  const GUIDE_KEY='pronexax.filterGuideShown.v1';
  if(!localStorage.getItem(GUIDE_KEY)){
    setTimeout(()=>{
      const iconBtn=document.getElementById('sq-icon-btn');
      if(!iconBtn)return;
      const tip=document.createElement('div');
      tip.className='sq-guide-tip';
      tip.textContent='🔍 タップで絞り込みできます';
      iconBtn.style.position='relative';
      iconBtn.appendChild(tip);
      setTimeout(()=>{if(tip.parentNode)tip.parentNode.removeChild(tip);},3500);
      localStorage.setItem(GUIDE_KEY,'1');
    },1200);
  }

  // ★ Phase3: debounce付き入力イベント（120ms）
  inp.addEventListener('input',()=>{
    _sqOnInput();
    _sqUpdateIconState();
    _invalidateSearchCache();
  });
  inp.addEventListener('keydown',_sqOnKeyDown);
  inp.addEventListener('focus',()=>{
    wrap.classList.add('is-focused');
    const v=inp.value.trim();
    _sqShowSuggest(v);
  });
  inp.addEventListener('blur',()=>{
    wrap.classList.remove('is-focused');
    setTimeout(_sqHideSuggest,150);
    _sqUpdateIconState();
  });

  // ★ Phase3: search-boxクリックでinputにfocus（passiveオプション付き）
  wrap.addEventListener('click',e=>{
    if(!e.target.closest('#sq-icon-btn')) inp.focus();
  },{ passive:true });

  _sqUpdateIconState();
}


// ================================================================
// ★★★ Phase3: 検索パフォーマンス最適化 ★★★
// ================================================================

// ── debounce ──
function _debounce(fn, ms){
  let t;
  return function(...args){
    clearTimeout(t);
    t = setTimeout(()=>fn.apply(this,args), ms);
  };
}

// ── フィルター用定数（tournamentCategories から自動生成）──
const _MENS_CATS   = new Set(window._TOUR_MASTER.filter(t=>t.gender==='mens').map(t=>t.key));
const _WOMENS_CATS = new Set(window._TOUR_MASTER.filter(t=>t.gender==='womens').map(t=>t.key));

// ── 前回の結果キャッシュ（同一フィルター条件なら再計算しない）──
let _lastFilterKey = null;
let _lastFilterResult = null;

function _buildFilterKey(){
  return JSON.stringify({
    gender:_searchGender,
    region:_searchRegion,
    group:_searchGroupKey,
    mode:searchMode,
    filter:searchFilter,
    areaFilter:searchAreaFilter,
    cats:[...fbsCats].sort(),
    areas:[...fbsAreas].sort(),
    prefs:[...fbsPrefs].sort(),
    tokens:sqTokens.map(t=>t.type+'|'+t.key).sort(),
    input:(document.getElementById('search-input')||{value:''}).value.trim().toLowerCase(),
    sort:sortByPrize,
    sortMode:typeof _sortMode!=='undefined'?_sortMode:'date',
    sortAsc:typeof _sortAsc!=='undefined'?_sortAsc:true,
  });
}

function applySearchFilters(){
  _updateFbsOpenBtn();
  _sqRenderTokens();
  // モードタブ反映（お気に入り/すべて）
  document.querySelectorAll('#search-mode-tabs .search-mode-tab').forEach(el=>{
    if(el.dataset.mode) el.classList.toggle('is-active',el.dataset.mode===searchMode);
  });
  renderSearchFilters();
  // フリーテキスト（トークン化されていない入力 + textトークン）
  const rawInput=(document.getElementById('search-input')||{value:''}).value.trim().toLowerCase();
  const textTokens=sqTokens.filter(t=>t.type==='text').map(t=>t.label.toLowerCase());
  const filterGrid=document.getElementById('filter-grid');
  const resultMeta=document.getElementById('result-meta');
  const list=document.getElementById('search-list');

  // ★★★ お気に入りタブ ★★★
  if(searchMode==='fav'){
    filterGrid.classList.add('is-hidden');
    resultMeta.classList.add('is-hidden');
    list.innerHTML=_buildFavTabHTML(rawInput);
    _bindFavTabEvents();
    return;
  }
  // ★★★ すべて表示タブ ★★★
  filterGrid.classList.remove('is-hidden');
  resultMeta.classList.remove('is-hidden');

  // ★ FIX: カテゴリ未追加でも検索結果を表示する
  // （カレンダーのオプトイン設定と検索は独立させる）
  // if(userEnabledCategories.length===0){ ... return; }  ← 削除

  // ── キャッシュチェック ──
  const filterKey = _buildFilterKey();
  if(filterKey === _lastFilterKey && _lastFilterResult){
    list.innerHTML = _lastFilterResult;
    _updateResultCount(_lastResultArr);
    return;
  }

  // ── catTokens・prefTokens・areaTokensを事前抽出 ──
  const catTokens  = sqTokens.filter(x=>x.type==='cat').map(x=>x.key);
  const prefTokens = sqTokens.filter(x=>x.type==='pref').map(x=>x.key);
  const areaTokens = sqTokens.filter(x=>x.type==='area').map(x=>x.key);
  const allTexts   = [...textTokens];
  if(rawInput) allTexts.push(rawInput);

  let arr=TOURNAMENTS_FLAT.filter(t=>{
    // ── 有効カテゴリ表示チェック ──
    // ★ FIX: 検索画面では全カテゴリを表示対象にする
    // （カレンダーのオプトイン設定は検索に影響させない）
    // userEnabledCategoriesが空でも検索結果を表示する
    // if(!isCatVisible(t.cat))return false;  ← 削除

    // ── 国内/海外フィルター ──
    if(_searchRegion==='domestic' && t.area==='overseas') return false;
    if(_searchRegion==='overseas' && t.area!=='overseas') return false;

    // ── 男女フィルター ──
    if(_searchGender==='mens'   && _WOMENS_CATS.has(t.cat)) return false;
    if(_searchGender==='womens' && _MENS_CATS.has(t.cat))   return false;

    // ── グループフィルター（階層型カテゴリー）──
    if(_searchGroupKey){
      const tourMeta = window._TOUR_MASTER.find(x=>x.key===t.cat);
      if(!tourMeta || tourMeta.groupKey !== _searchGroupKey) return false;
    }

    // ── カテゴリ判定 ──
    let mc;
    if(catTokens.length>0){
      mc=catTokens.some(k=>t.cat===k);
    } else if(fbsCats.size>0){
      mc=(fbsCats.has('added')&&addedIds.has(t.id))||
         [...fbsCats].filter(k=>k!=='added').some(k=>t.cat===k);
    } else {
      mc=searchFilter==='all'?true:searchFilter==='added'?addedIds.has(t.id):t.cat===searchFilter;
    }
    if(!mc)return false;

    // ── エリア・都道府県判定 ──
    let ac;
    if(prefTokens.length>0){
      ac=prefTokens.some(k=>t.prefecture===k);
    } else if(areaTokens.length>0){
      ac=areaTokens.some(k=>t.area===k);
    } else if(fbsPrefs.size>0){
      ac=fbsPrefs.has(t.prefecture);
    } else if(fbsAreas.size>0){
      ac=fbsAreas.has(t.area);
    } else {
      ac=searchAreaFilter===null?true:t.area===searchAreaFilter;
    }
    if(!ac)return false;

    // ── テキスト判定 ──
    if(allTexts.length>0){
      const haystack = (t.name+' '+t.place+' '+(t.courseName||'')).toLowerCase();
      if(!allTexts.every(kw=>haystack.includes(kw)))return false;
    }

    return true;
  });

  // ★ FIX: _sortMode/_sortAsc (p5SetSort) + sortByPrize を統合
  if(sortByPrize || _sortMode === 'prize'){
    arr.sort((a,b)=>(b.prize||'').localeCompare(a.prize||''));
  } else if(_sortMode === 'deadline'){
    arr.sort((a,b)=>{
      const ad = a.entryDeadline||'9999', bd = b.entryDeadline||'9999';
      return _sortAsc ? ad.localeCompare(bd) : bd.localeCompare(ad);
    });
  } else if(_sortMode === 'area'){
    arr.sort((a,b)=>_sortAsc ? (a.area||'').localeCompare(b.area||'') : (b.area||'').localeCompare(a.area||''));
  } else {
    // デフォルト: 日付順
    arr.sort((a,b)=>_sortAsc ? (a.start||'').localeCompare(b.start||'') : (b.start||'').localeCompare(a.start||''));
  }

  _lastResultArr = arr;
  _updateResultCount(arr);

  if(!arr.length){
    const emptyHtml=`<div class="search-empty">
      <div class="search-empty-icon">⛳</div>
      <div class="search-empty-title">該当する大会が見つかりません</div>
      <div class="search-empty-sub">条件を変えて再度お試しください</div>
    </div>`;
    list.innerHTML = emptyHtml;
    _lastFilterKey = filterKey;
    _lastFilterResult = emptyHtml;
    return;
  }

  // DocumentFragment で一括挿入（layout thrashing防止）
  const html = arr.map(_searchCardHTML).join('');
  list.innerHTML = html;

  // キャッシュ更新
  _lastFilterKey = filterKey;
  _lastFilterResult = html;
}

let _lastResultArr = [];

function _updateResultCount(arr){
  const filterLabels=[];
  if(fbsCats.size>0){[...fbsCats].forEach(k=>filterLabels.push(CAT_LABELS[k]||k));}
  else if(sqTokens.filter(t=>t.type==='cat').length>0){sqTokens.filter(t=>t.type==='cat').forEach(t=>filterLabels.push(t.label));}
  if(fbsPrefs.size>0){const PREF_L=Object.values(PREF_BY_AREA).flat().reduce((m,p)=>(m[p.key]=p.label,m),{});[...fbsPrefs].forEach(k=>filterLabels.push(PREF_L[k]||k));}
  else if(fbsAreas.size>0){const AREA_L={kanto:'関東',kansai:'関西',chubu:'中部',kyushu:'九州・沖縄',hokkaido:'北海道・東北',overseas:'海外'};[...fbsAreas].forEach(k=>filterLabels.push(AREA_L[k]||k));}
  const filterSuffix=filterLabels.length>0?` (${filterLabels.join(' / ')})`:'';
  const el=document.getElementById('result-count');
  if(el) el.textContent=`${arr.length}件表示中${filterSuffix}`;
}

// キャッシュ無効化（フィルター変更時に呼ぶ）
function _invalidateSearchCache(){
  _lastFilterKey=null;
  _lastFilterResult=null;
}

// debounce版（入力イベント用）
const applySearchFiltersDebounced = _debounce(()=>{
  _invalidateSearchCache();
  applySearchFilters();
}, 120);

// ★★★ お気に入りタブ：上部にカテゴリチップ列 + 下部に大会一覧 ★★★
function _buildFavTabHTML(q){
  // お気に入り対象の大会を抽出
  let favList=TOURNAMENTS_FLAT.filter(t=>favTours.has(t.cat)||favTournaments.has(t.id));
  // 検索文字での絞り込み
  if(q){
    favList=favList.filter(t=>t.name.toLowerCase().includes(q)||t.place.toLowerCase().includes(q));
  }
  // 並び順：開催中 → 予定 → 終了、その中で日付昇順
  favList.sort((a,b)=>{
    const sa=_searchStatus(a),sb=_searchStatus(b);
    const rank={live:0,upcoming:1,ended:2};
    if(rank[sa]!==rank[sb])return rank[sa]-rank[sb];
    return (a.start||'').localeCompare(b.start||'');
  });

  // お気に入りタブ内で実際に存在するカテゴリ（大会の cat の集合）— 0件カテゴリは出さない
  const allFavList=TOURNAMENTS_FLAT.filter(t=>favTours.has(t.cat)||favTournaments.has(t.id));
  const presentCats=new Set(allFavList.map(t=>t.cat));
  const catChips=CATEGORIES.filter(c=>presentCats.has(c.key)&&c.key!=='personal');

  // カテゴリ絞り込みを適用
  let filtered=favList;
  if(favCatFilter){
    filtered=favList.filter(t=>t.cat===favCatFilter);
  }

  // チップ列HTML（カテゴリチップ：filter-chipクラスを共有して見た目統一）
  let chipsHtml='';
  if(catChips.length>0){
    chipsHtml=`<div class="fav-tab-cat-row">
      <button class="filter-chip${favCatFilter===null?' active':''}" data-key="all" data-fav-cat="">すべて</button>
      ${catChips.map(c=>`
        <button class="filter-chip${favCatFilter===c.key?' active':''}" data-key="${c.key}" data-fav-cat="${c.key}">${escapeHtml(c.label)}</button>
      `).join('')}
    </div>`;
  }

  // 大会リストHTML
  let listHtml='';
  if(allFavList.length===0){
    listHtml=`<div class="search-section-empty" style="margin-top:6px;">
      まだお気に入りがありません<br>
      「すべて表示」タブで大会カードの ★ や、フィルタの ★ をタップして登録できます
    </div>`;
  }else if(filtered.length===0){
    listHtml=`<div class="search-section-empty" style="margin-top:6px;">
      ${q?'検索条件に一致する':'このカテゴリの'}お気に入りはありません
    </div>`;
  }else{
    // セクション見出し
    const headLabel=favCatFilter
      ?`⭐ お気に入り（${(CATEGORIES.find(c=>c.key===favCatFilter)||{}).label||favCatFilter}）`
      :'⭐ お気に入り';
    listHtml=`<div class="search-section-head">
      <span class="search-section-title">${headLabel}</span>
      <span class="search-section-count">${filtered.length}件</span>
    </div>`+filtered.map(_searchCardHTML).join('');
  }

  // 「最近追加した大会」セクション（検索文字なし & カテゴリ絞り込みなしのときのみ表示）
  let recentHtml='';
  if(!q&&!favCatFilter){
    const recentList=recentAddedIds
      .map(id=>TOURNAMENTS_FLAT.find(t=>t.id===id))
      .filter(Boolean)
      .slice(0,5);
    if(recentList.length){
      recentHtml=`<div class="search-section-head">
        <span class="search-section-title">🕒 最近追加した大会</span>
        <span class="search-section-count">${recentList.length}件</span>
      </div>`+recentList.map(_searchCardHTML).join('');
    }
  }

  return chipsHtml+listHtml+recentHtml;
}

// お気に入りタブのチップタップ：タブ移動はしない、ローカルフィルタのみ
function _bindFavTabEvents(){
  const list=document.getElementById('search-list');
  const row=list.querySelector('.fav-tab-cat-row');
  if(!row||row._bound)return;
  row._bound=true;
  row.addEventListener('click',e=>{
    const chip=e.target.closest('.filter-chip');
    if(!chip||!chip.hasAttribute('data-fav-cat'))return;
    const cat=chip.dataset.favCat||null;
    // トグル：同じカテゴリ再タップで解除
    if(favCatFilter===cat||(!cat&&favCatFilter===null)){
      favCatFilter=null;
    }else{
      favCatFilter=cat;
    }
    // タブはそのまま、お気に入りタブ内でだけ再描画
    applySearchFilters();
  });
}

function toggleSearchCard(id){openSearchCard=openSearchCard===id?null:id;applySearchFilters();}
function toggleSearchAdd(id){
  const t=TOURNAMENTS_FLAT.find(t=>t.id===id);if(!t)return;
  if(addedIds.has(id)){
    addedIds.delete(id);
    EVENTS=EVENTS.filter(e=>!(e.name===t.name&&e.date===t.start&&e.cat===t.cat));
    // 最近追加から除外
    recentAddedIds=recentAddedIds.filter(x=>x!==id);
    saveSearchPrefs();
    showToast(`「${t.name}」をカレンダーから削除しました`);
  }else{
    addedIds.add(id);
    const _dl=(()=>{const d=new Date(t.start);d.setDate(d.getDate()-7);return dsFromDate(d);})();
    EVENTS.push({
      id:nextId++,name:t.name,date:t.start,end:t.end,place:t.place,cat:t.cat,
      entryDeadline:_dl,
      entryStatus:'open',
      notif:Object.assign({},NOTIF_DEFAULTS),
    });
    // 最近追加を更新（先頭に追加、重複除去、5件まで）
    recentAddedIds=[id,...recentAddedIds.filter(x=>x!==id)].slice(0,5);
    saveSearchPrefs();
    showToast(`「${t.name}」をカレンダーに追加しました ✓`);
  }
  applySearchFilters();renderAllPanels();renderCalList();
}
// ★★★ カレンダーセルをタップして「予定追加」を開く統一エントリー ★★★
// cellDate: タップしたセルが持つ実日付。Date オブジェクト or 'YYYY-MM-DD' 文字列。
// 月送り後でも、必ず "タップしたセルが持つ実 Date" を渡すこと
// （year / month グローバルから現在月で再構築してはいけない）。
function openCreateModal(cellDate){
  let ds;
  if(cellDate instanceof Date && !isNaN(cellDate.getTime())){
    ds=dsFromDate(cellDate);
  }else if(typeof cellDate==='string' && cellDate){
    ds=cellDate;
  }else{
    ds=todayStr();
    console.warn('[openCreateModal] cellDate が無いため今日を使用（呼び出し側を確認）');
  }
  selectedDate=ds;
  newlyAddedDate=null;
  modalPresetDate=ds;
  console.log('[openCreateModal] cellDate=',cellDate,' → selectedDate=',selectedDate);
  openModal(ds);
}
function openModal(ds,editId){
  // ★ UTC日付ズレ修正：dsが文字列の場合はselectedDateを必ず先に同期してからモーダルを開く
  if(ds&&typeof ds==='string'){
    modalPresetDate=ds;
    selectedDate=ds; // state更新前にmodalが開くバグを防ぐ
  }else{
    modalPresetDate=ds||null;
  }
  selectedTour=null;
  // ★ デバッグ確認ログ（iPhone Safari / PWA でも console で確認可能）
  console.log('[openModal] tappedDate(ds)=',ds,' / selectedDate=',selectedDate,' / modalPresetDate=',modalPresetDate);
  if(editId){const ev=EVENTS.find(e=>e.id===editId);if(!ev)return;editingId=editId;selectedCat=ev.cat;currentStep=3;goStep(3);prefillFormFromEvent(ev);}
  else{editingId=null;selectedCat=null;currentStep=1;goStep(1);}
  document.getElementById('modal-overlay').classList.add('show');
}
function closeModal(){
  document.getElementById('modal-overlay').classList.remove('show');
  editingId=null;
  // Day View 用の時刻ヒントをクリア
  if(typeof dvPresetStartTime!=='undefined')dvPresetStartTime=null;
  // 並び替えモードを解除
  if(catReorderMode)toggleCatReorder();
}
function handleOverlayClick(e){/* drag-free版: ontouchendで処理 */}
function goStep(n){
  // ステップ遷移時は並び替えモードを解除（誤操作防止）
  if(n!==1&&catReorderMode)toggleCatReorder();
  currentStep=n;document.querySelectorAll('.mstep').forEach(s=>s.classList.remove('active'));document.getElementById('mstep'+n).classList.add('active');
  const titleEl=document.getElementById('modal-title');const isEdit=!!editingId;
  if(isEdit){titleEl.classList.add('edit-mode');titleEl.textContent='✎ 予定を編集';}
  else{titleEl.classList.remove('edit-mode');const titles={1:'カテゴリを選択',2:'大会を選択',3:'詳細を確認・入力'};titleEl.textContent=titles[n];}
  const footer=document.getElementById('modal-footer'),btn=document.getElementById('modal-next-btn');
  if(n===1){selectedCat=null;selectedTour=null;tourLastClick={t:0,idx:-1,q:''};renderCatGrid();footer.classList.add('footer-hidden');}
  else if(n===2){footer.classList.remove('footer-hidden');btn.textContent='次へ';btn.disabled=!selectedTour;}
  else{footer.classList.remove('footer-hidden');btn.textContent=isEdit?'変更を保存する':'カレンダーに追加する';checkSubmit();const backBtn=document.getElementById('btn-back-step3');if(isEdit){backBtn.style.display='none';}else{backBtn.style.display='';}}
  document.getElementById('modal-scroll').scrollTop=0;
}
function renderCatGrid(){
  const grid=document.getElementById('cat-grid');
  const visible=CATEGORIES.filter(c=>c.key==='personal'||userEnabledCategories.includes(c.key));
  grid.innerHTML=visible.map(c=>{
    const isSel=selectedCat===c.key;
    const isEnabled=c.key==='personal'||userEnabledCategories.includes(c.key);
    const selStyle=isSel?`border-color:${c.color};background:${c.color}12`:'';
    // ★ 「追加済み」バッジは廃止：追加済み状態は .is-enabled クラスのみで管理し、
    //    Apple純正カレンダー風に枠線をカテゴリカラーで軽く強調するだけにする
    const enabledStyle=isEnabled&&!isSel?`border-color:${c.color}66;`:'';
    return`<div class="cat-item${isSel?' sel':''}${isEnabled?' is-enabled':''}" style="${selStyle}${enabledStyle}" id="cat-${c.key}" data-cat-key="${c.key}"><div class="cat-color-dot" style="background:${c.color}"></div><div style="flex:1;"><div class="cat-name">${c.label}</div><div class="cat-desc">${c.desc}</div></div><div class="cat-check" style="color:${c.color}">✓</div></div>`;
  }).join('');
  grid.classList.toggle('reorder-mode',catReorderMode);
  // ★ クリック / ドラッグハンドラを取り付け
  bindCatItemHandlers();
}
// ★★★ カテゴリ並び替え機能 ★★★
let catReorderMode=false;
const catReorder={
  pressTimer:null,
  startX:0,startY:0,
  sourceKey:null,        // 移動対象のカテゴリkey
  sourceEl:null,         // 元要素（プレースホルダー化）
  cloneEl:null,          // フロート要素
  active:false,          // 長押し成立
  started:false,         // 実ドラッグ開始
  currentDropTarget:null,
};
const CAT_DRAG_LP_MS=350;
const CAT_DRAG_THRESHOLD=6;

function toggleCatReorder(){
  catReorderMode=!catReorderMode;
  const btn=document.getElementById('cat-reorder-btn');
  const lbl=document.getElementById('cat-reorder-btn-label');
  const icon=document.getElementById('cat-reorder-btn-icon');
  const hint=document.getElementById('cat-reorder-hint');
  if(catReorderMode){
    btn.classList.add('active');
    lbl.textContent='完了';
    icon.textContent='✓';
    hint.style.display='flex';
  }else{
    btn.classList.remove('active');
    lbl.textContent='並び替え';
    icon.textContent='⇅';
    hint.style.display='none';
  }
  document.getElementById('cat-grid').classList.toggle('reorder-mode',catReorderMode);
}

function bindCatItemHandlers(){
  const grid=document.getElementById('cat-grid');
  if(!grid)return;
  // タッチ系：長押し→ドラッグ
  grid.querySelectorAll('.cat-item').forEach(el=>{
    el.addEventListener('touchstart',e=>onCatItemTouchStart(e,el),{passive:false});
    el.addEventListener('touchmove',e=>onCatItemTouchMove(e),{passive:false});
    el.addEventListener('touchend',e=>onCatItemTouchEnd(e,el),{passive:false});
    el.addEventListener('touchcancel',()=>cancelCatReorder(),{passive:true});
    // マウス：通常クリックとドラッグ両対応
    el.addEventListener('mousedown',e=>onCatItemMouseDown(e,el));
    el.addEventListener('click',e=>onCatItemClick(e,el));
  });
}

function onCatItemClick(e,el){
  // 並び替えモード中はクリック無効
  if(catReorderMode)return;
  // ドラッグ完了直後のclickを抑止
  if(catReorder.started)return;
  selectCatAuto(el.dataset.catKey,e);
}

function onCatItemTouchStart(e,el){
  if(!catReorderMode)return; // 通常モードはclickで処理
  const t=e.touches[0];
  catReorder.startX=t.clientX;catReorder.startY=t.clientY;
  catReorder.sourceKey=el.dataset.catKey;
  catReorder.sourceEl=el;
  catReorder.active=false;catReorder.started=false;
  e.preventDefault(); // 並び替えモード中はスクロールよりドラッグ優先
  catReorder.pressTimer=setTimeout(()=>{
    catReorder.active=true;
    if(navigator.vibrate)navigator.vibrate(15);
  },CAT_DRAG_LP_MS);
}

function onCatItemTouchMove(e){
  if(!catReorderMode||!catReorder.sourceKey)return;
  if(catReorder.started){
    e.preventDefault();
    moveCatClone(e);
    return;
  }
  const t=e.touches[0];
  const dx=t.clientX-catReorder.startX,dy=t.clientY-catReorder.startY;
  if(catReorder.active&&Math.hypot(dx,dy)>CAT_DRAG_THRESHOLD){
    e.preventDefault();
    beginCatDrag(e);
  }else if(!catReorder.active&&Math.hypot(dx,dy)>CAT_DRAG_THRESHOLD){
    // 長押し前に動いた → スクロールに譲る
    cancelCatReorder();
  }
}

function onCatItemTouchEnd(e,el){
  if(!catReorderMode)return;
  if(catReorder.started){endCatDrag(e);return;}
  // 長押し成立後タップ（動かなかった）→ なにもしない（モード中はキャンセル扱い）
  cancelCatReorder();
}

function onCatItemMouseDown(e,el){
  if(!catReorderMode)return;
  e.preventDefault();
  catReorder.startX=e.clientX;catReorder.startY=e.clientY;
  catReorder.sourceKey=el.dataset.catKey;
  catReorder.sourceEl=el;
  catReorder.active=false;catReorder.started=false;
  catReorder.pressTimer=setTimeout(()=>{
    catReorder.active=true;
  },CAT_DRAG_LP_MS);
  const onMove=(ev)=>{
    if(!catReorder.sourceKey)return;
    if(catReorder.started){moveCatClone(ev);return;}
    const dx=ev.clientX-catReorder.startX,dy=ev.clientY-catReorder.startY;
    if(catReorder.active&&Math.hypot(dx,dy)>CAT_DRAG_THRESHOLD){beginCatDrag(ev);}
    else if(!catReorder.active&&Math.hypot(dx,dy)>CAT_DRAG_THRESHOLD){cancelCatReorder();cleanup();}
  };
  const onUp=(ev)=>{
    if(catReorder.started){endCatDrag(ev);}else{cancelCatReorder();}
    cleanup();
  };
  const cleanup=()=>{
    document.removeEventListener('mousemove',onMove);
    document.removeEventListener('mouseup',onUp);
  };
  document.addEventListener('mousemove',onMove);
  document.addEventListener('mouseup',onUp);
}

function beginCatDrag(e){
  catReorder.started=true;
  const src=catReorder.sourceEl;
  if(!src)return;
  // フロートクローン作成
  const rect=src.getBoundingClientRect();
  const clone=src.cloneNode(true);
  clone.classList.add('cat-drag-clone');
  clone.classList.remove('sel','tapping');
  clone.style.width=rect.width+'px';
  clone.style.height=rect.height+'px';
  clone.removeAttribute('id');
  document.body.appendChild(clone);
  catReorder.cloneEl=clone;
  // 元要素はプレースホルダー化
  src.classList.add('cat-placeholder');
  moveCatClone(e);
}

function moveCatClone(e){
  const t=e.touches?e.touches[0]:e;
  const x=t.clientX,y=t.clientY;
  if(catReorder.cloneEl){
    catReorder.cloneEl.style.left=x+'px';
    catReorder.cloneEl.style.top=y+'px';
  }
  // ドロップターゲット検出（クローンは pointer-events:none なので素通り）
  const elBelow=document.elementFromPoint(x,y);
  const targetItem=elBelow?elBelow.closest('.cat-item'):null;
  // 元要素自身はターゲットにしない
  let validTarget=null;
  if(targetItem&&targetItem!==catReorder.sourceEl&&!targetItem.classList.contains('cat-placeholder')){
    validTarget=targetItem;
  }
  if(catReorder.currentDropTarget&&catReorder.currentDropTarget!==validTarget){
    catReorder.currentDropTarget.classList.remove('cat-drop-target');
  }
  if(validTarget&&validTarget!==catReorder.currentDropTarget){
    validTarget.classList.add('cat-drop-target');
  }
  catReorder.currentDropTarget=validTarget;
  // ★ ライブ並び替え：ターゲット要素を超えたらDOMを実際に並び替えて見た目を即座に更新
  if(validTarget){
    const tRect=validTarget.getBoundingClientRect();
    const tCenter=tRect.top+tRect.height/2;
    const grid=document.getElementById('cat-grid');
    // 中心より上ならターゲットの前に挿入、下なら後に挿入
    if(y<tCenter){
      if(catReorder.sourceEl.nextSibling!==validTarget){
        grid.insertBefore(catReorder.sourceEl,validTarget);
      }
    }else{
      if(validTarget.nextSibling!==catReorder.sourceEl){
        grid.insertBefore(catReorder.sourceEl,validTarget.nextSibling);
      }
    }
  }
}

function endCatDrag(e){
  // クローン除去
  if(catReorder.cloneEl){catReorder.cloneEl.remove();}
  if(catReorder.sourceEl){catReorder.sourceEl.classList.remove('cat-placeholder');}
  if(catReorder.currentDropTarget){catReorder.currentDropTarget.classList.remove('cat-drop-target');}
  // ★ DOM順序から CATEGORIES 配列を再構築
  const grid=document.getElementById('cat-grid');
  const newOrder=[];
  grid.querySelectorAll('.cat-item').forEach(el=>{
    const k=el.dataset.catKey;
    const c=CATEGORIES.find(x=>x.key===k);
    if(c)newOrder.push(c);
  });
  if(newOrder.length===CATEGORIES.length){
    CATEGORIES.length=0;
    newOrder.forEach(c=>CATEGORIES.push(c));
    saveCatOrder();
    // 凡例にも順序を反映
    renderCatLegend();
    showToast('カテゴリの並び順を保存しました');
  }
  // 状態クリア
  catReorder.sourceKey=null;catReorder.sourceEl=null;
  catReorder.active=false;catReorder.cloneEl=null;
  catReorder.currentDropTarget=null;
  // クリック抑止のため少しだけ started を残す
  setTimeout(()=>{catReorder.started=false;},250);
  clearTimeout(catReorder.pressTimer);
}

function cancelCatReorder(){
  clearTimeout(catReorder.pressTimer);
  if(catReorder.cloneEl){catReorder.cloneEl.remove();}
  if(catReorder.sourceEl){catReorder.sourceEl.classList.remove('cat-placeholder');}
  if(catReorder.currentDropTarget){catReorder.currentDropTarget.classList.remove('cat-drop-target');}
  catReorder.sourceKey=null;catReorder.sourceEl=null;
  catReorder.active=false;catReorder.started=false;
  catReorder.cloneEl=null;catReorder.currentDropTarget=null;
}
function selectCatAuto(key,e){
  selectedCat=key;selectedTour=null;const el=document.getElementById('cat-'+key),cat=CATEGORIES.find(c=>c.key===key);
  const rect=el.getBoundingClientRect(),ripple=document.createElement('div');ripple.className='cat-ripple';const sz=Math.max(el.offsetWidth,el.offsetHeight)*2;
  ripple.style.cssText=`width:${sz}px;height:${sz}px;left:${(e.clientX-rect.left)-sz/2}px;top:${(e.clientY-rect.top)-sz/2}px;background:${cat?cat.color:'#1AAF7A'};`;
  el.appendChild(ripple);setTimeout(()=>ripple.remove(),500);
  el.classList.add('sel','tapping');el.style.borderColor=cat?cat.color:'';el.style.background=cat?cat.color+'12':'';
  setTimeout(()=>{el.classList.remove('tapping');key==='personal'?(goStep(3),prefillForm(null)):(document.getElementById('tour-search').value='',renderTourList(),goStep(2));},250);
}
function backFromStep3(){selectedCat==='personal'?goStep(1):goStep(2);}
function renderTourList(q=''){
  const cat=CATEGORIES.find(c=>c.key===selectedCat);document.getElementById('cat-label-sub').textContent=cat?cat.label:'';
  const tours=DB[selectedCat]||[];const filtered=q?tours.filter(t=>t.name.includes(q)||(t.place||'').includes(q)):tours;
  if(!filtered.length){document.getElementById('tour-list').innerHTML=`<div style="font-size:11px;color:#9BB8AE;padding:8px 0;">該当する大会がありません</div>`;return;}
  document.getElementById('tour-list').innerHTML=filtered.map((t,i)=>{
    const isSel=selectedTour&&selectedTour.name===t.name;
    const dateStr=(t.start||'').slice(5).replace('-','/')+' 〜 '+(t.end||'').slice(5).replace('-','/');
    return`<div class="tour-item${isSel?' sel':''}" style="${isSel&&cat?`border-color:${cat.color};`:''}" id="tour-item-${i}" onclick="onTourClick(${i},'${q.replace(/'/g,"\\'")}')"><div class="tour-item-name">${t.name}</div><div class="tour-item-meta">${dateStr} ｜ ${t.place||''}</div>${isSel?'<div class="tour-item-badge">⚡ ダブルタップで即追加</div>':''}</div>`;
  }).join('');
}
function filterTourList(){tourLastClick={t:0,idx:-1,q:''};renderTourList(document.getElementById('tour-search').value.trim());}
function onTourClick(idx,q){
  const now=Date.now(),tours=DB[selectedCat]||[];const filtered=q?tours.filter(t=>t.name.includes(q)||t.place.includes(q)):tours;const tour=filtered[idx];
  if(idx===tourLastClick.idx&&q===tourLastClick.q&&now-tourLastClick.t<DC){tourLastClick={t:0,idx:-1,q:''};const el=document.getElementById('tour-item-'+idx);if(el){el.classList.add('flash');setTimeout(()=>{selectedTour=tour;goStep(3);prefillForm(selectedTour);},220);}else{selectedTour=tour;goStep(3);prefillForm(selectedTour);}return;}
  tourLastClick={t:now,idx,q};selectedTour=tour;renderTourList(q);document.getElementById('modal-next-btn').disabled=false;
}
function prefillForm(tour){
  const banner=document.getElementById('edit-banner');banner.style.display='none';
  if(tour){document.getElementById('input-title').value=tour.name;document.getElementById('input-place').value=tour.place;document.getElementById('input-start').value=tour.start;document.getElementById('input-end').value=tour.end;document.getElementById('input-memo').value='';const cat=CATEGORIES.find(c=>c.key===selectedCat);document.getElementById('sel-preview').innerHTML=`<div class="sel-preview" style="border-left-color:${cat?cat.color:'#1AAF7A'}"><div class="sel-preview-name">${tour.name}</div><div class="sel-preview-meta">${tour.start.slice(5).replace('-','/')} 〜 ${tour.end.slice(5).replace('-','/')} ｜ ${tour.place}</div></div>`;}
  else{const def=defaultDateStr();['input-title','input-place','input-memo'].forEach(id=>document.getElementById(id).value='');document.getElementById('input-start').value=def;document.getElementById('input-end').value=def;document.getElementById('sel-preview').innerHTML='';}
  checkSubmit();
}
function prefillFormFromEvent(ev){
  const cat=CATEGORIES.find(c=>c.key===ev.cat)||{};
  document.getElementById('input-title').value=ev.name;document.getElementById('input-place').value=ev.place||'';document.getElementById('input-start').value=ev.date;document.getElementById('input-end').value=ev.end;document.getElementById('input-memo').value=ev.memo||'';
  document.getElementById('edit-banner').innerHTML=`<div class="edit-banner"><span style="font-size:14px;">✎</span><div style="flex:1;"><div class="edit-banner-text">編集中：${cat.label||ev.cat}</div><div style="font-size:9px;color:var(--green-dark);opacity:.7;margin-top:1px;">変更後「変更を保存する」を押してください</div></div><span class="cat-color-dot" style="background:${cat.color||'#1AAF7A'};width:14px;height:14px;border-radius:4px;"></span></div>`;
  document.getElementById('edit-banner').style.display='block';document.getElementById('sel-preview').innerHTML='';checkSubmit();
}
function checkSubmit(){const t=document.getElementById('input-title').value.trim(),s=document.getElementById('input-start').value;document.getElementById('modal-next-btn').disabled=!(t&&s);}
function handleNextBtn(){if(currentStep===2){if(!selectedTour)return;goStep(3);prefillForm(selectedTour);}else if(currentStep===3){submitEvent();}}
function submitEvent(){
  const title=document.getElementById('input-title').value.trim();const place=document.getElementById('input-place').value.trim();const start=document.getElementById('input-start').value;const end=document.getElementById('input-end').value||start;const memo=document.getElementById('input-memo').value.trim();
  if(!selectedCat||!title||!start)return;
  if(editingId){
    const idx=EVENTS.findIndex(e=>e.id===editingId);
    if(idx>=0){const old=EVENTS[idx];const oldDb=DB[old.cat]||[];const oldIdx=oldDb.findIndex(t=>t.name===old.name);if(oldIdx>=0)addedIds.delete(`${old.cat}-${oldIdx}`);
      EVENTS[idx]={...EVENTS[idx],name:title,date:start,end:end,place,memo,cat:selectedCat};
      const newDb=DB[selectedCat]||[];const newIdx=newDb.findIndex(t=>t.name===title);if(newIdx>=0)addedIds.add(`${selectedCat}-${newIdx}`);}
    closeModal();newlyAddedDate=start;selectedDate=start;modalPresetDate=null;renderAllPanels();renderCalList();showToast(`「${title}」を更新しました ✎`);
  } else {
    const _dl=(()=>{if(!start)return null;const[_sy,_sm,_sd]=start.split('-').map(Number);const d=new Date(_sy,_sm-1,_sd);d.setDate(d.getDate()-7);return dsFromDate(d);})();
    EVENTS.push({
      id:nextId++,name:title,date:start,end:end||start,place,memo,cat:selectedCat,
      entryDeadline:_dl,
      entryStatus:'open',
      notif:Object.assign({},NOTIF_DEFAULTS),
    });
    closeModal();newlyAddedDate=start;selectedDate=start;modalPresetDate=null;renderAllPanels();renderCalList();showToast(`「${title}」を追加しました`);
  }
}
// ════════════════════════════════════════════════════════════════
// ★★★ エントリー締切＆通知機能 ★★★
// ════════════════════════════════════════════════════════════════
const NOTIF_DEFAULTS={threeDaysBefore:false,oneDayBefore:true,sameDay:true,oneHourBefore:false};
const NOTIF_SENT_KEY='pronexax.notifSent.v1';
const NOTIF_PERM_KEY='pronexax.notifPermAsked.v1';
let _notifTimer=null;

// 既存イベントに締切・通知設定の欠損を埋める
function migrateEventsForDeadline(){
  EVENTS.forEach(e=>{
    // 締切：開始日の7日前をデフォルト
    if(e.entryDeadline===undefined){
      if(e.date){
        const [_my,_mm,_md]=e.date.split('-').map(Number);
        const d=new Date(_my,_mm-1,_md);d.setDate(d.getDate()-7);
        e.entryDeadline=dsFromDate(d);
      }else{
        e.entryDeadline=null;
      }
    }
    if(!e.entryStatus)e.entryStatus='open'; // 'open' | 'entered'
    if(!e.notif)e.notif=Object.assign({},NOTIF_DEFAULTS);
  });
}

// 締切日との差分日数（今日0時基準。負＝過ぎた／0＝当日／正＝あと何日）
function _deadlineDays(ev){
  if(!ev||!ev.entryDeadline)return null;
  const d0=new Date();d0.setHours(0,0,0,0);
  // ★ UTC日付ズレ修正: ローカル日付として生成
  const [_dy,_dm,_dd]=ev.entryDeadline.split('-').map(Number);
  const d1=new Date(_dy,_dm-1,_dd);d1.setHours(0,0,0,0);
  return Math.round((d1-d0)/86400000);
}

// 締切ラベル＋色クラス（個人イベントは対象外）
function deadlineState(ev){
  if(!ev||!ev.entryDeadline||ev.cat==='personal')return null;
  if(ev.entryStatus==='entered')return{label:'✓ エントリー済',cls:'entered',days:null};
  const days=_deadlineDays(ev);
  if(days===null)return null;
  if(days<0)return{label:`締切終了（${-days}日前）`,cls:'past',days};
  if(days===0)return{label:'🔥 本日締切',cls:'today',days};
  if(days===1)return{label:'⚠️ 明日締切',cls:'soon',days};
  if(days<=2)return{label:`⚠️ あと${days}日`,cls:'soon',days};
  if(days<=7)return{label:`あと${days}日`,cls:'near',days};
  // 8日以上先：簡易表示
  const md=ev.entryDeadline.slice(5).replace('-','/');
  return{label:`締切 ${md}`,cls:'normal',days};
}

// イベント状態切替
function setEntryStatus(eid,status){
  const ev=EVENTS.find(e=>e.id===eid);if(!ev)return;
  ev.entryStatus=status;
  renderAllPanels();renderCalList();
}
function toggleNotifFlag(eid,key){
  const ev=EVENTS.find(e=>e.id===eid);if(!ev)return;
  if(!ev.notif)ev.notif=Object.assign({},NOTIF_DEFAULTS);
  ev.notif[key]=!ev.notif[key];
}

// ──── 通知エンジン ────
function _notifSentLoad(){
  try{const r=localStorage.getItem(NOTIF_SENT_KEY);return r?JSON.parse(r):{};}catch(e){return{};}
}
function _notifSentSave(o){try{localStorage.setItem(NOTIF_SENT_KEY,JSON.stringify(o));}catch(e){}}
function _notifKey(eid,channel,dateStr){return `${eid}:${channel}:${dateStr}`;}

// 通知許可（必要時のみ穏やかに依頼）
async function _ensureNotifPermission(){
  if(!('Notification' in window))return false;
  if(Notification.permission==='granted')return true;
  if(Notification.permission==='denied')return false;
  // 'default'：一度だけリクエスト
  if(localStorage.getItem(NOTIF_PERM_KEY))return false;
  try{localStorage.setItem(NOTIF_PERM_KEY,'1');}catch(e){}
  try{const r=await Notification.requestPermission();return r==='granted';}catch(e){return false;}
}

function _sendBrowserNotif(title,body){
  if('Notification' in window&&Notification.permission==='granted'){
    try{new Notification(title,{body,silent:false});return true;}catch(e){}
  }
  // フォールバック：ブラウザ通知NGならアプリ内トーストで代替
  if(typeof showToast==='function')showToast(`🔔 ${title}：${body}`);
  return false;
}

// 通知タイミング判定 + 送信。集約も実施。
function runNotificationCheck(){
  const now=new Date();
  const hh=now.getHours();
  const today=dsFromDate(now);
  const sent=_notifSentLoad();
  // 当日 9時 のまとめ通知（前日通知は前日 9時、当日通知は当日 9時）
  // hourly チェックなので、9〜10時帯で実行されるよう判定
  const inMorningWindow=hh===9; // 1時間枠
  // 1時間前通知は分単位を見る
  const target=EVENTS.filter(e=>e.entryDeadline&&e.entryStatus!=='entered'&&e.cat!=='personal');

  // ── 当日締切：9時に1度（同日複数件はまとめて1通知） ──
  if(inMorningWindow){
    const todayEvs=target.filter(e=>e.entryDeadline===today&&e.notif&&e.notif.sameDay);
    if(todayEvs.length>0){
      const k=`bundle:sameDay:${today}`;
      if(!sent[k]){
        sent[k]=Date.now();
        const title=todayEvs.length===1?'🔥 本日が締切です':`🔥 本日締切の試合が${todayEvs.length}件あります`;
        const body=todayEvs.map(e=>'・'+e.name).join('\n');
        _sendBrowserNotif(title,body);
      }
    }
    // ── 前日締切：締切の前日9時 ──
    const tomorrow=(()=>{const d=new Date();d.setDate(d.getDate()+1);return dsFromDate(d);})();
    const tomorrowEvs=target.filter(e=>e.entryDeadline===tomorrow&&e.notif&&e.notif.oneDayBefore);
    if(tomorrowEvs.length>0){
      const k=`bundle:oneDay:${today}`;
      if(!sent[k]){
        sent[k]=Date.now();
        const title=tomorrowEvs.length===1?'⚠️ 明日がエントリー締切です':`⚠️ 明日締切の試合が${tomorrowEvs.length}件あります`;
        const body=tomorrowEvs.map(e=>'・'+e.name).join('\n');
        _sendBrowserNotif(title,body);
      }
    }
    // ── 3日前：締切の3日前9時 ──
    const d3=(()=>{const d=new Date();d.setDate(d.getDate()+3);return dsFromDate(d);})();
    const d3Evs=target.filter(e=>e.entryDeadline===d3&&e.notif&&e.notif.threeDaysBefore);
    if(d3Evs.length>0){
      const k=`bundle:threeDays:${today}`;
      if(!sent[k]){
        sent[k]=Date.now();
        const title=d3Evs.length===1?'📅 3日後がエントリー締切です':`📅 3日後締切の試合が${d3Evs.length}件あります`;
        const body=d3Evs.map(e=>'・'+e.name).join('\n');
        _sendBrowserNotif(title,body);
      }
    }
  }
  // ── 1時間前：締切は終日扱いなので「締切日の朝8時」の1時間前＝7時、として実装簡略化
  //   ※ 実用上は「締切日の正午前後」が一般的なので、ここでは「締切日の8時 = 1時間前 7時」として扱う
  target.filter(e=>e.notif&&e.notif.oneHourBefore&&e.entryDeadline===today).forEach(e=>{
    if(hh===7){
      const k=_notifKey(e.id,'h1',today);
      if(!sent[k]){
        sent[k]=Date.now();
        _sendBrowserNotif('⏰ あと1時間で締切',`「${e.name}」のエントリーが間もなく締切ります`);
      }
    }
  });
  _notifSentSave(sent);
}

function startNotificationLoop(){
  // 起動時に1回チェック → 以降1時間毎
  runNotificationCheck();
  if(_notifTimer)clearInterval(_notifTimer);
  _notifTimer=setInterval(runNotificationCheck,60*60*1000);
  // ページが復帰したときも再チェック
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)runNotificationCheck();
  });
}

// ================================================================
// ★★★ カテゴリ追加 ボトムシート ★★★
// ================================================================
function openAddCatSheet(){
  _renderAddCatSheet();
  document.getElementById('add-cat-overlay').classList.add('show');
  document.getElementById('add-cat-sheet').classList.add('show');
  // ドロワーを閉じる（UX向上）
  closeDrawer();
}
function closeAddCatSheet(){
  document.getElementById('add-cat-overlay').classList.remove('show');
  document.getElementById('add-cat-sheet').classList.remove('show');
}
function _renderAddCatSheet(){
  const listEl=document.getElementById('add-cat-list');
  const manageSection=document.getElementById('add-cat-manage-section');
  const manageList=document.getElementById('add-cat-manage-list');

  // 階層型表示: 性別 → グループ → ツアー
  let html = '';
  ['mens','womens'].forEach(gender => {
    const genderLabel = gender === 'mens' ? '男子' : '女子';
    const genderColor = gender === 'mens' ? '#1AAF7A' : '#E0567E';
    html += `<div class="add-cat-gender-head" style="padding:10px 16px 4px;font-size:11px;font-weight:700;color:${genderColor};letter-spacing:.5px;">${genderLabel}</div>`;
    ['domestic','overseas'].forEach(region => {
      const regionDef = tournamentCategories[gender]?.[region];
      if(!regionDef) return;
      Object.entries(regionDef.groups||{}).forEach(([gk, gd]) => {
        html += `<div class="add-cat-group-head" style="padding:6px 16px 2px;font-size:10px;font-weight:600;color:#7A9E94;letter-spacing:.4px;">${gd.label}</div>`;
        Object.entries(gd.tours||{}).forEach(([tk, td]) => {
          const isAdded = userEnabledCategories.includes(tk);
          html += `<div class="add-cat-row">
            <div class="add-cat-row-left">
              <span class="add-cat-color-dot" style="background:${td.color}"></span>
              <div class="add-cat-row-info">
                <div class="add-cat-row-label">${td.label}</div>
                <div class="add-cat-row-desc">${td.desc}</div>
              </div>
            </div>
            ${isAdded
              ?`<button class="add-cat-action-btn already-added" disabled>追加済み ✓</button>`
              :`<button class="add-cat-action-btn not-added" onclick="addCatFromSheet('${tk}')">追加</button>`
            }
          </div>`;
        });
      });
    });
  });
  listEl.innerHTML = html;

  // 追加済みカテゴリの管理セクション
  const enabled=CATEGORIES.filter(c=>c.key!=='personal'&&userEnabledCategories.includes(c.key));
  if(enabled.length>0){
    manageSection.style.display='block';
    manageList.innerHTML=enabled.map(c=>`
      <div class="add-cat-manage-row">
        <span class="add-cat-color-dot" style="background:${c.color};width:10px;height:10px;border-radius:50%;flex-shrink:0;"></span>
        <span style="flex:1;font-size:13px;font-weight:500;color:var(--text-primary);">${c.label}</span>
        <button class="add-cat-manage-del" onclick="removeCatFromSheet('${c.key}')">削除</button>
      </div>`).join('');
  }else{
    manageSection.style.display='none';
  }
}
function addCatFromSheet(key){
  addCategory(key);
  _renderAddCatSheet();
  renderCatGrid();
  syncDrawerState();
  renderAllPanels();
  renderCalList();
  showToast(`「${(CATEGORIES.find(c=>c.key===key)||{}).label||key}」を追加しました`);
}
function removeCatFromSheet(key){
  removeCategory(key);
  _renderAddCatSheet();
  renderCatGrid();
  syncDrawerState();
  if(calCatFilter===key)calCatFilter=null;
  renderAllPanels();
  renderCalList();
  showToast(`「${(CATEGORIES.find(c=>c.key===key)||{}).label||key}」を削除しました`);
}
function removeCategoryFromDrawer(key){
  // ドロワー内の − ボタンからの削除
  removeCategory(key);
  syncDrawerState();
  if(calCatFilter===key)calCatFilter=null;
  renderAllPanels();
  renderCalList();
  showToast(`「${(CATEGORIES.find(c=>c.key===key)||{}).label||key}」を削除しました`);
}

// ──── 通知設定モーダル ────
let _notifSettingsTargetId=null;
function openNotifSettings(eid){
  const ev=EVENTS.find(e=>e.id===eid);if(!ev)return;
  if(!ev.notif)ev.notif=Object.assign({},NOTIF_DEFAULTS);
  _notifSettingsTargetId=eid;
  const ov=document.getElementById('notif-settings-overlay');
  const sh=document.getElementById('notif-settings-sheet');
  document.getElementById('notif-settings-event-name').textContent=ev.name||'';
  // チェックボックス反映
  document.getElementById('ns-d3').checked=!!ev.notif.threeDaysBefore;
  document.getElementById('ns-d1').checked=!!ev.notif.oneDayBefore;
  document.getElementById('ns-d0').checked=!!ev.notif.sameDay;
  document.getElementById('ns-h1').checked=!!ev.notif.oneHourBefore;
  // エントリー済トグル
  document.getElementById('ns-entered').checked=ev.entryStatus==='entered';
  // 締切日
  const di=document.getElementById('ns-deadline');
  di.value=ev.entryDeadline||'';
  ov.classList.add('show');sh.classList.add('show');
  _ensureNotifPermission();
}
function closeNotifSettings(){
  document.getElementById('notif-settings-overlay').classList.remove('show');
  document.getElementById('notif-settings-sheet').classList.remove('show');
  _notifSettingsTargetId=null;
}
function saveNotifSettings(){
  const eid=_notifSettingsTargetId;if(!eid)return;
  const ev=EVENTS.find(e=>e.id===eid);if(!ev){closeNotifSettings();return;}
  ev.notif={
    threeDaysBefore:document.getElementById('ns-d3').checked,
    oneDayBefore:document.getElementById('ns-d1').checked,
    sameDay:document.getElementById('ns-d0').checked,
    oneHourBefore:document.getElementById('ns-h1').checked,
  };
  ev.entryStatus=document.getElementById('ns-entered').checked?'entered':'open';
  const newDl=document.getElementById('ns-deadline').value;
  ev.entryDeadline=newDl||null;
  closeNotifSettings();
  renderAllPanels();renderCalList();
  showToast('通知設定を保存しました ✓');
}

function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400);}

// ★★★ スプリットハンドル：ドラッグで上下比率を変更 ★★★
// flex-grow を比率として扱う（合計10）
// snapPoints = カレンダー優先(8:2) / バランス(5:5) / 予定リスト優先(2:8) / カレンダー最大化(10:0 相当=9.5:0.5)
const SPLIT={
  pressed:false,
  moved:false,
  startY:0,
  startCalGrow:0,
  startListGrow:0,
  containerH:0,
  minCalPx:200,   // カレンダー最小高（6行表示の最低限）
  minListPx:60,   // 予定リスト最小高（セクションヘッダー＋1件分）
  snapPoints:[0.85,0.62,0.50,0.30],  // カレンダー側の比率候補
  snapThreshold:0.06,
};

function getSplitElems(){
  return {
    cal:document.getElementById('cal-swipe-wrap'),
    list:document.getElementById('cal-scroll'),
    handle:document.getElementById('split-handle'),
  };
}

function setSplitRatio(calRatio,animate){
  const {cal,list}=getSplitElems();
  const r=Math.max(0.15,Math.min(0.92,calRatio));
  if(animate){
    cal.classList.add('snapping');list.classList.add('snapping');
    setTimeout(()=>{cal.classList.remove('snapping');list.classList.remove('snapping');},320);
  }
  cal.style.flexGrow=String(r*10);
  list.style.flexGrow=String((1-r)*10);
}

function snapToNearest(calRatio){
  let best=SPLIT.snapPoints[0],bestDist=Infinity;
  SPLIT.snapPoints.forEach(p=>{const d=Math.abs(p-calRatio);if(d<bestDist){bestDist=d;best=p;}});
  // しきい値内なら吸着、それ以外はそのまま（自由位置を許容）
  if(bestDist<=SPLIT.snapThreshold){
    setSplitRatio(best,true);
  }else{
    setSplitRatio(calRatio,true);
  }
}

function initSplitHandle(){
  const {cal,list,handle}=getSplitElems();
  // 初期比率：カレンダー62% / リスト38%（バランス寄りカレンダー優先）
  setSplitRatio(0.62,false);

  const onStart=(e)=>{
    SPLIT.pressed=true;
    SPLIT.moved=false;
    handle.classList.add('dragging');
    const t=e.touches?e.touches[0]:e;
    SPLIT.startY=t.clientY;
    SPLIT.containerH=cal.getBoundingClientRect().height+list.getBoundingClientRect().height;
    SPLIT.startCalGrow=parseFloat(cal.style.flexGrow)||6.2;
    SPLIT.startListGrow=parseFloat(list.style.flexGrow)||3.8;
    if(e.cancelable)e.preventDefault();
  };
  const onMove=(e)=>{
    if(!SPLIT.pressed)return;
    const t=e.touches?e.touches[0]:e;
    const dy=t.clientY-SPLIT.startY;
    if(Math.abs(dy)>3)SPLIT.moved=true;
    if(SPLIT.containerH<=0)return;
    const dRatio=dy/SPLIT.containerH;
    const startCalRatio=SPLIT.startCalGrow/(SPLIT.startCalGrow+SPLIT.startListGrow);
    let newCalRatio=startCalRatio+dRatio;
    const calPx=newCalRatio*SPLIT.containerH;
    const listPx=(1-newCalRatio)*SPLIT.containerH;
    if(calPx<SPLIT.minCalPx)newCalRatio=SPLIT.minCalPx/SPLIT.containerH;
    if(listPx<SPLIT.minListPx)newCalRatio=1-(SPLIT.minListPx/SPLIT.containerH);
    setSplitRatio(newCalRatio,false);
    if(e.cancelable)e.preventDefault();
  };
  const onEnd=()=>{
    if(!SPLIT.pressed)return;
    SPLIT.pressed=false;
    handle.classList.remove('dragging');
    const {cal:c,list:l}=getSplitElems();
    const cg=parseFloat(c.style.flexGrow)||6.2;
    const lg=parseFloat(l.style.flexGrow)||3.8;
    const ratio=cg/(cg+lg);
    if(SPLIT.moved){
      snapToNearest(ratio);
    }
  };

  handle.addEventListener('touchstart',onStart,{passive:false});
  handle.addEventListener('touchmove',onMove,{passive:false});
  handle.addEventListener('touchend',onEnd,{passive:true});
  handle.addEventListener('touchcancel',onEnd,{passive:true});
  // マウスでも動作
  handle.addEventListener('mousedown',(e)=>{
    onStart(e);
    const mv=(ev)=>onMove(ev);
    const up=()=>{onEnd();document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);};
    document.addEventListener('mousemove',mv);
    document.addEventListener('mouseup',up);
  });
  // ダブルタップでカレンダー優先 / バランス / リスト優先 をローテーション
  let lastTap=0;
  handle.addEventListener('click',(e)=>{
    // ドラッグ移動後のclickは無視
    if(SPLIT.moved){SPLIT.moved=false;return;}
    const now=Date.now();
    if(now-lastTap<350){
      const {cal:c,list:l}=getSplitElems();
      const cg=parseFloat(c.style.flexGrow)||6.2;
      const lg=parseFloat(l.style.flexGrow)||3.8;
      const ratio=cg/(cg+lg);
      // 現在の比率に応じて次のスナップポイントへローテーション
      if(ratio>0.7)setSplitRatio(0.50,true);       // カレンダー優先 → バランス
      else if(ratio>0.45)setSplitRatio(0.30,true); // バランス → リスト優先
      else setSplitRatio(0.85,true);                // リスト優先 → カレンダー最大化
    }
    lastTap=now;
  });
}

// ★★★ ハンバーガードロワー & 表示モード ★★★
const drawer={
  el:null,overlay:null,
  open:false,
  // 右スワイプで閉じる
  startX:0,startY:0,curX:0,
  dragging:false,horizLocked:false,
};

function openDrawer(){
  drawer.open=true;
  drawer.el.classList.add('show');
  drawer.overlay.classList.add('show');
  drawer.el.setAttribute('aria-hidden','false');
  // 開く時に表示モード/カテゴリを最新状態で再描画
  syncDrawerState();
}
function closeDrawer(){
  drawer.open=false;
  drawer.el.classList.remove('show');
  drawer.overlay.classList.remove('show');
  drawer.el.setAttribute('aria-hidden','true');
  drawer.el.style.transform='';
}

function syncDrawerState(){
  // 表示モードのアクティブ表示
  drawer.el.querySelectorAll('[data-view-mode]').forEach(el=>{
    el.classList.toggle('is-active',el.dataset.viewMode===viewMode);
  });
  // ★ オプトイン型：追加済みカテゴリのみ一覧表示（personalは除く）
  const list=document.getElementById('drawer-cat-list');
  const enabledCats=CATEGORIES.filter(c=>c.key!=='personal'&&userEnabledCategories.includes(c.key));
  if(enabledCats.length===0){
    list.innerHTML='<div style="padding:8px 18px 4px;font-size:11px;color:var(--text-tertiary);">まだカテゴリが追加されていません</div>';
  }else{
    list.innerHTML=enabledCats.map(c=>`
      <div class="drawer-cat-added" data-cat-key="${c.key}">
        <span class="drawer-cat-dot" style="background:${c.color}"></span>
        <div style="flex:1;min-width:0;">
          <div class="drawer-cat-added-label">${c.label}</div>
          <div class="drawer-cat-added-desc">${c.desc}</div>
        </div>
        <button class="drawer-cat-del-btn" onclick="event.stopPropagation();removeCategoryFromDrawer('${c.key}')" aria-label="${c.label}を削除">−</button>
      </div>`).join('');
  }
}

function setViewMode(mode){
  if(mode===viewMode)return;
  viewMode=mode;
  // 週/3日/日モード切替時は基準日を初期化
  if(mode!=='month'&&!viewBaseDate){
    viewBaseDate=selectedDate||`${year}-${String(month+1).padStart(2,'0')}-01`;
  }
  savePrefs();
  syncDrawerState();
  _applyViewLayout(mode);   // ← 表示コンテナを完全分離
  renderAllPanels();
  renderCalList();
  updateMonthLabel();
}

// ── 月 vs 週/3日/1日 の表示レイアウトを完全分離 ──────────────
function _applyViewLayout(mode){
  const monthWrap   = document.getElementById('month-ui-wrap');
  const multidayWrap= document.getElementById('multiday-ui-wrap');
  if(!monthWrap||!multidayWrap)return;
  if(mode==='month'){
    // 月モード：月UIをflex表示、multiday側を完全非表示
    // ★ flex-directionも明示（CSSと競合しないよう）
    monthWrap.style.display      = 'flex';
    monthWrap.style.flexDirection= 'column';
    multidayWrap.style.display   = 'none';
    // multiday内の残留DOMを除去
    multidayWrap.innerHTML = '';
  }else{
    // 週/3日/1日モード：月UIを完全非表示、multiday側を表示
    monthWrap.style.display      = 'none';
    multidayWrap.style.display   = 'flex';
    multidayWrap.style.flexDirection = 'column';
  }
}

function toggleCatVisibility(key){
  const cur=catVisibility[key]!==false; // 未設定はONとして扱う
  catVisibility[key]=!cur;
  savePrefs();
  syncDrawerState();
  renderAllPanels();
  renderCalList();
}

function initDrawer(){
  drawer.el=document.getElementById('drawer');
  drawer.overlay=document.getElementById('drawer-overlay');
  // ハンバーガーボタン
  ['hamburger-btn-1','hamburger-btn-2'].forEach(id=>{
    const b=document.getElementById(id);
    if(b)b.addEventListener('click',openDrawer);
  });
  // オーバーレイタップで閉じる
  drawer.overlay.addEventListener('click',closeDrawer);
  // ドロワー内クリック（イベント委譲）
  drawer.el.addEventListener('click',e=>{
    const vm=e.target.closest('[data-view-mode]');
    if(vm){setViewMode(vm.dataset.viewMode);closeDrawer();return;}
    // drawer-add-cat-btn はHTML側でonclickを持つのでここでは不要
    if(e.target.closest('#drawer-design')){
      closeDrawer();
      setTimeout(()=>{if(typeof openDesignSettings==='function')openDesignSettings();},260);
      return;
    }
    if(e.target.closest('#drawer-settings')){
      closeDrawer();
      // 「設定」もデザイン設定を開く（仕様：ハンバーガー内に「デザイン設定」配置）
      setTimeout(()=>{if(typeof openDesignSettings==='function')openDesignSettings();},260);
      return;
    }
  });
  // 右スワイプで閉じる
  drawer.el.addEventListener('touchstart',e=>{
    if(!drawer.open)return;
    const t=e.touches[0];
    drawer.startX=t.clientX;drawer.startY=t.clientY;
    drawer.curX=0;drawer.dragging=true;drawer.horizLocked=false;
  },{passive:true});
  drawer.el.addEventListener('touchmove',e=>{
    if(!drawer.dragging)return;
    const t=e.touches[0];
    const dx=t.clientX-drawer.startX,dy=t.clientY-drawer.startY;
    if(!drawer.horizLocked){
      if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>10){drawer.dragging=false;return;}
      if(Math.abs(dx)>6)drawer.horizLocked=true;
    }
    if(drawer.horizLocked){
      // 右方向の動きのみ追従
      drawer.curX=Math.max(0,dx);
      drawer.el.classList.add('dragging');
      drawer.el.style.transform=`translateX(${drawer.curX}px)`;
      // オーバーレイ透明度も連動
      const w=drawer.el.getBoundingClientRect().width;
      const ratio=Math.max(0,1-drawer.curX/w);
      drawer.overlay.style.opacity=String(0.42*ratio);
    }
  },{passive:true});
  drawer.el.addEventListener('touchend',()=>{
    if(!drawer.dragging){drawer.el.classList.remove('dragging');return;}
    drawer.dragging=false;
    drawer.el.classList.remove('dragging');
    drawer.overlay.style.opacity='';
    const w=drawer.el.getBoundingClientRect().width;
    if(drawer.curX>w*0.32){
      // しきい値超え → 閉じる
      closeDrawer();
    }else{
      drawer.el.style.transform='';
    }
    drawer.curX=0;drawer.horizLocked=false;
  },{passive:true});
}

// ★★★ 週・3日表示用レンダリング ★★★
const DOW_LABELS=['日','月','火','水','木','金','土'];
function buildMultiDayHTML(days){
  // days: ISO日付文字列の配列
  const today=todayStr();
  return`<div class="cal-multi-day">${days.map(ds=>{
    // ★ UTC日付ズレ修正: ローカル日付として生成
    const [_bdy,_bdm,_bdd]=ds.split('-').map(Number);
    const d=new Date(_bdy,_bdm-1,_bdd);
    const dow=d.getDay();
    const isToday=ds===today;
    const isSun=dow===0,isSat=dow===6;
    let evs=getEventsOnDate(ds);
    evs=applyCatFiltersToEvents(evs);
    const eventsHtml=evs.length?evs.map(e=>{
      const cat=CATEGORIES.find(c=>c.key===e.cat)||{};
      const meta=e.date===e.end?'':`${e.date.slice(8)}〜${e.end.slice(8)}`;
      return`<div class="day-event-row" style="border-left-color:${cat.color||'#1AAF7A'}" onclick="openModal(null,${e.id})">
        <div class="day-event-row-name">${e.name}</div>
        <div class="day-event-row-meta">${cat.label||e.cat}${meta?' · '+meta:''}</div>
      </div>`;
    }).join(''):`<div class="day-block-empty">予定はありません</div>`;
    return`<div class="day-block${isToday?' is-today':''}" data-ds="${ds}">
      <div class="day-block-header" onclick="jumpToDayView('${ds}')" style="cursor:pointer;">
        <span class="day-block-num${isToday?' is-today':''}${isSun?' sun':''}${isSat?' sat':''}">${d.getDate()}</span>
        <span class="day-block-dow${isSun?' sun':''}${isSat?' sat':''}">${DOW_LABELS[dow]}</span>
        <span class="day-block-month">${d.getMonth()+1}月</span>
      </div>
      <div class="day-block-events">${eventsHtml}</div>
    </div>`;
  }).join('')}</div>`;
}
function getViewDays(){
  if(viewMode==='week'){
    const _wBase=viewBaseDate||todayStr();
    const [_wY,_wM,_wD]=_wBase.split('-').map(Number);
    const base=new Date(_wY,_wM-1,_wD);
    // 週の開始：日曜
    const dow=base.getDay();
    const sunday=new Date(base);sunday.setDate(base.getDate()-dow);
    return Array.from({length:7},(_,i)=>{const d=new Date(sunday);d.setDate(sunday.getDate()+i);return dsFromDate(d);});
  }
  if(viewMode==='3day'){
    const _3Base=viewBaseDate||todayStr();
    const [_3Y,_3M,_3D]=_3Base.split('-').map(Number);
    const base=new Date(_3Y,_3M-1,_3D);
    return Array.from({length:3},(_,i)=>{const d=new Date(base);d.setDate(base.getDate()+i);return dsFromDate(d);});
  }
  return [];
}

// renderAllPanels の月モード以外の対応：multiday-ui-wrap に差し替え
const _origRenderAllPanels=renderAllPanels;
renderAllPanels=function(){
  if(viewMode==='month'){
    // 月モード：従来の月グリッド描画
    _origRenderAllPanels();
    return;
  }
  // 週 / 3日モード：multiday-ui-wrap に .cal-multi-day を描画
  if(viewMode==='week'||viewMode==='3day'){
    const container=document.getElementById('multiday-ui-wrap');
    if(!container)return;
    const days=getViewDays();
    const html=buildMultiDayHTML(days);
    container.innerHTML=html;   // multiday-ui-wrap の中身ごと入れ替え
  }
  // day モードは後段の _prevRenderAllPanels が処理
};

// 月切替ボタン：モード別に動作
const _origChangeMonthInternal=changeMonthInternal;
changeMonthInternal=function(dir){
  if(viewMode==='month'){_origChangeMonthInternal(dir);return;}
  // 週/3日モード：基準日を移動
  const step=viewMode==='week'?7:3;
  const _cmBase=viewBaseDate||todayStr();
  const [_cmY,_cmM,_cmD]=_cmBase.split('-').map(Number);
  const base=new Date(_cmY,_cmM-1,_cmD);
  base.setDate(base.getDate()+dir*step);
  viewBaseDate=dsFromDate(base);
  // 表示中の月もずらす（年月ラベルとの整合）
  year=base.getFullYear();month=base.getMonth();
  selectedDate=null;newlyAddedDate=null;
  updateMonthLabel();renderAllPanels();renderCalList();
};

// 月ラベル更新もモード別に
const _origUpdateMonthLabel=updateMonthLabel;
updateMonthLabel=function(){
  if(viewMode==='month'){_origUpdateMonthLabel();return;}
  const lbl=document.getElementById('cal-month-label');
  if(!lbl)return;
  if(viewMode==='day'){
    const ds=viewBaseDate||todayStr();
    const [_umy,_umm,_umd]=ds.split('-').map(Number);
    const d=new Date(_umy,_umm-1,_umd);
    lbl.textContent=`${d.getFullYear()}年 ${d.getMonth()+1}月 ${d.getDate()}日`;
    return;
  }
  const days=getViewDays();
  if(days.length===0){_origUpdateMonthLabel();return;}
  const [_fy,_fm,_fd]=days[0].split('-').map(Number);
  const [_ly,_lm,_ld]=days[days.length-1].split('-').map(Number);
  const first=new Date(_fy,_fm-1,_fd),last=new Date(_ly,_lm-1,_ld);
  if(first.getMonth()===last.getMonth()){
    lbl.textContent=`${first.getFullYear()}年 ${first.getMonth()+1}月 ${first.getDate()}日〜${last.getDate()}日`;
  }else{
    lbl.textContent=`${first.getMonth()+1}/${first.getDate()} 〜 ${last.getMonth()+1}/${last.getDate()}`;
  }
};

/* ================================================================ */
/* ★★★ Day View（1日表示）実装                                      */
/* ================================================================ */
const DV_HOUR_HEIGHT=64;            // 1時間 = 64px（推奨値）
const DV_TOTAL_HEIGHT=24*DV_HOUR_HEIGHT;  // 1536px
const DV_SNAP_MIN=15;               // ドラッグスナップ：15分

// ───── 日付/時刻ユーティリティ ─────
function dvParseDateTime(str){
  // 'YYYY-MM-DDTHH:MM' または 'YYYY-MM-DD HH:MM' を許容
  if(!str)return null;
  const m=str.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
  if(!m)return null;
  return new Date(+m[1],+m[2]-1,+m[3],+m[4],+m[5]);
}
function dvFormatTime(d){
  return`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function dvMinutesFromMidnight(d){return d.getHours()*60+d.getMinutes();}
function dvIsAllDay(ev){
  // 時刻データが両方ある場合のみ「時間付き」扱い。それ以外は終日。
  return !(ev.start_datetime&&ev.end_datetime&&dvParseDateTime(ev.start_datetime)&&dvParseDateTime(ev.end_datetime));
}

// ───── その日のイベント取得（時間付き/終日 を分ける） ─────
function dvGetEventsForDay(ds){
  // 全イベントから「ds が表示日に該当する」ものを抽出
  // ★ UTC日付ズレ修正: ローカル日付として生成
  const [_gfy,_gfm,_gfd]=ds.split('-').map(Number);
  const dayStart=new Date(_gfy,_gfm-1,_gfd);dayStart.setHours(0,0,0,0);
  const dayEnd=new Date(_gfy,_gfm-1,_gfd);dayEnd.setHours(23,59,59,999);
  const all=EVENTS.filter(e=>hasCat(e)&&ds>=e.date&&ds<=e.end);
  const filtered=applyCatFiltersToEvents(all);
  const timed=[],allday=[];
  filtered.forEach(ev=>{
    if(dvIsAllDay(ev)){
      allday.push(ev);
    }else{
      const s=dvParseDateTime(ev.start_datetime);
      const e=dvParseDateTime(ev.end_datetime);
      // 開始 >= 終了 はバリデーション（spec ⑪）
      if(!s||!e||s>=e){allday.push(ev);return;}
      // 当日分にクリップ（日跨ぎ対応 spec ⑪）
      const cs=s<dayStart?dayStart:s;
      const ce=e>dayEnd?new Date(dayEnd.getTime()+1):e;
      timed.push({
        ...ev,
        _start:cs,_end:ce,
        _origStart:s,_origEnd:e,
        _startsBefore:s<dayStart,
        _endsAfter:e>dayEnd
      });
    }
  });
  // 時間付きを開始時刻順に
  timed.sort((a,b)=>a._start-b._start||a._end-b._end);
  return{timed,allday};
}

// ───── オーバーラップレイアウト計算（横分割） ─────
function dvComputeLayout(timed){
  // Google Calendar 風の column 配置：競合グループ単位で max 列数を決める
  if(timed.length===0)return[];
  const items=timed.map((e,i)=>({ev:e,idx:i,col:-1,maxCols:1,start:e._start.getTime(),end:e._end.getTime()}));
  // グループ化：時間帯が連結している（誰かと重なる）一団
  let group=[];
  let groupEnd=-Infinity;
  const groups=[];
  items.forEach(it=>{
    if(it.start>=groupEnd&&group.length>0){
      groups.push(group);group=[];groupEnd=-Infinity;
    }
    group.push(it);
    if(it.end>groupEnd)groupEnd=it.end;
  });
  if(group.length)groups.push(group);
  // 各グループ内で列を割り当てる
  groups.forEach(g=>{
    const colsEnd=[]; // colsEnd[c] = その列の最後のイベントのend
    g.forEach(it=>{
      let assigned=-1;
      for(let c=0;c<colsEnd.length;c++){
        if(colsEnd[c]<=it.start){assigned=c;break;}
      }
      if(assigned===-1){assigned=colsEnd.length;colsEnd.push(it.end);}
      else{colsEnd[assigned]=it.end;}
      it.col=assigned;
    });
    const maxCols=colsEnd.length;
    g.forEach(it=>{it.maxCols=maxCols;});
  });
  return items;
}

// ───── Day View 描画 ─────
function dvBuildHTML(ds){
  // ★ UTC日付ズレ修正: ローカル日付として生成
  const [_dvY,_dvM,_dvD]=ds.split('-').map(Number);
  const d=new Date(_dvY,_dvM-1,_dvD);
  const today=todayStr();
  const isToday=ds===today;
  const dow=d.getDay();
  const isSun=dow===0,isSat=dow===6;
  const headerMain=`${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${DOW_LABELS[dow]}`;
  // 今日との差分日数で副ラベル
  let headerSub='';
  {
    const [_ty,_tm,_td]=today.split('-').map(Number);
    const t=new Date(_ty,_tm-1,_td);t.setHours(0,0,0,0);
    const x=new Date(_dvY,_dvM-1,_dvD);x.setHours(0,0,0,0);
    const diff=Math.round((x-t)/86400000);
    if(diff===0)headerSub='今日';
    else if(diff===1)headerSub='明日';
    else if(diff===-1)headerSub='昨日';
    else if(diff>0)headerSub=`${diff}日後`;
    else headerSub=`${-diff}日前`;
  }

  const{timed,allday}=dvGetEventsForDay(ds);

  // 終日セクション
  let alldayHtml='';
  if(allday.length>0){
    const chips=allday.slice(0,4).map(e=>{
      const cat=CATEGORIES.find(c=>c.key===e.cat)||{};
      return`<span class="dv-allday-chip" style="border-left-color:${cat.color||'#1AAF7A'}" onclick="event.stopPropagation();openModal(null,${e.id})">${escapeHtml(e.name)}</span>`;
    }).join('');
    const more=allday.length>4?`<span class="dv-allday-more">+${allday.length-4}件</span>`:'';
    alldayHtml=`<div class="dv-allday">
      <span class="dv-allday-label">終日</span>
      <div class="dv-allday-list">${chips}${more}</div>
    </div>`;
  }else{
    alldayHtml=`<div class="dv-allday is-empty"></div>`;
  }

  // 時間ラベル（1時間ごと） & グリッド線
  let timeColHtml='';
  let gridHtml='';
  for(let h=0;h<=24;h++){
    const top=h*DV_HOUR_HEIGHT;
    if(h<24){
      timeColHtml+=`<div class="dv-time-label${h===0?' is-top':''}" style="top:${top}px;">${String(h).padStart(2,'0')}:00</div>`;
    }
    if(h<24){
      gridHtml+=`<div class="dv-grid-line" style="top:${top}px;"></div>`;
      gridHtml+=`<div class="dv-grid-line is-half" style="top:${top+DV_HOUR_HEIGHT/2}px;"></div>`;
    }else{
      gridHtml+=`<div class="dv-grid-line" style="top:${top}px;"></div>`;
    }
  }

  // 30分単位の空きスロット（タップで新規作成）
  let slotsHtml='';
  for(let i=0;i<48;i++){
    const top=i*(DV_HOUR_HEIGHT/2);
    const hh=Math.floor(i/2),mm=(i%2)*30;
    const tstr=`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
    slotsHtml+=`<div class="dv-slot" style="top:${top}px;" data-time="${tstr}" onclick="dvOnSlotClick('${ds}','${tstr}')"></div>`;
  }

  // イベント配置
  const layout=dvComputeLayout(timed);
  let eventsHtml='';
  layout.forEach(it=>{
    const e=it.ev;
    const cat=CATEGORIES.find(c=>c.key===e.cat)||{};
    const startMin=dvMinutesFromMidnight(e._start);
    const endMin=e._end.getHours()===0&&e._end.getMinutes()===0&&e._endsAfter?24*60:dvMinutesFromMidnight(e._end);
    const top=startMin*(DV_HOUR_HEIGHT/60);
    const rawHeight=(endMin-startMin)*(DV_HOUR_HEIGHT/60);
    const height=Math.max(rawHeight,16); // 最小16px
    const widthPct=100/it.maxCols;
    const leftPct=it.col*widthPct;
    // ガタつかないよう内側に2px の隙間
    const isTiny=rawHeight<26;
    const timeStr=`${dvFormatTime(e._origStart)}–${dvFormatTime(e._origEnd)}`;
    const arrows=(e._startsBefore?'◀ ':'')+(e._endsAfter?' ▶':'');
    eventsHtml+=`<div class="dv-event${isTiny?' is-tiny':''}"
      style="top:${top}px;height:${height}px;left:calc(${leftPct}% + 1px);width:calc(${widthPct}% - 4px);border-left-color:${cat.color||'#1AAF7A'};background:${(cat.color||'#1AAF7A')}10;"
      onclick="event.stopPropagation();openModal(null,${e.id})">
      <div class="dv-event-title">${arrows.trim()?`<span style="color:${cat.color||'#1AAF7A'};font-weight:800;">${arrows}</span>`:''}${escapeHtml(e.name)}</div>
      <div class="dv-event-time">${timeStr}${e.place?' · '+escapeHtml(e.place):''}</div>
    </div>`;
  });

  // 現在時刻ライン（今日のみ）
  const now=new Date();
  let nowLineHtml='';
  if(isToday){
    const nowMin=now.getHours()*60+now.getMinutes();
    const nowTop=nowMin*(DV_HOUR_HEIGHT/60);
    nowLineHtml=`<div class="dv-now-line" id="dv-now-line" style="top:${nowTop}px;"></div>`;
  }

  // 空状態
  const emptyHtml=(timed.length===0&&allday.length===0)
    ?`<div class="dv-empty-overlay">予定はありません<br>空き時間をタップして追加</div>`:'';

  // 日付ヘッダーのクラス
  const headMainCls=`dv-header-date-main${isToday?' is-today':''}${isSun?' is-sun':''}${isSat?' is-sat':''}`;
  const headDateCls=`dv-header-date${isToday?' is-today':''}`;

  return`<div class="cal-day-view" id="cal-day-view" data-ds="${ds}">
    <div class="dv-header">
      <button class="dv-arrow" onclick="dvNavigate(-1)" aria-label="前日">‹</button>
      <div class="${headDateCls}" onclick="dvOnHeaderTap()">
        <span class="${headMainCls}">${headerMain}</span>
        <span class="dv-header-date-sub">${headerSub}</span>
      </div>
      <button class="dv-arrow" onclick="dvNavigate(1)" aria-label="翌日">›</button>
    </div>
    ${alldayHtml}
    <div class="dv-timeline" id="dv-timeline">
      <div class="dv-timeline-inner" id="dv-timeline-inner">
        <div class="dv-time-col">${timeColHtml}</div>
        ${gridHtml}
        <div class="dv-events-area">${slotsHtml}${eventsHtml}</div>
        ${nowLineHtml}
        ${emptyHtml}
      </div>
    </div>
  </div>`;
}

// HTMLエスケープ（既存に無いので簡易版）
function escapeHtml(s){
  return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ───── ナビゲーション ─────
function dvNavigate(dir){
  const cur=viewBaseDate||todayStr();
  // ★ UTC日付ズレ修正: ローカル日付として生成
  const [_nvY,_nvM,_nvD]=cur.split('-').map(Number);
  const d=new Date(_nvY,_nvM-1,_nvD);d.setDate(d.getDate()+dir);
  viewBaseDate=dsFromDate(d);
  year=d.getFullYear();month=d.getMonth();
  selectedDate=null;newlyAddedDate=null;
  // スクロール位置を「自動的に現在時刻」へ戻すかは spec ⑥ により「手動優先」「位置保持」だが、
  // 日付が変わったら新しい位置で再描画。今日に戻った時は現在時刻にスクロール。
  dvScrollMemoryByDate=dvScrollMemoryByDate||{};
  // 現在の位置を保存
  const tl=document.getElementById('dv-timeline');
  if(tl){dvScrollMemoryByDate[cur]=tl.scrollTop;}
  updateMonthLabel();renderAllPanels();renderCalList();
  // 新しい日付の保存済み位置 or 自動スクロールへ
  setTimeout(()=>dvRestoreScroll(),20);
}

function dvOnSlotClick(ds,timeStr){
  // 空き時間タップ → 新規作成（開始時刻を初期値に）
  // 既存の openModal は date 単位なので、preset 時刻はメモ等にせず、まずモーダルを開く。
  // 開始時刻は将来 input-start-time フィールドが追加された際に prefil するため、
  // 一時グローバルに保持する（既存 modal はそのまま使用）。
  dvPresetStartTime=timeStr;
  // ★ タップしたスロットの実日付を DatePicker に渡す
  openCreateModal(ds);
  // 開いたモーダルの開始日付に時刻ヒントをトーストで案内
  showToast(`${timeStr} から新規予定を作成`);
}

function dvOnHeaderTap(){
  // 日付ピッカー（任意 spec ⑤）：ネイティブ <input type="date"> をその場で生成して開く
  const cur=viewBaseDate||todayStr();
  const inp=document.createElement('input');
  inp.type='date';inp.value=cur;
  inp.style.cssText='position:fixed;left:-9999px;';
  document.body.appendChild(inp);
  inp.addEventListener('change',()=>{
    if(inp.value){
      viewBaseDate=inp.value;
      const d=new Date(inp.value);
      year=d.getFullYear();month=d.getMonth();
      updateMonthLabel();renderAllPanels();renderCalList();
      setTimeout(dvAutoScrollToNow,30);
    }
    inp.remove();
  });
  inp.click();
  // 一部ブラウザで focus が必要
  try{inp.showPicker&&inp.showPicker();}catch(e){}
}

// ───── スクロール制御 ─────
let dvScrollMemoryByDate={}; // ds → scrollTop
let dvUserScrolled=false;
let dvPresetStartTime=null;

function dvAutoScrollToNow(){
  const tl=document.getElementById('dv-timeline');
  if(!tl)return;
  const ds=tl.closest('.cal-day-view')?.dataset.ds;
  if(!ds)return;
  // 今日なら現在時刻へ、それ以外なら 8:00 付近へ
  const target=(ds===todayStr())
    ?(new Date().getHours()*60+new Date().getMinutes())*(DV_HOUR_HEIGHT/60) - 80
    :8*DV_HOUR_HEIGHT - 20;
  tl.scrollTop=Math.max(0,target);
}

function dvRestoreScroll(){
  const tl=document.getElementById('dv-timeline');
  if(!tl)return;
  const ds=tl.closest('.cal-day-view')?.dataset.ds;
  if(!ds)return;
  if(dvScrollMemoryByDate[ds]!=null){
    tl.scrollTop=dvScrollMemoryByDate[ds];
  }else{
    dvAutoScrollToNow();
  }
  // ユーザーのスクロールを記憶
  if(!tl._dvScrollBound){
    tl._dvScrollBound=true;
    tl.addEventListener('scroll',()=>{
      const cds=tl.closest('.cal-day-view')?.dataset.ds;
      if(cds)dvScrollMemoryByDate[cds]=tl.scrollTop;
    },{passive:true});
  }
}

// ───── 現在時刻ライン更新（1分ごと） ─────
let dvNowLineTimer=null;
function dvStartNowLineTicker(){
  if(dvNowLineTimer)clearInterval(dvNowLineTimer);
  dvNowLineTimer=setInterval(()=>{
    const line=document.getElementById('dv-now-line');
    if(!line)return;
    const now=new Date();
    const nowMin=now.getHours()*60+now.getMinutes();
    line.style.top=(nowMin*(DV_HOUR_HEIGHT/60))+'px';
  },60000);
}

// ───── 左右スワイプで前日/翌日 ─────
function dvBindSwipe(){
  const view=document.getElementById('cal-day-view');
  if(!view||view._dvSwipeBound)return;
  view._dvSwipeBound=true;
  let sx=0,sy=0,locked=false,active=false,dx=0;
  const tl=view.querySelector('.dv-timeline');
  view.addEventListener('touchstart',e=>{
    if(e.touches.length!==1)return;
    sx=e.touches[0].clientX;sy=e.touches[0].clientY;
    locked=false;active=true;dx=0;
  },{passive:true});
  view.addEventListener('touchmove',e=>{
    if(!active)return;
    const cx=e.touches[0].clientX,cy=e.touches[0].clientY;
    dx=cx-sx;const dy=cy-sy;
    if(!locked){
      if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>8){active=false;return;}
      if(Math.abs(dx)>10){locked=true;}
    }
  },{passive:true});
  view.addEventListener('touchend',()=>{
    if(!active||!locked){active=false;return;}
    active=false;
    if(Math.abs(dx)>50){
      dvNavigate(dx<0?1:-1);
    }
  },{passive:true});
}

// ───── 他モードからの遷移（日付指定で 1日表示へ） ─────
function jumpToDayView(ds){
  if(!ds)return;
  viewBaseDate=ds;
  selectedDate=ds;newlyAddedDate=null;
  // ★ UTC日付ズレ修正: ローカル日付として生成
  const [_jy,_jm,_jd]=ds.split('-').map(Number);
  const d=new Date(_jy,_jm-1,_jd);year=d.getFullYear();month=d.getMonth();
  if(viewMode!=='day'){
    viewMode='day';savePrefs();syncDrawerState();
    _applyViewLayout('day');   // ← 月UIを非表示・multiday表示
  }
  updateMonthLabel();renderAllPanels();renderCalList();
  setTimeout(()=>{dvRestoreScroll();dvBindSwipe();dvStartNowLineTicker();},30);
}

// ───── renderAllPanels の 'day' モード対応（再オーバーライド） ─────
const _prevRenderAllPanels=renderAllPanels;
renderAllPanels=function(){
  if(viewMode==='day'){
    // day モード：multiday-ui-wrap に cal-day-view を描画
    const container=document.getElementById('multiday-ui-wrap');
    if(!container)return;
    const ds=viewBaseDate||selectedDate||todayStr();
    container.innerHTML=dvBuildHTML(ds);   // innerHTML で完全置換
    // 描画後の処理
    setTimeout(()=>{dvRestoreScroll();dvBindSwipe();dvStartNowLineTicker();},20);
    return;
  }
  // week / 3day は _origRenderAllPanels が処理済み
  // month はさらに下の _prevRenderAllPanels（元の月グリッド）が担当
  if(viewMode!=='week'&&viewMode!=='3day'){
    _prevRenderAllPanels();
  }
};

// changeMonthInternal の 'day' モード対応（再オーバーライド）
const _prevChangeMonthInternal=changeMonthInternal;
changeMonthInternal=function(dir){
  if(viewMode==='day'){dvNavigate(dir);return;}
  _prevChangeMonthInternal(dir);
};

// getViewDays の 'day' モード対応
const _prevGetViewDays=getViewDays;
getViewDays=function(){
  if(viewMode==='day'){return [viewBaseDate||todayStr()];}
  return _prevGetViewDays();
};

// setViewMode：'day' モード時の初期 viewBaseDate 設定（本体側でガード済みのため重複排除）
const _prevSetViewMode=setViewMode;
setViewMode=function(mode){
  if(mode==='day'&&!viewBaseDate){
    viewBaseDate=selectedDate||todayStr();
  }
  _prevSetViewMode(mode);
};

/* ================================================================ */
/* ★★★ デザイン設定（Theme / Color / Category Colors / Style） ★★★ */
/* ================================================================ */
const DESIGN_KEY='pronexax.design.v1';
const DESIGN_DEFAULTS={
  theme:'light',                 // 'light' | 'dark' | 'system'
  colorTheme:'green',            // 'green' | 'blue' | 'black' | 'gold' | 'mono'
  categoryColors:{
    jgto:'#1AAF7A',jlpga:'#E0567E',pga:'#2D7DD2',
    qualifier:'#A0631A',mini:'#D4771A',open:'#7B4DB5',personal:'#6B6ED4'
  },
  style:'card',                  // 'card' | 'flat'
  recentColors:[]                // 直近に選んだ色（最大8件）
};
let designConfig=JSON.parse(JSON.stringify(DESIGN_DEFAULTS));

// カラーテーマ毎に「primary 色」を返す（プレビュー用）
const COLOR_THEME_PRIMARY={
  green:'#1AAF7A',blue:'#2D7DD2',black:'#2C2F36',gold:'#B8881A',mono:'#7A8088',
  sakura:'#F7B7C3',lavender:'#BFA2DB',mint:'#A8E6CF',peach:'#FFC9A9'
};

(function restoreDesign(){
  try{
    const raw=localStorage.getItem(DESIGN_KEY);
    if(!raw)return;
    const obj=JSON.parse(raw);
    if(!obj||typeof obj!=='object')return;
    if(['light','dark','system'].includes(obj.theme))designConfig.theme=obj.theme;
    if(['green','blue','black','gold','mono','sakura','lavender','mint','peach'].includes(obj.colorTheme))designConfig.colorTheme=obj.colorTheme;
    if(obj.categoryColors&&typeof obj.categoryColors==='object'){
      Object.keys(designConfig.categoryColors).forEach(k=>{
        const v=obj.categoryColors[k];
        if(typeof v==='string'&&/^#[0-9A-Fa-f]{6}$/.test(v))designConfig.categoryColors[k]=v;
      });
    }
    if(['card','flat'].includes(obj.style))designConfig.style=obj.style;
    if(Array.isArray(obj.recentColors)){
      designConfig.recentColors=obj.recentColors
        .filter(c=>typeof c==='string'&&/^#[0-9A-Fa-f]{6}$/.test(c))
        .slice(0,8);
    }
  }catch(e){}
})();
function saveDesign(){
  try{localStorage.setItem(DESIGN_KEY,JSON.stringify(designConfig));}catch(e){}
}

// 文字コントラスト自動調整：背景色に対して読みやすい文字色を返す
function getContrastTextColor(hex){
  const m=hex.replace('#','').match(/.{2}/g);
  if(!m||m.length<3)return'#1A2E27';
  const [r,g,b]=m.map(s=>parseInt(s,16));
  // sRGB → 相対輝度
  const lum=(0.299*r+0.587*g+0.114*b)/255;
  return lum>0.62?'#1A2E27':'#FFFFFF';
}

// システムのダーク優先設定を検知
const sysDarkMql=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)');
function effectiveTheme(){
  if(designConfig.theme==='system'){
    return(sysDarkMql&&sysDarkMql.matches)?'dark':'light';
  }
  return designConfig.theme;
}

// CSS 変数とルート属性を反映
function applyDesign(){
  const root=document.documentElement;
  // テーマ
  root.setAttribute('data-theme',effectiveTheme());
  // カラーテーマ
  root.setAttribute('data-color-theme',designConfig.colorTheme);
  // 表示スタイル
  root.setAttribute('data-style',designConfig.style);
  // カテゴリカラー（CSS 変数）
  Object.entries(designConfig.categoryColors).forEach(([k,v])=>{
    root.style.setProperty(`--cat-${k}`,v);
  });
  // CATEGORIES 配列の色も同期（既存の描画は CATEGORIES.find(c=>c.key).color を参照）
  CATEGORIES.forEach(c=>{
    if(designConfig.categoryColors[c.key]){
      c.color=designConfig.categoryColors[c.key];
    }
  });
}

// システム連動：MQL の変更を監視
if(sysDarkMql){
  const handler=()=>{
    if(designConfig.theme==='system'){
      document.documentElement.setAttribute('data-theme',effectiveTheme());
      // 再描画でドロワー等のチェック状態を最新化
      if(typeof renderAllPanels==='function')renderAllPanels();
      if(typeof renderCalList==='function')renderCalList();
    }
  };
  if(sysDarkMql.addEventListener)sysDarkMql.addEventListener('change',handler);
  else if(sysDarkMql.addListener)sysDarkMql.addListener(handler);
}

// 設定変更時の共通フロー：保存 → CSS 反映 → 全画面再描画
function commitDesign({rerenderUI=true}={}){
  saveDesign();
  applyDesign();
  if(rerenderUI){
    if(typeof renderAllPanels==='function')renderAllPanels();
    if(typeof renderCalList==='function')renderCalList();
    if(typeof renderSearchFilters==='function')renderSearchFilters();
    if(typeof initCatLegend==='function')initCatLegend();
    if(typeof syncDrawerState==='function')syncDrawerState();
    if(typeof applySearchFilters==='function')applySearchFilters();
  }
  syncSettingsUI();
}

// 最近使った色の追加（先頭に移動、重複は除去、最大8件）
function pushRecentColor(hex){
  if(!hex||!/^#[0-9A-Fa-f]{6}$/.test(hex))return;
  hex=hex.toUpperCase();
  designConfig.recentColors=[hex,...designConfig.recentColors.filter(c=>c.toUpperCase()!==hex)].slice(0,8);
}

// 設定パネル UI を現在の状態に同期
function syncSettingsUI(){
  // テーマカード
  document.querySelectorAll('.theme-card').forEach(el=>{
    el.classList.toggle('is-active',el.dataset.theme===designConfig.theme);
  });
  // カラーテーマ
  document.querySelectorAll('.color-card').forEach(el=>{
    el.classList.toggle('is-active',el.dataset.color===designConfig.colorTheme);
  });
  // 表示スタイル
  document.querySelectorAll('.style-card').forEach(el=>{
    el.classList.toggle('is-active',el.dataset.style===designConfig.style);
  });
  // カテゴリカラー一覧の再描画（カテゴリ並び順は CATEGORIES に従う）
  const list=document.getElementById('cat-color-list');
  if(list){
    list.innerHTML=CATEGORIES.map(c=>{
      const v=designConfig.categoryColors[c.key]||c.color;
      return`<div class="cat-color-row">
        <span class="cat-color-name">${c.label}</span>
        <span class="cat-color-hex">${v.toUpperCase()}</span>
        <label class="cat-color-picker-wrap" style="background:${v};">
          <input type="color" value="${v}" data-cat-key="${c.key}" />
        </label>
      </div>`;
    }).join('');
  }
  // 最近使った色
  const rc=document.getElementById('recent-colors');
  if(rc){
    if(designConfig.recentColors.length===0){
      rc.innerHTML=`<span class="recent-colors-empty">カテゴリの色を変更すると、ここに履歴が表示されます</span>`;
    }else{
      rc.innerHTML=designConfig.recentColors.map(c=>
        `<span class="recent-color-chip" style="background:${c};" data-recent-color="${c}" title="${c}"></span>`
      ).join('');
    }
  }
}

// パネル開閉
function openDesignSettings(){
  applyDesign(); // 念のため
  syncSettingsUI();
  document.getElementById('settings-overlay').classList.add('show');
  const p=document.getElementById('settings-panel');
  p.classList.add('show');
  p.setAttribute('aria-hidden','false');
}
function closeDesignSettings(){
  document.getElementById('settings-overlay').classList.remove('show');
  const p=document.getElementById('settings-panel');
  p.classList.remove('show');
  p.setAttribute('aria-hidden','true');
}

// イベント結線
function initDesignSettings(){
  applyDesign();

  // ※ ドロワーから開く処理は initDrawer 内のイベント委譲で対応済み（#drawer-design / #drawer-settings）

  // パネル閉じる
  document.getElementById('settings-overlay').addEventListener('click',closeDesignSettings);
  document.getElementById('settings-close').addEventListener('click',closeDesignSettings);

  // テーマ
  document.querySelectorAll('.theme-card').forEach(el=>{
    el.addEventListener('click',()=>{
      designConfig.theme=el.dataset.theme;
      commitDesign();
    });
  });
  // カラーテーマ
  document.querySelectorAll('.color-card').forEach(el=>{
    el.addEventListener('click',()=>{
      designConfig.colorTheme=el.dataset.color;
      commitDesign();
    });
  });
  // 表示スタイル
  document.querySelectorAll('.style-card').forEach(el=>{
    el.addEventListener('click',()=>{
      designConfig.style=el.dataset.style;
      commitDesign();
    });
  });
  // カテゴリカラー（input イベントでライブプレビュー）
  const catList=document.getElementById('cat-color-list');
  if(catList){
    catList.addEventListener('input',e=>{
      const t=e.target;
      if(t.matches('input[type="color"]')){
        const key=t.dataset.catKey;
        const val=t.value.toUpperCase();
        if(!designConfig.categoryColors.hasOwnProperty(key))return;
        designConfig.categoryColors[key]=val;
        // hex ラベルとピッカー枠の即時反映（再描画前）
        const row=t.closest('.cat-color-row');
        if(row){
          const hex=row.querySelector('.cat-color-hex');if(hex)hex.textContent=val;
          const wrap=row.querySelector('.cat-color-picker-wrap');if(wrap)wrap.style.background=val;
        }
        applyDesign(); // CSS 反映のみ（軽量）
        // 再描画は change（離した瞬間）に行う：細かいドラッグでは負荷を避ける
      }
    });
    catList.addEventListener('change',e=>{
      const t=e.target;
      if(t.matches('input[type="color"]')){
        pushRecentColor(t.value);
        commitDesign();
      }
    });
  }
  // 最近使った色：クリックで「次に変更したカテゴリの参考値」というよりも、
  // タップしてどのカテゴリに適用するかを尋ねる UX は重い。
  // ここでは現在フォーカス中のカテゴリ行があれば、その色入力に反映するシンプル仕様にする。
  const rc=document.getElementById('recent-colors');
  if(rc){
    rc.addEventListener('click',e=>{
      const chip=e.target.closest('.recent-color-chip');
      if(!chip)return;
      const color=chip.dataset.recentColor;
      // 直近で操作されたカテゴリ行の色入力を更新（無ければ最初の行）
      const inputs=document.querySelectorAll('#cat-color-list input[type="color"]');
      if(inputs.length===0)return;
      let target=document.activeElement;
      if(!target||!target.matches('#cat-color-list input[type="color"]')){
        target=inputs[0];
      }
      target.value=color;
      const key=target.dataset.catKey;
      designConfig.categoryColors[key]=color.toUpperCase();
      pushRecentColor(color);
      commitDesign();
      showToast(`${(CATEGORIES.find(c=>c.key===key)||{}).label||key} の色を更新`);
    });
  }
  // リセット
  document.getElementById('settings-reset').addEventListener('click',()=>{
    if(!confirm('デザイン設定を初期状態に戻しますか？'))return;
    const recent=designConfig.recentColors; // 履歴は保持
    designConfig=JSON.parse(JSON.stringify(DESIGN_DEFAULTS));
    designConfig.recentColors=recent;
    commitDesign();
    showToast('デザインを初期化しました');
  });

  // パネルの下スワイプで閉じる
  let dragY=0,dragStartY=0,dragging=false;
  const panel=document.getElementById('settings-panel');
  panel.addEventListener('touchstart',e=>{
    if(e.touches.length!==1)return;
    // ヘッダー/グリップエリアからのスワイプのみ
    const grip=panel.querySelector('.settings-grip');
    const header=panel.querySelector('.settings-header');
    if(!grip.contains(e.target)&&!header.contains(e.target))return;
    dragStartY=e.touches[0].clientY;dragging=true;dragY=0;
  },{passive:true});
  panel.addEventListener('touchmove',e=>{
    if(!dragging)return;
    const dy=e.touches[0].clientY-dragStartY;
    if(dy>0){
      dragY=dy;
      panel.style.transition='none';
      panel.style.transform=`translateY(${dy}px)`;
    }
  },{passive:true});
  panel.addEventListener('touchend',()=>{
    if(!dragging)return;
    dragging=false;
    panel.style.transition='';
    if(dragY>80){
      panel.style.transform='';
      closeDesignSettings();
    }else{
      panel.style.transform='';
    }
    dragY=0;
  },{passive:true});
}

/* ================================================================ */
/* ★★★ 収支管理（Finance）モジュール ★★★                            */
/* 現在リセット中 → このブロックに新しい実装を追加してください       */
/* ================================================================ */
/*
  TODO: 新しい収支機能の実装ポイント
  
  1. データ定義
     - FINANCES_V2 = [] などで新しいデータ構造を定義
     - localStorage key: 'pronexax.finances.v2'
  
  2. CRUD
     - loadFinances() / saveFinances()
     - addFinance(data) / deleteFinance(id) / updateFinance(id, data)
  
  3. UI レンダリング
     - finRender() ... switchPage('finance') から自動呼び出しされる
     - finRenderList() / finRenderDetail() / finRenderEdit()
  
  4. カレンダー連動（任意）
     - _buildDailyChipForDate(ds) を再実装すれば
       カレンダー上に収支チップが表示される
  
  5. 削除フック（任意）
     - deleteEvent / deleteEventFromModal をラップして
       紐付き収支を連動削除できる
*/

/* === 最低限必要な finRender のスタブ（ページ切り替えエラー防止） === */
function finRender(){
  // ページ表示時にここが呼ばれる
  // 新しい実装でこの関数を上書きしてください
}

/* ================================================================ */
/* ★★★ Day View 時間ドラッグ選択 + モーダル時間入力 ★★★              */
/* ================================================================ */

// 状態：モーダルに渡したい時刻範囲（Day View からの遷移）
let dvPresetEndTime=null; // dvPresetStartTime は既存

// 時刻分→"HH:MM" / "HH:MM"→分
function _hhmmToMin(s){if(!s)return null;const m=s.match(/^(\d{1,2}):(\d{2})$/);if(!m)return null;return parseInt(m[1],10)*60+parseInt(m[2],10);}
function _minToHHMM(m){m=Math.max(0,Math.min(24*60,Math.round(m)));return`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;}

// 「時間指定」モードへの切替
function setTimeMode(mode){
  const toggle=document.getElementById('time-mode-toggle');
  const row=document.getElementById('time-row');
  const hint=document.getElementById('time-hint');
  if(!toggle||!row)return;
  toggle.querySelectorAll('.time-mode-btn').forEach(b=>{
    b.classList.toggle('is-active',b.dataset.mode===mode);
  });
  if(mode==='timed'){row.classList.remove('hidden');hint.classList.remove('hidden');}
  else{row.classList.add('hidden');hint.classList.add('hidden');}
}

// time-mode 切替ボタン結線（一度だけ）
(function bindTimeModeToggle(){
  document.addEventListener('DOMContentLoaded',()=>{},{once:true});
  // 即時バインド（DOM はこの時点で存在）
  const t=document.getElementById('time-mode-toggle');
  if(!t)return;
  t.addEventListener('click',e=>{
    const btn=e.target.closest('.time-mode-btn');
    if(!btn)return;
    setTimeMode(btn.dataset.mode);
    // 「時間指定」に切り替えた瞬間に開始/終了が空なら 09:00–10:00 を初期値に
    if(btn.dataset.mode==='timed'){
      const s=document.getElementById('input-start-time');
      const e2=document.getElementById('input-end-time');
      if(s&&!s.value)s.value='09:00';
      if(e2&&!e2.value)e2.value='10:00';
    }
  });
})();

// openModal 拡張：Day View からの時刻プリセットがあれば「時間指定」で開く
const _origOpenModalForTime=openModal;
openModal=function(ds,editId){
  _origOpenModalForTime(ds,editId);
  // step3 がレンダリング完了してから時刻フィールドを操作
  setTimeout(()=>{
    const stEl=document.getElementById('input-start-time');
    const enEl=document.getElementById('input-end-time');
    if(!stEl||!enEl)return;

    if(editId){
      // 編集：既存イベントが datetime を持つかチェック
      const ev=EVENTS.find(e=>e.id===editId);
      if(ev&&ev.start_datetime&&ev.end_datetime){
        const m1=ev.start_datetime.match(/T(\d{2}:\d{2})/);
        const m2=ev.end_datetime.match(/T(\d{2}:\d{2})/);
        if(m1&&m2){
          stEl.value=m1[1];enEl.value=m2[1];
          setTimeMode('timed');
        }else{setTimeMode('allday');stEl.value='';enEl.value='';}
      }else{
        setTimeMode('allday');stEl.value='';enEl.value='';
      }
    }else if(dvPresetStartTime){
      // 新規（Day View からのドラッグ/タップ）
      stEl.value=dvPresetStartTime;
      enEl.value=dvPresetEndTime||_minToHHMM(_hhmmToMin(dvPresetStartTime)+60);
      setTimeMode('timed');
    }else{
      setTimeMode('allday');stEl.value='';enEl.value='';
    }
  },20);
};

// closeModal 拡張：時刻プリセットもクリア
const _origCloseModalForTime=closeModal;
closeModal=function(){
  _origCloseModalForTime();
  dvPresetStartTime=null;dvPresetEndTime=null;
};

// submitEvent 拡張：「時間指定」モードなら datetime を保存
const _origSubmitEvent=submitEvent;
submitEvent=function(){
  // 既存処理に委譲する前に、現在のモード/時刻を覚えておく
  const isTimed=document.getElementById('time-row')&&!document.getElementById('time-row').classList.contains('hidden');
  const stEl=document.getElementById('input-start-time');
  const enEl=document.getElementById('input-end-time');
  const startDate=document.getElementById('input-start').value;
  const endDate=document.getElementById('input-end').value||startDate;
  const stT=stEl?stEl.value:'';
  const enT=enEl?enEl.value:'';

  // バリデーション：時間指定で 終了 <= 開始 は不可（同日内）
  if(isTimed&&stT&&enT&&startDate===endDate){
    if(_hhmmToMin(enT)<=_hhmmToMin(stT)){
      showToast('終了時刻は開始時刻より後に設定してください');
      return;
    }
  }

  const wasEdit=!!editingId;
  const editId=editingId;

  _origSubmitEvent();

  // 既存処理が成功した直後の EVENTS を更新（datetime 付与/除去）
  // 直前の EVENTS は既に更新済み。最新のイベントを特定して datetime を付与
  let target=null;
  if(wasEdit){
    target=EVENTS.find(e=>e.id===editId);
  }else{
    // 新規：直前 push されたもの（id 最大）
    if(EVENTS.length>0)target=EVENTS[EVENTS.length-1];
  }
  if(!target)return;

  if(isTimed&&stT&&enT&&startDate){
    target.start_datetime=`${startDate}T${stT}`;
    target.end_datetime=`${endDate}T${enT}`;
  }else{
    delete target.start_datetime;
    delete target.end_datetime;
  }
  // Day View に再描画反映
  if(typeof renderAllPanels==='function')renderAllPanels();
};

/* ===== Day View タイムライン上の時間ドラッグ選択 ===== */
const DV_DRAG_SNAP=15; // 分
let dvDragState=null;
/*
  dvDragState = {
    ds, area (events area), pxPerMin, startMin, endMin, anchorMin,
    selEl, tipStartEl, tipEndEl, moved, isPointerActive
  }
*/

// ピクセル → 分（イベント領域の局所 y）
function _dvPxToMin(yPx){
  // 1時間 = 64px → 1px = 60/64 分
  return yPx*(60/DV_HOUR_HEIGHT);
}
// 分 → ピクセル
function _dvMinToPx(min){return min*(DV_HOUR_HEIGHT/60);}
// 15分単位にスナップ
function _dvSnap(min){return Math.round(min/DV_DRAG_SNAP)*DV_DRAG_SNAP;}

function dvBindDragSelect(view){
  // 初回のみ document レベルで委譲バインドを行う。view ごとの再バインドは不要。
  if(window._dvDragSelectGloballyBound)return;
  window._dvDragSelectGloballyBound=true;

  // 現在トラッキング中の状態
  let lpTimer=null;
  let startY=0,startX=0;
  let touchActive=false;
  let activeView=null,activeArea=null,activeInner=null,activeTl=null,activeDs=null;
  let pendingAnchorMin=0;

  // 自動スクロール用
  let autoScrollRAF=null;
  let lastClientY=0;

  const _stopAutoScroll=()=>{
    if(autoScrollRAF){cancelAnimationFrame(autoScrollRAF);autoScrollRAF=null;}
  };
  const _runAutoScroll=()=>{
    if(!dvDragState||!activeTl){_stopAutoScroll();return;}
    const tlRect=activeTl.getBoundingClientRect();
    const edge=80; // 端からの判定領域（仕様: 80px）
    let dy=0;
    if(lastClientY<tlRect.top+edge){
      // 端に近いほど速く
      const ratio=Math.max(0,Math.min(1,(tlRect.top+edge-lastClientY)/edge));
      dy=-Math.ceil(2+ratio*8);
    }else if(lastClientY>tlRect.bottom-edge){
      const ratio=Math.max(0,Math.min(1,(lastClientY-(tlRect.bottom-edge))/edge));
      dy=Math.ceil(2+ratio*8);
    }
    if(dy!==0){
      const before=activeTl.scrollTop;
      activeTl.scrollTop=Math.max(0,Math.min(activeTl.scrollHeight-activeTl.clientHeight,activeTl.scrollTop+dy));
      // スクロールが効いた場合、現在の指の位置で範囲を再計算
      if(activeTl.scrollTop!==before){
        _dvUpdateDragSelect(lastClientY);
      }
    }
    autoScrollRAF=requestAnimationFrame(_runAutoScroll);
  };

  // 現在の touch 位置から view を解決（DOM 上の cal-day-view 要素）
  const _resolveActiveView=(target)=>{
    const v=target&&target.closest&&target.closest('#cal-day-view, .cal-day-view');
    if(!v)return null;
    activeView=v;
    activeArea=v.querySelector('.dv-events-area');
    activeInner=v.querySelector('.dv-timeline-inner');
    activeTl=v.querySelector('.dv-timeline');
    activeDs=v.dataset.ds;
    return (activeArea&&activeInner&&activeTl&&activeDs)?v:null;
  };

  const onTouchStart=(e)=>{
    // Day View が表示中でない場合は何もしない
    if(typeof viewMode!=='undefined'&&viewMode!=='day')return;
    const target=e.target;
    if(!target||!target.closest)return;
    // 既存イベント／終日エリアは除外
    if(target.closest('.dv-event'))return;
    if(target.closest('.dv-allday'))return;
    // 既にドラッグ中なら無視
    if(dvDragState)return;
    // マルチタッチは無視
    if(e.touches&&e.touches.length!==1)return;
    // Day View 内かつ events-area 配下のみ反応
    if(!_resolveActiveView(target))return;
    if(!target.closest('.dv-events-area'))return;

    const t=e.touches?e.touches[0]:e;
    startY=t.clientY;startX=t.clientX;
    lastClientY=t.clientY;
    touchActive=true;

    const rect=activeArea.getBoundingClientRect();
    const localY=t.clientY-rect.top+activeTl.scrollTop;
    const anchorRawMin=_dvPxToMin(localY);
    pendingAnchorMin=Math.max(0,Math.min(24*60,_dvSnap(anchorRawMin)));

    clearTimeout(lpTimer);
    lpTimer=setTimeout(()=>{
      if(!touchActive)return;
      _dvStartDragSelect(activeDs,activeArea,activeInner,activeTl,pendingAnchorMin);
      if(navigator.vibrate)try{navigator.vibrate(15);}catch(err){}
      activeArea.classList.add('is-dragging');
      // 自動スクロール開始
      _stopAutoScroll();
      autoScrollRAF=requestAnimationFrame(_runAutoScroll);
    },180); // 仕様: 約150〜200ms
  };

  const onTouchMove=(e)=>{
    const t=e.touches?e.touches[0]:e;
    if(!t)return;
    lastClientY=t.clientY;
    if(dvDragState){
      // ドラッグ中：ページスクロール抑止＋範囲更新
      e.preventDefault();
      _dvUpdateDragSelect(t.clientY);
      return;
    }
    // 長押し開始判定中：閾値以上動いたらキャンセル（通常スクロールに譲る）
    if(touchActive&&lpTimer){
      const dx=t.clientX-startX,dy=t.clientY-startY;
      if(Math.abs(dx)>10||Math.abs(dy)>10){
        clearTimeout(lpTimer);lpTimer=null;
        touchActive=false;
      }
    }
  };

  const onTouchEnd=(e)=>{
    clearTimeout(lpTimer);lpTimer=null;
    touchActive=false;
    _stopAutoScroll();
    if(dvDragState)_dvFinishDragSelect();
  };

  const onTouchCancel=()=>{
    clearTimeout(lpTimer);lpTimer=null;
    touchActive=false;
    _stopAutoScroll();
    if(dvDragState)_dvCancelDragSelect();
  };

  // document レベルで委譲（DOM 再生成に強い）
  document.addEventListener('touchstart',onTouchStart,{passive:true});
  document.addEventListener('touchmove',onTouchMove,{passive:false});
  document.addEventListener('touchend',onTouchEnd,{passive:true});
  document.addEventListener('touchcancel',onTouchCancel,{passive:true});
  // マウス操作（PC でのテスト用）
  document.addEventListener('mousedown',(e)=>{
    if(e.button!==0)return;
    onTouchStart(e);
  });
  document.addEventListener('mousemove',(e)=>{
    if(!touchActive&&!dvDragState)return;
    onTouchMove(e);
  });
  document.addEventListener('mouseup',onTouchEnd);
}

function _dvStartDragSelect(ds,area,inner,tl,anchorMin){
  // 重複イベントがある時間帯は許容するが、視認性のため上下の重なりは表示する
  const startMin=anchorMin;
  const endMin=Math.min(24*60,anchorMin+60); // 初期 1時間
  const selEl=document.createElement('div');
  selEl.className='dv-drag-select';
  selEl.innerHTML=`
    <div class="dv-drag-select-time" id="dv-drag-time"></div>
    <div class="dv-drag-select-duration" id="dv-drag-duration"></div>
    <div class="dv-drag-select-hint">指を離して作成</div>`;
  area.appendChild(selEl);
  // 上下のラベル（バッジ）
  const tipStart=document.createElement('div');tipStart.className='dv-drag-tip';
  const tipEnd=document.createElement('div');tipEnd.className='dv-drag-tip';
  inner.appendChild(tipStart);inner.appendChild(tipEnd);

  dvDragState={
    ds,area,inner,tl,
    anchorMin:anchorMin,
    startMin:startMin,
    endMin:endMin,
    selEl,tipStartEl:tipStart,tipEndEl:tipEnd,
    moved:false,
  };
  _dvPaintSelection();
}

function _dvUpdateDragSelect(clientY){
  if(!dvDragState)return;
  const{area,inner,tl,anchorMin}=dvDragState;
  const rect=area.getBoundingClientRect();
  let localY=clientY-rect.top+tl.scrollTop;
  // 上下端でのオートスクロール
  const tlRect=tl.getBoundingClientRect();
  const edge=36;
  if(clientY<tlRect.top+edge){tl.scrollTop=Math.max(0,tl.scrollTop-6);}
  else if(clientY>tlRect.bottom-edge){tl.scrollTop=tl.scrollTop+6;}
  // 局所 y を 分 へ
  let curMin=_dvPxToMin(localY);
  curMin=_dvSnap(curMin);
  curMin=Math.max(0,Math.min(24*60,curMin));
  // anchor を起点に範囲決定
  let s,e;
  if(curMin>=anchorMin){s=anchorMin;e=Math.max(curMin,anchorMin+15);} // 最小15分
  else{s=Math.min(curMin,anchorMin-15);e=anchorMin;}
  if(s<0)s=0;if(e>24*60)e=24*60;
  if(s===dvDragState.startMin&&e===dvDragState.endMin)return;
  dvDragState.startMin=s;dvDragState.endMin=e;
  dvDragState.moved=true;
  _dvPaintSelection();
}

function _dvPaintSelection(){
  if(!dvDragState)return;
  const{startMin,endMin,selEl,tipStartEl,tipEndEl}=dvDragState;
  const top=_dvMinToPx(startMin);
  const height=Math.max(_dvMinToPx(endMin-startMin),28);
  selEl.style.top=top+'px';
  selEl.style.height=height+'px';
  // 内部テキスト
  const timeEl=selEl.querySelector('#dv-drag-time');
  const durEl=selEl.querySelector('#dv-drag-duration');
  if(timeEl)timeEl.textContent=`${_minToHHMM(startMin)} – ${_minToHHMM(endMin)}`;
  if(durEl){
    const d=endMin-startMin;
    const h=Math.floor(d/60),m=d%60;
    durEl.textContent=h>0?(m>0?`${h}時間${m}分`:`${h}時間`):`${m}分`;
  }
  // バッジは inner 全体に対する top（area と inner は top=0 揃え）
  const innerLeftPad=44; // .dv-time-col 幅
  tipStartEl.style.top=_dvMinToPx(startMin)+'px';
  tipStartEl.style.left=(innerLeftPad+6)+'px';
  tipStartEl.textContent=_minToHHMM(startMin);
  tipEndEl.style.top=_dvMinToPx(endMin)+'px';
  tipEndEl.style.left=(innerLeftPad+6)+'px';
  tipEndEl.textContent=_minToHHMM(endMin);
}

function _dvCleanupDragSelect(){
  if(!dvDragState)return;
  const{selEl,tipStartEl,tipEndEl,area}=dvDragState;
  if(selEl&&selEl.parentNode)selEl.parentNode.removeChild(selEl);
  if(tipStartEl&&tipStartEl.parentNode)tipStartEl.parentNode.removeChild(tipStartEl);
  if(tipEndEl&&tipEndEl.parentNode)tipEndEl.parentNode.removeChild(tipEndEl);
  if(area)area.classList.remove('is-dragging');
  dvDragState=null;
}

function _dvCancelDragSelect(){_dvCleanupDragSelect();}

function _dvFinishDragSelect(){
  if(!dvDragState)return;
  const{ds,startMin,endMin}=dvDragState;
  _dvCleanupDragSelect();
  // この後発火する slot の click を 600ms 抑止
  _dvSuppressClickUntil=Date.now()+600;
  // モーダルを開いて時刻を流し込む
  dvPresetStartTime=_minToHHMM(startMin);
  dvPresetEndTime=_minToHHMM(endMin);
  openCreateModal(ds);
  showToast(`${dvPresetStartTime}–${dvPresetEndTime} で予定作成`);
}

// 直前にドラッグ選択が成立した直後に、ブラウザ仕様で発火する click を抑止
let _dvSuppressClickUntil=0;

// dvOnSlotClick を「タップ＝1時間ブロック」に格上げ
dvOnSlotClick=function(ds,timeStr){
  // ドラッグ中・ドラッグ直後はクリックを無視
  if(dvDragState)return;
  if(Date.now()<_dvSuppressClickUntil)return;
  // 1時間のデフォルトを終了時刻として設定
  const startMin=_hhmmToMin(timeStr);
  const endMin=Math.min(24*60,startMin+60);
  dvPresetStartTime=timeStr;
  dvPresetEndTime=_minToHHMM(endMin);
  openCreateModal(ds);
  showToast(`${dvPresetStartTime}–${dvPresetEndTime} で予定作成`);
};

// 初期描画
updateMonthLabel();
if(viewMode!=='month'&&!viewBaseDate){viewBaseDate=todayStr();}
applyDesign(); // ★★★ デザイン設定を最初に CSS 反映
migrateEventsForDeadline(); // ★★★ 既存イベントに締切・通知設定を補完
// 初期 viewMode の表示制御（month / それ以外 を完全分離）
_applyViewLayout(viewMode);
renderAllPanels();renderCalList();initSwipe();renderSearchFilters();initSplitHandle();initCatLegend();
initDrawer();syncDrawerState();
initDesignSettings(); // ★★★ デザイン設定 UI を初期化
startNotificationLoop(); // ★★★ 通知エンジンを起動
// ★★★ 検索画面：モードタブの結線 + 初回描画 ★★★
(function initSearchUI(){
  const tabs=document.getElementById('search-mode-tabs');
  if(tabs){
    tabs.addEventListener('click',e=>{
      const tab=e.target.closest('.search-mode-tab');
      if(!tab)return;
      setSearchMode(tab.dataset.mode);
    });
  }
  initComplexSearch(); // ★ 複合検索を初期化
  applySearchFilters();
})();
// Day View 時間ドラッグ選択：document レベル委譲で1度だけバインド
dvBindDragSelect();
setTimeout(()=>{['input-title','input-start'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener('input',checkSubmit);});},200);

/* =====================================================================
   ★★★ iOSホイールピッカー v2 JS — Apple純正カレンダー風
   ===================================================================== */
(function(){
  // ── 定数 ──
  const ITEM_H=44; // アイテム高さ(px) ← CSS .wp-item height と一致
  const SPACER_H=88; // スペーサー高さ ← CSS .wp-spacer と一致

  // ── 状態 ──
  const WP={
    isAllDay:false,
    minuteInterval:5,
    activeTab:'start',
    startDate:null, // Date オブジェクト
    endDate:null,
    remind:{on:false,key:'30min'},
  };
  const REMIND_OPTIONS=[
    {key:'30min',label:'30分前'},
    {key:'1hour',label:'1時間前'},
    {key:'dayBefore',label:'前日'},
    {key:'sameDay',label:'当日朝'},
    {key:'1week',label:'1週間前'},
  ];

  const DOW=['日','月','火','水','木','金','土'];

  function pad(n){return String(n).padStart(2,'0');}
  function cloneDate(d){return new Date(d.getTime());}

  function nowDate(){
    const d=new Date();
    // 分を minuteInterval に丸める
    d.setSeconds(0,0);
    const m=d.getMinutes();
    const interval=WP.minuteInterval||5;
    d.setMinutes(Math.ceil(m/interval)*interval%60);
    if(Math.ceil(m/interval)*interval>=60){d.setHours(d.getHours()+1);d.setMinutes(0);}
    return d;
  }

  // ── 日付リスト生成 ──
  function buildDateList(){
    // ±180日
    const items=[];
    const base=new Date(); base.setHours(0,0,0,0);
    for(let i=-180;i<=365;i++){
      const d=new Date(base);
      d.setDate(base.getDate()+i);
      items.push(d);
    }
    return items;
  }
  let _dateList=buildDateList();

  function _dateLabel(d){
    const m=d.getMonth()+1;
    const day=d.getDate();
    const dow=DOW[d.getDay()];
    const today=new Date();today.setHours(0,0,0,0);
    const isToday=d.getTime()===today.getTime();
    const tmr=new Date(today);tmr.setDate(today.getDate()+1);
    const isYes=d.getTime()-today.getTime()===-86400000;
    if(isToday) return`今日 ${m}/${day}(${dow})`;
    if(d.getTime()===tmr.getTime()) return`明日 ${m}/${day}(${dow})`;
    return`${m}月${day}日(${dow})`;
  }

  function _hourList(){return Array.from({length:24},(_,i)=>i);}
  function _minuteList(){
    const iv=WP.minuteInterval||5;
    const list=[];
    for(let m=0;m<60;m+=iv)list.push(m);
    return list;
  }

  // ── ピッカー描画 ──
  function fillScroll(elId,items,selectedVal,labelFn){
    const el=document.getElementById(elId);
    if(!el)return;
    el.innerHTML='';
    const top=document.createElement('div');top.className='wp-spacer';el.appendChild(top);
    items.forEach(v=>{
      const d=document.createElement('div');
      d.className='wp-item';
      d.dataset.val=v;
      const lbl=labelFn?labelFn(v):pad(v);
      d.textContent=lbl;
      if(v===selectedVal||
        (v instanceof Date&&selectedVal instanceof Date&&v.toDateString()===selectedVal.toDateString())){
        d.classList.add('selected');
      }
      el.appendChild(d);
    });
    const bot=document.createElement('div');bot.className='wp-spacer';el.appendChild(bot);
  }

  function scrollToIdx(elId,idx,smooth){
    const el=document.getElementById(elId);
    if(!el)return;
    el.scrollTo({top:idx*ITEM_H,behavior:smooth?'smooth':'auto'});
  }

  function getIdxByVal(elId,val){
    const el=document.getElementById(elId);
    if(!el)return 0;
    const items=[...el.querySelectorAll('.wp-item')];
    const idx=items.findIndex(it=>{
      if(val instanceof Date){
        const dv=_dateList[parseInt(it.dataset.val,10)];
        return dv&&dv.toDateString()===val.toDateString();
      }
      return +it.dataset.val===val;
    });
    return Math.max(0,idx);
  }

  // 日付スクロールは Date を dataset に index で保持
  function fillDateScroll(selectedDate){
    const el=document.getElementById('wp-date-scroll');
    if(!el)return;
    el.innerHTML='';
    const top=document.createElement('div');top.className='wp-spacer';el.appendChild(top);
    _dateList.forEach((d,i)=>{
      const item=document.createElement('div');
      item.className='wp-item';
      item.dataset.val=i;
      item.textContent=_dateLabel(d);
      if(d.toDateString()===selectedDate.toDateString())item.classList.add('selected');
      el.appendChild(item);
    });
    const bot=document.createElement('div');bot.className='wp-spacer';el.appendChild(bot);
  }

  function getSelectedDateIdx(){
    const el=document.getElementById('wp-date-scroll');
    if(!el)return 0;
    return Math.round(el.scrollTop/ITEM_H);
  }
  function getSelectedDate(){
    return _dateList[getSelectedDateIdx()]||new Date();
  }

  function buildCols(targetDate){
    const d=targetDate||new Date();
    // ★ 安全弁：targetDate が _dateList に含まれない場合は d を中心に再構築
    if(!_dateList.some(x=>x.toDateString()===d.toDateString())){
      _dateList=(function(center){
        const list=[];
        const b=new Date(center.getFullYear(),center.getMonth(),center.getDate());
        for(let i=-365;i<=730;i++){
          const dd=new Date(b);
          dd.setDate(b.getDate()+i);
          list.push(dd);
        }
        return list;
      })(d);
    }
    // 日付列
    fillDateScroll(d);
    const dateIdx=_dateList.findIndex(x=>x.toDateString()===d.toDateString());
    setTimeout(()=>scrollToIdx('wp-date-scroll',Math.max(0,dateIdx),false),20);

    // 時間列
    const hours=_hourList();
    fillScroll('wp-hour-scroll',hours,d.getHours(),(v)=>pad(v));
    setTimeout(()=>scrollToIdx('wp-hour-scroll',d.getHours(),false),20);

    // 分列
    const minutes=_minuteList();
    const closestMin=minutes.reduce((a,b)=>Math.abs(b-d.getMinutes())<Math.abs(a-d.getMinutes())?b:a,0);
    const minIdx=minutes.indexOf(closestMin);
    fillScroll('wp-minute-scroll',minutes,closestMin,(v)=>pad(v));
    setTimeout(()=>scrollToIdx('wp-minute-scroll',Math.max(0,minIdx),false),20);
  }

  function getActiveDate(){return WP.activeTab==='start'?WP.startDate:WP.endDate;}
  function setActiveDate(d){
    if(WP.activeTab==='start'){WP.startDate=d;}
    else{WP.endDate=d;}
  }

  // ── 現在のピッカー値を読み取り → Dateに変換 ──
  function readPickerDate(){
    const dateEl=document.getElementById('wp-date-scroll');
    const dateIdx=dateEl?Math.round(dateEl.scrollTop/ITEM_H):0;
    const base=_dateList[Math.max(0,Math.min(dateIdx,_dateList.length-1))];
    const d=new Date(base);

    if(!WP.isAllDay){
      // 時
      const hEl=document.getElementById('wp-hour-scroll');
      const hIdx=hEl?Math.round(hEl.scrollTop/ITEM_H):0;
      const hours=_hourList();
      d.setHours(hours[Math.max(0,Math.min(hIdx,hours.length-1))]);
      // 分
      const mEl=document.getElementById('wp-minute-scroll');
      const mIdx=mEl?Math.round(mEl.scrollTop/ITEM_H):0;
      const mins=_minuteList();
      d.setMinutes(mins[Math.max(0,Math.min(mIdx,mins.length-1))]);
    }else{
      d.setHours(0,0,0,0);
    }
    return d;
  }

  // ── UIテキスト更新 ──
  function fmtDate(d,allDay){
    const m=d.getMonth()+1;
    const day=d.getDate();
    const dow=DOW[d.getDay()];
    if(allDay) return`${m}/${day}(${dow})`;
    return`${m}/${day}(${dow}) ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function updateTabVals(){
    const sv=document.getElementById('wp-tab-start-val');
    const ev=document.getElementById('wp-tab-end-val');
    if(sv&&WP.startDate)sv.textContent=fmtDate(WP.startDate,WP.isAllDay);
    if(ev&&WP.endDate)ev.textContent=fmtDate(WP.endDate,WP.isAllDay);
  }

  function updateTriggers(){
    if(!WP.startDate||!WP.endDate)return;
    function fmt(d){
      if(WP.isAllDay){
        return`${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())}`;
      }
      return`${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    const sd=document.getElementById('wp-start-date-display');
    const ed=document.getElementById('wp-end-date-display');
    if(sd){sd.textContent=fmt(WP.startDate);sd.classList.remove('empty');}
    if(ed){ed.textContent=fmt(WP.endDate);ed.classList.remove('empty');}
    document.getElementById('wp-start-trigger')?.classList.add('is-set');
    document.getElementById('wp-end-trigger')?.classList.add('is-set');
    // 時間トグル
    const tt=document.getElementById('wp-time-trigger');
    const tl=document.getElementById('wp-time-trigger-label');
    if(tt&&tl){
      if(!WP.isAllDay){
        tt.classList.add('is-timed');
        tl.textContent=`${pad(WP.startDate.getHours())}:${pad(WP.startDate.getMinutes())} 〜 ${pad(WP.endDate.getHours())}:${pad(WP.endDate.getMinutes())}`;
      }else{
        tt.classList.remove('is-timed');
        tl.textContent='終日';
      }
    }
    // 隠しフィールド互換
    const toDateStr=dt=>`${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;
    const toTimeStr=dt=>`${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    const inS=document.getElementById('input-start');
    const inE=document.getElementById('input-end');
    const inST=document.getElementById('input-start-time');
    const inET=document.getElementById('input-end-time');
    if(inS)inS.value=toDateStr(WP.startDate);
    if(inE)inE.value=toDateStr(WP.endDate);
    if(inST)inST.value=toTimeStr(WP.startDate);
    if(inET)inET.value=toTimeStr(WP.endDate);
    if(typeof checkSubmit==='function')checkSubmit();
    updateTabVals();
  }

  // ── 開始>終了のとき自動補正 ──
  function autoCorrect(){
    if(!WP.startDate||!WP.endDate)return;
    if(WP.isAllDay){
      if(WP.endDate<WP.startDate){
        WP.endDate=cloneDate(WP.startDate);
      }
    }else{
      if(WP.endDate<=WP.startDate){
        WP.endDate=new Date(WP.startDate.getTime()+60*60*1000);
      }
    }
  }

  // ── スクロール完了→値確定 ──
  let _scrollTimers={};
  function bindScroll(scrollId,onChanged){
    const el=document.getElementById(scrollId);
    if(!el)return;
    // updateSelected クラス
    function updateSel(){
      const idx=Math.round(el.scrollTop/ITEM_H);
      el.querySelectorAll('.wp-item').forEach((it,i)=>it.classList.toggle('selected',i===idx));
    }
    el.addEventListener('scroll',()=>{
      updateSel();
      clearTimeout(_scrollTimers[scrollId]);
      _scrollTimers[scrollId]=setTimeout(()=>{
        // スナップ位置に吸着
        const idx=Math.round(el.scrollTop/ITEM_H);
        el.scrollTo({top:idx*ITEM_H,behavior:'smooth'});
        updateSel();
        if(typeof onChanged==='function')onChanged();
      },120);
    },{passive:true});
  }

  function initScrollBindings(){
    bindScroll('wp-date-scroll',()=>{
      const d=readPickerDate();
      setActiveDate(d);
      autoCorrect();
      updateTriggers();
    });
    bindScroll('wp-hour-scroll',()=>{
      const d=readPickerDate();
      setActiveDate(d);
      autoCorrect();
      updateTriggers();
    });
    bindScroll('wp-minute-scroll',()=>{
      const d=readPickerDate();
      setActiveDate(d);
      autoCorrect();
      updateTriggers();
    });
  }

  // ── 終日トグル ──
  window.wpToggleAllDay=function(){
    WP.isAllDay=!WP.isAllDay;
    // 隠しフィールドとのsetTimeMode互換
    if(typeof setTimeMode==='function'){
      setTimeMode(WP.isAllDay?'allday':'timed');
    }
    _wpRefreshTimeCols();
    updateTriggers();
    // form内の時間トグルも同期
    const tt=document.getElementById('wp-time-trigger');
    const tl=document.getElementById('wp-time-trigger-label');
    if(tt)tt.classList.toggle('is-timed',!WP.isAllDay);
  };
  function _wpRefreshTimeCols(){
    const colH=document.getElementById('wp-col-hour');
    const colM=document.getElementById('wp-col-min');
    const tog=document.getElementById('wp-allday-toggle');
    const intervalRow=document.getElementById('wp-interval-row');
    if(colH)colH.style.display=WP.isAllDay?'none':'flex';
    if(colM)colM.style.display=WP.isAllDay?'none':'flex';
    if(tog)tog.classList.toggle('is-on',WP.isAllDay);
    if(intervalRow)intervalRow.style.display=WP.isAllDay?'none':'flex';
  }

  // ── 分インターバル変更 ──
  window.wpSetInterval=function(iv){
    WP.minuteInterval=iv;
    // アクティブボタン更新
    document.querySelectorAll('.wp-interval-btn').forEach(btn=>{
      btn.classList.toggle('is-active',+btn.dataset.interval===iv);
    });
    // 現在の選択日時を保持しつつ再描画
    const cur=getActiveDate();
    const mins=_minuteList();
    const closest=mins.reduce((a,b)=>Math.abs(b-cur.getMinutes())<Math.abs(a-cur.getMinutes())?b:a,0);
    fillScroll('wp-minute-scroll',mins,closest,(v)=>pad(v));
    const mIdx=mins.indexOf(closest);
    setTimeout(()=>scrollToIdx('wp-minute-scroll',Math.max(0,mIdx),false),10);
  };

  // ── タブ切替 ──
  window.wpSwitchTab=function(tab){
    WP.activeTab=tab;
    document.getElementById('wp-tab-start')?.classList.toggle('active',tab==='start');
    document.getElementById('wp-tab-end')?.classList.toggle('active',tab==='end');
    buildCols(getActiveDate());
  };

  // ── ピッカーを開く ──
  window.wpOpen=function(tab){
    WP.activeTab=tab||'start';

    // ★★★ 修正：selectedDate（カレンダータップ日）を単一ソースとして使う ★★★
    // new Date('YYYY-MM-DD') はUTCパースでズレが出るため new Date(y,m,d) 形式を使用
    function parseDateLocal(dateStr){
      // 'YYYY-MM-DD' → new Date(year, monthIndex, day)
      if(!dateStr)return null;
      const[y,mo,dy]=dateStr.split('-').map(Number);
      if(!y||isNaN(y))return null;
      return new Date(y,mo-1,dy);
    }

    // 隠しフィールドの時刻文字列を読む（編集時のみ有効な値が入っている）
    const stEl=document.getElementById('input-start-time');
    const enEl=document.getElementById('input-end-time');
    const hasTime=!!(stEl?.value);

    // カレンダーでタップされた日付（グローバル selectedDate / input-start のどちらか）
    // 編集モード（editingId あり）の場合は隠しフィールドの日付をそのまま使う
    const isEdit=typeof editingId!=='undefined'&&editingId!=null;

    let baseDate=null;
    if(isEdit){
      // 編集：既存イベントの日付をベースにする
      baseDate=parseDateLocal(document.getElementById('input-start')?.value);
    } else {
      // 新規：グローバル selectedDate（カレンダーでタップした日）を最優先
      const selDs=typeof selectedDate!=='undefined'?selectedDate:null;
      const inS=document.getElementById('input-start')?.value;
      // selectedDate と input-start が一致しているはずだが、selectedDate を信頼する
      baseDate=parseDateLocal(selDs||inS);
    }

    // fallback：今日
    if(!baseDate||isNaN(baseDate.getTime())){
      const t=new Date();
      baseDate=new Date(t.getFullYear(),t.getMonth(),t.getDate());
    }

    // ★★★ baseDate（タップ日）を中心に _dateList を再構築 ★★★
    // 元実装は「ページ読み込み日」を中心に ±180 日固定だったため、
    // それより前後の月をタップすると findIndex が -1 を返し、Math.max(0,-1)=0 により
    // _dateList の先頭日（例：11月10日）に固定されてしまっていた。
    _dateList=(function(center){
      const list=[];
      const b=new Date(center.getFullYear(),center.getMonth(),center.getDate());
      for(let i=-365;i<=730;i++){
        const dd=new Date(b);
        dd.setDate(b.getDate()+i);
        list.push(dd);
      }
      return list;
    })(baseDate);

    if(isEdit&&hasTime){
      // 編集かつ時刻あり：既存の時刻を復元
      const[sh,sm]=stEl.value.split(':').map(Number);
      WP.startDate=new Date(baseDate.getFullYear(),baseDate.getMonth(),baseDate.getDate(),sh||9,sm||0,0,0);
      const endBase=parseDateLocal(document.getElementById('input-end')?.value)||baseDate;
      const[eh,em]=enEl.value.split(':').map(Number);
      WP.endDate=new Date(endBase.getFullYear(),endBase.getMonth(),endBase.getDate(),eh||10,em||0,0,0);
      WP.isAllDay=false;
    } else {
      // 新規 or 終日：selectedDate 基準で毎回リセット（以前の値を残さない）
      WP.startDate=new Date(baseDate.getFullYear(),baseDate.getMonth(),baseDate.getDate(),9,0,0,0);
      WP.endDate  =new Date(baseDate.getFullYear(),baseDate.getMonth(),baseDate.getDate(),10,0,0,0);
      WP.isAllDay =!hasTime;
    }

    console.log('[wpOpen] selectedDate=',typeof selectedDate!=='undefined'?selectedDate:'(undef)',
      '→ WP.startDate=',WP.startDate,'WP.endDate=',WP.endDate,'isEdit=',isEdit);

    _wpRefreshTimeCols();
    updateTabVals();
    buildCols(getActiveDate());
    _wpRefreshRemind();
    document.getElementById('wp-overlay').classList.add('show');
  };

  window.wpClose=function(){
    document.getElementById('wp-overlay').classList.remove('show');
  };

  window.wpDone=function(){
    // 最終値を確定
    const d=readPickerDate();
    setActiveDate(d);
    autoCorrect();
    updateTriggers();
    wpClose();
  };

  // 旧 wpToggleTimed 互換（form 内の時間トグルボタンから呼ばれる）
  window.wpToggleTimed=function(){
    WP.isAllDay=!WP.isAllDay;
    _wpRefreshTimeCols();
    updateTriggers();
    if(typeof setTimeMode==='function'){
      setTimeMode(WP.isAllDay?'allday':'timed');
    }
  };

  // ── リマインドUI ──
  function _wpRefreshRemind(){
    const bell=document.getElementById('wp-bell-btn');
    const pill=document.getElementById('wp-remind-pill');
    const txt=document.getElementById('wp-remind-text');
    if(!bell||!pill||!txt)return;
    bell.classList.toggle('is-on',WP.remind.on);
    pill.classList.toggle('is-on',WP.remind.on);
    const opt=REMIND_OPTIONS.find(o=>o.key===WP.remind.key)||REMIND_OPTIONS[0];
    txt.textContent=opt.label;
    pill.style.opacity=WP.remind.on?'1':'0.5';
  }

  window.wpToggleBell=function(){
    WP.remind.on=!WP.remind.on;
    const bell=document.getElementById('wp-bell-btn');
    if(bell){bell.classList.add('ring');setTimeout(()=>bell.classList.remove('ring'),600);}
    _wpRefreshRemind();
    if(typeof _syncRemindFromWP==='function')_syncRemindFromWP();
  };

  window.wpOpenRemind=function(){
    if(typeof openRemindSheet==='function'){
      openRemindSheet();
      const orig=window._onRemindSelected;
      window._onRemindSelected=function(key){
        WP.remind.key=key;WP.remind.on=true;
        _wpRefreshRemind();
        if(typeof orig==='function')orig(key);
      };
    }
  };

  window.wpPickRemind=function(key){
    WP.remind.key=key;WP.remind.on=true;
    _wpRefreshRemind();
    closeRemindSheet?.();
  };

  const _origSelectRemind=window._selectRemindOption;
  window._selectRemindOption=function(key){
    WP.remind.key=key;
    _wpRefreshRemind();
    if(typeof _origSelectRemind==='function')_origSelectRemind(key);
  };

  // prefillForm フック
  const _origPrefill=window.prefillForm;
  window.prefillForm=function(tour){
    if(typeof _origPrefill==='function')_origPrefill(tour);
    setTimeout(()=>{
      const inS=document.getElementById('input-start');
      const inE=document.getElementById('input-end');
      const inST=document.getElementById('input-start-time');
      const isEdit=typeof editingId!=='undefined'&&editingId!=null;

      // ★★★ 範囲選択プリセット：_rangeEndPreset が設定されていれば終了日を上書き ★★★
      if(!isEdit&&window._rangeEndPreset&&!tour){
        const endDs=window._rangeEndPreset;
        window._rangeEndPreset=null;
        if(inS&&inE){
          // 開始日は selectedDate から
          const startDs=typeof selectedDate!=='undefined'?selectedDate:null;
          if(startDs)inS.value=startDs;
          inE.value=endDs;
          // WP にも反映
          const[sy,sm,sd]=inS.value.split('-').map(Number);
          const[ey,em,ed]=endDs.split('-').map(Number);
          if(!isNaN(sy)){
            WP.startDate=new Date(sy,sm-1,sd,9,0,0,0);
            WP.endDate=new Date(ey,em-1,ed,10,0,0,0);
            WP.isAllDay=true;
            updateTriggers();
          }
        }
        return; // 以降の通常 prefill はスキップ（範囲指定優先）
      }
      window._rangeEndPreset=null;

      // ★★★ 単一ソース管理：
      //   編集時  → input-start の値（既存イベント日付）を使う
      //   新規時  → グローバル selectedDate を最優先（カレンダータップ日）
      //             new Date('YYYY-MM-DD') はUTCズレが出るため new Date(y,m,d) を使う
      function parseDateLocalStr(str){
        if(!str)return null;
        const[y,m,d]=str.split('-').map(Number);
        if(!y||isNaN(y))return null;
        return new Date(y,m-1,d);
      }

      let baseDate=null;
      if(isEdit){
        baseDate=parseDateLocalStr(inS?.value);
      }else{
        // 新規：selectedDate が最優先
        const selDs=typeof selectedDate!=='undefined'?selectedDate:null;
        baseDate=parseDateLocalStr(selDs||inS?.value);
      }

      if(!baseDate||isNaN(baseDate.getTime())){
        const t=new Date();baseDate=new Date(t.getFullYear(),t.getMonth(),t.getDate());
      }

      const y=baseDate.getFullYear(),mo=baseDate.getMonth(),dd=baseDate.getDate();

      if(inST?.value){
        const[h,mi]=inST.value.split(':').map(Number);
        WP.startDate=new Date(y,mo,dd,h||9,mi||0,0,0);
        WP.isAllDay=false;
      }else{
        WP.startDate=new Date(y,mo,dd,9,0,0,0);
        WP.isAllDay=true;
      }

      if(isEdit&&inE?.value){
        const endBase=parseDateLocalStr(inE.value)||baseDate;
        const ey=endBase.getFullYear(),emo=endBase.getMonth(),edd=endBase.getDate();
        const enEl=document.getElementById('input-end-time');
        if(enEl?.value){
          const[eh,em]=enEl.value.split(':').map(Number);
          WP.endDate=new Date(ey,emo,edd,eh||10,em||0,0,0);
        }else{
          WP.endDate=new Date(ey,emo,edd,10,0,0,0);
        }
      }else{
        // 新規：終了も同じ日付ベース
        WP.endDate=new Date(y,mo,dd,10,0,0,0);
      }

      console.log('[prefillForm hook] isEdit=',isEdit,'selectedDate=',typeof selectedDate!=='undefined'?selectedDate:'(undef)',
        '\u2192 WP.startDate=',WP.startDate,'WP.endDate=',WP.endDate);
      updateTriggers();
    },80);
  };

  // ── 初期化 ──
  initScrollBindings();

  // 初期表示更新
  setTimeout(()=>{
    const now=new Date();
    if(!WP.startDate)WP.startDate=now;
    if(!WP.endDate)WP.endDate=new Date(now.getTime()+3600000);
    updateTriggers();
  },300);
})();
// ================================================================
// 認証チェック：予定追加・編集をログイン必須に
// ================================================================
(function patchAuthRequired(){
  const _origOpenModal = window.openModal;
  window.openModal = function(id) {
    if (!_currentUser) {
      showToast('ログインが必要です');
      document.getElementById('auth-screen')?.classList.remove('hidden');
      return;
    }
    if (typeof _origOpenModal === 'function') _origOpenModal(id);
  };

  // saveEvent フックでユーザーデータ保存
  const _origSaveEvent = window.saveEvent;
  window.saveEvent = function() {
    if (typeof _origSaveEvent === 'function') _origSaveEvent();
    _saveUserEvents();
  };

  // section-add-btn クリックで認証チェック（カレンダーページ）
  document.querySelector('.section-add-btn')?.addEventListener('click', e => {
    if (!_currentUser) {
      e.stopImmediatePropagation();
      showToast('ログインが必要です');
      document.getElementById('auth-screen')?.classList.remove('hidden');
    }
  }, true);
})();

// ================================================================
// スワイプで月切り替え（カレンダー） - 無効化済み
// initSwipe() が同じ要素に登録済みのため、重複を防ぐため削除
// ================================================================
// (function enhanceCalendarSwipe(){ ... })(); // 削除：2重スワイプの原因

// ================================================================
// カテゴリ単一選択の強制（検索画面）
// ================================================================
(function fixSingleCatSelect(){
  // filter-grid の chip タップ：単一選択のみ
  document.addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    const grid = chip.closest('#filter-grid');
    if (!grid) return;
    // 同じページ内の他chipを解除
    grid.querySelectorAll('.filter-chip.is-active').forEach(el => {
      if (el !== chip) {
        el.classList.remove('is-active');
        el.style.background = '';
        el.style.borderColor = '';
        el.style.color = '';
      }
    });
    // アニメーション
    chip.classList.add('just-selected');
    setTimeout(() => chip.classList.remove('just-selected'), 300);
  });
})();

// ================================================================
// カレンダー：ダブルタップ→予定追加
// ================================================================
(function patchCalDoubleTap(){
  let lastTap = 0, lastDs = '';
  document.addEventListener('touchend', e => {
    const cell = e.target.closest('.cal-cell');
    if (!cell) return;
    const ds = cell.dataset.ds;
    if (!ds) return;
    const now = Date.now();
    if (now - lastTap < 350 && ds === lastDs) {
      // ダブルタップ → 予定追加
      e.preventDefault();
      if (!_currentUser) {
        showToast('ログインが必要です');
        document.getElementById('auth-screen')?.classList.remove('hidden');
        return;
      }
      // ★ openCreateModal でタップしたセルの実日付を確実に渡す
      console.log('[doubleTap→openCreateModal] tappedDate=', ds);
      if (typeof openCreateModal === 'function') openCreateModal(ds);
      else if (typeof openModal === 'function') { selectedDate = ds; openModal(ds); }
    }
    lastTap = now;
    lastDs = ds;
  }, { passive: false });
})();
// ================================================================
// ★★★ Phase3: PWA/iPhone高さ修正・縦固定強化 ★★★
(function fixSafariPWAHeight(){
  var frame = document.querySelector('.app-frame');
  if(!frame) return;

  // ── 高さ適用 ──
  function applyHeight(){
    var h = window.innerHeight;
    frame.style.height = h + 'px';
    var inner = document.querySelector('.phone-inner');
    if(inner) inner.style.height = h + 'px';
    // ★ カレンダー高さ崩壊チェックも実行
    if(typeof _fixCalendarHeight === 'function'){
      _fixCalendarHeight();
    }
  }

  // ── 初回適用 ──
  applyHeight();

  // ── resize: passive + requestAnimationFrame でjank防止 ──
  var rafId = 0;
  window.addEventListener('resize', function(){
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(applyHeight);
  }, { passive: true });

  // ── orientationchange: 300ms後 + 600ms後の二段構え（Safari対策） ──
  window.addEventListener('orientationchange', function(){
    setTimeout(applyHeight, 300);
    setTimeout(applyHeight, 600);
  }, { passive: true });

  // ── visual viewport変化（Safariキーボード対応） ──
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', function(){
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(applyHeight);
    }, { passive: true });
  }
})();
// ================================================================
// 月ピッカー（"2025年5月 ▼" タップで開くドロップダウン）
// ================================================================
(function initMonthPicker(){
  const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  let pickerYear = new Date().getFullYear();
  let pickerOpen = false;

  function getPickerEl(){ return document.getElementById('month-picker'); }
  function getOverlayEl(){ return document.getElementById('month-picker-overlay'); }
  function getTitleBtn(){ return document.getElementById('month-title-btn'); }

  function renderPickerGrid(){
    document.getElementById('month-picker-year').textContent = pickerYear + '年';
    const grid = document.getElementById('month-picker-grid');
    if(!grid) return;
    // 現在表示中の年月を取得（実際のカレンダー変数 year / month を参照）
    const curY = typeof year  !== 'undefined' ? year  : new Date().getFullYear();
    const curM = typeof month !== 'undefined' ? month : new Date().getMonth();
    grid.innerHTML = '';
    MONTHS.forEach((name, idx) => {
      const btn = document.createElement('button');
      btn.className = 'month-picker-item';
      btn.textContent = name;
      if(pickerYear === curY && idx === curM) btn.classList.add('is-current');
      btn.onclick = function(){
        selectMonth(pickerYear, idx);
      };
      grid.appendChild(btn);
    });
  }

  window.toggleMonthPicker = function(){
    if(pickerOpen){ closeMonthPicker(); return; }
    openMonthPicker();
  };

  window.openMonthPicker = function(){
    // 現在の年を pickerYear の初期値に（実際のカレンダー変数 year を参照）
    if(typeof year !== 'undefined') pickerYear = year;
    else pickerYear = new Date().getFullYear();
    renderPickerGrid();
    // ボタン位置からピッカーのtopを動的に計算
    const btn = getTitleBtn();
    if(btn){
      const rect = btn.getBoundingClientRect();
      const picker = getPickerEl();
      if(picker){
        picker.style.top = (rect.bottom + 6) + 'px';
        picker.style.left = Math.max(8, rect.left) + 'px';
      }
    }
    getPickerEl()?.classList.add('show');
    getOverlayEl()?.classList.add('show');
    getTitleBtn()?.classList.add('is-open');
    pickerOpen = true;
  };

  window.closeMonthPicker = function(){
    getPickerEl()?.classList.remove('show');
    getOverlayEl()?.classList.remove('show');
    getTitleBtn()?.classList.remove('is-open');
    pickerOpen = false;
  };

  window.shiftPickerYear = function(delta){
    pickerYear += delta;
    renderPickerGrid();
  };

  // ── 月選択：state更新→全パネル再描画→ピッカーを閉じる ──
  window.selectMonth = function(selectedYear, monthIndex){
    // 実際のカレンダー変数（year / month）を直接更新
    if(typeof year !== 'undefined')  year  = selectedYear;
    if(typeof month !== 'undefined') month = monthIndex;
    // 選択日をリセット（月切り替え時はクリア）
    if(typeof selectedDate  !== 'undefined') selectedDate  = null;
    if(typeof newlyAddedDate !== 'undefined') newlyAddedDate = null;
    // ① タイトル更新
    if(typeof updateMonthLabel === 'function') updateMonthLabel();
    // ② カレンダー・イベントパネル全再描画
    if(typeof renderAllPanels === 'function')  renderAllPanels();
    // ③ カレンダーリスト再描画
    if(typeof renderCalList === 'function')    renderCalList();
    // ④ フォールバック：month-label を直接書き換え
    const lbl = document.getElementById('month-label');
    if(lbl) lbl.textContent = selectedYear + '年 ' + (monthIndex + 1) + '月';
    // ⑤ ピッカーを閉じる
    window.closeMonthPicker();
  };

  // ── イベントリスナー接続（指示通りの実装） ──
  document.addEventListener('DOMContentLoaded', function(){
    const monthBtn     = document.getElementById('month-title-btn');
    const monthPicker  = document.getElementById('month-picker');
    const monthOverlay = document.getElementById('month-picker-overlay');
    if(!monthBtn || !monthPicker || !monthOverlay) return;

    // onclick属性と重複しないよう、onclick属性を削除してaddEventListenerで管理
    monthBtn.removeAttribute('onclick');

    monthBtn.addEventListener('click', function(e){
      e.stopPropagation();
      if(monthPicker.classList.contains('show')){
        window.closeMonthPicker();
      } else {
        window.openMonthPicker();
      }
    });

    monthOverlay.addEventListener('click', function(){
      window.closeMonthPicker();
    });
  });
})();
/* ================================================================
   Phase5+6: 大会管理 + AI抽出パイプライン
   ① TOURNAMENTS_DB  ② 管理者モード  ③ 大会CRUD
   ④ URL解析パイプライン  ⑤ Parser Layer  ⑥ AI正規化フック
   ================================================================ */
'use strict';

// ── ストレージキー ──
const _K = {
  admin:   'pronexax.adminMode.v1',
  custom:  'pronexax.customTournaments.v2',
  tdb:     'pronexax.tournamentsDB.v1',       // TOURNAMENTS_DB 永続化
  passcode:'pronexax2025admin',               // ★ 本番では環境変数推奨
};

// ================================================================
// ① TOURNAMENTS_DB — 大会専用DB構造
// EVENTSとは完全分離。AI抽出結果・手動追加を統合管理。
// ================================================================
let TOURNAMENTS_DB = [];   // メインDB（静的 + カスタム + AI抽出）

/** TOURNAMENTS_DB エントリの完全フォーマット（将来フィールド含む）*/
function _tdbTemplate(override) {
  const now = new Date().toISOString();
  return Object.assign({
    // ── 識別 ──
    id:             '',          // 'category-year-seq'
    title:          '',
    // ── 分類 ──
    category:       '',
    subCategory:    '',          // 'major'|'regular'|'qt' など
    gender:         'mens',      // 'mens'|'womens'|'both'
    region:         'domestic',  // 'domestic'|'overseas'
    area:           '',
    prefecture:     '',
    country:        'japan',
    // ── 日程 ──
    startDate:      null,
    endDate:        null,
    entryDeadline:  null,
    cancelDeadline: null,
    // ── 会場 ──
    course:         '',
    organizer:      '',
    // ── 金額 ──
    prize:          '',
    prizeWinner:    '',
    entryFee:       '',
    practiceRoundFee: '',
    // ── エントリー ──
    entryMethod:    '',
    qualification:  '',
    capacity:       '',
    tags:           [],
    // ── ステータス ──
    status:         'tbd',       // 'open'|'closing_soon'|'closed'|'ongoing'|'ended'|'tbd'
    // ── データソース（AI連携準備）──
    sourceType:     'manual',    // 'manual'|'ai_url'|'ai_instagram'|'ai_pdf'|'ai_lp'
    sourceUrl:      '',
    parsingStatus:  'idle',      // 'idle'|'fetching'|'parsing'|'success'|'failed'
    aiConfidence:   null,        // 0.0〜1.0（AI解析の信頼度）
    // ── 生データ保存（AI抽出前）──
    rawContent:     '',          // 取得した生HTML/テキスト（将来AI解析用）
    extractedText:  '',          // テキスト抽出済みコンテンツ
    ocrText:        '',          // OCR結果（PDF/画像から）
    // ── リンク ──
    links: {
      website:   '',
      instagram: '',
      entry:     '',
      pairing:   '',
      result:    '',
    },
    // ── 管理 ──
    notes:          '',
    createdAt:      now,
    updatedAt:      now,
    // ── 後方互換（旧フィールド）──
    entryDeadline2: null,        // 旧 cancelDeadline
  }, override);
}

// ── DB ロード ──
function _tdbLoad() {
  try {
    const raw = localStorage.getItem(_K.custom);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        TOURNAMENTS_DB = arr.map(t => _tdbTemplate(t));
      }
    }
  } catch(e) { console.warn('[TDB] load error', e); }
}

// ── DB 保存 ──
function _tdbSave() {
  try {
    localStorage.setItem(_K.custom, JSON.stringify(TOURNAMENTS_DB));
  } catch(e) { showToast('保存失敗: ストレージ容量を確認してください'); }
  // ★ Firestore 移行フック（将来ここで _db.collection('tournaments').set() を呼ぶ）
}

// ── ID 生成 ──
function _tdbGenId(cat) {
  return `${cat||'custom'}-${new Date().getFullYear()}-${Date.now().toString(36).slice(-5)}`;
}

// ── Upsert（追加 or 更新）──
function _tdbUpsert(entry) {
  const idx = TOURNAMENTS_DB.findIndex(t => t.id === entry.id);
  entry.updatedAt = new Date().toISOString();
  if (idx >= 0) TOURNAMENTS_DB[idx] = entry;
  else TOURNAMENTS_DB.unshift(entry);
  _tdbSave();
  _rebuildFlat();
}

// ── 削除 ──
function _tdbDelete(id) {
  TOURNAMENTS_DB = TOURNAMENTS_DB.filter(t => t.id !== id);
  _tdbSave();
  _rebuildFlat();
}

// ── TOURNAMENTS_FLAT / DB 互換を再構築 ──
const _PREF_MAP = (function(){
  const m = {};
  [['hokkaido','北海道'],['aomori','青森県'],['iwate','岩手県'],['miyagi','宮城県'],
   ['akita','秋田県'],['yamagata','山形県'],['fukushima','福島県'],['ibaraki','茨城県'],
   ['tochigi','栃木県'],['gunma','群馬県'],['saitama','埼玉県'],['chiba','千葉県'],
   ['tokyo','東京都'],['kanagawa','神奈川県'],['yamanashi','山梨県'],['nagano','長野県'],
   ['niigata','新潟県'],['toyama','富山県'],['ishikawa','石川県'],['fukui','福井県'],
   ['shizuoka','静岡県'],['aichi','愛知県'],['mie','三重県'],['gifu','岐阜県'],
   ['shiga','滋賀県'],['kyoto','京都府'],['osaka','大阪府'],['hyogo','兵庫県'],
   ['nara','奈良県'],['wakayama','和歌山県'],['tottori','鳥取県'],['shimane','島根県'],
   ['okayama','岡山県'],['hiroshima','広島県'],['yamaguchi','山口県'],['tokushima','徳島県'],
   ['kagawa','香川県'],['ehime','愛媛県'],['kochi','高知県'],['fukuoka','福岡県'],
   ['saga','佐賀県'],['nagasaki','長崎県'],['kumamoto','熊本県'],['oita','大分県'],
   ['miyazaki','宮崎県'],['kagoshima','鹿児島県'],['okinawa','沖縄県'],['overseas','海外']
  ].forEach(([k,v]) => m[k] = v);
  return m;
})();

const _PREF_MASTER = Object.entries(_PREF_MAP).map(([key,label]) => ({key, label}));

function _tdbToFlat(t) {
  return {
    id: t.id, name: t.title,
    cat: t.category, gender: t.gender, region: t.region,
    place: _PREF_MAP[t.prefecture] || t.prefecture || '',
    courseName: t.course || '',
    start: t.startDate, end: t.endDate, area: t.area, prefecture: t.prefecture,
    entryDeadline: t.entryDeadline, cancelDeadline: t.cancelDeadline,
    prize: t.prize || '', prizeWinner: t.prizeWinner || '',
    entryFee: t.entryFee || '', practiceRoundFee: t.practiceRoundFee || '',
    entryMethod: t.entryMethod || '', qualification: t.qualification || '',
    capacity: t.capacity || '', organizer: t.organizer || '', tags: t.tags || [],
    officialUrl: t.links?.website || t.links?.official || '',
    igUrl:       t.links?.instagram || '',
    entryUrl:    t.links?.entry || '',
    pairUrl:     t.links?.pairing || t.links?.pairs || '',
    resultUrl:   t.links?.result || '',
    subCategory: t.subCategory || '',
    country: t.country || 'japan', status: t.status || 'tbd',
    sourceType: t.sourceType || 'manual', sourceUrl: t.sourceUrl || '',
    parsingStatus: t.parsingStatus || 'idle',
    notes: t.notes || '', createdAt: t.createdAt, updatedAt: t.updatedAt,
    _raw: t,
    // Firestore ドキュメントID（存在する場合）
    _firestoreId: t._firestoreId || null,
    _fromFirestore: t._fromFirestore || false,
  };
}

function _rebuildFlat() {
  // 静的データ + TOURNAMENTS_DB のマージ（DB側が上書き）
  const map = new Map();
  // ① 静的ベースデータ
  if (typeof tournaments !== 'undefined') {
    tournaments.forEach(t => {
      const flat = _tdbToFlat(_tdbTemplate(t));
      map.set(flat.id, flat);
    });
  }
  // ② カスタムDB（新フォーマット）
  TOURNAMENTS_DB.forEach(t => map.set(t.id, _tdbToFlat(t)));
  // TOURNAMENTS_FLAT 破壊的更新
  if (typeof TOURNAMENTS_FLAT !== 'undefined') {
    TOURNAMENTS_FLAT.length = 0;
    map.forEach(v => TOURNAMENTS_FLAT.push(v));
  }
  // DB互換レイヤー再構築
  if (typeof DB !== 'undefined') {
    Object.keys(DB).forEach(k => { if(k !== 'personal') delete DB[k]; });
    map.forEach(t => {
      if (!DB[t.cat]) DB[t.cat] = [];
      DB[t.cat].push({ name:t.name, place:(t.courseName?t.place+' '+t.courseName:t.place)||'', start:t.start, end:t.end, area:t.area, prefecture:t.prefecture });
    });
  }
  if (typeof _invalidateSearchCache === 'function') _invalidateSearchCache();
}

// ================================================================
// ② ステータス自動判定
// ================================================================
function calcTournamentStatus(t) {
  if (t.status && t.status !== 'tbd') return t.status;
  const today = (typeof todayStr === 'function') ? todayStr() : new Date().toISOString().slice(0,10);
  const dl = t.entryDeadline; const st = t.startDate; const en = t.endDate;
  if (!st) return 'tbd';
  if (today > (en || st)) return 'ended';
  if (today >= st)         return 'ongoing';
  if (dl && today > dl)   return 'closed';
  if (dl) {
    const diff = (new Date(dl) - new Date(today)) / 86400000;
    if (diff <= 7) return 'closing_soon';
  }
  return 'open';
}

const _ST_LABEL = { open:'募集中', closing_soon:'締切間近', closed:'締切済', ongoing:'開催中', ended:'終了', tbd:'日程未定' };
const _ST_CLASS = { open:'st-open', closing_soon:'st-closing_soon', closed:'st-closed', ongoing:'st-ongoing', ended:'st-ended', tbd:'st-tbd' };
const _PS_LABEL = { idle:'未解析', fetching:'取得中', parsing:'解析中', success:'解析済', failed:'エラー' };

// ================================================================
// ③ 管理者認証
// ================================================================
let _isAdmin = false;

function openAdminLogin() {
  const ov = document.getElementById('admin-login-overlay');
  if (!ov) return;
  document.getElementById('admin-passcode-input').value = '';
  document.getElementById('admin-login-error').textContent = '';
  ov.classList.add('show');
  setTimeout(() => document.getElementById('admin-passcode-input')?.focus(), 100);
}
function closeAdminLogin() {
  document.getElementById('admin-login-overlay')?.classList.remove('show');
}
function adminLogin() {
  const inp = document.getElementById('admin-passcode-input');
  const errEl = document.getElementById('admin-login-error');
  const code = inp?.value?.trim();
  if (!code) { errEl.textContent = 'パスコードを入力してください'; return; }
  if (code === _K.passcode) {
    _isAdmin = true;
    try { localStorage.setItem(_K.admin, '1'); } catch(e) {}
    document.body.classList.add('is-admin');
    closeAdminLogin();
    if (typeof switchPage === 'function') switchPage('admin');
    renderAdminList();
    if (typeof showToast === 'function') showToast('管理者モードに入りました');
  } else {
    errEl.textContent = 'パスコードが違います';
    inp?.select();
  }
}
function _restoreAdminSession() {
  try {
    if (localStorage.getItem(_K.admin) === '1') {
      _isAdmin = true;
      document.body.classList.add('is-admin');
    }
  } catch(e) {}
}

// ================================================================
// ④ 管理リスト描画
// ================================================================
function renderAdminList() {
  const el = document.getElementById('admin-list-scroll');
  if (!el) return;

  // 全大会（静的 + カスタム）
  const allMap = new Map();
  if (typeof tournaments !== 'undefined') tournaments.forEach(t => allMap.set(t.id, {_raw:t, isCustom:false}));
  TOURNAMENTS_DB.forEach(t => allMap.set(t.id, {_raw:t, isCustom:true}));
  const all = [...allMap.values()].sort((a,b) => (b._raw.updatedAt||'').localeCompare(a._raw.updatedAt||''));

  if (!all.length) { el.innerHTML = '<div style="text-align:center;padding:48px 24px;color:#8e8e93;font-size:14px;">大会データがありません</div>'; return; }

  // カテゴリ別グループ
  const groups = {};
  all.forEach(({_raw:t, isCustom}) => {
    const g = t.category || 'other';
    if (!groups[g]) groups[g] = [];
    groups[g].push({t, isCustom});
  });

  const getLabel = k => (typeof CAT_LABELS !== 'undefined' ? CAT_LABELS[k]||k : k);
  const getColor = k => (typeof CAT_COLORS !== 'undefined' ? CAT_COLORS[k]||'#8090A0' : '#8090A0');

  let html = '';
  Object.entries(groups).forEach(([cat, items]) => {
    html += `<div class="admin-section-label">${getLabel(cat)} (${items.length})</div>`;
    items.forEach(({t, isCustom}) => {
      const st = calcTournamentStatus(t);
      const ps = t.parsingStatus || 'idle';
      const color = getColor(t.category);
      const prefLabel = _PREF_MAP[t.prefecture] || t.prefecture || '';
      const dateStr = t.startDate ? t.startDate.slice(0,10) : '日程未定';
      html += `<div class="admin-card">
  <div class="admin-card-main" onclick="openAtmSheet('${escapeHtml(t.id)}')">
    <div class="admin-card-stripe" style="background:${color};"></div>
    <div class="admin-card-info">
      <div class="admin-card-title">${escapeHtml(t.title||'')}${isCustom?'<span style="color:#39C892;font-size:8px;vertical-align:middle;margin-left:4px;">●NEW</span>':''}</div>
      <div class="admin-card-meta">
        <span class="st-badge ${_ST_CLASS[st]||'st-tbd'}">${_ST_LABEL[st]||st}</span>
        ${ps!=='idle'?`<span class="ps-badge ps-${ps}">${ps==='fetching'||ps==='parsing'?`<span class="ps-dot">⟳</span>`:''}${_PS_LABEL[ps]||ps}</span>`:''}
        <span>${dateStr}${prefLabel?' / '+prefLabel:''}</span>
      </div>
    </div>
    <div class="admin-card-actions">
      <button class="admin-act-btn admin-edit-btn" onclick="event.stopPropagation();openAtmSheet('${escapeHtml(t.id)}')" aria-label="編集">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
      </button>
      ${isCustom?`<button class="admin-act-btn admin-del-btn" onclick="event.stopPropagation();tdbDelete('${escapeHtml(t.id)}')" aria-label="削除">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>`:''}
    </div>
  </div>
</div>`;
    });
  });
  el.innerHTML = html;
}

function tdbDelete(id) {
  const t = TOURNAMENTS_DB.find(t => t.id === id);
  if (!t) { if (typeof showToast === 'function') showToast('削除できるのは追加済みのデータのみです'); return; }
  if (!confirm(`「${t.title}」を削除しますか？`)) return;
  _tdbDelete(id);
  renderAdminList();
  if (typeof applySearchFilters === 'function') applySearchFilters();
  if (typeof showToast === 'function') showToast('削除しました');
}

// ================================================================
// ⑤ 大会追加・編集シート
// ================================================================
let _atmEditingId = null;

function _atmInitSelects() {
  const catSel  = document.getElementById('atm-category');
  const prefSel = document.getElementById('atm-prefecture');
  if (catSel && catSel.options.length === 0) {
    if (window._TOUR_MASTER) {
      window._TOUR_MASTER.forEach(t => {
        const o = document.createElement('option');
        o.value = t.key; o.textContent = t.label;
        catSel.appendChild(o);
      });
    }
  }
  if (prefSel && prefSel.options.length === 0) {
    _PREF_MASTER.forEach(p => {
      const o = document.createElement('option');
      o.value = p.key; o.textContent = p.label;
      prefSel.appendChild(o);
    });
  }
}

function openAtmSheet(tid) {
  _atmInitSelects();
  _atmEditingId = tid;
  const titleEl = document.getElementById('atm-header-title');
  if (tid) {
    // TOURNAMENTS_DB → TOURNAMENTS_FLAT(Firestore) → 静的データ の順で探す
    const src = TOURNAMENTS_DB.find(t=>t.id===tid)
      || (typeof TOURNAMENTS_FLAT!=='undefined' ? TOURNAMENTS_FLAT.find(t=>t.id===tid)?._raw : null)
      || (typeof TOURNAMENTS_FLAT!=='undefined' ? TOURNAMENTS_FLAT.find(t=>t.id===tid) : null)
      || (typeof tournaments!=='undefined' ? tournaments.find(t=>t.id===tid) : null);
    if (!src) { if(typeof showToast==='function') showToast('大会が見つかりません'); return; }
    if (titleEl) titleEl.textContent = '大会を編集';
    _atmFill(src);
  } else {
    if (titleEl) titleEl.textContent = '大会を追加';
    _atmClear();
  }
  document.getElementById('atm-overlay')?.classList.add('show');
  document.getElementById('atm-sheet')?.classList.add('show');
}
function closeAtmSheet() {
  document.getElementById('atm-overlay')?.classList.remove('show');
  document.getElementById('atm-sheet')?.classList.remove('show');
  _atmEditingId = null;
}
function _atmSet(id, val) { const e = document.getElementById(id); if(e) e.value = val||''; }
function _atmGet(id)      { return document.getElementById(id)?.value?.trim()||''; }

function _atmFill(t) {
  _atmSet('atm-title', t.title || t.name || '');
  _atmSet('atm-category', t.category);
  _atmSet('atm-gender', t.gender);
  _atmSet('atm-region', t.region);
  _atmSet('atm-prefecture', t.prefecture);
  _atmSet('atm-area', t.area);
  _atmSet('atm-status', t.status||'tbd');
  _atmSet('atm-course', t.course || t.courseName || '');
  _atmSet('atm-organizer', t.organizer);
  _atmSet('atm-startDate', t.startDate);
  _atmSet('atm-endDate', t.endDate);
  _atmSet('atm-entryDeadline', t.entryDeadline);
  _atmSet('atm-cancelDeadline', t.cancelDeadline);
  _atmSet('atm-prize', t.prize);
  _atmSet('atm-prizeWinner', t.prizeWinner);
  _atmSet('atm-entryFee', t.entryFee);
  _atmSet('atm-practiceRoundFee', t.practiceRoundFee);
  _atmSet('atm-entryMethod', t.entryMethod);
  _atmSet('atm-qualification', t.qualification);
  _atmSet('atm-capacity', t.capacity);
  _atmSet('atm-link-official', t.links?.website || t.links?.official);
  _atmSet('atm-link-instagram', t.links?.instagram);
  _atmSet('atm-link-entry', t.links?.entry);
  _atmSet('atm-link-pairs', t.links?.pairing || t.links?.pairs);
  _atmSet('atm-link-result', t.links?.result);
  _atmSet('atm-sourceType', t.sourceType||'manual');
  _atmSet('atm-sourceUrl', t.sourceUrl);
  _atmSet('atm-notes', t.notes);
}
function _atmClear() {
  document.querySelectorAll('#atm-form-scroll input, #atm-form-scroll select, #atm-form-scroll textarea')
    .forEach(el => { el.value = el.tagName==='SELECT' ? (el.options[0]?.value||'') : ''; });
  _atmSet('atm-status','tbd'); _atmSet('atm-gender','mens');
  _atmSet('atm-region','domestic'); _atmSet('atm-sourceType','manual');
}

function atmSave() {
  const title = _atmGet('atm-title');
  const cat   = _atmGet('atm-category');
  if (!title) { if(typeof showToast==='function') showToast('大会名を入力してください'); return; }
  if (!cat)   { if(typeof showToast==='function') showToast('カテゴリを選択してください'); return; }

  const existing = TOURNAMENTS_DB.find(t => t.id === _atmEditingId) ||
                   (typeof tournaments!=='undefined' ? tournaments.find(t=>t.id===_atmEditingId) : null);
  const now = new Date().toISOString();

  const entry = _tdbTemplate({
    id:              _atmEditingId || _tdbGenId(cat),
    title,
    category:        cat,
    gender:          _atmGet('atm-gender'),
    region:          _atmGet('atm-region'),
    area:            _atmGet('atm-area'),
    prefecture:      _atmGet('atm-prefecture'),
    country:         _atmGet('atm-region')==='overseas' ? 'overseas' : 'japan',
    course:          _atmGet('atm-course'),
    organizer:       _atmGet('atm-organizer'),
    startDate:       _atmGet('atm-startDate')||null,
    endDate:         _atmGet('atm-endDate')||null,
    entryDeadline:   _atmGet('atm-entryDeadline')||null,
    cancelDeadline:  _atmGet('atm-cancelDeadline')||null,
    prize:           _atmGet('atm-prize'),
    prizeWinner:     _atmGet('atm-prizeWinner'),
    entryFee:        _atmGet('atm-entryFee'),
    practiceRoundFee:_atmGet('atm-practiceRoundFee'),
    entryMethod:     _atmGet('atm-entryMethod'),
    qualification:   _atmGet('atm-qualification'),
    capacity:        _atmGet('atm-capacity'),
    status:          _atmGet('atm-status'),
    sourceType:      _atmGet('atm-sourceType')||'manual',
    sourceUrl:       _atmGet('atm-sourceUrl'),
    notes:           _atmGet('atm-notes'),
    rawContent:      existing?.rawContent || '',
    extractedText:   existing?.extractedText || '',
    parsingStatus:   existing?.parsingStatus || 'idle',
    aiConfidence:    existing?.aiConfidence || null,
    createdAt:       existing?.createdAt || now,
    updatedAt:       now,
    links: {
      website:   _atmGet('atm-link-official'),
      instagram: _atmGet('atm-link-instagram'),
      entry:     _atmGet('atm-link-entry'),
      pairing:   _atmGet('atm-link-pairs'),
      result:    _atmGet('atm-link-result'),
    },
  });

  _tdbUpsert(entry);
  closeAtmSheet();
  renderAdminList();
  if (typeof applySearchFilters === 'function') applySearchFilters();
  if (typeof showToast === 'function') showToast(`「${title}」を保存しました`);
}

// ================================================================
// ⑥ URL解析パイプライン
// ================================================================
let _urlParseResult = null; // 解析結果の一時保持

/** sourceType自動判定（URLパターンマッチング）*/
function detectSourceType(url) {
  if (!url) return 'manual';
  const u = url.toLowerCase();
  if (u.includes('instagram.com'))  return 'ai_instagram';
  if (u.endsWith('.pdf') || u.includes('/pdf') || u.includes('pdf=')) return 'ai_pdf';
  if (u.includes('docs.google.com') || u.includes('forms.gle')) return 'ai_googleform';
  if (u.includes('lin.ee') || u.includes('line.me')) return 'ai_line';
  return 'ai_url';
}

const _URL_TYPE_ICON = {
  ai_instagram:'📸 Instagram', ai_pdf:'📄 PDF', ai_googleform:'📋 Googleフォーム',
  ai_line:'💬 LINE', ai_url:'🌐 ウェブサイト', manual:'✏️ 手動',
};

function onUrlInputChange() {
  const url = document.getElementById('url-modal-input')?.value?.trim();
  const typeDisp = document.getElementById('url-type-display');
  const typeChip = document.getElementById('url-type-chip');
  if (!url || !url.startsWith('http')) { typeDisp.style.display='none'; return; }
  const st = detectSourceType(url);
  typeChip.textContent = _URL_TYPE_ICON[st] || st;
  typeDisp.style.display = 'block';
  _hideUrlResults();
}

function openUrlModal() {
  document.getElementById('url-modal-input').value = '';
  document.getElementById('url-type-display').style.display = 'none';
  _hideUrlResults();
  document.getElementById('url-modal-overlay')?.classList.add('show');
  setTimeout(() => document.getElementById('url-modal-input')?.focus(), 150);
}
function closeUrlModal() {
  document.getElementById('url-modal-overlay')?.classList.remove('show');
  _urlParseResult = null;
}
function _hideUrlResults() {
  document.getElementById('url-progress').classList.remove('show');
  document.getElementById('url-result-box').classList.remove('show');
  document.getElementById('url-error-box').classList.remove('show');
  document.getElementById('url-confirm-btn').style.display = 'none';
  _setUrlProgress(0,'');
}

function _setUrlProgress(pct, label) {
  const bar = document.getElementById('url-progress-bar');
  const lbl = document.getElementById('url-progress-label');
  if (bar) bar.style.width = pct + '%';
  if (lbl) lbl.textContent = label;
}

/** メイン解析フロー */
async function startUrlFetch() {
  const url = document.getElementById('url-modal-input')?.value?.trim();
  if (!url || !url.startsWith('http')) {
    _showUrlError('有効なURLを入力してください（https://... ）');
    return;
  }
  const btn = document.getElementById('url-fetch-btn');
  btn.disabled = true;
  _hideUrlResults();

  const sourceType = detectSourceType(url);

  // progress 表示
  document.getElementById('url-progress').classList.add('show');
  _setUrlProgress(10, 'URLを解析中...');

  try {
    // ① parsingStatus: fetching
    _setUrlProgress(30, 'データを取得中...');
    const rawData = await fetchUrlContent(url);

    _setUrlProgress(60, '大会情報を抽出中...');
    // ② parser layer へ
    const parsed = await parseTournamentUrl(url, sourceType, rawData);

    _setUrlProgress(90, 'AI正規化中...');
    // ③ AI正規化（現在はダミー、将来OpenAI接続）
    const normalized = await normalizeTournamentData(parsed, sourceType);

    _setUrlProgress(100, '完了');
    _urlParseResult = { ...normalized, sourceUrl: url, sourceType };
    _showUrlResult(_urlParseResult);

  } catch(err) {
    console.warn('[URL Parse]', err);
    _showUrlError(err.message || '解析に失敗しました');
  } finally {
    btn.disabled = false;
  }
}

function _showUrlResult(data) {
  const box   = document.getElementById('url-result-box');
  const title = document.getElementById('url-result-title');
  const rows  = document.getElementById('url-result-rows');
  if (!box) return;

  title.textContent = data.title || '大会情報（要確認）';
  const fields = [
    ['カテゴリ',  data.category],
    ['開催日',    data.startDate ? `${data.startDate} 〜 ${data.endDate||''}` : ''],
    ['締切',      data.entryDeadline],
    ['会場',      data.course],
    ['都道府県',  _PREF_MAP[data.prefecture] || data.prefecture],
    ['賞金',      data.prize],
    ['参加費',    data.entryFee],
    ['ソース',    data.sourceUrl ? data.sourceUrl.slice(0,40)+'...' : ''],
  ].filter(([,v]) => v);

  rows.innerHTML = fields.map(([l,v]) =>
    `<div class="url-result-row"><span class="url-result-label">${l}</span><span class="url-result-val">${escapeHtml(String(v))}</span></div>`
  ).join('');

  box.classList.add('show');
  document.getElementById('url-error-box').classList.remove('show');
  document.getElementById('url-confirm-btn').style.display = '';
}

function _showUrlError(msg) {
  const eb = document.getElementById('url-error-box');
  if (eb) { eb.textContent = '⚠️ ' + msg; eb.classList.add('show'); }
  document.getElementById('url-result-box').classList.remove('show');
  document.getElementById('url-confirm-btn').style.display = 'none';
  document.getElementById('url-progress').classList.remove('show');
}

/** URL解析結果を確定して編集シートに流し込む */
function confirmUrlResult() {
  if (!_urlParseResult) return;
  closeUrlModal();
  // 解析結果をフォームに pre-fill
  _atmInitSelects();
  _atmEditingId = null;
  const titleEl = document.getElementById('atm-header-title');
  if (titleEl) titleEl.textContent = '大会を追加（URL解析結果）';
  _atmClear();
  _atmFill(_urlParseResult);
  _atmSet('atm-sourceUrl',  _urlParseResult.sourceUrl);
  _atmSet('atm-sourceType', _urlParseResult.sourceType);
  document.getElementById('atm-overlay')?.classList.add('show');
  document.getElementById('atm-sheet')?.classList.add('show');
}

// ================================================================
// ⑦ Parser Layer（AI連携準備済み空実装）
// ================================================================

/**
 * fetchUrlContent — URLのコンテンツ取得
 * ★ 現在: CORS制約のため直接取得不可 → プロキシサーバー経由が必要
 *    将来: Cloud Functions / Edge Function でプロキシ化
 */
async function fetchUrlContent(url) {
  // ダミー遅延（実装プレースホルダー）
  await _delay(800);
  // ★ TODO: CORS プロキシ経由で fetch
  // const proxy = 'https://your-proxy.example.com/fetch?url=' + encodeURIComponent(url);
  // const res = await fetch(proxy);
  // const text = await res.text();
  // return { rawHtml: text, rawText: _extractText(text), ocrText: '' };

  return { rawHtml: '', rawText: '', ocrText: '', url };
}

/**
 * parseTournamentUrl — URL種別に応じてパーサーを振り分け
 * ★ 将来: ここで sourceType に応じて AI API を呼ぶ
 */
async function parseTournamentUrl(url, sourceType, rawData) {
  await _delay(400);
  switch(sourceType) {
    case 'ai_instagram': return await parseInstagramTournament(url, rawData);
    case 'ai_pdf':       return await parsePdfTournament(url, rawData);
    default:             return await parseWebsiteTournament(url, rawData);
  }
}

/**
 * parseWebsiteTournament — ウェブサイトから大会情報抽出
 * ★ 将来: Claude / GPT-4o に rawHtml を渡してJSON抽出
 */
async function parseWebsiteTournament(url, rawData) {
  await _delay(300);
  // ダミー結果（URLドメインからタイトルを推測する最低限の実装）
  const domain = (() => { try { return new URL(url).hostname; } catch(e){ return url; } })();
  return {
    title:        '',
    category:     '',
    gender:       'mens',
    region:       'domestic',
    area:         '',
    prefecture:   '',
    course:       '',
    organizer:    domain,
    startDate:    null,
    endDate:      null,
    entryDeadline:null,
    prize:        '',
    entryFee:     '',
    sourceUrl:    url,
    sourceType:   'ai_url',
    parsingStatus:'success',
    rawContent:   rawData.rawHtml || '',
    extractedText:rawData.rawText || '',
    links:        { website: url, instagram:'', entry:'', pairing:'', result:'' },
    aiConfidence: 0,
  };
}

/**
 * parseInstagramTournament — Instagramから大会情報抽出
 * ★ 将来: Instagram Graph API + Claude でキャプション解析
 */
async function parseInstagramTournament(url, rawData) {
  await _delay(300);
  return {
    title:        '',
    category:     '',
    gender:       'mens',
    region:       'domestic',
    area:         '',
    prefecture:   '',
    course:       '',
    organizer:    '',
    startDate:    null,
    endDate:      null,
    entryDeadline:null,
    prize:        '',
    entryFee:     '',
    sourceUrl:    url,
    sourceType:   'ai_instagram',
    parsingStatus:'success',
    rawContent:   rawData.rawHtml || '',
    extractedText:rawData.rawText || '',
    links:        { website:'', instagram: url, entry:'', pairing:'', result:'' },
    aiConfidence: 0,
  };
}

/**
 * parsePdfTournament — PDFから大会情報抽出
 * ★ 将来: pdf.js でテキスト抽出 → Claude OCR / GPT-4V
 */
async function parsePdfTournament(url, rawData) {
  await _delay(300);
  return {
    title:        '',
    category:     '',
    gender:       'mens',
    region:       'domestic',
    area:         '',
    prefecture:   '',
    course:       '',
    organizer:    '',
    startDate:    null,
    endDate:      null,
    entryDeadline:null,
    prize:        '',
    entryFee:     '',
    sourceUrl:    url,
    sourceType:   'ai_pdf',
    parsingStatus:'success',
    rawContent:   rawData.rawHtml || '',
    extractedText:rawData.rawText || rawData.ocrText || '',
    links:        { website:'', instagram:'', entry:'', pairing:'', result:'' },
    aiConfidence: 0,
  };
}

/**
 * normalizeTournamentData — AI正規化（AI連携の中心）
 * ★ 将来: このasync関数にOpenAI / Claude APIを接続する
 *
 * 接続方法（将来）:
 *   const response = await fetch('https://api.openai.com/v1/chat/completions', {
 *     method: 'POST',
 *     headers: { 'Authorization': 'Bearer ' + AI_API_KEY, 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       model: 'gpt-4o',
 *       messages: [
 *         { role: 'system', content: SYSTEM_PROMPT_TOURNAMENT_EXTRACTOR },
 *         { role: 'user',   content: parsed.extractedText }
 *       ],
 *       response_format: { type: 'json_object' }
 *     })
 *   });
 *   const json = await response.json();
 *   return JSON.parse(json.choices[0].message.content);
 */
async function normalizeTournamentData(parsed, sourceType) {
  await _delay(200);
  // 現在はそのまま返す（AI接続後はここでフィールドを補完する）
  return { ...parsed, aiConfidence: 0, parsingStatus: 'success' };
}

// ================================================================
// ⑧ nav-mypage → 管理者ページ連携
// ================================================================
function _initAdminNav() {
  const btn = document.getElementById('nav-mypage');
  if (!btn) return;
  btn.onclick = function() {
    if (_isAdmin) {
      if (typeof switchPage === 'function') switchPage('admin');
      renderAdminList();
    } else {
      openAdminLogin();
    }
  };
  const lbl = btn.querySelector('.bnav-label');
  if (lbl) lbl.textContent = '管理';
}

// ================================================================
// ⑨ ソートバー（Phase5互換）
// ================================================================
let _sortMode = 'date', _sortAsc = true;

function renderSortBar() {
  const meta = document.getElementById('result-meta');
  if (!meta) return;
  const old = document.getElementById('p5-sort-bar');
  if (old) old.remove();
  const modes = [
    {key:'date','label':'日付順'},
    {key:'deadline','label':'締切近い順'},
    {key:'prize','label':'賞金順'},
    {key:'area','label':'地域順'},
  ];
  const bar = document.createElement('div');
  bar.id = 'p5-sort-bar'; bar.className = 'sort-bar';
  bar.innerHTML = modes.map(m =>
    `<button class="sort-chip${_sortMode===m.key?' active':''}" onclick="p5SetSort('${m.key}')">${m.label}</button>`
  ).join('');
  meta.insertAdjacentElement('afterend', bar);
}

function p5SetSort(mode) {
  if (_sortMode === mode) _sortAsc = !_sortAsc;
  else { _sortMode = mode; _sortAsc = true; }
  if (typeof _invalidateSearchCache === 'function') _invalidateSearchCache();
  renderSortBar();
  if (typeof applySearchFilters === 'function') applySearchFilters();
}

// ================================================================
// ⑩ 初期化
// ================================================================
function _delay(ms) { return new Promise(r => setTimeout(r, ms)); }

(function phase56Init() {
  _tdbLoad();
  _restoreAdminSession();
  if (TOURNAMENTS_DB.length > 0) _rebuildFlat();

  const ready = () => {
    _initAdminNav();
    renderSortBar();
    if (_isAdmin && document.getElementById('admin-list-scroll')) {
      renderAdminList();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready, { once: true });
  } else {
    setTimeout(ready, 80);
  }
})();
/* ================================================================
   ★★★ Phase8: TOURNAMENTS_DB 中心構造 — 本格移行 ★★★

   変更内容:
   ① generateCalendarEvents()  — DB→EVENTS完全パイプライン
   ② saveTournaments() / loadTournaments() — Storage層正式分離
   ③ appState 統一 — グローバル変数の一元管理
   ④ openModal / closeModal — モーダル管理統一
   ⑤ detectSourceType — sourceType自動判定
   ⑥ Parser層 — AI連携準備
   ⑦ debounce + memoization — パフォーマンス最適化
   ⑧ IS_ADMIN — user/admin mode 準備
   ⑨ ProNexaX API — monolith分割準備
   ================================================================ */
'use strict';

// ================================================================
// ① Storage Layer — localStorage を一元管理（Firestore移行準備）
// ================================================================
const StorageLayer = (function() {
  // ストレージキー定数（_K との同期）
  const KEYS = {
    tournaments:  'pronexax.tournamentsDB.v1',
    customTours:  'pronexax.customTournaments.v2',
    adminMode:    'pronexax.adminMode.v1',
    catOrder:     'pronexax.catOrder.v2',
    enabledCats:  'pronexax.enabledCategories.v1',
    viewMode:     'pronexax.viewMode.v1',
    catVis:       'pronexax.catVisibility.v1',
    remindMap:    'pronexax.remindMap.v1',
    savedFilters: 'pronexax.savedFilters.v1',
    recentSearch: 'pronexax.recentSearches.v1',
    searchPrefs:  'pronexax.searchPrefs.v1',
    favCats:      'favoriteCategories',
    userEvents:   'pronexax.userEvents.v1',
  };

  function _read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch(e) {
      console.warn('[Storage] read error:', key, e);
      return null;
    }
  }

  function _write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch(e) {
      console.warn('[Storage] write error:', key, e);
      if (typeof showToast === 'function') showToast('保存失敗: ストレージ容量を確認');
      return false;
    }
  }

  function _remove(key) {
    try { localStorage.removeItem(key); return true; }
    catch(e) { return false; }
  }

  return {
    keys: KEYS,

    // ── 大会DB ──
    /** TOURNAMENTS_DB を保存 */
    saveTournaments(db) {
      return _write(KEYS.tournaments, Array.isArray(db) ? db : []);
    },
    /** TOURNAMENTS_DB を読み込み */
    loadTournaments() {
      const arr = _read(KEYS.tournaments) || _read(KEYS.customTours);
      return Array.isArray(arr) ? arr : [];
    },

    // ── ユーザーイベント ──
    /** 手動追加 EVENTS を保存 */
    saveUserEvents(events) {
      const manual = (Array.isArray(events) ? events : []).filter(e => !e._fromDB);
      return _write(KEYS.userEvents, manual);
    },
    /** 手動追加 EVENTS を読み込み */
    loadUserEvents() {
      const arr = _read(KEYS.userEvents);
      return Array.isArray(arr) ? arr : [];
    },

    // ── 管理者 ──
    saveAdminSession(isAdmin) { return isAdmin ? _write(KEYS.adminMode, 1) : _remove(KEYS.adminMode); },
    loadAdminSession()        { return _read(KEYS.adminMode) === 1; },

    // ── 汎用 ──
    read:   _read,
    write:  _write,
    remove: _remove,

    // ★ 将来: Firestore 移行フック
    // async saveTournamentsRemote(db) { await firestoreClient.set('tournaments', db); }
    // async loadTournamentsRemote() { return await firestoreClient.get('tournaments'); }
  };
})();

// ================================================================
// ② appState — 統一状態管理
// ================================================================
window.appState = (function() {
  const _s = {
    // カレンダー
    calendar: {
      year:         new Date().getFullYear(),
      month:        new Date().getMonth(),
      selectedDate: null,
      viewMode:     'month',
    },
    // フィルター
    filters: {
      gender:    'mens',
      region:    'domestic',
      category:  'all',
      groupKey:  null,
      keyword:   '',
      areas:     [],
      prefs:     [],
      cats:      [],
      sortMode:  'date',
      sortAsc:   true,
    },
    // モーダル（type → {open, id}）
    modal: {
      tournament: { open: false, id: null },
      create:     { open: false, date: null },
      admin:      { open: false },
      filter:     { open: false },
      addCat:     { open: false },
    },
    // 大会DB
    tournaments: {
      loaded:        false,
      totalCount:    0,
      filteredCount: 0,
      lastUpdated:   null,
    },
    // パーサー
    parser: {
      status:    'idle',  // idle|fetching|parsing|success|failed
      lastUrl:   '',
      lastType:  '',
      progress:  0,
      queue:     [],
    },
    // 管理者
    admin: {
      isAdmin: false,
      mode:    'user',    // 'user'|'admin'
    },
    // UI
    ui: {
      toastVisible:   false,
      drawerOpen:     false,
      calendarReady:  false,
    },
  };

  // グローバル変数との同期
  function sync() {
    if (typeof year         !== 'undefined') _s.calendar.year         = year;
    if (typeof month        !== 'undefined') _s.calendar.month        = month;
    if (typeof selectedDate !== 'undefined') _s.calendar.selectedDate = selectedDate;
    if (typeof viewMode     !== 'undefined') _s.calendar.viewMode     = viewMode;
    if (typeof _isAdmin     !== 'undefined') { _s.admin.isAdmin = _isAdmin; _s.admin.mode = _isAdmin ? 'admin' : 'user'; }
    if (typeof searchFilter !== 'undefined') _s.filters.category      = searchFilter;
    if (typeof _searchGender!== 'undefined') _s.filters.gender        = _searchGender;
    if (typeof _searchRegion!== 'undefined') _s.filters.region        = _searchRegion;
    if (typeof _searchGroupKey !== 'undefined') _s.filters.groupKey   = _searchGroupKey;
    if (typeof fbsAreas     !== 'undefined') _s.filters.areas         = [...fbsAreas];
    if (typeof fbsPrefs     !== 'undefined') _s.filters.prefs         = [...fbsPrefs];
    if (typeof fbsCats      !== 'undefined') _s.filters.cats          = [...fbsCats];
    if (typeof TOURNAMENTS_FLAT !== 'undefined') _s.tournaments.totalCount = TOURNAMENTS_FLAT.length;
  }

  // ドット記法パス でネストした値を取得
  function get(path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), _s);
  }

  // ドット記法パスでネストした値を設定
  function set(path, value) {
    const keys = path.split('.');
    let cur = _s;
    for (let i = 0; i < keys.length - 1; i++) {
      if (typeof cur[keys[i]] !== 'object' || cur[keys[i]] === null) cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
  }

  return { get, set, sync, getAll: () => _s };
})();

// ================================================================
// ③ generateCalendarEvents() — TOURNAMENTS_DB → EVENTS パイプライン
// ================================================================

/**
 * generateCalendarEvents()
 *
 * TOURNAMENTS_DB（+ 静的 tournaments[]）から
 * カレンダー表示用 EVENTS を生成する中心関数。
 *
 * 動作:
 *   ① 手動追加イベント（_fromDB:false）を保持
 *   ② addedIds に含まれる大会を EVENTS 互換フォーマットに変換
 *   ③ 複数日大会はそのまま date〜end でカバー（カレンダーは範囲表示対応済み）
 *   ④ EVENTS 配列を破壊的更新（参照を維持）
 */
function generateCalendarEvents() {
  if (typeof EVENTS === 'undefined' || typeof TOURNAMENTS_FLAT === 'undefined') return;

  // ① 手動追加イベントを保持
  const manualEvents = EVENTS.filter(e => !e._fromDB);

  // ② addedIds に含まれる大会 → EVENTS 互換変換
  const dbEvents = [];
  if (typeof addedIds !== 'undefined') {
    TOURNAMENTS_FLAT.forEach(t => {
      if (!addedIds.has(t.id)) return;
      if (!t.start || !t.end)  return;
      // 手動イベントと重複チェック（同一大会IDがあればスキップ）
      if (manualEvents.some(e => e._tournamentId === t.id)) return;

      dbEvents.push(_makeCalEvent(t));
    });
  }

  // ③ EVENTS を再構成（参照を壊さず）
  EVENTS.length = 0;
  [...manualEvents, ...dbEvents].forEach(e => EVENTS.push(e));

  // appState 同期
  appState.set('tournaments.loaded',      true);
  appState.set('tournaments.totalCount',  TOURNAMENTS_FLAT.length);
  appState.set('tournaments.lastUpdated', new Date().toISOString());

  return EVENTS;
}

/**
 * _makeCalEvent(t) — TOURNAMENTS_FLAT エントリ → EVENTS 互換オブジェクト変換
 */
function _makeCalEvent(t) {
  const memoLines = [];
  if (t.organizer)     memoLines.push(`主催：${t.organizer}`);
  if (t.entryDeadline) memoLines.push(`締切：${t.entryDeadline}`);
  if (t.prize)         memoLines.push(`賞金：${t.prize}`);
  if (t.entryFee)      memoLines.push(`参加費：${t.entryFee}`);

  return {
    id:             _makeCalEventId(t.id),
    name:           t.name,
    date:           t.start,
    end:            t.end,
    place:          (t.courseName ? `${t.place} ${t.courseName}` : t.place) || '',
    cat:            t.cat,
    memo:           memoLines.join('\n'),
    entryStatus:    'pending',
    // DB由来マーカー（手動イベントと区別するため）
    _fromDB:        true,
    _tournamentId:  t.id,
  };
}

/** 大会ID → カレンダーイベントID（数値）変換 */
function _makeCalEventId(tid) {
  let h = 0;
  for (let i = 0; i < tid.length; i++) { h = Math.imul(31, h) + tid.charCodeAt(i) | 0; }
  return 2_000_000 + (Math.abs(h) % 1_000_000);
}

// ================================================================
// ④ sourceType 自動判定
// ================================================================
function detectSourceType(url) {
  if (!url || typeof url !== 'string') return 'manual';
  const u = url.toLowerCase().trim();
  if (/instagram\.com/.test(u))                          return 'ai_instagram';
  if (/\.pdf($|\?)/.test(u) || /\/pdf\//.test(u))        return 'ai_pdf';
  if (/docs\.google\.com\/forms/.test(u))                return 'ai_googleform';
  if (/youtube\.com|youtu\.be/.test(u))                  return 'ai_youtube';
  if (/twitter\.com|x\.com/.test(u))                     return 'ai_twitter';
  if (/lin\.ee|line\.me/.test(u))                        return 'ai_line';
  if (/facebook\.com/.test(u))                           return 'ai_facebook';
  if (/note\.com/.test(u))                               return 'ai_note';
  return 'ai_url';
}

// ================================================================
// ⑤ Parser Layer — AI連携準備
// ================================================================

/**
 * parseTournamentUrl(url, options)
 * エントリーポイント。URLタイプを判定して適切なパーサーへ振り分け。
 *
 * ★ 将来: options.apiKey, options.model を渡して AI API を呼び出す
 */
async function parseTournamentUrl(url, options = {}) {
  const sourceType = detectSourceType(url);
  appState.set('parser.status',   'fetching');
  appState.set('parser.lastUrl',  url);
  appState.set('parser.lastType', sourceType);
  appState.set('parser.progress', 10);

  try {
    const rawData = await _fetchRawContent(url, sourceType);
    appState.set('parser.status',   'parsing');
    appState.set('parser.progress', 50);

    let parsed;
    switch (sourceType) {
      case 'ai_instagram': parsed = await parseInstagramTournament(url, rawData); break;
      case 'ai_pdf':       parsed = await parsePdfTournament(url, rawData);       break;
      default:             parsed = await parseWebsiteTournament(url, rawData);   break;
    }

    appState.set('parser.progress', 80);
    const normalized = await normalizeTournamentData(parsed, sourceType);
    appState.set('parser.status',   'success');
    appState.set('parser.progress', 100);

    return typeof _tdbTemplate === 'function'
      ? _tdbTemplate({ ...normalized, sourceType, sourceUrl: url })
      : normalized;

  } catch(err) {
    appState.set('parser.status', 'failed');
    appState.set('parser.progress', 0);
    console.error('[Parser] error:', err);
    throw err;
  }
}

/**
 * _fetchRawContent(url, sourceType)
 * URL から生コンテンツを取得（ダミー実装）
 *
 * ★ 将来:
 *   const res = await fetch(`https://api.pronexax.com/proxy?url=${encodeURIComponent(url)}`);
 *   return await res.json(); // { rawHtml, rawText, ocrText, fetchedAt, statusCode }
 */
async function _fetchRawContent(url, sourceType) {
  await new Promise(r => setTimeout(r, 300));
  return { rawHtml: '', rawText: '', ocrText: '', fetchedAt: new Date().toISOString(), statusCode: 200 };
}

/**
 * parseWebsiteTournament(url, rawData)
 * ★ 将来: Claude / GPT-4o に rawHtml を渡してJSON抽出
 *
 *   const res = await fetch('https://api.anthropic.com/v1/messages', {
 *     method: 'POST',
 *     headers: { 'x-api-key': options.apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
 *     body: JSON.stringify({
 *       model: 'claude-opus-4-5',
 *       max_tokens: 1024,
 *       messages: [{ role: 'user', content: SYSTEM_PROMPT + rawData.rawText }]
 *     })
 *   });
 */
async function parseWebsiteTournament(url, rawData) {
  await new Promise(r => setTimeout(r, 200));
  const domain = (() => { try { return new URL(url).hostname; } catch(e) { return url; } })();
  return {
    title: '', category: '', gender: 'mens', region: 'domestic',
    area: '', prefecture: '', course: '', organizer: domain,
    startDate: null, endDate: null, entryDeadline: null,
    prize: '', entryFee: '',
    sourceUrl: url, sourceType: 'ai_url', parsingStatus: 'success',
    rawContent: rawData.rawHtml || '', extractedText: rawData.rawText || '',
    links: { website: url, instagram: '', entry: '', pairing: '', result: '' },
    aiConfidence: 0,
  };
}

/**
 * parseInstagramTournament(url, rawData)
 * ★ 将来: Instagram Graph API + Claude でキャプション解析
 */
async function parseInstagramTournament(url, rawData) {
  await new Promise(r => setTimeout(r, 200));
  return {
    title: '', category: '', gender: 'mens', region: 'domestic',
    area: '', prefecture: '', course: '', organizer: '',
    startDate: null, endDate: null, entryDeadline: null,
    prize: '', entryFee: '',
    sourceUrl: url, sourceType: 'ai_instagram', parsingStatus: 'success',
    rawContent: rawData.rawHtml || '', extractedText: rawData.rawText || '',
    links: { website: '', instagram: url, entry: '', pairing: '', result: '' },
    aiConfidence: 0,
  };
}

/**
 * parsePdfTournament(url, rawData)
 * ★ 将来: pdf.js でテキスト抽出 → Claude Vision / GPT-4V でOCR
 */
async function parsePdfTournament(url, rawData) {
  await new Promise(r => setTimeout(r, 200));
  return {
    title: '', category: '', gender: 'mens', region: 'domestic',
    area: '', prefecture: '', course: '', organizer: '',
    startDate: null, endDate: null, entryDeadline: null,
    prize: '', entryFee: '',
    sourceUrl: url, sourceType: 'ai_pdf', parsingStatus: 'success',
    rawContent: rawData.rawHtml || '', extractedText: rawData.rawText || rawData.ocrText || '',
    links: { website: '', instagram: '', entry: '', pairing: '', result: '' },
    aiConfidence: 0,
  };
}

/**
 * normalizeTournamentData(parsed, sourceType)
 * AI正規化フック — ここに OpenAI / Claude / Gemini を接続する
 *
 * ★ 将来の接続方法:
 *   const PROMPT = `以下の大会情報テキストから、JSONで情報を抽出してください:\n${parsed.extractedText}`;
 *   const res = await fetch('https://api.openai.com/v1/chat/completions', {
 *     method: 'POST',
 *     headers: { Authorization: 'Bearer ' + AI_API_KEY, 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: PROMPT }], response_format: { type: 'json_object' } })
 *   });
 *   const json = await res.json();
 *   return JSON.parse(json.choices[0].message.content);
 */
async function normalizeTournamentData(parsed, sourceType) {
  await new Promise(r => setTimeout(r, 100));
  return { ...parsed, aiConfidence: 0, parsingStatus: 'success' };
}

// ================================================================
// ⑥ Modal Manager — openModal / closeModal 統一
// ================================================================

/**
 * openModal(type, id)
 *   type: 'tournament'|'create'|'filter'|'admin'|'addCat'
 *   id:   大会ID（type='tournament'時）or 日付文字列（type='create'時）
 *
 * 後方互換:
 *   openModal('2025-05-01')     → カレンダーイベント作成（旧形式）
 *   openModal(null, 123)        → カレンダーイベント編集（旧形式）
 */
window.openModal = (function(_orig) {
  return function(type, id) {
    // ── 後方互換: 旧形式の openModal(dateOrNull, eventId) ──
    if (type === null ||
        (typeof type === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(type)) ||
        typeof type === 'number') {
      if (typeof _orig === 'function') return _orig(type, id);
      return;
    }

    // ── 新形式 ──
    switch (type) {
      case 'tournament':
        if (typeof openTournamentModal === 'function') openTournamentModal(id);
        appState.set('modal.tournament', { open: true, id });
        break;
      case 'filter':
        if (typeof openFilterSheet === 'function') openFilterSheet();
        appState.set('modal.filter.open', true);
        break;
      case 'admin':
        if (typeof openAdminLogin === 'function') openAdminLogin();
        appState.set('modal.admin.open', true);
        break;
      case 'addCat':
        if (typeof openAddCatSheet === 'function') openAddCatSheet();
        appState.set('modal.addCat.open', true);
        break;
      default:
        if (typeof _orig === 'function') _orig(type, id);
    }
  };
})(window.openModal);

/**
 * closeModal(type)
 *   type: 'tournament'|'filter'|'admin'|'addCat'|'all'（省略可）
 */
window.closeModal = function(type) {
  const closeAll = !type || type === 'all';

  if (closeAll || type === 'tournament') {
    if (typeof closeTournamentModal === 'function') closeTournamentModal();
    appState.set('modal.tournament', { open: false, id: null });
  }
  if (closeAll || type === 'filter') {
    if (typeof closeFilterSheet === 'function') closeFilterSheet();
    appState.set('modal.filter.open', false);
  }
  if (closeAll || type === 'admin') {
    if (typeof closeAdminLogin === 'function') closeAdminLogin();
    appState.set('modal.admin.open', false);
  }
  if (closeAll || type === 'addCat') {
    const sheet = document.querySelector('.add-cat-sheet');
    if (sheet) sheet.classList.remove('show');
    appState.set('modal.addCat.open', false);
  }
  if (closeAll || type === 'create') {
    // ★ 修正②: modal-overlay が実際のIDなので直接閉じる
    const evModal = document.getElementById('modal-overlay') ||
                    document.getElementById('event-modal') ||
                    document.getElementById('modal-sheet');
    if (evModal) { evModal.classList.remove('show'); evModal.style.transform = ''; }
    // 内部stateも元のcloseModal相当でリセット
    if (typeof editingId !== 'undefined') editingId = null;
    if (typeof dvPresetStartTime !== 'undefined') dvPresetStartTime = null;
    if (typeof dvPresetEndTime   !== 'undefined') dvPresetEndTime   = null;
    if (typeof catReorderMode !== 'undefined' && catReorderMode) {
      if (typeof toggleCatReorder === 'function') toggleCatReorder();
    }
  }
};

// ================================================================
// ⑦ IS_ADMIN — user/admin mode 統一フラグ
// ================================================================
Object.defineProperty(window, 'IS_ADMIN', {
  get()  { return typeof _isAdmin !== 'undefined' ? _isAdmin : appState.get('admin.isAdmin'); },
  set(v) { appState.set('admin.isAdmin', !!v); appState.set('admin.mode', v ? 'admin' : 'user'); document.body.classList.toggle('is-admin', !!v); },
  configurable: true, enumerable: true,
});

// ================================================================
// ⑧ debounce + memoization ユーティリティ
// ================================================================
function _debounce(fn, wait) {
  let timer;
  return function(...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), wait); };
}

function _memoize(fn, keyFn) {
  const cache = new Map();
  return function(...args) {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

/* _filterCache: 元の _lastFilterKey/_lastFilterResult に統一 */

function _invalidateFilterCache() {
  /* _filterCache削除済み: 元の _invalidateSearchCache に委譲 */
  if (typeof _invalidateSearchCache === 'function') _invalidateSearchCache();
}

// ================================================================
// ⑨ ProNexaX — グローバル公開 API（monolith分割準備）
// ================================================================
window.ProNexaX = Object.assign(window.ProNexaX || {}, {
  version: '8.0.0',

  // ── データアクセス ──
  db: {
    getAll()              { return typeof TOURNAMENTS_FLAT !== 'undefined' ? [...TOURNAMENTS_FLAT] : []; },
    getById(id)           { return typeof TOURNAMENTS_FLAT !== 'undefined' ? (TOURNAMENTS_FLAT.find(t => t.id === id) || null) : null; },
    getByCategory(cat)    { return typeof TOURNAMENTS_FLAT !== 'undefined' ? TOURNAMENTS_FLAT.filter(t => t.cat === cat) : []; },
    getCustom()           { return typeof TOURNAMENTS_DB   !== 'undefined' ? [...TOURNAMENTS_DB]   : []; },
    getByDateRange(s, e)  {
      return typeof TOURNAMENTS_FLAT !== 'undefined'
        ? TOURNAMENTS_FLAT.filter(t => t.start && t.end && t.start <= e && t.end >= s)
        : [];
    },
    upsert(entry)         { if (typeof _tdbUpsert === 'function') _tdbUpsert(entry); },
    delete(id)            { if (typeof _tdbDelete === 'function') _tdbDelete(id); },
    count()               { return typeof TOURNAMENTS_FLAT !== 'undefined' ? TOURNAMENTS_FLAT.length : 0; },
    search(keyword)       {
      const kw = (keyword || '').toLowerCase();
      return typeof TOURNAMENTS_FLAT !== 'undefined'
        ? TOURNAMENTS_FLAT.filter(t =>
            t.name.toLowerCase().includes(kw) ||
            (t.place || '').toLowerCase().includes(kw) ||
            (t.organizer || '').toLowerCase().includes(kw))
        : [];
    },
  },

  // ── 状態管理 ──
  state: window.appState,

  // ── モーダル ──
  modal: {
    open:  (type, id) => window.openModal(type, id),
    close: (type)     => window.closeModal(type),
  },

  // ── カレンダー統合 ──
  calendar: {
    generateEvents:    generateCalendarEvents,
    syncFromDB()       { generateCalendarEvents(); },
    refresh() {
      if (typeof renderAllPanels === 'function') renderAllPanels();
      if (typeof renderCalList   === 'function') renderCalList();
    },
    getEventsOnDate(ds) {
      return typeof EVENTS !== 'undefined'
        ? EVENTS.filter(e => e.date <= ds && e.end >= ds)
        : [];
    },
  },

  // ── パーサー ──
  parser: {
    detectType: detectSourceType,
    parse:      parseTournamentUrl,
    parseWeb:   parseWebsiteTournament,
    parseIG:    parseInstagramTournament,
    parsePDF:   parsePdfTournament,
    normalize:  normalizeTournamentData,
  },

  // ── ストレージ ──
  storage: StorageLayer,

  // ── ユーティリティ ──
  utils: {
    debounce:          _debounce,
    memoize:           _memoize,
    invalidateCache:   _invalidateFilterCache,
    todayStr:          () => typeof todayStr === 'function' ? todayStr() : new Date().toISOString().slice(0, 10),
    calcStatus:        (t) => typeof calcTournamentStatus === 'function' ? calcTournamentStatus(t) : 'tbd',
    detectSourceType:  detectSourceType,
  },
});

// ================================================================
// ⑩ フック: 既存関数へのパッチ（後方互換を保ちながら拡張）
// ================================================================
(function _patchExistingFunctions() {

  // ─ toggleSearchAdd のフック（カレンダー追加/削除時に generateCalendarEvents を呼ぶ）
  function patchToggleSearchAdd() {
    if (typeof toggleSearchAdd !== 'function') return;
    const _orig = window.toggleSearchAdd;
    window.toggleSearchAdd = function(id) {
      if (typeof _orig === 'function') _orig(id);
      setTimeout(() => {
        generateCalendarEvents();
        if (typeof renderAllPanels === 'function') renderAllPanels();
        if (typeof renderCalList   === 'function') renderCalList();
      }, 60);
    };
  }

  // ─ _rebuildFlat のフック（DB再構築後に generateCalendarEvents も呼ぶ）
  function patchRebuildFlat() {
    if (typeof _rebuildFlat !== 'function') return;
    const _orig = window._rebuildFlat;
    window._rebuildFlat = function() {
      if (typeof _orig === 'function') _orig();
      _invalidateFilterCache();
      setTimeout(generateCalendarEvents, 30);
    };
  }

  // patchApplySearchFilters: Phase8の二重キャッシュバグのため削除。
  // 元の applySearchFilters + _buildFilterKey + _lastFilterKey が正しく機能する。
  function patchApplySearchFilters() {
    /* no-op: 元の実装を使用 */
  }

  // ─ 管理者ログイン後に appState を同期
  function patchAdminLogin() {
    if (typeof adminLogin !== 'function') return;
    const _orig = window.adminLogin;
    window.adminLogin = function() {
      if (typeof _orig === 'function') _orig.apply(this, arguments);
      setTimeout(() => {
        const isAdmin = typeof _isAdmin !== 'undefined' ? _isAdmin : false;
        appState.set('admin.isAdmin', isAdmin);
        appState.set('admin.mode',    isAdmin ? 'admin' : 'user');
        window.ProNexaX.admin = appState.get('admin');
      }, 60);
    };
  }

  // ─ StorageLayer を _tdbSave / _tdbLoad に接続
  function patchStorageLayer() {
    // _tdbSave → StorageLayer.saveTournaments も呼ぶ
    if (typeof _tdbSave === 'function') {
      const _origSave = window._tdbSave;
      window._tdbSave = function() {
        if (typeof _origSave === 'function') _origSave();
        StorageLayer.saveTournaments(
          typeof TOURNAMENTS_DB !== 'undefined' ? TOURNAMENTS_DB : []
        );
      };
    }
  }

  // DOM 準備完了後にパッチ適用
  function applyAll() {
    patchToggleSearchAdd();
    patchRebuildFlat();
    patchApplySearchFilters();
    patchAdminLogin();
    patchStorageLayer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(applyAll, 250), { once: true });
  } else {
    setTimeout(applyAll, 250);
  }
})();

// ================================================================
// ⑪ Phase8 初期化
// ================================================================
(function phase8Init() {
  function init() {
    // appState をグローバル変数と同期
    appState.sync();

    // TOURNAMENTS_DB を StorageLayer 経由でロード（_tdbLoad のフォールバック）
    if (typeof TOURNAMENTS_DB !== 'undefined' && TOURNAMENTS_DB.length === 0) {
      const loaded = StorageLayer.loadTournaments();
      if (loaded.length > 0 && typeof _tdbTemplate === 'function') {
        loaded.forEach(t => {
          const entry = _tdbTemplate(t);
          if (!TOURNAMENTS_DB.find(x => x.id === entry.id)) TOURNAMENTS_DB.push(entry);
        });
        if (typeof _rebuildFlat === 'function') _rebuildFlat();
      }
    }

    // TOURNAMENTS_DB → EVENTS パイプライン実行
    generateCalendarEvents();

    // ProNexaX.admin を設定
    window.ProNexaX.admin = appState.get('admin');

    // 開発者コンソール情報
    const totalCount = typeof TOURNAMENTS_FLAT !== 'undefined' ? TOURNAMENTS_FLAT.length : 0;
    const dbCount    = typeof TOURNAMENTS_DB   !== 'undefined' ? TOURNAMENTS_DB.length   : 0;
    const evCount    = typeof EVENTS           !== 'undefined' ? EVENTS.length           : 0;
    console.info(
      '%c[ProNexaX v8]%c TOURNAMENTS_DB中心構造 初期化完了',
      'background:#39C892;color:#fff;padding:2px 6px;border-radius:3px;font-weight:700;',
      'color:#3A5C52;font-weight:600;'
    );
    console.info(
      '  大会DB(静的+カスタム): %d件\n  カスタムDB: %d件\n  カレンダーイベント: %d件\n  IS_ADMIN: %s\n  ProNexaX API: window.ProNexaX',
      totalCount, dbCount, evCount,
      typeof _isAdmin !== 'undefined' ? _isAdmin : false
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 180), { once: true });
  } else {
    setTimeout(init, 180);
  }
})();

/* ================================================================
   ★★★ Firebase Auth 完全統合 + 管理者分離 ★★★

   修正内容:
   ① ADMIN_EMAILS 設定（ここにメールを追加）
   ② authSubmit のゲスト判定を修正（Firebase 本接続を優先）
   ③ users/{uid} コレクションへの初回保存
   ④ _showApp の admin 判定を強化
   ⑤ admin-only クラスを全管理UI要素に適用
   ⑥ auth ちらつき防止の最終修正
   ⑦ ログイン永続化の確認
   ================================================================ */
'use strict';

// ================================================================
// ① ADMIN_EMAILS — ここに管理者メールを追加
// ================================================================
// すでに定義済みの ADMIN_EMAILS を上書き（空配列から実際のメールへ）
// ★★★ 以下に管理者の Gmail を追加してください ★★★
(function _setAdminEmails() {
  if (typeof ADMIN_EMAILS !== 'undefined') {
    // 既存配列をクリアして再設定
    ADMIN_EMAILS.length = 0;
    // ↓ここに管理者メールを追加↓
     ADMIN_EMAILS.push("pronexax0929@gmail.com")
     
  }
})();

// ================================================================
// ② users コレクション保存
// ================================================================
async function _saveUserToFirestore(user, isAdmin) {
  if (typeof firebase === 'undefined' || !firebase.apps?.length) return;
  if (typeof firebase.firestore !== 'function') return;

  try {
    const db = firebase.firestore();
    const ref = db.collection('users').doc(user.uid);
    const snap = await ref.get();

    if (!snap.exists) {
      // 初回ログイン: ドキュメントを新規作成
      await ref.set({
        uid:         user.uid,
        email:       user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || '',
        photoURL:    user.photoURL || null,
        provider:    user.providerData?.[0]?.providerId || 'password',
        isAdmin:     isAdmin,
        createdAt:   new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      });
      console.info('[Auth] users コレクション: 新規ユーザー登録', user.email);
    } else {
      // 再ログイン: lastLoginAt と isAdmin だけ更新
      await ref.update({
        lastLoginAt: new Date().toISOString(),
        isAdmin:     isAdmin,
        // displayName/photoURL は更新しておく（Google 側で変更された場合）
        displayName: user.displayName || snap.data().displayName,
        photoURL:    user.photoURL    || snap.data().photoURL || null,
      });
    }
  } catch(e) {
    // Firestore 書き込み失敗はサイレントに（認証自体は成功させる）
    console.warn('[Auth] users 保存エラー:', e.code || e.message);
  }
}

// ================================================================
// ③ _showApp を完全版に置き換え
// ================================================================
(function _patchShowApp() {
  // 既存の _showApp をラップ
  const _origShowApp = window._showApp || function(){};

  window._showApp = function(user) {
    if (!user) { _showAuthScreen(); return; }

    _currentUser = user;

    // ── auth-screen を非表示 ──
    const authEl = document.getElementById('auth-screen');
    if (authEl) { authEl.style.display = 'none'; authEl.classList.add('hidden'); }
    _hideAuthLoading();
    document.body.classList.remove('auth-guest');

    // ── 管理者判定 ──
    const isAdmin = typeof _isAdminEmail === 'function' && _isAdminEmail(user.email);
    _isAdmin = isAdmin;

    // body クラス制御
    if (isAdmin) {
      document.body.classList.add('is-admin');
    } else {
      document.body.classList.remove('is-admin');
    }

    // 管理タブ表示切替
    const adminNavBtn = document.getElementById('nav-admin');
    if (adminNavBtn) {
      adminNavBtn.style.display = isAdmin ? '' : 'none';
      // CSS も直接上書き（!important を回避）
      adminNavBtn.style.setProperty('display', isAdmin ? 'flex' : 'none', 'important');
    }

    // ── UI 更新 ──
    const displayName = user.displayName || user.email?.split('@')[0] || 'ユーザー';
    const initial     = displayName.charAt(0).toUpperCase();

    // アバター（ヘッダー）
    document.querySelectorAll('.app-avatar').forEach(el => { el.textContent = initial; });

    // ドロワー
    const nameEl = document.querySelector('.drawer-user-name');
    const subEl  = document.querySelector('.drawer-user-sub');
    if (nameEl) nameEl.textContent = displayName;
    if (subEl)  subEl.textContent  = user.email || '';

    // ドロワーアバター（Google 写真対応）
    const avatarEl = document.querySelector('.drawer-user-avatar');
    if (avatarEl) {
      if (user.photoURL) {
        avatarEl.innerHTML = `<img src="${user.photoURL}" alt="${initial}"
          style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;" />`;
      } else {
        avatarEl.innerHTML = '';
        avatarEl.textContent = initial;
      }
    }

    // appState 同期
    if (typeof appState !== 'undefined') {
      appState.set('admin.isAdmin', isAdmin);
      appState.set('admin.mode', isAdmin ? 'admin' : 'user');
    }

    // ── データロード ──
    if (typeof _loadUserEvents === 'function') _loadUserEvents();
    if (isAdmin && typeof renderAdminList === 'function') {
      setTimeout(renderAdminList, 200);
    }

    // ── Firestore users コレクションに保存（非同期・ノンブロッキング）──
    _saveUserToFirestore(user, isAdmin);

    console.info(
      `%c[Auth]%c ${user.email} | ${isAdmin ? '👑 管理者' : '👤 一般ユーザー'}`,
      'background:#39C892;color:#fff;padding:1px 5px;border-radius:2px;font-weight:700;',
      'color:#3A5C52;font-weight:600;'
    );
  };
})();

// ================================================================
// ④ _showAuthScreen を完全版に置き換え
// ================================================================
(function _patchShowAuthScreen() {
  window._showAuthScreen = function() {
    // 管理者状態を完全リセット
    _isAdmin = false;
    document.body.classList.remove('is-admin');
    document.body.classList.add('auth-guest');
    const adminNavBtn = document.getElementById('nav-admin');
    if (adminNavBtn) {
      adminNavBtn.style.removeProperty('display');
      adminNavBtn.style.display = 'none';
    }
    if (typeof appState !== 'undefined') {
      appState.set('admin.isAdmin', false);
      appState.set('admin.mode', 'user');
    }

    // auth-screen 表示
    const authEl = document.getElementById('auth-screen');
    if (authEl) {
      authEl.style.display = '';   // inline style 解除
      authEl.style.removeProperty('display');
      authEl.classList.remove('hidden');
    }
    _hideAuthLoading();
  };
})();

// ================================================================
// ⑤ authSubmit — Firebase 本接続を優先し、guest fallback を最小化
// ================================================================
(function _patchAuthSubmit() {
  const _origSubmit = window.authSubmit;

  window.authSubmit = async function() {
    const emailEl = document.getElementById('auth-email');
    const passEl  = document.getElementById('auth-password');
    const email   = emailEl?.value?.trim();
    const pass    = passEl?.value;
    const errEl   = document.getElementById('auth-error');
    const loader  = document.getElementById('auth-loader');
    const btn     = document.getElementById('auth-submit-btn');
    const isReg   = document.querySelector('.auth-tab.is-active')?.dataset.tab === 'register';

    if (!email || !pass) { if(errEl) errEl.textContent = 'メールアドレスとパスワードを入力してください'; return; }
    if (pass.length < 6) { if(errEl) errEl.textContent = 'パスワードは6文字以上で入力してください'; return; }
    if (errEl) errEl.textContent = '';
    if (loader) loader.style.display = 'block';
    if (btn)    btn.disabled = true;

    // ── Firebase SDK がロード済みかチェック ──
    const fbReady = typeof firebase !== 'undefined' &&
                    firebase.apps?.length > 0 &&
                    typeof firebase.auth === 'function';

    if (!fbReady) {
      // Firebase SDK ロード待ち（最大 5 秒）
      let waited = 0;
      while (waited < 5000) {
        await new Promise(r => setTimeout(r, 200));
        waited += 200;
        if (typeof firebase !== 'undefined' && firebase.apps?.length > 0) break;
      }
    }

    // 再チェック
    const fbReadyNow = typeof firebase !== 'undefined' &&
                       firebase.apps?.length > 0 &&
                       typeof firebase.auth === 'function';

    if (!fbReadyNow) {
      // 完全フォールバック（SDK 未ロード）
      if (loader) loader.style.display = 'none';
      if (btn)    btn.disabled = false;
      if (errEl)  errEl.textContent = 'Firebase接続中... しばらく待ってから再試行してください';
      return;
    }

    // ── Firebase Auth でログイン ──
    try {
      const auth = firebase.auth();
      if (isReg) {
        await auth.createUserWithEmailAndPassword(email, pass);
      } else {
        await auth.signInWithEmailAndPassword(email, pass);
      }
      // onAuthStateChanged が _showApp を呼ぶ
      if (loader) loader.style.display = 'none';
      if (btn)    btn.disabled = false;
    } catch(err) {
      if (loader) loader.style.display = 'none';
      if (btn)    btn.disabled = false;
      const msgs = {
        'auth/user-not-found':          'メールアドレスが登録されていません',
        'auth/wrong-password':          'パスワードが違います',
        'auth/email-already-in-use':    'このメールアドレスは既に使われています',
        'auth/invalid-email':           'メールアドレスの形式が正しくありません',
        'auth/weak-password':           'パスワードが弱すぎます（6文字以上）',
        'auth/network-request-failed':  'ネットワークエラーです',
        'auth/invalid-credential':      'メールアドレスまたはパスワードが正しくありません',
        'auth/too-many-requests':       'ログイン試行が多すぎます。しばらく待ってください',
        'auth/api-key-not-valid':       'Firebase設定エラー。管理者にお問い合わせください',
      };
      if (errEl) errEl.textContent = msgs[err.code] || err.message || 'エラーが発生しました';
    }
  };
})();

// ================================================================
// ⑥ authLogout — 完全版（admin 状態リセット含む）
// ================================================================
window.authLogout = function() {
  if (!confirm('ログアウトしますか？')) return;

  // 状態リセット
  _currentUser = null;
  _isAdmin = false;
  localStorage.removeItem('pronexax.guestUser');

  // Firebase Sign Out
  if (typeof firebase !== 'undefined' && firebase.apps?.length) {
    firebase.auth().signOut().then(() => {
      console.info('[Auth] Firebase サインアウト完了');
    }).catch(e => console.warn('[Auth] signOut error:', e));
  }

  // UI リセット
  document.body.classList.remove('is-admin');
  document.body.classList.add('auth-guest');
  const adminNavBtn = document.getElementById('nav-admin');
  if (adminNavBtn) adminNavBtn.style.display = 'none';
  if (typeof appState !== 'undefined') {
    appState.set('admin.isAdmin', false);
    appState.set('admin.mode', 'user');
  }

  _showAuthScreen();
  if (typeof closeDrawer === 'function') closeDrawer();
  if (typeof showToast === 'function') showToast('ログアウトしました');
};

// ================================================================
// ⑦ admin-only クラスの自動適用
// ================================================================
(function _applyAdminOnlyClasses() {
  function apply() {
    // 管理専用ボタンに admin-only クラスを付与
    const adminSelectors = [
      '.admin-url-btn',        // URL解析ボタン
      '.admin-add-btn',        // 大会追加ボタン
      '.admin-edit-btn',       // 編集ボタン
      '.admin-delete-btn',     // 削除ボタン
      '#atm-overlay',          // 大会追加モーダル（オーバーレイ）
      '#url-modal-overlay',    // URL解析モーダル
      '#admin-login-overlay',  // 管理者パスコードログイン
    ];

    adminSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        // #から始まる（ID指定）のオーバーレイはスキップ（モーダル自体はそのまま）
        if (sel.startsWith('#overlay') || sel === '#atm-overlay' || sel === '#url-modal-overlay') return;
        if (!el.classList.contains('admin-only')) {
          el.classList.add('admin-only');
        }
      });
    });

    // admin-card の edit/delete ボタン
    document.querySelectorAll('.admin-card-actions').forEach(el => {
      el.classList.add('admin-only');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(apply, 100), { once: true });
  } else {
    setTimeout(apply, 100);
  }

  // renderAdminList 後にも再適用
  const _origRender = window.renderAdminList;
  if (typeof _origRender === 'function') {
    window.renderAdminList = function() {
      if (typeof _origRender === 'function') _origRender();
      setTimeout(apply, 50);
    };
  }
})();

// ================================================================
// ⑧ auth ちらつき防止の最終調整
// ================================================================
(function _antiFlicker() {
  // onAuthStateChanged が解決するまで app-frame を透明に保つ
  // （すでに auth-screen は display:none で始まっているため、
  //   onAuthStateChanged が来るまで白画面になる可能性を防ぐ）
  // app-frame は class="app-frame" で定義
  const appFrame = document.querySelector('.app-frame') ||
                   document.getElementById('app-frame');
  if (appFrame) {
    appFrame.style.opacity = '0';
    appFrame.style.transition = 'opacity .25s ease';
  }

  // onAuthStateChanged が来たら表示（最大 3 秒でフォールバック）
  let revealed = false;
  function _revealApp() {
    if (revealed) return;
    revealed = true;
    if (appFrame) {
      appFrame.style.opacity = '1';
    }
  }

  // Firebase SDK ロード後に onAuthStateChanged が来る（最大 3 秒待つ）
  const _fallbackReveal = setTimeout(_revealApp, 3000);

  // _showApp / _showAuthScreen が呼ばれたら reveal
  const _origShowAppGlobal = window._showApp;
  window._showApp = function(user) {
    clearTimeout(_fallbackReveal);
    _revealApp();
    if (typeof _origShowAppGlobal === 'function') _origShowAppGlobal(user);
  };
  const _origShowAuth = window._showAuthScreen;
  window._showAuthScreen = function() {
    clearTimeout(_fallbackReveal);
    _revealApp();
    if (typeof _origShowAuth === 'function') _origShowAuth();
  };
})();

// ================================================================
// ⑨ 初期化確認ログ
// ================================================================
console.info(
  '%c[Auth Full]%c 管理者分離システム 初期化完了\n' +
  '  ADMIN_EMAILS: %d件登録済み',
  'background:#E05555;color:#fff;padding:1px 5px;border-radius:2px;font-weight:700;',
  'color:#C04040;font-weight:600;',
  typeof ADMIN_EMAILS !== 'undefined' ? ADMIN_EMAILS.length : 0
);

/* ================================================================
   ★★★ Firestore CMS 層 — 管理画面 CRUD ★★★

   既存構造を壊さず以下を追加:
   ① atmSave()  → Firestore addDoc / updateDoc
   ② 削除ボタン → Firestore deleteDoc
   ③ renderAdminList() を Firestore データ対応に拡張
   ④ バリデーション強化
   ⑤ loading / success / error toast
   ⑥ Firestore 構造は AI 抽出追加しやすい設計
   ================================================================ */
'use strict';

// ================================================================
// § 1  Firestore CMS ユーティリティ
// ================================================================
const _FCMS = (function() {

  // Firestore db 参照を安全に取得
  function _db() {
    if (typeof firebase === 'undefined' || !firebase.apps?.length) return null;
    if (typeof firebase.firestore !== 'function') return null;
    try { return firebase.firestore(); } catch(e) { return null; }
  }

  // ── ① 大会を Firestore へ保存（addDoc / updateDoc） ──
  async function save(entry) {
    const db = _db();
    if (!db) {
      // Firestore 未接続 → localStorage のみ（従来動作）
      console.warn('[FCMS] Firestore 未接続 → localStorage に保存');
      return { ok: false, offline: true };
    }

    // Firestore 保存用ドキュメント（_raw 等の内部フィールドを除外）
    const doc = _toFirestoreDoc(entry);

    try {
      if (entry._firestoreId) {
        // 既存ドキュメント → updateDoc
        await db.collection('tournaments')
          .doc(entry._firestoreId)
          .update({ ...doc, updatedAt: new Date().toISOString() });
        console.info('[FCMS] updateDoc:', entry._firestoreId);
      } else {
        // 新規 → addDoc（Firestore が ID を生成）
        const ref = await db.collection('tournaments').add({
          ...doc,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.info('[FCMS] addDoc:', ref.id);
        entry._firestoreId = ref.id;  // 後続処理のためにセット
      }
      return { ok: true };
    } catch(e) {
      console.error('[FCMS] save error:', e);
      return { ok: false, error: e };
    }
  }

  // ── ② Firestore からドキュメントを削除 ──
  async function remove(firestoreId) {
    const db = _db();
    if (!db || !firestoreId) return { ok: false };
    try {
      await db.collection('tournaments').doc(firestoreId).delete();
      console.info('[FCMS] deleteDoc:', firestoreId);
      return { ok: true };
    } catch(e) {
      console.error('[FCMS] delete error:', e);
      return { ok: false, error: e };
    }
  }

  // ── エントリーを Firestore ドキュメント形式に変換 ──
  // 内部専用フィールド（_fromDB, _fromFirestore, _raw 等）を除外
  // AI 抽出追加しやすいよう構造を整理
  function _toFirestoreDoc(entry) {
    return {
      // 基本情報
      id:              entry.id || null,
      title:           entry.title || '',
      category:        entry.category || '',
      subCategory:     entry.subCategory || '',
      gender:          entry.gender || 'mens',
      region:          entry.region || 'domestic',
      area:            entry.area || '',
      prefecture:      entry.prefecture || '',
      country:         entry.country || 'japan',

      // 日程
      startDate:       entry.startDate || null,
      endDate:         entry.endDate || null,
      entryDeadline:   entry.entryDeadline || null,
      cancelDeadline:  entry.cancelDeadline || null,

      // 会場・主催
      course:          entry.course || '',
      organizer:       entry.organizer || '',

      // 賞金・費用
      prize:           entry.prize || '',
      prizeWinner:     entry.prizeWinner || '',
      entryFee:        entry.entryFee || '',
      practiceRoundFee: entry.practiceRoundFee || '',

      // エントリー情報
      entryMethod:     entry.entryMethod || '',
      qualification:   entry.qualification || '',
      capacity:        entry.capacity || '',

      // 状態
      status:          entry.status || 'tbd',
      tags:            entry.tags || [],
      notes:           entry.notes || '',

      // リンク
      links: {
        website:   entry.links?.website   || '',
        instagram: entry.links?.instagram || '',
        entry:     entry.links?.entry     || '',
        pairing:   entry.links?.pairing   || '',
        result:    entry.links?.result    || '',
      },

      // ★ AI 抽出用フィールド（将来の拡張ポイント）
      sourceType:      entry.sourceType    || 'manual',
      sourceUrl:       entry.sourceUrl     || '',
      parsingStatus:   entry.parsingStatus || 'idle',
      aiConfidence:    entry.aiConfidence  ?? null,
      rawContent:      entry.rawContent    || '',
      extractedText:   entry.extractedText || '',
    };
  }

  return { save, remove };
})();

// ================================================================
// § 2  atmSave() を Firestore 対応版に置き換え
// ================================================================
(function patchAtmSave() {
  // 既存の atmSave を保持（ローカル保存はそのまま）
  const _origAtmSave = window.atmSave;

  window.atmSave = async function() {
    // ── バリデーション ──
    const title     = (document.getElementById('atm-title')?.value || '').trim();
    const cat       = document.getElementById('atm-category')?.value || '';
    const startDate = document.getElementById('atm-startDate')?.value || '';
    const endDate   = document.getElementById('atm-endDate')?.value || '';

    if (!title) {
      showToast('⚠️ 大会名を入力してください');
      document.getElementById('atm-title')?.focus();
      return;
    }
    if (!cat) {
      showToast('⚠️ カテゴリを選択してください');
      return;
    }
    if (startDate && endDate && startDate > endDate) {
      showToast('⚠️ 終了日は開始日以降を入力してください');
      return;
    }
    const entryDeadline = document.getElementById('atm-entryDeadline')?.value || '';
    if (entryDeadline && startDate && entryDeadline > startDate) {
      showToast('⚠️ エントリー締切は開始日以前を推奨します');
      // 警告のみ（ブロックしない）
    }

    // ── ローカル保存（既存処理） ──
    // _origAtmSave() は内部で _tdbUpsert → localStorage を更新する
    // ただし非同期ではないので先に entry を収集する
    const editingId = window._atmEditingId;
    const existing  = [...(typeof TOURNAMENTS_DB !== 'undefined' ? TOURNAMENTS_DB : []),
                       ...(typeof tournaments !== 'undefined' ? tournaments : [])]
                       .find(t => t.id === editingId);
    const now = new Date().toISOString();

    const get = (id) => (document.getElementById(id)?.value || '').trim();

    const entry = (typeof _tdbTemplate === 'function') ? _tdbTemplate({
      id:               editingId || (typeof _tdbGenId === 'function' ? _tdbGenId(cat) : `fs-${Date.now()}`),
      title,
      category:         cat,
      gender:           get('atm-gender'),
      region:           get('atm-region'),
      area:             get('atm-area'),
      prefecture:       get('atm-prefecture'),
      country:          get('atm-region') === 'overseas' ? 'overseas' : 'japan',
      course:           get('atm-course'),
      organizer:        get('atm-organizer'),
      startDate:        get('atm-startDate') || null,
      endDate:          get('atm-endDate')   || null,
      entryDeadline:    get('atm-entryDeadline') || null,
      cancelDeadline:   get('atm-cancelDeadline') || null,
      prize:            get('atm-prize'),
      prizeWinner:      get('atm-prizeWinner'),
      entryFee:         get('atm-entryFee'),
      practiceRoundFee: get('atm-practiceRoundFee'),
      entryMethod:      get('atm-entryMethod'),
      qualification:    get('atm-qualification'),
      capacity:         get('atm-capacity'),
      status:           get('atm-status') || 'tbd',
      sourceType:       get('atm-sourceType') || 'manual',
      sourceUrl:        get('atm-sourceUrl'),
      notes:            get('atm-notes'),
      rawContent:       existing?.rawContent    || '',
      extractedText:    existing?.extractedText || '',
      parsingStatus:    existing?.parsingStatus || 'idle',
      aiConfidence:     existing?.aiConfidence  ?? null,
      createdAt:        existing?.createdAt || now,
      updatedAt:        now,
      links: {
        website:   get('atm-link-official'),
        instagram: get('atm-link-instagram'),
        entry:     get('atm-link-entry'),
        pairing:   get('atm-link-pairs'),
        result:    get('atm-link-result'),
      },
    }) : null;

    if (!entry) { showToast('エラー: テンプレート未ロード'); return; }

    // Firestore ID を引き継ぐ（編集時）
    if (existing?._firestoreId) entry._firestoreId = existing._firestoreId;

    // ── ボタンを loading 状態に ──
    const btn = document.getElementById('atm-save-btn');
    const origText = btn?.textContent;
    if (btn) {
      btn.disabled = true;
      btn.textContent = '保存中…';
      btn.style.opacity = '0.7';
    }

    // ── Firestore へ保存 ──
    const result = await _FCMS.save(entry);

    // ボタンを復元
    if (btn) {
      btn.disabled = false;
      btn.textContent = origText || '保存する';
      btn.style.opacity = '';
    }

    if (result.ok) {
      // ローカルにも保存（onSnapshot が遅延する場合のフォールバック）
      if (typeof _tdbUpsert === 'function') _tdbUpsert(entry);
      closeAtmSheet();
      if (typeof renderAdminList === 'function') renderAdminList();
      if (typeof applySearchFilters === 'function') applySearchFilters();
      showToast(`✅ 「${title}」を保存しました`);
    } else if (result.offline) {
      // Firestore 未接続 → ローカルのみ保存
      if (typeof _tdbUpsert === 'function') _tdbUpsert(entry);
      closeAtmSheet();
      if (typeof renderAdminList === 'function') renderAdminList();
      if (typeof applySearchFilters === 'function') applySearchFilters();
      showToast(`💾 「${title}」をローカルに保存（Firestore未接続）`);
    } else {
      // Firestore エラー → ローカルに保存してエラー通知
      if (typeof _tdbUpsert === 'function') _tdbUpsert(entry);
      showToast(`⚠️ Firestore保存失敗。ローカルに保存しました。`);
      console.error('[CMS] Firestore save error:', result.error);
    }
  };
})();

// ================================================================
// § 3  削除を Firestore 対応に（deleteDoc）
// ================================================================
(function patchAtmDelete() {
  const _origDelete = window.atmDelete || window._atmDelete;

  // 既存の削除関数を置き換え
  window.atmDelete = async function(id) {
    if (!confirm(`この大会を削除しますか？\n（Firestoreからも削除されます）`)) return;

    // Firestore ID を特定
    const entry = (typeof TOURNAMENTS_DB !== 'undefined' ? TOURNAMENTS_DB : [])
      .find(t => t.id === id);
    const fsId = entry?._firestoreId;

    // ローカル削除（即時）
    if (typeof _tdbDelete === 'function') _tdbDelete(id);
    if (typeof renderAdminList === 'function') renderAdminList();
    showToast('🗑️ 削除しました');

    // Firestore 削除
    if (fsId) {
      const result = await _FCMS.remove(fsId);
      if (!result.ok) {
        showToast('⚠️ Firestore削除に失敗しました');
        console.error('[CMS] deleteDoc error:', result.error);
      }
    } else {
      console.warn('[CMS] _firestoreId が不明 — Firestore側は onSnapshot 経由で反映');
    }
  };

  // _atmDelete も同じ関数に
  window._atmDelete = window.atmDelete;
})();

// ================================================================
// § 4  renderAdminList() を Firestore データ対応に拡張
// ================================================================
(function patchRenderAdminList() {
  function patch() {
    if (typeof renderAdminList !== 'function') return;

    const _orig = window.renderAdminList;

    window.renderAdminList = function() {
      const el = document.getElementById('admin-list-scroll');
      if (!el) return;

      // Firestore データ（_fsMap）と ローカルDB をマージ
      const allMap = new Map();

      // ① 静的データ（低優先）
      if (typeof tournaments !== 'undefined') {
        tournaments.forEach(t => allMap.set(t.id, { _raw: t, src: 'static' }));
      }

      // ② ローカル TOURNAMENTS_DB（中優先）
      if (typeof TOURNAMENTS_DB !== 'undefined') {
        TOURNAMENTS_DB.forEach(t => allMap.set(t.id, { _raw: t, src: 'local' }));
      }

      // ③ Firestore データ（最高優先）— TOURNAMENTS_FLAT から _fromFirestore なものを取得
      if (typeof TOURNAMENTS_FLAT !== 'undefined') {
        TOURNAMENTS_FLAT.filter(t => t._fromFirestore).forEach(flat => {
          allMap.set(flat.id, { _raw: flat._raw || flat, src: 'firestore', flat });
        });
      }

      const all = [...allMap.values()]
        .sort((a, b) => {
          const ua = a._raw?.updatedAt || a._raw?.createdAt || '';
          const ub = b._raw?.updatedAt || b._raw?.createdAt || '';
          return ub.localeCompare(ua);
        });

      if (!all.length) {
        el.innerHTML = '<div style="text-align:center;padding:48px 24px;color:#8e8e93;font-size:14px;">大会データがありません</div>';
        return;
      }

      // ── ヘッダー: 件数 + Firestore件数 ──
      const fsCount = all.filter(x => x.src === 'firestore').length;
      const totalCount = all.length;

      // ── HTML 生成 ──
      const getLabel = k => (typeof CAT_LABELS !== 'undefined' ? CAT_LABELS[k] || k : k);
      const getColor = k => (typeof CAT_COLORS !== 'undefined' ? CAT_COLORS[k] || '#8090A0' : '#8090A0');

      // カテゴリ別グループ
      const groups = {};
      all.forEach(({ _raw: t, src, flat }) => {
        const g = t.category || 'other';
        if (!groups[g]) groups[g] = [];
        groups[g].push({ t, src, flat });
      });

      let html = `
        <div class="admin-summary-bar">
          <span class="admin-summary-total">全 ${totalCount} 件</span>
          ${fsCount > 0 ? `<span class="admin-summary-fs">🔥 Firestore: ${fsCount} 件</span>` : ''}
        </div>`;

      Object.entries(groups).forEach(([cat, items]) => {
        const color = getColor(cat);
        html += `<div class="admin-section-label" style="color:${color}">${getLabel(cat)} (${items.length})</div>`;

        items.forEach(({ t, src }) => {
          const id       = t.id || '';
          const name     = t.title || t.name || '(名称未設定)';
          const dateStr  = t.startDate || t.start || '';
          const place    = t.course || t.courseName || '';
          const status   = t.status || 'tbd';
          const isFs     = src === 'firestore';
          const isLocal  = src === 'local';

          // ステータスバッジ
          const statusMap = {
            open: ['募集中','#39C892'], closing_soon: ['締切間近','#F59E0B'],
            closed: ['締切済','#8e8e93'], ongoing: ['開催中','#3B82F6'],
            ended: ['終了','#8e8e93'], tbd: ['未定','#8e8e93']
          };
          const [stLabel, stColor] = statusMap[status] || ['未定','#8e8e93'];

          // ソース表示
          const srcBadge = isFs
            ? '<span class="admin-src-badge fs-badge">🔥 Firestore</span>'
            : isLocal
              ? '<span class="admin-src-badge local-badge">📱 ローカル</span>'
              : '<span class="admin-src-badge static-badge">📦 静的</span>';

          html += `
            <div class="admin-card">
              <div class="admin-card-body">
                <div class="admin-card-top">
                  <span class="admin-card-name">${name}</span>
                  <span class="admin-status-dot" style="background:${stColor};color:${stColor};border-color:${stColor}20">${stLabel}</span>
                </div>
                <div class="admin-card-meta">
                  ${dateStr ? `<span>📅 ${dateStr}</span>` : ''}
                  ${place   ? `<span>⛳ ${place}</span>`   : ''}
                  ${srcBadge}
                </div>
              </div>
              <div class="admin-card-actions">
                <button class="admin-edit-btn"   onclick="openAtmSheet('${id}')">編集</button>
                <button class="admin-delete-btn" onclick="atmDelete('${id}')">削除</button>
              </div>
            </div>`;
        });
      });

      el.innerHTML = html;
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(patch, 400), { once: true });
  } else {
    setTimeout(patch, 400);
  }
})();

// ================================================================
// § 5  Firestore 更新時に管理リストを自動更新
// ================================================================
(function hookFirestoreToAdminList() {
  // _rebuildFromFirestore の後に renderAdminList を呼ぶ
  const _origRebuild = window._rebuildFromFirestore;
  if (typeof _origRebuild === 'function') {
    // NOTE: _rebuildFromFirestore は FirestoreDB スコープ内なので
    // ProNexaX.firestore 経由でフックする
  }

  // onSnapshot 完了後（_setStatus('live',...) 後）に管理リストを更新
  // 管理ページが表示中の時のみ
  const _origSetStatus = window._setStatus;
  // _setStatus はクロージャ内なので直接フックできない
  // 代わりに: ProNexaX.firestore の start() 後に MutationObserver で検出
  // → シンプルに: switchPage('admin') 時に renderAdminList を呼ぶようフック

  function patch() {
    const _origSwitch = window.switchPage;
    if (typeof _origSwitch !== 'function') return;
    window.switchPage = function(page) {
      _origSwitch(page);
      if (page === 'admin') {
        setTimeout(() => {
          if (typeof renderAdminList === 'function') renderAdminList();
        }, 80);
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(patch, 300), { once: true });
  } else {
    setTimeout(patch, 300);
  }
})();

// ================================================================
// § 6  CSS: 管理画面の追加スタイル
// ================================================================
(function injectAdminCMSCSS() {
  const style = document.createElement('style');
  style.id = 'admin-cms-style';
  style.textContent = `
/* ── 管理一覧サマリーバー ── */
.admin-summary-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px 4px;
  font-size: 12px;
}
.admin-summary-total { color: var(--text-secondary); font-weight: 600; }
.admin-summary-fs    { color: #E05555; font-weight: 600; }

/* ── ソースバッジ ── */
.admin-src-badge {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 20px;
  letter-spacing: .01em;
}
.fs-badge     { background: #FFF0F0; color: #E05555; }
.local-badge  { background: #EFF6FF; color: #3B82F6; }
.static-badge { background: #F3F4F6; color: #6B7280; }

/* ── カードアクションボタン ── */
.admin-card-body   { flex: 1; padding: 12px 14px; min-width: 0; }
.admin-card-top    { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
.admin-card-name   { font-size: 14px; font-weight: 600; color: var(--text-primary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.admin-card-meta   { display: flex; flex-wrap: wrap; gap: 8px; font-size: 11px; color: var(--text-secondary); align-items: center; }
.admin-card-actions {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px 10px 12px 0;
  flex-shrink: 0;
}
.admin-edit-btn {
  height: 32px; min-width: 52px;
  background: var(--green-main, #39C892);
  color: #fff; border: none;
  border-radius: 10px; font-size: 12px; font-weight: 600;
  cursor: pointer; font-family: inherit;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.admin-delete-btn {
  height: 32px; min-width: 52px;
  background: none;
  color: #E05555; border: 1px solid #E0555530;
  border-radius: 10px; font-size: 12px; font-weight: 600;
  cursor: pointer; font-family: inherit;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.admin-edit-btn:active   { opacity: .75; }
.admin-delete-btn:active { background: #FFF0F0; }

/* ── admin-card を flex layout に ── */
.admin-card { display: flex; align-items: stretch; }

/* ── ステータスバッジ ── */
.admin-status-dot {
  font-size: 10px; font-weight: 700;
  padding: 2px 8px; border-radius: 20px;
  border: 1px solid transparent;
  background: currentColor;
  flex-shrink: 0;
}
.admin-status-dot { color: inherit; background: transparent; }

/* ── atm-save-btn loading 状態 ── */
.atm-save-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

/* ── admin セクションラベル ── */
.admin-section-label {
  font-size: 11px; font-weight: 700;
  padding: 14px 16px 4px;
  letter-spacing: .04em;
  text-transform: uppercase;
  opacity: .7;
}
`;
  document.head.appendChild(style);
})();

console.info(
  '%c[CMS]%c Firestore CRUD 層 初期化完了',
  'background:#E05555;color:#fff;padding:1px 5px;border-radius:2px;font-weight:700;',
  'color:#C04040;font-weight:600;'
);

/* ================================================================
   ★★★ Firestore 大会データ層 ★★★

   設計:
   ① Firestore の tournaments コレクションを onSnapshot でリアルタイム購読
   ② 取得データ → _tdbTemplate → TOURNAMENTS_FLAT へマージ
   ③ 既存の静的データ（tournaments[]）は fallback として残す
   ④ 取得中は Skeleton 表示
   ⑤ 失敗時は静的データで動作継続（graceful degradation）
   ⑥ 既存の検索・フィルター・モーダルはそのまま動作
   ================================================================ */
'use strict';

// ================================================================
// Skeleton CSS — 検索リストの読み込み中表示
// ================================================================
(function injectSkeletonCSS() {
  const style = document.createElement('style');
  style.id = 'firestore-skeleton-style';
  style.textContent = `
/* ── Skeleton ── */
@keyframes skeletonShimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}
.skel-card {
  background: var(--card-bg, #fff);
  border-radius: 14px;
  padding: 14px 16px;
  margin: 0 12px 10px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.skel-line {
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--border, #e0e0e0) 25%,
    #f5f5f5 50%,
    var(--border, #e0e0e0) 75%
  );
  background-size: 800px 100%;
  animation: skeletonShimmer 1.4s ease-in-out infinite;
}
.skel-line-title  { height: 14px; width: 65%; margin-bottom: 10px; }
.skel-line-sub    { height: 11px; width: 45%; margin-bottom: 7px; }
.skel-line-badge  { height: 20px; width: 80px; border-radius: 20px; }
:root[data-theme="dark"] .skel-line {
  background: linear-gradient(90deg,#2a3530 25%,#354540 50%,#2a3530 75%);
  background-size: 800px 100%;
  animation: skeletonShimmer 1.4s ease-in-out infinite;
}

/* ── Firestore ステータスバナー ── */
#fs-status-banner {
  display: flex;  /* デフォルト表示（Firestore接続前から見える） */
  align-items: center;
  gap: 8px;
  padding: 6px 16px 4px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
  color: var(--text-tertiary);
  min-height: 26px;
}
/* show クラスは後方互換のため残す */
#fs-status-banner.show { display: flex; }
/* live 後に自動非表示（JS から classList.remove('show') で隠す） */
#fs-status-banner.hidden { display: none; }
#fs-status-banner.loading { color: var(--text-tertiary); }
#fs-status-banner.error   { color: #E05555; background: #FFF0F0; border-radius: 10px; margin: 6px 12px; }
#fs-status-banner.live    { color: var(--green-dark); }
.fs-status-dot {
  width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
}
.fs-status-dot.loading { background: var(--text-tertiary); animation: fsPulse 1.2s ease-in-out infinite; }
.fs-status-dot.error   { background: #E05555; }
.fs-status-dot.live    { background: var(--green-main); }
@keyframes fsPulse {
  0%,100% { opacity: .4; } 50% { opacity: 1; }
}
`;
  document.head.appendChild(style);
})();

// ================================================================
// Firestore 大会データ管理
// ================================================================
const FirestoreDB = (function() {

  // 状態
  let _unsubscribe  = null;   // onSnapshot の購読解除関数
  let _status       = 'idle'; // 'idle'|'loading'|'live'|'error'
  let _fsLoaded     = false;  // 初回取得完了フラグ
  let _retryTimer   = null;

  // Firestore から取得したデータを保持（Map: id → flat entry）
  const _fsMap = new Map();

  // ── Skeleton を search-list に表示 ──
  function _showSkeleton() {
    const list = document.getElementById('search-list');
    if (!list) return;
    const cards = Array.from({ length: 6 }, () => `
      <div class="skel-card">
        <div class="skel-line skel-line-title"></div>
        <div class="skel-line skel-line-sub"></div>
        <div class="skel-line skel-line-badge"></div>
      </div>`).join('');
    list.innerHTML = cards;
  }

  // ── ステータスバナー更新 ──
  function _setStatus(status, msg) {
    _status = status;
    const banner = document.getElementById('fs-status-banner');
    if (!banner) return;
    banner.className = `show ${status}`;
    const dot = banner.querySelector('.fs-status-dot');
    const txt = banner.querySelector('.fs-status-text');
    if (dot) dot.className = `fs-status-dot ${status}`;
    if (txt) txt.textContent = msg || '';
    if (status === 'live') {
      // 取得成功後 3 秒でバナーを隠す
      setTimeout(() => {
        banner.classList.add('hidden');
        banner.classList.remove('show');
      }, 3000);
    } else {
      banner.classList.remove('hidden');
    }
  }

  // ── Firestore ドキュメント → TOURNAMENTS_FLAT 互換フラット形式 ──
  function _fsDocToFlat(doc) {
    const d = doc.data();
    const docId = doc.id;

    // Firestoreのフィールド名は柔軟に受け入れる
    // (title/name, startDate/start, category/cat など両方対応)
    const normalized_input = {
      id:             d.id || docId,
      title:          d.title || d.name || '',
      category:       d.category || d.cat || '',
      subCategory:    d.subCategory || '',
      gender:         d.gender || 'mens',
      region:         d.region || 'domestic',
      area:           d.area || '',
      prefecture:     d.prefecture || '',
      country:        d.country || 'japan',
      startDate:      d.startDate || d.start || null,
      endDate:        d.endDate || d.end || null,
      entryDeadline:  d.entryDeadline || null,
      cancelDeadline: d.cancelDeadline || null,
      course:         d.course || d.courseName || '',
      organizer:      d.organizer || '',
      prize:          d.prize || '',
      prizeWinner:    d.prizeWinner || d.winnerPrize || '',
      entryFee:       d.entryFee || '',
      practiceRoundFee: d.practiceRoundFee || '',
      entryMethod:    d.entryMethod || '',
      qualification:  d.qualification || '',
      capacity:       d.capacity || '',
      tags:           d.tags || [],
      status:         d.status || 'tbd',
      sourceType:     d.sourceType || 'firestore',
      sourceUrl:      d.sourceUrl || '',
      links: {
        website:   d.links?.website   || d.links?.official || d.officialUrl || '',
        instagram: d.links?.instagram || d.igUrl || '',
        entry:     d.links?.entry     || d.entryUrl || '',
        pairing:   d.links?.pairing   || d.links?.pairs || d.pairUrl || '',
        result:    d.links?.result    || d.resultUrl || '',
      },
      notes:          d.notes || '',
    };

    // _tdbTemplate でフィールドを正規化してから _tdbToFlat へ
    const normalized = typeof _tdbTemplate === 'function'
      ? _tdbTemplate(normalized_input)
      : normalized_input;

    if (typeof _tdbToFlat === 'function') {
      return _tdbToFlat(normalized);
    }

    // _tdbToFlat が無い場合の最低限マッピング
    const pref = (typeof _PREF_MAP !== 'undefined' ? _PREF_MAP : {});
    return {
      id:             normalized.id,
      name:           normalized.title || d.name || '',
      cat:            normalized.category || d.cat || '',
      subCategory:    normalized.subCategory || '',
      gender:         normalized.gender || 'mens',
      region:         normalized.region || 'domestic',
      place:          pref[normalized.prefecture] || normalized.prefecture || d.place || '',
      courseName:     normalized.course || d.courseName || '',
      start:          normalized.startDate || d.start || null,
      end:            normalized.endDate || d.end || null,
      area:           normalized.area || '',
      prefecture:     normalized.prefecture || '',
      entryDeadline:  normalized.entryDeadline || null,
      cancelDeadline: normalized.cancelDeadline || null,
      prize:          normalized.prize || '',
      prizeWinner:    normalized.prizeWinner || normalized.winnerPrize || '',
      entryFee:       normalized.entryFee || '',
      organizer:      normalized.organizer || '',
      tags:           normalized.tags || [],
      officialUrl:    normalized.links?.website || normalized.links?.official || '',
      igUrl:          normalized.links?.instagram || '',
      entryUrl:       normalized.links?.entry || '',
      pairUrl:        normalized.links?.pairing || normalized.links?.pairs || '',
      resultUrl:      normalized.links?.result || '',
      status:         normalized.status || 'tbd',
      sourceType:     normalized.sourceType || 'firestore',
      _raw:           normalized,
      _fromFirestore: true,
      // ★ Firestore ドキュメントID（updateDoc/deleteDoc で使用）
      _firestoreId:   docId,
    };
  }

  // ── TOURNAMENTS_FLAT を Firestore + 静的データでリビルド ──
  function _rebuildFromFirestore() {
    if (typeof TOURNAMENTS_FLAT === 'undefined') return;

    // ① 静的データ（tournaments[]）をベースに
    const staticFlat = (typeof tournaments !== 'undefined')
      ? tournaments.map(t => {
          if (typeof _tdbToFlat === 'function' && typeof _tdbTemplate === 'function') {
            return _tdbToFlat(_tdbTemplate(t));
          }
          return { ...t, id: t.id, name: t.title, cat: t.category,
                   start: t.startDate, end: t.endDate, _fromFirestore: false };
        })
      : [];

    // ② Firestore データ（同じIDは Firestore が優先）
    const staticMap = new Map(staticFlat.map(t => [t.id, t]));
    _fsMap.forEach((flat, id) => staticMap.set(id, flat));

    // ③ カスタム DB（管理者追加分）
    if (typeof TOURNAMENTS_DB !== 'undefined') {
      TOURNAMENTS_DB.forEach(t => {
        if (typeof _tdbToFlat === 'function') {
          staticMap.set(t.id, _tdbToFlat(t));
        }
      });
    }

    // ④ TOURNAMENTS_FLAT を破壊的更新（参照を維持）
    // クライアント側で startDate 昇順にソート（orderBy を外したため）
    const sorted = [...staticMap.values()].sort((a, b) => {
      const sa = a.start || '9999-99-99';
      const sb = b.start || '9999-99-99';
      return sa < sb ? -1 : sa > sb ? 1 : 0;
    });
    TOURNAMENTS_FLAT.length = 0;
    sorted.forEach(v => TOURNAMENTS_FLAT.push(v));

    // ⑤ DB 互換レイヤー再構築
    if (typeof DB !== 'undefined') {
      Object.keys(DB).forEach(k => { if (k !== 'personal') delete DB[k]; });
      staticMap.forEach(t => {
        if (!DB[t.cat]) DB[t.cat] = [];
        DB[t.cat].push({
          name: t.name,
          place: (t.courseName ? `${t.place} ${t.courseName}` : t.place) || '',
          start: t.start, end: t.end,
          area: t.area, prefecture: t.prefecture,
        });
      });
    }

    // ⑥ 検索キャッシュを無効化して再描画
    if (typeof _invalidateSearchCache === 'function') _invalidateSearchCache();
    if (typeof applySearchFilters     === 'function') applySearchFilters();
    if (typeof renderAllPanels        === 'function') renderAllPanels();
    if (typeof renderCalList          === 'function') renderCalList();

    // ⑦ appState 更新
    if (typeof appState !== 'undefined') {
      appState.set('tournaments.totalCount',  TOURNAMENTS_FLAT.length);
      appState.set('tournaments.lastUpdated', new Date().toISOString());
      appState.set('tournaments.loaded', true);
    }

    console.info(
      `[Firestore] TOURNAMENTS_FLAT rebuilt: ${TOURNAMENTS_FLAT.length} 件`
      + ` (Firestore: ${_fsMap.size}, 静的: ${staticFlat.length})`
    );
  }

  // ── onSnapshot コールバック ──
  function _onSnapshot(snapshot) {
    _fsLoaded = true;

    snapshot.docChanges().forEach(change => {
      const flat = _fsDocToFlat(change.doc);
      if (change.type === 'removed') {
        _fsMap.delete(flat.id);
      } else {
        // 'added' | 'modified'
        _fsMap.set(flat.id, flat);
      }
    });

    _rebuildFromFirestore();
    _setStatus('live', `Firestore 接続中 (${_fsMap.size} 件)`);
  }

  // ── 購読開始 ──
  function _subscribe() {
    if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }

    try {
      const db = firebase.firestore();

      _setStatus('loading', '大会データを取得中…');

      // 現在の検索画面かどうかに関わらず取得開始（データは常に最新を保つ）
      _unsubscribe = db.collection('tournaments')
        .onSnapshot(
          _onSnapshot,
          (err) => {
            console.error('[Firestore] onSnapshot error:', err);
            _setStatus('error', 'データ取得エラー — 静的データで表示中');
            if (typeof showToast === 'function') showToast('Firestore接続エラー。静的データで表示します。');
            // 10 秒後にリトライ（エラー多発を防ぐ）
            if (_retryTimer) clearTimeout(_retryTimer);
            _retryTimer = setTimeout(_subscribe, 10000);
          }
        );

      console.info(
        '%c[Firestore]%c tournaments コレクション購読開始',
        'background:#39C892;color:#fff;padding:1px 5px;border-radius:2px;font-weight:700;',
        'color:#3A5C52;'
      );
    } catch(e) {
      console.error('[Firestore] subscribe error:', e);
      _setStatus('error', '接続エラー');
      if (typeof showToast === 'function') showToast('Firestore接続に失敗しました');
    }
  }

  // ── 公開 API ──
  return {
    /** Firestore 購読を開始する（firebase SDK ロード後に呼ぶ） */
    start() {
      if (typeof firebase === 'undefined' || !firebase.apps?.length) {
        console.warn('[Firestore] Firebase が初期化されていません');
        return;
      }
      _subscribe();
    },

    /** 購読を停止する */
    stop() {
      if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }
      if (_retryTimer)  { clearTimeout(_retryTimer); _retryTimer = null; }
    },

    /** 現在のステータス */
    get status()   { return _status; },
    get count()    { return _fsMap.size; },
    get isLoaded() { return _fsLoaded; },

    /** 手動でデータを再取得（pull to refresh 等に利用可） */
    refresh() { if (_unsubscribe) { _subscribe(); } },
  };
})();

// ================================================================
// 検索画面に Firestore ステータスバナーを挿入
// ================================================================
(function insertStatusBanner() {
  // バナーは HTML に直接記述済み。JS 挿入は不要。
  // (念のため、未挿入の場合のみ動的挿入)
  function insert() {
    if (document.getElementById('fs-status-banner')) return;
    const wrap = document.querySelector('#page-search .search-scroll');
    if (!wrap) return;
    const banner = document.createElement('div');
    banner.id = 'fs-status-banner';
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML =
      '<span class="fs-status-dot loading"></span>' +
      '<span class="fs-status-text">大会データを取得中…</span>';
    wrap.parentNode.insertBefore(banner, wrap);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insert, { once: true });
  } else {
    insert();
  }
})();

// ================================================================
// _initFirestore — Firebase Auth ロード後に呼ばれる
// ================================================================
function _initFirestore() {
  // Firebase SDK が未ロードなら何もしない
  if (typeof firebase === 'undefined') {
    console.warn('[Firestore] Firebase SDK 未ロード — スキップ');
    return;
  }
  if (!firebase.apps?.length) {
    console.warn('[Firestore] Firebase 未初期化 — スキップ');
    return;
  }
  if (typeof firebase.firestore !== 'function') {
    console.warn('[Firestore] Firestore SDK 未ロード — スキップ');
    if (typeof showToast === 'function') showToast('Firestore SDKの読み込みに失敗しました');
    return;
  }

  // 検索画面が active なら即 Skeleton 表示
  function _showSkeletonIfSearch() {
    const searchPage = document.getElementById('page-search');
    if (!searchPage || !searchPage.classList.contains('active')) return;
    const list = document.getElementById('search-list');
    if (!list) return;
    // 既に大会カードがあれば上書きしない
    if (list.querySelector('.search-card, .skel-card')) return;
    list.innerHTML = Array.from({ length: 5 }, () =>
      '<div class="skel-card">' +
        '<div class="skel-line skel-line-title"></div>' +
        '<div class="skel-line skel-line-sub"></div>' +
        '<div class="skel-line skel-line-badge"></div>' +
      '</div>'
    ).join('');
  }

  _showSkeletonIfSearch();

  // Firestore 購読を開始
  FirestoreDB.start();
  console.info('[Firestore] 起動完了');
}

// ProNexaX API に Firestore を追加
if (typeof window.ProNexaX !== 'undefined') {
  window.ProNexaX.firestore = FirestoreDB;
}

console.info('[Firestore Layer] 初期化完了');

/* ================================================================
   ★★★ iOS純正風 BottomSheet — 完全実装 ★★★
   
   Apple Maps / Apple Music / iOS Share Sheet と同等の挙動:
   ① シート上部80px全体をドラッグ領域に
   ② translateY > 120px OR velocity > 0.6px/ms → dismiss
   ③ それ未満 → spring animation でスナップバック
   ④ 内部スクロール中（scrollTop > 0）は dismiss しない
   ⑤ iOS風ハンドルデザイン（44×5px pill、border-radius:999px）
   ================================================================ */
'use strict';

// ================================================================
// § 1  iOS Sheet Drag Engine
// ================================================================

/**
 * IOSSheetDrag(config)
 *
 * @param {object} config
 *   sheetEl      — シート要素（transform でアニメーション）
 *   handleEl     — ドラッグトリガー要素（視覚ハンドル）
 *   scrollEls    — 内部スクロール要素の配列（null可）
 *   closeFn      — 閉じる関数
 *   threshold    — dismiss距離 px （default 120）
 *   velThreshold — dismiss速度 px/ms（default 0.6）
 */
function IOSSheetDrag(config) {
  const {
    sheetEl,
    handleEl,
    scrollEls    = [],
    closeFn,
    threshold    = 120,
    velThreshold = 0.6,
  } = config;

  if (!sheetEl) return null;

  // ── 状態 ──
  let startY      = 0;
  let curY        = 0;
  let lastY       = 0;
  let lastT       = 0;
  let velocity    = 0;
  let active      = false;   // ドラッグ進行中
  let dismissed   = false;   // dismiss済み（二重実行防止）

  // scrollEls を配列に正規化
  const scrollArr = Array.isArray(scrollEls)
    ? scrollEls.filter(Boolean)
    : (scrollEls ? [scrollEls] : []);

  // ── ドラッグ領域: シート上部 80px 全体 ──
  // handleEl（視覚ハンドル）+ シート自体の上部エリアを使う
  const dragZone = document.createElement('div');
  dragZone.className = 'ios-sheet-drag-zone';
  dragZone.style.cssText = [
    'position:absolute',
    'top:0',
    'left:0',
    'right:0',
    'height:80px',
    'z-index:10',
    'cursor:grab',
    'touch-action:none',
    '-webkit-user-select:none',
    'user-select:none',
    'pointer-events:none',  /* ✕ボタンなど下層要素へタッチを通す */
  ].join(';');

  // sheetEl の先頭に dragZone を挿入（position:relative が必要）
  if (getComputedStyle(sheetEl).position === 'static') {
    sheetEl.style.position = 'relative';
  }
  sheetEl.insertBefore(dragZone, sheetEl.firstChild);

  // ── 速度を指数移動平均でスムージング ──
  // 単純な最後1フレームより安定する
  let velSmooth = 0;

  // ── touchstart ──
  function onStart(e) {
    if (dismissed) return;

    // 内部スクロール中なら dismiss しない
    // （scrollTop > 4px の場合はドラッグを無視）
    const isScrolled = scrollArr.some(el => el && el.scrollTop > 4);
    if (isScrolled) return;

    const touch = e.touches ? e.touches[0] : e;
    startY    = touch.clientY;
    lastY     = touch.clientY;
    lastT     = Date.now();
    curY      = 0;
    velocity  = 0;
    velSmooth = 0;
    active    = true;

    // transition を一時停止してリアルタイム追従を有効化
    sheetEl.style.transition = 'none';
    sheetEl.classList.add('ios-dragging');
  }

  // ── touchmove ──
  function onMove(e) {
    if (!active) return;

    const touch = e.touches ? e.touches[0] : e;
    const dy    = touch.clientY - startY;

    // 上方向ドラッグは無視（シートを引き上げない）
    if (dy < 0) {
      curY = 0;
      sheetEl.style.transform = 'translateY(0)';
      return;
    }

    // 内部スクロール中にドラッグが始まったら中断
    const isScrolled = scrollArr.some(el => el && el.scrollTop > 4);
    if (isScrolled) {
      _snapBack();
      return;
    }

    e.preventDefault();

    // 速度計算（指数移動平均でスムージング）
    const now = Date.now();
    const dt  = Math.max(now - lastT, 1);
    const v   = (touch.clientY - lastY) / dt;
    velSmooth = velSmooth * 0.6 + v * 0.4;  // EMA α=0.4
    velocity  = velSmooth;
    lastY     = touch.clientY;
    lastT     = now;

    // ゴムバンド効果: 大きく引っ張るほど抵抗が増す
    // dy が threshold の2倍を超えたあたりから減衰
    const rubberDy = dy > threshold * 2
      ? threshold * 2 + (dy - threshold * 2) * 0.25
      : dy;

    curY = rubberDy;
    sheetEl.style.transform = `translateY(${curY}px)`;
  }

  // ── touchend ──
  function onEnd(e) {
    if (!active) return;
    active = false;
    sheetEl.classList.remove('ios-dragging');

    const shouldDismiss = curY > threshold || velocity > velThreshold;

    if (shouldDismiss) {
      _dismiss();
    } else {
      _snapBack();
    }
  }

  // ── dismiss: 下へ落ちてから完全 close ──
  //
  // ★ 修正の核心:
  //   旧実装: animate(110%) → style.transform='' → closeFn()
  //   問題:   transform='' の時点で .show が残っていると
  //           CSS .show { transform:translateY(0) } がスナップバックさせる
  //
  //   新実装: animate(110%) → closeFn()を先に実行して.showを外す
  //           → rAF で style.transform='' (この時点で .show なし → CSS も translateY(0)なし)
  //
  function _dismiss() {
    if (dismissed) return;
    dismissed = true;
    active = false;

    // ① 速度に応じてアニメーション時間（速いほど短く）
    const dur = Math.max(160, Math.min(280, 280 - velocity * 80));

    // ② is-dragging 解除・ios-dismissing 付与・transition をセット
    sheetEl.classList.remove('ios-dragging');
    sheetEl.classList.add('ios-dismissing');   // CSS .show の transform を無効化
    sheetEl.style.transition = `transform ${dur}ms cubic-bezier(.32,.72,.25,1)`;

    // ③ 現在位置から下へスライドアウト
    sheetEl.style.transform = 'translateY(110vh)';

    setTimeout(() => {
      // ④ dismiss フラグを立てる（closeFn 内で transform をリセットしないよう制御）
      sheetEl._iosDismissing = true;

      // ⑤ closeFn を先に呼んで .show / overlay を外す
      //    これにより CSS の .show { transform:translateY(0) } が無効化される
      if (typeof closeFn === 'function') closeFn();

      // ⑥ rAF 2回で確実にレイアウトが反映された後に transform をクリア
      //    この時点で .show は外れているため CSS スナップバックは起きない
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          sheetEl._iosDismissing = false;
          sheetEl.classList.remove('ios-dismissing');
          sheetEl.style.transition = '';
          sheetEl.style.transform  = '';
          dismissed = false;
        });
      });
    }, dur);
  }

  // ── snap back: iOS の spring animation ──
  function _snapBack() {
    active = false;
    sheetEl.classList.remove('ios-dragging');

    // .show クラスが残っている状態で transition をセット
    // CSS の .show { transform:translateY(0) } と競合しないよう
    // inline style で明示的に translateY(0) を指定してから spring で戻す
    sheetEl.style.transition = 'transform .42s cubic-bezier(.32,.72,0,1)';
    sheetEl.style.transform  = 'translateY(0)';

    setTimeout(() => {
      // inline style を削除して CSS の管理に戻す
      sheetEl.style.transition = '';
      sheetEl.style.transform  = '';
    }, 440);
    curY = 0;
  }

  // ── イベント登録 ──
  // dragZone は pointer-events:none のため sheetEl 本体に登録する。
  // touchstart の clientY が dragZone の高さ（48px）内かつボタン要素でない時のみ drag 開始。
  function _isTouchOnDragZone(e) {
    const touch = e.touches ? e.touches[0] : e;
    // ① sheetEl の上端から dragZone 高さ（48px）以内
    const rect = sheetEl.getBoundingClientRect();
    if (touch.clientY - rect.top > 48) return false;
    // ② ✕ボタンなど interactive 要素の場合はドラッグしない
    const target = e.target;
    if (target && (target.tagName === 'BUTTON' || target.closest('button'))) return false;
    return true;
  }

  function _onSheetTouchStart(e) { if (_isTouchOnDragZone(e)) onStart(e); }
  function _onSheetTouchMove(e)  { onMove(e); }
  function _onSheetTouchEnd(e)   { onEnd(e); }

  sheetEl.addEventListener('touchstart',  _onSheetTouchStart, { passive: true  });
  sheetEl.addEventListener('touchmove',   _onSheetTouchMove,  { passive: false });
  sheetEl.addEventListener('touchend',    _onSheetTouchEnd,   { passive: true  });
  sheetEl.addEventListener('touchcancel', _onSheetTouchEnd,   { passive: true  });

  // マウス対応（デスクトップ開発・テスト用）
  dragZone.addEventListener('mousedown', (e) => {
    onStart(e);
    const mm = (e2) => onMove(e2);
    const mu = ()   => {
      onEnd();
      document.removeEventListener('mousemove', mm);
      document.removeEventListener('mouseup',   mu);
    };
    document.addEventListener('mousemove', mm);
    document.addEventListener('mouseup',   mu);
  });

  // ── scrollEl の設定 ──
  scrollArr.forEach(el => {
    if (!el) return;
    el.style.touchAction              = 'pan-y';
    el.style.overscrollBehavior       = 'contain';
    el.style.webkitOverflowScrolling  = 'touch';
  });

  // ── 外部 API ──
  return {
    dismiss:  _dismiss,
    snapBack: _snapBack,
    destroy() {
      sheetEl.removeEventListener('touchstart',  _onSheetTouchStart);
      sheetEl.removeEventListener('touchmove',   _onSheetTouchMove);
      sheetEl.removeEventListener('touchend',    _onSheetTouchEnd);
      sheetEl.removeEventListener('touchcancel', _onSheetTouchEnd);
      dragZone.remove();
    },
  };
}

// ================================================================
// § 2  iOS風ハンドルを全シートに適用
// ================================================================

/**
 * _applyIOSHandle(containerEl)
 * containerEl の中の handle/grabber 要素を iOS スタイルに統一する。
 * 既存要素を置換するのではなく、中身を pill に書き換える。
 */
function _applyIOSHandle(containerEl) {
  if (!containerEl) return;

  // .modal-handle / .tdm-grabber / .add-cat-grip / .fbs-drag-handle をすべて対象に
  const handles = containerEl.querySelectorAll(
    '.modal-handle, .tdm-grabber, .add-cat-grip, .fbs-drag-handle, .fbs-drag-pip'
  );

  handles.forEach(el => {
    // クラスを統一
    el.classList.add('ios-handle-pill');

    // サイズ・形状を iOS 仕様に
    Object.assign(el.style, {
      display:        'block',
      width:          '44px',
      height:         '5px',
      borderRadius:   '999px',
      background:     '#D1D1D6',
      margin:         '8px auto 10px',
      flexShrink:     '0',
      cursor:         'grab',
      userSelect:     'none',
      webkitUserSelect: 'none',
    });
  });
}

// ================================================================
// § 3  CSS を head に注入
// ================================================================
(function injectIOSSheetCSS() {
  // 既存のパッチを削除して新規注入
  const old = document.getElementById('bottom-sheet-swipe-patch');
  if (old) old.remove();

  const style = document.createElement('style');
  style.id = 'ios-sheet-style';
  style.textContent = `
/* ================================================================
   iOS Sheet Style — 完全定義
   ================================================================ */

/* ① ドラッグゾーン */
.ios-sheet-drag-zone {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 80px;
  z-index: 10;
  cursor: grab;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
}
.ios-sheet-drag-zone:active { cursor: grabbing; }

/* ② iOS pill ハンドル */
.ios-handle-pill,
.modal-handle,
.tdm-grabber,
.add-cat-grip {
  display: block !important;
  width: 44px !important;
  height: 5px !important;
  border-radius: 999px !important;
  background: #D1D1D6 !important;
  margin: 8px auto 10px !important;
  flex-shrink: 0 !important;
  cursor: grab;
  -webkit-user-select: none;
  user-select: none;
  pointer-events: none;  /* dragZone が受け取る */
}

/* ③ ダークモード */
:root[data-theme="dark"] .ios-handle-pill,
:root[data-theme="dark"] .modal-handle,
:root[data-theme="dark"] .tdm-grabber,
:root[data-theme="dark"] .add-cat-grip {
  background: #48484A !important;
}

/* ④ ドラッグ中: transition を切る */
.ios-dragging {
  transition: none !important;
  will-change: transform;
  user-select: none;
  -webkit-user-select: none;
}

/* ⑤ シート本体の transition（modal-sheetは独自CSSで管理するため除外） */
.tdm-sheet.show,
.fbs-sheet,
.add-cat-sheet.show {
  transition: transform .38s cubic-bezier(.32,.72,0,1) !important;
}

/* ⑥ dragZone 基準（modal-sheetは独自CSSで管理） */
.tdm-sheet,
.fbs-sheet,
.add-cat-sheet {
  position: relative;
}

/* ⑦ 内部スクロール */
.modal-scroll,
.tdm-scroll,
.fbs-scroll-body,
.fbs-scroll,
.add-cat-list {
  touch-action: pan-y !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

/* ⑧ FBS sheet のグラブハンドルエリア */
.fbs-drag-handle {
  width: 100%;
  padding: 10px 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: grab;
  touch-action: none;
}
.fbs-drag-pip {
  display: block !important;
  width: 44px !important;
  height: 5px !important;
  border-radius: 999px !important;
  background: #D1D1D6 !important;
  pointer-events: none;
}
:root[data-theme="dark"] .fbs-drag-pip {
  background: #48484A !important;
}

/* ⑨ overlay 非表示時は pointer-events なし（modal-overlayは独自CSSで管理） */
.tdm-overlay:not(.show) {
  pointer-events: none !important;
}

/* ⑩ スクロール構造（modal-scrollは独自CSSで管理） */

/* ★ dismiss中: CSS .show の transform上書きを防ぐ */
.modal-sheet.ios-dismissing,
.tdm-sheet.ios-dismissing,
.fbs-sheet.ios-dismissing,
.add-cat-sheet.ios-dismissing {
  transform: translateY(110vh) !important;
}

/* ================================================================
   ★★★ Auth 管理者分離 最終CSS ★★★
   ================================================================ */

/* admin-only: デフォルト非表示 */
.admin-only {
  display: none !important;
}
/* 管理者: admin-only 要素を表示 */
body.is-admin .admin-only {
  display: revert !important;
}
/* flex を使う管理者要素 */
body.is-admin .admin-header-actions.admin-only,
body.is-admin .admin-card-actions.admin-only {
  display: flex !important;
}
/* button の admin-only */
body.is-admin button.admin-only,
body.is-admin .admin-url-btn,
body.is-admin .admin-add-btn {
  display: inline-flex !important;
}

/* admin-nav-btn: CSS で制御（JS の style= より優先させる） */
.admin-nav-btn {
  display: none !important;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
body.is-admin .admin-nav-btn {
  display: flex !important;
}

/* page-admin: 管理者のみ */
#page-admin {
  display: none !important;
}
body.is-admin #page-admin.active {
  display: flex !important;
}

/* auth-screen.hidden */
#auth-screen.hidden,
#auth-screen[style*="display: none"],
#auth-screen[style*="display:none"] {
  display: none !important;
}

/* app-frame のフェードイン */
.app-frame {
  transition: opacity .3s ease;
}
`;
  document.head.appendChild(style);
})();

// ================================================================
// § 4  全シートを初期化
// ================================================================
(function initAllIOSSheets() {

  // キャッシュ: シートID → IOSSheetDrag インスタンス
  const _instances = new Map();

  function _setup(id, sheetEl, scrollEls, closeFn, extraConfig) {
    if (!sheetEl) return;
    // 既存インスタンスを破棄
    if (_instances.has(id)) {
      try { _instances.get(id).destroy(); } catch(e) {}
    }
    // ハンドルを iOS スタイルに
    _applyIOSHandle(sheetEl);

    const inst = IOSSheetDrag({
      sheetEl,
      scrollEls: Array.isArray(scrollEls) ? scrollEls : [scrollEls],
      closeFn,
      threshold:    120,
      velThreshold: 0.6,
      ...extraConfig,
    });
    if (inst) _instances.set(id, inst);
    return inst;
  }

  function init() {

    // ─────────────────────────────────────────
    // ① メインモーダル（カレンダー予定追加）
    //    drag-free 版に再構築済み → IOSSheetDrag は適用しない
    // ─────────────────────────────────────────

    // ─────────────────────────────────────────
    // ② Day View モーダル（予定一覧）
    // ─────────────────────────────────────────
    (function() {
      const overlay = document.getElementById('day-modal-overlay');
      if (!overlay) return;
      const sheet  = overlay.querySelector('.modal-sheet');
      const scroll = document.getElementById('day-modal-list');
      if (!sheet) return;

      _setup('day-modal', sheet,
        [scroll],
        () => {
          if (typeof closeDayModal === 'function') closeDayModal();
          else overlay.classList.remove('show');
        }
      );
    })();

    // ─────────────────────────────────────────
    // ③ 大会詳細（TDM）
    // ─────────────────────────────────────────
    (function() {
      const sheet  = document.getElementById('tdm-sheet');
      if (!sheet) return;
      const scroll = sheet.querySelector('.tdm-scroll') || sheet.querySelector('.tdm-body');

      // 既存の ontouchstart を解除
      const grabber = document.getElementById('tdm-grabber');
      if (grabber) {
        grabber.ontouchstart = null;
        grabber.ontouchmove  = null;
        grabber.ontouchend   = null;
      }

      _setup('tdm', sheet,
        [scroll],
        () => { if (typeof closeTournamentModal === 'function') closeTournamentModal(); },
        { threshold: 100, velThreshold: 0.5 }
      );

      // ✕ボタン
      const closeBtn = document.getElementById('tdm-close-btn');
      if (closeBtn) {
        closeBtn.ontouchstart = (e) => e.stopPropagation();
        closeBtn.ontouchend   = (e) => {
          e.preventDefault(); e.stopPropagation();
          if (typeof closeTournamentModal === 'function') closeTournamentModal();
        };
      }
    })();

    // ─────────────────────────────────────────
    // ④ フィルターボトムシート（FBS）
    // ─────────────────────────────────────────
    (function() {
      const overlay = document.getElementById('fbs-overlay');
      const sheet   = overlay && overlay.querySelector('.fbs-sheet');
      if (!overlay || !sheet) return;
      const scroll  = document.getElementById('fbs-scroll-body')
                   || sheet.querySelector('.fbs-scroll');

      // FBS には既存の fbs-drag-handle があれば再利用、なければ作成
      let grip = sheet.querySelector('.fbs-drag-handle');
      if (!grip) {
        grip = document.createElement('div');
        grip.className = 'fbs-drag-handle';
        grip.innerHTML = '<div class="fbs-drag-pip"></div>';
        sheet.insertBefore(grip, sheet.firstChild);
      }

      _setup('fbs', sheet,
        [scroll],
        () => {
          if (typeof closeFilterSheet === 'function') closeFilterSheet();
          else overlay.classList.remove('show');
        }
      );
    })();

    // ─────────────────────────────────────────
    // ⑤ カテゴリ追加シート
    // ─────────────────────────────────────────
    (function() {
      const sheet  = document.getElementById('add-cat-sheet');
      if (!sheet) return;
      const scroll = sheet.querySelector('.add-cat-list')
                  || sheet.querySelector('[class*="scroll"]');

      _setup('add-cat', sheet,
        [scroll],
        () => {
          if (typeof closeAddCatSheet === 'function') closeAddCatSheet();
          else sheet.classList.remove('show');
        }
      );
    })();

    console.info(
      '%c[IOSSheet]%c 全シート iOS風ドラッグ初期化完了',
      'background:#39C892;color:#fff;padding:1px 6px;border-radius:3px;font-weight:700;',
      'color:#3A5C52;font-weight:600;'
    );
  }

  // ─────────────────────────────────────────
  // openTournamentModal をフック: 毎回 dragZone を再生成
  // ─────────────────────────────────────────
  function hookTdmOpen() {
    if (typeof openTournamentModal !== 'function') return;
    const _orig = window.openTournamentModal;
    window.openTournamentModal = function(tid) {
      if (typeof _orig === 'function') _orig(tid);
      setTimeout(() => {
        const sheet = document.getElementById('tdm-sheet');
        if (!sheet) return;
        // 既存 dragZone を削除して再生成
        sheet.querySelectorAll('.ios-sheet-drag-zone').forEach(z => z.remove());
        const scroll = sheet.querySelector('.tdm-scroll') || sheet.querySelector('.tdm-body');
        _setup('tdm', sheet,
          [scroll],
          () => { if (typeof closeTournamentModal === 'function') closeTournamentModal(); },
          { threshold: 100, velThreshold: 0.5 }
        );
        const closeBtn = document.getElementById('tdm-close-btn');
        if (closeBtn) {
          closeBtn.ontouchstart = (e) => e.stopPropagation();
          closeBtn.ontouchend   = (e) => {
            e.preventDefault(); e.stopPropagation();
            if (typeof closeTournamentModal === 'function') closeTournamentModal();
          };
        }
      }, 80);
    };
  }

  // DOM 準備後に初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(init, 300);
      setTimeout(hookTdmOpen, 500);
    }, { once: true });
  } else {
    setTimeout(init, 300);
    setTimeout(hookTdmOpen, 500);
  }

})();

/* ================================================================
  大会詳細モーダル — _renderTdm 完全版置き換え
  ================================================================ */
(function(){
'use strict';

/* ── ユーティリティ ── */
const _e = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

function _fmt(ds){
  if(!ds) return null;
  try{
    const d=new Date(ds+'T00:00:00');
    const w=['日','月','火','水','木','金','土'][d.getDay()];
    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日（${w}）`;
  }catch(e){return ds;}
}

function _tdmStatus(t){
  if(typeof calcTournamentStatus==='function') return calcTournamentStatus(t);
  const today=new Date().toISOString().slice(0,10);
  const s=t.start||t.startDate, en=t.end||t.endDate, dl=t.entryDeadline;
  if(!s) return 'tbd';
  if(today>(en||s)) return 'ended';
  if(today>=s) return 'ongoing';
  if(dl&&today>dl) return 'closed';
  if(dl){ const diff=(new Date(dl)-new Date(today))/86400000; if(diff<=7) return 'closing_soon'; }
  return 'open';
}

const _ST = {
  open:         {label:'募集中',       cls:'tdmv2-st-open',         dot:true},
  closing_soon: {label:'締切間近',     cls:'tdmv2-st-closing_soon', dot:true},
  closed:       {label:'締切済み',     cls:'tdmv2-st-closed',       dot:false},
  ongoing:      {label:'開催中',       cls:'tdmv2-st-ongoing',      dot:false},
  ended:        {label:'終了',         cls:'tdmv2-st-ended',        dot:false},
  tbd:          {label:'日程未定',     cls:'tdmv2-st-tbd',          dot:false},
  cancelled:    {label:'中止',         cls:'tdmv2-st-cancelled',    dot:false},
};

function _dlClass(ds){
  if(!ds) return '';
  const diff=(new Date(ds)-new Date(new Date().toISOString().slice(0,10)))/86400000;
  if(diff<0) return '';
  if(diff===0) return 'dl-today';
  if(diff<=7)  return 'dl-near';
  return '';
}

/* ── アイコン ── */
const SVG = {
  cal:      `<svg width="15" height="15" viewBox="0 0 22 22" fill="none"><rect x="3" y="4" width="16" height="15" rx="2.5" stroke="currentColor" stroke-width="1.7"/><line x1="7" y1="2" x2="7" y2="6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><line x1="15" y1="2" x2="15" y2="6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><line x1="3" y1="9" x2="19" y2="9" stroke="currentColor" stroke-width="1.7"/></svg>`,
  clock:    `<svg width="15" height="15" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8.5" stroke="currentColor" stroke-width="1.7"/><path d="M11 7v4.5l3 1.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  pin:      `<svg width="15" height="15" viewBox="0 0 22 22" fill="none"><path d="M11 3.5a5 5 0 015 5c0 4-5 10-5 10S6 12.5 6 8.5a5 5 0 015-5z" stroke="currentColor" stroke-width="1.7"/><circle cx="11" cy="8.5" r="1.8" fill="currentColor"/></svg>`,
  golf:     `<svg width="15" height="15" viewBox="0 0 22 22" fill="none"><path d="M11 3v10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M11 3l5 2.5-5 2.5" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><ellipse cx="11" cy="17" rx="4" ry="1.5" stroke="currentColor" stroke-width="1.5"/></svg>`,
  org:      `<svg width="15" height="15" viewBox="0 0 22 22" fill="none"><path d="M3 19c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="11" cy="8" r="4" stroke="currentColor" stroke-width="1.7"/></svg>`,
  trophy:   `<svg width="15" height="15" viewBox="0 0 22 22" fill="none"><path d="M6 3h10v8a5 5 0 01-10 0V3z" stroke="currentColor" stroke-width="1.7"/><path d="M6 5H3v2a3 3 0 003 3M16 5h3v2a3 3 0 01-3 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><line x1="11" y1="16" x2="11" y2="19" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><line x1="7" y1="19" x2="15" y2="19" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  money:    `<svg width="15" height="15" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8.5" stroke="currentColor" stroke-width="1.7"/><path d="M11 7v1m0 6v1m-3-4h4a1.5 1.5 0 010 3H9m0-3h2a1.5 1.5 0 000-3H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  doc:      `<svg width="15" height="15" viewBox="0 0 22 22" fill="none"><rect x="4" y="3" width="14" height="17" rx="2" stroke="currentColor" stroke-width="1.7"/><line x1="7" y1="8" x2="15" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="7" y1="12" x2="15" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="7" y1="16" x2="11" y2="16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  user:     `<svg width="15" height="15" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="3.5" stroke="currentColor" stroke-width="1.7"/><path d="M4 19c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  num:      `<svg width="15" height="15" viewBox="0 0 22 22" fill="none"><path d="M5 8h12M5 12h12M5 16h8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  cancel:   `<svg width="15" height="15" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8.5" stroke="currentColor" stroke-width="1.7"/><path d="M8 8l6 6M14 8l-6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  globe:    `<svg width="15" height="15" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8.5" stroke="currentColor" stroke-width="1.7"/><path d="M2 11h18M11 2a13.5 13.5 0 010 18M11 2a13.5 13.5 0 000 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  ig:       `<svg width="15" height="15" viewBox="0 0 22 22" fill="none"><rect x="3" y="3" width="16" height="16" rx="4.5" stroke="currentColor" stroke-width="1.7"/><circle cx="11" cy="11" r="3.5" stroke="currentColor" stroke-width="1.5"/><circle cx="15.5" cy="6.5" r=".8" fill="currentColor"/></svg>`,
  entry:    `<svg width="15" height="15" viewBox="0 0 22 22" fill="none"><path d="M14 3H18a1 1 0 011 1v15a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M9 11l2 2 4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><rect x="8" y="1" width="6" height="4" rx="1" stroke="currentColor" stroke-width="1.7"/></svg>`,
  map:      `<svg width="13" height="13" viewBox="0 0 22 22" fill="none"><path d="M11 3.5a5 5 0 015 5c0 4-5 10-5 10S6 12.5 6 8.5a5 5 0 015-5z" stroke="currentColor" stroke-width="1.7"/><circle cx="11" cy="8.5" r="2" stroke="currentColor" stroke-width="1.5"/></svg>`,
  ext:      `<svg width="11" height="11" viewBox="0 0 22 22" fill="none"><path d="M9 4H4a1 1 0 00-1 1v13a1 1 0 001 1h13a1 1 0 001-1v-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M14 3h5m0 0v5m0-5L10 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

/* ── カラー定義（アイコン背景） ── */
const IC = {
  cal:   {bg:'#E8F5EE', color:'#0B7A44'},
  clock: {bg:'#FFF3E0', color:'#A05800'},
  pin:   {bg:'#EAF0FB', color:'#2D7DD2'},
  golf:  {bg:'#E8F5EE', color:'#0B7A44'},
  org:   {bg:'#F5F0FA', color:'#7B4DB5'},
  trophy:{bg:'#FFF8E0', color:'#8A6800'},
  money: {bg:'#FFF8E0', color:'#8A6800'},
  doc:   {bg:'#EAF0FB', color:'#2D7DD2'},
  user:  {bg:'#F0F8F5', color:'#3A9E7A'},
  num:   {bg:'#EAF0FB', color:'#2D7DD2'},
  cancel:{bg:'#FFF0F0', color:'#C03030'},
};

function _iconEl(type, size=15){
  const c = IC[type]||{bg:'#F0F5F2',color:'#6A8E84'};
  return `<div class="tdmv2-row-icon" style="background:${c.bg};"><svg width="${size}" height="${size}" viewBox="0 0 22 22" fill="none" style="color:${c.color};">${SVG[type]?.match(/<svg[^>]*>([\s\S]*)<\/svg>/)?.[1]||''}</svg></div>`;
}

/* ── 情報行 HTML ── */
function _row(iconType, label, value, extra){
  const ic = IC[iconType]||{bg:'#F0F5F2',color:'#6A8E84'};
  const svgInner = SVG[iconType]?.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'') || '';
  const iconHtml = `<div class="tdmv2-row-icon" style="background:${ic.bg};">
    <svg width="15" height="15" viewBox="0 0 22 22" fill="none" style="color:${ic.color};">${svgInner}</svg>
  </div>`;
  const valHtml = value
    ? `<div class="tdmv2-row-value${extra?' '+extra:''}">${value}</div>`
    : `<div class="tdmv2-row-value empty">未設定</div>`;
  return `<div class="tdmv2-row">${iconHtml}<div class="tdmv2-row-label">${label}</div>${valHtml}</div>`;
}

/* ── リンクボタン HTML ── */
function _linkBtn(url, label, iconType, iconBg, iconColor, statusLabel){
  const svgInner = SVG[iconType]?.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'') || '';
  const active = url ? ' active' : '';
  const href   = url ? ` href="${_e(url)}" target="_blank" rel="noopener noreferrer"` : ' onclick="return false;"';
  const status = url ? (statusLabel||'リンクあり') : '未設定';
  return `<a class="tdmv2-link-btn${active}"${href}>
    <div class="tdmv2-link-icon-wrap" style="background:${iconBg};">
      <svg width="15" height="15" viewBox="0 0 22 22" fill="none" style="color:${iconColor};">${svgInner}</svg>
    </div>
    <div class="tdmv2-link-info">
      <span class="tdmv2-link-name">${label}</span>
      <span class="tdmv2-link-status">${status}</span>
    </div>
    ${url?`<span class="tdmv2-link-chev">${SVG.ext}</span>`:''}
  </a>`;
}

/* ────────────────────────────────────────────
  ★★★ _renderTdm 完全版（既存関数を上書き） ★★★
  ────────────────────────────────────────────*/
window._renderTdm = function(t){
  if(!t) return;

  /* ── フィールド正規化（flat / raw 両方対応） ── */
  const raw = t._raw || t;
  const id          = t.id || raw.id || '';
  const name        = t.name || raw.title || '';
  const cat         = t.cat  || raw.category || '';
  const catColor    = (typeof CAT_COLORS!=='undefined' ? CAT_COLORS[cat] : null) || '#8090A0';
  const catLabel    = (typeof CAT_LABELS!=='undefined' ? CAT_LABELS[cat] : null) || cat;
  const genderLabel = ({womens:'女子', both:'男女', mens:'男子', amateur:'アマ'})[t.gender||raw.gender]||'';
  const status      = _tdmStatus(t);
  const stDef       = _ST[status] || _ST.tbd;

  // 日程
  const startDate   = t.start || t.startDate || raw.startDate || '';
  const endDate     = t.end   || t.endDate   || raw.endDate   || '';
  const deadline    = t.entryDeadline || raw.entryDeadline || '';
  const cancelDl    = t.cancelDeadline || raw.cancelDeadline || '';

  // 会場・地域
  const courseName  = t.courseName || raw.course || '';
  const place       = t.place || (typeof _PREF_MAP!=='undefined' ? _PREF_MAP[raw.prefecture]||raw.prefecture : raw.prefecture) || '';
  const country     = raw.country || t.country || '';
  const area        = raw.area || t.area || '';
  const organizer   = t.organizer || raw.organizer || '';

  // 賞金
  const prize       = t.prize || raw.prize || '';
  const prizeWinner = t.prizeWinner || raw.prizeWinner || raw.winnerPrize || '';
  const entryFee    = t.entryFee || raw.entryFee || '';
  const pracFee     = t.practiceRoundFee || raw.practiceRoundFee || raw.practiceFee || '';

  // エントリー
  const entryMethod  = t.entryMethod || raw.entryMethod || '';
  const qualification= t.qualification || raw.qualification || '';
  const capacity     = t.capacity || raw.capacity || '';

  // URL（flat / raw.links 両方対応）
  const links = raw.links || {};
  const officialUrl = t.officialUrl || links.website || links.official || '';
  const igUrl       = t.igUrl       || links.instagram || '';
  const entryUrl    = t.entryUrl    || links.entry || '';
  const pairUrl     = t.pairUrl     || links.pairing || links.pairs || '';
  const resultUrl   = t.resultUrl   || links.result || links.results || '';

  const notes       = raw.notes || t.notes || '';

  // お気に入り・カレンダー状態
  const isFav = (typeof FavoritesDB!=='undefined' ? FavoritesDB.has(id) : false)
             || (typeof favTournaments!=='undefined' && favTournaments.has(id));
  const isAdded = typeof addedIds!=='undefined' && addedIds.has(id);

  /* ── ① ヘッダー更新 ── */
  const titleEl = document.getElementById('tdm-title');
  if(titleEl) titleEl.textContent = name;

  const catRowEl = document.getElementById('tdm-cat-row');
  if(catRowEl) catRowEl.innerHTML = `
    <span class="t-cat-badge" style="background:${catColor}18;color:${catColor};border:1px solid ${catColor}40;font-size:10px;padding:3px 9px;">${_e(catLabel)}</span>
    ${genderLabel?`<span class="t-gender-badge ${t.gender||raw.gender||''}" style="font-size:10px;">${genderLabel}</span>`:''}
  `;

  /* ── ② アクションボタン（既存の tdm-actions をリセット） ── */
  const actEl = document.getElementById('tdm-actions');
  if(actEl) actEl.innerHTML = '';  // 旧ボタンを消去（新フッターで代替）

  /* ── ③ tdm-scroll を完全再描画 ── */
  const scrollEl = document.getElementById('tdm-scroll');
  if(!scrollEl) return;
  scrollEl.scrollTop = 0;

  /* --- ステータスバー --- */
  const stBar = `
    <div class="tdmv2-status-bar">
      <span class="tdmv2-st-badge ${stDef.cls}">
        ${stDef.dot?'<span class="tdmv2-st-dot"></span>':''}
        ${stDef.label}
      </span>
      ${catLabel?`<span style="font-size:11px;color:var(--text-tertiary);">／ ${_e(catLabel)}</span>`:''}
    </div>`;

  /* --- 賞金ヒーロー（ある時だけ） --- */
  let prizeHero = '';
  if(prize||prizeWinner){
    prizeHero = `<div class="tdmv2-prize-hero">
      ${prize?`<div class="tdmv2-prize-box">
        <div class="tdmv2-prize-label">賞金総額</div>
        <div class="tdmv2-prize-value">${_e(prize)}</div>
      </div>`:''}
      ${prizeWinner?`<div class="tdmv2-prize-box">
        <div class="tdmv2-prize-label">優勝賞金</div>
        <div class="tdmv2-prize-value">${_e(prizeWinner)}</div>
      </div>`:''}
    </div>`;
  }

  /* --- 基本情報カード --- */
  // 日付文字列組み立て
  const dateVal = startDate
    ? `${_fmt(startDate)||startDate}${endDate&&endDate!==startDate?' 〜<br>'+(_fmt(endDate)||endDate):''}` : null;

  // 締切日表示（残日数付き）
  let dlVal = null, dlCls = '';
  if(deadline){
    const days = Math.round((new Date(deadline)-new Date(new Date().toISOString().slice(0,10)))/86400000);
    dlCls = _dlClass(deadline);
    dlVal = (_fmt(deadline)||deadline) + (days>=0&&days<=14 ? `<br><span style="font-size:11px;font-weight:700;">${days===0?'今日締切':days+'日後'}</span>` : '');
  }

  // 会場名（Google Maps リンク付き）
  let courseVal = null;
  if(courseName){
    const q = encodeURIComponent(courseName + (place?' '+place:''));
    const mapUrl = /iphone|ipad|ipod/i.test(navigator.userAgent)
      ? `maps://?q=${q}`
      : `https://www.google.com/maps/search/?api=1&query=${q}`;
    courseVal = `<a class="tdmv2-map-link" href="${mapUrl}" target="_blank" rel="noopener">
      ${_e(courseName)}
      <span style="font-size:10px;opacity:.7;">${SVG.map}</span>
    </a>`;
  }

  const basicCard = `
    <div class="tdmv2-section-hdr"><div class="tdmv2-section-label">開催情報</div></div>
    <div class="tdmv2-card">
      ${_row('cal',   '開催日',   dateVal, '')}
      ${deadline ? `<div class="tdmv2-row">
        <div class="tdmv2-row-icon" style="background:#FFF3E0;"><svg width="15" height="15" viewBox="0 0 22 22" fill="none" style="color:#A05800;">${SVG.clock.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</svg></div>
        <div class="tdmv2-row-label">エントリー<br>締切</div>
        <div class="tdmv2-row-value${dlCls?' '+dlCls:''}">${dlVal}</div>
      </div>` : _row('clock', 'エントリー<br>締切', null, '')}
      ${cancelDl ? _row('cancel', 'キャンセル<br>締切', _fmt(cancelDl)||cancelDl, '') : ''}
      ${courseVal ? `<div class="tdmv2-row">
        <div class="tdmv2-row-icon" style="background:#E8F5EE;"><svg width="15" height="15" viewBox="0 0 22 22" fill="none" style="color:#0B7A44;">${SVG.golf.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</svg></div>
        <div class="tdmv2-row-label">ゴルフ場</div>
        <div class="tdmv2-row-value">${courseVal}</div>
      </div>` : _row('golf', 'ゴルフ場', courseName||null, '')}
      ${place ? _row('pin',   '開催地',   `${_e(place)}${country&&country!=='japan'?' / '+_e(country):''}`, '') : ''}
      ${organizer ? _row('org', '主催',  _e(organizer), '') : ''}
    </div>`;

  /* --- 費用カード --- */
  let costCard = '';
  if(entryFee||pracFee){
    costCard = `
      <div class="tdmv2-section-hdr"><div class="tdmv2-section-label">費用</div></div>
      <div class="tdmv2-card">
        ${entryFee  ? _row('money',  '参加費',         _e(entryFee), '')  : ''}
        ${pracFee   ? _row('money',  '練習ラウンド費', _e(pracFee),  '')  : ''}
      </div>`;
  }

  /* --- エントリーカード --- */
  let entryCard = '';
  if(entryMethod||qualification||capacity){
    entryCard = `
      <div class="tdmv2-section-hdr"><div class="tdmv2-section-label">エントリー情報</div></div>
      <div class="tdmv2-card">
        ${entryMethod   ? _row('doc',    'エントリー<br>方法',   _e(entryMethod),   '') : ''}
        ${qualification ? _row('user',   '出場資格',             _e(qualification), '') : ''}
        ${capacity      ? _row('num',    '定員',                 _e(capacity),      '') : ''}
      </div>`;
  }

  /* --- リンクグリッド --- */
  const linkGrid = `
    <div class="tdmv2-section-hdr"><div class="tdmv2-section-label">リンク</div></div>
    <div class="tdmv2-link-grid">
      ${_linkBtn(officialUrl, '公式サイト',       'globe', '#F0F0F8', '#5060A0', '公式サイトへ')}
      ${_linkBtn(igUrl,       'Instagram',        'ig',    '#FFF0F6', '#C060A0', 'Instagramへ')}
      ${_linkBtn(entryUrl,    'エントリー',       'entry', '#E8F8EE', '#0B7A44', 'エントリーへ')}
      ${_linkBtn(pairUrl,     '組み合わせ',       'doc',   '#EAF0FB', '#2D7DD2', 'ペアリングへ')}
      ${_linkBtn(resultUrl,   '結果速報',         'trophy','#FFF8E0', '#8A6800', '結果ページへ')}
      ${_linkBtn(pairUrl||resultUrl ? '' : null, '情報URL', 'globe', '#F0F0F8', '#5060A0', null)}
    </div>`;
  // 上の最後の冗長ボタンを除去（pairUrl/resultUrlがある場合は5個、ない場合は空白になるのを防ぐ）
  // → シンプルに5ボタンで構成
  const linkGridFinal = `
    <div class="tdmv2-section-hdr"><div class="tdmv2-section-label">リンク</div></div>
    <div class="tdmv2-link-grid">
      ${_linkBtn(officialUrl, '公式サイト',  'globe', '#F0F0F8', '#5060A0', '公式サイトへ')}
      ${_linkBtn(igUrl,       'Instagram',   'ig',    '#FFF0F6', '#C060A0', 'Instagramへ')}
      ${_linkBtn(entryUrl,    'エントリー',  'entry', '#E8F8EE', '#0B7A44', 'エントリーへ')}
      ${_linkBtn(pairUrl,     '組み合わせ',  'doc',   '#EAF0FB', '#2D7DD2', 'ペアリングへ')}
      ${_linkBtn(resultUrl,   '結果速報',    'trophy','#FFF8E0', '#8A6800', '結果ページへ')}
    </div>`;

  /* --- メモ --- */
  const notesHtml = notes
    ? `<div class="tdmv2-notes">📝 ${_e(notes)}</div>` : '';

  /* --- 全体組み立て --- */
  scrollEl.innerHTML = `
    ${stBar}
    <div style="height:10px;"></div>
    ${prizeHero}
    ${basicCard}
    ${costCard}
    ${entryCard}
    ${linkGridFinal}
    ${notesHtml}
    <div class="tdmv2-bottom-pad"></div>
  `;

  /* ── ④ フッター置き換え ── */
  _tdmRenderFooter(t, {isFav, isAdded, entryUrl, id});
};

/* ── フッター描画 ── */
function _tdmRenderFooter(t, {isFav, isAdded, entryUrl, id}){
  let footerEl = document.getElementById('tdm-footer');

  // 既存フッターを新デザインに置き換え（初回のみクラス付与）
  if(!footerEl) return;

  footerEl.innerHTML = `
    <div class="tdmv2-footer-row">
      <button class="tdmv2-btn-cal${isAdded?' added':''}" id="tdmv2-btn-cal" onclick="_tdmV2Cal()">
        <svg width="15" height="15" viewBox="0 0 22 22" fill="none"><rect x="3" y="4" width="16" height="15" rx="2.5" stroke="currentColor" stroke-width="1.7"/><line x1="7" y1="2" x2="7" y2="6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><line x1="15" y1="2" x2="15" y2="6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><line x1="3" y1="9" x2="19" y2="9" stroke="currentColor" stroke-width="1.7"/></svg>
        ${isAdded?'追加済み':'カレンダーへ'}
      </button>
      ${entryUrl
        ? `<a class="tdmv2-btn-entry" href="${_e(entryUrl)}" target="_blank" rel="noopener noreferrer">
             <svg width="14" height="14" viewBox="0 0 22 22" fill="none"><path d="M14 3H18a1 1 0 011 1v15a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h4" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/><path d="M9 11l2 2 4-4" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><rect x="8" y="1" width="6" height="4" rx="1" stroke="#fff" stroke-width="1.7"/></svg>
             エントリーへ
           </a>`
        : `<button class="tdmv2-btn-entry disabled" onclick="showToast('エントリーURLは未設定です')">
             エントリー（未設定）
           </button>`
      }
      <button class="tdmv2-btn-fav${isFav?' faved':''}" id="tdmv2-btn-fav" onclick="_tdmV2Fav()" aria-label="お気に入り">
        ${isFav?'★':'☆'}
      </button>
    </div>`;

  footerEl.style.padding=''; // 旧スタイルリセット
  footerEl.style.border='';
}

/* ── フッターボタン処理 ── */
window._tdmV2Cal = function(){
  if(!_tdmCurrentId) return;
  toggleSearchAdd(_tdmCurrentId);
  const added = addedIds.has(_tdmCurrentId);
  const btn = document.getElementById('tdmv2-btn-cal');
  if(btn){ btn.textContent = added?'追加済み':'カレンダーへ'; btn.classList.toggle('added',added); }
  if(typeof showToast==='function') showToast(added?'✅ カレンダーに追加しました':'カレンダーから削除しました');
};
window._tdmV2Fav = async function(){
  if(!_tdmCurrentId) return;
  await toggleFavTournament(_tdmCurrentId);
  const isFav = (typeof FavoritesDB!=='undefined' ? FavoritesDB.has(_tdmCurrentId) : false)
             || (typeof favTournaments!=='undefined' && favTournaments.has(_tdmCurrentId));
  const btn = document.getElementById('tdmv2-btn-fav');
  if(btn){ btn.textContent = isFav?'★':'☆'; btn.classList.toggle('faved',isFav); }
};

/* ── 既存 _tdmToggleFav も新版に同期 ── */
window._tdmToggleFav = window._tdmV2Fav;

console.info(
  '%c[TDM v2]%c 大会詳細モーダル 強化版 適用済み',
  'background:#39C892;color:#fff;padding:1px 6px;border-radius:3px;font-weight:700;',
  'color:#1A6640;font-weight:600;'
);

})();
'use strict';

// ================================================================
// § 1  TextCleaner — HTML→テキスト変換 + ノイズ除去
//      実際の regex で動作する（コメントではない）
// ================================================================
const TextCleaner = (function() {

  // ── 除去対象パターン ──
  // スポンサー・広告ブロックを識別するキーワード
  const SPONSOR_RE = /^.{0,30}(協賛|スポンサー|提供|Sponsored|広告|AD|PR|【PR】|【広告】).{0,30}$/gim;

  // SNS埋め込みテキスト
  const SNS_RE = /^.*(twitter|instagram|facebook|#[^\s]{1,30}|@[^\s]{1,30}|いいね|シェア|フォロー|リツイート|DM|dm).{0,50}$/gim;

  // フッター・ナビゲーション的な行
  const FOOTER_RE = /^.{0,40}(Copyright|©|プライバシーポリシー|利用規約|サイトマップ|お問い合わせ|アクセス|会社概要|採用情報|ホーム|トップ|メニュー|閉じる|戻る).{0,40}$/gim;

  // ニュース記事的ノイズ（大会情報でない）
  const NEWS_NOISE_RE = /^.{0,20}(関連記事|おすすめ|新着|最新|人気|READ MORE|続きを読む|もっと見る).{0,30}$/gim;

  // 連続する記号・罫線
  const RULE_LINE_RE = /^[━─=\-＝~〜*＊・。、]{3,}$/gm;

  // 空行の過剰な連続
  const EXCESS_NEWLINE_RE = /\n{3,}/g;

  // DOMParser でテキスト抽出（ゴルフ大会情報を優先）
  function _domExtract(html) {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // 除去タグ
      ['script','style','nav','footer','header','aside','noscript','iframe',
       '[class*="sponsor"]','[class*="ad-"]','[id*="ad"]','[class*="banner"]',
       '[class*="related"]','[class*="recommend"]','[class*="popular"]',
       '[class*="sns"]','[class*="share"]','[class*="cookie"]',
       '[class*="breadcrumb"]','[class*="pagenav"]',
      ].forEach(sel => {
        try { doc.querySelectorAll(sel).forEach(el => el.remove()); } catch {}
      });

      // 大会情報を含む要素を優先抽出
      const PRIORITY = [
        'main','article',
        '[class*="tournament"]','[class*="event"]','[class*="taikai"]',
        '[class*="detail"]','[class*="info"]','[class*="outline"]',
        '[class*="schedule"]','[class*="entry"]','[class*="contents"]',
        'table','dl','ul','ol','h1','h2','h3','h4','p',
      ];
      let priority = '';
      for (const sel of PRIORITY) {
        try {
          doc.querySelectorAll(sel).forEach(el => {
            const t = el.innerText || el.textContent || '';
            if (t.trim()) priority += t + '\n';
          });
        } catch {}
      }

      const body = doc.body?.innerText || doc.body?.textContent || '';
      return priority || body;
    } catch {
      // DOMParser 失敗時は正規表現でフォールバック
      return html.replace(/<[^>]+>/g, ' ');
    }
  }

  return {
    /**
     * clean(html, limit) → { text, charsBefore, charsAfter, linesAfter }
     * HTML から大会情報に関係するテキストのみを抽出し、ノイズを除去する。
     * 実際の regex で処理が行われる。
     */
    clean(html, limit = 7000) {
      if (!html) return { text: '', charsBefore: 0, charsAfter: 0, linesAfter: 0 };

      const charsBefore = html.length;

      // ① DOMParser でテキスト抽出
      let text = _domExtract(html);

      // ② スペース・タブを正規化
      text = text.replace(/[ \t]{2,}/g, ' ');

      // ③ スポンサー行を除去（実regex）
      const beforeSponsor = text.length;
      text = text.replace(SPONSOR_RE, '');

      // ④ SNS埋め込み行を除去（実regex）
      text = text.replace(SNS_RE, '');

      // ⑤ フッター・ナビゲーション行を除去（実regex）
      text = text.replace(FOOTER_RE, '');

      // ⑥ ニュースノイズを除去（実regex）
      text = text.replace(NEWS_NOISE_RE, '');

      // ⑦ 罫線行を除去（実regex）
      text = text.replace(RULE_LINE_RE, '');

      // ⑧ 過剰な空行を圧縮
      text = text.replace(EXCESS_NEWLINE_RE, '\n\n').trim();

      const noiseRemoved = beforeSponsor - text.length;
      const charsAfter   = Math.min(text.length, limit);
      const linesAfter   = text.slice(0, limit).split('\n').length;

      return {
        text:          text.slice(0, limit),
        charsBefore,
        charsAfter,
        linesAfter,
        noiseRemoved:  Math.max(0, noiseRemoved),
      };
    },
  };
})();


// ================================================================
// § 2  DateNormalizer — 日本語日付を YYYY-MM-DD に正規化
//      実際の regex で令和/各種フォーマットを変換する
// ================================================================
const DateNormalizer = (function() {

  // 令和対応（令和元年 = 2019年）
  const REIWA_OFFSET = 2018;
  // 平成対応
  const HEISEI_OFFSET = 1988;
  // 昭和対応
  const SHOWA_OFFSET = 1925;

  // 現在年（年が不明なフォールバック）
  const CURRENT_YEAR = 2026;

  // ── 変換マップ（月名） ──
  const MONTH_MAP = {
    '1月':'01','2月':'02','3月':'03','4月':'04','5月':'05','6月':'06',
    '7月':'07','8月':'08','9月':'09','10月':'10','11月':'11','12月':'12',
  };

  /** 和暦年 → 西暦に変換 */
  function _eraToWestern(era, year) {
    const y = parseInt(year, 10);
    switch(era) {
      case '令和': case 'R': case 'r': return REIWA_OFFSET + y;
      case '平成': case 'H': case 'h': return HEISEI_OFFSET + y;
      case '昭和': case 'S': case 's': return SHOWA_OFFSET  + y;
      default: return y;
    }
  }

  /** 月日を 2桁にゼロパディング */
  function _pad(n) { return String(n).padStart(2, '0'); }

  /** YYYY-MM-DD として有効かチェック */
  function _isValid(y, m, d) {
    if (y < 1990 || y > 2040) return false;
    if (m < 1 || m > 12)      return false;
    if (d < 1 || d > 31)      return false;
    return true;
  }

  /** 文字列から YYYY-MM-DD を生成（無効なら null） */
  function _make(y, m, d) {
    const yi = parseInt(y, 10);
    const mi = parseInt(m, 10);
    const di = parseInt(d, 10);
    if (!_isValid(yi, mi, di)) return null;
    return `${yi}-${_pad(mi)}-${_pad(di)}`;
  }

  return {
    /**
     * normalize(text) → { normalized: string, map: {before→after} }
     *
     * テキスト内の全日付表現を YYYY-MM-DD に変換して置換した文字列を返す。
     * map には実際に変換した箇所が記録される。
     */
    normalize(text) {
      if (!text) return { normalized: text, map: {} };

      let result = text;
      const map  = {};

      // ① 令和/平成/昭和 + 年月日（例: 令和8年5月10日, R8.5.10, R8/5/10）
      result = result.replace(
        /(令和|平成|昭和|[RrHhSs])(\d{1,2})[年.](\d{1,2})[月./](\d{1,2})日?/g,
        (orig, era, y, m, d) => {
          const westernY = _eraToWestern(era, y);
          const date = _make(westernY, m, d);
          if (date) { map[orig] = date; return date; }
          return orig;
        }
      );

      // ② YYYY年M月D日
      result = result.replace(
        /(\d{4})年(\d{1,2})月(\d{1,2})日/g,
        (orig, y, m, d) => {
          const date = _make(y, m, d);
          if (date) { map[orig] = date; return date; }
          return orig;
        }
      );

      // ③ YYYY.MM.DD / YYYY/MM/DD（既にダッシュ区切りでないもの）
      result = result.replace(
        /(\d{4})[./](\d{1,2})[./](\d{1,2})(?!\d)/g,
        (orig, y, m, d) => {
          const date = _make(y, m, d);
          if (date) { map[orig] = date; return date; }
          return orig;
        }
      );

      // ④ M月D日（年なし）→ CURRENT_YEAR を補完
      result = result.replace(
        /(\d{1,2})月(\d{1,2})日/g,
        (orig, m, d) => {
          const date = _make(CURRENT_YEAR, m, d);
          if (date) { map[orig] = date; return date; }
          return orig;
        }
      );

      // ⑤ M/D 形式（年なし、例: 5/10）
      // 文脈上日付と判断できるもの（前後が数字でない）
      result = result.replace(
        /(?<!\d)(\d{1,2})\/(\d{1,2})(?!\d)/g,
        (orig, m, d) => {
          // 月として妥当な範囲のみ変換
          if (parseInt(m,10) > 12 || parseInt(d,10) > 31) return orig;
          const date = _make(CURRENT_YEAR, m, d);
          if (date) { map[orig] = date; return date; }
          return orig;
        }
      );

      return { normalized: result, map };
    },
  };
})();


// ================================================================
// § 3  ConfidenceCalculator — 実際のスコア計算
//      AIが返した各フィールドの充足度 + テキスト品質で算出
// ================================================================
const ConfidenceCalculator = (function() {

  // フィールドごとの重み
  const FIELD_WEIGHTS = {
    name:          0.25,
    start:         0.20,
    place:         0.15,
    entryDeadline: 0.10,
    category:      0.10,
    prizeOrFee:    0.10,  // prize または entryFee のどちらかがあれば
    prefecture:    0.05,
    organizer:     0.05,
  };

  // 日付として妥当な文字列か
  function _isDate(v) { return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v); }

  // 値が「ある」と見なせるか
  function _has(v) { return v !== null && v !== undefined && String(v).trim().length > 0; }

  return {
    /**
     * score(ai, rawText) → { total: 0.00, breakdown: {...} }
     *
     * ai: Claude API が返した JSON オブジェクト
     * rawText: クリーニング後のテキスト（品質評価用）
     */
    score(ai, rawText) {
      const breakdown = {};
      let total = 0;

      // ── フィールドスコア ──
      if (_has(ai.name)) {
        breakdown.name = FIELD_WEIGHTS.name;
        total += FIELD_WEIGHTS.name;
      }
      if (_isDate(ai.start)) {
        breakdown.start = FIELD_WEIGHTS.start;
        total += FIELD_WEIGHTS.start;
      }
      if (_has(ai.place)) {
        breakdown.place = FIELD_WEIGHTS.place;
        total += FIELD_WEIGHTS.place;
      }
      if (_isDate(ai.entryDeadline)) {
        breakdown.entryDeadline = FIELD_WEIGHTS.entryDeadline;
        total += FIELD_WEIGHTS.entryDeadline;
      }
      if (_has(ai.category)) {
        breakdown.category = FIELD_WEIGHTS.category;
        total += FIELD_WEIGHTS.category;
      }
      if (_has(ai.prize) || _has(ai.entryFee)) {
        breakdown.prizeOrFee = FIELD_WEIGHTS.prizeOrFee;
        total += FIELD_WEIGHTS.prizeOrFee;
      }
      if (_has(ai.prefecture)) {
        breakdown.prefecture = FIELD_WEIGHTS.prefecture;
        total += FIELD_WEIGHTS.prefecture;
      }
      if (_has(ai.organizer)) {
        breakdown.organizer = FIELD_WEIGHTS.organizer;
        total += FIELD_WEIGHTS.organizer;
      }

      // ── ペナルティ ──
      const textLen = (rawText || '').replace(/\s/g, '').length;

      // テキストが少ない（画像PDF・取得失敗）
      if (textLen < 100) {
        breakdown._penalty_noText = -0.35;
        total -= 0.35;
      } else if (textLen < 500) {
        breakdown._penalty_shortText = -0.20;
        total -= 0.20;
      }

      // URLのみで推測（pageText がない = 'URLから推測'フラグ）
      if (!rawText || rawText.includes('ページテキスト取得失敗') || rawText.includes('URLから大会情報を推測')) {
        breakdown._penalty_urlOnly = -0.30;
        total -= 0.30;
      }

      // start があるが end がない（大会期間不明）
      if (_isDate(ai.start) && !_isDate(ai.end)) {
        breakdown._penalty_noEnd = -0.03;
        total -= 0.03;
      }

      // AI自身の confidence が著しく低い場合
      if (typeof ai.confidence === 'number' && ai.confidence < 0.3) {
        breakdown._penalty_aiLowConf = -0.10;
        total -= 0.10;
      }

      // ── 0.0〜1.0 にクランプ ──
      total = Math.max(0, Math.min(1, total));
      total = Math.round(total * 100) / 100;

      return { total, breakdown };
    },
  };
})();


// ================================================================
// § 4  AiUrlParser — 完全版（実ロジックをパイプラインに組み込み）
// ================================================================
class AiUrlParser {

  static API_ROUTE  = '/api/parseTournament';
  static TEXT_LIMIT = 7000;
  static TIMEOUT_MS = 42_000;

  static PROXIES = [
    u => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
    u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  ];

  // カテゴリ自動判定ルール
  static CAT_RULES = [
    { re:/jlpga\.or\.jp|jlpga\.com|\bjlpga\b|ladiesgolf|日本女子プロゴルフ/i, cat:'jlpga',       gender:'womens' },
    { re:/stepup|step.up|ステップアップツアー/i,                               cat:'stepup',      gender:'womens' },
    { re:/qt.*wom|qualifier.*women|クォリファイング.*女子/i,                    cat:'qt_w',        gender:'womens' },
    { re:/jgto\.or\.jp|jgto\.com|\bjgto\b|ジャパンゴルフツアー機構/i,          cat:'jgto',        gender:'mens'   },
    { re:/jpga\.or\.jp|\bjpga\b|日本プロゴルフ協会/i,                           cat:'jpga',        gender:'mens'   },
    { re:/acntour|acn.tour/i,                                                  cat:'acn',         gender:'mens'   },
    { re:/senior|シニアツアー|シニア選手権/i,                                  cat:'senior',      gender:'mens'   },
    { re:/クォリファイングトーナメント|\bqt\b(?!.*w)/i,                        cat:'qt',          gender:'mens'   },
    { re:/atp.golf|atpgolf/i,                                                  cat:'atp_golf',    gender:'mens'   },
    { re:/fj.tour|fjtour/i,                                                    cat:'fj_tour',     gender:'mens'   },
    { re:/future.tour/i,                                                       cat:'future',      gender:'mens'   },
    { re:/speeder|スピーダー/i,                                                cat:'speeder',     gender:'mens'   },
    { re:/県オープン|pref.open|地区オープン/i,                                 cat:'pref_open',   gender:'mens'   },
    { re:/有名オープン|famous.open/i,                                          cat:'famous_open', gender:'mens'   },
    { re:/地方オープン|local.open/i,                                           cat:'local_open',  gender:'mens'   },
    { re:/オープン|open/i,                                                     cat:'open',        gender:'mens'   },
    { re:/pgatour\.com|pga\.com/i,                                             cat:'pga',         gender:'mens', region:'overseas' },
    { re:/kornferry|korn.ferry/i,                                              cat:'korn_ferry',  gender:'mens', region:'overseas' },
    { re:/europeantour|dp.world/i,                                             cat:'dp_world',    gender:'mens', region:'overseas' },
    { re:/asiantour|アジアンツアー/i,                                          cat:'asian_tour',  gender:'mens', region:'overseas' },
    { re:/livgolf|liv.golf/i,                                                  cat:'liv',         gender:'mens', region:'overseas' },
  ];

  /* ── HTML フェッチ ── */
  static async fetchHtml(url) {
    let lastErr;
    for (const mk of this.PROXIES) {
      try {
        const res = await fetch(mk(url), { signal: AbortSignal.timeout(14000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const html = json.contents || json.body || json.html || '';
        if (html) return html;
      } catch(e) { lastErr = e; }
    }
    console.warn('[AIP] HTML取得失敗:', lastErr?.message || '不明');
    return '';
  }

  /* ── Vercel Function へ POST ── */
  static async callApi(pageText, sourceUrl, hint) {
    let res;
    try {
      res = await fetch(this.API_ROUTE, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pageText, sourceUrl, hint: hint || '' }),
        signal:  AbortSignal.timeout(this.TIMEOUT_MS),
      });
    } catch(e) {
      throw new Error('サーバーへの接続に失敗: ' + (e.message || '不明'));
    }
    let body;
    try { body = await res.json(); } catch { throw new Error(`サーバーエラー HTTP ${res.status}`); }
    if (!res.ok || !body.ok) throw new Error(body.error || `サーバーエラー HTTP ${res.status}`);
    return body.data;
  }

  /* ── カテゴリ自動判定 ── */
  static detectCategory(url, title = '') {
    const hay = url + ' ' + title;
    for (const rule of this.CAT_RULES) {
      if (rule.re.test(hay)) {
        return { cat: rule.cat, gender: rule.gender || 'mens', region: rule.region || 'domestic' };
      }
    }
    return { cat:'', gender:'mens', region:'domestic' };
  }

  static _resolveCategory(aiCat, urlCat) {
    if (typeof CAT_LABELS !== 'undefined') {
      if (aiCat  && CAT_LABELS[aiCat])  return aiCat;
      if (urlCat && CAT_LABELS[urlCat]) return urlCat;
    }
    return aiCat || urlCat || '';
  }

  /* ================================================================
     parse(url, onStep) — 実ロジックを組み込んだパイプライン
     ================================================================ */
  static async parse(url, onStep = () => {}) {
    const s = (k, st) => { try { onStep(k, st); } catch {} };

    // ── STEP 1: HTML フェッチ ──
    s('fetch', 'active');
    const rawHtml = await this.fetchHtml(url);
    s('fetch', rawHtml ? 'done' : 'err');

    // ── STEP 2: テキストクリーニング（実ロジック実行） ──
    s('parse', 'active');
    const cleaned = TextCleaner.clean(rawHtml, this.TEXT_LIMIT);

    console.log(
      `[AI] cleaned text: ${cleaned.charsAfter} chars, ${cleaned.linesAfter} lines` +
      ` (original: ${cleaned.charsBefore} chars, noise removed: ${cleaned.noiseRemoved} chars)`
    );

    // ── 日付正規化（実regex実行） ──
    const dateResult = DateNormalizer.normalize(cleaned.text);
    const dateMapKeys = Object.keys(dateResult.map);
    if (dateMapKeys.length > 0) {
      console.log('[AI] normalized dates:', dateResult.map);
    } else {
      console.log('[AI] normalized dates: (none found in text)');
    }

    const pageText = dateResult.normalized;
    s('parse', 'done');

    // ── STEP 2-b: DOM インデックス生成 + regex 候補値事前抽出（AI精度向上） ──
    // rawHtml から DOM 位置スコアマップを構築し extractCandidates に渡す
    const domIndex  = this._buildDomIndex(rawHtml);
    const candidates = this.extractCandidates(pageText, domIndex);

    // ── STEP 2-c: 構造化データ解析（JSON-LD / schema.org） ──
    const structured = this.extractStructuredData(rawHtml);

    // ── STEP 3: Claude AI 解析 ──
    s('ai', 'active');

    // hint に候補値を追記（parseTournament の userContent に自動挿入される）
    let hint = '';
    try { hint = 'ドメイン: ' + new URL(url).hostname; } catch {}

    // 候補値をスコア順に整形して hint へ追記（bestCandidate を先頭に優先表示）
    const _fmt = (arr, label) => {
      if (!arr.length) return null;
      const best   = arr[0];
      const others = arr.slice(1).map(c => c.value).join(' / ');
      // totalScore = candidateScore + domScore
      const total  = (best.totalScore !== undefined) ? best.totalScore
                                                      : best.score;
      const domStr = (best.domScore > 0) ? `+dom:${best.domScore}` : '';
      const line   = `【${label}★ベスト】${best.value}(信頼度:${total}${domStr})`
                   + (others ? ` / 他: ${others}` : '');
      return line;
    };
    const _hintLines = [
      _fmt(candidates.candidateDates,      '開催日'),
      _fmt(candidates.candidateDeadlines,  '締切'),
      _fmt(candidates.candidatePrizes,     '賞金'),
      _fmt(candidates.candidateFees,       '参加費'),
      _fmt(candidates.candidateCourses,    '会場'),
    ].filter(Boolean);
    if (_hintLines.length) {
      hint += (hint ? '\n' : '') + _hintLines.join('\n');
      console.log('[AIP:candidates] hint 追記:\n' + _hintLines.join('\n'));
    }
    // ── 構造化データを hint へ追記（score +20 として明示） ──
    if (structured.found) {
      const _sdLines = ['【構造化データ(JSON-LD) ★信頼度+20】'];
      if (structured.name)        _sdLines.push(`name: ${structured.name}`);
      if (structured.startDate)   _sdLines.push(`startDate: ${structured.startDate}`);
      if (structured.endDate)     _sdLines.push(`endDate: ${structured.endDate}`);
      if (structured.location)    _sdLines.push(`location: ${structured.location}`);
      if (structured.organizer)   _sdLines.push(`organizer: ${structured.organizer}`);
      if (structured.eventStatus) _sdLines.push(`eventStatus: ${structured.eventStatus}`);
      if (structured.url)         _sdLines.push(`url: ${structured.url}`);
      hint += (hint ? '\n' : '') + _sdLines.join('\n');
      console.log('[AIP:jsonld] hint 追記:\n' + _sdLines.join('\n'));
    }

    const ai = await this.callApi(pageText, url, hint);
    s('ai', 'done');

    // ── STEP 4: カテゴリ判定 + confidence 実計算 ──
    s('cat', 'active');

    const urlCatInfo = this.detectCategory(url, ai.name || '');
    const cat    = this._resolveCategory(ai.category, urlCatInfo.cat);
    const gender = ai.gender || urlCatInfo.gender || 'mens';
    const region = ai.region || urlCatInfo.region || 'domestic';

    // ── confidence 実スコア計算 ──
    const confResult = ConfidenceCalculator.score(ai, pageText);
    const confidence = confResult.total;

    console.log(`[AI] confidence score: ${confidence}`, confResult.breakdown);

    s('cat', 'done');

    const catColor = (typeof CAT_COLORS !== 'undefined' ? CAT_COLORS[cat] : null) || '#8090A0';
    const catLabel = (typeof CAT_LABELS !== 'undefined' ? CAT_LABELS[cat] : null) || cat;

    const result = {
      title:            ai.name             || '',
      name:             ai.name             || '',
      category:         cat,
      gender,
      region,
      area:             '',
      prefecture:       ai.prefecture        || '',
      course:           ai.place             || '',
      courseName:       ai.place             || '',
      organizer:        ai.organizer         || '',
      status:           'tbd',
      startDate:        ai.start             || null,
      endDate:          ai.end               || null,
      entryDeadline:    ai.entryDeadline     || null,
      cancelDeadline:   ai.cancelDeadline    || null,
      prize:            ai.prize             || '',
      prizeWinner:      ai.prizeWinner       || '',
      entryFee:         ai.entryFee          || '',
      practiceRoundFee: '',
      entryMethod:      ai.entryMethod       || '',
      qualification:    ai.qualification     || '',
      capacity:         ai.capacity          || '',
      notes:            ai.memo              || '',
      links: {
        website:   ai.website   || url,
        official:  ai.website   || url,
        instagram: ai.instagram || (url.includes('instagram.com') ? url : ''),
        entry:     ai.entryUrl  || '',
        pairing:   '',
        result:    '',
      },
      officialUrl:  ai.website   || url,
      igUrl:        ai.instagram || '',
      entryUrl:     ai.entryUrl  || '',
      sourceUrl:    url,
      sourceType:   'ai_url',
      parsingStatus:'success',
      aiConfidence: confidence,          // ← 実計算値を使用
      rawContent:   rawHtml.slice(0, 2000),
      extractedText:pageText.slice(0, 1000),
      metadata: {
        aiExtracted:        true,
        aiModel:            'claude-sonnet-4-20250514',
        aiExtractedAt:      new Date().toISOString(),
        sourceFormat:       'website',
        via:                'vercel-function',
        // クリーニング統計
        cleanedChars:       cleaned.charsAfter,
        originalChars:      cleaned.charsBefore,
        noiseRemovedChars:  cleaned.noiseRemoved,
        dateNormCount:      dateMapKeys.length,
        // confidence 内訳
        confidenceBreakdown:confResult.breakdown,
      },
      _catColor: catColor,
      _catLabel: catLabel,
    };

    console.log('[AI] parse complete:', {
      title:          result.title,
      category:       result.category,
      startDate:      result.startDate,
      entryDeadline:  result.entryDeadline,
      place:          result.course,
      prefecture:     result.prefecture,
      confidence:     result.aiConfidence,
    });

    return result;
  }

  /* ================================================================
     scoreDomImportance(element) — DOM 要素の位置的重要度スコア
     ================================================================
     引数:
       element — HTMLElement（DOMParser で生成したもの）

     戻り値: number  DOM位置スコア（高いほど信頼度の高い位置）

     加点テーブル:
       h1        +15   ページの最重要見出し
       h2        +10   セクション見出し
       table th  +9    テーブルヘッダー（構造化情報）
       table td  +5    テーブルセル（構造化情報）
       main 上部 +8    メインコンテンツ先頭20%
       article   +6    記事本文
       h3        +5    小見出し
       p         +2    段落

     減点テーブル:
       footer    -12   フッター
       aside     -10   サイドバー
       nav       -10   ナビゲーション
       .related  -8    関連記事
       .sns      -8    SNSブロック
       header    -3    ヘッダー（タイトル行は除外したい）
     ================================================================ */
  static scoreDomImportance(element) {
    if (!element || typeof element.tagName === 'undefined') return 0;

    const tag  = element.tagName.toLowerCase();
    const cls  = (element.className  || '').toLowerCase();
    const id   = (element.id         || '').toLowerCase();
    const attr = cls + ' ' + id;
    let score  = 0;

    // ── タグ加点 ───────────────────────────────────────────────────
    const TAG_BONUS = {
      h1: 15, h2: 10, h3: 5, h4: 3,
      'table': 4, th: 9, td: 5,
      article: 6, main: 4, section: 2, p: 2, li: 1,
    };
    score += TAG_BONUS[tag] || 0;

    // ── クラス/ID 加点 ─────────────────────────────────────────────
    if (/content|entry|post|detail|article|body/.test(attr)) score += 4;
    if (/tournament|event|competition|schedule/.test(attr))  score += 5;
    if (/main|primary|center/.test(attr))                    score += 3;

    // ── クラス/ID 減点 ─────────────────────────────────────────────
    if (/footer|foot/.test(attr))                            score -= 12;
    if (/aside|sidebar|side-bar|widget/.test(attr))          score -= 10;
    if (/nav|navigation|menu/.test(attr))                    score -= 10;
    if (/related|recommend|suggest/.test(attr))              score -= 8;
    if (/sns|social|share|twitter|facebook/.test(attr))      score -= 8;
    if (/ad|banner|sponsor|pr-/.test(attr))                  score -= 8;
    if (/header/.test(attr) && tag !== 'h1' && tag !== 'h2') score -= 3;

    // ── 祖先要素チェック（最大5階層） ─────────────────────────────
    let ancestor = element.parentElement;
    let depth    = 0;
    while (ancestor && depth < 5) {
      const at  = ancestor.tagName.toLowerCase();
      const ac  = (ancestor.className || '').toLowerCase();
      const aid = (ancestor.id        || '').toLowerCase();
      const aa  = ac + ' ' + aid;

      if (at === 'footer' || /footer|foot/.test(aa))          score -= 12;
      else if (at === 'aside' || /sidebar|widget/.test(aa))   score -= 10;
      else if (at === 'nav'   || /navigation|menu/.test(aa))  score -= 8;
      else if (/related|recommend/.test(aa))                  score -= 8;
      else if (at === 'main'  || /main|content/.test(aa))     score += 3;
      else if (at === 'article')                               score += 3;

      ancestor = ancestor.parentElement;
      depth++;
    }

    return score;
  }

  /* ================================================================
     _buildDomIndex(rawHtml) — rawHtml から DOM インデックスを構築
     ================================================================
     目的:
       extractCandidates がテキスト断片を DOM 位置と紐付けできるよう
       { text → {domScore, domPath} } のマップを生成する。

     戻り値:
       Map<string, {domScore:number, domPath:string}>
       キー = テキスト断片（最大60文字）
       値   = { domScore, domPath }

     DOMParser 非対応環境では空 Map を返す（安全フォールバック）。
     ================================================================ */
  static _buildDomIndex(rawHtml) {
    const empty = new Map();
    if (typeof DOMParser === 'undefined' || !rawHtml) return empty;

    let doc;
    try { doc = new DOMParser().parseFromString(rawHtml, 'text/html'); }
    catch(e) { console.warn('[AIP:domIndex] DOMParser失敗:', e.message); return empty; }

    const idx = new Map();
    // インデックス化する対象タグ
    const TARGET_TAGS = 'h1,h2,h3,h4,p,li,td,th,dt,dd,span,div,article,section,main';

    let count = 0;
    doc.querySelectorAll(TARGET_TAGS).forEach(el => {
      const rawText = el.textContent || '';
      const text    = rawText.replace(/\s+/g, ' ').trim();
      if (text.length < 4 || text.length > 400) return; // 短すぎ/長すぎは除外

      const domScore = this.scoreDomImportance(el);
      // domPath: "tag.class#id > tag.class" 形式（デバッグ用）
      const pathParts = [];
      let cur = el;
      let d   = 0;
      while (cur && cur.tagName && d < 4) {
        const t  = cur.tagName.toLowerCase();
        const c  = cur.className ? '.' + cur.className.split(' ')[0] : '';
        const i  = cur.id       ? '#' + cur.id                       : '';
        pathParts.unshift(`${t}${c}${i}`);
        cur = cur.parentElement;
        d++;
      }
      const domPath = pathParts.join(' > ');

      // テキスト断片をキーとして格納（先勝ち: 同キーはより高スコアで上書き）
      const existing = idx.get(text.slice(0, 60));
      if (!existing || domScore > existing.domScore) {
        idx.set(text.slice(0, 60), { domScore, domPath });
      }
      count++;
    });

    console.log(`[AIP:domIndex] ${count} 要素をインデックス化 (${idx.size} ユニークキー)`);
    return idx;
  }

  /* ================================================================
     _lookupDomScore(sourceLine, domIndex) — テキストを domIndex で照合
     ================================================================
     sourceLine の部分文字列が domIndex に含まれているか照合し、
     最もスコアの高いエントリを返す。
     ================================================================ */
  static _lookupDomScore(sourceLine, domIndex) {
    if (!domIndex || !domIndex.size || !sourceLine) {
      return { domScore: 0, domPath: '' };
    }
    let best = { domScore: 0, domPath: '' };
    // domIndex のキー（最大60文字のテキスト断片）が sourceLine に含まれるか検索
    for (const [key, entry] of domIndex) {
      if (key.length < 4) continue;
      if (sourceLine.includes(key) || key.includes(sourceLine.slice(0, 40))) {
        if (entry.domScore > best.domScore) {
          best = entry;
        }
      }
    }
    return best;
  }

  /* ================================================================
     scoreCandidate(line, type) — 候補行に優先スコアを付与
     ================================================================
     引数:
       line — 候補テキスト行（sourceLine）
       type — 'date' | 'deadline' | 'prize' | 'fee' | 'course'

     戻り値: number  スコア（高いほど信頼度が高い）

     加点テーブル（type 共通 + type 別）:
       共通加点: 開催日+10 大会日程/競技日程+8 本戦+6 決勝+5
                 エントリー締切+8 賞金総額+9 優勝賞金+7
                 参加費/エントリーフィ+7 会場名パターン+8
       共通減点: 練習日-6 予備日-5 更新日-10 問い合わせ-8
                 広告/PR-10 スポンサー-6 関連記事-8 フッター-5
                 アクセス/交通-4 駐車場-4
     ================================================================ */
  static scoreCandidate(line, type) {
    if (!line) return 0;
    let score = 0;

    // ── 共通加点 ────────────────────────────────────────────────
    const BONUS = [
      [/開催日|開催期間/,                    10],
      [/大会日程|競技日程|試合日程/,           8],
      [/本戦|本大会/,                         6],
      [/決勝|ファイナル/,                     5],
      [/エントリー締切|申込締切|応募締切/,     8],
      [/賞金総額/,                            9],
      [/優勝賞金/,                            7],
      [/参加費|エントリーフィ|エントリー費/,  7],
      [/カントリークラブ|ゴルフ倶楽部|ゴルフクラブ/, 8],
      [/CC|GC/,                       6],
      [/リンクス|LINKS/i,                     6],
      [/20\d{2}年/,                           3],  // 西暦あり = 具体的
    ];
    for (const [re, pt] of BONUS) {
      if (re.test(line)) score += pt;
    }

    // ── 共通減点 ────────────────────────────────────────────────
    const PENALTY = [
      [/練習日|練習ラウンド|プロアマ/,       -6],
      [/予備日|雨天順延|予備/,              -5],
      [/更新日|最終更新|更新:/,            -10],
      [/問い合わせ|お問合せ|問合せ/,        -8],
      [/広告|AD |PR |スポンサー/,          -10],
      [/関連記事|おすすめ記事|人気記事/,    -8],
      [/フッター|footer|サイトマップ/i,     -5],
      [/アクセス|交通|駐車場|会場へのアクセス/, -4],
      [/copyright|©/i,                     -6],
      [/クッキー|cookie/i,                 -6],
      [/twitter|facebook|instagram|sns/i,  -5],
    ];
    for (const [re, pt] of PENALTY) {
      if (re.test(line)) score += pt;
    }

    // ── type 別 追加加点 ────────────────────────────────────────
    if (type === 'date') {
      if (/開催日|競技日程|大会日程/.test(line)) score += 5;
      if (/第\d+回|第[一二三四五六七八九十]+回/.test(line)) score += 3; // 回数あり
    }
    if (type === 'deadline') {
      if (/締切日?[:：]|締め切り日?[:：]/.test(line)) score += 5;
      if (/キャンセル|辞退/.test(line)) score -= 3; // キャンセル締切は別物
    }
    if (type === 'prize') {
      if (/総額.*円|円.*総額/.test(line)) score += 4;
      if (/万円/.test(line)) score += 3;
    }
    if (type === 'fee') {
      if (/円\/人|円\/名|名あたり/.test(line)) score += 3;
      if (/税込|税抜|消費税/.test(line)) score += 2;
    }
    if (type === 'course') {
      if (/カントリークラブ|ゴルフ倶楽部/.test(line)) score += 4;
      if (/都|道|府|県/.test(line)) score += 2; // 都道府県名あり
    }

    return score;
  }

  /* ================================================================
     _normalizeDateKey(str) — 日付文字列を YYYY-MM-DD キーに正規化
     重複統合に使用。変換不能な場合は元文字列をそのまま返す。
     ================================================================ */
  static _normalizeDateKey(str) {
    if (!str) return str;
    const s = str.trim();

    // 令和→西暦変換
    const reiwa = s.match(/(?:令和|R)\s*(\d{1,2})[年.]?\s*(\d{1,2})[月.]?\s*(\d{1,2})/);
    if (reiwa) {
      const y = 2018 + parseInt(reiwa[1], 10);
      const mo = reiwa[2].padStart(2, '0');
      const d  = reiwa[3].padStart(2, '0');
      return `${y}-${mo}-${d}`;
    }
    // YYYY年MM月DD日
    const ymd1 = s.match(/(20\d{2})年\s*(\d{1,2})月\s*(\d{1,2})日/);
    if (ymd1) return `${ymd1[1]}-${ymd1[2].padStart(2,'0')}-${ymd1[3].padStart(2,'0')}`;
    // YYYY.MM.DD / YYYY-MM-DD / YYYY/MM/DD
    const ymd2 = s.match(/(20\d{2})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
    if (ymd2) return `${ymd2[1]}-${ymd2[2].padStart(2,'0')}-${ymd2[3].padStart(2,'0')}`;
    // MM月DD日（年なし → 2026 仮定）
    const md = s.match(/(\d{1,2})月\s*(\d{1,2})日/);
    if (md) return `2026-${md[1].padStart(2,'0')}-${md[2].padStart(2,'0')}`;

    return s; // 変換不能はそのまま
  }

  /* ================================================================
     extractCandidates(text) — regex + スコアリングによる候補値抽出
     ================================================================
     戻り値の構造（各配列の要素）:
       { value: string, score: number, sourceLine: string }
     bestCandidate: 最高スコアの要素（または null）
     ================================================================ */
  /* ================================================================
     extractCandidates(text, domIndex) — regex + DOM スコアによる候補値抽出
     ================================================================
     引数:
       text     — TextCleaner + DateNormalizer 後の平文テキスト
       domIndex — _buildDomIndex() で生成した Map（省略可）

     戻り値の各配列要素:
       { value, score, sourceLine, domScore, domPath }
       ※ score     = candidateScore（テキストベース）
          domScore  = DOM位置スコア
          最終信頼度 = score + domScore
     ================================================================ */
  static extractCandidates(text, domIndex = new Map()) {

    if (!text || typeof text !== 'string') {
      return {
        candidateDates:[], candidateDeadlines:[],
        candidatePrizes:[], candidateFees:[], candidateCourses:[]
      };
    }

    /* ── 内部ヘルパー: domIndex 照合付きスコアリング→ソート ─── */
    const _rank = (items, type) =>
      items
        .map(({ value, sourceLine }) => {
          const textScore = this.scoreCandidate(sourceLine, type);
          const { domScore, domPath } = this._lookupDomScore(sourceLine, domIndex);
          return {
            value,
            sourceLine,
            score:    textScore,          // テキストスコア（単独参照用）
            domScore,                     // DOM位置スコア
            domPath,                      // DOM パス（デバッグ用）
            totalScore: textScore + domScore,  // 最終スコア（ソートキー）
          };
        })
        .sort((a, b) => b.totalScore - a.totalScore);

    /* ── ① 開催日（日付正規化キーで重複統合） ──────────────── */
    const _dateMap = new Map();
    const DATE_PATTERNS = [
      /(?:令和|R)\s*\d{1,2}[年.]\s*\d{1,2}[月.]\s*\d{1,2}日?/g,
      /20\d{2}年\s*\d{1,2}月\s*\d{1,2}日[〜～\-–]\d{1,2}日/g,
      /20\d{2}年\s*\d{1,2}月\s*\d{1,2}日/g,
      /20\d{2}[.\-\/]\d{1,2}[.\-\/]\d{1,2}/g,
      /\d{1,2}月\s*\d{1,2}日[〜～\-–]\d{1,2}日/g,
      /\d{1,2}\/\d{1,2}[〜～\-–]\d{1,2}/g,
    ];
    for (const re of DATE_PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text)) !== null) {
        const value      = m[0].trim();
        const normKey    = this._normalizeDateKey(value);
        const ctxStart   = Math.max(0, m.index - 40);
        const ctxEnd     = Math.min(text.length, m.index + value.length + 40);
        const sourceLine = text.slice(ctxStart, ctxEnd).replace(/\n/g, ' ').trim();
        const textScore  = this.scoreCandidate(sourceLine, 'date');
        const { domScore, domPath } = this._lookupDomScore(sourceLine, domIndex);
        const totalScore = textScore + domScore;
        const existing   = _dateMap.get(normKey);
        if (!existing || totalScore > existing.totalScore) {
          _dateMap.set(normKey, { value, score: textScore, domScore, domPath, sourceLine, totalScore });
        }
      }
    }
    const candidateDates = [..._dateMap.values()]
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5);

    /* ── ② エントリー締切 ──────────────────────────────────── */
    const _dlRaw = [];
    const DEADLINE_RE = /[^\n]*(?:締切|締め切り|エントリー締切|申込締切|応募締切|参加申込)[^\n]*/g;
    let dm;
    while ((dm = DEADLINE_RE.exec(text)) !== null && _dlRaw.length < 12) {
      const line  = dm[0].trim();
      if (/\d{1,2}月|\d{4}年|\d{1,2}\/\d{1,2}|令和|R\d/.test(line)) {
        const dateM = line.match(/(?:20\d{2}年\s*\d{1,2}月\s*\d{1,2}日|\d{1,2}月\s*\d{1,2}日)/);
        _dlRaw.push({ value: dateM ? dateM[0] : line.slice(0, 40), sourceLine: line.slice(0, 80) });
      }
    }
    const candidateDeadlines = _rank(_dlRaw, 'deadline').slice(0, 3);

    /* ── ③ 賞金 ────────────────────────────────────────────── */
    const _prizeRaw = [];
    const PRIZE_RE = /[^\n]*(?:賞金総額|優勝賞金|総額賞金|prize|賞金)[^\n]*/gi;
    let pm;
    while ((pm = PRIZE_RE.exec(text)) !== null && _prizeRaw.length < 12) {
      const line = pm[0].trim();
      if (/[\d,，]/.test(line)) {
        const amtM = line.match(/[\d,，]+\s*万?円/);
        _prizeRaw.push({ value: amtM ? amtM[0] : line.slice(0, 40), sourceLine: line.slice(0, 80) });
      }
    }
    const candidatePrizes = _rank(_prizeRaw, 'prize').slice(0, 3);

    /* ── ④ 参加費 ──────────────────────────────────────────── */
    const _feeRaw = [];
    const FEE_RE = /[^\n]*(?:参加費|エントリーフィ|エントリー費|参加料|fee|参加代金)[^\n]*/gi;
    let fm;
    while ((fm = FEE_RE.exec(text)) !== null && _feeRaw.length < 12) {
      const line = fm[0].trim();
      if (/[\d,，円¥]/.test(line)) {
        const amtM = line.match(/[\d,，]+\s*円/);
        _feeRaw.push({ value: amtM ? amtM[0] : line.slice(0, 40), sourceLine: line.slice(0, 80) });
      }
    }
    const candidateFees = _rank(_feeRaw, 'fee').slice(0, 3);

    /* ── ⑤ ゴルフ場名 ──────────────────────────────────────── */
    const _courseRaw = [];
    const COURSE_RE = /[\w\u3040-\u9FFF\uF900-\uFAFF]{2,20}(?:カントリークラブ|ゴルフ倶楽部|ゴルフクラブ|ゴルフ場|CC|GC|リンクス|LINKS|Country\s*Club)/g;
    let cm;
    while ((cm = COURSE_RE.exec(text)) !== null && _courseRaw.length < 12) {
      const value      = cm[0].trim();
      const ctxStart   = Math.max(0, cm.index - 20);
      const ctxEnd     = Math.min(text.length, cm.index + value.length + 20);
      const sourceLine = text.slice(ctxStart, ctxEnd).replace(/\n/g, ' ').trim();
      _courseRaw.push({ value, sourceLine });
    }
    const candidateCourses = _rank(_courseRaw, 'course').slice(0, 5);

    /* ── デバッグログ ───────────────────────────────────────── */
    const _best = arr => arr[0]
      ? `${arr[0].value}(text:${arr[0].score} dom:${arr[0].domScore} total:${arr[0].totalScore})`
      : '-';
    console.log('[AIP:candidates] bestCandidate(text+dom):', {
      date:     _best(candidateDates),
      deadline: _best(candidateDeadlines),
      prize:    _best(candidatePrizes),
      fee:      _best(candidateFees),
      course:   _best(candidateCourses),
    });

    return { candidateDates, candidateDeadlines, candidatePrizes, candidateFees, candidateCourses };
  }

  /* ================================================================
     extractStructuredData(rawHtml) — JSON-LD / schema.org 構造化データ解析
     ================================================================
     目的:
       <script type="application/ld+json"> を全件スキャンし、
       Event / SportsEvent / Organization スキーマから
       大会名・開始日・終了日・会場・主催者を直接取得する。
       通常のテキスト抽出より信頼度が高いため +20 ボーナスを付与。

     対応形式:
       - 単一オブジェクト: { "@type": "Event", ... }
       - 配列:            [{ "@type": "Event" }, ...]
       - @graph:          { "@graph": [{ "@type": "Event" }, ...] }
       - 複数 <script> タグ（全件走査）

     戻り値:
       {
         found      : boolean,          // 有効データが見つかったか
         name       : string|null,
         startDate  : string|null,      // YYYY-MM-DD 形式に正規化
         endDate    : string|null,
         location   : string|null,      // location.name / location.address
         organizer  : string|null,      // organizer.name
         eventStatus: string|null,
         url        : string|null,
         rawTypes   : string[],         // 検出した @type の一覧（デバッグ用）
         score      : number,           // 常に +20（JSON-LD 由来は高信頼）
       }

     安全要件:
       - JSON.parse 失敗は無視して次の <script> へ続行
       - DOMParser 非対応時は regex fallback で <script> 抽出
       - null/undefined アクセスはすべてオプショナルチェーン
     ================================================================ */
  static extractStructuredData(rawHtml) {

    const EMPTY = { found:false, name:null, startDate:null, endDate:null,
                    location:null, organizer:null, eventStatus:null,
                    url:null, rawTypes:[], score:20 };

    if (!rawHtml || rawHtml.length < 50) return EMPTY;

    // ── 1. <script type="application/ld+json"> を全件抽出 ────────
    const scripts = [];

    // 方法A: DOMParser（確実）
    if (typeof DOMParser !== 'undefined') {
      try {
        const doc = new DOMParser().parseFromString(rawHtml, 'text/html');
        doc.querySelectorAll('script[type="application/ld+json"]').forEach(el => {
          const t = (el.textContent || '').trim();
          if (t) scripts.push(t);
        });
      } catch(e) {
        console.warn('[AIP:jsonld] DOMParser失敗、regex fallback:', e.message);
      }
    }

    // 方法B: regex fallback（DOMParser 非対応 or 結果0件時）
    if (scripts.length === 0) {
      const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
      let m;
      while ((m = re.exec(rawHtml)) !== null) {
        const t = (m[1] || '').trim();
        if (t) scripts.push(t);
      }
    }

    if (scripts.length === 0) {
      console.log('[AIP:jsonld] JSON-LD script なし');
      return EMPTY;
    }
    console.log(`[AIP:jsonld] ${scripts.length} 件の JSON-LD script を検出`);

    // ── 2. 各 script を JSON.parse して Event/SportsEvent を探す ─
    const TARGET_TYPES = new Set(['event', 'sportsevent', 'organization',
                                   'sportsorganization', 'sportsclub']);
    const rawTypes = [];

    // ノードリストから対象 @type のオブジェクトだけ集める
    const _collectNodes = (obj) => {
      const nodes = [];
      if (!obj || typeof obj !== 'object') return nodes;

      // @graph 対応
      if (Array.isArray(obj['@graph'])) {
        obj['@graph'].forEach(n => nodes.push(..._collectNodes(n)));
        return nodes;
      }
      // 配列
      if (Array.isArray(obj)) {
        obj.forEach(n => nodes.push(..._collectNodes(n)));
        return nodes;
      }
      // 単一オブジェクト
      const type = (obj['@type'] || '');
      const typeKey = (Array.isArray(type) ? type[0] : type).toLowerCase().trim();
      rawTypes.push(typeKey);
      if (TARGET_TYPES.has(typeKey)) nodes.push(obj);
      return nodes;
    };

    const allNodes = [];
    for (const scriptText of scripts) {
      let parsed;
      try { parsed = JSON.parse(scriptText); }
      catch(e) {
        console.warn('[AIP:jsonld] JSON.parse 失敗（スキップ）:', e.message.slice(0, 60));
        continue;
      }
      allNodes.push(..._collectNodes(parsed));
    }

    if (allNodes.length === 0) {
      console.log('[AIP:jsonld] Event/SportsEvent ノードなし。検出type:', rawTypes);
      return { ...EMPTY, rawTypes };
    }

    // ── 3. 値を抽出（複数ノードは先勝ちで最初の非 null を採用） ─
    const _str  = v => (typeof v === 'string' ? v.trim() : null);
    const _pick = (obj, ...keys) => {
      for (const k of keys) {
        const v = obj?.[k];
        if (typeof v === 'string' && v.trim()) return v.trim();
        if (typeof v === 'object' && v !== null) {
          const inner = v.name || v['@id'] || v.text;
          if (inner) return String(inner).trim();
        }
      }
      return null;
    };

    // 日付を YYYY-MM-DD に正規化（ISO8601 → 先頭10文字、それ以外はそのまま）
    const _date = v => {
      if (!v) return null;
      const s = String(v).trim();
      // ISO8601: 2026-05-10T... / 2026-05-10
      if (/^20\d{2}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
      // YYYY/MM/DD
      const m = s.match(/^(20\d{2})[\/.](\d{1,2})[\/.](\d{1,2})/);
      if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
      return s.slice(0, 20);   // それ以外はそのまま
    };

    let name = null, startDate = null, endDate = null,
        location = null, organizer = null, eventStatus = null, resUrl = null;

    for (const node of allNodes) {
      if (!name)       name       = _pick(node, 'name', 'alternateName');
      if (!startDate)  startDate  = _date(_str(node.startDate));
      if (!endDate)    endDate    = _date(_str(node.endDate));
      if (!eventStatus) eventStatus = _str(node.eventStatus) || _str(node.status);
      if (!resUrl)     resUrl     = _str(node.url);

      // location: 文字列 / { name } / { address } / { name, address }
      if (!location) {
        const loc = node.location;
        if (typeof loc === 'string') location = loc.trim();
        else if (loc) {
          location = _str(loc.name) || _str(loc.address?.name)
                  || _str(loc.address?.streetAddress) || null;
        }
      }

      // organizer: 文字列 / { name }
      if (!organizer) {
        const org = node.organizer;
        if (typeof org === 'string') organizer = org.trim();
        else if (org) organizer = _str(org.name) || null;
      }
    }

    const found = !!(name || startDate || location);
    console.log('[AIP:jsonld] 抽出結果:', { found, name, startDate, endDate, location, organizer });

    return { found, name, startDate, endDate, location, organizer,
             eventStatus, url: resUrl, rawTypes, score: 20 };
  }

  /* parseBatch — 複数URL一括解析 */
  static async parseBatch(urls, onProgress) {
    const results = [];
    for (let i = 0; i < urls.length; i++) {
      let item;
      try {
        item = { url: urls[i], ok: true,  data:  await this.parse(urls[i]) };
      } catch(e) {
        item = { url: urls[i], ok: false, error: e.message };
      }
      results.push(item);
      try { onProgress && onProgress(i + 1, urls.length, item); } catch {}
    }
    return results;
  }
}

window.AiUrlParser     = AiUrlParser;
window.TextCleaner     = TextCleaner;
window.DateNormalizer  = DateNormalizer;
window.ConfidenceCalculator = ConfidenceCalculator;

// ================================================================
// § 4-EX  TournamentWatcher — 大会URL自動監視・差分検知
// ================================================================
// 目的:
//   watchTargets コレクション内の URL を定期巡回し、
//   コンテンツ変化（hash 差分）があった場合のみ AI 再解析を実行。
//   変更フィールド（changedFields）を Firestore に記録する。
//
// 既存コード変更なし: AiUrlParser.parse / _FCMS / events /
//                     renderCalendar / modal / localStorage はすべて無変更。
// ================================================================
class TournamentWatcher {

  // ── 定数 ──────────────────────────────────────────────────────
  static COLLECTION     = 'watchTargets';
  static PARSE_VERSION  = '4.0';              // ロジック変更時に上げる
  static DEFAULT_HOURS  = 24;                 // デフォルト巡回間隔（時間）
  static MIN_INTERVAL   = 1;                  // 最短 1 時間
  static HASH_LEN       = 16;                 // hex 先頭16文字

  // ── Firestore db 参照（_FCMS と同パターン） ───────────────────
  static _db() {
    if (typeof firebase === 'undefined' || !firebase.apps?.length) return null;
    if (typeof firebase.firestore !== 'function') return null;
    try { return firebase.firestore(); } catch(e) { return null; }
  }

  // ================================================================
  //  _hashText(text) — コンテンツの SHA-256 ハッシュ（先頭16文字 hex）
  //  SubtleCrypto 非対応時は djb2 フォールバック
  // ================================================================
  static async _hashText(text) {
    if (!text) return '';

    // 方法A: SubtleCrypto（モダンブラウザ / HTTPS 必須）
    if (typeof crypto !== 'undefined' && crypto.subtle?.digest) {
      try {
        const buf  = new TextEncoder().encode(text);
        const hash = await crypto.subtle.digest('SHA-256', buf);
        const hex  = Array.from(new Uint8Array(hash))
          .map(b => b.toString(16).padStart(2, '0')).join('');
        return hex.slice(0, this.HASH_LEN);
      } catch(e) {
        console.warn('[Watcher] SubtleCrypto失敗 → djb2 fallback:', e.message);
      }
    }

    // 方法B: djb2 フォールバック（HTTP 環境など）
    let h = 5381;
    for (let i = 0; i < text.length; i++) {
      h = ((h << 5) + h) ^ text.charCodeAt(i);
      h = h >>> 0;  // 符号なし32bit
    }
    return h.toString(16).padStart(8, '0').slice(0, this.HASH_LEN);
  }

  // ================================================================
  //  _extractText(rawHtml) — hash 生成用テキスト抽出
  //  AiUrlParser.extractMainContent → TextCleaner の順に通す
  //  (parse pipeline と同じ前処理 = 同じ変化を検知できる)
  // ================================================================
  static _extractText(rawHtml) {
    if (!rawHtml) return '';
    // extractMainContent が存在すれば使う（前回の実装済み）
    let html = rawHtml;
    if (typeof AiUrlParser !== 'undefined' &&
        typeof AiUrlParser.extractMainContent === 'function') {
      html = AiUrlParser.extractMainContent(rawHtml);
    }
    // TextCleaner で平文化
    if (typeof TextCleaner !== 'undefined') {
      const cleaned = TextCleaner.clean(html, 20000);
      return cleaned.text || '';
    }
    // 最終フォールバック: タグ除去のみ
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // ================================================================
  //  _diffFields(prev, next) — 2つの parse 結果を比較して変更フィールドを返す
  //  対象: startDate / endDate / entryDeadline / prize / entryFee / course
  // ================================================================
  static _diffFields(prev, next) {
    if (!prev || !next) return [];
    const FIELDS = [
      { key: 'startDate',     label: 'date'     },
      { key: 'endDate',       label: 'date'     },
      { key: 'entryDeadline', label: 'deadline' },
      { key: 'prize',         label: 'prize'    },
      { key: 'entryFee',      label: 'fee'      },
      { key: 'course',        label: 'course'   },
      { key: 'courseName',    label: 'course'   },
    ];
    const changed = new Set();
    for (const { key, label } of FIELDS) {
      const pv = (prev[key] || '').toString().trim();
      const nv = (next[key] || '').toString().trim();
      if (pv && nv && pv !== nv) changed.add(label);
    }
    return [...changed];
  }

  // ================================================================
  //  addTarget(url, options) — 監視対象を watchTargets に登録
  // ================================================================
  static async addTarget(url, options = {}) {
    const db = this._db();
    if (!db) {
      console.warn('[Watcher] Firestore 未接続 → addTarget スキップ');
      return { ok: false, offline: true };
    }
    if (!url || !url.startsWith('http')) {
      return { ok: false, error: 'Invalid URL' };
    }

    // 重複チェック（同じ URL が既に登録されていれば更新）
    const col  = db.collection(this.COLLECTION);
    const snap = await col.where('url', '==', url).limit(1).get();

    const doc = {
      url,
      enabled:       options.enabled       ?? true,
      source:        options.source         || 'manual',
      lastHash:      '',
      lastCheckedAt: null,
      lastChangedAt: null,
      intervalHours: Math.max(this.MIN_INTERVAL, options.intervalHours || this.DEFAULT_HOURS),
      parseVersion:  this.PARSE_VERSION,
      createdAt:     new Date().toISOString(),
      updatedAt:     new Date().toISOString(),
    };

    try {
      if (!snap.empty) {
        await snap.docs[0].ref.update({ enabled: doc.enabled, intervalHours: doc.intervalHours,
                                        parseVersion: doc.parseVersion, updatedAt: doc.updatedAt });
        console.info('[Watcher] addTarget updated:', url);
        return { ok: true, id: snap.docs[0].id, updated: true };
      } else {
        const ref = await col.add(doc);
        console.info('[Watcher] addTarget added:', ref.id, url);
        return { ok: true, id: ref.id, added: true };
      }
    } catch(e) {
      console.error('[Watcher] addTarget error:', e);
      return { ok: false, error: e.message };
    }
  }

  // ================================================================
  //  removeTarget(url) — 監視対象を削除
  // ================================================================
  static async removeTarget(url) {
    const db = this._db();
    if (!db) return { ok: false, offline: true };
    try {
      const snap = await db.collection(this.COLLECTION).where('url', '==', url).limit(1).get();
      if (snap.empty) return { ok: false, error: 'not found' };
      await snap.docs[0].ref.delete();
      console.info('[Watcher] removeTarget:', url);
      return { ok: true };
    } catch(e) {
      console.error('[Watcher] removeTarget error:', e);
      return { ok: false, error: e.message };
    }
  }

  // ================================================================
  //  checkTournamentUpdate(url) — 1件のURLを差分チェック
  //
  //  処理フロー:
  //    1. fetchHtml(url)
  //    2. extractMainContent → _extractText
  //    3. _hashText でコンテンツ hash 生成
  //    4. Firestore の lastHash と比較
  //    同一 hash → AI解析スキップ、lastCheckedAt のみ更新
  //    差分あり  → AiUrlParser.parse() で再解析
  //               _diffFields で変更フィールドを検出
  //               Firestore に lastHash / lastChangedAt / changedFields を保存
  // ================================================================
  static async checkTournamentUpdate(url) {
    if (!url || !url.startsWith('http')) {
      return { ok: false, error: 'Invalid URL' };
    }

    const db  = this._db();
    const now = new Date().toISOString();

    // ── 1. Firestore から前回状態を取得 ──────────────────────────
    let docRef  = null;
    let prevDoc = null;
    if (db) {
      try {
        const snap = await db.collection(this.COLLECTION).where('url', '==', url).limit(1).get();
        if (!snap.empty) {
          docRef  = snap.docs[0].ref;
          prevDoc = snap.docs[0].data();
        }
      } catch(e) {
        console.warn('[Watcher] Firestore 読み取り失敗:', e.message);
      }
    }

    // ── 2. HTML フェッチ ──────────────────────────────────────────
    console.log('[Watcher] fetching:', url);
    let rawHtml = '';
    try {
      rawHtml = await AiUrlParser.fetchHtml(url);
    } catch(e) {
      console.error('[Watcher] fetchHtml 失敗:', e.message);
      return { ok: false, url, error: 'fetch_failed', message: e.message };
    }
    if (!rawHtml) {
      return { ok: false, url, error: 'empty_html' };
    }

    // ── 3. テキスト抽出 + hash 生成 ──────────────────────────────
    const contentText = this._extractText(rawHtml);
    const newHash     = await this._hashText(contentText);
    const prevHash    = prevDoc?.lastHash || '';

    console.log(`[Watcher] hash: prev=${prevHash || '(none)'} new=${newHash}`);

    // ── 4. hash 比較 ─────────────────────────────────────────────
    if (prevHash && prevHash === newHash) {
      // 同一 → AI 解析スキップ
      console.log('[Watcher] 変更なし → AI解析スキップ:', url);
      if (docRef) {
        await docRef.update({ lastCheckedAt: now, parseVersion: this.PARSE_VERSION })
          .catch(e => console.warn('[Watcher] update error:', e.message));
      }
      return { ok: true, url, changed: false, hash: newHash };
    }

    // ── 5. 差分あり → AiUrlParser.parse() で再解析 ───────────────
    console.log('[Watcher] 差分検出 → AI再解析:', url);
    let parseResult = null;
    try {
      parseResult = await AiUrlParser.parse(url);
    } catch(e) {
      console.error('[Watcher] parse 失敗:', e.message);
      // parse 失敗でも hash は更新しておく（無限ループ防止）
      if (docRef) {
        await docRef.update({ lastHash: newHash, lastCheckedAt: now, parseError: e.message })
          .catch(() => {});
      }
      return { ok: false, url, error: 'parse_failed', message: e.message };
    }

    // ── 6. 変更フィールドを検出 ───────────────────────────────────
    const prevParse    = prevDoc?.lastParseResult || null;
    const changedFields = this._diffFields(prevParse, parseResult);

    console.log('[Watcher] changedFields:', changedFields, 'url:', url);

    // ── 7. Firestore に結果を保存 ─────────────────────────────────
    const updatePayload = {
      lastHash:          newHash,
      lastCheckedAt:     now,
      lastChangedAt:     now,
      parseVersion:      this.PARSE_VERSION,
      changedFields,                        // ["deadline","prize"] など
      lastParseResult: {
        // parse 結果から比較対象フィールドのみ保持（容量節約）
        startDate:      parseResult.startDate     || null,
        endDate:        parseResult.endDate       || null,
        entryDeadline:  parseResult.entryDeadline || null,
        prize:          parseResult.prize         || '',
        entryFee:       parseResult.entryFee      || '',
        course:         parseResult.course        || parseResult.courseName || '',
        title:          parseResult.title         || '',
        aiConfidence:   parseResult.aiConfidence  ?? null,
      },
      updatedAt: now,
    };

    if (docRef) {
      try {
        await docRef.update(updatePayload);
        console.info('[Watcher] Firestore 更新完了:', url, changedFields);
      } catch(e) {
        console.error('[Watcher] Firestore 更新失敗:', e.message);
      }
    } else {
      // watchTargets に未登録だが差分があった場合は自動登録
      if (db) {
        try {
          await db.collection(this.COLLECTION).add({
            url,
            enabled:       true,
            source:        'auto',
            intervalHours: this.DEFAULT_HOURS,
            parseVersion:  this.PARSE_VERSION,
            createdAt:     now,
            ...updatePayload,
          });
          console.info('[Watcher] 新規 watchTarget 自動登録:', url);
        } catch(e) {
          console.warn('[Watcher] 自動登録失敗:', e.message);
        }
      }
    }

    return {
      ok:            true,
      url,
      changed:       true,
      changedFields,
      hash:          newHash,
      parseResult,
    };
  }

  // ================================================================
  //  runAll(options) — 全 enabled ターゲットを一括チェック
  //  intervalHours を過ぎたもののみ対象
  // ================================================================
  static async runAll(options = {}) {
    const db = this._db();
    if (!db) {
      console.warn('[Watcher] Firestore 未接続 → runAll スキップ');
      return { ok: false, offline: true };
    }

    const now    = Date.now();
    const dryRun = options.dryRun || false;

    let targets;
    try {
      const snap = await db.collection(this.COLLECTION).where('enabled', '==', true).get();
      targets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch(e) {
      console.error('[Watcher] runAll fetch error:', e);
      return { ok: false, error: e.message };
    }

    // intervalHours を超えたものだけ対象
    const due = targets.filter(t => {
      if (!t.lastCheckedAt) return true;
      const lastMs  = new Date(t.lastCheckedAt).getTime();
      const hours   = t.intervalHours || this.DEFAULT_HOURS;
      return (now - lastMs) >= hours * 3600 * 1000;
    });

    console.log(`[Watcher] runAll: ${targets.length} 件中 ${due.length} 件が巡回対象`);
    if (dryRun) return { ok: true, dryRun: true, due: due.map(t => t.url) };

    const results = [];
    for (const target of due) {
      const r = await this.checkTournamentUpdate(target.url);
      results.push(r);
      // 連続リクエストを避けるため 1.5 秒待機
      await new Promise(res => setTimeout(res, 1500));
    }

    const changed = results.filter(r => r.changed);
    console.log(`[Watcher] runAll 完了: ${changed.length} 件変更検知`);
    return { ok: true, total: results.length, changed: changed.length, results };
  }

  // ================================================================
  //  listTargets() — 監視対象一覧を取得
  // ================================================================
  static async listTargets() {
    const db = this._db();
    if (!db) return { ok: false, offline: true, targets: [] };
    try {
      const snap = await db.collection(this.COLLECTION).orderBy('createdAt', 'desc').get();
      const targets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return { ok: true, targets };
    } catch(e) {
      console.error('[Watcher] listTargets error:', e);
      return { ok: false, error: e.message, targets: [] };
    }
  }
}

window.TournamentWatcher = TournamentWatcher;
console.info(
  '%c[TournamentWatcher]%c 大会URL自動監視 初期化完了',
  'background:#1d1d1f;color:#39C892;padding:2px 8px;border-radius:3px;font-weight:800;',
  'color:#1d1d1f;font-weight:600;'
);


// ================================================================
// § 5  UI 制御レイヤー（ステップ・プレビュー・エラー）
// ================================================================
(function(){
'use strict';

const STEPS = [
  { id:'aip-s1', key:'fetch', label:'URLを取得中'       },
  { id:'aip-s2', key:'parse', label:'クリーニング・日付正規化' },
  { id:'aip-s3', key:'ai',    label:'AIが大会情報を解析' },
  { id:'aip-s4', key:'cat',   label:'カテゴリ判定・スコア算出' },
];
const KEY_MAP = {};
STEPS.forEach((s, i) => { KEY_MAP[s.key] = s.id; });

function ensureUI() {
  if (document.getElementById('aip-steps')) return;
  const progress = document.getElementById('url-progress');
  if (!progress) return;
  const wrap = document.createElement('div');
  wrap.id = 'aip-steps';
  wrap.className = 'aip-steps';
  wrap.innerHTML = STEPS.map((s, i) => `
    <div class="aip-step" id="${s.id}">
      <div class="aip-dot">${i+1}</div>
      <span>${s.label}</span>
    </div>`).join('');
  progress.parentNode.insertBefore(wrap, progress);
}

function step(key, state) {
  const el = document.getElementById(KEY_MAP[key]);
  if (!el) return;
  el.className = 'aip-step ' + state;
  const dot = el.querySelector('.aip-dot');
  const idx = STEPS.findIndex(s => s.key === key);
  if (dot) dot.textContent = state==='done' ? '✓' : state==='err' ? '✕' : String(idx+1);
}

function resetSteps() {
  STEPS.forEach((s, i) => {
    const el = document.getElementById(s.id);
    if (!el) return;
    el.className = 'aip-step';
    const dot = el.querySelector('.aip-dot');
    if (dot) dot.textContent = String(i+1);
  });
}

const _e = s => String(s||'').replace(/[&<>"']/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function showResult(data) {
  const box   = document.getElementById('url-result-box');
  const title = document.getElementById('url-result-title');
  const rows  = document.getElementById('url-result-rows');
  if (!box) return;

  title.textContent = data.title || '大会情報（要確認）';

  const conf  = data.aiConfidence || 0;
  const level = conf >= 0.72 ? 'high' : conf >= 0.42 ? 'mid' : 'low';
  const confTx =
    conf >= 0.72 ? `✅ 信頼度 高 (${Math.round(conf*100)}%)` :
    conf >= 0.42 ? `⚠️ 要確認 (${Math.round(conf*100)}%) — 内容を確認してください` :
                   `❌ 信頼度 低 — 手動で修正してください`;

  const pref = (typeof _PREF_MAP !== 'undefined' && data.prefecture)
    ? (_PREF_MAP[data.prefecture] || data.prefecture) : (data.prefecture || '');

  const catColor = (typeof CAT_COLORS !== 'undefined' ? CAT_COLORS[data.category] : null) || '#8090A0';
  const catLabel = (typeof CAT_LABELS !== 'undefined' ? CAT_LABELS[data.category] : null) || data.category || '';
  const catHtml  = catLabel
    ? `<div style="margin-bottom:8px;"><span class="aip-cat" style="background:${catColor};display:inline-flex;align-items:center;padding:3px 10px;border-radius:10px;font-size:11px;font-weight:700;color:#fff;">${_e(catLabel)}</span></div>` : '';

  // confidence 内訳（デバッグ用）
  const bdKeys = data.metadata?.confidenceBreakdown
    ? Object.entries(data.metadata.confidenceBreakdown)
        .filter(([k]) => !k.startsWith('_penalty'))
        .map(([k,v]) => `${k}:+${v}`)
        .join(' ')
    : '';

  const fields = [
    ['大会名',    data.title],
    ['開催日',    data.startDate ? `${data.startDate}${data.endDate&&data.endDate!==data.startDate?' 〜 '+data.endDate:''}` : null],
    ['締切',      data.entryDeadline],
    ['ゴルフ場',  data.course],
    ['都道府県',  pref],
    ['主催者',    data.organizer],
    ['賞金',      data.prize],
    ['参加費',    data.entryFee],
    ['定員',      data.capacity],
    ['公式URL',   data.links?.official || data.officialUrl],
    ['Instagram', data.links?.instagram || data.igUrl],
    ['備考',      data.notes],
  ];

  rows.innerHTML =
    `<div class="aip-conf ${level}" style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:10px;font-size:11px;font-weight:700;margin-bottom:8px;${level==='high'?'background:#dcf5ea;color:#0B7A44;':level==='mid'?'background:#fff3dc;color:#A05800;':'background:#fce8e8;color:#C03030;'}">${confTx}</div>` +
    (bdKeys ? `<div style="font-size:9.5px;color:#8e8e93;margin-bottom:6px;">内訳: ${_e(bdKeys)}</div>` : '') +
    catHtml +
    fields.filter(([,v])=>v).map(([l,v])=>
      `<div class="url-result-row"><span class="url-result-label">${l}</span><span class="url-result-val">${_e(v)}</span></div>`
    ).join('');

  box.classList.add('show');
  document.getElementById('url-error-box')?.classList.remove('show');
  document.getElementById('url-confirm-btn').style.display = '';
}

function showError(msg) {
  const eb = document.getElementById('url-error-box');
  if (!eb) return;
  eb.innerHTML = `
    <div style="margin-bottom:8px;">⚠️ ${_e(msg)}</div>
    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
      <button onclick="startUrlFetch()" style="display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border-radius:10px;font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;background:#f0fdf6;border:1.5px solid rgba(57,200,146,.4);color:#0B7A44;">↺ リトライ</button>
      <button onclick="_aipManual()" style="display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border-radius:10px;font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;background:#f5f5f7;border:1.5px solid rgba(0,0,0,.1);color:#3a3a3c;">✏️ 手動入力へ</button>
    </div>
    <div style="margin-top:8px;font-size:10.5px;color:#8e8e93;">URLが取得できない場合は手動入力で登録できます</div>`;
  eb.classList.add('show');
  document.getElementById('url-result-box')?.classList.remove('show');
  document.getElementById('url-confirm-btn').style.display = 'none';
  document.getElementById('url-progress')?.classList.remove('show');
  document.getElementById('aip-steps')?.classList.remove('show');
}

window._aipManual = function() {
  const url = document.getElementById('url-modal-input')?.value?.trim() || '';
  _urlParseResult = {
    title:'', name:'', category:'', gender:'mens', region:'domestic',
    area:'', prefecture:'', course:'', courseName:'', organizer:'', status:'tbd',
    startDate:null, endDate:null, entryDeadline:null, cancelDeadline:null,
    prize:'', prizeWinner:'', entryFee:'', practiceRoundFee:'',
    entryMethod:'', qualification:'', capacity:'', notes:'',
    links:{ website:url, official:url, instagram:'', entry:'', pairing:'', result:'' },
    officialUrl:url, igUrl:'', entryUrl:'',
    sourceUrl:url, sourceType:'manual', parsingStatus:'manual',
    aiConfidence:0, rawContent:'', extractedText:'',
    metadata:{ aiExtracted:false }, _catColor:'#8090A0', _catLabel:'',
  };
  confirmUrlResult();
};

/* ── startUrlFetch 完全置き換え ── */
window.startUrlFetch = async function() {
  if (!window._isAdmin && !document.body.classList.contains('is-admin')) {
    if (typeof showToast === 'function') showToast('🔒 管理者のみ利用できます');
    return;
  }
  const url = document.getElementById('url-modal-input')?.value?.trim();
  if (!url || !url.startsWith('http')) { showError('有効なURLを入力してください（https://... ）'); return; }

  const btn = document.getElementById('url-fetch-btn');
  if (btn) { btn.disabled = true; btn.textContent = '解析中…'; }

  ensureUI(); resetSteps();
  document.getElementById('aip-steps')?.classList.add('show');
  document.getElementById('url-result-box')?.classList.remove('show');
  document.getElementById('url-error-box')?.classList.remove('show');
  document.getElementById('url-confirm-btn').style.display = 'none';
  document.getElementById('url-progress')?.classList.remove('show');

  try {
    const result = await AiUrlParser.parse(url, step);
    _urlParseResult = result;
    showResult(result);
    if (typeof showToast === 'function') showToast('✅ AI解析完了！内容を確認してください');
  } catch(err) {
    console.error('[AIP]', err);
    resetSteps();
    showError(err.message || 'AI解析に失敗しました');
    if (typeof showToast === 'function') showToast('⚠️ 解析失敗');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '解析'; }
  }
};

/* ── openUrlModal 管理者チェック ── */
const _origOpen = window.openUrlModal;
window.openUrlModal = function() {
  if (!window._isAdmin && !document.body.classList.contains('is-admin')) {
    if (typeof showToast === 'function') showToast('🔒 管理者のみ利用できます');
    return;
  }
  if (typeof _origOpen === 'function') _origOpen();
  setTimeout(() => { ensureUI(); resetSteps(); document.getElementById('aip-steps')?.classList.remove('show'); }, 80);
};

/* ── 既存ダミー関数を無害化 ── */
window._fetchRawContent = async () => ({ rawHtml:'', rawText:'', ocrText:'', fetchedAt: new Date().toISOString() });

/* ── CSS（インライン追加） ── */
if (!document.getElementById('aip-v3-css')) {
  const st = document.createElement('style');
  st.id = 'aip-v3-css';
  st.textContent = `
    .aip-steps{display:none;flex-direction:column;gap:8px;margin-bottom:14px;}
    .aip-steps.show{display:flex;}
    .aip-step{display:flex;align-items:center;gap:10px;font-size:12.5px;font-weight:500;color:#c7c7cc;transition:color .18s;}
    .aip-step.active{color:#1d1d1f;font-weight:700;}
    .aip-step.done{color:#39C892;}
    .aip-step.err{color:#C03030;}
    .aip-dot{width:22px;height:22px;border-radius:50%;border:2px solid #e5e5ea;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;background:#fff;transition:all .18s;color:#c7c7cc;}
    .aip-step.active .aip-dot{border-color:#39C892;color:#39C892;animation:aip-ring 1.2s ease-in-out infinite;}
    .aip-step.done .aip-dot{border-color:#39C892;background:#39C892;color:#fff;}
    .aip-step.err .aip-dot{border-color:#C03030;background:#C03030;color:#fff;}
    @keyframes aip-ring{0%,100%{box-shadow:0 0 0 0 rgba(57,200,146,.45);}50%{box-shadow:0 0 0 6px rgba(57,200,146,0);}}
    .url-modal-sheet{max-height:88vh;overflow-y:auto;-webkit-overflow-scrolling:touch;}
    .url-modal-body{padding:12px 18px 24px;}
  `;
  document.head.appendChild(st);
}

console.info(
  '%c[AiUrlParser v3]%c TextCleaner + DateNormalizer + ConfidenceCalculator 実ロジック統合完了',
  'background:#1d1d1f;color:#39C892;padding:2px 8px;border-radius:3px;font-weight:800;',
  'color:#1d1d1f;font-weight:600;'
);

})();
/* ================================================================
  PDF解析エンジン
  ================================================================ */
(function(){
'use strict';

// ── 定数 ──
const PDF_MAX_BYTES  = 20 * 1024 * 1024;  // 20MB
const PDF_MAX_PAGES  = 30;
const OCR_MAX_PAGES  = 5;    // OCR は重いため最大5ページ
const TEXT_LIMIT     = 7500; // /api/parseTournament へ送る上限
const API_ROUTE      = '/api/parseTournament';

// pdf.js 3.11 (legacy build = ES5 互換)
const PDFJS_JS     = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
// Tesseract.js 4.1
const TESSERACT_JS = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js';

// ── 状態 ──
let _pdfResult  = null;
let _pdfBusy    = false;

// ================================================================
// タブ切り替え
// ================================================================
window.pmtTab = function(tab) {
  document.getElementById('pmt-tab-url').classList.toggle('pmt-tab-on', tab === 'url');
  document.getElementById('pmt-tab-pdf').classList.toggle('pmt-tab-on', tab === 'pdf');
  document.getElementById('pmt-panel-url').style.display = tab === 'url' ? '' : 'none';
  document.getElementById('pmt-panel-pdf').style.display = tab === 'pdf' ? '' : 'none';
};

// ================================================================
// ステップUI
// ================================================================
const PDF_STEPS = ['pdf-s1','pdf-s2','pdf-s3','pdf-s4'];

function _pStep(idx, state) {
  const el = document.getElementById(PDF_STEPS[idx]);
  if (!el) return;
  el.className = 'pdf-step ' + state;
  const dot = el.querySelector('.pdf-dot');
  if (dot) dot.textContent = state === 'done' ? '✓' : state === 'err' ? '✕' : String(idx + 1);
}
function _pResetSteps() {
  PDF_STEPS.forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = 'pdf-step';
    const d = el.querySelector('.pdf-dot');
    if (d) d.textContent = String(i + 1);
  });
}
function _pProgress(pct, label) {
  const prog = document.getElementById('pdf-progress');
  const bar  = document.getElementById('pdf-progress-bar');
  const lbl  = document.getElementById('pdf-progress-label');
  if (prog) prog.classList.toggle('show', pct > 0 && pct < 100);
  if (bar)  bar.style.width = pct + '%';
  if (lbl)  lbl.textContent = label || '';
}
function _pHideAll() {
  document.getElementById('pdf-result-box')?.classList.remove('show');
  document.getElementById('pdf-error-box')?.classList.remove('show');
  document.getElementById('pdf-confirm-btn').style.display = 'none';
  document.getElementById('pdf-progress')?.classList.remove('show');
  document.getElementById('pdf-steps')?.classList.remove('show');
  _pResetSteps();
}

// ================================================================
// スクリプト動的ロード
// ================================================================
function _loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload  = res;
    s.onerror = () => rej(new Error('スクリプトのロード失敗: ' + src));
    document.head.appendChild(s);
  });
}

// ================================================================
// pdf.js でテキスト抽出
// ================================================================
async function _extractText(arrayBuf) {
  // pdf.js をロード
  if (!window.pdfjsLib) {
    await _loadScript(PDFJS_JS);
    if (!window.pdfjsLib) throw new Error('pdf.js のロードに失敗しました');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  }

  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuf }).promise;
  const numPages = Math.min(pdf.numPages, PDF_MAX_PAGES);
  let text = '';

  for (let i = 1; i <= numPages; i++) {
    _pProgress(Math.round(10 + (i / numPages) * 50), `テキスト抽出中… ${i}/${numPages}ページ`);
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }

  return text.trim();
}

// ================================================================
// Tesseract.js OCR（画像PDFのフォールバック）
// ================================================================
async function _ocrPages(arrayBuf) {
  // pdf.js で canvas レンダリング → Tesseract OCR
  if (!window.pdfjsLib) {
    await _loadScript(PDFJS_JS);
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  }
  if (!window.Tesseract) {
    await _loadScript(TESSERACT_JS);
    if (!window.Tesseract) throw new Error('Tesseract.js のロードに失敗しました');
  }

  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuf }).promise;
  const numPages = Math.min(pdf.numPages, OCR_MAX_PAGES);
  let text = '';

  for (let i = 1; i <= numPages; i++) {
    _pProgress(Math.round(60 + (i / numPages) * 25),
      `OCR処理中… ${i}/${numPages}ページ（画像PDFのため時間がかかります）`);

    const page     = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas   = document.createElement('canvas');
    canvas.width   = viewport.width;
    canvas.height  = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;

    const { data: { text: t } } = await window.Tesseract.recognize(canvas, 'jpn+eng', {
      logger: () => {},
    });
    text += t + '\n';
    canvas.remove();
  }

  return text.trim();
}

// ================================================================
// /api/parseTournament 呼び出し
// ================================================================
async function _callApi(pageText, sourceUrl, hint) {
  const res = await fetch(API_ROUTE, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ pageText, sourceUrl, hint: hint || '' }),
    signal:  AbortSignal.timeout ? AbortSignal.timeout(42000) : undefined,
  });
  let body;
  try { body = await res.json(); } catch { throw new Error(`サーバーエラー (HTTP ${res.status})`); }
  if (!res.ok || !body.ok) throw new Error(body.error || `サーバーエラー (HTTP ${res.status})`);
  return body.data;
}

// ================================================================
// メインパイプライン
// ================================================================
async function _pdfPipeline(arrayBuf, sourceUrl, hint) {
  if (_pdfBusy) return;
  _pdfBusy = true;
  _pHideAll();
  document.getElementById('pdf-steps')?.classList.add('show');

  try {
    // STEP 1: サイズ確認
    _pStep(0, 'active');
    if (arrayBuf.byteLength > PDF_MAX_BYTES) {
      throw new Error(`PDFが大きすぎます（最大20MB、現在 ${(arrayBuf.byteLength/1024/1024).toFixed(1)}MB）`);
    }
    console.log('[PDF] file size:', (arrayBuf.byteLength/1024).toFixed(0), 'KB');
    _pStep(0, 'done');

    // STEP 2: テキスト抽出（pdf.js → OCR フォールバック）
    _pStep(1, 'active');
    _pProgress(10, 'PDF を解析中…');

    let pageText = '';
    let isOcr = false;

    try {
      pageText = await _extractText(arrayBuf.slice(0)); // slice でコピーを渡す
    } catch (e) {
      console.warn('[PDF] pdf.js 失敗:', e.message);
    }

    // テキストが50文字未満 → 画像PDF → OCR
    if (pageText.replace(/\s/g, '').length < 50) {
      console.info('[PDF] テキスト不足 → OCR にフォールバック');
      _pStep(1, 'done');
      _pStep(2, 'active'); // step3 を使って OCR 表示
      try {
        pageText = await _ocrPages(arrayBuf.slice(0));
        isOcr = true;
      } catch (ocrErr) {
        _pStep(2, 'err');
        throw new Error('OCR に失敗しました: ' + ocrErr.message);
      }
      _pStep(2, 'done');
    } else {
      _pStep(1, 'done');
    }

    if (pageText.replace(/\s/g, '').length < 20) {
      throw new Error('PDFからテキストを抽出できませんでした（空または読み取り不能なPDFです）');
    }

    console.log('[PDF] extracted text:', pageText.length, 'chars, isOcr:', isOcr);

    // STEP 3: Claude AI 解析
    _pStep(2, 'active');
    _pProgress(85, 'AIが大会情報を解析中…');

    const aiHint = `PDF募集要項。${isOcr ? 'OCR処理済み。' : ''}ソース: ${hint || 'ローカルPDF'}`;
    const ai = await _callApi(pageText.slice(0, TEXT_LIMIT), sourceUrl || 'local-pdf', aiHint);
    _pStep(2, 'done');

    console.log('[PDF] AI result:', ai);

    // STEP 4: フォーム準備
    _pStep(3, 'active');
    _pProgress(95, 'フォームに反映中…');

    // カテゴリ補完（AiUrlParser があれば使用）
    if (!ai.category && typeof AiUrlParser !== 'undefined') {
      const c = AiUrlParser.detectCategory(sourceUrl || '', ai.name || '');
      if (c.cat) { ai.category = c.cat; ai.gender = ai.gender || c.gender; }
    }

    // 信頼度計算（ConfidenceCalculator があれば使用）
    let confidence = typeof ai.confidence === 'number' ? ai.confidence : 0;
    if (typeof ConfidenceCalculator !== 'undefined') {
      confidence = ConfidenceCalculator.score(ai, pageText).total;
    }

    const catColor = (typeof CAT_COLORS !== 'undefined' ? CAT_COLORS[ai.category] : null) || '#8090A0';
    const catLabel = (typeof CAT_LABELS !== 'undefined' ? CAT_LABELS[ai.category] : null) || ai.category || '';

    _pdfResult = {
      title:           ai.name             || '',
      name:            ai.name             || '',
      category:        ai.category         || '',
      gender:          ai.gender           || 'mens',
      region:          ai.region           || 'domestic',
      area:            '',
      prefecture:      ai.prefecture        || '',
      course:          ai.place             || '',
      courseName:      ai.place             || '',
      organizer:       ai.organizer         || '',
      status:          'tbd',
      startDate:       ai.start             || null,
      endDate:         ai.end               || null,
      entryDeadline:   ai.entryDeadline     || null,
      cancelDeadline:  ai.cancelDeadline    || null,
      prize:           ai.prize             || '',
      prizeWinner:     ai.prizeWinner       || '',
      entryFee:        ai.entryFee          || '',
      practiceRoundFee:'',
      entryMethod:     ai.entryMethod       || '',
      qualification:   ai.qualification     || '',
      capacity:        ai.capacity          || '',
      notes:           ai.memo              || '',
      links: {
        website:   ai.website   || sourceUrl || '',
        official:  ai.website   || sourceUrl || '',
        instagram: ai.instagram || '',
        entry:     ai.entryUrl  || '',
        pairing:   '',
        result:    '',
      },
      officialUrl: ai.website   || sourceUrl || '',
      igUrl:       ai.instagram || '',
      entryUrl:    ai.entryUrl  || '',
      sourceUrl:   sourceUrl || 'local-pdf',
      sourceType:  'ai_pdf',
      parsingStatus: 'success',
      aiConfidence:  confidence,
      rawContent:    '',
      extractedText: pageText.slice(0, 500),
      metadata: {
        aiExtracted:   true,
        aiModel:       'claude-sonnet-4-20250514',
        aiExtractedAt: new Date().toISOString(),
        sourceFormat:  isOcr ? 'pdf_ocr' : 'pdf_text',
        via:           'vercel-function',
      },
      _catColor: catColor,
      _catLabel: catLabel,
    };

    _pStep(3, 'done');
    _pProgress(100, '完了');

    _pdfShowResult(_pdfResult);
    if (typeof showToast === 'function') showToast('✅ PDF解析完了！内容を確認してください');

  } catch(err) {
    console.error('[PDF] pipeline error:', err);
    // アクティブなステップをエラーに
    PDF_STEPS.forEach(id => {
      const el = document.getElementById(id);
      if (el?.classList.contains('active')) el.className = 'pdf-step err';
    });
    _pdfShowError(err.message || 'PDF解析に失敗しました');
    if (typeof showToast === 'function') showToast('⚠️ PDF解析失敗');
  } finally {
    _pdfBusy = false;
  }
}

// ================================================================
// 結果表示
// ================================================================
function _pdfShowResult(data) {
  const box   = document.getElementById('pdf-result-box');
  const title = document.getElementById('pdf-result-title');
  const rows  = document.getElementById('pdf-result-rows');
  if (!box) return;

  title.textContent = data.title || '抽出結果（要確認）';

  const conf  = data.aiConfidence || 0;
  const cls   = conf >= .72 ? 'pdf-ch' : conf >= .42 ? 'pdf-cm' : 'pdf-cl';
  const confTx = conf >= .72 ? `✅ 信頼度 高 (${Math.round(conf*100)}%)` :
                 conf >= .42 ? `⚠️ 要確認 (${Math.round(conf*100)}%)` :
                               `❌ 信頼度 低 — 手動修正推奨`;

  const pref = (typeof _PREF_MAP !== 'undefined' && data.prefecture)
    ? (_PREF_MAP[data.prefecture] || data.prefecture) : (data.prefecture || '');

  const catHtml = data._catLabel
    ? `<div style="margin-bottom:8px;"><span class="pdf-cat" style="background:${data._catColor};">${_e(data._catLabel)}</span></div>` : '';

  const fields = [
    ['大会名',    data.title],
    ['開催日',    data.startDate ? `${data.startDate}${data.endDate&&data.endDate!==data.startDate?' 〜 '+data.endDate:''}` : null],
    ['締切',      data.entryDeadline],
    ['ゴルフ場',  data.course],
    ['都道府県',  pref],
    ['主催者',    data.organizer],
    ['賞金',      data.prize],
    ['参加費',    data.entryFee],
    ['定員',      data.capacity],
    ['公式URL',   data.officialUrl],
    ['備考',      data.notes],
  ];

  rows.innerHTML =
    `<div class="pdf-conf ${cls}">${confTx}</div>` + catHtml +
    fields.filter(([,v]) => v).map(([l,v]) =>
      `<div class="url-result-row"><span class="url-result-label">${l}</span><span class="url-result-val">${_e(v)}</span></div>`
    ).join('');

  box.classList.add('show');
  document.getElementById('pdf-error-box')?.classList.remove('show');
  document.getElementById('pdf-confirm-btn').style.display = '';
  _pProgress(0, '');
}

function _pdfShowError(msg) {
  const eb = document.getElementById('pdf-error-box');
  if (!eb) return;
  eb.innerHTML = `
    <div style="margin-bottom:8px;">⚠️ ${_e(msg)}</div>
    <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
      <button onclick="_pdfRetry()" style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:9px;font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;background:#f0fdf6;border:1.5px solid rgba(57,200,146,.4);color:#0B7A44;">↺ リトライ</button>
      <button onclick="_pdfManual()" style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:9px;font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;background:#f5f5f7;border:1.5px solid rgba(0,0,0,.1);color:#3a3a3c;">✏️ 手動入力</button>
    </div>`;
  eb.classList.add('show');
  document.getElementById('pdf-result-box')?.classList.remove('show');
  document.getElementById('pdf-confirm-btn').style.display = 'none';
  _pProgress(0, '');
  document.getElementById('pdf-steps')?.classList.remove('show');
}

// ================================================================
// 公開ハンドラ
// ================================================================

// ドロップゾーンに PDF をドロップ
window.pdfDrop = async function(event) {
  event.preventDefault();
  document.getElementById('pdf-dropzone')?.classList.remove('pdf-dz-over');
  const file = event.dataTransfer?.files?.[0];
  if (file) await pdfFileSelected(file);
};

// ファイル選択（input[type=file]）
window.pdfFileSelected = async function(file) {
  if (!file) return;
  if (!file.type.includes('pdf')) {
    _pdfShowError('PDFファイルを選択してください（選択: ' + file.type + '）');
    return;
  }
  // ドロップゾーンにファイル名を表示
  const dz = document.getElementById('pdf-dropzone');
  if (dz) {
    document.getElementById('pdf-dz-icon').textContent = '📋';
    document.getElementById('pdf-dz-label').textContent = file.name;
    dz.querySelector('div:last-child').textContent = (file.size/1024).toFixed(0) + ' KB';
  }
  const buf = await file.arrayBuffer();
  await _pdfPipeline(buf, file.name, file.name);
};

// PDF URL から解析
window.pdfFromUrl = async function() {
  if (_pdfBusy) return;
  const url = document.getElementById('pdf-url-input')?.value?.trim();
  if (!url || !url.startsWith('http')) {
    _pdfShowError('有効な PDF URL を入力してください（https://... ）');
    return;
  }
  const btn = document.getElementById('pdf-url-btn');
  if (btn) { btn.disabled = true; btn.textContent = '取得中…'; }

  let buf;
  try {
    // allorigins.win raw プロキシ経由でバイナリ取得
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      url,
    ];
    let fetched = false;
    for (const pUrl of proxies) {
      try {
        const res = await fetch(pUrl, { signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        buf = await res.arrayBuffer();
        fetched = true;
        break;
      } catch(e) { console.warn('[PDF] fetch 試行失敗:', e.message); }
    }
    if (!fetched) throw new Error('PDF を取得できませんでした（CORS 制限の可能性あり）');
  } catch(e) {
    _pdfShowError(e.message);
    if (btn) { btn.disabled = false; btn.textContent = '解析'; }
    return;
  }

  if (btn) { btn.disabled = false; btn.textContent = '解析'; }
  await _pdfPipeline(buf, url, url);
};

// 「この内容で追加する」→ 既存 confirmUrlResult() フローへ
window.pdfConfirm = function() {
  if (!_pdfResult) return;
  // _urlParseResult に PDF 結果をセットして既存フローを流用
  _urlParseResult = _pdfResult;
  console.log('[PDF] confirm → confirmUrlResult(), title:', _pdfResult.title);
  confirmUrlResult();
};

// リトライ
window._pdfRetry = function() {
  const input = document.getElementById('pdf-url-input');
  if (input?.value?.trim()) { pdfFromUrl(); }
  else { _pHideAll(); document.getElementById('pdf-dropzone')?.click(); }
};

// 手動フォールバック
window._pdfManual = function() {
  _urlParseResult = {
    title:'', name:'', category:'', gender:'mens', region:'domestic',
    area:'', prefecture:'', course:'', courseName:'', organizer:'', status:'tbd',
    startDate:null, endDate:null, entryDeadline:null, cancelDeadline:null,
    prize:'', prizeWinner:'', entryFee:'', practiceRoundFee:'',
    entryMethod:'', qualification:'', capacity:'', notes:'',
    links:{website:'',official:'',instagram:'',entry:'',pairing:'',result:''},
    officialUrl:'', igUrl:'', entryUrl:'',
    sourceUrl:'', sourceType:'ai_pdf', parsingStatus:'manual',
    aiConfidence:0, rawContent:'', extractedText:'',
    metadata:{aiExtracted:false}, _catColor:'#8090A0', _catLabel:'',
  };
  confirmUrlResult();
};

// ── HTML エスケープ ──
function _e(s) {
  return String(s||'').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ================================================================
// 管理画面に PDF 解析ボタンを追加
// ================================================================
(function addPdfBtn() {
  function inject() {
    if (document.getElementById('admin-pdf-btn')) return;
    const urlBtn = document.querySelector('.admin-url-btn');
    if (!urlBtn) return;
    const btn = document.createElement('button');
    btn.id = 'admin-pdf-btn';
    btn.className = 'admin-url-btn admin-only';
    btn.style.cssText = 'background:#fff;color:#C03030;border:1.5px solid rgba(192,48,48,.25);margin-left:4px;';
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9" stroke-linejoin="round"/></svg> PDF解析`;
    btn.onclick = function() {
      if (typeof openUrlModal === 'function') openUrlModal();
      setTimeout(() => pmtTab('pdf'), 60);
    };
    urlBtn.parentNode.insertBefore(btn, urlBtn.nextSibling);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(inject, 500), { once: true });
  } else {
    setTimeout(inject, 500);
  }
})();

console.info(
  '%c[PDF解析 v1]%c pdf.js + Tesseract.js + /api/parseTournament 完全接続',
  'background:#C03030;color:#fff;padding:2px 8px;border-radius:3px;font-weight:800;',
  'color:#C03030;font-weight:600;'
);

})();
(function(){
'use strict';

/* ── DOM生成（初回1回） ── */
function _buildDOM() {
  if (document.getElementById('catsel-overlay')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div id="catsel-overlay">
      <div id="catsel-sheet">
        <div id="catsel-handle"></div>
        <div id="catsel-header">
          <span id="catsel-title">カテゴリを選択</span>
          <button id="catsel-close" aria-label="閉じる"
            onclick="catselClose();"
            ontouchend="event.preventDefault();event.stopPropagation();catselClose();">✕</button>
        </div>
        <div id="catsel-reorder-bar">
          <span id="catsel-reorder-label">カテゴリをタップして選択</span>
        </div>
        <div id="catsel-scroll">
          <div id="catsel-grid"></div>
        </div>
      </div>
    </div>
  `);
  const ov = document.getElementById('catsel-overlay');
  ov.addEventListener('click',    function(e){ if(e.target===this) catselClose(); });
  ov.addEventListener('touchend', function(e){ if(e.target===this){ e.preventDefault(); catselClose(); }}, {passive:false});
}

/* ── グリッド描画 (personal固定 + userEnabledCategories のみ) ── */
function _renderGrid() {
  const grid = document.getElementById('catsel-grid');
  if (!grid) return;
  const visible = (typeof CATEGORIES!=='undefined')
    ? CATEGORIES.filter(c => c.key==='personal' || (typeof userEnabledCategories!=='undefined' && userEnabledCategories.includes(c.key)))
    : [];

  grid.innerHTML = visible.map(c => {
    const selStyle  = `border-color:${c.color}66;`;
    return `<div class="cat-item is-enabled" style="${selStyle}"
               data-catsel-key="${c.key}">
              <div class="cat-color-dot" style="background:${c.color}"></div>
              <div style="flex:1;">
                <div class="cat-name">${c.label}</div>
                <div class="cat-desc">${c.desc}</div>
              </div>
              <div class="cat-check" style="color:${c.color}">✓</div>
            </div>`;
  }).join('')
  + `<button id="catsel-add-btn"
       onclick="catselClose();setTimeout(function(){if(typeof openAddCatSheet==='function')openAddCatSheet();},80);">
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
       カテゴリを追加
     </button>`;

  /* タップハンドラ */
  grid.querySelectorAll('[data-catsel-key]').forEach(function(el) {
    const key = el.dataset.catselKey;
    el.addEventListener('touchstart', function(){ el.style.transform='scale(0.96)'; }, {passive:true});
    el.addEventListener('touchcancel', function(){ el.style.transform=''; }, {passive:true});
    el.addEventListener('touchend', function(e){
      e.preventDefault(); e.stopPropagation();
      el.style.transform = '';
      _onSelect(key);
    }, {passive:false});
    el.addEventListener('click', function(e){
      e.stopPropagation();
      _onSelect(key);
    });
  });
}

/* ── カテゴリ選択 → 既存フローに接続 ──
   修正ポイント:
   selectCatAuto は getElementById('cat-'+key) で既存 modal-overlay 内の要素を探す。
   catsel には id="cat-{key}" がないため null クラッシュになる。
   → selectCatAuto を使わず同等ロジックを直接実行する。
   → modal-overlay を先に show してから goStep/prefillForm を呼ぶ。
*/
function _onSelect(key) {
  /* catsel を閉じる（選択したので modal-overlay のリセットはしない） */
  const ov = document.getElementById('catsel-overlay');
  if (ov) ov.classList.remove('open');

  setTimeout(function(){
    /* selectedCat・selectedTour をセット */
    if (typeof window.selectedCat  !== 'undefined') window.selectedCat  = key;
    if (typeof window.selectedTour !== 'undefined') window.selectedTour = null;

    /* ★ 修正①: modalPresetDate / selectedDate を prefillForm 呼び出し直前に
       確実に保持しておく。patchOpenModal が _orig(ds,null) で設定済みの値を
       ここで読み出し、undefined/null の場合は今日付を保険として使う。      */
    const _presetDs = (typeof modalPresetDate !== 'undefined' && modalPresetDate)
                    ? modalPresetDate
                    : (typeof selectedDate !== 'undefined' && selectedDate)
                    ? selectedDate
                    : (typeof todayStr === 'function' ? todayStr() : new Date().toISOString().slice(0,10));
    /* 念のため両変数を同じ値で上書き（競合回避） */
    if (typeof modalPresetDate !== 'undefined') modalPresetDate = _presetDs;
    if (typeof selectedDate    !== 'undefined') selectedDate    = _presetDs;

    /* modal-overlay を show にしてから step 遷移 */
    const mainOv = document.getElementById('modal-overlay');
    if (mainOv) mainOv.classList.add('show');

    if (key === 'personal') {
      /* 個人予定 → step3（詳細入力）へ直接 */
      if (typeof goStep      === 'function') goStep(3);
      if (typeof prefillForm === 'function') prefillForm(null);
    } else {
      /* ツアー系 → step2（大会選択）へ */
      const srch = document.getElementById('tour-search');
      if (srch) srch.value = '';
      if (typeof renderTourList === 'function') renderTourList();
      if (typeof goStep         === 'function') goStep(2);
    }
  }, 50);
}

/* ── 開く ── */
window.catselOpen = function() {
  _buildDOM();
  _renderGrid();
  const sc = document.getElementById('catsel-scroll');
  if (sc) sc.scrollTop = 0;
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      const ov = document.getElementById('catsel-overlay');
      if (ov) ov.classList.add('open');
    });
  });
};

/* ── 閉じる ── */
window.catselClose = function(keepMainOv) {
  const ov = document.getElementById('catsel-overlay');
  if (ov) ov.classList.remove('open');
  /* keepMainOv が指定されていない場合（✕ボタン・overlay タップ）は
     modal-overlay も閉じてフローを完全キャンセル */
  if (!keepMainOv) {
    const mainOv = document.getElementById('modal-overlay');
    if (mainOv) mainOv.classList.remove('show');
  }
};

/* ── openModal をラップ: 新規追加時のみ catsel を使う ── */
(function patchOpenModal(){
  function patch(){
    if (typeof window.openModal !== 'function') return;
    const _orig = window.openModal;
    window.openModal = function(ds, editId){
      if (editId) {
        /* 編集モード → 既存フローそのまま */
        _orig(ds, editId);
      } else {
        /* 新規追加 → state だけ設定して catsel を開く */
        _orig(ds, null);                              // state(modalPresetDate等)設定
        const mainOv = document.getElementById('modal-overlay');
        if (mainOv) mainOv.classList.remove('show'); // catsel 表示中は非表示
        catselOpen();
      }
    };
  }
  if (document.readyState==='loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(patch,100); }, {once:true});
  } else { setTimeout(patch,100); }
})();

/* ── addCatFromSheet/removeCatFromSheet 後に再描画 ── */
(function patchCatSheet(){
  function patch(){
    ['addCatFromSheet','removeCatFromSheet'].forEach(function(fname){
      if (typeof window[fname]!=='function') return;
      var _orig = window[fname];
      window[fname] = function(){
        _orig.apply(this, arguments);
        var ov = document.getElementById('catsel-overlay');
        if (ov && ov.classList.contains('open')) _renderGrid();
      };
    });
  }
  if (document.readyState==='loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(patch,200); }, {once:true});
  } else { setTimeout(patch,200); }
})();

console.info('%c[catsel]%c カテゴリ選択モーダル 初期化完了',
  'background:#6B6ED4;color:#fff;padding:2px 8px;border-radius:3px;font-weight:700;',
  'color:#4a4da0;font-weight:600;');
})();