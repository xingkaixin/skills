# Hooks 系统

在关键执行点拦截和自定义 agent 行为。

## Hooks 工作原理

1. **事件触发**：agent 执行期间发生某些事情，SDK 触发事件
2. **检查 Hooks**：SDK 检查为该事件类型注册的 hooks
3. **匹配器测试**：如果 hook 有 `matcher` 模式，SDK 针对事件目标测试它
4. **回调执行**：每个匹配的 hook 的回调函数接收关于正在发生的事情的输入
5. **输出处理**：回调返回输出对象，告诉 agent 做什么：允许、阻止、修改输入或注入上下文

## 可用的 Hooks

| Hook | Python | TypeScript | 触发时机 | 示例用例 |
|------|--------|------------|----------|----------|
| `PreToolUse` | ✓ | ✓ | 工具调用请求（可阻止或修改） | 阻止危险的 shell 命令 |
| `PostToolUse` | ✓ | ✓ | 工具执行结果 | 记录所有文件更改 |
| `PostToolUseFailure` | ✓ | ✓ | 工具执行失败 | 处理或记录工具错误 |
| `UserPromptSubmit` | ✓ | ✓ | 用户提交 prompt | 向 prompts 注入额外上下文 |
| `Stop` | ✓ | ✓ | Agent 执行停止 | 保存会话状态 |
| `SubagentStart` | ✓ | ✓ | 子代理初始化 | 跟踪并行任务生成 |
| `SubagentStop` | ✓ | ✓ | 子代理完成 | 聚合并行任务结果 |
| `PreCompact` | ✓ | ✓ | 对话压缩请求 | 在总结前存档完整记录 |
| `PermissionRequest` | ✓ | ✓ | 将显示权限对话框 | 自定义权限处理 |
| `SessionStart` | ✗ | ✓ | 会话初始化 | 初始化和遥测 |
| `SessionEnd` | ✗ | ✓ | 会话终止 | 清理临时资源 |
| `Notification` | ✓ | ✓ | Agent 状态消息 | 发送状态更新到 Slack |

## 配置 Hooks

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

## Matchers

使用 matchers 过滤回调何时触发。`matcher` 字段是一个正则字符串，根据 hook 事件类型匹配不同的值。

| 选项 | 类型 | 默认 | 描述 |
|------|------|------|------|
| `matcher` | `string` | `undefined` | 针对事件过滤字段匹配的正则模式。对于工具 hooks，这是工具名称 |
| `hooks` | `HookCallback[]` | - | 必需。模式匹配时执行的回调函数数组 |
| `timeout` | `number` | `60` | 超时（秒） |

**MCP 工具命名**：MCP 工具总是以 `mcp__` 开头，后跟服务器名称和动作：`mcp__<server>__<tool>`。

## 回调函数

### 输入

每个 hook 回调接收三个参数：
- **Input data**：包含事件详情。每种 hook 类型有自己的输入形状
- **Tool use ID**：关联相同工具调用的 `PreToolUse` 和 `PostToolUse` 事件
- **Context**：在 TypeScript 中，包含用于取消的 `signal` 属性

### 输出

回调返回具有两类字段的对象：
- **Top-level fields**：`systemMessage` 向对话中注入消息；`continue` 决定 hook 后 agent 是否继续运行
- **`hookSpecificOutput`**：控制当前操作。对于 `PreToolUse` hooks，设置 `permissionDecision`（`"allow"`、`"deny"` 或 `"ask"`）

### 异步输出

如果 hook 执行副作用（日志记录、发送 webhook）且不需要影响 agent 行为，可以返回异步输出：

```typescript
const asyncHook: HookCallback = async (input, toolUseID, { signal }) => {
  // 启动后台任务，然后立即返回
  sendToLoggingService(input).catch(console.error);
  return { async: true, asyncTimeout: 30000 };
};
```

| 字段 | 类型 | 描述 |
|------|------|------|
| `async` | `true` | 信号异步模式 |
| `asyncTimeout` | `number` | 后台操作的超时（毫秒） |

## 示例

### 修改工具输入

拦截 Write 工具调用并重写 `file_path` 参数：

```typescript
const redirectToSandbox: HookCallback = async (input, toolUseID, { signal }) => {
  if (input.hook_event_name !== "PreToolUse") return {};
  const preInput = input as any;
  const toolInput = preInput.tool_input as Record<string, any>;

  if (preInput.tool_name === "Write") {
    const originalPath = toolInput.file_path as string;
    return {
      hookSpecificOutput: {
        hookEventName: preInput.hook_event_name,
        permissionDecision: "allow",
        updatedInput: {
          ...toolInput,
          file_path: `/sandbox${originalPath}`
        }
      }
    };
  }
  return {};
};
```

