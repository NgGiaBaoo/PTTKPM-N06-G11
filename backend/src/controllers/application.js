const express = require("express");
const router = express.Router();
const service = require("../services/application");
const { validateApplication, normalize } = require("../validators/application");
const CandidateModel = require("../models/Candidate");
const EmployerModel = require("../models/Employer");
const JobModel = require("../models/Job");
const NotificationModel = require("../models/Notification");
const CVModel = require("../models/CV");
const { parsePagination, paginationMeta } = require("../utils/pagination");

router.post("/", async (req, res) => {
  if (req.session.role !== 'Student') {
    return res.status(403).json({ error: "Only students can apply" });
  }
  const payload = req.body || {};
  const student = await CandidateModel.findByUserId(req.session.userId);
  if (!student) return res.status(400).json({ error: "Complete your student profile first" });
  payload.candidateId = student.id;
  const valid = validateApplication(payload);
  if (!valid.valid) return res.status(400).json({ error: valid.message });

    const application = normalize(payload);
    try {
      const job = await JobModel.getJobById(application.jobId);
      if (!job || job.status !== 'Published' || (job.deadline && new Date(job.deadline) < new Date())) {
        return res.status(400).json({ error: "This job is no longer accepting applications" });
      }
      if (payload.cvId) {
        const cv = await CVModel.findOwned(payload.cvId, student.id);
        if (!cv) return res.status(400).json({ error: "Selected CV does not belong to you" });
        application.cv = cv;
      }
      const created = await service.createApplication(application);
      if (application.cv) await CVModel.createApplicationDocument(created.id, application.cv);
      await require("../models/Application").recordStatusHistory(created.id, null, 'Submitted', req.session.userId, 'Student submitted application');
      const employer = await EmployerModel.getEmployerById(job.employerId);
      if (employer) {
        await NotificationModel.create({
          userId: employer.userId,
          type: 'NEW_APPLICATION',
          title: 'Có hồ sơ ứng tuyển mới',
          message: `${student.fullName} đã ứng tuyển vào vị trí ${job.title}.`,
          relatedEntityType: 'Application',
          relatedEntityId: created.id
        });
      }
      res.status(201).json(created);
    } catch (err) {
      console.error("Error in application:", err);
      res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/", async (req, res) => {
  try {
    const role = req.session.role;
    const userId = req.session.userId;
    const pagination = parsePagination(req.query);
    const options = {
      pagination,
      keyword: String(req.query.keyword || "").trim(),
      status: req.query.status
    };

    // Student: only their own applications
    if (role === 'Student') {
      const CandidateModel = require('../models/Candidate');
      const candidate = await CandidateModel.findByUserId(userId);
      if (!candidate) return res.status(404).json({ error: "No candidate profile found" });
      const apps = await service.getApplicationsByCandidateId(candidate.id, options);
      return res.json({ data: apps.data, pagination: paginationMeta(pagination.page, pagination.pageSize, apps.total) });
    }

    // Employer: only applications for their jobs
    if (role === 'Employer') {
      const EmployerModel = require('../models/Employer');
      const employer = await EmployerModel.findByUserId(userId);
      if (!employer) return res.status(404).json({ error: "No employer profile found" });
      const apps = await service.getApplicationsByEmployerId(employer.id, options);
      return res.json({ data: apps.data, pagination: paginationMeta(pagination.page, pagination.pageSize, apps.total) });
    }

    // Admin: see everything (including query params for filtering)
    if (req.query.candidateId) {
      const apps = await service.getApplicationsByCandidateId(req.query.candidateId, options);
      return res.json({ data: apps.data, pagination: paginationMeta(pagination.page, pagination.pageSize, apps.total) });
    }
    if (req.query.jobId) {
      const apps = await service.getApplicationsByJobId(req.query.jobId, options);
      return res.json({ data: apps.data, pagination: paginationMeta(pagination.page, pagination.pageSize, apps.total) });
    }
    if (req.query.employerId) {
      const apps = await service.getApplicationsByEmployerId(req.query.employerId, options);
      return res.json({ data: apps.data, pagination: paginationMeta(pagination.page, pagination.pageSize, apps.total) });
    }

    const applications = await service.getAllApplications(options);
    res.json({ data: applications.data, pagination: paginationMeta(pagination.page, pagination.pageSize, applications.total) });
  } catch (err) {
    console.error("Error in application:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const application = await service.getApplicationById(req.params.id);
    if (!application) return res.status(404).json({ error: "Not found" });
    if (req.session.role === 'Student') {
      const student = await CandidateModel.findByUserId(req.session.userId);
      if (!student || student.id !== application.candidateId) return res.status(403).json({ error: "Insufficient permissions" });
    }
    if (req.session.role === 'Employer') {
      const employer = await EmployerModel.findByUserId(req.session.userId);
      const owner = await require("../models/Application").getEmployerUserId(req.params.id);
      if (!employer || !owner || owner !== req.session.userId) return res.status(403).json({ error: "Insufficient permissions" });
    }
    res.json(application);
  } catch (err) {
    console.error("Error in application:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  // Only update fields actually provided in the request body
  if (!['Admin', 'Employer', 'Student'].includes(req.session.role)) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }
  const existing = await service.getApplicationById(req.params.id);
  if (!existing) return res.status(404).json({ error: "Not found" });
  if (req.session.role === 'Employer') {
    const owner = await require("../models/Application").getEmployerUserId(req.params.id);
    if (owner !== req.session.userId) return res.status(403).json({ error: "Insufficient permissions" });
  } else if (req.session.role === 'Student') {
    if (existing.candidateId !== (await CandidateModel.findByUserId(req.session.userId))?.id) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    if (req.body.status !== 'Withdrawn') return res.status(403).json({ error: "Students can only withdraw applications" });
  }
  const allowed = ['status', 'rejectionReason'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      let val = req.body[key];
      // Capitalize status to match DB ENUM ('Pending','Reviewed','Accepted','Rejected')
      if (key === 'status' &&
        !['Submitted', 'UnderReview', 'Accepted', 'Rejected', 'Withdrawn'].includes(val)) {
        return res.status(400).json({ error: "Invalid application status" });
      }
      updates[key] = val;
    }
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }
  try {
    const ok = await service.updateApplication(req.params.id, updates);
    if (!ok) return res.status(404).json({ error: "Not found" });
    if (updates.status && updates.status !== existing.status) {
      await require("../models/Application").recordStatusHistory(req.params.id, existing.status, updates.status, req.session.userId, updates.rejectionReason);
      await require("../models/AuditLog").record({
        actorUserId: req.session.userId,
        action: "APPLICATION_STATUS_CHANGED",
        entityType: "Application",
        entityId: Number(req.params.id),
        oldValue: { status: existing.status },
        newValue: { status: updates.status },
        reason: updates.rejectionReason
      });
      const student = await CandidateModel.findOne(existing.candidateId);
      if (student) {
        await NotificationModel.create({
          userId: student.userId,
          type: 'APPLICATION_STATUS_CHANGED',
          title: 'Trạng thái hồ sơ đã thay đổi',
          message: `Hồ sơ ứng tuyển "${existing.jobTitle}" chuyển sang trạng thái ${updates.status}.`,
          relatedEntityType: 'Application',
          relatedEntityId: Number(req.params.id)
        });
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Error in application:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const ok = await service.deleteApplication(req.params.id);
    if (!ok) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("Error in application:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
