import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTokenTools } from "./tools.js";
import { registerTokenPrompts } from "./prompts.js";

export function registerTokens(server: McpServer) {
  registerTokenTools(server);
  registerTokenPrompts(server);
}
