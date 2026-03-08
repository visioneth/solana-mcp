import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerNftTools } from "./tools.js";
import { registerNftPrompts } from "./prompts.js";

export function registerNft(server: McpServer) {
  registerNftTools(server);
  registerNftPrompts(server);
}
