# Skills

这是一个分类维护 AI agent skills 的仓库。

- `sources/` 保存人工整理的原始资料，不参与自动生成
- `skills/` 保存最终对外提供的 skill

## 目录结构

```txt
.
├── apps/
│   └── web/
├── pnpm-workspace.yaml
├── scripts/
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
pnpm generate:web-data
pnpm dev
pnpm lint
pnpm build
pnpm preview
```

## 工作方式

### 新增 skill

1. 选择单一分类并创建 `skills/{category}/{skill-name}`
2. 添加 `SKILL.md` 及必要的 `scripts/`、`references/` 或 `assets/`
3. 运行 `pnpm generate:web-data`
4. 运行 `pnpm lint` 和 `pnpm build`

根目录是 pnpm workspace 入口，所有 Web 命令都从根目录执行。

skill slug 必须全局唯一，不要在配置文件中重复维护分类。

## 致谢

- source 管理流程参考了 [antfu/skills](https://github.com/antfu/skills)
- `apps/web` 参考了 [himself65/finance-skills](https://github.com/himself65/finance-skills)

更详细的仓库治理规则见 [AGENTS.md](AGENTS.md)。
