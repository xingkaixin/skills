---
name: git-commit-message
description: Use when writing or reviewing a git commit message, drafting commit text before running git commit, or splitting work into commits. Enforces the seven-rule convention (subject/body separation, 50-char imperative subject, 72-char body wrap, explain what/why not how) with concrete good/bad examples.
---

# Git Commit Message

写 commit message 时遵循本规范。一条好的 commit message 传达的是 diff 无法表达的 **context**——diff 说明改了「什么」，只有 message 能说清「为什么」。

## 核心心智

- diff 回答 *what changed*；commit message 回答 *why*。把精力放在解释原因上。
- 未来读这条 message 的人可能是几个月后的你自己。为「重建上下文」省下的时间就是它的价值。
- 一条 commit 只做一件逻辑上内聚的事（atomic commit）。如果 subject 难以在 50 字符内概括，通常说明这次改动塞了太多东西，应拆分。

## 七条规则

1. **Subject 与 body 用空行分隔。** 简单改动可只有 subject。一旦需要 body，subject 与 body 之间必须留一个空行，否则 `git log`、`shortlog`、`rebase` 等会解析错乱。
2. **Subject 控制在 50 字符左右。** 50 是经验值不是硬限，72 是硬上限（GitHub 超过会截断）。逼自己用最凝练的方式概括。
3. **Subject 首字母大写。**（英文 message；中文项目按团队既有惯例，保持一致即可。）
4. **Subject 结尾不加句号。** 标点浪费宝贵的字符空间。
5. **Subject 用祈使语气（imperative mood）。** 像下命令一样写：`Add`、`Fix`、`Remove`、`Refactor`，而非 `Added` / `Fixes` / `Changing`。
6. **Body 每行折到 72 字符。** git 不会自动换行，需手动折行，给缩进留出余量、整体控制在 80 以内。
7. **Body 说明 what 和 why，而非 how。** 代码本身已经说明了 how。重点讲：改动前是怎样的、哪里有问题、现在怎样、为什么这样解决。副作用和不直观的后果也在这里交代。

## 祈使语气自检

subject 必须能填入这个句子并读通：

> If applied, this commit will **______**

- ✅ *If applied, this commit will* **refactor subsystem X for readability**
- ✅ *If applied, this commit will* **remove deprecated methods**
- ❌ *If applied, this commit will* ~~fixed bug with Y~~
- ❌ *If applied, this commit will* ~~changing behavior of X~~
- ❌ *If applied, this commit will* ~~more fixes for broken stuff~~（这是在描述内容，不是命令）

## 模板

```
Summarize change in around 50 chars, imperative mood

Explain the problem this commit solves. Focus on why, not how
(the code shows how). Describe how things worked before and what
was wrong with that. Wrap body lines at 72 characters.

Are there side effects or unintuitive consequences? Explain them
here.

 - Bullet points are okay
 - Use a hyphen or asterisk with a space, blank lines between

Resolves: #123
See also: #456, #789
```

单行足够时直接：

```
$ git commit -m "Fix typo in introduction to user guide"
```

## 好坏对照

坏（长度形式各异、指向不清、堆细节）：

```
fixed two build-breaking issues: + reverted ClassMetadata... + eliminated ...
Tweaks to package-info.java files
polishing
More fixes for broken stuff
```

好（简洁一致、祈使语气、可独立阅读）：

```
Fix failing CompositePropertySourceTests
Rework @PropertySource early parsing logic
Add tests for ImportSelector meta-data
Simplify serialize.h's exception handling
```

带 body 的范例（讲清 why，不讲 how）：

```
Simplify serialize.h's exception handling

Remove the 'state' and 'exceptmask' from serialize.h's stream
implementations, as well as related methods.

As exceptmask always included 'failbit', and setstate was always
called with bits = failbit, all it did was immediately raise an
exception. Get rid of those variables, and replace the setstate
with direct exception throwing (which also removes some dead code).
```

## 执行清单

生成或审查 commit message 时逐条检查：

- [ ] subject 与 body 之间有空行（若有 body）
- [ ] subject ≤ 50 字符（绝不超过 72）
- [ ] subject 首字母大写、结尾无句号
- [ ] subject 是祈使语气，能通过 "If applied, this commit will…" 测试
- [ ] body 每行 ≤ 72 字符
- [ ] body 解释了 why 与 what，没有复述代码已能表达的 how
- [ ] 这是一次 atomic 改动；若 subject 难以概括，考虑拆分 commit
- [ ] issue / PR 引用放在 body 末尾（`Resolves: #123`）

## 边界

- Metadata（issue ID、PR 号）统一放 body 底部。
- 项目已有既定惯例（如 Conventional Commits 的 `feat:` / `fix:` 前缀、语言选择）时，服从项目惯例；本规范约束的是那之下的结构与表达质量。
