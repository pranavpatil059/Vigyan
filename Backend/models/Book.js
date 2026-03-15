const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  bookID:          { type: String, required: true, unique: true },
  title:           { type: String, required: true },
  author:          { type: String, required: true },
  ISBN:            { type: String, required: true, unique: true },
  category:        { type: String, required: true },
  totalCopies:     { type: Number, required: true, min: 0 },
  availableCopies: { type: Number, required: true, min: 0 },
  rfidTagID:       { type: String, required: true, unique: true },
}, { timestamps: true });

module.exports = mongoose.model("Book", bookSchema);
