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

function Photo({ tone = "hero", label, children, style, className = "", fill = true }) {
  const baseStyle = fill
    ? { position: "relative", width: "100%", height: "100%", overflow: "hidden" }
    : { position: "absolute", inset: 0 };
  return (
    <div className={`photo ${className}`} style={{
      ...baseStyle,
      background: palettes[tone] || tone,
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

function PhoneHome({ banner, cats }) {
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
        <Photo tone="hero"/>
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
        {cats.filter(c => c.visible).slice(0, 4).map(c => {
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
    </div>
  );
}

function PhoneMatch() {
  return (
    <div className="ph">
      <div className="ph__h">
        <h2>試合検索</h2>
        <div className="ph__h-icons"><I.Filter size={16}/></div>
      </div>
      <div className="ph-tabs">
        <span className="ph-tab on">すべて</span>
        <span className="ph-tab">ミニツアー</span>
        <span className="ph-tab">オープン</span>
        <span className="ph-tab">予選会</span>
        <span className="ph-tab">その他</span>
      </div>

      <div className="ph-tour">
        <Photo tone="tour"/>
        <div className="ph-tour__overlay">
          <div className="ph-tour__title">QT 2024 特集</div>
          <div className="ph-tour__sub">出場者募集中！</div>
          <div className="ph-tour__bottom">募集中の試合</div>
          <div className="ph-tour__cta">エントリー <I.ChevronR size={9}/></div>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <div className="ph-art">
          <div className="ph-art__th"><Photo tone="amber"/></div>
          <div className="ph-art__body">
            <span className="ph-art__tag">2024.06.12</span>
            <div className="ph-art__title">関東ミニツアー 第3戦</div>
            <div className="ph-art__meta">大利根CC · 募集中</div>
          </div>
        </div>
        <div className="ph-art">
          <div className="ph-art__th"><Photo tone="deep"/></div>
          <div className="ph-art__body">
            <span className="ph-art__tag">2024.06.18</span>
            <div className="ph-art__title">PGSオープン予選</div>
            <div className="ph-art__meta">武蔵CC · 残り14枠</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneCalendar() {
  const days = [];
  for (let i = 0; i < 3; i++) days.push({ blank: true });
  for (let d = 1; d <= 31; d++) {
    days.push({
      d,
      has: [9, 15, 18, 22, 27].includes(d),
      today: d === 18,
    });
  }
  while (days.length % 7 !== 0) days.push({ blank: true });

  return (
    <div className="ph">
      <div className="ph__h">
        <h2>カレンダー</h2>
        <div className="ph__h-icons">
          <I.Filter size={16}/>
          <I.Gear size={16}/>
        </div>
      </div>
      <div className="ph-cal-month"><b>2024年 5月</b></div>
      <div className="ph-cal-grid">
        {["日","月","火","水","木","金","土"].map((d, i) => (
          <div key={d} className={`h ${i === 0 ? "sun" : ""} ${i === 6 ? "sat" : ""}`}>{d}</div>
        ))}
        {days.map((c, i) => c.blank
          ? <div key={i} className="d muted"></div>
          : <div key={i} className={`d ${c.has ? "has" : ""} ${c.today ? "today" : ""}`}>{c.d}</div>
        )}
      </div>

      <div className="ph-events">
        <div className="ph-event">
          <div className="ph-event__date">9</div>
          <div className="ph-event__bar"/>
          <div className="ph-event__body">
            <div className="ph-event__title">関東ミニツアー</div>
            <div className="ph-event__time">8:00 開始</div>
          </div>
        </div>
        <div className="ph-event evt-2">
          <div className="ph-event__date">15</div>
          <div className="ph-event__bar"/>
          <div className="ph-event__body">
            <div className="ph-event__title">PGSオープン予選</div>
            <div className="ph-event__time">7:30 集合</div>
          </div>
        </div>
        <div className="ph-event evt-3">
          <div className="ph-event__date">18</div>
          <div className="ph-event__bar"/>
          <div className="ph-event__body">
            <div className="ph-event__title">日本アマチュア選手権</div>
            <div className="ph-event__time">本日 · 9:00 ティー</div>
          </div>
        </div>
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

function PhonePreviewRail({ banner, cats, device, onDeviceChange }) {
  return (
    <aside className="rail">
      <div className="rail__head">
        <h3>アプリプレビュー</h3>
        <I.Info size={12} className="hint"/>
        <span className="pill"><span className="dot"/>ライブ</span>
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
            <PhoneHome banner={banner} cats={cats}/>
          </IphoneFrame>
        </div>

        <div className="preview-block">
          <div className="preview-block__head">
            <h4>試合検索ページ</h4>
            <button className="preview-block__refresh"><I.Refresh size={10}/> 更新</button>
          </div>
          <IphoneFrame>
            <PhoneMatch/>
          </IphoneFrame>
        </div>

        <div className="preview-block">
          <div className="preview-block__head">
            <h4>カレンダーページ</h4>
            <button className="preview-block__refresh"><I.Refresh size={10}/> 更新</button>
          </div>
          <IphoneFrame>
            <PhoneCalendar/>
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

const { useState } = React;

function App() {
  const [activeNav, setActiveNav] = useState("home");
  const [tab, setTab] = useState("pickup");
  const [device, setDevice] = useState("ios");

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

  return (
    <div className="app">
      <Sidebar active={activeNav} onChange={setActiveNav}/>

      <div className="main">
        <Topbar/>
        <div className="main__inner">
          <h1 className="page-h">ホーム（注目ページ）管理</h1>
          <p className="page-sub">アプリのホーム画面に表示されるコンテンツを管理します。</p>

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

          {tab === "pickup" && (
            <PickupBannerEditor banner={banner} onChange={setBanner}/>
          )}
          {tab === "category" && (
            <CategoryCards cats={cats} onChange={setCats} onAdd={addCategory}/>
          )}
          {tab === "articles" && (
            <ArticlesTable rows={articles} onChange={setArticles}/>
          )}
          {tab === "bottom" && <StubPanel title="下部バナー" hint="ホーム画面下部のサブバナーをここで管理します。"/>}
          {tab === "display" && <StubPanel title="表示設定" hint="セクション順序や表示密度などを切り替えます。"/>}

          {tab === "pickup" && (
            <>
              <CategoryCards cats={cats} onChange={setCats} onAdd={addCategory}/>
              <ArticlesTable rows={articles} onChange={setArticles}/>
              <MediaLibrary folders={folders}/>
            </>
          )}

          <div className="savebar">
            <span style={{ display:"flex", alignItems:"center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "#2cc070", boxShadow: "0 0 0 3px rgba(44,192,112,.18)" }}/>
              <span className="muted">変更は自動保存されました · 14:32</span>
            </span>
            <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button className="btn btn--ghost btn--sm"><I.Eye size={13}/> プレビュー</button>
              <button className="btn btn--primary btn--sm"><I.Save size={13}/> 公開する</button>
            </span>
          </div>
        </div>
      </div>

      <PhonePreviewRail banner={banner} cats={cats}
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
