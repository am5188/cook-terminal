import { FC, useEffect, useMemo, useState } from "react";
import { TokenInfo, fetchAllMints } from "../lib/tokens";
import { compact, shorten } from "../lib/format";
import { CopyButton, Empty, Panel, Spinner } from "./ui";
import { explorerToken } from "../lib/config";

type SortKey = "supply" | "decimals" | "holders";
type Filter = "all" | "revoked" | "live" | "t22";

const PAGE = 50;

export const TokenRadar: FC<{ onSelect: (t: TokenInfo) => void }> = ({ onSelect }) => {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("supply");
  const [page, setPage] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const all = await fetchAllMints();
        if (!alive) return;
        setTokens(all);
        setErr(null);
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => {
    const spl = tokens.filter((t) => t.program === "spl-token").length;
    const t22 = tokens.length - spl;
    const revoked = tokens.filter((t) => t.mintAuthority === null).length;
    const live = tokens.filter((t) => t.uiSupply > 0).length;
    return { total: tokens.length, spl, t22, revoked, live };
  }, [tokens]);

  const view = useMemo(() => {
    let list = tokens;
    if (filter === "revoked") list = list.filter((t) => t.mintAuthority === null);
    else if (filter === "live") list = list.filter((t) => t.uiSupply > 0);
    else if (filter === "t22") list = list.filter((t) => t.program === "token-2022");

    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter(
        (t) => t.mint.toLowerCase().includes(needle) || shorten(t.mint, 6, 6).toLowerCase().includes(needle)
      );
    }

    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === "decimals") return b.decimals - a.decimals;
      return b.uiSupply - a.uiSupply;
    });
    return sorted;
  }, [tokens, q, filter, sort]);

  useEffect(() => setPage(0), [q, filter, sort]);

  const pageRows = view.slice(page * PAGE, page * PAGE + PAGE);
  const pages = Math.max(1, Math.ceil(view.length / PAGE));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="panel panel-pad">
          <div className="label">Mint 总数</div>
          <div className="stat mt-1">{compact(stats.total)}</div>
        </div>
        <div className="panel panel-pad">
          <div className="label">SPL Token</div>
          <div className="stat mt-1">{compact(stats.spl)}</div>
        </div>
        <div className="panel panel-pad">
          <div className="label">Token-2022</div>
          <div className="stat mt-1">{compact(stats.t22)}</div>
        </div>
        <div className="panel panel-pad">
          <div className="label">有流通供应</div>
          <div className="stat mt-1">{compact(stats.live)}</div>
        </div>
        <div className="panel panel-pad">
          <div className="label">已放弃 Mint 权限</div>
          <div className="stat mt-1">{compact(stats.revoked)}</div>
        </div>
      </div>

      <Panel
        title="代币雷达"
        subtitle="直接枚举 Token 与 Token-2022 程序的 mint 账户，无第三方索引"
        right={
          <div className="flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索 mint 地址…"
              className="input w-48 py-1.5 text-xs"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
              className="input w-36 py-1.5 text-xs"
            >
              <option value="all">全部</option>
              <option value="live">有流通供应</option>
              <option value="revoked">已放弃权限</option>
              <option value="t22">仅 Token-2022</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="input w-32 py-1.5 text-xs"
            >
              <option value="supply">按供应量</option>
              <option value="decimals">按精度</option>
            </select>
          </div>
        }
      >
        {loading ? (
          <Empty>
            <Spinner className="mr-2" /> 正在枚举链上全部 mint…
          </Empty>
        ) : err ? (
          <Empty>加载失败：{err}</Empty>
        ) : view.length === 0 ? (
          <Empty>没有符合条件的代币</Empty>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="py-2 pr-3 font-medium">Mint</th>
                    <th className="py-2 pr-3 font-medium">程序</th>
                    <th className="py-2 pr-3 text-right font-medium">精度</th>
                    <th className="py-2 pr-3 text-right font-medium">供应量</th>
                    <th className="py-2 pr-3 font-medium">Mint 权限</th>
                    <th className="py-2 pr-3 font-medium">冻结权限</th>
                    <th className="py-2 text-right font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((t) => (
                    <tr
                      key={t.mint}
                      className="border-b border-white/5 transition hover:bg-white/5"
                    >
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-200">
                            {shorten(t.mint, 6, 6)}
                          </span>
                          <CopyButton value={t.mint} />
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={t.program === "spl-token" ? "chip-muted" : "chip-warn"}
                        >
                          {t.program === "spl-token" ? "SPL" : "T22"}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right font-mono text-xs text-slate-400">
                        {t.decimals}
                      </td>
                      <td className="py-2 pr-3 text-right font-mono text-xs text-slate-200">
                        {compact(t.uiSupply)}
                      </td>
                      <td className="py-2 pr-3">
                        {t.mintAuthority === null ? (
                          <span className="chip-ok">已放弃</span>
                        ) : (
                          <span className="chip-warn">仍在</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        {t.freezeAuthority === null ? (
                          <span className="chip-ok">已放弃</span>
                        ) : (
                          <span className="chip-warn">仍在</span>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => onSelect(t)}
                          className="rounded border border-white/10 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-white/10"
                        >
                          分析
                        </button>
                        <a
                          href={explorerToken(t.mint)}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-1.5 text-[11px] text-cookie-400 hover:underline"
                        >
                          浏览器
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>
                共 {compact(view.length)} 条，第 {page + 1} / {pages} 页
              </span>
              <div className="flex gap-2">
                <button
                  className="btn-ghost px-3 py-1 text-xs"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  上一页
                </button>
                <button
                  className="btn-ghost px-3 py-1 text-xs"
                  disabled={page >= pages - 1}
                  onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                >
                  下一页
                </button>
              </div>
            </div>
          </>
        )}
      </Panel>
    </div>
  );
};
