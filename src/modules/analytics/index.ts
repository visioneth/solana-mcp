import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAnalyticsTools } from "./tools.js";
import { registerAnalyticsPrompts } from "./prompts.js";

export function registerAnalytics(server: McpServer) {
  registerAnalyticsTools(server);
  registerAnalyticsPrompts(server);
}
