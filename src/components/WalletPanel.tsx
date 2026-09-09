import { FC, useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, explorerAddr } from "../lib/config";
import { compact, shorten } from "../lib/format";
import { CopyButton, Empty, Panel, Spinner } from "./ui";

export type Holding = {
  mint: string;
  amount: number;
  decimals: number;
  program: "spl-token" | "token-2022";
  ata: string;
};

export const WalletPanel: FC<{
  onHoldings: (h: Holding[]) => void;
  refreshKey: number;
}> = ({ onHoldings, refreshKey }) => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [sol, setSol] = useState<number | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!publicKey) {
      setSol(null);
      setHoldings([]);
      onHoldings([]);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const lamports = await connection.getBalance(publicKey, "confirmed");
      setSol(lamports / LAMPORTS_PER_SOL);

      const [spl, t22] = await Promise.allSettled([
        connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID }),
        connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_2022_PROGRAM_ID }),
      ]);

      const rows: Holding[] = [];
      const push = (
        res: PromiseSettledResult<any>,
        program: "spl-token" | "token-2022"
      ) => {
        if (res.status !== "fulfilled") return;
        for (const item of res.value.value) {
          const info = item.account.data?.parsed?.info;
          const amount = Number(info?.tokenAmount?.uiAmount ?? 0);
          if (!info || amount <= 0) continue;
          rows.push({
            mint: info.mint,
            amount,
            decimals: info.tokenAmount?.decimals ?? 0,
            program,
            ata: item.pubkey.toBase58(),
          });
        }
      };
      push(spl, "spl-token");
      push(t22, "token-2022");

      rows.sort((a, b) => b.amount - a.amount);
      setHoldings(rows);
      onHoldings(rows);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection, onHoldings]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <Panel
      title="我的钱包"
      subtitle="Nightly / Phantom / Solflare 均可连接"
      right={<WalletMultiButton style={{ height: 34, fontSize: 12 }} />}
    >
      {!connected || !publicKey ? (
        <Empty>连接钱包后，这里会显示余额与持仓</Empty>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <div className="label">地址</div>
              <div className="mt-0.5 flex items-center gap-2">
                <code className="font-mono text-xs text-slate-200">
                  {shorten(publicKey.toBase58(), 8, 8)}
                </code>
                <CopyButton value={publicKey.toBase58()} />
                <a
                  href={explorerAddr(publicKey.toBase58())}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-cookie-400 hover:underline"
                >
                  浏览器 ↗
                </a>
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="label">COOK 余额</div>
              <div className="stat mt-0.5">
                {loading && sol === null ? <Spinner /> : compact(sol)}
              </div>
            </div>
          </div>

          {err && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {err}
            </div>
          )}

          <div>
            <div className="label mb-2">代币持仓（{holdings.length}）</div>
            {holdings.length === 0 ? (
              <p className="text-xs text-slate-500">
                {loading ? "正在读取…" : "没有非零代币余额"}
              </p>
            ) : (
              <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
                {holdings.map((h) => (
                  <li
                    key={h.ata}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={h.program === "spl-token" ? "chip-muted" : "chip-warn"}>
                        {h.program === "spl-token" ? "SPL" : "T22"}
                      </span>
                      <a
                        href={`https://cookiescan.io/token/${h.mint}`}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate font-mono text-xs text-slate-300 hover:text-cookie-400"
                      >
                        {shorten(h.mint, 6, 6)}
                      </a>
                      <CopyButton value={h.mint} />
                    </div>
                    <span className="font-mono text-xs text-slate-100">{compact(h.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
};
