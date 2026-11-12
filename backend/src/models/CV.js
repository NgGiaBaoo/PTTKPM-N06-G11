const db = require("../config/database");

function listByStudent(studentId) {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT CVID AS id, StudentID AS studentId, FileName AS fileName,
              FilePath AS filePath, MimeType AS mimeType, FileSize AS fileSize,
              IsActive AS isActive, UploadedAt AS uploadedAt
       FROM StudentCVs WHERE StudentID = ? ORDER BY UploadedAt DESC`,
      [studentId],
      (err, rows) => err ? reject(err) : resolve(rows)
    );
  });
}

function findOwned(id, studentId) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT CVID AS id, StudentID AS studentId, FileName AS fileName, FilePath AS filePath, MimeType AS mimeType, FileSize AS fileSize FROM StudentCVs WHERE CVID = ? AND StudentID = ?",
      [id, studentId],
      (err, rows) => err ? reject(err) : resolve(rows[0] || null)
    );
  });
}

function create(data) {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO StudentCVs (StudentID, FileName, FilePath, MimeType, FileSize, IsActive)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.studentId, data.fileName, data.filePath, data.mimeType, data.fileSize, data.isActive],
      (err, result) => err ? reject(err) : resolve({ id: result.insertId })
    );
  });
}

function deactivateAll(studentId) {
  return new Promise((resolve, reject) => {
    db.query("UPDATE StudentCVs SET IsActive = FALSE WHERE StudentID = ?", [studentId],
      (err) => err ? reject(err) : resolve(true));
  });
}

function setActive(id, studentId) {
  return new Promise((resolve, reject) => {
    db.query("UPDATE StudentCVs SET IsActive = TRUE WHERE CVID = ? AND StudentID = ?", [id, studentId],
      (err, result) => err ? reject(err) : resolve(result.affectedRows > 0));
  });
}

function remove(id, studentId) {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM StudentCVs WHERE CVID = ? AND StudentID = ?", [id, studentId],
      (err, result) => err ? reject(err) : resolve(result.affectedRows > 0));
  });
}

function createApplicationDocument(applicationId, cv) {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO ApplicationDocuments
       (ApplicationID, DocumentType, FileName, FilePath, MimeType, FileSize)
       VALUES (?, 'CV', ?, ?, ?, ?)`,
      [applicationId, cv.fileName, cv.filePath, cv.mimeType, cv.fileSize],
      (err, result) => err ? reject(err) : resolve({ id: result.insertId })
    );
  });
}

module.exports = { listByStudent, findOwned, create, deactivateAll, setActive, remove, createApplicationDocument };
