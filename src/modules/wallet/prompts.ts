import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerWalletPrompts(server: McpServer) {
  server.prompt(
    "analyze_wallet",
    "Analyze a Solana wallet — check balance, recent activity, and account details",
    { address: z.string().describe("Solana wallet address to analyze") },
    ({ address }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Analyze this Solana wallet: ${address}

Please:
1. Check the SOL balance using get_balance
2. Get account info using get_account_info
3. Fetch recent transactions using get_recent_transactions (last 10)
4. Summarize: balance, activity level, what programs they interact with, and any notable patterns`,
          },
        },
      ],
    })
  );

  server.prompt(
    "inspect_transaction",
    "Deep-dive into a Solana transaction — decode instructions, check status, analyze fees",
    { signature: z.string().describe("Transaction signature to inspect") },
    ({ signature }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Inspect this Solana transaction: ${signature}

Please:
1. Fetch the transaction using get_transaction
2. Explain what the transaction did (transfers, swaps, program calls)
3. Note the fee paid, status, and any errors
4. Identify the programs involved and what they do`,
          },
        },
      ],
    })
  );
}
