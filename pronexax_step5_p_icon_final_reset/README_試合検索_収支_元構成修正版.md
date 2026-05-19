# ProNexaX プレビュー修正版 v4

試合検索と収支を、元ファイルの前提どおり「同じフォルダにHTML/CSS/JSがある構成」に戻しました。

## 開く順番

```txt
preview.html
```

## 単独確認

### 試合検索
```txt
pages/search/index.html
pages/search/style.css
pages/search/script.js
```

### 収支
```txt
pages/finance/index.html
pages/finance/finance.css
pages/finance/finance.js
```

## 理由

元ファイルはそれぞれ以下のように同階層ファイルを読み込む作りです。

### 試合検索
```html
<link rel="stylesheet" href="style.css">
<script src="script.js"></script>
```

### 収支
```html
<link rel="stylesheet" href="finance.css">
<script src="finance.js" defer></script>
```

前回のように `styles/` と `scripts/` に分離すると、単独プレビュー時にレイアウトやJS挙動が崩れる可能性があるため、まずは元構成を優先しています。

本体統合時はここから必要な中身だけを `page-search` / `page-finance` に移植します。
