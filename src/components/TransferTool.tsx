import { FC, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { explorerTx } from "../lib/config";
import { compact, shorten } from "../lib/format";
import { buildNativeTransfer, buildSplTransfer, explainError, parseAddress } from "../lib/transfer";
import type { Holding } from "./WalletPanel";
import { Empty, Panel, Spinner } from "./ui";

type Mode = "native" | "spl";
type Status = "idle" | "building" | "signing" | "confirming" | "success" | "error";

const STATUS_TEXT: Record<Status, string> = {
  idle: "",
  building: "正在构建交易…",
  signing: "等待钱包签名…",
  confirming: "已提交，等待链上确认…",
  success: "交易已确认",
  error: "",
};

export const TransferTool: FC<{
  holdings: Holding[];
  onDone: () => void;
}> = ({ holdings, onDone }) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();

  const [mode, setMode] = useState<Mode>("native");
  const [mint, setMint] = useState<string>("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const selected = useMemo(
    () => holdings.find((h) => h.mint === mint) ?? holdings[0] ?? null,
    [holdings, mint]
  );

  const busy = status === "building" || status === "signing" || status === "confirming";

  async function submit() {
    setError(null);
    setSignature(null);
    if (!publicKey) {
      setError("请先连接钱包");
      return;
    }
    try {
      setStatus("building");
      const dest = parseAddress(to);
      const amt = Number(amount);
      if (!amount.trim() || !Number.isFinite(amt) || amt <= 0) throw new Error("请输入有效的数量");

      let tx;
      if (mode === "native") {
        tx = buildNativeTransfer(publicKey, dest, amt);
      } else {
        if (!selected) throw new Error("你没有任何 SPL 代币可以转账");
        const built = await buildSplTransfer(
          connection,
          publicKey,
          dest,
          new PublicKey(selected.mint),
          selected.program,
          amt,
          selected.decimals
        );
        tx = built.tx;
      }

      setStatus("signing");
      const sig = await sendTransaction(tx, connection, {
        skipPreflight: false,
        maxRetries: 3,
      });

      setStatus("confirming");
      const latest = await connection.getLatestBlockhash("confirmed");
      const res = await connection.confirmTransaction(
        { signature: sig, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight },
        "confirmed"
      );
      if (res.value.err) throw new Error(`链上执行失败：${JSON.stringify(res.value.err)}`);

      setSignature(sig);
      setStatus("success");
      setAmount("");
      onDone();
    } catch (e) {
      setError(explainError(e));
      setStatus("error");
    }
  }

  return (
    <Panel title="链上转账" subtitle="真实交易，全程状态可见">
      {!connected ? (
        <Empty>连接钱包后可发送 COOK 或 SPL 代币</Empty>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setMode("native")}
              className={mode === "native" ? "btn-primary px-3 py-1.5 text-xs" : "btn-ghost px-3 py-1.5 text-xs"}
            >
              原生 COOK
            </button>
            <button
              onClick={() => setMode("spl")}
              className={mode === "spl" ? "btn-primary px-3 py-1.5 text-xs" : "btn-ghost px-3 py-1.5 text-xs"}
            >
              SPL 代币
            </button>
          </div>

          {mode === "spl" && (
            <div>
              <label className="label">选择代币</label>
              {holdings.length === 0 ? (
                <p className="mt-1 text-xs text-slate-500">你的钱包里没有 SPL 代币余额</p>
              ) : (
                <select
                  value={selected?.mint ?? ""}
                  onChange={(e) => setMint(e.target.value)}
                  className="input mt-1"
                >
                  {holdings.map((h) => (
                    <option key={h.mint} value={h.mint}>
                      {shorten(h.mint, 6, 6)} · 余额 {compact(h.amount)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label className="label">收款地址</label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="base58 公钥"
              className="input mt-1"
              spellCheck={false}
            />
          </div>

          <div>
            <label className="label">数量</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              inputMode="decimal"
              className="input mt-1"
            />
          </div>

          <button onClick={submit} disabled={busy} className="btn-primary w-full">
            {busy ? (
              <>
                <Spinner /> {STATUS_TEXT[status]}
              </>
            ) : (
              "发送交易"
            )}
          </button>

          {status === "success" && signature && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
              <div className="font-medium">交易已确认</div>
              <a
                href={explorerTx(signature)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block break-all font-mono text-[11px] text-emerald-300 hover:underline"
              >
                {signature} ↗
              </a>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
};
