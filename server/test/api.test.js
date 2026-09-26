const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app, ApiError, validateClaimInput, remainingBudget } = require('../index');

test('health endpoint is available', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
});

test('unauthenticated protected requests are rejected', async () => {
  const response = await request(app).get('/api/pools');
  assert.equal(response.status, 401);
});

test('expense validation rejects zero, missing category, and missing receipt', () => {
  assert.throws(() => validateClaimInput({ title: 'Claim', amount: 0, categoryId: 'cat', receipt: { filePath: 'receipt.pdf' } }), ApiError);
  assert.throws(() => validateClaimInput({ title: 'Claim', amount: 10, receipt: { filePath: 'receipt.pdf' } }), ApiError);
  assert.throws(() => validateClaimInput({ title: 'Claim', amount: 10, categoryId: 'cat' }), ApiError);
});

test('valid expense validation and remaining budget calculation', () => {
  assert.equal(validateClaimInput({ title: 'Claim', amount: 10, categoryId: 'cat', receipt: { filePath: 'receipt.pdf' } }), 10);
  assert.equal(remainingBudget(100, 25), 75);
  assert.equal(remainingBudget(100, 120), 0);
});
