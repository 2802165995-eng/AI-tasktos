const http = require("http");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const root = path.resolve(process.cwd());
const rootWithSeparator = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
const port = Number(process.env.PORT || 4173);
const host = "127.0.0.1";

loadLocalEnv(path.join(root, ".env.local"));

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${host}:${port}`);

  if (request.method === "POST" && requestUrl.pathname === "/api/analyze-reference") {
    handleAnalyzeReference(request, response);
    return;
  }

  const relativePath = requestUrl.pathname === "/" ? "index.html" : decodeURIComponent(requestUrl.pathname.slice(1));
  const filePath = path.resolve(root, relativePath);

  if (filePath !== root && !filePath.startsWith(rootWithSeparator)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "content-type": contentTypes[path.extname(filePath)] || "application/octet-stream"
    });
    response.end(data);
  });
});

server.listen(port, host, () => {
  console.log(`TasteOS preview running at http://${host}:${port}/`);
});

async function handleAnalyzeReference(request, response) {
  response.setHeader("content-type", "application/json; charset=utf-8");

  try {
    const modulePath = pathToFileURL(path.join(__dirname, "openai-analysis.mjs")).href;
    const { createApiAnalysis, parseJsonBody, validateAnalysisRequest } = await import(modulePath);
    const payload = await parseJsonBody(request);
    const validationError = validateAnalysisRequest(payload);

    if (validationError) {
      response.writeHead(400);
      response.end(JSON.stringify({ error: validationError }));
      return;
    }

    const analysis = await createApiAnalysis(payload, {
      provider: process.env.AI_PROVIDER,
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL,
      dashScopeApiKey: process.env.DASHSCOPE_API_KEY,
      dashScopeModel: process.env.DASHSCOPE_MODEL,
      dashScopeBaseUrl: process.env.DASHSCOPE_BASE_URL
    });

    response.writeHead(200);
    response.end(JSON.stringify({ analysis }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analyze reference failed";
    response.writeHead(message.includes("API_KEY") || message.includes("MODEL") ? 503 : 500);
    response.end(JSON.stringify({ error: message }));
  }
}

function loadLocalEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
