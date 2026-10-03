const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('node:path');
const { PrismaClient, Prisma } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();
const { getReceiptAccessUrl, uploadFileToDrive } = require('./utils/gdrive');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/splitvault?schema=public';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const MAX_RECEIPT_SIZE = 5 * 1024 * 1024;
const RECEIPT_EXTENSIONS = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

if (!JWT_SECRET) {
  console.warn('JWT_SECRET is not configured; authentication routes will reject requests.');
}

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Malformed JSON payload' });
  }
  return _next(error);
});

const receiptUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RECEIPT_SIZE, files: 1, fields: 10, parts: 11 },
  fileFilter: (_req, file, callback) => {
    const extensions = Object.hasOwn(RECEIPT_EXTENSIONS, file.mimetype)
      ? RECEIPT_EXTENSIONS[file.mimetype]
      : null;
    const extension = path.extname(file.originalname).toLowerCase();
    if (!extensions || !extensions.includes(extension)) {
      return callback(new ApiError(400, 'Receipt must be a PNG, JPEG, WebP, or PDF file'));
    }
    callback(null, true);
  },
});

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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeText(value, { fieldName = 'Field', maxLength = 255, allowBlank = false } = {}) {
  if (typeof value !== 'string') {
    throw new ApiError(400, `${fieldName} must be a string`);
  }

  const trimmed = value.trim();
  if (!allowBlank && !trimmed) {
    throw new ApiError(400, `${fieldName} is required`);
  }
  if (trimmed.length > maxLength) {
    throw new ApiError(400, `${fieldName} must be ${maxLength} characters or fewer`);
  }

  return trimmed;
}

function normalizeEmail(value) {
  return sanitizeText(value, { fieldName: 'Email', maxLength: 254 }).toLowerCase();
}

function validateEmail(value) {
  const email = normalizeEmail(value);
  if (!EMAIL_PATTERN.test(email)) {
    throw new ApiError(400, 'Please provide a valid email address');
  }
  return email;
}

function validatePassword(value) {
  const password = sanitizeText(value, { fieldName: 'Password', maxLength: 128 });
  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long');
  }
  return password;
}

function parsePositiveNumber(value, fieldName = 'Value') {
  if (value === null || value === undefined || value === '') {
    throw new ApiError(400, `${fieldName} is required`);
  }

  const normalizedValue = typeof value === 'string' ? value.trim() : value;
  const numericValue = Number(normalizedValue);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new ApiError(400, `${fieldName} must be a positive number greater than zero`);
  }

  return numericValue;
}

function validateId(value, label = 'ID') {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new ApiError(400, `Invalid ${label}`);
  }
}

async function membership(poolId, userId) {
  validateId(poolId, 'pool ID');
  const member = await prisma.budgetPoolMember.findUnique({
    where: { poolId_userId: { poolId, userId } },
  });
  if (!member) throw new ApiError(403, 'You are not a member of this budget pool');
  return member;
}

async function requirePoolAdmin(poolId, userId) {
  const member = await membership(poolId, userId);
  if (member.role !== 'ADMIN') throw new ApiError(403, 'Administrator access required');
  return member;
}

async function requirePoolMembership(req, _res, next) {
  try {
    const poolId = req.params.poolId;
    if (!UUID_PATTERN.test(poolId)) {
      throw new ApiError(400, 'Invalid pool or category ID');
    }
    const pool = await prisma.budgetPool.findUnique({ where: { id: poolId } });
    if (!pool) throw new ApiError(400, 'Invalid pool or category ID');
    await membership(req.params.poolId, req.user.id);
    req.budgetPool = pool;
    next();
  } catch (error) {
    next(error);
  }
}

async function writeAudit(tx, data) {
  return tx.auditLog.create({ data });
}

function notificationView(notification) {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: notification.read,
    link: notification.link,
    createdAt: notification.createdAt,
  };
}

