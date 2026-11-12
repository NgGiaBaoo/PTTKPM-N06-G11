const db = require("../config/database");

function mapProgram(row) {
  return {
    id: row.ProgramID,
    name: row.Name,
    description: row.Description,
    startDate: row.StartDate,
    endDate: row.EndDate,
    location: row.Location,
    status: row.Status,
    createdBy: row.CreatedBy,
    studentCount: Number(row.StudentCount || 0),
    employerCount: Number(row.EmployerCount || 0)
  };
}

function getAll() {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT P.ProgramID, P.Name, P.Description, P.StartDate, P.EndDate,
              P.SchoolID, P.Location, P.Status, P.CreatedBy,
              COUNT(DISTINCT PS.StudentID) AS StudentCount,
              COUNT(DISTINCT PE.EmployerID) AS EmployerCount
       FROM ConnectionPrograms P
       LEFT JOIN ProgramStudents PS ON PS.ProgramID = P.ProgramID
       LEFT JOIN ProgramEmployers PE ON PE.ProgramID = P.ProgramID
       GROUP BY P.ProgramID
       ORDER BY P.StartDate DESC`,
      (err, rows) => err ? reject(err) : resolve(rows.map(mapProgram))
    );
  });
}

function create(data, userId) {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO ConnectionPrograms
       (SchoolID, Name, Description, StartDate, EndDate, Location, Status, CreatedBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.schoolId, data.name, data.description, data.startDate, data.endDate,
        data.location, data.status || "Draft", userId],
      (err, result) => err
        ? reject(err)
        : resolve({ id: result.insertId, ...data, createdBy: userId })
    );
  });
}

function getSchoolIdForStaff(userId) {
  return new Promise((resolve, reject) => {
    db.query("SELECT SchoolID FROM SchoolStaffProfiles WHERE UserID = ? LIMIT 1", [userId],
      (err, rows) => err ? reject(err) : resolve(rows[0]?.SchoolID || null));
  });
}

function update(id, data) {
  const columns = {
    name: "Name", description: "Description", startDate: "StartDate",
    endDate: "EndDate", location: "Location", status: "Status"
  };
  const fields = [];
  const params = [];
  for (const [key, column] of Object.entries(columns)) {
    if (data[key] !== undefined) {
      fields.push(`${column} = ?`);
      params.push(data[key]);
    }

  }
  if (!fields.length) return Promise.resolve(false);
  params.push(id);
  return new Promise((resolve, reject) => {
    db.query(`UPDATE ConnectionPrograms SET ${fields.join(", ")} WHERE ProgramID = ?`,
      params, (err, result) => err ? reject(err) : resolve(result.affectedRows > 0));
  });
}

function getById(id) {
  return new Promise((resolve, reject) => {
    db.query("SELECT ProgramID, SchoolID, CreatedBy FROM ConnectionPrograms WHERE ProgramID = ?", [id],
      (err, rows) => err ? reject(err) : resolve(rows[0] || null));
  });
}

function registerStudent(programId, candidateId) {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO ProgramStudents (ProgramID, StudentID)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE Status = 'Registered'`,
      [programId, candidateId],
      (err) => err ? reject(err) : resolve(true)
    );
  });
}

function joinEmployer(programId, employerId) {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO ProgramEmployers (ProgramID, EmployerID)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE Status = 'Pending'`,
      [programId, employerId],
      (err) => err ? reject(err) : resolve(true)
    );
  });
}

function getStatistics() {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT
        (SELECT COUNT(*) FROM ConnectionPrograms) AS programs,
        (SELECT COUNT(*) FROM ProgramStudents) AS students,
        (SELECT COUNT(*) FROM ProgramEmployers) AS employers,
        (SELECT COUNT(*) FROM Applications) AS applications`,
      (err, rows) => err ? reject(err) : resolve(rows[0])
    );
  });
}

module.exports = { getAll, create, update, getById, registerStudent, joinEmployer, getStatistics, getSchoolIdForStaff };
