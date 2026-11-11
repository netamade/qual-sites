import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { titles } from "./titles.mjs";

const check = process.argv.includes("--check");
const root = new URL("../", import.meta.url);
const source = async (file) => (await readFile(new URL(file, import.meta.url), "utf8")).replace(/\r\n/g, "\n");
const [layout, engine] = await Promise.all([source("index.html"), source("engine.js")]);
const emptyDataMarker = "// Generated empty data by node template/build.mjs";
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
    const match = /^\/\/ Generated empty data by node template\/build\.mjs\nwindow\.EXAM_DATA = ([\s\S]+);\n$/.exec(existing);
    let value;
    try {
      if (match) value = JSON.parse(match[1]);
    } catch {
      // JSON 以外の JavaScript 形式で記述した問題データも保持する。
    }
    if (!Array.isArray(value?.sets) || value.sets.length || !Array.isArray(value.questions) || value.questions.length) return;
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
  if (!/^[a-z]+$/.test(slug) || !/^#[0-9a-f]{6}$/i.test(settings.theme)) {
    throw new Error("Invalid slug or theme: " + slug);
  }
  const config = {
    bookName: settings.title + " オリジナル問題集",
    bookStatus: "書籍は発刊準備中",
    storagePrefix: "book:" + slug + ":",
    ...settings
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
    "  Content-Security-Policy: default-src 'self'; script-src 'self' " + hash(script) +
      "; style-src " + hash(style) + "; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; connect-src 'none'; font-src 'none'",
    ""
  ].join("\n");
  const data = emptyDataMarker + "\nwindow.EXAM_DATA = " + JSON.stringify({ sets: [], questions: [], config }, null, 2) + ";\n";
  const folder = "sites/" + slug + "/";
  await Promise.all([
    emit(folder + "index.html", html),
    emit(folder + "_headers", headers),
    emit(folder + "data.js", data, true)
  ]);
}
if (failed) process.exitCode = 1;
