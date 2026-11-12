const express = require("express");
const router = express.Router();
const service = require("../services/user");
const { validateUser, normalize } = require("../validators/user");
const UserModel = require("../models/User");
const AuditLog = require("../models/AuditLog");

router.post("/", async (req, res) => {
  const payload = req.body || {};
  const valid = validateUser(payload);

  if (!valid.valid) {
    return res.status(400).json({ error: valid.message });
  }

  const user = { ...normalize(payload), createdBy: req.session.userId };

  try {
    const created = await service.createUser(user);
    res.status(201).json({ message: "User created successfully", data: created });
  } catch (err) {
    console.error("Error in user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const users = await service.getAllUsers();
    res.status(200).json({ message: "All users", data: users });
  } catch (err) {
    console.error("Error in user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await service.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: `User with id ${req.params.id} not found` });
    }
    res.status(200).json({ message: "User found", data: user });
  } catch (err) {
    console.error("Error in user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  const payload = req.body || {};

  // Apply validation and normalization
  const valid = validateUser(payload);
  if (!valid.valid) {
    return res.status(400).json({ error: valid.message });
  }
  const user = normalize(payload);

    try {
      const updated = await service.updateUser(req.params.id, user);
      if (!updated) {
        return res.status(404).json({ error: `User with id ${req.params.id} not found` });
      }
      res.status(200).json({ message: "User updated successfully", data: updated });
    } catch (err) {
      console.error("Error in user:", err);
      res.status(500).json({ error: "Internal server error" });
    }
});

router.delete("/:id", async (req, res) => {
  if (Number(req.params.id) === req.session.userId) {
    return res.status(400).json({ error: "You cannot delete your own account" });
  }
  try {
    const deleted = await service.deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: `User with id ${req.params.id} not found` });
    }
    await AuditLog.record({
      actorUserId: req.session.userId,
      action: "USER_DELETED",
      entityType: "User",
      entityId: Number(req.params.id)
    });
    res.status(200).json({ message: `User with id ${req.params.id} deleted successfully` });
  } catch (err) {
    console.error("Error in user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/status", async (req, res) => {
  const { status, reason } = req.body || {};
  if (!["Active", "Locked", "Disabled"].includes(status)) {
    return res.status(400).json({ error: "status must be Active, Locked, or Disabled" });
  }
  if (Number(req.params.id) === req.session.userId) {
    return res.status(400).json({ error: "You cannot change your own account status" });
  }
  try {
    const user = await UserModel.getUserRecordById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const updated = await UserModel.updateAccountStatus(req.params.id, status);
    await AuditLog.record({
      actorUserId: req.session.userId,
      action: "USER_STATUS_CHANGED",
      entityType: "User",
      entityId: Number(req.params.id),
      oldValue: { status: user.AccountStatus },
      newValue: { status },
      reason
    });
    res.json({ success: updated, status });
  } catch (err) {
    console.error("Error changing user status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
