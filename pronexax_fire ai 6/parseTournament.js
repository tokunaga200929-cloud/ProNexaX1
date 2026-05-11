/**
 * ProNexaX — /api/parseTournament  v2.1
 * Vercel Serverless Function (Node.js Runtime)
 *
 * ■ 修正内容（v2.0 → v2.1）
 *   - export default  →  module.exports  (CommonJS形式に統一)
 *   - res.set()       →  res.setHeader() (Vercel互換APIに変更)
 *   - 'use strict'    →  削除 (CommonJSでは不要)
 *   - AbortSignal.timeout() → 手動 AbortController (Node 16対応)
 *
 * ■ 環境変数（Vercel Dashboard > Settings > Environment Variables）
 *   ANTHROPIC_API_KEY   sk-ant-...
 *   ALLOWED_ORIGIN      https://your-app.vercel.app  （省略時 *）
 *
 * ■ リクエスト
 *   POST /api/parseTournament
 *   Content-Type: application/json
 *   { "pageText": "...", "sourceUrl": "https://...", "hint": "optional" }
 *
 * ■ レスポンス 成功
 *   { "ok": true, "data": { ...fields... }, "model": "...", "usage": {...} }
 *
 * ■ レスポンス エラー
 *   { "ok": false, "error": "msg", "code": "CODE" }
 */

const MODEL      = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1400;
const TIMEOUT_MS = 28000;  // Vercel Free: 10s, Pro: 60s 上限を考慮
const TEXT_LIMIT = 7000;

// ================================================================
// System Prompt — ゴルフ大会専用・精度強化版
// ================================================================
const SYSTEM_PROMPT = `あなたは日本のゴルフ大会情報を抽出する専門AIです。
以下のルールを厳守して、ウェブページテキストから大会情報をJSONのみで返してください。
説明・前置き・コードブロック（\`\`\`）は絶対に含めないでください。純粋なJSONだけを返してください。

【出力形式】（キー名・型を厳守。不明はnull）
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
  "confidence": 0.0から1.0の数値
}

【都道府県キー一覧】
hokkaido, aomori, iwate, miyagi, akita, yamagata, fukushima,
ibaraki, tochigi, gunma, saitama, chiba, tokyo, kanagawa,
niigata, toyama, ishikawa, fukui, yamanashi, nagano, gifu,
shizuoka, aichi, mie, shiga, kyoto, osaka, hyogo, nara, wakayama,
tottori, shimane, okayama, hiroshima, yamaguchi,
tokushima, kagawa, ehime, kochi,
fukuoka, saga, nagasaki, kumamoto, oita, miyazaki, kagoshima, okinawa,
overseas

【カテゴリキー一覧】
男子プロ公式: jgto, jpga, acn, senior, qt
女子プロ公式: jlpga, stepup, qt_w
ミニツアー: atp_golf, fj_tour, future, doucus, speeder, pandc, karts, golf_memo
オープン: pref_open, local_open, famous_open, open
海外: pga, korn_ferry, dp_world, asian_tour, liv, overseas

【日付変換ルール】（必ずYYYY-MM-DDに変換）
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

【ゴルフ場名抽出ルール】
以下のパターンを優先的に認識してplaceに入れる：
・「○○カントリークラブ」「○○CC」
・「○○ゴルフ倶楽部」「○○ゴルフクラブ」「○○GC」
・「○○ゴルフ場」「○○リンクス」「○○ゴルフリゾート」
複数コースある場合は「○○GC（○○コース）」形式で返す。
会場が未記載の場合は null（住所や地名をplaceに入れない）。

【都道府県推定ルール】
本文に都道府県名が明示されている場合は必ずそれを使用。
ゴルフ場名から推定できる場合も活用する（例）：
・「名古屋GC」「東建ホームメイト」→ aichi
・「千葉CC」「袖ヶ浦CC」→ chiba
・「茨城GC」「太平洋C宍戸」→ ibaraki
・「ザ・サザンリンクス」→ okinawa
推定できない場合は null。

【無視すべきテキスト】
・スポンサー紹介・協賛社リスト
・サイトナビゲーション・フッター・著作権表記
・SNS埋め込みテキスト・ハッシュタグ
・「関連記事」「おすすめ記事」セクション
・広告・PR表記

【confidence計算基準】
name:+0.25, start:+0.20, place:+0.15, entryDeadline:+0.10,
category:+0.10, prize/entryFee:+0.10, prefecture:+0.05, organizer:+0.05
URLのみ推測:-0.30, テキスト不足(500文字未満):-0.20
合計を0.0〜1.0にクランプして返す。

【カテゴリ判定の手がかり】
・「JGTO」「ジャパンゴルフツアー機構」→ jgto（男子）
・「JLPGA」「女子プロ」「日本女子プロ」→ jlpga（女子）
・「JPGA」「日本プロゴルフ協会」→ jpga（男子）
・「シニアツアー」「シニア選手権」→ senior（男子）
・「クォリファイングトーナメント」「QT」「予選会」→ qt（男子）
・「ステップアップツアー」→ stepup（女子）
・「○○県オープン」「地区オープン」→ pref_open
・「PGAツアー」「USオープン」→ pga（海外）
`;

// ================================================================
// ユーティリティ
// ================================================================

// CORSヘッダーを res に設定（Vercel互換: res.setHeader 使用）
function setCorsHeaders(res, origin) {
  const allowed = process.env.ALLOWED_ORIGIN || '*';
  const ao = (allowed === '*' || origin === allowed) ? (origin || '*') : allowed;
  res.setHeader('Access-Control-Allow-Origin',  ao);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age',       '86400');
}

