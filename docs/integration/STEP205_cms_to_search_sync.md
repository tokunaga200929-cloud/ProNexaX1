# STEP205 CMS登録大会 → 試合検索反映

## 目的
CMSで登録・公開した大会を、本体アプリの試合検索 iframe に正式な大会カードとして表示する。

## 実装内容
- `scripts/search/search.js` に STEP205 CMS同期ブロックを追加。
- CMSが作成する `localStorage` キー `PNX_CMS_PUBLIC_TOURNAMENTS_FOR_SEARCH` を読み取る。
- スナップショットがない場合は `PNX_CMS_TOURNAMENTS` をフォールバックで読み取り、下書き/非公開を除外する。
- CMS大会を既存の `DUMMY_TOURNAMENTS` に合流させ、既存のカードUI・検索・フィルター・カレンダー追加処理をそのまま使う。
- 同じCMS大会は `cms-{id}` の安定IDで重複登録しない。
- CMS更新時は `storage` / `postMessage` を受けて再同期できる。
- `PNXStep205CmsSearchStatus()` をコンソール確認用に追加。

## 公開対象条件
以下を満たす大会だけ試合検索に表示する。

- `published !== false`
- `visible !== false`
- `status` が `draft` / `下書き` ではない
- 大会名、開催日、会場がある

## 触っていないもの
- カレンダー本体UI
- STEP203のカレンダー追加連携
- STEP204の大会詳細Bottom Sheet
- 収支/注目/マイページ統合
- CMS画面デザイン

## 確認方法
1. `cms/index.html` を開く。
2. 大会を登録し、ステータスを `募集中(open)` など下書き以外にする。
3. CMS側で「本体へ反映」または「検索用スナップショット作成」を実行する。
4. `index.html` を開き、下部ナビの「試合検索」を表示する。
5. CMS登録大会が通常カードと同じ見た目で表示される。
6. その大会の「カレンダーに追加」を押すと、本体カレンダーにも追加される。

