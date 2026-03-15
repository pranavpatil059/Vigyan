require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth",         require("./routes/auth"));
app.use("/api/students",     require("./routes/students"));
app.use("/api/books",        require("./routes/books"));
app.use("/api/attendance",   require("./routes/attendance"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/dashboard",    require("./routes/dashboard"));

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found." }));

// Local dev
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
