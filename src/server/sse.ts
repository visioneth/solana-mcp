import "dotenv/config";
import express from "express";
import cors from "cors";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { logger } from "../utils/logger.js";
import { startServer } from "./base.js";

export async function startSSEServer() {
  const server = startServer();
  const app = express();
  app.use(cors());

  const transports: Record<string, SSEServerTransport> = {};

  app.get("/sse", async (_req, res) => {
    try {
      const transport = new SSEServerTransport("/messages", res);
      const sessionId = transport.sessionId;
      transports[sessionId] = transport;

      logger.info(`SSE connection established: ${sessionId}`);

      res.on("close", () => {
        logger.info(`SSE connection closed: ${sessionId}`);
        delete transports[sessionId];
      });

      await server.connect(transport);
    } catch (error) {
      logger.error("SSE connection error:", error);
      res.status(500).end();
    }
  });

  app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports[sessionId];

    if (!transport) {
      logger.warn(`No transport found for session: ${sessionId}`);
      res.status(404).json({ error: "Session not found" });
      return;
    }

    try {
      await transport.handlePostMessage(req, res);
    } catch (error) {
      logger.error("Message handling error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const port = parseInt(process.env.PORT || "3001");
  app.listen(port, () => {
    logger.info(`Solana MCP Server running on SSE mode at http://localhost:${port}`);
    logger.info(`SSE endpoint: http://localhost:${port}/sse`);
  });

  return server;
}
