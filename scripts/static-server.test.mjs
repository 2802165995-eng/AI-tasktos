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
  env: {}
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

try {
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/health`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
  assert.deepEqual(await response.json(), { status: "ok" });
} finally {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}
