import { PublicKey } from "@solana/web3.js";
import { getConnection } from "./chain";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, MINT_LEN } from "./config";
import { toUiAmount } from "./format";

export type TokenProgram = "spl-token" | "token-2022";

export type TokenInfo = {
  mint: string;
  program: TokenProgram;
  decimals: number;
  /** 原始 supply（最小单位，字符串） */
  rawSupply: string;
  uiSupply: number;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  isInitialized: boolean;
};

export type HolderStats = {
  mint: string;
  holders: number;
  totalAccounts: number;
  /** 前 10 大持有人占流通比例 */
  top10Share: number;
  /** 赫芬达尔指数（0-10000），越高越集中 */
  hhi: number;
  largest: { owner: string; amount: number; share: number } | null;
  /** 持有人分布（用于图表） */
  distribution: { bucket: string; count: number }[];
};

const ZERO = "11111111111111111111111111111111";

function readPubkey(buf: Buffer, offset: number): string | null {
  const slice = buf.subarray(offset, offset + 32);
  if (slice.every((b) => b === 0)) return null;
  try {
    const pk = new PublicKey(slice);
    const s = pk.toBase58();
    return s === ZERO ? null : s;
  } catch {
    return null;
  }
}

/** 解析 82 字节的 mint 基础布局 */
export function parseMint(mint: string, data: Buffer, program: TokenProgram): TokenInfo | null {
  if (data.length < MINT_LEN) return null;
  const mintAuthOption = data.readUInt32LE(0);
  const supply = data.readBigUInt64LE(36);
  const decimals = data[44];
  const isInitialized = data[45] === 1;
  const freezeOption = data.readUInt32LE(46);

  // 启发式校验：mintAuthorityOption 必须为 0/1，否则是 token account 的前 82 字节
  if (mintAuthOption > 1) return null;
  if (!isInitialized) return null;
  if (decimals > 18) return null;

  const ui = toUiAmount(supply, decimals);

  return {
    mint,
    program,
    decimals,
    rawSupply: supply.toString(),
    uiSupply: ui,
    mintAuthority: mintAuthOption === 1 ? readPubkey(data, 4) : null,
    freezeAuthority: freezeOption === 1 ? readPubkey(data, 50) : null,
    isInitialized,
  };
}

/**
 * 枚举链上全部 mint。
 * - SPL Token：dataSize 恰好 82，无扩展
 * - Token-2022：只取前 82 字节，按 mintAuthorityOption 是否为 0/1 判别
 */
export async function fetchAllMints(): Promise<TokenInfo[]> {
  const conn = getConnection();
  const out: TokenInfo[] = [];

  const [spl, t22] = await Promise.allSettled([
    conn.getProgramAccounts(TOKEN_PROGRAM_ID, {
      filters: [{ dataSize: MINT_LEN }],
      commitment: "confirmed",
    }),
    conn.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
      dataSlice: { offset: 0, length: MINT_LEN },
      commitment: "confirmed",
    }),
  ]);

  if (spl.status === "fulfilled") {
    for (const { pubkey, account } of spl.value) {
      const info = parseMint(pubkey.toBase58(), account.data as Buffer, "spl-token");
      if (info) out.push(info);
    }
  }

  if (t22.status === "fulfilled") {
    for (const { pubkey, account } of t22.value) {
      const info = parseMint(pubkey.toBase58(), account.data as Buffer, "token-2022");
      if (info) out.push(info);
    }
  }

  return out;
}

