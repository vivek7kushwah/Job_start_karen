require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');

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

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/profile.html'));
});

// Now serve static files after the specific routes
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
