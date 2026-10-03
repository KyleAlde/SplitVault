const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

require('dotenv').config();
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be configured before seeding.');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const fixturePassword = 'SplitVault123!';

const users = [
  { name: 'Kyle Alde', email: 'admin@splitvault.local', role: 'ADMIN' },
  { name: 'Maria Santos', email: 'maria.santos@splitvault.local', role: 'CONTRIBUTOR' },
  { name: 'Patricia Lim', email: 'patricia.lim@splitvault.local', role: 'CONTRIBUTOR' },
  { name: 'Alex Reyes', email: 'alex.reyes@splitvault.local', role: 'CONTRIBUTOR' },
  { name: 'Gabriel Gomez', email: 'gabriel.gomez@splitvault.local', role: 'CONTRIBUTOR' },
  { name: 'Juan Dela Cruz', email: 'juan.delacruz@splitvault.local', role: 'CONTRIBUTOR' },
  { name: 'Rene Garcia', email: 'rene.garcia@splitvault.local', role: 'CONTRIBUTOR' },
  { name: 'Carlos Mendoza', email: 'carlos.mendoza@splitvault.local', role: 'CONTRIBUTOR' },
  { name: 'Bea Alonzo', email: 'bea.alonzo@splitvault.local', role: 'CONTRIBUTOR' },
  { name: 'Dev Team Lead', email: 'dev.team.lead@splitvault.local', role: 'CONTRIBUTOR' },
  { name: 'John Tan', email: 'john.tan@splitvault.local', role: 'CONTRIBUTOR' },
];

