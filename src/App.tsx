import { FC, useCallback, useState } from "react";
import { WalletProviders } from "./providers/WalletProviders";
import { NetworkPulse } from "./components/NetworkPulse";
import { TokenRadar } from "./components/TokenRadar";
import { TokenDetail } from "./components/TokenDetail";
import { WalletPanel, Holding } from "./components/WalletPanel";
import { TransferTool } from "./components/TransferTool";
import { Panel } from "./components/ui";
import type { TokenInfo } from "./lib/tokens";
import { RPC_HTTP } from "./lib/config";

type Tab = "network" | "tokens" | "wallet";

const TABS: { key: Tab; label: string; hint: string }[] = [
  { key: "network", label: "网络脉搏", hint: "实时链上指标" },
  { key: "tokens", label: "代币雷达", hint: "全量 mint 扫描" },
  { key: "wallet", label: "钱包与转账", hint: "连接、持仓、发交易" },
];

const Shell: FC = () => {
  const [tab, setTab] = useState<Tab>("network");
  const [selected, setSelected] = useState<TokenInfo | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const onHoldings = useCallback((h: Holding[]) => setHoldings(h), []);
  const bump = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <div className="mx-auto flex min-h-full max-w-7xl flex-col px-4 py-5 sm:px-6">
      <header className="mb-5 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-cookie-500/15 text-xl">
            🍪
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-100">COOK Terminal</h1>
            <p className="text-xs text-slate-500">
              Cookie Chain 链上分析 · 代币情报 · 真实交易
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 text-[11px] text-slate-500">
          <span className="chip-ok">RPC 已连接</span>
          <code className="hidden rounded border border-white/10 px-1.5 py-0.5 font-mono sm:block">
            {RPC_HTTP.replace(/^https?:\/\//, "")}
          </code>
        </div>
      </header>

      <nav className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? "rounded-lg border border-cookie-500/40 bg-cookie-500/15 px-4 py-2 text-left"
                : "rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2 text-left hover:bg-white/5"
            }
          >
            <div
              className={`text-sm font-semibold ${tab === t.key ? "text-cookie-200" : "text-slate-300"}`}
            >
              {t.label}
            </div>
            <div className="text-[10px] text-slate-500">{t.hint}</div>
          </button>
        ))}
      </nav>

      <main className="flex-1">
        {tab === "network" && <NetworkPulse />}

        {tab === "tokens" && <TokenRadar onSelect={setSelected} />}

        {tab === "wallet" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <WalletPanel onHoldings={onHoldings} refreshKey={refreshKey} />
            <TransferTool holdings={holdings} onDone={bump} />
          </div>
        )}
      </main>

      <footer className="mt-6 border-t border-white/5 pt-4 text-[11px] text-slate-600">
        <p>
          数据直接来自 Cookie Chain 公共 RPC（{RPC_HTTP}），通过 getProgramAccounts / getSlot /
          getRecentPerformanceSamples 实时读取，未依赖任何第三方索引服务。
        </p>
        <p className="mt-1">
          仅供研究与教育用途，不构成投资建议。链上数据可能存在读取延迟，请以浏览器为准。
        </p>
      </footer>

      {selected && <TokenDetail token={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

const App: FC = () => (
  <WalletProviders>
    <Shell />
  </WalletProviders>
);

export default App;
