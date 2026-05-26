
/* ProNexaX CMS — single bundled JS (icons → placeholders → sidebar → topbar → pickup-banner → categories → articles → media-library → phone-preview → app) */

/* ============================================================
   icons.jsx
   ============================================================ */

const Ic = ({ d, fill, size = 16, stroke = 1.6, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d}
  </svg>
);

const I = {
  Dashboard: (p) => <Ic {...p} d={<>
    <rect x="3" y="3" width="7" height="9" rx="1.5"/>
    <rect x="14" y="3" width="7" height="5" rx="1.5"/>
    <rect x="14" y="12" width="7" height="9" rx="1.5"/>
    <rect x="3" y="16" width="7" height="5" rx="1.5"/>
  </>}/>,
  Folder: (p) => <Ic {...p} d={<>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
  </>}/>,
  Home: (p) => <Ic {...p} d={<>
    <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>
  </>}/>,
  Search: (p) => <Ic {...p} d={<>
    <circle cx="11" cy="11" r="7"/>
    <path d="m20 20-3.5-3.5"/>
  </>}/>,
  Calendar: (p) => <Ic {...p} d={<>
    <rect x="3" y="5" width="18" height="16" rx="2"/>
    <path d="M3 9h18M8 3v4M16 3v4"/>
  </>}/>,
  Trophy: (p) => <Ic {...p} d={<>
    <path d="M8 4h8v4a4 4 0 0 1-8 0z"/>
    <path d="M8 6H5a2 2 0 0 0 0 4h3M16 6h3a2 2 0 0 1 0 4h-3"/>
    <path d="M10 14h4l-.5 4h-3z"/>
    <path d="M8 21h8"/>
  </>}/>,
  News: (p) => <Ic {...p} d={<>
    <rect x="3" y="4" width="14" height="16" rx="2"/>
    <path d="M17 8h3a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2"/>
    <path d="M7 8h6M7 12h6M7 16h4"/>
  </>}/>,
  Play: (p) => <Ic {...p} d={<>
    <rect x="3" y="5" width="18" height="14" rx="2"/>
    <path d="m10 9 5 3-5 3z" fill="currentColor"/>
  </>}/>,
  Bell: (p) => <Ic {...p} d={<>
    <path d="M6 8a6 6 0 1 1 12 0c0 4 2 5 2 7H4c0-2 2-3 2-7z"/>
    <path d="M10 19a2 2 0 0 0 4 0"/>
  </>}/>,
  User: (p) => <Ic {...p} d={<>
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>
  </>}/>,
  Image: (p) => <Ic {...p} d={<>
    <rect x="3" y="4" width="18" height="16" rx="2"/>
    <circle cx="9" cy="10" r="2"/>
    <path d="m3 18 5-5 4 4 3-3 6 6"/>
  </>}/>,
  Sparkles: (p) => <Ic {...p} d={<>
    <path d="m12 3 1.8 4.7L18 9.5l-4.2 1.8L12 16l-1.8-4.7L6 9.5l4.2-1.8z"/>
    <path d="M19 14v3M17.5 15.5h3M5 4v2M4 5h2"/>
  </>}/>,
  Swatch: (p) => <Ic {...p} d={<>
    <path d="M4 4h6v14a3 3 0 1 1-6 0z"/>
    <path d="M10 11l5-5 4 4-7 7"/>
    <path d="M10 18h10a0 0 0 0 1 0 0v0a3 3 0 0 1-3 3H7"/>
  </>}/>,
  Menu: (p) => <Ic {...p} d={<>
    <path d="M4 6h16M4 12h16M4 18h16"/>
  </>}/>,
  Type: (p) => <Ic {...p} d={<>
    <path d="M5 5h14M12 5v14M9 19h6"/>
  </>}/>,
  Library: (p) => <Ic {...p} d={<>
    <path d="M4 4v16M9 4v16M14 5l5 1.5L15 22"/>
  </>}/>,
  Ad: (p) => <Ic {...p} d={<>
    <path d="M3 8h11l6-4v16l-6-4H3z"/>
    <path d="M7 12v4"/>
  </>}/>,
  Users: (p) => <Ic {...p} d={<>
    <circle cx="9" cy="9" r="3"/>
    <path d="M3 19c0-3 3-5 6-5s6 2 6 5"/>
    <circle cx="17" cy="8" r="2.5"/>
    <path d="M15 14c3 0 6 1.5 6 4"/>
  </>}/>,
  Chart: (p) => <Ic {...p} d={<>
    <path d="M4 20V8M10 20V4M16 20v-8M22 20H2"/>
  </>}/>,
  Cog: (p) => <Ic {...p} d={<>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
  </>}/>,
  Shield: (p) => <Ic {...p} d={<>
    <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>
  </>}/>,
  Plus: (p) => <Ic {...p} d={<><path d="M12 5v14M5 12h14"/></>}/>,
  Check: (p) => <Ic {...p} d={<><path d="m5 12 5 5L20 7"/></>}/>,
  Chevron: (p) => <Ic {...p} d={<><polyline points="6 9 12 15 18 9"/></>}/>,
  ChevronR: (p) => <Ic {...p} d={<><polyline points="9 6 15 12 9 18"/></>}/>,
  Refresh: (p) => <Ic {...p} d={<>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
    <path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
    <path d="M3 21v-5h5"/>
  </>}/>,
  Eye: (p) => <Ic {...p} d={<>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/>
    <circle cx="12" cy="12" r="3"/>
  </>}/>,
  Drag: (p) => <Ic {...p} d={<>
    <circle cx="9" cy="6" r=".8" fill="currentColor" stroke="none"/>
    <circle cx="9" cy="12" r=".8" fill="currentColor" stroke="none"/>
    <circle cx="9" cy="18" r=".8" fill="currentColor" stroke="none"/>
    <circle cx="15" cy="6" r=".8" fill="currentColor" stroke="none"/>
    <circle cx="15" cy="12" r=".8" fill="currentColor" stroke="none"/>
    <circle cx="15" cy="18" r=".8" fill="currentColor" stroke="none"/>
  </>}/>,
  Info: (p) => <Ic {...p} d={<>
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 11v5M12 8h0"/>
  </>}/>,
  Pencil: (p) => <Ic {...p} d={<>
    <path d="m4 20 1-4 11-11 3 3-11 11z"/>
  </>}/>,
  Trash: (p) => <Ic {...p} d={<>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/>
  </>}/>,
  Upload: (p) => <Ic {...p} d={<>
    <path d="M12 16V4M7 9l5-5 5 5"/>
    <path d="M4 20h16"/>
  </>}/>,
  TShirt: (p) => <Ic {...p} d={<>
    <path d="M4 6 8 4l2 2h4l2-2 4 2-2 4-2-1v9H8v-9l-2 1z"/>
  </>}/>,
  Club: (p) => <Ic {...p} d={<>
    <circle cx="7" cy="17" r="3"/>
    <path d="m9 15 9-9 2 2-9 9"/>
    <path d="m15 6 2 2"/>
  </>}/>,
  Flag: (p) => <Ic {...p} d={<>
    <path d="M5 21V4"/>
    <path d="M5 4h11l-2 3 2 3H5"/>
  </>}/>,
  Filter: (p) => <Ic {...p} d={<>
    <path d="M3 5h18l-7 9v6l-4-2v-4z"/>
  </>}/>,
  Save: (p) => <Ic {...p} d={<>
    <path d="M5 4h11l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/>
    <path d="M8 4v5h7V4M8 14h8v6H8z"/>
  </>}/>,
  X: (p) => <Ic {...p} d={<><path d="M6 6l12 12M18 6 6 18"/></>}/>,
  Wifi: (p) => <Ic {...p} d={<>
    <path d="M2 9a14 14 0 0 1 20 0M5 13a9 9 0 0 1 14 0M8.5 16.5a4 4 0 0 1 7 0"/>
    <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none"/>
  </>}/>,
  Battery: (p) => <Ic {...p} d={<>
    <rect x="2" y="7" width="18" height="10" rx="2"/>
    <rect x="4" y="9" width="14" height="6" rx="1" fill="currentColor" stroke="none"/>
    <path d="M22 11v2"/>
  </>}/>,
  Signal: (p) => <Ic {...p} d={<>
    <rect x="3" y="14" width="3" height="6" rx="1" fill="currentColor" stroke="none"/>
    <rect x="9" y="10" width="3" height="10" rx="1" fill="currentColor" stroke="none"/>
    <rect x="15" y="5" width="3" height="15" rx="1" fill="currentColor" stroke="none"/>
  </>}/>,
  Gear: (p) => <Ic {...p} d={<>
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>
  </>}/>,
  Cards: (p) => <Ic {...p} d={<>
    <rect x="3" y="5" width="8" height="14" rx="2"/>
    <rect x="13" y="5" width="8" height="14" rx="2"/>
  </>}/>,
};

window.I = I;
window.Ic = Ic;

/* ============================================================
   placeholders.jsx
   ============================================================ */

const stripeBg =
  "repeating-linear-gradient(135deg, rgba(255,255,255,.045) 0 2px, rgba(255,255,255,0) 2px 8px)";

const palettes = {
  hero:   "linear-gradient(180deg, #b8d6cc 0%, #6fa68f 30%, #2f6849 60%, #143b27 100%)",
  tour:   "linear-gradient(135deg, #1d4632 0%, #3b8a5e 55%, #6cc294 100%)",
  sunset: "linear-gradient(160deg, #2a2f4a 0%, #6b3f5a 50%, #d68c5a 100%)",
  deep:   "linear-gradient(140deg, #082018 0%, #0e3225 60%, #1a6444 100%)",
  sky:    "linear-gradient(180deg, #cfe1f5 0%, #8bb2dc 100%)",
  amber:  "linear-gradient(140deg, #f0b870 0%, #b1733a 100%)",
  slate:  "linear-gradient(140deg, #cfd4d3 0%, #7e8a86 100%)",
  chart:  "linear-gradient(140deg, #1a3b2c 0%, #2b6a4a 100%)",
};

function Photo({ tone = "hero", label, children, style, className = "", fill = true, imageUrl = "" }) {
  const baseStyle = fill
    ? { position: "relative", width: "100%", height: "100%", overflow: "hidden" }
    : { position: "absolute", inset: 0 };
  return (
    <div className={`photo ${className}`} style={{
      ...baseStyle,
      background: imageUrl ? `center/cover no-repeat url("${imageUrl}")` : (palettes[tone] || tone),
      ...style,
    }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: stripeBg,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}/>
      {(tone === "hero") && (
        <div style={{
          position: "absolute", left: 0, right: 0, top: "44%", height: 1,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent)",
        }}/>
      )}
      {label && (
        <div style={{
          position: "absolute", top: 8, right: 10,
          fontFamily: "Manrope, monospace",
          fontSize: 9, letterSpacing: ".14em",
          color: "rgba(255,255,255,.6)",
          textTransform: "uppercase",
        }}>{label}</div>
      )}
      {children}
    </div>
  );
}

function PhotoBox({ tone, label, width, height, radius = 8, style }) {
  return (
    <div style={{ position: "relative", width, height, borderRadius: radius, overflow: "hidden", ...style }}>
      <Photo tone={tone} label={label}/>
    </div>
  );
}

window.Photo = Photo;
window.PhotoBox = PhotoBox;

/* ============================================================
   sidebar.jsx
   ============================================================ */

function Sidebar({ active, onChange }) {
  const sections = [
    {
      kind: "single",
      key: "dashboard",
      label: "ダッシュボード",
      icon: <I.Dashboard className="side__icon"/>,
    },
    {
      kind: "group",
      label: "コンテンツ管理",
      icon: <I.Folder className="side__icon"/>,
      groupKey: "content",
      children: [
        { key: "home", label: "ホーム（注目ページ）" },
        { key: "match", label: "試合検索" },
        { key: "calendar", label: "カレンダー" },
        { key: "tournament", label: "大会詳細" },
        { key: "news", label: "ニュース・記事" },
        { key: "lesson", label: "レッスン動画" },
        { key: "notice", label: "お知らせ" },
        { key: "mypage", label: "マイページ" },
      ],
    },
    {
      kind: "group",
      label: "デザイン・設定",
      icon: <I.Sparkles className="side__icon"/>,
      groupKey: "design",
      children: [
        { key: "banner", label: "バナー管理" },
        { key: "icon", label: "アイコン管理" },
        { key: "color", label: "カラー設定" },
        { key: "menu", label: "メニュー設定" },
        { key: "text", label: "テキスト管理" },
      ],
    },
    {
      kind: "group",
      label: "メディアライブラリ",
      icon: <I.Library className="side__icon"/>,
      groupKey: "media",
      children: [
        { key: "media-all", label: "画像・動画一覧" },
      ],
    },
    { kind: "single", key: "ads", label: "広告管理", icon: <I.Ad className="side__icon"/> },
    { kind: "single", key: "segments", label: "ユーザーセグメント", icon: <I.Users className="side__icon"/> },
    { kind: "single", key: "analytics", label: "分析・レポート", icon: <I.Chart className="side__icon"/> },
    { kind: "single", key: "settings", label: "設定", icon: <I.Cog className="side__icon"/> },
    { kind: "single", key: "staff", label: "スタッフ管理", icon: <I.Shield className="side__icon"/> },
  ];

  const isInGroup = (group) => group.children?.some(c => c.key === active);

  return (
    <aside className="side">
      <div className="side__brand">
        <div className="side__logo">P</div>
        <div className="side__brand-text">
          <strong>ProNexaX</strong>
          <small>CMS · ADMIN</small>
        </div>
      </div>

      <nav className="side__nav">
        {sections.map((s, i) => {
          if (s.kind === "single") {
            return (
              <div
                key={s.key}
                className={`side__item ${active === s.key ? "is-active" : ""}`}
                onClick={() => onChange(s.key)}
              >
                {s.icon}
                <span>{s.label}</span>
              </div>
            );
          }
          const open = true;
          const groupActive = isInGroup(s);
          return (
            <React.Fragment key={s.label}>
              <div className={`side__item ${groupActive ? "" : ""}`} style={{ cursor: "default" }}>
                {s.icon}
                <span>{s.label}</span>
                <I.Chevron className="side__chev" size={14}/>
              </div>
              {open && s.children.map(c => (
                <div
                  key={c.key}
                  className={`side__item is-child ${active === c.key ? "is-active" : ""}`}
                  onClick={() => onChange(c.key)}
                >
                  <span className="side__dot"/>
                  <span>{c.label}</span>
                </div>
              ))}
            </React.Fragment>
          );
        })}
      </nav>

      <div className="side__storage">
        <div className="side__storage-row">
          <strong>ストレージ</strong>
          <small>24.5%</small>
        </div>
        <div className="side__storage-bar"><i/></div>
        <div className="side__storage-meta">
          <span>2.45 GB</span><span>/ 10 GB</span>
        </div>
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;

/* ============================================================
   topbar.jsx
   ============================================================ */

function Topbar({ crumbs = ["コンテンツ管理"], saveState = "saved", onPreviewRefresh }) {
  return (
    <header className="top">
      <div className="top__crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="top__crumb-sep">/</span>}
            {i === crumbs.length - 1 ? <b>{c}</b> : <span>{c}</span>}
          </React.Fragment>
        ))}
      </div>

      <div className="top__spacer"/>

      <div className="top__saved">
        <span className="dot"/>
        <span>{saveState === "saved" ? "すべての変更を保存しました" : "保存中..."}</span>
      </div>

      <button className="top__btn" onClick={onPreviewRefresh}>
        <I.Refresh size={14}/> プレビュー更新
      </button>

      <button className="top__bell" aria-label="通知">
        <I.Bell size={16}/>
        <span className="top__bell-dot">3</span>
      </button>

      <div className="top__user">
        <span className="top__user-av">運</span>
        <span style={{ fontSize: 12.5 }}>管理者</span>
        <I.Chevron size={12}/>
      </div>
    </header>
  );
}

window.Topbar = Topbar;

/* ============================================================
   pickup-banner.jsx
   ============================================================ */

