import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyAccessTokenMiddleware } from '../lib/jwt.js';

const router = Router();
router.use(verifyAccessTokenMiddleware);

router.get('/online', async (_req, res) => {
  const users = await prisma.user.findMany({ where: { status: 'ONLINE' }, select: { id: true, username: true, avatarUrl: true } });
  res.json(users);
});

export default router;

