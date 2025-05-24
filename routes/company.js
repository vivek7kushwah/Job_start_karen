const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const multer = require('multer');
const path = require('path');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Determine the destination based on the field name
        if (file.fieldname === 'companyLogo') {
            cb(null, 'public/uploads/');
        } else {
            cb(null, 'public/uploads/founders/');
        }
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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
router.put('/', checkAdmin, upload.fields([
    { name: 'companyLogo', maxCount: 1 },
    { name: 'founderImages', maxCount: 5 }
]), async (req, res) => {
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

        // Handle company logo upload
        let logoFilename = null;
        if (req.files && req.files.companyLogo && req.files.companyLogo[0]) {
            logoFilename = req.files.companyLogo[0].filename;
        }

        // Update founder images if uploaded
        if (req.files && req.files.founderImages && req.files.founderImages.length > 0) {
            req.files.founderImages.forEach((file, index) => {
                // Ensure the founder object exists at this index before assigning the image
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
            // Update logo if new one was uploaded
            if (logoFilename) {
                company.logo = logoFilename;
            }
            await company.save();
        } else {
            // Create new company info
            const newCompany = new Company({
                name,
                description,
                founders: parsedFounders,
                contactInfo: parsedContactInfo,
                socialMedia: parsedSocialMedia,
                lastUpdatedBy: req.session.user.mobile,
                logo: logoFilename || 'company-logo.png'
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