const http = require("http");


const middlewareStack = [];
const routeStack = [];

const app = {
  
  use: (path, handler) => {
    middlewareStack.push({ path, handler });
  },

 
  get: (path, handler) => {
    routeStack.push({ path, method: "GET", handler });
  },


  listen: (port, callback) => {
    const server = http.createServer((req, res) => {
      let index = 0;

      function next() {
        const layer = middlewareStack[index++];
        if (!layer) return handleRoute();

        if (req.url.startsWith(layer.path)) {
          layer.handler(req, res, next);
        } else {
          next();
        }
      }

 
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

      next();
    });

    server.listen(port, callback);
  },
};

module.exports = app;
