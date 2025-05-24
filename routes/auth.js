const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const router = express.Router();
const Job = require('../models/Job');
const cloudinary = require('cloudinary').v2; // Import cloudinary
const { CloudinaryStorage } = require('multer-storage-cloudinary'); // Import CloudinaryStorage
const multer = require('multer'); // Import multer

// Configure Cloudinary storage for Multer (similar to company/jobs routes)
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'job_start_karen/profile_photos', // Dedicated folder for profile photos
        format: async (req, file) => 'png',
        public_id: (req, file) => `profile-${req.session.user.mobile}-${Date.now()}`,
    },
});

const upload = multer({ storage: storage });

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
        name: user ? user.name : null,
        profilePhoto: user ? user.profilePhoto : null,
        education: user ? user.education : null,
        experience: user ? user.experience : null,
        address: user ? user.address : null
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

// New route to update user profile
router.put('/profile', upload.single('profilePhoto'), async (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
        return res.status(401).json({ message: 'Please login to update your profile' });
    }

    const { mobile } = req.session.user;
    const { name, address, education, experience } = req.body;

    try {
        const user = await User.findOne({ mobile });

        if (!user) {
            // This case should ideally not happen if check-session works, but good to be safe
            return res.status(404).json({ message: 'User not found' });
        }

        // Update profile fields from request body
        if (name !== undefined) user.name = name;
        if (address !== undefined) user.address = address;
        if (education !== undefined) user.education = education;
        if (experience !== undefined) user.experience = experience;

        // Handle profile photo upload
        if (req.file) {
            // Multer-storage-cloudinary has already uploaded the file
            user.profilePhoto = req.file.path; // Store the Cloudinary URL
        }

        await user.save();

        // Fetch the updated user to return the latest data, including photo URL
        const updatedUser = await User.findOne({ mobile });

        res.json({ message: 'Profile updated successfully', user: updatedUser });

    } catch (error) {
        console.error('Error updating profile:', error);
        // If it's a Multer error, it might have a specific name
        if (error.code === 'LIMIT_FILE_SIZE') {
             return res.status(400).json({ message: 'File size too large' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ message: 'Too many files uploaded' });
        }
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
});

module.exports = router; 