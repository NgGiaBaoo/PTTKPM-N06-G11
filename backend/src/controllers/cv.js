const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const router = express.Router();
const CVModel = require("../models/CV");
const CandidateModel = require("../models/Candidate");
const { requireRole } = require("../middleware/auth");

const uploadDirectory = path.resolve(__dirname, "../uploads/cv");
fs.mkdirSync(uploadDirectory, { recursive: true });
const allowedTypes = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDirectory),
    filename: (_req, file, callback) => callback(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname).toLowerCase()}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => callback(null, allowedTypes.has(file.mimetype))
});

async function currentStudent(userId) {
  const student = await CandidateModel.findByUserId(userId);
  if (!student) {
    const error = new Error("Student profile is required");
    error.statusCode = 400;
    throw error;
  }
  return student;
}

router.get("/", requireRole("Student"), async (req, res) => {
  try {
    const student = await currentStudent(req.session.userId);
    res.json(await CVModel.listByStudent(student.id));
  } catch (err) {
    console.error("Error listing CVs:", err);
    res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : "Internal server error" });
  }
});

router.post("/", requireRole("Student"), upload.single("cv"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "A PDF or Word CV file is required" });
  try {
    const student = await currentStudent(req.session.userId);
    await CVModel.deactivateAll(student.id);
    const result = await CVModel.create({
      studentId: student.id,
      fileName: req.file.originalname,
      filePath: path.relative(path.resolve(__dirname, "../"), req.file.path),
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      isActive: true
    });
    res.status(201).json(result);
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    console.error("Error uploading CV:", err);
    res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : "Internal server error" });
  }
});

router.put("/:id/active", requireRole("Student"), async (req, res) => {
  try {
    const student = await currentStudent(req.session.userId);
    await CVModel.deactivateAll(student.id);
    const updated = await CVModel.setActive(req.params.id, student.id);
    if (!updated) return res.status(404).json({ error: "CV not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("Error selecting CV:", err);
    res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : "Internal server error" });
  }
});

router.delete("/:id", requireRole("Student"), async (req, res) => {
  try {
    const student = await currentStudent(req.session.userId);
    const file = await CVModel.findOwned(req.params.id, student.id);
    if (!file) return res.status(404).json({ error: "CV not found" });
    const deleted = await CVModel.remove(req.params.id, student.id);
    if (deleted) fs.unlink(path.resolve(__dirname, "..", file.filePath), () => {});
    res.json({ success: deleted });
  } catch (err) {
    console.error("Error deleting CV:", err);
    res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : "Internal server error" });
  }
});

module.exports = router;
