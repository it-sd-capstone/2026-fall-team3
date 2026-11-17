
require('dotenv').config();

const mysql = require('mysql2/promise');

// Retrieve media from the shared MySQL library.
async function getMedia({
  search = '',
  category = '',
  status = '',
  sort = 'title',
  order = 'asc'
} = {}) {
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL;

  if (!url) {
    throw new Error('MySQL connection URL is missing.');
  }

  const connection = await mysql.createConnection(url);

  try {
    let sql = `
      SELECT
        m.id,
        m.title,
        t.name AS category,
        m.creator,
        m.release_year,
        m.progress_status,
        m.platform,
        m.rating,
        m.notes
      FROM media_items AS m
      JOIN media_types AS t
        ON m.type_id = t.id
    `;

    const conditions = [];
    const values = [];

    // Search by title.
    if (typeof search === 'string' && search.trim()) {
      conditions.push('m.title LIKE ?');
      values.push(`%${search.trim()}%`);
    }

    // Filter by media category.
    if (typeof category === 'string' && category.trim()) {
      conditions.push('t.name = ?');
      values.push(category.trim());
    }

    // Filter by progress status.
    if (typeof status === 'string' && status.trim()) {
      conditions.push('m.progress_status = ?');
      values.push(status.trim());
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Only allow approved sorting columns.
    const sortColumn =
      sort === 'year' || sort === 'release_year'
        ? 'm.release_year'
        : 'm.title';

    const direction =
      typeof order === 'string' &&
      order.toLowerCase() === 'desc'
        ? 'DESC'
        : 'ASC';

    sql += ` ORDER BY ${sortColumn} ${direction}, m.id ASC`;

    const [rows] = await connection.execute(sql, values);

    return rows;
  } finally {
    await connection.end();
  }
}

module.exports = { getMedia };
