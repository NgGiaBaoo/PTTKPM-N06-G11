const db = require("../config/database");

function record({ actorUserId, action, entityType, entityId, oldValue, newValue, reason }) {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO AuditLogs
       (ActorUserID, Action, EntityType, EntityID, OldValue, NewValue, Reason)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        actorUserId, action, entityType, entityId || null,
        oldValue == null ? null : JSON.stringify(oldValue),
        newValue == null ? null : JSON.stringify(newValue),
        reason || null
      ],
      (err, result) => err ? reject(err) : resolve(result.insertId)
    );
  });
}

function list(limit = 100) {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT A.AuditLogID AS id, A.Action AS action, A.EntityType AS entityType,
              A.EntityID AS entityId, A.OldValue AS oldValue, A.NewValue AS newValue,
              A.Reason AS reason, A.CreatedAt AS createdAt, U.Username AS actor
       FROM AuditLogs A JOIN Users U ON U.UserID = A.ActorUserID
       ORDER BY A.CreatedAt DESC LIMIT ?`,
      [Math.min(Math.max(Number(limit) || 100, 1), 500)],
      (err, rows) => err ? reject(err) : resolve(rows)
    );
  });
}

module.exports = { record, list };
