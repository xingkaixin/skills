---
name: claude-agent-sdk-typescript
description: Build AI agents with the Claude Agent SDK TypeScript version. Covers query() function, message types, configuration options, subagents, hooks, MCP servers, custom tools, streaming, and structured outputs.
---

# Claude Agent SDK TypeScript

Help users build AI agents with the Claude Agent SDK TypeScript version. This skill covers the `query()` function, message types, configuration options, subagents, hooks, MCP servers, custom tools, streaming, and structured outputs.

---

## 安装与设置

### 安装 SDK

```bash
npm install @anthropic-ai/claude-agent-sdk
```

### 环境变量

```bash
# 必需的 API Key
export ANTHROPIC_API_KEY=your-api-key

# 可选：第三方 API 提供商
export CLAUDE_CODE_USE_BEDROCK=1    # Amazon Bedrock
export CLAUDE_CODE_USE_VERTEX=1     # Google Vertex AI
export CLAUDE_CODE_USE_FOUNDRY=1    # Microsoft Azure
```

## 基础用法

### 最简单的 Agent

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "What files are in this directory?",
  options: { allowedTools: ["Bash", "Glob"] }
})) {
  if (message.type === "result" && message.subtype === "success") {
    console.log(message.result);
  }
}
```

### 消息类型处理

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({ prompt: "Your task", options: {} })) {
  switch (message.type) {
    case "system":
      // 系统消息：session 初始化、compact_boundary
      if (message.subtype === "init") {
        console.log("Session ID:", message.session_id);
      }
      break;

    case "assistant":
      // Claude 的响应：包含文本和工具调用
      for (const block of message.message.content) {
        if (block.type === "text") {
          console.log("Claude:", block.text);
        } else if (block.type === "tool_use") {
          console.log("Tool:", block.name);
        }
      }
      break;

    case "user":
      // 工具执行结果
      console.log("Tool result received");
      break;

    case "result":
      // 最终结果
      if (message.subtype === "success") {
        console.log("Done:", message.result);
      } else {
        console.log("Stopped:", message.subtype);
      }
      break;
  }
}
```

## 配置选项

### 核心选项

```typescript
const options = {
  // 工具控制
  allowedTools: ["Read", "Edit", "Bash"],      // 预批准的工具
  disallowedTools: ["Write"],                   // 禁止的工具

  // 权限模式
  permissionMode: "acceptEdits",                // "default" | "acceptEdits" | "dontAsk" | "bypassPermissions" | "plan"

  // 限制
  maxTurns: 30,                                 // 最大回合数
  maxBudgetUsd: 5.0,                            // 最大预算（美元）

  // 推理深度
  effort: "high",                               // "low" | "medium" | "high" | "max"

  // 模型
  model: "claude-sonnet-4-6",                   // 指定模型

  // 系统提示
  systemPrompt: "You are a senior TypeScript developer.",

  // 设置源
  settingSources: ["project"],                  // 加载 .claude/CLAUDE.md, skills
};
```

### 权限模式对比

| 模式 | 行为 | 适用场景 |
|------|------|----------|
| `default` | 需要 `canUseTool` 回调处理未批准的工具 | 交互式应用 |
| `acceptEdits` | 自动批准文件编辑，其他工具需审批 | 开发工作流 |
| `dontAsk` | 拒绝未在 `allowedTools` 中列出的工具 | 受限的自动化 |
| `bypassPermissions` | 运行所有工具（谨慎使用！） | CI/CD、沙箱环境 |
| `plan` | 只规划，不执行 | 代码审查 |

## 会话管理

### 自动继续会话

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

// 第一次查询
for await (const message of query({
  prompt: "Analyze the auth module",
  options: { allowedTools: ["Read", "Glob"] }
})) {
  if (message.type === "result") console.log(message.result);
}

// 继续同一会话
for await (const message of query({
  prompt: "Now refactor it to use JWT",
  options: {
    continue: true,  // 自动继续最近的会话
    allowedTools: ["Read", "Edit", "Write"]
  }
})) {
  if (message.type === "result") console.log(message.result);
}
```

### 按 ID 恢复会话

```typescript
let sessionId: string | undefined;

// 第一次查询，保存 session ID
for await (const message of query({
  prompt: "Analyze the auth module",
  options: { allowedTools: ["Read", "Glob"] }
})) {
  if (message.type === "system" && message.subtype === "init") {
    sessionId = message.session_id;
  }
  if (message.type === "result") {
    console.log(message.result);
  }
}

// 之后恢复特定会话
for await (const message of query({
  prompt: "Continue with the refactoring",
  options: { resume: sessionId }
})) {
  if (message.type === "result") console.log(message.result);
}
```

### 分叉会话

```typescript
// 从现有会话创建分支
let forkedId: string | undefined;

