# 快速开始

Claude Agent SDK TypeScript 版本的快速上手指南。

## 安装

```bash
npm install @anthropic-ai/claude-agent-sdk
```

## 设置 API Key

```bash
# 在 .env 文件中
ANTHROPIC_API_KEY=your-api-key
```

## 第一个 Agent

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  for await (const message of query({
    prompt: "List all TypeScript files in the current directory",
    options: {
      allowedTools: ["Bash", "Glob"]  // 允许使用 Bash 和 Glob 工具
    }
  })) {
    if (message.type === "result" && message.subtype === "success") {
      console.log(message.result);
    }
  }
}

main();
```

## 运行

```bash
npx tsx agent.ts
```

## 基础模式：自动修复代码

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Review utils.ts for bugs that would cause crashes. Fix any issues you find.",
  options: {
    allowedTools: ["Read", "Edit", "Glob"],
    permissionMode: "acceptEdits"  // 自动批准文件编辑
  }
})) {
  // 打印人类可读的输出
  if (message.type === "assistant" && message.message?.content) {
    for (const block of message.message.content) {
      if ("text" in block) {
        console.log(block.text);  // Claude 的推理过程
      } else if ("name" in block) {
        console.log(`Tool: ${block.name}`);  // 正在调用的工具
      }
    }
  } else if (message.type === "result") {
    console.log(`Done: ${message.subtype}`);  // 最终结果
  }
}
```

## 消息类型说明

```typescript
// SystemMessage - 系统生命周期事件
if (message.type === "system") {
  if (message.subtype === "init") {
    console.log("Session started:", message.session_id);
  } else if (message.subtype === "compact_boundary") {
    console.log("Context was compacted");
  }
}

// AssistantMessage - Claude 的响应
if (message.type === "assistant") {
  // message.message.content 包含文本块和工具调用块
  for (const block of message.message.content) {
    if (block.type === "text") {
      console.log("Text:", block.text);
    } else if (block.type === "tool_use") {
      console.log("Tool use:", block.name, block.input);
    }
  }
}

// UserMessage - 工具执行结果
if (message.type === "user") {
  // 工具结果被送回给 Claude
  console.log("Tool result received");
}

// ResultMessage - 最终结果
if (message.type === "result") {
  console.log("Final result:", message.result);
  console.log("Cost:", message.total_cost_usd);
  console.log("Turns:", message.num_turns);
  console.log("Session ID:", message.session_id);
}
```

## 添加更多功能

### 添加 Web 搜索能力

```typescript
const options = {
  allowedTools: ["Read", "Edit", "Glob", "WebSearch"],
  permissionMode: "acceptEdits"
};
```

### 自定义系统提示

```typescript
const options = {
  allowedTools: ["Read", "Edit", "Glob"],
  permissionMode: "acceptEdits",
  systemPrompt: "You are a senior TypeScript developer. Always follow best practices."
};
```

### 运行终端命令

```typescript
const options = {
  allowedTools: ["Read", "Edit", "Glob", "Bash"],
  permissionMode: "acceptEdits"
};

// 现在可以让 agent 运行测试
// "Write unit tests for utils.ts, run them, and fix any failures"
```

## 工具组合参考

| 工具组合 | Agent 能力 |
|----------|-----------|
| `Read`, `Glob`, `Grep` | 只读分析 |
| `Read`, `Edit`, `Glob` | 分析和修改代码 |
| `Read`, `Edit`, `Bash`, `Glob`, `Grep` | 完整自动化 |

## 权限模式对比

| 模式 | 行为 | 使用场景 |
|------|------|----------|
| `acceptEdits` | 自动批准文件编辑，其他操作需要确认 | 受信任的开发工作流 |
| `dontAsk` | 拒绝不在 `allowedTools` 中的工具 | 受限的无头 agent |
| `bypassPermissions` | 运行所有工具（无需提示） | CI 环境、完全信任的环境 |
| `default` | 需要 `canUseTool` 回调处理 | 自定义审批流程 |
