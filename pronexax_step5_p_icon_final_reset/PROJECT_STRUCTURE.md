# ProNexaX 統合ベース構成

このzipは、完成済みカレンダー本体を壊さずに、後から以下を統合するための土台です。

- 試合検索: `page-search`
- 収支: `page-finance`
- 広告/注目: `page-featured`
- CMS/管理: `page-admin`

## 基本構成

```txt
index.html
manifest.json
sw.js
vercel.json
api/
assets/
  images/
  logos/
styles/
  core/
scripts/
  core/
pages/
components/
legacy/
```

## 絶対に守ること

- カレンダー本体を直接大きく崩さない
- 旧検索・旧管理コードは削除せず legacy 扱い
- 新機能は `page-search`, `page-finance`, `page-featured`, `page-admin` に追加
- CSS/JSは今後 `styles/` と `scripts/` に分離していく

## 次の統合順

1. 試合検索
2. 広告/注目
3. 収支
4. CMS