for await (const message of query({
  prompt: "Try OAuth2 instead of JWT",
  options: {
    resume: sessionId,
    forkSession: true  // 创建分支，原会话不受影响
  }
})) {
  if (message.type === "system" && message.subtype === "init") {
    forkedId = message.session_id;  // 新分支的 ID
  }
}
```

## 子代理

### 定义子代理

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Review the authentication module",
  options: {
    allowedTools: ["Read", "Grep", "Glob", "Agent"],  // Agent 工具必需
    agents: {
      "code-reviewer": {
        description: "Expert code reviewer. Use for quality and security reviews.",
        prompt: `You are a code review specialist with expertise in security, performance, and best practices.

When reviewing code:
- Identify security vulnerabilities
- Check for performance issues
- Verify adherence to coding standards
- Suggest specific improvements

Be thorough but concise in your feedback.`,
        tools: ["Read", "Grep", "Glob"],  // 只读权限
        model: "sonnet"  // 可选：覆盖默认模型
      },
      "test-runner": {
        description: "Runs and analyzes test suites.",
        prompt: "You are a test execution specialist. Run tests and provide clear analysis of results.",
        tools: ["Bash", "Read", "Grep"]
      }
    }
  }
})) {
  if (message.type === "result") console.log(message.result);
}
```

### AgentDefinition 配置

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `description` | `string` | 是 | 何时使用此代理的自然语言描述 |
| `prompt` | `string` | 是 | 定义代理角色和行为的系统提示 |
| `tools` | `string[]` | 否 | 允许的工具列表。省略则继承所有工具 |
| `model` | `'sonnet' \| 'opus' \| 'haiku' \| 'inherit'` | 否 | 模型覆盖 |

## MCP 服务器

### stdio 传输

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "List recent GitHub issues",
  options: {
    mcpServers: {
      github: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github"],
        env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN }
      }
    },
    allowedTools: ["mcp__github__list_issues", "mcp__github__search_issues"]
  }
})) {
  if (message.type === "result") console.log(message.result);
}
```

### HTTP/SSE 传输

```typescript
for await (const message of query({
  prompt: "Search the docs",
  options: {
    mcpServers: {
      "docs-server": {
        type: "http",
        url: "https://code.claude.com/docs/mcp"
      }
    },
    allowedTools: ["mcp__docs-server__*"]  // 通配符允许所有工具
  }
})) {
  if (message.type === "result") console.log(message.result);
}
```

### 检查 MCP 连接状态

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
}
```

## Hooks

### PreToolUse Hook（阻止危险操作）

```typescript
import { query, HookCallback } from "@anthropic-ai/claude-agent-sdk";

const protectEnvFiles: HookCallback = async (input, toolUseID, { signal }) => {
  const preInput = input as any;
  const toolInput = preInput.tool_input as Record<string, any>;
  const filePath = toolInput?.file_path as string;
  const fileName = filePath?.split("/").pop();

  if (fileName === ".env") {
    return {
      hookSpecificOutput: {
        hookEventName: preInput.hook_event_name,
        permissionDecision: "deny",
        permissionDecisionReason: "Cannot modify .env files"
      }
    };
  }
  return {};
};

for await (const message of query({
  prompt: "Update the database configuration",
  options: {
    hooks: {
      PreToolUse: [{ matcher: "Write|Edit", hooks: [protectEnvFiles] }]
    }
  }
})) {
  console.log(message);
}
```

### PostToolUse Hook（审计日志）

```typescript
import { query, HookCallback } from "@anthropic-ai/claude-agent-sdk";
import { appendFile } from "fs/promises";

const logFileChange: HookCallback = async (input, toolUseID, { signal }) => {
  const postInput = input as any;
  const filePath = postInput.tool_input?.file_path ?? "unknown";
  await appendFile("./audit.log", `${new Date().toISOString()}: modified ${filePath}\n`);
  return {};
};

for await (const message of query({
  prompt: "Refactor utils.ts",
  options: {
    permissionMode: "acceptEdits",
    hooks: {
      PostToolUse: [{ matcher: "Edit|Write", hooks: [logFileChange] }]
    }
  }
})) {
  if (message.type === "result") console.log(message.result);
}
```

### 可用的 Hooks

