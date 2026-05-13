// api/renderFetch.js  —  ProNexaX Server-side Render Fetch Engine v4
// ================================================================
// POST /api/renderFetch  { url: string }
// → { ok: true,  html: string }
// → { ok: false, error: string }
//
// 構成: Browserless.io のみ（Puppeteer/Chromium を使わない）
//
// 理由:
//   Vercel Serverless は Amazon Linux 2023 ベース。
//   @sparticuz/chromium が要求する libnss3.so が存在しないため、
//   ローカル Chromium 起動は構造的に不可能。
//   Browserless.io は外部サービス側で browser を管理するため
//   Vercel 環境の OS ライブラリに依存しない。
//
// 事前設定:
//   Vercel → Settings → Environment Variables
//   BROWSERLESS_TOKEN = <your token>
//   取得: https://browserless.io （Free tier: 1,000 units/month）
//
// Vercel config: maxDuration=30, memory=1024 (vercel.json に設定済み)
// ================================================================

const GOTO_TIMEOUT_MS  = 15000;
const TOTAL_TIMEOUT_MS = 25000;

function _isSafeUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch { return false; }
}

// ================================================================
//  Browserless.io — /content エンドポイント
//  POST { url, gotoOptions, userAgent }
//  → rendered HTML text
// ================================================================
async function fetchWithBrowserless(url) {
  const token = process.env.BROWSERLESS_TOKEN;
  if (!token) throw new Error('BROWSERLESS_TOKEN が未設定です');

  const endpoint = `https://chrome.browserless.io/content?token=${token}`;

  const res = await fetch(endpoint, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      gotoOptions: {
        waitUntil: 'networkidle2',
        timeout:   GOTO_TIMEOUT_MS,
      },
      
    }),
    signal: AbortSignal.timeout(GOTO_TIMEOUT_MS + 5000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Browserless HTTP ${res.status}: ${body.slice(0, 100)}`);
  }

  const html = await res.text();
  console.info(`[renderFetch] ✅ browserless: ${html.length} chars — ${url}`);
  return html;
}

// ================================================================
//  handler
// ================================================================
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { url } = req.body || {};
  if (!url || !_isSafeUrl(url)) {
    return res.status(400).json({ ok: false, error: 'Invalid or missing url' });
  }

  console.info('[renderFetch] start:', url);

  // BROWSERLESS_TOKEN が未設定の場合は即座に失敗を返す
  if (!process.env.BROWSERLESS_TOKEN) {
    console.warn('[renderFetch] BROWSERLESS_TOKEN 未設定 — Vercel Environment Variables に設定してください');
    return res.status(200).json({
      ok: false,
      error: 'BROWSERLESS_TOKEN not configured',
    });
  }

  let _timedOut = false;
  const totalTimer = setTimeout(() => {
    _timedOut = true;
    console.warn('[renderFetch] ⏱ total timeout 25s:', url);
  }, TOTAL_TIMEOUT_MS);

  let html = '';
  let errorMsg = '';

  try {
    html = await fetchWithBrowserless(url);
  } catch (e) {
    errorMsg = e.message;
    console.warn('[renderFetch] ❌ browserless 失敗:', e.message);
  } finally {
    clearTimeout(totalTimer);
  }

  if (_timedOut) {
    return res.status(200).json({ ok: false, error: 'timeout' });
  }
  if (!html || html.length < 100) {
    return res.status(200).json({ ok: false, error: errorMsg || 'empty html' });
  }

  console.info(`[renderFetch] ✅ done: ${html.length} chars`);
  return res.status(200).json({ ok: true, html });
}
