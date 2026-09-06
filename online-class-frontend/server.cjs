const fs = require('fs');
const path = require('path');
const http = require('http');

const root = path.resolve(__dirname, 'dist');
const port = Number(process.env.PORT) || 3000;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function sendFile(res, filePath, statusCode = 200) {
  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }

    const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(statusCode, { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=0, must-revalidate' });

    if (res.req.method === 'HEAD') return res.end();

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      if (!res.headersSent) res.writeHead(500);
      res.end('Internal server error');
    });
    stream.pipe(res);
  });
}

const server = http.createServer((req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      return res.end('Method not allowed');
    }

    const rawPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const requestedPath = rawPath === '/' ? '/index.html' : rawPath;
    const normalized = path.normalize(requestedPath).replace(/^([/\\])+/, '');
    let filePath = path.resolve(root, normalized);

    if (!filePath.startsWith(root + path.sep) && filePath !== root) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Forbidden');
    }

    fs.stat(filePath, (error, stats) => {
      if (!error && stats.isFile()) {
        return sendFile(res, filePath);
      }

      // React Router client-side routes should resolve to index.html.
      // Asset-looking paths that do not exist should remain 404.
      if (!path.extname(normalized)) {
        filePath = path.join(root, 'index.html');
        return sendFile(res, filePath);
      }

      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    });
  } catch (error) {
    console.error('Request error:', error);
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal server error');
  }
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Frontend listening on 0.0.0.0:${port}`);
});
