const db = require("../config/database");

function mapApplicationRow(row) {
  return {
    id: row.ApplicationID,
    candidateId: row.StudentID,
    jobId: row.JobID,
    applyDate: row.ApplyDate,
    status: row.Status,
    jobTitle: row.JobTitle,
    companyName: row.CompanyName,
    candidateName: row.CandidateName,
    candidateEmail: row.CandidateEmail,
    rejectionReason: row.RejectionReason
  };
}

function createApplication(data) {
  const sql = `INSERT INTO Applications (StudentID, JobID, ApplyDate, Status) VALUES (?, ?, ?, ?)`;
  const params = [data.candidateId, data.jobId, data.applyDate, data.status || 'Submitted'];
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve({ id: result.insertId, ...data });
    });
  });
}

function queryPaged(selectSql, fromSql, params, pagination) {
  const pageSize = pagination?.pageSize || 100;
  const offset = pagination?.offset || 0;
  return new Promise((resolve, reject) => {
    db.query(`${selectSql} ORDER BY A.ApplyDate DESC LIMIT ? OFFSET ?`, [...params, pageSize, offset], (err, results) => {
      if (err) return reject(err);
      db.query(`SELECT COUNT(*) AS total ${fromSql}`, params, (countErr, countRows) => {
        if (countErr) return reject(countErr);
        resolve({ data: results, total: countRows[0].total });
      });
    });
  });
}

function getAllApplications(options = {}) {
  const conditions = [];
  const params = [];
  if (options.status) { conditions.push("A.Status = ?"); params.push(options.status); }
  if (options.keyword) {
    conditions.push("(J.JobTitle LIKE ? OR E.CompanyName LIKE ? OR S.FullName LIKE ?)");
    const value = `%${options.keyword}%`;
    params.push(value, value, value);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const base = `FROM Applications A
    JOIN Jobs J ON J.JobID = A.JobID
    JOIN EmployerProfiles E ON E.EmployerID = J.EmployerID
    JOIN StudentProfiles S ON S.StudentID = A.StudentID ${where}`;
  const select = `SELECT A.ApplicationID, A.StudentID, A.JobID, A.ApplyDate, A.Status,
    A.RejectionReason, J.JobTitle, E.CompanyName, S.FullName AS CandidateName,
    S.Email AS CandidateEmail ${base}`;
  return new Promise((resolve, reject) => {
    queryPaged(select, base, params, options.pagination)
      .then((result) => resolve({ data: result.data.map(mapApplicationRow), total: result.total }))
      .catch(reject);
  });
}

function getApplicationById(id) {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT A.ApplicationID, A.StudentID, A.JobID, A.ApplyDate, A.Status, A.RejectionReason,
              J.JobTitle, E.CompanyName, S.FullName AS CandidateName, S.Email AS CandidateEmail
       FROM Applications A
       JOIN Jobs J ON J.JobID = A.JobID
       JOIN EmployerProfiles E ON E.EmployerID = J.EmployerID
       JOIN StudentProfiles S ON S.StudentID = A.StudentID
       WHERE A.ApplicationID = ?`,
      [id],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0] ? mapApplicationRow(results[0]) : null);
      }
    );
  });
}

function updateApplication(id, data) {
  const fields = [];
  const params = [];
  if (data.status !== undefined) { fields.push('Status = ?'); params.push(data.status); }
  if (data.rejectionReason !== undefined) { fields.push('RejectionReason = ?'); params.push(data.rejectionReason); }
  if (fields.length === 0) return Promise.resolve(null);
  const sql = `UPDATE Applications SET ${fields.join(', ')} WHERE ApplicationID = ?`;
  params.push(id);
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows > 0);
    });
  });
}

function deleteApplication(id) {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM Applications WHERE ApplicationID = ?", [id], (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows > 0);
    });
  });
}

function getApplicationsByJobId(jobId, options = {}) {
  return getApplicationsByFilter("A.JobID = ?", jobId, options);
}

function getApplicationsByCandidateId(candidateId, options = {}) {
  return getApplicationsByFilter("A.StudentID = ?", candidateId, options);
}

function getApplicationsByEmployerId(employerId, options = {}) {
  return getApplicationsByFilter("J.EmployerID = ?", employerId, options);
}

function getApplicationsByFilter(filter, value, options = {}) {
  const conditions = [filter];
  const params = [value];
  if (options.status) { conditions.push("A.Status = ?"); params.push(options.status); }
  if (options.keyword) {
    conditions.push("(J.JobTitle LIKE ? OR E.CompanyName LIKE ? OR S.FullName LIKE ?)");
    const keyword = `%${options.keyword}%`;
    params.push(keyword, keyword, keyword);
  }
  const base = `FROM Applications A
    JOIN Jobs J ON J.JobID = A.JobID
    JOIN EmployerProfiles E ON E.EmployerID = J.EmployerID
    LEFT JOIN StudentProfiles S ON S.StudentID = A.StudentID
    WHERE ${conditions.join(" AND ")}`;
  const select = `SELECT A.ApplicationID, A.StudentID, A.JobID, A.ApplyDate, A.Status,
    A.RejectionReason, J.JobTitle, J.Salary, J.Location, E.CompanyName,
    S.FullName AS CandidateName, S.Email AS CandidateEmail, S.Phone AS CandidatePhone,
    S.Skills ${base}`;
  return queryPaged(select, base, params, options.pagination);
}

function getEmployerUserId(id) {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT U.UserID FROM Applications A
       JOIN Jobs J ON J.JobID = A.JobID
       JOIN EmployerProfiles E ON E.EmployerID = J.EmployerID
       JOIN Users U ON U.UserID = E.UserID
       WHERE A.ApplicationID = ?`,
      [id],
      (err, rows) => err ? reject(err) : resolve(rows[0]?.UserID || null)
    );
  });
}

function recordStatusHistory(id, oldStatus, newStatus, changedBy, reason) {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO ApplicationStatusHistory
       (ApplicationID, OldStatus, NewStatus, ChangedBy, Reason)
       VALUES (?, ?, ?, ?, ?)`,
      [id, oldStatus, newStatus, changedBy, reason || null],
      (err) => err ? reject(err) : resolve(true)
    );
  });
}

module.exports = { mapApplicationRow, createApplication, getAllApplications, getApplicationById, updateApplication, deleteApplication, getApplicationsByJobId, getApplicationsByCandidateId, getApplicationsByEmployerId, getEmployerUserId, recordStatusHistory };
