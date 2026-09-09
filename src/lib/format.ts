/** 数值与文本格式化工具 */

export function shorten(addr: string, head = 4, tail = 4): string {
  if (!addr) return "";
  if (addr.length <= head + tail + 1) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

const compactFmt = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});
const plainFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export function compact(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return compactFmt.format(n);
}

export function num(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return plainFmt.format(n);
}

export function pct(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

/** 把最小单位换算成人类可读数量 */
export function toUiAmount(raw: bigint | string | number, decimals: number): number {
  const v = typeof raw === "bigint" ? raw : BigInt(raw);
  const base = 10n ** BigInt(decimals);
  const whole = v / base;
  const frac = v % base;
  return Number(whole) + Number(frac) / Number(base);
}

export function toUiString(raw: bigint, decimals: number): string {
  const base = 10n ** BigInt(decimals);
  const whole = (raw / base).toString();
  const frac = (raw % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

export function timeAgo(tsSeconds: number | null | undefined): string {
  if (!tsSeconds) return "—";
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - tsSeconds);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function hhmmss(d: Date): string {
  return d.toLocaleTimeString("en-GB", { hour12: false });
}
