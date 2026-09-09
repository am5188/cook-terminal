// 用真实链上数据验证 tokens.ts 的解析逻辑
import { fetchAllMints, fetchHolderStats, riskSignals, riskScore } from "../src/lib/tokens";
import { fetchNetworkPulse, fetchPerfSamples } from "../src/lib/chain";

(async () => {
  const pulse = await fetchNetworkPulse();
  console.log("=== 网络 ===");
  console.log({
    slot: pulse.slot,
    version: pulse.version,
    epoch: pulse.epoch,
    tps: pulse.tps?.toFixed(1),
    totalSupply: pulse.totalSupply,
  });

  const perf = await fetchPerfSamples(5);
  console.log("perf samples:", perf.length, perf[0] ? JSON.stringify(perf[0]) : "");

  console.log("\n=== mint 枚举 ===");
  const t0 = Date.now();
  const mints = await fetchAllMints();
  console.log(`解析出 ${mints.length} 个 mint，耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  const spl = mints.filter((m) => m.program === "spl-token").length;
  const t22 = mints.length - spl;
  console.log({ spl, t22 });
  console.log("供应量为 0 的:", mints.filter((m) => m.uiSupply === 0).length);
  console.log("已放弃 mint 权限的:", mints.filter((m) => m.mintAuthority === null).length);

  const top = [...mints].sort((a, b) => b.uiSupply - a.uiSupply).slice(0, 5);
  console.log("\n供应量前 5:");
  for (const t of top) {
    console.log(
      `  ${t.mint}  ${t.program}  dec=${t.decimals}  supply=${t.uiSupply.toExponential(3)}`
    );
  }

  const sample = top[0];
  if (sample) {
    console.log(`\n=== 持有人分析: ${sample.mint} ===`);
    const h = await fetchHolderStats(sample.mint, sample.program);
    console.log({
      holders: h.holders,
      totalAccounts: h.totalAccounts,
      top10Share: h.top10Share.toFixed(4),
      hhi: h.hhi.toFixed(1),
      largest: h.largest ? `${h.largest.owner.slice(0, 8)}… ${(h.largest.share * 100).toFixed(2)}%` : null,
    });
    console.log("分布:", JSON.stringify(h.distribution));
    const sig = riskSignals(sample, h);
    console.log("风险信号:", sig.map((s) => `${s.level}:${s.label}`).join(" | "));
    console.log("风险分:", riskScore(sig));
  }
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
