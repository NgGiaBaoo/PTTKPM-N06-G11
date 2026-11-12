const db = require("../config/database");

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows[0]?.total || 0));
  });
}

async function getSystemStatistics() {
  const [users, employers, students, jobs, applications, programs] = await Promise.all([
    query("SELECT COUNT(*) AS total FROM Users"),
    query("SELECT COUNT(*) AS total FROM EmployerProfiles"),
    query("SELECT COUNT(*) AS total FROM StudentProfiles"),
    query("SELECT COUNT(*) AS total FROM Jobs"),
    query("SELECT COUNT(*) AS total FROM Applications"),
    query("SELECT COUNT(*) AS total FROM ConnectionPrograms")
  ]);
  return { users, employers, students, jobs, applications, programs };
}

async function getSchoolStatistics(schoolId) {
  const [students, programs, employers, jobs, applications, acceptedApplications] = await Promise.all([
    query("SELECT COUNT(*) AS total FROM StudentProfiles WHERE SchoolID = ?", [schoolId]),
    query("SELECT COUNT(*) AS total FROM ConnectionPrograms WHERE SchoolID = ?", [schoolId]),
    query(`SELECT COUNT(DISTINCT E.EmployerID) AS total
           FROM EmployerProfiles E
           JOIN Jobs J ON J.EmployerID = E.EmployerID
           JOIN Applications A ON A.JobID = J.JobID
           JOIN StudentProfiles S ON S.StudentID = A.StudentID
           WHERE S.SchoolID = ?`, [schoolId]),
    query(`SELECT COUNT(*) AS total FROM Jobs J
           JOIN Applications A ON A.JobID = J.JobID
           JOIN StudentProfiles S ON S.StudentID = A.StudentID
           WHERE S.SchoolID = ?`, [schoolId]),
    query(`SELECT COUNT(*) AS total FROM Applications A
           JOIN StudentProfiles S ON S.StudentID = A.StudentID
           WHERE S.SchoolID = ?`, [schoolId]),
    query(`SELECT COUNT(*) AS total FROM Applications A
           JOIN StudentProfiles S ON S.StudentID = A.StudentID
           WHERE S.SchoolID = ? AND A.Status = 'Accepted'`, [schoolId])
  ]);
  return { schoolId, students, programs, employers, jobs, applications, acceptedApplications };
}

module.exports = { getSystemStatistics, getSchoolStatistics };
