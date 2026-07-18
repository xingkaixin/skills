---
name: writing-agent-skills
description: Use when creating, rewriting, reviewing, or testing an agent skill (a SKILL.md package for Claude Code, Codex, or any agent) — covers picking the skill type, writing directive instructions, engineering the description as a routing contract, splitting deterministic work into scripts, and building an eval harness to verify it. Trigger when someone says "write a skill", "improve this skill", "why doesn't my skill trigger", "test/eval this skill", or is designing reusable operational workflows for an agent.
---

# 编写与测试 agent skill

一份把「写好一个 skill」拆成五步的可执行方法论：分类 → 编写 → 触发设计 → 脚本分工 → 测试评估。适用于为任何 agent（Claude Code、Codex、Gemini CLI 等）编写、重写、审查或评估 skill。

## 核心心智模型

- Skill 不是一个 markdown 文件，是一个**文件夹**：`SKILL.md` 清单 + 可选的 `scripts/`、`references/`、`assets/`。把整个文件系统当作**渐进式披露（progressive disclosure）**工具。
- 加载顺序是分层的：启动时只加载 `name` + `description`；被选中后才加载 `SKILL.md` 正文；正文里指向的引用/脚本只在需要时才读或跑。写作时要顺着这个顺序分配信息。
- 一个好 skill 有三个特征：**窄契约、明确触发、具体产出**。让人困惑的 skill 往往横跨多个类别、或触发条件含糊。

## 第一步：分类（决定要不要做、做哪一类）

先判断这个 skill 属于哪一类，横跨多类是重构信号。常见类别：

1. 库/API 参考 — 帮 agent 正确使用某个库/CLI/SDK，核心是「踩坑点列表」+ 参考片段。
2. 产品验证 — 描述如何测试/验证代码是否工作，常配 Playwright、tmux、无头浏览器。
3. 数据获取与分析 — 连接数据与监控，含凭证、仪表盘 ID、查询工作流。
4. 业务流程自动化 — 把重复工作流收敛成一条命令（站会汇报、周报、建工单）。
5. 代码脚手架/模板 — 生成符合本仓库注解与约定的样板代码。
6. 代码质量/审查 — 执行代码风格、adversarial review，可挂在 hook 或 CI 里。
7. CI/CD 与部署 — 拉取、推送、部署、监控 PR、回滚。
8. 运维手册 — 从一个现象（告警/错误）走完排查流程，输出结构化报告。
9. 基础设施运维 — 日常维护与破坏性操作，需要安全护栏。

同时分清两种性质（影响测试策略）：
- **能力型（capability）**：补模型稳定做不到的事。模型变强后可能过时，靠 eval 检测退役。
- **偏好型（preference）**：记录你的特定工作流。持久，但价值取决于对真实工作流的忠实度，靠 eval 验证。

## 第二步：编写正文

- **别说显而易见的事。** Claude 本身很会编程、也了解代码库。正文重点放在能**打破模型默认思路**的信息上（例如某设计系统避免 Inter 字体和紫色渐变），而不是复述常识。
- **用指令，不用信息。** 模型执行指令好于推断含义。写「Always use `interactions.create()`」而不是「Interactions API 是推荐做法」；写「运行完 X 才能标记完成」而不是「建议验证」。
- **建一个踩坑点（gotchas）章节。** 这是信息量最大的部分。它应随着 agent 使用中暴露的失败点**持续增量积累**——每修一次真实失败就补一条。
- **别把 Claude 限制得太死。** Skill 复用性强，指令过于具体会削弱泛化。给它需要的信息，但留出适应具体情况的灵活性。
- **渐进式披露正文。** 详细函数签名、用法示例拆到 `references/api.md`；最终产物模板放 `assets/` 供复制。在正文里告诉 Claude 有哪些文件、何时去读。
- **初始设置。** 若 skill 需要用户上下文（如发到哪个 Slack 频道），把配置存进 skill 目录下的 `config.json`，未配置时让 agent 主动询问；需要结构化多选时用 AskUserQuestion。
- **记忆与数据。** 需要跨次记忆时，用 append-only 日志或 JSON/SQLite。数据存稳定目录（如 `${CLAUDE_PLUGIN_DATA}`），别放会随升级被清空的 skill 目录内。

## 第三步：触发设计（description 是路由契约）

`description` 不是摘要，是**路由元数据**——启动时它是模型判断「这个请求要不要用这个 skill」的主要依据。这是结构性问题，不是文风问题。

- 写成 **when / if-then 条件**，而非功能说明。要同时讲清三件事：**何时适用、哪类变更触发、是否可选**。
- 反例（太模糊）：`Run the mandatory verification stack in the monorepo.`
- 正例：`Run the mandatory verification stack when changes affect runtime code, tests, or build/test behavior in the monorepo.`
- 描述里要嵌入触发时机与产出形态。例：`Create a PR title and draft description after substantive code changes are finished. Trigger when wrapping up a moderate-or-larger change ... you need the PR-ready summary block.` —— 它告诉模型：这是任务结束型、仅用于实质变更、产出是 PR 块。
- **匹配用户意图，不用 API 术语。** 用用户真正会说的话描述场景。实测中，仅重写 description 就能修掉大部分「该触发却没触发」的失败。
- 经验法则：**如果路由不可靠，先修元数据，再加正文/代码。**

## 第四步：脚本分工（确定性下沉，判断留给模型）

