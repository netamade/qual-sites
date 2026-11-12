import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { titles } from "./titles.mjs";

const check = process.argv.includes("--check");
const root = new URL("../", import.meta.url);
const source = async (file) => (await readFile(new URL(file, import.meta.url), "utf8")).replace(/\r\n/g, "\n");
const [layout, engine] = await Promise.all([source("index.html"), source("engine.js")]);
const emptyDataMarker = "qual-sites-empty-v1";
const legacyEmptyData = /^\/\/ Generated empty data by node template\/build\.mjs\nwindow\.EXAM_DATA = ([\s\S]+);\n$/;
const htmlText = (value) => value.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char]));
const hash = (value) => "'sha256-" + createHash("sha256").update(value).digest("base64") + "'";
let failed = false;

async function emit(file, expected, preserveData = false) {
  const destination = new URL(file, root);
  let existing;
  try {
    existing = (await readFile(destination, "utf8")).replace(/\r\n/g, "\n");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (existing === expected) return;
  if (preserveData && existing != null) {
    // 問題を投入済みの data.js は、空データ生成の対象から外す。
    const legacy = legacyEmptyData.exec(existing);
    let value;
    try {
      value = JSON.parse(legacy ? legacy[1] : existing);
    } catch {
      // 手書きのファイルは生成処理では書き換えない。
      return;
    }
    if ((!legacy && value?._generatedBy !== emptyDataMarker) ||
        !Array.isArray(value?.sets) || value.sets.length ||
        !Array.isArray(value.questions) || value.questions.length) return;
  }
  if (check) {
    failed = true;
    console.error("Generated file is missing or outdated: " + file);
    return;
  }
  await mkdir(new URL("./", destination), { recursive: true });
  await writeFile(destination, expected, "utf8");
}

for (const [slug, settings] of Object.entries(titles)) {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug) || !/^#[0-9a-f]{6}$/i.test(settings.theme)) {
    throw new Error("Invalid slug or theme: " + slug);
  }
  const config = {
    bookName: settings.title + " オリジナル問題集",
    bookStatus: "書籍は発刊準備中",
    storagePrefix: "book:" + slug + ":",
    ...settings,
    tool: "qual-" + slug
  };
  const configJSON = JSON.stringify(config, null, 2);
  const html = layout
    .replace("{{PAGE_TITLE}}", () => htmlText(config.title + " | 書籍連動 練習サイト"))
    .replace("{{EXAM_TITLE}}", () => htmlText(config.title))
    .replace("{{THEME}}", () => config.theme)
    .replace("{{ENGINE}}", () => engine.trimEnd().replace("/* TITLE_CONFIG */ null",
      () => configJSON.replaceAll("<", "\\u003c")));
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const style = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  const headers = [
    "/*",
    "  X-Content-Type-Options: nosniff",
    "  X-Frame-Options: DENY",
    "  Referrer-Policy: no-referrer",
    "  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), display-capture=()",
    "  Cross-Origin-Opener-Policy: same-origin",
    "  Content-Security-Policy: default-src 'none'; script-src " + hash(script) +
      "; style-src " + hash(style) + "; connect-src 'self' https://sq-questions-api.sola-labo.workers.dev; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
    "",
    "/data.js",
    "  Content-Type: application/json; charset=utf-8",
    ""
  ].join("\n");
  const data = JSON.stringify({
    _generatedBy: emptyDataMarker,
    sets: [],
    questions: [],
    config: { bookName: config.bookName, bookStatus: config.bookStatus }
  }, null, 2) + "\n";
  const folder = "sites/" + slug + "/";
  await Promise.all([
    emit(folder + "index.html", html),
    emit(folder + "_headers", headers),
    emit(folder + "data.js", data, true)
  ]);
}
if (failed) process.exitCode = 1;
