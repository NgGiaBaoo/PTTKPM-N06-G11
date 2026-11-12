const db = require("../config/database");

function mapJobRow(row) {
  return {
    id: row.JobID,
    title: row.JobTitle,
    company: row.CompanyName || null,
    location: row.Location,
    salary: row.Salary,
    description: row.Description,
    requirements: row.Requirements,
    benefits: row.Benefits,
    jobType: row.JobType,
    deadline: row.Deadline,
    status: row.Status,
    employerId: row.EmployerID
  };
}

function createJob(job, employerId) {
  const sql = `INSERT INTO Jobs (JobTitle, JobType, Salary, Location, Description, Requirements, Benefits, Deadline, Status, EmployerID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [job.title, job.jobType || 'FullTime', job.salary, job.location, job.description, job.requirements, job.benefits, job.deadline, job.status || 'Draft', employerId];
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve({ id: result.insertId, ...job });
    });
  });
}

function getAllJobs(options = {}) {
  const { page, pageSize, offset, sortOrder } = options.pagination || {};
  const paginated = Number.isInteger(page) && Number.isInteger(pageSize);
  const conditions = [];
  const params = [];
  if (options.publicOnly) {
    conditions.push("J.Status = 'Published'", "(J.Deadline IS NULL OR J.Deadline >= CURRENT_DATE)");
  } else if (options.status) {
    conditions.push("J.Status = ?");
    params.push(options.status);
  }
  if (options.keyword) {
    conditions.push("(J.JobTitle LIKE ? OR J.Description LIKE ? OR E.CompanyName LIKE ?)");
    const keyword = `%${options.keyword}%`;
    params.push(keyword, keyword, keyword);
  }
  if (options.location) {
    conditions.push("J.Location LIKE ?");
    params.push(`%${options.location}%`);
  }
  if (options.jobType) {
    conditions.push("J.JobType = ?");
    params.push(options.jobType);
  }
  if (options.employerId) {
    conditions.push("J.EmployerID = ?");
    params.push(options.employerId);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const base = `FROM Jobs J LEFT JOIN EmployerProfiles E ON E.EmployerID = J.EmployerID ${where}`;
  const listSql = `SELECT J.JobID, J.JobTitle, J.JobType, J.Salary, J.Location, J.Description,
      J.Requirements, J.Benefits, J.Deadline, J.Status, J.EmployerID, E.CompanyName
      ${base} ORDER BY J.CreatedAt ${sortOrder || "DESC"}${paginated ? " LIMIT ? OFFSET ?" : ""}`;
  const listParams = paginated ? [...params, pageSize, offset] : params;
  const countSql = `SELECT COUNT(*) AS total ${base}`;
  return new Promise((resolve, reject) => {
    db.query(listSql, listParams, (err, results) => {
      if (err) return reject(err);
      db.query(countSql, params, (countErr, countRows) => {
        if (countErr) return reject(countErr);
        resolve({ data: results.map(mapJobRow), total: countRows[0].total });
      });
    });
  });
}

function getJobById(id) {
  return new Promise((resolve, reject) => {
    db.query(
      `      SELECT J.JobID, J.JobTitle, J.JobType, J.Salary, J.Location, J.Description,
             J.Requirements, J.Benefits, J.Deadline, J.Status, J.EmployerID, E.CompanyName
       FROM Jobs J
       LEFT JOIN EmployerProfiles E ON E.EmployerID = J.EmployerID
       WHERE J.JobID = ?`,
      [id],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0] ? mapJobRow(results[0]) : null);
      }
    );
  });
}

function updateJob(id, data) {
  const fields = [];
  const params = [];
  if (data.title !== undefined) { fields.push('JobTitle = ?'); params.push(data.title); }
  if (data.jobType !== undefined) { fields.push('JobType = ?'); params.push(data.jobType); }
  if (data.salary !== undefined) { fields.push('Salary = ?'); params.push(data.salary); }
  if (data.location !== undefined) { fields.push('Location = ?'); params.push(data.location); }
  if (data.description !== undefined) { fields.push('Description = ?'); params.push(data.description); }
  if (data.requirements !== undefined) { fields.push('Requirements = ?'); params.push(data.requirements); }
  if (data.benefits !== undefined) { fields.push('Benefits = ?'); params.push(data.benefits); }
  if (data.deadline !== undefined) { fields.push('Deadline = ?'); params.push(data.deadline); }
  if (data.status !== undefined) { fields.push('Status = ?'); params.push(data.status); }
  if (fields.length === 0) return Promise.resolve(null);
  const sql = `UPDATE Jobs SET ${fields.join(', ')} WHERE JobID = ?`;
  params.push(id);
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows > 0);
    });
  });
}

function deleteJob(id) {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM Jobs WHERE JobID = ?", [id], (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows > 0);
    });
  });
}

function expirePublishedJobs() {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT J.JobID, J.JobTitle, J.EmployerID, E.UserID
       FROM Jobs J JOIN EmployerProfiles E ON E.EmployerID = J.EmployerID
       WHERE J.Status = 'Published' AND J.Deadline IS NOT NULL AND J.Deadline < CURRENT_DATE`,
      (selectErr, jobs) => {
        if (selectErr) return reject(selectErr);
        if (!jobs.length) return resolve([]);
        db.query(
          "UPDATE Jobs SET Status = 'Expired' WHERE Status = 'Published' AND Deadline IS NOT NULL AND Deadline < CURRENT_DATE",
          (updateErr) => updateErr ? reject(updateErr) : resolve(jobs)
        );
      }
    );
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

function getJobsByEmployerId(employerId, options = {}) {
  return getAllJobs({ ...options, employerId });
}

module.exports = {
  mapJobRow,
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  expirePublishedJobs,
  getJobsByEmployerId,
  findEmployerByCompany
};