// セキュリティヘッダー
function setSecurityHeaders(res) {
  res.setHeader('Cache-Control',          'no-store, no-cache, must-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options',        'DENY');
}

// JSON レスポンスを送信（Vercel互換）
function sendJson(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(status).json(body);
}

// JSON 抽出（コードブロック除去 + 正規表現フォールバック）
function extractJson(raw) {
  if (!raw) return null;

  // ① コードブロックを除去してパース
  const cleaned = raw
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/```\s*$/m, '')
    .trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }

  // ② { ... } を正規表現で抽出してパース
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) {
    try { return JSON.parse(m[0]); } catch { /* fall through */ }
  }

  return null;
}

// ================================================================
// メインハンドラ (CommonJS: module.exports)
// ================================================================
module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';

  // すべてのレスポンスに CORS + セキュリティヘッダーを付与
  setCorsHeaders(res, origin);
  setSecurityHeaders(res);

  // ── OPTIONS プリフライト ──
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // ── POST のみ許可 ──
  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Method Not Allowed', code: 'METHOD_NOT_ALLOWED' });
    return;
  }

  // ── APIキー確認 ──
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    console.error('[parseTournament] ANTHROPIC_API_KEY 未設定または不正');
    sendJson(res, 500, { ok: false, error: 'サーバー設定エラー: APIキーが未設定です', code: 'MISSING_API_KEY' });
    return;
  }

  // ── リクエストボディ検証 ──
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    sendJson(res, 400, { ok: false, error: 'リクエストのJSONパースに失敗しました', code: 'INVALID_JSON' });
    return;
  }

  const pageText  = (body && body.pageText)  || '';
  const sourceUrl = (body && body.sourceUrl) || '';
  const hint      = (body && body.hint)      || '';

  if (!sourceUrl) {
    sendJson(res, 400, { ok: false, error: 'sourceUrlが必要です', code: 'MISSING_URL' });
    return;
  }

  // テキストを切り詰め
  const truncated = pageText.slice(0, TEXT_LIMIT) ||
    '（ページテキスト取得失敗。URLから大会情報を推測してください）';
  const hintLine = hint ? '\n補足情報: ' + hint : '';

  const userContent =
    '解析対象URL: ' + sourceUrl + hintLine + '\n\n' +
    '--- ページテキスト ---\n' + truncated + '\n---';

  // ── Claude API 呼び出し ──
  let claudeRes;
  try {
    // Node 16 対応: AbortSignal.timeout() は Node 17.3+ のため手動実装
    const controller = new AbortController();
    const timer = setTimeout(function() { controller.abort(); }, TIMEOUT_MS);

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
      sendJson(res, 504, { ok: false, error: 'Claude APIタイムアウト（28秒）', code: 'TIMEOUT' });
    } else {
      console.error('[parseTournament] fetch error:', e.message);
      sendJson(res, 502, { ok: false, error: 'Claude APIへの接続に失敗しました', code: 'FETCH_ERROR' });
    }
    return;
  }

  // ── HTTPエラー処理 ──
  if (!claudeRes.ok) {
    let errMsg = 'HTTP ' + claudeRes.status;
    let code   = 'CLAUDE_ERROR';
    try {
      const errData = await claudeRes.json();
      if (errData && errData.error && errData.error.message) {
        errMsg = errData.error.message;
      }
    } catch { /* ignore */ }

    if (claudeRes.status === 429) {
      code   = 'RATE_LIMIT';
      errMsg = 'APIのレート制限に達しました。しばらく待ってからリトライしてください';
    } else if (claudeRes.status === 401) {
      code   = 'UNAUTHORIZED';
      errMsg = 'APIキーが無効または期限切れです';
    } else if (claudeRes.status === 529) {
      code   = 'OVERLOADED';
      errMsg = 'Claude APIが混雑しています。しばらく待ってからリトライしてください';
    }

    console.error('[parseTournament] Claude ' + claudeRes.status + ':', errMsg);
    sendJson(res, claudeRes.status >= 500 ? 502 : 400, { ok: false, error: errMsg, code: code });
    return;
  }

  // ── レスポンス解析 ──
  let claudeData;
  try {
    claudeData = await claudeRes.json();
  } catch {
    sendJson(res, 502, { ok: false, error: 'Claude APIレスポンスの解析に失敗しました', code: 'PARSE_ERROR' });
    return;
  }

  const rawText = (
    claudeData &&
    claudeData.content &&
    claudeData.content[0] &&
    claudeData.content[0].text
  ) ? claudeData.content[0].text.trim() : '';

  if (!rawText) {
    sendJson(res, 502, { ok: false, error: 'AIから空のレスポンスが返されました', code: 'EMPTY_RESPONSE' });
    return;
  }

  // ── JSON 抽出 ──
  const parsed = extractJson(rawText);
  if (!parsed) {
    console.error('[parseTournament] JSON抽出失敗:', rawText.slice(0, 300));
    sendJson(res, 502, {
      ok:    false,
      error: 'AIの応答をJSONとして解析できませんでした',
      code:  'JSON_PARSE_ERROR',
      // デバッグ用（本番運用時は以下の行を削除）
      raw:   rawText.slice(0, 200),
    });
    return;
  }

  // ── 成功レスポンス ──
  sendJson(res, 200, {
    ok:    true,
    data:  parsed,
    model: MODEL,
    usage: (claudeData && claudeData.usage) ? claudeData.usage : null,
  });
};
