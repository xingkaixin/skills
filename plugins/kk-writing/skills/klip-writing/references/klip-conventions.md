# KLIP Conventions Reference

This document codifies the structural patterns, naming rules, section definitions, and writing constraints observed across the KLIP corpus. It is the canonical reference for the klip-writing skill.

## Table of Contents
1. Naming and Numbering
2. Frontmatter Specification
3. KLIP Categories (Taxonomy)
4. Section Catalog (Exhaustive)
5. Writing Constraints
6. Code Reference Conventions
7. Status Lifecycle
8. Cross-KLIP References
9. Common Anti-Patterns

---

## 1. Naming and Numbering

- File name format: `klip-{N}-{english-slug}.md`
- `N` is a monotonically increasing integer (0-indexed). Gaps are allowed (e.g., klip-6 may be skipped).
- `slug` is lowercase, hyphen-separated English describing the topic.
- The `# ` title inside the file must match the filename (without `.md`).
- Examples:
  - `klip-0-message-in-mongodb.md` → `# klip-0-message-in-mongodb`
  - `klip-10-fin-echarts-streaming.md` → `# klip-10-fin-echarts-streaming`
  - Exception: `klip-3-zustand-migration.md` used `# klip-zustand-migration` (acceptable variant)

## 2. Frontmatter Specification

Required fields:

```yaml
---
Author: "@xingkaixin"          # GitHub handle with @, or agent name string
Updated: 2026-01-22            # ISO date of last update
Status: Draft                  # One of: Draft, Almost Complete, Complete, Completed
---
```

Optional fields (typically for completed KLIPs):

```yaml
Reviewer: "@Opus, @KIMI, @MiniMax, @Codex"
ReviewDate: 2026-03-20
ClosedDate: 2026-03-21
Origin: klip-3-zustand-migration（LRU/白名单清理策略单独立项）
```

- `Origin` is used when a KLIP was split out from another KLIP. Include the parent KLIP name and a parenthetical description of what was split.
- `Status` values observed: `Draft`, `Almost Complete`, `Complete`, `Completed` (the last two are interchangeable).

## 3. KLIP Categories (Taxonomy)

Each KLIP falls into one primary category. Identify the category first, then select sections.

### Feature Design
A new user-facing or system-facing capability. Driven by product requirements or user needs.
- Examples: klip-0 (MongoDB storage), klip-1 (efficient input), klip-2 (fund & valuation)

### Architecture Evaluation
Assesses whether a technology migration or architectural change is worth pursuing. Produces a go/no-go recommendation.
- Examples: klip-7 (SSE to WebSocket), klip-8 (Next.js to Hono)

### Codebase Review
Full or partial review of an existing codebase, outputting a prioritized list of findings and suggested fixes.
- Examples: klip-5 (codebase review optimization)

### Protocol / Streaming Design
Defines or extends a wire protocol, event model, or streaming data format between server and client.
- Examples: klip-10 (fin-echarts streaming), klip-11 (widget chart unification), klip-12 (kline append)

### State Migration
Migrates runtime or persistent state from one storage/management approach to another.
- Examples: klip-3 (Zustand migration)

### Runtime Optimization
Addresses a specific runtime concern (memory, performance, cleanup) without changing external behavior.
- Examples: klip-9 (conversation LRU cleanup)

### Cross-Conversation UX
Enhances user experience across conversation boundaries (notifications, status, navigation).
- Examples: klip-13 (AskUserQuestion cross-conversation notification)

### Incremental Enhancement
A small, well-scoped addition to an existing system (new field, new display, new metric).
- Examples: klip-4 (MCP timeout duration)

## 4. Section Catalog (Exhaustive)

Below is every section heading observed across the KLIP corpus, with its purpose and when to include it.

### 现状结论（代码校准）
**Purpose**: Ground the reader in verified codebase facts before proposing changes. Cite specific file paths, function names, data structures. Correct any misconceptions the reader might have.
**When to include**: Architecture evaluations, protocol designs, state migrations, any KLIP where the "current state" is non-obvious or commonly misunderstood.
**Pattern**: Bullet list of factual statements, each with "证据" (evidence) references to file paths.

### 背景
**Purpose**: Explain why this KLIP exists. What pain point, requirement, or opportunity triggered it.
**When to include**: Always.
**Pattern**: 3-6 bullet points describing current limitations, user needs, or system constraints.

