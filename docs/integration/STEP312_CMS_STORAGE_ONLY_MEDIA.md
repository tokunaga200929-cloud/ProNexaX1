# STEP312 CMSメディア Firebase Storage運用

## 目的
localStorageの `PNX_CMS_MEDIA` が大きくなり、CMSで大会追加できなくなる問題を防ぐ。

## 修正内容
- CMS画像保存はFirebase Storage成功時のみ反映
- Storage失敗時にbase64/dataUrlをlocalStorageへ保存しない
- `PNX_CMS_MEDIA` 保存時に `dataUrl` / `data:` / `blob:` を除去
- メディア一覧はURL/StoragePath/ID/メタ情報だけを保持
- 既存の重い `PNX_CMS_MEDIA` を軽量化する関数を追加

## 既存データの軽量化
CMS画面のConsoleで以下を実行。

```js
PNXCmsFinalDesignBridge.cleanupMediaStorage()
```

## 確認
```js
new Blob([localStorage.getItem("PNX_CMS_MEDIA") || ""]).size / 1024 / 1024
```

これが大きく下がればOK。
