function validateJob(payload) {
  if (!payload.title) {
    return { valid: false, message: "title is required" };
  }

  // Validate salary is a number if provided
  if (payload.salary && isNaN(Number(payload.salary))) {
    return { valid: false, message: "salary must be a number" };
  }
  if (payload.status && !["Draft", "Published", "Closed", "Expired", "Suspended", "Archived"].includes(payload.status)) {
    return { valid: false, message: "invalid job status" };
  }
  if (payload.jobType && !["FullTime", "PartTime", "Internship"].includes(payload.jobType)) {
    return { valid: false, message: "invalid job type" };
  }

  return { valid: true };
}

function normalize(payload) {
  return {
    title: payload.title || null,
    company: payload.company || null,
    employerId: payload.employerId || null,
    location: payload.location || null,
    salary: payload.salary || null,
    description: payload.description || null,
    requirements: payload.requirements || null,
    benefits: payload.benefits || null,
    jobType: payload.jobType || 'FullTime',
    deadline: payload.deadline || null,
    status: payload.status || 'Draft'
  };
}

module.exports = { validateJob, normalize };
