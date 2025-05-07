const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy for backend API
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
      secure: false,
      headers: {
        Connection: 'keep-alive'
      },
      pathRewrite: {
        '^/api': '/api', // Ensure the /api prefix is preserved when proxying to FastAPI
      },
      // Better error handling for proxy
      onError: (err, req, res) => {
        console.error('Backend API proxy error:', err);
        res.writeHead(502, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ 
          status: 'error', 
          message: 'Failed to connect to backend service',
          error: err.message
        }));
      },
      // Log all requests to see what's happening
      onProxyReq: (proxyReq, req, res) => {
        console.log(`Proxying API request: ${req.method} ${req.path} → ${proxyReq.path}`);
      },
      // Log responses
      onProxyRes: (proxyRes, req, res) => {
        console.log(`API proxy response: ${req.method} ${req.path} → ${proxyRes.statusCode}`);
      }
    })
  );

  // Proxy for Ollama API
  app.use(
    '/ollama-api',
    createProxyMiddleware({
      target: 'http://127.0.0.1:11434',
      changeOrigin: true,
      pathRewrite: {
        '^/ollama-api': '/api', 
      },
      // Better error handling for proxy
      onError: (err, req, res) => {
        console.error('Ollama proxy error:', err);
        res.writeHead(502, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ 
          status: 'error', 
          message: 'Failed to connect to Ollama service',
          error: err.message
        }));
      }
    })
  );

  // Proxy for MCP API
  app.use(
    '/mcp-api',
    createProxyMiddleware({
      target: 'http://127.0.0.1:11434',
      changeOrigin: true,
      pathRewrite: {
        '^/mcp-api': '/api', 
      },
      // Better error handling for proxy
      onError: (err, req, res) => {
        console.error('MCP proxy error:', err);
        res.writeHead(502, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ 
          status: 'error', 
          message: 'Failed to connect to MCP service',
          error: err.message
        }));
      },
      // Log all requests to see what's happening
      onProxyReq: (proxyReq, req, res) => {
        console.log(`Proxying MCP request: ${req.method} ${req.path} → ${proxyReq.path}`);
      },
      // Log responses
      onProxyRes: (proxyRes, req, res) => {
        console.log(`MCP proxy response: ${req.method} ${req.path} → ${proxyRes.statusCode}`);
      }
    })
  );
  
  // Add WebSocket proxy for dev server
  app.use(
    '/ws',
    createProxyMiddleware({
      target: 'http://127.0.0.1:3000',
      ws: true, // Enable WebSocket proxy
      changeOrigin: true,
      logLevel: 'warn'
    })
  );
};
