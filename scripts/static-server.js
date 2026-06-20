const http = require("http");
const fs = require("fs");
const path = require("path");
const { fileURLToPath, pathToFileURL } = require("url");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

function getServerConfig(env = process.env) {
  return {
    host: env.HOST || "127.0.0.1",
    port: Number(env.PORT || 4173)
  };
}

function createTasteOsServer(options = {}) {
  const rootInput = options.root || process.cwd();
  const root = rootInput instanceof URL ? fileURLToPath(rootInput) : path.resolve(rootInput);
  const rootWithSeparator = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  const env = options.env || process.env;

  return http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://localhost");

    if (request.method === "GET" && requestUrl.pathname === "/health") {
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ status: "ok" }));
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/analyze-reference") {
      handleAnalyzeReference(request, response, env);
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
}

function startTasteOsServer(options = {}) {
  const root = path.resolve(options.root || process.cwd());
  loadLocalEnv(path.join(root, ".env.local"));
  const env = options.env || process.env;
  const { host, port } = getServerConfig(env);
  const server = createTasteOsServer({ root, env });
  server.listen(port, host, () => {
    console.log(`TasteOS preview running at http://${host}:${port}/`);
  });
  return server;
}

async function handleAnalyzeReference(request, response, env = process.env) {
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
      provider: env.AI_PROVIDER,
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
      dashScopeApiKey: env.DASHSCOPE_API_KEY,
      dashScopeModel: env.DASHSCOPE_MODEL,
      dashScopeBaseUrl: env.DASHSCOPE_BASE_URL
    });

    response.writeHead(200);
    response.end(JSON.stringify({ analysis }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analyze reference failed";
    response.writeHead(message.includes("API_KEY") || message.includes("MODEL") ? 503 : 500);
    response.end(JSON.stringify({ error: message }));
  }
}

module.exports = {
  createTasteOsServer,
  getServerConfig,
  startTasteOsServer
};

if (require.main === module) {
  startTasteOsServer();
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
