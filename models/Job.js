const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  salary: { type: String, required: true },
  educationalRequirement: { type: String, required: false },
  address: { type: String, required: false },
  timing: { type: String, required: false },
  experience: { type: String, required: false },
  dateOfPost: { type: Date, default: Date.now },
  contactNumber: { type: String, required: false },
  jobImage: { type: String, required: false },
  companyLogo: { type: String, required: false },
});

module.exports = mongoose.model('Job', jobSchema); 