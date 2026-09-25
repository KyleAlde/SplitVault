const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient, Prisma } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/splitvault?schema=public';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn('JWT_SECRET is not configured; authentication routes will reject requests.');
}

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const toNumber = (value) => Number(value);
const userView = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role });
const poolView = (pool) => ({
  id: pool.id,
  name: pool.name,
  description: pool.description,
  totalBudget: toNumber(pool.totalBudget),
});

function signToken(user) {
  if (!JWT_SECRET) throw new ApiError(500, 'Authentication is not configured');
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '8h' });
}

async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) throw new ApiError(401, 'Authentication required');
    if (!JWT_SECRET) throw new ApiError(500, 'Authentication is not configured');
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new ApiError(401, 'Invalid authentication token');
    req.user = user;
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, 'Invalid authentication token'));
  }
}

function requireAdmin(req, _res, next) {
  if (req.user.role !== 'ADMIN') return next(new ApiError(403, 'Administrator access required'));
  next();
}

async function membership(poolId, userId) {
  const member = await prisma.budgetPoolMember.findUnique({
    where: { poolId_userId: { poolId, userId } },
  });
  if (!member) throw new ApiError(403, 'You are not a member of this budget pool');
  return member;
}

async function writeAudit(tx, data) {
  return tx.auditLog.create({ data });
}

function validateClaimInput(body) {
  const amount = Number(body?.amount);
  if (!body?.title || !Number.isFinite(amount) || amount <= 0) throw new ApiError(400, 'Title and a positive amount are required');
  if (!body?.categoryId) throw new ApiError(400, 'A category is required');
  if (!body?.receipt?.filePath) throw new ApiError(400, 'Receipt filePath is required');
  return amount;
}

