# TasteOS 产品需求文档

## 1. 产品概述

TasteOS 是一个面向 AI 视觉创作者的个人审美 Prompt Studio。用户上传自己喜欢的海报、社媒图或项目封面，系统从构图、字体、色彩、信息层级、使用场景和情绪氛围等维度进行分析，并将这些视觉偏好转化为可复用的 AI 生图提示词模板。

TasteOS 不是通用生图工具，也不是普通图片收藏夹。它的核心价值是帮助用户把“我喜欢这种感觉”转化成结构化的审美偏好，并进一步变成可以复用、可以迭代的 prompt 生产规则。

## 2. 一句话定位

TasteOS 帮助 AI 视觉创作者从收藏的海报案例中理解自己的审美偏好，并生成适用于海报、社媒封面和项目视觉的 AI 生图 prompt 模板。

## 3. 产品背景

AI 生图工具降低了视觉创作门槛，但很多用户仍然卡在 prompt 表达上。用户往往知道自己喜欢什么样的海报或视觉风格，却无法稳定描述并复现这种风格。

当前常见工作流比较割裂：

- 用户在 Pinterest、花瓣、小红书、Behance 或本地文件夹里收藏参考图。
- 用户临时让 AI 根据需求生成 prompt。
- 用户根据不满意的生图结果反复手动修改 prompt。
- 用户很少沉淀出自己的审美偏好和可复用风格模板。

TasteOS 试图把“参考图收藏、视觉分析、个人审美画像、prompt 生成、结果反馈”串成一个完整闭环。

## 4. 目标用户

### 4.1 核心用户

设计初学者、AI 视觉创作者、学生、独立开发者，以及需要制作海报、社媒封面、项目展示图但缺少成熟设计语言的人。

典型特征：

- 使用过 AI 生图工具。
- 经常收藏视觉参考。
- 能判断自己喜欢哪些图，但说不清为什么喜欢。
- 需要为个人项目、校园活动、作品集、社媒内容或 hackathon demo 制作视觉素材。
- 希望 AI 生成结果更稳定地贴近自己的审美，而不是每次随机试 prompt。

### 4.2 次级用户

产品、前端、市场、设计学习者。他们希望通过拆解真实设计案例，提升自己的视觉判断力和设计表达能力。

## 5. 用户痛点

### 5.1 有审美感受，但缺少设计词汇

用户能说“这张图好看”“这个风格高级”，但很难说清楚这种感觉来自色彩对比、字体选择、版式结构、留白、材质、信息层级还是情绪氛围。

### 5.2 收藏的参考图无法复用

大多数灵感收藏工具只停留在“存图”。用户收藏很多参考图后，仍然不知道这些图有哪些共同特征，也不知道如何迁移到自己的设计任务中。

### 5.3 Prompt 质量不稳定

用户每次为不同任务重新写 prompt，导致生成结果风格不稳定。即使偶尔生成出满意结果，也很难沉淀成下次可复用的模板。

### 5.4 生成结果缺少反馈闭环

用户对 AI 生图结果的喜欢或不喜欢，通常不会被系统记录下来，也不会影响下一次 prompt 生成。

## 6. 产品目标

### 6.1 MVP 目标

- 支持用户上传和管理海报、社媒封面、项目封面等视觉参考。
- 使用 AI 对单张参考图进行结构化视觉拆解。
- 基于多张参考图生成个人审美画像。
- 根据用户选择的使用场景生成可复用 prompt 模板。
- 支持用户对生成结果做简单反馈，用于后续优化偏好和 prompt。

### 6.2 非目标

- MVP 不直接生成最终图片。
- MVP 不做通用图片素材站。
- MVP 不支持所有设计类型。
- MVP 不评价作品“客观好坏”。
- MVP 不替代 Figma、Photoshop、Canva 等专业设计工具。

## 7. 核心用户路径

1. 用户上传多张自己喜欢的海报或社媒视觉参考。
2. TasteOS 对每张图生成结构化视觉分析卡片。
3. TasteOS 从多张分析结果中提取重复偏好，形成个人 Taste Profile。
4. 用户选择一个使用场景，例如校园活动海报、作品集封面、小红书封面。
5. TasteOS 基于用户审美画像和使用场景生成 prompt 模板。
6. 用户将 prompt 复制到外部 AI 生图工具中使用。
7. 用户上传生成结果或记录反馈。
8. TasteOS 根据反馈调整偏好画像和后续 prompt 建议。