### 目标
**Purpose**: What this KLIP will achieve. Numbered or bulleted list of concrete outcomes.
**When to include**: Always.
**Pattern**: Action-oriented statements. Each goal should be independently verifiable.

### 非目标
**Purpose**: Explicit scope exclusions. Prevents scope creep and sets reader expectations.
**When to include**: Always.
**Pattern**: "本文不涉及...", "不改变...", "不引入...", "不在本轮..."

### 前置依赖
**Purpose**: What must be true or available before this KLIP can be implemented.
**When to include**: When the KLIP depends on other systems, services, or decisions not yet made.

### 术语表
**Purpose**: Define project-specific terms to prevent ambiguity.
**When to include**: When the KLIP introduces new terms or when existing terms have multiple interpretations.
**Pattern**: `- term: definition` format with explicit relationships between terms.

### 选择理由 / 选型理由
**Purpose**: Why this particular approach/feature/priority was chosen over alternatives.
**When to include**: Feature designs that were selected from a larger backlog, or when the choice is non-obvious.

### 设计概览
**Purpose**: High-level architecture or approach description. The "big picture" before diving into details.
**When to include**: Feature designs, protocol designs.
**Pattern**: Numbered list of design pillars, each with a brief explanation.

### 方案细节 / 方案总览
**Purpose**: Detailed technical design with subsections.
**When to include**: When 设计概览 is not sufficient to guide implementation.

### 协议设计
**Purpose**: Wire format, event model, command schema, or data contract specification.
**When to include**: Protocol/streaming designs.
**Pattern**: Subsections numbered as "1) 外层约定", "2) 指令集合", "3) 命令示例", etc. Include TypeScript type definitions and JSON examples.

### 服务端设计
**Purpose**: Server-side implementation approach.
**When to include**: Protocol designs, feature designs with backend changes.

### 前端设计
**Purpose**: Client-side implementation approach including component structure, state management, rendering.
**When to include**: Protocol designs, feature designs with frontend changes.
**Pattern**: Subsections for "运行时状态", "事件处理", "Markdown 渲染入口", "图表组件兼容层", "错误处理体验".

### 组件设计
**Purpose**: UI component hierarchy and responsibilities.
**When to include**: Feature designs with new UI components.

### 数据存储
**Purpose**: Database schema, IndexedDB tables, or storage format definitions.
**When to include**: Feature designs involving persistent data.

### 评估维度
**Purpose**: The axes along which an architecture/technology choice will be evaluated.
**When to include**: Architecture evaluations.
**Pattern**: Numbered list: 传输性能, 交互能力, 架构复杂度, 改造成本, etc.

### 评估结果
**Purpose**: Findings per evaluation dimension, with a clear conclusion.
**When to include**: Architecture evaluations.
**Pattern**: Subsections like "1) 是否有必要切换", "2) 切换后可获得的收益". Each subsection has "结论" in bold.

### 成本与风险
**Purpose**: Implementation cost, stability risk, security risk.
**When to include**: Architecture evaluations, large migrations.

### 收益评估
**Purpose**: Categorized benefits with severity ratings (低/中/高).
**When to include**: Architecture evaluations.
**Pattern**: "### 1. 工程心智收益：中到高" format.

### 成本评估
**Purpose**: Categorized costs with severity ratings.
**When to include**: Architecture evaluations.

### 切换判定与建议
**Purpose**: Go/no-go decision with trigger conditions.
**When to include**: Architecture evaluations.

### 目标态设计
**Purpose**: What the system should look like after the change is complete.
**When to include**: Architecture evaluations (conditional on go decision), migrations.

### 迁移计划
**Purpose**: Phased migration path.
**When to include**: Architecture evaluations, state migrations, large refactors.
**Pattern**: "Phase 0: ...", "Phase 1: ...", etc.

### 回滚策略
**Purpose**: How to revert if the change causes problems.
**When to include**: Architecture evaluations, protocol changes.

### 发现与方案
**Purpose**: Itemized findings from a codebase review, organized by priority.
**When to include**: Codebase reviews.
**Pattern**: "### P0（正确性 / 稳定性 / 安全）", "### P1（性能 / 可维护性）", "### P2（UI/UX / 一致性）". Each finding is numbered with: 位置, 现象/风险, 建议方案, 验收标准. Status annotation after title: "-> 完成", "-> 不考虑", "-> 暂不考虑", "-> 不存在这个问题".

