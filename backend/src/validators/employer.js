function validateEmployer(payload) {
  const required = ["companyName", "email"];
  for (const key of required) {
    if (!payload[key]) {
      return { valid: false, message: `${key} is required` };
    }
  }
  return { valid: true };
}

function normalize(payload) {
  return {
    companyName: payload.companyName || payload.company || null,
    email: payload.email || null,
    phone: payload.phone || null,
    address: payload.address || null,
    businessCode: payload.businessCode || null,
    industry: payload.industry || null,
    description: payload.description || null,
    userId: payload.userId || null
  };
}

module.exports = { validateEmployer, normalize };
