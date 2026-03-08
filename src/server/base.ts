import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerWallet } from "../modules/wallet/index.js";
import { registerTokens } from "../modules/tokens/index.js";
import { registerDefi } from "../modules/defi/index.js";
import { registerNft } from "../modules/nft/index.js";
import { registerPrograms } from "../modules/programs/index.js";
import { registerAnalytics } from "../modules/analytics/index.js";
import { registerNetwork } from "../modules/network/index.js";

export function startServer(): McpServer {
  const server = new McpServer({
    name: "Solana MCP Server",
    version: "0.1.0",
  });

  registerWallet(server);
  registerTokens(server);
  registerDefi(server);
  registerNft(server);
  registerPrograms(server);
  registerAnalytics(server);
  registerNetwork(server);

  return server;
}
