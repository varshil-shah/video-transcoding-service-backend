const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      trim: true,
    },
    videoResolutions: {
      "360p": String,
      "480p": String,
      "720p": String,
      "1080p": String,
      playlist: String,
    },
    objectKey: {
      type: String,
    },
    thumbnailUrl: {
      type: String,
    },
    type: {
      type: String,
      default: "mp4",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    progress: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "queued"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Video = mongoose.model("Video", videoSchema);

module.exports = Video;
