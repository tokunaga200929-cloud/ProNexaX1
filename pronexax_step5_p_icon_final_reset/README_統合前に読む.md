# ProNexaX 本体込み・統合素材版

これは「本体 + 統合予定モジュール」を同じ階層にまとめたZIPです。

## ルート
- `index.html`：本体。ここが起動入口です。
- `assets/`：画像・ロゴ
- `api/`：API
- `pages/`：各ページHTML素材
- `styles/`：各ページCSS素材
- `scripts/`：各ページJS素材
- `cms/`：PC用管理画面

## モジュール
```txt
pages/search/search.html
styles/search/search.css
scripts/search/search.js

pages/featured/featured.html
styles/featured/featured.css
scripts/featured/featured.js

pages/finance/finance.html
styles/finance/finance.css
scripts/finance/finance.js

cms/index.html
cms/styles.css
cms/cms.js
```

## 注意
このZIPは「本体を失わないように整理した統合前ベース」です。
まだ `index.html` に各モジュールを完全結合していません。

次の作業でやること:
1. 本体 `index.html` の `page-search` に `pages/search/search.html` の中身を入れる
2. 本体 `index.html` の `page-featured` に `pages/featured/featured.html` の中身を入れる
3. 本体 `index.html` の `page-finance` に `pages/finance/finance.html` の中身を入れる
4. `styles/...` と `scripts/...` を本体から読み込む
5. 各モジュール側の独立用下部ナビは本体統合時に外す
