import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Props } from "../types";
import { registerDatabaseTools } from "./database-tools";

/**
 * Register all MCP tools based on user permissions
 */
// let Pops is empty 
// if props is not provided, it is empty
export function registerAllTools(server: McpServer, env: Env) {
	// Register database tools
	registerDatabaseTools(server, env);
	
	// Future tools can be registered here
	// registerOtherTools(server, env, props);
}