---
name: coding-agent-session-formats
description: Use when parsing, exporting, visualizing, or computing token/cost stats from local coding-agent session files (Codex rollout jsonl, Claude Code project jsonl, Kimi context/wire jsonl, OpenCode/zcode SQLite, Pi tree jsonl). Covers storage paths per agent, message schemas, assistant message ordering/dedup rules, a unified export schema, cache-aware cost calculation, and streaming-parse performance rules for 100-400MB files.
---

# Coding Agent 本地会话格式与解析

各家 coding agent 本地会话存储的逆向知识。适用于解析、导出、可视化会话，或做 token/cost 统计。

## 1. 存储位置（env 优先 → home 兜底）

路径解析设计：官方环境变量优先 → 默认 home → 本地开发目录回退。

| Agent | 根目录 | 会话数据 | 形态 |
|---|---|---|---|
| Codex | `CODEX_HOME` → `~/.codex` | `sessions/YYYY/MM/DD/rollout-<ISO>-<uuid>.jsonl`；标题缓存 `.codex-global-state.json` | JSONL |
| Claude Code | `CLAUDE_CONFIG_DIR` → `~/.claude` | `projects/<cwd转义>/<sessionId>.jsonl`（cwd 的 `/` 转 `-`） | JSONL |
| Kimi | `KIMI_SHARE_DIR` → `~/.kimi` | `sessions/<hash>/<uuid>/`：`context.jsonl`(主) + `wire.jsonl`(事件) + `metadata.json` | JSONL 目录 |
| OpenCode | `XDG_DATA_HOME/opencode` → `~/.local/share/opencode` | `opencode.db`（表 session/message/part） | SQLite |
| zcode | `~/.zcode`（macOS）/ `%USERPROFILE%\.zcode`（Win）；Linux 不存在 | `cli/db/db.sqlite`，OpenCode 同范式 | SQLite |
| Pi | `~/.pi` | `agent/sessions/--<path>--/<ts>_<uuid>.jsonl`（树状） | JSONL |

resume 命令：`claude --resume {id}` / `codex resume {id}` / `kimi --r {id}` / `opencode -s {id}` / `pi --session {id}`；Cursor 无。

## 2. 各格式消息结构

### Codex（rollout jsonl）
每行 `{timestamp, type, payload}`：
- `session_meta`：`{id, timestamp, cwd, ...}`。
- `response_item`（正文）：`payload.type` = `message`（role: developer|user|assistant，content[].type = input_text/output_text）、`reasoning`（summary[].type=summary_text 即 thinking）、`function_call`/`function_call_output`（按 `call_id` 配对）、`custom_tool_call(_output)`（如 `apply_patch`）。
- `event_msg`：UI 事件，**与 response_item 内容重复，是主要去重来源**。

规则：时间取每行 `timestamp`；call/output 按 `call_id` 合并为一个 tool part；**工具向上归属**——text 之后连续的 tool 挂到该 text，直到下一条 text；工具名 `exec_command → bash`（function_call 几乎只有它，其余走 custom_tool_call）；`role=developer`、`<INSTRUCTIONS>`/`<environment_context>` 包装的 user 消息应过滤；bash 输出头部噪声（`Chunk ID / Wall time / Process exited / Original token count / Output:`）展示时剥离；`apply_patch` 结构化为 `write_file`（文件+完整内容）/`edit_file`（按文件 diff）。

### Claude Code（jsonl）
每行顶层：`parentUuid, isSidechain, cwd, sessionId, version, gitBranch, type(assistant|user|summary), uuid, timestamp, message`。
- `message.content[]`：`text`/`thinking`/`tool_use{id,name,input}`/`tool_result{tool_use_id,content}`；`message.usage{input_tokens,output_tokens,cache...}`。
- **tool_use 与 tool_result 是两条独立消息**（result 在 `type:user` 里），用 `tool_use.id ↔ tool_use_id` 关联。
- `isMeta: true` 是注入消息，过滤；`TodoWrite` 整体移除；普通工具按 id 把 output 回填进调用。

