import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      passwordHash,
      username: 'alice',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=alice',
      status: 'OFFLINE'
    }
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      passwordHash,
      username: 'bob',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=bob',
      status: 'OFFLINE'
    }
  });

  const server = await prisma.server.create({
    data: {
      name: 'Demo Server',
      ownerId: alice.id,
      inviteCode: 'demo-invite-code'
    }
  });

  await prisma.serverMember.createMany({
    data: [
      { serverId: server.id, userId: alice.id, role: 'OWNER' },
      { serverId: server.id, userId: bob.id, role: 'MEMBER' }
    ],
    skipDuplicates: true
  });

  const general = await prisma.channel.create({ data: { name: 'general', serverId: server.id, type: 'TEXT' } });
  const random = await prisma.channel.create({ data: { name: 'random', serverId: server.id, type: 'TEXT' } });

  await prisma.message.createMany({
    data: [
      { content: 'Welcome to the demo server!', channelId: general.id, authorId: alice.id },
      { content: 'Hello everyone!', channelId: general.id, authorId: bob.id },
      { content: 'Random chat here', channelId: random.id, authorId: alice.id }
    ]
  });

  // eslint-disable-next-line no-console
  console.log('Seed completed');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

