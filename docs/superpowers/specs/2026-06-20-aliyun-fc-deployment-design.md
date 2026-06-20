# TasteOS 阿里云函数计算部署设计

## 目标

把 TasteOS 的静态网页和 `/api/analyze-reference` 真实模型代理部署到同一个阿里云函数计算 Web 函数地址，并生成一个不包含任何本地密钥或个人文件的可上传 ZIP。

## 部署形态

使用阿里云函数计算 FC Web 函数的自定义运行时：

```text
浏览器
  -> 阿里云 FC 公网地址
  -> scripts/static-server.js
      -> 静态网页
      -> POST /api/analyze-reference
          -> DashScope 百炼
```

前后端保持同源，因此无需增加 CORS 配置，也不需要修改前端 `/api/analyze-reference` 请求路径。

## 服务端适配

`scripts/static-server.js` 当前固定监听 `127.0.0.1:4173`。修改为：

- `PORT` 默认值仍为 `4173`。
- `HOST` 默认值仍为 `127.0.0.1`。
- 阿里云环境通过 `PORT=9000`、`HOST=0.0.0.0` 覆盖默认值。
- 启动日志输出实际监听地址。

增加 `GET /health`：

```json
{
  "status": "ok"
}
```

该接口不访问 DashScope，不输出环境变量，用于控制台和部署后的健康检查。

## 部署包

新增 PowerShell 打包脚本 `scripts/package-aliyun-fc.ps1`，生成：

```text
dist/tasteos-aliyun-fc.zip
```

ZIP 根目录直接包含：

```text
index.html
src/
scripts/static-server.js
scripts/openai-analysis.mjs
README.md
DEPLOY_ALIYUN_FC.md
```

明确排除：

- `.env.local`
- `.git/`
- `.github/`
- `.worktrees/`
- `dist/`
- 日志文件
- 测试文件
- `docs/`
- 简历、PDF、DOCX 和其他个人文件

打包脚本先复制白名单文件到临时目录，再压缩临时目录。使用白名单而不是排除列表，降低密钥或个人文件意外进入部署包的风险。

## 配置

阿里云函数环境变量：

```text
AI_PROVIDER=dashscope
DASHSCOPE_API_KEY=<百炼 API Key>
DASHSCOPE_MODEL=qwen3-vl-flash
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
PORT=9000
HOST=0.0.0.0
```

启动命令：

```text
node scripts/static-server.js
```

代码中不写入真实 API Key，部署包中也不包含 `.env.local`。

## 文档

新增 `DEPLOY_ALIYUN_FC.md`，说明：

1. 如何运行打包脚本。
2. 如何创建 Web 函数。
3. 如何选择自定义运行时。
4. 如何上传 ZIP。
5. 如何填写启动命令、端口和环境变量。
6. 如何通过 `/health` 检查部署。
7. 如何在页面选择“真实模型分析”完成端到端验证。
8. 常见错误：监听地址、端口、密钥、模型权限、超时与图片大小。

## 测试

### 服务器测试

- 默认主机为 `127.0.0.1`，默认端口为 `4173`。
- 设置 `HOST` 和 `PORT` 时使用对应值。
- `/health` 返回 HTTP 200 和固定 JSON。
- 静态页面与分析接口行为保持不变。

为避免测试时导入文件就启动服务，把服务器配置与创建逻辑导出，并仅在脚本作为入口运行时调用 `listen`。

### 部署包测试

运行打包脚本后检查 ZIP：

- 必须包含白名单文件。
- 不得包含 `.env.local`、`.git`、测试、日志和个人文件。
- ZIP 解压后的根目录可直接执行启动命令。

### 完整验证

- 运行全部现有 Node 测试。
- 使用 `HOST=0.0.0.0 PORT=9000` 本地启动。
- 请求 `/health`。
- 请求 `/` 并确认网页返回。
- 使用已有本地配置调用一次 `/api/analyze-reference`。

## 验收标准

- 服务可在 `0.0.0.0:9000` 正常启动。
- `/health` 返回成功。
- 打包 ZIP 不包含密钥或个人文件。
- ZIP 根目录结构符合阿里云上传要求。
- 本地原有启动方式仍然有效。
- 所有自动测试通过。
