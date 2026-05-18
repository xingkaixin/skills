# Cover Image Prompt Generator

本 skill 用于根据文章内容，生成高质量的封面图像提示词（prompt）。它不直接生成图像，而是输出一份结构化的提示词文件，供下游图像生成工具使用。

## 处理链路

```
输入（文章路径或内容）
  │
  ▼
Step 0: 加载偏好配置
  │  检查 EXTEND.md（项目级 → 用户级）
  │  未找到则运行首次配置向导
  │
  ▼
Step 1: 分析内容
  │  • 保存参考图片（如有）到 refs/
  │  • 分析文章：主题、语气、关键词、视觉隐喻
  │  • 深度分析参考图：提取颜色(hex)、布局、字体等具体元素
  │  • 自动检测语言
  │  • 确定输出目录
  │  • 根据 auto-selection 规则自动推荐各维度值
  │
  ▼
Step 2: 确认维度（可跳过）
  │  交互式确认 6 个设计维度：
  │  Type / Palette / Rendering / Text / Mood / Font
  │  --quick 模式下跳过，使用自动推荐值
  │
  ▼
Step 3: 生成提示词
  │  组装完整提示词，保存到 prompts/cover.md
  │  包含：YAML frontmatter、内容上下文、维度设定、
  │        文字元素、情绪/字体规则、构图指引、水印、参考图指令
  │
  ▼
Step 4: 完成报告
     输出维度摘要、文件位置、输出清单
```

## 输入

- **文章内容**：markdown 文件路径，或直接粘贴内容
- **CLI 参数**（可选）：`--type`、`--palette`、`--rendering`、`--style`、`--text`、`--mood`、`--font`、`--aspect`、`--lang`、`--no-title`、`--quick`、`--ref`
- **参考图片**（可选）：用于风格/构图参考的图片文件

## 输出

```
<output-dir>/
├── source-{slug}.{ext}    # 源文章副本
├── refs/                  # 参考图片及其描述文件（如有）
│   ├── ref-01-{slug}.{ext}
│   └── ref-01-{slug}.md
└── prompts/cover.md       # 生成的提示词文件
```

提示词文件 `prompts/cover.md` 包含完整的图像生成指令，可直接传递给图像生成工具。

## 六个设计维度

| 维度 | 可选值 | 默认 |
|------|--------|------|
| **Type** | hero, conceptual, typography, metaphor, scene, minimal | 自动 |
| **Palette** | warm, elegant, cool, dark, earth, vivid, pastel, mono, retro, duotone | 自动 |
| **Rendering** | flat-vector, hand-drawn, painterly, digital, pixel, chalk, screen-print | 自动 |
| **Text** | none, title-only, title-subtitle, text-rich | title-only |
| **Mood** | subtle, balanced, bold | balanced |
| **Font** | clean, handwritten, serif, display | clean |

## References 目录结构

```
references/
├── auto-selection.md          # 内容信号 → 维度值的自动选择规则
├── base-prompt.md             # 通用基础提示词模板
├── compatibility.md           # 维度间兼容性矩阵
├── style-presets.md           # 24 种风格预设（palette + rendering 组合）
├── types.md                   # 6 种封面类型定义及构图指南
├── visual-elements.md         # 按主题分类的图标/符号词汇表
├── config/
│   ├── first-time-setup.md    # 首次配置向导流程
│   ├── preferences-schema.md  # EXTEND.md YAML schema
│   └── watermark-guide.md     # 水印定位与集成指南
├── dimensions/
│   ├── font.md                # 4 种字体风格详解
│   ├── mood.md                # 3 种情绪级别详解
│   └── text.md                # 4 种文字密度级别详解
├── palettes/                  # 10 个色彩方案（hex 值、装饰提示、适用场景）
│   ├── cool.md / dark.md / duotone.md / earth.md / elegant.md
│   ├── mono.md / pastel.md / retro.md / vivid.md / warm.md
├── renderings/                # 7 种渲染风格（线条、纹理、深度、元素、排版）
│   ├── chalk.md / digital.md / flat-vector.md / hand-drawn.md
│   └── painterly.md / pixel.md / screen-print.md
└── workflow/
    ├── confirm-options.md     # Step 2 交互确认的详细格式
    ├── prompt-template.md     # Step 3 提示词模板
    └── reference-images.md    # 参考图处理流程
```
