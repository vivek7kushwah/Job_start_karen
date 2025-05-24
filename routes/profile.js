const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isAuthenticated } = require('../middleware/auth');

// Get user profile data
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('applications.jobId', 'title companyName');
            
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Error fetching profile data' });
    }
});

// Update user profile
router.put('/', isAuthenticated, async (req, res) => {
    try {
        const {
            fullName,
            email,
            mobile,
            address,
            education,
            experience,
            skills
        } = req.body;

        // Validate required fields
        if (!fullName || !email || !mobile) {
            return res.status(400).json({ message: 'Name, email, and mobile are required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Validate mobile format (assuming 10 digits)
        const mobileRegex = /^\d{10}$/;
        if (!mobileRegex.test(mobile)) {
            return res.status(400).json({ message: 'Mobile number must be 10 digits' });
        }

        // Check if email is already taken by another user
        const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already taken' });
        }

        // Check if mobile is already taken by another user
        const existingMobile = await User.findOne({ mobile, _id: { $ne: req.user._id } });
        if (existingMobile) {
            return res.status(400).json({ message: 'Mobile number is already taken' });
        }

        // Update user profile
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                name: fullName,
                email,
                mobile,
                address,
                education,
                experience,
                skills
            },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

module.exports = router; 