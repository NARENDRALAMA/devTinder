const socket = require("socket.io");

const crypto = require("crypto");
const { ListTemplatesCommand } = require("@aws-sdk/client-ses");
const { Chat } = require("../models/chat");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

const getSecretRoomId = (userId, targetUserId) => {
  return crypto
    .createHash("sha256")
    .update([userId, targetUserId].sort().join("-"))
    .digest("hex");
};

const onlineUsers = new Map();

const initialiseSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173",
    },
  });

  io.on("connection", (socket) => {
    //Handle events

    socket.on(
      "joinChat",
      async ({ firstName, lastName, userId, targetUserId }) => {
        const roomId = getSecretRoomId(userId, targetUserId);

        //Marking the user as online
        onlineUsers.set(userId, socket.id);

        console.log(userId + " is online with socket id :" + socket.id);

        //Updating lastSeen to null when user is online
        await User.findByIdAndUpdate(userId, { lastSeen: null });

        //Joining the chat room
        socket.join(roomId);
        console.log(firstName + " Joined Room :" + roomId);

        //Notify everyone in the room that user is online

        io.to(roomId).emit("userOnlineStatus", {
          userId: userId,
          isOnline: true,
          lastSeen: null,
        });

        //Checking if the target user is online and sending their status back

        const targetUser = await User.findById(targetUserId);
        const isTargetOnline = onlineUsers.has(targetUserId);

        console.log("Target user online status:", {
          targetUserId,
          isOnline: isTargetOnline,
          lastSeen: targetUser.lastSeen,
        });

        socket.emit("userOnlineStatus", {
          userId: targetUserId,
          isOnline: isTargetOnline,
          lastSeen: targetUser.lastSeen,
        });

        try {
          const chat = await Chat.findOne({
            participants: { $all: [userId, targetUserId] },
          });

          if (chat) {
            let hasUpdates = false;

            chat.messages.forEach((msg) => {
              if (
                msg.senderId.toString() === targetUserId &&
                msg.status == "sent"
              ) {
                msg.status = "delivered";
                msg.deliveredAt = new Date();
                hasUpdates = true;
              }
            });

            if (hasUpdates) {
              await chat.save();

              io.to(roomId).emit("messagesDelivered", {
                userId: userId,
              });
            }
          }
        } catch (err) {
          console.log("Error updating message status:", err);
        }
      }
    );

    socket.on(
      "sendMessage",
      async ({ firstName, lastName, photoUrl, userId, targetUserId, text }) => {
        //Save message to the database

        try {
          const roomId = getSecretRoomId(userId, targetUserId);
          console.log(firstName + " " + text);

          //Checking if the userId and targetUserId are friends:

          const areFriends = await ConnectionRequest.findOne({
            status: "accepted",
            $or: [
              { fromUserId: userId, toUserId: targetUserId },
              { fromUserId: targetUserId, toUserId: userId },
            ],
          });

          if (!areFriends) {
            console.log("Users are not friends. Message not sent.");
            return;
          }

          let chat = await Chat.findOne({
            participants: { $all: [userId, targetUserId] },
          });

          if (!chat) {
            chat = new Chat({
              participants: [userId, targetUserId],
              messages: [],
            });
          }

          const isTargetOnline = onlineUsers.has(targetUserId);

          const messageStatus = isTargetOnline ? "delivered" : "sent";

          chat.messages.push({
            senderId: userId,
            text,
            status: messageStatus,
            deliveredAt: isTargetOnline ? new Date() : null,
          });

          await chat.save();

          const lastMessage = chat.messages[chat.messages.length - 1];

          io.to(roomId).emit("messageReceived", {
            messageId: lastMessage._id,
            firstName,
            lastName,
            photoUrl,
            text,
            createdAt: lastMessage.createdAt,
            status: lastMessage.status,
            deliveredAt: lastMessage.deliveredAt,
            seenAt: lastMessage.seenAt,
          });
        } catch (err) {
          console.log(err);
        }
      }
    );

    socket.on("markAsSeen", async ({ userId, targetUserId }) => {
      try {
        const roomId = getSecretRoomId(userId, targetUserId);

        const chat = await Chat.findOne({
          participants: { $all: [userId, targetUserId] },
        });

        if (chat) {
          let hasUpdates = false;

          chat.messages.forEach((msg) => {
            if (
              msg.senderId.toString() === targetUserId &&
              msg.status != "seen"
            ) {
              msg.status = "seen";
              msg.seenAt = new Date();
              hasUpdates = true;
            }
          });

          if (hasUpdates) {
            await chat.save();

            io.to(roomId).emit("messagesSeen", {
              userId: userId,
            });
          }
        }
      } catch (err) {
        console.log("Error in markAsSeen:", err);
      }
    });

    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.id);

      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId == socket.id) {
          console.log("User went offline", userId);

          onlineUsers.delete(userId);

          const lastSeen = new Date();

          await User.findByIdAndUpdate(userId, { lastSeen });

          //Notify all rooms that the user is offline now

          io.emit("userOnlineStatus", {
            userId,
            isOnline: false,
            lastSeen,
          });

          break;
        }
      }

      console.log("Currently online users:", Array.from(onlineUsers.keys()));
    });
  });
};

module.exports = initialiseSocket;
