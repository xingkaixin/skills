# 技能仓库治理说明

本仓库对外提供人工维护的 AI agent skills。外部使用方只应消费
`skills/`，Web 站点和平台 marketplace 都是从该目录生成的适配产物。

## Skill 结构

Skill 固定采用两级目录：

```txt
skills/{category}/{skill-name}/SKILL.md
```

`category` 是分类成员关系的唯一事实来源。Web 目录、筛选条件、Claude
marketplace 和 Codex marketplace 都从路径推导，不要在其他配置中逐项维护
skill 或分类成员列表。

每个 skill 目录只保留 agent 执行所需内容。不要加入与 `SKILL.md` 重复的
README、安装指南或变更日志。

## 当前结构

```txt
.
├── .agents/
│   └── plugins/
├── .claude-plugin/
├── apps/
│   └── web/
├── plugins/
│   └── {category}-skills/
├── scripts/
│   ├── catalog/
│   └── generate-web-skills.ts
└── skills/
    └── {category}/
        └── {skill-name}/
            └── SKILL.md
```

`scripts/catalog/` 负责发现、校验和发布 catalog：

- 从目录推导分类和 skill 集合
- 解析 frontmatter 并安全渲染 Markdown
- 校验本地 Markdown 链接和 slug 唯一性
- 生成 Web 数据、Claude marketplace、Codex marketplace 和 plugin manifest

平台专属的分类描述、展示名和能力声明集中在
`scripts/catalog/config.ts`，只保存无法从目录推导的元数据，不重复保存成员关系。

## 关键原则

### `skills/` 是稳定接口

上游资料不直接等于最终 skill。导入外部内容后应人工检查并维护最终的
`skills/{category}/{skill-name}`。

### 分类只由目录表达

新增或移动 skill 时选择一个明确分类，并保持 slug 全仓库唯一。新增分类时，
只为平台无法推导的展示信息补充一项 category metadata。

新增分类必须同步适配 Web 列表卡片背景，在
`apps/web/src/assets/card-backgrounds/{category}.png` 补充与分类同名的素材，
保持现有轻量、低对比的点缀风格，并检查桌面和移动端的显示效果。
通用兜底背景只用于容错，不能作为新分类已完成背景适配的依据。

### 生成物必须可复现

不要手工编辑 `*.generated.ts`、marketplace JSON 或 plugin manifest。运行生成命令
更新它们，并使用只读检查确认工作树中的生成物没有漂移。

## 日常操作

### 维护 skill

1. 在 `skills/{category}/{skill-name}` 新增或修改内容
2. 运行 `pnpm generate:web-data`
3. 在根目录运行 `pnpm check`

### 常用命令

```bash
pnpm dev
pnpm generate:web-data
pnpm check:generated
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
```
