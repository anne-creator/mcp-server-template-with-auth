# Cursor MCP Server Setup Guide

This guide shows how to connect Cursor to your deployed MCP server at `https://my-mcp-server.anneliu49.workers.dev`.

## Prerequisites

- Cursor IDE installed
- Your MCP server deployed and accessible at `https://my-mcp-server.anneliu49.workers.dev`
- `mcp-remote` package available (will be installed automatically by Cursor)

## Step-by-Step Setup

### Method 1: Using Cursor's GUI (Recommended)

1. **Open Cursor Settings**:
   - Press `Cmd+,` (Mac) or `Ctrl+,` (Windows/Linux)
   - Or go to Cursor → Preferences

2. **Navigate to MCP Settings**:
   - Go to Features → Model Context Protocol
   - Click "Add MCP Server"

3. **Configure the Server**:
   - **Type**: Select "Command"
   - **Command**: Enter `npx mcp-remote https://my-mcp-server.anneliu49.workers.dev/mcp`
   - **Name**: Enter `my-mcp-server` (optional, for identification)
   - Click "Save"

4. **Restart Cursor**:
   - Close and reopen Cursor to ensure the MCP server connection is established

### Method 2: Manual Configuration File

If you prefer to edit configuration files directly:

1. **Locate Cursor's config directory**:
   - **Mac**: `~/Library/Application Support/Cursor/User/`
   - **Windows**: `%APPDATA%\Cursor\User\`
   - **Linux**: `~/.config/Cursor/User/`

2. **Create or edit the MCP configuration**:
   - Look for `mcp-servers.json` or similar file
   - Add the following configuration:

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "npx mcp-remote https://my-mcp-server.anneliu49.workers.dev/mcp",
      "type": "command"
    }
  }
}
```

## Verifying the Connection

1. **Check MCP Status**:
   - In Cursor, look for the MCP indicator in the status bar
   - You should see a connection indicator showing your server is connected

2. **Test the Tools**:
   - Open a chat with Cursor's AI
   - Ask: "What MCP tools are available?"
   - You should see the tools from your deployed server (like `listTables`, `queryDatabase`, `executeDatabase`)

3. **Test Database Operations**:
   - Try: "What tables are available in the database?"
   - Try: "Show me the database schema"

## Troubleshooting

### Common Issues

1. **Connection Failed**:
   - Verify your server URL is correct: `https://my-mcp-server.anneliu49.workers.dev/mcp`
   - Check that your server is deployed and running
   - Ensure you have internet connectivity

2. **Authentication Required**:
   - If your MCP server requires GitHub OAuth authentication, you may need to complete the OAuth flow
   - Cursor will open a browser window for authentication when needed

3. **Tools Not Available**:
   - Restart Cursor after adding the MCP server
   - Check the Cursor logs for any error messages
   - Verify the server is responding at the `/mcp` endpoint

### Debug Steps

1. **Test Server Connectivity**:
   ```bash
   curl https://my-mcp-server.anneliu49.workers.dev/mcp
   ```

2. **Check Cursor Logs**:
   - Open Cursor's Developer Tools (Help → Toggle Developer Tools)
   - Look for MCP-related error messages in the console

3. **Verify MCP Remote Installation**:
   ```bash
   npx mcp-remote --help
   ```

## Available Tools

Once connected, you'll have access to these database tools:

- **`listTables`**: Discover database schema and structure
- **`queryDatabase`**: Execute read-only SQL queries  
- **`executeDatabase`**: Execute write operations (if you have permissions)

## Example Usage

After setup, you can use Cursor to interact with your database:

```
User: "What tables are available in the database?"
Cursor: [Uses listTables tool to show database structure]

User: "Show me all users created in the last 30 days"
Cursor: [Uses queryDatabase tool to execute SQL query]

User: "Add a new user named John with email john@example.com"
Cursor: [Uses executeDatabase tool if you have write permissions]
```

## Security Notes

- Your MCP server uses GitHub OAuth for authentication
- Only authenticated GitHub users can access the tools
- Write operations are restricted to specific GitHub usernames
- All SQL queries are validated and protected against injection attacks

## Support

If you encounter issues:
1. Check the server logs for errors
2. Verify your GitHub OAuth configuration
3. Ensure your database connection is working
4. Test the server directly using the MCP Inspector: `npx @modelcontextprotocol/inspector@latest`
