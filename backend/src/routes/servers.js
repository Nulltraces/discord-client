import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyAccessTokenMiddleware } from '../lib/jwt.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(verifyAccessTokenMiddleware);

router.get('/', async (req, res) => {
  const servers = await prisma.serverMember.findMany({
    where: { userId: req.user.id },
    include: { server: true }
  });
  res.json(servers.map(s => s.server));
});

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const server = await prisma.server.create({
      data: {
        name,
        ownerId: req.user.id,
        inviteCode: uuidv4()
      }
    });
    await prisma.serverMember.create({
      data: {
        serverId: server.id,
        userId: req.user.id,
        role: 'OWNER'
      }
    });
    await prisma.channel.create({ data: { name: 'general', serverId: server.id, type: 'TEXT' } });
    res.status(201).json(server);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create server' });
  }
});

router.post('/join', async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ error: 'Invite code required' });
    const server = await prisma.server.findUnique({ where: { inviteCode } });
    if (!server) return res.status(404).json({ error: 'Server not found' });
    const existing = await prisma.serverMember.findUnique({
      where: { userId_serverId: { userId: req.user.id, serverId: server.id } }
    });
    if (existing) return res.json(server);
    await prisma.serverMember.create({ data: { userId: req.user.id, serverId: server.id, role: 'MEMBER' } });
    res.json(server);
  } catch (err) {
    res.status(500).json({ error: 'Failed to join server' });
  }
});

router.post('/:serverId/leave', async (req, res) => {
  try {
    const { serverId } = req.params;
    const membership = await prisma.serverMember.findUnique({
      where: { userId_serverId: { userId: req.user.id, serverId } }
    });
    if (!membership) return res.status(404).json({ error: 'Not a member' });
    if (membership.role === 'OWNER') return res.status(400).json({ error: 'Owner cannot leave' });
    await prisma.serverMember.delete({ where: { userId_serverId: { userId: req.user.id, serverId } } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to leave server' });
  }
});

// Owner can set a member's role (ADMIN or MEMBER)
router.patch('/:serverId/role', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { userId, role } = req.body;
    if (!userId || !role) return res.status(400).json({ error: 'userId and role required' });
    if (!['ADMIN', 'MEMBER'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) return res.status(404).json({ error: 'Server not found' });
    if (server.ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const updated = await prisma.serverMember.update({
      where: { userId_serverId: { userId, serverId } },
      data: { role }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

router.get('/:serverId/invite', async (req, res) => {
  try {
    const { serverId } = req.params;
    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!server) return res.status(404).json({ error: 'Server not found' });
    if (server.ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (!server.inviteCode) {
      res.json({ inviteCode: null });
    } else {
      res.json({ inviteCode: server.inviteCode });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to get invite' });
  }
});

export default router;

