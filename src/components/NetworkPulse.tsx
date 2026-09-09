import { FC, useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BlockTimePoint,
  NetworkPulse as Pulse,
  PerfPoint,
  fetchBlockTimes,
  fetchNetworkPulse,
  fetchPerfSamples,
} from "../lib/chain";
import { compact, hhmmss, num } from "../lib/format";
import { Empty, Panel, Spinner, StatCard } from "./ui";

const REFRESH_MS = 10_000;

export const NetworkPulse: FC = () => {
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [perf, setPerf] = useState<PerfPoint[]>([]);
  const [blocks, setBlocks] = useState<BlockTimePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const timer = useRef<number | null>(null);

  async function load(showSpinner = false) {
    if (showSpinner) setLoading(true);
    try {
      const [p, s, b] = await Promise.all([
        fetchNetworkPulse(),
        fetchPerfSamples(30),
        fetchBlockTimes(14),
      ]);
      setPulse(p);
      setPerf(s);
      setBlocks(b);
      setUpdatedAt(new Date());
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(true);
    timer.current = window.setInterval(() => load(false), REFRESH_MS);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, []);

  const avgBlockMs = (() => {
    const ds = blocks.map((b) => b.deltaMs).filter((d): d is number => !!d && d > 0 && d < 60_000);
    if (!ds.length) return null;
    return ds.reduce((a, b) => a + b, 0) / ds.length;
  })();

  const perfData = perf.map((p) => ({
    slot: p.slot,
    tps: Math.round(p.tps),
  }));

  const blockData = blocks
    .filter((b) => b.deltaMs)
    .map((b) => ({ slot: String(b.slot).slice(-5), ms: Math.round(b.deltaMs as number) }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="当前 Slot"
          value={loading && !pulse ? <Spinner /> : num(pulse?.slot)}
          sub={pulse ? `Block height ${compact(pulse.blockHeight ?? undefined)}` : undefined}
        />
        <StatCard
          label="出块间隔"
          value={avgBlockMs ? `${(avgBlockMs / 1000).toFixed(2)}s` : "—"}
          sub={blocks.length ? `基于最近 ${blocks.length} 个区块` : undefined}
        />
        <StatCard
          label="TPS（采样）"
          value={pulse?.tps !== null && pulse?.tps !== undefined ? num(pulse.tps) : "—"}
          sub={
            pulse?.samplePeriodSecs
              ? `${compact(pulse.numTransactions ?? 0)} 笔 / ${pulse.samplePeriodSecs}s`
              : undefined
          }
        />
        <StatCard
          label="Epoch"
          value={num(pulse?.epoch)}
          sub={pulse ? `进度 ${(pulse.epochProgress * 100).toFixed(1)}%` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel
          title="吞吐量（TPS）"
          subtitle="来自 getRecentPerformanceSamples 的实时采样"
          right={updatedAt && <span className="label">{hhmmss(updatedAt)}</span>}
        >
          {err ? (
            <Empty>数据获取失败：{err}</Empty>
          ) : perfData.length === 0 ? (
            <Empty>{loading ? "正在拉取…" : "该节点未返回性能采样"}</Empty>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={perfData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="tpsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff7f11" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#ff7f11" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="slot"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  tickFormatter={(v) => String(v).slice(-4)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#171b21",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={(v) => `slot ${v}`}
                />
                <Area
                  type="monotone"
                  dataKey="tps"
                  stroke="#ff9c38"
                  strokeWidth={2}
                  fill="url(#tpsFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="区块间隔" subtitle="最近若干区块的实际出块耗时（毫秒）">
          {blockData.length === 0 ? (
            <Empty>{loading ? "正在拉取…" : "该节点未返回区块时间"}</Empty>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={blockData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="slot"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#171b21",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v} ms`, "间隔"]}
                />
                <Bar dataKey="ms" fill="#ffc071" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      <Panel title="链级指标" subtitle="全部来自 Cookie Chain 公共 RPC">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-4">
          <div>
            <dt className="label">节点版本</dt>
            <dd className="mt-0.5 font-mono text-slate-200">{pulse?.version ?? "—"}</dd>
          </div>
          <div>
            <dt className="label">总供应（COOK）</dt>
            <dd className="mt-0.5 font-mono text-slate-200">{compact(pulse?.totalSupply)}</dd>
          </div>
          <div>
            <dt className="label">流通量（COOK）</dt>
            <dd className="mt-0.5 font-mono text-slate-200">{compact(pulse?.circulating)}</dd>
          </div>
          <div>
            <dt className="label">Epoch 内 Slot</dt>
            <dd className="mt-0.5 font-mono text-slate-200">
              {pulse ? `${num(pulse.slotIndex)} / ${num(pulse.slotsInEpoch)}` : "—"}
            </dd>
          </div>
        </dl>
      </Panel>
    </div>
  );
};
