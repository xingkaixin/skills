# 自定义工具

构建和集成自定义工具以扩展 Claude Agent SDK 功能。

## 创建自定义工具

使用 `createSdkMcpServer` 和 `tool` 辅助函数定义类型安全的自定义工具：

```typescript
import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const customServer = createSdkMcpServer({
  name: "my-custom-tools",
  version: "1.0.0",
  tools: [
    tool(
      "get_weather",
      "Get current temperature for a location using coordinates",
      {
        latitude: z.number().describe("Latitude coordinate"),
        longitude: z.number().describe("Longitude coordinate")
      },
      async (args) => {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${args.latitude}&longitude=${args.longitude}&current=temperature_2m`
        );
        const data = await response.json();
        return {
          content: [{
            type: "text",
            text: `Temperature: ${data.current.temperature_2m}°C`
          }]
        };
      }
    )
  ]
});
```

## 使用自定义工具

自定义 MCP 工具需要流式输入模式。你必须使用异步生成器/可迭代对象作为 `prompt` 参数：

```typescript
async function* generateMessages() {
  yield {
    type: "user" as const,
    message: {
      role: "user" as const,
      content: "What's the weather in San Francisco?"
    }
  };
}

for await (const message of query({
  prompt: generateMessages(),
  options: {
    mcpServers: { "my-custom-tools": customServer },
    allowedTools: ["mcp__my-custom-tools__get_weather"]
  }
})) {
  if (message.type === "result" && message.subtype === "success") {
    console.log(message.result);
  }
}
```

## 工具名称格式

MCP 工具暴露给 Claude 时遵循特定格式：
- 模式：`mcp__{server_name}__{tool_name}`
- 示例：`get_weather` 工具在 `my-custom-tools` 服务器中变为 `mcp__my-custom-tools__get_weather`

## 多个工具示例

```typescript
const multiToolServer = createSdkMcpServer({
  name: "utilities",
  version: "1.0.0",
  tools: [
    tool(
      "calculate",
      "Perform calculations",
      {
        expression: z.string().describe("Mathematical expression")
      },
      async (args) => {
        const result = eval(args.expression); // 生产环境使用安全的数学库
        return {
          content: [{
            type: "text",
            text: `${args.expression} = ${result}`
          }]
        };
      }
    ),
    tool(
      "translate",
      "Translate text",
      {
        text: z.string(),
        targetLang: z.string()
      },
      async (args) => {
        // 翻译逻辑
        return {
          content: [{
            type: "text",
            text: `Translated: ${args.text}`
          }]
        };
      }
    )
  ]
});

async function* generateMessages() {
  yield {
    type: "user" as const,
    message: {
      role: "user" as const,
      content: "Calculate 5 + 3 and translate 'hello' to Spanish"
    }
  };
}

for await (const message of query({
  prompt: generateMessages(),
  options: {
    mcpServers: { utilities: multiToolServer },
    allowedTools: [
      "mcp__utilities__calculate",
      "mcp__utilities__translate"
      // "mcp__utilities__search_web" 未允许
    ]
  }
})) {
  // 处理消息
}
```

## 类型安全

使用 Zod 定义 schema：

```typescript
import { z } from "zod";