/** 拉取某个 mint 的全部持有人账户 */
export async function fetchHolderStats(
  mint: string,
  program: TokenProgram
): Promise<HolderStats> {
  const conn = getConnection();
  const programId = program === "spl-token" ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID;

  let accounts: { pubkey: PublicKey; account: { data: Buffer } }[] = [];
  try {
    const filters: any[] = [{ memcmp: { offset: 0, bytes: mint } }];
    if (program === "spl-token") filters.unshift({ dataSize: 165 });
    accounts = (await conn.getProgramAccounts(programId, {
      filters,
      dataSlice: { offset: 32, length: 40 }, // owner(32) + amount(8)
      commitment: "confirmed",
    })) as any;
  } catch {
    return emptyStats(mint, 0);
  }

  const rows: { owner: string; amount: bigint }[] = [];
  for (const a of accounts) {
    const d = a.account.data as Buffer;
    if (d.length < 40) continue;
    const owner = new PublicKey(d.subarray(0, 32)).toBase58();
    const amount = d.readBigUInt64LE(32);
    if (amount > 0n) rows.push({ owner, amount });
  }

  if (rows.length === 0) return emptyStats(mint, accounts.length);

  const total = rows.reduce((s, r) => s + r.amount, 0n);
  rows.sort((a, b) => (b.amount > a.amount ? 1 : b.amount < a.amount ? -1 : 0));

  const totalNum = Number(total);
  const top10 = rows.slice(0, 10).reduce((s, r) => s + Number(r.amount), 0);
  const hhi = rows.reduce((s, r) => {
    const share = Number(r.amount) / totalNum;
    return s + share * share;
  }, 0) * 10000;

  const largest = {
    owner: rows[0].owner,
    amount: Number(rows[0].amount),
    share: Number(rows[0].amount) / totalNum,
  };

  // 分桶：按持币量占流通的百分比
  const buckets = [
    { bucket: ">10%", lo: 0.1, hi: Infinity },
    { bucket: "1–10%", lo: 0.01, hi: 0.1 },
    { bucket: "0.1–1%", lo: 0.001, hi: 0.01 },
    { bucket: "0.01–0.1%", lo: 0.0001, hi: 0.001 },
    { bucket: "<0.01%", lo: 0, hi: 0.0001 },
  ];
  const distribution = buckets.map((b) => ({
    bucket: b.bucket,
    count: rows.filter((r) => {
      const share = Number(r.amount) / totalNum;
      return share >= b.lo && share < b.hi;
    }).length,
  }));

  return {
    mint,
    holders: rows.length,
    totalAccounts: accounts.length,
    top10Share: top10 / totalNum,
    hhi,
    largest,
    distribution,
  };
}

function emptyStats(mint: string, totalAccounts: number): HolderStats {
  return {
    mint,
    holders: 0,
    totalAccounts,
    top10Share: 0,
    hhi: 0,
    largest: null,
    distribution: [],
  };
}

/** 风险画像：基于链上可验证的客观信号，而非主观判断 */
export type RiskSignal = {
  key: string;
  label: string;
  level: "ok" | "warn" | "bad";
  detail: string;
};

export function riskSignals(t: TokenInfo, h: HolderStats | null): RiskSignal[] {
  const out: RiskSignal[] = [];

  out.push(
    t.mintAuthority === null
      ? { key: "mint", label: "Mint 权限已放弃", level: "ok", detail: "无法再增发，供应量固定" }
      : { key: "mint", label: "Mint 权限仍在", level: "warn", detail: "持有人可随时增发，稀释风险" }
  );

  out.push(
    t.freezeAuthority === null
      ? { key: "freeze", label: "冻结权限已放弃", level: "ok", detail: "无法冻结用户账户" }
      : { key: "freeze", label: "冻结权限仍在", level: "warn", detail: "持有人可冻结任意账户" }
  );

  if (t.uiSupply === 0) {
    out.push({
      key: "supply",
      label: "供应量为 0",
      level: "bad",
      detail: "尚无任何流通供应，可能是空壳或未启动",
    });
  }

  if (h && h.holders > 0) {
    if (h.top10Share >= 0.9) {
      out.push({
        key: "conc",
        label: "极度集中",
        level: "bad",
        detail: `前 10 名持有 ${(h.top10Share * 100).toFixed(1)}%，HHI ${h.hhi.toFixed(0)}`,
      });
    } else if (h.top10Share >= 0.6) {
      out.push({
        key: "conc",
        label: "高度集中",
        level: "warn",
        detail: `前 10 名持有 ${(h.top10Share * 100).toFixed(1)}%，HHI ${h.hhi.toFixed(0)}`,
      });
    } else {
      out.push({
        key: "conc",
        label: "分布较健康",
        level: "ok",
        detail: `前 10 名持有 ${(h.top10Share * 100).toFixed(1)}%，HHI ${h.hhi.toFixed(0)}`,
      });
    }

    if (h.holders <= 3) {
      out.push({
        key: "holders",
        label: "持有人过少",
        level: "warn",
        detail: `仅 ${h.holders} 个非零账户`,
      });
    }
  }

  return out;
}

/** 0-100 的综合风险分，越高越危险 */
export function riskScore(signals: RiskSignal[]): number {
  const w = { ok: 0, warn: 12, bad: 30 } as const;
  return Math.min(100, signals.reduce((s, x) => s + w[x.level], 0));
}
