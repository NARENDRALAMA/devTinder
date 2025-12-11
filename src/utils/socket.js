const socket = require("socket.io");

const initialiseSocket = (server) => {
  const io = socket(server, {
    cors: {
      orgin: "http://localhost:5173",
    },
  });

  io.on("connection", (socket) => {
    //Handle events

    socket.on("joinChat", () => {});

    socket.on("sendMessage", () => {});

    socket.on("disconnect", () => {});
  });
};

module.exports = initialiseSocket;
