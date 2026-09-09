// 诊断：加载 dev server，抓所有控制台/网络错误
const { chromium } = require("playwright-core");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.argv[2] || "http://127.0.0.1:5173/";

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning")
      errors.push(`[${m.type()}] ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${(e.stack || "").split("\n").slice(0, 4).join("\n")}`));
  page.on("requestfailed", (r) => errors.push(`[requestfailed] ${r.url()} — ${r.failure()?.errorText}`));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`[http ${r.status()}] ${r.url()}`);
  });

  try {
    await page.goto(URL, { waitUntil: "load", timeout: 45_000 });
  } catch (e) {
    console.log("GOTO FAILED:", e.message);
    await browser.close();
    return;
  }

  await page.waitForTimeout(8000);

  const html = await page.content();
  const text = await page.innerText("body").catch(() => "");
  const rootHtml = await page.locator("#root").innerHTML().catch(() => "<no #root>");

  console.log("URL:", URL);
  console.log("body 文本长度:", text.length);
  console.log("#root 内容长度:", rootHtml.length);
  console.log("#root 前 300 字符:", rootHtml.slice(0, 300).replace(/\s+/g, " "));
  console.log("\n=== 错误 / 警告 ===");
  if (errors.length === 0) console.log("  （无）");
  else errors.slice(0, 25).forEach((e) => console.log("  " + e.slice(0, 500)));

  await browser.close();
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
