const express = require("express");
const router = express.Router();
const service = require("../services/candidate");
const { validateCandidate, normalize } = require("../validators/candidate");
const { parsePagination, paginationMeta } = require("../utils/pagination");

router.post("/", async (req, res) => {
  const payload = req.body || {};
  // Candidate can only create profile for themselves
  if (req.session.role === 'Student' && payload.userId !== req.session.userId) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const valid = validateCandidate(payload);
  if (!valid.valid) {
    return res.status(400).json({ message: valid.message });
  }

  const candidate = normalize(payload);
  try {
    const created = await service.create(candidate);
    res.status(201).json({ message: "Candidate created successfully", data: created });
  } catch (err) {
    console.error("Error in candidate:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/by-user/:userId", async (req, res) => {
  try {
    if (req.session.role !== 'Admin' && Number(req.params.userId) !== req.session.userId) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    const candidate = await service.findByUserId(req.params.userId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found for this user" });
    }
    res.status(200).json({ message: "Candidate found", data: candidate });
  } catch (err) {
    console.error("Error in candidate:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    if (!['Admin', 'SchoolStaff', 'Employer'].includes(req.session.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    const candidateModel = require("../models/Candidate");
    const schoolId = req.session.role === 'SchoolStaff'
      ? await candidateModel.getSchoolIdForStaff(req.session.userId)
      : null;
    if (req.session.role === 'SchoolStaff' && !schoolId) {
      return res.status(403).json({ message: "School staff profile is not configured" });
    }
    const pagination = parsePagination(req.query);
    const options = {
      pagination,
      keyword: String(req.query.keyword || "").trim(),
      verificationStatus: req.query.verificationStatus
    };
    const candidates = schoolId
      ? await candidateModel.findAllBySchool(schoolId, options)
      : await service.findAll(options);
    res.status(200).json({
      message: "All candidates",
      data: candidates.data,
      pagination: paginationMeta(pagination.page, pagination.pageSize, candidates.total)
    });
  } catch (err) {
    console.error("Error in candidate:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const candidate = await service.findOne(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: `Candidate with id ${req.params.id} not found` });
    }
    if (req.session.role === 'Student' && candidate.userId !== req.session.userId) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    if (!['Admin', 'SchoolStaff', 'Employer', 'Student'].includes(req.session.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    res.status(200).json({ message: "Candidate found", data: candidate });
  } catch (err) {
    console.error("Error in candidate:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    // Candidate can only update own profile
    if (req.session.role === 'Student') {
      const candidate = await service.findOne(req.params.id);
      if (!candidate) {
        return res.status(404).json({ message: `Candidate with id ${req.params.id} not found` });
      }
      if (candidate.userId !== req.session.userId) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
    }
    const updates = Object.fromEntries(
      Object.entries(normalize(req.body || {})).filter(([, v]) => v != null)
    );
    const updated = await service.update(req.params.id, updates);
    res.status(200).json({ message: "Candidate updated successfully", data: updated });
  } catch (err) {
    console.error("Error in candidate:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  if (req.session.role !== 'Admin') {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  try {
    const deleted = await service.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: `Candidate with id ${req.params.id} not found` });
    }
    res.status(200).json({ message: `Candidate with id ${req.params.id} deleted successfully` });
  } catch (err) {
    console.error("Error in candidate:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
