const Student = require("../models/Student");
const Book = require("../models/Book");
const Attendance = require("../models/Attendance");
const Transaction = require("../models/Transaction");

// GET /api/dashboard
exports.getSummary = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const [
      totalStudents,
      totalBooks,
      booksIssued,
      booksReturned,
      todayAttendance,
      totalAttendance,
    ] = await Promise.all([
      Student.countDocuments(),
      Book.countDocuments(),
      Transaction.countDocuments({ status: "issued" }),
      Transaction.countDocuments({ status: "returned" }),
      Attendance.countDocuments({ date: today }),
      Attendance.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        totalBooks,
        booksCurrentlyIssued: booksIssued,
        booksReturned,
        todayAttendance,
        totalAttendanceRecords: totalAttendance,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
