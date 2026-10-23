import 'dotenv/config';
import http from 'http';
import app from './app.js';
import DBConnect from './config/db.js';
import { initSocket } from './socket/socket.js';

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Initialize Socket.io real-time engine
initSocket(server);

server.listen(PORT, async () => {
    await DBConnect();
    console.log(`Server & Socket.io running on port ${PORT}`);
});
