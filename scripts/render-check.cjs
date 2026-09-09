// 用系统 Edge 真实渲染页面，抓控制台错误并截图
const { chromium } = require("playwright-core");
const path = require("path");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = "http://127.0.0.1:4173/";
const OUT = path.join(__dirname, "..", "shots");

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  const errors = [];
  const logs = [];
  page.on("console", (m) => {
    logs.push(`${m.type()}: ${m.text()}`);
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

  await page.goto(URL, { waitUntil: "networkidle", timeout: 60_000 });

  // 等网络数据渲染
  await page.waitForTimeout(9000);

  const bodyText = await page.innerText("body");
  const has = (s) => bodyText.includes(s);

  console.log("=== 页面关键文本 ===");
  for (const s of ["COOK Terminal", "当前 Slot", "出块间隔", "TPS", "Epoch", "网络脉搏", "代币雷达", "钱包与转账"]) {
    console.log(`  ${has(s) ? "✓" : "✗"} ${s}`);
  }

  // 抓取 StatCard 数值
  const stats = await page.$$eval(".stat", (els) => els.map((e) => e.textContent.trim()));
  console.log("StatCard 值:", JSON.stringify(stats));

  await page.screenshot({ path: path.join(OUT, "01-network.png"), fullPage: true });

  // 切到代币雷达
  await page.getByText("代币雷达", { exact: false }).first().click();
  await page.waitForTimeout(14000); // 等 11000+ mint 枚举
  const radarText = await page.innerText("body");
  console.log("\n=== 代币雷达 ===");
  for (const s of ["Mint 总数", "SPL Token", "Token-2022", "已放弃 Mint 权限"]) {
    console.log(`  ${radarText.includes(s) ? "✓" : "✗"} ${s}`);
  }
  const radarStats = await page.$$eval(".stat", (els) => els.map((e) => e.textContent.trim()));
  console.log("雷达统计:", JSON.stringify(radarStats.slice(0, 5)));
  await page.screenshot({ path: path.join(OUT, "02-tokens.png"), fullPage: true });

  // 切到钱包页
  await page.getByText("钱包与转账", { exact: false }).first().click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT, "03-wallet.png"), fullPage: true });
  const walletText = await page.innerText("body");
  console.log("\n=== 钱包页 ===");
  console.log(`  ${walletText.includes("我的钱包") ? "✓" : "✗"} 我的钱包`);
  console.log(`  ${walletText.includes("链上转账") ? "✓" : "✗"} 链上转账`);

  console.log("\n=== 控制台错误 ===");
  if (errors.length === 0) console.log("  （无）");
  else errors.slice(0, 15).forEach((e) => console.log("  ✗ " + e.slice(0, 300)));

  await browser.close();
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
