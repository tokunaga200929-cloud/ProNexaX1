/**
 * ProNexaX — /api/parseTournament
 * Vercel Serverless Function
 *
 * フロントエンドからのリクエストを受け取り、
 * サーバーサイドで Anthropic Claude API を呼び出して
 * 大会情報 JSON を返す。
 *
 * ■ 環境変数（Vercel Dashboard > Settings > Environment Variables）
 *   ANTHROPIC_API_KEY   : sk-ant-...
 *   ALLOWED_ORIGIN      : https://your-app.vercel.app （省略時は * ）
 *
 * ■ リクエスト
 *   POST /api/parseTournament
 *   Content-Type: application/json
 *   { "pageText": "...", "sourceUrl": "https://..." }
 *
 * ■ レスポンス（成功）
 *   { "ok": true, "data": { ...tournament fields... }, "model": "..." }
 *
 * ■ レスポンス（エラー）
 *   { "ok": false, "error": "メッセージ", "code": "ERROR_CODE" }
 */

// ── 設定 ──────────────────────────────────────────────────────────
const MODEL         = 'claude-sonnet-4-20250514';
const MAX_TOKENS    = 1200;
const TIMEOUT_MS    = 30_000; // Claude API への fetch タイムアウト
const TEXT_LIMIT    = 6000;   // pageText の文字数上限（超過分を切り捨て）

// ── System Prompt ─────────────────────────────────────────────────
const SYSTEM_PROMPT = `あなたはゴルフ大会情報を抽出する専門AIです。
ウェブページテキストから大会情報を抽出し、以下のJSONフォーマットのみで返してください。
説明・前置き・コードブロック（\`\`\`）は絶対に含めないでください。純粋なJSONだけを返してください。
日付は必ずYYYY-MM-DD形式に変換してください。不明なフィールドはnullにしてください。

必ず以下のキー名でJSONを返してください（キー名の変更禁止）:
{
  "name": "大会名",
  "start": "YYYY-MM-DD",
  "end": "YYYY-MM-DD",
  "entryDeadline": "YYYY-MM-DD",
  "cancelDeadline": "YYYY-MM-DD",
  "place": "ゴルフ場名",
  "prefecture": "都道府県（英字キー例: tokyo/osaka/aichi/kanagawa/fukuoka/hokkaido/okinawa）",
  "category": "カテゴリキー（jgto/jlpga/jpga/pga/senior/qt/qt_w/mini/pref_open/open/overseas のいずれか）",
  "gender": "mens または womens",
  "region": "domestic または overseas",
  "entryFee": "参加費（例: 30,000円）",
  "prize": "賞金総額（例: 15,000万円）",
  "prizeWinner": "優勝賞金",
  "organizer": "主催者名",
  "entryMethod": "エントリー方法",
  "qualification": "出場資格",
  "capacity": "定員（例: 144名）",
  "website": "公式サイトURL",
  "instagram": "Instagram URL",
  "entryUrl": "エントリーフォームURL",
  "memo": "特記事項",
  "confidence": 0.0から1.0の数値（抽出の確信度）
}`;

// ── CORS ヘッダー ─────────────────────────────────────────────────
function corsHeaders(origin) {
  const allowed = process.env.ALLOWED_ORIGIN || '*';
  const allowOrigin = (allowed === '*' || origin === allowed) ? (origin || '*') : allowed;
  return {
    'Access-Control-Allow-Origin':  allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age':       '86400',
  };
}

// ── JSON 抽出ヘルパー ─────────────────────────────────────────────
function extractJson(raw) {
  if (!raw) return null;
  // ① コードブロック除去してパース
  const cleaned = raw.replace(/^```(?:json)?\s*/im, '').replace(/```\s*$/m, '').trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  // ② { ... } を正規表現で抽出
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) {
    try { return JSON.parse(m[0]); } catch { /* fall through */ }
  }
  return null;
}

