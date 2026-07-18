---
name: ios-on-device-vision-ml
description: Use when building on-device visual recognition on iOS — camera viewfinder capture, Vision foreground segmentation (VNGenerateForegroundInstanceMaskRequest), color/classification pipelines, CoreML/LiteRT model evaluation on Mac, and synthetic (AI-generated) datasets for indie developers without real data. Covers WYSIWYG crop geometry, per-instance mask selection, evaluation-set design, distillation-based training routes, and model/privacy boundaries.
---

# iOS 端侧视觉识别（相机 → Vision 分割 → 分类/颜色 → 评估迭代）

端侧识别 pipeline 的完整经验：**取景框裁切 → Vision 前景分割 → 单次分割产出三份结果（预览抠图/识别图/落库图）→ 分类 + 主色 + 兜底**。核心原则：同一份主体分割结果贯穿识别与落库，避免偏差源发散。

## 1. 相机取景框：所见即所得是几何问题

- 最常见根因：取景框只是「视觉提示」，拍照链路实际做固定比例中心裁切——**取景框与真实裁切不是同一区域**，背景污染由此而来。
- 正确做法是显式几何映射：原始完整帧尺寸 + preview 实际 bounds + `aspectFill` 反推，保证「取景框看到什么，裁出来就是什么」。不要用 `metadataOutputRectConverted` 这类坐标语义黑盒。
- 捕获链路拆两份：**完整原始帧**（存档，供回看/重裁）+ **取景框裁剪工作帧**（供识别）。不要把裁后图当原图保存。
- 焦段切换按**运行时探测真机能力**实现：绑定后置虚拟多摄（triple→dualWide→dual→wide→ultraWide→telephoto 优先级），读 `constituentDevices` + `virtualDeviceSwitchOverVideoZoomFactors` 推导真实焦段；默认焦段按视角从广到窄排序取最广，不依赖系统数组顺序。

## 2. Vision 前景分割

- `VNGenerateForegroundInstanceMaskRequest`（iOS 16+，零体积）。**不能用 `allInstances`**——床/地板等显著前景会一起保留；正确做法：逐实例生成 mask + 几何评分 + 分类评分，只选中心主实例。
- mask 外扩 1-2px 压边缘漏光。
- 能力边界要诚实：该 API 只擅长主体与背景边界明显的场景；系统相册抠图更强是产品层后处理的结果，公开 API 离成品有工程距离。轻量分割优先于重型模型（SAM 类）。

## 3. 分类与颜色

- 主色识别在**前景 mask 内**做：高阈值筛选 + 中心加权 + 主色分布峰值——不用平均 RGB（对阴影/反光/脏背景太脆弱）。
- 采集区收紧：分析帧取中心 ~86%，入库图取中心 ~72%。
- 重复识别的根因常是「事件边界过早」：改状态机「变化开始 → 重新稳定 → 单次截帧」+ 短时视觉重复抑制。
- 误差标准分层：**exact label / coarse category / color 三种准确率分开统计**；近义细类（短裤↔泳裤）可容错，颜色错误不可接受。提供用户手动修正闭环（细类候选可点选，修正入本地记录表）。

## 4. Mac 上做模型评估

- 准确性评估在 Mac 上即可，端侧性能/体验才需要真机。
- 用**接近 iOS 运行时的格式**评估（CoreML `.mlpackage` / LiteRT `.litertlm`），不要用 Transformers/Safetensors——后者不代表 App 内表现。
- 评估集命名编码标签（`syn_001_tshirt_red_good.png`）+ manifest.csv + 批量评估脚本 + contact sheet 人工抽检；多模型（原始/int8/p4 量化）跑同一回归。
- 先 `du -sh` 核实模型真实体积，不假设压缩状态。
- CLI 单次进程加载不代表 App 常驻引擎的延迟表现。

## 5. 合成数据路线（独立开发者无真实数据）

- **评估集**：合成图只当「边界回归集」（样本少、标签清楚、覆盖弱点）；真实产品指标必须靠真机拍摄验收集。
- **训练集**：可行且性价比最高，定位「补覆盖率」；核心风险是学到生成器自身纹理偏差。策略：**生成图补覆盖率，真实图定方向，现有大模型做蒸馏约束**，控制 synthetic 比例。
- 多样性固定成**标签矩阵**（label × placement × background × lighting × pattern × quality），可复现可扩展。
- 批量生成：先 24-48 张 pilot 验证风格与标签，再走 API 批量（按几百张分块，防单次失败难恢复），输出图片 + manifest.csv。
- 公开数据集的核心矛盾是**分布差异**（电商图 vs 真实使用场景）；可用分割 mask 把前景贴到目标场景背景做域增强。

## 6. 模型迭代路线与隐私边界

- 能力拆成**多个可独立评估的头**（类别/颜色/图案/质量），不压进一个大模型。
- 顺序：固定评估集 + 收集真实错误样本 → 模型压缩 → 蒸馏训练小模型 → 必要时转向可下载端侧 VLM（准确率优先于速度；把慢速识别绑定到低频动作上使其可接受）。
- **模型即可提取资产**：端侧只放粗分类/白名单能力，高价值细粒度能力放云端或独立更新链路。
- 用户数据训练闭环走本地优先：本地记录修正标签，导出前明示字段，图片默认由用户主动选择是否包含。
