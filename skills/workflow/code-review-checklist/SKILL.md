---
name: code-review-checklist
description: Use when reviewing a pull request, diff, or code change, or when giving feedback on someone else's code. Provides a layered review pass (design → call-sites → naming → run-it → verify) plus rules for what to skip, how to phrase feedback with Socratic questions, and when to say no.
---

# Code Review Checklist

做 code review 时按本清单执行。好的审查关注可维护性与可扩展性，不是纠语法、风格、缩进——那些交给 formatter。审查是迭代过程，不是一次性盖章。

## 分层审查顺序

按顺序走，先大局后细节。**第一遍只看设计，不钻细节。**

### 第 1 层：大局 / 设计

问自己（这些更关乎系统设计，而非改动本身）：

- 这段代码如何融入系统其余部分？与代码库其他部分怎么交互？
- 它如何影响整体架构？会影响未来计划中的工作吗？
- 这次改动解决了什么问题？可能引入什么未来问题？
- 随着代码演进，有没有更好的抽象？

原则：接受了糟糕的改动，系统会变脆。文档、测试、数据类型与代码本身同等重要。

### 第 2 层：调用点与「没被改的行」

- **看那些*没被*改动的行**——它们常常讲述真实的故事。改动者经常忘了同步更新代码库或文档的相关部分，导致 bug、破坏性变更或安全问题。
- 彻底检查新代码的**所有 call-sites**：都正确更新了吗？
- 测试还在测正确的东西吗？改动放对地方了吗？

### 第 3 层：命名（往往是最重要的一环）

名字封装概念，是代码的「构建块」。坏名字是暗示深层问题的 code smell，会把认知负担放大一个数量级。花时间为变量想最贴切的名字，即使感觉像吹毛求疵。

坏（临时/随意名，看不出用途）：

```rust
let usr = player.username.trim().to_lowercase();
let updated_score = player.score + bonus_points;
let l = if level_up { player.level + 1 } else { player.level };
let l2 = if l > 100 { 100 } else { l };
```

好（名字描述每一步的含义，用 shadowing 表达意图，最终名字常与字段名对齐）：

```rust
let username = player.username.trim().to_lowercase();
let score = player.score + bonus_points;
let level = if level_up { player.level + 1 } else { player.level };
let level = if level > 100 { 100 } else { level };
```

命名在大型代码库中尤其关键——值的声明与使用相隔很远，多人需要对问题领域有共同理解。

### 第 4 层：亲自跑代码

长时间盯着代码容易漏掉微妙细节。有条件就 checkout 分支，运行代码、测试、linter；到处改改、试着弄坏它、理解它如何工作。UI 变更、错误消息这类面向用户的改动，跑起来并尝试破坏时最容易发现问题。之后 revert，把发现写进评论。

## 该跳过什么

- **别吹毛求疵。** 空白、格式交给 formatter。把精力留给真正重要的：逻辑、设计、可维护性、正确性。
- 判断标准：**这会影响功能吗？会让未来的开发者困惑吗？** 若都不会，放手。
- 避免不影响代码质量的主观偏好之争。

## 反馈怎么说（沟通 > 挑错）

审查也是在团队内建立对代码的共同理解，不只是指出缺陷。

- **专注 why，而非 how。** 解释改动背后的理由，比无理由地指出缺陷更可能被接受。别只写 "Don't do this"；给出替代方案、链接文档、说明为何这样会在未来出问题。
- **别当混蛋。** 不说 "this is wrong"，说 "I would do it this way"。只留下你自己乐于收到的评论。
- **用苏格拉底式提问**引导作者自己思考，往往能带来更好的设计：
  - "Will this break existing workflows if we do it this way?"
  - "Which alternatives have you considered?"
  - "What happens if you call this function with an empty array?"
  - "If I don't set this value, what error message does the user see?"
- **别怕问「蠢」问题。** 不懂就问，你多半不是唯一看不懂的人——这可能暴露出缺失的文档或不自解释的系统。
- 适当加正面评论（"I like this"、"great idea"），维持作者积极性。
- 拒绝的是代码，不是人。

## 何时说「不」

- 与其合并一个不对、会埋下隐患的改动，不如直接拒绝。"先合并以后再修" 是滑坡，会累积技术债。
- 拒绝时别粉饰、别硬装友好：客观、解释理由、给更好的替代方案，然后聚焦下一步。
- 若你对同一件事反复说「不」，把它写成 style guide 或团队指南，用事实支撑直觉。
- 宽容但果断——这只是代码。

## 流程习惯

- **多轮迭代。** 别指望一次过；第一轮看设计，之后才进细节。目标是接受高质量代码，不是尽快合并。
- **明确你的可用性。** review 是开发瓶颈（有 human in the loop）。没时间审、或短期内审不完，主动告知作者，设清预期。
- **把 review 当学习。** 每次审查争取学一样新东西——新技巧、模式、库，以及别人如何解决问题。
- **偶尔请作者反馈你的反馈**：太苛刻/吹毛求疵/慢/马虎了吗？指出的点对吗？对他们有帮助吗？

## 一次审查的执行清单

- [ ] 第一遍先评估设计与架构契合度，未钻语法细节
- [ ] 检查了所有 call-sites 与未改动但相关的行、文档、测试
- [ ] 审查了命名，标出会增加认知负担的坏名字
- [ ] 有条件时 checkout 并实际运行了代码 / 测试 / linter
- [ ] 跳过了 formatter 能处理的格式/空白问题
- [ ] 反馈聚焦 why、给出替代方案、措辞是我自己乐于收到的
- [ ] 需要时用苏格拉底式提问代替断言
- [ ] 若改动不达标，明确而客观地说「不」并给替代方案
