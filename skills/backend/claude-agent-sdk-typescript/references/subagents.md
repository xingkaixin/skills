# 子代理

定义和调用子代理以隔离上下文、并行运行任务，并在 Claude Agent SDK 应用中应用专用指令。

## 子代理概述

你可以用三种方式创建子代理：
- **程序化**：使用 `query()` 选项中的 `agents` 参数
- **基于文件系统**：将代理定义为 `.claude/agents/` 目录中的 markdown 文件
- **内置通用**：Claude 可以通过 Agent 工具随时调用内置的 `general-purpose` 子代理

## 创建子代理

### 程序化定义（推荐）

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Review the authentication module for security issues",
  options: {
    // Agent 工具是子代理调用必需的
    allowedTools: ["Read", "Grep", "Glob", "Agent"],
    agents: {
      "code-reviewer": {
        // description 告诉 Claude 何时使用此代理
        description: "Expert code review specialist. Use for quality, security, and maintainability reviews.",
        // prompt 定义代理的行为和专业知识
        prompt: `You are a code review specialist with expertise in security, performance, and best practices.

When reviewing code:
- Identify security vulnerabilities
- Check for performance issues
- Verify adherence to coding standards
- Suggest specific improvements

Be thorough but concise in your feedback.`,
        // tools 限制代理能做什么（这里是只读）
        tools: ["Read", "Grep", "Glob"],
        // model 覆盖此代理的默认模型（可选）
        model: "sonnet"
      },
      "test-runner": {
        description: "Runs and analyzes test suites. Use for test execution and coverage analysis.",
        prompt: `You are a test execution specialist. Run tests and provide clear analysis of results.

Focus on:
- Running test commands
- Analyzing test output
- Identifying failing tests
- Suggesting fixes for failures`,
        // Bash 访问让此代理可以运行测试命令
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
| `tools` | `string[]` | 否 | 允许的工具数组。省略则继承所有工具 |
| `model` | `'sonnet' \| 'opus' \| 'haiku' \| 'inherit'` | 否 | 此代理的模型覆盖 |

**注意**：子代理不能生成它们自己的子代理。不要在子代理的 `tools` 数组中包含 `Agent`。

## 子代理继承的内容

子代理的上下文窗口以全新的对话开始（没有父对话），但不是空的。

| 子代理接收 | 子代理不接收 |
|------------|--------------|
| 它自己的系统提示（`AgentDefinition.prompt`）和 Agent 工具的 prompt | 父代的对话历史或工具结果 |
| 项目 CLAUDE.md（通过 `settingSources` 加载） | Skills（除非在 `AgentDefinition.skills` 中列出） |
| 工具定义（从父代继承，或 `tools` 中的子集） | 父代的系统提示 |

## 调用子代理

### 自动调用

Claude 根据任务和每个子代理的 `description` 自动决定何时调用子代理。

### 显式调用

要保证 Claude 使用特定子代理，在 prompt 中按名称提及：

```
"Use the code-reviewer agent to check the authentication module"
```

### 动态代理配置

你可以基于运行时条件动态创建代理定义：

```typescript
import { query, type AgentDefinition } from "@anthropic-ai/claude-agent-sdk";

function createSecurityAgent(securityLevel: "basic" | "strict"): AgentDefinition {
  const isStrict = securityLevel === "strict";
  return {
    description: "Security code reviewer",
    prompt: `You are a ${isStrict ? "strict" : "balanced"} security reviewer...`,
    tools: ["Read", "Grep", "Glob"],
    // 关键：对高风险审查使用更强大的模型
    model: isStrict ? "opus" : "sonnet"
  };
}

for await (const message of query({
  prompt: "Review this PR for security issues",
  options: {
    allowedTools: ["Read", "Grep", "Glob", "Agent"],
    agents: {
      "security-reviewer": createSecurityAgent("strict")
    }
  }
})) {
  if (message.type === "result") console.log(message.result);
}
```

## 检测子代理调用

子代理通过 Agent 工具调用。要检测子代理何时被调用，检查 `name` 为 `"Agent"` 的 `tool_use` 块。

```typescript
for await (const message of query({
  prompt: "Use the code-reviewer agent to review this codebase",
  options: {
    allowedTools: ["Read", "Glob", "Grep", "Agent"],
    agents: {
      "code-reviewer": {
        description: "Expert code reviewer.",
        prompt: "Analyze code quality and suggest improvements.",
        tools: ["Read", "Glob", "Grep"]
      }
    }
  }
})) {
  const msg = message as any;

  // 检查子代理调用
  for (const block of msg.message?.content ?? []) {
    if (block.type === "tool_use" && (block.name === "Task" || block.name === "Agent")) {
      console.log(`Subagent invoked: ${block.input.subagent_type}`);
    }
  }

  // 检查此消息是否来自子代理上下文内
  if (msg.parent_tool_use_id) {
    console.log(" (running inside subagent)");
  }

  if (message.type === "result") {
    console.log(message.result);
  }
}
```

**注意**：工具名称从 `"Task"` 重命名为 `"Agent"`。当前 SDK 版本在 `tool_use` 块中发出 `"Agent"`，但仍使用 `"Task"` 在 `system:init` 工具列表中。检查两个值确保跨 SDK 版本的兼容性。

## 恢复子代理

子代理可以被恢复以继续它们离开的地方。恢复的子代理保留其完整的对话历史。

```typescript
import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";

// 辅助函数：从消息内容提取 agentId
function extractAgentId(message: SDKMessage): string | undefined {
  if (!("message" in message)) return undefined;
  const content = JSON.stringify(message.message.content);
  const match = content.match(/agentId:\s*([a-f0-9-]+)/);
  return match?.[1];
}

let agentId: string | undefined;
let sessionId: string | undefined;

// 第一次调用 - 使用 Explore 代理查找 API 端点
for await (const message of query({
  prompt: "Use the Explore agent to find all API endpoints in this codebase",
  options: { allowedTools: ["Read", "Grep", "Glob", "Agent"] }
})) {
  if ("session_id" in message) sessionId = message.session_id;
  const extractedId = extractAgentId(message);
  if (extractedId) agentId = extractedId;
  if (message.type === "result") console.log(message.result);
}

// 第二次调用 - 恢复并询问后续问题
if (agentId && sessionId) {
  for await (const message of query({
    prompt: `Resume agent ${agentId} and list the top 3 most complex endpoints`,
    options: {
      allowedTools: ["Read", "Grep", "Glob", "Agent"],
      resume: sessionId
    }
  })) {
    if (message.type === "result") console.log(message.result);
  }
}
```

## 工具限制

子代理可以通过 `tools` 字段限制工具访问：

```typescript
for await (const message of query({
  prompt: "Analyze the architecture of this codebase",
  options: {
    allowedTools: ["Read", "Grep", "Glob", "Agent"],
    agents: {
      "code-analyzer": {
        description: "Static code analysis and architecture review",
        prompt: "You are a code architecture analyst...",
        // 只读工具：没有 Edit、Write 或 Bash 访问
        tools: ["Read", "Grep", "Glob"]
      }
    }
  }
})) {
  if (message.type === "result") console.log(message.result);
}
```

### 常见工具组合

| 使用场景 | 工具 | 描述 |
|----------|------|------|
| 只读分析 | `Read`, `Grep`, `Glob` | 可以检查代码但不能修改或执行 |
| 测试执行 | `Bash`, `Read`, `Grep` | 可以运行命令和分析输出 |
| 代码修改 | `Read`, `Edit`, `Write`, `Grep`, `Glob` | 完全读写访问，无命令执行 |
| 完全访问 | 所有工具 | 继承父代的所有工具（省略 `tools` 字段） |

## 使用子代理的好处

### 上下文隔离

每个子代理在自己的全新对话中运行。中间工具调用和结果留在子代理内；只有其最终消息返回给父代理。

### 并行化

多个子代理可以并发运行，显著加速复杂工作流。

### 专用指令和知识

每个子代理可以有定制的系统提示，包含特定的专业知识、最佳实践和约束。

### 工具限制

子代理可以限制为特定工具，减少意外操作的风险。
