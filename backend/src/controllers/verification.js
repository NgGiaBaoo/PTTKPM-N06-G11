const express = require("express");
const router = express.Router();
const model = require("../models/Verification");
const EmployerModel = require("../models/Employer");
const NotificationModel = require("../models/Notification");
const { requireRole } = require("../middleware/auth");
const AuditLog = require("../models/AuditLog");
const SchoolEmployer = require("../models/SchoolEmployer");

router.post("/", requireRole("Employer"), async (req, res) => {
  try {
    const employer = await EmployerModel.findByUserId(req.session.userId);
    if (!employer) return res.status(404).json({ error: "No employer profile found" });
    if (employer.verificationStatus === "Verified") {
      return res.status(409).json({ error: "Employer is already verified" });
    }
    const result = await model.submit(employer.id);
    res.status(201).json(result);
  } catch (err) {
    if (err.code === "ALREADY_PENDING") {
      return res.status(409).json({ error: "A verification request is already pending" });
    }
    console.error("Error submitting verification:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/mine", requireRole("Employer"), async (req, res) => {
  try {
    const employer = await EmployerModel.findByUserId(req.session.userId);
    if (!employer) return res.status(404).json({ error: "No employer profile found" });
    res.json(await model.getForEmployer(employer.id));
  } catch (err) {
    console.error("Error loading verification:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", requireRole("SchoolStaff", "Admin"), async (req, res) => {
  try {
    res.json(await model.listPending());
  } catch (err) {
    console.error("Error loading verification requests:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/review", requireRole("SchoolStaff"), async (req, res) => {
  const { status, reason } = req.body || {};
  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ error: "status must be Approved or Rejected" });
  }
  try {
    const result = await model.review(req.params.id, req.session.userId, status, reason);
    await AuditLog.record({
      actorUserId: req.session.userId,
      action: `EMPLOYER_VERIFICATION_${status.toUpperCase()}`,
      entityType: "VerificationRequest",
      entityId: Number(req.params.id),
      newValue: { status },
      reason
    });
    const employer = await EmployerModel.getEmployerById(result.employerId);
    if (status === "Approved" && req.session.role === "SchoolStaff") {
      const [rows] = await new Promise((resolve, reject) => {
        require("../config/database").query(
          "SELECT SchoolID FROM SchoolStaffProfiles WHERE UserID = ? LIMIT 1",
          [req.session.userId],
          (err, data) => err ? reject(err) : resolve([data])
        );
      });
      if (rows[0]?.SchoolID) {
        await SchoolEmployer.link(rows[0].SchoolID, result.employerId, req.session.userId);
      }
    }
    if (employer) {
      await NotificationModel.create({
        userId: employer.userId,
        type: 'EMPLOYER_VERIFICATION',
        title: status === 'Approved' ? 'Hồ sơ doanh nghiệp đã được xác minh' : 'Hồ sơ doanh nghiệp bị từ chối',
        message: reason || `Trạng thái xác minh: ${status}.`,
        relatedEntityType: 'Employer',
        relatedEntityId: result.employerId
      });
    }
    res.json(result);
  } catch (err) {
    if (err.code === "NOT_PENDING") return res.status(409).json({ error: "Request has already been processed" });
    console.error("Error reviewing verification:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/employers/:id/revoke", requireRole("SchoolStaff"), async (req, res) => {
  try {
    const updated = await model.revoke(req.params.id, req.session.userId, req.body?.reason);
    if (!updated) return res.status(404).json({ error: "Verified employer not found" });
    if (req.session.role === "SchoolStaff") {
      await SchoolEmployer.revoke(req.params.id, req.session.userId);
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Error revoking verification:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
