import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createTasteOsServer, getServerConfig } = require("./static-server.js");

assert.deepEqual(getServerConfig({}), {
  host: "127.0.0.1",
  port: 4173
});

assert.deepEqual(getServerConfig({ HOST: "0.0.0.0", PORT: "9000" }), {
  host: "0.0.0.0",
  port: 9000
});

const server = createTasteOsServer({
  root: new URL("..", import.meta.url),
  env: {
    ALLOWED_ORIGIN: "https://2802165995-eng.github.io"
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

try {
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/health`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
  assert.deepEqual(await response.json(), { status: "ok" });

  const preflight = await fetch(`http://127.0.0.1:${address.port}/api/analyze-reference`, {
    method: "OPTIONS",
    headers: {
      origin: "https://2802165995-eng.github.io",
      "access-control-request-method": "POST",
      "access-control-request-headers": "content-type"
    }
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), "https://2802165995-eng.github.io");
  assert.equal(preflight.headers.get("access-control-allow-methods"), "POST, OPTIONS");
  assert.equal(preflight.headers.get("access-control-allow-headers"), "Content-Type");

  const rejected = await fetch(`http://127.0.0.1:${address.port}/api/analyze-reference`, {
    method: "OPTIONS",
    headers: {
      origin: "https://malicious.example"
    }
  });
  assert.equal(rejected.status, 403);
} finally {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}
