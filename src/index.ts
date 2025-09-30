// import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
// import { Props } from "./types";
// import { GitHubHandler } from "./auth/github-handler";
import { closeDb } from "./database/connection";
import { registerAllTools } from "./tools/register-tools";

export class MyMCP extends McpAgent<Env, Record<string, never>> {
	server = new McpServer({
		name: "PostgreSQL Database MCP Server",
		version: "1.0.0",
	});

	/**
	 * Cleanup database connections when Durable Object is shutting down
	 */
	async cleanup(): Promise<void> {
		try {
			await closeDb();
			console.log('Database connections closed successfully');
		} catch (error) {
			console.error('Error during database cleanup:', error);
		}
	}

	/**
	 * Durable Objects alarm handler - used for cleanup
	 */
	async alarm(): Promise<void> {
		await this.cleanup();
	}

	async init() {
		// Register all tools based on user permissions
		registerAllTools(this.server, this.env);
	}
}

export default {
    fetch(request: Request, env: Env, ctx: ExecutionContext) {
        const url = new URL(request.url);

        if (url.pathname === "/sse" || url.pathname === "/sse/message") {
            return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
        }

        if (url.pathname === "/mcp") {
            return MyMCP.serve("/mcp").fetch(request, env, ctx);
        }

        return new Response("Not found", { status: 404 });
    },
};