tool(
  "process_data",
  "Process structured data with type safety",
  {
    data: z.object({
      name: z.string(),
      age: z.number().min(0).max(150),
      email: z.string().email(),
      preferences: z.array(z.string()).optional()
    }),
    format: z.enum(["json", "csv", "xml"]).default("json")
  },
  async (args) => {
    // args 基于 schema 完全类型化
    console.log(`Processing ${args.data.name}'s data as ${args.format}`);
    return {
      content: [{
        type: "text",
        text: `Processed data for ${args.data.name}`
      }]
    };
  }
);
```

## 错误处理

优雅地处理错误以提供有意义的反馈：

```typescript
tool(
  "fetch_data",
  "Fetch data from an API",
  {
    endpoint: z.string().url().describe("API endpoint URL")
  },
  async (args) => {
    try {
      const response = await fetch(args.endpoint);
      if (!response.ok) {
        return {
          content: [{
            type: "text",
            text: `API error: ${response.status} ${response.statusText}`
          }]
        };
      }
      const data = await response.json();
      return {
        content: [{
          type: "text",
          text: JSON.stringify(data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Failed to fetch data: ${error.message}`
        }]
      };
    }
  }
);
```

## 示例工具

### 数据库查询工具

```typescript
const databaseServer = createSdkMcpServer({
  name: "database-tools",
  version: "1.0.0",
  tools: [
    tool(
      "query_database",
      "Execute a database query",
      {
        query: z.string().describe("SQL query to execute"),
        params: z.array(z.any()).optional().describe("Query parameters")
      },
      async (args) => {
        const results = await db.query(args.query, args.params || []);
        return {
          content: [{
            type: "text",
            text: `Found ${results.length} rows:\n${JSON.stringify(results, null, 2)}`
          }]
        };
      }
    )
  ]
});
```

### API Gateway 工具

```typescript
const apiGatewayServer = createSdkMcpServer({
  name: "api-gateway",
  version: "1.0.0",
  tools: [
    tool(
      "api_request",
      "Make authenticated API requests to external services",
      {
        service: z.enum(["stripe", "github", "openai", "slack"]),
        endpoint: z.string(),
        method: z.enum(["GET", "POST", "PUT", "DELETE"]),
        body: z.record(z.any()).optional(),
        query: z.record(z.string()).optional()
      },
      async (args) => {
        const config = {
          stripe: { baseUrl: "https://api.stripe.com/v1", key: process.env.STRIPE_KEY },
          github: { baseUrl: "https://api.github.com", key: process.env.GITHUB_TOKEN },
          openai: { baseUrl: "https://api.openai.com/v1", key: process.env.OPENAI_KEY },
          slack: { baseUrl: "https://slack.com/api", key: process.env.SLACK_TOKEN }
        };

        const { baseUrl, key } = config[args.service];
        const url = new URL(`${baseUrl}${args.endpoint}`);

        if (args.query) {
          Object.entries(args.query).forEach(([k, v]) => url.searchParams.set(k, v));
        }

        const response = await fetch(url, {
          method: args.method,
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json"
          },
          body: args.body ? JSON.stringify(args.body) : undefined
        });

        const data = await response.json();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(data, null, 2)
          }]
        };
      }
    )
  ]
});
```

### 计算器工具

```typescript
const calculatorServer = createSdkMcpServer({
  name: "calculator",
  version: "1.0.0",
  tools: [
    tool(
      "calculate",
      "Perform mathematical calculations",
      {
        expression: z.string().describe("Mathematical expression to evaluate"),
        precision: z.number().optional().default(2).describe("Decimal precision")
      },
      async (args) => {
        try {
          const result = eval(args.expression); // 生产环境使用安全的数学库
          const formatted = Number(result).toFixed(args.precision);
          return {
            content: [{
              type: "text",
              text: `${args.expression} = ${formatted}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error: Invalid expression - ${error.message}`
            }]
          };
        }
      }
    ),
    tool(
      "compound_interest",
      "Calculate compound interest for an investment",
      {
        principal: z.number().positive(),
        rate: z.number().describe("Annual interest rate as decimal, e.g., 0.05 for 5%"),
        time: z.number().positive().describe("Investment period in years"),
        n: z.number().positive().default(12).describe("Compounding frequency per year")
      },
      async (args) => {
        const amount = args.principal * Math.pow(1 + args.rate / args.n, args.n * args.time);
        const interest = amount - args.principal;
        return {
          content: [{
            type: "text",
            text: `Investment Analysis:\n` +
                  `Principal: $${args.principal.toFixed(2)}\n` +
                  `Rate: ${(args.rate * 100).toFixed(2)}%\n` +
                  `Time: ${args.time} years\n` +
                  `Compounding: ${args.n} times per year\n\n` +
                  `Final Amount: $${amount.toFixed(2)}\n` +
                  `Interest Earned: $${interest.toFixed(2)}\n` +
                  `Return: ${((interest / args.principal) * 100).toFixed(2)}%`
          }]
        };
      }
    )
  ]
});
```
