const { query } = require('../database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

async function create({ email, password, name, role = 'user', profilePicture = null }) {
  const id = uuidv4();
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);
  await query(
    `INSERT INTO Users (id, email, password, name, role, profilePicture) VALUES (?,?,?,?,?,?)`,
    [id, email, hashed, name, role, profilePicture]
  );
  return findById(id);
}

async function findByEmail(email) {
  const rows = await query(`SELECT * FROM Users WHERE email = ? LIMIT 1`, [email]);
  return rows[0] || null;
}

async function findById(id) {
  const rows = await query(`SELECT id, email, name, role, profilePicture, createdAt, updatedAt FROM Users WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function findByIdWithPassword(id) {
  const rows = await query(`SELECT * FROM Users WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function updateProfile(id, { name, email, profilePicture }) {
  // dynamic updates
  const fields = [];
  const values = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (email !== undefined) { fields.push('email = ?'); values.push(email); }
  if (profilePicture !== undefined) { fields.push('profilePicture = ?'); values.push(profilePicture); }
  if (!fields.length) return findById(id);
  values.push(id);
  await query(`UPDATE Users SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

module.exports = {
  create,
  findByEmail,
  findById,
  findByIdWithPassword,
  updateProfile,
};
