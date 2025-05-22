const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const multer = require('multer');
const path = require('path');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/founders/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Middleware to check if user is admin
const checkAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.userType !== 'admin') {
        return res.status(403).json({ message: 'Only admins can perform this action' });
    }
    next();
};

// Get company information
router.get('/', async (req, res) => {
    try {
        const company = await Company.findOne();
        if (!company) {
            return res.status(404).json({ message: 'Company information not found' });
        }
        res.json(company);
    } catch (error) {
        console.error('Error fetching company info:', error);
        res.status(500).json({ message: 'Error fetching company information' });
    }
});

// Update company information (admin only)
router.put('/', checkAdmin, upload.array('founderImages', 5), async (req, res) => {
    try {
        const {
            name,
            description,
            founders,
            contactInfo,
            socialMedia
        } = req.body;

        // Parse JSON strings from form data
        const parsedFounders = JSON.parse(founders);
        const parsedContactInfo = JSON.parse(contactInfo);
        const parsedSocialMedia = JSON.parse(socialMedia);

        // Update founder images if uploaded
        if (req.files && req.files.length > 0) {
            req.files.forEach((file, index) => {
                if (parsedFounders[index]) {
                    parsedFounders[index].image = file.filename;
                }
            });
        }

        const company = await Company.findOne();
        if (company) {
            // Update existing company info
            Object.assign(company, {
                name,
                description,
                founders: parsedFounders,
                contactInfo: parsedContactInfo,
                socialMedia: parsedSocialMedia,
                lastUpdatedBy: req.session.user.mobile,
                lastUpdatedAt: new Date()
            });
            await company.save();
        } else {
            // Create new company info
            const newCompany = new Company({
                name,
                description,
                founders: parsedFounders,
                contactInfo: parsedContactInfo,
                socialMedia: parsedSocialMedia,
                lastUpdatedBy: req.session.user.mobile
            });
            await newCompany.save();
        }

        res.json({ message: 'Company information updated successfully' });
    } catch (error) {
        console.error('Error updating company info:', error);
        res.status(500).json({ message: 'Error updating company information' });
    }
});

module.exports = router; 