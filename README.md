# 🍪 COOK Terminal

**On-chain analytics, token intelligence and real transaction tooling for [Cookie Chain](https://www.cookiechain.wtf) — the community-run SVM.**

Built for the [Cookie Chain "Create an App" bounty](https://superteam.fun/earn/listing/create-an-app-on-cookie-chain-app).

---

## What it does

COOK Terminal reads Cookie Chain **directly from the RPC** — no third-party indexer, no cached API. Everything you see is derived from `getProgramAccounts`, `getSlot`, `getEpochInfo`, `getRecentPerformanceSamples` and `getBlocks` at request time.

### 1. Network Pulse
- Live slot, block height, epoch and epoch progress
- **Measured block interval** computed from real `getBlockTime` deltas across recent slots
- TPS time series from `getRecentPerformanceSamples`
- Node version and COOK supply

### 2. Token Radar
- **Full enumeration of every mint on chain** — 6,300+ SPL Token mints and 5,000+ Token-2022 mints (≈11,400 total at the time of writing), discovered by scanning both token programs
- Filter by program, by whether supply is live, by whether mint authority is revoked
- Search by mint address, sort by supply or decimals

### 3. Token Intelligence (click “分析” on any token)
- Supply, decimals, mint authority and freeze authority
- **Full holder census** for that mint — every non-zero token account
- **Top-10 concentration** and **Herfindahl–Hirschman Index (HHI)** of the holder base
- Holder distribution histogram by ownership share bucket
- **Objective risk signals** derived only from on-chain facts (authority status, supply, concentration, holder count) with a 0–100 risk score

### 4. Wallet & Transfer
- Connect with **Nightly**, Phantom or Solflare (any Wallet-Standard wallet also works)
- COOK balance and full SPL / Token-2022 holdings
- **Real on-chain transfers** with the complete lifecycle surfaced to the user:
  `build → sign → send → confirm → explorer link`
- Auto-creates the destination ATA when needed (payer = sender)
- Human-readable error mapping (user rejection, insufficient funds, expired blockhash, timeout, simulation failure…)

---

## Why it's different

Most “analytics” front-ends for a new chain just wrap an indexer. COOK Terminal has none — it reconstructs the token landscape **from raw program accounts**, which means it works on any SVM chain by changing one environment variable.

The **holder-concentration / HHI** layer is the part that matters: on a young chain with thousands of freshly minted tokens, the single most useful question is “who actually holds this, and how badly is it concentrated?” That answer is computed on demand from chain state, not from a vendor's database.

---

## Stack

| Layer | Choice |
|---|---|
| Build | Vite 5 + React 18 + TypeScript |
| Styling | Tailwind CSS 3 |
| Chain | `@solana/web3.js`, `@solana/spl-token` |
| Wallet | `@solana/wallet-adapter-*` (Nightly, Phantom, Solflare + Wallet Standard) |
| Charts | Recharts |
| RPC | `https://rpc.cookiescan.io` |

---

## Run it locally

```bash
npm install
npm run dev          # http://localhost:5173
```

Production build:

```bash
npm run build
npm run preview
```

### Point it at a different cluster

Both endpoints are configurable at build time:

```bash
VITE_RPC_URL=https://rpc.cookiescan.io \
VITE_RPC_WS=https://wss.cookiescan.io \
npm run build
```

Or drop a `.env` file:

```
VITE_RPC_URL=https://rpc.cookiescan.io
VITE_RPC_WS=https://wss.cookiescan.io
```

Because everything is read through standard Solana RPC calls, the same build works against **any** SVM cluster.

---

## Verify the data layer

A standalone script exercises the real parsing code against the live chain:

```bash
npx tsx scripts/verify.ts
```

It prints the network pulse, the total mint count split by token program, the top tokens by supply, and a full holder analysis (holders, top-10 share, HHI, distribution, risk score) for the largest token — proof that the numbers in the UI come from actual chain state.

---

## Deploy

### Vercel
```bash
npm i -g vercel
vercel --prod
```
Framework preset: **Vite**. Build command `npm run build`, output directory `dist`.

### Netlify
```bash
npm run build
# drag the dist/ folder into the Netlify dashboard, or:
npx netlify deploy --prod --dir=dist
```

### GitHub Pages
Set `base: "/<repo-name>/"` in `vite.config.ts`, then publish `dist/`.

---

## Project layout

```
src/
  lib/
    config.ts      # RPC endpoints, program IDs, constants
    chain.ts       # connection singleton, network pulse, perf samples, block times
    tokens.ts      # mint enumeration + parsing, holder census, risk signals
    transfer.ts    # transaction builders + error translation
    format.ts      # number / address / time formatting
  components/
    ui.tsx           # panel, stat card, chip, spinner, error note
    NetworkPulse.tsx # live chain metrics + charts
    TokenRadar.tsx   # full mint table with filters
    TokenDetail.tsx  # holder census + concentration + risk
    WalletPanel.tsx  # wallet connect, balances, holdings
    TransferTool.tsx # transfer flow with full tx lifecycle
  providers/
    WalletProviders.tsx
  App.tsx
scripts/
  verify.ts        # live data-layer verification
```

---

## Notes and limitations

- `getProgramAccounts` on a large program is a heavy call. The token list is fetched once per session and cached in memory; a production version would paginate or use a DAS endpoint.
- Token-2022 mints are identified from the first 82 bytes of each account using the mint-authority option discriminator, because Token-2022 appends extensions that change the account length. This is reliable in practice but is a heuristic, not a formal discriminator.
- Holder counts reflect **non-zero token accounts**, not unique human owners (one owner can hold several accounts).
- Transfers require the sender to hold enough COOK to cover both the amount and the rent for a new destination ATA, if one is needed.
- Read-only analytics are safe to run against mainnet; the transfer tool sends real transactions — start with a small amount.

---

## License

MIT
