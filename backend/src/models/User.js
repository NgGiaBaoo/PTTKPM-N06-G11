const db = require('../config/database');

function mapUserRow(row) {
  return {
    id: row.UserID,
    username: row.Username,
    email: row.Email,
    role: row.Role,
    accountStatus: row.AccountStatus,
    emailVerified: Boolean(row.EmailVerified)
  };
}

function createUser(user) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO Users (Username, Email, PasswordHash, Role, AccountStatus, EmailVerified, CreatedBy) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      user.username,
      user.email || `${user.username}@pending.local`,
      user.passwordHash,
      user.role,
      user.accountStatus || "Active",
      user.emailVerified !== false,
      user.createdBy || null
    ];
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve({ id: result.insertId, username: user.username, email: user.email || `${user.username}@pending.local`, role: user.role, accountStatus: user.accountStatus || "Active" });
    });
  });
}

function getAllUsers() {
  return new Promise((resolve, reject) => {
    db.query('SELECT UserID, Username, Role, AccountStatus FROM Users', (err, results) => {
      if (err) return reject(err);
      resolve(results.map(mapUserRow));
    });
  });
}

function getUserRecordById(id) {
  return new Promise((resolve, reject) => {
    db.query('SELECT UserID, Username, Email, PasswordHash, Role, AccountStatus, EmailVerified FROM Users WHERE UserID = ?', [id], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null);
    });
  });
}

function updateUser(id, fields) {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE Users SET Username = ?, PasswordHash = ?, Role = ? WHERE UserID = ?';
    const params = [fields.username, fields.passwordHash, fields.role, id];
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      if (result.affectedRows === 0) return resolve(null);
      resolve({ id: Number(id), username: fields.username, role: fields.role });
    });
  });
}

function deleteUser(id) {
  return new Promise((resolve, reject) => {
    db.query('DELETE FROM Users WHERE UserID = ?', [id], (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows > 0);
    });
  });
}

function findUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.query('SELECT UserID, Username, Email, PasswordHash, Role, AccountStatus, EmailVerified FROM Users WHERE Username = ?', [username], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null);
    });
  });
}

function findUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.query('SELECT UserID, Username, Email, PasswordHash, Role, AccountStatus, EmailVerified FROM Users WHERE Email = ?', [email], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null);
    });
  });
}

function markEmailVerified(userId) {
  return new Promise((resolve, reject) => {
    db.query("UPDATE Users SET EmailVerified = TRUE, EmailVerifiedAt = CURRENT_TIMESTAMP, AccountStatus = CASE WHEN AccountStatus = 'Pending' THEN 'Active' ELSE AccountStatus END WHERE UserID = ?", [userId], (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows > 0);
    });
  });
}

function createEmailVerificationToken(userId, tokenHash, expiresAt) {
  return new Promise((resolve, reject) => {
    db.query("INSERT INTO EmailVerificationTokens (UserID, TokenHash, ExpiresAt) VALUES (?, ?, ?)", [userId, tokenHash, expiresAt], (err, result) => {
      if (err) return reject(err);
      resolve(result.insertId);
    });
  });
}

function findValidEmailVerificationToken(tokenHash) {
  return new Promise((resolve, reject) => {
    db.query("SELECT TokenID, UserID FROM EmailVerificationTokens WHERE TokenHash = ? AND UsedAt IS NULL AND ExpiresAt > CURRENT_TIMESTAMP", [tokenHash], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null);
    });
  });
}

function consumeEmailVerificationToken(tokenId) {
  return new Promise((resolve, reject) => {
    db.query("UPDATE EmailVerificationTokens SET UsedAt = CURRENT_TIMESTAMP WHERE TokenID = ? AND UsedAt IS NULL", [tokenId], (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows > 0);
    });
  });
}

function createPasswordResetToken(userId, tokenHash, expiresAt) {
  return new Promise((resolve, reject) => {
    db.query("INSERT INTO PasswordResetTokens (UserID, TokenHash, ExpiresAt) VALUES (?, ?, ?)", [userId, tokenHash, expiresAt], (err, result) => {
      if (err) return reject(err);
      resolve(result.insertId);
    });
  });
}

function findValidPasswordResetToken(tokenHash) {
  return new Promise((resolve, reject) => {
    db.query("SELECT TokenID, UserID FROM PasswordResetTokens WHERE TokenHash = ? AND UsedAt IS NULL AND ExpiresAt > CURRENT_TIMESTAMP", [tokenHash], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null);
    });
  });
}

function consumePasswordResetToken(tokenId) {
  return new Promise((resolve, reject) => {
    db.query("UPDATE PasswordResetTokens SET UsedAt = CURRENT_TIMESTAMP WHERE TokenID = ? AND UsedAt IS NULL", [tokenId], (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows > 0);
    });
  });
}

function invalidateUserTokens(tableName, userId) {
  if (!["EmailVerificationTokens", "PasswordResetTokens"].includes(tableName)) {
    return Promise.reject(new Error("Invalid token table"));
  }
  return new Promise((resolve, reject) => {
    db.query(`UPDATE ${tableName} SET UsedAt = CURRENT_TIMESTAMP WHERE UserID = ? AND UsedAt IS NULL`, [userId], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function updatePassword(id, passwordHash) {
  return new Promise((resolve, reject) => {
    db.query("UPDATE Users SET PasswordHash = ? WHERE UserID = ?", [passwordHash, id],
      (err, result) => err ? reject(err) : resolve(result.affectedRows > 0));
  });
}

function updateAccountStatus(id, status) {
  return new Promise((resolve, reject) => {
    db.query("UPDATE Users SET AccountStatus = ? WHERE UserID = ?", [status, id],
      (err, result) => err ? reject(err) : resolve(result.affectedRows > 0));
  });
}

module.exports = {
  mapUserRow, createUser, getAllUsers, getUserRecordById, updateUser, deleteUser,
  findUserByUsername, findUserByEmail, updatePassword, updateAccountStatus,
  markEmailVerified, createEmailVerificationToken, findValidEmailVerificationToken,
  consumeEmailVerificationToken, createPasswordResetToken, findValidPasswordResetToken,
  consumePasswordResetToken, invalidateUserTokens
};
