---
name: tauri-menubar-agent-app
description: Use when building a macOS menu-bar (tray) app with Tauri v2, especially one that observes external CLI agents via hooks — covers native window layering with objc2 (transparent windows, NSStatusWindowLevel, flipped coordinates), Unix-socket IPC from hook bridge binaries, multi-agent event normalization, and non-intrusive interaction design.
---

# Tauri 菜单栏应用（macOS）与多 Agent 事件桥接

Tauri v2 + Rust (`src-tauri`) + bun/vite 前端（固定端口 + strictPort）的菜单栏应用经验，含监听外部 coding agent 的 hook 桥接架构。

## 1. macOS 顶层窗口：纯 Tauri API 不够，要下到 objc2

- **透明窗口崩溃**：`transparent: true` 需要开 `app.macOSPrivateApi = true`。
- **IPC 崩溃（no reactor running）**：IPC 监听不能在无 Tokio reactor 的上下文初始化——改用标准线程 + `UnixStream` 监听。
- **窗口被菜单栏压住**：用 `objc2-app-kit` 拿 `ns_window()`，把层级提到 `NSStatusWindowLevel`(25)，Floating(3) 不够。
- **贴不到屏幕顶部**有两个叠加原因：① `setFrameTopLeftPoint` 用 flipped 坐标，会贴在菜单栏下方；② macOS constraint 保护会自动修正坐标。要同时设置 `collectionBehavior` 允许覆盖菜单栏 + 原生精确定位。
- 原生窗口操作必须在主线程执行。
- **不要猜 magic offset**：坐标不对时从坐标系语义根源解决，不要试 `-28` 之类的魔法值。

## 2. 多 Agent hook 桥接架构

- 注入点：各 agent 的 hook 配置（`~/.claude` settings、`~/.codex/hooks.json`、`~/.cursor/hooks.json`），覆盖 SessionStart / Stop / SubagentStop / Notification / PermissionRequest / UserPromptSubmit。
- bridge 是独立小二进制（`--source <claude|codex|cursor>`），打进 `.app` 的 `Contents/Helpers`。
- IPC：bridge 写入 `~/.<app>/run/<app>.sock`（UnixStream），协议为单行 JSON `{ event: ... }`。
- **核心难点是事件归一化**：各 agent 原始字段结构不同，覆盖面不足的症状是「日志进来了但 UI action 没联动」——归一化层要按 agent 逐个校准状态机映射（如 Codex：UserPromptSubmit 即 running，Stop 即 idle，SessionStart 后可能什么都不发生）。
- 常见状态机 bug：permission 请求与 ask_user_question 未区分；permission 未处理被误判会话结束；会话结束后仍显示运行中；第二个 agent 进程不可见。**排查一律先加日志读运行时输出**。

## 3. 交互设计原则

- 菜单栏应用的介入要克制：需要用户介入时改变图标状态（如「招手」动画），**不主动弹 popover 打断**；用户的回应仍回到 agent 自身完成。
- 涉及 permission 的事件优先级最高，菜单栏计数与动画图标要同步更新。
- 消息预览区不做占位：0 条显示 0 条，最多显示最近 N 条，不为对齐而填充。
