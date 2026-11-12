const db = require("../config/database");

function link(schoolId, employerId, approvedBy) {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO SchoolEmployers (SchoolID, EmployerID, Status, ApprovedBy, ApprovedAt)
       VALUES (?, ?, 'Active', ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE Status = 'Active', ApprovedBy = VALUES(ApprovedBy), ApprovedAt = CURRENT_TIMESTAMP`,
      [schoolId, employerId, approvedBy],
      (err) => err ? reject(err) : resolve(true)
    );
  });
}

function revoke(employerId, approvedBy) {
  return new Promise((resolve, reject) => {
    db.query(
      "UPDATE SchoolEmployers SET Status = 'Revoked', ApprovedBy = ? WHERE EmployerID = ? AND Status = 'Active'",
      [approvedBy, employerId],
      (err) => err ? reject(err) : resolve(true)
    );
  });
}

module.exports = { link, revoke };