async function createNotification(tx, data) {
  if (!data?.userId || !tx?.notification || typeof tx.notification.create !== 'function') return null;

  try {
    return await tx.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link || null,
      },
    });
  } catch (error) {
    if (error?.code === 'P2021' || error?.code === 'P2003') return null;
    throw error;
  }
}

async function notifyPoolAdmins(tx, poolId, notificationData, excludeUserId = null) {
  const admins = await tx.budgetPoolMember.findMany({
    where: { poolId, role: 'ADMIN' },
    select: { userId: true },
  });

  const writes = admins
    .filter((admin) => admin.userId !== excludeUserId)
    .map((admin) => createNotification(tx, {
      ...notificationData,
      userId: admin.userId,
    }));

  return Promise.all(writes);
}

async function notifyUser(tx, userId, notificationData) {
  return createNotification(tx, { ...notificationData, userId });
}

function normalizeClaimInput(body) {
  const title = sanitizeText(body?.title, { fieldName: 'Claim title', maxLength: 160 });
  const amount = parsePositiveNumber(body?.amount, 'Claim amount');

  if (typeof body?.incurredAt !== 'string' || !body.incurredAt || Number.isNaN(Date.parse(body.incurredAt))) {
    throw new ApiError(400, 'Invalid date provided');
  }

  const description = typeof body?.description === 'string' ? body.description.trim().slice(0, 2000) : '';
  if (typeof body?.description === 'string' && description.length > 2000) {
    throw new ApiError(400, 'Description must be 2000 characters or fewer');
  }

  return { title, amount, description: description || null };
}

function validateClaimInput(body) {
  const input = normalizeClaimInput(body);
  if (typeof body?.categoryId !== 'string' || !body.categoryId.trim()) {
    throw new ApiError(400, 'Invalid category ID');
  }
  return input.amount;
}

function validateCategoryInput(body) {
  const name = sanitizeText(body?.name, { fieldName: 'Category name', maxLength: 120 });
  const budget = parsePositiveNumber(body?.budget, 'Category budget');
  return { name, budget };
}

function validateCategoryColor(color) {
  if (color === undefined || color === null || color === '') return '#425b9a';
  if (typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color)) {
    throw new ApiError(400, 'Category color must be a valid hex color');
  }
  return color;
}

