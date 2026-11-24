
require('dotenv').config();

const mysql = require('mysql2/promise');

const VALID_STATUSES = [
  'Planned',
  'In Progress',
  'Completed',
  'On Hold'
];

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function notFoundError(message) {
  const error = new Error(message);
  error.status = 404;
  return error;
}

function requiredText(value, field, maximum) {
  if (typeof value !== 'string') {
    throw validationError(`${field} is required.`);
  }

  const text = value.trim();

  if (!text || text.length > maximum) {
    throw validationError(
      `${field} must contain 1 to ${maximum} characters.`
    );
  }

  return text;
}

function optionalText(value, field, maximum) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw validationError(`${field} must be text.`);
  }

  const text = value.trim();

  if (text.length > maximum) {
    throw validationError(`${field} is too long.`);
  }

  return text || null;
}

function validateMedia(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw validationError('Invalid media information.');
  }

  const title = requiredText(input.title, 'Title', 200);
  const category = requiredText(input.category, 'Category', 50);
  const creator = requiredText(input.creator, 'Creator', 150);

  const year = Number(input.release_year);

  if (
    input.release_year === '' ||
    input.release_year === null ||
    input.release_year === undefined ||
    !Number.isInteger(year) ||
    year < 1800 ||
    year > 2100
  ) {
    throw validationError('Enter a valid release year.');
  }

  const status = requiredText(
    input.progress_status || 'Planned',
    'Progress status',
    30
  );

  if (!VALID_STATUSES.includes(status)) {
    throw validationError('Invalid progress status.');
  }

  let rating = null;

  if (
    input.rating !== null &&
    input.rating !== undefined &&
    input.rating !== ''
  ) {
    rating = Number(input.rating);

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 10
    ) {
      throw validationError('Rating must be between 1 and 10.');
    }
  }

  return {
    title,
    category,
    creator,
    release_year: year,
    progress_status: status,
    platform: optionalText(input.platform, 'Platform', 80),
    rating,
    notes: optionalText(input.notes, 'Notes', 5000)
  };
}

function validateId(id) {
  const number = Number(id);

  if (
    !Number.isSafeInteger(number) ||
    number < 1 ||
    number > 4294967295
  ) {
    throw validationError('Invalid media ID.');
  }

  return number;
}

async function connectDatabase() {
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL;

  if (!url) {
    throw new Error('MySQL connection URL is missing.');
  }

  return mysql.createConnection(url);
}

async function findCategoryId(connection, category) {
  const [rows] = await connection.execute(
    'SELECT id FROM media_types WHERE name = ? LIMIT 1',
    [category]
  );

  if (rows.length === 0) {
    throw validationError('The selected category does not exist.');
  }

  return rows[0].id;
}

// Add a new media record.
async function createMedia(input) {
  const media = validateMedia(input);
  const connection = await connectDatabase();

  try {
    const typeId = await findCategoryId(
      connection,
      media.category
    );

    const [result] = await connection.execute(
      `INSERT INTO media_items (
        type_id,
        title,
        creator,
        release_year,
        progress_status,
        platform,
        rating,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        typeId,
        media.title,
        media.creator,
        media.release_year,
        media.progress_status,
        media.platform,
        media.rating,
        media.notes
      ]
    );

    return {
      id: result.insertId,
      message: 'Media record created successfully.'
    };
  } finally {
    await connection.end();
  }
}

// Edit an existing media record.
async function updateMedia(id, input) {
  const mediaId = validateId(id);
  const media = validateMedia(input);
  const connection = await connectDatabase();

  try {
    const typeId = await findCategoryId(
      connection,
      media.category
    );

    const [result] = await connection.execute(
      `UPDATE media_items SET
        type_id = ?,
        title = ?,
        creator = ?,
        release_year = ?,
        progress_status = ?,
        platform = ?,
        rating = ?,
        notes = ?
      WHERE id = ?`,
      [
        typeId,
        media.title,
        media.creator,
        media.release_year,
        media.progress_status,
        media.platform,
        media.rating,
        media.notes,
        mediaId
      ]
    );

    if (result.affectedRows === 0) {
      throw notFoundError('Media record not found.');
    }

    return {
      id: mediaId,
      message: 'Media record updated successfully.'
    };
  } finally {
    await connection.end();
  }
}

// Delete a media record.
async function deleteMedia(id) {
  const mediaId = validateId(id);
  const connection = await connectDatabase();

  try {
    const [result] = await connection.execute(
      'DELETE FROM media_items WHERE id = ?',
      [mediaId]
    );

    if (result.affectedRows === 0) {
      throw notFoundError('Media record not found.');
    }

    return {
      id: mediaId,
      message: 'Media record deleted successfully.'
    };
  } finally {
    await connection.end();
  }
}

module.exports = {
  createMedia,
  updateMedia,
  deleteMedia
};
