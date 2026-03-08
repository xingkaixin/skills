# 会话管理

学习如何使用 continue、resume 和 fork 返回之前的运行状态。

## 会话概念

会话是 SDK 在你的 agent 工作时积累的对话历史。它包含你的 prompt、agent 进行的每个工具调用、每个工具结果和每个响应。会话会自动写入磁盘，方便以后返回。

**注意**：会话持久化**对话**，而不是文件系统。要快照和恢复 agent 进行的文件更改，请使用[文件 checkpointing](https://code.claude.com/docs/en/agent-sdk/file-checkpointing)。

## 选择合适的方法

| 你在构建什么 | 使用什么 |
|-------------|----------|
| 一次性任务：单个 prompt，无后续 | 无需额外操作。一个 `query()` 调用处理它 |
| 单进程中的多轮对话 | TypeScript: `continue: true` |
| 进程重启后继续之前的工作 | `continue: true` 恢复最近的会话 |
| 恢复特定的过去会话（不是最近的） | 捕获 session ID 并传递给 `resume` |
| 尝试替代方法而不丢失原始方法 | Fork 会话 |
| 无状态任务，不想写入磁盘 | 设置 `persistSession: false` |

## Continue、Resume 和 Fork 对比

- **Continue**：找到当前目录中最新的会话。无需跟踪任何内容
- **Resume**：接受特定的 session ID。你需要跟踪 ID
- **Fork**：创建一个以原始历史副本开始的新会话。原始会话保持不变

## 自动会话管理

### TypeScript: `continue: true`

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

// 第一次查询：创建新会话
for await (const message of query({
  prompt: "Analyze the auth module",
  options: { allowedTools: ["Read", "Glob", "Grep"] }
})) {
  if (message.type === "result" && message.subtype === "success") {
    console.log(message.result);
  }
}

// 第二次查询：continue: true 恢复最近的会话
for await (const message of query({
  prompt: "Now refactor it to use JWT",
  options: {
    continue: true,
    allowedTools: ["Read", "Edit", "Write", "Glob", "Grep"]
  }
})) {
  if (message.type === "result" && message.subtype === "success") {
    console.log(message.result);
  }
}
```

## 使用 `query()` 的会话选项

### 捕获 Session ID

Resume 和 fork 需要 session ID。从 `ResultMessage.session_id` 读取。

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

let sessionId: string | undefined;

for await (const message of query({
  prompt: "Analyze the auth module and suggest improvements",
  options: { allowedTools: ["Read", "Glob", "Grep"] }
})) {
  if (message.type === "result") {
    sessionId = message.session_id;
    if (message.subtype === "success") {
      console.log(message.result);
    }
  }
}

console.log(`Session ID: ${sessionId}`);
```

**注意**：在 TypeScript 中，session ID 也可以在 init `SystemMessage` 上作为直接字段使用。

```typescript
if (message.type === "system" && message.subtype === "init") {
  sessionId = message.session_id;
}
```

### 按 ID 恢复

传递 session ID 给 `resume` 以返回到该特定会话。

```typescript
// 之前的会话分析了代码；现在基于此分析构建
for await (const message of query({
  prompt: "Now implement the refactoring you suggested",
  options: {
    resume: sessionId,
    allowedTools: ["Read", "Edit", "Write", "Glob", "Grep"]
  }
})) {
  if (message.type === "result" && message.subtype === "success") {
    console.log(message.result);
  }
}
```

**注意**：如果 `resume` 调用返回新鲜会话而不是预期的历史记录，最常见的原因是 `cwd` 不匹配。会话存储在 `~/.claude/projects/<cwd>/*.jsonl` 下。

### Fork 探索替代方案

Forking 创建一个以原始历史副本开始的新会话，但从该点开始分叉。原始会话的 ID 和历史保持不变。

```typescript
// Fork：从 sessionId 分支到新会话
let forkedId: string | undefined;

for await (const message of query({
  prompt: "Instead of JWT, implement OAuth2 for the auth module",
  options: {
    resume: sessionId,
    forkSession: true
  }
})) {
  if (message.type === "system" && message.subtype === "init") {
    forkedId = message.session_id;  // 新分支的 ID
  }
  if (message.type === "result" && message.subtype === "success") {
    console.log(message.result);
  }
}

console.log(`Forked session: ${forkedId}`);

// 原始会话未受影响；恢复它继续 JWT 路径
for await (const message of query({
  prompt: "Continue with the JWT approach",
  options: { resume: sessionId }
})) {
  if (message.type === "result" && message.subtype === "success") {
    console.log(message.result);
  }
}
```

## 禁用会话持久化

对于无状态任务，你可以完全禁用会话持久化：

```typescript
for await (const message of query({
  prompt: "Quick analysis",
  options: {
    persistSession: false  // 会话仅在内存中存在，不写入磁盘
  }
})) {
  // ...
}
```

## 跨主机恢复

会话文件对于创建它们的机器是本地的。要在不同主机上恢复会话（CI worker、临时容器、无服务器）：

1. **移动会话文件**：从第一次运行持久化 `~/.claude/projects/<cwd>/*.jsonl` 并在调用 `resume` 前恢复到新主机上的相同路径
2. **不依赖会话恢复**：将你需要的结果（分析输出、决策、文件差异）捕获为应用状态，并传递到新鲜会话的 prompt 中

## 会话管理函数

TypeScript SDK 暴露函数用于枚举磁盘上的会话和读取其消息：

```typescript
import { listSessions, getSessionMessages } from "@anthropic-ai/claude-agent-sdk";

// 列出所有会话
const sessions = await listSessions();

// 获取特定会话的消息
const messages = await getSessionMessages(sessionId);
```
