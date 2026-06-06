/* ===== ProNexaX 遠征トップ / ホテル画面 — data + render ===== */
(function () {
  "use strict";

  var I = {
    info:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 10v6"/><path d="M12 7h.01"/></svg>',
    bell:
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
    back:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    calendar:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    pin:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    pinFill:
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a8 8 0 0 0-8 8c0 6 8 12 8 12s8-6 8-12a8 8 0 0 0-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>',
    trophy:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12v4a6 6 0 0 1-12 0V4z"/><path d="M6 6H3v1a3 3 0 0 0 3 3M18 6h3v1a3 3 0 0 1-3 3"/><path d="M9 20h6M12 16v4"/></svg>',
    hotel:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h.01M12 7h.01M15 7h.01M9 11h.01M12 11h.01M15 11h.01M9 15h.01M15 15h.01"/><path d="M10 21v-3a2 2 0 0 1 4 0v3"/></svg>',
    gym:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10v4M5.5 8.5v7M8.2 12h7.6M18.5 8.5v7M21 10v4"/></svg>',
    onsen:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M5 15c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 5 0"/><path d="M5 19c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 5 0"/><path d="M8 11c-1-1-1-2 0-3s1-2 0-3"/><path d="M12 11c-1-1-1-2 0-3s1-2 0-3"/><path d="M16 11c-1-1-1-2 0-3s1-2 0-3"/></svg>',
    plane:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a.5.5 0 0 0-.5.8l3.9 4-1.6 3-2-.4a.5.5 0 0 0-.5.7l1.5 2.5 2.5 1.5a.5.5 0 0 0 .7-.5l-.4-2 3-1.6 4 3.9a.5.5 0 0 0 .8-.5z"/></svg>',
    fork:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v6a2 2 0 0 0 4 0V3M8 11v10M18 3c-1.5 0-3 1.8-3 5 0 2.5 1 3.5 2 4v9"/></svg>',
    iconAll:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14M5 12h14M5 17h14"/></svg>',
    iconYakiniku:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8c0-2.2 1.8-4 4-4 1.2 0 2.1.5 3 1.2C13.9 4.5 14.8 4 16 4c2.2 0 4 1.8 4 4 0 4.7-4.7 8-8 10-3.3-2-8-5.3-8-10Z"/><path d="M9.5 8.5c1.1-.8 2.7-.8 3.8 0M11 12h2"/></svg>',
    iconIzakaya:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h8a2 2 0 0 1 2 2v5a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4V7Z"/><path d="M16 9h1.5A2.5 2.5 0 0 1 20 11.5v.5A2.5 2.5 0 0 1 17.5 14H16"/><path d="M8 4h6"/></svg>',
    iconSetmeal:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h16"/><rect x="3" y="6" width="18" height="10" rx="3"/><path d="M8 18h8"/><path d="M9 11h6"/></svg>',
    iconRamen:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11h16"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M9 7V4"/><path d="M12 7V3.5"/><path d="M15 7V4"/></svg>',
    iconCafe:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9h10v4a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z"/><path d="M15 10h1.5A2.5 2.5 0 0 1 19 12.5v0A2.5 2.5 0 0 1 16.5 15H15"/><path d="M7 20h10"/></svg>',
    iconWashoku:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v16"/><path d="M10 4v16"/><path d="M15 4c0 3 1.5 4.5 3 6s2 3 2 5v5"/></svg>',

convenience:
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"/><path d="M7 8V5h10v3"/><path d="M8 12h8"/><path d="M12 12v5"/></svg>',
drug:
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 6 6 10a3 3 0 1 0 4 4l4-4"/><path d="m14 10 4-4a3 3 0 1 0-4-4l-4 4"/><path d="m8 12 4 4"/></svg>',
practice:
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20h14"/><path d="M8 20v-7l7-5 1 2-6 4v6"/><circle cx="8" cy="8" r="2"/></svg>',
gas:
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20V5h8v15"/><path d="M7 9h8"/><path d="M15 7h2l2 2v7a2 2 0 0 0 2 2"/></svg>',
laundry:
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M8 6h.01M11 6h.01M14 6h.01"/></svg>',
parking:
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M10 16V8h3a2 2 0 0 1 0 4h-3"/></svg>',
open24:
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 9c1.2-1.2 2.6-1.8 4-1.8 2.2 0 4 1.6 4 4.1 0 2.2-1.7 4-4 4h-1.5"/><path d="M8.2 14.5H5.8v-2.4"/><path d="M8 18h6"/></svg>',
store:
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Z"/><path d="M3 9 5 4h14l2 5"/><path d="M9 13h6"/></svg>',
    plus:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
    chevron:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    arrow:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    check:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 6"/></svg>',
    link:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/></svg>',
    receipt:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21z"/><path d="M9 8h6M9 12h6"/></svg>',
    checklist:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 3.5h6v3H9z"/><path d="M8.5 12l1.5 1.5L13 10.5M8.5 17h6"/></svg>',
    guide:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>',
    edit:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',
    trash:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 15H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>',
    add:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
    google:
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#fff"/><path d="M12 4a8 8 0 0 1 5.66 2.34l-2.3 2.3A4.8 4.8 0 0 0 12 7.2a4.8 4.8 0 0 0-4.47 3.05L4.8 8.1A8 8 0 0 1 12 4z" fill="#EA4335"/><path d="M4.8 8.1l2.73 2.15A4.8 4.8 0 0 0 7.2 12c0 .6.11 1.18.33 1.72L4.88 15.9A8 8 0 0 1 4 12c0-1.36.33-2.65.8-3.9z" fill="#FBBC05"/><path d="M12 20a8 8 0 0 1-7.12-4.1l2.65-2.18A4.8 4.8 0 0 0 12 16.8c1.13 0 2.17-.38 2.99-1.02l2.58 2A8 8 0 0 1 12 20z" fill="#34A853"/><path d="M20 12c0 .54-.06 1.05-.16 1.55H12v-3.1h7.55c.29.97.45 1.99.45 1.55z" fill="#4285F4"/></svg>',
    // nav
    home:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-7 8 7"/><path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9"/><path d="M6 20v-9h12"/><path d="M10 7v4"/></svg>',
    schedule:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h3M8 18h6M14 14h2"/></svg>',
    flag:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4l11 2.5L5 9"/><path d="M5 4c4 0 6 2 9 1"/></svg>',
    bag:
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 4a2 2 0 0 0-2 2v1H4.5A1.5 1.5 0 0 0 3 8.5V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5A1.5 1.5 0 0 0 19.5 7H17V6a2 2 0 0 0-2-2H9zm0 2h6v1H9V6z"/></svg>',
    chart:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><rect x="5" y="11" width="3" height="7" rx="1"/><rect x="10.5" y="6" width="3" height="12" rx="1"/><rect x="16" y="13" width="3" height="5" rx="1"/></svg>',
    user:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>',
    signal:
      '<svg viewBox="0 0 24 18" width="18" height="13" fill="currentColor"><rect x="0" y="11" width="3.5" height="6" rx="1"/><rect x="5.5" y="8" width="3.5" height="9" rx="1"/><rect x="11" y="4.5" width="3.5" height="12.5" rx="1"/><rect x="16.5" y="1" width="3.5" height="16" rx="1"/></svg>',
    wifi:
      '<svg viewBox="0 0 24 18" width="18" height="13" fill="currentColor"><path d="M12 3C7.7 3 3.8 4.7 1 7.4l2 2C5.4 7.2 8.5 6 12 6s6.6 1.2 9 3.4l2-2C20.2 4.7 16.3 3 12 3z"/><path d="M12 9c-2.6 0-5 1-6.8 2.7l2.1 2.1C8.4 12.7 10.1 12 12 12s3.6.7 4.7 1.8l2.1-2.1C17 10 14.6 9 12 9z"/><circle cx="12" cy="16" r="2"/></svg>',
    battery:
      '<svg viewBox="0 0 28 14" width="26" height="13" fill="none"><rect x="1" y="1" width="22" height="12" rx="3" stroke="currentColor" stroke-width="1.2" opacity="0.5"/><rect x="3" y="3" width="18" height="8" rx="1.5" fill="currentColor"/><rect x="24.5" y="4.5" width="2" height="5" rx="1" fill="currentColor" opacity="0.5"/></svg>',
    clock:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    mail:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>',
    camera:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h4l1.5-2h5L16 8h4a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    car:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 16 6.5 9.8A2 2 0 0 1 8.45 8h7.1a2 2 0 0 1 1.95 1.8L19 16"/><path d="M4 16h16v3a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3Z"/><circle cx="7.5" cy="16.5" r="1" fill="currentColor" stroke="none"/><circle cx="16.5" cy="16.5" r="1" fill="currentColor" stroke="none"/></svg>',
    road:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3 6 21"/><path d="M14 3 18 21"/><path d="M11.25 7h1.5"/><path d="M10.5 11h3"/><path d="M9.75 15h4.5"/></svg>',
    warning:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 3 20h18L12 4Z"/><path d="M12 9v5"/><path d="M12 17h.01"/></svg>'
  };

  var expeditionData = {
    next: {
      id: "exp-001",
      tag: "公式戦",
      deadline: "ー",
      name: "第11回 DOCUS OPEN Tournament 2026 Powered by ゴルフパートナー ラダイス西日本予選",
      venue: "大山ゴルフクラブ",
      date: "2026/04/23（木）",
      prize: "1500万",
      entryFee: "ー",
      qualification: "ー",
      capacity: "152名",
      status: "募集中",
      hasUrl: true,
      category: "JGTO",
      gender: "男子",
      imageUrl: "../../assets/images/expedition/courses/course-daisen-golf-club.png"
    },
    categories: [
      { key: "result", name: "公式結果", icon: "trophy" },
      { key: "hotel", name: "ホテル", icon: "hotel" },
      { key: "flight", name: "飛行機", icon: "plane" },
      { key: "around", name: "会場周辺", icon: "pinFill" },
      { key: "gourmet", name: "グルメ", icon: "fork" },
      { key: "gym", name: "ジム", icon: "gym" },
      { key: "onsen", name: "温泉", icon: "onsen" }
    ],

aroundSpots: [
  {
    id: "around-001",
    name: "セブン-イレブン 大山入口店",
    category: "convenience",
    distanceLabel: "会場から 0.8km",
    timeLabel: "車で2分",
    tags: ["24時間", "ATM", "軽食"],
    type: "24時間",
    isOpen24: true,
    isOpen: true,
    imageUrl: "../../assets/images/expedition/around/around-seven-daisen.png"
  },
  {
    id: "around-002",
    name: "ウエルシア 大山周辺店",
    category: "drug",
    distanceLabel: "会場から 1.5km",
    timeLabel: "車で4分",
    tags: ["医薬品", "日用品", "営業中"],
    type: "営業中",
    isOpen24: false,
    isOpen: true,
    imageUrl: "../../assets/images/expedition/around/around-welcia-daisen.png"
  },
  {
    id: "around-003",
    name: "大山練習レンジ",
    category: "practice",
    distanceLabel: "会場から 2.2km",
    timeLabel: "車で6分",
    tags: ["打ちっぱなし", "パター", "朝営業"],
    type: "練習場",
    isOpen24: false,
    isOpen: true,
    imageUrl: "../../assets/images/expedition/around/around-range-daisen.png"
  },
  {
    id: "around-004",
    name: "ENEOS 大山サービスステーション",
    category: "gas",
    distanceLabel: "会場から 1.1km",
    timeLabel: "車で3分",
    tags: ["給油", "洗車", "営業中"],
    type: "営業中",
    isOpen24: false,
    isOpen: true,
    imageUrl: "../../assets/images/expedition/around/around-gas-daisen.png"
  },
  {
    id: "around-005",
    name: "コインランドリー 大山クリーン",
    category: "laundry",
    distanceLabel: "会場から 1.9km",
    timeLabel: "車で5分",
    tags: ["乾燥機", "大型洗濯", "24時間"],
    type: "24時間",
    isOpen24: true,
    isOpen: true,
    imageUrl: "../../assets/images/expedition/around/around-laundry-daisen.png"
  },
  {
    id: "around-006",
    name: "大山入口 駐車場",
    category: "parking",
    distanceLabel: "会場から 0.4km",
    timeLabel: "車で1分",
    tags: ["大型可", "平面", "営業中"],
    type: "駐車場",
    isOpen24: true,
    isOpen: true,
    imageUrl: "../../assets/images/expedition/around/around-parking-daisen.png"
  }
],
    flights: [
      {
        id: "flight-001",
        direction: "outbound",
        directionLabel: "往路",
        airline: "ANA",
        airlineClass: "ana",
        flightNo: "NH381",
        date: "2026/04/22（水）",
        departAirport: "羽田空港",
        arriveAirport: "米子鬼太郎空港",
        departTime: "07:45",
        arriveTime: "09:05",
        bookingSource: "ANAアプリで予約",
        bookingNo: "ANA7H2K",
        seat: "14A",
        baggage: "受託手荷物 1個",
        venueDistance: "会場まで 27.8km",
        venueTime: "車で38分",
        hotelDistance: "ホテルまで 18.6km",
        hotelTime: "車で24分",
        airportMapQuery: "米子鬼太郎空港"
      },
      {
        id: "flight-002",
        direction: "return",
        directionLabel: "復路",
        airline: "JAL",
        airlineClass: "jal",
        flightNo: "JL279",
        date: "2026/04/23（木）",
        departAirport: "米子鬼太郎空港",
        arriveAirport: "羽田空港",
        departTime: "18:35",
        arriveTime: "19:50",
        bookingSource: "JALアプリで予約",
        bookingNo: "JAL4M8Q",
        seat: "11C",
        baggage: "機内持込のみ",
        venueDistance: "会場から 27.8km",
        venueTime: "車で38分",
        hotelDistance: "ホテルから 18.6km",
        hotelTime: "車で24分",
        airportMapQuery: "米子鬼太郎空港"
      },
      {
        id: "flight-003",
        direction: "outbound",
        directionLabel: "予備便",
        airline: "SKY",
        airlineClass: "sky",
        flightNo: "BC517",
        date: "2026/04/22（水）",
        departAirport: "神戸空港",
        arriveAirport: "米子鬼太郎空港",
        departTime: "11:10",
        arriveTime: "12:10",
        bookingSource: "スカイマーク控え",
        bookingNo: "SKY9C3R",
        seat: "18F",
        baggage: "受託手荷物 1個",
        venueDistance: "会場まで 27.8km",
        venueTime: "車で38分",
        hotelDistance: "ホテルまで 18.6km",
        hotelTime: "車で24分",
        airportMapQuery: "米子鬼太郎空港"
      }
    ],

    saved: [
      {
        id: "save-001",
        name: "2026 JJGT 全国大会 西日本決勝",
        date: "2026/05/15（金）〜05/17（日）",
        venue: "六甲国際ゴルフ倶楽部 東コース",
        receipts: "1件",
        items: "0/5",
        status: "準備中",
        category: "JJGT",
        imageUrl: "../../assets/images/expedition/courses/course-rokko-kokusai-east.png"
      },
      {
        id: "save-002",
        name: "ISPS HANDA ジュニアオープン",
        date: "2026/06/20（土）〜06/21（日）",
        venue: "PGM 石岡ゴルフクラブ",
        receipts: "1件",
        items: "0/5",
        status: "準備中",
        category: "ISPS",
        imageUrl: "../../assets/images/expedition/courses/course-pgm-ishioka.png"
      }
    ],

    gyms: {
      hotel: [
        {
          id: "gym-001",
          name: "Anytime Fitness 米子東福原店",
          venueDistance: "会場から 2.1km",
          hotelDistance: "ホテルから 0.6km",
          venueTime: "車で6分",
          hotelTime: "車で2分",
          hours: "24時間",
          facility: "フリーウェイト / シャワーあり",
          type: "24時間",
          priceRank: 3,
          imageUrl: "../../assets/images/expedition/gyms/gym-anytime-yonago.png"
        },
        {
          id: "gym-002",
          name: "FIT365 米子東福原",
          venueDistance: "会場から 3.4km",
          hotelDistance: "ホテルから 1.2km",
          venueTime: "車で9分",
          hotelTime: "車で4分",
          hours: "24時間",
          facility: "マシン充実 / 駐車場あり",
          type: "24時間",
          priceRank: 2,
          imageUrl: "../../assets/images/expedition/gyms/gym-fit365-yonago.png"
        },
        {
          id: "gym-003",
          name: "ゴールドジム 米子エリア",
          venueDistance: "会場から 5.2km",
          hotelDistance: "ホテルから 2.4km",
          venueTime: "車で12分",
          hotelTime: "車で7分",
          hours: "7:00〜23:00",
          facility: "ビジター利用可",
          type: "7:00〜23:00",
          priceRank: 4,
          imageUrl: "../../assets/images/expedition/gyms/gym-golds-yonago.png"
        }
      ],
      venue: [
        {
          id: "gym-001",
          name: "Anytime Fitness 米子東福原店",
          venueDistance: "会場から 2.1km",
          hotelDistance: "ホテルから 0.6km",
          venueTime: "車で6分",
          hotelTime: "車で2分",
          hours: "24時間",
          facility: "フリーウェイト / シャワーあり",
          type: "24時間",
          priceRank: 3,
          imageUrl: "../../assets/images/expedition/gyms/gym-anytime-yonago.png"
        },
        {
          id: "gym-002",
          name: "FIT365 米子東福原",
          venueDistance: "会場から 3.4km",
          hotelDistance: "ホテルから 1.2km",
          venueTime: "車で9分",
          hotelTime: "車で4分",
          hours: "24時間",
          facility: "マシン充実 / 駐車場あり",
          type: "24時間",
          priceRank: 2,
          imageUrl: "../../assets/images/expedition/gyms/gym-fit365-yonago.png"
        },
        {
          id: "gym-003",
          name: "ゴールドジム 米子エリア",
          venueDistance: "会場から 5.2km",
          hotelDistance: "ホテルから 2.4km",
          venueTime: "車で12分",
          hotelTime: "車で7分",
          hours: "7:00〜23:00",
          facility: "ビジター利用可",
          type: "7:00〜23:00",
          priceRank: 4,
          imageUrl: "../../assets/images/expedition/gyms/gym-golds-yonago.png"
        }
      ]
    },
    onsens: {
      hotel: [
        {
          id: "onsen-001",
          name: "皆生温泉 汐の湯",
          venueDistance: "会場から 2.0km",
          hotelDistance: "ホテルから 0.8km",
          venueTime: "車で6分",
          hotelTime: "車で3分",
          hours: "10:00〜23:00",
          priceLabel: "入浴 ¥900 / サウナ込み",
          features: "サウナ / 水風呂 / 露天風呂あり",
          badge: "サウナ",
          hasSauna: true,
          hasOpenAir: true,
          imageUrl: "../../assets/images/expedition/onsen/onsen-kaike-shionoyu.png"
        },
        {
          id: "onsen-002",
          name: "OUランド",
          venueDistance: "会場から 3.2km",
          hotelDistance: "ホテルから 1.3km",
          venueTime: "車で9分",
          hotelTime: "車で5分",
          hours: "10:00〜22:00",
          priceLabel: "入浴 ¥750 / サウナ込み",
          features: "サウナ / 水風呂 / 露天風呂あり",
          badge: "人気",
          hasSauna: true,
          hasOpenAir: true,
          imageUrl: "../../assets/images/expedition/onsen/onsen-ouland.png"
        },
        {
          id: "onsen-003",
          name: "淀江ゆめ温泉 白鳳の里",
          venueDistance: "会場から 4.6km",
          hotelDistance: "ホテルから 2.1km",
          venueTime: "車で11分",
          hotelTime: "車で7分",
          hours: "10:00〜23:00",
          priceLabel: "入浴 ¥900 / サウナ込み",
          features: "サウナ / 水風呂 / 露天風呂あり",
          badge: "露天あり",
          hasSauna: true,
          hasOpenAir: true,
          imageUrl: "../../assets/images/expedition/onsen/onsen-hakuhonosato.png"
        }
      ],
      venue: [
        {
          id: "onsen-001",
          name: "皆生温泉 汐の湯",
          venueDistance: "会場から 2.0km",
          hotelDistance: "ホテルから 0.8km",
          venueTime: "車で6分",
          hotelTime: "車で3分",
          hours: "10:00〜23:00",
          priceLabel: "入浴 ¥900 / サウナ込み",
          features: "サウナ / 水風呂 / 露天風呂あり",
          badge: "サウナ",
          hasSauna: true,
          hasOpenAir: true,
          imageUrl: "../../assets/images/expedition/onsen/onsen-kaike-shionoyu.png"
        },
        {
          id: "onsen-002",
          name: "OUランド",
          venueDistance: "会場から 3.2km",
          hotelDistance: "ホテルから 1.3km",
          venueTime: "車で9分",
          hotelTime: "車で5分",
          hours: "10:00〜22:00",
          priceLabel: "入浴 ¥750 / サウナ込み",
          features: "サウナ / 水風呂 / 露天風呂あり",
          badge: "人気",
          hasSauna: true,
          hasOpenAir: true,
          imageUrl: "../../assets/images/expedition/onsen/onsen-ouland.png"
        },
        {
          id: "onsen-003",
          name: "淀江ゆめ温泉 白鳳の里",
          venueDistance: "会場から 4.6km",
          hotelDistance: "ホテルから 2.1km",
          venueTime: "車で11分",
          hotelTime: "車で7分",
          hours: "10:00〜23:00",
          priceLabel: "入浴 ¥900 / サウナ込み",
          features: "サウナ / 水風呂 / 露天風呂あり",
          badge: "露天あり",
          hasSauna: true,
          hasOpenAir: true,
          imageUrl: "../../assets/images/expedition/onsen/onsen-hakuhonosato.png"
        }
      ]
    },

    gourmets: {
      hotel: [
        {
          id: "gourmet-001",
          name: "Cafe DINING Park",
          venueDistance: "会場から 2.6km",
          hotelDistance: "ホテルから 0.7km",
          venueTime: "車で7分",
          hotelTime: "車で3分",
          hours: "7:00〜17:00",
          priceLabel: "¥800〜1,400",
          features: "軽食 / コーヒー / テイクアウトあり",
          badge: "軽め",
          genreLabel: "カフェ",
          genre: "cafe",
          cheapRank: 2,
          popularRank: 2,
          recommendRank: 1,
          imageUrl: "../../assets/images/expedition/gourmet/gourmet-cafe-dining-park.png"
        },
        {
          id: "gourmet-002",
          name: "お食事処 旬彩堂",
          venueDistance: "会場から 3.1km",
          hotelDistance: "ホテルから 1.4km",
          venueTime: "車で9分",
          hotelTime: "車で5分",
          hours: "11:00〜21:00",
          priceLabel: "¥900〜1,500",
          features: "定食 / 焼き魚 / ボリュームあり",
          badge: "定食",
          genreLabel: "定食",
          genre: "setmeal",
          cheapRank: 1,
          popularRank: 3,
          recommendRank: 2,
          imageUrl: "../../assets/images/expedition/gourmet/gourmet-shunsaido.png"
        },
        {
          id: "gourmet-003",
          name: "炭火居酒屋 酒楽",
          venueDistance: "会場から 4.0km",
          hotelDistance: "ホテルから 1.8km",
          venueTime: "車で10分",
          hotelTime: "車で6分",
          hours: "17:00〜24:00",
          priceLabel: "¥2,000〜3,500",
          features: "居酒屋 / 炭火焼き鳥 / お酒充実",
          badge: "人気",
          genreLabel: "居酒屋",
          genre: "izakaya",
          cheapRank: 3,
          popularRank: 1,
          recommendRank: 3,
          imageUrl: "../../assets/images/expedition/gourmet/gourmet-shuraku.png"
        },
        {
          id: "gourmet-004",
          name: "焼肉 大山亭",
          venueDistance: "会場から 4.6km",
          hotelDistance: "ホテルから 2.0km",
          venueTime: "車で12分",
          hotelTime: "車で7分",
          hours: "17:00〜23:00",
          priceLabel: "¥2,500〜4,000",
          features: "焼肉 / カルビ / 個室あり",
          badge: "おすすめ",
          genreLabel: "焼肉",
          genre: "yakiniku",
          cheapRank: 4,
          popularRank: 4,
          recommendRank: 1,
          imageUrl: "../../assets/images/expedition/gourmet/gourmet-shuraku.png"
        },
        {
          id: "gourmet-005",
          name: "麺処 だいせん軒",
          venueDistance: "会場から 3.7km",
          hotelDistance: "ホテルから 1.6km",
          venueTime: "車で10分",
          hotelTime: "車で5分",
          hours: "11:00〜22:00",
          priceLabel: "¥850〜1,300",
          features: "ラーメン / 餃子 / 深夜前まで営業",
          badge: "安め",
          genreLabel: "ラーメン",
          genre: "ramen",
          cheapRank: 1,
          popularRank: 5,
          recommendRank: 4,
          imageUrl: "../../assets/images/expedition/gourmet/gourmet-shunsaido.png"
        }
      ],
      venue: [
        {
          id: "gourmet-001",
          name: "Cafe DINING Park",
          venueDistance: "会場から 2.6km",
          hotelDistance: "ホテルから 0.7km",
          venueTime: "車で7分",
          hotelTime: "車で3分",
          hours: "7:00〜17:00",
          priceLabel: "¥800〜1,400",
          features: "軽食 / コーヒー / テイクアウトあり",
          badge: "軽め",
          genreLabel: "カフェ",
          genre: "cafe",
          cheapRank: 2,
          popularRank: 2,
          recommendRank: 1,
          imageUrl: "../../assets/images/expedition/gourmet/gourmet-cafe-dining-park.png"
        },
        {
          id: "gourmet-002",
          name: "お食事処 旬彩堂",
          venueDistance: "会場から 3.1km",
          hotelDistance: "ホテルから 1.4km",
          venueTime: "車で9分",
          hotelTime: "車で5分",
          hours: "11:00〜21:00",
          priceLabel: "¥900〜1,500",
          features: "定食 / 焼き魚 / ボリュームあり",
          badge: "定食",
          genreLabel: "定食",
          genre: "setmeal",
          cheapRank: 1,
          popularRank: 3,
          recommendRank: 2,
          imageUrl: "../../assets/images/expedition/gourmet/gourmet-shunsaido.png"
        },
        {
          id: "gourmet-003",
          name: "炭火居酒屋 酒楽",
          venueDistance: "会場から 4.0km",
          hotelDistance: "ホテルから 1.8km",
          venueTime: "車で10分",
          hotelTime: "車で6分",
          hours: "17:00〜24:00",
          priceLabel: "¥2,000〜3,500",
          features: "居酒屋 / 炭火焼き鳥 / お酒充実",
          badge: "人気",
          genreLabel: "居酒屋",
          genre: "izakaya",
          cheapRank: 3,
          popularRank: 1,
          recommendRank: 3,
          imageUrl: "../../assets/images/expedition/gourmet/gourmet-shuraku.png"
        },
        {
          id: "gourmet-004",
          name: "焼肉 大山亭",
          venueDistance: "会場から 4.6km",
          hotelDistance: "ホテルから 2.0km",
          venueTime: "車で12分",
          hotelTime: "車で7分",
          hours: "17:00〜23:00",
          priceLabel: "¥2,500〜4,000",
          features: "焼肉 / カルビ / 個室あり",
          badge: "おすすめ",
          genreLabel: "焼肉",
          genre: "yakiniku",
          cheapRank: 4,
          popularRank: 4,
          recommendRank: 1,
          imageUrl: "../../assets/images/expedition/gourmet/gourmet-shuraku.png"
        },
        {
          id: "gourmet-005",
          name: "麺処 だいせん軒",
          venueDistance: "会場から 3.7km",
          hotelDistance: "ホテルから 1.6km",
          venueTime: "車で10分",
          hotelTime: "車で5分",
          hours: "11:00〜22:00",
          priceLabel: "¥850〜1,300",
          features: "ラーメン / 餃子 / 深夜前まで営業",
          badge: "安め",
          genreLabel: "ラーメン",
          genre: "ramen",
          cheapRank: 1,
          popularRank: 5,
          recommendRank: 4,
          imageUrl: "../../assets/images/expedition/gourmet/gourmet-shunsaido.png"
        }
      ]
    },
    recentActions: [
      { key: "add-receipt", title: "領収書を追加する", sub: "経費をまとめて管理", icon: "receipt" },
      { key: "items", title: "持ち物リスト", sub: "忘れ物を防ぐチェックに", icon: "checklist" },
      { key: "guide", title: "遠征ガイド", sub: "初めての方はこちら", icon: "guide" }
    ],
    hotel: {
      selected: {
        name: "米子ワシントンホテルプラザ",
        area: "大山ゴルフクラブまで 約12.5km",
        checkin: "2026/04/22（水）",
        checkout: "2026/04/23（木）",
        nights: "1泊",
        price: "¥12,800",
        site: "楽天トラベル",
        reservationNo: "",
        reservationUrl: "",
        memo: ""
      }
    },
    expenseSummary: {
      lodging: 12800,
      transport: 0,
      food: 0,
      entry: 0,
      practice: 0,
      other: 0
    },
    hotelReceipts: []
  };

  var state = { screen: "top", hotelFormMode: "add", gymBase: "hotel", gymSort: "distance", onsenBase: "hotel", onsenFilter: "distance", gourmetBase: "venue", gourmetSort: "distance", gourmetGenre: "all", aroundCategory: "convenience", aroundSort: "distance", flightScope: "all", flightSort: "schedule" };

  function loadSavedHotel() {
    try {
      var raw = localStorage.getItem("pnx_expedition_selected_hotel");
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved && saved.name) {
        expeditionData.hotel.selected = Object.assign({}, expeditionData.hotel.selected, saved);
      }
    } catch (e) {
      console.warn("[遠征] hotel load failed", e);
    }
  }

  function saveHotelToStorage() {
    try {
      localStorage.setItem("pnx_expedition_selected_hotel", JSON.stringify(expeditionData.hotel.selected));
    } catch (e) {
      console.warn("[遠征] hotel save failed", e);
    }
  }

  function parseYen(value) {
    if (value == null) return 0;
    var n = String(value).replace(/[^\d]/g, "");
    return n ? Number(n) : 0;
  }

  function formatYen(num) {
    num = Number(num || 0);
    return "¥" + num.toLocaleString("ja-JP");
  }

  function syncLodgingExpense() {
    var h = expeditionData.hotel.selected || {};
    var amount = parseYen(h.price);
    expeditionData.expenseSummary.lodging = amount;
    try {
      localStorage.setItem("pnx_expedition_expense_summary", JSON.stringify(expeditionData.expenseSummary));
    } catch (e) {
      console.warn("[遠征] expense save failed", e);
    }
    return amount;
  }

  function loadExpenseSummary() {
    try {
      var raw = localStorage.getItem("pnx_expedition_expense_summary");
      if (raw) {
        expeditionData.expenseSummary = Object.assign({}, expeditionData.expenseSummary, JSON.parse(raw));
      }
    } catch (e) {
      console.warn("[遠征] expense load failed", e);
    }
    syncLodgingExpense();
  }

  function loadHotelReceipts() {
    try {
      var raw = localStorage.getItem("pnx_expedition_hotel_receipts");
      expeditionData.hotelReceipts = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(expeditionData.hotelReceipts)) expeditionData.hotelReceipts = [];
    } catch (e) {
      console.warn("[遠征] receipt load failed", e);
      expeditionData.hotelReceipts = [];
    }
  }

  function saveHotelReceipts() {
    try {
      localStorage.setItem("pnx_expedition_hotel_receipts", JSON.stringify(expeditionData.hotelReceipts || []));
    } catch (e) {
      console.warn("[遠征] receipt save failed", e);
    }
  }

  function sumHotelReceipts() {
    return (expeditionData.hotelReceipts || []).reduce(function (sum, r) {
      return sum + parseYen(r.amount);
    }, 0);
  }

  function todayJP() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "/" + m + "/" + day;
  }


  function esc(s) {
    return String(s).replace(/[&<>\"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function renderStatusBar() {
    return '';
  }

  function renderHeader(title, opts) {
    opts = opts || {};
    var left = opts.back ? '<button class="exp-head-btn left" data-act="back" aria-label="戻る">' + I.back + '</button>' : '<span class="exp-head-spacer"></span>';
    var right;
    if (opts.rightType === "info") {
      right = '<button class="exp-info-btn" data-act="info" aria-label="情報">' + I.info + '</button>';
    } else {
      right = opts.bell !== false ? '<button class="exp-bell" data-act="bell" aria-label="通知">' + I.bell + '<span class="exp-dot"></span></button>' : '<span class="exp-head-spacer"></span>';
    }
    return '<div class="exp-header ' + (opts.sub ? 'is-sub' : '') + '"><span class="exp-head-side">' + left + '</span><span class="exp-title">' + esc(title) + '</span><span class="exp-head-side">' + right + '</span></div>';
  }

  function sectionHead(title, opts) {
    opts = opts || {};
    var btn = opts.button === false ? '' : '<button class="exp-seeall' + (opts.plain ? ' exp-plain' : '') + '" data-act="seeall" data-section="' + esc(title) + '">すべて見る' + I.chevron + '</button>';
    return '<div class="exp-sec-head"><div class="exp-sec-title">' + esc(title) + '</div>' + btn + '</div>';
  }

  function stat(label, value) {
    return '<div class="exp-stat"><div class="exp-stat-label">' + esc(label) + '</div><div class="exp-stat-value">' + esc(value) + '</div></div>';
  }

  function renderMainCard(d) {
    return '<div class="exp-main-card" data-act="open" data-id="' + esc(d.id) + '">' +
      '<div class="exp-main-photo">' +
        (d.imageUrl ? '<img src="' + esc(d.imageUrl) + '" alt="' + esc(d.venue || d.name || '') + '">' : '') +
        '<div class="exp-main-photo-overlay"></div>' +
        '<div class="exp-logo-circle">' + esc(d.category) + '</div>' +
        '<div class="exp-photo-badges"><span class="exp-photo-badge cat">' + esc(d.category) + '</span><span class="exp-photo-badge gender">' + esc(d.gender) + '</span></div>' +
      '</div>' +
      '<div class="exp-main-info">' +
        '<div class="exp-info-top"><span class="exp-tag">' + esc(d.tag) + '</span><span class="exp-deadline">' + I.calendar + '締切 ' + esc(d.deadline) + '</span></div>' +
        '<div class="exp-tname">' + esc(d.name) + '</div>' +
        '<div class="exp-meta-row"><span class="exp-meta-item">' + I.pin + esc(d.venue) + '</span><span class="exp-meta-sep">|</span><span class="exp-meta-item">' + I.calendar + esc(d.date) + '</span></div>' +
        '<div class="exp-stats">' + stat("賞金総額", d.prize) + stat("エントリー費", d.entryFee) + stat("出場資格", d.qualification) + stat("募集人数", d.capacity) + '</div>' +
        '<div class="exp-actions"><span class="exp-chip recruit">' + I.check + esc(d.status) + '</span>' + (d.hasUrl ? '<span class="exp-chip url">' + I.link + 'URLあり</span>' : '') + '<button class="exp-open-btn" data-act="open" data-id="' + esc(d.id) + '">' + I.arrow + '遠征を開く</button></div>' +
      '</div></div>';
  }

  function renderCategories(cats) {
    return '<div class="exp-cats">' + cats.map(function (c) {
      var active = !!c.active && state.screen !== "top";
      return '<button class="exp-cat' + (active ? ' is-active' : '') + '" data-act="cat" data-key="' + esc(c.key) + '" data-name="' + esc(c.name) + '"><span class="exp-cat-icon">' + I[c.icon] + '</span><span class="exp-cat-name">' + esc(c.name) + '</span></button>';
    }).join('') + '</div>';
  }

  function renderSaved(list) {
    return '<div class="exp-saved-list">' + list.map(function (s) {
      return '<div class="exp-saved" data-act="saved" data-id="' + esc(s.id) + '"><div class="exp-saved-thumb">' + (s.imageUrl ? '<img src="' + esc(s.imageUrl) + '" alt="' + esc(s.venue || s.name || '') + '">' : '') + '<span class="exp-saved-thumb-label">' + esc(s.category) + '</span></div><div class="exp-saved-body"><div class="exp-saved-name">' + esc(s.name) + '</div><div class="exp-saved-row">' + I.calendar + esc(s.date) + '</div><div class="exp-saved-row">' + I.pin + esc(s.venue) + '</div><div class="exp-saved-chips"><span class="exp-mini-chip">' + I.receipt + '領収書 ' + esc(s.receipts) + '</span><span class="exp-mini-chip">' + I.checklist + '持ち物 ' + esc(s.items) + '</span></div></div><div class="exp-saved-right"><span class="exp-status-badge">' + esc(s.status) + '</span><span class="exp-chev">' + I.chevron + '</span></div></div>';
    }).join('') + '</div>';
  }

  function renderRecentActions(list) {
    return '<div class="exp-actions-list">' + list.map(function (a) {
      return '<div class="exp-action-card" data-act="recent" data-key="' + esc(a.key) + '"><span class="exp-action-icon">' + I[a.icon] + '</span><div class="exp-action-body"><div class="exp-action-title">' + esc(a.title) + '</div><div class="exp-action-sub">' + esc(a.sub) + '</div></div><span class="exp-chev">' + I.chevron + '</span></div>';
    }).join('') + '</div>';
  }

  function renderTopScreen(data) {
    return renderStatusBar() + renderHeader('遠征') + '<div class="exp-body">' + sectionHead('次の遠征') + renderMainCard(data.next) + renderCategories(data.categories) + sectionHead('保存済みの遠征', { plain: true }) + renderSaved(data.saved) + sectionHead('最近のアクション・便利リンク', { button: false }) + renderRecentActions(data.recentActions) + '</div>' + renderNav();
  }



  function getPrimaryFlight() {
    var item = Object.assign({}, ((expeditionData.flights || [])[0] || {}));
    return Object.assign({
      id: 'flight-001',
      date: '2026/04/22（水）',
      departAirport: '羽田空港',
      arriveAirport: '米子鬼太郎空港',
      departTime: '07:30',
      arriveTime: '08:50',
      airline: 'ANA',
      flightNo: '381便',
      bookingNo: 'AB12CD',
      routeLabel: '羽田空港 → 米子鬼太郎空港',
      reserveLabel: '予約済み',
      golfBagLabel: 'ゴルフバッグあり',
      preStayLabel: '前日入り',
      airportVenueRoute: '米子鬼太郎空港 → 大山ゴルフクラブ',
      airportVenueDistance: '約32km',
      airportVenueDrive: '車で約35分',
      rentalLabel: 'レンタカー推奨',
      taxiLabel: 'タクシー目安 ¥9,000〜',
      rentalStatus: '未予約',
      airportToHotelTime: '約20分',
      hotelToVenueTime: '約18分',
      transferNote: '荷物受取・レンタカー手続きで30〜45分かかる場合があります',
      memo: 'クラブケースは受託手荷物。前日入りで余裕あり。'
    }, item);
  }

  function renderFlightScreen(data) {
    var flight = getPrimaryFlight();
    return renderStatusBar()
      + renderHeader('飛行機', { sub: true, bell: false, rightType: 'info', back: true })
      + '<div class="exp-body gym-page flight-detail-page">'
      + renderFlightTournamentCard(data.next)
      + renderFlightSectionTitle('予約済みの航空券')
      + renderFlightBookingCard(flight)
      + renderFlightSectionTitle('空港から会場まで')
      + renderFlightAccessCard(flight)
      + renderFlightSectionTitle('到着後の移動')
      + renderFlightArrivalCard(flight)
      + renderFlightSectionTitle('予約を追加')
      + renderFlightAddActions()
      + renderFlightSectionTitle('メモ')
      + renderFlightMemoCard(flight)
      + '</div>'
      + renderInnerNavIfNeeded();
  }

  function renderFlightSectionTitle(label) {
    return '<div class="flight-detail-title">' + esc(label) + '</div>';
  }

  function renderFlightTournamentCard(d) {
    return '<div class="gym-tournament-card flight-tournament-card flight-ref-card">'
      + '<div class="around-tournament-logo flight-ref-logo">' + renderAroundTournamentLogoSvg() + '</div>'
      + '<div class="gym-tournament-info flight-ref-info">'
      + '<span class="gym-tournament-tag around-tournament-tag">' + esc(d.tag || '公式戦') + '</span>'
      + '<div class="gym-tournament-name flight-ref-name">' + esc(d.name) + '</div>'
      + '<div class="around-tournament-meta-rows flight-ref-meta">'
      + '<div class="around-tournament-meta-row">' + I.pin + '<span>' + esc(formatAroundVenue(d.venue)) + '</span></div>'
      + '<div class="around-tournament-meta-row">' + I.calendar + '<span>' + esc(formatAroundDate('2026/04/23')) + '</span></div>'
      + '</div>'
      + '</div></div>';
  }

  function renderFlightBookingCard(item) {
    return '<div class="flight-detail-card flight-booking-card">'
      + '<div class="flight-booking-top">'
      + '<div class="flight-booking-icon">' + I.plane + '</div>'
      + '<div class="flight-booking-main">'
      + '<div class="flight-booking-route">' + esc(item.routeLabel) + '</div>'
      + '<div class="flight-booking-time-row">'
      + '<div class="flight-booking-time is-depart"><strong>' + esc(item.departTime) + '</strong><span>発</span></div>'
      + '<div class="flight-booking-line"><span class="flight-line-segment"></span><span class="flight-line-plane">' + I.plane + '</span><span class="flight-line-segment"></span></div>'
      + '<div class="flight-booking-time is-arrive"><strong>' + esc(item.arriveTime) + '</strong><span>着</span></div>'
      + '</div>'
      + '<div class="flight-booking-airline"><span class="flight-airline-text">' + esc(item.airline) + '</span><span class="flight-airline-no">' + esc(item.flightNo) + '</span></div>'
      + '</div>'
      + '</div>'
      + '<div class="flight-booking-info-grid">'
      + '<div class="flight-booking-info-item"><span>搭乗日</span><strong>' + esc(item.date) + '</strong></div>'
      + '<div class="flight-booking-info-item"><span>予約番号</span><strong>' + esc(item.bookingNo) + '</strong></div>'
      + '</div>'
      + '<div class="flight-booking-chip-row">'
      + '<span class="flight-chip is-green">' + I.check + esc(item.reserveLabel) + '</span>'
      + '<span class="flight-chip is-green">' + I.bag + esc(item.golfBagLabel) + '</span>'
      + '<span class="flight-chip is-blue">' + I.calendar + esc(item.preStayLabel) + '</span>'
      + '</div>'
      + '<div class="flight-booking-actions">'
      + '<button class="flight-outline-btn" data-act="flight-action" data-key="detail">' + I.receipt + '<span>詳細</span></button>'
      + '<button class="flight-fill-btn" data-act="flight-action" data-key="edit">' + I.edit + '<span>編集</span></button>'
      + '</div>'
      + '</div>';
  }

  function renderFlightAccessCard(item) {
    return '<div class="flight-detail-card flight-access-card2">'
      + '<div class="flight-access-copy">'
      + '<div class="flight-access-route2">' + esc(item.airportVenueRoute) + '</div>'
      + '<div class="flight-access-metrics">'
      + '<span>' + I.road + esc(item.airportVenueDistance) + '</span>'
      + '<span>' + I.car + esc(item.airportVenueDrive) + '</span>'
      + '</div>'
      + '<div class="flight-access-tag-row">'
      + '<span class="flight-soft-chip is-green">' + I.car + esc(item.rentalLabel) + '</span>'
      + '<span class="flight-soft-chip">' + I.car + esc(item.taxiLabel) + '</span>'
      + '</div>'
      + '</div>'
      + '<div class="flight-mini-map" aria-hidden="true">'
      + '<svg viewBox="0 0 220 120" fill="none">'
      + '<rect x="0" y="0" width="220" height="120" rx="18" fill="#eef6ef"/>'
      + '<path d="M0 25C30 8 55 12 78 26C100 39 126 32 150 18C175 3 199 4 220 16V0H0V25Z" fill="#d9eadc"/>'
      + '<path d="M10 98C40 78 58 76 82 83C109 91 132 75 157 52C176 34 191 33 210 41" stroke="#3a8a52" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/> ' 
      + '<circle cx="24" cy="93" r="8" fill="#ffffff" stroke="#2f7d45" stroke-width="3"/>'
      + '<circle cx="192" cy="42" r="8" fill="#2f7d45"/>'
      + '<path d="M24 89v8M20 93h8" stroke="#2f7d45" stroke-width="2" stroke-linecap="round"/>'
      + '<path d="M192 38v8M188 42h8" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'
      + '<path d="M21 95c1-3 2.5-5.3 4.4-7" stroke="#2f7d45" stroke-width="2" stroke-linecap="round"/> ' 
      + '</svg>'
      + '</div>'
      + '</div>';
  }

  function renderFlightArrivalCard(item) {
    return '<div class="flight-detail-card flight-arrival-card">'
      + '<div class="flight-arrival-row is-head"><span class="flight-arrival-left">' + I.car + '<strong>レンタカー</strong></span><span class="flight-status-pill is-pending">' + esc(item.rentalStatus) + '</span></div>'
      + '<div class="flight-arrival-row"><span class="flight-arrival-left">' + I.plane + '<strong>空港 → ホテル</strong></span><span class="flight-arrival-right">' + esc(item.airportToHotelTime) + I.chevron + '</span></div>'
      + '<div class="flight-arrival-row"><span class="flight-arrival-left">' + I.flag + '<strong>ホテル → 会場</strong></span><span class="flight-arrival-right">' + esc(item.hotelToVenueTime) + I.chevron + '</span></div>'
      + '<div class="flight-arrival-note">' + I.warning + '<span>' + esc(item.transferNote) + '</span></div>'
      + '</div>';
  }

  function renderFlightAddActions() {
    return '<div class="flight-add-grid">'
      + '<button class="flight-add-box" data-act="flight-action" data-key="manual">' + I.add + '<span>手動で追加</span></button>'
      + '<button class="flight-add-box" data-act="flight-action" data-key="scan">' + I.camera + '<span>スクショから読み取り</span></button>'
      + '<button class="flight-add-box" data-act="flight-action" data-key="mail">' + I.mail + '<span>メールから読み取り</span></button>'
      + '</div>';
  }

  function renderFlightMemoCard(item) {
    return '<button class="flight-memo-card" data-act="flight-action" data-key="memo">'
      + '<span class="flight-memo-icon">' + I.edit + '</span>'
      + '<span class="flight-memo-text">' + esc(item.memo) + '</span>'
      + '<span class="flight-memo-chev">' + I.chevron + '</span>'
      + '</button>';
  }



function getAroundCategoryIcon(key) {
  var map = {
    convenience: I.convenience,
    drug: I.drug,
    practice: I.practice,
    gas: I.gas,
    laundry: I.laundry,
    parking: I.parking
  };
  return map[key] || I.pinFill;
}

function getAroundList() {
  var list = (expeditionData.aroundSpots || []).slice();
  list = list.map(function(item, index) {
    return Object.assign({ _index: index }, item);
  });

  function byDistance(a, b) {
    return distanceNum(a.distanceLabel) - distanceNum(b.distanceLabel) || Number(a._index || 0) - Number(b._index || 0);
  }

  if (state.aroundSort === 'open24') {
    list.sort(function(a, b) {
      return (b.isOpen24 === true) - (a.isOpen24 === true) || byDistance(a, b);
    });
  } else if (state.aroundSort === 'open') {
    list.sort(function(a, b) {
      return (b.isOpen === true) - (a.isOpen === true) || byDistance(a, b);
    });
  } else {
    list.sort(byDistance);
  }

  if (state.aroundCategory && state.aroundCategory !== 'all') {
    list.sort(function(a, b) {
      return (b.category === state.aroundCategory) - (a.category === state.aroundCategory) || byDistance(a, b);
    });
  }

  return list;
}

function renderAroundScreen(data) {
  return renderStatusBar()
    + renderHeader('会場周辺', { sub: true, bell: false, rightType: 'info', back: true })
    + '<div class="exp-body gym-page around-page">'
    + renderAroundTournamentCard(data.next)
    + '<div class="gym-page-title around-page-title"><span class="around-page-title-icon">' + I.pinFill + '</span><span>会場近くの便利スポット</span></div>'
    + renderAroundCategoryChips()
    + renderAroundSortChips()
    + '<div class="gym-list around-list">' + getAroundList().map(renderAroundCard).join('') + '</div>'
    + '</div>'
    + renderInnerNavIfNeeded();
}

function renderAroundTournamentCard(d) {
  return '<div class="gym-tournament-card around-tournament-card">'
    + '<div class="around-tournament-logo">' + renderAroundTournamentLogoSvg() + '</div>'
    + '<div class="gym-tournament-info around-tournament-info">'
    + '<span class="gym-tournament-tag around-tournament-tag">' + esc(d.tag || '公式戦') + '</span>'
    + '<div class="gym-tournament-name around-tournament-name">' + esc(d.name) + '</div>'
    + '<div class="around-tournament-meta-rows">'
    + '<div class="around-tournament-meta-row">' + I.pin + '<span>' + esc(formatAroundVenue(d.venue)) + '</span></div>'
    + '<div class="around-tournament-meta-row">' + I.calendar + '<span>' + esc(formatAroundDate(d.date)) + '</span></div>'
    + '</div>'
    + '</div></div>';
}

function renderAroundTournamentLogoSvg() {
  return ''
    + '<svg class="around-tournament-badge" viewBox="0 0 120 120" aria-hidden="true">'
    + '<defs>'
    + '<path id="aroundBadgeTopArc" d="M 18 60 A 42 42 0 0 1 102 60" />'
    + '<path id="aroundBadgeBottomArc" d="M 102 60 A 42 42 0 0 1 18 60" />'
    + '</defs>'
    + '<circle cx="60" cy="60" r="56" fill="#ffffff" stroke="#1B7B3B" stroke-width="4"/>'
    + '<circle cx="60" cy="60" r="42" fill="#ffffff" stroke="#1B7B3B" stroke-width="2.5"/>'
    + '<text class="around-tournament-badge-text" textLength="50">'
    + '<textPath href="#aroundBadgeTopArc" startOffset="50%" text-anchor="middle">DOCUS OPEN</textPath>'
    + '</text>'
    + '<text class="around-tournament-badge-text" textLength="48">'
    + '<textPath href="#aroundBadgeBottomArc" startOffset="50%" text-anchor="middle">TOURNAMENT</textPath>'
    + '</text>'
    + '<circle cx="60" cy="60" r="19" fill="#1B7B3B"/>'
    + '<circle cx="60" cy="60" r="17" fill="#ffffff"/>'
    + '<path d="M51 49.5h18v4.5c0 3.9-2.8 7.1-6.5 7.8V67h5v3H52.5v-3h5v-5.2c-3.7-.7-6.5-3.9-6.5-7.8v-4.5zm3 3v1.6c0 2.9 2.1 5.4 4.9 5.9l1.1.2 1.1-.2c2.8-.5 4.9-3 4.9-5.9v-1.6H54zm-4.4 1.1h2.1v2.2h-2.1c-1.8 0-3.2-1.4-3.2-3.2v-2.2h2.1v2.2c0 .6.5 1 1 1zm20.8 0h-2.1v2.2h2.1c1.8 0 3.2-1.4 3.2-3.2v-2.2h-2.1v2.2c0 .6-.4 1-1.1 1z" fill="#1B7B3B"/>'
    + '</svg>';
}

function formatAroundVenue(venue) {
  return String(venue || '').replace(/\s*\([^)]*\)\s*$/, '');
}

function formatAroundDate(value) {
  var raw = String(value || '').trim();
  var match = raw.match(/^(\d{4})[-\/](\d{2})[-\/](\d{2})$/);
  if (!match) return raw;
  var y = Number(match[1]);
  var m = Number(match[2]);
  var d = Number(match[3]);
  var date = new Date(y, m - 1, d);
  var days = ['日', '月', '火', '水', '木', '金', '土'];
  return y + '/' + String(m).padStart(2, '0') + '/' + String(d).padStart(2, '0') + '（' + days[date.getDay()] + '）';
}

function renderAroundCategoryChips() {
  var items = [
    { key: 'convenience', label: 'コンビニ' },
    { key: 'drug', label: 'ドラッグストア' },
    { key: 'practice', label: '練習場' },
    { key: 'gas', label: 'ガソリン' },
    { key: 'laundry', label: 'ランドリー' },
    { key: 'parking', label: '駐車場' }
  ];
  return '<div class="around-category-chips">' + items.map(function(item) {
    return '<button class="around-category-chip' + (state.aroundCategory === item.key ? ' active' : '') + '" data-act="around-category" data-key="' + item.key + '"><span class="around-category-icon">' + getAroundCategoryIcon(item.key) + '</span><span>' + esc(item.label) + '</span></button>';
  }).join('') + '</div>';
}

function renderAroundSortChips() {
  var items = [
    { key: 'distance', label: '近い順', icon: I.pinFill },
    { key: 'open24', label: '24時間優先', icon: I.open24 },
    { key: 'open', label: '営業中', icon: I.store }
  ];
  return '<div class="gym-sort-chips around-sort-chips">' + items.map(function(item) {
    return '<button class="gym-sort-chip around-sort-chip' + (state.aroundSort === item.key ? ' active' : '') + '" data-act="around-sort" data-key="' + item.key + '"><span class="around-sort-icon">' + item.icon + '</span><span>' + esc(item.label) + '</span></button>';
  }).join('') + '</div>';
}

function renderAroundCard(item) {
  var highlightDistance = extractAroundDistanceValue(item.distanceLabel);
  var distanceText = item.distanceLabel || '';
  if (highlightDistance) {
    distanceText = distanceText.replace(highlightDistance, '<em>' + esc(highlightDistance) + '</em>');
  } else {
    distanceText = esc(distanceText);
  }
  return '<div class="gym-card around-card">'
    + '<div class="gym-card-photo around-card-photo"><img src="' + esc(item.imageUrl) + '" alt="' + esc(item.name) + '"></div>'
    + '<div class="around-card-content">'
    + '<div class="gym-card-name around-card-name">' + esc(item.name) + '</div>'
    + '<div class="gym-card-distance around-card-distance">' + distanceText + ' / ' + esc(item.timeLabel) + '</div>'
    + '<div class="around-card-tags">' + (item.tags || []).map(function(tag) { return '<span class="around-card-tag">' + esc(tag) + '</span>'; }).join('') + '</div>'
    + '<div class="around-card-buttons">'
    + '<button class="gym-map-btn around-map-btn" data-act="around-map" data-query="' + esc(item.name) + '">' + I.pin + '地図で見る</button>'
    + '<button class="gym-add-btn around-add-btn" data-act="around-add" data-id="' + esc(item.id) + '">' + I.plus + '追加</button>'
    + '</div>'
    + '</div>'
    + '</div>';
}

function extractAroundDistanceValue(label) {
  var text = String(label || '');
  var match = text.match(/([0-9]+(?:\.[0-9]+)?km)/i);
  return match ? match[1] : '';
}

  function getGourmetList() {
    var list = ((expeditionData.gourmets && expeditionData.gourmets[state.gourmetBase]) || []).slice();
    list = list.map(function(item){
      var clone = Object.assign({}, item);
      clone.distanceLabel = state.gourmetBase === 'venue' ? item.venueDistance : item.hotelDistance;
      clone.timeLabel = state.gourmetBase === 'venue' ? item.venueTime : item.hotelTime;
      return clone;
    });
    if (state.gourmetGenre && state.gourmetGenre !== 'all') {
      list = list.filter(function(item){ return item.genre === state.gourmetGenre; });
    }
    if (state.gourmetSort === 'cheap') {
      list.sort(function(a,b){ return Number(a.cheapRank || 999) - Number(b.cheapRank || 999); });
    } else if (state.gourmetSort === 'popular') {
      list.sort(function(a,b){ return Number(a.popularRank || 999) - Number(b.popularRank || 999); });
    } else if (state.gourmetSort === 'recommend') {
      list.sort(function(a,b){ return Number(a.recommendRank || 999) - Number(b.recommendRank || 999); });
    } else {
      list.sort(function(a,b){ return distanceNum(a.distanceLabel) - distanceNum(b.distanceLabel); });
    }
    return list;
  }

  function renderGourmetScreen(data) {
    return renderStatusBar()
      + renderHeader('グルメ', { sub: true, bell: false, rightType: 'info', back: true })
      + '<div class="exp-body gym-page gourmet-page">'
      + renderGourmetTournamentCard(data.next)
      + '<div class="gym-page-title gourmet-page-title"><span class="gourmet-title-mark"></span><span>近くのグルメを探す</span></div>'
      + renderGourmetBaseTabs()
      + renderGourmetSortChips()
      + renderGourmetGenreChips()
      + '<div class="gym-list gourmet-list">' + getGourmetList().map(renderGourmetCard).join('') + '</div>'
      + '<div class="gym-note gourmet-note"><span class="gym-note-icon">' + I.info + '</span><span>営業時間は変更される場合があります。ご利用前に各店舗の最新情報をご確認ください。</span></div>'
      + '</div>'
      + renderInnerNavIfNeeded();
  }

  function renderGourmetTournamentCard(d) {
    return '<div class="gym-tournament-card">'
      + '<div class="gym-tournament-logo">' + esc(d.category || 'JGTO') + '</div>'
      + '<div class="gym-tournament-info">'
      + '<span class="gym-tournament-tag">' + esc(d.tag || '公式戦') + '</span>'
      + '<div class="gym-tournament-name">' + esc(d.name) + '</div>'
      + '<div class="gym-tournament-meta"><span>' + I.pin + esc(d.venue) + '</span><span>' + I.calendar + esc(d.date) + '</span></div>'
      + '</div></div>';
  }

  function renderGourmetBaseTabs() {
    return '<div class="gym-base-tabs gourmet-base-tabs">'
      + '<button class="gym-base-tab' + (state.gourmetBase === 'venue' ? ' active' : '') + '" data-act="gourmet-base" data-key="venue">' + I.pinFill + '会場付近</button>'
      + '<button class="gym-base-tab' + (state.gourmetBase === 'hotel' ? ' active' : '') + '" data-act="gourmet-base" data-key="hotel">' + I.hotel + 'ホテル付近</button>'
      + '</div>';
  }

  function getGourmetGenreIcon(key) {
    var map = {
      all: I.iconAll,
      yakiniku: I.iconYakiniku,
      izakaya: I.iconIzakaya,
      setmeal: I.iconSetmeal,
      ramen: I.iconRamen,
      cafe: I.iconCafe,
      washoku: I.iconWashoku
    };
    return map[key] || I.fork;
  }

  function renderGourmetSortChips() {
    var items = [
      { key: 'distance', label: '近い順', icon: '↕' },
      { key: 'cheap', label: '安い順', icon: '¥' },
      { key: 'popular', label: '人気順', icon: '♨' },
      { key: 'recommend', label: 'おすすめ', icon: '☆' }
    ];
    return '<div class="gym-sort-chips gourmet-sort-chips">' + items.map(function(item){
      return '<button class="gym-sort-chip gourmet-sort-chip' + (state.gourmetSort === item.key ? ' active' : '') + '" data-act="gourmet-sort" data-key="' + item.key + '"><span class="gourmet-chip-icon">' + item.icon + '</span><span>' + esc(item.label) + '</span></button>';
    }).join('') + '</div>';
  }

  function renderGourmetGenreChips() {
    var items = [
      { key: 'all', label: 'すべて' },
      { key: 'yakiniku', label: '焼肉' },
      { key: 'izakaya', label: '居酒屋' },
      { key: 'setmeal', label: '定食' },
      { key: 'ramen', label: 'ラーメン' },
      { key: 'cafe', label: 'カフェ' },
      { key: 'washoku', label: '和食' }
    ];
    return '<div class="gourmet-genre-chips">' + items.map(function(item){
      return '<button class="gourmet-genre-chip' + (state.gourmetGenre === item.key ? ' active' : '') + '" data-act="gourmet-genre" data-key="' + item.key + '"><span class="gourmet-genre-icon">' + getGourmetGenreIcon(item.key) + '</span><span>' + esc(item.label) + '</span></button>';
    }).join('') + '</div>';
  }

  function renderGourmetCard(item) {
    return '<div class="gym-card gourmet-card">'
      + '<div class="gym-card-photo gourmet-card-photo"><img src="' + esc(item.imageUrl) + '" alt="' + esc(item.name) + '"></div>'
      + '<div class="gym-card-main gourmet-card-main">'
      + '<div class="gym-card-name gourmet-card-name">' + esc(item.name) + '</div>'
      + '<div class="gym-card-distance gourmet-card-distance">' + esc(item.distanceLabel) + ' / ' + esc(item.timeLabel) + '<span class="gourmet-inline-chip"><span class="gourmet-inline-chip-icon">' + getGourmetGenreIcon(item.genre) + '</span><span>' + esc(item.genreLabel) + '</span></span></div>'
      + '<div class="gym-card-line gourmet-card-line"><span class="gym-card-line-icon">◷</span><span>' + esc(item.hours) + '</span></div>'
      + '<div class="gym-card-line price gourmet-card-line"><span class="gym-card-line-icon price">¥</span><span class="gym-card-price-label">' + esc(item.priceLabel || '') + '</span></div>'
      + '<div class="gym-card-line gourmet-card-line"><span class="gym-card-line-icon">' + I.fork + '</span><span>' + esc(item.features) + '</span></div>'
      + '</div>'
      + '<div class="gym-card-actions gourmet-card-actions">'
      + '<span class="gym-card-badge gourmet-card-badge">' + esc(item.badge) + '</span>'
      + '<button class="gym-map-btn gourmet-map-btn" data-act="gourmet-map" data-query="' + esc(item.name) + '">' + I.pin + '地図で見る</button>'
      + '<button class="gym-add-btn gourmet-add-btn" data-act="gourmet-add" data-id="' + esc(item.id) + '">' + I.plus + '追加</button>'
      + '</div>'
      + '</div>';
  }

  function getGymList() {
    var list = ((expeditionData.gyms && expeditionData.gyms[state.gymBase]) || []).slice();
    list = list.map(function(g){
      var clone = Object.assign({}, g);
      clone.distanceLabel = state.gymBase === "venue" ? g.venueDistance : g.hotelDistance;
      clone.timeLabel = state.gymBase === "venue" ? g.venueTime : g.hotelTime;
      return clone;
    });
    if (state.gymSort === "open24") {
      list.sort(function(a,b){
        var av = String(a.hours || "").indexOf("24") > -1 ? 0 : 1;
        var bv = String(b.hours || "").indexOf("24") > -1 ? 0 : 1;
        return av - bv;
      });
    } else if (state.gymSort === "price") {
      list.sort(function(a,b){
        return Number(a.priceRank || 999) - Number(b.priceRank || 999);
      });
    } else {
      list.sort(function(a,b){
        return distanceNum(a.distanceLabel) - distanceNum(b.distanceLabel);
      });
    }
    return list;
  }

  function distanceNum(text) {
    var m = String(text || "").match(/[\d.]+/);
    return m ? Number(m[0]) : 999;
  }

  function renderGymScreen(data) {
    return renderStatusBar()
      + renderHeader('ジム', { sub: true, bell: false, rightType: 'info', back: true })
      + '<div class="exp-body gym-page">'
      + renderGymTournamentCard(data.next)
      + '<div class="gym-page-title">近くのジムを探す</div>'
      + renderGymBaseTabs()
      + renderGymSortChips()
      + '<div class="gym-list">' + getGymList().map(renderGymCard).join('') + '</div>'
      + '<div class="gym-note"><span class="gym-note-icon">' + I.info + '</span><span>営業時間は変更される場合があります。ご利用前に各ジムの公式サイトをご確認ください。</span></div>'
      + '</div>'
      + renderInnerNavIfNeeded();
  }

  function renderGymTournamentCard(d) {
    return '<div class="gym-tournament-card">'
      + '<div class="gym-tournament-logo">' + esc(d.category || "JGTO") + '</div>'
      + '<div class="gym-tournament-info">'
      + '<span class="gym-tournament-tag">' + esc(d.tag || "公式戦") + '</span>'
      + '<div class="gym-tournament-name">' + esc(d.name) + '</div>'
      + '<div class="gym-tournament-meta"><span>' + I.pin + esc(d.venue) + '</span><span>' + I.calendar + esc(d.date) + '</span></div>'
      + '</div></div>';
  }

  function renderGymBaseTabs() {
    return '<div class="gym-base-tabs">'
      + '<button class="gym-base-tab' + (state.gymBase === 'venue' ? ' active' : '') + '" data-act="gym-base" data-key="venue">会場付近</button>'
      + '<button class="gym-base-tab' + (state.gymBase === 'hotel' ? ' active' : '') + '" data-act="gym-base" data-key="hotel">ホテル付近</button>'
      + '</div>';
  }

  function renderGymSortChips() {
    var items = [
      { key: 'distance', label: '近い順' },
      { key: 'open24', label: '24時間優先' },
      { key: 'price', label: '料金順' }
    ];
    return '<div class="gym-sort-chips">' + items.map(function(item){
      return '<button class="gym-sort-chip' + (state.gymSort === item.key ? ' active' : '') + '" data-act="gym-sort" data-key="' + item.key + '">' + esc(item.label) + '</button>';
    }).join('') + '</div>';
  }

  function renderGymCard(g) {
    return '<div class="gym-card">'
      + '<div class="gym-card-photo">' + renderGymPhoto(g) + '</div>'
      + '<div class="gym-card-main">'
      + '<div class="gym-card-name">' + esc(g.name) + '</div>'
      + '<div class="gym-card-distance">' + esc(g.distanceLabel) + ' / ' + esc(g.timeLabel) + '<span class="gym-card-near">近い</span></div>'
      + '<div class="gym-card-line"><span class="gym-card-line-icon">◷</span><span>' + esc(g.hours) + '</span></div>'
      + '<div class="gym-card-line"><span class="gym-card-line-icon">▰</span><span>' + esc(g.facility) + '</span></div>'
      + '</div>'
      + '<div class="gym-card-actions">'
      + '<span class="gym-card-badge">' + esc(g.type) + '</span>'
      + '<button class="gym-map-btn" data-act="gym-map" data-query="' + esc(g.name) + '">' + I.pin + '地図で見る</button>'
      + '<button class="gym-add-btn" data-act="gym-add" data-id="' + esc(g.id) + '">' + I.plus + '追加</button>'
      + '</div>'
      + '</div>';
  }

  function renderGymPhoto(g) {
    if (g.imageUrl) return '<img src="' + esc(g.imageUrl) + '" alt="' + esc(g.name) + '">';
    var label = /GOLD|ゴールド/i.test(g.name) ? 'GOLD' : (/FIT365/i.test(g.name) ? 'FIT365' : 'ANYTIME');
    return '<div class="gym-photo-placeholder"><span class="gym-photo-badge">' + label + '</span><span class="gym-photo-sign"></span></div>';
  }



  function getOnsenList() {
    var list = ((expeditionData.onsens && expeditionData.onsens[state.onsenBase]) || []).slice();
    list = list.map(function(item) {
      var clone = Object.assign({}, item);
      clone.distanceLabel = state.onsenBase === 'venue' ? item.venueDistance : item.hotelDistance;
      clone.timeLabel = state.onsenBase === 'venue' ? item.venueTime : item.hotelTime;
      return clone;
    });
    if (state.onsenFilter === 'sauna') {
      list = list.filter(function(item) { return !!item.hasSauna; });
    } else if (state.onsenFilter === 'openair') {
      list = list.filter(function(item) { return !!item.hasOpenAir; });
    }
    list.sort(function(a, b) {
      return distanceNum(a.distanceLabel) - distanceNum(b.distanceLabel);
    });
    return list;
  }

  function renderOnsenScreen(data) {
    return renderStatusBar()
      + renderHeader('温泉', { sub: true, bell: false, rightType: 'info', back: true })
      + '<div class="exp-body gym-page">'
      + renderOnsenTournamentCard(data.next)
      + '<div class="gym-page-title">近くの温泉・サウナを探す</div>'
      + renderOnsenBaseTabs()
      + renderOnsenFilterChips()
      + '<div class="gym-list">' + getOnsenList().map(renderOnsenCard).join('') + '</div>'
      + '</div>';
  }

  function renderOnsenTournamentCard(d) {
    return '<div class="gym-tournament-card">'
      + '<div class="gym-tournament-logo">' + esc(d.category || 'JGTO') + '</div>'
      + '<div class="gym-tournament-info">'
      + '<span class="gym-tournament-tag">' + esc(d.tag || '公式戦') + '</span>'
      + '<div class="gym-tournament-name">' + esc(d.name) + '</div>'
      + '<div class="gym-tournament-meta"><span>' + I.pin + esc(d.venue) + '</span><span>' + I.calendar + esc(d.date) + '</span></div>'
      + '</div></div>';
  }

  function renderOnsenBaseTabs() {
    return '<div class="gym-base-tabs">'
      + '<button class="gym-base-tab' + (state.onsenBase === 'venue' ? ' active' : '') + '" data-act="onsen-base" data-key="venue">会場付近</button>'
      + '<button class="gym-base-tab' + (state.onsenBase === 'hotel' ? ' active' : '') + '" data-act="onsen-base" data-key="hotel">ホテル付近</button>'
      + '</div>';
  }

  function renderOnsenFilterChips() {
    var items = [
      { key: 'distance', label: '近い順' },
      { key: 'sauna', label: 'サウナあり' },
      { key: 'openair', label: '露天風呂あり' }
    ];
    return '<div class="gym-sort-chips">' + items.map(function(item) {
      return '<button class="gym-sort-chip' + (state.onsenFilter === item.key ? ' active' : '') + '" data-act="onsen-filter" data-key="' + item.key + '">' + esc(item.label) + '</button>';
    }).join('') + '</div>';
  }

  function renderOnsenCard(item) {
    return '<div class="gym-card">'
      + '<div class="gym-card-photo"><img src="' + esc(item.imageUrl) + '" alt="' + esc(item.name) + '"></div>'
      + '<div class="gym-card-main">'
      + '<div class="gym-card-name">' + esc(item.name) + '</div>'
      + '<div class="gym-card-distance">' + esc(item.distanceLabel) + ' / ' + esc(item.timeLabel) + '<span class="gym-card-near">近い</span></div>'
      + '<div class="gym-card-line"><span class="gym-card-line-icon">◷</span><span>' + esc(item.hours) + '</span></div>'
      + '<div class="gym-card-line price"><span class="gym-card-line-icon price">¥</span><span class="gym-card-price-label">' + esc(item.priceLabel || '') + '</span></div>'
      + '<div class="gym-card-line"><span class="gym-card-line-icon">♨</span><span>' + esc(item.features) + '</span></div>'
      + '</div>'
      + '<div class="gym-card-actions">'
      + '<span class="gym-card-badge">' + esc(item.badge) + '</span>'
      + '<button class="gym-map-btn" data-act="onsen-map" data-query="' + esc(item.name) + '">' + I.pin + '地図で見る</button>'
      + '<button class="gym-add-btn" data-act="onsen-add" data-id="' + esc(item.id) + '">' + I.plus + '追加</button>'
      + '</div>'
      + '</div>';
  }

  function renderHotelTournamentCard(d) {
    return '<div class="hotel-t-card"><div class="hotel-t-logo">' + esc(d.category) + '</div><div class="hotel-t-body"><div class="hotel-t-top"><span class="exp-tag">' + esc(d.tag) + '</span><span class="hotel-t-chev">' + I.chevron + '</span></div><div class="hotel-t-name">' + esc(d.name) + '</div><div class="hotel-t-meta"><span>' + I.pin + esc(d.venue) + '</span><span>' + I.calendar + esc(d.date) + '</span></div></div></div>';
  }

  function renderToolButton(type, label) {
    var icon = type === 'rakuten'
      ? '<span class="hotel-tool-brand hotel-tool-r">R</span>'
      : '<span class="hotel-tool-brand hotel-tool-g">' + I.google + '</span>';
    return '<button class="hotel-tool-btn" data-act="hotel-search" data-key="' + type + '">' + icon + '<span class="hotel-tool-label">' + esc(label) + '</span><span class="hotel-tool-chev">' + I.chevron + '</span></button>';
  }

  function renderSelectedHotel(h) {
    return '<div class="hotel-selected-card">' +
      '<div class="hotel-photo"></div>' +
      '<div class="hotel-selected-body">' +
        '<div class="hotel-selected-name">' + esc(h.name) + '</div>' +
        '<div class="hotel-selected-area">' + I.pin + esc(h.area) + '</div>' +
        '<div class="hotel-selected-grid">' +
          '<div><span class="hotel-mini-label">チェックイン</span><strong>' + esc(h.checkin) + '</strong></div>' +
          '<div><span class="hotel-mini-label">チェックアウト</span><strong>' + esc(h.checkout) + '</strong></div>' +
          '<div><span class="hotel-mini-label">宿泊数</span><strong>' + esc(h.nights) + '</strong></div>' +
          '<div><span class="hotel-mini-label">宿泊料金（合計）</span><strong class="hotel-price">' + esc(h.price) + '</strong></div>' +
        '</div>' +
        '<div class="hotel-selected-actions"><button class="hotel-sub-btn" data-act="hotel-detail">' + I.receipt + '詳細を見る</button><button class="hotel-sub-btn is-green" data-act="hotel-edit">' + I.edit + '編集</button></div>' +
      '</div>' +
    '</div>';
  }


  function hotelValue(key) {
    var h = expeditionData.hotel.selected || {};
    return h[key] || "";
  }


  function renderHotelDetailSheet() {
    var h = expeditionData.hotel.selected || {};
    return '<div class="hotel-sheet-backdrop detail" data-act="hotel-detail-close"></div>' +
      '<div class="hotel-detail-sheet" role="dialog" aria-modal="true">' +
        '<div class="hotel-sheet-handle"></div>' +
        '<div class="hotel-detail-hero">' +
          '<div class="hotel-detail-photo"></div>' +
          '<button class="hotel-detail-close" data-act="hotel-detail-close" aria-label="閉じる">×</button>' +
        '</div>' +
        '<div class="hotel-detail-content">' +
          '<div class="hotel-detail-title-row">' +
            '<div><h3>' + esc(h.name || "未設定の宿泊先") + '</h3><p>' + esc(h.area || "会場までの距離を未設定") + '</p></div>' +
            '<span class="hotel-detail-price">' + esc(h.price || "¥0") + '</span>' +
          '</div>' +
          '<div class="hotel-detail-grid">' +
            detailItem("チェックイン", h.checkin || "未設定") +
            detailItem("チェックアウト", h.checkout || "未設定") +
            detailItem("宿泊数", h.nights || "未設定") +
            detailItem("予約サイト", h.site || "未設定") +
          '</div>' +
          '<div class="hotel-detail-block">' +
            '<div class="hotel-detail-label">予約番号</div>' +
            '<div class="hotel-detail-value">' + esc(h.reservationNo || "未設定") + '</div>' +
          '</div>' +
          renderHotelReceiptSummary() +
          renderHotelReceiptList() +
          '<div class="hotel-detail-block">' +
            '<div class="hotel-detail-label">メモ</div>' +
            '<div class="hotel-detail-value multi">' + esc(h.memo || "メモはまだありません。") + '</div>' +
          '</div>' +
          '<div class="hotel-detail-actions">' +
            '<button class="hotel-detail-action" data-act="hotel-detail-map">' + I.pin + '<span>Googleマップ</span></button>' +
            '<button class="hotel-detail-action" data-act="hotel-detail-reservation">' + I.link + '<span>予約サイト</span></button>' +
            '<button class="hotel-detail-action" data-act="hotel-detail-receipt">' + I.receipt + '<span>領収書追加</span></button>' +
            '<button class="hotel-detail-action danger" data-act="hotel-detail-delete">' + I.trash + '<span>削除</span></button>' +
          '</div>' +
          '<button class="hotel-detail-edit-main" data-act="hotel-edit">' + I.edit + '宿泊先を編集</button>' +
        '</div>' +
      '</div>';
  }

  function detailItem(label, value) {
    return '<div class="hotel-detail-item"><span>' + esc(label) + '</span><strong>' + esc(value) + '</strong></div>';
  }

  function currentReceiptDraft() {
    if (!state.editingReceiptId) return null;
    var list = expeditionData.hotelReceipts || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === state.editingReceiptId) return list[i];
    }
    return null;
  }

  function renderReceiptFormSheet() {
    var h = expeditionData.hotel.selected || {};
    var draft = currentReceiptDraft();
    var isEdit = !!draft;
    var amount = isEdit ? (draft.amount || "") : (h.price || formatYen(syncLodgingExpense()));
    return '<div class="hotel-sheet-backdrop receipt" data-act="receipt-form-close"></div>' +
      '<div class="hotel-receipt-sheet" role="dialog" aria-modal="true">' +
        '<div class="hotel-sheet-handle"></div>' +
        '<div class="hotel-sheet-head">' +
          '<div><h3>' + (isEdit ? '領収書を編集' : '領収書を追加') + '</h3><p>宿泊費カテゴリとして遠征費に保存します。</p></div>' +
          '<button class="hotel-sheet-close" data-act="receipt-form-close" aria-label="閉じる">×</button>' +
        '</div>' +
        '<div class="receipt-category-pill">' + I.hotel + '<span>カテゴリ：宿泊費</span></div>' +
        '<div class="hotel-form receipt-form">' +
          formField("receiptTitle", "内容", isEdit ? (draft.title || "") : "ホテル宿泊費", "例：ホテル宿泊費") +
          '<div class="hotel-form-grid">' +
            formField("receiptAmount", "金額", amount, "¥12,800") +
            formField("receiptDate", "日付", isEdit ? (draft.date || "") : todayJP(), "2026/04/22") +
          '</div>' +
          '<div class="hotel-form-grid">' +
            formField("receiptPayment", "支払方法", isEdit ? (draft.payment || "") : "クレジットカード", "現金 / カード") +
            formField("receiptVendor", "支払先", isEdit ? (draft.vendor || "") : (h.name || ""), "ホテル名") +
          '</div>' +
          '<label class="hotel-field hotel-field-full"><span>メモ</span><textarea id="receiptMemo" rows="3" placeholder="領収書番号、駐車場代込みなど">' + esc(isEdit ? (draft.memo || "") : "") + '</textarea></label>' +
        '</div>' +
        '<div class="hotel-sheet-actions">' +
          '<button class="hotel-sheet-cancel" data-act="receipt-form-close">キャンセル</button>' +
          '<button class="hotel-sheet-save" data-act="receipt-form-save">' + (isEdit ? '更新する' : '保存する') + '</button>' +
        '</div>' +
      '</div>';
  }


  function renderHotelReceiptSummary() {
    var count = (expeditionData.hotelReceipts || []).length;
    var total = sumHotelReceipts();
    return '<div class="hotel-receipt-summary">' +
      '<div class="hotel-receipt-summary-main">' +
        '<span class="hotel-receipt-summary-icon">' + I.receipt + '</span>' +
        '<div><strong>領収書 ' + count + '件</strong><small>宿泊費カテゴリに保存済み</small></div>' +
      '</div>' +
      '<span class="hotel-receipt-summary-total">' + formatYen(total) + '</span>' +
    '</div>';
  }

  function renderHotelReceiptList() {
    var receipts = expeditionData.hotelReceipts || [];
    if (!receipts.length) {
      return '<div class="hotel-receipt-empty">' +
        '<span class="hotel-receipt-empty-icon">' + I.receipt + '</span>' +
        '<div><strong>まだ領収書がありません</strong><small>「領収書追加」から宿泊費の領収書を保存できます。</small></div>' +
      '</div>';
    }

    return '<div class="hotel-receipt-list">' + receipts.map(function (r) {
      return '<div class="hotel-receipt-item" data-act="receipt-edit" data-id="' + esc(r.id) + '" data-receipt-id="' + esc(r.id) + '">' +
        '<div class="hotel-receipt-item-main">' +
          '<div class="hotel-receipt-item-title">' + esc(r.title || "ホテル宿泊費") + '</div>' +
          '<div class="hotel-receipt-item-meta">' +
            '<span>' + esc(r.date || "日付未設定") + '</span>' +
            '<span>' + esc(r.payment || "支払方法未設定") + '</span>' +
            '<span>' + esc(r.vendor || "支払先未設定") + '</span>' +
          '</div>' +
          (r.memo ? '<div class="hotel-receipt-item-memo">' + esc(r.memo) + '</div>' : '') +
        '</div>' +
        '<div class="hotel-receipt-item-side">' +
          '<strong>' + esc(r.amount || "¥0") + '</strong>' +
          '<button class="hotel-receipt-delete" data-act="receipt-delete" data-id="' + esc(r.id) + '" aria-label="領収書を削除">' + I.trash + '</button>' +
        '</div>' +
      '</div>';
    }).join("") + '</div>';
  }

  function renderHotelFormSheet() {
    var title = state.hotelFormMode === "edit" ? "宿泊先を編集" : "宿泊先を手動で追加";
    return '<div class="hotel-sheet-backdrop" data-act="hotel-form-close"></div>' +
      '<div class="hotel-sheet" role="dialog" aria-modal="true">' +
        '<div class="hotel-sheet-handle"></div>' +
        '<div class="hotel-sheet-head">' +
          '<div><h3>' + esc(title) + '</h3><p>予約後のホテル情報を遠征に保存できます。</p></div>' +
          '<button class="hotel-sheet-close" data-act="hotel-form-close" aria-label="閉じる">×</button>' +
        '</div>' +
        '<div class="hotel-form">' +
          formField("hotelName", "ホテル名", hotelValue("name"), "例：米子ワシントンホテルプラザ") +
          formField("hotelArea", "住所・会場までの距離", hotelValue("area"), "例：大山ゴルフクラブまで 約12.5km") +
          '<div class="hotel-form-grid">' +
            formField("hotelCheckin", "チェックイン", hotelValue("checkin"), "2026/04/22（水）") +
            formField("hotelCheckout", "チェックアウト", hotelValue("checkout"), "2026/04/23（木）") +
          '</div>' +
          '<div class="hotel-form-grid">' +
            formField("hotelNights", "宿泊数", hotelValue("nights"), "1泊") +
            formField("hotelPrice", "宿泊料金", hotelValue("price"), "¥12,800") +
          '</div>' +
          '<div class="hotel-form-grid">' +
            formField("hotelSite", "予約サイト", hotelValue("site"), "楽天トラベル") +
            formField("hotelReservationNo", "予約番号", hotelValue("reservationNo"), "ABC123456") +
          '</div>' +
          formField("hotelReservationUrl", "予約ページURL", hotelValue("reservationUrl"), "https://travel.rakuten.co.jp/...") +
          '<div class="hotel-form-grid">' +
          '</div>' +
          '<label class="hotel-field hotel-field-full"><span>メモ</span><textarea id="hotelMemo" rows="3" placeholder="駐車場、朝食、領収書など">' + esc(hotelValue("memo")) + '</textarea></label>' +
        '</div>' +
        '<div class="hotel-sheet-actions">' +
          '<button class="hotel-sheet-cancel" data-act="hotel-form-close">キャンセル</button>' +
          '<button class="hotel-sheet-save" data-act="hotel-form-save">保存する</button>' +
        '</div>' +
      '</div>';
  }

  function formField(id, label, value, placeholder) {
    return '<label class="hotel-field"><span>' + esc(label) + '</span><input id="' + esc(id) + '" value="' + esc(value) + '" placeholder="' + esc(placeholder) + '"></label>';
  }


  function renderHotelExpenseSummary() {
    var lodging = syncLodgingExpense();
    return '<section class="hotel-section">' +
      '<h3 class="hotel-sec-title">遠征費への反映</h3>' +
      '<div class="hotel-expense-card">' +
        '<div class="hotel-expense-main">' +
          '<span class="hotel-expense-icon">' + I.hotel + '</span>' +
          '<div>' +
            '<div class="hotel-expense-label">宿泊費カテゴリ</div>' +
            '<div class="hotel-expense-note">保存した宿泊料金を遠征費に自動反映</div>' +
          '</div>' +
        '</div>' +
        '<div class="hotel-expense-amount">' + formatYen(lodging) + '</div>' +
      '</div>' +
    '</section>';
  }

  function renderInfoRow(icon, title, sub, act) {
    return '<button class="hotel-info-row" data-act="' + act + '"><span class="hotel-info-icon">' + icon + '</span><span class="hotel-info-text"><strong>' + esc(title) + '</strong>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span><span class="hotel-info-chev">' + I.chevron + '</span></button>';
  }

  function renderHotelScreen(data) {
    return renderStatusBar() + renderHeader('ホテル', { back: true, sub: true }) + '<div class="exp-body hotel-body">' + renderHotelTournamentCard(data.next) + '<section class="hotel-section"><h3 class="hotel-sec-title">会場近くのホテルを探す</h3><div class="hotel-tools">' + renderToolButton('rakuten', '楽天トラベルで探す') + renderToolButton('google', 'Googleマップで探す') + '</div></section><section class="hotel-section"><h3 class="hotel-sec-title">選択中の宿泊先</h3>' + renderSelectedHotel(data.hotel.selected) + '</section>' + renderHotelExpenseSummary() + '<section class="hotel-section hotel-links">' + renderInfoRow(I.add, '手動で追加', '予約サイトに載っていない宿泊先も登録できます。', 'hotel-manual') + renderInfoRow(I.receipt, 'メモ', data.hotel.selected.memo || 'ホテルに関するメモを保存できます。', 'hotel-memo') + '</section></div>' + renderNav() + (state.showHotelDetail ? renderHotelDetailSheet() : '') + (state.showHotelForm ? renderHotelFormSheet() : '') + (state.showReceiptForm ? renderReceiptFormSheet() : '');
  }

  function renderNav() {
    var tabs = [
      { key: 'home', name: 'ホーム', icon: 'flag' },
      { key: 'schedule', name: 'スケジュール', icon: 'schedule' },
      { key: 'expedition', name: '遠征', icon: 'bag', active: true },
      { key: 'record', name: '記録', icon: 'chart' },
      { key: 'mypage', name: 'マイページ', icon: 'user' }
    ];
    return '<nav class="exp-nav">' + tabs.map(function (t) { return '<button class="exp-nav-item' + (t.active ? ' active' : '') + '" data-act="nav" data-key="' + esc(t.key) + '">' + I[t.icon] + '<span>' + esc(t.name) + '</span></button>'; }).join('') + '</nav>';
  }

  function shouldShowInnerNav() {
    var root = document.getElementById('expedition-root');
    return !!(root && root.getAttribute('data-standalone') === 'true');
  }

  function renderInnerNavIfNeeded() {
    return shouldShowInnerNav() ? renderNav() : '';
  }

  function mount(root) {
    if (!root) return;
    if (state.screen === "hotel") root.innerHTML = renderHotelScreen(expeditionData);
    else if (state.screen === "gym") root.innerHTML = renderGymScreen(expeditionData);
    else if (state.screen === "onsen") root.innerHTML = renderOnsenScreen(expeditionData);
    else if (state.screen === "gourmet") root.innerHTML = renderGourmetScreen(expeditionData);
    else if (state.screen === "around") root.innerHTML = renderAroundScreen(expeditionData);
    else if (state.screen === "flight") root.innerHTML = renderFlightScreen(expeditionData);
    else root.innerHTML = renderTopScreen(expeditionData);
  }

  function setScreen(screen) {
    state.screen = screen || "top";
    if (screen !== "hotel") {
      state.showHotelDetail = false;
      state.showHotelForm = false;
      state.showReceiptForm = false;
      state.editingReceiptId = null;
    }
    var root = document.getElementById("expedition-root");
    mount(root);
    try { window.scrollTo(0, 0); } catch (e) {}
  }


  function buildSearchText(kind) {
    var venue = expeditionData.next.venue || "";
    if (kind === "rakuten") {
      return venue + " 周辺 ホテル";
    }
    return venue + " 周辺 ホテル";
  }

  function openHotelSearch(kind) {
    var q = encodeURIComponent(buildSearchText(kind));
    var url;
    if (kind === "rakuten") {
      // 楽天トラベルの検索ページへ遷移。将来はアフィリエイトID付きURL/API連携へ差し替え。
      url = "https://travel.rakuten.co.jp/keyword/Search.do?f_query=" + q;
    } else {
      // Googleマップで会場周辺ホテルを検索。
      url = "https://www.google.com/maps/search/?api=1&query=" + q;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function showToast(message) {
    var root = document.getElementById("expedition-root");
    if (!root) return;
    var old = root.querySelector(".exp-toast");
    if (old) old.remove();
    var toast = document.createElement("div");
    toast.className = "exp-toast";
    toast.textContent = message;
    root.appendChild(toast);
    requestAnimationFrame(function () {
      toast.classList.add("show");
    });
    setTimeout(function () {
      toast.classList.remove("show");
      setTimeout(function () { toast.remove(); }, 220);
    }, 1800);
  }


  function openHotelForm(mode) {
    state.hotelFormMode = mode || "add";
    state.showHotelForm = true;
    state.showHotelDetail = false;
    var root = document.getElementById("expedition-root");
    if (root) mount(root);
  }

  function closeHotelForm() {
    state.showHotelForm = false;
    var root = document.getElementById("expedition-root");
    if (root) mount(root);
  }

  function readInput(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function saveHotelForm() {
    var next = {
      name: readInput("hotelName") || "未設定の宿泊先",
      area: readInput("hotelArea"),
      checkin: readInput("hotelCheckin"),
      checkout: readInput("hotelCheckout"),
      nights: readInput("hotelNights"),
      price: readInput("hotelPrice"),
      site: readInput("hotelSite"),
      reservationNo: readInput("hotelReservationNo"),
      reservationUrl: readInput("hotelReservationUrl"),
      memo: readInput("hotelMemo")
    };
    expeditionData.hotel.selected = Object.assign({}, expeditionData.hotel.selected, next);
    saveHotelToStorage();
    var lodging = syncLodgingExpense();
    state.showHotelForm = false;
    var root = document.getElementById("expedition-root");
    if (root) mount(root);
    showToast("宿泊費 " + formatYen(lodging) + " を遠征費へ反映しました");
  }


  function openHotelDetail() {
    state.showHotelDetail = true;
    var root = document.getElementById("expedition-root");
    if (root) mount(root);
  }

  function closeHotelDetail() {
    state.showHotelDetail = false;
    var root = document.getElementById("expedition-root");
    if (root) mount(root);
  }

  function openHotelMap() {
    var h = expeditionData.hotel.selected || {};
    var q = encodeURIComponent((h.name || "") + " " + (h.area || expeditionData.next.venue || ""));
    window.open("https://www.google.com/maps/search/?api=1&query=" + q, "_blank", "noopener,noreferrer");
  }

  function openReservationSite() {
    var h = expeditionData.hotel.selected || {};
    if (h.reservationUrl) {
      window.open(h.reservationUrl, "_blank", "noopener,noreferrer");
      return;
    }
    openHotelSearch("rakuten");
  }

  function deleteHotel() {
    expeditionData.hotel.selected = {
      name: "宿泊先未設定",
      area: expeditionData.next.venue + " 周辺",
      checkin: "",
      checkout: "",
      nights: "",
      price: "",
      site: "",
      reservationNo: "",
      reservationUrl: "",
      memo: ""
    };
    saveHotelToStorage();
    expeditionData.hotelReceipts = [];
    saveHotelReceipts();
    syncLodgingExpense();
    state.showHotelDetail = false;
    var root = document.getElementById("expedition-root");
    if (root) mount(root);
    showToast("宿泊先と宿泊費をリセットしました");
  }

  function openReceiptForm() {
    state.editingReceiptId = null;
    state.showReceiptForm = true;
    state.showHotelDetail = false;
    var root = document.getElementById("expedition-root");
    if (root) mount(root);
  }

  function closeReceiptForm() {
    state.showReceiptForm = false;
    state.editingReceiptId = null;
    var root = document.getElementById("expedition-root");
    if (root) mount(root);
  }

  function saveReceiptForm() {
    var receipt = {
      id: state.editingReceiptId || ("hotel-receipt-" + Date.now()),
      category: "宿泊費",
      title: readInput("receiptTitle") || "ホテル宿泊費",
      amount: readInput("receiptAmount") || formatYen(syncLodgingExpense()),
      date: readInput("receiptDate") || todayJP(),
      payment: readInput("receiptPayment"),
      vendor: readInput("receiptVendor"),
      memo: readInput("receiptMemo")
    };

    expeditionData.hotelReceipts = expeditionData.hotelReceipts || [];

    if (state.editingReceiptId) {
      expeditionData.hotelReceipts = expeditionData.hotelReceipts.map(function (r) {
        return r.id === state.editingReceiptId ? receipt : r;
      });
    } else {
      expeditionData.hotelReceipts.push(receipt);
    }

    saveHotelReceipts();

    var receiptTotal = sumHotelReceipts();
    if (receiptTotal > 0) {
      expeditionData.expenseSummary.lodging = receiptTotal;
      try {
        localStorage.setItem("pnx_expedition_expense_summary", JSON.stringify(expeditionData.expenseSummary));
      } catch (e) {}
    }

    var wasEdit = !!state.editingReceiptId;
    state.showReceiptForm = false;
    state.editingReceiptId = null;
    var root = document.getElementById("expedition-root");
    if (root) mount(root);
    showToast(wasEdit ? "領収書を更新しました" : "宿泊費の領収書を保存しました");
  }

  function editReceipt(id) {
    state.editingReceiptId = id;
    state.showReceiptForm = true;
    state.showHotelDetail = false;
    var root = document.getElementById("expedition-root");
    if (root) mount(root);
  }


  function deleteReceipt(id) {
    expeditionData.hotelReceipts = (expeditionData.hotelReceipts || []).filter(function (r) {
      return r.id !== id;
    });
    saveHotelReceipts();

    var receiptTotal = sumHotelReceipts();
    if (receiptTotal > 0) {
      expeditionData.expenseSummary.lodging = receiptTotal;
    } else {
      expeditionData.expenseSummary.lodging = syncLodgingExpense();
    }
    try {
      localStorage.setItem("pnx_expedition_expense_summary", JSON.stringify(expeditionData.expenseSummary));
    } catch (e) {}

    var root = document.getElementById("expedition-root");
    if (root) mount(root);
    showToast("領収書を削除しました");
  }

  function onClick(e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var act = el.getAttribute('data-act');
    var key = el.getAttribute('data-key');
    switch (act) {
      case 'cat':
        if (key === 'hotel') setScreen('hotel');
        else if (key === 'flight') setScreen('flight');
        else if (key === 'gourmet') setScreen('gourmet');
        else if (key === 'gym') setScreen('gym');
        else if (key === 'onsen') setScreen('onsen');
        else if (key === 'around') setScreen('around');
        else console.log('[遠征] カテゴリ:', key);
        break;

case 'around-category':
  state.aroundCategory = key || 'convenience';
  mount(document.getElementById('expedition-root'));
  break;
case 'around-sort':
  state.aroundSort = key || 'distance';
  mount(document.getElementById('expedition-root'));
  break;
case 'around-map':
  window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(el.getAttribute('data-query') || ''), '_blank');
  break;
case 'around-add':
  showToast('遠征プランに会場周辺スポットを追加しました');
  break;
      case 'flight-scope':
        state.flightScope = key || 'all';
        mount(document.getElementById('expedition-root'));
        break;
      case 'flight-sort':
        state.flightSort = key || 'schedule';
        mount(document.getElementById('expedition-root'));
        break;
      case 'flight-map':
        window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(el.getAttribute('data-query') || ''), '_blank');
        break;
      case 'flight-add':
        showToast('航空券情報を遠征プランに追加しました');
        break;
      case 'flight-action':
        if (key === 'detail') showToast('航空券の詳細を確認できます');
        else if (key === 'edit') showToast('航空券情報を編集できます');
        else if (key === 'manual') showToast('手動で予約を追加します');
        else if (key === 'scan') showToast('スクショから航空券情報を読み取ります');
        else if (key === 'mail') showToast('メールから航空券情報を読み取ります');
        else if (key === 'memo') showToast('メモの詳細を確認できます');
        break;
      case 'gourmet-base':
        state.gourmetBase = key || 'venue';
        mount(document.getElementById('expedition-root'));
        break;
      case 'gourmet-sort':
        state.gourmetSort = key || 'distance';
        mount(document.getElementById('expedition-root'));
        break;
      case 'gourmet-genre':
        state.gourmetGenre = key || 'all';
        mount(document.getElementById('expedition-root'));
        break;
      case 'gourmet-map':
        window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(el.getAttribute('data-query') || ''), '_blank');
        break;
      case 'gourmet-add':
        showToast('遠征プランにグルメを追加しました');
        break;
      case 'gym-base':
        state.gymBase = key || 'hotel';
        mount(document.getElementById('expedition-root'));
        break;
      case 'gym-sort':
        state.gymSort = key || 'distance';
        mount(document.getElementById('expedition-root'));
        break;
      case 'gym-map':
        window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(el.getAttribute('data-query') || ''), '_blank');
        break;
      case 'gym-add':
        showToast('遠征プランにジムを追加しました');
        break;
      case 'info':
        if (state.screen === 'gourmet') showToast('会場付近・ホテル付近の近くのグルメを探せます');
        else if (state.screen === 'onsen') showToast('会場付近・ホテル付近の近くの温泉・サウナを探せます');
        else if (state.screen === 'around') showToast('会場近くの便利スポットをカテゴリ別に探せます');
        else if (state.screen === 'flight') showToast('予約済みの航空券と、現地空港から会場・ホテルまでの距離をまとめて確認できます');
        else showToast('会場付近・ホテル付近の近くのジムを探せます');
        break;
      case 'onsen-base':
        state.onsenBase = key || 'hotel';
        mount(document.getElementById('expedition-root'));
        break;
      case 'onsen-filter':
        state.onsenFilter = key || 'distance';
        mount(document.getElementById('expedition-root'));
        break;
      case 'onsen-map':
        window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(el.getAttribute('data-query') || ''), '_blank');
        break;
      case 'onsen-add':
        showToast('遠征プランに温泉を追加しました');
        break;
      case 'back':
        setScreen('top');
        break;
      case 'open':
        console.log('[遠征] 遠征を開く');
        break;
      case 'hotel-search':
        openHotelSearch(key);
        break;
      case 'hotel-detail':
        openHotelDetail();
        break;
      case 'hotel-detail-close':
        closeHotelDetail();
        break;
      case 'hotel-detail-map':
        openHotelMap();
        break;
      case 'hotel-detail-reservation':
        openReservationSite();
        break;
      case 'hotel-detail-receipt':
        openReceiptForm();
        break;
      case 'receipt-form-close':
        closeReceiptForm();
        break;
      case 'receipt-form-save':
        saveReceiptForm();
        break;
      case 'receipt-delete':
        deleteReceipt(el.getAttribute("data-id"));
        break;
      case 'receipt-edit':
        editReceipt(el.getAttribute("data-id"));
        break;
      case 'hotel-detail-delete':
        deleteHotel();
        break;
      case 'hotel-edit':
        openHotelForm("edit");
        break;
      case 'hotel-manual':
        openHotelForm("add");
        break;
      case 'hotel-memo':
        openHotelForm("edit");
        break;
      case 'hotel-form-close':
        closeHotelForm();
        break;
      case 'hotel-form-save':
        saveHotelForm();
        break;
      case 'saved':
      case 'seeall':
      case 'recent':
      case 'bell':
      case 'nav':
        console.log('[遠征]', act, key || '');
        break;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('expedition-root');
    if (!root) return;
    loadSavedHotel();
    loadExpenseSummary();
    loadHotelReceipts();
    mount(root);
    root.addEventListener('click', onClick);
  });

  window.ProNexaXExpedition = { data: expeditionData, setScreen: setScreen, mount: mount, state: state };
})();
