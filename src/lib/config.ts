import { PublicKey } from "@solana/web3.js";

/** 读取 Vite 环境变量；在 Node 下 import.meta.env 不存在时安全降级 */
const env: Record<string, string | undefined> =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

/** Cookie Chain HTTP RPC（可在 Vercel/Netlify 用环境变量覆盖） */
export const RPC_HTTP = env.VITE_RPC_URL ?? "https://rpc.cookiescan.io";

/** Cookie Chain WebSocket RPC */
export const RPC_WS = env.VITE_RPC_WS ?? "https://wss.cookiescan.io";

/** 浏览器地址 */
export const EXPLORER = "https://cookiescan.io";
export const explorerTx = (sig: string) => `${EXPLORER}/tx/${sig}`;
export const explorerAddr = (addr: string) => `${EXPLORER}/address/${addr}`;
export const explorerToken = (mint: string) => `${EXPLORER}/token/${mint}`;

/** 创世内置程序 */
export const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
export const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

/** 代币账户 / mint 的字节长度 */
export const MINT_LEN = 82;
export const ACCOUNT_LEN = 165;

/** 原生代币展示信息 */
export const NATIVE = {
  symbol: "COOK",
  name: "Cookie Chain",
  decimals: 9,
};
