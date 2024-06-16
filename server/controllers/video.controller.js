const Video = require("../models/video.model");
const catchAsync = require("../utils/catch-async");
const AppError = require("../utils/app-error");

const { generateUrlToPutObject } = require("../utils/s3-signed-url");
const { VIDEO_PROCESS_STATES } = require("../constants");

exports.uploadVideo = catchAsync(async (req, res, next) => {
  const { fileName, contentType } = req.body;

  const signedUrl = await generateUrlToPutObject(
    req.user.id,
    fileName,
    contentType
  );

  const video = await Video.create({
    owner: req.user.id,
    fileName,
    status: VIDEO_PROCESS_STATES.PENDING,
  });

  res.status(200).json({
    status: "success",
    url: signedUrl,
    data: {
      video,
    },
  });
});

exports.getVideo = catchAsync(async (req, res, next) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    return next(new AppError("No video found with that ID!", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      video,
    },
  });
});

exports.getVideos = catchAsync(async (req, res, next) => {
  const videos = await Video.find();

  res.status(200).json({
    status: "success",
    results: videos.length,
    data: {
      videos,
    },
  });
});

exports.getAllVideosByMe = catchAsync(async (req, res, next) => {
  const videos = await Video.find({ user: req.user._id });

  res.status(200).json({
    status: "success",
    results: videos.length,
    data: {
      videos,
    },
  });
});
