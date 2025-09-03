import TryCatch from "../config/TryCatch.js";
import { Chat } from "../models/chat.js";
// import { getRecieverSocketId, io } from "../config/socket.js";
export const createNewChat = TryCatch(async (req, res) => {
    const userId = req.user?._id;
    const { otherUserId } = req.body;
    if (!otherUserId) {
        res.status(400).json({
            message: "Other userid is required",
        });
        return;
    }
    const existingChat = await Chat.findOne({
        users: { $all: [userId, otherUserId], $size: 2 },
    });
    if (existingChat) {
        res.json({
            message: "Chat already exitst",
            chatId: existingChat._id,
        });
        return;
    }
    const newChat = await Chat.create({
        users: [userId, otherUserId],
    });
    res.status(201).json({
        message: "New Chat created",
        chatId: newChat._id,
    });
});
