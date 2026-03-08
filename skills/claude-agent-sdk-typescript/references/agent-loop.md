# Agent 循环详解

理解 Agent SDK 的消息生命周期、工具执行、上下文窗口和架构。

## Agent 循环概览

每个 agent 会话遵循相同的循环：

```
接收 Prompt → Claude 评估 → 工具调用/最终回答 → 执行工具 → 重复 → 返回结果
```

### 详细流程

1. **接收 Prompt**：Claude 接收你的 prompt、系统提示、工具定义和对话历史。SDK 产生 `SystemMessage`（subtype 为 `"init"`）
2. **评估和响应**：Claude 评估当前状态并决定如何继续。可能返回文本、请求工具调用或两者都有。SDK 产生 `AssistantMessage`
3. **执行工具**：SDK 运行每个请求的工具并收集结果。每组工具结果反馈给 Claude 进行下一次决策
4. **重复**：步骤 2 和 3 重复进行，每个完整循环是一个 turn。Claude 持续调用工具和处理结果，直到产生没有工具调用的响应
5. **返回结果**：SDK 产生最终的 `AssistantMessage`，然后是 `ResultMessage`，包含最终文本、token 使用量、成本和 session ID

## Turns 和 Messages

一个 turn 是循环内的一个往返：Claude 产生包含工具调用的输出，SDK 执行这些工具，结果自动反馈给 Claude。这个过程在你的代码不交出控制权的情况下发生。

### 示例：修复失败的测试

```
Turn 1: Claude 调用 Bash 运行 npm test → SDK 返回输出（三个失败）
Turn 2: Claude 调用 Read 读取 auth.ts 和 auth.test.ts → SDK 返回文件内容
Turn 3: Claude 调用 Edit 修复 auth.ts，然后调用 Bash 重新运行 npm test → 全部通过
Final: Claude 产生纯文本响应 "Fixed the auth bug, all three tests pass now."
```

总共 4 个 turns：3 个带工具调用，1 个最终纯文本响应。

## 消息类型

### 核心消息类型

| 类型 | 描述 |
|------|------|
| `SystemMessage` | 会话生命周期事件。`"init"` 是第一个消息（会话元数据），`"compact_boundary"` 在压缩后触发 |
| `AssistantMessage` | 每次 Claude 响应后发出，包括最终纯文本响应。包含文本内容块和工具调用块 |
| `UserMessage` | 每次工具执行后发出，包含送回给 Claude 的工具结果内容 |
| `StreamEvent` | 仅在启用部分消息时发出。包含原始 API 流事件 |
| `ResultMessage` | 最后的消息。包含最终文本结果、token 使用量、成本和 session ID |

