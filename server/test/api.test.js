const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET ||= 'splitvault-api-test-secret';
const { app, prisma, ApiError, validateClaimInput, validateCategoryInput, validatePoolCategories, remainingBudget } = require('../index');
const {
  getReceiptAccessUrl,
  getDriveFileId,
  getDrivePreviewUrl,
  getDriveUploadErrorMessage,
  uploadFileToDrive,
} = require('../utils/gdrive');

const TEST_POOL_ID = '11111111-1111-4111-8111-111111111111';
const TEST_USER_ID = '22222222-2222-4222-8222-222222222222';
const TEST_REQUEST_ID = '33333333-3333-4333-8333-333333333333';
const TEST_ADMIN_ID = '44444444-4444-4444-8444-444444444444';

function authHeader(userId = TEST_USER_ID) {
  return `Bearer ${jwt.sign({ sub: userId }, process.env.JWT_SECRET)}`;
}

async function withPrismaMocks(mocks, callback) {
  const originals = [];
  for (const [target, method, implementation] of mocks) {
    originals.push([target, method, target[method]]);
    target[method] = implementation;
  }
  try {
    return await callback();
  } finally {
    for (const [target, method, implementation] of originals) {
      target[method] = implementation;
    }
  }
}

function authMocks(userRole = 'CONTRIBUTOR') {
  return [[prisma.user, 'findUnique', async ({ where }) => ({
    id: where.id,
    name: 'Test User',
    email: 'test@example.com',
    role: userRole,
  })]];
}

test('health endpoint is available', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
});

test('pool administrators are authorized by membership role, not global user role', async () => {
  const calls = [];
  await withPrismaMocks([
    ...authMocks('CONTRIBUTOR'),
    [prisma.budgetPoolMember, 'findUnique', async () => ({ role: 'ADMIN' })],
    [prisma, '$transaction', async (callback) => callback(prisma)],
    [prisma.budgetPool, 'update', async ({ data }) => {
      calls.push(data);
      return { id: TEST_POOL_ID, name: data.name, description: null, totalBudget: 100 };
    }],
    [prisma.auditLog, 'create', async () => ({})],
  ], async () => {
    const response = await request(app)
      .patch(`/api/pools/${TEST_POOL_ID}`)
      .set('Authorization', authHeader())
      .send({ name: ' Updated pool ' });
    assert.equal(response.status, 200);
    assert.equal(response.body.pool.name, 'Updated pool');
    assert.deepEqual(calls, [{ name: 'Updated pool' }]);
  });

  await withPrismaMocks([
    ...authMocks('ADMIN'),
    [prisma.budgetPoolMember, 'findUnique', async () => ({ role: 'CONTRIBUTOR' })],
    [prisma.category, 'create', async () => {
      throw new Error('A contributor must not create a category');
    }],
  ], async () => {
    const response = await request(app)
      .post(`/api/pools/${TEST_POOL_ID}/categories`)
      .set('Authorization', authHeader())
      .send({ name: 'Travel', budget: 10 });
    assert.equal(response.status, 403);
    assert.deepEqual(response.body, { error: 'Administrator access required' });
  });
});

test('pool creation grants the creator pool-admin membership', async () => {
  let createdMember;
  await withPrismaMocks([
    ...authMocks(),
    [prisma.budgetPool, 'create', async ({ data }) => ({ id: TEST_POOL_ID, ...data, totalBudget: 100 })],
    [prisma.budgetPoolMember, 'create', async ({ data }) => {
      createdMember = data;
      return data;
    }],
    [prisma.auditLog, 'create', async () => ({})],
    [prisma, '$transaction', async (callback) => callback(prisma)],
  ], async () => {
    const response = await request(app)
      .post('/api/pools')
      .set('Authorization', authHeader())
      .send({ name: '  New pool  ', totalBudget: 100 });
    assert.equal(response.status, 201);
    assert.equal(response.body.pool.name, 'New pool');
    assert.deepEqual(createdMember, {
      poolId: TEST_POOL_ID,
      userId: TEST_USER_ID,
      role: 'ADMIN',
    });
  });
});

