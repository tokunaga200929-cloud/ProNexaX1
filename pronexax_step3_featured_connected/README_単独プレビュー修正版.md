# ProNexaX 本体込み + 単独プレビュー修正版

このZIPでは、各モジュールHTMLの読み込みパスを整理後の階層に合わせて修正しています。

## 開くファイル

### 本体
```txt
index.html
```

### プレビューリンク一覧
```txt
preview.html
```

### 各モジュール単独確認
```txt
pages/search/search.html
pages/featured/featured.html
pages/finance/finance.html
cms/index.html
```

## 修正済みの内容

### 試合検索
```html
<link rel="stylesheet" href="../../styles/search/search.css">
<script src="../../scripts/search/search.js"></script>
```

### 注目/広告
```html
<link rel="stylesheet" href="../../styles/featured/featured.css">
<script src="../../scripts/featured/featured.js"></script>
```

画像パスも `../../assets/images/` に統一。

### 収支
```html
<link rel="stylesheet" href="../../styles/finance/finance.css">
<script src="../../scripts/finance/finance.js"></script>
```

Chart.js CDNはそのまま維持。

## 注意

これはまだ本体への完全接続版ではありません。
ただし、各モジュールを単独HTMLとして開いて確認しやすい状態に修正済みです。
次の段階で本体 `index.html` の `page-search / page-featured / page-finance` に接続します。
