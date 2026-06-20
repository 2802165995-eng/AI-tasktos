# TasteOS 部署到阿里云函数计算 FC

本方案把网页与真实模型接口部署在同一个公网地址，不需要配置跨域。真实模型通过服务端环境变量调用阿里云百炼 DashScope，API Key 不会出现在浏览器代码中。

## 1. 生成部署包

在项目根目录打开 PowerShell：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\package-aliyun-fc.ps1
```

生成文件：

```text
dist/tasteos-aliyun-fc.zip
```

该 ZIP 使用白名单打包，不包含 `.env.local`、Git 仓库、日志、测试、简历或其他个人文件。

## 2. 创建函数

1. 登录阿里云控制台并进入“函数计算 FC”。
2. 选择中国内地地域，例如杭州或上海。
3. 创建函数，函数类型选择“Web 函数”。
4. 运行环境优先选择 Node.js 20；如果控制台要求选择自定义运行时，则选择包含 Node.js 的自定义运行时。
5. 代码上传方式选择 ZIP，上传 `dist/tasteos-aliyun-fc.zip`。
6. 启动命令填写：

```text
node scripts/static-server.js
```

7. 监听端口填写：

```text
9000
```

控制台名称可能随版本调整，但必须满足两个条件：运行环境可以执行 `node`，Web 服务监听端口为 `9000`。

## 3. 配置环境变量

在函数配置的“环境变量”中添加：

```text
AI_PROVIDER=dashscope
DASHSCOPE_API_KEY=你的百炼_API_Key
DASHSCOPE_MODEL=qwen3-vl-flash
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
HOST=0.0.0.0
PORT=9000
ALLOWED_ORIGIN=https://2802165995-eng.github.io
```

不要把真实 `DASHSCOPE_API_KEY` 写入代码、ZIP、GitHub 或聊天截图中。

如果 `qwen3-vl-flash` 在你的百炼账号中不可用，请在百炼模型广场确认已开通的视觉模型，并同步修改 `DASHSCOPE_MODEL`。

## 4. 配置公网访问

1. 在函数的触发器或公网访问配置中创建 HTTP 访问地址。
2. 认证方式根据用途选择：
   - 公开演示：允许匿名访问。
   - 私人使用：启用阿里云提供的身份认证。
3. 保存配置并重新部署函数。

## 5. 检查部署

假设函数公网地址为：

```text
https://example.cn-hangzhou.fcapp.run
```

先访问健康检查：

```text
https://example.cn-hangzhou.fcapp.run/health
```

预期返回：

```json
{"status":"ok"}
```

再访问根地址：

```text
https://example.cn-hangzhou.fcapp.run/
```

页面打开后：

1. 填写图片链接或选择本地图片。
2. 分析模式选择“真实模型分析”。
3. 点击“开始分析”。
4. 等待模型返回结构化中文分析。

## 6. 更新部署

代码修改后重新运行：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\package-aliyun-fc.ps1
```

然后在函数控制台上传新的 `dist/tasteos-aliyun-fc.zip` 并发布新版本。环境变量通常可以保留，不需要把密钥重新写入 ZIP。

## 7. 常见问题

### 健康检查失败或启动超时

确认环境变量完全一致：

```text
HOST=0.0.0.0
PORT=9000
```

确认启动命令是：

```text
node scripts/static-server.js
```

如果日志显示 `node` 不存在，说明运行时选择错误，需要改为 Node.js 运行时或包含 Node.js 的自定义运行时。

### 网页能打开，但真实模型回退为离线分析

检查函数日志中的错误，并核对：

- `DASHSCOPE_API_KEY` 是否有效。
- `DASHSCOPE_MODEL` 是否已在百炼开通。
- 函数是否允许访问公网。
- 百炼账户是否有可用额度。

### 本地图片上传失败

本地图片会以 Base64 放进请求体。优先使用较小的 JPG、PNG 或 WebP 图片；图片过大会超过函数网关或运行时的请求体限制。建议单张图片控制在 3 MB 以内。

### 请求超时

前端会在 45 秒后取消模型请求。可以在 FC 控制台适当提高函数执行超时时间，但模型和网络仍需在前端超时前返回。

### 修改环境变量后没有生效

保存函数配置后重新部署或发布新版本，再通过 `/health` 和真实模型分析重新验证。
