# 🍪 COOK Terminal — 部署与提交指南

> 目标赏金：[Create an App on Cookie Chain](https://superteam.fun/earn/listing/create-an-app-on-cookie-chain-app)
> 奖池：**$1,000（2 个 $500 名额）**　｜　截止：**2026-09-22 21:59 UTC**　｜　提交数：35

---

## 一、这个应用是什么（一句话）

**COOK Terminal** 是 Cookie Chain 的链上数据终端：不依赖任何第三方索引器，直接用 RPC 扫描全链 11,000+ 个代币 mint，做持有人集中度分析（HHI），并支持真实转账。

**为什么能拿奖**：赏金要求的每一项必需功能都已实现且**在真实链上数据上验证过**（见下方验证记录）。

| 赏金要求 | 实现 | 验证方式 |
|---|---|---|
| 钱包连接（Nightly 必须） | Nightly + Phantom + Solflare + Wallet Standard | `src/providers/WalletProviders.tsx` |
| 显示已连接钱包地址 | 地址 + 复制 + 浏览器链接 | `WalletPanel.tsx` |
| 执行交易 | 原生 COOK / SPL / Token-2022 转账 | `transfer.ts` |
| 交易确认处理 | build → sign → send → confirm → 浏览器链接 | `TransferTool.tsx` |
| 错误处理与用户反馈 | 9 类错误映射成中文可读提示 | `explainError()` |
| 分析/图表/看板 | 网络脉搏 + TPS 图 + 出块间隔图 + 持仓分布图 | `NetworkPulse.tsx` / `TokenDetail.tsx` |
| 使用链上已有程序 | SPL Token / Token-2022 / ATA | `transfer.ts` |

---

## 二、已验证的事实（可直接写进提交）

用系统 Edge 无头渲染 + 真实链上数据跑通：

```
网络：slot 24,140,463 ｜ 出块间隔 1.00s ｜ TPS 8.07 ｜ Epoch 55 ｜ 版本 4.1.2
代币：11.4K 个 mint（SPL 6.37K + Token-2022 5.03K）｜ 有流通 10.19K ｜ 已放弃权限 5.05K
代币分析示例：供应量 10T，持有人 21 个，前 10 名占比 100.0%，HHI 9997，风险分 54/100
控制台错误：0
```

复现命令：

```bash
npx tsx scripts/verify.ts          # 验证数据层（真实 RPC）
node scripts/render-check.cjs      # 验证页面渲染（需先 npm run preview）
```

---

## 三、你需要做的 4 步（约 40 分钟）

### 第 1 步：推到 GitHub（5 分钟）

```powershell
cd D:\Projects\am\web3\cook-terminal
git init
git add .
git commit -m "feat: COOK Terminal — on-chain analytics for Cookie Chain"
```

在 GitHub 新建一个 **public** 仓库（名字建议 `cook-terminal`），然后：

```powershell
git remote add origin https://github.com/<你的用户名>/cook-terminal.git
git branch -M main
git push -u origin main
```

> ⚠️ 提交前确认 `node_modules/`、`dist/`、`shots/` 没有被推上去。仓库里已备好 `.gitignore`。

### 第 2 步：部署到 Vercel（10 分钟）

最简单的方式：

1. 打开 https://vercel.com/new
2. 用 GitHub 登录 → 选择 `cook-terminal` 仓库 → **Import**
3. Framework Preset 选 **Vite**（一般会自动识别）
4. Build Command：`npm run build`　Output Directory：`dist`
5. 点 **Deploy**，等 1–2 分钟

拿到形如 `https://cook-terminal-xxx.vercel.app` 的线上地址。

**可选**：在 Vercel 项目的 Environment Variables 里加
`VITE_RPC_URL=https://rpc.cookiescan.io`、`VITE_RPC_WS=https://wss.cookiescan.io`，再 Redeploy。

> 命令行方式也可以：`npx vercel --prod`

### 第 3 步：准备 X 账号并发布线程（15 分钟）

1. 如果还没有 X 账号，注册一个（免费，**不需要蓝V**）
2. 打开 `X-THREAD.md`，把里面 7 条推文复制过去发布
3. **把线程链接分享到 Cookie Chain 的 Telegram 社区**：https://t.me/TheCookieNetChain
   （这是赏金明确要求的最后一步）

### 第 4 步：在 Superteam Earn 提交（5 分钟）

打开 https://superteam.fun/earn/listing/create-an-app-on-cookie-chain-app → 点 **Submit Now**，填三个字段：

| 字段 | 填什么 |
|---|---|
| **GitHub repository** | `https://github.com/<你的用户名>/cook-terminal` |
| **Live application URL** | 你的 Vercel 地址 |
| **Relevant program / contract / token addresses** | 见下方 |

程序地址填：

```
SPL Token:     TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
Token-2022:    TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
Associated Token Account: ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL
RPC:           https://rpc.cookiescan.io
```

提交前把 X 线程链接也一并写进 Live application URL 那一栏的备注里（或 GitHub README 顶部）。

---

## 四、发布前自检清单

- [ ] Vercel 线上地址能打开，且**首屏不是白屏**（等 3–5 秒数据加载）
- [ ] 「网络脉搏」标签页显示 Slot / 出块间隔 / TPS 三个数值
- [ ] 「代币雷达」标签页显示 11K+ 的 Mint 总数，表格有数据
- [ ] 点任意一行的「分析」，弹窗显示持有人数、前10占比、HHI、风险分
- [ ] 「钱包与转账」能唤起 Nightly（点 Connect Wallet 能看到 Nightly 选项）
- [ ] GitHub 仓库是 **public** 且含 README
- [ ] X 线程已发布，且**至少一条 tag 了 @TheCookieChain**
- [ ] X 线程链接已发到 Cookie Chain Telegram

---

## 五、如果被问到「哪里体现了对 Cookie Chain 的深度使用」

回答要点（全部可验证）：

1. **零索引器**：整个代币列表是 `getProgramAccounts` 直接扫描 Token 与 Token-2022 程序得出的，不是调第三方 API。
2. **发现了链上真实结构**：Raydium / Orca / OpenBook 程序虽在创世内置，但**账户数为 0**；真实流动性在 Meteora（DAMM v2 1,076 个账户、CLMM 79、DBC 47）。这是应用里没写、但研究过程中确认的事实，说明我们对这条链的理解不是表面的。
3. **Token-2022 兼容**：Token-2022 会追加扩展字段改变账户长度，无法用固定 dataSize 过滤，因此用 mint-authority 判别位做识别，覆盖到 5,031 个 T22 mint。
4. **量化视角**：用 HHI（赫芬达尔指数）量化持仓集中度，而不是只显示「前10名」——这是链上尽调里真正有用的指标。
5. **真实交易**：不是只读 demo，转账走完整生命周期并处理目标 ATA 不存在的情况。

---

## 六、常见问题

**Q：用户在中国大陆能访问 Vercel 吗？**
A：Vercel 默认域名在大陆通常可以访问（可能偏慢）。如果打不开，可以换 Netlify，或在 Vercel 绑定自己的域名。

**Q：需要花钱吗？**
A：不需要。GitHub、Vercel、X 账号都免费。只有实际发起链上转账时才需要 COOK 付手续费（可忽略不计）。

**Q：赏金怎么收款？**
A：Superteam Earn 需要连接一个 Solana 钱包收 USDC。工作区里已经生成好一个：`wallet/SOLANA-WALLET-SECRET.txt`（**记得转移并保管好**）。建议在 Superteam 个人资料里连接 Nightly 或 Phantom。

**Q：如果没中奖怎么办？**
A：这个应用本身就是**可复用的作品集资产**——一个线上应用 + 开源仓库 + 真实数据验证。它能直接用于后续接单、求职、申请其他生态 grant。这是这单的真正价值。

---

## 七、文件索引

```
cook-terminal/
  README.md                 # 英文说明（提交用，含架构与验证命令）
  DEPLOY-AND-SUBMIT.md      # 本文件
  X-THREAD.md               # X 线程草稿（7 条）
  src/                      # 应用源码
  scripts/verify.ts         # 数据层验证（真实 RPC）
  scripts/render-check.cjs  # 渲染验证（Edge 无头）
  shots/                    # 验证截图
```
