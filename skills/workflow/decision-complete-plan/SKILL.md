---
name: decision-complete-plan
description: 'Use when writing an implementation plan that another session or agent will execute verbatim, or when executing such a plan. Enforces "decision complete" handoff: explore code before asking questions, split unknowns into discoverable facts vs user preferences, an eight-section plan template (conclusion-first summary, root cause with file:line evidence, confirmed decisions, minimal-change steps, interface changes, tests, explicit assumptions), and an execute-side verify-before-edit protocol.'
---

# 决策完整的实施计划（Plan → Implement 交接）

计划文本是交给另一个会话/执行者的**交接物**，第一性目标是「决策完整（decision complete）」：**实现者不需要再做任何决策**。适用于先规划后执行的两段式工作，也适用于拿到计划后的执行侧。

## 1. 计划前的收敛（三阶段）

1. **落地环境**：先探索、后提问。能从仓库查到的事实（某个结构在哪、用了什么组件）**禁止**问用户，自己 grep/读文件用证据确认。
2. **意图对齐**：问到能清楚陈述「目标+成功标准、范围内/外、约束、现状、关键偏好」为止。
3. **实现收敛**：把方案逼到决策完整——approach、接口(API/schema/IO)、数据流、边界/失败模式、测试与验收、迁移/兼容。

**两类未知区别对待**：
- **可发现的事实**（仓库真相）→ 自己探索，用 `路径:行号` 证据确认；探索结果可以纠偏用户的初始假设（用户以为要大迁移，实际根因可能只是一层结构包装）。
- **偏好/取舍**（不可发现）→ 尽早问，给 2-4 个互斥选项 + 推荐默认值；用户未答就按推荐走，并在计划里**记为显式假设**。

收敛节奏：探索时每轮一句说明为何看下一个文件；探索完成后集中锁定 2-4 个高影响产品决策（「为避免实现偏差，我先锁定 N 个行为决策」），拍板后才出计划。

## 2. 计划文档模板（八段式）

```markdown
# <一句话标题：动作 + 对象 + 关键约束>

## 摘要                        # 结论先行：能不能做 + 核心思路 + 影响面
## 根因确认 / 现状基线          # bug/重构类必备；每条挂 绝对路径:行号 证据
## 已确认的决策                 # 用户拍板项，来源可追溯
## 实施方案（最小改动）          # 分步可执行；显式写"不改 X"
## 具体改动点                   # 决策完整：细到文件清单、状态字段、持久化 key、常量值
## 对外接口 / 类型变化          # 即使"无变更"也显式声明，界定影响面
## 测试与验收                   # 回归命令 + 新增用例场景 + 手动验证（给预期数字）
## 假设与默认                   # 未确认项固化为默认值，避免实现期再决策
```

写作要点：
- **结论/根因先行**：摘要第一句就是判断（「可以，且适合用 X」「根因不是 A 而是 B」）。
- **「最小改动」是显式边界**：单列「不做什么/范围外项」。
- **改动点不留「视情况而定」**：新增/修改文件用绝对路径逐条列，键名、常量直接写死。
- 结尾**不要**问「should I proceed?」——计划本身就是可直接执行的交付物。

## 3. 执行侧协议（拿到计划后）

1. 先声明落地顺序（「先改 A，再改 B，最后跑测试回归」）。
2. **先重读计划涉及的文件，核对计划与代码现状是否仍一致**，有偏差先反馈再动手。
3. 按最小改动实现，不扩散到计划边界外。
4. 跑计划里的回归命令（lint + test 全量）；遇到新问题回到根因分析，不贴补丁。
5. 收尾用 `file:line` 分块汇报：主要改动 / 测试改动 / 验证结果（含通过数字）。

## 4. 交接格式

计划全文应可直接作为新会话的开场消息（`PLEASE IMPLEMENT THIS PLAN:` + 计划原文）被执行，不依赖原会话的对话上下文——这也是检验「决策完整」的标准：脱离上下文仍然可以无歧义执行。
