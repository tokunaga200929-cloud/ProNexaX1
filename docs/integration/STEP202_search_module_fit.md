# STEP202 試合検索モジュール表示調整

## 目的

v4.23新本体の iframe モジュール層に、試合検索画面を自然に収めるための調整です。

## 修正内容

```txt
・試合検索iframeの高さを親モジュールに合わせる
・iframe内のbody/htmlを100%高さに固定
・スクロールは検索画面ルートに集約
・検索側の独自下部ナビを非表示
・横はみ出しを防止
・親側で search-module-frame のsrcを安定化
・下部ナビ「試合検索」クリック後の状態を監視
```

## 触っていないもの

```txt
・v4.23カレンダー本体
・calendar.css
・calendar.js
・他モジュールの中身
```

## 確認関数

親側:

```js
PNXStep202SearchFitStatus()
PNXStep202OpenSearch()
PNXStep201NavStabilityStatus()
```

試合検索iframe内:

```js
PNXStep202SearchModuleStatus()
PNXStep202SearchResetScroll()
```
