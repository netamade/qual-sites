"use strict";
document.addEventListener("DOMContentLoaded", async () => {
  const fallbackConfig = /* TITLE_CONFIG */ null;
  const data = await loadData();
  const book = isObject(data?.config) ? data.config : {};
  // data.js が差し替えられても、試験情報・公式リンク・記録の保存先は生成時の設定を使う。
  const CONFIG = {
    ...fallbackConfig,
    bookName: text(book.bookName).trim() || fallbackConfig.bookName,
    bookStatus: text(book.bookStatus).trim() || fallbackConfig.bookStatus
  };
  const $ = (id) => document.getElementById(id);
  const emptyMessage = data ? "問題は順次追加中です" : "問題データを読み込めませんでした。ページを再読み込みしてください。";
  const sessionVersion = 1;
  const storagePrefix = CONFIG.storagePrefix + "v1:";
  const modes = new Map([
    ["random-choice", { title: "ランダム・択一", description: "全分野から、選択肢を選んで解く。" }],
    ["random-ichi", { title: "ランダム・一問一答", description: "全分野から、記述の正誤を答える。", ichi: true }],
    ["field-choice", { title: "分野別・択一", description: "選んだ分野を、択一で練習する。", field: true }],
    ["field-ichi", { title: "分野別・一問一答", description: "選んだ分野を、○×で練習する。", field: true, ichi: true }]
  ]);
  const fields = new Map(CONFIG.fields.map((field) => [String(field.id), field]));
  const questions = new Map();
  const memory = new Map();
  const storage = {
    read(key) {
      if (memory.has(key)) return memory.get(key);
      try {
        const raw = localStorage.getItem(storagePrefix + key);
        if (raw === null) return null;
        const parsed = JSON.parse(raw);
        if (parsed === null) this.remove(key);
        return parsed;
      } catch {
        this.remove(key);
        return null;
      }
    },
    write(key, value) {
      try {
        localStorage.setItem(storagePrefix + key, JSON.stringify(value));
        memory.delete(key);
      } catch {
        memory.set(key, structuredClone(value));
        $("storage-status").textContent = "このブラウザーでは学習記録を保存できません。";
      }
    },
    remove(key) {
      memory.delete(key);
      try {
        localStorage.removeItem(storagePrefix + key);
      } catch {
        // 保存領域にアクセスできなくても練習を続けられる。
      }
    }
  };
  let selectedMode = null;
  let active = null;

  function node(tag, value = "", className = "") {
    const element = document.createElement(tag);
    element.textContent = value;
    if (className) element.className = className;
    return element;
  }

  function button(label, action, className = "btn") {
    const element = node("button", label, className);
    element.type = "button";
    element.addEventListener("click", action);
    return element;
  }

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function text(value) {
    return typeof value === "string" ? value : "";
  }

  function numberOrText(value) {
    return Number.isFinite(value) ? value : text(value) || undefined;
  }

  function decimalInteger(value) {
    if (typeof value === "number") return value;
    return typeof value === "string" && /^\d+$/.test(value.trim()) ? Number(value) : NaN;
  }

  async function loadData() {
    try {
      const response = await fetch("./data.js", {
        mode: "same-origin", credentials: "omit", redirect: "error"
      });
      if (!response.ok) return null;
      let source = (await response.text()).trim();
      const marker = "// Generated empty data by node template/build.mjs";
      if (source.startsWith(marker + "\n") || source.startsWith(marker + "\r\n")) {
        source = source.slice(marker.length).trimStart();
      }
      // 従来の window.EXAM_DATA 形式は外枠だけ除き、中身は厳密に JSON として読む。
      const legacy = /^window\.EXAM_DATA\s*=\s*/.exec(source);
      if (legacy) source = source.slice(legacy[0].length).replace(/;\s*$/, "");
      const parsed = JSON.parse(source);
      return isObject(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  function list(value) {
    return Array.isArray(value) ? value : [];
  }

  function shuffle(values) {
    const result = values.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function localDay(now = new Date()) {
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    return jst.toISOString().slice(0, 10);
  }

  function examSchedule() {
    const today = localDay();
    const dates = CONFIG.exams;
    const next = dates.find((entry) => (entry.end || entry.date) >= today);
    const formatDate = (date) => date.replaceAll("-", "/");
    if (!next) {
      const previous = dates.at(-1);
      $("exam-status").textContent = CONFIG.scheduleNote
        ? (CONFIG.scheduleTitle ?? "受験地・種類別の日程")
        : "次回の試験日程は未確認";
      $("exam-date").textContent = CONFIG.scheduleNote ||
        (previous ? "直近の公式日程 " + formatDate(previous.end || previous.date) : "");
      return;
    }
    const days = (Date.parse(next.date) - Date.parse(today)) / 86400000;
    const range = next.end ? "〜" + formatDate(next.end) : "";
    $("exam-status").textContent = days > 0
      ? (next.end ? "試験期間開始まで " : "試験まで ") + days + "日"
      : (next.end ? "試験期間中" : "本日が試験日です");
    $("exam-date").textContent = [next.label, formatDate(next.date) + range].filter(Boolean).join("　");
  }

  function loadQuestions() {
    function add(raw, setTitle) {
      const id = raw?.id;
      if ((typeof id !== "string" && !Number.isSafeInteger(id)) || id === "") return;
      if (questions.has(String(id)) || typeof raw.question !== "string") return;
      const options = list(raw.options);
      if (options.length < 2 || !options.every((option) => typeof option === "string")) return;
      const answer = decimalInteger(raw.answer);
      if (!Number.isSafeInteger(answer) || answer < 1 || answer > options.length) return;
      const explanation = {
        summary: text(raw.explanation?.summary),
        legal_basis: list(raw.explanation?.legal_basis).filter((entry) => typeof entry === "string")
      };
      const notes = new Map();
      for (const option of list(raw.explanation?.options)) {
        const no = decimalInteger(option?.no);
        if (!Number.isSafeInteger(no) || no < 1 || no > options.length) continue;
        notes.set(no, {
          correct: option.correct, text: text(option.text),
          wrong_part: text(option.wrong_part) || text(option.wrongPart), reason: text(option.reason)
        });
      }
      questions.set(String(id), {
        id: String(id), field: String(numberOrText(raw.field) ?? ""), fieldName: text(raw.field_name),
        stem: raw.question, options, answer, explanation, notes, setTitle: text(setTitle), theme: text(raw.theme),
        difficulty: numberOrText(raw.difficulty), publishedRate: numberOrText(raw.correct_rate)
      });
    }
    for (const set of list(data?.sets)) {
      for (const question of list(set?.questions)) add(question, set.title);
    }
    for (const question of list(data?.questions)) add(question);
  }

  function statementOptions(question) {
    const options = question.options.map((text) => text.trim().normalize("NFKC"));
    const countOrCombination = /^(?:[0-9一二三四五]+\s*(?:個|つ)|[ア-オa-e](?:\s*(?:と|・|、|及び)\s*[ア-オa-e])*)$/i;
    if (options.every((text) => countOrCombination.test(text))) return [];
    const numbersRemoved = options.map((text) => text.replace(/[0-9][0-9,.]*/g, "#"));
    if (numbersRemoved[0].includes("#") && numbersRemoved.every((text) => text === numbersRemoved[0])) return [];
    return [...question.notes].filter(([no, note]) =>
      no >= 1 && no <= options.length && Number.isInteger(no) && typeof note.correct === "boolean"
    ).map(([no]) => no);
  }

  function record(id) {
    const key = "answer:" + id;
    const saved = storage.read(key);
    if (saved === null) return null;
    const attempts = decimalInteger(saved?.attempts);
    const correct = decimalInteger(saved?.correct);
    const lastCorrect = saved?.lastCorrect;
    if (!Number.isSafeInteger(attempts) || attempts < 1 ||
        !Number.isSafeInteger(correct) || correct < 0 || correct > attempts ||
        typeof lastCorrect !== "boolean" || (lastCorrect ? correct === 0 : correct === attempts)) {
      storage.remove(key);
      return null;
    }
    return { attempts, correct, lastCorrect };
  }

  function saveAnswer(id, correct) {
    const old = record(id);
    if (old?.attempts === Number.MAX_SAFE_INTEGER) return;
    storage.write("answer:" + id, {
      attempts: (old?.attempts ?? 0) + 1,
      correct: (old?.correct ?? 0) + Number(correct),
      lastCorrect: correct
    });
  }

  function renderStats() {
    const stats = new Map(CONFIG.fields.map((field) => [String(field.id), { ...field, total: 0, answered: 0, correct: 0 }]));
    for (const question of questions.values()) {
      const stat = stats.get(question.field);
      if (!stat) continue;
      stat.total++;
      const answer = record(question.id);
      if (!answer) continue;
      stat.answered++;
      stat.correct += Number(answer.lastCorrect);
    }
    const rows = [...stats.values()];
    $("field-stats").replaceChildren(...rows.map((stat, index) => {
      const row = node("tr");
      const heading = node("th", (index + 1) + "　" + stat.name);
      heading.scope = "row";
      row.append(heading, node("td", stat.answered + " / " + stat.total),
        node("td", stat.answered ? Math.round(stat.correct / stat.answered * 100) + "%" : "—"));
      return row;
    }));
    $("radar-note").textContent = rows.some((stat) => stat.answered)
      ? "習熟度 = 最新解答が正解の問題数 ÷ 収録数"
      : "まだ学習データがありません";
    drawRadar(rows);
  }

  function drawRadar(rows) {
    const canvas = $("radar");
    const ctx = canvas.getContext("2d");
    if (!ctx || rows.length < 3) return;
    const center = canvas.width / 2;
    const radius = center * .80;
    const point = (i, value) => {
      const angle = i * 2 * Math.PI / rows.length - Math.PI / 2;
      return [center + radius * value * Math.cos(angle), center + radius * value * Math.sin(angle)];
    };
    function polygon(values) {
      ctx.beginPath();
      values.forEach((value, i) => {
        const position = point(i, value);
        if (i === 0) ctx.moveTo(...position);
        else ctx.lineTo(...position);
      });
      ctx.closePath();
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#cddad4";
    for (const scale of [.25, .5, .75, 1]) {
      polygon(rows.map(() => scale));
      ctx.stroke();
    }
    rows.forEach((_, i) => {
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(...point(i, 1));
      ctx.stroke();
    });
    // 軸番号と表の行順を揃え、分野が多い場合もラベルの重なりを避ける。
    ctx.font = "600 22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#50635e";
    rows.forEach((_, i) => ctx.fillText(String(i + 1), ...point(i, 1.13)));
    if (rows.some((stat) => stat.answered)) {
      const values = rows.map((stat) => stat.total ? stat.correct / stat.total : 0);
      polygon(values);
      ctx.fillStyle = CONFIG.theme + "38";
      ctx.fill();
      ctx.strokeStyle = CONFIG.theme;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = CONFIG.theme;
      values.forEach((value, i) => {
        ctx.beginPath();
        ctx.arc(...point(i, value), 5, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }

  function notice(message, focus = false) {
    $("practice-notice").textContent = message;
    $("practice-notice").hidden = !message;
    if (focus) $("practice-title").focus();
  }

  function setPicker(mode) {
    selectedMode = mode;
    $("field-form").hidden = !mode;
    for (const control of $("modes").children) {
      if (control.hasAttribute("aria-pressed")) {
        control.setAttribute("aria-pressed", String(control.value === mode));
      }
    }
  }

  function openMode(id) {
    if (!modes.get(id).field) {
      setPicker(null);
      start(id);
      return;
    }
    setPicker(id);
    notice(questions.size ? "" : emptyMessage);
    $("field").focus();
  }

  function sessionKey(mode, field) {
    return "session:" + mode + (field ? ":" + field : "");
  }

  function validSession(session, mode, field) {
    if (!isObject(session) || session.mode !== mode || session.field !== field) return false;
    // 初版にはバージョンがない。以降は読み取れる形式を明示して扱う。
    if (session.version !== undefined && session.version !== sessionVersion) return false;
    const { items, position, correct, result } = session;
    if (!Array.isArray(items) || !items.length || items.length > questions.size ||
        !Number.isSafeInteger(position) || position < 0 || position > items.length ||
        !Number.isSafeInteger(correct) || correct < 0) return false;
    if (mode === "daily" ? items.length !== 1 || session.date !== localDay() : session.date !== null) return false;

    const seen = new Set();
    const ichi = modes.get(mode)?.ichi === true;
    for (const item of items) {
      const question = questions.get(item?.id);
      if (!isObject(item) || !question || seen.has(item.id) || (field && question.field !== field)) return false;
      if (ichi ? !statementOptions(question).includes(item.option) : item.option != null) return false;
      seen.add(item.id);
    }

    if (result === null) return correct <= position;
    if (position === items.length || !isObject(result) || typeof result.correct !== "boolean" ||
        !Array.isArray(result.order)) return false;
    const item = items[position];
    const question = questions.get(item.id);
    const choices = ichi ? [true, false] : question.options.map((_, index) => index + 1);
    if (result.order.length !== choices.length) return false;
    const order = new Set(result.order);
    if (order.size !== choices.length || !choices.every((choice) => order.has(choice)) || !order.has(result.value)) return false;
    const expected = ichi ? question.notes.get(item.option).correct : question.answer;
    const currentCorrect = Number(result.correct);
    return result.correct === (result.value === expected) && correct >= currentCorrect &&
      correct - currentCorrect <= position;
  }

  function currentSession(mode, field = "") {
    const key = sessionKey(mode, field);
    const session = storage.read(key);
    if (session === null) return null;
    if (!validSession(session, mode, field)) {
      storage.remove(key);
      return null;
    }
    return { ...session, version: sessionVersion };
  }

  function resumeSession() {
    const key = storage.read("resume");
    if (key === null) return null;
    if (typeof key === "string") {
      const [, mode, field = ""] = key.split(":");
      const validMode = mode === "daily" || modes.has(mode);
      const validField = modes.get(mode)?.field ? fields.has(field) : field === "";
      if (validMode && validField && key === sessionKey(mode, field)) {
        const session = currentSession(mode, field);
        if (session && session.position < session.items.length) return { key, session };
      }
    }
    storage.remove("resume");
    return null;
  }

  function createSession(mode, field, items, date = null) {
    return { version: sessionVersion, mode, field, items, date, position: 0, correct: 0, result: null };
  }

  function start(mode, field = "") {
    const key = sessionKey(mode, field);
    const previous = currentSession(mode, field);
    if (previous && previous.position < previous.items.length) {
      openSession(key, previous);
      return;
    }
    const eligible = [...questions.values()].filter((question) => !field || field === question.field);
    const items = shuffle(eligible).flatMap((question) => {
      if (!modes.get(mode).ichi) return [{ id: question.id }];
      const options = statementOptions(question);
      return options.length ? [{ id: question.id, option: shuffle(options)[0] }] : [];
    });
    if (!items.length) {
      notice(questions.size ? "このモードで出題できる問題は順次追加中です" : emptyMessage);
      return;
    }
    openSession(key, createSession(mode, field, items));
  }

  function dailyQuestion() {
    const key = sessionKey("daily");
    const existing = currentSession("daily");
    if (existing) {
      openSession(key, existing);
      return;
    }
    if (!questions.size) {
      notice(emptyMessage, true);
      return;
    }
    const date = localDay();
    // 日付変更は日本時間の午前0時。
    let hash = 2166136261;
    for (const letter of CONFIG.storagePrefix + date) hash = Math.imul(hash ^ letter.charCodeAt(0), 16777619);
    const ids = [...questions.keys()].sort();
    const id = ids[(hash >>> 0) % ids.length];
    openSession(key, createSession("daily", "", [{ id }], date));
  }

  function modeTitle(session) {
    return session.mode === "daily" ? "今日のランダム問題" : modes.get(session.mode).title;
  }

  function storeSession() {
    storage.write(active.key, active.session);
    storage.write("resume", active.key);
  }

  function openSession(key, session) {
    active = { key, session };
    storeSession();
    $("home").hidden = true;
    $("home-nav").hidden = true;
    $("quiz").hidden = false;
    renderQuiz(true);
  }

  function showHome() {
    active = null;
    $("quiz").hidden = true;
    $("home").hidden = false;
    $("home-nav").hidden = false;
    examSchedule();
    renderStats();
    const saved = resumeSession();
    const resume = $("resume");
    resume.hidden = !saved;
    if (saved) resume.textContent = "続きから · " + modeTitle(saved.session);
  }

  function makeExplanation(question, item, result) {
    const feedback = node("section", "", "feedback");
    feedback.setAttribute("aria-label", "答え合わせ");
    feedback.tabIndex = -1;
    const mark = $(result.correct ? "correct-mark" : "incorrect-mark").content.cloneNode(true);
    const answer = item.option == null
      ? "正解は選択肢 " + (result.order.indexOf(question.answer) + 1)
      : "答えは " + (question.notes.get(item.option).correct ? "○（正しい）" : "×（誤り）");
    const verdict = node("h3", (result.correct ? "正解" : "不正解") + "　" + answer,
      "verdict " + (result.correct ? "ok" : "ng"));
    feedback.append(mark, verdict);
    if (item.option == null && question.explanation.summary) {
      feedback.append(node("p", "解説本文の番号は、並べ替え前の肢番号です。", "muted"));
      feedback.append(node("p", question.explanation.summary, "explanation-text"));
    }
    const notes = node("ul");
    const order = item.option == null ? result.order : [item.option];
    for (const [index, no] of order.entries()) {
      const note = question.notes.get(no);
      if (!note) continue;
      const line = node("li");
      const label = item.option == null
        ? "選択肢 " + (index + 1) + "（元の肢 " + no + (no === question.answer ? "・正解" : "") + "）"
        : "解説";
      line.append(node("strong", label));
      if (note.wrong_part) line.append(node("p", "×箇所　" + note.wrong_part, "explanation-text"));
      if (note.reason) line.append(node("p", "×理由　" + note.reason, "explanation-text"));
      if (note.text) line.append(node("p", note.text, "explanation-text"));
      notes.append(line);
    }
    if (notes.children.length) feedback.append(notes);
    const legalBasis = list(question.explanation.legal_basis);
    if (legalBasis.length) {
      const sources = node("ul");
      for (const text of legalBasis) sources.append(node("li", text));
      feedback.append(node("h3", "根拠条文・情報"), sources);
    }
    return feedback;
  }

  function renderQuiz(focusHeading = false) {
    const { session } = active;
    const quiz = $("quiz");
    const homeButton = button("練習トップへ", () => {
      showHome();
      $("practice-title").focus();
    });
    const heading = node("h2", modeTitle(session), "quiz-heading");
    heading.tabIndex = -1;
    const card = node("div", "", "card");
    card.append(heading);
    quiz.replaceChildren(homeButton, card);
    if (session.position >= session.items.length) {
      card.append(node("p", session.correct + " / " + session.items.length + " 問正解"));
      if (session.mode !== "daily") {
        const actions = node("div", "", "actions");
        actions.append(button("もう一度練習する", () => start(session.mode, session.field), "btn primary"));
        card.append(actions);
      }
      heading.focus();
      return;
    }

    const item = session.items[session.position];
    const question = questions.get(item.id);
    const result = session.result;
    const progress = node("progress");
    progress.max = session.items.length;
    progress.value = session.position + Number(Boolean(result));
    progress.setAttribute("aria-label", "練習の進捗");
    const saved = record(question.id);
    const rate = saved ? Math.round(saved.correct / saved.attempts * 100) + "%" : "未解答";
    const meta = node("div", "", "quiz-meta");
    const labels = [
      (session.position + 1) + " / " + session.items.length + " 問",
      fields.get(question.field)?.name ?? question.fieldName, question.setTitle, question.theme,
      "正答率（自分） " + rate, "難易度 " + (question.difficulty ?? "未設定")
    ];
    if (question.publishedRate != null) {
      const published = question.publishedRate;
      labels.push("正答率（出題データ） " + (typeof published === "number" ? published + "%" : published));
    }
    meta.append(...labels.filter(Boolean).map((label) => node("span", label)));
    card.append(progress, meta, node("p", item.option == null ? question.stem : question.options[item.option - 1], "stem"));
    if (item.option != null) {
      const details = node("details", "", "details");
      details.append(node("summary", "元の問題文を確認"), node("p", question.stem, "explanation-text"));
      card.append(details);
    }
    const choices = node("div", "", "choices");
    const order = result?.order ?? (item.option == null ? shuffle(question.options.map((_, i) => i + 1)) : [true, false]);
    const expected = item.option == null ? question.answer : question.notes.get(item.option).correct;
    for (const [index, value] of order.entries()) {
      const label = item.option == null ? (index + 1) + ". " + question.options[value - 1] : (value ? "○ 正しい" : "× 誤り");
      const control = button(label, () => {
        if (session.result) return;
        const correct = value === expected;
        session.result = { correct, value, order };
        session.correct += Number(correct);
        saveAnswer(question.id, correct);
        storeSession();
        renderQuiz();
      }, "btn choice");
      if (result) {
        control.disabled = true;
        if (value === expected) control.classList.add("right");
        else if (value === result.value) control.classList.add("wrong");
      }
      choices.append(control);
    }
    card.append(choices);
    if (result) {
      const feedback = makeExplanation(question, item, result);
      const actions = node("div", "", "actions");
      const label = session.position + 1 === session.items.length ? "結果を見る" : "次の問題へ";
      actions.append(button(label, () => {
        session.position++;
        session.result = null;
        storeSession();
        renderQuiz(true);
      }, "btn primary"));
      card.append(feedback, actions);
      if (!focusHeading) feedback.focus();
    }
    if (focusHeading) heading.focus();
  }

  loadQuestions();
  $("book-subtitle").textContent = "『" + CONFIG.bookName + "』連動 練習サイト";
  $("book-name").textContent = "『" + CONFIG.bookName + "』";
  $("book-status").textContent = CONFIG.bookStatus;
  $("exam-name").textContent = CONFIG.examName;
  $("pass-line").textContent = CONFIG.passLine ?? "合格基準は未確認";
  for (const [label, url] of CONFIG.sources) {
    let address;
    try {
      address = new URL(url);
    } catch {
      continue;
    }
    if (address.protocol !== "https:") continue;
    const entry = node("li");
    const link = node("a", label);
    link.href = address.href;
    entry.append(link);
    $("sources").append(entry);
  }
  $("question-count").textContent = "収録 " + questions.size + " 問";
  for (const [id, mode] of modes) {
    const control = button(mode.title, () => openMode(id), "mode");
    control.append(node("span", mode.description));
    control.value = id;
    if (mode.field) control.setAttribute("aria-pressed", "false");
    $("modes").append(control);
  }
  for (const field of CONFIG.fields) {
    const option = node("option", field.name);
    option.value = String(field.id);
    $("field").append(option);
  }
  $("field-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (selectedMode) start(selectedMode, $("field").value);
  });
  $("daily").addEventListener("click", dailyQuestion);
  $("daily").disabled = false;
  $("resume").addEventListener("click", () => {
    const saved = resumeSession();
    if (saved) openSession(saved.key, saved.session);
    else showHome();
  });
  $("home-link").addEventListener("click", (event) => {
    if (!active) return;
    event.preventDefault();
    showHome();
    $("practice-title").focus();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !active) showHome();
  });
  setInterval(examSchedule, 60000);
  notice(questions.size ? "" : emptyMessage);
  showHome();
});
