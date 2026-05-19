# STEP5 Pアイコン最終リセット版

Pアイコンが二重・三重に見える原因は、過去の `.p-tab-icon` / `.center-tab::before` 系CSSが複数残って後勝ちしていた可能性が高いです。

この版では、`head` の最後に `#pnx-p-icon-final-reset` を追加し、中央Pだけを最終的に強制リセットしています。

## 修正内容

- 外側のCSS丸 `::before / ::after` を完全無効化
- 画像だけ48pxで表示
- ボタン本体は56px
- 影は画像にだけ薄く付与
- active時にも余計な丸が出ないよう固定

## 開くファイル

```txt
index.html
```