test('pool listing exposes each user pool-relative role', async () => {
  await withPrismaMocks([
    ...authMocks('CONTRIBUTOR'),
    [prisma.budgetPool, 'findMany', async () => [{
      id: TEST_POOL_ID,
      name: 'Scoped pool',
      description: null,
      totalBudget: 100,
      members: [{ role: 'ADMIN' }],
    }]],
  ], async () => {
    const response = await request(app)
      .get('/api/pools')
      .set('Authorization', authHeader());
    assert.equal(response.status, 200);
    assert.equal(response.body.pools[0].role, 'ADMIN');
  });
});

test('pool admins can list members for their pool', async () => {
  const joinedAt = new Date('2026-09-29T00:00:00.000Z');
  await withPrismaMocks([
    ...authMocks(),
    [prisma.budgetPoolMember, 'findUnique', async () => ({ role: 'ADMIN' })],
    [prisma.budgetPoolMember, 'findMany', async ({ where }) => {
      assert.deepEqual(where, { poolId: TEST_POOL_ID });
      return [{
        poolId: TEST_POOL_ID,
        userId: TEST_USER_ID,
        role: 'ADMIN',
        joinedAt,
        user: { id: TEST_USER_ID, name: 'Test User', email: 'test@example.com' },
      }, {
        poolId: TEST_POOL_ID,
        userId: TEST_ADMIN_ID,
        role: 'CONTRIBUTOR',
        joinedAt,
        user: { id: TEST_ADMIN_ID, name: 'Pool Contributor', email: 'member@example.com' },
      }];
    }],
  ], async () => {
    const response = await request(app)
      .get(`/api/pools/${TEST_POOL_ID}/members`)
      .set('Authorization', authHeader());
    assert.equal(response.status, 200);
    assert.deepEqual(response.body.members, [{
      userId: TEST_USER_ID,
      role: 'ADMIN',
      joinedAt: joinedAt.toISOString(),
      user: { id: TEST_USER_ID, name: 'Test User', email: 'test@example.com' },
    }, {
      userId: TEST_ADMIN_ID,
      role: 'CONTRIBUTOR',
      joinedAt: joinedAt.toISOString(),
      user: { id: TEST_ADMIN_ID, name: 'Pool Contributor', email: 'member@example.com' },
    }]);
  });
});

test('pool member list requires pool-admin membership', async () => {
  await withPrismaMocks([
    ...authMocks('ADMIN'),
    [prisma.budgetPoolMember, 'findUnique', async () => ({ role: 'CONTRIBUTOR' })],
  ], async () => {
    const response = await request(app)
      .get(`/api/pools/${TEST_POOL_ID}/members`)
      .set('Authorization', authHeader());
    assert.equal(response.status, 403);
    assert.deepEqual(response.body, { error: 'Administrator access required' });
  });
});

test('claim review authorization follows the user pool membership role', async () => {
  const claim = {
    id: TEST_REQUEST_ID,
    poolId: TEST_POOL_ID,
    categoryId: '55555555-5555-4555-8555-555555555555',
    claimantId: '66666666-6666-4666-8666-666666666666',
    amount: 10,
    status: 'PENDING',
    category: { id: '55555555-5555-4555-8555-555555555555', budget: 100 },
    claimant: { id: TEST_USER_ID, name: 'Test User', email: 'test@example.com', role: 'CONTRIBUTOR' },
    receipt: null,
  };
  await withPrismaMocks([
    ...authMocks('CONTRIBUTOR'),
    [prisma.budgetPoolMember, 'findUnique', async () => ({ role: 'ADMIN' })],
    [prisma.expenseClaim, 'findUnique', async () => claim],
    [prisma.expenseClaim, 'aggregate', async () => ({ _sum: { amount: 0 } })],
    [prisma.budgetPool, 'findUnique', async () => ({ totalBudget: 100 })],
    [prisma.expenseClaim, 'update', async ({ data }) => ({ ...claim, ...data })],
    [prisma.auditLog, 'create', async () => ({})],
    [prisma, '$transaction', async (callback) => callback(prisma)],
  ], async () => {
    const response = await request(app)
      .post(`/api/claims/${TEST_REQUEST_ID}/approve`)
      .set('Authorization', authHeader());
    assert.equal(response.status, 200);
    assert.equal(response.body.claim.status, 'APPROVED');
    assert.equal(response.body.claim.reviewerId, TEST_USER_ID);
  });

  await withPrismaMocks([
    ...authMocks('ADMIN'),
    [prisma.budgetPoolMember, 'findUnique', async () => ({ role: 'CONTRIBUTOR' })],
    [prisma.expenseClaim, 'findUnique', async () => claim],
  ], async () => {
    const response = await request(app)
      .post(`/api/claims/${TEST_REQUEST_ID}/reject`)
      .set('Authorization', authHeader());
    assert.equal(response.status, 403);
    assert.deepEqual(response.body, { error: 'Administrator access required' });
  });
});

