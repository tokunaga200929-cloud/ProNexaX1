/**
 * ProNexaX — /api/parseTournament  v2.0
 * Vercel Serverless Function
 *
 * ■ 環境変数（Vercel > Settings > Environment Variables）
 *   ANTHROPIC_API_KEY   sk-ant-...
 *   ALLOWED_ORIGIN      https://your-app.vercel.app  (省略時 *)
 *
 * ■ リクエスト
 *   POST /api/parseTournament
 *   { "pageText": "...", "sourceUrl": "https://...", "hint": "optional" }
 *
 * ■ レスポンス成功
 *   { "ok": true, "data": { ...fields... }, "model": "...", "usage": {...} }
 *
 * ■ レスポンスエラー
 *   { "ok": false, "error": "msg", "code": "CODE" }
 */

'use strict';

const MODEL      = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1400;
const TIMEOUT_MS = 30_000;
const TEXT_LIMIT = 7000;

// ================================================================
// System Prompt — ゴルフ大会専用・精度大幅強化版
// ================================================================
const SYSTEM_PROMPT = `あなたは日本のゴルフ大会情報を抽出する専門AIです。
以下のルールを厳守して、ウェブページテキストから大会情報をJSONのみで返してください。
説明・前置き・コードブロック（\`\`\`）は絶対に含めないでください。純粋なJSONだけを返してください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【出力形式】（キー名・型を厳守。不明はnull）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
  "prize": "賞金総額（例: 15,000万円）",
  "prizeWinner": "優勝賞金",
  "organizer": "主催者・主管団体名",
  "entryMethod": "エントリー方法",
  "qualification": "出場資格",
  "capacity": "定員（例: 144名）",
  "website": "公式サイトURL",
  "instagram": "Instagram URL（URL形式で）",
  "entryUrl": "エントリーフォームURL",
  "memo": "特記事項",
  "confidence": 0.0〜1.0の数値
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【都道府県キー一覧】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
hokkaido, aomori, iwate, miyagi, akita, yamagata, fukushima,
ibaraki, tochigi, gunma, saitama, chiba, tokyo, kanagawa,
niigata, toyama, ishikawa, fukui, yamanashi, nagano, gifu,
shizuoka, aichi, mie, shiga, kyoto, osaka, hyogo, nara, wakayama,
tottori, shimane, okayama, hiroshima, yamaguchi,
tokushima, kagawa, ehime, kochi,
fukuoka, saga, nagasaki, kumamoto, oita, miyazaki, kagoshima, okinawa,
overseas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【カテゴリキー一覧】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
男子プロ公式: jgto, jpga, acn, senior, qt
女子プロ公式: jlpga, stepup, qt_w
ミニツアー: atp_golf, fj_tour, future, doucus, speeder, pandc, karts, golf_memo
オープン: pref_open, local_open, famous_open, open
海外: pga, korn_ferry, dp_world, asian_tour, liv, overseas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【日付変換ルール】（必ずYYYY-MM-DDに変換）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
以下の形式を正確に変換すること：
・「2026年5月10日」→ "2026-05-10"
・「5月10日〜12日」→ start:"2026-05-10", end:"2026-05-12"（年は文脈推定）
・「5/10〜5/12」→ start:"2026-05-10", end:"2026-05-12"
・「2026.05.10」→ "2026-05-10"
・「令和8年5月10日」→ "2026-05-10"（令和年+2018=西暦）
・「R8.5.10」→ "2026-05-10"
・年が不明な場合は現在年（2026年）を使用
・「〆切」「締め切り」「応募締切」「エントリー〆」→ entryDeadline
・「キャンセル期限」「辞退締切」→ cancelDeadline
・相対表現（「来月」「今月」等）→ null

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【ゴルフ場名抽出ルール】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
以下のパターンを優先的に認識してplaceに入れる：
・「○○カントリークラブ」「○○CC」
・「○○ゴルフ倶楽部」「○○ゴルフクラブ」「○○GC」
・「○○ゴルフ場」「○○リンクス」「○○ゴルフリゾート」
・「○○コース」（ゴルフ場として特定できる場合）
複数コースある場合は「○○GC（○○コース）」形式で返す。
会場が未記載の場合は null（住所や地名をplaceに入れない）。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【都道府県推定ルール】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
本文に都道府県名が明示されている場合は必ずそれを使用。
ゴルフ場名から推定可能な場合も活用する（例）：
・「名古屋GC」「東建ホームメイト」→ aichi
・「千葉CC」「袖ヶ浦CC」→ chiba
・「茨城GC」→ ibaraki
・「ザ・サザンリンクス」→ okinawa
・「よみうりCC」「太平洋C宍戸」→ ibaraki
推定できない場合は null。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【無視すべきテキスト】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
以下は大会情報ではないため無視する：
・スポンサー紹介・協賛社リスト・「協賛：○○」
・サイトナビゲーション・メニュー・パンくず
・フッター・著作権表記・プライバシーポリシー・利用規約
・ニュース記事本文（大会情報でない）
・SNS埋め込みテキスト・ハッシュタグ・「#」で始まる行
・「関連記事」「おすすめ記事」「新着情報」セクション
・広告・PR・「Sponsored」表記
・「〇〇のプロフィール」「選手情報」（大会情報でない）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【confidence（信頼度）計算基準】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
基本スコア（累積）：
・name が抽出できた: +0.25
・start が抽出できた: +0.20
・place が抽出できた: +0.15
・entryDeadline が抽出できた: +0.10
・category が判定できた: +0.10
・prize または entryFee が抽出できた: +0.10
・prefecture が特定できた: +0.05
・organizer が抽出できた: +0.05

減点：
・URLのみで推測した場合: -0.30
・ページテキストが不足（500文字未満）: -0.20
・推測で埋めたフィールドがある場合: 該当フィールドごとに -0.05

上記の合計を 0.0〜1.0 にクランプして confidence とすること。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【カテゴリ判定の手がかり】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
・「JGTO」「ジャパンゴルフツアー機構」→ jgto（男子）
・「JLPGA」「女子プロ」「日本女子プロ」「JLPGA認定」→ jlpga（女子）
・「JPGA」「日本プロゴルフ協会」→ jpga（男子）
・「シニアツアー」「シニア選手権」「50歳以上」→ senior（男子）
・「クォリファイングトーナメント」「QT」「予選会」→ qt（男子）
・「クォリファイング」「QT」+「女子」→ qt_w
・「ステップアップツアー」→ stepup（女子）
・「○○県オープン」「○○県選手権」「地区オープン」→ pref_open
・「PGAツアー」「USオープン」「マスターズ」→ pga（海外）
・「アジアンツアー」→ asian_tour（海外）
・「ミニツアー」記載あり → mini系（URLから詳細判定）
・「アマチュア選手権」「学生選手権」→ open
`;

