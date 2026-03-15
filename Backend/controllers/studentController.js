const Student = require("../models/Student");

// GET /api/students
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json({ success: true, count: students.length, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/students/:id
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ studentID: req.params.id });
    if (!student) return res.status(404).json({ success: false, message: "Student not found." });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/students
exports.addStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json({ success: true, data: student });
  } catch (err) {
    const msg = err.code === 11000 ? "Duplicate studentID, email, or rfidTagID." : err.message;
    res.status(400).json({ success: false, message: msg });
  }
};

// PUT /api/students/:id
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { studentID: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!student) return res.status(404).json({ success: false, message: "Student not found." });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
