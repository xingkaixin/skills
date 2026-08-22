# Skills

这是一个按分类维护并发布 AI agent skills 的仓库。

`skills/{category}` 是分类成员关系的唯一事实来源。Web catalog、Claude
marketplace 和 Codex marketplace 都由同一套 publication 模块生成。

## 目录结构

```txt
.
├── .agents/plugins/
├── .claude-plugin/
├── apps/web/
├── plugins/{category}-skills/
├── content/
│   └── skill-descriptions.json
├── scripts/
│   ├── catalog/
│   ├── generate-web-skills.ts
│   └── skill-descriptions.ts
└── skills/{category}/{skill-name}/
    └── SKILL.md
```

## 常用命令

所有命令都从仓库根目录执行：

```bash
pnpm install
pnpm generate:web-data
pnpm check:generated
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
pnpm preview
```

`pnpm check` 会执行生成物一致性、ESLint、TypeScript、Astro、测试和生产构建。

## 新增 skill

1. 选择单一分类并创建 `skills/{category}/{skill-name}`
2. 添加包含 `name` 和 `description` frontmatter 的 `SKILL.md`
3. 按需添加 `scripts/`、`references/` 或 `assets/`
4. 运行 `/skill-descriptions` 补齐展示描述（英/中/日）
5. 运行 `pnpm generate:web-data`
6. 运行 `pnpm check`

slug 必须全局唯一。本地 Markdown 引用必须指向 skill 包内真实存在的文件。

`content/skill-descriptions.json` 存放网站展示用的三语描述，与 SKILL.md 的
frontmatter description 是两回事——后者是给 agent 的触发文本。每条记录了来源
SKILL.md 的哈希，SKILL.md 变更后描述未跟进时构建会失败。若改动不影响 skill 的
实际行为，用 `pnpm descriptions:touch <slug>` 保留原文并重新盖章。
不要手工维护 marketplace 的 skill 列表。

## 发布模型

`scripts/catalog/` 从 `skills/` 生成：

- Web 元数据和安全处理后的正文
- Claude plugin marketplace
- Codex plugin marketplace 和分类 manifest

平台无法从路径推导的描述、展示名和来源信息集中维护在
`scripts/catalog/config.ts`。

## 致谢

- Skill 管理思路参考了 [antfu/skills](https://github.com/antfu/skills)
- `apps/web` 参考了 [himself65/finance-skills](https://github.com/himself65/finance-skills)

更详细的仓库治理规则见 [AGENTS.md](AGENTS.md)。
