# STEP309 遠征Firestore保存実装

## 内容
localStorage保存を維持しつつ、Firestoreにも非同期保存する実装を追加。

## 保存先
`users/{userId}/expeditions/{tournamentId}`

## 方針
- 保存時はまずlocalStorageへ保存
- Firestoreが使える場合はクラウドにも保存
- Firestore失敗時は端末保存のみで継続
- 読み込み時はFirestoreに新しいデータがあればlocalStorageへ反映
- 領収書画像のDataURL本体はFirestoreに保存しない
- 画像本体は次ステップ以降でFirebase Storageへ保存予定

## UI
ヘッダー下に小さく保存状態を表示。
- 端末保存
- クラウド同期済み
- 端末保存のみ
