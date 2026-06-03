# STEP316 保存済み遠征ボタン崩れ修正

## 修正内容
STEP315で保存済み遠征の「すべて見る」ボタンがブラウザ標準ボタン化し、矢印SVGが巨大化する問題を修正。

## 変更
- `.exp-home-section-head` をflexに固定
- すべて見るボタンのappearance/border/backgroundをリセット
- svgサイズを14pxに固定
- 保存済み遠征カードのテキスト詰まりを軽く改善
