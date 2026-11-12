const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/auth");
const Report = require("../models/ContentReport");
const Job = require("../models/Job");
const Employer = require("../models/Employer");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");

router.post("/", async (req, res) => {
  const { entityType, entityId, reason } = req.body || {};
  if (entityType !== "Job" || !Number.isInteger(Number(entityId)) || !reason?.trim()) {
    return res.status(400).json({ error: "A valid Job, entityId, and reason are required" });
  }
  try {
    const job = await Job.getJobById(entityId);
    if (!job) return res.status(404).json({ error: "Content not found" });
    const report = await Report.create({
      reporterUserId: req.session.userId,
      entityType,
      entityId: Number(entityId),
      reason: reason.trim()
    });
    res.status(201).json({ data: report });
  } catch (err) {
    console.error("Error creating content report:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", requireRole("Admin"), async (req, res) => {
  try {
    res.json({ data: await Report.list(req.query.status) });
  } catch (err) {
    console.error("Error listing content reports:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/review", requireRole("Admin"), async (req, res) => {
  const { status, resolution } = req.body || {};
  if (!["Dismissed", "Actioned"].includes(status)) {
    return res.status(400).json({ error: "status must be Dismissed or Actioned" });
  }
  try {
    const report = await Report.getById(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });
    if (report.Status !== "Pending") return res.status(409).json({ error: "Report has already been reviewed" });
    if (status === "Actioned" && report.EntityType === "Job") {
      const job = await Job.getJobById(report.EntityID);
      if (job) {
        await Job.updateJob(report.EntityID, { status: "Suspended" });
        const employer = await Employer.getEmployerById(job.employerId);
        if (employer) {
          await Notification.create({
            userId: employer.userId,
            type: "CONTENT_MODERATED",
            title: "Tin tuyển dụng đã bị tạm ngưng",
            message: resolution || "Tin tuyển dụng bị tạm ngưng do vi phạm quy định.",
            relatedEntityType: "Job",
            relatedEntityId: job.id
          });
        }
      }
    }
    await Report.review(req.params.id, req.session.userId, status, resolution);
    await AuditLog.record({
      actorUserId: req.session.userId,
      action: "CONTENT_REPORT_REVIEWED",
      entityType: report.EntityType,
      entityId: report.EntityID,
      newValue: { status, resolution }
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Error reviewing content report:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
