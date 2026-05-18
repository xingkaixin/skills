# DS CLI Recipes

这份文件是 `ds` skill 的命令真源，负责承载可复制的模板、示例和排错提示。

## 预检查

优先按这个顺序确认环境：

1. `ds --help`
2. `ds version`
3. `ds status`
4. `ds whoami`

如果查询命令报未登录、缺少 token 或用户不确定当前状态，先执行：

```bash
ds status
ds whoami
```

如果需要重新登录：

```bash
ds login
```

## 管理命令

### 查看状态

```bash
ds status
```

适用：

- 检查配置文件路径
- 检查 user/token 是否存在
- 看近 14 天使用概览

### 查看当前用户

```bash
ds whoami
```

### 配置管理

```bash
ds config list
ds config get base_url
ds config set service.base_url http://localhost:8000
ds config init
```

说明：

- `config get` 是模糊查询，不要求完整 dotted key。
- `config set` 只允许更新已存在的配置键。
- `config init` 只在配置文件不存在时真正创建。

## `obj` 查数

### 最小查询

```bash
ds obj 12345
ds obj SomeObjectName
```

### 带过滤、字段和输出

```bash
ds obj 12345 --where "TRADE_NO == '601377.SH'" --output table
ds obj 12345 --select "TRADE_NO,TRD_DT,CLOSE" --sort "TRD_DT,-CLOSE"
ds obj 12345 --page 1 --size 100 --output json
```

### 复杂逻辑过滤

```bash
ds obj 12345 \
  --cond "secu:TRADE_NO == '601377.SH'" \
  --cond "trd_dt:TRD_DT >= '[2025-03-01]'" \
  --logic "secu and trd_dt"
```

规则：

- `--where` 和 `--cond/--logic` 二选一。
- `obj_ref` 可以是对象 ID，也可以是对象名称。

## `subject` 三种模式

### 1. 专题查数

```bash
ds subject 1000932
ds subject 1000932 --where "TRADE_NO == '601377.SH'" --output json
ds subject 1000932 --select "TRADE_NO,TRD_DT,CLOSE" --sort "TRD_DT"
```

### 2. 专题配置查看

```bash
ds subject view 1000932
ds subject view 1000932 --raw '{"page":1}' --output json
```

规则：

- 不支持 `--output csv`
- `--raw` 不能覆盖 `obj_vw_id` 和 `flag`

### 3. 专题目录

```bash
ds subject Stk ls
ds subject Fnd ls --output json
ds subject Bnd ls --refresh
```

规则：

- `entity` 只能是 `Stk | Fnd | Bnd | Idx`
- `--refresh` 只用于 `ls`
- `ls` 会使用本地子专题缓存；显式 `--refresh` 才强制刷新

真实使用建议：

- 大多数场景下，用户先知道“想找某类专题”，不知道 `subjectId`。
- 这时先执行 `ds subject <entity> ls`，从目录结果里找目标专题。
- 找到候选专题后：
  - 想看定义和字段，用 `ds subject view <subjectId>`
  - 想直接看数据，用 `ds subject <subjectId>`

## `index` 三种模式

### 1. 指标查数

```bash
ds index 92024211 --entity Stk --iid 601377.SH
ds index 92024211 --entity Stk --iid 601377.SH,600999.SH --output json
ds index 92024211 --entity Stk --iid 601377.SH --where "TRD_DT == '[2025-03-04]'"
```

规则：

- 必须提供 `--entity`
- 必须提供 `--iid`
- `--where` 可重复传入

### 2. 指标配置查看

```bash
ds index Stk view 92024211
ds index Stk view 92024211,92024212 --output json
```

规则：

- 不支持 `--output csv`
- 指标 ID 列表使用英文逗号分隔

### 3. 指标目录

```bash
ds index Stk ls
ds index Stk ls 1001
ds index Idx ls 2001 --output csv
```

规则：

- `cat_code` 可省略；省略时走 entity 对应的根目录
- 目录模式的第一个位置参数必须是 entity

真实使用建议：

- 大多数场景下，用户并不知道 `indexId`，只知道要查某类指标。
- 先从 `ds index <entity> ls` 开始，必要时带 `cat_code` 逐级下钻。
- 找到候选指标后：
  - 先用 `ds index <entity> view <indexIds>` 看定义、过滤字段和指标说明
  - 再用 `ds index <indexId> --entity <entity> --iid <codes>` 进入查数

