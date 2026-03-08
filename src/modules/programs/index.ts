import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerProgramTools } from "./tools.js";
import { registerProgramPrompts } from "./prompts.js";

export function registerPrograms(server: McpServer) {
  registerProgramTools(server);
  registerProgramPrompts(server);
}
