## 确认标的

```bash
ds iid Stk search "国元证券" --output csv
```

## 公司基本信息

获取：法人代表、公司名称、行业分类、注册资本、注册地址、上市日期、成立日期、公司网址

```bash
ds subject  1000933 --where "TRADE_NO == '000728.SZ'" --output csv
```

##  实控人
```bash
ds subject 1000998  --where "TRADE_NO == '000728.SZ'" --output csv
```

## 高管薪酬

```bash
ds subject  1001034 --where "TRADE_NO == '000728.SZ'" --sort "-END_DT" --output csv
```


## 股本数据


```bash
ds subject 1000987 --where "TRADE_NO == '000728.SZ'"  --sort "-END_DT" --output csv
```

## 解禁股数据
查询当前日期后，最近的一条解禁，如果存在的话
```bash
ds subject 1001006 --where "TRADE_NO == '000728.SZ'" --where "LIST_DT >= '[2026-03-11]'"  --sort "LIST_DT" --page 1 --size 1  --output csv
```


## 股东数据
###  十大股东

```bash
ds subject 1000991 --where "TRADE_NO == '000728.SZ'"  --sort "-END_DT" --output csv
```


### 十大流通股东

```bash
ds subject 1000996 --where "TRADE_NO == '000728.SZ'"  --sort "-END_DT" --output csv
```

### 股东户数明细、大股东持股比例

```bash
ds subject 1000183 --where "TRADE_NO == '000728.SZ'"  --sort "-END_DT" --output csv
```

```bash
ds subject 1000989 --where "TRADE_NO == '000728.SZ'"  --sort "-END_DT" --output csv
```

## 分红

需要获取全部分红数据
```bash
ds subject 1000978 --where "TRADE_NO == '000728.SZ'"  --sort "-END_DT" --output csv
```


## 财务指标

### 最近五年，年度报告

#### 资产负债表
```bash
ds subject 1000964 --where  "TRADE_NO == '000728.SZ'" --where "RPT_TYPE_DESC == '年度报表'" --sort "-END_DT" --page 1 --size 5 --output csv
```

#### 利润表
```bash
ds subject 1000965 --where  "TRADE_NO == '000728.SZ'" --where "RPT_TYPE_DESC == '年度报表'" --sort "-END_DT" --page 1  --size 5 --output csv
```

#### 现金流量表
```bash
ds subject 1000966 --where  "TRADE_NO == '000728.SZ'" --where "RPT_TYPE_DESC == '年度报表'" --sort "-END_DT" --page 1 --size 5 --output csv
```

### 最近5个单季度数据

#### 资产负债表不提供数据

#### 利润表单季度
```bash
ds subject 1000970 --where  "TRADE_NO == '000728.SZ'"  --sort "-END_DT" --page 1  --size 5 --output csv
```

#### 现金流量表
```bash
ds subject 1000971 --where  "TRADE_NO == '000728.SZ'"  --sort "-END_DT" --page 1  --size 5 --output csv
```



## 主营行业构成，获取最新一个报告期的数据
```bash
ds subject 1000961 --where  "TRADE_NO == '000728.SZ'"  --sort "-END_DT" --page 1  --size 20 --output csv
```


## 一致评级
如果有这块数据就呈现，没有就不需要

### 一致评级大幅调高
```bash
ds subject 1001348 --where "SECU_ID == '002736.SZ'" --output csv
```

### 一致评级不断调高
```bash
ds subject 1001352 --where "SECU_ID == '002736.SZ'" --output csv
```

### 一致评级大幅降低
```bash
ds subject 1001351 --where "SECU_ID == '002736.SZ'" --output csv
```

### 一致评级不断调低
```bash
ds subject 1001353 --where "SECU_ID == '002736.SZ'" --output csv
```
