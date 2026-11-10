const test = require('node:test');
const assert = require('node:assert/strict');
const { checkDatabase } = require('../database');

test('MySQL connects and executes SELECT 1', async () => {
  // This test is intentionally a real integration test.
  // It MUST have working DATABASE_URL or MYSQL_URL credentials.
  const result = await checkDatabase();
  assert.equal(result, true);
});
