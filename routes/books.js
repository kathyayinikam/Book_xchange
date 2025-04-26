const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const Book = require('../models/Book');
const User = require('../models/User');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    cb(null, Date.now() + fileExtension);
  }
});
const upload = multer({ storage });

// Add New Book
router.post('/new', upload.single('image'), async (req, res) => {
  const { name, author, cost, time, userId } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
  const newBook = new Book({ name, author, cost, time, imageUrl, uploadedBy: userId });

  try {
    const savedBook = await newBook.save();
    await User.findByIdAndUpdate(userId, { $push: { uploadedBooks: savedBook._id } });
    res.json(savedBook);
  } catch (error) {
    res.status(500).json({ message: "Error saving book", error: error.message });
  }
});

// Get all purchased books
router.get('/user/:userId/purchased', async (req, res) => {
  try {
    const books = await Book.find({ purchasedBy: req.params.userId }).populate('purchasedBy', 'username');
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: "Error fetching purchased books", error: error.message });
  }
});

// Get book by name
router.get('/name/:name', async (req, res) => {
  try {
    const book = await Book.findOne({ name: req.params.name });
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: "Error fetching book", error: error.message });
  }
});

// Update book by name
router.put('/update/name/:name', upload.single('image'), async (req, res) => {
  try {
    const updateData = req.body;
    if (req.file) updateData.imageUrl = `/uploads/${req.file.filename}`;

    const updatedBook = await Book.findOneAndUpdate({ name: req.params.name }, updateData, { new: true });
    if (!updatedBook) return res.status(404).json({ message: "Book not found" });
    res.json({ message: "Book updated successfully", book: updatedBook });
  } catch (error) {
    res.status(500).json({ message: "Error updating book", error: error.message });
  }
});
router.get('/user/:userId/dashboard', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('uploadedBooks')
      .populate('purchasedBooks');

    if (!user) return res.status(404).json({ message: "User not found" });

    const uploadedBooks = await Promise.all(user.uploadedBooks.map(async (book) => {
      const bookObj = book.toObject();
      bookObj.isPurchased = book.purchasedBy?.toString() === user._id.toString();
      bookObj.isOwner = book.owner?.toString() === user._id.toString();
      return bookObj;
    }));

    const purchasedBooks = await Promise.all(user.purchasedBooks.map(async (book) => {
      const bookObj = book.toObject();
      bookObj.isPurchased = true;
      bookObj.isOwner = book.owner?.toString() === user._id.toString();
      return bookObj;
    }));

    res.json({ uploadedBooks, purchasedBooks });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user dashboard", error: error.message });
  }
});
// Delete book by name
router.delete('/name/:name', async (req, res) => {
  try {
    const deletedBook = await Book.deleteOne({ name: req.params.name });
    if (deletedBook.deletedCount === 0) return res.status(404).json({ message: "Book not found" });
    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting book", error: error.message });
  }
});
router.get('/user/:userId/added', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('uploadedBooks');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.uploadedBooks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching books added by user", error: error.message });
  }
});

// Buy a book
router.post('/buy/:bookId', async (req, res) => {
  const { userId } = req.body;
  try {
    const book = await Book.findById(req.params.bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.purchasedBy.includes(userId)) {
      return res.status(400).json({ message: "Book already purchased" });
    }

    book.purchasedBy.push(userId);
    await book.save();
    await User.findByIdAndUpdate(userId, { $push: { purchasedBooks: book._id } });

    res.json({ message: "Book purchased successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error purchasing book", error: error.message });
  }
});

module.exports = router;
