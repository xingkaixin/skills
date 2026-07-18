# 技能仓库治理说明

本仓库把来源资料与最终 skill 分层管理：

- `sources/` 保存原始来源资料
- `skills/` 是最终对外提供的技能目录

外部使用方只应消费 `skills/`，不要直接读取 `sources/`。

## 两类内容

### 1. `sources/`

用于保存原始文档或源码资料，适用于上游没有现成 skill，或需要先整理来源再手工沉淀的场景。

source 只作为人工整理时的参考材料，不参与自动生成流程。当前示例是 `sources/claude-agent-skill`。

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
├── scripts/
│   └── generate-web-skills.ts
├── sources/
│   └── {source-name}/
└── skills/
    └── {category}/
        └── {skill-name}/
            └── SKILL.md
```

`scripts/generate-web-skills.ts` 扫描分类目录并生成 Web 数据。

## 关键原则

### 1. `skills/` 是稳定接口

source 只是原始资料，不等于最终 skill。上游结构变化不能直接改变本仓库的对外接口。

### 2. 分类只由目录表达

新增或移动 skill 时选择一个明确分类，并保持 skill slug 在全仓库唯一。不要增加第二套 tag/category 映射。

### 3. source 不自动生成 skill

source 流程是：

1. 人工整理资料到 `sources/{name}`
2. 人工阅读并维护 `skills/{category}/{skill-name}`

不要把 source 当成自动产出 skill 的流水线。

## 日常操作

### 维护 skill

1. 在 `skills/{category}/{skill-name}` 新增或修改内容
2. 运行 `pnpm generate:web-data`
3. 运行 Web lint 和 build
