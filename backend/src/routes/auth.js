import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';

const router = Router();

const emailSchema = z.string().email();
const passwordSchema = z.string().min(6);

router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const parsedEmail = emailSchema.safeParse(email);
    const parsedPassword = passwordSchema.safeParse(password);
    if (!parsedEmail.success || !parsedPassword.success || !username) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    const existing = await prisma.user.findUnique({ where: { email: parsedEmail.data } });
    if (existing) return res.status(409).json({ error: 'Email already in use' });
    const hashed = await bcrypt.hash(parsedPassword.data, 10);
    const user = await prisma.user.create({
      data: {
        email: parsedEmail.data,
        passwordHash: hashed,
        username,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
        status: 'OFFLINE'
      }
    });
    const accessToken = signAccessToken({ id: user.id, email: user.email, username: user.username });
    const refreshToken = signRefreshToken({ id: user.id });
    return res.status(201).json({
      user: { id: user.id, email: user.email, username: user.username, avatarUrl: user.avatarUrl, status: user.status },
      accessToken,
      refreshToken
    });
  } catch (err) {
    return res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) return res.status(400).json({ error: 'Invalid email' });
    const user = await prisma.user.findUnique({ where: { email: parsedEmail.data } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password || '', user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const accessToken = signAccessToken({ id: user.id, email: user.email, username: user.username });
    const refreshToken = signRefreshToken({ id: user.id });
    return res.json({
      user: { id: user.id, email: user.email, username: user.username, avatarUrl: user.avatarUrl, status: user.status },
      accessToken,
      refreshToken
    });
  } catch (err) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Missing refresh token' });
    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    const accessToken = signAccessToken({ id: user.id, email: user.email, username: user.username });
    return res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', async (_req, res) => {
  // Stateless JWT: client should delete tokens. This endpoint exists for symmetry.
  return res.json({ ok: true });
});

export default router;

