# 発注書：消防設備士の各類分割＋再開発プランナー追加（qual-sites）

2026-11-11、発注者：クロ。担当：Codex。
正本仕様は repo の docs/SPEC.md・docs/COMMON_SPEC.md・docs/FEEDBACK_MARKS.md。本書と矛盾する場合は docs 側が優先。
現在の main は PR #2 マージ済み（042958e9）。構成は template/（build.mjs／engine.js／index.html／titles.mjs）から sites/<id>/ を生成する形。

## 作業内容

### 1. template/titles.mjs の変更

(a) 既存の `shobo` エントリを削除し、以下の8エントリを追加する。

共通設定（8件とも）：
- theme: "#913f36"（現 shobo と同じ。シリーズで色を統一）
- exams: []（現 shobo と同じ）
- scheduleNote: "試験日は都道府県・受験する種類により異なります。"（現 shobo と同じ）
- sources: 現 shobo と同じ3件（都道府県別の試験案内／試験科目／合格基準）

個別設定：
- `shobo-toku`： title "消防設備士 特類"、examName "消防設備士試験（甲種特類）"、fields = 消防関係法令／構造・機能及び工事・整備／火災及び防火に係る知識、passLine "筆記は各科目40%以上かつ全体60%以上（実技なし）"
- `shobo-1` 〜 `shobo-7`： title "消防設備士 第N類"（N=1〜7）、examName "消防設備士試験（第N類）"、fields = 消防関係法令／基礎的知識／構造・機能及び工事・整備／実技（鑑別等・製図）、passLine "筆記は各科目40%以上かつ全体60%以上。実技も60%以上"

（分野は消防試験研究センターの公式科目に基づく。甲種・乙種は分野で分けない。）

(b) 再開発プランナーを1件追加する。
- ID: `saikaihatsu`
- title: "再開発プランナー"、examName: "再開発プランナー試験"
- theme: "#8c6a2f"
- fields: 再開発に係る法律等／都市計画法等関連法規／不動産関連法規／評価・補償／実技（事業計画・権利変換）
- exams: []、scheduleNote: "試験は年1回です。日程は年度ごとに実施団体が公表します。"
- passLine: "2026年度実績　学科・実技とも科目基準点以上、かつ合計121点以上（200点満点）"
- sources: ["試験案内" https://www.urca.or.jp/planner/test_all.html ／ "試験情報" https://www.urca.or.jp/planner/test.html ／ "Q&A" https://www.urca.or.jp/planner/faq.html ]（実施団体＝一般社団法人 再開発コーディネーター協会）

### 2. 再生成と旧フォルダの削除
- `node template/build.mjs` で全サイトを再生成する。
- `sites/shobo/` は削除する（新しい8フォルダに置き換え）。
- 変更していない既存タイトル（takken／kanrishi／shunin／ishuu／sharoshi／gyosei／denko）の生成結果に差分が出た場合は、原因を PR 本文に書く（原則として差分ゼロのはず）。

### 3. 検証（実施して PR 本文に結果を書く）
- `node template/build.mjs --check` が通ること。
- 新規9サイトとも、フォルダ内のファイル構成が既存サイトと同じで、問題0件であること。
- 各サイトのタイトル・分野・合格ライン表示が上記設定どおりであること。

### 4. PR
- main 向けの PR を作成し、URL を報告する。**マージはしない**（検証とマージはクロが行う）。
- template のエンジン側（engine.js／index.html／build.mjs）は原則変更しない。変更が必要だった場合は、その理由を PR 本文に明記する。

## 補足
- localStorage の接頭辞は build の既存方式（book:<id>:v1:）が自動で効く想定。追加の手当てが要る場合は PR 本文で知らせる。
- デプロイ（Cloudflare Pages）はクロがマージ後に行うので、この発注の範囲外。
