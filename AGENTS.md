# 技能仓库治理说明

本仓库的目标不是把所有上游内容直接暴露出去，而是把“来源”和“产物”分层管理。

- `sources/` 和 `vendor/` 是来源层
- `skills/` 是最终对外提供的技能目录
- `meta.ts` 是唯一控制面

在这个仓库里，外部使用方应该消费 `skills/`，而不是直接读取 `sources/` 或 `vendor/`。

## 三类内容

### 1. `sources/`

用于保存原始来源资料。适合两类场景：

- 上游没有现成 skill，只有文档或源码资料
- 我们需要先抓取或整理来源，再手工沉淀为 skill

当前 `sources` 只负责保存来源，不自动生成 skill。

例如：

- `sources/claude-agent-skill`

这里的资料可以通过脚本刷新，但 `skills/` 下对应的 skill 目前仍然是手工整理维护。

### 2. `vendor/`

用于保存“上游已经维护了 skill”的外部仓库。它们以 git submodule 的方式纳入本仓库。

这些仓库里的 skill 不直接对外暴露。仓库只会把 `meta.ts` 中显式声明的 skill，同步到 `skills/` 下。

同步规则：

- 只同步配置中声明的 skill
- 输出目录采用覆盖式同步
- 每个同步产物目录都写入 `SYNC.md`

不要手工修改同步产物并期待长期保留。对 synced skill 的治理应优先通过上游仓库或同步配置完成。

### 3. 手写 `skills/`

仓库里还存在一部分手写 skill，它们直接维护在 `skills/` 下。

这类 skill：

- 不来自 `vendor/` 自动同步
- 也不是 `sources/` 自动生成的产物
- 是否修改，取决于具体任务本身

除非任务明确要求，不要把手写 skill 强行迁入自动同步流程，也不要把受管同步规则套到它们身上。

## 当前结构

```txt
.
├── AGENTS.md
├── meta.ts
├── scripts/
│   ├── cli.ts
│   └── fetch-source-docs.ts
├── sources/
│   └── {source-name}/
├── vendor/
│   └── {vendor-name}/
└── skills/
    └── {skill-name}/
```

关键职责：

- `meta.ts`
  - 定义 `sources` 与 `vendors`
  - 决定来源如何接入、vendor 同步哪些 skill
- `scripts/cli.ts`
  - 提供 `init`、`sync`、`check`、`cleanup`
- `scripts/fetch-source-docs.ts`
  - 为 script 型 source 抓取和刷新来源文档

## 关键原则

### 1. `skills/` 才是稳定接口

不要让外部使用方直接依赖 `vendor/*` 或 `sources/*` 的目录结构。

原因很简单：

- 上游仓库结构可能变
- source 只是原始资料，不等于最终 skill
- vendor skill 可能重命名后再输出
- 本仓库需要在 `skills/` 这一层维持稳定接口

### 2. 配置集中在 `meta.ts`

不要把“来源有哪些”“同步哪些 skill”硬编码到脚本里。

正确方式是：

- 在 `meta.ts` 中声明来源
- 脚本只消费配置

如果要新增 source/vendor，第一步应当是修改 `meta.ts`。

### 3. vendor 同步必须显式声明

不要默认同步某个 vendor 仓库中的全部 skill。

应该只同步 `meta.ts` 中明确列出的 skill 映射，这样才能保证：

- 输出集合可审计
- 上游新增内容不会悄悄污染本仓库
- 输出名与上游目录名可以解耦

### 4. source 目前不自动生成 skill

当前 source 的流程是：

1. 抓取或整理原始资料到 `sources/{name}`
2. 人工阅读、归纳和维护对应的 `skills/*`

不要把 source 误认为“会自动产出 skill”的流水线。

### 5. 手写 skill 和受管产物要分开理解

受管同步产物通常会带 `SYNC.md`，它们由同步流程维护。

手写 skill 没有这个约束，不能按 synced skill 的规则直接清理或覆盖。

## 日常操作

### 接入新的 source 或 vendor

1. 修改 `meta.ts`
2. 如有需要，补充对应来源目录或抓取配置
3. 运行 `init`
4. 运行 `sync`

### `init`

用途：

- 注册缺失的 repo 型 source submodule
- 注册缺失的 vendor submodule
- 为 script 型 source 准备目录

它只处理来源接入，不负责 skill 生成。

### `sync`

用途：

- 更新 submodule
- 刷新 script 型 source 的原始资料
- 将 vendor skill 同步到 `skills/`

同步行为是覆盖式的，不做增量 patch。

### `check`

用途：

- 检查 repo 型 source/vendor 是否落后远端
- 对 script 型 source 给出 `manual-check`

### `cleanup`

用途：

- 清理已经不在配置中的 source/vendor 目录
- 清理不再受配置管理的同步产物 skill

`cleanup` 不应该误删未受管的手写 skill。