### 建议落地顺序
**Purpose**: Recommended implementation order for review findings.
**When to include**: Codebase reviews.

### 状态边界
**Purpose**: Table mapping each state to its owning store/hook/layer.
**When to include**: State migrations.
**Pattern**: Markdown table with columns: 状态, 归属, 结论.

### 阶段进展
**Purpose**: Track what has been completed vs. what remains.
**When to include**: State migrations, long-running efforts.
**Pattern**: Bullet lists under "已完成" and "结项决策".

### 关键决策与约定
**Purpose**: Record architectural decisions and constraints that must be maintained.
**When to include**: State migrations, protocol designs.

### 状态机定义
**Purpose**: Define state transitions for a key entity (e.g., message status).
**When to include**: Feature designs involving lifecycle state.
**Pattern**: List states with descriptions, then transition diagram.

### 索引设计
**Purpose**: Database index definitions.
**When to include**: Feature designs involving MongoDB or other databases.
**Pattern**: Code-style index definitions grouped by collection.

### API 变更
**Purpose**: HTTP/WS endpoint changes.
**When to include**: Feature designs with backend API surface changes.

### 数据迁移方案
**Purpose**: How existing data moves to the new schema/storage.
**When to include**: Feature designs involving storage migration.

### 交互与工作流
**Purpose**: User-facing interaction flow (question → agent action → display).
**When to include**: Feature designs with clear user-facing workflows.

### 数据需求
**Purpose**: Data dependencies on external tools or services.
**When to include**: Feature designs dependent on MCP tools or external APIs.

### 测试矩阵
**Purpose**: Test coverage plan organized by scenario, type, and priority.
**When to include**: State migrations, protocol designs, runtime optimizations.
**Pattern**: Markdown table with columns: 场景, 测试类型, 覆盖要求/优先级.

### 验收标准
**Purpose**: Concrete, testable conditions for "done".
**When to include**: Always.
**Pattern**: Bullet list or checklist. Each item is independently verifiable.

### 兼容性与边界
**Purpose**: Compatibility constraints, edge cases, known limitations.
**When to include**: Feature designs, protocol designs.

### 兼容性要求
**Purpose**: Stricter variant of 兼容性与边界, focused on backward compatibility.
**When to include**: Protocol designs.

### 待讨论事项
**Purpose**: Open questions that need team input before finalizing.
**When to include**: Draft-status KLIPs.

### 实施阶段建议 / Phase 建议
**Purpose**: Recommended phased implementation plan.
**When to include**: Feature designs, protocol designs.
**Pattern**: "### Phase 1: ...(MVP)", "### Phase 2: ...", etc.

### 实施后检查清单
**Purpose**: Post-implementation verification checklist.
**When to include**: State migrations, runtime optimizations.
**Pattern**: Checklist with `- [ ]`, `- [x]`, `- [~]`.

### 持续跟进待办
**Purpose**: Items that are explicitly deferred but must not be forgotten.
**When to include**: Completed KLIPs with remaining follow-up items.

### 本次代码复核证据
**Purpose**: Record which files were actually inspected to write the KLIP.
**When to include**: State migrations, codebase reviews (completed status).

### 本轮验证记录
**Purpose**: Record of test runs performed to validate the KLIP's conclusions.
**When to include**: State migrations (completed status).

### 关键参考位置
**Purpose**: List of source files relevant to this KLIP.
**When to include**: Always (as the final section).
**Pattern**: Bullet list of file paths, no descriptions.

### 决策摘要
**Purpose**: One-paragraph summary of the final decision, suitable for quick scanning.
**When to include**: Architecture evaluations, protocol designs, completed KLIPs.

### 多 Tab 策略
**Purpose**: Clarify behavior across browser tabs.
**When to include**: State migrations involving client-side state.

### 未来演进
**Purpose**: Possible future directions beyond the current KLIP scope.
**When to include**: Feature designs.

### Public APIs / Interfaces
**Purpose**: Enumerate new interfaces introduced and existing interfaces preserved.
**When to include**: Protocol designs, unification KLIPs.

