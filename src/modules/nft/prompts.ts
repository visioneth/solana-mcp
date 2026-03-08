import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerNftPrompts(server: McpServer) {
  server.prompt(
    "analyze_nft",
    "Deep analysis of an NFT — metadata, collection, rarity traits",
    { mint_address: z.string().describe("NFT mint address") },
    ({ mint_address }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Analyze this Solana NFT: ${mint_address}

Please:
1. Get on-chain metadata using get_nft_metadata
2. Get collection info using get_nft_collection_info
3. Report: name, symbol, collection, attributes/traits, image URI
4. Check if update authority is active (can metadata be changed?)`,
          },
        },
      ],
    })
  );
}
