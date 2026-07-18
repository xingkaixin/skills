---
name: error-message-writing
description: Use when writing, reviewing, or suggesting an error message, toast, failure state, or empty/exception copy in any product, UI, or code. Applies the four anti-patterns to avoid and five principles to follow, distinguishes generic vs. unclear failures, and scores each message against a nine-point checklist.
---

# Error Message Writing

写或审查错误消息时遵循本规范。核心：出错的一刻是「关怀」的时刻，不是「打扫」的时刻。

## 核心心智

出错时用户想知道三件事，好的错误消息尽量都回答：

1. **What happened?**（发生了什么）
2. **Why did it happen?**（为什么）
3. **How can I fix it?**（怎么解决）

一句泛泛的 "Something went wrong" 三个都没答，用户被晾在原地——被晾住的用户 = 沮丧且不再信任的用户。像跟朋友说话一样写。

## 四个反模式（要避免）

1. **语气不当（inappropriate tone）** — 在高风险失败时用俏皮、轻佻、过度随意的口吻。想象医生手术中说 "Oops!"。当用户的工作、金钱、数据受影响时，语气要匹配严肃程度。
2. **技术黑话（technical jargon）** — "Couldn't fetch data"、"Credentials denied"、"Null reference exception" 对普通用户毫无意义。用平实语言说清出了什么事、该做什么，别把 stack trace 甩给用户。
3. **推卸责任（passing the blame）** — 既不要羞辱用户（"You entered the wrong…"），也不要甩锅第三方（"Stripe isn't responding"）。聚焦*问题*本身，而非*谁的错*。
   - ✅ 可接受："We're having trouble connecting to Stripe."
   - ❌ 不可接受："Stripe isn't responding right now."
4. **无谓的泛化（generic for no reason）** — 有时原因确实未知，但很多时候系统*知道*发生了什么，消息却不说。隐瞒已知信息是对用户最大的失职。

反面范本（一句话踩满四条）：

> **Whoops! Something went wrong**（语气不当）
> The third-party you're trying to connect to isn't responding,（推卸责任）so we can't fetch your data.（技术黑话）Try again later.（泛化）

## 五个原则（要遵循）

1. **说清 what 和 why** — 明确说出发生/没发生什么。解释原因，哪怕唯一诚实的解释是「我们这边的技术问题」。空间允许时用 "an issue on our end" 强调不是用户的错。
2. **提供安慰（reassurance）** — 告诉用户什么*没*受影响：草稿还在吗？付款安全吗？上传部分成功了吗？安慰能防止恐慌，避免用户重做本不必重做的工作。
3. **有同理心（empathetic）** — 别过度道歉，也别冷冰冰。情况严重、或用户自己无能为力时，适当用 "please"。同理心是一种语气，不是一句套话。
4. **帮他解决（help them fix it）** — 有出路就说清楚，具体、可操作、即时："Check your connection and try again."、"Upload a file under 10MB."。空间不够就给描述性链接（"Learn how to resolve this"），绝不用光秃秃的 "Click here"。
5. **永远给出路（give a way out）** — 用户自己修不了、或错误可能反复出现时，给一条通往客服或明确下一步的路。绝不把用户留在死胡同。

正面范本（对应五原则）：

> **Unable to connect your account**（说清 what）
> Your changes were saved,（安慰）but we could not connect your account due to a technical issue on our end.（说清 why）Please try connecting again.（帮他解决）If the issue keeps happening, **contact Customer Care.**（给出路）

## Generic vs. Unclear：两种不同的失败

都是坏消息，但病因和疗法不同，别混为一谈：

| | Generic（泛化） | Unclear（含糊不清） |
| --- | --- | --- |
| 例子 | "Something went wrong and this action could not be completed." | "Make sure you allow the requested permissions and try again." |
| 毛病 | 什么都没说 | 试图解释，但用了让人费解的语言 |
| 用户感受 | 被晾住 | 困惑、被指责、被 gaslight |
| 疗法 | **不是**把它写得更长，而是查清到底出了什么错、把*那个*说出来 | 用**用户的词汇**重写，而非系统的词汇 |

## 执行清单（九点评分）

写或审查一条错误消息时逐条走：

- [ ] 用平实语言说清了 **what** 发生了？
- [ ] 说清了 **why**（或诚实承认是系统问题）？
- [ ] 避开了非开发者看不懂的技术黑话？
- [ ] 没有指责用户或第三方？
- [ ] 安慰了用户什么还是安全的（草稿、数据、付款）？
- [ ] 告诉了用户下一步该做什么？
- [ ] 若用户修不了，给了出路（客服、重试、替代路径）？
- [ ] 语气匹配风险——该严肃处严肃，该温暖处温暖？
- [ ] 是针对*这个*具体失败写的，还是图省事复用了泛化消息？

**若三条或以上为「否」，这条消息还不能上线。**

## 关于复用

- 一条泛化消息作为某个*罕见* edge case 的 fallback，合理。
- 同一条泛化消息被复用到几十个不同的失败场景，这是*流程*问题，不是文案问题。
- 当发现同一条泛化消息被套用到多个具体场景时，正确反应是去问「底层到底发生了什么」，而不是把这条泛化消息润色得更好听。

## 更深一层：这是团队工程

泛化错误往往是开发和产品流程的症状，不只是写作问题。当有人要求「这里放个 generic error」时，反问：*用户为什么会看到这个？后台到底发生了什么？* 答案常常直接解锁一条更好的消息。新产品上线时用泛化 fallback 可以接受——前提是有流程在上线一个月后回头复审它们。
