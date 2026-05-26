# Tournament logo assets

ロゴ画像をここに置くと、試合検索カード左側に自動表示できます。

想定ファイル:

```txt
assets/logos/tournaments/atp-golf-tour.png
assets/logos/tournaments/fj-tour.png
assets/logos/tournaments/nagata-cup.png
assets/logos/tournaments/pref-open.png
```

## 重要

SIDE STEP A-4bでは、画像ファイルが未配置のローカルロゴは読み込まないようにしています。
これにより、Consoleの 404 Not Found を防ぎます。

実際に画像を追加した場合は、`pages/search/script.js` の `AVAILABLE_LOGO_ASSETS` に同じパスを追加してください。

例:

```js
const AVAILABLE_LOGO_ASSETS = [
  "assets/logos/tournaments/atp-golf-tour.png",
  "assets/logos/tournaments/fj-tour.png"
];
```