## 8. MVP 范围

### 8.1 支持的视觉类型

MVP 只支持三类视觉：

- 活动海报
- 社媒封面
- 作品集 / 项目封面

这三类场景足够常见，方便收集案例，也适合学生、独立开发者和 AI 视觉创作者真实使用。

### 8.2 支持的输入

- 图片上传
- 手动填写基础信息
- 可选填写图片来源
- 可选填写用户备注：为什么喜欢这张图

### 8.3 支持的输出

- 单图视觉分析卡
- 个人审美画像
- 场景化 prompt 模板
- negative prompt 建议
- prompt 使用说明
- 生图模型格式适配：通用、Midjourney、DALL·E、Stable Diffusion

## 9. 功能需求

### 9.1 案例库

用户可以上传和管理视觉参考。

必填字段：

- 图片
- 标题
- 分类
- 创建时间

可选字段：

- 来源链接
- 用户备注

系统生成字段：

- 风格标签
- 色彩标签
- 构图方式
- 情绪氛围
- 字体描述
- 使用场景

用户价值：

- 把分散的灵感图片变成结构化的视觉参考库。

### 9.2 视觉分析卡

用户上传图片后，系统生成结构化分析。

分析维度：

- 构图：网格、居中、非对称、拼贴、分栏、大视觉焦点等。
- 色彩：主色、辅助色、对比度、饱和度、冷暖关系。
- 字体：标题风格、字体情绪、层级关系、可读性。
- 信息层级：标题、副标题、时间地点、行动引导、视觉焦点。
- 情绪氛围：极简、热烈、高级、趣味、实验、复古等。
- 使用场景：活动宣传、品牌传播、编辑视觉、社媒内容、作品集封面等。
- 可复用模式：这张图中有哪些可以迁移到未来设计任务的模式。

关键原则：

- 分析应解释设计选择，而不是简单夸“好看”。
- 对设计意图的判断需要标注为推测，不能假装知道原设计师真实想法。

### 9.3 Taste Profile

TasteOS 将多张分析结果聚合成用户的个人审美画像。

示例输出：

- 偏好高对比的信息层级。
- 经常选择大标题视觉结构。
- 喜欢 2-3 个主色控制的克制色彩方案。
- 偏好网格感强、留白明确的排版。
- 喜欢编辑感海报和轻微颗粒质感。
- 不喜欢文字不可读和装饰过多的视觉噪音。

画像维度：

- 版式偏好
- 色彩偏好
- 字体偏好
- 情绪偏好
- 信息密度偏好
- 视觉冒险程度
- 负向偏好

用户价值：

- 让用户理解自己的视觉偏好，并在未来设计任务中复用。

### 9.4 Prompt Studio

用户选择使用场景后，系统生成可编辑、可复用的 prompt 模板。

首批场景：

- 校园活动海报
- 音乐 / 展览海报
- 社媒封面
- 作品集项目封面
- 品牌活动视觉

Prompt 模板结构：

- 任务描述
- 目标受众
- 视觉风格
- 构图方式
- 色彩方案
- 字体方向
- 信息层级
- 情绪氛围
- 约束条件
- negative prompt

示例 prompt：

```text
Create a vertical poster for [event topic], targeted at [audience].
Use a clean editorial layout with strong hierarchy and generous whitespace.
The main visual should feature [main subject] as the focal point.
Use a restrained palette of [primary color], [secondary color], and [accent color].
Typography should use a bold readable headline, simple sans-serif supporting text, and clear spacing.
Place the event title as the strongest visual element, followed by date, location, and call-to-action.
Mood: thoughtful, modern, refined, slightly experimental.
Avoid clutter, unreadable small text, excessive decorations, and random visual elements.
```

用户价值：

- 把个人审美偏好转化为可直接用于 AI 生图的创作指令。

### 9.4.1 模型格式适配

同一个 prompt 模板应支持不同生图工具的表达习惯。

首批格式：

- 通用 Prompt：保留完整创作约束，适合多数生图工具。
- Midjourney：追加画幅和风格参数，例如 `--ar 3:4`、`--style raw`。
- DALL·E：改写为更自然的指令式描述，强调海报构图和文字可读性。
- Stable Diffusion：拆分正向 prompt 与 negative prompt，适合本地模型工作流。

用户价值：

- 降低用户在不同生图工具之间手动改写 prompt 的成本。
- 强化 TasteOS 作为 prompt 工作台，而不是单次文本生成器的定位。

