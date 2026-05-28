
/* ================================================================
   STEP180c: User MyPage visible fix
   ================================================================ */
(function(){
  if (window.__PNX_STEP180C_USER_MYPAGE__) return;
  window.__PNX_STEP180C_USER_MYPAGE__ = true;

  function init(){
    const root = document.getElementById("mypage-root");
    if (!root) return false;
    root.classList.add("is-ready");
    root.querySelectorAll("nav.bottom-nav,.bottom-nav,.tab-bar,#tab-bar,footer").forEach(el => {
      el.style.display = "none";
      el.setAttribute("aria-hidden","true");
    });
    window.__PNX_STEP180C_MYPAGE_LAST_INIT__ = new Date().toISOString();
    return true;
  }

  document.addEventListener("DOMContentLoaded", init);
  setTimeout(init, 300);
  window.PNXStep180cMyPageInit = init;
  window.PNXStep180cMyPageStatus = function(){
    return {
      step:"180c",
      rootExists:!!document.getElementById("mypage-root"),
      userScreenExists:!!document.querySelector("#pnx-mypage-screen,.pnx-mypage-screen"),
      title:document.querySelector(".pnx-mypage-title,h1")?.textContent || null,
      lastInit:window.__PNX_STEP180C_MYPAGE_LAST_INIT__ || null,
      note:"ユーザー作成マイページを本体page-mypageに表示"
    };
  };
})();


/* ===== User uploaded mypage.js ===== */
/* ============================================================
   ProNexaX — マイページ
   Scoped to #pnx-mypage-screen. Safe to drop into the main app:
   it queries only inside the screen root and never touches
   document-level handlers.
   ============================================================ */
(function () {
  "use strict";

  function initMyPage(root) {
    root = root || document.getElementById("pnx-mypage-screen");
    if (!root || root.dataset.myPageInited === "1") return;
    root.dataset.myPageInited = "1";

    // --- Menu / row click handlers ---------------------------------
    var rows = root.querySelectorAll("[data-myPage-action]");
    rows.forEach(function (el) {
      el.addEventListener("click", function (e) {
        var action = el.getAttribute("data-myPage-action");
        // Replace with real routing when integrated into the app shell.
        // eslint-disable-next-line no-console
        console.log("[mypage] action:", action);
      });

      // Touch feedback: brief press state for non-mouse devices.
      el.addEventListener("touchstart", function () {
        el.classList.add("is-pressed");
      }, { passive: true });
      el.addEventListener("touchend", function () {
        el.classList.remove("is-pressed");
      });
      el.addEventListener("touchcancel", function () {
        el.classList.remove("is-pressed");
      });
    });

    // --- Bottom nav -------------------------------------------------
    var tabs = root.querySelectorAll("[data-myPage-tab]");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var name = tab.getAttribute("data-myPage-tab");
        // eslint-disable-next-line no-console
        console.log("[mypage] tab:", name);
        // Visual selection stays on マイページ for this standalone preview.
        // When integrated, the host shell will own tab state.
      });
    });
  }

  // Expose for app-shell integration; harmless globally because it's
  // a single named function on window, not a bunch of helpers.
  window.initMyPage = initMyPage;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { initMyPage(); });
  } else {
    initMyPage();
  }
})();


/* ================================================================
   STEP208: MyPage blue theme inline style patch
   ================================================================ */
(function(){
  if (window.__PNX_STEP208_MYPAGE_BLUE_THEME__) return;
  window.__PNX_STEP208_MYPAGE_BLUE_THEME__ = true;

  function blueifyInlineStyles(){
    const root = document.getElementById("mypage-root");
    if (!root) return false;

    const map = [
      ["#10B981", "#0A74FF"],
      ["#34D399", "#4DA1FF"],
      ["#0F8A63", "#1366E8"],
      ["rgb(16,185,129)", "rgb(10,116,255)"],
      ["rgb(16, 185, 129)", "rgb(10, 116, 255)"],
      ["rgb(52,211,153)", "rgb(77,161,255)"],
      ["rgb(52, 211, 153)", "rgb(77, 161, 255)"],
      ["rgba(16,185,129", "rgba(10,116,255"],
      ["rgba(16, 185, 129", "rgba(10, 116, 255"],
      ["#E8FFF6", "#F0F7FF"],
      ["#F4FFF9", "#F4F9FF"]
    ];

    root.querySelectorAll("[style]").forEach(el => {
      let s = el.getAttribute("style") || "";
      const before = s;
      map.forEach(([from, to]) => { s = s.split(from).join(to); });
      if (s !== before) el.setAttribute("style", s);
    });

    root.classList.remove("pnx-step180i-green-theme");
    root.classList.add("pnx-step208-blue-theme");
    window.__PNX_STEP208_BLUE_THEME_LAST_APPLY__ = new Date().toISOString();
    return true;
  }

  document.addEventListener("DOMContentLoaded", blueifyInlineStyles);
  setTimeout(blueifyInlineStyles, 300);
  setTimeout(blueifyInlineStyles, 1000);

  window.PNXStep208ApplyMyPageBlueTheme = blueifyInlineStyles;
  window.PNXStep208MyPageBlueThemeStatus = function(){
    return {
      step:"208",
      root:!!document.getElementById("mypage-root"),
      applied:document.getElementById("mypage-root")?.classList.contains("pnx-step208-blue-theme") || false,
      lastApply:window.__PNX_STEP208_BLUE_THEME_LAST_APPLY__ || null,
      note:"マイページの緑アクセントをカレンダー画面寄りの青へ統一"
    };
  };

  // 旧チェック名を参照している場合でも落ちないように互換だけ残す。
  window.PNXStep180iApplyMyPageGreenTheme = blueifyInlineStyles;
  window.PNXStep180iMyPageGreenThemeStatus = window.PNXStep208MyPageBlueThemeStatus;
})();


