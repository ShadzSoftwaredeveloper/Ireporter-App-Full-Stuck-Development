const { query } = require('../database');

class OTP {
  static async create(email, code, expiresIn = 10 * 60 * 1000) {
    const expiresAt = new Date(Date.now() + expiresIn);
    await query(
      `INSERT INTO OTPs (email, code, expiresAt) VALUES (?, ?, ?)`,
      [email, code, expiresAt]
    );
  }

  static async findByEmail(email) {
    const rows = await query(
      `SELECT * FROM OTPs WHERE email = ? AND expiresAt > NOW() ORDER BY createdAt DESC LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  }

  static async verify(email, code) {
    const otp = await this.findByEmail(email);
    if (!otp) return false;
    return otp.code === code;
  }

  static async delete(email) {
    await query(`DELETE FROM OTPs WHERE email = ?`, [email]);
  }

  static async deleteExpired() {
    await query(`DELETE FROM OTPs WHERE expiresAt <= NOW()`);
  }
}

module.exports = OTP;
