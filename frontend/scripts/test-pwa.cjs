const { readFileSync } = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const handlers = {};
let networkCalls = 0;
const context = {
  URL, Response,
  self: {
    location: { origin: "https://stryk.games" },
    addEventListener: (name, handler) => { handlers[name] = handler; },
    skipWaiting() {},
    clients: { claim: async () => {} },
  },
  caches: { match: async () => new Response("offline screen") },
  fetch: async () => { networkCalls++; throw new Error("offline"); },
};
vm.runInNewContext(readFileSync("public/sw.js", "utf8"), context);

async function test() {
  for (const [method, mode, url] of [
    ["GET", "cors", "https://stryk.games/api/profile/me"],
    ["POST", "navigate", "https://stryk.games/profile"],
    ["GET", "navigate", "https://stryk.games/api/profile/me"],
    ["GET", "cors", "https://stryk.games/home?_rsc=123"],
    ["GET", "navigate", "https://clerk.accounts.dev/sign-in"],
  ]) {
    let intercepted = false;
    handlers.fetch({ request: { method, mode, url }, respondWith() { intercepted = true; } });
    assert.equal(intercepted, false, url);
  }
  let result;
  handlers.fetch({
    request: { method: "GET", mode: "navigate", url: "https://stryk.games/home" },
    respondWith(value) { result = value; },
  });
  assert.equal(await (await result).text(), "offline screen");
  assert.equal(networkCalls, 1);
  console.log("PWA worker checks passed: API/auth/RSC bypass; navigation offline fallback.");
}
test().catch((error) => { console.error(error); process.exitCode = 1; });
