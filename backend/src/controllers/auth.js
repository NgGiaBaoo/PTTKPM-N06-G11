const express = require("express");
const router = express.Router();
const service = require("../services/auth");
const { validateLogin, normalize } = require("../validators/auth");
const { requireAuth } = require("../middleware/auth");
const userService = require("../services/user");
const { validateUser, normalize: normalizeUser } = require("../validators/user");
const AuditLog = require("../models/AuditLog");
const UserModel = require("../models/User");
const emailService = require("../services/email");
const crypto = require("crypto");

const TOKEN_TTL_MINUTES = 30;

function createToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  return {
    rawToken,
    tokenHash: crypto.createHash("sha256").update(rawToken).digest("hex"),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000)
  };
}

function actionUrl(pathname, token) {
  const baseUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.FRONTEND_PORT || 5173}`;
  return `${baseUrl}${pathname}?token=${encodeURIComponent(token)}`;
}

async function sendVerificationEmail(user) {
  const token = createToken();
  await UserModel.invalidateUserTokens("EmailVerificationTokens", user.id);
  await UserModel.createEmailVerificationToken(user.id, token.tokenHash, token.expiresAt);
  const result = await emailService.sendActionEmail({
    to: user.email,
    subject: "Xác minh email tài khoản",
    text: "Vui lòng xác minh email để kích hoạt tài khoản.",
    actionUrl: actionUrl("/verify-email", token.rawToken)
  });
  return process.env.NODE_ENV === "production" ? undefined : result.developmentUrl;
}

async function sendPasswordResetEmail(user) {
  const token = createToken();
  await UserModel.invalidateUserTokens("PasswordResetTokens", user.id);
  await UserModel.createPasswordResetToken(user.id, token.tokenHash, token.expiresAt);
  const result = await emailService.sendActionEmail({
    to: user.email,
    subject: "Khôi phục mật khẩu",
    text: "Vui lòng sử dụng liên kết sau để đặt lại mật khẩu.",
    actionUrl: actionUrl("/reset-password", token.rawToken)
  });
  return process.env.NODE_ENV === "production" ? undefined : result.developmentUrl;
}

// POST /auth/register (public - no auth required)
router.post("/register", async (req, res) => {
  // One browser = one account: reject if already logged in
  if (req.session.userId) {
    return res.status(409).json({ error: "Đã đăng nhập. Vui lòng đăng xuất trước khi đăng ký tài khoản mới." });
  }

  const payload = req.body;
  const valid = validateUser(payload);
  if (!valid.valid) {
    return res.status(400).json({ error: valid.message });
  }
  const user = normalizeUser(payload);
  // Student and Employer accounts are self-registered. SchoolStaff/Admin
  // accounts are provisioned through the admin-only users endpoint.
  if (!['Student', 'Employer'].includes(payload.role)) {
    return res.status(400).json({ error: 'Only Student or Employer can register' });
  }
  if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return res.status(400).json({ error: "A valid email is required" });
  }
   try {
     const created = await userService.createUser(user);
     const verificationUrl = await sendVerificationEmail(created);
     res.status(201).json({
       message: "Registration successful. Check your email to activate the account.",
       data: { ...created, accountStatus: "Pending", emailVerified: false },
       ...(verificationUrl && { verificationUrl })
     });
   } catch (err) {
     if (err.code === "ER_DUP_ENTRY") {
       return res.status(409).json({ error: "Registration failed" });
     }
     console.error("Error in auth:", err);
     res.status(500).json({ error: "Internal server error" });
   }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  // One browser = one account: reject if already logged in
  if (req.session.userId) {
    return res.status(409).json({ error: "Đã đăng nhập. Vui lòng đăng xuất trước khi đăng nhập tài khoản khác." });
  }

  const payload = req.body;
  const valid = validateLogin(payload);

  if (!valid.valid) {
    return res.status(400).json({ error: valid.message });
  }

  const credentials = normalize(payload);

  try {
    const result = await service.login(credentials.username, credentials.password);

    if (!result.success) {
      return res.status(401).json({ error: result.message });
    }

    // Store user info in session
    req.session.userId = result.user.id;
    req.session.username = result.user.username;
    req.session.role = result.user.role;

    res.json({
      message: "Login successful",
      data: { id: result.user.id, username: result.user.username, role: result.user.role }
    });
  } catch (err) {
    console.error("Error in auth:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/verify-email", async (req, res) => {
  const { token } = req.body || {};
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Verification token is required" });
  }
  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const record = await UserModel.findValidEmailVerificationToken(tokenHash);
    if (!record) return res.status(400).json({ error: "Verification token is invalid or expired" });
    await UserModel.markEmailVerified(record.UserID);
    await UserModel.consumeEmailVerificationToken(record.TokenID);
    res.json({ success: true, message: "Email verified. You can now sign in." });
  } catch (err) {
    console.error("Error verifying email:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resend-verification", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email is required" });
  try {
    const user = await UserModel.findUserByEmail(email);
    if (user && !user.EmailVerified) {
      const verificationUrl = await sendVerificationEmail({
        id: user.UserID,
        email: user.Email
      });
      return res.json({
        success: true,
        message: "If the account exists and is not verified, a new verification email was sent.",
        ...(verificationUrl && { verificationUrl })
      });
    }
    res.json({ success: true, message: "If the account exists and is not verified, a new verification email was sent." });
  } catch (err) {
    console.error("Error resending verification:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email is required" });
  try {
    const user = await UserModel.findUserByEmail(email);
    if (!user) {
      return res.json({ success: true, message: "If the account exists, password recovery instructions were sent." });
    }
    const resetUrl = await sendPasswordResetEmail({
      id: user.UserID,
      email: user.Email
    });
    res.json({
      success: true,
      message: "If the account exists, password recovery instructions were sent.",
      ...(resetUrl && { resetUrl })
    });
  } catch (err) {
    console.error("Error requesting password reset:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword || newPassword.length < 8 || newPassword.length > 128) {
    return res.status(400).json({ error: "Token and a new password of 8-128 characters are required" });
  }
  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const record = await UserModel.findValidPasswordResetToken(tokenHash);
    if (!record) return res.status(400).json({ error: "Reset token is invalid or expired" });
    await userService.resetPassword(record.UserID, newPassword);
    await UserModel.markEmailVerified(record.UserID);
    await UserModel.consumePasswordResetToken(record.TokenID);
    await AuditLog.record({
      actorUserId: record.UserID,
      action: "PASSWORD_RESET",
      entityType: "User",
      entityId: record.UserID
    });
    res.json({ success: true, message: "Password reset successfully. You can now sign in." });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /auth/logout
router.post("/logout", requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.clearCookie("connect.sid", {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
    res.json({ message: "Logout successful" });
  });
});

// GET /auth/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await service.getCurrentUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "Current user", data: user });
  } catch (err) {
    console.error("Error in auth:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || newPassword.length < 8 || newPassword.length > 128) {
    return res.status(400).json({ error: "Current password and a new password of 8-128 characters are required" });
  }
  try {
    await userService.changePassword(req.session.userId, currentPassword, newPassword);
    await AuditLog.record({
      actorUserId: req.session.userId,
      action: "PASSWORD_CHANGED",
      entityType: "User",
      entityId: req.session.userId
    });
    res.json({ success: true });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    console.error("Error changing password:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
