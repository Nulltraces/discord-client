import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyAccessTokenMiddleware } from '../lib/jwt.js';

const router = Router();
router.use(verifyAccessTokenMiddleware);

router.get('/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    const membership = await prisma.serverMember.findUnique({
      where: { userId_serverId: { userId: req.user.id, serverId: channel.serverId } }
    });
    if (!membership) return res.status(403).json({ error: 'Forbidden' });
    const messages = await prisma.message.findMany({
      where: { channelId },
      include: { author: { select: { id: true, username: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    const membership = await prisma.serverMember.findUnique({
      where: { userId_serverId: { userId: req.user.id, serverId: channel.serverId } }
    });
    if (!membership) return res.status(403).json({ error: 'Forbidden' });
    const message = await prisma.message.create({ data: { content, channelId, authorId: req.user.id } });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create message' });
  }
});

router.put('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: 'Not found' });
    if (message.authorId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const updated = await prisma.message.update({ where: { id: messageId }, data: { content } });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message' });
  }
});

router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: 'Not found' });
    if (message.authorId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await prisma.message.delete({ where: { id: messageId } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;

