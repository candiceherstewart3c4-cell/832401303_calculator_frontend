// Local static preview; deploy files through a production static host for public use.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const port = Number(process.env.PORT) || 4173;
const host = process.env.HOST || '127.0.0.1';
const configuredApi = process.env.CALCULATOR_API_URL;
if (configuredApi) {
  const url = new URL(configuredApi);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('CALCULATOR_API_URL must be an HTTP(S) API URL without credentials, query or fragment.');
  }
}
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png' };
http.createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname.split('/').some(segment => segment.startsWith('.'))) {
      response.writeHead(403); response.end('Forbidden'); return;
    }
    const target = path.resolve(__dirname, '.' + (pathname === '/' ? '/index.html' : pathname));
    const relative = path.relative(__dirname, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      response.writeHead(403); response.end('Forbidden'); return;
    }
    if (pathname === '/scripts/config.js' && configuredApi) {
      response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(`window.CALCULATOR_API_URL = ${JSON.stringify(configuredApi.replace(/\/+$/, ''))};`);
      return;
    }
    fs.readFile(target, (error, data) => {
      if (error) { response.writeHead(404); response.end('Not found'); return; }
      response.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream' });
      response.end(data);
    });
  } catch {
    response.writeHead(400); response.end('Bad request');
  }
}).listen(port, host, () => console.log(`Frontend: http://${host}:${port}`));
