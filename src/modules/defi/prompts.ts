import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerDefiPrompts(server: McpServer) {
  server.prompt(
    "swap_analysis",
    "Analyze a potential token swap — check prices, routes, and price impact",
    {
      input_mint: z.string().describe("Input token mint or 'SOL'"),
      output_mint: z.string().describe("Output token mint or 'SOL'"),
      amount: z.string().describe("Amount to swap"),
    },
    ({ input_mint, output_mint, amount }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `I want to swap ${amount} of ${input_mint} to ${output_mint}.

Please:
1. Get the current price of both tokens using get_token_price
2. Get a swap quote using get_swap_quote
3. Analyze the price impact
4. Tell me the expected output amount and minimum received
5. Recommend whether to proceed based on the price impact and slippage`,
          },
        },
      ],
    })
  );
}
