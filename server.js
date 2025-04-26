const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const app = express();
const bodyParser = require('body-parser');
const User = require('./models/User');
const port = process.env.PORT || 3000;

const bookRoutes = require('./routes/books');
const userRoutes = require('./routes/users');

// Middlewares
app.use(cors());
app.use(express.json());  // This handles JSON parsing, no need for bodyParser.json()
app.use('/uploads', express.static('uploads'));

// MongoDB connection (replace with your Mongo URI)
const mongoURI = 'mongodb+srv://kathyayini21cs037:KUYUcrBJ7T3vUYpO@smvitm.vt0vh.mongodb.net/book_exchange?retryWrites=true&w=majority&appName=SMVITM';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log("MongoDB connection error:", err));

// Sign-up route
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    const savedUser = await newUser.save();
    res.json({ message: 'User created successfully', userId: savedUser._id });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({ message: 'Login successful', userId: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Error during login', error });
  }
});

// Routes
app.use('/book', bookRoutes);
app.use('/user', userRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