function remainingBudget(totalBudget, totalSpent) {
  return Math.max(0, Number(totalBudget) - Number(totalSpent));
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'SplitVault Backend is running!' });
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password || password.length < 8) {
      throw new ApiError(400, 'Name, email, and a password of at least 8 characters are required');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase().trim(), passwordHash, role: 'CONTRIBUTOR' },
    });
    res.status(201).json({ user: userView(user), token: signToken(user) });
  } catch (error) {
    if (error.code === 'P2002') return next(new ApiError(409, 'Email is already registered'));
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const password = String(req.body?.password || '');
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new ApiError(401, 'Invalid email or password');
    }
    res.json({ user: userView(user), token: signToken(user) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/me', authenticate, (req, res) => res.json({ user: userView(req.user) }));

app.get('/api/pools', authenticate, async (req, res, next) => {
  try {
    const pools = await prisma.budgetPool.findMany({
      where: { members: { some: { userId: req.user.id } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ pools: pools.map(poolView) });
  } catch (error) { next(error); }
});

app.get('/api/pools/:poolId', authenticate, async (req, res, next) => {
  try {
    await membership(req.params.poolId, req.user.id);
    const pool = await prisma.budgetPool.findUnique({
      where: { id: req.params.poolId },
      include: { categories: { orderBy: { name: 'asc' } } },
    });
    if (!pool) throw new ApiError(404, 'Budget pool not found');
    res.json({
      pool: { ...poolView(pool), categories: pool.categories.map((category) => ({ ...category, budget: toNumber(category.budget) })) },
    });
  } catch (error) { next(error); }
});

app.post('/api/pools', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { name, description, totalBudget } = req.body || {};
    const budget = Number(totalBudget);
    if (!name || !Number.isFinite(budget) || budget <= 0) throw new ApiError(400, 'Name and a positive totalBudget are required');
    const pool = await prisma.$transaction(async (tx) => {
      const created = await tx.budgetPool.create({ data: { name, description, totalBudget: budget } });
      await tx.budgetPoolMember.create({ data: { poolId: created.id, userId: req.user.id, role: 'ADMIN' } });
      await writeAudit(tx, { action: 'POOL_CREATED', userId: req.user.id, poolId: created.id, details: { name, totalBudget: budget } });
      return created;
    });
    res.status(201).json({ pool: poolView(pool) });
  } catch (error) { next(error); }
});

app.patch('/api/pools/:poolId', authenticate, async (req, res, next) => {
  try {
    await membership(req.params.poolId, req.user.id);
    if (req.user.role !== 'ADMIN') throw new ApiError(403, 'Administrator access required');
    const data = {};
    if (typeof req.body?.name === 'string' && req.body.name.trim()) data.name = req.body.name.trim();
    if (typeof req.body?.description === 'string') data.description = req.body.description;
    if (!Object.keys(data).length) throw new ApiError(400, 'No valid pool fields supplied');
    const pool = await prisma.$transaction(async (tx) => {
      const updated = await tx.budgetPool.update({ where: { id: req.params.poolId }, data });
      await writeAudit(tx, { action: 'POOL_UPDATED', userId: req.user.id, poolId: updated.id, details: data });
      return updated;
    });
    res.json({ pool: poolView(pool) });
  } catch (error) { next(error); }
});

app.get('/api/pools/:poolId/categories', authenticate, async (req, res, next) => {
  try {
    await membership(req.params.poolId, req.user.id);
    const categories = await prisma.category.findMany({ where: { poolId: req.params.poolId }, orderBy: { name: 'asc' } });
    res.json({ categories: categories.map((category) => ({ ...category, budget: toNumber(category.budget) })) });
  } catch (error) { next(error); }
});

app.post('/api/pools/:poolId/categories', authenticate, async (req, res, next) => {
  try {
    await membership(req.params.poolId, req.user.id);
    if (req.user.role !== 'ADMIN') throw new ApiError(403, 'Administrator access required');
    const budget = Number(req.body?.budget);
    if (!req.body?.name || !Number.isFinite(budget) || budget < 0) throw new ApiError(400, 'Name and a non-negative budget are required');
    const category = await prisma.$transaction(async (tx) => {
      const created = await tx.category.create({ data: { poolId: req.params.poolId, name: req.body.name.trim(), budget, color: req.body.color || '#425b9a' } });
      await writeAudit(tx, { action: 'CATEGORY_CREATED', userId: req.user.id, poolId: req.params.poolId, details: { name: created.name } });
      return created;
    });
    res.status(201).json({ category: { ...category, budget: toNumber(category.budget) } });
  } catch (error) {
    next(error.code === 'P2002' ? new ApiError(409, 'Category already exists in this pool') : error);
  }
});

function claimView(claim) {
  return {
    ...claim,
    amount: toNumber(claim.amount),
    category: claim.category ? { ...claim.category, budget: toNumber(claim.category.budget) } : undefined,
    claimant: claim.claimant ? userView(claim.claimant) : undefined,
    receipt: claim.receipt || undefined,
  };
}

const claimInclude = { category: true, claimant: true, receipt: true };

app.post('/api/pools/:poolId/claims', authenticate, async (req, res, next) => {
  try {
    await membership(req.params.poolId, req.user.id);
    const amount = validateClaimInput(req.body);
    const receipt = req.body.receipt;
    const category = await prisma.category.findFirst({ where: { id: req.body.categoryId, poolId: req.params.poolId } });
    if (!category) throw new ApiError(400, 'Category does not belong to this budget pool');
    const claim = await prisma.$transaction(async (tx) => {
      const created = await tx.expenseClaim.create({
        data: {
          poolId: req.params.poolId,
          categoryId: category.id,
          claimantId: req.user.id,
          title: req.body.title.trim(),
          description: req.body.description,
          amount,
          incurredAt: req.body.incurredAt ? new Date(req.body.incurredAt) : new Date(),
          receipt: { create: { filePath: receipt.filePath, fileName: receipt.fileName, mimeType: receipt.mimeType } },
        },
        include: claimInclude,
      });
      await writeAudit(tx, { action: 'CLAIM_SUBMITTED', userId: req.user.id, poolId: req.params.poolId, claimId: created.id, details: { amount } });
      return created;
    });
    res.status(201).json({ claim: claimView(claim) });
  } catch (error) { next(error); }
});

app.get('/api/pools/:poolId/claims', authenticate, async (req, res, next) => {
  try {
    await membership(req.params.poolId, req.user.id);
    const where = { poolId: req.params.poolId };
    if (req.user.role !== 'ADMIN') where.claimantId = req.user.id;
    const claims = await prisma.expenseClaim.findMany({ where, include: claimInclude, orderBy: { createdAt: 'desc' } });
    res.json({ claims: claims.map(claimView) });
  } catch (error) { next(error); }
});

app.get('/api/claims/:claimId', authenticate, async (req, res, next) => {
  try {
    const claim = await prisma.expenseClaim.findUnique({ where: { id: req.params.claimId }, include: claimInclude });
    if (!claim) throw new ApiError(404, 'Expense claim not found');
    await membership(claim.poolId, req.user.id);
    if (req.user.role !== 'ADMIN' && claim.claimantId !== req.user.id) throw new ApiError(403, 'You cannot view this claim');
    res.json({ claim: claimView(claim) });
  } catch (error) { next(error); }
});

async function reviewClaim(req, res, next, status) {
  try {
    const claim = await prisma.expenseClaim.findUnique({ where: { id: req.params.claimId }, include: claimInclude });
    if (!claim) throw new ApiError(404, 'Expense claim not found');
    await membership(claim.poolId, req.user.id);
    if (req.user.role !== 'ADMIN') throw new ApiError(403, 'Administrator access required');
    if (claim.status !== 'PENDING') throw new ApiError(409, 'Only pending claims can be reviewed');
    const updated = await prisma.$transaction(async (tx) => {
      if (status === 'APPROVED') {
        const approved = await tx.expenseClaim.aggregate({ _sum: { amount: true }, where: { poolId: claim.poolId, status: 'APPROVED' } });
        const pool = await tx.budgetPool.findUnique({ where: { id: claim.poolId } });
        const spent = Number(approved._sum.amount || 0);
        if (spent + Number(claim.amount) > Number(pool.totalBudget)) throw new ApiError(409, 'Insufficient remaining budget');
      }
      const result = await tx.expenseClaim.update({
        where: { id: claim.id },
        data: { status, reviewerId: req.user.id, reviewNote: req.body?.reviewNote, approvedAt: status === 'APPROVED' ? new Date() : null },
        include: claimInclude,
      });
      await writeAudit(tx, { action: status === 'APPROVED' ? 'CLAIM_APPROVED' : 'CLAIM_REJECTED', userId: req.user.id, poolId: claim.poolId, claimId: claim.id, details: { reviewNote: req.body?.reviewNote } });
      return result;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    res.json({ claim: claimView(updated) });
  } catch (error) { next(error); }
}

app.post('/api/claims/:claimId/approve', authenticate, (req, res, next) => reviewClaim(req, res, next, 'APPROVED'));
app.post('/api/claims/:claimId/reject', authenticate, (req, res, next) => reviewClaim(req, res, next, 'REJECTED'));

app.get('/api/pools/:poolId/dashboard', authenticate, async (req, res, next) => {
  try {
    await membership(req.params.poolId, req.user.id);
    const pool = await prisma.budgetPool.findUnique({ where: { id: req.params.poolId }, include: { categories: true } });
    if (!pool) throw new ApiError(404, 'Budget pool not found');
    const grouped = await prisma.expenseClaim.groupBy({ by: ['categoryId'], where: { poolId: pool.id, status: 'APPROVED' }, _sum: { amount: true } });
    const spentByCategory = new Map(grouped.map((item) => [item.categoryId, toNumber(item._sum.amount || 0)]));
    const totalSpent = [...spentByCategory.values()].reduce((sum, amount) => sum + amount, 0);
    res.json({
      totalBudget: toNumber(pool.totalBudget),
      totalSpent,
      remainingBalance: remainingBudget(pool.totalBudget, totalSpent),
      categoryBreakdown: pool.categories.map((category) => ({ name: category.name, budget: toNumber(category.budget), spent: spentByCategory.get(category.id) || 0, color: category.color })),
    });
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return res.status(404).json({ error: 'Resource not found' });
  }
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : error.message });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
}

module.exports = { app, prisma, ApiError, validateClaimInput, remainingBudget };
