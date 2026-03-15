const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  studentID:  { type: String, required: true },
  bookID:     { type: String, required: true },
  issueDate:  { type: Date, required: true },
  dueDate:    { type: Date, required: true },   // issueDate + 14 days
  returnDate: { type: Date, default: null },
  status:     { type: String, enum: ["issued", "returned"], default: "issued" },
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);
