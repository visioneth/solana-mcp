import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { getConnection, lamportsToSol } from "../../utils/solana.js";
import { mcpResponse } from "../../utils/response.js";
import { logger } from "../../utils/logger.js";

export function registerAnalyticsTools(server: McpServer) {
  server.tool(
    "get_tps",
    "Get the current transactions per second (TPS) on Solana",
    {
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network"),
    },
    async ({ network }) => {
      try {
        const connection = getConnection(network);
        const perfSamples = await connection.getRecentPerformanceSamples(5);

        if (perfSamples.length === 0) {
          return mcpResponse.error("No performance data available");
        }

        const avgTps =
          perfSamples.reduce(
            (sum, s) => sum + s.numTransactions / s.samplePeriodSecs,
            0
          ) / perfSamples.length;

        const currentTps =
          perfSamples[0].numTransactions / perfSamples[0].samplePeriodSecs;

        return mcpResponse.success({
          current_tps: Math.round(currentTps),
          average_tps: Math.round(avgTps),
          sample_count: perfSamples.length,
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("get_tps failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "get_largest_token_holders",
    "Get the largest holders of an SPL token",
    {
      mint_address: z.string().describe("Token mint address"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network"),
    },
    async ({ mint_address, network }) => {
      try {
        const connection = getConnection(network);
        const mint = new PublicKey(mint_address);

        const holders = await connection.getTokenLargestAccounts(mint);

        return mcpResponse.success({
          mint: mint_address,
          top_holders: holders.value.map((h, i) => ({
            rank: i + 1,
            token_account: h.address.toBase58(),
            balance_ui: h.uiAmount,
            balance_raw: h.amount,
            decimals: h.decimals,
          })),
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("get_largest_token_holders failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "get_token_supply",
    "Get the total and circulating supply of an SPL token",
    {
      mint_address: z.string().describe("Token mint address"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network"),
    },
    async ({ mint_address, network }) => {
      try {
        const connection = getConnection(network);
        const mint = new PublicKey(mint_address);

        const supply = await connection.getTokenSupply(mint);

        return mcpResponse.success({
          mint: mint_address,
          total_supply_ui: supply.value.uiAmount,
          total_supply_raw: supply.value.amount,
          decimals: supply.value.decimals,
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("get_token_supply failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "get_sol_price",
    "Get the current SOL price in USD via Jupiter",
    {},
    async () => {
      try {
        const SOL_MINT = "So11111111111111111111111111111111111111112";
        const response = await fetch(
          `https://api.jup.ag/price/v2?ids=${SOL_MINT}`
        );
        const data = (await response.json()) as any;

        if (!data.data?.[SOL_MINT]) {
          return mcpResponse.error("Could not fetch SOL price");
        }

        return mcpResponse.success({
          token: "SOL",
          price_usd: data.data[SOL_MINT].price,
        });
      } catch (error: any) {
        logger.error("get_sol_price failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "get_largest_accounts",
    "Get the largest SOL-holding accounts on the network",
    {
      filter: z
        .enum(["circulating", "nonCirculating"])
        .optional()
        .describe("Filter by circulating or non-circulating"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network"),
    },
    async ({ filter, network }) => {
      try {
        const connection = getConnection(network);
        const accounts = await connection.getLargestAccounts(
          filter ? { filter } : undefined
        );

        return mcpResponse.success({
          filter: filter || "all",
          accounts: accounts.value.map((a, i) => ({
            rank: i + 1,
            address: a.address.toBase58(),
            balance_sol: lamportsToSol(a.lamports),
          })),
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("get_largest_accounts failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );
}