### 添加上下文并阻止工具

阻止对 `/etc` 目录的写入，并注入提醒：

```typescript
const blockEtcWrites: HookCallback = async (input, toolUseID, { signal }) => {
  const preInput = input as any;
  const toolInput = preInput.tool_input as Record<string, any>;
  const filePath = toolInput?.file_path as string;

  if (filePath?.startsWith("/etc")) {
    return {
      systemMessage: "Remember: system directories like /etc are protected.",
      hookSpecificOutput: {
        hookEventName: preInput.hook_event_name,
        permissionDecision: "deny",
        permissionDecisionReason: "Writing to /etc is not allowed"
      }
    };
  }
  return {};
};
```

### 自动批准特定工具

自动批准只读文件系统工具：

```typescript
const autoApproveReadOnly: HookCallback = async (input, toolUseID, { signal }) => {
  if (input.hook_event_name !== "PreToolUse") return {};
  const preInput = input as any;
  const readOnlyTools = ["Read", "Glob", "Grep"];

  if (readOnlyTools.includes(preInput.tool_name)) {
    return {
      hookSpecificOutput: {
        hookEventName: preInput.hook_event_name,
        permissionDecision: "allow",
        permissionDecisionReason: "Read-only tool auto-approved"
      }
    };
  }
  return {};
};
```

### 链式多个 Hooks

Hooks 按数组中的顺序执行：

```typescript
const options = {
  hooks: {
    PreToolUse: [
      { hooks: [rateLimiter] },      // 第一：检查速率限制
      { hooks: [authorizationCheck] }, // 第二：验证权限
      { hooks: [inputSanitizer] },   // 第三：清理输入
      { hooks: [auditLogger] }       // 最后：记录操作
    ]
  }
};
```

### 使用正则 Matchers

```typescript
const options = {
  hooks: {
    PreToolUse: [
      // 匹配文件修改工具
      { matcher: "Write|Edit|Delete", hooks: [fileSecurityHook] },
      // 匹配所有 MCP 工具
      { matcher: "^mcp__", hooks: [mcpAuditHook] },
      // 匹配所有（无 matcher）
      { hooks: [globalLogger] }
    ]
  }
};
```

### 跟踪子代理活动

```typescript
import { HookCallback } from "@anthropic-ai/claude-agent-sdk";

const subagentTracker: HookCallback = async (input, toolUseID, { signal }) => {
  console.log(`[SUBAGENT] Completed: ${(input as any).agent_id}`);
  console.log(`  Transcript: ${(input as any).agent_transcript_path}`);
  return {};
};

const options = {
  hooks: {
    SubagentStop: [{ hooks: [subagentTracker] }]
  }
};
```

### 从 Hooks 发送 HTTP 请求

```typescript
const webhookNotifier: HookCallback = async (input, toolUseID, { signal }) => {
  if (input.hook_event_name !== "PostToolUse") return {};

  try {
    await fetch("https://api.example.com/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: (input as any).tool_name,
        timestamp: new Date().toISOString()
      }),
      signal
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log("Webhook request cancelled");
    }
  }
  return {};
};
```

### 转发通知到 Slack

```typescript
const notificationHandler: HookCallback = async (input, toolUseID, { signal }) => {
  const notification = input as any;
  try {
    await fetch("https://hooks.slack.com/services/YOUR/WEBHOOK/URL", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `Agent status: ${notification.message}`
      }),
      signal
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
  return {};
};

const options = {
  hooks: {
    Notification: [{ hooks: [notificationHandler] }]
  }
};
```

## 故障排除

### Hook 未触发

- 验证 hook 事件名称正确且大小写敏感（`PreToolUse`，不是 `preToolUse`）
- 检查 matcher 模式完全匹配工具名称
- 确保 hook 在 `options.hooks` 下正确的事件类型下

### Matcher 未按预期过滤

Matchers 只匹配**工具名称**，不匹配文件路径或其他参数。要按文件路径过滤，在 hook 内检查 `tool_input.file_path`。

### 修改的输入未应用

- 确保 `updatedInput` 在 `hookSpecificOutput` 内，不在顶层
- 必须同时返回 `permissionDecision: 'allow'` 使输入修改生效
- 返回新对象而不是修改原始 `tool_input`
