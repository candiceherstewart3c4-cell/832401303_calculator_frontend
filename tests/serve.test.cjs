'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');

test('standalone frontend serves the page and supports a separately hosted API', async () => {
  const reservation = net.createServer();
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'serve.cjs')], {
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', CALCULATOR_API_URL: 'https://api.example.invalid/api/' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const exited = new Promise(resolve => child.once('exit', resolve));
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Frontend startup timed out.')), 5000);
      child.once('error', error => { clearTimeout(timeout); reject(error); });
      child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Frontend exited: ${code}`)); });
      child.stdout.once('data', () => { clearTimeout(timeout); resolve(); });
    });
    const base = `http://127.0.0.1:${port}`;
    const page = await fetch(base);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /id="expressionInput"/);
    const config = await fetch(`${base}/scripts/config.js`);
    assert.equal(config.status, 200);
    assert.equal(await config.text(), 'window.CALCULATOR_API_URL = "https://api.example.invalid/api";');
    assert.equal((await fetch(`${base}/styles/main.css`)).status, 200);
    const formatter = await fetch(`${base}/scripts/number-format.js`);
    assert.equal(formatter.status, 200);
    assert.match(await formatter.text(), /CloverNumberFormat/);
    assert.equal((await fetch(`${base}/%2e%2e%2fbackend%2fsrc%2fserver.js`)).status, 403);
    assert.equal((await fetch(`${base}/.git/HEAD`)).status, 403);
    assert.equal((await fetch(`${base}/not-found`)).status, 404);
  } finally {
    child.kill();
    await exited;
  }
});
