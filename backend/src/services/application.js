const ApplicationModel = require("../models/Application");

function createApplication(data) {
  return ApplicationModel.createApplication(data);
}

function getAllApplications(options) {
  return ApplicationModel.getAllApplications(options);
}

function getApplicationById(id) {
  return ApplicationModel.getApplicationById(id);
}

function updateApplication(id, data) {
  return ApplicationModel.updateApplication(id, data);
}

function deleteApplication(id) {
  return ApplicationModel.deleteApplication(id);
}

function getApplicationsByJobId(jobId, options) {
  return ApplicationModel.getApplicationsByJobId(jobId, options);
}

function getApplicationsByCandidateId(candidateId, options) {
  return ApplicationModel.getApplicationsByCandidateId(candidateId, options);
}

function getApplicationsByEmployerId(employerId, options) {
  return ApplicationModel.getApplicationsByEmployerId(employerId, options);
}

module.exports = { createApplication, getAllApplications, getApplicationById, updateApplication, deleteApplication, getApplicationsByJobId, getApplicationsByCandidateId, getApplicationsByEmployerId };
