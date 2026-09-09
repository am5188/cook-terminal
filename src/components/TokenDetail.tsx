import { FC, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { HolderStats, TokenInfo, fetchHolderStats, riskScore, riskSignals } from "../lib/tokens";
import { compact, num, pct, shorten, toUiString } from "../lib/format";
import { explorerAddr, explorerToken } from "../lib/config";
import { Chip, CopyButton, Empty, Spinner } from "./ui";

export const TokenDetail: FC<{ token: TokenInfo; onClose: () => void }> = ({ token, onClose }) => {
  const [stats, setStats] = useState<HolderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const s = await fetchHolderStats(token.mint, token.program);
        if (alive) {
          setStats(s);
          setErr(null);
        }
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token.mint, token.program]);

  const signals = riskSignals(token, stats);
  const score = riskScore(signals);
  const scoreTone = score >= 40 ? "bad" : score >= 20 ? "warn" : "ok";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="panel my-6 w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-white/5 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100">代币分析</h2>
              <span className={token.program === "spl-token" ? "chip-muted" : "chip-warn"}>
                {token.program === "spl-token" ? "SPL Token" : "Token-2022"}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <code className="truncate font-mono text-xs text-slate-400">{token.mint}</code>
              <CopyButton value={token.mint} />
              <a
                href={explorerToken(token.mint)}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-cookie-400 hover:underline"
              >
                浏览器 ↗
              </a>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded border border-white/10 px-2 py-1 text-xs text-slate-400 hover:bg-white/5"
          >
            关闭
          </button>
        </header>

        <div className="space-y-5 p-5">
          {/* 供应与权限 */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="label">供应量</dt>
              <dd className="mt-0.5 font-mono text-slate-100">{compact(token.uiSupply)}</dd>
              <dd className="mt-0.5 font-mono text-[10px] text-slate-500">
                {toUiString(BigInt(token.rawSupply), token.decimals)}
              </dd>
            </div>
            <div>
              <dt className="label">精度</dt>
              <dd className="mt-0.5 font-mono text-slate-100">{token.decimals}</dd>
            </div>
            <div>
              <dt className="label">持有人（非零）</dt>
              <dd className="mt-0.5 font-mono text-slate-100">
                {loading ? <Spinner /> : stats ? num(stats.holders) : "—"}
              </dd>
            </div>
            <div>
              <dt className="label">Mint 权限</dt>
              <dd className="mt-1">
                {token.mintAuthority ? (
                  <span className="chip-warn">仍在 · {shorten(token.mintAuthority, 5, 5)}</span>
                ) : (
                  <span className="chip-ok">已放弃</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="label">冻结权限</dt>
              <dd className="mt-1">
                {token.freezeAuthority ? (
                  <span className="chip-warn">仍在 · {shorten(token.freezeAuthority, 5, 5)}</span>
                ) : (
                  <span className="chip-ok">已放弃</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="label">风险评分</dt>
              <dd className="mt-1">
                <Chip level={scoreTone as any}>{score} / 100</Chip>
              </dd>
            </div>
          </dl>

          {/* 风险信号 */}
          <div>
            <h3 className="label mb-2">链上风险信号</h3>
            <ul className="space-y-1.5">
              {signals.map((s) => (
                <li
                  key={s.key}
                  className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                >
                  <span
                    className={
                      s.level === "ok"
                        ? "text-emerald-400"
                        : s.level === "warn"
                        ? "text-amber-400"
                        : "text-rose-400"
                    }
                  >
                    {s.level === "ok" ? "✓" : s.level === "warn" ? "!" : "✕"}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-200">{s.label}</div>
                    <div className="text-[11px] text-slate-500">{s.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* 持有人分布 */}
          {loading ? (
            <Empty>
              <Spinner className="mr-2" /> 正在拉取持有人分布…
            </Empty>
          ) : err ? (
            <Empty>持有人数据获取失败：{err}</Empty>
          ) : stats && stats.holders > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <h3 className="label mb-2">持仓集中度</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">前 10 名占比</span>
                    <span className="font-mono text-slate-100">{pct(stats.top10Share)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">HHI 指数</span>
                    <span className="font-mono text-slate-100">{stats.hhi.toFixed(0)}</span>
                  </div>
                  {stats.largest && (
                    <div className="pt-1">
                      <div className="label">最大持有人</div>
                      <div className="mt-1 flex items-center gap-2">
                        <a
                          href={explorerAddr(stats.largest.owner)}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs text-cookie-400 hover:underline"
                        >
                          {shorten(stats.largest.owner, 6, 6)}
                        </a>
                        <span className="font-mono text-xs text-slate-400">
                          {pct(stats.largest.share)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="label mb-2">持有人按持仓占比分布</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={stats.distribution}
                    margin={{ top: 4, right: 8, left: -22, bottom: 0 }}
                  >
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="bucket"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#171b21",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => [`${v} 个账户`, "数量"]}
                    />
                    <Bar dataKey="count" fill="#ff9c38" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <Empty>没有非零持有人账户</Empty>
          )}
        </div>
      </div>
    </div>
  );
};
