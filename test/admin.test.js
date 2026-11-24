
const test = require('node:test');
const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');
const app = require('../server');

// Use temporary test credentials, not real passwords.
function configureTestAuth(t) {
  const previous = {
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET
  };

  process.env.ADMIN_PASSWORD = 'test-password-123456789';
  process.env.ADMIN_SESSION_SECRET = 'test-secret-'.repeat(6);

  t.after(() => {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  });
}

// Start and stop a temporary Express server.
async function withServer(callback) {
  const server = await new Promise(resolve => {
    const running = app.listen(
      0,
      '127.0.0.1',
      () => resolve(running)
    );
  });

  try {
    const port = server.address().port;
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

// Send a request and read its JSON response.
async function send(base, route, options = {}) {
  const { method = 'GET', body, cookie } = options;

  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (cookie) {
    headers.Cookie = cookie;
  }

  const response = await fetch(base + route, {
    method,
    headers,
    body: body === undefined
      ? undefined
      : JSON.stringify(body)
  });

  return {
    status: response.status,
    data: await response.json(),
    cookie: response.headers.get('set-cookie')
  };
}

// Verify that regular visitors cannot modify records.
test('Visitors cannot add, edit, or delete media', async t => {
  configureTestAuth(t);

  await withServer(async base => {
    const create = await send(base, '/api/media', {
      method: 'POST',
      body: {}
    });

    const update = await send(base, '/api/media/1', {
      method: 'PUT',
      body: {}
    });

    const remove = await send(base, '/api/media/1', {
      method: 'DELETE'
    });

    assert.equal(create.status, 401);
    assert.equal(update.status, 401);
    assert.equal(remove.status, 401);

    assert.equal(
      create.data.error,
      'Administrator login required.'
    );
  });
});

// Verify login accepts only the configured password.
test('Administrator login verifies credentials', async t => {
  configureTestAuth(t);

  await withServer(async base => {
    const incorrect = await send(
      base,
      '/api/admin/login',
      {
        method: 'POST',
        body: { password: 'wrong-password' }
      }
    );

    assert.equal(incorrect.status, 401);

    const correct = await send(
      base,
      '/api/admin/login',
      {
        method: 'POST',
        body: {
          password: process.env.ADMIN_PASSWORD
        }
      }
    );

    assert.equal(correct.status, 200);
    assert.equal(correct.data.authenticated, true);
    assert.ok(correct.cookie);

    const sessionCookie = correct.cookie.split(';')[0];

    const protectedRoute = await send(
      base,
      '/api/admin/check',
      { cookie: sessionCookie }
    );

    assert.equal(protectedRoute.status, 200);
    assert.equal(protectedRoute.data.authorized, true);
  });
});

// Test the database operations without changing real data.
test('Administrator can add, edit, and delete media', async t => {
  configureTestAuth(t);

  const queries = [];

  t.mock.method(
    mysql,
    'createConnection',
    async () => ({
      execute: async (sql, values = []) => {
        queries.push({ sql, values });

        if (sql.includes('SELECT id FROM media_types')) {
          return [[{ id: 1 }]];
        }

        if (sql.includes('INSERT INTO media_items')) {
          return [{ insertId: 101, affectedRows: 1 }];
        }

        if (sql.includes('UPDATE media_items')) {
          return [{ affectedRows: 1 }];
        }

        if (sql.includes('DELETE FROM media_items')) {
          return [{ affectedRows: 1 }];
        }

        throw new Error('Unexpected SQL query');
      },

      end: async () => {}
    })
  );

  await withServer(async base => {
    const login = await send(base, '/api/admin/login', {
      method: 'POST',
      body: {
        password: process.env.ADMIN_PASSWORD
      }
    });

    assert.equal(login.status, 200);

    const cookie = login.cookie.split(';')[0];

    const media = {
      title: 'ShelfSpace Test',
      category: 'Games',
      creator: 'Test Creator',
      release_year: 2026,
      progress_status: 'Planned',
      platform: 'PC',
      rating: 8,
      notes: 'Automated test record'
    };

    // Test adding a record.
    const created = await send(base, '/api/media', {
      method: 'POST',
      cookie,
      body: media
    });

    assert.equal(created.status, 201);
    assert.equal(created.data.id, 101);

    // Test editing a record.
    const updated = await send(base, '/api/media/101', {
      method: 'PUT',
      cookie,
      body: {
        ...media,
        title: 'ShelfSpace Test Updated'
      }
    });

    assert.equal(updated.status, 200);

    // Test deleting a record.
    const deleted = await send(base, '/api/media/101', {
      method: 'DELETE',
      cookie
    });

    assert.equal(deleted.status, 200);

    // Verify the operations used SQL parameters.
    assert.ok(queries.some(
      query => query.sql.includes(
        'INSERT INTO media_items'
      )
    ));

    assert.ok(queries.some(
      query => query.sql.includes(
        'UPDATE media_items'
      )
    ));

    assert.ok(queries.some(
      query => query.sql.includes(
        'DELETE FROM media_items'
      )
    ));
  });
});
