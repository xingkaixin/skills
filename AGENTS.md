# 技能仓库治理说明

本仓库把来源资料与最终 skill 分层管理：

- `sources/` 保存原始来源资料
- `skills/` 是最终对外提供的技能目录
- `meta.ts` 是 source 的唯一控制面

外部使用方只应消费 `skills/`，不要直接读取 `sources/`。

## 两类内容

### 1. `sources/`

用于保存原始文档或源码资料，适用于上游没有现成 skill，或需要先整理来源再手工沉淀的场景。

source 可以由仓库或脚本刷新，但不会自动生成 skill。当前示例是 `sources/claude-agent-skill`。

### 2. `skills/`

保存人工维护的最终 skill，固定采用两级目录：

```txt
skills/{category}/{skill-name}/SKILL.md
```

`category` 是 skill 分类的唯一事实来源。Web 目录、筛选条件和详情页分类都从路径推导，不要在其他配置里重复维护 tag。

每个 skill 目录只保留 agent 执行所需内容。不要加入与 `SKILL.md` 重复的 README、安装指南或变更日志。

## 当前结构

```txt
.
├── AGENTS.md
├── meta.ts
├── scripts/
│   ├── cli.ts
│   ├── fetch-source-docs.ts
│   └── generate-web-skills.ts
├── sources/
│   └── {source-name}/
└── skills/
    └── {category}/
        └── {skill-name}/
            └── SKILL.md
```

关键职责：

- `meta.ts`：定义 source 及其接入方式
- `scripts/cli.ts`：提供 `init`、`sync`、`check`、`cleanup`
- `scripts/fetch-source-docs.ts`：刷新 script 型 source 文档
- `scripts/generate-web-skills.ts`：扫描分类目录并生成 Web 数据

## 关键原则

### 1. `skills/` 是稳定接口

source 只是原始资料，不等于最终 skill。上游结构变化不能直接改变本仓库的对外接口。

### 2. 分类只由目录表达

新增或移动 skill 时选择一个明确分类，并保持 skill slug 在全仓库唯一。不要增加第二套 tag/category 映射。

### 3. 配置集中在 `meta.ts`

新增 source 时在 `meta.ts` 声明，脚本只消费配置，不硬编码来源。

### 4. source 不自动生成 skill

source 流程是：

1. 抓取或整理资料到 `sources/{name}`
2. 人工阅读并维护 `skills/{category}/{skill-name}`

不要把 source 当成自动产出 skill 的流水线。

## 日常操作

### 接入新的 source

1. 修改 `meta.ts`
2. 补充来源目录或抓取配置
3. 运行 `pnpm start init`
4. 运行 `pnpm start sync`

### 维护 skill

1. 在 `skills/{category}/{skill-name}` 新增或修改内容
2. 运行 `pnpm generate:web-data`
3. 运行 Web lint 和 build

### `init`

注册缺失的 repo 型 source submodule，并为 script 型 source 准备目录。它不负责生成 skill。

### `sync`

更新 repo 型 source，并刷新 script 型 source 的原始资料。

### `check`

检查 repo 型 source 是否落后远端，对 script 型 source 给出 `manual-check`。

### `cleanup`

清理已经不在 `meta.ts` 中的 source 目录，不修改 `skills/`。
