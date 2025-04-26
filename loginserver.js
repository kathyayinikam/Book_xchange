// Example Node.js API for user login and sign-up

const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // User model

app.use(cors());
app.use(bodyParser.json());

// MongoDB connection (replace with your Mongo URI)
mongoose.connect('mongodb+srv://kathyayini21cs037:KUYUcrBJ7T3vUYpO@smvitm.vt0vh.mongodb.net/book_exchange?retryWrites=true&w=majority&appName=SMVITM');

const port = 3000;

// Sign-up route
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    name,
    email,
    password: hashedPassword
  });

  try {
    const savedUser = await newUser.save();
    res.json({ message: 'User created successfully', userId: savedUser._id });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  res.json({ message: 'Login successful', userId: user._id });
});

// Start the server
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
