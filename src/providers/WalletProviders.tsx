import { FC, ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { NightlyWalletAdapter } from "@solana/wallet-adapter-nightly";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import type { Adapter } from "@solana/wallet-adapter-base";
import { RPC_HTTP, RPC_WS } from "../lib/config";
import "@solana/wallet-adapter-react-ui/styles.css";

/**
 * 钱包接入层。
 * Nightly 是本赏金的硬性要求，Phantom / Solflare 作为兜底。
 * 另外 WalletProvider 会自动接管实现了 Wallet Standard 的钱包。
 */
export const WalletProviders: FC<{ children: ReactNode }> = ({ children }) => {
  const wallets = useMemo<Adapter[]>(
    () => [
      new NightlyWalletAdapter(),
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={RPC_HTTP} config={{ commitment: "confirmed", wsEndpoint: RPC_WS }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
