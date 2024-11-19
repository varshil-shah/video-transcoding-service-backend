const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number,
    },
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
      required: true,
    },
    thumbnailUrl: {
      type: String,
    },
    captionUrl: {
      type: String,
    },
    type: {
      type: String,
      default: "mp4",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    progress: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "queued"],
      default: "pending",
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Video = mongoose.model("Video", videoSchema);

Video.collection.createIndex({ title: "text", description: "text" });

module.exports = Video;