### Kimi（context.jsonl 主，wire.jsonl 回退）
**必须以 context.jsonl 为主**——只读 wire.jsonl 会把流式中间态扩散成独立消息（实测 184 vs 真实 113 条）。
- context 行 `role`：user/assistant/tool/`_checkpoint`/`_usage`（后两者忽略）。assistant：`content[].type = think|text` + `tool_calls[]`（`id` 如 `ReadFile:0`）；tool 行用 `tool_call_id` 关联回填。
- 工具名映射（仅 7 个）：`ReadFile→read, Glob→glob, StrReplaceFile→edit, Grep→grep, WriteFile→write, Shell→bash`；`SetTodoList` 过滤。Kimi 无 tool status（默认成功）。
- token 缺失时从 wire.jsonl 事件的 `usage{input_tokens,output_tokens}` 补，仍缺则按模型价格估算并标记 estimated。

### OpenCode / zcode（SQLite）
`session`（id/directory/title/time_created 毫秒…）+ `message.data`(JSON: agent,role,time,cost,modelID) + `part.data`(JSON: type,callID,state,tool,tokens,text)；`part.type` = tool/text/reasoning/file。

### Pi（树状 jsonl）
`id`/`parentId` 组树可原地分支；content blocks：text/image/thinking/toolCall；`ToolResultMessage{toolCallId,toolName,isError}`。其 `Usage{input,output,cacheRead,cacheWrite,totalTokens,cost:{...分项}}` 自带分项成本，**是 cost 建模最佳样板**。

## 3. assistant 消息模式组（跨 agent 统一）

只有 4 种模式，必须严格保序：① thinking ② thinking+text+tool ③ text+tool ④ text。
实现要点：先并 thinking、再并 text、再挂 tool；**thinking-only 分组不能吸附 tool**——需要「当前分组」与「最近可挂 tool 的 text 分组」两个独立锚点。

## 4. 统一导出 Schema

顶层：`id/title/directory/version/time_created/time_updated/stats/messages`；`messages[] = role + parts[]`（text/reasoning/tool）。
tool part 统一结构：
```json
{ "type": "tool", "tool": "read", "callID": "...", "title": "read",
  "state": { "arguments": {}, "output": [{"type":"text","text":"..."}] },
  "time_created": 0 }
```
tool output 回填到调用而非独立消息；无法关联的保留为 fallback `role=tool` 不丢数据。MCP 工具要把 namespace 拼进完整名。

## 5. Token / Cost 统计

- **cache token 必须计入 cost**：`cost = input×in价 + output×out价 + cache_write×cacheWrite价 + cache_read×cacheRead价`。漏算 cache 是「cost 明显过大/对不上」的常见根因。
- 模型别名要归一（如 `anthropic--claude-4.6-opus → claude-opus-4-6`），价格表用 LiteLLM 快照做离线兜底。
- 区分 `cost_source: "recorded" | "estimated"`：有原始 cost 用 recorded；缺失按 token×价格估算并透传标记到 UI。
- 逐消息累加，缺失字段按 `?? 0` 容错。

## 6. 解析性能铁律（单文件可达 100-400MB）

- **绝不整读大文件**，流式逐行解析。
- Worker 流式解析时用 append-only buffer（引用稳定）+ 版本号信号驱动 UI，**禁止每 batch spread 复制历史记录**（O(n²)）。
- 聚合/派生数据增量累积（O(delta)），不要每 batch 全量重扫；无过滤条件时统计直接复用 parser 内部 stats（O(1)）。
- 缓存架构：前台只读缓存（SQLite），独立 worker 负责写入；不要做「源文件更新就直读原始」的分叉路径。
- 用多规格基准文件（50/150/300MB + 高记录数小文件）做 benchmark 验证。
