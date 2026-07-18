---
name: react-state-management-decisions
description: Use when deciding where React state should live or planning a state-management migration — useState vs useRef vs useMemo vs Context vs Zustand vs React Query. Provides a decision tree, a useRef semantic classification (most refs should NOT migrate), Zustand/React Query responsibility boundaries, progressive migration strategy, and persist-based draft state patterns.
---

# React 状态管理决策

不是「要不要上 Zustand」，而是**按语义给每份状态找对归属**。核心决策树：

- **服务端数据** → React Query（获取、缓存、刷新、mutation 后失效）。
- **DOM 引用 / 定时器句柄 / AbortController / 瞬时交互标记** → useRef，保持不动。
- **单组件视图派生计算** → useMemo，留在视图层。
- **跨组件共享 + 生命周期长于单组件实例（+ 需持久化）** → Zustand。
- **导航状态** → 路由（菜单点击应该体现为 URL 变更）。

## 1. useMemo 不要盲目迁 Zustand

- Zustand 解决的是「状态共享与订阅」，**不是**自动优化「重计算」。把渲染派生结果塞进 store，流式更新时反而更频繁触发 store 更新 → 更多订阅重渲染。
- 适合入 store 的派生：跨组件共享、多处复用、生命周期长于单组件的索引类数据（如会话级引用索引）。
- 强依赖单条消息 props 的派生（内容转换、markdown components）本质是视图层局部计算，进全局 store 只增加失效与同步复杂度。
- 优先级排序（按成本收益）：组件拆分 + 纯函数抽离 ＞ 部分引入 store 做会话级派生缓存 ＞ 大规模 useMemo 迁 store（收益不确定，最大风险是缓存失效不完整）。

## 2. useRef 按语义分类（实测 34 处只有 1 处值得迁）

| 语义 | 处置 |
|---|---|
| DOM 引用 | 保持 useRef |
| 定时器/动画句柄 | 保持 useRef |
| 请求控制（AbortController）/并发标记 | 保持 useRef |
| 交互瞬时态（拖拽中间值等） | 保持 useRef |
| 初始化哨兵位（initializedRef 等） | 通常保持；若 store 已有等价标记，改读 store |
| **共享业务状态型 ref** | 唯一的迁移候选 |

不要为了「统一用 store」而替换——那是把实现手段当目标。

## 3. Zustand 与 React Query 边界

- React Query 管服务端数据全生命周期；**不要把服务端列表数据再塞进 Zustand**（与 RQ 缓存职责重叠，双份真源必然漂移）。
- Zustand 只放客户端 UI 状态：导航折叠、侧栏、抽屉、modal、筛选条件、轻量用户偏好。

## 4. 渐进式迁移策略

- 以「某个状态收敛为单一来源」为目标推进（如 `activeConversationId` 收敛进 runtime store），按模块分批，不做大爆炸迁移。
- 迁移进度用文档跟踪，定期用子代理分模块核对「文档声称 vs 代码现状」，防止脱节。
- 复杂强交互（拖拽排序、多组件通信）用极轻量 store 取代深层 prop drilling / Context，配合纯展示组件二次分离。

## 5. persist 草稿态模式

「新建即草稿」场景（点新建不立即建库，发送时才创建正式实体）：
- 草稿用 `zustand + persist`（localStorage），全局单例；重复触发新建回到同一草稿并恢复内容。
- 只持久化必要字段（如输入文本）；草稿不进主数据库；多标签页冲突可先按「最后写入生效」不做处理。
