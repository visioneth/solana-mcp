import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerTokenPrompts(server: McpServer) {
  server.prompt(
    "analyze_token",
    "Analyze an SPL token — check supply, authorities, and holder distribution",
    { mint_address: z.string().describe("SPL token mint address") },
    ({ mint_address }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Analyze this Solana SPL token: ${mint_address}

Please:
1. Get token info using get_token_info
2. Check if mint authority is still active (can more tokens be created?)
3. Check if freeze authority exists (can accounts be frozen?)
4. Report the total supply
5. Assess if this looks like a legitimate project or potential rug pull based on the on-chain data`,
          },
        },
      ],
    })
  );

  server.prompt(
    "portfolio_check",
    "Check all token holdings for a Solana wallet",
    { wallet_address: z.string().describe("Wallet address to check") },
    ({ wallet_address }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Show me all token holdings for wallet: ${wallet_address}

Please:
1. Get SOL balance using get_balance
2. Get all token accounts using get_token_accounts
3. Present a summary table of holdings sorted by value
4. Flag any tokens with 0 balance that could be closed to reclaim rent`,
          },
        },
      ],
    })
  );
}
