const db = require('../config/database');

function mapCandidateRow(row) {
  return {
    id: row.StudentID,
    userId: row.UserID,
    fullName: row.FullName,
    email: row.Email,
    phone: row.Phone,
    schoolId: row.SchoolID,
    studentCode: row.StudentCode,
    major: row.Major,
    cohort: row.Cohort,
    skills: row.Skills,
    careerOrientation: row.CareerOrientation,
    verificationStatus: row.VerificationStatus
  };
}

function create(data) {
  const sql = `INSERT INTO StudentProfiles (UserID, SchoolID, StudentCode, FullName, Email, Phone, Major, Cohort, Skills, CareerOrientation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [data.userId, data.schoolId, data.studentCode, data.fullName, data.email, data.phone, data.major, data.cohort, data.skills, data.careerOrientation];
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve({ id: result.insertId, ...data });
    });
  });
}

function findAll(options = {}) {
  const { pagination, keyword, verificationStatus, schoolId } = options;
  const conditions = [];
  const params = [];
  if (keyword) {
    conditions.push("(FullName LIKE ? OR Email LIKE ? OR StudentCode LIKE ? OR Major LIKE ?)");
    const value = `%${keyword}%`;
    params.push(value, value, value, value);
  }
  if (verificationStatus) { conditions.push("VerificationStatus = ?"); params.push(verificationStatus); }
  if (schoolId) { conditions.push("SchoolID = ?"); params.push(schoolId); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const base = `FROM StudentProfiles ${where}`;
  const listSql = `SELECT StudentID, UserID, SchoolID, StudentCode, FullName, Email, Phone, Major, Cohort,
    Skills, CareerOrientation, VerificationStatus ${base}
    ORDER BY FullName ASC LIMIT ? OFFSET ?`;
  const countSql = `SELECT COUNT(*) AS total ${base}`;
  return new Promise((resolve, reject) => {
    db.query(listSql, [...params, pagination.pageSize, pagination.offset], (err, results) => {
      if (err) return reject(err);
      db.query(countSql, params, (countErr, countRows) => {
        if (countErr) return reject(countErr);
        resolve({ data: results.map(mapCandidateRow), total: countRows[0].total });
      });
    });
  });
}

function getSchoolIdForStaff(userId) {
  return new Promise((resolve, reject) => {
    db.query("SELECT SchoolID FROM SchoolStaffProfiles WHERE UserID = ? LIMIT 1", [userId],
      (err, rows) => err ? reject(err) : resolve(rows[0]?.SchoolID || null));
  });
}

function findAllBySchool(schoolId, options = {}) {
  return findAll({ ...options, schoolId });
}

function findOne(id) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT StudentID, UserID, SchoolID, StudentCode, FullName, Email, Phone, Major, Cohort, Skills, CareerOrientation, VerificationStatus FROM StudentProfiles WHERE StudentID = ?",
      [id],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0] ? mapCandidateRow(results[0]) : null);
      }
    );
  });
}

function update(id, data) {
  const fields = [];
  const params = [];
  if (data.userId !== undefined) { fields.push('UserID = ?'); params.push(data.userId); }
  if (data.fullName !== undefined) { fields.push('FullName = ?'); params.push(data.fullName); }
  if (data.email !== undefined) { fields.push('Email = ?'); params.push(data.email); }
  if (data.schoolId !== undefined) { fields.push('SchoolID = ?'); params.push(data.schoolId); }
  if (data.studentCode !== undefined) { fields.push('StudentCode = ?'); params.push(data.studentCode); }
  if (data.major !== undefined) { fields.push('Major = ?'); params.push(data.major); }
  if (data.cohort !== undefined) { fields.push('Cohort = ?'); params.push(data.cohort); }
  if (data.phone !== undefined) { fields.push('Phone = ?'); params.push(data.phone); }
  if (data.skills !== undefined) { fields.push('Skills = ?'); params.push(data.skills); }
  if (data.careerOrientation !== undefined) { fields.push('CareerOrientation = ?'); params.push(data.careerOrientation); }
  if (fields.length === 0) return Promise.resolve(null);
  const sql = `UPDATE StudentProfiles SET ${fields.join(', ')} WHERE StudentID = ?`;
  params.push(id);
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows > 0 ? { id: Number(id), ...data } : null);
    });
  });
}

function remove(id) {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM StudentProfiles WHERE StudentID = ?", [id], (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows > 0);
    });
  });
}

function findByUserId(userId) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT StudentID, UserID, SchoolID, StudentCode, FullName, Email, Phone, Major, Cohort, Skills, CareerOrientation, VerificationStatus FROM StudentProfiles WHERE UserID = ? LIMIT 1",
      [userId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0] ? mapCandidateRow(results[0]) : null);
      }
    );
  });
}

module.exports = { mapCandidateRow, create, findAll, findOne, update, remove, findByUserId, getSchoolIdForStaff, findAllBySchool };
