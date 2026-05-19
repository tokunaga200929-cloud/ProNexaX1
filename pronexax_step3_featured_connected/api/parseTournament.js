/**
 * ProNexaX — /api/parseTournament  v3.0
 * Vercel Serverless Function
 *
 * 変更点 v3.0:
 *   - 複数大会の配列を返すように変更
 *   - MAX_TOKENS を 4000 に増量（複数大会対応）
 *   - TEXT_LIMIT を 12000 に増量（一覧ページ対応）
 *   - extractJson が配列・オブジェクト両方に対応
 */

const MODEL      = 'claude-sonnet-4-5-20251001';
const MAX_TOKENS = 4000;
const TIMEOUT_MS = 28000;
const TEXT_LIMIT = 12000;

// ── System Prompt（複数大会対応版） ──────────────────────────────────────
const SYSTEM_PROMPT = `あなたは日本のゴルフ大会情報を抽出する専門AIです。
ウェブページテキストから大会情報をJSONのみで返してください。
説明・前置き・コードブロック（\`\`\`）は絶対に含めないでください。純粋なJSONだけを返してください。

【重要】必ず配列形式で返してください。1大会でも複数大会でも必ず [ ] で囲んでください。

【出力形式】必ず配列。キー名・型を厳守。不明はnull。
[
  {
    "name": "大会の正式名称",
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD",
    "entryDeadline": "YYYY-MM-DD",
    "cancelDeadline": "YYYY-MM-DD",
    "place": "ゴルフ場の正式名称",
    "prefecture": "都道府県キー（下記参照）",
    "category": "カテゴリキー（下記参照）",
    "gender": "mens または womens",
    "region": "domestic または overseas",
    "entryFee": "参加費（例: 30,000円）",
    "prize": "賞金総額（例: 50万円）",
    "prizeWinner": "優勝賞金",
    "organizer": "主催者・主管団体名",
    "entryMethod": "エントリー方法",
    "qualification": "出場資格",
    "capacity": "定員（例: 144名）",
    "website": "公式サイトURL",
    "instagram": "Instagram URL",
    "entryUrl": "エントリーフォームURL",
    "memo": "特記事項",
    "confidence": 0.0から1.0の数値
  }
]

【複数大会ページの扱い】
・スケジュール一覧ページは全大会を抽出して配列に含める
・各大会の情報が部分的でも抽出できるものはすべて含める
・同じ大会が重複する場合は1件のみ
・情報が少ない大会も name と start があれば含める

【都道府県キー】
hokkaido, aomori, iwate, miyagi, akita, yamagata, fukushima,
ibaraki, tochigi, gunma, saitama, chiba, tokyo, kanagawa,
niigata, toyama, ishikawa, fukui, yamanashi, nagano, gifu,
shizuoka, aichi, mie, shiga, kyoto, osaka, hyogo, nara, wakayama,
tottori, shimane, okayama, hiroshima, yamaguchi,
tokushima, kagawa, ehime, kochi,
fukuoka, saga, nagasaki, kumamoto, oita, miyazaki, kagoshima, okinawa, overseas

【カテゴリキー】
男子公式: jgto, jpga, acn, senior, qt
女子公式: jlpga, stepup, qt_w
ミニツアー: atp_golf, fj_tour, future, doucus, speeder, pandc, karts, golf_memo
オープン: pref_open, local_open, famous_open, open
海外: pga, korn_ferry, dp_world, asian_tour, liv, overseas

【日付変換】必ずYYYY-MM-DDに変換する
・「2026年5月10日」→ "2026-05-10"
・「5月10日〜12日」→ start:"2026-05-10", end:"2026-05-12"（年は文脈推定）
・「5/10〜5/12」→ 上記と同様
・「2026.05.10」→ "2026-05-10"
・「令和8年5月10日」「R8.5.10」→ "2026-05-10"（令和+2018=西暦）
・年不明の場合は2026年を使用
・「〆切」「締め切り」「応募締切」→ entryDeadline
・「キャンセル期限」「辞退締切」→ cancelDeadline
・相対表現（「来月」等）→ null

【ゴルフ場名】優先パターン: ○○カントリークラブ / ○○CC / ○○GC / ○○ゴルフ倶楽部 / ○○ゴルフクラブ / ○○リンクス
複数コースの場合は「○○GC（○○コース）」形式。会場未記載はnull。

【都道府県推定】本文に明示があれば優先。ゴルフ場名からも推定可。
例: 名古屋GC→aichi / 千葉CC→chiba / ザ・サザンリンクス→okinawa / 茨城GC→ibaraki

【無視するテキスト】スポンサー紹介・ナビゲーション・フッター・SNS埋め込み・広告・PR・関連記事

【confidence計算】
name:+0.25, start:+0.20, place:+0.15, entryDeadline:+0.10,
category:+0.10, prize/entryFee:+0.10, prefecture:+0.05, organizer:+0.05
URLのみ推測時:-0.30 / テキスト500文字未満:-0.20 / 0.0〜1.0にクランプ

【カテゴリ判定】
JGTO・ジャパンゴルフツアー→jgto / JLPGA・女子プロ→jlpga / JPGA→jpga
シニアツアー・シニア選手権→senior / QT・クォリファイング・予選会→qt
ステップアップツアー→stepup / ○○県オープン・地区オープン→pref_open
PGAツアー・USオープン→pga / アジアンツアー→asian_tour
ATP GOLF TOUR・ATPゴルフ→atp_golf
`;

