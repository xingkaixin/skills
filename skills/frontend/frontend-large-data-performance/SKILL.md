---
name: frontend-large-data-performance
description: Use when a frontend must handle large files or streaming data — 50-300MB JSONL parsing, huge document rendering, LLM streaming UIs. Covers benchmark-driven optimization (append-only worker buffers, incremental aggregation, virtual-list/observer conflicts), a first-principles WASM adoption test, streaming UI protocols (init/append chart deltas, stable component references, single in-progress view), and known runtime pitfalls (Bun idleTimeout).
---

# 大数据量前端性能与流式渲染

处理大文件（50-300MB）与流式数据的前端性能方法论。原则：**benchmark 驱动、增量化、先低成本优化后换技术**。

## 1. Benchmark 驱动的优化流程

- 先建多规格基准（如 50/150/300MB 大文件 + 高记录数小文件），每个优化跑单次 + 3-run 对比。
- 每个优化配等价性回归测试；「收益被剩余成本掩盖」时如实报告，不虚报。
- 验收有量化门槛，达标即停。

## 2. 四类高频根因（Worker 流式解析场景）

1. **batch 合并 O(n²)**：每 batch spread 复制历史记录。→ append-only backing array 累加（引用稳定）+ 版本号信号驱动 UI。
2. **每 batch 全量重派生**：聚合/概览/可见集全量重扫。本质是聚合层没把 append-only 当增量。→ 增量聚合状态（O(n)→O(delta)）；无过滤条件时统计直接复用 parser 内部 stats（O(1)）。
3. **观察者与虚拟列表冲突**：app 级 observer 与虚拟列表重复观察。→ 导出阈值，超过阈值时 app observer 提前返回。
4. **搜索每次输入全量重读**：只对文件路径搜索加 debounce，内存内搜索保持即时。

## 3. WASM/Rust 替换的第一性检验

想用 WASM 加速解析前先过四问：
1. 瓶颈真的在解析吗？（浏览器 `JSON.parse` 是引擎内建优化路径；实测 10MB parse p95 仅 ~34ms，瓶颈常在数据结构构造/内存分配/React 渲染）
2. 跨边界成本算了吗？（最终仍要给 React 一个 JS 对象图，WASM 解析完可能复制两次内存）
3. 工程成本算了吗？（async init、打包、多端加载差异、CSP、双语言维护 schema 契约）
4. 有量化验收门槛吗？

结论模式：先做低成本优化 + 补基准，**只在目标规格失败时才做限定范围的 WASM spike**。技术选型是战略选项，不是默认路径。

## 4. 大文档渲染（万字级重排）

- 超长文档不直接滚动，用成熟分页引擎（EPUB 场景选 foliate-js：paginator reflow 分页 + CFI 做进度/批注定位）。
- 改字号等全文重排操作慢时，可同时用交互设计弱化延迟可见性（如重排期间隐藏页码）。

## 5. 流式 UI 协议（LLM 输出场景）

- **已渲染内容不得重动画**：流式更新时保持 `components` 等引用稳定（memo/ref），否则已渲染节点被重建、逐词动画反复播放。CJK 分词用对应插件。
- **流式图表用 init/append 协议**：不让前端 parse 半成品 JSON——init 先渲染空图框+骨架，append 增量加点；协议文档硬约束「长序列拆多次 append」。
- **流式部件按增量透传**：消费 SDK 的 `partial_json` 单 chunk，按 toolUseId 累积 buffer + 按 id upsert，不整段替换。
- **布局稳定**：流式期间只保留单一「进行中视图」，完成后一次性重组最终布局（思考区/回答区/工具区），避免内容在区域间搬家跳动。
- 占位符链路：文本流出现 `[[chart:x]]` 占位 → 挂载/增量事件更新 store → 流式阶段立即渲染。

## 6. 运行时坑

- **Bun 长流式**：默认 `idleTimeout` 10s 会中断长流式并触发 abort，服务入口设 `idleTimeout: 0`。
