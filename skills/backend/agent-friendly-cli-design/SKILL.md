---
name: agent-friendly-cli-design
description: Use when designing, reviewing, or refactoring a command-line interface that AI agents will invoke — covers non-interactive execution, resource/command layering, unified verbs, output trimming for token budgets, idempotency, and self-correcting error messages. Trigger this when building a new CLI, wrapping an API as a CLI, or auditing an existing CLI for agent usability.
---

# 面向 Agent 的 CLI 设计清单

Agent-friendly 不等于 machine-readable。machine-readable 只解决程序串联，agent-friendly 还要解决两件事：**语义理解**（LLM 能读懂输出）和 **context 成本**（无关字段会浪费 token 并污染推理）。设计时始终假设使用者是一个不能按方向键、context 很贵、会不断重试的 agent。

## 一、结构：用两层解决「命令爆炸」

能力面一大，若每个能力都做成独立 command，`--help` 会爆炸，agent 永远要猜「这个操作有没有对应命令」。用两层拆分：

### Resource 层 —— 承接长尾 CRUD

把 RESTful resource model 迁移到 CLI：**路径定位资源，动词表达动作**。这样 API 文档几乎不用翻译就能当 CLI 使用说明，agent 学会一个资源就学会所有资源。

- 动词收敛到最小闭集：`list / get / create / update / delete`
- 参数分层：`key=value` 是资源参数，`--flag` 是 CLI 行为控制
- 用 `/` 前缀显式标记资源路径，避免 `issues list` 里 issues 到底是 command 还是 resource 的歧义

```bash
cli /issues list state=open author=me
cli /issues create title="Fix login" body="..."
cli /issues/42 update state=closed
cli /issues/42 delete
cli /issues/42/comments create body="LGTM"
cli /issues list state=open --json --jq '.[].title'
```

若基于已有 REST API，直接提供一个透传入口（如 `gh api`），让 `DELETE /repos/{owner}/{repo}/issues/comments/{id}` 一一对应到 CLI 调用，无需为每个长尾能力手写 command。

### Command 层 —— 承接无法 resource 化的意图

有些意图不是对资源做 CRUD，强行 resource 化很别扭。这些留在 command 层（无 `/` 前缀）：

- `login` —— 不是对某资源的操作
- `clone` —— 同时涉及远程 repo、本地文件系统、git 状态
- `checkout` —— 切换本地工作区状态
- `merge` —— 用户表达的是「把改动合进去」，而非「改字段再删分支」

```bash
cli login
cli clone acme/demo-app
cli checkout 353
cli merge 353 --squash
cli status
```

Command 的本质是承接无法自然 resource 化的用户意图，「多步骤编排」只是它的常见来源之一。两层是互补关系：resource 层负责覆盖面，command 层负责高层意图。

## 二、输出：默认语义化，需要时结构化

在 agent workflow 里输出不是越多越好。无关字段进入 context 会浪费 token 并干扰后续推理。

- **默认输出走自然语言 / 语义化 key-value**，这是 LLM 最擅长的表征，比一整坨 JSON 更好懂
- **JSON 的定位是串联和精确抽取，不是默认认知界面**
- 提供 `--json` 选字段 + `--jq` 做裁剪，让裁剪发生在进入 LLM context **之前**
- 成功时返回可用的结构化数据（ID、URL），而不是只输出 emoji

```bash
# 默认：语义化，适合直接理解
cli /issues/42 get
# Issue #42: Fix login bug
# State: open  Author: alice  Labels: bug, auth

# 需要串联时：结构化 + 裁剪，只让必要信息进 context
cli /issues/42 get --json --jq '.title'
```

## 三、执行层：让 agent 能稳定使用的基建

| 原则 | 做法 | 反例 |
|------|------|------|
| 非交互优先 | 所有输入都能通过 flag 传入；交互模式仅作缺参时的 fallback；支持 `PROMPT_DISABLED=1` 类环境变量 | 执行中途弹 `? Which environment? (arrow keys)` 卡死 agent |
| 渐进式文档 | 让 agent 跑 `cli`→看子命令→跑 `cli deploy --help` 按需发现，不一次性倾倒全部文档 | 首屏塞满用不到的命令，浪费 context |
| `--help` 带示例 | 每个子命令都有 `--help`，且**包含具体示例**；agent 靠模式匹配 `cli deploy --env staging --tag v1.2.3` 比读描述快 | 只有干巴巴的选项描述 |
| 接受 stdin + flag | agent 用管道思维串联命令 | 要求奇怪顺序的位置参数，或缺值就回退交互 |
| 快速失败 + 可操作错误 | 缺参立即报错并给出正确调用方式和获取值的命令，agent 擅长自我修正 | 挂起或只说「参数错误」 |
| 幂等 | 重复执行 `deploy` 返回「already deployed, no-op」，不产生重复副作用 | 重试导致重复部署 |
| `--dry-run` | 破坏性操作前可预览计划，先验证再实跑 | 直接执行不可逆操作 |
| `--yes` / `--force` | 安全路径设为默认，但允许绕过确认 | 无法跳过确认，agent 卡在 `are you sure?` |
| 可预测结构 | 选定一种模式（resource + verb / 统一 flag 名）并处处复用，学会一个能推断其余 | 每个命令自成体系，无法泛化 |
| flag 一致复用 | `--repo`、`--json`、`--jq` 等在不同命令里语义一致 | 同一概念在不同命令用不同 flag 名 |
| `--web` 作 fallback | 不假装覆盖所有交互，有些事 Web 更合适 | 强行在 CLI 里实现所有交互 |

错误信息示例（快速失败 + 指路）：

```text
Error: No image tag specified.
  cli deploy --env staging --tag <image-tag>
  Available tags: cli build list --output tags
```

## 设计自检清单

- [ ] 命令是否分成了 resource 层（`/path` + 统一动词）和 command 层（高层意图）？
- [ ] resource 动词是否收敛到 `list/get/create/update/delete`？
- [ ] 默认输出是否语义化，`--json`/`--jq` 是否可裁剪字段？
- [ ] 成功输出是否返回可用的 ID / URL 而非仅 emoji？
- [ ] 是否全程非交互可用（flag + stdin + 环境变量）？
- [ ] `--help` 是否每个子命令都有且带示例？
- [ ] 错误是否快速失败并给出修正调用？
- [ ] 破坏性操作是否幂等 + 有 `--dry-run` + `--yes`？
- [ ] flag 命名是否跨命令一致、结构是否可推断？
