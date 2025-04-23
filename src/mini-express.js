const http = require("http");

// 🔁 These are your internal stacks (like Express has)
const middlewareStack = [];
const routeStack = [];

const app = {
  // Register middleware
  use: (path, handler) => {
    middlewareStack.push({ path, handler });
  },

  // Register GET route
  get: (path, handler) => {
    routeStack.push({ path, method: "GET", handler });
  },

  // Start the server and handle requests
  listen: (port, callback) => {
    const server = http.createServer((req, res) => {
      let index = 0;

      // 🔁 Middleware engine
      function next() {
        const layer = middlewareStack[index++];
        if (!layer) return handleRoute();

        if (req.url.startsWith(layer.path)) {
          layer.handler(req, res, next);
        } else {
          next();
        }
      }

      // ✅ Route matching
      function handleRoute() {
        const route = routeStack.find(
          (r) => r.path === req.url && r.method === req.method
        );

        if (route) {
          route.handler(req, res);
        } else {
          res.statusCode = 404;
          res.end("Not Found");
        }
      }

      // 🚀 Kick it off
      next();
    });

    server.listen(port, callback);
  },
};

module.exports = app;
