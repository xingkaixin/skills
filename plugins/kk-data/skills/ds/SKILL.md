---
name: ds
description: 使用 ds 命令行完成登录、配置检查，以及 obj、subject、index、iid 数据查询。Use this skill whenever the user wants to use the data-service-cli, asks how to query objects/subjects/indexes/individuals, needs help composing ds filters or output formats, wants to inspect local ds status/config, or needs an agent to run ds commands correctly instead of guessing API details.
---

# DS CLI

使用本技能时，优先通过 `ds` CLI 完成数据查询与状态检查，不要跳过 CLI 直接猜接口 payload，也不要改动业务源码来“验证”命令行为。

## 适用范围

- 用户想登录、检查本地状态、查看当前用户或配置。
- 用户想查询对象数据：`ds obj ...`
- 用户想查询专题数据、专题配置或专题目录：`ds subject ...`
- 用户想查询指标数据、指标配置或指标目录：`ds index ...`
- 用户想按关键词检索标的：`ds iid ...`
- 用户已经给出自然语言需求，需要你帮他选对 `ds` 子命令、参数和输出格式。

如果用户只是要改 CLI 源码、补测试或分析实现链路，这不是本 skill 的主场，应回到仓库代码与文档。

## 工作方式

1. 先确认是否是在“用 CLI 查数据”，再决定是否触发本技能。
2. 先识别任务模式，再选命令：
   - 登录或会话状态：`login` / `logout` / `whoami` / `status`
   - 本地配置：`config list/get/set/init`
   - 对象查数：`obj`
   - 专题目录 / 配置 / 查数：`subject`
   - 指标目录 / 配置 / 查数：`index`
   - 标的检索：`iid search`
3. 在执行查询前，优先检查登录态是否足够：
   - 只要命令会访问远端接口，就默认需要先有可用 token。
   - 如果用户未说明已登录，优先建议或执行 `ds status` / `ds whoami`。
   - 如果报错提示未登录或缺少 token，引导用户先执行 `ds login`。
4. 先判断用户是否已经知道目标 ID：
   - 已知 `subjectId` / `indexId` 时，直接进入 `view` 或查数。
   - 不知道 ID 时，不要臆造 ID；先走 `subject <entity> ls` 或 `index <entity> ls [cat_code]` 做发现，再决定下一步。
   - 如果用户只知道业务名词、不知道具体代码，必要时先用 `iid <entity> search <keyword>` 找标的，再回到 `index` 查数。
5. 组装命令时，优先复用 [references/cli-recipes.md](references/cli-recipes.md) 的模板，不要凭记忆改写参数顺序或分支形态。
6. 返回结果时，明确说明：
   - 实际走的是哪个命令分支
   - 关键参数是什么
   - 输出格式为什么选它
   - 如果失败，失败点在哪一层

## 命令选择规则

### 管理命令

- `ds login`
  - 适用于首次登录、token 失效、`whoami`/查询命令提示未登录。
- `ds logout`
  - 适用于明确要清理本地凭证。
- `ds whoami`
  - 适用于确认当前登录用户是谁。
- `ds status`
  - 适用于查看配置路径、user/token 是否存在，以及近 14 天使用概览。
- `ds config ...`
  - 适用于查看、搜索、初始化或设置本地配置。

### `obj`

- 适用于“查某个对象/数据源的数据”。
- `obj_ref` 既可以是数字 ID，也可以是对象名称。
- 支持 `--where` 或 `--cond` + `--logic` 两种过滤写法。

### `subject`

- `ds subject <subjectId>`
  - 专题查数模式。
- `ds subject view <subjectId>`
  - 专题配置查看模式。
- `ds subject <entity> ls`
  - 专题目录模式，`entity` 只能是 `Stk | Fnd | Bnd | Idx`。

识别规则：

- 如果用户给的是专题 ID，就走查数或 `view`。
- 如果用户要“列专题目录”“看某类标的下有哪些专题”，就走 `<entity> ls`。
- 如果用户只知道“想看某类主题/专题”，但不知道 ID，先用 `<entity> ls` 检索，再从结果里挑目标专题进入 `view` 或查数。
- `subject` 查数和 `view` 当前都只支持数字专题 ID，不要把专题名直接塞进去。

### `index`

- `ds index <indexId> --entity <entity> --iid <id1,id2>`
  - 指标查数模式。
- `ds index <entity> ls [cat_code]`
  - 指标目录模式。
- `ds index <entity> view <indexId1,indexId2>`
  - 指标配置查看模式。

识别规则：

