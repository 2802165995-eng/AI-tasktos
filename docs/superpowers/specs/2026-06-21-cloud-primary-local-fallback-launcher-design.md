# TasteOS 云端优先、本地备用与双击启动设计

## 目标

将当前 TasteOS 演示项目改造成适合个人日常使用的本地网页应用：

- 默认使用阿里云百炼图文模型分析参考图。
- 云端调用失败时，由用户决定是否改用本地 Ollama。
- 用户通过桌面快捷方式启动应用，无需手动执行 PowerShell 命令。
- 浏览器关闭后，本地服务继续后台运行，直到电脑关机或重启。

本阶段继续使用现有 `localStorage` 保存数据，不引入数据库和本地图片文件库。

## 范围

### 本阶段包含

- 阿里云百炼作为默认图文分析服务。
- Ollama 作为用户确认后才启用的备用服务。
- 清晰展示云端失败原因。
- 检测 Ollama 服务和模型是否可用。
- 防止真实模型失败后静默回退到 Mock。
- Windows 双击启动脚本。
- 桌面快捷方式安装脚本。
- 已运行时只打开浏览器，不重复启动服务。
- 启动日志和进程标识，便于诊断。

### 本阶段不包含

- SQLite 或其他数据库。
- 将上传图片持久化到本地文件夹。
- 多设备或公网访问。
- 用户登录和权限系统。
- 云端网页部署。
- Windows 独立 `.exe` 打包。
- 开机自动启动。
- 自动下载或安装 Ollama。

## 架构

```text
桌面快捷方式
  -> Windows 启动脚本
     -> 检查 http://127.0.0.1:4173/health
        -> 已运行：打开浏览器
        -> 未运行：后台启动 Node 服务，再打开浏览器

浏览器
  -> POST /api/analyze-reference
     -> 阿里云百炼 qwen3-vl-flash
        -> 成功：返回 VisualAnalysis
        -> 失败：返回可展示的错误和“可尝试本地模型”标记
           -> 浏览器弹窗询问
              -> 确认：POST /api/analyze-reference，provider=ollama
              -> 取消：保留输入并停止分析

本地 Ollama
  -> qwen3-vl:8b
  -> 返回与云端相同的 VisualAnalysis 结构
```

前端继续只依赖统一的 `VisualAnalysis` 数据结构。云端百炼和本地 Ollama 的差异限制在后端 Provider 层，不传播到 Taste Profile、Prompt Studio 或反馈流程。

## 配置

项目根目录的 `.env.local` 使用以下配置：

```text
AI_PROVIDER=dashscope
DASHSCOPE_API_KEY=你的百炼 API Key
DASHSCOPE_MODEL=qwen3-vl-flash
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3-vl:8b

HOST=127.0.0.1
PORT=4173
```

`DASHSCOPE_API_KEY` 仅由 Node 服务读取，不返回前端，也不写入启动日志。

## 后端组件

### Provider 路由

`scripts/openai-analysis.mjs` 保留现有 DashScope 和 OpenAI 能力，并新增 Ollama Provider。

请求可以显式携带：

```json
{
  "provider": "ollama"
}
```

未指定 Provider 时，后端使用 `AI_PROVIDER`，因此默认仍为 DashScope。前端只有在用户确认后才发送 `provider: "ollama"`。

### Ollama 调用

Ollama Provider 调用本机 API，传入图片和分析提示词，并要求返回符合现有 `visualAnalysisSchema` 的 JSON。

后端需要区分以下错误：

- Ollama 服务不可连接。
- 指定模型未安装。
- 模型响应超时。
- 模型输出不是有效 JSON。
- 模型输出缺少必要字段。

错误信息应给出直接可执行的处理方式，例如启动 Ollama 或运行：

```powershell
ollama pull qwen3-vl:8b
```

### 错误响应

模型接口失败时返回稳定的错误结构：

```json
{
  "error": "云端模型调用失败的可读说明",
  "code": "CLOUD_PROVIDER_FAILED",
  "canFallbackToLocal": true
}
```

只有默认云端 Provider 失败时，`canFallbackToLocal` 才为 `true`。Ollama 本身失败时不继续回退到 Mock。

## 前端交互

用户选择“真实模型分析”并提交图片后：

