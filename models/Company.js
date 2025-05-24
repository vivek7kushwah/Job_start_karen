const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    logo: {
        type: String,
        default: ''
    },
    founders: [{
        name: {
            type: String,
            required: true
        },
        role: {
            type: String,
            required: true
        },
        bio: String,
        image: String
    }],
    contactInfo: {
        address: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        }
    },
    socialMedia: {
        facebook: String,
        twitter: String,
        linkedin: String,
        instagram: String,
        whatsapp: String
    },
    lastUpdatedBy: {
        type: String,
        required: true
    },
    lastUpdatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Company', companySchema); 