- 用户要“查指标值”，默认走查数模式，且必须补齐 `--entity` 与 `--iid`。
- 用户要“看指标目录/类目”，走 `ls`。
- 用户要“看指标定义/配置”，走 `view`。
- 如果用户不知道 `indexId`，先从 `ls` 开始逐级定位，必要时先 `view` 确认定义，再进入查数。
- 不要把 `ds index Stk` 当成合法完整命令；只有 entity 没有 `ls/view` 时，CLI 会回帮助。

### `iid`

- 当前仅支持 `ds iid <entity> search <keyword>`。
- 适用于“按关键词找标的代码/名称”。
- 当 `index` 查数缺少标的代码，只知道名称时，优先先用 `iid search` 找到可用代码。

## 发现优先的查询策略

- 用户已经给出 `subjectId` / `indexId`
  - 直接查。
- 用户只知道专题/指标的业务含义，不知道 ID
  - 先检索，再查看配置，最后查数。
- 用户连标的代码都不知道
  - 先 `iid search` 找代码，再执行指标查数。

推荐工作流：

1. 明确用户要查的是专题、指标还是标的
2. 判断当前缺的是 `subjectId`、`indexId` 还是标的代码
3. 用对应的发现命令补齐：
   - 专题：`ds subject <entity> ls`
   - 指标：`ds index <entity> ls [cat_code]`
   - 标的：`ds iid <entity> search <keyword>`
4. 需要时再用 `view` 看配置或定义
5. 最后进入真正的查数命令

不要把“发现目标”和“查询目标数据”混成一步；大多数真实场景里，`subject` / `index` 都需要先检索到可用 ID。

## 输出格式选择

- 默认优先 `table`
  - 适合人看、快速核对字段、看中文列头。
- 用 `json`
  - 适合后续给脚本、agent、其他工具继续消费。
- 用 `csv`
  - 适合导出表格，但并非所有分支都支持。

注意：

- `ds subject view` 不支持 `--output csv`
- `ds index view` 不支持 `--output csv`
- `table` 输出会带展示语义：
  - `obj` / `subject` 表格按 metadata 渲染列名
  - `index` 查数表格会优先解析指标配置，显示更友好的列头
- `json/csv` 更接近原始字段，不要把 table 的别名语义当成原始接口字段名

## 查询参数规则

- `--where`
  - 用单个条件直接过滤，可重复传入。
- `--cond` + `--logic`
  - 用于命名条件再组合复杂表达式。
- `--where` 不能与 `--cond/--logic` 同时使用。
- `--select`
  - 逗号分隔字段清单；`table` 输出会按填写顺序展示。
- `--sort`
  - 逗号分隔排序字段；字段前加 `-` 表示降序。
- `--page` / `--size`
  - 分页控制。
- `--search`
  - 全文检索关键词。
- `--raw`
  - 只用于补充原始 JSON 参数，不能覆盖命令本身已经占用的关键字段。

## 高风险边界

- `subject view` 的真实写法是 `ds subject view <subjectId>`，不是 `ds subject <subjectId> view`。
- `index view` 的真实写法是 `ds index <entity> view <ids>`，不是 `ds index view <entity> <ids>`。
- `index` 查数模式缺少 `--entity` 或 `--iid` 会直接失败。
- `subject` 目录模式的 `--refresh` 只用于 `<entity> ls`，不要带到查数或 `view`。
- 当用户需要“保留原始字段名”或“继续喂给脚本”时，不要默认输出 `table`。
- `--raw` 是补充，不是覆盖；如果用户想改命令固有字段，优先改显式参数，不要藏到 `--raw` 里。

## 过滤语法提醒

- 基本格式是 `field op value`
- `String` 一般写成 `'value'`
- `Datetime` 一般写成 `'[2025-03-11]'`
- `in` / `nin` 列表语法示例：`['a','b']` 或 `[1,2]`
- `between` 只用于指标查数中的 `Datetime` 字段

如果用户给的是模糊自然语言条件，先翻译成明确的 `field op value`，再执行。

## 常见执行顺序

1. 检查环境与登录态
2. 判断用户是否已知 ID / 代码
3. 不知道时先走发现命令
4. 选择正确的 `view` 或查数分支
5. 组装过滤、分页、输出参数
6. 执行命令
7. 用简短中文总结结果和下一步建议

## 失败处理

- 未登录或 token 缺失：引导先 `ds login`
- 缺少配置：提示用户用 `ds config get` / `ds config set` / `ds config init` 检查
- 参数组合不合法：指出是哪条约束冲突，不要只回原始报错
- 返回为空：先说明命令本身成功，再提示检查 entity、ID、过滤条件或输出格式

## 参考

- 详细命令模板、示例和错误分流见 [references/cli-recipes.md](references/cli-recipes.md)
- 首轮测试提示见 [evals/evals.json](evals/evals.json)
