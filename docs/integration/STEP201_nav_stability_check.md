# STEP201 下部ナビ切替 安定化チェック版

## 目的

STEP200で作った「v4.23新本体統合ベース」を壊さず、下部ナビ切替だけを安定化しました。

## 修正内容

```txt
・下部ナビクリックを capture で先に受ける
・calendar / search / featured / finance / profile を正規化
・profile ナビは mypage として開く
・プロフィール詳細は iframe message から profileDetail として開く
・モジュール表示中も下部ナビは常に操作可能
・カレンダーへ戻る時は iframe モジュール層を完全に閉じる
・CMSは PNXOpenCMS() で別タブ表示
```

## ルート

```txt
calendar      -> 新本体カレンダー
search        -> pages/search/embed.html
featured      -> pages/featured/embed.html
finance       -> pages/finance/embed.html
mypage        -> pages/mypage/embed.html
profileDetail -> pages/profile/embed.html
cms           -> cms/index.html
```

## 確認関数

```js
PNXStep201NavStabilityStatus()
PNXStep201SmokeTest()
PNXStep201RouteState()

PNXStep201Navigate("calendar")
PNXStep201Navigate("search")
PNXStep201Navigate("featured")
PNXStep201Navigate("finance")
PNXStep201Navigate("mypage")
PNXOpenProfilePage()
PNXOpenCMS()
```
