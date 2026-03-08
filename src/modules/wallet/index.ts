import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerWalletTools } from "./tools.js";
import { registerWalletPrompts } from "./prompts.js";

export function registerWallet(server: McpServer) {
  registerWalletTools(server);
  registerWalletPrompts(server);
}
