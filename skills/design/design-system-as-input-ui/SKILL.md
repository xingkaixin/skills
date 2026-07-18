---
name: design-system-as-input-ui
description: Use when generating multi-screen UI with an AI coding agent (Claude Code, Cursor) and the screens come out visually inconsistent — different blues, radii, spacing per screen. Provides a workflow that turns a design system into a reusable *input contract* so every screen references one source of truth instead of guessing pixel-by-pixel. Trigger when building more than one screen, a dashboard, or any product where visual coherence across screens matters.
---

# 用「设计系统作为输入」生成一致的 UI

## 核心问题与原理

AI 逐屏生成 UI 时，每屏都从零重画，**没有记忆上一屏的决策**，于是每屏重新发明一个蓝色、一个圆角、一套间距。十屏就是十张恰好放在同一文件夹里的图，而不是一个产品。

这不是模型能力问题，是**缺少 source of truth**。模型在像素级生成，是因为它没有别的可对齐的东西。解法：给它一份设计系统作为**输入（input / contract）**，而不是一次次的描述（request）。截图让模型猜，token 包让模型引用——同一个模型，完全不同的结果。

设计系统作为输入时是一个可移植的包，三部分：
- **Tokens** —— 实际的颜色、间距、字号 scale
- **Components** —— 按钮及其 variants 和 states
- **Guidelines** —— 这些如何组合的规则（如何时用 drawer vs modal、空态/加载态长什么样）

## 四步工作流

工作流的关键：把设计系统做成一次性的规则，改规则一次修所有屏；而不是逐屏改像素。工作从「restyle 像素」变成「review 引用」，是一个短得多的活。

### Step 1 — 从「具体的 brief」而非「vibe」建系统

系统质量几乎完全由 brief 质量决定。四个词的模糊 brief（"a dashboard for AI"）只会把猜测上移一层，产出一个放到任何产品上都行、因而什么问题都没解决的通用系统。**早期的具体性就是全部。**

Brief 模板（把方括号换成你的真实内容）：

```text
build a design system for [用一句具体的话描述你的产品]. surface and accent colors: [具体色值/风格，如 deep navy surface + one high-contrast accent]. type: [字体，如 Inter for everything]. density: [low/high]. components: [列出你真正会用到的，如 cards, data tables, tabs, status badges, KPI tiles]. include guidelines for drawer vs modal and for empty and loading states.
```

导入已有系统时：结构优于像素，**HTML 和 Figma SVG 效果最好，PNG 最差**（PNG 只是一张要被解读的图，给不出真实 token 和层级）。

### Step 2 — 生成时把系统「附加」进去，而非事后补

系统 attach 到每次生成后，每屏都引用你的 token 而不是发明新的。

```text
generate [N] screens using the attached design system: [列出所有屏，如 overview, cost-by-model, latency, token usage, agent status, alerts, single-agent detail, settings, billing, empty/first-run]. keep the nav, cards, and chart styles consistent across all of them.
```

此时你做的是 review（导航栏每屏一致、KPI 卡只有一种样式、图表共用调色板），而不是 restyle。

### Step 3 — 下载系统，交给 Claude Code / Cursor

导出整份系统（tokens + component specs + guidelines + assets），作为输入交给编码 agent。关键在最后一句 **stop-and-ask**：它把模型「填补空白」的本能转成「标记空白」的本能，是防止发明色值的核心机制。

```text
here is our design system (attached). build [screen/component] using only the tokens, components, and spacing it defines. do not introduce new colors, radii, or font sizes. if the system doesn't cover something, stop and ask instead of inventing it.
```

（Cursor 同理：把下载的系统丢进项目，告诉它 "build using our design system"，编辑器里的 AI 会把 token 和 spec 当 spec 读。）

### Step 4 — 设为常驻规则，防止漂移

下载的系统只有在**每个任务都引用它**时才有用。某一屏跳过它，那屏就漂回猜测。把下面这条在项目级设一次：

```text
for every new screen or component in this project, reference the attached design system first. before writing any color, spacing, or type value, check whether the system already defines it. flag any case where the design doesn't cover what you need.
```

## 完整可复制流水线

```text
# 1. 建系统（如在 Moonchild 等 design-system-first 工具里，或直接让 agent 产出一份 token 文件）
build a design system for [用一句具体的话描述你的产品]. surface and accent colors: [具体]. type: [字体]. density: [low/high]. components: [列出你真正会用到的]. include guidelines for drawer vs modal and for empty and loading states.

# 2. 附加系统后生成多屏
generate [N] screens using the attached design system: [列出所有屏]. keep nav, cards, and core components consistent across all of them.

# 3. 下载系统后，在 Claude Code / Cursor 里
here is our design system (attached). build [screen/component] using only the tokens, components, and spacing it defines. do not introduce new colors, radii, or font sizes. if the system doesn't cover something, stop and ask instead of inventing it.

# 4. 设为常驻规则防漂移
for every new screen or component, reference the attached design system first. before writing any color, spacing, or type value, check whether the system defines it. flag anything it doesn't cover.
```

## 三个会浪费时间的坑

1. **用 PNG 导入系统** —— 结构优于像素，PNG 只能得到粗略近似；用 HTML / Figma SVG。
2. **brief 太泛** —— 只是把猜测上移一层，没有真正消除。
3. **某个任务跳过系统** —— agent 从不引用的包等于没有；「写前先查系统」这条规则才让它真正生效。

## 三个诚实的边界

1. **产出仍需 review** —— 更快更一致，但仍是生成代码；当强初稿对待，尤其逻辑部分要测试。
2. **系统有多好，产出就有多好** —— 系统薄而通用，导出就薄而通用，下游全部继承。省下的 restyle 时间转移到「一次性把系统建扎实」。
3. **纪律不会自我执行** —— 常驻指令有帮助，但团队里 code review 仍要检查是否用了 token 而非硬编码近似值。

## 何时用
生成 **超过一屏** 的 UI、dashboard、或任何需要跨屏视觉一致的产品时。单个一次性页面不需要这套。衡量收益的指标：首次生成即 on-brand 的屏数、restyle 总耗时、AI 发明的一次性色值数量、跨屏品牌漂移。
