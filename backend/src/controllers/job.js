const express = require("express");
const router = express.Router();
const service = require("../services/job");
const EmployerModel = require("../models/Employer");
const { requireRole } = require("../middleware/auth");
const { validateJob, normalize } = require("../validators/job");
const { parsePagination, paginationMeta } = require("../utils/pagination");

router.post("/", async (req, res) => {
  const payload = req.body || {};
  const valid = validateJob(payload);
  if (!valid.valid) return res.status(400).json({ error: valid.message });

  const job = normalize(payload);
  try {
    if (!['Employer', 'Admin'].includes(req.session.role)) {
      return res.status(403).json({ error: "Only employers can create jobs" });
    }
    let employerId = Number(payload.employerId);
    if (req.session.role === 'Employer') {
      const employer = await EmployerModel.findByUserId(req.session.userId);
      if (!employer) return res.status(404).json({ error: "No employer profile found" });
      if (employer.verificationStatus !== 'Verified') {
        return res.status(403).json({ error: "Employer verification is required before posting jobs" });
      }
      employerId = employer.id;
    }
    if (!employerId) return res.status(400).json({ error: "employerId is required for admin-created jobs" });
    const created = await service.createJob(job, employerId);
    res.status(201).json(created);
  } catch (err) {
    console.error("Error in job:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const options = {
      pagination,
      keyword: String(req.query.keyword || "").trim(),
      location: String(req.query.location || "").trim(),
      jobType: req.query.jobType,
      status: req.query.status
    };
    if (req.query.employerId) {
      if (req.session.role === 'Employer') {
        const employer = await EmployerModel.findByUserId(req.session.userId);
        if (!employer || Number(req.query.employerId) !== employer.id) {
          return res.status(403).json({ error: "Insufficient permissions" });
        }
      }
      const jobs = await service.getJobsByEmployerId(req.query.employerId, options);
      return res.json({ data: jobs.data, pagination: paginationMeta(pagination.page, pagination.pageSize, jobs.total) });
    }
    const jobs = await service.getAllJobs({
      ...options,
      publicOnly: req.session.role === "Student"
    });
    res.json({ data: jobs.data, pagination: paginationMeta(pagination.page, pagination.pageSize, jobs.total) });
  } catch (err) {
    console.error("Error in job:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const job = await service.getJobById(req.params.id);
    if (!job) return res.status(404).json({ error: "Not found" });
    if (req.session.role === 'Student' && job.status !== 'Published') {
      return res.status(404).json({ error: "Not found" });
    }
    if (req.session.role === 'Employer') {
      const employer = await EmployerModel.findByUserId(req.session.userId);
      if (!employer || employer.id !== job.employerId) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
    }
    res.json(job);
  } catch (err) {
    console.error("Error in job:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  const updates = Object.fromEntries(
    Object.entries(normalize(req.body || {})).filter(([, v]) => v != null)
  );
  try {
    const existing = await service.getJobById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (req.session.role === 'Employer') {
      const employer = await EmployerModel.findByUserId(req.session.userId);
      if (!employer || employer.id !== existing.employerId) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      delete updates.employerId;
    } else if (req.session.role !== 'Admin') {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    const ok = await service.updateJob(req.params.id, updates);
    if (!ok) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("Error in job:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const existing = await service.getJobById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (req.session.role === 'Employer') {
      const employer = await EmployerModel.findByUserId(req.session.userId);
      if (!employer || employer.id !== existing.employerId) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
    } else if (req.session.role !== 'Admin') {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    const ok = await service.deleteJob(req.params.id);
    if (!ok) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("Error in job:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