| Hook | Python | TypeScript | 触发时机 |
|------|--------|------------|----------|
| `PreToolUse` | ✓ | ✓ | 工具调用前（可阻止/修改） |
| `PostToolUse` | ✓ | ✓ | 工具执行后 |
| `PostToolUseFailure` | ✓ | ✓ | 工具执行失败 |
| `UserPromptSubmit` | ✓ | ✓ | 用户提交提示时 |
| `Stop` | ✓ | ✓ | Agent 停止时 |
| `SubagentStart` | ✓ | ✓ | 子代理启动 |
| `SubagentStop` | ✓ | ✓ | 子代理完成 |
| `PreCompact` | ✓ | ✓ | 上下文压缩前 |
| `PermissionRequest` | ✓ | ✓ | 显示权限对话框时 |
| `SessionStart` | ✗ | ✓ | 会话初始化 |
| `SessionEnd` | ✗ | ✓ | 会话终止 |
| `Notification` | ✓ | ✓ | 状态通知 |

## 自定义工具

### 创建自定义工具

```typescript
import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const weatherServer = createSdkMcpServer({
  name: "weather-tools",
  version: "1.0.0",
  tools: [
    tool(
      "get_weather",
      "Get current temperature for a location",
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

// 使用流式输入
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
    mcpServers: { "weather-tools": weatherServer },
    allowedTools: ["mcp__weather-tools__get_weather"]
  }
})) {
  if (message.type === "result") console.log(message.result);
}
```

## 流式响应

### 启用流式输出

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Explain how databases work",
  options: {
    includePartialMessages: true,
    allowedTools: ["Bash", "Read"]
  }
})) {
  if (message.type === "stream_event") {
    const event = message.event;
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      process.stdout.write(event.delta.text);
    }
  }
}
```

### 流式事件类型

| 事件类型 | 描述 |
|----------|------|
| `message_start` | 新消息开始 |
| `content_block_start` | 内容块开始（文本或工具使用） |
| `content_block_delta` | 增量内容更新 |
| `content_block_stop` | 内容块结束 |
| `message_delta` | 消息级更新（停止原因、用量） |
| `message_stop` | 消息结束 |

## 结构化输出

### JSON Schema 方式

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const schema = {
  type: "object",
  properties: {
    company_name: { type: "string" },
    founded_year: { type: "number" },
    headquarters: { type: "string" }
  },
  required: ["company_name"]
};

for await (const message of query({
  prompt: "Research Anthropic and provide key company information",
  options: {
    outputFormat: { type: "json_schema", schema }
  }
})) {
  if (message.type === "result" && message.structured_output) {
    console.log(message.structured_output);
    // { company_name: "Anthropic", founded_year: 2021, headquarters: "San Francisco" }
  }
}
```

### Zod 方式（推荐）

```typescript
import { z } from "zod";
import { query } from "@anthropic-ai/claude-agent-sdk";

const FeaturePlan = z.object({
  feature_name: z.string(),
  summary: z.string(),
  steps: z.array(z.object({
    step_number: z.number(),
    description: z.string(),
    estimated_complexity: z.enum(["low", "medium", "high"])
  })),
  risks: z.array(z.string())
});

type FeaturePlan = z.infer<typeof FeaturePlan>;

for await (const message of query({
  prompt: "Plan how to add dark mode support to a React app",
  options: {
    outputFormat: {
      type: "json_schema",
      schema: z.toJSONSchema(FeaturePlan)
    }
  }
})) {
  if (message.type === "result" && message.structured_output) {
    const parsed = FeaturePlan.safeParse(message.structured_output);
    if (parsed.success) {
      const plan: FeaturePlan = parsed.data;
      console.log(`Feature: ${plan.feature_name}`);
      plan.steps.forEach(step => {
        console.log(`${step.step_number}. [${step.estimated_complexity}] ${step.description}`);
      });
    }
  }
}
```

## 处理结果

### 结果子类型

```typescript
for await (const message of query({ prompt: "...", options: {} })) {
  if (message.type === "result") {
    switch (message.subtype) {
      case "success":
        console.log("Result:", message.result);
        console.log("Cost:", message.total_cost_usd);
        break;
      case "error_max_turns":
        console.log("Hit turn limit. Resume session to continue.");
        break;
      case "error_max_budget_usd":
        console.log("Hit budget limit.");
        break;
      case "error_during_execution":
        console.log("Execution error occurred.");
        break;
      case "error_max_structured_output_retries":
        console.log("Failed to generate valid structured output.");
        break;
    }
  }
}
```

## 参考文档

- [快速开始指南](./references/quickstart.md)
- [Agent 循环详解](./references/agent-loop.md)
- [会话管理](./references/sessions.md)
- [子代理](./references/subagents.md)
- [Hooks 系统](./references/hooks.md)
- [MCP 服务器集成](./references/mcp.md)
- [自定义工具](./references/custom-tools.md)
- [流式响应](./references/streaming.md)
- [结构化输出](./references/structured-outputs.md)
- [权限配置](./references/permissions.md)
