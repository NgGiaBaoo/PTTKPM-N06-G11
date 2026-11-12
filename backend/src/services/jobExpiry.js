const JobModel = require("../models/Job");
const NotificationModel = require("../models/Notification");
const AuditLog = require("../models/AuditLog");

async function expireJobs() {
  const jobs = await JobModel.expirePublishedJobs();
  for (const job of jobs) {
    await NotificationModel.create({
      userId: job.UserID,
      type: "JOB_EXPIRED",
      title: "Tin tuyển dụng đã hết hạn",
      message: `Tin "${job.JobTitle}" đã được chuyển sang trạng thái hết hạn.`,
      relatedEntityType: "Job",
      relatedEntityId: job.JobID
    });
    await AuditLog.record({
      actorUserId: job.UserID,
      action: "JOB_EXPIRED",
      entityType: "Job",
      entityId: job.JobID,
      newValue: { status: "Expired" },
      reason: "Deadline passed"
    });
  }
  return jobs.length;
}

function startJobExpiryScheduler(intervalMs = Number(process.env.JOB_EXPIRY_INTERVAL_MS || 15 * 60 * 1000)) {
  const run = () => expireJobs().catch((err) => console.error("Job expiry scheduler failed:", err));
  run();
  return setInterval(run, intervalMs);
}

module.exports = { expireJobs, startJobExpiryScheduler };
