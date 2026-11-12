# 発注書：資格サイトの DB 対応（試行：shobo-4）

発行：2026-11-13（クロ）
対象リポジトリ：netamade/qual-sites
担当：Codex（作業ごとに新規タスクで実施すること）
設計の正本：SKILL QUEST 側ゴール資料「DB移行拡大と作問ボード-基本設計」第3章。要点は本書に転記してある。

## 背景

- 資格サイト16系統は template/（build.mjs／engine.js／index.html／titles.mjs）から生成される静的サイトで、現在は全系統とも問題0問（data.js の questions は空）。
- 問題の配信を Cloudflare D1 の読み取り専用 API に寄せる。API は稼働済み：
  `GET https://sq-questions-api.sola-labo.workers.dev/v1/tools/{tool}/questions`
  （status='checked' の問題だけを既存スキーマの JSON で返す。書き込み口はない）
- 公開のタイミングは「D1 へ投入するかどうか」で管理する。**サイト側の DB 対応そのものは公開行為ではなく、D1 が0件の限り表示は従来と完全同一**であることが必須条件。

## 変更内容

### 1. CSP の変更（template の生成元 build.mjs）
- 現行 _headers の CSP は `connect-src 'self'` で、API への fetch が遮断される。
- `connect-src 'self' https://sq-questions-api.sola-labo.workers.dev` に変更する。変更は build.mjs 内のヘッダ生成の1か所だけとし、手で各サイトの _headers を編集しない。
- API 以外の外部接続は引き続き開けない（default-src 'none' 等の現行方針を維持）。

### 2. tool キーの埋め込み（build.mjs／titles.mjs）
- 各サイトの生成時設定（CONFIG）に、そのタイトルの tool キーを埋め込む。キーは `qual-` + スラッグ（例：shobo-4 → `qual-shobo-4`）とし、titles.mjs のスラッグから機械的に生成する。手書きの対応表は作らない。

### 3. データ読み込みの拡張（template/engine.js）
- 現行の loadData() を次の順序に拡張する：
  1. data.js を従来どおり取得する（config／sets の正はこちら）。取得できなければ現行どおり null 扱い。 API `GET /v1/tools/qual-<slug>/questions` を取得する（失敗・タイムアウトは無視する）。 **API の questions が1問以上ならそれを問題データとして採用する。0件または取得失敗なら data.js の questions を使う**（現在は常に空＝従来表示）。
- タイムアウトの目安は数秒とし、API が応答しない場合でも従来表示が大きく遅れないようにする。

### 4. 生成物の再生成
- template の変更を反映し、build.mjs で全16サイト分を再生成して、生成物も同じ PR に含める。生成後は build の `--check` で不整合が無いことを確認する。
- data.js 本体（問題データ）には触らない（preserveData の仕組みを壊さない）。

## ローカル検証（PR 本文に結果を書くこと）
ダミー問題（実問題形式・ローカル限定）を使い、次を確認する：
- API から問題が返る状態で、shobo-4 の画面に問題が出て解ける。
- API が0件・取得失敗の状態では、従来どおりの0問表示になる。
- CSP に遮断されず API へ接続できる（ブラウザのコンソールに CSP 違反が出ない）。
- 他の系統（任意の1つ）でも生成物の差分が template 由来のみで、表示が従来と変わらない。

## 禁止事項
- 本番（sora-lab-443 等）へのデプロイはしない。デプロイはクロが行う。
- D1 への問題投入はしない。試作用の問題を本番 API に載せない。
- セキュリティ設定を CSP の connect-src 追加以外に変更しない（スクリプト／スタイルのハッシュ方式、default-src 'none' 等は維持）。
- 既存の画面デザイン・文言の変更。

## 完了条件
- PR を作成し、変更点と上記のローカル検証結果を PR 本文に書くこと。
- PR には template の変更と全サイト分の再生成物を含めること（デプロイは含まない）。
