const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  studentID:  { type: String, required: true, unique: true },
  name:       { type: String, required: true },
  department: { type: String, required: true },
  year:       { type: Number, required: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  rfidTagID:  { type: String, required: true, unique: true },
}, { timestamps: true });

module.exports = mongoose.model("Student", studentSchema);
