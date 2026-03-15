const Transaction = require("../models/Transaction");
const Book = require("../models/Book");
const Student = require("../models/Student");

// POST /api/transactions/issue
// Body: { studentID, bookID }  or  { rfidTagID (student), bookRfidTagID }
exports.issueBook = async (req, res) => {
  try {
    const { studentID, bookID } = req.body;
    if (!studentID || !bookID)
      return res.status(400).json({ success: false, message: "studentID and bookID are required." });

    const student = await Student.findOne({ studentID });
    if (!student) return res.status(404).json({ success: false, message: "Student not found." });

    const book = await Book.findOne({ bookID });
    if (!book) return res.status(404).json({ success: false, message: "Book not found." });

    if (book.availableCopies < 1)
      return res.status(400).json({ success: false, message: "No copies available." });

    // Check if student already has this book issued
    const alreadyIssued = await Transaction.findOne({ studentID, bookID, status: "issued" });
    if (alreadyIssued)
      return res.status(400).json({ success: false, message: "Student already has this book issued." });

    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 14);   // 14-day loan period

    const transaction = await Transaction.create({ studentID, bookID, issueDate, dueDate });

    book.availableCopies -= 1;
    await book.save();

    res.status(201).json({ success: true, message: "Book issued.", data: transaction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/transactions/return
// Body: { studentID, bookID }
exports.returnBook = async (req, res) => {
  try {
    const { studentID, bookID } = req.body;
    if (!studentID || !bookID)
      return res.status(400).json({ success: false, message: "studentID and bookID are required." });

    const transaction = await Transaction.findOne({ studentID, bookID, status: "issued" });
    if (!transaction)
      return res.status(404).json({ success: false, message: "No active issued transaction found." });

    transaction.returnDate = new Date();
    transaction.status = "returned";
    await transaction.save();

    await Book.findOneAndUpdate({ bookID }, { $inc: { availableCopies: 1 } });

    res.json({ success: true, message: "Book returned.", data: transaction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/transactions
exports.getTransactions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.studentID) filter.studentID = req.query.studentID;
    if (req.query.status) filter.status = req.query.status;

    const transactions = await Transaction.find(filter).sort({ issueDate: -1 });
    res.json({ success: true, count: transactions.length, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
