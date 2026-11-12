const db = require("../config/database");

function create({ reporterUserId, entityType, entityId, reason }) {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO ContentReports (ReporterUserID, EntityType, EntityID, Reason)
       VALUES (?, ?, ?, ?)`,
      [reporterUserId, entityType, entityId, reason],
      (err, result) => err ? reject(err) : resolve({ id: result.insertId })
    );
  });
}

function list(status) {
  return new Promise((resolve, reject) => {
    const params = [];
    const where = status ? "WHERE R.Status = ?" : "";
    if (status) params.push(status);
    db.query(
      `SELECT R.ReportID AS id, R.ReporterUserID AS reporterUserId, R.EntityType AS entityType,
              R.EntityID AS entityId, R.Reason AS reason, R.Status AS status,
              R.ReviewedBy AS reviewedBy, R.ReviewedAt AS reviewedAt, R.Resolution AS resolution,
              R.CreatedAt AS createdAt, U.Username AS reporter
       FROM ContentReports R JOIN Users U ON U.UserID = R.ReporterUserID
       ${where} ORDER BY R.CreatedAt DESC`,
      params,
      (err, rows) => err ? reject(err) : resolve(rows)
    );
  });
}

function getById(id) {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM ContentReports WHERE ReportID = ?", [id], (err, rows) => err ? reject(err) : resolve(rows[0] || null));
  });
}

function review(id, reviewerUserId, status, resolution) {
  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE ContentReports
       SET Status = ?, ReviewedBy = ?, ReviewedAt = CURRENT_TIMESTAMP, Resolution = ?
       WHERE ReportID = ? AND Status = 'Pending'`,
      [status, reviewerUserId, resolution || null, id],
      (err, result) => err ? reject(err) : resolve(result.affectedRows > 0)
    );
  });
}

module.exports = { create, list, getById, review };
