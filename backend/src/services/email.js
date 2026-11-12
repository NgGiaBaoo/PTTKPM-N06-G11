const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
  return transporter;
}

async function sendActionEmail({ to, subject, text, actionUrl }) {
  const mailer = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!mailer || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured");
    }
    console.info(`[EMAIL DEV] ${subject} for ${to}: ${actionUrl}`);
    return { delivered: false, developmentUrl: actionUrl };
  }

  await mailer.sendMail({
    from,
    to,
    subject,
    text: `${text}\n\n${actionUrl}\n\nLiên kết có thời hạn và chỉ sử dụng một lần.`
  });
  return { delivered: true };
}

module.exports = { sendActionEmail };