// ── メインハンドラ ────────────────────────────────────────────────
export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const cors   = corsHeaders(origin);

  // OPTIONS プリフライト
  if (req.method === 'OPTIONS') {
    return res.status(204).set(cors).end();
  }

  // POST のみ許可
  if (req.method !== 'POST') {
    return res.status(405).set(cors).json({ ok: false, error: 'Method Not Allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  // API キー確認
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    console.error('[parseTournament] ANTHROPIC_API_KEY が未設定または不正');
    return res.status(500).set(cors).json({ ok: false, error: 'サーバー設定エラー: APIキーが未設定です', code: 'MISSING_API_KEY' });
  }

  // リクエストボディ検証
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).set(cors).json({ ok: false, error: 'リクエストの JSON パースに失敗しました', code: 'INVALID_JSON' });
  }

  const { pageText, sourceUrl } = body || {};
  if (!sourceUrl) {
    return res.status(400).set(cors).json({ ok: false, error: 'sourceUrl が必要です', code: 'MISSING_SOURCE_URL' });
  }

  // テキストを TEXT_LIMIT 文字に切り詰め
  const truncatedText = (pageText || '').slice(0, TEXT_LIMIT) ||
    '（ページテキストなし。URLから大会情報を推測してください）';

  const userContent =
    `解析対象URL: ${sourceUrl}\n\n` +
    `--- ページテキスト ---\n${truncatedText}\n---`;

  // ── Claude API 呼び出し ──
  let claudeRes;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

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
        messages:   [{ role: 'user', content: userContent }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

  } catch (e) {
    if (e.name === 'AbortError') {
      return res.status(504).set(cors).json({ ok: false, error: 'Claude API タイムアウト（30秒）', code: 'TIMEOUT' });
    }
    console.error('[parseTournament] fetch error:', e.message);
    return res.status(502).set(cors).json({ ok: false, error: 'Claude API への接続に失敗しました', code: 'FETCH_ERROR' });
  }

  // ── HTTP エラー処理 ──
  if (!claudeRes.ok) {
    let errMsg = `HTTP ${claudeRes.status}`;
    let code   = 'CLAUDE_ERROR';
    try {
      const errData = await claudeRes.json();
      errMsg = errData?.error?.message || errMsg;
    } catch { /* ignore */ }

    if (claudeRes.status === 429) {
      code = 'RATE_LIMIT';
      errMsg = 'APIのレート制限に達しました。しばらく待ってからリトライしてください';
    } else if (claudeRes.status === 401) {
      code = 'UNAUTHORIZED';
      errMsg = 'APIキーが無効または期限切れです';
    } else if (claudeRes.status === 529) {
      code = 'OVERLOADED';
      errMsg = 'Claude APIが混雑しています。しばらく待ってからリトライしてください';
    }

    console.error(`[parseTournament] Claude API ${claudeRes.status}:`, errMsg);
    return res.status(claudeRes.status >= 500 ? 502 : 400).set(cors).json({ ok: false, error: errMsg, code });
  }

  // ── レスポンス処理 ──
  let claudeData;
  try {
    claudeData = await claudeRes.json();
  } catch {
    return res.status(502).set(cors).json({ ok: false, error: 'Claude API レスポンスの解析に失敗しました', code: 'PARSE_ERROR' });
  }

  const rawText = claudeData?.content?.[0]?.text || '';
  if (!rawText.trim()) {
    return res.status(502).set(cors).json({ ok: false, error: 'AIから空のレスポンスが返されました', code: 'EMPTY_RESPONSE' });
  }

  // ── JSON 抽出 ──
  const parsed = extractJson(rawText);
  if (!parsed) {
    console.error('[parseTournament] JSON 抽出失敗。raw:', rawText.slice(0, 300));
    return res.status(502).set(cors).json({
      ok: false,
      error: 'AIの応答をJSONとして解析できませんでした',
      code: 'JSON_PARSE_ERROR',
      raw: rawText.slice(0, 200), // デバッグ用（本番では削除推奨）
    });
  }

  // ── 成功レスポンス ──
  return res.status(200).set(cors).json({
    ok:    true,
    data:  parsed,
    model: MODEL,
    usage: claudeData?.usage || null,
  });
}
