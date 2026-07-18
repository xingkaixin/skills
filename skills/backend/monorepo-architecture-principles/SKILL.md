---
name: monorepo-architecture-principles
description: Use when organizing a monorepo, splitting a single repo into packages, evaluating an architecture migration, or reviewing structural decisions. Covers the layered apps/packages paradigm (single contract layer, one-way dependency DAG, bottom-up extraction order), ten recurring architecture principles (single data source with no fallback forks, execution-location correctness, cost-vs-pain gating for rewrites), named anti-patterns, and native-module/packaging pitfalls.
---

# Monorepo 架构组织与决策原则

跨多个真实项目收敛出的组织范式与决策原则。词汇遵循 deep-module 设计语言（module / interface / depth / seam / adapter / leverage / locality）。

## 1. Monorepo 分层范式

```
apps/
  web        # 应用（SPA / 客户端）
  api|worker # 服务端（编排与事务边界，不放业务规则）
  www|docs   # 内容站（SSG，与应用完全解耦）
packages/
  contracts|shared-types  # ★契约层：唯一被多方共享的最底层，只放数据形状不放逻辑
  core|domain             # 纯函数业务规则，环境无关，每条配单测
  db                      # 持久化，只被服务端依赖
  tsconfig                # 共享配置
```

- **依赖是单向 DAG**：应用 → 领域包 → 契约层；内容站独立不进依赖图。契约层是前后端唯一共享面。
- **形态分离**：营销/文档站 = 内容站（SSG，核心价值是正文进初始 HTML、可被搜索引擎与 AI 读取）；应用 = SPA。不要做「React App 套一层 SSG 壳」的假 SSG。
- 工具链：pnpm workspace + Turbo；每包 AGENTS.md 记职责边界 + 依赖方向 + 运行时陷阱。

## 2. 单仓 → monorepo 的拆分顺序（依赖倒置）

**先抽最底层共享包（纯逻辑/类型/契约 + 单测）→ 再拆应用 → 最后配流水线（Turbo + CI）**。每一步可即时修复、可回滚。不要从应用侧开拆。

## 3. 十条决策原则

1. **深模块优先**：小接口藏大行为；接口即测试面；用删除测试判模块价值（删掉后复杂度消失 = pass-through 浅模块）；「一个 adapter 是假想 seam，两个才是真实 seam」——不为可能的变化预留抽象。
2. **纯逻辑与副作用分离**：业务规则下沉为环境无关纯函数（跨端复用 + 直接单测）；副作用推到边缘层。
3. **契约层单一化**：只放形状，不放逻辑；被多方依赖的包越底层越薄。
4. **单一数据源 + 读写路径不分叉**：如「前台只读本地缓存库、唯一 worker 负责写入」——坚决不开「源数据更新就绕过缓存直读」的兜底分叉，宁可接受低频场景的数据滞后；根因要在刷新链路本身修。
5. **执行位置正确性**：重 CPU / 长任务必须离开主执行线程（Electron main → worker、event loop → worker thread）。「导入无法取消」这类症状的本质往往是执行位置错了。
6. **状态分层不套模式**：store 只承载需驱动渲染的共享状态；useRef 管瞬时可变引用；拒绝教条式全面迁移。
7. **成本 vs 现有痛点收口**：即使新架构优点列得再多，短期无发布/性能/维护痛点就不重写；把新架构的收益以低成本方式内化到现有栈（如先把稳定契约硬边界留在 monorepo 内）。
8. **语义正确性**：先问「这个机制要解决什么问题」——本地持久索引不该套 HTTP cache 的 TTL 失效语义；DB 批处理必须保留租户/权限/软删/分页约束。
9. **P0/P1/P2 分批整改**：评估先出文档（每条 Go/Hold/Drop），不直接进实施；每批小步快跑、最小改动、可回归、可回滚、可度量，显式声明「不做什么」。
10. **债务一次性收口**：确认是结构性债务时做「边界治理」一次性收掉，不 ad-hoc 一处处打补丁。

## 4. 反模式清单

- 读取路径兜底分叉（缓存 + 直读双路径）
- 假 SSG（客户端应用套 SSG 壳）
- 上帝组件（千行级 + 几十个 useState）；整改三手法：强交互域局部 store 状态自治、纯展示组件二次分离、拒绝一刀切迁移
- 「深度 = 实现行数 / 接口行数」的机械度量（奖励灌水）
- 为迁移而迁移、为统一而统一
- native 模块被主 workspace 按 Node ABI 构建或被 bundle 进主进程

## 5. Native 模块与打包坑位

- native addon（如 better-sqlite3）：Node 大版本 ABI 不匹配时固定 Node 版本；Electron 场景用**独立子 workspace** 隔离并针对 Electron ABI rebuild。
- pnpm 新版：native 包必须在 `pnpm-workspace.yaml` 显式放行构建，否则 install 失败。
- 安装期编译慢：「安装期问题用发布预编译包解决，不在代码里处理」。
- Electron ESM main：生态包假设 `__dirname`，需构建插件替换 `import.meta` 并特判 Windows 路径。
- wasm/native 资源：用 electron-builder `extraResources` 显式 copy + `asarUnpack`，不手动拼路径。
- Cloudflare Worker 异步副作用必须挂 `waitUntil`（`void asyncTask()` 本地正常、线上丢失）。
- 开发环境与打包应用要隔离 userData 存储路径，否则 onboarding 等首次逻辑不触发。
