export let Priority = /*#__PURE__*/ (function (Priority) {
  Priority["HIGH"] = "HIGH";
  Priority["LOW"] = "LOW";
  return Priority;
})({});

export let JobStatus = /*#__PURE__*/ (function (JobStatus) {
  JobStatus["UPLOADING"] = "UPLOADING";
  JobStatus["UPLOADED"] = "UPLOADED";
  JobStatus["QUEUED"] = "QUEUED";
  JobStatus["WAITING"] = "WAITING";
  JobStatus["PROCESSING"] = "PROCESSING";
  JobStatus["COMPLETED"] = "COMPLETED";
  JobStatus["FAILED"] = "FAILED";
  return JobStatus;
})({});
