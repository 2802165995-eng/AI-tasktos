# TasteOS

TasteOS 是一个面向 AI 视觉创作者的个人审美提示词工坊。它把用户收藏或上传的视觉参考图转成结构化的视觉偏好，再生成可复制到即梦、通义万相、豆包生图、Midjourney、DALL-E、Stable Diffusion 等工具里的中文生图提示词。

这个项目的重点不是再做一个生图平台，而是解决生图之前的问题：用户知道自己喜欢某类海报或视觉风格，但很难稳定地描述、复用和迭代这种审美偏好。

## 核心流程

```text
参考图导入
-> AI / 离线视觉分析
-> 审美画像
-> 场景化提示词生成
-> 复制到外部生图工具
-> 结果反馈
-> 继续校准审美画像
```

## 当前能力

- 支持图片链接和本地图片上传。
- 支持离线演示分析，没有 API Key 也能跑通完整流程。
- 支持真实模型分析，通过本地代理调用阿里云百炼 DashScope 或 OpenAI。
- 自动识别参考图用途、风格、构图、色彩、字体、情绪和负向提示词。
- 聚合多张参考图生成个人审美画像。
- 生成中文生图提示词，并适配即梦、通义万相、豆包生图、Midjourney、DALL-E、Stable Diffusion。
- 支持复制正向提示词、负向提示词、完整提示词包。
- 支持删除案例、提示词历史、结果反馈和画像导出。

## 一分钟启动

在项目目录运行：

```powershell
node scripts\static-server.js
```

如果系统没有把 Node.js 加到 PATH，可以使用 Codex 自带 Node：

```powershell
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\static-server.js
```

然后打开：

```text
http://127.0.0.1:4173/
```

## 真实模型配置

不要把 `.env.local` 提交或发给别人。它只应该放在本地项目根目录。

阿里云百炼 / DashScope 示例：

```text
AI_PROVIDER=dashscope
DASHSCOPE_API_KEY=你的阿里云百炼 API Key
DASHSCOPE_MODEL=qwen3-vl-flash
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

OpenAI 示例：

```text
AI_PROVIDER=openai
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=支持视觉输入的模型名
```

修改 `.env.local` 后需要重启 `scripts/static-server.js`。

## 演示路径

1. 打开首页，展示默认 12 张视觉参考案例。
2. 上传一张图片或粘贴图片链接。
3. 选择“真实模型分析”，点击“开始分析”。
4. 等待 10-30 秒，查看系统生成的中文反推提示词和提示词基因。
5. 进入“审美画像”，查看多张参考图聚合出的偏好。
6. 进入“提示词工坊”，选择场景和模型格式，例如“即梦”。
7. 生成提示词，复制“完整提示词包”。
8. 进入“结果反馈”，记录生成结果的问题，形成闭环。

如果真实模型不可用，系统会自动回退到离线演示分析，保证演示流程不中断。

## 项目结构

```text
index.html                 页面入口
src/app.js                 前端 UI、状态和交互
src/tasteEngine.js         离线视觉分析、审美画像和提示词生成
src/promptAdapters.js      生图工具提示词格式适配
src/clipboard.js           复制能力和浏览器降级方案
src/apiClient.js           前端真实分析请求封装
scripts/static-server.js   本地静态服务和真实模型代理
scripts/openai-analysis.mjs OpenAI / DashScope 图像分析请求
scripts/*.test.mjs         本地测试
docs/                      PRD、架构、演示和面试材料
```

## 本地验证

```powershell
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\taste-engine.test.mjs
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\prompt-adapters.test.mjs
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\clipboard.test.mjs
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\openai-analysis.test.mjs
& 'C:\Users\29986\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\text-integrity.test.mjs
```

## 面试讲述重点

可以这样概括：

> TasteOS 不是生图工具，而是生图前的审美表达层。它把用户收藏的视觉参考图变成结构化审美画像，再按具体场景生成中文生图提示词，并通过结果反馈持续校准偏好。

可以重点讲三点：

- 产品判断：先解决“如何稳定表达审美”，而不是直接做生图。
- 工程边界：离线分析和真实模型分析都输出同一套结构，前端流程不用重写。
- 自用价值：用户上传自己的参考图后，可以沉淀个人长期可复用的提示词资产。

## 常见问题

**页面打不开**

确认本地服务正在运行，并访问 `http://127.0.0.1:4173/`。不要直接双击 `index.html`。

**真实模型提示缺少 Key**

确认 `.env.local` 位于项目根目录，并且字段名和上面的配置一致。修改后重启本地服务。

**为什么真实模型失败后仍然有分析结果**

这是预期行为。系统会回退到离线演示分析，避免演示过程中断。

**能直接部署成网页吗**

离线演示分析可以作为静态网页部署。真实模型分析必须保留后端代理，不能把 API Key 写进前端代码。
