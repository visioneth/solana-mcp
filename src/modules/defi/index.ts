import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDefiTools } from "./tools.js";
import { registerDefiPrompts } from "./prompts.js";

export function registerDefi(server: McpServer) {
  registerDefiTools(server);
  registerDefiPrompts(server);
}
