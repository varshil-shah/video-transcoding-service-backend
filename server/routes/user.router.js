const router = require("express").Router();
const authController = require("../controllers/auth.controller");
const userController = require("../controllers/user.controller");

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.use(authController.protect);

router.get("/me", userController.getCurrentUser);
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUser);

module.exports = router;
