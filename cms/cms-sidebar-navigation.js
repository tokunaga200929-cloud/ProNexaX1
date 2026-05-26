/* ================================================================
   STEP78: CMS Sidebar Navigation Production Router
   左メニュークリックを確実に拾い、ReactのactiveNavへ反映する本番用処理
   ================================================================ */
(function(){
  if (window.__PNX_STEP78_SIDEBAR_NAV_ROUTER__) return;
  window.__PNX_STEP78_SIDEBAR_NAV_ROUTER__ = true;

  const routeMap = [
    ["ダッシュボード", "dashboard"],
    ["ホーム", "home"],
    ["試合検索", "match"],
    ["カレンダー", "calendar"],
    ["大会詳細", "details"],
    ["ニュース", "news"],
    ["記事", "news"],
    ["レッスン動画", "lesson"],
    ["お知らせ", "notice"],
    ["マイページ", "mypage"],
    ["バナー管理", "banner"],
    ["アイコン管理", "icons"],
    ["カラー設定", "colors"],
    ["メニュー設定", "menu"],
    ["テキスト管理", "text"],
    ["画像", "media-all"],
    ["動画一覧", "media-all"],
    ["メディアライブラリ", "media-all"],
    ["設定", "settings"],
  ];

  function normalize(text){
    return String(text || "").replace(/\s+/g, "").trim();
  }

  function navFromText(text){
    const t = normalize(text);
    for (const [label, nav] of routeMap) {
      if (t.includes(normalize(label))) return nav;
    }
    return "";
  }

  function setActiveClass(target, nav){
    const sidebar = target && (
      target.closest(".side") ||
      target.closest(".sidebar") ||
      target.closest("aside") ||
      document.querySelector(".side") ||
      document.querySelector(".sidebar") ||
      document.querySelector("aside")
    );

    if (!sidebar) return;

    sidebar.querySelectorAll(".active, .is-active, [aria-current='page']").forEach(el => {
      el.classList.remove("active", "is-active");
      el.removeAttribute("aria-current");
    });

    const item = target.closest(".side__item, button, a, li, div") || target;
    if (item) {
      item.classList.add("active", "is-active");
      item.setAttribute("aria-current", "page");
    }
  }

  function go(nav, target){
    if (!nav) return false;

    document.body.dataset.cmsActiveNav = nav;
    try { setActiveClass(target || document.body, nav); } catch(e) {}

    window.dispatchEvent(new CustomEvent("pnx:cms:force-nav", {
      detail: { nav, source: "step78-production-router", at: new Date().toISOString() }
    }));

    return true;
  }

  document.addEventListener("click", function(e){
    const target = e.target;
    if (!target || !target.closest) return;

    const sidebar = target.closest(".side, .sidebar, aside, nav.side__nav, [class*='side']");
    if (!sidebar) return;

    const clickable = target.closest(".side__item, button, a, li, div, span");
    if (!clickable) return;

    const nav = navFromText(clickable.textContent);
    if (!nav) return;

    go(nav, clickable);
  }, true);

  window.PNXGoCmsNav = function(nav){
    return go(nav, document.body);
  };
})();
