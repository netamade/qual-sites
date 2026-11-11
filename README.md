# 資格問題集の書籍連動 練習サイト

共通仕様は [SPEC](docs/SPEC.md)、[COMMON_SPEC](docs/COMMON_SPEC.md)、[FEEDBACK_MARKS](docs/FEEDBACK_MARKS.md) を参照。

## 生成

Node.js 18 以上で `node template/build.mjs` を実行する。タイトル設定、公式資料のリンク、未確認事項は `template/titles.mjs` にある。出力の整合性は `node template/build.mjs --check` で確認できる。

各 `sites/<タイトルID>/` が独立したデプロイ単位。Cloudflare Pages のダイレクトアップロードには、対象サイトの `index.html`、`data.js`、`_headers` が ZIP のルート直下に来るように圧縮する。テンプレート更新時は CSP のハッシュも再生成されるため、`index.html` と `_headers` を同じ生成結果から使う。

## 問題の追加

各サイトの `data.js` を `window.EXAM_DATA = { sets: [...], questions: [...] };` 形式で置き換える。既存サイトと同様の `sets[].questions` と、トップレベルの `questions` の両方を読める。問題が入ったファイルは再生成時も保持される。差し替え時に `config` を省略すると、`index.html` に生成された最新のタイトル設定が使われる。

- `id` はサイト内で一意な固定値とし、追加・並べ替えの際も変えない。択一の `options` は文字列の配列、`answer` は元の選択肢の1始まりの番号。
- `field` は `template/titles.mjs` にある当該タイトルの分野ID。分野は定義順で1から始まる。
- `explanation` は `summary`、`options`、`legal_basis` を持てる。肢別の解説は元の肢番号 `no`、肢の記述自体の真偽 `correct`、解説 `text` を使う。必要に応じて `wrong_part` と `reason` を指定する。本文の真偽を単独で判断できる肢が一問一答の対象になる。
- `difficulty` と `correct_rate` は任意。数値の `correct_rate` は0〜100の百分率。ブラウザー内の正答率も表示する。

学習記録はタイトルごとに `book:<タイトルID>:v1:` で始まるキーに保存される。
