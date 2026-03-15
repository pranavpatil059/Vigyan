const router = require("express").Router();
const protect = require("../middleware/auth");
const { getStudents, getStudent, addStudent, updateStudent } = require("../controllers/studentController");

router.use(protect);

router.get("/", getStudents);
router.get("/:id", getStudent);
router.post("/", addStudent);
router.put("/:id", updateStudent);

module.exports = router;
