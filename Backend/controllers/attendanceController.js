const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

// POST /api/attendance/scan
// Body: { rfidTagID }  — called by ESP32
exports.scanRFID = async (req, res) => {
  try {
    const { rfidTagID } = req.body;
    if (!rfidTagID) return res.status(400).json({ success: false, message: "rfidTagID is required." });

    const student = await Student.findOne({ rfidTagID });
    if (!student) return res.status(404).json({ success: false, message: "No student found for this RFID tag." });

    const now = new Date();
    const date = now.toISOString().split("T")[0];                   // "YYYY-MM-DD"
    const time = now.toTimeString().split(" ")[0];                  // "HH:MM:SS"

    // Prevent duplicate scan on the same day
    const existing = await Attendance.findOne({ studentID: student.studentID, date });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Attendance already marked for today.",
        data: existing,
        student: { name: student.name, studentID: student.studentID },
      });
    }

    const record = await Attendance.create({ studentID: student.studentID, date, time, status: "Present" });
    res.status(201).json({
      success: true,
      message: "Attendance marked.",
      data: record,
      student: { name: student.name, studentID: student.studentID },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/attendance
exports.getAttendance = async (req, res) => {
  try {
    const filter = {};
    if (req.query.date) filter.date = req.query.date;
    if (req.query.studentID) filter.studentID = req.query.studentID;

    const records = await Attendance.find(filter).sort({ date: -1, time: -1 });
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
