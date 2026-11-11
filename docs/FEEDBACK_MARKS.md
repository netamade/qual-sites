# 正解・不正解フィードバックの図形表示 共通仕様 v1（2026-11-10）

利用者からの要望：「正解したか間違ったかが文章と色だけでは分かりにくい。正解の時は花丸、間違ったらバツが出るほうが分かりやすい」。
全問題サイトで、回答直後のフィードバックに大きな図形マークを出す。テキストと色の表示は従来どおり残し、マークを追加する。

## マーク（全サイト共通・下記のSVGをそのまま埋め込む。外部画像ファイルは使わない）

正解＝花丸（朱色の二重丸＋花びら風の内側の弧）：

```html
<svg class="fb-mark fb-hanamaru" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 6 C72 4 92 22 94 46 C96 71 78 93 53 95 C28 97 7 79 6 54 C5 29 26 8 50 6 Z" fill="none" stroke="#e03a1e" stroke-width="5" stroke-linecap="round"/><path d="M50 18 C66 17 81 30 82 47 C83 65 69 82 52 83 C35 84 19 70 18 53 C17 35 33 19 50 18 Z" fill="none" stroke="#e03a1e" stroke-width="4" stroke-linecap="round"/><path d="M38 38 C44 30 58 29 64 37 M34 55 C31 45 36 33 45 29 M66 55 C69 65 63 76 54 79 M45 68 C53 73 65 70 69 61" fill="none" stroke="#e03a1e" stroke-width="4" stroke-linecap="round"/></svg>
```

不正解＝バツ（藍色の太い×）：

```html
<svg class="fb-mark fb-batsu" viewBox="0 0 100 100" aria-hidden="true"><path d="M22 22 L78 78 M78 22 L22 78" stroke="#34548f" stroke-width="11" stroke-linecap="round" fill="none"/></svg>
```

共通CSS（各サイトの既存CSSへ追加。クラス名は上記と一致させる）：

```css
.fb-mark{width:84px;height:84px;display:block;margin:0 auto 8px;animation:fb-pop .25s ease-out}
.fb-batsu{width:64px;height:64px}
@keyframes fb-pop{0%{transform:scale(.4);opacity:0}70%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
@media (prefers-reduced-motion: reduce){.fb-mark{animation:none}}
```

## 表示ルール
- 回答して正誤が確定した瞬間、フィードバック表示エリアの先頭（テキストより上）にマークを1つ出す。
- 正解→花丸、不正解→バツ。形と色の両方で区別できることが目的。
- 対象は1問ごとの正誤判定がある全モード（択一・一問一答・ドリルの解答チェック）。結果一覧や合計スコアの画面は変更しない。
- 問題データ（data.js／問題JSON）と学習記録の形式には触れない。外部リソースは追加しない。
- PRで提出し、マージはしない（検証はクロが行う）。
