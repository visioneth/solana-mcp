import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getConnection, lamportsToSol } from "../../utils/solana.js";
import { mcpResponse } from "../../utils/response.js";
import { logger } from "../../utils/logger.js";

export function registerNetworkTools(server: McpServer) {
  server.tool(
    "get_epoch_info",
    "Get current epoch information including slot, epoch progress, and timing",
    {
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network"),
    },
    async ({ network }) => {
      try {
        const connection = getConnection(network);
        const epochInfo = await connection.getEpochInfo();

        const progress =
          (epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100;

        return mcpResponse.success({
          epoch: epochInfo.epoch,
          slot: epochInfo.absoluteSlot,
          slot_index: epochInfo.slotIndex,
          slots_in_epoch: epochInfo.slotsInEpoch,
          progress_pct: Math.round(progress * 100) / 100,
          transaction_count: epochInfo.transactionCount,
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("get_epoch_info failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "get_slot",
    "Get the current slot number",
    {
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network"),
    },
    async ({ network }) => {
      try {
        const connection = getConnection(network);
        const slot = await connection.getSlot();
        return mcpResponse.success({
          slot,
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("get_slot failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "get_block_height",
    "Get the current block height",
    {
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network"),
    },
    async ({ network }) => {
      try {
        const connection = getConnection(network);
        const height = await connection.getBlockHeight();
        return mcpResponse.success({
          block_height: height,
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("get_block_height failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "get_block",
    "Get block details by slot number",
    {
      slot: z.number().int().describe("Slot number of the block"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network"),
    },
    async ({ slot, network }) => {
      try {
        const connection = getConnection(network);
        const block = await connection.getBlock(slot, {
          maxSupportedTransactionVersion: 0,
          transactionDetails: "signatures",
        });

        if (!block) {
          return mcpResponse.error(`Block not found at slot: ${slot}`);
        }

        return mcpResponse.success({
          slot,
          block_height: (block as any).blockHeight ?? null,
          block_time: block.blockTime
            ? new Date(block.blockTime * 1000).toISOString()
            : null,
          parent_slot: block.parentSlot,
          transaction_count: (block as any).signatures?.length || (block as any).transactions?.length || 0,
          previous_blockhash: block.previousBlockhash,
          blockhash: block.blockhash,
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("get_block failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "get_cluster_nodes",
    "Get info about all nodes in the Solana cluster",
    {
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network"),
    },
    async ({ network }) => {
      try {
        const connection = getConnection(network);
        const nodes = await connection.getClusterNodes();

        return mcpResponse.success({
          total_nodes: nodes.length,
          nodes: nodes.slice(0, 20).map((n) => ({
            pubkey: n.pubkey,
            gossip: n.gossip,
            tpu: n.tpu,
            rpc: n.rpc,
            version: n.version,
          })),
          note:
            nodes.length > 20
              ? `Showing 20 of ${nodes.length} nodes`
              : undefined,
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("get_cluster_nodes failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "get_supply",
    "Get the total SOL supply and circulation info",
    {
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network"),
    },
    async ({ network }) => {
      try {
        const connection = getConnection(network);
        const supply = await connection.getSupply();

        return mcpResponse.success({
          total_sol: lamportsToSol(supply.value.total),
          circulating_sol: lamportsToSol(supply.value.circulating),
          non_circulating_sol: lamportsToSol(supply.value.nonCirculating),
          non_circulating_accounts:
            supply.value.nonCirculatingAccounts.length,
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("get_supply failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "get_minimum_balance_for_rent",
    "Calculate the minimum SOL balance needed to keep an account rent-exempt",
    {
      data_size: z
        .number()
        .int()
        .min(0)
        .describe("Account data size in bytes"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network"),
    },
    async ({ data_size, network }) => {
      try {
        const connection = getConnection(network);
        const lamports =
          await connection.getMinimumBalanceForRentExemption(data_size);

        return mcpResponse.success({
          data_size_bytes: data_size,
          minimum_balance_lamports: lamports,
          minimum_balance_sol: lamportsToSol(lamports),
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("get_minimum_balance_for_rent failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "get_health",
    "Check if the Solana RPC node is healthy",
    {
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network"),
    },
    async ({ network }) => {
      try {
        const connection = getConnection(network);
        const version = await connection.getVersion();
        const slot = await connection.getSlot();
        const blockHeight = await connection.getBlockHeight();

        return mcpResponse.success({
          healthy: true,
          solana_core: version["solana-core"],
          feature_set: version["feature-set"],
          current_slot: slot,
          block_height: blockHeight,
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        return mcpResponse.success({
          healthy: false,
          error: error.message,
          network: network || "mainnet-beta",
        });
      }
    }
  );
}