### TypeScript 中的消息处理

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({ prompt: "Summarize this project" })) {
  if (message.type === "assistant") {
    console.log(`Turn completed: ${message.message.content.length} content blocks`);
  }
  if (message.type === "result") {
    if (message.subtype === "success") {
      console.log(message.result);
    } else {
      console.log(`Stopped: ${message.subtype}`);
    }
  }
}
```

**重要**：在 TypeScript 中，`AssistantMessage` 和 `UserMessage` 将原始 API 消息包装在 `.message` 字段中，所以内容块在 `message.message.content`，而不是 `message.content`。

## 工具执行

### 内置工具

| 类别 | 工具 | 功能 |
|------|------|------|
| 文件操作 | `Read`, `Edit`, `Write` | 读取、修改、创建文件 |
| 搜索 | `Glob`, `Grep` | 按模式查找文件，用正则搜索内容 |
| 执行 | `Bash` | 运行 shell 命令、脚本、git 操作 |
| Web | `WebSearch`, `WebFetch` | 搜索网页，获取和解析页面 |
| 发现 | `ToolSearch` | 动态查找和加载工具 |
| 编排 | `Agent`, `Skill`, `AskUserQuestion`, `TodoWrite` | 生成子代理、调用技能、询问用户、跟踪任务 |

### 工具权限

三个选项共同决定是否允许工具执行：

1. **`allowedTools`**：自动批准列出的工具
2. **`disallowedTools`**：阻止列出的工具，无论其他设置如何
3. **`permissionMode`**：控制未被允许或拒绝规则覆盖的工具发生什么

### 并行工具执行

当 Claude 在一个 turn 中请求多个工具调用时，SDK 可以根据工具类型并发或顺序运行它们：
- **只读工具**（`Read`, `Glob`, `Grep` 和标记为只读的 MCP 工具）可以并发运行
- **修改状态的工具**（`Edit`, `Write`, `Bash`）顺序运行以避免冲突

## 控制循环运行

### Turns 和预算

| 选项 | 控制内容 | 默认 |
|------|----------|------|
| `maxTurns` | 最大工具使用往返次数 | 无限制 |
| `maxBudgetUsd` | 停止前的最大成本 | 无限制 |

当达到任一限制时，SDK 返回带有相应错误子类型（`error_max_turns` 或 `error_max_budget_usd`）的 `ResultMessage`。

### Effort 级别

`effort` 选项控制 Claude 应用多少推理：

| 级别 | 行为 | 适用场景 |
|------|------|----------|
| `"low"` | 最小推理，快速响应 | 文件查找、列出目录 |
| `"medium"` | 平衡推理 | 常规编辑、标准任务 |
| `"high"` | 彻底分析 | 重构、调试 |
| `"max"` | 最大推理深度 | 需要深度分析的多步骤问题 |

TypeScript SDK 默认为 `"high"`。

### Permission Mode

| 模式 | 行为 |
|------|------|
| `"default"` | 未被覆盖规则覆盖的工具触发你的批准回调 |
| `"acceptEdits"` | 自动批准文件编辑，其他工具遵循默认规则 |
| `"plan"` | 不执行工具；Claude 生成计划供审查 |
| `"dontAsk"` | 从不提示。预批准的工具运行，其他被拒绝 |
| `"bypassPermissions"` | 运行所有允许的工具而不询问 |

## 上下文窗口

### 消耗上下文的内容

| 来源 | 何时加载 | 影响 |
|------|----------|------|
| **System prompt** | 每次请求 | 小的固定成本，始终存在 |
| **CLAUDE.md 文件** | 会话开始时 | 完整内容在每次请求中 |
| **Tool definitions** | 每次请求 | 每个工具添加其 schema |
| **Conversation history** | 随 turns 累积 | 随每个 turn 增长 |
| **Skill descriptions** | 会话开始时 | 简短摘要 |

### 自动压缩

当上下文窗口接近限制时，SDK 自动压缩对话：总结旧历史以释放空间，保留最近的交流和关键决策。SDK 在流中发出带有 subtype `"compact_boundary"` 的 `SystemMessage`。

### 保持上下文高效

- **使用子代理处理子任务**：每个子代理以全新的对话开始
- **选择性使用工具**：每个工具定义占用上下文空间
- **注意 MCP 服务器成本**：每个 MCP 服务器将其所有工具 schema 添加到每个请求
- **对常规任务使用较低 effort**：设置为 `"low"` 以减少 token 使用和成本

## 处理结果

```typescript
for await (const message of query({ prompt: "...", options: {} })) {
  if (message.type === "result") {
    // subtype 表示终止状态
    switch (message.subtype) {
      case "success":
        console.log(message.result);  // 最终结果可用
        break;
      case "error_max_turns":
        console.log("达到 turn 限制");
        break;
      case "error_max_budget_usd":
        console.log("达到预算限制");
        break;
      case "error_during_execution":
        console.log("执行期间出错");
        break;
      case "error_max_structured_output_retries":
        console.log("结构化输出验证失败");
        break;
    }

    // 所有结果子类型都包含这些信息
    console.log("Cost:", message.total_cost_usd);
    console.log("Usage:", message.usage);
    console.log("Turns:", message.num_turns);
    console.log("Session ID:", message.session_id);
  }
}
```
