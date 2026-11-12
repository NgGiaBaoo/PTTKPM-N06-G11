const express = require("express");
const router = express.Router();
const model = require("../models/Notification");

router.get("/", async (req, res) => {
  try {
    res.json(await model.listForUser(req.session.userId));
  } catch (err) {
    console.error("Error loading notifications:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id/read", async (req, res) => {
  try {
    const updated = await model.markRead(req.params.id, req.session.userId);
    if (!updated) return res.status(404).json({ error: "Notification not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("Error marking notification:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/read-all", async (req, res) => {
  try {
    res.json({ updated: await model.markAllRead(req.session.userId) });
  } catch (err) {
    console.error("Error marking notifications:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
