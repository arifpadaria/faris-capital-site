'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '../dist');
const config = require('../firebase.json').hosting;
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.xml': 'application/xml', '.txt': 'text/plain' };
if (!fs.existsSync(path.join(root, '.faris-build'))) throw new Error('Run node scripts/build-public.js first');
http.createServer((req, res) => {
  for (const header of config.headers[0].headers) if (header.key !== 'Cache-Control') res.setHeader(header.key, header.value);
  res.setHeader('Cache-Control', 'no-store');
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (urlPath.split('/').some(part => part.startsWith('.') || part.includes('\\'))) { res.writeHead(404); res.end(); return; }
    const redirect = config.redirects.find(r => r.source === urlPath);
    if (redirect) { res.writeHead(redirect.type, { Location: redirect.destination }); res.end(); return; }
    let file = path.join(root, urlPath === '/' ? 'index.html' : urlPath.slice(1));
    let status = 200;
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { file = path.join(root, '404.html'); status = 404; }
    res.writeHead(status, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    if (req.method === 'HEAD') res.end(); else fs.createReadStream(file).pipe(res);
  } catch { res.writeHead(400); res.end(); }
}).listen(8766, '127.0.0.1', () => console.log('Local preview: http://127.0.0.1:8766'));
