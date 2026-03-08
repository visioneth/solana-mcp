import {
  Connection,
  Keypair,
  clusterApiUrl,
  type Cluster,
} from "@solana/web3.js";
import bs58 from "bs58";

export type SolanaNetwork = "mainnet-beta" | "devnet" | "testnet";

const connections: Map<string, Connection> = new Map();

export function getConnection(network?: SolanaNetwork): Connection {
  const rpcUrl =
    process.env.SOLANA_RPC_URL || clusterApiUrl(network || "mainnet-beta");

  if (!connections.has(rpcUrl)) {
    connections.set(
      rpcUrl,
      new Connection(rpcUrl, { commitment: "confirmed" })
    );
  }

  return connections.get(rpcUrl)!;
}

export function getKeypair(): Keypair {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "PRIVATE_KEY environment variable is required for write operations"
    );
  }

  try {
    const decoded = bs58.decode(privateKey);
    return Keypair.fromSecretKey(decoded);
  } catch {
    throw new Error(
      "Invalid PRIVATE_KEY — must be a base58-encoded Solana private key"
    );
  }
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function lamportsToSol(lamports: number | bigint): number {
  return Number(lamports) / 1e9;
}

export function solToLamports(sol: number): number {
  return Math.round(sol * 1e9);
}
