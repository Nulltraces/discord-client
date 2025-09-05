import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyAccessTokenMiddleware } from '../lib/jwt.js';

const router = Router();
router.use(verifyAccessTokenMiddleware);

router.get('/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    const membership = await prisma.serverMember.findUnique({
      where: { userId_serverId: { userId: req.user.id, serverId } }
    });
    if (!membership) return res.status(403).json({ error: 'Forbidden' });
    const channels = await prisma.channel.findMany({ where: { serverId } });
    res.json(channels);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

router.post('/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { name, type } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) return res.status(404).json({ error: 'Server not found' });
    // Allow owner or admins to create channels
    const membership = await prisma.serverMember.findUnique({
      where: { userId_serverId: { userId: req.user.id, serverId } }
    });
    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const channel = await prisma.channel.create({ data: { name, type: type || 'TEXT', serverId } });
    res.status(201).json(channel);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

export default router;

