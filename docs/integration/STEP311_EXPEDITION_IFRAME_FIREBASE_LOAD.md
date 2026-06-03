# STEP311 遠征iframe Firebase読み込み修正

## 原因
遠征機能は iframe（pages/expedition/embed.html）内で動いているため、親のindex.htmlではなくiframe内にもFirebase関連スクリプトを読み込む必要がある。

STEP309/310では遠征JS側にFirestore保存処理は入っていたが、embed.htmlで `PNXFirebaseApp` が読み込まれていないため、Firestore保存が実行されなかった可能性が高い。

## 修正
pages/expedition/embed.html に以下を追加。

- firestore-config.js
- firebase-sdk-loader.js
- firebase-app.js
- auth-bridge.js
- firestore-bridge.js

## 確認
遠征画面でメモなどを保存後、Consoleに以下が出ればOK。

`[expedition] Firestore saved: users/{uid}/expeditions/{tournamentId}`
