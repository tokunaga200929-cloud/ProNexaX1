/* =============================================================
   ProNexaX 天気カード コンポーネント
   window.PNXWeatherCard という小さな API にまとめる
   - init(options)      : #pnx-weather-card-root に描画
   - render(data)       : data から DOM を生成して描画
   - setData(data)      : データを差し替えて再描画（API 連携時に使用）
   - getDummyData(date) : 日付からダミー天気を生成（少し変化する）
   外部ライブラリは不使用。後から天気 API に差し替えやすい設計。
   ============================================================= */
(function (window, document) {
  "use strict";

  /* -----------------------------------------------------------
     天気アイコン（シンプルな幾何 SVG のみ）
     condition 文字列からアイコンを引く
     ----------------------------------------------------------- */
  var ICONS = {
    // 晴れ：丸い太陽 + 光線
    sun:
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="32" cy="32" r="13" fill="#FDB813"/>' +
      '<g stroke="#FDB813" stroke-width="3.4" stroke-linecap="round">' +
      '<line x1="32" y1="6" x2="32" y2="13"/><line x1="32" y1="51" x2="32" y2="58"/>' +
      '<line x1="6" y1="32" x2="13" y2="32"/><line x1="51" y1="32" x2="58" y2="32"/>' +
      '<line x1="13.5" y1="13.5" x2="18.5" y2="18.5"/><line x1="45.5" y1="45.5" x2="50.5" y2="50.5"/>' +
      '<line x1="50.5" y1="13.5" x2="45.5" y2="18.5"/><line x1="18.5" y1="45.5" x2="13.5" y2="50.5"/>' +
      '</g></svg>',
    // 晴れ時々曇り：太陽 + 雲
    partly:
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="24" cy="24" r="10" fill="#FDB813"/>' +
      '<g stroke="#FDB813" stroke-width="3" stroke-linecap="round">' +
      '<line x1="24" y1="5" x2="24" y2="10"/><line x1="5" y1="24" x2="10" y2="24"/>' +
      '<line x1="10.5" y1="10.5" x2="14" y2="14"/><line x1="37.5" y1="10.5" x2="34" y2="14"/>' +
      '</g>' +
      '<path d="M26 46c-6 0-10-4-10-9s4-9 9-9c2-6 8-9 13-7 6 2 8 8 6 13 4 0 7 2 7 6s-3 6-7 6H26z" fill="#CBD9EA"/>' +
      '</svg>',
    // 曇り：雲のみ
    cloud:
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M22 48c-7 0-12-5-12-11s5-11 11-11c2-7 9-11 16-9 7 2 11 9 9 16 5 0 9 3 9 8s-4 8-9 8H22z" fill="#B9C7D9"/>' +
      '</svg>',
    // 雨：雲 + 雨脚
    rain:
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M22 40c-7 0-12-5-12-11s5-11 11-11c2-7 9-11 16-9 7 2 11 9 9 16 5 0 9 3 9 8s-4 8-9 8H22z" fill="#B9C7D9"/>' +
      '<g stroke="#2F80ED" stroke-width="3.4" stroke-linecap="round">' +
      '<line x1="23" y1="47" x2="20" y2="55"/><line x1="33" y1="47" x2="30" y2="55"/><line x1="43" y1="47" x2="40" y2="55"/>' +
      '</g></svg>'
  };

  // ゴルフ旗アイコン（アドバイス欄のアクセント）
  var FLAG_ICON =
    '<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<line x1="9" y1="4" x2="9" y2="29" stroke="#0A74FF" stroke-width="2.4" stroke-linecap="round"/>' +
    '<path d="M9 5l13 4-13 4V5z" fill="#0A74FF"/>' +
    '<ellipse cx="9" cy="29" rx="6" ry="2" fill="#0A74FF" opacity="0.16"/>' +
    '</svg>';

  // ヘッダー・指標の小アイコン
  var SMALL_ICONS = {
    sun:
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="12" cy="12" r="5" fill="currentColor"/>' +
      '<g stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
      '<line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/>' +
      '<line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/>' +
      '</g></svg>',
    pin:
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M12 2c-4 0-7 3-7 7 0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" fill="currentColor"/>' +
      '<circle cx="12" cy="9" r="2.4" fill="#fff"/></svg>',
    drop:
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M12 3c4 5 6 8 6 11a6 6 0 11-12 0c0-3 2-6 6-11z" fill="currentColor"/></svg>',
    wind:
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<g stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none">' +
      '<path d="M3 8h11a3 3 0 100-6"/><path d="M3 14h15a3 3 0 110 6"/><path d="M3 11h7"/></g></svg>',
    humid:
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M12 3c4 5 6 8 6 11a6 6 0 11-12 0c0-3 2-6 6-11z" fill="currentColor"/></svg>'
  };

  /* condition 文字列 → メインアイコンのキーへ変換 */
  function iconKeyOf(condition) {
    if (!condition) return "sun";
    if (condition.indexOf("雨") !== -1) return "rain";
    if (condition.indexOf("曇") !== -1) return "cloud";
    if (condition.indexOf("時々") !== -1 || condition.indexOf("一時") !== -1) return "partly";
    return "sun"; // 晴れ など
  }

  /* HTML エスケープ（会場名やアドバイスの安全な描画用） */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* -----------------------------------------------------------
     PNXWeatherCard 本体
     ----------------------------------------------------------- */
  var PNXWeatherCard = {
    _rootEl: null,    // 描画先ルート要素
    _data: null,      // 現在のデータ
    _toastEl: null,   // トースト要素
    _toastTimer: null,

    /* デフォルトのダミーデータ */
    _defaultData: {
      date: "2026-06-03",
      venue: "広島カンツリー倶楽部",
      condition: "晴れ",
      currentTemp: 24,
      highTemp: 24,
      lowTemp: 18,
      rainProbability: 20,
      windSpeed: 3,
      humidity: 58,
      adviceTitle: "朝は涼しめ / 午後は快適",
      adviceText: "雨具不要。快適なゴルフ日和になりそうです。",
      isMock: true
    },

    /* -------------------------------------------------------
       init(options)
       options.rootId  : 差し込み先 ID（既定 "pnx-weather-card-root"）
       options.data    : 初期データ（省略時は getDummyData）
       options.date    : 初期データの基準日（data 省略時に使用）
       ------------------------------------------------------- */
    init: function (options) {
      options = options || {};
      var rootId = options.rootId || "pnx-weather-card-root";
      this._rootEl = document.getElementById(rootId);
      if (!this._rootEl) {
        console.warn("[PNXWeatherCard] root #" + rootId + " が見つかりません");
        return this;
      }
      // ルートにクラス付与（CSS スコープのため）
      this._rootEl.classList.add("pnx-weather-card-root");

      var data = options.data || this.getDummyData(options.date);
      this.render(data);
      return this;
    },

    /* -------------------------------------------------------
       getDummyData(date)
       日付文字列を渡すと、その日ごとに少し違うダミー天気を返す。
       後で本物の API データに置き換えても render はそのまま使える。
       ------------------------------------------------------- */
    getDummyData: function (date) {
      // バリエーション定義（簡易的な天候パターン）
      var patterns = [
        { condition: "晴れ", hi: 24, lo: 18, rain: 10, wind: 2, humid: 52,
          title: "朝は涼しめ / 午後は快適", text: "雨具不要。快適なゴルフ日和になりそうです。" },
        { condition: "晴れ時々曇り", hi: 26, lo: 19, rain: 20, wind: 3, humid: 58,
          title: "日中は過ごしやすい陽気", text: "日差し対策をしつつ、伸び伸びプレーできそうです。" },
        { condition: "曇り", hi: 23, lo: 17, rain: 30, wind: 4, humid: 65,
          title: "暑さ控えめ / プレー向き", text: "気温が上がりすぎず、後半までスタミナが持ちそう。" },
        { condition: "曇り一時雨", hi: 21, lo: 16, rain: 60, wind: 5, humid: 74,
          title: "念のため雨具を準備", text: "通り雨の可能性あり。タオルとレインを忘れずに。" },
        { condition: "雨", hi: 19, lo: 15, rain: 80, wind: 6, humid: 82,
          title: "足元注意 / グリップ対策を", text: "濡れたフェアウェイに注意。滑り止め手袋が安心です。" }
      ];

      // date から決定的にパターンを選ぶ（同じ日付なら同じ結果）
      var idx = 0;
      var d = date ? new Date(date) : new Date();
      if (!isNaN(d.getTime())) {
        idx = (d.getDate() + d.getMonth()) % patterns.length;
      }
      var p = patterns[idx];

      // currentTemp は最高と最低の間で日付に応じて少し動かす
      var cur = Math.round(p.lo + (p.hi - p.lo) * 0.75);

      return {
        date: date || this._formatDate(d),
        venue: "広島カンツリー倶楽部",
        condition: p.condition,
        currentTemp: cur,
        highTemp: p.hi,
        lowTemp: p.lo,
        rainProbability: p.rain,
        windSpeed: p.wind,
        humidity: p.humid,
        adviceTitle: p.title,
        adviceText: p.text,
        isMock: true
      };
    },

    /* 日付を YYYY-MM-DD に整形 */
    _formatDate: function (d) {
      var m = ("0" + (d.getMonth() + 1)).slice(-2);
      var day = ("0" + d.getDate()).slice(-2);
      return d.getFullYear() + "-" + m + "-" + day;
    },

    /* -------------------------------------------------------
       setData(data) : データ差し替え + 再描画
       API から取得したデータを渡せばそのまま更新される。
       ------------------------------------------------------- */
    setData: function (data) {
      this.render(data);
      return this;
    },

    /* -------------------------------------------------------
       render(data) : data から DOM を生成して描画
       ------------------------------------------------------- */
    render: function (data) {
      if (!this._rootEl) {
        // init 前に呼ばれた場合に備えて自動取得を試みる
        this._rootEl = document.getElementById("pnx-weather-card-root");
        if (this._rootEl) this._rootEl.classList.add("pnx-weather-card-root");
      }
      if (!this._rootEl) return this;

      // 既定値で補完
      data = this._merge(this._defaultData, data || {});
      this._data = data;

      var iconKey = iconKeyOf(data.condition);

      var html =
        '<div class="pnx-weather-card-card" role="button" tabindex="0" aria-label="今日の天気カード">' +

          // --- ヘッダー ---
          '<div class="pnx-weather-card-header">' +
            '<div class="pnx-weather-card-title">' +
              '<span class="pnx-weather-card-title-icon">' + SMALL_ICONS.sun + '</span>' +
              '<span class="pnx-weather-card-title-text">今日の天気</span>' +
            '</div>' +
            '<div class="pnx-weather-card-venue" title="' + esc(data.venue) + '">' +
              '<span class="pnx-weather-card-venue-pin">' + SMALL_ICONS.pin + '</span>' +
              '<span class="pnx-weather-card-venue-name">会場：' + esc(data.venue) + '</span>' +
            '</div>' +
          '</div>' +

          // --- メイン天気 ---
          '<div class="pnx-weather-card-main">' +
            '<div class="pnx-weather-card-main-icon">' + ICONS[iconKey] + '</div>' +
            '<div class="pnx-weather-card-main-info">' +
              '<span class="pnx-weather-card-temp">' + esc(data.currentTemp) +
                '<span class="pnx-weather-card-temp-unit">℃</span></span>' +
              '<span class="pnx-weather-card-condition">' + esc(data.condition) + '</span>' +
              '<span class="pnx-weather-card-hilo">' +
                '<span class="pnx-weather-card-hi">' + esc(data.highTemp) + '°</span>' +
                '<span class="pnx-weather-card-hilo-sep">/</span>' +
                '<span class="pnx-weather-card-lo">' + esc(data.lowTemp) + '°</span>' +
              '</span>' +
            '</div>' +
          '</div>' +

          // --- ゴルフ向け指標（3分割） ---
          '<div class="pnx-weather-card-metrics">' +
            this._metric(SMALL_ICONS.drop, "降水確率", data.rainProbability, "%") +
            this._metric(SMALL_ICONS.wind, "風", data.windSpeed, "m/s") +
            this._metric(SMALL_ICONS.humid, "湿度", data.humidity, "%") +
          '</div>' +

          // --- アドバイス ---
          '<div class="pnx-weather-card-advice">' +
            '<span class="pnx-weather-card-advice-flag">' + FLAG_ICON + '</span>' +
            '<div class="pnx-weather-card-advice-body">' +
              '<div class="pnx-weather-card-advice-title">' + esc(data.adviceTitle) + '</div>' +
              '<div class="pnx-weather-card-advice-text">' + esc(data.adviceText) + '</div>' +
            '</div>' +
          '</div>' +

          // --- API 未接続表示 ---
          (data.isMock
            ? '<div class="pnx-weather-card-mock">※テスト表示です。次のステップで天気APIと連携します。</div>'
            : '') +

        '</div>';

      this._rootEl.innerHTML = html;

      // クリック / キーボードでトースト
      var card = this._rootEl.querySelector(".pnx-weather-card-card");
      var self = this;
      if (card) {
        card.addEventListener("click", function () {
          self._showToast("天気詳細は次のステップで追加します");
        });
        card.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            self._showToast("天気詳細は次のステップで追加します");
          }
        });
      }
      return this;
    },

    /* 指標カード1つ分の HTML を作る */
    _metric: function (icon, label, value, unit) {
      return '<div class="pnx-weather-card-metric">' +
        '<div class="pnx-weather-card-metric-label">' +
          '<span class="pnx-weather-card-metric-icon">' + icon + '</span>' + esc(label) +
        '</div>' +
        '<div class="pnx-weather-card-metric-value">' + esc(value) +
          '<small>' + esc(unit) + '</small></div>' +
      '</div>';
    },

    /* 浅いマージ（既定値 + 渡された値） */
    _merge: function (base, over) {
      var out = {};
      for (var k in base) if (base.hasOwnProperty(k)) out[k] = base[k];
      for (var j in over) if (over.hasOwnProperty(j) && over[j] !== undefined) out[j] = over[j];
      return out;
    },

    /* -------------------------------------------------------
       トースト表示
       ------------------------------------------------------- */
    _showToast: function (message) {
      // 要素を一度だけ生成して使い回す
      if (!this._toastEl) {
        this._toastEl = document.createElement("div");
        this._toastEl.className = "pnx-weather-card-toast";
        document.body.appendChild(this._toastEl);
      }
      var el = this._toastEl;
      el.textContent = message;

      // 表示
      clearTimeout(this._toastTimer);
      // reflow を挟んでトランジションを確実に発火
      void el.offsetWidth;
      el.classList.add("pnx-weather-card-toast-show");

      // 2秒後に隠す
      this._toastTimer = setTimeout(function () {
        el.classList.remove("pnx-weather-card-toast-show");
      }, 2000);
    }
  };

  // グローバル公開
  window.PNXWeatherCard = PNXWeatherCard;

})(window, document);
