import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "./config";
import type { TokenProgram } from "./tokens";

export function programIdOf(p: TokenProgram): PublicKey {
  return p === "spl-token" ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID;
}

/** 校验并解析地址，抛出可读错误 */
export function parseAddress(input: string): PublicKey {
  const v = input.trim();
  if (!v) throw new Error("请输入收款地址");
  try {
    return new PublicKey(v);
  } catch {
    throw new Error("地址格式无效（不是合法的 base58 公钥）");
  }
}

/** 原生 COOK 转账 */
export function buildNativeTransfer(
  from: PublicKey,
  to: PublicKey,
  uiAmount: number
): Transaction {
  if (!Number.isFinite(uiAmount) || uiAmount <= 0) throw new Error("转账数量必须大于 0");
  const lamports = Math.round(uiAmount * LAMPORTS_PER_SOL);
  if (lamports <= 0) throw new Error("数量太小，无法换算成最小单位");
  if (from.equals(to)) throw new Error("不能转账给自己");
  return new Transaction().add(
    SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports })
  );
}

/**
 * SPL / Token-2022 转账。
 * 若目标 ATA 不存在，会一并附加创建指令（由发送方付租金）。
 */
export async function buildSplTransfer(
  conn: Connection,
  from: PublicKey,
  to: PublicKey,
  mint: PublicKey,
  program: TokenProgram,
  uiAmount: number,
  decimals: number
): Promise<{ tx: Transaction; createdAta: boolean }> {
  if (!Number.isFinite(uiAmount) || uiAmount <= 0) throw new Error("转账数量必须大于 0");
  if (from.equals(to)) throw new Error("不能转账给自己");

  const pid = programIdOf(program);
  const sourceAta = await getAssociatedTokenAddress(mint, from, false, pid);
  const destAta = await getAssociatedTokenAddress(mint, to, false, pid);

  const sourceInfo = await conn.getAccountInfo(sourceAta, "confirmed");
  if (!sourceInfo) throw new Error("你的钱包里没有该代币账户，余额为 0");

  const tx = new Transaction();
  let createdAta = false;

  const destInfo = await conn.getAccountInfo(destAta, "confirmed");
  if (!destInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(from, destAta, to, mint, pid)
    );
    createdAta = true;
  }

  const raw = BigInt(Math.round(uiAmount * 10 ** decimals));
  tx.add(createTransferInstruction(sourceAta, destAta, from, raw, [], pid));

  return { tx, createdAta };
}

/** 从链上错误中提取人类可读信息 */
export function explainError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/User rejected|rejected the request|declined/i.test(msg)) return "你取消了签名";
  if (/insufficient lamports|insufficient funds/i.test(msg)) return "余额不足，无法支付金额 + 网络费";
  if (/0x1$|custom program error: 0x1/i.test(msg)) return "代币余额不足";
  if (/blockhash not found/i.test(msg)) return "区块哈希已过期，请重试";
  if (/timeout|timed out/i.test(msg)) return "确认超时，交易可能仍在链上，请到浏览器核对";
  if (/Simulation failed/i.test(msg)) return "交易模拟失败：请检查余额与地址是否正确";
  return msg.length > 220 ? `${msg.slice(0, 220)}…` : msg;
}
