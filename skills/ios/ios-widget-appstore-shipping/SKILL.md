---
name: ios-widget-appstore-shipping
description: Use when building WidgetKit extensions or shipping an iOS app to the App Store — App Group data sharing (widgets cannot rely on the main app bundle), timeline/config refresh pitfalls, simulator-vs-device icon debugging, Info.plist encryption exemption (ITSAppUsesNonExemptEncryption in every bundle), TestFlight flow, screenshot rules (no fake status bars), review-rejection root-cause analysis (Kids Category, 2.3.10, 5.1.1 BYOK disclosure), and localization via system settings.
---

# iOS Widget 开发与 App Store 上架

WidgetKit 扩展的数据共享/刷新经验 + 完整上架 checklist（含真实被拒案例的根因）。

## 1. Widget 与主 App 的数据共享

**根本约束**：Widget Extension 是独立 bundle，**不能把主 App bundle 当自己的资源目录读**——典型症状是「App 内预览能找到数据、真实桌面 widget 找不到」（资源 target 归属不一致）。

标准方案（**App Group 共享单份**，不要两个 target 各打包一份）：
1. App 与 Widget 配同一个 App Group entitlement（group id 完全一致）。
2. App 首启/onboarding 时把数据从 bundle 复制到 App Group container；Widget 只从 container 读，读不到时显示「请打开 App 完成初始化」占位（与 onboarding 动线契合）。
3. App Group container 是**持久化磁盘存储**：首次复制成功后重启手机不需重新打开 App；只有卸载、数据版本更新、复制中断三种情况需要重新复制。
4. 大数据不要整包压缩（牺牲随机访问）；用面向访问模式的紧凑二进制格式（如半字节打包），并把「共享方案」与「数据格式」拆成两个独立目标分别验证。

## 2. 尺寸、刷新与亮暗

- small/medium/large 分开渲染；App 内预览必须固定成真实 small 比例，不能撑满页宽。
- 固定列数不能只调 columns，要给足横向内容宽度，否则 SwiftUI 压缩截断。卡片背景用 `.containerBackground(.fill.tertiary, for: .widget)`。
- **「改设置 widget 不变」两层根因**：(a) 配置项若是 AppIntent widget 配置（每个已放置 widget 独立持有），App 内设置改了不影响桌面既有 widget；(b) 桌面 widget 有 timeline 缓存，需长按编辑或移除重加强制刷新。
- Widget 的 Info.plist 太极简会在 **AppIntents 训练阶段**报 `Unable to parse Info.plist`——补齐 `CFBundleIdentifier/CFBundleExecutable/CFBundlePackageType` 等标准键。
- 亮暗分两个独立策略：App 界面跟随系统；Widget 视觉主题固定，不随亮暗大面积重排。

## 3. 「模拟器好、真机坏」排查

- 立刻切真机 destination 构建，检查 `Debug-iphoneos` 产物；**模拟器产物不能推断真机**（thinning 结果不同，如模拟器 @2x、真机 @3x）。
- 常用命令：`xcrun assetutil --info Assets.car`、`plutil -p`、`sips -g hasAlpha`、`PlistBuddy -c 'Print :CFBundleIcons'`。
- 真实案例结论：桌面图标只在开/退 App 闪现 1 秒——一路「合理假设」（缺 @3x、Dark/Tinted 变体、Liquid Glass .icon）逐个被最小实验证伪，**真正根因是 SpringBoard 图标缓存卡死，重启手机即恢复**。教训：靠读产物 + 最小实验逐层证伪，不靠假设堆叠。
- 上传后 ASC 页面图标占位：若归档包内图标正常，通常是 Apple 侧缓存未刷新，不阻塞 TestFlight。

## 4. 上架 checklist

- **版本号**：UI 显示从 bundle 读 `CFBundleShortVersionString`，不硬编码。
- **加密豁免**：`ITSAppUsesNonExemptEncryption = false`，**主 App 和每个 Extension 的 Info.plist 都要加**（每个 bundle 独立扫描）。HTTPS/WSS 属可豁免的标准加密；但 ASC 手动回答时不要选「完全不使用加密」。
- **TestFlight**：内部（≤100 ASC 用户）→ 外部（≤10000，首个 build 需过 Beta App Review）。Archive 时 destination 必须是 Any iOS Device/真机；CI 构建成功 ≠ 自动上 TF，首次建议手动 Archive 跑通证书/合规。地区控制在 Pricing and Availability。
- **截图**：1242×2688 或 1284×2778 PNG，按语言分目录；可包装但不画不存在的功能；用户真实内容必须脱敏替换为虚构示例；不暴露第三方服务商品牌；**绝不放非 iOS 状态栏（假状态栏）——真实被拒条款 2.3.10**。
- **Review Notes（BYOK 类应用范式）**：讲清「默认审核路径零配置可跑通」（无需账号/key）与「BYOK 边界」（第三方服务默认关闭、仅用户手动启用+自有凭证、凭证本地存储）。

## 5. 审核被拒的根因分析方法

先把拒绝原因拆三类：**改代码 / 改 ASC 元数据 / 改隐私政策**，并精读 Apple 原文措辞，不凭印象误判。真实案例：
- **1.3 Kids Category**：真因是勾选了 Kids Category。4+ 年龄分级 ≠ Kids Category，取消勾选即可（分级问卷结果可保留）。
- **2.3.10**：真因是截图里的假状态栏，不是第三方品牌。
- **5.1.1**：Apple 原文 "revise the **app**" 意味着**仅改隐私政策不够**——必须在 App 内、把数据发给第三方 AI 之前做清晰披露+授权弹窗（说明发送什么、发给谁，允许后才启用；系统能力不弹）。

## 6. 本地化与其他

- 用 String Catalog（`.xcstrings`）；**App 内切换语言 = 跳系统设置**（`openSettingsURLString`），不做 App 内语言覆盖——避免 App / Widget / AppIntent 三处语言规则分裂。
- Widget 配置文案用 `LocalizedStringResource` / `DisplayRepresentation` 本地化。
- 反复不生效的低价值功能（如 App 内亮暗切换）果断砍入口改为跟随系统，不无限投入。
- CarPlay：Audio category 一般不允许录音；录音例外仅 navigation 与 voice-based conversational（且限 voice control template）。「已过 CarPlay Audio 审批 ≠ 允许录音」；拿 Case-ID 向 Apple 追问明确 category。
- 嵌套 git 仓库：子目录自带 `.git` 会成为嵌套边界，`git add` 无效；需移除嵌套 .git 元数据才能纳入父仓库。
