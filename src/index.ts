#!/usr/bin/env node
import { startStdioServer } from "./server/stdio.js";
import { startSSEServer } from "./server/sse.js";
import { logger } from "./utils/logger.js";

const isSSE = process.argv.includes("--sse") || process.argv.includes("-s");

async function main() {
  const server = isSSE ? await startSSEServer() : await startStdioServer();

  const shutdown = async () => {
    logger.info("Shutting down Solana MCP Server...");
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  logger.error("Fatal error:", error);
  process.exit(1);
});
