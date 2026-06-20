# TasteOS 真实 API 接入方案

## 1. 真实 API 接入是什么

当前 MVP 的 `src/tasteEngine.js` 是 mock analysis：它根据案例标题、分类和用户备注生成结构化视觉分析，用来跑通产品闭环。

真实 API 接入不是把 AI 聊天窗口嵌进产品里，而是把这一步替换成真正的多模态图像理解：

```text
用户上传/保存参考图
-> 前端发送 imageUrl/base64 + 案例元数据
-> 后端 /api/analyze-reference 调用 OpenAI Responses API
-> 模型读取图片并返回严格 JSON
-> 前端继续使用现有 Taste Profile / Prompt Studio / Feedback 流程
```

核心目标：让系统真的“看图”，但输出仍然保持产品可控的数据结构。

## 2. 为什么不能直接在前端调 API

不要把 `OPENAI_API_KEY` 放进浏览器代码。原因很简单：

- 前端代码会暴露给用户，密钥容易被复制。
- 无法可靠限制调用成本和频率。
- 无法统一做图片压缩、缓存、错误兜底和日志。
- 后续如果要上线，安全结构会被面试官追问。

正确方式是：前端只调用自己的后端接口，后端再调用 OpenAI。

## 3. 推荐接口设计

### POST `/api/analyze-reference`

请求：

```json
{
  "title": "AI Workshop Poster",
  "category": "event_poster",
  "userNote": "喜欢它的大标题、强对比和科技感",
  "imageUrl": "https://example.com/poster.jpg",
  "imageBase64": null
}
```

说明：

- `imageUrl` 和 `imageBase64` 二选一。
- 如果是本地上传图片，前端可以先转成 `data:image/jpeg;base64,...`，或上传到对象存储后传 URL。
- `category` 沿用现有分类：`event_poster`、`social_cover`、`portfolio_cover`。

响应：

```json
{
  "analysis": {
    "id": "analysis-ref-001",
    "referenceId": "ref-001",
    "composition": "主标题占据第一视觉层级，主体图形集中，留白用于承载时间和地点信息。",
    "colorPalette": ["#111827", "#e95034", "#fef3c7"],
    "colorDescription": "深色背景搭配高饱和强调色，适合制造活动传播的视觉冲击。",
    "typography": "适合使用粗体无衬线标题字，辅助信息保持小字号但高对比。",
    "informationHierarchy": "标题、主视觉、行动信息形成三层结构，阅读路径清晰。",
    "moodTags": ["现代", "直接", "有冲击力"],
    "styleTags": ["大标题", "高对比", "几何构图"],
    "usageScenario": "活动海报",
    "reusablePatterns": ["大标题优先", "单一视觉焦点", "少量强调色"],
    "avoidPatterns": ["文字不可读", "信息过密", "装饰过多"]
  }
}
```

## 4. VisualAnalysis JSON Schema

这个 Schema 对齐现有 `tasteEngine.js` 的返回结构。真实模型只负责填充这些字段，不直接决定后续产品逻辑。

```json
{
  "name": "tasteos_visual_analysis",
  "schema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "composition": { "type": "string" },
      "colorPalette": {
        "type": "array",
        "items": { "type": "string" },
        "minItems": 3,
        "maxItems": 6
      },
      "colorDescription": { "type": "string" },
      "typography": { "type": "string" },
      "informationHierarchy": { "type": "string" },
      "moodTags": {
        "type": "array",
        "items": { "type": "string" },
        "minItems": 2,
        "maxItems": 8
      },
      "styleTags": {
        "type": "array",
        "items": { "type": "string" },
        "minItems": 2,
        "maxItems": 8
      },
      "usageScenario": { "type": "string" },
      "reusablePatterns": {
        "type": "array",
        "items": { "type": "string" },
        "minItems": 2,
        "maxItems": 8
      },
      "avoidPatterns": {
        "type": "array",
        "items": { "type": "string" },
        "minItems": 2,
        "maxItems": 8
      }
    },
    "required": [
      "composition",
      "colorPalette",
      "colorDescription",
      "typography",
      "informationHierarchy",
      "moodTags",
      "styleTags",
      "usageScenario",
      "reusablePatterns",
      "avoidPatterns"
    ]
  },
  "strict": true
}
```