function validatePoolCategories(categories) {
  if (categories === undefined) return [];
  if (!Array.isArray(categories)) throw new ApiError(400, 'Categories must be an array');

  return categories.map((category) => ({
    ...validateCategoryInput(category),
    color: validateCategoryColor(category?.color),
  }));
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
    const trimmedName = sanitizeText(name, { fieldName: 'Name', maxLength: 120 });
    const normalizedEmail = validateEmail(email);
    const validPassword = validatePassword(password);
    const passwordHash = await bcrypt.hash(validPassword, 12);
    const user = await prisma.user.create({
      data: { name: trimmedName, email: normalizedEmail, passwordHash, role: 'CONTRIBUTOR' },
    });
    res.status(201).json({ user: userView(user), token: signToken(user) });
  } catch (error) {
    if (error.code === 'P2002') return next(new ApiError(409, 'Email is already registered'));
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = validateEmail(req.body?.email);
    const password = validatePassword(req.body?.password);
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

app.get('/api/notifications', authenticate, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });
    res.json({ notifications: notifications.map(notificationView) });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/notifications/:id/read', authenticate, async (req, res, next) => {
  try {
    validateId(req.params.id, 'notification ID');
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!notification) throw new ApiError(404, 'Notification not found');

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { read: true },
    });

    res.json({ notification: notificationView(updated) });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/notifications/read-all', authenticate, async (req, res, next) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    res.json({ count: result.count, notifications: notifications.map(notificationView) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/pools', authenticate, async (req, res, next) => {
  try {
    const pools = await prisma.budgetPool.findMany({
      where: { members: { some: { userId: req.user.id } } },
      include: { members: { where: { userId: req.user.id }, select: { role: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ pools: pools.map((pool) => ({ ...poolView(pool), role: pool.members[0].role })) });
  } catch (error) { next(error); }
});

app.get('/api/pools/:poolId', authenticate, async (req, res, next) => {
  try {
    const member = await membership(req.params.poolId, req.user.id);
    const pool = await prisma.budgetPool.findUnique({
      where: { id: req.params.poolId },
      include: { categories: { orderBy: { name: 'asc' } } },
    });
    if (!pool) throw new ApiError(404, 'Budget pool not found');
    res.json({
      pool: {
        ...poolView(pool),
        role: member.role,
        categories: pool.categories.map((category) => ({ ...category, budget: toNumber(category.budget) })),
      },
    });
  } catch (error) { next(error); }
});

app.post('/api/pools', authenticate, async (req, res, next) => {
  try {
    const { name, description, totalBudget } = req.body || {};
    const budget = parsePositiveNumber(totalBudget, 'Total budget');
    const trimmedName = sanitizeText(name, { fieldName: 'Pool name', maxLength: 120 });
    const trimmedDescription = typeof description === 'string'
      ? description.trim().slice(0, 1000) || null
      : null;

    const categories = validatePoolCategories(req.body?.categories);
    const pool = await prisma.$transaction(async (tx) => {
      const created = await tx.budgetPool.create({
        data: {
          name: trimmedName,
          description: trimmedDescription,
          totalBudget: budget,
        },
      });
      if (categories.length) {
        await tx.category.createMany({
          data: categories.map((category) => ({ ...category, poolId: created.id })),
        });
      }
      await tx.budgetPoolMember.create({ data: { poolId: created.id, userId: req.user.id, role: 'ADMIN' } });
      await writeAudit(tx, { action: 'POOL_CREATED', userId: req.user.id, poolId: created.id, details: { name: trimmedName, totalBudget: budget } });
      return created;
    });
    res.status(201).json({ pool: { ...poolView(pool), role: 'ADMIN' } });
  } catch (error) {
    next(error?.code === 'P2002' ? new ApiError(409, 'Category already exists in this pool') : error);
  }
});

app.patch('/api/pools/:poolId', authenticate, async (req, res, next) => {
  try {
    const poolId = req.params.poolId;
    validateId(poolId, 'pool ID');
    const member = await requirePoolAdmin(poolId, req.user.id);
    const data = {};

    if ('name' in req.body) {
      data.name = sanitizeText(req.body.name, { fieldName: 'Pool name', maxLength: 120 });
    }
    if ('description' in req.body) {
      if (req.body.description === null || req.body.description === undefined) {
        data.description = null;
      } else if (typeof req.body.description === 'string') {
        data.description = req.body.description.trim().slice(0, 1000) || null;
      } else {
        throw new ApiError(400, 'Pool description must be a string');
      }
    }

    if (!Object.keys(data).length) throw new ApiError(400, 'No valid pool fields supplied');
    const pool = await prisma.$transaction(async (tx) => {
      const updated = await tx.budgetPool.update({ where: { id: poolId }, data });
      await writeAudit(tx, { action: 'POOL_UPDATED', userId: req.user.id, poolId: updated.id, details: data });
      return updated;
    });
    res.json({ pool: { ...poolView(pool), role: member.role } });
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
    const poolId = req.params.poolId;
    validateId(poolId, 'pool ID');
    await requirePoolAdmin(poolId, req.user.id);
    const { name, budget } = validateCategoryInput(req.body);
    const color = validateCategoryColor(req.body?.color);
    const category = await prisma.$transaction(async (tx) => {
      const created = await tx.category.create({ data: { poolId, name, budget, color } });
      await writeAudit(tx, { action: 'CATEGORY_CREATED', userId: req.user.id, poolId, details: { name: created.name } });
      return created;
    });
    res.status(201).json({ category: { ...category, budget: toNumber(category.budget) } });
  } catch (error) {
    next(error?.code === 'P2002' ? new ApiError(409, 'Category already exists in this pool') : error);
  }
});

function accessRequestView(accessRequest) {
  return {
    id: accessRequest.id,
    poolId: accessRequest.poolId,
    userId: accessRequest.userId,
    requestNote: accessRequest.requestNote,
    status: accessRequest.status,
    createdAt: accessRequest.createdAt,
    updatedAt: accessRequest.updatedAt,
    ...(accessRequest.user ? {
      user: { id: accessRequest.user.id, name: accessRequest.user.name, email: accessRequest.user.email },
    } : {}),
  };
}

app.post('/api/pools/:poolId/access-requests', authenticate, async (req, res, next) => {
  try {
    const { poolId } = req.params;
    validateId(poolId, 'pool ID');

    const existingMembership = await prisma.budgetPoolMember.findUnique({
      where: { poolId_userId: { poolId, userId: req.user.id } },
    });
    if (existingMembership) throw new ApiError(409, 'You are already a member of this budget pool');

    const rawNote = req.body?.requestNote;
    if (rawNote !== undefined && typeof rawNote !== 'string') {
      throw new ApiError(400, 'Request note must be a string');
    }
    const requestNote = typeof rawNote === 'string' ? rawNote.trim() : '';
    if (requestNote.length > 500) throw new ApiError(400, 'Request note must be 500 characters or fewer');

    const accessRequest = await prisma.$transaction(async (tx) => {
      const pool = await tx.budgetPool.findUnique({ where: { id: poolId }, select: { id: true, name: true } });
      if (!pool) throw new ApiError(404, 'Budget pool not found');

      const existingPendingRequest = await tx.poolAccessRequest.findUnique({
        where: { poolId_userId: { poolId, userId: req.user.id } },
      });
      if (existingPendingRequest && existingPendingRequest.status === 'PENDING') {
        throw new ApiError(409, 'You already have a pending access request for this pool');
      }

      const createdRequest = await tx.poolAccessRequest.upsert({
        where: { poolId_userId: { poolId, userId: req.user.id } },
        create: { poolId, userId: req.user.id, requestNote: requestNote || null },
        update: { requestNote: requestNote || null, status: 'PENDING' },
      });

      await notifyPoolAdmins(tx, poolId, {
        type: 'POOL_ACCESS_REQUEST_SUBMITTED',
        title: 'New pool access request',
        message: `${req.user.name} requested access to "${pool.name}".`,
        link: `/pool/${poolId}`,
      }, req.user.id);

      return createdRequest;
    });

    res.status(201).json({ request: accessRequestView(accessRequest) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/pools/:poolId/access-requests', authenticate, async (req, res, next) => {
  try {
    const poolId = req.params.poolId;
    validateId(poolId, 'pool ID');
    await requirePoolAdmin(poolId, req.user.id);
    const requests = await prisma.poolAccessRequest.findMany({
      where: { poolId, status: 'PENDING' },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ requests: requests.map(accessRequestView) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/pools/:poolId/members', authenticate, async (req, res, next) => {
  try {
    const { poolId } = req.params;
    validateId(poolId, 'pool ID');
    await requirePoolAdmin(poolId, req.user.id);
    const members = await prisma.budgetPoolMember.findMany({
      where: { poolId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    res.json({
      members: members.map((member) => ({
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt,
        user: member.user,
      })),
    });
  } catch (error) {
    next(error);
  }
});

async function resolveAccessRequest(req, res, next, status) {
  try {
    const { poolId, requestId } = req.params;
    await requirePoolAdmin(poolId, req.user.id);
    validateId(requestId, 'request ID');

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const accessRequest = await tx.poolAccessRequest.findFirst({
        where: { id: requestId, poolId },
      });
      if (!accessRequest) throw new ApiError(404, 'Pool access request not found');
      if (accessRequest.status !== 'PENDING') throw new ApiError(409, 'Only pending requests can be resolved');

      const pool = await tx.budgetPool.findUnique({ where: { id: poolId }, select: { id: true, name: true } }).catch(() => null);

      if (status === 'APPROVED') {
        const member = await tx.budgetPoolMember.findUnique({
          where: { poolId_userId: { poolId, userId: accessRequest.userId } },
        });
        if (member) throw new ApiError(409, 'The requester is already a member of this budget pool');
        await tx.budgetPoolMember.create({
          data: { poolId, userId: accessRequest.userId, role: 'CONTRIBUTOR' },
        });
      }

      const resolvedRequest = await tx.poolAccessRequest.update({
        where: { id: accessRequest.id },
        data: { status },
      });

      await notifyUser(tx, accessRequest.userId, {
        type: status === 'APPROVED' ? 'POOL_ACCESS_REQUEST_APPROVED' : 'POOL_ACCESS_REQUEST_REJECTED',
        title: status === 'APPROVED' ? 'Access request approved' : 'Access request rejected',
        message: status === 'APPROVED'
          ? `Your request to join "${pool?.name || 'this pool'}" was approved.`
          : `Your request to join "${pool?.name || 'this pool'}" was rejected.`,
        link: `/pool/${poolId}`,
      });

      return resolvedRequest;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    res.json({ request: accessRequestView(updatedRequest) });
  } catch (error) {
    next(error);
  }
}

app.post('/api/pools/:poolId/access-requests/:requestId/approve', authenticate, (req, res, next) => (
  resolveAccessRequest(req, res, next, 'APPROVED')
));
app.post('/api/pools/:poolId/access-requests/:requestId/reject', authenticate, (req, res, next) => (
  resolveAccessRequest(req, res, next, 'REJECTED')
));

async function claimView(claim) {
  return {
    ...claim,
    amount: toNumber(claim.amount),
    category: claim.category ? { ...claim.category, budget: toNumber(claim.category.budget) } : undefined,
    claimant: claim.claimant ? userView(claim.claimant) : undefined,
    receipt: claim.receipt
      ? { ...claim.receipt, filePath: await getReceiptAccessUrl(claim.receipt.filePath) }
      : null,
  };
}

const claimInclude = { category: true, claimant: true, receipt: true };

app.post('/api/pools/:poolId/claims', authenticate, requirePoolMembership, receiptUpload.single('receipt'), async (req, res, next) => {
  try {
    const poolId = req.params.poolId;
    validateId(poolId, 'pool ID');

    const validation = normalizeClaimInput({
      title: req.body?.title,
      amount: req.body?.amount,
      incurredAt: req.body?.incurredAt,
      description: req.body?.description,
    });

    if (typeof req.body?.categoryId !== 'string' || !UUID_PATTERN.test(req.body.categoryId.trim())) {
      throw new ApiError(400, 'Invalid category ID');
    }

    const category = await prisma.category.findFirst({ where: { id: req.body.categoryId, poolId } });
    if (!category) {
      throw new ApiError(404, 'Selected category does not exist in this pool');
    }

    const inputDate = req.body?.incurredAt ? new Date(req.body.incurredAt) : new Date();
    if (Number.isNaN(inputDate.getTime())) throw new ApiError(400, 'Invalid date provided');

    let receipt = null;
    if (req.file) {
      let driveFile;
      try {
        driveFile = await uploadFileToDrive(req.file, req.budgetPool.name);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new ApiError(500, `Failed to upload receipt to Google Drive: ${message}`);
      }
      if (driveFile?.error) {
        throw new ApiError(500, `Failed to upload receipt to Google Drive: ${driveFile.message}`);
      }
      receipt = {
        filePath: driveFile.webViewLink,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
      };
    }

    const claim = await prisma.$transaction(async (tx) => {
      const created = await tx.expenseClaim.create({
        data: {
          poolId,
          categoryId: category.id,
          claimantId: req.user.id,
          title: validation.title,
          description: validation.description,
          amount: validation.amount,
          incurredAt: inputDate,
          ...(receipt?.filePath ? {
            receipt: {
              create: {
                filePath: receipt.filePath,
                fileName: receipt.fileName || null,
                mimeType: receipt.mimeType || null,
              },
            },
          } : {}),
        },
        include: claimInclude,
      });
      await notifyPoolAdmins(tx, poolId, {
        type: 'CLAIM_SUBMITTED',
        title: 'Expense claim submitted',
        message: `${req.user.name} submitted a new claim: "${validation.title}".`,
        link: `/pool/${poolId}`,
      }, req.user.id);
      await writeAudit(tx, { action: 'CLAIM_SUBMITTED', userId: req.user.id, poolId, claimId: created.id, details: { amount: validation.amount } });
      return created;
    });
    res.status(201).json({ claim: await claimView(claim) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/pools/:poolId/claims', authenticate, async (req, res, next) => {
  try {
    const member = await membership(req.params.poolId, req.user.id);
    const where = { poolId: req.params.poolId };
    if (member.role !== 'ADMIN') where.claimantId = req.user.id;
    const claims = await prisma.expenseClaim.findMany({ where, include: claimInclude, orderBy: { createdAt: 'desc' } });
    res.json({ claims: await Promise.all(claims.map(claimView)) });
  } catch (error) { next(error); }
});

app.get('/api/claims/:claimId', authenticate, async (req, res, next) => {
  try {
    const claim = await prisma.expenseClaim.findUnique({ where: { id: req.params.claimId }, include: claimInclude });
    if (!claim) throw new ApiError(404, 'Expense claim not found');
    const member = await membership(claim.poolId, req.user.id);
    if (member.role !== 'ADMIN' && claim.claimantId !== req.user.id) throw new ApiError(403, 'You cannot view this claim');
    res.json({ claim: await claimView(claim) });
  } catch (error) { next(error); }
});

async function reviewClaim(req, res, next, status) {
  try {
    const claim = await prisma.expenseClaim.findUnique({ where: { id: req.params.claimId }, include: claimInclude });
    if (!claim) throw new ApiError(404, 'Expense claim not found');
    await requirePoolAdmin(claim.poolId, req.user.id);
    if (claim.status !== 'PENDING') throw new ApiError(409, 'Only pending claims can be reviewed');
    const updated = await prisma.$transaction(async (tx) => {
      if (status === 'APPROVED') {
        const approved = await tx.expenseClaim.aggregate({ _sum: { amount: true }, where: { poolId: claim.poolId, status: 'APPROVED' } });
        const pool = await tx.budgetPool.findUnique({ where: { id: claim.poolId } });
        const spent = Number(approved._sum.amount || 0);
        if (spent + Number(claim.amount) > Number(pool.totalBudget)) throw new ApiError(400, 'Insufficient remaining budget');
      }
      const result = await tx.expenseClaim.update({
        where: { id: claim.id },
        data: { status, reviewerId: req.user.id, reviewNote: req.body?.reviewNote, approvedAt: status === 'APPROVED' ? new Date() : null },
        include: claimInclude,
      });
      await notifyUser(tx, claim.claimantId, {
        type: status === 'APPROVED' ? 'CLAIM_APPROVED' : 'CLAIM_REJECTED',
        title: status === 'APPROVED' ? 'Expense claim approved' : 'Expense claim rejected',
        message: status === 'APPROVED'
          ? `Your claim "${claim.title}" was approved.`
          : `Your claim "${claim.title}" was rejected.`,
        link: `/pool/${claim.poolId}`,
      });
      await writeAudit(tx, { action: status === 'APPROVED' ? 'CLAIM_APPROVED' : 'CLAIM_REJECTED', userId: req.user.id, poolId: claim.poolId, claimId: claim.id, details: { reviewNote: req.body?.reviewNote } });
      return result;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    res.json({ claim: await claimView(updated) });
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
  if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({
      error: error.code === 'LIMIT_FILE_SIZE' ? 'Receipt file must be 5 MB or smaller' : 'Invalid receipt upload',
    });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return res.status(409).json({ error: 'A conflicting resource already exists' });
  }
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

module.exports = { app, prisma, ApiError, validateClaimInput, validateCategoryInput, validatePoolCategories, remainingBudget };
