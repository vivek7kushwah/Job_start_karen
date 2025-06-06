const express = require('express');
const Job = require('../models/Job');
const multer = require('multer');
const path = require('path'); // Uncomment this line
const User = require('../models/User');
const cloudinary = require('cloudinary').v2; // Import cloudinary
const { CloudinaryStorage } = require('multer-storage-cloudinary'); // Import CloudinaryStorage

const router = express.Router();

// Configure Cloudinary storage for Multer (similar to company routes)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'job_start_karen/jobs', // Store job-related images in a subfolder
    format: async (req, file) => 'png', // supports promises as well
    public_id: (req, file) => `${file.fieldname}-${Date.now()}`,
  },
});

// Use Multer with Cloudinary storage
const upload = multer({ storage: storage });

// Middleware to check if user is logged in
const checkAuth = (req, res, next) => {
  console.log('checkAuth middleware hit for', req.method, req.path);
  console.log('req.session.user:', req.session.user);
  if (!req.session.user) {
    console.log('User not authenticated. Sending 401.');
    return res.status(401).json({ message: 'Please login first' });
  }
  console.log('User authenticated. Proceeding.');
  next();
};

// GET route to serve the job addition form
router.get('/add', checkAuth, (req, res) => {
  if (req.session.user.userType !== 'admin' && req.session.user.userType !== 'hr') {
    return res.status(403).send('Only admins and HR can add jobs');
  }
  res.sendFile(path.join(__dirname, '../public/jobs/add.html'));
});

router.post('/add', checkAuth, upload.fields([{ name: 'jobImage', maxCount: 1 }, { name: 'companyLogo', maxCount: 1 }]), async (req, res) => {
  const { userType, mobile } = req.session.user;
  if (userType !== 'admin' && userType !== 'hr') {
    return res.status(403).json({ message: 'Only admins and HR can add jobs' });
  }

  const { 
    companyName, 
    salary, 
    educationalRequirement = '', 
    address = '', 
    timing = '', 
    experience = '', 
    contactNumber = '' 
  } = req.body;

  // Validate required fields
  if (!companyName || !salary) {
    return res.status(400).json({ 
      message: 'Company name and salary are required fields' 
    });
  }
  
  // Get Cloudinary URLs from upload result
  const jobImage = req.files?.jobImage ? req.files.jobImage[0].path : null;
  const companyLogo = req.files?.companyLogo ? req.files.companyLogo[0].path : null;

  try {
    const newJob = new Job({ 
      companyName, 
      salary, 
      educationalRequirement, 
      address, 
      timing, 
      experience, 
      contactNumber, 
      jobImage, 
      companyLogo,
      postedBy: mobile // Add the HR's mobile number as postedBy
    });
    await newJob.save();
    res.status(201).json({ message: 'Job added successfully' });
  } catch (error) {
    console.error('Error adding job:', error);
    res.status(500).json({ 
      message: 'Error adding job', 
      error: error.message,
      details: error.errors 
    });
  }
});

// Get all jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Error fetching jobs' });
  }
});

// Get a specific job
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ message: 'Error fetching job' });
  }
});

// Apply for a job
router.post('/:id/apply', checkAuth, async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const applicantMobile = req.session.user.mobile; // Get mobile from session
    const user = await User.findOne({ mobile: applicantMobile }); // Find the user

    if (!user) {
      return res.status(404).json({ message: 'Applicant user not found' });
    }

    // Check if user has already applied for this job (in user's applications array)
    const alreadyAppliedInUser = user.applications.some(app => app.jobId.toString() === jobId);
    
    // Also check if user is already in the job's applicants array (for redundancy/safety)
    const alreadyAppliedInJob = job.applicants.some(app => app.user.toString() === user._id.toString());

    if (alreadyAppliedInUser || alreadyAppliedInJob) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Add application to user's applications array
    user.applications.push({
        jobId: job._id,
        status: 'Pending', // Initial status
        appliedDate: new Date()
    });

    // Add user reference to job's applicants array
    job.applicants.push({
        user: user._id,
        status: 'Pending' // Initial status for the job's record
    });

    // Save both documents
    await user.save();
    await job.save();

    res.json({ message: 'Application submitted successfully!' });
  } catch (error) {
    console.error('Error applying for job:', error);
    // Handle Mongoose validation errors specifically if needed
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ message: 'Error applying for job', error: error.message });
  }
});

module.exports = router; 