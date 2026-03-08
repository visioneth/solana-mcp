import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { getConnection } from "../../utils/solana.js";
import { mcpResponse } from "../../utils/response.js";
import { logger } from "../../utils/logger.js";

// Well-known Solana programs
const KNOWN_PROGRAMS: Record<string, string> = {
  "11111111111111111111111111111111": "System Program",
  TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: "Token Program",
  TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb: "Token-2022",
  ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL:
    "Associated Token Account Program",
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s": "Token Metadata Program",
  JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4: "Jupiter v6",
  whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc: "Orca Whirlpools",
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": "Raydium AMM",
  Stake11111111111111111111111111111111111111: "Stake Program",
  Vote111111111111111111111111111111111111111: "Vote Program",
  ComputeBudget111111111111111111111111111111: "Compute Budget Program",
};

export function registerProgramTools(server: McpServer) {
  server.tool(
    "is_program",
    "Check if a Solana address is an executable program",
    {
      address: z.string().describe("Solana address to check"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network"),
    },
    async ({ address, network }) => {
      try {
        const connection = getConnection(network);
        const pubkey = new PublicKey(address);
        const info = await connection.getAccountInfo(pubkey);

        const knownName = KNOWN_PROGRAMS[address] || null;

        return mcpResponse.success({
          address,
          is_program: info?.executable || false,
          known_name: knownName,
          owner: info?.owner.toBase58() || null,
          data_length: info?.data.length || 0,
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("is_program failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "get_program_accounts",
    "Get all accounts owned by a program with optional filters",
    {
      program_id: z.string().describe("Program address"),
      data_size: z
        .number()
        .int()
        .optional()
        .describe("Filter by account data size in bytes"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Max accounts to return (default 20)"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network"),
    },
    async ({ program_id, data_size, limit, network }) => {
      try {
        const connection = getConnection(network);
        const programPubkey = new PublicKey(program_id);

        const filters: any[] = [];
        if (data_size !== undefined) {
          filters.push({ dataSize: data_size });
        }

        const accounts = await connection.getProgramAccounts(programPubkey, {
          filters: filters.length > 0 ? filters : undefined,
          dataSlice: { offset: 0, length: 0 }, // Don't fetch data to save bandwidth
        });

        const maxResults = limit || 20;
        const sliced = accounts.slice(0, maxResults);

        return mcpResponse.success({
          program_id,
          total_accounts: accounts.length,
          returned: sliced.length,
          accounts: sliced.map((a) => ({
            address: a.pubkey.toBase58(),
            lamports: a.account.lamports,
            sol: a.account.lamports / 1e9,
          })),
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("get_program_accounts failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "read_account_data",
    "Read and return the raw data of a Solana account (base64 encoded)",
    {
      address: z.string().describe("Account address to read"),
      encoding: z
        .enum(["base64", "base58", "jsonParsed"])
        .optional()
        .describe("Data encoding (default base64)"),
      network: z
        .enum(["mainnet-beta", "devnet", "testnet"])
        .optional()
        .describe("Solana network"),
    },
    async ({ address, encoding, network }) => {
      try {
        const connection = getConnection(network);
        const pubkey = new PublicKey(address);

        if (encoding === "jsonParsed") {
          const info = await connection.getParsedAccountInfo(pubkey);
          if (!info.value) {
            return mcpResponse.error(`Account not found: ${address}`);
          }
          return mcpResponse.success({
            address,
            owner: info.value.owner.toBase58(),
            lamports: info.value.lamports,
            data: info.value.data,
            executable: info.value.executable,
            network: network || "mainnet-beta",
          });
        }

        const info = await connection.getAccountInfo(pubkey);
        if (!info) {
          return mcpResponse.error(`Account not found: ${address}`);
        }

        return mcpResponse.success({
          address,
          owner: info.owner.toBase58(),
          lamports: info.lamports,
          data_length: info.data.length,
          data:
            encoding === "base58"
              ? (await import("bs58")).default.encode(info.data)
              : info.data.toString("base64"),
          encoding: encoding || "base64",
          executable: info.executable,
          network: network || "mainnet-beta",
        });
      } catch (error: any) {
        logger.error("read_account_data failed:", error);
        return mcpResponse.error(error.message);
      }
    }
  );

  server.tool(
    "identify_program",
    "Look up a well-known Solana program by its address",
    {
      address: z.string().describe("Program address to identify"),
    },
    async ({ address }) => {
      const name = KNOWN_PROGRAMS[address];
      if (name) {
        return mcpResponse.success({ address, name, known: true });
      }
      return mcpResponse.success({
        address,
        known: false,
        message:
          "Unknown program. Use is_program to check if it's executable, or read_account_data for details.",
      });
    }
  );
}