function Toggle({ on, onChange }) {
  return (
    <span className={`toggle ${on ? "is-on" : ""}`}
          role="switch" aria-checked={on}
          onClick={() => onChange(!on)}/>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map(o => (
        <button key={o.value}
                className={`seg__btn ${value === o.value ? "is-active" : ""}`}
                onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PickupBannerEditor({ banner, onChange, onSave }) {
  const b = banner;
  const set = (k, v) => onChange({ ...b, [k]: v });

  return (
    <section className="card">
      <header className="card__head">
        <h2 className="card__title">PICK UPバナー管理</h2>
        <I.Info size={13} className="card__hint"/>
        <div className="card__head-r">
          <button className="btn btn--primary btn--sm">
            <I.Plus size={13}/> 新しいバナーを追加
          </button>
        </div>
      </header>

      <div className="card__body">
        <div className="pickup">
          <div className="pickup__preview">
            <Photo tone="hero" label="HERO IMAGE · 1600×1200"/>
            <div className="pickup__overlay">
              <span className="pickup__tag">PICK UP</span>
              <div className="pickup__title-prev">{b.title || "タイトルを入力"}</div>
              <div className="pickup__sub-prev">{b.subtitle || "サブタイトル"}</div>
              <div className="pickup__cta-prev">
                {b.cta || "詳しく見る"} <I.ChevronR size={12}/>
              </div>
            </div>
          </div>

          <div className="pickup__fields">
            <div className="field">
              <label className="field__label">タイトル</label>
              <input className="input" value={b.title}
                     onChange={e => set("title", e.target.value)}/>
            </div>
            <div className="field">
              <label className="field__label">サブタイトル</label>
              <input className="input" value={b.subtitle}
                     onChange={e => set("subtitle", e.target.value)}/>
            </div>
            <div className="field">
              <label className="field__label">ボタンテキスト</label>
              <input className="input" value={b.cta}
                     onChange={e => set("cta", e.target.value)}/>
            </div>
            <div className="field">
              <label className="field__label">リンク先</label>
              <input className="input mono" value={b.link}
                     onChange={e => set("link", e.target.value)}/>
            </div>
          </div>
        </div>

        <div className="pickup__settings">
          <div className="field">
            <label className="field__label">表示期間</label>
            <div className="daterow">
              <input className="input mono" value={b.startDate}
                     onChange={e => set("startDate", e.target.value)}/>
              <span className="sep">〜</span>
              <input className="input mono" value={b.endDate}
                     onChange={e => set("endDate", e.target.value)}/>
            </div>
          </div>
          <div className="field">
            <label className="field__label">表示順</label>
            <select className="select" value={b.order}
                    onChange={e => set("order", Number(e.target.value))}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field__label">表示対象</label>
            <div>
              <Segmented value={b.audience} onChange={v => set("audience", v)}
                options={[
                  { value: "all", label: "すべて" },
                  { value: "pro", label: "プロ" },
                  { value: "ama", label: "アマ" },
                  { value: "women", label: "女子" },
                ]}/>
            </div>
          </div>
          <div className="field">
            <label className="field__label">ステータス</label>
            <div className="status-row">
              <Toggle on={b.published} onChange={v => set("published", v)}/>
              <span style={{ fontSize: 12.5, color: b.published ? "var(--green-700)" : "var(--muted)" }}>
                {b.published ? "公開中" : "非公開"}
              </span>
            </div>
          </div>
        </div>

        <div className="pickup-toolbar">
          <div className="left">最終更新 2024.05.18 14:32 · 管理者</div>
          <div className="right">
            <button className="btn btn--danger-ghost btn--sm">
              <I.Trash size={13}/> 削除
            </button>
            <button className="btn btn--primary btn--sm" onClick={onSave}>
              <I.Check size={13}/> 保存
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

window.Toggle = Toggle;
window.Segmented = Segmented;
window.PickupBannerEditor = PickupBannerEditor;

/* ============================================================
   categories.jsx
   ============================================================ */

function CategoryCards({ cats, onChange, onAdd }) {
  const setCat = (i, patch) => {
    const next = cats.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const iconMap = {
    wear: I.TShirt,
    club: I.Club,
    course: I.Flag,
    lesson: I.Play,
    news: I.News,
  };

  return (
    <section className="card">
      <header className="card__head">
        <h2 className="card__title">カテゴリ管理</h2>
        <I.Info size={13} className="card__hint"/>
        <div className="card__head-r">
          <button className="btn btn--primary btn--sm" onClick={onAdd}>
            <I.Plus size={13}/> カテゴリを追加
          </button>
        </div>
      </header>
      <div className="card__body">
        <div className="cats">
          {cats.map((c, i) => {
            const Icon = iconMap[c.iconKey] || I.Folder;
            return (
              <div className="cat" key={c.id}>
                <span className="cat__drag-handle"><I.Drag size={12}/></span>
                <div className="cat__icon"><Icon size={20}/></div>
                <div className="cat__name">{c.name}</div>
                <div className="cat__toggle-row">
                  <Toggle on={c.visible} onChange={v => setCat(i, { visible: v })}/>
                  <span style={{ color: c.visible ? "var(--green-700)" : "var(--muted)" }}>
                    {c.visible ? "表示中" : "非表示"}
                  </span>
                </div>
                <div className="cat__order">
                  <select className="select" value={c.order}
                          onChange={e => setCat(i, { order: Number(e.target.value) })}>
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
          <div className="cat cat--add" onClick={onAdd}>
            <div style={{ textAlign: "center" }}>
              <I.Plus size={22}/>
              <div style={{ fontSize: 12, marginTop: 4 }}>追加</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

window.CategoryCards = CategoryCards;

/* ============================================================
   articles.jsx
   ============================================================ */

function ArticlesTable({ rows, onChange }) {
  const set = (i, patch) => {
    const next = rows.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const catChip = (key) => {
    const map = {
      club: { cls: "chip--cat-2", text: "クラブ" },
      course: { cls: "chip--cat-1", text: "ゴルフ場" },
      lesson: { cls: "chip--cat-4", text: "レッスン動画" },
      wear: { cls: "chip--cat-3", text: "ウェア" },
      news: { cls: "chip--cat-5", text: "ニュース" },
    };
    const c = map[key] || map.news;
    return <span className={`chip ${c.cls}`}>{c.text}</span>;
  };

  return (
    <section className="card">
      <header className="card__head">
        <h2 className="card__title">注目記事管理</h2>
        <I.Info size={13} className="card__hint"/>
        <div className="card__head-r">
          <button className="btn btn--ghost btn--sm">
            <I.Filter size={13}/> 一括並び替え
          </button>
          <button className="btn btn--primary btn--sm">
            <I.Plus size={13}/> 記事を追加
          </button>
        </div>
      </header>
      <div className="card__body" style={{ paddingTop: 6 }}>
        <div className="tbl-wrap">
        <table className="tbl">
          <colgroup>
            <col style={{ width: 48 }}/>
            <col style={{ width: 68 }}/>
            <col/>
            <col style={{ width: 80 }}/>
            <col style={{ width: 44 }}/>
            <col style={{ width: 82 }}/>
            <col style={{ width: 108 }}/>
            <col style={{ width: 130 }}/>
          </colgroup>
          <thead>
            <tr>
              <th>表示順</th>
              <th>サムネイル</th>
              <th>タイトル</th>
              <th>カテゴリ</th>
              <th>NEW</th>
              <th>公開日</th>
              <th>ステータス</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <I.Drag size={12} className="row-handle"/>
                    <span className="tbl__order">{i + 1}</span>
                  </div>
                </td>
                <td>
                  <div className="tbl__thumb">
                    <Photo tone={r.tone}/>
                  </div>
                </td>
                <td>
                  <div className="tbl__title-cell">
                    <div className="tbl__title">{r.title}</div>
                    <div className="tbl__desc">{r.excerpt}</div>
                  </div>
                </td>
                <td>{catChip(r.category)}</td>
                <td>{r.isNew && <span className="chip chip--new">NEW</span>}</td>
                <td><span className="tbl__date">{r.date}</span></td>
                <td>
                  <div className="toggle-row">
                    <Toggle on={r.published} onChange={v => set(i, { published: v })}/>
                    <span style={{ color: r.published ? "var(--green-700)" : "var(--muted)" }}>
                      {r.published ? "公開中" : "下書き"}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="tbl__actions">
                    <button className="btn btn--ghost btn--xs"><I.Pencil size={11}/> 編集</button>
                    <button className="btn btn--danger-ghost btn--xs"><I.Trash size={11}/> 削除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </section>
  );
}

window.ArticlesTable = ArticlesTable;

/* ============================================================
   media-library.jsx
   ============================================================ */

function MediaLibrary({ folders, onUpload }) {
  return (
    <section className="card">
      <header className="card__head">
        <h2 className="card__title">メディアライブラリ（画像・アイコン・動画）</h2>
        <I.Info size={13} className="card__hint"/>
        <div className="card__head-r">
          <button className="btn btn--ghost btn--sm">
            <I.Eye size={13}/> すべて見る
          </button>
        </div>
      </header>
      <div className="card__body">
        <div className="media-row">
          {folders.map((f, i) => (
            <div className="media" key={i}>
              <div className="media__icon"><I.Folder size={16}/></div>
              <div className="media__name">{f.name}</div>
              <div className="media__count">{f.count} 点</div>
            </div>
          ))}
          <div className="media media--upload" onClick={onUpload}>
            <div style={{ textAlign: "center" }}>
              <I.Upload size={20}/>
              <div style={{ fontSize: 12, marginTop: 4 }}>アップロード</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

window.MediaLibrary = MediaLibrary;

/* ============================================================
   phone-preview.jsx
   ============================================================ */

function IphoneFrame({ children }) {
  return (
    <div className="iphone">
      <div className="iphone__notch"/>
      <div className="iphone__screen">
        <div className="iphone__status">
          <span>9:41</span>
          <div className="right">
            <I.Signal size={11}/>
            <I.Wifi size={12}/>
            <I.Battery size={14}/>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function PhoneHome({ banner, cats, articles = [] }) {
  return (
    <div className="ph">
      <div className="ph__h">
        <div>
          <h2>注目</h2>
          <p className="ph__sub">ゴルフの最新情報やおすすめをお届け</p>
        </div>
        <div className="ph__h-icons">
          <I.Bell size={16}/>
          <I.Search size={16}/>
        </div>
      </div>

      <div className="ph-hero">
        <Photo tone="hero" imageUrl={banner.imageUrl}/>
        <div className="ph-hero__overlay">
          <span className="ph-hero__tag">PICK UP</span>
          <div className="ph-hero__title">{banner.title}</div>
          <div className="ph-hero__sub">{banner.subtitle}</div>
          <div className="ph-hero__cta">{banner.cta} <I.ChevronR size={9}/></div>
        </div>
      </div>
      <div className="ph-dots"><i className="on"/><i/><i/><i/></div>

      <div className="ph-section-h">
        <h3>カテゴリから探す</h3>
        <span>すべて見る <I.ChevronR size={10}/></span>
      </div>
      <div className="ph-cats">
        {cats.filter(c => c.visible !== false).slice(0, 4).map(c => {
          const iconMap = {
            wear: I.TShirt, club: I.Club, course: I.Flag, lesson: I.Play, news: I.News,
          };
          const Ico = iconMap[c.iconKey] || I.Folder;
          return (
            <div className="ph-cat" key={c.id}>
              <div className="ph-cat__ic"><Ico size={18}/></div>
              <div className="ph-cat__name">{c.name}</div>
            </div>
          );
        })}
      </div>

      <div className="ph-section-h">
        <h3>注目記事</h3>
        <span>最新 <I.ChevronR size={10}/></span>
      </div>
      {(articles || []).slice(0, 2).map((a, i) => (
        <div className="ph-art" key={a.id || i}>
          <div className="ph-art__th"><Photo tone={a.imageTone || a.tone || (i === 0 ? "deep" : "amber")} imageUrl={a.imageUrl}/></div>
          <div className="ph-art__body">
            <span className="ph-art__tag">{a.category || "FEATURED"}</span>
            <div className="ph-art__title">{a.title}</div>
            <div className="ph-art__meta">{a.subtitle || a.body || "CMSから反映"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PhoneMatch({ tournaments = [] }) {
  const list = (tournaments || []).slice(0, 5);
  const main = list[0];

  return (
    <div className="ph">
      <div className="ph__h">
        <h2>試合検索</h2>
        <div className="ph__h-icons"><I.Filter size={16}/></div>
      </div>
      <div className="ph-tabs">
        <span className="ph-tab on">公開中</span>
        <span className="ph-tab">ミニツアー</span>
        <span className="ph-tab">オープン</span>
        <span className="ph-tab">QT</span>
        <span className="ph-tab">海外</span>
      </div>

      <div className="ph-tour">
        <Photo tone="tour" imageUrl={main && (main.venueImageUrl || main.imageUrl)}/>
        <div className="ph-tour__overlay">
          <div className="ph-tour__title">{main ? main.title || main.name : "公開大会プレビュー"}</div>
          <div className="ph-tour__sub">{main ? `${main.venue || main.course || "会場未定"} · ${main.startDate || main.start || ""}` : "CMSで公開した大会がここに表示されます"}</div>
          <div className="ph-tour__bottom">{main ? (main.category || "大会") : "公開対象の大会"}</div>
          <div className="ph-tour__cta">詳細を見る <I.ChevronR size={9}/></div>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        {list.length === 0 && (
          <div className="ph-art">
            <div className="ph-art__th"><Photo tone="slate"/></div>
            <div className="ph-art__body">
              <span className="ph-art__tag">CMS</span>
              <div className="ph-art__title">公開大会はまだありません</div>
              <div className="ph-art__meta">下書きを募集中に変更すると表示されます</div>
            </div>
          </div>
        )}

        {list.slice(0, 3).map((t, i) => (
          <div className="ph-art" key={t.id || t.tournamentId || i}>
            <div className="ph-art__th"><Photo tone={i === 0 ? "amber" : i === 1 ? "deep" : "sky"} imageUrl={t.venueImageUrl || t.imageUrl}/></div>
            <div className="ph-art__body">
              <span className="ph-art__tag">{t.startDate || t.start || "日付未定"}</span>
              <div className="ph-art__title">{t.title || t.name}</div>
              <div className="ph-art__meta">{t.venue || t.course || "会場未定"} · {t.status === "open" ? "募集中" : t.status || "公開"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneCalendar({ tournaments = [] }) {
  const days = [];
  for (let i = 0; i < 3; i++) days.push({ blank: true });
  const eventDays = new Set(
    (tournaments || [])
      .map(t => String(t.startDate || t.start || "").slice(8, 10))
      .filter(Boolean)
      .map(n => Number(n))
  );

  for (let d = 1; d <= 31; d++) {
    days.push({
      d,
      has: eventDays.has(d),
      today: d === 18,
    });
  }
  while (days.length % 7 !== 0) days.push({ blank: true });

  const events = (tournaments || []).slice(0, 3);

  return (
    <div className="ph">
      <div className="ph__h">
        <h2>カレンダー</h2>
        <div className="ph__h-icons">
          <I.Filter size={16}/>
          <I.Gear size={16}/>
        </div>
      </div>
      <div className="ph-cal-month"><b>CMS公開大会</b></div>
      <div className="ph-cal-grid">
        {["日","月","火","水","木","土","日"].map((d, i) => (
          <div key={i} className={`h ${i === 0 ? "sun" : ""} ${i === 5 ? "sat" : ""}`}>{d}</div>
        ))}
        {days.map((c, i) => c.blank
          ? <div key={i} className="d muted"></div>
          : <div key={i} className={`d ${c.has ? "has" : ""} ${c.today ? "today" : ""}`}>{c.d}</div>
        )}
      </div>

      <div className="ph-events">
        {events.length === 0 && (
          <div className="ph-event">
            <div className="ph-event__date">-</div>
            <div className="ph-event__bar"/>
            <div className="ph-event__body">
              <div className="ph-event__title">公開大会なし</div>
              <div className="ph-event__time">CMSで募集中にすると反映</div>
            </div>
          </div>
        )}
        {events.map((t, i) => (
          <div className={`ph-event evt-${i + 1}`} key={t.id || i}>
            <div className="ph-event__date">{String(t.startDate || t.start || "--").slice(8,10) || "-"}</div>
            <div className="ph-event__bar"/>
            <div className="ph-event__body">
              <div className="ph-event__title">{t.title || t.name}</div>
              <div className="ph-event__time">{t.venue || t.course || "会場未定"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneMyPage() {
  return (
    <div className="ph">
      <div className="ph__h">
        <h2>マイページ</h2>
        <div className="ph__h-icons">
          <I.Bell size={16}/>
          <I.Gear size={16}/>
        </div>
      </div>

      <div className="ph-mypage-card">
        <div className="ph-mp__av">
          <Photo tone="amber"/>
        </div>
        <div>
          <div className="ph-mp__tier">PRO MEMBER</div>
          <div className="ph-mp__name">山田 太郎</div>
          <div className="ph-mp__role">会員情報 · ID 0001-2840</div>
        </div>
      </div>

      <div className="ph-stats">
        <div className="ph-stat">
          <div className="ph-stat__n">12</div>
          <div className="ph-stat__l">出場予定</div>
        </div>
        <div className="ph-stat">
          <div className="ph-stat__n">68</div>
          <div className="ph-stat__l">通算ラウンド</div>
        </div>
        <div className="ph-stat">
          <div className="ph-stat__n">3</div>
          <div className="ph-stat__l">未読通知</div>
        </div>
      </div>

      <div className="ph-section-h">
        <h3>お知らせ</h3>
        <span>すべて <I.ChevronR size={10}/></span>
      </div>
      <div className="ph-art">
        <div className="ph-art__th"><Photo tone="slate"/></div>
        <div className="ph-art__body">
          <span className="ph-art__tag">UPDATE</span>
          <div className="ph-art__title">アプリv2.4.0をリリース</div>
          <div className="ph-art__meta">2024.05.18</div>
        </div>
      </div>
    </div>
  );
}

function PhonePreviewRail({ banner, cats, articles = [], tournaments = [], syncMeta, device, onDeviceChange }) {
  return (
    <aside className="rail">
      <div className="rail__head">
        <h3>アプリプレビュー</h3>
        <I.Info size={12} className="hint"/>
        <span className="pill"><span className="dot"/>ライブ</span>
      </div>
      <div className="pnx-step69-rail-meta">
        {syncMeta ? `公開大会 ${syncMeta.count || 0}件 · ${String(syncMeta.createdAt || "").slice(5,16)}` : "CMS実データ待機中"}
      </div>

      <div className="rail__inner">
        <div className="rail__seg">
          <button className={device === "ios" ? "is-active" : ""} onClick={() => onDeviceChange("ios")}>iPhone</button>
          <button className={device === "android" ? "is-active" : ""} onClick={() => onDeviceChange("android")}>Android</button>
        </div>

        <div className="preview-block">
          <div className="preview-block__head">
            <h4>注目ページ</h4>
            <button className="preview-block__refresh"><I.Refresh size={10}/> 更新</button>
          </div>
          <IphoneFrame>
            <PhoneHome banner={banner} cats={cats} articles={articles}/>
          </IphoneFrame>
        </div>

        <div className="preview-block">
          <div className="preview-block__head">
            <h4>試合検索ページ</h4>
            <button className="preview-block__refresh"><I.Refresh size={10}/> 更新</button>
          </div>
          <IphoneFrame>
            <PhoneMatch tournaments={tournaments}/>
          </IphoneFrame>
        </div>

        <div className="preview-block">
          <div className="preview-block__head">
            <h4>カレンダーページ</h4>
            <button className="preview-block__refresh"><I.Refresh size={10}/> 更新</button>
          </div>
          <IphoneFrame>
            <PhoneCalendar tournaments={tournaments}/>
          </IphoneFrame>
        </div>

        <div className="preview-block">
          <div className="preview-block__head">
            <h4>マイページ</h4>
            <button className="preview-block__refresh"><I.Refresh size={10}/> 更新</button>
          </div>
          <IphoneFrame>
            <PhoneMyPage/>
          </IphoneFrame>
        </div>
      </div>
    </aside>
  );
}

window.PhonePreviewRail = PhonePreviewRail;

/* ============================================================
   app.jsx
   ============================================================ */

const { useState, useEffect } = React;


/* ============================================================
   STEP62: featured / pickup bridge helpers
   最終CMSデザインのPICK UP・カテゴリ・記事をBridge保存へ接続
   ============================================================ */
function PNXStep62BridgeStatus({ message }) {
  return (
    <div className="pnx-step62-status">
      <span className="pnx-step62-status__dot"/>
      <span>{message || "Bridge待機中"}</span>
    </div>
  );
}

function PNXStep62SaveButtons({ onSaveFeatured, onPublish }) {
  return (
    <div className="pnx-step62-actions">
      <button className="btn btn--ghost btn--sm" onClick={onSaveFeatured}>
        <I.Save size={13}/> Bridge保存
      </button>
      <button className="btn btn--primary btn--sm" onClick={onPublish}>
        <I.Refresh size={13}/> 本体へ反映準備
      </button>
    </div>
  );
}

function pnxStep62ArticleToFeatured(row, index) {
  return {
    id: row.id ? "article_" + row.id : undefined,
    type: "article",
    title: row.title,
    subtitle: row.excerpt || "",
    body: row.excerpt || "",
    order: index + 10,
    category: row.category || "news",
    published: row.published !== false,
    isNew: !!row.isNew,
    startDate: row.date || "",
    imageTone: row.tone || "",
    source: "cms-final-article"
  };
}

function pnxStep62BannerToFeatured(banner) {
  return {
    id: "pickup_main",
    type: "pickup-banner",
    title: banner.title,
    subtitle: banner.subtitle,
    cta: banner.cta,
    link: banner.link,
    startDate: banner.startDate,
    endDate: banner.endDate,
    order: Number(banner.order || 1),
    audience: banner.audience || "all",
    published: banner.published !== false,
    source: "cms-final-pickup"
  };
}


/* ============================================================
   STEP63: Claude Console Bulk Tournament Registration
   整理済みテキスト → Claude Console → JSON貼り戻し → 仮登録 → 一括保存
   ============================================================ */

/* ============================================================
   STEP80: Organized Text → Bulk Tournament Draft Parser
   ChatGPTで整理した大会文章をCMS内で読み取り、大会ごとに仮登録へ変換
   ============================================================ */
function pnxStep80Text(v) {
  return String(v == null ? "" : v).trim();
}

function pnxStep80StripPrefix(line) {
  return pnxStep80Text(line)
    .replace(/^\s*[\-•・]\s*/, "")
    .replace(/^\s*\d+\s*[\.．、\)]\s*/, "")
    .replace(/^【(.+)】$/, "$1")
    .trim();
}

function pnxStep80NormalizeMoney(v) {
  const s = pnxStep80Text(v);
  if (!s) return "";
  return s.replace(/[，,]/g, "").replace(/\s+/g, "");
}

/* ============================================================
   STEP128: Prize display / action feedback helpers
   賞金総額・優勝賞金だけを「720万」表記へ寄せる。参加費は円表記のまま。
   ============================================================ */
function pnxStep128FormatManAmount(num) {
  const n = Number(num);
  if (!Number.isFinite(n)) return "";

  if (Math.abs(n) >= 10000) {
    const man = n / 10000;
    const fixed = Number.isInteger(man)
      ? String(man)
      : String(Math.round(man * 10) / 10).replace(/\.0$/, "");
    return `${fixed}万`;
  }

  return `${n.toLocaleString("ja-JP")}円`;
}

function pnxStep128NormalizePrizeText(value) {
  const raw = String(value == null ? "" : value).trim();
  if (!raw) return "";

  if (/^(不明|未定|なし|要確認)$/i.test(raw)) return raw;
  if (/万/.test(raw) && !/\d[\d,]*\s*円/.test(raw)) return raw;

  let s = raw;

  // 7,200,000円 / 7200000円 -> 720万
  s = s.replace(/(\d[\d,]*)\s*円/g, (_, amount) => {
    const n = Number(String(amount).replace(/,/g, ""));
    return pnxStep128FormatManAmount(n);
  });

  // 円が付いていない大きな数字だけ変換。48名や2026年などは対象外。
  s = s.replace(/(^|[^\dA-Za-z])(\d[\d,]{4,})(?!\s*[年月日名人万千円])/g, (match, prefix, amount) => {
    const digits = String(amount).replace(/,/g, "");
    if (digits.length < 5) return match;
    const n = Number(digits);
    if (!Number.isFinite(n)) return match;
    return `${prefix}${pnxStep128FormatManAmount(n)}`;
  });

  return s.replace(/\s+/g, " ").trim();
}

function pnxStep128NormalizePrizeFields(t) {
  if (!t) return t;
  return {
    ...t,
    prize: pnxStep128NormalizePrizeText(t.prize || t.totalPrize || ""),
    winnerPrize: pnxStep128NormalizePrizeText(t.winnerPrize || t.winningPrize || "")
  };
}

function pnxStep128CmsActionToast(message, type = "ok") {
  try {
    let box = document.getElementById("pnx-step128-action-toast");
    if (!box) {
      box = document.createElement("div");
      box.id = "pnx-step128-action-toast";
      document.body.appendChild(box);
    }

    box.className = `pnx-step128-action-toast is-${type}`;
    box.textContent = message;
    box.dataset.visible = "1";

    clearTimeout(window.__PNX_STEP128_TOAST_TIMER__);
    window.__PNX_STEP128_TOAST_TIMER__ = setTimeout(() => {
      box.dataset.visible = "0";
    }, 2200);
  } catch(e) {}
}

/* ============================================================
   STEP129: CMS safe publish without navigation
   本体反映時に親画面へpostMessageせず、CMS画面に留まる。
   ============================================================ */
function pnxStep129StopActionEvent(event) {
  try {
    if (event && event.preventDefault) event.preventDefault();
    if (event && event.stopPropagation) event.stopPropagation();
  } catch(e) {}
}

function pnxStep129Text(v) {
  return String(v == null ? "" : v).trim();
}

function pnxStep129ReadJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch(e) { return fallback; }
}

function pnxStep129WriteJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
}

function pnxStep129IsPublicTournament(t) {
  if (!t) return false;
  if (t.published === false || t.isPublished === false || t.visible === false) return false;
  const status = pnxStep129Text(t.status || t.rawStatus).toLowerCase();
  if (!status || /draft|下書き/.test(status)) return false;

  const title = pnxStep129Text(t.title || t.name);
  const startDate = pnxStep129Text(t.startDate || t.date || t.start);
  const venue = pnxStep129Text(t.venue || t.course || t.place || t.location);
  return !!(title && startDate && venue);
}

function pnxStep129NormalizeForSearch(t) {
  const title = pnxStep129Text(t.title || t.name);
  const startDate = pnxStep129Text(t.startDate || t.date || t.start);
  const endDate = pnxStep129Text(t.endDate || t.end || startDate) || startDate;
  const venue = pnxStep129Text(t.venue || t.course || t.place || t.location);
  const category = pnxStep129Text(t.category || t.cat) || "その他";

  return {
    ...t,
    id: pnxStep129Text(t.id || t.tournamentId) || `cms_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    tournamentId: pnxStep129Text(t.tournamentId || t.id) || `cms_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    title,
    name: title,
    startDate,
    date: startDate,
    endDate,
    end: endDate,
    venue,
    course: venue,
    place: venue,
    category,
    cat: category,
    prefecture: pnxStep129Text(t.prefecture || t.pref),
    entryDeadline: pnxStep129Text(t.entryDeadline || t.deadline),
    entryFee: pnxStep129Text(t.entryFee || t.fee),
    prize: pnxStep128NormalizePrizeText(t.prize || t.totalPrize || ""),
    winnerPrize: pnxStep128NormalizePrizeText(t.winnerPrize || t.winningPrize || t.prizeWinner || ""),
    eligibility: pnxStep129Text(t.eligibility || t.qualification),
    qualification: pnxStep129Text(t.qualification || t.eligibility),
    organizer: pnxStep129Text(t.organizer),
    status: pnxStep129Text(t.status || "open"),
    published: true,
    source: "cms",
    cmsSource: t.source || "cms-safe-publish-step129"
  };
}

function pnxStep129SafePublishToApp(event, options = {}) {
  pnxStep129StopActionEvent(event);

  if (!window.PNXCmsFinalDesignBridge) {
    pnxStep128CmsActionToast("Bridge未接続：反映できません", "ng");
    return {
      ok: false,
      noNavigation: true,
      publicTournamentCount: 0,
      tournaments: [],
      error: "Bridge not connected"
    };
  }

  const bridge = window.PNXCmsFinalDesignBridge;
  const all = typeof bridge.getTournaments === "function"
    ? bridge.getTournaments()
    : pnxStep129ReadJson("PNX_CMS_TOURNAMENTS", []);

  const validation = typeof bridge.validateAllTournaments === "function"
    ? bridge.validateAllTournaments()
    : null;

  const publicItems = (Array.isArray(all) ? all : [])
    .filter(pnxStep129IsPublicTournament)
    .map(pnxStep129NormalizeForSearch);

  const meta = {
    version: "step129-safe-publish",
    createdAt: new Date().toISOString(),
    count: publicItems.length,
    ids: publicItems.map(t => String(t.id || t.tournamentId || "")),
    source: "cms-safe-publish-no-navigation",
    noParentPostMessage: true,
    noNavigation: true
  };

  const payload = {
    ok: true,
    noNavigation: true,
    tournaments: publicItems,
    featured: typeof bridge.getFeaturedContents === "function" ? bridge.getFeaturedContents() : [],
    categories: typeof bridge.getCategories === "function" ? bridge.getCategories() : [],
    publicTournamentCount: publicItems.length,
    blockedTournamentCount: validation && validation.blocked || 0,
    validation,
    searchSnapshotMeta: meta,
    publishedAt: meta.createdAt,
    step129SafePublish: true
  };

  pnxStep129WriteJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", publicItems);
  pnxStep129WriteJson("PNX_CMS_SEARCH_SYNC_META", meta);
  pnxStep129WriteJson("PNX_STEP85_HARD_SEARCH_SNAPSHOT", { meta, tournaments: publicItems });
  try { localStorage.setItem("PNX_CMS_TOURNAMENTS_UPDATED_AT", meta.createdAt); } catch(e) {}

  // local event only. Do not postMessage to parent, because parent may switch away from CMS.
  try {
    window.dispatchEvent(new CustomEvent("PNX_STEP129_SAFE_PUBLISH_TO_APP", {
      detail: payload
    }));
  } catch(e) {}

  const message = options.message || `反映しました：公開対象 ${publicItems.length}件`;
  pnxStep128CmsActionToast(message, publicItems.length > 0 ? "ok" : "ng");

  window.__PNX_STEP129_LAST_SAFE_PUBLISH__ = payload;
  return payload;
}

function pnxStep80AreaFromPref(pref) {
  const p = pnxStep80Text(pref);
  const map = {
    "北海道": "北海道",
    "青森県": "東北", "岩手県": "東北", "宮城県": "東北", "秋田県": "東北", "山形県": "東北", "福島県": "東北",
    "茨城県": "関東", "栃木県": "関東", "群馬県": "関東", "埼玉県": "関東", "千葉県": "関東", "東京都": "関東", "神奈川県": "関東", "山梨県": "関東",
    "新潟県": "中部", "長野県": "中部", "富山県": "中部", "石川県": "中部", "福井県": "中部", "岐阜県": "中部", "静岡県": "中部", "愛知県": "中部", "三重県": "中部",
    "滋賀県": "関西", "京都府": "関西", "大阪府": "関西", "兵庫県": "関西", "奈良県": "関西", "和歌山県": "関西",
    "鳥取県": "中国", "島根県": "中国", "岡山県": "中国", "広島県": "中国", "山口県": "中国",
    "徳島県": "四国", "香川県": "四国", "愛媛県": "四国", "高知県": "四国",
    "福岡県": "九州", "佐賀県": "九州", "長崎県": "九州", "熊本県": "九州", "大分県": "九州", "宮崎県": "九州", "鹿児島県": "九州", "沖縄県": "九州"
  };
  return map[p] || "";
}

function pnxStep80DetectPrefecture(text) {
  const prefs = "北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|山梨県|新潟県|長野県|富山県|石川県|福井県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県";
  const m = String(text || "").match(new RegExp(prefs));
  return m ? m[0] : "";
}

function pnxStep80NormalizeDate(value, baseDate) {
  const raw = pnxStep80Text(value);
  if (!raw) return "";

  const now = new Date();
  const defaultYear = baseDate && baseDate.year ? baseDate.year : now.getFullYear();
  const defaultMonth = baseDate && baseDate.month ? baseDate.month : null;

  let m = raw.match(/(20\d{2})\s*[年\/\-.]\s*(\d{1,2})\s*[月\/\-.]\s*(\d{1,2})/);
  if (m) {
    return `${m[1]}-${String(m[2]).padStart(2, "0")}-${String(m[3]).padStart(2, "0")}`;
  }

  m = raw.match(/(20\d{2})(\d{2})(\d{2})/);
  if (m) {
    return `${m[1]}-${m[2]}-${m[3]}`;
  }

  m = raw.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日?/);
  if (m) {
    return `${defaultYear}-${String(m[1]).padStart(2, "0")}-${String(m[2]).padStart(2, "0")}`;
  }

  m = raw.match(/(\d{1,2})\s*[\/\.]\s*(\d{1,2})/);
  if (m) {
    return `${defaultYear}-${String(m[1]).padStart(2, "0")}-${String(m[2]).padStart(2, "0")}`;
  }

  if (defaultMonth) {
    m = raw.match(/(\d{1,2})\s*日/);
    if (m) {
      return `${defaultYear}-${String(defaultMonth).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`;
    }
  }

  return "";
}

function pnxStep80DateParts(iso) {
  const m = String(iso || "").match(/^(20\d{2})-(\d{2})-(\d{2})$/);
  return m ? { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) } : null;
}

function pnxStep80ExtractDateRange(value) {
  const s = pnxStep80Text(value);
  if (!s) return { startDate: "", endDate: "" };

  const parts = s.split(/\s*(?:〜|~|～|から|－|-|–|—)\s*/);
  const startDate = pnxStep80NormalizeDate(parts[0]);
  const base = pnxStep80DateParts(startDate);

  let endDate = "";
  if (parts.length > 1) {
    endDate = pnxStep80NormalizeDate(parts[1], base);
  }

  return { startDate, endDate: endDate || startDate };
}

function pnxStep80GetLabeledValue(block, labels) {
  const lines = String(block || "").split(/\n/);
  const labelPattern = labels.join("|");

  for (const line of lines) {
    const s = pnxStep80Text(line);
    const re = new RegExp(`^(?:[-•・]\\s*)?(?:${labelPattern})\\s*[：:／/\\-]\\s*(.+)$`, "i");
    const m = s.match(re);
    if (m) return pnxStep80StripPrefix(m[1]);
  }

  const inline = String(block || "").match(new RegExp(`(?:${labelPattern})\\s*[：:]\\s*([^\\n]+)`, "i"));
  return inline ? pnxStep80StripPrefix(inline[1]) : "";
}

function pnxStep80ExtractUrl(block, keyword) {
  const text = String(block || "");
  const urls = text.match(/https?:\/\/[^\s　)）】]+/g) || [];
  if (!urls.length) return "";

  if (keyword) {
    const lines = text.split(/\n/);
    for (const line of lines) {
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        const m = line.match(/https?:\/\/[^\s　)）】]+/);
        if (m) return m[0];
      }
    }
  }

  return urls[0] || "";
}

function pnxStep80InferCategory(text) {
  const s = String(text || "").toLowerCase();
  if (/jgto|acn|男子ツアー/.test(s)) return "JGTO";
  if (/jlpga|女子|ステップ/.test(s)) return "JLPGA";
  if (/qt/.test(s)) return "QT";
  if (/ミニ|mini|atp|future|fj|カートルズ|cartles/.test(s)) return "ミニツアー";
  if (/オープン|open|県オープン|地方オープン/.test(s)) return "オープン大会";
  if (/予選/.test(s)) return "予選会";
  if (/海外|asian|pga|korn|dp world|台湾|韓国|中国|liv/.test(s)) return "海外ツアー";
  return "未分類";
}

function pnxStep80InferGender(text) {
  const s = String(text || "").toLowerCase();
  if (/女子|jlpga|women|female/.test(s)) return "女子";
  if (/男子|jgto|men|male/.test(s)) return "男子";
  if (/男女/.test(s)) return "男女";
  return "不明";
}

function pnxStep80SplitTournamentBlocks(text) {
  const normalized = String(text || "")
    .replace(/\r/g, "")
    .replace(/【大会情報まとめ】/g, "")
    .trim();

  if (!normalized) return [];

  const lines = normalized.split(/\n/);
  const blocks = [];
  let current = [];

  const startsBlock = (line) => {
    const s = pnxStep80Text(line);
    if (!s) return false;
    if (/^\d+\s*[\.．、\)]\s*\S+/.test(s)) return true;
    if (/^【[^】]+】$/.test(s)) return true;
    if (/^(大会名|試合名|名称)\s*[：:]/.test(s)) return true;
    return false;
  };

  for (const line of lines) {
    const s = pnxStep80Text(line);

    if (startsBlock(s) && current.length) {
      blocks.push(current.join("\n").trim());
      current = [s];
      continue;
    }

    if (!s && current.length >= 3) {
      blocks.push(current.join("\n").trim());
      current = [];
      continue;
    }

    if (s) current.push(s);
  }

  if (current.length) blocks.push(current.join("\n").trim());

  if (blocks.length <= 1) {
    const split = normalized
      .split(/\n(?=(?:\d+\s*[\.．、\)]\s*)?(?:大会名|試合名|名称)\s*[：:])/)
      .map(x => x.trim())
      .filter(Boolean);
    if (split.length > blocks.length) return split;
  }

  return blocks.filter(b => b.length > 5);
}

function pnxStep80ExtractTitle(block) {
  const labeled = pnxStep80GetLabeledValue(block, ["大会名", "試合名", "名称", "タイトル"]);
  if (labeled) return labeled;

  const lines = String(block || "").split(/\n/).map(pnxStep80StripPrefix).filter(Boolean);
  for (const line of lines) {
    if (/：|:/.test(line)) continue;
    if (/開催日|会場|締切|参加費|エントリー|賞金|主催|資格|URL/.test(line)) continue;
    return line;
  }

  return "大会名未設定";
}

function pnxStep80ParseOrganizedTournamentText(text) {
  const blocks = pnxStep80SplitTournamentBlocks(text);
  const parsed = blocks.map((block, index) => {
    const title = pnxStep80ExtractTitle(block);
    const dateText = pnxStep80GetLabeledValue(block, ["開催日", "日程", "開催期間", "日時", "開催"]);
    const range = pnxStep80ExtractDateRange(dateText || block);

    const venue = pnxStep80GetLabeledValue(block, ["会場", "開催コース", "コース", "ゴルフ場", "開催場所"]);
    const pref = pnxStep80GetLabeledValue(block, ["開催県", "都道府県", "県", "所在地"]) || pnxStep80DetectPrefecture(block);
    const category = pnxStep80GetLabeledValue(block, ["カテゴリ", "カテゴリー", "種別", "区分"]) || pnxStep80InferCategory(block);
    const gender = pnxStep80GetLabeledValue(block, ["性別", "対象", "男子女子"]) || pnxStep80InferGender(block);

    const entryDeadlineText = pnxStep80GetLabeledValue(block, ["エントリー締切", "申込締切", "募集締切", "締切", "〆切"]);
    const warnings = [];

    if (!title || title === "大会名未設定") warnings.push("大会名が読み取れませんでした");
    if (!range.startDate) warnings.push("開催日が読み取れませんでした");
    if (!venue) warnings.push("会場が読み取れませんでした");
    if (!category || category === "未分類") warnings.push("カテゴリが未分類です");
    if (!pref) warnings.push("都道府県が読み取れませんでした");

    return {
      id: `text_bulk_${Date.now()}_${index}`,
      tournamentId: `text_bulk_${Date.now()}_${index}`,
      title,
      name: title,
      category,
      gender,
      startDate: range.startDate,
      endDate: explicitEndDate || range.endDate || range.startDate,
      prefecture: pref,
      area: pnxStep80GetLabeledValue(block, ["エリア", "地域"]) || pnxStep80AreaFromPref(pref),
      venue,
      entryDeadline: pnxStep80NormalizeDate(entryDeadlineText),
      entryFee: pnxStep80NormalizeMoney(pnxStep80GetLabeledValue(block, ["エントリー費", "参加費", "出場料", "費用"])),
      prize: pnxStep128NormalizePrizeText(pnxStep80GetLabeledValue(block, ["賞金総額", "総賞金", "賞金"])),
      winnerPrize: pnxStep128NormalizePrizeText(pnxStep80GetLabeledValue(block, ["優勝賞金", "優勝"])),
      capacity: pnxStep80GetLabeledValue(block, ["募集人数", "定員", "人数"]),
      eligibility: pnxStep80GetLabeledValue(block, ["出場資格", "参加資格", "資格"]),
      organizer: pnxStep80GetLabeledValue(block, ["主催", "主催者", "運営"]),
      officialUrl: pnxStep80ExtractUrl(block, "公式"),
      instagramUrl: pnxStep80ExtractUrl(block, "instagram"),
      entryUrl: pnxStep80ExtractUrl(block, "エントリー") || pnxStep80ExtractUrl(block, "申込"),
      status: "draft",
      confidence: Math.max(0.35, Math.min(0.98, 1 - warnings.length * 0.14)),
      warnings,
      sourceText: block,
      source: "chatgpt-organized-text"
    };
  });

  return parsed.filter(t => t.title || t.startDate || t.venue);
}


/* ============================================================
   STEP81: Organized Text Parser Accuracy Upgrade
   STEP80の読み取りを強化：日付範囲・URL分類・重複候補・警告精度
   ============================================================ */
const PNX_STEP81_PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","山梨県",
  "新潟県","長野県","富山県","石川県","福井県","岐阜県","静岡県","愛知県","三重県",
  "滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県",
  "鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県",
  "福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"
];

function pnxStep81CleanDateText(v) {
  return String(v || "")
    .replace(/[（）(][月火水木金土日祝・,\s]+[）)]/g, "")
    .replace(/令和\s*\d+\s*年/g, "")
    .replace(/開催日|日程|開催期間|日時|開催/g, "")
    .replace(/[：:]/g, " ")
    .trim();
}

function pnxStep81NormalizeDate(value, base) {
  const raw = pnxStep81CleanDateText(value);
  if (!raw) return "";

  const now = new Date();
  const y = base && base.year ? base.year : now.getFullYear();
  const mBase = base && base.month ? base.month : null;

  // STEP127: ISO形式を最優先で読む。2026-06-01 を期間区切りとして誤読しない。
  let m = raw.match(/\b(20\d{2})\s*[-\/\.]\s*(\d{1,2})\s*[-\/\.]\s*(\d{1,2})\b/);
  if (m) return `${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`;

  m = raw.match(/(20\d{2})\s*[年]\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?/);
  if (m) return `${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`;

  m = raw.match(/(20\d{2})\s*年\s*(\d{1,2})\s*月/);
  const detectedYear = m ? Number(m[1]) : y;

  m = raw.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日?/);
  if (m) return `${detectedYear}-${String(m[1]).padStart(2,"0")}-${String(m[2]).padStart(2,"0")}`;

  m = raw.match(/(\d{1,2})\s*[\/\.]\s*(\d{1,2})/);
  if (m) return `${detectedYear}-${String(m[1]).padStart(2,"0")}-${String(m[2]).padStart(2,"0")}`;

  m = raw.match(/(\d{1,2})\s*日/);
  if (m && mBase) return `${detectedYear}-${String(mBase).padStart(2,"0")}-${String(m[1]).padStart(2,"0")}`;

  return "";
}

function pnxStep81DateParts(iso) {
  const m = String(iso || "").match(/^(20\d{2})-(\d{2})-(\d{2})$/);
  return m ? { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) } : null;
}

function pnxStep81ExtractDateRange(text) {
  const s = pnxStep81CleanDateText(text);
  if (!s) return { startDate: "", endDate: "" };

  // STEP127: まず単独日付として読めるならそのまま返す。
  // これにより 2026-06-01 のハイフンを期間区切りと誤判定しない。
  const directDate = pnxStep81NormalizeDate(s);
  const directIsoLike = /\b20\d{2}\s*[-\/\.]\s*\d{1,2}\s*[-\/\.]\s*\d{1,2}\b/.test(s);
  if (directDate && directIsoLike && !/(?:〜|～|~|から|まで|－|–|—|\s+-\s+)/.test(s.replace(/\b20\d{2}\s*-\s*\d{1,2}\s*-\s*\d{1,2}\b/g, ""))) {
    return { startDate: directDate, endDate: directDate };
  }

  // STEP127: 範囲区切りは 〜 / ～ / から / まで / 長音ダッシュ / 前後スペース付きハイフン のみに限定。
  // プレーンな "-" は YYYY-MM-DD 内で使うため、範囲区切りにしない。
  const rangeMatch = s.match(/(.+?)\s*(?:〜|～|~|から|－|–|—|\s+-\s+|まで)\s*(.+)/);
  if (rangeMatch) {
    const startDate = pnxStep81NormalizeDate(rangeMatch[1]);
    const base = pnxStep81DateParts(startDate);
    const endDate = pnxStep81NormalizeDate(rangeMatch[2], base);
    return { startDate, endDate: endDate || startDate };
  }

  const startDate = pnxStep81NormalizeDate(s);
  return { startDate, endDate: startDate };
}

function pnxStep81GetValue(block, labels) {
  const lines = String(block || "").split(/\n/);
  const labelPattern = labels.join("|");

  for (const line of lines) {
    const s = String(line || "").trim();
    const re = new RegExp(`^(?:[-•・＊*]\\s*)?(?:${labelPattern})\\s*[：:／/｜|\\-]\\s*(.+)$`, "i");
    const m = s.match(re);
    if (m) return pnxStep80StripPrefix(m[1]);
  }

  const re2 = new RegExp(`(?:${labelPattern})\\s*[：:]\\s*([^\\n]+)`, "i");
  const m2 = String(block || "").match(re2);
  return m2 ? pnxStep80StripPrefix(m2[1]) : "";
}

function pnxStep81ExtractUrls(block) {
  const urls = String(block || "").match(/https?:\/\/[^\s　)）】]+/g) || [];
  const result = { officialUrl: "", instagramUrl: "", entryUrl: "", urls };

  const lines = String(block || "").split(/\n/);
  for (const line of lines) {
    const url = (line.match(/https?:\/\/[^\s　)）】]+/) || [])[0];
    if (!url) continue;
    const lower = line.toLowerCase();

    if (/instagram|インスタ|ig/.test(lower)) result.instagramUrl = result.instagramUrl || url;
    else if (/entry|エントリー|申込|申し込み|応募|googleフォーム|form/.test(lower)) result.entryUrl = result.entryUrl || url;
    else if (/公式|hp|ホームページ|web|site/.test(lower)) result.officialUrl = result.officialUrl || url;
  }

  for (const url of urls) {
    const lower = url.toLowerCase();
    if (!result.instagramUrl && /instagram\.com/.test(lower)) result.instagramUrl = url;
    if (!result.entryUrl && /(forms\.gle|docs\.google\.com\/forms|form|entry)/.test(lower)) result.entryUrl = url;
  }

  if (!result.officialUrl) result.officialUrl = urls.find(u => u !== result.entryUrl && u !== result.instagramUrl) || "";
  if (!result.entryUrl) result.entryUrl = urls.find(u => u !== result.officialUrl && u !== result.instagramUrl) || "";

  return result;
}

function pnxStep81ExtractPrefecture(block) {
  const direct = pnxStep81GetValue(block, ["開催県", "都道府県", "県", "所在地", "地域"]);
  if (direct) {
    const hit = PNX_STEP81_PREFECTURES.find(p => direct.includes(p) || direct.replace(/県|府|都/g, "") === p.replace(/県|府|都/g, ""));
    if (hit) return hit;
  }

  const text = String(block || "");
  return PNX_STEP81_PREFECTURES.find(p => text.includes(p)) || "";
}

function pnxStep81NormalizeCategory(raw, block) {
  const s = String(raw || block || "").toLowerCase();
  if (/jgto|日本ゴルフツアー|男子ツアー/.test(s)) return "JGTO";
  if (/jlpga|ステップ|女子ツアー/.test(s)) return "JLPGA";
  if (/qt/.test(s)) return "QT";
  if (/ミニツアー|ミニ|mini|atp|future|fj tour|fjtour|カートルズ|cartles|p&a|ドゥーカス|doucus/.test(s)) return "ミニツアー";
  if (/オープン|open|県オープン|地方オープン|選手権/.test(s)) return "オープン大会";
  if (/予選会|予選/.test(s)) return "予選会";
  if (/海外|asian tour|pga|korn|dp world|liv|台湾|韓国|中国|フィリピン/.test(s)) return "海外ツアー";
  return raw || "未分類";
}

function pnxStep81NormalizeGender(raw, block) {
  const s = String(raw || block || "").toLowerCase();
  if (/男女|男子.*女子|女子.*男子/.test(s)) return "男女";
  if (/女子|jlpga|women|female|ladies/.test(s)) return "女子";
  if (/男子|jgto|men|male/.test(s)) return "男子";
  return raw || "不明";
}

function pnxStep81SplitBlocks(text) {
  const normalized = String(text || "")
    .replace(/\r/g, "")
    .replace(/【大会情報まとめ】/g, "")
    .replace(/^\s*以下.*?です[。．]?\s*/m, "")
    .trim();

  if (!normalized) return [];

  const lines = normalized.split(/\n/);
  const blocks = [];
  let current = [];

  function isStart(line) {
    const s = String(line || "").trim();
    if (!s) return false;
    if (/^\d+\s*[\.．、\)]\s*\S+/.test(s)) return true;
    if (/^【[^】]{2,80}】$/.test(s)) return true;
    if (/^(大会名|試合名|名称)\s*[：:]/.test(s)) return true;
    if (/^#\s*\S+/.test(s)) return true;
    return false;
  }

  for (const line of lines) {
    const s = line.trim();

    if (isStart(s) && current.length) {
      blocks.push(current.join("\n").trim());
      current = [s];
      continue;
    }

    if (!s && current.length >= 4) {
      blocks.push(current.join("\n").trim());
      current = [];
      continue;
    }

    if (s) current.push(s);
  }

  if (current.length) blocks.push(current.join("\n").trim());

  if (blocks.length <= 1) {
    const split = normalized.split(/\n\s*\n+/).map(x => x.trim()).filter(Boolean);
    if (split.length > blocks.length) return split;
  }

  return blocks.filter(Boolean);
}

function pnxStep81Title(block) {
  const labeled = pnxStep81GetValue(block, ["大会名", "試合名", "名称", "タイトル"]);
  if (labeled) return labeled;

  const first = String(block || "").split(/\n/).map(pnxStep80StripPrefix).find(line => {
    if (!line) return false;
    if (/開催|会場|締切|参加費|エントリー|賞金|主催|資格|URL|http/.test(line)) return false;
    return line.length <= 80;
  });

  return first || "大会名未設定";
}

function pnxStep81DetectDuplicate(parsed) {
  const seen = new Map();
  return parsed.map(t => {
    const key = `${String(t.title || "").replace(/\s/g,"").toLowerCase()}_${t.startDate || ""}_${String(t.venue || "").replace(/\s/g,"").toLowerCase()}`;
    const warnings = Array.isArray(t.warnings) ? t.warnings.slice() : [];
    if (key.length > 5 && seen.has(key)) {
      warnings.push("同一文章内に重複候補があります");
      const prev = seen.get(key);
      prev.warnings = Array.from(new Set([...(prev.warnings || []), "同一文章内に重複候補があります"]));
    } else {
      seen.set(key, t);
    }
    return { ...t, warnings: Array.from(new Set(warnings)) };
  });
}

function pnxStep81ParseOrganizedTournamentText(text) {
  const blocks = pnxStep81SplitBlocks(text);
  const nowId = Date.now();

  const parsed = blocks.map((block, index) => {
    const title = pnxStep81Title(block);
    const dateText = pnxStep81GetValue(block, ["開催日", "日程", "開催期間", "日時", "開催"]);
    const explicitEndText = pnxStep81GetValue(block, ["終了日", "最終日", "最終開催日"]);
    const range = pnxStep81ExtractDateRange(dateText || block);
    const explicitEndDate = pnxStep81NormalizeDate(explicitEndText, pnxStep81DateParts(range.startDate));

    const venue = pnxStep81GetValue(block, ["会場", "開催コース", "コース", "ゴルフ場", "開催場所", "場所"]);
    const prefecture = pnxStep81ExtractPrefecture(block);
    const categoryRaw = pnxStep81GetValue(block, ["カテゴリ", "カテゴリー", "種別", "区分", "ツアー"]);
    const genderRaw = pnxStep81GetValue(block, ["男女", "性別", "対象", "男子女子"]);
    const deadlineText = pnxStep81GetValue(block, ["エントリー締切", "申込締切", "募集締切", "締切", "〆切", "締め切り"]);
    const urls = pnxStep81ExtractUrls(block);

    const warnings = [];
    if (!title || title === "大会名未設定") warnings.push("大会名が読み取れませんでした");
    if (!range.startDate) warnings.push("開催日が読み取れませんでした");
    if (!venue) warnings.push("会場が読み取れませんでした");
    if (!prefecture) warnings.push("都道府県が読み取れませんでした");
    if (!deadlineText) warnings.push("エントリー締切が未入力です");
    if (!pnxStep81GetValue(block, ["エントリー費", "参加費", "出場料", "費用"])) warnings.push("エントリー費が未入力です");

    const category = pnxStep81NormalizeCategory(categoryRaw, block);
    if (!category || category === "未分類") warnings.push("カテゴリが未分類です");

    const confidence = Math.max(0.28, Math.min(0.98, 0.96 - warnings.length * 0.1));

    return {
      id: `text_bulk_${nowId}_${index}`,
      tournamentId: `text_bulk_${nowId}_${index}`,
      title,
      name: title,
      category,
      gender: pnxStep81NormalizeGender(genderRaw, block),
      startDate: range.startDate,
      endDate: explicitEndDate || range.endDate || range.startDate,
      prefecture,
      area: pnxStep81GetValue(block, ["エリア", "地域"]) || pnxStep80AreaFromPref(prefecture),
      venue,
      entryDeadline: pnxStep81NormalizeDate(deadlineText),
      entryFee: pnxStep80NormalizeMoney(pnxStep81GetValue(block, ["エントリー費", "参加費", "出場料", "費用"])),
      prize: pnxStep128NormalizePrizeText(pnxStep81GetValue(block, ["賞金総額", "総賞金", "賞金"])),
      winnerPrize: pnxStep128NormalizePrizeText(pnxStep81GetValue(block, ["優勝賞金", "優勝"])),
      capacity: pnxStep81GetValue(block, ["募集人数", "定員", "人数"]),
      eligibility: pnxStep81GetValue(block, ["出場資格", "参加資格", "資格", "対象者"]),
      organizer: pnxStep81GetValue(block, ["主催", "主催者", "運営"]),
      officialUrl: urls.officialUrl,
      instagramUrl: urls.instagramUrl,
      entryUrl: urls.entryUrl,
      status: "draft",
      confidence,
      warnings: Array.from(new Set(warnings)),
      sourceText: block,
      source: "chatgpt-organized-text-step81"
    };
  }).filter(t => t.title || t.startDate || t.venue);

  return pnxStep81DetectDuplicate(parsed);
}


/* ============================================================
   STEP82: Bulk Draft Preview Quality Helpers
   仮登録プレビューの不足項目・公開可否・一括保存を管理
   ============================================================ */
function pnxStep82DraftIssues(t) {
  const errors = [];
  const warnings = [];

  const text = (v) => String(v == null ? "" : v).trim();
  const isBadTitle = !text(t.title) || text(t.title) === "大会名未設定" || text(t.title) === "新規大会";

  if (isBadTitle) errors.push("大会名が未入力です");
  if (!text(t.startDate)) errors.push("開催日が未入力です");
  if (!text(t.venue)) errors.push("会場が未入力です");
  if (!text(t.category) || text(t.category) === "未分類") errors.push("カテゴリが未分類です");

  if (!text(t.prefecture)) warnings.push("都道府県が未入力です");
  if (!text(t.entryDeadline)) warnings.push("エントリー締切が未入力です");
  if (!text(t.entryFee)) warnings.push("エントリー費が未入力です");

  if (Array.isArray(t.warnings)) {
    t.warnings.forEach(w => {
      const s = text(w);
      if (!s) return;
      if (/重複|読み取れません|未分類|未入力/.test(s)) warnings.push(s);
      else warnings.push(s);
    });
  }

  return {
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set(warnings)),
    publishable: errors.length === 0,
    score: Math.max(0, 100 - errors.length * 28 - warnings.length * 8)
  };
}

function pnxStep82StatusLabel(status) {
  const map = {
    draft: "下書き",
    open: "募集中",
    closed: "締切",
    ongoing: "開催中",
    finished: "終了"
  };
  return map[status] || status || "下書き";
}

function pnxStep82PreviewStats(drafts) {
  return (drafts || []).reduce((acc, t) => {
    const q = pnxStep82DraftIssues(t);
    acc.total += 1;
    if (q.publishable) acc.publishable += 1;
    else acc.blocked += 1;
    acc.errors += q.errors.length;
    acc.warnings += q.warnings.length;
    if ((t.status || "draft") === "draft") acc.draft += 1;
    if ((t.status || "draft") === "open") acc.open += 1;
    return acc;
  }, { total: 0, publishable: 0, blocked: 0, errors: 0, warnings: 0, draft: 0, open: 0 });
}


/* ============================================================
   STEP83: Bulk Save Duplicate / Import History UI Helpers
   仮登録プレビュー保存時の既存大会重複・保存履歴を表示
   ============================================================ */
function pnxStep83GetDuplicateReport(drafts) {
  if (!window.PNXCmsFinalDesignBridge || !window.PNXCmsFinalDesignBridge.findBulkImportDuplicates) {
    return { total: drafts.length, duplicated: 0, rows: [] };
  }
  return window.PNXCmsFinalDesignBridge.findBulkImportDuplicates(drafts);
}

function pnxStep83LastImport() {
  if (!window.PNXCmsFinalDesignBridge || !window.PNXCmsFinalDesignBridge.getLastBulkImport) return null;
  return window.PNXCmsFinalDesignBridge.getLastBulkImport();
}

function pnxStep83History() {
  if (!window.PNXCmsFinalDesignBridge || !window.PNXCmsFinalDesignBridge.getBulkImportHistory) return [];
  return window.PNXCmsFinalDesignBridge.getBulkImportHistory();
}

function ClaudeBulkTournamentPanel() {
  const sampleText = `【大会情報まとめ】

1. 埼玉オープンゴルフ選手権
開催日：2026年6月12日（金）〜6月14日（日）
会場：霞ヶ関カンツリー倶楽部
開催県：埼玉県
カテゴリ：オープン大会
エントリー締切：2026年5月30日
エントリー費：30,000円
賞金総額：3,000万円
募集人数：80名
出場資格：プロゴルファー・アマチュア
公式URL：https://example.com/saitama-open
エントリーURL：https://example.com/entry

2. 関東ミニツアー 第3戦
日程：7/8（水）
場所：太平洋クラブ成田コース
都道府県：千葉県
種別：ミニツアー
申込締切：6/25
参加費：18,000円
対象：プロ・研修生・競技アマ
Instagram：https://instagram.com/exampletour`;

  const [sourceText, setSourceText] = useState("");
  const [claudeJson, setClaudeJson] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [status, setStatus] = useState("ChatGPTで整理した大会情報を貼って、CMSで文章を読み取れます。");
  const [flowStep, setFlowStep] = useState("paste");
  const [reflectionCheck, setReflectionCheck] = useState(null);
  const [copied, setCopied] = useState(false);

  const [duplicateReport, setDuplicateReport] = useState({ total: 0, duplicated: 0, rows: [] });
  const [lastImport, setLastImport] = useState(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const refreshStep83Reports = () => {
    setDuplicateReport(pnxStep83GetDuplicateReport(drafts));
    setLastImport(pnxStep83LastImport());
  };


  const previewStats = pnxStep82PreviewStats(drafts);

  const setAllDraftStatus = (nextStatus) => {
    setDrafts(prev => prev.map(t => ({
      ...t,
      status: nextStatus,
      published: nextStatus !== "draft"
    })));
    setStatus(`仮登録 ${prevLabel(nextStatus)} に一括変更しました。`);
  };

  const prevLabel = (nextStatus) => pnxStep82StatusLabel(nextStatus);


  useEffect(() => {
    const timer = setTimeout(refreshStep83Reports, 120);
    const onImport = () => setTimeout(refreshStep83Reports, 120);
    window.addEventListener("pnx:cms-final:bulk-import-finished", onImport);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pnx:cms-final:bulk-import-finished", onImport);
    };
  }, [drafts]);



  const schema = {
    tournaments: [
      {
        title: "大会名",
        category: "JGTO / ミニツアー / オープン大会 / QT / 予選会 / その他",
        gender: "男子 / 女子 / 男女 / 不明",
        startDate: "YYYY-MM-DD",
        endDate: "YYYY-MM-DD",
        prefecture: "都道府県",
        area: "関東 / 関西 / 九州 など",
        venue: "ゴルフ場名",
        entryDeadline: "YYYY-MM-DD or 空文字",
        entryFee: "数値または文字列",
        prize: "賞金総額。分からなければ空文字",
        winnerPrize: "優勝賞金。分からなければ空文字",
        capacity: "募集人数。分からなければ空文字",
        eligibility: "出場資格",
        organizer: "主催者",
        officialUrl: "公式URL",
        instagramUrl: "Instagram URL",
        entryUrl: "エントリーURL",
        status: "draft / open / closed / ongoing / finished",
        confidence: 0.0,
        warnings: ["不足・曖昧な項目"]
      }
    ]
  };

  const makeClaudePrompt = () => {
    return `あなたはProNexaXというプロゴルファー・研修生・競技アマ向け試合検索アプリの大会データ整理AIです。

以下の整理済み大会情報から、大会情報をJSON形式で抽出してください。

【重要ルール】
- 必ずJSONのみを返してください。説明文やMarkdownは不要です。
- 複数大会がある場合は tournaments 配列に分けてください。
- 日付は可能な限り YYYY-MM-DD に正規化してください。
- 分からない項目は空文字 "" にしてください。
- 推測した項目は warnings に理由を書いてください。
- status は以下から選んでください。
  - draft: 下書き
  - open: 募集中
  - closed: 締切
  - ongoing: 開催中
  - finished: 終了
- confidence は0〜1で、情報の確かさを入れてください。
- entryFee / prize / winnerPrize は分かる範囲で数値または文字列で入れてください。
- 出場資格、主催、URL類は元情報にある場合だけ入れてください。

【返却JSONスキーマ】
${JSON.stringify(schema, null, 2)}

【整理済み大会情報】
${sourceText || sampleText}`;
  };

  const copyPrompt = async () => {
    const prompt = makeClaudePrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setStatus("Claude Console用プロンプトをコピーしました。Claudeに貼ってJSONを作成してください。");
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      setStatus("コピーできませんでした。下のプロンプトを手動でコピーしてください。");
    }
  };

  const convertOrganizedTextToDrafts = () => {
    const text = sourceText.trim();

    if (!text) {
      setStatus("ChatGPTで整理した大会情報の文章を貼ってください。");
      return;
    }

    const parsed = pnxStep81ParseOrganizedTournamentText(text).map(pnxStep128NormalizePrizeFields);

    if (!parsed.length) {
      setStatus("大会情報を読み取れませんでした。大会名・開催日・会場などが分かる形で貼ってください。");
      return;
    }

    setDrafts(parsed);
    setFlowStep("preview");
    setReflectionCheck(null);
    setStatus(`${parsed.length}件の大会をCMSが文章から高精度読み取りし、仮登録リストに変換しました。確認して一括保存してください。`);
    pnxStep128CmsActionToast(`仮登録プレビューを作成しました：${parsed.length}件`, "ok");
  };

  const parseJson = () => {
    try {
      const raw = claudeJson.trim();
      if (!raw) {
        setStatus("ClaudeのJSON結果を貼ってください。");
        return;
      }

      const cleaned = raw
        .replace(/^```json/i, "")
        .replace(/^```/i, "")
        .replace(/```$/i, "")
        .trim();

      const parsed = JSON.parse(cleaned);
      const list = Array.isArray(parsed) ? parsed : parsed.tournaments;

      if (!Array.isArray(list)) {
        setStatus("JSON内に tournaments 配列が見つかりません。");
        return;
      }

      const normalized = list.map((t, index) => ({
        id: t.id || t.tournamentId || `claude_bulk_${Date.now()}_${index}`,
        tournamentId: t.id || t.tournamentId || `claude_bulk_${Date.now()}_${index}`,
        title: t.title || t.name || "大会名未設定",
        name: t.title || t.name || "大会名未設定",
        category: t.category || "未分類",
        gender: t.gender || "不明",
        startDate: t.startDate || t.date || "",
        endDate: t.endDate || t.startDate || t.date || "",
        prefecture: t.prefecture || "",
        area: t.area || "",
        venue: t.venue || t.course || "",
        entryDeadline: t.entryDeadline || "",
        entryFee: t.entryFee || "",
        prize: pnxStep128NormalizePrizeText(t.prize || t.totalPrize || ""),
        winnerPrize: pnxStep128NormalizePrizeText(t.winnerPrize || t.winningPrize || ""),
        capacity: t.capacity || "",
        eligibility: t.eligibility || "",
        organizer: t.organizer || "",
        officialUrl: t.officialUrl || "",
        instagramUrl: t.instagramUrl || "",
        entryUrl: t.entryUrl || "",
        status: t.status || "draft",
        confidence: typeof t.confidence === "number" ? t.confidence : 0,
        warnings: Array.isArray(t.warnings) ? t.warnings : [],
        sourceText: sourceText,
        source: t.source || "chatgpt-organized-text"
      }));

      setDrafts(normalized.map(pnxStep128NormalizePrizeFields));
      setFlowStep("preview");
      setReflectionCheck(null);
      setStatus(`${normalized.length}件の大会を仮登録リストに変換しました。内容を確認して一括保存してください。`);
      pnxStep128CmsActionToast(`JSONから仮登録を作成しました：${normalized.length}件`, "ok");
    } catch (e) {
      setStatus(`JSON解析エラー: ${e.message}`);
    }
  };

  const updateDraft = (index, key, value) => {
    setDrafts(prev => {
      const next = prev.slice();
      next[index] = { ...next[index], [key]: value };
      if (key === "title") next[index].name = value;
      if (key === "startDate" && !next[index].endDate) next[index].endDate = value;
      return next;
    });
  };

  const removeDraft = (index) => {
    setDrafts(prev => prev.filter((_, i) => i !== index));
  };


  const step126FlowLabel = () => {
    if (flowStep === "paste") return "1. 貼り付け";
    if (flowStep === "preview") return "2. 仮登録確認";
    if (flowStep === "save") return "3. 保存";
    if (flowStep === "reflect") return "4. 本体反映確認";
    return "準備中";
  };

  const runStep126PasteToPreview = () => {
    convertOrganizedTextToDrafts();
    setFlowStep("preview");
  };

  const runStep126ReflectionCheck = (event) => {
    pnxStep129StopActionEvent(event);
    if (!window.PNXCmsFinalDesignBridge) {
      const result = { ok:false, message:"Bridge未接続", count:0 };
      setReflectionCheck(result);
      setStatus("Bridge未接続：本体反映確認ができません。");
      pnxStep128CmsActionToast("Bridge未接続：反映確認できません", "ng");
      return result;
    }

    let snapshot = null;
    let hard = null;
    let diag = null;

    try {
      if (window.PNXCmsFinalDesignBridge.createSearchSnapshot) {
        snapshot = window.PNXCmsFinalDesignBridge.createSearchSnapshot();
      }
      if (window.PNXCmsFinalDesignBridge.createHardSearchSnapshot) {
        hard = window.PNXCmsFinalDesignBridge.createHardSearchSnapshot();
      }
      if (window.PNXCmsFinalDesignBridge.diagnoseAppReflection) {
        diag = window.PNXCmsFinalDesignBridge.diagnoseAppReflection();
      }
      if (window.PNXCmsFinalDesignBridge.publishToApp) {
        pnxStep129SafePublishToApp(null, { message:"本体反映しました" });
      }
    } catch(e) {
      const result = { ok:false, message:e.message || String(e), count:0, snapshot, hard, diag };
      setReflectionCheck(result);
      setStatus(`本体反映確認でエラー：${result.message}`);
      pnxStep128CmsActionToast("本体反映確認でエラーが出ました", "ng");
      return result;
    }

    const count =
      (hard && hard.tournaments && hard.tournaments.length) ||
      (snapshot && snapshot.tournaments && snapshot.tournaments.length) ||
      (diag && diag.snapshotCount) ||
      0;

    const result = {
      ok: count > 0,
      count,
      snapshotMeta: snapshot && snapshot.meta || null,
      hardMeta: hard && hard.meta || null,
      diag,
      checkedAt: new Date().toISOString()
    };

    setReflectionCheck(result);
    setFlowStep("reflect");
    setStatus(count > 0
      ? `本体反映確認OK：公開対象 ${count}件 のスナップショットを作成しました。`
      : "本体反映確認：公開対象が0件です。下書き状態・必須項目不足を確認してください。"
    );
    pnxStep128CmsActionToast(count > 0 ? `本体反映しました：公開対象 ${count}件` : "公開対象が0件です", count > 0 ? "ok" : "ng");

    return result;
  };

  const runStep126SaveOpenAndReflect = (event) => {
    pnxStep129StopActionEvent(event);
    if (!drafts.length) {
      setStatus("先に大会情報を読み取って仮登録プレビューを作成してください。");
      pnxStep128CmsActionToast("先に仮登録プレビューを作成してください", "ng");
      return;
    }

    const blocked = drafts.filter(t => !pnxStep82DraftIssues(t).publishable);
    if (blocked.length) {
      setFlowStep("preview");
      setStatus(`公開保存前に修正が必要です。必須項目不足の大会が ${blocked.length}件 あります。`);
      pnxStep128CmsActionToast(`修正が必要です：${blocked.length}件`, "ng");
      return;
    }

    setFlowStep("save");
    pnxStep128CmsActionToast("公開保存を開始しました", "pending");
    const record = saveAllWithStatus("open");

    setTimeout(() => {
      runStep126ReflectionCheck();
    }, 120);

    return record;
  };

  const resetStep126Flow = () => {
    setSourceText("");
    setClaudeJson("");
    setDrafts([]);
    setReflectionCheck(null);
    setFlowStep("paste");
    setStatus("入力をクリアしました。次の大会情報を貼り付けできます。");
  };

  const saveAllWithStatus = (forcedStatus) => {
    if (!window.PNXCmsFinalDesignBridge) {
      setStatus("Bridge未接続：保存できません。");
      return;
    }

    if (!drafts.length) {
      setStatus("保存する仮登録大会がありません。");
      return;
    }

    if (forcedStatus === "open") {
      const blocked = drafts.filter(t => !pnxStep82DraftIssues(t).publishable);
      if (blocked.length) {
        setStatus(`募集中保存できません。必須項目不足の大会が ${blocked.length}件 あります。まず修正するか下書き保存してください。`);
        return;
      }
    }

    if (window.PNXCmsFinalDesignBridge.bulkImportTournaments) {
      const record = window.PNXCmsFinalDesignBridge.bulkImportTournaments(drafts, {
        status: forcedStatus || null,
        skipDuplicates,
        publishAfterSave: true,
        source: "chatgpt-organized-text-step83"
      });
      setLastImport(record);
      refreshStep83Reports();

      setFlowStep(forcedStatus === "draft" ? "save" : "reflect");
      setStatus(`${record.savedCount}件を保存しました。重複スキップ ${record.skippedCount}件 / 失敗 ${record.failedCount}件。${forcedStatus === "draft" ? "下書きは本体には表示されません。" : "公開対象は本体試合検索へ反映準備しました。"}`);
      pnxStep128CmsActionToast(forcedStatus === "draft" ? `下書き保存しました：${record.savedCount}件` : `公開保存しました：${record.savedCount}件`, record.failedCount ? "ng" : "ok");
      if (forcedStatus !== "draft") setTimeout(runStep126ReflectionCheck, 120);
      return record;
    }

    const saved = drafts.map(t => {
      const nextStatus = forcedStatus || t.status || "draft";
      return window.PNXCmsFinalDesignBridge.saveTournament({
        ...t,
        status: nextStatus,
        published: nextStatus !== "draft",
        source: t.source || "chatgpt-organized-text-step83"
      });
    });

    let payload = null;
    try {
      if (window.PNXCmsFinalDesignBridge.createSearchSnapshot) {
        window.PNXCmsFinalDesignBridge.createSearchSnapshot();
      }
      payload = pnxStep129SafePublishToApp(null, { message:"本体反映しました" });
    } catch(e) {}

    setFlowStep(forcedStatus === "draft" ? "save" : "reflect");
    setStatus(`${saved.length}件を${forcedStatus ? pnxStep82StatusLabel(forcedStatus) : "現在の状態"}で保存しました。${forcedStatus === "draft" ? "下書きは本体には表示されません。" : "公開対象は本体試合検索へ反映準備しました。"}`);
    pnxStep128CmsActionToast(forcedStatus === "draft" ? `下書き保存しました：${saved.length}件` : `公開保存しました：${saved.length}件`, "ok");
    if (forcedStatus !== "draft") setTimeout(runStep126ReflectionCheck, 120);
    return payload;
  };

  const saveAll = () => saveAllWithStatus(null);

  const promptPreview = makeClaudePrompt();

  return (
    <section className="card pnx-step63-card">
      <header className="card__head">
        <h2 className="card__title">整理済み大会テキスト 一括登録</h2>
        <I.Info size={13} className="card__hint"/>
        <div className="card__head-r">
          <button className="btn btn--ghost btn--sm" onClick={() => setSourceText(sampleText)}>
            サンプル入力
          </button>
          <button className="btn btn--primary btn--sm" onClick={runStep126PasteToPreview}>
            高精度読み取りで仮登録
          </button>
          <button className="btn btn--primary btn--sm pnx-step126-mainbtn" onClick={(e) => runStep126SaveOpenAndReflect(e)} disabled={!drafts.length || previewStats.blocked > 0}>
            公開保存→本体反映確認
          </button>
          <button className="btn btn--ghost btn--sm" onClick={copyPrompt}>
            <I.Save size={13}/> {copied ? "コピー済み" : "Claude用プロンプト"}
          </button>
        </div>
      </header>

      <div className="card__body">
        <div className="pnx-step63-status">{status}</div>

        <div className="pnx-step126-flow">
          <div className="pnx-step126-flow__head">
            <strong>CMS大会登録フロー</strong>
            <span>{step126FlowLabel()}</span>
          </div>
          <div className="pnx-step126-steps">
            <span className={flowStep === "paste" ? "is-current" : (sourceText || drafts.length) ? "is-done" : ""}>1 貼る</span>
            <span className={flowStep === "preview" ? "is-current" : drafts.length ? "is-done" : ""}>2 仮登録</span>
            <span className={flowStep === "save" ? "is-current" : lastImport ? "is-done" : ""}>3 保存</span>
            <span className={flowStep === "reflect" ? "is-current" : reflectionCheck && reflectionCheck.ok ? "is-done" : ""}>4 反映</span>
          </div>
          <div className="pnx-step126-actions">
            <button className="btn btn--ghost btn--xs" onClick={runStep126PasteToPreview}>文章を読み取る</button>
            <button className="btn btn--ghost btn--xs" onClick={() => saveAllWithStatus("draft")} disabled={!drafts.length}>下書き保存</button>
            <button className="btn btn--primary btn--xs" onClick={(e) => runStep126SaveOpenAndReflect(e)} disabled={!drafts.length || previewStats.blocked > 0}>公開保存→反映確認</button>
            <button className="btn btn--ghost btn--xs" onClick={(e) => runStep126ReflectionCheck(e)}>本体反映確認</button>
            <button className="btn btn--ghost btn--xs" onClick={resetStep126Flow}>クリア</button>
          </div>
          {reflectionCheck && (
            <div className={`pnx-step126-reflect ${reflectionCheck.ok ? "is-ok" : "is-ng"}`}>
              <b>{reflectionCheck.ok ? "反映OK" : "要確認"}</b>
              <span>公開対象 {reflectionCheck.count || 0}件</span>
              {reflectionCheck.checkedAt && <small>{reflectionCheck.checkedAt}</small>}
            </div>
          )}
        </div>

        <div className="pnx-step63-grid">
          <div className="pnx-step63-box">
            <div className="pnx-step63-box__head">
              <strong>1. 整理済みテキスト</strong>
              <span>ChatGPTで分かりやすくまとめた大会情報をそのまま貼ります。</span>
            </div>
            <textarea
              className="textarea pnx-step63-textarea"
              value={sourceText}
              onChange={e => setSourceText(e.target.value)}
              placeholder="ここに整理済み大会情報を貼る"
            />
          </div>

          <div className="pnx-step63-box">
            <div className="pnx-step63-box__head">
              <strong>2. 予備：Claude Console用プロンプト</strong>
              <span>CMS読み取りで足りない場合だけ、Claude Console用に使えます。</span>
            </div>
            <textarea
              className="textarea pnx-step63-textarea is-prompt"
              value={promptPreview}
              readOnly
            />
          </div>
        </div>

        <div className="pnx-step63-box pnx-step63-json">
          <div className="pnx-step63-box__head">
            <strong>3. 予備：JSON貼り戻し</strong>
            <span>ClaudeなどでJSON化した場合だけ、ここに貼って仮登録へ変換します。</span>
          </div>
          <textarea
            className="textarea pnx-step63-jsonarea"
            value={claudeJson}
            onChange={e => setClaudeJson(e.target.value)}
            placeholder='{"tournaments":[{"title":"茨城オープン","startDate":"2026-06-12"}]}'
          />
          <div className="pnx-step63-row">
            <button className="btn btn--ghost btn--sm" onClick={parseJson}>
              JSONを仮登録に変換
            </button>
            <button className="btn btn--ghost btn--sm" onClick={() => saveAllWithStatus("draft")} disabled={!drafts.length}>
              下書き保存
            </button>
            <button className="btn btn--primary btn--sm" onClick={() => saveAllWithStatus("open")} disabled={!drafts.length || previewStats.blocked > 0}>
              募集中で保存
            </button>
          </div>
        </div>

        <div className="pnx-step63-preview">
          <div className="pnx-step63-preview__head">
            <strong>4. 仮登録プレビュー</strong>
            <span>{drafts.length}件</span>
          </div>

          {!!drafts.length && (
            <div className="pnx-step82-previewbar">
              <div className="pnx-step82-stats">
                <span><b>{previewStats.total}</b>件</span>
                <span className="ok"><b>{previewStats.publishable}</b>公開OK</span>
                <span className="ng"><b>{previewStats.blocked}</b>要修正</span>
                <span className="warn"><b>{previewStats.warnings}</b>警告</span>
              </div>
              <div className="pnx-step83-dupbox">
                <label className="pnx-step83-skip">
                  <input type="checkbox" checked={skipDuplicates} onChange={e => setSkipDuplicates(e.target.checked)}/>
                  既存大会と重複するものは保存しない
                </label>
                {duplicateReport.duplicated > 0 && (
                  <span className="pnx-step83-dupwarn">既存重複候補 {duplicateReport.duplicated}件</span>
                )}
              </div>
              <div className="pnx-step82-actions">
                <button className="btn btn--ghost btn--xs" onClick={() => { refreshStep83Reports(); setStatus("既存大会との重複チェックを更新しました。"); }}>重複チェック</button>
                <button className="btn btn--ghost btn--xs" onClick={() => setAllDraftStatus("draft")}>全て下書き</button>
                <button className="btn btn--ghost btn--xs" onClick={() => setAllDraftStatus("open")} disabled={previewStats.blocked > 0}>全て募集中</button>
                <button className="btn btn--ghost btn--xs" onClick={() => saveAllWithStatus("draft")}>下書き保存</button>
                <button className="btn btn--primary btn--xs" onClick={() => saveAllWithStatus("open")} disabled={previewStats.blocked > 0}>募集中で保存</button>
              </div>
            </div>
          )}

          {!drafts.length && (
            <div className="pnx-step63-empty">
              文章を読み取ると、ここに大会ごとの確認カードが表示されます。
            </div>
          )}

          {drafts.map((t, index) => {
            const quality = pnxStep82DraftIssues(t);
            return (
            <div className={`pnx-step63-draft ${quality.publishable ? "is-publishable" : "is-blocked"}`} key={t.id || index}>
              <div className="pnx-step63-draft__top">
                <strong>{t.title}</strong>
                <div className="pnx-step82-cardbadges">
                  <span className={`pnx-step82-status is-${t.status || "draft"}`}>{pnxStep82StatusLabel(t.status || "draft")}</span>
                  <span className={`pnx-step82-quality ${quality.publishable ? "is-ok" : "is-ng"}`}>
                    {quality.publishable ? "公開OK" : "要修正"}
                  </span>
                  <span className={`pnx-step63-confidence ${t.confidence >= .75 ? "is-high" : t.confidence >= .45 ? "is-mid" : "is-low"}`}>
                    {Math.round((t.confidence || 0) * 100)}%
                  </span>
                </div>
              </div>

              <div className="pnx-step82-issues">
                {quality.errors.map((err, i) => <span key={`e-${i}`} className="is-error">✕ {err}</span>)}
                {quality.errors.length === 0 && <span className="is-ok">公開に必要な基本項目は揃っています</span>}
                {quality.warnings.slice(0, 4).map((w, i) => <span key={`w-${i}`} className="is-warning">⚠ {w}</span>)}
                {(() => {
                  const d = duplicateReport.rows && duplicateReport.rows.find(r => r.index === index);
                  return d && d.duplicateCount > 0 ? <span className="is-error">✕ 既存大会との重複候補：{d.duplicateTitles.join(" / ")}</span> : null;
                })()}
              </div>

              <div className="pnx-step63-draft__form">
                <label>大会名<input className="input" value={t.title} onChange={e => updateDraft(index, "title", e.target.value)}/></label>
                <label>カテゴリ<input className="input" value={t.category} onChange={e => updateDraft(index, "category", e.target.value)}/></label>
                <label>開始日<input className="input mono" value={t.startDate} onChange={e => updateDraft(index, "startDate", e.target.value)}/></label>
                <label>終了日<input className="input mono" value={t.endDate} onChange={e => updateDraft(index, "endDate", e.target.value)}/></label>
                <label>県<input className="input" value={t.prefecture} onChange={e => updateDraft(index, "prefecture", e.target.value)}/></label>
                <label>会場<input className="input" value={t.venue} onChange={e => updateDraft(index, "venue", e.target.value)}/></label>
                <label>締切<input className="input mono" value={t.entryDeadline} onChange={e => updateDraft(index, "entryDeadline", e.target.value)}/></label>
                <label>参加費<input className="input" value={t.entryFee} onChange={e => updateDraft(index, "entryFee", e.target.value)}/></label>
                <label>ステータス
                  <select className="select" value={t.status} onChange={e => updateDraft(index, "status", e.target.value)}>
                    <option value="draft">下書き</option>
                    <option value="open">募集中</option>
                    <option value="closed">締切</option>
                    <option value="ongoing">開催中</option>
                    <option value="finished">終了</option>
                  </select>
                </label>
              </div>

              {!!t.warnings.length && (
                <div className="pnx-step63-warnings">
                  {t.warnings.map((w, i) => <span key={i}>⚠ {w}</span>)}
                </div>
              )}

              <div className="pnx-step63-draft__actions">
                <button className="btn btn--ghost btn--xs" onClick={() => updateDraft(index, "status", "draft")}>
                  下書き
                </button>
                <button className="btn btn--ghost btn--xs" onClick={() => updateDraft(index, "status", "open")} disabled={!quality.publishable}>
                  募集中
                </button>
                <button className="btn btn--danger-ghost btn--xs" onClick={() => removeDraft(index)}>
                  <I.Trash size={11}/> 除外
                </button>
              </div>
            </div>
            );
          })}

          {lastImport && (
            <div className="pnx-step83-history">
              <div className="pnx-step83-history__head">
                <strong>直近の一括保存結果</strong>
                <span>{lastImport.importedAt}</span>
              </div>
              <div className="pnx-step83-history__grid">
                <div><span>対象</span><b>{lastImport.total}</b></div>
                <div><span>保存</span><b>{lastImport.savedCount}</b></div>
                <div><span>重複スキップ</span><b>{lastImport.skippedCount}</b></div>
                <div><span>失敗</span><b>{lastImport.failedCount}</b></div>
              </div>
              {!!lastImport.skippedCount && (
                <div className="pnx-step83-skipped">
                  {lastImport.skipped.slice(0, 5).map((s, i) => (
                    <span key={i}>重複スキップ：{s.title} / 既存：{(s.duplicateTitles || []).join("、")}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


/* ============================================================
   STEP66: CMS Tournament Manage UI
   登録済み大会の編集・削除・公開状態管理
   ============================================================ */
function CmsTournamentManagePanel() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("登録済み大会を読み込み中...");

  const statusOptions = [
    { value: "draft", label: "下書き" },
    { value: "open", label: "募集中" },
    { value: "closed", label: "締切" },
    { value: "ongoing", label: "開催中" },
    { value: "finished", label: "終了" },
  ];

  const statusLabel = (value) => {
    const found = statusOptions.find(s => s.value === value);
    return found ? found.label : value || "未設定";
  };

  const loadRows = () => {
    if (!window.PNXCmsFinalDesignBridge) {
      setNotice("Bridge未接続：cms-final-design-bridge.jsを確認してください。");
      return;
    }

    const list = window.PNXCmsFinalDesignBridge.getTournaments()
      .map(t => ({
        id: t.id || t.tournamentId,
        tournamentId: t.tournamentId || t.id,
        title: t.title || t.name || "大会名未設定",
        name: t.name || t.title || "大会名未設定",
        category: t.category || "未分類",
        gender: t.gender || "不明",
        startDate: t.startDate || t.date || "",
        endDate: t.endDate || t.startDate || t.date || "",
        prefecture: t.prefecture || "",
        area: t.area || "",
        venue: t.venue || t.course || t.place || "",
        entryDeadline: t.entryDeadline || "",
        entryFee: t.entryFee || "",
        prize: pnxStep128NormalizePrizeText(t.prize || t.totalPrize || ""),
        winnerPrize: pnxStep128NormalizePrizeText(t.winnerPrize || t.winningPrize || ""),
        capacity: t.capacity || "",
        eligibility: t.eligibility || "",
        organizer: t.organizer || "",
        officialUrl: t.officialUrl || "",
        instagramUrl: t.instagramUrl || "",
        entryUrl: t.entryUrl || "",
        status: t.status || "draft",
        published: t.published !== false,
        warnings: Array.isArray(t.warnings) ? t.warnings : [],
        confidence: typeof t.confidence === "number" ? t.confidence : null,
        updatedAt: t.updatedAt || "",
        createdAt: t.createdAt || "",
        source: t.source || "cms"
      }))
      .sort((a, b) => {
        const sd = String(a.startDate || "").localeCompare(String(b.startDate || ""));
        if (sd !== 0) return sd;
        return String(a.title || "").localeCompare(String(b.title || ""));
      });

    setRows(list);
    if (!selectedId && list[0]) setSelectedId(list[0].id);
    setNotice(`${list.length}件の登録済み大会を読み込みました。`);
  };

  useEffect(() => {
    const timer = setTimeout(loadRows, 350);
    const onSaved = () => setTimeout(loadRows, 120);
    window.addEventListener("pnx:cms-final:tournament-saved", onSaved);
    window.addEventListener("pnx:cms-final:tournament-removed", onSaved);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pnx:cms-final:tournament-saved", onSaved);
      window.removeEventListener("pnx:cms-final:tournament-removed", onSaved);
    };
  }, []);

  const selected = rows.find(r => r.id === selectedId) || rows[0] || null;

  const filtered = rows.filter(r => {
    const q = query.trim().toLowerCase();
    const hit = !q || [
      r.title, r.category, r.venue, r.prefecture, r.organizer, r.status
    ].join(" ").toLowerCase().includes(q);
    const statusHit = statusFilter === "all" || r.status === statusFilter;
    return hit && statusHit;
  });

  const stats = rows.reduce((acc, r) => {
    acc.total += 1;
    acc[r.status || "draft"] = (acc[r.status || "draft"] || 0) + 1;
    if (r.status !== "draft" && r.published !== false) acc.public += 1;
    return acc;
  }, { total: 0, public: 0, draft: 0, open: 0, closed: 0, ongoing: 0, finished: 0 });

  const updateLocalSelected = (key, value) => {
    if (!selected) return;
    setRows(prev => prev.map(r => {
      if (r.id !== selected.id) return r;
      const next = { ...r, [key]: value };
      if (key === "title") next.name = value;
      if (key === "id") {
        next.tournamentId = value;
      }
      return next;
    }));
  };

  const saveSelected = () => {
    if (!selected || !window.PNXCmsFinalDesignBridge) return;

    const saved = window.PNXCmsFinalDesignBridge.saveTournament({
      ...selected,
      prize: pnxStep128NormalizePrizeText(selected.prize),
      winnerPrize: pnxStep128NormalizePrizeText(selected.winnerPrize),
      name: selected.title,
      tournamentId: selected.tournamentId || selected.id,
      published: selected.status !== "draft",
      source: selected.source || "cms-final-manage"
    });

    setNotice(`保存しました：${saved.title || saved.name}`);
    pnxStep128CmsActionToast(`保存しました：${saved.title || saved.name}`, "ok");
    loadRows();
  };

  const changeStatus = (id, status) => {
    if (!window.PNXCmsFinalDesignBridge) return;
    const target = rows.find(r => r.id === id);
    if (!target) return;

    const saved = window.PNXCmsFinalDesignBridge.saveTournament({
      ...target,
      status,
      published: status !== "draft",
      source: target.source || "cms-final-manage"
    });

    setRows(prev => prev.map(r => r.id === id ? { ...r, status, published: status !== "draft", updatedAt: saved.updatedAt } : r));
    setNotice(`公開状態を変更しました：${target.title} → ${statusLabel(status)}`);
    pnxStep128CmsActionToast(`公開状態を変更しました：${statusLabel(status)}`, "ok");
  };

  const removeSelected = () => {
    if (!selected || !window.PNXCmsFinalDesignBridge) return;
    const ok = window.confirm(`「${selected.title}」を削除しますか？`);
    if (!ok) return;

    window.PNXCmsFinalDesignBridge.removeTournament(selected.tournamentId || selected.id);
    setNotice(`削除しました：${selected.title}`);
    setSelectedId("");
    loadRows();
  };

  const createNew = () => {
    if (!window.PNXCmsFinalDesignBridge) return;

    const item = window.PNXCmsFinalDesignBridge.saveTournament({
      title: "新規大会",
      category: "未分類",
      startDate: "",
      endDate: "",
      venue: "",
      status: "draft",
      published: false,
      source: "cms-final-manual"
    });

    setNotice("新規大会を下書きで作成しました。");
    loadRows();
    setTimeout(() => setSelectedId(item.id || item.tournamentId), 120);
  };

  const publishToApp = (event) => {
    pnxStep129StopActionEvent(event);
    if (!window.PNXCmsFinalDesignBridge) return;
    const payload = pnxStep129SafePublishToApp(null, { message:"本体反映しました" });
    const n = payload.publicTournamentCount != null
      ? payload.publicTournamentCount
      : (payload.tournaments || []).filter(t => t.status !== "draft").length;
    setNotice(`反映しました：公開対象 ${n}件。CMS画面はそのままです。`);
    pnxStep128CmsActionToast(`本体へ再反映しました：${n}件`, "ok");
  };

  return (
    <section className="card pnx-step66-card">
      <header className="card__head">
        <h2 className="card__title">登録済み大会管理</h2>
        <I.Info size={13} className="card__hint"/>
        <div className="card__head-r">
          <button className="btn btn--ghost btn--sm" onClick={loadRows}>
            <I.Refresh size={13}/> 再読み込み
          </button>
          <button className="btn btn--ghost btn--sm" onClick={createNew}>
            <I.Plus size={13}/> 新規大会
          </button>
          <button className="btn btn--primary btn--sm" onClick={(e) => publishToApp(e)}>
            本体へ再反映
          </button>
        </div>
      </header>

      <div className="card__body">
        <div className="pnx-step66-notice">{notice}</div>

        <div className="pnx-step66-stats">
          <div><span>全体</span><strong>{stats.total}</strong></div>
          <div><span>公開対象</span><strong>{stats.public}</strong></div>
          <div><span>下書き</span><strong>{stats.draft}</strong></div>
          <div><span>募集中</span><strong>{stats.open}</strong></div>
          <div><span>締切</span><strong>{stats.closed}</strong></div>
          <div><span>開催中</span><strong>{stats.ongoing}</strong></div>
          <div><span>終了</span><strong>{stats.finished}</strong></div>
        </div>

        <div className="pnx-step66-tools">
          <input
            className="input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="大会名・会場・カテゴリで検索"
          />
          <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">すべて</option>
            {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="pnx-step66-layout">
          <div className="pnx-step66-list">
            {!filtered.length && <div className="pnx-step66-empty">登録済み大会がありません。</div>}

            {filtered.map(row => (
              <button
                key={row.id}
                className={`pnx-step66-row ${selected && selected.id === row.id ? "is-active" : ""}`}
                onClick={() => setSelectedId(row.id)}
              >
                <span className={`pnx-step66-status is-${row.status || "draft"}`}>{statusLabel(row.status)}</span>
                <strong>{row.title}</strong>
                <small>{row.startDate || "日付未設定"} / {row.venue || "会場未設定"}</small>
                {row.status === "draft" && <em>本体非表示</em>}
              </button>
            ))}
          </div>

          <div className="pnx-step66-editor">
            {!selected && (
              <div className="pnx-step66-empty">左の一覧から大会を選択してください。</div>
            )}

            {selected && (
              <>
                <div className="pnx-step66-editor__top">
                  <div>
                    <strong>{selected.title}</strong>
                    <span>{selected.status === "draft" ? "下書きのため本体には表示されません" : "本体アプリ公開対象です"}</span>
                  </div>
                  <select className="select" value={selected.status} onChange={e => changeStatus(selected.id, e.target.value)}>
                    {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                <div className="pnx-step66-form">
                  <label>大会名<input className="input" value={selected.title} onChange={e => updateLocalSelected("title", e.target.value)}/></label>
                  <label>カテゴリ<input className="input" value={selected.category} onChange={e => updateLocalSelected("category", e.target.value)}/></label>
                  <label>性別<input className="input" value={selected.gender} onChange={e => updateLocalSelected("gender", e.target.value)}/></label>
                  <label>開始日<input className="input mono" value={selected.startDate} onChange={e => updateLocalSelected("startDate", e.target.value)}/></label>
                  <label>終了日<input className="input mono" value={selected.endDate} onChange={e => updateLocalSelected("endDate", e.target.value)}/></label>
                  <label>都道府県<input className="input" value={selected.prefecture} onChange={e => updateLocalSelected("prefecture", e.target.value)}/></label>
                  <label>エリア<input className="input" value={selected.area} onChange={e => updateLocalSelected("area", e.target.value)}/></label>
                  <label>会場<input className="input" value={selected.venue} onChange={e => updateLocalSelected("venue", e.target.value)}/></label>
                  <label>締切<input className="input mono" value={selected.entryDeadline} onChange={e => updateLocalSelected("entryDeadline", e.target.value)}/></label>
                  <label>参加費<input className="input" value={selected.entryFee} onChange={e => updateLocalSelected("entryFee", e.target.value)}/></label>
                  <label>賞金総額<input className="input" value={selected.prize} onChange={e => updateLocalSelected("prize", e.target.value)}/></label>
                  <label>優勝賞金<input className="input" value={selected.winnerPrize} onChange={e => updateLocalSelected("winnerPrize", e.target.value)}/></label>
                  <label>募集人数<input className="input" value={selected.capacity} onChange={e => updateLocalSelected("capacity", e.target.value)}/></label>
                  <label>主催<input className="input" value={selected.organizer} onChange={e => updateLocalSelected("organizer", e.target.value)}/></label>
                  <label className="wide">出場資格<input className="input" value={selected.eligibility} onChange={e => updateLocalSelected("eligibility", e.target.value)}/></label>
                  <label className="wide">エントリーURL<input className="input mono" value={selected.entryUrl} onChange={e => updateLocalSelected("entryUrl", e.target.value)}/></label>
                </div>

                {!!selected.warnings.length && (
                  <div className="pnx-step66-warnings">
                    {selected.warnings.map((w, i) => <span key={i}>⚠ {w}</span>)}
                  </div>
                )}

                <div className="pnx-step66-editor__actions">
                  <button className="btn btn--danger-ghost btn--sm" onClick={removeSelected}>
                    <I.Trash size={13}/> 削除
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => changeStatus(selected.id, "draft")}>
                    下書きに戻す
                  </button>
                  <button className="btn btn--primary btn--sm" onClick={saveSelected}>
                    <I.Save size={13}/> 保存
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


/* ============================================================
   STEP67: CMS Tournament Validation Panel
   重複・不足項目・公開前チェック
   ============================================================ */
function CmsTournamentValidationPanel() {
  const [report, setReport] = useState(null);
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("公開前チェックを実行してください。");

  const runCheck = () => {
    if (!window.PNXCmsFinalDesignBridge || !window.PNXCmsFinalDesignBridge.validateAllTournaments) {
      setNotice("Bridgeの検証機能が未接続です。");
      return;
    }

    const r = window.PNXCmsFinalDesignBridge.validateAllTournaments();
    setReport(r);
    setNotice(`チェック完了：公開可能 ${r.publishable}件 / ブロック ${r.blocked}件 / 下書き ${r.draft}件`);
  };

  useEffect(() => {
    const timer = setTimeout(runCheck, 600);
    const reload = () => setTimeout(runCheck, 160);
    window.addEventListener("pnx:cms-final:tournament-saved", reload);
    window.addEventListener("pnx:cms-final:tournament-removed", reload);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pnx:cms-final:tournament-saved", reload);
      window.removeEventListener("pnx:cms-final:tournament-removed", reload);
    };
  }, []);

  const fixToDraft = (id) => {
    if (!window.PNXCmsFinalDesignBridge) return;
    window.PNXCmsFinalDesignBridge.updateTournamentStatus(id, "draft");
    setNotice("問題のある大会を下書きに戻しました。");
    setTimeout(runCheck, 160);
  };

  const publishToApp = (event) => {
    pnxStep129StopActionEvent(event);
    if (!window.PNXCmsFinalDesignBridge) return;
    const payload = pnxStep129SafePublishToApp(null, { message:"本体反映しました" });
    const blocked = payload.blockedTournamentCount || 0;
    const publicCount = payload.publicTournamentCount || 0;
    setNotice(`反映しました：公開 ${publicCount}件 / ブロック ${blocked}件。CMS画面はそのままです。`);
    pnxStep128CmsActionToast(`反映しました：公開 ${publicCount}件`, "ok");
    setTimeout(runCheck, 160);
  };

  const rows = report ? report.results.filter(r => {
    if (filter === "all") return true;
    if (filter === "blocked") return r.hasBlockingIssue;
    if (filter === "warning") return r.warningCount > 0;
    if (filter === "draft") return !r.publicTarget;
    if (filter === "publishable") return r.publishable;
    return true;
  }) : [];

  return (
    <section className="card pnx-step67-card">
      <header className="card__head">
        <h2 className="card__title">公開前チェック・重複チェック</h2>
        <I.Info size={13} className="card__hint"/>
        <div className="card__head-r">
          <button className="btn btn--ghost btn--sm" onClick={runCheck}>
            <I.Refresh size={13}/> チェック実行
          </button>
          <button className="btn btn--primary btn--sm" onClick={(e) => publishToApp(e)}>
            チェック済みを本体へ反映
          </button>
        </div>
      </header>

      <div className="card__body">
        <div className="pnx-step67-notice">{notice}</div>

        {report && (
          <div className="pnx-step67-stats">
            <div><span>全体</span><strong>{report.total}</strong></div>
            <div><span>公開可能</span><strong className="ok">{report.publishable}</strong></div>
            <div><span>ブロック</span><strong className="ng">{report.blocked}</strong></div>
            <div><span>下書き</span><strong>{report.draft}</strong></div>
            <div><span>警告あり</span><strong className="warn">{report.warnings}</strong></div>
          </div>
        )}

        <div className="pnx-step67-filter">
          <select className="select" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">すべて</option>
            <option value="blocked">公開ブロック</option>
            <option value="warning">警告あり</option>
            <option value="draft">下書き</option>
            <option value="publishable">公開可能</option>
          </select>
        </div>

        {!report && (
          <div className="pnx-step67-empty">
            登録済み大会の不足項目・日付矛盾・重複候補をチェックします。
          </div>
        )}

        {report && !rows.length && (
          <div className="pnx-step67-empty">
            この条件に該当する大会はありません。
          </div>
        )}

        <div className="pnx-step67-list">
          {rows.map(r => (
            <article className={`pnx-step67-row ${r.hasBlockingIssue ? "is-blocked" : r.publishable ? "is-ok" : ""}`} key={r.id}>
              <div className="pnx-step67-row__top">
                <div>
                  <strong>{r.title}</strong>
                  <span>{r.publicTarget ? (r.publishable ? "本体公開可能" : "公開前に修正が必要") : "下書き：本体非表示"}</span>
                </div>
                <div className="pnx-step67-badges">
                  {r.errorCount > 0 && <b className="ng">エラー {r.errorCount}</b>}
                  {r.warningCount > 0 && <b className="warn">警告 {r.warningCount}</b>}
                  {r.publishable && <b className="ok">公開OK</b>}
                </div>
              </div>

              {!!r.issues.length && (
                <div className="pnx-step67-issues">
                  {r.issues.map((issue, i) => (
                    <span key={i} className={issue.level === "error" ? "is-error" : "is-warning"}>
                      {issue.level === "error" ? "✕" : "⚠"} {issue.message}
                    </span>
                  ))}
                </div>
              )}

              {r.hasBlockingIssue && (
                <div className="pnx-step67-actions">
                  <button className="btn btn--ghost btn--xs" onClick={() => fixToDraft(r.id)}>
                    下書きに戻す
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ============================================================
   STEP68: CMS → Search Sync Stability Panel
   CMS公開大会が本体試合検索へ反映できるか確認
   ============================================================ */

function pnxStep135NormalizeSyncReport(report) {
  const r = report || {};
  const rawMeta = r.meta && typeof r.meta === "object" ? r.meta : {};
  const ids = Array.isArray(rawMeta.ids) ? rawMeta.ids : [];
  const hash = String(rawMeta.hash || "");

  return {
    checkedAt: r.checkedAt || new Date().toISOString(),
    totalCms: Number(r.totalCms || 0),
    publicForSearch: Number(r.publicForSearch || r.publicTournamentCount || 0),
    draftOrBlocked: Number(r.draftOrBlocked || 0),
    validation: r.validation || null,
    meta: Object.assign({}, rawMeta, {
      ids,
      hash,
      createdAt: rawMeta.createdAt || rawMeta.updatedAt || null
    })
  };
}

function CmsSearchSyncStabilityPanel() {
  const [report, setReport] = useState(null);
  const [notice, setNotice] = useState("本体試合検索への反映状態を確認できます。");

  const runCheck = () => {
    if (!window.PNXCmsFinalDesignBridge || !window.PNXCmsFinalDesignBridge.checkSearchSnapshot) {
      setNotice("Bridgeの同期チェック機能が未接続です。");
      return;
    }

    const result = pnxStep135NormalizeSyncReport(window.PNXCmsFinalDesignBridge.checkSearchSnapshot());
    setReport(result);
    setNotice(`検索用スナップショット作成済み：公開対象 ${result.publicForSearch}件 / 非公開・ブロック ${result.draftOrBlocked}件`);
  };

  const publish = (event) => {
    pnxStep129StopActionEvent(event);
    if (!window.PNXCmsFinalDesignBridge) return;
    const payload = pnxStep129SafePublishToApp(null, { message:"本体反映しました" });
    const meta = payload.searchSnapshotMeta || (window.PNXCmsFinalDesignBridge.getSearchSnapshotMeta && window.PNXCmsFinalDesignBridge.getSearchSnapshotMeta());
    const totalCms = Array.isArray(window.PNXCmsFinalDesignBridge.getTournaments && window.PNXCmsFinalDesignBridge.getTournaments())
      ? window.PNXCmsFinalDesignBridge.getTournaments().length
      : 0;
    setReport(pnxStep135NormalizeSyncReport({
      checkedAt: new Date().toISOString(),
      totalCms,
      publicForSearch: payload.publicTournamentCount || 0,
      draftOrBlocked: Math.max(0, totalCms - (payload.publicTournamentCount || 0)),
      validation: payload.validation || null,
      meta
    }));
    setNotice(`反映しました：公開対象 ${payload.publicTournamentCount || 0}件。CMS画面はそのままです。`);
    pnxStep128CmsActionToast(`反映しました：公開対象 ${payload.publicTournamentCount || 0}件`, "ok");
  };

  useEffect(() => {
    const timer = setTimeout(runCheck, 900);
    return () => clearTimeout(timer);
  }, []);

  const safeReport = pnxStep135NormalizeSyncReport(report || {});
  const safeMeta = safeReport.meta || {};
  const safeIds = Array.isArray(safeMeta.ids) ? safeMeta.ids : [];
  const safeHash = String(safeMeta.hash || "");

  return (
    <section className="card pnx-step68-card">
      <header className="card__head">
        <h2 className="card__title">本体試合検索 反映チェック</h2>
        <I.Info size={13} className="card__hint"/>
        <div className="card__head-r">
          <button className="btn btn--ghost btn--sm" onClick={runCheck}>
            <I.Refresh size={13}/> 同期チェック
          </button>
          <button className="btn btn--primary btn--sm" onClick={(e) => publish(e)}>
            本体へ反映
          </button>
        </div>
      </header>
      <div className="card__body">
        <div className="pnx-step68-notice">{notice}</div>

        {report && (
          <>
            <div className="pnx-step68-stats">
              <div><span>CMS登録</span><strong>{report.totalCms}</strong></div>
              <div><span>検索表示対象</span><strong className="ok">{report.publicForSearch}</strong></div>
              <div><span>非公開/ブロック</span><strong className="warn">{report.draftOrBlocked}</strong></div>
              <div><span>同期ID</span><strong>{safeIds.length}</strong></div>
            </div>

            <div className="pnx-step68-meta">
              <strong>Search Snapshot</strong>
              <span>updated: {safeMeta.createdAt || "未作成"}</span>
              <span>hash: {safeHash ? safeHash.slice(0, 80) : "empty"}</span>
            </div>

            {report.validation && report.validation.blocked > 0 && (
              <div className="pnx-step68-warning">
                公開前チェックでブロック中の大会が {report.validation.blocked} 件あります。修正または下書きに戻してください。
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}


/* ============================================================
   STEP69: CMS Live Preview Real Data Helpers
   Bridge/localStorageの実データを右側iPhoneプレビューへ反映
   ============================================================ */
function pnxStep69ReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function pnxStep69NormalizePreviewData(fallbackBanner, fallbackCats, fallbackArticles) {
  const bridge = window.PNXCmsFinalDesignBridge;

  const featured = bridge && bridge.getFeaturedContents
    ? bridge.getFeaturedContents()
    : pnxStep69ReadJson("PNX_CMS_FEATURED_CONTENTS", []);

  const banners = pnxStep69ReadJson("PNX_CMS_BANNERS", []);
  const cats = bridge && bridge.getCategories
    ? bridge.getCategories()
    : pnxStep69ReadJson("PNX_CMS_CATEGORIES", []);

  const tournaments = pnxStep69ReadJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", []);
  const syncMeta = pnxStep69ReadJson("PNX_CMS_SEARCH_SYNC_META", null);

  const pickup = (
    (Array.isArray(banners) && banners.find(x => x && x.published !== false)) ||
    (Array.isArray(featured) && featured.find(x => x && (x.type === "pickup-banner" || x.type === "banner") && x.published !== false)) ||
    null
  );

  const articles = Array.isArray(featured)
    ? featured.filter(x => x && x.type === "article" && x.published !== false)
    : [];

  return {
    banner: pickup ? {
      title: pickup.title || fallbackBanner.title,
      subtitle: pickup.subtitle || fallbackBanner.subtitle,
      cta: pickup.cta || fallbackBanner.cta,
      link: pickup.link || fallbackBanner.link,
      published: pickup.published !== false
    } : fallbackBanner,
    cats: Array.isArray(cats) && cats.length ? cats : fallbackCats,
    articles: articles.length ? articles : fallbackArticles,
    tournaments: Array.isArray(tournaments) ? tournaments : [],
    syncMeta,
    updatedAt: new Date().toISOString()
  };
}


/* ============================================================
   STEP70: CMS Storage Settings Panel
   保存状態・バックアップ・復元・Firestore移行準備
   ============================================================ */
function CmsStorageSettingsPanel() {
  const [status, setStatus] = useState(null);
  const [notice, setNotice] = useState("CMS保存状態を確認できます。");
  const [importText, setImportText] = useState("");

  const refresh = () => {
    if (!window.PNXCmsFinalDesignBridge || !window.PNXCmsFinalDesignBridge.getStorageStatus) {
      setNotice("Storage Bridgeが未接続です。");
      return;
    }
    const s = window.PNXCmsFinalDesignBridge.getStorageStatus();
    setStatus(s);
    setNotice(`保存状態を確認しました：${s.rows.filter(r => r.exists).length} / ${s.rows.length} キー`);
  };

  useEffect(() => {
    const timer = setTimeout(refresh, 700);
    return () => clearTimeout(timer);
  }, []);

  const setMode = (mode) => {
    if (!window.PNXCmsFinalDesignBridge) return;
    const settings = window.PNXCmsFinalDesignBridge.setStorageMode(mode);
    setNotice(`保存モードを ${settings.mode} に変更しました。`);
    setTimeout(refresh, 120);
  };

  const downloadBackup = () => {
    if (!window.PNXCmsFinalDesignBridge || !window.PNXCmsFinalDesignBridge.downloadBackup) return;
    const backup = window.PNXCmsFinalDesignBridge.downloadBackup();
    setNotice(`バックアップを書き出しました：${Object.keys(backup.data || {}).length}キー`);
    setTimeout(refresh, 120);
  };

  const importBackup = () => {
    if (!window.PNXCmsFinalDesignBridge || !window.PNXCmsFinalDesignBridge.importBackup) return;
    try {
      const parsed = JSON.parse(importText);
      const result = window.PNXCmsFinalDesignBridge.importBackup(parsed, { overwrite:true });
      setNotice(`復元しました：${result.count}キー`);
      setImportText("");
      setTimeout(refresh, 160);
    } catch(e) {
      setNotice(`復元エラー：${e.message}`);
    }
  };

  const prepareFirestore = () => {
    if (!window.PNXCmsFinalDesignBridge || !window.PNXCmsFinalDesignBridge.prepareFirestoreMigration) return;
    const result = window.PNXCmsFinalDesignBridge.prepareFirestoreMigration();
    setNotice(`Firestore移行準備データを作成しました：${Object.keys(result.recommendedCollections).length} collections`);
    setTimeout(refresh, 120);
  };

  return (
    <section className="card pnx-step70-card">
      <header className="card__head">
        <h2 className="card__title">CMS保存基盤・バックアップ</h2>
        <I.Info size={13} className="card__hint"/>
        <div className="card__head-r">
          <button className="btn btn--ghost btn--sm" onClick={refresh}>
            <I.Refresh size={13}/> 再確認
          </button>
          <button className="btn btn--primary btn--sm" onClick={downloadBackup}>
            バックアップ書き出し
          </button>
        </div>
      </header>

      <div className="card__body">
        <div className="pnx-step70-notice">{notice}</div>

        {status && (
          <>
            <div className="pnx-step70-mode">
              <div>
                <strong>保存モード</strong>
                <span>現在：{status.mode}</span>
              </div>
              <div className="pnx-step70-mode__actions">
                <button className={`btn btn--sm ${status.mode === "local" ? "btn--primary" : "btn--ghost"}`} onClick={() => setMode("local")}>
                  Local
                </button>
                <button className={`btn btn--sm ${status.mode === "firestore" ? "btn--primary" : "btn--ghost"}`} onClick={() => setMode("firestore")}>
                  Firestore準備
                </button>
              </div>
            </div>

            <div className="pnx-step70-stats">
              <div><span>保存キー</span><strong>{status.rows.filter(r => r.exists).length}</strong></div>
              <div><span>総サイズ</span><strong>{Math.round(status.totalBytes / 1024)}KB</strong></div>
              <div><span>Firestore</span><strong className={status.firestoreReady ? "ok" : "warn"}>{status.firestoreReady ? "ready" : "prep"}</strong></div>
            </div>

            <div className="pnx-step70-table">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>キー</th>
                    <th>状態</th>
                    <th>件数</th>
                    <th>サイズ</th>
                  </tr>
                </thead>
                <tbody>
                  {status.rows.map(row => (
                    <tr key={row.key}>
                      <td><span className="mono">{row.key}</span></td>
                      <td>{row.exists ? <span className="chip chip--cat-1">保存あり</span> : <span className="chip">未作成</span>}</td>
                      <td>{row.count == null ? "-" : row.count}</td>
                      <td>{row.bytes} bytes</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="pnx-step70-grid">
          <div className="pnx-step70-box">
            <strong>バックアップ復元</strong>
            <span>書き出したJSONを貼り付けて復元します。</span>
            <textarea
              className="textarea pnx-step70-import"
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="pronexax-cms-backup-xxxx.json の中身を貼る"
            />
            <button className="btn btn--ghost btn--sm" onClick={importBackup}>
              復元する
            </button>
          </div>

          <div className="pnx-step70-box">
            <strong>Firestore移行準備</strong>
            <span>現在のlocalStorageデータをFirestore移行用に整理します。まだ本番接続はしません。</span>
            <button className="btn btn--primary btn--sm" onClick={prepareFirestore}>
              移行準備データを作成
            </button>
            <p>作成先：<code>PNX_CMS_FIRESTORE_MIGRATION_PREP</code></p>
          </div>
        </div>
      </div>
    </section>
  );
}


/* ============================================================
   STEP71: CMS Media Library Manager
   画像アップロード/URL登録/削除/素材一覧
   ============================================================ */
function CmsMediaLibraryManagerPanel() {
  const [assets, setAssets] = useState([]);
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("all");
  const [notice, setNotice] = useState("メディアライブラリを読み込み中...");
  const [urlInput, setUrlInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [folderInput, setFolderInput] = useState("banners");

  const folders = [
    { value: "all", label: "すべて" },
    { value: "banners", label: "バナー画像" },
    { value: "tournaments", label: "大会画像" },
    { value: "articles", label: "記事サムネイル" },
    { value: "icons", label: "アイコン" },
    { value: "ads", label: "広告画像" },
    { value: "general", label: "その他" },
  ];

  const loadAssets = () => {
    if (!window.PNXCmsFinalDesignBridge || !window.PNXCmsFinalDesignBridge.getMediaAssets) {
      setNotice("Media Bridgeが未接続です。");
      return;
    }

    const list = window.PNXCmsFinalDesignBridge.getMediaAssets();
    setAssets(list);
    setNotice(`${list.length}件のメディアを読み込みました。`);
  };

  useEffect(() => {
    const timer = setTimeout(loadAssets, 500);
    const onUpdate = () => setTimeout(loadAssets, 100);
    window.addEventListener("pnx:cms-final:media-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pnx:cms-final:media-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const readFileAsDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length || !window.PNXCmsFinalDesignBridge) return;

    let saved = 0;
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const dataUrl = await readFileAsDataUrl(file);
      window.PNXCmsFinalDesignBridge.saveMediaAsset({
        name: file.name,
        filename: file.name,
        folder: folderInput,
        kind: "image",
        dataUrl,
        url: dataUrl,
        mimeType: file.type,
        sizeBytes: file.size,
        source: "file-upload"
      });
      saved += 1;
    }

    event.target.value = "";
    setNotice(`${saved}件の画像をアップロード保存しました。`);
    loadAssets();
  };

  const saveUrlAsset = () => {
    if (!urlInput.trim() || !window.PNXCmsFinalDesignBridge) {
      setNotice("画像URLを入力してください。");
      return;
    }

    const asset = window.PNXCmsFinalDesignBridge.saveMediaAsset({
      name: nameInput || urlInput.split("/").pop() || "URL画像",
      filename: nameInput || urlInput.split("/").pop() || "URL画像",
      folder: folderInput,
      kind: "image",
      url: urlInput.trim(),
      dataUrl: "",
      source: "url"
    });

    setUrlInput("");
    setNameInput("");
    setNotice(`URL画像を保存しました：${asset.name}`);
    loadAssets();
  };

  const removeAsset = (asset) => {
    if (!window.PNXCmsFinalDesignBridge) return;
    const ok = window.confirm(`「${asset.name}」を削除しますか？`);
    if (!ok) return;
    window.PNXCmsFinalDesignBridge.removeMediaAsset(asset.id || asset.assetId);
    setNotice(`削除しました：${asset.name}`);
    loadAssets();
  };

  const copyUrl = async (asset) => {
    const value = asset.dataUrl || asset.url || "";
    try {
      await navigator.clipboard.writeText(value);
      setNotice("画像URL/DataURLをコピーしました。");
    } catch(e) {
      setNotice("コピーできませんでした。");
    }
  };

  const filtered = assets.filter(a => {
    if (folder !== "all" && a.folder !== folder) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const hay = [a.name, a.filename, a.alt, a.folder, a.usage, ...(a.tags || [])].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const stats = assets.reduce((acc, a) => {
    acc.total += 1;
    acc.bytes += Number(a.sizeBytes || 0);
    acc[a.folder || "general"] = (acc[a.folder || "general"] || 0) + 1;
    return acc;
  }, { total: 0, bytes: 0 });

  return (
    <section className="card pnx-step71-card">
      <header className="card__head">
        <h2 className="card__title">メディアライブラリ管理</h2>
        <I.Info size={13} className="card__hint"/>
        <div className="card__head-r">
          <button className="btn btn--ghost btn--sm" onClick={loadAssets}>
            <I.Refresh size={13}/> 再読み込み
          </button>
        </div>
      </header>

      <div className="card__body">
        <div className="pnx-step71-notice">{notice}</div>

        <div className="pnx-step71-stats">
          <div><span>総素材数</span><strong>{stats.total}</strong></div>
          <div><span>保存サイズ</span><strong>{Math.round(stats.bytes / 1024)}KB</strong></div>
          <div><span>バナー</span><strong>{stats.banners || 0}</strong></div>
          <div><span>大会画像</span><strong>{stats.tournaments || 0}</strong></div>
          <div><span>記事画像</span><strong>{stats.articles || 0}</strong></div>
        </div>

        <div className="pnx-step71-upload">
          <div className="pnx-step71-upload__box">
            <strong>画像ファイルをアップロード</strong>
            <span>バナー・大会画像・記事サムネイルをCMS内に保存します。</span>
            <div className="pnx-step71-upload__row">
              <select className="select" value={folderInput} onChange={e => setFolderInput(e.target.value)}>
                {folders.filter(f => f.value !== "all").map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              <label className="btn btn--primary btn--sm pnx-step71-filebtn">
                <I.Upload size={13}/> ファイル選択
                <input type="file" accept="image/*" multiple onChange={handleFiles}/>
              </label>
            </div>
          </div>

          <div className="pnx-step71-upload__box">
            <strong>画像URLを登録</strong>
            <span>外部画像URLや将来のStorage URLを素材として保存します。</span>
            <div className="pnx-step71-urlgrid">
              <input className="input" value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder="素材名"/>
              <input className="input mono" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://..."/>
              <button className="btn btn--ghost btn--sm" onClick={saveUrlAsset}>URL保存</button>
            </div>
          </div>
        </div>

        <div className="pnx-step71-tools">
          <input className="input" value={query} onChange={e => setQuery(e.target.value)} placeholder="素材名・用途で検索"/>
          <select className="select" value={folder} onChange={e => setFolder(e.target.value)}>
            {folders.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>

        {!filtered.length && (
          <div className="pnx-step71-empty">素材がありません。画像をアップロードまたはURL登録してください。</div>
        )}

        <div className="pnx-step71-grid">
          {filtered.map(asset => (
            <article className="pnx-step71-asset" key={asset.id || asset.assetId}>
              <div className="pnx-step71-thumb">
                {(asset.dataUrl || asset.url) ? (
                  <img src={asset.dataUrl || asset.url} alt={asset.alt || asset.name}/>
                ) : (
                  <Photo tone="slate"/>
                )}
              </div>
              <div className="pnx-step71-asset__body">
                <strong>{asset.name}</strong>
                <span>{asset.folder} / {asset.mimeType || asset.source || "image"}</span>
                <small>{asset.sizeBytes ? `${Math.round(asset.sizeBytes / 1024)}KB` : "URL素材"}</small>
              </div>
              <div className="pnx-step71-asset__actions">
                <button className="btn btn--ghost btn--xs" onClick={() => copyUrl(asset)}>コピー</button>
                <button className="btn btn--danger-ghost btn--xs" onClick={() => removeAsset(asset)}>削除</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ============================================================
   STEP72: CMS Media Binding Manager
   メディア素材をPICK UP・記事・大会・広告へ紐づけ
   ============================================================ */
function CmsMediaBindingPanel() {
  const [assets, setAssets] = useState([]);
  const [targets, setTargets] = useState(null);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [targetType, setTargetType] = useState("pickup");
  const [targetId, setTargetId] = useState("");
  const [tournamentImageField, setTournamentImageField] = useState("venueImageUrl");
  const [notice, setNotice] = useState("素材を選択して、反映先を選んでください。");

  const load = () => {
    if (!window.PNXCmsFinalDesignBridge) {
      setNotice("Bridge未接続です。");
      return;
    }

    const media = window.PNXCmsFinalDesignBridge.getMediaAssets ? window.PNXCmsFinalDesignBridge.getMediaAssets() : [];
    const bindingTargets = window.PNXCmsFinalDesignBridge.getMediaBindingTargets ? window.PNXCmsFinalDesignBridge.getMediaBindingTargets() : null;

    setAssets(media);
    setTargets(bindingTargets);

    if (!selectedAssetId && media[0]) setSelectedAssetId(media[0].id || media[0].assetId);
    setNotice(`素材 ${media.length}件を読み込みました。`);
  };

  useEffect(() => {
    const timer = setTimeout(load, 650);
    const onUpdate = () => setTimeout(load, 120);
    window.addEventListener("pnx:cms-final:media-updated", onUpdate);
    window.addEventListener("pnx:cms-final:media-bound", onUpdate);
    window.addEventListener("pnx:cms-final:tournament-saved", onUpdate);
    window.addEventListener("pnx:cms-final:featured-saved", onUpdate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pnx:cms-final:media-updated", onUpdate);
      window.removeEventListener("pnx:cms-final:media-bound", onUpdate);
      window.removeEventListener("pnx:cms-final:tournament-saved", onUpdate);
      window.removeEventListener("pnx:cms-final:featured-saved", onUpdate);
    };
  }, []);

  const selectedAsset = assets.find(a => String(a.id || a.assetId) === String(selectedAssetId));

  const currentOptions = (() => {
    if (!targets) return [];
    if (targetType === "pickup") return [{ id: "pickup_main", label: "PICK UPメインバナー" }];
    if (targetType === "featured") return (targets.featured || []).map(c => ({ id: c.id || c.contentId, label: c.title || "記事" }));
    if (targetType === "tournament") return (targets.tournaments || []).map(t => ({ id: t.id || t.tournamentId, label: `${t.title || t.name || "大会"} / ${t.startDate || ""}` }));
    if (targetType === "ad") return [{ id: "main_ad", label: "広告画像" }];
    return [];
  })();

  useEffect(() => {
    if (currentOptions.length && !currentOptions.some(o => String(o.id) === String(targetId))) {
      setTargetId(currentOptions[0].id);
    }
  }, [targetType, targets]);

  const bind = () => {
    if (!window.PNXCmsFinalDesignBridge || !selectedAsset) {
      setNotice("素材を選択してください。");
      return;
    }

    let result = null;
    if (targetType === "pickup") {
      result = window.PNXCmsFinalDesignBridge.bindMediaToPickup(selectedAssetId);
    } else if (targetType === "featured") {
      result = window.PNXCmsFinalDesignBridge.bindMediaToFeaturedContent(selectedAssetId, targetId);
    } else if (targetType === "tournament") {
      result = window.PNXCmsFinalDesignBridge.bindMediaToTournament(selectedAssetId, targetId, tournamentImageField);
      try { window.PNXCmsFinalDesignBridge.createSearchSnapshot && window.PNXCmsFinalDesignBridge.createSearchSnapshot(); } catch(e) {}
    } else if (targetType === "ad") {
      result = window.PNXCmsFinalDesignBridge.bindMediaToAd(selectedAssetId, targetId || "main_ad");
    }

    if (result) {
      setNotice(`紐づけ完了：${selectedAsset.name}`);
      try {
        window.PNXCmsFinalDesignBridge.createSearchSnapshot && window.PNXCmsFinalDesignBridge.createSearchSnapshot();
      } catch(e) {}
    } else {
      setNotice("紐づけできませんでした。対象を確認してください。");
    }
  };

  return (
    <section className="card pnx-step72-card">
      <header className="card__head">
        <h2 className="card__title">メディア素材の紐づけ</h2>
        <I.Info size={13} className="card__hint"/>
        <div className="card__head-r">
          <button className="btn btn--ghost btn--sm" onClick={load}>
            <I.Refresh size={13}/> 再読み込み
          </button>
          <button className="btn btn--primary btn--sm" onClick={bind}>
            選択素材を反映
          </button>
        </div>
      </header>

      <div className="card__body">
        <div className="pnx-step72-notice">{notice}</div>

        <div className="pnx-step72-layout">
          <div className="pnx-step72-assets">
            <div className="pnx-step72-title">1. 素材を選択</div>
            {!assets.length && <div className="pnx-step72-empty">メディアライブラリに素材がありません。</div>}
            {assets.map(asset => (
              <button
                key={asset.id || asset.assetId}
                className={`pnx-step72-asset ${String(selectedAssetId) === String(asset.id || asset.assetId) ? "is-active" : ""}`}
                onClick={() => setSelectedAssetId(asset.id || asset.assetId)}
              >
                <span className="pnx-step72-thumb">
                  {(asset.dataUrl || asset.url) ? <img src={asset.dataUrl || asset.url} alt={asset.alt || asset.name}/> : <Photo tone="slate"/>}
                </span>
                <span className="pnx-step72-asset__text">
                  <strong>{asset.name}</strong>
                  <small>{asset.folder || "general"}</small>
                </span>
              </button>
            ))}
          </div>

          <div className="pnx-step72-target">
            <div className="pnx-step72-title">2. 反映先を選択</div>

            <div className="pnx-step72-form">
              <label>
                反映先タイプ
                <select className="select" value={targetType} onChange={e => setTargetType(e.target.value)}>
                  <option value="pickup">PICK UPバナー</option>
                  <option value="featured">注目記事サムネイル</option>
                  <option value="tournament">大会画像</option>
                  <option value="ad">広告画像</option>
                </select>
              </label>

              <label>
                反映先
                <select className="select" value={targetId} onChange={e => setTargetId(e.target.value)}>
                  {currentOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </label>

              {targetType === "tournament" && (
                <label>
                  大会画像の種類
                  <select className="select" value={tournamentImageField} onChange={e => setTournamentImageField(e.target.value)}>
                    <option value="venueImageUrl">会場画像</option>
                    <option value="tournamentLogoUrl">大会ロゴ</option>
                    <option value="organizerLogoUrl">主催者ロゴ</option>
                  </select>
                </label>
              )}
            </div>

            <div className="pnx-step72-preview">
              <div className="pnx-step72-title">3. プレビュー</div>
              {selectedAsset ? (
                <div className="pnx-step72-previewcard">
                  <div className="pnx-step72-previewimg">
                    {(selectedAsset.dataUrl || selectedAsset.url) ? <img src={selectedAsset.dataUrl || selectedAsset.url} alt={selectedAsset.alt || selectedAsset.name}/> : <Photo tone="slate"/>}
                  </div>
                  <div>
                    <strong>{selectedAsset.name}</strong>
                    <span>{targetType === "pickup" ? "PICK UPバナーへ反映" : targetType === "featured" ? "注目記事へ反映" : targetType === "tournament" ? "大会画像へ反映" : "広告画像へ反映"}</span>
                  </div>
                </div>
              ) : (
                <div className="pnx-step72-empty">素材を選択してください。</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


/* ============================================================
   STEP75: CMS Sidebar Navigation Fix
   左サイドメニューを押した時に、反応していることが分かるように
   対応画面・未実装画面を正しく切り替える
   ============================================================ */
function pnxStep75GetPageMeta(activeNav) {
  const map = {
    dashboard: { type: "stub", title: "ダッシュボード", sub: "CMS全体の状態や利用状況を確認します。", stub: "ダッシュボードは今後、公開件数・更新履歴・利用状況を表示します。" },
    home: { type: "home", title: "ホーム（注目ページ）管理", sub: "アプリのホーム画面に表示されるコンテンツを管理します。" },
    match: { type: "match", title: "試合検索・大会登録管理", sub: "整理済み大会情報をClaude ConsoleでJSON化し、一括登録します。" },
    calendar: { type: "stub", title: "カレンダー管理", sub: "カレンダー表示・カテゴリ・イベント連携を管理します。", stub: "カレンダー管理は本体カレンダー連携が固まった後に実装します。" },
    tournament: { type: "match", title: "大会詳細・大会管理", sub: "大会情報の登録・編集・公開状態を管理します。" },
    news: { type: "home", title: "ニュース・記事管理", sub: "注目記事やニュースコンテンツを管理します。", forceTab: "articles" },
    lesson: { type: "stub", title: "レッスン動画管理", sub: "レッスン動画コンテンツを管理します。", stub: "レッスン動画の登録・並び替え・公開設定は今後実装します。" },
    notice: { type: "stub", title: "お知らせ管理", sub: "ユーザー向けのお知らせを管理します。", stub: "お知らせ配信・表示期間・通知連携を今後実装します。" },
    mypage: { type: "stub", title: "マイページ管理", sub: "マイページに表示する項目を管理します。", stub: "プロフィール・設定・導線管理は今後実装します。" },
    banner: { type: "home", title: "バナー管理", sub: "PICK UPやホームバナーを管理します。", forceTab: "pickup" },
    icon: { type: "stub", title: "アイコン管理", sub: "アプリアイコンやメニューアイコンを管理します。", stub: "アイコン管理はメディアライブラリ連携後に拡張します。" },
    color: { type: "stub", title: "カラー設定", sub: "アプリ内のテーマカラーを管理します。", stub: "カラー設定はデザイントークン管理として今後実装します。" },
    menu: { type: "stub", title: "メニュー設定", sub: "アプリ内メニューの表示・並び順を管理します。", stub: "メニュー設定は本体タブ構成確定後に実装します。" },
    text: { type: "stub", title: "テキスト管理", sub: "アプリ内の文言を管理します。", stub: "テキスト管理は多言語/文言CMSとして今後実装します。" },
    "media-all": { type: "media", title: "メディアライブラリ管理", sub: "画像・バナー・大会素材を管理します。" },
    ads: { type: "stub", title: "広告管理", sub: "広告バナーや掲載枠を管理します。", stub: "広告管理はメディア紐づけと配信設定を統合して今後実装します。" },
    segments: { type: "stub", title: "ユーザーセグメント", sub: "表示対象やユーザー分類を管理します。", stub: "ユーザーセグメントは認証/分析連携後に実装します。" },
    analytics: { type: "stub", title: "分析・レポート", sub: "閲覧数や登録数などを確認します。", stub: "分析・レポートはFirebase/Analytics連携後に実装します。" },
    settings: { type: "settings", title: "CMS設定・保存管理", sub: "CMSデータの保存状態、バックアップ、Firestore移行準備を管理します。" },
    staff: { type: "stub", title: "スタッフ管理", sub: "管理者や編集権限を管理します。", stub: "スタッフ管理は管理者ログイン/権限設計の後に実装します。" }
  };
  return map[activeNav] || { type: "stub", title: "CMSページ", sub: "選択中のメニューです。", stub: "このメニューは今後実装します。" };
}


/* ============================================================
   STEP76: CMS Route Placeholder
   未実装メニューでも中央画面が切り替わったことを明示する
   ============================================================ */
function CmsRoutePlaceholder({ nav }) {
  const labels = {
    dashboard: "ダッシュボード",
    calendar: "カレンダー",
    details: "大会詳細",
    news: "ニュース・記事",
    lesson: "レッスン動画",
    notice: "お知らせ",
    mypage: "マイページ",
    banner: "バナー管理",
    icons: "アイコン管理",
    colors: "カラー設定",
    menu: "メニュー設定",
    text: "テキスト管理",
  };
  const label = labels[nav] || nav;
  return (
    <section className="card pnx-step76-placeholder">
      <header className="card__head">
        <h2 className="card__title">{label}</h2>
        <I.Info size={13} className="card__hint"/>
      </header>
      <div className="card__body">
        <div className="pnx-step76-placeholder__box">
          <strong>{label} は準備中です</strong>
          <span>左メニューの切り替えは正常です。この機能は次のリリースで実装します。</span>
        </div>
      </div>
    </section>
  );
}

function App() {
  const [activeNav, setActiveNav] = useState("home");
  const [tab, setTab] = useState("pickup");
  const [device, setDevice] = useState("ios");
  const [bridgeStatus, setBridgeStatus] = useState("最終CMS Bridge 読み込み中");
  const [livePreviewData, setLivePreviewData] = useState(null);

  useEffect(() => {
    const handleForceNav = (event) => {
      const nav = event && event.detail && event.detail.nav;
      if (!nav) return;
      setActiveNav(nav);
      if (nav === "home") setTab("pickup");
      if (nav === "banner") setTab("pickup");
      if (nav === "news") setTab("articles");
      document.body.dataset.cmsActiveNav = nav;
    };

    window.addEventListener("pnx:cms:force-nav", handleForceNav);
    return () => window.removeEventListener("pnx:cms:force-nav", handleForceNav);
  }, []);


  const [banner, setBanner] = useState({
    title: "春の新作ウェア特集",
    subtitle: "2024年春夏の最新ゴルフウェアをチェックしよう",
    cta: "詳しく見る",
    link: "/special/spring-wear-2024",
    startDate: "2024 / 04 / 01",
    endDate: "2024 / 04 / 30",
    order: 1,
    audience: "all",
    published: true,
  });

  const [cats, setCats] = useState([
    { id: 1, name: "ウェア", iconKey: "wear", visible: true, order: 1 },
    { id: 2, name: "クラブ", iconKey: "club", visible: true, order: 2 },
    { id: 3, name: "ゴルフ場", iconKey: "course", visible: true, order: 3 },
    { id: 4, name: "レッスン動画", iconKey: "lesson", visible: true, order: 4 },
    { id: 5, name: "ニュース", iconKey: "news", visible: true, order: 5 },
  ]);

  const [articles, setArticles] = useState([
    {
      id: 1, tone: "deep", category: "club",
      title: "最新ドライバー徹底比較",
      excerpt: "人気の最新モデルを試打データとともに徹底比較しました",
      isNew: true, date: "2024.05.20", published: true,
    },
    {
      id: 2, tone: "tour", category: "course",
      title: "今週末に行きたいゴルフ場特集",
      excerpt: "アクセス抜群のおすすめゴルフ場を厳選してご紹介",
      isNew: true, date: "2024.05.18", published: true,
    },
    {
      id: 3, tone: "amber", category: "lesson",
      title: "プロが教えるアプローチの基本",
      excerpt: "アプローチの精度を上げる3つのポイントをプロが解説します",
      isNew: true, date: "2024.05.15", published: true,
    },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.PNXCmsFinalDesignBridge) {
        const s = window.PNXCmsFinalDesignBridge.status();
        setBridgeStatus(`Bridge接続済み · 注目 ${s.featured}件 / 大会 ${s.tournaments}件`);
      } else {
        setBridgeStatus("Bridge未接続");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const saveFeaturedToBridge = () => {
    if (!window.PNXCmsFinalDesignBridge) {
      setBridgeStatus("Bridge未接続：cms-final-design-bridge.jsを確認してください");
      return;
    }

    const pickup = window.PNXCmsFinalDesignBridge.saveBanner(pnxStep62BannerToFeatured(banner));
    const savedArticles = articles.map((row, index) =>
      window.PNXCmsFinalDesignBridge.saveFeaturedContent(pnxStep62ArticleToFeatured(row, index))
    );
    const savedCategories = window.PNXCmsFinalDesignBridge.saveCategories(cats);

    const s = window.PNXCmsFinalDesignBridge.status();
    setBridgeStatus(`保存完了 · PICK UP 1件 / 記事 ${savedArticles.length}件 / カテゴリ ${savedCategories.length}件`);
    setTimeout(reloadLivePreviewData, 120);
    return { pickup, savedArticles, savedCategories, status: s };
  };

  const publishFeaturedToApp = () => {
    if (!window.PNXCmsFinalDesignBridge) {
      setBridgeStatus("Bridge未接続：publishできません");
      return;
    }

    saveFeaturedToBridge();
    const payload = pnxStep129SafePublishToApp(null, { message:"本体反映しました" });
    setBridgeStatus(`本体反映イベント送信済み · featured ${payload.featured.length}件`);
    setTimeout(reloadLivePreviewData, 120);
    return payload;
  };

  const reloadLivePreviewData = () => {
    const data = pnxStep69NormalizePreviewData(banner, cats, articles);
    setLivePreviewData(data);
    return data;
  };

  useEffect(() => {
    const timer = setTimeout(reloadLivePreviewData, 500);
    const onAnyCmsUpdate = () => setTimeout(reloadLivePreviewData, 120);

    window.addEventListener("pnx:cms-final:featured-saved", onAnyCmsUpdate);
    window.addEventListener("pnx:cms-final:categories-saved", onAnyCmsUpdate);
    window.addEventListener("PNX_CMS_SEARCH_SNAPSHOT_UPDATED", onAnyCmsUpdate);
    window.addEventListener("PNX_CMS_FINAL_SEARCH_SYNC_PUBLISHED", onAnyCmsUpdate);
    window.addEventListener("storage", onAnyCmsUpdate);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("pnx:cms-final:featured-saved", onAnyCmsUpdate);
      window.removeEventListener("pnx:cms-final:categories-saved", onAnyCmsUpdate);
      window.removeEventListener("PNX_CMS_SEARCH_SNAPSHOT_UPDATED", onAnyCmsUpdate);
      window.removeEventListener("PNX_CMS_FINAL_SEARCH_SYNC_PUBLISHED", onAnyCmsUpdate);
      window.removeEventListener("storage", onAnyCmsUpdate);
    };
  }, [banner, cats, articles]);

  const previewBanner = livePreviewData && livePreviewData.banner ? livePreviewData.banner : banner;
  const previewCats = livePreviewData && livePreviewData.cats && livePreviewData.cats.length ? livePreviewData.cats : cats;
  const previewArticles = livePreviewData && livePreviewData.articles && livePreviewData.articles.length ? livePreviewData.articles : articles;
  const previewTournaments = livePreviewData && livePreviewData.tournaments ? livePreviewData.tournaments : [];
  const previewSyncMeta = livePreviewData ? livePreviewData.syncMeta : null;

  const folders = [
    { name: "バナー画像", count: 45 },
    { name: "アイコン", count: 120 },
    { name: "大会画像", count: 230 },
    { name: "記事サムネイル", count: 342 },
    { name: "広告画像", count: 78 },
    { name: "動画サムネイル", count: 95 },
  ];

  const addCategory = () => {
    setCats(c => [...c, {
      id: Date.now(), name: "新カテゴリ", iconKey: "news",
      visible: true, order: c.length + 1,
    }]);
  };

  const handleNavChange = (key) => {
    const meta = pnxStep75GetPageMeta(key);
    setActiveNav(key);
    document.body.dataset.cmsActiveNav = key;
    if (meta.forceTab) setTab(meta.forceTab);
    if (key === "home" || key === "banner") setTab("pickup");
    if (key === "news") setTab("articles");
  };

  const pageMeta = pnxStep75GetPageMeta(activeNav);
  const showHomeContent = pageMeta.type === "home";
  const showMatchContent = pageMeta.type === "match";
  const showSettingsContent = pageMeta.type === "settings";
  const showMediaContent = pageMeta.type === "media";
  const showStubContent = pageMeta.type === "stub";

  return (
    <div className="app">
      <Sidebar active={activeNav} onChange={handleNavChange}/>

      <div className="main">
        <Topbar/>
        <div className="main__inner">
          <h1 className="page-h">{pageMeta.title}</h1>
          <p className="page-sub">{pageMeta.sub}</p>

          <div className="pnx-step76-route-indicator">
            <span>現在の画面</span>
            <strong>
              {activeNav === "home" ? "ホーム（注目ページ）" :
               activeNav === "match" ? "試合検索" :
               activeNav === "calendar" ? "カレンダー" :
               activeNav === "details" ? "大会詳細" :
               activeNav === "news" ? "ニュース・記事" :
               activeNav === "lesson" ? "レッスン動画" :
               activeNav === "notice" ? "お知らせ" :
               activeNav === "mypage" ? "マイページ" :
               activeNav === "media-all" ? "画像・動画一覧" :
               activeNav === "settings" ? "設定" :
               activeNav}
            </strong>
          </div>

          <div className="pnx-step62-bridgebar">
            <PNXStep62BridgeStatus message={bridgeStatus}/>
            <PNXStep62SaveButtons onSaveFeatured={saveFeaturedToBridge} onPublish={publishFeaturedToApp}/>
          </div>

          {showHomeContent && (
          <div className="tabs">
            {[
              { k: "pickup", t: "PICK UPバナー" },
              { k: "category", t: "カテゴリ" },
              { k: "articles", t: "注目記事" },
              { k: "bottom", t: "下部バナー" },
              { k: "display", t: "表示設定" },
            ].map(x => (
              <button key={x.k}
                      className={`tab ${tab === x.k ? "is-active" : ""}`}
                      onClick={() => setTab(x.k)}>
                {x.t}
              </button>
            ))}
          </div>
          )}

          {showMatchContent && (
            <>
              <ClaudeBulkTournamentPanel/>
              <CmsTournamentManagePanel/>
              <CmsTournamentValidationPanel/>
              <CmsSearchSyncStabilityPanel/>
            </>
          )}

          {showSettingsContent && <CmsStorageSettingsPanel/>}

          {showMediaContent && <>
            <CmsMediaLibraryManagerPanel/>
            <CmsMediaBindingPanel/>
          </>}

          {showStubContent && (
            <StubPanel title={pageMeta.title} hint={pageMeta.stub || "このメニューは今後実装します。"}/>
          )}

          {showHomeContent && tab === "pickup" && (
            <PickupBannerEditor banner={banner} onChange={setBanner} onSave={saveFeaturedToBridge}/>
          )}
          {showHomeContent && tab === "category" && (
            <CategoryCards cats={cats} onChange={setCats} onAdd={addCategory}/>
          )}
          {showHomeContent && tab === "articles" && (
            <ArticlesTable rows={articles} onChange={setArticles}/>
          )}
          {showHomeContent && tab === "bottom" && <StubPanel title="下部バナー" hint="ホーム画面下部のサブバナーをここで管理します。"/>}
          {showHomeContent && tab === "display" && <StubPanel title="表示設定" hint="セクション順序や表示密度などを切り替えます。"/>}

          {showHomeContent && tab === "pickup" && (
            <>
              <CategoryCards cats={cats} onChange={setCats} onAdd={addCategory}/>
              <ArticlesTable rows={articles} onChange={setArticles}/>
              <MediaLibrary folders={folders}/>
            </>
          )}

          {showHomeContent && (
          <div className="savebar">
            <span style={{ display:"flex", alignItems:"center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "#2cc070", boxShadow: "0 0 0 3px rgba(44,192,112,.18)" }}/>
              <span className="muted">変更は自動保存されました · 14:32</span>
            </span>
            <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button className="btn btn--ghost btn--sm" onClick={saveFeaturedToBridge}><I.Eye size={13}/> Bridge保存</button>
              <button className="btn btn--primary btn--sm" onClick={publishFeaturedToApp}><I.Save size={13}/> 公開する</button>
            </span>
          </div>
          )}
        </div>
      </div>


          {["dashboard","calendar","details","news","lesson","notice","mypage","banner","icons","colors","menu","text"].includes(activeNav) && (
            <CmsRoutePlaceholder nav={activeNav}/>
          )}

      <PhonePreviewRail banner={previewBanner} cats={previewCats}
                        articles={previewArticles}
                        tournaments={previewTournaments}
                        syncMeta={previewSyncMeta}
                        device={device} onDeviceChange={setDevice}/>
    </div>
  );
}

function StubPanel({ title, hint }) {
  return (
    <section className="card">
      <header className="card__head"><h2 className="card__title">{title}</h2></header>
      <div className="card__body" style={{ color: "var(--muted)", fontSize: 13 }}>
        {hint}
        <div style={{
          marginTop: 14, padding: 28, borderRadius: 12, border: "1px dashed var(--line-strong)",
          background: "var(--surface-2)", textAlign: "center", color: "var(--muted-2)"
        }}>
          このパネルは次のリリースで実装予定です。
        </div>
      </div>
    </section>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);


/* ============================================================
   STEP61: bridge ready hook
   最終CMSデザインのReact UIは触らず、Bridgeへ準備完了だけ通知
   ============================================================ */
(function(){
  window.addEventListener("pnx:cms-final:ready", function(e){
    try {
      window.__PNX_CMS_FINAL_READY_STATUS__ = e.detail && e.detail.status;
    } catch(err) {}
  });
})();


/* ============================================================
   STEP76: Sidebar Navigation Force Fix
   左メニュークリック時にReactのactiveNavへ必ず反映する
   ============================================================ */
(function(){
  if (window.__PNX_STEP76_SIDEBAR_NAV_FORCE_FIX__) return;
  window.__PNX_STEP76_SIDEBAR_NAV_FORCE_FIX__ = true;

  function normalize(text){
    return String(text || "").replace(/\s+/g, "").trim();
  }

  function navFromText(text){
    const t = normalize(text);
    if (!t) return "";
    if (t.includes("ダッシュボード")) return "dashboard";
    if (t.includes("ホーム")) return "home";
    if (t.includes("試合検索")) return "match";
    if (t.includes("カレンダー")) return "calendar";
    if (t.includes("大会詳細")) return "details";
    if (t.includes("ニュース") || t.includes("記事")) return "news";
    if (t.includes("レッスン動画")) return "lesson";
    if (t.includes("お知らせ")) return "notice";
    if (t.includes("マイページ")) return "mypage";
    if (t.includes("バナー管理")) return "banner";
    if (t.includes("アイコン管理")) return "icons";
    if (t.includes("カラー設定")) return "colors";
    if (t.includes("メニュー設定")) return "menu";
    if (t.includes("テキスト管理")) return "text";
    if (t.includes("画像") || t.includes("動画一覧") || t.includes("メディアライブラリ")) return "media-all";
    if (t.includes("設定") || t.includes("デザイン")) return "settings";
    return "";
  }

  function setActiveClass(target, nav){
    const sidebar = target.closest(".sidebar") || document.querySelector(".sidebar") || document.body;
    sidebar.querySelectorAll(".active, .is-active, [aria-current='page']").forEach(el => {
      el.classList.remove("active", "is-active");
      el.removeAttribute("aria-current");
    });

    const item = target.closest("button, a, li, .side-item, .nav-item, .menu-item, .sidebar__item, .snav__item") || target;
    item.classList.add("active", "is-active");
    item.setAttribute("aria-current", "page");

    document.body.dataset.cmsActiveNav = nav;
  }

  function forceNav(nav, target){
    if (!nav) return false;
    try { setActiveClass(target || document.body, nav); } catch(e) {}
    window.dispatchEvent(new CustomEvent("pnx:cms:force-nav", { detail:{ nav } }));
    return true;
  }

  document.addEventListener("click", function(e){
    const sidebar = e.target.closest && (
      e.target.closest(".sidebar") ||
      e.target.closest("aside") ||
      e.target.closest("[class*='side']") ||
      e.target.closest("[class*='nav']")
    );
    if (!sidebar) return;

    const clickable = e.target.closest("button, a, li, div, span");
    if (!clickable) return;

    const nav = navFromText(clickable.textContent);
    if (!nav) return;

    forceNav(nav, clickable);
  }, true);

  window.PNXForceCmsNav = function(nav){ return forceNav(nav, document.body); };
})();


/* ================================================================
   STEP126: CMS registration flow status helper
   CMS内だけの確認用。ページ切替/管理者/Authには触れない。
   ================================================================ */
(function(){
  window.PNXStep126CmsRegistrationStatus = function(){
    const bridge = window.PNXCmsFinalDesignBridge;
    const readJson = (key, fallback) => {
      try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
      catch(e) { return fallback; }
    };

    const tournaments = bridge && bridge.getTournaments ? bridge.getTournaments() : readJson("PNX_CMS_TOURNAMENTS", []);
    const publicItems = readJson("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH", []);
    const meta = readJson("PNX_CMS_SEARCH_SYNC_META", null);

    return {
      step: 126,
      checkedAt: new Date().toISOString(),
      cmsTournamentCount: Array.isArray(tournaments) ? tournaments.length : 0,
      publicSearchCount: Array.isArray(publicItems) ? publicItems.length : 0,
      meta,
      bridgeReady: !!bridge,
      stableBase: window.PNX_STABLE_BASE_STEP || null
    };
  };
})();


/* ================================================================
   STEP127: CMS date parser test helper
   ================================================================ */
(function(){
  window.PNXStep127TestDateParser = function(){
    const sample = `大会名：2026FJ-TOUR SKGr.カップ
カテゴリ：ミニツアー
男女：男子・女子
開催日：2026-06-01
終了日：2026-06-01
都道府県：千葉県
会場：南茂原カントリークラブ
主催：FJ-TOUR（要確認）
賞金総額：男子 772,000円 / 女子 720,000円
優勝賞金：男子 300,000円 / 女子 200,000円
参加費：不明
エントリー締切：不明
募集人数：男子 48名 / 女子 28名
出場資格：プロ・研修生・アマチュア（要確認）
申込方法：FJ-TOURサイトにログイン後エントリー
公式URL：https://fj-tour.jp/schedule.php
ステータス：draft
公開可否：公開可`;

    const parsed = typeof pnxStep81ParseOrganizedTournamentText === "function"
      ? pnxStep81ParseOrganizedTournamentText(sample)
      : [];

    return {
      step: 127,
      parsed,
      startDate: parsed[0] && parsed[0].startDate,
      endDate: parsed[0] && parsed[0].endDate,
      ok: !!(parsed[0] && parsed[0].startDate === "2026-06-01")
    };
  };
})();


/* ================================================================
   STEP128: prize formatter / action feedback test helper
   ================================================================ */
(function(){
  window.PNXStep128TestPrizeFormatter = function(){
    const samples = [
      "7200000円",
      "7,200,000円",
      "男子 772,000円 / 女子 720,000円",
      "男子 300,000円 / 女子 200,000円",
      "不明"
    ];

    return {
      step: 128,
      samples: samples.map(v => ({ input:v, output:pnxStep128NormalizePrizeText(v) })),
      expected: "7200000円 → 720万",
      ok: pnxStep128NormalizePrizeText("7200000円") === "720万"
    };
  };

  window.PNXStep128TestFeedback = function(message){
    pnxStep128CmsActionToast(message || "反映しました", "ok");
    return true;
  };
})();


/* ================================================================
   STEP129: safe publish status helper
   ================================================================ */
(function(){
  window.PNXStep129SafePublishStatus = function(){
    const last = window.__PNX_STEP129_LAST_SAFE_PUBLISH__ || null;
    let publicItems = [];
    let meta = null;
    try { publicItems = JSON.parse(localStorage.getItem("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH") || "[]"); } catch(e) {}
    try { meta = JSON.parse(localStorage.getItem("PNX_CMS_SEARCH_SYNC_META") || "null"); } catch(e) {}

    return {
      step: 129,
      last,
      publicSearchCount: Array.isArray(publicItems) ? publicItems.length : 0,
      meta,
      noNavigation: true,
      note: "本体反映はlocalStorageスナップショット作成のみ。親画面postMessageなし。"
    };
  };
})();

(function(){ window.PNXStep130CmsMarker = true; })();

(function(){ window.PNXStep131CmsMarker = true; })();

(function(){ window.PNXStep132CmsMarker = true; })();

(function(){ window.PNXStep133CmsMarker = true; })();


/* ================================================================
   STEP134: CMS no navigation status helper
   ================================================================ */
(function(){
  window.PNXStep134CmsNoNavigationStatus = function(){
    const bridgeStatus = typeof window.PNXStep134BridgeStatus === "function"
      ? window.PNXStep134BridgeStatus()
      : null;

    let publicItems = [];
    let meta = null;
    let hard = null;
    try { publicItems = JSON.parse(localStorage.getItem("PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH") || "[]"); } catch(e) {}
    try { meta = JSON.parse(localStorage.getItem("PNX_CMS_SEARCH_SYNC_META") || "null"); } catch(e) {}
    try { hard = JSON.parse(localStorage.getItem("PNX_STEP85_HARD_SEARCH_SNAPSHOT") || "null"); } catch(e) {}

    return {
      step: 134,
      bridgeStatus,
      publicSearchCount: Array.isArray(publicItems) ? publicItems.length : 0,
      meta,
      hardSyncExists: !!hard,
      noParentPostMessage: true,
      noNavigation: true,
      note: "本体へ反映を押してもCMS画面から移動しない設定です。"
    };
  };
})();


/* ================================================================
   STEP135: CMS search sync crash fix status helper
   ================================================================ */
(function(){
  window.PNXStep135CmsSearchSyncStatus = function(){
    const bridge = window.PNXCmsFinalDesignBridge;
    const meta = bridge && bridge.getSearchSnapshotMeta ? bridge.getSearchSnapshotMeta() : null;
    const check = bridge && bridge.checkSearchSnapshot ? bridge.checkSearchSnapshot() : null;

    return {
      step:135,
      meta,
      check,
      metaIdsSafe:Array.isArray(meta && meta.ids),
      metaHashSafe:typeof (meta && meta.hash) === "string",
      noParentPostMessage:true,
      note:"CmsSearchSyncStabilityPanelのmeta.ids.lengthエラーを防止しています。"
    };
  };
})();

(function(){ window.PNXStep136CmsMarker = true; })();

(function(){ window.PNXSideStepA1CmsMarker = true; })();

(function(){ window.PNXSideStepA2CmsMarker = true; })();

(function(){ window.PNXSideStepA3CmsMarker = true; })();

(function(){ window.PNXSideStepA4CmsMarker = true; })();

(function(){ window.PNXSideStepA4bCmsMarker = true; })();

(function(){ window.PNXStep137CmsMarker = true; })();

(function(){ window.PNXStep137bCmsMarker = true; })();

(function(){ window.PNXStep138CmsMarker = true; })();

(function(){ window.PNXStep138bCmsMarker = true; })();

(function(){ window.PNXStep138cCmsMarker = true; })();

(function(){ window.PNXStep138dCmsMarker = true; })();

(function(){ window.PNXStep138eCmsMarker = true; })();

(function(){ window.PNXStep138fCmsMarker = true; })();

(function(){ window.PNXStep138gCmsMarker = true; })();

(function(){ window.PNXStep138hCmsMarker = true; })();

(function(){ window.PNXStep138iCmsMarker = true; })();

(function(){ window.PNXStep139CmsMarker = true; })();

(function(){ window.PNXStep140CmsMarker = true; })();

(function(){ window.PNXStep141CmsMarker = true; })();

(function(){ window.PNXStep142CmsMarker = true; })();

(function(){ window.PNXStep143CmsMarker = true; })();

(function(){ window.PNXStep144CmsMarker = true; })();

(function(){ window.PNXStep145CmsMarker = true; })();

(function(){ window.PNXStep146CmsMarker = true; })();

(function(){ window.PNXStep147CmsMarker = true; })();

(function(){ window.PNXStep147bCmsMarker = true; })();

(function(){ window.PNXStep147cCmsMarker = true; })();

(function(){ window.PNXStep147dCmsMarker = true; })();

(function(){ window.PNXStep147eCmsMarker = true; })();

(function(){ window.PNXStep148CmsMarker = true; })();

(function(){ window.PNXStep148bCmsMarker = true; })();

(function(){ window.PNXStep148cCmsMarker = true; })();

(function(){ window.PNXStep148dCmsMarker = true; })();

(function(){ window.PNXStep149CmsMarker = true; })();

(function(){ window.PNXStep150CmsMarker = true; })();

(function(){ window.PNXStep150bCmsMarker = true; })();

(function(){ window.PNXStep150cCmsMarker = true; })();

(function(){ window.PNXStep150dCmsMarker = true; })();

(function(){ window.PNXStep150eCmsMarker = true; })();

(function(){ window.PNXStep150fCmsMarker = true; })();

(function(){ window.PNXStep151CmsMarker = true; })();

(function(){ window.PNXStep151bCmsMarker = true; })();

(function(){ window.PNXStep152CmsMarker = true; })();

(function(){ window.PNXStep152bCmsMarker = true; })();

(function(){ window.PNXStep152cCmsMarker = true; })();

(function(){ window.PNXStep152dCmsMarker = true; })();

(function(){ window.PNXStep152eCmsMarker = true; })();

(function(){ window.PNXStep153CmsMarker = true; })();

(function(){ window.PNXStep154CmsMarker = true; })();

(function(){ window.PNXStep154bCmsMarker = true; })();

(function(){ window.PNXStep155CmsMarker = true; })();

(function(){ window.PNXStep156CmsMarker = true; })();

(function(){ window.PNXStep157CmsMarker = true; })();

(function(){ window.PNXStep158CmsMarker = true; })();

(function(){ window.PNXStep159CmsMarker = true; })();

(function(){ window.PNXStep160CmsMarker = true; })();

(function(){ window.PNXStep161CmsMarker = true; })();

(function(){ window.PNXStep162CmsMarker = true; })();

(function(){ window.PNXStep163CmsMarker = true; })();

(function(){ window.PNXStep164CmsMarker = true; })();

(function(){ window.PNXStep165CmsMarker = true; })();

(function(){ window.PNXStep165bCmsMarker = true; })();

(function(){ window.PNXStep165cCmsMarker = true; })();

(function(){ window.PNXStep165dCmsMarker = true; })();

(function(){ window.PNXStep165eCmsMarker = true; })();

(function(){ window.PNXStep166CmsMarker = true; })();

(function(){ window.PNXStep166bCmsMarker = true; })();

(function(){ window.PNXStep167CmsMarker = true; })();

(function(){ window.PNXStep167bCmsMarker = true; })();

(function(){ window.PNXStep168CmsMarker = true; })();

(function(){ window.PNXStep168bCmsMarker = true; })();

(function(){ window.PNXStep168cCmsMarker = true; })();

(function(){ window.PNXStep169CmsMarker = true; })();

(function(){ window.PNXStep170CmsMarker = true; })();

(function(){ window.PNXStep170bCmsMarker = true; })();

(function(){ window.PNXStep170cCmsMarker = true; })();

(function(){ window.PNXStep171CmsMarker = true; })();

(function(){ window.PNXStep171bCmsMarker = true; })();

(function(){ window.PNXStep171cCmsMarker = true; })();

(function(){ window.PNXStep172CmsMarker = true; })();

(function(){ window.PNXStep173CmsMarker = true; })();

(function(){ window.PNXStep174CmsMarker = true; })();

(function(){ window.PNXStep175CmsMarker = true; })();

(function(){ window.PNXStep176CmsMarker = true; })();

(function(){ window.PNXStep177CmsMarker = true; })();

(function(){ window.PNXStep178CmsMarker = true; })();

(function(){ window.PNXStep178bCmsMarker = true; })();

(function(){ window.PNXStep178cCmsMarker = true; })();

(function(){ window.PNXStep178dCmsMarker = true; })();

(function(){ window.PNXStep178eCmsMarker = true; })();

(function(){ window.PNXStep178hCmsMarker = true; })();

(function(){ window.PNXStep178iCmsMarker = true; })();

(function(){ window.PNXStep178jCmsMarker = true; })();
