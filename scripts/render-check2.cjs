// 深度验证：代币表格渲染 + 点击「分析」弹窗内的持有人数据
const { chromium } = require("playwright-core");
const path = require("path");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = "http://127.0.0.1:4173/";
const OUT = path.join(__dirname, "..", "shots");

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await page.goto(URL, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(6000);

  // 切到代币雷达
  await page.getByText("代币雷达").first().click();
  await page.waitForTimeout(15000);

  const rows = await page.locator("table tbody tr").count();
  console.log("代币表格行数:", rows);

  const firstMint = await page.locator("table tbody tr").first().locator("code, .font-mono").first().innerText().catch(() => "");
  console.log("首行 mint:", firstMint);

  // 点击「分析」
  await page.locator("table tbody tr").first().getByText("分析").click();
  await page.waitForTimeout(9000);

  const modal = await page.locator(".fixed.inset-0 .panel").first();
  const modalText = await modal.innerText().catch(() => "");
  console.log("\n=== 分析弹窗内容 ===");
  const lines = modalText.split("\n").map((s) => s.trim()).filter(Boolean);
  lines.slice(0, 40).forEach((l) => console.log("  " + l));

  const checks = ["代币分析", "供应量", "持有人", "风险评分", "链上风险信号", "持仓集中度"];
  console.log("\n=== 弹窗字段检查 ===");
  for (const c of checks) console.log(`  ${modalText.includes(c) ? "✓" : "✗"} ${c}`);

  await page.screenshot({ path: path.join(OUT, "04-token-detail.png"), fullPage: false });

  console.log("\n=== 错误 ===");
  console.log(errors.length === 0 ? "  （无）" : errors.slice(0, 10).map((e) => "  ✗ " + e.slice(0, 200)).join("\n"));

  await browser.close();
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
