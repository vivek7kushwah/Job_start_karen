require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const fs = require('fs');

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    maxAge: 10 * 60 * 1000 // 10 minutes in milliseconds
  }
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
// const homeRoute = require('./routes/home');
// app.use('/', homeRoute);

// Serve the jobs.html file at the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/jobs.html'));
});

const authRoute = require('./routes/auth');
app.use('/auth', authRoute);

// Keep the jobs API route separate
const jobsRoute = require('./routes/jobs');
app.use('/jobs', jobsRoute);

// Add company routes
const companyRoute = require('./routes/company');
app.use('/company', companyRoute);

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/profile.html'));
});

// Serve the contact.html file at the /contact URL
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/contact.html'));
});

// Serve the share.html file at the /share URL
app.get('/share', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/share.html'));
});

// Now serve static files after the specific routes
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Create necessary directories if they don't exist
const uploadDirs = ['public/uploads', 'public/uploads/founders'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