test('pool access requests can be submitted, reviewed, and approved as a contributor', async () => {
  const requestState = {
    id: TEST_REQUEST_ID,
    poolId: TEST_POOL_ID,
    userId: TEST_USER_ID,
    requestNote: 'Need access',
    status: 'PENDING',
    createdAt: new Date('2026-09-29T00:00:00.000Z'),
    updatedAt: new Date('2026-09-29T00:00:00.000Z'),
  };
  const createdMembers = [];
  const mocks = [
    ...authMocks(),
    [prisma.budgetPool, 'findUnique', async () => ({ id: TEST_POOL_ID })],
    [prisma.budgetPoolMember, 'findUnique', async ({ where }) => {
      const { userId } = where.poolId_userId;
      if (userId === TEST_ADMIN_ID) return { role: 'ADMIN' };
      if (userId === TEST_USER_ID && requestState.status === 'PENDING') return null;
      return createdMembers.find((member) => member.userId === userId) || null;
    }],
    [prisma.poolAccessRequest, 'upsert', async ({ create, update }) => {
      Object.assign(requestState, create, update);
      return { ...requestState };
    }],
    [prisma.poolAccessRequest, 'findMany', async () => [{ ...requestState, user: {
      id: TEST_USER_ID,
      name: 'Test User',
      email: 'test@example.com',
    } }]],
    [prisma.poolAccessRequest, 'findFirst', async () => ({ ...requestState })],
    [prisma.poolAccessRequest, 'update', async ({ data }) => Object.assign(requestState, data)],
    [prisma.budgetPoolMember, 'create', async ({ data }) => {
      createdMembers.push(data);
      return data;
    }],
    [prisma, '$transaction', async (callback) => callback(prisma)],
  ];

  await withPrismaMocks(mocks, async () => {
    const submitted = await request(app)
      .post(`/api/pools/${TEST_POOL_ID}/access-requests`)
      .set('Authorization', authHeader())
      .send({ requestNote: '  Need access  ' });
    assert.equal(submitted.status, 201);
    assert.equal(submitted.body.request.requestNote, 'Need access');
    assert.equal(submitted.body.request.status, 'PENDING');

    const listed = await request(app)
      .get(`/api/pools/${TEST_POOL_ID}/access-requests`)
      .set('Authorization', authHeader(TEST_ADMIN_ID));
    assert.equal(listed.status, 200);
    assert.equal(listed.body.requests.length, 1);
    assert.equal(listed.body.requests[0].user.email, 'test@example.com');

    const approved = await request(app)
      .post(`/api/pools/${TEST_POOL_ID}/access-requests/${TEST_REQUEST_ID}/approve`)
      .set('Authorization', authHeader(TEST_ADMIN_ID));
    assert.equal(approved.status, 200);
    assert.equal(approved.body.request.status, 'APPROVED');
    assert.deepEqual(createdMembers, [{
      poolId: TEST_POOL_ID,
      userId: TEST_USER_ID,
      role: 'CONTRIBUTOR',
    }]);
  });
});

test('pool admins can reject pending access requests', async () => {
  const pendingRequest = {
    id: TEST_REQUEST_ID,
    poolId: TEST_POOL_ID,
    userId: TEST_USER_ID,
    requestNote: null,
    status: 'PENDING',
  };
  await withPrismaMocks([
    ...authMocks(),
    [prisma.budgetPoolMember, 'findUnique', async () => ({ role: 'ADMIN' })],
    [prisma.poolAccessRequest, 'findFirst', async () => pendingRequest],
    [prisma.poolAccessRequest, 'update', async ({ data }) => ({ ...pendingRequest, ...data })],
    [prisma, '$transaction', async (callback) => callback(prisma)],
  ], async () => {
    const response = await request(app)
      .post(`/api/pools/${TEST_POOL_ID}/access-requests/${TEST_REQUEST_ID}/reject`)
      .set('Authorization', authHeader());
    assert.equal(response.status, 200);
    assert.equal(response.body.request.status, 'REJECTED');
  });
});

