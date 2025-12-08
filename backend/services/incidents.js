const { query } = require('../database');
const { v4: uuidv4 } = require('uuid');

async function create({ type, title, description, location, media = [], status = 'under-investigation', userId }) {
  const id = uuidv4();
  await query(
    `INSERT INTO Incidents (id, type, title, description, location, media, status, adminComment, userId) VALUES (?,?,?,?,CAST(? AS JSON),CAST(? AS JSON),?,NULL,?)`,
    [id, type, title, description, JSON.stringify(location), JSON.stringify(media), status, userId]
  );
  return findById(id);
}

async function findById(id) {
  const rows = await query(`SELECT * FROM Incidents WHERE id = ? LIMIT 1`, [id]);
  const row = rows[0] || null;
  if (!row) return null;
  // Parse JSON columns if returned as strings
  try {
    if (row.location && typeof row.location === 'string') {
      row.location = JSON.parse(row.location);
    }
  } catch (e) {
    console.warn('Failed to parse incident.location JSON', e);
  }
  try {
    if (row.media && typeof row.media === 'string') {
      row.media = JSON.parse(row.media);
    }
  } catch (e) {
    console.warn('Failed to parse incident.media JSON', e);
    row.media = [];
  }
  if (!Array.isArray(row.media)) {
    row.media = [];
  }
  return row;
}

async function findAll({ where = {}, orderByCreatedDesc = true } = {}) {
  const conditions = [];
  const values = [];
  if (where.userId) { conditions.push('userId = ?'); values.push(where.userId); }
  if (where.status) { conditions.push('status = ?'); values.push(where.status); }
  if (where.type) { conditions.push('type = ?'); values.push(where.type); }
  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderSql = orderByCreatedDesc ? 'ORDER BY createdAt DESC' : '';
  const rows = await query(`SELECT * FROM Incidents ${whereSql} ${orderSql}`.trim(), values);
  // Parse JSON columns for each row
  return rows.map((row) => {
    try {
      if (row.location && typeof row.location === 'string') row.location = JSON.parse(row.location);
    } catch (e) {
      console.warn('Failed to parse incident.location JSON', e);
    }
    try {
      if (row.media && typeof row.media === 'string') row.media = JSON.parse(row.media);
    } catch (e) {
      console.warn('Failed to parse incident.media JSON', e);
      row.media = [];
    }
    if (!Array.isArray(row.media)) {
      row.media = [];
    }

    // Normalize media URLs to ensure they point to /uploads/<filename> or are absolute URLs
    row.media = row.media.map((m) => {
      try {
        if (!m || typeof m !== 'object') return null;
        const item = { ...m };
        if (item.url && typeof item.url === 'string') {
          // Convert backslashes to forward slashes
          let u = item.url.replace(/\\/g, '/');

          // If URL already absolute (http/https), leave as-is
          if (/^https?:\/\//i.test(u)) {
            item.url = u;
          } else {
            // Try to find '/uploads/' segment
            const idx = u.indexOf('/uploads/');
            if (idx !== -1) {
              item.url = u.slice(idx);
            } else {
              // If it starts with 'uploads/' remove duplicate and ensure leading slash
              u = u.replace(/^\/*uploads\/*/i, '');
              // Keep just the filename portion
              const parts = u.split('/');
              const filename = parts[parts.length - 1];
              item.url = `/uploads/${filename}`;
            }
          }
        } else {
          item.url = '';
        }

        return item;
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
    return row;
  });
}

async function update(id, updates) {
  const fields = [];
  const values = [];
  if (updates.type !== undefined) { fields.push('type = ?'); values.push(updates.type); }
  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.location !== undefined) { fields.push('location = CAST(? AS JSON)'); values.push(JSON.stringify(updates.location)); }
  if (updates.media !== undefined) { fields.push('media = CAST(? AS JSON)'); values.push(JSON.stringify(updates.media)); }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
  if (updates.adminComment !== undefined) { fields.push('adminComment = ?'); values.push(updates.adminComment); }
  if (!fields.length) return findById(id);
  values.push(id);
  await query(`UPDATE Incidents SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

async function destroy(id) {
  await query(`DELETE FROM Incidents WHERE id = ?`, [id]);
}

async function count(where = {}) {
  const conditions = [];
  const values = [];
  if (where.status) { conditions.push('status = ?'); values.push(where.status); }
  if (where.type) { conditions.push('type = ?'); values.push(where.type); }
  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await query(`SELECT COUNT(*) as cnt FROM Incidents ${whereSql}`.trim(), values);
  return rows[0] ? rows[0].cnt : 0;
}

module.exports = {
  create,
  findById,
  findAll,
  update,
  destroy,
  count,
};