可靠的拆分原则：
- **交给模型：** 解释、比较、报告、权衡取舍——依赖上下文和判断力的部分。例如读源码推断预期行为、对比日志与预期、判断 release diff 是否有真实兼容性风险。
- **下沉到 `scripts/`：** 确定性、可重复的 shell 工作。例如按固定顺序跑验证命令、收集日志、取上一个 release tag。**判据：如果模型每次都要重新发现同一套 shell 配方，它就该变成脚本。**
- 把脚本设计成**小型 CLI**：命令行可跑、打印确定性 stdout、失败时大声报错（附 usage）、需要时把产物写到已知路径；暴露 `start`/`stop`/`status`/`logs`/`rerun` 之类的辅助子命令便于反复运行。

**脚本能挡掉 LLM 的固有缺陷（重要踩坑）：**
- **无语义文本（hash、随机串）LLM 会抄错。** 别让模型手抄 SHA256 之类字符串——用脚本生成好带该字段的文件，再让模型填内容。
- **LLM 对时间流逝无感知**，会「刻舟求剑」记住旧时间戳。别让它自行输出当前时间，让它调脚本取，例如 `node -e 'console.log(new Date().toISOString())'`。
- **质量门槛用代码级判断，别靠 prompt 恳求。** 「不要输出空 insight」写进 prompt 弱模型会忽略；`if zero_insights: return None` 永不退化。凡是「必须成立」的约束，尽量落到确定性代码里。
- 约束不足时模型会自相矛盾/自作聪明；加更多约束能压制，但代价是灵活性下降——优先想能否用脚本或结构消除歧义，而不是无限堆 prompt。

## 第五步：测试评估（没有 eval 就别发 skill）

写代码不会不写测试，发 skill 也不该不做 eval。流程：

1. **先定义成功标准（写 skill 之前就写）。** 三个维度，评**结果不评路径**（agent 会找创造性解法，别惩罚意外但正确的路线）：
   - Outcome：是否产出可用结果（能编译/能渲染/API 返回有效）。这是基线。
   - Style & Instructions：是否遵循约定与 skill 指令（对的 SDK、正确的 model ID、命名规范、指定格式）。
   - Efficiency：耗费的时间/token/重试。最被低估的维度，回归是真实成本。
2. **先手动触发几次。** 用显式调用（`Use the {skill name} to do X` 或 `/skill`、`$skill-name`）跑几遍，观察在哪出错——暴露隐藏假设（假设了不存在的依赖？跳过了该做的步骤？）。手动阶段修的每一个问题都变成一条可自动化的检查。
3. **建提示集（prompt set）。** 单个 skill 起步 **10–20 条**，取自真实用法。每条声明自己的 `expected_checks`。覆盖核心能力、护栏（如禁用已弃用 API）、扩展功能，以及**负面测试**。
4. **务必包含负面测试。** 加上 skill **不该触发**的提示——描述过宽的 skill 会在每个请求上乱触发。
5. **跑 agent 并捕获输出。** 用 agent 真实体验它的方式测（通常经 CLI），捕获 response、stats、exit code。
6. **写确定性检查。** 每个检查是一个返回 bool 的小函数（多用 regex 针对抽取出的代码），注册进 registry，按 `check_id` 分发，遍历每个用例。
7. **对定性维度用 LLM-as-judge。** 代码结构、命名、设计品味等 regex 抓不住的，用第二个模型辅助评分，并用**结构化输出（typed schema）**约束结果使其可解析可追踪。选择性使用——确定性检查快，LLM 评分有成本和延迟。
8. **多次试验 + 隔离环境。** agent 非确定，每个用例跑 3–5 次看分布，不看单次；每个用例用干净环境，防止上下文串味掩盖真实失败。
9. **跨 harness 测试。** 同一 skill 在不同 agent 框架下行为可能不同；若跨工具使用，每个都要 eval。
10. **升级与退役。** 能力评估从低通过率爬到 ~100% 后，转为**回归评估**防倒退。定期在**卸载该 skill**的情况下跑评估——若仍全过，说明模型已内化其价值，可以退役。

## 分发与强制

- 小团队协作少数仓库：直接把 skill 提交到仓库 `./.claude/skills/`（或 `.agents/skills/`）即可。注意每个提交进去的 skill 都会给上下文增加负担。
- 规模变大：做成插件 + 内部插件市场，让成员自选安装；让最有用的 skill 自然涌现，发布前要有审核机制，避免低质/重复 skill。
- **让工作流在正确时机成为强制项。** 在仓库级指令文件（`AGENTS.md` / `CLAUDE.md`）里用简短 **if-then 规则**声明强制 skill，高价值的放最前：例如「改动影响运行时代码/测试/构建行为时，调用 `$code-change-verification`，通过前不得标记完成」「准备移交时调用 `$pr-draft-summary`」。skill 编码「什么叫已验证/已就绪」，指令文件让这个定义可强制执行。
- **门控输出要可操作。** release/审查类 skill 从「安全」出发，只有 diff 有具体证据才切到「阻塞」，且每个阻塞必须附带明确的解除清单。
- 本地稳定后，再用 GitHub Action 等把同一工作流搬进 CI（手动使用阶段才是调指令、修脚本、发现边缘情况的地方）。

## 快速清单

- [ ] 归入单一类别，契约窄、产出具体
- [ ] description 写成 when/if-then，讲清何时适用+触发条件+是否可选，用用户意图措辞
- [ ] 正文用指令不用信息，不说显而易见的事，有踩坑点章节，不过度限制
- [ ] 确定性/重复的活下沉到 scripts（小型 CLI）；hash/时间戳/硬质量门用代码而非 prompt
- [ ] 详细引用与模板拆到 references/、assets/，渐进式披露
- [ ] 有 10–20 条 prompt 的 eval harness，含负面测试，评结果不评路径，多次试验
- [ ] 需要时用 AGENTS.md/CLAUDE.md 的 if-then 规则强制触发