test('access requests reject missing pools, existing members, and non-admin reviewers', async () => {
  await withPrismaMocks([
    ...authMocks(),
    [prisma.budgetPool, 'findUnique', async () => null],
  ], async () => {
    const response = await request(app)
      .post(`/api/pools/${TEST_POOL_ID}/access-requests`)
      .set('Authorization', authHeader())
      .send({});
    assert.equal(response.status, 404);
    assert.deepEqual(response.body, { error: 'Budget pool not found' });
  });

  await withPrismaMocks([
    ...authMocks(),
    [prisma.budgetPool, 'findUnique', async () => ({ id: TEST_POOL_ID })],
    [prisma.budgetPoolMember, 'findUnique', async () => ({ role: 'CONTRIBUTOR' })],
  ], async () => {
    const response = await request(app)
      .post(`/api/pools/${TEST_POOL_ID}/access-requests`)
      .set('Authorization', authHeader())
      .send({});
    assert.equal(response.status, 409);
  });

  await withPrismaMocks([
    ...authMocks('ADMIN'),
    [prisma.budgetPoolMember, 'findUnique', async () => ({ role: 'CONTRIBUTOR' })],
  ], async () => {
    const response = await request(app)
      .get(`/api/pools/${TEST_POOL_ID}/access-requests`)
      .set('Authorization', authHeader());
    assert.equal(response.status, 403);
  });
});

test('unauthenticated protected requests are rejected', async () => {
  const response = await request(app).get('/api/pools');
  assert.equal(response.status, 401);
});

test('expense validation rejects invalid amounts, titles, and missing category', () => {
  const incurredAt = '2026-09-28T00:00:00.000Z';
  assert.throws(() => validateClaimInput({ title: 'Claim', amount: 0, categoryId: 'cat', incurredAt, receipt: { filePath: 'receipt.pdf' } }), ApiError);
  assert.throws(() => validateClaimInput({ title: 'Claim', amount: '10 USD', categoryId: 'cat', incurredAt }), ApiError);
  assert.throws(() => validateClaimInput({ title: 'Claim', amount: 10, incurredAt }), ApiError);
  assert.throws(() => validateClaimInput({ title: '   ', amount: 10, categoryId: 'cat', incurredAt }), ApiError);
  assert.throws(() => validateClaimInput({ title: 'Claim', amount: 10, categoryId: 'cat' }), ApiError);
  assert.throws(() => validateClaimInput({ title: 'Claim', amount: 10, categoryId: 'cat', incurredAt: 'invalid' }), ApiError);
});

test('valid expense validation permits claims without a receipt', () => {
  const incurredAt = '2026-09-28T00:00:00.000Z';
  assert.equal(validateClaimInput({ title: 'Claim', amount: 10, categoryId: 'cat', incurredAt }), 10);
  assert.equal(validateClaimInput({ title: ' Claim ', amount: '10.50', categoryId: 'cat', incurredAt }), 10.5);
  assert.equal(validateClaimInput({ title: 'Claim', amount: 10, categoryId: 'cat', incurredAt, receipt: { filePath: 'receipt.pdf' } }), 10);
  assert.equal(remainingBudget(100, 25), 75);
  assert.equal(remainingBudget(100, 120), 0);
});

test('category validation requires a trimmed name and positive budget', () => {
  assert.throws(() => validateCategoryInput({ name: '  ', budget: 10 }), ApiError);
  assert.throws(() => validateCategoryInput({ name: 'Travel', budget: 0 }), ApiError);
  assert.throws(() => validateCategoryInput({ name: 'Travel', budget: 'not a number' }), ApiError);
  assert.deepEqual(validateCategoryInput({ name: ' Travel ', budget: '10.50' }), { name: 'Travel', budget: 10.5 });
  assert.throws(() => validatePoolCategories([{ name: 'Travel', budget: 10, color: 'not-a-color' }]), ApiError);
});

test('pool category validation accepts mapped categories and defaults missing categories', () => {
  assert.deepEqual(validatePoolCategories(undefined), []);
  assert.deepEqual(validatePoolCategories([{ name: ' Travel ', budget: '10.50', color: '#123456' }]), [
    { name: 'Travel', budget: 10.5, color: '#123456' },
  ]);
  assert.throws(() => validatePoolCategories({ name: 'Travel', budget: 10 }), ApiError);
  assert.throws(() => validatePoolCategories([{ name: 'Travel', budget: 0 }]), ApiError);
});

