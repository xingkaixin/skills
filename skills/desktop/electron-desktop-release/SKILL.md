---
name: electron-desktop-release
description: Use when packaging, signing, notarizing, or securing an Electron desktop app — electron-vite + electron-builder monorepo setup, macOS Developer ID signing and notarization pitfalls (identity naming, timestamp slowness, Team API keys), CI/local build split, and secret storage architecture (safeStorage/Keychain, main-process-only secrets, SQLite is not a secret store).
---

# Electron 桌面应用打包、签名与安全

Electron 应用（electron-vite 构建 main/preload/renderer + electron-builder 出包）的发布与安全经验。

## 1. 打包结构（pnpm monorepo）

- `apps/desktop`（Electron）+ 其他 app（如浏览器插件）；构建输出（各 app 的 dist）与发布产物（根 `dist/app/mac-arm64`、`dist/ext/chrome-mv3`）分离，按 os/arch 组织。
- scripts：`make`（全部）/ `make:app` / `make:ext` 分层。
- **坑**：pnpm 的 `onlyBuiltDependencies` 白名单会拦住 electron-builder 的原生构建脚本，需显式加入白名单。

## 2. macOS 签名 + 公证（站外分发三件事）

**Developer ID Application 签名 + hardened runtime + notarization staple**，验证链：签名 → notarytool → `stapler staple` → `spctl` / `stapler validate`。

- **ad-hoc 陷阱**：配置里 `mac.identity: '-'` 会绕开 Developer ID；应删掉该项，让 Keychain/CI secret 决定身份，证书名不写进仓库。
- **证书**：CSR 必须在本机 Keychain 生成（私钥留本机）；导入 `.cer` 后配对。「证书没有私钥」通常就是 CSR 不是本机生成的。
- **identity 命名坑**：electron-builder 不接受 `Developer ID Application:` 前缀，要传限定名如 `NAME (TEAMID)`。
- **签名慢是正常的**：对每个 `.pak` 逐个 `codesign --timestamp`，首次要几分钟；不能随意 `signIgnore`（seal 不一致会被 Gatekeeper 拒）。
- **公证凭据**：用 App Store Connect **Team** API Key（Individual key 不支持 notarytool）；放专用 env 文件（chmod 600），不进 shell rc。
- **公证耗时**：`notarytool submit --wait` 是 Apple 服务器侧排队处理，可能等 10 分钟量级，不要中途停。

## 3. CI / 本地混合发布

- CI 时间不够时：Mac 打包（含签名公证）放本地跑，CI 只打其他平台，release 后本地补传 Mac 产物。
- 完整 timestamp + notarization + staple 只在 tag release 跑；普通 CI/开发用 ad-hoc，只验证「能打包、能跑、能找到身份」。

## 4. Secret 存储架构

第一性原则：**SQLite 不是 secret store**（含 WAL 文件都会留明文）。

- 真实 key 交给 OS 凭据设施：Electron `safeStorage`（macOS Keychain / Windows Credential Manager + DPAPI）；SQLite 只存元数据 + `hasApiKey` 布尔引用。
- **主进程独占 secret**：renderer 永不拿到明文 key；用户输入新 key 经 IPC 发 main 保存并立即清空前端态；需要 key 的调用由 main 读取后执行。
- 边界要讲清楚：DPAPI 防「同机他人 / 拿到文件的人」，不防「同用户会话内已运行的恶意进程」。
- 明文迁移：迁入 secure store → 清空原字段 → WAL checkpoint + `VACUUM` 清除残留。
