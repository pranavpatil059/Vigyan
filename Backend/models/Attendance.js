const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  studentID: { type: String, required: true },
  date:      { type: String, required: true },   // "YYYY-MM-DD"
  time:      { type: String, required: true },   // "HH:MM:SS"
  status:    { type: String, default: "Present" },
}, { timestamps: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