// ── CORS ──────────────────────────────────────────────────────────────
function corsHeaders(origin) {
  const allowed = process.env.ALLOWED_ORIGIN || '*';
  const ao = (allowed === '*' || origin === allowed) ? (origin || '*') : allowed;
  return {
    'Access-Control-Allow-Origin':  ao,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age':       '86400',
  };
}

// ── JSON 抽出（コードブロック除去 + 正規表現フォールバック）──────────────
function extractJson(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/^```(?:json)?\s*/im, '').replace(/```\s*$/m, '').trim();
  try { return JSON.parse(cleaned); } catch { /* fall */ }
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch { /* fall */ } }
  return null;
}

// ── メインハンドラ ────────────────────────────────────────────────────
export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const cors   = corsHeaders(origin);

  // プリフライト
  if (req.method === 'OPTIONS') return res.status(204).set(cors).end();
  if (req.method !== 'POST')    return res.status(405).set(cors).json({ ok:false, error:'Method Not Allowed', code:'METHOD_NOT_ALLOWED' });

  // APIキー確認
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    console.error('[parseTournament] ANTHROPIC_API_KEY 未設定');
    return res.status(500).set(cors).json({ ok:false, error:'サーバー設定エラー: APIキーが未設定です', code:'MISSING_API_KEY' });
  }

  // ボディ検証
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).set(cors).json({ ok:false, error:'JSONパースエラー', code:'INVALID_JSON' }); }

  const { pageText='', sourceUrl='', hint='' } = body || {};
  if (!sourceUrl) return res.status(400).set(cors).json({ ok:false, error:'sourceUrlが必要です', code:'MISSING_URL' });

  const truncated = pageText.slice(0, TEXT_LIMIT) ||
    '（ページテキスト取得失敗。URLから大会情報を推測してください）';
  const hintLine = hint ? `\n補足情報: ${hint}` : '';

  const userContent =
    `解析対象URL: ${sourceUrl}${hintLine}\n\n` +
    `--- ページテキスト ---\n${truncated}\n---`;

  // ── Claude API 呼び出し ──
  let claudeRes;
  try {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

    claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
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
    if (e.name === 'AbortError') return res.status(504).set(cors).json({ ok:false, error:'Claude APIタイムアウト（30秒）', code:'TIMEOUT' });
    console.error('[parseTournament] fetch error:', e.message);
    return res.status(502).set(cors).json({ ok:false, error:'Claude APIへの接続失敗', code:'FETCH_ERROR' });
  }

  // HTTPエラー処理
  if (!claudeRes.ok) {
    let msg = `HTTP ${claudeRes.status}`, code = 'CLAUDE_ERROR';
    try { const e=await claudeRes.json(); msg=e?.error?.message||msg; } catch {}
    if (claudeRes.status===429) { code='RATE_LIMIT';    msg='レート制限。しばらく待ってからリトライしてください'; }
    else if (claudeRes.status===401) { code='UNAUTHORIZED'; msg='APIキーが無効です'; }
    else if (claudeRes.status===529) { code='OVERLOADED';   msg='Claude API混雑中。リトライしてください'; }
    console.error(`[parseTournament] Claude ${claudeRes.status}:`, msg);
    return res.status(claudeRes.status>=500 ? 502 : 400).set(cors).json({ ok:false, error:msg, code });
  }

  let claudeData;
  try { claudeData = await claudeRes.json(); }
  catch { return res.status(502).set(cors).json({ ok:false, error:'レスポンス解析失敗', code:'PARSE_ERROR' }); }

  const rawText = (claudeData?.content?.[0]?.text || '').trim();
  if (!rawText) return res.status(502).set(cors).json({ ok:false, error:'AIから空レスポンス', code:'EMPTY_RESPONSE' });

  const parsed = extractJson(rawText);
  if (!parsed) {
    console.error('[parseTournament] JSON抽出失敗:', rawText.slice(0,300));
    return res.status(502).set(cors).json({
      ok:false, error:'AIレスポンスをJSONとして解析できませんでした', code:'JSON_PARSE_ERROR',
      raw: rawText.slice(0,200), // デバッグ用（本番では削除推奨）
    });
  }

  return res.status(200).set(cors).json({ ok:true, data:parsed, model:MODEL, usage:claudeData?.usage||null });
}