### Assumptions
**Purpose**: Explicit assumptions underlying the design.
**When to include**: Protocol designs, architecture evaluations.

## 5. Writing Constraints

### Language
- Body text: Chinese.
- Technical terms, code identifiers, file paths, type names: English, never translated.
- Section headings: Chinese (with English parenthetical only when disambiguation is needed, e.g., "基本面分析（Fundamentals）").

### Formatting
- Use `**bold**` for emphasis on key conclusions or decisions within prose.
- Use `「」` for referencing product feature names or backlog items.
- Use backticks for all code identifiers: function names, file paths, type names, field names, store names, hook names.
- Bullets use `-`, not `*`.
- Nested bullets allowed but keep to 2 levels maximum.
- Tables must have aligned pipes.
- No trailing whitespace.

### Evidence and file references
- When describing current system behavior, always include file path evidence.
- Format: `src/path/to/file.ts` (relative to project root) or full path in link format.
- When multiple files are relevant, list under a dedicated subsection like "关键参考位置" or inline as "位置：".

### TypeScript type definitions
- Include TypeScript `interface` or `type` definitions for new data structures.
- Use standard TypeScript formatting with `?` for optional fields.
- Place inside fenced code blocks with `typescript` language tag.

### JSON examples
- Include concrete JSON examples for any new protocol, command, or data format.
- Use fenced code blocks with `json` language tag.
- Keep examples minimal but complete (3-5 data points, not 20).

### Mermaid diagrams
- Use sparingly, only for interaction flows or state machines where text alone is insufficient.
- Use fenced code blocks with `mermaid` language tag.

### Priority and severity annotations
- Codebase review findings use P0/P1/P2 with parenthetical category.
- Severity ratings for evaluations use 低/中/高 or 低到中/中到高.

### Status annotations on checklist items
- `-> 完成` : done
- `-> 不考虑` : explicitly rejected
- `-> 暂不考虑` : deferred
- `-> 不存在这个问题` : finding was invalid

## 6. Code Reference Conventions

- Always use relative paths from project root: `src/components/ChatArea.tsx`
- For deep references, include function or variable name: `src/app/api/chat/route.ts`（`agentOptions`）
- Link format (optional): `[src/components/EchartsBlockInner.tsx](/Users/Kevin/workspace/projects/work/fin-agent/src/components/EchartsBlockInner.tsx)`
- 证据 (evidence) pattern for 现状结论:
  ```
  - 证据：[`src/services/chatEventProcessor.ts`](/path/to/file) 中 `applyChartCommand()` 只有在...
  ```

## 7. Status Lifecycle

```
Draft → Almost Complete → Complete/Completed
```

- `Draft`: Initial writing, open questions remain.
- `Almost Complete`: Design is settled, minor details or validation remaining.
- `Complete` / `Completed`: All decisions made, reviewed, ready to implement or already implemented. Add `Reviewer`, `ReviewDate`, `ClosedDate` to frontmatter.

## 8. Cross-KLIP References

- Reference other KLIPs by slug: "见 klip-0 (MongoDB 存储)", "详见 `klip/klip-10-fin-echarts-streaming.md`".
- When splitting scope to a new KLIP, use `Origin` frontmatter and add a note in the parent KLIP.
- Pattern for deferral: "该策略在后续 klip 中补充" or "单独立项 → klip-9-conversation-lru-cleanup".

## 9. Common Anti-Patterns

Avoid these when writing KLIPs:

1. **Mixing aspirational and factual claims** in 现状结论. This section is for verified facts only.
2. **Writing 非目标 as vague exclusions**. Each non-goal should be specific enough that the reader can tell whether a given change violates it.
3. **Including implementation code** in a KLIP. Type definitions and JSON examples are fine; actual implementation code belongs in PRs.
4. **Omitting 关键参考位置**. Every KLIP should end with relevant file paths so future readers can quickly locate the affected code.
5. **Writing a 设计概览 that is actually a 方案细节**. Keep 设计概览 to 5-10 high-level bullets; move details to dedicated subsections.
6. **Using 待讨论 as a dumping ground**. Each item should be a specific, answerable question, not a vague area of concern.
7. **Forgetting backward compatibility**. Protocol and storage KLIPs must always address what happens with existing data/messages.