const pools = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Annual Hackathon 2026',
    description: 'Development pool for the annual organization hackathon.',
    organizationName: 'NU CS Society',
    totalBudget: 150000,
    categories: [
      { name: 'Venue & Catering', budget: 60000, color: '#059669' },
      { name: 'Swag & Merchandise', budget: 40000, color: '#425b9a' },
      { name: 'Prizes & Tokens', budget: 30000, color: '#f59e0b' },
      { name: 'Logistics & Equipment', budget: 20000, color: '#3b82f6' },
    ],
    claims: [
      ['101', 'Venue Downpayment (50%)', 'Maria Santos', 'Venue & Catering', 15000, '2026-09-10', 'APPROVED'],
      ['102', 'Day 1 Lunch Buffets', 'Maria Santos', 'Venue & Catering', 12000, '2026-09-15', 'APPROVED'],
      ['103', 'Tables & Chairs Rental', 'Patricia Lim', 'Venue & Catering', 5000, '2026-09-16', 'APPROVED'],
      ['104', 'Custom T-Shirts (Batch 1)', 'Alex Reyes', 'Swag & Merchandise', 10000, '2026-09-18', 'APPROVED'],
      ['105', 'Lanyards and ID PVC Printing', 'Alex Reyes', 'Swag & Merchandise', 4500, '2026-09-20', 'APPROVED'],
      ['106', 'Die-cut Laptop Stickers', 'Gabriel Gomez', 'Swag & Merchandise', 4000, '2026-09-21', 'APPROVED'],
      ['107', 'Winner Acrylic Trophies', 'Juan Dela Cruz', 'Prizes & Tokens', 5000, '2026-09-22', 'APPROVED'],
      ['108', 'Consolation Gift Vouchers', 'Juan Dela Cruz', 'Prizes & Tokens', 3000, '2026-09-22', 'APPROVED'],
      ['109', 'Heavy Duty Extension Cords', 'Patricia Lim', 'Logistics & Equipment', 1500, '2026-09-23', 'APPROVED'],
      ['110', 'HDMI Splitters & Cables', 'Patricia Lim', 'Logistics & Equipment', 1000, '2026-09-24', 'APPROVED'],
      ['111', 'Walkie Talkies (Rental)', 'Patricia Lim', 'Logistics & Equipment', 1500, '2026-09-24', 'APPROVED'],
      ['112', 'Day 2 Meals & PM Snacks', 'Maria Santos', 'Venue & Catering', 8000, '2026-09-25', 'PENDING'],
      ['113', 'Grand Prize Cash Pool', 'Juan Dela Cruz', 'Prizes & Tokens', 5000, '2026-09-25', 'PENDING'],
      ['114', 'Projector & Screen Rental', 'Patricia Lim', 'Logistics & Equipment', 1500, '2026-09-26', 'PENDING'],
      ['115', 'Extra Hackathon Hoodies', 'Alex Reyes', 'Swag & Merchandise', 5500, '2026-09-26', 'PENDING'],
      ['116', 'Coffee Bar Station Deposit', 'Maria Santos', 'Venue & Catering', 2000, '2026-09-26', 'PENDING'],
    ],
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'General Membership Assembly',
    description: 'Budget pool for the general membership assembly.',
    organizationName: 'NU CS Society',
    totalBudget: 45000,
    categories: [
      { name: 'Food & Refreshments', budget: 25000, color: '#059669' },
      { name: 'Certificates & Prints', budget: 10000, color: '#f59e0b' },
      { name: 'Speaker Tokens', budget: 10000, color: '#425b9a' },
    ],
    claims: [
      ['201', 'AM Snacks (Pastries Box)', 'Rene Garcia', 'Food & Refreshments', 3500, '2026-09-18', 'APPROVED'],
      ['202', 'Packed Lunch Set for Members', 'Rene Garcia', 'Food & Refreshments', 8000, '2026-09-19', 'APPROVED'],
      ['203', 'Bottled Water & Brewed Coffee', 'Rene Garcia', 'Food & Refreshments', 3000, '2026-09-19', 'APPROVED'],
      ['204', 'Specialty Paper (10 packs)', 'Carlos Mendoza', 'Certificates & Prints', 1500, '2026-09-20', 'APPROVED'],
      ['205', 'Printer Ink Replacements', 'Carlos Mendoza', 'Certificates & Prints', 1800, '2026-09-21', 'APPROVED'],
      ['206', 'Main Stage Tarpaulin Banner', 'Carlos Mendoza', 'Certificates & Prints', 1000, '2026-09-22', 'APPROVED'],
      ['207', 'Plaque & Basket (Keynote 1)', 'Bea Alonzo', 'Speaker Tokens', 1500, '2026-09-24', 'APPROVED'],
      ['208', 'Plaque & Basket (Keynote 2)', 'Bea Alonzo', 'Speaker Tokens', 1500, '2026-09-24', 'APPROVED'],
      ['209', 'PM Snacks (Pizza Delivery)', 'Rene Garcia', 'Food & Refreshments', 2500, '2026-09-25', 'PENDING'],
      ['210', 'Photo Booth Backdrop Print', 'Carlos Mendoza', 'Certificates & Prints', 700, '2026-09-26', 'PENDING'],
    ],
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Tech Workshops & Bootcamps',
    description: 'Budget pool for technology workshops and bootcamps.',
    organizationName: 'NU CS Society',
    totalBudget: 35000,
    categories: [
      { name: 'Software & Hosting', budget: 15000, color: '#425b9a' },
      { name: 'Workshop Snacks', budget: 20000, color: '#059669' },
    ],
    claims: [
      ['301', 'Org Web Domain (1 Year)', 'Dev Team Lead', 'Software & Hosting', 800, '2026-09-10', 'APPROVED'],
      ['302', 'AWS Cloud Hosting (Q3)', 'Dev Team Lead', 'Software & Hosting', 2500, '2026-09-15', 'APPROVED'],
      ['303', 'Zoom Pro License Upgrade', 'Dev Team Lead', 'Software & Hosting', 1500, '2026-09-15', 'APPROVED'],
      ['304', 'Git Workshop (Pizza)', 'John Tan', 'Workshop Snacks', 2000, '2026-09-18', 'APPROVED'],
      ['305', 'React Basics (Donuts/Coffee)', 'John Tan', 'Workshop Snacks', 1500, '2026-09-19', 'APPROVED'],
      ['306', 'UI/UX Session (Sandwiches)', 'John Tan', 'Workshop Snacks', 1500, '2026-09-20', 'APPROVED'],
      ['307', 'Figma Pro Seats (Design Team)', 'Dev Team Lead', 'Software & Hosting', 3000, '2026-09-25', 'PENDING'],
      ['308', 'Next.js Workshop (Pancit & Drinks)', 'John Tan', 'Workshop Snacks', 1500, '2026-09-26', 'PENDING'],
    ],
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(fixturePassword, 12);
  const usersByName = new Map();
  for (const fixture of users) {
    const user = await prisma.user.upsert({
      where: { email: fixture.email },
      update: { name: fixture.name, passwordHash, role: fixture.role },
      create: { ...fixture, passwordHash },
    });
    usersByName.set(fixture.name, user);
  }

  const admin = usersByName.get('Kyle Alde');
  for (const poolFixture of pools) {
    const pool = await prisma.budgetPool.upsert({
      where: { id: poolFixture.id },
      update: {
        name: poolFixture.name,
        description: poolFixture.description,
        organizationName: poolFixture.organizationName,
        totalBudget: poolFixture.totalBudget,
      },
      create: {
        id: poolFixture.id,
        name: poolFixture.name,
        description: poolFixture.description,
        organizationName: poolFixture.organizationName,
        totalBudget: poolFixture.totalBudget,
      },
    });

    const categoriesByName = new Map();
    for (const categoryFixture of poolFixture.categories) {
      const category = await prisma.category.upsert({
        where: { poolId_name: { poolId: pool.id, name: categoryFixture.name } },
        update: { budget: categoryFixture.budget, color: categoryFixture.color },
        create: { ...categoryFixture, poolId: pool.id },
      });
      categoriesByName.set(categoryFixture.name, category);
    }

    for (const user of users) {
      const dbUser = usersByName.get(user.name);
      await prisma.budgetPoolMember.upsert({
        where: { poolId_userId: { poolId: pool.id, userId: dbUser.id } },
        update: { role: user.role },
        create: { poolId: pool.id, userId: dbUser.id, role: user.role },
      });
    }

    for (const [claimNumber, title, claimantName, categoryName, amount, date, status] of poolFixture.claims) {
      const id = `00000000-0000-0000-0000-000000000${claimNumber}`;
      const incurredAt = new Date(`${date}T12:00:00.000Z`);
      const category = categoriesByName.get(categoryName);
      const claimant = usersByName.get(claimantName);
      const receipt = {
        filePath: `receipts/${id}.pdf`,
        fileName: `${title}.pdf`,
        mimeType: 'application/pdf',
      };
      const claimData = {
        poolId: pool.id,
        categoryId: category.id,
        claimantId: claimant.id,
        reviewerId: status === 'PENDING' ? null : admin.id,
        title,
        description: null,
        amount,
        incurredAt,
        status,
        reviewNote: null,
        approvedAt: status === 'APPROVED' ? incurredAt : null,
      };

      await prisma.expenseClaim.upsert({
        where: { id },
        update: {
          ...claimData,
          receipt: { upsert: { create: receipt, update: receipt } },
        },
        create: {
          id,
          ...claimData,
          receipt: { create: receipt },
        },
      });
    }
  }

  console.log(`Seeded ${users.length} users, ${pools.length} budget pools, and ${pools.reduce((total, pool) => total + pool.claims.length, 0)} claims.`);
  console.log('Development account: admin@splitvault.local');
  console.log('Fixture password is configured in prisma/seed.js.');
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => prisma.$disconnect());
