// 試験情報の確認日 2026-11-11。書名は各資格名を使った仮称。
// 分野名は公式の出題範囲を学習用に短く表記。IDは問題データの field に対応する。
function fields(...names) {
  return names.map((name, index) => ({ id: index + 1, name }));
}

const retio = "https://www.retio.or.jp/exam/";
const mankan = "https://www.mankan.org/";
const kanrikyo = "https://www.kanrikyo.or.jp/";
const sharoshi = "https://www.sharosi-siken.or.jp/";
const gyosei = "https://www.gyosei-shiken.or.jp/doc/guide/guide.html";
const denko = "https://www.shiken.or.jp/construction/second/";
const shobo = "https://www.shoubo-shiken.or.jp/shoubou/";
const denkoSchedule = "https://www.shiken.or.jp/ecee-overview/news/upload/";
const planner = "https://www.urca.or.jp/planner/";

const shoboSettings = {
  theme: "#913f36",
  exams: [],
  scheduleNote: "試験日は都道府県・受験する種類により異なります。",
  sources: [
    ["都道府県別の試験案内", shobo],
    ["試験科目", shobo + "annai/subject.html"],
    ["合格基準", shobo + "annai/way.html"]
  ]
};

const shoboNumberedSettings = {
  ...shoboSettings,
  fields: fields("消防関係法令", "基礎的知識", "構造・機能及び工事・整備", "実技（鑑別等・製図）"),
  passLine: "筆記は各科目40%以上かつ全体60%以上。実技も60%以上"
};

