# Skills

这是一个 Skills 仓库，用来统一管理两类外部来源：

- `vendor/`：上游已经维护好的 skill 仓库，通过 submodule 纳入并同步到本仓库
- `sources/`：原始文档或资料来源，当前只负责抓取和保存，后续 skill 仍然手工整理

最终对外提供的是 `skills/`，而不是 `vendor/` 或 `sources/`。

## 目录结构

```txt
.
├── meta.ts
├── scripts/
│   ├── cli.ts
│   └── fetch-source-docs.ts
├── sources/
├── vendor/
└── skills/
```

- `meta.ts`：定义 `sources` 和 `vendors`
- `scripts/cli.ts`：统一入口，负责 `init` / `sync` / `check` / `cleanup`
- `scripts/fetch-source-docs.ts`：刷新 script 型 source 文档
- `skills/`：最终输出目录

## 常用命令

```bash
pnpm install
pnpm start init
pnpm start sync
pnpm start check
pnpm start cleanup
```

如果要刷新 `claude-agent-skill` 这类 script source：

```bash
just claude
```

## 工作方式

### 接入新的 vendor/source

1. 修改 `meta.ts`
2. 运行 `pnpm init`
3. 运行 `pnpm sync`

### 更新已有来源

- `pnpm check`：检查 repo 型来源是否落后
- `pnpm sync`：更新 submodule、刷新 script source、同步 vendor skill

## 说明

- `vendor` 同步是覆盖式的
- 同步产物会写入 `SYNC.md`
- 手写 `skills/*` 不会自动纳入 source/vendor 流程


## 致谢

- Submodule 管理与 skill 同步流程参考了 [antfu/skills](https://github.com/antfu/skills)
- `apps/web` 参考了 [himself65/finance-skills](https://github.com/himself65/finance-skills)

更详细的仓库治理规则见 [AGENTS.md](AGENTS.md)。
