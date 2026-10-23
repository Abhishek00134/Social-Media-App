import { Server } from 'socket.io';

let io = null;

// Map: userId (string) -> Set of socketId (strings)
const userSocketMap = new Map();

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            credentials: true
        },
        maxHttpBufferSize: 1e8 // 100 MB buffer for real-time media transfers
    });

    io.on('connection', (socket) => {
        const userId = socket.handshake.query?.userId;

        if (userId && userId !== 'undefined' && userId !== 'null') {
            const strId = String(userId);
            if (!userSocketMap.has(strId)) {
                userSocketMap.set(strId, new Set());
            }
            userSocketMap.get(strId).add(socket.id);
            console.log(`[Socket.io] Connected: user=${strId}, socket=${socket.id}`);

            // Broadcast real-time list of online user IDs
            io.emit('getOnlineUsers', Array.from(userSocketMap.keys()));
        }

        // Real-time typing indicators
        socket.on('typing', ({ receiverId }) => {
            if (!receiverId || !userId) return;
            const receiverSockets = getReceiverSocketIds(receiverId);
            receiverSockets.forEach((sockId) => {
                io.to(sockId).emit('userTyping', { senderId: String(userId) });
            });
        });

        socket.on('stopTyping', ({ receiverId }) => {
            if (!receiverId || !userId) return;
            const receiverSockets = getReceiverSocketIds(receiverId);
            receiverSockets.forEach((sockId) => {
                io.to(sockId).emit('userStopTyping', { senderId: String(userId) });
            });
        });

        // Real-time read receipt event
        socket.on('markAsRead', ({ senderId }) => {
            if (!senderId || !userId) return;
            const senderSockets = getReceiverSocketIds(senderId);
            senderSockets.forEach((sockId) => {
                io.to(sockId).emit('messagesRead', { readerId: String(userId) });
            });
        });

        socket.on('disconnect', () => {
            if (userId && userId !== 'undefined' && userId !== 'null') {
                const strId = String(userId);
                const sockets = userSocketMap.get(strId);
                if (sockets) {
                    sockets.delete(socket.id);
                    if (sockets.size === 0) {
                        userSocketMap.delete(strId);
                    }
                }
                console.log(`[Socket.io] Disconnected: user=${strId}, socket=${socket.id}`);
                // Broadcast updated online users
                io.emit('getOnlineUsers', Array.from(userSocketMap.keys()));
            }
        });
    });

    return io;
};

export const getIO = () => {
    return io;
};

export const getReceiverSocketIds = (receiverId) => {
    if (!receiverId) return [];
    const sockets = userSocketMap.get(String(receiverId));
    return sockets ? Array.from(sockets) : [];
};
