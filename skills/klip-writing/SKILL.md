---
name: klip-writing
description: Write KLIP (Kevin's Lightweight Improvement Proposal) documents for Fin-Agent and related projects. Use when user says "写klip", "klip", "KLIP","improvement proposal", "设计文档", "技术方案", "RFC", "proposal",or wants to produce a structured technical design/evaluation/migration document for a software project. Also trigger when user asks to document a technical decision, evaluate a technology migration, design a new feature, or review codebase optimization opportunities.
---

# KLIP Writing Skill

Write structured technical design documents following the KLIP format conventions established in the Fin-Agent project.

## What is a KLIP

KLIP (Kevin's Lightweight Improvement Proposal) is a technical document format used for feature design, architecture evaluation, migration assessment, codebase review, and protocol specification. Each KLIP is a self-contained Markdown file that captures the full lifecycle of a technical decision: from background and motivation through design details to acceptance criteria.

## When to Read Reference

Before writing any KLIP, read the reference document for structural patterns and field definitions:

```
Read: references/klip-conventions.md
```

This reference contains the canonical section catalog, KLIP category taxonomy, naming rules, frontmatter fields, and writing constraints extracted from real KLIPs.

## Core Workflow

1. **Identify KLIP category** from user intent (see reference for taxonomy).
2. **Select applicable sections** from the section catalog based on category.
3. **Gather inputs** from user: background context, codebase facts, constraints, decisions already made.
4. **Write the KLIP** following structural and writing rules.
5. **Output** as a Markdown file named `klip-{number}-{slug}.md`.

## Writing Principles

These principles govern all KLIP writing. They are non-negotiable.

### Grounded in code, not imagination
Every claim about current system behavior must cite a real file path, function name, or data structure. If the author has not verified a fact against the codebase, the KLIP must say "待确认" or leave a placeholder, never fabricate.

### Honest about what is decided vs. what is not
Sections that record conclusions use definitive language. Sections that record open questions use "待讨论", "待确认", or "建议". The two must never be mixed within the same paragraph.

### Minimal viable scope per document
Each KLIP covers one coherent decision boundary. If scope creep is detected during writing, the overflow should be called out as a future KLIP reference (e.g., "该策略在后续 klip 中补充").

### No motivational padding
No sentences whose only purpose is to reassure the reader that the proposal is good. Every sentence must carry information or a decision.

### Frontmatter is mandatory

```yaml
---
Author: "@handle" or "AgentName"
Updated: YYYY-MM-DD
Status: Draft | Almost Complete | Complete | Completed
---
```

Optional frontmatter fields for completed KLIPs:
- `Reviewer`, `ReviewDate`, `ClosedDate`
- `Origin` (if derived from another KLIP)

## Section Selection Guide

Not every KLIP needs every section. Choose based on category:

| Category | Required Sections | Common Optional Sections |
|---|---|---|
| Feature Design | 背景, 目标, 非目标, 设计概览, 验收标准 | 前置依赖, 术语表, 组件设计, 数据存储, 实施阶段, 待讨论 |
| Architecture Evaluation | 现状结论, 背景, 目标, 非目标, 评估维度, 评估结果, 最终建议 | 成本与风险, 目标态设计, 迁移计划, 回滚策略 |
| Codebase Review | 背景, 现状, 目标, 非目标, 发现与方案(P0/P1/P2), 建议落地顺序 | 关键参考位置 |
| Protocol/Streaming Design | 现状结论, 背景, 目标, 非目标, 协议设计, 服务端设计, 前端设计, 兼容性要求 | 测试矩阵, 实施阶段, 决策摘要 |
| State Migration | 现状结论, 目标, 非目标, 状态边界, 阶段进展, 验收标准 | 关键决策与约定, 测试矩阵, 实施后检查清单 |
| Runtime Optimization | 背景, 目标, 非目标, 设计方案, 测试矩阵, 验收标准 | 实施后检查清单 |

## Output Format

- File: `klip-{N}-{english-slug}.md`
- Language: 中文为主体，技术术语保留英文原文，代码/类型/字段名不翻译
- Heading style: `#` for title (must match filename slug), `##` for top-level sections, `###` for subsections
- Code blocks: use fenced code with language tag (```json, ```typescript, ```mermaid, etc.)
- Tables: Markdown pipe tables, keep columns aligned
- Checklists: use `- [ ]` for pending, `- [x]` for done, `- [~]` for moved/deferred

## Quick Start Example

User: "我想写一个 klip，关于把 fin-echarts 的 kline 图表从 replace 模式升级为支持 append 流式追加"

This maps to **Protocol/Streaming Design** category. The KLIP would include:
- 现状结论（code references to current kline rendering）
- 背景（why replace-only is limiting）
- 目标 / 非目标
- 协议补充（new append command shape with candles array）
- 对外契约补充（type definitions, skill constraints, completion payload）
- 实现落点（server parser, frontend runtime, render layer）
- 测试计划
- Phase 建议
