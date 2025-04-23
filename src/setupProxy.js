const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
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
        console.error('Proxy error:', err);
        res.writeHead(502, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ 
          status: 'error', 
          message: 'Failed to connect to Ollama service',
          error: err.message
        }));
      },
      // Log all requests to see what's happening
      onProxyReq: (proxyReq, req, res) => {
        console.log(`Proxying request: ${req.method} ${req.path} → ${proxyReq.path}`);
      },
      // Log responses
      onProxyRes: (proxyRes, req, res) => {
        console.log(`Proxy response: ${req.method} ${req.path} → ${proxyRes.statusCode}`);
      },
      // Log proxy activity
      logLevel: 'debug'
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
