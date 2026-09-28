const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { google } = require('googleapis');
const { app, ApiError, validateClaimInput, validateCategoryInput, validatePoolCategories, remainingBudget } = require('../index');
const {
  getReceiptAccessUrl,
  getDriveFileId,
  getDrivePreviewUrl,
  getDriveUploadErrorMessage,
  uploadFileToDrive,
} = require('../utils/gdrive');

test('health endpoint is available', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
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
