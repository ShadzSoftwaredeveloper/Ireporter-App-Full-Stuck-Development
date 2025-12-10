const { query } = require('../database');

async function create(email, code, expiresIn = 10 * 60 * 1000) {
  const expiresAt = new Date(Date.now() + expiresIn);
  await query(
    `INSERT INTO OTPs (email, code, expiresAt) VALUES (?, ?, ?)`,
    [email, code, expiresAt]
  );
}

async function findByEmail(email) {
  const rows = await query(
    `SELECT * FROM OTPs WHERE email = ? AND expiresAt > NOW() ORDER BY createdAt DESC LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function verify(email, code) {
  const otp = await findByEmail(email);
  if (!otp) return false;
  return otp.code === code;
}

async function deleteByEmail(email) {
  await query(`DELETE FROM OTPs WHERE email = ?`, [email]);
}

async function deleteExpired() {
  await query(`DELETE FROM OTPs WHERE expiresAt <= NOW()`);
}

module.exports = {
  create,
  findByEmail,
  verify,
  deleteByEmail,
  deleteExpired,
};
