
const test = require('node:test');
const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');
const { getMedia } = require('../services/mediaService');
const app = require('../server');

// Tests use a fake database connection.
// They do not change the real MySQL records.
process.env.DATABASE_URL ||= 'mysql://test:test@localhost/test';

function fakeDatabase(t, rows, observe = () => {}) {
  t.mock.method(mysql, 'createConnection', async () => ({
    execute: async (sql, params) => {
      observe(sql, params);
      return [rows];
    },
    end: async () => {}
  }));
}

async function withTestServer(callback) {
  const server = await new Promise(resolve => {
    const running = app.listen(
      0, '127.0.0.1',
      () => resolve(running)
    );
  });

  try {
    const url = `http://127.0.0.1:${server.address().port}`;
    return await callback(url);
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error =>
        error ? reject(error) : resolve()
      );
    });
  }
}

test('Media service searches, filters, and sorts safely', async t => {
  let captured;
  const sample = [
    { id: 5, title: 'Shrek', category: 'Movies' }
  ];

  fakeDatabase(t, sample, (sql, params) => {
    captured = { sql, params };
  });

  const results = await getMedia({
    search: 'Shrek',
    category: 'Movies',
    status: 'Completed',
    sort: 'year',
    order: 'desc'
  });

  assert.deepEqual(results, sample);
  assert.deepEqual(
    captured.params,
    ['%Shrek%', 'Movies', 'Completed']
  );

  assert.match(captured.sql, /m\.title LIKE \?/);
  assert.match(captured.sql, /t\.name = \?/);
  assert.match(captured.sql, /m\.progress_status = \?/);
  assert.match(captured.sql, /ORDER BY m\.release_year DESC/);
});

test('Invalid sorting values cannot become SQL', async t => {
  let sql;

  fakeDatabase(t, [], query => {
    sql = query;
  });

  await getMedia({
    sort: 'DROP TABLE media_items',
    order: 'DROP'
  });

  assert.match(sql, /ORDER BY m\.title ASC/);
  assert.doesNotMatch(sql, /DROP/);
});

test('GET /api/media returns JSON', async t => {
  const sample = [
    { id: 5, title: 'Shrek', category: 'Movies' }
  ];

  fakeDatabase(t, sample);

  await withTestServer(async baseUrl => {
    const response = await fetch(
      `${baseUrl}/api/media?category=Movies`
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), sample);
  });
});

test('GET /api/media handles database errors', async t => {
  t.mock.method(mysql, 'createConnection', async () => {
    throw new Error('Private database credentials');
  });

  await withTestServer(async baseUrl => {
    const response = await fetch(
      `${baseUrl}/api/media`
    );

    assert.equal(response.status, 503);

    const body = await response.json();

    assert.equal(
      body.error,
      'Unable to retrieve media records.'
    );

    assert.doesNotMatch(
      JSON.stringify(body),
      /Private database credentials/
    );
  });
});
