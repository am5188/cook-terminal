import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
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
