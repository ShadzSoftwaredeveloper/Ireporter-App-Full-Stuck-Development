const { query } = require('../database');
const { v4: uuidv4 } = require('uuid');

async function create({ userId, incidentId, incidentTitle, type, message, oldStatus = null, newStatus = null }) {
  const id = uuidv4();
  await query(
    'INSERT INTO Notifications (id, userId, incidentId, incidentTitle, type, message, oldStatus, newStatus, `read`) VALUES (?,?,?,?,?,?,?,?,0)',
    [id, userId, incidentId, incidentTitle, type, message, oldStatus, newStatus]
  );
  return findById(id);
}

async function findById(id) {
  const rows = await query(`SELECT * FROM Notifications WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function listByUser(userId) {
  return await query(`SELECT * FROM Notifications WHERE userId = ? ORDER BY createdAt DESC`, [userId]);
}

async function countUnread(userId) {
  const rows = await query('SELECT COUNT(*) as cnt FROM Notifications WHERE userId = ? AND `read` = 0', [userId]);
  return rows[0] ? rows[0].cnt : 0;
}

async function markAsRead(id, userId) {
  await query('UPDATE Notifications SET `read` = 1 WHERE id = ? AND userId = ?', [id, userId]);
  return findById(id);
}

async function markAllAsRead(userId) {
  await query('UPDATE Notifications SET `read` = 1 WHERE userId = ? AND `read` = 0', [userId]);
}

async function deleteById(id, userId) {
  await query(`DELETE FROM Notifications WHERE id = ? AND userId = ?`, [id, userId]);
}

module.exports = { create, findById, listByUser, countUnread, markAsRead, markAllAsRead, deleteById };
