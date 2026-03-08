import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerProgramPrompts(server: McpServer) {
  server.prompt(
    "analyze_program",
    "Analyze a Solana program — check if executable, identify it, inspect accounts",
    { program_id: z.string().describe("Program address to analyze") },
    ({ program_id }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Analyze this Solana program: ${program_id}

Please:
1. Check if it's a known program using identify_program
2. Verify it's executable using is_program
3. Get a sample of accounts owned by this program using get_program_accounts (limit 10)
4. Summarize: what this program does, how many accounts it owns, and total SOL locked`,
          },
        },
      ],
    })
  );
}
