/* =========================================================
   ProNexaX - プロフィール詳細画面
   グローバル汚染を避けるため即時実行関数でまとめる
   ========================================================= */
(function initProfilePage() {
  "use strict";

  const screen = document.getElementById("pnx-profile-screen");
  if (!screen) return;

  // ---- ヘッダー: 戻る ----
  const backBtn = screen.querySelector('[data-action="back"]');
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      console.log("back to mypage");
    });
  }

  // ---- ヘッダー: 編集 ----
  const editBtn = screen.querySelector('[data-action="edit"]');
  if (editBtn) {
    editBtn.addEventListener("click", function () {
      console.log("edit profile");
    });
  }

  // ---- プロフィール画像を変更 ----
  const changeImageBtn = screen.querySelector('[data-action="change-image"]');
  if (changeImageBtn) {
    changeImageBtn.addEventListener("click", function () {
      console.log("change profile image");
    });
  }

  // ---- PROを見る ----
  const viewProBtn = screen.querySelector('[data-action="view-pro"]');
  if (viewProBtn) {
    viewProBtn.addEventListener("click", function () {
      console.log("view pro plan");
    });
  }

  // ---- 各行クリック ----
  const rowLogMap = {
    "name": "row: 名前",
    "email": "row: メールアドレス",
    "phone": "row: 電話番号",
    "user-type": "row: ユーザー種別",
    "area": "row: 活動エリア",
    "category": "row: よく見る大会カテゴリ",
    "base": "row: 所属・拠点",
    "public-profile": "row: 公開プロフィール",
    "notify-email": "row: 通知用メール",
    "change-password": "row: パスワード変更",
    "logout": "row: ログアウト"
  };

  const rows = screen.querySelectorAll(".pnx-profile-list__row");
  rows.forEach(function (row) {
    const key = row.getAttribute("data-row");
    const handler = function () {
      const label = rowLogMap[key] || ("row: " + key);
      console.log(label);
      if (key === "logout") {
        console.log("logout tapped");
      }
    };
    row.addEventListener("click", handler);
    row.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handler();
      }
    });
  });

  console.log("pnx-profile-screen initialized");
})();


/* =========================================================
   STEP182c: one tap back bridge
   ========================================================= */
