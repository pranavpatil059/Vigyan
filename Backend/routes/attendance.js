const router = require("express").Router();
const protect = require("../middleware/auth");
const { scanRFID, getAttendance } = require("../controllers/attendanceController");

// /scan is called by ESP32 — protected so only authorized requests go through
router.post("/scan", protect, scanRFID);
router.get("/", protect, getAttendance);

module.exports = router;
