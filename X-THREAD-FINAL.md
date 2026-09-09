# X 线程 · 最终版（可直接复制粘贴）

> 账号：**@esan7_m**
> 发布方式：发第 1 条 → 在它下面回复第 2 条 → 依次成线程
> 图片：`cook-terminal/shots/` 目录下的截图，按标注附在对应推文
> 发布后：把线程链接发到 Cookie Chain 电报群 https://t.me/TheCookieNetChain
> 必须：至少一条里 tag **@TheCookieChain**（赏金硬性要求）

---

## 1 / 7（主推，附 01-network.png）

🍪 I built **COOK Terminal** — an on-chain analytics terminal for @TheCookieChain.

No indexer. No cached API. It reads the chain directly through `getProgramAccounts` and rebuilds the entire token landscape from scratch.

Here's what 11,400+ mints actually look like 👇

---

## 2 / 7（附 01-network.png）

First, the network itself.

COOK Terminal measures block time from **real** `getBlockTime` deltas, not from a hardcoded assumption.

Live right now:
• ~1.00s block interval
• slot 24,199,740
• epoch 56
• TPS chart refreshed every 10 seconds

---

## 3 / 7（附 02-tokens.png）

Then the token landscape.

Scanning both token programs directly:
• ~6,370 SPL Token mints
• ~5,030 Token-2022 mints
• **~11,400 total**
• ~5,050 have already revoked mint authority

Token-2022 appends extensions that change account length — so a fixed `dataSize` filter can't find them. I classify them from the mint-authority discriminator instead.

---

## 4 / 7（附 04-token-detail.png）

The part that actually matters on a young chain:

**Who holds this token, and how badly is it concentrated?**

Click any mint and COOK Terminal pulls a full holder census from chain state and computes:
• top-10 concentration
• **HHI** (Herfindahl–Hirschman Index)
• holder distribution buckets
• an objective risk score

---

## 5 / 7（附 04-token-detail.png）

Here's a live example.

Supply 10T, 21 non-zero holders, top 10 hold **100.0%**, HHI **9,997**, risk score **54/100**.

No vendor database involved — that number came out of the chain seconds ago.

---

## 6 / 7（附 03-wallet.png）

And it's not read-only.

Connect **Nightly**, Phantom or Solflare and send COOK, SPL or Token-2022 tokens with the full lifecycle visible:
build → sign → send → confirm → explorer link

It auto-creates the destination ATA if it doesn't exist, and maps RPC errors into plain English.

---

## 7 / 7

Try it: https://am5188.github.io/cook-terminal/
Code: https://github.com/am5188/cook-terminal

**New to Cookie Chain? Get COOK first.**
Bridge from Solana via the instant Hyperlane route:
→ https://hyperlane.cookiescan.io

Then paste your address into COOK Terminal → Wallet tab to see your balance and send your first transaction.

Built with Vite + React + `@solana/web3.js`. Because everything goes through standard RPC, the same build works against any SVM chain by changing one env var.

🍪

---

## 发布后要做的两件事

1. **把线程链接发到** https://t.me/TheCookieNetChain （赏金明确要求的最后一步）
2. **把线程链接发我**，我立刻在 Superteam Earn 提交（附上 GitHub 仓库 + 线上地址 + 程序地址）

## 提交时要填的三项

| 字段 | 内容 |
|---|---|
| Live application URL | `https://am5188.github.io/cook-terminal/` |
| GitHub repository | `https://github.com/am5188/cook-terminal` |
| Program / contract / token addresses | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`（SPL Token）· `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`（Token-2022）· `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL`（ATA）· RPC `https://rpc.cookiescan.io` |