test('Drive file IDs and image preview URLs are derived from Drive links', () => {
  assert.equal(getDriveFileId('https://drive.google.com/file/d/receipt-id/view'), 'receipt-id');
  assert.equal(getDriveFileId('https://drive.google.com/open?id=receipt-id'), 'receipt-id');
  assert.equal(getDrivePreviewUrl('https://drive.google.com/file/d/receipt-id/view'), 'https://drive.google.com/thumbnail?id=receipt-id&sz=w1600');
  assert.equal(getDrivePreviewUrl('https://example.com/receipt.png'), 'https://example.com/receipt.png');
  assert.equal(getReceiptAccessUrl('https://drive.google.com/file/d/receipt-id/view'), 'https://drive.google.com/file/d/receipt-id/view');
});

test('OAuth unauthorized_client errors explain that credentials must share the same OAuth client', () => {
  const message = getDriveUploadErrorMessage({
    response: { data: { error: 'unauthorized_client' } },
    message: 'request failed',
  });
  assert.match(message, /client ID, client secret, and refresh token all belong to the same OAuth client/);
});

test('missing OAuth credentials explain that service-account credentials are not sufficient', async () => {
  const originalEnv = {
    GDRIVE_CLIENT_ID: process.env.GDRIVE_CLIENT_ID,
    GDRIVE_CLIENT_SECRET: process.env.GDRIVE_CLIENT_SECRET,
    GDRIVE_REFRESH_TOKEN: process.env.GDRIVE_REFRESH_TOKEN,
    GDRIVE_FOLDER_ID: process.env.GDRIVE_FOLDER_ID,
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
  };
  const originalConsoleError = console.error;
  delete process.env.GDRIVE_CLIENT_ID;
  delete process.env.GDRIVE_CLIENT_SECRET;
  delete process.env.GDRIVE_REFRESH_TOKEN;
  process.env.GDRIVE_FOLDER_ID = 'folder-id';
  process.env.GOOGLE_CLIENT_EMAIL = 'legacy-service-account@example.test';
  delete process.env.GOOGLE_PRIVATE_KEY;
  console.error = () => {};

  try {
    const result = await uploadFileToDrive({
      buffer: Buffer.from('receipt'),
      originalname: 'receipt.pdf',
      mimetype: 'application/pdf',
    });
    assert.equal(result.error, true);
    assert.match(result.message, /Configure GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, and GDRIVE_REFRESH_TOKEN in server\/\.env/);
    assert.match(result.message, /Service-account credentials are not used/);
  } finally {
    console.error = originalConsoleError;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('receipt uploads use OAuth2 Drive and share the uploaded file for review', async () => {
  const originalEnv = Object.fromEntries([
    'GDRIVE_CLIENT_ID',
    'GDRIVE_CLIENT_SECRET',
    'GDRIVE_REFRESH_TOKEN',
    'GDRIVE_FOLDER_ID',
  ].map((key) => [key, process.env[key]]));
  const originalDrive = google.drive;
  let driveOptions;
  let createOptions;
  let permissionOptions;
  let receivedBuffer;
  process.env.GDRIVE_CLIENT_ID = 'client-id';
  process.env.GDRIVE_CLIENT_SECRET = 'client-secret';
  process.env.GDRIVE_REFRESH_TOKEN = 'refresh-token';
  process.env.GDRIVE_FOLDER_ID = 'folder-id';
  google.drive = (options) => {
    driveOptions = options;
    return {
      files: {
        create: async (options) => {
          createOptions = options;
          for await (const chunk of options.media.body) {
            receivedBuffer = Buffer.concat([receivedBuffer || Buffer.alloc(0), chunk]);
          }
          return { data: { id: 'drive-file-id', webViewLink: 'https://drive.google.com/file/d/drive-file-id/view', webContentLink: 'https://drive.google.com/uc?id=drive-file-id' } };
        },
        delete: async () => {},
      },
      permissions: {
        create: async (options) => {
          permissionOptions = options;
        },
      },
    };
  };

  try {
    const result = await uploadFileToDrive({
      buffer: Buffer.from('receipt'),
      originalname: '../receipt.pdf',
      mimetype: 'application/pdf',
    }, 'Pool');

    assert.deepEqual(result, {
      id: 'drive-file-id',
      webViewLink: 'https://drive.google.com/file/d/drive-file-id/view',
      webContentLink: 'https://drive.google.com/uc?id=drive-file-id',
    });
    assert.equal(driveOptions.version, 'v3');
    assert.equal(driveOptions.auth.credentials.refresh_token, 'refresh-token');
    assert.deepEqual(createOptions.requestBody.parents, ['folder-id']);
    assert.match(createOptions.requestBody.name, /^receipt-\d+-[\w-]+\.pdf$/);
    assert.equal(createOptions.media.mimeType, 'application/pdf');
    assert.deepEqual(receivedBuffer, Buffer.from('receipt'));
    assert.deepEqual(permissionOptions, {
      fileId: 'drive-file-id',
      requestBody: { role: 'reader', type: 'anyone' },
    });
  } finally {
    google.drive = originalDrive;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('Drive upload failures are returned as structured errors', async () => {
  const originalEnv = {
    GDRIVE_CLIENT_ID: process.env.GDRIVE_CLIENT_ID,
    GDRIVE_CLIENT_SECRET: process.env.GDRIVE_CLIENT_SECRET,
    GDRIVE_REFRESH_TOKEN: process.env.GDRIVE_REFRESH_TOKEN,
    GDRIVE_FOLDER_ID: process.env.GDRIVE_FOLDER_ID,
  };
  const originalDrive = google.drive;
  const originalConsoleError = console.error;
  process.env.GDRIVE_CLIENT_ID = 'client-id';
  process.env.GDRIVE_CLIENT_SECRET = 'client-secret';
  process.env.GDRIVE_REFRESH_TOKEN = 'refresh-token';
  process.env.GDRIVE_FOLDER_ID = 'folder-id';
  google.drive = () => ({
    files: { create: async () => { throw new Error('Drive permission denied'); } },
    permissions: { create: async () => {} },
  });
  console.error = () => {};

  try {
    const result = await uploadFileToDrive({
      buffer: Buffer.from('receipt'),
      originalname: 'receipt.pdf',
      mimetype: 'application/pdf',
    });
    assert.equal(result.error, true);
    assert.equal(result.code, 'GDRIVE_UPLOAD_FAILED');
    assert.match(result.message, /Drive permission denied/);
  } finally {
    google.drive = originalDrive;
    console.error = originalConsoleError;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('Drive upload logging excludes OAuth request data and secrets', async () => {
  const originalEnv = {
    GDRIVE_CLIENT_ID: process.env.GDRIVE_CLIENT_ID,
    GDRIVE_CLIENT_SECRET: process.env.GDRIVE_CLIENT_SECRET,
    GDRIVE_REFRESH_TOKEN: process.env.GDRIVE_REFRESH_TOKEN,
    GDRIVE_FOLDER_ID: process.env.GDRIVE_FOLDER_ID,
  };
  const originalDrive = google.drive;
  const originalConsoleError = console.error;
  let loggedDetails;
  process.env.GDRIVE_CLIENT_ID = 'client-id';
  process.env.GDRIVE_CLIENT_SECRET = 'client-secret';
  process.env.GDRIVE_REFRESH_TOKEN = 'refresh-token-do-not-log';
  process.env.GDRIVE_FOLDER_ID = 'folder-id';
  google.drive = () => ({
    files: {
      create: async () => {
        const error = new Error('unauthorized_client');
        error.response = {
          status: 401,
          data: { error: 'unauthorized_client' },
          config: { data: 'refresh-token-do-not-log' },
        };
        throw error;
      },
    },
    permissions: { create: async () => {} },
  });
  console.error = (_label, details) => { loggedDetails = details; };

  try {
    const result = await uploadFileToDrive({
      buffer: Buffer.from('receipt'),
      originalname: 'receipt.pdf',
      mimetype: 'application/pdf',
    });
    assert.match(result.message, /same OAuth client/);
    assert.deepEqual(loggedDetails, { code: 'unauthorized_client', status: 401 });
    assert.equal(JSON.stringify(loggedDetails).includes('refresh-token-do-not-log'), false);
  } finally {
    google.drive = originalDrive;
    console.error = originalConsoleError;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
