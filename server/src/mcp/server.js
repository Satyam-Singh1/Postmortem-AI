import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tools } from "./tools.js";

// Build an MCP server that exposes the SAME LangChain tools used by the agent,
// so external MCP clients (Claude Desktop, Cursor, etc.) can call them.
export function buildMcpServer() {
  const server = new McpServer({
    name: "postmortem-ai",
    version: "1.0.0",
  });

  for (const t of tools) {
    // Register each tool: its zod schema's raw shape becomes the MCP input schema,
    // and the handler simply delegates to the LangChain tool's invoke().
    server.tool(t.name, t.description, t.schema.shape, async (args) => {
      const result = await t.invoke(args);
      const text = typeof result === "string" ? result : JSON.stringify(result);
      return { content: [{ type: "text", text }] };
    });
  }

  return server;
}
