const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'job_start_karen',
        format: async (req, file) => 'png',
        public_id: (req, file) => `${file.fieldname}-${Date.now()}`,
    },
});

// Use Multer with Cloudinary storage
const upload = multer({ storage: storage });

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
    console.log('Received PUT /company request');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);
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

        let company = await Company.findOne(); // Fetch company first

        // Handle company logo upload
        let logoUrl = company && company.logo ? company.logo : ''; // Keep existing logo URL by default
        if (req.files && req.files.companyLogo && req.files.companyLogo[0]) {
            // Multer-storage-cloudinary has already uploaded the file
            logoUrl = req.files.companyLogo[0].path; // Use the new Cloudinary URL
        }

        // Update founder images if uploaded
        // We need to match uploaded files to founders. Assuming the order matches the form.
        // If a founder already has an image and no new image is uploaded, keep the old one.
        if (req.files && req.files.founderImages && req.files.founderImages.length > 0) {
             req.files.founderImages.forEach((file, index) => {
                if (parsedFounders[index]) {
                    // file.path contains the Cloudinary secure_url
                     parsedFounders[index].image = file.path; 
                }
            });
        }
        
        // Preserve existing founder images if no new one was uploaded for that founder when updating
        if (company && company.founders) {
            company.founders.forEach((existingFounder, index) => {
                 // If the parsed founder exists and doesn't have a new image assigned (because no file was uploaded)
                 // AND the existing founder had an image, keep the existing image.
                 if (parsedFounders[index] && !parsedFounders[index].image && existingFounder.image) {
                    parsedFounders[index].image = existingFounder.image;
                 }
            });
        }

        if (company) {
            // Update existing company info
            Object.assign(company, {
                name,
                description,
                founders: parsedFounders,
                contactInfo: parsedContactInfo,
                socialMedia: parsedSocialMedia,
                lastUpdatedBy: req.session.user.mobile,
                lastUpdatedAt: new Date(),
                logo: logoUrl // Assign the determined logo URL
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
                lastUpdatedBy: req.session.user.mobile,
                logo: logoUrl // Assign the determined logo URL
            });
             // Need to handle the case where a new company is created with founder images
             if (req.files && req.files.founderImages && req.files.founderImages.length > 0) {
                 req.files.founderImages.forEach((file, index) => {
                     if (newCompany.founders[index]) {
                         newCompany.founders[index].image = file.path;
                     }
                 });
             }
            await newCompany.save();
        }

        res.json({ message: 'Company information updated successfully' });
    } catch (error) {
        console.error('Error updating company info:', error);
        res.status(500).json({ message: 'Error updating company information' });
    }
});

module.exports = router; 