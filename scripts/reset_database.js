require('dotenv').config();
const mongoose = require('mongoose');
const Company = require('../models/Company');
const Job = require('../models/Job');
const User = require('../models/User');

const dbURI = process.env.MONGODB_URI;

mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected');

  try {
    console.log('Dropping collections...');
    await Company.deleteMany({});
    console.log('Companies collection dropped.');
    await Job.deleteMany({});
    console.log('Jobs collection dropped.');
    await User.deleteMany({});
    console.log('Users collection dropped.');
    console.log('Database reset successful.');
  } catch (error) {
    console.error('Error dropping collections:', error);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
})
.catch((err) => console.error('MongoDB connection error:', err)); 