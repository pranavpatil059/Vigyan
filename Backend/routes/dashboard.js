const router = require("express").Router();
const protect = require("../middleware/auth");
const { getSummary } = require("../controllers/dashboardController");

router.get("/", protect, getSummary);

module.exports = router;
