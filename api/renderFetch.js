// api/renderFetch.js  —  ProNexaX Server-side Render Fetch Engine
// ================================================================
// Vercel Serverless Function
// POST /api/renderFetch  { url: string }
// → { ok: true,  html: string }
// → { ok: false, error: string }
//
// headless browser 優先順:
//   1. @sparticuz/chromium + puppeteer-core  (Vercel 推奨・最軽量)
//   2. playwright-chromium                   (代替)
//   3. Browserless.io  外部サービス          (BROWSERLESS_TOKEN 設定時)
//
// Vercel config: maxDuration = 30s (vercel.json に追記が必要)
// ================================================================

export const config = { maxDuration: 30 };

// ── タイムアウト定数 ──────────────────────────────────────────────
const GOTO_TIMEOUT_MS  = 15000;  // page.goto 上限 15s
const TOTAL_TIMEOUT_MS = 25000;  // Function 全体の安全上限 25s

// ── URL 許可リスト（任意サイト fetch を防ぐ簡易ガード）────────────
function _isSafeUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch { return false; }
}

// ================================================================
//  方法1: @sparticuz/chromium + puppeteer-core
//  Vercel の Lambda 環境で最もよく使われる構成。
//  npm install --save @sparticuz/chromium puppeteer-core
// ================================================================
async function fetchWithPuppeteer(url) {
  const chromium    = (await import('@sparticuz/chromium')).default;
  const puppeteer   = (await import('puppeteer-core')).default;

  let browser = null;
  try {
    browser = await puppeteer.launch({
      args:            chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath:  await chromium.executablePath(),
      headless:        chromium.headless,
    });

    const page = await browser.newPage();

    // モバイル UA（ゴルフサイトはレスポンシブ版の方が軽い）
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ' +
      'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    );

    // 画像・フォントをブロック（メモリ節約・高速化）
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const t = req.resourceType();
      if (['image', 'font', 'media', 'stylesheet'].includes(t)) {
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
    console.info(`[renderFetch:puppeteer] ✅ ${html.length} chars — ${url}`);
    return html;

  } finally {
    // ★ zombie browser 防止: 成功・失敗どちらでも必ず close
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
}

// ================================================================
//  方法2: Browserless.io  外部サービス
//  環境変数 BROWSERLESS_TOKEN が設定されている場合に使用。
//  npm 依存ゼロ。Vercel の容量制限を回避できる。
//  https://browserless.io  (Free tier: 1000 units/month)
// ================================================================
async function fetchWithBrowserless(url) {
  const token    = process.env.BROWSERLESS_TOKEN;
  const endpoint = `https://chrome.browserless.io/content?token=${token}`;

  const res = await fetch(endpoint, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      url,
      gotoOptions: { waitUntil: 'networkidle2', timeout: GOTO_TIMEOUT_MS },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ' +
        'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    }),
    signal: AbortSignal.timeout(GOTO_TIMEOUT_MS + 3000),
  });

  if (!res.ok) throw new Error(`Browserless HTTP ${res.status}`);
  const html = await res.text();
  console.info(`[renderFetch:browserless] ✅ ${html.length} chars — ${url}`);
  return html;
}

// ================================================================
//  メイン: 優先順で試行し、どちらも失敗なら error を返す
// ================================================================
export default async function handler(req, res) {
  // POST のみ受け付ける
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { url } = req.body || {};

  if (!url || !_isSafeUrl(url)) {
    return res.status(400).json({ ok: false, error: 'Invalid or missing url' });
  }

  // 関数全体タイムアウト（TOTAL_TIMEOUT_MS）
  const totalTimer = setTimeout(() => {
    console.warn('[renderFetch] total timeout — response may already be sent');
  }, TOTAL_TIMEOUT_MS);

  try {
    let html = '';

    // ── 優先1: Browserless.io（BROWSERLESS_TOKEN が設定されていれば使う）──
    if (process.env.BROWSERLESS_TOKEN) {
      try {
        html = await fetchWithBrowserless(url);
      } catch (e) {
        console.warn('[renderFetch] browserless 失敗 → puppeteer へ:', e.message);
      }
    }

    // ── 優先2: @sparticuz/chromium + puppeteer-core ──
    if (!html) {
      try {
        html = await fetchWithPuppeteer(url);
      } catch (e) {
        console.warn('[renderFetch] puppeteer 失敗:', e.message);
        return res.status(200).json({ ok: false, error: e.message });
      }
    }

    clearTimeout(totalTimer);

    if (!html || html.length < 100) {
      return res.status(200).json({ ok: false, error: 'empty html' });
    }

    return res.status(200).json({ ok: true, html });

  } catch (e) {
    clearTimeout(totalTimer);
    console.error('[renderFetch] handler error:', e.message);
    return res.status(200).json({ ok: false, error: e.message });
  }
}