/* ================================================================
   STEP180i: MyPage header no title marker
   ================================================================ */
(function(){
  if (window.__PNX_STEP180I_MYPAGE_HEADER_NO_TITLE__) return;
  window.__PNX_STEP180I_MYPAGE_HEADER_NO_TITLE__ = true;

  function hideMyPageHeaderTitle(){
    const root = document.getElementById("mypage-root");
    if (!root) return false;

    const titles = [
      root.querySelector(".pnx-mypage-title"),
      root.querySelector(".mp180-header h1"),
      root.querySelector("header h1")
    ].filter(Boolean);

    titles.forEach(title => {
      title.style.setProperty("display", "none", "important");
      title.setAttribute("aria-hidden", "true");
    });

    root.querySelectorAll(".pnx-mypage-header-refine-sub").forEach(el => {
      el.style.setProperty("display", "none", "important");
      el.setAttribute("aria-hidden", "true");
    });

    root.classList.remove("pnx-step180i-mypage-header-simple");
    root.classList.add("pnx-step180i-mypage-header-no-title");
    window.__PNX_STEP180I_MYPAGE_HEADER_NO_TITLE_LAST_APPLY__ = new Date().toISOString();
    return true;
  }

  document.addEventListener("DOMContentLoaded", hideMyPageHeaderTitle);
  setTimeout(hideMyPageHeaderTitle, 300);
  setTimeout(hideMyPageHeaderTitle, 1000);

  window.PNXStep180iHideMyPageHeaderTitle = hideMyPageHeaderTitle;
  window.PNXStep180iMyPageHeaderNoTitleStatus = function(){
    const root = document.getElementById("mypage-root");
    const title = root ? (root.querySelector(".pnx-mypage-title") || root.querySelector(".mp180-header h1") || root.querySelector("header h1")) : null;
    return {
      step:"180i-mypage-header-no-title",
      rootExists:!!root,
      applied:!!root && root.classList.contains("pnx-step180i-mypage-header-no-title"),
      titleExists:!!title,
      titleDisplay:title ? getComputedStyle(title).display : null,
      titleText:title ? title.textContent : null,
      lastApply:window.__PNX_STEP180I_MYPAGE_HEADER_NO_TITLE_LAST_APPLY__ || null,
      note:"画面上部のマイページタイトルだけ非表示。下部ナビは維持。"
    };
  };
})();


/* ================================================================
   STEP182c: MyPage profile open bridge with return lock
   ================================================================ */
(function(){
  if (window.__PNX_STEP182C_MYPAGE_PROFILE_OPEN_LOCK__) return;
  window.__PNX_STEP182C_MYPAGE_PROFILE_OPEN_LOCK__ = true;

  function parentReturnLocked(){
    try {
      return !!(window.parent && window.parent.__PNX_PROFILE_RETURN_LOCK_UNTIL__ && Date.now() < window.parent.__PNX_PROFILE_RETURN_LOCK_UNTIL__);
    } catch(e) {
      return false;
    }
  }

  function openProfileInParent(){
    if (parentReturnLocked()) return false;

    try {
      if (window.parent && typeof window.parent.PNXOpenProfilePage === "function") {
        return window.parent.PNXOpenProfilePage();
      }
    } catch(e) {}

    try {
      window.parent.postMessage({ type:"PNX_OPEN_PROFILE", page:"profile", source:"mypage-step182c" }, "*");
      return true;
    } catch(e) {}

    return false;
  }

  function bindProfileTriggers(){
    const root = document.getElementById("mypage-root") || document;

    const selectors = [
      "[data-profile-open='true']",
      "[data-myPage-action='profile']",
      "[data-mypage-action='profile']",
      "[data-action='profile']",
      "[href='#profile']",
      "[href='#page-profile']",
      ".pnx-mypage-profile",
      ".pnx-mypage-profile-card",
      ".mp180-profile-card",
      ".profile-card"
    ];

    root.querySelectorAll(selectors.join(",")).forEach(el => {
      if (el.__pnxStep182cProfileTriggerBound) return;
      el.__pnxStep182cProfileTriggerBound = true;
      el.setAttribute("data-profile-open", "true");
      el.style.cursor = "pointer";

      el.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        openProfileInParent();
      }, true);
    });

    window.__PNX_STEP182C_MYPAGE_PROFILE_BRIDGE_LAST_BIND__ = {
      at:new Date().toISOString(),
      count:root.querySelectorAll(selectors.join(",")).length
    };
    return true;
  }

  document.addEventListener("DOMContentLoaded", bindProfileTriggers);
  setTimeout(bindProfileTriggers, 200);
  setTimeout(bindProfileTriggers, 800);
  setTimeout(bindProfileTriggers, 1600);

  window.PNXStep182cOpenProfileInParent = openProfileInParent;
  window.PNXStep182cBindMyPageProfileBridge = bindProfileTriggers;
  window.PNXStep182cMyPageProfileBridgeStatus = function(){
    const selectors = "[data-profile-open='true'],[data-myPage-action='profile'],[data-mypage-action='profile'],[data-action='profile'],.pnx-mypage-profile,.pnx-mypage-profile-card,.mp180-profile-card,.profile-card";
    return {
      step:"182c-mypage",
      rootExists:!!document.getElementById("mypage-root"),
      triggerCount:document.querySelectorAll(selectors).length,
      parentReturnLocked:parentReturnLocked(),
      lastBind:window.__PNX_STEP182C_MYPAGE_PROFILE_BRIDGE_LAST_BIND__ || null,
      note:"戻った直後のプロフィール再オープンをロック"
    };
  };
})();
