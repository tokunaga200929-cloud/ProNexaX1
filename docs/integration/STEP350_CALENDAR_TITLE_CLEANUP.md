# STEP350 試合検索 → カレンダー追加時の大会名整形

## 内容
試合検索カードの「カレンダーに追加」を押した時、カレンダー表示用タイトルだけを見やすく整形する。

## 目的
月表示の予定チップで「第11回」などだけが見えて分かりづらくなる問題を解消。

## 例
- 第11回 DOCUS OPEN Tournament 2026 Powered by ゴルフパートナー
  → DOCUS OPEN Tournament
- 第56回 中四国オープンゴルフ選手権
  → 中四国オープン選手権
- 2026 JGTO ファーストQT① 太平洋クラブ佐野ヒルクレストコース
  → JGTO ファーストQT① 太平洋クラブ佐野ヒルクレストコース
- PGA資格認定プロテスト系
  → PGAプロテスト表記を残す

## 変更方針
- 試合検索カード上の正式大会名は変更しない
- カレンダー登録時だけ `calendarTitle` を送る
- カレンダー側は `calendarTitle` を `title/chipLabel/chipLines` に使用
- 詳細説明には `officialName/originalName` を残す
