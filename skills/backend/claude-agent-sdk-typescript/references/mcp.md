# MCP 服务器集成

配置 MCP 服务器以使用外部工具扩展你的 agent。

## 快速开始

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Use the docs MCP server to explain what hooks are in Claude Code",
  options: {
    mcpServers: {
      "claude-code-docs": {
        type: "http",
        url: "https://code.claude.com/docs/mcp"
      }
    },
    allowedTools: ["mcp__claude-code-docs__*"]
  }
})) {
  if (message.type === "result" && message.subtype === "success") {
    console.log(message.result);
  }
}
```

## 添加 MCP 服务器

### 在代码中配置

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "List files in my project",
  options: {
    mcpServers: {
      filesystem: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/projects"]
      }
    },
    allowedTools: ["mcp__filesystem__*"]
  }
})) {
  if (message.type === "result" && message.subtype === "success") {
    console.log(message.result);
  }
}
```

### 从配置文件

创建 `.mcp.json` 文件在项目根目录：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/projects"]
    }
  }
}
```

## 允许 MCP 工具

### 工具命名约定

MCP 工具遵循命名模式 `mcp__<server>__<tool>`。例如，名为 `"github"` 的 GitHub 服务器上的 `list_issues` 工具变为 `mcp__github__list_issues`。

### 使用 allowedTools 授予访问权限

```typescript
const options = {
  mcpServers: {
    // 你的服务器
  },
  allowedTools: [
    "mcp__github__*",           // github 服务器的所有工具
    "mcp__db__query",          // db 服务器的 query 工具
    "mcp__slack__send_message" // slack 服务器的 send_message 工具
  ]
};
```

### 替代方案：更改权限模式

```typescript
const options = {
  mcpServers: {
    // 你的服务器
  },
  permissionMode: "acceptEdits"
};
```

### 发现可用工具

```typescript
for await (const message of query({ prompt: "...", options })) {
  if (message.type === "system" && message.subtype === "init") {
    console.log("Available MCP tools:", message.mcp_servers);
  }
}
```

## 传输类型

### stdio 服务器

本地进程通过 stdin/stdout 通信。用于在同一机器上运行的 MCP 服务器：

```typescript
const options = {
  mcpServers: {
    github: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN }
    }
  },
  allowedTools: ["mcp__github__list_issues"]
};
```

### HTTP/SSE 服务器

用于云托管的 MCP 服务器和远程 API：

```typescript
const options = {
  mcpServers: {
    "remote-api": {
      type: "sse",
      url: "https://api.example.com/mcp/sse",
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`
      }
    }
  },
  allowedTools: ["mcp__remote-api__*"]
};
```

对于 HTTP（非流式），使用 `"type": "http"`。

## MCP 工具搜索

当配置了许多 MCP 工具时，工具定义会消耗大量上下文窗口。MCP 工具搜索通过动态按需加载工具解决这个问题。

### 工作原理

工具搜索默认在 auto 模式下运行。当 MCP 工具描述消耗超过 10% 的上下文窗口时激活。MCP 工具标记为 `defer_loading`，Claude 使用搜索工具在需要时发现相关的 MCP 工具。

工具搜索需要支持 `tool_reference` 块的模型：Sonnet 4 及更高版本，或 Opus 4 及更高版本。

### 配置工具搜索

| 值 | 行为 |
|----|------|
| `auto` | 当 MCP 工具超过 10% 上下文时激活（默认） |
| `auto:5` | 在 5% 阈值时激活（可自定义百分比） |
| `true` | 始终启用 |
| `false` | 禁用，所有 MCP 工具预先加载 |

```typescript
const options = {
  mcpServers: {
    // 你的 MCP 服务器
  },
  env: {
    ENABLE_TOOL_SEARCH: "auto:5"
  }
};
```

## 认证

### 通过环境变量传递凭证

使用 `env` 字段传递 API keys、tokens 和其他凭证：

```typescript
const options = {
  mcpServers: {
    github: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN }
    }
  }
};
```

### HTTP Headers

```typescript
const options = {
  mcpServers: {
    "secure-api": {
      type: "http",
      url: "https://api.example.com/mcp",
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`
      }
    }
  }
};
```

## 示例

### 查询数据库

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const connectionString = process.env.DATABASE_URL;

for await (const message of query({
  prompt: "How many users signed up last week? Break it down by day.",
  options: {
    mcpServers: {
      postgres: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-postgres", connectionString]
      }
    },
    allowedTools: ["mcp__postgres__query"]
  }
})) {
  if (message.type === "result" && message.subtype === "success") {
    console.log(message.result);
  }
}
```

## 错误处理

```typescript
for await (const message of query({ prompt: "...", options })) {
  if (message.type === "system" && message.subtype === "init") {
    const failedServers = message.mcp_servers?.filter(
      s => s.status !== "connected"
    );
    if (failedServers?.length > 0) {
      console.warn("Failed to connect:", failedServers);
    }
  }

  if (message.type === "result" && message.subtype === "error_during_execution") {
    console.error("Execution failed");
  }
}
```

### 常见错误原因

- **缺少环境变量**：确保所需的 tokens 和凭证已设置
- **服务器未安装**：对于 `npx` 命令，验证包存在且 Node.js 在 PATH 中
- **无效连接字符串**：对于数据库服务器，验证格式且数据库可访问
- **网络问题**：对于远程 HTTP/SSE 服务器，检查 URL 可访问且防火墙允许连接
