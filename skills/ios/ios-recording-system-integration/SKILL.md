---
name: ios-recording-system-integration
description: Use when building iOS recording features that integrate with Live Activities (Dynamic Island), the Action Button (App Intents), background audio, or realtime ASR over WebSocket. Covers the hard iOS boundaries (first mic activation must be foreground, Action Button assignment is unreadable, Live Activity is not a streaming channel), an intent state machine with audioSessionPrimed fallback, Dynamic Island debugging, and two ASR protocol paradigms (OpenAI-Realtime JSON vs binary frame).
---

# iOS 录音类系统集成（灵动岛 / Action Button / 后台录音 / 实时 ASR）

灵动岛、Action Button、后台录音是**一个耦合系统**。开发前先接受四条 iOS 硬边界，产品设计必须围绕它们收敛：

1. **初次麦克风录音的 `AVAudioSession` 激活必须在前台发生**——第三方 App 没有系统级「桌面直接后台起录」的私有通道。
2. **Action Button 是否已分配给本 App 不可读**——没有公开 API，也不能深链到其设置页。
3. **Live Activity 的 update 是系统托管的内容更新，不是实时流通道**——高频 update 会被限流，表现为「上岛如同没上」。
4. **后台不能触发权限请求**——后台调 `requestAuthorization` 会把 App 拉到前台。

## 1. Live Activity / 灵动岛

三层结构：共享 `ActivityAttributes`（ContentState 含 statusText/elapsedSeconds/`timerStartDate`/isRecording/waveformSamples）→ actor 控制器（start/update/end）→ Widget target 的 `ActivityConfiguration` + `DynamicIsland`（compact/expanded/minimal + 锁屏视图）。

**「能显示但像没显示」三段式排查**：
- 更新频率：转写等实时流**不触发 update**，后台更新节流到 ≥2 秒。
- 计时不要依赖推送：用 `Text(timerStartDate, style: .timer)` 系统自走时；防秒数抖动用稳定文本 + 关隐式动画 + `.monospacedDigit()`。
- update 前 `guard activityState == .active`，不对失效 activity 推送。

其他要点：
- 点岛路由：`.widgetURL(...)` 要挂在 **`DynamicIsland` 本体**上，不只是锁屏视图；App 回 active 时兜底检查录音状态。
- 桌面入口起的后台录音会话与应用内录音页要接**同一套预览组件**，否则两条路径体验分裂。
- Live Activity 可做真开关（是否创建是 App 自己的行为）；Action Button 状态不可读所以不能做开关。
- Widget target 用 `-D WIDGET_EXTENSION` 编译标记让共享源码在扩展里走 fallback，扩展进程不得依赖主 App 录音服务。

## 2. Action Button（App Intents）

- 主 App Intent：`AudioRecordingIntent + LiveActivityIntent`，`openAppWhenRun=false`；新系统用 `supportedModes=[.background, .foreground(.dynamic)]`，旧系统 `ForegroundContinuableIntent`，`@available` 双分支兼容。Widget/Control 扩展的 Intent 必然 `openAppWhenRun=true`，只写 pendingAction 再开 App。
- **「未分配」状态：不要假装能读**。UI 改成中性「系统动作：已提供」+ 引导 sheet（系统设置 → 操作按钮 → 选择本 App 动作）。通用经验：系统级绑定状态大多不可读，UI 应改为「提供动作 + 配置引导」。
- `perform()` 状态机（冷后台起录不稳定的正解）：
  ```
  后台会话正在录音          → 停止并处理（再按=停止，永远可靠）
  已在录音 或 App 在前台     → 发通知让前台录音页接管
  冷后台首次               → 先试后台录音；失败 → 清 primed 标记 + continueInForeground 开 App
  ```
  用持久化 `audioSessionPrimed` 标记「历史上成功建过会话」。坑：把「当前进程必须 primed」当前置条件太保守，会退化成「一按就开 App」；正解是**永远先试后台、失败才前台**。
- 错误码解读：`AUIOClient_StartIO failed (2003329396)` = FourCC `'what'`，即冷后台起麦克风被拒。FourCC 解码是音频错误排查的第一步。

## 3. 实时 ASR WebSocket 接入

统一抽象：`protocol SpeechTranscribing` + 按设置分发的包装器（Apple Speech / 提供商 A / 提供商 B），错误收敛到单一 error 类型。

**两种协议范式**：
- **OpenAI-Realtime 风格 JSON 事件流**（如通义千问）：Bearer 鉴权 + `OpenAI-Beta: realtime=v1`；握手 `session.created → session.update`（pcm/16k、server_vad、language）→ `session.updated` 后才进收循环；上行 `input_audio_buffer.append` + base64；下行增量 text → completed 段落定稿 → `session.finish` 拿最终稿。拿到最终稿直接保存，**不做二次转写**。
- **自定义二进制帧**（如火山豆包）：多 header 鉴权（App-Key/Access-Key/Resource-Id）；4 字节头（version/msgType/flags/serial/compression）+ 大端长度 + **Gzip 压缩 payload**；时序 fullClientRequest → audioOnly 帧 → 空 payload + lastPacket 收尾。
- 方言/语言能力按接口型号确认（流式与非流式支持面常不同），产品文案不要把「自动识别」包装成「多语种选择」。

**通用音频管线**（所有提供商复用）：`AVAudioConverter` 重采样到 PCM 16kHz/Int16/mono，累积 200ms 再分块发送。

## 4. 后台录音与权限

- 会话配置：`.playAndRecord` + `[.mixWithOthers, .allowBluetoothHFP]`；停止时 `setActive(false)`。
- `Info.plist`：`NSSupportsLiveActivities`、`UIBackgroundModes=[audio]`、麦克风/语音识别 usage 描述。
- 后台只用 `authorizationStatus()` 判断权限，绝不 request；未授权降级为只录音。
- **启动顺序**：先起 `AVAudioEngine` 录音硬件，成功后再挂实时转写；转写不可用不能让录音失败。

## 5. 工程惯例

- XcodeGen 管工程：改 `project.yml` → `xcodegen generate`，绝不手改 pbxproj。
- 跨进程状态（App / Widget 扩展 / Intent）用 UserDefaults 传递（isRecording / pendingAction / audioSessionPrimed）。
- 并发：控制器与 ASR core 用 actor；音频回调 `@unchecked Sendable` + 锁。
- 调试方法论：先拿真机 Console 日志 → FourCC 解码错误码 → `rg` SDK swiftinterface 确认协议边界，不猜；反复翻车后先列 3-5 条修复路径再选最小可靠方案。
