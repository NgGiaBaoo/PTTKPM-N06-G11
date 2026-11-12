function validateCandidate(payload) {
  if (!(payload.fullName || payload.fullname)) {
    return { valid: false, message: "fullName is required" };
  }

  if (!payload.email) {
    return { valid: false, message: "email is required" };
  }
  if (!payload.schoolId) {
    return { valid: false, message: "schoolId is required" };
  }
  if (!payload.studentCode || String(payload.studentCode).trim().length < 2) {
    return { valid: false, message: "studentCode is required" };
  }
  return { valid: true };
}

function normalize(payload) {
  return {
    fullName: payload.fullName || payload.fullname || null,
    email: payload.email || null,
    phone: payload.phone || null,
    schoolId: payload.schoolId || null,
    studentCode: payload.studentCode || null,
    major: payload.major || null,
    cohort: payload.cohort || null,
    skills: payload.skills || payload.skill || null,
    careerOrientation: payload.careerOrientation || null,
    userId: payload.userId || null
  };
}

module.exports = { validateCandidate, normalize };
