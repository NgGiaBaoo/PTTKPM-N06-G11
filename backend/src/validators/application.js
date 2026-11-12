function validateApplication(payload) {
  const required = ["candidateId", "jobId"];
  for (const key of required) {
    if (!payload[key]) {
      return { valid: false, message: `${key} is required` };
    }
    if (payload.status && !["Submitted", "UnderReview", "Accepted", "Rejected", "Withdrawn"].includes(payload.status)) {
      return { valid: false, message: "invalid application status" };
    }
  }
  return { valid: true };
}

function normalize(payload) {
  const status = payload.status || "Submitted";
  const allowedStatuses = ["Submitted", "UnderReview", "Accepted", "Rejected", "Withdrawn"];
  return {
    candidateId: payload.candidateId || null,
    jobId: payload.jobId || null,
    applyDate: payload.applyDate || new Date(),
    status: allowedStatuses.includes(status) ? status : "Submitted"
  };
}

module.exports = { validateApplication, normalize };
