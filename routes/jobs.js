const express = require('express');
const Job = require('../models/Job');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middleware to check if user is logged in
const checkAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Please login first' });
  }
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
  const { userType } = req.session.user;
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
  
  const jobImage = req.files?.jobImage ? req.files.jobImage[0].filename : null;
  const companyLogo = req.files?.companyLogo ? req.files.companyLogo[0].filename : null;

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
      companyLogo 
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

module.exports = router; 