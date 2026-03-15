const router = require("express").Router();
const protect = require("../middleware/auth");
const { issueBook, returnBook, getTransactions } = require("../controllers/transactionController");

router.use(protect);

router.get("/", getTransactions);
router.post("/issue", issueBook);
router.post("/return", returnBook);

module.exports = router;
