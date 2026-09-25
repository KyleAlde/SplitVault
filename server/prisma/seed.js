const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

require('dotenv').config();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash('SplitVault123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@splitvault.local' },
    update: { passwordHash },
    create: { name: 'Kyle Alde', email: 'admin@splitvault.local', passwordHash, role: 'ADMIN' },
  });
  const contributor = await prisma.user.upsert({
    where: { email: 'contributor@splitvault.local' },
    update: { passwordHash },
    create: { name: 'Maria Santos', email: 'contributor@splitvault.local', passwordHash, role: 'CONTRIBUTOR' },
  });

  const pool = await prisma.budgetPool.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Annual Hackathon 2026',
      description: 'Development pool for the annual organization hackathon.',
      totalBudget: 150000,
    },
  });

  await prisma.budgetPoolMember.upsert({
    where: { poolId_userId: { poolId: pool.id, userId: admin.id } },
    update: { role: 'ADMIN' },
    create: { poolId: pool.id, userId: admin.id, role: 'ADMIN' },
  });
  await prisma.budgetPoolMember.upsert({
    where: { poolId_userId: { poolId: pool.id, userId: contributor.id } },
    update: {},
    create: { poolId: pool.id, userId: contributor.id, role: 'CONTRIBUTOR' },
  });

  const categories = {};
  for (const item of [
    ['Venue & Catering', 60000, '#059669'],
    ['Swag & Merchandise', 40000, '#425b9a'],
    ['Prizes & Tokens', 30000, '#f59e0b'],
    ['Logistics & Equipment', 20000, '#3b82f6'],
  ]) {
    categories[item[0]] = await prisma.category.upsert({
      where: { poolId_name: { poolId: pool.id, name: item[0] } },
      update: { budget: item[1], color: item[2] },
      create: { poolId: pool.id, name: item[0], budget: item[1], color: item[2] },
    });
  }

  const existing = await prisma.expenseClaim.count({ where: { poolId: pool.id } });
  if (!existing) {
    const claims = [
      ['Catering Downpayment (Day 1 Meals)', categories['Venue & Catering'].id, 32000, 'APPROVED', admin.id],
      ['Custom Participant T-Shirts & Lanyards', categories['Swag & Merchandise'].id, 18500, 'APPROVED', admin.id],
      ['Winner Acrylic Trophies & Medals', categories['Prizes & Tokens'].id, 8000, 'PENDING', null],
      ['Extension Cords & HDMI Splitters', categories['Logistics & Equipment'].id, 4000, 'PENDING', null],
      ['Cancelled Banner Printing', categories['Swag & Merchandise'].id, 2500, 'REJECTED', admin.id],
    ];
    for (const [title, categoryId, amount, status, reviewerId] of claims) {
      await prisma.expenseClaim.create({
        data: {
          poolId: pool.id,
          categoryId,
          claimantId: contributor.id,
          reviewerId,
          title,
          amount,
          incurredAt: new Date(),
          status,
          approvedAt: status === 'APPROVED' ? new Date() : null,
          receipt: { create: { filePath: `receipts/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`, fileName: `${title}.pdf`, mimeType: 'application/pdf' } },
        },
      });
    }
  }

  console.log('Seeded SplitVault development data.');
  console.log('Admin: admin@splitvault.local / SplitVault123!');
  console.log('Contributor: contributor@splitvault.local / SplitVault123!');
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => prisma.$disconnect());
