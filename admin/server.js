// ============================================================================
// CRICKETADDA PRO - WEB ADMIN PANEL HTTP SERVER
// Zero external dependencies - runs on vanilla Node.js
// ============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.ADMIN_PORT || 3000;
const ADMIN_DIR = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
  // Global CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString(), port: PORT }));
    return;
  }

  // Parse URL & resolve file path
  let parsedUrl = req.url.split('?')[0];
  if (parsedUrl === '/' || parsedUrl === '') {
    parsedUrl = '/index.html';
  }

  let filePath = path.join(ADMIN_DIR, parsedUrl);

  // Security check: prevent directory traversal
  if (!filePath.startsWith(ADMIN_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA client-side routing
      const fallbackIndex = path.join(ADMIN_DIR, 'index.html');
      fs.readFile(fallbackIndex, (fallbackErr, content) => {
        if (fallbackErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error: ' + readErr.message);
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      });
      res.end(data);
    });
  });
});

if (process.argv.includes('--test')) {
  console.log('[Admin Server] Syntax check OK.');
  process.exit(0);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log('================================================================');
  console.log('  🏏 CRICKETADDA PRO - WEB ADMIN PANEL IS LIVE');
  console.log(`  🔗 Local Access:    http://localhost:${PORT}`);
  console.log(`  🌐 Network Access:  http://127.0.0.1:${PORT}`);
  console.log('  ⚡ Real-Time Cloud Sync: Firebase RTDB (cricketadda-live)');
  console.log('================================================================');
});
