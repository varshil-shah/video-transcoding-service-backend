const router = require("express").Router();

const authController = require("../controllers/auth.controller");
const videoController = require("../controllers/video.controller");

router.use(authController.protect);

router.post("/upload", videoController.uploadVideo);

router.get("/me", videoController.getAllVideosByMe);
router.get("/", videoController.getVideos);
router.get("/:id", videoController.getVideo);

module.exports = router;
