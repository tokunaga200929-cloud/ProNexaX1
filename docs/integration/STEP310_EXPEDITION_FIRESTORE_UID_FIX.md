# STEP310 遠征Firestore UID修正

## 修正内容
STEP309で遠征保存がFirestoreに表示されない可能性があったため、以下を修正。

- ログインユーザーID取得で `PNXAuthBridge.currentUser.uid` を優先
- Firebase Auth currentUser も参照
- `PNX_DATA_MODE` に依存しすぎず、Firebase設定がある場合は遠征保存時にFirestore保存を試す
- 保存成功時に Console に保存パスを表示

## 確認
遠征でメモなどを編集して保存後、Consoleに以下のようなログが出ればOK。

`[expedition] Firestore saved: users/{uid}/expeditions/{tournamentId}`

Firestore Consoleでは

`users > {uid} > expeditions > {tournamentId}`

を確認。
