const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const router = express.Router();
const Job = require('../models/Job');

router.post('/login', async (req, res) => {
  const { userType, mobile, password } = req.body;
  console.log('Login attempt:', { userType, mobile });
  try {
    const user = await User.findOne({ userType, mobile });
    console.log('User found:', user);
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = { userType, mobile, name: user.name };
      res.status(200).json({ message: 'Login successful', userType, name: user.name });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

router.post('/signup', async (req, res) => {
  const { userType, mobile, password } = req.body;
  const { name } = req.body;
  try {
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const newUser = new User({ userType, mobile, password, name });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out', error: err });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

// Add this new route to check session status
router.get('/check-session', async (req, res) => {
  if (req.session.user) {
    try {
      const user = await User.findOne({ mobile: req.session.user.mobile });
      res.json({
        isLoggedIn: true,
        userType: req.session.user.userType,
        mobile: req.session.user.mobile,
        name: user ? user.name : null
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.json({
        isLoggedIn: true,
        userType: req.session.user.userType,
        mobile: req.session.user.mobile
      });
    }
  } else {
    res.json({
      isLoggedIn: false
    });
  }
});

// New route to fetch user-specific application data
router.get('/applications', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Please login to view applications' });
  }

  const { userType, mobile } = req.session.user;

  try {
    let applications = [];

    if (userType === 'applicant') {
      // For applicants, fetch their user document and populate the applications array
      const userWithApplications = await User.findOne({ mobile: mobile })
        .populate({
          path: 'applications.jobId',
          select: 'title companyName' // Only select job title and company name
        })
        .exec();
      
      if (userWithApplications) {
        applications = userWithApplications.applications;
        console.log('Applicant applications fetched:', JSON.stringify(applications, null, 2));
      } else {
         console.log('Applicant user not found.');
      }
    } else if (userType === 'hr') {
      // For HR, find jobs they have posted and include all applicants
      // Assuming jobs are linked to HR via the 'postedBy' field (mobile number)
      applications = await Job.find({ postedBy: mobile }, 'title companyName applicants')
        .populate('applicants.user', 'name age address mobile') // Populate applicant user details for HR
        .exec();
    } else if (userType === 'admin') {
      // For admin, fetch all jobs and include all applicants
      applications = await Job.find({}, 'title companyName applicants')
        .populate('applicants.user', 'name age address mobile') // Populate applicant user details
        .exec();
    }

    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
});

module.exports = router; 