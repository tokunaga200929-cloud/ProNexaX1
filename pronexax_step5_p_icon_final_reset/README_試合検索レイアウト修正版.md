# 試合検索レイアウト修正版

試合検索は元ファイルの前提に合わせて、以下の形に戻しました。

```txt
pages/search/
  index.html
  style.css
  script.js
```

## 開き方

まず `preview.html` を開きます。

試合検索を確認する場合は、

```txt
pages/search/index.html
```

を開いてください。

## 理由

試合検索の元ファイルは `index.html` から同階層の `style.css` と `script.js` を読む設計でした。
前回のように `styles/search/` と `scripts/search/` に分けると、単独プレビュー時にCSS/JSの読み込みや相対パスが崩れやすいため、今回は本来の構成を優先しています。

統合時には、ここから本体 `page-search` に必要部分だけを移植します。
