import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildMcpServer } from "./server.js";
import { initMongo } from "../db/mongo.js";

// Entry point for running PostmortemAI as an MCP server over stdio.
// Run with: npm run mcp
async function main() {
  // fetch_runbook reads from MongoDB, so connect before serving.
  await initMongo();

  const server = buildMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // stdout is the MCP channel — status goes to stderr only.
  console.error("PostmortemAI MCP server running on stdio.");
}

main().catch((err) => {
  console.error("MCP server failed:", err);
  process.exit(1);
});
