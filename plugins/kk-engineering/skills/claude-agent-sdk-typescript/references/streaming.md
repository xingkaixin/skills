# 流式响应

从 Agent SDK 获取实时响应。

## 启用流式输出

默认情况下，Agent SDK 在 Claude 完成生成每个响应后产生完整的 `AssistantMessage` 对象。要接收增量更新，在选项中设置 `includePartialMessages: true`：

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
    if (event.type === "content_block_delta") {
      const delta = event.delta;
      if (delta.type === "text_delta") {
        process.stdout.write(delta.text);
      }
    }
  }
}
```

## StreamEvent 参考

当启用部分消息时，你收到包装在对象中的原始 Claude API 流事件：

```typescript
type SDKPartialAssistantMessage = {
  type: "stream_event";
  event: RawMessageStreamEvent;  // 来自 Anthropic SDK
  parent_tool_use_id: string | null;
  uuid: UUID;
  session_id: string;
};
```

### 事件类型

| 事件类型 | 描述 |
|----------|------|
| `message_start` | 新消息开始 |
| `content_block_start` | 新内容块开始（文本或工具使用） |
| `content_block_delta` | 内容增量更新 |
| `content_block_stop` | 内容块结束 |
| `message_delta` | 消息级更新（停止原因、用量） |
| `message_stop` | 消息结束 |

## 流式文本响应

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Explain how databases work",
  options: { includePartialMessages: true }
})) {
  if (message.type === "stream_event") {
    const event = message.event;
    if (event.type === "content_block_delta") {
      const delta = event.delta;
      if (delta.type === "text_delta") {
        // 打印每个到达的文本块
        process.stdout.write(delta.text);
      }
    }
  }
}
console.log(); // 最终换行
```

## 流式工具调用

工具调用也增量流式传输：

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

let currentTool: string | null = null;
let toolInput = "";

for await (const message of query({
  prompt: "Read the README.md file",
  options: {
    includePartialMessages: true,
    allowedTools: ["Read", "Bash"]
  }
})) {
  if (message.type === "stream_event") {
    const event = message.event;

    if (event.type === "content_block_start") {
      // 新工具调用开始
      if (event.content_block.type === "tool_use") {
        currentTool = event.content_block.name;
        toolInput = "";
        console.log(`Starting tool: ${currentTool}`);
      }
    } else if (event.type === "content_block_delta") {
      if (event.delta.type === "input_json_delta") {
        // 累积 JSON 输入
        const chunk = event.delta.partial_json;
        toolInput += chunk;
        console.log(`  Input chunk: ${chunk}`);
      }
    } else if (event.type === "content_block_stop") {
      // 工具调用完成
      if (currentTool) {
        console.log(`Tool ${currentTool} called with: ${toolInput}`);
        currentTool = null;
      }
    }
  }
}
```

## 构建流式 UI

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

let inTool = false;

for await (const message of query({
  prompt: "Find all TODO comments in the codebase",
  options: {
    includePartialMessages: true,
    allowedTools: ["Read", "Bash", "Grep"]
  }
})) {
  if (message.type === "stream_event") {
    const event = message.event;

    if (event.type === "content_block_start") {
      if (event.content_block.type === "tool_use") {
        // 工具调用开始 - 显示状态指示器
        process.stdout.write(`\n[Using ${event.content_block.name}...]`);
        inTool = true;
      }
    } else if (event.type === "content_block_delta") {
      // 仅在非工具执行时流式文本
      if (event.delta.type === "text_delta" && !inTool) {
        process.stdout.write(event.delta.text);
      }
    } else if (event.type === "content_block_stop") {
      if (inTool) {
        // 工具调用完成
        console.log(" done");
        inTool = false;
      }
    }
  } else if (message.type === "result") {
    // Agent 完成所有工作
    console.log("\n\n--- Complete ---");
  }
}
```

## 消息流

启用部分消息时，你按此顺序接收消息：

```
StreamEvent (message_start)
StreamEvent (content_block_start) - text block
StreamEvent (content_block_delta) - text chunks...
StreamEvent (content_block_stop)
StreamEvent (content_block_start) - tool_use block
StreamEvent (content_block_delta) - tool input chunks...
StreamEvent (content_block_stop)
StreamEvent (message_delta)
StreamEvent (message_stop)
AssistantMessage - complete message with all content
... tool executes ...
... more streaming events for next turn ...
ResultMessage - final result
```

## 已知限制

某些 SDK 功能与流式不兼容：

- **Extended thinking**：当你显式设置 `maxThinkingTokens` 时，`StreamEvent` 消息不会被发出
- **Structured output**：JSON 结果只出现在最终的 `ResultMessage.structured_output` 中，不作为流式增量