(function initProfilePageBridgeOneTapBack(){
  if (window.__PNX_STEP182C_PROFILE_BACK_ONE_TAP__) return;
  window.__PNX_STEP182C_PROFILE_BACK_ONE_TAP__ = true;

  const STORAGE_KEY = "PNX_MYPAGE_PROFILE_V1";
  const LEGACY_KEY = "PNX_MYPAGE_PROFILE";

  function safeParse(value){
    try { return value ? JSON.parse(value) : null; }
    catch(e){ return null; }
  }

  function getProfile(){
    const current = safeParse(localStorage.getItem(STORAGE_KEY)) || safeParse(localStorage.getItem(LEGACY_KEY)) || {};
    return {
      displayName: current.displayName || current.name || "徳永 圭祐",
      email: current.email || "keisuke@example.com",
      plan: current.plan || "FREE",
      area: current.area || "関東",
      title: current.title || current.sub || "研修生",
      phone: current.phone || "090-1234-5678",
      category: current.category || "ミニツアー・県オープン",
      base: current.base || current.area || "埼玉"
    };
  }

  function setText(selector, text){
    const el = document.querySelector(selector);
    if (el) el.textContent = text;
  }

  function renderProfile(){
    const p = getProfile();
    setText(".pnx-profile-userCard__name", p.displayName);
    setText(".pnx-profile-userCard__email", p.email);
    setText(".pnx-profile-badge", String(p.plan).toUpperCase());
    setText(".pnx-profile-planCard__value", String(p.plan).toUpperCase());

    const values = {
      name:p.displayName,
      email:p.email,
      phone:p.phone,
      "user-type":p.title,
      area:p.area,
      category:p.category,
      base:p.base,
      "notify-email":p.email
    };

    document.querySelectorAll(".pnx-profile-list__row").forEach(row => {
      const key = row.getAttribute("data-row");
      const value = row.querySelector(".pnx-profile-list__value");
      if (value && values[key]) value.textContent = values[key];
    });

    window.__PNX_STEP182C_PROFILE_LAST_RENDER__ = {
      at:new Date().toISOString(),
      profile:p
    };
    return p;
  }

  function goBack(event){
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    }

    // 重複タップ・click二重発火対策
    const now = Date.now();
    if (window.__PNX_STEP182C_BACK_LOCK_UNTIL__ && now < window.__PNX_STEP182C_BACK_LOCK_UNTIL__) {
      return false;
    }
    window.__PNX_STEP182C_BACK_LOCK_UNTIL__ = now + 700;

    let called = false;

    try {
      if (window.parent && typeof window.parent.PNXStep182cBackToMyPage === "function") {
        window.parent.PNXStep182cBackToMyPage();
        called = true;
      }
    } catch(e) {}

    try {
      if (window.parent && typeof window.parent.PNXStep182bOpenMyPageFromProfile === "function") {
        window.parent.PNXStep182bOpenMyPageFromProfile();
        called = true;
      }
    } catch(e) {}

    try {
      window.parent.postMessage({
        type:"PNX_PROFILE_BACK_TO_MYPAGE",
        page:"mypage",
        source:"profile-page-step182c",
        ts:Date.now()
      }, "*");
      called = true;
    } catch(e) {}

    window.__PNX_STEP182C_LAST_BACK__ = {
      at:new Date().toISOString(),
      called
    };

    return false;
  }

  function bindBridge(){
    const screen = document.getElementById("pnx-profile-screen");
    if (!screen) return false;

    const back = screen.querySelector('[data-action="back"],[data-pnx-profile-back="true"],.pnx-profile-header__back');
    if (back && !back.__pnxStep182cBackBound) {
      back.__pnxStep182cBackBound = true;
      back.setAttribute("data-pnx-profile-back", "true");
      back.setAttribute("onclick", "return window.PNXStep182cProfileBack && window.PNXStep182cProfileBack(event)");
      back.addEventListener("click", goBack, true);
      back.addEventListener("touchend", goBack, true);
    }

    const edit = screen.querySelector('[data-action="edit"]');
    if (edit && !edit.__pnxStep182cEditBound) {
      edit.__pnxStep182cEditBound = true;
      edit.addEventListener("click", function(e){
        e.preventDefault();
        try {
          window.parent.postMessage({ type:"PNX_OPEN_PROFILE_EDIT", source:"profile-page-step182c" }, "*");
        } catch(err) {}
      }, true);
    }

    return true;
  }

  function init(){
    bindBridge();
    renderProfile();
    window.__PNX_STEP182C_PROFILE_PAGE_LAST_INIT__ = new Date().toISOString();
    return true;
  }

  document.addEventListener("DOMContentLoaded", init);
  setTimeout(init, 150);
  setTimeout(init, 600);
  setTimeout(init, 1200);

  window.PNXStep182cProfileBack = goBack;
  window.PNXStep182cProfileGoBack = goBack;
  window.PNXStep182cProfilePageStatus = function(){
    const back = document.querySelector('[data-action="back"],[data-pnx-profile-back="true"],.pnx-profile-header__back');
    return {
      step:"182c-profile",
      screenExists:!!document.getElementById("pnx-profile-screen"),
      backExists:!!back,
      backBound:!!back && !!back.__pnxStep182cBackBound,
      editExists:!!document.querySelector('[data-action="edit"]'),
      lastInit:window.__PNX_STEP182C_PROFILE_PAGE_LAST_INIT__ || null,
      lastBack:window.__PNX_STEP182C_LAST_BACK__ || null,
      lastRender:window.__PNX_STEP182C_PROFILE_LAST_RENDER__ || null,
      note:"戻るボタンを1回押しでマイページへ戻す"
    };
  };
})();