## `iid` 检索

```bash
ds iid Stk search 兴业证券
ds iid Fnd search 中证红利 --output json
ds iid Idx search 沪深300 --output csv
```

规则：

- 当前 action 只支持 `search`
- `keyword` 不能为空白

真实使用建议：

- 当用户只知道“兴业证券”“沪深300”这类名称，不知道具体代码时，先跑 `iid search`
- `index` 查数对 `--iid` 是硬依赖，不要拿名称直接代替代码

## 输出格式建议

### 适合 `table`

- 人工查看结果
- 需要列名更友好
- 需要快速确认筛选是否命中

### 适合 `json`

- 结果要继续喂给 agent、脚本或其他工具
- 需要保留更原始的字段结构

### 适合 `csv`

- 结果要贴给 Excel 或导表工具
- 但 `subject view` / `index view` 不能用

## 发现到查数的完整链路

### 专题

```bash
ds subject Stk ls
ds subject view 1000932
ds subject 1000932 --output table
```

### 指标

```bash
ds iid Stk search 兴业证券
ds index Stk ls
ds index Stk view 92024211
ds index 92024211 --entity Stk --iid 601377.SH --output table
```

## 过滤语法速查

README 里的完整规则矩阵如下，供 skill 内部直接参考：

| 操作符(op)/字段类型 | String | Decimal | Datetime |
| --- | --- | --- | --- |
| `==` / `!=` | `"field op 'value'"` | `"field op value"` | `"field op '[value]'"` |
| `>` / `<` / `>=` / `<=` | `"field op 'value'"` | `"field op value"` | `"field op '[value]'"` |
| `in` / `nin` | `"field op ['value1','value2']"` | `"field op [value1,value2]"` | 不支持 |
| `between` | 不支持 | 不支持 | `"field op ['[value1]','[value2]']"`，仅限指标查数中的 Datetime 字段 |

### 基本比较

```bash
--where "TRADE_NO == '601377.SH'"
--where "CLOSE >= 10.5"
--where "TRD_DT == '[2025-03-11]'"
```

### 列表

```bash
--where "TRADE_NO in ['601377.SH','600999.SH']"
--where "SECU_ID in [1001,1002]"
```

### between

只用于指标查数里的 Datetime 字段：

```bash
--where "TRD_DT between ['[2025-03-01]','[2025-03-11]']"
```

## 自然语言转命令的建议

当用户给的是自然语言需求时，按这个顺序拆解：

1. 先判断要查对象、专题、指标还是标的
2. 再判断是目录、配置还是数据
3. 再补 ID、entity、iid、where、output
4. 最后才执行命令

示例：

- “帮我看股票类专题有哪些”
  - `ds subject Stk ls`
- “我不知道专题 ID，但想先找股票里跟分红相关的专题”
  - 先 `ds subject Stk ls`，再从结果里挑 `subjectId` 继续 `view` 或查数
- “看 1000932 这个专题的配置”
  - `ds subject view 1000932`
- “我不知道指标 ID，想查兴业证券某个财务指标”
  - 先 `ds iid Stk search 兴业证券`，再 `ds index Stk ls` / `view` 找指标，最后查数
- “查 92024211 这个指标，股票 601377.SH 最近一天的值”
  - `ds index 92024211 --entity Stk --iid 601377.SH --where "TRD_DT == '[2025-03-11]'"` 

## 常见报错与处理

### 未登录

典型现象：

- `未登录，请先执行 ds login`
- `当前登录信息缺少 token，请重新执行 ds login`

处理：

```bash
ds login
ds whoami
```

### 参数缺失

典型现象：

- `ds index 查数模式需要 --entity`
- `ds index 查数模式需要 --iid`
- `view 需要提供专题 ID`

处理：

- 回到对应分支的最小合法模板重新组装命令

### 参数冲突

典型现象：

- `--where 与 --cond/--logic 不能同时使用`
- `--raw 不能覆盖 ...`

处理：

- 明确告诉用户是哪两个参数语义冲突
- 保留显式参数，减少 `--raw`

### 输出格式不支持

典型现象：

- `ds subject view 暂不支持 --output csv`
- `ds index view 暂不支持 --output csv`

处理：

- 改成 `table` 或 `json`
