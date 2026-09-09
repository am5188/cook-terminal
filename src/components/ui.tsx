import { FC, ReactNode, useState } from "react";

export const Panel: FC<{
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  className?: string;
  children: ReactNode;
}> = ({ title, subtitle, right, className = "", children }) => (
  <section className={`panel ${className}`}>
    {(title || right) && (
      <header className="flex items-start justify-between gap-3 border-b border-white/5 px-4 py-3 sm:px-5">
        <div>
          {title && <h2 className="text-sm font-semibold text-slate-100">{title}</h2>}
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {right}
      </header>
    )}
    <div className="panel-pad">{children}</div>
  </section>
);

export const StatCard: FC<{ label: string; value: ReactNode; sub?: ReactNode }> = ({
  label,
  value,
  sub,
}) => (
  <div className="panel panel-pad">
    <div className="label">{label}</div>
    <div className="stat mt-1">{value}</div>
    {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
  </div>
);

export const Chip: FC<{ level: "ok" | "warn" | "bad" | "muted"; children: ReactNode }> = ({
  level,
  children,
}) => (
  <span
    className={
      level === "ok"
        ? "chip-ok"
        : level === "warn"
        ? "chip-warn"
        : level === "bad"
        ? "chip-bad"
        : "chip-muted"
    }
  >
    {children}
  </span>
);

export const Spinner: FC<{ className?: string }> = ({ className = "" }) => (
  <span
    className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/25 border-t-cookie-400 ${className}`}
  />
);

export const ErrorNote: FC<{ message: string | null; onClose?: () => void }> = ({
  message,
  onClose,
}) => {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
      <span className="mt-0.5">⚠</span>
      <span className="flex-1 break-words">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-rose-300/70 hover:text-rose-200">
          ✕
        </button>
      )}
    </div>
  );
};

export const CopyButton: FC<{ value: string; label?: string }> = ({ value, label = "复制" }) => {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        } catch {
          /* 忽略剪贴板权限错误 */
        }
      }}
      className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-white/5 hover:text-slate-200"
      title={value}
    >
      {done ? "已复制" : label}
    </button>
  );
};

export const Bar: FC<{ value: number; max: number; tone?: "ok" | "warn" | "bad" }> = ({
  value,
  max,
  tone = "ok",
}) => {
  const w = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const color =
    tone === "bad" ? "bg-rose-400" : tone === "warn" ? "bg-amber-400" : "bg-cookie-400";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${w}%` }} />
    </div>
  );
};

export const Empty: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="py-10 text-center text-sm text-slate-500">{children}</div>
);