// ── ユーティリティ ────────────────────────────────────────────────────

function setCors(res, origin) {
  const allowed = process.env.ALLOWED_ORIGIN || '*';
  const ao = (allowed === '*' || origin === allowed) ? (origin || '*') : allowed;
  res.setHeader('Access-Control-Allow-Origin',  ao);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age',       '86400');
  res.setHeader('Cache-Control',                'no-store, no-cache, must-revalidate');
  res.setHeader('X-Content-Type-Options',       'nosniff');
}

function json(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(status).json(body);
}

// 配列・オブジェクト両対応のJSON抽出
function extractJson(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/^```(?:json)?\s*/im, '').replace(/```\s*$/m, '').trim();

  // まず配列として試みる
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') return [parsed];
  } catch { /* fall */ }

  // 配列パターンを探す
  const arrM = cleaned.match(/\[[\s\S]*\]/);
  if (arrM) {
    try {
      const parsed = JSON.parse(arrM[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* fall */ }
  }

  // オブジェクトパターンを探す
  const objM = cleaned.match(/\{[\s\S]*\}/);
  if (objM) {
    try {
      const parsed = JSON.parse(objM[0]);
      return [parsed];
    } catch { /* fall */ }
  }

  return null;
}

// ── メインハンドラ ───────────────────────────────────────────────────────
export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  setCors(res, origin);

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST')    { json(res, 405, { ok:false, error:'Method Not Allowed', code:'METHOD_NOT_ALLOWED' }); return; }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    console.error('[parseTournament] ANTHROPIC_API_KEY 未設定');
    json(res, 500, { ok:false, error:'サーバー設定エラー: APIキーが未設定です', code:'MISSING_API_KEY' });
    return;
  }

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); }
  catch { json(res, 400, { ok:false, error:'JSONパースエラー', code:'INVALID_JSON' }); return; }

  const pageText  = String(body.pageText  || '');
  const sourceUrl = String(body.sourceUrl || '');
  const hint      = String(body.hint      || '');

  if (!sourceUrl) { json(res, 400, { ok:false, error:'sourceUrlが必要です', code:'MISSING_URL' }); return; }

  const truncated = pageText.slice(0, TEXT_LIMIT) ||
    '（ページテキスト取得失敗。URLから大会情報を推測してください）';

  const userContent =
    `解析対象URL: ${sourceUrl}${hint ? '\n補足: ' + hint : ''}\n\n` +
    `--- ページテキスト ---\n${truncated}\n---`;

  let claudeRes;
  try {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

    claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: MAX_TOKENS,
        system:     SYSTEM_PROMPT,
        messages:   [{ role:'user', content:userContent }],
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
  } catch(e) {
    if (e.name === 'AbortError') { json(res, 504, { ok:false, error:'タイムアウト（28秒）。リトライしてください', code:'TIMEOUT' }); }
    else { console.error('[parseTournament] fetch:', e.message); json(res, 502, { ok:false, error:'Claude API接続失敗', code:'FETCH_ERROR' }); }
    return;
  }

  if (!claudeRes.ok) {
    let msg = `HTTP ${claudeRes.status}`, code = 'CLAUDE_ERROR';
    try { const e = await claudeRes.json(); msg = e?.error?.message || msg; } catch {}
    if (claudeRes.status === 429) { code='RATE_LIMIT';  msg='レート制限。しばらく待ってリトライしてください'; }
    if (claudeRes.status === 401) { code='UNAUTHORIZED'; msg='APIキーが無効です'; }
    if (claudeRes.status === 529) { code='OVERLOADED';  msg='Claude API混雑中。リトライしてください'; }
    console.error(`[parseTournament] Claude ${claudeRes.status}:`, msg);
    json(res, claudeRes.status >= 500 ? 502 : 400, { ok:false, error:msg, code });
    return;
  }

  let claudeData;
  try { claudeData = await claudeRes.json(); }
  catch { json(res, 502, { ok:false, error:'レスポンス解析失敗', code:'PARSE_ERROR' }); return; }

  const rawText = (claudeData?.content?.[0]?.text || '').trim();
  if (!rawText) { json(res, 502, { ok:false, error:'AIから空レスポンス', code:'EMPTY_RESPONSE' }); return; }

  const parsed = extractJson(rawText);
  if (!parsed || !Array.isArray(parsed)) {
    console.error('[parseTournament] JSON抽出失敗:', rawText.slice(0,300));
    json(res, 502, { ok:false, error:'AIレスポンスをJSONとして解析できませんでした', code:'JSON_PARSE_ERROR', raw:rawText.slice(0,200) });
    return;
  }

  console.info(`[parseTournament] 抽出成功: ${parsed.length}件`);
  json(res, 200, { ok:true, data:parsed, tournaments:parsed, count:parsed.length, model:MODEL, usage:claudeData?.usage||null });
}
