const Book = require("../models/Book");

// GET /api/books
exports.getBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json({ success: true, count: books.length, data: books });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/books/:id
exports.getBook = async (req, res) => {
  try {
    const book = await Book.findOne({ bookID: req.params.id });
    if (!book) return res.status(404).json({ success: false, message: "Book not found." });
    res.json({ success: true, data: book });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/books
exports.addBook = async (req, res) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json({ success: true, data: book });
  } catch (err) {
    const msg = err.code === 11000 ? "Duplicate bookID, ISBN, or rfidTagID." : err.message;
    res.status(400).json({ success: false, message: msg });
  }
};

// PUT /api/books/:id
exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findOneAndUpdate(
      { bookID: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!book) return res.status(404).json({ success: false, message: "Book not found." });
    res.json({ success: true, data: book });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
