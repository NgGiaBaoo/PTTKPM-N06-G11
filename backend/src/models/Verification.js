const db = require("../config/database");

function submit(employerId) {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT VerificationRequestID FROM VerificationRequests
       WHERE EmployerID = ? AND Status = 'Pending' LIMIT 1`,
      [employerId],
      (findError, existing) => {
        if (findError) return reject(findError);
        if (existing.length) {
          return reject(Object.assign(new Error("Verification request already pending"), { code: "ALREADY_PENDING" }));
        }
        db.query(
      `INSERT INTO VerificationRequests (EmployerID, Status)
       VALUES (?, 'Pending')`,
      [employerId],
          (err, result) => err ? reject(err) : resolve({ id: result.insertId })
        );
      }
    );
  });
}

function getForEmployer(employerId) {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT VerificationRequestID AS id, EmployerID AS employerId, Status AS status,
              SubmittedAt AS submittedAt, ReviewedAt AS reviewedAt, Reason AS reason
       FROM VerificationRequests WHERE EmployerID = ? ORDER BY SubmittedAt DESC`,
      [employerId],
      (err, rows) => err ? reject(err) : resolve(rows)
    );
  });
}

function listPending() {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT V.VerificationRequestID AS id, V.EmployerID AS employerId,
              V.Status AS status, V.SubmittedAt AS submittedAt, V.Reason AS reason,
              E.CompanyName AS companyName, E.BusinessCode AS businessCode
       FROM VerificationRequests V
       JOIN EmployerProfiles E ON E.EmployerID = V.EmployerID
       WHERE V.Status = 'Pending' ORDER BY V.SubmittedAt ASC`,
      (err, rows) => err ? reject(err) : resolve(rows)
    );
  });
}

function review(id, reviewerId, status, reason) {
  return new Promise((resolve, reject) => {
    db.beginTransaction((transactionError) => {
      if (transactionError) return reject(transactionError);
      db.query(
        "SELECT EmployerID FROM VerificationRequests WHERE VerificationRequestID = ? AND Status = 'Pending' FOR UPDATE",
        [id],
        (findError, rows) => {
          if (findError || !rows[0]) {
            return db.rollback(() => reject(findError || Object.assign(new Error("Verification request not pending"), { code: "NOT_PENDING" })));
          }
          const employerId = rows[0].EmployerID;
          const employerStatus = status === 'Approved' ? 'Verified' : 'Rejected';
          db.query(
            "UPDATE VerificationRequests SET Status = ?, ReviewedBy = ?, ReviewedAt = CURRENT_TIMESTAMP, Reason = ? WHERE VerificationRequestID = ?",
            [status, reviewerId, reason || null, id],
            (updateError) => {
              if (updateError) return db.rollback(() => reject(updateError));
              db.query(
                "UPDATE EmployerProfiles SET VerificationStatus = ? WHERE EmployerID = ?",
                [employerStatus, employerId],
                (profileError) => {
                  if (profileError) return db.rollback(() => reject(profileError));
                  db.commit((commitError) => commitError ? reject(commitError) : resolve({ employerId, status: employerStatus }));
                }
              );
            }
          );
        }
      );
    });
  });
}

function revoke(employerId, reviewerId, reason) {
  return new Promise((resolve, reject) => {
    db.query(
      "UPDATE EmployerProfiles SET VerificationStatus = 'Revoked' WHERE EmployerID = ? AND VerificationStatus = 'Verified'",
      [employerId],
      (err, result) => {
        if (err) return reject(err);
        if (!result.affectedRows) return resolve(false);
        db.query(
          `INSERT INTO VerificationRequests (EmployerID, ReviewedBy, Status, ReviewedAt, Reason)
           VALUES (?, ?, 'Revoked', CURRENT_TIMESTAMP, ?)`,
          [employerId, reviewerId, reason || null],
          (insertError) => insertError ? reject(insertError) : resolve(true)
        );
      }
    );
  });
}

module.exports = { submit, getForEmployer, listPending, review, revoke };
