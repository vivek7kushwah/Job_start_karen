const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  userType: { type: String, required: true, enum: ['admin', 'hr', 'applicant'] },
  mobile: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  name: {
    type: String,
    required: function() { return this.userType === 'applicant' || this.userType === 'hr'; },
    trim: true
  },
  age: {
    type: Number,
    required: false
  },
  address: {
    type: String,
    required: false,
    trim: true
  },
  applications: [{
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'In Review', 'Accepted', 'Rejected'],
      default: 'Pending'
    },
    appliedDate: {
      type: Date,
      default: Date.now
    }
  }],
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model('User', userSchema); 