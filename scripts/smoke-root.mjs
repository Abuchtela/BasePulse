// Run after pnpm build. Exercise the real production server without enabling trades.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

const probe = createServer();
await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
let output = '';
const server = spawn(process.execPath, ['dist/index.js'], {
  env: { ...process.env, NODE_ENV: 'production', BASEPULSE_AGENT_ENABLED: 'false', PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
server.stdout.on('data', chunk => { output += chunk; });
server.stderr.on('data', chunk => { output += chunk; });
const exited = new Promise(resolve => server.once('exit', resolve));
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    assert.equal(server.exitCode, null, `Server exited before listening:\n${output}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/healthz`, { signal: AbortSignal.timeout(1000) });
      assert.equal(response.status, 200);
      const health = await response.json();
      assert.equal(health.service, 'basepulse');
      assert.equal(health.agentEnabled, false);
      ready = true;
      break;
    } catch { await delay(100); }
  }
  assert.ok(ready, `Server did not become healthy:\n${output}`);
  console.log('/healthz: 200, autonomous agent disabled');
  for (const route of ['/', '/dashboard', '/registry', '/smoke/nested-route']) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get('content-type') ?? '', /text\/html/);
    const html = await response.text();
    assert.match(html, /id="root"/);
    const asset = html.match(/src="([^\"]+\/assets\/[^\"]+\.js|\/assets\/[^\"]+\.js)"/);
    assert.ok(asset, `Missing bundled JavaScript on ${route}`);
    const js = await fetch(new URL(asset[1], `http://127.0.0.1:${port}`));
    assert.equal(js.status, 200);
    assert.match(js.headers.get('content-type') ?? '', /javascript/);
    console.log(`${route}: 200, app HTML and JavaScript served`);
  }
} finally {
  server.kill('SIGTERM');
  await exited;
}
