import { Connection } from "@solana/web3.js";
import { RPC_HTTP, RPC_WS } from "./config";

let _conn: Connection | null = null;

/** 全局单例连接 */
export function getConnection(): Connection {
  if (!_conn) {
    _conn = new Connection(RPC_HTTP, {
      commitment: "confirmed",
      wsEndpoint: RPC_WS,
      disableRetryOnRateLimit: false,
    });
  }
  return _conn;
}

export type NetworkPulse = {
  slot: number;
  epoch: number;
  slotIndex: number;
  slotsInEpoch: number;
  epochProgress: number;
  blockHeight: number | null;
  version: string | null;
  tps: number | null;
  samplePeriodSecs: number | null;
  numTransactions: number | null;
  totalSupply: number | null;
  circulating: number | null;
  fetchedAt: number;
};

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/** 拉取一次网络全景数据 */
export async function fetchNetworkPulse(): Promise<NetworkPulse> {
  const conn = getConnection();

  const [slot, epochInfo, version, perf, supply, blockHeight] = await Promise.all([
    conn.getSlot("confirmed"),
    safe(() => conn.getEpochInfo("confirmed"), null as any),
    safe(() => conn.getVersion(), null as any),
    safe(() => conn.getRecentPerformanceSamples(1), [] as any[]),
    safe(() => conn.getSupply("confirmed"), null as any),
    safe(() => conn.getBlockHeight("confirmed"), null as any),
  ]);

  const p = perf?.[0];
  const numTx: number | null = p ? p.numTransactions : null;
  const period: number | null = p ? p.samplePeriodSecs : null;

  return {
    slot,
    epoch: epochInfo?.epoch ?? 0,
    slotIndex: epochInfo?.slotIndex ?? 0,
    slotsInEpoch: epochInfo?.slotsInEpoch ?? 0,
    epochProgress:
      epochInfo && epochInfo.slotsInEpoch > 0 ? epochInfo.slotIndex / epochInfo.slotsInEpoch : 0,
    blockHeight: blockHeight ?? null,
    version: version?.["solana-core"] ?? null,
    tps: numTx !== null && period ? numTx / period : null,
    samplePeriodSecs: period,
    numTransactions: numTx,
    totalSupply: supply ? supply.value.total / 1e9 : null,
    circulating: supply ? supply.value.circulating / 1e9 : null,
    fetchedAt: Date.now(),
  };
}

export type PerfPoint = {
  slot: number;
  tps: number;
  tx: number;
  secs: number;
};

/** 最近的性能采样，用于 TPS 折线图 */
export async function fetchPerfSamples(limit = 30): Promise<PerfPoint[]> {
  const conn = getConnection();
  try {
    const samples = await conn.getRecentPerformanceSamples(Math.min(limit, 60));
    return samples
      .map((s) => ({
        slot: s.slot,
        tps: s.samplePeriodSecs > 0 ? s.numTransactions / s.samplePeriodSecs : 0,
        tx: s.numTransactions,
        secs: s.samplePeriodSecs,
      }))
      .reverse();
  } catch {
    return [];
  }
}

export type BlockTimePoint = {
  slot: number;
  blockTime: number | null;
  deltaMs: number | null;
};

/** 最近若干个 slot 的出块时间，用于估算实际出块间隔 */
export async function fetchBlockTimes(count = 12): Promise<BlockTimePoint[]> {
  const conn = getConnection();
  try {
    const tip = await conn.getSlot("confirmed");
    const from = Math.max(1, tip - count * 4);
    const blocks = await conn.getBlocks(from, tip, "confirmed");
    if (!blocks || blocks.length === 0) return [];
    const picked = blocks.slice(-count);
    const times = await Promise.all(
      picked.map((s) => safe(() => conn.getBlockTime(s), null as number | null))
    );
    const out: BlockTimePoint[] = picked.map((s, i) => {
      const prev = i > 0 ? times[i - 1] : null;
      const cur = times[i];
      return {
        slot: s,
        blockTime: cur,
        deltaMs: cur && prev ? (cur - prev) * 1000 : null,
      };
    });
    return out;
  } catch {
    return [];
  }
}