1. 前端调用默认分析接口。
2. 云端成功时按现有流程保存参考图和分析结果。
3. 云端失败且允许本地备用时，显示失败原因并弹出确认框。
4. 用户确认后，以相同参考图重新请求 Ollama Provider。
5. 用户取消后，保留表单内容和图片预览，并结束加载状态。
6. Ollama 失败时展示具体错误和修复建议。

真实模型路径不得再自动调用 `generateAnalysis()` 生成 Mock 结果。离线 Mock 模式仍可作为用户主动选择的独立分析模式保留。

为避免重复提交：

- 云端请求和本地备用请求共用同一分析任务状态。
- 切换页面或主动取消时，中止当前请求。
- 备用请求进行中时禁用重复提交。

## 双击启动

### 启动脚本

新增 PowerShell 启动脚本，执行以下流程：

1. 请求 `http://127.0.0.1:4173/health`。
2. 如果服务正常，直接打开默认浏览器。
3. 如果服务未运行，定位可用 Node：
   - 优先使用系统 `node.exe`。
   - 如果系统 PATH 中不存在 Node，则使用 Codex bundled Node 的已知路径。
   - 两者都不存在时显示明确错误。
4. 以隐藏窗口方式启动 `scripts/static-server.js`。
5. 将标准输出和错误输出写入项目的本地日志目录。
6. 轮询健康检查，直到成功或达到超时时间。
7. 成功后打开默认浏览器；失败则显示日志位置。

服务进程不依赖启动脚本窗口，因此启动脚本结束、浏览器关闭后仍继续运行。

### 幂等性

启动器通过健康检查判断现有实例，不依赖容易失效的 PID 文件。重复双击只打开网页，不再创建第二个 Node 服务。

如果端口被其他程序占用但 `/health` 响应不是 TasteOS 预期内容，启动器应报端口冲突，而不是将其视为已启动。

### 桌面快捷方式

新增一次性安装脚本，在当前用户桌面创建“启动 TasteOS”快捷方式。快捷方式调用启动 PowerShell 脚本，工作目录固定为项目根目录。

项目目录移动后，需要重新运行快捷方式安装脚本。

## 日志与隐私

日志可记录：

- 服务启动时间。
- 服务监听地址。
- Provider 名称。
- 请求成功、失败和耗时。
- 不包含密钥的错误摘要。

日志不得记录：

- API Key。
- 完整 Base64 图片内容。
- `.env.local` 全部内容。

## 测试

### Provider 测试

- 未显式指定 Provider 时使用 DashScope。
- 显式指定 `ollama` 时调用 Ollama。
- Ollama 请求使用配置的 URL 和模型。
- Ollama 合法 JSON 能转换为统一 `VisualAnalysis`。
- Ollama 连接失败、模型缺失和非法 JSON 返回明确错误。

### API 测试

- 云端失败响应包含 `canFallbackToLocal: true`。
- Ollama 失败响应不再允许其他回退。
- 请求中的未知 Provider 被拒绝。
- 真实模型失败时不会生成 Mock 结果。

### 前端测试

- 云端成功时不弹出备用确认。
- 云端失败时弹窗询问是否使用 Ollama。
- 用户取消后不调用 Ollama并保留输入。
- 用户确认后只发起一次 Ollama 请求。
- Ollama 失败时展示可操作的错误信息。

### 启动器测试

- 服务未运行时可后台启动并通过健康检查。
- 服务已运行时不会启动第二个实例。
- Node 不可用时给出明确错误。
- 端口冲突时不误判为 TasteOS。
- 日志中不包含 API Key。

## 验收标准

- 双击桌面快捷方式后，TasteOS 在默认浏览器中打开。
- 浏览器关闭后，`/health` 仍可访问。
- 重复双击快捷方式不会产生多个服务实例。
- 默认真实分析使用阿里云百炼 `qwen3-vl-flash`。
- 云端失败时显示原因，并由用户确认是否使用 Ollama。
- 用户取消时不产生 Mock 分析结果。
- 用户确认时使用 `qwen3-vl:8b` 完成分析。
- Ollama 未运行或模型缺失时，页面给出明确修复步骤。
- API Key 不出现在前端代码、响应或日志中。
