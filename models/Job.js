const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: false,
        trim: true
    },
    companyName: {
        type: String,
        required: false,
        trim: true
    },
    location: {
        type: String,
        required: false,
        trim: true
    },
    salary: {
        type: String,
        required: false,
        trim: true
    },
    education: {
        type: String,
        required: false,
        trim: true
    },
    description: {
        type: String,
        required: false
    },
    requirements: [{
        type: String,
        required: false
    }],
    companyLogo: {
        type: String,
        default: null
    },
    jobImage: {
        type: String,
        default: null
    },
    postedBy: {
        type: String,
        required: false
    },
    applicants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['Pending', 'In Review', 'Accepted', 'Rejected'],
            default: 'Pending'
        },
        applicationDate: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Job', jobSchema); 