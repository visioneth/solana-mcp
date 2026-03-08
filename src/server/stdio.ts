import "dotenv/config";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { logger } from "../utils/logger.js";
import { startServer } from "./base.js";

export async function startStdioServer() {
  try {
    const server = startServer();
    const transport = new StdioServerTransport();

    logger.info("Solana MCP Server running on stdio mode");

    transport.onmessage = (msg) => {
      logger.debug("Received message:", msg);
    };

    transport.onclose = () => {
      logger.info("Connection closed");
    };

    transport.onerror = (err) => {
      logger.error("Transport error:", err);
    };

    await server.connect(transport);
    return server;
  } catch (error) {
    logger.error("Failed to start stdio server:", error);
    throw error;
  }
}