### 9.5 结果反馈

用户将 prompt 用在外部生图工具后，可以上传生成结果并给出反馈。

MVP 反馈选项：

- 喜欢
- 不喜欢
- 太杂乱
- 文字不可读
- 情绪不对
- 色彩不符合
- 构图不符合
- 方向正确，但需要优化

系统根据反馈更新：

- Taste Profile 的置信度
- negative prompt 建议
- 场景化 prompt 规则

用户价值：

- 让系统不是一次性生成 prompt，而是随着用户反馈持续贴近个人偏好。

## 10. 页面结构

### 10.1 案例库页面

目的：

- 管理用户上传的视觉参考。

关键组件：

- 上传入口
- 分类筛选
- 风格标签筛选
- 参考图卡片
- 空状态示例案例

### 10.2 案例详情页面

目的：

- 查看单张图片及其视觉分析结果。

关键组件：

- 大图预览
- 用户备注
- AI 分析模块
- 风格标签
- 加入画像按钮
- 生成相似 prompt 按钮

### 10.3 Taste Profile 页面

目的：

- 展示用户聚合后的审美偏好。

关键组件：

- 偏好总结
- 版式偏好图表
- 色彩偏好摘要
- 字体偏好摘要
- 情绪标签
- 负向偏好列表
- 支撑每条偏好的参考图证据

### 10.4 Prompt Studio 页面

目的：

- 根据场景生成 prompt 模板。

关键组件：

- 场景选择器
- 生成目标输入框
- Taste Profile 预览
- 生成的 prompt 模板
- negative prompt
- 复制 prompt 按钮
- 保存 prompt 版本按钮

### 10.5 结果反馈页面

目的：

- 记录 prompt 生成结果是否符合用户审美。

关键组件：

- 上传生成结果
- 选择来源 prompt
- 反馈标签
- 备注
- 画像更新摘要

## 11. 数据模型

### 11.1 Reference

```ts
type Reference = {
  id: string;
  title: string;
  imageUrl: string;
  category: "event_poster" | "social_cover" | "portfolio_cover";
  source?: string;
  userNote?: string;
  analysisId?: string;
  createdAt: string;
};
```

### 11.2 VisualAnalysis

```ts
type VisualAnalysis = {
  id: string;
  referenceId: string;
  composition: string;
  colorPalette: string[];
  colorDescription: string;
  typography: string;
  informationHierarchy: string;
  moodTags: string[];
  styleTags: string[];
  usageScenario: string;
  reusablePatterns: string[];
  avoidPatterns: string[];
};
```

### 11.3 TasteProfile

```ts
type TasteProfile = {
  id: string;
  layoutPreferences: string[];
  colorPreferences: string[];
  typographyPreferences: string[];
  moodPreferences: string[];
  informationDensity: "low" | "medium" | "high";
  negativePreferences: string[];
  evidenceReferenceIds: string[];
  updatedAt: string;
};
```

### 11.4 PromptTemplate

```ts
type PromptTemplate = {
  id: string;
  scenario: string;
  goal: string;
  prompt: string;
  negativePrompt: string;
  basedOnProfileId: string;
  basedOnReferenceIds: string[];
  createdAt: string;
};
```

### 11.5 GenerationFeedback

```ts
type GenerationFeedback = {
  id: string;
  promptTemplateId: string;
  resultImageUrl?: string;
  rating: "like" | "dislike" | "mixed";
  feedbackTags: string[];
  note?: string;
  createdAt: string;
};
```

## 12. AI 行为要求

### 12.1 图像分析要求

AI 在分析图片时应：

- 描述可观察到的视觉元素。
- 避免把推测当作事实。
- 区分“观察”和“推断”。
- 聚焦可复用的设计模式。
- 输出结构化结果，方便存储和聚合。

### 12.2 Taste Profile 生成要求

AI 在生成审美画像时应：

- 聚合多张参考图中的重复模式。
- 为每条偏好提供参考图证据。
- 区分强偏好和弱信号。
- 只有在用户反馈或重复模式足够明显时，才生成负向偏好。

### 12.3 Prompt 生成要求

AI 在生成 prompt 时应：

- 以用户选择的使用场景为主要约束。
- 将 Taste Profile 作为风格指导，而不是替代完整任务描述。
- 保留可编辑占位符。
- 提供 negative prompt。
- 对海报类输出优先保证可读性和信息层级。

## 13. 成功指标

### 13.1 MVP 使用指标

