import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import userRoutes from './routes/user.routes.js';
import postRoutes from './routes/post.routes.js';
import storyRoutes from './routes/story.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import messageRoutes from './routes/message.routes.js';

const app = express();

app.use(
    cors({
        origin: 'https://pulsechat-realtime.netlify.app',
        credentials: true
    })
);

// Allow up to 50MB for uploading images and media via base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Mount API routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);

export default app;