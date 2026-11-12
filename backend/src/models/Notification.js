const db = require("../config/database");

function create(data) {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO Notifications
       (UserID, Type, Title, Message, RelatedEntityType, RelatedEntityID)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.userId, data.type, data.title, data.message, data.relatedEntityType || null, data.relatedEntityId || null],
      (err, result) => err ? reject(err) : resolve({ id: result.insertId })
    );
  });
}

function listForUser(userId) {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT NotificationID AS id, Type AS type, Title AS title, Message AS message,
              RelatedEntityType AS relatedEntityType, RelatedEntityID AS relatedEntityId,
              IsRead AS isRead, CreatedAt AS createdAt, ReadAt AS readAt
       FROM Notifications WHERE UserID = ? ORDER BY CreatedAt DESC`,
      [userId],
      (err, rows) => err ? reject(err) : resolve(rows)
    );
  });
}

function markRead(id, userId) {
  return new Promise((resolve, reject) => {
    db.query(
      "UPDATE Notifications SET IsRead = TRUE, ReadAt = CURRENT_TIMESTAMP WHERE NotificationID = ? AND UserID = ?",
      [id, userId],
      (err, result) => err ? reject(err) : resolve(result.affectedRows > 0)
    );
  });
}

function markAllRead(userId) {
  return new Promise((resolve, reject) => {
    db.query(
      "UPDATE Notifications SET IsRead = TRUE, ReadAt = CURRENT_TIMESTAMP WHERE UserID = ? AND IsRead = FALSE",
      [userId],
      (err, result) => err ? reject(err) : resolve(result.affectedRows)
    );
  });
}

module.exports = { create, listForUser, markRead, markAllRead };
