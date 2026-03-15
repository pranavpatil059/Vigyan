const router = require("express").Router();
const protect = require("../middleware/auth");
const { getBooks, getBook, addBook, updateBook } = require("../controllers/bookController");

router.use(protect);

router.get("/", getBooks);
router.get("/:id", getBook);
router.post("/", addBook);
router.put("/:id", updateBook);

module.exports = router;
