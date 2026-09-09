/**
 * 浏览器环境垫片。
 * Solana 的 SDK（@solana/web3.js、@solana/spl-token）依赖 Node 的 Buffer / process，
 * 浏览器里没有，必须在使用它们之前注入，否则会抛 "Buffer is not defined" 导致白屏。
 *
 * 必须在 main.tsx 的第一行导入。
 */
import { Buffer } from "buffer";
import process from "process";

const g = globalThis as unknown as Record<string, unknown>;

if (typeof g.global === "undefined") g.global = globalThis;
if (typeof g.Buffer === "undefined") g.Buffer = Buffer;
if (typeof g.process === "undefined") g.process = process;
