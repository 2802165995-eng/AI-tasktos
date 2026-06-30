# TasteOS GitHub Pages + 阿里云 FC 分享架构设计

## 目标

让访问者通过公开 GitHub Pages 地址打开 TasteOS 网页，并让网页跨域调用阿里云函数计算 FC 的真实模型接口，无需 ICP 备案或自定义域名。

## 架构

```text
GitHub Pages
https://2802165995-eng.github.io/AI-tasktos/
  -> POST
阿里云 FC
https://tasteos-hiebninplt.cn-hangzhou.fcapp.run/api/analyze-reference
  -> DashScope
```

FC 默认域名的 `Content-Disposition: attachment` 会影响直接展示 HTML，但不影响浏览器通过 `fetch` 使用 JSON API。

## 前端配置

`src/apiClient.js` 不再永久写死相对路径。API 地址解析顺序：

1. 调用选项 `options.apiBaseUrl`，用于测试或特殊运行环境。
2. 页面中的 `<meta name="tasteos-api-base-url">` 配置。
3. 没有配置时继续使用同源相对路径 `/api/analyze-reference`。

生产页面的 meta 配置为：

```html
<meta
  name="tasteos-api-base-url"
  content="https://tasteos-hiebninplt.cn-hangzhou.fcapp.run"
/>
```

这样 GitHub Pages 会调用 FC，本地测试仍可通过覆盖选项或移除 meta 使用本地代理。

## CORS

FC 处理：

- `OPTIONS /api/analyze-reference`：返回 204。
- `POST /api/analyze-reference`：正常处理模型请求。
- 响应包含：

```text
Access-Control-Allow-Origin: https://2802165995-eng.github.io
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
Vary: Origin
```

允许来源由环境变量配置：

```text
ALLOWED_ORIGIN=https://2802165995-eng.github.io
```

如果请求带有不匹配的 `Origin`，返回 403。没有 `Origin` 的服务端或本地诊断请求允许继续执行。

## 部署产物

重新生成：

```text
dist/tasteos-aliyun-fc.zip
```

ZIP 包含 CORS 后端修改，不包含 `.env.local` 或任何 API Key。

FC 新增环境变量：

```text
ALLOWED_ORIGIN=https://2802165995-eng.github.io
```

其他 DashScope、HOST 和 PORT 配置保持不变。

## 测试

- API 客户端使用配置后的完整 FC 地址。
- 无配置时仍使用相对地址。
- CORS 预检返回 204 和正确响应头。
- 允许来源的 POST 获得 CORS 响应头。
- 不允许来源返回 403。
- 无 Origin 的本地请求不受影响。
- 完整 Node 测试和部署包白名单测试通过。
- 本地以 GitHub Pages 来源模拟预检和 POST。

## 安全边界

公开 FC URL 仍可能被他人直接调用。CORS 只能限制普通网页浏览器，不能阻止脚本或服务端请求。因此公开展示后建议禁用或轮换百炼 Key，并在后续生产化时增加鉴权、频率限制和预算告警。
