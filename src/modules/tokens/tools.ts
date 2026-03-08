import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import {
  getAccount,
  getAssociatedTokenAddress,
  getMint,
  createMint,
  mintTo,
  transfer,
  burn,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getConnection, getKeypair, lamportsToSol } from "../../utils/solana.js";
import { mcpResponse } from "../../utils/response.js";
import { logger } from "../../utils/logger.js";

export function registerTokenTools(server: McpServer) {
  server.tool(
    "get_token_balance",
    "Get the SPL token balance of a wallet for a specific token mint",
    {
      wallet_address: z.string().describe("Wallet address to check"),
      mint_address: z.string().describe("SPL token mint address"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network"),
    },
    async ({ wallet_address, mint_address, network }) => {
      try {
        const connection = getConnection(network);
        const wallet = new PublicKey(wallet_address);
        const mint = new PublicKey(mint_address);

        const ata = await getAssociatedTokenAddress(mint, wallet);

        try {
          const account = await getAccount(connection, ata);
          const mintInfo = await getMint(connection, mint);

          const rawBalance = Number(account.amount);
          const uiBalance = rawBalance / Math.pow(10, mintInfo.decimals);

          return mcpResponse.success({
            wallet: wallet_address,
            mint: mint_address,
            token_account: ata.toBase58(),
            balance_raw: rawBalance,
            balance_ui: uiBalance,
            decimals: mintInfo.decimals,
            network: network || "mainnet-beta",
          });
        } catch {
          return mcpResponse.success({
            wallet: wallet_address,
            mint: mint_address,
            balance_raw: 0,
            balance_ui: 0,
            message: "No token account found — wallet holds 0 of this token",
            network: network || "mainnet-beta",
          });
        }
      } catch (error: any) {
        logger.error("get_token_balance failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "get_token_info",
    "Get metadata and supply info for an SPL token by its mint address",
    {
      mint_address: z.string().describe("SPL token mint address"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network"),
    },
    async ({ mint_address, network }) => {
      try {
        const connection = getConnection(network);
        const mint = new PublicKey(mint_address);
        const mintInfo = await getMint(connection, mint);

        return mcpResponse.success({
          mint: mint_address,
          decimals: mintInfo.decimals,
          supply_raw: mintInfo.supply.toString(),
          supply_ui:
            Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals),
          mint_authority: mintInfo.mintAuthority?.toBase58() || null,
          freeze_authority: mintInfo.freezeAuthority?.toBase58() || null,
          is_initialized: mintInfo.isInitialized,
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("get_token_info failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "get_token_accounts",
    "Get all SPL token accounts owned by a wallet address",
    {
      wallet_address: z.string().describe("Wallet address to check"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network"),
    },
    async ({ wallet_address, network }) => {
      try {
        const connection = getConnection(network);
        const wallet = new PublicKey(wallet_address);

        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          wallet,
          { programId: TOKEN_PROGRAM_ID }
        );

        const accounts = tokenAccounts.value.map((ta) => {
          const parsed = ta.account.data.parsed.info;
          return {
            mint: parsed.mint,
            token_account: ta.pubkey.toBase58(),
            balance_ui: parsed.tokenAmount.uiAmount,
            balance_raw: parsed.tokenAmount.amount,
            decimals: parsed.tokenAmount.decimals,
          };
        });

        // Sort by balance descending
        accounts.sort((a, b) => (b.balance_ui || 0) - (a.balance_ui || 0));

        return mcpResponse.success({
          wallet: wallet_address,
          token_count: accounts.length,
          accounts,
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("get_token_accounts failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "create_token",
    "Create a new SPL token mint. Requires PRIVATE_KEY.",
    {
      decimals: z
        .number()
        .int()
        .min(0)
        .max(9)
        .optional()
        .describe("Token decimals (default 9)"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .describe("Network — MUST be specified"),
    },
    async ({ decimals, network }) => {
      try {
        if (!network) {
          return mcpResponse.error("Network must be explicitly specified.");
        }

        const connection = getConnection(network);
        const keypair = getKeypair();

        const mint = await createMint(
          connection,
          keypair,
          keypair.publicKey,
          keypair.publicKey,
          decimals ?? 9
        );

        logger.info(`Created token mint: ${mint.toBase58()} on ${network}`);

        return mcpResponse.success({
          success: true,
          mint: mint.toBase58(),
          decimals: decimals ?? 9,
          mint_authority: keypair.publicKey.toBase58(),
          freeze_authority: keypair.publicKey.toBase58(),
          network,
          explorer: `https://solscan.io/token/${mint.toBase58()}${network !== "mainnet-beta" ? `?cluster=${network}` : ""}`,
        });
      } catch (error: any) {
        logger.error("create_token failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "mint_tokens",
    "Mint SPL tokens to a destination wallet. Requires PRIVATE_KEY with mint authority.",
    {
      mint_address: z.string().describe("Token mint address"),
      to_address: z.string().describe("Destination wallet address"),
      amount: z.number().positive().describe("Amount of tokens to mint (UI amount)"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .describe("Network — MUST be specified"),
    },
    async ({ mint_address, to_address, amount, network }) => {
      try {
        if (!network) {
          return mcpResponse.error("Network must be explicitly specified.");
        }

        const connection = getConnection(network);
        const keypair = getKeypair();
        const mint = new PublicKey(mint_address);
        const destination = new PublicKey(to_address);

        const mintInfo = await getMint(connection, mint);
        const rawAmount = BigInt(Math.round(amount * Math.pow(10, mintInfo.decimals)));

        const ata = await getOrCreateAssociatedTokenAccount(
          connection,
          keypair,
          mint,
          destination
        );

        const signature = await mintTo(
          connection,
          keypair,
          mint,
          ata.address,
          keypair,
          rawAmount
        );

        logger.info(`Minted ${amount} tokens (${mint_address}) to ${to_address}`);

        return mcpResponse.success({
          success: true,
          signature,
          mint: mint_address,
          to: to_address,
          amount,
          network,
        });
      } catch (error: any) {
        logger.error("mint_tokens failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "transfer_token",
    "Transfer SPL tokens from the configured wallet to a destination. Requires PRIVATE_KEY.",
    {
      mint_address: z.string().describe("Token mint address"),
      to_address: z.string().describe("Destination wallet address"),
      amount: z.number().positive().describe("Amount of tokens to transfer (UI amount)"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .describe("Network — MUST be specified"),
    },
    async ({ mint_address, to_address, amount, network }) => {
      try {
        if (!network) {
          return mcpResponse.error("Network must be explicitly specified.");
        }

        const connection = getConnection(network);
        const keypair = getKeypair();
        const mint = new PublicKey(mint_address);
        const destination = new PublicKey(to_address);

        const mintInfo = await getMint(connection, mint);
        const rawAmount = BigInt(Math.round(amount * Math.pow(10, mintInfo.decimals)));

        const sourceAta = await getAssociatedTokenAddress(mint, keypair.publicKey);
        const destAta = await getOrCreateAssociatedTokenAccount(
          connection,
          keypair,
          mint,
          destination
        );

        const signature = await transfer(
          connection,
          keypair,
          sourceAta,
          destAta.address,
          keypair,
          rawAmount
        );

        logger.info(`Transferred ${amount} tokens (${mint_address}) to ${to_address}`);

        return mcpResponse.success({
          success: true,
          signature,
          mint: mint_address,
          from: keypair.publicKey.toBase58(),
          to: to_address,
          amount,
          network,
        });
      } catch (error: any) {
        logger.error("transfer_token failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "burn_tokens",
    "Burn SPL tokens from the configured wallet. Requires PRIVATE_KEY.",
    {
      mint_address: z.string().describe("Token mint address"),
      amount: z.number().positive().describe("Amount of tokens to burn (UI amount)"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .describe("Network — MUST be specified"),
    },
    async ({ mint_address, amount, network }) => {
      try {
        if (!network) {
          return mcpResponse.error("Network must be explicitly specified.");
        }

        const connection = getConnection(network);
        const keypair = getKeypair();
        const mint = new PublicKey(mint_address);

        const mintInfo = await getMint(connection, mint);
        const rawAmount = BigInt(Math.round(amount * Math.pow(10, mintInfo.decimals)));

        const ata = await getAssociatedTokenAddress(mint, keypair.publicKey);

        const signature = await burn(
          connection,
          keypair,
          ata,
          mint,
          keypair,
          rawAmount
        );

        logger.info(`Burned ${amount} tokens (${mint_address})`);

        return mcpResponse.success({
          success: true,
          signature,
          mint: mint_address,
          amount_burned: amount,
          network,
        });
      } catch (error: any) {
        logger.error("burn_tokens failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );
}
