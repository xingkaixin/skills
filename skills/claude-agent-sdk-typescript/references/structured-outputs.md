# 结构化输出

从 agent 工作流返回验证后的 JSON。

## 为什么使用结构化输出？

Agents 默认返回自由格式文本，适用于聊天但不适合需要程序化使用输出的场景。结构化输出提供可以直接传递到应用逻辑、数据库或 UI 组件的类型化数据。

## 快速开始

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const schema = {
  type: "object",
  properties: {
    company_name: { type: "string" },
    founded_year: { type: "number" },
    headquarters: { type: "string" }
  },
  required: ["company_name"]
};

for await (const message of query({
  prompt: "Research Anthropic and provide key company information",
  options: {
    outputFormat: { type: "json_schema", schema }
  }
})) {
  if (message.type === "result" && message.structured_output) {
    console.log(message.structured_output);
    // { company_name: "Anthropic", founded_year: 2021, headquarters: "San Francisco" }
  }
}
```

## 使用 Zod 实现类型安全

使用 Zod 定义 schema 以获得完全类型化的结果：

```typescript
import { z } from "zod";
import { query } from "@anthropic-ai/claude-agent-sdk";

const FeaturePlan = z.object({
  feature_name: z.string(),
  summary: z.string(),
  steps: z.array(z.object({
    step_number: z.number(),
    description: z.string(),
    estimated_complexity: z.enum(["low", "medium", "high"])
  })),
  risks: z.array(z.string())
});

type FeaturePlan = z.infer<typeof FeaturePlan>;

for await (const message of query({
  prompt: "Plan how to add dark mode support to a React app",
  options: {
    outputFormat: {
      type: "json_schema",
      schema: z.toJSONSchema(FeaturePlan)
    }
  }
})) {
  if (message.type === "result" && message.structured_output) {
    // 验证并获取完全类型化的结果
    const parsed = FeaturePlan.safeParse(message.structured_output);
    if (parsed.success) {
      const plan: FeaturePlan = parsed.data;
      console.log(`Feature: ${plan.feature_name}`);
      console.log(`Summary: ${plan.summary}`);
      plan.steps.forEach(step => {
        console.log(`${step.step_number}. [${step.estimated_complexity}] ${step.description}`);
      });
    }
  }
}
```

### Zod 的好处

- TypeScript 中的完全类型推断
- 使用 `safeParse()` 进行运行时验证
- 更好的错误消息
- 可组合、可重用的 schemas

## 输出格式配置

`outputFormat` 选项接受一个对象：

- `type`: 设置为 `"json_schema"` 用于结构化输出
- `schema`: 定义输出结构的 [JSON Schema](https://json-schema.org/) 对象

SDK 支持标准 JSON Schema 功能，包括所有基本类型、枚举、常量、必需字段、嵌套对象等。

## 示例：TODO 跟踪 Agent

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const todoSchema = {
  type: "object",
  properties: {
    todos: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          file: { type: "string" },
          line: { type: "number" },
          author: { type: "string" },
          date: { type: "string" }
        },
        required: ["text", "file", "line"]
      }
    },
    total_count: { type: "number" }
  },
  required: ["todos", "total_count"]
};

for await (const message of query({
  prompt: "Find all TODO comments in this codebase and identify who added them",
  options: {
    outputFormat: { type: "json_schema", schema: todoSchema }
  }
})) {
  if (message.type === "result" && message.structured_output) {
    const data = message.structured_output;
    console.log(`Found ${data.total_count} TODOs`);
    data.todos.forEach(todo => {
      console.log(`${todo.file}:${todo.line} - ${todo.text}`);
      if (todo.author) {
        console.log(`  Added by ${todo.author} on ${todo.date}`);
      }
    });
  }
}
```

## 错误处理

```typescript
for await (const msg of query({
  prompt: "Extract contact info from the document",
  options: {
    outputFormat: { type: "json_schema", schema: contactSchema }
  }
})) {
  if (msg.type === "result") {
    if (msg.subtype === "success" && msg.structured_output) {
      // 使用验证后的输出
      console.log(msg.structured_output);
    } else if (msg.subtype === "error_max_structured_output_retries") {
      // 处理失败
      console.error("Could not produce valid output");
    }
  }
}
```

### 错误子类型

| 子类型 | 含义 |
|--------|------|
| `success` | 输出成功生成和验证 |
| `error_max_structured_output_retries` | Agent 多次尝试后无法生成有效输出 |

### 避免错误的技巧

- **保持 schemas 聚焦**：深嵌套 schemas 和许多必需字段更难满足
- **匹配 schema 和任务**：如果任务可能没有 schema 要求的所有信息，让这些字段可选
- **使用清晰的 prompts**：模糊的 prompts 使 agent 更难知道要生成什么输出