## 5. 后端伪代码

下面是 Node 服务端的方向示例。实际工程里可以用 Express、Fastify、Next.js API Route 或任何轻量后端。

```js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const model = process.env.OPENAI_MODEL;

export async function analyzeReferenceWithApi(reference) {
  const imageInput = reference.imageBase64 || reference.imageUrl;

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              "你是 TasteOS 的视觉分析引擎。",
              "请分析这张平面设计/海报参考图。",
              "不要评价好坏，只提取可复用的视觉偏好。",
              `标题：${reference.title}`,
              `分类：${reference.category}`,
              `用户备注：${reference.userNote || "无"}`
            ].join("\n")
          },
          {
            type: "input_image",
            image_url: imageInput,
            detail: "auto"
          }
        ]
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "tasteos_visual_analysis",
        strict: true,
        schema: visualAnalysisSchema
      }
    }
  });

  const analysis = JSON.parse(response.output_text);

  return {
    id: `analysis-${reference.id}`,
    referenceId: reference.id,
    ...analysis
  };
}
```

模型名称以官方文档当前推荐的支持视觉输入的模型为准。真正落地时建议把模型名放进环境变量，而不是硬编码在业务代码里：

```text
OPENAI_MODEL=<current-vision-capable-model>
```

## 6. 前端改造方式

不要大改现有产品。保留 `tasteEngine.js` 的领域接口，新增一层 provider。

```js
export async function generateAnalysis(reference, options = {}) {
  if (options.mode === "api") {
    return analyzeReferenceWithApi(reference);
  }

  return generateMockAnalysis(reference);
}
```

推荐迁移步骤：

1. 把当前 `generateAnalysis` 重命名为 `generateMockAnalysis`。
2. 新增 `src/apiClient.js`，封装 `POST /api/analyze-reference`。
3. 增加 `analysisMode = "mock" | "api"` 配置。
4. API 成功时使用真实分析结果。
5. API 失败时回退 mock，并在 UI 上提示“已使用离线分析”。
6. 对返回 JSON 做字段校验，避免模型输出污染后续流程。

## 7. 错误处理与产品体验

必须处理这些情况：

- 图片太大：前端压缩到合理尺寸后再上传。
- 图片格式不支持：限制 jpg/png/webp。
- API 超时：展示“分析失败，可重试”，保留用户已填信息。
- JSON 不合法：后端丢弃结果并返回标准错误。
- 额度或频率限制：提示稍后再试，不要让页面卡死。
- 同一图片重复分析：用图片 hash 或 URL 做缓存。

## 8. 隐私与成本控制

TasteOS 的参考图可能来自用户收藏、作品集、商业物料，所以需要给出边界：

- 只上传用户主动添加的图片。
- 只发送图片、标题、分类、备注，不发送无关本地信息。
- API Key 只放在后端环境变量。
- 缓存分析结果，避免重复扣费。
- Demo 阶段可以默认 mock，开启真实 API 作为可选增强。

## 9. 面试中可以怎么讲

可以这样解释项目取舍：

“MVP 阶段我先把视觉分析抽象成稳定的 `VisualAnalysis` 数据结构，用 mock 跑通案例库、审美画像、Prompt Studio 和反馈闭环。真实 API 接入时，不改产品主流程，只把 `generateAnalysis` 的实现从本地规则替换为后端多模态模型调用。这样能说明我不是只会调接口，而是在先设计产品数据结构和可替换边界。”

## 10. 开发时间评估

在当前项目基础上：

- 写后端代理接口：2-3 小时。
- 接入真实图片输入与结构化输出：2-4 小时。
- 加错误兜底、缓存、UI 状态：0.5-1 天。
- 做到可演示版本：半天左右。
- 做到可上线版本：还需要补鉴权、存储、限流、成本监控和隐私说明。

## 11. 参考官方文档

- OpenAI Images and vision：`https://platform.openai.com/docs/guides/images-vision`
- OpenAI Structured outputs：`https://platform.openai.com/docs/guides/structured-outputs`
- OpenAI Responses API Reference：`https://platform.openai.com/docs/api-reference/responses/create`
