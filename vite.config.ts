import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages 部署在子路径下（https://<user>.github.io/<repo>/），
// 需要把 base 设为 "/<repo>/"。本地开发与 Vercel 部署时保持 "/"。
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
  define: {
    // Solana SDK 在浏览器环境下引用 global / process
    global: "globalThis",
  },
  resolve: {
    alias: {
      // 显式指向已安装的 polyfill 包，避免被 externalize
      buffer: "buffer",
      process: "process/browser",
    },
  },
  optimizeDeps: {
    // 强制预打包这些包，确保垫片在它们之前生效
    include: ["buffer", "process", "@solana/web3.js", "@solana/spl-token"],
    esbuildOptions: {
      define: { global: "globalThis" },
    },
  },
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 1600,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
