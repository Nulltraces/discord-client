import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { prisma } from './lib/prisma.js';
import { verifyAccessTokenSocket } from './lib/jwt.js';

import authRouter from './routes/auth.js';
import serversRouter from './routes/servers.js';
import channelsRouter from './routes/channels.js';
import messagesRouter from './routes/messages.js';
import presenceRouter from './routes/presence.js';

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// API routes
app.use('/api/auth', authRouter);
app.use('/api/servers', serversRouter);
app.use('/api/channels', channelsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/presence', presenceRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Socket.io auth middleware
io.use(verifyAccessTokenSocket);

io.on('connection', async (socket) => {
  const userId = socket.user.id;
  await prisma.user.update({ where: { id: userId }, data: { status: 'ONLINE' } });
  io.emit('presence:update', { userId, status: 'ONLINE' });

  socket.on('channel:join', ({ channelId }) => {
    socket.join(`channel:${channelId}`);
  });

  socket.on('message:send', async ({ channelId, content }) => {
    if (!content || !channelId) return;
    const message = await prisma.message.create({
      data: { content, channelId, authorId: userId }
    });
    io.to(`channel:${channelId}`).emit('message:new', {
      id: message.id,
      content: message.content,
      channelId,
      authorId: userId,
      createdAt: message.createdAt
    });
  });

  socket.on('message:edit', async ({ messageId, content }) => {
    if (!messageId || !content) return;
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.authorId !== userId) return;
    const updated = await prisma.message.update({ where: { id: messageId }, data: { content } });
    io.to(`channel:${updated.channelId}`).emit('message:updated', updated);
  });

  socket.on('message:delete', async ({ messageId }) => {
    if (!messageId) return;
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.authorId !== userId) return;
    await prisma.message.delete({ where: { id: messageId } });
    io.to(`channel:${message.channelId}`).emit('message:deleted', { messageId });
  });

  socket.on('disconnect', async () => {
    await prisma.user.update({ where: { id: userId }, data: { status: 'OFFLINE' } });
    io.emit('presence:update', { userId, status: 'OFFLINE' });
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${PORT}`);
});

