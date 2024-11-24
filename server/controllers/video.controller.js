const Video = require("../models/video.model");
const catchAsync = require("../utils/catch-async");
const AppError = require("../utils/app-error");
const { deleteAllKeys } = require("../redis/redis");

const { generateUrlToPutObject } = require("../utils/s3-signed-url");

exports.uploadVideo = catchAsync(async (req, res, next) => {
  const { fileName, contentType, title, description } = req.body;

  if (!fileName || !contentType || !title || !description) {
    return next(
      new AppError(
        "Please provide a file name, content type, title & description",
        400
      )
    );
  }

  const signedUrl = await generateUrlToPutObject(
    req.user.id,
    title,
    description,
    fileName,
    contentType
  );

  res.status(200).json({
    status: "success",
    url: signedUrl,
  });
});

exports.getVideo = catchAsync(async (req, res, next) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    return next(new AppError("No video found with that ID!", 404));
  }

  await video.save();

  res.status(200).json({
    status: "success",
    data: {
      video,
    },
  });
});

exports.getVideoStatus = catchAsync(async (req, res, next) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    return next(new AppError("No video found with that ID!", 404));
  }

  res.status(200).json({
    status: "success",
    progress: video.progress,
  });
});

exports.getVideos = catchAsync(async (req, res, next) => {
  const videos = await Video.find({ progress: "completed" }).select(
    "-__v -updatedAt -password"
  );

  res.status(200).json({
    status: "success",
    results: videos.length,
    data: {
      videos,
    },
  });
});

exports.getAllVideosByMe = catchAsync(async (req, res, next) => {
  const videos = await Video.find({ owner: req.user._id });

  res.status(200).json({
    status: "success",
    results: videos.length,
    data: {
      videos,
    },
  });
});

exports.updateViews = catchAsync(async (req, res, next) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    return next(new AppError("No video found with that ID!", 404));
  }

  video.views += 1;
  await video.save();

  res.status(200).json({
    status: "success",
    data: {
      video,
    },
  });
});

exports.resetRedisCache = catchAsync(async (req, res, next) => {
  await deleteAllKeys();

  res.status(200).json({
    status: "success",
    message: "Redis cache cleared!",
  });
});
