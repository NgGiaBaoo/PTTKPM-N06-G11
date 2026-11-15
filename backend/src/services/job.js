const JobModel = require("../models/Job");

async function createJob(job, employerId = job.employerId) {
  if (!employerId) {
    throw new Error("employerId is required to create a job");
  }
  return JobModel.createJob(job, employerId);
}

function getAllJobs(options) {
  return JobModel.getAllJobs(options);
}

function getJobById(id) {
  return JobModel.getJobById(id);
}

async function updateJob(id, job) {
  return JobModel.updateJob(id, job);
}

function deleteJob(id) {
  return JobModel.deleteJob(id);
}

function getJobsByEmployerId(employerId, options) {
  return JobModel.getJobsByEmployerId(employerId, options);
}

module.exports = { createJob, getAllJobs, getJobById, updateJob, deleteJob, getJobsByEmployerId };
