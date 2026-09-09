// 完整 UI 验证：指定 URL，跑通三个标签页 + 代币分析弹窗
const { chromium } = require("playwright-core");
const path = require("path");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = process.argv[2] || "http://localhost:5173/";
const OUT = path.join(__dirname, "..", "shots");

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  console.log("URL:", URL);
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(9000);

  // --- 网络脉搏 ---
  const stats = await page.$$eval(".stat", (els) => els.map((e) => e.textContent.trim()));
  console.log("\n[网络脉搏] StatCard:", JSON.stringify(stats.slice(0, 4)));
  const charts = await page.locator("svg.recharts-surface").count();
  console.log("[网络脉搏] 图表数量:", charts);
  await page.screenshot({ path: path.join(OUT, "dev-01-network.png"), fullPage: true });

  // --- 代币雷达 ---
  await page.getByText("代币雷达").first().click();
  await page.waitForTimeout(15000);
  const radarStats = await page.$$eval(".stat", (els) => els.map((e) => e.textContent.trim()));
  console.log("\n[代币雷达] 统计:", JSON.stringify(radarStats.slice(0, 5)));
  const rows = await page.locator("table tbody tr").count();
  console.log("[代币雷达] 表格行数:", rows);
  await page.screenshot({ path: path.join(OUT, "dev-02-tokens.png"), fullPage: true });

  // --- 代币分析弹窗 ---
  if (rows > 0) {
    await page.locator("table tbody tr").first().getByText("分析").click();
    await page.waitForTimeout(9000);
    const modalText = await page.locator(".fixed.inset-0 .panel").first().innerText().catch(() => "");
    const checks = ["代币分析", "供应量", "持有人", "风险评分", "链上风险信号", "持仓集中度"];
    console.log("\n[代币分析] 字段:", checks.map((c) => (modalText.includes(c) ? "✓" : "✗") + c).join(" "));
    const holders = modalText.match(/持有人（非零）\s*\n\s*([\d,]+)/);
    const hhi = modalText.match(/HHI 指数\s*\n\s*([\d,]+)/);
    console.log("[代币分析] 持有人:", holders?.[1], "| HHI:", hhi?.[1]);
    await page.screenshot({ path: path.join(OUT, "dev-04-detail.png") });
    await page.keyboard.press("Escape");
    await page.locator("text=关闭").first().click().catch(() => {});
    await page.waitForTimeout(800);
  }

  // --- 钱包页 ---
  await page.getByText("钱包与转账").first().click();
  await page.waitForTimeout(2500);
  const walletText = await page.innerText("body");
  console.log("\n[钱包页] 我的钱包:", walletText.includes("我的钱包") ? "✓" : "✗",
              "| 链上转账:", walletText.includes("链上转账") ? "✓" : "✗");
  const hasConnect = await page.locator("button:has-text('Connect'), button:has-text('Select Wallet')").count();
  console.log("[钱包页] 连接按钮:", hasConnect > 0 ? "✓" : "✗");
  await page.screenshot({ path: path.join(OUT, "dev-03-wallet.png"), fullPage: true });

  console.log("\n=== 错误 ===");
  console.log(errors.length === 0 ? "  （无）" : errors.slice(0, 10).map((e) => "  ✗ " + e.slice(0, 250)).join("\n"));

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