export const titles = {
  takken: {
    title: "宅地建物取引士",
    examName: "宅地建物取引士資格試験",
    theme: "#1c6255",
    fields: fields("権利関係", "宅建業法", "法令上の制限", "税・その他"),
    // 2027年度の試験日は未確認。前回の公式日程を保持する。
    exams: [{ date: "2026-10-18" }],
    // 2026年度合否判定基準の発表は2026-11-25予定。
    passLine: "2025年度実績　50問中33問以上（5問免除者は45問中28問以上）",
    sources: [
      ["試験案内", retio + "schedule/"],
      ["2025年度合否判定基準", "https://goukaku.retio.or.jp/exam/pdf_2025_1_UWbaZCx6hm/2025answer.pdf"]
    ]
  },
  kanrishi: {
    title: "マンション管理士",
    examName: "マンション管理士試験",
    theme: "#444b89",
    fields: fields("管理に関する法令・実務", "管理組合の運営", "建物・設備", "マンション管理適正化法"),
    // 2027年度の試験日は未確認。
    exams: [{ date: "2026-11-29" }],
    // 2026年度合格最低点は未確認。合格発表は2027-01-08予定。
    passLine: "2025年度実績　50問中42問以上（一部免除者は45問中37問以上）",
    sources: [
      ["試験実施公告", mankan + "pdf/kanpo.pdf"],
      ["出題範囲", "https://www.mlit.go.jp/about/file000067.html"],
      ["2025年度試験結果", mankan + "pdf/R7_goukakusyagaiyo.pdf"]
    ]
  },
  shunin: {
    title: "管理業務主任者",
    examName: "管理業務主任者試験",
    theme: "#245c83",
    fields: fields("管理事務・管理者事務の委託契約", "管理組合の会計", "建物・設備の維持修繕", "マンション管理適正化法", "管理事務の実施"),
    // 2027年度の試験日は未確認。
    exams: [{ date: "2026-12-06" }],
    // 2026年度合格基準点は未確認。合格発表は2027-01-15予定。
    passLine: "2025年度実績　50問中36問以上（一部免除者は45問中31問以上）",
    sources: [
      ["試験実施要領", kanrikyo + "kanri/shiken_r08/shiken_detail_20260605.html"],
      ["2025年度試験結果", kanrikyo + "kanri/shiken_r07/pdf/goukakugaiyou.pdf"]
    ]
  },
  ishuu: {
    title: "マンション維持修繕技術者",
    examName: "マンション維持修繕技術者試験",
    theme: "#765134",
    fields: fields("マンション概論・一般建築", "維持保全・調査診断・修繕設計", "修繕工事の施工・監理", "修繕に関わる法令"),
    // 2027年度の試験日は未確認。
    exams: [{ date: "2026-09-06" }],
    passLine: "2026年度実績　択一60/90点以上、記述3/10点以上、総得点68/100点以上",
    sources: [
      ["受験案内", kanrikyo + "iji/iji_R08/shikenannai_2026.pdf"],
      ["2026年度試験結果", kanrikyo + "iji/iji_R08/2026report.pdf"]
    ]
  },
  sharoshi: {
    title: "社会保険労務士",
    examName: "社会保険労務士試験",
    theme: "#723c67",
    fields: fields("労働基準法", "労働安全衛生法", "労働者災害補償保険法", "雇用保険法", "労働保険徴収法", "健康保険法", "厚生年金保険法", "国民年金法", "社会保険一般常識", "労務管理その他の労働一般常識"),
    // 2027年度の試験日は未確認。分野は出題範囲を学習用に細分化している。
    exams: [{ date: "2026-08-23" }],
    passLine: "2026年度実績　択一47/70点以上（各科目4点以上）、選択25/40点以上（雇用保険法2点以上、その他各3点以上）",
    sources: [
      ["試験日程", sharoshi],
      ["出題範囲", sharoshi + "about/outline/"],
      ["2026年度合格基準", "https://www.mhlw.go.jp/content/11200000/001754298.pdf"]
    ]
  },
  gyosei: {
    title: "行政書士",
    examName: "行政書士試験",
    theme: "#3b5474",
    fields: fields("憲法", "行政法", "民法", "商法・会社法", "基礎法学", "一般知識", "行政書士法等", "情報通信・個人情報保護", "文章理解"),
    // 2027年度の試験日と、2026年度の補正の有無・確定基準点は未確認。
    exams: [{ date: "2026-11-08" }],
    passLine: "2026年度案内　法令等50%以上、基礎知識40%以上、全体60%以上（補正の可能性あり）",
    sources: [["試験案内・合格基準", gyosei]]
  },
  denko: {
    title: "第二種電気工事士",
    examName: "第二種電気工事士試験",
    theme: "#825326",
    fields: fields("電気理論", "配電理論・配線設計", "機器・器具・材料・工具", "施工方法", "検査方法", "配線図", "保安法令", "技能"),
    // 個人のCBT予約日と技能試験日は受験者・試験地により異なる。
    exams: [
      { date: "2026-12-12", end: "2026-12-13", label: "2026年度下期 技能（試験地によりいずれか1日）" },
      { date: "2027-04-20", end: "2027-06-04", label: "2027年度上期 学科（CBT）" },
      { date: "2027-07-17", end: "2027-07-18", label: "2027年度上期 技能（試験地によりいずれか1日）" },
      { date: "2027-09-21", end: "2027-11-05", label: "2027年度下期 学科（CBT）" },
      { date: "2027-12-11", end: "2027-12-12", label: "2027年度下期 技能（試験地によりいずれか1日）" }
    ],
    // 2027年度の個別受験案内は未確認。技能の基準は2026年度上期案内による。
    passLine: "学科（CBT）60/100点以上。技能は作品に欠陥がないこと（2026年度上期案内）",
    sources: [
      ["試験概要", denko + "overview/"],
      ["2026年度日程", denkoSchedule + "R08denkounittei2.pdf"],
      ["2027年度日程", denkoSchedule + "R09denkounittei.pdf"],
      ["学科（CBT）の合格基準", "https://www.shiken.or.jp/shiken/cbt/"],
      ["2026年度上期受験案内", "https://www.shiken.or.jp/construction/upload/r8kamikiannai.pdf"]
    ]
  },
  "shobo-toku": {
    ...shoboSettings,
    title: "消防設備士 特類",
    examName: "消防設備士試験（甲種特類）",
    fields: fields("消防関係法令", "構造・機能及び工事・整備", "火災及び防火に係る知識"),
    passLine: "筆記は各科目40%以上かつ全体60%以上（実技なし）"
  },
  ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((number) => [
    `shobo-${number}`,
    {
      ...shoboNumberedSettings,
      title: `消防設備士 第${number}類`,
      examName: `消防設備士試験（第${number}類）`
    }
  ])),
  saikaihatsu: {
    title: "再開発プランナー",
    examName: "再開発プランナー試験",
    theme: "#8c6a2f",
    fields: fields("再開発に係る法律等", "都市計画法等関連法規", "不動産関連法規", "評価・補償", "実技（事業計画・権利変換）"),
    exams: [],
    scheduleNote: "試験は年1回です。日程は年度ごとに実施団体が公表します。",
    passLine: "2026年度実績　学科・実技とも科目基準点以上、かつ合計121点以上（200点満点）",
    sources: [
      ["試験案内", planner + "test_all.html"],
      ["試験情報", planner + "test.html"],
      ["Q&A", planner + "faq.html"]
    ]
  }
};
