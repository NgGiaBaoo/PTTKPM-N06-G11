const express = require("express");
const router = express.Router();
const AuditLog = require("../models/AuditLog");
const { requireRole } = require("../middleware/auth");

router.get("/", requireRole("Admin"), async (req, res) => {
  try {
    res.json(await AuditLog.list(req.query.limit));
  } catch (err) {
    console.error("Error loading audit logs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
