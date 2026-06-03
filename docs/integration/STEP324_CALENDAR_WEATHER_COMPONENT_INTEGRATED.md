# STEP324 カレンダー天気カードコンポーネント安全統合

## 内容
Claudeで作成した天気カードコンポーネントをProNexaXカレンダーへ安全統合。

## 方針
- calendar.js本体の描画処理は大きく変更しない
- `#pnx-weather-card-root` をカレンダー下部パネルへ追加
- `weather-card.css` / `weather-card.js` を読み込み
- `weather-calendar-bridge.js` で選択日変更に合わせて `PNXWeatherCard` を再描画

## 追加ファイル
- components/weather/weather-card.html
- styles/weather/weather-card.css
- scripts/weather/weather-card.js
- scripts/weather/weather-calendar-bridge.js

## 確認ログ
Console:
`[ProNexaX Calendar] STEP324 WEATHER COMPONENT BRIDGE LOADED`

## 手動確認
Console:
`window.PNXCalendarWeatherBridge.render()`

## 注意
天気データはまだダミー。次ステップでAPI連携予定。
