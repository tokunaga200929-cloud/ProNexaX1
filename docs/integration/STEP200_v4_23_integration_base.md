# STEP200 v4.23 新本体 統合ベース

`pronexax_calendar_v2_FIXED_v4_23_apple_typography_tune.zip` を新しい本体として採用しました。

カレンダー本体の `index.html / calendar.css / calendar.js` は壊さず、以下の機能を iframe モジュールとして差し込める土台を追加しています。

```txt
・試合検索
・広告 / 注目
・収支
・マイページ
・プロフィール
・CMS
```

## 追加ルート

```txt
calendar  -> 新本体カレンダー
search    -> pages/search/embed.html
featured  -> pages/featured/embed.html
finance   -> pages/finance/embed.html
mypage    -> pages/mypage/embed.html
profile   -> pages/profile/embed.html
cms       -> cms/index.html
```

## 確認関数

```js
PNXStep200IntegrationStatus()
PNXSwitchPage("search")
PNXSwitchPage("featured")
PNXSwitchPage("finance")
PNXSwitchPage("mypage")
PNXSwitchPage("calendar")
PNXOpenCMS()
```
