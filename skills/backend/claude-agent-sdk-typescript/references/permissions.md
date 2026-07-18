# 权限配置

控制你的 agent 如何使用工具。

## 权限评估流程

当 Claude 请求工具时，SDK 按此顺序检查权限：

1. **运行 Hooks**：可以允许、拒绝或继续到下一步
2. **检查 `deny` 规则**：如果匹配，工具被阻止（即使在 `bypassPermissions` 模式）
3. **应用权限模式**：`bypassPermissions` 批准到达此步骤的所有内容
4. **检查 `allow` 规则**：如果规则匹配，工具被批准
5. **调用 `canUseTool` 回调**：获取决策（在 `dontAsk` 模式跳过此步骤）

## 允许和拒绝规则

| 选项 | 效果 |
|------|------|
| `allowedTools=["Read", "Grep"]` | `Read` 和 `Grep` 自动批准。未列出的工具仍存在并进入权限模式 |
| `disallowedTools=["Bash"]` | `Bash` 始终被拒绝。拒绝规则首先检查并在每种权限模式下都有效 |

### 锁定 Agent 配置

```typescript
const options = {
  allowedTools: ["Read", "Glob", "Grep"],
  permissionMode: "dontAsk"
};
```

## 权限模式

| 模式 | 描述 | 工具行为 |
|------|------|----------|
| `default` | 标准权限行为 | 无自动批准；不匹配的工具触发你的 `canUseTool` 回调 |
| `dontAsk` | 拒绝而不是提示 | 未被预批准的内容被拒绝；从不调用 `canUseTool` |
| `acceptEdits` | 自动接受文件编辑 | 文件编辑和文件系统操作自动批准 |
| `bypassPermissions` | 绕过所有权限检查 | 所有工具无需权限提示运行（谨慎使用！） |
| `plan` | 规划模式 | 不执行工具；Claude 在不进行更改的情况下规划 |

## 设置权限模式

### 在创建查询时设置

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Help me refactor this code",
  options: {
    permissionMode: "default"
  }
})) {
  if (message.type === "result") {
    console.log(message.result);
  }
}
```

### 动态更改模式

```typescript
const q = query({
  prompt: "Help me refactor this code",
  options: {
    permissionMode: "default" // 以默认模式开始
  }
});

// 会话中动态更改模式
await q.setPermissionMode("acceptEdits");

// 使用新权限模式处理消息
for await (const message of q) {
  if (message.type === "result") {
    console.log(message.result);
  }
}
```

## 模式详情

### Accept Edits 模式 (`acceptEdits`)

自动批准文件操作：
- 文件编辑（Edit、Write 工具）
- 文件系统命令：`mkdir`, `touch`, `rm`, `mv`, `cp`

**使用场景**：你信任 Claude 的编辑并希望更快的迭代，例如在原型设计或在隔离目录中工作时。

### Don't Ask 模式 (`dontAsk`)

将任何权限提示转换为拒绝。由 `allowedTools`、`settings.json` 允许规则或 hook 预批准的工具正常运行。其他一切被拒绝而不调用 `canUseTool`。

**使用场景**：你想要 headless agent 的固定、显式工具表面。

### Bypass Permissions 模式 (`bypassPermissions`)

自动批准所有工具使用。Hooks 仍然执行并可以在需要时阻止操作。

⚠️ **极其谨慎使用**。在此模式下 Claude 有完全的系统访问权限。仅在控制环境中使用。

**注意**：`allowedTools` 不约束此模式。每个工具都被批准，不只是你列出的那些。拒绝规则（`disallowedTools`）仍被评估。

**子代理继承**：使用 `bypassPermissions` 时，所有子代理继承此模式且无法覆盖。

### Plan 模式 (`plan`)

阻止工具执行。Claude 可以分析代码和创建计划但不能进行更改。Claude 可能使用 `AskUserQuestion` 来澄清需求。

**使用场景**：你想要 Claude 提出更改而不执行它们，例如在代码审查期间。

## 相关资源

- [Handle approvals and user input](https://code.claude.com/docs/en/agent-sdk/user-input)：交互式批准提示
- [Hooks guide](./hooks.md)：在 agent 生命周期关键点运行自定义代码
- [Permission rules](https://code.claude.com/docs/en/settings#permission-settings)：`settings.json` 中的声明式允许/拒绝规则
