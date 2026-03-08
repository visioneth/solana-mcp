import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerNetworkPrompts(server: McpServer) {
  server.prompt(
    "solana_overview",
    "Get a comprehensive overview of the Solana network status",
    {},
    () => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Give me a full Solana network overview.

Please run these tools and compile the results:
1. get_health — is the network up?
2. get_epoch_info — current epoch and progress
3. get_tps — current throughput
4. get_supply — total and circulating SOL
5. get_sol_price — current price
6. get_cluster_nodes — validator count

Present a clean dashboard-style summary.`,
          },
        },
      ],
    })
  );
}
