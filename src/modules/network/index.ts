import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerNetworkTools } from "./tools.js";
import { registerNetworkPrompts } from "./prompts.js";

export function registerNetwork(server: McpServer) {
  registerNetworkTools(server);
  registerNetworkPrompts(server);
}
