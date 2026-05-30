# STEP206 ロゴ・画像・URL表示対応

基準: STEP205 CMS登録大会 → 試合検索反映版

## 追加内容
- CMS大会の大会ロゴ/主催者ロゴ/共通ロゴを試合検索カード左側に表示
- ロゴがない場合はカテゴリ文字表示にフォールバック
- 会場画像/大会画像がある場合はカード左側と詳細Bottom Sheetヒーローに反映
- Bottom Sheetに「エントリー」「公式サイト」「Instagram」ボタンを追加
- 固定フッターの「詳細を見る」を登録URLに合わせて「申込/公式/Instagram/URLなし」に切替
- カレンダー追加payloadにも logo/image/url 系フィールドを引き継ぎ
- カレンダー側の大会詳細にもURLボタンを追加

## 対応フィールド
- tournamentLogoUrl / logoUrl / organizerLogoUrl / organizerLogo / hostLogoUrl / seriesLogoUrl
- venueImageUrl / imageUrl / courseImageUrl / heroImageUrl / coverImageUrl
- officialUrl / url / homepage / website / webUrl
- entryUrl / applyUrl / applicationUrl / applicationFormUrl / formUrl / googleFormUrl
- instagramUrl / instagram / igUrl

## 非変更
- カレンダー本体UIの基本挙動
- 試合検索フィルター/並び替え
- STEP203/204/205の連携仕様
