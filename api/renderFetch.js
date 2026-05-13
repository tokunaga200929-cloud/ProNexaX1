// api/renderFetch.js  —  ProNexaX Server-side Render Fetch Engine v2
// ================================================================
// POST /api/renderFetch  { url: string }
// → { ok: true,  html: string }
// → { ok: false, error: string }
//
// 依存:
//   @sparticuz/chromium  123.0.1
//   puppeteer-core       22.6.1
//
// Vercel Serverless (Node 18+)
//   maxDuration: 30s  / memory: 1024MB  (vercel.json に設定済み)
// ================================================================

// ── タイムアウト定数 ──────────────────────────────────────────────
const GOTO_TIMEOUT_MS  = 15000;   // page.goto 上限 15s
const TOTAL_TIMEOUT_MS = 25000;   // handler 全体の安全上限 25s

// ── URL 安全チェック ─────────────────────────────────────────────
function _isSafeUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch { return false; }
}

// ================================================================
//  Puppeteer + @sparticuz/chromium
//  Dynamic import: Vercel build 時に require() エラーを防ぐ。
//  browser は必ず finally で close（zombie 防止）。
// ================================================================
async function fetchWithPuppeteer(url) {
  // dynamic import — Vercel が tree-shake しないようにする
  const chromium  = (await import('@sparticuz/chromium')).default;
  const puppeteer = (await import('puppeteer-core')).default;

  let browser = null;
  let page    = null;

  try {
    browser = await puppeteer.launch({
      args:            chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath:  await chromium.executablePath(),
      headless:        chromium.headless,
    });

    console.info('[renderFetch] browser launched');

    page = await browser.newPage();

    // モバイル UA（ゴルフサイトはレスポンシブ版の方が軽い）
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ' +
      'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    );

    // 画像・フォント・メディアをブロック（メモリ節約・高速化）
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const blocked = ['image', 'font', 'media', 'stylesheet'];
      if (blocked.includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout:   GOTO_TIMEOUT_MS,
    });

    const html = await page.content();
    console.info(`[renderFetch] ✅ puppeteer: ${html.length} chars — ${url}`);
    return html;

  } finally {
    // ★ zombie browser 完全防止
    //    page.close() → browser.close() の順で確実に解放
    if (page)    { try { await page.close();    } catch {} }
    if (browser) { try { await browser.close(); } catch {} }
    console.info('[renderFetch] browser closed (cleanup)');
  }
}

// ================================================================
//  Browserless.io 外部サービス（BROWSERLESS_TOKEN 設定時に優先）
//  npm 依存ゼロ。Vercel の 250MB bundle 制限を回避できる。
//  Free tier: 1,000 units/month  https://browserless.io
// ================================================================
async function fetchWithBrowserless(url) {
  const token    = process.env.BROWSERLESS_TOKEN;
  const endpoint = `https://chrome.browserless.io/content?token=${token}`;

  const res = await fetch(endpoint, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      url,
      gotoOptions: {
        waitUntil: 'networkidle2',
        timeout:   GOTO_TIMEOUT_MS,
      },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ' +
        'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    }),
    signal: AbortSignal.timeout(GOTO_TIMEOUT_MS + 3000),
  });

  if (!res.ok) throw new Error(`Browserless HTTP ${res.status}`);
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

  console.info('[renderFetch] handler start:', url);

  // handler 全体タイムアウト（TOTAL_TIMEOUT_MS = 25s）
  // Vercel maxDuration=30s より短く設定し、response 返却を保証する
  let _timedOut = false;
  const totalTimer = setTimeout(() => {
    _timedOut = true;
    console.warn('[renderFetch] ⏱ total timeout 25s:', url);
  }, TOTAL_TIMEOUT_MS);

  let html = '';
  let errorMsg = '';

  try {
    // ── 優先1: Browserless.io（BROWSERLESS_TOKEN 設定時）──
    if (process.env.BROWSERLESS_TOKEN && !_timedOut) {
      try {
        html = await fetchWithBrowserless(url);
      } catch (e) {
        console.warn('[renderFetch] browserless 失敗 → puppeteer へ:', e.message);
      }
    }

    // ── 優先2: @sparticuz/chromium + puppeteer-core ──
    if (!html && !_timedOut) {
      try {
        html = await fetchWithPuppeteer(url);
      } catch (e) {
        errorMsg = e.message;
        console.warn('[renderFetch] puppeteer 失敗:', e.message);
      }
    }

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
