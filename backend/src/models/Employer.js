const db = require("../config/database");

function mapEmployerRow(row) {
  return {
    id: row.EmployerID,
    userId: row.UserID,
    companyName: row.CompanyName,
    email: row.Email,
    phone: row.Phone,
    address: row.Address,
    verificationStatus: row.VerificationStatus,
    businessCode: row.BusinessCode,
    industry: row.Industry,
    description: row.Description
  };
}

function createEmployer(data) {
  const sql = `INSERT INTO EmployerProfiles (UserID, CompanyName, Email, Phone, Address) VALUES (?, ?, ?, ?, ?)`;
  const params = [data.userId, data.companyName, data.email, data.phone, data.address];
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve({ id: result.insertId, ...data });
    });
  });
}

function getAllEmployers(options = {}) {
  const { pagination, keyword, verificationStatus, industry } = options;
  const conditions = [];
  const params = [];
  if (keyword) {
    conditions.push("(CompanyName LIKE ? OR BusinessCode LIKE ? OR Email LIKE ?)");
    const value = `%${keyword}%`;
    params.push(value, value, value);
  }
  if (verificationStatus) { conditions.push("VerificationStatus = ?"); params.push(verificationStatus); }
  if (industry) { conditions.push("Industry LIKE ?"); params.push(`%${industry}%`); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const base = `FROM EmployerProfiles ${where}`;
  const listSql = `SELECT EmployerID, UserID, CompanyName, BusinessCode, Industry, Email, Phone,
    Address, Description, VerificationStatus ${base}
    ORDER BY CompanyName ASC LIMIT ? OFFSET ?`;
  const countSql = `SELECT COUNT(*) AS total ${base}`;
  return new Promise((resolve, reject) => {
    db.query(listSql, [...params, pagination.pageSize, pagination.offset], (err, results) => {
      if (err) return reject(err);
      db.query(countSql, params, (countErr, countRows) => {
        if (countErr) return reject(countErr);
        resolve({ data: results.map(mapEmployerRow), total: countRows[0].total });
      });
    });
  });
}

function getEmployerById(id) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT EmployerID, UserID, CompanyName, BusinessCode, Industry, Email, Phone, Address, Description, VerificationStatus FROM EmployerProfiles WHERE EmployerID = ?",
      [id],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0] ? mapEmployerRow(results[0]) : null);
      }
    );
  });
}

function updateEmployer(id, data) {
  const fields = [];
  const params = [];
  if (data.userId !== undefined) { fields.push('UserID = ?'); params.push(data.userId); }
  if (data.companyName !== undefined) { fields.push('CompanyName = ?'); params.push(data.companyName); }
  if (data.email !== undefined) { fields.push('Email = ?'); params.push(data.email); }
  if (data.phone !== undefined) { fields.push('Phone = ?'); params.push(data.phone); }
  if (data.address !== undefined) { fields.push('Address = ?'); params.push(data.address); }
  if (data.businessCode !== undefined) { fields.push('BusinessCode = ?'); params.push(data.businessCode); }
  if (data.industry !== undefined) { fields.push('Industry = ?'); params.push(data.industry); }
  if (data.description !== undefined) { fields.push('Description = ?'); params.push(data.description); }
  if (fields.length === 0) return Promise.resolve(null);
  const sql = `UPDATE EmployerProfiles SET ${fields.join(', ')} WHERE EmployerID = ?`;
  params.push(id);
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows > 0 ? { id: Number(id), ...data } : null);
    });
  });
}

function deleteEmployer(id) {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM EmployerProfiles WHERE EmployerID = ?", [id], (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows > 0);
    });
  });
}

function findEmployerByCompany(companyName) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT EmployerID FROM EmployerProfiles WHERE CompanyName = ? LIMIT 1",
      [companyName],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0] ? results[0].EmployerID : null);
      }
    );
  });
}

function findByUserId(userId) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT EmployerID, UserID, CompanyName, BusinessCode, Industry, Email, Phone, Address, Description, VerificationStatus FROM EmployerProfiles WHERE UserID = ? LIMIT 1",
      [userId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0] ? mapEmployerRow(results[0]) : null);
      }
    );
  });
}

module.exports = { mapEmployerRow, createEmployer, getAllEmployers, getEmployerById, updateEmployer, deleteEmployer, findEmployerByCompany, findByUserId };