- 上传参考图数量
- 完成分析的参考图比例
- 生成 prompt 模板数量
- prompt 复制率
- 用户反馈提交率

### 13.2 产品价值指标

- 用户使用后能更清楚描述自己的视觉偏好。
- 用户能在 3 分钟内生成一个可用 prompt 模板。
- 用户会在多个场景中复用已保存 prompt。
- 用户反馈能推动后续 prompt 质量提升。

### 13.3 Demo 指标

用于作品集展示时，项目至少应包含：

- 12 张以上参考图。
- 3 个以上场景 prompt 模板。
- 1 个完整 Taste Profile。
- 1 个“反馈后优化 prompt”的示例。

## 14. 差异化

### 14.1 相比 Pinterest / 花瓣

Pinterest 和花瓣帮助用户收藏灵感。TasteOS 帮助用户分析灵感，并转化成可复用 prompt 模板。

### 14.2 相比 ChatGPT

ChatGPT 可以做一次性的图片分析或 prompt 生成。TasteOS 有结构化案例库、持久化 Taste Profile、prompt 版本和反馈历史。

### 14.3 相比 AI 生图工具

AI 生图工具关注最终图片生成。TasteOS 关注生图之前的偏好提取、风格表达和 prompt 准备。

### 14.4 相比 Prompt 模板库

Prompt 模板库提供通用模板。TasteOS 根据用户自己的视觉参考和反馈生成个性化模板。

## 15. 风险与应对

### 15.1 风险：产品变成普通图片收藏夹

应对：

- 将视觉分析、审美画像和 prompt 生成作为主流程。
- MVP 不过度优化瀑布流浏览体验。

### 15.2 风险：AI 分析过于主观

应对：

- 将分析表述为观察和建议，而不是客观判定。
- 允许用户确认、修改或补充 AI 分析。

### 15.3 风险：不同生图模型对 prompt 的响应差异很大

应对：

- MVP 生成模型无关的通用 prompt。
- 提供 prompt 使用说明和 negative prompt。
- 后续版本再支持 Midjourney、DALL-E、Stable Diffusion 等模型专用格式。

### 15.4 风险：范围膨胀

应对：

- MVP 只支持活动海报、社媒封面、项目封面。
- 暂不支持完整品牌系统、UI 设计、包装设计和视频。

## 16. 未来扩展

- 浏览器插件：从网页快速保存视觉参考。
- 模型适配器：为 Midjourney、DALL-E、Stable Diffusion、即梦等工具生成不同格式 prompt。
- 团队 Taste Profile：为小型创意团队沉淀共同视觉偏好。
- Prompt 生成结果对比。
- 设计判断力训练模式。
- 公开分享个人 Taste Profile。
- 接入生图 API，形成从 prompt 到结果反馈的完整闭环。

## 17. 面试讲述建议

我观察到 AI 生图工具降低了视觉创作门槛，但很多用户仍然很难把自己的审美偏好转化为稳定 prompt。用户会收藏很多海报参考图，但这些参考通常只是散落的灵感，无法沉淀成可复用的设计知识。

所以我设计了 TasteOS，一个个人视觉审美 Prompt Studio。它会从用户收藏的海报和社媒视觉中分析构图、字体、色彩、信息层级和情绪氛围，生成用户的 Taste Profile，再基于不同使用场景生成 prompt 模板。

这个产品的关键设计决策是：TasteOS 不直接做另一个生图工具，而是位于生图之前，解决“如何把个人审美表达成创作指令”的问题。

MVP 只聚焦活动海报、社媒封面和项目封面，因为这些场景常见、案例容易收集，也适合学生和独立开发者真实使用。我刻意没有一开始支持完整品牌系统、UI 设计或视频，避免范围过大。

核心产品闭环是：收藏参考图、分析视觉模式、生成审美画像、生成 prompt 模板、记录结果反馈、优化后续 prompt。这个闭环让 TasteOS 区别于一次性的 AI 聊天工具，因为用户的偏好和反馈会持续沉淀。

## 18. MVP 开发建议

第一版可以做成一个轻量 Web App：

1. 实现图片上传和案例库。
2. 准备 10-12 张内置示例参考图。
3. 实现结构化视觉分析。
4. 实现 Taste Profile 聚合。
5. 实现场景化 prompt 模板生成。
6. 加入简单反馈标签。

第一版不需要接入真实生图能力。用户可以将 prompt 复制到外部生图工具中使用，再把生成结果上传回来做反馈。
