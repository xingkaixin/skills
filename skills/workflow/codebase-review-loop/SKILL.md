---
name: codebase-review-loop
description: Use when auditing a codebase and tracking improvement findings over time — writing numbered improvement-proposal documents with prioritized, evidence-backed findings, verifying findings read-only against current code before fixing ("ground truth first"), fixing one finding at a time with a verification gate, writing status back into the document, and raising test coverage with parallel per-module subagents.
---

# 代码库审查与改进循环

以仓库内一套**编号改进提案文档**（Improvement Proposal，下称「提案」，存放于 `proposals/` 之类的专用目录，目录名与前缀可按项目惯例自定）为载体，形成闭环：**多维度审查生成带证据的 findings → 只读核查 finding 是否仍成立（对齐真源）→ 一次修一条 → 验证门禁 → 回写状态 → 提 PR**。

## 1. 文档格式

- 命名：`proposal-{N}-{english-slug}.md`，N 单调递增可跳号；一级标题与文件名一致；子专题放子目录（如 `proposal-6-evaluation/` 下分 architecture/performance/security 等维度文档）。
- Frontmatter 强制：`Author`（agent 或用户名，如 `"@alice"`）、`Created`、`Updated`、`Status`（Draft → Almost Complete → Complete）；完成态可加 `Reviewer`、`ClosedDate`、`Origin`（从父提案拆出时注明）。
- Codebase Review 类骨架：`背景 / 现状 / 目标 / 非目标 / 发现与方案(P0/P1/P2) / 建议落地顺序`。

**Finding 写法**（每条一个 `###`，带优先级前缀）：
```markdown
### P0. 后端应用装配与领域逻辑未分层
#### 证据            # 文件路径+行号/规模，可被直接核验
#### 为什么不合理     # 影响论证
#### 建议拆分边界     # 最小方案
#### 暂不建议做的事   # 显式排除，防过度设计
```
修复后原地追加：`#### 实施结果（日期）`、`#### 已完成解决方案`、`#### 保持不变的边界`。跟踪区用 checklist：`- [x]` 完成、`- [~]` 移出，行内标注 `-> 完成` / `-> 不考虑` / `-> 不存在这个问题`。

**写作硬约束**：每条现状断言必须引真实文件路径/函数（grounded in code），未验证的写「待确认」，绝不编造；已决定与未决定分段；每篇一个决策边界，scope creep 甩给未来提案；正文语言遵循项目惯例、标识符/路径保持原文；不写激励性废话。

反模式：现状结论混入愿景、非目标写成模糊排除、提案里塞实现代码（类型/JSON 示例可以）、「待讨论」当垃圾桶、协议/存储变更忘记向后兼容。

## 2. 生成审查（写提案）

- 审查前先回看已有提案，**不重复登记已修问题**。
- 只记录能被代码和已跑命令直接支撑的结论，不记猜测风险；性能审查只找「随数据量增长而放大」的问题。
- 多维度并行：可 spawn 只读探索子代理分维度（架构/性能/安全/UI），各自输出带证据的 findings 后汇总。
- 基调：倾向恢复单一职责、拆过界文件，而非引入统一抽象。

## 3. 真源先行：只读核查循环

**真源 = 当前仓库代码的实际状态**，区别于文档旧声称、记忆、上轮结论。动手前先用只读方式对齐真源。

- 核查与修复是**两个独立动作**：接到「只读核查」指令时绝不顺手改代码。
- 核查产物三件套：**三态结论**（仍成立 / 部分成立 / 不成立）+ **证据**（文件+行号）+ **最小修复顺序建议**（区分「本轮小补丁」vs「只应登记的结构性问题」）。
- 硬约束：不建议大重构。

## 4. 修复循环（一次一条）

1. 用户以 `[proposal-x.md] #### N. 标题` 单条触发；不批量改。
2. 读项目约定 + 提案原文 → 只读排查确认真源 → 最小改动修复。
3. **验证门禁**：lint + format:check + test + build + `git diff --check`；性能类必须带 benchmark 前后毫秒数据；交互类做浏览器人工验证。
4. **先回写提案状态，再提 PR**（draft）。回写保留原始证据 + 已完成方案 + 保持不变的边界——否则文档与真源分裂。
5. 发现旧文档描述已不准确时，主动标注「此 finding 现已不成立/已收口」。

## 5. 并行子代理提升测试覆盖率

1. **先建真源**：跑 `test:coverage` 拿真实报表 + 读覆盖率阈值配置，不拍脑袋选模块。
2. 只读探索子代理分区盘点低覆盖模块，各输出「未覆盖核心分支 + 可复用 mock + 优先级」。
3. **锁目标**：「完成覆盖率要求」在已过线时有歧义——先与用户确认是守阈值、补测还是提阈值，以及并行粒度。
4. 按领域大模块拆执行子代理，指令写死约束：**写入边界仅测试文件**、不改生产代码/对外接口、各子代理写入互不重叠、复用现有 mock 与测试风格、「你不是单独工作，别回退别人的改动」。
5. 主代理整合、全量回归、上调阈值（用 CI 可严格拦截的写法防回退）。
6. 惯例：纯入口薄封装做覆盖率**排除**而非硬凑；外部大模型 API 用 mock；「整体阈值 + 单文件阈值」双达标。
