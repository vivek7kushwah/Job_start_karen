const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const router = express.Router();

router.post('/login', async (req, res) => {
  const { userType, mobile, password } = req.body;
  console.log('Login attempt:', { userType, mobile });
  try {
    const user = await User.findOne({ userType, mobile });
    console.log('User found:', user);
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = { userType, mobile };
      res.status(200).json({ message: 'Login successful', userType });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

router.post('/signup', async (req, res) => {
  const { userType, mobile, password } = req.body;
  try {
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const newUser = new User({ userType, mobile, password });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out', error: err });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

module.exports = router; 