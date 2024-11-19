const router = require("express").Router();

const authController = require("../controllers/auth.controller");
const videoController = require("../controllers/video.controller");
const transcoderController = require("../controllers/transcoder.controller");

router.post("/ecs-trigger", transcoderController.handleECSTrigger);
router.post("/s3-trigger", transcoderController.handleS3Trigger);

router.use(authController.protect);

router.post("/upload", videoController.uploadVideo);
router.get(
  "/reset-redis-cache",
  authController.restrictTo("admin"),
  videoController.resetRedisCache
);

router.get("/me", videoController.getAllVideosByMe);
router.get("/", videoController.getVideos);
router.get("/:id", videoController.getVideo);
router.get("/:id/status", videoController.getVideoStatus);

module.exports = router;
