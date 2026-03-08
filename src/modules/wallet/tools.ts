import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { getConnection, getKeypair, lamportsToSol } from "../../utils/solana.js";
import { mcpResponse } from "../../utils/response.js";
import { logger } from "../../utils/logger.js";

export function registerWalletTools(server: McpServer) {
  server.tool(
    "get_balance",
    "Get the SOL balance of a Solana wallet address",
    {
      address: z.string().describe("The Solana wallet address (base58 public key)"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network to use (defaults to mainnet-beta)"),
    },
    async ({ address, network }) => {
      try {
        const connection = getConnection(network);
        const pubkey = new PublicKey(address);
        const balance = await connection.getBalance(pubkey);
        return mcpResponse.success({
          address,
          balance_sol: lamportsToSol(balance),
          balance_lamports: balance,
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("get_balance failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "get_account_info",
    "Get detailed account information for a Solana address including owner, lamports, data size, and executable status",
    {
      address: z.string().describe("The Solana wallet or account address"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network to use"),
    },
    async ({ address, network }) => {
      try {
        const connection = getConnection(network);
        const pubkey = new PublicKey(address);
        const info = await connection.getAccountInfo(pubkey);

        if (!info) {
          return mcpResponse.success({
            address,
            exists: false,
            network: network || "mainnet-beta",
          });
        }

        return mcpResponse.success({
          address,
          exists: true,
          balance_sol: lamportsToSol(info.lamports),
          balance_lamports: info.lamports,
          owner: info.owner.toBase58(),
          executable: info.executable,
          data_length: info.data.length,
          rent_epoch: Number(info.rentEpoch),
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("get_account_info failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "transfer_sol",
    "Transfer SOL from the configured wallet to a destination address. Requires PRIVATE_KEY environment variable.",
    {
      to_address: z.string().describe("Destination Solana address"),
      amount_sol: z.number().positive().describe("Amount of SOL to transfer"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network to use — MUST be specified by user for safety"),
    },
    async ({ to_address, amount_sol, network }) => {
      try {
        if (!network) {
          return mcpResponse.error(
            "Network must be explicitly specified for transfer operations to prevent accidental mainnet transactions."
          );
        }

        const connection = getConnection(network);
        const keypair = getKeypair();
        const destination = new PublicKey(to_address);

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: destination,
            lamports: Math.round(amount_sol * LAMPORTS_PER_SOL),
          })
        );

        const signature = await sendAndConfirmTransaction(connection, transaction, [
          keypair,
        ]);

        logger.info(`Transfer: ${amount_sol} SOL to ${to_address} — tx: ${signature}`);

        return mcpResponse.success({
          success: true,
          signature,
          from: keypair.publicKey.toBase58(),
          to: to_address,
          amount_sol,
          network,
          explorer: `https://solscan.io/tx/${signature}${network !== "mainnet-beta" ? `?cluster=${network}` : ""}`,
        });
      } catch (error: any) {
        logger.error("transfer_sol failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "request_airdrop",
    "Request a SOL airdrop on devnet or testnet (for testing purposes only)",
    {
      address: z.string().describe("Solana address to receive the airdrop"),
      amount_sol: z
        .number()
        .positive()
        .max(2)
        .describe("Amount of SOL to airdrop (max 2)"),
      network: z
        .enum(["devnet", "testnet"])
        .describe("Network for airdrop (devnet or testnet only)"),
    },
    async ({ address, amount_sol, network }) => {
      try {
        const connection = getConnection(network);
        const pubkey = new PublicKey(address);
        const signature = await connection.requestAirdrop(
          pubkey,
          Math.round(amount_sol * LAMPORTS_PER_SOL)
        );

        await connection.confirmTransaction(signature);

        return mcpResponse.success({
          success: true,
          signature,
          address,
          amount_sol,
          network,
        });
      } catch (error: any) {
        logger.error("request_airdrop failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "get_transaction",
    "Get details of a Solana transaction by its signature",
    {
      signature: z.string().describe("Transaction signature (base58)"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network to use"),
    },
    async ({ signature, network }) => {
      try {
        const connection = getConnection(network);
        const tx = await connection.getParsedTransaction(signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (!tx) {
          return mcpResponse.error(`Transaction not found: ${signature}`);
        }

        return mcpResponse.success({
          signature,
          slot: tx.slot,
          block_time: tx.blockTime
            ? new Date(tx.blockTime * 1000).toISOString()
            : null,
          fee_sol: tx.meta ? lamportsToSol(tx.meta.fee) : null,
          status: tx.meta?.err ? "failed" : "success",
          error: tx.meta?.err || null,
          instructions: tx.transaction.message.instructions.map((ix: any) => ({
            program: ix.programId?.toBase58?.() || ix.programId,
            ...(ix.parsed ? { parsed: ix.parsed } : {}),
          })),
          log_messages: tx.meta?.logMessages || [],
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("get_transaction failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "get_recent_transactions",
    "Get recent transaction signatures for a Solana address",
    {
      address: z.string().describe("Solana wallet address"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe("Number of transactions to return (default 10, max 50)"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network to use"),
    },
    async ({ address, limit, network }) => {
      try {
        const connection = getConnection(network);
        const pubkey = new PublicKey(address);
        const signatures = await connection.getSignaturesForAddress(pubkey, {
          limit: limit || 10,
        });

        return mcpResponse.success({
          address,
          count: signatures.length,
          transactions: signatures.map((sig) => ({
            signature: sig.signature,
            slot: sig.slot,
            block_time: sig.blockTime
              ? new Date(sig.blockTime * 1000).toISOString()
              : null,
            status: sig.err ? "failed" : "success",
            memo: sig.memo,
          })),
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("get_recent_transactions failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "get_wallet_address",
    "Get the public wallet address from the configured PRIVATE_KEY",
    {},
    async () => {
      try {
        const keypair = getKeypair();
        return mcpResponse.success({
          address: keypair.publicKey.toBase58(),
        });
      } catch (error: any) {
        return mcpResponse.error(error.message);
      }
    }
  );
}
