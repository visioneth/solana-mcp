import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerAnalyticsPrompts(server: McpServer) {
  server.prompt(
    "token_research",
    "Research a Solana token — price, supply, holders, and risk assessment",
    { mint_address: z.string().describe("Token mint address") },
    ({ mint_address }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Research this Solana token: ${mint_address}

Please:
1. Get the token price using get_token_price
2. Get supply info using get_token_supply
3. Get top holders using get_largest_token_holders
4. Check token info using get_token_info (from tokens module)
5. Analyze:
   - Is the supply concentrated (top holder %)?
   - Is mint authority still active (can more be minted)?
   - Is freeze authority active (can accounts be frozen)?
   - What's the holder distribution like?
6. Give a risk score (low/medium/high) based on the data`,
          },
        },
      ],
    })
  );

  server.prompt(
    "network_health",
    "Check Solana network health and performance metrics",
    {},
    () => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Give me a Solana network health report.

Please:
1. Get current TPS using get_tps
2. Get SOL price using get_sol_price
3. Get cluster info using get_cluster_nodes (from network module)
4. Get epoch info using get_epoch_info (from network module)
5. Summarize: TPS, SOL price, epoch progress, validator count, and overall health`,
          },
        },
      ],
    })
  );
}
