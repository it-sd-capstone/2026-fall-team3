
const test = require('node:test');
const assert = require('node:assert/strict');

const { checkDatabase } = require('../database');

const hasDatabaseUrl = Boolean(
  process.env.DATABASE_URL || process.env.MYSQL_URL
);

test(
  'MySQL connects and executes SELECT 1',
  {
    skip: hasDatabaseUrl
      ? false
      : 'Database URL not configured locally.'
  },
  async () => {
    const result = await checkDatabase();
    assert.equal(result, true);
  }
);

