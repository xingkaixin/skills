# Skills

这是一个分类维护 AI agent skills 的仓库。

- `sources/` 保存原始文档或源码资料，不自动生成 skill
- `skills/` 保存最终对外提供的 skill
- `meta.ts` 定义 source 的接入方式

## 目录结构

```txt
.
├── meta.ts
├── scripts/
│   ├── cli.ts
│   ├── fetch-source-docs.ts
│   └── generate-web-skills.ts
├── sources/
└── skills/
    └── {category}/
        └── {skill-name}/
            └── SKILL.md
```

`skills/{category}` 是分类的唯一事实来源，Web 目录会直接从路径生成分类和筛选条件。

## 常用命令

```bash
pnpm install
pnpm start init
pnpm start sync
pnpm start check
pnpm start cleanup
pnpm generate:web-data
```

## 工作方式

### 接入 source

1. 修改 `meta.ts`
2. 运行 `pnpm start init`
3. 运行 `pnpm start sync`

### 新增 skill

1. 选择单一分类并创建 `skills/{category}/{skill-name}`
2. 添加 `SKILL.md` 及必要的 `scripts/`、`references/` 或 `assets/`
3. 运行 `pnpm generate:web-data`
4. 校验 Web lint 和 build

skill slug 必须全局唯一，不要在配置文件中重复维护分类。

## 致谢

- source 管理流程参考了 [antfu/skills](https://github.com/antfu/skills)
- `apps/web` 参考了 [himself65/finance-skills](https://github.com/himself65/finance-skills)

更详细的仓库治理规则见 [AGENTS.md](AGENTS.md)。
