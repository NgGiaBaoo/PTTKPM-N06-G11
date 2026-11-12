const express = require("express");
const router = express.Router();
const ProgramModel = require("../models/Program");
const CandidateModel = require("../models/Candidate");
const EmployerModel = require("../models/Employer");
const { requireRole } = require("../middleware/auth");

function validateProgram(payload) {
  if (!payload.name || !payload.startDate || !payload.endDate) {
    return "Tên, ngày bắt đầu và ngày kết thúc là bắt buộc";
  }
  if (payload.endDate < payload.startDate) return "Ngày kết thúc phải sau ngày bắt đầu";
  if (payload.status && !["Draft", "Open", "Cancelled"].includes(payload.status)) {
    return "Trạng thái chương trình không hợp lệ";
  }
  return null;
}

router.get("/", async (req, res) => {
  try {
    res.json(await ProgramModel.getAll());
  } catch (err) {
    console.error("Error in programs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/statistics", requireRole("SchoolStaff", "Admin"), async (req, res) => {
  try {
    res.json(await ProgramModel.getStatistics());
  } catch (err) {
    console.error("Error in program statistics:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireRole("SchoolStaff", "Admin"), async (req, res) => {
  const error = validateProgram(req.body || {});
  if (error) return res.status(400).json({ error });
  try {
    const data = { ...req.body };
    if (req.session.role === 'SchoolStaff') {
      data.schoolId = await ProgramModel.getSchoolIdForStaff(req.session.userId);
      if (!data.schoolId) return res.status(403).json({ error: "School staff profile is not configured" });
    } else if (!data.schoolId) {
      return res.status(400).json({ error: "schoolId is required for admin-created programs" });
    }
    res.status(201).json(await ProgramModel.create(data, req.session.userId));
  } catch (err) {
    console.error("Error creating program:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", requireRole("SchoolStaff", "Admin"), async (req, res) => {
  const error = validateProgram({ ...req.body, name: req.body.name || "valid" });
  if (error && (req.body.startDate || req.body.endDate || req.body.name)) {
    return res.status(400).json({ error });
  }
  try {
    const existing = await ProgramModel.getById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Program not found" });
    if (req.session.role === 'SchoolStaff') {
      const schoolId = await ProgramModel.getSchoolIdForStaff(req.session.userId);
      if (!schoolId || Number(existing.SchoolID) !== Number(schoolId)) {
        return res.status(403).json({ error: "Program belongs to another school" });
      }
    }
    const updated = await ProgramModel.update(req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ error: "Program not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating program:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/register", requireRole("Student"), async (req, res) => {
  try {
    const candidate = await CandidateModel.findByUserId(req.session.userId);
    if (!candidate) return res.status(404).json({ error: "No student profile found" });
    await ProgramModel.registerStudent(req.params.id, candidate.id);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error("Error registering student:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/join", requireRole("Employer"), async (req, res) => {
  try {
    const employer = await EmployerModel.findByUserId(req.session.userId);
    if (!employer) return res.status(404).json({ error: "No employer profile found" });
    await ProgramModel.joinEmployer(req.params.id, employer.id);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error("Error joining employer:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
