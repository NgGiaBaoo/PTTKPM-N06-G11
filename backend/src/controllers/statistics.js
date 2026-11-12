const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/auth");
const Statistics = require("../models/Statistics");
const Candidate = require("../models/Candidate");

router.get("/system", requireRole("Admin"), async (req, res) => {
  try {
    res.json({ data: await Statistics.getSystemStatistics() });
  } catch (err) {
    console.error("Error loading system statistics:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/school", requireRole("SchoolStaff", "Admin"), async (req, res) => {
  try {
    if (req.session.role === "Admin" && req.query.schoolId) {
      return res.json({ data: await Statistics.getSchoolStatistics(Number(req.query.schoolId)) });
    }
    if (req.session.role === "Admin") {
      return res.json({ data: await Statistics.getSystemStatistics() });
    }
    const schoolId = await Candidate.getSchoolIdForStaff(req.session.userId);
    if (!schoolId) return res.status(403).json({ error: "School staff profile is not configured" });
    res.json({ data: await Statistics.getSchoolStatistics(schoolId) });
  } catch (err) {
    console.error("Error loading school statistics:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
